import ipaddress
import re
import socket
from urllib.parse import urlparse

import httpx

MAX_BYTES = 200_000  # OG tags live in <head>; no need to read a whole page
FETCH_TIMEOUT = 6.0
USER_AGENT = (
    "Mozilla/5.0 (compatible; VybeLinkPreview/1.0; +https://vybe.app)"
)

_META_TAG_RE = re.compile(r"<meta\b[^>]*>", re.IGNORECASE)
_ATTR_RE = re.compile(r'(\w[\w:-]*)\s*=\s*"([^"]*)"|(\w[\w:-]*)\s*=\s*\'([^\']*)\'', re.IGNORECASE)
_TITLE_TAG_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)


class UnsafeUrlError(Exception):
    pass


def _is_public_host(hostname: str) -> bool:
    """Resolve the hostname and reject anything pointing at a private,
    loopback, link-local, or otherwise internal address — a link-preview
    fetcher is a classic SSRF vector (e.g. a message containing a link to
    http://169.254.169.254/ or an internal service) if this isn't checked."""
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private or ip.is_loopback or ip.is_link_local
            or ip.is_multicast or ip.is_reserved or ip.is_unspecified
        ):
            return False
    return True


def _assert_safe_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise UnsafeUrlError("Only http/https links are supported")
    if not parsed.hostname:
        raise UnsafeUrlError("Invalid URL")
    if not _is_public_host(parsed.hostname):
        raise UnsafeUrlError("This URL can't be previewed")
    return url


def _parse_meta_attrs(tag: str) -> dict:
    attrs = {}
    for m in _ATTR_RE.finditer(tag):
        key = (m.group(1) or m.group(3) or "").lower()
        val = m.group(2) if m.group(2) is not None else m.group(4)
        attrs[key] = val
    return attrs


def _extract_og(html: str) -> dict:
    tags: dict[str, str] = {}
    for tag in _META_TAG_RE.findall(html):
        attrs = _parse_meta_attrs(tag)
        key = attrs.get("property") or attrs.get("name")
        if key and "content" in attrs:
            tags.setdefault(key.lower(), attrs["content"])

    title = tags.get("og:title") or tags.get("twitter:title")
    if not title:
        m = _TITLE_TAG_RE.search(html)
        if m:
            title = re.sub(r"\s+", " ", m.group(1)).strip()

    description = tags.get("og:description") or tags.get("twitter:description") or tags.get("description")
    image = tags.get("og:image") or tags.get("twitter:image")

    return {"title": title, "description": description, "image": image}


async def fetch_link_preview(url: str) -> dict:
    safe_url = _assert_safe_url(url)
    hostname = urlparse(safe_url).hostname or ""

    async with httpx.AsyncClient(
        follow_redirects=True, timeout=FETCH_TIMEOUT, max_redirects=3,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html"},
    ) as client:
        async with client.stream("GET", safe_url) as resp:
            resp.raise_for_status()
            # Each redirect hop must itself resolve to a public address —
            # httpx.stream() only connects the final hop lazily, so re-check.
            final_host = urlparse(str(resp.url)).hostname or hostname
            if not _is_public_host(final_host):
                raise UnsafeUrlError("This URL can't be previewed")

            content_type = resp.headers.get("content-type", "")
            if "text/html" not in content_type:
                return {"url": safe_url, "hostname": hostname, "title": None, "description": None, "image": None}

            chunks = []
            total = 0
            async for chunk in resp.aiter_bytes():
                chunks.append(chunk)
                total += len(chunk)
                if total >= MAX_BYTES:
                    break
            html = b"".join(chunks).decode(resp.encoding or "utf-8", errors="ignore")

    og = _extract_og(html)
    return {"url": safe_url, "hostname": hostname, **og}
