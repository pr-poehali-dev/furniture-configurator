import json
import os
import hashlib
import urllib.request
import urllib.error
import base64

import boto3
import psycopg2


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
    'Turn this into a professional e-commerce product photo of this exact furniture item. '
    'If the item is cropped or only partially visible, reconstruct and complete the whole piece '
    'with correct proportions and faithful materials. '
    'Center it on a clean soft light-beige studio background with soft cinematic studio lighting, '
    'gentle reflections and a soft contact shadow on the floor. '
    'Keep the original colors, texture and design. Photorealistic, high detail, catalog quality.'
)

IMAGE_MODEL = 'google/gemini-2.5-flash-image'


def _s3():
    return boto3.client(
        's3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def _schema():
    return os.environ['MAIN_DB_SCHEMA']


def _get_saved(src_url):
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT studio_url FROM {_schema()}.studio_shots WHERE src_url = %s",
            (src_url,),
        )
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def _save(src_url, studio_url):
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {_schema()}.studio_shots (src_url, studio_url) VALUES (%s, %s) "
            f"ON CONFLICT (src_url) DO UPDATE SET studio_url = EXCLUDED.studio_url, created_at = now()",
            (src_url, studio_url),
        )
        conn.commit()
    finally:
        conn.close()


def _find_image_in_message(msg):
    '''Достаёт картинку из ответа image-модели (разные форматы polza/OpenRouter).'''
    if not isinstance(msg, dict):
        return None
    # формат OpenRouter: message.images[].image_url.url (data:...;base64 или http)
    for img in (msg.get('images') or []):
        iu = img.get('image_url') if isinstance(img, dict) else None
        url = iu.get('url') if isinstance(iu, dict) else (img if isinstance(img, str) else None)
        if isinstance(url, str) and (url.startswith('http') or url.startswith('data:')):
            return url
    # иногда картинка лежит прямо в content как массив частей
    content = msg.get('content')
    if isinstance(content, list):
        for part in content:
            if isinstance(part, dict):
                iu = part.get('image_url')
                if isinstance(iu, dict) and isinstance(iu.get('url'), str):
                    return iu['url']
                if isinstance(part.get('url'), str) and part['url'].startswith(('http', 'data:')):
                    return part['url']
    # либо текст с data:image
    if isinstance(content, str) and 'data:image' in content:
        start = content.find('data:image')
        return content[start:].split()[0].strip('"\')')
    return None


def _generate_image(image_url, api_key):
    '''ИИ-художник: студийный кадр через polza.ai (gemini-2.5-flash-image).
    Возвращает (data_or_http_url, None) или (None, detail).'''
    payload = json.dumps({
        'model': IMAGE_MODEL,
        'modalities': ['image', 'text'],
        'messages': [
            {
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': PROMPT},
                    {'type': 'image_url', 'image_url': {'url': image_url}},
                ],
            },
        ],
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.polza.ai/api/v1/chat/completions',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            out = json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return None, e.read().decode('utf-8')[:400]
    except Exception as e:
        return None, str(e)[:400]

    choices = out.get('choices') or []
    if choices:
        url = _find_image_in_message(choices[0].get('message'))
        if url:
            return url, None
    return None, 'Картинка не получена: ' + json.dumps(out)[:250]


def handler(event, context):
    '''
    ИИ-художник студийного кадра (fal.ai): дорисовывает предмет до целого и
    ставит на студийный фон со светом и тенью. Результат сохраняется в БД и S3
    ОДИН раз на исходное фото — далее отдаётся готовая ссылка мгновенно.
    POST {action:"status", imageUrl} -> {status: ready|none, url?}
    POST {action:"start", imageUrl}  -> генерирует и фиксирует кадр.
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

    # уже зафиксировано в БД?
    try:
        saved = _get_saved(image_url)
    except Exception as e:
        return _json(500, {'error': 'DB error', 'detail': str(e)[:300]})
    if saved:
        return _json(200, {'status': 'ready', 'url': saved})

    if action == 'status':
        return _json(200, {'status': 'none'})

    # action == start: разовая генерация
    api_key = os.environ.get('POLZA_AI_API_KEY')
    if not api_key:
        return _json(500, {'error': 'POLZA_AI_API_KEY не настроен'})

    gen_url, detail = _generate_image(image_url, api_key)
    if not gen_url:
        return _json(502, {'status': 'error', 'detail': detail})

    # результат: data:base64 или http — в любом случае кладём в наш S3 навечно
    access_key = os.environ['AWS_ACCESS_KEY_ID']
    digest = hashlib.md5(('studio:gem:' + image_url).encode('utf-8')).hexdigest()
    key = f'studio/{digest}.png'
    cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{key}'
    try:
        if gen_url.startswith('data:'):
            b64 = gen_url.split(',', 1)[1]
            img_bytes = base64.b64decode(b64)
        else:
            with urllib.request.urlopen(gen_url, timeout=60) as r:
                img_bytes = r.read()
        _s3().put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/png')
        final_url = cdn_url
    except Exception as e:
        return _json(502, {'status': 'error', 'detail': 'Сохранение не удалось: ' + str(e)[:200]})

    _save(image_url, final_url)
    return _json(200, {'status': 'ready', 'url': final_url})