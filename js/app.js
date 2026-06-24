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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3V0aWxzL3RvYXN0LnRzIiwgIi4uL3NyYy91dGlscy9zZWN1cml0eS50cyIsICIuLi9zcmMvdXRpbHMvZm9ybWF0LnRzIiwgIi4uL3NyYy9jb3JlL2Vycm9ycy50cyIsICIuLi9zcmMvZG9tYWluL2NsaWVudGUudHMiLCAiLi4vc3JjL2NvcmUvcmVzdWx0LnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQudHMiLCAiLi4vc3JjL2NvcmUvbG9nZ2VyLnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9DbGllbnRlUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvZG9tYWluL3BlZGlkby50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUGVkaWRvUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUm9sZXRhUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvY29yZS9ldmVudHMudHMiLCAiLi4vc3JjL3N0YXRlL1N0b3JlLnRzIiwgIi4uL3NyYy9zdGF0ZS9BcHBTdG9yZS50cyIsICIuLi9zcmMvYXBwbGljYXRpb24vYXV0aC9Mb2dpblVzZUNhc2UudHMiLCAiLi4vc3JjL2FwcGxpY2F0aW9uL2NhcnQvQ2FydFNlcnZpY2UudHMiLCAiLi4vc3JjL2NvbnRhaW5lci50cyIsICIuLi9zcmMvbW9kdWxlcy9yb2xldGEudHMiLCAiLi4vc3JjL21vZHVsZXMvY2FydC50cyIsICIuLi9zcmMvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUb2FzdFRpcG8gfSBmcm9tICcuLi90eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBtb3N0cmFyVG9hc3QobXNnOiBzdHJpbmcsIHRpcG86IFRvYXN0VGlwbyA9ICdpbmZvJyk6IHZvaWQge1xuICBjb25zdCBvbGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnX3RvYXN0Jyk7XG4gIGlmIChvbGQpIG9sZC5yZW1vdmUoKTtcbiAgY29uc3QgdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0LmlkID0gJ190b2FzdCc7XG4gIHQudGV4dENvbnRlbnQgPSBtc2c7XG4gIGNvbnN0IGJnID0gdGlwbyA9PT0gJ2Vycm8nID8gJyNlZjQ0NDQnIDogdGlwbyA9PT0gJ29rJyA/ICcjMjJjNTVlJyA6ICcjNEEyQzE3JztcbiAgT2JqZWN0LmFzc2lnbih0LnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdmaXhlZCcsIGJvdHRvbTogJzkwcHgnLCBsZWZ0OiAnNTAlJyxcbiAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKC01MCUpJyxcbiAgICBiYWNrZ3JvdW5kOiBiZywgY29sb3I6ICcjZmZmJywgcGFkZGluZzogJzEycHggMjJweCcsXG4gICAgYm9yZGVyUmFkaXVzOiAnMzBweCcsIGZvbnRTaXplOiAnMTRweCcsIGZvbnRXZWlnaHQ6ICc2MDAnLFxuICAgIHpJbmRleDogJzk5OTk5JywgYm94U2hhZG93OiAnMCA2cHggMjRweCByZ2JhKDAsMCwwLDAuMyknLFxuICAgIG1heFdpZHRoOiAnOTB2dycsIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgdHJhbnNpdGlvbjogJ29wYWNpdHkgLjNzJywgb3BhY2l0eTogJzEnLFxuICAgIGZvbnRGYW1pbHk6IFwiJ0RNIFNhbnMnLCBzYW5zLXNlcmlmXCIsXG4gIH0gYXMgUGFydGlhbDxDU1NTdHlsZURlY2xhcmF0aW9uPik7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodCk7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHQuc3R5bGUub3BhY2l0eSA9ICcwJztcbiAgICBzZXRUaW1lb3V0KCgpID0+IHQucmVtb3ZlKCksIDM1MCk7XG4gIH0sIDM1MDApO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBlc2NIVE1MKHM6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gU3RyaW5nKHMpXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6YXJUZWxlZm9uZSh0ZWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZWwucmVwbGFjZSgvXFxEL2csICcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6YXJOb21lKG5vbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBub21lXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAuc3BsaXQoJyAnKVxuICAgIC5tYXAocCA9PiBwLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcC5zbGljZSgxKSlcbiAgICAuam9pbignICcpXG4gICAgLnRyaW0oKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gZm9ybWF0YXJNb2VkYSh2YWxvcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuICdSJCAnICsgdmFsb3IudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbWFuYUF0dWFsKCk6IHN0cmluZyB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IHN0YXJ0T2ZZZWFyID0gbmV3IERhdGUobm93LmdldEZ1bGxZZWFyKCksIDAsIDEpO1xuICBjb25zdCBkYXlPZlllYXIgPSBNYXRoLmZsb29yKChub3cuZ2V0VGltZSgpIC0gc3RhcnRPZlllYXIuZ2V0VGltZSgpKSAvIDg2NDAwMDAwKTtcbiAgY29uc3Qgd2Vla051bSA9IE1hdGguY2VpbCgoZGF5T2ZZZWFyICsgc3RhcnRPZlllYXIuZ2V0RGF5KCkgKyAxKSAvIDcpO1xuICByZXR1cm4gYCR7bm93LmdldEZ1bGxZZWFyKCl9LVcke1N0cmluZyh3ZWVrTnVtKS5wYWRTdGFydCgyLCAnMCcpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcGxpY2FyTWFzY2FyYVRlbGVmb25lKHZhbG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBkID0gdmFsb3IucmVwbGFjZSgvXFxEL2csICcnKS5zbGljZSgwLCAxMSk7XG4gIGlmIChkLmxlbmd0aCA8PSAyKSByZXR1cm4gZDtcbiAgaWYgKGQubGVuZ3RoIDw9IDcpIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyKX1gO1xuICBpZiAoZC5sZW5ndGggPD0gMTEpIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyLCA3KX0tJHtkLnNsaWNlKDcpfWA7XG4gIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyLCA3KX0tJHtkLnNsaWNlKDcsIDExKX1gO1xufVxuIiwgImV4cG9ydCBjbGFzcyBBcHBFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIHB1YmxpYyByZWFkb25seSBjb2RlOiBzdHJpbmcsXG4gICAgcHVibGljIHJlYWRvbmx5IHN0YXR1c0NvZGU6IG51bWJlciA9IDUwMCxcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdBcHBFcnJvcic7XG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIEFwcEVycm9yLnByb3RvdHlwZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBzdXBlcihtZXNzYWdlLCAnVkFMSURBVElPTl9FUlJPUicsIDQwMCwgY29udGV4dCk7XG4gICAgdGhpcy5uYW1lID0gJ1ZhbGlkYXRpb25FcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5ldHdvcmtFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBzdXBlcihtZXNzYWdlLCAnTkVUV09SS19FUlJPUicsIDUwMywgY29udGV4dCk7XG4gICAgdGhpcy5uYW1lID0gJ05ldHdvcmtFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEF1dGhFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSwgJ0FVVEhfRVJST1InLCA0MDEpO1xuICAgIHRoaXMubmFtZSA9ICdBdXRoRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb3RGb3VuZEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXNvdXJjZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYCR7cmVzb3VyY2V9IG5cdTAwRTNvIGVuY29udHJhZG9gLCAnTk9UX0ZPVU5EJywgNDA0KTtcbiAgICB0aGlzLm5hbWUgPSAnTm90Rm91bmRFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJhdGVMaW1pdEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXRyeUFmdGVyTXM6IG51bWJlcikge1xuICAgIHN1cGVyKGBNdWl0YXMgdGVudGF0aXZhcy4gQWd1YXJkZSAke01hdGguY2VpbChyZXRyeUFmdGVyTXMgLyAxMDAwKX1zLmAsICdSQVRFX0xJTUlUJywgNDI5LCB7IHJldHJ5QWZ0ZXJNcyB9KTtcbiAgICB0aGlzLm5hbWUgPSAnUmF0ZUxpbWl0RXJyb3InO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vY29yZS9lcnJvcnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENsaWVudGVQcm9wcyB7XG4gIGlkPzogbnVtYmVyO1xuICBub21lOiBzdHJpbmc7XG4gIHRlbGVmb25lOiBzdHJpbmc7XG4gIGVuZGVyZWNvPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ2xpZW50ZSB7XG4gIHJlYWRvbmx5IGlkPzogbnVtYmVyO1xuICByZWFkb25seSBub21lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHRlbGVmb25lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGVuZGVyZWNvPzogc3RyaW5nO1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJvcHM6IENsaWVudGVQcm9wcykge1xuICAgIHRoaXMuaWQgPSBwcm9wcy5pZDtcbiAgICB0aGlzLm5vbWUgPSBwcm9wcy5ub21lO1xuICAgIHRoaXMudGVsZWZvbmUgPSBwcm9wcy50ZWxlZm9uZTtcbiAgICB0aGlzLmVuZGVyZWNvID0gcHJvcHMuZW5kZXJlY287XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlKHByb3BzOiBDbGllbnRlUHJvcHMpOiBDbGllbnRlIHtcbiAgICBjb25zdCB0ZWwgPSBwcm9wcy50ZWxlZm9uZS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgIGlmICh0ZWwubGVuZ3RoIDwgMTAgfHwgdGVsLmxlbmd0aCA+IDExKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdUZWxlZm9uZSBpbnZcdTAwRTFsaWRvJywgeyB0ZWxlZm9uZTogcHJvcHMudGVsZWZvbmUgfSk7XG4gICAgfVxuICAgIGlmICghcHJvcHMubm9tZS50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ05vbWUgblx1MDBFM28gcG9kZSBzZXIgdmF6aW8nKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDbGllbnRlKHtcbiAgICAgIC4uLnByb3BzLFxuICAgICAgdGVsZWZvbmU6IHRlbCxcbiAgICAgIG5vbWU6IENsaWVudGUubm9ybWFsaXphck5vbWUocHJvcHMubm9tZSksXG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbURCKHJhdzogQ2xpZW50ZVByb3BzKTogQ2xpZW50ZSB7XG4gICAgcmV0dXJuIG5ldyBDbGllbnRlKHJhdyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBub3JtYWxpemFyTm9tZShub21lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBub21lLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKVxuICAgICAgLm1hcChwID0+IHAuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwLnNsaWNlKDEpKVxuICAgICAgLmpvaW4oJyAnKS50cmltKCk7XG4gIH1cblxuICB3aXRoRW5kZXJlY28oZW5kZXJlY286IHN0cmluZyk6IENsaWVudGUge1xuICAgIHJldHVybiBDbGllbnRlLmZyb21EQih7IC4uLnRoaXMudG9KU09OKCksIGVuZGVyZWNvIH0pO1xuICB9XG5cbiAgdG9KU09OKCk6IENsaWVudGVQcm9wcyB7XG4gICAgcmV0dXJuIHsgaWQ6IHRoaXMuaWQsIG5vbWU6IHRoaXMubm9tZSwgdGVsZWZvbmU6IHRoaXMudGVsZWZvbmUsIGVuZGVyZWNvOiB0aGlzLmVuZGVyZWNvIH07XG4gIH1cbn1cbiIsICJleHBvcnQgdHlwZSBSZXN1bHQ8VCwgRSBleHRlbmRzIEVycm9yID0gRXJyb3I+ID1cbiAgfCB7IHJlYWRvbmx5IG9rOiB0cnVlOyByZWFkb25seSB2YWx1ZTogVCB9XG4gIHwgeyByZWFkb25seSBvazogZmFsc2U7IHJlYWRvbmx5IGVycm9yOiBFIH07XG5cbmV4cG9ydCBjb25zdCBvayA9IDxUPih2YWx1ZTogVCk6IFJlc3VsdDxULCBuZXZlcj4gPT4gKHsgb2s6IHRydWUsIHZhbHVlIH0pO1xuZXhwb3J0IGNvbnN0IGZhaWwgPSA8RSBleHRlbmRzIEVycm9yPihlcnJvcjogRSk6IFJlc3VsdDxuZXZlciwgRT4gPT4gKHsgb2s6IGZhbHNlLCBlcnJvciB9KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzT2s8VCwgRSBleHRlbmRzIEVycm9yPihyOiBSZXN1bHQ8VCwgRT4pOiByIGlzIHsgb2s6IHRydWU7IHZhbHVlOiBUIH0ge1xuICByZXR1cm4gci5vaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcDxUPihyOiBSZXN1bHQ8VD4sIGZhbGxiYWNrPzogVCk6IFQge1xuICBpZiAoci5vaykgcmV0dXJuIHIudmFsdWU7XG4gIGlmIChmYWxsYmFjayAhPT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsbGJhY2s7XG4gIHRocm93IHIuZXJyb3I7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0cnlBc3luYzxUPihmbjogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8UmVzdWx0PFQ+PiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG9rKGF3YWl0IGZuKCkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhaWwoZSBpbnN0YW5jZW9mIEVycm9yID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IE5ldHdvcmtFcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcblxuY29uc3QgU1VQQUJBU0VfVVJMID0gYXRvYignYUhSMGNITTZMeTl5Wm1KMFpIUjJjMjVtZEhsaVlYcG1iV1JpZHk1emRYQmhZbUZ6WlM1amJ3PT0nKTtcbmNvbnN0IFNVUEFCQVNFX0FOT04gPSBhdG9iKCdaWGxLYUdKSFkybFBhVXBKVlhwSk1VNXBTWE5KYmxJMVkwTkpOa2xyY0ZoV1EwbzVMbVY1U25Cak0wMXBUMmxLZW1SWVFtaFpiVVo2V2xOSmMwbHVTbXhhYVVrMlNXNUtiVmx1VW10a1NGcDZZbTFhTUdWWFNtaGxiVnAwV2tkS00wbHBkMmxqYlRseldsTkpOa2x0Um5WaU1qUnBURU5LY0ZsWVVXbFBha1V6VDBSRk5VMVVRWHBPYWtGelNXMVdOR05EU1RaTmFrRTFUbnBSTkU1cVRUSk5TREF1U0hjMk9HcFJSa1p0ZDB4bmRuZEdPWHBxYUdkV1YxQmpNMFF4VVRKd1ptZEJiakZVVVd4S1JWWjFOQT09Jyk7XG5jb25zdCBUSU1FT1VUX01TID0gMTBfMDAwO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1cGFiYXNlRmV0Y2hPcHRpb25zIGV4dGVuZHMgUmVxdWVzdEluaXQge1xuICB0aW1lb3V0PzogbnVtYmVyO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VGZXRjaChcbiAgcGF0aDogc3RyaW5nLFxuICBvcHRzOiBTdXBhYmFzZUZldGNoT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IHsgdGltZW91dCA9IFRJTUVPVVRfTVMsIC4uLmZldGNoT3B0cyB9ID0gb3B0cztcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgdGltZW91dCk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtTVVBBQkFTRV9BTk9OfWAsXG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgJ1ByZWZlcic6ICdyZXR1cm49cmVwcmVzZW50YXRpb24nLFxuICAgICAgLi4uKChmZXRjaE9wdHMuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSA/PyB7fSksXG4gICAgfTtcblxuICAgIHJldHVybiBhd2FpdCBmZXRjaChgJHtTVVBBQkFTRV9VUkx9JHtwYXRofWAsIHtcbiAgICAgIC4uLmZldGNoT3B0cyxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvciAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykge1xuICAgICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcignVGltZW91dDogc2Vydmlkb3Igblx1MDBFM28gcmVzcG9uZGV1JywgeyBwYXRoIH0pO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdFcnJvIGRlIHJlZGUnLCB7IHBhdGgsIGNhdXNlOiBTdHJpbmcoZSkgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VHZXQ8VD4oXG4gIHRhYmxlOiBzdHJpbmcsXG4gIHF1ZXJ5ID0gJydcbik6IFByb21pc2U8VFtdPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvcmVzdC92MS8ke3RhYmxlfSR7cXVlcnkgPyAnPycgKyBxdWVyeSA6ICcnfWApO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCkuY2F0Y2goKCkgPT4gJycpO1xuICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYEdFVCAke3RhYmxlfSBmYWxob3UgKCR7cmVzcC5zdGF0dXN9KWAsIHsgc3RhdHVzOiByZXNwLnN0YXR1cywgYm9keSB9KTtcbiAgfVxuICByZXR1cm4gcmVzcC5qc29uKCkgYXMgUHJvbWlzZTxUW10+O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VQb3N0PFQ+KFxuICB0YWJsZTogc3RyaW5nLFxuICBkYXRhOiBQYXJ0aWFsPFQ+XG4pOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IHN1cGFiYXNlRmV0Y2goYC9yZXN0L3YxLyR7dGFibGV9YCwge1xuICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICB9KTtcbiAgaWYgKCFyZXNwLm9rKSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3AudGV4dCgpO1xuICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYFBPU1QgJHt0YWJsZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xuICB9XG4gIGNvbnN0IHJvd3MgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBUW107XG4gIHJldHVybiByb3dzWzBdITtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN1cGFiYXNlUGF0Y2g8VD4oXG4gIHRhYmxlOiBzdHJpbmcsXG4gIHF1ZXJ5OiBzdHJpbmcsXG4gIGRhdGE6IFBhcnRpYWw8VD5cbik6IFByb21pc2U8VFtdPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvcmVzdC92MS8ke3RhYmxlfT8ke3F1ZXJ5fWAsIHtcbiAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gIH0pO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgUEFUQ0ggJHt0YWJsZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xuICB9XG4gIHJldHVybiByZXNwLmpzb24oKSBhcyBQcm9taXNlPFRbXT47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsRnVuY3Rpb248VD4obmFtZTogc3RyaW5nLCBib2R5OiB1bmtub3duKTogUHJvbWlzZTxUPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvZnVuY3Rpb25zL3YxLyR7bmFtZX1gLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gIH0pO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBlcnIgPSBhd2FpdCByZXNwLnRleHQoKTtcbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKGBFZGdlIEZ1bmN0aW9uICR7bmFtZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5OiBlcnIgfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3AuanNvbigpIGFzIFByb21pc2U8VD47XG59XG5cbmV4cG9ydCB7IFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfQU5PTiB9O1xuIiwgInR5cGUgTG9nTGV2ZWwgPSAnZGVidWcnIHwgJ2luZm8nIHwgJ3dhcm4nIHwgJ2Vycm9yJztcblxuaW50ZXJmYWNlIExvZ0VudHJ5IHtcbiAgbGV2ZWw6IExvZ0xldmVsO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xuICBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59XG5cbmNsYXNzIExvZ2dlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcHJlZml4OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHJlZml4ID0gJ0dlbGFtb3VyJykge1xuICAgIHRoaXMucHJlZml4ID0gcHJlZml4O1xuICB9XG5cbiAgcHJpdmF0ZSBsb2cobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xuICAgIGNvbnN0IGVudHJ5OiBMb2dFbnRyeSA9IHtcbiAgICAgIGxldmVsLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgY29udGV4dCxcbiAgICB9O1xuXG4gICAgY29uc3Qgc3R5bGUgPSB7XG4gICAgICBkZWJ1ZzogJ2NvbG9yOiAjNkI3MjgwJyxcbiAgICAgIGluZm86ICAnY29sb3I6ICMzQjgyRjYnLFxuICAgICAgd2FybjogICdjb2xvcjogI0Y1OUUwQicsXG4gICAgICBlcnJvcjogJ2NvbG9yOiAjRUY0NDQ0OyBmb250LXdlaWdodDogYm9sZCcsXG4gICAgfVtsZXZlbF07XG5cbiAgICBjb25zdCBmb3JtYXR0ZWQgPSBgWyR7dGhpcy5wcmVmaXh9XSAke2VudHJ5LnRpbWVzdGFtcH0gJHttZXNzYWdlfWA7XG5cbiAgICBpZiAobGV2ZWwgPT09ICdlcnJvcicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH0gZWxzZSBpZiAobGV2ZWwgPT09ICd3YXJuJykge1xuICAgICAgY29uc29sZS53YXJuKGAlYyR7Zm9ybWF0dGVkfWAsIHN0eWxlLCBjb250ZXh0ID8/ICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH1cbiAgfVxuXG4gIGRlYnVnKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgeyB0aGlzLmxvZygnZGVidWcnLCBtc2csIGN0eCk7IH1cbiAgaW5mbyhtc2c6IHN0cmluZywgY3R4PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkICB7IHRoaXMubG9nKCdpbmZvJywgIG1zZywgY3R4KTsgfVxuICB3YXJuKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgIHsgdGhpcy5sb2coJ3dhcm4nLCAgbXNnLCBjdHgpOyB9XG4gIGVycm9yKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgeyB0aGlzLmxvZygnZXJyb3InLCBtc2csIGN0eCk7IH1cblxuICBjaGlsZChwcmVmaXg6IHN0cmluZyk6IExvZ2dlciB7IHJldHVybiBuZXcgTG9nZ2VyKGAke3RoaXMucHJlZml4fToke3ByZWZpeH1gKTsgfVxufVxuXG5leHBvcnQgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuIiwgImltcG9ydCB0eXBlIHsgSUNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lDbGllbnRlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBDbGllbnRlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2NsaWVudGUnO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VHZXQsIHN1cGFiYXNlUG9zdCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdDbGllbnRlUmVwbycpO1xuXG5leHBvcnQgY2xhc3MgQ2xpZW50ZVJlcG9zaXRvcnkgaW1wbGVtZW50cyBJQ2xpZW50ZVJlcG9zaXRvcnkge1xuICBhc3luYyBmaW5kQnlUZWxlZm9uZSh0ZWxlZm9uZTogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZSB8IG51bGw+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZygnZmluZEJ5VGVsZWZvbmUnLCB7IHRlbGVmb25lOiBgKioqJHt0ZWxlZm9uZS5zbGljZSgtNCl9YCB9KTtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDxSZXR1cm5UeXBlPENsaWVudGVbJ3RvSlNPTiddPj4oXG4gICAgICAgICdjbGllbnRlcycsXG4gICAgICAgIGB0ZWxlZm9uZT1lcS4ke3RlbGVmb25lfSZsaW1pdD0xYFxuICAgICAgKTtcbiAgICAgIHJldHVybiByb3dzWzBdID8gQ2xpZW50ZS5mcm9tREIocm93c1swXSkgOiBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2F2ZShjbGllbnRlOiBDbGllbnRlKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZT4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gYXdhaXQgc3VwYWJhc2VQb3N0PFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+PihcbiAgICAgICAgJ2NsaWVudGVzJyxcbiAgICAgICAgY2xpZW50ZS50b0pTT04oKVxuICAgICAgKTtcbiAgICAgIHJldHVybiBDbGllbnRlLmZyb21EQihyb3cpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlRW5kZXJlY28oaWQ6IG51bWJlciwgZW5kZXJlY286IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlUGF0Y2goJ2NsaWVudGVzJywgYGlkPWVxLiR7aWR9YCwgeyBlbmRlcmVjbyB9KTtcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uL2NvcmUvZXJyb3JzJztcblxuZXhwb3J0IGludGVyZmFjZSBJdGVtUGVkaWRvIHtcbiAgcmVhZG9ubHkgbm9tZTogc3RyaW5nO1xuICByZWFkb25seSBwcmVjbzogbnVtYmVyO1xufVxuXG5leHBvcnQgdHlwZSBTdGF0dXNQZWRpZG8gPSAncGVuZGVudGUnIHwgJ2NvbmZpcm1hZG8nIHwgJ2NhbmNlbGFkbyc7XG5leHBvcnQgdHlwZSBTdGF0dXNQYWdhbWVudG8gPSAnYWd1YXJkYW5kbycgfCAncGFnbycgfCAnZmFsaG91JztcbmV4cG9ydCB0eXBlIFRpcG9QYWdhbWVudG8gPSAnUGl4JyB8ICdEaW5oZWlybycgfCAnQ2FydFx1MDBFM28nO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBlZGlkb1Byb3BzIHtcbiAgaWQ/OiBudW1iZXI7XG4gIG5vbWU6IHN0cmluZztcbiAgdGVsZWZvbmU6IHN0cmluZztcbiAgZW5kZXJlY286IHN0cmluZztcbiAgcGFnYW1lbnRvOiBUaXBvUGFnYW1lbnRvO1xuICBpdGVuczogSXRlbVBlZGlkb1tdO1xuICB0b3RhbDogbnVtYmVyO1xuICBzdGF0dXM6IFN0YXR1c1BlZGlkbztcbiAgc3RhdHVzX3BhZ2FtZW50bz86IFN0YXR1c1BhZ2FtZW50bztcbiAgb2JzZXJ2YWNhbz86IHN0cmluZztcbiAgYXNhYXNfcGF5bWVudF9pZD86IHN0cmluZztcbiAgY2xpZW50ZV9pZD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFBlZGlkbyB7XG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBwcm9wczogUGVkaWRvUHJvcHMpIHt9XG5cbiAgc3RhdGljIGNyZWF0ZShwcm9wczogT21pdDxQZWRpZG9Qcm9wcywgJ3N0YXR1cycgfCAndG90YWwnPik6IFBlZGlkbyB7XG4gICAgaWYgKCFwcm9wcy5pdGVucy5sZW5ndGgpIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1BlZGlkbyBkZXZlIHRlciBhbyBtZW5vcyAxIGl0ZW0nKTtcbiAgICBpZiAoIXByb3BzLm5vbWUudHJpbSgpKSB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdOb21lIG9icmlnYXRcdTAwRjNyaW8nKTtcbiAgICBpZiAoIXByb3BzLmVuZGVyZWNvLnRyaW0oKSkgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignRW5kZXJlXHUwMEU3byBvYnJpZ2F0XHUwMEYzcmlvJyk7XG4gICAgY29uc3QgdG90YWwgPSBwcm9wcy5pdGVucy5yZWR1Y2UoKHMsIGkpID0+IE1hdGgucm91bmQoKHMgKyBpLnByZWNvKSAqIDEwMCkgLyAxMDAsIDApO1xuICAgIHJldHVybiBuZXcgUGVkaWRvKHsgLi4ucHJvcHMsIHRvdGFsLCBzdGF0dXM6ICdwZW5kZW50ZScgfSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbURCKHJhdzogUGVkaWRvUHJvcHMpOiBQZWRpZG8geyByZXR1cm4gbmV3IFBlZGlkbyhyYXcpOyB9XG5cbiAgZ2V0IGlkKCk6IG51bWJlciB8IHVuZGVmaW5lZCB7IHJldHVybiB0aGlzLnByb3BzLmlkOyB9XG4gIGdldCB0b3RhbCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5wcm9wcy50b3RhbDsgfVxuICBnZXQgaXRlbnMoKTogcmVhZG9ubHkgSXRlbVBlZGlkb1tdIHsgcmV0dXJuIHRoaXMucHJvcHMuaXRlbnM7IH1cbiAgZ2V0IHBhZ2FtZW50bygpOiBUaXBvUGFnYW1lbnRvIHsgcmV0dXJuIHRoaXMucHJvcHMucGFnYW1lbnRvOyB9XG4gIGdldCBzdGF0dXNQYWdhbWVudG8oKTogU3RhdHVzUGFnYW1lbnRvIHwgdW5kZWZpbmVkIHsgcmV0dXJuIHRoaXMucHJvcHMuc3RhdHVzX3BhZ2FtZW50bzsgfVxuXG4gIGZvcm1hdGFyTWVuc2FnZW1XQSh3YU51bWJlcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBpdGVuc1N0ciA9IHRoaXMucHJvcHMuaXRlbnMubWFwKGkgPT5cbiAgICAgIGBcdTI1QjggJHtpLm5vbWV9IFx1MjAxNCBSJCAke2kucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX1gXG4gICAgKS5qb2luKCdcXG4nKTtcbiAgICBjb25zdCBtc2cgPSBbXG4gICAgICAnXHVEODNEXHVERUNEXHVGRTBGICpOT1ZPIFBFRElETyBcdTIwMTQgR0VMQU1PVVIqJyxcbiAgICAgICcnLFxuICAgICAgaXRlbnNTdHIsXG4gICAgICAnJyxcbiAgICAgIGAqVG90YWw6IFIkICR7dGhpcy5wcm9wcy50b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfSpgLFxuICAgICAgYCpQYWdhbWVudG86ICR7dGhpcy5wcm9wcy5wYWdhbWVudG99KmAsXG4gICAgICAnJyxcbiAgICAgIGBcdUQ4M0RcdURDNjQgJHt0aGlzLnByb3BzLm5vbWV9YCxcbiAgICAgIGBcdUQ4M0RcdURDQ0QgJHt0aGlzLnByb3BzLmVuZGVyZWNvfWAsXG4gICAgICB0aGlzLnByb3BzLm9ic2VydmFjYW8gPyBgXHVEODNEXHVEQ0REICR7dGhpcy5wcm9wcy5vYnNlcnZhY2FvfWAgOiAnJyxcbiAgICBdLmZpbHRlcihCb29sZWFuKS5qb2luKCdcXG4nKTtcbiAgICByZXR1cm4gYGh0dHBzOi8vd2EubWUvJHt3YU51bWJlcn0/dGV4dD0ke2VuY29kZVVSSUNvbXBvbmVudChtc2cpfWA7XG4gIH1cblxuICB0b0pTT04oKTogUGVkaWRvUHJvcHMgeyByZXR1cm4geyAuLi50aGlzLnByb3BzIH07IH1cbn1cbiIsICJpbXBvcnQgdHlwZSB7IElQZWRpZG9SZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lQZWRpZG9SZXBvc2l0b3J5JztcbmltcG9ydCB7IFBlZGlkbyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuaW1wb3J0IHR5cGUgeyBQZWRpZG9Qcm9wcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VGZXRjaCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfQU5PTiB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IE5ldHdvcmtFcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdQZWRpZG9SZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBQZWRpZG9SZXBvc2l0b3J5IGltcGxlbWVudHMgSVBlZGlkb1JlcG9zaXRvcnkge1xuICBhc3luYyBzYXZlKHBlZGlkbzogUGVkaWRvKTogUHJvbWlzZTxSZXN1bHQ8UGVkaWRvPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBsb2cuaW5mbygnU2FsdmFuZG8gcGVkaWRvJywgeyB0b3RhbDogcGVkaWRvLnRvdGFsIH0pO1xuICAgICAgLy8gVXNhIGhlYWRlcnMtb25seSBwYXJhIG9idGVyIG8gSUQgdmlhIExvY2F0aW9uXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgc3VwYWJhc2VGZXRjaChgL3Jlc3QvdjEvcGVkaWRvc2AsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ1ByZWZlcic6ICdyZXR1cm49aGVhZGVycy1vbmx5JyB9IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBlZGlkby50b0pTT04oKSksXG4gICAgICB9KTtcbiAgICAgIGlmICghcmVzcC5vaykge1xuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYFBPU1QgcGVkaWRvcyBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHkgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBsb2MgPSByZXNwLmhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpID8/ICcnO1xuICAgICAgY29uc3QgaWRNYXRjaCA9IGxvYy5tYXRjaCgvaWQ9ZXFcXC4oXFxkKykvKTtcbiAgICAgIGlmICghaWRNYXRjaCkgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcignSUQgZG8gcGVkaWRvIG5cdTAwRTNvIHJldG9ybmFkbycpO1xuICAgICAgY29uc3QgaWQgPSBwYXJzZUludChpZE1hdGNoWzFdISwgMTApO1xuICAgICAgcmV0dXJuIFBlZGlkby5mcm9tREIoeyAuLi5wZWRpZG8udG9KU09OKCksIGlkIH0gYXMgUGVkaWRvUHJvcHMpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlU3RhdHVzKGlkOiBudW1iZXIsIGNsaWVudGVJZDogbnVtYmVyLCBzdGF0dXM6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlUGF0Y2goXG4gICAgICAgICdwZWRpZG9zJyxcbiAgICAgICAgYGlkPWVxLiR7aWR9JmNsaWVudGVfaWQ9ZXEuJHtjbGllbnRlSWR9YCxcbiAgICAgICAgeyBzdGF0dXMgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRCeUlkKGlkOiBudW1iZXIpOiBQcm9taXNlPFJlc3VsdDxQZWRpZG8gfCBudWxsPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goXG4gICAgICAgIGAke1NVUEFCQVNFX1VSTH0vcmVzdC92MS9wZWRpZG9zP2lkPWVxLiR7aWR9JnNlbGVjdD1zdGF0dXNfcGFnYW1lbnRvYCxcbiAgICAgICAgeyBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtTVVBBQkFTRV9BTk9OfWAgfSB9XG4gICAgICApO1xuICAgICAgaWYgKCFyZXNwLm9rKSB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdHRVQgcGVkaWRvIGZhbGhvdScsIHsgc3RhdHVzOiByZXNwLnN0YXR1cyB9KTtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBQZWRpZG9Qcm9wc1tdO1xuICAgICAgcmV0dXJuIHJvd3NbMF0gPyBQZWRpZG8uZnJvbURCKHJvd3NbMF0pIDogbnVsbDtcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB0eXBlIHsgSVJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9yZXBvc2l0b3JpZXMvSVJvbGV0YVJlcG9zaXRvcnknO1xuaW1wb3J0IHR5cGUgeyBQYXJ0aWNpcGFjYW9Qcm9wcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9yb2xldGEnO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VHZXQsIHN1cGFiYXNlUG9zdCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdSb2xldGFSZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBSb2xldGFSZXBvc2l0b3J5IGltcGxlbWVudHMgSVJvbGV0YVJlcG9zaXRvcnkge1xuICBhc3luYyBmaW5kUGFydGljaXBhY2FvQXRpdmEoXG4gICAgdGVsZWZvbmU6IHN0cmluZyxcbiAgICBzZW1hbmE6IHN0cmluZ1xuICApOiBQcm9taXNlPFJlc3VsdDxQYXJ0aWNpcGFjYW9Qcm9wcyB8IG51bGw+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZygnZmluZFBhcnRpY2lwYWNhb0F0aXZhJywgeyBzZW1hbmEgfSk7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgc3VwYWJhc2VHZXQ8UGFydGljaXBhY2FvUHJvcHM+KFxuICAgICAgICAncm9sZXRhX3BhcnRpY2lwYWNvZXMnLFxuICAgICAgICBgdGVsZWZvbmU9ZXEuJHt0ZWxlZm9uZX0mc2VtYW5hPWVxLiR7c2VtYW5hfSZvcmRlcj1jcmVhdGVkX2F0LmRlc2MmbGltaXQ9MWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gcm93c1swXSA/PyBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVBhcnRpY2lwYWNhbyhcbiAgICBkYXRhOiBQYXJ0aWFsPFBhcnRpY2lwYWNhb1Byb3BzPlxuICApOiBQcm9taXNlPFJlc3VsdDxQYXJ0aWNpcGFjYW9Qcm9wcz4+IHtcbiAgICAvLyBTZSB0ZW0gaWQsIGZheiBQQVRDSDsgc2VuXHUwMEUzbyBJTlNFUlRcbiAgICBpZiAoZGF0YS5pZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB7IGlkLCAuLi5wYXRjaCB9ID0gZGF0YTtcbiAgICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHN1cGFiYXNlUGF0Y2g8UGFydGljaXBhY2FvUHJvcHM+KFxuICAgICAgICAgICdyb2xldGFfcGFydGljaXBhY29lcycsXG4gICAgICAgICAgYGlkPWVxLiR7aWR9YCxcbiAgICAgICAgICBwYXRjaFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gKHJvd3NbMF0gPz8geyAuLi5kYXRhIH0pIGFzIFBhcnRpY2lwYWNhb1Byb3BzO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0cnlBc3luYygoKSA9PlxuICAgICAgc3VwYWJhc2VQb3N0PFBhcnRpY2lwYWNhb1Byb3BzPigncm9sZXRhX3BhcnRpY2lwYWNvZXMnLCBkYXRhKVxuICAgICk7XG4gIH1cblxuICBhc3luYyBjb3VudFZlbmNlZG9yZXNTZW1hbmEoc2VtYW5hOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDxudW1iZXI+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDx7IGlkOiBudW1iZXIgfT4oXG4gICAgICAgICdyb2xldGFfdmVuY2Vkb3JlcycsXG4gICAgICAgIGBzZW1hbmE9ZXEuJHtzZW1hbmF9JnNlbGVjdD1pZGBcbiAgICAgICk7XG4gICAgICByZXR1cm4gcm93cy5sZW5ndGg7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzYXZlVmVuY2Vkb3IoXG4gICAgdGVsZWZvbmU6IHN0cmluZyxcbiAgICBub21lOiBzdHJpbmcsXG4gICAgcHJlbWlvOiBzdHJpbmcsXG4gICAgc2VtYW5hOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxSZXN1bHQ8dm9pZD4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc3VwYWJhc2VQb3N0KCdyb2xldGFfdmVuY2Vkb3JlcycsIHsgdGVsZWZvbmUsIG5vbWUsIHByZW1pbywgc2VtYW5hIH0pO1xuICAgIH0pO1xuICB9XG59XG4iLCAidHlwZSBIYW5kbGVyPFQ+ID0gKHBheWxvYWQ6IFQpID0+IHZvaWQ7XG5cbmludGVyZmFjZSBFdmVudE1hcCB7XG4gICdhdXRoOmxvZ2luJzogeyBjbGllbnRlOiBpbXBvcnQoJy4uL2RvbWFpbi9jbGllbnRlJykuQ2xpZW50ZSB9O1xuICAnYXV0aDpsb2dvdXQnOiB2b2lkO1xuICAnY2FydDp1cGRhdGVkJzogeyBjb3VudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH07XG4gICdwYXltZW50OnN1Y2Nlc3MnOiB7IHBlZGlkb0lkOiBudW1iZXI7IHZhbG9yOiBudW1iZXIgfTtcbiAgJ3BheW1lbnQ6ZmFpbGVkJzogeyBlcnJvcjogc3RyaW5nIH07XG4gICdyb2xldGE6cHJlbWlvJzogeyBwcmVtaW86IHN0cmluZyB9O1xuICAndWk6dG9hc3QnOiB7IG1lc3NhZ2U6IHN0cmluZzsgdGlwbzogJ29rJyB8ICdlcnJvJyB8ICdpbmZvJyB9O1xufVxuXG5jbGFzcyBUeXBlZEV2ZW50QnVzIHtcbiAgcHJpdmF0ZSBoYW5kbGVycyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8SGFuZGxlcjx1bmtub3duPj4+KCk7XG5cbiAgb248SyBleHRlbmRzIGtleW9mIEV2ZW50TWFwPihcbiAgICBldmVudDogSyxcbiAgICBoYW5kbGVyOiBIYW5kbGVyPEV2ZW50TWFwW0tdPlxuICApOiAoKSA9PiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaGFuZGxlcnMuaGFzKGV2ZW50KSkgdGhpcy5oYW5kbGVycy5zZXQoZXZlbnQsIG5ldyBTZXQoKSk7XG4gICAgdGhpcy5oYW5kbGVycy5nZXQoZXZlbnQpIS5hZGQoaGFuZGxlciBhcyBIYW5kbGVyPHVua25vd24+KTtcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5oYW5kbGVycy5nZXQoZXZlbnQpPy5kZWxldGUoaGFuZGxlciBhcyBIYW5kbGVyPHVua25vd24+KTtcbiAgfVxuXG4gIGVtaXQ8SyBleHRlbmRzIGtleW9mIEV2ZW50TWFwPihldmVudDogSywgcGF5bG9hZDogRXZlbnRNYXBbS10pOiB2b2lkIHtcbiAgICB0aGlzLmhhbmRsZXJzLmdldChldmVudCk/LmZvckVhY2goaCA9PiB7XG4gICAgICB0cnkgeyBoKHBheWxvYWQpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoYEV2ZW50QnVzIGVycm9yIG9uICR7ZXZlbnR9OmAsIGUpOyB9XG4gICAgfSk7XG4gIH1cblxuICBvbmNlPEsgZXh0ZW5kcyBrZXlvZiBFdmVudE1hcD4oXG4gICAgZXZlbnQ6IEssXG4gICAgaGFuZGxlcjogSGFuZGxlcjxFdmVudE1hcFtLXT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgdW5zdWIgPSB0aGlzLm9uKGV2ZW50LCAocGF5bG9hZCkgPT4geyBoYW5kbGVyKHBheWxvYWQpOyB1bnN1YigpOyB9KTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZXZlbnRCdXMgPSBuZXcgVHlwZWRFdmVudEJ1cygpO1xuIiwgInR5cGUgU2VsZWN0b3I8UywgVD4gPSAoc3RhdGU6IFMpID0+IFQ7XG50eXBlIExpc3RlbmVyPFQ+ID0gKHZhbHVlOiBUKSA9PiB2b2lkO1xuXG5leHBvcnQgY2xhc3MgU3RvcmU8UyBleHRlbmRzIG9iamVjdD4ge1xuICBwcml2YXRlIHN0YXRlOiBTO1xuICBwcml2YXRlIGxpc3RlbmVycyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8TGlzdGVuZXI8dW5rbm93bj4+PigpO1xuICBwcml2YXRlIGdsb2JhbExpc3RlbmVycyA9IG5ldyBTZXQ8TGlzdGVuZXI8Uz4+KCk7XG5cbiAgY29uc3RydWN0b3IoaW5pdGlhbFN0YXRlOiBTKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHsgLi4uaW5pdGlhbFN0YXRlIH07XG4gIH1cblxuICBnZXRTdGF0ZSgpOiBSZWFkb25seTxTPiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gIH1cblxuICBzZXRTdGF0ZSh1cGRhdGVyOiBQYXJ0aWFsPFM+IHwgKChzOiBSZWFkb25seTxTPikgPT4gUGFydGlhbDxTPikpOiB2b2lkIHtcbiAgICBjb25zdCBwYXRjaCA9IHR5cGVvZiB1cGRhdGVyID09PSAnZnVuY3Rpb24nXG4gICAgICA/IHVwZGF0ZXIodGhpcy5zdGF0ZSlcbiAgICAgIDogdXBkYXRlcjtcbiAgICB0aGlzLnN0YXRlID0geyAuLi50aGlzLnN0YXRlLCAuLi5wYXRjaCB9O1xuICAgIHRoaXMuZ2xvYmFsTGlzdGVuZXJzLmZvckVhY2gobCA9PiBsKHRoaXMuc3RhdGUpKTtcbiAgfVxuXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXI8Uz4pOiAoKSA9PiB2b2lkIHtcbiAgICB0aGlzLmdsb2JhbExpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICAgIHJldHVybiAoKSA9PiB0aGlzLmdsb2JhbExpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9XG5cbiAgc2VsZWN0PFQ+KHNlbGVjdG9yOiBTZWxlY3RvcjxTLCBUPiwgbGlzdGVuZXI6IExpc3RlbmVyPFQ+KTogKCkgPT4gdm9pZCB7XG4gICAgbGV0IHByZXYgPSBzZWxlY3Rvcih0aGlzLnN0YXRlKTtcbiAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmUoc3RhdGUgPT4ge1xuICAgICAgY29uc3QgbmV4dCA9IHNlbGVjdG9yKHN0YXRlKTtcbiAgICAgIGlmIChuZXh0ICE9PSBwcmV2KSB7XG4gICAgICAgIHByZXYgPSBuZXh0O1xuICAgICAgICBsaXN0ZW5lcihuZXh0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IFN0b3JlIH0gZnJvbSAnLi9TdG9yZSc7XG5pbXBvcnQgdHlwZSB7IENsaWVudGUgfSBmcm9tICcuLi9kb21haW4vY2xpZW50ZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwU3RhdGUge1xuICByZWFkb25seSBjbGllbnRlOiBDbGllbnRlIHwgbnVsbDtcbiAgcmVhZG9ubHkgaXNMb2dnZWRJbjogYm9vbGVhbjtcbiAgcmVhZG9ubHkgaXNBZG1pbjogYm9vbGVhbjtcbiAgcmVhZG9ubHkgY2FycmluaG9Db3VudDogbnVtYmVyO1xuICByZWFkb25seSBjYXJyaW5ob1RvdGFsOiBudW1iZXI7XG4gIHJlYWRvbmx5IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHBlZGlkb0lkUGVuZGVudGU6IG51bWJlciB8IG51bGw7XG4gIHJlYWRvbmx5IHBpeERhdGE6IFBpeERhdGEgfCBudWxsO1xuICByZWFkb25seSByb2xldGFBdGl2YTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQaXhEYXRhIHtcbiAgcmVhZG9ubHkgcXJDb2RlOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHBpeENvcGlhRUNvbGE6IHN0cmluZztcbiAgcmVhZG9ubHkgYXNhYXNQYXltZW50SWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgcGVkaWRvSWQ6IG51bWJlcjtcbn1cblxuY29uc3QgQURNSU5fVEVMID0gYXRvYignTVRFNU5EQTNOekkzTlRBPScpO1xuY29uc3QgQ09OVEFfVEVTVEUgPSBhdG9iKCdNVEU1TmpVd016QXdOelk9Jyk7XG5cbmZ1bmN0aW9uIGNhbGNJc0FkbWluKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWNsaWVudGUgJiYgY2xpZW50ZS50ZWxlZm9uZSA9PT0gQURNSU5fVEVMO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250YVRlc3RlKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWNsaWVudGUgJiYgY2xpZW50ZS50ZWxlZm9uZSA9PT0gQ09OVEFfVEVTVEU7XG59XG5cbmV4cG9ydCBjb25zdCBhcHBTdG9yZSA9IG5ldyBTdG9yZTxBcHBTdGF0ZT4oe1xuICBjbGllbnRlOiBudWxsLFxuICBpc0xvZ2dlZEluOiBmYWxzZSxcbiAgaXNBZG1pbjogZmFsc2UsXG4gIGNhcnJpbmhvQ291bnQ6IDAsXG4gIGNhcnJpbmhvVG90YWw6IDAsXG4gIHBhZ2FtZW50b1NlbGVjaW9uYWRvOiAnJyxcbiAgcGVkaWRvSWRQZW5kZW50ZTogbnVsbCxcbiAgcGl4RGF0YTogbnVsbCxcbiAgcm9sZXRhQXRpdmE6IGZhbHNlLFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDbGllbnRlKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHtcbiAgICBjbGllbnRlLFxuICAgIGlzTG9nZ2VkSW46ICEhY2xpZW50ZSxcbiAgICBpc0FkbWluOiBjYWxjSXNBZG1pbihjbGllbnRlKSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDYXJyaW5obyhjb3VudDogbnVtYmVyLCB0b3RhbDogbnVtYmVyKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgY2FycmluaG9Db3VudDogY291bnQsIGNhcnJpbmhvVG90YWw6IHRvdGFsIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UGFnYW1lbnRvKHRpcG86IHN0cmluZyk6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiB0aXBvIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UGl4RGF0YShkYXRhOiBQaXhEYXRhIHwgbnVsbCk6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBpeERhdGE6IGRhdGEgfSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBJQ2xpZW50ZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9yZXBvc2l0b3JpZXMvSUNsaWVudGVSZXBvc2l0b3J5JztcbmltcG9ydCB7IENsaWVudGUgfSBmcm9tICcuLi8uLi9kb21haW4vY2xpZW50ZSc7XG5pbXBvcnQgeyB0eXBlIFJlc3VsdCwgb2ssIGZhaWwsIHRyeUFzeW5jIH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgUmF0ZUxpbWl0RXJyb3IsIFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcbmltcG9ydCB7IGV2ZW50QnVzIH0gZnJvbSAnLi4vLi4vY29yZS9ldmVudHMnO1xuaW1wb3J0IHsgc2V0Q2xpZW50ZSB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0b3JlJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdMb2dpblVzZUNhc2UnKTtcblxuY29uc3QgU0VTU0lPTl9LRVkgPSAnZ2VsYW1vdXJfY2xpZW50ZSc7XG5jb25zdCBTRVNTSU9OX1RTX0tFWSA9ICdnZWxhbW91cl90cyc7XG5jb25zdCBTRVNTSU9OX1RUTF9NUyA9IDI0ICogNjAgKiA2MCAqIDEwMDA7XG5cbmludGVyZmFjZSBSYXRlTGltaXRlciB7XG4gIGF0dGVtcHRzOiBudW1iZXI7XG4gIGJsb2NrZWRVbnRpbDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgTG9naW5Vc2VDYXNlIHtcbiAgcHJpdmF0ZSByYXRlTGltaXRlcjogUmF0ZUxpbWl0ZXIgPSB7IGF0dGVtcHRzOiAwLCBibG9ja2VkVW50aWw6IDAgfTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNsaWVudGVSZXBvOiBJQ2xpZW50ZVJlcG9zaXRvcnkpIHt9XG5cbiAgcmVzdG9yZVNlc3Npb24oKTogQ2xpZW50ZSB8IG51bGwge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB0cyA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFNFU1NJT05fVFNfS0VZKSA/PyAnMCcpO1xuICAgICAgaWYgKERhdGUubm93KCkgLSB0cyA+IFNFU1NJT05fVFRMX01TKSB7XG4gICAgICAgIHRoaXMuY2xlYXJTZXNzaW9uKCk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgcmF3ID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShTRVNTSU9OX0tFWSk7XG4gICAgICBpZiAoIXJhdykgcmV0dXJuIG51bGw7XG4gICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShyYXcpIGFzIFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+O1xuICAgICAgY29uc3QgY2xpZW50ZSA9IENsaWVudGUuZnJvbURCKGRhdGEpO1xuICAgICAgc2V0Q2xpZW50ZShjbGllbnRlKTtcbiAgICAgIHJldHVybiBjbGllbnRlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy5jbGVhclNlc3Npb24oKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGV4ZWN1dGUodGVsZWZvbmU6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHsgZXhpc3RlOiBib29sZWFuOyBjbGllbnRlPzogQ2xpZW50ZSB9Pj4ge1xuICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5yYXRlTGltaXRlci5ibG9ja2VkVW50aWwpIHtcbiAgICAgIHJldHVybiBmYWlsKG5ldyBSYXRlTGltaXRFcnJvcih0aGlzLnJhdGVMaW1pdGVyLmJsb2NrZWRVbnRpbCAtIERhdGUubm93KCkpKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZWwgPSB0ZWxlZm9uZS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgIGlmICh0ZWwubGVuZ3RoIDwgMTApIHJldHVybiBmYWlsKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RlbGVmb25lIGludlx1MDBFMWxpZG8nKSk7XG5cbiAgICBsb2cuaW5mbygnVmVyaWZpY2FuZG8gdGVsZWZvbmUnLCB7IHRlbDogYCoqKiR7dGVsLnNsaWNlKC00KX1gIH0pO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2xpZW50ZVJlcG8uZmluZEJ5VGVsZWZvbmUodGVsKTtcblxuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICB0aGlzLnJhdGVMaW1pdGVyLmF0dGVtcHRzKys7XG4gICAgICBpZiAodGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cyA+PSA1KSB7XG4gICAgICAgIHRoaXMucmF0ZUxpbWl0ZXIuYmxvY2tlZFVudGlsID0gRGF0ZS5ub3coKSArIDYwXzAwMDtcbiAgICAgICAgdGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cyA9IDA7XG4gICAgICAgIHJldHVybiBmYWlsKG5ldyBSYXRlTGltaXRFcnJvcig2MF8wMDApKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWlsKHJlc3VsdC5lcnJvcik7XG4gICAgfVxuXG4gICAgdGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cyA9IDA7XG4gICAgcmV0dXJuIG9rKHsgZXhpc3RlOiAhIXJlc3VsdC52YWx1ZSwgY2xpZW50ZTogcmVzdWx0LnZhbHVlID8/IHVuZGVmaW5lZCB9KTtcbiAgfVxuXG4gIGFzeW5jIHJlZ2lzdGVyKG5vbWU6IHN0cmluZywgdGVsZWZvbmU6IHN0cmluZywgZW5kZXJlY286IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PENsaWVudGU+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGVudGl0eSA9IENsaWVudGUuY3JlYXRlKHsgbm9tZSwgdGVsZWZvbmUsIGVuZGVyZWNvIH0pO1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLmNsaWVudGVSZXBvLnNhdmUoZW50aXR5KTtcbiAgICAgIGlmICghc2F2ZWQub2spIHRocm93IHNhdmVkLmVycm9yO1xuICAgICAgcmV0dXJuIHNhdmVkLnZhbHVlO1xuICAgIH0pO1xuICB9XG5cbiAgbG9naW4oY2xpZW50ZTogQ2xpZW50ZSk6IHZvaWQge1xuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oU0VTU0lPTl9LRVksIEpTT04uc3RyaW5naWZ5KGNsaWVudGUudG9KU09OKCkpKTtcbiAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFNFU1NJT05fVFNfS0VZLCBTdHJpbmcoRGF0ZS5ub3coKSkpO1xuICAgIHNldENsaWVudGUoY2xpZW50ZSk7XG4gICAgZXZlbnRCdXMuZW1pdCgnYXV0aDpsb2dpbicsIHsgY2xpZW50ZSB9KTtcbiAgICBsb2cuaW5mbygnTG9naW4gcmVhbGl6YWRvJywgeyBpZDogY2xpZW50ZS5pZCB9KTtcbiAgfVxuXG4gIGxvZ291dCgpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFyU2Vzc2lvbigpO1xuICAgIHNldENsaWVudGUobnVsbCk7XG4gICAgZXZlbnRCdXMuZW1pdCgnYXV0aDpsb2dvdXQnLCB1bmRlZmluZWQgYXMgdW5rbm93biBhcyB2b2lkKTtcbiAgICBsb2cuaW5mbygnTG9nb3V0IHJlYWxpemFkbycpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhclNlc3Npb24oKTogdm9pZCB7XG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX0tFWSk7XG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX1RTX0tFWSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBldmVudEJ1cyB9IGZyb20gJy4uLy4uL2NvcmUvZXZlbnRzJztcbmltcG9ydCB7IHNldENhcnJpbmhvIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RvcmUnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBJdGVtUGVkaWRvIH0gZnJvbSAnLi4vLi4vZG9tYWluL3BlZGlkbyc7XG5cbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnQ2FydFNlcnZpY2UnKTtcblxuZXhwb3J0IGNsYXNzIENhcnRTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBpdGVtcyA9IG5ldyBNYXA8c3RyaW5nLCBJdGVtUGVkaWRvPigpO1xuXG4gIGFkZChub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pdGVtcy5oYXMobm9tZSkpIHJldHVybjtcbiAgICB0aGlzLml0ZW1zLnNldChub21lLCB7IG5vbWUsIHByZWNvOiBOdW1iZXIocHJlY28pIH0pO1xuICAgIHRoaXMubm90aWZ5KCk7XG4gICAgbG9nLmRlYnVnKCdJdGVtIGFkaWNpb25hZG8nLCB7IG5vbWUgfSk7XG4gIH1cblxuICByZW1vdmUobm9tZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLml0ZW1zLmhhcyhub21lKSkgcmV0dXJuO1xuICAgIHRoaXMuaXRlbXMuZGVsZXRlKG5vbWUpO1xuICAgIHRoaXMubm90aWZ5KCk7XG4gICAgbG9nLmRlYnVnKCdJdGVtIHJlbW92aWRvJywgeyBub21lIH0pO1xuICB9XG5cbiAgdG9nZ2xlKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6ICdhZGRlZCcgfCAncmVtb3ZlZCcge1xuICAgIGlmICh0aGlzLml0ZW1zLmhhcyhub21lKSkge1xuICAgICAgdGhpcy5yZW1vdmUobm9tZSk7XG4gICAgICByZXR1cm4gJ3JlbW92ZWQnO1xuICAgIH1cbiAgICB0aGlzLmFkZChub21lLCBwcmVjbyk7XG4gICAgcmV0dXJuICdhZGRlZCc7XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zLmNsZWFyKCk7XG4gICAgdGhpcy5ub3RpZnkoKTtcbiAgfVxuXG4gIGdldEl0ZW1zKCk6IHJlYWRvbmx5IEl0ZW1QZWRpZG9bXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5pdGVtcy52YWx1ZXMoKSk7XG4gIH1cblxuICBnZXRUb3RhbCgpOiBudW1iZXIge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuaXRlbXMudmFsdWVzKCkpXG4gICAgICAucmVkdWNlKChzdW0sIGkpID0+IE1hdGgucm91bmQoKHN1bSArIGkucHJlY28pICogMTAwKSAvIDEwMCwgMCk7XG4gIH1cblxuICBnZXRDb3VudCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5pdGVtcy5zaXplOyB9XG5cbiAgaGFzKG5vbWU6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pdGVtcy5oYXMobm9tZSk7IH1cblxuICBpc0VtcHR5KCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pdGVtcy5zaXplID09PSAwOyB9XG5cbiAgcmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcDogTWFwPHN0cmluZywgbnVtYmVyPik6IHZvaWQge1xuICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdGVtLCBrZXkpID0+IHtcbiAgICAgIGNvbnN0IHJlYWxQcmljZSA9IHByaWNlTWFwLmdldChrZXkpO1xuICAgICAgaWYgKHJlYWxQcmljZSAhPT0gdW5kZWZpbmVkICYmIHJlYWxQcmljZSAhPT0gaXRlbS5wcmVjbykge1xuICAgICAgICB0aGlzLml0ZW1zLnNldChrZXksIHsgLi4uaXRlbSwgcHJlY286IHJlYWxQcmljZSB9KTtcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgIGxvZy53YXJuKCdQcmVcdTAwRTdvIHJldmFsaWRhZG8nLCB7IG5vbWU6IGtleSwgb2xkOiBpdGVtLnByZWNvLCBuZXc6IHJlYWxQcmljZSB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoY2hhbmdlZCkgdGhpcy5ub3RpZnkoKTtcbiAgfVxuXG4gIHByaXZhdGUgbm90aWZ5KCk6IHZvaWQge1xuICAgIHNldENhcnJpbmhvKHRoaXMuZ2V0Q291bnQoKSwgdGhpcy5nZXRUb3RhbCgpKTtcbiAgICBldmVudEJ1cy5lbWl0KCdjYXJ0OnVwZGF0ZWQnLCB7IGNvdW50OiB0aGlzLmdldENvdW50KCksIHRvdGFsOiB0aGlzLmdldFRvdGFsKCkgfSk7XG4gIH1cbn1cbiIsICIvLyBDb21wb3NpdGlvbiBSb290IFx1MjAxNCBpbnN0YW5jaWEgZSBpbmpldGEgZGVwZW5kXHUwMEVBbmNpYXNcbmltcG9ydCB7IENsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9DbGllbnRlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQZWRpZG9SZXBvc2l0b3J5IH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9QZWRpZG9SZXBvc2l0b3J5JztcbmltcG9ydCB7IFJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL1JvbGV0YVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgTG9naW5Vc2VDYXNlIH0gZnJvbSAnLi9hcHBsaWNhdGlvbi9hdXRoL0xvZ2luVXNlQ2FzZSc7XG5pbXBvcnQgeyBDYXJ0U2VydmljZSB9IGZyb20gJy4vYXBwbGljYXRpb24vY2FydC9DYXJ0U2VydmljZSc7XG5cbmNvbnN0IGNsaWVudGVSZXBvc2l0b3J5ID0gbmV3IENsaWVudGVSZXBvc2l0b3J5KCk7XG5jb25zdCBwZWRpZG9SZXBvc2l0b3J5ID0gbmV3IFBlZGlkb1JlcG9zaXRvcnkoKTtcbmNvbnN0IHJvbGV0YVJlcG9zaXRvcnkgPSBuZXcgUm9sZXRhUmVwb3NpdG9yeSgpO1xuXG5leHBvcnQgY29uc3QgbG9naW5Vc2VDYXNlID0gbmV3IExvZ2luVXNlQ2FzZShjbGllbnRlUmVwb3NpdG9yeSk7XG5leHBvcnQgY29uc3QgY2FydFNlcnZpY2UgPSBuZXcgQ2FydFNlcnZpY2UoKTtcblxuZXhwb3J0IHsgY2xpZW50ZVJlcG9zaXRvcnksIHBlZGlkb1JlcG9zaXRvcnksIHJvbGV0YVJlcG9zaXRvcnkgfTtcbiIsICJpbXBvcnQgdHlwZSB7IFJvbGV0YUNvbmZpZyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuLi9jb250YWluZXInO1xuaW1wb3J0IHsgUm9sZXRhRG9tYWluIH0gZnJvbSAnLi4vZG9tYWluL3JvbGV0YSc7XG5pbXBvcnQgeyBzdXBhYmFzZUdldCB9IGZyb20gJy4uL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL2NsaWVudCc7XG5pbXBvcnQgeyBnZXRTZW1hbmFBdHVhbCB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBlc2NIVE1MIH0gZnJvbSAnLi4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgbW9zdHJhclRvYXN0IH0gZnJvbSAnLi4vdXRpbHMvdG9hc3QnO1xuaW1wb3J0IHsgaXNDb250YVRlc3RlIH0gZnJvbSAnLi4vc3RhdGUvQXBwU3RvcmUnO1xuaW1wb3J0IHsgYXBwU3RvcmUgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdG9yZSc7XG5pbXBvcnQgdHlwZSB7IENsaWVudGUgfSBmcm9tICcuLi90eXBlcyc7XG5cbmNvbnN0IFBSRU1JT1NfUEFEUkFPOiBzdHJpbmdbXSA9IFtcbiAgJ1x1RDgzQ1x1REY4MSA1JSBPRkYgXHUyMDE0IENvbXByYXMgYWNpbWEgZGUgUiQzNScsXG4gICdcdUQ4M0NcdURGNkIgQnJvd25pZSBUcmFkaWNpb25hbCBHclx1MDBFMXRpcyBcdTIwMTQgQ29tcHJhcyBhY2ltYSBkZSBSJDUwJyxcbiAgJ1x1RDgzQ1x1REY4MSAxMCUgT0ZGIFx1MjAxNCBDb21wcmFzIGFjaW1hIGRlIFIkNTAnLFxuICAnXHVEODNEXHVEQ0Y4IFNpZ2EgYSBHZWxhbW91ciBubyBJbnN0YWdyYW0nLFxuICAnXHVEODNEXHVERUNEXHVGRTBGIENvbXByZSAyIGUgTGV2ZSBcdTIwMTQgQXRcdTAwRTkgUiQxNCBlbSBwcm9kdXRvcycsXG4gICdcdUQ4M0RcdURFMTUgTlx1MDBFM28gRm9pIERlc3NhIFZleiBcdTIwMTQgR2FuaGEgNSUgT0ZGIGFjaW1hIGRlIFIkMzUnLFxuXTtcblxubGV0IF9wcmVtaW9zOiBzdHJpbmdbXSA9IFsuLi5QUkVNSU9TX1BBRFJBT107XG5sZXQgX3JvdGFjYW9BdHVhbCA9IDA7XG5sZXQgX2dpcmFuZG8gPSBmYWxzZTtcbmxldCBfcGFydGljaXBhY2FvSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJlbWlvc1BhZHJhbygpOiBzdHJpbmdbXSB7IHJldHVybiBQUkVNSU9TX1BBRFJBTzsgfVxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZW1pb3MoKTogc3RyaW5nW10geyByZXR1cm4gX3ByZW1pb3M7IH1cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcmVtaW9zKHA6IHN0cmluZ1tdKTogdm9pZCB7IF9wcmVtaW9zID0gcDsgfVxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcnRpY2lwYWNhb0lkKCk6IG51bWJlciB8IG51bGwgeyByZXR1cm4gX3BhcnRpY2lwYWNhb0lkOyB9XG5leHBvcnQgZnVuY3Rpb24gc2V0UGFydGljaXBhY2FvSWQoaWQ6IG51bWJlciB8IG51bGwpOiB2b2lkIHsgX3BhcnRpY2lwYWNhb0lkID0gaWQ7IH1cbmV4cG9ydCBmdW5jdGlvbiBpc0dpcmFuZG8oKTogYm9vbGVhbiB7IHJldHVybiBfZ2lyYW5kbzsgfVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJDb25maWcoKTogUHJvbWlzZTxSb2xldGFDb25maWcgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgcm93cyA9IGF3YWl0IHN1cGFiYXNlR2V0PFJvbGV0YUNvbmZpZz4oJ3JvbGV0YV9jb25maWcnLCAnaWQ9ZXEuMSZsaW1pdD0xJyk7XG4gICAgaWYgKHJvd3NbMF0pIHtcbiAgICAgIF9wcmVtaW9zID0gQXJyYXkuaXNBcnJheShyb3dzWzBdLnByZW1pb3MpID8gcm93c1swXS5wcmVtaW9zIDogUFJFTUlPU19QQURSQU87XG4gICAgfVxuICAgIHJldHVybiByb3dzWzBdID8/IG51bGw7XG4gIH0gY2F0Y2ggeyByZXR1cm4gbnVsbDsgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyU3RhdHVzKGNsaWVudGVJZDogbnVtYmVyKTogUHJvbWlzZTxpbXBvcnQoJy4uL2RvbWFpbi9yb2xldGEnKS5QYXJ0aWNpcGFjYW9Qcm9wcyB8IG51bGw+IHtcbiAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5maW5kUGFydGljaXBhY2FvQXRpdmEoU3RyaW5nKGNsaWVudGVJZCksIHNlbWFuYSk7XG4gIGlmICghcmVzdWx0Lm9rKSByZXR1cm4gbnVsbDtcbiAgaWYgKHJlc3VsdC52YWx1ZSkgX3BhcnRpY2lwYWNhb0lkID0gcmVzdWx0LnZhbHVlLmlkO1xuICByZXR1cm4gcmVzdWx0LnZhbHVlO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2lyYXIoXG4gIGNsaWVudGU6IENsaWVudGUsXG4gIG9uUmVzdWx0YWRvOiAocHJlbWlvOiBzdHJpbmcsIGluZGljZTogbnVtYmVyKSA9PiB2b2lkXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKF9naXJhbmRvKSByZXR1cm47XG5cbiAgY29uc3Qgc3RhdGUgPSBhcHBTdG9yZS5nZXRTdGF0ZSgpO1xuICBpZiAoIWlzQ29udGFUZXN0ZShzdGF0ZS5jbGllbnRlKSkge1xuICAgIG1vc3RyYXJUb2FzdCgnXHVEODNEXHVERUE3IFJvbGV0YSBlbSBicmV2ZSEgRXN0YW1vcyBmaW5hbGl6YW5kbyBvcyBcdTAwRkFsdGltb3MgZGV0YWxoZXMuIFx1RDgzQ1x1REZBMScsICdpbmZvJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgX2dpcmFuZG8gPSB0cnVlO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGlmIChidG4pIHsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnRleHRDb250ZW50ID0gJ0dpcmFuZG8uLi4nOyB9XG5cbiAgY29uc3QgbiA9IF9wcmVtaW9zLmxlbmd0aDtcbiAgY29uc3QgYXJjID0gMzYwIC8gbjtcbiAgY29uc3QgaW5kaWNlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbik7XG4gIGNvbnN0IHZvbHRhc0V4dHJhcyA9IDUgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1KTtcbiAgY29uc3QgYW5ndWxvQWx2byA9IHZvbHRhc0V4dHJhcyAqIDM2MCArICgzNjAgLSBhcmMgKiBpbmRpY2UgLSBhcmMgLyAyKTtcbiAgY29uc3Qgcm90YWNhb0ZpbmFsID0gX3JvdGFjYW9BdHVhbCArIGFuZ3Vsb0Fsdm87XG5cbiAgY29uc3Qgcm9kYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFSb2RhJyk7XG4gIGlmIChyb2RhKSB7XG4gICAgcm9kYS5zdHlsZS50cmFuc2l0aW9uID0gJ3RyYW5zZm9ybSA0cyBjdWJpYy1iZXppZXIoMC4xNywgMC42NywgMC4xMiwgMSknO1xuICAgIHJvZGEuc3R5bGUudHJhbnNmb3JtT3JpZ2luID0gJzIwMHB4IDIwMHB4JztcbiAgICByb2RhLnN0eWxlLnRyYW5zZm9ybSA9IGByb3RhdGUoJHtyb3RhY2FvRmluYWx9ZGVnKWA7XG4gIH1cblxuICBfcm90YWNhb0F0dWFsID0gKChyb3RhY2FvRmluYWwgJSAzNjApICsgMzYwKSAlIDM2MDtcblxuICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNDIwMCkpO1xuXG4gIGNvbnN0IHByZW1pbyA9IF9wcmVtaW9zW2luZGljZV0hO1xuICBfZ2lyYW5kbyA9IGZhbHNlO1xuXG4gIG9uUmVzdWx0YWRvKHByZW1pbywgaW5kaWNlKTtcblxuICBpZiAoaXNDb250YVRlc3RlKHN0YXRlLmNsaWVudGUpICYmIGJ0bikge1xuICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIGJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGQTEgR0lSQVIgQUdPUkEhJztcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2FsdmFyVmVuY2Vkb3IoY2xpZW50ZTogQ2xpZW50ZSwgcHJlbWlvOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKGlzQ29udGFUZXN0ZShhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUpKSByZXR1cm47XG4gIGlmICghX3BhcnRpY2lwYWNhb0lkKSByZXR1cm47XG5cbiAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcblxuICBjb25zdCBwYXRjaFJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuc2F2ZVBhcnRpY2lwYWNhbyh7XG4gICAgaWQ6IF9wYXJ0aWNpcGFjYW9JZCxcbiAgICBqYV9naXJvdTogdHJ1ZSxcbiAgICBwcmVtaW8sXG4gIH0gYXMgaW1wb3J0KCcuLi9kb21haW4vcm9sZXRhJykuUGFydGljaXBhY2FvUHJvcHMpO1xuXG4gIGlmICghcGF0Y2hSZXN1bHQub2spIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvIGFvIGF0dWFsaXphciBwYXJ0aWNpcGFcdTAwRTdcdTAwRTNvOicsIHBhdGNoUmVzdWx0LmVycm9yKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB2ZW5jZWRvclJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuc2F2ZVZlbmNlZG9yKFxuICAgIGNsaWVudGUudGVsZWZvbmUsXG4gICAgY2xpZW50ZS5ub21lLFxuICAgIHByZW1pbyxcbiAgICBzZW1hbmFcbiAgKTtcblxuICBpZiAoIXZlbmNlZG9yUmVzdWx0Lm9rKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJybyBhbyBzYWx2YXIgdmVuY2Vkb3I6JywgdmVuY2Vkb3JSZXN1bHQuZXJyb3IpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXNlbmhhclJvbGV0YShwcmVtaW9zOiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCB3cmFwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJvbGV0YS1wb2ludGVyLXdyYXAnKTtcbiAgaWYgKCF3cmFwKSByZXR1cm47XG4gIGNvbnN0IG9sZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFDYW52YXMnKTtcbiAgaWYgKG9sZCkgb2xkLnJlbW92ZSgpO1xuXG4gIGNvbnN0IE4gPSBwcmVtaW9zLmxlbmd0aDtcbiAgY29uc3QgQ1ggPSAyMDAsIENZID0gMjAwLCBSID0gMTY0LCBSX0xFRCA9IDE4MiwgUl9PVVRFUiA9IDE5NjtcbiAgY29uc3QgU0VHID0gMzYwIC8gTjtcbiAgY29uc3QgQ09SRVMgPSBbXG4gICAgeyBiZzogJyNGQUYwRjInLCB0eHQ6ICcjQjUxMzRGJyB9LFxuICAgIHsgYmc6ICcjRTg1MjhBJywgdHh0OiAnI0ZGRkZGRicgfSxcbiAgXSBhcyBjb25zdDtcblxuICBjb25zdCByYWQgPSAoZDogbnVtYmVyKTogbnVtYmVyID0+IGQgKiBNYXRoLlBJIC8gMTgwO1xuICBjb25zdCBwdCA9IChkOiBudW1iZXIsIHI6IG51bWJlcik6IFtudW1iZXIsIG51bWJlcl0gPT4gW0NYICsgciAqIE1hdGguY29zKHJhZChkKSksIENZICsgciAqIE1hdGguc2luKHJhZChkKSldO1xuICBjb25zdCBlc2MgPSAoczogc3RyaW5nKTogc3RyaW5nID0+IHMucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xuXG4gIGZ1bmN0aW9uIHNlZ1BhdGgoaTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBjb25zdCBzID0gU0VHICogaSAtIDkwLCBlID0gcyArIFNFRztcbiAgICBjb25zdCBbeDEsIHkxXSA9IHB0KHMsIFIpLCBbeDIsIHkyXSA9IHB0KGUsIFIpO1xuICAgIHJldHVybiBgTSR7Q1h9LCR7Q1l9IEwke3gxLnRvRml4ZWQoMil9LCR7eTEudG9GaXhlZCgyKX0gQSR7Un0sJHtSfSAwIDAsMSAke3gyLnRvRml4ZWQoMil9LCR7eTIudG9GaXhlZCgyKX0gWmA7XG4gIH1cblxuICBmdW5jdGlvbiB3cmFwV29yZHModGV4dDogc3RyaW5nLCBtYXhDaGFyczogbnVtYmVyKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHdvcmRzID0gdGV4dC5zcGxpdCgnICcpO1xuICAgIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBjdXIgPSAnJztcbiAgICB3b3Jkcy5mb3JFYWNoKHcgPT4ge1xuICAgICAgY29uc3QgdGVzdCA9IGN1ciA/IGAke2N1cn0gJHt3fWAgOiB3O1xuICAgICAgaWYgKHRlc3QubGVuZ3RoID4gbWF4Q2hhcnMgJiYgY3VyKSB7IGxpbmVzLnB1c2goY3VyKTsgY3VyID0gdzsgfVxuICAgICAgZWxzZSBjdXIgPSB0ZXN0O1xuICAgIH0pO1xuICAgIGlmIChjdXIpIGxpbmVzLnB1c2goY3VyKTtcbiAgICByZXR1cm4gbGluZXMuc2xpY2UoMCwgMyk7XG4gIH1cblxuICBjb25zdCBzZWdzID0gcHJlbWlvcy5tYXAoKF8sIGkpID0+IHtcbiAgICBjb25zdCBjID0gQ09SRVNbaSAlIDJdITtcbiAgICByZXR1cm4gYDxwYXRoIGQ9XCIke3NlZ1BhdGgoaSl9XCIgZmlsbD1cIiR7Yy5iZ31cIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHNoYXBlLXJlbmRlcmluZz1cImdlb21ldHJpY1ByZWNpc2lvblwiLz5gO1xuICB9KS5qb2luKCcnKTtcblxuICBjb25zdCBzcG9rZXMgPSBwcmVtaW9zLm1hcCgoXywgaSkgPT4ge1xuICAgIGNvbnN0IGQgPSBTRUcgKiBpIC0gOTA7XG4gICAgY29uc3QgW3gsIHldID0gcHQoZCwgUik7XG4gICAgcmV0dXJuIGA8bGluZSB4MT1cIiR7Q1h9XCIgeTE9XCIke0NZfVwiIHgyPVwiJHt4LnRvRml4ZWQoMil9XCIgeTI9XCIke3kudG9GaXhlZCgyKX1cIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiMlwiLz5gO1xuICB9KS5qb2luKCcnKTtcblxuICBjb25zdCB0ZXh0cyA9IHByZW1pb3MubWFwKChwLCBpKSA9PiB7XG4gICAgY29uc3QgbWlkID0gU0VHICogaSAtIDkwICsgU0VHIC8gMjtcbiAgICBjb25zdCBbdHgsIHR5XSA9IHB0KG1pZCwgUiAqIDAuNTcpO1xuICAgIGNvbnN0IGMgPSBDT1JFU1tpICUgMl0hO1xuICAgIGNvbnN0IG0gPSBwLm1hdGNoKC9eKFxcUyspXFxzKyguKykkLyk7XG4gICAgY29uc3QgZW1vamkgPSBtID8gbVsxXSEgOiAnJztcbiAgICBjb25zdCByZXN0ID0gbSA/IG1bMl0hIDogcDtcbiAgICBjb25zdCBsaW5lcyA9IHdyYXBXb3JkcyhyZXN0LCAxMyk7XG4gICAgY29uc3QgbGluZUggPSAxMS41O1xuICAgIGNvbnN0IHRvdGFsVHh0SCA9IGxpbmVzLmxlbmd0aCAqIGxpbmVIO1xuICAgIGNvbnN0IGVtb2ppWSA9IC0odG90YWxUeHRIIC8gMikgLSAxMTtcbiAgICBjb25zdCByb3QgPSAobWlkICsgOTApLnRvRml4ZWQoMSk7XG4gICAgcmV0dXJuIGA8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoJHt0eC50b0ZpeGVkKDIpfSwke3R5LnRvRml4ZWQoMil9KSByb3RhdGUoJHtyb3R9KVwiIHRleHQtcmVuZGVyaW5nPVwiZ2VvbWV0cmljUHJlY2lzaW9uXCI+XG4gIDx0ZXh0IHg9XCIwXCIgeT1cIiR7ZW1vamlZLnRvRml4ZWQoMSl9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBkb21pbmFudC1iYXNlbGluZT1cIm1pZGRsZVwiIGZvbnQtc2l6ZT1cIjE1XCIgZm9udC1mYW1pbHk9XCJzZXJpZlwiPiR7ZXNjKGVtb2ppKX08L3RleHQ+XG4gICR7bGluZXMubWFwKChsLCBsaSkgPT4ge1xuICAgIGNvbnN0IHlwID0gKChsaSAtIChsaW5lcy5sZW5ndGggLSAxKSAvIDIpICogbGluZUgpLnRvRml4ZWQoMSk7XG4gICAgcmV0dXJuIGA8dGV4dCB4PVwiMFwiIHk9XCIke3lwfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmaWxsPVwiJHtjLnR4dH1cIiBmb250LWZhbWlseT1cIidETSBTYW5zJyxBcmlhbCxzYW5zLXNlcmlmXCIgZm9udC13ZWlnaHQ9XCI3MDBcIiBmb250LXNpemU9XCI5XCI+JHtlc2MobCl9PC90ZXh0PmA7XG4gIH0pLmpvaW4oJ1xcbiAgJyl9XG48L2c+YDtcbiAgfSkuam9pbignJyk7XG5cbiAgY29uc3QgTEVEX04gPSAzMDtcbiAgY29uc3QgbGVkcyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IExFRF9OIH0sIChfLCBpKSA9PiB7XG4gICAgY29uc3QgW2x4LCBseV0gPSBwdCgoMzYwIC8gTEVEX04pICogaSAtIDkwLCBSX0xFRCk7XG4gICAgcmV0dXJuIGA8Y2lyY2xlIGN4PVwiJHtseC50b0ZpeGVkKDIpfVwiIGN5PVwiJHtseS50b0ZpeGVkKDIpfVwiIHI9XCI1LjVcIiBjbGFzcz1cInItbGVkIHItbGVkLSR7aSAlIDJ9XCIvPmA7XG4gIH0pLmpvaW4oJycpO1xuXG4gIGNvbnN0IHN2ZyA9IGA8c3ZnIGlkPVwicm9sZXRhQ2FudmFzXCIgdmlld0JveD1cIjAgMCA0MDAgNDAwXCJcbiAgc3R5bGU9XCJ3aWR0aDptaW4oODZ2dywzNDBweCk7aGVpZ2h0Om1pbig4NnZ3LDM0MHB4KTtkaXNwbGF5OmJsb2NrO2ZpbHRlcjpkcm9wLXNoYWRvdygwIDZweCAyMHB4IHJnYmEoMCwwLDAsLjQyKSlcIlxuICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+XG4gIDxkZWZzPlxuICAgIDxyYWRpYWxHcmFkaWVudCBpZD1cInJnLXJpbmdcIiBjeD1cIjUwJVwiIGN5PVwiNTAlXCIgcj1cIjUwJVwiPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiNzAlXCIgc3RvcC1jb2xvcj1cIiNENDJCNzNcIi8+XG4gICAgICA8c3RvcCBvZmZzZXQ9XCIxMDAlXCIgc3RvcC1jb2xvcj1cIiM2QTA4MkVcIi8+XG4gICAgPC9yYWRpYWxHcmFkaWVudD5cbiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9XCJyZy1jdHJcIiBjeD1cIjM1JVwiIGN5PVwiMzAlXCIgcj1cIjcwJVwiPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiMCVcIiBzdG9wLWNvbG9yPVwiI0ZGRTU3QVwiLz5cbiAgICAgIDxzdG9wIG9mZnNldD1cIjQ4JVwiIHN0b3AtY29sb3I9XCIjRDRBRjM3XCIvPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiMTAwJVwiIHN0b3AtY29sb3I9XCIjN0E1ODAwXCIvPlxuICAgIDwvcmFkaWFsR3JhZGllbnQ+XG4gICAgPGZpbHRlciBpZD1cImYtZ2xvd1wiIHg9XCItNjAlXCIgeT1cIi02MCVcIiB3aWR0aD1cIjIyMCVcIiBoZWlnaHQ9XCIyMjAlXCI+XG4gICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPVwiMi41XCIgcmVzdWx0PVwiYlwiLz5cbiAgICAgIDxmZU1lcmdlPjxmZU1lcmdlTm9kZSBpbj1cImJcIi8+PGZlTWVyZ2VOb2RlIGluPVwiU291cmNlR3JhcGhpY1wiLz48L2ZlTWVyZ2U+XG4gICAgPC9maWx0ZXI+XG4gIDwvZGVmcz5cbiAgPGNpcmNsZSBjeD1cIiR7Q1h9XCIgY3k9XCIke0NZfVwiIHI9XCIke1JfT1VURVJ9XCIgZmlsbD1cInVybCgjcmctcmluZylcIi8+XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiJHtSX09VVEVSfVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiI0Q0QUYzN1wiIHN0cm9rZS13aWR0aD1cIjMuNVwiLz5cbiAgPGcgaWQ9XCJyb2xldGFSb2RhXCI+JHtzZWdzfSR7c3Bva2VzfSR7dGV4dHN9PC9nPlxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIiR7UiArIDF9XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiM1wiLz5cbiAgJHtsZWRzfVxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIjQyXCIgZmlsbD1cInVybCgjcmctY3RyKVwiIHN0cm9rZT1cIiNGRkZcIiBzdHJva2Utd2lkdGg9XCIzLjVcIiBmaWx0ZXI9XCJ1cmwoI2YtZ2xvdylcIi8+XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiMzhcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cInJnYmEoMjU1LDI1NSwyNTUsMC4zNSlcIiBzdHJva2Utd2lkdGg9XCIxLjVcIi8+XG4gIDx0ZXh0IHg9XCIke0NYfVwiIHk9XCIke0NZIC0gN31cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGRvbWluYW50LWJhc2VsaW5lPVwibWlkZGxlXCIgZmlsbD1cIiNGRkZcIiBmb250LWZhbWlseT1cIidETSBTYW5zJyxBcmlhbCxzYW5zLXNlcmlmXCIgZm9udC13ZWlnaHQ9XCI4MDBcIiBmb250LXNpemU9XCIxMlwiIGxldHRlci1zcGFjaW5nPVwiMS41XCIgdGV4dC1yZW5kZXJpbmc9XCJnZW9tZXRyaWNQcmVjaXNpb25cIj5HSVJBUjwvdGV4dD5cbiAgPHRleHQgeD1cIiR7Q1h9XCIgeT1cIiR7Q1kgKyA5fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmaWxsPVwicmdiYSgyNTUsMjU1LDI1NSwuODUpXCIgZm9udC1mYW1pbHk9XCJzZXJpZlwiIGZvbnQtc2l6ZT1cIjExXCI+XHUyNjA1IFx1MjYwNSBcdTI2MDU8L3RleHQ+XG48L3N2Zz5gO1xuXG4gIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuaW5uZXJIVE1MID0gc3ZnO1xuICB3cmFwLmluc2VydEJlZm9yZShkaXYuZmlyc3RFbGVtZW50Q2hpbGQhLCB3cmFwLmZpcnN0Q2hpbGQpO1xufVxuXG5leHBvcnQgeyBlc2NIVE1MIH07XG4iLCAiaW1wb3J0IHR5cGUgeyBJdGVtQ2FycmluaG8gfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBlc2NIVE1MIH0gZnJvbSAnLi4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgZm9ybWF0YXJNb2VkYSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBjYXJ0U2VydmljZSB9IGZyb20gJy4uL2NvbnRhaW5lcic7XG5cbi8vIEFkYXB0YWRvcmVzIGxlZ2Fkb3MgXHUyMDE0IGRlbGVnYW0gYW8gQ2FydFNlcnZpY2UgKENsZWFuIEFyY2hpdGVjdHVyZSlcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXJyaW5obygpOiBSZWNvcmQ8c3RyaW5nLCBJdGVtQ2FycmluaG8+IHtcbiAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBJdGVtQ2FycmluaG8+ID0ge307XG4gIGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCkuZm9yRWFjaChpID0+IHsgcmVzdWx0W2kubm9tZV0gPSBpOyB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEl0ZW5zKCk6IEl0ZW1DYXJyaW5ob1tdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oY2FydFNlcnZpY2UuZ2V0SXRlbXMoKSkgYXMgSXRlbUNhcnJpbmhvW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUb3RhbCgpOiBudW1iZXIge1xuICByZXR1cm4gY2FydFNlcnZpY2UuZ2V0VG90YWwoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkaWNpb25hckl0ZW0obm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybiBmYWxzZTtcbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVySXRlbShub21lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKCFjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybiBmYWxzZTtcbiAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZUl0ZW0obm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogJ2FkaWNpb25hZG8nIHwgJ3JlbW92aWRvJyB7XG4gIGNvbnN0IHIgPSBjYXJ0U2VydmljZS50b2dnbGUobm9tZSwgcHJlY28pO1xuICByZXR1cm4gciA9PT0gJ2FkZGVkJyA/ICdhZGljaW9uYWRvJyA6ICdyZW1vdmlkbyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaW1wYXIoKTogdm9pZCB7XG4gIGNhcnRTZXJ2aWNlLmNsZWFyKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0JvbG9Gb3JtYShub21lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgQk9MT19GT1JNQV9OT01FUyA9IFsnQm9sbyBuYSBmb3JtYSBNaWxobyBuYXR1cmFsJywgJ0JvbG8gbmEgZm9ybWEgQ2Vub3VyYSBjb20gY2hvY29sYXRlIGUgR3JhbnVsZSddO1xuICByZXR1cm4gQk9MT19GT1JNQV9OT01FUy5pbmNsdWRlcyhub21lKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlcml6YXJMaXN0YShjb250YWluZXJJZDogc3RyaW5nLCB0b3RhbFJvZGFwZUlkOiBzdHJpbmcsIGJhZGdlSWQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBsaXN0YSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbnRhaW5lcklkKTtcbiAgY29uc3QgdG90YWxFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRvdGFsUm9kYXBlSWQpO1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGJhZGdlSWQpO1xuICBjb25zdCBpdGVucyA9IGdldEl0ZW5zKCk7XG5cbiAgaWYgKGJhZGdlKSBiYWRnZS50ZXh0Q29udGVudCA9IFN0cmluZyhpdGVucy5sZW5ndGgpO1xuXG4gIGlmICghbGlzdGEgfHwgIXRvdGFsRWwpIHJldHVybjtcblxuICBpZiAoaXRlbnMubGVuZ3RoID09PSAwKSB7XG4gICAgbGlzdGEuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJjYXJyaW5oby12YXppb1wiPjxkaXYgY2xhc3M9XCJjYXJyaW5oby12YXppby1pY29uXCI+XHVEODNEXHVERUQyPC9kaXY+PGRpdj5TZXUgY2FycmluaG8gZXN0XHUwMEUxIHZhemlvPC9kaXY+PC9kaXY+YDtcbiAgICB0b3RhbEVsLnRleHRDb250ZW50ID0gJ1IkIDAsMDAnO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRvdGFsID0gZ2V0VG90YWwoKTtcbiAgbGlzdGEuaW5uZXJIVE1MID0gaXRlbnMubWFwKGl0ZW0gPT4ge1xuICAgIGNvbnN0IG5vbWVFc2MgPSBlc2NIVE1MKGl0ZW0ubm9tZSk7XG4gICAgY29uc3Qgbm9tZURhdGEgPSBlbmNvZGVVUklDb21wb25lbnQoaXRlbS5ub21lKTtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJjYXJ0LWl0ZW1cIj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY2FydC1pdGVtLW5vbWVcIj4ke25vbWVFc2N9PC9zcGFuPlxuICAgICAgPHNwYW4gY2xhc3M9XCJjYXJ0LWl0ZW0tcHJlY29cIj4ke2Zvcm1hdGFyTW9lZGEoaXRlbS5wcmVjbyl9PC9zcGFuPlxuICAgICAgPGJ1dHRvbiBjbGFzcz1cImNhcnQtaXRlbS1yZW1vdmVcIiBvbmNsaWNrPVwicmVtb3ZlckRvQ2FycmluaG8oZGVjb2RlVVJJQ29tcG9uZW50KCcke25vbWVEYXRhfScpKVwiIGFyaWEtbGFiZWw9XCJSZW1vdmVyXCI+XHVEODNEXHVEREQxXHVGRTBGPC9idXR0b24+XG4gICAgPC9kaXY+YDtcbiAgfSkuam9pbignJykgKyBgPGRpdiBjbGFzcz1cImNhcnQtdG90YWxcIj48c3BhbiBjbGFzcz1cImNhcnQtdG90YWwtbGFiZWxcIj5Ub3RhbDwvc3Bhbj48c3BhbiBjbGFzcz1cImNhcnQtdG90YWwtdmFsb3JcIj4ke2Zvcm1hdGFyTW9lZGEodG90YWwpfTwvc3Bhbj48L2Rpdj5gO1xuICB0b3RhbEVsLnRleHRDb250ZW50ID0gZm9ybWF0YXJNb2VkYSh0b3RhbCk7XG59XG4iLCAiLy8gc3JjL21haW4udHMgXHUyMDE0IHBvbnRvIGRlIGVudHJhZGEgR2VsYW1vdXIgKENsZWFuIEFyY2hpdGVjdHVyZSlcbmltcG9ydCB7IG1vc3RyYXJUb2FzdCB9IGZyb20gJy4vdXRpbHMvdG9hc3QnO1xuaW1wb3J0IHsgZXNjSFRNTCB9IGZyb20gJy4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgYXBsaWNhck1hc2NhcmFUZWxlZm9uZSB9IGZyb20gJy4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGxvZ2luVXNlQ2FzZSwgY2FydFNlcnZpY2UsIHBlZGlkb1JlcG9zaXRvcnksIHJvbGV0YVJlcG9zaXRvcnksIGNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHsgYXBwU3RvcmUsIGlzQ29udGFUZXN0ZSB9IGZyb20gJy4vc3RhdGUvQXBwU3RvcmUnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi9jb3JlL2xvZ2dlcic7XG5pbXBvcnQgeyBDbGllbnRlIGFzIENsaWVudGVFbnRpdHkgfSBmcm9tICcuL2RvbWFpbi9jbGllbnRlJztcbmltcG9ydCB7IGdldFNlbWFuYUF0dWFsIH0gZnJvbSAnLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHtcbiAgZ2V0UHJlbWlvcywgZ2V0UHJlbWlvc1BhZHJhbywgc2V0UHJlbWlvcyxcbiAgZ2V0UGFydGljaXBhY2FvSWQsIHNldFBhcnRpY2lwYWNhb0lkLFxuICBjYXJyZWdhckNvbmZpZyBhcyBjYXJyZWdhckNvbmZpZ1JvbGV0YSxcbiAgdmVyaWZpY2FyU3RhdHVzIGFzIHZlcmlmaWNhclN0YXR1c1JvbGV0YSxcbiAgZ2lyYXIgYXMgZ2lyYXJSb2xldGFGbixcbiAgc2FsdmFyVmVuY2Vkb3IsXG4gIGRlc2VuaGFyUm9sZXRhXG59IGZyb20gJy4vbW9kdWxlcy9yb2xldGEnO1xuaW1wb3J0IHsgaXNCb2xvRm9ybWEsIHJlbmRlcml6YXJMaXN0YSB9IGZyb20gJy4vbW9kdWxlcy9jYXJ0JztcbmltcG9ydCB0eXBlIHsgQ2xpZW50ZSwgUGFydGljaXBhY2FvIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBTVVBBQkFTRV9VUkwsIFNVUEFCQVNFX0FOT04gfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL2NsaWVudCc7XG5cbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnbWFpbicpO1xuXG4vLyA9PT09PSBDT05TVEFOVEVTID09PT09XG5jb25zdCBXQV9OVU1CRVIgPSBhdG9iKCdOVFV4TVRrME1EYzNNamMxTUE9PScpO1xuY29uc3QgRURHRV9VUkwgPSBgJHtTVVBBQkFTRV9VUkx9L2Z1bmN0aW9ucy92MWA7XG5cbi8vID09PT09IEVTVEFETyBMT0NBTCBERSBVSSAoblx1MDBFM28gZ2xvYmFsIFx1MjAxNCBlbmNhcHN1bGFkbykgPT09PT1cbmxldCBfcGl4UGF5bG9hZCA9ICcnO1xubGV0IF9waXhQb2xsVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldEludGVydmFsPiB8IG51bGwgPSBudWxsO1xubGV0IF9waXhQZWRpZG9JZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5sZXQgX3BpeE1zZ1dBID0gJyc7XG5sZXQgX3BpeFRvdGFsID0gMDtcbmxldCBfcGl4Tm9tZSA9ICcnO1xubGV0IF9waXhJdGVuczogQXJyYXk8eyBub21lOiBzdHJpbmc7IHByZWNvOiBudW1iZXIgfT4gPSBbXTtcbmxldCBfcGl4RW5kZXJlY28gPSAnJztcbmxldCBfY2FyZFRpcG8gPSAnY3JlZGl0byc7XG5cbmxldCBfdmVyaWZpY2FuZG8gPSBmYWxzZTtcbmxldCBfY2FkYXN0cmFuZG8gPSBmYWxzZTtcblxuLy8gSGVscGVyOiBsXHUwMEVBIGNsaWVudGUgYXR1YWwgZG8gc3RvcmVcbmZ1bmN0aW9uIGdldENsaWVudGVBdHVhbCgpOiBDbGllbnRlIHwgbnVsbCB7XG4gIHJldHVybiBhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUgYXMgQ2xpZW50ZSB8IG51bGw7XG59XG5cbi8vID09PT09IEZJTFRST1MgPT09PT1cbmZ1bmN0aW9uIGZpbHRyYXIoY2F0OiBzdHJpbmcsIGJ0bjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmZpbHRyby1idG4nKS5mb3JFYWNoKGIgPT4gYi5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKSk7XG4gIGJ0bi5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZCcpLmZvckVhY2goY2FyZCA9PiB7XG4gICAgY29uc3QgZWwgPSBjYXJkIGFzIEhUTUxFbGVtZW50O1xuICAgIGlmIChjYXQgPT09ICd0b2RvcycgfHwgKGVsLmRhdGFzZXRbJ2NhdCddID09PSBjYXQpKVxuICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgZWxzZVxuICAgICAgZWwuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XG4gIH0pO1xufVxuXG4vLyA9PT09PSBDQVJSSU5ITyA9PT09PVxuZnVuY3Rpb24gYXR1YWxpemFyRmFiKCk6IHZvaWQge1xuICBjb25zdCBmYWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FydEZhYicpO1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXJ0QmFkZ2UnKTtcbiAgY29uc3QgY291bnQgPSBjYXJ0U2VydmljZS5nZXRDb3VudCgpO1xuICBpZiAoYmFkZ2UpIGJhZGdlLnRleHRDb250ZW50ID0gU3RyaW5nKGNvdW50KTtcbiAgaWYgKGZhYikge1xuICAgIGlmIChjb3VudCA+IDApIGZhYi5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICAgIGVsc2UgeyBmYWIuY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTsgZmVjaGFyTW9kYWwoKTsgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHBlZGlyUHJvZHV0byhib3RhbzogSFRNTEVsZW1lbnQsIG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjYXJkID0gYm90YW8uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGNhcnRTZXJ2aWNlLmhhcyhub21lKSkge1xuICAgIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcbiAgICBjYXJkPy5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpO1xuICAgIGF0dWFsaXphckZhYigpO1xuICAgIHJldHVybjtcbiAgfVxuICBjYXJ0U2VydmljZS5hZGQobm9tZSwgcHJlY28pO1xuICBjYXJkPy5jbGFzc0xpc3QuYWRkKCdzZWxlY2lvbmFkbycpO1xuICBhdHVhbGl6YXJGYWIoKTtcbiAgYWJyaXJEaWFsb2cobm9tZSwgcHJlY28pO1xufVxuXG5mdW5jdGlvbiBhYnJpckRpYWxvZyhub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nUHJvZHV0bycpO1xuICBpZiAoZWwpIGVsLmlubmVySFRNTCA9ICc8c3Ryb25nPicgKyBlc2NIVE1MKG5vbWUpICsgJzwvc3Ryb25nPiBcdTIwMTQgUiQgJyArIE51bWJlcihwcmVjbykudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJEaWFsb2coKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyRGlhbG9nQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdkaWFsb2dCYWNrZHJvcCcpIGZlY2hhckRpYWxvZygpO1xufVxuXG5mdW5jdGlvbiBpclBhcmFGaW5hbGl6YXIoKTogdm9pZCB7XG4gIGZlY2hhckRpYWxvZygpO1xuICBhYnJpck1vZGFsKCk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcml6YXJDYXJyaW5obygpOiB2b2lkIHtcbiAgcmVuZGVyaXphckxpc3RhKCdsaXN0YUNhcnJpbmhvJywgJ3RvdGFsUm9kYXBlJywgJ2JhZGdlQ291bnQnKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyaXphck5vdGljZUVuY29tZW5kYSgpOiB2b2lkIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWNlRW5jb21lbmRhJyk7XG4gIGlmICghZWwpIHJldHVybjtcbiAgY29uc3QgaXRlbnMgPSBjYXJ0U2VydmljZS5nZXRJdGVtcygpO1xuICBjb25zdCB0ZW1Gb3JtYSA9IGl0ZW5zLnNvbWUoaSA9PiBpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgY29uc3QgdGVtT3V0cm9zID0gaXRlbnMuc29tZShpID0+ICFpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgaWYgKHRlbUZvcm1hICYmIHRlbU91dHJvcykge1xuICAgIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwibm90aWNlLW1pc3RvXCI+PHNwYW4+XHUyNkEwXHVGRTBGPC9zcGFuPjxzcGFuPjxzdHJvbmc+QXRlblx1MDBFN1x1MDBFM286PC9zdHJvbmc+IFZvY1x1MDBFQSBtaXN0dXJvdSBCb2xvcyBuYSBGb3JtYSAoZmVpdG9zIHNvYiBlbmNvbWVuZGEpIGNvbSBvdXRyb3MgcHJvZHV0b3MuIENvbnNpZGVyZSBwZWRpZG9zIHNlcGFyYWRvcyBwYXJhIGdhcmFudGlyIG8gcHJhem8hPC9zcGFuPjwvZGl2Pic7XG4gIH0gZWxzZSBpZiAodGVtRm9ybWEpIHtcbiAgICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cIm5vdGljZS1lbmNvbWVuZGFcIj48c3BhbiBjbGFzcz1cIm5vdGljZS1lbmNvbWVuZGEtaWNvblwiPlx1MjNGMDwvc3Bhbj48c3Bhbj48c3Ryb25nPkJvbG8gbmEgRm9ybWEgXHUyMDE0IFNvYiBlbmNvbWVuZGEhPC9zdHJvbmc+PGJyPkVzc2VzIGJvbG9zIHNcdTAwRTNvIHByZXBhcmFkb3MgZXNwZWNpYWxtZW50ZSBwYXJhIHZvY1x1MDBFQS4gUHJhem8gZGUgPHN0cm9uZz41IGhvcmFzIGEgMSBkaWEgXHUwMEZBdGlsPC9zdHJvbmc+IGFwXHUwMEYzcyBjb25maXJtYVx1MDBFN1x1MDBFM28uPC9zcGFuPjwvZGl2Pic7XG4gIH0gZWxzZSB7XG4gICAgZWwuaW5uZXJIVE1MID0gJyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWJyaXJNb2RhbCgpOiB2b2lkIHtcbiAgcmVuZGVyaXphckNhcnJpbmhvKCk7XG4gIHJlbmRlcml6YXJOb3RpY2VFbmNvbWVuZGEoKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbW9kYWwtYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhck1vZGFsKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdtb2RhbC1hYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyTW9kYWxCYWNrZHJvcChlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ21vZGFsQmFja2Ryb3AnKSBmZWNoYXJNb2RhbCgpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVyRG9DYXJyaW5obyhub21lOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKCFjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybjtcbiAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucHJvZC1jYXJkLnNlbGVjaW9uYWRvJykuZm9yRWFjaChjYXJkID0+IHtcbiAgICBjb25zdCBub21lRWwgPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kLW5vbWUnKTtcbiAgICBpZiAobm9tZUVsICYmIG5vbWVFbC50ZXh0Q29udGVudD8udHJpbSgpID09PSBub21lKSBjYXJkLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJyk7XG4gIH0pO1xuICByZW5kZXJpemFyQ2FycmluaG8oKTtcbiAgYXR1YWxpemFyRmFiKCk7XG59XG5cbmZ1bmN0aW9uIHNlbGVjaW9uYXJQYWdhbWVudG8oZWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYWdhbWVudG8tb3B0JykuZm9yRWFjaChvID0+IG8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKSk7XG4gIGVsLmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGNvbnN0IHRpcG8gPSAoZWwgYXMgSFRNTEVsZW1lbnQgJiB7IGRhdGFzZXQ6IERPTVN0cmluZ01hcCB9KS5kYXRhc2V0WydwYWcnXSA/PyAnJztcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwYWdhbWVudG9TZWxlY2lvbmFkbzogdGlwbyB9KTtcbn1cblxuZnVuY3Rpb24gbGltcGFyQ2FycmluaG8oKTogdm9pZCB7XG4gIGNhcnRTZXJ2aWNlLmNsZWFyKCk7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGFnYW1lbnRvU2VsZWNpb25hZG86ICcnIH0pO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGFnYW1lbnRvLW9wdC5hdGl2bycpLmZvckVhY2gobyA9PiBvLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xuICBjb25zdCBvYnNFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBPYnMnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbDtcbiAgaWYgKG9ic0VsKSBvYnNFbC52YWx1ZSA9ICcnO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucHJvZC1jYXJkLnNlbGVjaW9uYWRvJykuZm9yRWFjaChjID0+IGMuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKSk7XG4gIGF0dWFsaXphckZhYigpO1xuICBmZWNoYXJNb2RhbCgpO1xufVxuXG4vLyA9PT09PSBCT0xPIE5BIEZPUk1BID09PT09XG5mdW5jdGlvbiBwZWRpckJvbG9Gb3JtYShib3RhbzogSFRNTEVsZW1lbnQsIG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjYXJkID0gYm90YW8uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGNhcnRTZXJ2aWNlLmhhcyhub21lKSkge1xuICAgIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcbiAgICBjYXJkPy5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpO1xuICAgIGF0dWFsaXphckZhYigpO1xuICAgIHJlbmRlcml6YXJOb3RpY2VFbmNvbWVuZGEoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcbiAgY2FyZD8uY2xhc3NMaXN0LmFkZCgnc2VsZWNpb25hZG8nKTtcbiAgYXR1YWxpemFyRmFiKCk7XG4gIGFicmlyRGlhbG9nQm9sbygpO1xufVxuXG5mdW5jdGlvbiBhYnJpckRpYWxvZ0JvbG8oKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCb2xvQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhckRpYWxvZ0JvbG8oZT86IEV2ZW50KTogdm9pZCB7XG4gIGlmICghZSB8fCAoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAnZGlhbG9nQm9sb0JhY2tkcm9wJykge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCb2xvQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWdlbmRhckJvbG9XaGF0c0FwcCgpOiB2b2lkIHtcbiAgY29uc3QgaXRlbnNGb3JtYSA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCkuZmlsdGVyKGkgPT4gaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGxldCBsaW5oYXMgPSAnJztcbiAgbGV0IHRvdGFsID0gMDtcbiAgaXRlbnNGb3JtYS5mb3JFYWNoKGkgPT4ge1xuICAgIGxpbmhhcyArPSAnXHUyMDIyICcgKyBpLm5vbWUgKyAnIFx1MjAxNCBSJCAnICsgaS5wcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpICsgJ1xcbic7XG4gICAgdG90YWwgPSBNYXRoLnJvdW5kKCh0b3RhbCArIGkucHJlY28pICogMTAwKSAvIDEwMDtcbiAgfSk7XG4gIGNvbnN0IG1zZyA9ICcqXHVEODNDXHVERjgyIEFHRU5EQU1FTlRPIC0gQk9MTyBOQSBGT1JNQSAtIEdFTEFNT1VSKlxcblxcbk9sXHUwMEUxISBHb3N0YXJpYSBkZSBhZ2VuZGFyIG8ocykgc2VndWludGUocykgYm9sbyhzKTpcXG5cXG4nICsgbGluaGFzICsgJ1xcbipcdUQ4M0RcdURDQjAgVG90YWw6KiBSJCAnICsgdG90YWwudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKSArICdcXG5cXG5cdTIzRjAgU2VpIHF1ZSBvIHByYXpvIFx1MDBFOSBkZSA1IGhvcmFzIGEgMSBkaWEgXHUwMEZBdGlsLiBQb3IgZmF2b3IgbWUgaW5mb3JtZSBhIGRhdGEgZSBob3JcdTAwRTFyaW8gZGlzcG9uXHUwMEVEdmVpcyBwYXJhIGVudHJlZ2EuIFx1RDgzRFx1REUwQSc7XG4gIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChtc2cpLCAnX2JsYW5rJyk7XG4gIGZlY2hhckRpYWxvZ0JvbG8oKTtcbn1cblxuLy8gPT09PT0gQ0FST1VTRUwgPT09PT1cbmZ1bmN0aW9uIGNhcm91c2VsTmV4dChpZDogc3RyaW5nLCBlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoZSkgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgY29uc3QgYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgaWYgKCFjKSByZXR1cm47XG4gIGNvbnN0IGltZ3MgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1pbWcnKTtcbiAgY29uc3QgZG90cyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWRvdCcpO1xuICBsZXQgY3VyID0gMDtcbiAgaW1ncy5mb3JFYWNoKChpbWcsIGkpID0+IHsgaWYgKGltZy5jbGFzc0xpc3QuY29udGFpbnMoJ2F0aXZvJykpIGN1ciA9IGk7IH0pO1xuICBpbWdzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGRvdHNbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcbiAgY29uc3QgbmV4dCA9IChjdXIgKyAxKSAlIGltZ3MubGVuZ3RoO1xuICBpbWdzW25leHRdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBkb3RzW25leHRdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xufVxuXG5mdW5jdGlvbiBjYXJvdXNlbFByZXYoaWQ6IHN0cmluZywgZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKGUpIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGNvbnN0IGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIGlmICghYykgcmV0dXJuO1xuICBjb25zdCBpbWdzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtaW1nJyk7XG4gIGNvbnN0IGRvdHMgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1kb3QnKTtcbiAgbGV0IGN1ciA9IDA7XG4gIGltZ3MuZm9yRWFjaCgoaW1nLCBpKSA9PiB7IGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhdGl2bycpKSBjdXIgPSBpOyB9KTtcbiAgaW1nc1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBkb3RzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGNvbnN0IHByZXYgPSAoY3VyIC0gMSArIGltZ3MubGVuZ3RoKSAlIGltZ3MubGVuZ3RoO1xuICBpbWdzW3ByZXZdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBkb3RzW3ByZXZdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xufVxuXG4vLyA9PT09PSBDSEVDS09VVCAvIFBFRElETyA9PT09PVxuYXN5bmMgZnVuY3Rpb24gZmluYWxpemFyUGVkaWRvKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBpdGVucyA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCk7XG4gIGNvbnN0IHRlbUZvcm1hRmluID0gaXRlbnMuc29tZShpID0+IGlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuICBjb25zdCB0ZW1PdXRyb3NGaW4gPSBpdGVucy5zb21lKGkgPT4gIWlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuICBpZiAodGVtRm9ybWFGaW4gJiYgdGVtT3V0cm9zRmluKSB7XG4gICAgaWYgKCFjb25maXJtKCdcdTI2QTBcdUZFMEYgQXRlblx1MDBFN1x1MDBFM28hXFxuXFxuVm9jXHUwMEVBIHRlbSBCb2xvcyBuYSBGb3JtYSAoZmVpdG9zIHNvYiBlbmNvbWVuZGEpIG1pc3R1cmFkb3MgY29tIG91dHJvcyBwcm9kdXRvcyBubyBjYXJyaW5oby5cXG5cXG5Cb2xvcyBuYSBGb3JtYSBwcmVjaXNhbSBkZSBwcmF6byBkZSA1aCBhIDEgZGlhIFx1MDBGQXRpbCBwYXJhIHByZXBhcm8uXFxuXFxuRGVzZWphIHByb3NzZWd1aXIgY29tIHRvZG9zIG9zIGl0ZW5zIG1lc21vIGFzc2ltPycpKVxuICAgICAgcmV0dXJuO1xuICB9XG4gIGlmIChpdGVucy5sZW5ndGggPT09IDApIHsgYWxlcnQoJ0FkaWNpb25lIHBlbG8gbWVub3MgdW0gcHJvZHV0byBhbyBjYXJyaW5obyEnKTsgcmV0dXJuOyB9XG5cbiAgY29uc3Qgbm9tZSA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XG4gIGNvbnN0IGVuZGVyZWNvID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBFbmRlcmVjbycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XG4gIGNvbnN0IG9icyA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wT2JzJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3QgcGFnYW1lbnRvU2VsZWNpb25hZG8gPSBhcHBTdG9yZS5nZXRTdGF0ZSgpLnBhZ2FtZW50b1NlbGVjaW9uYWRvO1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcblxuICBpZiAoIW5vbWUpIHsgYWxlcnQoJ1BvciBmYXZvciwgaW5mb3JtZSBzZXUgbm9tZSBjb21wbGV0by4nKTsgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKT8uZm9jdXMoKTsgcmV0dXJuOyB9XG4gIGlmICghZW5kZXJlY28pIHsgYWxlcnQoJ1BvciBmYXZvciwgaW5mb3JtZSBzZXUgZW5kZXJlXHUwMEU3by4nKTsgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJyk/LmZvY3VzKCk7IHJldHVybjsgfVxuICBpZiAoIXBhZ2FtZW50b1NlbGVjaW9uYWRvKSB7IGFsZXJ0KCdQb3IgZmF2b3IsIGVzY29saGEgYSBmb3JtYSBkZSBwYWdhbWVudG8uJyk7IHJldHVybjsgfVxuXG4gIC8vIFJlLXZlcmlmaWNhciBwcmVcdTAwRTdvcyBkb3MgYm90XHUwMEY1ZXMgcGFyYSBldml0YXIgbWFuaXB1bGFcdTAwRTdcdTAwRTNvIGNsaWVudC1zaWRlXG4gIGNvbnN0IHByaWNlTWFwID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJ0bi1wZWRpcicpLmZvckVhY2goYnRuID0+IHtcbiAgICBjb25zdCBvbmNsaWNrQXR0ciA9IGJ0bi5nZXRBdHRyaWJ1dGUoJ29uY2xpY2snKSA/PyAnJztcbiAgICBjb25zdCBtID0gb25jbGlja0F0dHIubWF0Y2goL3BlZGlyUHJvZHV0b1xcKHRoaXMsJyguKz8pJywoXFxkKyg/OlxcLlxcZCspPylcXCkvKTtcbiAgICBpZiAobSkgcHJpY2VNYXAuc2V0KG1bMV0hLCBwYXJzZUZsb2F0KG1bMl0hKSk7XG4gIH0pO1xuICBjYXJ0U2VydmljZS5yZXZhbGlkYXRlUHJpY2VzKHByaWNlTWFwKTtcblxuICBjb25zdCBpdGVuc1ZlcmlmaWNhZG9zID0gQXJyYXkuZnJvbShjYXJ0U2VydmljZS5nZXRJdGVtcygpKTtcbiAgbGV0IHRvdGFsID0gMDtcbiAgbGV0IGxpbmhhc0l0ZW5zID0gJyc7XG4gIGl0ZW5zVmVyaWZpY2Fkb3MuZm9yRWFjaChpdGVtID0+IHtcbiAgICB0b3RhbCA9IE1hdGgucm91bmQoKHRvdGFsICsgaXRlbS5wcmVjbykgKiAxMDApIC8gMTAwO1xuICAgIGxpbmhhc0l0ZW5zICs9IGBcdTIwMjIgJHtpdGVtLm5vbWV9IFx1MjAxNCBSJCAke2l0ZW0ucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX1cXG5gO1xuICB9KTtcblxuICBjb25zdCBtc2cgPSBgKlx1RDgzQ1x1REY3MCBOT1ZPIFBFRElETyAtIEdFTEFNT1VSKlxcblxcbipcdUQ4M0RcdURDQ0IgSVRFTlM6KlxcbiR7bGluaGFzSXRlbnN9XFxuKlx1RDgzRFx1RENCMCBUb3RhbDoqIFIkICR7dG90YWwudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX1cXG5cXG4qXHVEODNEXHVEQzY0IE5vbWU6KiAke25vbWV9XFxuKlx1RDgzRFx1RENDRCBFbmRlcmVcdTAwRTdvOiogJHtlbmRlcmVjb31cXG4qXHVEODNEXHVEQ0IzIFBhZ2FtZW50bzoqICR7cGFnYW1lbnRvU2VsZWNpb25hZG99JHtvYnMgPyBgXFxuKlx1RDgzRFx1RENERCBPYnM6KiAke29ic31gIDogJyd9XFxuXFxuUGVkaWRvIHBlbG8gY2FyZFx1MDBFMXBpbyBvbmxpbmUgXHUyNzI4YDtcblxuICBjb25zdCBidG5GaW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuRmluYWxpemFyJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICBjb25zdCB0eHRPcmlnID0gYnRuRmluID8gKGJ0bkZpbi50ZXh0Q29udGVudCA/PyAnJykgOiAnJztcbiAgaWYgKGJ0bkZpbikgeyBidG5GaW4uZGlzYWJsZWQgPSB0cnVlOyBidG5GaW4udGV4dENvbnRlbnQgPSAnU2FsdmFuZG8gcGVkaWRvLi4uJzsgfVxuXG4gIGxldCBfcGVkaWRvSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IGN0cmwgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgdGlkID0gc2V0VGltZW91dCgoKSA9PiBjdHJsLmFib3J0KCksIDEwXzAwMCk7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9wZWRpZG9zJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxuICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04sXG4gICAgICAgICdQcmVmZXInOiAncmV0dXJuPWhlYWRlcnMtb25seSdcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG5vbWUsIGVuZGVyZWNvLFxuICAgICAgICBwYWdhbWVudG86IHBhZ2FtZW50b1NlbGVjaW9uYWRvLFxuICAgICAgICBpdGVuczogaXRlbnNWZXJpZmljYWRvcy5tYXAoaSA9PiAoeyBub21lOiBpLm5vbWUsIHByZWNvOiBpLnByZWNvIH0pKSxcbiAgICAgICAgdG90YWwsXG4gICAgICAgIHN0YXR1czogJ2FndWFyZGFuZG8nLFxuICAgICAgICBvYnNlcnZhY2FvOiBvYnMgfHwgbnVsbCxcbiAgICAgICAgY2xpZW50ZV9pZDogY2xpZW50ZUF0dWFsID8gY2xpZW50ZUF0dWFsLmlkIDogbnVsbCxcbiAgICAgICAgdGVsZWZvbmU6IGNsaWVudGVBdHVhbCA/IGNsaWVudGVBdHVhbC50ZWxlZm9uZSA6IG51bGxcbiAgICAgIH0pLFxuICAgICAgc2lnbmFsOiBjdHJsLnNpZ25hbFxuICAgIH0pO1xuICAgIGNsZWFyVGltZW91dCh0aWQpO1xuICAgIGlmICghci5vaykge1xuICAgICAgY29uc3QgZXJyVHh0ID0gYXdhaXQgci50ZXh0KCkuY2F0Y2goKCkgPT4gJycpO1xuICAgICAgbG9nLmVycm9yKCdJTlNFUlQgcGVkaWRvIGZhbGhvdScsIHsgc3RhdHVzOiByLnN0YXR1cywgYm9keTogZXJyVHh0LnNsaWNlKDAsIDEyMCkgfSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hUVFAgJyArIHIuc3RhdHVzICsgJyBcdTIwMTQgJyArIGVyclR4dC5zbGljZSgwLCAxMjApKTtcbiAgICB9XG4gICAgY29uc3QgbG9jID0gci5oZWFkZXJzLmdldCgnTG9jYXRpb24nKSA/PyAnJztcbiAgICBjb25zdCBpZE1hdGNoID0gbG9jLm1hdGNoKC9pZD1lcVxcLihcXGQrKS8pO1xuICAgIGlmIChpZE1hdGNoKSB7XG4gICAgICBfcGVkaWRvSWQgPSBwYXJzZUludChpZE1hdGNoWzFdISwgMTApO1xuICAgICAgaWYgKGJ0bkZpbikgYnRuRmluLnRleHRDb250ZW50ID0gJ1x1MjcwNSBQZWRpZG8gcmVnaXN0cmFkbyEnO1xuICAgICAgaWYgKGNsaWVudGVBdHVhbCAmJiBjbGllbnRlQXR1YWwuaWQpIHtcbiAgICAgICAgY2xpZW50ZVJlcG9zaXRvcnkudXBkYXRlRW5kZXJlY28oY2xpZW50ZUF0dWFsLmlkLCBlbmRlcmVjbylcbiAgICAgICAgICAuY2F0Y2goKGU6IHVua25vd24pID0+IGxvZy53YXJuKCdOXHUwMEUzbyBmb2kgcG9zc1x1MDBFRHZlbCBzYWx2YXIgZW5kZXJlXHUwMEU3bycsIHsgZXJyb3I6IFN0cmluZyhlKSB9KSk7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGJ0bkZpbikgYnRuRmluLnRleHRDb250ZW50ID0gJ1x1MjZBMFx1RkUwRiBFcnJvIC0gcGVkaWRvIHNcdTAwRjMgbm8gV2hhdHNBcHAnO1xuICAgIGxvZy53YXJuKCdFcnJvIGFvIHNhbHZhciBubyBiYW5jbycsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTtcbiAgfVxuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGlmIChidG5GaW4pIHsgYnRuRmluLmRpc2FibGVkID0gZmFsc2U7IGJ0bkZpbi50ZXh0Q29udGVudCA9IHR4dE9yaWc7IH1cbiAgfSwgMzAwMCk7XG5cbiAgaWYgKChwYWdhbWVudG9TZWxlY2lvbmFkbyA9PT0gJ1BpeCcgfHwgcGFnYW1lbnRvU2VsZWNpb25hZG8gPT09ICdDYXJ0XHUwMEUzbycpICYmIF9wZWRpZG9JZCkge1xuICAgIGNvbnN0IGJpbGxpbmdUeXBlID0gcGFnYW1lbnRvU2VsZWNpb25hZG8gPT09ICdDYXJ0XHUwMEUzbycgPyAnQ1JFRElUX0NBUkQnIDogJ1BJWCc7XG4gICAgaW5pY2lhckZsdXhvUGl4KF9wZWRpZG9JZCwgdG90YWwsIG5vbWUsIG1zZywgYmlsbGluZ1R5cGUsIGl0ZW5zVmVyaWZpY2Fkb3MsIGVuZGVyZWNvKTtcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQobXNnKSwgJ19ibGFuaycpO1xuICAgIGlmIChfcGVkaWRvSWQpIHtcbiAgICAgIGFwcFN0b3JlLnNldFN0YXRlKHsgcGVkaWRvSWRQZW5kZW50ZTogX3BlZGlkb0lkIH0pO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dhQ29uZmlybUJhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjb25maXJtYXJFbnZpb1dBKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBpZCA9IGFwcFN0b3JlLmdldFN0YXRlKCkucGVkaWRvSWRQZW5kZW50ZTtcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLndhQ29uZmlybS1zaW0nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuICBpZiAoIWlkKSB7IGZlY2hhckNvbmZpcm1XQSgpOyByZXR1cm47IH1cbiAgaWYgKCFjbGllbnRlQXR1YWwgfHwgIWNsaWVudGVBdHVhbC5pZCkgeyBmZWNoYXJDb25maXJtV0EoKTsgcmV0dXJuOyB9XG4gIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ0NvbmZpcm1hbmRvLi4uJzsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgfVxuICBjb25zdCByZXN1bHQgPSBhd2FpdCBwZWRpZG9SZXBvc2l0b3J5LnVwZGF0ZVN0YXR1cyhpZCwgY2xpZW50ZUF0dWFsLmlkLCAnY29uZmlybWFkbycpO1xuICBpZiAocmVzdWx0Lm9rKSB7XG4gICAgaWYgKGJ0bikgYnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REY4OSBQZWRpZG8gY29uZmlybWFkbyEnO1xuICAgIHNldFRpbWVvdXQoKCkgPT4geyBmZWNoYXJDb25maXJtV0EoKTsgbGltcGFyQ2FycmluaG8oKTsgfSwgMTgwMCk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnXHUyNzA1IFNpbSwgbWVuc2FnZW0gZW52aWFkYSEnOyBidG4uZGlzYWJsZWQgPSBmYWxzZTsgfVxuICAgIGxvZy53YXJuKCdFcnJvIGFvIGNvbmZpcm1hciBwZWRpZG8nLCB7IGVycm9yOiByZXN1bHQuZXJyb3IubWVzc2FnZSB9KTtcbiAgICBmZWNoYXJDb25maXJtV0EoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmZWNoYXJDb25maXJtV0EoKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3YUNvbmZpcm1CYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwZWRpZG9JZFBlbmRlbnRlOiBudWxsIH0pO1xufVxuXG4vLyA9PT09PSBGTFVYTyBQSVggPT09PT1cbmFzeW5jIGZ1bmN0aW9uIGluaWNpYXJGbHV4b1BpeChcbiAgcGVkaWRvSWQ6IG51bWJlcixcbiAgdG90YWw6IG51bWJlcixcbiAgbm9tZTogc3RyaW5nLFxuICBtc2dXQTogc3RyaW5nLFxuICBiaWxsaW5nVHlwZTogc3RyaW5nLFxuICBpdGVuczogQXJyYXk8eyBub21lOiBzdHJpbmc7IHByZWNvOiBudW1iZXIgfT4sXG4gIGVuZGVyZWNvOiBzdHJpbmdcbik6IFByb21pc2U8dm9pZD4ge1xuICBfcGl4UGVkaWRvSWQgPSBwZWRpZG9JZDtcbiAgX3BpeE1zZ1dBID0gbXNnV0E7XG4gIF9waXhUb3RhbCA9IHRvdGFsO1xuICBfcGl4Tm9tZSA9IG5vbWU7XG4gIF9waXhJdGVucyA9IGl0ZW5zIHx8IFtdO1xuICBfcGl4RW5kZXJlY28gPSBlbmRlcmVjbyB8fCAnJztcbiAgY29uc3QgaXNQaXggPSBiaWxsaW5nVHlwZSAhPT0gJ0NSRURJVF9DQVJEJztcblxuICBjb25zdCBwaXhUaXR1bG8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4VGl0dWxvJyk7XG4gIGNvbnN0IHBpeFN1YiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhTdWInKTtcbiAgY29uc3QgcGl4VmFsb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4VmFsb3InKTtcbiAgY29uc3Qgc2VjYW9QaXggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VjYW9QaXgnKTtcbiAgY29uc3Qgc2VjYW9DYXJ0YW8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VjYW9DYXJ0YW8nKTtcbiAgY29uc3QgcGl4SmFQYWd1ZWlCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4SmFQYWd1ZWlCdG4nKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGNvbnN0IHBpeFN0YXR1cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhTdGF0dXMnKTtcbiAgY29uc3QgcGl4Q29kZUJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhDb2RlQm94Jyk7XG4gIGNvbnN0IHBpeFFySW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeFFySW1nJykgYXMgSFRNTEltYWdlRWxlbWVudCB8IG51bGw7XG5cbiAgaWYgKHBpeFRpdHVsbykgcGl4VGl0dWxvLnRleHRDb250ZW50ID0gaXNQaXggPyAnXHVEODNEXHVEQ0EwIFBhZ3VlIHZpYSBQaXgnIDogJ1x1RDgzRFx1RENCMyBQYWd1ZSBjb20gQ2FydFx1MDBFM28nO1xuICBpZiAocGl4U3ViKSBwaXhTdWIudGV4dENvbnRlbnQgPSBpc1BpeCA/ICdDb3BpZSBvIGNcdTAwRjNkaWdvIG91IGVzY2FuZWllIG8gUVIgQ29kZScgOiAnQ3JcdTAwRTlkaXRvIG91IGRcdTAwRTliaXRvIFx1MjAxNCBwcmVlbmNoYSBvcyBkYWRvcyBhYmFpeG8nO1xuICBpZiAocGl4VmFsb3IpIHBpeFZhbG9yLnRleHRDb250ZW50ID0gJ1IkICcgKyB0b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xuICBpZiAoc2VjYW9QaXgpIHNlY2FvUGl4LnN0eWxlLmRpc3BsYXkgPSBpc1BpeCA/ICdibG9jaycgOiAnbm9uZSc7XG4gIGlmIChzZWNhb0NhcnRhbykgc2VjYW9DYXJ0YW8uc3R5bGUuZGlzcGxheSA9IGlzUGl4ID8gJ25vbmUnIDogJ2Jsb2NrJztcbiAgaWYgKHBpeEphUGFndWVpQnRuKSBwaXhKYVBhZ3VlaUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBpZiAocGl4U3RhdHVzKSB7IHBpeFN0YXR1cy50ZXh0Q29udGVudCA9IGlzUGl4ID8gJ1x1MjNGMyBHZXJhbmRvIFFSIENvZGUuLi4nIDogJyc7IHBpeFN0YXR1cy5jbGFzc05hbWUgPSAncGl4LXN0YXR1cycgKyAoaXNQaXggPyAnIHBpeC1hZ3VhcmRhbmRvJyA6ICcnKTsgfVxuICBpZiAocGl4Q29kZUJveCkgcGl4Q29kZUJveC50ZXh0Q29udGVudCA9ICdHZXJhbmRvIGNcdTAwRjNkaWdvLi4uJztcbiAgaWYgKHBpeFFySW1nKSBwaXhRckltZy5zcmMgPSAnJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICBmZWNoYXJNb2RhbCgpO1xuXG4gIGlmICghaXNQaXgpIHJldHVybjtcblxuICB0cnkge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBmZXRjaChFREdFX1VSTCArICcvY3JpYXItcGl4Jywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgcGVkaWRvX2lkOiBwZWRpZG9JZCwgdG90YWwsIG5vbWUsIGJpbGxpbmdfdHlwZTogJ1BJWCcgfSksXG4gICAgfSk7XG4gICAgaWYgKCFyZXNwLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ0hUVFAgJyArIHJlc3Auc3RhdHVzKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcC5qc29uKCkgYXMgeyBlcnJvcj86IHN0cmluZzsgcXJfY29kZT86IHN0cmluZzsgcXJfY29kZV9pbWFnZT86IHN0cmluZyB9O1xuICAgIGlmIChkYXRhLmVycm9yKSB0aHJvdyBuZXcgRXJyb3IoZGF0YS5lcnJvcik7XG4gICAgX3BpeFBheWxvYWQgPSBkYXRhLnFyX2NvZGUgfHwgJyc7XG4gICAgaWYgKHBpeENvZGVCb3gpIHBpeENvZGVCb3gudGV4dENvbnRlbnQgPSBfcGl4UGF5bG9hZCB8fCAnQ1x1MDBGM2RpZ28gaW5kaXNwb25cdTAwRUR2ZWwnO1xuICAgIGlmIChkYXRhLnFyX2NvZGVfaW1hZ2UgJiYgcGl4UXJJbWcpIHBpeFFySW1nLnNyYyA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsJyArIGRhdGEucXJfY29kZV9pbWFnZTtcbiAgICBpZiAocGl4U3RhdHVzKSB7IHBpeFN0YXR1cy50ZXh0Q29udGVudCA9ICdcdTIzRjMgQWd1YXJkYW5kbyBwYWdhbWVudG8uLi4nOyBwaXhTdGF0dXMuY2xhc3NOYW1lID0gJ3BpeC1zdGF0dXMgcGl4LWFndWFyZGFuZG8nOyB9XG4gICAgaWYgKHBpeEphUGFndWVpQnRuKSBwaXhKYVBhZ3VlaUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIF9waXhQb2xsVGltZXIgPSBzZXRJbnRlcnZhbCh2ZXJpZmljYXJQYWdhbWVudG9QaXgsIDQwMDApO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nLndhcm4oJ0Vycm8gYW8gY3JpYXIgUGl4JywgeyBlcnJvcjogU3RyaW5nKGUpIH0pO1xuICAgIGlmIChwaXhDb2RlQm94KSBwaXhDb2RlQm94LnRleHRDb250ZW50ID0gJ0Vycm8gYW8gZ2VyYXIgY1x1MDBGM2RpZ28uJztcbiAgICBpZiAocGl4U3RhdHVzKSB7IHBpeFN0YXR1cy50ZXh0Q29udGVudCA9ICdcdTI2QTBcdUZFMEYgRXJybyBhbyBnZXJhciBRUiBDb2RlLiBUZW50ZSBvdXRyYSBmb3JtYSBkZSBwYWdhbWVudG8uJzsgcGl4U3RhdHVzLmNsYXNzTmFtZSA9ICdwaXgtc3RhdHVzJzsgfVxuICAgIGlmIChwaXhKYVBhZ3VlaUJ0bikgcGl4SmFQYWd1ZWlCdG4uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VsZWNpb25hclRpcG9DYXJ0YW8odGlwbzogc3RyaW5nKTogdm9pZCB7XG4gIF9jYXJkVGlwbyA9IHRpcG87XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5DcmVkaXRvJyk/LmNsYXNzTGlzdC50b2dnbGUoJ2F0aXZvJywgdGlwbyA9PT0gJ2NyZWRpdG8nKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkRlYml0bycpPy5jbGFzc0xpc3QudG9nZ2xlKCdhdGl2bycsIHRpcG8gPT09ICdkZWJpdG8nKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0YXJDYXJ0YW8oZWw6IEhUTUxJbnB1dEVsZW1lbnQpOiB2b2lkIHtcbiAgbGV0IHYgPSBlbC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpLnN1YnN0cmluZygwLCAxNik7XG4gIGVsLnZhbHVlID0gdi5yZXBsYWNlKC8oLns0fSkoPz0uKS9nLCAnJDEgJyk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdGFyQ3BmKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGxldCB2ID0gZWwudmFsdWUucmVwbGFjZSgvXFxEL2csICcnKS5zdWJzdHJpbmcoMCwgMTEpO1xuICB2ID0gdi5yZXBsYWNlKC8oXFxkezN9KShcXGQpLywgJyQxLiQyJyk7XG4gIHYgPSB2LnJlcGxhY2UoLyhcXGR7M30pXFwuKFxcZHszfSkoXFxkKS8sICckMS4kMi4kMycpO1xuICB2ID0gdi5yZXBsYWNlKC8oXFxkezN9KVxcLihcXGR7M30pXFwuKFxcZHszfSkoXFxkezEsMn0pJC8sICckMS4kMi4kMy0kNCcpO1xuICBlbC52YWx1ZSA9IHY7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdGFyVmFsaWRhZGUoZWw6IEhUTUxJbnB1dEVsZW1lbnQpOiB2b2lkIHtcbiAgbGV0IHYgPSBlbC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpLnN1YnN0cmluZygwLCA0KTtcbiAgaWYgKHYubGVuZ3RoID49IDMpIHYgPSB2LnN1YnN0cmluZygwLCAyKSArICcvJyArIHYuc3Vic3RyaW5nKDIpO1xuICBlbC52YWx1ZSA9IHY7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdGFyQ2VwKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGxldCB2ID0gZWwudmFsdWUucmVwbGFjZSgvXFxEL2csICcnKS5zdWJzdHJpbmcoMCwgOCk7XG4gIGlmICh2Lmxlbmd0aCA+IDUpIHYgPSB2LnN1YnN0cmluZygwLCA1KSArICctJyArIHYuc3Vic3RyaW5nKDUpO1xuICBlbC52YWx1ZSA9IHY7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBhZ2FyQ2FydGFvKCk6IFByb21pc2U8dm9pZD4ge1xuICBtb3N0cmFyVG9hc3QoJ1x1RDgzRFx1RENCMyBQYWdhbWVudG8gcG9yIGNhcnRcdTAwRTNvIGVtIGJyZXZlISBVc2UgbyBQaXggcG9yIGVucXVhbnRvLicsICdpbmZvJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhclBhZ2FtZW50b1BpeCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFfcGl4UGVkaWRvSWQpIHJldHVybjtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGVkaWRvUmVwb3NpdG9yeS5maW5kQnlJZChfcGl4UGVkaWRvSWQpO1xuICBpZiAocmVzdWx0Lm9rICYmIHJlc3VsdC52YWx1ZSkge1xuICAgIGNvbnN0IHN0YXR1c1BhZyA9IHJlc3VsdC52YWx1ZS5zdGF0dXNQYWdhbWVudG87XG4gICAgaWYgKHN0YXR1c1BhZyA9PT0gJ3BhZ28nKSB7XG4gICAgICBpZiAoX3BpeFBvbGxUaW1lcikgeyBjbGVhckludGVydmFsKF9waXhQb2xsVGltZXIpOyBfcGl4UG9sbFRpbWVyID0gbnVsbDsgfVxuICAgICAgbW9zdHJhclJlY2lib1BpeCgpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsb2cud2FybignRXJybyBhbyB2ZXJpZmljYXIgcGFnYW1lbnRvJywgeyBlcnJvcjogcmVzdWx0Lm9rID8gJ25vdCBmb3VuZCcgOiByZXN1bHQuZXJyb3IubWVzc2FnZSB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtb3N0cmFyUmVjaWJvUGl4KCk6IHZvaWQge1xuICBjb25zdCBsaW5oYXNJdGVucyA9IF9waXhJdGVucy5tYXAoaSA9PlxuICAgICc8ZGl2IGNsYXNzPVwicmVjaWJvLWl0ZW1cIj48c3Bhbj4nICsgZXNjSFRNTChpLm5vbWUpICsgJzwvc3Bhbj48c3Bhbj5SJCAnICsgTnVtYmVyKGkucHJlY28pLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJykgKyAnPC9zcGFuPjwvZGl2PidcbiAgKS5qb2luKCcnKTtcbiAgY29uc3QgcGl4Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBpeC1ib3gnKTtcbiAgaWYgKHBpeEJveCkge1xuICAgIHBpeEJveC5pbm5lckhUTUwgPVxuICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6NTJweDttYXJnaW4tYm90dG9tOjhweFwiPlx1MjcwNTwvZGl2PicgK1xuICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MjBweDtmb250LXdlaWdodDo3MDA7Y29sb3I6IzE2NjUzNDttYXJnaW4tYm90dG9tOjRweFwiPlBhZ2FtZW50byByZWNlYmlkbyE8L2Rpdj4nICtcbiAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjEzcHg7Y29sb3I6IzZCNUI1MjttYXJnaW4tYm90dG9tOjE2cHhcIj5TZXUgcGVkaWRvIGZvaSBjb25maXJtYWRvIGNvbSBzdWNlc3NvPC9kaXY+JyArXG4gICAgICAnPGRpdiBzdHlsZT1cImJhY2tncm91bmQ6I2YwZmRmNDtib3JkZXI6MS41cHggc29saWQgI2JiZjdkMDtib3JkZXItcmFkaXVzOjEycHg7cGFkZGluZzoxNHB4O3RleHQtYWxpZ246bGVmdDttYXJnaW4tYm90dG9tOjE0cHhcIj4nICtcbiAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6NzAwO2NvbG9yOiMxNjY1MzQ7bWFyZ2luLWJvdHRvbTo4cHg7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi41cHhcIj5cdUQ4M0RcdURDQ0IgUmVzdW1vIGRvIHBlZGlkbzwvZGl2PicgK1xuICAgICAgbGluaGFzSXRlbnMgK1xuICAgICAgJzxkaXYgc3R5bGU9XCJib3JkZXItdG9wOjFweCBzb2xpZCAjYmJmN2QwO21hcmdpbi10b3A6OHB4O3BhZGRpbmctdG9wOjhweDtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc2l6ZToxNHB4XCI+JyArXG4gICAgICAnPHNwYW4+VG90YWw8L3NwYW4+PHNwYW4gc3R5bGU9XCJjb2xvcjojRTg1MjhBXCI+UiQgJyArIE51bWJlcihfcGl4VG90YWwpLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJykgKyAnPC9zcGFuPicgK1xuICAgICAgJzwvZGl2PicgK1xuICAgICAgJzxkaXYgc3R5bGU9XCJtYXJnaW4tdG9wOjhweDtmb250LXNpemU6MTFweDtjb2xvcjojNGI3YzVlXCI+XHVEODNEXHVEQ0NEICcgKyBlc2NIVE1MKF9waXhFbmRlcmVjbykgKyAnPC9kaXY+JyArXG4gICAgICAnPC9kaXY+JyArXG4gICAgICAnPGJ1dHRvbiBvbmNsaWNrPVwiZmVjaGFyUmVjaWJvUGl4KClcIiBzdHlsZT1cIndpZHRoOjEwMCU7cGFkZGluZzoxM3B4O2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDEzNWRlZywjRTg1MjhBLCNDMjNBNkUpO2NvbG9yOiNmZmY7Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc2l6ZToxNXB4O2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6MTJweDtjdXJzb3I6cG9pbnRlcjtmb250LWZhbWlseTppbmhlcml0XCI+XHVEODNEXHVEQ0FDIFZlciBwZWRpZG8gbm8gV2hhdHNBcHA8L2J1dHRvbj4nO1xuICB9XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChfcGl4TXNnV0EpLCAnX2JsYW5rJyk7XG4gIH0sIDIwMDApO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJSZWNpYm9QaXgoKTogdm9pZCB7XG4gIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChfcGl4TXNnV0EpLCAnX2JsYW5rJyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgbGltcGFyQ2FycmluaG8oKTtcbiAgX3BpeFBlZGlkb0lkID0gbnVsbDsgX3BpeFBheWxvYWQgPSAnJzsgX3BpeE1zZ1dBID0gJyc7IF9waXhUb3RhbCA9IDA7IF9waXhOb21lID0gJyc7XG4gIF9waXhJdGVucyA9IFtdOyBfcGl4RW5kZXJlY28gPSAnJztcbn1cblxuZnVuY3Rpb24gY29waWFyUGl4KCk6IHZvaWQge1xuICBpZiAoIV9waXhQYXlsb2FkKSByZXR1cm47XG4gIGlmIChuYXZpZ2F0b3IuY2xpcGJvYXJkKSB7XG4gICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoX3BpeFBheWxvYWQpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBpeC1jb3B5LWJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgICAgIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ1x1MjcwNSBDXHUwMEYzZGlnbyBjb3BpYWRvISc7IHNldFRpbWVvdXQoKCkgPT4geyBidG4udGV4dENvbnRlbnQgPSAnXHVEODNEXHVEQ0NCIENvcGlhciBjaGF2ZSBQaXgnOyB9LCAyNTAwKTsgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgICB0YS52YWx1ZSA9IF9waXhQYXlsb2FkO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGEpO1xuICAgIHRhLnNlbGVjdCgpO1xuICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0YSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FuY2VsYXJQaXgoKTogdm9pZCB7XG4gIGlmIChfcGl4UG9sbFRpbWVyKSB7IGNsZWFySW50ZXJ2YWwoX3BpeFBvbGxUaW1lcik7IF9waXhQb2xsVGltZXIgPSBudWxsOyB9XG4gIGNvbnN0IGVzdGFBYmVydG8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4QmFja2Ryb3AnKT8uY2xhc3NMaXN0LmNvbnRhaW5zKCdhYmVydG8nKSA/PyBmYWxzZTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xuICBfcGl4UGVkaWRvSWQgPSBudWxsOyBfcGl4UGF5bG9hZCA9ICcnOyBfcGl4TXNnV0EgPSAnJzsgX3BpeFRvdGFsID0gMDsgX3BpeE5vbWUgPSAnJztcbiAgX3BpeEl0ZW5zID0gW107IF9waXhFbmRlcmVjbyA9ICcnO1xuICBpZiAoZXN0YUFiZXJ0bykgYWJyaXJNb2RhbCgpO1xufVxuXG5mdW5jdGlvbiBwaXhKYVBhZ3VlaSgpOiB2b2lkIHtcbiAgY2FuY2VsYXJQaXgoKTtcbiAgZmluYWxpemFyUGVkaWRvV2hhdHNBcHAoKTtcbn1cblxuZnVuY3Rpb24gZmluYWxpemFyUGVkaWRvV2hhdHNBcHAoKTogdm9pZCB7XG4gIGNvbnN0IGl0ZW5zID0gY2FydFNlcnZpY2UuZ2V0SXRlbXMoKTtcbiAgaWYgKGl0ZW5zLmxlbmd0aCA9PT0gMCkgeyBtb3N0cmFyVG9hc3QoJ0NhcnJpbmhvIHZhemlvJywgJ2Vycm8nKTsgcmV0dXJuOyB9XG4gIGNvbnN0IG5vbWUgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBlbmRlcmVjbyA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCB0b3RhbCA9IEFycmF5LmZyb20oaXRlbnMpLnJlZHVjZSgocywgaSkgPT4gcyArIGkucHJlY28sIDApO1xuICBjb25zdCBsaW5oYXMgPSBBcnJheS5mcm9tKGl0ZW5zKS5tYXAoaSA9PiBgXHUyNUI4ICR7aS5ub21lfSBcdTIwMTQgUiQgJHtpLnByZWNvLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyl9IGApLmpvaW4oJ1xcbicpO1xuICBjb25zdCBtc2cgPSBgXHVEODNEXHVERUQyICpQRURJRE8gR0VMQU1PVVIqIChQaXggZW52aWFkbyBtYW51YWxtZW50ZSlcXG5cXG4ke2xpbmhhc31cXG5cXG4qVG90YWw6IFIkICR7dG90YWwudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX0qXFxuXFxuXHVEODNEXHVEQzY0ICR7bm9tZX1cXG5cdUQ4M0RcdURDQ0QgJHtlbmRlcmVjb31cXG5cXG5fQ29uZmlybWFuZG8gZW52aW8gZG8gcGFnYW1lbnRvIFBpeC5fYDtcbiAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG1zZyksICdfYmxhbmsnKTtcbn1cblxuLy8gPT09PT0gTE9HSU4gVUkgPT09PT1cbmZ1bmN0aW9uIG1hc2NhcmFUZWxlZm9uZShlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICBlbC52YWx1ZSA9IGFwbGljYXJNYXNjYXJhVGVsZWZvbmUoZWwudmFsdWUpO1xufVxuXG5mdW5jdGlvbiBlbnRyYXJDb21DbGllbnRlKGNsaWVudGVSYXc6IENsaWVudGUpOiB2b2lkIHtcbiAgY29uc3QgZG9tYWluQ2xpZW50ZSA9IENsaWVudGVFbnRpdHkuZnJvbURCKGNsaWVudGVSYXcpO1xuICBsb2dpblVzZUNhc2UubG9naW4oZG9tYWluQ2xpZW50ZSk7XG5cbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luT3ZlcmxheScpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBjb25zdCB1c3VhcmlvQmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzdWFyaW9CYXInKTtcbiAgaWYgKHVzdWFyaW9CYXIpIHVzdWFyaW9CYXIuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtZmxleCc7XG4gIGNvbnN0IHVzdWFyaW9Ob21lRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb05vbWUnKTtcbiAgaWYgKHVzdWFyaW9Ob21lRWwpIHVzdWFyaW9Ob21lRWwudGV4dENvbnRlbnQgPSBjbGllbnRlUmF3Lm5vbWU7XG4gIGNvbnN0IHJvbGV0YUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCdG5GbHV0dWFudGUnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChyb2xldGFCdG4pIHJvbGV0YUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICBjb25zdCB1c3VhcmlvVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzdWFyaW9UZWwnKTtcbiAgaWYgKHVzdWFyaW9UZWwpIHVzdWFyaW9UZWwudGV4dENvbnRlbnQgPSBjbGllbnRlUmF3LnRlbGVmb25lLnJlcGxhY2UoL14oXFxkezJ9KShcXGR7NX0pKFxcZHs0fSkkLywgJygkMSkgJDItJDMnKTtcbiAgY29uc3QgaW5wTm9tZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJykgYXMgSFRNTElucHV0RWxlbWVudCB8IG51bGw7XG4gIGlmIChpbnBOb21lKSBpbnBOb21lLnZhbHVlID0gY2xpZW50ZVJhdy5ub21lO1xuICBjb25zdCBpbnBFbmRlcmVjbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBFbmRlcmVjbycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQgfCBudWxsO1xuICBpZiAoaW5wRW5kZXJlY28gJiYgY2xpZW50ZVJhdy5lbmRlcmVjbykgaW5wRW5kZXJlY28udmFsdWUgPSBjbGllbnRlUmF3LmVuZGVyZWNvO1xufVxuXG5hc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJUZWxlZm9uZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKF92ZXJpZmljYW5kbykgcmV0dXJuO1xuICBjb25zdCB0ZWxJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpblRlbGVmb25lJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgY29uc3QgZXJybyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbkVycm8nKTtcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2V0YXBhVGVsZWZvbmUgYnV0dG9uJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICBpZiAoZXJybykgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdWZXJpZmljYW5kby4uLic7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IH1cbiAgX3ZlcmlmaWNhbmRvID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBsb2dpblVzZUNhc2UuZXhlY3V0ZSh0ZWxJbnB1dC52YWx1ZSk7XG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIGNvbnN0IG1zZyA9IHJlc3VsdC5lcnJvci5uYW1lID09PSAnTmV0d29ya0Vycm9yJ1xuICAgICAgICA/ICdTZW0gY29uZXhcdTAwRTNvLiBWZXJpZmlxdWUgc3VhIGludGVybmV0IGUgdGVudGUgbm92YW1lbnRlLidcbiAgICAgICAgOiByZXN1bHQuZXJyb3IubWVzc2FnZTtcbiAgICAgIGxvZy5lcnJvcigndmVyaWZpY2FyVGVsZWZvbmUgZmFsaG91JywgeyBlcnJvcjogcmVzdWx0LmVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gbXNnOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyZXN1bHQudmFsdWUuZXhpc3RlICYmIHJlc3VsdC52YWx1ZS5jbGllbnRlKSB7XG4gICAgICBlbnRyYXJDb21DbGllbnRlKHJlc3VsdC52YWx1ZS5jbGllbnRlLnRvSlNPTigpIGFzIENsaWVudGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBldGFwYVRlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYVRlbGVmb25lJyk7XG4gICAgICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gICAgICBpZiAoZXRhcGFUZWwpIGV0YXBhVGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBpZiAoZXRhcGFDYWQpIGV0YXBhQ2FkLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgKHRlbElucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQgJiB7IGRhdGFzZXQ6IERPTVN0cmluZ01hcCB9KS5kYXRhc2V0Wyd0ZWwnXSA9IHRlbElucHV0LnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5Ob21lJyk/LmZvY3VzKCk7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ1NlbSBjb25leFx1MDBFM28gb3UgZXJybyBubyBzZXJ2aWRvci4gVGVudGUgbm92YW1lbnRlLic7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdDb250aW51YXIgXHUyMTkyJzsgYnRuLmRpc2FibGVkID0gZmFsc2U7IH1cbiAgICBfdmVyaWZpY2FuZG8gPSBmYWxzZTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjYWRhc3RyYXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChfY2FkYXN0cmFuZG8pIHJldHVybjtcbiAgY29uc3Qgbm9tZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IHRlbElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCBub21lID0gbm9tZUlucHV0LnZhbHVlO1xuICBjb25zdCB0ZWwgPSAodGVsSW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCAmIHsgZGF0YXNldDogRE9NU3RyaW5nTWFwIH0pLmRhdGFzZXRbJ3RlbCddID8/ICcnO1xuICBjb25zdCBlcnJvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhZGFzdHJvRXJybycpO1xuICBpZiAoIW5vbWUudHJpbSgpKSB7XG4gICAgaWYgKGVycm8pIHsgZXJyby50ZXh0Q29udGVudCA9ICdEaWdpdGUgc2V1IG5vbWUuJzsgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgfVxuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZXJybykgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZXRhcGFDYWRhc3RybyBidXR0b24nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ0VudHJhbmRvLi4uJzsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgfVxuICBfY2FkYXN0cmFuZG8gPSB0cnVlO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxvZ2luVXNlQ2FzZS5yZWdpc3Rlcihub21lLCB0ZWwsICcnKTtcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgaWYgKGVycm8pIHsgZXJyby50ZXh0Q29udGVudCA9IHJlc3VsdC5lcnJvci5tZXNzYWdlOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLnRvSlNPTigpIGFzIENsaWVudGUpO1xuICB9IGNhdGNoIHtcbiAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ0Vycm8gYW8gY2FkYXN0cmFyLiBWZXJpZmlxdWUgc3VhIGNvbmV4XHUwMEUzbyBlIHRlbnRlIG5vdmFtZW50ZS4nOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnRW50cmFyIG5vIGNhcmRcdTAwRTFwaW8gXHUyNzI4JzsgYnRuLmRpc2FibGVkID0gZmFsc2U7IH1cbiAgICBfY2FkYXN0cmFuZG8gPSBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2b2x0YXJFdGFwYVRlbGVmb25lKCk6IHZvaWQge1xuICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gIGNvbnN0IGV0YXBhVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhVGVsZWZvbmUnKTtcbiAgaWYgKGV0YXBhQ2FkKSBldGFwYUNhZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBpZiAoZXRhcGFUZWwpIGV0YXBhVGVsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufVxuXG5mdW5jdGlvbiBzYWlyKCk6IHZvaWQge1xuICBpZiAoIWNvbmZpcm0oJ0Rlc2VqYSBzYWlyIGRhIHN1YSBjb250YT8nKSkgcmV0dXJuO1xuICBsb2dpblVzZUNhc2UubG9nb3V0KCk7XG4gIGNvbnN0IHVzdWFyaW9CYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb0JhcicpO1xuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9ICcnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWUgPSAnJztcbiAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpblRlbGVmb25lJykgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSAnJztcbiAgY29uc3QgZXRhcGFUZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFUZWxlZm9uZScpO1xuICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIGlmIChldGFwYUNhZCkgZXRhcGFDYWQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luT3ZlcmxheScpIS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xufVxuXG5mdW5jdGlvbiBtb3N0cmFyTG9naW4oKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk92ZXJsYXknKSEuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgc2V0VGltZW91dCgoKSA9PiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KT8uZm9jdXMoKSwgMzAwKTtcbn1cblxuLy8gPT09PT0gUk9MRVRBIFVJID09PT09XG5hc3luYyBmdW5jdGlvbiBhYnJpclJvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQmFja2Ryb3AnKTtcbiAgaWYgKCFiZCkgcmV0dXJuO1xuICBiZC5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdtb2RhbC1hYmVydG8nKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVN0YXR1c0JveCcpIS5pbm5lckhUTUwgPSAnJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluYXRpdmEnKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YU5hb0xvZ2FkbycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdHJ1Y29lcycpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkVudmlhcldyYXAnKSEuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFXaGVlbFNlY3Rpb24nKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3UnKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJlc3VsdGFkbycpIS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpdmVsJyk7XG5cbiAgY29uc3QgY2ZnID0gYXdhaXQgY2FycmVnYXJDb25maWdSb2xldGEoKTtcbiAgY29uc3QgcHJlbWlvcyA9IGdldFByZW1pb3MoKTtcblxuICBjb25zdCBncmlkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVByZW1pb3NHcmlkJyk7XG4gIGlmIChncmlkKSB7XG4gICAgY29uc3QgaWNvbmVzID0gWydcdUQ4M0NcdURGNkInLCAnXHVEODNFXHVEREMxJywgJ1x1RDgzRFx1REU5QScsICdcdUQ4M0RcdURDQjgnLCAnXHVEODNEXHVEQ0IwJywgJ1x1RDgzQ1x1REY4OScsICdcdUQ4M0NcdURGNkUnLCAnXHVEODNDXHVERjgwJywgJ1x1RDgzQ1x1REYxRiddO1xuICAgIGdyaWQuaW5uZXJIVE1MID0gcHJlbWlvcy5tYXAoKHAsIGkpID0+IGA8ZGl2IGNsYXNzPVwicm9sZXRhLXByZW1pby1pdGVtXCI+JHtpY29uZXNbaSAlIGljb25lcy5sZW5ndGhdfSAke2VzY0hUTUwocCl9PC9kaXY+YCkuam9pbignJyk7XG4gIH1cblxuICBpZiAoY2ZnICYmICFjZmcuYXRpdmEpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5hdGl2YScpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdHJ1Y29lcycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB9XG5cbiAgZGVzZW5oYXJSb2xldGEocHJlbWlvcyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFXaGVlbFNlY3Rpb24nKSEuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghY2xpZW50ZUF0dWFsKSB7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YU5hb0xvZ2FkbycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgY29uc3QgZ2lyYXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gZmFsc2U7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMSc7IGdpcmFyQnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REZBMSBHSVJBUiBBR09SQSEnOyB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgYXR1YWxpemFyVUlSb2xldGEoc3RhdHVzKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhclJvbGV0YUJhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAncm9sZXRhQmFja2Ryb3AnKSBmZWNoYXJSb2xldGEoKTtcbn1cblxuZnVuY3Rpb24gYXR1YWxpemFyVUlSb2xldGEoaW5mbzogUGFydGljaXBhY2FvIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBzdGF0dXNCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhU3RhdHVzQm94JykhO1xuICBjb25zdCBpbnN0cnVjb2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluc3RydWNvZXMnKSE7XG4gIGNvbnN0IGJ0bkVudmlhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCdG5FbnZpYXJXcmFwJykhO1xuICBjb25zdCB3aGVlbFNlY3Rpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhV2hlZWxTZWN0aW9uJykhO1xuICBjb25zdCBqYUdpcm91ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3UnKSE7XG4gIGNvbnN0IGdpcmFyQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUdpcmFyQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcblxuICB3aGVlbFNlY3Rpb24uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIGRlc2VuaGFyUm9sZXRhKGdldFByZW1pb3MoKSk7XG5cbiAgaWYgKGlzQ29udGFUZXN0ZShhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUpKSB7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gZmFsc2U7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMSc7IGdpcmFyQnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REZBMSBHSVJBUiBBR09SQSEnOyB9XG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICcnO1xuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFpbmZvKSB7XG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICcnO1xuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IGdpcmFyQnRuLnRpdGxlID0gJ0VudmllIHN1YXMgcHJvdmFzIHBhcmEgbGliZXJhciBhIHJvbGV0YSc7IH1cbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoaW5mby5zdGF0dXMgPT09ICdwZW5kZW50ZScpIHtcbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtc3RhdHVzLWJveCByb2xldGEtc3RhdHVzLXBlbmRlbnRlXCI+XHUyM0YzIDxkaXY+PHN0cm9uZz5QYXJ0aWNpcGFcdTAwRTdcdTAwRTNvIGVudmlhZGEhPC9zdHJvbmc+PGJyPlN1YXMgcHJvdmFzIGVzdFx1MDBFM28gZW0gYW5cdTAwRTFsaXNlLiBBZ3VhcmRlIGEgYXByb3ZhXHUwMEU3XHUwMEUzbyAoYXRcdTAwRTkgMjRoKS48L2Rpdj48L2Rpdj4nO1xuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gdHJ1ZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyBnaXJhckJ0bi50aXRsZSA9ICdBZ3VhcmRhbmRvIGFwcm92YVx1MDBFN1x1MDBFM28nOyB9XG4gIH0gZWxzZSBpZiAoaW5mby5zdGF0dXMgPT09ICdyZWplaXRhZG8nKSB7XG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1yZWplaXRhZG9cIj5cdTI3NEMgPGRpdj48c3Ryb25nPlBhcnRpY2lwYVx1MDBFN1x1MDBFM28gblx1MDBFM28gYXByb3ZhZGEuPC9zdHJvbmc+PGJyPlRlbnRlIG5vdmFtZW50ZSBjdW1wcmluZG8gdG9kb3Mgb3MgcmVxdWlzaXRvcy48L2Rpdj48L2Rpdj4nO1xuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgfVxuICB9IGVsc2UgaWYgKGluZm8uc3RhdHVzID09PSAnYXByb3ZhZG8nICYmICFpbmZvLmphX2dpcm91KSB7XG4gICAgY29uc3QgaG9qZSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdO1xuICAgIGNvbnN0IGRpYUFwcm92YWNhbyA9IGluZm8uZGF0YV9hcHJvdmFjYW8gPyBpbmZvLmRhdGFfYXByb3ZhY2FvLnNwbGl0KCdUJylbMF0gOiBudWxsO1xuICAgIGlmIChkaWFBcHJvdmFjYW8gIT09IGhvamUpIHtcbiAgICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1zdGF0dXMtYm94IHJvbGV0YS1zdGF0dXMtcmVqZWl0YWRvXCI+XHUyM0YwIDxkaXY+PHN0cm9uZz5QcmF6byBleHBpcmFkby48L3N0cm9uZz48YnI+Vm9jXHUwMEVBIGZvaSBhcHJvdmFkbyBlbSBvdXRybyBkaWEgZSBuXHUwMEUzbyBnaXJvdSBhIHRlbXBvLiBFbnZpZSBub3ZhcyBwcm92YXMgcGFyYSBwYXJ0aWNpcGFyIG5vdmFtZW50ZS48L2Rpdj48L2Rpdj4nO1xuICAgICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNEXHVERDEyIFByYXpvIGV4cGlyYWRvJzsgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtc3RhdHVzLWJveCByb2xldGEtc3RhdHVzLWFwcm92YWRvXCI+XHUyNzA1IDxkaXY+PHN0cm9uZz5BcHJvdmFkbyEgR2lyZSBob2plITwvc3Ryb25nPjxicj5Wb2NcdTAwRUEgdGVtIGF0XHUwMEU5IG1laWEtbm9pdGUgcGFyYSB1c2FyIHNldSBnaXJvLiBOXHUwMEUzbyBhY3VtdWxhITwvZGl2PjwvZGl2Pic7XG4gICAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSBmYWxzZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcxJzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERkExIEdJUkFSIEFHT1JBISc7IH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaW5mby5qYV9naXJvdSAmJiAhaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHtcbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJyc7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IH1cbiAgICBjb25zdCBwcmVtaW9FbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFKYUdpcm91UHJlbWlvJyk7XG4gICAgaWYgKHByZW1pb0VsKSB7XG4gICAgICBwcmVtaW9FbC5pbm5lckhUTUwgPSBpbmZvLnByZW1pb1xuICAgICAgICA/ICdTZXUgcHJcdTAwRUFtaW8gZm9pOiA8c3Ryb25nIHN0eWxlPVwiY29sb3I6dmFyKC0tcm9zYSlcIj4nICsgZXNjSFRNTChpbmZvLnByZW1pbykgKyAnPC9zdHJvbmc+LiBFbnRyZSBlbSBjb250YXRvIGNvbm9zY28gcGFyYSByZXNnYXRhciEnXG4gICAgICAgIDogJ1ZvY1x1MDBFQSBqXHUwMEUxIHVzb3Ugc3VhIGNoYW5jZSBuZXN0YSBjYW1wYW5oYS4nO1xuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBnaXJhclJvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghY2xpZW50ZUF0dWFsKSB7IG1vc3RyYXJUb2FzdCgnRmFcdTAwRTdhIGxvZ2luIHBhcmEgZ2lyYXIgYSByb2xldGEhJywgJ2Vycm8nKTsgcmV0dXJuOyB9XG5cbiAgY29uc3Qgc3RhdHVzR2lybyA9IGF3YWl0IHZlcmlmaWNhclN0YXR1c1JvbGV0YShjbGllbnRlQXR1YWwuaWQgPz8gMCk7XG4gIGlmICghaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHtcbiAgICBpZiAoIXN0YXR1c0dpcm8gfHwgc3RhdHVzR2lyby5zdGF0dXMgIT09ICdhcHJvdmFkbycgfHwgc3RhdHVzR2lyby5qYV9naXJvdSkge1xuICAgICAgbW9zdHJhclRvYXN0KCdWb2NcdTAwRUEgcHJlY2lzYSBzZXIgYXByb3ZhZG8gcGVsYSBlcXVpcGUgYW50ZXMgZGUgZ2lyYXIhJywgJ2Vycm8nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNlbWFuYSA9IGdldFNlbWFuYUF0dWFsKCk7XG4gICAgICBjb25zdCBjb3VudFJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuY291bnRWZW5jZWRvcmVzU2VtYW5hKHNlbWFuYSk7XG4gICAgICBjb25zdCB2ZW5jZWRvcmVzQ291bnQgPSBjb3VudFJlc3VsdC5vayA/IGNvdW50UmVzdWx0LnZhbHVlIDogMDtcblxuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKGAke1NVUEFCQVNFX1VSTH0vcmVzdC92MS9yb2xldGFfY29uZmlnP2lkPWVxLjEmc2VsZWN0PW1heF92ZW5jZWRvcmVzX3NlbWFuYWAsIHtcbiAgICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICAgIH0pO1xuICAgICAgY29uc3QgY2ZnID0gYXdhaXQgcmVzcC5qc29uKCkgYXMgQXJyYXk8eyBtYXhfdmVuY2Vkb3Jlc19zZW1hbmE6IG51bWJlciB9PjtcbiAgICAgIGNvbnN0IGxpbWl0ZSA9IGNmZ1swXT8ubWF4X3ZlbmNlZG9yZXNfc2VtYW5hID8/IDE7XG4gICAgICBpZiAodmVuY2Vkb3Jlc0NvdW50ID49IGxpbWl0ZSkge1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gICAgICAgIGlmIChidG4pIHsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgfVxuICAgICAgICBjb25zdCByZXN1bHRFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFSZXN1bHRhZG8nKTtcbiAgICAgICAgaWYgKHJlc3VsdEVsKSB7XG4gICAgICAgICAgcmVzdWx0RWwuaW5uZXJIVE1MID0gJ1x1MjZBMFx1RkUwRiA8c3Ryb25nPkpcdTAwRTEgdGVtb3MgdW0gZ2FuaGFkb3IgZXN0YSBzZW1hbmEhPC9zdHJvbmc+PGJyPjxzbWFsbD5BIHByXHUwMEYzeGltYSByb2RhZGEgY29tZVx1MDBFN2EgbmEgc2VtYW5hIHF1ZSB2ZW0uIEZpcXVlIGRlIG9saG8hPC9zbWFsbD4nO1xuICAgICAgICAgIHJlc3VsdEVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2l2ZWwnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkgeyBsb2cud2FybignRXJybyBhbyB2ZXJpZmljYXIgbGltaXRlIHNlbWFuYWwnLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7IH1cbiAgfVxuXG4gIGF3YWl0IGdpcmFyUm9sZXRhRm4oY2xpZW50ZUF0dWFsLCAocHJlbWlvOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCByZXN1bHRFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFSZXN1bHRhZG8nKTtcbiAgICBpZiAocmVzdWx0RWwpIHtcbiAgICAgIHJlc3VsdEVsLmlubmVySFRNTCA9ICdcdUQ4M0NcdURGODkgVm9jXHUwMEVBIGdhbmhvdTogPHN0cm9uZyBzdHlsZT1cImNvbG9yOnZhcigtLXJvc2EpXCI+JyArIGVzY0hUTUwocHJlbWlvKSArICc8L3N0cm9uZz4hPGJyPjxzbWFsbCBzdHlsZT1cImZvbnQtc2l6ZToxM3B4O2NvbG9yOnZhcigtLXRleHRvLXNlYylcIj5FbnRyZSBlbSBjb250YXRvIGNvbm9zY28gcGVsbyBXaGF0c0FwcCBwYXJhIHJlc2dhdGFyIHNldSBwclx1MDBFQW1pbyE8L3NtYWxsPic7XG4gICAgICByZXN1bHRFbC5jbGFzc0xpc3QuYWRkKCd2aXNpdmVsJyk7XG4gICAgfVxuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgICBpZiAoYnRuKSBidG4udGV4dENvbnRlbnQgPSAnXHUyNzEzIEdpcmFkbyEnO1xuICAgIHNhbHZhclZlbmNlZG9yKGNsaWVudGVBdHVhbCwgcHJlbWlvKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVudmlhclByb3Zhc1doYXRzQXBwKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHsgYWxlcnQoJ0ZhXHUwMEU3YSBsb2dpbiBhbnRlcyBkZSBlbnZpYXIgc3VhcyBwcm92YXMuJyk7IHJldHVybjsgfVxuICBjb25zdCBzdGF0dXNBdHVhbCA9IGF3YWl0IHZlcmlmaWNhclN0YXR1c1JvbGV0YShjbGllbnRlQXR1YWwuaWQgPz8gMCk7XG4gIGlmIChzdGF0dXNBdHVhbCAmJiAoc3RhdHVzQXR1YWwuc3RhdHVzID09PSAncGVuZGVudGUnIHx8IHN0YXR1c0F0dWFsLnN0YXR1cyA9PT0gJ2Fwcm92YWRvJykpIHtcbiAgICBhdHVhbGl6YXJVSVJvbGV0YShzdGF0dXNBdHVhbCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG5vbWUgPSBjbGllbnRlQXR1YWwubm9tZSB8fCAnJztcbiAgY29uc3QgdGVsID0gY2xpZW50ZUF0dWFsLnRlbGVmb25lIHx8ICcnO1xuICBjb25zdCBpbnN0RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdGFncmFtSW5wdXQnKSBhcyBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgaW5zdGFncmFtID0gaW5zdEVsID8gaW5zdEVsLnZhbHVlLnRyaW0oKSA6ICcnO1xuICBjb25zdCBtc2cgPSAnT2xcdTAwRTEsIGVxdWlwZSBHZWxhbW91ciEgUXVlcm8gcGFydGljaXBhciBkYSBSb2xldGEgVklQLiUwQSUwQU5vbWU6ICcgKyBlbmNvZGVVUklDb21wb25lbnQobm9tZSkgK1xuICAgICclMEFUZWxlZm9uZTogJyArIGVuY29kZVVSSUNvbXBvbmVudCh0ZWwpICtcbiAgICAoaW5zdGFncmFtID8gJyUwQUluc3RhZ3JhbTogJyArIGVuY29kZVVSSUNvbXBvbmVudChpbnN0YWdyYW0pIDogJycpICtcbiAgICAnJTBBJTBBRXN0b3UgZW52aWFuZG8gYSBmb3RvIGRvcyBtZXVzIDUgYWRlc2l2b3MgZSBvIHByaW50IGRvIFN0b3J5IHBhcmEgdmFsaWRhXHUwMEU3XHUwMEUzbyEnO1xuICB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBtc2csICdfYmxhbmsnKTtcbiAgYXdhaXQgcmVnaXN0cmFyUGFydGljaXBhY2FvKGluc3RhZ3JhbSk7XG4gIGF0dWFsaXphclVJUm9sZXRhKHsgc3RhdHVzOiAncGVuZGVudGUnLCBqYV9naXJvdTogZmFsc2UgfSBhcyBQYXJ0aWNpcGFjYW8pO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWdpc3RyYXJQYXJ0aWNpcGFjYW8oaW5zdGFncmFtOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghY2xpZW50ZUF0dWFsKSByZXR1cm47XG4gIHRyeSB7XG4gICAgY29uc3QgY2hlY2sgPSBhd2FpdCB2ZXJpZmljYXJTdGF0dXNSb2xldGEoY2xpZW50ZUF0dWFsLmlkID8/IDApO1xuICAgIGlmIChjaGVjayAmJiBjaGVjay5zdGF0dXMgIT09ICdyZWplaXRhZG8nKSByZXR1cm47XG4gICAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByb2xldGFSZXBvc2l0b3J5LnNhdmVQYXJ0aWNpcGFjYW8oe1xuICAgICAgbm9tZTogY2xpZW50ZUF0dWFsLm5vbWUsXG4gICAgICB0ZWxlZm9uZTogY2xpZW50ZUF0dWFsLnRlbGVmb25lLFxuICAgICAgaW5zdGFncmFtOiBpbnN0YWdyYW0gfHwgdW5kZWZpbmVkLFxuICAgICAgc3RhdHVzOiAncGVuZGVudGUnLFxuICAgICAgc2VtYW5hLFxuICAgICAgamFfZ2lyb3U6IGZhbHNlLFxuICAgICAgY3JlYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH0gYXMgaW1wb3J0KCcuL2RvbWFpbi9yb2xldGEnKS5QYXJ0aWNpcGFjYW9Qcm9wcyk7XG4gICAgaWYgKHJlc3VsdC5vaykge1xuICAgICAgc2V0UGFydGljaXBhY2FvSWQocmVzdWx0LnZhbHVlLmlkKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHsgbG9nLndhcm4oJ0Vycm8gYW8gcmVnaXN0cmFyIHBhcnRpY2lwYVx1MDBFN1x1MDBFM28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7IH1cbn1cblxuLy8gPT09PT0gQURNSU4gUk9MRVRBID09PT09XG5mdW5jdGlvbiB2ZXJpZmljYXJBZG1pbigpOiBib29sZWFuIHtcbiAgcmV0dXJuIGFwcFN0b3JlLmdldFN0YXRlKCkuaXNBZG1pbjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYWJyaXJSb2xldGFBZG1pbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCF2ZXJpZmljYXJBZG1pbigpKSB7IGFsZXJ0KCdBY2Vzc28gcmVzdHJpdG8uJyk7IHJldHVybjsgfVxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQWRtaW5CYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgYXdhaXQgY2FycmVnYXJQYXJ0aWNpcGFudGVzUm9sZXRhKCk7XG4gIGF3YWl0IGNhcnJlZ2FyQ29uZmlnQWRtaW4oKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhQWRtaW4oKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFBZG1pbkJhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJSb2xldGFBZG1pbkJhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAncm9sZXRhQWRtaW5CYWNrZHJvcCcpIGZlY2hhclJvbGV0YUFkbWluKCk7XG59XG5cbmZ1bmN0aW9uIGFicmlyVGFiQWRtaW4odGFiOiBzdHJpbmcsIGJ0bjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvbGV0YS1hZG1pbi10YWInKS5mb3JFYWNoKHQgPT4gdC5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvbGV0YS1hZG1pbi1wYW5lbCcpLmZvckVhY2gocCA9PiBwLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xuICBidG4uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgY29uc3QgdGFiSWQgPSAndGFiJyArIHRhYi5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRhYi5zbGljZSgxKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFiSWQpPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBpZiAodGFiID09PSAncGVuZGVudGVzJykgY2FycmVnYXJQYXJ0aWNpcGFudGVzUm9sZXRhKCk7XG4gIGVsc2UgaWYgKHRhYiA9PT0gJ2Fwcm92YWRvcycpIGNhcnJlZ2FyQXByb3ZhZG9zUm9sZXRhKCk7XG4gIGVsc2UgaWYgKHRhYiA9PT0gJ3ZlbmNlZG9yZXMnKSBjYXJyZWdhclZlbmNlZG9yZXNSb2xldGEoKTtcbiAgZWxzZSBpZiAodGFiID09PSAnY29uZmlnJykgY2FycmVnYXJDb25maWdBZG1pbigpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjYXJyZWdhclBhcnRpY2lwYW50ZXNSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpc3RhUGVuZGVudGVzJyk7XG4gIGlmICghZWwpIHJldHVybjtcbiAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5DYXJyZWdhbmRvLi4uPC9kaXY+JztcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9wYXJ0aWNpcGFjb2VzP3N0YXR1cz1lcS5wZW5kZW50ZSZvcmRlcj1jcmVhdGVkX2F0LmRlc2MnLCB7XG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByLmpzb24oKSBhcyBBcnJheTxQYXJ0aWNpcGFjYW8+O1xuICAgIGlmICghZGF0YSB8fCAhZGF0YS5sZW5ndGgpIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5OZW5odW0gcGFydGljaXBhbnRlIHBlbmRlbnRlLjwvZGl2Pic7IHJldHVybjsgfVxuICAgIGVsLmlubmVySFRNTCA9IGRhdGEubWFwKHAgPT4ge1xuICAgICAgY29uc3QgZHQgPSBuZXcgRGF0ZShwLmNyZWF0ZWRfYXQpLnRvTG9jYWxlU3RyaW5nKCdwdC1CUicpO1xuICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1pdGVtXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1pbmZvXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1ub21lXCI+JyArIGVzY0hUTUwocC5ub21lID8/ICcnKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLXRlbFwiPicgKyBlc2NIVE1MKHAudGVsZWZvbmUpICsgKHAuaW5zdGFncmFtID8gJyBcdTAwQjcgQCcgKyBlc2NIVE1MKHAuaW5zdGFncmFtKSA6ICcnKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTFweDtjb2xvcjojOTk5XCI+JyArIGR0ICsgJzwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1hY29lc1wiPicgK1xuICAgICAgICAnPGJ1dHRvbiBjbGFzcz1cImJ0bi1hcHJvdmFyXCIgb25jbGljaz1cImFwcm92YXJQYXJ0aWNpcGFudGUoJyArIHAuaWQgKyAnLCB0aGlzKVwiPlx1MjcxMyBBcHJvdmFyPC9idXR0b24+JyArXG4gICAgICAgICc8YnV0dG9uIGNsYXNzPVwiYnRuLXJlamVpdGFyXCIgb25jbGljaz1cInJlamVpdGFyUGFydGljaXBhbnRlKCcgKyBwLmlkICsgJywgdGhpcylcIj5cdTI3MTcgUmVqZWl0YXI8L2J1dHRvbj4nICtcbiAgICAgICAgJzwvZGl2PjwvZGl2Pic7XG4gICAgfSkuam9pbignJyk7XG4gIH0gY2F0Y2ggeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkVycm8gYW8gY2FycmVnYXIuPC9kaXY+JzsgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjYXJyZWdhckFwcm92YWRvc1JvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlzdGFBcHJvdmFkb3MnKTtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkNhcnJlZ2FuZG8uLi48L2Rpdj4nO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/c3RhdHVzPWVxLmFwcm92YWRvJm9yZGVyPWRhdGFfYXByb3ZhY2FvLmRlc2MnLCB7XG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByLmpzb24oKSBhcyBBcnJheTxQYXJ0aWNpcGFjYW8+O1xuICAgIGlmICghZGF0YSB8fCAhZGF0YS5sZW5ndGgpIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5OZW5odW0gYXByb3ZhZG8gYWluZGEuPC9kaXY+JzsgcmV0dXJuOyB9XG4gICAgZWwuaW5uZXJIVE1MID0gZGF0YS5tYXAocCA9PiB7XG4gICAgICBjb25zdCBkdCA9IHAuZGF0YV9hcHJvdmFjYW8gPyBuZXcgRGF0ZShwLmRhdGFfYXByb3ZhY2FvKS50b0xvY2FsZVN0cmluZygncHQtQlInKSA6ICdcdTIwMTQnO1xuICAgICAgY29uc3QgZ2lyb3UgPSBwLmphX2dpcm91ID8gJ1x1MjcxMyBHaXJvdSBcdTIwMTQgJyArIGVzY0hUTUwocC5wcmVtaW8gPz8gJycpIDogJ1x1MjNGMyBBZ3VhcmRhbmRvIGdpcmFyJztcbiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtaXRlbVwiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtaW5mb1wiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtbm9tZVwiPicgKyBlc2NIVE1MKHAubm9tZSA/PyAnJykgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS10ZWxcIj4nICsgZXNjSFRNTChwLnRlbGVmb25lKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTFweDtjb2xvcjojMzg4ZTNjXCI+JyArIGdpcm91ICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxMXB4O2NvbG9yOiM5OTlcIj5BcHJvdmFkbyBlbTogJyArIGR0ICsgJzwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+PC9kaXY+JztcbiAgICB9KS5qb2luKCcnKTtcbiAgfSBjYXRjaCB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+RXJybyBhbyBjYXJyZWdhci48L2Rpdj4nOyB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFwcm92YXJQYXJ0aWNpcGFudGUoaWQ6IG51bWJlciwgYnRuOiBIVE1MQnV0dG9uRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4udGV4dENvbnRlbnQgPSAnLi4uJztcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfcGFydGljaXBhY29lcz9pZD1lcS4nICsgaWQsIHtcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiwgJ1ByZWZlcic6ICdyZXR1cm49bWluaW1hbCdcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHN0YXR1czogJ2Fwcm92YWRvJyxcbiAgICAgICAgZGF0YV9hcHJvdmFjYW86IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgYXByb3ZhZG9fcG9yOiBjbGllbnRlQXR1YWwgPyBjbGllbnRlQXR1YWwubm9tZSA6ICdhZG1pbidcbiAgICAgIH0pXG4gICAgfSk7XG4gICAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ3N0YXR1cyAnICsgci5zdGF0dXMpO1xuICAgIGJ0bi5jbG9zZXN0KCcucm9sZXRhLXBhcnRpY2lwYW50ZS1pdGVtJyk/LnJlbW92ZSgpO1xuICB9IGNhdGNoIHtcbiAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ1x1MjcxMyBBcHJvdmFyJztcbiAgICBhbGVydCgnRXJybyBhbyBhcHJvdmFyLicpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlamVpdGFyUGFydGljaXBhbnRlKGlkOiBudW1iZXIsIGJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFjb25maXJtKCdSZWplaXRhciBlc3RhIHBhcnRpY2lwYVx1MDBFN1x1MDBFM28/JykpIHJldHVybjtcbiAgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnRleHRDb250ZW50ID0gJy4uLic7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfcGFydGljaXBhY29lcz9pZD1lcS4nICsgaWQsIHtcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiwgJ1ByZWZlcic6ICdyZXR1cm49bWluaW1hbCdcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN0YXR1czogJ3JlamVpdGFkbycgfSlcbiAgICB9KTtcbiAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcignc3RhdHVzICcgKyByLnN0YXR1cyk7XG4gICAgYnRuLmNsb3Nlc3QoJy5yb2xldGEtcGFydGljaXBhbnRlLWl0ZW0nKT8ucmVtb3ZlKCk7XG4gIH0gY2F0Y2gge1xuICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAnXHUyNzE3IFJlamVpdGFyJztcbiAgICBhbGVydCgnRXJybyBhbyByZWplaXRhci4nKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjYXJyZWdhclZlbmNlZG9yZXNSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpc3RhVmVuY2Vkb3JlcycpO1xuICBpZiAoIWVsKSByZXR1cm47XG4gIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+Q2FycmVnYW5kby4uLjwvZGl2Pic7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfdmVuY2Vkb3Jlcz9vcmRlcj1kYXRhX3ZpdG9yaWEuZGVzYycsIHtcbiAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PHsgbm9tZT86IHN0cmluZzsgcHJlbWlvOiBzdHJpbmc7IHRlbGVmb25lPzogc3RyaW5nOyBzZW1hbmE/OiBzdHJpbmc7IGRhdGFfdml0b3JpYTogc3RyaW5nIH0+O1xuICAgIGlmICghZGF0YSB8fCAhZGF0YS5sZW5ndGgpIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5OZW5odW0gdmVuY2Vkb3IgYWluZGEuPC9kaXY+JzsgcmV0dXJuOyB9XG4gICAgZWwuaW5uZXJIVE1MID0gZGF0YS5tYXAodiA9PiB7XG4gICAgICBjb25zdCBkdCA9IG5ldyBEYXRlKHYuZGF0YV92aXRvcmlhKS50b0xvY2FsZVN0cmluZygncHQtQlInKTtcbiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInJvbGV0YS12ZW5jZWRvci1pdGVtXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXZlbmNlZG9yLW5vbWVcIj5cdUQ4M0NcdURGQzYgJyArIGVzY0hUTUwodi5ub21lID8/ICdcdTIwMTQnKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtdmVuY2Vkb3ItcHJlbWlvXCI+XHVEODNDXHVERjgxICcgKyBlc2NIVE1MKHYucHJlbWlvKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtdmVuY2Vkb3ItZGF0YVwiPicgKyBlc2NIVE1MKHYudGVsZWZvbmUgPz8gJycpICsgJyBcdTAwQjcgU2VtYW5hICcgKyBlc2NIVE1MKHYuc2VtYW5hID8/ICcnKSArICcgXHUwMEI3ICcgKyBkdCArICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2Pic7XG4gICAgfSkuam9pbignJyk7XG4gIH0gY2F0Y2ggeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkVycm8gYW8gY2FycmVnYXIuPC9kaXY+JzsgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjYXJyZWdhckNvbmZpZ0FkbWluKCk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX2NvbmZpZz9pZD1lcS4xJmxpbWl0PTEnLCB7XG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByLmpzb24oKSBhcyBBcnJheTx7IGF0aXZhOiBib29sZWFuOyBwcmVtaW9zOiBzdHJpbmdbXSB9PjtcbiAgICBpZiAoZGF0YSAmJiBkYXRhWzBdKSB7XG4gICAgICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ0F0aXZhJykgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZCA9IGRhdGFbMF0hLmF0aXZhO1xuICAgICAgY29uc3QgcHJlbWlvcyA9IEFycmF5LmlzQXJyYXkoZGF0YVswXSEucHJlbWlvcykgPyBkYXRhWzBdIS5wcmVtaW9zIDogZ2V0UHJlbWlvc1BhZHJhbygpO1xuICAgICAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdQcmVtaW9zJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWUgPSBwcmVtaW9zLmpvaW4oJ1xcbicpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyBsb2cud2FybignRXJybyBhbyBjYXJyZWdhciBjb25maWcgYWRtaW4nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7IH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc2FsdmFyQ29uZmlnUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBhdGl2YSA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnQXRpdmEnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkO1xuICBjb25zdCBwcmVtaW9zVHh0ID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdQcmVtaW9zJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWU7XG4gIGNvbnN0IHByZW1pb3MgPSBwcmVtaW9zVHh0LnNwbGl0KCdcXG4nKS5tYXAocyA9PiBzLnRyaW0oKSkuZmlsdGVyKHMgPT4gcy5sZW5ndGggPiAwKTtcbiAgY29uc3QgbXNnRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnTXNnJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX2NvbmZpZz9pZD1lcS4xJywge1xuICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTixcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OLCAnUHJlZmVyJzogJ3JldHVybj1taW5pbWFsJ1xuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYXRpdmEsIHByZW1pb3MsIHVwZGF0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9KVxuICAgIH0pO1xuICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKCdzdGF0dXMgJyArIHIuc3RhdHVzKTtcbiAgICBzZXRQcmVtaW9zKHByZW1pb3MpO1xuICAgIGlmIChtc2dFbCkgeyBtc2dFbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgc2V0VGltZW91dCgoKSA9PiB7IG1zZ0VsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0sIDI1MDApOyB9XG4gIH0gY2F0Y2ggeyBhbGVydCgnRXJybyBhbyBzYWx2YXIgY29uZmlndXJhXHUwMEU3XHUwMEY1ZXMuJyk7IH1cbn1cblxuLy8gPT09PT0gSU5JVCA9PT09PVxuKGFzeW5jIGZ1bmN0aW9uIGluaXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgLy8gVGVudGEgcmVzdGF1cmFyIHNlc3NcdTAwRTNvIHZpYSBMb2dpblVzZUNhc2UgKHZlcmlmaWNhIFRUTCArIHN0b3JlKVxuICAgIGNvbnN0IGNsaWVudGVTZXNzYW8gPSBsb2dpblVzZUNhc2UucmVzdG9yZVNlc3Npb24oKTtcbiAgICBpZiAoY2xpZW50ZVNlc3Nhbykge1xuICAgICAgLy8gUmV2YWxpZGEgbm8gYmFuY29cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxvZ2luVXNlQ2FzZS5leGVjdXRlKGNsaWVudGVTZXNzYW8udGVsZWZvbmUpO1xuICAgICAgaWYgKHJlc3VsdC5vayAmJiByZXN1bHQudmFsdWUuZXhpc3RlICYmIHJlc3VsdC52YWx1ZS5jbGllbnRlKSB7XG4gICAgICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLmNsaWVudGUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZ2luVXNlQ2FzZS5sb2dvdXQoKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHsgbG9nLndhcm4oJ0Vycm8gYW8gdmVyaWZpY2FyIHNlc3NcdTAwRTNvJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pOyB9XG4gIG1vc3RyYXJMb2dpbigpO1xufSkoKTtcblxuLy8gUFdBIHNlcnZpY2Ugd29ya2VyXG5pZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xuICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3Rlcignc3cuanMnKS5jYXRjaCgoKSA9PiB7fSk7XG59XG5cbi8vIFNpbmNyb25pemFyIGNhcmRcdTAwRTFwaW8gY29tIFN1cGFiYXNlXG4oYXN5bmMgZnVuY3Rpb24gc2luY3Jvbml6YXJDYXJkYXBpbygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjdHJsID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBjdHJsLmFib3J0KCksIDEwXzAwMCk7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9wcm9kdXRvcz9zZWxlY3Q9bm9tZSxwcmVjbyxkaXNwb25pdmVsJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH0sXG4gICAgICBzaWduYWw6IGN0cmwuc2lnbmFsXG4gICAgfSk7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBpZiAoIXIub2spIHJldHVybjtcbiAgICBjb25zdCBwcm9kcyA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyOyBkaXNwb25pdmVsOiBib29sZWFuIH0+O1xuICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9kcykgfHwgIXByb2RzLmxlbmd0aCkgcmV0dXJuO1xuICAgIGNvbnN0IG1hcGE6IFJlY29yZDxzdHJpbmcsIHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyOyBkaXNwb25pdmVsOiBib29sZWFuIH0+ID0ge307XG4gICAgcHJvZHMuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwICYmIHR5cGVvZiBwLm5vbWUgPT09ICdzdHJpbmcnICYmIHAubm9tZS50cmltKCkpIG1hcGFbcC5ub21lLnRyaW0oKS50b0xvd2VyQ2FzZSgpXSA9IHA7XG4gICAgfSk7XG4gICAgY29uc3QgcHJpY2VNYXAgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idG4tcGVkaXInKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgICBjb25zdCBvbmNsaWNrQXR0ciA9IGJ0bi5nZXRBdHRyaWJ1dGUoJ29uY2xpY2snKSA/PyAnJztcbiAgICAgIGNvbnN0IG0gPSBvbmNsaWNrQXR0ci5tYXRjaCgvcGVkaXJQcm9kdXRvXFwodGhpcywnKC4rPyknLChcXGQrKD86XFwuXFxkKyk/KVxcKS8pO1xuICAgICAgaWYgKCFtKSByZXR1cm47XG4gICAgICBjb25zdCBub21lUHJvZCA9IG1bMV0hO1xuICAgICAgY29uc3QgY2hhdmUgPSBub21lUHJvZC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IGRiID0gbWFwYVtjaGF2ZV07XG4gICAgICBpZiAoIWRiKSByZXR1cm47XG4gICAgICBjb25zdCBjYXJkID0gYnRuLmNsb3Nlc3QoJy5wcm9kLWNhcmQnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICBpZiAoIWNhcmQpIHJldHVybjtcbiAgICAgIGlmIChkYi5kaXNwb25pdmVsID09PSBmYWxzZSkgeyBjYXJkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IHJldHVybjsgfVxuICAgICAgY29uc3Qgbm92b1ByZWNvID0gcGFyc2VGbG9hdChTdHJpbmcoZGIucHJlY28pKTtcbiAgICAgIGlmIChpc05hTihub3ZvUHJlY28pIHx8IG5vdm9QcmVjbyA8PSAwKSByZXR1cm47XG4gICAgICBidG4uc2V0QXR0cmlidXRlKCdvbmNsaWNrJywgXCJwZWRpclByb2R1dG8odGhpcywnXCIgKyBub21lUHJvZC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIikgKyBcIicsXCIgKyBub3ZvUHJlY28gKyBcIilcIik7XG4gICAgICBjb25zdCBwcmVjb0VsID0gY2FyZC5xdWVyeVNlbGVjdG9yKCcucHJvZC1wcmVjbycpO1xuICAgICAgaWYgKHByZWNvRWwpIHByZWNvRWwudGV4dENvbnRlbnQgPSAnUiQgJyArIG5vdm9QcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xuICAgICAgcHJpY2VNYXAuc2V0KG5vbWVQcm9kLCBub3ZvUHJlY28pO1xuICAgIH0pO1xuICAgIGNhcnRTZXJ2aWNlLnJldmFsaWRhdGVQcmljZXMocHJpY2VNYXApO1xuICB9IGNhdGNoIHsgLyogc2lsZW5jaW9zbyAqLyB9XG59KSgpO1xuXG4vLyBGZWNoYXIgbW9kYWlzIGNvbSBFc2NhcGVcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgZmVjaGFyRGlhbG9nKCk7XG4gICAgZmVjaGFyTW9kYWwoKTtcbiAgICBmZWNoYXJDb25maXJtV0EoKTtcbiAgICBjYW5jZWxhclBpeCgpO1xuICB9XG59KTtcblxuLy8gPT09PT0gRVhQT1IgUEFSQSBIVE1MIChvbmNsaWNrPVwiLi4uXCIpID09PT09XG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIGZpbHRyYXI6IHR5cGVvZiBmaWx0cmFyO1xuICAgIHBlZGlyUHJvZHV0bzogdHlwZW9mIHBlZGlyUHJvZHV0bztcbiAgICBhYnJpckRpYWxvZzogdHlwZW9mIGFicmlyRGlhbG9nO1xuICAgIGZlY2hhckRpYWxvZzogdHlwZW9mIGZlY2hhckRpYWxvZztcbiAgICBmZWNoYXJEaWFsb2dCYWNrZHJvcDogdHlwZW9mIGZlY2hhckRpYWxvZ0JhY2tkcm9wO1xuICAgIGlyUGFyYUZpbmFsaXphcjogdHlwZW9mIGlyUGFyYUZpbmFsaXphcjtcbiAgICBhYnJpck1vZGFsOiB0eXBlb2YgYWJyaXJNb2RhbDtcbiAgICBmZWNoYXJNb2RhbDogdHlwZW9mIGZlY2hhck1vZGFsO1xuICAgIGZlY2hhck1vZGFsQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJNb2RhbEJhY2tkcm9wO1xuICAgIHJlbW92ZXJEb0NhcnJpbmhvOiB0eXBlb2YgcmVtb3ZlckRvQ2FycmluaG87XG4gICAgc2VsZWNpb25hclBhZ2FtZW50bzogdHlwZW9mIHNlbGVjaW9uYXJQYWdhbWVudG87XG4gICAgZmluYWxpemFyUGVkaWRvOiB0eXBlb2YgZmluYWxpemFyUGVkaWRvO1xuICAgIGNvbmZpcm1hckVudmlvV0E6IHR5cGVvZiBjb25maXJtYXJFbnZpb1dBO1xuICAgIGZlY2hhckNvbmZpcm1XQTogdHlwZW9mIGZlY2hhckNvbmZpcm1XQTtcbiAgICBwZWRpckJvbG9Gb3JtYTogdHlwZW9mIHBlZGlyQm9sb0Zvcm1hO1xuICAgIGFicmlyRGlhbG9nQm9sbzogdHlwZW9mIGFicmlyRGlhbG9nQm9sbztcbiAgICBmZWNoYXJEaWFsb2dCb2xvOiB0eXBlb2YgZmVjaGFyRGlhbG9nQm9sbztcbiAgICBhZ2VuZGFyQm9sb1doYXRzQXBwOiB0eXBlb2YgYWdlbmRhckJvbG9XaGF0c0FwcDtcbiAgICBjYXJvdXNlbE5leHQ6IHR5cGVvZiBjYXJvdXNlbE5leHQ7XG4gICAgY2Fyb3VzZWxQcmV2OiB0eXBlb2YgY2Fyb3VzZWxQcmV2O1xuICAgIGNvcGlhclBpeDogdHlwZW9mIGNvcGlhclBpeDtcbiAgICBjYW5jZWxhclBpeDogdHlwZW9mIGNhbmNlbGFyUGl4O1xuICAgIHBpeEphUGFndWVpOiB0eXBlb2YgcGl4SmFQYWd1ZWk7XG4gICAgc2VsZWNpb25hclRpcG9DYXJ0YW86IHR5cGVvZiBzZWxlY2lvbmFyVGlwb0NhcnRhbztcbiAgICBmb3JtYXRhckNhcnRhbzogdHlwZW9mIGZvcm1hdGFyQ2FydGFvO1xuICAgIGZvcm1hdGFyQ3BmOiB0eXBlb2YgZm9ybWF0YXJDcGY7XG4gICAgZm9ybWF0YXJWYWxpZGFkZTogdHlwZW9mIGZvcm1hdGFyVmFsaWRhZGU7XG4gICAgZm9ybWF0YXJDZXA6IHR5cGVvZiBmb3JtYXRhckNlcDtcbiAgICBwYWdhckNhcnRhbzogdHlwZW9mIHBhZ2FyQ2FydGFvO1xuICAgIGZlY2hhclJlY2lib1BpeDogdHlwZW9mIGZlY2hhclJlY2lib1BpeDtcbiAgICBtYXNjYXJhVGVsZWZvbmU6IHR5cGVvZiBtYXNjYXJhVGVsZWZvbmU7XG4gICAgdmVyaWZpY2FyVGVsZWZvbmU6IHR5cGVvZiB2ZXJpZmljYXJUZWxlZm9uZTtcbiAgICBjYWRhc3RyYXI6IHR5cGVvZiBjYWRhc3RyYXI7XG4gICAgdm9sdGFyRXRhcGFUZWxlZm9uZTogdHlwZW9mIHZvbHRhckV0YXBhVGVsZWZvbmU7XG4gICAgc2FpcjogdHlwZW9mIHNhaXI7XG4gICAgYWJyaXJSb2xldGE6IHR5cGVvZiBhYnJpclJvbGV0YTtcbiAgICBmZWNoYXJSb2xldGE6IHR5cGVvZiBmZWNoYXJSb2xldGE7XG4gICAgZmVjaGFyUm9sZXRhQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJSb2xldGFCYWNrZHJvcDtcbiAgICBnaXJhclJvbGV0YTogdHlwZW9mIGdpcmFyUm9sZXRhO1xuICAgIGVudmlhclByb3Zhc1doYXRzQXBwOiB0eXBlb2YgZW52aWFyUHJvdmFzV2hhdHNBcHA7XG4gICAgYWJyaXJSb2xldGFBZG1pbjogdHlwZW9mIGFicmlyUm9sZXRhQWRtaW47XG4gICAgZmVjaGFyUm9sZXRhQWRtaW46IHR5cGVvZiBmZWNoYXJSb2xldGFBZG1pbjtcbiAgICBmZWNoYXJSb2xldGFBZG1pbkJhY2tkcm9wOiB0eXBlb2YgZmVjaGFyUm9sZXRhQWRtaW5CYWNrZHJvcDtcbiAgICBhYnJpclRhYkFkbWluOiB0eXBlb2YgYWJyaXJUYWJBZG1pbjtcbiAgICBhcHJvdmFyUGFydGljaXBhbnRlOiB0eXBlb2YgYXByb3ZhclBhcnRpY2lwYW50ZTtcbiAgICByZWplaXRhclBhcnRpY2lwYW50ZTogdHlwZW9mIHJlamVpdGFyUGFydGljaXBhbnRlO1xuICAgIHNhbHZhckNvbmZpZ1JvbGV0YTogdHlwZW9mIHNhbHZhckNvbmZpZ1JvbGV0YTtcbiAgfVxufVxuXG5PYmplY3QuYXNzaWduKHdpbmRvdywge1xuICBmaWx0cmFyLFxuICBwZWRpclByb2R1dG8sXG4gIGFicmlyRGlhbG9nLFxuICBmZWNoYXJEaWFsb2csXG4gIGZlY2hhckRpYWxvZ0JhY2tkcm9wLFxuICBpclBhcmFGaW5hbGl6YXIsXG4gIGFicmlyTW9kYWwsXG4gIGZlY2hhck1vZGFsLFxuICBmZWNoYXJNb2RhbEJhY2tkcm9wLFxuICByZW1vdmVyRG9DYXJyaW5obyxcbiAgc2VsZWNpb25hclBhZ2FtZW50byxcbiAgZmluYWxpemFyUGVkaWRvLFxuICBjb25maXJtYXJFbnZpb1dBLFxuICBmZWNoYXJDb25maXJtV0EsXG4gIHBlZGlyQm9sb0Zvcm1hLFxuICBhYnJpckRpYWxvZ0JvbG8sXG4gIGZlY2hhckRpYWxvZ0JvbG8sXG4gIGFnZW5kYXJCb2xvV2hhdHNBcHAsXG4gIGNhcm91c2VsTmV4dCxcbiAgY2Fyb3VzZWxQcmV2LFxuICBjb3BpYXJQaXgsXG4gIGNhbmNlbGFyUGl4LFxuICBwaXhKYVBhZ3VlaSxcbiAgc2VsZWNpb25hclRpcG9DYXJ0YW8sXG4gIGZvcm1hdGFyQ2FydGFvLFxuICBmb3JtYXRhckNwZixcbiAgZm9ybWF0YXJWYWxpZGFkZSxcbiAgZm9ybWF0YXJDZXAsXG4gIHBhZ2FyQ2FydGFvLFxuICBmZWNoYXJSZWNpYm9QaXgsXG4gIG1hc2NhcmFUZWxlZm9uZSxcbiAgdmVyaWZpY2FyVGVsZWZvbmUsXG4gIGNhZGFzdHJhcixcbiAgdm9sdGFyRXRhcGFUZWxlZm9uZSxcbiAgc2FpcixcbiAgYWJyaXJSb2xldGEsXG4gIGZlY2hhclJvbGV0YSxcbiAgZmVjaGFyUm9sZXRhQmFja2Ryb3AsXG4gIGdpcmFyUm9sZXRhLFxuICBlbnZpYXJQcm92YXNXaGF0c0FwcCxcbiAgYWJyaXJSb2xldGFBZG1pbixcbiAgZmVjaGFyUm9sZXRhQWRtaW4sXG4gIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3AsXG4gIGFicmlyVGFiQWRtaW4sXG4gIGFwcm92YXJQYXJ0aWNpcGFudGUsXG4gIHJlamVpdGFyUGFydGljaXBhbnRlLFxuICBzYWx2YXJDb25maWdSb2xldGEsXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRU8sV0FBUyxhQUFhLEtBQWEsT0FBa0IsUUFBYztBQUN4RSxVQUFNLE1BQU0sU0FBUyxlQUFlLFFBQVE7QUFDNUMsUUFBSSxJQUFLLEtBQUksT0FBTztBQUNwQixVQUFNLElBQUksU0FBUyxjQUFjLEtBQUs7QUFDdEMsTUFBRSxLQUFLO0FBQ1AsTUFBRSxjQUFjO0FBQ2hCLFVBQU0sS0FBSyxTQUFTLFNBQVMsWUFBWSxTQUFTLE9BQU8sWUFBWTtBQUNyRSxXQUFPLE9BQU8sRUFBRSxPQUFPO0FBQUEsTUFDckIsVUFBVTtBQUFBLE1BQVMsUUFBUTtBQUFBLE1BQVEsTUFBTTtBQUFBLE1BQ3pDLFdBQVc7QUFBQSxNQUNYLFlBQVk7QUFBQSxNQUFJLE9BQU87QUFBQSxNQUFRLFNBQVM7QUFBQSxNQUN4QyxjQUFjO0FBQUEsTUFBUSxVQUFVO0FBQUEsTUFBUSxZQUFZO0FBQUEsTUFDcEQsUUFBUTtBQUFBLE1BQVMsV0FBVztBQUFBLE1BQzVCLFVBQVU7QUFBQSxNQUFRLFdBQVc7QUFBQSxNQUM3QixZ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
