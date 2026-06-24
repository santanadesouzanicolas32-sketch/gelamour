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
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };

  // src/utils/toast.ts
  function mostrarToast(msg, tipo = "info") {
    const old = document.getElementById("_toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.id = "_toast";
    t.textContent = msg;
    const bg = tipo === "erro" ? "#ef4444" : tipo === "ok" ? "#22c55e" : "#4A2C17";
    Object.assign(t.style, {
      position: "fixed",
      bottom: "90px",
      left: "50%",
      transform: "translateX(-50%)",
      background: bg,
      color: "#fff",
      padding: "12px 22px",
      borderRadius: "30px",
      fontSize: "14px",
      fontWeight: "600",
      zIndex: "99999",
      boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
      maxWidth: "90vw",
      textAlign: "center",
      transition: "opacity .3s",
      opacity: "1",
      fontFamily: "'DM Sans', sans-serif"
    });
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 350);
    }, 3500);
  }

  // src/utils/security.ts
  function escHTML(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // src/utils/format.ts
  function formatarMoeda(valor) {
    return "R$ " + valor.toFixed(2).replace(".", ",");
  }
  function getSemanaAtual() {
    const now = /* @__PURE__ */ new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 864e5);
    const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
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
  var NetworkError = class extends AppError {
    constructor(message, context) {
      super(message, "NETWORK_ERROR", 503, context);
      this.name = "NetworkError";
    }
  };
  var RateLimitError = class extends AppError {
    constructor(retryAfterMs) {
      super(`Muitas tentativas. Aguarde ${Math.ceil(retryAfterMs / 1e3)}s.`, "RATE_LIMIT", 429, { retryAfterMs });
      this.name = "RateLimitError";
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

  // src/infrastructure/supabase/client.ts
  var SUPABASE_URL = atob("aHR0cHM6Ly9yZmJ0ZHR2c25mdHliYXpmbWRidy5zdXBhYmFzZS5jbw==");
  var SUPABASE_ANON = atob("ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5KbVluUmtkSFZ6Ym1aMGVXSmhlbVp0WkdKM0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT0RFNU1UQXpOakFzSW1WNGNDSTZNakE1TnpRNE5qTTJNSDAuSHc2OGpRRkZtd0xndndGOXpqaGdWV1BjM0QxUTJwZmdBbjFUUWxKRVZ1NA==");
  var TIMEOUT_MS = 1e4;
  async function supabaseFetch(path, opts = {}) {
    var _b;
    const _a = opts, { timeout = TIMEOUT_MS } = _a, fetchOpts = __objRest(_a, ["timeout"]);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const headers = __spreadValues({
        "apikey": SUPABASE_ANON,
        "Authorization": `Bearer ${SUPABASE_ANON}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      }, (_b = fetchOpts.headers) != null ? _b : {});
      return await fetch(`${SUPABASE_URL}${path}`, __spreadProps(__spreadValues({}, fetchOpts), {
        headers,
        signal: controller.signal
      }));
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new NetworkError("Timeout: servidor n\xE3o respondeu", { path });
      }
      throw new NetworkError("Erro de rede", { path, cause: String(e) });
    } finally {
      clearTimeout(timer);
    }
  }
  async function supabaseGet(table, query = "") {
    const resp = await supabaseFetch(`/rest/v1/${table}${query ? "?" + query : ""}`);
    if (!resp.ok) throw new NetworkError(`GET ${table} falhou`, { status: resp.status });
    return resp.json();
  }
  async function supabasePost(table, data) {
    const resp = await supabaseFetch(`/rest/v1/${table}`, {
      method: "POST",
      body: JSON.stringify(data)
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new NetworkError(`POST ${table} falhou`, { status: resp.status, body });
    }
    const rows = await resp.json();
    return rows[0];
  }
  async function supabasePatch(table, query, data) {
    const resp = await supabaseFetch(`/rest/v1/${table}?${query}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new NetworkError(`PATCH ${table} falhou`, { status: resp.status, body });
    }
    return resp.json();
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

  // src/infrastructure/supabase/ClienteRepository.ts
  var log = logger.child("ClienteRepo");
  var ClienteRepository = class {
    async findByTelefone(telefone) {
      return tryAsync(async () => {
        log.debug("findByTelefone", { telefone: `***${telefone.slice(-4)}` });
        const rows = await supabaseGet(
          "clientes",
          `telefone=eq.${telefone}&limit=1`
        );
        return rows[0] ? Cliente.fromDB(rows[0]) : null;
      });
    }
    async save(cliente) {
      return tryAsync(async () => {
        const row = await supabasePost(
          "clientes",
          cliente.toJSON()
        );
        return Cliente.fromDB(row);
      });
    }
    async updateEndereco(id, endereco) {
      return tryAsync(async () => {
        await supabasePatch("clientes", `id=eq.${id}`, { endereco });
      });
    }
  };

  // src/domain/pedido.ts
  var Pedido = class _Pedido {
    constructor(props) {
      this.props = props;
    }
    static create(props) {
      if (!props.itens.length) throw new ValidationError("Pedido deve ter ao menos 1 item");
      if (!props.nome.trim()) throw new ValidationError("Nome obrigat\xF3rio");
      if (!props.endereco.trim()) throw new ValidationError("Endere\xE7o obrigat\xF3rio");
      const total = props.itens.reduce((s, i) => Math.round((s + i.preco) * 100) / 100, 0);
      return new _Pedido(__spreadProps(__spreadValues({}, props), { total, status: "pendente" }));
    }
    static fromDB(raw) {
      return new _Pedido(raw);
    }
    get id() {
      return this.props.id;
    }
    get total() {
      return this.props.total;
    }
    get itens() {
      return this.props.itens;
    }
    get pagamento() {
      return this.props.pagamento;
    }
    get statusPagamento() {
      return this.props.status_pagamento;
    }
    formatarMensagemWA(waNumber) {
      const itensStr = this.props.itens.map(
        (i) => `\u25B8 ${i.nome} \u2014 R$ ${i.preco.toFixed(2).replace(".", ",")}`
      ).join("\n");
      const msg = [
        "\u{1F6CD}\uFE0F *NOVO PEDIDO \u2014 GELAMOUR*",
        "",
        itensStr,
        "",
        `*Total: R$ ${this.props.total.toFixed(2).replace(".", ",")}*`,
        `*Pagamento: ${this.props.pagamento}*`,
        "",
        `\u{1F464} ${this.props.nome}`,
        `\u{1F4CD} ${this.props.endereco}`,
        this.props.observacao ? `\u{1F4DD} ${this.props.observacao}` : ""
      ].filter(Boolean).join("\n");
      return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
    }
    toJSON() {
      return __spreadValues({}, this.props);
    }
  };

  // src/infrastructure/supabase/PedidoRepository.ts
  var log2 = logger.child("PedidoRepo");
  var PedidoRepository = class {
    async save(pedido) {
      return tryAsync(async () => {
        var _a;
        log2.info("Salvando pedido", { total: pedido.total });
        const resp = await supabaseFetch(`/rest/v1/pedidos`, {
          method: "POST",
          headers: { "Prefer": "return=headers-only" },
          body: JSON.stringify(pedido.toJSON())
        });
        if (!resp.ok) {
          const body = await resp.text();
          throw new NetworkError(`POST pedidos falhou`, { status: resp.status, body });
        }
        const loc = (_a = resp.headers.get("Location")) != null ? _a : "";
        const idMatch = loc.match(/id=eq\.(\d+)/);
        if (!idMatch) throw new NetworkError("ID do pedido n\xE3o retornado");
        const id = parseInt(idMatch[1], 10);
        return Pedido.fromDB(__spreadProps(__spreadValues({}, pedido.toJSON()), { id }));
      });
    }
    async updateStatus(id, clienteId, status) {
      return tryAsync(async () => {
        await supabasePatch(
          "pedidos",
          `id=eq.${id}&cliente_id=eq.${clienteId}`,
          { status }
        );
      });
    }
    async findById(id) {
      return tryAsync(async () => {
        const resp = await fetch(
          `${SUPABASE_URL}/rest/v1/pedidos?id=eq.${id}&select=status_pagamento`,
          { headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` } }
        );
        if (!resp.ok) throw new NetworkError("GET pedido falhou", { status: resp.status });
        const rows = await resp.json();
        return rows[0] ? Pedido.fromDB(rows[0]) : null;
      });
    }
  };

  // src/infrastructure/supabase/RoletaRepository.ts
  var log3 = logger.child("RoletaRepo");
  var RoletaRepository = class {
    async findParticipacaoAtiva(telefone, semana) {
      return tryAsync(async () => {
        var _a;
        log3.debug("findParticipacaoAtiva", { semana });
        const rows = await supabaseGet(
          "roleta_participacoes",
          `telefone=eq.${telefone}&semana=eq.${semana}&order=created_at.desc&limit=1`
        );
        return (_a = rows[0]) != null ? _a : null;
      });
    }
    async saveParticipacao(data) {
      if (data.id !== void 0) {
        return tryAsync(async () => {
          var _b;
          const _a = data, { id } = _a, patch = __objRest(_a, ["id"]);
          const rows = await supabasePatch(
            "roleta_participacoes",
            `id=eq.${id}`,
            patch
          );
          return (_b = rows[0]) != null ? _b : __spreadValues({}, data);
        });
      }
      return tryAsync(
        () => supabasePost("roleta_participacoes", data)
      );
    }
    async countVencedoresSemana(semana) {
      return tryAsync(async () => {
        const rows = await supabaseGet(
          "roleta_vencedores",
          `semana=eq.${semana}&select=id`
        );
        return rows.length;
      });
    }
    async saveVencedor(telefone, nome, premio, semana) {
      return tryAsync(async () => {
        await supabasePost("roleta_vencedores", { telefone, nome, premio, semana });
      });
    }
  };

  // src/core/events.ts
  var TypedEventBus = class {
    constructor() {
      this.handlers = /* @__PURE__ */ new Map();
    }
    on(event, handler) {
      if (!this.handlers.has(event)) this.handlers.set(event, /* @__PURE__ */ new Set());
      this.handlers.get(event).add(handler);
      return () => {
        var _a;
        return (_a = this.handlers.get(event)) == null ? void 0 : _a.delete(handler);
      };
    }
    emit(event, payload) {
      var _a;
      (_a = this.handlers.get(event)) == null ? void 0 : _a.forEach((h) => {
        try {
          h(payload);
        } catch (e) {
          console.error(`EventBus error on ${event}:`, e);
        }
      });
    }
    once(event, handler) {
      const unsub = this.on(event, (payload) => {
        handler(payload);
        unsub();
      });
    }
  };
  var eventBus = new TypedEventBus();

  // src/state/Store.ts
  var Store = class {
    constructor(initialState) {
      this.listeners = /* @__PURE__ */ new Map();
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
  var ADMIN_TEL = atob("MTE5NDA3NzI3NTA=");
  var CONTA_TESTE = atob("MTE5NjUwMzAwNzY=");
  function calcIsAdmin(cliente) {
    return !!cliente && cliente.telefone === ADMIN_TEL;
  }
  function isContaTeste(cliente) {
    return !!cliente && cliente.telefone === CONTA_TESTE;
  }
  var appStore = new Store({
    cliente: null,
    isLoggedIn: false,
    isAdmin: false,
    carrinhoCount: 0,
    carrinhoTotal: 0,
    pagamentoSelecionado: "",
    pedidoIdPendente: null,
    pixData: null,
    roletaAtiva: false
  });
  function setCliente(cliente) {
    appStore.setState({
      cliente,
      isLoggedIn: !!cliente,
      isAdmin: calcIsAdmin(cliente)
    });
  }
  function setCarrinho(count, total) {
    appStore.setState({ carrinhoCount: count, carrinhoTotal: total });
  }

  // src/application/auth/LoginUseCase.ts
  var log4 = logger.child("LoginUseCase");
  var SESSION_KEY = "gelamour_cliente";
  var SESSION_TS_KEY = "gelamour_ts";
  var SESSION_TTL_MS = 24 * 60 * 60 * 1e3;
  var LoginUseCase = class {
    constructor(clienteRepo) {
      this.clienteRepo = clienteRepo;
      this.rateLimiter = { attempts: 0, blockedUntil: 0 };
    }
    restoreSession() {
      var _a;
      try {
        const ts = Number((_a = sessionStorage.getItem(SESSION_TS_KEY)) != null ? _a : "0");
        if (Date.now() - ts > SESSION_TTL_MS) {
          this.clearSession();
          return null;
        }
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        const cliente = Cliente.fromDB(data);
        setCliente(cliente);
        return cliente;
      } catch (e) {
        this.clearSession();
        return null;
      }
    }
    async execute(telefone) {
      var _a;
      if (Date.now() < this.rateLimiter.blockedUntil) {
        return fail(new RateLimitError(this.rateLimiter.blockedUntil - Date.now()));
      }
      const tel = telefone.replace(/\D/g, "");
      if (tel.length < 10) return fail(new ValidationError("Telefone inv\xE1lido"));
      log4.info("Verificando telefone", { tel: `***${tel.slice(-4)}` });
      const result = await this.clienteRepo.findByTelefone(tel);
      if (!result.ok) {
        this.rateLimiter.attempts++;
        if (this.rateLimiter.attempts >= 5) {
          this.rateLimiter.blockedUntil = Date.now() + 6e4;
          this.rateLimiter.attempts = 0;
          return fail(new RateLimitError(6e4));
        }
        return fail(result.error);
      }
      this.rateLimiter.attempts = 0;
      return ok({ existe: !!result.value, cliente: (_a = result.value) != null ? _a : void 0 });
    }
    async register(nome, telefone, endereco) {
      return tryAsync(async () => {
        const entity = Cliente.create({ nome, telefone, endereco });
        const saved = await this.clienteRepo.save(entity);
        if (!saved.ok) throw saved.error;
        return saved.value;
      });
    }
    login(cliente) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(cliente.toJSON()));
      sessionStorage.setItem(SESSION_TS_KEY, String(Date.now()));
      setCliente(cliente);
      eventBus.emit("auth:login", { cliente });
      log4.info("Login realizado", { id: cliente.id });
    }
    logout() {
      this.clearSession();
      setCliente(null);
      eventBus.emit("auth:logout", void 0);
      log4.info("Logout realizado");
    }
    clearSession() {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_TS_KEY);
    }
  };

  // src/application/cart/CartService.ts
  var log5 = logger.child("CartService");
  var CartService = class {
    constructor() {
      this.items = /* @__PURE__ */ new Map();
    }
    add(nome, preco) {
      if (this.items.has(nome)) return;
      this.items.set(nome, { nome, preco: Number(preco) });
      this.notify();
      log5.debug("Item adicionado", { nome });
    }
    remove(nome) {
      if (!this.items.has(nome)) return;
      this.items.delete(nome);
      this.notify();
      log5.debug("Item removido", { nome });
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
          log5.warn("Pre\xE7o revalidado", { nome: key, old: item.preco, new: realPrice });
        }
      });
      if (changed) this.notify();
    }
    notify() {
      setCarrinho(this.getCount(), this.getTotal());
      eventBus.emit("cart:updated", { count: this.getCount(), total: this.getTotal() });
    }
  };

  // src/container.ts
  var clienteRepository = new ClienteRepository();
  var pedidoRepository = new PedidoRepository();
  var roletaRepository = new RoletaRepository();
  var loginUseCase = new LoginUseCase(clienteRepository);
  var cartService = new CartService();

  // src/modules/roleta.ts
  var PREMIOS_PADRAO = [
    "\u{1F381} 5% OFF \u2014 Compras acima de R$35",
    "\u{1F36B} Brownie Tradicional Gr\xE1tis \u2014 Compras acima de R$50",
    "\u{1F381} 10% OFF \u2014 Compras acima de R$50",
    "\u{1F4F8} Siga a Gelamour no Instagram",
    "\u{1F6CD}\uFE0F Compre 2 e Leve \u2014 At\xE9 R$14 em produtos",
    "\u{1F615} N\xE3o Foi Dessa Vez \u2014 Ganha 5% OFF acima de R$35"
  ];
  var _premios = [...PREMIOS_PADRAO];
  var _rotacaoAtual = 0;
  var _girando = false;
  var _participacaoId = null;
  function getPremiosPadrao() {
    return PREMIOS_PADRAO;
  }
  function getPremios() {
    return _premios;
  }
  function setPremios(p) {
    _premios = p;
  }
  function setParticipacaoId(id) {
    _participacaoId = id;
  }
  async function carregarConfig() {
    var _a;
    try {
      const rows = await supabaseGet("roleta_config", "id=eq.1&limit=1");
      if (rows[0]) {
        _premios = Array.isArray(rows[0].premios) ? rows[0].premios : PREMIOS_PADRAO;
      }
      return (_a = rows[0]) != null ? _a : null;
    } catch (e) {
      return null;
    }
  }
  async function verificarStatus(clienteId) {
    const semana = getSemanaAtual();
    const result = await roletaRepository.findParticipacaoAtiva(String(clienteId), semana);
    if (!result.ok) return null;
    if (result.value) _participacaoId = result.value.id;
    return result.value;
  }
  async function girar(cliente, onResultado) {
    if (_girando) return;
    const state = appStore.getState();
    if (!isContaTeste(state.cliente)) {
      mostrarToast("\u{1F6A7} Roleta em breve! Estamos finalizando os \xFAltimos detalhes. \u{1F3A1}", "info");
      return;
    }
    _girando = true;
    const btn = document.getElementById("roletaGirarBtn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Girando...";
    }
    const n = _premios.length;
    const arc = 360 / n;
    const indice = Math.floor(Math.random() * n);
    const voltasExtras = 5 + Math.floor(Math.random() * 5);
    const anguloAlvo = voltasExtras * 360 + (360 - arc * indice - arc / 2);
    const rotacaoFinal = _rotacaoAtual + anguloAlvo;
    const roda = document.getElementById("roletaRoda");
    if (roda) {
      roda.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 1)";
      roda.style.transformOrigin = "200px 200px";
      roda.style.transform = `rotate(${rotacaoFinal}deg)`;
    }
    _rotacaoAtual = (rotacaoFinal % 360 + 360) % 360;
    await new Promise((resolve) => setTimeout(resolve, 4200));
    const premio = _premios[indice];
    _girando = false;
    onResultado(premio, indice);
    if (isContaTeste(state.cliente) && btn) {
      btn.disabled = false;
      btn.textContent = "\u{1F3A1} GIRAR AGORA!";
    }
  }
  async function salvarVencedor(cliente, premio) {
    if (isContaTeste(appStore.getState().cliente)) return;
    if (!_participacaoId) return;
    const semana = getSemanaAtual();
    const patchResult = await roletaRepository.saveParticipacao({
      id: _participacaoId,
      ja_girou: true,
      premio
    });
    if (!patchResult.ok) {
      console.error("Erro ao atualizar participa\xE7\xE3o:", patchResult.error);
      return;
    }
    const vencedorResult = await roletaRepository.saveVencedor(
      cliente.telefone,
      cliente.nome,
      premio,
      semana
    );
    if (!vencedorResult.ok) {
      console.error("Erro ao salvar vencedor:", vencedorResult.error);
    }
  }
  function desenharRoleta(premios) {
    const wrap = document.querySelector(".roleta-pointer-wrap");
    if (!wrap) return;
    const old = document.getElementById("roletaCanvas");
    if (old) old.remove();
    const N = premios.length;
    const CX = 200, CY = 200, R = 164, R_LED = 182, R_OUTER = 196;
    const SEG = 360 / N;
    const CORES = [
      { bg: "#FAF0F2", txt: "#B5134F" },
      { bg: "#E8528A", txt: "#FFFFFF" }
    ];
    const rad = (d) => d * Math.PI / 180;
    const pt = (d, r) => [CX + r * Math.cos(rad(d)), CY + r * Math.sin(rad(d))];
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    function segPath(i) {
      const s = SEG * i - 90, e = s + SEG;
      const [x1, y1] = pt(s, R), [x2, y2] = pt(e, R);
      return `M${CX},${CY} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
    }
    function wrapWords(text, maxChars) {
      const words = text.split(" ");
      const lines = [];
      let cur = "";
      words.forEach((w) => {
        const test = cur ? `${cur} ${w}` : w;
        if (test.length > maxChars && cur) {
          lines.push(cur);
          cur = w;
        } else cur = test;
      });
      if (cur) lines.push(cur);
      return lines.slice(0, 3);
    }
    const segs = premios.map((_, i) => {
      const c = CORES[i % 2];
      return `<path d="${segPath(i)}" fill="${c.bg}" stroke="#D4AF37" stroke-width="2" shape-rendering="geometricPrecision"/>`;
    }).join("");
    const spokes = premios.map((_, i) => {
      const d = SEG * i - 90;
      const [x, y] = pt(d, R);
      return `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#D4AF37" stroke-width="2"/>`;
    }).join("");
    const texts = premios.map((p, i) => {
      const mid = SEG * i - 90 + SEG / 2;
      const [tx, ty] = pt(mid, R * 0.57);
      const c = CORES[i % 2];
      const m = p.match(/^(\S+)\s+(.+)$/);
      const emoji = m ? m[1] : "";
      const rest = m ? m[2] : p;
      const lines = wrapWords(rest, 13);
      const lineH = 11.5;
      const totalTxtH = lines.length * lineH;
      const emojiY = -(totalTxtH / 2) - 11;
      const rot = (mid + 90).toFixed(1);
      return `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) rotate(${rot})" text-rendering="geometricPrecision">
  <text x="0" y="${emojiY.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="15" font-family="serif">${esc(emoji)}</text>
  ${lines.map((l, li) => {
        const yp = ((li - (lines.length - 1) / 2) * lineH).toFixed(1);
        return `<text x="0" y="${yp}" text-anchor="middle" dominant-baseline="middle" fill="${c.txt}" font-family="'DM Sans',Arial,sans-serif" font-weight="700" font-size="9">${esc(l)}</text>`;
      }).join("\n  ")}
</g>`;
    }).join("");
    const LED_N = 30;
    const leds = Array.from({ length: LED_N }, (_, i) => {
      const [lx, ly] = pt(360 / LED_N * i - 90, R_LED);
      return `<circle cx="${lx.toFixed(2)}" cy="${ly.toFixed(2)}" r="5.5" class="r-led r-led-${i % 2}"/>`;
    }).join("");
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
  <g id="roletaRoda">${segs}${spokes}${texts}</g>
  <circle cx="${CX}" cy="${CY}" r="${R + 1}" fill="none" stroke="#D4AF37" stroke-width="3"/>
  ${leds}
  <circle cx="${CX}" cy="${CY}" r="42" fill="url(#rg-ctr)" stroke="#FFF" stroke-width="3.5" filter="url(#f-glow)"/>
  <circle cx="${CX}" cy="${CY}" r="38" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
  <text x="${CX}" y="${CY - 7}" text-anchor="middle" dominant-baseline="middle" fill="#FFF" font-family="'DM Sans',Arial,sans-serif" font-weight="800" font-size="12" letter-spacing="1.5" text-rendering="geometricPrecision">GIRAR</text>
  <text x="${CX}" y="${CY + 9}" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,.85)" font-family="serif" font-size="11">\u2605 \u2605 \u2605</text>
</svg>`;
    const div = document.createElement("div");
    div.innerHTML = svg;
    wrap.insertBefore(div.firstElementChild, wrap.firstChild);
  }

  // src/modules/cart.ts
  function getItens() {
    return Array.from(cartService.getItems());
  }
  function getTotal() {
    return cartService.getTotal();
  }
  function isBoloForma(nome) {
    const BOLO_FORMA_NOMES = ["Bolo na forma Milho natural", "Bolo na forma Cenoura com chocolate e Granule"];
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
  var log6 = logger.child("main");
  var WA_NUMBER = atob("NTUxMTk0MDc3Mjc1MA==");
  var EDGE_URL = `${SUPABASE_URL}/functions/v1`;
  var _pixPayload = "";
  var _pixPollTimer = null;
  var _pixPedidoId = null;
  var _pixMsgWA = "";
  var _pixTotal = 0;
  var _pixNome = "";
  var _pixItens = [];
  var _pixEndereco = "";
  var _cardTipo = "credito";
  var _verificando = false;
  var _cadastrando = false;
  function getClienteAtual() {
    return appStore.getState().cliente;
  }
  function filtrar(cat, btn) {
    document.querySelectorAll(".filtro-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
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
  function agendarBoloWhatsApp() {
    const itensForma = cartService.getItems().filter((i) => isBoloForma(i.nome));
    let linhas = "";
    let total = 0;
    itensForma.forEach((i) => {
      linhas += "\u2022 " + i.nome + " \u2014 R$ " + i.preco.toFixed(2).replace(".", ",") + "\n";
      total = Math.round((total + i.preco) * 100) / 100;
    });
    const msg = "*\u{1F382} AGENDAMENTO - BOLO NA FORMA - GELAMOUR*\n\nOl\xE1! Gostaria de agendar o(s) seguinte(s) bolo(s):\n\n" + linhas + "\n*\u{1F4B0} Total:* R$ " + total.toFixed(2).replace(".", ",") + "\n\n\u23F0 Sei que o prazo \xE9 de 5 horas a 1 dia \xFAtil. Por favor me informe a data e hor\xE1rio dispon\xEDveis para entrega. \u{1F60A}";
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
    fecharDialogBolo();
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
  async function finalizarPedido() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const itens = cartService.getItems();
    const temFormaFin = itens.some((i) => isBoloForma(i.nome));
    const temOutrosFin = itens.some((i) => !isBoloForma(i.nome));
    if (temFormaFin && temOutrosFin) {
      if (!confirm("\u26A0\uFE0F Aten\xE7\xE3o!\n\nVoc\xEA tem Bolos na Forma (feitos sob encomenda) misturados com outros produtos no carrinho.\n\nBolos na Forma precisam de prazo de 5h a 1 dia \xFAtil para preparo.\n\nDeseja prosseguir com todos os itens mesmo assim?"))
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
      const m = onclickAttr.match(/pedirProduto\(this,'(.+?)',(\d+(?:\.\d+)?)\)/);
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
    const msg = `*\u{1F370} NOVO PEDIDO - GELAMOUR*

*\u{1F4CB} ITENS:*
${linhasItens}
*\u{1F4B0} Total:* R$ ${total.toFixed(2).replace(".", ",")}

*\u{1F464} Nome:* ${nome}
*\u{1F4CD} Endere\xE7o:* ${endereco}
*\u{1F4B3} Pagamento:* ${pagamentoSelecionado}${obs ? `
*\u{1F4DD} Obs:* ${obs}` : ""}

Pedido pelo card\xE1pio online \u2728`;
    const btnFin = document.getElementById("btnFinalizar");
    const txtOrig = btnFin ? (_i = btnFin.textContent) != null ? _i : "" : "";
    if (btnFin) {
      btnFin.disabled = true;
      btnFin.textContent = "Salvando pedido...";
    }
    let _pedidoId = null;
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 1e4);
      const r = await fetch(SUPABASE_URL + "/rest/v1/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON,
          "Authorization": "Bearer " + SUPABASE_ANON,
          "Prefer": "return=headers-only"
        },
        body: JSON.stringify({
          nome,
          endereco,
          pagamento: pagamentoSelecionado,
          itens: itensVerificados.map((i) => ({ nome: i.nome, preco: i.preco })),
          total,
          status: "aguardando",
          observacao: obs || null,
          cliente_id: clienteAtual ? clienteAtual.id : null,
          telefone: clienteAtual ? clienteAtual.telefone : null
        }),
        signal: ctrl.signal
      });
      clearTimeout(tid);
      if (!r.ok) {
        const errTxt = await r.text().catch(() => "");
        log6.error("INSERT pedido falhou", { status: r.status, body: errTxt.slice(0, 120) });
        throw new Error("HTTP " + r.status + " \u2014 " + errTxt.slice(0, 120));
      }
      const loc = (_j = r.headers.get("Location")) != null ? _j : "";
      const idMatch = loc.match(/id=eq\.(\d+)/);
      if (idMatch) {
        _pedidoId = parseInt(idMatch[1], 10);
        if (btnFin) btnFin.textContent = "\u2705 Pedido registrado!";
        if (clienteAtual && clienteAtual.id) {
          clienteRepository.updateEndereco(clienteAtual.id, endereco).catch((e) => log6.warn("N\xE3o foi poss\xEDvel salvar endere\xE7o", { error: String(e) }));
        }
      }
    } catch (e) {
      if (btnFin) btnFin.textContent = "\u26A0\uFE0F Erro - pedido s\xF3 no WhatsApp";
      log6.warn("Erro ao salvar no banco", { error: String(e) });
    }
    setTimeout(() => {
      if (btnFin) {
        btnFin.disabled = false;
        btnFin.textContent = txtOrig;
      }
    }, 3e3);
    if ((pagamentoSelecionado === "Pix" || pagamentoSelecionado === "Cart\xE3o") && _pedidoId) {
      const billingType = pagamentoSelecionado === "Cart\xE3o" ? "CREDIT_CARD" : "PIX";
      iniciarFluxoPix(_pedidoId, total, nome, msg, billingType, itensVerificados, endereco);
    } else {
      window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
      if (_pedidoId) {
        appStore.setState({ pedidoIdPendente: _pedidoId });
        (_k = document.getElementById("waConfirmBackdrop")) == null ? void 0 : _k.classList.add("aberto");
      }
    }
  }
  async function confirmarEnvioWA() {
    const id = appStore.getState().pedidoIdPendente;
    const btn = document.querySelector(".waConfirm-sim");
    const clienteAtual = getClienteAtual();
    if (!id) {
      fecharConfirmWA();
      return;
    }
    if (!clienteAtual || !clienteAtual.id) {
      fecharConfirmWA();
      return;
    }
    if (btn) {
      btn.textContent = "Confirmando...";
      btn.disabled = true;
    }
    const result = await pedidoRepository.updateStatus(id, clienteAtual.id, "confirmado");
    if (result.ok) {
      if (btn) btn.textContent = "\u{1F389} Pedido confirmado!";
      setTimeout(() => {
        fecharConfirmWA();
        limparCarrinho();
      }, 1800);
    } else {
      if (btn) {
        btn.textContent = "\u2705 Sim, mensagem enviada!";
        btn.disabled = false;
      }
      log6.warn("Erro ao confirmar pedido", { error: result.error.message });
      fecharConfirmWA();
    }
  }
  function fecharConfirmWA() {
    var _a;
    (_a = document.getElementById("waConfirmBackdrop")) == null ? void 0 : _a.classList.remove("aberto");
    appStore.setState({ pedidoIdPendente: null });
  }
  async function iniciarFluxoPix(pedidoId, total, nome, msgWA, billingType, itens, endereco) {
    var _a;
    _pixPedidoId = pedidoId;
    _pixMsgWA = msgWA;
    _pixTotal = total;
    _pixNome = nome;
    _pixItens = itens || [];
    _pixEndereco = endereco || "";
    const isPix = billingType !== "CREDIT_CARD";
    const pixTitulo = document.getElementById("pixTitulo");
    const pixSub = document.getElementById("pixSub");
    const pixValor = document.getElementById("pixValor");
    const secaoPix = document.getElementById("secaoPix");
    const secaoCartao = document.getElementById("secaoCartao");
    const pixJaPagueiBtn = document.getElementById("pixJaPagueiBtn");
    const pixStatus = document.getElementById("pixStatus");
    const pixCodeBox = document.getElementById("pixCodeBox");
    const pixQrImg = document.getElementById("pixQrImg");
    if (pixTitulo) pixTitulo.textContent = isPix ? "\u{1F4A0} Pague via Pix" : "\u{1F4B3} Pague com Cart\xE3o";
    if (pixSub) pixSub.textContent = isPix ? "Copie o c\xF3digo ou escaneie o QR Code" : "Cr\xE9dito ou d\xE9bito \u2014 preencha os dados abaixo";
    if (pixValor) pixValor.textContent = "R$ " + total.toFixed(2).replace(".", ",");
    if (secaoPix) secaoPix.style.display = isPix ? "block" : "none";
    if (secaoCartao) secaoCartao.style.display = isPix ? "none" : "block";
    if (pixJaPagueiBtn) pixJaPagueiBtn.style.display = "none";
    if (pixStatus) {
      pixStatus.textContent = isPix ? "\u23F3 Gerando QR Code..." : "";
      pixStatus.className = "pix-status" + (isPix ? " pix-aguardando" : "");
    }
    if (pixCodeBox) pixCodeBox.textContent = "Gerando c\xF3digo...";
    if (pixQrImg) pixQrImg.src = "";
    (_a = document.getElementById("pixBackdrop")) == null ? void 0 : _a.classList.add("aberto");
    fecharModal();
    if (!isPix) return;
    try {
      const resp = await fetch(EDGE_URL + "/criar-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON },
        body: JSON.stringify({ pedido_id: pedidoId, total, nome, billing_type: "PIX" })
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      _pixPayload = data.qr_code || "";
      if (pixCodeBox) pixCodeBox.textContent = _pixPayload || "C\xF3digo indispon\xEDvel";
      if (data.qr_code_image && pixQrImg) pixQrImg.src = "data:image/png;base64," + data.qr_code_image;
      if (pixStatus) {
        pixStatus.textContent = "\u23F3 Aguardando pagamento...";
        pixStatus.className = "pix-status pix-aguardando";
      }
      if (pixJaPagueiBtn) pixJaPagueiBtn.style.display = "none";
      _pixPollTimer = setInterval(verificarPagamentoPix, 4e3);
    } catch (e) {
      log6.warn("Erro ao criar Pix", { error: String(e) });
      if (pixCodeBox) pixCodeBox.textContent = "Erro ao gerar c\xF3digo.";
      if (pixStatus) {
        pixStatus.textContent = "\u26A0\uFE0F Erro ao gerar QR Code. Tente outra forma de pagamento.";
        pixStatus.className = "pix-status";
      }
      if (pixJaPagueiBtn) pixJaPagueiBtn.style.display = "block";
    }
  }
  function selecionarTipoCartao(tipo) {
    var _a, _b;
    _cardTipo = tipo;
    (_a = document.getElementById("btnCredito")) == null ? void 0 : _a.classList.toggle("ativo", tipo === "credito");
    (_b = document.getElementById("btnDebito")) == null ? void 0 : _b.classList.toggle("ativo", tipo === "debito");
  }
  function formatarCartao(el) {
    let v = el.value.replace(/\D/g, "").substring(0, 16);
    el.value = v.replace(/(.{4})(?=.)/g, "$1 ");
  }
  function formatarCpf(el) {
    let v = el.value.replace(/\D/g, "").substring(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
    el.value = v;
  }
  function formatarValidade(el) {
    let v = el.value.replace(/\D/g, "").substring(0, 4);
    if (v.length >= 3) v = v.substring(0, 2) + "/" + v.substring(2);
    el.value = v;
  }
  function formatarCep(el) {
    let v = el.value.replace(/\D/g, "").substring(0, 8);
    if (v.length > 5) v = v.substring(0, 5) + "-" + v.substring(5);
    el.value = v;
  }
  async function pagarCartao() {
    mostrarToast("\u{1F4B3} Pagamento por cart\xE3o em breve! Use o Pix por enquanto.", "info");
  }
  async function verificarPagamentoPix() {
    if (!_pixPedidoId) return;
    const result = await pedidoRepository.findById(_pixPedidoId);
    if (result.ok && result.value) {
      const statusPag = result.value.statusPagamento;
      if (statusPag === "pago") {
        if (_pixPollTimer) {
          clearInterval(_pixPollTimer);
          _pixPollTimer = null;
        }
        mostrarReciboPix();
      }
    } else {
      log6.warn("Erro ao verificar pagamento", { error: result.ok ? "not found" : result.error.message });
    }
  }
  function mostrarReciboPix() {
    const linhasItens = _pixItens.map(
      (i) => '<div class="recibo-item"><span>' + escHTML(i.nome) + "</span><span>R$ " + Number(i.preco).toFixed(2).replace(".", ",") + "</span></div>"
    ).join("");
    const pixBox = document.querySelector(".pix-box");
    if (pixBox) {
      pixBox.innerHTML = '<div style="font-size:52px;margin-bottom:8px">\u2705</div><div style="font-size:20px;font-weight:700;color:#166534;margin-bottom:4px">Pagamento recebido!</div><div style="font-size:13px;color:#6B5B52;margin-bottom:16px">Seu pedido foi confirmado com sucesso</div><div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:14px;text-align:left;margin-bottom:14px"><div style="font-size:11px;font-weight:700;color:#166534;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">\u{1F4CB} Resumo do pedido</div>' + linhasItens + '<div style="border-top:1px solid #bbf7d0;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-weight:700;font-size:14px"><span>Total</span><span style="color:#E8528A">R$ ' + Number(_pixTotal).toFixed(2).replace(".", ",") + '</span></div><div style="margin-top:8px;font-size:11px;color:#4b7c5e">\u{1F4CD} ' + escHTML(_pixEndereco) + '</div></div><button onclick="fecharReciboPix()" style="width:100%;padding:13px;background:linear-gradient(135deg,#E8528A,#C23A6E);color:#fff;font-weight:700;font-size:15px;border:none;border-radius:12px;cursor:pointer;font-family:inherit">\u{1F4AC} Ver pedido no WhatsApp</button>';
    }
    setTimeout(() => {
      window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(_pixMsgWA), "_blank");
    }, 2e3);
  }
  function fecharReciboPix() {
    var _a;
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(_pixMsgWA), "_blank");
    (_a = document.getElementById("pixBackdrop")) == null ? void 0 : _a.classList.remove("aberto");
    limparCarrinho();
    _pixPedidoId = null;
    _pixPayload = "";
    _pixMsgWA = "";
    _pixTotal = 0;
    _pixNome = "";
    _pixItens = [];
    _pixEndereco = "";
  }
  function copiarPix() {
    if (!_pixPayload) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(_pixPayload).then(() => {
        const btn = document.querySelector(".pix-copy-btn");
        if (btn) {
          btn.textContent = "\u2705 C\xF3digo copiado!";
          setTimeout(() => {
            btn.textContent = "\u{1F4CB} Copiar chave Pix";
          }, 2500);
        }
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = _pixPayload;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }
  function cancelarPix() {
    var _a, _b, _c;
    if (_pixPollTimer) {
      clearInterval(_pixPollTimer);
      _pixPollTimer = null;
    }
    const estaAberto = (_b = (_a = document.getElementById("pixBackdrop")) == null ? void 0 : _a.classList.contains("aberto")) != null ? _b : false;
    (_c = document.getElementById("pixBackdrop")) == null ? void 0 : _c.classList.remove("aberto");
    _pixPedidoId = null;
    _pixPayload = "";
    _pixMsgWA = "";
    _pixTotal = 0;
    _pixNome = "";
    _pixItens = [];
    _pixEndereco = "";
    if (estaAberto) abrirModal();
  }
  function pixJaPaguei() {
    cancelarPix();
    finalizarPedidoWhatsApp();
  }
  function finalizarPedidoWhatsApp() {
    var _a, _b, _c, _d;
    const itens = cartService.getItems();
    if (itens.length === 0) {
      mostrarToast("Carrinho vazio", "erro");
      return;
    }
    const nome = (_b = (_a = document.getElementById("inpNome")) == null ? void 0 : _a.value.trim()) != null ? _b : "";
    const endereco = (_d = (_c = document.getElementById("inpEndereco")) == null ? void 0 : _c.value.trim()) != null ? _d : "";
    const total = Array.from(itens).reduce((s, i) => s + i.preco, 0);
    const linhas = Array.from(itens).map((i) => `\u25B8 ${i.nome} \u2014 R$ ${i.preco.toFixed(2).replace(".", ",")} `).join("\n");
    const msg = `\u{1F6D2} *PEDIDO GELAMOUR* (Pix enviado manualmente)

${linhas}

*Total: R$ ${total.toFixed(2).replace(".", ",")}*

\u{1F464} ${nome}
\u{1F4CD} ${endereco}

_Confirmando envio do pagamento Pix._`;
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
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
  async function verificarTelefone() {
    var _a;
    if (_verificando) return;
    const telInput = document.getElementById("loginTelefone");
    const erro = document.getElementById("loginErro");
    const btn = document.querySelector("#etapaTelefone button");
    if (erro) erro.style.display = "none";
    if (btn) {
      btn.textContent = "Verificando...";
      btn.disabled = true;
    }
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
        const etapaTel = document.getElementById("etapaTelefone");
        const etapaCad = document.getElementById("etapaCadastro");
        if (etapaTel) etapaTel.style.display = "none";
        if (etapaCad) etapaCad.style.display = "block";
        telInput.dataset["tel"] = telInput.value.replace(/\D/g, "");
        (_a = document.getElementById("loginNome")) == null ? void 0 : _a.focus();
      }
    } catch (e) {
      if (erro) {
        erro.textContent = "Sem conex\xE3o ou erro no servidor. Tente novamente.";
        erro.style.display = "block";
      }
    } finally {
      if (btn) {
        btn.textContent = "Continuar \u2192";
        btn.disabled = false;
      }
      _verificando = false;
    }
  }
  async function cadastrar() {
    var _a;
    if (_cadastrando) return;
    const nomeInput = document.getElementById("loginNome");
    const telInput = document.getElementById("loginTelefone");
    const nome = nomeInput.value;
    const tel = (_a = telInput.dataset["tel"]) != null ? _a : "";
    const erro = document.getElementById("cadastroErro");
    if (!nome.trim()) {
      if (erro) {
        erro.textContent = "Digite seu nome.";
        erro.style.display = "block";
      }
      return;
    }
    if (erro) erro.style.display = "none";
    const btn = document.querySelector("#etapaCadastro button");
    if (btn) {
      btn.textContent = "Entrando...";
      btn.disabled = true;
    }
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
    } catch (e) {
      if (erro) {
        erro.textContent = "Erro ao cadastrar. Verifique sua conex\xE3o e tente novamente.";
        erro.style.display = "block";
      }
    } finally {
      if (btn) {
        btn.textContent = "Entrar no card\xE1pio \u2728";
        btn.disabled = false;
      }
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
  async function abrirRoleta() {
    var _a;
    const bd = document.getElementById("roletaBackdrop");
    if (!bd) return;
    bd.classList.add("aberto");
    document.body.classList.add("modal-aberto");
    document.getElementById("roletaStatusBox").innerHTML = "";
    document.getElementById("roletaInativa").style.display = "none";
    document.getElementById("roletaNaoLogado").style.display = "none";
    document.getElementById("roletaInstrucoes").style.display = "block";
    document.getElementById("roletaBtnEnviarWrap").style.display = "block";
    document.getElementById("roletaWheelSection").style.display = "none";
    document.getElementById("roletaJaGirou").style.display = "none";
    document.getElementById("roletaResultado").classList.remove("visivel");
    const cfg = await carregarConfig();
    const premios = getPremios();
    const grid = document.getElementById("roletaPremiosGrid");
    if (grid) {
      const icones = ["\u{1F36B}", "\u{1F9C1}", "\u{1F69A}", "\u{1F4B8}", "\u{1F4B0}", "\u{1F389}", "\u{1F36E}", "\u{1F380}", "\u{1F31F}"];
      grid.innerHTML = premios.map((p, i) => `<div class="roleta-premio-item">${icones[i % icones.length]} ${escHTML(p)}</div>`).join("");
    }
    if (cfg && !cfg.ativa) {
      document.getElementById("roletaInativa").style.display = "block";
      document.getElementById("roletaInstrucoes").style.display = "none";
    }
    desenharRoleta(premios);
    document.getElementById("roletaWheelSection").style.display = "block";
    const clienteAtual = getClienteAtual();
    if (!clienteAtual) {
      document.getElementById("roletaNaoLogado").style.display = "none";
      document.getElementById("roletaInstrucoes").style.display = "none";
      const girarBtn = document.getElementById("roletaGirarBtn");
      if (girarBtn) {
        girarBtn.disabled = false;
        girarBtn.style.opacity = "1";
        girarBtn.textContent = "\u{1F3A1} GIRAR AGORA!";
      }
      return;
    }
    const status = await verificarStatus((_a = clienteAtual.id) != null ? _a : 0);
    atualizarUIRoleta(status);
  }
  function fecharRoleta() {
    var _a;
    (_a = document.getElementById("roletaBackdrop")) == null ? void 0 : _a.classList.remove("aberto");
    document.body.classList.remove("modal-aberto");
  }
  function fecharRoletaBackdrop(e) {
    if (e.target.id === "roletaBackdrop") fecharRoleta();
  }
  function atualizarUIRoleta(info) {
    const statusBox = document.getElementById("roletaStatusBox");
    const instrucoes = document.getElementById("roletaInstrucoes");
    const btnEnviar = document.getElementById("roletaBtnEnviarWrap");
    const wheelSection = document.getElementById("roletaWheelSection");
    const jaGirou = document.getElementById("roletaJaGirou");
    const girarBtn = document.getElementById("roletaGirarBtn");
    const clienteAtual = getClienteAtual();
    wheelSection.style.display = "block";
    desenharRoleta(getPremios());
    if (isContaTeste(appStore.getState().cliente)) {
      if (girarBtn) {
        girarBtn.disabled = false;
        girarBtn.style.opacity = "1";
        girarBtn.textContent = "\u{1F3A1} GIRAR AGORA!";
      }
      statusBox.innerHTML = "";
      instrucoes.style.display = "none";
      btnEnviar.style.display = "none";
      jaGirou.style.display = "none";
      return;
    }
    if (!info) {
      statusBox.innerHTML = "";
      instrucoes.style.display = "block";
      btnEnviar.style.display = "block";
      jaGirou.style.display = "none";
      if (girarBtn) {
        girarBtn.disabled = true;
        girarBtn.style.opacity = "0.4";
        girarBtn.title = "Envie suas provas para liberar a roleta";
      }
      return;
    }
    if (info.status === "pendente") {
      statusBox.innerHTML = '<div class="roleta-status-box roleta-status-pendente">\u23F3 <div><strong>Participa\xE7\xE3o enviada!</strong><br>Suas provas est\xE3o em an\xE1lise. Aguarde a aprova\xE7\xE3o (at\xE9 24h).</div></div>';
      instrucoes.style.display = "block";
      btnEnviar.style.display = "none";
      jaGirou.style.display = "none";
      if (girarBtn) {
        girarBtn.disabled = true;
        girarBtn.style.opacity = "0.4";
        girarBtn.title = "Aguardando aprova\xE7\xE3o";
      }
    } else if (info.status === "rejeitado") {
      statusBox.innerHTML = '<div class="roleta-status-box roleta-status-rejeitado">\u274C <div><strong>Participa\xE7\xE3o n\xE3o aprovada.</strong><br>Tente novamente cumprindo todos os requisitos.</div></div>';
      instrucoes.style.display = "block";
      btnEnviar.style.display = "block";
      jaGirou.style.display = "none";
      if (girarBtn) {
        girarBtn.disabled = true;
        girarBtn.style.opacity = "0.4";
      }
    } else if (info.status === "aprovado" && !info.ja_girou) {
      const hoje = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const diaAprovacao = info.data_aprovacao ? info.data_aprovacao.split("T")[0] : null;
      if (diaAprovacao !== hoje) {
        statusBox.innerHTML = '<div class="roleta-status-box roleta-status-rejeitado">\u23F0 <div><strong>Prazo expirado.</strong><br>Voc\xEA foi aprovado em outro dia e n\xE3o girou a tempo. Envie novas provas para participar novamente.</div></div>';
        instrucoes.style.display = "none";
        btnEnviar.style.display = "block";
        jaGirou.style.display = "none";
        if (girarBtn) {
          girarBtn.disabled = true;
          girarBtn.style.opacity = "0.4";
          girarBtn.textContent = "\u{1F512} Prazo expirado";
        }
      } else {
        statusBox.innerHTML = '<div class="roleta-status-box roleta-status-aprovado">\u2705 <div><strong>Aprovado! Gire hoje!</strong><br>Voc\xEA tem at\xE9 meia-noite para usar seu giro. N\xE3o acumula!</div></div>';
        instrucoes.style.display = "none";
        btnEnviar.style.display = "none";
        jaGirou.style.display = "none";
        if (girarBtn) {
          girarBtn.disabled = false;
          girarBtn.style.opacity = "1";
          girarBtn.textContent = "\u{1F3A1} GIRAR AGORA!";
        }
      }
    } else if (info.ja_girou && !isContaTeste(appStore.getState().cliente)) {
      statusBox.innerHTML = "";
      instrucoes.style.display = "none";
      btnEnviar.style.display = "none";
      jaGirou.style.display = "block";
      if (girarBtn) {
        girarBtn.disabled = true;
        girarBtn.style.opacity = "0.4";
      }
      const premioEl = document.getElementById("roletaJaGirouPremio");
      if (premioEl) {
        premioEl.innerHTML = info.premio ? 'Seu pr\xEAmio foi: <strong style="color:var(--rosa)">' + escHTML(info.premio) + "</strong>. Entre em contato conosco para resgatar!" : "Voc\xEA j\xE1 usou sua chance nesta campanha.";
      }
    }
  }
  async function girarRoleta() {
    var _a, _b, _c;
    const clienteAtual = getClienteAtual();
    if (!clienteAtual) {
      mostrarToast("Fa\xE7a login para girar a roleta!", "erro");
      return;
    }
    const statusGiro = await verificarStatus((_a = clienteAtual.id) != null ? _a : 0);
    if (!isContaTeste(appStore.getState().cliente)) {
      if (!statusGiro || statusGiro.status !== "aprovado" || statusGiro.ja_girou) {
        mostrarToast("Voc\xEA precisa ser aprovado pela equipe antes de girar!", "erro");
        return;
      }
      try {
        const semana = getSemanaAtual();
        const countResult = await roletaRepository.countVencedoresSemana(semana);
        const vencedoresCount = countResult.ok ? countResult.value : 0;
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/roleta_config?id=eq.1&select=max_vencedores_semana`, {
          headers: { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON }
        });
        const cfg = await resp.json();
        const limite = (_c = (_b = cfg[0]) == null ? void 0 : _b.max_vencedores_semana) != null ? _c : 1;
        if (vencedoresCount >= limite) {
          const btn = document.getElementById("roletaGirarBtn");
          if (btn) {
            btn.disabled = true;
            btn.style.opacity = "0.4";
          }
          const resultEl = document.getElementById("roletaResultado");
          if (resultEl) {
            resultEl.innerHTML = "\u26A0\uFE0F <strong>J\xE1 temos um ganhador esta semana!</strong><br><small>A pr\xF3xima rodada come\xE7a na semana que vem. Fique de olho!</small>";
            resultEl.classList.add("visivel");
          }
          return;
        }
      } catch (e) {
        log6.warn("Erro ao verificar limite semanal", { error: String(e) });
      }
    }
    await girar(clienteAtual, (premio) => {
      const resultEl = document.getElementById("roletaResultado");
      if (resultEl) {
        resultEl.innerHTML = '\u{1F389} Voc\xEA ganhou: <strong style="color:var(--rosa)">' + escHTML(premio) + '</strong>!<br><small style="font-size:13px;color:var(--texto-sec)">Entre em contato conosco pelo WhatsApp para resgatar seu pr\xEAmio!</small>';
        resultEl.classList.add("visivel");
      }
      const btn = document.getElementById("roletaGirarBtn");
      if (btn) btn.textContent = "\u2713 Girado!";
      salvarVencedor(clienteAtual, premio).catch(console.error);
    });
  }
  async function enviarProvasWhatsApp() {
    var _a;
    const clienteAtual = getClienteAtual();
    if (!clienteAtual) {
      alert("Fa\xE7a login antes de enviar suas provas.");
      return;
    }
    const statusAtual = await verificarStatus((_a = clienteAtual.id) != null ? _a : 0);
    if (statusAtual && (statusAtual.status === "pendente" || statusAtual.status === "aprovado")) {
      atualizarUIRoleta(statusAtual);
      return;
    }
    const nome = clienteAtual.nome || "";
    const tel = clienteAtual.telefone || "";
    const instEl = document.getElementById("roletaInstagramInput");
    const instagram = instEl ? instEl.value.trim() : "";
    const msg = "Ol\xE1, equipe Gelamour! Quero participar da Roleta VIP.%0A%0ANome: " + encodeURIComponent(nome) + "%0ATelefone: " + encodeURIComponent(tel) + (instagram ? "%0AInstagram: " + encodeURIComponent(instagram) : "") + "%0A%0AEstou enviando a foto dos meus 5 adesivos e o print do Story para valida\xE7\xE3o!";
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + msg, "_blank");
    await registrarParticipacao(instagram);
    atualizarUIRoleta({ status: "pendente", ja_girou: false });
  }
  async function registrarParticipacao(instagram) {
    var _a;
    const clienteAtual = getClienteAtual();
    if (!clienteAtual) return;
    try {
      const check = await verificarStatus((_a = clienteAtual.id) != null ? _a : 0);
      if (check && check.status !== "rejeitado") return;
      const semana = getSemanaAtual();
      const result = await roletaRepository.saveParticipacao({
        nome: clienteAtual.nome,
        telefone: clienteAtual.telefone,
        instagram: instagram || void 0,
        status: "pendente",
        semana,
        ja_girou: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (result.ok) {
        setParticipacaoId(result.value.id);
      }
    } catch (e) {
      log6.warn("Erro ao registrar participa\xE7\xE3o", { error: String(e) });
    }
  }
  function verificarAdmin() {
    return appStore.getState().isAdmin;
  }
  async function abrirRoletaAdmin() {
    var _a;
    if (!verificarAdmin()) {
      alert("Acesso restrito.");
      return;
    }
    (_a = document.getElementById("roletaAdminBackdrop")) == null ? void 0 : _a.classList.add("aberto");
    await carregarParticipantesRoleta();
    await carregarConfigAdmin();
  }
  function fecharRoletaAdmin() {
    var _a;
    (_a = document.getElementById("roletaAdminBackdrop")) == null ? void 0 : _a.classList.remove("aberto");
  }
  function fecharRoletaAdminBackdrop(e) {
    if (e.target.id === "roletaAdminBackdrop") fecharRoletaAdmin();
  }
  function abrirTabAdmin(tab, btn) {
    var _a;
    document.querySelectorAll(".roleta-admin-tab").forEach((t) => t.classList.remove("ativo"));
    document.querySelectorAll(".roleta-admin-panel").forEach((p) => p.classList.remove("ativo"));
    btn.classList.add("ativo");
    const tabId = "tab" + tab.charAt(0).toUpperCase() + tab.slice(1);
    (_a = document.getElementById(tabId)) == null ? void 0 : _a.classList.add("ativo");
    if (tab === "pendentes") carregarParticipantesRoleta();
    else if (tab === "aprovados") carregarAprovadosRoleta();
    else if (tab === "vencedores") carregarVencedoresRoleta();
    else if (tab === "config") carregarConfigAdmin();
  }
  async function carregarParticipantesRoleta() {
    const el = document.getElementById("listaPendentes");
    if (!el) return;
    el.innerHTML = '<div class="roleta-empty">Carregando...</div>';
    try {
      const r = await fetch(SUPABASE_URL + "/rest/v1/roleta_participacoes?status=eq.pendente&order=created_at.desc", {
        headers: { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON }
      });
      const data = await r.json();
      if (!data || !data.length) {
        el.innerHTML = '<div class="roleta-empty">Nenhum participante pendente.</div>';
        return;
      }
      el.innerHTML = data.map((p) => {
        var _a;
        const dt = new Date(p.created_at).toLocaleString("pt-BR");
        return '<div class="roleta-participante-item"><div class="roleta-participante-info"><div class="roleta-participante-nome">' + escHTML((_a = p.nome) != null ? _a : "") + '</div><div class="roleta-participante-tel">' + escHTML(p.telefone) + (p.instagram ? " \xB7 @" + escHTML(p.instagram) : "") + '</div><div style="font-size:11px;color:#999">' + dt + '</div></div><div class="roleta-participante-acoes"><button class="btn-aprovar" onclick="aprovarParticipante(' + p.id + ', this)">\u2713 Aprovar</button><button class="btn-rejeitar" onclick="rejeitarParticipante(' + p.id + ', this)">\u2717 Rejeitar</button></div></div>';
      }).join("");
    } catch (e) {
      el.innerHTML = '<div class="roleta-empty">Erro ao carregar.</div>';
    }
  }
  async function carregarAprovadosRoleta() {
    const el = document.getElementById("listaAprovados");
    if (!el) return;
    el.innerHTML = '<div class="roleta-empty">Carregando...</div>';
    try {
      const r = await fetch(SUPABASE_URL + "/rest/v1/roleta_participacoes?status=eq.aprovado&order=data_aprovacao.desc", {
        headers: { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON }
      });
      const data = await r.json();
      if (!data || !data.length) {
        el.innerHTML = '<div class="roleta-empty">Nenhum aprovado ainda.</div>';
        return;
      }
      el.innerHTML = data.map((p) => {
        var _a, _b;
        const dt = p.data_aprovacao ? new Date(p.data_aprovacao).toLocaleString("pt-BR") : "\u2014";
        const girou = p.ja_girou ? "\u2713 Girou \u2014 " + escHTML((_a = p.premio) != null ? _a : "") : "\u23F3 Aguardando girar";
        return '<div class="roleta-participante-item"><div class="roleta-participante-info"><div class="roleta-participante-nome">' + escHTML((_b = p.nome) != null ? _b : "") + '</div><div class="roleta-participante-tel">' + escHTML(p.telefone) + '</div><div style="font-size:11px;color:#388e3c">' + girou + '</div><div style="font-size:11px;color:#999">Aprovado em: ' + dt + "</div></div></div>";
      }).join("");
    } catch (e) {
      el.innerHTML = '<div class="roleta-empty">Erro ao carregar.</div>';
    }
  }
  async function aprovarParticipante(id, btn) {
    var _a;
    btn.disabled = true;
    btn.textContent = "...";
    const clienteAtual = getClienteAtual();
    try {
      const r = await fetch(SUPABASE_URL + "/rest/v1/roleta_participacoes?id=eq." + id, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON,
          "Authorization": "Bearer " + SUPABASE_ANON,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          status: "aprovado",
          data_aprovacao: (/* @__PURE__ */ new Date()).toISOString(),
          aprovado_por: clienteAtual ? clienteAtual.nome : "admin"
        })
      });
      if (!r.ok) throw new Error("status " + r.status);
      (_a = btn.closest(".roleta-participante-item")) == null ? void 0 : _a.remove();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "\u2713 Aprovar";
      alert("Erro ao aprovar.");
    }
  }
  async function rejeitarParticipante(id, btn) {
    var _a;
    if (!confirm("Rejeitar esta participa\xE7\xE3o?")) return;
    btn.disabled = true;
    btn.textContent = "...";
    try {
      const r = await fetch(SUPABASE_URL + "/rest/v1/roleta_participacoes?id=eq." + id, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON,
          "Authorization": "Bearer " + SUPABASE_ANON,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ status: "rejeitado" })
      });
      if (!r.ok) throw new Error("status " + r.status);
      (_a = btn.closest(".roleta-participante-item")) == null ? void 0 : _a.remove();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "\u2717 Rejeitar";
      alert("Erro ao rejeitar.");
    }
  }
  async function carregarVencedoresRoleta() {
    const el = document.getElementById("listaVencedores");
    if (!el) return;
    el.innerHTML = '<div class="roleta-empty">Carregando...</div>';
    try {
      const r = await fetch(SUPABASE_URL + "/rest/v1/roleta_vencedores?order=data_vitoria.desc", {
        headers: { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON }
      });
      const data = await r.json();
      if (!data || !data.length) {
        el.innerHTML = '<div class="roleta-empty">Nenhum vencedor ainda.</div>';
        return;
      }
      el.innerHTML = data.map((v) => {
        var _a, _b, _c;
        const dt = new Date(v.data_vitoria).toLocaleString("pt-BR");
        return '<div class="roleta-vencedor-item"><div class="roleta-vencedor-nome">\u{1F3C6} ' + escHTML((_a = v.nome) != null ? _a : "\u2014") + '</div><div class="roleta-vencedor-premio">\u{1F381} ' + escHTML(v.premio) + '</div><div class="roleta-vencedor-data">' + escHTML((_b = v.telefone) != null ? _b : "") + " \xB7 Semana " + escHTML((_c = v.semana) != null ? _c : "") + " \xB7 " + dt + "</div></div>";
      }).join("");
    } catch (e) {
      el.innerHTML = '<div class="roleta-empty">Erro ao carregar.</div>';
    }
  }
  async function carregarConfigAdmin() {
    try {
      const r = await fetch(SUPABASE_URL + "/rest/v1/roleta_config?id=eq.1&limit=1", {
        headers: { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON }
      });
      const data = await r.json();
      if (data && data[0]) {
        document.getElementById("configAtiva").checked = data[0].ativa;
        const premios = Array.isArray(data[0].premios) ? data[0].premios : getPremiosPadrao();
        document.getElementById("configPremios").value = premios.join("\n");
      }
    } catch (e) {
      log6.warn("Erro ao carregar config admin", { error: String(e) });
    }
  }
  async function salvarConfigRoleta() {
    const ativa = document.getElementById("configAtiva").checked;
    const premiosTxt = document.getElementById("configPremios").value;
    const premios = premiosTxt.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
    const msgEl = document.getElementById("configMsg");
    try {
      const r = await fetch(SUPABASE_URL + "/rest/v1/roleta_config?id=eq.1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON,
          "Authorization": "Bearer " + SUPABASE_ANON,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ ativa, premios, updated_at: (/* @__PURE__ */ new Date()).toISOString() })
      });
      if (!r.ok) throw new Error("status " + r.status);
      setPremios(premios);
      if (msgEl) {
        msgEl.style.display = "block";
        setTimeout(() => {
          msgEl.style.display = "none";
        }, 2500);
      }
    } catch (e) {
      alert("Erro ao salvar configura\xE7\xF5es.");
    }
  }
  (async function init() {
    try {
      const clienteSessao = loginUseCase.restoreSession();
      if (clienteSessao) {
        const result = await loginUseCase.execute(clienteSessao.telefone);
        if (result.ok && result.value.existe && result.value.cliente) {
          entrarComCliente(result.value.cliente.toJSON());
          return;
        }
        loginUseCase.logout();
      }
    } catch (e) {
      log6.warn("Erro ao verificar sess\xE3o", { error: String(e) });
    }
    mostrarLogin();
  })();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
    });
  }
  (async function sincronizarCardapio() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1e4);
      const r = await fetch(SUPABASE_URL + "/rest/v1/produtos?select=nome,preco,disponivel", {
        headers: { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON },
        signal: ctrl.signal
      });
      clearTimeout(timer);
      if (!r.ok) return;
      const prods = await r.json();
      if (!Array.isArray(prods) || !prods.length) return;
      const mapa = {};
      prods.forEach((p) => {
        if (p && typeof p.nome === "string" && p.nome.trim()) mapa[p.nome.trim().toLowerCase()] = p;
      });
      const priceMap = /* @__PURE__ */ new Map();
      document.querySelectorAll(".btn-pedir").forEach((btn) => {
        var _a;
        const onclickAttr = (_a = btn.getAttribute("onclick")) != null ? _a : "";
        const m = onclickAttr.match(/pedirProduto\(this,'(.+?)',(\d+(?:\.\d+)?)\)/);
        if (!m) return;
        const nomeProd = m[1];
        const chave = nomeProd.trim().toLowerCase();
        const db = mapa[chave];
        if (!db) return;
        const card = btn.closest(".prod-card");
        if (!card) return;
        if (db.disponivel === false) {
          card.style.display = "none";
          return;
        }
        const novoPreco = parseFloat(String(db.preco));
        if (isNaN(novoPreco) || novoPreco <= 0) return;
        btn.setAttribute("onclick", "pedirProduto(this,'" + nomeProd.replace(/'/g, "\\'") + "'," + novoPreco + ")");
        const precoEl = card.querySelector(".prod-preco");
        if (precoEl) precoEl.textContent = "R$ " + novoPreco.toFixed(2).replace(".", ",");
        priceMap.set(nomeProd, novoPreco);
      });
      cartService.revalidatePrices(priceMap);
    } catch (e) {
    }
  })();
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      fecharDialog();
      fecharModal();
      fecharConfirmWA();
      cancelarPix();
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
    agendarBoloWhatsApp,
    carouselNext,
    carouselPrev,
    copiarPix,
    cancelarPix,
    pixJaPaguei,
    selecionarTipoCartao,
    formatarCartao,
    formatarCpf,
    formatarValidade,
    formatarCep,
    pagarCartao,
    fecharReciboPix,
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
    salvarConfigRoleta
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3V0aWxzL3RvYXN0LnRzIiwgIi4uL3NyYy91dGlscy9zZWN1cml0eS50cyIsICIuLi9zcmMvdXRpbHMvZm9ybWF0LnRzIiwgIi4uL3NyYy9jb3JlL2Vycm9ycy50cyIsICIuLi9zcmMvZG9tYWluL2NsaWVudGUudHMiLCAiLi4vc3JjL2NvcmUvcmVzdWx0LnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQudHMiLCAiLi4vc3JjL2NvcmUvbG9nZ2VyLnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9DbGllbnRlUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvZG9tYWluL3BlZGlkby50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUGVkaWRvUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUm9sZXRhUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvY29yZS9ldmVudHMudHMiLCAiLi4vc3JjL3N0YXRlL1N0b3JlLnRzIiwgIi4uL3NyYy9zdGF0ZS9BcHBTdG9yZS50cyIsICIuLi9zcmMvYXBwbGljYXRpb24vYXV0aC9Mb2dpblVzZUNhc2UudHMiLCAiLi4vc3JjL2FwcGxpY2F0aW9uL2NhcnQvQ2FydFNlcnZpY2UudHMiLCAiLi4vc3JjL2NvbnRhaW5lci50cyIsICIuLi9zcmMvbW9kdWxlcy9yb2xldGEudHMiLCAiLi4vc3JjL21vZHVsZXMvY2FydC50cyIsICIuLi9zcmMvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUb2FzdFRpcG8gfSBmcm9tICcuLi90eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBtb3N0cmFyVG9hc3QobXNnOiBzdHJpbmcsIHRpcG86IFRvYXN0VGlwbyA9ICdpbmZvJyk6IHZvaWQge1xuICBjb25zdCBvbGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnX3RvYXN0Jyk7XG4gIGlmIChvbGQpIG9sZC5yZW1vdmUoKTtcbiAgY29uc3QgdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0LmlkID0gJ190b2FzdCc7XG4gIHQudGV4dENvbnRlbnQgPSBtc2c7XG4gIGNvbnN0IGJnID0gdGlwbyA9PT0gJ2Vycm8nID8gJyNlZjQ0NDQnIDogdGlwbyA9PT0gJ29rJyA/ICcjMjJjNTVlJyA6ICcjNEEyQzE3JztcbiAgT2JqZWN0LmFzc2lnbih0LnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdmaXhlZCcsIGJvdHRvbTogJzkwcHgnLCBsZWZ0OiAnNTAlJyxcbiAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKC01MCUpJyxcbiAgICBiYWNrZ3JvdW5kOiBiZywgY29sb3I6ICcjZmZmJywgcGFkZGluZzogJzEycHggMjJweCcsXG4gICAgYm9yZGVyUmFkaXVzOiAnMzBweCcsIGZvbnRTaXplOiAnMTRweCcsIGZvbnRXZWlnaHQ6ICc2MDAnLFxuICAgIHpJbmRleDogJzk5OTk5JywgYm94U2hhZG93OiAnMCA2cHggMjRweCByZ2JhKDAsMCwwLDAuMyknLFxuICAgIG1heFdpZHRoOiAnOTB2dycsIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgdHJhbnNpdGlvbjogJ29wYWNpdHkgLjNzJywgb3BhY2l0eTogJzEnLFxuICAgIGZvbnRGYW1pbHk6IFwiJ0RNIFNhbnMnLCBzYW5zLXNlcmlmXCIsXG4gIH0gYXMgUGFydGlhbDxDU1NTdHlsZURlY2xhcmF0aW9uPik7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodCk7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHQuc3R5bGUub3BhY2l0eSA9ICcwJztcbiAgICBzZXRUaW1lb3V0KCgpID0+IHQucmVtb3ZlKCksIDM1MCk7XG4gIH0sIDM1MDApO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBlc2NIVE1MKHM6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gU3RyaW5nKHMpXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6YXJUZWxlZm9uZSh0ZWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZWwucmVwbGFjZSgvXFxEL2csICcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6YXJOb21lKG5vbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBub21lXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAuc3BsaXQoJyAnKVxuICAgIC5tYXAocCA9PiBwLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcC5zbGljZSgxKSlcbiAgICAuam9pbignICcpXG4gICAgLnRyaW0oKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gZm9ybWF0YXJNb2VkYSh2YWxvcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuICdSJCAnICsgdmFsb3IudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbWFuYUF0dWFsKCk6IHN0cmluZyB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IHN0YXJ0T2ZZZWFyID0gbmV3IERhdGUobm93LmdldEZ1bGxZZWFyKCksIDAsIDEpO1xuICBjb25zdCBkYXlPZlllYXIgPSBNYXRoLmZsb29yKChub3cuZ2V0VGltZSgpIC0gc3RhcnRPZlllYXIuZ2V0VGltZSgpKSAvIDg2NDAwMDAwKTtcbiAgY29uc3Qgd2Vla051bSA9IE1hdGguY2VpbCgoZGF5T2ZZZWFyICsgc3RhcnRPZlllYXIuZ2V0RGF5KCkgKyAxKSAvIDcpO1xuICByZXR1cm4gYCR7bm93LmdldEZ1bGxZZWFyKCl9LVcke1N0cmluZyh3ZWVrTnVtKS5wYWRTdGFydCgyLCAnMCcpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcGxpY2FyTWFzY2FyYVRlbGVmb25lKHZhbG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBkID0gdmFsb3IucmVwbGFjZSgvXFxEL2csICcnKS5zbGljZSgwLCAxMSk7XG4gIGlmIChkLmxlbmd0aCA8PSAyKSByZXR1cm4gZDtcbiAgaWYgKGQubGVuZ3RoIDw9IDcpIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyKX1gO1xuICBpZiAoZC5sZW5ndGggPD0gMTEpIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyLCA3KX0tJHtkLnNsaWNlKDcpfWA7XG4gIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyLCA3KX0tJHtkLnNsaWNlKDcsIDExKX1gO1xufVxuIiwgImV4cG9ydCBjbGFzcyBBcHBFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIHB1YmxpYyByZWFkb25seSBjb2RlOiBzdHJpbmcsXG4gICAgcHVibGljIHJlYWRvbmx5IHN0YXR1c0NvZGU6IG51bWJlciA9IDUwMCxcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdBcHBFcnJvcic7XG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIEFwcEVycm9yLnByb3RvdHlwZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBzdXBlcihtZXNzYWdlLCAnVkFMSURBVElPTl9FUlJPUicsIDQwMCwgY29udGV4dCk7XG4gICAgdGhpcy5uYW1lID0gJ1ZhbGlkYXRpb25FcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5ldHdvcmtFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBzdXBlcihtZXNzYWdlLCAnTkVUV09SS19FUlJPUicsIDUwMywgY29udGV4dCk7XG4gICAgdGhpcy5uYW1lID0gJ05ldHdvcmtFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEF1dGhFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSwgJ0FVVEhfRVJST1InLCA0MDEpO1xuICAgIHRoaXMubmFtZSA9ICdBdXRoRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb3RGb3VuZEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXNvdXJjZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYCR7cmVzb3VyY2V9IG5cdTAwRTNvIGVuY29udHJhZG9gLCAnTk9UX0ZPVU5EJywgNDA0KTtcbiAgICB0aGlzLm5hbWUgPSAnTm90Rm91bmRFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJhdGVMaW1pdEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXRyeUFmdGVyTXM6IG51bWJlcikge1xuICAgIHN1cGVyKGBNdWl0YXMgdGVudGF0aXZhcy4gQWd1YXJkZSAke01hdGguY2VpbChyZXRyeUFmdGVyTXMgLyAxMDAwKX1zLmAsICdSQVRFX0xJTUlUJywgNDI5LCB7IHJldHJ5QWZ0ZXJNcyB9KTtcbiAgICB0aGlzLm5hbWUgPSAnUmF0ZUxpbWl0RXJyb3InO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vY29yZS9lcnJvcnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENsaWVudGVQcm9wcyB7XG4gIGlkPzogbnVtYmVyO1xuICBub21lOiBzdHJpbmc7XG4gIHRlbGVmb25lOiBzdHJpbmc7XG4gIGVuZGVyZWNvPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ2xpZW50ZSB7XG4gIHJlYWRvbmx5IGlkPzogbnVtYmVyO1xuICByZWFkb25seSBub21lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHRlbGVmb25lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGVuZGVyZWNvPzogc3RyaW5nO1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJvcHM6IENsaWVudGVQcm9wcykge1xuICAgIHRoaXMuaWQgPSBwcm9wcy5pZDtcbiAgICB0aGlzLm5vbWUgPSBwcm9wcy5ub21lO1xuICAgIHRoaXMudGVsZWZvbmUgPSBwcm9wcy50ZWxlZm9uZTtcbiAgICB0aGlzLmVuZGVyZWNvID0gcHJvcHMuZW5kZXJlY287XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlKHByb3BzOiBDbGllbnRlUHJvcHMpOiBDbGllbnRlIHtcbiAgICBjb25zdCB0ZWwgPSBwcm9wcy50ZWxlZm9uZS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgIGlmICh0ZWwubGVuZ3RoIDwgMTAgfHwgdGVsLmxlbmd0aCA+IDExKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdUZWxlZm9uZSBpbnZcdTAwRTFsaWRvJywgeyB0ZWxlZm9uZTogcHJvcHMudGVsZWZvbmUgfSk7XG4gICAgfVxuICAgIGlmICghcHJvcHMubm9tZS50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ05vbWUgblx1MDBFM28gcG9kZSBzZXIgdmF6aW8nKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDbGllbnRlKHtcbiAgICAgIC4uLnByb3BzLFxuICAgICAgdGVsZWZvbmU6IHRlbCxcbiAgICAgIG5vbWU6IENsaWVudGUubm9ybWFsaXphck5vbWUocHJvcHMubm9tZSksXG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbURCKHJhdzogQ2xpZW50ZVByb3BzKTogQ2xpZW50ZSB7XG4gICAgcmV0dXJuIG5ldyBDbGllbnRlKHJhdyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBub3JtYWxpemFyTm9tZShub21lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBub21lLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKVxuICAgICAgLm1hcChwID0+IHAuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwLnNsaWNlKDEpKVxuICAgICAgLmpvaW4oJyAnKS50cmltKCk7XG4gIH1cblxuICB3aXRoRW5kZXJlY28oZW5kZXJlY286IHN0cmluZyk6IENsaWVudGUge1xuICAgIHJldHVybiBDbGllbnRlLmZyb21EQih7IC4uLnRoaXMudG9KU09OKCksIGVuZGVyZWNvIH0pO1xuICB9XG5cbiAgdG9KU09OKCk6IENsaWVudGVQcm9wcyB7XG4gICAgcmV0dXJuIHsgaWQ6IHRoaXMuaWQsIG5vbWU6IHRoaXMubm9tZSwgdGVsZWZvbmU6IHRoaXMudGVsZWZvbmUsIGVuZGVyZWNvOiB0aGlzLmVuZGVyZWNvIH07XG4gIH1cbn1cbiIsICJleHBvcnQgdHlwZSBSZXN1bHQ8VCwgRSBleHRlbmRzIEVycm9yID0gRXJyb3I+ID1cbiAgfCB7IHJlYWRvbmx5IG9rOiB0cnVlOyByZWFkb25seSB2YWx1ZTogVCB9XG4gIHwgeyByZWFkb25seSBvazogZmFsc2U7IHJlYWRvbmx5IGVycm9yOiBFIH07XG5cbmV4cG9ydCBjb25zdCBvayA9IDxUPih2YWx1ZTogVCk6IFJlc3VsdDxULCBuZXZlcj4gPT4gKHsgb2s6IHRydWUsIHZhbHVlIH0pO1xuZXhwb3J0IGNvbnN0IGZhaWwgPSA8RSBleHRlbmRzIEVycm9yPihlcnJvcjogRSk6IFJlc3VsdDxuZXZlciwgRT4gPT4gKHsgb2s6IGZhbHNlLCBlcnJvciB9KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzT2s8VCwgRSBleHRlbmRzIEVycm9yPihyOiBSZXN1bHQ8VCwgRT4pOiByIGlzIHsgb2s6IHRydWU7IHZhbHVlOiBUIH0ge1xuICByZXR1cm4gci5vaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcDxUPihyOiBSZXN1bHQ8VD4sIGZhbGxiYWNrPzogVCk6IFQge1xuICBpZiAoci5vaykgcmV0dXJuIHIudmFsdWU7XG4gIGlmIChmYWxsYmFjayAhPT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsbGJhY2s7XG4gIHRocm93IHIuZXJyb3I7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0cnlBc3luYzxUPihmbjogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8UmVzdWx0PFQ+PiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG9rKGF3YWl0IGZuKCkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhaWwoZSBpbnN0YW5jZW9mIEVycm9yID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IE5ldHdvcmtFcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcblxuY29uc3QgU1VQQUJBU0VfVVJMID0gYXRvYignYUhSMGNITTZMeTl5Wm1KMFpIUjJjMjVtZEhsaVlYcG1iV1JpZHk1emRYQmhZbUZ6WlM1amJ3PT0nKTtcbmNvbnN0IFNVUEFCQVNFX0FOT04gPSBhdG9iKCdaWGxLYUdKSFkybFBhVXBKVlhwSk1VNXBTWE5KYmxJMVkwTkpOa2xyY0ZoV1EwbzVMbVY1U25Cak0wMXBUMmxLZW1SWVFtaFpiVVo2V2xOSmMwbHVTbXhhYVVrMlNXNUtiVmx1VW10a1NGWjZZbTFhTUdWWFNtaGxiVnAwV2tkS00wbHBkMmxqYlRseldsTkpOa2x0Um5WaU1qUnBURU5LY0ZsWVVXbFBha1V6VDBSRk5VMVVRWHBPYWtGelNXMVdOR05EU1RaTmFrRTFUbnBSTkU1cVRUSk5TREF1U0hjMk9HcFJSa1p0ZDB4bmRuZEdPWHBxYUdkV1YxQmpNMFF4VVRKd1ptZEJiakZVVVd4S1JWWjFOQT09Jyk7XG5jb25zdCBUSU1FT1VUX01TID0gMTBfMDAwO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1cGFiYXNlRmV0Y2hPcHRpb25zIGV4dGVuZHMgUmVxdWVzdEluaXQge1xuICB0aW1lb3V0PzogbnVtYmVyO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VGZXRjaChcbiAgcGF0aDogc3RyaW5nLFxuICBvcHRzOiBTdXBhYmFzZUZldGNoT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IHsgdGltZW91dCA9IFRJTUVPVVRfTVMsIC4uLmZldGNoT3B0cyB9ID0gb3B0cztcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgdGltZW91dCk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtTVVBBQkFTRV9BTk9OfWAsXG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgJ1ByZWZlcic6ICdyZXR1cm49cmVwcmVzZW50YXRpb24nLFxuICAgICAgLi4uKChmZXRjaE9wdHMuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSA/PyB7fSksXG4gICAgfTtcblxuICAgIHJldHVybiBhd2FpdCBmZXRjaChgJHtTVVBBQkFTRV9VUkx9JHtwYXRofWAsIHtcbiAgICAgIC4uLmZldGNoT3B0cyxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvciAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykge1xuICAgICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcignVGltZW91dDogc2Vydmlkb3Igblx1MDBFM28gcmVzcG9uZGV1JywgeyBwYXRoIH0pO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdFcnJvIGRlIHJlZGUnLCB7IHBhdGgsIGNhdXNlOiBTdHJpbmcoZSkgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VHZXQ8VD4oXG4gIHRhYmxlOiBzdHJpbmcsXG4gIHF1ZXJ5ID0gJydcbik6IFByb21pc2U8VFtdPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvcmVzdC92MS8ke3RhYmxlfSR7cXVlcnkgPyAnPycgKyBxdWVyeSA6ICcnfWApO1xuICBpZiAoIXJlc3Aub2spIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYEdFVCAke3RhYmxlfSBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMgfSk7XG4gIHJldHVybiByZXNwLmpzb24oKSBhcyBQcm9taXNlPFRbXT47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdXBhYmFzZVBvc3Q8VD4oXG4gIHRhYmxlOiBzdHJpbmcsXG4gIGRhdGE6IFBhcnRpYWw8VD5cbik6IFByb21pc2U8VD4ge1xuICBjb25zdCByZXNwID0gYXdhaXQgc3VwYWJhc2VGZXRjaChgL3Jlc3QvdjEvJHt0YWJsZX1gLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gIH0pO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgUE9TVCAke3RhYmxlfSBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHkgfSk7XG4gIH1cbiAgY29uc3Qgcm93cyA9IGF3YWl0IHJlc3AuanNvbigpIGFzIFRbXTtcbiAgcmV0dXJuIHJvd3NbMF0hO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VQYXRjaDxUPihcbiAgdGFibGU6IHN0cmluZyxcbiAgcXVlcnk6IHN0cmluZyxcbiAgZGF0YTogUGFydGlhbDxUPlxuKTogUHJvbWlzZTxUW10+IHtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IHN1cGFiYXNlRmV0Y2goYC9yZXN0L3YxLyR7dGFibGV9PyR7cXVlcnl9YCwge1xuICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgfSk7XG4gIGlmICghcmVzcC5vaykge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXNwLnRleHQoKTtcbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKGBQQVRDSCAke3RhYmxlfSBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHkgfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3AuanNvbigpIGFzIFByb21pc2U8VFtdPjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGxGdW5jdGlvbjxUPihuYW1lOiBzdHJpbmcsIGJvZHk6IHVua25vd24pOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IHN1cGFiYXNlRmV0Y2goYC9mdW5jdGlvbnMvdjEvJHtuYW1lfWAsIHtcbiAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgfSk7XG4gIGlmICghcmVzcC5vaykge1xuICAgIGNvbnN0IGVyciA9IGF3YWl0IHJlc3AudGV4dCgpO1xuICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYEVkZ2UgRnVuY3Rpb24gJHtuYW1lfSBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHk6IGVyciB9KTtcbiAgfVxuICByZXR1cm4gcmVzcC5qc29uKCkgYXMgUHJvbWlzZTxUPjtcbn1cblxuZXhwb3J0IHsgU1VQQUJBU0VfVVJMLCBTVVBBQkFTRV9BTk9OIH07XG4iLCAidHlwZSBMb2dMZXZlbCA9ICdkZWJ1ZycgfCAnaW5mbycgfCAnd2FybicgfCAnZXJyb3InO1xuXG5pbnRlcmZhY2UgTG9nRW50cnkge1xuICBsZXZlbDogTG9nTGV2ZWw7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgdGltZXN0YW1wOiBzdHJpbmc7XG4gIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbn1cblxuY2xhc3MgTG9nZ2VyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBwcmVmaXg6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihwcmVmaXggPSAnR2VsYW1vdXInKSB7XG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXg7XG4gIH1cblxuICBwcml2YXRlIGxvZyhsZXZlbDogTG9nTGV2ZWwsIG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3QgZW50cnk6IExvZ0VudHJ5ID0ge1xuICAgICAgbGV2ZWwsXG4gICAgICBtZXNzYWdlLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBjb250ZXh0LFxuICAgIH07XG5cbiAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgIGRlYnVnOiAnY29sb3I6ICM2QjcyODAnLFxuICAgICAgaW5mbzogICdjb2xvcjogIzNCODJGNicsXG4gICAgICB3YXJuOiAgJ2NvbG9yOiAjRjU5RTBCJyxcbiAgICAgIGVycm9yOiAnY29sb3I6ICNFRjQ0NDQ7IGZvbnQtd2VpZ2h0OiBib2xkJyxcbiAgICB9W2xldmVsXTtcblxuICAgIGNvbnN0IGZvcm1hdHRlZCA9IGBbJHt0aGlzLnByZWZpeH1dICR7ZW50cnkudGltZXN0YW1wfSAke21lc3NhZ2V9YDtcblxuICAgIGlmIChsZXZlbCA9PT0gJ2Vycm9yJykge1xuICAgICAgY29uc29sZS5lcnJvcihgJWMke2Zvcm1hdHRlZH1gLCBzdHlsZSwgY29udGV4dCA/PyAnJyk7XG4gICAgfSBlbHNlIGlmIChsZXZlbCA9PT0gJ3dhcm4nKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhgJWMke2Zvcm1hdHRlZH1gLCBzdHlsZSwgY29udGV4dCA/PyAnJyk7XG4gICAgfVxuICB9XG5cbiAgZGVidWcobXNnOiBzdHJpbmcsIGN0eD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7IHRoaXMubG9nKCdkZWJ1ZycsIG1zZywgY3R4KTsgfVxuICBpbmZvKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgIHsgdGhpcy5sb2coJ2luZm8nLCAgbXNnLCBjdHgpOyB9XG4gIHdhcm4obXNnOiBzdHJpbmcsIGN0eD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCAgeyB0aGlzLmxvZygnd2FybicsICBtc2csIGN0eCk7IH1cbiAgZXJyb3IobXNnOiBzdHJpbmcsIGN0eD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7IHRoaXMubG9nKCdlcnJvcicsIG1zZywgY3R4KTsgfVxuXG4gIGNoaWxkKHByZWZpeDogc3RyaW5nKTogTG9nZ2VyIHsgcmV0dXJuIG5ldyBMb2dnZXIoYCR7dGhpcy5wcmVmaXh9OiR7cHJlZml4fWApOyB9XG59XG5cbmV4cG9ydCBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG4iLCAiaW1wb3J0IHR5cGUgeyBJQ2xpZW50ZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9yZXBvc2l0b3JpZXMvSUNsaWVudGVSZXBvc2l0b3J5JztcbmltcG9ydCB7IENsaWVudGUgfSBmcm9tICcuLi8uLi9kb21haW4vY2xpZW50ZSc7XG5pbXBvcnQgeyB0cnlBc3luYywgdHlwZSBSZXN1bHQgfSBmcm9tICcuLi8uLi9jb3JlL3Jlc3VsdCc7XG5pbXBvcnQgeyBzdXBhYmFzZUdldCwgc3VwYWJhc2VQb3N0LCBzdXBhYmFzZVBhdGNoIH0gZnJvbSAnLi9jbGllbnQnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ0NsaWVudGVSZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBDbGllbnRlUmVwb3NpdG9yeSBpbXBsZW1lbnRzIElDbGllbnRlUmVwb3NpdG9yeSB7XG4gIGFzeW5jIGZpbmRCeVRlbGVmb25lKHRlbGVmb25lOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDxDbGllbnRlIHwgbnVsbD4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgbG9nLmRlYnVnKCdmaW5kQnlUZWxlZm9uZScsIHsgdGVsZWZvbmU6IGAqKioke3RlbGVmb25lLnNsaWNlKC00KX1gIH0pO1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHN1cGFiYXNlR2V0PFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+PihcbiAgICAgICAgJ2NsaWVudGVzJyxcbiAgICAgICAgYHRlbGVmb25lPWVxLiR7dGVsZWZvbmV9JmxpbWl0PTFgXG4gICAgICApO1xuICAgICAgcmV0dXJuIHJvd3NbMF0gPyBDbGllbnRlLmZyb21EQihyb3dzWzBdKSA6IG51bGw7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzYXZlKGNsaWVudGU6IENsaWVudGUpOiBQcm9taXNlPFJlc3VsdDxDbGllbnRlPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByb3cgPSBhd2FpdCBzdXBhYmFzZVBvc3Q8UmV0dXJuVHlwZTxDbGllbnRlWyd0b0pTT04nXT4+KFxuICAgICAgICAnY2xpZW50ZXMnLFxuICAgICAgICBjbGllbnRlLnRvSlNPTigpXG4gICAgICApO1xuICAgICAgcmV0dXJuIENsaWVudGUuZnJvbURCKHJvdyk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVFbmRlcmVjbyhpZDogbnVtYmVyLCBlbmRlcmVjbzogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8dm9pZD4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc3VwYWJhc2VQYXRjaCgnY2xpZW50ZXMnLCBgaWQ9ZXEuJHtpZH1gLCB7IGVuZGVyZWNvIH0pO1xuICAgIH0pO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vY29yZS9lcnJvcnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEl0ZW1QZWRpZG8ge1xuICByZWFkb25seSBub21lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByZWNvOiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIFN0YXR1c1BlZGlkbyA9ICdwZW5kZW50ZScgfCAnY29uZmlybWFkbycgfCAnY2FuY2VsYWRvJztcbmV4cG9ydCB0eXBlIFN0YXR1c1BhZ2FtZW50byA9ICdhZ3VhcmRhbmRvJyB8ICdwYWdvJyB8ICdmYWxob3UnO1xuZXhwb3J0IHR5cGUgVGlwb1BhZ2FtZW50byA9ICdQaXgnIHwgJ0RpbmhlaXJvJyB8ICdDYXJ0XHUwMEUzbyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGVkaWRvUHJvcHMge1xuICBpZD86IG51bWJlcjtcbiAgbm9tZTogc3RyaW5nO1xuICB0ZWxlZm9uZTogc3RyaW5nO1xuICBlbmRlcmVjbzogc3RyaW5nO1xuICBwYWdhbWVudG86IFRpcG9QYWdhbWVudG87XG4gIGl0ZW5zOiBJdGVtUGVkaWRvW107XG4gIHRvdGFsOiBudW1iZXI7XG4gIHN0YXR1czogU3RhdHVzUGVkaWRvO1xuICBzdGF0dXNfcGFnYW1lbnRvPzogU3RhdHVzUGFnYW1lbnRvO1xuICBvYnNlcnZhY2FvPzogc3RyaW5nO1xuICBhc2Fhc19wYXltZW50X2lkPzogc3RyaW5nO1xuICBjbGllbnRlX2lkPzogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUGVkaWRvIHtcbiAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHByb3BzOiBQZWRpZG9Qcm9wcykge31cblxuICBzdGF0aWMgY3JlYXRlKHByb3BzOiBPbWl0PFBlZGlkb1Byb3BzLCAnc3RhdHVzJyB8ICd0b3RhbCc+KTogUGVkaWRvIHtcbiAgICBpZiAoIXByb3BzLml0ZW5zLmxlbmd0aCkgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignUGVkaWRvIGRldmUgdGVyIGFvIG1lbm9zIDEgaXRlbScpO1xuICAgIGlmICghcHJvcHMubm9tZS50cmltKCkpIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ05vbWUgb2JyaWdhdFx1MDBGM3JpbycpO1xuICAgIGlmICghcHJvcHMuZW5kZXJlY28udHJpbSgpKSB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdFbmRlcmVcdTAwRTdvIG9icmlnYXRcdTAwRjNyaW8nKTtcbiAgICBjb25zdCB0b3RhbCA9IHByb3BzLml0ZW5zLnJlZHVjZSgocywgaSkgPT4gTWF0aC5yb3VuZCgocyArIGkucHJlY28pICogMTAwKSAvIDEwMCwgMCk7XG4gICAgcmV0dXJuIG5ldyBQZWRpZG8oeyAuLi5wcm9wcywgdG90YWwsIHN0YXR1czogJ3BlbmRlbnRlJyB9KTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tREIocmF3OiBQZWRpZG9Qcm9wcyk6IFBlZGlkbyB7IHJldHVybiBuZXcgUGVkaWRvKHJhdyk7IH1cblxuICBnZXQgaWQoKTogbnVtYmVyIHwgdW5kZWZpbmVkIHsgcmV0dXJuIHRoaXMucHJvcHMuaWQ7IH1cbiAgZ2V0IHRvdGFsKCk6IG51bWJlciB7IHJldHVybiB0aGlzLnByb3BzLnRvdGFsOyB9XG4gIGdldCBpdGVucygpOiByZWFkb25seSBJdGVtUGVkaWRvW10geyByZXR1cm4gdGhpcy5wcm9wcy5pdGVuczsgfVxuICBnZXQgcGFnYW1lbnRvKCk6IFRpcG9QYWdhbWVudG8geyByZXR1cm4gdGhpcy5wcm9wcy5wYWdhbWVudG87IH1cbiAgZ2V0IHN0YXR1c1BhZ2FtZW50bygpOiBTdGF0dXNQYWdhbWVudG8gfCB1bmRlZmluZWQgeyByZXR1cm4gdGhpcy5wcm9wcy5zdGF0dXNfcGFnYW1lbnRvOyB9XG5cbiAgZm9ybWF0YXJNZW5zYWdlbVdBKHdhTnVtYmVyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGl0ZW5zU3RyID0gdGhpcy5wcm9wcy5pdGVucy5tYXAoaSA9PlxuICAgICAgYFx1MjVCOCAke2kubm9tZX0gXHUyMDE0IFIkICR7aS5wcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfWBcbiAgICApLmpvaW4oJ1xcbicpO1xuICAgIGNvbnN0IG1zZyA9IFtcbiAgICAgICdcdUQ4M0RcdURFQ0RcdUZFMEYgKk5PVk8gUEVESURPIFx1MjAxNCBHRUxBTU9VUionLFxuICAgICAgJycsXG4gICAgICBpdGVuc1N0cixcbiAgICAgICcnLFxuICAgICAgYCpUb3RhbDogUiQgJHt0aGlzLnByb3BzLnRvdGFsLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyl9KmAsXG4gICAgICBgKlBhZ2FtZW50bzogJHt0aGlzLnByb3BzLnBhZ2FtZW50b30qYCxcbiAgICAgICcnLFxuICAgICAgYFx1RDgzRFx1REM2NCAke3RoaXMucHJvcHMubm9tZX1gLFxuICAgICAgYFx1RDgzRFx1RENDRCAke3RoaXMucHJvcHMuZW5kZXJlY299YCxcbiAgICAgIHRoaXMucHJvcHMub2JzZXJ2YWNhbyA/IGBcdUQ4M0RcdURDREQgJHt0aGlzLnByb3BzLm9ic2VydmFjYW99YCA6ICcnLFxuICAgIF0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oJ1xcbicpO1xuICAgIHJldHVybiBgaHR0cHM6Ly93YS5tZS8ke3dhTnVtYmVyfT90ZXh0PSR7ZW5jb2RlVVJJQ29tcG9uZW50KG1zZyl9YDtcbiAgfVxuXG4gIHRvSlNPTigpOiBQZWRpZG9Qcm9wcyB7IHJldHVybiB7IC4uLnRoaXMucHJvcHMgfTsgfVxufVxuIiwgImltcG9ydCB0eXBlIHsgSVBlZGlkb1JlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9yZXBvc2l0b3JpZXMvSVBlZGlkb1JlcG9zaXRvcnknO1xuaW1wb3J0IHsgUGVkaWRvIH0gZnJvbSAnLi4vLi4vZG9tYWluL3BlZGlkbyc7XG5pbXBvcnQgdHlwZSB7IFBlZGlkb1Byb3BzIH0gZnJvbSAnLi4vLi4vZG9tYWluL3BlZGlkbyc7XG5pbXBvcnQgeyB0cnlBc3luYywgdHlwZSBSZXN1bHQgfSBmcm9tICcuLi8uLi9jb3JlL3Jlc3VsdCc7XG5pbXBvcnQgeyBzdXBhYmFzZUZldGNoLCBzdXBhYmFzZVBhdGNoIH0gZnJvbSAnLi9jbGllbnQnO1xuaW1wb3J0IHsgU1VQQUJBU0VfVVJMLCBTVVBBQkFTRV9BTk9OIH0gZnJvbSAnLi9jbGllbnQnO1xuaW1wb3J0IHsgTmV0d29ya0Vycm9yIH0gZnJvbSAnLi4vLi4vY29yZS9lcnJvcnMnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ1BlZGlkb1JlcG8nKTtcblxuZXhwb3J0IGNsYXNzIFBlZGlkb1JlcG9zaXRvcnkgaW1wbGVtZW50cyBJUGVkaWRvUmVwb3NpdG9yeSB7XG4gIGFzeW5jIHNhdmUocGVkaWRvOiBQZWRpZG8pOiBQcm9taXNlPFJlc3VsdDxQZWRpZG8+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGxvZy5pbmZvKCdTYWx2YW5kbyBwZWRpZG8nLCB7IHRvdGFsOiBwZWRpZG8udG90YWwgfSk7XG4gICAgICAvLyBVc2EgaGVhZGVycy1vbmx5IHBhcmEgb2J0ZXIgbyBJRCB2aWEgTG9jYXRpb25cbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvcmVzdC92MS9wZWRpZG9zYCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczogeyAnUHJlZmVyJzogJ3JldHVybj1oZWFkZXJzLW9ubHknIH0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGVkaWRvLnRvSlNPTigpKSxcbiAgICAgIH0pO1xuICAgICAgaWYgKCFyZXNwLm9rKSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXNwLnRleHQoKTtcbiAgICAgICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgUE9TVCBwZWRpZG9zIGZhbGhvdWAsIHsgc3RhdHVzOiByZXNwLnN0YXR1cywgYm9keSB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxvYyA9IHJlc3AuaGVhZGVycy5nZXQoJ0xvY2F0aW9uJykgPz8gJyc7XG4gICAgICBjb25zdCBpZE1hdGNoID0gbG9jLm1hdGNoKC9pZD1lcVxcLihcXGQrKS8pO1xuICAgICAgaWYgKCFpZE1hdGNoKSB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdJRCBkbyBwZWRpZG8gblx1MDBFM28gcmV0b3JuYWRvJyk7XG4gICAgICBjb25zdCBpZCA9IHBhcnNlSW50KGlkTWF0Y2hbMV0hLCAxMCk7XG4gICAgICByZXR1cm4gUGVkaWRvLmZyb21EQih7IC4uLnBlZGlkby50b0pTT04oKSwgaWQgfSBhcyBQZWRpZG9Qcm9wcyk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVTdGF0dXMoaWQ6IG51bWJlciwgY2xpZW50ZUlkOiBudW1iZXIsIHN0YXR1czogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8dm9pZD4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc3VwYWJhc2VQYXRjaChcbiAgICAgICAgJ3BlZGlkb3MnLFxuICAgICAgICBgaWQ9ZXEuJHtpZH0mY2xpZW50ZV9pZD1lcS4ke2NsaWVudGVJZH1gLFxuICAgICAgICB7IHN0YXR1cyB9XG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZmluZEJ5SWQoaWQ6IG51bWJlcik6IFByb21pc2U8UmVzdWx0PFBlZGlkbyB8IG51bGw+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBmZXRjaChcbiAgICAgICAgYCR7U1VQQUJBU0VfVVJMfS9yZXN0L3YxL3BlZGlkb3M/aWQ9ZXEuJHtpZH0mc2VsZWN0PXN0YXR1c19wYWdhbWVudG9gLFxuICAgICAgICB7IGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke1NVUEFCQVNFX0FOT059YCB9IH1cbiAgICAgICk7XG4gICAgICBpZiAoIXJlc3Aub2spIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoJ0dFVCBwZWRpZG8gZmFsaG91JywgeyBzdGF0dXM6IHJlc3Auc3RhdHVzIH0pO1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHJlc3AuanNvbigpIGFzIFBlZGlkb1Byb3BzW107XG4gICAgICByZXR1cm4gcm93c1swXSA/IFBlZGlkby5mcm9tREIocm93c1swXSkgOiBudWxsO1xuICAgIH0pO1xuICB9XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBJUm9sZXRhUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL3JlcG9zaXRvcmllcy9JUm9sZXRhUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IFBhcnRpY2lwYWNhb1Byb3BzIH0gZnJvbSAnLi4vLi4vZG9tYWluL3JvbGV0YSc7XG5pbXBvcnQgeyB0cnlBc3luYywgdHlwZSBSZXN1bHQgfSBmcm9tICcuLi8uLi9jb3JlL3Jlc3VsdCc7XG5pbXBvcnQgeyBzdXBhYmFzZUdldCwgc3VwYWJhc2VQb3N0LCBzdXBhYmFzZVBhdGNoIH0gZnJvbSAnLi9jbGllbnQnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ1JvbGV0YVJlcG8nKTtcblxuZXhwb3J0IGNsYXNzIFJvbGV0YVJlcG9zaXRvcnkgaW1wbGVtZW50cyBJUm9sZXRhUmVwb3NpdG9yeSB7XG4gIGFzeW5jIGZpbmRQYXJ0aWNpcGFjYW9BdGl2YShcbiAgICB0ZWxlZm9uZTogc3RyaW5nLFxuICAgIHNlbWFuYTogc3RyaW5nXG4gICk6IFByb21pc2U8UmVzdWx0PFBhcnRpY2lwYWNhb1Byb3BzIHwgbnVsbD4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgbG9nLmRlYnVnKCdmaW5kUGFydGljaXBhY2FvQXRpdmEnLCB7IHNlbWFuYSB9KTtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDxQYXJ0aWNpcGFjYW9Qcm9wcz4oXG4gICAgICAgICdyb2xldGFfcGFydGljaXBhY29lcycsXG4gICAgICAgIGB0ZWxlZm9uZT1lcS4ke3RlbGVmb25lfSZzZW1hbmE9ZXEuJHtzZW1hbmF9Jm9yZGVyPWNyZWF0ZWRfYXQuZGVzYyZsaW1pdD0xYFxuICAgICAgKTtcbiAgICAgIHJldHVybiByb3dzWzBdID8/IG51bGw7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzYXZlUGFydGljaXBhY2FvKFxuICAgIGRhdGE6IFBhcnRpYWw8UGFydGljaXBhY2FvUHJvcHM+XG4gICk6IFByb21pc2U8UmVzdWx0PFBhcnRpY2lwYWNhb1Byb3BzPj4ge1xuICAgIC8vIFNlIHRlbSBpZCwgZmF6IFBBVENIOyBzZW5cdTAwRTNvIElOU0VSVFxuICAgIGlmIChkYXRhLmlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgaWQsIC4uLnBhdGNoIH0gPSBkYXRhO1xuICAgICAgICBjb25zdCByb3dzID0gYXdhaXQgc3VwYWJhc2VQYXRjaDxQYXJ0aWNpcGFjYW9Qcm9wcz4oXG4gICAgICAgICAgJ3JvbGV0YV9wYXJ0aWNpcGFjb2VzJyxcbiAgICAgICAgICBgaWQ9ZXEuJHtpZH1gLFxuICAgICAgICAgIHBhdGNoXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiAocm93c1swXSA/PyB7IC4uLmRhdGEgfSkgYXMgUGFydGljaXBhY2FvUHJvcHM7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRyeUFzeW5jKCgpID0+XG4gICAgICBzdXBhYmFzZVBvc3Q8UGFydGljaXBhY2FvUHJvcHM+KCdyb2xldGFfcGFydGljaXBhY29lcycsIGRhdGEpXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGNvdW50VmVuY2Vkb3Jlc1NlbWFuYShzZW1hbmE6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PG51bWJlcj4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHN1cGFiYXNlR2V0PHsgaWQ6IG51bWJlciB9PihcbiAgICAgICAgJ3JvbGV0YV92ZW5jZWRvcmVzJyxcbiAgICAgICAgYHNlbWFuYT1lcS4ke3NlbWFuYX0mc2VsZWN0PWlkYFxuICAgICAgKTtcbiAgICAgIHJldHVybiByb3dzLmxlbmd0aDtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVWZW5jZWRvcihcbiAgICB0ZWxlZm9uZTogc3RyaW5nLFxuICAgIG5vbWU6IHN0cmluZyxcbiAgICBwcmVtaW86IHN0cmluZyxcbiAgICBzZW1hbmE6IHN0cmluZ1xuICApOiBQcm9taXNlPFJlc3VsdDx2b2lkPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzdXBhYmFzZVBvc3QoJ3JvbGV0YV92ZW5jZWRvcmVzJywgeyB0ZWxlZm9uZSwgbm9tZSwgcHJlbWlvLCBzZW1hbmEgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsICJ0eXBlIEhhbmRsZXI8VD4gPSAocGF5bG9hZDogVCkgPT4gdm9pZDtcblxuaW50ZXJmYWNlIEV2ZW50TWFwIHtcbiAgJ2F1dGg6bG9naW4nOiB7IGNsaWVudGU6IGltcG9ydCgnLi4vZG9tYWluL2NsaWVudGUnKS5DbGllbnRlIH07XG4gICdhdXRoOmxvZ291dCc6IHZvaWQ7XG4gICdjYXJ0OnVwZGF0ZWQnOiB7IGNvdW50OiBudW1iZXI7IHRvdGFsOiBudW1iZXIgfTtcbiAgJ3BheW1lbnQ6c3VjY2Vzcyc6IHsgcGVkaWRvSWQ6IG51bWJlcjsgdmFsb3I6IG51bWJlciB9O1xuICAncGF5bWVudDpmYWlsZWQnOiB7IGVycm9yOiBzdHJpbmcgfTtcbiAgJ3JvbGV0YTpwcmVtaW8nOiB7IHByZW1pbzogc3RyaW5nIH07XG4gICd1aTp0b2FzdCc6IHsgbWVzc2FnZTogc3RyaW5nOyB0aXBvOiAnb2snIHwgJ2Vycm8nIHwgJ2luZm8nIH07XG59XG5cbmNsYXNzIFR5cGVkRXZlbnRCdXMge1xuICBwcml2YXRlIGhhbmRsZXJzID0gbmV3IE1hcDxzdHJpbmcsIFNldDxIYW5kbGVyPHVua25vd24+Pj4oKTtcblxuICBvbjxLIGV4dGVuZHMga2V5b2YgRXZlbnRNYXA+KFxuICAgIGV2ZW50OiBLLFxuICAgIGhhbmRsZXI6IEhhbmRsZXI8RXZlbnRNYXBbS10+XG4gICk6ICgpID0+IHZvaWQge1xuICAgIGlmICghdGhpcy5oYW5kbGVycy5oYXMoZXZlbnQpKSB0aGlzLmhhbmRsZXJzLnNldChldmVudCwgbmV3IFNldCgpKTtcbiAgICB0aGlzLmhhbmRsZXJzLmdldChldmVudCkhLmFkZChoYW5kbGVyIGFzIEhhbmRsZXI8dW5rbm93bj4pO1xuICAgIHJldHVybiAoKSA9PiB0aGlzLmhhbmRsZXJzLmdldChldmVudCk/LmRlbGV0ZShoYW5kbGVyIGFzIEhhbmRsZXI8dW5rbm93bj4pO1xuICB9XG5cbiAgZW1pdDxLIGV4dGVuZHMga2V5b2YgRXZlbnRNYXA+KGV2ZW50OiBLLCBwYXlsb2FkOiBFdmVudE1hcFtLXSk6IHZvaWQge1xuICAgIHRoaXMuaGFuZGxlcnMuZ2V0KGV2ZW50KT8uZm9yRWFjaChoID0+IHtcbiAgICAgIHRyeSB7IGgocGF5bG9hZCk7IH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihgRXZlbnRCdXMgZXJyb3Igb24gJHtldmVudH06YCwgZSk7IH1cbiAgICB9KTtcbiAgfVxuXG4gIG9uY2U8SyBleHRlbmRzIGtleW9mIEV2ZW50TWFwPihcbiAgICBldmVudDogSyxcbiAgICBoYW5kbGVyOiBIYW5kbGVyPEV2ZW50TWFwW0tdPlxuICApOiB2b2lkIHtcbiAgICBjb25zdCB1bnN1YiA9IHRoaXMub24oZXZlbnQsIChwYXlsb2FkKSA9PiB7IGhhbmRsZXIocGF5bG9hZCk7IHVuc3ViKCk7IH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBldmVudEJ1cyA9IG5ldyBUeXBlZEV2ZW50QnVzKCk7XG4iLCAidHlwZSBTZWxlY3RvcjxTLCBUPiA9IChzdGF0ZTogUykgPT4gVDtcbnR5cGUgTGlzdGVuZXI8VD4gPSAodmFsdWU6IFQpID0+IHZvaWQ7XG5cbmV4cG9ydCBjbGFzcyBTdG9yZTxTIGV4dGVuZHMgb2JqZWN0PiB7XG4gIHByaXZhdGUgc3RhdGU6IFM7XG4gIHByaXZhdGUgbGlzdGVuZXJzID0gbmV3IE1hcDxzdHJpbmcsIFNldDxMaXN0ZW5lcjx1bmtub3duPj4+KCk7XG4gIHByaXZhdGUgZ2xvYmFsTGlzdGVuZXJzID0gbmV3IFNldDxMaXN0ZW5lcjxTPj4oKTtcblxuICBjb25zdHJ1Y3Rvcihpbml0aWFsU3RhdGU6IFMpIHtcbiAgICB0aGlzLnN0YXRlID0geyAuLi5pbml0aWFsU3RhdGUgfTtcbiAgfVxuXG4gIGdldFN0YXRlKCk6IFJlYWRvbmx5PFM+IHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgfVxuXG4gIHNldFN0YXRlKHVwZGF0ZXI6IFBhcnRpYWw8Uz4gfCAoKHM6IFJlYWRvbmx5PFM+KSA9PiBQYXJ0aWFsPFM+KSk6IHZvaWQge1xuICAgIGNvbnN0IHBhdGNoID0gdHlwZW9mIHVwZGF0ZXIgPT09ICdmdW5jdGlvbidcbiAgICAgID8gdXBkYXRlcih0aGlzLnN0YXRlKVxuICAgICAgOiB1cGRhdGVyO1xuICAgIHRoaXMuc3RhdGUgPSB7IC4uLnRoaXMuc3RhdGUsIC4uLnBhdGNoIH07XG4gICAgdGhpcy5nbG9iYWxMaXN0ZW5lcnMuZm9yRWFjaChsID0+IGwodGhpcy5zdGF0ZSkpO1xuICB9XG5cbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBMaXN0ZW5lcjxTPik6ICgpID0+IHZvaWQge1xuICAgIHRoaXMuZ2xvYmFsTGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gICAgcmV0dXJuICgpID0+IHRoaXMuZ2xvYmFsTGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH1cblxuICBzZWxlY3Q8VD4oc2VsZWN0b3I6IFNlbGVjdG9yPFMsIFQ+LCBsaXN0ZW5lcjogTGlzdGVuZXI8VD4pOiAoKSA9PiB2b2lkIHtcbiAgICBsZXQgcHJldiA9IHNlbGVjdG9yKHRoaXMuc3RhdGUpO1xuICAgIHJldHVybiB0aGlzLnN1YnNjcmliZShzdGF0ZSA9PiB7XG4gICAgICBjb25zdCBuZXh0ID0gc2VsZWN0b3Ioc3RhdGUpO1xuICAgICAgaWYgKG5leHQgIT09IHByZXYpIHtcbiAgICAgICAgcHJldiA9IG5leHQ7XG4gICAgICAgIGxpc3RlbmVyKG5leHQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgU3RvcmUgfSBmcm9tICcuL1N0b3JlJztcbmltcG9ydCB0eXBlIHsgQ2xpZW50ZSB9IGZyb20gJy4uL2RvbWFpbi9jbGllbnRlJztcblxuZXhwb3J0IGludGVyZmFjZSBBcHBTdGF0ZSB7XG4gIHJlYWRvbmx5IGNsaWVudGU6IENsaWVudGUgfCBudWxsO1xuICByZWFkb25seSBpc0xvZ2dlZEluOiBib29sZWFuO1xuICByZWFkb25seSBpc0FkbWluOiBib29sZWFuO1xuICByZWFkb25seSBjYXJyaW5ob0NvdW50OiBudW1iZXI7XG4gIHJlYWRvbmx5IGNhcnJpbmhvVG90YWw6IG51bWJlcjtcbiAgcmVhZG9ubHkgcGFnYW1lbnRvU2VsZWNpb25hZG86IHN0cmluZztcbiAgcmVhZG9ubHkgcGVkaWRvSWRQZW5kZW50ZTogbnVtYmVyIHwgbnVsbDtcbiAgcmVhZG9ubHkgcGl4RGF0YTogUGl4RGF0YSB8IG51bGw7XG4gIHJlYWRvbmx5IHJvbGV0YUF0aXZhOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBpeERhdGEge1xuICByZWFkb25seSBxckNvZGU6IHN0cmluZztcbiAgcmVhZG9ubHkgcGl4Q29waWFFQ29sYTogc3RyaW5nO1xuICByZWFkb25seSBhc2Fhc1BheW1lbnRJZDogc3RyaW5nO1xuICByZWFkb25seSBwZWRpZG9JZDogbnVtYmVyO1xufVxuXG5jb25zdCBBRE1JTl9URUwgPSBhdG9iKCdNVEU1TkRBM056STNOVEE9Jyk7XG5jb25zdCBDT05UQV9URVNURSA9IGF0b2IoJ01URTVOalV3TXpBd056WT0nKTtcblxuZnVuY3Rpb24gY2FsY0lzQWRtaW4oY2xpZW50ZTogQ2xpZW50ZSB8IG51bGwpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhY2xpZW50ZSAmJiBjbGllbnRlLnRlbGVmb25lID09PSBBRE1JTl9URUw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRhVGVzdGUoY2xpZW50ZTogQ2xpZW50ZSB8IG51bGwpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhY2xpZW50ZSAmJiBjbGllbnRlLnRlbGVmb25lID09PSBDT05UQV9URVNURTtcbn1cblxuZXhwb3J0IGNvbnN0IGFwcFN0b3JlID0gbmV3IFN0b3JlPEFwcFN0YXRlPih7XG4gIGNsaWVudGU6IG51bGwsXG4gIGlzTG9nZ2VkSW46IGZhbHNlLFxuICBpc0FkbWluOiBmYWxzZSxcbiAgY2FycmluaG9Db3VudDogMCxcbiAgY2FycmluaG9Ub3RhbDogMCxcbiAgcGFnYW1lbnRvU2VsZWNpb25hZG86ICcnLFxuICBwZWRpZG9JZFBlbmRlbnRlOiBudWxsLFxuICBwaXhEYXRhOiBudWxsLFxuICByb2xldGFBdGl2YTogZmFsc2UsXG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldENsaWVudGUoY2xpZW50ZTogQ2xpZW50ZSB8IG51bGwpOiB2b2lkIHtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoe1xuICAgIGNsaWVudGUsXG4gICAgaXNMb2dnZWRJbjogISFjbGllbnRlLFxuICAgIGlzQWRtaW46IGNhbGNJc0FkbWluKGNsaWVudGUpLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENhcnJpbmhvKGNvdW50OiBudW1iZXIsIHRvdGFsOiBudW1iZXIpOiB2b2lkIHtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBjYXJyaW5ob0NvdW50OiBjb3VudCwgY2FycmluaG9Ub3RhbDogdG90YWwgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQYWdhbWVudG8odGlwbzogc3RyaW5nKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGFnYW1lbnRvU2VsZWNpb25hZG86IHRpcG8gfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQaXhEYXRhKGRhdGE6IFBpeERhdGEgfCBudWxsKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGl4RGF0YTogZGF0YSB9KTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IElDbGllbnRlUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL3JlcG9zaXRvcmllcy9JQ2xpZW50ZVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgQ2xpZW50ZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9jbGllbnRlJztcbmltcG9ydCB7IHR5cGUgUmVzdWx0LCBvaywgZmFpbCwgdHJ5QXN5bmMgfSBmcm9tICcuLi8uLi9jb3JlL3Jlc3VsdCc7XG5pbXBvcnQgeyBSYXRlTGltaXRFcnJvciwgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vLi4vY29yZS9lcnJvcnMnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xuaW1wb3J0IHsgZXZlbnRCdXMgfSBmcm9tICcuLi8uLi9jb3JlL2V2ZW50cyc7XG5pbXBvcnQgeyBzZXRDbGllbnRlIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RvcmUnO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ0xvZ2luVXNlQ2FzZScpO1xuXG5jb25zdCBTRVNTSU9OX0tFWSA9ICdnZWxhbW91cl9jbGllbnRlJztcbmNvbnN0IFNFU1NJT05fVFNfS0VZID0gJ2dlbGFtb3VyX3RzJztcbmNvbnN0IFNFU1NJT05fVFRMX01TID0gMjQgKiA2MCAqIDYwICogMTAwMDtcblxuaW50ZXJmYWNlIFJhdGVMaW1pdGVyIHtcbiAgYXR0ZW1wdHM6IG51bWJlcjtcbiAgYmxvY2tlZFVudGlsOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBMb2dpblVzZUNhc2Uge1xuICBwcml2YXRlIHJhdGVMaW1pdGVyOiBSYXRlTGltaXRlciA9IHsgYXR0ZW1wdHM6IDAsIGJsb2NrZWRVbnRpbDogMCB9O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgY2xpZW50ZVJlcG86IElDbGllbnRlUmVwb3NpdG9yeSkge31cblxuICByZXN0b3JlU2Vzc2lvbigpOiBDbGllbnRlIHwgbnVsbCB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRzID0gTnVtYmVyKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oU0VTU0lPTl9UU19LRVkpID8/ICcwJyk7XG4gICAgICBpZiAoRGF0ZS5ub3coKSAtIHRzID4gU0VTU0lPTl9UVExfTVMpIHtcbiAgICAgICAgdGhpcy5jbGVhclNlc3Npb24oKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCByYXcgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFNFU1NJT05fS0VZKTtcbiAgICAgIGlmICghcmF3KSByZXR1cm4gbnVsbDtcbiAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJhdykgYXMgUmV0dXJuVHlwZTxDbGllbnRlWyd0b0pTT04nXT47XG4gICAgICBjb25zdCBjbGllbnRlID0gQ2xpZW50ZS5mcm9tREIoZGF0YSk7XG4gICAgICBzZXRDbGllbnRlKGNsaWVudGUpO1xuICAgICAgcmV0dXJuIGNsaWVudGU7XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aGlzLmNsZWFyU2Vzc2lvbigpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZSh0ZWxlZm9uZTogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8eyBleGlzdGU6IGJvb2xlYW47IGNsaWVudGU/OiBDbGllbnRlIH0+PiB7XG4gICAgaWYgKERhdGUubm93KCkgPCB0aGlzLnJhdGVMaW1pdGVyLmJsb2NrZWRVbnRpbCkge1xuICAgICAgcmV0dXJuIGZhaWwobmV3IFJhdGVMaW1pdEVycm9yKHRoaXMucmF0ZUxpbWl0ZXIuYmxvY2tlZFVudGlsIC0gRGF0ZS5ub3coKSkpO1xuICAgIH1cblxuICAgIGNvbnN0IHRlbCA9IHRlbGVmb25lLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgaWYgKHRlbC5sZW5ndGggPCAxMCkgcmV0dXJuIGZhaWwobmV3IFZhbGlkYXRpb25FcnJvcignVGVsZWZvbmUgaW52XHUwMEUxbGlkbycpKTtcblxuICAgIGxvZy5pbmZvKCdWZXJpZmljYW5kbyB0ZWxlZm9uZScsIHsgdGVsOiBgKioqJHt0ZWwuc2xpY2UoLTQpfWAgfSk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jbGllbnRlUmVwby5maW5kQnlUZWxlZm9uZSh0ZWwpO1xuXG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHRoaXMucmF0ZUxpbWl0ZXIuYXR0ZW1wdHMrKztcbiAgICAgIGlmICh0aGlzLnJhdGVMaW1pdGVyLmF0dGVtcHRzID49IDUpIHtcbiAgICAgICAgdGhpcy5yYXRlTGltaXRlci5ibG9ja2VkVW50aWwgPSBEYXRlLm5vdygpICsgNjBfMDAwO1xuICAgICAgICB0aGlzLnJhdGVMaW1pdGVyLmF0dGVtcHRzID0gMDtcbiAgICAgICAgcmV0dXJuIGZhaWwobmV3IFJhdGVMaW1pdEVycm9yKDYwXzAwMCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhaWwocmVzdWx0LmVycm9yKTtcbiAgICB9XG5cbiAgICB0aGlzLnJhdGVMaW1pdGVyLmF0dGVtcHRzID0gMDtcbiAgICByZXR1cm4gb2soeyBleGlzdGU6ICEhcmVzdWx0LnZhbHVlLCBjbGllbnRlOiByZXN1bHQudmFsdWUgPz8gdW5kZWZpbmVkIH0pO1xuICB9XG5cbiAgYXN5bmMgcmVnaXN0ZXIobm9tZTogc3RyaW5nLCB0ZWxlZm9uZTogc3RyaW5nLCBlbmRlcmVjbzogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZT4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZW50aXR5ID0gQ2xpZW50ZS5jcmVhdGUoeyBub21lLCB0ZWxlZm9uZSwgZW5kZXJlY28gfSk7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMuY2xpZW50ZVJlcG8uc2F2ZShlbnRpdHkpO1xuICAgICAgaWYgKCFzYXZlZC5vaykgdGhyb3cgc2F2ZWQuZXJyb3I7XG4gICAgICByZXR1cm4gc2F2ZWQudmFsdWU7XG4gICAgfSk7XG4gIH1cblxuICBsb2dpbihjbGllbnRlOiBDbGllbnRlKTogdm9pZCB7XG4gICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShTRVNTSU9OX0tFWSwgSlNPTi5zdHJpbmdpZnkoY2xpZW50ZS50b0pTT04oKSkpO1xuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oU0VTU0lPTl9UU19LRVksIFN0cmluZyhEYXRlLm5vdygpKSk7XG4gICAgc2V0Q2xpZW50ZShjbGllbnRlKTtcbiAgICBldmVudEJ1cy5lbWl0KCdhdXRoOmxvZ2luJywgeyBjbGllbnRlIH0pO1xuICAgIGxvZy5pbmZvKCdMb2dpbiByZWFsaXphZG8nLCB7IGlkOiBjbGllbnRlLmlkIH0pO1xuICB9XG5cbiAgbG9nb3V0KCk6IHZvaWQge1xuICAgIHRoaXMuY2xlYXJTZXNzaW9uKCk7XG4gICAgc2V0Q2xpZW50ZShudWxsKTtcbiAgICBldmVudEJ1cy5lbWl0KCdhdXRoOmxvZ291dCcsIHVuZGVmaW5lZCBhcyB1bmtub3duIGFzIHZvaWQpO1xuICAgIGxvZy5pbmZvKCdMb2dvdXQgcmVhbGl6YWRvJyk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFyU2Vzc2lvbigpOiB2b2lkIHtcbiAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKFNFU1NJT05fS0VZKTtcbiAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKFNFU1NJT05fVFNfS0VZKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGV2ZW50QnVzIH0gZnJvbSAnLi4vLi4vY29yZS9ldmVudHMnO1xuaW1wb3J0IHsgc2V0Q2FycmluaG8gfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdG9yZSc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi8uLi9jb3JlL2xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IEl0ZW1QZWRpZG8gfSBmcm9tICcuLi8uLi9kb21haW4vcGVkaWRvJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdDYXJ0U2VydmljZScpO1xuXG5leHBvcnQgY2xhc3MgQ2FydFNlcnZpY2Uge1xuICBwcml2YXRlIGl0ZW1zID0gbmV3IE1hcDxzdHJpbmcsIEl0ZW1QZWRpZG8+KCk7XG5cbiAgYWRkKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xuICAgIGlmICh0aGlzLml0ZW1zLmhhcyhub21lKSkgcmV0dXJuO1xuICAgIHRoaXMuaXRlbXMuc2V0KG5vbWUsIHsgbm9tZSwgcHJlY286IE51bWJlcihwcmVjbykgfSk7XG4gICAgdGhpcy5ub3RpZnkoKTtcbiAgICBsb2cuZGVidWcoJ0l0ZW0gYWRpY2lvbmFkbycsIHsgbm9tZSB9KTtcbiAgfVxuXG4gIHJlbW92ZShub21lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaXRlbXMuaGFzKG5vbWUpKSByZXR1cm47XG4gICAgdGhpcy5pdGVtcy5kZWxldGUobm9tZSk7XG4gICAgdGhpcy5ub3RpZnkoKTtcbiAgICBsb2cuZGVidWcoJ0l0ZW0gcmVtb3ZpZG8nLCB7IG5vbWUgfSk7XG4gIH1cblxuICB0b2dnbGUobm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogJ2FkZGVkJyB8ICdyZW1vdmVkJyB7XG4gICAgaWYgKHRoaXMuaXRlbXMuaGFzKG5vbWUpKSB7XG4gICAgICB0aGlzLnJlbW92ZShub21lKTtcbiAgICAgIHJldHVybiAncmVtb3ZlZCc7XG4gICAgfVxuICAgIHRoaXMuYWRkKG5vbWUsIHByZWNvKTtcbiAgICByZXR1cm4gJ2FkZGVkJztcbiAgfVxuXG4gIGNsZWFyKCk6IHZvaWQge1xuICAgIHRoaXMuaXRlbXMuY2xlYXIoKTtcbiAgICB0aGlzLm5vdGlmeSgpO1xuICB9XG5cbiAgZ2V0SXRlbXMoKTogcmVhZG9ubHkgSXRlbVBlZGlkb1tdIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLml0ZW1zLnZhbHVlcygpKTtcbiAgfVxuXG4gIGdldFRvdGFsKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5pdGVtcy52YWx1ZXMoKSlcbiAgICAgIC5yZWR1Y2UoKHN1bSwgaSkgPT4gTWF0aC5yb3VuZCgoc3VtICsgaS5wcmVjbykgKiAxMDApIC8gMTAwLCAwKTtcbiAgfVxuXG4gIGdldENvdW50KCk6IG51bWJlciB7IHJldHVybiB0aGlzLml0ZW1zLnNpemU7IH1cblxuICBoYXMobm9tZTogc3RyaW5nKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLml0ZW1zLmhhcyhub21lKTsgfVxuXG4gIGlzRW1wdHkoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLml0ZW1zLnNpemUgPT09IDA7IH1cblxuICByZXZhbGlkYXRlUHJpY2VzKHByaWNlTWFwOiBNYXA8c3RyaW5nLCBudW1iZXI+KTogdm9pZCB7XG4gICAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgICB0aGlzLml0ZW1zLmZvckVhY2goKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgY29uc3QgcmVhbFByaWNlID0gcHJpY2VNYXAuZ2V0KGtleSk7XG4gICAgICBpZiAocmVhbFByaWNlICE9PSB1bmRlZmluZWQgJiYgcmVhbFByaWNlICE9PSBpdGVtLnByZWNvKSB7XG4gICAgICAgIHRoaXMuaXRlbXMuc2V0KGtleSwgeyAuLi5pdGVtLCBwcmVjbzogcmVhbFByaWNlIH0pO1xuICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgbG9nLndhcm4oJ1ByZVx1MDBFN28gcmV2YWxpZGFkbycsIHsgbm9tZToga2V5LCBvbGQ6IGl0ZW0ucHJlY28sIG5ldzogcmVhbFByaWNlIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChjaGFuZ2VkKSB0aGlzLm5vdGlmeSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3RpZnkoKTogdm9pZCB7XG4gICAgc2V0Q2FycmluaG8odGhpcy5nZXRDb3VudCgpLCB0aGlzLmdldFRvdGFsKCkpO1xuICAgIGV2ZW50QnVzLmVtaXQoJ2NhcnQ6dXBkYXRlZCcsIHsgY291bnQ6IHRoaXMuZ2V0Q291bnQoKSwgdG90YWw6IHRoaXMuZ2V0VG90YWwoKSB9KTtcbiAgfVxufVxuIiwgIi8vIENvbXBvc2l0aW9uIFJvb3QgXHUyMDE0IGluc3RhbmNpYSBlIGluamV0YSBkZXBlbmRcdTAwRUFuY2lhc1xuaW1wb3J0IHsgQ2xpZW50ZVJlcG9zaXRvcnkgfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL0NsaWVudGVSZXBvc2l0b3J5JztcbmltcG9ydCB7IFBlZGlkb1JlcG9zaXRvcnkgfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL1BlZGlkb1JlcG9zaXRvcnknO1xuaW1wb3J0IHsgUm9sZXRhUmVwb3NpdG9yeSB9IGZyb20gJy4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUm9sZXRhUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBMb2dpblVzZUNhc2UgfSBmcm9tICcuL2FwcGxpY2F0aW9uL2F1dGgvTG9naW5Vc2VDYXNlJztcbmltcG9ydCB7IENhcnRTZXJ2aWNlIH0gZnJvbSAnLi9hcHBsaWNhdGlvbi9jYXJ0L0NhcnRTZXJ2aWNlJztcblxuY29uc3QgY2xpZW50ZVJlcG9zaXRvcnkgPSBuZXcgQ2xpZW50ZVJlcG9zaXRvcnkoKTtcbmNvbnN0IHBlZGlkb1JlcG9zaXRvcnkgPSBuZXcgUGVkaWRvUmVwb3NpdG9yeSgpO1xuY29uc3Qgcm9sZXRhUmVwb3NpdG9yeSA9IG5ldyBSb2xldGFSZXBvc2l0b3J5KCk7XG5cbmV4cG9ydCBjb25zdCBsb2dpblVzZUNhc2UgPSBuZXcgTG9naW5Vc2VDYXNlKGNsaWVudGVSZXBvc2l0b3J5KTtcbmV4cG9ydCBjb25zdCBjYXJ0U2VydmljZSA9IG5ldyBDYXJ0U2VydmljZSgpO1xuXG5leHBvcnQgeyBjbGllbnRlUmVwb3NpdG9yeSwgcGVkaWRvUmVwb3NpdG9yeSwgcm9sZXRhUmVwb3NpdG9yeSB9O1xuIiwgImltcG9ydCB0eXBlIHsgUm9sZXRhQ29uZmlnIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgcm9sZXRhUmVwb3NpdG9yeSB9IGZyb20gJy4uL2NvbnRhaW5lcic7XG5pbXBvcnQgeyBSb2xldGFEb21haW4gfSBmcm9tICcuLi9kb21haW4vcm9sZXRhJztcbmltcG9ydCB7IHN1cGFiYXNlR2V0IH0gZnJvbSAnLi4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvY2xpZW50JztcbmltcG9ydCB7IGdldFNlbWFuYUF0dWFsIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGVzY0hUTUwgfSBmcm9tICcuLi91dGlscy9zZWN1cml0eSc7XG5pbXBvcnQgeyBtb3N0cmFyVG9hc3QgfSBmcm9tICcuLi91dGlscy90b2FzdCc7XG5pbXBvcnQgeyBpc0NvbnRhVGVzdGUgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdG9yZSc7XG5pbXBvcnQgeyBhcHBTdG9yZSB9IGZyb20gJy4uL3N0YXRlL0FwcFN0b3JlJztcbmltcG9ydCB0eXBlIHsgQ2xpZW50ZSB9IGZyb20gJy4uL3R5cGVzJztcblxuY29uc3QgUFJFTUlPU19QQURSQU86IHN0cmluZ1tdID0gW1xuICAnXHVEODNDXHVERjgxIDUlIE9GRiBcdTIwMTQgQ29tcHJhcyBhY2ltYSBkZSBSJDM1JyxcbiAgJ1x1RDgzQ1x1REY2QiBCcm93bmllIFRyYWRpY2lvbmFsIEdyXHUwMEUxdGlzIFx1MjAxNCBDb21wcmFzIGFjaW1hIGRlIFIkNTAnLFxuICAnXHVEODNDXHVERjgxIDEwJSBPRkYgXHUyMDE0IENvbXByYXMgYWNpbWEgZGUgUiQ1MCcsXG4gICdcdUQ4M0RcdURDRjggU2lnYSBhIEdlbGFtb3VyIG5vIEluc3RhZ3JhbScsXG4gICdcdUQ4M0RcdURFQ0RcdUZFMEYgQ29tcHJlIDIgZSBMZXZlIFx1MjAxNCBBdFx1MDBFOSBSJDE0IGVtIHByb2R1dG9zJyxcbiAgJ1x1RDgzRFx1REUxNSBOXHUwMEUzbyBGb2kgRGVzc2EgVmV6IFx1MjAxNCBHYW5oYSA1JSBPRkYgYWNpbWEgZGUgUiQzNScsXG5dO1xuXG5sZXQgX3ByZW1pb3M6IHN0cmluZ1tdID0gWy4uLlBSRU1JT1NfUEFEUkFPXTtcbmxldCBfcm90YWNhb0F0dWFsID0gMDtcbmxldCBfZ2lyYW5kbyA9IGZhbHNlO1xubGV0IF9wYXJ0aWNpcGFjYW9JZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmVtaW9zUGFkcmFvKCk6IHN0cmluZ1tdIHsgcmV0dXJuIFBSRU1JT1NfUEFEUkFPOyB9XG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJlbWlvcygpOiBzdHJpbmdbXSB7IHJldHVybiBfcHJlbWlvczsgfVxuZXhwb3J0IGZ1bmN0aW9uIHNldFByZW1pb3MocDogc3RyaW5nW10pOiB2b2lkIHsgX3ByZW1pb3MgPSBwOyB9XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFydGljaXBhY2FvSWQoKTogbnVtYmVyIHwgbnVsbCB7IHJldHVybiBfcGFydGljaXBhY2FvSWQ7IH1cbmV4cG9ydCBmdW5jdGlvbiBzZXRQYXJ0aWNpcGFjYW9JZChpZDogbnVtYmVyIHwgbnVsbCk6IHZvaWQgeyBfcGFydGljaXBhY2FvSWQgPSBpZDsgfVxuZXhwb3J0IGZ1bmN0aW9uIGlzR2lyYW5kbygpOiBib29sZWFuIHsgcmV0dXJuIF9naXJhbmRvOyB9XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYXJyZWdhckNvbmZpZygpOiBQcm9taXNlPFJvbGV0YUNvbmZpZyB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByb3dzID0gYXdhaXQgc3VwYWJhc2VHZXQ8Um9sZXRhQ29uZmlnPigncm9sZXRhX2NvbmZpZycsICdpZD1lcS4xJmxpbWl0PTEnKTtcbiAgICBpZiAocm93c1swXSkge1xuICAgICAgX3ByZW1pb3MgPSBBcnJheS5pc0FycmF5KHJvd3NbMF0ucHJlbWlvcykgPyByb3dzWzBdLnByZW1pb3MgOiBQUkVNSU9TX1BBRFJBTztcbiAgICB9XG4gICAgcmV0dXJuIHJvd3NbMF0gPz8gbnVsbDtcbiAgfSBjYXRjaCB7IHJldHVybiBudWxsOyB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJTdGF0dXMoY2xpZW50ZUlkOiBudW1iZXIpOiBQcm9taXNlPGltcG9ydCgnLi4vZG9tYWluL3JvbGV0YScpLlBhcnRpY2lwYWNhb1Byb3BzIHwgbnVsbD4ge1xuICBjb25zdCBzZW1hbmEgPSBnZXRTZW1hbmFBdHVhbCgpO1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCByb2xldGFSZXBvc2l0b3J5LmZpbmRQYXJ0aWNpcGFjYW9BdGl2YShTdHJpbmcoY2xpZW50ZUlkKSwgc2VtYW5hKTtcbiAgaWYgKCFyZXN1bHQub2spIHJldHVybiBudWxsO1xuICBpZiAocmVzdWx0LnZhbHVlKSBfcGFydGljaXBhY2FvSWQgPSByZXN1bHQudmFsdWUuaWQ7XG4gIHJldHVybiByZXN1bHQudmFsdWU7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnaXJhcihcbiAgY2xpZW50ZTogQ2xpZW50ZSxcbiAgb25SZXN1bHRhZG86IChwcmVtaW86IHN0cmluZywgaW5kaWNlOiBudW1iZXIpID0+IHZvaWRcbik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoX2dpcmFuZG8pIHJldHVybjtcblxuICBjb25zdCBzdGF0ZSA9IGFwcFN0b3JlLmdldFN0YXRlKCk7XG4gIGlmICghaXNDb250YVRlc3RlKHN0YXRlLmNsaWVudGUpKSB7XG4gICAgbW9zdHJhclRvYXN0KCdcdUQ4M0RcdURFQTcgUm9sZXRhIGVtIGJyZXZlISBFc3RhbW9zIGZpbmFsaXphbmRvIG9zIFx1MDBGQWx0aW1vcyBkZXRhbGhlcy4gXHVEODNDXHVERkExJywgJ2luZm8nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBfZ2lyYW5kbyA9IHRydWU7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgaWYgKGJ0bikgeyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4udGV4dENvbnRlbnQgPSAnR2lyYW5kby4uLic7IH1cblxuICBjb25zdCBuID0gX3ByZW1pb3MubGVuZ3RoO1xuICBjb25zdCBhcmMgPSAzNjAgLyBuO1xuICBjb25zdCBpbmRpY2UgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBuKTtcbiAgY29uc3Qgdm9sdGFzRXh0cmFzID0gNSArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUpO1xuICBjb25zdCBhbmd1bG9BbHZvID0gdm9sdGFzRXh0cmFzICogMzYwICsgKDM2MCAtIGFyYyAqIGluZGljZSAtIGFyYyAvIDIpO1xuICBjb25zdCByb3RhY2FvRmluYWwgPSBfcm90YWNhb0F0dWFsICsgYW5ndWxvQWx2bztcblxuICBjb25zdCByb2RhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJvZGEnKTtcbiAgaWYgKHJvZGEpIHtcbiAgICByb2RhLnN0eWxlLnRyYW5zaXRpb24gPSAndHJhbnNmb3JtIDRzIGN1YmljLWJlemllcigwLjE3LCAwLjY3LCAwLjEyLCAxKSc7XG4gICAgcm9kYS5zdHlsZS50cmFuc2Zvcm1PcmlnaW4gPSAnMjAwcHggMjAwcHgnO1xuICAgIHJvZGEuc3R5bGUudHJhbnNmb3JtID0gYHJvdGF0ZSgke3JvdGFjYW9GaW5hbH1kZWcpYDtcbiAgfVxuXG4gIF9yb3RhY2FvQXR1YWwgPSAoKHJvdGFjYW9GaW5hbCAlIDM2MCkgKyAzNjApICUgMzYwO1xuXG4gIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA0MjAwKSk7XG5cbiAgY29uc3QgcHJlbWlvID0gX3ByZW1pb3NbaW5kaWNlXSE7XG4gIF9naXJhbmRvID0gZmFsc2U7XG5cbiAgb25SZXN1bHRhZG8ocHJlbWlvLCBpbmRpY2UpO1xuXG4gIGlmIChpc0NvbnRhVGVzdGUoc3RhdGUuY2xpZW50ZSkgJiYgYnRuKSB7XG4gICAgYnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgYnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REZBMSBHSVJBUiBBR09SQSEnO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYWx2YXJWZW5jZWRvcihjbGllbnRlOiBDbGllbnRlLCBwcmVtaW86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHJldHVybjtcbiAgaWYgKCFfcGFydGljaXBhY2FvSWQpIHJldHVybjtcblxuICBjb25zdCBzZW1hbmEgPSBnZXRTZW1hbmFBdHVhbCgpO1xuXG4gIGNvbnN0IHBhdGNoUmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5zYXZlUGFydGljaXBhY2FvKHtcbiAgICBpZDogX3BhcnRpY2lwYWNhb0lkLFxuICAgIGphX2dpcm91OiB0cnVlLFxuICAgIHByZW1pbyxcbiAgfSBhcyBpbXBvcnQoJy4uL2RvbWFpbi9yb2xldGEnKS5QYXJ0aWNpcGFjYW9Qcm9wcyk7XG5cbiAgaWYgKCFwYXRjaFJlc3VsdC5vaykge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm8gYW8gYXR1YWxpemFyIHBhcnRpY2lwYVx1MDBFN1x1MDBFM286JywgcGF0Y2hSZXN1bHQuZXJyb3IpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHZlbmNlZG9yUmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5zYXZlVmVuY2Vkb3IoXG4gICAgY2xpZW50ZS50ZWxlZm9uZSxcbiAgICBjbGllbnRlLm5vbWUsXG4gICAgcHJlbWlvLFxuICAgIHNlbWFuYVxuICApO1xuXG4gIGlmICghdmVuY2Vkb3JSZXN1bHQub2spIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvIGFvIHNhbHZhciB2ZW5jZWRvcjonLCB2ZW5jZWRvclJlc3VsdC5lcnJvcik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlc2VuaGFyUm9sZXRhKHByZW1pb3M6IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucm9sZXRhLXBvaW50ZXItd3JhcCcpO1xuICBpZiAoIXdyYXApIHJldHVybjtcbiAgY29uc3Qgb2xkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUNhbnZhcycpO1xuICBpZiAob2xkKSBvbGQucmVtb3ZlKCk7XG5cbiAgY29uc3QgTiA9IHByZW1pb3MubGVuZ3RoO1xuICBjb25zdCBDWCA9IDIwMCwgQ1kgPSAyMDAsIFIgPSAxNjQsIFJfTEVEID0gMTgyLCBSX09VVEVSID0gMTk2O1xuICBjb25zdCBTRUcgPSAzNjAgLyBOO1xuICBjb25zdCBDT1JFUyA9IFtcbiAgICB7IGJnOiAnI0ZBRjBGMicsIHR4dDogJyNCNTEzNEYnIH0sXG4gICAgeyBiZzogJyNFODUyOEEnLCB0eHQ6ICcjRkZGRkZGJyB9LFxuICBdIGFzIGNvbnN0O1xuXG4gIGNvbnN0IHJhZCA9IChkOiBudW1iZXIpOiBudW1iZXIgPT4gZCAqIE1hdGguUEkgLyAxODA7XG4gIGNvbnN0IHB0ID0gKGQ6IG51bWJlciwgcjogbnVtYmVyKTogW251bWJlciwgbnVtYmVyXSA9PiBbQ1ggKyByICogTWF0aC5jb3MocmFkKGQpKSwgQ1kgKyByICogTWF0aC5zaW4ocmFkKGQpKV07XG4gIGNvbnN0IGVzYyA9IChzOiBzdHJpbmcpOiBzdHJpbmcgPT4gcy5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG5cbiAgZnVuY3Rpb24gc2VnUGF0aChpOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IHMgPSBTRUcgKiBpIC0gOTAsIGUgPSBzICsgU0VHO1xuICAgIGNvbnN0IFt4MSwgeTFdID0gcHQocywgUiksIFt4MiwgeTJdID0gcHQoZSwgUik7XG4gICAgcmV0dXJuIGBNJHtDWH0sJHtDWX0gTCR7eDEudG9GaXhlZCgyKX0sJHt5MS50b0ZpeGVkKDIpfSBBJHtSfSwke1J9IDAgMCwxICR7eDIudG9GaXhlZCgyKX0sJHt5Mi50b0ZpeGVkKDIpfSBaYDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyYXBXb3Jkcyh0ZXh0OiBzdHJpbmcsIG1heENoYXJzOiBudW1iZXIpOiBzdHJpbmdbXSB7XG4gICAgY29uc3Qgd29yZHMgPSB0ZXh0LnNwbGl0KCcgJyk7XG4gICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IGN1ciA9ICcnO1xuICAgIHdvcmRzLmZvckVhY2godyA9PiB7XG4gICAgICBjb25zdCB0ZXN0ID0gY3VyID8gYCR7Y3VyfSAke3d9YCA6IHc7XG4gICAgICBpZiAodGVzdC5sZW5ndGggPiBtYXhDaGFycyAmJiBjdXIpIHsgbGluZXMucHVzaChjdXIpOyBjdXIgPSB3OyB9XG4gICAgICBlbHNlIGN1ciA9IHRlc3Q7XG4gICAgfSk7XG4gICAgaWYgKGN1cikgbGluZXMucHVzaChjdXIpO1xuICAgIHJldHVybiBsaW5lcy5zbGljZSgwLCAzKTtcbiAgfVxuXG4gIGNvbnN0IHNlZ3MgPSBwcmVtaW9zLm1hcCgoXywgaSkgPT4ge1xuICAgIGNvbnN0IGMgPSBDT1JFU1tpICUgMl0hO1xuICAgIHJldHVybiBgPHBhdGggZD1cIiR7c2VnUGF0aChpKX1cIiBmaWxsPVwiJHtjLmJnfVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIyXCIgc2hhcGUtcmVuZGVyaW5nPVwiZ2VvbWV0cmljUHJlY2lzaW9uXCIvPmA7XG4gIH0pLmpvaW4oJycpO1xuXG4gIGNvbnN0IHNwb2tlcyA9IHByZW1pb3MubWFwKChfLCBpKSA9PiB7XG4gICAgY29uc3QgZCA9IFNFRyAqIGkgLSA5MDtcbiAgICBjb25zdCBbeCwgeV0gPSBwdChkLCBSKTtcbiAgICByZXR1cm4gYDxsaW5lIHgxPVwiJHtDWH1cIiB5MT1cIiR7Q1l9XCIgeDI9XCIke3gudG9GaXhlZCgyKX1cIiB5Mj1cIiR7eS50b0ZpeGVkKDIpfVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIyXCIvPmA7XG4gIH0pLmpvaW4oJycpO1xuXG4gIGNvbnN0IHRleHRzID0gcHJlbWlvcy5tYXAoKHAsIGkpID0+IHtcbiAgICBjb25zdCBtaWQgPSBTRUcgKiBpIC0gOTAgKyBTRUcgLyAyO1xuICAgIGNvbnN0IFt0eCwgdHldID0gcHQobWlkLCBSICogMC41Nyk7XG4gICAgY29uc3QgYyA9IENPUkVTW2kgJSAyXSE7XG4gICAgY29uc3QgbSA9IHAubWF0Y2goL14oXFxTKylcXHMrKC4rKSQvKTtcbiAgICBjb25zdCBlbW9qaSA9IG0gPyBtWzFdISA6ICcnO1xuICAgIGNvbnN0IHJlc3QgPSBtID8gbVsyXSEgOiBwO1xuICAgIGNvbnN0IGxpbmVzID0gd3JhcFdvcmRzKHJlc3QsIDEzKTtcbiAgICBjb25zdCBsaW5lSCA9IDExLjU7XG4gICAgY29uc3QgdG90YWxUeHRIID0gbGluZXMubGVuZ3RoICogbGluZUg7XG4gICAgY29uc3QgZW1vamlZID0gLSh0b3RhbFR4dEggLyAyKSAtIDExO1xuICAgIGNvbnN0IHJvdCA9IChtaWQgKyA5MCkudG9GaXhlZCgxKTtcbiAgICByZXR1cm4gYDxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgke3R4LnRvRml4ZWQoMil9LCR7dHkudG9GaXhlZCgyKX0pIHJvdGF0ZSgke3JvdH0pXCIgdGV4dC1yZW5kZXJpbmc9XCJnZW9tZXRyaWNQcmVjaXNpb25cIj5cbiAgPHRleHQgeD1cIjBcIiB5PVwiJHtlbW9qaVkudG9GaXhlZCgxKX1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGRvbWluYW50LWJhc2VsaW5lPVwibWlkZGxlXCIgZm9udC1zaXplPVwiMTVcIiBmb250LWZhbWlseT1cInNlcmlmXCI+JHtlc2MoZW1vamkpfTwvdGV4dD5cbiAgJHtsaW5lcy5tYXAoKGwsIGxpKSA9PiB7XG4gICAgY29uc3QgeXAgPSAoKGxpIC0gKGxpbmVzLmxlbmd0aCAtIDEpIC8gMikgKiBsaW5lSCkudG9GaXhlZCgxKTtcbiAgICByZXR1cm4gYDx0ZXh0IHg9XCIwXCIgeT1cIiR7eXB9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBkb21pbmFudC1iYXNlbGluZT1cIm1pZGRsZVwiIGZpbGw9XCIke2MudHh0fVwiIGZvbnQtZmFtaWx5PVwiJ0RNIFNhbnMnLEFyaWFsLHNhbnMtc2VyaWZcIiBmb250LXdlaWdodD1cIjcwMFwiIGZvbnQtc2l6ZT1cIjlcIj4ke2VzYyhsKX08L3RleHQ+YDtcbiAgfSkuam9pbignXFxuICAnKX1cbjwvZz5gO1xuICB9KS5qb2luKCcnKTtcblxuICBjb25zdCBMRURfTiA9IDMwO1xuICBjb25zdCBsZWRzID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogTEVEX04gfSwgKF8sIGkpID0+IHtcbiAgICBjb25zdCBbbHgsIGx5XSA9IHB0KCgzNjAgLyBMRURfTikgKiBpIC0gOTAsIFJfTEVEKTtcbiAgICByZXR1cm4gYDxjaXJjbGUgY3g9XCIke2x4LnRvRml4ZWQoMil9XCIgY3k9XCIke2x5LnRvRml4ZWQoMil9XCIgcj1cIjUuNVwiIGNsYXNzPVwici1sZWQgci1sZWQtJHtpICUgMn1cIi8+YDtcbiAgfSkuam9pbignJyk7XG5cbiAgY29uc3Qgc3ZnID0gYDxzdmcgaWQ9XCJyb2xldGFDYW52YXNcIiB2aWV3Qm94PVwiMCAwIDQwMCA0MDBcIlxuICBzdHlsZT1cIndpZHRoOm1pbig4NnZ3LDM0MHB4KTtoZWlnaHQ6bWluKDg2dncsMzQwcHgpO2Rpc3BsYXk6YmxvY2s7ZmlsdGVyOmRyb3Atc2hhZG93KDAgNnB4IDIwcHggcmdiYSgwLDAsMCwuNDIpKVwiXG4gIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj5cbiAgPGRlZnM+XG4gICAgPHJhZGlhbEdyYWRpZW50IGlkPVwicmctcmluZ1wiIGN4PVwiNTAlXCIgY3k9XCI1MCVcIiByPVwiNTAlXCI+XG4gICAgICA8c3RvcCBvZmZzZXQ9XCI3MCVcIiBzdG9wLWNvbG9yPVwiI0Q0MkI3M1wiLz5cbiAgICAgIDxzdG9wIG9mZnNldD1cIjEwMCVcIiBzdG9wLWNvbG9yPVwiIzZBMDgyRVwiLz5cbiAgICA8L3JhZGlhbEdyYWRpZW50PlxuICAgIDxyYWRpYWxHcmFkaWVudCBpZD1cInJnLWN0clwiIGN4PVwiMzUlXCIgY3k9XCIzMCVcIiByPVwiNzAlXCI+XG4gICAgICA8c3RvcCBvZmZzZXQ9XCIwJVwiIHN0b3AtY29sb3I9XCIjRkZFNTdBXCIvPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiNDglXCIgc3RvcC1jb2xvcj1cIiNENEFGMzdcIi8+XG4gICAgICA8c3RvcCBvZmZzZXQ9XCIxMDAlXCIgc3RvcC1jb2xvcj1cIiM3QTU4MDBcIi8+XG4gICAgPC9yYWRpYWxHcmFkaWVudD5cbiAgICA8ZmlsdGVyIGlkPVwiZi1nbG93XCIgeD1cIi02MCVcIiB5PVwiLTYwJVwiIHdpZHRoPVwiMjIwJVwiIGhlaWdodD1cIjIyMCVcIj5cbiAgICAgIDxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249XCIyLjVcIiByZXN1bHQ9XCJiXCIvPlxuICAgICAgPGZlTWVyZ2U+PGZlTWVyZ2VOb2RlIGluPVwiYlwiLz48ZmVNZXJnZU5vZGUgaW49XCJTb3VyY2VHcmFwaGljXCIvPjwvZmVNZXJnZT5cbiAgICA8L2ZpbHRlcj5cbiAgPC9kZWZzPlxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIiR7Ul9PVVRFUn1cIiBmaWxsPVwidXJsKCNyZy1yaW5nKVwiLz5cbiAgPGNpcmNsZSBjeD1cIiR7Q1h9XCIgY3k9XCIke0NZfVwiIHI9XCIke1JfT1VURVJ9XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiMy41XCIvPlxuICA8ZyBpZD1cInJvbGV0YVJvZGFcIj4ke3NlZ3N9JHtzcG9rZXN9JHt0ZXh0c308L2c+XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiJHtSICsgMX1cIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIzXCIvPlxuICAke2xlZHN9XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiNDJcIiBmaWxsPVwidXJsKCNyZy1jdHIpXCIgc3Ryb2tlPVwiI0ZGRlwiIHN0cm9rZS13aWR0aD1cIjMuNVwiIGZpbHRlcj1cInVybCgjZi1nbG93KVwiLz5cbiAgPGNpcmNsZSBjeD1cIiR7Q1h9XCIgY3k9XCIke0NZfVwiIHI9XCIzOFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwicmdiYSgyNTUsMjU1LDI1NSwwLjM1KVwiIHN0cm9rZS13aWR0aD1cIjEuNVwiLz5cbiAgPHRleHQgeD1cIiR7Q1h9XCIgeT1cIiR7Q1kgLSA3fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmaWxsPVwiI0ZGRlwiIGZvbnQtZmFtaWx5PVwiJ0RNIFNhbnMnLEFyaWFsLHNhbnMtc2VyaWZcIiBmb250LXdlaWdodD1cIjgwMFwiIGZvbnQtc2l6ZT1cIjEyXCIgbGV0dGVyLXNwYWNpbmc9XCIxLjVcIiB0ZXh0LXJlbmRlcmluZz1cImdlb21ldHJpY1ByZWNpc2lvblwiPkdJUkFSPC90ZXh0PlxuICA8dGV4dCB4PVwiJHtDWH1cIiB5PVwiJHtDWSArIDl9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBkb21pbmFudC1iYXNlbGluZT1cIm1pZGRsZVwiIGZpbGw9XCJyZ2JhKDI1NSwyNTUsMjU1LC44NSlcIiBmb250LWZhbWlseT1cInNlcmlmXCIgZm9udC1zaXplPVwiMTFcIj5cdTI2MDUgXHUyNjA1IFx1MjYwNTwvdGV4dD5cbjwvc3ZnPmA7XG5cbiAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRpdi5pbm5lckhUTUwgPSBzdmc7XG4gIHdyYXAuaW5zZXJ0QmVmb3JlKGRpdi5maXJzdEVsZW1lbnRDaGlsZCEsIHdyYXAuZmlyc3RDaGlsZCk7XG59XG5cbmV4cG9ydCB7IGVzY0hUTUwgfTtcbiIsICJpbXBvcnQgdHlwZSB7IEl0ZW1DYXJyaW5obyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IGVzY0hUTUwgfSBmcm9tICcuLi91dGlscy9zZWN1cml0eSc7XG5pbXBvcnQgeyBmb3JtYXRhck1vZWRhIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGNhcnRTZXJ2aWNlIH0gZnJvbSAnLi4vY29udGFpbmVyJztcblxuLy8gQWRhcHRhZG9yZXMgbGVnYWRvcyBcdTIwMTQgZGVsZWdhbSBhbyBDYXJ0U2VydmljZSAoQ2xlYW4gQXJjaGl0ZWN0dXJlKVxuZXhwb3J0IGZ1bmN0aW9uIGdldENhcnJpbmhvKCk6IFJlY29yZDxzdHJpbmcsIEl0ZW1DYXJyaW5obz4ge1xuICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIEl0ZW1DYXJyaW5obz4gPSB7fTtcbiAgY2FydFNlcnZpY2UuZ2V0SXRlbXMoKS5mb3JFYWNoKGkgPT4geyByZXN1bHRbaS5ub21lXSA9IGk7IH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXRlbnMoKTogSXRlbUNhcnJpbmhvW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShjYXJ0U2VydmljZS5nZXRJdGVtcygpKSBhcyBJdGVtQ2FycmluaG9bXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvdGFsKCk6IG51bWJlciB7XG4gIHJldHVybiBjYXJ0U2VydmljZS5nZXRUb3RhbCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRpY2lvbmFySXRlbShub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiBib29sZWFuIHtcbiAgaWYgKGNhcnRTZXJ2aWNlLmhhcyhub21lKSkgcmV0dXJuIGZhbHNlO1xuICBjYXJ0U2VydmljZS5hZGQobm9tZSwgcHJlY28pO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZXJJdGVtKG5vbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAoIWNhcnRTZXJ2aWNlLmhhcyhub21lKSkgcmV0dXJuIGZhbHNlO1xuICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlSXRlbShub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiAnYWRpY2lvbmFkbycgfCAncmVtb3ZpZG8nIHtcbiAgY29uc3QgciA9IGNhcnRTZXJ2aWNlLnRvZ2dsZShub21lLCBwcmVjbyk7XG4gIHJldHVybiByID09PSAnYWRkZWQnID8gJ2FkaWNpb25hZG8nIDogJ3JlbW92aWRvJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpbXBhcigpOiB2b2lkIHtcbiAgY2FydFNlcnZpY2UuY2xlYXIoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm9sb0Zvcm1hKG5vbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBCT0xPX0ZPUk1BX05PTUVTID0gWydCb2xvIG5hIGZvcm1hIE1pbGhvIG5hdHVyYWwnLCAnQm9sbyBuYSBmb3JtYSBDZW5vdXJhIGNvbSBjaG9jb2xhdGUgZSBHcmFudWxlJ107XG4gIHJldHVybiBCT0xPX0ZPUk1BX05PTUVTLmluY2x1ZGVzKG5vbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyaXphckxpc3RhKGNvbnRhaW5lcklkOiBzdHJpbmcsIHRvdGFsUm9kYXBlSWQ6IHN0cmluZywgYmFkZ2VJZDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGxpc3RhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGFpbmVySWQpO1xuICBjb25zdCB0b3RhbEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodG90YWxSb2RhcGVJZCk7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYmFkZ2VJZCk7XG4gIGNvbnN0IGl0ZW5zID0gZ2V0SXRlbnMoKTtcblxuICBpZiAoYmFkZ2UpIGJhZGdlLnRleHRDb250ZW50ID0gU3RyaW5nKGl0ZW5zLmxlbmd0aCk7XG5cbiAgaWYgKCFsaXN0YSB8fCAhdG90YWxFbCkgcmV0dXJuO1xuXG4gIGlmIChpdGVucy5sZW5ndGggPT09IDApIHtcbiAgICBsaXN0YS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImNhcnJpbmhvLXZhemlvXCI+PGRpdiBjbGFzcz1cImNhcnJpbmhvLXZhemlvLWljb25cIj5cdUQ4M0RcdURFRDI8L2Rpdj48ZGl2PlNldSBjYXJyaW5obyBlc3RcdTAwRTEgdmF6aW88L2Rpdj48L2Rpdj5gO1xuICAgIHRvdGFsRWwudGV4dENvbnRlbnQgPSAnUiQgMCwwMCc7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgdG90YWwgPSBnZXRUb3RhbCgpO1xuICBsaXN0YS5pbm5lckhUTUwgPSBpdGVucy5tYXAoaXRlbSA9PiB7XG4gICAgY29uc3Qgbm9tZUVzYyA9IGVzY0hUTUwoaXRlbS5ub21lKTtcbiAgICBjb25zdCBub21lRGF0YSA9IGVuY29kZVVSSUNvbXBvbmVudChpdGVtLm5vbWUpO1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImNhcnQtaXRlbVwiPlxuICAgICAgPHNwYW4gY2xhc3M9XCJjYXJ0LWl0ZW0tbm9tZVwiPiR7bm9tZUVzY308L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cImNhcnQtaXRlbS1wcmVjb1wiPiR7Zm9ybWF0YXJNb2VkYShpdGVtLnByZWNvKX08L3NwYW4+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwiY2FydC1pdGVtLXJlbW92ZVwiIG9uY2xpY2s9XCJyZW1vdmVyRG9DYXJyaW5obyhkZWNvZGVVUklDb21wb25lbnQoJyR7bm9tZURhdGF9JykpXCIgYXJpYS1sYWJlbD1cIlJlbW92ZXJcIj5cdUQ4M0RcdURERDFcdUZFMEY8L2J1dHRvbj5cbiAgICA8L2Rpdj5gO1xuICB9KS5qb2luKCcnKSArIGA8ZGl2IGNsYXNzPVwiY2FydC10b3RhbFwiPjxzcGFuIGNsYXNzPVwiY2FydC10b3RhbC1sYWJlbFwiPlRvdGFsPC9zcGFuPjxzcGFuIGNsYXNzPVwiY2FydC10b3RhbC12YWxvclwiPiR7Zm9ybWF0YXJNb2VkYSh0b3RhbCl9PC9zcGFuPjwvZGl2PmA7XG4gIHRvdGFsRWwudGV4dENvbnRlbnQgPSBmb3JtYXRhck1vZWRhKHRvdGFsKTtcbn1cbiIsICIvLyBzcmMvbWFpbi50cyBcdTIwMTQgcG9udG8gZGUgZW50cmFkYSBHZWxhbW91ciAoQ2xlYW4gQXJjaGl0ZWN0dXJlKVxuaW1wb3J0IHsgbW9zdHJhclRvYXN0IH0gZnJvbSAnLi91dGlscy90b2FzdCc7XG5pbXBvcnQgeyBlc2NIVE1MIH0gZnJvbSAnLi91dGlscy9zZWN1cml0eSc7XG5pbXBvcnQgeyBhcGxpY2FyTWFzY2FyYVRlbGVmb25lIH0gZnJvbSAnLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHsgbG9naW5Vc2VDYXNlLCBjYXJ0U2VydmljZSwgcGVkaWRvUmVwb3NpdG9yeSwgcm9sZXRhUmVwb3NpdG9yeSwgY2xpZW50ZVJlcG9zaXRvcnkgfSBmcm9tICcuL2NvbnRhaW5lcic7XG5pbXBvcnQgeyBhcHBTdG9yZSwgaXNDb250YVRlc3RlIH0gZnJvbSAnLi9zdGF0ZS9BcHBTdG9yZSc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuL2NvcmUvbG9nZ2VyJztcbmltcG9ydCB7IENsaWVudGUgYXMgQ2xpZW50ZUVudGl0eSB9IGZyb20gJy4vZG9tYWluL2NsaWVudGUnO1xuaW1wb3J0IHsgZ2V0U2VtYW5hQXR1YWwgfSBmcm9tICcuL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQge1xuICBnZXRQcmVtaW9zLCBnZXRQcmVtaW9zUGFkcmFvLCBzZXRQcmVtaW9zLFxuICBnZXRQYXJ0aWNpcGFjYW9JZCwgc2V0UGFydGljaXBhY2FvSWQsXG4gIGNhcnJlZ2FyQ29uZmlnIGFzIGNhcnJlZ2FyQ29uZmlnUm9sZXRhLFxuICB2ZXJpZmljYXJTdGF0dXMgYXMgdmVyaWZpY2FyU3RhdHVzUm9sZXRhLFxuICBnaXJhciBhcyBnaXJhclJvbGV0YUZuLFxuICBzYWx2YXJWZW5jZWRvcixcbiAgZGVzZW5oYXJSb2xldGFcbn0gZnJvbSAnLi9tb2R1bGVzL3JvbGV0YSc7XG5pbXBvcnQgeyBpc0JvbG9Gb3JtYSwgcmVuZGVyaXphckxpc3RhIH0gZnJvbSAnLi9tb2R1bGVzL2NhcnQnO1xuaW1wb3J0IHR5cGUgeyBDbGllbnRlLCBQYXJ0aWNpcGFjYW8gfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfQU5PTiB9IGZyb20gJy4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvY2xpZW50JztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdtYWluJyk7XG5cbi8vID09PT09IENPTlNUQU5URVMgPT09PT1cbmNvbnN0IFdBX05VTUJFUiA9IGF0b2IoJ05UVXhNVGswTURjM01qYzFNQT09Jyk7XG5jb25zdCBFREdFX1VSTCA9IGAke1NVUEFCQVNFX1VSTH0vZnVuY3Rpb25zL3YxYDtcblxuLy8gPT09PT0gRVNUQURPIExPQ0FMIERFIFVJIChuXHUwMEUzbyBnbG9iYWwgXHUyMDE0IGVuY2Fwc3VsYWRvKSA9PT09PVxubGV0IF9waXhQYXlsb2FkID0gJyc7XG5sZXQgX3BpeFBvbGxUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0SW50ZXJ2YWw+IHwgbnVsbCA9IG51bGw7XG5sZXQgX3BpeFBlZGlkb0lkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbmxldCBfcGl4TXNnV0EgPSAnJztcbmxldCBfcGl4VG90YWwgPSAwO1xubGV0IF9waXhOb21lID0gJyc7XG5sZXQgX3BpeEl0ZW5zOiBBcnJheTx7IG5vbWU6IHN0cmluZzsgcHJlY286IG51bWJlciB9PiA9IFtdO1xubGV0IF9waXhFbmRlcmVjbyA9ICcnO1xubGV0IF9jYXJkVGlwbyA9ICdjcmVkaXRvJztcblxubGV0IF92ZXJpZmljYW5kbyA9IGZhbHNlO1xubGV0IF9jYWRhc3RyYW5kbyA9IGZhbHNlO1xuXG4vLyBIZWxwZXI6IGxcdTAwRUEgY2xpZW50ZSBhdHVhbCBkbyBzdG9yZVxuZnVuY3Rpb24gZ2V0Q2xpZW50ZUF0dWFsKCk6IENsaWVudGUgfCBudWxsIHtcbiAgcmV0dXJuIGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSBhcyBDbGllbnRlIHwgbnVsbDtcbn1cblxuLy8gPT09PT0gRklMVFJPUyA9PT09PVxuZnVuY3Rpb24gZmlsdHJhcihjYXQ6IHN0cmluZywgYnRuOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZmlsdHJvLWJ0bicpLmZvckVhY2goYiA9PiBiLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpKTtcbiAgYnRuLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucHJvZC1jYXJkJykuZm9yRWFjaChjYXJkID0+IHtcbiAgICBjb25zdCBlbCA9IGNhcmQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKGNhdCA9PT0gJ3RvZG9zJyB8fCAoZWwuZGF0YXNldFsnY2F0J10gPT09IGNhdCkpXG4gICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcbiAgICBlbHNlXG4gICAgICBlbC5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcbiAgfSk7XG59XG5cbi8vID09PT09IENBUlJJTkhPID09PT09XG5mdW5jdGlvbiBhdHVhbGl6YXJGYWIoKTogdm9pZCB7XG4gIGNvbnN0IGZhYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXJ0RmFiJyk7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhcnRCYWRnZScpO1xuICBjb25zdCBjb3VudCA9IGNhcnRTZXJ2aWNlLmdldENvdW50KCk7XG4gIGlmIChiYWRnZSkgYmFkZ2UudGV4dENvbnRlbnQgPSBTdHJpbmcoY291bnQpO1xuICBpZiAoZmFiKSB7XG4gICAgaWYgKGNvdW50ID4gMCkgZmFiLmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gICAgZWxzZSB7IGZhYi5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpOyBmZWNoYXJNb2RhbCgpOyB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGVkaXJQcm9kdXRvKGJvdGFvOiBIVE1MRWxlbWVudCwgbm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGNhcmQgPSBib3Rhby5jbG9zZXN0KCcucHJvZC1jYXJkJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpZiAoY2FydFNlcnZpY2UuaGFzKG5vbWUpKSB7XG4gICAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICAgIGNhcmQ/LmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJyk7XG4gICAgYXR1YWxpemFyRmFiKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNhcnRTZXJ2aWNlLmFkZChub21lLCBwcmVjbyk7XG4gIGNhcmQ/LmNsYXNzTGlzdC5hZGQoJ3NlbGVjaW9uYWRvJyk7XG4gIGF0dWFsaXphckZhYigpO1xuICBhYnJpckRpYWxvZyhub21lLCBwcmVjbyk7XG59XG5cbmZ1bmN0aW9uIGFicmlyRGlhbG9nKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dQcm9kdXRvJyk7XG4gIGlmIChlbCkgZWwuaW5uZXJIVE1MID0gJzxzdHJvbmc+JyArIGVzY0hUTUwobm9tZSkgKyAnPC9zdHJvbmc+IFx1MjAxNCBSJCAnICsgTnVtYmVyKHByZWNvKS50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhckRpYWxvZygpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJEaWFsb2dCYWNrZHJvcChlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ2RpYWxvZ0JhY2tkcm9wJykgZmVjaGFyRGlhbG9nKCk7XG59XG5cbmZ1bmN0aW9uIGlyUGFyYUZpbmFsaXphcigpOiB2b2lkIHtcbiAgZmVjaGFyRGlhbG9nKCk7XG4gIGFicmlyTW9kYWwoKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyaXphckNhcnJpbmhvKCk6IHZvaWQge1xuICByZW5kZXJpemFyTGlzdGEoJ2xpc3RhQ2FycmluaG8nLCAndG90YWxSb2RhcGUnLCAnYmFkZ2VDb3VudCcpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJpemFyTm90aWNlRW5jb21lbmRhKCk6IHZvaWQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpY2VFbmNvbWVuZGEnKTtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICBjb25zdCBpdGVucyA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCk7XG4gIGNvbnN0IHRlbUZvcm1hID0gaXRlbnMuc29tZShpID0+IGlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuICBjb25zdCB0ZW1PdXRyb3MgPSBpdGVucy5zb21lKGkgPT4gIWlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuICBpZiAodGVtRm9ybWEgJiYgdGVtT3V0cm9zKSB7XG4gICAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJub3RpY2UtbWlzdG9cIj48c3Bhbj5cdTI2QTBcdUZFMEY8L3NwYW4+PHNwYW4+PHN0cm9uZz5BdGVuXHUwMEU3XHUwMEUzbzo8L3N0cm9uZz4gVm9jXHUwMEVBIG1pc3R1cm91IEJvbG9zIG5hIEZvcm1hIChmZWl0b3Mgc29iIGVuY29tZW5kYSkgY29tIG91dHJvcyBwcm9kdXRvcy4gQ29uc2lkZXJlIHBlZGlkb3Mgc2VwYXJhZG9zIHBhcmEgZ2FyYW50aXIgbyBwcmF6byE8L3NwYW4+PC9kaXY+JztcbiAgfSBlbHNlIGlmICh0ZW1Gb3JtYSkge1xuICAgIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwibm90aWNlLWVuY29tZW5kYVwiPjxzcGFuIGNsYXNzPVwibm90aWNlLWVuY29tZW5kYS1pY29uXCI+XHUyM0YwPC9zcGFuPjxzcGFuPjxzdHJvbmc+Qm9sbyBuYSBGb3JtYSBcdTIwMTQgU29iIGVuY29tZW5kYSE8L3N0cm9uZz48YnI+RXNzZXMgYm9sb3Mgc1x1MDBFM28gcHJlcGFyYWRvcyBlc3BlY2lhbG1lbnRlIHBhcmEgdm9jXHUwMEVBLiBQcmF6byBkZSA8c3Ryb25nPjUgaG9yYXMgYSAxIGRpYSBcdTAwRkF0aWw8L3N0cm9uZz4gYXBcdTAwRjNzIGNvbmZpcm1hXHUwMEU3XHUwMEUzby48L3NwYW4+PC9kaXY+JztcbiAgfSBlbHNlIHtcbiAgICBlbC5pbm5lckhUTUwgPSAnJztcbiAgfVxufVxuXG5mdW5jdGlvbiBhYnJpck1vZGFsKCk6IHZvaWQge1xuICByZW5kZXJpemFyQ2FycmluaG8oKTtcbiAgcmVuZGVyaXphck5vdGljZUVuY29tZW5kYSgpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxCYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdtb2RhbC1hYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyTW9kYWwoKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ21vZGFsLWFiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJNb2RhbEJhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAnbW9kYWxCYWNrZHJvcCcpIGZlY2hhck1vZGFsKCk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZXJEb0NhcnJpbmhvKG5vbWU6IHN0cmluZyk6IHZvaWQge1xuICBpZiAoIWNhcnRTZXJ2aWNlLmhhcyhub21lKSkgcmV0dXJuO1xuICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcm9kLWNhcmQuc2VsZWNpb25hZG8nKS5mb3JFYWNoKGNhcmQgPT4ge1xuICAgIGNvbnN0IG5vbWVFbCA9IGNhcmQucXVlcnlTZWxlY3RvcignLnByb2Qtbm9tZScpO1xuICAgIGlmIChub21lRWwgJiYgbm9tZUVsLnRleHRDb250ZW50Py50cmltKCkgPT09IG5vbWUpIGNhcmQuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKTtcbiAgfSk7XG4gIHJlbmRlcml6YXJDYXJyaW5obygpO1xuICBhdHVhbGl6YXJGYWIoKTtcbn1cblxuZnVuY3Rpb24gc2VsZWNpb25hclBhZ2FtZW50byhlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2FtZW50by1vcHQnKS5mb3JFYWNoKG8gPT4gby5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcbiAgZWwuY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgY29uc3QgdGlwbyA9IChlbCBhcyBIVE1MRWxlbWVudCAmIHsgZGF0YXNldDogRE9NU3RyaW5nTWFwIH0pLmRhdGFzZXRbJ3BhZyddID8/ICcnO1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiB0aXBvIH0pO1xufVxuXG5mdW5jdGlvbiBsaW1wYXJDYXJyaW5obygpOiB2b2lkIHtcbiAgY2FydFNlcnZpY2UuY2xlYXIoKTtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwYWdhbWVudG9TZWxlY2lvbmFkbzogJycgfSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYWdhbWVudG8tb3B0LmF0aXZvJykuZm9yRWFjaChvID0+IG8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKSk7XG4gIGNvbnN0IG9ic0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE9icycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQgfCBudWxsO1xuICBpZiAob2JzRWwpIG9ic0VsLnZhbHVlID0gJyc7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcm9kLWNhcmQuc2VsZWNpb25hZG8nKS5mb3JFYWNoKGMgPT4gYy5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpKTtcbiAgYXR1YWxpemFyRmFiKCk7XG4gIGZlY2hhck1vZGFsKCk7XG59XG5cbi8vID09PT09IEJPTE8gTkEgRk9STUEgPT09PT1cbmZ1bmN0aW9uIHBlZGlyQm9sb0Zvcm1hKGJvdGFvOiBIVE1MRWxlbWVudCwgbm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGNhcmQgPSBib3Rhby5jbG9zZXN0KCcucHJvZC1jYXJkJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpZiAoY2FydFNlcnZpY2UuaGFzKG5vbWUpKSB7XG4gICAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICAgIGNhcmQ/LmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJyk7XG4gICAgYXR1YWxpemFyRmFiKCk7XG4gICAgcmVuZGVyaXphck5vdGljZUVuY29tZW5kYSgpO1xuICAgIHJldHVybjtcbiAgfVxuICBjYXJ0U2VydmljZS5hZGQobm9tZSwgcHJlY28pO1xuICBjYXJkPy5jbGFzc0xpc3QuYWRkKCdzZWxlY2lvbmFkbycpO1xuICBhdHVhbGl6YXJGYWIoKTtcbiAgYWJyaXJEaWFsb2dCb2xvKCk7XG59XG5cbmZ1bmN0aW9uIGFicmlyRGlhbG9nQm9sbygpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ0JvbG9CYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyRGlhbG9nQm9sbyhlPzogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKCFlIHx8IChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdkaWFsb2dCb2xvQmFja2Ryb3AnKSB7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ0JvbG9CYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZ2VuZGFyQm9sb1doYXRzQXBwKCk6IHZvaWQge1xuICBjb25zdCBpdGVuc0Zvcm1hID0gY2FydFNlcnZpY2UuZ2V0SXRlbXMoKS5maWx0ZXIoaSA9PiBpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgbGV0IGxpbmhhcyA9ICcnO1xuICBsZXQgdG90YWwgPSAwO1xuICBpdGVuc0Zvcm1hLmZvckVhY2goaSA9PiB7XG4gICAgbGluaGFzICs9ICdcdTIwMjIgJyArIGkubm9tZSArICcgXHUyMDE0IFIkICcgKyBpLnByZWNvLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJykgKyAnXFxuJztcbiAgICB0b3RhbCA9IE1hdGgucm91bmQoKHRvdGFsICsgaS5wcmVjbykgKiAxMDApIC8gMTAwO1xuICB9KTtcbiAgY29uc3QgbXNnID0gJypcdUQ4M0NcdURGODIgQUdFTkRBTUVOVE8gLSBCT0xPIE5BIEZPUk1BIC0gR0VMQU1PVVIqXFxuXFxuT2xcdTAwRTEhIEdvc3RhcmlhIGRlIGFnZW5kYXIgbyhzKSBzZWd1aW50ZShzKSBib2xvKHMpOlxcblxcbicgKyBsaW5oYXMgKyAnXFxuKlx1RDgzRFx1RENCMCBUb3RhbDoqIFIkICcgKyB0b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpICsgJ1xcblxcblx1MjNGMCBTZWkgcXVlIG8gcHJhem8gXHUwMEU5IGRlIDUgaG9yYXMgYSAxIGRpYSBcdTAwRkF0aWwuIFBvciBmYXZvciBtZSBpbmZvcm1lIGEgZGF0YSBlIGhvclx1MDBFMXJpbyBkaXNwb25cdTAwRUR2ZWlzIHBhcmEgZW50cmVnYS4gXHVEODNEXHVERTBBJztcbiAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG1zZyksICdfYmxhbmsnKTtcbiAgZmVjaGFyRGlhbG9nQm9sbygpO1xufVxuXG4vLyA9PT09PSBDQVJPVVNFTCA9PT09PVxuZnVuY3Rpb24gY2Fyb3VzZWxOZXh0KGlkOiBzdHJpbmcsIGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmIChlKSBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICBjb25zdCBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICBpZiAoIWMpIHJldHVybjtcbiAgY29uc3QgaW1ncyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWltZycpO1xuICBjb25zdCBkb3RzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtZG90Jyk7XG4gIGxldCBjdXIgPSAwO1xuICBpbWdzLmZvckVhY2goKGltZywgaSkgPT4geyBpZiAoaW1nLmNsYXNzTGlzdC5jb250YWlucygnYXRpdm8nKSkgY3VyID0gaTsgfSk7XG4gIGltZ3NbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcbiAgZG90c1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBjb25zdCBuZXh0ID0gKGN1ciArIDEpICUgaW1ncy5sZW5ndGg7XG4gIGltZ3NbbmV4dF0/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGRvdHNbbmV4dF0/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG59XG5cbmZ1bmN0aW9uIGNhcm91c2VsUHJldihpZDogc3RyaW5nLCBlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoZSkgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgY29uc3QgYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgaWYgKCFjKSByZXR1cm47XG4gIGNvbnN0IGltZ3MgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1pbWcnKTtcbiAgY29uc3QgZG90cyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWRvdCcpO1xuICBsZXQgY3VyID0gMDtcbiAgaW1ncy5mb3JFYWNoKChpbWcsIGkpID0+IHsgaWYgKGltZy5jbGFzc0xpc3QuY29udGFpbnMoJ2F0aXZvJykpIGN1ciA9IGk7IH0pO1xuICBpbWdzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGRvdHNbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcbiAgY29uc3QgcHJldiA9IChjdXIgLSAxICsgaW1ncy5sZW5ndGgpICUgaW1ncy5sZW5ndGg7XG4gIGltZ3NbcHJldl0/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGRvdHNbcHJldl0/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG59XG5cbi8vID09PT09IENIRUNLT1VUIC8gUEVESURPID09PT09XG5hc3luYyBmdW5jdGlvbiBmaW5hbGl6YXJQZWRpZG8oKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGl0ZW5zID0gY2FydFNlcnZpY2UuZ2V0SXRlbXMoKTtcbiAgY29uc3QgdGVtRm9ybWFGaW4gPSBpdGVucy5zb21lKGkgPT4gaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGNvbnN0IHRlbU91dHJvc0ZpbiA9IGl0ZW5zLnNvbWUoaSA9PiAhaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGlmICh0ZW1Gb3JtYUZpbiAmJiB0ZW1PdXRyb3NGaW4pIHtcbiAgICBpZiAoIWNvbmZpcm0oJ1x1MjZBMFx1RkUwRiBBdGVuXHUwMEU3XHUwMEUzbyFcXG5cXG5Wb2NcdTAwRUEgdGVtIEJvbG9zIG5hIEZvcm1hIChmZWl0b3Mgc29iIGVuY29tZW5kYSkgbWlzdHVyYWRvcyBjb20gb3V0cm9zIHByb2R1dG9zIG5vIGNhcnJpbmhvLlxcblxcbkJvbG9zIG5hIEZvcm1hIHByZWNpc2FtIGRlIHByYXpvIGRlIDVoIGEgMSBkaWEgXHUwMEZBdGlsIHBhcmEgcHJlcGFyby5cXG5cXG5EZXNlamEgcHJvc3NlZ3VpciBjb20gdG9kb3Mgb3MgaXRlbnMgbWVzbW8gYXNzaW0/JykpXG4gICAgICByZXR1cm47XG4gIH1cbiAgaWYgKGl0ZW5zLmxlbmd0aCA9PT0gMCkgeyBhbGVydCgnQWRpY2lvbmUgcGVsbyBtZW5vcyB1bSBwcm9kdXRvIGFvIGNhcnJpbmhvIScpOyByZXR1cm47IH1cblxuICBjb25zdCBub21lID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJykgYXMgSFRNTElucHV0RWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3QgZW5kZXJlY28gPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3Qgb2JzID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBPYnMnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBwYWdhbWVudG9TZWxlY2lvbmFkbyA9IGFwcFN0b3JlLmdldFN0YXRlKCkucGFnYW1lbnRvU2VsZWNpb25hZG87XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuXG4gIGlmICghbm9tZSkgeyBhbGVydCgnUG9yIGZhdm9yLCBpbmZvcm1lIHNldSBub21lIGNvbXBsZXRvLicpOyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpPy5mb2N1cygpOyByZXR1cm47IH1cbiAgaWYgKCFlbmRlcmVjbykgeyBhbGVydCgnUG9yIGZhdm9yLCBpbmZvcm1lIHNldSBlbmRlcmVcdTAwRTdvLicpOyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKT8uZm9jdXMoKTsgcmV0dXJuOyB9XG4gIGlmICghcGFnYW1lbnRvU2VsZWNpb25hZG8pIHsgYWxlcnQoJ1BvciBmYXZvciwgZXNjb2xoYSBhIGZvcm1hIGRlIHBhZ2FtZW50by4nKTsgcmV0dXJuOyB9XG5cbiAgLy8gUmUtdmVyaWZpY2FyIHByZVx1MDBFN29zIGRvcyBib3RcdTAwRjVlcyBwYXJhIGV2aXRhciBtYW5pcHVsYVx1MDBFN1x1MDBFM28gY2xpZW50LXNpZGVcbiAgY29uc3QgcHJpY2VNYXAgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYnRuLXBlZGlyJykuZm9yRWFjaChidG4gPT4ge1xuICAgIGNvbnN0IG9uY2xpY2tBdHRyID0gYnRuLmdldEF0dHJpYnV0ZSgnb25jbGljaycpID8/ICcnO1xuICAgIGNvbnN0IG0gPSBvbmNsaWNrQXR0ci5tYXRjaCgvcGVkaXJQcm9kdXRvXFwodGhpcywnKC4rPyknLChcXGQrKD86XFwuXFxkKyk/KVxcKS8pO1xuICAgIGlmIChtKSBwcmljZU1hcC5zZXQobVsxXSEsIHBhcnNlRmxvYXQobVsyXSEpKTtcbiAgfSk7XG4gIGNhcnRTZXJ2aWNlLnJldmFsaWRhdGVQcmljZXMocHJpY2VNYXApO1xuXG4gIGNvbnN0IGl0ZW5zVmVyaWZpY2Fkb3MgPSBBcnJheS5mcm9tKGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCkpO1xuICBsZXQgdG90YWwgPSAwO1xuICBsZXQgbGluaGFzSXRlbnMgPSAnJztcbiAgaXRlbnNWZXJpZmljYWRvcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgIHRvdGFsID0gTWF0aC5yb3VuZCgodG90YWwgKyBpdGVtLnByZWNvKSAqIDEwMCkgLyAxMDA7XG4gICAgbGluaGFzSXRlbnMgKz0gYFx1MjAyMiAke2l0ZW0ubm9tZX0gXHUyMDE0IFIkICR7aXRlbS5wcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfVxcbmA7XG4gIH0pO1xuXG4gIGNvbnN0IG1zZyA9IGAqXHVEODNDXHVERjcwIE5PVk8gUEVESURPIC0gR0VMQU1PVVIqXFxuXFxuKlx1RDgzRFx1RENDQiBJVEVOUzoqXFxuJHtsaW5oYXNJdGVuc31cXG4qXHVEODNEXHVEQ0IwIFRvdGFsOiogUiQgJHt0b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfVxcblxcbipcdUQ4M0RcdURDNjQgTm9tZToqICR7bm9tZX1cXG4qXHVEODNEXHVEQ0NEIEVuZGVyZVx1MDBFN286KiAke2VuZGVyZWNvfVxcbipcdUQ4M0RcdURDQjMgUGFnYW1lbnRvOiogJHtwYWdhbWVudG9TZWxlY2lvbmFkb30ke29icyA/IGBcXG4qXHVEODNEXHVEQ0REIE9iczoqICR7b2JzfWAgOiAnJ31cXG5cXG5QZWRpZG8gcGVsbyBjYXJkXHUwMEUxcGlvIG9ubGluZSBcdTI3MjhgO1xuXG4gIGNvbnN0IGJ0bkZpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5GaW5hbGl6YXInKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGNvbnN0IHR4dE9yaWcgPSBidG5GaW4gPyAoYnRuRmluLnRleHRDb250ZW50ID8/ICcnKSA6ICcnO1xuICBpZiAoYnRuRmluKSB7IGJ0bkZpbi5kaXNhYmxlZCA9IHRydWU7IGJ0bkZpbi50ZXh0Q29udGVudCA9ICdTYWx2YW5kbyBwZWRpZG8uLi4nOyB9XG5cbiAgbGV0IF9wZWRpZG9JZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgY3RybCA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBjb25zdCB0aWQgPSBzZXRUaW1lb3V0KCgpID0+IGN0cmwuYWJvcnQoKSwgMTBfMDAwKTtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3BlZGlkb3MnLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTixcbiAgICAgICAgJ1ByZWZlcic6ICdyZXR1cm49aGVhZGVycy1vbmx5J1xuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbm9tZSwgZW5kZXJlY28sXG4gICAgICAgIHBhZ2FtZW50bzogcGFnYW1lbnRvU2VsZWNpb25hZG8sXG4gICAgICAgIGl0ZW5zOiBpdGVuc1ZlcmlmaWNhZG9zLm1hcChpID0+ICh7IG5vbWU6IGkubm9tZSwgcHJlY286IGkucHJlY28gfSkpLFxuICAgICAgICB0b3RhbCxcbiAgICAgICAgc3RhdHVzOiAnYWd1YXJkYW5kbycsXG4gICAgICAgIG9ic2VydmFjYW86IG9icyB8fCBudWxsLFxuICAgICAgICBjbGllbnRlX2lkOiBjbGllbnRlQXR1YWwgPyBjbGllbnRlQXR1YWwuaWQgOiBudWxsLFxuICAgICAgICB0ZWxlZm9uZTogY2xpZW50ZUF0dWFsID8gY2xpZW50ZUF0dWFsLnRlbGVmb25lIDogbnVsbFxuICAgICAgfSksXG4gICAgICBzaWduYWw6IGN0cmwuc2lnbmFsXG4gICAgfSk7XG4gICAgY2xlYXJUaW1lb3V0KHRpZCk7XG4gICAgaWYgKCFyLm9rKSB7XG4gICAgICBjb25zdCBlcnJUeHQgPSBhd2FpdCByLnRleHQoKS5jYXRjaCgoKSA9PiAnJyk7XG4gICAgICBsb2cuZXJyb3IoJ0lOU0VSVCBwZWRpZG8gZmFsaG91JywgeyBzdGF0dXM6IHIuc3RhdHVzLCBib2R5OiBlcnJUeHQuc2xpY2UoMCwgMTIwKSB9KTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSFRUUCAnICsgci5zdGF0dXMgKyAnIFx1MjAxNCAnICsgZXJyVHh0LnNsaWNlKDAsIDEyMCkpO1xuICAgIH1cbiAgICBjb25zdCBsb2MgPSByLmhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpID8/ICcnO1xuICAgIGNvbnN0IGlkTWF0Y2ggPSBsb2MubWF0Y2goL2lkPWVxXFwuKFxcZCspLyk7XG4gICAgaWYgKGlkTWF0Y2gpIHtcbiAgICAgIF9wZWRpZG9JZCA9IHBhcnNlSW50KGlkTWF0Y2hbMV0hLCAxMCk7XG4gICAgICBpZiAoYnRuRmluKSBidG5GaW4udGV4dENvbnRlbnQgPSAnXHUyNzA1IFBlZGlkbyByZWdpc3RyYWRvISc7XG4gICAgICBpZiAoY2xpZW50ZUF0dWFsICYmIGNsaWVudGVBdHVhbC5pZCkge1xuICAgICAgICBjbGllbnRlUmVwb3NpdG9yeS51cGRhdGVFbmRlcmVjbyhjbGllbnRlQXR1YWwuaWQsIGVuZGVyZWNvKVxuICAgICAgICAgIC5jYXRjaCgoZTogdW5rbm93bikgPT4gbG9nLndhcm4oJ05cdTAwRTNvIGZvaSBwb3NzXHUwMEVEdmVsIHNhbHZhciBlbmRlcmVcdTAwRTdvJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoYnRuRmluKSBidG5GaW4udGV4dENvbnRlbnQgPSAnXHUyNkEwXHVGRTBGIEVycm8gLSBwZWRpZG8gc1x1MDBGMyBubyBXaGF0c0FwcCc7XG4gICAgbG9nLndhcm4oJ0Vycm8gYW8gc2FsdmFyIG5vIGJhbmNvJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pO1xuICB9XG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKGJ0bkZpbikgeyBidG5GaW4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuRmluLnRleHRDb250ZW50ID0gdHh0T3JpZzsgfVxuICB9LCAzMDAwKTtcblxuICBpZiAoKHBhZ2FtZW50b1NlbGVjaW9uYWRvID09PSAnUGl4JyB8fCBwYWdhbWVudG9TZWxlY2lvbmFkbyA9PT0gJ0NhcnRcdTAwRTNvJykgJiYgX3BlZGlkb0lkKSB7XG4gICAgY29uc3QgYmlsbGluZ1R5cGUgPSBwYWdhbWVudG9TZWxlY2lvbmFkbyA9PT0gJ0NhcnRcdTAwRTNvJyA/ICdDUkVESVRfQ0FSRCcgOiAnUElYJztcbiAgICBpbmljaWFyRmx1eG9QaXgoX3BlZGlkb0lkLCB0b3RhbCwgbm9tZSwgbXNnLCBiaWxsaW5nVHlwZSwgaXRlbnNWZXJpZmljYWRvcywgZW5kZXJlY28pO1xuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChtc2cpLCAnX2JsYW5rJyk7XG4gICAgaWYgKF9wZWRpZG9JZCkge1xuICAgICAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwZWRpZG9JZFBlbmRlbnRlOiBfcGVkaWRvSWQgfSk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2FDb25maXJtQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbmZpcm1hckVudmlvV0EoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGlkID0gYXBwU3RvcmUuZ2V0U3RhdGUoKS5wZWRpZG9JZFBlbmRlbnRlO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcud2FDb25maXJtLXNpbScpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghaWQpIHsgZmVjaGFyQ29uZmlybVdBKCk7IHJldHVybjsgfVxuICBpZiAoIWNsaWVudGVBdHVhbCB8fCAhY2xpZW50ZUF0dWFsLmlkKSB7IGZlY2hhckNvbmZpcm1XQSgpOyByZXR1cm47IH1cbiAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnQ29uZmlybWFuZG8uLi4nOyBidG4uZGlzYWJsZWQgPSB0cnVlOyB9XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBlZGlkb1JlcG9zaXRvcnkudXBkYXRlU3RhdHVzKGlkLCBjbGllbnRlQXR1YWwuaWQsICdjb25maXJtYWRvJyk7XG4gIGlmIChyZXN1bHQub2spIHtcbiAgICBpZiAoYnRuKSBidG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERjg5IFBlZGlkbyBjb25maXJtYWRvISc7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7IGZlY2hhckNvbmZpcm1XQSgpOyBsaW1wYXJDYXJyaW5obygpOyB9LCAxODAwKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MDUgU2ltLCBtZW5zYWdlbSBlbnZpYWRhISc7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyB9XG4gICAgbG9nLndhcm4oJ0Vycm8gYW8gY29uZmlybWFyIHBlZGlkbycsIHsgZXJyb3I6IHJlc3VsdC5lcnJvci5tZXNzYWdlIH0pO1xuICAgIGZlY2hhckNvbmZpcm1XQSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZlY2hhckNvbmZpcm1XQSgpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dhQ29uZmlybUJhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBlZGlkb0lkUGVuZGVudGU6IG51bGwgfSk7XG59XG5cbi8vID09PT09IEZMVVhPIFBJWCA9PT09PVxuYXN5bmMgZnVuY3Rpb24gaW5pY2lhckZsdXhvUGl4KFxuICBwZWRpZG9JZDogbnVtYmVyLFxuICB0b3RhbDogbnVtYmVyLFxuICBub21lOiBzdHJpbmcsXG4gIG1zZ1dBOiBzdHJpbmcsXG4gIGJpbGxpbmdUeXBlOiBzdHJpbmcsXG4gIGl0ZW5zOiBBcnJheTx7IG5vbWU6IHN0cmluZzsgcHJlY286IG51bWJlciB9PixcbiAgZW5kZXJlY286IHN0cmluZ1xuKTogUHJvbWlzZTx2b2lkPiB7XG4gIF9waXhQZWRpZG9JZCA9IHBlZGlkb0lkO1xuICBfcGl4TXNnV0EgPSBtc2dXQTtcbiAgX3BpeFRvdGFsID0gdG90YWw7XG4gIF9waXhOb21lID0gbm9tZTtcbiAgX3BpeEl0ZW5zID0gaXRlbnMgfHwgW107XG4gIF9waXhFbmRlcmVjbyA9IGVuZGVyZWNvIHx8ICcnO1xuICBjb25zdCBpc1BpeCA9IGJpbGxpbmdUeXBlICE9PSAnQ1JFRElUX0NBUkQnO1xuXG4gIGNvbnN0IHBpeFRpdHVsbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhUaXR1bG8nKTtcbiAgY29uc3QgcGl4U3ViID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeFN1YicpO1xuICBjb25zdCBwaXhWYWxvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhWYWxvcicpO1xuICBjb25zdCBzZWNhb1BpeCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWNhb1BpeCcpO1xuICBjb25zdCBzZWNhb0NhcnRhbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWNhb0NhcnRhbycpO1xuICBjb25zdCBwaXhKYVBhZ3VlaUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhKYVBhZ3VlaUJ0bicpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgcGl4U3RhdHVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeFN0YXR1cycpO1xuICBjb25zdCBwaXhDb2RlQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeENvZGVCb3gnKTtcbiAgY29uc3QgcGl4UXJJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4UXJJbWcnKSBhcyBIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbDtcblxuICBpZiAocGl4VGl0dWxvKSBwaXhUaXR1bG8udGV4dENvbnRlbnQgPSBpc1BpeCA/ICdcdUQ4M0RcdURDQTAgUGFndWUgdmlhIFBpeCcgOiAnXHVEODNEXHVEQ0IzIFBhZ3VlIGNvbSBDYXJ0XHUwMEUzbyc7XG4gIGlmIChwaXhTdWIpIHBpeFN1Yi50ZXh0Q29udGVudCA9IGlzUGl4ID8gJ0NvcGllIG8gY1x1MDBGM2RpZ28gb3UgZXNjYW5laWUgbyBRUiBDb2RlJyA6ICdDclx1MDBFOWRpdG8gb3UgZFx1MDBFOWJpdG8gXHUyMDE0IHByZWVuY2hhIG9zIGRhZG9zIGFiYWl4byc7XG4gIGlmIChwaXhWYWxvcikgcGl4VmFsb3IudGV4dENvbnRlbnQgPSAnUiQgJyArIHRvdGFsLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG4gIGlmIChzZWNhb1BpeCkgc2VjYW9QaXguc3R5bGUuZGlzcGxheSA9IGlzUGl4ID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgaWYgKHNlY2FvQ2FydGFvKSBzZWNhb0NhcnRhby5zdHlsZS5kaXNwbGF5ID0gaXNQaXggPyAnbm9uZScgOiAnYmxvY2snO1xuICBpZiAocGl4SmFQYWd1ZWlCdG4pIHBpeEphUGFndWVpQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGlmIChwaXhTdGF0dXMpIHsgcGl4U3RhdHVzLnRleHRDb250ZW50ID0gaXNQaXggPyAnXHUyM0YzIEdlcmFuZG8gUVIgQ29kZS4uLicgOiAnJzsgcGl4U3RhdHVzLmNsYXNzTmFtZSA9ICdwaXgtc3RhdHVzJyArIChpc1BpeCA/ICcgcGl4LWFndWFyZGFuZG8nIDogJycpOyB9XG4gIGlmIChwaXhDb2RlQm94KSBwaXhDb2RlQm94LnRleHRDb250ZW50ID0gJ0dlcmFuZG8gY1x1MDBGM2RpZ28uLi4nO1xuICBpZiAocGl4UXJJbWcpIHBpeFFySW1nLnNyYyA9ICcnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4QmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG4gIGZlY2hhck1vZGFsKCk7XG5cbiAgaWYgKCFpc1BpeCkgcmV0dXJuO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKEVER0VfVVJMICsgJy9jcmlhci1waXgnLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwZWRpZG9faWQ6IHBlZGlkb0lkLCB0b3RhbCwgbm9tZSwgYmlsbGluZ190eXBlOiAnUElYJyB9KSxcbiAgICB9KTtcbiAgICBpZiAoIXJlc3Aub2spIHRocm93IG5ldyBFcnJvcignSFRUUCAnICsgcmVzcC5zdGF0dXMpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwLmpzb24oKSBhcyB7IGVycm9yPzogc3RyaW5nOyBxcl9jb2RlPzogc3RyaW5nOyBxcl9jb2RlX2ltYWdlPzogc3RyaW5nIH07XG4gICAgaWYgKGRhdGEuZXJyb3IpIHRocm93IG5ldyBFcnJvcihkYXRhLmVycm9yKTtcbiAgICBfcGl4UGF5bG9hZCA9IGRhdGEucXJfY29kZSB8fCAnJztcbiAgICBpZiAocGl4Q29kZUJveCkgcGl4Q29kZUJveC50ZXh0Q29udGVudCA9IF9waXhQYXlsb2FkIHx8ICdDXHUwMEYzZGlnbyBpbmRpc3Bvblx1MDBFRHZlbCc7XG4gICAgaWYgKGRhdGEucXJfY29kZV9pbWFnZSAmJiBwaXhRckltZykgcGl4UXJJbWcuc3JjID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCwnICsgZGF0YS5xcl9jb2RlX2ltYWdlO1xuICAgIGlmIChwaXhTdGF0dXMpIHsgcGl4U3RhdHVzLnRleHRDb250ZW50ID0gJ1x1MjNGMyBBZ3VhcmRhbmRvIHBhZ2FtZW50by4uLic7IHBpeFN0YXR1cy5jbGFzc05hbWUgPSAncGl4LXN0YXR1cyBwaXgtYWd1YXJkYW5kbyc7IH1cbiAgICBpZiAocGl4SmFQYWd1ZWlCdG4pIHBpeEphUGFndWVpQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgX3BpeFBvbGxUaW1lciA9IHNldEludGVydmFsKHZlcmlmaWNhclBhZ2FtZW50b1BpeCwgNDAwMCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2cud2FybignRXJybyBhbyBjcmlhciBQaXgnLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7XG4gICAgaWYgKHBpeENvZGVCb3gpIHBpeENvZGVCb3gudGV4dENvbnRlbnQgPSAnRXJybyBhbyBnZXJhciBjXHUwMEYzZGlnby4nO1xuICAgIGlmIChwaXhTdGF0dXMpIHsgcGl4U3RhdHVzLnRleHRDb250ZW50ID0gJ1x1MjZBMFx1RkUwRiBFcnJvIGFvIGdlcmFyIFFSIENvZGUuIFRlbnRlIG91dHJhIGZvcm1hIGRlIHBhZ2FtZW50by4nOyBwaXhTdGF0dXMuY2xhc3NOYW1lID0gJ3BpeC1zdGF0dXMnOyB9XG4gICAgaWYgKHBpeEphUGFndWVpQnRuKSBwaXhKYVBhZ3VlaUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgfVxufVxuXG5mdW5jdGlvbiBzZWxlY2lvbmFyVGlwb0NhcnRhbyh0aXBvOiBzdHJpbmcpOiB2b2lkIHtcbiAgX2NhcmRUaXBvID0gdGlwbztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkNyZWRpdG8nKT8uY2xhc3NMaXN0LnRvZ2dsZSgnYXRpdm8nLCB0aXBvID09PSAnY3JlZGl0bycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuRGViaXRvJyk/LmNsYXNzTGlzdC50b2dnbGUoJ2F0aXZvJywgdGlwbyA9PT0gJ2RlYml0bycpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRhckNhcnRhbyhlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICBsZXQgdiA9IGVsLnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJykuc3Vic3RyaW5nKDAsIDE2KTtcbiAgZWwudmFsdWUgPSB2LnJlcGxhY2UoLyguezR9KSg/PS4pL2csICckMSAnKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0YXJDcGYoZWw6IEhUTUxJbnB1dEVsZW1lbnQpOiB2b2lkIHtcbiAgbGV0IHYgPSBlbC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpLnN1YnN0cmluZygwLCAxMSk7XG4gIHYgPSB2LnJlcGxhY2UoLyhcXGR7M30pKFxcZCkvLCAnJDEuJDInKTtcbiAgdiA9IHYucmVwbGFjZSgvKFxcZHszfSlcXC4oXFxkezN9KShcXGQpLywgJyQxLiQyLiQzJyk7XG4gIHYgPSB2LnJlcGxhY2UoLyhcXGR7M30pXFwuKFxcZHszfSlcXC4oXFxkezN9KShcXGR7MSwyfSkkLywgJyQxLiQyLiQzLSQ0Jyk7XG4gIGVsLnZhbHVlID0gdjtcbn1cblxuZnVuY3Rpb24gZm9ybWF0YXJWYWxpZGFkZShlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICBsZXQgdiA9IGVsLnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJykuc3Vic3RyaW5nKDAsIDQpO1xuICBpZiAodi5sZW5ndGggPj0gMykgdiA9IHYuc3Vic3RyaW5nKDAsIDIpICsgJy8nICsgdi5zdWJzdHJpbmcoMik7XG4gIGVsLnZhbHVlID0gdjtcbn1cblxuZnVuY3Rpb24gZm9ybWF0YXJDZXAoZWw6IEhUTUxJbnB1dEVsZW1lbnQpOiB2b2lkIHtcbiAgbGV0IHYgPSBlbC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpLnN1YnN0cmluZygwLCA4KTtcbiAgaWYgKHYubGVuZ3RoID4gNSkgdiA9IHYuc3Vic3RyaW5nKDAsIDUpICsgJy0nICsgdi5zdWJzdHJpbmcoNSk7XG4gIGVsLnZhbHVlID0gdjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcGFnYXJDYXJ0YW8oKTogUHJvbWlzZTx2b2lkPiB7XG4gIG1vc3RyYXJUb2FzdCgnXHVEODNEXHVEQ0IzIFBhZ2FtZW50byBwb3IgY2FydFx1MDBFM28gZW0gYnJldmUhIFVzZSBvIFBpeCBwb3IgZW5xdWFudG8uJywgJ2luZm8nKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyUGFnYW1lbnRvUGl4KCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIV9waXhQZWRpZG9JZCkgcmV0dXJuO1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCBwZWRpZG9SZXBvc2l0b3J5LmZpbmRCeUlkKF9waXhQZWRpZG9JZCk7XG4gIGlmIChyZXN1bHQub2sgJiYgcmVzdWx0LnZhbHVlKSB7XG4gICAgY29uc3Qgc3RhdHVzUGFnID0gcmVzdWx0LnZhbHVlLnN0YXR1c1BhZ2FtZW50bztcbiAgICBpZiAoc3RhdHVzUGFnID09PSAncGFnbycpIHtcbiAgICAgIGlmIChfcGl4UG9sbFRpbWVyKSB7IGNsZWFySW50ZXJ2YWwoX3BpeFBvbGxUaW1lcik7IF9waXhQb2xsVGltZXIgPSBudWxsOyB9XG4gICAgICBtb3N0cmFyUmVjaWJvUGl4KCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxvZy53YXJuKCdFcnJvIGFvIHZlcmlmaWNhciBwYWdhbWVudG8nLCB7IGVycm9yOiByZXN1bHQub2sgPyAnbm90IGZvdW5kJyA6IHJlc3VsdC5lcnJvci5tZXNzYWdlIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1vc3RyYXJSZWNpYm9QaXgoKTogdm9pZCB7XG4gIGNvbnN0IGxpbmhhc0l0ZW5zID0gX3BpeEl0ZW5zLm1hcChpID0+XG4gICAgJzxkaXYgY2xhc3M9XCJyZWNpYm8taXRlbVwiPjxzcGFuPicgKyBlc2NIVE1MKGkubm9tZSkgKyAnPC9zcGFuPjxzcGFuPlIkICcgKyBOdW1iZXIoaS5wcmVjbykudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKSArICc8L3NwYW4+PC9kaXY+J1xuICApLmpvaW4oJycpO1xuICBjb25zdCBwaXhCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGl4LWJveCcpO1xuICBpZiAocGl4Qm94KSB7XG4gICAgcGl4Qm94LmlubmVySFRNTCA9XG4gICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTo1MnB4O21hcmdpbi1ib3R0b206OHB4XCI+XHUyNzA1PC9kaXY+JyArXG4gICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToyMHB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojMTY2NTM0O21hcmdpbi1ib3R0b206NHB4XCI+UGFnYW1lbnRvIHJlY2ViaWRvITwvZGl2PicgK1xuICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTNweDtjb2xvcjojNkI1QjUyO21hcmdpbi1ib3R0b206MTZweFwiPlNldSBwZWRpZG8gZm9pIGNvbmZpcm1hZG8gY29tIHN1Y2Vzc288L2Rpdj4nICtcbiAgICAgICc8ZGl2IHN0eWxlPVwiYmFja2dyb3VuZDojZjBmZGY0O2JvcmRlcjoxLjVweCBzb2xpZCAjYmJmN2QwO2JvcmRlci1yYWRpdXM6MTJweDtwYWRkaW5nOjE0cHg7dGV4dC1hbGlnbjpsZWZ0O21hcmdpbi1ib3R0b206MTRweFwiPicgK1xuICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTFweDtmb250LXdlaWdodDo3MDA7Y29sb3I6IzE2NjUzNDttYXJnaW4tYm90dG9tOjhweDt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7bGV0dGVyLXNwYWNpbmc6LjVweFwiPlx1RDgzRFx1RENDQiBSZXN1bW8gZG8gcGVkaWRvPC9kaXY+JyArXG4gICAgICBsaW5oYXNJdGVucyArXG4gICAgICAnPGRpdiBzdHlsZT1cImJvcmRlci10b3A6MXB4IHNvbGlkICNiYmY3ZDA7bWFyZ2luLXRvcDo4cHg7cGFkZGluZy10b3A6OHB4O2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbjtmb250LXdlaWdodDo3MDA7Zm9udC1zaXplOjE0cHhcIj4nICtcbiAgICAgICc8c3Bhbj5Ub3RhbDwvc3Bhbj48c3BhbiBzdHlsZT1cImNvbG9yOiNFODUyOEFcIj5SJCAnICsgTnVtYmVyKF9waXhUb3RhbCkudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKSArICc8L3NwYW4+JyArXG4gICAgICAnPC9kaXY+JyArXG4gICAgICAnPGRpdiBzdHlsZT1cIm1hcmdpbi10b3A6OHB4O2ZvbnQtc2l6ZToxMXB4O2NvbG9yOiM0YjdjNWVcIj5cdUQ4M0RcdURDQ0QgJyArIGVzY0hUTUwoX3BpeEVuZGVyZWNvKSArICc8L2Rpdj4nICtcbiAgICAgICc8L2Rpdj4nICtcbiAgICAgICc8YnV0dG9uIG9uY2xpY2s9XCJmZWNoYXJSZWNpYm9QaXgoKVwiIHN0eWxlPVwid2lkdGg6MTAwJTtwYWRkaW5nOjEzcHg7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCNFODUyOEEsI0MyM0E2RSk7Y29sb3I6I2ZmZjtmb250LXdlaWdodDo3MDA7Zm9udC1zaXplOjE1cHg7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czoxMnB4O2N1cnNvcjpwb2ludGVyO2ZvbnQtZmFtaWx5OmluaGVyaXRcIj5cdUQ4M0RcdURDQUMgVmVyIHBlZGlkbyBubyBXaGF0c0FwcDwvYnV0dG9uPic7XG4gIH1cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KF9waXhNc2dXQSksICdfYmxhbmsnKTtcbiAgfSwgMjAwMCk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhclJlY2lib1BpeCgpOiB2b2lkIHtcbiAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KF9waXhNc2dXQSksICdfYmxhbmsnKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xuICBsaW1wYXJDYXJyaW5obygpO1xuICBfcGl4UGVkaWRvSWQgPSBudWxsOyBfcGl4UGF5bG9hZCA9ICcnOyBfcGl4TXNnV0EgPSAnJzsgX3BpeFRvdGFsID0gMDsgX3BpeE5vbWUgPSAnJztcbiAgX3BpeEl0ZW5zID0gW107IF9waXhFbmRlcmVjbyA9ICcnO1xufVxuXG5mdW5jdGlvbiBjb3BpYXJQaXgoKTogdm9pZCB7XG4gIGlmICghX3BpeFBheWxvYWQpIHJldHVybjtcbiAgaWYgKG5hdmlnYXRvci5jbGlwYm9hcmQpIHtcbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChfcGl4UGF5bG9hZCkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGl4LWNvcHktYnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICAgICAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnXHUyNzA1IENcdTAwRjNkaWdvIGNvcGlhZG8hJzsgc2V0VGltZW91dCgoKSA9PiB7IGJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0RcdURDQ0IgQ29waWFyIGNoYXZlIFBpeCc7IH0sIDI1MDApOyB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgIHRhLnZhbHVlID0gX3BpeFBheWxvYWQ7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0YSk7XG4gICAgdGEuc2VsZWN0KCk7XG4gICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRhKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYW5jZWxhclBpeCgpOiB2b2lkIHtcbiAgaWYgKF9waXhQb2xsVGltZXIpIHsgY2xlYXJJbnRlcnZhbChfcGl4UG9sbFRpbWVyKTsgX3BpeFBvbGxUaW1lciA9IG51bGw7IH1cbiAgY29uc3QgZXN0YUFiZXJ0byA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhCYWNrZHJvcCcpPy5jbGFzc0xpc3QuY29udGFpbnMoJ2FiZXJ0bycpID8/IGZhbHNlO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4QmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIF9waXhQZWRpZG9JZCA9IG51bGw7IF9waXhQYXlsb2FkID0gJyc7IF9waXhNc2dXQSA9ICcnOyBfcGl4VG90YWwgPSAwOyBfcGl4Tm9tZSA9ICcnO1xuICBfcGl4SXRlbnMgPSBbXTsgX3BpeEVuZGVyZWNvID0gJyc7XG4gIGlmIChlc3RhQWJlcnRvKSBhYnJpck1vZGFsKCk7XG59XG5cbmZ1bmN0aW9uIHBpeEphUGFndWVpKCk6IHZvaWQge1xuICBjYW5jZWxhclBpeCgpO1xuICBmaW5hbGl6YXJQZWRpZG9XaGF0c0FwcCgpO1xufVxuXG5mdW5jdGlvbiBmaW5hbGl6YXJQZWRpZG9XaGF0c0FwcCgpOiB2b2lkIHtcbiAgY29uc3QgaXRlbnMgPSBjYXJ0U2VydmljZS5nZXRJdGVtcygpO1xuICBpZiAoaXRlbnMubGVuZ3RoID09PSAwKSB7IG1vc3RyYXJUb2FzdCgnQ2FycmluaG8gdmF6aW8nLCAnZXJybycpOyByZXR1cm47IH1cbiAgY29uc3Qgbm9tZSA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XG4gIGNvbnN0IGVuZGVyZWNvID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBFbmRlcmVjbycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XG4gIGNvbnN0IHRvdGFsID0gQXJyYXkuZnJvbShpdGVucykucmVkdWNlKChzLCBpKSA9PiBzICsgaS5wcmVjbywgMCk7XG4gIGNvbnN0IGxpbmhhcyA9IEFycmF5LmZyb20oaXRlbnMpLm1hcChpID0+IGBcdTI1QjggJHtpLm5vbWV9IFx1MjAxNCBSJCAke2kucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX0gYCkuam9pbignXFxuJyk7XG4gIGNvbnN0IG1zZyA9IGBcdUQ4M0RcdURFRDIgKlBFRElETyBHRUxBTU9VUiogKFBpeCBlbnZpYWRvIG1hbnVhbG1lbnRlKVxcblxcbiR7bGluaGFzfVxcblxcbipUb3RhbDogUiQgJHt0b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfSpcXG5cXG5cdUQ4M0RcdURDNjQgJHtub21lfVxcblx1RDgzRFx1RENDRCAke2VuZGVyZWNvfVxcblxcbl9Db25maXJtYW5kbyBlbnZpbyBkbyBwYWdhbWVudG8gUGl4Ll9gO1xuICB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQobXNnKSwgJ19ibGFuaycpO1xufVxuXG4vLyA9PT09PSBMT0dJTiBVSSA9PT09PVxuZnVuY3Rpb24gbWFzY2FyYVRlbGVmb25lKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGVsLnZhbHVlID0gYXBsaWNhck1hc2NhcmFUZWxlZm9uZShlbC52YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGVudHJhckNvbUNsaWVudGUoY2xpZW50ZVJhdzogQ2xpZW50ZSk6IHZvaWQge1xuICBjb25zdCBkb21haW5DbGllbnRlID0gQ2xpZW50ZUVudGl0eS5mcm9tREIoY2xpZW50ZVJhdyk7XG4gIGxvZ2luVXNlQ2FzZS5sb2dpbihkb21haW5DbGllbnRlKTtcblxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5PdmVybGF5JykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGNvbnN0IHVzdWFyaW9CYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb0JhcicpO1xuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4JztcbiAgY29uc3QgdXN1YXJpb05vbWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvTm9tZScpO1xuICBpZiAodXN1YXJpb05vbWVFbCkgdXN1YXJpb05vbWVFbC50ZXh0Q29udGVudCA9IGNsaWVudGVSYXcubm9tZTtcbiAgY29uc3Qgcm9sZXRhQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkZsdXR1YW50ZScpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKHJvbGV0YUJ0bikgcm9sZXRhQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gIGNvbnN0IHVzdWFyaW9UZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb1RlbCcpO1xuICBpZiAodXN1YXJpb1RlbCkgdXN1YXJpb1RlbC50ZXh0Q29udGVudCA9IGNsaWVudGVSYXcudGVsZWZvbmUucmVwbGFjZSgvXihcXGR7Mn0pKFxcZHs1fSkoXFxkezR9KSQvLCAnKCQxKSAkMi0kMycpO1xuICBjb25zdCBpbnBOb21lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGlucE5vbWUpIGlucE5vbWUudmFsdWUgPSBjbGllbnRlUmF3Lm5vbWU7XG4gIGNvbnN0IGlucEVuZGVyZWNvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGw7XG4gIGlmIChpbnBFbmRlcmVjbyAmJiBjbGllbnRlUmF3LmVuZGVyZWNvKSBpbnBFbmRlcmVjby52YWx1ZSA9IGNsaWVudGVSYXcuZW5kZXJlY287XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhclRlbGVmb25lKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoX3ZlcmlmaWNhbmRvKSByZXR1cm47XG4gIGNvbnN0IHRlbElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCBlcnJvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luRXJybycpO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZXRhcGFUZWxlZm9uZSBidXR0b24nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGlmIChlcnJvKSBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ1ZlcmlmaWNhbmRvLi4uJzsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgfVxuICBfdmVyaWZpY2FuZG8gPSB0cnVlO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxvZ2luVXNlQ2FzZS5leGVjdXRlKHRlbElucHV0LnZhbHVlKTtcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgaWYgKGVycm8pIHsgZXJyby50ZXh0Q29udGVudCA9IHJlc3VsdC5lcnJvci5tZXNzYWdlOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyZXN1bHQudmFsdWUuZXhpc3RlICYmIHJlc3VsdC52YWx1ZS5jbGllbnRlKSB7XG4gICAgICBlbnRyYXJDb21DbGllbnRlKHJlc3VsdC52YWx1ZS5jbGllbnRlLnRvSlNPTigpIGFzIENsaWVudGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBldGFwYVRlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYVRlbGVmb25lJyk7XG4gICAgICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gICAgICBpZiAoZXRhcGFUZWwpIGV0YXBhVGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBpZiAoZXRhcGFDYWQpIGV0YXBhQ2FkLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgKHRlbElucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQgJiB7IGRhdGFzZXQ6IERPTVN0cmluZ01hcCB9KS5kYXRhc2V0Wyd0ZWwnXSA9IHRlbElucHV0LnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5Ob21lJyk/LmZvY3VzKCk7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ1NlbSBjb25leFx1MDBFM28gb3UgZXJybyBubyBzZXJ2aWRvci4gVGVudGUgbm92YW1lbnRlLic7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdDb250aW51YXIgXHUyMTkyJzsgYnRuLmRpc2FibGVkID0gZmFsc2U7IH1cbiAgICBfdmVyaWZpY2FuZG8gPSBmYWxzZTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjYWRhc3RyYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChfY2FkYXN0cmFuZG8pIHJldHVybjtcbiAgY29uc3Qgbm9tZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IHRlbElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCBub21lID0gbm9tZUlucHV0LnZhbHVlO1xuICBjb25zdCB0ZWwgPSAodGVsSW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCAmIHsgZGF0YXNldDogRE9NU3RyaW5nTWFwIH0pLmRhdGFzZXRbJ3RlbCddID8/ICcnO1xuICBjb25zdCBlcnJvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhZGFzdHJvRXJybycpO1xuICBpZiAoIW5vbWUudHJpbSgpKSB7XG4gICAgaWYgKGVycm8pIHsgZXJyby50ZXh0Q29udGVudCA9ICdEaWdpdGUgc2V1IG5vbWUuJzsgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgfVxuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZXJybykgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZXRhcGFDYWRhc3RybyBidXR0b24nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ0VudHJhbmRvLi4uJzsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgfVxuICBfY2FkYXN0cmFuZG8gPSB0cnVlO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxvZ2luVXNlQ2FzZS5yZWdpc3Rlcihub21lLCB0ZWwsICcnKTtcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgaWYgKGVycm8pIHsgZXJyby50ZXh0Q29udGVudCA9IHJlc3VsdC5lcnJvci5tZXNzYWdlOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLnRvSlNPTigpIGFzIENsaWVudGUpO1xuICB9IGNhdGNoIHtcbiAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ0Vycm8gYW8gY2FkYXN0cmFyLiBWZXJpZmlxdWUgc3VhIGNvbmV4XHUwMEUzbyBlIHRlbnRlIG5vdmFtZW50ZS4nOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnRW50cmFyIG5vIGNhcmRcdTAwRTFwaW8gXHUyNzI4JzsgYnRuLmRpc2FibGVkID0gZmFsc2U7IH1cbiAgICBfY2FkYXN0cmFuZG8gPSBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2b2x0YXJFdGFwYVRlbGVmb25lKCk6IHZvaWQge1xuICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gIGNvbnN0IGV0YXBhVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhVGVsZWZvbmUnKTtcbiAgaWYgKGV0YXBhQ2FkKSBldGFwYUNhZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBpZiAoZXRhcGFUZWwpIGV0YXBhVGVsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufVxuXG5mdW5jdGlvbiBzYWlyKCk6IHZvaWQge1xuICBpZiAoIWNvbmZpcm0oJ0Rlc2VqYSBzYWlyIGRhIHN1YSBjb250YT8nKSkgcmV0dXJuO1xuICBsb2dpblVzZUNhc2UubG9nb3V0KCk7XG4gIGNvbnN0IHVzdWFyaW9CYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb0JhcicpO1xuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9ICcnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWUgPSAnJztcbiAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpblRlbGVmb25lJykgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSAnJztcbiAgY29uc3QgZXRhcGFUZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFUZWxlZm9uZScpO1xuICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIGlmIChldGFwYUNhZCkgZXRhcGFDYWQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luT3ZlcmxheScpIS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xufVxuXG5mdW5jdGlvbiBtb3N0cmFyTG9naW4oKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk92ZXJsYXknKSEuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgc2V0VGltZW91dCgoKSA9PiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KT8uZm9jdXMoKSwgMzAwKTtcbn1cblxuLy8gPT09PT0gUk9MRVRBIFVJID09PT09XG5hc3luYyBmdW5jdGlvbiBhYnJpclJvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQmFja2Ryb3AnKTtcbiAgaWYgKCFiZCkgcmV0dXJuO1xuICBiZC5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdtb2RhbC1hYmVydG8nKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVN0YXR1c0JveCcpIS5pbm5lckhUTUwgPSAnJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluYXRpdmEnKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YU5hb0xvZ2FkbycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdHJ1Y29lcycpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkVudmlhcldyYXAnKSEuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFXaGVlbFNlY3Rpb24nKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3UnKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJlc3VsdGFkbycpIS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpdmVsJyk7XG5cbiAgY29uc3QgY2ZnID0gYXdhaXQgY2FycmVnYXJDb25maWdSb2xldGEoKTtcbiAgY29uc3QgcHJlbWlvcyA9IGdldFByZW1pb3MoKTtcblxuICBjb25zdCBncmlkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVByZW1pb3NHcmlkJyk7XG4gIGlmIChncmlkKSB7XG4gICAgY29uc3QgaWNvbmVzID0gWydcdUQ4M0NcdURGNkInLCAnXHVEODNFXHVEREMxJywgJ1x1RDgzRFx1REU5QScsICdcdUQ4M0RcdURDQjgnLCAnXHVEODNEXHVEQ0IwJywgJ1x1RDgzQ1x1REY4OScsICdcdUQ4M0NcdURGNkUnLCAnXHVEODNDXHVERjgwJywgJ1x1RDgzQ1x1REYxRiddO1xuICAgIGdyaWQuaW5uZXJIVE1MID0gcHJlbWlvcy5tYXAoKHAsIGkpID0+IGA8ZGl2IGNsYXNzPVwicm9sZXRhLXByZW1pby1pdGVtXCI+JHtpY29uZXNbaSAlIGljb25lcy5sZW5ndGhdfSAke2VzY0hUTUwocCl9PC9kaXY+YCkuam9pbignJyk7XG4gIH1cblxuICBpZiAoY2ZnICYmICFjZmcuYXRpdmEpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5hdGl2YScpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdHJ1Y29lcycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB9XG5cbiAgZGVzZW5oYXJSb2xldGEocHJlbWlvcyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFXaGVlbFNlY3Rpb24nKSEuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghY2xpZW50ZUF0dWFsKSB7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YU5hb0xvZ2FkbycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgY29uc3QgZ2lyYXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gZmFsc2U7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMSc7IGdpcmFyQnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REZBMSBHSVJBUiBBR09SQSEnOyB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgYXR1YWxpemFyVUlSb2xldGEoc3RhdHVzKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhclJvbGV0YUJhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAncm9sZXRhQmFja2Ryb3AnKSBmZWNoYXJSb2xldGEoKTtcbn1cblxuZnVuY3Rpb24gYXR1YWxpemFyVUlSb2xldGEoaW5mbzogUGFydGljaXBhY2FvIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBzdGF0dXNCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhU3RhdHVzQm94JykhO1xuICBjb25zdCBpbnN0cnVjb2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluc3RydWNvZXMnKSE7XG4gIGNvbnN0IGJ0bkVudmlhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCdG5FbnZpYXJXcmFwJykhO1xuICBjb25zdCB3aGVlbFNlY3Rpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhV2hlZWxTZWN0aW9uJykhO1xuICBjb25zdCBqYUdpcm91ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3UnKSE7XG4gIGNvbnN0IGdpcmFyQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUdpcmFyQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcblxuICB3aGVlbFNlY3Rpb24uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIGRlc2VuaGFyUm9sZXRhKGdldFByZW1pb3MoKSk7XG5cbiAgaWYgKGlzQ29udGFUZXN0ZShhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUpKSB7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gZmFsc2U7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMSc7IGdpcmFyQnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REZBMSBHSVJBUiBBR09SQSEnOyB9XG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICcnO1xuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFpbmZvKSB7XG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICcnO1xuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IGdpcmFyQnRuLnRpdGxlID0gJ0VudmllIHN1YXMgcHJvdmFzIHBhcmEgbGliZXJhciBhIHJvbGV0YSc7IH1cbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoaW5mby5zdGF0dXMgPT09ICdwZW5kZW50ZScpIHtcbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtc3RhdHVzLWJveCByb2xldGEtc3RhdHVzLXBlbmRlbnRlXCI+XHUyM0YzIDxkaXY+PHN0cm9uZz5QYXJ0aWNpcGFcdTAwRTdcdTAwRTNvIGVudmlhZGEhPC9zdHJvbmc+PGJyPlN1YXMgcHJvdmFzIGVzdFx1MDBFM28gZW0gYW5cdTAwRTFsaXNlLiBBZ3VhcmRlIGEgYXByb3ZhXHUwMEU3XHUwMEUzbyAoYXRcdTAwRTkgMjRoKS48L2Rpdj48L2Rpdj4nO1xuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gdHJ1ZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyBnaXJhckJ0bi50aXRsZSA9ICdBZ3VhcmRhbmRvIGFwcm92YVx1MDBFN1x1MDBFM28nOyB9XG4gIH0gZWxzZSBpZiAoaW5mby5zdGF0dXMgPT09ICdyZWplaXRhZG8nKSB7XG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1yZWplaXRhZG9cIj5cdTI3NEMgPGRpdj48c3Ryb25nPlBhcnRpY2lwYVx1MDBFN1x1MDBFM28gblx1MDBFM28gYXByb3ZhZGEuPC9zdHJvbmc+PGJyPlRlbnRlIG5vdmFtZW50ZSBjdW1wcmluZG8gdG9kb3Mgb3MgcmVxdWlzaXRvcy48L2Rpdj48L2Rpdj4nO1xuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgfVxuICB9IGVsc2UgaWYgKGluZm8uc3RhdHVzID09PSAnYXByb3ZhZG8nICYmICFpbmZvLmphX2dpcm91KSB7XG4gICAgY29uc3QgaG9qZSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdO1xuICAgIGNvbnN0IGRpYUFwcm92YWNhbyA9IGluZm8uZGF0YV9hcHJvdmFjYW8gPyBpbmZvLmRhdGFfYXByb3ZhY2FvLnNwbGl0KCdUJylbMF0gOiBudWxsO1xuICAgIGlmIChkaWFBcHJvdmFjYW8gIT09IGhvamUpIHtcbiAgICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1zdGF0dXMtYm94IHJvbGV0YS1zdGF0dXMtcmVqZWl0YWRvXCI+XHUyM0YwIDxkaXY+PHN0cm9uZz5QcmF6byBleHBpcmFkby48L3N0cm9uZz48YnI+Vm9jXHUwMEVBIGZvaSBhcHJvdmFkbyBlbSBvdXRybyBkaWEgZSBuXHUwMEUzbyBnaXJvdSBhIHRlbXBvLiBFbnZpZSBub3ZhcyBwcm92YXMgcGFyYSBwYXJ0aWNpcGFyIG5vdmFtZW50ZS48L2Rpdj48L2Rpdj4nO1xuICAgICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNEXHVERDEyIFByYXpvIGV4cGlyYWRvJzsgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtc3RhdHVzLWJveCByb2xldGEtc3RhdHVzLWFwcm92YWRvXCI+XHUyNzA1IDxkaXY+PHN0cm9uZz5BcHJvdmFkbyEgR2lyZSBob2plITwvc3Ryb25nPjxicj5Wb2NcdTAwRUEgdGVtIGF0XHUwMEU5IG1laWEtbm9pdGUgcGFyYSB1c2FyIHNldSBnaXJvLiBOXHUwMEUzbyBhY3VtdWxhITwvZGl2PjwvZGl2Pic7XG4gICAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSBmYWxzZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcxJzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERkExIEdJUkFSIEFHT1JBISc7IH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaW5mby5qYV9naXJvdSAmJiAhaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHtcbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJyc7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IH1cbiAgICBjb25zdCBwcmVtaW9FbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFKYUdpcm91UHJlbWlvJyk7XG4gICAgaWYgKHByZW1pb0VsKSB7XG4gICAgICBwcmVtaW9FbC5pbm5lckhUTUwgPSBpbmZvLnByZW1pb1xuICAgICAgICA/ICdTZXUgcHJcdTAwRUFtaW8gZm9pOiA8c3Ryb25nIHN0eWxlPVwiY29sb3I6dmFyKC0tcm9zYSlcIj4nICsgZXNjSFRNTChpbmZvLnByZW1pbykgKyAnPC9zdHJvbmc+LiBFbnRyZSBlbSBjb250YXRvIGNvbm9zY28gcGFyYSByZXNnYXRhciEnXG4gICAgICAgIDogJ1ZvY1x1MDBFQSBqXHUwMEUxIHVzb3Ugc3VhIGNoYW5jZSBuZXN0YSBjYW1wYW5oYS4nO1xuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBnaXJhclJvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghY2xpZW50ZUF0dWFsKSB7IG1vc3RyYXJUb2FzdCgnRmFcdTAwRTdhIGxvZ2luIHBhcmEgZ2lyYXIgYSByb2xldGEhJywgJ2Vycm8nKTsgcmV0dXJuOyB9XG5cbiAgY29uc3Qgc3RhdHVzR2lybyA9IGF3YWl0IHZlcmlmaWNhclN0YXR1c1JvbGV0YShjbGllbnRlQXR1YWwuaWQgPz8gMCk7XG4gIGlmICghaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHtcbiAgICBpZiAoIXN0YXR1c0dpcm8gfHwgc3RhdHVzR2lyby5zdGF0dXMgIT09ICdhcHJvdmFkbycgfHwgc3RhdHVzR2lyby5qYV9naXJvdSkge1xuICAgICAgbW9zdHJhclRvYXN0KCdWb2NcdTAwRUEgcHJlY2lzYSBzZXIgYXByb3ZhZG8gcGVsYSBlcXVpcGUgYW50ZXMgZGUgZ2lyYXIhJywgJ2Vycm8nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNlbWFuYSA9IGdldFNlbWFuYUF0dWFsKCk7XG4gICAgICBjb25zdCBjb3VudFJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuY291bnRWZW5jZWRvcmVzU2VtYW5hKHNlbWFuYSk7XG4gICAgICBjb25zdCB2ZW5jZWRvcmVzQ291bnQgPSBjb3VudFJlc3VsdC5vayA/IGNvdW50UmVzdWx0LnZhbHVlIDogMDtcblxuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKGAke1NVUEFCQVNFX1VSTH0vcmVzdC92MS9yb2xldGFfY29uZmlnP2lkPWVxLjEmc2VsZWN0PW1heF92ZW5jZWRvcmVzX3NlbWFuYWAsIHtcbiAgICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICAgIH0pO1xuICAgICAgY29uc3QgY2ZnID0gYXdhaXQgcmVzcC5qc29uKCkgYXMgQXJyYXk8eyBtYXhfdmVuY2Vkb3Jlc19zZW1hbmE6IG51bWJlciB9PjtcbiAgICAgIGNvbnN0IGxpbWl0ZSA9IGNmZ1swXT8ubWF4X3ZlbmNlZG9yZXNfc2VtYW5hID8/IDE7XG4gICAgICBpZiAodmVuY2Vkb3Jlc0NvdW50ID49IGxpbWl0ZSkge1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gICAgICAgIGlmIChidG4pIHsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgfVxuICAgICAgICBjb25zdCByZXN1bHRFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFSZXN1bHRhZG8nKTtcbiAgICAgICAgaWYgKHJlc3VsdEVsKSB7XG4gICAgICAgICAgcmVzdWx0RWwuaW5uZXJIVE1MID0gJ1x1MjZBMFx1RkUwRiA8c3Ryb25nPkpcdTAwRTEgdGVtb3MgdW0gZ2FuaGFkb3IgZXN0YSBzZW1hbmEhPC9zdHJvbmc+PGJyPjxzbWFsbD5BIHByXHUwMEYzeGltYSByb2RhZGEgY29tZVx1MDBFN2EgbmEgc2VtYW5hIHF1ZSB2ZW0uIEZpcXVlIGRlIG9saG8hPC9zbWFsbD4nO1xuICAgICAgICAgIHJlc3VsdEVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2l2ZWwnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkgeyBsb2cud2FybignRXJybyBhbyB2ZXJpZmljYXIgbGltaXRlIHNlbWFuYWwnLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7IH1cbiAgfVxuXG4gIGF3YWl0IGdpcmFyUm9sZXRhRm4oY2xpZW50ZUF0dWFsLCAocHJlbWlvOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCByZXN1bHRFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFSZXN1bHRhZG8nKTtcbiAgICBpZiAocmVzdWx0RWwpIHtcbiAgICAgIHJlc3VsdEVsLmlubmVySFRNTCA9ICdcdUQ4M0NcdURGODkgVm9jXHUwMEVBIGdhbmhvdTogPHN0cm9uZyBzdHlsZT1cImNvbG9yOnZhcigtLXJvc2EpXCI+JyArIGVzY0hUTUwocHJlbWlvKSArICc8L3N0cm9uZz4hPGJyPjxzbWFsbCBzdHlsZT1cImZvbnQtc2l6ZToxM3B4O2NvbG9yOnZhcigtLXRleHRvLXNlYylcIj5FbnRyZSBlbSBjb250YXRvIGNvbm9zY28gcGVsbyBXaGF0c0FwcCBwYXJhIHJlc2dhdGFyIHNldSBwclx1MDBFQW1pbyE8L3NtYWxsPic7XG4gICAgICByZXN1bHRFbC5jbGFzc0xpc3QuYWRkKCd2aXNpdmVsJyk7XG4gICAgfVxuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgICBpZiAoYnRuKSBidG4udGV4dENvbnRlbnQgPSAnXHUyNzEzIEdpcmFkbyEnO1xuICAgIHNhbHZhclZlbmNlZG9yKGNsaWVudGVBdHVhbCwgcHJlbWlvKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVudmlhclByb3Zhc1doYXRzQXBwKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHsgYWxlcnQoJ0ZhXHUwMEU3YSBsb2dpbiBhbnRlcyBkZSBlbnZpYXIgc3VhcyBwcm92YXMuJyk7IHJldHVybjsgfVxuICBjb25zdCBzdGF0dXNBdHVhbCA9IGF3YWl0IHZlcmlmaWNhclN0YXR1c1JvbGV0YShjbGllbnRlQXR1YWwuaWQgPz8gMCk7XG4gIGlmIChzdGF0dXNBdHVhbCAmJiAoc3RhdHVzQXR1YWwuc3RhdHVzID09PSAncGVuZGVudGUnIHx8IHN0YXR1c0F0dWFsLnN0YXR1cyA9PT0gJ2Fwcm92YWRvJykpIHtcbiAgICBhdHVhbGl6YXJVSVJvbGV0YShzdGF0dXNBdHVhbCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG5vbWUgPSBjbGllbnRlQXR1YWwubm9tZSB8fCAnJztcbiAgY29uc3QgdGVsID0gY2xpZW50ZUF0dWFsLnRlbGVmb25lIHx8ICcnO1xuICBjb25zdCBpbnN0RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdGFncmFtSW5wdXQnKSBhcyBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgaW5zdGFncmFtID0gaW5zdEVsID8gaW5zdEVsLnZhbHVlLnRyaW0oKSA6ICcnO1xuICBjb25zdCBtc2cgPSAnT2xcdTAwRTEsIGVxdWlwZSBHZWxhbW91ciEgUXVlcm8gcGFydGljaXBhciBkYSBSb2xldGEgVklQLiUwQSUwQU5vbWU6ICcgKyBlbmNvZGVVUklDb21wb25lbnQobm9tZSkgK1xuICAgICclMEFUZWxlZm9uZTogJyArIGVuY29kZVVSSUNvbXBvbmVudCh0ZWwpICtcbiAgICAoaW5zdGFncmFtID8gJyUwQUluc3RhZ3JhbTogJyArIGVuY29kZVVSSUNvbXBvbmVudChpbnN0YWdyYW0pIDogJycpICtcbiAgICAnJTBBJTBBRXN0b3UgZW52aWFuZG8gYSBmb3RvIGRvcyBtZXVzIDUgYWRlc2l2b3MgZSBvIHByaW50IGRvIFN0b3J5IHBhcmEgdmFsaWRhXHUwMEU3XHUwMEUzbyEnO1xuICB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBtc2csICdfYmxhbmsnKTtcbiAgYXdhaXQgcmVnaXN0cmFyUGFydGljaXBhY2FvKGluc3RhZ3JhbSk7XG4gIGF0dWFsaXphclVJUm9sZXRhKHsgc3RhdHVzOiAncGVuZGVudGUnLCBqYV9naXJvdTogZmFsc2UgfSBhcyBQYXJ0aWNpcGFjYW8pO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWdpc3RyYXJQYXJ0aWNpcGFjYW8oaW5zdGFncmFtOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghY2xpZW50ZUF0dWFsKSByZXR1cm47XG4gIHRyeSB7XG4gICAgY29uc3QgY2hlY2sgPSBhd2FpdCB2ZXJpZmljYXJTdGF0dXNSb2xldGEoY2xpZW50ZUF0dWFsLmlkID8/IDApO1xuICAgIGlmIChjaGVjayAmJiBjaGVjay5zdGF0dXMgIT09ICdyZWplaXRhZG8nKSByZXR1cm47XG4gICAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByb2xldGFSZXBvc2l0b3J5LnNhdmVQYXJ0aWNpcGFjYW8oe1xuICAgICAgbm9tZTogY2xpZW50ZUF0dWFsLm5vbWUsXG4gICAgICB0ZWxlZm9uZTogY2xpZW50ZUF0dWFsLnRlbGVmb25lLFxuICAgICAgaW5zdGFncmFtOiBpbnN0YWdyYW0gfHwgdW5kZWZpbmVkLFxuICAgICAgc3RhdHVzOiAncGVuZGVudGUnLFxuICAgICAgc2VtYW5hLFxuICAgICAgamFfZ2lyb3U6IGZhbHNlLFxuICAgICAgY3JlYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH0gYXMgaW1wb3J0KCcuL2RvbWFpbi9yb2xldGEnKS5QYXJ0aWNpcGFjYW9Qcm9wcyk7XG4gICAgaWYgKHJlc3VsdC5vaykge1xuICAgICAgc2V0UGFydGljaXBhY2FvSWQocmVzdWx0LnZhbHVlLmlkKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHsgbG9nLndhcm4oJ0Vycm8gYW8gcmVnaXN0cmFyIHBhcnRpY2lwYVx1MDBFN1x1MDBFM28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7IH1cbn1cblxuLy8gPT09PT0gQURNSU4gUk9MRVRBID09PT09XG5mdW5jdGlvbiB2ZXJpZmljYXJBZG1pbigpOiBib29sZWFuIHtcbiAgcmV0dXJuIGFwcFN0b3JlLmdldFN0YXRlKCkuaXNBZG1pbjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYWJyaXJSb2xldGFBZG1pbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCF2ZXJpZmljYXJBZG1pbigpKSB7IGFsZXJ0KCdBY2Vzc28gcmVzdHJpdG8uJyk7IHJldHVybjsgfVxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQWRtaW5CYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgYXdhaXQgY2FycmVnYXJQYXJ0aWNpcGFudGVzUm9sZXRhKCk7XG4gIGF3YWl0IGNhcnJlZ2FyQ29uZmlnQWRtaW4oKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhQWRtaW4oKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFBZG1pbkJhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJSb2xldGFBZG1pbkJhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAncm9sZXRhQWRtaW5CYWNrZHJvcCcpIGZlY2hhclJvbGV0YUFkbWluKCk7XG59XG5cbmZ1bmN0aW9uIGFicmlyVGFiQWRtaW4odGFiOiBzdHJpbmcsIGJ0bjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvbGV0YS1hZG1pbi10YWInKS5mb3JFYWNoKHQgPT4gdC5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvbGV0YS1hZG1pbi1wYW5lbCcpLmZvckVhY2gocCA9PiBwLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xuICBidG4uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgY29uc3QgdGFiSWQgPSAndGFiJyArIHRhYi5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRhYi5zbGljZSgxKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFiSWQpPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBpZiAodGFiID09PSAncGVuZGVudGVzJykgY2FycmVnYXJQYXJ0aWNpcGFudGVzUm9sZXRhKCk7XG4gIGVsc2UgaWYgKHRhYiA9PT0gJ2Fwcm92YWRvcycpIGNhcnJlZ2FyQXByb3ZhZG9zUm9sZXRhKCk7XG4gIGVsc2UgaWYgKHRhYiA9PT0gJ3ZlbmNlZG9yZXMnKSBjYXJyZWdhclZlbmNlZG9yZXNSb2xldGEoKTtcbiAgZWxzZSBpZiAodGFiID09PSAnY29uZmlnJykgY2FycmVnYXJDb25maWdBZG1pbigpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjYXJyZWdhclBhcnRpY2lwYW50ZXNSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpc3RhUGVuZGVudGVzJyk7XG4gIGlmICghZWwpIHJldHVybjtcbiAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5DYXJyZWdhbmRvLi4uPC9kaXY+JztcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9wYXJ0aWNpcGFjb2VzP3N0YXR1cz1lcS5wZW5kZW50ZSZvcmRlcj1jcmVhdGVkX2F0LmRlc2MnLCB7XG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByLmpzb24oKSBhcyBBcnJheTxQYXJ0aWNpcGFjYW8+O1xuICAgIGlmICghZGF0YSB8fCAhZGF0YS5sZW5ndGgpIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5OZW5odW0gcGFydGljaXBhbnRlIHBlbmRlbnRlLjwvZGl2Pic7IHJldHVybjsgfVxuICAgIGVsLmlubmVySFRNTCA9IGRhdGEubWFwKHAgPT4ge1xuICAgICAgY29uc3QgZHQgPSBuZXcgRGF0ZShwLmNyZWF0ZWRfYXQpLnRvTG9jYWxlU3RyaW5nKCdwdC1CUicpO1xuICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1pdGVtXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1pbmZvXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1ub21lXCI+JyArIGVzY0hUTUwocC5ub21lID8/ICcnKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLXRlbFwiPicgKyBlc2NIVE1MKHAudGVsZWZvbmUpICsgKHAuaW5zdGFncmFtID8gJyBcdTAwQjcgQCcgKyBlc2NIVE1MKHAuaW5zdGFncmFtKSA6ICcnKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTFweDtjb2xvcjojOTk5XCI+JyArIGR0ICsgJzwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1hY29lc1wiPicgK1xuICAgICAgICAnPGJ1dHRvbiBjbGFzcz1cImJ0bi1hcHJvdmFyXCIgb25jbGljaz1cImFwcm92YXJQYXJ0aWNpcGFudGUoJyArIHAuaWQgKyAnLCB0aGlzKVwiPlx1MjcxMyBBcHJvdmFyPC9idXR0b24+JyArXG4gICAgICAgICc8YnV0dG9uIGNsYXNzPVwiYnRuLXJlamVpdGFyXCIgb25jbGljaz1cInJlamVpdGFyUGFydGljaXBhbnRlKCcgKyBwLmlkICsgJywgdGhpcylcIj5cdTI3MTcgUmVqZWl0YXI8L2J1dHRvbj4nICtcbiAgICAgICAgJzwvZGl2PjwvZGl2Pic7XG4gICAgfSkuam9pbignJyk7XG4gIH0gY2F0Y2ggeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkVycm8gYW8gY2FycmVnYXIuPC9kaXY+JzsgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjYXJyZWdhckFwcm92YWRvc1JvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlzdGFBcHJvdmFkb3MnKTtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkNhcnJlZ2FuZG8uLi48L2Rpdj4nO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/c3RhdHVzPWVxLmFwcm92YWRvJm9yZGVyPWRhdGFfYXByb3ZhY2FvLmRlc2MnLCB7XG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByLmpzb24oKSBhcyBBcnJheTxQYXJ0aWNpcGFjYW8+O1xuICAgIGlmICghZGF0YSB8fCAhZGF0YS5sZW5ndGgpIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5OZW5odW0gYXByb3ZhZG8gYWluZGEuPC9kaXY+JzsgcmV0dXJuOyB9XG4gICAgZWwuaW5uZXJIVE1MID0gZGF0YS5tYXAocCA9PiB7XG4gICAgICBjb25zdCBkdCA9IHAuZGF0YV9hcHJvdmFjYW8gPyBuZXcgRGF0ZShwLmRhdGFfYXByb3ZhY2FvKS50b0xvY2FsZVN0cmluZygncHQtQlInKSA6ICdcdTIwMTQnO1xuICAgICAgY29uc3QgZ2lyb3UgPSBwLmphX2dpcm91ID8gJ1x1MjcxMyBHaXJvdSBcdTIwMTQgJyArIGVzY0hUTUwocC5wcmVtaW8gPz8gJycpIDogJ1x1MjNGMyBBZ3VhcmRhbmRvIGdpcmFyJztcbiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtaXRlbVwiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtaW5mb1wiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtbm9tZVwiPicgKyBlc2NIVE1MKHAubm9tZSA/PyAnJykgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS10ZWxcIj4nICsgZXNjSFRNTChwLnRlbGVmb25lKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTFweDtjb2xvcjojMzg4ZTNjXCI+JyArIGdpcm91ICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxMXB4O2NvbG9yOiM5OTlcIj5BcHJvdmFkbyBlbTogJyArIGR0ICsgJzwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+PC9kaXY+JztcbiAgICB9KS5qb2luKCcnKTtcbiAgfSBjYXRjaCB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+RXJybyBhbyBjYXJyZWdhci48L2Rpdj4nOyB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFwcm92YXJQYXJ0aWNpcGFudGUoaWQ6IG51bWJlciwgYnRuOiBIVE1MQnV0dG9uRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4udGV4dENvbnRlbnQgPSAnLi4uJztcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfcGFydGljaXBhY29lcz9pZD1lcS4nICsgaWQsIHtcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiwgJ1ByZWZlcic6ICdyZXR1cm49bWluaW1hbCdcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHN0YXR1czogJ2Fwcm92YWRvJyxcbiAgICAgICAgZGF0YV9hcHJvdmFjYW86IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgYXByb3ZhZG9fcG9yOiBjbGllbnRlQXR1YWwgPyBjbGllbnRlQXR1YWwubm9tZSA6ICdhZG1pbidcbiAgICAgIH0pXG4gICAgfSk7XG4gICAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ3N0YXR1cyAnICsgci5zdGF0dXMpO1xuICAgIGJ0bi5jbG9zZXN0KCcucm9sZXRhLXBhcnRpY2lwYW50ZS1pdGVtJyk/LnJlbW92ZSgpO1xuICB9IGNhdGNoIHtcbiAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ1x1MjcxMyBBcHJvdmFyJztcbiAgICBhbGVydCgnRXJybyBhbyBhcHJvdmFyLicpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlamVpdGFyUGFydGljaXBhbnRlKGlkOiBudW1iZXIsIGJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFjb25maXJtKCdSZWplaXRhciBlc3RhIHBhcnRpY2lwYVx1MDBFN1x1MDBFM28/JykpIHJldHVybjtcbiAgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnRleHRDb250ZW50ID0gJy4uLic7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfcGFydGljaXBhY29lcz9pZD1lcS4nICsgaWQsIHtcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiwgJ1ByZWZlcic6ICdyZXR1cm49bWluaW1hbCdcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN0YXR1czogJ3JlamVpdGFkbycgfSlcbiAgICB9KTtcbiAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcignc3RhdHVzICcgKyByLnN0YXR1cyk7XG4gICAgYnRuLmNsb3Nlc3QoJy5yb2xldGEtcGFydGljaXBhbnRlLWl0ZW0nKT8ucmVtb3ZlKCk7XG4gIH0gY2F0Y2gge1xuICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAnXHUyNzE3IFJlamVpdGFyJztcbiAgICBhbGVydCgnRXJybyBhbyByZWplaXRhci4nKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjYXJyZWdhclZlbmNlZG9yZXNSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpc3RhVmVuY2Vkb3JlcycpO1xuICBpZiAoIWVsKSByZXR1cm47XG4gIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+Q2FycmVnYW5kby4uLjwvZGl2Pic7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfdmVuY2Vkb3Jlcz9vcmRlcj1kYXRhX3ZpdG9yaWEuZGVzYycsIHtcbiAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PHsgbm9tZT86IHN0cmluZzsgcHJlbWlvOiBzdHJpbmc7IHRlbGVmb25lPzogc3RyaW5nOyBzZW1hbmE/OiBzdHJpbmc7IGRhdGFfdml0b3JpYTogc3RyaW5nIH0+O1xuICAgIGlmICghZGF0YSB8fCAhZGF0YS5sZW5ndGgpIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5OZW5odW0gdmVuY2Vkb3IgYWluZGEuPC9kaXY+JzsgcmV0dXJuOyB9XG4gICAgZWwuaW5uZXJIVE1MID0gZGF0YS5tYXAodiA9PiB7XG4gICAgICBjb25zdCBkdCA9IG5ldyBEYXRlKHYuZGF0YV92aXRvcmlhKS50b0xvY2FsZVN0cmluZygncHQtQlInKTtcbiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInJvbGV0YS12ZW5jZWRvci1pdGVtXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXZlbmNlZG9yLW5vbWVcIj5cdUQ4M0NcdURGQzYgJyArIGVzY0hUTUwodi5ub21lID8/ICdcdTIwMTQnKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtdmVuY2Vkb3ItcHJlbWlvXCI+XHVEODNDXHVERjgxICcgKyBlc2NIVE1MKHYucHJlbWlvKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtdmVuY2Vkb3ItZGF0YVwiPicgKyBlc2NIVE1MKHYudGVsZWZvbmUgPz8gJycpICsgJyBcdTAwQjcgU2VtYW5hICcgKyBlc2NIVE1MKHYuc2VtYW5hID8/ICcnKSArICcgXHUwMEI3ICcgKyBkdCArICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2Pic7XG4gICAgfSkuam9pbignJyk7XG4gIH0gY2F0Y2ggeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkVycm8gYW8gY2FycmVnYXIuPC9kaXY+JzsgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjYXJyZWdhckNvbmZpZ0FkbWluKCk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX2NvbmZpZz9pZD1lcS4xJmxpbWl0PTEnLCB7XG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByLmpzb24oKSBhcyBBcnJheTx7IGF0aXZhOiBib29sZWFuOyBwcmVtaW9zOiBzdHJpbmdbXSB9PjtcbiAgICBpZiAoZGF0YSAmJiBkYXRhWzBdKSB7XG4gICAgICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ0F0aXZhJykgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZCA9IGRhdGFbMF0hLmF0aXZhO1xuICAgICAgY29uc3QgcHJlbWlvcyA9IEFycmF5LmlzQXJyYXkoZGF0YVswXSEucHJlbWlvcykgPyBkYXRhWzBdIS5wcmVtaW9zIDogZ2V0UHJlbWlvc1BhZHJhbygpO1xuICAgICAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdQcmVtaW9zJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWUgPSBwcmVtaW9zLmpvaW4oJ1xcbicpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyBsb2cud2FybignRXJybyBhbyBjYXJyZWdhciBjb25maWcgYWRtaW4nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7IH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc2FsdmFyQ29uZmlnUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBhdGl2YSA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnQXRpdmEnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkO1xuICBjb25zdCBwcmVtaW9zVHh0ID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdQcmVtaW9zJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWU7XG4gIGNvbnN0IHByZW1pb3MgPSBwcmVtaW9zVHh0LnNwbGl0KCdcXG4nKS5tYXAocyA9PiBzLnRyaW0oKSkuZmlsdGVyKHMgPT4gcy5sZW5ndGggPiAwKTtcbiAgY29uc3QgbXNnRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnTXNnJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX2NvbmZpZz9pZD1lcS4xJywge1xuICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTixcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OLCAnUHJlZmVyJzogJ3JldHVybj1taW5pbWFsJ1xuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYXRpdmEsIHByZW1pb3MsIHVwZGF0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9KVxuICAgIH0pO1xuICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKCdzdGF0dXMgJyArIHIuc3RhdHVzKTtcbiAgICBzZXRQcmVtaW9zKHByZW1pb3MpO1xuICAgIGlmIChtc2dFbCkgeyBtc2dFbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgc2V0VGltZW91dCgoKSA9PiB7IG1zZ0VsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0sIDI1MDApOyB9XG4gIH0gY2F0Y2ggeyBhbGVydCgnRXJybyBhbyBzYWx2YXIgY29uZmlndXJhXHUwMEU3XHUwMEY1ZXMuJyk7IH1cbn1cblxuLy8gPT09PT0gSU5JVCA9PT09PVxuKGFzeW5jIGZ1bmN0aW9uIGluaXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgLy8gVGVudGEgcmVzdGF1cmFyIHNlc3NcdTAwRTNvIHZpYSBMb2dpblVzZUNhc2UgKHZlcmlmaWNhIFRUTCArIHN0b3JlKVxuICAgIGNvbnN0IGNsaWVudGVTZXNzYW8gPSBsb2dpblVzZUNhc2UucmVzdG9yZVNlc3Npb24oKTtcbiAgICBpZiAoY2xpZW50ZVNlc3Nhbykge1xuICAgICAgLy8gUmV2YWxpZGEgbm8gYmFuY29cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxvZ2luVXNlQ2FzZS5leGVjdXRlKGNsaWVudGVTZXNzYW8udGVsZWZvbmUpO1xuICAgICAgaWYgKHJlc3VsdC5vayAmJiByZXN1bHQudmFsdWUuZXhpc3RlICYmIHJlc3VsdC52YWx1ZS5jbGllbnRlKSB7XG4gICAgICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLmNsaWVudGUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZ2luVXNlQ2FzZS5sb2dvdXQoKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHsgbG9nLndhcm4oJ0Vycm8gYW8gdmVyaWZpY2FyIHNlc3NcdTAwRTNvJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pOyB9XG4gIG1vc3RyYXJMb2dpbigpO1xufSkoKTtcblxuLy8gUFdBIHNlcnZpY2Ugd29ya2VyXG5pZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xuICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3Rlcignc3cuanMnKS5jYXRjaCgoKSA9PiB7fSk7XG59XG5cbi8vIFNpbmNyb25pemFyIGNhcmRcdTAwRTFwaW8gY29tIFN1cGFiYXNlXG4oYXN5bmMgZnVuY3Rpb24gc2luY3Jvbml6YXJDYXJkYXBpbygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjdHJsID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBjdHJsLmFib3J0KCksIDEwXzAwMCk7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9wcm9kdXRvcz9zZWxlY3Q9bm9tZSxwcmVjbyxkaXNwb25pdmVsJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH0sXG4gICAgICBzaWduYWw6IGN0cmwuc2lnbmFsXG4gICAgfSk7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBpZiAoIXIub2spIHJldHVybjtcbiAgICBjb25zdCBwcm9kcyA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyOyBkaXNwb25pdmVsOiBib29sZWFuIH0+O1xuICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9kcykgfHwgIXByb2RzLmxlbmd0aCkgcmV0dXJuO1xuICAgIGNvbnN0IG1hcGE6IFJlY29yZDxzdHJpbmcsIHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyOyBkaXNwb25pdmVsOiBib29sZWFuIH0+ID0ge307XG4gICAgcHJvZHMuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwICYmIHR5cGVvZiBwLm5vbWUgPT09ICdzdHJpbmcnICYmIHAubm9tZS50cmltKCkpIG1hcGFbcC5ub21lLnRyaW0oKS50b0xvd2VyQ2FzZSgpXSA9IHA7XG4gICAgfSk7XG4gICAgY29uc3QgcHJpY2VNYXAgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idG4tcGVkaXInKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgICBjb25zdCBvbmNsaWNrQXR0ciA9IGJ0bi5nZXRBdHRyaWJ1dGUoJ29uY2xpY2snKSA/PyAnJztcbiAgICAgIGNvbnN0IG0gPSBvbmNsaWNrQXR0ci5tYXRjaCgvcGVkaXJQcm9kdXRvXFwodGhpcywnKC4rPyknLChcXGQrKD86XFwuXFxkKyk/KVxcKS8pO1xuICAgICAgaWYgKCFtKSByZXR1cm47XG4gICAgICBjb25zdCBub21lUHJvZCA9IG1bMV0hO1xuICAgICAgY29uc3QgY2hhdmUgPSBub21lUHJvZC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IGRiID0gbWFwYVtjaGF2ZV07XG4gICAgICBpZiAoIWRiKSByZXR1cm47XG4gICAgICBjb25zdCBjYXJkID0gYnRuLmNsb3Nlc3QoJy5wcm9kLWNhcmQnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICBpZiAoIWNhcmQpIHJldHVybjtcbiAgICAgIGlmIChkYi5kaXNwb25pdmVsID09PSBmYWxzZSkgeyBjYXJkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IHJldHVybjsgfVxuICAgICAgY29uc3Qgbm92b1ByZWNvID0gcGFyc2VGbG9hdChTdHJpbmcoZGIucHJlY28pKTtcbiAgICAgIGlmIChpc05hTihub3ZvUHJlY28pIHx8IG5vdm9QcmVjbyA8PSAwKSByZXR1cm47XG4gICAgICBidG4uc2V0QXR0cmlidXRlKCdvbmNsaWNrJywgXCJwZWRpclByb2R1dG8odGhpcywnXCIgKyBub21lUHJvZC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIikgKyBcIicsXCIgKyBub3ZvUHJlY28gKyBcIilcIik7XG4gICAgICBjb25zdCBwcmVjb0VsID0gY2FyZC5xdWVyeVNlbGVjdG9yKCcucHJvZC1wcmVjbycpO1xuICAgICAgaWYgKHByZWNvRWwpIHByZWNvRWwudGV4dENvbnRlbnQgPSAnUiQgJyArIG5vdm9QcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xuICAgICAgcHJpY2VNYXAuc2V0KG5vbWVQcm9kLCBub3ZvUHJlY28pO1xuICAgIH0pO1xuICAgIGNhcnRTZXJ2aWNlLnJldmFsaWRhdGVQcmljZXMocHJpY2VNYXApO1xuICB9IGNhdGNoIHsgLyogc2lsZW5jaW9zbyAqLyB9XG59KSgpO1xuXG4vLyBGZWNoYXIgbW9kYWlzIGNvbSBFc2NhcGVcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgZmVjaGFyRGlhbG9nKCk7XG4gICAgZmVjaGFyTW9kYWwoKTtcbiAgICBmZWNoYXJDb25maXJtV0EoKTtcbiAgICBjYW5jZWxhclBpeCgpO1xuICB9XG59KTtcblxuLy8gPT09PT0gRVhQT1IgUEFSQSBIVE1MIChvbmNsaWNrPVwiLi4uXCIpID09PT09XG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIGZpbHRyYXI6IHR5cGVvZiBmaWx0cmFyO1xuICAgIHBlZGlyUHJvZHV0bzogdHlwZW9mIHBlZGlyUHJvZHV0bztcbiAgICBhYnJpckRpYWxvZzogdHlwZW9mIGFicmlyRGlhbG9nO1xuICAgIGZlY2hhckRpYWxvZzogdHlwZW9mIGZlY2hhckRpYWxvZztcbiAgICBmZWNoYXJEaWFsb2dCYWNrZHJvcDogdHlwZW9mIGZlY2hhckRpYWxvZ0JhY2tkcm9wO1xuICAgIGlyUGFyYUZpbmFsaXphcjogdHlwZW9mIGlyUGFyYUZpbmFsaXphcjtcbiAgICBhYnJpck1vZGFsOiB0eXBlb2YgYWJyaXJNb2RhbDtcbiAgICBmZWNoYXJNb2RhbDogdHlwZW9mIGZlY2hhck1vZGFsO1xuICAgIGZlY2hhck1vZGFsQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJNb2RhbEJhY2tkcm9wO1xuICAgIHJlbW92ZXJEb0NhcnJpbmhvOiB0eXBlb2YgcmVtb3ZlckRvQ2FycmluaG87XG4gICAgc2VsZWNpb25hclBhZ2FtZW50bzogdHlwZW9mIHNlbGVjaW9uYXJQYWdhbWVudG87XG4gICAgZmluYWxpemFyUGVkaWRvOiB0eXBlb2YgZmluYWxpemFyUGVkaWRvO1xuICAgIGNvbmZpcm1hckVudmlvV0E6IHR5cGVvZiBjb25maXJtYXJFbnZpb1dBO1xuICAgIGZlY2hhckNvbmZpcm1XQTogdHlwZW9mIGZlY2hhckNvbmZpcm1XQTtcbiAgICBwZWRpckJvbG9Gb3JtYTogdHlwZW9mIHBlZGlyQm9sb0Zvcm1hO1xuICAgIGFicmlyRGlhbG9nQm9sbzogdHlwZW9mIGFicmlyRGlhbG9nQm9sbztcbiAgICBmZWNoYXJEaWFsb2dCb2xvOiB0eXBlb2YgZmVjaGFyRGlhbG9nQm9sbztcbiAgICBhZ2VuZGFyQm9sb1doYXRzQXBwOiB0eXBlb2YgYWdlbmRhckJvbG9XaGF0c0FwcDtcbiAgICBjYXJvdXNlbE5leHQ6IHR5cGVvZiBjYXJvdXNlbE5leHQ7XG4gICAgY2Fyb3VzZWxQcmV2OiB0eXBlb2YgY2Fyb3VzZWxQcmV2O1xuICAgIGNvcGlhclBpeDogdHlwZW9mIGNvcGlhclBpeDtcbiAgICBjYW5jZWxhclBpeDogdHlwZW9mIGNhbmNlbGFyUGl4O1xuICAgIHBpeEphUGFndWVpOiB0eXBlb2YgcGl4SmFQYWd1ZWk7XG4gICAgc2VsZWNpb25hclRpcG9DYXJ0YW86IHR5cGVvZiBzZWxlY2lvbmFyVGlwb0NhcnRhbztcbiAgICBmb3JtYXRhckNhcnRhbzogdHlwZW9mIGZvcm1hdGFyQ2FydGFvO1xuICAgIGZvcm1hdGFyQ3BmOiB0eXBlb2YgZm9ybWF0YXJDcGY7XG4gICAgZm9ybWF0YXJWYWxpZGFkZTogdHlwZW9mIGZvcm1hdGFyVmFsaWRhZGU7XG4gICAgZm9ybWF0YXJDZXA6IHR5cGVvZiBmb3JtYXRhckNlcDtcbiAgICBwYWdhckNhcnRhbzogdHlwZW9mIHBhZ2FyQ2FydGFvO1xuICAgIGZlY2hhclJlY2lib1BpeDogdHlwZW9mIGZlY2hhclJlY2lib1BpeDtcbiAgICBtYXNjYXJhVGVsZWZvbmU6IHR5cGVvZiBtYXNjYXJhVGVsZWZvbmU7XG4gICAgdmVyaWZpY2FyVGVsZWZvbmU6IHR5cGVvZiB2ZXJpZmljYXJUZWxlZm9uZTtcbiAgICBjYWRhc3RyYXI6IHR5cGVvZiBjYWRhc3RyYXI7XG4gICAgdm9sdGFyRXRhcGFUZWxlZm9uZTogdHlwZW9mIHZvbHRhckV0YXBhVGVsZWZvbmU7XG4gICAgc2FpcjogdHlwZW9mIHNhaXI7XG4gICAgYWJyaXJSb2xldGE6IHR5cGVvZiBhYnJpclJvbGV0YTtcbiAgICBmZWNoYXJSb2xldGE6IHR5cGVvZiBmZWNoYXJSb2xldGE7XG4gICAgZmVjaGFyUm9sZXRhQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJSb2xldGFCYWNrZHJvcDtcbiAgICBnaXJhclJvbGV0YTogdHlwZW9mIGdpcmFyUm9sZXRhO1xuICAgIGVudmlhclByb3Zhc1doYXRzQXBwOiB0eXBlb2YgZW52aWFyUHJvdmFzV2hhdHNBcHA7XG4gICAgYWJyaXJSb2xldGFBZG1pbjogdHlwZW9mIGFicmlyUm9sZXRhQWRtaW47XG4gICAgZmVjaGFyUm9sZXRhQWRtaW46IHR5cGVvZiBmZWNoYXJSb2xldGFBZG1pbjtcbiAgICBmZWNoYXJSb2xldGFBZG1pbkJhY2tkcm9wOiB0eXBlb2YgZmVjaGFyUm9sZXRhQWRtaW5CYWNrZHJvcDtcbiAgICBhYnJpclRhYkFkbWluOiB0eXBlb2YgYWJyaXJUYWJBZG1pbjtcbiAgICBhcHJvdmFyUGFydGljaXBhbnRlOiB0eXBlb2YgYXByb3ZhclBhcnRpY2lwYW50ZTtcbiAgICByZWplaXRhclBhcnRpY2lwYW50ZTogdHlwZW9mIHJlamVpdGFyUGFydGljaXBhbnRlO1xuICAgIHNhbHZhckNvbmZpZ1JvbGV0YTogdHlwZW9mIHNhbHZhckNvbmZpZ1JvbGV0YTtcbiAgfVxufVxuXG5PYmplY3QuYXNzaWduKHdpbmRvdywge1xuICBmaWx0cmFyLFxuICBwZWRpclByb2R1dG8sXG4gIGFicmlyRGlhbG9nLFxuICBmZWNoYXJEaWFsb2csXG4gIGZlY2hhckRpYWxvZ0JhY2tkcm9wLFxuICBpclBhcmFGaW5hbGl6YXIsXG4gIGFicmlyTW9kYWwsXG4gIGZlY2hhck1vZGFsLFxuICBmZWNoYXJNb2RhbEJhY2tkcm9wLFxuICByZW1vdmVyRG9DYXJyaW5obyxcbiAgc2VsZWNpb25hclBhZ2FtZW50byxcbiAgZmluYWxpemFyUGVkaWRvLFxuICBjb25maXJtYXJFbnZpb1dBLFxuICBmZWNoYXJDb25maXJtV0EsXG4gIHBlZGlyQm9sb0Zvcm1hLFxuICBhYnJpckRpYWxvZ0JvbG8sXG4gIGZlY2hhckRpYWxvZ0JvbG8sXG4gIGFnZW5kYXJCb2xvV2hhdHNBcHAsXG4gIGNhcm91c2VsTmV4dCxcbiAgY2Fyb3VzZWxQcmV2LFxuICBjb3BpYXJQaXgsXG4gIGNhbmNlbGFyUGl4LFxuICBwaXhKYVBhZ3VlaSxcbiAgc2VsZWNpb25hclRpcG9DYXJ0YW8sXG4gIGZvcm1hdGFyQ2FydGFvLFxuICBmb3JtYXRhckNwZixcbiAgZm9ybWF0YXJWYWxpZGFkZSxcbiAgZm9ybWF0YXJDZXAsXG4gIHBhZ2FyQ2FydGFvLFxuICBmZWNoYXJSZWNpYm9QaXgsXG4gIG1hc2NhcmFUZWxlZm9uZSxcbiAgdmVyaWZpY2FyVGVsZWZvbmUsXG4gIGNhZGFzdHJhcixcbiAgdm9sdGFyRXRhcGFUZWxlZm9uZSxcbiAgc2FpcixcbiAgYWJyaXJSb2xldGEsXG4gIGZlY2hhclJvbGV0YSxcbiAgZmVjaGFyUm9sZXRhQmFja2Ryb3AsXG4gIGdpcmFyUm9sZXRhLFxuICBlbnZpYXJQcm92YXNXaGF0c0FwcCxcbiAgYWJyaXJSb2xldGFBZG1pbixcbiAgZmVjaGFyUm9sZXRhQWRtaW4sXG4gIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3AsXG4gIGFicmlyVGFiQWRtaW4sXG4gIGFwcm92YXJQYXJ0aWNpcGFudGUsXG4gIHJlamVpdGFyUGFydGljaXBhbnRlLFxuICBzYWx2YXJDb25maWdSb2xldGEsXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRU8sV0FBUyxhQUFhLEtBQWEsT0FBa0IsUUFBYztBQUN4RSxVQUFNLE1BQU0sU0FBUyxlQUFlLFFBQVE7QUFDNUMsUUFBSSxJQUFLLEtBQUksT0FBTztBQUNwQixVQUFNLElBQUksU0FBUyxjQUFjLEtBQUs7QUFDdEMsTUFBRSxLQUFLO0FBQ1AsTUFBRSxjQUFjO0FBQ2hCLFVBQU0sS0FBSyxTQUFTLFNBQVMsWUFBWSxTQUFTLE9BQU8sWUFBWTtBQUNyRSxXQUFPLE9BQU8sRUFBRSxPQUFPO0FBQUEsTUFDckIsVUFBVTtBQUFBLE1BQVMsUUFBUTtBQUFBLE1BQVEsTUFBTTtBQUFBLE1BQ3pDLFdBQVc7QUFBQSxNQUNYLFlBQVk7QUFBQSxNQUFJLE9BQU87QUFBQSxNQUFRLFNBQVM7QUFBQSxNQUN4QyxjQUFjO0FBQUEsTUFBUSxVQUFVO0FBQUEsTUFBUSxZQUFZO0FBQUEsTUFDcEQsUUFBUTtBQUFBLE1BQVMsV0FBVztBQUFBLE1BQzVCLFVBQVU7QUFBQSxNQUFRLFdBQVc7QUFBQSxNQUM3QixZQUFZO0FBQUEsTUFBZSxTQUFTO0FBQUEsTUFDcEMsWUFBWTtBQUFBLElBQ2QsQ0FBaUM7QUFDakMsYUFBUyxLQUFLLFlBQVksQ0FBQztBQUMzQixlQUFXLE1BQU07QUFDZixRQUFFLE1BQU0sVUFBVTtBQUNsQixpQkFBVyxNQUFNLEVBQUUsT0FBTyxHQUFHLEdBQUc7QUFBQSxJQUNsQyxHQUFHLElBQUk7QUFBQSxFQUNUOzs7QUN4Qk8sV0FBUyxRQUFRLEdBQW9CO0FBQzFDLFdBQU8sT0FBTyxDQUFDLEVBQ1osUUFBUSxNQUFNLE9BQU8sRUFDckIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLFFBQVEsRUFD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LEdBQUcsZUFBZSxPQUFPO0FBQUUsZUFBSyxNQUFNLFVBQVU7QUFBUTtBQUFBLFFBQVE7QUFDcEUsY0FBTSxZQUFZLFdBQVcsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUM3QyxZQUFJLE1BQU0sU0FBUyxLQUFLLGFBQWEsRUFBRztBQUN4QyxZQUFJLGFBQWEsV0FBVyx3QkFBd0IsU0FBUyxRQUFRLE1BQU0sS0FBSyxJQUFJLE9BQU8sWUFBWSxHQUFHO0FBQzFHLGNBQU0sVUFBVSxLQUFLLGNBQWMsYUFBYTtBQUNoRCxZQUFJLFFBQVMsU0FBUSxjQUFjLFFBQVEsVUFBVSxRQUFRLENBQUMsRUFBRSxRQUFRLEtBQUssR0FBRztBQUNoRixpQkFBUyxJQUFJLFVBQVUsU0FBUztBQUFBLE1BQ2xDLENBQUM7QUFDRCxrQkFBWSxpQkFBaUIsUUFBUTtBQUFBLElBQ3ZDLFNBQVE7QUFBQSxJQUFtQjtBQUFBLEVBQzdCLEdBQUc7QUFHSCxXQUFTLGlCQUFpQixXQUFXLENBQUMsTUFBcUI7QUFDekQsUUFBSSxFQUFFLFFBQVEsVUFBVTtBQUN0QixtQkFBYTtBQUNiLGtCQUFZO0FBQ1osc0JBQWdCO0FBQ2hCLGtCQUFZO0FBQUEsSUFDZDtBQUFBLEVBQ0YsQ0FBQztBQXVERCxTQUFPLE9BQU8sUUFBUTtBQUFBLElBQ3BCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsibG9nIiwgImxvZyIsICJsb2ciLCAibG9nIiwgImxvZyIsICJfYSJdCn0K
