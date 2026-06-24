#!/usr/bin/env python3
"""Otimiza imagens WebP do projeto Gelamour."""
import os
import sys
from pathlib import Path
from PIL import Image

PROJECT_DIR = Path(__file__).parent.parent
IMAGES_DIR = PROJECT_DIR / "images"

def otimizar(caminho: Path, qualidade: int = 82) -> None:
    original = caminho.stat().st_size
    img = Image.open(caminho)
    img.save(caminho, "WEBP", quality=qualidade, method=6)
    novo = caminho.stat().st_size
    economia = (1 - novo / original) * 100
    print(f"  {caminho.name}: {original//1024}KB -> {novo//1024}KB ({economia:.1f}% menor)")

def main():
    webps = list(IMAGES_DIR.rglob("*.webp"))
    if not webps:
        print("Nenhuma imagem encontrada.")
        return
    print(f"Otimizando {len(webps)} imagens em {IMAGES_DIR}...\n")
    for f in webps:
        try:
            otimizar(f)
        except Exception as e:
            print(f"  ERRO em {f.name}: {e}")
    print("\nConcluido!")

if __name__ == "__main__":
    main()
