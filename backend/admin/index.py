import json
import os

import psycopg2
import psycopg2.extras


def handler(event, context):
    '''
    Админ-API: возвращает заявки и переписки чата из БД для страницы /admin.
    Защищён простым токеном через заголовок X-Admin-Token.
    Args: event с httpMethod, queryStringParameters (tab=leads|chats), headers
          context - объект с request_id
    Returns: HTTP-ответ со списком заявок или диалогов
    '''
    method = event.get('httpMethod', 'GET')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
        }

    # Auth
    admin_token = os.environ.get('ADMIN_TOKEN')
    headers = event.get('headers') or {}
    provided = headers.get('X-Admin-Token') or headers.get('x-admin-token')
    if admin_token and provided != admin_token:
        return {
            'statusCode': 401,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Неверный токен доступа'}),
        }

    params = event.get('queryStringParameters') or {}
    tab = params.get('tab', 'leads')

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'DATABASE_URL не настроен'}),
        }

    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    result = {}
    try:
        if tab == 'chats':
            cur.execute(
                "SELECT id, session_id, messages, created_at, updated_at "
                "FROM chat_conversations ORDER BY updated_at DESC LIMIT 200"
            )
            rows = cur.fetchall()
            result['chats'] = [
                {
                    'id': r['id'],
                    'session_id': r['session_id'],
                    'messages': r['messages'] if isinstance(r['messages'], list) else json.loads(r['messages'] or '[]'),
                    'created_at': r['created_at'].isoformat() if r['created_at'] else None,
                    'updated_at': r['updated_at'].isoformat() if r['updated_at'] else None,
                }
                for r in rows
            ]
        else:
            cur.execute(
                "SELECT id, source, name, phone, email, message, config, price, status, emailed, created_at "
                "FROM leads ORDER BY created_at DESC LIMIT 300"
            )
            rows = cur.fetchall()
            result['leads'] = [
                {
                    'id': r['id'],
                    'source': r['source'],
                    'name': r['name'],
                    'phone': r['phone'],
                    'email': r['email'],
                    'message': r['message'],
                    'config': r['config'],
                    'price': r['price'],
                    'status': r['status'],
                    'emailed': r['emailed'],
                    'created_at': r['created_at'].isoformat() if r['created_at'] else None,
                }
                for r in rows
            ]

        # counters
        cur.execute("SELECT COUNT(*) AS c FROM leads")
        result['leads_count'] = cur.fetchone()['c']
        cur.execute("SELECT COUNT(*) AS c FROM chat_conversations")
        result['chats_count'] = cur.fetchone()['c']
    finally:
        cur.close()
        conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps(result, ensure_ascii=False),
    }
