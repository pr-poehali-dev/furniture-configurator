import json
import os
import io
import hashlib
import urllib.request
from collections import deque

import boto3
from PIL import Image, ImageFilter


def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }


def _edge_palette(px, W, H, step=6):
    '''Собирает эталонные цвета фона по всему периметру кадра.'''
    samples = []
    for x in range(0, W, step):
        samples.append(px[x, 0][:3])
        samples.append(px[x, H - 1][:3])
    for y in range(0, H, step):
        samples.append(px[0, y][:3])
        samples.append(px[W - 1, y][:3])
    # кластеризуем грубо: усредняем близкие оттенки в несколько «ключевых» цветов
    palette = []
    for s in samples:
        placed = False
        for p in palette:
            if (s[0] - p[0]) ** 2 + (s[1] - p[1]) ** 2 + (s[2] - p[2]) ** 2 < 30 * 30:
                placed = True
                break
        if not placed:
            palette.append(s)
        if len(palette) >= 6:
            break
    return palette or [(255, 255, 255)]


def _remove_bg(src_bytes, tol=46):
    '''Аккуратно вырезает предмет: многоцветный flood-fill от краёв,
    anti-halo, мягкая растушёвка краёв, обрезка по содержимому.'''
    img = Image.open(io.BytesIO(src_bytes)).convert('RGBA')
    base_w = 640
    scale = base_w / img.width if img.width > base_w else 1.0
    work = img.resize((int(img.width * scale), int(img.height * scale))) if scale != 1.0 else img.copy()

    W, H = work.size
    px = work.load()

    palette = _edge_palette(px, W, H)
    tol2 = tol * tol * 3

    def is_bg(r, g, b):
        for pr, pg, pb in palette:
            dr, dg, db = r - pr, g - pg, b - pb
            if dr * dr + dg * dg + db * db <= tol2:
                return True
        return False

    # seed-точки по всему периметру (устойчивость к неоднородному фону)
    visited = bytearray(W * H)
    transparent = bytearray(W * H)
    q = deque()
    for x in range(W):
        for y in (0, H - 1):
            i = y * W + x
            if not visited[i]:
                visited[i] = 1
                q.append((x, y))
    for y in range(H):
        for x in (0, W - 1):
            i = y * W + x
            if not visited[i]:
                visited[i] = 1
                q.append((x, y))

    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        if is_bg(r, g, b):
            transparent[y * W + x] = 1
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < W and 0 <= ny < H:
                    j = ny * W + nx
                    if not visited[j]:
                        visited[j] = 1
                        q.append((nx, ny))

    # маска: 255 = предмет, 0 = фон
    mask = Image.new('L', (W, H), 255)
    mpx = mask.load()
    for y in range(H):
        row = y * W
        for x in range(W):
            if transparent[row + x]:
                mpx[x, y] = 0

    # anti-halo: сжимаем контур, чтобы убрать светлый ореол фона по краю
    mask = mask.filter(ImageFilter.MinFilter(3))
    # мягкая растушёвка краёв
    mask = mask.filter(ImageFilter.GaussianBlur(1.6))
    # повышаем контраст альфы (резкая граница, но сглаженная)
    mask = mask.point(lambda v: 0 if v < 90 else (255 if v > 170 else int((v - 90) / 80 * 255)))
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))

    if mask.size != img.size:
        mask = mask.resize(img.size, Image.LANCZOS)
    img.putalpha(mask)

    bbox = img.getbbox()
    if bbox:
        # небольшой отступ, чтобы предмет не упирался в края
        pad = max(4, (bbox[2] - bbox[0]) // 40)
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                min(img.width, bbox[2] + pad), min(img.height, bbox[3] + pad))
        img = img.crop(bbox)

    out = io.BytesIO()
    img.save(out, format='PNG', optimize=True)
    return out.getvalue()


def handler(event, context):
    '''
    Удаляет фон у фото товара и сохраняет прозрачный PNG в S3.
    Возвращает CDN-ссылку. Результат кэшируется по хешу исходного URL.
    Args: event с httpMethod, body (imageUrl: str)
          context - объект с request_id
    Returns: HTTP-ответ с полем url
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'body': ''}
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {**_cors(), 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
        }

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    image_url = str(body.get('imageUrl', '')).strip()
    if not image_url.startswith('http'):
        return {
            'statusCode': 400,
            'headers': {**_cors(), 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'imageUrl обязателен'}),
        }

    access_key = os.environ['AWS_ACCESS_KEY_ID']
    secret_key = os.environ['AWS_SECRET_ACCESS_KEY']

    digest = hashlib.md5(('v2:' + image_url).encode('utf-8')).hexdigest()
    key = f'cutout/{digest}.png'
    cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{key}'

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )

    try:
        s3.head_object(Bucket='files', Key=key)
        return {
            'statusCode': 200,
            'headers': {**_cors(), 'Content-Type': 'application/json'},
            'body': json.dumps({'url': cdn_url, 'cached': True}),
        }
    except Exception:
        pass

    req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=25) as resp:
        src_bytes = resp.read()

    out_bytes = _remove_bg(src_bytes)

    s3.put_object(Bucket='files', Key=key, Body=out_bytes, ContentType='image/png')

    return {
        'statusCode': 200,
        'headers': {**_cors(), 'Content-Type': 'application/json'},
        'body': json.dumps({'url': cdn_url, 'cached': False}),
    }