import json
import os
import io
import hashlib
import urllib.request
from collections import deque

import boto3
from PIL import Image, ImageFilter, ImageChops, ImageOps


def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }


def _bg_stats(px, W, H):
    '''Оценивает средний цвет и разброс (шум) фона по тонкой рамке у краёв.'''
    rs, gs, bs = [], [], []
    band = max(2, min(W, H) // 60)
    for x in range(0, W, 2):
        for y in list(range(band)) + list(range(H - band, H)):
            r, g, b = px[x, y][:3]
            rs.append(r); gs.append(g); bs.append(b)
    for y in range(0, H, 2):
        for x in list(range(band)) + list(range(W - band, W)):
            r, g, b = px[x, y][:3]
            rs.append(r); gs.append(g); bs.append(b)
    n = len(rs) or 1
    mr, mg, mb = sum(rs) / n, sum(gs) / n, sum(bs) / n
    var = sum((rs[i] - mr) ** 2 + (gs[i] - mg) ** 2 + (bs[i] - mb) ** 2 for i in range(n)) / n
    std = var ** 0.5
    return (mr, mg, mb), std


def _flood_bg(px, W, H, mr, mg, mb, tol2):
    '''Заливка фона ТОЛЬКО от внешней рамки — фон должен быть связным с краем.
    Это не даёт «прогрызать» внутренние области предмета.'''
    visited = bytearray(W * H)
    transparent = bytearray(W * H)
    q = deque()

    def seed(x, y):
        i = y * W + x
        if not visited[i]:
            r, g, b = px[x, y][:3]
            dr, dg, db = r - mr, g - mg, b - mb
            visited[i] = 1
            if dr * dr + dg * dg + db * db <= tol2:
                transparent[i] = 1
                q.append((x, y))

    for x in range(W):
        seed(x, 0); seed(x, H - 1)
    for y in range(H):
        seed(0, y); seed(W - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H:
                j = ny * W + nx
                if not visited[j]:
                    visited[j] = 1
                    r, g, b = px[nx, ny][:3]
                    dr, dg, db = r - mr, g - mg, b - mb
                    if dr * dr + dg * dg + db * db <= tol2:
                        transparent[j] = 1
                        q.append((nx, ny))
    return transparent


def _fill_holes(mask):
    '''Заполняет дыры внутри предмета: всё, что НЕ достижимо снаружи, — предмет.'''
    W, H = mask.size
    inv = mask.point(lambda v: 0 if v > 127 else 255)  # фон=255
    ipx = inv.load()
    outside = bytearray(W * H)
    q = deque()
    for x in range(W):
        for y in (0, H - 1):
            i = y * W + x
            if ipx[x, y] > 127 and not outside[i]:
                outside[i] = 1; q.append((x, y))
    for y in range(H):
        for x in (0, W - 1):
            i = y * W + x
            if ipx[x, y] > 127 and not outside[i]:
                outside[i] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H:
                j = ny * W + nx
                if not outside[j] and ipx[nx, ny] > 127:
                    outside[j] = 1; q.append((nx, ny))
    out = mask.copy()
    opx = out.load()
    for y in range(H):
        row = y * W
        for x in range(W):
            if not outside[row + x]:
                opx[x, y] = 255  # внутренняя дыра -> предмет
    return out


def _remove_bg(src_bytes):
    '''Ювелирная вырезка предмета без потери его частей:
    заливка фона только от рамки + адаптивный допуск + заполнение дыр.'''
    img = Image.open(io.BytesIO(src_bytes)).convert('RGBA')
    base_w = 720
    scale = base_w / img.width if img.width > base_w else 1.0
    work = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale)))) if scale != 1.0 else img.copy()

    W, H = work.size
    px = work.load()

    (mr, mg, mb), std = _bg_stats(px, W, H)
    # адаптивный допуск: чем «шумнее» фон, тем больше, но в безопасных рамках
    tol = max(28, min(70, std * 2.2 + 24))
    tol2 = tol * tol * 3

    transparent = _flood_bg(px, W, H, mr, mg, mb, tol2)

    # если выгрызли почти всё (фон сложный) — ослабляем и пробуем мягче
    bg_count = sum(transparent)
    if bg_count > W * H * 0.92 or bg_count < W * H * 0.04:
        tol2b = (max(22, tol * 0.7)) ** 2 * 3
        transparent = _flood_bg(px, W, H, mr, mg, mb, tol2b)

    mask = Image.new('L', (W, H), 255)
    mpx = mask.load()
    for y in range(H):
        row = y * W
        for x in range(W):
            if transparent[row + x]:
                mpx[x, y] = 0

    # убрать мелкий «шум» фона у краёв предмета, не трогая тело
    mask = mask.filter(ImageFilter.MedianFilter(3))
    # вернуть внутренние дыры (стекло, просветы) предмету
    mask = _fill_holes(mask)
    # мягкая, симметричная растушёвка края (без эрозии тела)
    mask = mask.filter(ImageFilter.GaussianBlur(1.0))
    mask = mask.point(lambda v: 0 if v < 60 else (255 if v > 195 else int((v - 60) / 135 * 255)))

    if mask.size != img.size:
        mask = mask.resize(img.size, Image.LANCZOS)
    img.putalpha(mask)

    bbox = img.getbbox()
    if bbox:
        pad = max(6, (bbox[2] - bbox[0]) // 30)
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                min(img.width, bbox[2] + pad), min(img.height, bbox[3] + pad))
        img = img.crop(bbox)

    out = io.BytesIO()
    img.save(out, format='PNG', optimize=True)
    return out.getvalue(), img


