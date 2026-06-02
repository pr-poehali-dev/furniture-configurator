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


def _get_row(src_url):
    '''Возвращает (status, studio_url, detail) или None.'''
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT status, studio_url, detail FROM {_schema()}.studio_shots WHERE src_url = %s",
            (src_url,),
        )
        return cur.fetchone()
    finally:
        conn.close()


def _set_row(src_url, status, studio_url='', detail=None):
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {_schema()}.studio_shots (src_url, studio_url, status, detail) "
            f"VALUES (%s, %s, %s, %s) "
            f"ON CONFLICT (src_url) DO UPDATE SET studio_url = EXCLUDED.studio_url, "
            f"status = EXCLUDED.status, detail = EXCLUDED.detail, created_at = now()",
            (src_url, studio_url, status, detail),
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


def _extract_media_url(out):
    '''Достаёт ссылку/base64 картинки из ответа media-эндпоинта polza.'''
    if not isinstance(out, dict):
        return None
    data = out.get('data')
    if isinstance(data, list) and data:
        d0 = data[0]
        if isinstance(d0, dict):
            for k in ('url', 'b64_json', 'image_url'):
                v = d0.get(k)
                if isinstance(v, str) and v:
                    return ('data:image/png;base64,' + v) if k == 'b64_json' else v
        if isinstance(d0, str) and d0.startswith(('http', 'data:')):
            return d0
    for k in ('url', 'image_url', 'image', 'output'):
        v = out.get(k)
        if isinstance(v, str) and v.startswith(('http', 'data:')):
            return v
    return None


def _generate_image(image_url, api_key):
    '''ИИ-художник: студийный кадр через polza.ai media API (gemini image edit).
    Возвращает (data_or_http_url, None) или (None, detail).'''
    payload = json.dumps({
        'model': IMAGE_MODEL,
        'prompt': PROMPT,
        'image_urls': [image_url],
        'n': 1,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.polza.ai/api/v1/images/generations',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            out = json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return None, 'HTTP:' + e.read().decode('utf-8')[:1500]
    except Exception as e:
        return None, str(e)[:400]

    url = _extract_media_url(out)
    if url:
        return url, None

    # асинхронный режим: пришёл requestId — опрашиваем результат
    request_id = out.get('requestId') or out.get('request_id') or out.get('id')
    if request_id:
        return _poll_media(request_id, api_key)

    return None, 'RAW:' + json.dumps(out)[:3000]


POLL_PATHS = [
    'https://api.polza.ai/api/v1/images/generations/{id}',
    'https://api.polza.ai/api/v1/media/{id}',
    'https://api.polza.ai/api/v1/images/{id}',
    'https://api.polza.ai/api/v1/generations/{id}',
    'https://api.polza.ai/api/v1/requests/{id}',
]


def _poll_once(url, api_key):
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {api_key}'}, method='GET')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))


def _poll_media(request_id, api_key):
    '''Опрашивает готовность media-задачи polza, перебирая возможные пути.'''
    import time
    good_path = None
    last = None
    for attempt in range(24):  # ~2 минуты
        if good_path is None:
            for p in POLL_PATHS:
                try:
                    out = _poll_once(p.format(id=request_id), api_key)
                    good_path = p
                    last = out
                    break
                except urllib.error.HTTPError as e:
                    if e.code == 404:
                        continue
                    return None, 'POLL_HTTP:' + e.read().decode('utf-8')[:800]
                except Exception:
                    continue
            if good_path is None:
                return None, 'POLL_NOPATH for ' + request_id
        else:
            try:
                last = _poll_once(good_path.format(id=request_id), api_key)
            except Exception as e:
                return None, 'POLL:' + str(e)[:300]

        url = _extract_media_url(last)
        if url:
            return url, None
        status = str((last or {}).get('status', '')).lower()
        if status in ('failed', 'error', 'canceled'):
            return None, 'POLL_FAIL:' + json.dumps(last)[:600]
        time.sleep(5)
    return None, 'POLL_TIMEOUT(' + str(good_path) + '):' + json.dumps(last)[:500]


def _process(image_url, api_key):
    '''Полный цикл генерации: рисует кадр, кладёт в S3, пишет результат в БД.'''
    try:
        gen_url, detail = _generate_image(image_url, api_key)
        if not gen_url:
            _set_row(image_url, 'error', '', (detail or '')[:3800])
            return

        access_key = os.environ['AWS_ACCESS_KEY_ID']
        digest = hashlib.md5(('studio:gem:' + image_url).encode('utf-8')).hexdigest()
        key = f'studio/{digest}.png'
        cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{key}'

        if gen_url.startswith('data:'):
            img_bytes = base64.b64decode(gen_url.split(',', 1)[1])
        else:
            with urllib.request.urlopen(gen_url, timeout=60) as r:
                img_bytes = r.read()
        _s3().put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/png')
        _set_row(image_url, 'ready', cdn_url, None)
    except Exception as e:
        _set_row(image_url, 'error', '', str(e)[:300])


def handler(event, context):
    '''
    ИИ-художник студийного кадра: дорисовывает предмет до целого и ставит на
    студийный фон со светом и тенью (polza.ai + Gemini). Результат фиксируется
    в БД и S3 ОДИН раз. Генерация идёт синхронно, статус хранится в БД.
    POST {action:"status", imageUrl} -> {status: ready|processing|error|none, url?, detail?}
    POST {action:"start", imageUrl}  -> запускает генерацию (выполняет до конца).
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

    try:
        row = _get_row(image_url)
    except Exception as e:
        return _json(500, {'error': 'DB error', 'detail': str(e)[:300]})

    if row:
        status, studio_url, detail = row
        if status == 'ready' and studio_url:
            return _json(200, {'status': 'ready', 'url': studio_url})
        if status == 'processing':
            return _json(200, {'status': 'processing'})
        if status == 'error' and action == 'status':
            return _json(200, {'status': 'error', 'detail': detail})

    if action == 'status':
        return _json(200, {'status': 'none'})

    # action == start
    api_key = os.environ.get('POLZA_AI_API_KEY')
    if not api_key:
        return _json(500, {'error': 'POLZA_AI_API_KEY не настроен'})

    # помечаем processing, чтобы повторные клики не плодили генерации
    _set_row(image_url, 'processing', '', None)
    _process(image_url, api_key)

    final = _get_row(image_url)
    if final and final[0] == 'ready' and final[1]:
        return _json(200, {'status': 'ready', 'url': final[1]})
    return _json(200, {'status': 'error', 'detail': (final[2] if final else 'unknown')})