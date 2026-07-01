// src/main.ts — ponto de entrada Gelamour (Clean Architecture)
import { mostrarToast } from './utils/toast';
import { escHTML } from './utils/security';
import { aplicarMascaraTelefone } from './utils/format';
import { loginUseCase, cartService, pedidoRepository, roletaRepository, clienteRepository } from './container';
import { appStore, isContaTeste } from './state/AppStore';
import { logger } from './core/logger';
import { Cliente as ClienteEntity } from './domain/cliente';
import { getSemanaAtual } from './utils/format';
import {
  getPremios, getPremiosPadrao, setPremios,
  setParticipacaoId,
  carregarConfig as carregarConfigRoleta,
  verificarStatus as verificarStatusRoleta,
  girar as girarRoletaFn,
  salvarVencedor,
  desenharRoleta
} from './modules/roleta';
import { isBoloForma, renderizarLista } from './modules/cart';
import type { Cliente, Participacao } from './types';
import { SUPABASE_URL, SUPABASE_ANON } from './infrastructure/supabase/client';

const log = logger.child('main');

// ===== CONSTANTES =====
const WA_NUMBER = atob('NTUxMTk0MDc3Mjc1MA==');

let _verificando = false;
let _cadastrando = false;

// Helper: lê cliente atual do store
function getClienteAtual(): Cliente | null {
  return appStore.getState().cliente as Cliente | null;
}

// ===== FILTROS =====
function filtrar(cat: string, _btn: HTMLElement): void {
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll<HTMLElement>('.filtro-btn[data-filtro="' + cat + '"]')
    .forEach(b => b.classList.add('active'));
  document.querySelectorAll('.prod-card').forEach(card => {
    const el = card as HTMLElement;
    if (cat === 'todos' || (el.dataset['cat'] === cat))
      el.classList.remove('hidden');
    else
      el.classList.add('hidden');
  });
}

// ===== CARRINHO =====
function atualizarFab(): void {
  const fab = document.getElementById('cartFab');
  const badge = document.getElementById('cartBadge');
  const count = cartService.getCount();
  if (badge) badge.textContent = String(count);
  if (fab) {
    if (count > 0) fab.classList.add('ativo');
    else { fab.classList.remove('ativo'); fecharModal(); }
  }
}

function pedirProduto(botao: HTMLElement, nome: string, preco: number): void {
  const card = botao.closest('.prod-card') as HTMLElement | null;
  if (cartService.has(nome)) {
    cartService.remove(nome);
    card?.classList.remove('selecionado');
    atualizarFab();
    return;
  }
  cartService.add(nome, preco);
  card?.classList.add('selecionado');
  atualizarFab();
  abrirDialog(nome, preco);
}

function abrirDialog(nome: string, preco: number): void {
  const el = document.getElementById('dialogProduto');
  if (el) el.innerHTML = '<strong>' + escHTML(nome) + '</strong> — R$ ' + Number(preco).toFixed(2).replace('.', ',');
  document.getElementById('dialogBackdrop')?.classList.add('aberto');
}

function fecharDialog(): void {
  document.getElementById('dialogBackdrop')?.classList.remove('aberto');
}

function fecharDialogBackdrop(e: Event): void {
  if ((e.target as HTMLElement).id === 'dialogBackdrop') fecharDialog();
}

function irParaFinalizar(): void {
  fecharDialog();
  abrirModal();
}

function renderizarCarrinho(): void {
  renderizarLista('listaCarrinho', 'totalRodape', 'badgeCount');
}

