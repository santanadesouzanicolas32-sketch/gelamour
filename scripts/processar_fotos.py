#!/usr/bin/env python3
"""
Detecta fotos em scripts/entrada/, converte para WebP otimizado
e salva como product-32.webp (brigadeiro) e product-33.webp (ferrero).
"""
import sys
import subprocess
from pathlib import Path
from PIL import Image

ENTRADA = Path(__file__).parent / "entrada"
DEST    = Path(__file__).parent.parent / "images" / "products"
MAX_SIZE = (900, 900)
QUALITY  = 82

MAPA = {
    "brigadeiro": ("product-32.webp", "Bolo Brigadeiro"),
    "ferrero":    ("product-33.webp", "Bolo Ferrero Rocher"),
}

EXTS = {".jpg", ".jpeg", ".png", ".webp"}

def encontrar(prefixo: str) -> Path | None:
    for ext in EXTS:
        f = ENTRADA / f"{prefixo}{ext}"
        if f.exists():
            return f
    return None

def converter(origem: Path, destino: Path, nome: str) -> bool:
    img = Image.open(origem).convert("RGB")
    img.thumbnail(MAX_SIZE, Image.LANCZOS)
    img.save(destino, "WEBP", quality=QUALITY, method=6)
    kb = destino.stat().st_size // 1024
    print(f"  ✅ {nome} → {destino.name}  ({kb}KB)")
    return True

def main():
    erros = []
    convertidos = []

    for prefixo, (dest_nome, label) in MAPA.items():
        origem = encontrar(prefixo)
        if not origem:
            erros.append(f"  ❌ Não encontrei '{prefixo}.jpg/.jpeg/.png' em scripts/entrada/")
            continue
        converter(origem, DEST / dest_nome, label)
        convertidos.append(dest_nome)

    if erros:
        print("\nFaltando arquivos:")
        for e in erros:
            print(e)
        sys.exit(1)

    print(f"\n{len(convertidos)} imagens convertidas com sucesso!")

if __name__ == "__main__":
    main()
