# Loja demo com Pix (sid-catalogo-loja-pix)

Vitrine de demonstração do catálogo e da loja com carrinho e pagamento via Pix, publicada em `/vitrine/catalogo-loja-pix/`.

- `index.html`: catálogo, carrinho, dados do cliente, tela de Pix e confirmação (todas as etapas na mesma página).
- `assets/loja.css`: estilos (tokens da marca em `:root`, fontes Big Shoulders Display e Manrope hospedadas em `/fonts/`).
- `assets/loja.js`: catálogo, página do produto com tamanho e cor, carrinho por variante (localStorage), cupom `DEMO10`, frete simulado por CEP (tabela fictícia), pedidos recentes e pagamento simulado.
- Tema Light Noir (botão no topo), guardado no navegador.

## Limites da demonstração

- Não há backend, não há chave Pix real e nenhum pagamento é cobrado.
- Os produtos e o QR Code são fictícios. Não são enviados dados a nenhum serviço.
- Segue a política de segurança do site: sem scripts inline, sem terceiros, fontes próprias, CSP estrita em `.htaccess`.
- `<meta name="robots" content="noindex">`: a página não deve entrar no Google enquanto for vitrine interna.
