import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Grunray\AppData\Local\Temp\live-index.js"
s = open(path, encoding="utf-8", errors="replace").read()
print("GrunRay-Blog-Front count", s.count("GrunRay-Blog-Front"))
print("touxiang occurrences", s.count("touxiang"))
for pat in [
    "/GrunRay-Blog-Front/content/media",
    "/content/media/film/homeView",
    "/api/media/files",
]:
    print(pat, s.count(pat))
idx = s.find("touxiang")
if idx >= 0:
    print("touxiang ctx:", s[max(0, idx - 60) : idx + 100])
for m in re.finditer(r'"/GrunRay-Blog-Front/"', s):
    print("found base literal at", m.start())
    break
else:
    for m in re.finditer(r'"/[^"]{0,40}/"', s):
        if "Blog" in m.group(0) or m.group(0) in ('"/"', '"/GrunRay-Blog-Front/"'):
            print("path literal", m.group(0))
# find minified resolve: content/media prefix handling
for pat in ["content/media", "VITE_STATIC", "github-pages", "grunray.home.avatarUrl"]:
    print("pat", pat, s.count(pat))
