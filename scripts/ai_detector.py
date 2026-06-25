#!/usr/bin/env python3
"""
ai_detector.py — Gelamour AI Code Analyzer
Varre arquivos do projeto, detecta erros via Claude e sugere/aplica correções.
Uso: python scripts/ai_detector.py [--fix] [--file <caminho>]
"""

import os
import sys
import argparse
import json
from pathlib import Path
from datetime import datetime

try:
    import anthropic
except ImportError:
    print("❌  Instale o SDK: pip install anthropic")
    sys.exit(1)

# ─── Configuração ─────────────────────────────────────────────────────────────

API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL   = "claude-opus-4-8"

# Extensões e padrões a ignorar
IGNORE_DIRS  = {"node_modules", ".git", "backend", "__pycache__", ".cache", "dist"}
IGNORE_FILES = {"app.js", "package-lock.json"}
MAX_FILE_BYTES = 80_000  # arquivos > 80KB são resumidos

EXTENSIONS = {
    ".ts":   "TypeScript",
    ".js":   "JavaScript",
    ".py":   "Python",
    ".sql":  "SQL",
    ".html": "HTML",
    ".css":  "CSS",
    ".json": "JSON",
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def coletar_arquivos(raiz: Path, arquivo_unico: str | None = None) -> list[Path]:
    if arquivo_unico:
        p = Path(arquivo_unico)
        return [p] if p.exists() else []

    arquivos = []
    for path in sorted(raiz.rglob("*")):
        if any(d in path.parts for d in IGNORE_DIRS):
            continue
        if path.name in IGNORE_FILES:
            continue
        if path.suffix in EXTENSIONS and path.is_file():
            arquivos.append(path)
    return arquivos


def ler_arquivo(path: Path) -> str:
    try:
        tamanho = path.stat().st_size
        texto = path.read_text(encoding="utf-8", errors="replace")
        if tamanho > MAX_FILE_BYTES:
            linhas = texto.splitlines()
            return "\n".join(linhas[:300]) + f"\n\n[... arquivo truncado — {len(linhas)} linhas totais]"
        return texto
    except Exception as e:
        return f"[Erro ao ler arquivo: {e}]"


def formatar_caminho(path: Path, raiz: Path) -> str:
    try:
        return str(path.relative_to(raiz))
    except ValueError:
        return str(path)


# ─── Análise via Claude ────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Você é um auditor de código sênior especializado em projetos TypeScript/Python/SQL.
Analise o arquivo fornecido e identifique:
1. Bugs reais ou potenciais (lógica, race conditions, null-safety, etc.)
2. Problemas de segurança (XSS, injeção, exposição de credenciais, etc.)
3. Erros de tipagem ou uso incorreto de APIs
4. Problemas de performance críticos
5. Padrões ruins que causarão problemas em produção

Para CADA problema encontrado, forneça:
- Severidade: CRÍTICO | ALTO | MÉDIO | BAIXO
- Linha aproximada
- Descrição clara do problema
- Correção sugerida (código exato quando possível)

Se o arquivo estiver correto, responda apenas: "✅ Nenhum problema encontrado."

Seja objetivo e direto. Não repita o código inteiro — apenas as partes relevantes."""


def analisar_arquivo(client: anthropic.Anthropic, path: Path, conteudo: str, linguagem: str) -> dict:
    prompt = f"""Arquivo: {path}
Linguagem: {linguagem}

```{linguagem.lower()}
{conteudo}
```

Analise este arquivo e reporte todos os problemas encontrados."""

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        analise = ""
        for bloco in response.content:
            if bloco.type == "text":
                analise = bloco.text
                break

        tem_problema = "✅ Nenhum problema" not in analise
        return {
            "arquivo": str(path),
            "linguagem": linguagem,
            "analise": analise,
            "tem_problema": tem_problema,
            "tokens_usados": response.usage.input_tokens + response.usage.output_tokens,
        }

    except anthropic.APIError as e:
        return {
            "arquivo": str(path),
            "linguagem": linguagem,
            "analise": f"[Erro na API: {e}]",
            "tem_problema": False,
            "tokens_usados": 0,
        }


def gerar_correcao(client: anthropic.Anthropic, path: Path, conteudo: str, analise: str) -> str:
    """Dado o resultado da análise, pede ao Claude a versão corrigida do arquivo."""
    prompt = f"""O arquivo `{path}` tem os seguintes problemas detectados:

{analise}

Aqui está o conteúdo atual:
```
{conteudo}
```

Gere APENAS o conteúdo corrigido do arquivo, sem explicações adicionais.
Preserve toda a lógica existente — corrija apenas os problemas listados."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=8192,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": prompt}],
    )

    for bloco in response.content:
        if bloco.type == "text":
            # Remove markdown code fences se presentes
            texto = bloco.text.strip()
            if texto.startswith("```"):
                linhas = texto.splitlines()
                inicio = 1
                fim = len(linhas)
                if linhas[-1].strip() == "```":
                    fim = len(linhas) - 1
                return "\n".join(linhas[inicio:fim])
            return texto

    return conteudo  # fallback: retorna original sem modificar


