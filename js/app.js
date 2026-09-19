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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3V0aWxzL3NlY3VyaXR5LnRzIiwgIi4uL3NyYy91dGlscy9mb3JtYXQudHMiLCAiLi4vc3JjL2NvcmUvZXJyb3JzLnRzIiwgIi4uL3NyYy9kb21haW4vY2xpZW50ZS50cyIsICIuLi9zcmMvY29yZS9yZXN1bHQudHMiLCAiLi4vc3JjL2NvcmUvbG9nZ2VyLnRzIiwgIi4uL3NyYy9zdGF0ZS9TdG9yZS50cyIsICIuLi9zcmMvc3RhdGUvQXBwU3RvcmUudHMiLCAiLi4vc3JjL2FwcGxpY2F0aW9uL2F1dGgvTG9naW5Vc2VDYXNlLnRzIiwgIi4uL3NyYy9hcHBsaWNhdGlvbi9jYXJ0L0NhcnRTZXJ2aWNlLnRzIiwgIi4uL3NyYy9jb250YWluZXIudHMiLCAiLi4vc3JjL21vZHVsZXMvY2FydC50cyIsICIuLi9zcmMvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGZ1bmN0aW9uIGVzY0hUTUwoczogdW5rbm93bik6IHN0cmluZyB7XG4gIHJldHVybiBTdHJpbmcocylcbiAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBmb3JtYXRhck1vZWRhKHZhbG9yOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gJ1IkICcgKyB2YWxvci50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBsaWNhck1hc2NhcmFUZWxlZm9uZSh2YWxvcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZCA9IHZhbG9yLnJlcGxhY2UoL1xcRC9nLCAnJykuc2xpY2UoMCwgMTEpO1xuICBpZiAoZC5sZW5ndGggPD0gMikgcmV0dXJuIGQ7XG4gIGlmIChkLmxlbmd0aCA8PSA3KSByZXR1cm4gYCgke2Quc2xpY2UoMCwgMil9KSAke2Quc2xpY2UoMil9YDtcbiAgaWYgKGQubGVuZ3RoIDw9IDExKSByZXR1cm4gYCgke2Quc2xpY2UoMCwgMil9KSAke2Quc2xpY2UoMiwgNyl9LSR7ZC5zbGljZSg3KX1gO1xuICByZXR1cm4gYCgke2Quc2xpY2UoMCwgMil9KSAke2Quc2xpY2UoMiwgNyl9LSR7ZC5zbGljZSg3LCAxMSl9YDtcbn1cbiIsICJleHBvcnQgY2xhc3MgQXBwRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29kZTogc3RyaW5nLFxuICAgIHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlOiBudW1iZXIgPSA1MDAsXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICApIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnQXBwRXJyb3InO1xuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBBcHBFcnJvci5wcm90b3R5cGUpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgc3VwZXIobWVzc2FnZSwgJ1ZBTElEQVRJT05fRVJST1InLCA0MDAsIGNvbnRleHQpO1xuICAgIHRoaXMubmFtZSA9ICdWYWxpZGF0aW9uRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOZXR3b3JrRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgc3VwZXIobWVzc2FnZSwgJ05FVFdPUktfRVJST1InLCA1MDMsIGNvbnRleHQpO1xuICAgIHRoaXMubmFtZSA9ICdOZXR3b3JrRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBdXRoRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UsICdBVVRIX0VSUk9SJywgNDAxKTtcbiAgICB0aGlzLm5hbWUgPSAnQXV0aEVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTm90Rm91bmRFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IocmVzb3VyY2U6IHN0cmluZykge1xuICAgIHN1cGVyKGAke3Jlc291cmNlfSBuXHUwMEUzbyBlbmNvbnRyYWRvYCwgJ05PVF9GT1VORCcsIDQwNCk7XG4gICAgdGhpcy5uYW1lID0gJ05vdEZvdW5kRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSYXRlTGltaXRFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IocmV0cnlBZnRlck1zOiBudW1iZXIpIHtcbiAgICBzdXBlcihgTXVpdGFzIHRlbnRhdGl2YXMuIEFndWFyZGUgJHtNYXRoLmNlaWwocmV0cnlBZnRlck1zIC8gMTAwMCl9cy5gLCAnUkFURV9MSU1JVCcsIDQyOSwgeyByZXRyeUFmdGVyTXMgfSk7XG4gICAgdGhpcy5uYW1lID0gJ1JhdGVMaW1pdEVycm9yJztcbiAgfVxufVxuIiwgImltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uL2NvcmUvZXJyb3JzJztcblxuZXhwb3J0IGludGVyZmFjZSBDbGllbnRlUHJvcHMge1xuICBpZD86IG51bWJlcjtcbiAgbm9tZTogc3RyaW5nO1xuICB0ZWxlZm9uZTogc3RyaW5nO1xuICBlbmRlcmVjbz86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIENsaWVudGUge1xuICByZWFkb25seSBpZD86IG51bWJlcjtcbiAgcmVhZG9ubHkgbm9tZTogc3RyaW5nO1xuICByZWFkb25seSB0ZWxlZm9uZTogc3RyaW5nO1xuICByZWFkb25seSBlbmRlcmVjbz86IHN0cmluZztcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKHByb3BzOiBDbGllbnRlUHJvcHMpIHtcbiAgICB0aGlzLmlkID0gcHJvcHMuaWQ7XG4gICAgdGhpcy5ub21lID0gcHJvcHMubm9tZTtcbiAgICB0aGlzLnRlbGVmb25lID0gcHJvcHMudGVsZWZvbmU7XG4gICAgdGhpcy5lbmRlcmVjbyA9IHByb3BzLmVuZGVyZWNvO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZShwcm9wczogQ2xpZW50ZVByb3BzKTogQ2xpZW50ZSB7XG4gICAgY29uc3QgdGVsID0gcHJvcHMudGVsZWZvbmUucmVwbGFjZSgvXFxEL2csICcnKTtcbiAgICBpZiAodGVsLmxlbmd0aCA8IDEwIHx8IHRlbC5sZW5ndGggPiAxMSkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignVGVsZWZvbmUgaW52XHUwMEUxbGlkbycsIHsgdGVsZWZvbmU6IHByb3BzLnRlbGVmb25lIH0pO1xuICAgIH1cbiAgICBpZiAoIXByb3BzLm5vbWUudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdOb21lIG5cdTAwRTNvIHBvZGUgc2VyIHZhemlvJyk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ2xpZW50ZSh7XG4gICAgICAuLi5wcm9wcyxcbiAgICAgIHRlbGVmb25lOiB0ZWwsXG4gICAgICBub21lOiBDbGllbnRlLm5vcm1hbGl6YXJOb21lKHByb3BzLm5vbWUpLFxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGZyb21EQihyYXc6IENsaWVudGVQcm9wcyk6IENsaWVudGUge1xuICAgIHJldHVybiBuZXcgQ2xpZW50ZShyYXcpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgbm9ybWFsaXphck5vbWUobm9tZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbm9tZS50b0xvd2VyQ2FzZSgpLnNwbGl0KCcgJylcbiAgICAgIC5tYXAocCA9PiBwLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcC5zbGljZSgxKSlcbiAgICAgIC5qb2luKCcgJykudHJpbSgpO1xuICB9XG5cbiAgd2l0aEVuZGVyZWNvKGVuZGVyZWNvOiBzdHJpbmcpOiBDbGllbnRlIHtcbiAgICByZXR1cm4gQ2xpZW50ZS5mcm9tREIoeyAuLi50aGlzLnRvSlNPTigpLCBlbmRlcmVjbyB9KTtcbiAgfVxuXG4gIHRvSlNPTigpOiBDbGllbnRlUHJvcHMge1xuICAgIHJldHVybiB7IGlkOiB0aGlzLmlkLCBub21lOiB0aGlzLm5vbWUsIHRlbGVmb25lOiB0aGlzLnRlbGVmb25lLCBlbmRlcmVjbzogdGhpcy5lbmRlcmVjbyB9O1xuICB9XG59XG4iLCAiZXhwb3J0IHR5cGUgUmVzdWx0PFQsIEUgZXh0ZW5kcyBFcnJvciA9IEVycm9yPiA9XG4gIHwgeyByZWFkb25seSBvazogdHJ1ZTsgcmVhZG9ubHkgdmFsdWU6IFQgfVxuICB8IHsgcmVhZG9ubHkgb2s6IGZhbHNlOyByZWFkb25seSBlcnJvcjogRSB9O1xuXG5leHBvcnQgY29uc3Qgb2sgPSA8VD4odmFsdWU6IFQpOiBSZXN1bHQ8VCwgbmV2ZXI+ID0+ICh7IG9rOiB0cnVlLCB2YWx1ZSB9KTtcbmV4cG9ydCBjb25zdCBmYWlsID0gPEUgZXh0ZW5kcyBFcnJvcj4oZXJyb3I6IEUpOiBSZXN1bHQ8bmV2ZXIsIEU+ID0+ICh7IG9rOiBmYWxzZSwgZXJyb3IgfSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc09rPFQsIEUgZXh0ZW5kcyBFcnJvcj4ocjogUmVzdWx0PFQsIEU+KTogciBpcyB7IG9rOiB0cnVlOyB2YWx1ZTogVCB9IHtcbiAgcmV0dXJuIHIub2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXA8VD4ocjogUmVzdWx0PFQ+LCBmYWxsYmFjaz86IFQpOiBUIHtcbiAgaWYgKHIub2spIHJldHVybiByLnZhbHVlO1xuICBpZiAoZmFsbGJhY2sgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbGxiYWNrO1xuICB0aHJvdyByLmVycm9yO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdHJ5QXN5bmM8VD4oZm46ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFJlc3VsdDxUPj4ge1xuICB0cnkge1xuICAgIHJldHVybiBvayhhd2FpdCBmbigpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWlsKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUgOiBuZXcgRXJyb3IoU3RyaW5nKGUpKSk7XG4gIH1cbn1cbiIsICJ0eXBlIExvZ0xldmVsID0gJ2RlYnVnJyB8ICdpbmZvJyB8ICd3YXJuJyB8ICdlcnJvcic7XG5cbmludGVyZmFjZSBMb2dFbnRyeSB7XG4gIGxldmVsOiBMb2dMZXZlbDtcbiAgbWVzc2FnZTogc3RyaW5nO1xuICB0aW1lc3RhbXA6IHN0cmluZztcbiAgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xufVxuXG5jbGFzcyBMb2dnZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IHByZWZpeDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHByZWZpeCA9ICdHZWxhbW91cicpIHtcbiAgICB0aGlzLnByZWZpeCA9IHByZWZpeDtcbiAgfVxuXG4gIHByaXZhdGUgbG9nKGxldmVsOiBMb2dMZXZlbCwgbWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkIHtcbiAgICBjb25zdCBlbnRyeTogTG9nRW50cnkgPSB7XG4gICAgICBsZXZlbCxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIGNvbnRleHQsXG4gICAgfTtcblxuICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgZGVidWc6ICdjb2xvcjogIzZCNzI4MCcsXG4gICAgICBpbmZvOiAgJ2NvbG9yOiAjM0I4MkY2JyxcbiAgICAgIHdhcm46ICAnY29sb3I6ICNGNTlFMEInLFxuICAgICAgZXJyb3I6ICdjb2xvcjogI0VGNDQ0NDsgZm9udC13ZWlnaHQ6IGJvbGQnLFxuICAgIH1bbGV2ZWxdO1xuXG4gICAgY29uc3QgZm9ybWF0dGVkID0gYFske3RoaXMucHJlZml4fV0gJHtlbnRyeS50aW1lc3RhbXB9ICR7bWVzc2FnZX1gO1xuXG4gICAgaWYgKGxldmVsID09PSAnZXJyb3InKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGAlYyR7Zm9ybWF0dGVkfWAsIHN0eWxlLCBjb250ZXh0ID8/ICcnKTtcbiAgICB9IGVsc2UgaWYgKGxldmVsID09PSAnd2FybicpIHtcbiAgICAgIGNvbnNvbGUud2FybihgJWMke2Zvcm1hdHRlZH1gLCBzdHlsZSwgY29udGV4dCA/PyAnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKGAlYyR7Zm9ybWF0dGVkfWAsIHN0eWxlLCBjb250ZXh0ID8/ICcnKTtcbiAgICB9XG4gIH1cblxuICBkZWJ1Zyhtc2c6IHN0cmluZywgY3R4PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkIHsgdGhpcy5sb2coJ2RlYnVnJywgbXNnLCBjdHgpOyB9XG4gIGluZm8obXNnOiBzdHJpbmcsIGN0eD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCAgeyB0aGlzLmxvZygnaW5mbycsICBtc2csIGN0eCk7IH1cbiAgd2Fybihtc2c6IHN0cmluZywgY3R4PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkICB7IHRoaXMubG9nKCd3YXJuJywgIG1zZywgY3R4KTsgfVxuICBlcnJvcihtc2c6IHN0cmluZywgY3R4PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkIHsgdGhpcy5sb2coJ2Vycm9yJywgbXNnLCBjdHgpOyB9XG5cbiAgY2hpbGQocHJlZml4OiBzdHJpbmcpOiBMb2dnZXIgeyByZXR1cm4gbmV3IExvZ2dlcihgJHt0aGlzLnByZWZpeH06JHtwcmVmaXh9YCk7IH1cbn1cblxuZXhwb3J0IGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoKTtcbiIsICJ0eXBlIFNlbGVjdG9yPFMsIFQ+ID0gKHN0YXRlOiBTKSA9PiBUO1xudHlwZSBMaXN0ZW5lcjxUPiA9ICh2YWx1ZTogVCkgPT4gdm9pZDtcblxuZXhwb3J0IGNsYXNzIFN0b3JlPFMgZXh0ZW5kcyBvYmplY3Q+IHtcbiAgcHJpdmF0ZSBzdGF0ZTogUztcbiAgcHJpdmF0ZSBnbG9iYWxMaXN0ZW5lcnMgPSBuZXcgU2V0PExpc3RlbmVyPFM+PigpO1xuXG4gIGNvbnN0cnVjdG9yKGluaXRpYWxTdGF0ZTogUykge1xuICAgIHRoaXMuc3RhdGUgPSB7IC4uLmluaXRpYWxTdGF0ZSB9O1xuICB9XG5cbiAgZ2V0U3RhdGUoKTogUmVhZG9ubHk8Uz4ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlO1xuICB9XG5cbiAgc2V0U3RhdGUodXBkYXRlcjogUGFydGlhbDxTPiB8ICgoczogUmVhZG9ubHk8Uz4pID0+IFBhcnRpYWw8Uz4pKTogdm9pZCB7XG4gICAgY29uc3QgcGF0Y2ggPSB0eXBlb2YgdXBkYXRlciA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgPyB1cGRhdGVyKHRoaXMuc3RhdGUpXG4gICAgICA6IHVwZGF0ZXI7XG4gICAgdGhpcy5zdGF0ZSA9IHsgLi4udGhpcy5zdGF0ZSwgLi4ucGF0Y2ggfTtcbiAgICB0aGlzLmdsb2JhbExpc3RlbmVycy5mb3JFYWNoKGwgPT4gbCh0aGlzLnN0YXRlKSk7XG4gIH1cblxuICBzdWJzY3JpYmUobGlzdGVuZXI6IExpc3RlbmVyPFM+KTogKCkgPT4gdm9pZCB7XG4gICAgdGhpcy5nbG9iYWxMaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5nbG9iYWxMaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfVxuXG4gIHNlbGVjdDxUPihzZWxlY3RvcjogU2VsZWN0b3I8UywgVD4sIGxpc3RlbmVyOiBMaXN0ZW5lcjxUPik6ICgpID0+IHZvaWQge1xuICAgIGxldCBwcmV2ID0gc2VsZWN0b3IodGhpcy5zdGF0ZSk7XG4gICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlKHN0YXRlID0+IHtcbiAgICAgIGNvbnN0IG5leHQgPSBzZWxlY3RvcihzdGF0ZSk7XG4gICAgICBpZiAobmV4dCAhPT0gcHJldikge1xuICAgICAgICBwcmV2ID0gbmV4dDtcbiAgICAgICAgbGlzdGVuZXIobmV4dCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBTdG9yZSB9IGZyb20gJy4vU3RvcmUnO1xuaW1wb3J0IHR5cGUgeyBDbGllbnRlIH0gZnJvbSAnLi4vZG9tYWluL2NsaWVudGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFwcFN0YXRlIHtcbiAgcmVhZG9ubHkgY2xpZW50ZTogQ2xpZW50ZSB8IG51bGw7XG4gIHJlYWRvbmx5IGlzTG9nZ2VkSW46IGJvb2xlYW47XG4gIHJlYWRvbmx5IGNhcnJpbmhvQ291bnQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgY2FycmluaG9Ub3RhbDogbnVtYmVyO1xuICByZWFkb25seSBwYWdhbWVudG9TZWxlY2lvbmFkbzogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgYXBwU3RvcmUgPSBuZXcgU3RvcmU8QXBwU3RhdGU+KHtcbiAgY2xpZW50ZTogbnVsbCxcbiAgaXNMb2dnZWRJbjogZmFsc2UsXG4gIGNhcnJpbmhvQ291bnQ6IDAsXG4gIGNhcnJpbmhvVG90YWw6IDAsXG4gIHBhZ2FtZW50b1NlbGVjaW9uYWRvOiAnJyxcbn0pO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2xpZW50ZShjbGllbnRlOiBDbGllbnRlIHwgbnVsbCk6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7XG4gICAgY2xpZW50ZSxcbiAgICBpc0xvZ2dlZEluOiAhIWNsaWVudGUsXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2FycmluaG8oY291bnQ6IG51bWJlciwgdG90YWw6IG51bWJlcik6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IGNhcnJpbmhvQ291bnQ6IGNvdW50LCBjYXJyaW5ob1RvdGFsOiB0b3RhbCB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFBhZ2FtZW50byh0aXBvOiBzdHJpbmcpOiB2b2lkIHtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwYWdhbWVudG9TZWxlY2lvbmFkbzogdGlwbyB9KTtcbn1cbiIsICJpbXBvcnQgeyBDbGllbnRlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2NsaWVudGUnO1xuaW1wb3J0IHsgdHlwZSBSZXN1bHQsIG9rLCBmYWlsLCB0cnlBc3luYyB9IGZyb20gJy4uLy4uL2NvcmUvcmVzdWx0JztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcbmltcG9ydCB7IHNldENsaWVudGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdG9yZSc7XG5cbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnTG9naW5Vc2VDYXNlJyk7XG5cbmNvbnN0IFNFU1NJT05fS0VZID0gJ2dlbGFtb3VyX2NsaWVudGUnO1xuY29uc3QgU0VTU0lPTl9UU19LRVkgPSAnZ2VsYW1vdXJfdHMnO1xuY29uc3QgU0VTU0lPTl9UVExfTVMgPSAzMCAqIDI0ICogNjAgKiA2MCAqIDEwMDA7XG5cbmZ1bmN0aW9uIGxlclN0b3JhZ2UoY2hhdmU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICB0cnkgeyByZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0oY2hhdmUpOyB9IGNhdGNoIHsgcmV0dXJuIG51bGw7IH1cbn1cblxuZnVuY3Rpb24gZ3JhdmFyU3RvcmFnZShjaGF2ZTogc3RyaW5nLCB2YWxvcjogc3RyaW5nKTogdm9pZCB7XG4gIHRyeSB7IGxvY2FsU3RvcmFnZS5zZXRJdGVtKGNoYXZlLCB2YWxvcik7IH0gY2F0Y2ggeyAvKiBtb2RvIHByaXZhZG86IHNlZ3VlIHNlbSBzYWx2YXIgKi8gfVxufVxuXG5mdW5jdGlvbiByZW1vdmVyU3RvcmFnZShjaGF2ZTogc3RyaW5nKTogdm9pZCB7XG4gIHRyeSB7IGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGNoYXZlKTsgfSBjYXRjaCB7IC8qIGlnbm9yYSAqLyB9XG59XG5cbi8qKiBMb2dpbiAxMDAlIGxvY2FsOiBvIGNhZGFzdHJvIGRvIGNsaWVudGUgZmljYSBzYWx2byBubyBwclx1MDBGM3ByaW8gYXBhcmVsaG8uICovXG5leHBvcnQgY2xhc3MgTG9naW5Vc2VDYXNlIHtcbiAgcHJpdmF0ZSBsZXJTYWx2bygpOiBDbGllbnRlIHwgbnVsbCB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRzID0gTnVtYmVyKGxlclN0b3JhZ2UoU0VTU0lPTl9UU19LRVkpID8/ICcwJyk7XG4gICAgICBpZiAoRGF0ZS5ub3coKSAtIHRzID4gU0VTU0lPTl9UVExfTVMpIHJldHVybiBudWxsO1xuICAgICAgY29uc3QgcmF3ID0gbGVyU3RvcmFnZShTRVNTSU9OX0tFWSk7XG4gICAgICBpZiAoIXJhdykgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4gQ2xpZW50ZS5mcm9tREIoSlNPTi5wYXJzZShyYXcpIGFzIFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RvcmVTZXNzaW9uKCk6IENsaWVudGUgfCBudWxsIHtcbiAgICBjb25zdCBjbGllbnRlID0gdGhpcy5sZXJTYWx2bygpO1xuICAgIGlmICghY2xpZW50ZSkgeyB0aGlzLmNsZWFyU2Vzc2lvbigpOyByZXR1cm4gbnVsbDsgfVxuICAgIHNldENsaWVudGUoY2xpZW50ZSk7XG4gICAgcmV0dXJuIGNsaWVudGU7XG4gIH1cblxuICAvKiogVGVsZWZvbmUgalx1MDBFMSB1c2FkbyBuZXN0ZSBhcGFyZWxobyBlbnRyYSBkaXJldG87IHNlblx1MDBFM28gcGVkZSBvIG5vbWUuICovXG4gIGFzeW5jIGV4ZWN1dGUodGVsZWZvbmU6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHsgZXhpc3RlOiBib29sZWFuOyBjbGllbnRlPzogQ2xpZW50ZSB9Pj4ge1xuICAgIGNvbnN0IHRlbCA9IHRlbGVmb25lLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgaWYgKHRlbC5sZW5ndGggPCAxMCB8fCB0ZWwubGVuZ3RoID4gMTEpIHJldHVybiBmYWlsKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RlbGVmb25lIGludlx1MDBFMWxpZG8nKSk7XG4gICAgY29uc3Qgc2Fsdm8gPSB0aGlzLmxlclNhbHZvKCk7XG4gICAgaWYgKHNhbHZvICYmIHNhbHZvLnRlbGVmb25lID09PSB0ZWwpIHJldHVybiBvayh7IGV4aXN0ZTogdHJ1ZSwgY2xpZW50ZTogc2Fsdm8gfSk7XG4gICAgcmV0dXJuIG9rKHsgZXhpc3RlOiBmYWxzZSB9KTtcbiAgfVxuXG4gIGFzeW5jIHJlZ2lzdGVyKG5vbWU6IHN0cmluZywgdGVsZWZvbmU6IHN0cmluZywgZW5kZXJlY286IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PENsaWVudGU+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IENsaWVudGUuY3JlYXRlKHsgbm9tZSwgdGVsZWZvbmUsIGVuZGVyZWNvIH0pKTtcbiAgfVxuXG4gIGxvZ2luKGNsaWVudGU6IENsaWVudGUpOiB2b2lkIHtcbiAgICBncmF2YXJTdG9yYWdlKFNFU1NJT05fS0VZLCBKU09OLnN0cmluZ2lmeShjbGllbnRlLnRvSlNPTigpKSk7XG4gICAgZ3JhdmFyU3RvcmFnZShTRVNTSU9OX1RTX0tFWSwgU3RyaW5nKERhdGUubm93KCkpKTtcbiAgICBzZXRDbGllbnRlKGNsaWVudGUpO1xuICAgIGxvZy5pbmZvKCdMb2dpbiByZWFsaXphZG8nKTtcbiAgfVxuXG4gIHNhbHZhckVuZGVyZWNvKGVuZGVyZWNvOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBhdHVhbCA9IHRoaXMubGVyU2Fsdm8oKTtcbiAgICBpZiAoIWF0dWFsKSByZXR1cm47XG4gICAgZ3JhdmFyU3RvcmFnZShTRVNTSU9OX0tFWSwgSlNPTi5zdHJpbmdpZnkoYXR1YWwud2l0aEVuZGVyZWNvKGVuZGVyZWNvKS50b0pTT04oKSkpO1xuICB9XG5cbiAgbG9nb3V0KCk6IHZvaWQge1xuICAgIHRoaXMuY2xlYXJTZXNzaW9uKCk7XG4gICAgc2V0Q2xpZW50ZShudWxsKTtcbiAgICBsb2cuaW5mbygnTG9nb3V0IHJlYWxpemFkbycpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhclNlc3Npb24oKTogdm9pZCB7XG4gICAgcmVtb3ZlclN0b3JhZ2UoU0VTU0lPTl9LRVkpO1xuICAgIHJlbW92ZXJTdG9yYWdlKFNFU1NJT05fVFNfS0VZKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IHNldENhcnJpbmhvIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RvcmUnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBJdGVtUGVkaWRvIH0gZnJvbSAnLi4vLi4vZG9tYWluL3BlZGlkbyc7XG5cbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnQ2FydFNlcnZpY2UnKTtcblxuZXhwb3J0IGNsYXNzIENhcnRTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBpdGVtcyA9IG5ldyBNYXA8c3RyaW5nLCBJdGVtUGVkaWRvPigpO1xuXG4gIGFkZChub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pdGVtcy5oYXMobm9tZSkpIHJldHVybjtcbiAgICB0aGlzLml0ZW1zLnNldChub21lLCB7IG5vbWUsIHByZWNvOiBOdW1iZXIocHJlY28pIH0pO1xuICAgIHRoaXMubm90aWZ5KCk7XG4gICAgbG9nLmRlYnVnKCdJdGVtIGFkaWNpb25hZG8nLCB7IG5vbWUgfSk7XG4gIH1cblxuICByZW1vdmUobm9tZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLml0ZW1zLmhhcyhub21lKSkgcmV0dXJuO1xuICAgIHRoaXMuaXRlbXMuZGVsZXRlKG5vbWUpO1xuICAgIHRoaXMubm90aWZ5KCk7XG4gICAgbG9nLmRlYnVnKCdJdGVtIHJlbW92aWRvJywgeyBub21lIH0pO1xuICB9XG5cbiAgdG9nZ2xlKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6ICdhZGRlZCcgfCAncmVtb3ZlZCcge1xuICAgIGlmICh0aGlzLml0ZW1zLmhhcyhub21lKSkge1xuICAgICAgdGhpcy5yZW1vdmUobm9tZSk7XG4gICAgICByZXR1cm4gJ3JlbW92ZWQnO1xuICAgIH1cbiAgICB0aGlzLmFkZChub21lLCBwcmVjbyk7XG4gICAgcmV0dXJuICdhZGRlZCc7XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zLmNsZWFyKCk7XG4gICAgdGhpcy5ub3RpZnkoKTtcbiAgfVxuXG4gIGdldEl0ZW1zKCk6IHJlYWRvbmx5IEl0ZW1QZWRpZG9bXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5pdGVtcy52YWx1ZXMoKSk7XG4gIH1cblxuICBnZXRUb3RhbCgpOiBudW1iZXIge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuaXRlbXMudmFsdWVzKCkpXG4gICAgICAucmVkdWNlKChzdW0sIGkpID0+IE1hdGgucm91bmQoKHN1bSArIGkucHJlY28pICogMTAwKSAvIDEwMCwgMCk7XG4gIH1cblxuICBnZXRDb3VudCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5pdGVtcy5zaXplOyB9XG5cbiAgaGFzKG5vbWU6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pdGVtcy5oYXMobm9tZSk7IH1cblxuICBpc0VtcHR5KCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pdGVtcy5zaXplID09PSAwOyB9XG5cbiAgcmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcDogTWFwPHN0cmluZywgbnVtYmVyPik6IHZvaWQge1xuICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdGVtLCBrZXkpID0+IHtcbiAgICAgIGNvbnN0IHJlYWxQcmljZSA9IHByaWNlTWFwLmdldChrZXkpO1xuICAgICAgaWYgKHJlYWxQcmljZSAhPT0gdW5kZWZpbmVkICYmIHJlYWxQcmljZSAhPT0gaXRlbS5wcmVjbykge1xuICAgICAgICB0aGlzLml0ZW1zLnNldChrZXksIHsgLi4uaXRlbSwgcHJlY286IHJlYWxQcmljZSB9KTtcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgIGxvZy53YXJuKCdQcmVcdTAwRTdvIHJldmFsaWRhZG8nLCB7IG5vbWU6IGtleSwgb2xkOiBpdGVtLnByZWNvLCBuZXc6IHJlYWxQcmljZSB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoY2hhbmdlZCkgdGhpcy5ub3RpZnkoKTtcbiAgfVxuXG4gIHByaXZhdGUgbm90aWZ5KCk6IHZvaWQge1xuICAgIHNldENhcnJpbmhvKHRoaXMuZ2V0Q291bnQoKSwgdGhpcy5nZXRUb3RhbCgpKTtcbiAgfVxufVxuIiwgIi8vIENvbXBvc2l0aW9uIFJvb3QgXHUyMDE0IGluc3RhbmNpYSBlIGluamV0YSBkZXBlbmRcdTAwRUFuY2lhc1xuaW1wb3J0IHsgTG9naW5Vc2VDYXNlIH0gZnJvbSAnLi9hcHBsaWNhdGlvbi9hdXRoL0xvZ2luVXNlQ2FzZSc7XG5pbXBvcnQgeyBDYXJ0U2VydmljZSB9IGZyb20gJy4vYXBwbGljYXRpb24vY2FydC9DYXJ0U2VydmljZSc7XG5cbmV4cG9ydCBjb25zdCBsb2dpblVzZUNhc2UgPSBuZXcgTG9naW5Vc2VDYXNlKCk7XG5leHBvcnQgY29uc3QgY2FydFNlcnZpY2UgPSBuZXcgQ2FydFNlcnZpY2UoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNhbHZhckVuZGVyZWNvKGVuZGVyZWNvOiBzdHJpbmcpOiB2b2lkIHtcbiAgbG9naW5Vc2VDYXNlLnNhbHZhckVuZGVyZWNvKGVuZGVyZWNvKTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IEl0ZW1DYXJyaW5obyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IGVzY0hUTUwgfSBmcm9tICcuLi91dGlscy9zZWN1cml0eSc7XG5pbXBvcnQgeyBmb3JtYXRhck1vZWRhIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGNhcnRTZXJ2aWNlIH0gZnJvbSAnLi4vY29udGFpbmVyJztcblxuLy8gQWRhcHRhZG9yZXMgbGVnYWRvcyBcdTIwMTQgZGVsZWdhbSBhbyBDYXJ0U2VydmljZSAoQ2xlYW4gQXJjaGl0ZWN0dXJlKVxuZXhwb3J0IGZ1bmN0aW9uIGdldENhcnJpbmhvKCk6IFJlY29yZDxzdHJpbmcsIEl0ZW1DYXJyaW5obz4ge1xuICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIEl0ZW1DYXJyaW5obz4gPSB7fTtcbiAgY2FydFNlcnZpY2UuZ2V0SXRlbXMoKS5mb3JFYWNoKGkgPT4geyByZXN1bHRbaS5ub21lXSA9IGk7IH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXRlbnMoKTogSXRlbUNhcnJpbmhvW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShjYXJ0U2VydmljZS5nZXRJdGVtcygpKSBhcyBJdGVtQ2FycmluaG9bXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvdGFsKCk6IG51bWJlciB7XG4gIHJldHVybiBjYXJ0U2VydmljZS5nZXRUb3RhbCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRpY2lvbmFySXRlbShub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiBib29sZWFuIHtcbiAgaWYgKGNhcnRTZXJ2aWNlLmhhcyhub21lKSkgcmV0dXJuIGZhbHNlO1xuICBjYXJ0U2VydmljZS5hZGQobm9tZSwgcHJlY28pO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZXJJdGVtKG5vbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAoIWNhcnRTZXJ2aWNlLmhhcyhub21lKSkgcmV0dXJuIGZhbHNlO1xuICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlSXRlbShub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiAnYWRpY2lvbmFkbycgfCAncmVtb3ZpZG8nIHtcbiAgY29uc3QgciA9IGNhcnRTZXJ2aWNlLnRvZ2dsZShub21lLCBwcmVjbyk7XG4gIHJldHVybiByID09PSAnYWRkZWQnID8gJ2FkaWNpb25hZG8nIDogJ3JlbW92aWRvJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpbXBhcigpOiB2b2lkIHtcbiAgY2FydFNlcnZpY2UuY2xlYXIoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm9sb0Zvcm1hKG5vbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBCT0xPX0ZPUk1BX05PTUVTID0gW1xuICAgICdCb2xvIG5hIGZvcm1hIE1pbGhvIG5hdHVyYWwnLFxuICAgICdCb2xvIG5hIGZvcm1hIENlbm91cmEgY29tIGNob2NvbGF0ZSBlIEdyYW51bGUnLFxuICAgICdCb2xvIG5hIGZvcm1hIEJyaWdhZGVpcm8nLFxuICAgICdCb2xvIG5hIGZvcm1hIEZlcnJlcm8gUm9jaGVyJyxcbiAgICAnVG9ydGEgZGUgRnJhbmdvIGNvbSBDYXR1cGlyeScsXG4gIF07XG4gIHJldHVybiBCT0xPX0ZPUk1BX05PTUVTLmluY2x1ZGVzKG5vbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyaXphckxpc3RhKGNvbnRhaW5lcklkOiBzdHJpbmcsIHRvdGFsUm9kYXBlSWQ6IHN0cmluZywgYmFkZ2VJZDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGxpc3RhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGFpbmVySWQpO1xuICBjb25zdCB0b3RhbEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodG90YWxSb2RhcGVJZCk7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYmFkZ2VJZCk7XG4gIGNvbnN0IGl0ZW5zID0gZ2V0SXRlbnMoKTtcblxuICBpZiAoYmFkZ2UpIGJhZGdlLnRleHRDb250ZW50ID0gU3RyaW5nKGl0ZW5zLmxlbmd0aCk7XG5cbiAgaWYgKCFsaXN0YSB8fCAhdG90YWxFbCkgcmV0dXJuO1xuXG4gIGlmIChpdGVucy5sZW5ndGggPT09IDApIHtcbiAgICBsaXN0YS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImNhcnJpbmhvLXZhemlvXCI+PGRpdiBjbGFzcz1cImNhcnJpbmhvLXZhemlvLWljb25cIj5cdUQ4M0RcdURFRDI8L2Rpdj48ZGl2PlNldSBjYXJyaW5obyBlc3RcdTAwRTEgdmF6aW88L2Rpdj48L2Rpdj5gO1xuICAgIHRvdGFsRWwudGV4dENvbnRlbnQgPSAnUiQgMCwwMCc7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgdG90YWwgPSBnZXRUb3RhbCgpO1xuICBsaXN0YS5pbm5lckhUTUwgPSBpdGVucy5tYXAoaXRlbSA9PiB7XG4gICAgY29uc3Qgbm9tZUVzYyA9IGVzY0hUTUwoaXRlbS5ub21lKTtcbiAgICBjb25zdCBub21lRGF0YSA9IGVuY29kZVVSSUNvbXBvbmVudChpdGVtLm5vbWUpO1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImNhcnQtaXRlbVwiPlxuICAgICAgPHNwYW4gY2xhc3M9XCJjYXJ0LWl0ZW0tbm9tZVwiPiR7bm9tZUVzY308L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cImNhcnQtaXRlbS1wcmVjb1wiPiR7Zm9ybWF0YXJNb2VkYShpdGVtLnByZWNvKX08L3NwYW4+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwiY2FydC1pdGVtLXJlbW92ZVwiIG9uY2xpY2s9XCJyZW1vdmVyRG9DYXJyaW5obyhkZWNvZGVVUklDb21wb25lbnQoJyR7bm9tZURhdGF9JykpXCIgYXJpYS1sYWJlbD1cIlJlbW92ZXJcIj5cdUQ4M0RcdURERDFcdUZFMEY8L2J1dHRvbj5cbiAgICA8L2Rpdj5gO1xuICB9KS5qb2luKCcnKSArIGA8ZGl2IGNsYXNzPVwiY2FydC10b3RhbFwiPjxzcGFuIGNsYXNzPVwiY2FydC10b3RhbC1sYWJlbFwiPlRvdGFsPC9zcGFuPjxzcGFuIGNsYXNzPVwiY2FydC10b3RhbC12YWxvclwiPiR7Zm9ybWF0YXJNb2VkYSh0b3RhbCl9PC9zcGFuPjwvZGl2PmA7XG4gIHRvdGFsRWwudGV4dENvbnRlbnQgPSBmb3JtYXRhck1vZWRhKHRvdGFsKTtcbn1cbiIsICIvLyBzcmMvbWFpbi50cyBcdTIwMTQgcG9udG8gZGUgZW50cmFkYSBHZWxhbW91ciAoQ2xlYW4gQXJjaGl0ZWN0dXJlKVxuaW1wb3J0IHsgZXNjSFRNTCB9IGZyb20gJy4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgYXBsaWNhck1hc2NhcmFUZWxlZm9uZSB9IGZyb20gJy4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGxvZ2luVXNlQ2FzZSwgY2FydFNlcnZpY2UsIHNhbHZhckVuZGVyZWNvIH0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHsgYXBwU3RvcmUgfSBmcm9tICcuL3N0YXRlL0FwcFN0b3JlJztcbmltcG9ydCB7IENsaWVudGUgYXMgQ2xpZW50ZUVudGl0eSB9IGZyb20gJy4vZG9tYWluL2NsaWVudGUnO1xuaW1wb3J0IHsgaXNCb2xvRm9ybWEsIHJlbmRlcml6YXJMaXN0YSB9IGZyb20gJy4vbW9kdWxlcy9jYXJ0JztcbmltcG9ydCB0eXBlIHsgQ2xpZW50ZSB9IGZyb20gJy4vdHlwZXMnO1xuXG5cbi8vID09PT09IENPTlNUQU5URVMgPT09PT1cbmNvbnN0IFdBX05VTUJFUiA9IGF0b2IoJ05UVXhNVGswTURjM01qYzFNQT09Jyk7XG5cbmxldCBfdmVyaWZpY2FuZG8gPSBmYWxzZTtcbmxldCBfY2FkYXN0cmFuZG8gPSBmYWxzZTtcblxuLy8gSGVscGVyOiBsXHUwMEVBIGNsaWVudGUgYXR1YWwgZG8gc3RvcmVcbmZ1bmN0aW9uIGdldENsaWVudGVBdHVhbCgpOiBDbGllbnRlIHwgbnVsbCB7XG4gIHJldHVybiBhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUgYXMgQ2xpZW50ZSB8IG51bGw7XG59XG5cbi8vID09PT09IEZJTFRST1MgPT09PT1cbmZ1bmN0aW9uIGZpbHRyYXIoY2F0OiBzdHJpbmcsIF9idG46IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5maWx0cm8tYnRuJykuZm9yRWFjaChiID0+IGIuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJykpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PignLmZpbHRyby1idG5bZGF0YS1maWx0cm89XCInICsgY2F0ICsgJ1wiXScpXG4gICAgLmZvckVhY2goYiA9PiBiLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZCcpLmZvckVhY2goY2FyZCA9PiB7XG4gICAgY29uc3QgZWwgPSBjYXJkIGFzIEhUTUxFbGVtZW50O1xuICAgIGlmIChjYXQgPT09ICd0b2RvcycgfHwgKGVsLmRhdGFzZXRbJ2NhdCddID09PSBjYXQpKVxuICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgZWxzZVxuICAgICAgZWwuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XG4gIH0pO1xufVxuXG4vLyA9PT09PSBDQVJSSU5ITyA9PT09PVxuZnVuY3Rpb24gYXR1YWxpemFyRmFiKCk6IHZvaWQge1xuICBjb25zdCBmYWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FydEZhYicpO1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXJ0QmFkZ2UnKTtcbiAgY29uc3QgY291bnQgPSBjYXJ0U2VydmljZS5nZXRDb3VudCgpO1xuICBpZiAoYmFkZ2UpIGJhZGdlLnRleHRDb250ZW50ID0gU3RyaW5nKGNvdW50KTtcbiAgaWYgKGZhYikge1xuICAgIGlmIChjb3VudCA+IDApIGZhYi5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICAgIGVsc2UgeyBmYWIuY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTsgZmVjaGFyTW9kYWwoKTsgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHBlZGlyUHJvZHV0byhib3RhbzogSFRNTEVsZW1lbnQsIG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjYXJkID0gYm90YW8uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGNhcnRTZXJ2aWNlLmhhcyhub21lKSkge1xuICAgIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcbiAgICBjYXJkPy5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpO1xuICAgIGF0dWFsaXphckZhYigpO1xuICAgIHJldHVybjtcbiAgfVxuICBjYXJ0U2VydmljZS5hZGQobm9tZSwgcHJlY28pO1xuICBjYXJkPy5jbGFzc0xpc3QuYWRkKCdzZWxlY2lvbmFkbycpO1xuICBhdHVhbGl6YXJGYWIoKTtcbiAgYWJyaXJEaWFsb2cobm9tZSwgcHJlY28pO1xufVxuXG5mdW5jdGlvbiBhYnJpckRpYWxvZyhub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nUHJvZHV0bycpO1xuICBpZiAoZWwpIGVsLmlubmVySFRNTCA9ICc8c3Ryb25nPicgKyBlc2NIVE1MKG5vbWUpICsgJzwvc3Ryb25nPiBcdTIwMTQgUiQgJyArIE51bWJlcihwcmVjbykudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJEaWFsb2coKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyRGlhbG9nQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdkaWFsb2dCYWNrZHJvcCcpIGZlY2hhckRpYWxvZygpO1xufVxuXG5mdW5jdGlvbiBpclBhcmFGaW5hbGl6YXIoKTogdm9pZCB7XG4gIGZlY2hhckRpYWxvZygpO1xuICBhYnJpck1vZGFsKCk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcml6YXJDYXJyaW5obygpOiB2b2lkIHtcbiAgcmVuZGVyaXphckxpc3RhKCdsaXN0YUNhcnJpbmhvJywgJ3RvdGFsUm9kYXBlJywgJ2JhZGdlQ291bnQnKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyaXphck5vdGljZUVuY29tZW5kYSgpOiB2b2lkIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWNlRW5jb21lbmRhJyk7XG4gIGlmICghZWwpIHJldHVybjtcbiAgY29uc3QgaXRlbnMgPSBjYXJ0U2VydmljZS5nZXRJdGVtcygpO1xuICBjb25zdCB0ZW1Gb3JtYSA9IGl0ZW5zLnNvbWUoaSA9PiBpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgY29uc3QgdGVtT3V0cm9zID0gaXRlbnMuc29tZShpID0+ICFpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgaWYgKHRlbUZvcm1hICYmIHRlbU91dHJvcykge1xuICAgIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwibm90aWNlLW1pc3RvXCI+PHNwYW4+XHUyNkEwXHVGRTBGPC9zcGFuPjxzcGFuPjxzdHJvbmc+QXRlblx1MDBFN1x1MDBFM286PC9zdHJvbmc+IFZvY1x1MDBFQSBtaXN0dXJvdSBCb2xvcyBuYSBGb3JtYSAoZmVpdG9zIHNvYiBlbmNvbWVuZGEpIGNvbSBvdXRyb3MgcHJvZHV0b3MuIENvbnNpZGVyZSBwZWRpZG9zIHNlcGFyYWRvcyBwYXJhIGdhcmFudGlyIG8gcHJhem8hPC9zcGFuPjwvZGl2Pic7XG4gIH0gZWxzZSBpZiAodGVtRm9ybWEpIHtcbiAgICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cIm5vdGljZS1lbmNvbWVuZGFcIj48c3BhbiBjbGFzcz1cIm5vdGljZS1lbmNvbWVuZGEtaWNvblwiPlx1MjNGMDwvc3Bhbj48c3Bhbj48c3Ryb25nPkJvbG8gbmEgRm9ybWEgXHUyMDE0IFNvYiBlbmNvbWVuZGEhPC9zdHJvbmc+PGJyPkVzc2VzIGJvbG9zIHNcdTAwRTNvIHByZXBhcmFkb3MgZXNwZWNpYWxtZW50ZSBwYXJhIHZvY1x1MDBFQS4gUHJhem8gZGUgPHN0cm9uZz41IGhvcmFzIGEgMSBkaWEgXHUwMEZBdGlsPC9zdHJvbmc+IGFwXHUwMEYzcyBjb25maXJtYVx1MDBFN1x1MDBFM28uPC9zcGFuPjwvZGl2Pic7XG4gIH0gZWxzZSB7XG4gICAgZWwuaW5uZXJIVE1MID0gJyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWJyaXJNb2RhbCgpOiB2b2lkIHtcbiAgcmVuZGVyaXphckNhcnJpbmhvKCk7XG4gIHJlbmRlcml6YXJOb3RpY2VFbmNvbWVuZGEoKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbW9kYWwtYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhck1vZGFsKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdtb2RhbC1hYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyTW9kYWxCYWNrZHJvcChlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ21vZGFsQmFja2Ryb3AnKSBmZWNoYXJNb2RhbCgpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVyRG9DYXJyaW5obyhub21lOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKCFjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybjtcbiAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucHJvZC1jYXJkLnNlbGVjaW9uYWRvJykuZm9yRWFjaChjYXJkID0+IHtcbiAgICBjb25zdCBub21lRWwgPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kLW5vbWUnKTtcbiAgICBpZiAobm9tZUVsICYmIG5vbWVFbC50ZXh0Q29udGVudD8udHJpbSgpID09PSBub21lKSBjYXJkLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJyk7XG4gIH0pO1xuICByZW5kZXJpemFyQ2FycmluaG8oKTtcbiAgYXR1YWxpemFyRmFiKCk7XG59XG5cbmZ1bmN0aW9uIHNlbGVjaW9uYXJQYWdhbWVudG8oZWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYWdhbWVudG8tb3B0JykuZm9yRWFjaChvID0+IG8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKSk7XG4gIGVsLmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGNvbnN0IHRpcG8gPSAoZWwgYXMgSFRNTEVsZW1lbnQgJiB7IGRhdGFzZXQ6IERPTVN0cmluZ01hcCB9KS5kYXRhc2V0WydwYWcnXSA/PyAnJztcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwYWdhbWVudG9TZWxlY2lvbmFkbzogdGlwbyB9KTtcbn1cblxuZnVuY3Rpb24gbGltcGFyQ2FycmluaG8oKTogdm9pZCB7XG4gIGNhcnRTZXJ2aWNlLmNsZWFyKCk7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGFnYW1lbnRvU2VsZWNpb25hZG86ICcnIH0pO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGFnYW1lbnRvLW9wdC5hdGl2bycpLmZvckVhY2gobyA9PiBvLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xuICBjb25zdCBvYnNFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBPYnMnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbDtcbiAgaWYgKG9ic0VsKSBvYnNFbC52YWx1ZSA9ICcnO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucHJvZC1jYXJkLnNlbGVjaW9uYWRvJykuZm9yRWFjaChjID0+IGMuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKSk7XG4gIGF0dWFsaXphckZhYigpO1xuICBmZWNoYXJNb2RhbCgpO1xufVxuXG4vLyA9PT09PSBCT0xPIE5BIEZPUk1BID09PT09XG5mdW5jdGlvbiBwZWRpckJvbG9Gb3JtYShib3RhbzogSFRNTEVsZW1lbnQsIG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjYXJkID0gYm90YW8uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGNhcnRTZXJ2aWNlLmhhcyhub21lKSkge1xuICAgIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcbiAgICBjYXJkPy5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpO1xuICAgIGF0dWFsaXphckZhYigpO1xuICAgIHJlbmRlcml6YXJOb3RpY2VFbmNvbWVuZGEoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcbiAgY2FyZD8uY2xhc3NMaXN0LmFkZCgnc2VsZWNpb25hZG8nKTtcbiAgYXR1YWxpemFyRmFiKCk7XG4gIGFicmlyRGlhbG9nQm9sbygpO1xufVxuXG5mdW5jdGlvbiBhYnJpckRpYWxvZ0JvbG8oKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCb2xvQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhckRpYWxvZ0JvbG8oZT86IEV2ZW50KTogdm9pZCB7XG4gIGlmICghZSB8fCAoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAnZGlhbG9nQm9sb0JhY2tkcm9wJykge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCb2xvQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIH1cbn1cblxuLy8gPT09PT0gQ0FST1VTRUwgPT09PT1cbmZ1bmN0aW9uIGNhcm91c2VsTmV4dChpZDogc3RyaW5nLCBlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoZSkgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgY29uc3QgYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgaWYgKCFjKSByZXR1cm47XG4gIGNvbnN0IGltZ3MgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1pbWcnKTtcbiAgY29uc3QgZG90cyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWRvdCcpO1xuICBsZXQgY3VyID0gMDtcbiAgaW1ncy5mb3JFYWNoKChpbWcsIGkpID0+IHsgaWYgKGltZy5jbGFzc0xpc3QuY29udGFpbnMoJ2F0aXZvJykpIGN1ciA9IGk7IH0pO1xuICBpbWdzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGRvdHNbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcbiAgY29uc3QgbmV4dCA9IChjdXIgKyAxKSAlIGltZ3MubGVuZ3RoO1xuICBpbWdzW25leHRdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBkb3RzW25leHRdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xufVxuXG5mdW5jdGlvbiBjYXJvdXNlbFByZXYoaWQ6IHN0cmluZywgZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKGUpIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGNvbnN0IGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIGlmICghYykgcmV0dXJuO1xuICBjb25zdCBpbWdzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtaW1nJyk7XG4gIGNvbnN0IGRvdHMgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1kb3QnKTtcbiAgbGV0IGN1ciA9IDA7XG4gIGltZ3MuZm9yRWFjaCgoaW1nLCBpKSA9PiB7IGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhdGl2bycpKSBjdXIgPSBpOyB9KTtcbiAgaW1nc1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBkb3RzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGNvbnN0IHByZXYgPSAoY3VyIC0gMSArIGltZ3MubGVuZ3RoKSAlIGltZ3MubGVuZ3RoO1xuICBpbWdzW3ByZXZdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBkb3RzW3ByZXZdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xufVxuXG4vLyA9PT09PSBDSEVDS09VVCBcdTIwMTQgMTAwJSBXaGF0c0FwcCA9PT09PVxuZnVuY3Rpb24gZmluYWxpemFyUGVkaWRvKCk6IHZvaWQge1xuICBjb25zdCBpdGVucyA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCk7XG4gIGNvbnN0IHRlbUZvcm1hRmluID0gaXRlbnMuc29tZShpID0+IGlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuICBjb25zdCB0ZW1PdXRyb3NGaW4gPSBpdGVucy5zb21lKGkgPT4gIWlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuXG4gIGlmICh0ZW1Gb3JtYUZpbiAmJiB0ZW1PdXRyb3NGaW4pIHtcbiAgICBpZiAoIWNvbmZpcm0oJ1x1MjZBMFx1RkUwRiBBdGVuXHUwMEU3XHUwMEUzbyFcXG5cXG5Wb2NcdTAwRUEgdGVtIEJvbG9zIG5hIEZvcm1hIChmZWl0b3Mgc29iIGVuY29tZW5kYSkgbWlzdHVyYWRvcyBjb20gb3V0cm9zIHByb2R1dG9zLlxcblxcbkJvbG9zIG5hIEZvcm1hIHByZWNpc2FtIGRlIHByYXpvIGRlIDVoIGEgMSBkaWEgXHUwMEZBdGlsIHBhcmEgcHJlcGFyby5cXG5cXG5EZXNlamEgcHJvc3NlZ3VpciBtZXNtbyBhc3NpbT8nKSlcbiAgICAgIHJldHVybjtcbiAgfVxuICBpZiAoaXRlbnMubGVuZ3RoID09PSAwKSB7IGFsZXJ0KCdBZGljaW9uZSBwZWxvIG1lbm9zIHVtIHByb2R1dG8gYW8gY2FycmluaG8hJyk7IHJldHVybjsgfVxuXG4gIGNvbnN0IG5vbWUgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBlbmRlcmVjbyA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBvYnMgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE9icycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XG4gIGNvbnN0IHBhZ2FtZW50b1NlbGVjaW9uYWRvID0gYXBwU3RvcmUuZ2V0U3RhdGUoKS5wYWdhbWVudG9TZWxlY2lvbmFkbztcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG5cbiAgaWYgKCFub21lKSB7IGFsZXJ0KCdQb3IgZmF2b3IsIGluZm9ybWUgc2V1IG5vbWUgY29tcGxldG8uJyk7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJyk/LmZvY3VzKCk7IHJldHVybjsgfVxuICBpZiAoIWVuZGVyZWNvKSB7IGFsZXJ0KCdQb3IgZmF2b3IsIGluZm9ybWUgc2V1IGVuZGVyZVx1MDBFN28uJyk7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBFbmRlcmVjbycpPy5mb2N1cygpOyByZXR1cm47IH1cbiAgaWYgKCFwYWdhbWVudG9TZWxlY2lvbmFkbykgeyBhbGVydCgnUG9yIGZhdm9yLCBlc2NvbGhhIGEgZm9ybWEgZGUgcGFnYW1lbnRvLicpOyByZXR1cm47IH1cblxuICAvLyBSZS12ZXJpZmljYXIgcHJlXHUwMEU3b3MgZG9zIGJvdFx1MDBGNWVzIHBhcmEgZXZpdGFyIG1hbmlwdWxhXHUwMEU3XHUwMEUzbyBjbGllbnQtc2lkZVxuICBjb25zdCBwcmljZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idG4tcGVkaXInKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgY29uc3Qgb25jbGlja0F0dHIgPSBidG4uZ2V0QXR0cmlidXRlKCdvbmNsaWNrJykgPz8gJyc7XG4gICAgY29uc3QgbSA9IG9uY2xpY2tBdHRyLm1hdGNoKC9wZWRpcig/OlByb2R1dG98Qm9sb0Zvcm1hKVxcKHRoaXMsJyguKz8pJywoXFxkKyg/OlxcLlxcZCspPylcXCkvKTtcbiAgICBpZiAobSkgcHJpY2VNYXAuc2V0KG1bMV0hLCBwYXJzZUZsb2F0KG1bMl0hKSk7XG4gIH0pO1xuICBjYXJ0U2VydmljZS5yZXZhbGlkYXRlUHJpY2VzKHByaWNlTWFwKTtcblxuICBjb25zdCBpdGVuc1ZlcmlmaWNhZG9zID0gQXJyYXkuZnJvbShjYXJ0U2VydmljZS5nZXRJdGVtcygpKTtcbiAgbGV0IHRvdGFsID0gMDtcbiAgbGV0IGxpbmhhc0l0ZW5zID0gJyc7XG4gIGl0ZW5zVmVyaWZpY2Fkb3MuZm9yRWFjaChpdGVtID0+IHtcbiAgICB0b3RhbCA9IE1hdGgucm91bmQoKHRvdGFsICsgaXRlbS5wcmVjbykgKiAxMDApIC8gMTAwO1xuICAgIGxpbmhhc0l0ZW5zICs9IGBcdTIwMjIgJHtpdGVtLm5vbWV9IFx1MjAxNCBSJCAke2l0ZW0ucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX1cXG5gO1xuICB9KTtcblxuICBjb25zdCBlbmNvbWVuZGFOb3RlID0gdGVtRm9ybWFGaW5cbiAgICA/ICdcXG5cXG5cdTIzRjAgKkF0ZW5cdTAwRTdcdTAwRTNvOiBjb250XHUwMEU5bSBpdGVtIHNvYiBlbmNvbWVuZGEgXHUyMDE0IHByYXpvIGRlIDVoIGEgMSBkaWEgXHUwMEZBdGlsIHBhcmEgcHJlcGFyby4qJ1xuICAgIDogJyc7XG4gIGNvbnN0IG1zZyA9IGAqXHVEODNDXHVERjcwIE5PVk8gUEVESURPIC0gR0VMQU1PVVIqXFxuXFxuKlx1RDgzRFx1RENDQiBJVEVOUzoqXFxuJHtsaW5oYXNJdGVuc31cXG4qXHVEODNEXHVEQ0IwIFRvdGFsOiogUiQgJHt0b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfVxcblxcbipcdUQ4M0RcdURDNjQgTm9tZToqICR7bm9tZX1cXG4qXHVEODNEXHVEQ0NEIEVuZGVyZVx1MDBFN286KiAke2VuZGVyZWNvfVxcbipcdUQ4M0RcdURDQjMgUGFnYW1lbnRvOiogJHtwYWdhbWVudG9TZWxlY2lvbmFkb30ke29icyA/IGBcXG4qXHVEODNEXHVEQ0REIE9iczoqICR7b2JzfWAgOiAnJ30ke2VuY29tZW5kYU5vdGV9XFxuXFxuUGVkaWRvIHBlbG8gY2FyZFx1MDBFMXBpbyBvbmxpbmUgXHUyNzI4YDtcblxuICBjb25zdCBidG5GaW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuRmluYWxpemFyJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICBjb25zdCB0eHRPcmlnID0gYnRuRmluID8gKGJ0bkZpbi50ZXh0Q29udGVudCA/PyAnJykgOiAnJztcbiAgaWYgKGJ0bkZpbikgeyBidG5GaW4uZGlzYWJsZWQgPSB0cnVlOyBidG5GaW4udGV4dENvbnRlbnQgPSAnQWJyaW5kbyBXaGF0c0FwcC4uLic7IH1cblxuICAvLyBHdWFyZGEgbyBlbmRlcmVcdTAwRTdvIG5vIGFwYXJlbGhvIHBhcmEgbyBwclx1MDBGM3hpbW8gcGVkaWRvXG4gIGlmIChjbGllbnRlQXR1YWwpIHNhbHZhckVuZGVyZWNvKGVuZGVyZWNvKTtcblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBpZiAoYnRuRmluKSB7IGJ0bkZpbi5kaXNhYmxlZCA9IGZhbHNlOyBidG5GaW4udGV4dENvbnRlbnQgPSB0eHRPcmlnOyB9XG4gIH0sIDIwMDApO1xuXG4gIC8vIFJlZGlyZWNpb25hciBwYXJhIFdoYXRzQXBwIChzZSBvIG5hdmVnYWRvciBibG9xdWVhciBhIG5vdmEgYWJhLCBhYnJlIG5hIG1lc21hKVxuICBjb25zdCB3YVVybCA9ICdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChtc2cpO1xuICBjb25zdCB3aW4gPSB3aW5kb3cub3Blbih3YVVybCwgJ19ibGFuaycpO1xuICBpZiAoIXdpbikgeyB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHdhVXJsOyByZXR1cm47IH1cblxuICBmZWNoYXJNb2RhbCgpO1xuICBsaW1wYXJDYXJyaW5obygpO1xufVxuXG4vLyA9PT09PSBMT0dJTiBVSSA9PT09PVxuZnVuY3Rpb24gbWFzY2FyYVRlbGVmb25lKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGVsLnZhbHVlID0gYXBsaWNhck1hc2NhcmFUZWxlZm9uZShlbC52YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGVudHJhckNvbUNsaWVudGUoY2xpZW50ZVJhdzogQ2xpZW50ZSk6IHZvaWQge1xuICBjb25zdCBkb21haW5DbGllbnRlID0gQ2xpZW50ZUVudGl0eS5mcm9tREIoY2xpZW50ZVJhdyk7XG4gIGxvZ2luVXNlQ2FzZS5sb2dpbihkb21haW5DbGllbnRlKTtcblxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5PdmVybGF5JykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGNvbnN0IHVzdWFyaW9CYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb0JhcicpO1xuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4JztcbiAgY29uc3QgdXN1YXJpb05vbWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvTm9tZScpO1xuICBpZiAodXN1YXJpb05vbWVFbCkgdXN1YXJpb05vbWVFbC50ZXh0Q29udGVudCA9IGNsaWVudGVSYXcubm9tZTtcbiAgY29uc3QgdXN1YXJpb1RlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvVGVsJyk7XG4gIGlmICh1c3VhcmlvVGVsKSB1c3VhcmlvVGVsLnRleHRDb250ZW50ID0gY2xpZW50ZVJhdy50ZWxlZm9uZS5yZXBsYWNlKC9eKFxcZHsyfSkoXFxkezV9KShcXGR7NH0pJC8sICcoJDEpICQyLSQzJyk7XG4gIGNvbnN0IGlucE5vbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsO1xuICBpZiAoaW5wTm9tZSkgaW5wTm9tZS52YWx1ZSA9IGNsaWVudGVSYXcubm9tZTtcbiAgY29uc3QgaW5wRW5kZXJlY28gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGlucEVuZGVyZWNvICYmIGNsaWVudGVSYXcuZW5kZXJlY28pIGlucEVuZGVyZWNvLnZhbHVlID0gY2xpZW50ZVJhdy5lbmRlcmVjbztcbn1cblxuZnVuY3Rpb24gaXJQYXJhRXRhcGFDYWRhc3Rybyh0ZWxJbnB1dDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBldGFwYVRlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYVRlbGVmb25lJyk7XG4gIGNvbnN0IGV0YXBhQ2FkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhQ2FkYXN0cm8nKTtcbiAgaWYgKGV0YXBhVGVsKSBldGFwYVRlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBpZiAoZXRhcGFDYWQpIGV0YXBhQ2FkLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB0ZWxJbnB1dC5kYXRhc2V0Wyd0ZWwnXSA9IHRlbElucHV0LnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk5vbWUnKT8uZm9jdXMoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyVGVsZWZvbmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChfdmVyaWZpY2FuZG8pIHJldHVybjtcbiAgY29uc3QgdGVsSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IGVycm8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5FcnJvJyk7XG4gIGlmIChlcnJvKSBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIF92ZXJpZmljYW5kbyA9IHRydWU7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLmV4ZWN1dGUodGVsSW5wdXQudmFsdWUpO1xuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gcmVzdWx0LmVycm9yLm1lc3NhZ2U7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC52YWx1ZS5leGlzdGUgJiYgcmVzdWx0LnZhbHVlLmNsaWVudGUpIHtcbiAgICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLmNsaWVudGUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlyUGFyYUV0YXBhQ2FkYXN0cm8odGVsSW5wdXQpO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBfdmVyaWZpY2FuZG8gPSBmYWxzZTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjYWRhc3RyYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChfY2FkYXN0cmFuZG8pIHJldHVybjtcbiAgY29uc3Qgbm9tZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IHRlbElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCBub21lID0gbm9tZUlucHV0LnZhbHVlO1xuICBjb25zdCB0ZWwgPSB0ZWxJbnB1dC5kYXRhc2V0Wyd0ZWwnXSA/PyB0ZWxJbnB1dC52YWx1ZS5yZXBsYWNlKC9EL2csICcnKTtcbiAgY29uc3QgZXJybyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYWRhc3Ryb0Vycm8nKTtcbiAgaWYgKCFub21lLnRyaW0oKSkge1xuICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSAnRGlnaXRlIHNldSBub21lLic7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGVycm8pIGVycm8uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgX2NhZGFzdHJhbmRvID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBsb2dpblVzZUNhc2UucmVnaXN0ZXIobm9tZSwgdGVsLCAnJyk7XG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSByZXN1bHQuZXJyb3IubWVzc2FnZTsgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbnRyYXJDb21DbGllbnRlKHJlc3VsdC52YWx1ZS50b0pTT04oKSBhcyBDbGllbnRlKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBfY2FkYXN0cmFuZG8gPSBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2b2x0YXJFdGFwYVRlbGVmb25lKCk6IHZvaWQge1xuICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gIGNvbnN0IGV0YXBhVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhVGVsZWZvbmUnKTtcbiAgaWYgKGV0YXBhQ2FkKSBldGFwYUNhZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBpZiAoZXRhcGFUZWwpIGV0YXBhVGVsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufVxuXG5mdW5jdGlvbiBzYWlyKCk6IHZvaWQge1xuICBpZiAoIWNvbmZpcm0oJ0Rlc2VqYSBzYWlyIGRhIHN1YSBjb250YT8nKSkgcmV0dXJuO1xuICBsb2dpblVzZUNhc2UubG9nb3V0KCk7XG4gIGNvbnN0IHVzdWFyaW9CYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb0JhcicpO1xuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9ICcnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWUgPSAnJztcbiAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpblRlbGVmb25lJykgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSAnJztcbiAgY29uc3QgZXRhcGFUZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFUZWxlZm9uZScpO1xuICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIGlmIChldGFwYUNhZCkgZXRhcGFDYWQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luT3ZlcmxheScpIS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xufVxuXG5mdW5jdGlvbiBtb3N0cmFyTG9naW4oKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk92ZXJsYXknKSEuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgc2V0VGltZW91dCgoKSA9PiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KT8uZm9jdXMoKSwgMzAwKTtcbn1cblxuLy8gPT09PT0gSU5JVCA9PT09PVxuZnVuY3Rpb24gaW5pdEZpbHRyb3NUaWNrZXIoKTogdm9pZCB7XG4gIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZmlsdHJvcy13cmFwJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBjb25zdCB0cmFja0VsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRyb3MnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmICghd3JhcCB8fCAhdHJhY2tFbCkgcmV0dXJuO1xuICBjb25zdCB0cmFjazogSFRNTEVsZW1lbnQgPSB0cmFja0VsO1xuXG4gIGxldCBwb3MgPSAwO1xuICBsZXQgYXV0b0RpciA9IC0xO1xuICBjb25zdCBBVVRPX1NQRUVEID0gMC41NTtcbiAgbGV0IGlzQXV0byA9IHRydWU7XG5cbiAgbGV0IGRyYWdnaW5nID0gZmFsc2U7XG4gIGxldCBkcmFnU3RhcnRDbGllbnRYID0gMDtcbiAgbGV0IGRyYWdTdGFydFBvcyA9IDA7XG4gIGxldCB2ZWxTYW1wbGVzOiBudW1iZXJbXSA9IFtdO1xuICBsZXQgcHJldkNsaWVudFggPSAwO1xuICBsZXQgcHJldlRpbWUgPSAwO1xuICBsZXQgaW5lcnRpYVZlbCA9IDA7XG4gIGxldCBpbmVydGlhT24gPSBmYWxzZTtcbiAgbGV0IHJlc3VtZVRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xuXG4gIC8vIExheW91dCBjYWNoZSBcdTIwMTQgYXR1YWxpemFkbyBhcGVuYXMgbm8gcmVzaXplLCBuXHUwMEUzbyBhIGNhZGEgZnJhbWVcbiAgbGV0IGNhY2hlZE1pbiA9IE1hdGgubWluKDAsIHdyYXAuY2xpZW50V2lkdGggLSB0cmFjay5zY3JvbGxXaWR0aCk7XG4gIGNvbnN0IHJvID0gbmV3IFJlc2l6ZU9ic2VydmVyKCgpID0+IHtcbiAgICBjYWNoZWRNaW4gPSBNYXRoLm1pbigwLCB3cmFwLmNsaWVudFdpZHRoIC0gdHJhY2suc2Nyb2xsV2lkdGgpO1xuICB9KTtcbiAgcm8ub2JzZXJ2ZSh3cmFwKTtcbiAgcm8ub2JzZXJ2ZSh0cmFjayk7XG5cbiAgZnVuY3Rpb24gYXBwbHlQb3MobmV3UG9zOiBudW1iZXIpOiB2b2lkIHtcbiAgICBwb3MgPSBuZXdQb3M7XG4gICAgdHJhY2suc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVgoJHtwb3N9cHgpYDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhbmNlbFJlc3VtZSgpOiB2b2lkIHtcbiAgICBpZiAocmVzdW1lVGltZXIgIT09IG51bGwpIHsgY2xlYXJUaW1lb3V0KHJlc3VtZVRpbWVyKTsgcmVzdW1lVGltZXIgPSBudWxsOyB9XG4gIH1cblxuICBmdW5jdGlvbiBzY2hlZHVsZVJlc3VtZShtczogbnVtYmVyKTogdm9pZCB7XG4gICAgY2FuY2VsUmVzdW1lKCk7XG4gICAgcmVzdW1lVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlzQXV0byA9IHRydWU7XG4gICAgICBpbmVydGlhT24gPSBmYWxzZTtcbiAgICAgIGluZXJ0aWFWZWwgPSAwO1xuICAgICAgcmVzdW1lVGltZXIgPSBudWxsO1xuICAgIH0sIG1zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpY2soKTogdm9pZCB7XG4gICAgLy8gUGFyYSBvIGxvb3Agc2UgbyBlbGVtZW50byBmb3IgcmVtb3ZpZG8gZG8gRE9NXG4gICAgaWYgKCFkb2N1bWVudC5jb250YWlucyh3cmFwKSkgeyByby5kaXNjb25uZWN0KCk7IHJldHVybjsgfVxuXG4gICAgaWYgKCFkcmFnZ2luZykge1xuICAgICAgaWYgKGluZXJ0aWFPbikge1xuICAgICAgICBpbmVydGlhVmVsICo9IDAuOTI7XG4gICAgICAgIGNvbnN0IG5leHQgPSBwb3MgKyBpbmVydGlhVmVsO1xuICAgICAgICBpZiAobmV4dCA+IDAgfHwgbmV4dCA8IGNhY2hlZE1pbikge1xuICAgICAgICAgIGFwcGx5UG9zKE1hdGgubWF4KGNhY2hlZE1pbiwgTWF0aC5taW4oMCwgbmV4dCkpKTtcbiAgICAgICAgICBpbmVydGlhT24gPSBmYWxzZTtcbiAgICAgICAgICBpbmVydGlhVmVsID0gMDtcbiAgICAgICAgICBzY2hlZHVsZVJlc3VtZSg2MDApO1xuICAgICAgICB9IGVsc2UgaWYgKE1hdGguYWJzKGluZXJ0aWFWZWwpIDwgMC4xNSkge1xuICAgICAgICAgIGluZXJ0aWFPbiA9IGZhbHNlO1xuICAgICAgICAgIGluZXJ0aWFWZWwgPSAwO1xuICAgICAgICAgIHNjaGVkdWxlUmVzdW1lKDE1MDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFwcGx5UG9zKG5leHQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzQXV0byAmJiBjYWNoZWRNaW4gPCAtMSkge1xuICAgICAgICBjb25zdCBuZXh0ID0gcG9zICsgQVVUT19TUEVFRCAqIGF1dG9EaXI7XG4gICAgICAgIGlmIChuZXh0IDw9IGNhY2hlZE1pbikgeyBhcHBseVBvcyhjYWNoZWRNaW4pOyBhdXRvRGlyID0gMTsgfVxuICAgICAgICBlbHNlIGlmIChuZXh0ID49IDApIHsgYXBwbHlQb3MoMCk7IGF1dG9EaXIgPSAtMTsgfVxuICAgICAgICBlbHNlIGFwcGx5UG9zKG5leHQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gIH1cblxuICB3cmFwLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgKGU6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgIGRyYWdnaW5nID0gdHJ1ZTtcbiAgICBpc0F1dG8gPSBmYWxzZTtcbiAgICBpbmVydGlhT24gPSBmYWxzZTtcbiAgICBpbmVydGlhVmVsID0gMDtcbiAgICBjYW5jZWxSZXN1bWUoKTtcbiAgICBkcmFnU3RhcnRDbGllbnRYID0gZS5jbGllbnRYO1xuICAgIGRyYWdTdGFydFBvcyA9IHBvcztcbiAgICB2ZWxTYW1wbGVzID0gW107XG4gICAgcHJldkNsaWVudFggPSBlLmNsaWVudFg7XG4gICAgcHJldlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICB3cmFwLnN0eWxlLmN1cnNvciA9ICdncmFiYmluZyc7XG4gICAgd3JhcC5zZXRQb2ludGVyQ2FwdHVyZShlLnBvaW50ZXJJZCk7IC8vIG1hbnRcdTAwRTltIGV2ZW50b3MgbWVzbW8gZm9yYSBkbyBlbGVtZW50b1xuICB9LCB7IHBhc3NpdmU6IHRydWUgfSk7XG5cbiAgd3JhcC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIChlOiBQb2ludGVyRXZlbnQpID0+IHtcbiAgICBpZiAoIWRyYWdnaW5nKSByZXR1cm47XG4gICAgY29uc3QgZHggPSBlLmNsaWVudFggLSBkcmFnU3RhcnRDbGllbnRYO1xuICAgIGxldCBuZXdQb3MgPSBkcmFnU3RhcnRQb3MgKyBkeDtcbiAgICAvLyBydWJiZXIgYmFuZCBuYXMgYm9yZGFzXG4gICAgaWYgKG5ld1BvcyA+IDApIG5ld1BvcyA9IG5ld1BvcyAqIDAuMjU7XG4gICAgaWYgKG5ld1BvcyA8IGNhY2hlZE1pbikgbmV3UG9zID0gY2FjaGVkTWluICsgKG5ld1BvcyAtIGNhY2hlZE1pbikgKiAwLjI1O1xuICAgIGFwcGx5UG9zKG5ld1Bvcyk7XG5cbiAgICBjb25zdCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICBjb25zdCBkdCA9IG5vdyAtIHByZXZUaW1lO1xuICAgIGlmIChkdCA+IDAgJiYgZHQgPCA4MCkge1xuICAgICAgdmVsU2FtcGxlcy5wdXNoKChlLmNsaWVudFggLSBwcmV2Q2xpZW50WCkgKiAxNiAvIGR0KTtcbiAgICAgIGlmICh2ZWxTYW1wbGVzLmxlbmd0aCA+IDYpIHZlbFNhbXBsZXMuc2hpZnQoKTtcbiAgICB9XG4gICAgcHJldkNsaWVudFggPSBlLmNsaWVudFg7XG4gICAgcHJldlRpbWUgPSBub3c7XG4gIH0sIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcblxuICBjb25zdCBvblJlbGVhc2UgPSAoKTogdm9pZCA9PiB7XG4gICAgaWYgKCFkcmFnZ2luZykgcmV0dXJuO1xuICAgIGRyYWdnaW5nID0gZmFsc2U7XG4gICAgd3JhcC5zdHlsZS5jdXJzb3IgPSAnJztcblxuICAgIGlmIChwb3MgPiAwIHx8IHBvcyA8IGNhY2hlZE1pbikge1xuICAgICAgYXBwbHlQb3MoTWF0aC5tYXgoY2FjaGVkTWluLCBNYXRoLm1pbigwLCBwb3MpKSk7XG4gICAgICBzY2hlZHVsZVJlc3VtZSg2MDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGF2Z1ZlbCA9IHZlbFNhbXBsZXMubGVuZ3RoID4gMFxuICAgICAgPyB2ZWxTYW1wbGVzLnNsaWNlKC0zKS5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIE1hdGgubWluKDMsIHZlbFNhbXBsZXMubGVuZ3RoKVxuICAgICAgOiAwO1xuXG4gICAgaWYgKE1hdGguYWJzKGF2Z1ZlbCkgPiAwLjQpIHtcbiAgICAgIGluZXJ0aWFWZWwgPSBhdmdWZWw7XG4gICAgICBpbmVydGlhT24gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY2hlZHVsZVJlc3VtZSgyMDAwKTtcbiAgICB9XG4gIH07XG5cbiAgd3JhcC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCAgICAgb25SZWxlYXNlKTtcbiAgd3JhcC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgb25SZWxlYXNlKTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spKTtcbn1cblxuKGZ1bmN0aW9uIGluaXQoKTogdm9pZCB7XG4gIGNvbnN0IGNsaWVudGVTZXNzYW8gPSBsb2dpblVzZUNhc2UucmVzdG9yZVNlc3Npb24oKTtcbiAgaWYgKGNsaWVudGVTZXNzYW8pIHsgZW50cmFyQ29tQ2xpZW50ZShjbGllbnRlU2Vzc2FvLnRvSlNPTigpIGFzIENsaWVudGUpOyByZXR1cm47IH1cbiAgbW9zdHJhckxvZ2luKCk7XG59KSgpO1xuXG5pbml0RmlsdHJvc1RpY2tlcigpO1xuXG4vLyBQV0Egc2VydmljZSB3b3JrZXJcbmlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XG4gIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCdzdy5qcycpLmNhdGNoKCgpID0+IHt9KTtcbn1cblxuLy8gRmVjaGFyIG1vZGFpcyBjb20gRXNjYXBlXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykge1xuICAgIGZlY2hhckRpYWxvZygpO1xuICAgIGZlY2hhck1vZGFsKCk7XG4gICAgZmVjaGFyRGlhbG9nQm9sbygpO1xuICB9XG59KTtcblxuLy8gPT09PT0gRVhQT1IgUEFSQSBIVE1MIChvbmNsaWNrPVwiLi4uXCIpID09PT09XG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIGZpbHRyYXI6IHR5cGVvZiBmaWx0cmFyO1xuICAgIHBlZGlyUHJvZHV0bzogdHlwZW9mIHBlZGlyUHJvZHV0bztcbiAgICBhYnJpckRpYWxvZzogdHlwZW9mIGFicmlyRGlhbG9nO1xuICAgIGZlY2hhckRpYWxvZzogdHlwZW9mIGZlY2hhckRpYWxvZztcbiAgICBmZWNoYXJEaWFsb2dCYWNrZHJvcDogdHlwZW9mIGZlY2hhckRpYWxvZ0JhY2tkcm9wO1xuICAgIGlyUGFyYUZpbmFsaXphcjogdHlwZW9mIGlyUGFyYUZpbmFsaXphcjtcbiAgICBhYnJpck1vZGFsOiB0eXBlb2YgYWJyaXJNb2RhbDtcbiAgICBmZWNoYXJNb2RhbDogdHlwZW9mIGZlY2hhck1vZGFsO1xuICAgIGZlY2hhck1vZGFsQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJNb2RhbEJhY2tkcm9wO1xuICAgIHJlbW92ZXJEb0NhcnJpbmhvOiB0eXBlb2YgcmVtb3ZlckRvQ2FycmluaG87XG4gICAgc2VsZWNpb25hclBhZ2FtZW50bzogdHlwZW9mIHNlbGVjaW9uYXJQYWdhbWVudG87XG4gICAgZmluYWxpemFyUGVkaWRvOiB0eXBlb2YgZmluYWxpemFyUGVkaWRvO1xuICAgIHBlZGlyQm9sb0Zvcm1hOiB0eXBlb2YgcGVkaXJCb2xvRm9ybWE7XG4gICAgYWJyaXJEaWFsb2dCb2xvOiB0eXBlb2YgYWJyaXJEaWFsb2dCb2xvO1xuICAgIGZlY2hhckRpYWxvZ0JvbG86IHR5cGVvZiBmZWNoYXJEaWFsb2dCb2xvO1xuICAgIGNhcm91c2VsTmV4dDogdHlwZW9mIGNhcm91c2VsTmV4dDtcbiAgICBjYXJvdXNlbFByZXY6IHR5cGVvZiBjYXJvdXNlbFByZXY7XG4gICAgbWFzY2FyYVRlbGVmb25lOiB0eXBlb2YgbWFzY2FyYVRlbGVmb25lO1xuICAgIHZlcmlmaWNhclRlbGVmb25lOiB0eXBlb2YgdmVyaWZpY2FyVGVsZWZvbmU7XG4gICAgY2FkYXN0cmFyOiB0eXBlb2YgY2FkYXN0cmFyO1xuICAgIHZvbHRhckV0YXBhVGVsZWZvbmU6IHR5cGVvZiB2b2x0YXJFdGFwYVRlbGVmb25lO1xuICAgIHNhaXI6IHR5cGVvZiBzYWlyO1xuICB9XG59XG5cbk9iamVjdC5hc3NpZ24od2luZG93LCB7XG4gIGZpbHRyYXIsXG4gIHBlZGlyUHJvZHV0byxcbiAgYWJyaXJEaWFsb2csXG4gIGZlY2hhckRpYWxvZyxcbiAgZmVjaGFyRGlhbG9nQmFja2Ryb3AsXG4gIGlyUGFyYUZpbmFsaXphcixcbiAgYWJyaXJNb2RhbCxcbiAgZmVjaGFyTW9kYWwsXG4gIGZlY2hhck1vZGFsQmFja2Ryb3AsXG4gIHJlbW92ZXJEb0NhcnJpbmhvLFxuICBzZWxlY2lvbmFyUGFnYW1lbnRvLFxuICBmaW5hbGl6YXJQZWRpZG8sXG4gIHBlZGlyQm9sb0Zvcm1hLFxuICBhYnJpckRpYWxvZ0JvbG8sXG4gIGZlY2hhckRpYWxvZ0JvbG8sXG4gIGNhcm91c2VsTmV4dCxcbiAgY2Fyb3VzZWxQcmV2LFxuICBtYXNjYXJhVGVsZWZvbmUsXG4gIHZlcmlmaWNhclRlbGVmb25lLFxuICBjYWRhc3RyYXIsXG4gIHZvbHRhckV0YXBhVGVsZWZvbmUsXG4gIHNhaXIsXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQU8sV0FBUyxRQUFRLEdBQW9CO0FBQzFDLFdBQU8sT0FBTyxDQUFDLEVBQ1osUUFBUSxNQUFNLE9BQU8sRUFDckIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLFFBQVEsRUFDdEIsUUFBUSxNQUFNLE9BQU87QUFBQSxFQUMxQjs7O0FDUE8sV0FBUyxjQUFjLE9BQXVCO0FBQ25ELFdBQU8sUUFBUSxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsS0FBSyxHQUFHO0FBQUEsRUFDbEQ7QUFFTyxXQUFTLHVCQUF1QixPQUF1QjtBQUM1RCxVQUFNLElBQUksTUFBTSxRQUFRLE9BQU8sRUFBRSxFQUFFLE1BQU0sR0FBRyxFQUFFO0FBQzlDLFFBQUksRUFBRSxVQUFVLEVBQUcsUUFBTztBQUMxQixRQUFJLEVBQUUsVUFBVSxFQUFHLFFBQU8sSUFBSSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzFELFFBQUksRUFBRSxVQUFVLEdBQUksUUFBTyxJQUFJLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDNUUsV0FBTyxJQUFJLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxH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
