"""Docs: ../README.md; tests perform real loopback protocol exchanges."""
import hashlib
import hmac
import imaplib
import json
import smtplib
import tempfile
import time
import unittest
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from mailkite import MailKite
from fixtures import mail_servers
from hosted import accept, send_reply
from http_adapters import jmap_query, postal_send, wildduck_list
from mailflow import connect_imap, message, open_db, poll, submit


@contextmanager
def http_capture():
    calls = []

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def respond(self):
            raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            calls.append((self.command, self.path, dict(self.headers), json.loads(raw) if raw else None))
            if self.path == "/.well-known/jmap":
                body = {"apiUrl": f"http://127.0.0.1:{self.server.server_port}/jmap",
                        "primaryAccounts": {"urn:ietf:params:jmap:mail": "account1"}}
            elif self.path == "/jmap":
                body = {"methodResponses": [["Email/query", {"ids": ["email1"]}, "q"]]}
            elif self.path == "/api/v1/send/message":
                body = {"status": "success", "data": {"message_id": "local-postal"}}
            elif self.path.startswith("/users/"):
                body = {"success": True, "results": []}
            else:
                body = {"id": "local-capture", "status": "sent"}
            data = json.dumps(body).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        do_POST = respond
        do_GET = respond

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}", calls
    finally:
        server.shutdown()
        thread.join()
        server.server_close()


def hosted_event():
    return {
        "id": "msg_4f3c1a9e2b7d48e1a05c6f8b3d2e7a91", "type": "email.received",
        "from": {"address": "sender@example.test", "name": None},
        "to": [{"address": "support@example.test", "name": None}],
        "subject": None, "text": None, "html": "<p>Help</p>", "textFromHtml": "Help",
        "threadId": "<ticket42@example.test>", "receivedAt": 1791158400000,
        "receivedAtIso": "2026-10-05T00:00:00.000Z",
        "auth": {"spf": None, "dkim": None, "dmarc": None,
                 "spam": None, "spamScore": None, "spamSignals": None}, "attachments": [],
    }


def signed(raw, timestamp=None):
    t = str(timestamp if timestamp is not None else int(time.time() * 1000))
    digest = hmac.new(b"fixture-secret", t.encode() + b"." + raw, hashlib.sha256).hexdigest()
    return f"t={t},v1={digest}"


class ProtocolTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=".")
        self.path = self.tmp.name + "/inbox.sqlite"
        self.db = open_db(self.path)
        self.servers = mail_servers()
        self.box, self.smtp, self.imap = self.servers.__enter__()

    def tearDown(self):
        self.servers.__exit__(None, None, None)
        self.db.close()
        self.tmp.cleanup()

    def receive(self, scope="loopback/fixture/INBOX"):
        with connect_imap("127.0.0.1", self.imap, "fixture", "fixture", local=True) as conn:
            return poll(conn, self.db, scope)

    def send(self):
        return submit(message(), "127.0.0.1", self.smtp, local=True)

    def test_smtp_mime_imap_and_persistent_cursor(self):
        self.assertEqual(self.send(), {})
        record, = self.receive()
        self.assertEqual(record["subject"], "Résumé for ticket 42")
        self.assertEqual(record["attachments"], ["ticket.csv"])
        self.assertIn(".dot-stuffing survives", record["text"])
        self.assertEqual(record["defects"], [])
        self.assertEqual(self.receive(), [])
        self.db.close()
        self.db = open_db(self.path)
        self.assertEqual(self.receive(), [])
        self.assertIn("UID FETCH 1 (UID BODY.PEEK[])", self.box.commands)
        self.assertIn("EXAMINE", self.box.commands)

    def test_uid_gap_and_epoch_rebuild(self):
        self.box.next_uid = 7
        self.send()
        self.assertEqual(len(self.receive()), 1)
        self.box.validity += 1
        self.box.messages = {1: self.box.messages[7]}
        self.box.next_uid = 2
        self.assertEqual(len(self.receive()), 1)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM inbox").fetchone()[0], 2)

    def test_partial_batch_failure_does_not_skip_failed_uid(self):
        self.send()
        self.send()
        self.box.fail_fetch = 2
        with self.assertRaisesRegex(RuntimeError, "UID 2"):
            self.receive()
        self.assertEqual(self.db.execute("SELECT last_uid FROM cursor").fetchone()[0], 1)
        self.box.fail_fetch = None
        self.assertEqual(len(self.receive()), 1)
        self.assertEqual(self.receive(), [])

    def test_search_failure_leaves_database_empty(self):
        self.send()
        self.box.search_no = True
        with self.assertRaisesRegex(RuntimeError, "IMAP NO"):
            self.receive()
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM cursor").fetchone()[0], 0)

    def test_cursor_scopes_are_independent(self):
        self.send()
        self.assertEqual(len(self.receive("server1/account/INBOX")), 1)
        self.assertEqual(len(self.receive("server2/account/INBOX")), 1)

    def test_bad_imap_login_and_refused_smtp_recipient(self):
        with self.assertRaises(imaplib.IMAP4.error):
            connect_imap("127.0.0.1", self.imap, "fixture", "wrong", local=True)
        msg = message()
        msg.replace_header("To", "other@example.test")
        with self.assertRaises(smtplib.SMTPRecipientsRefused):
            submit(msg, "127.0.0.1", self.smtp, local=True)
        self.assertEqual(self.box.messages, {})

    def test_cleartext_guard(self):
        with self.assertRaises(ValueError):
            submit(message(), "smtp.example.test", 587, local=True)
        with self.assertRaises(ValueError):
            connect_imap("imap.example.test", 993, "user", "password", local=True)


