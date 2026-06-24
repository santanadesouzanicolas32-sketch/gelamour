# Gelamour

[![License: MIT](https://img.shields.io/badge/License-MIT-pink.svg)](LICENSE)

Cardápio digital PWA para sorveteria/gelateria, com login de clientes, pagamento via Pix (Asaas), roleta VIP de descontos e painel administrativo.

---

## Funcionalidades

- **Cardápio interativo** — navegação por categorias, busca e filtro de produtos com imagens
- **Login de clientes** — autenticação via Supabase (e-mail/senha ou magic link)
- **Pagamento Pix via Asaas** — geração de QR Code Pix diretamente no checkout
- **Roleta VIP** — roleta animada com cupons de desconto exclusivos para clientes logados
- **Painel Admin** — gerenciamento de produtos, pedidos e clientes via `admin.html`
- **PWA** — instalável como app no celular com service worker e manifests

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Backend as a Service | [Supabase](https://supabase.com) (banco + auth + storage) |
| Pagamentos | [Asaas](https://asaas.com) (Pix) |
| PWA | Service Worker, Web App Manifest |
| Imagens | WebP (otimizadas com sharp) |

---

## Estrutura de arquivos

```
gelamour/
├── index.html          # Cardápio principal (cliente)
├── admin.html          # Painel administrativo
├── css/
│   ├── styles.css      # Estilos do cardápio
│   └── admin.css       # Estilos do painel admin
├── js/
│   ├── app.js          # Lógica do cardápio (roleta, pix, auth…)
│   └── admin.js        # Lógica do painel admin
├── images/
│   ├── logo.webp       # Logotipo (WebP otimizado)
│   └── roleta.webp     # Imagem da roleta VIP
├── backend/            # Funções serverless / Edge Functions Supabase
├── supabase/           # Configurações e migrations do Supabase
├── sw.js               # Service Worker (PWA)
├── manifest.json       # Manifest PWA (cliente)
├── manifest-admin.json # Manifest PWA (admin)
├── icon-192.png        # Ícone PWA 192px
├── icon-512.png        # Ícone PWA 512px
└── .gitignore
```

---

## Como rodar localmente

1. **Clone o repositório**
   ```bash
   git clone https://github.com/santanadesouzanicolas32-sketch/gelamour.git
   cd gelamour
   ```

2. **Configure as variáveis de ambiente no Supabase**
   - Acesse o dashboard do Supabase e defina as chaves de API nas Edge Functions
   - Nunca exponha chaves privadas no frontend

3. **Sirva os arquivos estáticos**
   ```bash
   # Com Node.js (http-server)
   npx http-server . -p 3000

   # Ou com o script incluso (Windows)
   iniciar-servidor.bat
   ```

4. Acesse `http://localhost:3000` no navegador

---

## Deploy

### GitHub Pages
O site pode ser publicado diretamente pelo GitHub Pages:
1. Vá em **Settings → Pages**
2. Source: `Deploy from a branch` → branch `master`, pasta `/ (root)`
3. Acesse a URL gerada pelo GitHub

### Servidor próprio / VPS
Basta copiar os arquivos para a raiz do servidor web (nginx, Apache, Caddy, etc.). Não há build necessário.

---

## Segurança

- Chaves privadas da API Asaas e credenciais do Supabase ficam **exclusivamente** nas Edge Functions do Supabase (servidor), nunca expostas no frontend
- Autenticação de clientes gerenciada pelo Supabase Auth (JWT)
- O painel `admin.html` deve ser protegido por autenticação antes do deploy em produção

---

## Licença

MIT © Gelamour
