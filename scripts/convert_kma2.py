#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / 'data' / 'kma2.json'

def main():
    data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    old_qs = data.get('questions', [])
    new_qs = []
    for i, q in enumerate(old_qs, start=1):
        options = [a.get('text') for a in q.get('answers', [])]
        correct = None
        for a in q.get('answers', []):
            if a.get('correct'):
                correct = a.get('text')
                break
        new_qs.append({
            'id': i,
            'question': q.get('question'),
            'options': options,
            'correct_answer': correct
        })

    out = {
        'title': data.get('title'),
        'totalQuestions': len(new_qs),
        'questions': new_qs
    }

    DATA_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Converted {len(new_qs)} questions and updated {DATA_FILE}')

if __name__ == '__main__':
    main()
