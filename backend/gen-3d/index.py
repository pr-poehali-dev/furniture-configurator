import json
import os
import hashlib
import urllib.request

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
        'body': json.dumps(payload),
    }


MESHY_BASE = 'https://api.meshy.ai/openapi/v1/image-to-3d'


def _meshy_post(api_key, image_url):
    body = json.dumps({
        'image_url': image_url,
        'enable_pbr': True,
        'should_remesh': True,
        'topology': 'quad',
    }).encode('utf-8')
    req = urllib.request.Request(
        MESHY_BASE, data=body, method='POST',
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read())


def _meshy_get(api_key, task_id):
    req = urllib.request.Request(
        f'{MESHY_BASE}/{task_id}', method='GET',
        headers={'Authorization': f'Bearer {api_key}'},
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read())


def _save_glb(glb_url, image_url):
    '''Скачивает готовый GLB и кладёт в S3, возвращает CDN-ссылку.'''
    access_key = os.environ['AWS_ACCESS_KEY_ID']
    secret_key = os.environ['AWS_SECRET_ACCESS_KEY']
    digest = hashlib.md5(('glb:' + image_url).encode('utf-8')).hexdigest()
    key = f'models/{digest}.glb'
    cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{key}'

    s3 = boto3.client(
        's3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=access_key, aws_secret_access_key=secret_key,
    )
    try:
        s3.head_object(Bucket='files', Key=key)
        return cdn_url
    except Exception:
        pass

    req = urllib.request.Request(glb_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType='model/gltf-binary')
    return cdn_url


def handler(event, context):
    '''
    Генерация настоящей 3D-модели (GLB) из фото товара через Meshy.ai.
    POST {action:"start", imageUrl} -> {taskId}
    POST {action:"status", taskId, imageUrl} -> {status, progress, modelUrl?}
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

    action = body.get('action', 'start')

    if action == 'start':
        image_url = str(body.get('imageUrl', '')).strip()
        if not image_url.startswith('http'):
            return _json(400, {'error': 'imageUrl обязателен'})
        api_key = os.environ.get('MESHY_API_KEY')
        if not api_key:
            return _json(500, {'error': 'MESHY_API_KEY не задан'})
        res = _meshy_post(api_key, image_url)
        task_id = res.get('result') or res.get('id')
        return _json(200, {'taskId': task_id})

    if action == 'status':
        task_id = str(body.get('taskId', '')).strip()
        image_url = str(body.get('imageUrl', '')).strip()
        if not task_id:
            return _json(400, {'error': 'taskId обязателен'})
        api_key = os.environ.get('MESHY_API_KEY')
        if not api_key:
            return _json(500, {'error': 'MESHY_API_KEY не задан'})
        res = _meshy_get(api_key, task_id)
        status = res.get('status', 'PENDING')
        progress = res.get('progress', 0)
        out = {'status': status, 'progress': progress}
        if status == 'SUCCEEDED':
            urls = res.get('model_urls') or {}
            glb = urls.get('glb')
            if glb:
                out['modelUrl'] = _save_glb(glb, image_url or task_id)
        return _json(200, out)

    return _json(400, {'error': 'Неизвестное действие'})