#!/usr/bin/env python3
"""Relatorio de participacoes da Roleta VIP Gelamour via Supabase REST API."""
import json
import sys
from datetime import datetime

try:
    import requests
except ImportError:
    print("Instale as dependencias: pip install -r requirements.txt")
    sys.exit(1)

# Configurar antes de usar
SUPABASE_URL = input("URL do Supabase (ex: https://xxx.supabase.co): ").strip()
SUPABASE_KEY = input("Anon key do Supabase: ").strip()

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def buscar(tabela: str, params: dict = None):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{tabela}", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()

def main():
    print("\n=== RELATORIO ROLETA VIP GELAMOUR ===")
    print(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")

    participacoes = buscar("roleta_participacoes", {"order": "created_at.desc", "limit": "50"})
    vencedores = buscar("roleta_vencedores", {"order": "created_at.desc", "limit": "10"})

    print(f"Total participacoes (ultimas 50): {len(participacoes)}")
    pendentes = sum(1 for p in participacoes if p.get("status") == "pendente")
    aprovados = sum(1 for p in participacoes if p.get("status") == "aprovado")
    print(f"   Pendentes: {pendentes}")
    print(f"   Aprovados: {aprovados}")

    print(f"\nVencedores recentes ({len(vencedores)}):")
    for v in vencedores[:5]:
        tel = v.get("telefone", "?")[-4:]
        premio = v.get("premio", "?")
        data = v.get("created_at", "")[:10]
        print(f"   {data} -- ***{tel} -> {premio}")

    print("\nRelatorio concluido.")

if __name__ == "__main__":
    main()