function renderizarNoticeEncomenda(): void {
  const el = document.getElementById('noticeEncomenda');
  if (!el) return;
  const itens = cartService.getItems();
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

function abrirModal(): void {
  renderizarCarrinho();
  renderizarNoticeEncomenda();
  document.getElementById('modalBackdrop')?.classList.add('aberto');
  document.body.classList.add('modal-aberto');
}

function fecharModal(): void {
  document.getElementById('modalBackdrop')?.classList.remove('aberto');
  document.body.classList.remove('modal-aberto');
}

function fecharModalBackdrop(e: Event): void {
  if ((e.target as HTMLElement).id === 'modalBackdrop') fecharModal();
}

function removerDoCarrinho(nome: string): void {
  if (!cartService.has(nome)) return;
  cartService.remove(nome);
  document.querySelectorAll('.prod-card.selecionado').forEach(card => {
    const nomeEl = card.querySelector('.prod-nome');
    if (nomeEl && nomeEl.textContent?.trim() === nome) card.classList.remove('selecionado');
  });
  renderizarCarrinho();
  atualizarFab();
}

function selecionarPagamento(el: HTMLElement): void {
  document.querySelectorAll('.pagamento-opt').forEach(o => o.classList.remove('ativo'));
  el.classList.add('ativo');
  const tipo = (el as HTMLElement & { dataset: DOMStringMap }).dataset['pag'] ?? '';
  appStore.setState({ pagamentoSelecionado: tipo });
}

function limparCarrinho(): void {
  cartService.clear();
  appStore.setState({ pagamentoSelecionado: '' });
  document.querySelectorAll('.pagamento-opt.ativo').forEach(o => o.classList.remove('ativo'));
  const obsEl = document.getElementById('inpObs') as HTMLTextAreaElement | null;
  if (obsEl) obsEl.value = '';
  document.querySelectorAll('.prod-card.selecionado').forEach(c => c.classList.remove('selecionado'));
  atualizarFab();
  fecharModal();
}

// ===== BOLO NA FORMA =====
function pedirBoloForma(botao: HTMLElement, nome: string, preco: number): void {
  const card = botao.closest('.prod-card') as HTMLElement | null;
  if (cartService.has(nome)) {
    cartService.remove(nome);
    card?.classList.remove('selecionado');
    atualizarFab();
    renderizarNoticeEncomenda();
    return;
  }
  cartService.add(nome, preco);
  card?.classList.add('selecionado');
  atualizarFab();
  abrirDialogBolo();
}

function abrirDialogBolo(): void {
  document.getElementById('dialogBoloBackdrop')?.classList.add('aberto');
}

function fecharDialogBolo(e?: Event): void {
  if (!e || (e.target as HTMLElement).id === 'dialogBoloBackdrop') {
    document.getElementById('dialogBoloBackdrop')?.classList.remove('aberto');
  }
}

// ===== CAROUSEL =====
function carouselNext(id: string, e: Event): void {
  if (e) e.stopPropagation();
  const c = document.getElementById(id);
  if (!c) return;
  const imgs = c.querySelectorAll('.carousel-img');
  const dots = c.querySelectorAll('.carousel-dot');
  let cur = 0;
  imgs.forEach((img, i) => { if (img.classList.contains('ativo')) cur = i; });
  imgs[cur]?.classList.remove('ativo');
  dots[cur]?.classList.remove('ativo');
  const next = (cur + 1) % imgs.length;
  imgs[next]?.classList.add('ativo');
  dots[next]?.classList.add('ativo');
}

function carouselPrev(id: string, e: Event): void {
  if (e) e.stopPropagation();
  const c = document.getElementById(id);
  if (!c) return;
  const imgs = c.querySelectorAll('.carousel-img');
  const dots = c.querySelectorAll('.carousel-dot');
  let cur = 0;
  imgs.forEach((img, i) => { if (img.classList.contains('ativo')) cur = i; });
  imgs[cur]?.classList.remove('ativo');
  dots[cur]?.classList.remove('ativo');
  const prev = (cur - 1 + imgs.length) % imgs.length;
  imgs[prev]?.classList.add('ativo');
  dots[prev]?.classList.add('ativo');
}

// ===== CHECKOUT — 100% WhatsApp =====
async function finalizarPedido(): Promise<void> {
  const itens = cartService.getItems();
  const temFormaFin = itens.some(i => isBoloForma(i.nome));
  const temOutrosFin = itens.some(i => !isBoloForma(i.nome));

  if (temFormaFin && temOutrosFin) {
    if (!confirm('⚠️ Atenção!\n\nVocê tem Bolos na Forma (feitos sob encomenda) misturados com outros produtos.\n\nBolos na Forma precisam de prazo de 5h a 1 dia útil para preparo.\n\nDeseja prosseguir mesmo assim?'))
      return;
  }
  if (itens.length === 0) { alert('Adicione pelo menos um produto ao carrinho!'); return; }

  const nome = (document.getElementById('inpNome') as HTMLInputElement)?.value.trim() ?? '';
  const endereco = (document.getElementById('inpEndereco') as HTMLTextAreaElement)?.value.trim() ?? '';
  const obs = (document.getElementById('inpObs') as HTMLTextAreaElement)?.value.trim() ?? '';
  const pagamentoSelecionado = appStore.getState().pagamentoSelecionado;
  const clienteAtual = getClienteAtual();

  if (!nome) { alert('Por favor, informe seu nome completo.'); document.getElementById('inpNome')?.focus(); return; }
  if (!endereco) { alert('Por favor, informe seu endereço.'); document.getElementById('inpEndereco')?.focus(); return; }
  if (!pagamentoSelecionado) { alert('Por favor, escolha a forma de pagamento.'); return; }

  // Re-verificar preços dos botões para evitar manipulação client-side
  const priceMap = new Map<string, number>();
  document.querySelectorAll('.btn-pedir').forEach(btn => {
    const onclickAttr = btn.getAttribute('onclick') ?? '';
    const m = onclickAttr.match(/pedir(?:Produto|BoloForma)\(this,'(.+?)',(\d+(?:\.\d+)?)\)/);
    if (m) priceMap.set(m[1]!, parseFloat(m[2]!));
  });
  cartService.revalidatePrices(priceMap);

  const itensVerificados = Array.from(cartService.getItems());
  let total = 0;
  let linhasItens = '';
  itensVerificados.forEach(item => {
    total = Math.round((total + item.preco) * 100) / 100;
    linhasItens += `• ${item.nome} — R$ ${item.preco.toFixed(2).replace('.', ',')}\n`;
  });

  const encomendaNote = temFormaFin
    ? '\n\n⏰ *Atenção: contém item sob encomenda — prazo de 5h a 1 dia útil para preparo.*'
    : '';
  const msg = `*🍰 NOVO PEDIDO - GELAMOUR*\n\n*📋 ITENS:*\n${linhasItens}\n*💰 Total:* R$ ${total.toFixed(2).replace('.', ',')}\n\n*👤 Nome:* ${nome}\n*📍 Endereço:* ${endereco}\n*💳 Pagamento:* ${pagamentoSelecionado}${obs ? `\n*📝 Obs:* ${obs}` : ''}${encomendaNote}\n\nPedido pelo cardápio online ✨`;

  const btnFin = document.getElementById('btnFinalizar') as HTMLButtonElement | null;
  const txtOrig = btnFin ? (btnFin.textContent ?? '') : '';
  if (btnFin) { btnFin.disabled = true; btnFin.textContent = 'Salvando pedido...'; }

  // Salvar no banco (best-effort — não bloqueia o WhatsApp)
  let _pedidoId: number | null = null;
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 10_000);
    const r = await fetch(SUPABASE_URL + '/rest/v1/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON,
        'Prefer': 'return=headers-only'
      },
      body: JSON.stringify({
        nome, endereco,
        pagamento: pagamentoSelecionado,
        itens: itensVerificados.map(i => ({ nome: i.nome, preco: i.preco })),
        total,
        status: 'aguardando',
        observacao: obs || null,
        cliente_id: clienteAtual ? clienteAtual.id : null,
        telefone: clienteAtual ? clienteAtual.telefone : null
      }),
      signal: ctrl.signal
    });
    clearTimeout(tid);
    if (r.ok) {
      const loc = r.headers.get('Location') ?? '';
      const idMatch = loc.match(/id=eq\.(\d+)/);
      if (idMatch) {
        _pedidoId = parseInt(idMatch[1]!, 10);
        if (clienteAtual && clienteAtual.id) {
          clienteRepository.updateEndereco(clienteAtual.id, endereco)
            .catch((e: unknown) => log.warn('Não foi possível salvar endereço', { error: String(e) }));
        }
      }
    } else {
      log.warn('INSERT pedido falhou', { status: r.status });
    }
  } catch (e) {
    log.warn('Erro ao salvar no banco — pedido vai só pelo WhatsApp', { error: String(e) });
  }

  setTimeout(() => {
    if (btnFin) { btnFin.disabled = false; btnFin.textContent = txtOrig; }
  }, 2000);

  // Redirecionar para WhatsApp
  window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');

  fecharModal();

  if (_pedidoId) {
    appStore.setState({ pedidoIdPendente: _pedidoId });
    document.getElementById('waConfirmBackdrop')?.classList.add('aberto');
  } else {
    // Sem ID no banco — limpa direto
    limparCarrinho();
  }
}

