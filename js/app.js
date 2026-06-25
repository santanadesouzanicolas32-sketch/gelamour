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
  var SUPABASE_ANON = atob("ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5KbVluUmtkSFp6Ym1aMGVXSmhlbVp0WkdKM0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT0RFNU1UQXpOakFzSW1WNGNDSTZNakE1TnpRNE5qTTJNSDAuSHc2OGpRRkZtd0xndndGOXpqaGdWV1BjM0QxUTJwZmdBbjFUUWxKRVZ1NA==");
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
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new NetworkError(`GET ${table} falhou (${resp.status})`, { status: resp.status, body });
    }
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
  var _pixPollTimeoutTimer = null;
  var _pixCancelled = false;
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
    _pixCancelled = false;
    try {
      const resp = await fetch(EDGE_URL + "/criar-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON },
        body: JSON.stringify({ pedido_id: pedidoId, total, nome, billing_type: "PIX" })
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      if (_pixCancelled) return;
      _pixPayload = data.qr_code || "";
      if (pixCodeBox) pixCodeBox.textContent = _pixPayload || "C\xF3digo indispon\xEDvel";
      if (data.qr_code_image && pixQrImg) pixQrImg.src = "data:image/png;base64," + data.qr_code_image;
      if (pixStatus) {
        pixStatus.textContent = "\u23F3 Aguardando pagamento...";
        pixStatus.className = "pix-status pix-aguardando";
      }
      if (pixJaPagueiBtn) {
        pixJaPagueiBtn.style.display = "none";
        setTimeout(() => {
          if (!_pixCancelled && pixJaPagueiBtn) pixJaPagueiBtn.style.display = "block";
        }, 2e4);
      }
      _pixPollTimer = setInterval(verificarPagamentoPix, 4e3);
      _pixPollTimeoutTimer = setTimeout(() => {
        if (_pixPollTimer) {
          clearInterval(_pixPollTimer);
          _pixPollTimer = null;
        }
        _pixPollTimeoutTimer = null;
        if (pixStatus) {
          pixStatus.textContent = "\u23F0 Tempo esgotado. Gere um novo Pix se precisar.";
          pixStatus.className = "pix-status";
        }
        if (pixJaPagueiBtn) pixJaPagueiBtn.style.display = "block";
      }, 30 * 60 * 1e3);
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
    if (!_pixPedidoId || _pixCancelled) return;
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
  }
  function fecharReciboPix() {
    var _a;
    const msgWA = _pixMsgWA;
    _pixCancelled = true;
    if (_pixPollTimer) {
      clearInterval(_pixPollTimer);
      _pixPollTimer = null;
    }
    if (_pixPollTimeoutTimer) {
      clearTimeout(_pixPollTimeoutTimer);
      _pixPollTimeoutTimer = null;
    }
    (_a = document.getElementById("pixBackdrop")) == null ? void 0 : _a.classList.remove("aberto");
    limparCarrinho();
    _pixPedidoId = null;
    _pixPayload = "";
    _pixMsgWA = "";
    _pixTotal = 0;
    _pixNome = "";
    _pixItens = [];
    _pixEndereco = "";
    if (msgWA) window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msgWA), "_blank");
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
    _pixCancelled = true;
    if (_pixPollTimer) {
      clearInterval(_pixPollTimer);
      _pixPollTimer = null;
    }
    if (_pixPollTimeoutTimer) {
      clearTimeout(_pixPollTimeoutTimer);
      _pixPollTimeoutTimer = null;
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
        const msg = result.error.name === "NetworkError" ? "Sem conex\xE3o. Verifique sua internet e tente novamente." : result.error.message;
        log6.error("verificarTelefone falhou", { error: result.error.message });
        if (erro) {
          erro.textContent = msg;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3V0aWxzL3RvYXN0LnRzIiwgIi4uL3NyYy91dGlscy9zZWN1cml0eS50cyIsICIuLi9zcmMvdXRpbHMvZm9ybWF0LnRzIiwgIi4uL3NyYy9jb3JlL2Vycm9ycy50cyIsICIuLi9zcmMvZG9tYWluL2NsaWVudGUudHMiLCAiLi4vc3JjL2NvcmUvcmVzdWx0LnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQudHMiLCAiLi4vc3JjL2NvcmUvbG9nZ2VyLnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9DbGllbnRlUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvZG9tYWluL3BlZGlkby50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUGVkaWRvUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUm9sZXRhUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvY29yZS9ldmVudHMudHMiLCAiLi4vc3JjL3N0YXRlL1N0b3JlLnRzIiwgIi4uL3NyYy9zdGF0ZS9BcHBTdG9yZS50cyIsICIuLi9zcmMvYXBwbGljYXRpb24vYXV0aC9Mb2dpblVzZUNhc2UudHMiLCAiLi4vc3JjL2FwcGxpY2F0aW9uL2NhcnQvQ2FydFNlcnZpY2UudHMiLCAiLi4vc3JjL2NvbnRhaW5lci50cyIsICIuLi9zcmMvbW9kdWxlcy9yb2xldGEudHMiLCAiLi4vc3JjL21vZHVsZXMvY2FydC50cyIsICIuLi9zcmMvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUb2FzdFRpcG8gfSBmcm9tICcuLi90eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBtb3N0cmFyVG9hc3QobXNnOiBzdHJpbmcsIHRpcG86IFRvYXN0VGlwbyA9ICdpbmZvJyk6IHZvaWQge1xuICBjb25zdCBvbGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnX3RvYXN0Jyk7XG4gIGlmIChvbGQpIG9sZC5yZW1vdmUoKTtcbiAgY29uc3QgdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0LmlkID0gJ190b2FzdCc7XG4gIHQudGV4dENvbnRlbnQgPSBtc2c7XG4gIGNvbnN0IGJnID0gdGlwbyA9PT0gJ2Vycm8nID8gJyNlZjQ0NDQnIDogdGlwbyA9PT0gJ29rJyA/ICcjMjJjNTVlJyA6ICcjNEEyQzE3JztcbiAgT2JqZWN0LmFzc2lnbih0LnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdmaXhlZCcsIGJvdHRvbTogJzkwcHgnLCBsZWZ0OiAnNTAlJyxcbiAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKC01MCUpJyxcbiAgICBiYWNrZ3JvdW5kOiBiZywgY29sb3I6ICcjZmZmJywgcGFkZGluZzogJzEycHggMjJweCcsXG4gICAgYm9yZGVyUmFkaXVzOiAnMzBweCcsIGZvbnRTaXplOiAnMTRweCcsIGZvbnRXZWlnaHQ6ICc2MDAnLFxuICAgIHpJbmRleDogJzk5OTk5JywgYm94U2hhZG93OiAnMCA2cHggMjRweCByZ2JhKDAsMCwwLDAuMyknLFxuICAgIG1heFdpZHRoOiAnOTB2dycsIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgdHJhbnNpdGlvbjogJ29wYWNpdHkgLjNzJywgb3BhY2l0eTogJzEnLFxuICAgIGZvbnRGYW1pbHk6IFwiJ0RNIFNhbnMnLCBzYW5zLXNlcmlmXCIsXG4gIH0gYXMgUGFydGlhbDxDU1NTdHlsZURlY2xhcmF0aW9uPik7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodCk7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHQuc3R5bGUub3BhY2l0eSA9ICcwJztcbiAgICBzZXRUaW1lb3V0KCgpID0+IHQucmVtb3ZlKCksIDM1MCk7XG4gIH0sIDM1MDApO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBlc2NIVE1MKHM6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gU3RyaW5nKHMpXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6YXJUZWxlZm9uZSh0ZWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZWwucmVwbGFjZSgvXFxEL2csICcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6YXJOb21lKG5vbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBub21lXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAuc3BsaXQoJyAnKVxuICAgIC5tYXAocCA9PiBwLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcC5zbGljZSgxKSlcbiAgICAuam9pbignICcpXG4gICAgLnRyaW0oKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gZm9ybWF0YXJNb2VkYSh2YWxvcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuICdSJCAnICsgdmFsb3IudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbWFuYUF0dWFsKCk6IHN0cmluZyB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IHN0YXJ0T2ZZZWFyID0gbmV3IERhdGUobm93LmdldEZ1bGxZZWFyKCksIDAsIDEpO1xuICBjb25zdCBkYXlPZlllYXIgPSBNYXRoLmZsb29yKChub3cuZ2V0VGltZSgpIC0gc3RhcnRPZlllYXIuZ2V0VGltZSgpKSAvIDg2NDAwMDAwKTtcbiAgY29uc3Qgd2Vla051bSA9IE1hdGguY2VpbCgoZGF5T2ZZZWFyICsgc3RhcnRPZlllYXIuZ2V0RGF5KCkgKyAxKSAvIDcpO1xuICByZXR1cm4gYCR7bm93LmdldEZ1bGxZZWFyKCl9LVcke1N0cmluZyh3ZWVrTnVtKS5wYWRTdGFydCgyLCAnMCcpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcGxpY2FyTWFzY2FyYVRlbGVmb25lKHZhbG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBkID0gdmFsb3IucmVwbGFjZSgvXFxEL2csICcnKS5zbGljZSgwLCAxMSk7XG4gIGlmIChkLmxlbmd0aCA8PSAyKSByZXR1cm4gZDtcbiAgaWYgKGQubGVuZ3RoIDw9IDcpIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyKX1gO1xuICBpZiAoZC5sZW5ndGggPD0gMTEpIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyLCA3KX0tJHtkLnNsaWNlKDcpfWA7XG4gIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyLCA3KX0tJHtkLnNsaWNlKDcsIDExKX1gO1xufVxuIiwgImV4cG9ydCBjbGFzcyBBcHBFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIHB1YmxpYyByZWFkb25seSBjb2RlOiBzdHJpbmcsXG4gICAgcHVibGljIHJlYWRvbmx5IHN0YXR1c0NvZGU6IG51bWJlciA9IDUwMCxcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdBcHBFcnJvcic7XG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIEFwcEVycm9yLnByb3RvdHlwZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBzdXBlcihtZXNzYWdlLCAnVkFMSURBVElPTl9FUlJPUicsIDQwMCwgY29udGV4dCk7XG4gICAgdGhpcy5uYW1lID0gJ1ZhbGlkYXRpb25FcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5ldHdvcmtFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBzdXBlcihtZXNzYWdlLCAnTkVUV09SS19FUlJPUicsIDUwMywgY29udGV4dCk7XG4gICAgdGhpcy5uYW1lID0gJ05ldHdvcmtFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEF1dGhFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSwgJ0FVVEhfRVJST1InLCA0MDEpO1xuICAgIHRoaXMubmFtZSA9ICdBdXRoRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb3RGb3VuZEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXNvdXJjZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYCR7cmVzb3VyY2V9IG5cdTAwRTNvIGVuY29udHJhZG9gLCAnTk9UX0ZPVU5EJywgNDA0KTtcbiAgICB0aGlzLm5hbWUgPSAnTm90Rm91bmRFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJhdGVMaW1pdEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXRyeUFmdGVyTXM6IG51bWJlcikge1xuICAgIHN1cGVyKGBNdWl0YXMgdGVudGF0aXZhcy4gQWd1YXJkZSAke01hdGguY2VpbChyZXRyeUFmdGVyTXMgLyAxMDAwKX1zLmAsICdSQVRFX0xJTUlUJywgNDI5LCB7IHJldHJ5QWZ0ZXJNcyB9KTtcbiAgICB0aGlzLm5hbWUgPSAnUmF0ZUxpbWl0RXJyb3InO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vY29yZS9lcnJvcnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENsaWVudGVQcm9wcyB7XG4gIGlkPzogbnVtYmVyO1xuICBub21lOiBzdHJpbmc7XG4gIHRlbGVmb25lOiBzdHJpbmc7XG4gIGVuZGVyZWNvPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ2xpZW50ZSB7XG4gIHJlYWRvbmx5IGlkPzogbnVtYmVyO1xuICByZWFkb25seSBub21lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHRlbGVmb25lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGVuZGVyZWNvPzogc3RyaW5nO1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJvcHM6IENsaWVudGVQcm9wcykge1xuICAgIHRoaXMuaWQgPSBwcm9wcy5pZDtcbiAgICB0aGlzLm5vbWUgPSBwcm9wcy5ub21lO1xuICAgIHRoaXMudGVsZWZvbmUgPSBwcm9wcy50ZWxlZm9uZTtcbiAgICB0aGlzLmVuZGVyZWNvID0gcHJvcHMuZW5kZXJlY287XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlKHByb3BzOiBDbGllbnRlUHJvcHMpOiBDbGllbnRlIHtcbiAgICBjb25zdCB0ZWwgPSBwcm9wcy50ZWxlZm9uZS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgIGlmICh0ZWwubGVuZ3RoIDwgMTAgfHwgdGVsLmxlbmd0aCA+IDExKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdUZWxlZm9uZSBpbnZcdTAwRTFsaWRvJywgeyB0ZWxlZm9uZTogcHJvcHMudGVsZWZvbmUgfSk7XG4gICAgfVxuICAgIGlmICghcHJvcHMubm9tZS50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ05vbWUgblx1MDBFM28gcG9kZSBzZXIgdmF6aW8nKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDbGllbnRlKHtcbiAgICAgIC4uLnByb3BzLFxuICAgICAgdGVsZWZvbmU6IHRlbCxcbiAgICAgIG5vbWU6IENsaWVudGUubm9ybWFsaXphck5vbWUocHJvcHMubm9tZSksXG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbURCKHJhdzogQ2xpZW50ZVByb3BzKTogQ2xpZW50ZSB7XG4gICAgcmV0dXJuIG5ldyBDbGllbnRlKHJhdyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBub3JtYWxpemFyTm9tZShub21lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBub21lLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKVxuICAgICAgLm1hcChwID0+IHAuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwLnNsaWNlKDEpKVxuICAgICAgLmpvaW4oJyAnKS50cmltKCk7XG4gIH1cblxuICB3aXRoRW5kZXJlY28oZW5kZXJlY286IHN0cmluZyk6IENsaWVudGUge1xuICAgIHJldHVybiBDbGllbnRlLmZyb21EQih7IC4uLnRoaXMudG9KU09OKCksIGVuZGVyZWNvIH0pO1xuICB9XG5cbiAgdG9KU09OKCk6IENsaWVudGVQcm9wcyB7XG4gICAgcmV0dXJuIHsgaWQ6IHRoaXMuaWQsIG5vbWU6IHRoaXMubm9tZSwgdGVsZWZvbmU6IHRoaXMudGVsZWZvbmUsIGVuZGVyZWNvOiB0aGlzLmVuZGVyZWNvIH07XG4gIH1cbn1cbiIsICJleHBvcnQgdHlwZSBSZXN1bHQ8VCwgRSBleHRlbmRzIEVycm9yID0gRXJyb3I+ID1cbiAgfCB7IHJlYWRvbmx5IG9rOiB0cnVlOyByZWFkb25seSB2YWx1ZTogVCB9XG4gIHwgeyByZWFkb25seSBvazogZmFsc2U7IHJlYWRvbmx5IGVycm9yOiBFIH07XG5cbmV4cG9ydCBjb25zdCBvayA9IDxUPih2YWx1ZTogVCk6IFJlc3VsdDxULCBuZXZlcj4gPT4gKHsgb2s6IHRydWUsIHZhbHVlIH0pO1xuZXhwb3J0IGNvbnN0IGZhaWwgPSA8RSBleHRlbmRzIEVycm9yPihlcnJvcjogRSk6IFJlc3VsdDxuZXZlciwgRT4gPT4gKHsgb2s6IGZhbHNlLCBlcnJvciB9KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzT2s8VCwgRSBleHRlbmRzIEVycm9yPihyOiBSZXN1bHQ8VCwgRT4pOiByIGlzIHsgb2s6IHRydWU7IHZhbHVlOiBUIH0ge1xuICByZXR1cm4gci5vaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcDxUPihyOiBSZXN1bHQ8VD4sIGZhbGxiYWNrPzogVCk6IFQge1xuICBpZiAoci5vaykgcmV0dXJuIHIudmFsdWU7XG4gIGlmIChmYWxsYmFjayAhPT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsbGJhY2s7XG4gIHRocm93IHIuZXJyb3I7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0cnlBc3luYzxUPihmbjogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8UmVzdWx0PFQ+PiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG9rKGF3YWl0IGZuKCkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhaWwoZSBpbnN0YW5jZW9mIEVycm9yID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IE5ldHdvcmtFcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcblxuY29uc3QgU1VQQUJBU0VfVVJMID0gYXRvYignYUhSMGNITTZMeTl5Wm1KMFpIUjJjMjVtZEhsaVlYcG1iV1JpZHk1emRYQmhZbUZ6WlM1amJ3PT0nKTtcbmNvbnN0IFNVUEFCQVNFX0FOT04gPSBhdG9iKCdaWGxLYUdKSFkybFBhVXBKVlhwSk1VNXBTWE5KYmxJMVkwTkpOa2xyY0ZoV1EwbzVMbVY1U25Cak0wMXBUMmxLZW1SWVFtaFpiVVo2V2xOSmMwbHVTbXhhYVVrMlNXNUtiVmx1VW10a1NGcDZZbTFhTUdWWFNtaGxiVnAwV2tkS00wbHBkMmxqYlRseldsTkpOa2x0Um5WaU1qUnBURU5LY0ZsWVVXbFBha1V6VDBSRk5VMVVRWHBPYWtGelNXMVdOR05EU1RaTmFrRTFUbnBSTkU1cVRUSk5TREF1U0hjMk9HcFJSa1p0ZDB4bmRuZEdPWHBxYUdkV1YxQmpNMFF4VVRKd1ptZEJiakZVVVd4S1JWWjFOQT09Jyk7XG5jb25zdCBUSU1FT1VUX01TID0gMTBfMDAwO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1cGFiYXNlRmV0Y2hPcHRpb25zIGV4dGVuZHMgUmVxdWVzdEluaXQge1xuICB0aW1lb3V0PzogbnVtYmVyO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VGZXRjaChcbiAgcGF0aDogc3RyaW5nLFxuICBvcHRzOiBTdXBhYmFzZUZldGNoT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IHsgdGltZW91dCA9IFRJTUVPVVRfTVMsIC4uLmZldGNoT3B0cyB9ID0gb3B0cztcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgdGltZW91dCk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtTVVBBQkFTRV9BTk9OfWAsXG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgJ1ByZWZlcic6ICdyZXR1cm49cmVwcmVzZW50YXRpb24nLFxuICAgICAgLi4uKChmZXRjaE9wdHMuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSA/PyB7fSksXG4gICAgfTtcblxuICAgIHJldHVybiBhd2FpdCBmZXRjaChgJHtTVVBBQkFTRV9VUkx9JHtwYXRofWAsIHtcbiAgICAgIC4uLmZldGNoT3B0cyxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvciAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykge1xuICAgICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcignVGltZW91dDogc2Vydmlkb3Igblx1MDBFM28gcmVzcG9uZGV1JywgeyBwYXRoIH0pO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdFcnJvIGRlIHJlZGUnLCB7IHBhdGgsIGNhdXNlOiBTdHJpbmcoZSkgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VHZXQ8VD4oXG4gIHRhYmxlOiBzdHJpbmcsXG4gIHF1ZXJ5ID0gJydcbik6IFByb21pc2U8VFtdPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvcmVzdC92MS8ke3RhYmxlfSR7cXVlcnkgPyAnPycgKyBxdWVyeSA6ICcnfWApO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCkuY2F0Y2goKCkgPT4gJycpO1xuICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYEdFVCAke3RhYmxlfSBmYWxob3UgKCR7cmVzcC5zdGF0dXN9KWAsIHsgc3RhdHVzOiByZXNwLnN0YXR1cywgYm9keSB9KTtcbiAgfVxuICByZXR1cm4gcmVzcC5qc29uKCkgYXMgUHJvbWlzZTxUW10+O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VQb3N0PFQ+KFxuICB0YWJsZTogc3RyaW5nLFxuICBkYXRhOiBQYXJ0aWFsPFQ+XG4pOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IHN1cGFiYXNlRmV0Y2goYC9yZXN0L3YxLyR7dGFibGV9YCwge1xuICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICB9KTtcbiAgaWYgKCFyZXNwLm9rKSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3AudGV4dCgpO1xuICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYFBPU1QgJHt0YWJsZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xuICB9XG4gIGNvbnN0IHJvd3MgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBUW107XG4gIHJldHVybiByb3dzWzBdITtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN1cGFiYXNlUGF0Y2g8VD4oXG4gIHRhYmxlOiBzdHJpbmcsXG4gIHF1ZXJ5OiBzdHJpbmcsXG4gIGRhdGE6IFBhcnRpYWw8VD5cbik6IFByb21pc2U8VFtdPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvcmVzdC92MS8ke3RhYmxlfT8ke3F1ZXJ5fWAsIHtcbiAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gIH0pO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgUEFUQ0ggJHt0YWJsZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xuICB9XG4gIHJldHVybiByZXNwLmpzb24oKSBhcyBQcm9taXNlPFRbXT47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsRnVuY3Rpb248VD4obmFtZTogc3RyaW5nLCBib2R5OiB1bmtub3duKTogUHJvbWlzZTxUPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvZnVuY3Rpb25zL3YxLyR7bmFtZX1gLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gIH0pO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBlcnIgPSBhd2FpdCByZXNwLnRleHQoKTtcbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKGBFZGdlIEZ1bmN0aW9uICR7bmFtZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5OiBlcnIgfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3AuanNvbigpIGFzIFByb21pc2U8VD47XG59XG5cbmV4cG9ydCB7IFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfQU5PTiB9O1xuIiwgInR5cGUgTG9nTGV2ZWwgPSAnZGVidWcnIHwgJ2luZm8nIHwgJ3dhcm4nIHwgJ2Vycm9yJztcblxuaW50ZXJmYWNlIExvZ0VudHJ5IHtcbiAgbGV2ZWw6IExvZ0xldmVsO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xuICBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59XG5cbmNsYXNzIExvZ2dlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcHJlZml4OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHJlZml4ID0gJ0dlbGFtb3VyJykge1xuICAgIHRoaXMucHJlZml4ID0gcHJlZml4O1xuICB9XG5cbiAgcHJpdmF0ZSBsb2cobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xuICAgIGNvbnN0IGVudHJ5OiBMb2dFbnRyeSA9IHtcbiAgICAgIGxldmVsLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgY29udGV4dCxcbiAgICB9O1xuXG4gICAgY29uc3Qgc3R5bGUgPSB7XG4gICAgICBkZWJ1ZzogJ2NvbG9yOiAjNkI3MjgwJyxcbiAgICAgIGluZm86ICAnY29sb3I6ICMzQjgyRjYnLFxuICAgICAgd2FybjogICdjb2xvcjogI0Y1OUUwQicsXG4gICAgICBlcnJvcjogJ2NvbG9yOiAjRUY0NDQ0OyBmb250LXdlaWdodDogYm9sZCcsXG4gICAgfVtsZXZlbF07XG5cbiAgICBjb25zdCBmb3JtYXR0ZWQgPSBgWyR7dGhpcy5wcmVmaXh9XSAke2VudHJ5LnRpbWVzdGFtcH0gJHttZXNzYWdlfWA7XG5cbiAgICBpZiAobGV2ZWwgPT09ICdlcnJvcicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH0gZWxzZSBpZiAobGV2ZWwgPT09ICd3YXJuJykge1xuICAgICAgY29uc29sZS53YXJuKGAlYyR7Zm9ybWF0dGVkfWAsIHN0eWxlLCBjb250ZXh0ID8/ICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH1cbiAgfVxuXG4gIGRlYnVnKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgeyB0aGlzLmxvZygnZGVidWcnLCBtc2csIGN0eCk7IH1cbiAgaW5mbyhtc2c6IHN0cmluZywgY3R4PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkICB7IHRoaXMubG9nKCdpbmZvJywgIG1zZywgY3R4KTsgfVxuICB3YXJuKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgIHsgdGhpcy5sb2coJ3dhcm4nLCAgbXNnLCBjdHgpOyB9XG4gIGVycm9yKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgeyB0aGlzLmxvZygnZXJyb3InLCBtc2csIGN0eCk7IH1cblxuICBjaGlsZChwcmVmaXg6IHN0cmluZyk6IExvZ2dlciB7IHJldHVybiBuZXcgTG9nZ2VyKGAke3RoaXMucHJlZml4fToke3ByZWZpeH1gKTsgfVxufVxuXG5leHBvcnQgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuIiwgImltcG9ydCB0eXBlIHsgSUNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lDbGllbnRlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBDbGllbnRlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2NsaWVudGUnO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VHZXQsIHN1cGFiYXNlUG9zdCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdDbGllbnRlUmVwbycpO1xuXG5leHBvcnQgY2xhc3MgQ2xpZW50ZVJlcG9zaXRvcnkgaW1wbGVtZW50cyBJQ2xpZW50ZVJlcG9zaXRvcnkge1xuICBhc3luYyBmaW5kQnlUZWxlZm9uZSh0ZWxlZm9uZTogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZSB8IG51bGw+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZygnZmluZEJ5VGVsZWZvbmUnLCB7IHRlbGVmb25lOiBgKioqJHt0ZWxlZm9uZS5zbGljZSgtNCl9YCB9KTtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDxSZXR1cm5UeXBlPENsaWVudGVbJ3RvSlNPTiddPj4oXG4gICAgICAgICdjbGllbnRlcycsXG4gICAgICAgIGB0ZWxlZm9uZT1lcS4ke3RlbGVmb25lfSZsaW1pdD0xYFxuICAgICAgKTtcbiAgICAgIHJldHVybiByb3dzWzBdID8gQ2xpZW50ZS5mcm9tREIocm93c1swXSkgOiBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2F2ZShjbGllbnRlOiBDbGllbnRlKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZT4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gYXdhaXQgc3VwYWJhc2VQb3N0PFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+PihcbiAgICAgICAgJ2NsaWVudGVzJyxcbiAgICAgICAgY2xpZW50ZS50b0pTT04oKVxuICAgICAgKTtcbiAgICAgIHJldHVybiBDbGllbnRlLmZyb21EQihyb3cpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlRW5kZXJlY28oaWQ6IG51bWJlciwgZW5kZXJlY286IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlUGF0Y2goJ2NsaWVudGVzJywgYGlkPWVxLiR7aWR9YCwgeyBlbmRlcmVjbyB9KTtcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uL2NvcmUvZXJyb3JzJztcblxuZXhwb3J0IGludGVyZmFjZSBJdGVtUGVkaWRvIHtcbiAgcmVhZG9ubHkgbm9tZTogc3RyaW5nO1xuICByZWFkb25seSBwcmVjbzogbnVtYmVyO1xufVxuXG5leHBvcnQgdHlwZSBTdGF0dXNQZWRpZG8gPSAncGVuZGVudGUnIHwgJ2NvbmZpcm1hZG8nIHwgJ2NhbmNlbGFkbyc7XG5leHBvcnQgdHlwZSBTdGF0dXNQYWdhbWVudG8gPSAnYWd1YXJkYW5kbycgfCAncGFnbycgfCAnZmFsaG91JztcbmV4cG9ydCB0eXBlIFRpcG9QYWdhbWVudG8gPSAnUGl4JyB8ICdEaW5oZWlybycgfCAnQ2FydFx1MDBFM28nO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBlZGlkb1Byb3BzIHtcbiAgaWQ/OiBudW1iZXI7XG4gIG5vbWU6IHN0cmluZztcbiAgdGVsZWZvbmU6IHN0cmluZztcbiAgZW5kZXJlY286IHN0cmluZztcbiAgcGFnYW1lbnRvOiBUaXBvUGFnYW1lbnRvO1xuICBpdGVuczogSXRlbVBlZGlkb1tdO1xuICB0b3RhbDogbnVtYmVyO1xuICBzdGF0dXM6IFN0YXR1c1BlZGlkbztcbiAgc3RhdHVzX3BhZ2FtZW50bz86IFN0YXR1c1BhZ2FtZW50bztcbiAgb2JzZXJ2YWNhbz86IHN0cmluZztcbiAgYXNhYXNfcGF5bWVudF9pZD86IHN0cmluZztcbiAgY2xpZW50ZV9pZD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFBlZGlkbyB7XG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBwcm9wczogUGVkaWRvUHJvcHMpIHt9XG5cbiAgc3RhdGljIGNyZWF0ZShwcm9wczogT21pdDxQZWRpZG9Qcm9wcywgJ3N0YXR1cycgfCAndG90YWwnPik6IFBlZGlkbyB7XG4gICAgaWYgKCFwcm9wcy5pdGVucy5sZW5ndGgpIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1BlZGlkbyBkZXZlIHRlciBhbyBtZW5vcyAxIGl0ZW0nKTtcbiAgICBpZiAoIXByb3BzLm5vbWUudHJpbSgpKSB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdOb21lIG9icmlnYXRcdTAwRjNyaW8nKTtcbiAgICBpZiAoIXByb3BzLmVuZGVyZWNvLnRyaW0oKSkgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignRW5kZXJlXHUwMEU3byBvYnJpZ2F0XHUwMEYzcmlvJyk7XG4gICAgY29uc3QgdG90YWwgPSBwcm9wcy5pdGVucy5yZWR1Y2UoKHMsIGkpID0+IE1hdGgucm91bmQoKHMgKyBpLnByZWNvKSAqIDEwMCkgLyAxMDAsIDApO1xuICAgIHJldHVybiBuZXcgUGVkaWRvKHsgLi4ucHJvcHMsIHRvdGFsLCBzdGF0dXM6ICdwZW5kZW50ZScgfSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbURCKHJhdzogUGVkaWRvUHJvcHMpOiBQZWRpZG8geyByZXR1cm4gbmV3IFBlZGlkbyhyYXcpOyB9XG5cbiAgZ2V0IGlkKCk6IG51bWJlciB8IHVuZGVmaW5lZCB7IHJldHVybiB0aGlzLnByb3BzLmlkOyB9XG4gIGdldCB0b3RhbCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5wcm9wcy50b3RhbDsgfVxuICBnZXQgaXRlbnMoKTogcmVhZG9ubHkgSXRlbVBlZGlkb1tdIHsgcmV0dXJuIHRoaXMucHJvcHMuaXRlbnM7IH1cbiAgZ2V0IHBhZ2FtZW50bygpOiBUaXBvUGFnYW1lbnRvIHsgcmV0dXJuIHRoaXMucHJvcHMucGFnYW1lbnRvOyB9XG4gIGdldCBzdGF0dXNQYWdhbWVudG8oKTogU3RhdHVzUGFnYW1lbnRvIHwgdW5kZWZpbmVkIHsgcmV0dXJuIHRoaXMucHJvcHMuc3RhdHVzX3BhZ2FtZW50bzsgfVxuXG4gIGZvcm1hdGFyTWVuc2FnZW1XQSh3YU51bWJlcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBpdGVuc1N0ciA9IHRoaXMucHJvcHMuaXRlbnMubWFwKGkgPT5cbiAgICAgIGBcdTI1QjggJHtpLm5vbWV9IFx1MjAxNCBSJCAke2kucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX1gXG4gICAgKS5qb2luKCdcXG4nKTtcbiAgICBjb25zdCBtc2cgPSBbXG4gICAgICAnXHVEODNEXHVERUNEXHVGRTBGICpOT1ZPIFBFRElETyBcdTIwMTQgR0VMQU1PVVIqJyxcbiAgICAgICcnLFxuICAgICAgaXRlbnNTdHIsXG4gICAgICAnJyxcbiAgICAgIGAqVG90YWw6IFIkICR7dGhpcy5wcm9wcy50b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfSpgLFxuICAgICAgYCpQYWdhbWVudG86ICR7dGhpcy5wcm9wcy5wYWdhbWVudG99KmAsXG4gICAgICAnJyxcbiAgICAgIGBcdUQ4M0RcdURDNjQgJHt0aGlzLnByb3BzLm5vbWV9YCxcbiAgICAgIGBcdUQ4M0RcdURDQ0QgJHt0aGlzLnByb3BzLmVuZGVyZWNvfWAsXG4gICAgICB0aGlzLnByb3BzLm9ic2VydmFjYW8gPyBgXHVEODNEXHVEQ0REICR7dGhpcy5wcm9wcy5vYnNlcnZhY2FvfWAgOiAnJyxcbiAgICBdLmZpbHRlcihCb29sZWFuKS5qb2luKCdcXG4nKTtcbiAgICByZXR1cm4gYGh0dHBzOi8vd2EubWUvJHt3YU51bWJlcn0/dGV4dD0ke2VuY29kZVVSSUNvbXBvbmVudChtc2cpfWA7XG4gIH1cblxuICB0b0pTT04oKTogUGVkaWRvUHJvcHMgeyByZXR1cm4geyAuLi50aGlzLnByb3BzIH07IH1cbn1cbiIsICJpbXBvcnQgdHlwZSB7IElQZWRpZG9SZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lQZWRpZG9SZXBvc2l0b3J5JztcbmltcG9ydCB7IFBlZGlkbyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuaW1wb3J0IHR5cGUgeyBQZWRpZG9Qcm9wcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VGZXRjaCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfQU5PTiB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IE5ldHdvcmtFcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdQZWRpZG9SZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBQZWRpZG9SZXBvc2l0b3J5IGltcGxlbWVudHMgSVBlZGlkb1JlcG9zaXRvcnkge1xuICBhc3luYyBzYXZlKHBlZGlkbzogUGVkaWRvKTogUHJvbWlzZTxSZXN1bHQ8UGVkaWRvPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBsb2cuaW5mbygnU2FsdmFuZG8gcGVkaWRvJywgeyB0b3RhbDogcGVkaWRvLnRvdGFsIH0pO1xuICAgICAgLy8gVXNhIGhlYWRlcnMtb25seSBwYXJhIG9idGVyIG8gSUQgdmlhIExvY2F0aW9uXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgc3VwYWJhc2VGZXRjaChgL3Jlc3QvdjEvcGVkaWRvc2AsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ1ByZWZlcic6ICdyZXR1cm49aGVhZGVycy1vbmx5JyB9IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBlZGlkby50b0pTT04oKSksXG4gICAgICB9KTtcbiAgICAgIGlmICghcmVzcC5vaykge1xuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYFBPU1QgcGVkaWRvcyBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHkgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBsb2MgPSByZXNwLmhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpID8/ICcnO1xuICAgICAgY29uc3QgaWRNYXRjaCA9IGxvYy5tYXRjaCgvaWQ9ZXFcXC4oXFxkKykvKTtcbiAgICAgIGlmICghaWRNYXRjaCkgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcignSUQgZG8gcGVkaWRvIG5cdTAwRTNvIHJldG9ybmFkbycpO1xuICAgICAgY29uc3QgaWQgPSBwYXJzZUludChpZE1hdGNoWzFdISwgMTApO1xuICAgICAgcmV0dXJuIFBlZGlkby5mcm9tREIoeyAuLi5wZWRpZG8udG9KU09OKCksIGlkIH0gYXMgUGVkaWRvUHJvcHMpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlU3RhdHVzKGlkOiBudW1iZXIsIGNsaWVudGVJZDogbnVtYmVyLCBzdGF0dXM6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlUGF0Y2goXG4gICAgICAgICdwZWRpZG9zJyxcbiAgICAgICAgYGlkPWVxLiR7aWR9JmNsaWVudGVfaWQ9ZXEuJHtjbGllbnRlSWR9YCxcbiAgICAgICAgeyBzdGF0dXMgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRCeUlkKGlkOiBudW1iZXIpOiBQcm9taXNlPFJlc3VsdDxQZWRpZG8gfCBudWxsPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goXG4gICAgICAgIGAke1NVUEFCQVNFX1VSTH0vcmVzdC92MS9wZWRpZG9zP2lkPWVxLiR7aWR9JnNlbGVjdD1zdGF0dXNfcGFnYW1lbnRvYCxcbiAgICAgICAgeyBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtTVVBBQkFTRV9BTk9OfWAgfSB9XG4gICAgICApO1xuICAgICAgaWYgKCFyZXNwLm9rKSB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdHRVQgcGVkaWRvIGZhbGhvdScsIHsgc3RhdHVzOiByZXNwLnN0YXR1cyB9KTtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBQZWRpZG9Qcm9wc1tdO1xuICAgICAgcmV0dXJuIHJvd3NbMF0gPyBQZWRpZG8uZnJvbURCKHJvd3NbMF0pIDogbnVsbDtcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB0eXBlIHsgSVJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9yZXBvc2l0b3JpZXMvSVJvbGV0YVJlcG9zaXRvcnknO1xuaW1wb3J0IHR5cGUgeyBQYXJ0aWNpcGFjYW9Qcm9wcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9yb2xldGEnO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VHZXQsIHN1cGFiYXNlUG9zdCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdSb2xldGFSZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBSb2xldGFSZXBvc2l0b3J5IGltcGxlbWVudHMgSVJvbGV0YVJlcG9zaXRvcnkge1xuICBhc3luYyBmaW5kUGFydGljaXBhY2FvQXRpdmEoXG4gICAgdGVsZWZvbmU6IHN0cmluZyxcbiAgICBzZW1hbmE6IHN0cmluZ1xuICApOiBQcm9taXNlPFJlc3VsdDxQYXJ0aWNpcGFjYW9Qcm9wcyB8IG51bGw+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZygnZmluZFBhcnRpY2lwYWNhb0F0aXZhJywgeyBzZW1hbmEgfSk7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgc3VwYWJhc2VHZXQ8UGFydGljaXBhY2FvUHJvcHM+KFxuICAgICAgICAncm9sZXRhX3BhcnRpY2lwYWNvZXMnLFxuICAgICAgICBgdGVsZWZvbmU9ZXEuJHt0ZWxlZm9uZX0mc2VtYW5hPWVxLiR7c2VtYW5hfSZvcmRlcj1jcmVhdGVkX2F0LmRlc2MmbGltaXQ9MWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gcm93c1swXSA/PyBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVBhcnRpY2lwYWNhbyhcbiAgICBkYXRhOiBQYXJ0aWFsPFBhcnRpY2lwYWNhb1Byb3BzPlxuICApOiBQcm9taXNlPFJlc3VsdDxQYXJ0aWNpcGFjYW9Qcm9wcz4+IHtcbiAgICAvLyBTZSB0ZW0gaWQsIGZheiBQQVRDSDsgc2VuXHUwMEUzbyBJTlNFUlRcbiAgICBpZiAoZGF0YS5pZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB7IGlkLCAuLi5wYXRjaCB9ID0gZGF0YTtcbiAgICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHN1cGFiYXNlUGF0Y2g8UGFydGljaXBhY2FvUHJvcHM+KFxuICAgICAgICAgICdyb2xldGFfcGFydGljaXBhY29lcycsXG4gICAgICAgICAgYGlkPWVxLiR7aWR9YCxcbiAgICAgICAgICBwYXRjaFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gKHJvd3NbMF0gPz8geyAuLi5kYXRhIH0pIGFzIFBhcnRpY2lwYWNhb1Byb3BzO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0cnlBc3luYygoKSA9PlxuICAgICAgc3VwYWJhc2VQb3N0PFBhcnRpY2lwYWNhb1Byb3BzPigncm9sZXRhX3BhcnRpY2lwYWNvZXMnLCBkYXRhKVxuICAgICk7XG4gIH1cblxuICBhc3luYyBjb3VudFZlbmNlZG9yZXNTZW1hbmEoc2VtYW5hOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDxudW1iZXI+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDx7IGlkOiBudW1iZXIgfT4oXG4gICAgICAgICdyb2xldGFfdmVuY2Vkb3JlcycsXG4gICAgICAgIGBzZW1hbmE9ZXEuJHtzZW1hbmF9JnNlbGVjdD1pZGBcbiAgICAgICk7XG4gICAgICByZXR1cm4gcm93cy5sZW5ndGg7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzYXZlVmVuY2Vkb3IoXG4gICAgdGVsZWZvbmU6IHN0cmluZyxcbiAgICBub21lOiBzdHJpbmcsXG4gICAgcHJlbWlvOiBzdHJpbmcsXG4gICAgc2VtYW5hOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxSZXN1bHQ8dm9pZD4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc3VwYWJhc2VQb3N0KCdyb2xldGFfdmVuY2Vkb3JlcycsIHsgdGVsZWZvbmUsIG5vbWUsIHByZW1pbywgc2VtYW5hIH0pO1xuICAgIH0pO1xuICB9XG59XG4iLCAidHlwZSBIYW5kbGVyPFQ+ID0gKHBheWxvYWQ6IFQpID0+IHZvaWQ7XG5cbmludGVyZmFjZSBFdmVudE1hcCB7XG4gICdhdXRoOmxvZ2luJzogeyBjbGllbnRlOiBpbXBvcnQoJy4uL2RvbWFpbi9jbGllbnRlJykuQ2xpZW50ZSB9O1xuICAnYXV0aDpsb2dvdXQnOiB2b2lkO1xuICAnY2FydDp1cGRhdGVkJzogeyBjb3VudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH07XG4gICdwYXltZW50OnN1Y2Nlc3MnOiB7IHBlZGlkb0lkOiBudW1iZXI7IHZhbG9yOiBudW1iZXIgfTtcbiAgJ3BheW1lbnQ6ZmFpbGVkJzogeyBlcnJvcjogc3RyaW5nIH07XG4gICdyb2xldGE6cHJlbWlvJzogeyBwcmVtaW86IHN0cmluZyB9O1xuICAndWk6dG9hc3QnOiB7IG1lc3NhZ2U6IHN0cmluZzsgdGlwbzogJ29rJyB8ICdlcnJvJyB8ICdpbmZvJyB9O1xufVxuXG5jbGFzcyBUeXBlZEV2ZW50QnVzIHtcbiAgcHJpdmF0ZSBoYW5kbGVycyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8SGFuZGxlcjx1bmtub3duPj4+KCk7XG5cbiAgb248SyBleHRlbmRzIGtleW9mIEV2ZW50TWFwPihcbiAgICBldmVudDogSyxcbiAgICBoYW5kbGVyOiBIYW5kbGVyPEV2ZW50TWFwW0tdPlxuICApOiAoKSA9PiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaGFuZGxlcnMuaGFzKGV2ZW50KSkgdGhpcy5oYW5kbGVycy5zZXQoZXZlbnQsIG5ldyBTZXQoKSk7XG4gICAgdGhpcy5oYW5kbGVycy5nZXQoZXZlbnQpIS5hZGQoaGFuZGxlciBhcyBIYW5kbGVyPHVua25vd24+KTtcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5oYW5kbGVycy5nZXQoZXZlbnQpPy5kZWxldGUoaGFuZGxlciBhcyBIYW5kbGVyPHVua25vd24+KTtcbiAgfVxuXG4gIGVtaXQ8SyBleHRlbmRzIGtleW9mIEV2ZW50TWFwPihldmVudDogSywgcGF5bG9hZDogRXZlbnRNYXBbS10pOiB2b2lkIHtcbiAgICB0aGlzLmhhbmRsZXJzLmdldChldmVudCk/LmZvckVhY2goaCA9PiB7XG4gICAgICB0cnkgeyBoKHBheWxvYWQpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoYEV2ZW50QnVzIGVycm9yIG9uICR7ZXZlbnR9OmAsIGUpOyB9XG4gICAgfSk7XG4gIH1cblxuICBvbmNlPEsgZXh0ZW5kcyBrZXlvZiBFdmVudE1hcD4oXG4gICAgZXZlbnQ6IEssXG4gICAgaGFuZGxlcjogSGFuZGxlcjxFdmVudE1hcFtLXT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgdW5zdWIgPSB0aGlzLm9uKGV2ZW50LCAocGF5bG9hZCkgPT4geyBoYW5kbGVyKHBheWxvYWQpOyB1bnN1YigpOyB9KTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZXZlbnRCdXMgPSBuZXcgVHlwZWRFdmVudEJ1cygpO1xuIiwgInR5cGUgU2VsZWN0b3I8UywgVD4gPSAoc3RhdGU6IFMpID0+IFQ7XG50eXBlIExpc3RlbmVyPFQ+ID0gKHZhbHVlOiBUKSA9PiB2b2lkO1xuXG5leHBvcnQgY2xhc3MgU3RvcmU8UyBleHRlbmRzIG9iamVjdD4ge1xuICBwcml2YXRlIHN0YXRlOiBTO1xuICBwcml2YXRlIGxpc3RlbmVycyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8TGlzdGVuZXI8dW5rbm93bj4+PigpO1xuICBwcml2YXRlIGdsb2JhbExpc3RlbmVycyA9IG5ldyBTZXQ8TGlzdGVuZXI8Uz4+KCk7XG5cbiAgY29uc3RydWN0b3IoaW5pdGlhbFN0YXRlOiBTKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHsgLi4uaW5pdGlhbFN0YXRlIH07XG4gIH1cblxuICBnZXRTdGF0ZSgpOiBSZWFkb25seTxTPiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gIH1cblxuICBzZXRTdGF0ZSh1cGRhdGVyOiBQYXJ0aWFsPFM+IHwgKChzOiBSZWFkb25seTxTPikgPT4gUGFydGlhbDxTPikpOiB2b2lkIHtcbiAgICBjb25zdCBwYXRjaCA9IHR5cGVvZiB1cGRhdGVyID09PSAnZnVuY3Rpb24nXG4gICAgICA/IHVwZGF0ZXIodGhpcy5zdGF0ZSlcbiAgICAgIDogdXBkYXRlcjtcbiAgICB0aGlzLnN0YXRlID0geyAuLi50aGlzLnN0YXRlLCAuLi5wYXRjaCB9O1xuICAgIHRoaXMuZ2xvYmFsTGlzdGVuZXJzLmZvckVhY2gobCA9PiBsKHRoaXMuc3RhdGUpKTtcbiAgfVxuXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXI8Uz4pOiAoKSA9PiB2b2lkIHtcbiAgICB0aGlzLmdsb2JhbExpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICAgIHJldHVybiAoKSA9PiB0aGlzLmdsb2JhbExpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9XG5cbiAgc2VsZWN0PFQ+KHNlbGVjdG9yOiBTZWxlY3RvcjxTLCBUPiwgbGlzdGVuZXI6IExpc3RlbmVyPFQ+KTogKCkgPT4gdm9pZCB7XG4gICAgbGV0IHByZXYgPSBzZWxlY3Rvcih0aGlzLnN0YXRlKTtcbiAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmUoc3RhdGUgPT4ge1xuICAgICAgY29uc3QgbmV4dCA9IHNlbGVjdG9yKHN0YXRlKTtcbiAgICAgIGlmIChuZXh0ICE9PSBwcmV2KSB7XG4gICAgICAgIHByZXYgPSBuZXh0O1xuICAgICAgICBsaXN0ZW5lcihuZXh0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IFN0b3JlIH0gZnJvbSAnLi9TdG9yZSc7XG5pbXBvcnQgdHlwZSB7IENsaWVudGUgfSBmcm9tICcuLi9kb21haW4vY2xpZW50ZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwU3RhdGUge1xuICByZWFkb25seSBjbGllbnRlOiBDbGllbnRlIHwgbnVsbDtcbiAgcmVhZG9ubHkgaXNMb2dnZWRJbjogYm9vbGVhbjtcbiAgcmVhZG9ubHkgaXNBZG1pbjogYm9vbGVhbjtcbiAgcmVhZG9ubHkgY2FycmluaG9Db3VudDogbnVtYmVyO1xuICByZWFkb25seSBjYXJyaW5ob1RvdGFsOiBudW1iZXI7XG4gIHJlYWRvbmx5IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHBlZGlkb0lkUGVuZGVudGU6IG51bWJlciB8IG51bGw7XG4gIHJlYWRvbmx5IHBpeERhdGE6IFBpeERhdGEgfCBudWxsO1xuICByZWFkb25seSByb2xldGFBdGl2YTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQaXhEYXRhIHtcbiAgcmVhZG9ubHkgcXJDb2RlOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHBpeENvcGlhRUNvbGE6IHN0cmluZztcbiAgcmVhZG9ubHkgYXNhYXNQYXltZW50SWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgcGVkaWRvSWQ6IG51bWJlcjtcbn1cblxuY29uc3QgQURNSU5fVEVMID0gYXRvYignTVRFNU5EQTNOekkzTlRBPScpO1xuY29uc3QgQ09OVEFfVEVTVEUgPSBhdG9iKCdNVEU1TmpVd016QXdOelk9Jyk7XG5cbmZ1bmN0aW9uIGNhbGNJc0FkbWluKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWNsaWVudGUgJiYgY2xpZW50ZS50ZWxlZm9uZSA9PT0gQURNSU5fVEVMO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250YVRlc3RlKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWNsaWVudGUgJiYgY2xpZW50ZS50ZWxlZm9uZSA9PT0gQ09OVEFfVEVTVEU7XG59XG5cbmV4cG9ydCBjb25zdCBhcHBTdG9yZSA9IG5ldyBTdG9yZTxBcHBTdGF0ZT4oe1xuICBjbGllbnRlOiBudWxsLFxuICBpc0xvZ2dlZEluOiBmYWxzZSxcbiAgaXNBZG1pbjogZmFsc2UsXG4gIGNhcnJpbmhvQ291bnQ6IDAsXG4gIGNhcnJpbmhvVG90YWw6IDAsXG4gIHBhZ2FtZW50b1NlbGVjaW9uYWRvOiAnJyxcbiAgcGVkaWRvSWRQZW5kZW50ZTogbnVsbCxcbiAgcGl4RGF0YTogbnVsbCxcbiAgcm9sZXRhQXRpdmE6IGZhbHNlLFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDbGllbnRlKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHtcbiAgICBjbGllbnRlLFxuICAgIGlzTG9nZ2VkSW46ICEhY2xpZW50ZSxcbiAgICBpc0FkbWluOiBjYWxjSXNBZG1pbihjbGllbnRlKSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDYXJyaW5obyhjb3VudDogbnVtYmVyLCB0b3RhbDogbnVtYmVyKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgY2FycmluaG9Db3VudDogY291bnQsIGNhcnJpbmhvVG90YWw6IHRvdGFsIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UGFnYW1lbnRvKHRpcG86IHN0cmluZyk6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiB0aXBvIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UGl4RGF0YShkYXRhOiBQaXhEYXRhIHwgbnVsbCk6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBpeERhdGE6IGRhdGEgfSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBJQ2xpZW50ZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9yZXBvc2l0b3JpZXMvSUNsaWVudGVSZXBvc2l0b3J5JztcbmltcG9ydCB7IENsaWVudGUgfSBmcm9tICcuLi8uLi9kb21haW4vY2xpZW50ZSc7XG5pbXBvcnQgeyB0eXBlIFJlc3VsdCwgb2ssIGZhaWwsIHRyeUFzeW5jIH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgUmF0ZUxpbWl0RXJyb3IsIFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcbmltcG9ydCB7IGV2ZW50QnVzIH0gZnJvbSAnLi4vLi4vY29yZS9ldmVudHMnO1xuaW1wb3J0IHsgc2V0Q2xpZW50ZSB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0b3JlJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdMb2dpblVzZUNhc2UnKTtcblxuY29uc3QgU0VTU0lPTl9LRVkgPSAnZ2VsYW1vdXJfY2xpZW50ZSc7XG5jb25zdCBTRVNTSU9OX1RTX0tFWSA9ICdnZWxhbW91cl90cyc7XG5jb25zdCBTRVNTSU9OX1RUTF9NUyA9IDI0ICogNjAgKiA2MCAqIDEwMDA7XG5cbmludGVyZmFjZSBSYXRlTGltaXRlciB7XG4gIGF0dGVtcHRzOiBudW1iZXI7XG4gIGJsb2NrZWRVbnRpbDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgTG9naW5Vc2VDYXNlIHtcbiAgcHJpdmF0ZSByYXRlTGltaXRlcjogUmF0ZUxpbWl0ZXIgPSB7IGF0dGVtcHRzOiAwLCBibG9ja2VkVW50aWw6IDAgfTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNsaWVudGVSZXBvOiBJQ2xpZW50ZVJlcG9zaXRvcnkpIHt9XG5cbiAgcmVzdG9yZVNlc3Npb24oKTogQ2xpZW50ZSB8IG51bGwge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB0cyA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFNFU1NJT05fVFNfS0VZKSA/PyAnMCcpO1xuICAgICAgaWYgKERhdGUubm93KCkgLSB0cyA+IFNFU1NJT05fVFRMX01TKSB7XG4gICAgICAgIHRoaXMuY2xlYXJTZXNzaW9uKCk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgcmF3ID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShTRVNTSU9OX0tFWSk7XG4gICAgICBpZiAoIXJhdykgcmV0dXJuIG51bGw7XG4gICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShyYXcpIGFzIFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+O1xuICAgICAgY29uc3QgY2xpZW50ZSA9IENsaWVudGUuZnJvbURCKGRhdGEpO1xuICAgICAgc2V0Q2xpZW50ZShjbGllbnRlKTtcbiAgICAgIHJldHVybiBjbGllbnRlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy5jbGVhclNlc3Npb24oKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGV4ZWN1dGUodGVsZWZvbmU6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHsgZXhpc3RlOiBib29sZWFuOyBjbGllbnRlPzogQ2xpZW50ZSB9Pj4ge1xuICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5yYXRlTGltaXRlci5ibG9ja2VkVW50aWwpIHtcbiAgICAgIHJldHVybiBmYWlsKG5ldyBSYXRlTGltaXRFcnJvcih0aGlzLnJhdGVMaW1pdGVyLmJsb2NrZWRVbnRpbCAtIERhdGUubm93KCkpKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZWwgPSB0ZWxlZm9uZS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgIGlmICh0ZWwubGVuZ3RoIDwgMTApIHJldHVybiBmYWlsKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RlbGVmb25lIGludlx1MDBFMWxpZG8nKSk7XG5cbiAgICBsb2cuaW5mbygnVmVyaWZpY2FuZG8gdGVsZWZvbmUnLCB7IHRlbDogYCoqKiR7dGVsLnNsaWNlKC00KX1gIH0pO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2xpZW50ZVJlcG8uZmluZEJ5VGVsZWZvbmUodGVsKTtcblxuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICB0aGlzLnJhdGVMaW1pdGVyLmF0dGVtcHRzKys7XG4gICAgICBpZiAodGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cyA+PSA1KSB7XG4gICAgICAgIHRoaXMucmF0ZUxpbWl0ZXIuYmxvY2tlZFVudGlsID0gRGF0ZS5ub3coKSArIDYwXzAwMDtcbiAgICAgICAgdGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cyA9IDA7XG4gICAgICAgIHJldHVybiBmYWlsKG5ldyBSYXRlTGltaXRFcnJvcig2MF8wMDApKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWlsKHJlc3VsdC5lcnJvcik7XG4gICAgfVxuXG4gICAgdGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cyA9IDA7XG4gICAgcmV0dXJuIG9rKHsgZXhpc3RlOiAhIXJlc3VsdC52YWx1ZSwgY2xpZW50ZTogcmVzdWx0LnZhbHVlID8/IHVuZGVmaW5lZCB9KTtcbiAgfVxuXG4gIGFzeW5jIHJlZ2lzdGVyKG5vbWU6IHN0cmluZywgdGVsZWZvbmU6IHN0cmluZywgZW5kZXJlY286IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PENsaWVudGU+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGVudGl0eSA9IENsaWVudGUuY3JlYXRlKHsgbm9tZSwgdGVsZWZvbmUsIGVuZGVyZWNvIH0pO1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLmNsaWVudGVSZXBvLnNhdmUoZW50aXR5KTtcbiAgICAgIGlmICghc2F2ZWQub2spIHRocm93IHNhdmVkLmVycm9yO1xuICAgICAgcmV0dXJuIHNhdmVkLnZhbHVlO1xuICAgIH0pO1xuICB9XG5cbiAgbG9naW4oY2xpZW50ZTogQ2xpZW50ZSk6IHZvaWQge1xuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oU0VTU0lPTl9LRVksIEpTT04uc3RyaW5naWZ5KGNsaWVudGUudG9KU09OKCkpKTtcbiAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFNFU1NJT05fVFNfS0VZLCBTdHJpbmcoRGF0ZS5ub3coKSkpO1xuICAgIHNldENsaWVudGUoY2xpZW50ZSk7XG4gICAgZXZlbnRCdXMuZW1pdCgnYXV0aDpsb2dpbicsIHsgY2xpZW50ZSB9KTtcbiAgICBsb2cuaW5mbygnTG9naW4gcmVhbGl6YWRvJywgeyBpZDogY2xpZW50ZS5pZCB9KTtcbiAgfVxuXG4gIGxvZ291dCgpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFyU2Vzc2lvbigpO1xuICAgIHNldENsaWVudGUobnVsbCk7XG4gICAgZXZlbnRCdXMuZW1pdCgnYXV0aDpsb2dvdXQnLCB1bmRlZmluZWQgYXMgdW5rbm93biBhcyB2b2lkKTtcbiAgICBsb2cuaW5mbygnTG9nb3V0IHJlYWxpemFkbycpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhclNlc3Npb24oKTogdm9pZCB7XG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX0tFWSk7XG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX1RTX0tFWSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBldmVudEJ1cyB9IGZyb20gJy4uLy4uL2NvcmUvZXZlbnRzJztcbmltcG9ydCB7IHNldENhcnJpbmhvIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RvcmUnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBJdGVtUGVkaWRvIH0gZnJvbSAnLi4vLi4vZG9tYWluL3BlZGlkbyc7XG5cbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnQ2FydFNlcnZpY2UnKTtcblxuZXhwb3J0IGNsYXNzIENhcnRTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBpdGVtcyA9IG5ldyBNYXA8c3RyaW5nLCBJdGVtUGVkaWRvPigpO1xuXG4gIGFkZChub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pdGVtcy5oYXMobm9tZSkpIHJldHVybjtcbiAgICB0aGlzLml0ZW1zLnNldChub21lLCB7IG5vbWUsIHByZWNvOiBOdW1iZXIocHJlY28pIH0pO1xuICAgIHRoaXMubm90aWZ5KCk7XG4gICAgbG9nLmRlYnVnKCdJdGVtIGFkaWNpb25hZG8nLCB7IG5vbWUgfSk7XG4gIH1cblxuICByZW1vdmUobm9tZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLml0ZW1zLmhhcyhub21lKSkgcmV0dXJuO1xuICAgIHRoaXMuaXRlbXMuZGVsZXRlKG5vbWUpO1xuICAgIHRoaXMubm90aWZ5KCk7XG4gICAgbG9nLmRlYnVnKCdJdGVtIHJlbW92aWRvJywgeyBub21lIH0pO1xuICB9XG5cbiAgdG9nZ2xlKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6ICdhZGRlZCcgfCAncmVtb3ZlZCcge1xuICAgIGlmICh0aGlzLml0ZW1zLmhhcyhub21lKSkge1xuICAgICAgdGhpcy5yZW1vdmUobm9tZSk7XG4gICAgICByZXR1cm4gJ3JlbW92ZWQnO1xuICAgIH1cbiAgICB0aGlzLmFkZChub21lLCBwcmVjbyk7XG4gICAgcmV0dXJuICdhZGRlZCc7XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zLmNsZWFyKCk7XG4gICAgdGhpcy5ub3RpZnkoKTtcbiAgfVxuXG4gIGdldEl0ZW1zKCk6IHJlYWRvbmx5IEl0ZW1QZWRpZG9bXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5pdGVtcy52YWx1ZXMoKSk7XG4gIH1cblxuICBnZXRUb3RhbCgpOiBudW1iZXIge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuaXRlbXMudmFsdWVzKCkpXG4gICAgICAucmVkdWNlKChzdW0sIGkpID0+IE1hdGgucm91bmQoKHN1bSArIGkucHJlY28pICogMTAwKSAvIDEwMCwgMCk7XG4gIH1cblxuICBnZXRDb3VudCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5pdGVtcy5zaXplOyB9XG5cbiAgaGFzKG5vbWU6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pdGVtcy5oYXMobm9tZSk7IH1cblxuICBpc0VtcHR5KCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pdGVtcy5zaXplID09PSAwOyB9XG5cbiAgcmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcDogTWFwPHN0cmluZywgbnVtYmVyPik6IHZvaWQge1xuICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdGVtLCBrZXkpID0+IHtcbiAgICAgIGNvbnN0IHJlYWxQcmljZSA9IHByaWNlTWFwLmdldChrZXkpO1xuICAgICAgaWYgKHJlYWxQcmljZSAhPT0gdW5kZWZpbmVkICYmIHJlYWxQcmljZSAhPT0gaXRlbS5wcmVjbykge1xuICAgICAgICB0aGlzLml0ZW1zLnNldChrZXksIHsgLi4uaXRlbSwgcHJlY286IHJlYWxQcmljZSB9KTtcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgIGxvZy53YXJuKCdQcmVcdTAwRTdvIHJldmFsaWRhZG8nLCB7IG5vbWU6IGtleSwgb2xkOiBpdGVtLnByZWNvLCBuZXc6IHJlYWxQcmljZSB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoY2hhbmdlZCkgdGhpcy5ub3RpZnkoKTtcbiAgfVxuXG4gIHByaXZhdGUgbm90aWZ5KCk6IHZvaWQge1xuICAgIHNldENhcnJpbmhvKHRoaXMuZ2V0Q291bnQoKSwgdGhpcy5nZXRUb3RhbCgpKTtcbiAgICBldmVudEJ1cy5lbWl0KCdjYXJ0OnVwZGF0ZWQnLCB7IGNvdW50OiB0aGlzLmdldENvdW50KCksIHRvdGFsOiB0aGlzLmdldFRvdGFsKCkgfSk7XG4gIH1cbn1cbiIsICIvLyBDb21wb3NpdGlvbiBSb290IFx1MjAxNCBpbnN0YW5jaWEgZSBpbmpldGEgZGVwZW5kXHUwMEVBbmNpYXNcbmltcG9ydCB7IENsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9DbGllbnRlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQZWRpZG9SZXBvc2l0b3J5IH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9QZWRpZG9SZXBvc2l0b3J5JztcbmltcG9ydCB7IFJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL1JvbGV0YVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgTG9naW5Vc2VDYXNlIH0gZnJvbSAnLi9hcHBsaWNhdGlvbi9hdXRoL0xvZ2luVXNlQ2FzZSc7XG5pbXBvcnQgeyBDYXJ0U2VydmljZSB9IGZyb20gJy4vYXBwbGljYXRpb24vY2FydC9DYXJ0U2VydmljZSc7XG5cbmNvbnN0IGNsaWVudGVSZXBvc2l0b3J5ID0gbmV3IENsaWVudGVSZXBvc2l0b3J5KCk7XG5jb25zdCBwZWRpZG9SZXBvc2l0b3J5ID0gbmV3IFBlZGlkb1JlcG9zaXRvcnkoKTtcbmNvbnN0IHJvbGV0YVJlcG9zaXRvcnkgPSBuZXcgUm9sZXRhUmVwb3NpdG9yeSgpO1xuXG5leHBvcnQgY29uc3QgbG9naW5Vc2VDYXNlID0gbmV3IExvZ2luVXNlQ2FzZShjbGllbnRlUmVwb3NpdG9yeSk7XG5leHBvcnQgY29uc3QgY2FydFNlcnZpY2UgPSBuZXcgQ2FydFNlcnZpY2UoKTtcblxuZXhwb3J0IHsgY2xpZW50ZVJlcG9zaXRvcnksIHBlZGlkb1JlcG9zaXRvcnksIHJvbGV0YVJlcG9zaXRvcnkgfTtcbiIsICJpbXBvcnQgdHlwZSB7IFJvbGV0YUNvbmZpZyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuLi9jb250YWluZXInO1xuaW1wb3J0IHsgUm9sZXRhRG9tYWluIH0gZnJvbSAnLi4vZG9tYWluL3JvbGV0YSc7XG5pbXBvcnQgeyBzdXBhYmFzZUdldCB9IGZyb20gJy4uL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL2NsaWVudCc7XG5pbXBvcnQgeyBnZXRTZW1hbmFBdHVhbCB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBlc2NIVE1MIH0gZnJvbSAnLi4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgbW9zdHJhclRvYXN0IH0gZnJvbSAnLi4vdXRpbHMvdG9hc3QnO1xuaW1wb3J0IHsgaXNDb250YVRlc3RlIH0gZnJvbSAnLi4vc3RhdGUvQXBwU3RvcmUnO1xuaW1wb3J0IHsgYXBwU3RvcmUgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdG9yZSc7XG5pbXBvcnQgdHlwZSB7IENsaWVudGUgfSBmcm9tICcuLi90eXBlcyc7XG5cbmNvbnN0IFBSRU1JT1NfUEFEUkFPOiBzdHJpbmdbXSA9IFtcbiAgJ1x1RDgzQ1x1REY4MSA1JSBPRkYgXHUyMDE0IENvbXByYXMgYWNpbWEgZGUgUiQzNScsXG4gICdcdUQ4M0NcdURGNkIgQnJvd25pZSBUcmFkaWNpb25hbCBHclx1MDBFMXRpcyBcdTIwMTQgQ29tcHJhcyBhY2ltYSBkZSBSJDUwJyxcbiAgJ1x1RDgzQ1x1REY4MSAxMCUgT0ZGIFx1MjAxNCBDb21wcmFzIGFjaW1hIGRlIFIkNTAnLFxuICAnXHVEODNEXHVEQ0Y4IFNpZ2EgYSBHZWxhbW91ciBubyBJbnN0YWdyYW0nLFxuICAnXHVEODNEXHVERUNEXHVGRTBGIENvbXByZSAyIGUgTGV2ZSBcdTIwMTQgQXRcdTAwRTkgUiQxNCBlbSBwcm9kdXRvcycsXG4gICdcdUQ4M0RcdURFMTUgTlx1MDBFM28gRm9pIERlc3NhIFZleiBcdTIwMTQgR2FuaGEgNSUgT0ZGIGFjaW1hIGRlIFIkMzUnLFxuXTtcblxubGV0IF9wcmVtaW9zOiBzdHJpbmdbXSA9IFsuLi5QUkVNSU9TX1BBRFJBT107XG5sZXQgX3JvdGFjYW9BdHVhbCA9IDA7XG5sZXQgX2dpcmFuZG8gPSBmYWxzZTtcbmxldCBfcGFydGljaXBhY2FvSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJlbWlvc1BhZHJhbygpOiBzdHJpbmdbXSB7IHJldHVybiBQUkVNSU9TX1BBRFJBTzsgfVxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZW1pb3MoKTogc3RyaW5nW10geyByZXR1cm4gX3ByZW1pb3M7IH1cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcmVtaW9zKHA6IHN0cmluZ1tdKTogdm9pZCB7IF9wcmVtaW9zID0gcDsgfVxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcnRpY2lwYWNhb0lkKCk6IG51bWJlciB8IG51bGwgeyByZXR1cm4gX3BhcnRpY2lwYWNhb0lkOyB9XG5leHBvcnQgZnVuY3Rpb24gc2V0UGFydGljaXBhY2FvSWQoaWQ6IG51bWJlciB8IG51bGwpOiB2b2lkIHsgX3BhcnRpY2lwYWNhb0lkID0gaWQ7IH1cbmV4cG9ydCBmdW5jdGlvbiBpc0dpcmFuZG8oKTogYm9vbGVhbiB7IHJldHVybiBfZ2lyYW5kbzsgfVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJDb25maWcoKTogUHJvbWlzZTxSb2xldGFDb25maWcgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgcm93cyA9IGF3YWl0IHN1cGFiYXNlR2V0PFJvbGV0YUNvbmZpZz4oJ3JvbGV0YV9jb25maWcnLCAnaWQ9ZXEuMSZsaW1pdD0xJyk7XG4gICAgaWYgKHJvd3NbMF0pIHtcbiAgICAgIF9wcmVtaW9zID0gQXJyYXkuaXNBcnJheShyb3dzWzBdLnByZW1pb3MpID8gcm93c1swXS5wcmVtaW9zIDogUFJFTUlPU19QQURSQU87XG4gICAgfVxuICAgIHJldHVybiByb3dzWzBdID8/IG51bGw7XG4gIH0gY2F0Y2ggeyByZXR1cm4gbnVsbDsgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyU3RhdHVzKGNsaWVudGVJZDogbnVtYmVyKTogUHJvbWlzZTxpbXBvcnQoJy4uL2RvbWFpbi9yb2xldGEnKS5QYXJ0aWNpcGFjYW9Qcm9wcyB8IG51bGw+IHtcbiAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5maW5kUGFydGljaXBhY2FvQXRpdmEoU3RyaW5nKGNsaWVudGVJZCksIHNlbWFuYSk7XG4gIGlmICghcmVzdWx0Lm9rKSByZXR1cm4gbnVsbDtcbiAgaWYgKHJlc3VsdC52YWx1ZSkgX3BhcnRpY2lwYWNhb0lkID0gcmVzdWx0LnZhbHVlLmlkO1xuICByZXR1cm4gcmVzdWx0LnZhbHVlO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2lyYXIoXG4gIGNsaWVudGU6IENsaWVudGUsXG4gIG9uUmVzdWx0YWRvOiAocHJlbWlvOiBzdHJpbmcsIGluZGljZTogbnVtYmVyKSA9PiB2b2lkXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKF9naXJhbmRvKSByZXR1cm47XG5cbiAgY29uc3Qgc3RhdGUgPSBhcHBTdG9yZS5nZXRTdGF0ZSgpO1xuICBpZiAoIWlzQ29udGFUZXN0ZShzdGF0ZS5jbGllbnRlKSkge1xuICAgIG1vc3RyYXJUb2FzdCgnXHVEODNEXHVERUE3IFJvbGV0YSBlbSBicmV2ZSEgRXN0YW1vcyBmaW5hbGl6YW5kbyBvcyBcdTAwRkFsdGltb3MgZGV0YWxoZXMuIFx1RDgzQ1x1REZBMScsICdpbmZvJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgX2dpcmFuZG8gPSB0cnVlO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGlmIChidG4pIHsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnRleHRDb250ZW50ID0gJ0dpcmFuZG8uLi4nOyB9XG5cbiAgY29uc3QgbiA9IF9wcmVtaW9zLmxlbmd0aDtcbiAgY29uc3QgYXJjID0gMzYwIC8gbjtcbiAgY29uc3QgaW5kaWNlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbik7XG4gIGNvbnN0IHZvbHRhc0V4dHJhcyA9IDUgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1KTtcbiAgY29uc3QgYW5ndWxvQWx2byA9IHZvbHRhc0V4dHJhcyAqIDM2MCArICgzNjAgLSBhcmMgKiBpbmRpY2UgLSBhcmMgLyAyKTtcbiAgY29uc3Qgcm90YWNhb0ZpbmFsID0gX3JvdGFjYW9BdHVhbCArIGFuZ3Vsb0Fsdm87XG5cbiAgY29uc3Qgcm9kYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFSb2RhJyk7XG4gIGlmIChyb2RhKSB7XG4gICAgcm9kYS5zdHlsZS50cmFuc2l0aW9uID0gJ3RyYW5zZm9ybSA0cyBjdWJpYy1iZXppZXIoMC4xNywgMC42NywgMC4xMiwgMSknO1xuICAgIHJvZGEuc3R5bGUudHJhbnNmb3JtT3JpZ2luID0gJzIwMHB4IDIwMHB4JztcbiAgICByb2RhLnN0eWxlLnRyYW5zZm9ybSA9IGByb3RhdGUoJHtyb3RhY2FvRmluYWx9ZGVnKWA7XG4gIH1cblxuICBfcm90YWNhb0F0dWFsID0gKChyb3RhY2FvRmluYWwgJSAzNjApICsgMzYwKSAlIDM2MDtcblxuICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNDIwMCkpO1xuXG4gIGNvbnN0IHByZW1pbyA9IF9wcmVtaW9zW2luZGljZV0hO1xuICBfZ2lyYW5kbyA9IGZhbHNlO1xuXG4gIG9uUmVzdWx0YWRvKHByZW1pbywgaW5kaWNlKTtcblxuICBpZiAoaXNDb250YVRlc3RlKHN0YXRlLmNsaWVudGUpICYmIGJ0bikge1xuICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIGJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGQTEgR0lSQVIgQUdPUkEhJztcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2FsdmFyVmVuY2Vkb3IoY2xpZW50ZTogQ2xpZW50ZSwgcHJlbWlvOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKGlzQ29udGFUZXN0ZShhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUpKSByZXR1cm47XG4gIGlmICghX3BhcnRpY2lwYWNhb0lkKSByZXR1cm47XG5cbiAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcblxuICBjb25zdCBwYXRjaFJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuc2F2ZVBhcnRpY2lwYWNhbyh7XG4gICAgaWQ6IF9wYXJ0aWNpcGFjYW9JZCxcbiAgICBqYV9naXJvdTogdHJ1ZSxcbiAgICBwcmVtaW8sXG4gIH0gYXMgaW1wb3J0KCcuLi9kb21haW4vcm9sZXRhJykuUGFydGljaXBhY2FvUHJvcHMpO1xuXG4gIGlmICghcGF0Y2hSZXN1bHQub2spIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvIGFvIGF0dWFsaXphciBwYXJ0aWNpcGFcdTAwRTdcdTAwRTNvOicsIHBhdGNoUmVzdWx0LmVycm9yKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB2ZW5jZWRvclJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuc2F2ZVZlbmNlZG9yKFxuICAgIGNsaWVudGUudGVsZWZvbmUsXG4gICAgY2xpZW50ZS5ub21lLFxuICAgIHByZW1pbyxcbiAgICBzZW1hbmFcbiAgKTtcblxuICBpZiAoIXZlbmNlZG9yUmVzdWx0Lm9rKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJybyBhbyBzYWx2YXIgdmVuY2Vkb3I6JywgdmVuY2Vkb3JSZXN1bHQuZXJyb3IpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXNlbmhhclJvbGV0YShwcmVtaW9zOiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCB3cmFwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJvbGV0YS1wb2ludGVyLXdyYXAnKTtcbiAgaWYgKCF3cmFwKSByZXR1cm47XG4gIGNvbnN0IG9sZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFDYW52YXMnKTtcbiAgaWYgKG9sZCkgb2xkLnJlbW92ZSgpO1xuXG4gIGNvbnN0IE4gPSBwcmVtaW9zLmxlbmd0aDtcbiAgY29uc3QgQ1ggPSAyMDAsIENZID0gMjAwLCBSID0gMTY0LCBSX0xFRCA9IDE4MiwgUl9PVVRFUiA9IDE5NjtcbiAgY29uc3QgU0VHID0gMzYwIC8gTjtcbiAgY29uc3QgQ09SRVMgPSBbXG4gICAgeyBiZzogJyNGQUYwRjInLCB0eHQ6ICcjQjUxMzRGJyB9LFxuICAgIHsgYmc6ICcjRTg1MjhBJywgdHh0OiAnI0ZGRkZGRicgfSxcbiAgXSBhcyBjb25zdDtcblxuICBjb25zdCByYWQgPSAoZDogbnVtYmVyKTogbnVtYmVyID0+IGQgKiBNYXRoLlBJIC8gMTgwO1xuICBjb25zdCBwdCA9IChkOiBudW1iZXIsIHI6IG51bWJlcik6IFtudW1iZXIsIG51bWJlcl0gPT4gW0NYICsgciAqIE1hdGguY29zKHJhZChkKSksIENZICsgciAqIE1hdGguc2luKHJhZChkKSldO1xuICBjb25zdCBlc2MgPSAoczogc3RyaW5nKTogc3RyaW5nID0+IHMucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xuXG4gIGZ1bmN0aW9uIHNlZ1BhdGgoaTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBjb25zdCBzID0gU0VHICogaSAtIDkwLCBlID0gcyArIFNFRztcbiAgICBjb25zdCBbeDEsIHkxXSA9IHB0KHMsIFIpLCBbeDIsIHkyXSA9IHB0KGUsIFIpO1xuICAgIHJldHVybiBgTSR7Q1h9LCR7Q1l9IEwke3gxLnRvRml4ZWQoMil9LCR7eTEudG9GaXhlZCgyKX0gQSR7Un0sJHtSfSAwIDAsMSAke3gyLnRvRml4ZWQoMil9LCR7eTIudG9GaXhlZCgyKX0gWmA7XG4gIH1cblxuICBmdW5jdGlvbiB3cmFwV29yZHModGV4dDogc3RyaW5nLCBtYXhDaGFyczogbnVtYmVyKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHdvcmRzID0gdGV4dC5zcGxpdCgnICcpO1xuICAgIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBjdXIgPSAnJztcbiAgICB3b3Jkcy5mb3JFYWNoKHcgPT4ge1xuICAgICAgY29uc3QgdGVzdCA9IGN1ciA/IGAke2N1cn0gJHt3fWAgOiB3O1xuICAgICAgaWYgKHRlc3QubGVuZ3RoID4gbWF4Q2hhcnMgJiYgY3VyKSB7IGxpbmVzLnB1c2goY3VyKTsgY3VyID0gdzsgfVxuICAgICAgZWxzZSBjdXIgPSB0ZXN0O1xuICAgIH0pO1xuICAgIGlmIChjdXIpIGxpbmVzLnB1c2goY3VyKTtcbiAgICByZXR1cm4gbGluZXMuc2xpY2UoMCwgMyk7XG4gIH1cblxuICBjb25zdCBzZWdzID0gcHJlbWlvcy5tYXAoKF8sIGkpID0+IHtcbiAgICBjb25zdCBjID0gQ09SRVNbaSAlIDJdITtcbiAgICByZXR1cm4gYDxwYXRoIGQ9XCIke3NlZ1BhdGgoaSl9XCIgZmlsbD1cIiR7Yy5iZ31cIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHNoYXBlLXJlbmRlcmluZz1cImdlb21ldHJpY1ByZWNpc2lvblwiLz5gO1xuICB9KS5qb2luKCcnKTtcblxuICBjb25zdCBzcG9rZXMgPSBwcmVtaW9zLm1hcCgoXywgaSkgPT4ge1xuICAgIGNvbnN0IGQgPSBTRUcgKiBpIC0gOTA7XG4gICAgY29uc3QgW3gsIHldID0gcHQoZCwgUik7XG4gICAgcmV0dXJuIGA8bGluZSB4MT1cIiR7Q1h9XCIgeTE9XCIke0NZfVwiIHgyPVwiJHt4LnRvRml4ZWQoMil9XCIgeTI9XCIke3kudG9GaXhlZCgyKX1cIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiMlwiLz5gO1xuICB9KS5qb2luKCcnKTtcblxuICBjb25zdCB0ZXh0cyA9IHByZW1pb3MubWFwKChwLCBpKSA9PiB7XG4gICAgY29uc3QgbWlkID0gU0VHICogaSAtIDkwICsgU0VHIC8gMjtcbiAgICBjb25zdCBbdHgsIHR5XSA9IHB0KG1pZCwgUiAqIDAuNTcpO1xuICAgIGNvbnN0IGMgPSBDT1JFU1tpICUgMl0hO1xuICAgIGNvbnN0IG0gPSBwLm1hdGNoKC9eKFxcUyspXFxzKyguKykkLyk7XG4gICAgY29uc3QgZW1vamkgPSBtID8gbVsxXSEgOiAnJztcbiAgICBjb25zdCByZXN0ID0gbSA/IG1bMl0hIDogcDtcbiAgICBjb25zdCBsaW5lcyA9IHdyYXBXb3JkcyhyZXN0LCAxMyk7XG4gICAgY29uc3QgbGluZUggPSAxMS41O1xuICAgIGNvbnN0IHRvdGFsVHh0SCA9IGxpbmVzLmxlbmd0aCAqIGxpbmVIO1xuICAgIGNvbnN0IGVtb2ppWSA9IC0odG90YWxUeHRIIC8gMikgLSAxMTtcbiAgICBjb25zdCByb3QgPSAobWlkICsgOTApLnRvRml4ZWQoMSk7XG4gICAgcmV0dXJuIGA8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoJHt0eC50b0ZpeGVkKDIpfSwke3R5LnRvRml4ZWQoMil9KSByb3RhdGUoJHtyb3R9KVwiIHRleHQtcmVuZGVyaW5nPVwiZ2VvbWV0cmljUHJlY2lzaW9uXCI+XG4gIDx0ZXh0IHg9XCIwXCIgeT1cIiR7ZW1vamlZLnRvRml4ZWQoMSl9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBkb21pbmFudC1iYXNlbGluZT1cIm1pZGRsZVwiIGZvbnQtc2l6ZT1cIjE1XCIgZm9udC1mYW1pbHk9XCJzZXJpZlwiPiR7ZXNjKGVtb2ppKX08L3RleHQ+XG4gICR7bGluZXMubWFwKChsLCBsaSkgPT4ge1xuICAgIGNvbnN0IHlwID0gKChsaSAtIChsaW5lcy5sZW5ndGggLSAxKSAvIDIpICogbGluZUgpLnRvRml4ZWQoMSk7XG4gICAgcmV0dXJuIGA8dGV4dCB4PVwiMFwiIHk9XCIke3lwfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmaWxsPVwiJHtjLnR4dH1cIiBmb250LWZhbWlseT1cIidETSBTYW5zJyxBcmlhbCxzYW5zLXNlcmlmXCIgZm9udC13ZWlnaHQ9XCI3MDBcIiBmb250LXNpemU9XCI5XCI+JHtlc2MobCl9PC90ZXh0PmA7XG4gIH0pLmpvaW4oJ1xcbiAgJyl9XG48L2c+YDtcbiAgfSkuam9pbignJyk7XG5cbiAgY29uc3QgTEVEX04gPSAzMDtcbiAgY29uc3QgbGVkcyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IExFRF9OIH0sIChfLCBpKSA9PiB7XG4gICAgY29uc3QgW2x4LCBseV0gPSBwdCgoMzYwIC8gTEVEX04pICogaSAtIDkwLCBSX0xFRCk7XG4gICAgcmV0dXJuIGA8Y2lyY2xlIGN4PVwiJHtseC50b0ZpeGVkKDIpfVwiIGN5PVwiJHtseS50b0ZpeGVkKDIpfVwiIHI9XCI1LjVcIiBjbGFzcz1cInItbGVkIHItbGVkLSR7aSAlIDJ9XCIvPmA7XG4gIH0pLmpvaW4oJycpO1xuXG4gIGNvbnN0IHN2ZyA9IGA8c3ZnIGlkPVwicm9sZXRhQ2FudmFzXCIgdmlld0JveD1cIjAgMCA0MDAgNDAwXCJcbiAgc3R5bGU9XCJ3aWR0aDptaW4oODZ2dywzNDBweCk7aGVpZ2h0Om1pbig4NnZ3LDM0MHB4KTtkaXNwbGF5OmJsb2NrO2ZpbHRlcjpkcm9wLXNoYWRvdygwIDZweCAyMHB4IHJnYmEoMCwwLDAsLjQyKSlcIlxuICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+XG4gIDxkZWZzPlxuICAgIDxyYWRpYWxHcmFkaWVudCBpZD1cInJnLXJpbmdcIiBjeD1cIjUwJVwiIGN5PVwiNTAlXCIgcj1cIjUwJVwiPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiNzAlXCIgc3RvcC1jb2xvcj1cIiNENDJCNzNcIi8+XG4gICAgICA8c3RvcCBvZmZzZXQ9XCIxMDAlXCIgc3RvcC1jb2xvcj1cIiM2QTA4MkVcIi8+XG4gICAgPC9yYWRpYWxHcmFkaWVudD5cbiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9XCJyZy1jdHJcIiBjeD1cIjM1JVwiIGN5PVwiMzAlXCIgcj1cIjcwJVwiPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiMCVcIiBzdG9wLWNvbG9yPVwiI0ZGRTU3QVwiLz5cbiAgICAgIDxzdG9wIG9mZnNldD1cIjQ4JVwiIHN0b3AtY29sb3I9XCIjRDRBRjM3XCIvPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiMTAwJVwiIHN0b3AtY29sb3I9XCIjN0E1ODAwXCIvPlxuICAgIDwvcmFkaWFsR3JhZGllbnQ+XG4gICAgPGZpbHRlciBpZD1cImYtZ2xvd1wiIHg9XCItNjAlXCIgeT1cIi02MCVcIiB3aWR0aD1cIjIyMCVcIiBoZWlnaHQ9XCIyMjAlXCI+XG4gICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPVwiMi41XCIgcmVzdWx0PVwiYlwiLz5cbiAgICAgIDxmZU1lcmdlPjxmZU1lcmdlTm9kZSBpbj1cImJcIi8+PGZlTWVyZ2VOb2RlIGluPVwiU291cmNlR3JhcGhpY1wiLz48L2ZlTWVyZ2U+XG4gICAgPC9maWx0ZXI+XG4gIDwvZGVmcz5cbiAgPGNpcmNsZSBjeD1cIiR7Q1h9XCIgY3k9XCIke0NZfVwiIHI9XCIke1JfT1VURVJ9XCIgZmlsbD1cInVybCgjcmctcmluZylcIi8+XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiJHtSX09VVEVSfVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiI0Q0QUYzN1wiIHN0cm9rZS13aWR0aD1cIjMuNVwiLz5cbiAgPGcgaWQ9XCJyb2xldGFSb2RhXCI+JHtzZWdzfSR7c3Bva2VzfSR7dGV4dHN9PC9nPlxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIiR7UiArIDF9XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiM1wiLz5cbiAgJHtsZWRzfVxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIjQyXCIgZmlsbD1cInVybCgjcmctY3RyKVwiIHN0cm9rZT1cIiNGRkZcIiBzdHJva2Utd2lkdGg9XCIzLjVcIiBmaWx0ZXI9XCJ1cmwoI2YtZ2xvdylcIi8+XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiMzhcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cInJnYmEoMjU1LDI1NSwyNTUsMC4zNSlcIiBzdHJva2Utd2lkdGg9XCIxLjVcIi8+XG4gIDx0ZXh0IHg9XCIke0NYfVwiIHk9XCIke0NZIC0gN31cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGRvbWluYW50LWJhc2VsaW5lPVwibWlkZGxlXCIgZmlsbD1cIiNGRkZcIiBmb250LWZhbWlseT1cIidETSBTYW5zJyxBcmlhbCxzYW5zLXNlcmlmXCIgZm9udC13ZWlnaHQ9XCI4MDBcIiBmb250LXNpemU9XCIxMlwiIGxldHRlci1zcGFjaW5nPVwiMS41XCIgdGV4dC1yZW5kZXJpbmc9XCJnZW9tZXRyaWNQcmVjaXNpb25cIj5HSVJBUjwvdGV4dD5cbiAgPHRleHQgeD1cIiR7Q1h9XCIgeT1cIiR7Q1kgKyA5fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmaWxsPVwicmdiYSgyNTUsMjU1LDI1NSwuODUpXCIgZm9udC1mYW1pbHk9XCJzZXJpZlwiIGZvbnQtc2l6ZT1cIjExXCI+XHUyNjA1IFx1MjYwNSBcdTI2MDU8L3RleHQ+XG48L3N2Zz5gO1xuXG4gIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuaW5uZXJIVE1MID0gc3ZnO1xuICB3cmFwLmluc2VydEJlZm9yZShkaXYuZmlyc3RFbGVtZW50Q2hpbGQhLCB3cmFwLmZpcnN0Q2hpbGQpO1xufVxuXG5leHBvcnQgeyBlc2NIVE1MIH07XG4iLCAiaW1wb3J0IHR5cGUgeyBJdGVtQ2FycmluaG8gfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBlc2NIVE1MIH0gZnJvbSAnLi4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgZm9ybWF0YXJNb2VkYSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBjYXJ0U2VydmljZSB9IGZyb20gJy4uL2NvbnRhaW5lcic7XG5cbi8vIEFkYXB0YWRvcmVzIGxlZ2Fkb3MgXHUyMDE0IGRlbGVnYW0gYW8gQ2FydFNlcnZpY2UgKENsZWFuIEFyY2hpdGVjdHVyZSlcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXJyaW5obygpOiBSZWNvcmQ8c3RyaW5nLCBJdGVtQ2FycmluaG8+IHtcbiAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBJdGVtQ2FycmluaG8+ID0ge307XG4gIGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCkuZm9yRWFjaChpID0+IHsgcmVzdWx0W2kubm9tZV0gPSBpOyB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEl0ZW5zKCk6IEl0ZW1DYXJyaW5ob1tdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oY2FydFNlcnZpY2UuZ2V0SXRlbXMoKSkgYXMgSXRlbUNhcnJpbmhvW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUb3RhbCgpOiBudW1iZXIge1xuICByZXR1cm4gY2FydFNlcnZpY2UuZ2V0VG90YWwoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkaWNpb25hckl0ZW0obm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybiBmYWxzZTtcbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVySXRlbShub21lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKCFjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybiBmYWxzZTtcbiAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZUl0ZW0obm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogJ2FkaWNpb25hZG8nIHwgJ3JlbW92aWRvJyB7XG4gIGNvbnN0IHIgPSBjYXJ0U2VydmljZS50b2dnbGUobm9tZSwgcHJlY28pO1xuICByZXR1cm4gciA9PT0gJ2FkZGVkJyA/ICdhZGljaW9uYWRvJyA6ICdyZW1vdmlkbyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaW1wYXIoKTogdm9pZCB7XG4gIGNhcnRTZXJ2aWNlLmNsZWFyKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0JvbG9Gb3JtYShub21lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgQk9MT19GT1JNQV9OT01FUyA9IFsnQm9sbyBuYSBmb3JtYSBNaWxobyBuYXR1cmFsJywgJ0JvbG8gbmEgZm9ybWEgQ2Vub3VyYSBjb20gY2hvY29sYXRlIGUgR3JhbnVsZSddO1xuICByZXR1cm4gQk9MT19GT1JNQV9OT01FUy5pbmNsdWRlcyhub21lKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlcml6YXJMaXN0YShjb250YWluZXJJZDogc3RyaW5nLCB0b3RhbFJvZGFwZUlkOiBzdHJpbmcsIGJhZGdlSWQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBsaXN0YSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbnRhaW5lcklkKTtcbiAgY29uc3QgdG90YWxFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRvdGFsUm9kYXBlSWQpO1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGJhZGdlSWQpO1xuICBjb25zdCBpdGVucyA9IGdldEl0ZW5zKCk7XG5cbiAgaWYgKGJhZGdlKSBiYWRnZS50ZXh0Q29udGVudCA9IFN0cmluZyhpdGVucy5sZW5ndGgpO1xuXG4gIGlmICghbGlzdGEgfHwgIXRvdGFsRWwpIHJldHVybjtcblxuICBpZiAoaXRlbnMubGVuZ3RoID09PSAwKSB7XG4gICAgbGlzdGEuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJjYXJyaW5oby12YXppb1wiPjxkaXYgY2xhc3M9XCJjYXJyaW5oby12YXppby1pY29uXCI+XHVEODNEXHVERUQyPC9kaXY+PGRpdj5TZXUgY2FycmluaG8gZXN0XHUwMEUxIHZhemlvPC9kaXY+PC9kaXY+YDtcbiAgICB0b3RhbEVsLnRleHRDb250ZW50ID0gJ1IkIDAsMDAnO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRvdGFsID0gZ2V0VG90YWwoKTtcbiAgbGlzdGEuaW5uZXJIVE1MID0gaXRlbnMubWFwKGl0ZW0gPT4ge1xuICAgIGNvbnN0IG5vbWVFc2MgPSBlc2NIVE1MKGl0ZW0ubm9tZSk7XG4gICAgY29uc3Qgbm9tZURhdGEgPSBlbmNvZGVVUklDb21wb25lbnQoaXRlbS5ub21lKTtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJjYXJ0LWl0ZW1cIj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY2FydC1pdGVtLW5vbWVcIj4ke25vbWVFc2N9PC9zcGFuPlxuICAgICAgPHNwYW4gY2xhc3M9XCJjYXJ0LWl0ZW0tcHJlY29cIj4ke2Zvcm1hdGFyTW9lZGEoaXRlbS5wcmVjbyl9PC9zcGFuPlxuICAgICAgPGJ1dHRvbiBjbGFzcz1cImNhcnQtaXRlbS1yZW1vdmVcIiBvbmNsaWNrPVwicmVtb3ZlckRvQ2FycmluaG8oZGVjb2RlVVJJQ29tcG9uZW50KCcke25vbWVEYXRhfScpKVwiIGFyaWEtbGFiZWw9XCJSZW1vdmVyXCI+XHVEODNEXHVEREQxXHVGRTBGPC9idXR0b24+XG4gICAgPC9kaXY+YDtcbiAgfSkuam9pbignJykgKyBgPGRpdiBjbGFzcz1cImNhcnQtdG90YWxcIj48c3BhbiBjbGFzcz1cImNhcnQtdG90YWwtbGFiZWxcIj5Ub3RhbDwvc3Bhbj48c3BhbiBjbGFzcz1cImNhcnQtdG90YWwtdmFsb3JcIj4ke2Zvcm1hdGFyTW9lZGEodG90YWwpfTwvc3Bhbj48L2Rpdj5gO1xuICB0b3RhbEVsLnRleHRDb250ZW50ID0gZm9ybWF0YXJNb2VkYSh0b3RhbCk7XG59XG4iLCAiLy8gc3JjL21haW4udHMgXHUyMDE0IHBvbnRvIGRlIGVudHJhZGEgR2VsYW1vdXIgKENsZWFuIEFyY2hpdGVjdHVyZSlcbmltcG9ydCB7IG1vc3RyYXJUb2FzdCB9IGZyb20gJy4vdXRpbHMvdG9hc3QnO1xuaW1wb3J0IHsgZXNjSFRNTCB9IGZyb20gJy4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgYXBsaWNhck1hc2NhcmFUZWxlZm9uZSB9IGZyb20gJy4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGxvZ2luVXNlQ2FzZSwgY2FydFNlcnZpY2UsIHBlZGlkb1JlcG9zaXRvcnksIHJvbGV0YVJlcG9zaXRvcnksIGNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHsgYXBwU3RvcmUsIGlzQ29udGFUZXN0ZSB9IGZyb20gJy4vc3RhdGUvQXBwU3RvcmUnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi9jb3JlL2xvZ2dlcic7XG5pbXBvcnQgeyBDbGllbnRlIGFzIENsaWVudGVFbnRpdHkgfSBmcm9tICcuL2RvbWFpbi9jbGllbnRlJztcbmltcG9ydCB7IGdldFNlbWFuYUF0dWFsIH0gZnJvbSAnLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHtcbiAgZ2V0UHJlbWlvcywgZ2V0UHJlbWlvc1BhZHJhbywgc2V0UHJlbWlvcyxcbiAgZ2V0UGFydGljaXBhY2FvSWQsIHNldFBhcnRpY2lwYWNhb0lkLFxuICBjYXJyZWdhckNvbmZpZyBhcyBjYXJyZWdhckNvbmZpZ1JvbGV0YSxcbiAgdmVyaWZpY2FyU3RhdHVzIGFzIHZlcmlmaWNhclN0YXR1c1JvbGV0YSxcbiAgZ2lyYXIgYXMgZ2lyYXJSb2xldGFGbixcbiAgc2FsdmFyVmVuY2Vkb3IsXG4gIGRlc2VuaGFyUm9sZXRhXG59IGZyb20gJy4vbW9kdWxlcy9yb2xldGEnO1xuaW1wb3J0IHsgaXNCb2xvRm9ybWEsIHJlbmRlcml6YXJMaXN0YSB9IGZyb20gJy4vbW9kdWxlcy9jYXJ0JztcbmltcG9ydCB0eXBlIHsgQ2xpZW50ZSwgUGFydGljaXBhY2FvIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBTVVBBQkFTRV9VUkwsIFNVUEFCQVNFX0FOT04gfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL2NsaWVudCc7XG5cbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnbWFpbicpO1xuXG4vLyA9PT09PSBDT05TVEFOVEVTID09PT09XG5jb25zdCBXQV9OVU1CRVIgPSBhdG9iKCdOVFV4TVRrME1EYzNNamMxTUE9PScpO1xuY29uc3QgRURHRV9VUkwgPSBgJHtTVVBBQkFTRV9VUkx9L2Z1bmN0aW9ucy92MWA7XG5cbi8vID09PT09IEVTVEFETyBMT0NBTCBERSBVSSAoblx1MDBFM28gZ2xvYmFsIFx1MjAxNCBlbmNhcHN1bGFkbykgPT09PT1cbmxldCBfcGl4UGF5bG9hZCA9ICcnO1xubGV0IF9waXhQb2xsVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPiB8IG51bGwgPSBudWxsO1xubGV0IF9waXhQb2xsVGltZW91dFRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsOyAvLyBsaW1pdGUgMzBtaW5cbmxldCBfcGl4Q2FuY2VsbGVkID0gZmFsc2U7IC8vIGZsYWcgcGFyYSBldml0YXIgcmFjZSBjb25kaXRpb24gbm8gdGltZXJcbmxldCBfcGl4UGVkaWRvSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xubGV0IF9waXhNc2dXQSA9ICcnO1xubGV0IF9waXhUb3RhbCA9IDA7XG5sZXQgX3BpeE5vbWUgPSAnJztcbmxldCBfcGl4SXRlbnM6IEFycmF5PHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyIH0+ID0gW107XG5sZXQgX3BpeEVuZGVyZWNvID0gJyc7XG5sZXQgX2NhcmRUaXBvID0gJ2NyZWRpdG8nO1xuXG5sZXQgX3ZlcmlmaWNhbmRvID0gZmFsc2U7XG5sZXQgX2NhZGFzdHJhbmRvID0gZmFsc2U7XG5cbi8vIEhlbHBlcjogbFx1MDBFQSBjbGllbnRlIGF0dWFsIGRvIHN0b3JlXG5mdW5jdGlvbiBnZXRDbGllbnRlQXR1YWwoKTogQ2xpZW50ZSB8IG51bGwge1xuICByZXR1cm4gYXBwU3RvcmUuZ2V0U3RhdGUoKS5jbGllbnRlIGFzIENsaWVudGUgfCBudWxsO1xufVxuXG4vLyA9PT09PSBGSUxUUk9TID09PT09XG5mdW5jdGlvbiBmaWx0cmFyKGNhdDogc3RyaW5nLCBidG46IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5maWx0cm8tYnRuJykuZm9yRWFjaChiID0+IGIuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJykpO1xuICBidG4uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcm9kLWNhcmQnKS5mb3JFYWNoKGNhcmQgPT4ge1xuICAgIGNvbnN0IGVsID0gY2FyZCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAoY2F0ID09PSAndG9kb3MnIHx8IChlbC5kYXRhc2V0WydjYXQnXSA9PT0gY2F0KSlcbiAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xuICAgIGVsc2VcbiAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xuICB9KTtcbn1cblxuLy8gPT09PT0gQ0FSUklOSE8gPT09PT1cbmZ1bmN0aW9uIGF0dWFsaXphckZhYigpOiB2b2lkIHtcbiAgY29uc3QgZmFiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhcnRGYWInKTtcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FydEJhZGdlJyk7XG4gIGNvbnN0IGNvdW50ID0gY2FydFNlcnZpY2UuZ2V0Q291bnQoKTtcbiAgaWYgKGJhZGdlKSBiYWRnZS50ZXh0Q29udGVudCA9IFN0cmluZyhjb3VudCk7XG4gIGlmIChmYWIpIHtcbiAgICBpZiAoY291bnQgPiAwKSBmYWIuY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgICBlbHNlIHsgZmFiLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7IGZlY2hhck1vZGFsKCk7IH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwZWRpclByb2R1dG8oYm90YW86IEhUTUxFbGVtZW50LCBub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgY2FyZCA9IGJvdGFvLmNsb3Nlc3QoJy5wcm9kLWNhcmQnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHtcbiAgICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gICAgY2FyZD8uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKTtcbiAgICBhdHVhbGl6YXJGYWIoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcbiAgY2FyZD8uY2xhc3NMaXN0LmFkZCgnc2VsZWNpb25hZG8nKTtcbiAgYXR1YWxpemFyRmFiKCk7XG4gIGFicmlyRGlhbG9nKG5vbWUsIHByZWNvKTtcbn1cblxuZnVuY3Rpb24gYWJyaXJEaWFsb2cobm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ1Byb2R1dG8nKTtcbiAgaWYgKGVsKSBlbC5pbm5lckhUTUwgPSAnPHN0cm9uZz4nICsgZXNjSFRNTChub21lKSArICc8L3N0cm9uZz4gXHUyMDE0IFIkICcgKyBOdW1iZXIocHJlY28pLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyRGlhbG9nKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhckRpYWxvZ0JhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAnZGlhbG9nQmFja2Ryb3AnKSBmZWNoYXJEaWFsb2coKTtcbn1cblxuZnVuY3Rpb24gaXJQYXJhRmluYWxpemFyKCk6IHZvaWQge1xuICBmZWNoYXJEaWFsb2coKTtcbiAgYWJyaXJNb2RhbCgpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJpemFyQ2FycmluaG8oKTogdm9pZCB7XG4gIHJlbmRlcml6YXJMaXN0YSgnbGlzdGFDYXJyaW5obycsICd0b3RhbFJvZGFwZScsICdiYWRnZUNvdW50Jyk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcml6YXJOb3RpY2VFbmNvbWVuZGEoKTogdm9pZCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGljZUVuY29tZW5kYScpO1xuICBpZiAoIWVsKSByZXR1cm47XG4gIGNvbnN0IGl0ZW5zID0gY2FydFNlcnZpY2UuZ2V0SXRlbXMoKTtcbiAgY29uc3QgdGVtRm9ybWEgPSBpdGVucy5zb21lKGkgPT4gaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGNvbnN0IHRlbU91dHJvcyA9IGl0ZW5zLnNvbWUoaSA9PiAhaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGlmICh0ZW1Gb3JtYSAmJiB0ZW1PdXRyb3MpIHtcbiAgICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cIm5vdGljZS1taXN0b1wiPjxzcGFuPlx1MjZBMFx1RkUwRjwvc3Bhbj48c3Bhbj48c3Ryb25nPkF0ZW5cdTAwRTdcdTAwRTNvOjwvc3Ryb25nPiBWb2NcdTAwRUEgbWlzdHVyb3UgQm9sb3MgbmEgRm9ybWEgKGZlaXRvcyBzb2IgZW5jb21lbmRhKSBjb20gb3V0cm9zIHByb2R1dG9zLiBDb25zaWRlcmUgcGVkaWRvcyBzZXBhcmFkb3MgcGFyYSBnYXJhbnRpciBvIHByYXpvITwvc3Bhbj48L2Rpdj4nO1xuICB9IGVsc2UgaWYgKHRlbUZvcm1hKSB7XG4gICAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJub3RpY2UtZW5jb21lbmRhXCI+PHNwYW4gY2xhc3M9XCJub3RpY2UtZW5jb21lbmRhLWljb25cIj5cdTIzRjA8L3NwYW4+PHNwYW4+PHN0cm9uZz5Cb2xvIG5hIEZvcm1hIFx1MjAxNCBTb2IgZW5jb21lbmRhITwvc3Ryb25nPjxicj5Fc3NlcyBib2xvcyBzXHUwMEUzbyBwcmVwYXJhZG9zIGVzcGVjaWFsbWVudGUgcGFyYSB2b2NcdTAwRUEuIFByYXpvIGRlIDxzdHJvbmc+NSBob3JhcyBhIDEgZGlhIFx1MDBGQXRpbDwvc3Ryb25nPiBhcFx1MDBGM3MgY29uZmlybWFcdTAwRTdcdTAwRTNvLjwvc3Bhbj48L2Rpdj4nO1xuICB9IGVsc2Uge1xuICAgIGVsLmlubmVySFRNTCA9ICcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFicmlyTW9kYWwoKTogdm9pZCB7XG4gIHJlbmRlcml6YXJDYXJyaW5obygpO1xuICByZW5kZXJpemFyTm90aWNlRW5jb21lbmRhKCk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLWFiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJNb2RhbCgpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhck1vZGFsQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdtb2RhbEJhY2tkcm9wJykgZmVjaGFyTW9kYWwoKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlckRvQ2FycmluaG8obm9tZTogc3RyaW5nKTogdm9pZCB7XG4gIGlmICghY2FydFNlcnZpY2UuaGFzKG5vbWUpKSByZXR1cm47XG4gIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZC5zZWxlY2lvbmFkbycpLmZvckVhY2goY2FyZCA9PiB7XG4gICAgY29uc3Qgbm9tZUVsID0gY2FyZC5xdWVyeVNlbGVjdG9yKCcucHJvZC1ub21lJyk7XG4gICAgaWYgKG5vbWVFbCAmJiBub21lRWwudGV4dENvbnRlbnQ/LnRyaW0oKSA9PT0gbm9tZSkgY2FyZC5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpO1xuICB9KTtcbiAgcmVuZGVyaXphckNhcnJpbmhvKCk7XG4gIGF0dWFsaXphckZhYigpO1xufVxuXG5mdW5jdGlvbiBzZWxlY2lvbmFyUGFnYW1lbnRvKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGFnYW1lbnRvLW9wdCcpLmZvckVhY2gobyA9PiBvLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xuICBlbC5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBjb25zdCB0aXBvID0gKGVsIGFzIEhUTUxFbGVtZW50ICYgeyBkYXRhc2V0OiBET01TdHJpbmdNYXAgfSkuZGF0YXNldFsncGFnJ10gPz8gJyc7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGFnYW1lbnRvU2VsZWNpb25hZG86IHRpcG8gfSk7XG59XG5cbmZ1bmN0aW9uIGxpbXBhckNhcnJpbmhvKCk6IHZvaWQge1xuICBjYXJ0U2VydmljZS5jbGVhcigpO1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiAnJyB9KTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2FtZW50by1vcHQuYXRpdm8nKS5mb3JFYWNoKG8gPT4gby5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcbiAgY29uc3Qgb2JzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wT2JzJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGw7XG4gIGlmIChvYnNFbCkgb2JzRWwudmFsdWUgPSAnJztcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZC5zZWxlY2lvbmFkbycpLmZvckVhY2goYyA9PiBjLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJykpO1xuICBhdHVhbGl6YXJGYWIoKTtcbiAgZmVjaGFyTW9kYWwoKTtcbn1cblxuLy8gPT09PT0gQk9MTyBOQSBGT1JNQSA9PT09PVxuZnVuY3Rpb24gcGVkaXJCb2xvRm9ybWEoYm90YW86IEhUTUxFbGVtZW50LCBub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgY2FyZCA9IGJvdGFvLmNsb3Nlc3QoJy5wcm9kLWNhcmQnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHtcbiAgICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gICAgY2FyZD8uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKTtcbiAgICBhdHVhbGl6YXJGYWIoKTtcbiAgICByZW5kZXJpemFyTm90aWNlRW5jb21lbmRhKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNhcnRTZXJ2aWNlLmFkZChub21lLCBwcmVjbyk7XG4gIGNhcmQ/LmNsYXNzTGlzdC5hZGQoJ3NlbGVjaW9uYWRvJyk7XG4gIGF0dWFsaXphckZhYigpO1xuICBhYnJpckRpYWxvZ0JvbG8oKTtcbn1cblxuZnVuY3Rpb24gYWJyaXJEaWFsb2dCb2xvKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQm9sb0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJEaWFsb2dCb2xvKGU/OiBFdmVudCk6IHZvaWQge1xuICBpZiAoIWUgfHwgKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ2RpYWxvZ0JvbG9CYWNrZHJvcCcpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQm9sb0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFnZW5kYXJCb2xvV2hhdHNBcHAoKTogdm9pZCB7XG4gIGNvbnN0IGl0ZW5zRm9ybWEgPSBjYXJ0U2VydmljZS5nZXRJdGVtcygpLmZpbHRlcihpID0+IGlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuICBsZXQgbGluaGFzID0gJyc7XG4gIGxldCB0b3RhbCA9IDA7XG4gIGl0ZW5zRm9ybWEuZm9yRWFjaChpID0+IHtcbiAgICBsaW5oYXMgKz0gJ1x1MjAyMiAnICsgaS5ub21lICsgJyBcdTIwMTQgUiQgJyArIGkucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKSArICdcXG4nO1xuICAgIHRvdGFsID0gTWF0aC5yb3VuZCgodG90YWwgKyBpLnByZWNvKSAqIDEwMCkgLyAxMDA7XG4gIH0pO1xuICBjb25zdCBtc2cgPSAnKlx1RDgzQ1x1REY4MiBBR0VOREFNRU5UTyAtIEJPTE8gTkEgRk9STUEgLSBHRUxBTU9VUipcXG5cXG5PbFx1MDBFMSEgR29zdGFyaWEgZGUgYWdlbmRhciBvKHMpIHNlZ3VpbnRlKHMpIGJvbG8ocyk6XFxuXFxuJyArIGxpbmhhcyArICdcXG4qXHVEODNEXHVEQ0IwIFRvdGFsOiogUiQgJyArIHRvdGFsLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJykgKyAnXFxuXFxuXHUyM0YwIFNlaSBxdWUgbyBwcmF6byBcdTAwRTkgZGUgNSBob3JhcyBhIDEgZGlhIFx1MDBGQXRpbC4gUG9yIGZhdm9yIG1lIGluZm9ybWUgYSBkYXRhIGUgaG9yXHUwMEUxcmlvIGRpc3Bvblx1MDBFRHZlaXMgcGFyYSBlbnRyZWdhLiBcdUQ4M0RcdURFMEEnO1xuICB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQobXNnKSwgJ19ibGFuaycpO1xuICBmZWNoYXJEaWFsb2dCb2xvKCk7XG59XG5cbi8vID09PT09IENBUk9VU0VMID09PT09XG5mdW5jdGlvbiBjYXJvdXNlbE5leHQoaWQ6IHN0cmluZywgZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKGUpIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGNvbnN0IGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIGlmICghYykgcmV0dXJuO1xuICBjb25zdCBpbWdzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtaW1nJyk7XG4gIGNvbnN0IGRvdHMgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1kb3QnKTtcbiAgbGV0IGN1ciA9IDA7XG4gIGltZ3MuZm9yRWFjaCgoaW1nLCBpKSA9PiB7IGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhdGl2bycpKSBjdXIgPSBpOyB9KTtcbiAgaW1nc1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBkb3RzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGNvbnN0IG5leHQgPSAoY3VyICsgMSkgJSBpbWdzLmxlbmd0aDtcbiAgaW1nc1tuZXh0XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgZG90c1tuZXh0XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbn1cblxuZnVuY3Rpb24gY2Fyb3VzZWxQcmV2KGlkOiBzdHJpbmcsIGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmIChlKSBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICBjb25zdCBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICBpZiAoIWMpIHJldHVybjtcbiAgY29uc3QgaW1ncyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWltZycpO1xuICBjb25zdCBkb3RzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtZG90Jyk7XG4gIGxldCBjdXIgPSAwO1xuICBpbWdzLmZvckVhY2goKGltZywgaSkgPT4geyBpZiAoaW1nLmNsYXNzTGlzdC5jb250YWlucygnYXRpdm8nKSkgY3VyID0gaTsgfSk7XG4gIGltZ3NbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcbiAgZG90c1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBjb25zdCBwcmV2ID0gKGN1ciAtIDEgKyBpbWdzLmxlbmd0aCkgJSBpbWdzLmxlbmd0aDtcbiAgaW1nc1twcmV2XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgZG90c1twcmV2XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbn1cblxuLy8gPT09PT0gQ0hFQ0tPVVQgLyBQRURJRE8gPT09PT1cbmFzeW5jIGZ1bmN0aW9uIGZpbmFsaXphclBlZGlkbygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgaXRlbnMgPSBjYXJ0U2VydmljZS5nZXRJdGVtcygpO1xuICBjb25zdCB0ZW1Gb3JtYUZpbiA9IGl0ZW5zLnNvbWUoaSA9PiBpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgY29uc3QgdGVtT3V0cm9zRmluID0gaXRlbnMuc29tZShpID0+ICFpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgaWYgKHRlbUZvcm1hRmluICYmIHRlbU91dHJvc0Zpbikge1xuICAgIGlmICghY29uZmlybSgnXHUyNkEwXHVGRTBGIEF0ZW5cdTAwRTdcdTAwRTNvIVxcblxcblZvY1x1MDBFQSB0ZW0gQm9sb3MgbmEgRm9ybWEgKGZlaXRvcyBzb2IgZW5jb21lbmRhKSBtaXN0dXJhZG9zIGNvbSBvdXRyb3MgcHJvZHV0b3Mgbm8gY2FycmluaG8uXFxuXFxuQm9sb3MgbmEgRm9ybWEgcHJlY2lzYW0gZGUgcHJhem8gZGUgNWggYSAxIGRpYSBcdTAwRkF0aWwgcGFyYSBwcmVwYXJvLlxcblxcbkRlc2VqYSBwcm9zc2VndWlyIGNvbSB0b2RvcyBvcyBpdGVucyBtZXNtbyBhc3NpbT8nKSlcbiAgICAgIHJldHVybjtcbiAgfVxuICBpZiAoaXRlbnMubGVuZ3RoID09PSAwKSB7IGFsZXJ0KCdBZGljaW9uZSBwZWxvIG1lbm9zIHVtIHByb2R1dG8gYW8gY2FycmluaG8hJyk7IHJldHVybjsgfVxuXG4gIGNvbnN0IG5vbWUgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBlbmRlcmVjbyA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBvYnMgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE9icycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XG4gIGNvbnN0IHBhZ2FtZW50b1NlbGVjaW9uYWRvID0gYXBwU3RvcmUuZ2V0U3RhdGUoKS5wYWdhbWVudG9TZWxlY2lvbmFkbztcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG5cbiAgaWYgKCFub21lKSB7IGFsZXJ0KCdQb3IgZmF2b3IsIGluZm9ybWUgc2V1IG5vbWUgY29tcGxldG8uJyk7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJyk/LmZvY3VzKCk7IHJldHVybjsgfVxuICBpZiAoIWVuZGVyZWNvKSB7IGFsZXJ0KCdQb3IgZmF2b3IsIGluZm9ybWUgc2V1IGVuZGVyZVx1MDBFN28uJyk7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBFbmRlcmVjbycpPy5mb2N1cygpOyByZXR1cm47IH1cbiAgaWYgKCFwYWdhbWVudG9TZWxlY2lvbmFkbykgeyBhbGVydCgnUG9yIGZhdm9yLCBlc2NvbGhhIGEgZm9ybWEgZGUgcGFnYW1lbnRvLicpOyByZXR1cm47IH1cblxuICAvLyBSZS12ZXJpZmljYXIgcHJlXHUwMEU3b3MgZG9zIGJvdFx1MDBGNWVzIHBhcmEgZXZpdGFyIG1hbmlwdWxhXHUwMEU3XHUwMEUzbyBjbGllbnQtc2lkZVxuICBjb25zdCBwcmljZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idG4tcGVkaXInKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgY29uc3Qgb25jbGlja0F0dHIgPSBidG4uZ2V0QXR0cmlidXRlKCdvbmNsaWNrJykgPz8gJyc7XG4gICAgY29uc3QgbSA9IG9uY2xpY2tBdHRyLm1hdGNoKC9wZWRpclByb2R1dG9cXCh0aGlzLCcoLis/KScsKFxcZCsoPzpcXC5cXGQrKT8pXFwpLyk7XG4gICAgaWYgKG0pIHByaWNlTWFwLnNldChtWzFdISwgcGFyc2VGbG9hdChtWzJdISkpO1xuICB9KTtcbiAgY2FydFNlcnZpY2UucmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcCk7XG5cbiAgY29uc3QgaXRlbnNWZXJpZmljYWRvcyA9IEFycmF5LmZyb20oY2FydFNlcnZpY2UuZ2V0SXRlbXMoKSk7XG4gIGxldCB0b3RhbCA9IDA7XG4gIGxldCBsaW5oYXNJdGVucyA9ICcnO1xuICBpdGVuc1ZlcmlmaWNhZG9zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgdG90YWwgPSBNYXRoLnJvdW5kKCh0b3RhbCArIGl0ZW0ucHJlY28pICogMTAwKSAvIDEwMDtcbiAgICBsaW5oYXNJdGVucyArPSBgXHUyMDIyICR7aXRlbS5ub21lfSBcdTIwMTQgUiQgJHtpdGVtLnByZWNvLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyl9XFxuYDtcbiAgfSk7XG5cbiAgY29uc3QgbXNnID0gYCpcdUQ4M0NcdURGNzAgTk9WTyBQRURJRE8gLSBHRUxBTU9VUipcXG5cXG4qXHVEODNEXHVEQ0NCIElURU5TOipcXG4ke2xpbmhhc0l0ZW5zfVxcbipcdUQ4M0RcdURDQjAgVG90YWw6KiBSJCAke3RvdGFsLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyl9XFxuXFxuKlx1RDgzRFx1REM2NCBOb21lOiogJHtub21lfVxcbipcdUQ4M0RcdURDQ0QgRW5kZXJlXHUwMEU3bzoqICR7ZW5kZXJlY299XFxuKlx1RDgzRFx1RENCMyBQYWdhbWVudG86KiAke3BhZ2FtZW50b1NlbGVjaW9uYWRvfSR7b2JzID8gYFxcbipcdUQ4M0RcdURDREQgT2JzOiogJHtvYnN9YCA6ICcnfVxcblxcblBlZGlkbyBwZWxvIGNhcmRcdTAwRTFwaW8gb25saW5lIFx1MjcyOGA7XG5cbiAgY29uc3QgYnRuRmluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkZpbmFsaXphcicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgdHh0T3JpZyA9IGJ0bkZpbiA/IChidG5GaW4udGV4dENvbnRlbnQgPz8gJycpIDogJyc7XG4gIGlmIChidG5GaW4pIHsgYnRuRmluLmRpc2FibGVkID0gdHJ1ZTsgYnRuRmluLnRleHRDb250ZW50ID0gJ1NhbHZhbmRvIHBlZGlkby4uLic7IH1cblxuICBsZXQgX3BlZGlkb0lkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCBjdHJsID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHRpZCA9IHNldFRpbWVvdXQoKCkgPT4gY3RybC5hYm9ydCgpLCAxMF8wMDApO1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcGVkaWRvcycsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTixcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OLFxuICAgICAgICAnUHJlZmVyJzogJ3JldHVybj1oZWFkZXJzLW9ubHknXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBub21lLCBlbmRlcmVjbyxcbiAgICAgICAgcGFnYW1lbnRvOiBwYWdhbWVudG9TZWxlY2lvbmFkbyxcbiAgICAgICAgaXRlbnM6IGl0ZW5zVmVyaWZpY2Fkb3MubWFwKGkgPT4gKHsgbm9tZTogaS5ub21lLCBwcmVjbzogaS5wcmVjbyB9KSksXG4gICAgICAgIHRvdGFsLFxuICAgICAgICBzdGF0dXM6ICdhZ3VhcmRhbmRvJyxcbiAgICAgICAgb2JzZXJ2YWNhbzogb2JzIHx8IG51bGwsXG4gICAgICAgIGNsaWVudGVfaWQ6IGNsaWVudGVBdHVhbCA/IGNsaWVudGVBdHVhbC5pZCA6IG51bGwsXG4gICAgICAgIHRlbGVmb25lOiBjbGllbnRlQXR1YWwgPyBjbGllbnRlQXR1YWwudGVsZWZvbmUgOiBudWxsXG4gICAgICB9KSxcbiAgICAgIHNpZ25hbDogY3RybC5zaWduYWxcbiAgICB9KTtcbiAgICBjbGVhclRpbWVvdXQodGlkKTtcbiAgICBpZiAoIXIub2spIHtcbiAgICAgIGNvbnN0IGVyclR4dCA9IGF3YWl0IHIudGV4dCgpLmNhdGNoKCgpID0+ICcnKTtcbiAgICAgIGxvZy5lcnJvcignSU5TRVJUIHBlZGlkbyBmYWxob3UnLCB7IHN0YXR1czogci5zdGF0dXMsIGJvZHk6IGVyclR4dC5zbGljZSgwLCAxMjApIH0pO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdIVFRQICcgKyByLnN0YXR1cyArICcgXHUyMDE0ICcgKyBlcnJUeHQuc2xpY2UoMCwgMTIwKSk7XG4gICAgfVxuICAgIGNvbnN0IGxvYyA9IHIuaGVhZGVycy5nZXQoJ0xvY2F0aW9uJykgPz8gJyc7XG4gICAgY29uc3QgaWRNYXRjaCA9IGxvYy5tYXRjaCgvaWQ9ZXFcXC4oXFxkKykvKTtcbiAgICBpZiAoaWRNYXRjaCkge1xuICAgICAgX3BlZGlkb0lkID0gcGFyc2VJbnQoaWRNYXRjaFsxXSEsIDEwKTtcbiAgICAgIGlmIChidG5GaW4pIGJ0bkZpbi50ZXh0Q29udGVudCA9ICdcdTI3MDUgUGVkaWRvIHJlZ2lzdHJhZG8hJztcbiAgICAgIGlmIChjbGllbnRlQXR1YWwgJiYgY2xpZW50ZUF0dWFsLmlkKSB7XG4gICAgICAgIGNsaWVudGVSZXBvc2l0b3J5LnVwZGF0ZUVuZGVyZWNvKGNsaWVudGVBdHVhbC5pZCwgZW5kZXJlY28pXG4gICAgICAgICAgLmNhdGNoKChlOiB1bmtub3duKSA9PiBsb2cud2FybignTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgc2FsdmFyIGVuZGVyZVx1MDBFN28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChidG5GaW4pIGJ0bkZpbi50ZXh0Q29udGVudCA9ICdcdTI2QTBcdUZFMEYgRXJybyAtIHBlZGlkbyBzXHUwMEYzIG5vIFdoYXRzQXBwJztcbiAgICBsb2cud2FybignRXJybyBhbyBzYWx2YXIgbm8gYmFuY28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7XG4gIH1cblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBpZiAoYnRuRmluKSB7IGJ0bkZpbi5kaXNhYmxlZCA9IGZhbHNlOyBidG5GaW4udGV4dENvbnRlbnQgPSB0eHRPcmlnOyB9XG4gIH0sIDMwMDApO1xuXG4gIGlmICgocGFnYW1lbnRvU2VsZWNpb25hZG8gPT09ICdQaXgnIHx8IHBhZ2FtZW50b1NlbGVjaW9uYWRvID09PSAnQ2FydFx1MDBFM28nKSAmJiBfcGVkaWRvSWQpIHtcbiAgICBjb25zdCBiaWxsaW5nVHlwZSA9IHBhZ2FtZW50b1NlbGVjaW9uYWRvID09PSAnQ2FydFx1MDBFM28nID8gJ0NSRURJVF9DQVJEJyA6ICdQSVgnO1xuICAgIGluaWNpYXJGbHV4b1BpeChfcGVkaWRvSWQsIHRvdGFsLCBub21lLCBtc2csIGJpbGxpbmdUeXBlLCBpdGVuc1ZlcmlmaWNhZG9zLCBlbmRlcmVjbyk7XG4gIH0gZWxzZSB7XG4gICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG1zZyksICdfYmxhbmsnKTtcbiAgICBpZiAoX3BlZGlkb0lkKSB7XG4gICAgICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBlZGlkb0lkUGVuZGVudGU6IF9wZWRpZG9JZCB9KTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3YUNvbmZpcm1CYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY29uZmlybWFyRW52aW9XQSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgaWQgPSBhcHBTdG9yZS5nZXRTdGF0ZSgpLnBlZGlkb0lkUGVuZGVudGU7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy53YUNvbmZpcm0tc2ltJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFpZCkgeyBmZWNoYXJDb25maXJtV0EoKTsgcmV0dXJuOyB9XG4gIGlmICghY2xpZW50ZUF0dWFsIHx8ICFjbGllbnRlQXR1YWwuaWQpIHsgZmVjaGFyQ29uZmlybVdBKCk7IHJldHVybjsgfVxuICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdDb25maXJtYW5kby4uLic7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IH1cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGVkaWRvUmVwb3NpdG9yeS51cGRhdGVTdGF0dXMoaWQsIGNsaWVudGVBdHVhbC5pZCwgJ2NvbmZpcm1hZG8nKTtcbiAgaWYgKHJlc3VsdC5vaykge1xuICAgIGlmIChidG4pIGJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGODkgUGVkaWRvIGNvbmZpcm1hZG8hJztcbiAgICBzZXRUaW1lb3V0KCgpID0+IHsgZmVjaGFyQ29uZmlybVdBKCk7IGxpbXBhckNhcnJpbmhvKCk7IH0sIDE4MDApO1xuICB9IGVsc2Uge1xuICAgIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ1x1MjcwNSBTaW0sIG1lbnNhZ2VtIGVudmlhZGEhJzsgYnRuLmRpc2FibGVkID0gZmFsc2U7IH1cbiAgICBsb2cud2FybignRXJybyBhbyBjb25maXJtYXIgcGVkaWRvJywgeyBlcnJvcjogcmVzdWx0LmVycm9yLm1lc3NhZ2UgfSk7XG4gICAgZmVjaGFyQ29uZmlybVdBKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmVjaGFyQ29uZmlybVdBKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2FDb25maXJtQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGVkaWRvSWRQZW5kZW50ZTogbnVsbCB9KTtcbn1cblxuLy8gPT09PT0gRkxVWE8gUElYID09PT09XG5hc3luYyBmdW5jdGlvbiBpbmljaWFyRmx1eG9QaXgoXG4gIHBlZGlkb0lkOiBudW1iZXIsXG4gIHRvdGFsOiBudW1iZXIsXG4gIG5vbWU6IHN0cmluZyxcbiAgbXNnV0E6IHN0cmluZyxcbiAgYmlsbGluZ1R5cGU6IHN0cmluZyxcbiAgaXRlbnM6IEFycmF5PHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyIH0+LFxuICBlbmRlcmVjbzogc3RyaW5nXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgX3BpeFBlZGlkb0lkID0gcGVkaWRvSWQ7XG4gIF9waXhNc2dXQSA9IG1zZ1dBO1xuICBfcGl4VG90YWwgPSB0b3RhbDtcbiAgX3BpeE5vbWUgPSBub21lO1xuICBfcGl4SXRlbnMgPSBpdGVucyB8fCBbXTtcbiAgX3BpeEVuZGVyZWNvID0gZW5kZXJlY28gfHwgJyc7XG4gIGNvbnN0IGlzUGl4ID0gYmlsbGluZ1R5cGUgIT09ICdDUkVESVRfQ0FSRCc7XG5cbiAgY29uc3QgcGl4VGl0dWxvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeFRpdHVsbycpO1xuICBjb25zdCBwaXhTdWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4U3ViJyk7XG4gIGNvbnN0IHBpeFZhbG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeFZhbG9yJyk7XG4gIGNvbnN0IHNlY2FvUGl4ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlY2FvUGl4Jyk7XG4gIGNvbnN0IHNlY2FvQ2FydGFvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlY2FvQ2FydGFvJyk7XG4gIGNvbnN0IHBpeEphUGFndWVpQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeEphUGFndWVpQnRuJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBjb25zdCBwaXhTdGF0dXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4U3RhdHVzJyk7XG4gIGNvbnN0IHBpeENvZGVCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4Q29kZUJveCcpO1xuICBjb25zdCBwaXhRckltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhRckltZycpIGFzIEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsO1xuXG4gIGlmIChwaXhUaXR1bG8pIHBpeFRpdHVsby50ZXh0Q29udGVudCA9IGlzUGl4ID8gJ1x1RDgzRFx1RENBMCBQYWd1ZSB2aWEgUGl4JyA6ICdcdUQ4M0RcdURDQjMgUGFndWUgY29tIENhcnRcdTAwRTNvJztcbiAgaWYgKHBpeFN1YikgcGl4U3ViLnRleHRDb250ZW50ID0gaXNQaXggPyAnQ29waWUgbyBjXHUwMEYzZGlnbyBvdSBlc2NhbmVpZSBvIFFSIENvZGUnIDogJ0NyXHUwMEU5ZGl0byBvdSBkXHUwMEU5Yml0byBcdTIwMTQgcHJlZW5jaGEgb3MgZGFkb3MgYWJhaXhvJztcbiAgaWYgKHBpeFZhbG9yKSBwaXhWYWxvci50ZXh0Q29udGVudCA9ICdSJCAnICsgdG90YWwudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcbiAgaWYgKHNlY2FvUGl4KSBzZWNhb1BpeC5zdHlsZS5kaXNwbGF5ID0gaXNQaXggPyAnYmxvY2snIDogJ25vbmUnO1xuICBpZiAoc2VjYW9DYXJ0YW8pIHNlY2FvQ2FydGFvLnN0eWxlLmRpc3BsYXkgPSBpc1BpeCA/ICdub25lJyA6ICdibG9jayc7XG4gIGlmIChwaXhKYVBhZ3VlaUJ0bikgcGl4SmFQYWd1ZWlCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgaWYgKHBpeFN0YXR1cykgeyBwaXhTdGF0dXMudGV4dENvbnRlbnQgPSBpc1BpeCA/ICdcdTIzRjMgR2VyYW5kbyBRUiBDb2RlLi4uJyA6ICcnOyBwaXhTdGF0dXMuY2xhc3NOYW1lID0gJ3BpeC1zdGF0dXMnICsgKGlzUGl4ID8gJyBwaXgtYWd1YXJkYW5kbycgOiAnJyk7IH1cbiAgaWYgKHBpeENvZGVCb3gpIHBpeENvZGVCb3gudGV4dENvbnRlbnQgPSAnR2VyYW5kbyBjXHUwMEYzZGlnby4uLic7XG4gIGlmIChwaXhRckltZykgcGl4UXJJbWcuc3JjID0gJyc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhCYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgZmVjaGFyTW9kYWwoKTtcblxuICBpZiAoIWlzUGl4KSByZXR1cm47XG5cbiAgX3BpeENhbmNlbGxlZCA9IGZhbHNlO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKEVER0VfVVJMICsgJy9jcmlhci1waXgnLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwZWRpZG9faWQ6IHBlZGlkb0lkLCB0b3RhbCwgbm9tZSwgYmlsbGluZ190eXBlOiAnUElYJyB9KSxcbiAgICB9KTtcbiAgICBpZiAoIXJlc3Aub2spIHRocm93IG5ldyBFcnJvcignSFRUUCAnICsgcmVzcC5zdGF0dXMpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwLmpzb24oKSBhcyB7IGVycm9yPzogc3RyaW5nOyBxcl9jb2RlPzogc3RyaW5nOyBxcl9jb2RlX2ltYWdlPzogc3RyaW5nIH07XG4gICAgaWYgKGRhdGEuZXJyb3IpIHRocm93IG5ldyBFcnJvcihkYXRhLmVycm9yKTtcblxuICAgIC8vIFJhY2UgY29uZGl0aW9uOiB1c3VcdTAwRTFyaW8gY2FuY2Vsb3UgZW5xdWFudG8gYWd1YXJkXHUwMEUxdmFtb3MgYSBFZGdlIEZ1bmN0aW9uXG4gICAgaWYgKF9waXhDYW5jZWxsZWQpIHJldHVybjtcblxuICAgIF9waXhQYXlsb2FkID0gZGF0YS5xcl9jb2RlIHx8ICcnO1xuICAgIGlmIChwaXhDb2RlQm94KSBwaXhDb2RlQm94LnRleHRDb250ZW50ID0gX3BpeFBheWxvYWQgfHwgJ0NcdTAwRjNkaWdvIGluZGlzcG9uXHUwMEVEdmVsJztcbiAgICBpZiAoZGF0YS5xcl9jb2RlX2ltYWdlICYmIHBpeFFySW1nKSBwaXhRckltZy5zcmMgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LCcgKyBkYXRhLnFyX2NvZGVfaW1hZ2U7XG4gICAgaWYgKHBpeFN0YXR1cykgeyBwaXhTdGF0dXMudGV4dENvbnRlbnQgPSAnXHUyM0YzIEFndWFyZGFuZG8gcGFnYW1lbnRvLi4uJzsgcGl4U3RhdHVzLmNsYXNzTmFtZSA9ICdwaXgtc3RhdHVzIHBpeC1hZ3VhcmRhbmRvJzsgfVxuICAgIC8vIE1vc3RyYXIgYm90XHUwMEUzbyBcIkpcdTAwRTEgUGFndWVpXCIgYXBcdTAwRjNzIDIwcyBcdTIwMTQgZmFsbGJhY2sgc2UgZGV0ZWNcdTAwRTdcdTAwRTNvIGF1dG9tXHUwMEUxdGljYSBmYWxoYXJcbiAgICBpZiAocGl4SmFQYWd1ZWlCdG4pIHtcbiAgICAgIHBpeEphUGFndWVpQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaWYgKCFfcGl4Q2FuY2VsbGVkICYmIHBpeEphUGFndWVpQnRuKSBwaXhKYVBhZ3VlaUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIH0sIDIwXzAwMCk7XG4gICAgfVxuICAgIF9waXhQb2xsVGltZXIgPSBzZXRJbnRlcnZhbCh2ZXJpZmljYXJQYWdhbWVudG9QaXgsIDQwMDApO1xuICAgIC8vIFRpbWVvdXQgZGUgMzAgbWluIFx1MjAxNCBjYW5jZWxhIHBvbGxpbmcgc2UgbmluZ3VcdTAwRTltIHBhZ2FyXG4gICAgX3BpeFBvbGxUaW1lb3V0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmIChfcGl4UG9sbFRpbWVyKSB7IGNsZWFySW50ZXJ2YWwoX3BpeFBvbGxUaW1lcik7IF9waXhQb2xsVGltZXIgPSBudWxsOyB9XG4gICAgICBfcGl4UG9sbFRpbWVvdXRUaW1lciA9IG51bGw7XG4gICAgICBpZiAocGl4U3RhdHVzKSB7IHBpeFN0YXR1cy50ZXh0Q29udGVudCA9ICdcdTIzRjAgVGVtcG8gZXNnb3RhZG8uIEdlcmUgdW0gbm92byBQaXggc2UgcHJlY2lzYXIuJzsgcGl4U3RhdHVzLmNsYXNzTmFtZSA9ICdwaXgtc3RhdHVzJzsgfVxuICAgICAgaWYgKHBpeEphUGFndWVpQnRuKSBwaXhKYVBhZ3VlaUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICB9LCAzMCAqIDYwICogMTAwMCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2cud2FybignRXJybyBhbyBjcmlhciBQaXgnLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7XG4gICAgaWYgKHBpeENvZGVCb3gpIHBpeENvZGVCb3gudGV4dENvbnRlbnQgPSAnRXJybyBhbyBnZXJhciBjXHUwMEYzZGlnby4nO1xuICAgIGlmIChwaXhTdGF0dXMpIHsgcGl4U3RhdHVzLnRleHRDb250ZW50ID0gJ1x1MjZBMFx1RkUwRiBFcnJvIGFvIGdlcmFyIFFSIENvZGUuIFRlbnRlIG91dHJhIGZvcm1hIGRlIHBhZ2FtZW50by4nOyBwaXhTdGF0dXMuY2xhc3NOYW1lID0gJ3BpeC1zdGF0dXMnOyB9XG4gICAgaWYgKHBpeEphUGFndWVpQnRuKSBwaXhKYVBhZ3VlaUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgfVxufVxuXG5mdW5jdGlvbiBzZWxlY2lvbmFyVGlwb0NhcnRhbyh0aXBvOiBzdHJpbmcpOiB2b2lkIHtcbiAgX2NhcmRUaXBvID0gdGlwbztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkNyZWRpdG8nKT8uY2xhc3NMaXN0LnRvZ2dsZSgnYXRpdm8nLCB0aXBvID09PSAnY3JlZGl0bycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuRGViaXRvJyk/LmNsYXNzTGlzdC50b2dnbGUoJ2F0aXZvJywgdGlwbyA9PT0gJ2RlYml0bycpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRhckNhcnRhbyhlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICBsZXQgdiA9IGVsLnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJykuc3Vic3RyaW5nKDAsIDE2KTtcbiAgZWwudmFsdWUgPSB2LnJlcGxhY2UoLyguezR9KSg/PS4pL2csICckMSAnKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0YXJDcGYoZWw6IEhUTUxJbnB1dEVsZW1lbnQpOiB2b2lkIHtcbiAgbGV0IHYgPSBlbC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpLnN1YnN0cmluZygwLCAxMSk7XG4gIHYgPSB2LnJlcGxhY2UoLyhcXGR7M30pKFxcZCkvLCAnJDEuJDInKTtcbiAgdiA9IHYucmVwbGFjZSgvKFxcZHszfSlcXC4oXFxkezN9KShcXGQpLywgJyQxLiQyLiQzJyk7XG4gIHYgPSB2LnJlcGxhY2UoLyhcXGR7M30pXFwuKFxcZHszfSlcXC4oXFxkezN9KShcXGR7MSwyfSkkLywgJyQxLiQyLiQzLSQ0Jyk7XG4gIGVsLnZhbHVlID0gdjtcbn1cblxuZnVuY3Rpb24gZm9ybWF0YXJWYWxpZGFkZShlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICBsZXQgdiA9IGVsLnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJykuc3Vic3RyaW5nKDAsIDQpO1xuICBpZiAodi5sZW5ndGggPj0gMykgdiA9IHYuc3Vic3RyaW5nKDAsIDIpICsgJy8nICsgdi5zdWJzdHJpbmcoMik7XG4gIGVsLnZhbHVlID0gdjtcbn1cblxuZnVuY3Rpb24gZm9ybWF0YXJDZXAoZWw6IEhUTUxJbnB1dEVsZW1lbnQpOiB2b2lkIHtcbiAgbGV0IHYgPSBlbC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpLnN1YnN0cmluZygwLCA4KTtcbiAgaWYgKHYubGVuZ3RoID4gNSkgdiA9IHYuc3Vic3RyaW5nKDAsIDUpICsgJy0nICsgdi5zdWJzdHJpbmcoNSk7XG4gIGVsLnZhbHVlID0gdjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcGFnYXJDYXJ0YW8oKTogUHJvbWlzZTx2b2lkPiB7XG4gIG1vc3RyYXJUb2FzdCgnXHVEODNEXHVEQ0IzIFBhZ2FtZW50byBwb3IgY2FydFx1MDBFM28gZW0gYnJldmUhIFVzZSBvIFBpeCBwb3IgZW5xdWFudG8uJywgJ2luZm8nKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyUGFnYW1lbnRvUGl4KCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIV9waXhQZWRpZG9JZCB8fCBfcGl4Q2FuY2VsbGVkKSByZXR1cm47XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBlZGlkb1JlcG9zaXRvcnkuZmluZEJ5SWQoX3BpeFBlZGlkb0lkKTtcbiAgaWYgKHJlc3VsdC5vayAmJiByZXN1bHQudmFsdWUpIHtcbiAgICBjb25zdCBzdGF0dXNQYWcgPSByZXN1bHQudmFsdWUuc3RhdHVzUGFnYW1lbnRvO1xuICAgIGlmIChzdGF0dXNQYWcgPT09ICdwYWdvJykge1xuICAgICAgaWYgKF9waXhQb2xsVGltZXIpIHsgY2xlYXJJbnRlcnZhbChfcGl4UG9sbFRpbWVyKTsgX3BpeFBvbGxUaW1lciA9IG51bGw7IH1cbiAgICAgIG1vc3RyYXJSZWNpYm9QaXgoKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbG9nLndhcm4oJ0Vycm8gYW8gdmVyaWZpY2FyIHBhZ2FtZW50bycsIHsgZXJyb3I6IHJlc3VsdC5vayA/ICdub3QgZm91bmQnIDogcmVzdWx0LmVycm9yLm1lc3NhZ2UgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbW9zdHJhclJlY2lib1BpeCgpOiB2b2lkIHtcbiAgY29uc3QgbGluaGFzSXRlbnMgPSBfcGl4SXRlbnMubWFwKGkgPT5cbiAgICAnPGRpdiBjbGFzcz1cInJlY2liby1pdGVtXCI+PHNwYW4+JyArIGVzY0hUTUwoaS5ub21lKSArICc8L3NwYW4+PHNwYW4+UiQgJyArIE51bWJlcihpLnByZWNvKS50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpICsgJzwvc3Bhbj48L2Rpdj4nXG4gICkuam9pbignJyk7XG4gIGNvbnN0IHBpeEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5waXgtYm94Jyk7XG4gIGlmIChwaXhCb3gpIHtcbiAgICBwaXhCb3guaW5uZXJIVE1MID1cbiAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjUycHg7bWFyZ2luLWJvdHRvbTo4cHhcIj5cdTI3MDU8L2Rpdj4nICtcbiAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjIwcHg7Zm9udC13ZWlnaHQ6NzAwO2NvbG9yOiMxNjY1MzQ7bWFyZ2luLWJvdHRvbTo0cHhcIj5QYWdhbWVudG8gcmVjZWJpZG8hPC9kaXY+JyArXG4gICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxM3B4O2NvbG9yOiM2QjVCNTI7bWFyZ2luLWJvdHRvbToxNnB4XCI+U2V1IHBlZGlkbyBmb2kgY29uZmlybWFkbyBjb20gc3VjZXNzbzwvZGl2PicgK1xuICAgICAgJzxkaXYgc3R5bGU9XCJiYWNrZ3JvdW5kOiNmMGZkZjQ7Ym9yZGVyOjEuNXB4IHNvbGlkICNiYmY3ZDA7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6MTRweDt0ZXh0LWFsaWduOmxlZnQ7bWFyZ2luLWJvdHRvbToxNHB4XCI+JyArXG4gICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxMXB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojMTY2NTM0O21hcmdpbi1ib3R0b206OHB4O3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtsZXR0ZXItc3BhY2luZzouNXB4XCI+XHVEODNEXHVEQ0NCIFJlc3VtbyBkbyBwZWRpZG88L2Rpdj4nICtcbiAgICAgIGxpbmhhc0l0ZW5zICtcbiAgICAgICc8ZGl2IHN0eWxlPVwiYm9yZGVyLXRvcDoxcHggc29saWQgI2JiZjdkMDttYXJnaW4tdG9wOjhweDtwYWRkaW5nLXRvcDo4cHg7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2ZvbnQtd2VpZ2h0OjcwMDtmb250LXNpemU6MTRweFwiPicgK1xuICAgICAgJzxzcGFuPlRvdGFsPC9zcGFuPjxzcGFuIHN0eWxlPVwiY29sb3I6I0U4NTI4QVwiPlIkICcgKyBOdW1iZXIoX3BpeFRvdGFsKS50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpICsgJzwvc3Bhbj4nICtcbiAgICAgICc8L2Rpdj4nICtcbiAgICAgICc8ZGl2IHN0eWxlPVwibWFyZ2luLXRvcDo4cHg7Zm9udC1zaXplOjExcHg7Y29sb3I6IzRiN2M1ZVwiPlx1RDgzRFx1RENDRCAnICsgZXNjSFRNTChfcGl4RW5kZXJlY28pICsgJzwvZGl2PicgK1xuICAgICAgJzwvZGl2PicgK1xuICAgICAgJzxidXR0b24gb25jbGljaz1cImZlY2hhclJlY2lib1BpeCgpXCIgc3R5bGU9XCJ3aWR0aDoxMDAlO3BhZGRpbmc6MTNweDtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxMzVkZWcsI0U4NTI4QSwjQzIzQTZFKTtjb2xvcjojZmZmO2ZvbnQtd2VpZ2h0OjcwMDtmb250LXNpemU6MTVweDtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjEycHg7Y3Vyc29yOnBvaW50ZXI7Zm9udC1mYW1pbHk6aW5oZXJpdFwiPlx1RDgzRFx1RENBQyBWZXIgcGVkaWRvIG5vIFdoYXRzQXBwPC9idXR0b24+JztcbiAgfVxufVxuXG5mdW5jdGlvbiBmZWNoYXJSZWNpYm9QaXgoKTogdm9pZCB7XG4gIGNvbnN0IG1zZ1dBID0gX3BpeE1zZ1dBO1xuICBfcGl4Q2FuY2VsbGVkID0gdHJ1ZTtcbiAgaWYgKF9waXhQb2xsVGltZXIpIHsgY2xlYXJJbnRlcnZhbChfcGl4UG9sbFRpbWVyKTsgX3BpeFBvbGxUaW1lciA9IG51bGw7IH1cbiAgaWYgKF9waXhQb2xsVGltZW91dFRpbWVyKSB7IGNsZWFyVGltZW91dChfcGl4UG9sbFRpbWVvdXRUaW1lcik7IF9waXhQb2xsVGltZW91dFRpbWVyID0gbnVsbDsgfVxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4QmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIGxpbXBhckNhcnJpbmhvKCk7XG4gIF9waXhQZWRpZG9JZCA9IG51bGw7IF9waXhQYXlsb2FkID0gJyc7IF9waXhNc2dXQSA9ICcnOyBfcGl4VG90YWwgPSAwOyBfcGl4Tm9tZSA9ICcnO1xuICBfcGl4SXRlbnMgPSBbXTsgX3BpeEVuZGVyZWNvID0gJyc7XG4gIGlmIChtc2dXQSkgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG1zZ1dBKSwgJ19ibGFuaycpO1xufVxuXG5mdW5jdGlvbiBjb3BpYXJQaXgoKTogdm9pZCB7XG4gIGlmICghX3BpeFBheWxvYWQpIHJldHVybjtcbiAgaWYgKG5hdmlnYXRvci5jbGlwYm9hcmQpIHtcbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChfcGl4UGF5bG9hZCkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGl4LWNvcHktYnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICAgICAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnXHUyNzA1IENcdTAwRjNkaWdvIGNvcGlhZG8hJzsgc2V0VGltZW91dCgoKSA9PiB7IGJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0RcdURDQ0IgQ29waWFyIGNoYXZlIFBpeCc7IH0sIDI1MDApOyB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgIHRhLnZhbHVlID0gX3BpeFBheWxvYWQ7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0YSk7XG4gICAgdGEuc2VsZWN0KCk7XG4gICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRhKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYW5jZWxhclBpeCgpOiB2b2lkIHtcbiAgX3BpeENhbmNlbGxlZCA9IHRydWU7XG4gIGlmIChfcGl4UG9sbFRpbWVyKSB7IGNsZWFySW50ZXJ2YWwoX3BpeFBvbGxUaW1lcik7IF9waXhQb2xsVGltZXIgPSBudWxsOyB9XG4gIGlmIChfcGl4UG9sbFRpbWVvdXRUaW1lcikgeyBjbGVhclRpbWVvdXQoX3BpeFBvbGxUaW1lb3V0VGltZXIpOyBfcGl4UG9sbFRpbWVvdXRUaW1lciA9IG51bGw7IH1cbiAgY29uc3QgZXN0YUFiZXJ0byA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhCYWNrZHJvcCcpPy5jbGFzc0xpc3QuY29udGFpbnMoJ2FiZXJ0bycpID8/IGZhbHNlO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4QmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIF9waXhQZWRpZG9JZCA9IG51bGw7IF9waXhQYXlsb2FkID0gJyc7IF9waXhNc2dXQSA9ICcnOyBfcGl4VG90YWwgPSAwOyBfcGl4Tm9tZSA9ICcnO1xuICBfcGl4SXRlbnMgPSBbXTsgX3BpeEVuZGVyZWNvID0gJyc7XG4gIGlmIChlc3RhQWJlcnRvKSBhYnJpck1vZGFsKCk7XG59XG5cbmZ1bmN0aW9uIHBpeEphUGFndWVpKCk6IHZvaWQge1xuICBjYW5jZWxhclBpeCgpO1xuICBmaW5hbGl6YXJQZWRpZG9XaGF0c0FwcCgpO1xufVxuXG5mdW5jdGlvbiBmaW5hbGl6YXJQZWRpZG9XaGF0c0FwcCgpOiB2b2lkIHtcbiAgY29uc3QgaXRlbnMgPSBjYXJ0U2VydmljZS5nZXRJdGVtcygpO1xuICBpZiAoaXRlbnMubGVuZ3RoID09PSAwKSB7IG1vc3RyYXJUb2FzdCgnQ2FycmluaG8gdmF6aW8nLCAnZXJybycpOyByZXR1cm47IH1cbiAgY29uc3Qgbm9tZSA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XG4gIGNvbnN0IGVuZGVyZWNvID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBFbmRlcmVjbycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XG4gIGNvbnN0IHRvdGFsID0gQXJyYXkuZnJvbShpdGVucykucmVkdWNlKChzLCBpKSA9PiBzICsgaS5wcmVjbywgMCk7XG4gIGNvbnN0IGxpbmhhcyA9IEFycmF5LmZyb20oaXRlbnMpLm1hcChpID0+IGBcdTI1QjggJHtpLm5vbWV9IFx1MjAxNCBSJCAke2kucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX0gYCkuam9pbignXFxuJyk7XG4gIGNvbnN0IG1zZyA9IGBcdUQ4M0RcdURFRDIgKlBFRElETyBHRUxBTU9VUiogKFBpeCBlbnZpYWRvIG1hbnVhbG1lbnRlKVxcblxcbiR7bGluaGFzfVxcblxcbipUb3RhbDogUiQgJHt0b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfSpcXG5cXG5cdUQ4M0RcdURDNjQgJHtub21lfVxcblx1RDgzRFx1RENDRCAke2VuZGVyZWNvfVxcblxcbl9Db25maXJtYW5kbyBlbnZpbyBkbyBwYWdhbWVudG8gUGl4Ll9gO1xuICB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQobXNnKSwgJ19ibGFuaycpO1xufVxuXG4vLyA9PT09PSBMT0dJTiBVSSA9PT09PVxuZnVuY3Rpb24gbWFzY2FyYVRlbGVmb25lKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGVsLnZhbHVlID0gYXBsaWNhck1hc2NhcmFUZWxlZm9uZShlbC52YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGVudHJhckNvbUNsaWVudGUoY2xpZW50ZVJhdzogQ2xpZW50ZSk6IHZvaWQge1xuICBjb25zdCBkb21haW5DbGllbnRlID0gQ2xpZW50ZUVudGl0eS5mcm9tREIoY2xpZW50ZVJhdyk7XG4gIGxvZ2luVXNlQ2FzZS5sb2dpbihkb21haW5DbGllbnRlKTtcblxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5PdmVybGF5JykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGNvbnN0IHVzdWFyaW9CYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb0JhcicpO1xuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4JztcbiAgY29uc3QgdXN1YXJpb05vbWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvTm9tZScpO1xuICBpZiAodXN1YXJpb05vbWVFbCkgdXN1YXJpb05vbWVFbC50ZXh0Q29udGVudCA9IGNsaWVudGVSYXcubm9tZTtcbiAgY29uc3Qgcm9sZXRhQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkZsdXR1YW50ZScpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKHJvbGV0YUJ0bikgcm9sZXRhQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gIGNvbnN0IHVzdWFyaW9UZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb1RlbCcpO1xuICBpZiAodXN1YXJpb1RlbCkgdXN1YXJpb1RlbC50ZXh0Q29udGVudCA9IGNsaWVudGVSYXcudGVsZWZvbmUucmVwbGFjZSgvXihcXGR7Mn0pKFxcZHs1fSkoXFxkezR9KSQvLCAnKCQxKSAkMi0kMycpO1xuICBjb25zdCBpbnBOb21lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGlucE5vbWUpIGlucE5vbWUudmFsdWUgPSBjbGllbnRlUmF3Lm5vbWU7XG4gIGNvbnN0IGlucEVuZGVyZWNvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGw7XG4gIGlmIChpbnBFbmRlcmVjbyAmJiBjbGllbnRlUmF3LmVuZGVyZWNvKSBpbnBFbmRlcmVjby52YWx1ZSA9IGNsaWVudGVSYXcuZW5kZXJlY287XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhclRlbGVmb25lKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoX3ZlcmlmaWNhbmRvKSByZXR1cm47XG4gIGNvbnN0IHRlbElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCBlcnJvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luRXJybycpO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZXRhcGFUZWxlZm9uZSBidXR0b24nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGlmIChlcnJvKSBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ1ZlcmlmaWNhbmRvLi4uJzsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgfVxuICBfdmVyaWZpY2FuZG8gPSB0cnVlO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxvZ2luVXNlQ2FzZS5leGVjdXRlKHRlbElucHV0LnZhbHVlKTtcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgY29uc3QgbXNnID0gcmVzdWx0LmVycm9yLm5hbWUgPT09ICdOZXR3b3JrRXJyb3InXG4gICAgICAgID8gJ1NlbSBjb25leFx1MDBFM28uIFZlcmlmaXF1ZSBzdWEgaW50ZXJuZXQgZSB0ZW50ZSBub3ZhbWVudGUuJ1xuICAgICAgICA6IHJlc3VsdC5lcnJvci5tZXNzYWdlO1xuICAgICAgbG9nLmVycm9yKCd2ZXJpZmljYXJUZWxlZm9uZSBmYWxob3UnLCB7IGVycm9yOiByZXN1bHQuZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSBtc2c7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC52YWx1ZS5leGlzdGUgJiYgcmVzdWx0LnZhbHVlLmNsaWVudGUpIHtcbiAgICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLmNsaWVudGUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGV0YXBhVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhVGVsZWZvbmUnKTtcbiAgICAgIGNvbnN0IGV0YXBhQ2FkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhQ2FkYXN0cm8nKTtcbiAgICAgIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGlmIChldGFwYUNhZCkgZXRhcGFDYWQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAodGVsSW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCAmIHsgZGF0YXNldDogRE9NU3RyaW5nTWFwIH0pLmRhdGFzZXRbJ3RlbCddID0gdGVsSW5wdXQudmFsdWUucmVwbGFjZSgvXFxEL2csICcnKTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk5vbWUnKT8uZm9jdXMoKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSAnU2VtIGNvbmV4XHUwMEUzbyBvdSBlcnJvIG5vIHNlcnZpZG9yLiBUZW50ZSBub3ZhbWVudGUuJzsgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgfVxuICB9IGZpbmFsbHkge1xuICAgIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ0NvbnRpbnVhciBcdTIxOTInOyBidG4uZGlzYWJsZWQgPSBmYWxzZTsgfVxuICAgIF92ZXJpZmljYW5kbyA9IGZhbHNlO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhZGFzdHJhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKF9jYWRhc3RyYW5kbykgcmV0dXJuO1xuICBjb25zdCBub21lSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5Ob21lJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgY29uc3QgdGVsSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IG5vbWUgPSBub21lSW5wdXQudmFsdWU7XG4gIGNvbnN0IHRlbCA9ICh0ZWxJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50ICYgeyBkYXRhc2V0OiBET01TdHJpbmdNYXAgfSkuZGF0YXNldFsndGVsJ10gPz8gJyc7XG4gIGNvbnN0IGVycm8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FkYXN0cm9FcnJvJyk7XG4gIGlmICghbm9tZS50cmltKCkpIHtcbiAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ0RpZ2l0ZSBzZXUgbm9tZS4nOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChlcnJvKSBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNldGFwYUNhZGFzdHJvIGJ1dHRvbicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnRW50cmFuZG8uLi4nOyBidG4uZGlzYWJsZWQgPSB0cnVlOyB9XG4gIF9jYWRhc3RyYW5kbyA9IHRydWU7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLnJlZ2lzdGVyKG5vbWUsIHRlbCwgJycpO1xuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gcmVzdWx0LmVycm9yLm1lc3NhZ2U7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW50cmFyQ29tQ2xpZW50ZShyZXN1bHQudmFsdWUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gIH0gY2F0Y2gge1xuICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSAnRXJybyBhbyBjYWRhc3RyYXIuIFZlcmlmaXF1ZSBzdWEgY29uZXhcdTAwRTNvIGUgdGVudGUgbm92YW1lbnRlLic7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdFbnRyYXIgbm8gY2FyZFx1MDBFMXBpbyBcdTI3MjgnOyBidG4uZGlzYWJsZWQgPSBmYWxzZTsgfVxuICAgIF9jYWRhc3RyYW5kbyA9IGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZvbHRhckV0YXBhVGVsZWZvbmUoKTogdm9pZCB7XG4gIGNvbnN0IGV0YXBhQ2FkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhQ2FkYXN0cm8nKTtcbiAgY29uc3QgZXRhcGFUZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFUZWxlZm9uZScpO1xuICBpZiAoZXRhcGFDYWQpIGV0YXBhQ2FkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG59XG5cbmZ1bmN0aW9uIHNhaXIoKTogdm9pZCB7XG4gIGlmICghY29uZmlybSgnRGVzZWphIHNhaXIgZGEgc3VhIGNvbnRhPycpKSByZXR1cm47XG4gIGxvZ2luVXNlQ2FzZS5sb2dvdXQoKTtcbiAgY29uc3QgdXN1YXJpb0JhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvQmFyJyk7XG4gIGlmICh1c3VhcmlvQmFyKSB1c3VhcmlvQmFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlID0gJyc7XG4gIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZSA9ICcnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9ICcnO1xuICBjb25zdCBldGFwYVRlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYVRlbGVmb25lJyk7XG4gIGNvbnN0IGV0YXBhQ2FkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhQ2FkYXN0cm8nKTtcbiAgaWYgKGV0YXBhVGVsKSBldGFwYVRlbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgaWYgKGV0YXBhQ2FkKSBldGFwYUNhZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5PdmVybGF5JykhLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG59XG5cbmZ1bmN0aW9uIG1vc3RyYXJMb2dpbigpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luT3ZlcmxheScpIS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICBzZXRUaW1lb3V0KCgpID0+IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpPy5mb2N1cygpLCAzMDApO1xufVxuXG4vLyA9PT09PSBST0xFVEEgVUkgPT09PT1cbmFzeW5jIGZ1bmN0aW9uIGFicmlyUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBiZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCYWNrZHJvcCcpO1xuICBpZiAoIWJkKSByZXR1cm47XG4gIGJkLmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLWFiZXJ0bycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhU3RhdHVzQm94JykhLmlubmVySFRNTCA9ICcnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5hdGl2YScpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhTmFvTG9nYWRvJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQnRuRW52aWFyV3JhcCcpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVdoZWVsU2VjdGlvbicpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSmFHaXJvdScpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhUmVzdWx0YWRvJykhLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2l2ZWwnKTtcblxuICBjb25zdCBjZmcgPSBhd2FpdCBjYXJyZWdhckNvbmZpZ1JvbGV0YSgpO1xuICBjb25zdCBwcmVtaW9zID0gZ2V0UHJlbWlvcygpO1xuXG4gIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhUHJlbWlvc0dyaWQnKTtcbiAgaWYgKGdyaWQpIHtcbiAgICBjb25zdCBpY29uZXMgPSBbJ1x1RDgzQ1x1REY2QicsICdcdUQ4M0VcdUREQzEnLCAnXHVEODNEXHVERTlBJywgJ1x1RDgzRFx1RENCOCcsICdcdUQ4M0RcdURDQjAnLCAnXHVEODNDXHVERjg5JywgJ1x1RDgzQ1x1REY2RScsICdcdUQ4M0NcdURGODAnLCAnXHVEODNDXHVERjFGJ107XG4gICAgZ3JpZC5pbm5lckhUTUwgPSBwcmVtaW9zLm1hcCgocCwgaSkgPT4gYDxkaXYgY2xhc3M9XCJyb2xldGEtcHJlbWlvLWl0ZW1cIj4ke2ljb25lc1tpICUgaWNvbmVzLmxlbmd0aF19ICR7ZXNjSFRNTChwKX08L2Rpdj5gKS5qb2luKCcnKTtcbiAgfVxuXG4gIGlmIChjZmcgJiYgIWNmZy5hdGl2YSkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbmF0aXZhJykhLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIH1cblxuICBkZXNlbmhhclJvbGV0YShwcmVtaW9zKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVdoZWVsU2VjdGlvbicpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhTmFvTG9nYWRvJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluc3RydWNvZXMnKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBjb25zdCBnaXJhckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSBmYWxzZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcxJzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERkExIEdJUkFSIEFHT1JBISc7IH1cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGF0dXMgPSBhd2FpdCB2ZXJpZmljYXJTdGF0dXNSb2xldGEoY2xpZW50ZUF0dWFsLmlkID8/IDApO1xuICBhdHVhbGl6YXJVSVJvbGV0YShzdGF0dXMpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJSb2xldGEoKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdtb2RhbC1hYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdyb2xldGFCYWNrZHJvcCcpIGZlY2hhclJvbGV0YSgpO1xufVxuXG5mdW5jdGlvbiBhdHVhbGl6YXJVSVJvbGV0YShpbmZvOiBQYXJ0aWNpcGFjYW8gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHN0YXR1c0JveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFTdGF0dXNCb3gnKSE7XG4gIGNvbnN0IGluc3RydWNvZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdHJ1Y29lcycpITtcbiAgY29uc3QgYnRuRW52aWFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkVudmlhcldyYXAnKSE7XG4gIGNvbnN0IHdoZWVsU2VjdGlvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFXaGVlbFNlY3Rpb24nKSE7XG4gIGNvbnN0IGphR2lyb3UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSmFHaXJvdScpITtcbiAgY29uc3QgZ2lyYXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuXG4gIHdoZWVsU2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgZGVzZW5oYXJSb2xldGEoZ2V0UHJlbWlvcygpKTtcblxuICBpZiAoaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHtcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSBmYWxzZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcxJzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERkExIEdJUkFSIEFHT1JBISc7IH1cbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJyc7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIWluZm8pIHtcbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJyc7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgZ2lyYXJCdG4udGl0bGUgPSAnRW52aWUgc3VhcyBwcm92YXMgcGFyYSBsaWJlcmFyIGEgcm9sZXRhJzsgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChpbmZvLnN0YXR1cyA9PT0gJ3BlbmRlbnRlJykge1xuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1zdGF0dXMtYm94IHJvbGV0YS1zdGF0dXMtcGVuZGVudGVcIj5cdTIzRjMgPGRpdj48c3Ryb25nPlBhcnRpY2lwYVx1MDBFN1x1MDBFM28gZW52aWFkYSE8L3N0cm9uZz48YnI+U3VhcyBwcm92YXMgZXN0XHUwMEUzbyBlbSBhblx1MDBFMWxpc2UuIEFndWFyZGUgYSBhcHJvdmFcdTAwRTdcdTAwRTNvIChhdFx1MDBFOSAyNGgpLjwvZGl2PjwvZGl2Pic7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IGdpcmFyQnRuLnRpdGxlID0gJ0FndWFyZGFuZG8gYXByb3ZhXHUwMEU3XHUwMEUzbyc7IH1cbiAgfSBlbHNlIGlmIChpbmZvLnN0YXR1cyA9PT0gJ3JlamVpdGFkbycpIHtcbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtc3RhdHVzLWJveCByb2xldGEtc3RhdHVzLXJlamVpdGFkb1wiPlx1Mjc0QyA8ZGl2PjxzdHJvbmc+UGFydGljaXBhXHUwMEU3XHUwMEUzbyBuXHUwMEUzbyBhcHJvdmFkYS48L3N0cm9uZz48YnI+VGVudGUgbm92YW1lbnRlIGN1bXByaW5kbyB0b2RvcyBvcyByZXF1aXNpdG9zLjwvZGl2PjwvZGl2Pic7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gdHJ1ZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyB9XG4gIH0gZWxzZSBpZiAoaW5mby5zdGF0dXMgPT09ICdhcHJvdmFkbycgJiYgIWluZm8uamFfZ2lyb3UpIHtcbiAgICBjb25zdCBob2plID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XG4gICAgY29uc3QgZGlhQXByb3ZhY2FvID0gaW5mby5kYXRhX2Fwcm92YWNhbyA/IGluZm8uZGF0YV9hcHJvdmFjYW8uc3BsaXQoJ1QnKVswXSA6IG51bGw7XG4gICAgaWYgKGRpYUFwcm92YWNhbyAhPT0gaG9qZSkge1xuICAgICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1yZWplaXRhZG9cIj5cdTIzRjAgPGRpdj48c3Ryb25nPlByYXpvIGV4cGlyYWRvLjwvc3Ryb25nPjxicj5Wb2NcdTAwRUEgZm9pIGFwcm92YWRvIGVtIG91dHJvIGRpYSBlIG5cdTAwRTNvIGdpcm91IGEgdGVtcG8uIEVudmllIG5vdmFzIHByb3ZhcyBwYXJhIHBhcnRpY2lwYXIgbm92YW1lbnRlLjwvZGl2PjwvZGl2Pic7XG4gICAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gdHJ1ZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyBnaXJhckJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0RcdUREMTIgUHJhem8gZXhwaXJhZG8nOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1zdGF0dXMtYm94IHJvbGV0YS1zdGF0dXMtYXByb3ZhZG9cIj5cdTI3MDUgPGRpdj48c3Ryb25nPkFwcm92YWRvISBHaXJlIGhvamUhPC9zdHJvbmc+PGJyPlZvY1x1MDBFQSB0ZW0gYXRcdTAwRTkgbWVpYS1ub2l0ZSBwYXJhIHVzYXIgc2V1IGdpcm8uIE5cdTAwRTNvIGFjdW11bGEhPC9kaXY+PC9kaXY+JztcbiAgICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzEnOyBnaXJhckJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGQTEgR0lSQVIgQUdPUkEhJzsgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChpbmZvLmphX2dpcm91ICYmICFpc0NvbnRhVGVzdGUoYXBwU3RvcmUuZ2V0U3RhdGUoKS5jbGllbnRlKSkge1xuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnJztcbiAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgfVxuICAgIGNvbnN0IHByZW1pb0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3VQcmVtaW8nKTtcbiAgICBpZiAocHJlbWlvRWwpIHtcbiAgICAgIHByZW1pb0VsLmlubmVySFRNTCA9IGluZm8ucHJlbWlvXG4gICAgICAgID8gJ1NldSBwclx1MDBFQW1pbyBmb2k6IDxzdHJvbmcgc3R5bGU9XCJjb2xvcjp2YXIoLS1yb3NhKVwiPicgKyBlc2NIVE1MKGluZm8ucHJlbWlvKSArICc8L3N0cm9uZz4uIEVudHJlIGVtIGNvbnRhdG8gY29ub3NjbyBwYXJhIHJlc2dhdGFyISdcbiAgICAgICAgOiAnVm9jXHUwMEVBIGpcdTAwRTEgdXNvdSBzdWEgY2hhbmNlIG5lc3RhIGNhbXBhbmhhLic7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdpcmFyUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHsgbW9zdHJhclRvYXN0KCdGYVx1MDBFN2EgbG9naW4gcGFyYSBnaXJhciBhIHJvbGV0YSEnLCAnZXJybycpOyByZXR1cm47IH1cblxuICBjb25zdCBzdGF0dXNHaXJvID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgaWYgKCFpc0NvbnRhVGVzdGUoYXBwU3RvcmUuZ2V0U3RhdGUoKS5jbGllbnRlKSkge1xuICAgIGlmICghc3RhdHVzR2lybyB8fCBzdGF0dXNHaXJvLnN0YXR1cyAhPT0gJ2Fwcm92YWRvJyB8fCBzdGF0dXNHaXJvLmphX2dpcm91KSB7XG4gICAgICBtb3N0cmFyVG9hc3QoJ1ZvY1x1MDBFQSBwcmVjaXNhIHNlciBhcHJvdmFkbyBwZWxhIGVxdWlwZSBhbnRlcyBkZSBnaXJhciEnLCAnZXJybycpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcbiAgICAgIGNvbnN0IGNvdW50UmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5jb3VudFZlbmNlZG9yZXNTZW1hbmEoc2VtYW5hKTtcbiAgICAgIGNvbnN0IHZlbmNlZG9yZXNDb3VudCA9IGNvdW50UmVzdWx0Lm9rID8gY291bnRSZXN1bHQudmFsdWUgOiAwO1xuXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goYCR7U1VQQUJBU0VfVVJMfS9yZXN0L3YxL3JvbGV0YV9jb25maWc/aWQ9ZXEuMSZzZWxlY3Q9bWF4X3ZlbmNlZG9yZXNfc2VtYW5hYCwge1xuICAgICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxuICAgICAgfSk7XG4gICAgICBjb25zdCBjZmcgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBBcnJheTx7IG1heF92ZW5jZWRvcmVzX3NlbWFuYTogbnVtYmVyIH0+O1xuICAgICAgY29uc3QgbGltaXRlID0gY2ZnWzBdPy5tYXhfdmVuY2Vkb3Jlc19zZW1hbmEgPz8gMTtcbiAgICAgIGlmICh2ZW5jZWRvcmVzQ291bnQgPj0gbGltaXRlKSB7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgICAgICAgaWYgKGJ0bikgeyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyB9XG4gICAgICAgIGNvbnN0IHJlc3VsdEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJlc3VsdGFkbycpO1xuICAgICAgICBpZiAocmVzdWx0RWwpIHtcbiAgICAgICAgICByZXN1bHRFbC5pbm5lckhUTUwgPSAnXHUyNkEwXHVGRTBGIDxzdHJvbmc+Slx1MDBFMSB0ZW1vcyB1bSBnYW5oYWRvciBlc3RhIHNlbWFuYSE8L3N0cm9uZz48YnI+PHNtYWxsPkEgcHJcdTAwRjN4aW1hIHJvZGFkYSBjb21lXHUwMEU3YSBuYSBzZW1hbmEgcXVlIHZlbS4gRmlxdWUgZGUgb2xobyE8L3NtYWxsPic7XG4gICAgICAgICAgcmVzdWx0RWwuY2xhc3NMaXN0LmFkZCgndmlzaXZlbCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7IGxvZy53YXJuKCdFcnJvIGFvIHZlcmlmaWNhciBsaW1pdGUgc2VtYW5hbCcsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTsgfVxuICB9XG5cbiAgYXdhaXQgZ2lyYXJSb2xldGFGbihjbGllbnRlQXR1YWwsIChwcmVtaW86IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHJlc3VsdEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJlc3VsdGFkbycpO1xuICAgIGlmIChyZXN1bHRFbCkge1xuICAgICAgcmVzdWx0RWwuaW5uZXJIVE1MID0gJ1x1RDgzQ1x1REY4OSBWb2NcdTAwRUEgZ2FuaG91OiA8c3Ryb25nIHN0eWxlPVwiY29sb3I6dmFyKC0tcm9zYSlcIj4nICsgZXNjSFRNTChwcmVtaW8pICsgJzwvc3Ryb25nPiE8YnI+PHNtYWxsIHN0eWxlPVwiZm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tdGV4dG8tc2VjKVwiPkVudHJlIGVtIGNvbnRhdG8gY29ub3NjbyBwZWxvIFdoYXRzQXBwIHBhcmEgcmVzZ2F0YXIgc2V1IHByXHUwMEVBbWlvITwvc21hbGw+JztcbiAgICAgIHJlc3VsdEVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2l2ZWwnKTtcbiAgICB9XG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUdpcmFyQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICAgIGlmIChidG4pIGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTMgR2lyYWRvISc7XG4gICAgc2FsdmFyVmVuY2Vkb3IoY2xpZW50ZUF0dWFsLCBwcmVtaW8pLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW52aWFyUHJvdmFzV2hhdHNBcHAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuICBpZiAoIWNsaWVudGVBdHVhbCkgeyBhbGVydCgnRmFcdTAwRTdhIGxvZ2luIGFudGVzIGRlIGVudmlhciBzdWFzIHByb3Zhcy4nKTsgcmV0dXJuOyB9XG4gIGNvbnN0IHN0YXR1c0F0dWFsID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgaWYgKHN0YXR1c0F0dWFsICYmIChzdGF0dXNBdHVhbC5zdGF0dXMgPT09ICdwZW5kZW50ZScgfHwgc3RhdHVzQXR1YWwuc3RhdHVzID09PSAnYXByb3ZhZG8nKSkge1xuICAgIGF0dWFsaXphclVJUm9sZXRhKHN0YXR1c0F0dWFsKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgbm9tZSA9IGNsaWVudGVBdHVhbC5ub21lIHx8ICcnO1xuICBjb25zdCB0ZWwgPSBjbGllbnRlQXR1YWwudGVsZWZvbmUgfHwgJyc7XG4gIGNvbnN0IGluc3RFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0YWdyYW1JbnB1dCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsO1xuICBjb25zdCBpbnN0YWdyYW0gPSBpbnN0RWwgPyBpbnN0RWwudmFsdWUudHJpbSgpIDogJyc7XG4gIGNvbnN0IG1zZyA9ICdPbFx1MDBFMSwgZXF1aXBlIEdlbGFtb3VyISBRdWVybyBwYXJ0aWNpcGFyIGRhIFJvbGV0YSBWSVAuJTBBJTBBTm9tZTogJyArIGVuY29kZVVSSUNvbXBvbmVudChub21lKSArXG4gICAgJyUwQVRlbGVmb25lOiAnICsgZW5jb2RlVVJJQ29tcG9uZW50KHRlbCkgK1xuICAgIChpbnN0YWdyYW0gPyAnJTBBSW5zdGFncmFtOiAnICsgZW5jb2RlVVJJQ29tcG9uZW50KGluc3RhZ3JhbSkgOiAnJykgK1xuICAgICclMEElMEFFc3RvdSBlbnZpYW5kbyBhIGZvdG8gZG9zIG1ldXMgNSBhZGVzaXZvcyBlIG8gcHJpbnQgZG8gU3RvcnkgcGFyYSB2YWxpZGFcdTAwRTdcdTAwRTNvISc7XG4gIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIG1zZywgJ19ibGFuaycpO1xuICBhd2FpdCByZWdpc3RyYXJQYXJ0aWNpcGFjYW8oaW5zdGFncmFtKTtcbiAgYXR1YWxpemFyVUlSb2xldGEoeyBzdGF0dXM6ICdwZW5kZW50ZScsIGphX2dpcm91OiBmYWxzZSB9IGFzIFBhcnRpY2lwYWNhbyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlZ2lzdHJhclBhcnRpY2lwYWNhbyhpbnN0YWdyYW06IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHJldHVybjtcbiAgdHJ5IHtcbiAgICBjb25zdCBjaGVjayA9IGF3YWl0IHZlcmlmaWNhclN0YXR1c1JvbGV0YShjbGllbnRlQXR1YWwuaWQgPz8gMCk7XG4gICAgaWYgKGNoZWNrICYmIGNoZWNrLnN0YXR1cyAhPT0gJ3JlamVpdGFkbycpIHJldHVybjtcbiAgICBjb25zdCBzZW1hbmEgPSBnZXRTZW1hbmFBdHVhbCgpO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuc2F2ZVBhcnRpY2lwYWNhbyh7XG4gICAgICBub21lOiBjbGllbnRlQXR1YWwubm9tZSxcbiAgICAgIHRlbGVmb25lOiBjbGllbnRlQXR1YWwudGVsZWZvbmUsXG4gICAgICBpbnN0YWdyYW06IGluc3RhZ3JhbSB8fCB1bmRlZmluZWQsXG4gICAgICBzdGF0dXM6ICdwZW5kZW50ZScsXG4gICAgICBzZW1hbmEsXG4gICAgICBqYV9naXJvdTogZmFsc2UsXG4gICAgICBjcmVhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfSBhcyBpbXBvcnQoJy4vZG9tYWluL3JvbGV0YScpLlBhcnRpY2lwYWNhb1Byb3BzKTtcbiAgICBpZiAocmVzdWx0Lm9rKSB7XG4gICAgICBzZXRQYXJ0aWNpcGFjYW9JZChyZXN1bHQudmFsdWUuaWQpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyBsb2cud2FybignRXJybyBhbyByZWdpc3RyYXIgcGFydGljaXBhXHUwMEU3XHUwMEUzbycsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTsgfVxufVxuXG4vLyA9PT09PSBBRE1JTiBST0xFVEEgPT09PT1cbmZ1bmN0aW9uIHZlcmlmaWNhckFkbWluKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gYXBwU3RvcmUuZ2V0U3RhdGUoKS5pc0FkbWluO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhYnJpclJvbGV0YUFkbWluKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIXZlcmlmaWNhckFkbWluKCkpIHsgYWxlcnQoJ0FjZXNzbyByZXN0cml0by4nKTsgcmV0dXJuOyB9XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFBZG1pbkJhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICBhd2FpdCBjYXJyZWdhclBhcnRpY2lwYW50ZXNSb2xldGEoKTtcbiAgYXdhaXQgY2FycmVnYXJDb25maWdBZG1pbigpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJSb2xldGFBZG1pbigpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUFkbWluQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdyb2xldGFBZG1pbkJhY2tkcm9wJykgZmVjaGFyUm9sZXRhQWRtaW4oKTtcbn1cblxuZnVuY3Rpb24gYWJyaXJUYWJBZG1pbih0YWI6IHN0cmluZywgYnRuOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm9sZXRhLWFkbWluLXRhYicpLmZvckVhY2godCA9PiB0LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm9sZXRhLWFkbWluLXBhbmVsJykuZm9yRWFjaChwID0+IHAuY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKSk7XG4gIGJ0bi5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBjb25zdCB0YWJJZCA9ICd0YWInICsgdGFiLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdGFiLnNsaWNlKDEpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWJJZCk/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGlmICh0YWIgPT09ICdwZW5kZW50ZXMnKSBjYXJyZWdhclBhcnRpY2lwYW50ZXNSb2xldGEoKTtcbiAgZWxzZSBpZiAodGFiID09PSAnYXByb3ZhZG9zJykgY2FycmVnYXJBcHJvdmFkb3NSb2xldGEoKTtcbiAgZWxzZSBpZiAodGFiID09PSAndmVuY2Vkb3JlcycpIGNhcnJlZ2FyVmVuY2Vkb3Jlc1JvbGV0YSgpO1xuICBlbHNlIGlmICh0YWIgPT09ICdjb25maWcnKSBjYXJyZWdhckNvbmZpZ0FkbWluKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyUGFydGljaXBhbnRlc1JvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlzdGFQZW5kZW50ZXMnKTtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkNhcnJlZ2FuZG8uLi48L2Rpdj4nO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/c3RhdHVzPWVxLnBlbmRlbnRlJm9yZGVyPWNyZWF0ZWRfYXQuZGVzYycsIHtcbiAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PFBhcnRpY2lwYWNhbz47XG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmxlbmd0aCkgeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPk5lbmh1bSBwYXJ0aWNpcGFudGUgcGVuZGVudGUuPC9kaXY+JzsgcmV0dXJuOyB9XG4gICAgZWwuaW5uZXJIVE1MID0gZGF0YS5tYXAocCA9PiB7XG4gICAgICBjb25zdCBkdCA9IG5ldyBEYXRlKHAuY3JlYXRlZF9hdCkudG9Mb2NhbGVTdHJpbmcoJ3B0LUJSJyk7XG4gICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWl0ZW1cIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWluZm9cIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLW5vbWVcIj4nICsgZXNjSFRNTChwLm5vbWUgPz8gJycpICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtdGVsXCI+JyArIGVzY0hUTUwocC50ZWxlZm9uZSkgKyAocC5pbnN0YWdyYW0gPyAnIFx1MDBCNyBAJyArIGVzY0hUTUwocC5pbnN0YWdyYW0pIDogJycpICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxMXB4O2NvbG9yOiM5OTlcIj4nICsgZHQgKyAnPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWFjb2VzXCI+JyArXG4gICAgICAgICc8YnV0dG9uIGNsYXNzPVwiYnRuLWFwcm92YXJcIiBvbmNsaWNrPVwiYXByb3ZhclBhcnRpY2lwYW50ZSgnICsgcC5pZCArICcsIHRoaXMpXCI+XHUyNzEzIEFwcm92YXI8L2J1dHRvbj4nICtcbiAgICAgICAgJzxidXR0b24gY2xhc3M9XCJidG4tcmVqZWl0YXJcIiBvbmNsaWNrPVwicmVqZWl0YXJQYXJ0aWNpcGFudGUoJyArIHAuaWQgKyAnLCB0aGlzKVwiPlx1MjcxNyBSZWplaXRhcjwvYnV0dG9uPicgK1xuICAgICAgICAnPC9kaXY+PC9kaXY+JztcbiAgICB9KS5qb2luKCcnKTtcbiAgfSBjYXRjaCB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+RXJybyBhbyBjYXJyZWdhci48L2Rpdj4nOyB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyQXByb3ZhZG9zUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0YUFwcm92YWRvcycpO1xuICBpZiAoIWVsKSByZXR1cm47XG4gIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+Q2FycmVnYW5kby4uLjwvZGl2Pic7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfcGFydGljaXBhY29lcz9zdGF0dXM9ZXEuYXByb3ZhZG8mb3JkZXI9ZGF0YV9hcHJvdmFjYW8uZGVzYycsIHtcbiAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PFBhcnRpY2lwYWNhbz47XG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmxlbmd0aCkgeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPk5lbmh1bSBhcHJvdmFkbyBhaW5kYS48L2Rpdj4nOyByZXR1cm47IH1cbiAgICBlbC5pbm5lckhUTUwgPSBkYXRhLm1hcChwID0+IHtcbiAgICAgIGNvbnN0IGR0ID0gcC5kYXRhX2Fwcm92YWNhbyA/IG5ldyBEYXRlKHAuZGF0YV9hcHJvdmFjYW8pLnRvTG9jYWxlU3RyaW5nKCdwdC1CUicpIDogJ1x1MjAxNCc7XG4gICAgICBjb25zdCBnaXJvdSA9IHAuamFfZ2lyb3UgPyAnXHUyNzEzIEdpcm91IFx1MjAxNCAnICsgZXNjSFRNTChwLnByZW1pbyA/PyAnJykgOiAnXHUyM0YzIEFndWFyZGFuZG8gZ2lyYXInO1xuICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1pdGVtXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1pbmZvXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1ub21lXCI+JyArIGVzY0hUTUwocC5ub21lID8/ICcnKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLXRlbFwiPicgKyBlc2NIVE1MKHAudGVsZWZvbmUpICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxMXB4O2NvbG9yOiMzODhlM2NcIj4nICsgZ2lyb3UgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjExcHg7Y29sb3I6Izk5OVwiPkFwcm92YWRvIGVtOiAnICsgZHQgKyAnPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj48L2Rpdj4nO1xuICAgIH0pLmpvaW4oJycpO1xuICB9IGNhdGNoIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5FcnJvIGFvIGNhcnJlZ2FyLjwvZGl2Pic7IH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gYXByb3ZhclBhcnRpY2lwYW50ZShpZDogbnVtYmVyLCBidG46IEhUTUxCdXR0b25FbGVtZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi50ZXh0Q29udGVudCA9ICcuLi4nO1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9wYXJ0aWNpcGFjb2VzP2lkPWVxLicgKyBpZCwge1xuICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTixcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OLCAnUHJlZmVyJzogJ3JldHVybj1taW5pbWFsJ1xuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgc3RhdHVzOiAnYXByb3ZhZG8nLFxuICAgICAgICBkYXRhX2Fwcm92YWNhbzogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBhcHJvdmFkb19wb3I6IGNsaWVudGVBdHVhbCA/IGNsaWVudGVBdHVhbC5ub21lIDogJ2FkbWluJ1xuICAgICAgfSlcbiAgICB9KTtcbiAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcignc3RhdHVzICcgKyByLnN0YXR1cyk7XG4gICAgYnRuLmNsb3Nlc3QoJy5yb2xldGEtcGFydGljaXBhbnRlLWl0ZW0nKT8ucmVtb3ZlKCk7XG4gIH0gY2F0Y2gge1xuICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAnXHUyNzEzIEFwcm92YXInO1xuICAgIGFsZXJ0KCdFcnJvIGFvIGFwcm92YXIuJyk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVqZWl0YXJQYXJ0aWNpcGFudGUoaWQ6IG51bWJlciwgYnRuOiBIVE1MQnV0dG9uRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIWNvbmZpcm0oJ1JlamVpdGFyIGVzdGEgcGFydGljaXBhXHUwMEU3XHUwMEUzbz8nKSkgcmV0dXJuO1xuICBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4udGV4dENvbnRlbnQgPSAnLi4uJztcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9wYXJ0aWNpcGFjb2VzP2lkPWVxLicgKyBpZCwge1xuICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTixcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OLCAnUHJlZmVyJzogJ3JldHVybj1taW5pbWFsJ1xuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc3RhdHVzOiAncmVqZWl0YWRvJyB9KVxuICAgIH0pO1xuICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKCdzdGF0dXMgJyArIHIuc3RhdHVzKTtcbiAgICBidG4uY2xvc2VzdCgnLnJvbGV0YS1wYXJ0aWNpcGFudGUtaXRlbScpPy5yZW1vdmUoKTtcbiAgfSBjYXRjaCB7XG4gICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTcgUmVqZWl0YXInO1xuICAgIGFsZXJ0KCdFcnJvIGFvIHJlamVpdGFyLicpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyVmVuY2Vkb3Jlc1JvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlzdGFWZW5jZWRvcmVzJyk7XG4gIGlmICghZWwpIHJldHVybjtcbiAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5DYXJyZWdhbmRvLi4uPC9kaXY+JztcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV92ZW5jZWRvcmVzP29yZGVyPWRhdGFfdml0b3JpYS5kZXNjJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8eyBub21lPzogc3RyaW5nOyBwcmVtaW86IHN0cmluZzsgdGVsZWZvbmU/OiBzdHJpbmc7IHNlbWFuYT86IHN0cmluZzsgZGF0YV92aXRvcmlhOiBzdHJpbmcgfT47XG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmxlbmd0aCkgeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPk5lbmh1bSB2ZW5jZWRvciBhaW5kYS48L2Rpdj4nOyByZXR1cm47IH1cbiAgICBlbC5pbm5lckhUTUwgPSBkYXRhLm1hcCh2ID0+IHtcbiAgICAgIGNvbnN0IGR0ID0gbmV3IERhdGUodi5kYXRhX3ZpdG9yaWEpLnRvTG9jYWxlU3RyaW5nKCdwdC1CUicpO1xuICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicm9sZXRhLXZlbmNlZG9yLWl0ZW1cIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtdmVuY2Vkb3Itbm9tZVwiPlx1RDgzQ1x1REZDNiAnICsgZXNjSFRNTCh2Lm5vbWUgPz8gJ1x1MjAxNCcpICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS12ZW5jZWRvci1wcmVtaW9cIj5cdUQ4M0NcdURGODEgJyArIGVzY0hUTUwodi5wcmVtaW8pICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS12ZW5jZWRvci1kYXRhXCI+JyArIGVzY0hUTUwodi50ZWxlZm9uZSA/PyAnJykgKyAnIFx1MDBCNyBTZW1hbmEgJyArIGVzY0hUTUwodi5zZW1hbmEgPz8gJycpICsgJyBcdTAwQjcgJyArIGR0ICsgJzwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JztcbiAgICB9KS5qb2luKCcnKTtcbiAgfSBjYXRjaCB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+RXJybyBhbyBjYXJyZWdhci48L2Rpdj4nOyB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyQ29uZmlnQWRtaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfY29uZmlnP2lkPWVxLjEmbGltaXQ9MScsIHtcbiAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PHsgYXRpdmE6IGJvb2xlYW47IHByZW1pb3M6IHN0cmluZ1tdIH0+O1xuICAgIGlmIChkYXRhICYmIGRhdGFbMF0pIHtcbiAgICAgIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnQXRpdmEnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkID0gZGF0YVswXSEuYXRpdmE7XG4gICAgICBjb25zdCBwcmVtaW9zID0gQXJyYXkuaXNBcnJheShkYXRhWzBdIS5wcmVtaW9zKSA/IGRhdGFbMF0hLnByZW1pb3MgOiBnZXRQcmVtaW9zUGFkcmFvKCk7XG4gICAgICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ1ByZW1pb3MnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZSA9IHByZW1pb3Muam9pbignXFxuJyk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7IGxvZy53YXJuKCdFcnJvIGFvIGNhcnJlZ2FyIGNvbmZpZyBhZG1pbicsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTsgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzYWx2YXJDb25maWdSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGF0aXZhID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdBdGl2YScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmNoZWNrZWQ7XG4gIGNvbnN0IHByZW1pb3NUeHQgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ1ByZW1pb3MnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZTtcbiAgY29uc3QgcHJlbWlvcyA9IHByZW1pb3NUeHQuc3BsaXQoJ1xcbicpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIocyA9PiBzLmxlbmd0aCA+IDApO1xuICBjb25zdCBtc2dFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdNc2cnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfY29uZmlnP2lkPWVxLjEnLCB7XG4gICAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxuICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04sICdQcmVmZXInOiAncmV0dXJuPW1pbmltYWwnXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhdGl2YSwgcHJlbWlvcywgdXBkYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pXG4gICAgfSk7XG4gICAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ3N0YXR1cyAnICsgci5zdGF0dXMpO1xuICAgIHNldFByZW1pb3MocHJlbWlvcyk7XG4gICAgaWYgKG1zZ0VsKSB7IG1zZ0VsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyBzZXRUaW1lb3V0KCgpID0+IHsgbXNnRWwuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgfSwgMjUwMCk7IH1cbiAgfSBjYXRjaCB7IGFsZXJ0KCdFcnJvIGFvIHNhbHZhciBjb25maWd1cmFcdTAwRTdcdTAwRjVlcy4nKTsgfVxufVxuXG4vLyA9PT09PSBJTklUID09PT09XG4oYXN5bmMgZnVuY3Rpb24gaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICAvLyBUZW50YSByZXN0YXVyYXIgc2Vzc1x1MDBFM28gdmlhIExvZ2luVXNlQ2FzZSAodmVyaWZpY2EgVFRMICsgc3RvcmUpXG4gICAgY29uc3QgY2xpZW50ZVNlc3NhbyA9IGxvZ2luVXNlQ2FzZS5yZXN0b3JlU2Vzc2lvbigpO1xuICAgIGlmIChjbGllbnRlU2Vzc2FvKSB7XG4gICAgICAvLyBSZXZhbGlkYSBubyBiYW5jb1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLmV4ZWN1dGUoY2xpZW50ZVNlc3Nhby50ZWxlZm9uZSk7XG4gICAgICBpZiAocmVzdWx0Lm9rICYmIHJlc3VsdC52YWx1ZS5leGlzdGUgJiYgcmVzdWx0LnZhbHVlLmNsaWVudGUpIHtcbiAgICAgICAgZW50cmFyQ29tQ2xpZW50ZShyZXN1bHQudmFsdWUuY2xpZW50ZS50b0pTT04oKSBhcyBDbGllbnRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9naW5Vc2VDYXNlLmxvZ291dCgpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyBsb2cud2FybignRXJybyBhbyB2ZXJpZmljYXIgc2Vzc1x1MDBFM28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7IH1cbiAgbW9zdHJhckxvZ2luKCk7XG59KSgpO1xuXG4vLyBQV0Egc2VydmljZSB3b3JrZXJcbmlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XG4gIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCdzdy5qcycpLmNhdGNoKCgpID0+IHt9KTtcbn1cblxuLy8gU2luY3Jvbml6YXIgY2FyZFx1MDBFMXBpbyBjb20gU3VwYWJhc2Vcbihhc3luYyBmdW5jdGlvbiBzaW5jcm9uaXphckNhcmRhcGlvKCk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IGN0cmwgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IGN0cmwuYWJvcnQoKSwgMTBfMDAwKTtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3Byb2R1dG9zP3NlbGVjdD1ub21lLHByZWNvLGRpc3Bvbml2ZWwnLCB7XG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfSxcbiAgICAgIHNpZ25hbDogY3RybC5zaWduYWxcbiAgICB9KTtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIGlmICghci5vaykgcmV0dXJuO1xuICAgIGNvbnN0IHByb2RzID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8eyBub21lOiBzdHJpbmc7IHByZWNvOiBudW1iZXI7IGRpc3Bvbml2ZWw6IGJvb2xlYW4gfT47XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHByb2RzKSB8fCAhcHJvZHMubGVuZ3RoKSByZXR1cm47XG4gICAgY29uc3QgbWFwYTogUmVjb3JkPHN0cmluZywgeyBub21lOiBzdHJpbmc7IHByZWNvOiBudW1iZXI7IGRpc3Bvbml2ZWw6IGJvb2xlYW4gfT4gPSB7fTtcbiAgICBwcm9kcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAgJiYgdHlwZW9mIHAubm9tZSA9PT0gJ3N0cmluZycgJiYgcC5ub21lLnRyaW0oKSkgbWFwYVtwLm5vbWUudHJpbSgpLnRvTG93ZXJDYXNlKCldID0gcDtcbiAgICB9KTtcbiAgICBjb25zdCBwcmljZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJ0bi1wZWRpcicpLmZvckVhY2goYnRuID0+IHtcbiAgICAgIGNvbnN0IG9uY2xpY2tBdHRyID0gYnRuLmdldEF0dHJpYnV0ZSgnb25jbGljaycpID8/ICcnO1xuICAgICAgY29uc3QgbSA9IG9uY2xpY2tBdHRyLm1hdGNoKC9wZWRpclByb2R1dG9cXCh0aGlzLCcoLis/KScsKFxcZCsoPzpcXC5cXGQrKT8pXFwpLyk7XG4gICAgICBpZiAoIW0pIHJldHVybjtcbiAgICAgIGNvbnN0IG5vbWVQcm9kID0gbVsxXSE7XG4gICAgICBjb25zdCBjaGF2ZSA9IG5vbWVQcm9kLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3QgZGIgPSBtYXBhW2NoYXZlXTtcbiAgICAgIGlmICghZGIpIHJldHVybjtcbiAgICAgIGNvbnN0IGNhcmQgPSBidG4uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICAgIGlmICghY2FyZCkgcmV0dXJuO1xuICAgICAgaWYgKGRiLmRpc3Bvbml2ZWwgPT09IGZhbHNlKSB7IGNhcmQuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgcmV0dXJuOyB9XG4gICAgICBjb25zdCBub3ZvUHJlY28gPSBwYXJzZUZsb2F0KFN0cmluZyhkYi5wcmVjbykpO1xuICAgICAgaWYgKGlzTmFOKG5vdm9QcmVjbykgfHwgbm92b1ByZWNvIDw9IDApIHJldHVybjtcbiAgICAgIGJ0bi5zZXRBdHRyaWJ1dGUoJ29uY2xpY2snLCBcInBlZGlyUHJvZHV0byh0aGlzLCdcIiArIG5vbWVQcm9kLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKSArIFwiJyxcIiArIG5vdm9QcmVjbyArIFwiKVwiKTtcbiAgICAgIGNvbnN0IHByZWNvRWwgPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kLXByZWNvJyk7XG4gICAgICBpZiAocHJlY29FbCkgcHJlY29FbC50ZXh0Q29udGVudCA9ICdSJCAnICsgbm92b1ByZWNvLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG4gICAgICBwcmljZU1hcC5zZXQobm9tZVByb2QsIG5vdm9QcmVjbyk7XG4gICAgfSk7XG4gICAgY2FydFNlcnZpY2UucmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcCk7XG4gIH0gY2F0Y2ggeyAvKiBzaWxlbmNpb3NvICovIH1cbn0pKCk7XG5cbi8vIEZlY2hhciBtb2RhaXMgY29tIEVzY2FwZVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICBmZWNoYXJEaWFsb2coKTtcbiAgICBmZWNoYXJNb2RhbCgpO1xuICAgIGZlY2hhckNvbmZpcm1XQSgpO1xuICAgIGNhbmNlbGFyUGl4KCk7XG4gIH1cbn0pO1xuXG4vLyA9PT09PSBFWFBPUiBQQVJBIEhUTUwgKG9uY2xpY2s9XCIuLi5cIikgPT09PT1cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgaW50ZXJmYWNlIFdpbmRvdyB7XG4gICAgZmlsdHJhcjogdHlwZW9mIGZpbHRyYXI7XG4gICAgcGVkaXJQcm9kdXRvOiB0eXBlb2YgcGVkaXJQcm9kdXRvO1xuICAgIGFicmlyRGlhbG9nOiB0eXBlb2YgYWJyaXJEaWFsb2c7XG4gICAgZmVjaGFyRGlhbG9nOiB0eXBlb2YgZmVjaGFyRGlhbG9nO1xuICAgIGZlY2hhckRpYWxvZ0JhY2tkcm9wOiB0eXBlb2YgZmVjaGFyRGlhbG9nQmFja2Ryb3A7XG4gICAgaXJQYXJhRmluYWxpemFyOiB0eXBlb2YgaXJQYXJhRmluYWxpemFyO1xuICAgIGFicmlyTW9kYWw6IHR5cGVvZiBhYnJpck1vZGFsO1xuICAgIGZlY2hhck1vZGFsOiB0eXBlb2YgZmVjaGFyTW9kYWw7XG4gICAgZmVjaGFyTW9kYWxCYWNrZHJvcDogdHlwZW9mIGZlY2hhck1vZGFsQmFja2Ryb3A7XG4gICAgcmVtb3ZlckRvQ2FycmluaG86IHR5cGVvZiByZW1vdmVyRG9DYXJyaW5obztcbiAgICBzZWxlY2lvbmFyUGFnYW1lbnRvOiB0eXBlb2Ygc2VsZWNpb25hclBhZ2FtZW50bztcbiAgICBmaW5hbGl6YXJQZWRpZG86IHR5cGVvZiBmaW5hbGl6YXJQZWRpZG87XG4gICAgY29uZmlybWFyRW52aW9XQTogdHlwZW9mIGNvbmZpcm1hckVudmlvV0E7XG4gICAgZmVjaGFyQ29uZmlybVdBOiB0eXBlb2YgZmVjaGFyQ29uZmlybVdBO1xuICAgIHBlZGlyQm9sb0Zvcm1hOiB0eXBlb2YgcGVkaXJCb2xvRm9ybWE7XG4gICAgYWJyaXJEaWFsb2dCb2xvOiB0eXBlb2YgYWJyaXJEaWFsb2dCb2xvO1xuICAgIGZlY2hhckRpYWxvZ0JvbG86IHR5cGVvZiBmZWNoYXJEaWFsb2dCb2xvO1xuICAgIGFnZW5kYXJCb2xvV2hhdHNBcHA6IHR5cGVvZiBhZ2VuZGFyQm9sb1doYXRzQXBwO1xuICAgIGNhcm91c2VsTmV4dDogdHlwZW9mIGNhcm91c2VsTmV4dDtcbiAgICBjYXJvdXNlbFByZXY6IHR5cGVvZiBjYXJvdXNlbFByZXY7XG4gICAgY29waWFyUGl4OiB0eXBlb2YgY29waWFyUGl4O1xuICAgIGNhbmNlbGFyUGl4OiB0eXBlb2YgY2FuY2VsYXJQaXg7XG4gICAgcGl4SmFQYWd1ZWk6IHR5cGVvZiBwaXhKYVBhZ3VlaTtcbiAgICBzZWxlY2lvbmFyVGlwb0NhcnRhbzogdHlwZW9mIHNlbGVjaW9uYXJUaXBvQ2FydGFvO1xuICAgIGZvcm1hdGFyQ2FydGFvOiB0eXBlb2YgZm9ybWF0YXJDYXJ0YW87XG4gICAgZm9ybWF0YXJDcGY6IHR5cGVvZiBmb3JtYXRhckNwZjtcbiAgICBmb3JtYXRhclZhbGlkYWRlOiB0eXBlb2YgZm9ybWF0YXJWYWxpZGFkZTtcbiAgICBmb3JtYXRhckNlcDogdHlwZW9mIGZvcm1hdGFyQ2VwO1xuICAgIHBhZ2FyQ2FydGFvOiB0eXBlb2YgcGFnYXJDYXJ0YW87XG4gICAgZmVjaGFyUmVjaWJvUGl4OiB0eXBlb2YgZmVjaGFyUmVjaWJvUGl4O1xuICAgIG1hc2NhcmFUZWxlZm9uZTogdHlwZW9mIG1hc2NhcmFUZWxlZm9uZTtcbiAgICB2ZXJpZmljYXJUZWxlZm9uZTogdHlwZW9mIHZlcmlmaWNhclRlbGVmb25lO1xuICAgIGNhZGFzdHJhcjogdHlwZW9mIGNhZGFzdHJhcjtcbiAgICB2b2x0YXJFdGFwYVRlbGVmb25lOiB0eXBlb2Ygdm9sdGFyRXRhcGFUZWxlZm9uZTtcbiAgICBzYWlyOiB0eXBlb2Ygc2FpcjtcbiAgICBhYnJpclJvbGV0YTogdHlwZW9mIGFicmlyUm9sZXRhO1xuICAgIGZlY2hhclJvbGV0YTogdHlwZW9mIGZlY2hhclJvbGV0YTtcbiAgICBmZWNoYXJSb2xldGFCYWNrZHJvcDogdHlwZW9mIGZlY2hhclJvbGV0YUJhY2tkcm9wO1xuICAgIGdpcmFyUm9sZXRhOiB0eXBlb2YgZ2lyYXJSb2xldGE7XG4gICAgZW52aWFyUHJvdmFzV2hhdHNBcHA6IHR5cGVvZiBlbnZpYXJQcm92YXNXaGF0c0FwcDtcbiAgICBhYnJpclJvbGV0YUFkbWluOiB0eXBlb2YgYWJyaXJSb2xldGFBZG1pbjtcbiAgICBmZWNoYXJSb2xldGFBZG1pbjogdHlwZW9mIGZlY2hhclJvbGV0YUFkbWluO1xuICAgIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJSb2xldGFBZG1pbkJhY2tkcm9wO1xuICAgIGFicmlyVGFiQWRtaW46IHR5cGVvZiBhYnJpclRhYkFkbWluO1xuICAgIGFwcm92YXJQYXJ0aWNpcGFudGU6IHR5cGVvZiBhcHJvdmFyUGFydGljaXBhbnRlO1xuICAgIHJlamVpdGFyUGFydGljaXBhbnRlOiB0eXBlb2YgcmVqZWl0YXJQYXJ0aWNpcGFudGU7XG4gICAgc2FsdmFyQ29uZmlnUm9sZXRhOiB0eXBlb2Ygc2FsdmFyQ29uZmlnUm9sZXRhO1xuICB9XG59XG5cbk9iamVjdC5hc3NpZ24od2luZG93LCB7XG4gIGZpbHRyYXIsXG4gIHBlZGlyUHJvZHV0byxcbiAgYWJyaXJEaWFsb2csXG4gIGZlY2hhckRpYWxvZyxcbiAgZmVjaGFyRGlhbG9nQmFja2Ryb3AsXG4gIGlyUGFyYUZpbmFsaXphcixcbiAgYWJyaXJNb2RhbCxcbiAgZmVjaGFyTW9kYWwsXG4gIGZlY2hhck1vZGFsQmFja2Ryb3AsXG4gIHJlbW92ZXJEb0NhcnJpbmhvLFxuICBzZWxlY2lvbmFyUGFnYW1lbnRvLFxuICBmaW5hbGl6YXJQZWRpZG8sXG4gIGNvbmZpcm1hckVudmlvV0EsXG4gIGZlY2hhckNvbmZpcm1XQSxcbiAgcGVkaXJCb2xvRm9ybWEsXG4gIGFicmlyRGlhbG9nQm9sbyxcbiAgZmVjaGFyRGlhbG9nQm9sbyxcbiAgYWdlbmRhckJvbG9XaGF0c0FwcCxcbiAgY2Fyb3VzZWxOZXh0LFxuICBjYXJvdXNlbFByZXYsXG4gIGNvcGlhclBpeCxcbiAgY2FuY2VsYXJQaXgsXG4gIHBpeEphUGFndWVpLFxuICBzZWxlY2lvbmFyVGlwb0NhcnRhbyxcbiAgZm9ybWF0YXJDYXJ0YW8sXG4gIGZvcm1hdGFyQ3BmLFxuICBmb3JtYXRhclZhbGlkYWRlLFxuICBmb3JtYXRhckNlcCxcbiAgcGFnYXJDYXJ0YW8sXG4gIGZlY2hhclJlY2lib1BpeCxcbiAgbWFzY2FyYVRlbGVmb25lLFxuICB2ZXJpZmljYXJUZWxlZm9uZSxcbiAgY2FkYXN0cmFyLFxuICB2b2x0YXJFdGFwYVRlbGVmb25lLFxuICBzYWlyLFxuICBhYnJpclJvbGV0YSxcbiAgZmVjaGFyUm9sZXRhLFxuICBmZWNoYXJSb2xldGFCYWNrZHJvcCxcbiAgZ2lyYXJSb2xldGEsXG4gIGVudmlhclByb3Zhc1doYXRzQXBwLFxuICBhYnJpclJvbGV0YUFkbWluLFxuICBmZWNoYXJSb2xldGFBZG1pbixcbiAgZmVjaGFyUm9sZXRhQWRtaW5CYWNrZHJvcCxcbiAgYWJyaXJUYWJBZG1pbixcbiAgYXByb3ZhclBhcnRpY2lwYW50ZSxcbiAgcmVqZWl0YXJQYXJ0aWNpcGFudGUsXG4gIHNhbHZhckNvbmZpZ1JvbGV0YSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFTyxXQUFTLGFBQWEsS0FBYSxPQUFrQixRQUFjO0FBQ3hFLFVBQU0sTUFBTSxTQUFTLGVBQWUs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
