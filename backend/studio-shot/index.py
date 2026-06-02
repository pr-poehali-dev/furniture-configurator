import json
import os
import hashlib
import urllib.request
import urllib.error

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

FAL_MODEL = 'fal-ai/flux-pro/kontext'


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


def _fal_generate(image_url, fal_key):
    '''ИИ-художник через fal.ai FLUX Kontext (image-to-image).
    Возвращает (url, None) или (None, detail).'''
    payload = json.dumps({
        'prompt': PROMPT,
        'image_url': image_url,
        'aspect_ratio': '1:1',
        'output_format': 'png',
        'num_images': 1,
        'safety_tolerance': '5',
    }).encode('utf-8')

    req = urllib.request.Request(
        f'https://fal.run/{FAL_MODEL}',
        data=payload,
        headers={'Authorization': f'Key {fal_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            out = json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return None, e.read().decode('utf-8')[:400]
    except Exception as e:
        return None, str(e)[:400]

    images = out.get('images') or []
    if images and isinstance(images[0], dict) and images[0].get('url'):
        return images[0]['url'], None
    return None, 'Неожиданный ответ fal.ai: ' + json.dumps(out)[:200]


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
    fal_key = os.environ.get('FAL_API_KEY')
    if not fal_key:
        return _json(500, {'error': 'FAL_API_KEY не настроен'})

    gen_url, detail = _fal_generate(image_url, fal_key)
    if not gen_url:
        return _json(502, {'status': 'error', 'detail': detail})

    # перекладываем результат в наш S3, чтобы ссылка была вечной
    access_key = os.environ['AWS_ACCESS_KEY_ID']
    digest = hashlib.md5(('studio:fal:' + image_url).encode('utf-8')).hexdigest()
    key = f'studio/{digest}.png'
    cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{key}'
    try:
        with urllib.request.urlopen(gen_url, timeout=60) as r:
            img_bytes = r.read()
        _s3().put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/png')
        final_url = cdn_url
    except Exception:
        final_url = gen_url  # на крайний случай — прямая ссылка fal

    _save(image_url, final_url)
    return _json(200, {'status': 'ready', 'url': final_url})