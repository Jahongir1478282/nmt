#!/usr/bin/env python3
"""Generate initials-based question file from cryptotest.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data' / 'cryptotest.json'
DEST = ROOT / 'data' / 'cryptotest_initials.json'

alpha_re = re.compile(r"[A-Za-z]")


def initials(text: str) -> str:
    parts = text.split()
    chars = []
    for part in parts:
        m = alpha_re.search(part)
        if m:
            chars.append(m.group(0).lower())
    return ''.join(chars)


def main() -> None:
    data = json.loads(SRC.read_text(encoding='utf-8'))
    out_questions = []
    for q in data.get('questions', []):
        xq = initials(q.get('question', ''))
        out_questions.append({
            'Xquestion': xq,
            'correct_answer': q.get('correct_answer')
        })

    DEST.write_text(json.dumps({'questions': out_questions}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Wrote {len(out_questions)} items to {DEST}")


if __name__ == '__main__':
    main()