class WebhookTests(unittest.TestCase):
    def test_signature_tamper_staleness_duplicate_and_selfhost(self):
        db = open_db(":memory:")
        self.addCleanup(db.close)
        raw = json.dumps(hosted_event()).encode()
        sig = signed(raw)
        self.assertEqual(accept(sig, raw, "fixture-secret", db), '{"status":"ok"}')
        accept(sig, raw, "fixture-secret", db)
        self.assertEqual(db.execute("SELECT COUNT(*) FROM webhook_inbox").fetchone()[0], 1)
        for signature, payload in [(sig, raw + b" "), (signed(raw, 1), raw),
                                   (signed(raw, int(time.time())), raw)]:
            with self.assertRaises(PermissionError):
                accept(signature, payload, "fixture-secret", db)
        local_raw = b'{"event":"inbound","uid":1}'
        with self.assertRaises(ValueError):
            accept(signed(local_raw), local_raw, "fixture-secret", db)

    def test_real_sdk_http_send_contract(self):
        with http_capture() as (url, calls):
            client = MailKite("fixture-key", baseUrl=url)
            result = send_reply(client, hosted_event())
        self.assertEqual(result["id"], "local-capture")
        method, path, headers, body = calls[0]
        self.assertEqual((method, path), ("POST", "/v1/send"))
        self.assertEqual(headers["Authorization"], "Bearer fixture-key")
        self.assertEqual(body["inReplyTo"], "<ticket42@example.test>")
        self.assertEqual(body["subject"], "Re: Support request")

    def test_official_http_adapter_requests(self):
        with http_capture() as (url, calls):
            self.assertEqual(postal_send(url, "postal-fixture")["message_id"], "local-postal")
            wildduck_list(url, "wildduck-fixture", "user1", "inbox1")
            self.assertEqual(jmap_query(url + "/.well-known/jmap", "jmap-fixture")[0][0], "Email/query")
        self.assertEqual({k.lower(): v for k, v in calls[0][2].items()}["x-server-api-key"], "postal-fixture")
        self.assertIn("plain_body", calls[0][3])
        self.assertEqual(calls[1][1], "/users/user1/mailboxes/inbox1/messages")
        self.assertEqual({k.lower(): v for k, v in calls[1][2].items()}["x-access-token"], "wildduck-fixture")
        self.assertEqual(calls[3][3]["methodCalls"][0][1]["accountId"], "account1")


if __name__ == "__main__":
    unittest.main()