async function confirmarEnvioWA(): Promise<void> {
  const id = appStore.getState().pedidoIdPendente;
  const btn = document.querySelector('.waConfirm-sim') as HTMLButtonElement | null;
  const clienteAtual = getClienteAtual();
  if (!id) { fecharConfirmWA(); return; }
  if (!clienteAtual || !clienteAtual.id) { fecharConfirmWA(); limparCarrinho(); return; }
  if (btn) { btn.textContent = 'Confirmando...'; btn.disabled = true; }
  const result = await pedidoRepository.updateStatus(id, clienteAtual.id, 'confirmado');
  if (result.ok) {
    if (btn) btn.textContent = '🎉 Pedido confirmado!';
    setTimeout(() => { fecharConfirmWA(); limparCarrinho(); }, 1800);
  } else {
    log.warn('Erro ao confirmar pedido', { error: result.error.message });
    fecharConfirmWA();
    limparCarrinho();
  }
}

function fecharConfirmWA(): void {
  document.getElementById('waConfirmBackdrop')?.classList.remove('aberto');
  appStore.setState({ pedidoIdPendente: null });
}

// ===== LOGIN UI =====
function mascaraTelefone(el: HTMLInputElement): void {
  el.value = aplicarMascaraTelefone(el.value);
}

function entrarComCliente(clienteRaw: Cliente): void {
  const domainCliente = ClienteEntity.fromDB(clienteRaw);
  loginUseCase.login(domainCliente);

  document.getElementById('loginOverlay')!.style.display = 'none';
  const usuarioBar = document.getElementById('usuarioBar');
  if (usuarioBar) usuarioBar.style.display = 'inline-flex';
  const usuarioNomeEl = document.getElementById('usuarioNome');
  if (usuarioNomeEl) usuarioNomeEl.textContent = clienteRaw.nome;
  const roletaBtn = document.getElementById('roletaBtnFlutuante') as HTMLElement | null;
  if (roletaBtn) roletaBtn.style.display = 'flex';
  const usuarioTel = document.getElementById('usuarioTel');
  if (usuarioTel) usuarioTel.textContent = clienteRaw.telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  const inpNome = document.getElementById('inpNome') as HTMLInputElement | null;
  if (inpNome) inpNome.value = clienteRaw.nome;
  const inpEndereco = document.getElementById('inpEndereco') as HTMLTextAreaElement | null;
  if (inpEndereco && clienteRaw.endereco) inpEndereco.value = clienteRaw.endereco;
}

async function verificarTelefone(): Promise<void> {
  if (_verificando) return;
  const telInput = document.getElementById('loginTelefone') as HTMLInputElement;
  const erro = document.getElementById('loginErro');
  const btn = document.querySelector('#etapaTelefone button') as HTMLButtonElement | null;
  if (erro) erro.style.display = 'none';
  if (btn) { btn.textContent = 'Verificando...'; btn.disabled = true; }
  _verificando = true;
  try {
    const result = await loginUseCase.execute(telInput.value);
    if (!result.ok) {
      const isUserMsg = result.error.name === 'ValidationError' || result.error.name === 'RateLimitError';
      const msg = isUserMsg
        ? result.error.message
        : 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
      log.error('verificarTelefone falhou', { error: result.error.message });
      if (erro) { erro.textContent = msg; erro.style.display = 'block'; }
      return;
    }
    if (result.value.existe && result.value.cliente) {
      entrarComCliente(result.value.cliente.toJSON() as Cliente);
    } else {
      const etapaTel = document.getElementById('etapaTelefone');
      const etapaCad = document.getElementById('etapaCadastro');
      if (etapaTel) etapaTel.style.display = 'none';
      if (etapaCad) etapaCad.style.display = 'block';
      (telInput as HTMLInputElement & { dataset: DOMStringMap }).dataset['tel'] = telInput.value.replace(/\D/g, '');
      document.getElementById('loginNome')?.focus();
    }
  } catch {
    if (erro) { erro.textContent = 'Sem conexão ou erro no servidor. Tente novamente.'; erro.style.display = 'block'; }
  } finally {
    if (btn) { btn.textContent = 'Continuar →'; btn.disabled = false; }
    _verificando = false;
  }
}

async function cadastrar(): Promise<void> {
  if (_cadastrando) return;
  const nomeInput = document.getElementById('loginNome') as HTMLInputElement;
  const telInput = document.getElementById('loginTelefone') as HTMLInputElement;
  const nome = nomeInput.value;
  const tel = (telInput as HTMLInputElement & { dataset: DOMStringMap }).dataset['tel'] ?? '';
  const erro = document.getElementById('cadastroErro');
  if (!nome.trim()) {
    if (erro) { erro.textContent = 'Digite seu nome.'; erro.style.display = 'block'; }
    return;
  }
  if (erro) erro.style.display = 'none';
  const btn = document.querySelector('#etapaCadastro button') as HTMLButtonElement | null;
  if (btn) { btn.textContent = 'Entrando...'; btn.disabled = true; }
  _cadastrando = true;
  try {
    const result = await loginUseCase.register(nome, tel, '');
    if (!result.ok) {
      const isUserMsg = result.error.name === 'ValidationError' || result.error.name === 'RateLimitError';
      const cadastroMsg = isUserMsg ? result.error.message : 'Erro ao cadastrar. Verifique sua conexão e tente novamente.';
      if (erro) { erro.textContent = cadastroMsg; erro.style.display = 'block'; }
      return;
    }
    entrarComCliente(result.value.toJSON() as Cliente);
  } catch {
    if (erro) { erro.textContent = 'Erro ao cadastrar. Verifique sua conexão e tente novamente.'; erro.style.display = 'block'; }
  } finally {
    if (btn) { btn.textContent = 'Entrar no cardápio ✨'; btn.disabled = false; }
    _cadastrando = false;
  }
}

