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


def _remove_bg(src_bytes, tol=42):
    '''Удаляет однородный фон flood-fill от краёв изображения.'''
    img = Image.open(io.BytesIO(src_bytes)).convert('RGBA')
    base_w = 600
    scale = base_w / img.width if img.width > base_w else 1.0
    work = img.resize((int(img.width * scale), int(img.height * scale))) if scale != 1.0 else img.copy()

    W, H = work.size
    px = work.load()

    corners = [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]
    cr = sum(px[x, y][0] for x, y in corners) // 4
    cg = sum(px[x, y][1] for x, y in corners) // 4
    cb = sum(px[x, y][2] for x, y in corners) // 4

    visited = bytearray(W * H)
    transparent = bytearray(W * H)
    q = deque()
    for x, y in corners:
        i = y * W + x
        if not visited[i]:
            visited[i] = 1
            q.append((x, y))

    tol2 = tol * tol
    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        dr, dg, db = r - cr, g - cg, b - cb
        if dr * dr + dg * dg + db * db <= tol2 * 3:
            transparent[y * W + x] = 1
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < W and 0 <= ny < H:
                    j = ny * W + nx
                    if not visited[j]:
                        visited[j] = 1
                        q.append((nx, ny))

    mask = Image.new('L', (W, H), 255)
    mpx = mask.load()
    for y in range(H):
        row = y * W
        for x in range(W):
            if transparent[row + x]:
                mpx[x, y] = 0
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))

    if mask.size != img.size:
        mask = mask.resize(img.size, Image.LANCZOS)
    img.putalpha(mask)

    bbox = img.getbbox()
    if bbox:
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

    digest = hashlib.md5(image_url.encode('utf-8')).hexdigest()
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
