# Docs: review.md. Run from this directory; no third-party dependencies.
import json
import re
import statistics
import sys
from pathlib import Path

post = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[3] / 'web-monorepo/website/src/content/blog/automate-email-replies-linux-ai.md'
text = post.read_text()
body = text.split('---', 2)[2]
snippets = re.findall(r'```\w*\n(.*?)```', body, re.S)
for snippet in snippets:
    candidates = [Path('quickstart.sh'), Path('mailkite.mjs')]
    # The article's function excludes the module doc comment and later helpers.
    assert any(snippet.strip() in file.read_text() for file in candidates), 'Unmapped code block'
prose = re.sub(r'<figure>.*?</figure>', '', body, flags=re.S)
prose = re.sub(r'```.*?```', '', prose, flags=re.S)
prose = re.sub(r'<!--.*?-->', '', prose, flags=re.S)
prose = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', prose)
words = re.findall(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*", prose)
paragraphs = [p for p in prose.split('\n\n') if p.strip() and not p.startswith(('#', '|', '*Official'))]
sentences = [s for p in paragraphs for s in re.split(r'(?<=[.!?])\s+', p) if len(re.findall(r'\b\w+\b', s)) >= 3]
lengths = [len(re.findall(r'\b\w+\b', s)) for s in sentences]
phrases = ['in today\'s digital landscape', 'game-changer', 'seamlessly', 'leverage', 'deep dive', 'cutting-edge', 'harness the power', 'at its core', 'tapestry', 'furthermore', 'moreover']
result = {
    'earned_words_excluding_svg_code': len(words),
    'code_blocks_mapped': len(snippets),
    'inline_svgs': body.count('<svg '),
    'first_body_visual': body.strip().startswith('<figure>'),
    'TTR_full_prose': round(len(set(w.lower() for w in words)) / len(words), 3),
    'sentence_burstiness': round(statistics.pstdev(lengths) / statistics.mean(lengths), 3),
    'paragraph_word_sd': round(statistics.pstdev([len(p.split()) for p in paragraphs]), 2),
    'trigger_phrases': [p for p in phrases if p in prose.lower()],
    'em_dashes': prose.count('—'),
    'question_h2s': len(re.findall(r'^## .*\?$', prose, re.M)),
    'h2s': len(re.findall(r'^## ', prose, re.M)),
    'flat_multi_sentence_paragraphs': sum(statistics.pstdev([len(s.split()) for s in re.split(r'(?<=[.!?])\s+', p)]) < 4 for p in paragraphs if len(re.split(r'(?<=[.!?])\s+', p)) > 1),
}
print(json.dumps(result, indent=2))
assert 1400 <= len(words) <= 2000, 'Outside requested earned-word range'
assert result['inline_svgs'] == 2
assert result['first_body_visual']
