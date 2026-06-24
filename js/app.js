
    const WA_NUMBER = atob('NTUxMTk0MDc3Mjc1MA==');
    const CONTA_TESTE = atob('MTE5NjUwMzAwNzY=');
    function isContaTeste() { return clienteAtual && clienteAtual.telefone.replace(/D/g,'') === CONTA_TESTE; }

    const carrinho = {};
    let pagamentoSelecionado = '';

    function escHTML(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function filtrar(cat, btn) {
      document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.prod-card').forEach(card => {
        if (cat === 'todos' || card.dataset.cat === cat) card.classList.remove('hidden');
        else card.classList.add('hidden');
      });
    }

    // Fluxo novo: clicar em "Pedir" adiciona E abre dialog
    function pedirProduto(botao, nome, preco) {
      const card = botao.closest('.prod-card');

      // Toggle: se já estava, remove e não abre dialog
      if (carrinho[nome]) {
        delete carrinho[nome];
        card.classList.remove('selecionado');
        atualizarFab();
        return;
      }

      // Adiciona
      carrinho[nome] = { nome: nome, preco: Number(preco) };
      card.classList.add('selecionado');
      atualizarFab();

      // Mostra dialog perguntando se quer finalizar ou continuar
      abrirDialog(nome, preco);
    }

    function abrirDialog(nome, preco) {
      const el = document.getElementById('dialogProduto');
      el.innerHTML = '<strong>' + escHTML(nome) + '</strong> — R$ ' + Number(preco).toFixed(2).replace('.', ',');
      document.getElementById('dialogBackdrop').classList.add('aberto');
    }

    function fecharDialog() {
      document.getElementById('dialogBackdrop').classList.remove('aberto');
    }

    function fecharDialogBackdrop(e) {
      if (e.target.id === 'dialogBackdrop') fecharDialog();
    }

    function irParaFinalizar() {
      fecharDialog();
      abrirModal();
    }

    function atualizarFab() {
      const fab = document.getElementById('cartFab');
      const badge = document.getElementById('cartBadge');
      const itens = Object.values(carrinho);
      badge.textContent = itens.length;
      if (itens.length > 0) fab.classList.add('ativo');
      else {
        fab.classList.remove('ativo');
        fecharModal();
      }
    }

    function abrirModal() {
      renderizarCarrinho();
      renderizarNoticeEncomenda();
      document.getElementById('modalBackdrop').classList.add('aberto');
      document.body.classList.add('modal-aberto');
    }

    function fecharModal() {
      document.getElementById('modalBackdrop').classList.remove('aberto');
      document.body.classList.remove('modal-aberto');
    }

    function fecharModalBackdrop(e) {
      if (e.target.id === 'modalBackdrop') fecharModal();
    }

    function renderizarCarrinho() {
      const lista = document.getElementById('listaCarrinho');
      const badgeCount = document.getElementById('badgeCount');
      const totalRodape = document.getElementById('totalRodape');
      const itens = Object.values(carrinho);

      badgeCount.textContent = itens.length;

      if (itens.length === 0) {
        lista.innerHTML = `
          <div class="carrinho-vazio">
            <div class="carrinho-vazio-icon">🛒</div>
            <div>Seu carrinho está vazio</div>
          </div>`;
        totalRodape.textContent = 'R$ 0,00';
        return;
      }

      let total = 0;
      let html = '';
      itens.forEach(item => {
        total = Math.round((total + item.preco) * 100) / 100;
        const nomeEsc = escHTML(item.nome);
        const nomeData = encodeURIComponent(item.nome);
        html += `
          <div class="cart-item">
            <span class="cart-item-nome">${nomeEsc}</span>
            <span class="cart-item-preco">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
            <button class="cart-item-remove" onclick="removerDoCarrinho(decodeURIComponent('${nomeData}'))" aria-label="Remover">🗑️</button>
          </div>`;
      });
      html += `
        <div class="cart-total">
          <span class="cart-total-label">Total</span>
          <span class="cart-total-valor">R$ ${total.toFixed(2).replace('.', ',')}</span>
        </div>`;
      lista.innerHTML = html;
      totalRodape.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
    }

    function removerDoCarrinho(nome) {
      if (!carrinho[nome]) return;
      delete carrinho[nome];
      document.querySelectorAll('.prod-card.selecionado').forEach(card => {
        const nomeEl = card.querySelector('.prod-nome');
        if (nomeEl && nomeEl.textContent.trim() === nome) {
          card.classList.remove('selecionado');
        }
      });
      renderizarCarrinho();
      atualizarFab();
    }

    function selecionarPagamento(el) {
      document.querySelectorAll('.pagamento-opt').forEach(o => o.classList.remove('ativo'));
      el.classList.add('ativo');
      pagamentoSelecionado = el.dataset.pag;
    }

    async function finalizarPedido() {
      const itens = Object.values(carrinho);
      const temFormaFin = itens.some(i => isBoloForma(i.nome));
      const temOutrosFin = itens.some(i => !isBoloForma(i.nome));
      if (temFormaFin && temOutrosFin) {
        if (!confirm('⚠️ Atenção!\n\nVocê tem Bolos na Forma (feitos sob encomenda) misturados com outros produtos no carrinho.\n\nBolos na Forma precisam de prazo de 5h a 1 dia útil para preparo.\n\nDeseja prosseguir com todos os itens mesmo assim?')) return;
      }
      if (itens.length === 0) {
        alert('Adicione pelo menos um produto ao carrinho!');
        return;
      }
      const nome = document.getElementById('inpNome').value.trim();
      const endereco = document.getElementById('inpEndereco').value.trim();
      const obs = document.getElementById('inpObs').value.trim();

      if (!nome) {
        alert('Por favor, informe seu nome completo.');
        document.getElementById('inpNome').focus();
        return;
      }
      if (!endereco) {
        alert('Por favor, informe seu endereço.');
        document.getElementById('inpEndereco').focus();
        return;
      }
      if (!pagamentoSelecionado) {
        alert('Por favor, escolha a forma de pagamento.');
        return;
      }

      // Re-verificar preços diretamente dos botões para evitar manipulação client-side
      document.querySelectorAll('.btn-pedir').forEach(btn => {
        const m = btn.getAttribute('onclick').match(/pedirProduto\(this,'(.+?)',(\d+(?:\.\d+)?)\)/);
        if (!m) return;
        if (carrinho[m[1]]) carrinho[m[1]].preco = parseFloat(m[2]);
      });
      const itensVerificados = Object.values(carrinho);

      let total = 0;
      let linhasItens = '';
      itensVerificados.forEach(item => {
        total = Math.round((total + item.preco) * 100) / 100;
        linhasItens += `• ${item.nome} — R$ ${item.preco.toFixed(2).replace('.', ',')}
`;
      });

      const msg =
        `*🍰 NOVO PEDIDO - GELAMOUR*

*📋 ITENS:*
${linhasItens}
*💰 Total:* R$ ${total.toFixed(2).replace('.', ',')}

*👤 Nome:* ${nome}
*📍 Endereço:* ${endereco}
*💳 Pagamento:* ${pagamentoSelecionado}${obs ? `
*📝 Obs:* ${obs}` : ''}

Pedido pelo cardápio online ✨`;

      // Salvar pedido no Supabase
      const btnFin = document.getElementById('btnFinalizar');
      const txtOrig = btnFin ? btnFin.textContent : '';
      if (btnFin) { btnFin.disabled = true; btnFin.textContent = 'Salvando pedido...'; }
      let _pedidoId = null;
      try {
        const _ctrl = new AbortController();
        const _tid = setTimeout(() => _ctrl.abort(), DB_TIMEOUT);
        const _r = await fetch(SUPABASE_URL + '/rest/v1/pedidos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON,
            'Authorization': 'Bearer ' + SUPABASE_ANON,
            'Prefer': 'return=headers-only'
          },
          body: JSON.stringify({
            nome,
            endereco,
            pagamento: pagamentoSelecionado,
            itens: itensVerificados.map(i => ({ nome: i.nome, preco: i.preco })),
            total: total,
            status: 'aguardando',
            observacao: obs || null,
            cliente_id: clienteAtual ? clienteAtual.id : null,
            telefone: clienteAtual ? clienteAtual.telefone : null
          }),
          signal: _ctrl.signal
        });
        clearTimeout(_tid);
        if (!_r.ok) {
          const _errTxt = await _r.text().catch(function(){ return ''; });
          console.error('Supabase INSERT pedido falhou:', _r.status, _errTxt);
          throw new Error('HTTP ' + _r.status + ' — ' + _errTxt.slice(0, 120));
        }
        const _loc = _r.headers.get('Location') || '';
        const _idMatch = _loc.match(/id=eq\.(\d+)/);
        if (_idMatch) {
          _pedidoId = parseInt(_idMatch[1], 10);
          if (btnFin) btnFin.textContent = '✅ Pedido registrado!';
          salvarEnderecoCliente(endereco);
        }
      } catch (_e) {
        if (btnFin) btnFin.textContent = '⚠️ Erro - pedido só no WhatsApp';
        console.warn('Erro ao salvar no banco:', _e);
      }
      setTimeout(function() {
        if (btnFin) { btnFin.disabled = false; btnFin.textContent = txtOrig; }
      }, 3000);

      if ((pagamentoSelecionado === 'Pix' || pagamentoSelecionado === 'Cartão') && _pedidoId) {
        // Fluxo Asaas: QR Code (Pix) ou checkout de cartão — WhatsApp enviado após confirmação
        const billingType = pagamentoSelecionado === 'Cartão' ? 'CREDIT_CARD' : 'PIX';
        iniciarFluxoPix(_pedidoId, total, nome, msg, billingType, itensVerificados, endereco);
      } else {
        window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
        if (_pedidoId) {
          window._pedidoIdPendente = _pedidoId;
          document.getElementById('waConfirmBackdrop').classList.add('aberto');
        }
      }
    }

    async function confirmarEnvioWA() {
      const id = window._pedidoIdPendente;
      const btn = document.querySelector('.waConfirm-sim');
      if (!id) { fecharConfirmWA(); return; }
      if (btn) { btn.textContent = 'Confirmando...'; btn.disabled = true; }
      try {
        const r = await fetch(SUPABASE_URL + '/rest/v1/pedidos?id=eq.' + id, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON,
            'Authorization': 'Bearer ' + SUPABASE_ANON,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ status: 'confirmado' })
        });
        if (!r.ok) throw new Error('status ' + r.status);
        if (btn) { btn.textContent = '🎉 Pedido confirmado!'; }
        setTimeout(function() { fecharConfirmWA(); limparCarrinho(); }, 1800);
      } catch(e) {
        if (btn) { btn.textContent = '✅ Sim, mensagem enviada!'; btn.disabled = false; }
        console.warn('Erro ao confirmar pedido:', e);
        fecharConfirmWA();
      }
    }

    function fecharConfirmWA() {
      document.getElementById('waConfirmBackdrop').classList.remove('aberto');
      window._pedidoIdPendente = null;
    }

    // ===== FLUXO PIX ASAAS =====
    async function iniciarFluxoPix(pedidoId, total, nome, msgWA, billingType, itens, endereco) {
      _pixPedidoId = pedidoId;
      _pixMsgWA = msgWA;
      _pixTotal = total;
      _pixNome = nome;
      _pixItens = itens || [];
      _pixEndereco = endereco || '';
      const isPix = billingType !== 'CREDIT_CARD';

      document.getElementById('pixTitulo').textContent = isPix ? '💠 Pague via Pix' : '💳 Pague com Cartão';
      document.getElementById('pixSub').textContent = isPix
        ? 'Copie o código ou escaneie o QR Code'
        : 'Crédito ou débito — preencha os dados abaixo';
      document.getElementById('pixValor').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
      document.getElementById('secaoPix').style.display = isPix ? 'block' : 'none';
      document.getElementById('secaoCartao').style.display = isPix ? 'none' : 'block';
      document.getElementById('pixJaPagueiBtn').style.display = 'none';
      document.getElementById('pixStatus').textContent = isPix ? '⏳ Gerando QR Code...' : '';
      document.getElementById('pixStatus').className = 'pix-status' + (isPix ? ' pix-aguardando' : '');
      document.getElementById('pixCodeBox').textContent = 'Gerando código...';
      document.getElementById('pixQrImg').src = '';
      document.getElementById('pixBackdrop').classList.add('aberto');
      fecharModal();

      if (!isPix) return; // Cartão: usuário preenche o form e clica "Pagar agora"

      // Pix dinâmico via Asaas — gera QR Code único por pedido
      try {
        const resp = await fetch(EDGE_URL + '/criar-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON },
          body: JSON.stringify({ pedido_id: pedidoId, total: total, nome: nome, billing_type: 'PIX' }),
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        if (data.error) throw new Error(data.error);

        _pixPayload = data.qr_code || '';
        document.getElementById('pixCodeBox').textContent = _pixPayload || 'Código indisponível';
        if (data.qr_code_image) {
          document.getElementById('pixQrImg').src = 'data:image/png;base64,' + data.qr_code_image;
        }
        document.getElementById('pixStatus').textContent = '⏳ Aguardando pagamento...';
        document.getElementById('pixStatus').className = 'pix-status pix-aguardando';
        document.getElementById('pixJaPagueiBtn').style.display = 'none';

        // Polling: verifica a cada 4s se o pagamento foi confirmado
        _pixPollTimer = setInterval(verificarPagamentoPix, 4000);

      } catch(e) {
        console.warn('Erro ao criar Pix:', e);
        document.getElementById('pixCodeBox').textContent = 'Erro ao gerar código.';
        document.getElementById('pixStatus').textContent = '⚠️ Erro ao gerar QR Code. Tente outra forma de pagamento.';
        document.getElementById('pixStatus').className = 'pix-status';
        document.getElementById('pixJaPagueiBtn').style.display = 'block';
      }
    }

    // Funções do formulário de cartão
    function selecionarTipoCartao(tipo) {
      _cardTipo = tipo;
      document.getElementById('btnCredito').classList.toggle('ativo', tipo === 'credito');
      document.getElementById('btnDebito').classList.toggle('ativo', tipo === 'debito');
    }

    function formatarCartao(el) {
      let v = el.value.replace(/\D/g, '').substring(0, 16);
      el.value = v.replace(/(.{4})(?=.)/g, '$1 ');
    }

    function formatarCpf(el) {
      let v = el.value.replace(/\D/g, '').substring(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
      v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
      el.value = v;
    }

    function formatarValidade(el) {
      let v = el.value.replace(/\D/g, '').substring(0, 4);
      if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
      el.value = v;
    }

    function formatarCep(el) {
      let v = el.value.replace(/\D/g, '').substring(0, 8);
      if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5);
      el.value = v;
    }

    async function pagarCartao() {
      const numero = document.getElementById('cardNumero').value.replace(/\s/g, '');
      const nomeCartao = document.getElementById('cardNome').value.trim().toUpperCase();
      const cpf = document.getElementById('cardCpf').value.replace(/\D/g, '');
      const validade = document.getElementById('cardValidade').value;
      const cvc = document.getElementById('cardCvc').value.trim();
      const cep = document.getElementById('cardCep').value.replace(/\D/g, '');

      if (numero.length < 13) { alert('Número do cartão inválido.'); return; }
      if (!nomeCartao) { alert('Informe o nome impresso no cartão.'); return; }
      if (cpf.length !== 11) { alert('CPF inválido (somente números, 11 dígitos).'); return; }
      if (!validade.includes('/') || validade.length !== 5) { alert('Validade inválida. Use o formato MM/AA.'); return; }
      if (cvc.length < 3) { alert('CVC inválido.'); return; }
      if (cep.length !== 8) { alert('CEP inválido.'); return; }

      const [mes, ano] = validade.split('/');
      const btn = document.getElementById('btnPagarCartao');
      btn.disabled = true;
      btn.textContent = '⏳ Processando...';
      document.getElementById('pixStatus').textContent = '⏳ Processando pagamento com cartão...';
      document.getElementById('pixStatus').className = 'pix-status pix-aguardando';

      try {
        const resp = await fetch(EDGE_URL + '/criar-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON },
          body: JSON.stringify({
            pedido_id: _pixPedidoId,
            total: _pixTotal,
            nome: _pixNome,
            billing_type: 'CREDIT_CARD',
            card_data: {
              holderName: nomeCartao,
              number: numero,
              expiryMonth: mes,
              expiryYear: '20' + ano,
              ccv: cvc,
              cpfCnpj: cpf,
              postalCode: cep,
            }
          }),
        });
        const data = await resp.json();
        if (data.error) throw new Error(data.error);

        if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
          document.getElementById('pixStatus').textContent = '✅ Pagamento aprovado!';
          document.getElementById('pixStatus').className = 'pix-status pix-pago';
          setTimeout(function() {
            document.getElementById('pixBackdrop').classList.remove('aberto');
            window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(_pixMsgWA), '_blank');
            limparCarrinho();
            _pixPedidoId = null; _pixPayload = ''; _pixMsgWA = ''; _pixTotal = 0; _pixNome = '';
          }, 1500);
        } else {
          document.getElementById('pixStatus').textContent = '⏳ Aguardando confirmação do banco...';
          _pixPollTimer = setInterval(function() { verificarPagamentoPix(); }, 4000);
        }
      } catch(e) {
        btn.disabled = false;
        btn.textContent = 'Pagar agora';
        document.getElementById('pixStatus').textContent = '⚠️ ' + (e.message.slice(0, 80) || 'Erro. Verifique os dados e tente novamente.');
        document.getElementById('pixStatus').className = 'pix-status';
        console.warn('Erro cartão:', e);
      }
    }

    async function verificarPagamentoPix() {
      if (!_pixPedidoId) return;
      try {
        const resp = await fetch(SUPABASE_URL + '/rest/v1/pedidos?id=eq.' + _pixPedidoId + '&select=status_pagamento', {
          headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON },
        });
        const rows = await resp.json();
        if (rows[0] && rows[0].status_pagamento === 'pago') {
          clearInterval(_pixPollTimer);
          _pixPollTimer = null;
          mostrarReciboPix();
        }
      } catch(e) {
        console.warn('Erro ao verificar pagamento:', e);
      }
    }

    function mostrarReciboPix() {
      // Monta recibo com os itens do pedido
      const linhasItens = _pixItens.map(i =>
        '<div class="recibo-item"><span>' + escHTML(i.nome) + '</span><span>R$ ' + Number(i.preco).toFixed(2).replace('.',',') + '</span></div>'
      ).join('');

      document.querySelector('.pix-box').innerHTML =
        '<div style="font-size:52px;margin-bottom:8px">✅</div>' +
        '<div style="font-size:20px;font-weight:700;color:#166534;margin-bottom:4px">Pagamento recebido!</div>' +
        '<div style="font-size:13px;color:#6B5B52;margin-bottom:16px">Seu pedido foi confirmado com sucesso</div>' +
        '<div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:14px;text-align:left;margin-bottom:14px">' +
          '<div style="font-size:11px;font-weight:700;color:#166534;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">📋 Resumo do pedido</div>' +
          linhasItens +
          '<div style="border-top:1px solid #bbf7d0;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-weight:700;font-size:14px">' +
            '<span>Total</span><span style="color:#E8528A">R$ ' + Number(_pixTotal).toFixed(2).replace('.',',') + '</span>' +
          '</div>' +
          '<div style="margin-top:8px;font-size:11px;color:#4b7c5e">📍 ' + escHTML(_pixEndereco) + '</div>' +
        '</div>' +
        '<button onclick="fecharReciboPix()" style="width:100%;padding:13px;background:linear-gradient(135deg,#E8528A,#C23A6E);color:#fff;font-weight:700;font-size:15px;border:none;border-radius:12px;cursor:pointer;font-family:inherit">💬 Ver pedido no WhatsApp</button>';

      // Abre WhatsApp automaticamente após 2s
      setTimeout(function() {
        window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(_pixMsgWA), '_blank');
      }, 2000);
    }

    function fecharReciboPix() {
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(_pixMsgWA), '_blank');
      document.getElementById('pixBackdrop').classList.remove('aberto');
      limparCarrinho();
      _pixPedidoId = null; _pixPayload = ''; _pixMsgWA = ''; _pixTotal = 0; _pixNome = ''; _pixItens = []; _pixEndereco = '';
    }

    function copiarPix() {
      if (!_pixPayload) return;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(_pixPayload).then(function() {
          const btn = document.querySelector('.pix-copy-btn');
          if (btn) { btn.textContent = '✅ Código copiado!'; setTimeout(function(){ btn.textContent = '📋 Copiar código Pix (copia e cola)'; }, 2500); }
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = _pixPayload;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    }

    function cancelarPix() {
      if (_pixPollTimer) { clearInterval(_pixPollTimer); _pixPollTimer = null; }
      const estaAberto = document.getElementById('pixBackdrop').classList.contains('aberto');
      document.getElementById('pixBackdrop').classList.remove('aberto');
      _pixPedidoId = null; _pixPayload = ''; _pixMsgWA = ''; _pixTotal = 0; _pixNome = ''; _pixItens = []; _pixEndereco = '';
      if (estaAberto) abrirModal();
    }

    function limparCarrinho() {
      Object.keys(carrinho).forEach(k => delete carrinho[k]);
      pagamentoSelecionado = '';
      document.querySelectorAll('.pagamento-opt.ativo').forEach(o => o.classList.remove('ativo'));
      const obsEl = document.getElementById('inpObs');
      if (obsEl) obsEl.value = '';
      document.querySelectorAll('.prod-card.selecionado').forEach(c => c.classList.remove('selecionado'));
      atualizarFab();
      fecharModal();
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        fecharDialog();
        fecharModal();
        fecharConfirmWA();
        cancelarPix();
      }
    });
    // ===== BOLO NA FORMA: identidade e funções =====
    const BOLO_FORMA_NOMES = ['Bolo na forma Milho natural', 'Bolo na forma Cenoura com chocolate e Granule'];
    function isBoloForma(nome) { return BOLO_FORMA_NOMES.includes(nome); }

    function pedirBoloForma(botao, nome, preco) {
      const card = botao.closest('.prod-card');
      if (carrinho[nome]) {
        delete carrinho[nome];
        card.classList.remove('selecionado');
        atualizarFab();
        renderizarNoticeEncomenda();
        return;
      }
      carrinho[nome] = { nome, preco: Number(preco) };
      card.classList.add('selecionado');
      atualizarFab();
      abrirDialogBolo();
    }

    function abrirDialogBolo() {
      document.getElementById('dialogBoloBackdrop').classList.add('aberto');
    }

    function fecharDialogBolo(e) {
      if (!e || e.target.id === 'dialogBoloBackdrop') {
        document.getElementById('dialogBoloBackdrop').classList.remove('aberto');
      }
    }

    function agendarBoloWhatsApp() {
      const itensForma = Object.values(carrinho).filter(i => isBoloForma(i.nome));
      let linhas = '';
      let total = 0;
      itensForma.forEach(i => {
        linhas += '• ' + i.nome + ' — R$ ' + i.preco.toFixed(2).replace('.', ',') + '\n';
        total = Math.round((total + i.preco) * 100) / 100;
      });
      const msg = '*🎂 AGENDAMENTO - BOLO NA FORMA - GELAMOUR*\n\nOlá! Gostaria de agendar o(s) seguinte(s) bolo(s):\n\n' + linhas + '\n*💰 Total:* R$ ' + total.toFixed(2).replace('.', ',') + '\n\n⏰ Sei que o prazo é de 5 horas a 1 dia útil. Por favor me informe a data e horário disponíveis para entrega. 😊';
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
      fecharDialogBolo();
    }

    function carouselNext(id, e) {
      if (e) e.stopPropagation();
      const c = document.getElementById(id);
      const imgs = c.querySelectorAll('.carousel-img');
      const dots = c.querySelectorAll('.carousel-dot');
      let cur = 0;
      imgs.forEach(function (img, i) { if (img.classList.contains('ativo')) cur = i; });
      imgs[cur].classList.remove('ativo');
      if (dots[cur]) dots[cur].classList.remove('ativo');
      const next = (cur + 1) % imgs.length;
      imgs[next].classList.add('ativo');
      if (dots[next]) dots[next].classList.add('ativo');
    }

    function carouselPrev(id, e) {
      if (e) e.stopPropagation();
      const c = document.getElementById(id);
      const imgs = c.querySelectorAll('.carousel-img');
      const dots = c.querySelectorAll('.carousel-dot');
      let cur = 0;
      imgs.forEach(function (img, i) { if (img.classList.contains('ativo')) cur = i; });
      imgs[cur].classList.remove('ativo');
      if (dots[cur]) dots[cur].classList.remove('ativo');
      const prev = (cur - 1 + imgs.length) % imgs.length;
      imgs[prev].classList.add('ativo');
      if (dots[prev]) dots[prev].classList.add('ativo');
    }

    function renderizarNoticeEncomenda() {
      const el = document.getElementById('noticeEncomenda');
      if (!el) return;
      const itens = Object.values(carrinho);
      const temForma = itens.some(i => isBoloForma(i.nome));
      const temOutros = itens.some(i => !isBoloForma(i.nome));
      if (temForma && temOutros) {
        el.innerHTML = '<div class="notice-misto"><span>⚠️</span><span><strong>Atenção:</strong> Você misturou Bolos na Forma (feitos sob encomenda) com outros produtos. Considere pedidos separados para garantir o prazo!</span></div>';
      } else if (temForma) {
        el.innerHTML = '<div class="notice-encomenda"><span class="notice-encomenda-icon">⏰</span><span><strong>Bolo na Forma — Sob encomenda!</strong><br>Esses bolos são preparados especialmente para você. Prazo de <strong>5 horas a 1 dia útil</strong> após confirmação.</span></div>';
      } else {
        el.innerHTML = '';
      }
    }

    // ===================== SISTEMA DE LOGIN =====================
    const SUPABASE_URL = 'https://rfbtdtvsnftybazfmdbw.supabase.co';
    const SUPABASE_ANON = atob('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5KbVluUmtkSFp6Ym1aMGVXSmhlbVp0WkdKM0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT0RFNU1UQXpOakFzSW1WNGNDSTZNakE1TnpRNE5qTTJNSDAuSHc2OGpRRkZtd0xndndGOXpqaGdWV1BjM0QxUTJwZmdBbjFUUWxKRVZ1NA==');

    let clienteAtual = null;
    const DB_TIMEOUT = 10000; // 10 s

    // Pix / Cartão state
    const EDGE_URL = 'https://rfbtdtvsnftybazfmdbw.supabase.co/functions/v1';
    let _pixPayload = '';
    let _pixPollTimer = null;
    let _pixPedidoId = null;
    let _pixMsgWA = '';
    let _pixTotal = 0;
    let _pixNome = '';
    let _pixItens = [];
    let _pixEndereco = '';
    let _cardTipo = 'credito';

    function dbFetch(url, opts) {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), DB_TIMEOUT);
      return fetch(url, { ...opts, signal: ctrl.signal })
        .then(r => { clearTimeout(tid); return r; })
        .catch(e => { clearTimeout(tid); if (e.name === 'AbortError') throw new Error('Tempo limite excedido'); throw e; });
    }

    function dbGet(tabela, filtro) {
      return dbFetch(`${SUPABASE_URL}/rest/v1/${tabela}?${filtro}&limit=1`, {
        headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON }
      }).then(r => {
        if (!r.ok) throw new Error(`Erro ${r.status}`);
        return r.json();
      });
    }

    function dbPost(tabela, dados) {
      return dbFetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(dados)
      }).then(r => {
        if (!r.ok) throw new Error(`Erro ${r.status}`);
        return r.json();
      });
    }

    function dbPatch(tabela, filtro, dados) {
      return dbFetch(`${SUPABASE_URL}/rest/v1/${tabela}?${filtro}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(dados)
      }).then(r => {
        if (!r.ok) throw new Error(`Erro ${r.status}`);
      });
    }

    function normalizarNome(nome) {
      return nome.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }

    function mascaraTelefone(el) {
      let v = el.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d*)$/, '($1) $2-$3');
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d*)$/, '($1) $2');
      else if (v.length > 0) v = '(' + v;
      el.value = v;
    }

    let _loginTentativas = 0;
    let _loginBloqueioAte = 0;
        let _verificando = false;
    async function verificarTelefone() {
      if (_verificando) return;
      const tel = document.getElementById('loginTelefone').value.replace(/\D/g, '');
      const erro = document.getElementById('loginErro');
      if (tel.length < 10) { erro.textContent = 'Digite um número válido com DDD.'; erro.style.display = 'block'; return; }
      erro.style.display = 'none';
      const btn = document.querySelector('#etapaTelefone button');
      btn.textContent = 'Verificando...'; btn.disabled = true;
      _verificando = true;
      try {
        const dados = await dbGet('clientes', `telefone=eq.${tel}`);
        if (!Array.isArray(dados)) throw new Error('Resposta inválida');
        if (dados.length > 0) {
          entrarComCliente(dados[0]);
        } else {
          document.getElementById('etapaTelefone').style.display = 'none';
          document.getElementById('etapaCadastro').style.display = 'block';
          document.getElementById('loginTelefone').dataset.tel = tel;
          document.getElementById('loginNome').focus();
        }
      } catch (e) {
        _loginTentativas++;
        if (_loginTentativas >= 5) { _loginBloqueioAte = Date.now() + 60000; _loginTentativas = 0; }
        erro.textContent = 'Sem conexão ou erro no servidor. Tente novamente.';
        erro.style.display = 'block';
      } finally {
        btn.textContent = 'Continuar →'; btn.disabled = false;
        _verificando = false;
      }
    }

    let _cadastrando = false;
    async function cadastrar() {
      if (_cadastrando) return;
      const nome = normalizarNome(document.getElementById('loginNome').value);
      const tel = document.getElementById('loginTelefone').dataset.tel;
      const erro = document.getElementById('cadastroErro');
      if (!nome) { erro.textContent = 'Digite seu nome.'; erro.style.display = 'block'; return; }
      erro.style.display = 'none';
      const btn = document.querySelector('#etapaCadastro button');
      btn.textContent = 'Entrando...'; btn.disabled = true;
      _cadastrando = true;
      try {
        const dados = await dbPost('clientes', { nome, telefone: tel, endereco: '' });
        if (dados && dados[0]) {
          entrarComCliente(dados[0]);
        } else {
          throw new Error('Resposta inválida');
        }
      } catch (e) {
        erro.textContent = 'Erro ao cadastrar. Verifique sua conexão e tente novamente.';
        erro.style.display = 'block';
      } finally {
        btn.textContent = 'Entrar no cardápio ✨'; btn.disabled = false;
        _cadastrando = false;
      }
    }

    function voltarEtapaTelefone() {
      document.getElementById('etapaCadastro').style.display = 'none';
      document.getElementById('etapaTelefone').style.display = 'block';
    }

    function entrarComCliente(cliente) {
      clienteAtual = cliente;
      sessionStorage.setItem('gelamour_tel', cliente.telefone);
      sessionStorage.setItem('gelamour_ts', Date.now());

      document.getElementById('loginOverlay').style.display = 'none';
      document.getElementById('usuarioBar').style.display = 'inline-flex';
      document.getElementById('usuarioNome').textContent = cliente.nome;
      const roletaBtn = document.getElementById('roletaBtnFlutuante');
      if (roletaBtn) roletaBtn.style.display = 'flex';
      document.getElementById('usuarioTel').textContent = cliente.telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');

      document.getElementById('inpNome').value = cliente.nome;
      if (cliente.endereco) document.getElementById('inpEndereco').value = cliente.endereco;
    }

    function sair() {
      if (!confirm('Deseja sair da sua conta?')) return;
      clienteAtual = null;
      sessionStorage.removeItem('gelamour_tel');
      document.getElementById('usuarioBar').style.display = 'none';
      document.getElementById('inpNome').value = '';
      document.getElementById('inpEndereco').value = '';
      document.getElementById('loginTelefone').value = '';
      document.getElementById('etapaTelefone').style.display = 'block';
      document.getElementById('etapaCadastro').style.display = 'none';
      document.getElementById('loginOverlay').style.display = 'flex';
    }

    // Salva endereço atualizado no banco após finalizar pedido
    async function salvarEnderecoCliente(endereco) {
      if (!clienteAtual) return;
      try {
        await dbPatch('clientes', `id=eq.${clienteAtual.id}`, { endereco });
        clienteAtual.endereco = endereco;
      } catch (e) {
        console.warn('Não foi possível salvar o endereço:', e);
      }
    }

    // Inicializa: verifica se já tem sessão salva
    function mostrarLogin() {
      document.getElementById('loginOverlay').style.display = 'flex';
      setTimeout(() => document.getElementById('loginTelefone').focus(), 300);
    }

    (async function init() {
      try {
        const tel = sessionStorage.getItem('gelamour_tel');
        if (tel) {
          const dados = await dbGet('clientes', `telefone=eq.${tel}`);
          if (dados && dados.length > 0) { entrarComCliente(dados[0]); return; }
          sessionStorage.removeItem('gelamour_tel');
        }
      } catch (e) {
        console.warn('Erro ao verificar sessão:', e);
      }
      mostrarLogin();
    })();
    // ===================== FIM LOGIN =====================

    // Registrar Service Worker (PWA)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function(){});
    }

    // ── SINCRONIZAR PREÇOS E DISPONIBILIDADE COM SUPABASE ──
    (async function sincronizarCardapio() {
      try {
        const _sc = new AbortController();
        const _st = setTimeout(() => _sc.abort(), DB_TIMEOUT);
        const r = await fetch(SUPABASE_URL + '/rest/v1/produtos?select=nome,preco,disponivel', {
          headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON },
          signal: _sc.signal
        });
        clearTimeout(_st);
        if (!r.ok) return;
        const prods = await r.json();
        if (!Array.isArray(prods) || !prods.length) return;

        const mapa = {};
        prods.forEach(function(p) {
          // Validar estrutura antes de usar
          if (p && typeof p.nome === 'string' && p.nome.trim()) {
            mapa[p.nome.trim().toLowerCase()] = p;
          }
        });

        document.querySelectorAll('.btn-pedir').forEach(function(btn) {
          const m = btn.getAttribute('onclick').match(/pedirProduto\(this,'(.+?)',(\d+(?:\.\d+)?)\)/);
          if (!m) return;
          const nomeProd = m[1];
          const chave = nomeProd.trim().toLowerCase();
          const db = mapa[chave];
          if (!db) return;

          const card = btn.closest('.prod-card');
          if (!card) return;

          // Ocultar se indisponível
          if (db.disponivel === false) {
            card.style.display = 'none';
            return;
          }

          // Atualizar preço apenas se for número válido e positivo
          const novoPreco = parseFloat(db.preco);
          if (isNaN(novoPreco) || novoPreco <= 0) return;
          btn.setAttribute('onclick', "pedirProduto(this,'" + nomeProd.replace(/'/g, "\\'") + "'," + novoPreco + ")");
          const precoEl = card.querySelector('.prod-preco');
          if (precoEl) precoEl.textContent = 'R$ ' + novoPreco.toFixed(2).replace('.', ',');
        });
      } catch(_) {}
    })();
    // ── FIM SINCRONIZAR CARDÁPIO ──

    // ===================== ROLETA VIP =====================

    const ROLETA_PREMIOS_PADRAO = [
      '🎁 5% OFF — Compras acima de R$35',
      '🍫 Brownie Tradicional Grátis — Compras acima de R$50',
      '🎁 10% OFF — Compras acima de R$50',
      '📸 Siga a Gelamour no Instagram',
      '🛍️ Compre 2 e Leve — Até R$14 em produtos',
      '😕 Não Foi Dessa Vez — Ganha 5% OFF acima de R$35'
    ];
    let _roletaPremios = ROLETA_PREMIOS_PADRAO.slice();
    let _roletaGirandoFlag = false;
    let _roletaParticipacaoId = null;
    let _roletaRotacaoAtual = 0;

    function getSemanaAtual() {
      const now = new Date();
      const inicio = new Date(now.getFullYear(), 0, 1);
      const diff = now - inicio;
      const semana = Math.ceil((diff / 86400000 + inicio.getDay() + 1) / 7);
      return now.getFullYear() + '-W' + String(semana).padStart(2, '0');
    }

    async function abrirRoleta() {
      const bd = document.getElementById('roletaBackdrop');
      bd.classList.add('aberto');
      document.body.classList.add('modal-aberto');

      // Reset UI
      document.getElementById('roletaStatusBox').innerHTML = '';
      document.getElementById('roletaInativa').style.display = 'none';
      document.getElementById('roletaNaoLogado').style.display = 'none';
      document.getElementById('roletaInstrucoes').style.display = 'block';
      document.getElementById('roletaBtnEnviarWrap').style.display = 'block';
      document.getElementById('roletaWheelSection').style.display = 'none';
      document.getElementById('roletaJaGirou').style.display = 'none';
      document.getElementById('roletaResultado').classList.remove('visivel');

      // Carregar config e verificar status
      await carregarConfigRoleta();

      // Roda sempre visível para atrair, mas girar exige login
      desenharRoleta(_roletaPremios);
      document.getElementById('roletaWheelSection').style.display = 'block';

      if (!clienteAtual) {
        document.getElementById('roletaNaoLogado').style.display = 'block';
        document.getElementById('roletaInstrucoes').style.display = 'none';
        const girarBtn = document.getElementById('roletaGirarBtn');
        if (girarBtn) { girarBtn.disabled = true; girarBtn.style.opacity = '0.4'; girarBtn.textContent = '🔒 Faça login para girar'; }
        return;
      }

      // Verificar participação
      const status = await verificarStatusRoleta();
      atualizarUIRoleta(status);
    }

    function fecharRoleta() {
      document.getElementById('roletaBackdrop').classList.remove('aberto');
      document.body.classList.remove('modal-aberto');
    }

    function fecharRoletaBackdrop(e) {
      if (e.target.id === 'roletaBackdrop') fecharRoleta();
    }

    async function carregarConfigRoleta() {
      try {
        const r = await dbFetch(SUPABASE_URL + '/rest/v1/roleta_config?id=eq.1&limit=1', {
          headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON }
        });
        if (!r.ok) return;
        const data = await r.json();
        if (data && data[0]) {
          const cfg = data[0];
          if (!cfg.ativa) {
            document.getElementById('roletaInativa').style.display = 'block';
            document.getElementById('roletaInstrucoes').style.display = 'none';
            return;
          }
          if (cfg.premios && Array.isArray(cfg.premios) && cfg.premios.length > 0) {
            _roletaPremios = cfg.premios;
            // Atualizar grid de prêmios
            const grid = document.getElementById('roletaPremiosGrid');
            if (grid) {
              const icones = ['🍫','🧁','🚚','💸','💰','🎉','🍮','🎀','🌟'];
              grid.innerHTML = _roletaPremios.map((p, i) =>
                `<div class="roleta-premio-item">${icones[i % icones.length]} ${escHTML(p)}</div>`
              ).join('');
            }
          }
        }
      } catch(e) {
        console.warn('Erro ao carregar config roleta:', e);
      }
    }

    async function verificarStatusRoleta() {
      if (!clienteAtual) return null;
      try {
        const r = await dbFetch(
          SUPABASE_URL + '/rest/v1/roleta_participacoes?cliente_id=eq.' + clienteAtual.id + '&order=created_at.desc&limit=1',
          { headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON } }
        );
        if (!r.ok) return null;
        const data = await r.json();
        if (!data || !data[0]) return null;
        const p = data[0];
        _roletaParticipacaoId = p.id;
        return { status: p.status, ja_girou: p.ja_girou, premio: p.premio, id: p.id };
      } catch(e) {
        console.warn('Erro ao verificar status roleta:', e);
        return null;
      }
    }

    function atualizarUIRoleta(info) {
      const statusBox = document.getElementById('roletaStatusBox');
      const instrucoes = document.getElementById('roletaInstrucoes');
      const btnEnviar = document.getElementById('roletaBtnEnviarWrap');
      const wheelSection = document.getElementById('roletaWheelSection');
      const jaGirou = document.getElementById('roletaJaGirou');

      // Roda sempre visível — só o botão muda de estado
      wheelSection.style.display = 'block';
      desenharRoleta(_roletaPremios);

      const girarBtn = document.getElementById('roletaGirarBtn');

      // Conta teste: giro livre sem aprovação
      if (isContaTeste()) {
        if (girarBtn) { girarBtn.disabled = false; girarBtn.style.opacity = "1"; girarBtn.textContent = "🎡 GIRAR AGORA!"; }
        statusBox.innerHTML = "";
        instrucoes.style.display = "none";
        btnEnviar.style.display = "none";
        jaGirou.style.display = "none";
        return;
      }

      if (!info) {
        statusBox.innerHTML = '';
        instrucoes.style.display = 'block';
        btnEnviar.style.display = 'block';
        jaGirou.style.display = 'none';
        if (girarBtn) { girarBtn.disabled = true; girarBtn.style.opacity = '0.4'; girarBtn.title = 'Envie suas provas para liberar a roleta'; }
        return;
      }

      if (info.status === 'pendente') {
        statusBox.innerHTML = '<div class="roleta-status-box roleta-status-pendente">⏳ <div><strong>Participação enviada!</strong><br>Suas provas estão em análise. Aguarde a aprovação (até 24h).</div></div>';
        instrucoes.style.display = 'block';
        btnEnviar.style.display = 'none';
        jaGirou.style.display = 'none';
        if (girarBtn) { girarBtn.disabled = true; girarBtn.style.opacity = '0.4'; girarBtn.title = 'Aguardando aprovação'; }
      } else if (info.status === 'rejeitado') {
        statusBox.innerHTML = '<div class="roleta-status-box roleta-status-rejeitado">❌ <div><strong>Participação não aprovada.</strong><br>Tente novamente cumprindo todos os requisitos.</div></div>';
        instrucoes.style.display = 'block';
        btnEnviar.style.display = 'block';
        jaGirou.style.display = 'none';
        if (girarBtn) { girarBtn.disabled = true; girarBtn.style.opacity = '0.4'; }
      } else if (info.status === 'aprovado' && !info.ja_girou) {
        // Verificar se a aprovação foi hoje — sem acúmulo
        const hoje = new Date().toISOString().split('T')[0];
        const diaAprovacao = info.data_aprovacao ? info.data_aprovacao.split('T')[0] : null;
        const aprovadoHoje = diaAprovacao === hoje;
        if (!aprovadoHoje) {
          statusBox.innerHTML = '<div class="roleta-status-box roleta-status-rejeitado">⏰ <div><strong>Prazo expirado.</strong><br>Você foi aprovado em outro dia e não girou a tempo. Envie novas provas para participar novamente.</div></div>';
          instrucoes.style.display = 'none';
          btnEnviar.style.display = 'block';
          jaGirou.style.display = 'none';
          if (girarBtn) { girarBtn.disabled = true; girarBtn.style.opacity = '0.4'; girarBtn.textContent = '🔒 Prazo expirado'; }
        } else {
          statusBox.innerHTML = '<div class="roleta-status-box roleta-status-aprovado">✅ <div><strong>Aprovado! Gire hoje!</strong><br>Você tem até meia-noite para usar seu giro. Não acumula!</div></div>';
          instrucoes.style.display = 'none';
          btnEnviar.style.display = 'none';
          jaGirou.style.display = 'none';
          if (girarBtn) { girarBtn.disabled = false; girarBtn.style.opacity = '1'; girarBtn.textContent = '🎡 GIRAR AGORA!'; }
        }
      } else if (info.ja_girou && !isContaTeste()) {
        statusBox.innerHTML = '';
        instrucoes.style.display = 'none';
        btnEnviar.style.display = 'none';
        jaGirou.style.display = 'block';
        if (girarBtn) { girarBtn.disabled = true; girarBtn.style.opacity = '0.4'; }
        const premioEl = document.getElementById('roletaJaGirouPremio');
        if (info.premio) {
          premioEl.innerHTML = 'Seu prêmio foi: <strong style="color:var(--rosa)">' + escHTML(info.premio) + '</strong>. Entre em contato conosco para resgatar!';
        } else {
          premioEl.textContent = 'Você já usou sua chance nesta campanha.';
        }
      }
    }

    async function enviarProvasWhatsApp() {
      if (!clienteAtual) {
        alert('Faça login antes de enviar suas provas.');
        return;
      }

      // Verificar se já tem participação pendente/aprovada
      const statusAtual = await verificarStatusRoleta();
      if (statusAtual && (statusAtual.status === 'pendente' || statusAtual.status === 'aprovado')) {
        atualizarUIRoleta(statusAtual);
        return;
      }

      const nome = clienteAtual.nome || '';
      const tel = clienteAtual.telefone || '';
      const instEl = document.getElementById('roletaInstagramInput');
      const instagram = instEl ? instEl.value.trim() : '';
      const msg = 'Olá, equipe Gelamour! Quero participar da Roleta VIP.%0A%0ANome: ' + encodeURIComponent(nome) +
        '%0ATelefone: ' + encodeURIComponent(tel) +
        (instagram ? '%0AInstagram: ' + encodeURIComponent(instagram) : '') +
        '%0A%0AEstou enviando a foto dos meus 5 adesivos e o print do Story para validação!';

      window.open('https://wa.me/' + WA_NUMBER + '?text=' + msg, '_blank');

      // Registrar participação como pendente
      await registrarParticipacao(instagram);
      atualizarUIRoleta({ status: 'pendente', ja_girou: false });
    }

    async function registrarParticipacao(instagram) {
      if (!clienteAtual) return;
      try {
        // Checar novamente se já existe
        const check = await verificarStatusRoleta();
        if (check && check.status !== 'rejeitado') return;

        const semana = getSemanaAtual();
        await dbPost('roleta_participacoes', {
          cliente_id: clienteAtual.id,
          nome: clienteAtual.nome,
          telefone: clienteAtual.telefone,
          instagram: instagram || null,
          status: 'pendente',
          semana: semana
        });
      } catch(e) {
        console.warn('Erro ao registrar participação:', e);
      }
    }

    // ── Roleta SVG Profissional ──────────────────────────────────────
    function desenharRoleta(premios) {
      const wrap = document.querySelector('.roleta-pointer-wrap');
      if (!wrap) return;
      const old = document.getElementById('roletaCanvas');
      if (old) old.remove();

      const N = premios.length;
      const CX = 200, CY = 200, R = 164, R_LED = 182, R_OUTER = 196;
      const SEG = 360 / N;
      const CORES = [
        { bg: '#FAF0F2', txt: '#B5134F' },
        { bg: '#E8528A', txt: '#FFFFFF' },
      ];

      function rad(d) { return d * Math.PI / 180; }
      function pt(d, r) { return [CX + r * Math.cos(rad(d)), CY + r * Math.sin(rad(d))]; }
      function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

      function segPath(i) {
        const s = SEG * i - 90, e = s + SEG;
        const [x1,y1] = pt(s, R), [x2,y2] = pt(e, R);
        return `M${CX},${CY} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
      }

      function wrapWords(text, maxChars) {
        const words = text.split(' ');
        const lines = []; let cur = '';
        words.forEach(w => {
          const test = cur ? cur + ' ' + w : w;
          if (test.length > maxChars && cur) { lines.push(cur); cur = w; }
          else cur = test;
        });
        if (cur) lines.push(cur);
        return lines.slice(0, 3);
      }

      // Segments
      const segs = premios.map((p,i) => {
        const c = CORES[i%2];
        return `<path d="${segPath(i)}" fill="${c.bg}" stroke="#D4AF37" stroke-width="2" shape-rendering="geometricPrecision"/>`;
      }).join('');

      // Gold divider lines
      const spokes = premios.map((_,i) => {
        const d = SEG * i - 90;
        const [x,y] = pt(d, R);
        return `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#D4AF37" stroke-width="2"/>`;
      }).join('');

      // Text blocks per segment
      const texts = premios.map((p,i) => {
        const mid = SEG * i - 90 + SEG / 2;
        const [tx,ty] = pt(mid, R * 0.57);
        const c = CORES[i%2];
        // Split: first non-space token = emoji, rest = text
        const m = p.match(/^(\S+)\s+(.+)$/);
        const emoji = m ? m[1] : '';
        const rest  = m ? m[2] : p;
        const lines = wrapWords(rest, 13);
        const lineH = 11.5;
        const totalTxtH = lines.length * lineH;
        const emojiY = -(totalTxtH / 2) - 11;
        const rot = (mid + 90).toFixed(1);
        return `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) rotate(${rot})" text-rendering="geometricPrecision">
  <text x="0" y="${emojiY.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="15" font-family="serif">${esc(emoji)}</text>
  ${lines.map((l,li) => {
    const yp = ((li - (lines.length - 1) / 2) * lineH).toFixed(1);
    return `<text x="0" y="${yp}" text-anchor="middle" dominant-baseline="middle" fill="${c.txt}" font-family="'DM Sans',Arial,sans-serif" font-weight="700" font-size="9">${esc(l)}</text>`;
  }).join('\n  ')}
</g>`;
      }).join('');

      // LED ring
      const LED_N = 30;
      const leds = Array.from({length: LED_N}, (_,i) => {
        const [lx,ly] = pt((360/LED_N)*i - 90, R_LED);
        return `<circle cx="${lx.toFixed(2)}" cy="${ly.toFixed(2)}" r="5.5" class="r-led r-led-${i%2}"/>`;
      }).join('');

      const svg = `<svg id="roletaCanvas" viewBox="0 0 400 400"
  style="width:min(86vw,340px);height:min(86vw,340px);display:block;filter:drop-shadow(0 6px 20px rgba(0,0,0,.42))"
  xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="rg-ring" cx="50%" cy="50%" r="50%">
      <stop offset="70%" stop-color="#D42B73"/>
      <stop offset="100%" stop-color="#6A082E"/>
    </radialGradient>
    <radialGradient id="rg-ctr" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FFE57A"/>
      <stop offset="48%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#7A5800"/>
    </radialGradient>
    <filter id="f-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="${CX}" cy="${CY}" r="${R_OUTER}" fill="url(#rg-ring)"/>
  <circle cx="${CX}" cy="${CY}" r="${R_OUTER}" fill="none" stroke="#D4AF37" stroke-width="3.5"/>
  <g id="roletaRoda">
    ${segs}
    ${spokes}
    ${texts}
  </g>
  <circle cx="${CX}" cy="${CY}" r="${R+1}" fill="none" stroke="#D4AF37" stroke-width="3"/>
  ${leds}
  <circle cx="${CX}" cy="${CY}" r="42" fill="url(#rg-ctr)" stroke="#FFF" stroke-width="3.5" filter="url(#f-glow)"/>
  <circle cx="${CX}" cy="${CY}" r="38" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
  <text x="${CX}" y="${CY-7}" text-anchor="middle" dominant-baseline="middle" fill="#FFF" font-family="'DM Sans',Arial,sans-serif" font-weight="800" font-size="12" letter-spacing="1.5" text-rendering="geometricPrecision">GIRAR</text>
  <text x="${CX}" y="${CY+9}" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,.85)" font-family="serif" font-size="11">★ ★ ★</text>
</svg>`;

      const div = document.createElement('div');
      div.innerHTML = svg;
      wrap.insertBefore(div.firstElementChild, wrap.firstChild);
    }

    async function girarRoleta() {
      if (_roletaGirandoFlag) return;
      const btn = document.getElementById('roletaGirarBtn');
      if (!btn) return;

      // Verificar limite de vencedores (conta teste tem giros infinitos)
      if (!isContaTeste()) {
      try {
        const semana = getSemanaAtual();
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/roleta_vencedores?semana=eq.${semana}&select=id`, {
          headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
        });
        const vencedores = await resp.json();
        // Buscar limite configurado
        const cfgResp = await fetch(`${SUPABASE_URL}/rest/v1/roleta_config?id=eq.1&select=max_vencedores_semana`, {
          headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
        });
        const cfg = await cfgResp.json();
        const limite = cfg[0]?.max_vencedores_semana ?? 1;
        if (vencedores.length >= limite) {
          btn.disabled = true;
          btn.style.opacity = '0.4';
          document.getElementById('roletaResultado').innerHTML = '⚠️ <strong>Já temos um ganhador esta semana!</strong><br><small>A próxima rodada começa na semana que vem. Fique de olho!</small>';
          document.getElementById('roletaResultado').classList.add('visivel');
          return;
        }
      } catch(e) { console.warn('Erro ao verificar limite semanal:', e); } }

      _roletaGirandoFlag = true;
      btn.disabled = true;
      btn.textContent = 'Girando...';

      const n = _roletaPremios.length;
      const arc = 360 / n;

      // Prêmio aleatório
      const indice = Math.floor(Math.random() * n);
      const premio = _roletaPremios[indice];

      // Calcular rotação final: voltas extras + posição do prêmio
      const voltasExtras = 5 + Math.floor(Math.random() * 5); // 5-9 voltas
      // O ponteiro aponta para cima (0°). O segmento i começa em (360/n)*i - 90.
      // Para que o segmento i fique no topo, precisamos rotacionar para:
      const anguloAlvo = voltasExtras * 360 + (360 - arc * indice - arc / 2);
      const rotacaoFinal = _roletaRotacaoAtual + anguloAlvo;

      // Animar com CSS transform
      const roda = document.getElementById('roletaRoda');
      if (roda) {
        roda.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 1)';
        roda.style.transformOrigin = '200px 200px';
        roda.style.transform = 'rotate(' + rotacaoFinal + 'deg)';
      }
      _roletaRotacaoAtual = rotacaoFinal % 360;

      // Aguardar animação
      await new Promise(res => setTimeout(res, 4200));

      // Mostrar resultado
      const resultEl = document.getElementById('roletaResultado');
      resultEl.innerHTML = '🎉 Você ganhou: <strong style="color:var(--rosa)">' + escHTML(premio) + '</strong>!<br><small style="font-size:13px;color:var(--texto-sec)">Entre em contato conosco pelo WhatsApp para resgatar seu prêmio!</small>';
      resultEl.classList.add('visivel');

      btn.textContent = '✓ Girado!';

      // Salvar resultado no banco
      await salvarVencedor(premio);

      _roletaGirandoFlag = false;
      if (isContaTeste()) { btn.disabled = false; btn.textContent = "🎡 GIRAR AGORA!"; }
    }

    async function salvarVencedor(premio) {
      if (!clienteAtual || !_roletaParticipacaoId) return;
      if (isContaTeste()) return; // conta teste: não registra no banco
      try {
        // Marcar participação como já girou
        await dbPatch('roleta_participacoes', 'id=eq.' + _roletaParticipacaoId, {
          ja_girou: true,
          premio: premio
        });
        // Registrar vencedor
        await dbPost('roleta_vencedores', {
          participacao_id: _roletaParticipacaoId,
          cliente_id: clienteAtual.id,
          nome: clienteAtual.nome,
          telefone: clienteAtual.telefone,
          premio: premio,
          semana: getSemanaAtual()
        });
      } catch(e) {
        console.warn('Erro ao salvar vencedor:', e);
      }
    }

    // ===== PAINEL ADMIN =====

    // Adicionar link de acesso ao admin no rodapé (só para admin)
    // Para acessar: chamar abrirRoletaAdmin() no console ou via link escondido
    // O número de admin (WA_NUMBER decodificado) é o critério de acesso
    function verificarAdmin() {
      if (!clienteAtual) return false;
      // Admin é identificado pelo telefone cadastrado como admin
      const ADMIN_TEL = '11940772750'; // número sem formatação do WA_NUMBER
      const telCliente = (clienteAtual.telefone || '').replace(/\D/g, '');
      return telCliente === ADMIN_TEL;
    }

    async function abrirRoletaAdmin() {
      if (!verificarAdmin()) {
        alert('Acesso restrito.');
        return;
      }
      document.getElementById('roletaAdminBackdrop').classList.add('aberto');
      await carregarParticipantesRoleta();
      await carregarConfigAdmin();
    }

    function fecharRoletaAdmin() {
      document.getElementById('roletaAdminBackdrop').classList.remove('aberto');
    }

    function fecharRoletaAdminBackdrop(e) {
      if (e.target.id === 'roletaAdminBackdrop') fecharRoletaAdmin();
    }

    function abrirTabAdmin(tab, btn) {
      document.querySelectorAll('.roleta-admin-tab').forEach(t => t.classList.remove('ativo'));
      document.querySelectorAll('.roleta-admin-panel').forEach(p => p.classList.remove('ativo'));
      btn.classList.add('ativo');
      document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('ativo');

      if (tab === 'pendentes') carregarParticipantesRoleta();
      else if (tab === 'aprovados') carregarAprovadosRoleta();
      else if (tab === 'vencedores') carregarVencedoresRoleta();
      else if (tab === 'config') carregarConfigAdmin();
    }

    async function carregarParticipantesRoleta() {
      const el = document.getElementById('listaPendentes');
      if (!el) return;
      el.innerHTML = '<div class="roleta-empty">Carregando...</div>';
      try {
        const r = await dbFetch(
          SUPABASE_URL + '/rest/v1/roleta_participacoes?status=eq.pendente&order=created_at.desc',
          { headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON } }
        );
        const data = await r.json();
        if (!data || !data.length) { el.innerHTML = '<div class="roleta-empty">Nenhum participante pendente.</div>'; return; }
        el.innerHTML = data.map(function(p) {
          const dt = new Date(p.created_at).toLocaleString('pt-BR');
          return '<div class="roleta-participante-item">' +
            '<div class="roleta-participante-info">' +
              '<div class="roleta-participante-nome">' + escHTML(p.nome) + '</div>' +
              '<div class="roleta-participante-tel">' + escHTML(p.telefone) + (p.instagram ? ' · @' + escHTML(p.instagram) : '') + '</div>' +
              '<div style="font-size:11px;color:#999">' + dt + '</div>' +
            '</div>' +
            '<div class="roleta-participante-acoes">' +
              '<button class="btn-aprovar" onclick="aprovarParticipante(' + p.id + ', this)">✓ Aprovar</button>' +
              '<button class="btn-rejeitar" onclick="rejeitarParticipante(' + p.id + ', this)">✗ Rejeitar</button>' +
            '</div>' +
          '</div>';
        }).join('');
      } catch(e) {
        el.innerHTML = '<div class="roleta-empty">Erro ao carregar.</div>';
      }
    }

    async function carregarAprovadosRoleta() {
      const el = document.getElementById('listaAprovados');
      if (!el) return;
      el.innerHTML = '<div class="roleta-empty">Carregando...</div>';
      try {
        const r = await dbFetch(
          SUPABASE_URL + '/rest/v1/roleta_participacoes?status=eq.aprovado&order=data_aprovacao.desc',
          { headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON } }
        );
        const data = await r.json();
        if (!data || !data.length) { el.innerHTML = '<div class="roleta-empty">Nenhum aprovado ainda.</div>'; return; }
        el.innerHTML = data.map(function(p) {
          const dt = p.data_aprovacao ? new Date(p.data_aprovacao).toLocaleString('pt-BR') : '—';
          const girou = p.ja_girou ? '✓ Girou — ' + escHTML(p.premio || '') : '⏳ Aguardando girar';
          return '<div class="roleta-participante-item">' +
            '<div class="roleta-participante-info">' +
              '<div class="roleta-participante-nome">' + escHTML(p.nome) + '</div>' +
              '<div class="roleta-participante-tel">' + escHTML(p.telefone) + '</div>' +
              '<div style="font-size:11px;color:#388e3c">' + girou + '</div>' +
              '<div style="font-size:11px;color:#999">Aprovado em: ' + dt + '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      } catch(e) {
        el.innerHTML = '<div class="roleta-empty">Erro ao carregar.</div>';
      }
    }

    async function aprovarParticipante(id, btn) {
      btn.disabled = true;
      btn.textContent = '...';
      try {
        await dbPatch('roleta_participacoes', 'id=eq.' + id, {
          status: 'aprovado',
          data_aprovacao: new Date().toISOString(),
          aprovado_por: clienteAtual ? clienteAtual.nome : 'admin'
        });
        btn.closest('.roleta-participante-item').remove();
      } catch(e) {
        btn.disabled = false;
        btn.textContent = '✓ Aprovar';
        alert('Erro ao aprovar.');
      }
    }

    async function rejeitarParticipante(id, btn) {
      if (!confirm('Rejeitar esta participação?')) return;
      btn.disabled = true;
      btn.textContent = '...';
      try {
        await dbPatch('roleta_participacoes', 'id=eq.' + id, { status: 'rejeitado' });
        btn.closest('.roleta-participante-item').remove();
      } catch(e) {
        btn.disabled = false;
        btn.textContent = '✗ Rejeitar';
        alert('Erro ao rejeitar.');
      }
    }

    async function carregarVencedoresRoleta() {
      const el = document.getElementById('listaVencedores');
      if (!el) return;
      el.innerHTML = '<div class="roleta-empty">Carregando...</div>';
      try {
        const r = await dbFetch(
          SUPABASE_URL + '/rest/v1/roleta_vencedores?order=data_vitoria.desc',
          { headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON } }
        );
        const data = await r.json();
        if (!data || !data.length) { el.innerHTML = '<div class="roleta-empty">Nenhum vencedor ainda.</div>'; return; }
        el.innerHTML = data.map(function(v) {
          const dt = new Date(v.data_vitoria).toLocaleString('pt-BR');
          return '<div class="roleta-vencedor-item">' +
            '<div class="roleta-vencedor-nome">🏆 ' + escHTML(v.nome || '—') + '</div>' +
            '<div class="roleta-vencedor-premio">🎁 ' + escHTML(v.premio) + '</div>' +
            '<div class="roleta-vencedor-data">' + escHTML(v.telefone || '') + ' · Semana ' + escHTML(v.semana || '') + ' · ' + dt + '</div>' +
          '</div>';
        }).join('');
      } catch(e) {
        el.innerHTML = '<div class="roleta-empty">Erro ao carregar.</div>';
      }
    }

    async function carregarConfigAdmin() {
      try {
        const r = await dbFetch(SUPABASE_URL + '/rest/v1/roleta_config?id=eq.1&limit=1', {
          headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON }
        });
        const data = await r.json();
        if (data && data[0]) {
          document.getElementById('configAtiva').checked = data[0].ativa;
          const premios = Array.isArray(data[0].premios) ? data[0].premios : ROLETA_PREMIOS_PADRAO;
          document.getElementById('configPremios').value = premios.join('\n');
        }
      } catch(e) {
        console.warn('Erro ao carregar config admin:', e);
      }
    }

    async function salvarConfigRoleta() {
      const ativa = document.getElementById('configAtiva').checked;
      const premiosTxt = document.getElementById('configPremios').value;
      const premios = premiosTxt.split('\n').map(s => s.trim()).filter(s => s.length > 0);
      const msgEl = document.getElementById('configMsg');
      try {
        await dbPatch('roleta_config', 'id=eq.1', {
          ativa: ativa,
          premios: premios,
          updated_at: new Date().toISOString()
        });
        _roletaPremios = premios;
        msgEl.style.display = 'block';
        setTimeout(() => { msgEl.style.display = 'none'; }, 2500);
      } catch(e) {
        alert('Erro ao salvar configurações.');
      }
    }

    // Expor função de admin via console para acesso pelo administrador
    window.abrirRoletaAdmin = abrirRoletaAdmin;

    // ===================== FIM ROLETA VIP =====================

  