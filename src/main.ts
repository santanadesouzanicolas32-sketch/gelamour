// src/main.ts — ponto de entrada Gelamour (Clean Architecture)
import { escHTML } from './utils/security';
import { aplicarMascaraTelefone } from './utils/format';
import { loginUseCase, cartService, salvarEndereco } from './container';
import { appStore } from './state/AppStore';
import { Cliente as ClienteEntity } from './domain/cliente';
import { isBoloForma, renderizarLista } from './modules/cart';
import type { Cliente } from './types';


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
function finalizarPedido(): void {
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
  if (btnFin) { btnFin.disabled = true; btnFin.textContent = 'Abrindo WhatsApp...'; }

  // Guarda o endereço no aparelho para o próximo pedido
  if (clienteAtual) salvarEndereco(endereco);

  setTimeout(() => {
    if (btnFin) { btnFin.disabled = false; btnFin.textContent = txtOrig; }
  }, 2000);

  // Redirecionar para WhatsApp (se o navegador bloquear a nova aba, abre na mesma)
  const waUrl = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  const win = window.open(waUrl, '_blank');
  if (!win) { window.location.href = waUrl; return; }

  fecharModal();
  limparCarrinho();
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
  const usuarioTel = document.getElementById('usuarioTel');
  if (usuarioTel) usuarioTel.textContent = clienteRaw.telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  const inpNome = document.getElementById('inpNome') as HTMLInputElement | null;
  if (inpNome) inpNome.value = clienteRaw.nome;
  const inpEndereco = document.getElementById('inpEndereco') as HTMLTextAreaElement | null;
  if (inpEndereco && clienteRaw.endereco) inpEndereco.value = clienteRaw.endereco;
}

function irParaEtapaCadastro(telInput: HTMLInputElement): void {
  const etapaTel = document.getElementById('etapaTelefone');
  const etapaCad = document.getElementById('etapaCadastro');
  if (etapaTel) etapaTel.style.display = 'none';
  if (etapaCad) etapaCad.style.display = 'block';
  telInput.dataset['tel'] = telInput.value.replace(/\D/g, '');
  document.getElementById('loginNome')?.focus();
}

async function verificarTelefone(): Promise<void> {
  if (_verificando) return;
  const telInput = document.getElementById('loginTelefone') as HTMLInputElement;
  const erro = document.getElementById('loginErro');
  if (erro) erro.style.display = 'none';
  _verificando = true;
  try {
    const result = await loginUseCase.execute(telInput.value);
    if (!result.ok) {
      if (erro) { erro.textContent = result.error.message; erro.style.display = 'block'; }
      return;
    }
    if (result.value.existe && result.value.cliente) {
      entrarComCliente(result.value.cliente.toJSON() as Cliente);
    } else {
      irParaEtapaCadastro(telInput);
    }
  } finally {
    _verificando = false;
  }
}

async function cadastrar(): Promise<void> {
  if (_cadastrando) return;
  const nomeInput = document.getElementById('loginNome') as HTMLInputElement;
  const telInput = document.getElementById('loginTelefone') as HTMLInputElement;
  const nome = nomeInput.value;
  const tel = telInput.dataset['tel'] ?? telInput.value.replace(/D/g, '');
  const erro = document.getElementById('cadastroErro');
  if (!nome.trim()) {
    if (erro) { erro.textContent = 'Digite seu nome.'; erro.style.display = 'block'; }
    return;
  }
  if (erro) erro.style.display = 'none';
  _cadastrando = true;
  try {
    const result = await loginUseCase.register(nome, tel, '');
    if (!result.ok) {
      if (erro) { erro.textContent = result.error.message; erro.style.display = 'block'; }
      return;
    }
    entrarComCliente(result.value.toJSON() as Cliente);
  } finally {
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

// ===== INIT =====
function initFiltrosTicker(): void {
  const wrap = document.querySelector('.filtros-wrap') as HTMLElement | null;
  const trackEl = document.querySelector('.filtros') as HTMLElement | null;
  if (!wrap || !trackEl) return;
  const track: HTMLElement = trackEl;

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

(function init(): void {
  const clienteSessao = loginUseCase.restoreSession();
  if (clienteSessao) { entrarComCliente(clienteSessao.toJSON() as Cliente); return; }
  mostrarLogin();
})();

initFiltrosTicker();

// PWA service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Fechar modais com Escape
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    fecharDialog();
    fecharModal();
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
});
