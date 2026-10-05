"""Docs: README.md; isolated diagram preview, not the Astro publication gate."""
import argparse
import html
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("article", type=Path)
args = parser.parse_args()


class Preview(BaseHTTPRequestHandler):
    def do_GET(self):
        figures = re.findall(r"<figure>.*?</figure>", args.article.read_text(), re.S)
        theme = "light" if "light" in self.path else "dark"
        bg, fg = ("#ffffff", "#172033") if theme == "light" else ("#0b0d12", "#e4e9f2")
        data = (f"<!doctype html><html lang='en'><meta charset='utf-8'>"
                f"<meta name='viewport' content='width=device-width,initial-scale=1'>"
                f"<title>Python diagram preview</title><style>"
                f"body{{margin:0;background:{bg};color:{fg};font:16px system-ui}}"
                f"main{{max-width:760px;margin:auto;padding:16px}}"
                f"figure{{margin:24px 0 48px}}figcaption{{line-height:1.6;margin-top:16px}}"
                f"</style><main><h1>{html.escape('Python integration diagrams')}</h1>"
                + "".join(figures) + "</main></html>").encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 4327), Preview).serve_forever()
