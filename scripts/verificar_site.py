#!/usr/bin/env python3
"""Verifica se o site Gelamour esta no ar e funcionando."""
import sys

try:
    import requests
except ImportError:
    print("Instale: pip install requests")
    sys.exit(1)

URL = "https://santanadesouzanicolas32-sketch.github.io/gelamour/"
ARQUIVOS = [
    "css/styles.css",
    "js/app.js",
    "images/logo.webp",
    "manifest.json",
    "sw.js",
]

def checar(url: str, descricao: str) -> bool:
    try:
        r = requests.get(url, timeout=10)
        ok = r.status_code == 200
        status = "OK" if ok else "ERRO"
        print(f"  [{status}] {descricao} -- HTTP {r.status_code} ({len(r.content)//1024}KB)")
        return ok
    except Exception as e:
        print(f"  [ERRO] {descricao} -- {e}")
        return False

def main():
    print(f"Verificando site: {URL}\n")
    resultados = [checar(URL, "index.html (pagina principal)")]
    for arq in ARQUIVOS:
        resultados.append(checar(f"{URL}{arq}", arq))
    total = sum(resultados)
    if total == len(resultados):
        print(f"\nTudo OK!")
    else:
        print(f"\n{len(resultados)-total} arquivo(s) com problema")
    print(f"Resultado: {total}/{len(resultados)} verificacoes passaram.")

if __name__ == "__main__":
    main()
