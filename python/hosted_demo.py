"""Docs: README.md; real SDK send, local HTTP capture, synthetic signed inbound."""
import json
from mailkite import MailKite
from hosted import accept, send_reply
from mailflow import open_db
from tests.test_mailflow import hosted_event, http_capture, signed

raw = json.dumps(hosted_event()).encode()
db = open_db(":memory:")
print(accept(signed(raw), raw, "fixture-secret", db))
with http_capture() as (url, calls):
    client = MailKite("fixture-key", baseUrl=url)
    print(send_reply(client, hosted_event()))
print(calls[0][0], calls[0][1])
db.close()
