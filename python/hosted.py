"""Docs: README.md; hosted SDK adapter, no network until send_reply is called."""
import json
from mailkite import MailKite, reply_ok


def accept(signature, raw, secret, db):
    if not MailKite.verifyWebhook(signature, raw, secret):
        raise PermissionError("invalid or stale signature")
    event = json.loads(raw)
    if event.get("type") != "email.received":
        raise ValueError("expected hosted email.received, not self-host metadata")
    # Single durable inbox row; a separate worker handles it after acknowledgement.
    with db:
        db.execute("INSERT OR IGNORE INTO webhook_inbox VALUES (?,?)", (event["id"], raw))
    return reply_ok()


def send_reply(client, event):
    return client.send({
        "from": "support@example.test",
        "to": event["from"]["address"],
        "subject": "Re: " + (event["subject"] or "Support request"),
        "text": "Your request has been recorded.",
        "inReplyTo": event["threadId"],
    })
