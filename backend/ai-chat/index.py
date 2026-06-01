import json
import os
import urllib.request
import urllib.error

SYSTEM_PROMPT = '''Ты — Артур, дружелюбный ИИ-консультант мебельной фабрики ARTORA.
Твоя задача — помочь клиенту собрать мебель его мечты через наводящие вопросы.
Веди диалог тепло и профессионально, на русском языке. Отвечай коротко (2-4 предложения).

Задавай по одному уточняющему вопросу за раз, чтобы понять:
1. Какой предмет нужен (стол, стеллаж, тумба, и т.д.)
2. Где будет стоять и для чего использоваться
3. Предпочтения по материалу (дуб, орех, белый лак)
4. Стиль интерьера (скандинавский, лофт, минимализм, классика)
5. Размеры и бюджет

Когда соберёшь достаточно информации — предложи конкретную конфигурацию
и порекомендуй открыть 3D-конструктор, чтобы увидеть результат.
Не выдумывай цены — говори, что точную стоимость покажет конструктор.'''


def handler(event, context):
    '''
    Чат с ИИ-оператором мебельной фабрики. Принимает историю сообщений,
    возвращает ответ ассистента через OpenAI GPT.
    Args: event с httpMethod, body (messages: [{role, content}])
          context - объект с request_id
    Returns: HTTP-ответ с полем reply
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

    user_messages = body.get('messages', [])
    if not isinstance(user_messages, list):
        user_messages = []

    # Sanitize and limit history
    clean = []
    for m in user_messages[-12:]:
        role = m.get('role')
        content = m.get('content', '')
        if role in ('user', 'assistant') and isinstance(content, str) and content.strip():
            clean.append({'role': role, 'content': content[:2000]})

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}] + clean

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 400,
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
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        reply = data['choices'][0]['message']['content']
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
        'body': json.dumps({'reply': reply}, ensure_ascii=False),
    }
