import json
import os
import base64
import io
import urllib.request
import urllib.error

import pdfplumber


def _cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
        'Access-Control-Max-Age': '86400',
    }


def _json(status, payload):
    return {
        'statusCode': status,
        'headers': {**_cors(), 'Content-Type': 'application/json'},
        'body': json.dumps(payload, ensure_ascii=False),
    }


def _check_auth(event):
    admin_token = os.environ.get('ADMIN_TOKEN')
    if not admin_token:
        return True
    headers = event.get('headers') or {}
    provided = headers.get('X-Admin-Token') or headers.get('x-admin-token')
    return provided == admin_token


PROMPT = '''Ты — оператор импорта товаров мебельного интернет-магазина ARTORA.
Из текста прайс-листа извлеки список товаров. Верни СТРОГО валидный JSON-массив без markdown:
[
  {
    "title": "название товара на русском",
    "price": число (рубли, без пробелов и валюты),
    "oldPrice": число или null (если есть старая/зачёркнутая цена),
    "category": "tables" | "chairs" | "sofas",
    "style": "Скандинавский" | "Лофт" | "Минимализм" | "Классика",
    "material": "Дуб" | "Орех" | "Белый лак" | "Ткань" | "Металл",
    "desc": "короткое описание (1 предложение) на русском"
  }
]
Где category: tables=столы, chairs=стулья/табуреты, sofas=диваны/кресла. В продаже только эти три категории —
товары других категорий пропусти. style и material подбери ближайший из списка по описанию.
Если цена не указана — поставь 0. Не выдумывай товары, которых нет в тексте. Максимум 50 товаров.'''


def handler(event, context):
    '''
    Импорт прайс-листа из PDF: извлекает текст и через ИИ распознаёт товары,
    возвращает массив товаров для предпросмотра перед добавлением в каталог.
    Args: event с httpMethod, body (pdf: base64 data url), headers X-Admin-Token
          context - объект с request_id
    Returns: HTTP-ответ с массивом products
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'body': ''}
    if method != 'POST':
        return _json(405, {'error': 'Method not allowed'})

    if not _check_auth(event):
        return _json(401, {'error': 'Неверный токен доступа'})

    api_key = os.environ.get('POLZA_AI_API_KEY')
    if not api_key:
        return _json(500, {'error': 'POLZA_AI_API_KEY не настроен'})

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    pdf_data = body.get('pdf', '')
    if not isinstance(pdf_data, str) or not pdf_data:
        return _json(400, {'error': 'Не передан PDF-файл'})

    if pdf_data.startswith('data:'):
        pdf_data = pdf_data.split(',', 1)[-1]

    try:
        pdf_bytes = base64.b64decode(pdf_data)
    except Exception:
        return _json(400, {'error': 'Не удалось прочитать PDF'})

    # извлечение текста
    try:
        text_parts = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages[:20]:
                t = page.extract_text() or ''
                if t.strip():
                    text_parts.append(t)
        text = '\n'.join(text_parts).strip()
    except Exception as e:
        return _json(400, {'error': 'Ошибка чтения PDF: ' + str(e)[:200]})

    if not text:
        return _json(422, {'error': 'В PDF не найден текст. Возможно, это скан-изображение.'})

    text = text[:12000]

    payload = json.dumps({
        'model': 'openai/gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': PROMPT},
            {'role': 'user', 'content': 'Текст прайс-листа:\n\n' + text},
        ],
        'temperature': 0.2,
        'max_tokens': 4000,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.polza.ai/api/v1/chat/completions',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=55) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        content = data['choices'][0]['message']['content']
        parsed = json.loads(content)
    except urllib.error.HTTPError as e:
        return _json(502, {'error': 'Ошибка ИИ-провайдера', 'detail': e.read().decode('utf-8')[:300]})
    except Exception as e:
        return _json(502, {'error': str(e)[:300]})

    # ИИ может вернуть {"products": [...]} или массив или {"items": [...]}
    if isinstance(parsed, dict):
        items = parsed.get('products') or parsed.get('items') or []
        if not items:
            for v in parsed.values():
                if isinstance(v, list):
                    items = v
                    break
    elif isinstance(parsed, list):
        items = parsed
    else:
        items = []

    allowed_cat = {'tables', 'chairs', 'sofas'}
    result = []
    for it in items[:50]:
        if not isinstance(it, dict):
            continue
        cat = it.get('category', 'tables')
        if cat not in allowed_cat:
            cat = 'tables'
        try:
            price = int(float(it.get('price') or 0))
        except (ValueError, TypeError):
            price = 0
        old_price = it.get('oldPrice')
        try:
            old_price = int(float(old_price)) if old_price else None
        except (ValueError, TypeError):
            old_price = None
        result.append({
            'title': str(it.get('title', '')).strip()[:200] or 'Товар',
            'price': price,
            'oldPrice': old_price,
            'category': cat,
            'style': str(it.get('style', 'Минимализм'))[:50],
            'material': str(it.get('material', 'Дуб'))[:50],
            'desc': str(it.get('desc', ''))[:500],
        })

    return _json(200, {'products': result, 'count': len(result)})
