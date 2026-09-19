"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/utils/security.ts
  function escHTML(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // src/utils/format.ts
  function formatarMoeda(valor) {
    return "R$ " + valor.toFixed(2).replace(".", ",");
  }
  function aplicarMascaraTelefone(valor) {
    const d = valor.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }

  // src/core/errors.ts
  var AppError = class _AppError extends Error {
    constructor(message, code, statusCode = 500, context) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
      this.context = context;
      this.name = "AppError";
      Object.setPrototypeOf(this, _AppError.prototype);
    }
  };
  var ValidationError = class extends AppError {
    constructor(message, context) {
      super(message, "VALIDATION_ERROR", 400, context);
      this.name = "ValidationError";
    }
  };

  // src/domain/cliente.ts
  var Cliente = class _Cliente {
    constructor(props) {
      this.id = props.id;
      this.nome = props.nome;
      this.telefone = props.telefone;
      this.endereco = props.endereco;
    }
    static create(props) {
      const tel = props.telefone.replace(/\D/g, "");
      if (tel.length < 10 || tel.length > 11) {
        throw new ValidationError("Telefone inv\xE1lido", { telefone: props.telefone });
      }
      if (!props.nome.trim()) {
        throw new ValidationError("Nome n\xE3o pode ser vazio");
      }
      return new _Cliente(__spreadProps(__spreadValues({}, props), {
        telefone: tel,
        nome: _Cliente.normalizarNome(props.nome)
      }));
    }
    static fromDB(raw) {
      return new _Cliente(raw);
    }
    static normalizarNome(nome) {
      return nome.toLowerCase().split(" ").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ").trim();
    }
    withEndereco(endereco) {
      return _Cliente.fromDB(__spreadProps(__spreadValues({}, this.toJSON()), { endereco }));
    }
    toJSON() {
      return { id: this.id, nome: this.nome, telefone: this.telefone, endereco: this.endereco };
    }
  };

  // src/core/result.ts
  var ok = (value) => ({ ok: true, value });
  var fail = (error) => ({ ok: false, error });
  async function tryAsync(fn) {
    try {
      return ok(await fn());
    } catch (e) {
      return fail(e instanceof Error ? e : new Error(String(e)));
    }
  }

  // src/core/logger.ts
  var Logger = class _Logger {
    constructor(prefix = "Gelamour") {
      this.prefix = prefix;
    }
    log(level, message, context) {
      const entry = {
        level,
        message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        context
      };
      const style = {
        debug: "color: #6B7280",
        info: "color: #3B82F6",
        warn: "color: #F59E0B",
        error: "color: #EF4444; font-weight: bold"
      }[level];
      const formatted = `[${this.prefix}] ${entry.timestamp} ${message}`;
      if (level === "error") {
        console.error(`%c${formatted}`, style, context != null ? context : "");
      } else if (level === "warn") {
        console.warn(`%c${formatted}`, style, context != null ? context : "");
      } else {
        console.log(`%c${formatted}`, style, context != null ? context : "");
      }
    }
    debug(msg, ctx) {
      this.log("debug", msg, ctx);
    }
    info(msg, ctx) {
      this.log("info", msg, ctx);
    }
    warn(msg, ctx) {
      this.log("warn", msg, ctx);
    }
    error(msg, ctx) {
      this.log("error", msg, ctx);
    }
    child(prefix) {
      return new _Logger(`${this.prefix}:${prefix}`);
    }
  };
  var logger = new Logger();

  // src/state/Store.ts
  var Store = class {
    constructor(initialState) {
      this.globalListeners = /* @__PURE__ */ new Set();
      this.state = __spreadValues({}, initialState);
    }
    getState() {
      return this.state;
    }
    setState(updater) {
      const patch = typeof updater === "function" ? updater(this.state) : updater;
      this.state = __spreadValues(__spreadValues({}, this.state), patch);
      this.globalListeners.forEach((l) => l(this.state));
    }
    subscribe(listener) {
      this.globalListeners.add(listener);
      return () => this.globalListeners.delete(listener);
    }
    select(selector, listener) {
      let prev = selector(this.state);
      return this.subscribe((state) => {
        const next = selector(state);
        if (next !== prev) {
          prev = next;
          listener(next);
        }
      });
    }
  };

  // src/state/AppStore.ts
  var appStore = new Store({
    cliente: null,
    isLoggedIn: false,
    carrinhoCount: 0,
    carrinhoTotal: 0,
    pagamentoSelecionado: ""
  });
  function setCliente(cliente) {
    appStore.setState({
      cliente,
      isLoggedIn: !!cliente
    });
  }
  function setCarrinho(count, total) {
    appStore.setState({ carrinhoCount: count, carrinhoTotal: total });
  }

  // src/application/auth/LoginUseCase.ts
  var log = logger.child("LoginUseCase");
  var SESSION_KEY = "gelamour_cliente";
  var SESSION_TS_KEY = "gelamour_ts";
  var SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
  function lerStorage(chave) {
    try {
      return localStorage.getItem(chave);
    } catch (e) {
      return null;
    }
  }
  function gravarStorage(chave, valor) {
    try {
      localStorage.setItem(chave, valor);
    } catch (e) {
    }
  }
  function removerStorage(chave) {
    try {
      localStorage.removeItem(chave);
    } catch (e) {
    }
  }
  var LoginUseCase = class {
    lerSalvo() {
      var _a;
      try {
        const ts = Number((_a = lerStorage(SESSION_TS_KEY)) != null ? _a : "0");
        if (Date.now() - ts > SESSION_TTL_MS) return null;
        const raw = lerStorage(SESSION_KEY);
        if (!raw) return null;
        return Cliente.fromDB(JSON.parse(raw));
      } catch (e) {
        return null;
      }
    }
    restoreSession() {
      const cliente = this.lerSalvo();
      if (!cliente) {
        this.clearSession();
        return null;
      }
      setCliente(cliente);
      return cliente;
    }
    /** Telefone já usado neste aparelho entra direto; senão pede o nome. */
    async execute(telefone) {
      const tel = telefone.replace(/\D/g, "");
      if (tel.length < 10 || tel.length > 11) return fail(new ValidationError("Telefone inv\xE1lido"));
      const salvo = this.lerSalvo();
      if (salvo && salvo.telefone === tel) return ok({ existe: true, cliente: salvo });
      return ok({ existe: false });
    }
    async register(nome, telefone, endereco) {
      return tryAsync(async () => Cliente.create({ nome, telefone, endereco }));
    }
    login(cliente) {
      gravarStorage(SESSION_KEY, JSON.stringify(cliente.toJSON()));
      gravarStorage(SESSION_TS_KEY, String(Date.now()));
      setCliente(cliente);
      log.info("Login realizado");
    }
    salvarEndereco(endereco) {
      const atual = this.lerSalvo();
      if (!atual) return;
      gravarStorage(SESSION_KEY, JSON.stringify(atual.withEndereco(endereco).toJSON()));
    }
    logout() {
      this.clearSession();
      setCliente(null);
      log.info("Logout realizado");
    }
    clearSession() {
      removerStorage(SESSION_KEY);
      removerStorage(SESSION_TS_KEY);
    }
  };

  // src/application/cart/CartService.ts
  var log2 = logger.child("CartService");
  var CartService = class {
    constructor() {
      this.items = /* @__PURE__ */ new Map();
    }
    add(nome, preco) {
      if (this.items.has(nome)) return;
      this.items.set(nome, { nome, preco: Number(preco) });
      this.notify();
      log2.debug("Item adicionado", { nome });
    }
    remove(nome) {
      if (!this.items.has(nome)) return;
      this.items.delete(nome);
      this.notify();
      log2.debug("Item removido", { nome });
    }
    toggle(nome, preco) {
      if (this.items.has(nome)) {
        this.remove(nome);
        return "removed";
      }
      this.add(nome, preco);
      return "added";
    }
    clear() {
      this.items.clear();
      this.notify();
    }
    getItems() {
      return Array.from(this.items.values());
    }
    getTotal() {
      return Array.from(this.items.values()).reduce((sum, i) => Math.round((sum + i.preco) * 100) / 100, 0);
    }
    getCount() {
      return this.items.size;
    }
    has(nome) {
      return this.items.has(nome);
    }
    isEmpty() {
      return this.items.size === 0;
    }
    revalidatePrices(priceMap) {
      let changed = false;
      this.items.forEach((item, key) => {
        const realPrice = priceMap.get(key);
        if (realPrice !== void 0 && realPrice !== item.preco) {
          this.items.set(key, __spreadProps(__spreadValues({}, item), { preco: realPrice }));
          changed = true;
          log2.warn("Pre\xE7o revalidado", { nome: key, old: item.preco, new: realPrice });
        }
      });
      if (changed) this.notify();
    }
    notify() {
      setCarrinho(this.getCount(), this.getTotal());
    }
  };

  // src/container.ts
  var loginUseCase = new LoginUseCase();
  var cartService = new CartService();
  function salvarEndereco(endereco) {
    loginUseCase.salvarEndereco(endereco);
  }

  // src/modules/cart.ts
  function getItens() {
    return Array.from(cartService.getItems());
  }
  function getTotal() {
    return cartService.getTotal();
  }
  function isBoloForma(nome) {
    const BOLO_FORMA_NOMES = [
      "Bolo na forma Milho natural",
      "Bolo na forma Cenoura com chocolate e Granule",
      "Bolo na forma Brigadeiro",
      "Bolo na forma Ferrero Rocher",
      "Torta de Frango com Catupiry"
    ];
    return BOLO_FORMA_NOMES.includes(nome);
  }
  function renderizarLista(containerId, totalRodapeId, badgeId) {
    const lista = document.getElementById(containerId);
    const totalEl = document.getElementById(totalRodapeId);
    const badge = document.getElementById(badgeId);
    const itens = getItens();
    if (badge) badge.textContent = String(itens.length);
    if (!lista || !totalEl) return;
    if (itens.length === 0) {
      lista.innerHTML = `<div class="carrinho-vazio"><div class="carrinho-vazio-icon">\u{1F6D2}</div><div>Seu carrinho est\xE1 vazio</div></div>`;
      totalEl.textContent = "R$ 0,00";
      return;
    }
    const total = getTotal();
    lista.innerHTML = itens.map((item) => {
      const nomeEsc = escHTML(item.nome);
      const nomeData = encodeURIComponent(item.nome);
      return `<div class="cart-item">
      <span class="cart-item-nome">${nomeEsc}</span>
      <span class="cart-item-preco">${formatarMoeda(item.preco)}</span>
      <button class="cart-item-remove" onclick="removerDoCarrinho(decodeURIComponent('${nomeData}'))" aria-label="Remover">\u{1F5D1}\uFE0F</button>
    </div>`;
    }).join("") + `<div class="cart-total"><span class="cart-total-label">Total</span><span class="cart-total-valor">${formatarMoeda(total)}</span></div>`;
    totalEl.textContent = formatarMoeda(total);
  }

  // src/main.ts
  var WA_NUMBER = atob("NTUxMTk0MDc3Mjc1MA==");
  var _verificando = false;
  var _cadastrando = false;
  function getClienteAtual() {
    return appStore.getState().cliente;
  }
  function filtrar(cat, _btn) {
    document.querySelectorAll(".filtro-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll('.filtro-btn[data-filtro="' + cat + '"]').forEach((b) => b.classList.add("active"));
    document.querySelectorAll(".prod-card").forEach((card) => {
      const el = card;
      if (cat === "todos" || el.dataset["cat"] === cat)
        el.classList.remove("hidden");
      else
        el.classList.add("hidden");
    });
  }
  function atualizarFab() {
    const fab = document.getElementById("cartFab");
    const badge = document.getElementById("cartBadge");
    const count = cartService.getCount();
    if (badge) badge.textContent = String(count);
    if (fab) {
      if (count > 0) fab.classList.add("ativo");
      else {
        fab.classList.remove("ativo");
        fecharModal();
      }
    }
  }
  function pedirProduto(botao, nome, preco) {
    const card = botao.closest(".prod-card");
    if (cartService.has(nome)) {
      cartService.remove(nome);
      card == null ? void 0 : card.classList.remove("selecionado");
      atualizarFab();
      return;
    }
    cartService.add(nome, preco);
    card == null ? void 0 : card.classList.add("selecionado");
    atualizarFab();
    abrirDialog(nome, preco);
  }
  function abrirDialog(nome, preco) {
    var _a;
    const el = document.getElementById("dialogProduto");
    if (el) el.innerHTML = "<strong>" + escHTML(nome) + "</strong> \u2014 R$ " + Number(preco).toFixed(2).replace(".", ",");
    (_a = document.getElementById("dialogBackdrop")) == null ? void 0 : _a.classList.add("aberto");
  }
  function fecharDialog() {
    var _a;
    (_a = document.getElementById("dialogBackdrop")) == null ? void 0 : _a.classList.remove("aberto");
  }
  function fecharDialogBackdrop(e) {
    if (e.target.id === "dialogBackdrop") fecharDialog();
  }
  function irParaFinalizar() {
    fecharDialog();
    abrirModal();
  }
  function renderizarCarrinho() {
    renderizarLista("listaCarrinho", "totalRodape", "badgeCount");
  }
  function renderizarNoticeEncomenda() {
    const el = document.getElementById("noticeEncomenda");
    if (!el) return;
    const itens = cartService.getItems();
    const temForma = itens.some((i) => isBoloForma(i.nome));
    const temOutros = itens.some((i) => !isBoloForma(i.nome));
    if (temForma && temOutros) {
      el.innerHTML = '<div class="notice-misto"><span>\u26A0\uFE0F</span><span><strong>Aten\xE7\xE3o:</strong> Voc\xEA misturou Bolos na Forma (feitos sob encomenda) com outros produtos. Considere pedidos separados para garantir o prazo!</span></div>';
    } else if (temForma) {
      el.innerHTML = '<div class="notice-encomenda"><span class="notice-encomenda-icon">\u23F0</span><span><strong>Bolo na Forma \u2014 Sob encomenda!</strong><br>Esses bolos s\xE3o preparados especialmente para voc\xEA. Prazo de <strong>5 horas a 1 dia \xFAtil</strong> ap\xF3s confirma\xE7\xE3o.</span></div>';
    } else {
      el.innerHTML = "";
    }
  }
  function abrirModal() {
    var _a;
    renderizarCarrinho();
    renderizarNoticeEncomenda();
    (_a = document.getElementById("modalBackdrop")) == null ? void 0 : _a.classList.add("aberto");
    document.body.classList.add("modal-aberto");
  }
  function fecharModal() {
    var _a;
    (_a = document.getElementById("modalBackdrop")) == null ? void 0 : _a.classList.remove("aberto");
    document.body.classList.remove("modal-aberto");
  }
  function fecharModalBackdrop(e) {
    if (e.target.id === "modalBackdrop") fecharModal();
  }
  function removerDoCarrinho(nome) {
    if (!cartService.has(nome)) return;
    cartService.remove(nome);
    document.querySelectorAll(".prod-card.selecionado").forEach((card) => {
      var _a;
      const nomeEl = card.querySelector(".prod-nome");
      if (nomeEl && ((_a = nomeEl.textContent) == null ? void 0 : _a.trim()) === nome) card.classList.remove("selecionado");
    });
    renderizarCarrinho();
    atualizarFab();
  }
  function selecionarPagamento(el) {
    var _a;
    document.querySelectorAll(".pagamento-opt").forEach((o) => o.classList.remove("ativo"));
    el.classList.add("ativo");
    const tipo = (_a = el.dataset["pag"]) != null ? _a : "";
    appStore.setState({ pagamentoSelecionado: tipo });
  }
  function limparCarrinho() {
    cartService.clear();
    appStore.setState({ pagamentoSelecionado: "" });
    document.querySelectorAll(".pagamento-opt.ativo").forEach((o) => o.classList.remove("ativo"));
    const obsEl = document.getElementById("inpObs");
    if (obsEl) obsEl.value = "";
    document.querySelectorAll(".prod-card.selecionado").forEach((c) => c.classList.remove("selecionado"));
    atualizarFab();
    fecharModal();
  }
  function pedirBoloForma(botao, nome, preco) {
    const card = botao.closest(".prod-card");
    if (cartService.has(nome)) {
      cartService.remove(nome);
      card == null ? void 0 : card.classList.remove("selecionado");
      atualizarFab();
      renderizarNoticeEncomenda();
      return;
    }
    cartService.add(nome, preco);
    card == null ? void 0 : card.classList.add("selecionado");
    atualizarFab();
    abrirDialogBolo();
  }
  function abrirDialogBolo() {
    var _a;
    (_a = document.getElementById("dialogBoloBackdrop")) == null ? void 0 : _a.classList.add("aberto");
  }
  function fecharDialogBolo(e) {
    var _a;
    if (!e || e.target.id === "dialogBoloBackdrop") {
      (_a = document.getElementById("dialogBoloBackdrop")) == null ? void 0 : _a.classList.remove("aberto");
    }
  }
  function carouselNext(id, e) {
    var _a, _b, _c, _d;
    if (e) e.stopPropagation();
    const c = document.getElementById(id);
    if (!c) return;
    const imgs = c.querySelectorAll(".carousel-img");
    const dots = c.querySelectorAll(".carousel-dot");
    let cur = 0;
    imgs.forEach((img, i) => {
      if (img.classList.contains("ativo")) cur = i;
    });
    (_a = imgs[cur]) == null ? void 0 : _a.classList.remove("ativo");
    (_b = dots[cur]) == null ? void 0 : _b.classList.remove("ativo");
    const next = (cur + 1) % imgs.length;
    (_c = imgs[next]) == null ? void 0 : _c.classList.add("ativo");
    (_d = dots[next]) == null ? void 0 : _d.classList.add("ativo");
  }
  function carouselPrev(id, e) {
    var _a, _b, _c, _d;
    if (e) e.stopPropagation();
    const c = document.getElementById(id);
    if (!c) return;
    const imgs = c.querySelectorAll(".carousel-img");
    const dots = c.querySelectorAll(".carousel-dot");
    let cur = 0;
    imgs.forEach((img, i) => {
      if (img.classList.contains("ativo")) cur = i;
    });
    (_a = imgs[cur]) == null ? void 0 : _a.classList.remove("ativo");
    (_b = dots[cur]) == null ? void 0 : _b.classList.remove("ativo");
    const prev = (cur - 1 + imgs.length) % imgs.length;
    (_c = imgs[prev]) == null ? void 0 : _c.classList.add("ativo");
    (_d = dots[prev]) == null ? void 0 : _d.classList.add("ativo");
  }
  function finalizarPedido() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const itens = cartService.getItems();
    const temFormaFin = itens.some((i) => isBoloForma(i.nome));
    const temOutrosFin = itens.some((i) => !isBoloForma(i.nome));
    if (temFormaFin && temOutrosFin) {
      if (!confirm("\u26A0\uFE0F Aten\xE7\xE3o!\n\nVoc\xEA tem Bolos na Forma (feitos sob encomenda) misturados com outros produtos.\n\nBolos na Forma precisam de prazo de 5h a 1 dia \xFAtil para preparo.\n\nDeseja prosseguir mesmo assim?"))
        return;
    }
    if (itens.length === 0) {
      alert("Adicione pelo menos um produto ao carrinho!");
      return;
    }
    const nome = (_b = (_a = document.getElementById("inpNome")) == null ? void 0 : _a.value.trim()) != null ? _b : "";
    const endereco = (_d = (_c = document.getElementById("inpEndereco")) == null ? void 0 : _c.value.trim()) != null ? _d : "";
    const obs = (_f = (_e = document.getElementById("inpObs")) == null ? void 0 : _e.value.trim()) != null ? _f : "";
    const pagamentoSelecionado = appStore.getState().pagamentoSelecionado;
    const clienteAtual = getClienteAtual();
    if (!nome) {
      alert("Por favor, informe seu nome completo.");
      (_g = document.getElementById("inpNome")) == null ? void 0 : _g.focus();
      return;
    }
    if (!endereco) {
      alert("Por favor, informe seu endere\xE7o.");
      (_h = document.getElementById("inpEndereco")) == null ? void 0 : _h.focus();
      return;
    }
    if (!pagamentoSelecionado) {
      alert("Por favor, escolha a forma de pagamento.");
      return;
    }
    const priceMap = /* @__PURE__ */ new Map();
    document.querySelectorAll(".btn-pedir").forEach((btn) => {
      var _a2;
      const onclickAttr = (_a2 = btn.getAttribute("onclick")) != null ? _a2 : "";
      const m = onclickAttr.match(/pedir(?:Produto|BoloForma)\(this,'(.+?)',(\d+(?:\.\d+)?)\)/);
      if (m) priceMap.set(m[1], parseFloat(m[2]));
    });
    cartService.revalidatePrices(priceMap);
    const itensVerificados = Array.from(cartService.getItems());
    let total = 0;
    let linhasItens = "";
    itensVerificados.forEach((item) => {
      total = Math.round((total + item.preco) * 100) / 100;
      linhasItens += `\u2022 ${item.nome} \u2014 R$ ${item.preco.toFixed(2).replace(".", ",")}
`;
    });
    const encomendaNote = temFormaFin ? "\n\n\u23F0 *Aten\xE7\xE3o: cont\xE9m item sob encomenda \u2014 prazo de 5h a 1 dia \xFAtil para preparo.*" : "";
    const msg = `*\u{1F370} NOVO PEDIDO - GELAMOUR*

*\u{1F4CB} ITENS:*
${linhasItens}
*\u{1F4B0} Total:* R$ ${total.toFixed(2).replace(".", ",")}

*\u{1F464} Nome:* ${nome}
*\u{1F4CD} Endere\xE7o:* ${endereco}
*\u{1F4B3} Pagamento:* ${pagamentoSelecionado}${obs ? `
*\u{1F4DD} Obs:* ${obs}` : ""}${encomendaNote}

Pedido pelo card\xE1pio online \u2728`;
    const btnFin = document.getElementById("btnFinalizar");
    const txtOrig = btnFin ? (_i = btnFin.textContent) != null ? _i : "" : "";
    if (btnFin) {
      btnFin.disabled = true;
      btnFin.textContent = "Abrindo WhatsApp...";
    }
    if (clienteAtual) salvarEndereco(endereco);
    setTimeout(() => {
      if (btnFin) {
        btnFin.disabled = false;
        btnFin.textContent = txtOrig;
      }
    }, 2e3);
    const waUrl = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
    const win = window.open(waUrl, "_blank");
    if (!win) {
      window.location.href = waUrl;
      return;
    }
    fecharModal();
    limparCarrinho();
  }
  async function confirmarEnvioWA() {
    fecharConfirmWA();
    limparCarrinho();
  }
  function fecharConfirmWA() {
    var _a;
    (_a = document.getElementById("waConfirmBackdrop")) == null ? void 0 : _a.classList.remove("aberto");
  }
  function mascaraTelefone(el) {
    el.value = aplicarMascaraTelefone(el.value);
  }
  function entrarComCliente(clienteRaw) {
    const domainCliente = Cliente.fromDB(clienteRaw);
    loginUseCase.login(domainCliente);
    document.getElementById("loginOverlay").style.display = "none";
    const usuarioBar = document.getElementById("usuarioBar");
    if (usuarioBar) usuarioBar.style.display = "inline-flex";
    const usuarioNomeEl = document.getElementById("usuarioNome");
    if (usuarioNomeEl) usuarioNomeEl.textContent = clienteRaw.nome;
    const roletaBtn = document.getElementById("roletaBtnFlutuante");
    if (roletaBtn) roletaBtn.style.display = "flex";
    const usuarioTel = document.getElementById("usuarioTel");
    if (usuarioTel) usuarioTel.textContent = clienteRaw.telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    const inpNome = document.getElementById("inpNome");
    if (inpNome) inpNome.value = clienteRaw.nome;
    const inpEndereco = document.getElementById("inpEndereco");
    if (inpEndereco && clienteRaw.endereco) inpEndereco.value = clienteRaw.endereco;
  }
  function irParaEtapaCadastro(telInput) {
    var _a;
    const etapaTel = document.getElementById("etapaTelefone");
    const etapaCad = document.getElementById("etapaCadastro");
    if (etapaTel) etapaTel.style.display = "none";
    if (etapaCad) etapaCad.style.display = "block";
    telInput.dataset["tel"] = telInput.value.replace(/\D/g, "");
    (_a = document.getElementById("loginNome")) == null ? void 0 : _a.focus();
  }
  async function verificarTelefone() {
    if (_verificando) return;
    const telInput = document.getElementById("loginTelefone");
    const erro = document.getElementById("loginErro");
    if (erro) erro.style.display = "none";
    _verificando = true;
    try {
      const result = await loginUseCase.execute(telInput.value);
      if (!result.ok) {
        if (erro) {
          erro.textContent = result.error.message;
          erro.style.display = "block";
        }
        return;
      }
      if (result.value.existe && result.value.cliente) {
        entrarComCliente(result.value.cliente.toJSON());
      } else {
        irParaEtapaCadastro(telInput);
      }
    } finally {
      _verificando = false;
    }
  }
  async function cadastrar() {
    var _a;
    if (_cadastrando) return;
    const nomeInput = document.getElementById("loginNome");
    const telInput = document.getElementById("loginTelefone");
    const nome = nomeInput.value;
    const tel = (_a = telInput.dataset["tel"]) != null ? _a : telInput.value.replace(/D/g, "");
    const erro = document.getElementById("cadastroErro");
    if (!nome.trim()) {
      if (erro) {
        erro.textContent = "Digite seu nome.";
        erro.style.display = "block";
      }
      return;
    }
    if (erro) erro.style.display = "none";
    _cadastrando = true;
    try {
      const result = await loginUseCase.register(nome, tel, "");
      if (!result.ok) {
        if (erro) {
          erro.textContent = result.error.message;
          erro.style.display = "block";
        }
        return;
      }
      entrarComCliente(result.value.toJSON());
    } finally {
      _cadastrando = false;
    }
  }
  function voltarEtapaTelefone() {
    const etapaCad = document.getElementById("etapaCadastro");
    const etapaTel = document.getElementById("etapaTelefone");
    if (etapaCad) etapaCad.style.display = "none";
    if (etapaTel) etapaTel.style.display = "block";
  }
  function sair() {
    if (!confirm("Deseja sair da sua conta?")) return;
    loginUseCase.logout();
    const usuarioBar = document.getElementById("usuarioBar");
    if (usuarioBar) usuarioBar.style.display = "none";
    document.getElementById("inpNome").value = "";
    document.getElementById("inpEndereco").value = "";
    document.getElementById("loginTelefone").value = "";
    const etapaTel = document.getElementById("etapaTelefone");
    const etapaCad = document.getElementById("etapaCadastro");
    if (etapaTel) etapaTel.style.display = "block";
    if (etapaCad) etapaCad.style.display = "none";
    document.getElementById("loginOverlay").style.display = "flex";
  }
  function mostrarLogin() {
    document.getElementById("loginOverlay").style.display = "flex";
    setTimeout(() => {
      var _a;
      return (_a = document.getElementById("loginTelefone")) == null ? void 0 : _a.focus();
    }, 300);
  }
  function initFiltrosTicker() {
    const wrap = document.querySelector(".filtros-wrap");
    const trackEl = document.querySelector(".filtros");
    if (!wrap || !trackEl) return;
    const track = trackEl;
    let pos = 0;
    let autoDir = -1;
    const AUTO_SPEED = 0.55;
    let isAuto = true;
    let dragging = false;
    let dragStartClientX = 0;
    let dragStartPos = 0;
    let velSamples = [];
    let prevClientX = 0;
    let prevTime = 0;
    let inertiaVel = 0;
    let inertiaOn = false;
    let resumeTimer = null;
    let cachedMin = Math.min(0, wrap.clientWidth - track.scrollWidth);
    const ro = new ResizeObserver(() => {
      cachedMin = Math.min(0, wrap.clientWidth - track.scrollWidth);
    });
    ro.observe(wrap);
    ro.observe(track);
    function applyPos(newPos) {
      pos = newPos;
      track.style.transform = `translateX(${pos}px)`;
    }
    function cancelResume() {
      if (resumeTimer !== null) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    }
    function scheduleResume(ms) {
      cancelResume();
      resumeTimer = setTimeout(() => {
        isAuto = true;
        inertiaOn = false;
        inertiaVel = 0;
        resumeTimer = null;
      }, ms);
    }
    function tick() {
      if (!document.contains(wrap)) {
        ro.disconnect();
        return;
      }
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
          if (next <= cachedMin) {
            applyPos(cachedMin);
            autoDir = 1;
          } else if (next >= 0) {
            applyPos(0);
            autoDir = -1;
          } else applyPos(next);
        }
      }
      requestAnimationFrame(tick);
    }
    wrap.addEventListener("pointerdown", (e) => {
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
      wrap.style.cursor = "grabbing";
      wrap.setPointerCapture(e.pointerId);
    }, { passive: true });
    wrap.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartClientX;
      let newPos = dragStartPos + dx;
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
    const onRelease = () => {
      if (!dragging) return;
      dragging = false;
      wrap.style.cursor = "";
      if (pos > 0 || pos < cachedMin) {
        applyPos(Math.max(cachedMin, Math.min(0, pos)));
        scheduleResume(600);
        return;
      }
      const avgVel = velSamples.length > 0 ? velSamples.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, velSamples.length) : 0;
      if (Math.abs(avgVel) > 0.4) {
        inertiaVel = avgVel;
        inertiaOn = true;
      } else {
        scheduleResume(2e3);
      }
    };
    wrap.addEventListener("pointerup", onRelease);
    wrap.addEventListener("pointercancel", onRelease);
    requestAnimationFrame(() => requestAnimationFrame(tick));
  }
  (function init() {
    const clienteSessao = loginUseCase.restoreSession();
    if (clienteSessao) {
      entrarComCliente(clienteSessao.toJSON());
      return;
    }
    mostrarLogin();
  })();
  initFiltrosTicker();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      fecharDialog();
      fecharModal();
      fecharConfirmWA();
      fecharDialogBolo();
    }
  });
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
    sair
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3V0aWxzL3NlY3VyaXR5LnRzIiwgIi4uL3NyYy91dGlscy9mb3JtYXQudHMiLCAiLi4vc3JjL2NvcmUvZXJyb3JzLnRzIiwgIi4uL3NyYy9kb21haW4vY2xpZW50ZS50cyIsICIuLi9zcmMvY29yZS9yZXN1bHQudHMiLCAiLi4vc3JjL2NvcmUvbG9nZ2VyLnRzIiwgIi4uL3NyYy9zdGF0ZS9TdG9yZS50cyIsICIuLi9zcmMvc3RhdGUvQXBwU3RvcmUudHMiLCAiLi4vc3JjL2FwcGxpY2F0aW9uL2F1dGgvTG9naW5Vc2VDYXNlLnRzIiwgIi4uL3NyYy9hcHBsaWNhdGlvbi9jYXJ0L0NhcnRTZXJ2aWNlLnRzIiwgIi4uL3NyYy9jb250YWluZXIudHMiLCAiLi4vc3JjL21vZHVsZXMvY2FydC50cyIsICIuLi9zcmMvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGZ1bmN0aW9uIGVzY0hUTUwoczogdW5rbm93bik6IHN0cmluZyB7XG4gIHJldHVybiBTdHJpbmcocylcbiAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXphclRlbGVmb25lKHRlbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRlbC5yZXBsYWNlKC9cXEQvZywgJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXphck5vbWUobm9tZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5vbWVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5zcGxpdCgnICcpXG4gICAgLm1hcChwID0+IHAuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwLnNsaWNlKDEpKVxuICAgIC5qb2luKCcgJylcbiAgICAudHJpbSgpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBmb3JtYXRhck1vZWRhKHZhbG9yOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gJ1IkICcgKyB2YWxvci50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VtYW5hQXR1YWwoKTogc3RyaW5nIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3Qgc3RhcnRPZlllYXIgPSBuZXcgRGF0ZShub3cuZ2V0RnVsbFllYXIoKSwgMCwgMSk7XG4gIGNvbnN0IGRheU9mWWVhciA9IE1hdGguZmxvb3IoKG5vdy5nZXRUaW1lKCkgLSBzdGFydE9mWWVhci5nZXRUaW1lKCkpIC8gODY0MDAwMDApO1xuICBjb25zdCB3ZWVrTnVtID0gTWF0aC5jZWlsKChkYXlPZlllYXIgKyBzdGFydE9mWWVhci5nZXREYXkoKSArIDEpIC8gNyk7XG4gIHJldHVybiBgJHtub3cuZ2V0RnVsbFllYXIoKX0tVyR7U3RyaW5nKHdlZWtOdW0pLnBhZFN0YXJ0KDIsICcwJyl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwbGljYXJNYXNjYXJhVGVsZWZvbmUodmFsb3I6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSB2YWxvci5yZXBsYWNlKC9cXEQvZywgJycpLnNsaWNlKDAsIDExKTtcbiAgaWYgKGQubGVuZ3RoIDw9IDIpIHJldHVybiBkO1xuICBpZiAoZC5sZW5ndGggPD0gNykgcmV0dXJuIGAoJHtkLnNsaWNlKDAsIDIpfSkgJHtkLnNsaWNlKDIpfWA7XG4gIGlmIChkLmxlbmd0aCA8PSAxMSkgcmV0dXJuIGAoJHtkLnNsaWNlKDAsIDIpfSkgJHtkLnNsaWNlKDIsIDcpfS0ke2Quc2xpY2UoNyl9YDtcbiAgcmV0dXJuIGAoJHtkLnNsaWNlKDAsIDIpfSkgJHtkLnNsaWNlKDIsIDcpfS0ke2Quc2xpY2UoNywgMTEpfWA7XG59XG4iLCAiZXhwb3J0IGNsYXNzIEFwcEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgcHVibGljIHJlYWRvbmx5IGNvZGU6IHN0cmluZyxcbiAgICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzQ29kZTogbnVtYmVyID0gNTAwLFxuICAgIHB1YmxpYyByZWFkb25seSBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ0FwcEVycm9yJztcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgQXBwRXJyb3IucHJvdG90eXBlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgIHN1cGVyKG1lc3NhZ2UsICdWQUxJREFUSU9OX0VSUk9SJywgNDAwLCBjb250ZXh0KTtcbiAgICB0aGlzLm5hbWUgPSAnVmFsaWRhdGlvbkVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTmV0d29ya0Vycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgIHN1cGVyKG1lc3NhZ2UsICdORVRXT1JLX0VSUk9SJywgNTAzLCBjb250ZXh0KTtcbiAgICB0aGlzLm5hbWUgPSAnTmV0d29ya0Vycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXV0aEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlLCAnQVVUSF9FUlJPUicsIDQwMSk7XG4gICAgdGhpcy5uYW1lID0gJ0F1dGhFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHJlc291cmNlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgJHtyZXNvdXJjZX0gblx1MDBFM28gZW5jb250cmFkb2AsICdOT1RfRk9VTkQnLCA0MDQpO1xuICAgIHRoaXMubmFtZSA9ICdOb3RGb3VuZEVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmF0ZUxpbWl0RXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHJldHJ5QWZ0ZXJNczogbnVtYmVyKSB7XG4gICAgc3VwZXIoYE11aXRhcyB0ZW50YXRpdmFzLiBBZ3VhcmRlICR7TWF0aC5jZWlsKHJldHJ5QWZ0ZXJNcyAvIDEwMDApfXMuYCwgJ1JBVEVfTElNSVQnLCA0MjksIHsgcmV0cnlBZnRlck1zIH0pO1xuICAgIHRoaXMubmFtZSA9ICdSYXRlTGltaXRFcnJvcic7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi9jb3JlL2Vycm9ycyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2xpZW50ZVByb3BzIHtcbiAgaWQ/OiBudW1iZXI7XG4gIG5vbWU6IHN0cmluZztcbiAgdGVsZWZvbmU6IHN0cmluZztcbiAgZW5kZXJlY28/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBDbGllbnRlIHtcbiAgcmVhZG9ubHkgaWQ/OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5vbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgdGVsZWZvbmU6IHN0cmluZztcbiAgcmVhZG9ubHkgZW5kZXJlY28/OiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcm9wczogQ2xpZW50ZVByb3BzKSB7XG4gICAgdGhpcy5pZCA9IHByb3BzLmlkO1xuICAgIHRoaXMubm9tZSA9IHByb3BzLm5vbWU7XG4gICAgdGhpcy50ZWxlZm9uZSA9IHByb3BzLnRlbGVmb25lO1xuICAgIHRoaXMuZW5kZXJlY28gPSBwcm9wcy5lbmRlcmVjbztcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUocHJvcHM6IENsaWVudGVQcm9wcyk6IENsaWVudGUge1xuICAgIGNvbnN0IHRlbCA9IHByb3BzLnRlbGVmb25lLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgaWYgKHRlbC5sZW5ndGggPCAxMCB8fCB0ZWwubGVuZ3RoID4gMTEpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RlbGVmb25lIGludlx1MDBFMWxpZG8nLCB7IHRlbGVmb25lOiBwcm9wcy50ZWxlZm9uZSB9KTtcbiAgICB9XG4gICAgaWYgKCFwcm9wcy5ub21lLnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignTm9tZSBuXHUwMEUzbyBwb2RlIHNlciB2YXppbycpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENsaWVudGUoe1xuICAgICAgLi4ucHJvcHMsXG4gICAgICB0ZWxlZm9uZTogdGVsLFxuICAgICAgbm9tZTogQ2xpZW50ZS5ub3JtYWxpemFyTm9tZShwcm9wcy5ub21lKSxcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tREIocmF3OiBDbGllbnRlUHJvcHMpOiBDbGllbnRlIHtcbiAgICByZXR1cm4gbmV3IENsaWVudGUocmF3KTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIG5vcm1hbGl6YXJOb21lKG5vbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG5vbWUudG9Mb3dlckNhc2UoKS5zcGxpdCgnICcpXG4gICAgICAubWFwKHAgPT4gcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHAuc2xpY2UoMSkpXG4gICAgICAuam9pbignICcpLnRyaW0oKTtcbiAgfVxuXG4gIHdpdGhFbmRlcmVjbyhlbmRlcmVjbzogc3RyaW5nKTogQ2xpZW50ZSB7XG4gICAgcmV0dXJuIENsaWVudGUuZnJvbURCKHsgLi4udGhpcy50b0pTT04oKSwgZW5kZXJlY28gfSk7XG4gIH1cblxuICB0b0pTT04oKTogQ2xpZW50ZVByb3BzIHtcbiAgICByZXR1cm4geyBpZDogdGhpcy5pZCwgbm9tZTogdGhpcy5ub21lLCB0ZWxlZm9uZTogdGhpcy50ZWxlZm9uZSwgZW5kZXJlY286IHRoaXMuZW5kZXJlY28gfTtcbiAgfVxufVxuIiwgImV4cG9ydCB0eXBlIFJlc3VsdDxULCBFIGV4dGVuZHMgRXJyb3IgPSBFcnJvcj4gPVxuICB8IHsgcmVhZG9ubHkgb2s6IHRydWU7IHJlYWRvbmx5IHZhbHVlOiBUIH1cbiAgfCB7IHJlYWRvbmx5IG9rOiBmYWxzZTsgcmVhZG9ubHkgZXJyb3I6IEUgfTtcblxuZXhwb3J0IGNvbnN0IG9rID0gPFQ+KHZhbHVlOiBUKTogUmVzdWx0PFQsIG5ldmVyPiA9PiAoeyBvazogdHJ1ZSwgdmFsdWUgfSk7XG5leHBvcnQgY29uc3QgZmFpbCA9IDxFIGV4dGVuZHMgRXJyb3I+KGVycm9yOiBFKTogUmVzdWx0PG5ldmVyLCBFPiA9PiAoeyBvazogZmFsc2UsIGVycm9yIH0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNPazxULCBFIGV4dGVuZHMgRXJyb3I+KHI6IFJlc3VsdDxULCBFPik6IHIgaXMgeyBvazogdHJ1ZTsgdmFsdWU6IFQgfSB7XG4gIHJldHVybiByLm9rO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwPFQ+KHI6IFJlc3VsdDxUPiwgZmFsbGJhY2s/OiBUKTogVCB7XG4gIGlmIChyLm9rKSByZXR1cm4gci52YWx1ZTtcbiAgaWYgKGZhbGxiYWNrICE9PSB1bmRlZmluZWQpIHJldHVybiBmYWxsYmFjaztcbiAgdGhyb3cgci5lcnJvcjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRyeUFzeW5jPFQ+KGZuOiAoKSA9PiBQcm9taXNlPFQ+KTogUHJvbWlzZTxSZXN1bHQ8VD4+IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gb2soYXdhaXQgZm4oKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFpbChlIGluc3RhbmNlb2YgRXJyb3IgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSkpO1xuICB9XG59XG4iLCAidHlwZSBMb2dMZXZlbCA9ICdkZWJ1ZycgfCAnaW5mbycgfCAnd2FybicgfCAnZXJyb3InO1xuXG5pbnRlcmZhY2UgTG9nRW50cnkge1xuICBsZXZlbDogTG9nTGV2ZWw7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgdGltZXN0YW1wOiBzdHJpbmc7XG4gIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbn1cblxuY2xhc3MgTG9nZ2VyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBwcmVmaXg6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihwcmVmaXggPSAnR2VsYW1vdXInKSB7XG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXg7XG4gIH1cblxuICBwcml2YXRlIGxvZyhsZXZlbDogTG9nTGV2ZWwsIG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3QgZW50cnk6IExvZ0VudHJ5ID0ge1xuICAgICAgbGV2ZWwsXG4gICAgICBtZXNzYWdlLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBjb250ZXh0LFxuICAgIH07XG5cbiAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgIGRlYnVnOiAnY29sb3I6ICM2QjcyODAnLFxuICAgICAgaW5mbzogICdjb2xvcjogIzNCODJGNicsXG4gICAgICB3YXJuOiAgJ2NvbG9yOiAjRjU5RTBCJyxcbiAgICAgIGVycm9yOiAnY29sb3I6ICNFRjQ0NDQ7IGZvbnQtd2VpZ2h0OiBib2xkJyxcbiAgICB9W2xldmVsXTtcblxuICAgIGNvbnN0IGZvcm1hdHRlZCA9IGBbJHt0aGlzLnByZWZpeH1dICR7ZW50cnkudGltZXN0YW1wfSAke21lc3NhZ2V9YDtcblxuICAgIGlmIChsZXZlbCA9PT0gJ2Vycm9yJykge1xuICAgICAgY29uc29sZS5lcnJvcihgJWMke2Zvcm1hdHRlZH1gLCBzdHlsZSwgY29udGV4dCA/PyAnJyk7XG4gICAgfSBlbHNlIGlmIChsZXZlbCA9PT0gJ3dhcm4nKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhgJWMke2Zvcm1hdHRlZH1gLCBzdHlsZSwgY29udGV4dCA/PyAnJyk7XG4gICAgfVxuICB9XG5cbiAgZGVidWcobXNnOiBzdHJpbmcsIGN0eD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7IHRoaXMubG9nKCdkZWJ1ZycsIG1zZywgY3R4KTsgfVxuICBpbmZvKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgIHsgdGhpcy5sb2coJ2luZm8nLCAgbXNnLCBjdHgpOyB9XG4gIHdhcm4obXNnOiBzdHJpbmcsIGN0eD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCAgeyB0aGlzLmxvZygnd2FybicsICBtc2csIGN0eCk7IH1cbiAgZXJyb3IobXNnOiBzdHJpbmcsIGN0eD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7IHRoaXMubG9nKCdlcnJvcicsIG1zZywgY3R4KTsgfVxuXG4gIGNoaWxkKHByZWZpeDogc3RyaW5nKTogTG9nZ2VyIHsgcmV0dXJuIG5ldyBMb2dnZXIoYCR7dGhpcy5wcmVmaXh9OiR7cHJlZml4fWApOyB9XG59XG5cbmV4cG9ydCBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG4iLCAidHlwZSBTZWxlY3RvcjxTLCBUPiA9IChzdGF0ZTogUykgPT4gVDtcbnR5cGUgTGlzdGVuZXI8VD4gPSAodmFsdWU6IFQpID0+IHZvaWQ7XG5cbmV4cG9ydCBjbGFzcyBTdG9yZTxTIGV4dGVuZHMgb2JqZWN0PiB7XG4gIHByaXZhdGUgc3RhdGU6IFM7XG4gIHByaXZhdGUgZ2xvYmFsTGlzdGVuZXJzID0gbmV3IFNldDxMaXN0ZW5lcjxTPj4oKTtcblxuICBjb25zdHJ1Y3Rvcihpbml0aWFsU3RhdGU6IFMpIHtcbiAgICB0aGlzLnN0YXRlID0geyAuLi5pbml0aWFsU3RhdGUgfTtcbiAgfVxuXG4gIGdldFN0YXRlKCk6IFJlYWRvbmx5PFM+IHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgfVxuXG4gIHNldFN0YXRlKHVwZGF0ZXI6IFBhcnRpYWw8Uz4gfCAoKHM6IFJlYWRvbmx5PFM+KSA9PiBQYXJ0aWFsPFM+KSk6IHZvaWQge1xuICAgIGNvbnN0IHBhdGNoID0gdHlwZW9mIHVwZGF0ZXIgPT09ICdmdW5jdGlvbidcbiAgICAgID8gdXBkYXRlcih0aGlzLnN0YXRlKVxuICAgICAgOiB1cGRhdGVyO1xuICAgIHRoaXMuc3RhdGUgPSB7IC4uLnRoaXMuc3RhdGUsIC4uLnBhdGNoIH07XG4gICAgdGhpcy5nbG9iYWxMaXN0ZW5lcnMuZm9yRWFjaChsID0+IGwodGhpcy5zdGF0ZSkpO1xuICB9XG5cbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBMaXN0ZW5lcjxTPik6ICgpID0+IHZvaWQge1xuICAgIHRoaXMuZ2xvYmFsTGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gICAgcmV0dXJuICgpID0+IHRoaXMuZ2xvYmFsTGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH1cblxuICBzZWxlY3Q8VD4oc2VsZWN0b3I6IFNlbGVjdG9yPFMsIFQ+LCBsaXN0ZW5lcjogTGlzdGVuZXI8VD4pOiAoKSA9PiB2b2lkIHtcbiAgICBsZXQgcHJldiA9IHNlbGVjdG9yKHRoaXMuc3RhdGUpO1xuICAgIHJldHVybiB0aGlzLnN1YnNjcmliZShzdGF0ZSA9PiB7XG4gICAgICBjb25zdCBuZXh0ID0gc2VsZWN0b3Ioc3RhdGUpO1xuICAgICAgaWYgKG5leHQgIT09IHByZXYpIHtcbiAgICAgICAgcHJldiA9IG5leHQ7XG4gICAgICAgIGxpc3RlbmVyKG5leHQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgU3RvcmUgfSBmcm9tICcuL1N0b3JlJztcbmltcG9ydCB0eXBlIHsgQ2xpZW50ZSB9IGZyb20gJy4uL2RvbWFpbi9jbGllbnRlJztcblxuZXhwb3J0IGludGVyZmFjZSBBcHBTdGF0ZSB7XG4gIHJlYWRvbmx5IGNsaWVudGU6IENsaWVudGUgfCBudWxsO1xuICByZWFkb25seSBpc0xvZ2dlZEluOiBib29sZWFuO1xuICByZWFkb25seSBjYXJyaW5ob0NvdW50OiBudW1iZXI7XG4gIHJlYWRvbmx5IGNhcnJpbmhvVG90YWw6IG51bWJlcjtcbiAgcmVhZG9ubHkgcGFnYW1lbnRvU2VsZWNpb25hZG86IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IGFwcFN0b3JlID0gbmV3IFN0b3JlPEFwcFN0YXRlPih7XG4gIGNsaWVudGU6IG51bGwsXG4gIGlzTG9nZ2VkSW46IGZhbHNlLFxuICBjYXJyaW5ob0NvdW50OiAwLFxuICBjYXJyaW5ob1RvdGFsOiAwLFxuICBwYWdhbWVudG9TZWxlY2lvbmFkbzogJycsXG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldENsaWVudGUoY2xpZW50ZTogQ2xpZW50ZSB8IG51bGwpOiB2b2lkIHtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoe1xuICAgIGNsaWVudGUsXG4gICAgaXNMb2dnZWRJbjogISFjbGllbnRlLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENhcnJpbmhvKGNvdW50OiBudW1iZXIsIHRvdGFsOiBudW1iZXIpOiB2b2lkIHtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBjYXJyaW5ob0NvdW50OiBjb3VudCwgY2FycmluaG9Ub3RhbDogdG90YWwgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQYWdhbWVudG8odGlwbzogc3RyaW5nKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGFnYW1lbnRvU2VsZWNpb25hZG86IHRpcG8gfSk7XG59XG4iLCAiaW1wb3J0IHsgQ2xpZW50ZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9jbGllbnRlJztcbmltcG9ydCB7IHR5cGUgUmVzdWx0LCBvaywgZmFpbCwgdHJ5QXN5bmMgfSBmcm9tICcuLi8uLi9jb3JlL3Jlc3VsdCc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi9jb3JlL2Vycm9ycyc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi8uLi9jb3JlL2xvZ2dlcic7XG5pbXBvcnQgeyBzZXRDbGllbnRlIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RvcmUnO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ0xvZ2luVXNlQ2FzZScpO1xuXG5jb25zdCBTRVNTSU9OX0tFWSA9ICdnZWxhbW91cl9jbGllbnRlJztcbmNvbnN0IFNFU1NJT05fVFNfS0VZID0gJ2dlbGFtb3VyX3RzJztcbmNvbnN0IFNFU1NJT05fVFRMX01TID0gMzAgKiAyNCAqIDYwICogNjAgKiAxMDAwO1xuXG5mdW5jdGlvbiBsZXJTdG9yYWdlKGNoYXZlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgdHJ5IHsgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGNoYXZlKTsgfSBjYXRjaCB7IHJldHVybiBudWxsOyB9XG59XG5cbmZ1bmN0aW9uIGdyYXZhclN0b3JhZ2UoY2hhdmU6IHN0cmluZywgdmFsb3I6IHN0cmluZyk6IHZvaWQge1xuICB0cnkgeyBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShjaGF2ZSwgdmFsb3IpOyB9IGNhdGNoIHsgLyogbW9kbyBwcml2YWRvOiBzZWd1ZSBzZW0gc2FsdmFyICovIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlclN0b3JhZ2UoY2hhdmU6IHN0cmluZyk6IHZvaWQge1xuICB0cnkgeyBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShjaGF2ZSk7IH0gY2F0Y2ggeyAvKiBpZ25vcmEgKi8gfVxufVxuXG4vKiogTG9naW4gMTAwJSBsb2NhbDogbyBjYWRhc3RybyBkbyBjbGllbnRlIGZpY2Egc2Fsdm8gbm8gcHJcdTAwRjNwcmlvIGFwYXJlbGhvLiAqL1xuZXhwb3J0IGNsYXNzIExvZ2luVXNlQ2FzZSB7XG4gIHByaXZhdGUgbGVyU2Fsdm8oKTogQ2xpZW50ZSB8IG51bGwge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB0cyA9IE51bWJlcihsZXJTdG9yYWdlKFNFU1NJT05fVFNfS0VZKSA/PyAnMCcpO1xuICAgICAgaWYgKERhdGUubm93KCkgLSB0cyA+IFNFU1NJT05fVFRMX01TKSByZXR1cm4gbnVsbDtcbiAgICAgIGNvbnN0IHJhdyA9IGxlclN0b3JhZ2UoU0VTU0lPTl9LRVkpO1xuICAgICAgaWYgKCFyYXcpIHJldHVybiBudWxsO1xuICAgICAgcmV0dXJuIENsaWVudGUuZnJvbURCKEpTT04ucGFyc2UocmF3KSBhcyBSZXR1cm5UeXBlPENsaWVudGVbJ3RvSlNPTiddPik7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXN0b3JlU2Vzc2lvbigpOiBDbGllbnRlIHwgbnVsbCB7XG4gICAgY29uc3QgY2xpZW50ZSA9IHRoaXMubGVyU2Fsdm8oKTtcbiAgICBpZiAoIWNsaWVudGUpIHsgdGhpcy5jbGVhclNlc3Npb24oKTsgcmV0dXJuIG51bGw7IH1cbiAgICBzZXRDbGllbnRlKGNsaWVudGUpO1xuICAgIHJldHVybiBjbGllbnRlO1xuICB9XG5cbiAgLyoqIFRlbGVmb25lIGpcdTAwRTEgdXNhZG8gbmVzdGUgYXBhcmVsaG8gZW50cmEgZGlyZXRvOyBzZW5cdTAwRTNvIHBlZGUgbyBub21lLiAqL1xuICBhc3luYyBleGVjdXRlKHRlbGVmb25lOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDx7IGV4aXN0ZTogYm9vbGVhbjsgY2xpZW50ZT86IENsaWVudGUgfT4+IHtcbiAgICBjb25zdCB0ZWwgPSB0ZWxlZm9uZS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgIGlmICh0ZWwubGVuZ3RoIDwgMTAgfHwgdGVsLmxlbmd0aCA+IDExKSByZXR1cm4gZmFpbChuZXcgVmFsaWRhdGlvbkVycm9yKCdUZWxlZm9uZSBpbnZcdTAwRTFsaWRvJykpO1xuICAgIGNvbnN0IHNhbHZvID0gdGhpcy5sZXJTYWx2bygpO1xuICAgIGlmIChzYWx2byAmJiBzYWx2by50ZWxlZm9uZSA9PT0gdGVsKSByZXR1cm4gb2soeyBleGlzdGU6IHRydWUsIGNsaWVudGU6IHNhbHZvIH0pO1xuICAgIHJldHVybiBvayh7IGV4aXN0ZTogZmFsc2UgfSk7XG4gIH1cblxuICBhc3luYyByZWdpc3Rlcihub21lOiBzdHJpbmcsIHRlbGVmb25lOiBzdHJpbmcsIGVuZGVyZWNvOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDxDbGllbnRlPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiBDbGllbnRlLmNyZWF0ZSh7IG5vbWUsIHRlbGVmb25lLCBlbmRlcmVjbyB9KSk7XG4gIH1cblxuICBsb2dpbihjbGllbnRlOiBDbGllbnRlKTogdm9pZCB7XG4gICAgZ3JhdmFyU3RvcmFnZShTRVNTSU9OX0tFWSwgSlNPTi5zdHJpbmdpZnkoY2xpZW50ZS50b0pTT04oKSkpO1xuICAgIGdyYXZhclN0b3JhZ2UoU0VTU0lPTl9UU19LRVksIFN0cmluZyhEYXRlLm5vdygpKSk7XG4gICAgc2V0Q2xpZW50ZShjbGllbnRlKTtcbiAgICBsb2cuaW5mbygnTG9naW4gcmVhbGl6YWRvJyk7XG4gIH1cblxuICBzYWx2YXJFbmRlcmVjbyhlbmRlcmVjbzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgYXR1YWwgPSB0aGlzLmxlclNhbHZvKCk7XG4gICAgaWYgKCFhdHVhbCkgcmV0dXJuO1xuICAgIGdyYXZhclN0b3JhZ2UoU0VTU0lPTl9LRVksIEpTT04uc3RyaW5naWZ5KGF0dWFsLndpdGhFbmRlcmVjbyhlbmRlcmVjbykudG9KU09OKCkpKTtcbiAgfVxuXG4gIGxvZ291dCgpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFyU2Vzc2lvbigpO1xuICAgIHNldENsaWVudGUobnVsbCk7XG4gICAgbG9nLmluZm8oJ0xvZ291dCByZWFsaXphZG8nKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJTZXNzaW9uKCk6IHZvaWQge1xuICAgIHJlbW92ZXJTdG9yYWdlKFNFU1NJT05fS0VZKTtcbiAgICByZW1vdmVyU3RvcmFnZShTRVNTSU9OX1RTX0tFWSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBzZXRDYXJyaW5obyB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0b3JlJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgSXRlbVBlZGlkbyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ0NhcnRTZXJ2aWNlJyk7XG5cbmV4cG9ydCBjbGFzcyBDYXJ0U2VydmljZSB7XG4gIHByaXZhdGUgaXRlbXMgPSBuZXcgTWFwPHN0cmluZywgSXRlbVBlZGlkbz4oKTtcblxuICBhZGQobm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXRlbXMuaGFzKG5vbWUpKSByZXR1cm47XG4gICAgdGhpcy5pdGVtcy5zZXQobm9tZSwgeyBub21lLCBwcmVjbzogTnVtYmVyKHByZWNvKSB9KTtcbiAgICB0aGlzLm5vdGlmeSgpO1xuICAgIGxvZy5kZWJ1ZygnSXRlbSBhZGljaW9uYWRvJywgeyBub21lIH0pO1xuICB9XG5cbiAgcmVtb3ZlKG5vbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5pdGVtcy5oYXMobm9tZSkpIHJldHVybjtcbiAgICB0aGlzLml0ZW1zLmRlbGV0ZShub21lKTtcbiAgICB0aGlzLm5vdGlmeSgpO1xuICAgIGxvZy5kZWJ1ZygnSXRlbSByZW1vdmlkbycsIHsgbm9tZSB9KTtcbiAgfVxuXG4gIHRvZ2dsZShub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiAnYWRkZWQnIHwgJ3JlbW92ZWQnIHtcbiAgICBpZiAodGhpcy5pdGVtcy5oYXMobm9tZSkpIHtcbiAgICAgIHRoaXMucmVtb3ZlKG5vbWUpO1xuICAgICAgcmV0dXJuICdyZW1vdmVkJztcbiAgICB9XG4gICAgdGhpcy5hZGQobm9tZSwgcHJlY28pO1xuICAgIHJldHVybiAnYWRkZWQnO1xuICB9XG5cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgdGhpcy5pdGVtcy5jbGVhcigpO1xuICAgIHRoaXMubm90aWZ5KCk7XG4gIH1cblxuICBnZXRJdGVtcygpOiByZWFkb25seSBJdGVtUGVkaWRvW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuaXRlbXMudmFsdWVzKCkpO1xuICB9XG5cbiAgZ2V0VG90YWwoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLml0ZW1zLnZhbHVlcygpKVxuICAgICAgLnJlZHVjZSgoc3VtLCBpKSA9PiBNYXRoLnJvdW5kKChzdW0gKyBpLnByZWNvKSAqIDEwMCkgLyAxMDAsIDApO1xuICB9XG5cbiAgZ2V0Q291bnQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuaXRlbXMuc2l6ZTsgfVxuXG4gIGhhcyhub21lOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaXRlbXMuaGFzKG5vbWUpOyB9XG5cbiAgaXNFbXB0eSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaXRlbXMuc2l6ZSA9PT0gMDsgfVxuXG4gIHJldmFsaWRhdGVQcmljZXMocHJpY2VNYXA6IE1hcDxzdHJpbmcsIG51bWJlcj4pOiB2b2lkIHtcbiAgICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRlbSwga2V5KSA9PiB7XG4gICAgICBjb25zdCByZWFsUHJpY2UgPSBwcmljZU1hcC5nZXQoa2V5KTtcbiAgICAgIGlmIChyZWFsUHJpY2UgIT09IHVuZGVmaW5lZCAmJiByZWFsUHJpY2UgIT09IGl0ZW0ucHJlY28pIHtcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoa2V5LCB7IC4uLml0ZW0sIHByZWNvOiByZWFsUHJpY2UgfSk7XG4gICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICBsb2cud2FybignUHJlXHUwMEU3byByZXZhbGlkYWRvJywgeyBub21lOiBrZXksIG9sZDogaXRlbS5wcmVjbywgbmV3OiByZWFsUHJpY2UgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKGNoYW5nZWQpIHRoaXMubm90aWZ5KCk7XG4gIH1cblxuICBwcml2YXRlIG5vdGlmeSgpOiB2b2lkIHtcbiAgICBzZXRDYXJyaW5obyh0aGlzLmdldENvdW50KCksIHRoaXMuZ2V0VG90YWwoKSk7XG4gIH1cbn1cbiIsICIvLyBDb21wb3NpdGlvbiBSb290IFx1MjAxNCBpbnN0YW5jaWEgZSBpbmpldGEgZGVwZW5kXHUwMEVBbmNpYXNcbmltcG9ydCB7IExvZ2luVXNlQ2FzZSB9IGZyb20gJy4vYXBwbGljYXRpb24vYXV0aC9Mb2dpblVzZUNhc2UnO1xuaW1wb3J0IHsgQ2FydFNlcnZpY2UgfSBmcm9tICcuL2FwcGxpY2F0aW9uL2NhcnQvQ2FydFNlcnZpY2UnO1xuXG5leHBvcnQgY29uc3QgbG9naW5Vc2VDYXNlID0gbmV3IExvZ2luVXNlQ2FzZSgpO1xuZXhwb3J0IGNvbnN0IGNhcnRTZXJ2aWNlID0gbmV3IENhcnRTZXJ2aWNlKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzYWx2YXJFbmRlcmVjbyhlbmRlcmVjbzogc3RyaW5nKTogdm9pZCB7XG4gIGxvZ2luVXNlQ2FzZS5zYWx2YXJFbmRlcmVjbyhlbmRlcmVjbyk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBJdGVtQ2FycmluaG8gfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBlc2NIVE1MIH0gZnJvbSAnLi4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgZm9ybWF0YXJNb2VkYSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBjYXJ0U2VydmljZSB9IGZyb20gJy4uL2NvbnRhaW5lcic7XG5cbi8vIEFkYXB0YWRvcmVzIGxlZ2Fkb3MgXHUyMDE0IGRlbGVnYW0gYW8gQ2FydFNlcnZpY2UgKENsZWFuIEFyY2hpdGVjdHVyZSlcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXJyaW5obygpOiBSZWNvcmQ8c3RyaW5nLCBJdGVtQ2FycmluaG8+IHtcbiAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBJdGVtQ2FycmluaG8+ID0ge307XG4gIGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCkuZm9yRWFjaChpID0+IHsgcmVzdWx0W2kubm9tZV0gPSBpOyB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEl0ZW5zKCk6IEl0ZW1DYXJyaW5ob1tdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oY2FydFNlcnZpY2UuZ2V0SXRlbXMoKSkgYXMgSXRlbUNhcnJpbmhvW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUb3RhbCgpOiBudW1iZXIge1xuICByZXR1cm4gY2FydFNlcnZpY2UuZ2V0VG90YWwoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkaWNpb25hckl0ZW0obm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybiBmYWxzZTtcbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVySXRlbShub21lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKCFjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybiBmYWxzZTtcbiAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZUl0ZW0obm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogJ2FkaWNpb25hZG8nIHwgJ3JlbW92aWRvJyB7XG4gIGNvbnN0IHIgPSBjYXJ0U2VydmljZS50b2dnbGUobm9tZSwgcHJlY28pO1xuICByZXR1cm4gciA9PT0gJ2FkZGVkJyA/ICdhZGljaW9uYWRvJyA6ICdyZW1vdmlkbyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaW1wYXIoKTogdm9pZCB7XG4gIGNhcnRTZXJ2aWNlLmNsZWFyKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0JvbG9Gb3JtYShub21lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgQk9MT19GT1JNQV9OT01FUyA9IFtcbiAgICAnQm9sbyBuYSBmb3JtYSBNaWxobyBuYXR1cmFsJyxcbiAgICAnQm9sbyBuYSBmb3JtYSBDZW5vdXJhIGNvbSBjaG9jb2xhdGUgZSBHcmFudWxlJyxcbiAgICAnQm9sbyBuYSBmb3JtYSBCcmlnYWRlaXJvJyxcbiAgICAnQm9sbyBuYSBmb3JtYSBGZXJyZXJvIFJvY2hlcicsXG4gICAgJ1RvcnRhIGRlIEZyYW5nbyBjb20gQ2F0dXBpcnknLFxuICBdO1xuICByZXR1cm4gQk9MT19GT1JNQV9OT01FUy5pbmNsdWRlcyhub21lKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlcml6YXJMaXN0YShjb250YWluZXJJZDogc3RyaW5nLCB0b3RhbFJvZGFwZUlkOiBzdHJpbmcsIGJhZGdlSWQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBsaXN0YSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbnRhaW5lcklkKTtcbiAgY29uc3QgdG90YWxFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRvdGFsUm9kYXBlSWQpO1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGJhZGdlSWQpO1xuICBjb25zdCBpdGVucyA9IGdldEl0ZW5zKCk7XG5cbiAgaWYgKGJhZGdlKSBiYWRnZS50ZXh0Q29udGVudCA9IFN0cmluZyhpdGVucy5sZW5ndGgpO1xuXG4gIGlmICghbGlzdGEgfHwgIXRvdGFsRWwpIHJldHVybjtcblxuICBpZiAoaXRlbnMubGVuZ3RoID09PSAwKSB7XG4gICAgbGlzdGEuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJjYXJyaW5oby12YXppb1wiPjxkaXYgY2xhc3M9XCJjYXJyaW5oby12YXppby1pY29uXCI+XHVEODNEXHVERUQyPC9kaXY+PGRpdj5TZXUgY2FycmluaG8gZXN0XHUwMEUxIHZhemlvPC9kaXY+PC9kaXY+YDtcbiAgICB0b3RhbEVsLnRleHRDb250ZW50ID0gJ1IkIDAsMDAnO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRvdGFsID0gZ2V0VG90YWwoKTtcbiAgbGlzdGEuaW5uZXJIVE1MID0gaXRlbnMubWFwKGl0ZW0gPT4ge1xuICAgIGNvbnN0IG5vbWVFc2MgPSBlc2NIVE1MKGl0ZW0ubm9tZSk7XG4gICAgY29uc3Qgbm9tZURhdGEgPSBlbmNvZGVVUklDb21wb25lbnQoaXRlbS5ub21lKTtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJjYXJ0LWl0ZW1cIj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY2FydC1pdGVtLW5vbWVcIj4ke25vbWVFc2N9PC9zcGFuPlxuICAgICAgPHNwYW4gY2xhc3M9XCJjYXJ0LWl0ZW0tcHJlY29cIj4ke2Zvcm1hdGFyTW9lZGEoaXRlbS5wcmVjbyl9PC9zcGFuPlxuICAgICAgPGJ1dHRvbiBjbGFzcz1cImNhcnQtaXRlbS1yZW1vdmVcIiBvbmNsaWNrPVwicmVtb3ZlckRvQ2FycmluaG8oZGVjb2RlVVJJQ29tcG9uZW50KCcke25vbWVEYXRhfScpKVwiIGFyaWEtbGFiZWw9XCJSZW1vdmVyXCI+XHVEODNEXHVEREQxXHVGRTBGPC9idXR0b24+XG4gICAgPC9kaXY+YDtcbiAgfSkuam9pbignJykgKyBgPGRpdiBjbGFzcz1cImNhcnQtdG90YWxcIj48c3BhbiBjbGFzcz1cImNhcnQtdG90YWwtbGFiZWxcIj5Ub3RhbDwvc3Bhbj48c3BhbiBjbGFzcz1cImNhcnQtdG90YWwtdmFsb3JcIj4ke2Zvcm1hdGFyTW9lZGEodG90YWwpfTwvc3Bhbj48L2Rpdj5gO1xuICB0b3RhbEVsLnRleHRDb250ZW50ID0gZm9ybWF0YXJNb2VkYSh0b3RhbCk7XG59XG4iLCAiLy8gc3JjL21haW4udHMgXHUyMDE0IHBvbnRvIGRlIGVudHJhZGEgR2VsYW1vdXIgKENsZWFuIEFyY2hpdGVjdHVyZSlcbmltcG9ydCB7IGVzY0hUTUwgfSBmcm9tICcuL3V0aWxzL3NlY3VyaXR5JztcbmltcG9ydCB7IGFwbGljYXJNYXNjYXJhVGVsZWZvbmUgfSBmcm9tICcuL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBsb2dpblVzZUNhc2UsIGNhcnRTZXJ2aWNlLCBzYWx2YXJFbmRlcmVjbyB9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7IGFwcFN0b3JlIH0gZnJvbSAnLi9zdGF0ZS9BcHBTdG9yZSc7XG5pbXBvcnQgeyBDbGllbnRlIGFzIENsaWVudGVFbnRpdHkgfSBmcm9tICcuL2RvbWFpbi9jbGllbnRlJztcbmltcG9ydCB7IGlzQm9sb0Zvcm1hLCByZW5kZXJpemFyTGlzdGEgfSBmcm9tICcuL21vZHVsZXMvY2FydCc7XG5pbXBvcnQgdHlwZSB7IENsaWVudGUgfSBmcm9tICcuL3R5cGVzJztcblxuXG4vLyA9PT09PSBDT05TVEFOVEVTID09PT09XG5jb25zdCBXQV9OVU1CRVIgPSBhdG9iKCdOVFV4TVRrME1EYzNNamMxTUE9PScpO1xuXG5sZXQgX3ZlcmlmaWNhbmRvID0gZmFsc2U7XG5sZXQgX2NhZGFzdHJhbmRvID0gZmFsc2U7XG5cbi8vIEhlbHBlcjogbFx1MDBFQSBjbGllbnRlIGF0dWFsIGRvIHN0b3JlXG5mdW5jdGlvbiBnZXRDbGllbnRlQXR1YWwoKTogQ2xpZW50ZSB8IG51bGwge1xuICByZXR1cm4gYXBwU3RvcmUuZ2V0U3RhdGUoKS5jbGllbnRlIGFzIENsaWVudGUgfCBudWxsO1xufVxuXG4vLyA9PT09PSBGSUxUUk9TID09PT09XG5mdW5jdGlvbiBmaWx0cmFyKGNhdDogc3RyaW5nLCBfYnRuOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZmlsdHJvLWJ0bicpLmZvckVhY2goYiA9PiBiLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oJy5maWx0cm8tYnRuW2RhdGEtZmlsdHJvPVwiJyArIGNhdCArICdcIl0nKVxuICAgIC5mb3JFYWNoKGIgPT4gYi5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcm9kLWNhcmQnKS5mb3JFYWNoKGNhcmQgPT4ge1xuICAgIGNvbnN0IGVsID0gY2FyZCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAoY2F0ID09PSAndG9kb3MnIHx8IChlbC5kYXRhc2V0WydjYXQnXSA9PT0gY2F0KSlcbiAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xuICAgIGVsc2VcbiAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xuICB9KTtcbn1cblxuLy8gPT09PT0gQ0FSUklOSE8gPT09PT1cbmZ1bmN0aW9uIGF0dWFsaXphckZhYigpOiB2b2lkIHtcbiAgY29uc3QgZmFiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhcnRGYWInKTtcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FydEJhZGdlJyk7XG4gIGNvbnN0IGNvdW50ID0gY2FydFNlcnZpY2UuZ2V0Q291bnQoKTtcbiAgaWYgKGJhZGdlKSBiYWRnZS50ZXh0Q29udGVudCA9IFN0cmluZyhjb3VudCk7XG4gIGlmIChmYWIpIHtcbiAgICBpZiAoY291bnQgPiAwKSBmYWIuY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgICBlbHNlIHsgZmFiLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7IGZlY2hhck1vZGFsKCk7IH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwZWRpclByb2R1dG8oYm90YW86IEhUTUxFbGVtZW50LCBub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgY2FyZCA9IGJvdGFvLmNsb3Nlc3QoJy5wcm9kLWNhcmQnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHtcbiAgICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gICAgY2FyZD8uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKTtcbiAgICBhdHVhbGl6YXJGYWIoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcbiAgY2FyZD8uY2xhc3NMaXN0LmFkZCgnc2VsZWNpb25hZG8nKTtcbiAgYXR1YWxpemFyRmFiKCk7XG4gIGFicmlyRGlhbG9nKG5vbWUsIHByZWNvKTtcbn1cblxuZnVuY3Rpb24gYWJyaXJEaWFsb2cobm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ1Byb2R1dG8nKTtcbiAgaWYgKGVsKSBlbC5pbm5lckhUTUwgPSAnPHN0cm9uZz4nICsgZXNjSFRNTChub21lKSArICc8L3N0cm9uZz4gXHUyMDE0IFIkICcgKyBOdW1iZXIocHJlY28pLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyRGlhbG9nKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhckRpYWxvZ0JhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAnZGlhbG9nQmFja2Ryb3AnKSBmZWNoYXJEaWFsb2coKTtcbn1cblxuZnVuY3Rpb24gaXJQYXJhRmluYWxpemFyKCk6IHZvaWQge1xuICBmZWNoYXJEaWFsb2coKTtcbiAgYWJyaXJNb2RhbCgpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJpemFyQ2FycmluaG8oKTogdm9pZCB7XG4gIHJlbmRlcml6YXJMaXN0YSgnbGlzdGFDYXJyaW5obycsICd0b3RhbFJvZGFwZScsICdiYWRnZUNvdW50Jyk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcml6YXJOb3RpY2VFbmNvbWVuZGEoKTogdm9pZCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGljZUVuY29tZW5kYScpO1xuICBpZiAoIWVsKSByZXR1cm47XG4gIGNvbnN0IGl0ZW5zID0gY2FydFNlcnZpY2UuZ2V0SXRlbXMoKTtcbiAgY29uc3QgdGVtRm9ybWEgPSBpdGVucy5zb21lKGkgPT4gaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGNvbnN0IHRlbU91dHJvcyA9IGl0ZW5zLnNvbWUoaSA9PiAhaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGlmICh0ZW1Gb3JtYSAmJiB0ZW1PdXRyb3MpIHtcbiAgICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cIm5vdGljZS1taXN0b1wiPjxzcGFuPlx1MjZBMFx1RkUwRjwvc3Bhbj48c3Bhbj48c3Ryb25nPkF0ZW5cdTAwRTdcdTAwRTNvOjwvc3Ryb25nPiBWb2NcdTAwRUEgbWlzdHVyb3UgQm9sb3MgbmEgRm9ybWEgKGZlaXRvcyBzb2IgZW5jb21lbmRhKSBjb20gb3V0cm9zIHByb2R1dG9zLiBDb25zaWRlcmUgcGVkaWRvcyBzZXBhcmFkb3MgcGFyYSBnYXJhbnRpciBvIHByYXpvITwvc3Bhbj48L2Rpdj4nO1xuICB9IGVsc2UgaWYgKHRlbUZvcm1hKSB7XG4gICAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJub3RpY2UtZW5jb21lbmRhXCI+PHNwYW4gY2xhc3M9XCJub3RpY2UtZW5jb21lbmRhLWljb25cIj5cdTIzRjA8L3NwYW4+PHNwYW4+PHN0cm9uZz5Cb2xvIG5hIEZvcm1hIFx1MjAxNCBTb2IgZW5jb21lbmRhITwvc3Ryb25nPjxicj5Fc3NlcyBib2xvcyBzXHUwMEUzbyBwcmVwYXJhZG9zIGVzcGVjaWFsbWVudGUgcGFyYSB2b2NcdTAwRUEuIFByYXpvIGRlIDxzdHJvbmc+NSBob3JhcyBhIDEgZGlhIFx1MDBGQXRpbDwvc3Ryb25nPiBhcFx1MDBGM3MgY29uZmlybWFcdTAwRTdcdTAwRTNvLjwvc3Bhbj48L2Rpdj4nO1xuICB9IGVsc2Uge1xuICAgIGVsLmlubmVySFRNTCA9ICcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFicmlyTW9kYWwoKTogdm9pZCB7XG4gIHJlbmRlcml6YXJDYXJyaW5obygpO1xuICByZW5kZXJpemFyTm90aWNlRW5jb21lbmRhKCk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLWFiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJNb2RhbCgpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhck1vZGFsQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdtb2RhbEJhY2tkcm9wJykgZmVjaGFyTW9kYWwoKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlckRvQ2FycmluaG8obm9tZTogc3RyaW5nKTogdm9pZCB7XG4gIGlmICghY2FydFNlcnZpY2UuaGFzKG5vbWUpKSByZXR1cm47XG4gIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZC5zZWxlY2lvbmFkbycpLmZvckVhY2goY2FyZCA9PiB7XG4gICAgY29uc3Qgbm9tZUVsID0gY2FyZC5xdWVyeVNlbGVjdG9yKCcucHJvZC1ub21lJyk7XG4gICAgaWYgKG5vbWVFbCAmJiBub21lRWwudGV4dENvbnRlbnQ/LnRyaW0oKSA9PT0gbm9tZSkgY2FyZC5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpO1xuICB9KTtcbiAgcmVuZGVyaXphckNhcnJpbmhvKCk7XG4gIGF0dWFsaXphckZhYigpO1xufVxuXG5mdW5jdGlvbiBzZWxlY2lvbmFyUGFnYW1lbnRvKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGFnYW1lbnRvLW9wdCcpLmZvckVhY2gobyA9PiBvLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xuICBlbC5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBjb25zdCB0aXBvID0gKGVsIGFzIEhUTUxFbGVtZW50ICYgeyBkYXRhc2V0OiBET01TdHJpbmdNYXAgfSkuZGF0YXNldFsncGFnJ10gPz8gJyc7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGFnYW1lbnRvU2VsZWNpb25hZG86IHRpcG8gfSk7XG59XG5cbmZ1bmN0aW9uIGxpbXBhckNhcnJpbmhvKCk6IHZvaWQge1xuICBjYXJ0U2VydmljZS5jbGVhcigpO1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiAnJyB9KTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2FtZW50by1vcHQuYXRpdm8nKS5mb3JFYWNoKG8gPT4gby5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcbiAgY29uc3Qgb2JzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wT2JzJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGw7XG4gIGlmIChvYnNFbCkgb2JzRWwudmFsdWUgPSAnJztcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZC5zZWxlY2lvbmFkbycpLmZvckVhY2goYyA9PiBjLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJykpO1xuICBhdHVhbGl6YXJGYWIoKTtcbiAgZmVjaGFyTW9kYWwoKTtcbn1cblxuLy8gPT09PT0gQk9MTyBOQSBGT1JNQSA9PT09PVxuZnVuY3Rpb24gcGVkaXJCb2xvRm9ybWEoYm90YW86IEhUTUxFbGVtZW50LCBub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgY2FyZCA9IGJvdGFvLmNsb3Nlc3QoJy5wcm9kLWNhcmQnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHtcbiAgICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gICAgY2FyZD8uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKTtcbiAgICBhdHVhbGl6YXJGYWIoKTtcbiAgICByZW5kZXJpemFyTm90aWNlRW5jb21lbmRhKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNhcnRTZXJ2aWNlLmFkZChub21lLCBwcmVjbyk7XG4gIGNhcmQ/LmNsYXNzTGlzdC5hZGQoJ3NlbGVjaW9uYWRvJyk7XG4gIGF0dWFsaXphckZhYigpO1xuICBhYnJpckRpYWxvZ0JvbG8oKTtcbn1cblxuZnVuY3Rpb24gYWJyaXJEaWFsb2dCb2xvKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQm9sb0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJEaWFsb2dCb2xvKGU/OiBFdmVudCk6IHZvaWQge1xuICBpZiAoIWUgfHwgKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ2RpYWxvZ0JvbG9CYWNrZHJvcCcpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQm9sb0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xuICB9XG59XG5cbi8vID09PT09IENBUk9VU0VMID09PT09XG5mdW5jdGlvbiBjYXJvdXNlbE5leHQoaWQ6IHN0cmluZywgZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKGUpIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGNvbnN0IGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIGlmICghYykgcmV0dXJuO1xuICBjb25zdCBpbWdzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtaW1nJyk7XG4gIGNvbnN0IGRvdHMgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1kb3QnKTtcbiAgbGV0IGN1ciA9IDA7XG4gIGltZ3MuZm9yRWFjaCgoaW1nLCBpKSA9PiB7IGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhdGl2bycpKSBjdXIgPSBpOyB9KTtcbiAgaW1nc1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBkb3RzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGNvbnN0IG5leHQgPSAoY3VyICsgMSkgJSBpbWdzLmxlbmd0aDtcbiAgaW1nc1tuZXh0XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgZG90c1tuZXh0XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbn1cblxuZnVuY3Rpb24gY2Fyb3VzZWxQcmV2KGlkOiBzdHJpbmcsIGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmIChlKSBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICBjb25zdCBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICBpZiAoIWMpIHJldHVybjtcbiAgY29uc3QgaW1ncyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWltZycpO1xuICBjb25zdCBkb3RzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtZG90Jyk7XG4gIGxldCBjdXIgPSAwO1xuICBpbWdzLmZvckVhY2goKGltZywgaSkgPT4geyBpZiAoaW1nLmNsYXNzTGlzdC5jb250YWlucygnYXRpdm8nKSkgY3VyID0gaTsgfSk7XG4gIGltZ3NbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcbiAgZG90c1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBjb25zdCBwcmV2ID0gKGN1ciAtIDEgKyBpbWdzLmxlbmd0aCkgJSBpbWdzLmxlbmd0aDtcbiAgaW1nc1twcmV2XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgZG90c1twcmV2XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbn1cblxuLy8gPT09PT0gQ0hFQ0tPVVQgXHUyMDE0IDEwMCUgV2hhdHNBcHAgPT09PT1cbmZ1bmN0aW9uIGZpbmFsaXphclBlZGlkbygpOiB2b2lkIHtcbiAgY29uc3QgaXRlbnMgPSBjYXJ0U2VydmljZS5nZXRJdGVtcygpO1xuICBjb25zdCB0ZW1Gb3JtYUZpbiA9IGl0ZW5zLnNvbWUoaSA9PiBpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgY29uc3QgdGVtT3V0cm9zRmluID0gaXRlbnMuc29tZShpID0+ICFpc0JvbG9Gb3JtYShpLm5vbWUpKTtcblxuICBpZiAodGVtRm9ybWFGaW4gJiYgdGVtT3V0cm9zRmluKSB7XG4gICAgaWYgKCFjb25maXJtKCdcdTI2QTBcdUZFMEYgQXRlblx1MDBFN1x1MDBFM28hXFxuXFxuVm9jXHUwMEVBIHRlbSBCb2xvcyBuYSBGb3JtYSAoZmVpdG9zIHNvYiBlbmNvbWVuZGEpIG1pc3R1cmFkb3MgY29tIG91dHJvcyBwcm9kdXRvcy5cXG5cXG5Cb2xvcyBuYSBGb3JtYSBwcmVjaXNhbSBkZSBwcmF6byBkZSA1aCBhIDEgZGlhIFx1MDBGQXRpbCBwYXJhIHByZXBhcm8uXFxuXFxuRGVzZWphIHByb3NzZWd1aXIgbWVzbW8gYXNzaW0/JykpXG4gICAgICByZXR1cm47XG4gIH1cbiAgaWYgKGl0ZW5zLmxlbmd0aCA9PT0gMCkgeyBhbGVydCgnQWRpY2lvbmUgcGVsbyBtZW5vcyB1bSBwcm9kdXRvIGFvIGNhcnJpbmhvIScpOyByZXR1cm47IH1cblxuICBjb25zdCBub21lID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJykgYXMgSFRNTElucHV0RWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3QgZW5kZXJlY28gPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3Qgb2JzID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBPYnMnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBwYWdhbWVudG9TZWxlY2lvbmFkbyA9IGFwcFN0b3JlLmdldFN0YXRlKCkucGFnYW1lbnRvU2VsZWNpb25hZG87XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuXG4gIGlmICghbm9tZSkgeyBhbGVydCgnUG9yIGZhdm9yLCBpbmZvcm1lIHNldSBub21lIGNvbXBsZXRvLicpOyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpPy5mb2N1cygpOyByZXR1cm47IH1cbiAgaWYgKCFlbmRlcmVjbykgeyBhbGVydCgnUG9yIGZhdm9yLCBpbmZvcm1lIHNldSBlbmRlcmVcdTAwRTdvLicpOyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKT8uZm9jdXMoKTsgcmV0dXJuOyB9XG4gIGlmICghcGFnYW1lbnRvU2VsZWNpb25hZG8pIHsgYWxlcnQoJ1BvciBmYXZvciwgZXNjb2xoYSBhIGZvcm1hIGRlIHBhZ2FtZW50by4nKTsgcmV0dXJuOyB9XG5cbiAgLy8gUmUtdmVyaWZpY2FyIHByZVx1MDBFN29zIGRvcyBib3RcdTAwRjVlcyBwYXJhIGV2aXRhciBtYW5pcHVsYVx1MDBFN1x1MDBFM28gY2xpZW50LXNpZGVcbiAgY29uc3QgcHJpY2VNYXAgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYnRuLXBlZGlyJykuZm9yRWFjaChidG4gPT4ge1xuICAgIGNvbnN0IG9uY2xpY2tBdHRyID0gYnRuLmdldEF0dHJpYnV0ZSgnb25jbGljaycpID8/ICcnO1xuICAgIGNvbnN0IG0gPSBvbmNsaWNrQXR0ci5tYXRjaCgvcGVkaXIoPzpQcm9kdXRvfEJvbG9Gb3JtYSlcXCh0aGlzLCcoLis/KScsKFxcZCsoPzpcXC5cXGQrKT8pXFwpLyk7XG4gICAgaWYgKG0pIHByaWNlTWFwLnNldChtWzFdISwgcGFyc2VGbG9hdChtWzJdISkpO1xuICB9KTtcbiAgY2FydFNlcnZpY2UucmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcCk7XG5cbiAgY29uc3QgaXRlbnNWZXJpZmljYWRvcyA9IEFycmF5LmZyb20oY2FydFNlcnZpY2UuZ2V0SXRlbXMoKSk7XG4gIGxldCB0b3RhbCA9IDA7XG4gIGxldCBsaW5oYXNJdGVucyA9ICcnO1xuICBpdGVuc1ZlcmlmaWNhZG9zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgdG90YWwgPSBNYXRoLnJvdW5kKCh0b3RhbCArIGl0ZW0ucHJlY28pICogMTAwKSAvIDEwMDtcbiAgICBsaW5oYXNJdGVucyArPSBgXHUyMDIyICR7aXRlbS5ub21lfSBcdTIwMTQgUiQgJHtpdGVtLnByZWNvLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyl9XFxuYDtcbiAgfSk7XG5cbiAgY29uc3QgZW5jb21lbmRhTm90ZSA9IHRlbUZvcm1hRmluXG4gICAgPyAnXFxuXFxuXHUyM0YwICpBdGVuXHUwMEU3XHUwMEUzbzogY29udFx1MDBFOW0gaXRlbSBzb2IgZW5jb21lbmRhIFx1MjAxNCBwcmF6byBkZSA1aCBhIDEgZGlhIFx1MDBGQXRpbCBwYXJhIHByZXBhcm8uKidcbiAgICA6ICcnO1xuICBjb25zdCBtc2cgPSBgKlx1RDgzQ1x1REY3MCBOT1ZPIFBFRElETyAtIEdFTEFNT1VSKlxcblxcbipcdUQ4M0RcdURDQ0IgSVRFTlM6KlxcbiR7bGluaGFzSXRlbnN9XFxuKlx1RDgzRFx1RENCMCBUb3RhbDoqIFIkICR7dG90YWwudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX1cXG5cXG4qXHVEODNEXHVEQzY0IE5vbWU6KiAke25vbWV9XFxuKlx1RDgzRFx1RENDRCBFbmRlcmVcdTAwRTdvOiogJHtlbmRlcmVjb31cXG4qXHVEODNEXHVEQ0IzIFBhZ2FtZW50bzoqICR7cGFnYW1lbnRvU2VsZWNpb25hZG99JHtvYnMgPyBgXFxuKlx1RDgzRFx1RENERCBPYnM6KiAke29ic31gIDogJyd9JHtlbmNvbWVuZGFOb3RlfVxcblxcblBlZGlkbyBwZWxvIGNhcmRcdTAwRTFwaW8gb25saW5lIFx1MjcyOGA7XG5cbiAgY29uc3QgYnRuRmluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkZpbmFsaXphcicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgdHh0T3JpZyA9IGJ0bkZpbiA/IChidG5GaW4udGV4dENvbnRlbnQgPz8gJycpIDogJyc7XG4gIGlmIChidG5GaW4pIHsgYnRuRmluLmRpc2FibGVkID0gdHJ1ZTsgYnRuRmluLnRleHRDb250ZW50ID0gJ0FicmluZG8gV2hhdHNBcHAuLi4nOyB9XG5cbiAgLy8gR3VhcmRhIG8gZW5kZXJlXHUwMEU3byBubyBhcGFyZWxobyBwYXJhIG8gcHJcdTAwRjN4aW1vIHBlZGlkb1xuICBpZiAoY2xpZW50ZUF0dWFsKSBzYWx2YXJFbmRlcmVjbyhlbmRlcmVjbyk7XG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKGJ0bkZpbikgeyBidG5GaW4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuRmluLnRleHRDb250ZW50ID0gdHh0T3JpZzsgfVxuICB9LCAyMDAwKTtcblxuICAvLyBSZWRpcmVjaW9uYXIgcGFyYSBXaGF0c0FwcCAoc2UgbyBuYXZlZ2Fkb3IgYmxvcXVlYXIgYSBub3ZhIGFiYSwgYWJyZSBuYSBtZXNtYSlcbiAgY29uc3Qgd2FVcmwgPSAnaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQobXNnKTtcbiAgY29uc3Qgd2luID0gd2luZG93Lm9wZW4od2FVcmwsICdfYmxhbmsnKTtcbiAgaWYgKCF3aW4pIHsgd2luZG93LmxvY2F0aW9uLmhyZWYgPSB3YVVybDsgcmV0dXJuOyB9XG5cbiAgZmVjaGFyTW9kYWwoKTtcbiAgbGltcGFyQ2FycmluaG8oKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29uZmlybWFyRW52aW9XQSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgZmVjaGFyQ29uZmlybVdBKCk7XG4gIGxpbXBhckNhcnJpbmhvKCk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhckNvbmZpcm1XQSgpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dhQ29uZmlybUJhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xufVxuXG4vLyA9PT09PSBMT0dJTiBVSSA9PT09PVxuZnVuY3Rpb24gbWFzY2FyYVRlbGVmb25lKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGVsLnZhbHVlID0gYXBsaWNhck1hc2NhcmFUZWxlZm9uZShlbC52YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGVudHJhckNvbUNsaWVudGUoY2xpZW50ZVJhdzogQ2xpZW50ZSk6IHZvaWQge1xuICBjb25zdCBkb21haW5DbGllbnRlID0gQ2xpZW50ZUVudGl0eS5mcm9tREIoY2xpZW50ZVJhdyk7XG4gIGxvZ2luVXNlQ2FzZS5sb2dpbihkb21haW5DbGllbnRlKTtcblxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5PdmVybGF5JykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGNvbnN0IHVzdWFyaW9CYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb0JhcicpO1xuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4JztcbiAgY29uc3QgdXN1YXJpb05vbWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvTm9tZScpO1xuICBpZiAodXN1YXJpb05vbWVFbCkgdXN1YXJpb05vbWVFbC50ZXh0Q29udGVudCA9IGNsaWVudGVSYXcubm9tZTtcbiAgY29uc3Qgcm9sZXRhQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkZsdXR1YW50ZScpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKHJvbGV0YUJ0bikgcm9sZXRhQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gIGNvbnN0IHVzdWFyaW9UZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb1RlbCcpO1xuICBpZiAodXN1YXJpb1RlbCkgdXN1YXJpb1RlbC50ZXh0Q29udGVudCA9IGNsaWVudGVSYXcudGVsZWZvbmUucmVwbGFjZSgvXihcXGR7Mn0pKFxcZHs1fSkoXFxkezR9KSQvLCAnKCQxKSAkMi0kMycpO1xuICBjb25zdCBpbnBOb21lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGlucE5vbWUpIGlucE5vbWUudmFsdWUgPSBjbGllbnRlUmF3Lm5vbWU7XG4gIGNvbnN0IGlucEVuZGVyZWNvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGw7XG4gIGlmIChpbnBFbmRlcmVjbyAmJiBjbGllbnRlUmF3LmVuZGVyZWNvKSBpbnBFbmRlcmVjby52YWx1ZSA9IGNsaWVudGVSYXcuZW5kZXJlY287XG59XG5cbmZ1bmN0aW9uIGlyUGFyYUV0YXBhQ2FkYXN0cm8odGVsSW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgZXRhcGFUZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFUZWxlZm9uZScpO1xuICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgaWYgKGV0YXBhQ2FkKSBldGFwYUNhZC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgdGVsSW5wdXQuZGF0YXNldFsndGVsJ10gPSB0ZWxJbnB1dC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5Ob21lJyk/LmZvY3VzKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhclRlbGVmb25lKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoX3ZlcmlmaWNhbmRvKSByZXR1cm47XG4gIGNvbnN0IHRlbElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCBlcnJvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luRXJybycpO1xuICBpZiAoZXJybykgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBfdmVyaWZpY2FuZG8gPSB0cnVlO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxvZ2luVXNlQ2FzZS5leGVjdXRlKHRlbElucHV0LnZhbHVlKTtcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgaWYgKGVycm8pIHsgZXJyby50ZXh0Q29udGVudCA9IHJlc3VsdC5lcnJvci5tZXNzYWdlOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyZXN1bHQudmFsdWUuZXhpc3RlICYmIHJlc3VsdC52YWx1ZS5jbGllbnRlKSB7XG4gICAgICBlbnRyYXJDb21DbGllbnRlKHJlc3VsdC52YWx1ZS5jbGllbnRlLnRvSlNPTigpIGFzIENsaWVudGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpclBhcmFFdGFwYUNhZGFzdHJvKHRlbElucHV0KTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgX3ZlcmlmaWNhbmRvID0gZmFsc2U7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FkYXN0cmFyKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoX2NhZGFzdHJhbmRvKSByZXR1cm47XG4gIGNvbnN0IG5vbWVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCB0ZWxJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpblRlbGVmb25lJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgY29uc3Qgbm9tZSA9IG5vbWVJbnB1dC52YWx1ZTtcbiAgY29uc3QgdGVsID0gdGVsSW5wdXQuZGF0YXNldFsndGVsJ10gPz8gdGVsSW5wdXQudmFsdWUucmVwbGFjZSgvRC9nLCAnJyk7XG4gIGNvbnN0IGVycm8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FkYXN0cm9FcnJvJyk7XG4gIGlmICghbm9tZS50cmltKCkpIHtcbiAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ0RpZ2l0ZSBzZXUgbm9tZS4nOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChlcnJvKSBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIF9jYWRhc3RyYW5kbyA9IHRydWU7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLnJlZ2lzdGVyKG5vbWUsIHRlbCwgJycpO1xuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gcmVzdWx0LmVycm9yLm1lc3NhZ2U7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW50cmFyQ29tQ2xpZW50ZShyZXN1bHQudmFsdWUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gIH0gZmluYWxseSB7XG4gICAgX2NhZGFzdHJhbmRvID0gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gdm9sdGFyRXRhcGFUZWxlZm9uZSgpOiB2b2lkIHtcbiAgY29uc3QgZXRhcGFDYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFDYWRhc3RybycpO1xuICBjb25zdCBldGFwYVRlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYVRlbGVmb25lJyk7XG4gIGlmIChldGFwYUNhZCkgZXRhcGFDYWQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgaWYgKGV0YXBhVGVsKSBldGFwYVRlbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbn1cblxuZnVuY3Rpb24gc2FpcigpOiB2b2lkIHtcbiAgaWYgKCFjb25maXJtKCdEZXNlamEgc2FpciBkYSBzdWEgY29udGE/JykpIHJldHVybjtcbiAgbG9naW5Vc2VDYXNlLmxvZ291dCgpO1xuICBjb25zdCB1c3VhcmlvQmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzdWFyaW9CYXInKTtcbiAgaWYgKHVzdWFyaW9CYXIpIHVzdWFyaW9CYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJykgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSAnJztcbiAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBFbmRlcmVjbycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlID0gJyc7XG4gIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlID0gJyc7XG4gIGNvbnN0IGV0YXBhVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhVGVsZWZvbmUnKTtcbiAgY29uc3QgZXRhcGFDYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFDYWRhc3RybycpO1xuICBpZiAoZXRhcGFUZWwpIGV0YXBhVGVsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICBpZiAoZXRhcGFDYWQpIGV0YXBhQ2FkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk92ZXJsYXknKSEuc3R5bGUuZGlzcGxheSA9ICdmbGV4Jztcbn1cblxuZnVuY3Rpb24gbW9zdHJhckxvZ2luKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5PdmVybGF5JykhLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gIHNldFRpbWVvdXQoKCkgPT4gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpblRlbGVmb25lJykgYXMgSFRNTElucHV0RWxlbWVudCk/LmZvY3VzKCksIDMwMCk7XG59XG5cbi8vID09PT09IElOSVQgPT09PT1cbmZ1bmN0aW9uIGluaXRGaWx0cm9zVGlja2VyKCk6IHZvaWQge1xuICBjb25zdCB3cmFwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRyb3Mtd3JhcCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgdHJhY2tFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5maWx0cm9zJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpZiAoIXdyYXAgfHwgIXRyYWNrRWwpIHJldHVybjtcbiAgY29uc3QgdHJhY2s6IEhUTUxFbGVtZW50ID0gdHJhY2tFbDtcblxuICBsZXQgcG9zID0gMDtcbiAgbGV0IGF1dG9EaXIgPSAtMTtcbiAgY29uc3QgQVVUT19TUEVFRCA9IDAuNTU7XG4gIGxldCBpc0F1dG8gPSB0cnVlO1xuXG4gIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xuICBsZXQgZHJhZ1N0YXJ0Q2xpZW50WCA9IDA7XG4gIGxldCBkcmFnU3RhcnRQb3MgPSAwO1xuICBsZXQgdmVsU2FtcGxlczogbnVtYmVyW10gPSBbXTtcbiAgbGV0IHByZXZDbGllbnRYID0gMDtcbiAgbGV0IHByZXZUaW1lID0gMDtcbiAgbGV0IGluZXJ0aWFWZWwgPSAwO1xuICBsZXQgaW5lcnRpYU9uID0gZmFsc2U7XG4gIGxldCByZXN1bWVUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcblxuICAvLyBMYXlvdXQgY2FjaGUgXHUyMDE0IGF0dWFsaXphZG8gYXBlbmFzIG5vIHJlc2l6ZSwgblx1MDBFM28gYSBjYWRhIGZyYW1lXG4gIGxldCBjYWNoZWRNaW4gPSBNYXRoLm1pbigwLCB3cmFwLmNsaWVudFdpZHRoIC0gdHJhY2suc2Nyb2xsV2lkdGgpO1xuICBjb25zdCBybyA9IG5ldyBSZXNpemVPYnNlcnZlcigoKSA9PiB7XG4gICAgY2FjaGVkTWluID0gTWF0aC5taW4oMCwgd3JhcC5jbGllbnRXaWR0aCAtIHRyYWNrLnNjcm9sbFdpZHRoKTtcbiAgfSk7XG4gIHJvLm9ic2VydmUod3JhcCk7XG4gIHJvLm9ic2VydmUodHJhY2spO1xuXG4gIGZ1bmN0aW9uIGFwcGx5UG9zKG5ld1BvczogbnVtYmVyKTogdm9pZCB7XG4gICAgcG9zID0gbmV3UG9zO1xuICAgIHRyYWNrLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGVYKCR7cG9zfXB4KWA7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWxSZXN1bWUoKTogdm9pZCB7XG4gICAgaWYgKHJlc3VtZVRpbWVyICE9PSBudWxsKSB7IGNsZWFyVGltZW91dChyZXN1bWVUaW1lcik7IHJlc3VtZVRpbWVyID0gbnVsbDsgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2NoZWR1bGVSZXN1bWUobXM6IG51bWJlcik6IHZvaWQge1xuICAgIGNhbmNlbFJlc3VtZSgpO1xuICAgIHJlc3VtZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpc0F1dG8gPSB0cnVlO1xuICAgICAgaW5lcnRpYU9uID0gZmFsc2U7XG4gICAgICBpbmVydGlhVmVsID0gMDtcbiAgICAgIHJlc3VtZVRpbWVyID0gbnVsbDtcbiAgICB9LCBtcyk7XG4gIH1cblxuICBmdW5jdGlvbiB0aWNrKCk6IHZvaWQge1xuICAgIC8vIFBhcmEgbyBsb29wIHNlIG8gZWxlbWVudG8gZm9yIHJlbW92aWRvIGRvIERPTVxuICAgIGlmICghZG9jdW1lbnQuY29udGFpbnMod3JhcCkpIHsgcm8uZGlzY29ubmVjdCgpOyByZXR1cm47IH1cblxuICAgIGlmICghZHJhZ2dpbmcpIHtcbiAgICAgIGlmIChpbmVydGlhT24pIHtcbiAgICAgICAgaW5lcnRpYVZlbCAqPSAwLjkyO1xuICAgICAgICBjb25zdCBuZXh0ID0gcG9zICsgaW5lcnRpYVZlbDtcbiAgICAgICAgaWYgKG5leHQgPiAwIHx8IG5leHQgPCBjYWNoZWRNaW4pIHtcbiAgICAgICAgICBhcHBseVBvcyhNYXRoLm1heChjYWNoZWRNaW4sIE1hdGgubWluKDAsIG5leHQpKSk7XG4gICAgICAgICAgaW5lcnRpYU9uID0gZmFsc2U7XG4gICAgICAgICAgaW5lcnRpYVZlbCA9IDA7XG4gICAgICAgICAgc2NoZWR1bGVSZXN1bWUoNjAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhpbmVydGlhVmVsKSA8IDAuMTUpIHtcbiAgICAgICAgICBpbmVydGlhT24gPSBmYWxzZTtcbiAgICAgICAgICBpbmVydGlhVmVsID0gMDtcbiAgICAgICAgICBzY2hlZHVsZVJlc3VtZSgxNTAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhcHBseVBvcyhuZXh0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc0F1dG8gJiYgY2FjaGVkTWluIDwgLTEpIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHBvcyArIEFVVE9fU1BFRUQgKiBhdXRvRGlyO1xuICAgICAgICBpZiAobmV4dCA8PSBjYWNoZWRNaW4pIHsgYXBwbHlQb3MoY2FjaGVkTWluKTsgYXV0b0RpciA9IDE7IH1cbiAgICAgICAgZWxzZSBpZiAobmV4dCA+PSAwKSB7IGFwcGx5UG9zKDApOyBhdXRvRGlyID0gLTE7IH1cbiAgICAgICAgZWxzZSBhcHBseVBvcyhuZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICB9XG5cbiAgd3JhcC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIChlOiBQb2ludGVyRXZlbnQpID0+IHtcbiAgICBkcmFnZ2luZyA9IHRydWU7XG4gICAgaXNBdXRvID0gZmFsc2U7XG4gICAgaW5lcnRpYU9uID0gZmFsc2U7XG4gICAgaW5lcnRpYVZlbCA9IDA7XG4gICAgY2FuY2VsUmVzdW1lKCk7XG4gICAgZHJhZ1N0YXJ0Q2xpZW50WCA9IGUuY2xpZW50WDtcbiAgICBkcmFnU3RhcnRQb3MgPSBwb3M7XG4gICAgdmVsU2FtcGxlcyA9IFtdO1xuICAgIHByZXZDbGllbnRYID0gZS5jbGllbnRYO1xuICAgIHByZXZUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgd3JhcC5zdHlsZS5jdXJzb3IgPSAnZ3JhYmJpbmcnO1xuICAgIHdyYXAuc2V0UG9pbnRlckNhcHR1cmUoZS5wb2ludGVySWQpOyAvLyBtYW50XHUwMEU5bSBldmVudG9zIG1lc21vIGZvcmEgZG8gZWxlbWVudG9cbiAgfSwgeyBwYXNzaXZlOiB0cnVlIH0pO1xuXG4gIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCAoZTogUG9pbnRlckV2ZW50KSA9PiB7XG4gICAgaWYgKCFkcmFnZ2luZykgcmV0dXJuO1xuICAgIGNvbnN0IGR4ID0gZS5jbGllbnRYIC0gZHJhZ1N0YXJ0Q2xpZW50WDtcbiAgICBsZXQgbmV3UG9zID0gZHJhZ1N0YXJ0UG9zICsgZHg7XG4gICAgLy8gcnViYmVyIGJhbmQgbmFzIGJvcmRhc1xuICAgIGlmIChuZXdQb3MgPiAwKSBuZXdQb3MgPSBuZXdQb3MgKiAwLjI1O1xuICAgIGlmIChuZXdQb3MgPCBjYWNoZWRNaW4pIG5ld1BvcyA9IGNhY2hlZE1pbiArIChuZXdQb3MgLSBjYWNoZWRNaW4pICogMC4yNTtcbiAgICBhcHBseVBvcyhuZXdQb3MpO1xuXG4gICAgY29uc3Qgbm93ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgY29uc3QgZHQgPSBub3cgLSBwcmV2VGltZTtcbiAgICBpZiAoZHQgPiAwICYmIGR0IDwgODApIHtcbiAgICAgIHZlbFNhbXBsZXMucHVzaCgoZS5jbGllbnRYIC0gcHJldkNsaWVudFgpICogMTYgLyBkdCk7XG4gICAgICBpZiAodmVsU2FtcGxlcy5sZW5ndGggPiA2KSB2ZWxTYW1wbGVzLnNoaWZ0KCk7XG4gICAgfVxuICAgIHByZXZDbGllbnRYID0gZS5jbGllbnRYO1xuICAgIHByZXZUaW1lID0gbm93O1xuICB9LCB7IHBhc3NpdmU6IHRydWUgfSk7XG5cbiAgY29uc3Qgb25SZWxlYXNlID0gKCk6IHZvaWQgPT4ge1xuICAgIGlmICghZHJhZ2dpbmcpIHJldHVybjtcbiAgICBkcmFnZ2luZyA9IGZhbHNlO1xuICAgIHdyYXAuc3R5bGUuY3Vyc29yID0gJyc7XG5cbiAgICBpZiAocG9zID4gMCB8fCBwb3MgPCBjYWNoZWRNaW4pIHtcbiAgICAgIGFwcGx5UG9zKE1hdGgubWF4KGNhY2hlZE1pbiwgTWF0aC5taW4oMCwgcG9zKSkpO1xuICAgICAgc2NoZWR1bGVSZXN1bWUoNjAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhdmdWZWwgPSB2ZWxTYW1wbGVzLmxlbmd0aCA+IDBcbiAgICAgID8gdmVsU2FtcGxlcy5zbGljZSgtMykucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyBNYXRoLm1pbigzLCB2ZWxTYW1wbGVzLmxlbmd0aClcbiAgICAgIDogMDtcblxuICAgIGlmIChNYXRoLmFicyhhdmdWZWwpID4gMC40KSB7XG4gICAgICBpbmVydGlhVmVsID0gYXZnVmVsO1xuICAgICAgaW5lcnRpYU9uID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NoZWR1bGVSZXN1bWUoMjAwMCk7XG4gICAgfVxuICB9O1xuXG4gIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgICAgIG9uUmVsZWFzZSk7XG4gIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIG9uUmVsZWFzZSk7XG5cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKSk7XG59XG5cbihmdW5jdGlvbiBpbml0KCk6IHZvaWQge1xuICBjb25zdCBjbGllbnRlU2Vzc2FvID0gbG9naW5Vc2VDYXNlLnJlc3RvcmVTZXNzaW9uKCk7XG4gIGlmIChjbGllbnRlU2Vzc2FvKSB7IGVudHJhckNvbUNsaWVudGUoY2xpZW50ZVNlc3Nhby50b0pTT04oKSBhcyBDbGllbnRlKTsgcmV0dXJuOyB9XG4gIG1vc3RyYXJMb2dpbigpO1xufSkoKTtcblxuaW5pdEZpbHRyb3NUaWNrZXIoKTtcblxuLy8gUFdBIHNlcnZpY2Ugd29ya2VyXG5pZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xuICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3Rlcignc3cuanMnKS5jYXRjaCgoKSA9PiB7fSk7XG59XG5cbi8vIEZlY2hhciBtb2RhaXMgY29tIEVzY2FwZVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICBmZWNoYXJEaWFsb2coKTtcbiAgICBmZWNoYXJNb2RhbCgpO1xuICAgIGZlY2hhckNvbmZpcm1XQSgpO1xuICAgIGZlY2hhckRpYWxvZ0JvbG8oKTtcbiAgfVxufSk7XG5cbi8vID09PT09IEVYUE9SIFBBUkEgSFRNTCAob25jbGljaz1cIi4uLlwiKSA9PT09PVxuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgV2luZG93IHtcbiAgICBmaWx0cmFyOiB0eXBlb2YgZmlsdHJhcjtcbiAgICBwZWRpclByb2R1dG86IHR5cGVvZiBwZWRpclByb2R1dG87XG4gICAgYWJyaXJEaWFsb2c6IHR5cGVvZiBhYnJpckRpYWxvZztcbiAgICBmZWNoYXJEaWFsb2c6IHR5cGVvZiBmZWNoYXJEaWFsb2c7XG4gICAgZmVjaGFyRGlhbG9nQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJEaWFsb2dCYWNrZHJvcDtcbiAgICBpclBhcmFGaW5hbGl6YXI6IHR5cGVvZiBpclBhcmFGaW5hbGl6YXI7XG4gICAgYWJyaXJNb2RhbDogdHlwZW9mIGFicmlyTW9kYWw7XG4gICAgZmVjaGFyTW9kYWw6IHR5cGVvZiBmZWNoYXJNb2RhbDtcbiAgICBmZWNoYXJNb2RhbEJhY2tkcm9wOiB0eXBlb2YgZmVjaGFyTW9kYWxCYWNrZHJvcDtcbiAgICByZW1vdmVyRG9DYXJyaW5obzogdHlwZW9mIHJlbW92ZXJEb0NhcnJpbmhvO1xuICAgIHNlbGVjaW9uYXJQYWdhbWVudG86IHR5cGVvZiBzZWxlY2lvbmFyUGFnYW1lbnRvO1xuICAgIGZpbmFsaXphclBlZGlkbzogdHlwZW9mIGZpbmFsaXphclBlZGlkbztcbiAgICBjb25maXJtYXJFbnZpb1dBOiB0eXBlb2YgY29uZmlybWFyRW52aW9XQTtcbiAgICBmZWNoYXJDb25maXJtV0E6IHR5cGVvZiBmZWNoYXJDb25maXJtV0E7XG4gICAgcGVkaXJCb2xvRm9ybWE6IHR5cGVvZiBwZWRpckJvbG9Gb3JtYTtcbiAgICBhYnJpckRpYWxvZ0JvbG86IHR5cGVvZiBhYnJpckRpYWxvZ0JvbG87XG4gICAgZmVjaGFyRGlhbG9nQm9sbzogdHlwZW9mIGZlY2hhckRpYWxvZ0JvbG87XG4gICAgY2Fyb3VzZWxOZXh0OiB0eXBlb2YgY2Fyb3VzZWxOZXh0O1xuICAgIGNhcm91c2VsUHJldjogdHlwZW9mIGNhcm91c2VsUHJldjtcbiAgICBtYXNjYXJhVGVsZWZvbmU6IHR5cGVvZiBtYXNjYXJhVGVsZWZvbmU7XG4gICAgdmVyaWZpY2FyVGVsZWZvbmU6IHR5cGVvZiB2ZXJpZmljYXJUZWxlZm9uZTtcbiAgICBjYWRhc3RyYXI6IHR5cGVvZiBjYWRhc3RyYXI7XG4gICAgdm9sdGFyRXRhcGFUZWxlZm9uZTogdHlwZW9mIHZvbHRhckV0YXBhVGVsZWZvbmU7XG4gICAgc2FpcjogdHlwZW9mIHNhaXI7XG4gIH1cbn1cblxuT2JqZWN0LmFzc2lnbih3aW5kb3csIHtcbiAgZmlsdHJhcixcbiAgcGVkaXJQcm9kdXRvLFxuICBhYnJpckRpYWxvZyxcbiAgZmVjaGFyRGlhbG9nLFxuICBmZWNoYXJEaWFsb2dCYWNrZHJvcCxcbiAgaXJQYXJhRmluYWxpemFyLFxuICBhYnJpck1vZGFsLFxuICBmZWNoYXJNb2RhbCxcbiAgZmVjaGFyTW9kYWxCYWNrZHJvcCxcbiAgcmVtb3ZlckRvQ2FycmluaG8sXG4gIHNlbGVjaW9uYXJQYWdhbWVudG8sXG4gIGZpbmFsaXphclBlZGlkbyxcbiAgY29uZmlybWFyRW52aW9XQSxcbiAgZmVjaGFyQ29uZmlybVdBLFxuICBwZWRpckJvbG9Gb3JtYSxcbiAgYWJyaXJEaWFsb2dCb2xvLFxuICBmZWNoYXJEaWFsb2dCb2xvLFxuICBjYXJvdXNlbE5leHQsXG4gIGNhcm91c2VsUHJldixcbiAgbWFzY2FyYVRlbGVmb25lLFxuICB2ZXJpZmljYXJUZWxlZm9uZSxcbiAgY2FkYXN0cmFyLFxuICB2b2x0YXJFdGFwYVRlbGVmb25lLFxuICBzYWlyLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFPLFdBQVMsUUFBUSxHQUFvQjtBQUMxQyxXQUFPLE9BQU8sQ0FBQyxFQUNaLFFBQVEsTUFBTSxPQUFPLEVBQ3JCLFFBQVEsTUFBTSxNQUFNLEVBQ3BCLFFBQVEsTUFBTSxNQUFNLEVBQ3BCLFFBQVEsTUFBTSxRQUFRLEVBQ3RCLFFBQVEsTUFBTSxPQUFPO0FBQUEsRUFDMUI7OztBQ1BPLFdBQVMsY0FBYyxPQUF1QjtBQUNuRCxXQUFPLFFBQVEsTUFBTSxRQUFRLENBQUMsRUFBRSxRQUFRLEtBQUssR0FBRztBQUFBLEVBQ2xEO0FBVU8sV0FBUyx1QkFBdUIsT0FBdUI7QUFDNUQsVUFBTSxJQUFJLE1BQU0sUUFBUSxPQUFPLEVBQUUsRUFBRSxNQUFNLEdBQUcsRUFBRTtBQUM5QyxRQUFJ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QkFBVztBQUFBLElBQ2IsR0FBRyxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBRXBCLFVBQU0sWUFBWSxNQUFZO0FBQzVCLFVBQUksQ0FBQyxTQUFVO0FBQ2YsaUJBQVc7QUFDWCxXQUFLLE1BQU0sU0FBUztBQUVwQixVQUFJLE1BQU0sS0FBSyxNQUFNLFdBQVc7QUFDOUIsaUJBQVMsS0FBSyxJQUFJLFdBQVcsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDOUMsdUJBQWUsR0FBRztBQUNsQjtBQUFBLE1BQ0Y7QUFFQSxZQUFNLFNBQVMsV0FBVyxTQUFTLElBQy9CLFdBQVcsTUFBTSxFQUFFLEVBQUUsT0FBTyxDQUFDLEdBQUcsTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxHQUFHLFdBQVcsTUFBTSxJQUMvRTtBQUVKLFVBQUksS0FBSyxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBQzFCLHFCQUFhO0FBQ2Isb0JBQVk7QUFBQSxNQUNkLE9BQU87QUFDTCx1QkFBZSxHQUFJO0FBQUEsTUFDckI7QUFBQSxJQUNGO0FBRUEsU0FBSyxpQkFBaUIsYUFBaUIsU0FBUztBQUNoRCxTQUFLLGlCQUFpQixpQkFBaUIsU0FBUztBQUVoRCwwQkFBc0IsTUFBTSxzQkFBc0IsSUFBSSxDQUFDO0FBQUEsRUFDekQ7QUFFQSxHQUFDLFNBQVMsT0FBYTtBQUNyQixVQUFNLGdCQUFnQixhQUFhLGVBQWU7QUFDbEQsUUFBSSxlQUFlO0FBQUUsdUJBQWlCLGNBQWMsT0FBTyxDQUFZO0FBQUc7QUFBQSxJQUFRO0FBQ2xGLGlCQUFhO0FBQUEsRUFDZixHQUFHO0FBRUgsb0JBQWtCO0FBR2xCLE1BQUksbUJBQW1CLFdBQVc7QUFDaEMsY0FBVSxjQUFjLFNBQVMsT0FBTyxFQUFFLE1BQU0sTUFBTTtBQUFBLElBQUMsQ0FBQztBQUFBLEVBQzFEO0FBR0EsV0FBUyxpQkFBaUIsV0FBVyxDQUFDLE1BQXFCO0FBQ3pELFFBQUksRUFBRSxRQUFRLFVBQVU7QUFDdEIsbUJBQWE7QUFDYixrQkFBWTtBQUNaLHNCQUFnQjtBQUNoQix1QkFBaUI7QUFBQSxJQUNuQjtBQUFBLEVBQ0YsQ0FBQztBQWdDRCxTQUFPLE9BQU8sUUFBUTtBQUFBLElBQ3BCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLENBQUM7IiwKICAibmFtZXMiOiBbImxvZyIsICJfYSJdCn0K
