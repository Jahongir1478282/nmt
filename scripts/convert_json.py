#!/usr/bin/env python3
import json
import sys
from pathlib import Path

def convert_file(fp: Path):
    data = json.loads(fp.read_text(encoding='utf-8'))
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

    fp.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Converted {fp} -> {len(new_qs)} questions')

def main():
    if len(sys.argv) < 2:
        print('Usage: convert_json.py path/to/file.json')
        sys.exit(1)
    path = Path(sys.argv[1])
    if not path.exists():
        print(f'File not found: {path}')
        sys.exit(2)
    convert_file(path)

if __name__ == '__main__':
    main()
