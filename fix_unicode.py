import sys

# Read the JSX file
with open('masaneye-v7.jsx', 'r', encoding='utf-8') as f:
    jsx_content = f.read()

# Strip ES module imports (first 2 lines) and export default
lines = jsx_content.split('\n')
start = 0
for i, line in enumerate(lines):
    if line.startswith('import '):
        start = i + 1
    else:
        break

stripped = '\n'.join(lines[start:])
stripped = stripped.replace('export default function MasanEyeDemo', 'function MasanEyeDemo')

# Now decode all \uXXXX sequences to actual UTF-8 characters
# Handle surrogate pairs (\uD800-\uDBFF followed by \uDC00-\uDFFF)
bslash = chr(92)  # backslash

def is_hex(s):
    return len(s) == 4 and all(c in '0123456789abcdefABCDEF' for c in s)

result = []
i = 0
while i < len(stripped):
    if (i < len(stripped) - 5 and
        stripped[i] == bslash and stripped[i+1] == 'u' and
        is_hex(stripped[i+2:i+6])):
        code = int(stripped[i+2:i+6], 16)
        # Check for surrogate pair
        if 0xD800 <= code <= 0xDBFF:
            if (i + 11 < len(stripped) and
                stripped[i+6] == bslash and stripped[i+7] == 'u' and
                is_hex(stripped[i+8:i+12])):
                low_code = int(stripped[i+8:i+12], 16)
                if 0xDC00 <= low_code <= 0xDFFF:
                    full_code = 0x10000 + (code - 0xD800) * 0x400 + (low_code - 0xDC00)
                    result.append(chr(full_code))
                    i += 12
                    continue
            # Lone surrogate - keep original
            result.append(stripped[i])
            i += 1
            continue
        elif 0xDC00 <= code <= 0xDFFF:
            # Lone low surrogate - keep original
            result.append(stripped[i])
            i += 1
            continue
        else:
            result.append(chr(code))
            i += 6
            continue
    result.append(stripped[i])
    i += 1

decoded = ''.join(result)

# Build HTML
header = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MasanEye v7 — Operational Intelligence Platform (2026-03-16)</title>
</head>
<body style="margin:0;padding:0;background:#08090c;overflow:hidden">
  <div id="root"></div>

  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/three@0.160.0/build/three.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <script type="text/babel">
const { useState, useEffect, useRef } = React;
'''

footer = '''

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(MasanEyeDemo));
  </script>
</body>
</html>
'''

full_html = header + decoded + footer

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(full_html)

print(f'Done - wrote {len(full_html)} chars to index.html')
print(f'Decoded unicode escapes in JSX source')
