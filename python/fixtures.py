"""Docs: README.md; narrow loopback fixtures, never public mail servers."""
import socket
import socketserver
import threading
from contextlib import contextmanager
from aiosmtpd.controller import Controller


class Mailbox:
    def __init__(self):
        self.validity = 101
        self.messages = {}
        self.next_uid = 1
        self.commands = []
        self.fail_fetch = None
        self.search_no = False
        self.lock = threading.Lock()

    async def handle_DATA(self, server, session, envelope):
        with self.lock:
            self.messages[self.next_uid] = envelope.original_content
            self.next_uid += 1
        return "250 stored locally"

    async def handle_RCPT(self, server, session, envelope, address, rcpt_options):
        if address != "support@example.test":
            return "550 fixture only accepts support@example.test"
        envelope.rcpt_tos.append(address)
        return "250 accepted"


class IMAPFixture(socketserver.StreamRequestHandler):
    def send(self, line):
        self.wfile.write(line.encode() + b"\r\n")

    def handle(self):
        self.connection.settimeout(10)
        self.send("* OK loopback IMAP fixture")
        authenticated = False
        selected = False
        box = self.server.box
        while line := self.rfile.readline():
            words = line.decode().strip().split()
            tag, command = words[:2]
            command = command.upper()
            box.commands.append(command if command != "UID" else " ".join(words[1:]))
            if command == "CAPABILITY":
                self.send("* CAPABILITY IMAP4rev1")
            elif command == "LOGIN":
                authenticated = words[2:] == ["fixture", '"fixture"']
                if not authenticated:
                    self.send(f"{tag} NO bad credentials")
                    continue
            elif command == "LOGOUT":
                self.send("* BYE closing")
                self.send(f"{tag} OK LOGOUT complete")
                return
            elif not authenticated:
                self.send(f"{tag} NO authenticate first")
                continue
            elif command == "EXAMINE":
                selected = True
                self.send(f"* {len(box.messages)} EXISTS")
                self.send(f"* OK [UIDVALIDITY {box.validity}] epoch")
                self.send(f"* OK [UIDNEXT {box.next_uid}] next")
            elif command == "UID" and selected and words[2].upper() == "SEARCH":
                if box.search_no:
                    self.send(f"{tag} NO injected search failure")
                    continue
                start = int(words[-1].split(":")[0])
                # Deliberately implement rev1 reverse-range edge case, not a naive > filter.
                upper = max(box.messages, default=0)
                found = [uid for uid in sorted(box.messages) if min(start, upper) <= uid <= max(start, upper)]
                self.send("* SEARCH " + " ".join(map(str, found)))
            elif command == "UID" and selected and words[2].upper() == "FETCH":
                uid = int(words[3])
                raw = box.messages.get(uid) if box.fail_fetch != uid else None
                if raw is not None:
                    seq = sorted(box.messages).index(uid) + 1
                    self.send(f"* {seq} FETCH (UID {uid} BODY[] {{{len(raw)}}}")
                    self.wfile.write(raw + b")\r\n")
            else:
                self.send(f"{tag} BAD unsupported fixture command")
                continue
            suffix = "[READ-ONLY] " if command == "EXAMINE" else ""
            self.send(f"{tag} OK {suffix}{command} complete")


@contextmanager
def mail_servers():
    box = Mailbox()
    # Controller needs an explicit port; reserve an ephemeral one before startup.
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        smtp_port = reservation.getsockname()[1]
    smtp = Controller(box, hostname="127.0.0.1", port=smtp_port)
    imap = socketserver.ThreadingTCPServer(("127.0.0.1", 0), IMAPFixture)
    imap.daemon_threads = True
    imap.box = box
    thread = threading.Thread(target=imap.serve_forever, daemon=True)
    try:
        smtp.start()
        thread.start()
        yield box, smtp_port, imap.server_address[1]
    finally:
        smtp.stop()
        if thread.is_alive():
            imap.shutdown()
            thread.join()
        imap.server_close()
