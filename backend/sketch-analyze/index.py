import json
import os
import urllib.request
import urllib.error

VISION_PROMPT = '''Ты — эксперт мебельной фабрики ARTORA. Проанализируй изображение
(эскиз от руки или фото мебели) и определи, какую мебель хочет клиент.

Верни СТРОГО валидный JSON без markdown, без пояснений, в формате:
{
  "furniture": "table" | "shelf" | "nightstand",
  "material": "oak" | "walnut" | "white",
  "size": "s" | "m" | "l",
  "thickness": "t2" | "t3",
  "legsStyle": "classic" | "cone" | "metal",
  "legsHeight": "h70" | "h75" | "h80",
  "hardware": "none" | "h1" | "h2" | "h3",
  "comment": "краткое описание на русском, что распознано (1-2 предложения)"
}

Где: table=стол, shelf=стеллаж, nightstand=тумба; oak=дуб, walnut=орех, white=белый лак;
s=маленький, m=средний, l=большой; t2=2см, t3=3см;
classic=классические ножки, cone=конические, metal=металлические;
hardware: none=без ручек, h1=латунь, h2=матовое железо, h3=деревянные.
Выбери наиболее подходящие значения по изображению.'''


def handler(event, context):
    '''
    Анализ эскиза или фото мебели через GPT Vision. Принимает изображение в base64,
    возвращает подобранную конфигурацию для 3D-конструктора.
    Args: event с httpMethod, body (image: base64 data url)
          context - объект с request_id
    Returns: HTTP-ответ с конфигурацией мебели
    '''
    method = event.get('httpMethod', 'GET')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
        }

    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'OPENAI_API_KEY не настроен'}),
        }

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    image = body.get('image', '')
    if not image or not isinstance(image, str):
        return {
            'statusCode': 400,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Не передано изображение'}),
        }

    if not image.startswith('data:'):
        image = f'data:image/png;base64,{image}'

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': VISION_PROMPT},
            {
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': 'Определи мебель по изображению и верни JSON-конфигурацию.'},
                    {'type': 'image_url', 'image_url': {'url': image, 'detail': 'low'}},
                ],
            },
        ],
        'temperature': 0.3,
        'max_tokens': 300,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=28) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        content = data['choices'][0]['message']['content']
        config = json.loads(content)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        return {
            'statusCode': 502,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Ошибка OpenAI', 'detail': err_body[:300]}),
        }
    except Exception as e:
        return {
            'statusCode': 502,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)[:300]}),
        }

    return {
        'statusCode': 200,
        'headers': {**cors_headers, 'Content-Type': 'application/json'},
        'body': json.dumps({'config': config}, ensure_ascii=False),
    }
