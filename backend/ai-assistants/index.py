import json
import os
import urllib.request
import urllib.error
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras


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


def _schema():
    return os.environ['MAIN_DB_SCHEMA']


ROLES = {
    'manager': {
        'name': 'Менеджер проекта',
        'system': '''Ты — ИИ-менеджер проекта интернет-магазина мебели ARTORA.
Твоя задача — контролировать процесс: следить за заявками, выявлять необработанные,
предлагать чёткий план действий и приоритеты на сегодня.
Отвечай на русском, по-деловому и конкретно. Используй маркированные списки.
Указывай реальные числа из сводки. В конце дай 3-5 пунктов «Что сделать сейчас».''',
    },
    'marketer': {
        'name': 'Маркетолог',
        'system': '''Ты — ИИ-маркетолог интернет-магазина мебели ARTORA.
Анализируй каталог и заявки, предлагай идеи для роста продаж: акции, связки товаров,
работа с ценами, контент, сезонные предложения, на каких товарах сделать акцент.
Отвечай на русском, конкретно и практично, с готовыми формулировками акций.
Опирайся на реальные данные из сводки (ассортимент, средний чек, источники заявок).''',
    },
    'seller': {
        'name': 'Продавец',
        'system': '''Ты — ИИ-продавец-консультант интернет-магазина мебели ARTORA.
Помогаешь дожимать сделки: как ответить клиенту, что предложить дополнительно (допродажа),
как снять возражения. Даёшь готовые скрипты и сообщения для связи с клиентами из заявок.
Отвечай на русском, тепло и убедительно. Предлагай конкретные товары из каталога с ценами.''',
    },
}


def _gather_context():
    '''Собирает краткую бизнес-сводку из БД для ИИ.'''
    schema = _schema()
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    ctx = {}
    try:
        # товары
        cur.execute(
            f"SELECT title, price, category, style, material, badge, eco, is_active "
            f"FROM {schema}.products ORDER BY sort_order, id DESC LIMIT 100"
        )
        products = cur.fetchall()
        ctx['products_total'] = len(products)
        ctx['products_active'] = sum(1 for p in products if p['is_active'])
        prices = [p['price'] for p in products if p['price']]
        ctx['avg_price'] = int(sum(prices) / len(prices)) if prices else 0
        ctx['catalog'] = [
            {'title': p['title'], 'price': p['price'], 'category': p['category'],
             'style': p['style'], 'material': p['material'], 'badge': p['badge'],
             'eco': p['eco'], 'active': p['is_active']}
            for p in products[:40]
        ]

        # заявки
        cur.execute(f"SELECT source, status, price, name, phone, created_at FROM {schema}.leads ORDER BY created_at DESC LIMIT 100")
        leads = cur.fetchall()
        ctx['leads_total'] = len(leads)
        week_ago = datetime.now().astimezone() - timedelta(days=7)
        ctx['leads_week'] = sum(1 for l in leads if l['created_at'] and l['created_at'] >= week_ago)
        ctx['leads_new'] = sum(1 for l in leads if l['status'] == 'new')
        sources = {}
        for l in leads:
            sources[l['source']] = sources.get(l['source'], 0) + 1
        ctx['lead_sources'] = sources
        ctx['recent_leads'] = [
            {'source': l['source'], 'status': l['status'], 'price': l['price'],
             'name': l['name'], 'has_phone': bool(l['phone']),
             'date': l['created_at'].strftime('%d.%m %H:%M') if l['created_at'] else None}
            for l in leads[:15]
        ]

        # переписки
        cur.execute(f"SELECT COUNT(*) AS c FROM {schema}.chat_conversations")
        ctx['chats_total'] = cur.fetchone()['c']
    finally:
        cur.close()
        conn.close()
    return ctx


def handler(event, context):
    '''
    ИИ-помощники админки: менеджер проекта, маркетолог и продавец.
    Собирает сводку из БД (товары, заявки, чаты) и отвечает в роли выбранного помощника.
    Args: event с httpMethod, body (role, question?, messages?), headers X-Admin-Token
          context - объект с request_id
    Returns: HTTP-ответ с полем reply
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

    role = body.get('role', 'manager')
    if role not in ROLES:
        role = 'manager'

    question = str(body.get('question', '')).strip()[:1500]
    history = body.get('messages', [])

    try:
        ctx = _gather_context()
    except Exception as e:
        return _json(500, {'error': 'Ошибка чтения данных: ' + str(e)[:200]})

    summary = (
        f"СВОДКА ПО МАГАЗИНУ ARTORA (актуальные данные):\n"
        f"- Товаров всего: {ctx['products_total']}, активных на сайте: {ctx['products_active']}\n"
        f"- Средняя цена товара: {ctx['avg_price']} ₽\n"
        f"- Заявок всего: {ctx['leads_total']}, за неделю: {ctx['leads_week']}, новых (необработанных): {ctx['leads_new']}\n"
        f"- Источники заявок: {json.dumps(ctx['lead_sources'], ensure_ascii=False)}\n"
        f"- Диалогов с ИИ-продавцом: {ctx['chats_total']}\n\n"
        f"КАТАЛОГ (до 40 позиций): {json.dumps(ctx['catalog'], ensure_ascii=False)}\n\n"
        f"ПОСЛЕДНИЕ ЗАЯВКИ: {json.dumps(ctx['recent_leads'], ensure_ascii=False)}"
    )

    if question:
        user_content = question
    else:
        user_content = 'Сделай краткий анализ текущей ситуации и дай конкретные рекомендации.'

    messages = [
        {'role': 'system', 'content': ROLES[role]['system'] + '\n\n' + summary},
    ]
    for m in history[-8:]:
        r = m.get('role')
        c = m.get('content', '')
        if r in ('user', 'assistant') and isinstance(c, str) and c.strip():
            messages.append({'role': r, 'content': c[:1500]})
    messages.append({'role': 'user', 'content': user_content})

    payload = json.dumps({
        'model': 'openai/gpt-4o-mini',
        'messages': messages,
        'temperature': 0.6,
        'max_tokens': 900,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.polza.ai/api/v1/chat/completions',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=50) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        reply = data['choices'][0]['message']['content']
    except urllib.error.HTTPError as e:
        return _json(502, {'error': 'Ошибка ИИ-провайдера', 'detail': e.read().decode('utf-8')[:300]})
    except Exception as e:
        return _json(502, {'error': str(e)[:300]})

    return _json(200, {
        'reply': reply,
        'role': role,
        'roleName': ROLES[role]['name'],
        'stats': {
            'productsActive': ctx['products_active'],
            'leadsNew': ctx['leads_new'],
            'leadsWeek': ctx['leads_week'],
            'avgPrice': ctx['avg_price'],
        },
    })
