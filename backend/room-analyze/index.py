import json
import os
import urllib.request
import urllib.error

VISION_PROMPT = '''Ты — дизайнер интерьеров мебельной фабрики ARTORA. Проанализируй фото комнаты клиента
и определи, какая мебель ему подойдёт из нашего каталога.

Верни СТРОГО валидный JSON без markdown, без пояснений, в формате:
{
  "roomType": "тип комнаты на русском (гостиная, спальня, кухня, кабинет, прихожая и т.п.)",
  "style": "Скандинавский" | "Лофт" | "Минимализм" | "Классика",
  "palette": ["#hex1", "#hex2", "#hex3"],
  "paletteNames": "названия цветов простыми словами на русском (2-4 слова)",
  "area": "оценка площади на русском, например 'около 18 м²'",
  "materials": ["Дуб" | "Орех" | "Белый лак" | "Ткань" | "Металл"],
  "categories": ["tables" | "chairs" | "sofas"],
  "comment": "тёплый совет дизайнера на русском: что хорошо впишется и почему (2-3 предложения)"
}

Где categories: tables=столы, chairs=стулья, sofas=диваны/кресла. В продаже только эти три категории.
Выбери 1-3 наиболее подходящие категории под этот тип комнаты.
В materials выбери 1-3 материала, гармонирующих с интерьером на фото.
style выбери ОДИН из четырёх вариантов — ближайший к интерьеру.
palette — 3 основных цвета интерьера в hex.'''


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


def handler(event, context):
    '''
    Анализ фото комнаты через GPT Vision: определяет стиль, палитру, площадь
    и подбирает подходящие категории и материалы мебели из каталога ARTORA.
    Args: event с httpMethod, body (image: base64 data url)
          context - объект с request_id
    Returns: HTTP-ответ с рекомендациями для подбора мебели
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': _cors(), 'body': ''}
    if method != 'POST':
        return _json(405, {'error': 'Method not allowed'})

    api_key = os.environ.get('POLZA_AI_API_KEY')
    if not api_key:
        return _json(500, {'error': 'POLZA_AI_API_KEY не настроен'})

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    image = body.get('image', '')
    if not image or not isinstance(image, str):
        return _json(400, {'error': 'Не передано изображение'})
    if not image.startswith('data:'):
        image = f'data:image/jpeg;base64,{image}'

    payload = json.dumps({
        'model': 'openai/gpt-4o',
        'messages': [
            {'role': 'system', 'content': VISION_PROMPT},
            {
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': 'Проанализируй комнату и верни JSON-рекомендации.'},
                    {'type': 'image_url', 'image_url': {'url': image, 'detail': 'low'}},
                ],
            },
        ],
        'temperature': 0.4,
        'max_tokens': 500,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.polza.ai/api/v1/chat/completions',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=28) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        content = data['choices'][0]['message']['content']
        result = json.loads(content)
    except urllib.error.HTTPError as e:
        return _json(502, {'error': 'Ошибка ИИ-провайдера', 'detail': e.read().decode('utf-8')[:300]})
    except Exception as e:
        return _json(502, {'error': str(e)[:300]})

    return _json(200, {'result': result})