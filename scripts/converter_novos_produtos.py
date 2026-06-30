#!/usr/bin/env python3
"""
Converte as fotos dos 2 novos bolos para WebP otimizado.

Uso:
  python scripts/converter_novos_produtos.py <foto_brigadeiro> <foto_ferrero>

Exemplo:
  python scripts/converter_novos_produtos.py C:/Users/santa/Downloads/brigadeiro.jpg C:/Users/santa/Downloads/ferrero.jpg
"""
import sys
from pathlib import Path
from PIL import Image

DEST = Path(__file__).parent.parent / "images" / "products"
MAX_SIZE = (900, 900)
QUALITY = 82

def converter(origem: str, destino: Path) -> None:
    img = Image.open(origem)
    img = img.convert("RGB")
    img.thumbnail(MAX_SIZE, Image.LANCZOS)
    img.save(destino, "WEBP", quality=QUALITY, method=6)
    kb = destino.stat().st_size // 1024
    print(f"  ✅ {destino.name}: {kb}KB")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python scripts/converter_novos_produtos.py <foto_brigadeiro> <foto_ferrero>")
        sys.exit(1)
    print("Convertendo imagens para WebP...\n")
    converter(sys.argv[1], DEST / "product-32.webp")
    converter(sys.argv[2], DEST / "product-33.webp")
    print("\nPronto! Adicione ao git e faça push.")
