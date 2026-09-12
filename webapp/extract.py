"""Bounded same-host crawl. Public IPs are pinned to prevent DNS rebinding."""
import ipaddress
import os
import socket
import time
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.robotparser import RobotFileParser

import httpx
from bs4 import BeautifulSoup

USER_AGENT = "MakisDemoBot/1.0"


def public_address(url):
    p = urlsplit(url)
    if p.scheme not in ("http", "https") or not p.hostname or p.username or p.password:
        raise ValueError("La URL debe ser pública y usar HTTP o HTTPS.")
    if p.port not in (None, 80, 443):
        raise ValueError("Puerto no permitido.")
    addresses = socket.getaddrinfo(p.hostname, p.port or (443 if p.scheme == "https" else 80), type=socket.SOCK_STREAM)
    ips = {x[4][0] for x in addresses}
    if not ips or any(not ipaddress.ip_address(ip).is_global for ip in ips):
        raise ValueError("No se permite acceder a redes privadas o direcciones locales.")
    return sorted(ips)[0]


def fetch_public(url, host):
    with httpx.Client(timeout=8, trust_env=False, follow_redirects=False) as client:
        for _ in range(6):
            if urlsplit(url).hostname != host:
                raise ValueError("Redirección fuera del dominio solicitado.")
            ip = public_address(url)
            original = httpx.URL(url)
            pinned = original.copy_with(host=ip)
            with client.stream("GET", pinned, headers={"Host": original.netloc.decode(), "User-Agent": USER_AGENT},
                               extensions={"sni_hostname": host}) as response:
                if response.is_redirect:
                    url = urljoin(url, response.headers.get("location", ""))
                    continue
                response.raise_for_status()
                content_type = response.headers.get("content-type", "")
                if not any(x in content_type for x in ("text/", "xml", "html")):
                    raise ValueError("Contenido no textual.")
                chunks, size = [], 0
                for chunk in response.iter_bytes():
                    size += len(chunk)
                    if size > 2_000_000:
                        raise ValueError("Página demasiado grande.")
                    chunks.append(chunk)
                return b"".join(chunks).decode(response.encoding or "utf-8", errors="replace"), str(url)
    raise ValueError("Demasiadas redirecciones.")


def extract_site(url, report):
    public_address(url)
    host = urlsplit(url).hostname
    limit = max(1, min(int(os.getenv("CRAWL_MAX_PAGES", "20")), 100))
    seconds = max(10, min(int(os.getenv("CRAWL_MAX_SECONDS", "90")), 300))
    deadline = time.monotonic() + seconds
    queue, visited, pages, warnings = [url], set(), [], []
    robots = RobotFileParser()
    robots_ok = False
    try:
        txt, _ = fetch_public(urljoin(url, "/robots.txt"), host)
        robots.parse(txt.splitlines())
        robots_ok = True
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code not in (404, 410):
            return {"pages": [], "warnings": ["El sitio no permite verificar robots.txt. Añade una descripción manual."], "discovered": 1, "attempted": 0, "limited": False}
    except Exception:
        return {"pages": [], "warnings": ["No se pudo verificar el acceso al sitio. Añade una descripción manual."], "discovered": 1, "attempted": 0, "limited": False}
    key = os.getenv("EXA_API_KEY", "")
    use_exa = bool(key and key not in ("XXCLAVE1PRUEBAXX", "your_exa_api_key_here", "tu_clave_real_aqui"))
    while queue and len(visited) < limit and time.monotonic() < deadline:
        target = queue.pop(0)
        if target in visited:
            continue
        visited.add(target)
        if robots_ok and not robots.can_fetch(USER_AGENT, target):
            warnings.append("robots.txt excluyó una página.")
            continue
        report(10 + min(40, len(visited) * 2), f"Leyendo el sitio · {len(visited)} página(s) explorada(s)")
        html_text, title, text, method = "", target, "", "scraping"
        # HTML discovers same-domain links, even when Exa provides the clean text.
        try:
            html_text, final_url = fetch_public(target, host)
            soup = BeautifulSoup(html_text, "html.parser")
            title = soup.title.get_text(" ", strip=True) if soup.title else host
            for a in soup.select("a[href]"):
                p = urlsplit(urljoin(final_url, a["href"]))
                candidate = urlunsplit((p.scheme, p.netloc, p.path or "/", "", ""))
                if p.scheme in ("http", "https") and p.hostname == host and not p.username and not p.password and p.port in (None, 80, 443):
                    if not p.path.lower().endswith((".jpg", ".png", ".svg", ".zip", ".pdf", ".mp4")) and candidate not in visited and candidate not in queue and len(queue) < 2000:
                        queue.append(candidate)
            for tag in soup.select("script,style,nav,footer,header,noscript,svg"):
                tag.decompose()
            text = soup.get_text(" ", strip=True)[:10000]
        except Exception:
            warnings.append(f"No se pudo leer HTML de {target}.")
        if use_exa:
            try:
                with httpx.Client(timeout=15, trust_env=False) as client:
                    response = client.post("https://api.exa.ai/contents", headers={"x-api-key": key},
                                           json={"urls": [target], "text": {"maxCharacters": 10000}, "maxAgeHours": 24})
                    response.raise_for_status()
                    result = response.json().get("results", [])
                    if result and result[0].get("text"):
                        text, title, method = result[0]["text"][:10000], result[0].get("title") or title, "exa"
            except Exception:
                warnings.append("Exa no respondió; se utilizó el HTML disponible.")
                use_exa = False
        if len(text.strip()) >= 80:
            pages.append({"url": target, "title": title, "text": text, "method": method})
    if queue:
        warnings.append("Cobertura parcial: se alcanzó el límite de páginas o tiempo. Los enlaces no descubiertos no se contabilizan.")
    return {"pages": pages, "warnings": list(dict.fromkeys(warnings)), "discovered": len(visited) + len(queue),
            "attempted": len(visited), "limited": bool(queue)}
