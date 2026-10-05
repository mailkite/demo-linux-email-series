"""Docs: README.md; run this file from the python directory."""
from tempfile import TemporaryDirectory
from fixtures import mail_servers
from mailflow import connect_imap, message, open_db, poll, submit

with TemporaryDirectory(dir=".") as tmp, mail_servers() as (box, smtp_port, imap_port):
    refused = submit(message(), "127.0.0.1", smtp_port, local=True)
    print("SMTP refused:", refused)
    db = open_db(f"{tmp}/inbox.sqlite")
    with connect_imap("127.0.0.1", imap_port, "fixture", "fixture", local=True) as conn:
        for record in poll(conn, db, "loopback/fixture/INBOX"):
            print("Received:", record["subject"], record["attachments"])
        print("Repeat poll:", len(poll(conn, db, "loopback/fixture/INBOX")))
    db.close()
    db = open_db(f"{tmp}/inbox.sqlite")
    with connect_imap("127.0.0.1", imap_port, "fixture", "fixture", local=True) as conn:
        print("After database reopen:", len(poll(conn, db, "loopback/fixture/INBOX")))
    db.close()
    print("IMAP commands:", "; ".join(box.commands))
