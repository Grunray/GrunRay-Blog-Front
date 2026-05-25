import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Grunray\AppData\Local\Temp\live-index.js"
s = open(path, encoding="utf-8", errors="replace").read()

idx = s.find("function vv")
print("vv at", idx)
if idx >= 0:
    print(s[idx : idx + 500])

for m in re.finditer("grunray.home.avatarUrl.v1", s):
    ctx = s[max(0, m.start() - 120) : m.start() + 400]
    if "readSession" in ctx or "sessionStorage" in ctx or "writeSession" in ctx:
        print("CACHE CODE at", m.start())
        print(ctx)
        break
else:
    for m in re.finditer("grunray.home.avatarUrl.v1", s):
        print("key at", m.start(), s[m.start() - 50 : m.start() + 80])

for pat in ["/api/media/list/filmfeed", "/api/media/list?"]:
    i = s.find(pat)
    print(pat, "first at", i)
    if i >= 0:
        print(s[i - 80 : i + 200])
