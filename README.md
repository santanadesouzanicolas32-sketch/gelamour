# Gelamour

Cardápio digital PWA da Gelamour. Funciona 100% no navegador, **sem banco de dados e sem servidor**.

## Como funciona
- **Login**: o cliente informa WhatsApp e nome. Os dados ficam salvos só no aparelho dele (localStorage).
- **Pedido**: o carrinho monta a mensagem e abre o WhatsApp da loja já preenchida.
- **Cardápio e preços**: ficam no `index.html`.
- **PWA**: instalável no celular (`sw.js` + `manifest.json`).

## Estrutura
```
index.html        cardápio
css/styles.css    estilos
js/app.js         código compilado (gerado por build.js — não editar)
src/              código-fonte TypeScript
sw.js             service worker
manifest.json     manifest PWA
arquivo-supabase/ código antigo do banco/roleta/admin, guardado fora do site
```

## Desenvolvimento
```bash
npm ci
npm run typecheck
node build.js      # gera js/app.js — commite o resultado
```

## Deploy
GitHub Pages, branch `master`, pasta raiz. Depois de alterar `src/`, rode `node build.js` e commite `js/app.js`.