function voltarEtapaTelefone(): void {
  const etapaCad = document.getElementById('etapaCadastro');
  const etapaTel = document.getElementById('etapaTelefone');
  if (etapaCad) etapaCad.style.display = 'none';
  if (etapaTel) etapaTel.style.display = 'block';
}

function sair(): void {
  if (!confirm('Deseja sair da sua conta?')) return;
  loginUseCase.logout();
  const usuarioBar = document.getElementById('usuarioBar');
  if (usuarioBar) usuarioBar.style.display = 'none';
  (document.getElementById('inpNome') as HTMLInputElement).value = '';
  (document.getElementById('inpEndereco') as HTMLTextAreaElement).value = '';
  (document.getElementById('loginTelefone') as HTMLInputElement).value = '';
  const etapaTel = document.getElementById('etapaTelefone');
  const etapaCad = document.getElementById('etapaCadastro');
  if (etapaTel) etapaTel.style.display = 'block';
  if (etapaCad) etapaCad.style.display = 'none';
  document.getElementById('loginOverlay')!.style.display = 'flex';
}

function mostrarLogin(): void {
  document.getElementById('loginOverlay')!.style.display = 'flex';
  setTimeout(() => (document.getElementById('loginTelefone') as HTMLInputElement)?.focus(), 300);
}

// ===== ROLETA UI =====
async function abrirRoleta(): Promise<void> {
  const bd = document.getElementById('roletaBackdrop');
  if (!bd) return;
  bd.classList.add('aberto');
  document.body.classList.add('modal-aberto');
  document.getElementById('roletaStatusBox')!.innerHTML = '';
  document.getElementById('roletaInativa')!.style.display = 'none';
  document.getElementById('roletaNaoLogado')!.style.display = 'none';
  document.getElementById('roletaInstrucoes')!.style.display = 'block';
  document.getElementById('roletaBtnEnviarWrap')!.style.display = 'block';
  document.getElementById('roletaWheelSection')!.style.display = 'none';
  document.getElementById('roletaJaGirou')!.style.display = 'none';
  document.getElementById('roletaResultado')!.classList.remove('visivel');

  const cfg = await carregarConfigRoleta();
  const premios = getPremios();

  const grid = document.getElementById('roletaPremiosGrid');
  if (grid) {
    const icones = ['🍫', '🧁', '🚚', '💸', '💰', '🎉', '🍮', '🎀', '🌟'];
    grid.innerHTML = premios.map((p, i) => `<div class="roleta-premio-item">${icones[i % icones.length]} ${escHTML(p)}</div>`).join('');
  }

  if (cfg && !cfg.ativa) {
    document.getElementById('roletaInativa')!.style.display = 'block';
    document.getElementById('roletaInstrucoes')!.style.display = 'none';
  }

  desenharRoleta(premios);
  document.getElementById('roletaWheelSection')!.style.display = 'block';

  const clienteAtual = getClienteAtual();
  if (!clienteAtual) {
    document.getElementById('roletaNaoLogado')!.style.display = 'none';
    document.getElementById('roletaInstrucoes')!.style.display = 'none';
    const girarBtn = document.getElementById('roletaGirarBtn') as HTMLButtonElement | null;
    if (girarBtn) { girarBtn.disabled = false; girarBtn.style.opacity = '1'; girarBtn.textContent = '🎡 GIRAR AGORA!'; }
    return;
  }

  const status = await verificarStatusRoleta(clienteAtual.id ?? 0);
  atualizarUIRoleta(status);
}

function fecharRoleta(): void {
  document.getElementById('roletaBackdrop')?.classList.remove('aberto');
  document.body.classList.remove('modal-aberto');
}

function fecharRoletaBackdrop(e: Event): void {
  if ((e.target as HTMLElement).id === 'roletaBackdrop') fecharRoleta();
}

function atualizarUIRoleta(info: Participacao | null): void {
  const statusBox = document.getElementById('roletaStatusBox')!;
  const instrucoes = document.getElementById('roletaInstrucoes')!;
  const btnEnviar = document.getElementById('roletaBtnEnviarWrap')!;
  const wheelSection = document.getElementById('roletaWheelSection')!;
  const jaGirou = document.getElementById('roletaJaGirou')!;
  const girarBtn = document.getElementById('roletaGirarBtn') as HTMLButtonElement | null;

  wheelSection.style.display = 'block';
  desenharRoleta(getPremios());

  if (isContaTeste(appStore.getState().cliente)) {
    if (girarBtn) { girarBtn.disabled = false; girarBtn.style.opacity = '1'; girarBtn.textContent = '🎡 GIRAR AGORA!'; }
    statusBox.innerHTML = '';
    instrucoes.style.display = 'none';
    btnEnviar.style.display = 'none';
    jaGirou.style.display = 'none';
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
    instrucoes.style.display = 'block'; btnEnviar.style.display = 'none'; jaGirou.style.display = 'none';
    if (girarBtn) { girarBtn.disabled = true; girarBtn.style.opacity = '0.4'; girarBtn.title = 'Aguardando aprovação'; }
  } else if (info.status === 'rejeitado') {
    statusBox.innerHTML = '<div class="roleta-status-box roleta-status-rejeitado">❌ <div><strong>Participação não aprovada.</strong><br>Tente novamente cumprindo todos os requisitos.</div></div>';
    instrucoes.style.display = 'block'; btnEnviar.style.display = 'block'; jaGirou.style.display = 'none';
    if (girarBtn) { girarBtn.disabled = true; girarBtn.style.opacity = '0.4'; }
  } else if (info.status === 'aprovado' && !info.ja_girou) {
    const hoje = new Date().toISOString().split('T')[0];
    const diaAprovacao = info.data_aprovacao ? info.data_aprovacao.split('T')[0] : null;
    if (diaAprovacao !== hoje) {
      statusBox.innerHTML = '<div class="roleta-status-box roleta-status-rejeitado">⏰ <div><strong>Prazo expirado.</strong><br>Você foi aprovado em outro dia e não girou a tempo. Envie novas provas para participar novamente.</div></div>';
      instrucoes.style.display = 'none'; btnEnviar.style.display = 'block'; jaGirou.style.display = 'none';
      if (girarBtn) { girarBtn.disabled = true; girarBtn.style.opacity = '0.4'; girarBtn.textContent = '🔒 Prazo expirado'; }
    } else {
      statusBox.innerHTML = '<div class="roleta-status-box roleta-status-aprovado">✅ <div><strong>Aprovado! Gire hoje!</strong><br>Você tem até meia-noite para usar seu giro. Não acumula!</div></div>';
      instrucoes.style.display = 'none'; btnEnviar.style.display = 'none'; jaGirou.style.display = 'none';
      if (girarBtn) { girarBtn.disabled = false; girarBtn.style.opacity = '1'; girarBtn.textContent = '🎡 GIRAR AGORA!'; }
    }
  } else if (info.ja_girou && !isContaTeste(appStore.getState().cliente)) {
    statusBox.innerHTML = '';
    instrucoes.style.display = 'none'; btnEnviar.style.display = 'none'; jaGirou.style.display = 'block';
    if (girarBtn) { girarBtn.disabled = true; girarBtn.style.opacity = '0.4'; }
    const premioEl = document.getElementById('roletaJaGirouPremio');
    if (premioEl) {
      premioEl.innerHTML = info.premio
        ? 'Seu prêmio foi: <strong style="color:var(--rosa)">' + escHTML(info.premio) + '</strong>. Entre em contato conosco para resgatar!'
        : 'Você já usou sua chance nesta campanha.';
    }
  }
}

