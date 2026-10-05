"""Docs: README.md; snippet parity and reproducible editorial diagnostics."""
import argparse
import ast
import re
import statistics
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("article", type=Path)
args = parser.parse_args()
source = args.article.read_text()
body = source.split("---", 2)[2]
blocks = re.findall(r"```python\n(.*?)```", body, re.S)
files = ["quickstart.py", "mime_example.py", "hosted.py"]
for block, name in zip(blocks, files, strict=True):
    snippet_tree = ast.dump(ast.parse(block), include_attributes=False)
    full = ast.parse(Path(__file__).with_name(name).read_text())
    full.body.pop(0)  # module documentation string
    file_tree = ast.dump(full, include_attributes=False)
    if name == "hosted.py":
        full.body.pop()  # send_reply is not in this excerpt
        file_tree = ast.dump(full, include_attributes=False)
    assert snippet_tree == file_tree, f"snippet differs: {name}"
    print(f"Snippet AST parity: {name} PASS")
assert len(re.findall(r"<svg\b", body)) == 2
assert body.lstrip().startswith("<figure>")
clean = re.sub(r"<figure>.*?</figure>|```.*?```|<!--.*?-->", "", body, flags=re.S)
clean = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", clean)
tokens = re.findall(r"\b[\w'-]+\b", clean.lower())
prose = "\n\n".join(p for p in clean.split("\n\n") if not p.lstrip().startswith(("|", "#", "*Sources")))
sentences = [re.findall(r"\b[\w'-]+\b", s) for s in re.split(r"[.!?]+\s+", prose)]
lengths = [len(s) for s in sentences if s]
print("Body words excluding SVG/code:", len(tokens))
print("Prose words excluding table/headings:", len(re.findall(r"\b[\w'-]+\b", prose)))
print("TTR (body, lowercase):", round(len(set(tokens)) / len(tokens), 3))
print("Sentence burstiness (diagnostic):", round(statistics.pstdev(lengths) / statistics.mean(lengths), 3))
paragraph_lengths = [len(re.findall(r"\b[\w'-]+\b", p)) for p in prose.split("\n\n") if p.strip()]
print("Paragraph words min/max/SD:", min(paragraph_lengths), max(paragraph_lengths), round(statistics.pstdev(paragraph_lengths), 2))
openers = [s[0].lower() for s in sentences if s]
from collections import Counter
print("Top-three sentence-opening share:", round(sum(n for _, n in Counter(openers).most_common(3)) / len(openers), 3))
print("Meta description chars:", len(re.search(r'metaDescription: "(.*?)"', source)[1]))
print("Two built SVGs and top visual: PASS")
