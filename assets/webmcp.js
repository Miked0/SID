/* Ferramentas WebMCP para agentes que rodam no navegador.
   Só expõe informações que já estão na página e abre o WhatsApp da SID.
   Não envia dados para lugar nenhum e não guarda nada. Se o navegador não
   suportar navigator.modelContext, o script não faz nada. */
(function () {
  'use strict';

  var mc = typeof navigator !== 'undefined' ? navigator.modelContext : null;
  if (!mc || typeof mc.registerTool !== 'function') return;

  var WHATSAPP = 'https://wa.me/5511911963379';
  var INSTAGRAM = 'https://instagram.com/solutioninnovadigital';
  var SERVICOS = ['Site', 'Identidade visual', 'Sistema de gestão', 'Social media', 'Ainda não sei'];

  function resposta(obj) {
    return { content: [{ type: 'text', text: JSON.stringify(obj) }] };
  }

  var ferramentas = [
    {
      name: 'sid_listar_servicos',
      description: 'Lista os serviços da SID Solution Innova Digital para pequenos negócios: site, identidade visual, social media e sistemas de gestão. Não informa preços, que são combinados na proposta.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: function () {
        return resposta({
          empresa: 'SID · Solution Innova Digital',
          servicos: [
            { nome: 'Criação de sites', pagina: 'https://solutioninnovadigital.com/criacao-de-sites' },
            { nome: 'Identidade visual', pagina: 'https://solutioninnovadigital.com/identidade-visual' },
            { nome: 'Social media', pagina: 'https://solutioninnovadigital.com/social-media' },
            { nome: 'Sistemas de gestão', pagina: 'https://solutioninnovadigital.com/sistemas-de-gestao' }
          ],
          atendimento: 'Presencial em São Paulo e online para todo o Brasil',
          pagamento: 'Pix, conforme contrato'
        });
      }
    },
    {
      name: 'sid_contato',
      description: 'Dá os canais de contato da SID: WhatsApp e Instagram. A primeira conversa é gratuita.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: function () {
        return resposta({ whatsapp: WHATSAPP, instagram: INSTAGRAM, primeiraConversa: 'gratuita' });
      }
    },
    {
      name: 'sid_montar_mensagem_orcamento',
      description: 'Monta o link do WhatsApp com a mensagem pronta para pedir orçamento de um serviço da SID. Retorna o link; quem decide abrir é a pessoa.',
      inputSchema: {
        type: 'object',
        properties: {
          servico: { type: 'string', enum: SERVICOS, description: 'Serviço de interesse' },
          negocio: { type: 'string', maxLength: 80, description: 'Tipo ou nome do negócio (opcional)' }
        },
        required: ['servico'],
        additionalProperties: false
      },
      execute: function (input) {
        var servico = input && input.servico;
        if (SERVICOS.indexOf(servico) === -1) {
          return resposta({ erro: 'Serviço inválido', opcoes: SERVICOS });
        }
        var negocio = input.negocio ? String(input.negocio).slice(0, 80) : '';
        var msg = servico === 'Ainda não sei'
          ? 'Oi! Vim pelo site e estou começando no digital. Podemos conversar?'
          : 'Oi! Vim pelo site e quero um orçamento de ' + servico.toLowerCase() + '.';
        if (negocio) msg += ' Meu negócio: ' + negocio + '.';
        return resposta({ link: WHATSAPP + '?text=' + encodeURIComponent(msg), mensagem: msg });
      }
    }
  ];

  ferramentas.forEach(function (t) {
    try {
      mc.registerTool(t);
    } catch (e) {
      /* Sem suporte a esta ferramenta: o restante do site segue normal. */
    }
  });
})();