async function girarRoleta(): Promise<void> {
  const clienteAtual = getClienteAtual();
  if (!clienteAtual) { mostrarToast('Faça login para girar a roleta!', 'erro'); return; }

  const statusGiro = await verificarStatusRoleta(clienteAtual.id ?? 0);
  if (!isContaTeste(appStore.getState().cliente)) {
    if (!statusGiro || statusGiro.status !== 'aprovado' || statusGiro.ja_girou) {
      mostrarToast('Você precisa ser aprovado pela equipe antes de girar!', 'erro');
      return;
    }
    try {
      const semana = getSemanaAtual();
      const countResult = await roletaRepository.countVencedoresSemana(semana);
      const vencedoresCount = countResult.ok ? countResult.value : 0;

      const resp = await fetch(`${SUPABASE_URL}/rest/v1/roleta_config?id=eq.1&select=max_vencedores_semana`, {
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
      });
      const cfg = await resp.json() as Array<{ max_vencedores_semana: number }>;
      const limite = cfg[0]?.max_vencedores_semana ?? 1;
      if (vencedoresCount >= limite) {
        const btn = document.getElementById('roletaGirarBtn') as HTMLButtonElement | null;
        if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; }
        const resultEl = document.getElementById('roletaResultado');
        if (resultEl) {
          resultEl.innerHTML = '⚠️ <strong>Já temos um ganhador esta semana!</strong><br><small>A próxima rodada começa na semana que vem. Fique de olho!</small>';
          resultEl.classList.add('visivel');
        }
        return;
      }
    } catch (e) { log.warn('Erro ao verificar limite semanal', { error: String(e) }); }
  }

  await girarRoletaFn(clienteAtual, (premio: string) => {
    const resultEl = document.getElementById('roletaResultado');
    if (resultEl) {
      resultEl.innerHTML = '🎉 Você ganhou: <strong style="color:var(--rosa)">' + escHTML(premio) + '</strong>!<br><small style="font-size:13px;color:var(--texto-sec)">Entre em contato conosco pelo WhatsApp para resgatar seu prêmio!</small>';
      resultEl.classList.add('visivel');
    }
    const btn = document.getElementById('roletaGirarBtn') as HTMLButtonElement | null;
    if (btn) btn.textContent = '✓ Girado!';
    salvarVencedor(clienteAtual, premio).catch(console.error);
  });
}

async function enviarProvasWhatsApp(): Promise<void> {
  const clienteAtual = getClienteAtual();
  if (!clienteAtual) { alert('Faça login antes de enviar suas provas.'); return; }
  const statusAtual = await verificarStatusRoleta(clienteAtual.id ?? 0);
  if (statusAtual && (statusAtual.status === 'pendente' || statusAtual.status === 'aprovado')) {
    atualizarUIRoleta(statusAtual);
    return;
  }
  const nome = clienteAtual.nome || '';
  const tel = clienteAtual.telefone || '';
  const instEl = document.getElementById('roletaInstagramInput') as HTMLInputElement | null;
  const instagram = instEl ? instEl.value.trim() : '';
  const msg = `Olá, equipe Gelamour! Quero participar da Roleta VIP.\n\nNome: ${nome}\nTelefone: ${tel}${instagram ? '\nInstagram: ' + instagram : ''}\n\nEstou enviando a foto dos meus 5 adesivos e o print do Story para validação!`;
  window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
  await registrarParticipacao(instagram);
  atualizarUIRoleta({ status: 'pendente', ja_girou: false } as Participacao);
}

async function registrarParticipacao(instagram: string): Promise<void> {
  const clienteAtual = getClienteAtual();
  if (!clienteAtual) return;
  try {
    const check = await verificarStatusRoleta(clienteAtual.id ?? 0);
    if (check && check.status !== 'rejeitado') return;
    const semana = getSemanaAtual();
    const result = await roletaRepository.saveParticipacao({
      nome: clienteAtual.nome,
      telefone: clienteAtual.telefone,
      instagram: instagram || undefined,
      status: 'pendente',
      semana,
      ja_girou: false,
      created_at: new Date().toISOString(),
    } as import('./domain/roleta').ParticipacaoProps);
    if (result.ok) {
      setParticipacaoId(result.value.id);
    }
  } catch (e) { log.warn('Erro ao registrar participação', { error: String(e) }); }
}

// ===== ADMIN ROLETA =====
function verificarAdmin(): boolean {
  return appStore.getState().isAdmin;
}

async function abrirRoletaAdmin(): Promise<void> {
  if (!verificarAdmin()) { alert('Acesso restrito.'); return; }
  document.getElementById('roletaAdminBackdrop')?.classList.add('aberto');
  await carregarParticipantesRoleta();
  await carregarConfigAdmin();
}

