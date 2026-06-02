import json
import os
import hashlib
import urllib.request
import urllib.error
import base64

import boto3


def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }


def _json(status, payload):
    return {
        'statusCode': status,
        'headers': {**_cors(), 'Content-Type': 'application/json'},
        'body': json.dumps(payload, ensure_ascii=False),
    }


PROMPT = (
    'Professional e-commerce product photo of this exact furniture item. '
    'Reconstruct and complete the object if it is cropped or partially visible — '
    'show the entire piece fully, with correct proportions and realistic materials. '
    'Place it centered on a clean soft neutral light-beige studio background, '
    'with soft cinematic studio lighting, gentle reflections and a soft contact shadow on the floor. '
    'Keep the original colors, texture and design faithful. Photorealistic, high detail, catalog quality.'
)


def _s3():
    return boto3.client(
        's3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def _extract_image_url(out):
    '''Достаёт ссылку на результат из разных форматов ответа polza.ai Media API.'''
    if not isinstance(out, dict):
        return None
    # частые варианты
    for k in ('output', 'result', 'data', 'images'):
        v = out.get(k)
        if isinstance(v, str) and v.startswith('http'):
            return v
        if isinstance(v, list) and v:
            first = v[0]
            if isinstance(first, str) and first.startswith('http'):
                return first
            if isinstance(first, dict):
                for kk in ('url', 'image_url', 'image'):
                    if isinstance(first.get(kk), str) and first[kk].startswith('http'):
                        return first[kk]
        if isinstance(v, dict):
            for kk in ('url', 'image_url', 'image'):
                if isinstance(v.get(kk), str) and v[kk].startswith('http'):
                    return v[kk]
    for kk in ('url', 'image_url', 'image'):
        if isinstance(out.get(kk), str) and out[kk].startswith('http'):
            return out[kk]
    return None


def _generate(image_url, key, err_key, api_key):
    '''Рисует студийный кадр через polza.ai Media API (image-to-image),
    скачивает результат и кладёт в S3. Синхронно (нужен увеличенный таймаут).'''
    s3 = _s3()
    try:
        payload = json.dumps({
            'model': 'bytedance/seedream-4.0',
            'prompt': PROMPT,
            'image_urls': [image_url],
            'image_size': {'width': 1024, 'height': 1024},
            'n': 1,
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.polza.ai/api/v1/images/generations',
            data=payload,
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=240) as r:
            out = json.loads(r.read().decode('utf-8'))

        # результат может быть ссылкой или base64
        gen_url = _extract_image_url(out)
        if gen_url:
            with urllib.request.urlopen(gen_url, timeout=60) as r:
                img_bytes = r.read()
        else:
            b64 = None
            for k in ('b64_json', 'image_base64', 'b64'):
                if isinstance(out.get(k), str):
                    b64 = out[k]; break
            if not b64:
                raise RuntimeError('Неожиданный ответ: ' + json.dumps(out)[:200])
            img_bytes = base64.b64decode(b64)

        s3.put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/png')
        return True, None
    except urllib.error.HTTPError as e:
        detail = e.read().decode('utf-8')[:400]
        s3.put_object(Bucket='files', Key=err_key, Body=detail.encode('utf-8'), ContentType='text/plain')
        return False, detail
    except Exception as e:
        s3.put_object(Bucket='files', Key=err_key, Body=str(e)[:400].encode('utf-8'), ContentType='text/plain')
        return False, str(e)[:400]


def handler(event, context):
    '''
    ИИ-художник студийного кадра: дорисовывает предмет до целого, ставит на
    чистый студийный фон со светом и мягкой тенью (OpenAI gpt-image-1).
    POST {action:"status", imageUrl} -> {status: ready|none|error, url?}
    POST {imageUrl} (или action:"start") -> запускает генерацию, возвращает url когда готово.
    Args: event с httpMethod, body
          context - объект с request_id
    Returns: HTTP-ответ JSON
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'body': ''}
    if method != 'POST':
        return _json(405, {'error': 'Method not allowed'})

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    image_url = str(body.get('imageUrl', '')).strip()
    if not image_url.startswith('http'):
        return _json(400, {'error': 'imageUrl обязателен'})

    action = body.get('action', 'start')
    access_key = os.environ['AWS_ACCESS_KEY_ID']
    digest = hashlib.md5(('studio:v3:' + image_url).encode('utf-8')).hexdigest()
    key = f'studio/{digest}.png'
    err_key = f'studio/{digest}.err'
    cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{key}'

    s3 = _s3()

    # уже готово?
    try:
        s3.head_object(Bucket='files', Key=key)
        return _json(200, {'status': 'ready', 'url': cdn_url})
    except Exception:
        pass

    if action == 'status':
        try:
            obj = s3.get_object(Bucket='files', Key=err_key)
            return _json(200, {'status': 'error', 'detail': obj['Body'].read().decode('utf-8')[:300]})
        except Exception:
            return _json(200, {'status': 'pending'})

    # action == start: синхронная генерация (функция с увеличенным таймаутом)
    api_key = os.environ.get('POLZA_AI_API_KEY')
    if not api_key:
        return _json(500, {'error': 'POLZA_AI_API_KEY не настроен'})
    # сбрасываем прошлую ошибку
    try:
        s3.delete_object(Bucket='files', Key=err_key)
    except Exception:
        pass

    ok, detail = _generate(image_url, key, err_key, api_key)
    if ok:
        return _json(200, {'status': 'ready', 'url': cdn_url})
    return _json(502, {'status': 'error', 'detail': detail})