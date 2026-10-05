"""Docs: README.md; article's first code block, loopback only."""
from fixtures import mail_servers
from mailflow import connect_imap, message, open_db, poll, submit

with mail_servers() as (box, smtp_port, imap_port):
    submit(message(), "127.0.0.1", smtp_port, local=True)
    db = open_db(":memory:")
    with connect_imap("127.0.0.1", imap_port, "fixture", "fixture", local=True) as conn:
        print(poll(conn, db, "loopback/fixture/INBOX"))
        print("Repeat poll:", poll(conn, db, "loopback/fixture/INBOX"))
    db.close()