function fecharRoletaAdmin(): void {
  document.getElementById('roletaAdminBackdrop')?.classList.remove('aberto');
}

function fecharRoletaAdminBackdrop(e: Event): void {
  if ((e.target as HTMLElement).id === 'roletaAdminBackdrop') fecharRoletaAdmin();
}

function abrirTabAdmin(tab: string, btn: HTMLElement): void {
  document.querySelectorAll('.roleta-admin-tab').forEach(t => t.classList.remove('ativo'));
  document.querySelectorAll('.roleta-admin-panel').forEach(p => p.classList.remove('ativo'));
  btn.classList.add('ativo');
  const tabId = 'tab' + tab.charAt(0).toUpperCase() + tab.slice(1);
  document.getElementById(tabId)?.classList.add('ativo');
  if (tab === 'pendentes') carregarParticipantesRoleta();
  else if (tab === 'aprovados') carregarAprovadosRoleta();
  else if (tab === 'vencedores') carregarVencedoresRoleta();
  else if (tab === 'config') carregarConfigAdmin();
}

async function carregarParticipantesRoleta(): Promise<void> {
  const el = document.getElementById('listaPendentes');
  if (!el) return;
  el.innerHTML = '<div class="roleta-empty">Carregando...</div>';
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/roleta_participacoes?status=eq.pendente&order=created_at.desc', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    });
    const data = await r.json() as Array<Participacao>;
    if (!data || !data.length) { el.innerHTML = '<div class="roleta-empty">Nenhum participante pendente.</div>'; return; }
    el.innerHTML = data.map(p => {
      const dt = new Date(p.created_at).toLocaleString('pt-BR');
      return '<div class="roleta-participante-item">' +
        '<div class="roleta-participante-info">' +
        '<div class="roleta-participante-nome">' + escHTML(p.nome ?? '') + '</div>' +
        '<div class="roleta-participante-tel">' + escHTML(p.telefone) + (p.instagram ? ' · @' + escHTML(p.instagram) : '') + '</div>' +
        '<div style="font-size:11px;color:#999">' + dt + '</div>' +
        '</div>' +
        '<div class="roleta-participante-acoes">' +
        '<button class="btn-aprovar" onclick="aprovarParticipante(' + p.id + ', this)">✓ Aprovar</button>' +
        '<button class="btn-rejeitar" onclick="rejeitarParticipante(' + p.id + ', this)">✗ Rejeitar</button>' +
        '</div></div>';
    }).join('');
  } catch { el.innerHTML = '<div class="roleta-empty">Erro ao carregar.</div>'; }
}

async function carregarAprovadosRoleta(): Promise<void> {
  const el = document.getElementById('listaAprovados');
  if (!el) return;
  el.innerHTML = '<div class="roleta-empty">Carregando...</div>';
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/roleta_participacoes?status=eq.aprovado&order=data_aprovacao.desc', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    });
    const data = await r.json() as Array<Participacao>;
    if (!data || !data.length) { el.innerHTML = '<div class="roleta-empty">Nenhum aprovado ainda.</div>'; return; }
    el.innerHTML = data.map(p => {
      const dt = p.data_aprovacao ? new Date(p.data_aprovacao).toLocaleString('pt-BR') : '—';
      const girou = p.ja_girou ? '✓ Girou — ' + escHTML(p.premio ?? '') : '⏳ Aguardando girar';
      return '<div class="roleta-participante-item">' +
        '<div class="roleta-participante-info">' +
        '<div class="roleta-participante-nome">' + escHTML(p.nome ?? '') + '</div>' +
        '<div class="roleta-participante-tel">' + escHTML(p.telefone) + '</div>' +
        '<div style="font-size:11px;color:#388e3c">' + girou + '</div>' +
        '<div style="font-size:11px;color:#999">Aprovado em: ' + dt + '</div>' +
        '</div></div>';
    }).join('');
  } catch { el.innerHTML = '<div class="roleta-empty">Erro ao carregar.</div>'; }
}

async function aprovarParticipante(id: number, btn: HTMLButtonElement): Promise<void> {
  btn.disabled = true; btn.textContent = '...';
  const clienteAtual = getClienteAtual();
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/roleta_participacoes?id=eq.' + id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json', 'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON, 'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        status: 'aprovado',
        data_aprovacao: new Date().toISOString(),
        aprovado_por: clienteAtual ? clienteAtual.nome : 'admin'
      })
    });
    if (!r.ok) throw new Error('status ' + r.status);
    btn.closest('.roleta-participante-item')?.remove();
  } catch {
    btn.disabled = false; btn.textContent = '✓ Aprovar';
    alert('Erro ao aprovar.');
  }
}

async function rejeitarParticipante(id: number, btn: HTMLButtonElement): Promise<void> {
  if (!confirm('Rejeitar esta participação?')) return;
  btn.disabled = true; btn.textContent = '...';
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/roleta_participacoes?id=eq.' + id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json', 'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON, 'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ status: 'rejeitado' })
    });
    if (!r.ok) throw new Error('status ' + r.status);
    btn.closest('.roleta-participante-item')?.remove();
  } catch {
    btn.disabled = false; btn.textContent = '✗ Rejeitar';
    alert('Erro ao rejeitar.');
  }
}

async function carregarVencedoresRoleta(): Promise<void> {
  const el = document.getElementById('listaVencedores');
  if (!el) return;
  el.innerHTML = '<div class="roleta-empty">Carregando...</div>';
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/roleta_vencedores?order=created_at.desc', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    });
    const data = await r.json() as Array<{ nome?: string; premio: string; telefone?: string; semana?: string; created_at: string }>;
    if (!data || !data.length) { el.innerHTML = '<div class="roleta-empty">Nenhum vencedor ainda.</div>'; return; }
    el.innerHTML = data.map(v => {
      const dt = new Date(v.created_at).toLocaleString('pt-BR');
      return '<div class="roleta-vencedor-item">' +
        '<div class="roleta-vencedor-nome">🏆 ' + escHTML(v.nome ?? '—') + '</div>' +
        '<div class="roleta-vencedor-premio">🎁 ' + escHTML(v.premio) + '</div>' +
        '<div class="roleta-vencedor-data">' + escHTML(v.telefone ?? '') + ' · Semana ' + escHTML(v.semana ?? '') + ' · ' + dt + '</div>' +
        '</div>';
    }).join('');
  } catch { el.innerHTML = '<div class="roleta-empty">Erro ao carregar.</div>'; }
}

