"""Docs: README.md; durable new-message ingestion, not full mailbox sync."""
import imaplib
import json
import re
import smtplib
import sqlite3
import ssl
from email import policy
from email.message import EmailMessage
from email.parser import BytesParser


def message():
    msg = EmailMessage()
    msg["From"] = "sender@example.test"
    msg["To"] = "support@example.test"
    msg["Subject"] = "Résumé for ticket 42"
    msg["Message-ID"] = "<ticket42@example.test>"
    msg.set_content("Please check ticket 42.\n.dot-stuffing survives\n")
    msg.add_alternative("<p>Please check ticket 42.</p>", subtype="html")
    msg.add_attachment(b"ticket,value\n42,7\n", maintype="text", subtype="csv", filename="ticket.csv")
    return msg


def submit(msg, host, port, username=None, password=None, *, local=False):
    if local and host != "127.0.0.1":
        raise ValueError("cleartext is only for the loopback fixture")
    with smtplib.SMTP(host, port, timeout=10) as smtp:
        smtp.ehlo()
        if not local:
            smtp.starttls(context=ssl.create_default_context())
            smtp.ehlo()
            smtp.login(username, password)
        return smtp.send_message(msg)


def connect_imap(host, port, username, password, *, local=False):
    if local and host != "127.0.0.1":
        raise ValueError("cleartext is only for the loopback fixture")
    if local:
        conn = imaplib.IMAP4(host, port, timeout=10)
    else:
        conn = imaplib.IMAP4_SSL(host, port, ssl_context=ssl.create_default_context(), timeout=10)
    conn.socket().settimeout(10)
    try:
        conn.login(username, password)
    except Exception:
        conn.shutdown()
        raise
    return conn


def open_db(path):
    db = sqlite3.connect(path)
    db.executescript("""
        CREATE TABLE IF NOT EXISTS cursor (
            scope TEXT PRIMARY KEY, validity INTEGER NOT NULL, last_uid INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS inbox (
            scope TEXT, validity INTEGER, uid INTEGER, raw BLOB NOT NULL, parsed TEXT NOT NULL,
            PRIMARY KEY (scope, validity, uid));
        CREATE TABLE IF NOT EXISTS webhook_inbox (
            id TEXT PRIMARY KEY, payload BLOB NOT NULL);
    """)
    return db


def parse(raw):
    msg = BytesParser(policy=policy.default).parsebytes(raw)
    part = msg.get_body(preferencelist=("plain",))
    return {
        "subject": str(msg["Subject"]) if msg["Subject"] is not None else None,
        "message_id": str(msg["Message-ID"]) if msg["Message-ID"] else None,
        "text": part.get_content() if part else None,
        "attachments": [p.get_filename() for p in msg.iter_attachments()],
        "defects": [type(d).__name__ for p in msg.walk() for d in p.defects],
    }


def checked(result):
    status, data = result
    if status != "OK":
        raise RuntimeError(f"IMAP {status}: {data!r}")
    return data


def poll(conn, db, scope):
    # One worker owns a scope. scope must include server/account/mailbox identity.
    checked(conn.select("INBOX", readonly=True))
    validity_data = conn.response("UIDVALIDITY")[1]
    if not validity_data or not validity_data[0]:
        raise RuntimeError("missing UIDVALIDITY; cannot safely resume")
    validity = int(validity_data[0])
    saved = db.execute("SELECT validity,last_uid FROM cursor WHERE scope=?", (scope,)).fetchone()
    last = saved[1] if saved and saved[0] == validity else 0
    # IMAP4rev1 n:* can include the previous maximum when n exceeds it.
    data = checked(conn.uid("SEARCH", None, "UID", f"{last + 1}:*"))
    uids = sorted({int(uid) for uid in (data[0] or b"").split() if int(uid) > last})
    records = []
    for uid in uids:
        fetched = checked(conn.uid("FETCH", str(uid), "(UID BODY.PEEK[])"))
        literals = [item[1] for item in fetched if isinstance(item, tuple)
                    and re.search(rb"\bUID\s+" + str(uid).encode() + rb"\b", item[0])]
        if len(literals) != 1:
            raise RuntimeError(f"UID {uid}: missing/ambiguous literal; cursor unchanged for this UID")
        raw = literals[0]
        record = parse(raw)
        with db:
            inserted = db.execute("INSERT OR IGNORE INTO inbox VALUES (?,?,?,?,?)",
                                  (scope, validity, uid, raw, json.dumps(record))).rowcount
            db.execute("INSERT OR REPLACE INTO cursor VALUES (?,?,?)", (scope, validity, uid))
        if inserted:
            records.append(record)
    return records
