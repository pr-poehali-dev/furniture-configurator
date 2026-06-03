import json
import os
import base64
import uuid

import boto3
import psycopg2
import psycopg2.extras


def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
        'Access-Control-Max-Age': '86400',
    }


def _json(status, payload):
    return {
        'statusCode': status,
        'headers': {**_cors(), 'Content-Type': 'application/json'},
        'body': json.dumps(payload, ensure_ascii=False),
    }


def _schema():
    return os.environ['MAIN_DB_SCHEMA']


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _row_to_product(r):
    return {
        'id': r['id'],
        'title': r['title'],
        'price': r['price'],
        'oldPrice': r['old_price'],
        'category': r['category'],
        'style': r['style'],
        'material': r['material'],
        'img': r['img'],
        'badge': r['badge'],
        'eco': r['eco'],
        'desc': r['description'],
        'isActive': r['is_active'],
        'sortOrder': r['sort_order'],
    }


def _check_auth(event):
    admin_token = os.environ.get('ADMIN_TOKEN')
    if not admin_token:
        return True  # токен не задан — доступ открыт
    headers = event.get('headers') or {}
    provided = headers.get('X-Admin-Token') or headers.get('x-admin-token')
    return provided == admin_token


def _upload_image(data_url):
    '''Принимает data:image base64, кладёт в S3, возвращает CDN-ссылку.'''
    head, _, b64 = data_url.partition(',')
    ext = 'png'
    if 'jpeg' in head or 'jpg' in head:
        ext = 'jpg'
    elif 'webp' in head:
        ext = 'webp'
    content_type = f'image/{"jpeg" if ext == "jpg" else ext}'
    img_bytes = base64.b64decode(b64)

    access_key = os.environ['AWS_ACCESS_KEY_ID']
    key = f'products/{uuid.uuid4().hex}.{ext}'
    s3 = boto3.client(
        's3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=access_key,
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=img_bytes, ContentType=content_type)
    return f'https://cdn.poehali.dev/projects/{access_key}/bucket/{key}'


def handler(event, context):
    '''
    Управление каталогом товаров ARTORA.
    GET — публичный список активных товаров для витрины.
    GET ?all=1 (с токеном) — все товары для админки.
    POST — создать товар (с токеном). PUT — обновить. DELETE — удалить.
    POST {action:"upload", image:"data:..."} — загрузить фото, вернуть ссылку.
    Args: event с httpMethod, body, headers, queryStringParameters
          context - объект с request_id
    Returns: HTTP-ответ JSON
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'body': ''}

    schema = _schema()
    params = event.get('queryStringParameters') or {}

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    # ---------- GET: список товаров ----------
    if method == 'GET':
        want_all = params.get('all') == '1'
        if want_all and not _check_auth(event):
            return _json(401, {'error': 'Неверный токен доступа'})

        conn = _conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            if want_all:
                cur.execute(
                    f"SELECT * FROM {schema}.products ORDER BY sort_order, id DESC"
                )
            else:
                cur.execute(
                    f"SELECT * FROM {schema}.products WHERE is_active = true "
                    f"ORDER BY sort_order, id DESC"
                )
            rows = cur.fetchall()
            return _json(200, {'products': [_row_to_product(r) for r in rows]})
        finally:
            cur.close()
            conn.close()

    # ---------- всё ниже требует авторизации ----------
    if not _check_auth(event):
        return _json(401, {'error': 'Неверный токен доступа'})

    # загрузка изображения
    if method == 'POST' and body.get('action') == 'upload':
        image = body.get('image', '')
        if not isinstance(image, str) or not image.startswith('data:'):
            return _json(400, {'error': 'Нужно изображение в формате data:URL'})
        try:
            url = _upload_image(image)
        except Exception as e:
            return _json(500, {'error': 'Ошибка загрузки: ' + str(e)[:200]})
        return _json(200, {'url': url})

    # ---------- POST: создать ----------
    if method == 'POST':
        conn = _conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cur.execute(
                f"INSERT INTO {schema}.products "
                f"(title, price, old_price, category, style, material, img, badge, eco, description, is_active, sort_order) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                (
                    body.get('title', 'Новый товар'),
                    int(body.get('price') or 0),
                    int(body['oldPrice']) if body.get('oldPrice') else None,
                    body.get('category', 'tables'),
                    body.get('style', ''),
                    body.get('material', ''),
                    body.get('img', ''),
                    body.get('badge') or None,
                    bool(body.get('eco', False)),
                    body.get('desc', ''),
                    bool(body.get('isActive', True)),
                    int(body.get('sortOrder') or 0),
                ),
            )
            conn.commit()
            return _json(200, {'product': _row_to_product(cur.fetchone())})
        finally:
            cur.close()
            conn.close()

    # ---------- PUT: обновить ----------
    if method == 'PUT':
        pid = body.get('id')
        if not pid:
            return _json(400, {'error': 'Не указан id'})
        conn = _conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cur.execute(
                f"UPDATE {schema}.products SET "
                f"title=%s, price=%s, old_price=%s, category=%s, style=%s, material=%s, "
                f"img=%s, badge=%s, eco=%s, description=%s, is_active=%s, sort_order=%s "
                f"WHERE id=%s RETURNING *",
                (
                    body.get('title', ''),
                    int(body.get('price') or 0),
                    int(body['oldPrice']) if body.get('oldPrice') else None,
                    body.get('category', 'tables'),
                    body.get('style', ''),
                    body.get('material', ''),
                    body.get('img', ''),
                    body.get('badge') or None,
                    bool(body.get('eco', False)),
                    body.get('desc', ''),
                    bool(body.get('isActive', True)),
                    int(body.get('sortOrder') or 0),
                    int(pid),
                ),
            )
            conn.commit()
            row = cur.fetchone()
            if not row:
                return _json(404, {'error': 'Товар не найден'})
            return _json(200, {'product': _row_to_product(row)})
        finally:
            cur.close()
            conn.close()

    # ---------- DELETE: удалить ----------
    if method == 'DELETE':
        pid = body.get('id') or params.get('id')
        if not pid:
            return _json(400, {'error': 'Не указан id'})
        conn = _conn()
        cur = conn.cursor()
        try:
            cur.execute(f"DELETE FROM {schema}.products WHERE id=%s", (int(pid),))
            conn.commit()
            return _json(200, {'ok': True})
        finally:
            cur.close()
            conn.close()

    return _json(405, {'error': 'Method not allowed'})
