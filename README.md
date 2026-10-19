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
- Quando o domínio final estiver definido: adicionar `<link rel="canonical">`, `og:url`, URLs absolutas nas imagens e `sitemap.xml`

## Analytics

Vercel Web Analytics pelo script estático `/_vercel/insights/script.js` (mesmo domínio, compatível com a CSP). Ative em Vercel → projeto → Analytics → Enable.
