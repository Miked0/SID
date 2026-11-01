# Site da SID · Solution Inovva Digital

Site estático (HTML, CSS e JavaScript puro), publicado na Vercel.

- `index.html`: conteúdo
- `assets/site.css` e `assets/site.js`: visual e interações
- `fonts/`: fontes hospedadas no próprio site (Big Shoulders Display, Manrope, Petrona; SIL Open Font License)
- `vercel.json`: cabeçalhos de segurança (CSP, HSTS e outros)

Número do WhatsApp: variável `WHATSAPP` em `assets/site.js` (só dígitos, com DDI e DDD).

## SEO

- Título, descrição, Open Graph e Twitter Card no `<head>` do `index.html`
- Dados estruturados (JSON-LD): ProfessionalService, WebSite e FAQPage
- Ícones: `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `img/icon-*.png`, `site.webmanifest`
- Imagem de compartilhamento: `img/og-sid.jpg` (1200x630)
- `canonical`, `og:url`, imagens com URL absoluta, `sitemap.xml` e `robots.txt` usam hoje `https://sid-teal-ten.vercel.app`. Quando o domínio próprio estiver ativo, troque esse endereço em todos os arquivos (`grep -rl sid-teal-ten .`)

## Páginas

- `/` (`index.html`): página principal, com formulário que monta a mensagem e abre o WhatsApp
- `/obrigado`: confirmação depois do formulário (fora do Google: `noindex` e `Disallow` no robots)
- `/privacidade` e `/termos`: textos genéricos, precisam de revisão jurídica
- `404.html`: a Vercel serve sozinha para qualquer endereço que não existe

## Privacidade e analytics

- O site não grava cookies e não carrega nada de terceiros
- `assets/aviso.js` (em todas as páginas) mostra o aviso de privacidade e carrega o Vercel Web Analytics (`/_vercel/insights/script.js`, mesmo domínio, sem cookies). Quem escolhe "Não contar minhas visitas" deixa de carregar o script; a escolha fica no `localStorage` (`sid-aviso`)
- Ative a medição em Vercel → projeto → Analytics → Enable
