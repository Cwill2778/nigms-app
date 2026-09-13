with open('src/pages/Admin.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
match = re.search(r'(function CustomersPanel\(\) \{.*?\n\})', text, re.DOTALL)
if match:
    block = match.group(1)
    lines = block.split('\n')
    for i, line in enumerate(lines[190:340]):
        print(f'{i+190}: {line.strip()}')
