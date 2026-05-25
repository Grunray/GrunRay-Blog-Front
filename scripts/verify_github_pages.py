#!/usr/bin/env python3
"""部署后自检：首页头像与胶片图应返回 200。"""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request

SITE = "https://grunray.github.io/GrunRay-Blog-Front"
HOME = f"{SITE}/index.html#/"


def fetch(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "GrunRay-pages-verify/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def head_status(url: str) -> int:
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "GrunRay-pages-verify/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code


def main() -> int:
    errors: list[str] = []

    html = fetch(f"{SITE}/index.html").decode("utf-8", errors="replace")
    m = re.search(r'src="(/GrunRay-Blog-Front/assets/index-[^"]+\.js)"', html)
    if not m:
        errors.append("index.html 未找到 assets/index-*.js")
        return 1

    js_url = f"https://grunray.github.io{m.group(1)}"
    js = fetch(js_url).decode("utf-8", errors="replace")

    if "/GrunRay-Blog-Front/" not in js:
        errors.append("JS bundle 中未内联 Vite base（/GrunRay-Blog-Front/）")
    if "small_me.gif" not in js or "touxiang" not in js:
        errors.append("JS bundle 缺少首页胶片/头像数据")

    samples = [
        f"{SITE}/content/media/film/homeView/center/avatar/touxiang.jpg",
        f"{SITE}/content/media/film/homeView/right_panel/small_me.gif",
        f"{SITE}/favicon.svg",
    ]
    for url in samples:
        status = head_status(url)
        if status != 200:
            errors.append(f"{url} -> HTTP {status}")

    double = f"{SITE}/GrunRay-Blog-Front/content/media/film/homeView/right_panel/small_me.gif"
    if head_status(double) == 200:
        errors.append(f"检测到双重 base 路径仍可访问（不应出现）: {double}")

    report = {"home": HOME, "js": js_url, "errors": errors}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
