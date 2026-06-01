import json
import os
import smtplib
from email.mime.text import MIMEText
from email.header import Header

import psycopg2

LEAD_EMAIL = 'hello@artora.ru'

FURNITURE_LABELS = {'table': 'Стол', 'shelf': 'Стеллаж', 'nightstand': 'Тумба'}
MATERIAL_LABELS = {'oak': 'Дуб', 'walnut': 'Орех', 'white': 'Белый лак'}
SIZE_LABELS = {'s': '80×60 см', 'm': '120×75 см', 'l': '160×90 см'}
THICKNESS_LABELS = {'t2': '2 см', 't3': '3 см'}
LEGS_LABELS = {'classic': 'Классические', 'cone': 'Конические', 'metal': 'Металлические'}
HEIGHT_LABELS = {'h70': '70 см', 'h75': '75 см', 'h80': '80 см'}
HARDWARE_LABELS = {'none': 'Без ручек', 'h1': 'Латунь', 'h2': 'Матовое железо', 'h3': 'Дерево'}


def _config_to_text(cfg):
    if not cfg or not isinstance(cfg, dict):
        return '—'
    parts = [
        f"Предмет: {FURNITURE_LABELS.get(cfg.get('furniture'), '—')}",
        f"Материал: {MATERIAL_LABELS.get(cfg.get('material'), '—')}",
        f"Размер: {SIZE_LABELS.get(cfg.get('size'), '—')}",
        f"Толщина: {THICKNESS_LABELS.get(cfg.get('thickness'), '—')}",
        f"Ножки/каркас: {LEGS_LABELS.get(cfg.get('legsStyle'), '—')}, {HEIGHT_LABELS.get(cfg.get('legsHeight'), '—')}",
        f"Фурнитура: {HARDWARE_LABELS.get(cfg.get('hardware'), '—')}",
    ]
    return '\n'.join(parts)


def _send_email(subject, body):
    host = os.environ.get('SMTP_HOST')
    user = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASSWORD')
    if not (host and user and password):
        return False
    port = int(os.environ.get('SMTP_PORT', '465'))
    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = Header(subject, 'utf-8')
    msg['From'] = user
    msg['To'] = LEAD_EMAIL
    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            server.starttls()
        server.login(user, password)
        server.sendmail(user, [LEAD_EMAIL], msg.as_string())
        server.quit()
        return True
    except Exception:
        return False


def handler(event, context):
    '''
    Приём заявок из 3D-конструктора и форм. Сохраняет заявку в БД и отправляет
    письмо на hello@artora.ru (если настроен SMTP).
    Args: event с httpMethod, body (source, name, phone, email, message, config, price)
          context - объект с request_id
    Returns: HTTP-ответ со статусом сохранения
    '''
    method = event.get('httpMethod', 'GET')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
        }

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    source = str(body.get('source', 'constructor'))[:32]
    name = (body.get('name') or '')[:200]
    phone = (body.get('phone') or '')[:50]
    email = (body.get('email') or '')[:200]
    message = (body.get('message') or '')[:2000]
    config = body.get('config')
    price = body.get('price')
    try:
        price = int(price) if price is not None else None
    except (ValueError, TypeError):
        price = None

    dsn = os.environ.get('DATABASE_URL')
    lead_id = None
    if dsn:
        try:
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            config_json = json.dumps(config, ensure_ascii=False) if config else None
            cur.execute(
                "INSERT INTO leads (source, name, phone, email, message, config, price) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (source, name, phone, email, message, config_json, price),
            )
            lead_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Не удалось сохранить заявку', 'detail': str(e)[:200]}),
            }

    # Compose & try to send email
    price_str = f"{price:,} ₽".replace(',', ' ') if price else '—'
    email_body = (
        f"Новая заявка с сайта ARTORA (источник: {source})\n\n"
        f"Имя: {name or '—'}\n"
        f"Телефон: {phone or '—'}\n"
        f"Email: {email or '—'}\n"
        f"Сообщение: {message or '—'}\n\n"
        f"Конфигурация:\n{_config_to_text(config)}\n\n"
        f"Стоимость: {price_str}\n"
    )
    emailed = _send_email(f'ARTORA · новая заявка #{lead_id or ""}', email_body)

    if emailed and lead_id and dsn:
        try:
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            cur.execute("UPDATE leads SET emailed = TRUE WHERE id = %s", (lead_id,))
            conn.commit()
            cur.close()
            conn.close()
        except Exception:
            pass

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'ok': True, 'id': lead_id, 'emailed': emailed}),
    }
