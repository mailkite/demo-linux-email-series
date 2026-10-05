"""Docs: README.md; parsing raw MIME independently of the transport."""
from email import policy
from email.parser import BytesParser
from mailflow import message

raw = message().as_bytes(policy=policy.SMTP)
msg = BytesParser(policy=policy.default).parsebytes(raw)
plain = msg.get_body(preferencelist=("plain",))
print(str(msg["Subject"]))
print(plain.get_content() if plain else None)
print([part.get_filename() for part in msg.iter_attachments()])