def _depth_map(cut_img):
    '''Строит карту глубины (depth) предмета для 2.5D-параллакса.
    Чёрный = дальше, белый = ближе к камере.
    Глубина = расстояние до фона (distance transform) + подсветка яркости.'''
    W, H = cut_img.size
    alpha = cut_img.split()[3]
    # маска предмета
    solid = alpha.point(lambda v: 255 if v > 80 else 0)

    # приближённый distance transform: многократное «сжатие» внутрь
    dist = solid.copy()
    acc = Image.new('L', (W, H), 0)
    cur = solid
    steps = max(6, min(W, H) // 22)
    for _ in range(steps):
        cur = cur.filter(ImageFilter.MinFilter(3))
        acc = ImageChops.add(acc, cur.point(lambda v: 255 // steps if v > 127 else 0))
    dist = acc  # центр предмета ярче (дальше от края) => выпуклость

    # вклад яркости поверхности (светлые места кажутся ближе)
    gray = cut_img.convert('L')
    gray = ImageChops.multiply(gray, solid)
    gray = gray.point(lambda v: int(v * 0.45))

    depth = ImageChops.add(dist.point(lambda v: int(v * 0.7)), gray)
    depth = ImageChops.multiply(depth, solid)
    depth = depth.filter(ImageFilter.GaussianBlur(3))
    # нормализация контраста
    depth = ImageOps.autocontrast(depth, cutoff=2)
    depth = ImageChops.multiply(depth, solid)

    out = io.BytesIO()
    depth.save(out, format='PNG', optimize=True)
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

    digest = hashlib.md5(('v4:' + image_url).encode('utf-8')).hexdigest()
    key = f'cutout/{digest}.png'
    depth_key = f'cutout/{digest}_depth.png'
    cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{key}'
    depth_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{depth_key}'

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )

    try:
        s3.head_object(Bucket='files', Key=depth_key)
        return {
            'statusCode': 200,
            'headers': {**_cors(), 'Content-Type': 'application/json'},
            'body': json.dumps({'url': cdn_url, 'depthUrl': depth_url, 'cached': True}),
        }
    except Exception:
        pass

    req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=25) as resp:
        src_bytes = resp.read()

    out_bytes, cut_img = _remove_bg(src_bytes)
    depth_bytes = _depth_map(cut_img)

    s3.put_object(Bucket='files', Key=key, Body=out_bytes, ContentType='image/png')
    s3.put_object(Bucket='files', Key=depth_key, Body=depth_bytes, ContentType='image/png')

    return {
        'statusCode': 200,
        'headers': {**_cors(), 'Content-Type': 'application/json'},
        'body': json.dumps({'url': cdn_url, 'depthUrl': depth_url, 'cached': False}),
    }