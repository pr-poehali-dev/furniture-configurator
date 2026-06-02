import json
import os
import urllib.request
import urllib.error

import psycopg2


def _save_conversation(session_id, messages, reply):
    dsn = os.environ.get('DATABASE_URL')
    if not dsn or not session_id:
        return
    try:
        full = messages + [{'role': 'assistant', 'content': reply}]
        payload = json.dumps(full, ensure_ascii=False)
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        cur.execute("SELECT id FROM chat_conversations WHERE session_id = %s LIMIT 1", (session_id,))
        row = cur.fetchone()
        if row:
            cur.execute(
                "UPDATE chat_conversations SET messages = %s, updated_at = now() WHERE id = %s",
                (payload, row[0]),
            )
        else:
            cur.execute(
                "INSERT INTO chat_conversations (session_id, messages) VALUES (%s, %s)",
                (session_id, payload),
            )
        conn.commit()
        cur.close()
        conn.close()
    except Exception:
        pass

CATALOG = '''КАТАЛОГ ТОВАРОВ Artora-ai (рекомендуй из него, указывай точные цены):
Столы: Обеденный стол «Нордик» (дуб, скандинавский) — 28 900 ₽; Кофейный столик «Уолнат» (орех, лофт) — 18 500 ₽; Письменный стол «Бланш» (белый лак, минимализм) — 22 400 ₽; Барный стол «Индастриал» (металл, лофт) — 38 000 ₽.
Диваны и кресла: Диван «Осло» 3-местный (ткань) — 64 900 ₽; Диван «Берген» угловой (ткань) — 89 500 ₽; Кресло «Стокгольм» (ткань) — 32 400 ₽.
Шкафы: Шкаф-купе «Модерн» (дуб) — 54 200 ₽; Гардероб «Лофт» (орех) — 47 800 ₽; Комод «Сканди» (белый лак) — 26 500 ₽.
Кухни: Кухня «Альпина» прямая (белый лак) — 128 000 ₽; Кухня «Терра» угловая (орех) — 184 500 ₽.
Кровати: Кровать «Хюгге» 160×200 (ткань) — 48 900 ₽; Кровать «Лофт» 180×200 (дуб) — 56 400 ₽.
Стеллажи: Стеллаж «Лофт» (металл) — 41 200 ₽; Книжный шкаф «Классик» (дуб) — 34 800 ₽.'''

SYSTEM_PROMPT = '''Ты — Артур, дружелюбный ИИ-продавец интернет-магазина мебели Artora-ai.
Твоя задача — помочь клиенту выбрать товар из каталога и довести до покупки.
Веди диалог тепло и профессионально, на русском языке. Отвечай коротко (2-4 предложения).

Задавай по одному уточняющему вопросу за раз, чтобы понять:
1. Какой предмет нужен (стол, диван, шкаф, кухня, кровать, стеллаж)
2. Где будет стоять и для чего
3. Предпочтения по материалу и стилю
4. Бюджет

Когда поймёшь потребность — порекомендуй 1-2 КОНКРЕТНЫХ товара из каталога
с названием и точной ценой. Подскажи, что любой товар можно покрутить в 3D,
примерить к интерьеру на странице товара и добавить в корзину.
Если нужен нестандартный размер — предложи 3D-конструктор.
Используй ТОЛЬКО товары и цены из каталога ниже, не выдумывай свои.

''' + CATALOG


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

    api_key = os.environ.get('POLZA_AI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'POLZA_AI_API_KEY не настроен'}),
        }

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    session_id = str(body.get('sessionId', ''))[:64]
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
        'model': 'openai/gpt-4o-mini',
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 400,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.polza.ai/api/v1/chat/completions',
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
            'body': json.dumps({'error': 'Ошибка ИИ-провайдера', 'detail': err_body[:300]}),
        }
    except Exception as e:
        return {
            'statusCode': 502,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)[:300]}),
        }

    _save_conversation(session_id, clean, reply)

    return {
        'statusCode': 200,
        'headers': {**cors_headers, 'Content-Type': 'application/json'},
        'body': json.dumps({'reply': reply}, ensure_ascii=False),
    }