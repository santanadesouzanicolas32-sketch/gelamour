# src/ — Código-fonte TypeScript

Esta pasta contém o código TypeScript do frontend Gelamour.

## Como buildar

### Pré-requisitos

- Node.js >= 18
- npm >= 9

### Instalação

```bash
npm install
```

### Compilar uma vez

```bash
npm run build
# ou
npx tsc
```

Isso compila `src/app.ts` e gera `js/app.js`.

### Modo watch (recompila automaticamente ao salvar)

```bash
npm run watch
# ou
npx tsc --watch
```

## Estrutura

```
src/
  app.ts        — Lógica principal do frontend (compilada para js/app.js)
```

## Notas

- O arquivo `js/app.js` é gerado automaticamente — **não edite diretamente**.
- Edite sempre `src/app.ts` e recompile.
- O CI/CD (`.github/workflows/build.yml`) compila e publica automaticamente no push para `master`.