# ─── Relatório ────────────────────────────────────────────────────────────────

def imprimir_resultado(resultado: dict, idx: int, total: int) -> None:
    arquivo = resultado["arquivo"]
    lang    = resultado["linguagem"]
    analise = resultado["analise"]
    tem_prob = resultado["tem_problema"]
    tokens  = resultado["tokens_usados"]

    status = "⚠️ " if tem_prob else "✅"
    print(f"\n{'─'*60}")
    print(f"{status} [{idx}/{total}] {arquivo}  ({lang})  [{tokens} tokens]")

    if tem_prob:
        print(analise)
    else:
        print("   Nenhum problema encontrado.")


def salvar_relatorio(resultados: list[dict], raiz: Path) -> Path:
    ts    = datetime.now().strftime("%Y%m%d_%H%M%S")
    saida = raiz / "scripts" / f"relatorio_ai_{ts}.json"
    saida.write_text(
        json.dumps(resultados, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    return saida


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Gelamour AI Code Detector — powered by Claude")
    parser.add_argument("--fix",  action="store_true", help="Aplica correções automaticamente nos arquivos")
    parser.add_argument("--file", type=str,            help="Analisa apenas este arquivo")
    parser.add_argument("--save", action="store_true", help="Salva relatório JSON em scripts/")
    args = parser.parse_args()

    if not API_KEY:
        print("❌  Defina a variável de ambiente ANTHROPIC_API_KEY antes de executar.")
        print("   Exemplo: set ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    raiz    = Path(__file__).parent.parent
    client  = anthropic.Anthropic(api_key=API_KEY)
    arquivos = coletar_arquivos(raiz, args.file)

    if not arquivos:
        print("Nenhum arquivo encontrado para análise.")
        sys.exit(0)

    print(f"\n🔍  Gelamour AI Detector — {MODEL}")
    print(f"📁  {len(arquivos)} arquivo(s) para analisar")
    print(f"🔧  Modo fix: {'ATIVADO' if args.fix else 'desativado'}")
    print(f"⏰  Iniciado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")

    resultados: list[dict] = []
    corrigidos: list[str]  = []
    total_tokens = 0

    for i, path in enumerate(arquivos, 1):
        conteudo  = ler_arquivo(path)
        linguagem = EXTENSIONS.get(path.suffix, "Texto")
        resultado = analisar_arquivo(client, path, conteudo, linguagem)
        imprimir_resultado(resultado, i, len(arquivos))
        resultados.append(resultado)
        total_tokens += resultado["tokens_usados"]

        if args.fix and resultado["tem_problema"]:
            print(f"   → Aplicando correção em {path.name}...")
            conteudo_corrigido = gerar_correcao(client, path, conteudo, resultado["analise"])
            if conteudo_corrigido != conteudo:
                # Backup do original
                backup = path.with_suffix(path.suffix + ".bak")
                backup.write_text(conteudo, encoding="utf-8")
                path.write_text(conteudo_corrigido, encoding="utf-8")
                corrigidos.append(str(path))
                print(f"   ✅ Corrigido. Backup salvo em {backup.name}")
            else:
                print("   ℹ️  Sem diferenças detectadas na correção.")

    # Sumário final
    print(f"\n{'═'*60}")
    print(f"📊  SUMÁRIO FINAL")
    print(f"   Arquivos analisados : {len(resultados)}")
    problemas = sum(1 for r in resultados if r["tem_problema"])
    print(f"   Com problemas       : {problemas}")
    print(f"   Sem problemas       : {len(resultados) - problemas}")
    print(f"   Tokens consumidos   : {total_tokens:,}")
    if corrigidos:
        print(f"   Arquivos corrigidos : {len(corrigidos)}")
        for c in corrigidos:
            print(f"     • {c}")

    if args.save:
        rel = salvar_relatorio(resultados, raiz)
        print(f"\n💾  Relatório salvo em: {rel}")

    print(f"\n⏰  Concluído em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")

    # Exit code não-zero se houver problemas (útil em CI)
    sys.exit(1 if problemas > 0 else 0)


if __name__ == "__main__":
    main()