async function carregarConfigAdmin(): Promise<void> {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/roleta_config?id=eq.1&limit=1', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
    });
    const data = await r.json() as Array<{ ativa: boolean; premios: string[] }>;
    if (data && data[0]) {
      (document.getElementById('configAtiva') as HTMLInputElement).checked = data[0]!.ativa;
      const premios = Array.isArray(data[0]!.premios) ? data[0]!.premios : getPremiosPadrao();
      (document.getElementById('configPremios') as HTMLTextAreaElement).value = premios.join('\n');
    }
  } catch (e) { log.warn('Erro ao carregar config admin', { error: String(e) }); }
}

async function salvarConfigRoleta(): Promise<void> {
  const ativa = (document.getElementById('configAtiva') as HTMLInputElement).checked;
  const premiosTxt = (document.getElementById('configPremios') as HTMLTextAreaElement).value;
  const premios = premiosTxt.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  const msgEl = document.getElementById('configMsg') as HTMLElement | null;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/roleta_config?id=eq.1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json', 'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON, 'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ ativa, premios, updated_at: new Date().toISOString() })
    });
    if (!r.ok) throw new Error('status ' + r.status);
    setPremios(premios);
    if (msgEl) { msgEl.style.display = 'block'; setTimeout(() => { msgEl.style.display = 'none'; }, 2500); }
  } catch { alert('Erro ao salvar configurações.'); }
}

// ===== INIT =====
function initFiltrosTicker(): void {
  const wrap = document.querySelector('.filtros-wrap') as HTMLElement | null;
  const track = document.querySelector('.filtros') as HTMLElement | null;
  if (!wrap || !track) return;

  let pos = 0;
  let autoDir = -1;
  const AUTO_SPEED = 0.55;
  let isAuto = true;

  let dragging = false;
  let dragStartClientX = 0;
  let dragStartPos = 0;
  let velSamples: number[] = [];
  let prevClientX = 0;
  let prevTime = 0;
  let inertiaVel = 0;
  let inertiaOn = false;
  let resumeTimer: ReturnType<typeof setTimeout> | null = null;

  // Layout cache — atualizado apenas no resize, não a cada frame
  let cachedMin = Math.min(0, wrap.clientWidth - track.scrollWidth);
  const ro = new ResizeObserver(() => {
    cachedMin = Math.min(0, wrap.clientWidth - track.scrollWidth);
  });
  ro.observe(wrap);
  ro.observe(track);

  function applyPos(newPos: number): void {
    pos = newPos;
    track.style.transform = `translateX(${pos}px)`;
  }

  function cancelResume(): void {
    if (resumeTimer !== null) { clearTimeout(resumeTimer); resumeTimer = null; }
  }

  function scheduleResume(ms: number): void {
    cancelResume();
    resumeTimer = setTimeout(() => {
      isAuto = true;
      inertiaOn = false;
      inertiaVel = 0;
      resumeTimer = null;
    }, ms);
  }

  function tick(): void {
    // Para o loop se o elemento for removido do DOM
    if (!document.contains(wrap)) { ro.disconnect(); return; }

    if (!dragging) {
      if (inertiaOn) {
        inertiaVel *= 0.92;
        const next = pos + inertiaVel;
        if (next > 0 || next < cachedMin) {
          applyPos(Math.max(cachedMin, Math.min(0, next)));
          inertiaOn = false;
          inertiaVel = 0;
          scheduleResume(600);
        } else if (Math.abs(inertiaVel) < 0.15) {
          inertiaOn = false;
          inertiaVel = 0;
          scheduleResume(1500);
        } else {
          applyPos(next);
        }
      } else if (isAuto && cachedMin < -1) {
        const next = pos + AUTO_SPEED * autoDir;
        if (next <= cachedMin) { applyPos(cachedMin); autoDir = 1; }
        else if (next >= 0) { applyPos(0); autoDir = -1; }
        else applyPos(next);
      }
    }
    requestAnimationFrame(tick);
  }

  wrap.addEventListener('pointerdown', (e: PointerEvent) => {
    dragging = true;
    isAuto = false;
    inertiaOn = false;
    inertiaVel = 0;
    cancelResume();
    dragStartClientX = e.clientX;
    dragStartPos = pos;
    velSamples = [];
    prevClientX = e.clientX;
    prevTime = performance.now();
    wrap.style.cursor = 'grabbing';
    wrap.setPointerCapture(e.pointerId); // mantém eventos mesmo fora do elemento
  }, { passive: true });

  wrap.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartClientX;
    let newPos = dragStartPos + dx;
    // rubber band nas bordas
    if (newPos > 0) newPos = newPos * 0.25;
    if (newPos < cachedMin) newPos = cachedMin + (newPos - cachedMin) * 0.25;
    applyPos(newPos);

    const now = performance.now();
    const dt = now - prevTime;
    if (dt > 0 && dt < 80) {
      velSamples.push((e.clientX - prevClientX) * 16 / dt);
      if (velSamples.length > 6) velSamples.shift();
    }
    prevClientX = e.clientX;
    prevTime = now;
  }, { passive: true });

  const onRelease = (): void => {
    if (!dragging) return;
    dragging = false;
    wrap.style.cursor = '';

    if (pos > 0 || pos < cachedMin) {
      applyPos(Math.max(cachedMin, Math.min(0, pos)));
      scheduleResume(600);
      return;
    }

    const avgVel = velSamples.length > 0
      ? velSamples.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, velSamples.length)
      : 0;

    if (Math.abs(avgVel) > 0.4) {
      inertiaVel = avgVel;
      inertiaOn = true;
    } else {
      scheduleResume(2000);
    }
  };

  wrap.addEventListener('pointerup',     onRelease);
  wrap.addEventListener('pointercancel', onRelease);

  requestAnimationFrame(() => requestAnimationFrame(tick));
}

(async function init(): Promise<void> {
  try {
    const clienteSessao = loginUseCase.restoreSession();
    if (clienteSessao) {
      const result = await loginUseCase.execute(clienteSessao.telefone);
      if (result.ok && result.value.existe && result.value.cliente) {
        entrarComCliente(result.value.cliente.toJSON() as Cliente);
        return;
      }
      // Falha de rede → confia na sessão local em vez de fazer logout
      if (!result.ok && result.error.name === 'NetworkError') {
        log.warn('Revalidação offline — usando sessão local', { tel: `***${clienteSessao.telefone.slice(-4)}` });
        entrarComCliente(clienteSessao.toJSON() as Cliente);
        return;
      }
      loginUseCase.logout();
    }
  } catch (e) { log.warn('Erro ao verificar sessão', { error: String(e) }); }
  mostrarLogin();
})();

initFiltrosTicker();

// PWA service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Sincronizar cardápio com Supabase
(async function sincronizarCardapio(): Promise<void> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    const r = await fetch(SUPABASE_URL + '/rest/v1/produtos?select=nome,preco,disponivel', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON },
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (!r.ok) return;
    const prods = await r.json() as Array<{ nome: string; preco: number; disponivel: boolean }>;
    if (!Array.isArray(prods) || !prods.length) return;
    const mapa: Record<string, { nome: string; preco: number; disponivel: boolean }> = {};
    prods.forEach(p => {
      if (p && typeof p.nome === 'string' && p.nome.trim()) mapa[p.nome.trim().toLowerCase()] = p;
    });
    const priceMap = new Map<string, number>();
    document.querySelectorAll('.btn-pedir').forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') ?? '';
      const m = onclickAttr.match(/pedir(?:Produto|BoloForma)\(this,'(.+?)',(\d+(?:\.\d+)?)\)/);
      if (!m) return;
      const nomeProd = m[1]!;
      const chave = nomeProd.trim().toLowerCase();
      const db = mapa[chave];
      if (!db) return;
      const card = btn.closest('.prod-card') as HTMLElement | null;
      if (!card) return;
      if (db.disponivel === false) { card.style.display = 'none'; return; }
      const novoPreco = parseFloat(String(db.preco));
      if (isNaN(novoPreco) || novoPreco <= 0) return;
      const fnName = onclickAttr.startsWith('pedirBoloForma') ? 'pedirBoloForma' : 'pedirProduto';
      btn.setAttribute('onclick', fnName + "(this,'" + nomeProd.replace(/'/g, "\\'") + "'," + novoPreco + ")");
      const precoEl = card.querySelector('.prod-preco');
      if (precoEl) precoEl.textContent = 'R$ ' + novoPreco.toFixed(2).replace('.', ',');
      priceMap.set(nomeProd, novoPreco);
    });
    cartService.revalidatePrices(priceMap);
  } catch { /* silencioso */ }
})();

// Fechar modais com Escape
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    fecharDialog();
    fecharModal();
    fecharConfirmWA();
    fecharDialogBolo();
  }
});

// ===== EXPOR PARA HTML (onclick="...") =====
declare global {
  interface Window {
    filtrar: typeof filtrar;
    pedirProduto: typeof pedirProduto;
    abrirDialog: typeof abrirDialog;
    fecharDialog: typeof fecharDialog;
    fecharDialogBackdrop: typeof fecharDialogBackdrop;
    irParaFinalizar: typeof irParaFinalizar;
    abrirModal: typeof abrirModal;
    fecharModal: typeof fecharModal;
    fecharModalBackdrop: typeof fecharModalBackdrop;
    removerDoCarrinho: typeof removerDoCarrinho;
    selecionarPagamento: typeof selecionarPagamento;
    finalizarPedido: typeof finalizarPedido;
    confirmarEnvioWA: typeof confirmarEnvioWA;
    fecharConfirmWA: typeof fecharConfirmWA;
    pedirBoloForma: typeof pedirBoloForma;
    abrirDialogBolo: typeof abrirDialogBolo;
    fecharDialogBolo: typeof fecharDialogBolo;
    carouselNext: typeof carouselNext;
    carouselPrev: typeof carouselPrev;
    mascaraTelefone: typeof mascaraTelefone;
    verificarTelefone: typeof verificarTelefone;
    cadastrar: typeof cadastrar;
    voltarEtapaTelefone: typeof voltarEtapaTelefone;
    sair: typeof sair;
    abrirRoleta: typeof abrirRoleta;
    fecharRoleta: typeof fecharRoleta;
    fecharRoletaBackdrop: typeof fecharRoletaBackdrop;
    girarRoleta: typeof girarRoleta;
    enviarProvasWhatsApp: typeof enviarProvasWhatsApp;
    abrirRoletaAdmin: typeof abrirRoletaAdmin;
    fecharRoletaAdmin: typeof fecharRoletaAdmin;
    fecharRoletaAdminBackdrop: typeof fecharRoletaAdminBackdrop;
    abrirTabAdmin: typeof abrirTabAdmin;
    aprovarParticipante: typeof aprovarParticipante;
    rejeitarParticipante: typeof rejeitarParticipante;
    salvarConfigRoleta: typeof salvarConfigRoleta;
  }
}

Object.assign(window, {
  filtrar,
  pedirProduto,
  abrirDialog,
  fecharDialog,
  fecharDialogBackdrop,
  irParaFinalizar,
  abrirModal,
  fecharModal,
  fecharModalBackdrop,
  removerDoCarrinho,
  selecionarPagamento,
  finalizarPedido,
  confirmarEnvioWA,
  fecharConfirmWA,
  pedirBoloForma,
  abrirDialogBolo,
  fecharDialogBolo,
  carouselNext,
  carouselPrev,
  mascaraTelefone,
  verificarTelefone,
  cadastrar,
  voltarEtapaTelefone,
  sair,
  abrirRoleta,
  fecharRoleta,
  fecharRoletaBackdrop,
  girarRoleta,
  enviarProvasWhatsApp,
  abrirRoletaAdmin,
  fecharRoletaAdmin,
  fecharRoletaAdminBackdrop,
  abrirTabAdmin,
  aprovarParticipante,
  rejeitarParticipante,
  salvarConfigRoleta,
});
