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
  function normalizarTelefone(tel) {
    return tel.replace(/\D/g, "");
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

  // src/services/supabase.ts
  var SUPABASE_URL2 = atob("aHR0cHM6Ly9yZmJ0ZHR2c25mdHliYXpmbWRidy5zdXBhYmFzZS5jbw==");
  var SUPABASE_ANON2 = atob("ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5KbVluUmtkSFZ6Ym1aMGVXSmhlbVp0WkdKM0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT0RFNU1UQXpOakFzSW1WNGNDSTZNakE1TnpRNE5qTTJNSDAuSHc2OGpRRkZtd0xndndGOXpqaGdWV1BjM0QxUTJwZmdBbjFUUWxKRVZ1NA==");
  var DB_TIMEOUT = 1e4;
  async function dbFetch(url, opts = {}) {
    var _b;
    const _a = opts, { timeout = DB_TIMEOUT } = _a, fetchOpts = __objRest(_a, ["timeout"]);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const headers = __spreadValues({
        "apikey": SUPABASE_ANON2,
        "Authorization": `Bearer ${SUPABASE_ANON2}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      }, (_b = fetchOpts.headers) != null ? _b : {});
      const resp = await fetch(url, __spreadProps(__spreadValues({}, fetchOpts), { headers, signal: controller.signal }));
      return resp;
    } finally {
      clearTimeout(timer);
    }
  }
  async function dbGet(tabela, filtro = "") {
    const resp = await dbFetch(`${SUPABASE_URL2}/rest/v1/${tabela}${filtro ? "?" + filtro : ""}`);
    if (!resp.ok) throw new Error(`DB GET ${tabela}: ${resp.status}`);
    return resp.json();
  }
  async function dbPost(tabela, dados) {
    const resp = await dbFetch(`${SUPABASE_URL2}/rest/v1/${tabela}`, {
      method: "POST",
      body: JSON.stringify(dados)
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`DB POST ${tabela}: ${err}`);
    }
    const rows = await resp.json();
    return rows[0];
  }
  async function dbPatch(tabela, filtro, dados) {
    const resp = await dbFetch(`${SUPABASE_URL2}/rest/v1/${tabela}?${filtro}`, {
      method: "PATCH",
      body: JSON.stringify(dados)
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`DB PATCH ${tabela}: ${err}`);
    }
    return resp.json();
  }

  // src/services/auth.ts
  var SESSION_TTL = 24 * 60 * 60 * 1e3;
  var CONTA_TESTE2 = atob("MTE5NjUwMzAwNzY=");
  var ADMIN_TEL2 = atob("MTE5NDA3NzI3NTA=");
  function isContaTeste2(cliente) {
    return !!cliente && normalizarTelefone(cliente.telefone) === CONTA_TESTE2;
  }

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
      const rows = await dbGet("roleta_config", "id=eq.1&limit=1");
      if (rows[0]) {
        _premios = Array.isArray(rows[0].premios) ? rows[0].premios : PREMIOS_PADRAO;
      }
      return (_a = rows[0]) != null ? _a : null;
    } catch (e) {
      return null;
    }
  }
  async function verificarStatus(clienteId) {
    var _a;
    try {
      const rows = await dbGet(
        "roleta_participacoes",
        `cliente_id=eq.${clienteId}&order=created_at.desc&limit=1`
      );
      if (rows[0]) {
        _participacaoId = rows[0].id;
      }
      return (_a = rows[0]) != null ? _a : null;
    } catch (e) {
      return null;
    }
  }
  async function girar(cliente, onResultado) {
    if (_girando) return;
    if (!isContaTeste2(cliente)) {
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
    if (isContaTeste2(cliente) && btn) {
      btn.disabled = false;
      btn.textContent = "\u{1F3A1} GIRAR AGORA!";
    }
  }
  async function salvarVencedor(cliente, premio) {
    if (isContaTeste2(cliente)) return;
    if (!_participacaoId) return;
    try {
      const semana = getSemanaAtual();
      await dbPatch("roleta_participacoes", `id=eq.${_participacaoId}`, {
        ja_girou: true,
        premio
      });
      await dbPost("roleta_vencedores", {
        participacao_id: _participacaoId,
        cliente_id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        premio,
        semana
      });
    } catch (e) {
      console.error("Erro ao salvar vencedor:", e);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3V0aWxzL3RvYXN0LnRzIiwgIi4uL3NyYy91dGlscy9zZWN1cml0eS50cyIsICIuLi9zcmMvdXRpbHMvZm9ybWF0LnRzIiwgIi4uL3NyYy9jb3JlL2Vycm9ycy50cyIsICIuLi9zcmMvZG9tYWluL2NsaWVudGUudHMiLCAiLi4vc3JjL2NvcmUvcmVzdWx0LnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQudHMiLCAiLi4vc3JjL2NvcmUvbG9nZ2VyLnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9DbGllbnRlUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvZG9tYWluL3BlZGlkby50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUGVkaWRvUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUm9sZXRhUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvY29yZS9ldmVudHMudHMiLCAiLi4vc3JjL3N0YXRlL1N0b3JlLnRzIiwgIi4uL3NyYy9zdGF0ZS9BcHBTdG9yZS50cyIsICIuLi9zcmMvYXBwbGljYXRpb24vYXV0aC9Mb2dpblVzZUNhc2UudHMiLCAiLi4vc3JjL2FwcGxpY2F0aW9uL2NhcnQvQ2FydFNlcnZpY2UudHMiLCAiLi4vc3JjL2NvbnRhaW5lci50cyIsICIuLi9zcmMvc2VydmljZXMvc3VwYWJhc2UudHMiLCAiLi4vc3JjL3NlcnZpY2VzL2F1dGgudHMiLCAiLi4vc3JjL21vZHVsZXMvcm9sZXRhLnRzIiwgIi4uL3NyYy9tb2R1bGVzL2NhcnQudHMiLCAiLi4vc3JjL21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgVG9hc3RUaXBvIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgZnVuY3Rpb24gbW9zdHJhclRvYXN0KG1zZzogc3RyaW5nLCB0aXBvOiBUb2FzdFRpcG8gPSAnaW5mbycpOiB2b2lkIHtcbiAgY29uc3Qgb2xkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ190b2FzdCcpO1xuICBpZiAob2xkKSBvbGQucmVtb3ZlKCk7XG4gIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdC5pZCA9ICdfdG9hc3QnO1xuICB0LnRleHRDb250ZW50ID0gbXNnO1xuICBjb25zdCBiZyA9IHRpcG8gPT09ICdlcnJvJyA/ICcjZWY0NDQ0JyA6IHRpcG8gPT09ICdvaycgPyAnIzIyYzU1ZScgOiAnIzRBMkMxNyc7XG4gIE9iamVjdC5hc3NpZ24odC5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiAnZml4ZWQnLCBib3R0b206ICc5MHB4JywgbGVmdDogJzUwJScsXG4gICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCgtNTAlKScsXG4gICAgYmFja2dyb3VuZDogYmcsIGNvbG9yOiAnI2ZmZicsIHBhZGRpbmc6ICcxMnB4IDIycHgnLFxuICAgIGJvcmRlclJhZGl1czogJzMwcHgnLCBmb250U2l6ZTogJzE0cHgnLCBmb250V2VpZ2h0OiAnNjAwJyxcbiAgICB6SW5kZXg6ICc5OTk5OScsIGJveFNoYWRvdzogJzAgNnB4IDI0cHggcmdiYSgwLDAsMCwwLjMpJyxcbiAgICBtYXhXaWR0aDogJzkwdncnLCB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgIHRyYW5zaXRpb246ICdvcGFjaXR5IC4zcycsIG9wYWNpdHk6ICcxJyxcbiAgICBmb250RmFtaWx5OiBcIidETSBTYW5zJywgc2Fucy1zZXJpZlwiLFxuICB9IGFzIFBhcnRpYWw8Q1NTU3R5bGVEZWNsYXJhdGlvbj4pO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHQpO1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0LnN0eWxlLm9wYWNpdHkgPSAnMCc7XG4gICAgc2V0VGltZW91dCgoKSA9PiB0LnJlbW92ZSgpLCAzNTApO1xuICB9LCAzNTAwKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gZXNjSFRNTChzOiB1bmtub3duKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyhzKVxuICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzk7Jyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemFyVGVsZWZvbmUodGVsOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGVsLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemFyTm9tZShub21lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbm9tZVxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnNwbGl0KCcgJylcbiAgICAubWFwKHAgPT4gcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHAuc2xpY2UoMSkpXG4gICAgLmpvaW4oJyAnKVxuICAgIC50cmltKCk7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdGFyTW9lZGEodmFsb3I6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiAnUiQgJyArIHZhbG9yLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZW1hbmFBdHVhbCgpOiBzdHJpbmcge1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBzdGFydE9mWWVhciA9IG5ldyBEYXRlKG5vdy5nZXRGdWxsWWVhcigpLCAwLCAxKTtcbiAgY29uc3QgZGF5T2ZZZWFyID0gTWF0aC5mbG9vcigobm93LmdldFRpbWUoKSAtIHN0YXJ0T2ZZZWFyLmdldFRpbWUoKSkgLyA4NjQwMDAwMCk7XG4gIGNvbnN0IHdlZWtOdW0gPSBNYXRoLmNlaWwoKGRheU9mWWVhciArIHN0YXJ0T2ZZZWFyLmdldERheSgpICsgMSkgLyA3KTtcbiAgcmV0dXJuIGAke25vdy5nZXRGdWxsWWVhcigpfS1XJHtTdHJpbmcod2Vla051bSkucGFkU3RhcnQoMiwgJzAnKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBsaWNhck1hc2NhcmFUZWxlZm9uZSh2YWxvcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZCA9IHZhbG9yLnJlcGxhY2UoL1xcRC9nLCAnJykuc2xpY2UoMCwgMTEpO1xuICBpZiAoZC5sZW5ndGggPD0gMikgcmV0dXJuIGQ7XG4gIGlmIChkLmxlbmd0aCA8PSA3KSByZXR1cm4gYCgke2Quc2xpY2UoMCwgMil9KSAke2Quc2xpY2UoMil9YDtcbiAgaWYgKGQubGVuZ3RoIDw9IDExKSByZXR1cm4gYCgke2Quc2xpY2UoMCwgMil9KSAke2Quc2xpY2UoMiwgNyl9LSR7ZC5zbGljZSg3KX1gO1xuICByZXR1cm4gYCgke2Quc2xpY2UoMCwgMil9KSAke2Quc2xpY2UoMiwgNyl9LSR7ZC5zbGljZSg3LCAxMSl9YDtcbn1cbiIsICJleHBvcnQgY2xhc3MgQXBwRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29kZTogc3RyaW5nLFxuICAgIHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlOiBudW1iZXIgPSA1MDAsXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICApIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnQXBwRXJyb3InO1xuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBBcHBFcnJvci5wcm90b3R5cGUpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgc3VwZXIobWVzc2FnZSwgJ1ZBTElEQVRJT05fRVJST1InLCA0MDAsIGNvbnRleHQpO1xuICAgIHRoaXMubmFtZSA9ICdWYWxpZGF0aW9uRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOZXR3b3JrRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgc3VwZXIobWVzc2FnZSwgJ05FVFdPUktfRVJST1InLCA1MDMsIGNvbnRleHQpO1xuICAgIHRoaXMubmFtZSA9ICdOZXR3b3JrRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBdXRoRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UsICdBVVRIX0VSUk9SJywgNDAxKTtcbiAgICB0aGlzLm5hbWUgPSAnQXV0aEVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTm90Rm91bmRFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IocmVzb3VyY2U6IHN0cmluZykge1xuICAgIHN1cGVyKGAke3Jlc291cmNlfSBuXHUwMEUzbyBlbmNvbnRyYWRvYCwgJ05PVF9GT1VORCcsIDQwNCk7XG4gICAgdGhpcy5uYW1lID0gJ05vdEZvdW5kRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSYXRlTGltaXRFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IocmV0cnlBZnRlck1zOiBudW1iZXIpIHtcbiAgICBzdXBlcihgTXVpdGFzIHRlbnRhdGl2YXMuIEFndWFyZGUgJHtNYXRoLmNlaWwocmV0cnlBZnRlck1zIC8gMTAwMCl9cy5gLCAnUkFURV9MSU1JVCcsIDQyOSwgeyByZXRyeUFmdGVyTXMgfSk7XG4gICAgdGhpcy5uYW1lID0gJ1JhdGVMaW1pdEVycm9yJztcbiAgfVxufVxuIiwgImltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uL2NvcmUvZXJyb3JzJztcblxuZXhwb3J0IGludGVyZmFjZSBDbGllbnRlUHJvcHMge1xuICBpZD86IG51bWJlcjtcbiAgbm9tZTogc3RyaW5nO1xuICB0ZWxlZm9uZTogc3RyaW5nO1xuICBlbmRlcmVjbz86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIENsaWVudGUge1xuICByZWFkb25seSBpZD86IG51bWJlcjtcbiAgcmVhZG9ubHkgbm9tZTogc3RyaW5nO1xuICByZWFkb25seSB0ZWxlZm9uZTogc3RyaW5nO1xuICByZWFkb25seSBlbmRlcmVjbz86IHN0cmluZztcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKHByb3BzOiBDbGllbnRlUHJvcHMpIHtcbiAgICB0aGlzLmlkID0gcHJvcHMuaWQ7XG4gICAgdGhpcy5ub21lID0gcHJvcHMubm9tZTtcbiAgICB0aGlzLnRlbGVmb25lID0gcHJvcHMudGVsZWZvbmU7XG4gICAgdGhpcy5lbmRlcmVjbyA9IHByb3BzLmVuZGVyZWNvO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZShwcm9wczogQ2xpZW50ZVByb3BzKTogQ2xpZW50ZSB7XG4gICAgY29uc3QgdGVsID0gcHJvcHMudGVsZWZvbmUucmVwbGFjZSgvXFxEL2csICcnKTtcbiAgICBpZiAodGVsLmxlbmd0aCA8IDEwIHx8IHRlbC5sZW5ndGggPiAxMSkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignVGVsZWZvbmUgaW52XHUwMEUxbGlkbycsIHsgdGVsZWZvbmU6IHByb3BzLnRlbGVmb25lIH0pO1xuICAgIH1cbiAgICBpZiAoIXByb3BzLm5vbWUudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdOb21lIG5cdTAwRTNvIHBvZGUgc2VyIHZhemlvJyk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ2xpZW50ZSh7XG4gICAgICAuLi5wcm9wcyxcbiAgICAgIHRlbGVmb25lOiB0ZWwsXG4gICAgICBub21lOiBDbGllbnRlLm5vcm1hbGl6YXJOb21lKHByb3BzLm5vbWUpLFxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGZyb21EQihyYXc6IENsaWVudGVQcm9wcyk6IENsaWVudGUge1xuICAgIHJldHVybiBuZXcgQ2xpZW50ZShyYXcpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgbm9ybWFsaXphck5vbWUobm9tZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbm9tZS50b0xvd2VyQ2FzZSgpLnNwbGl0KCcgJylcbiAgICAgIC5tYXAocCA9PiBwLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcC5zbGljZSgxKSlcbiAgICAgIC5qb2luKCcgJykudHJpbSgpO1xuICB9XG5cbiAgd2l0aEVuZGVyZWNvKGVuZGVyZWNvOiBzdHJpbmcpOiBDbGllbnRlIHtcbiAgICByZXR1cm4gQ2xpZW50ZS5mcm9tREIoeyAuLi50aGlzLnRvSlNPTigpLCBlbmRlcmVjbyB9KTtcbiAgfVxuXG4gIHRvSlNPTigpOiBDbGllbnRlUHJvcHMge1xuICAgIHJldHVybiB7IGlkOiB0aGlzLmlkLCBub21lOiB0aGlzLm5vbWUsIHRlbGVmb25lOiB0aGlzLnRlbGVmb25lLCBlbmRlcmVjbzogdGhpcy5lbmRlcmVjbyB9O1xuICB9XG59XG4iLCAiZXhwb3J0IHR5cGUgUmVzdWx0PFQsIEUgZXh0ZW5kcyBFcnJvciA9IEVycm9yPiA9XG4gIHwgeyByZWFkb25seSBvazogdHJ1ZTsgcmVhZG9ubHkgdmFsdWU6IFQgfVxuICB8IHsgcmVhZG9ubHkgb2s6IGZhbHNlOyByZWFkb25seSBlcnJvcjogRSB9O1xuXG5leHBvcnQgY29uc3Qgb2sgPSA8VD4odmFsdWU6IFQpOiBSZXN1bHQ8VCwgbmV2ZXI+ID0+ICh7IG9rOiB0cnVlLCB2YWx1ZSB9KTtcbmV4cG9ydCBjb25zdCBmYWlsID0gPEUgZXh0ZW5kcyBFcnJvcj4oZXJyb3I6IEUpOiBSZXN1bHQ8bmV2ZXIsIEU+ID0+ICh7IG9rOiBmYWxzZSwgZXJyb3IgfSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc09rPFQsIEUgZXh0ZW5kcyBFcnJvcj4ocjogUmVzdWx0PFQsIEU+KTogciBpcyB7IG9rOiB0cnVlOyB2YWx1ZTogVCB9IHtcbiAgcmV0dXJuIHIub2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXA8VD4ocjogUmVzdWx0PFQ+LCBmYWxsYmFjaz86IFQpOiBUIHtcbiAgaWYgKHIub2spIHJldHVybiByLnZhbHVlO1xuICBpZiAoZmFsbGJhY2sgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbGxiYWNrO1xuICB0aHJvdyByLmVycm9yO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdHJ5QXN5bmM8VD4oZm46ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFJlc3VsdDxUPj4ge1xuICB0cnkge1xuICAgIHJldHVybiBvayhhd2FpdCBmbigpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWlsKGUgaW5zdGFuY2VvZiBFcnJvciA/IGUgOiBuZXcgRXJyb3IoU3RyaW5nKGUpKSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBOZXR3b3JrRXJyb3IgfSBmcm9tICcuLi8uLi9jb3JlL2Vycm9ycyc7XG5cbmNvbnN0IFNVUEFCQVNFX1VSTCA9IGF0b2IoJ2FIUjBjSE02THk5eVptSjBaSFIyYzI1bWRIbGlZWHBtYldSaWR5NXpkWEJoWW1GelpTNWpidz09Jyk7XG5jb25zdCBTVVBBQkFTRV9BTk9OID0gYXRvYignWlhsS2FHSkhZMmxQYVVwSlZYcEpNVTVwU1hOSmJsSTFZME5KTmtscmNGaFdRMG81TG1WNVNuQmpNMDFwVDJsS2VtUllRbWhaYlVaNldsTkpjMGx1U214YWFVazJTVzVLYlZsdVVtdGtTRlo2WW0xYU1HVlhTbWhsYlZwMFdrZEtNMGxwZDJsamJUbHpXbE5KTmtsdFJuVmlNalJwVEVOS2NGbFlVV2xQYWtVelQwUkZOVTFVUVhwT2FrRnpTVzFXTkdORFNUWk5ha0UxVG5wUk5FNXFUVEpOU0RBdVNIYzJPR3BSUmtadGQweG5kbmRHT1hwcWFHZFdWMUJqTTBReFVUSndabWRCYmpGVVVXeEtSVloxTkE9PScpO1xuY29uc3QgVElNRU9VVF9NUyA9IDEwXzAwMDtcblxuZXhwb3J0IGludGVyZmFjZSBTdXBhYmFzZUZldGNoT3B0aW9ucyBleHRlbmRzIFJlcXVlc3RJbml0IHtcbiAgdGltZW91dD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN1cGFiYXNlRmV0Y2goXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0czogU3VwYWJhc2VGZXRjaE9wdGlvbnMgPSB7fVxuKTogUHJvbWlzZTxSZXNwb25zZT4ge1xuICBjb25zdCB7IHRpbWVvdXQgPSBUSU1FT1VUX01TLCAuLi5mZXRjaE9wdHMgfSA9IG9wdHM7XG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIHRpbWVvdXQpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxuICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7U1VQQUJBU0VfQU5PTn1gLFxuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICdQcmVmZXInOiAncmV0dXJuPXJlcHJlc2VudGF0aW9uJyxcbiAgICAgIC4uLigoZmV0Y2hPcHRzLmhlYWRlcnMgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPikgPz8ge30pLFxuICAgIH07XG5cbiAgICByZXR1cm4gYXdhaXQgZmV0Y2goYCR7U1VQQUJBU0VfVVJMfSR7cGF0aH1gLCB7XG4gICAgICAuLi5mZXRjaE9wdHMsXG4gICAgICBoZWFkZXJzLFxuICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgRXJyb3IgJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHtcbiAgICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoJ1RpbWVvdXQ6IHNlcnZpZG9yIG5cdTAwRTNvIHJlc3BvbmRldScsIHsgcGF0aCB9KTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcignRXJybyBkZSByZWRlJywgeyBwYXRoLCBjYXVzZTogU3RyaW5nKGUpIH0pO1xuICB9IGZpbmFsbHkge1xuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN1cGFiYXNlR2V0PFQ+KFxuICB0YWJsZTogc3RyaW5nLFxuICBxdWVyeSA9ICcnXG4pOiBQcm9taXNlPFRbXT4ge1xuICBjb25zdCByZXNwID0gYXdhaXQgc3VwYWJhc2VGZXRjaChgL3Jlc3QvdjEvJHt0YWJsZX0ke3F1ZXJ5ID8gJz8nICsgcXVlcnkgOiAnJ31gKTtcbiAgaWYgKCFyZXNwLm9rKSB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKGBHRVQgJHt0YWJsZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzIH0pO1xuICByZXR1cm4gcmVzcC5qc29uKCkgYXMgUHJvbWlzZTxUW10+O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VQb3N0PFQ+KFxuICB0YWJsZTogc3RyaW5nLFxuICBkYXRhOiBQYXJ0aWFsPFQ+XG4pOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IHN1cGFiYXNlRmV0Y2goYC9yZXN0L3YxLyR7dGFibGV9YCwge1xuICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICB9KTtcbiAgaWYgKCFyZXNwLm9rKSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3AudGV4dCgpO1xuICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYFBPU1QgJHt0YWJsZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xuICB9XG4gIGNvbnN0IHJvd3MgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBUW107XG4gIHJldHVybiByb3dzWzBdITtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN1cGFiYXNlUGF0Y2g8VD4oXG4gIHRhYmxlOiBzdHJpbmcsXG4gIHF1ZXJ5OiBzdHJpbmcsXG4gIGRhdGE6IFBhcnRpYWw8VD5cbik6IFByb21pc2U8VFtdPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvcmVzdC92MS8ke3RhYmxlfT8ke3F1ZXJ5fWAsIHtcbiAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gIH0pO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgUEFUQ0ggJHt0YWJsZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xuICB9XG4gIHJldHVybiByZXNwLmpzb24oKSBhcyBQcm9taXNlPFRbXT47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsRnVuY3Rpb248VD4obmFtZTogc3RyaW5nLCBib2R5OiB1bmtub3duKTogUHJvbWlzZTxUPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvZnVuY3Rpb25zL3YxLyR7bmFtZX1gLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gIH0pO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBlcnIgPSBhd2FpdCByZXNwLnRleHQoKTtcbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKGBFZGdlIEZ1bmN0aW9uICR7bmFtZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5OiBlcnIgfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3AuanNvbigpIGFzIFByb21pc2U8VD47XG59XG5cbmV4cG9ydCB7IFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfQU5PTiB9O1xuIiwgInR5cGUgTG9nTGV2ZWwgPSAnZGVidWcnIHwgJ2luZm8nIHwgJ3dhcm4nIHwgJ2Vycm9yJztcblxuaW50ZXJmYWNlIExvZ0VudHJ5IHtcbiAgbGV2ZWw6IExvZ0xldmVsO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xuICBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59XG5cbmNsYXNzIExvZ2dlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcHJlZml4OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHJlZml4ID0gJ0dlbGFtb3VyJykge1xuICAgIHRoaXMucHJlZml4ID0gcHJlZml4O1xuICB9XG5cbiAgcHJpdmF0ZSBsb2cobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xuICAgIGNvbnN0IGVudHJ5OiBMb2dFbnRyeSA9IHtcbiAgICAgIGxldmVsLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgY29udGV4dCxcbiAgICB9O1xuXG4gICAgY29uc3Qgc3R5bGUgPSB7XG4gICAgICBkZWJ1ZzogJ2NvbG9yOiAjNkI3MjgwJyxcbiAgICAgIGluZm86ICAnY29sb3I6ICMzQjgyRjYnLFxuICAgICAgd2FybjogICdjb2xvcjogI0Y1OUUwQicsXG4gICAgICBlcnJvcjogJ2NvbG9yOiAjRUY0NDQ0OyBmb250LXdlaWdodDogYm9sZCcsXG4gICAgfVtsZXZlbF07XG5cbiAgICBjb25zdCBmb3JtYXR0ZWQgPSBgWyR7dGhpcy5wcmVmaXh9XSAke2VudHJ5LnRpbWVzdGFtcH0gJHttZXNzYWdlfWA7XG5cbiAgICBpZiAobGV2ZWwgPT09ICdlcnJvcicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH0gZWxzZSBpZiAobGV2ZWwgPT09ICd3YXJuJykge1xuICAgICAgY29uc29sZS53YXJuKGAlYyR7Zm9ybWF0dGVkfWAsIHN0eWxlLCBjb250ZXh0ID8/ICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH1cbiAgfVxuXG4gIGRlYnVnKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgeyB0aGlzLmxvZygnZGVidWcnLCBtc2csIGN0eCk7IH1cbiAgaW5mbyhtc2c6IHN0cmluZywgY3R4PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkICB7IHRoaXMubG9nKCdpbmZvJywgIG1zZywgY3R4KTsgfVxuICB3YXJuKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgIHsgdGhpcy5sb2coJ3dhcm4nLCAgbXNnLCBjdHgpOyB9XG4gIGVycm9yKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgeyB0aGlzLmxvZygnZXJyb3InLCBtc2csIGN0eCk7IH1cblxuICBjaGlsZChwcmVmaXg6IHN0cmluZyk6IExvZ2dlciB7IHJldHVybiBuZXcgTG9nZ2VyKGAke3RoaXMucHJlZml4fToke3ByZWZpeH1gKTsgfVxufVxuXG5leHBvcnQgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuIiwgImltcG9ydCB0eXBlIHsgSUNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lDbGllbnRlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBDbGllbnRlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2NsaWVudGUnO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VHZXQsIHN1cGFiYXNlUG9zdCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdDbGllbnRlUmVwbycpO1xuXG5leHBvcnQgY2xhc3MgQ2xpZW50ZVJlcG9zaXRvcnkgaW1wbGVtZW50cyBJQ2xpZW50ZVJlcG9zaXRvcnkge1xuICBhc3luYyBmaW5kQnlUZWxlZm9uZSh0ZWxlZm9uZTogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZSB8IG51bGw+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZygnZmluZEJ5VGVsZWZvbmUnLCB7IHRlbGVmb25lOiBgKioqJHt0ZWxlZm9uZS5zbGljZSgtNCl9YCB9KTtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDxSZXR1cm5UeXBlPENsaWVudGVbJ3RvSlNPTiddPj4oXG4gICAgICAgICdjbGllbnRlcycsXG4gICAgICAgIGB0ZWxlZm9uZT1lcS4ke3RlbGVmb25lfSZsaW1pdD0xYFxuICAgICAgKTtcbiAgICAgIHJldHVybiByb3dzWzBdID8gQ2xpZW50ZS5mcm9tREIocm93c1swXSkgOiBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2F2ZShjbGllbnRlOiBDbGllbnRlKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZT4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gYXdhaXQgc3VwYWJhc2VQb3N0PFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+PihcbiAgICAgICAgJ2NsaWVudGVzJyxcbiAgICAgICAgY2xpZW50ZS50b0pTT04oKVxuICAgICAgKTtcbiAgICAgIHJldHVybiBDbGllbnRlLmZyb21EQihyb3cpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlRW5kZXJlY28oaWQ6IG51bWJlciwgZW5kZXJlY286IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlUGF0Y2goJ2NsaWVudGVzJywgYGlkPWVxLiR7aWR9YCwgeyBlbmRlcmVjbyB9KTtcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uL2NvcmUvZXJyb3JzJztcblxuZXhwb3J0IGludGVyZmFjZSBJdGVtUGVkaWRvIHtcbiAgcmVhZG9ubHkgbm9tZTogc3RyaW5nO1xuICByZWFkb25seSBwcmVjbzogbnVtYmVyO1xufVxuXG5leHBvcnQgdHlwZSBTdGF0dXNQZWRpZG8gPSAncGVuZGVudGUnIHwgJ2NvbmZpcm1hZG8nIHwgJ2NhbmNlbGFkbyc7XG5leHBvcnQgdHlwZSBTdGF0dXNQYWdhbWVudG8gPSAnYWd1YXJkYW5kbycgfCAncGFnbycgfCAnZmFsaG91JztcbmV4cG9ydCB0eXBlIFRpcG9QYWdhbWVudG8gPSAnUGl4JyB8ICdEaW5oZWlybycgfCAnQ2FydFx1MDBFM28nO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBlZGlkb1Byb3BzIHtcbiAgaWQ/OiBudW1iZXI7XG4gIG5vbWU6IHN0cmluZztcbiAgdGVsZWZvbmU6IHN0cmluZztcbiAgZW5kZXJlY286IHN0cmluZztcbiAgcGFnYW1lbnRvOiBUaXBvUGFnYW1lbnRvO1xuICBpdGVuczogSXRlbVBlZGlkb1tdO1xuICB0b3RhbDogbnVtYmVyO1xuICBzdGF0dXM6IFN0YXR1c1BlZGlkbztcbiAgc3RhdHVzX3BhZ2FtZW50bz86IFN0YXR1c1BhZ2FtZW50bztcbiAgb2JzZXJ2YWNhbz86IHN0cmluZztcbiAgYXNhYXNfcGF5bWVudF9pZD86IHN0cmluZztcbiAgY2xpZW50ZV9pZD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFBlZGlkbyB7XG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBwcm9wczogUGVkaWRvUHJvcHMpIHt9XG5cbiAgc3RhdGljIGNyZWF0ZShwcm9wczogT21pdDxQZWRpZG9Qcm9wcywgJ3N0YXR1cycgfCAndG90YWwnPik6IFBlZGlkbyB7XG4gICAgaWYgKCFwcm9wcy5pdGVucy5sZW5ndGgpIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1BlZGlkbyBkZXZlIHRlciBhbyBtZW5vcyAxIGl0ZW0nKTtcbiAgICBpZiAoIXByb3BzLm5vbWUudHJpbSgpKSB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdOb21lIG9icmlnYXRcdTAwRjNyaW8nKTtcbiAgICBpZiAoIXByb3BzLmVuZGVyZWNvLnRyaW0oKSkgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignRW5kZXJlXHUwMEU3byBvYnJpZ2F0XHUwMEYzcmlvJyk7XG4gICAgY29uc3QgdG90YWwgPSBwcm9wcy5pdGVucy5yZWR1Y2UoKHMsIGkpID0+IE1hdGgucm91bmQoKHMgKyBpLnByZWNvKSAqIDEwMCkgLyAxMDAsIDApO1xuICAgIHJldHVybiBuZXcgUGVkaWRvKHsgLi4ucHJvcHMsIHRvdGFsLCBzdGF0dXM6ICdwZW5kZW50ZScgfSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbURCKHJhdzogUGVkaWRvUHJvcHMpOiBQZWRpZG8geyByZXR1cm4gbmV3IFBlZGlkbyhyYXcpOyB9XG5cbiAgZ2V0IGlkKCk6IG51bWJlciB8IHVuZGVmaW5lZCB7IHJldHVybiB0aGlzLnByb3BzLmlkOyB9XG4gIGdldCB0b3RhbCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5wcm9wcy50b3RhbDsgfVxuICBnZXQgaXRlbnMoKTogcmVhZG9ubHkgSXRlbVBlZGlkb1tdIHsgcmV0dXJuIHRoaXMucHJvcHMuaXRlbnM7IH1cbiAgZ2V0IHBhZ2FtZW50bygpOiBUaXBvUGFnYW1lbnRvIHsgcmV0dXJuIHRoaXMucHJvcHMucGFnYW1lbnRvOyB9XG4gIGdldCBzdGF0dXNQYWdhbWVudG8oKTogU3RhdHVzUGFnYW1lbnRvIHwgdW5kZWZpbmVkIHsgcmV0dXJuIHRoaXMucHJvcHMuc3RhdHVzX3BhZ2FtZW50bzsgfVxuXG4gIGZvcm1hdGFyTWVuc2FnZW1XQSh3YU51bWJlcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBpdGVuc1N0ciA9IHRoaXMucHJvcHMuaXRlbnMubWFwKGkgPT5cbiAgICAgIGBcdTI1QjggJHtpLm5vbWV9IFx1MjAxNCBSJCAke2kucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX1gXG4gICAgKS5qb2luKCdcXG4nKTtcbiAgICBjb25zdCBtc2cgPSBbXG4gICAgICAnXHVEODNEXHVERUNEXHVGRTBGICpOT1ZPIFBFRElETyBcdTIwMTQgR0VMQU1PVVIqJyxcbiAgICAgICcnLFxuICAgICAgaXRlbnNTdHIsXG4gICAgICAnJyxcbiAgICAgIGAqVG90YWw6IFIkICR7dGhpcy5wcm9wcy50b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfSpgLFxuICAgICAgYCpQYWdhbWVudG86ICR7dGhpcy5wcm9wcy5wYWdhbWVudG99KmAsXG4gICAgICAnJyxcbiAgICAgIGBcdUQ4M0RcdURDNjQgJHt0aGlzLnByb3BzLm5vbWV9YCxcbiAgICAgIGBcdUQ4M0RcdURDQ0QgJHt0aGlzLnByb3BzLmVuZGVyZWNvfWAsXG4gICAgICB0aGlzLnByb3BzLm9ic2VydmFjYW8gPyBgXHVEODNEXHVEQ0REICR7dGhpcy5wcm9wcy5vYnNlcnZhY2FvfWAgOiAnJyxcbiAgICBdLmZpbHRlcihCb29sZWFuKS5qb2luKCdcXG4nKTtcbiAgICByZXR1cm4gYGh0dHBzOi8vd2EubWUvJHt3YU51bWJlcn0/dGV4dD0ke2VuY29kZVVSSUNvbXBvbmVudChtc2cpfWA7XG4gIH1cblxuICB0b0pTT04oKTogUGVkaWRvUHJvcHMgeyByZXR1cm4geyAuLi50aGlzLnByb3BzIH07IH1cbn1cbiIsICJpbXBvcnQgdHlwZSB7IElQZWRpZG9SZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lQZWRpZG9SZXBvc2l0b3J5JztcbmltcG9ydCB7IFBlZGlkbyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuaW1wb3J0IHR5cGUgeyBQZWRpZG9Qcm9wcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VGZXRjaCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfQU5PTiB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IE5ldHdvcmtFcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdQZWRpZG9SZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBQZWRpZG9SZXBvc2l0b3J5IGltcGxlbWVudHMgSVBlZGlkb1JlcG9zaXRvcnkge1xuICBhc3luYyBzYXZlKHBlZGlkbzogUGVkaWRvKTogUHJvbWlzZTxSZXN1bHQ8UGVkaWRvPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBsb2cuaW5mbygnU2FsdmFuZG8gcGVkaWRvJywgeyB0b3RhbDogcGVkaWRvLnRvdGFsIH0pO1xuICAgICAgLy8gVXNhIGhlYWRlcnMtb25seSBwYXJhIG9idGVyIG8gSUQgdmlhIExvY2F0aW9uXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgc3VwYWJhc2VGZXRjaChgL3Jlc3QvdjEvcGVkaWRvc2AsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ1ByZWZlcic6ICdyZXR1cm49aGVhZGVycy1vbmx5JyB9IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBlZGlkby50b0pTT04oKSksXG4gICAgICB9KTtcbiAgICAgIGlmICghcmVzcC5vaykge1xuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYFBPU1QgcGVkaWRvcyBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHkgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBsb2MgPSByZXNwLmhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpID8/ICcnO1xuICAgICAgY29uc3QgaWRNYXRjaCA9IGxvYy5tYXRjaCgvaWQ9ZXFcXC4oXFxkKykvKTtcbiAgICAgIGlmICghaWRNYXRjaCkgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcignSUQgZG8gcGVkaWRvIG5cdTAwRTNvIHJldG9ybmFkbycpO1xuICAgICAgY29uc3QgaWQgPSBwYXJzZUludChpZE1hdGNoWzFdISwgMTApO1xuICAgICAgcmV0dXJuIFBlZGlkby5mcm9tREIoeyAuLi5wZWRpZG8udG9KU09OKCksIGlkIH0gYXMgUGVkaWRvUHJvcHMpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlU3RhdHVzKGlkOiBudW1iZXIsIGNsaWVudGVJZDogbnVtYmVyLCBzdGF0dXM6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlUGF0Y2goXG4gICAgICAgICdwZWRpZG9zJyxcbiAgICAgICAgYGlkPWVxLiR7aWR9JmNsaWVudGVfaWQ9ZXEuJHtjbGllbnRlSWR9YCxcbiAgICAgICAgeyBzdGF0dXMgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRCeUlkKGlkOiBudW1iZXIpOiBQcm9taXNlPFJlc3VsdDxQZWRpZG8gfCBudWxsPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goXG4gICAgICAgIGAke1NVUEFCQVNFX1VSTH0vcmVzdC92MS9wZWRpZG9zP2lkPWVxLiR7aWR9JnNlbGVjdD1zdGF0dXNfcGFnYW1lbnRvYCxcbiAgICAgICAgeyBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtTVVBBQkFTRV9BTk9OfWAgfSB9XG4gICAgICApO1xuICAgICAgaWYgKCFyZXNwLm9rKSB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdHRVQgcGVkaWRvIGZhbGhvdScsIHsgc3RhdHVzOiByZXNwLnN0YXR1cyB9KTtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBQZWRpZG9Qcm9wc1tdO1xuICAgICAgcmV0dXJuIHJvd3NbMF0gPyBQZWRpZG8uZnJvbURCKHJvd3NbMF0pIDogbnVsbDtcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB0eXBlIHsgSVJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9yZXBvc2l0b3JpZXMvSVJvbGV0YVJlcG9zaXRvcnknO1xuaW1wb3J0IHR5cGUgeyBQYXJ0aWNpcGFjYW9Qcm9wcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9yb2xldGEnO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VHZXQsIHN1cGFiYXNlUG9zdCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdSb2xldGFSZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBSb2xldGFSZXBvc2l0b3J5IGltcGxlbWVudHMgSVJvbGV0YVJlcG9zaXRvcnkge1xuICBhc3luYyBmaW5kUGFydGljaXBhY2FvQXRpdmEoXG4gICAgdGVsZWZvbmU6IHN0cmluZyxcbiAgICBzZW1hbmE6IHN0cmluZ1xuICApOiBQcm9taXNlPFJlc3VsdDxQYXJ0aWNpcGFjYW9Qcm9wcyB8IG51bGw+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZygnZmluZFBhcnRpY2lwYWNhb0F0aXZhJywgeyBzZW1hbmEgfSk7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgc3VwYWJhc2VHZXQ8UGFydGljaXBhY2FvUHJvcHM+KFxuICAgICAgICAncm9sZXRhX3BhcnRpY2lwYWNvZXMnLFxuICAgICAgICBgdGVsZWZvbmU9ZXEuJHt0ZWxlZm9uZX0mc2VtYW5hPWVxLiR7c2VtYW5hfSZvcmRlcj1jcmVhdGVkX2F0LmRlc2MmbGltaXQ9MWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gcm93c1swXSA/PyBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVBhcnRpY2lwYWNhbyhcbiAgICBkYXRhOiBQYXJ0aWFsPFBhcnRpY2lwYWNhb1Byb3BzPlxuICApOiBQcm9taXNlPFJlc3VsdDxQYXJ0aWNpcGFjYW9Qcm9wcz4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoKCkgPT5cbiAgICAgIHN1cGFiYXNlUG9zdDxQYXJ0aWNpcGFjYW9Qcm9wcz4oJ3JvbGV0YV9wYXJ0aWNpcGFjb2VzJywgZGF0YSlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgY291bnRWZW5jZWRvcmVzU2VtYW5hKHNlbWFuYTogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8bnVtYmVyPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgc3VwYWJhc2VHZXQ8eyBpZDogbnVtYmVyIH0+KFxuICAgICAgICAncm9sZXRhX3ZlbmNlZG9yZXMnLFxuICAgICAgICBgc2VtYW5hPWVxLiR7c2VtYW5hfSZzZWxlY3Q9aWRgXG4gICAgICApO1xuICAgICAgcmV0dXJuIHJvd3MubGVuZ3RoO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVZlbmNlZG9yKFxuICAgIHRlbGVmb25lOiBzdHJpbmcsXG4gICAgbm9tZTogc3RyaW5nLFxuICAgIHByZW1pbzogc3RyaW5nLFxuICAgIHNlbWFuYTogc3RyaW5nXG4gICk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlUG9zdCgncm9sZXRhX3ZlbmNlZG9yZXMnLCB7IHRlbGVmb25lLCBub21lLCBwcmVtaW8sIHNlbWFuYSB9KTtcbiAgICB9KTtcbiAgfVxufVxuIiwgInR5cGUgSGFuZGxlcjxUPiA9IChwYXlsb2FkOiBUKSA9PiB2b2lkO1xuXG5pbnRlcmZhY2UgRXZlbnRNYXAge1xuICAnYXV0aDpsb2dpbic6IHsgY2xpZW50ZTogaW1wb3J0KCcuLi9kb21haW4vY2xpZW50ZScpLkNsaWVudGUgfTtcbiAgJ2F1dGg6bG9nb3V0Jzogdm9pZDtcbiAgJ2NhcnQ6dXBkYXRlZCc6IHsgY291bnQ6IG51bWJlcjsgdG90YWw6IG51bWJlciB9O1xuICAncGF5bWVudDpzdWNjZXNzJzogeyBwZWRpZG9JZDogbnVtYmVyOyB2YWxvcjogbnVtYmVyIH07XG4gICdwYXltZW50OmZhaWxlZCc6IHsgZXJyb3I6IHN0cmluZyB9O1xuICAncm9sZXRhOnByZW1pbyc6IHsgcHJlbWlvOiBzdHJpbmcgfTtcbiAgJ3VpOnRvYXN0JzogeyBtZXNzYWdlOiBzdHJpbmc7IHRpcG86ICdvaycgfCAnZXJybycgfCAnaW5mbycgfTtcbn1cblxuY2xhc3MgVHlwZWRFdmVudEJ1cyB7XG4gIHByaXZhdGUgaGFuZGxlcnMgPSBuZXcgTWFwPHN0cmluZywgU2V0PEhhbmRsZXI8dW5rbm93bj4+PigpO1xuXG4gIG9uPEsgZXh0ZW5kcyBrZXlvZiBFdmVudE1hcD4oXG4gICAgZXZlbnQ6IEssXG4gICAgaGFuZGxlcjogSGFuZGxlcjxFdmVudE1hcFtLXT5cbiAgKTogKCkgPT4gdm9pZCB7XG4gICAgaWYgKCF0aGlzLmhhbmRsZXJzLmhhcyhldmVudCkpIHRoaXMuaGFuZGxlcnMuc2V0KGV2ZW50LCBuZXcgU2V0KCkpO1xuICAgIHRoaXMuaGFuZGxlcnMuZ2V0KGV2ZW50KSEuYWRkKGhhbmRsZXIgYXMgSGFuZGxlcjx1bmtub3duPik7XG4gICAgcmV0dXJuICgpID0+IHRoaXMuaGFuZGxlcnMuZ2V0KGV2ZW50KT8uZGVsZXRlKGhhbmRsZXIgYXMgSGFuZGxlcjx1bmtub3duPik7XG4gIH1cblxuICBlbWl0PEsgZXh0ZW5kcyBrZXlvZiBFdmVudE1hcD4oZXZlbnQ6IEssIHBheWxvYWQ6IEV2ZW50TWFwW0tdKTogdm9pZCB7XG4gICAgdGhpcy5oYW5kbGVycy5nZXQoZXZlbnQpPy5mb3JFYWNoKGggPT4ge1xuICAgICAgdHJ5IHsgaChwYXlsb2FkKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGBFdmVudEJ1cyBlcnJvciBvbiAke2V2ZW50fTpgLCBlKTsgfVxuICAgIH0pO1xuICB9XG5cbiAgb25jZTxLIGV4dGVuZHMga2V5b2YgRXZlbnRNYXA+KFxuICAgIGV2ZW50OiBLLFxuICAgIGhhbmRsZXI6IEhhbmRsZXI8RXZlbnRNYXBbS10+XG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHVuc3ViID0gdGhpcy5vbihldmVudCwgKHBheWxvYWQpID0+IHsgaGFuZGxlcihwYXlsb2FkKTsgdW5zdWIoKTsgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGV2ZW50QnVzID0gbmV3IFR5cGVkRXZlbnRCdXMoKTtcbiIsICJ0eXBlIFNlbGVjdG9yPFMsIFQ+ID0gKHN0YXRlOiBTKSA9PiBUO1xudHlwZSBMaXN0ZW5lcjxUPiA9ICh2YWx1ZTogVCkgPT4gdm9pZDtcblxuZXhwb3J0IGNsYXNzIFN0b3JlPFMgZXh0ZW5kcyBvYmplY3Q+IHtcbiAgcHJpdmF0ZSBzdGF0ZTogUztcbiAgcHJpdmF0ZSBsaXN0ZW5lcnMgPSBuZXcgTWFwPHN0cmluZywgU2V0PExpc3RlbmVyPHVua25vd24+Pj4oKTtcbiAgcHJpdmF0ZSBnbG9iYWxMaXN0ZW5lcnMgPSBuZXcgU2V0PExpc3RlbmVyPFM+PigpO1xuXG4gIGNvbnN0cnVjdG9yKGluaXRpYWxTdGF0ZTogUykge1xuICAgIHRoaXMuc3RhdGUgPSB7IC4uLmluaXRpYWxTdGF0ZSB9O1xuICB9XG5cbiAgZ2V0U3RhdGUoKTogUmVhZG9ubHk8Uz4ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlO1xuICB9XG5cbiAgc2V0U3RhdGUodXBkYXRlcjogUGFydGlhbDxTPiB8ICgoczogUmVhZG9ubHk8Uz4pID0+IFBhcnRpYWw8Uz4pKTogdm9pZCB7XG4gICAgY29uc3QgcGF0Y2ggPSB0eXBlb2YgdXBkYXRlciA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgPyB1cGRhdGVyKHRoaXMuc3RhdGUpXG4gICAgICA6IHVwZGF0ZXI7XG4gICAgdGhpcy5zdGF0ZSA9IHsgLi4udGhpcy5zdGF0ZSwgLi4ucGF0Y2ggfTtcbiAgICB0aGlzLmdsb2JhbExpc3RlbmVycy5mb3JFYWNoKGwgPT4gbCh0aGlzLnN0YXRlKSk7XG4gIH1cblxuICBzdWJzY3JpYmUobGlzdGVuZXI6IExpc3RlbmVyPFM+KTogKCkgPT4gdm9pZCB7XG4gICAgdGhpcy5nbG9iYWxMaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5nbG9iYWxMaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfVxuXG4gIHNlbGVjdDxUPihzZWxlY3RvcjogU2VsZWN0b3I8UywgVD4sIGxpc3RlbmVyOiBMaXN0ZW5lcjxUPik6ICgpID0+IHZvaWQge1xuICAgIGxldCBwcmV2ID0gc2VsZWN0b3IodGhpcy5zdGF0ZSk7XG4gICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlKHN0YXRlID0+IHtcbiAgICAgIGNvbnN0IG5leHQgPSBzZWxlY3RvcihzdGF0ZSk7XG4gICAgICBpZiAobmV4dCAhPT0gcHJldikge1xuICAgICAgICBwcmV2ID0gbmV4dDtcbiAgICAgICAgbGlzdGVuZXIobmV4dCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBTdG9yZSB9IGZyb20gJy4vU3RvcmUnO1xuaW1wb3J0IHR5cGUgeyBDbGllbnRlIH0gZnJvbSAnLi4vZG9tYWluL2NsaWVudGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFwcFN0YXRlIHtcbiAgcmVhZG9ubHkgY2xpZW50ZTogQ2xpZW50ZSB8IG51bGw7XG4gIHJlYWRvbmx5IGlzTG9nZ2VkSW46IGJvb2xlYW47XG4gIHJlYWRvbmx5IGlzQWRtaW46IGJvb2xlYW47XG4gIHJlYWRvbmx5IGNhcnJpbmhvQ291bnQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgY2FycmluaG9Ub3RhbDogbnVtYmVyO1xuICByZWFkb25seSBwYWdhbWVudG9TZWxlY2lvbmFkbzogc3RyaW5nO1xuICByZWFkb25seSBwZWRpZG9JZFBlbmRlbnRlOiBudW1iZXIgfCBudWxsO1xuICByZWFkb25seSBwaXhEYXRhOiBQaXhEYXRhIHwgbnVsbDtcbiAgcmVhZG9ubHkgcm9sZXRhQXRpdmE6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGl4RGF0YSB7XG4gIHJlYWRvbmx5IHFyQ29kZTogc3RyaW5nO1xuICByZWFkb25seSBwaXhDb3BpYUVDb2xhOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGFzYWFzUGF5bWVudElkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHBlZGlkb0lkOiBudW1iZXI7XG59XG5cbmNvbnN0IEFETUlOX1RFTCA9IGF0b2IoJ01URTVOREEzTnpJM05UQT0nKTtcbmNvbnN0IENPTlRBX1RFU1RFID0gYXRvYignTVRFNU5qVXdNekF3TnpZPScpO1xuXG5mdW5jdGlvbiBjYWxjSXNBZG1pbihjbGllbnRlOiBDbGllbnRlIHwgbnVsbCk6IGJvb2xlYW4ge1xuICByZXR1cm4gISFjbGllbnRlICYmIGNsaWVudGUudGVsZWZvbmUgPT09IEFETUlOX1RFTDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGFUZXN0ZShjbGllbnRlOiBDbGllbnRlIHwgbnVsbCk6IGJvb2xlYW4ge1xuICByZXR1cm4gISFjbGllbnRlICYmIGNsaWVudGUudGVsZWZvbmUgPT09IENPTlRBX1RFU1RFO1xufVxuXG5leHBvcnQgY29uc3QgYXBwU3RvcmUgPSBuZXcgU3RvcmU8QXBwU3RhdGU+KHtcbiAgY2xpZW50ZTogbnVsbCxcbiAgaXNMb2dnZWRJbjogZmFsc2UsXG4gIGlzQWRtaW46IGZhbHNlLFxuICBjYXJyaW5ob0NvdW50OiAwLFxuICBjYXJyaW5ob1RvdGFsOiAwLFxuICBwYWdhbWVudG9TZWxlY2lvbmFkbzogJycsXG4gIHBlZGlkb0lkUGVuZGVudGU6IG51bGwsXG4gIHBpeERhdGE6IG51bGwsXG4gIHJvbGV0YUF0aXZhOiBmYWxzZSxcbn0pO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2xpZW50ZShjbGllbnRlOiBDbGllbnRlIHwgbnVsbCk6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7XG4gICAgY2xpZW50ZSxcbiAgICBpc0xvZ2dlZEluOiAhIWNsaWVudGUsXG4gICAgaXNBZG1pbjogY2FsY0lzQWRtaW4oY2xpZW50ZSksXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2FycmluaG8oY291bnQ6IG51bWJlciwgdG90YWw6IG51bWJlcik6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IGNhcnJpbmhvQ291bnQ6IGNvdW50LCBjYXJyaW5ob1RvdGFsOiB0b3RhbCB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFBhZ2FtZW50byh0aXBvOiBzdHJpbmcpOiB2b2lkIHtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwYWdhbWVudG9TZWxlY2lvbmFkbzogdGlwbyB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFBpeERhdGEoZGF0YTogUGl4RGF0YSB8IG51bGwpOiB2b2lkIHtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwaXhEYXRhOiBkYXRhIH0pO1xufVxuIiwgImltcG9ydCB0eXBlIHsgSUNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lDbGllbnRlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBDbGllbnRlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2NsaWVudGUnO1xuaW1wb3J0IHsgdHlwZSBSZXN1bHQsIG9rLCBmYWlsLCB0cnlBc3luYyB9IGZyb20gJy4uLy4uL2NvcmUvcmVzdWx0JztcbmltcG9ydCB7IFJhdGVMaW1pdEVycm9yLCBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi9jb3JlL2Vycm9ycyc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi8uLi9jb3JlL2xvZ2dlcic7XG5pbXBvcnQgeyBldmVudEJ1cyB9IGZyb20gJy4uLy4uL2NvcmUvZXZlbnRzJztcbmltcG9ydCB7IHNldENsaWVudGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdG9yZSc7XG5cbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnTG9naW5Vc2VDYXNlJyk7XG5cbmNvbnN0IFNFU1NJT05fS0VZID0gJ2dlbGFtb3VyX2NsaWVudGUnO1xuY29uc3QgU0VTU0lPTl9UU19LRVkgPSAnZ2VsYW1vdXJfdHMnO1xuY29uc3QgU0VTU0lPTl9UVExfTVMgPSAyNCAqIDYwICogNjAgKiAxMDAwO1xuXG5pbnRlcmZhY2UgUmF0ZUxpbWl0ZXIge1xuICBhdHRlbXB0czogbnVtYmVyO1xuICBibG9ja2VkVW50aWw6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2luVXNlQ2FzZSB7XG4gIHByaXZhdGUgcmF0ZUxpbWl0ZXI6IFJhdGVMaW1pdGVyID0geyBhdHRlbXB0czogMCwgYmxvY2tlZFVudGlsOiAwIH07XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBjbGllbnRlUmVwbzogSUNsaWVudGVSZXBvc2l0b3J5KSB7fVxuXG4gIHJlc3RvcmVTZXNzaW9uKCk6IENsaWVudGUgfCBudWxsIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdHMgPSBOdW1iZXIoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShTRVNTSU9OX1RTX0tFWSkgPz8gJzAnKTtcbiAgICAgIGlmIChEYXRlLm5vdygpIC0gdHMgPiBTRVNTSU9OX1RUTF9NUykge1xuICAgICAgICB0aGlzLmNsZWFyU2Vzc2lvbigpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJhdyA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oU0VTU0lPTl9LRVkpO1xuICAgICAgaWYgKCFyYXcpIHJldHVybiBudWxsO1xuICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UocmF3KSBhcyBSZXR1cm5UeXBlPENsaWVudGVbJ3RvSlNPTiddPjtcbiAgICAgIGNvbnN0IGNsaWVudGUgPSBDbGllbnRlLmZyb21EQihkYXRhKTtcbiAgICAgIHNldENsaWVudGUoY2xpZW50ZSk7XG4gICAgICByZXR1cm4gY2xpZW50ZTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRoaXMuY2xlYXJTZXNzaW9uKCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBhc3luYyBleGVjdXRlKHRlbGVmb25lOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDx7IGV4aXN0ZTogYm9vbGVhbjsgY2xpZW50ZT86IENsaWVudGUgfT4+IHtcbiAgICBpZiAoRGF0ZS5ub3coKSA8IHRoaXMucmF0ZUxpbWl0ZXIuYmxvY2tlZFVudGlsKSB7XG4gICAgICByZXR1cm4gZmFpbChuZXcgUmF0ZUxpbWl0RXJyb3IodGhpcy5yYXRlTGltaXRlci5ibG9ja2VkVW50aWwgLSBEYXRlLm5vdygpKSk7XG4gICAgfVxuXG4gICAgY29uc3QgdGVsID0gdGVsZWZvbmUucmVwbGFjZSgvXFxEL2csICcnKTtcbiAgICBpZiAodGVsLmxlbmd0aCA8IDEwKSByZXR1cm4gZmFpbChuZXcgVmFsaWRhdGlvbkVycm9yKCdUZWxlZm9uZSBpbnZcdTAwRTFsaWRvJykpO1xuXG4gICAgbG9nLmluZm8oJ1ZlcmlmaWNhbmRvIHRlbGVmb25lJywgeyB0ZWw6IGAqKioke3RlbC5zbGljZSgtNCl9YCB9KTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmNsaWVudGVSZXBvLmZpbmRCeVRlbGVmb25lKHRlbCk7XG5cbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgdGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cysrO1xuICAgICAgaWYgKHRoaXMucmF0ZUxpbWl0ZXIuYXR0ZW1wdHMgPj0gNSkge1xuICAgICAgICB0aGlzLnJhdGVMaW1pdGVyLmJsb2NrZWRVbnRpbCA9IERhdGUubm93KCkgKyA2MF8wMDA7XG4gICAgICAgIHRoaXMucmF0ZUxpbWl0ZXIuYXR0ZW1wdHMgPSAwO1xuICAgICAgICByZXR1cm4gZmFpbChuZXcgUmF0ZUxpbWl0RXJyb3IoNjBfMDAwKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFpbChyZXN1bHQuZXJyb3IpO1xuICAgIH1cblxuICAgIHRoaXMucmF0ZUxpbWl0ZXIuYXR0ZW1wdHMgPSAwO1xuICAgIHJldHVybiBvayh7IGV4aXN0ZTogISFyZXN1bHQudmFsdWUsIGNsaWVudGU6IHJlc3VsdC52YWx1ZSA/PyB1bmRlZmluZWQgfSk7XG4gIH1cblxuICBhc3luYyByZWdpc3Rlcihub21lOiBzdHJpbmcsIHRlbGVmb25lOiBzdHJpbmcsIGVuZGVyZWNvOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDxDbGllbnRlPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBlbnRpdHkgPSBDbGllbnRlLmNyZWF0ZSh7IG5vbWUsIHRlbGVmb25lLCBlbmRlcmVjbyB9KTtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5jbGllbnRlUmVwby5zYXZlKGVudGl0eSk7XG4gICAgICBpZiAoIXNhdmVkLm9rKSB0aHJvdyBzYXZlZC5lcnJvcjtcbiAgICAgIHJldHVybiBzYXZlZC52YWx1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGxvZ2luKGNsaWVudGU6IENsaWVudGUpOiB2b2lkIHtcbiAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFNFU1NJT05fS0VZLCBKU09OLnN0cmluZ2lmeShjbGllbnRlLnRvSlNPTigpKSk7XG4gICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShTRVNTSU9OX1RTX0tFWSwgU3RyaW5nKERhdGUubm93KCkpKTtcbiAgICBzZXRDbGllbnRlKGNsaWVudGUpO1xuICAgIGV2ZW50QnVzLmVtaXQoJ2F1dGg6bG9naW4nLCB7IGNsaWVudGUgfSk7XG4gICAgbG9nLmluZm8oJ0xvZ2luIHJlYWxpemFkbycsIHsgaWQ6IGNsaWVudGUuaWQgfSk7XG4gIH1cblxuICBsb2dvdXQoKTogdm9pZCB7XG4gICAgdGhpcy5jbGVhclNlc3Npb24oKTtcbiAgICBzZXRDbGllbnRlKG51bGwpO1xuICAgIGV2ZW50QnVzLmVtaXQoJ2F1dGg6bG9nb3V0JywgdW5kZWZpbmVkIGFzIHVua25vd24gYXMgdm9pZCk7XG4gICAgbG9nLmluZm8oJ0xvZ291dCByZWFsaXphZG8nKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJTZXNzaW9uKCk6IHZvaWQge1xuICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oU0VTU0lPTl9LRVkpO1xuICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oU0VTU0lPTl9UU19LRVkpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgZXZlbnRCdXMgfSBmcm9tICcuLi8uLi9jb3JlL2V2ZW50cyc7XG5pbXBvcnQgeyBzZXRDYXJyaW5obyB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0b3JlJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgSXRlbVBlZGlkbyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ0NhcnRTZXJ2aWNlJyk7XG5cbmV4cG9ydCBjbGFzcyBDYXJ0U2VydmljZSB7XG4gIHByaXZhdGUgaXRlbXMgPSBuZXcgTWFwPHN0cmluZywgSXRlbVBlZGlkbz4oKTtcblxuICBhZGQobm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXRlbXMuaGFzKG5vbWUpKSByZXR1cm47XG4gICAgdGhpcy5pdGVtcy5zZXQobm9tZSwgeyBub21lLCBwcmVjbzogTnVtYmVyKHByZWNvKSB9KTtcbiAgICB0aGlzLm5vdGlmeSgpO1xuICAgIGxvZy5kZWJ1ZygnSXRlbSBhZGljaW9uYWRvJywgeyBub21lIH0pO1xuICB9XG5cbiAgcmVtb3ZlKG5vbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5pdGVtcy5oYXMobm9tZSkpIHJldHVybjtcbiAgICB0aGlzLml0ZW1zLmRlbGV0ZShub21lKTtcbiAgICB0aGlzLm5vdGlmeSgpO1xuICAgIGxvZy5kZWJ1ZygnSXRlbSByZW1vdmlkbycsIHsgbm9tZSB9KTtcbiAgfVxuXG4gIHRvZ2dsZShub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiAnYWRkZWQnIHwgJ3JlbW92ZWQnIHtcbiAgICBpZiAodGhpcy5pdGVtcy5oYXMobm9tZSkpIHtcbiAgICAgIHRoaXMucmVtb3ZlKG5vbWUpO1xuICAgICAgcmV0dXJuICdyZW1vdmVkJztcbiAgICB9XG4gICAgdGhpcy5hZGQobm9tZSwgcHJlY28pO1xuICAgIHJldHVybiAnYWRkZWQnO1xuICB9XG5cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgdGhpcy5pdGVtcy5jbGVhcigpO1xuICAgIHRoaXMubm90aWZ5KCk7XG4gIH1cblxuICBnZXRJdGVtcygpOiByZWFkb25seSBJdGVtUGVkaWRvW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuaXRlbXMudmFsdWVzKCkpO1xuICB9XG5cbiAgZ2V0VG90YWwoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLml0ZW1zLnZhbHVlcygpKVxuICAgICAgLnJlZHVjZSgoc3VtLCBpKSA9PiBNYXRoLnJvdW5kKChzdW0gKyBpLnByZWNvKSAqIDEwMCkgLyAxMDAsIDApO1xuICB9XG5cbiAgZ2V0Q291bnQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuaXRlbXMuc2l6ZTsgfVxuXG4gIGhhcyhub21lOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaXRlbXMuaGFzKG5vbWUpOyB9XG5cbiAgaXNFbXB0eSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaXRlbXMuc2l6ZSA9PT0gMDsgfVxuXG4gIHJldmFsaWRhdGVQcmljZXMocHJpY2VNYXA6IE1hcDxzdHJpbmcsIG51bWJlcj4pOiB2b2lkIHtcbiAgICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRlbSwga2V5KSA9PiB7XG4gICAgICBjb25zdCByZWFsUHJpY2UgPSBwcmljZU1hcC5nZXQoa2V5KTtcbiAgICAgIGlmIChyZWFsUHJpY2UgIT09IHVuZGVmaW5lZCAmJiByZWFsUHJpY2UgIT09IGl0ZW0ucHJlY28pIHtcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoa2V5LCB7IC4uLml0ZW0sIHByZWNvOiByZWFsUHJpY2UgfSk7XG4gICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICBsb2cud2FybignUHJlXHUwMEU3byByZXZhbGlkYWRvJywgeyBub21lOiBrZXksIG9sZDogaXRlbS5wcmVjbywgbmV3OiByZWFsUHJpY2UgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKGNoYW5nZWQpIHRoaXMubm90aWZ5KCk7XG4gIH1cblxuICBwcml2YXRlIG5vdGlmeSgpOiB2b2lkIHtcbiAgICBzZXRDYXJyaW5obyh0aGlzLmdldENvdW50KCksIHRoaXMuZ2V0VG90YWwoKSk7XG4gICAgZXZlbnRCdXMuZW1pdCgnY2FydDp1cGRhdGVkJywgeyBjb3VudDogdGhpcy5nZXRDb3VudCgpLCB0b3RhbDogdGhpcy5nZXRUb3RhbCgpIH0pO1xuICB9XG59XG4iLCAiLy8gQ29tcG9zaXRpb24gUm9vdCBcdTIwMTQgaW5zdGFuY2lhIGUgaW5qZXRhIGRlcGVuZFx1MDBFQW5jaWFzXG5pbXBvcnQgeyBDbGllbnRlUmVwb3NpdG9yeSB9IGZyb20gJy4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvQ2xpZW50ZVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgUGVkaWRvUmVwb3NpdG9yeSB9IGZyb20gJy4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUGVkaWRvUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBSb2xldGFSZXBvc2l0b3J5IH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9Sb2xldGFSZXBvc2l0b3J5JztcbmltcG9ydCB7IExvZ2luVXNlQ2FzZSB9IGZyb20gJy4vYXBwbGljYXRpb24vYXV0aC9Mb2dpblVzZUNhc2UnO1xuaW1wb3J0IHsgQ2FydFNlcnZpY2UgfSBmcm9tICcuL2FwcGxpY2F0aW9uL2NhcnQvQ2FydFNlcnZpY2UnO1xuXG5jb25zdCBjbGllbnRlUmVwb3NpdG9yeSA9IG5ldyBDbGllbnRlUmVwb3NpdG9yeSgpO1xuY29uc3QgcGVkaWRvUmVwb3NpdG9yeSA9IG5ldyBQZWRpZG9SZXBvc2l0b3J5KCk7XG5jb25zdCByb2xldGFSZXBvc2l0b3J5ID0gbmV3IFJvbGV0YVJlcG9zaXRvcnkoKTtcblxuZXhwb3J0IGNvbnN0IGxvZ2luVXNlQ2FzZSA9IG5ldyBMb2dpblVzZUNhc2UoY2xpZW50ZVJlcG9zaXRvcnkpO1xuZXhwb3J0IGNvbnN0IGNhcnRTZXJ2aWNlID0gbmV3IENhcnRTZXJ2aWNlKCk7XG5cbmV4cG9ydCB7IGNsaWVudGVSZXBvc2l0b3J5LCBwZWRpZG9SZXBvc2l0b3J5LCByb2xldGFSZXBvc2l0b3J5IH07XG4iLCAiY29uc3QgU1VQQUJBU0VfVVJMID0gYXRvYignYUhSMGNITTZMeTl5Wm1KMFpIUjJjMjVtZEhsaVlYcG1iV1JpZHk1emRYQmhZbUZ6WlM1amJ3PT0nKTtcbmNvbnN0IFNVUEFCQVNFX0FOT04gPSBhdG9iKCdaWGxLYUdKSFkybFBhVXBKVlhwSk1VNXBTWE5KYmxJMVkwTkpOa2xyY0ZoV1EwbzVMbVY1U25Cak0wMXBUMmxLZW1SWVFtaFpiVVo2V2xOSmMwbHVTbXhhYVVrMlNXNUtiVmx1VW10a1NGWjZZbTFhTUdWWFNtaGxiVnAwV2tkS00wbHBkMmxqYlRseldsTkpOa2x0Um5WaU1qUnBURU5LY0ZsWVVXbFBha1V6VDBSRk5VMVVRWHBPYWtGelNXMVdOR05EU1RaTmFrRTFUbnBSTkU1cVRUSk5TREF1U0hjMk9HcFJSa1p0ZDB4bmRuZEdPWHBxYUdkV1YxQmpNMFF4VVRKd1ptZEJiakZVVVd4S1JWWjFOQT09Jyk7XG5jb25zdCBEQl9USU1FT1VUID0gMTBfMDAwO1xuXG50eXBlIEZldGNoT3B0aW9ucyA9IFJlcXVlc3RJbml0ICYgeyB0aW1lb3V0PzogbnVtYmVyIH07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkYkZldGNoKHVybDogc3RyaW5nLCBvcHRzOiBGZXRjaE9wdGlvbnMgPSB7fSk6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgY29uc3QgeyB0aW1lb3V0ID0gREJfVElNRU9VVCwgLi4uZmV0Y2hPcHRzIH0gPSBvcHRzO1xuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCB0aW1lb3V0KTtcbiAgdHJ5IHtcbiAgICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtTVVBBQkFTRV9BTk9OfWAsXG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgJ1ByZWZlcic6ICdyZXR1cm49cmVwcmVzZW50YXRpb24nLFxuICAgICAgLi4uKChmZXRjaE9wdHMuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSA/PyB7fSksXG4gICAgfTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2godXJsLCB7IC4uLmZldGNoT3B0cywgaGVhZGVycywgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSBmaW5hbGx5IHtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkYkdldDxUPih0YWJlbGE6IHN0cmluZywgZmlsdHJvID0gJycpOiBQcm9taXNlPFRbXT4ge1xuICBjb25zdCByZXNwID0gYXdhaXQgZGJGZXRjaChgJHtTVVBBQkFTRV9VUkx9L3Jlc3QvdjEvJHt0YWJlbGF9JHtmaWx0cm8gPyAnPycgKyBmaWx0cm8gOiAnJ31gKTtcbiAgaWYgKCFyZXNwLm9rKSB0aHJvdyBuZXcgRXJyb3IoYERCIEdFVCAke3RhYmVsYX06ICR7cmVzcC5zdGF0dXN9YCk7XG4gIHJldHVybiByZXNwLmpzb24oKSBhcyBQcm9taXNlPFRbXT47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkYlBvc3Q8VD4odGFiZWxhOiBzdHJpbmcsIGRhZG9zOiBQYXJ0aWFsPFQ+KTogUHJvbWlzZTxUPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBkYkZldGNoKGAke1NVUEFCQVNFX1VSTH0vcmVzdC92MS8ke3RhYmVsYX1gLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGFkb3MpLFxuICB9KTtcbiAgaWYgKCFyZXNwLm9rKSB7XG4gICAgY29uc3QgZXJyID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBEQiBQT1NUICR7dGFiZWxhfTogJHtlcnJ9YCk7XG4gIH1cbiAgY29uc3Qgcm93cyA9IGF3YWl0IHJlc3AuanNvbigpIGFzIFRbXTtcbiAgcmV0dXJuIHJvd3NbMF0hO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGJQYXRjaDxUPih0YWJlbGE6IHN0cmluZywgZmlsdHJvOiBzdHJpbmcsIGRhZG9zOiBQYXJ0aWFsPFQ+KTogUHJvbWlzZTxUW10+IHtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IGRiRmV0Y2goYCR7U1VQQUJBU0VfVVJMfS9yZXN0L3YxLyR7dGFiZWxhfT8ke2ZpbHRyb31gLCB7XG4gICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhZG9zKSxcbiAgfSk7XG4gIGlmICghcmVzcC5vaykge1xuICAgIGNvbnN0IGVyciA9IGF3YWl0IHJlc3AudGV4dCgpO1xuICAgIHRocm93IG5ldyBFcnJvcihgREIgUEFUQ0ggJHt0YWJlbGF9OiAke2Vycn1gKTtcbiAgfVxuICByZXR1cm4gcmVzcC5qc29uKCkgYXMgUHJvbWlzZTxUW10+O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsbEVkZ2VGdW5jdGlvbjxUPihub21lOiBzdHJpbmcsIGJvZHk6IHVua25vd24pOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IGRiRmV0Y2goYCR7U1VQQUJBU0VfVVJMfS9mdW5jdGlvbnMvdjEvJHtub21lfWAsIHtcbiAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgfSk7XG4gIGlmICghcmVzcC5vaykge1xuICAgIGNvbnN0IGVyciA9IGF3YWl0IHJlc3AudGV4dCgpO1xuICAgIHRocm93IG5ldyBFcnJvcihgRWRnZSBGdW5jdGlvbiAke25vbWV9OiAke2Vycn1gKTtcbiAgfVxuICByZXR1cm4gcmVzcC5qc29uKCkgYXMgUHJvbWlzZTxUPjtcbn1cblxuZXhwb3J0IHsgU1VQQUJBU0VfVVJMLCBTVVBBQkFTRV9BTk9OIH07XG4iLCAiaW1wb3J0IHR5cGUgeyBDbGllbnRlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgZGJHZXQsIGRiUG9zdCwgZGJQYXRjaCB9IGZyb20gJy4vc3VwYWJhc2UnO1xuaW1wb3J0IHsgbm9ybWFsaXphclRlbGVmb25lLCBub3JtYWxpemFyTm9tZSB9IGZyb20gJy4uL3V0aWxzL3NlY3VyaXR5JztcbmltcG9ydCB7IG1vc3RyYXJUb2FzdCB9IGZyb20gJy4uL3V0aWxzL3RvYXN0JztcblxuY29uc3QgU0VTU0lPTl9LRVkgPSAnZ2VsYW1vdXJfY2xpZW50ZSc7XG5jb25zdCBTRVNTSU9OX1RTX0tFWSA9ICdnZWxhbW91cl90cyc7XG5jb25zdCBTRVNTSU9OX1RUTCA9IDI0ICogNjAgKiA2MCAqIDEwMDA7IC8vIDI0aFxuXG5jb25zdCBDT05UQV9URVNURSA9IGF0b2IoJ01URTVOalV3TXpBd056WT0nKTtcbmNvbnN0IEFETUlOX1RFTCA9IGF0b2IoJ01URTVOREEzTnpJM05UQT0nKTtcblxubGV0IF9sb2dpblRlbnRhdGl2YXMgPSAwO1xubGV0IF9sb2dpbkJsb3F1ZWlvQXRlID0gMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENsaWVudGVBdHVhbCgpOiBDbGllbnRlIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgY29uc3QgdHMgPSBOdW1iZXIoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShTRVNTSU9OX1RTX0tFWSkgPz8gJzAnKTtcbiAgICBpZiAoRGF0ZS5ub3coKSAtIHRzID4gU0VTU0lPTl9UVEwpIHtcbiAgICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oU0VTU0lPTl9LRVkpO1xuICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX1RTX0tFWSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgcmF3ID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShTRVNTSU9OX0tFWSk7XG4gICAgcmV0dXJuIHJhdyA/IChKU09OLnBhcnNlKHJhdykgYXMgQ2xpZW50ZSkgOiBudWxsO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FsdmFyU2Vzc2FvKGNsaWVudGU6IENsaWVudGUpOiB2b2lkIHtcbiAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShTRVNTSU9OX0tFWSwgSlNPTi5zdHJpbmdpZnkoY2xpZW50ZSkpO1xuICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFNFU1NJT05fVFNfS0VZLCBTdHJpbmcoRGF0ZS5ub3coKSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGltcGFyU2Vzc2FvKCk6IHZvaWQge1xuICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKFNFU1NJT05fS0VZKTtcbiAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX1RTX0tFWSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRhVGVzdGUoY2xpZW50ZTogQ2xpZW50ZSB8IG51bGwpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhY2xpZW50ZSAmJiBub3JtYWxpemFyVGVsZWZvbmUoY2xpZW50ZS50ZWxlZm9uZSkgPT09IENPTlRBX1RFU1RFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNBZG1pbihjbGllbnRlOiBDbGllbnRlIHwgbnVsbCk6IGJvb2xlYW4ge1xuICByZXR1cm4gISFjbGllbnRlICYmIG5vcm1hbGl6YXJUZWxlZm9uZShjbGllbnRlLnRlbGVmb25lKSA9PT0gQURNSU5fVEVMO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyVGVsZWZvbmVEQih0ZWxSYXc6IHN0cmluZyk6IFByb21pc2U8eyBleGlzdGU6IGJvb2xlYW47IGNsaWVudGU/OiBDbGllbnRlIH0+IHtcbiAgaWYgKERhdGUubm93KCkgPCBfbG9naW5CbG9xdWVpb0F0ZSkge1xuICAgIGNvbnN0IHJlc3RhbnRlID0gTWF0aC5jZWlsKChfbG9naW5CbG9xdWVpb0F0ZSAtIERhdGUubm93KCkpIC8gMTAwMCk7XG4gICAgbW9zdHJhclRvYXN0KGBNdWl0YXMgdGVudGF0aXZhcy4gQWd1YXJkZSAke3Jlc3RhbnRlfXMuYCwgJ2Vycm8nKTtcbiAgICByZXR1cm4geyBleGlzdGU6IGZhbHNlIH07XG4gIH1cblxuICBjb25zdCB0ZWwgPSBub3JtYWxpemFyVGVsZWZvbmUodGVsUmF3KTtcbiAgaWYgKHRlbC5sZW5ndGggPCAxMCkge1xuICAgIG1vc3RyYXJUb2FzdCgnVGVsZWZvbmUgaW52XHUwMEUxbGlkby4nLCAnZXJybycpO1xuICAgIHJldHVybiB7IGV4aXN0ZTogZmFsc2UgfTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3Qgcm93cyA9IGF3YWl0IGRiR2V0PENsaWVudGU+KCdjbGllbnRlcycsIGB0ZWxlZm9uZT1lcS4ke3RlbH0mbGltaXQ9MWApO1xuICAgIF9sb2dpblRlbnRhdGl2YXMgPSAwO1xuICAgIHJldHVybiB7IGV4aXN0ZTogcm93cy5sZW5ndGggPiAwLCBjbGllbnRlOiByb3dzWzBdIH07XG4gIH0gY2F0Y2gge1xuICAgIF9sb2dpblRlbnRhdGl2YXMrKztcbiAgICBpZiAoX2xvZ2luVGVudGF0aXZhcyA+PSA1KSB7XG4gICAgICBfbG9naW5CbG9xdWVpb0F0ZSA9IERhdGUubm93KCkgKyA2MF8wMDA7XG4gICAgICBfbG9naW5UZW50YXRpdmFzID0gMDtcbiAgICAgIG1vc3RyYXJUb2FzdCgnTXVpdGFzIHRlbnRhdGl2YXMuIEFndWFyZGUgNjBzLicsICdlcnJvJyk7XG4gICAgfVxuICAgIHJldHVybiB7IGV4aXN0ZTogZmFsc2UgfTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FkYXN0cmFyQ2xpZW50ZShub21lOiBzdHJpbmcsIHRlbGVmb25lOiBzdHJpbmcsIGVuZGVyZWNvOiBzdHJpbmcpOiBQcm9taXNlPENsaWVudGU+IHtcbiAgY29uc3QgdGVsID0gbm9ybWFsaXphclRlbGVmb25lKHRlbGVmb25lKTtcbiAgY29uc3Qgbm9tZU5vcm0gPSBub3JtYWxpemFyTm9tZShub21lKTtcbiAgcmV0dXJuIGRiUG9zdDxDbGllbnRlPignY2xpZW50ZXMnLCB7IG5vbWU6IG5vbWVOb3JtLCB0ZWxlZm9uZTogdGVsLCBlbmRlcmVjbyB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhbHZhckVuZGVyZWNvQ2xpZW50ZURCKGNsaWVudGVJZDogbnVtYmVyLCBlbmRlcmVjbzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGF3YWl0IGRiUGF0Y2g8Q2xpZW50ZT4oJ2NsaWVudGVzJywgYGlkPWVxLiR7Y2xpZW50ZUlkfWAsIHsgZW5kZXJlY28gfSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBSb2xldGFDb25maWcsIFBhcnRpY2lwYWNhbywgVmVuY2Vkb3IsIENsaWVudGUgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBkYkdldCwgZGJQb3N0LCBkYlBhdGNoIH0gZnJvbSAnLi4vc2VydmljZXMvc3VwYWJhc2UnO1xuaW1wb3J0IHsgZ2V0U2VtYW5hQXR1YWwgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHsgZXNjSFRNTCB9IGZyb20gJy4uL3V0aWxzL3NlY3VyaXR5JztcbmltcG9ydCB7IG1vc3RyYXJUb2FzdCB9IGZyb20gJy4uL3V0aWxzL3RvYXN0JztcbmltcG9ydCB7IGlzQ29udGFUZXN0ZSB9IGZyb20gJy4uL3NlcnZpY2VzL2F1dGgnO1xuXG5jb25zdCBQUkVNSU9TX1BBRFJBTzogc3RyaW5nW10gPSBbXG4gICdcdUQ4M0NcdURGODEgNSUgT0ZGIFx1MjAxNCBDb21wcmFzIGFjaW1hIGRlIFIkMzUnLFxuICAnXHVEODNDXHVERjZCIEJyb3duaWUgVHJhZGljaW9uYWwgR3JcdTAwRTF0aXMgXHUyMDE0IENvbXByYXMgYWNpbWEgZGUgUiQ1MCcsXG4gICdcdUQ4M0NcdURGODEgMTAlIE9GRiBcdTIwMTQgQ29tcHJhcyBhY2ltYSBkZSBSJDUwJyxcbiAgJ1x1RDgzRFx1RENGOCBTaWdhIGEgR2VsYW1vdXIgbm8gSW5zdGFncmFtJyxcbiAgJ1x1RDgzRFx1REVDRFx1RkUwRiBDb21wcmUgMiBlIExldmUgXHUyMDE0IEF0XHUwMEU5IFIkMTQgZW0gcHJvZHV0b3MnLFxuICAnXHVEODNEXHVERTE1IE5cdTAwRTNvIEZvaSBEZXNzYSBWZXogXHUyMDE0IEdhbmhhIDUlIE9GRiBhY2ltYSBkZSBSJDM1Jyxcbl07XG5cbmxldCBfcHJlbWlvczogc3RyaW5nW10gPSBbLi4uUFJFTUlPU19QQURSQU9dO1xubGV0IF9yb3RhY2FvQXR1YWwgPSAwO1xubGV0IF9naXJhbmRvID0gZmFsc2U7XG5sZXQgX3BhcnRpY2lwYWNhb0lkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZW1pb3NQYWRyYW8oKTogc3RyaW5nW10geyByZXR1cm4gUFJFTUlPU19QQURSQU87IH1cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmVtaW9zKCk6IHN0cmluZ1tdIHsgcmV0dXJuIF9wcmVtaW9zOyB9XG5leHBvcnQgZnVuY3Rpb24gc2V0UHJlbWlvcyhwOiBzdHJpbmdbXSk6IHZvaWQgeyBfcHJlbWlvcyA9IHA7IH1cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJ0aWNpcGFjYW9JZCgpOiBudW1iZXIgfCBudWxsIHsgcmV0dXJuIF9wYXJ0aWNpcGFjYW9JZDsgfVxuZXhwb3J0IGZ1bmN0aW9uIHNldFBhcnRpY2lwYWNhb0lkKGlkOiBudW1iZXIgfCBudWxsKTogdm9pZCB7IF9wYXJ0aWNpcGFjYW9JZCA9IGlkOyB9XG5leHBvcnQgZnVuY3Rpb24gaXNHaXJhbmRvKCk6IGJvb2xlYW4geyByZXR1cm4gX2dpcmFuZG87IH1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyQ29uZmlnKCk6IFByb21pc2U8Um9sZXRhQ29uZmlnIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBkYkdldDxSb2xldGFDb25maWc+KCdyb2xldGFfY29uZmlnJywgJ2lkPWVxLjEmbGltaXQ9MScpO1xuICAgIGlmIChyb3dzWzBdKSB7XG4gICAgICBfcHJlbWlvcyA9IEFycmF5LmlzQXJyYXkocm93c1swXS5wcmVtaW9zKSA/IHJvd3NbMF0ucHJlbWlvcyA6IFBSRU1JT1NfUEFEUkFPO1xuICAgIH1cbiAgICByZXR1cm4gcm93c1swXSA/PyBudWxsO1xuICB9IGNhdGNoIHsgcmV0dXJuIG51bGw7IH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhclN0YXR1cyhjbGllbnRlSWQ6IG51bWJlcik6IFByb21pc2U8UGFydGljaXBhY2FvIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBkYkdldDxQYXJ0aWNpcGFjYW8+KFxuICAgICAgJ3JvbGV0YV9wYXJ0aWNpcGFjb2VzJyxcbiAgICAgIGBjbGllbnRlX2lkPWVxLiR7Y2xpZW50ZUlkfSZvcmRlcj1jcmVhdGVkX2F0LmRlc2MmbGltaXQ9MWBcbiAgICApO1xuICAgIGlmIChyb3dzWzBdKSB7XG4gICAgICBfcGFydGljaXBhY2FvSWQgPSByb3dzWzBdLmlkO1xuICAgIH1cbiAgICByZXR1cm4gcm93c1swXSA/PyBudWxsO1xuICB9IGNhdGNoIHsgcmV0dXJuIG51bGw7IH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdpcmFyKFxuICBjbGllbnRlOiBDbGllbnRlLFxuICBvblJlc3VsdGFkbzogKHByZW1pbzogc3RyaW5nLCBpbmRpY2U6IG51bWJlcikgPT4gdm9pZFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChfZ2lyYW5kbykgcmV0dXJuO1xuXG4gIGlmICghaXNDb250YVRlc3RlKGNsaWVudGUpKSB7XG4gICAgbW9zdHJhclRvYXN0KCdcdUQ4M0RcdURFQTcgUm9sZXRhIGVtIGJyZXZlISBFc3RhbW9zIGZpbmFsaXphbmRvIG9zIFx1MDBGQWx0aW1vcyBkZXRhbGhlcy4gXHVEODNDXHVERkExJywgJ2luZm8nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBfZ2lyYW5kbyA9IHRydWU7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgaWYgKGJ0bikgeyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4udGV4dENvbnRlbnQgPSAnR2lyYW5kby4uLic7IH1cblxuICBjb25zdCBuID0gX3ByZW1pb3MubGVuZ3RoO1xuICBjb25zdCBhcmMgPSAzNjAgLyBuO1xuICBjb25zdCBpbmRpY2UgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBuKTtcbiAgY29uc3Qgdm9sdGFzRXh0cmFzID0gNSArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUpO1xuICBjb25zdCBhbmd1bG9BbHZvID0gdm9sdGFzRXh0cmFzICogMzYwICsgKDM2MCAtIGFyYyAqIGluZGljZSAtIGFyYyAvIDIpO1xuICBjb25zdCByb3RhY2FvRmluYWwgPSBfcm90YWNhb0F0dWFsICsgYW5ndWxvQWx2bztcblxuICBjb25zdCByb2RhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJvZGEnKTtcbiAgaWYgKHJvZGEpIHtcbiAgICByb2RhLnN0eWxlLnRyYW5zaXRpb24gPSAndHJhbnNmb3JtIDRzIGN1YmljLWJlemllcigwLjE3LCAwLjY3LCAwLjEyLCAxKSc7XG4gICAgcm9kYS5zdHlsZS50cmFuc2Zvcm1PcmlnaW4gPSAnMjAwcHggMjAwcHgnO1xuICAgIHJvZGEuc3R5bGUudHJhbnNmb3JtID0gYHJvdGF0ZSgke3JvdGFjYW9GaW5hbH1kZWcpYDtcbiAgfVxuXG4gIF9yb3RhY2FvQXR1YWwgPSAoKHJvdGFjYW9GaW5hbCAlIDM2MCkgKyAzNjApICUgMzYwO1xuXG4gIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA0MjAwKSk7XG5cbiAgY29uc3QgcHJlbWlvID0gX3ByZW1pb3NbaW5kaWNlXSE7XG4gIF9naXJhbmRvID0gZmFsc2U7XG5cbiAgb25SZXN1bHRhZG8ocHJlbWlvLCBpbmRpY2UpO1xuXG4gIGlmIChpc0NvbnRhVGVzdGUoY2xpZW50ZSkgJiYgYnRuKSB7XG4gICAgYnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgYnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REZBMSBHSVJBUiBBR09SQSEnO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYWx2YXJWZW5jZWRvcihjbGllbnRlOiBDbGllbnRlLCBwcmVtaW86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoaXNDb250YVRlc3RlKGNsaWVudGUpKSByZXR1cm47XG4gIGlmICghX3BhcnRpY2lwYWNhb0lkKSByZXR1cm47XG4gIHRyeSB7XG4gICAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcbiAgICBhd2FpdCBkYlBhdGNoPFBhcnRpY2lwYWNhbz4oJ3JvbGV0YV9wYXJ0aWNpcGFjb2VzJywgYGlkPWVxLiR7X3BhcnRpY2lwYWNhb0lkfWAsIHtcbiAgICAgIGphX2dpcm91OiB0cnVlLFxuICAgICAgcHJlbWlvLFxuICAgIH0pO1xuICAgIGF3YWl0IGRiUG9zdDxWZW5jZWRvcj4oJ3JvbGV0YV92ZW5jZWRvcmVzJywge1xuICAgICAgcGFydGljaXBhY2FvX2lkOiBfcGFydGljaXBhY2FvSWQsXG4gICAgICBjbGllbnRlX2lkOiBjbGllbnRlLmlkLFxuICAgICAgbm9tZTogY2xpZW50ZS5ub21lLFxuICAgICAgdGVsZWZvbmU6IGNsaWVudGUudGVsZWZvbmUsXG4gICAgICBwcmVtaW8sXG4gICAgICBzZW1hbmEsXG4gICAgfSBhcyBQYXJ0aWFsPFZlbmNlZG9yPik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvIGFvIHNhbHZhciB2ZW5jZWRvcjonLCBlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVzZW5oYXJSb2xldGEocHJlbWlvczogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3Qgd3JhcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yb2xldGEtcG9pbnRlci13cmFwJyk7XG4gIGlmICghd3JhcCkgcmV0dXJuO1xuICBjb25zdCBvbGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQ2FudmFzJyk7XG4gIGlmIChvbGQpIG9sZC5yZW1vdmUoKTtcblxuICBjb25zdCBOID0gcHJlbWlvcy5sZW5ndGg7XG4gIGNvbnN0IENYID0gMjAwLCBDWSA9IDIwMCwgUiA9IDE2NCwgUl9MRUQgPSAxODIsIFJfT1VURVIgPSAxOTY7XG4gIGNvbnN0IFNFRyA9IDM2MCAvIE47XG4gIGNvbnN0IENPUkVTID0gW1xuICAgIHsgYmc6ICcjRkFGMEYyJywgdHh0OiAnI0I1MTM0RicgfSxcbiAgICB7IGJnOiAnI0U4NTI4QScsIHR4dDogJyNGRkZGRkYnIH0sXG4gIF0gYXMgY29uc3Q7XG5cbiAgY29uc3QgcmFkID0gKGQ6IG51bWJlcik6IG51bWJlciA9PiBkICogTWF0aC5QSSAvIDE4MDtcbiAgY29uc3QgcHQgPSAoZDogbnVtYmVyLCByOiBudW1iZXIpOiBbbnVtYmVyLCBudW1iZXJdID0+IFtDWCArIHIgKiBNYXRoLmNvcyhyYWQoZCkpLCBDWSArIHIgKiBNYXRoLnNpbihyYWQoZCkpXTtcbiAgY29uc3QgZXNjID0gKHM6IHN0cmluZyk6IHN0cmluZyA9PiBzLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcblxuICBmdW5jdGlvbiBzZWdQYXRoKGk6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3QgcyA9IFNFRyAqIGkgLSA5MCwgZSA9IHMgKyBTRUc7XG4gICAgY29uc3QgW3gxLCB5MV0gPSBwdChzLCBSKSwgW3gyLCB5Ml0gPSBwdChlLCBSKTtcbiAgICByZXR1cm4gYE0ke0NYfSwke0NZfSBMJHt4MS50b0ZpeGVkKDIpfSwke3kxLnRvRml4ZWQoMil9IEEke1J9LCR7Un0gMCAwLDEgJHt4Mi50b0ZpeGVkKDIpfSwke3kyLnRvRml4ZWQoMil9IFpgO1xuICB9XG5cbiAgZnVuY3Rpb24gd3JhcFdvcmRzKHRleHQ6IHN0cmluZywgbWF4Q2hhcnM6IG51bWJlcik6IHN0cmluZ1tdIHtcbiAgICBjb25zdCB3b3JkcyA9IHRleHQuc3BsaXQoJyAnKTtcbiAgICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgY3VyID0gJyc7XG4gICAgd29yZHMuZm9yRWFjaCh3ID0+IHtcbiAgICAgIGNvbnN0IHRlc3QgPSBjdXIgPyBgJHtjdXJ9ICR7d31gIDogdztcbiAgICAgIGlmICh0ZXN0Lmxlbmd0aCA+IG1heENoYXJzICYmIGN1cikgeyBsaW5lcy5wdXNoKGN1cik7IGN1ciA9IHc7IH1cbiAgICAgIGVsc2UgY3VyID0gdGVzdDtcbiAgICB9KTtcbiAgICBpZiAoY3VyKSBsaW5lcy5wdXNoKGN1cik7XG4gICAgcmV0dXJuIGxpbmVzLnNsaWNlKDAsIDMpO1xuICB9XG5cbiAgY29uc3Qgc2VncyA9IHByZW1pb3MubWFwKChfLCBpKSA9PiB7XG4gICAgY29uc3QgYyA9IENPUkVTW2kgJSAyXSE7XG4gICAgcmV0dXJuIGA8cGF0aCBkPVwiJHtzZWdQYXRoKGkpfVwiIGZpbGw9XCIke2MuYmd9XCIgc3Ryb2tlPVwiI0Q0QUYzN1wiIHN0cm9rZS13aWR0aD1cIjJcIiBzaGFwZS1yZW5kZXJpbmc9XCJnZW9tZXRyaWNQcmVjaXNpb25cIi8+YDtcbiAgfSkuam9pbignJyk7XG5cbiAgY29uc3Qgc3Bva2VzID0gcHJlbWlvcy5tYXAoKF8sIGkpID0+IHtcbiAgICBjb25zdCBkID0gU0VHICogaSAtIDkwO1xuICAgIGNvbnN0IFt4LCB5XSA9IHB0KGQsIFIpO1xuICAgIHJldHVybiBgPGxpbmUgeDE9XCIke0NYfVwiIHkxPVwiJHtDWX1cIiB4Mj1cIiR7eC50b0ZpeGVkKDIpfVwiIHkyPVwiJHt5LnRvRml4ZWQoMil9XCIgc3Ryb2tlPVwiI0Q0QUYzN1wiIHN0cm9rZS13aWR0aD1cIjJcIi8+YDtcbiAgfSkuam9pbignJyk7XG5cbiAgY29uc3QgdGV4dHMgPSBwcmVtaW9zLm1hcCgocCwgaSkgPT4ge1xuICAgIGNvbnN0IG1pZCA9IFNFRyAqIGkgLSA5MCArIFNFRyAvIDI7XG4gICAgY29uc3QgW3R4LCB0eV0gPSBwdChtaWQsIFIgKiAwLjU3KTtcbiAgICBjb25zdCBjID0gQ09SRVNbaSAlIDJdITtcbiAgICBjb25zdCBtID0gcC5tYXRjaCgvXihcXFMrKVxccysoLispJC8pO1xuICAgIGNvbnN0IGVtb2ppID0gbSA/IG1bMV0hIDogJyc7XG4gICAgY29uc3QgcmVzdCA9IG0gPyBtWzJdISA6IHA7XG4gICAgY29uc3QgbGluZXMgPSB3cmFwV29yZHMocmVzdCwgMTMpO1xuICAgIGNvbnN0IGxpbmVIID0gMTEuNTtcbiAgICBjb25zdCB0b3RhbFR4dEggPSBsaW5lcy5sZW5ndGggKiBsaW5lSDtcbiAgICBjb25zdCBlbW9qaVkgPSAtKHRvdGFsVHh0SCAvIDIpIC0gMTE7XG4gICAgY29uc3Qgcm90ID0gKG1pZCArIDkwKS50b0ZpeGVkKDEpO1xuICAgIHJldHVybiBgPGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKCR7dHgudG9GaXhlZCgyKX0sJHt0eS50b0ZpeGVkKDIpfSkgcm90YXRlKCR7cm90fSlcIiB0ZXh0LXJlbmRlcmluZz1cImdlb21ldHJpY1ByZWNpc2lvblwiPlxuICA8dGV4dCB4PVwiMFwiIHk9XCIke2Vtb2ppWS50b0ZpeGVkKDEpfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmb250LXNpemU9XCIxNVwiIGZvbnQtZmFtaWx5PVwic2VyaWZcIj4ke2VzYyhlbW9qaSl9PC90ZXh0PlxuICAke2xpbmVzLm1hcCgobCwgbGkpID0+IHtcbiAgICBjb25zdCB5cCA9ICgobGkgLSAobGluZXMubGVuZ3RoIC0gMSkgLyAyKSAqIGxpbmVIKS50b0ZpeGVkKDEpO1xuICAgIHJldHVybiBgPHRleHQgeD1cIjBcIiB5PVwiJHt5cH1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGRvbWluYW50LWJhc2VsaW5lPVwibWlkZGxlXCIgZmlsbD1cIiR7Yy50eHR9XCIgZm9udC1mYW1pbHk9XCInRE0gU2FucycsQXJpYWwsc2Fucy1zZXJpZlwiIGZvbnQtd2VpZ2h0PVwiNzAwXCIgZm9udC1zaXplPVwiOVwiPiR7ZXNjKGwpfTwvdGV4dD5gO1xuICB9KS5qb2luKCdcXG4gICcpfVxuPC9nPmA7XG4gIH0pLmpvaW4oJycpO1xuXG4gIGNvbnN0IExFRF9OID0gMzA7XG4gIGNvbnN0IGxlZHMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBMRURfTiB9LCAoXywgaSkgPT4ge1xuICAgIGNvbnN0IFtseCwgbHldID0gcHQoKDM2MCAvIExFRF9OKSAqIGkgLSA5MCwgUl9MRUQpO1xuICAgIHJldHVybiBgPGNpcmNsZSBjeD1cIiR7bHgudG9GaXhlZCgyKX1cIiBjeT1cIiR7bHkudG9GaXhlZCgyKX1cIiByPVwiNS41XCIgY2xhc3M9XCJyLWxlZCByLWxlZC0ke2kgJSAyfVwiLz5gO1xuICB9KS5qb2luKCcnKTtcblxuICBjb25zdCBzdmcgPSBgPHN2ZyBpZD1cInJvbGV0YUNhbnZhc1wiIHZpZXdCb3g9XCIwIDAgNDAwIDQwMFwiXG4gIHN0eWxlPVwid2lkdGg6bWluKDg2dncsMzQwcHgpO2hlaWdodDptaW4oODZ2dywzNDBweCk7ZGlzcGxheTpibG9jaztmaWx0ZXI6ZHJvcC1zaGFkb3coMCA2cHggMjBweCByZ2JhKDAsMCwwLC40MikpXCJcbiAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPlxuICA8ZGVmcz5cbiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9XCJyZy1yaW5nXCIgY3g9XCI1MCVcIiBjeT1cIjUwJVwiIHI9XCI1MCVcIj5cbiAgICAgIDxzdG9wIG9mZnNldD1cIjcwJVwiIHN0b3AtY29sb3I9XCIjRDQyQjczXCIvPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiMTAwJVwiIHN0b3AtY29sb3I9XCIjNkEwODJFXCIvPlxuICAgIDwvcmFkaWFsR3JhZGllbnQ+XG4gICAgPHJhZGlhbEdyYWRpZW50IGlkPVwicmctY3RyXCIgY3g9XCIzNSVcIiBjeT1cIjMwJVwiIHI9XCI3MCVcIj5cbiAgICAgIDxzdG9wIG9mZnNldD1cIjAlXCIgc3RvcC1jb2xvcj1cIiNGRkU1N0FcIi8+XG4gICAgICA8c3RvcCBvZmZzZXQ9XCI0OCVcIiBzdG9wLWNvbG9yPVwiI0Q0QUYzN1wiLz5cbiAgICAgIDxzdG9wIG9mZnNldD1cIjEwMCVcIiBzdG9wLWNvbG9yPVwiIzdBNTgwMFwiLz5cbiAgICA8L3JhZGlhbEdyYWRpZW50PlxuICAgIDxmaWx0ZXIgaWQ9XCJmLWdsb3dcIiB4PVwiLTYwJVwiIHk9XCItNjAlXCIgd2lkdGg9XCIyMjAlXCIgaGVpZ2h0PVwiMjIwJVwiPlxuICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj1cIjIuNVwiIHJlc3VsdD1cImJcIi8+XG4gICAgICA8ZmVNZXJnZT48ZmVNZXJnZU5vZGUgaW49XCJiXCIvPjxmZU1lcmdlTm9kZSBpbj1cIlNvdXJjZUdyYXBoaWNcIi8+PC9mZU1lcmdlPlxuICAgIDwvZmlsdGVyPlxuICA8L2RlZnM+XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiJHtSX09VVEVSfVwiIGZpbGw9XCJ1cmwoI3JnLXJpbmcpXCIvPlxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIiR7Ul9PVVRFUn1cIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIzLjVcIi8+XG4gIDxnIGlkPVwicm9sZXRhUm9kYVwiPiR7c2Vnc30ke3Nwb2tlc30ke3RleHRzfTwvZz5cbiAgPGNpcmNsZSBjeD1cIiR7Q1h9XCIgY3k9XCIke0NZfVwiIHI9XCIke1IgKyAxfVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiI0Q0QUYzN1wiIHN0cm9rZS13aWR0aD1cIjNcIi8+XG4gICR7bGVkc31cbiAgPGNpcmNsZSBjeD1cIiR7Q1h9XCIgY3k9XCIke0NZfVwiIHI9XCI0MlwiIGZpbGw9XCJ1cmwoI3JnLWN0cilcIiBzdHJva2U9XCIjRkZGXCIgc3Ryb2tlLXdpZHRoPVwiMy41XCIgZmlsdGVyPVwidXJsKCNmLWdsb3cpXCIvPlxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIjM4XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJyZ2JhKDI1NSwyNTUsMjU1LDAuMzUpXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIvPlxuICA8dGV4dCB4PVwiJHtDWH1cIiB5PVwiJHtDWSAtIDd9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBkb21pbmFudC1iYXNlbGluZT1cIm1pZGRsZVwiIGZpbGw9XCIjRkZGXCIgZm9udC1mYW1pbHk9XCInRE0gU2FucycsQXJpYWwsc2Fucy1zZXJpZlwiIGZvbnQtd2VpZ2h0PVwiODAwXCIgZm9udC1zaXplPVwiMTJcIiBsZXR0ZXItc3BhY2luZz1cIjEuNVwiIHRleHQtcmVuZGVyaW5nPVwiZ2VvbWV0cmljUHJlY2lzaW9uXCI+R0lSQVI8L3RleHQ+XG4gIDx0ZXh0IHg9XCIke0NYfVwiIHk9XCIke0NZICsgOX1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGRvbWluYW50LWJhc2VsaW5lPVwibWlkZGxlXCIgZmlsbD1cInJnYmEoMjU1LDI1NSwyNTUsLjg1KVwiIGZvbnQtZmFtaWx5PVwic2VyaWZcIiBmb250LXNpemU9XCIxMVwiPlx1MjYwNSBcdTI2MDUgXHUyNjA1PC90ZXh0PlxuPC9zdmc+YDtcblxuICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9IHN2ZztcbiAgd3JhcC5pbnNlcnRCZWZvcmUoZGl2LmZpcnN0RWxlbWVudENoaWxkISwgd3JhcC5maXJzdENoaWxkKTtcbn1cblxuZXhwb3J0IHsgZXNjSFRNTCB9O1xuIiwgImltcG9ydCB0eXBlIHsgSXRlbUNhcnJpbmhvIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgZXNjSFRNTCB9IGZyb20gJy4uL3V0aWxzL3NlY3VyaXR5JztcbmltcG9ydCB7IGZvcm1hdGFyTW9lZGEgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHsgY2FydFNlcnZpY2UgfSBmcm9tICcuLi9jb250YWluZXInO1xuXG4vLyBBZGFwdGFkb3JlcyBsZWdhZG9zIFx1MjAxNCBkZWxlZ2FtIGFvIENhcnRTZXJ2aWNlIChDbGVhbiBBcmNoaXRlY3R1cmUpXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FycmluaG8oKTogUmVjb3JkPHN0cmluZywgSXRlbUNhcnJpbmhvPiB7XG4gIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgSXRlbUNhcnJpbmhvPiA9IHt9O1xuICBjYXJ0U2VydmljZS5nZXRJdGVtcygpLmZvckVhY2goaSA9PiB7IHJlc3VsdFtpLm5vbWVdID0gaTsgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJdGVucygpOiBJdGVtQ2FycmluaG9bXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCkpIGFzIEl0ZW1DYXJyaW5ob1tdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VG90YWwoKTogbnVtYmVyIHtcbiAgcmV0dXJuIGNhcnRTZXJ2aWNlLmdldFRvdGFsKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGljaW9uYXJJdGVtKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IGJvb2xlYW4ge1xuICBpZiAoY2FydFNlcnZpY2UuaGFzKG5vbWUpKSByZXR1cm4gZmFsc2U7XG4gIGNhcnRTZXJ2aWNlLmFkZChub21lLCBwcmVjbyk7XG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3Zlckl0ZW0obm9tZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGlmICghY2FydFNlcnZpY2UuaGFzKG5vbWUpKSByZXR1cm4gZmFsc2U7XG4gIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGVJdGVtKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6ICdhZGljaW9uYWRvJyB8ICdyZW1vdmlkbycge1xuICBjb25zdCByID0gY2FydFNlcnZpY2UudG9nZ2xlKG5vbWUsIHByZWNvKTtcbiAgcmV0dXJuIHIgPT09ICdhZGRlZCcgPyAnYWRpY2lvbmFkbycgOiAncmVtb3ZpZG8nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGltcGFyKCk6IHZvaWQge1xuICBjYXJ0U2VydmljZS5jbGVhcigpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCb2xvRm9ybWEobm9tZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IEJPTE9fRk9STUFfTk9NRVMgPSBbJ0JvbG8gbmEgZm9ybWEgTWlsaG8gbmF0dXJhbCcsICdCb2xvIG5hIGZvcm1hIENlbm91cmEgY29tIGNob2NvbGF0ZSBlIEdyYW51bGUnXTtcbiAgcmV0dXJuIEJPTE9fRk9STUFfTk9NRVMuaW5jbHVkZXMobm9tZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJpemFyTGlzdGEoY29udGFpbmVySWQ6IHN0cmluZywgdG90YWxSb2RhcGVJZDogc3RyaW5nLCBiYWRnZUlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgbGlzdGEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250YWluZXJJZCk7XG4gIGNvbnN0IHRvdGFsRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0b3RhbFJvZGFwZUlkKTtcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChiYWRnZUlkKTtcbiAgY29uc3QgaXRlbnMgPSBnZXRJdGVucygpO1xuXG4gIGlmIChiYWRnZSkgYmFkZ2UudGV4dENvbnRlbnQgPSBTdHJpbmcoaXRlbnMubGVuZ3RoKTtcblxuICBpZiAoIWxpc3RhIHx8ICF0b3RhbEVsKSByZXR1cm47XG5cbiAgaWYgKGl0ZW5zLmxlbmd0aCA9PT0gMCkge1xuICAgIGxpc3RhLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiY2FycmluaG8tdmF6aW9cIj48ZGl2IGNsYXNzPVwiY2FycmluaG8tdmF6aW8taWNvblwiPlx1RDgzRFx1REVEMjwvZGl2PjxkaXY+U2V1IGNhcnJpbmhvIGVzdFx1MDBFMSB2YXppbzwvZGl2PjwvZGl2PmA7XG4gICAgdG90YWxFbC50ZXh0Q29udGVudCA9ICdSJCAwLDAwJztcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB0b3RhbCA9IGdldFRvdGFsKCk7XG4gIGxpc3RhLmlubmVySFRNTCA9IGl0ZW5zLm1hcChpdGVtID0+IHtcbiAgICBjb25zdCBub21lRXNjID0gZXNjSFRNTChpdGVtLm5vbWUpO1xuICAgIGNvbnN0IG5vbWVEYXRhID0gZW5jb2RlVVJJQ29tcG9uZW50KGl0ZW0ubm9tZSk7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwiY2FydC1pdGVtXCI+XG4gICAgICA8c3BhbiBjbGFzcz1cImNhcnQtaXRlbS1ub21lXCI+JHtub21lRXNjfTwvc3Bhbj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY2FydC1pdGVtLXByZWNvXCI+JHtmb3JtYXRhck1vZWRhKGl0ZW0ucHJlY28pfTwvc3Bhbj5cbiAgICAgIDxidXR0b24gY2xhc3M9XCJjYXJ0LWl0ZW0tcmVtb3ZlXCIgb25jbGljaz1cInJlbW92ZXJEb0NhcnJpbmhvKGRlY29kZVVSSUNvbXBvbmVudCgnJHtub21lRGF0YX0nKSlcIiBhcmlhLWxhYmVsPVwiUmVtb3ZlclwiPlx1RDgzRFx1REREMVx1RkUwRjwvYnV0dG9uPlxuICAgIDwvZGl2PmA7XG4gIH0pLmpvaW4oJycpICsgYDxkaXYgY2xhc3M9XCJjYXJ0LXRvdGFsXCI+PHNwYW4gY2xhc3M9XCJjYXJ0LXRvdGFsLWxhYmVsXCI+VG90YWw8L3NwYW4+PHNwYW4gY2xhc3M9XCJjYXJ0LXRvdGFsLXZhbG9yXCI+JHtmb3JtYXRhck1vZWRhKHRvdGFsKX08L3NwYW4+PC9kaXY+YDtcbiAgdG90YWxFbC50ZXh0Q29udGVudCA9IGZvcm1hdGFyTW9lZGEodG90YWwpO1xufVxuIiwgIi8vIHNyYy9tYWluLnRzIFx1MjAxNCBwb250byBkZSBlbnRyYWRhIEdlbGFtb3VyIChDbGVhbiBBcmNoaXRlY3R1cmUpXG5pbXBvcnQgeyBtb3N0cmFyVG9hc3QgfSBmcm9tICcuL3V0aWxzL3RvYXN0JztcbmltcG9ydCB7IGVzY0hUTUwgfSBmcm9tICcuL3V0aWxzL3NlY3VyaXR5JztcbmltcG9ydCB7IGFwbGljYXJNYXNjYXJhVGVsZWZvbmUgfSBmcm9tICcuL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBsb2dpblVzZUNhc2UsIGNhcnRTZXJ2aWNlLCBwZWRpZG9SZXBvc2l0b3J5LCByb2xldGFSZXBvc2l0b3J5LCBjbGllbnRlUmVwb3NpdG9yeSB9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7IGFwcFN0b3JlLCBpc0NvbnRhVGVzdGUgfSBmcm9tICcuL3N0YXRlL0FwcFN0b3JlJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4vY29yZS9sb2dnZXInO1xuaW1wb3J0IHsgQ2xpZW50ZSBhcyBDbGllbnRlRW50aXR5IH0gZnJvbSAnLi9kb21haW4vY2xpZW50ZSc7XG5pbXBvcnQgeyBnZXRTZW1hbmFBdHVhbCB9IGZyb20gJy4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7XG4gIGdldFByZW1pb3MsIGdldFByZW1pb3NQYWRyYW8sIHNldFByZW1pb3MsXG4gIGdldFBhcnRpY2lwYWNhb0lkLCBzZXRQYXJ0aWNpcGFjYW9JZCxcbiAgY2FycmVnYXJDb25maWcgYXMgY2FycmVnYXJDb25maWdSb2xldGEsXG4gIHZlcmlmaWNhclN0YXR1cyBhcyB2ZXJpZmljYXJTdGF0dXNSb2xldGEsXG4gIGdpcmFyIGFzIGdpcmFyUm9sZXRhRm4sXG4gIHNhbHZhclZlbmNlZG9yLFxuICBkZXNlbmhhclJvbGV0YVxufSBmcm9tICcuL21vZHVsZXMvcm9sZXRhJztcbmltcG9ydCB7IGlzQm9sb0Zvcm1hLCByZW5kZXJpemFyTGlzdGEgfSBmcm9tICcuL21vZHVsZXMvY2FydCc7XG5pbXBvcnQgdHlwZSB7IENsaWVudGUsIFBhcnRpY2lwYWNhbyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgU1VQQUJBU0VfVVJMLCBTVVBBQkFTRV9BTk9OIH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQnO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ21haW4nKTtcblxuLy8gPT09PT0gQ09OU1RBTlRFUyA9PT09PVxuY29uc3QgV0FfTlVNQkVSID0gYXRvYignTlRVeE1UazBNRGMzTWpjMU1BPT0nKTtcbmNvbnN0IEVER0VfVVJMID0gYCR7U1VQQUJBU0VfVVJMfS9mdW5jdGlvbnMvdjFgO1xuXG4vLyA9PT09PSBFU1RBRE8gTE9DQUwgREUgVUkgKG5cdTAwRTNvIGdsb2JhbCBcdTIwMTQgZW5jYXBzdWxhZG8pID09PT09XG5sZXQgX3BpeFBheWxvYWQgPSAnJztcbmxldCBfcGl4UG9sbFRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRJbnRlcnZhbD4gfCBudWxsID0gbnVsbDtcbmxldCBfcGl4UGVkaWRvSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xubGV0IF9waXhNc2dXQSA9ICcnO1xubGV0IF9waXhUb3RhbCA9IDA7XG5sZXQgX3BpeE5vbWUgPSAnJztcbmxldCBfcGl4SXRlbnM6IEFycmF5PHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyIH0+ID0gW107XG5sZXQgX3BpeEVuZGVyZWNvID0gJyc7XG5sZXQgX2NhcmRUaXBvID0gJ2NyZWRpdG8nO1xuXG5sZXQgX3ZlcmlmaWNhbmRvID0gZmFsc2U7XG5sZXQgX2NhZGFzdHJhbmRvID0gZmFsc2U7XG5cbi8vIEhlbHBlcjogbFx1MDBFQSBjbGllbnRlIGF0dWFsIGRvIHN0b3JlXG5mdW5jdGlvbiBnZXRDbGllbnRlQXR1YWwoKTogQ2xpZW50ZSB8IG51bGwge1xuICByZXR1cm4gYXBwU3RvcmUuZ2V0U3RhdGUoKS5jbGllbnRlIGFzIENsaWVudGUgfCBudWxsO1xufVxuXG4vLyA9PT09PSBGSUxUUk9TID09PT09XG5mdW5jdGlvbiBmaWx0cmFyKGNhdDogc3RyaW5nLCBidG46IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5maWx0cm8tYnRuJykuZm9yRWFjaChiID0+IGIuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJykpO1xuICBidG4uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcm9kLWNhcmQnKS5mb3JFYWNoKGNhcmQgPT4ge1xuICAgIGNvbnN0IGVsID0gY2FyZCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAoY2F0ID09PSAndG9kb3MnIHx8IChlbC5kYXRhc2V0WydjYXQnXSA9PT0gY2F0KSlcbiAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xuICAgIGVsc2VcbiAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xuICB9KTtcbn1cblxuLy8gPT09PT0gQ0FSUklOSE8gPT09PT1cbmZ1bmN0aW9uIGF0dWFsaXphckZhYigpOiB2b2lkIHtcbiAgY29uc3QgZmFiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhcnRGYWInKTtcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FydEJhZGdlJyk7XG4gIGNvbnN0IGNvdW50ID0gY2FydFNlcnZpY2UuZ2V0Q291bnQoKTtcbiAgaWYgKGJhZGdlKSBiYWRnZS50ZXh0Q29udGVudCA9IFN0cmluZyhjb3VudCk7XG4gIGlmIChmYWIpIHtcbiAgICBpZiAoY291bnQgPiAwKSBmYWIuY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgICBlbHNlIHsgZmFiLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7IGZlY2hhck1vZGFsKCk7IH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwZWRpclByb2R1dG8oYm90YW86IEhUTUxFbGVtZW50LCBub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgY2FyZCA9IGJvdGFvLmNsb3Nlc3QoJy5wcm9kLWNhcmQnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHtcbiAgICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gICAgY2FyZD8uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKTtcbiAgICBhdHVhbGl6YXJGYWIoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcbiAgY2FyZD8uY2xhc3NMaXN0LmFkZCgnc2VsZWNpb25hZG8nKTtcbiAgYXR1YWxpemFyRmFiKCk7XG4gIGFicmlyRGlhbG9nKG5vbWUsIHByZWNvKTtcbn1cblxuZnVuY3Rpb24gYWJyaXJEaWFsb2cobm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ1Byb2R1dG8nKTtcbiAgaWYgKGVsKSBlbC5pbm5lckhUTUwgPSAnPHN0cm9uZz4nICsgZXNjSFRNTChub21lKSArICc8L3N0cm9uZz4gXHUyMDE0IFIkICcgKyBOdW1iZXIocHJlY28pLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyRGlhbG9nKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhckRpYWxvZ0JhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAnZGlhbG9nQmFja2Ryb3AnKSBmZWNoYXJEaWFsb2coKTtcbn1cblxuZnVuY3Rpb24gaXJQYXJhRmluYWxpemFyKCk6IHZvaWQge1xuICBmZWNoYXJEaWFsb2coKTtcbiAgYWJyaXJNb2RhbCgpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJpemFyQ2FycmluaG8oKTogdm9pZCB7XG4gIHJlbmRlcml6YXJMaXN0YSgnbGlzdGFDYXJyaW5obycsICd0b3RhbFJvZGFwZScsICdiYWRnZUNvdW50Jyk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcml6YXJOb3RpY2VFbmNvbWVuZGEoKTogdm9pZCB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGljZUVuY29tZW5kYScpO1xuICBpZiAoIWVsKSByZXR1cm47XG4gIGNvbnN0IGl0ZW5zID0gY2FydFNlcnZpY2UuZ2V0SXRlbXMoKTtcbiAgY29uc3QgdGVtRm9ybWEgPSBpdGVucy5zb21lKGkgPT4gaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGNvbnN0IHRlbU91dHJvcyA9IGl0ZW5zLnNvbWUoaSA9PiAhaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGlmICh0ZW1Gb3JtYSAmJiB0ZW1PdXRyb3MpIHtcbiAgICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cIm5vdGljZS1taXN0b1wiPjxzcGFuPlx1MjZBMFx1RkUwRjwvc3Bhbj48c3Bhbj48c3Ryb25nPkF0ZW5cdTAwRTdcdTAwRTNvOjwvc3Ryb25nPiBWb2NcdTAwRUEgbWlzdHVyb3UgQm9sb3MgbmEgRm9ybWEgKGZlaXRvcyBzb2IgZW5jb21lbmRhKSBjb20gb3V0cm9zIHByb2R1dG9zLiBDb25zaWRlcmUgcGVkaWRvcyBzZXBhcmFkb3MgcGFyYSBnYXJhbnRpciBvIHByYXpvITwvc3Bhbj48L2Rpdj4nO1xuICB9IGVsc2UgaWYgKHRlbUZvcm1hKSB7XG4gICAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJub3RpY2UtZW5jb21lbmRhXCI+PHNwYW4gY2xhc3M9XCJub3RpY2UtZW5jb21lbmRhLWljb25cIj5cdTIzRjA8L3NwYW4+PHNwYW4+PHN0cm9uZz5Cb2xvIG5hIEZvcm1hIFx1MjAxNCBTb2IgZW5jb21lbmRhITwvc3Ryb25nPjxicj5Fc3NlcyBib2xvcyBzXHUwMEUzbyBwcmVwYXJhZG9zIGVzcGVjaWFsbWVudGUgcGFyYSB2b2NcdTAwRUEuIFByYXpvIGRlIDxzdHJvbmc+NSBob3JhcyBhIDEgZGlhIFx1MDBGQXRpbDwvc3Ryb25nPiBhcFx1MDBGM3MgY29uZmlybWFcdTAwRTdcdTAwRTNvLjwvc3Bhbj48L2Rpdj4nO1xuICB9IGVsc2Uge1xuICAgIGVsLmlubmVySFRNTCA9ICcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFicmlyTW9kYWwoKTogdm9pZCB7XG4gIHJlbmRlcml6YXJDYXJyaW5obygpO1xuICByZW5kZXJpemFyTm90aWNlRW5jb21lbmRhKCk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLWFiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJNb2RhbCgpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhck1vZGFsQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdtb2RhbEJhY2tkcm9wJykgZmVjaGFyTW9kYWwoKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlckRvQ2FycmluaG8obm9tZTogc3RyaW5nKTogdm9pZCB7XG4gIGlmICghY2FydFNlcnZpY2UuaGFzKG5vbWUpKSByZXR1cm47XG4gIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZC5zZWxlY2lvbmFkbycpLmZvckVhY2goY2FyZCA9PiB7XG4gICAgY29uc3Qgbm9tZUVsID0gY2FyZC5xdWVyeVNlbGVjdG9yKCcucHJvZC1ub21lJyk7XG4gICAgaWYgKG5vbWVFbCAmJiBub21lRWwudGV4dENvbnRlbnQ/LnRyaW0oKSA9PT0gbm9tZSkgY2FyZC5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpO1xuICB9KTtcbiAgcmVuZGVyaXphckNhcnJpbmhvKCk7XG4gIGF0dWFsaXphckZhYigpO1xufVxuXG5mdW5jdGlvbiBzZWxlY2lvbmFyUGFnYW1lbnRvKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGFnYW1lbnRvLW9wdCcpLmZvckVhY2gobyA9PiBvLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xuICBlbC5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBjb25zdCB0aXBvID0gKGVsIGFzIEhUTUxFbGVtZW50ICYgeyBkYXRhc2V0OiBET01TdHJpbmdNYXAgfSkuZGF0YXNldFsncGFnJ10gPz8gJyc7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGFnYW1lbnRvU2VsZWNpb25hZG86IHRpcG8gfSk7XG59XG5cbmZ1bmN0aW9uIGxpbXBhckNhcnJpbmhvKCk6IHZvaWQge1xuICBjYXJ0U2VydmljZS5jbGVhcigpO1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiAnJyB9KTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2FtZW50by1vcHQuYXRpdm8nKS5mb3JFYWNoKG8gPT4gby5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcbiAgY29uc3Qgb2JzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wT2JzJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGw7XG4gIGlmIChvYnNFbCkgb2JzRWwudmFsdWUgPSAnJztcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZC5zZWxlY2lvbmFkbycpLmZvckVhY2goYyA9PiBjLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJykpO1xuICBhdHVhbGl6YXJGYWIoKTtcbiAgZmVjaGFyTW9kYWwoKTtcbn1cblxuLy8gPT09PT0gQk9MTyBOQSBGT1JNQSA9PT09PVxuZnVuY3Rpb24gcGVkaXJCb2xvRm9ybWEoYm90YW86IEhUTUxFbGVtZW50LCBub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgY2FyZCA9IGJvdGFvLmNsb3Nlc3QoJy5wcm9kLWNhcmQnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHtcbiAgICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gICAgY2FyZD8uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKTtcbiAgICBhdHVhbGl6YXJGYWIoKTtcbiAgICByZW5kZXJpemFyTm90aWNlRW5jb21lbmRhKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNhcnRTZXJ2aWNlLmFkZChub21lLCBwcmVjbyk7XG4gIGNhcmQ/LmNsYXNzTGlzdC5hZGQoJ3NlbGVjaW9uYWRvJyk7XG4gIGF0dWFsaXphckZhYigpO1xuICBhYnJpckRpYWxvZ0JvbG8oKTtcbn1cblxuZnVuY3Rpb24gYWJyaXJEaWFsb2dCb2xvKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQm9sb0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJEaWFsb2dCb2xvKGU/OiBFdmVudCk6IHZvaWQge1xuICBpZiAoIWUgfHwgKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ2RpYWxvZ0JvbG9CYWNrZHJvcCcpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQm9sb0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFnZW5kYXJCb2xvV2hhdHNBcHAoKTogdm9pZCB7XG4gIGNvbnN0IGl0ZW5zRm9ybWEgPSBjYXJ0U2VydmljZS5nZXRJdGVtcygpLmZpbHRlcihpID0+IGlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuICBsZXQgbGluaGFzID0gJyc7XG4gIGxldCB0b3RhbCA9IDA7XG4gIGl0ZW5zRm9ybWEuZm9yRWFjaChpID0+IHtcbiAgICBsaW5oYXMgKz0gJ1x1MjAyMiAnICsgaS5ub21lICsgJyBcdTIwMTQgUiQgJyArIGkucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKSArICdcXG4nO1xuICAgIHRvdGFsID0gTWF0aC5yb3VuZCgodG90YWwgKyBpLnByZWNvKSAqIDEwMCkgLyAxMDA7XG4gIH0pO1xuICBjb25zdCBtc2cgPSAnKlx1RDgzQ1x1REY4MiBBR0VOREFNRU5UTyAtIEJPTE8gTkEgRk9STUEgLSBHRUxBTU9VUipcXG5cXG5PbFx1MDBFMSEgR29zdGFyaWEgZGUgYWdlbmRhciBvKHMpIHNlZ3VpbnRlKHMpIGJvbG8ocyk6XFxuXFxuJyArIGxpbmhhcyArICdcXG4qXHVEODNEXHVEQ0IwIFRvdGFsOiogUiQgJyArIHRvdGFsLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJykgKyAnXFxuXFxuXHUyM0YwIFNlaSBxdWUgbyBwcmF6byBcdTAwRTkgZGUgNSBob3JhcyBhIDEgZGlhIFx1MDBGQXRpbC4gUG9yIGZhdm9yIG1lIGluZm9ybWUgYSBkYXRhIGUgaG9yXHUwMEUxcmlvIGRpc3Bvblx1MDBFRHZlaXMgcGFyYSBlbnRyZWdhLiBcdUQ4M0RcdURFMEEnO1xuICB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQobXNnKSwgJ19ibGFuaycpO1xuICBmZWNoYXJEaWFsb2dCb2xvKCk7XG59XG5cbi8vID09PT09IENBUk9VU0VMID09PT09XG5mdW5jdGlvbiBjYXJvdXNlbE5leHQoaWQ6IHN0cmluZywgZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKGUpIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGNvbnN0IGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIGlmICghYykgcmV0dXJuO1xuICBjb25zdCBpbWdzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtaW1nJyk7XG4gIGNvbnN0IGRvdHMgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1kb3QnKTtcbiAgbGV0IGN1ciA9IDA7XG4gIGltZ3MuZm9yRWFjaCgoaW1nLCBpKSA9PiB7IGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhdGl2bycpKSBjdXIgPSBpOyB9KTtcbiAgaW1nc1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBkb3RzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGNvbnN0IG5leHQgPSAoY3VyICsgMSkgJSBpbWdzLmxlbmd0aDtcbiAgaW1nc1tuZXh0XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgZG90c1tuZXh0XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbn1cblxuZnVuY3Rpb24gY2Fyb3VzZWxQcmV2KGlkOiBzdHJpbmcsIGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmIChlKSBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICBjb25zdCBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICBpZiAoIWMpIHJldHVybjtcbiAgY29uc3QgaW1ncyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWltZycpO1xuICBjb25zdCBkb3RzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtZG90Jyk7XG4gIGxldCBjdXIgPSAwO1xuICBpbWdzLmZvckVhY2goKGltZywgaSkgPT4geyBpZiAoaW1nLmNsYXNzTGlzdC5jb250YWlucygnYXRpdm8nKSkgY3VyID0gaTsgfSk7XG4gIGltZ3NbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcbiAgZG90c1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBjb25zdCBwcmV2ID0gKGN1ciAtIDEgKyBpbWdzLmxlbmd0aCkgJSBpbWdzLmxlbmd0aDtcbiAgaW1nc1twcmV2XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgZG90c1twcmV2XT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbn1cblxuLy8gPT09PT0gQ0hFQ0tPVVQgLyBQRURJRE8gPT09PT1cbmFzeW5jIGZ1bmN0aW9uIGZpbmFsaXphclBlZGlkbygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgaXRlbnMgPSBjYXJ0U2VydmljZS5nZXRJdGVtcygpO1xuICBjb25zdCB0ZW1Gb3JtYUZpbiA9IGl0ZW5zLnNvbWUoaSA9PiBpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgY29uc3QgdGVtT3V0cm9zRmluID0gaXRlbnMuc29tZShpID0+ICFpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgaWYgKHRlbUZvcm1hRmluICYmIHRlbU91dHJvc0Zpbikge1xuICAgIGlmICghY29uZmlybSgnXHUyNkEwXHVGRTBGIEF0ZW5cdTAwRTdcdTAwRTNvIVxcblxcblZvY1x1MDBFQSB0ZW0gQm9sb3MgbmEgRm9ybWEgKGZlaXRvcyBzb2IgZW5jb21lbmRhKSBtaXN0dXJhZG9zIGNvbSBvdXRyb3MgcHJvZHV0b3Mgbm8gY2FycmluaG8uXFxuXFxuQm9sb3MgbmEgRm9ybWEgcHJlY2lzYW0gZGUgcHJhem8gZGUgNWggYSAxIGRpYSBcdTAwRkF0aWwgcGFyYSBwcmVwYXJvLlxcblxcbkRlc2VqYSBwcm9zc2VndWlyIGNvbSB0b2RvcyBvcyBpdGVucyBtZXNtbyBhc3NpbT8nKSlcbiAgICAgIHJldHVybjtcbiAgfVxuICBpZiAoaXRlbnMubGVuZ3RoID09PSAwKSB7IGFsZXJ0KCdBZGljaW9uZSBwZWxvIG1lbm9zIHVtIHByb2R1dG8gYW8gY2FycmluaG8hJyk7IHJldHVybjsgfVxuXG4gIGNvbnN0IG5vbWUgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBlbmRlcmVjbyA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBvYnMgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE9icycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XG4gIGNvbnN0IHBhZ2FtZW50b1NlbGVjaW9uYWRvID0gYXBwU3RvcmUuZ2V0U3RhdGUoKS5wYWdhbWVudG9TZWxlY2lvbmFkbztcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG5cbiAgaWYgKCFub21lKSB7IGFsZXJ0KCdQb3IgZmF2b3IsIGluZm9ybWUgc2V1IG5vbWUgY29tcGxldG8uJyk7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJyk/LmZvY3VzKCk7IHJldHVybjsgfVxuICBpZiAoIWVuZGVyZWNvKSB7IGFsZXJ0KCdQb3IgZmF2b3IsIGluZm9ybWUgc2V1IGVuZGVyZVx1MDBFN28uJyk7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBFbmRlcmVjbycpPy5mb2N1cygpOyByZXR1cm47IH1cbiAgaWYgKCFwYWdhbWVudG9TZWxlY2lvbmFkbykgeyBhbGVydCgnUG9yIGZhdm9yLCBlc2NvbGhhIGEgZm9ybWEgZGUgcGFnYW1lbnRvLicpOyByZXR1cm47IH1cblxuICAvLyBSZS12ZXJpZmljYXIgcHJlXHUwMEU3b3MgZG9zIGJvdFx1MDBGNWVzIHBhcmEgZXZpdGFyIG1hbmlwdWxhXHUwMEU3XHUwMEUzbyBjbGllbnQtc2lkZVxuICBjb25zdCBwcmljZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idG4tcGVkaXInKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgY29uc3Qgb25jbGlja0F0dHIgPSBidG4uZ2V0QXR0cmlidXRlKCdvbmNsaWNrJykgPz8gJyc7XG4gICAgY29uc3QgbSA9IG9uY2xpY2tBdHRyLm1hdGNoKC9wZWRpclByb2R1dG9cXCh0aGlzLCcoLis/KScsKFxcZCsoPzpcXC5cXGQrKT8pXFwpLyk7XG4gICAgaWYgKG0pIHByaWNlTWFwLnNldChtWzFdISwgcGFyc2VGbG9hdChtWzJdISkpO1xuICB9KTtcbiAgY2FydFNlcnZpY2UucmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcCk7XG5cbiAgY29uc3QgaXRlbnNWZXJpZmljYWRvcyA9IEFycmF5LmZyb20oY2FydFNlcnZpY2UuZ2V0SXRlbXMoKSk7XG4gIGxldCB0b3RhbCA9IDA7XG4gIGxldCBsaW5oYXNJdGVucyA9ICcnO1xuICBpdGVuc1ZlcmlmaWNhZG9zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgdG90YWwgPSBNYXRoLnJvdW5kKCh0b3RhbCArIGl0ZW0ucHJlY28pICogMTAwKSAvIDEwMDtcbiAgICBsaW5oYXNJdGVucyArPSBgXHUyMDIyICR7aXRlbS5ub21lfSBcdTIwMTQgUiQgJHtpdGVtLnByZWNvLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyl9XFxuYDtcbiAgfSk7XG5cbiAgY29uc3QgbXNnID0gYCpcdUQ4M0NcdURGNzAgTk9WTyBQRURJRE8gLSBHRUxBTU9VUipcXG5cXG4qXHVEODNEXHVEQ0NCIElURU5TOipcXG4ke2xpbmhhc0l0ZW5zfVxcbipcdUQ4M0RcdURDQjAgVG90YWw6KiBSJCAke3RvdGFsLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyl9XFxuXFxuKlx1RDgzRFx1REM2NCBOb21lOiogJHtub21lfVxcbipcdUQ4M0RcdURDQ0QgRW5kZXJlXHUwMEU3bzoqICR7ZW5kZXJlY299XFxuKlx1RDgzRFx1RENCMyBQYWdhbWVudG86KiAke3BhZ2FtZW50b1NlbGVjaW9uYWRvfSR7b2JzID8gYFxcbipcdUQ4M0RcdURDREQgT2JzOiogJHtvYnN9YCA6ICcnfVxcblxcblBlZGlkbyBwZWxvIGNhcmRcdTAwRTFwaW8gb25saW5lIFx1MjcyOGA7XG5cbiAgY29uc3QgYnRuRmluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkZpbmFsaXphcicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgdHh0T3JpZyA9IGJ0bkZpbiA/IChidG5GaW4udGV4dENvbnRlbnQgPz8gJycpIDogJyc7XG4gIGlmIChidG5GaW4pIHsgYnRuRmluLmRpc2FibGVkID0gdHJ1ZTsgYnRuRmluLnRleHRDb250ZW50ID0gJ1NhbHZhbmRvIHBlZGlkby4uLic7IH1cblxuICBsZXQgX3BlZGlkb0lkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCBjdHJsID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHRpZCA9IHNldFRpbWVvdXQoKCkgPT4gY3RybC5hYm9ydCgpLCAxMF8wMDApO1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcGVkaWRvcycsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTixcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OLFxuICAgICAgICAnUHJlZmVyJzogJ3JldHVybj1oZWFkZXJzLW9ubHknXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBub21lLCBlbmRlcmVjbyxcbiAgICAgICAgcGFnYW1lbnRvOiBwYWdhbWVudG9TZWxlY2lvbmFkbyxcbiAgICAgICAgaXRlbnM6IGl0ZW5zVmVyaWZpY2Fkb3MubWFwKGkgPT4gKHsgbm9tZTogaS5ub21lLCBwcmVjbzogaS5wcmVjbyB9KSksXG4gICAgICAgIHRvdGFsLFxuICAgICAgICBzdGF0dXM6ICdhZ3VhcmRhbmRvJyxcbiAgICAgICAgb2JzZXJ2YWNhbzogb2JzIHx8IG51bGwsXG4gICAgICAgIGNsaWVudGVfaWQ6IGNsaWVudGVBdHVhbCA/IGNsaWVudGVBdHVhbC5pZCA6IG51bGwsXG4gICAgICAgIHRlbGVmb25lOiBjbGllbnRlQXR1YWwgPyBjbGllbnRlQXR1YWwudGVsZWZvbmUgOiBudWxsXG4gICAgICB9KSxcbiAgICAgIHNpZ25hbDogY3RybC5zaWduYWxcbiAgICB9KTtcbiAgICBjbGVhclRpbWVvdXQodGlkKTtcbiAgICBpZiAoIXIub2spIHtcbiAgICAgIGNvbnN0IGVyclR4dCA9IGF3YWl0IHIudGV4dCgpLmNhdGNoKCgpID0+ICcnKTtcbiAgICAgIGxvZy5lcnJvcignSU5TRVJUIHBlZGlkbyBmYWxob3UnLCB7IHN0YXR1czogci5zdGF0dXMsIGJvZHk6IGVyclR4dC5zbGljZSgwLCAxMjApIH0pO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdIVFRQICcgKyByLnN0YXR1cyArICcgXHUyMDE0ICcgKyBlcnJUeHQuc2xpY2UoMCwgMTIwKSk7XG4gICAgfVxuICAgIGNvbnN0IGxvYyA9IHIuaGVhZGVycy5nZXQoJ0xvY2F0aW9uJykgPz8gJyc7XG4gICAgY29uc3QgaWRNYXRjaCA9IGxvYy5tYXRjaCgvaWQ9ZXFcXC4oXFxkKykvKTtcbiAgICBpZiAoaWRNYXRjaCkge1xuICAgICAgX3BlZGlkb0lkID0gcGFyc2VJbnQoaWRNYXRjaFsxXSEsIDEwKTtcbiAgICAgIGlmIChidG5GaW4pIGJ0bkZpbi50ZXh0Q29udGVudCA9ICdcdTI3MDUgUGVkaWRvIHJlZ2lzdHJhZG8hJztcbiAgICAgIGlmIChjbGllbnRlQXR1YWwgJiYgY2xpZW50ZUF0dWFsLmlkKSB7XG4gICAgICAgIGNsaWVudGVSZXBvc2l0b3J5LnVwZGF0ZUVuZGVyZWNvKGNsaWVudGVBdHVhbC5pZCwgZW5kZXJlY28pXG4gICAgICAgICAgLmNhdGNoKChlOiB1bmtub3duKSA9PiBsb2cud2FybignTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgc2FsdmFyIGVuZGVyZVx1MDBFN28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChidG5GaW4pIGJ0bkZpbi50ZXh0Q29udGVudCA9ICdcdTI2QTBcdUZFMEYgRXJybyAtIHBlZGlkbyBzXHUwMEYzIG5vIFdoYXRzQXBwJztcbiAgICBsb2cud2FybignRXJybyBhbyBzYWx2YXIgbm8gYmFuY28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7XG4gIH1cblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBpZiAoYnRuRmluKSB7IGJ0bkZpbi5kaXNhYmxlZCA9IGZhbHNlOyBidG5GaW4udGV4dENvbnRlbnQgPSB0eHRPcmlnOyB9XG4gIH0sIDMwMDApO1xuXG4gIGlmICgocGFnYW1lbnRvU2VsZWNpb25hZG8gPT09ICdQaXgnIHx8IHBhZ2FtZW50b1NlbGVjaW9uYWRvID09PSAnQ2FydFx1MDBFM28nKSAmJiBfcGVkaWRvSWQpIHtcbiAgICBjb25zdCBiaWxsaW5nVHlwZSA9IHBhZ2FtZW50b1NlbGVjaW9uYWRvID09PSAnQ2FydFx1MDBFM28nID8gJ0NSRURJVF9DQVJEJyA6ICdQSVgnO1xuICAgIGluaWNpYXJGbHV4b1BpeChfcGVkaWRvSWQsIHRvdGFsLCBub21lLCBtc2csIGJpbGxpbmdUeXBlLCBpdGVuc1ZlcmlmaWNhZG9zLCBlbmRlcmVjbyk7XG4gIH0gZWxzZSB7XG4gICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG1zZyksICdfYmxhbmsnKTtcbiAgICBpZiAoX3BlZGlkb0lkKSB7XG4gICAgICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBlZGlkb0lkUGVuZGVudGU6IF9wZWRpZG9JZCB9KTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3YUNvbmZpcm1CYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY29uZmlybWFyRW52aW9XQSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgaWQgPSBhcHBTdG9yZS5nZXRTdGF0ZSgpLnBlZGlkb0lkUGVuZGVudGU7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy53YUNvbmZpcm0tc2ltJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFpZCkgeyBmZWNoYXJDb25maXJtV0EoKTsgcmV0dXJuOyB9XG4gIGlmICghY2xpZW50ZUF0dWFsIHx8ICFjbGllbnRlQXR1YWwuaWQpIHsgZmVjaGFyQ29uZmlybVdBKCk7IHJldHVybjsgfVxuICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdDb25maXJtYW5kby4uLic7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IH1cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGVkaWRvUmVwb3NpdG9yeS51cGRhdGVTdGF0dXMoaWQsIGNsaWVudGVBdHVhbC5pZCwgJ2NvbmZpcm1hZG8nKTtcbiAgaWYgKHJlc3VsdC5vaykge1xuICAgIGlmIChidG4pIGJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGODkgUGVkaWRvIGNvbmZpcm1hZG8hJztcbiAgICBzZXRUaW1lb3V0KCgpID0+IHsgZmVjaGFyQ29uZmlybVdBKCk7IGxpbXBhckNhcnJpbmhvKCk7IH0sIDE4MDApO1xuICB9IGVsc2Uge1xuICAgIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ1x1MjcwNSBTaW0sIG1lbnNhZ2VtIGVudmlhZGEhJzsgYnRuLmRpc2FibGVkID0gZmFsc2U7IH1cbiAgICBsb2cud2FybignRXJybyBhbyBjb25maXJtYXIgcGVkaWRvJywgeyBlcnJvcjogcmVzdWx0LmVycm9yLm1lc3NhZ2UgfSk7XG4gICAgZmVjaGFyQ29uZmlybVdBKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmVjaGFyQ29uZmlybVdBKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2FDb25maXJtQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGVkaWRvSWRQZW5kZW50ZTogbnVsbCB9KTtcbn1cblxuLy8gPT09PT0gRkxVWE8gUElYID09PT09XG5hc3luYyBmdW5jdGlvbiBpbmljaWFyRmx1eG9QaXgoXG4gIHBlZGlkb0lkOiBudW1iZXIsXG4gIHRvdGFsOiBudW1iZXIsXG4gIG5vbWU6IHN0cmluZyxcbiAgbXNnV0E6IHN0cmluZyxcbiAgYmlsbGluZ1R5cGU6IHN0cmluZyxcbiAgaXRlbnM6IEFycmF5PHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyIH0+LFxuICBlbmRlcmVjbzogc3RyaW5nXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgX3BpeFBlZGlkb0lkID0gcGVkaWRvSWQ7XG4gIF9waXhNc2dXQSA9IG1zZ1dBO1xuICBfcGl4VG90YWwgPSB0b3RhbDtcbiAgX3BpeE5vbWUgPSBub21lO1xuICBfcGl4SXRlbnMgPSBpdGVucyB8fCBbXTtcbiAgX3BpeEVuZGVyZWNvID0gZW5kZXJlY28gfHwgJyc7XG4gIGNvbnN0IGlzUGl4ID0gYmlsbGluZ1R5cGUgIT09ICdDUkVESVRfQ0FSRCc7XG5cbiAgY29uc3QgcGl4VGl0dWxvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeFRpdHVsbycpO1xuICBjb25zdCBwaXhTdWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4U3ViJyk7XG4gIGNvbnN0IHBpeFZhbG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeFZhbG9yJyk7XG4gIGNvbnN0IHNlY2FvUGl4ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlY2FvUGl4Jyk7XG4gIGNvbnN0IHNlY2FvQ2FydGFvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlY2FvQ2FydGFvJyk7XG4gIGNvbnN0IHBpeEphUGFndWVpQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeEphUGFndWVpQnRuJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBjb25zdCBwaXhTdGF0dXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4U3RhdHVzJyk7XG4gIGNvbnN0IHBpeENvZGVCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4Q29kZUJveCcpO1xuICBjb25zdCBwaXhRckltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhRckltZycpIGFzIEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsO1xuXG4gIGlmIChwaXhUaXR1bG8pIHBpeFRpdHVsby50ZXh0Q29udGVudCA9IGlzUGl4ID8gJ1x1RDgzRFx1RENBMCBQYWd1ZSB2aWEgUGl4JyA6ICdcdUQ4M0RcdURDQjMgUGFndWUgY29tIENhcnRcdTAwRTNvJztcbiAgaWYgKHBpeFN1YikgcGl4U3ViLnRleHRDb250ZW50ID0gaXNQaXggPyAnQ29waWUgbyBjXHUwMEYzZGlnbyBvdSBlc2NhbmVpZSBvIFFSIENvZGUnIDogJ0NyXHUwMEU5ZGl0byBvdSBkXHUwMEU5Yml0byBcdTIwMTQgcHJlZW5jaGEgb3MgZGFkb3MgYWJhaXhvJztcbiAgaWYgKHBpeFZhbG9yKSBwaXhWYWxvci50ZXh0Q29udGVudCA9ICdSJCAnICsgdG90YWwudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcbiAgaWYgKHNlY2FvUGl4KSBzZWNhb1BpeC5zdHlsZS5kaXNwbGF5ID0gaXNQaXggPyAnYmxvY2snIDogJ25vbmUnO1xuICBpZiAoc2VjYW9DYXJ0YW8pIHNlY2FvQ2FydGFvLnN0eWxlLmRpc3BsYXkgPSBpc1BpeCA/ICdub25lJyA6ICdibG9jayc7XG4gIGlmIChwaXhKYVBhZ3VlaUJ0bikgcGl4SmFQYWd1ZWlCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgaWYgKHBpeFN0YXR1cykgeyBwaXhTdGF0dXMudGV4dENvbnRlbnQgPSBpc1BpeCA/ICdcdTIzRjMgR2VyYW5kbyBRUiBDb2RlLi4uJyA6ICcnOyBwaXhTdGF0dXMuY2xhc3NOYW1lID0gJ3BpeC1zdGF0dXMnICsgKGlzUGl4ID8gJyBwaXgtYWd1YXJkYW5kbycgOiAnJyk7IH1cbiAgaWYgKHBpeENvZGVCb3gpIHBpeENvZGVCb3gudGV4dENvbnRlbnQgPSAnR2VyYW5kbyBjXHUwMEYzZGlnby4uLic7XG4gIGlmIChwaXhRckltZykgcGl4UXJJbWcuc3JjID0gJyc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhCYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgZmVjaGFyTW9kYWwoKTtcblxuICBpZiAoIWlzUGl4KSByZXR1cm47XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goRURHRV9VUkwgKyAnL2NyaWFyLXBpeCcsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBlZGlkb19pZDogcGVkaWRvSWQsIHRvdGFsLCBub21lLCBiaWxsaW5nX3R5cGU6ICdQSVgnIH0pLFxuICAgIH0pO1xuICAgIGlmICghcmVzcC5vaykgdGhyb3cgbmV3IEVycm9yKCdIVFRQICcgKyByZXNwLnN0YXR1cyk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3AuanNvbigpIGFzIHsgZXJyb3I/OiBzdHJpbmc7IHFyX2NvZGU/OiBzdHJpbmc7IHFyX2NvZGVfaW1hZ2U/OiBzdHJpbmcgfTtcbiAgICBpZiAoZGF0YS5lcnJvcikgdGhyb3cgbmV3IEVycm9yKGRhdGEuZXJyb3IpO1xuICAgIF9waXhQYXlsb2FkID0gZGF0YS5xcl9jb2RlIHx8ICcnO1xuICAgIGlmIChwaXhDb2RlQm94KSBwaXhDb2RlQm94LnRleHRDb250ZW50ID0gX3BpeFBheWxvYWQgfHwgJ0NcdTAwRjNkaWdvIGluZGlzcG9uXHUwMEVEdmVsJztcbiAgICBpZiAoZGF0YS5xcl9jb2RlX2ltYWdlICYmIHBpeFFySW1nKSBwaXhRckltZy5zcmMgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LCcgKyBkYXRhLnFyX2NvZGVfaW1hZ2U7XG4gICAgaWYgKHBpeFN0YXR1cykgeyBwaXhTdGF0dXMudGV4dENvbnRlbnQgPSAnXHUyM0YzIEFndWFyZGFuZG8gcGFnYW1lbnRvLi4uJzsgcGl4U3RhdHVzLmNsYXNzTmFtZSA9ICdwaXgtc3RhdHVzIHBpeC1hZ3VhcmRhbmRvJzsgfVxuICAgIGlmIChwaXhKYVBhZ3VlaUJ0bikgcGl4SmFQYWd1ZWlCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBfcGl4UG9sbFRpbWVyID0gc2V0SW50ZXJ2YWwodmVyaWZpY2FyUGFnYW1lbnRvUGl4LCA0MDAwKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZy53YXJuKCdFcnJvIGFvIGNyaWFyIFBpeCcsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTtcbiAgICBpZiAocGl4Q29kZUJveCkgcGl4Q29kZUJveC50ZXh0Q29udGVudCA9ICdFcnJvIGFvIGdlcmFyIGNcdTAwRjNkaWdvLic7XG4gICAgaWYgKHBpeFN0YXR1cykgeyBwaXhTdGF0dXMudGV4dENvbnRlbnQgPSAnXHUyNkEwXHVGRTBGIEVycm8gYW8gZ2VyYXIgUVIgQ29kZS4gVGVudGUgb3V0cmEgZm9ybWEgZGUgcGFnYW1lbnRvLic7IHBpeFN0YXR1cy5jbGFzc05hbWUgPSAncGl4LXN0YXR1cyc7IH1cbiAgICBpZiAocGl4SmFQYWd1ZWlCdG4pIHBpeEphUGFndWVpQnRuLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNlbGVjaW9uYXJUaXBvQ2FydGFvKHRpcG86IHN0cmluZyk6IHZvaWQge1xuICBfY2FyZFRpcG8gPSB0aXBvO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuQ3JlZGl0bycpPy5jbGFzc0xpc3QudG9nZ2xlKCdhdGl2bycsIHRpcG8gPT09ICdjcmVkaXRvJyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5EZWJpdG8nKT8uY2xhc3NMaXN0LnRvZ2dsZSgnYXRpdm8nLCB0aXBvID09PSAnZGViaXRvJyk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdGFyQ2FydGFvKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGxldCB2ID0gZWwudmFsdWUucmVwbGFjZSgvXFxEL2csICcnKS5zdWJzdHJpbmcoMCwgMTYpO1xuICBlbC52YWx1ZSA9IHYucmVwbGFjZSgvKC57NH0pKD89LikvZywgJyQxICcpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRhckNwZihlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICBsZXQgdiA9IGVsLnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJykuc3Vic3RyaW5nKDAsIDExKTtcbiAgdiA9IHYucmVwbGFjZSgvKFxcZHszfSkoXFxkKS8sICckMS4kMicpO1xuICB2ID0gdi5yZXBsYWNlKC8oXFxkezN9KVxcLihcXGR7M30pKFxcZCkvLCAnJDEuJDIuJDMnKTtcbiAgdiA9IHYucmVwbGFjZSgvKFxcZHszfSlcXC4oXFxkezN9KVxcLihcXGR7M30pKFxcZHsxLDJ9KSQvLCAnJDEuJDIuJDMtJDQnKTtcbiAgZWwudmFsdWUgPSB2O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRhclZhbGlkYWRlKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGxldCB2ID0gZWwudmFsdWUucmVwbGFjZSgvXFxEL2csICcnKS5zdWJzdHJpbmcoMCwgNCk7XG4gIGlmICh2Lmxlbmd0aCA+PSAzKSB2ID0gdi5zdWJzdHJpbmcoMCwgMikgKyAnLycgKyB2LnN1YnN0cmluZygyKTtcbiAgZWwudmFsdWUgPSB2O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRhckNlcChlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICBsZXQgdiA9IGVsLnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJykuc3Vic3RyaW5nKDAsIDgpO1xuICBpZiAodi5sZW5ndGggPiA1KSB2ID0gdi5zdWJzdHJpbmcoMCwgNSkgKyAnLScgKyB2LnN1YnN0cmluZyg1KTtcbiAgZWwudmFsdWUgPSB2O1xufVxuXG5hc3luYyBmdW5jdGlvbiBwYWdhckNhcnRhbygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgbW9zdHJhclRvYXN0KCdcdUQ4M0RcdURDQjMgUGFnYW1lbnRvIHBvciBjYXJ0XHUwMEUzbyBlbSBicmV2ZSEgVXNlIG8gUGl4IHBvciBlbnF1YW50by4nLCAnaW5mbycpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJQYWdhbWVudG9QaXgoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghX3BpeFBlZGlkb0lkKSByZXR1cm47XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBlZGlkb1JlcG9zaXRvcnkuZmluZEJ5SWQoX3BpeFBlZGlkb0lkKTtcbiAgaWYgKHJlc3VsdC5vayAmJiByZXN1bHQudmFsdWUpIHtcbiAgICBjb25zdCBzdGF0dXNQYWcgPSByZXN1bHQudmFsdWUuc3RhdHVzUGFnYW1lbnRvO1xuICAgIGlmIChzdGF0dXNQYWcgPT09ICdwYWdvJykge1xuICAgICAgaWYgKF9waXhQb2xsVGltZXIpIHsgY2xlYXJJbnRlcnZhbChfcGl4UG9sbFRpbWVyKTsgX3BpeFBvbGxUaW1lciA9IG51bGw7IH1cbiAgICAgIG1vc3RyYXJSZWNpYm9QaXgoKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbG9nLndhcm4oJ0Vycm8gYW8gdmVyaWZpY2FyIHBhZ2FtZW50bycsIHsgZXJyb3I6IHJlc3VsdC5vayA/ICdub3QgZm91bmQnIDogcmVzdWx0LmVycm9yLm1lc3NhZ2UgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbW9zdHJhclJlY2lib1BpeCgpOiB2b2lkIHtcbiAgY29uc3QgbGluaGFzSXRlbnMgPSBfcGl4SXRlbnMubWFwKGkgPT5cbiAgICAnPGRpdiBjbGFzcz1cInJlY2liby1pdGVtXCI+PHNwYW4+JyArIGVzY0hUTUwoaS5ub21lKSArICc8L3NwYW4+PHNwYW4+UiQgJyArIE51bWJlcihpLnByZWNvKS50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpICsgJzwvc3Bhbj48L2Rpdj4nXG4gICkuam9pbignJyk7XG4gIGNvbnN0IHBpeEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5waXgtYm94Jyk7XG4gIGlmIChwaXhCb3gpIHtcbiAgICBwaXhCb3guaW5uZXJIVE1MID1cbiAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjUycHg7bWFyZ2luLWJvdHRvbTo4cHhcIj5cdTI3MDU8L2Rpdj4nICtcbiAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjIwcHg7Zm9udC13ZWlnaHQ6NzAwO2NvbG9yOiMxNjY1MzQ7bWFyZ2luLWJvdHRvbTo0cHhcIj5QYWdhbWVudG8gcmVjZWJpZG8hPC9kaXY+JyArXG4gICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxM3B4O2NvbG9yOiM2QjVCNTI7bWFyZ2luLWJvdHRvbToxNnB4XCI+U2V1IHBlZGlkbyBmb2kgY29uZmlybWFkbyBjb20gc3VjZXNzbzwvZGl2PicgK1xuICAgICAgJzxkaXYgc3R5bGU9XCJiYWNrZ3JvdW5kOiNmMGZkZjQ7Ym9yZGVyOjEuNXB4IHNvbGlkICNiYmY3ZDA7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6MTRweDt0ZXh0LWFsaWduOmxlZnQ7bWFyZ2luLWJvdHRvbToxNHB4XCI+JyArXG4gICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxMXB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojMTY2NTM0O21hcmdpbi1ib3R0b206OHB4O3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtsZXR0ZXItc3BhY2luZzouNXB4XCI+XHVEODNEXHVEQ0NCIFJlc3VtbyBkbyBwZWRpZG88L2Rpdj4nICtcbiAgICAgIGxpbmhhc0l0ZW5zICtcbiAgICAgICc8ZGl2IHN0eWxlPVwiYm9yZGVyLXRvcDoxcHggc29saWQgI2JiZjdkMDttYXJnaW4tdG9wOjhweDtwYWRkaW5nLXRvcDo4cHg7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2ZvbnQtd2VpZ2h0OjcwMDtmb250LXNpemU6MTRweFwiPicgK1xuICAgICAgJzxzcGFuPlRvdGFsPC9zcGFuPjxzcGFuIHN0eWxlPVwiY29sb3I6I0U4NTI4QVwiPlIkICcgKyBOdW1iZXIoX3BpeFRvdGFsKS50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpICsgJzwvc3Bhbj4nICtcbiAgICAgICc8L2Rpdj4nICtcbiAgICAgICc8ZGl2IHN0eWxlPVwibWFyZ2luLXRvcDo4cHg7Zm9udC1zaXplOjExcHg7Y29sb3I6IzRiN2M1ZVwiPlx1RDgzRFx1RENDRCAnICsgZXNjSFRNTChfcGl4RW5kZXJlY28pICsgJzwvZGl2PicgK1xuICAgICAgJzwvZGl2PicgK1xuICAgICAgJzxidXR0b24gb25jbGljaz1cImZlY2hhclJlY2lib1BpeCgpXCIgc3R5bGU9XCJ3aWR0aDoxMDAlO3BhZGRpbmc6MTNweDtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxMzVkZWcsI0U4NTI4QSwjQzIzQTZFKTtjb2xvcjojZmZmO2ZvbnQtd2VpZ2h0OjcwMDtmb250LXNpemU6MTVweDtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjEycHg7Y3Vyc29yOnBvaW50ZXI7Zm9udC1mYW1pbHk6aW5oZXJpdFwiPlx1RDgzRFx1RENBQyBWZXIgcGVkaWRvIG5vIFdoYXRzQXBwPC9idXR0b24+JztcbiAgfVxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQoX3BpeE1zZ1dBKSwgJ19ibGFuaycpO1xuICB9LCAyMDAwKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUmVjaWJvUGl4KCk6IHZvaWQge1xuICB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQoX3BpeE1zZ1dBKSwgJ19ibGFuaycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4QmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIGxpbXBhckNhcnJpbmhvKCk7XG4gIF9waXhQZWRpZG9JZCA9IG51bGw7IF9waXhQYXlsb2FkID0gJyc7IF9waXhNc2dXQSA9ICcnOyBfcGl4VG90YWwgPSAwOyBfcGl4Tm9tZSA9ICcnO1xuICBfcGl4SXRlbnMgPSBbXTsgX3BpeEVuZGVyZWNvID0gJyc7XG59XG5cbmZ1bmN0aW9uIGNvcGlhclBpeCgpOiB2b2lkIHtcbiAgaWYgKCFfcGl4UGF5bG9hZCkgcmV0dXJuO1xuICBpZiAobmF2aWdhdG9yLmNsaXBib2FyZCkge1xuICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KF9waXhQYXlsb2FkKS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5waXgtY29weS1idG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gICAgICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MDUgQ1x1MDBGM2RpZ28gY29waWFkbyEnOyBzZXRUaW1lb3V0KCgpID0+IHsgYnRuLnRleHRDb250ZW50ID0gJ1x1RDgzRFx1RENDQiBDb3BpYXIgY2hhdmUgUGl4JzsgfSwgMjUwMCk7IH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgdGEudmFsdWUgPSBfcGl4UGF5bG9hZDtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRhKTtcbiAgICB0YS5zZWxlY3QoKTtcbiAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGEpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhbmNlbGFyUGl4KCk6IHZvaWQge1xuICBpZiAoX3BpeFBvbGxUaW1lcikgeyBjbGVhckludGVydmFsKF9waXhQb2xsVGltZXIpOyBfcGl4UG9sbFRpbWVyID0gbnVsbDsgfVxuICBjb25zdCBlc3RhQWJlcnRvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5jb250YWlucygnYWJlcnRvJykgPz8gZmFsc2U7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgX3BpeFBlZGlkb0lkID0gbnVsbDsgX3BpeFBheWxvYWQgPSAnJzsgX3BpeE1zZ1dBID0gJyc7IF9waXhUb3RhbCA9IDA7IF9waXhOb21lID0gJyc7XG4gIF9waXhJdGVucyA9IFtdOyBfcGl4RW5kZXJlY28gPSAnJztcbiAgaWYgKGVzdGFBYmVydG8pIGFicmlyTW9kYWwoKTtcbn1cblxuZnVuY3Rpb24gcGl4SmFQYWd1ZWkoKTogdm9pZCB7XG4gIGNhbmNlbGFyUGl4KCk7XG4gIGZpbmFsaXphclBlZGlkb1doYXRzQXBwKCk7XG59XG5cbmZ1bmN0aW9uIGZpbmFsaXphclBlZGlkb1doYXRzQXBwKCk6IHZvaWQge1xuICBjb25zdCBpdGVucyA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCk7XG4gIGlmIChpdGVucy5sZW5ndGggPT09IDApIHsgbW9zdHJhclRvYXN0KCdDYXJyaW5obyB2YXppbycsICdlcnJvJyk7IHJldHVybjsgfVxuICBjb25zdCBub21lID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJykgYXMgSFRNTElucHV0RWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3QgZW5kZXJlY28gPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3QgdG90YWwgPSBBcnJheS5mcm9tKGl0ZW5zKS5yZWR1Y2UoKHMsIGkpID0+IHMgKyBpLnByZWNvLCAwKTtcbiAgY29uc3QgbGluaGFzID0gQXJyYXkuZnJvbShpdGVucykubWFwKGkgPT4gYFx1MjVCOCAke2kubm9tZX0gXHUyMDE0IFIkICR7aS5wcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfSBgKS5qb2luKCdcXG4nKTtcbiAgY29uc3QgbXNnID0gYFx1RDgzRFx1REVEMiAqUEVESURPIEdFTEFNT1VSKiAoUGl4IGVudmlhZG8gbWFudWFsbWVudGUpXFxuXFxuJHtsaW5oYXN9XFxuXFxuKlRvdGFsOiBSJCAke3RvdGFsLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyl9Klxcblxcblx1RDgzRFx1REM2NCAke25vbWV9XFxuXHVEODNEXHVEQ0NEICR7ZW5kZXJlY299XFxuXFxuX0NvbmZpcm1hbmRvIGVudmlvIGRvIHBhZ2FtZW50byBQaXguX2A7XG4gIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChtc2cpLCAnX2JsYW5rJyk7XG59XG5cbi8vID09PT09IExPR0lOIFVJID09PT09XG5mdW5jdGlvbiBtYXNjYXJhVGVsZWZvbmUoZWw6IEhUTUxJbnB1dEVsZW1lbnQpOiB2b2lkIHtcbiAgZWwudmFsdWUgPSBhcGxpY2FyTWFzY2FyYVRlbGVmb25lKGVsLnZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZW50cmFyQ29tQ2xpZW50ZShjbGllbnRlUmF3OiBDbGllbnRlKTogdm9pZCB7XG4gIGNvbnN0IGRvbWFpbkNsaWVudGUgPSBDbGllbnRlRW50aXR5LmZyb21EQihjbGllbnRlUmF3KTtcbiAgbG9naW5Vc2VDYXNlLmxvZ2luKGRvbWFpbkNsaWVudGUpO1xuXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk92ZXJsYXknKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgY29uc3QgdXN1YXJpb0JhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvQmFyJyk7XG4gIGlmICh1c3VhcmlvQmFyKSB1c3VhcmlvQmFyLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWZsZXgnO1xuICBjb25zdCB1c3VhcmlvTm9tZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzdWFyaW9Ob21lJyk7XG4gIGlmICh1c3VhcmlvTm9tZUVsKSB1c3VhcmlvTm9tZUVsLnRleHRDb250ZW50ID0gY2xpZW50ZVJhdy5ub21lO1xuICBjb25zdCByb2xldGFCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQnRuRmx1dHVhbnRlJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpZiAocm9sZXRhQnRuKSByb2xldGFCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgY29uc3QgdXN1YXJpb1RlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvVGVsJyk7XG4gIGlmICh1c3VhcmlvVGVsKSB1c3VhcmlvVGVsLnRleHRDb250ZW50ID0gY2xpZW50ZVJhdy50ZWxlZm9uZS5yZXBsYWNlKC9eKFxcZHsyfSkoXFxkezV9KShcXGR7NH0pJC8sICcoJDEpICQyLSQzJyk7XG4gIGNvbnN0IGlucE5vbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsO1xuICBpZiAoaW5wTm9tZSkgaW5wTm9tZS52YWx1ZSA9IGNsaWVudGVSYXcubm9tZTtcbiAgY29uc3QgaW5wRW5kZXJlY28gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGlucEVuZGVyZWNvICYmIGNsaWVudGVSYXcuZW5kZXJlY28pIGlucEVuZGVyZWNvLnZhbHVlID0gY2xpZW50ZVJhdy5lbmRlcmVjbztcbn1cblxuYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyVGVsZWZvbmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChfdmVyaWZpY2FuZG8pIHJldHVybjtcbiAgY29uc3QgdGVsSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IGVycm8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5FcnJvJyk7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNldGFwYVRlbGVmb25lIGJ1dHRvbicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgaWYgKGVycm8pIGVycm8uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnVmVyaWZpY2FuZG8uLi4nOyBidG4uZGlzYWJsZWQgPSB0cnVlOyB9XG4gIF92ZXJpZmljYW5kbyA9IHRydWU7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLmV4ZWN1dGUodGVsSW5wdXQudmFsdWUpO1xuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gcmVzdWx0LmVycm9yLm1lc3NhZ2U7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC52YWx1ZS5leGlzdGUgJiYgcmVzdWx0LnZhbHVlLmNsaWVudGUpIHtcbiAgICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLmNsaWVudGUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGV0YXBhVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhVGVsZWZvbmUnKTtcbiAgICAgIGNvbnN0IGV0YXBhQ2FkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhQ2FkYXN0cm8nKTtcbiAgICAgIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGlmIChldGFwYUNhZCkgZXRhcGFDYWQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAodGVsSW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCAmIHsgZGF0YXNldDogRE9NU3RyaW5nTWFwIH0pLmRhdGFzZXRbJ3RlbCddID0gdGVsSW5wdXQudmFsdWUucmVwbGFjZSgvXFxEL2csICcnKTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk5vbWUnKT8uZm9jdXMoKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSAnU2VtIGNvbmV4XHUwMEUzbyBvdSBlcnJvIG5vIHNlcnZpZG9yLiBUZW50ZSBub3ZhbWVudGUuJzsgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgfVxuICB9IGZpbmFsbHkge1xuICAgIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ0NvbnRpbnVhciBcdTIxOTInOyBidG4uZGlzYWJsZWQgPSBmYWxzZTsgfVxuICAgIF92ZXJpZmljYW5kbyA9IGZhbHNlO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhZGFzdHJhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKF9jYWRhc3RyYW5kbykgcmV0dXJuO1xuICBjb25zdCBub21lSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5Ob21lJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgY29uc3QgdGVsSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IG5vbWUgPSBub21lSW5wdXQudmFsdWU7XG4gIGNvbnN0IHRlbCA9ICh0ZWxJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50ICYgeyBkYXRhc2V0OiBET01TdHJpbmdNYXAgfSkuZGF0YXNldFsndGVsJ10gPz8gJyc7XG4gIGNvbnN0IGVycm8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FkYXN0cm9FcnJvJyk7XG4gIGlmICghbm9tZS50cmltKCkpIHtcbiAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ0RpZ2l0ZSBzZXUgbm9tZS4nOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChlcnJvKSBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNldGFwYUNhZGFzdHJvIGJ1dHRvbicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnRW50cmFuZG8uLi4nOyBidG4uZGlzYWJsZWQgPSB0cnVlOyB9XG4gIF9jYWRhc3RyYW5kbyA9IHRydWU7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLnJlZ2lzdGVyKG5vbWUsIHRlbCwgJycpO1xuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gcmVzdWx0LmVycm9yLm1lc3NhZ2U7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW50cmFyQ29tQ2xpZW50ZShyZXN1bHQudmFsdWUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gIH0gY2F0Y2gge1xuICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSAnRXJybyBhbyBjYWRhc3RyYXIuIFZlcmlmaXF1ZSBzdWEgY29uZXhcdTAwRTNvIGUgdGVudGUgbm92YW1lbnRlLic7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdFbnRyYXIgbm8gY2FyZFx1MDBFMXBpbyBcdTI3MjgnOyBidG4uZGlzYWJsZWQgPSBmYWxzZTsgfVxuICAgIF9jYWRhc3RyYW5kbyA9IGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZvbHRhckV0YXBhVGVsZWZvbmUoKTogdm9pZCB7XG4gIGNvbnN0IGV0YXBhQ2FkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhQ2FkYXN0cm8nKTtcbiAgY29uc3QgZXRhcGFUZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFUZWxlZm9uZScpO1xuICBpZiAoZXRhcGFDYWQpIGV0YXBhQ2FkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG59XG5cbmZ1bmN0aW9uIHNhaXIoKTogdm9pZCB7XG4gIGlmICghY29uZmlybSgnRGVzZWphIHNhaXIgZGEgc3VhIGNvbnRhPycpKSByZXR1cm47XG4gIGxvZ2luVXNlQ2FzZS5sb2dvdXQoKTtcbiAgY29uc3QgdXN1YXJpb0JhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvQmFyJyk7XG4gIGlmICh1c3VhcmlvQmFyKSB1c3VhcmlvQmFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlID0gJyc7XG4gIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZSA9ICcnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9ICcnO1xuICBjb25zdCBldGFwYVRlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYVRlbGVmb25lJyk7XG4gIGNvbnN0IGV0YXBhQ2FkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhQ2FkYXN0cm8nKTtcbiAgaWYgKGV0YXBhVGVsKSBldGFwYVRlbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgaWYgKGV0YXBhQ2FkKSBldGFwYUNhZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5PdmVybGF5JykhLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG59XG5cbmZ1bmN0aW9uIG1vc3RyYXJMb2dpbigpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luT3ZlcmxheScpIS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICBzZXRUaW1lb3V0KCgpID0+IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpPy5mb2N1cygpLCAzMDApO1xufVxuXG4vLyA9PT09PSBST0xFVEEgVUkgPT09PT1cbmFzeW5jIGZ1bmN0aW9uIGFicmlyUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBiZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCYWNrZHJvcCcpO1xuICBpZiAoIWJkKSByZXR1cm47XG4gIGJkLmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLWFiZXJ0bycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhU3RhdHVzQm94JykhLmlubmVySFRNTCA9ICcnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5hdGl2YScpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhTmFvTG9nYWRvJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQnRuRW52aWFyV3JhcCcpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVdoZWVsU2VjdGlvbicpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSmFHaXJvdScpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhUmVzdWx0YWRvJykhLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2l2ZWwnKTtcblxuICBjb25zdCBjZmcgPSBhd2FpdCBjYXJyZWdhckNvbmZpZ1JvbGV0YSgpO1xuICBjb25zdCBwcmVtaW9zID0gZ2V0UHJlbWlvcygpO1xuXG4gIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhUHJlbWlvc0dyaWQnKTtcbiAgaWYgKGdyaWQpIHtcbiAgICBjb25zdCBpY29uZXMgPSBbJ1x1RDgzQ1x1REY2QicsICdcdUQ4M0VcdUREQzEnLCAnXHVEODNEXHVERTlBJywgJ1x1RDgzRFx1RENCOCcsICdcdUQ4M0RcdURDQjAnLCAnXHVEODNDXHVERjg5JywgJ1x1RDgzQ1x1REY2RScsICdcdUQ4M0NcdURGODAnLCAnXHVEODNDXHVERjFGJ107XG4gICAgZ3JpZC5pbm5lckhUTUwgPSBwcmVtaW9zLm1hcCgocCwgaSkgPT4gYDxkaXYgY2xhc3M9XCJyb2xldGEtcHJlbWlvLWl0ZW1cIj4ke2ljb25lc1tpICUgaWNvbmVzLmxlbmd0aF19ICR7ZXNjSFRNTChwKX08L2Rpdj5gKS5qb2luKCcnKTtcbiAgfVxuXG4gIGlmIChjZmcgJiYgIWNmZy5hdGl2YSkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbmF0aXZhJykhLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIH1cblxuICBkZXNlbmhhclJvbGV0YShwcmVtaW9zKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVdoZWVsU2VjdGlvbicpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhTmFvTG9nYWRvJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluc3RydWNvZXMnKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBjb25zdCBnaXJhckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSBmYWxzZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcxJzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERkExIEdJUkFSIEFHT1JBISc7IH1cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGF0dXMgPSBhd2FpdCB2ZXJpZmljYXJTdGF0dXNSb2xldGEoY2xpZW50ZUF0dWFsLmlkID8/IDApO1xuICBhdHVhbGl6YXJVSVJvbGV0YShzdGF0dXMpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJSb2xldGEoKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdtb2RhbC1hYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdyb2xldGFCYWNrZHJvcCcpIGZlY2hhclJvbGV0YSgpO1xufVxuXG5mdW5jdGlvbiBhdHVhbGl6YXJVSVJvbGV0YShpbmZvOiBQYXJ0aWNpcGFjYW8gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHN0YXR1c0JveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFTdGF0dXNCb3gnKSE7XG4gIGNvbnN0IGluc3RydWNvZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdHJ1Y29lcycpITtcbiAgY29uc3QgYnRuRW52aWFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkVudmlhcldyYXAnKSE7XG4gIGNvbnN0IHdoZWVsU2VjdGlvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFXaGVlbFNlY3Rpb24nKSE7XG4gIGNvbnN0IGphR2lyb3UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSmFHaXJvdScpITtcbiAgY29uc3QgZ2lyYXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuXG4gIHdoZWVsU2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgZGVzZW5oYXJSb2xldGEoZ2V0UHJlbWlvcygpKTtcblxuICBpZiAoaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHtcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSBmYWxzZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcxJzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERkExIEdJUkFSIEFHT1JBISc7IH1cbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJyc7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIWluZm8pIHtcbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJyc7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgZ2lyYXJCdG4udGl0bGUgPSAnRW52aWUgc3VhcyBwcm92YXMgcGFyYSBsaWJlcmFyIGEgcm9sZXRhJzsgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChpbmZvLnN0YXR1cyA9PT0gJ3BlbmRlbnRlJykge1xuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1zdGF0dXMtYm94IHJvbGV0YS1zdGF0dXMtcGVuZGVudGVcIj5cdTIzRjMgPGRpdj48c3Ryb25nPlBhcnRpY2lwYVx1MDBFN1x1MDBFM28gZW52aWFkYSE8L3N0cm9uZz48YnI+U3VhcyBwcm92YXMgZXN0XHUwMEUzbyBlbSBhblx1MDBFMWxpc2UuIEFndWFyZGUgYSBhcHJvdmFcdTAwRTdcdTAwRTNvIChhdFx1MDBFOSAyNGgpLjwvZGl2PjwvZGl2Pic7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IGdpcmFyQnRuLnRpdGxlID0gJ0FndWFyZGFuZG8gYXByb3ZhXHUwMEU3XHUwMEUzbyc7IH1cbiAgfSBlbHNlIGlmIChpbmZvLnN0YXR1cyA9PT0gJ3JlamVpdGFkbycpIHtcbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtc3RhdHVzLWJveCByb2xldGEtc3RhdHVzLXJlamVpdGFkb1wiPlx1Mjc0QyA8ZGl2PjxzdHJvbmc+UGFydGljaXBhXHUwMEU3XHUwMEUzbyBuXHUwMEUzbyBhcHJvdmFkYS48L3N0cm9uZz48YnI+VGVudGUgbm92YW1lbnRlIGN1bXByaW5kbyB0b2RvcyBvcyByZXF1aXNpdG9zLjwvZGl2PjwvZGl2Pic7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gdHJ1ZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyB9XG4gIH0gZWxzZSBpZiAoaW5mby5zdGF0dXMgPT09ICdhcHJvdmFkbycgJiYgIWluZm8uamFfZ2lyb3UpIHtcbiAgICBjb25zdCBob2plID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XG4gICAgY29uc3QgZGlhQXByb3ZhY2FvID0gaW5mby5kYXRhX2Fwcm92YWNhbyA/IGluZm8uZGF0YV9hcHJvdmFjYW8uc3BsaXQoJ1QnKVswXSA6IG51bGw7XG4gICAgaWYgKGRpYUFwcm92YWNhbyAhPT0gaG9qZSkge1xuICAgICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1yZWplaXRhZG9cIj5cdTIzRjAgPGRpdj48c3Ryb25nPlByYXpvIGV4cGlyYWRvLjwvc3Ryb25nPjxicj5Wb2NcdTAwRUEgZm9pIGFwcm92YWRvIGVtIG91dHJvIGRpYSBlIG5cdTAwRTNvIGdpcm91IGEgdGVtcG8uIEVudmllIG5vdmFzIHByb3ZhcyBwYXJhIHBhcnRpY2lwYXIgbm92YW1lbnRlLjwvZGl2PjwvZGl2Pic7XG4gICAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gdHJ1ZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyBnaXJhckJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0RcdUREMTIgUHJhem8gZXhwaXJhZG8nOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1zdGF0dXMtYm94IHJvbGV0YS1zdGF0dXMtYXByb3ZhZG9cIj5cdTI3MDUgPGRpdj48c3Ryb25nPkFwcm92YWRvISBHaXJlIGhvamUhPC9zdHJvbmc+PGJyPlZvY1x1MDBFQSB0ZW0gYXRcdTAwRTkgbWVpYS1ub2l0ZSBwYXJhIHVzYXIgc2V1IGdpcm8uIE5cdTAwRTNvIGFjdW11bGEhPC9kaXY+PC9kaXY+JztcbiAgICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzEnOyBnaXJhckJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGQTEgR0lSQVIgQUdPUkEhJzsgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChpbmZvLmphX2dpcm91ICYmICFpc0NvbnRhVGVzdGUoYXBwU3RvcmUuZ2V0U3RhdGUoKS5jbGllbnRlKSkge1xuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnJztcbiAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgfVxuICAgIGNvbnN0IHByZW1pb0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3VQcmVtaW8nKTtcbiAgICBpZiAocHJlbWlvRWwpIHtcbiAgICAgIHByZW1pb0VsLmlubmVySFRNTCA9IGluZm8ucHJlbWlvXG4gICAgICAgID8gJ1NldSBwclx1MDBFQW1pbyBmb2k6IDxzdHJvbmcgc3R5bGU9XCJjb2xvcjp2YXIoLS1yb3NhKVwiPicgKyBlc2NIVE1MKGluZm8ucHJlbWlvKSArICc8L3N0cm9uZz4uIEVudHJlIGVtIGNvbnRhdG8gY29ub3NjbyBwYXJhIHJlc2dhdGFyISdcbiAgICAgICAgOiAnVm9jXHUwMEVBIGpcdTAwRTEgdXNvdSBzdWEgY2hhbmNlIG5lc3RhIGNhbXBhbmhhLic7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdpcmFyUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHsgbW9zdHJhclRvYXN0KCdGYVx1MDBFN2EgbG9naW4gcGFyYSBnaXJhciBhIHJvbGV0YSEnLCAnZXJybycpOyByZXR1cm47IH1cblxuICBjb25zdCBzdGF0dXNHaXJvID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgaWYgKCFpc0NvbnRhVGVzdGUoYXBwU3RvcmUuZ2V0U3RhdGUoKS5jbGllbnRlKSkge1xuICAgIGlmICghc3RhdHVzR2lybyB8fCBzdGF0dXNHaXJvLnN0YXR1cyAhPT0gJ2Fwcm92YWRvJyB8fCBzdGF0dXNHaXJvLmphX2dpcm91KSB7XG4gICAgICBtb3N0cmFyVG9hc3QoJ1ZvY1x1MDBFQSBwcmVjaXNhIHNlciBhcHJvdmFkbyBwZWxhIGVxdWlwZSBhbnRlcyBkZSBnaXJhciEnLCAnZXJybycpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcbiAgICAgIGNvbnN0IGNvdW50UmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5jb3VudFZlbmNlZG9yZXNTZW1hbmEoc2VtYW5hKTtcbiAgICAgIGNvbnN0IHZlbmNlZG9yZXNDb3VudCA9IGNvdW50UmVzdWx0Lm9rID8gY291bnRSZXN1bHQudmFsdWUgOiAwO1xuXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goYCR7U1VQQUJBU0VfVVJMfS9yZXN0L3YxL3JvbGV0YV9jb25maWc/aWQ9ZXEuMSZzZWxlY3Q9bWF4X3ZlbmNlZG9yZXNfc2VtYW5hYCwge1xuICAgICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxuICAgICAgfSk7XG4gICAgICBjb25zdCBjZmcgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBBcnJheTx7IG1heF92ZW5jZWRvcmVzX3NlbWFuYTogbnVtYmVyIH0+O1xuICAgICAgY29uc3QgbGltaXRlID0gY2ZnWzBdPy5tYXhfdmVuY2Vkb3Jlc19zZW1hbmEgPz8gMTtcbiAgICAgIGlmICh2ZW5jZWRvcmVzQ291bnQgPj0gbGltaXRlKSB7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgICAgICAgaWYgKGJ0bikgeyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyB9XG4gICAgICAgIGNvbnN0IHJlc3VsdEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJlc3VsdGFkbycpO1xuICAgICAgICBpZiAocmVzdWx0RWwpIHtcbiAgICAgICAgICByZXN1bHRFbC5pbm5lckhUTUwgPSAnXHUyNkEwXHVGRTBGIDxzdHJvbmc+Slx1MDBFMSB0ZW1vcyB1bSBnYW5oYWRvciBlc3RhIHNlbWFuYSE8L3N0cm9uZz48YnI+PHNtYWxsPkEgcHJcdTAwRjN4aW1hIHJvZGFkYSBjb21lXHUwMEU3YSBuYSBzZW1hbmEgcXVlIHZlbS4gRmlxdWUgZGUgb2xobyE8L3NtYWxsPic7XG4gICAgICAgICAgcmVzdWx0RWwuY2xhc3NMaXN0LmFkZCgndmlzaXZlbCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7IGxvZy53YXJuKCdFcnJvIGFvIHZlcmlmaWNhciBsaW1pdGUgc2VtYW5hbCcsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTsgfVxuICB9XG5cbiAgYXdhaXQgZ2lyYXJSb2xldGFGbihjbGllbnRlQXR1YWwsIChwcmVtaW86IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHJlc3VsdEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJlc3VsdGFkbycpO1xuICAgIGlmIChyZXN1bHRFbCkge1xuICAgICAgcmVzdWx0RWwuaW5uZXJIVE1MID0gJ1x1RDgzQ1x1REY4OSBWb2NcdTAwRUEgZ2FuaG91OiA8c3Ryb25nIHN0eWxlPVwiY29sb3I6dmFyKC0tcm9zYSlcIj4nICsgZXNjSFRNTChwcmVtaW8pICsgJzwvc3Ryb25nPiE8YnI+PHNtYWxsIHN0eWxlPVwiZm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tdGV4dG8tc2VjKVwiPkVudHJlIGVtIGNvbnRhdG8gY29ub3NjbyBwZWxvIFdoYXRzQXBwIHBhcmEgcmVzZ2F0YXIgc2V1IHByXHUwMEVBbWlvITwvc21hbGw+JztcbiAgICAgIHJlc3VsdEVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2l2ZWwnKTtcbiAgICB9XG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUdpcmFyQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICAgIGlmIChidG4pIGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTMgR2lyYWRvISc7XG4gICAgc2FsdmFyVmVuY2Vkb3IoY2xpZW50ZUF0dWFsLCBwcmVtaW8pLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW52aWFyUHJvdmFzV2hhdHNBcHAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuICBpZiAoIWNsaWVudGVBdHVhbCkgeyBhbGVydCgnRmFcdTAwRTdhIGxvZ2luIGFudGVzIGRlIGVudmlhciBzdWFzIHByb3Zhcy4nKTsgcmV0dXJuOyB9XG4gIGNvbnN0IHN0YXR1c0F0dWFsID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgaWYgKHN0YXR1c0F0dWFsICYmIChzdGF0dXNBdHVhbC5zdGF0dXMgPT09ICdwZW5kZW50ZScgfHwgc3RhdHVzQXR1YWwuc3RhdHVzID09PSAnYXByb3ZhZG8nKSkge1xuICAgIGF0dWFsaXphclVJUm9sZXRhKHN0YXR1c0F0dWFsKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgbm9tZSA9IGNsaWVudGVBdHVhbC5ub21lIHx8ICcnO1xuICBjb25zdCB0ZWwgPSBjbGllbnRlQXR1YWwudGVsZWZvbmUgfHwgJyc7XG4gIGNvbnN0IGluc3RFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0YWdyYW1JbnB1dCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsO1xuICBjb25zdCBpbnN0YWdyYW0gPSBpbnN0RWwgPyBpbnN0RWwudmFsdWUudHJpbSgpIDogJyc7XG4gIGNvbnN0IG1zZyA9ICdPbFx1MDBFMSwgZXF1aXBlIEdlbGFtb3VyISBRdWVybyBwYXJ0aWNpcGFyIGRhIFJvbGV0YSBWSVAuJTBBJTBBTm9tZTogJyArIGVuY29kZVVSSUNvbXBvbmVudChub21lKSArXG4gICAgJyUwQVRlbGVmb25lOiAnICsgZW5jb2RlVVJJQ29tcG9uZW50KHRlbCkgK1xuICAgIChpbnN0YWdyYW0gPyAnJTBBSW5zdGFncmFtOiAnICsgZW5jb2RlVVJJQ29tcG9uZW50KGluc3RhZ3JhbSkgOiAnJykgK1xuICAgICclMEElMEFFc3RvdSBlbnZpYW5kbyBhIGZvdG8gZG9zIG1ldXMgNSBhZGVzaXZvcyBlIG8gcHJpbnQgZG8gU3RvcnkgcGFyYSB2YWxpZGFcdTAwRTdcdTAwRTNvISc7XG4gIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIG1zZywgJ19ibGFuaycpO1xuICBhd2FpdCByZWdpc3RyYXJQYXJ0aWNpcGFjYW8oaW5zdGFncmFtKTtcbiAgYXR1YWxpemFyVUlSb2xldGEoeyBzdGF0dXM6ICdwZW5kZW50ZScsIGphX2dpcm91OiBmYWxzZSB9IGFzIFBhcnRpY2lwYWNhbyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlZ2lzdHJhclBhcnRpY2lwYWNhbyhpbnN0YWdyYW06IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHJldHVybjtcbiAgdHJ5IHtcbiAgICBjb25zdCBjaGVjayA9IGF3YWl0IHZlcmlmaWNhclN0YXR1c1JvbGV0YShjbGllbnRlQXR1YWwuaWQgPz8gMCk7XG4gICAgaWYgKGNoZWNrICYmIGNoZWNrLnN0YXR1cyAhPT0gJ3JlamVpdGFkbycpIHJldHVybjtcbiAgICBjb25zdCBzZW1hbmEgPSBnZXRTZW1hbmFBdHVhbCgpO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuc2F2ZVBhcnRpY2lwYWNhbyh7XG4gICAgICBub21lOiBjbGllbnRlQXR1YWwubm9tZSxcbiAgICAgIHRlbGVmb25lOiBjbGllbnRlQXR1YWwudGVsZWZvbmUsXG4gICAgICBpbnN0YWdyYW06IGluc3RhZ3JhbSB8fCB1bmRlZmluZWQsXG4gICAgICBzdGF0dXM6ICdwZW5kZW50ZScsXG4gICAgICBzZW1hbmEsXG4gICAgICBqYV9naXJvdTogZmFsc2UsXG4gICAgICBjcmVhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfSBhcyBpbXBvcnQoJy4vZG9tYWluL3JvbGV0YScpLlBhcnRpY2lwYWNhb1Byb3BzKTtcbiAgICBpZiAocmVzdWx0Lm9rKSB7XG4gICAgICBzZXRQYXJ0aWNpcGFjYW9JZChyZXN1bHQudmFsdWUuaWQpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyBsb2cud2FybignRXJybyBhbyByZWdpc3RyYXIgcGFydGljaXBhXHUwMEU3XHUwMEUzbycsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTsgfVxufVxuXG4vLyA9PT09PSBBRE1JTiBST0xFVEEgPT09PT1cbmZ1bmN0aW9uIHZlcmlmaWNhckFkbWluKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gYXBwU3RvcmUuZ2V0U3RhdGUoKS5pc0FkbWluO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhYnJpclJvbGV0YUFkbWluKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIXZlcmlmaWNhckFkbWluKCkpIHsgYWxlcnQoJ0FjZXNzbyByZXN0cml0by4nKTsgcmV0dXJuOyB9XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFBZG1pbkJhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICBhd2FpdCBjYXJyZWdhclBhcnRpY2lwYW50ZXNSb2xldGEoKTtcbiAgYXdhaXQgY2FycmVnYXJDb25maWdBZG1pbigpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJSb2xldGFBZG1pbigpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUFkbWluQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdyb2xldGFBZG1pbkJhY2tkcm9wJykgZmVjaGFyUm9sZXRhQWRtaW4oKTtcbn1cblxuZnVuY3Rpb24gYWJyaXJUYWJBZG1pbih0YWI6IHN0cmluZywgYnRuOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm9sZXRhLWFkbWluLXRhYicpLmZvckVhY2godCA9PiB0LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm9sZXRhLWFkbWluLXBhbmVsJykuZm9yRWFjaChwID0+IHAuY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKSk7XG4gIGJ0bi5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBjb25zdCB0YWJJZCA9ICd0YWInICsgdGFiLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdGFiLnNsaWNlKDEpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWJJZCk/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGlmICh0YWIgPT09ICdwZW5kZW50ZXMnKSBjYXJyZWdhclBhcnRpY2lwYW50ZXNSb2xldGEoKTtcbiAgZWxzZSBpZiAodGFiID09PSAnYXByb3ZhZG9zJykgY2FycmVnYXJBcHJvdmFkb3NSb2xldGEoKTtcbiAgZWxzZSBpZiAodGFiID09PSAndmVuY2Vkb3JlcycpIGNhcnJlZ2FyVmVuY2Vkb3Jlc1JvbGV0YSgpO1xuICBlbHNlIGlmICh0YWIgPT09ICdjb25maWcnKSBjYXJyZWdhckNvbmZpZ0FkbWluKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyUGFydGljaXBhbnRlc1JvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlzdGFQZW5kZW50ZXMnKTtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkNhcnJlZ2FuZG8uLi48L2Rpdj4nO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/c3RhdHVzPWVxLnBlbmRlbnRlJm9yZGVyPWNyZWF0ZWRfYXQuZGVzYycsIHtcbiAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PFBhcnRpY2lwYWNhbz47XG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmxlbmd0aCkgeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPk5lbmh1bSBwYXJ0aWNpcGFudGUgcGVuZGVudGUuPC9kaXY+JzsgcmV0dXJuOyB9XG4gICAgZWwuaW5uZXJIVE1MID0gZGF0YS5tYXAocCA9PiB7XG4gICAgICBjb25zdCBkdCA9IG5ldyBEYXRlKHAuY3JlYXRlZF9hdCkudG9Mb2NhbGVTdHJpbmcoJ3B0LUJSJyk7XG4gICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWl0ZW1cIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWluZm9cIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLW5vbWVcIj4nICsgZXNjSFRNTChwLm5vbWUgPz8gJycpICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtdGVsXCI+JyArIGVzY0hUTUwocC50ZWxlZm9uZSkgKyAocC5pbnN0YWdyYW0gPyAnIFx1MDBCNyBAJyArIGVzY0hUTUwocC5pbnN0YWdyYW0pIDogJycpICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxMXB4O2NvbG9yOiM5OTlcIj4nICsgZHQgKyAnPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWFjb2VzXCI+JyArXG4gICAgICAgICc8YnV0dG9uIGNsYXNzPVwiYnRuLWFwcm92YXJcIiBvbmNsaWNrPVwiYXByb3ZhclBhcnRpY2lwYW50ZSgnICsgcC5pZCArICcsIHRoaXMpXCI+XHUyNzEzIEFwcm92YXI8L2J1dHRvbj4nICtcbiAgICAgICAgJzxidXR0b24gY2xhc3M9XCJidG4tcmVqZWl0YXJcIiBvbmNsaWNrPVwicmVqZWl0YXJQYXJ0aWNpcGFudGUoJyArIHAuaWQgKyAnLCB0aGlzKVwiPlx1MjcxNyBSZWplaXRhcjwvYnV0dG9uPicgK1xuICAgICAgICAnPC9kaXY+PC9kaXY+JztcbiAgICB9KS5qb2luKCcnKTtcbiAgfSBjYXRjaCB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+RXJybyBhbyBjYXJyZWdhci48L2Rpdj4nOyB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyQXByb3ZhZG9zUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0YUFwcm92YWRvcycpO1xuICBpZiAoIWVsKSByZXR1cm47XG4gIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+Q2FycmVnYW5kby4uLjwvZGl2Pic7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfcGFydGljaXBhY29lcz9zdGF0dXM9ZXEuYXByb3ZhZG8mb3JkZXI9ZGF0YV9hcHJvdmFjYW8uZGVzYycsIHtcbiAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PFBhcnRpY2lwYWNhbz47XG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmxlbmd0aCkgeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPk5lbmh1bSBhcHJvdmFkbyBhaW5kYS48L2Rpdj4nOyByZXR1cm47IH1cbiAgICBlbC5pbm5lckhUTUwgPSBkYXRhLm1hcChwID0+IHtcbiAgICAgIGNvbnN0IGR0ID0gcC5kYXRhX2Fwcm92YWNhbyA/IG5ldyBEYXRlKHAuZGF0YV9hcHJvdmFjYW8pLnRvTG9jYWxlU3RyaW5nKCdwdC1CUicpIDogJ1x1MjAxNCc7XG4gICAgICBjb25zdCBnaXJvdSA9IHAuamFfZ2lyb3UgPyAnXHUyNzEzIEdpcm91IFx1MjAxNCAnICsgZXNjSFRNTChwLnByZW1pbyA/PyAnJykgOiAnXHUyM0YzIEFndWFyZGFuZG8gZ2lyYXInO1xuICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1pdGVtXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1pbmZvXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1ub21lXCI+JyArIGVzY0hUTUwocC5ub21lID8/ICcnKSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLXRlbFwiPicgKyBlc2NIVE1MKHAudGVsZWZvbmUpICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZToxMXB4O2NvbG9yOiMzODhlM2NcIj4nICsgZ2lyb3UgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjExcHg7Y29sb3I6Izk5OVwiPkFwcm92YWRvIGVtOiAnICsgZHQgKyAnPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj48L2Rpdj4nO1xuICAgIH0pLmpvaW4oJycpO1xuICB9IGNhdGNoIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5FcnJvIGFvIGNhcnJlZ2FyLjwvZGl2Pic7IH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gYXByb3ZhclBhcnRpY2lwYW50ZShpZDogbnVtYmVyLCBidG46IEhUTUxCdXR0b25FbGVtZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi50ZXh0Q29udGVudCA9ICcuLi4nO1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9wYXJ0aWNpcGFjb2VzP2lkPWVxLicgKyBpZCwge1xuICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTixcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OLCAnUHJlZmVyJzogJ3JldHVybj1taW5pbWFsJ1xuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgc3RhdHVzOiAnYXByb3ZhZG8nLFxuICAgICAgICBkYXRhX2Fwcm92YWNhbzogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBhcHJvdmFkb19wb3I6IGNsaWVudGVBdHVhbCA/IGNsaWVudGVBdHVhbC5ub21lIDogJ2FkbWluJ1xuICAgICAgfSlcbiAgICB9KTtcbiAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcignc3RhdHVzICcgKyByLnN0YXR1cyk7XG4gICAgYnRuLmNsb3Nlc3QoJy5yb2xldGEtcGFydGljaXBhbnRlLWl0ZW0nKT8ucmVtb3ZlKCk7XG4gIH0gY2F0Y2gge1xuICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAnXHUyNzEzIEFwcm92YXInO1xuICAgIGFsZXJ0KCdFcnJvIGFvIGFwcm92YXIuJyk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVqZWl0YXJQYXJ0aWNpcGFudGUoaWQ6IG51bWJlciwgYnRuOiBIVE1MQnV0dG9uRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIWNvbmZpcm0oJ1JlamVpdGFyIGVzdGEgcGFydGljaXBhXHUwMEU3XHUwMEUzbz8nKSkgcmV0dXJuO1xuICBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4udGV4dENvbnRlbnQgPSAnLi4uJztcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9wYXJ0aWNpcGFjb2VzP2lkPWVxLicgKyBpZCwge1xuICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTixcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OLCAnUHJlZmVyJzogJ3JldHVybj1taW5pbWFsJ1xuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc3RhdHVzOiAncmVqZWl0YWRvJyB9KVxuICAgIH0pO1xuICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKCdzdGF0dXMgJyArIHIuc3RhdHVzKTtcbiAgICBidG4uY2xvc2VzdCgnLnJvbGV0YS1wYXJ0aWNpcGFudGUtaXRlbScpPy5yZW1vdmUoKTtcbiAgfSBjYXRjaCB7XG4gICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTcgUmVqZWl0YXInO1xuICAgIGFsZXJ0KCdFcnJvIGFvIHJlamVpdGFyLicpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyVmVuY2Vkb3Jlc1JvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlzdGFWZW5jZWRvcmVzJyk7XG4gIGlmICghZWwpIHJldHVybjtcbiAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5DYXJyZWdhbmRvLi4uPC9kaXY+JztcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV92ZW5jZWRvcmVzP29yZGVyPWRhdGFfdml0b3JpYS5kZXNjJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8eyBub21lPzogc3RyaW5nOyBwcmVtaW86IHN0cmluZzsgdGVsZWZvbmU/OiBzdHJpbmc7IHNlbWFuYT86IHN0cmluZzsgZGF0YV92aXRvcmlhOiBzdHJpbmcgfT47XG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmxlbmd0aCkgeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPk5lbmh1bSB2ZW5jZWRvciBhaW5kYS48L2Rpdj4nOyByZXR1cm47IH1cbiAgICBlbC5pbm5lckhUTUwgPSBkYXRhLm1hcCh2ID0+IHtcbiAgICAgIGNvbnN0IGR0ID0gbmV3IERhdGUodi5kYXRhX3ZpdG9yaWEpLnRvTG9jYWxlU3RyaW5nKCdwdC1CUicpO1xuICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicm9sZXRhLXZlbmNlZG9yLWl0ZW1cIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtdmVuY2Vkb3Itbm9tZVwiPlx1RDgzQ1x1REZDNiAnICsgZXNjSFRNTCh2Lm5vbWUgPz8gJ1x1MjAxNCcpICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS12ZW5jZWRvci1wcmVtaW9cIj5cdUQ4M0NcdURGODEgJyArIGVzY0hUTUwodi5wcmVtaW8pICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS12ZW5jZWRvci1kYXRhXCI+JyArIGVzY0hUTUwodi50ZWxlZm9uZSA/PyAnJykgKyAnIFx1MDBCNyBTZW1hbmEgJyArIGVzY0hUTUwodi5zZW1hbmEgPz8gJycpICsgJyBcdTAwQjcgJyArIGR0ICsgJzwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JztcbiAgICB9KS5qb2luKCcnKTtcbiAgfSBjYXRjaCB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+RXJybyBhbyBjYXJyZWdhci48L2Rpdj4nOyB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyQ29uZmlnQWRtaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfY29uZmlnP2lkPWVxLjEmbGltaXQ9MScsIHtcbiAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PHsgYXRpdmE6IGJvb2xlYW47IHByZW1pb3M6IHN0cmluZ1tdIH0+O1xuICAgIGlmIChkYXRhICYmIGRhdGFbMF0pIHtcbiAgICAgIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnQXRpdmEnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkID0gZGF0YVswXSEuYXRpdmE7XG4gICAgICBjb25zdCBwcmVtaW9zID0gQXJyYXkuaXNBcnJheShkYXRhWzBdIS5wcmVtaW9zKSA/IGRhdGFbMF0hLnByZW1pb3MgOiBnZXRQcmVtaW9zUGFkcmFvKCk7XG4gICAgICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ1ByZW1pb3MnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZSA9IHByZW1pb3Muam9pbignXFxuJyk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7IGxvZy53YXJuKCdFcnJvIGFvIGNhcnJlZ2FyIGNvbmZpZyBhZG1pbicsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTsgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzYWx2YXJDb25maWdSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGF0aXZhID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdBdGl2YScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmNoZWNrZWQ7XG4gIGNvbnN0IHByZW1pb3NUeHQgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ1ByZW1pb3MnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZTtcbiAgY29uc3QgcHJlbWlvcyA9IHByZW1pb3NUeHQuc3BsaXQoJ1xcbicpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIocyA9PiBzLmxlbmd0aCA+IDApO1xuICBjb25zdCBtc2dFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdNc2cnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfY29uZmlnP2lkPWVxLjEnLCB7XG4gICAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxuICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04sICdQcmVmZXInOiAncmV0dXJuPW1pbmltYWwnXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhdGl2YSwgcHJlbWlvcywgdXBkYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pXG4gICAgfSk7XG4gICAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ3N0YXR1cyAnICsgci5zdGF0dXMpO1xuICAgIHNldFByZW1pb3MocHJlbWlvcyk7XG4gICAgaWYgKG1zZ0VsKSB7IG1zZ0VsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyBzZXRUaW1lb3V0KCgpID0+IHsgbXNnRWwuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgfSwgMjUwMCk7IH1cbiAgfSBjYXRjaCB7IGFsZXJ0KCdFcnJvIGFvIHNhbHZhciBjb25maWd1cmFcdTAwRTdcdTAwRjVlcy4nKTsgfVxufVxuXG4vLyA9PT09PSBJTklUID09PT09XG4oYXN5bmMgZnVuY3Rpb24gaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICAvLyBUZW50YSByZXN0YXVyYXIgc2Vzc1x1MDBFM28gdmlhIExvZ2luVXNlQ2FzZSAodmVyaWZpY2EgVFRMICsgc3RvcmUpXG4gICAgY29uc3QgY2xpZW50ZVNlc3NhbyA9IGxvZ2luVXNlQ2FzZS5yZXN0b3JlU2Vzc2lvbigpO1xuICAgIGlmIChjbGllbnRlU2Vzc2FvKSB7XG4gICAgICAvLyBSZXZhbGlkYSBubyBiYW5jb1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLmV4ZWN1dGUoY2xpZW50ZVNlc3Nhby50ZWxlZm9uZSk7XG4gICAgICBpZiAocmVzdWx0Lm9rICYmIHJlc3VsdC52YWx1ZS5leGlzdGUgJiYgcmVzdWx0LnZhbHVlLmNsaWVudGUpIHtcbiAgICAgICAgZW50cmFyQ29tQ2xpZW50ZShyZXN1bHQudmFsdWUuY2xpZW50ZS50b0pTT04oKSBhcyBDbGllbnRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9naW5Vc2VDYXNlLmxvZ291dCgpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyBsb2cud2FybignRXJybyBhbyB2ZXJpZmljYXIgc2Vzc1x1MDBFM28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7IH1cbiAgbW9zdHJhckxvZ2luKCk7XG59KSgpO1xuXG4vLyBQV0Egc2VydmljZSB3b3JrZXJcbmlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XG4gIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCdzdy5qcycpLmNhdGNoKCgpID0+IHt9KTtcbn1cblxuLy8gU2luY3Jvbml6YXIgY2FyZFx1MDBFMXBpbyBjb20gU3VwYWJhc2Vcbihhc3luYyBmdW5jdGlvbiBzaW5jcm9uaXphckNhcmRhcGlvKCk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IGN0cmwgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IGN0cmwuYWJvcnQoKSwgMTBfMDAwKTtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3Byb2R1dG9zP3NlbGVjdD1ub21lLHByZWNvLGRpc3Bvbml2ZWwnLCB7XG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfSxcbiAgICAgIHNpZ25hbDogY3RybC5zaWduYWxcbiAgICB9KTtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIGlmICghci5vaykgcmV0dXJuO1xuICAgIGNvbnN0IHByb2RzID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8eyBub21lOiBzdHJpbmc7IHByZWNvOiBudW1iZXI7IGRpc3Bvbml2ZWw6IGJvb2xlYW4gfT47XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHByb2RzKSB8fCAhcHJvZHMubGVuZ3RoKSByZXR1cm47XG4gICAgY29uc3QgbWFwYTogUmVjb3JkPHN0cmluZywgeyBub21lOiBzdHJpbmc7IHByZWNvOiBudW1iZXI7IGRpc3Bvbml2ZWw6IGJvb2xlYW4gfT4gPSB7fTtcbiAgICBwcm9kcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAgJiYgdHlwZW9mIHAubm9tZSA9PT0gJ3N0cmluZycgJiYgcC5ub21lLnRyaW0oKSkgbWFwYVtwLm5vbWUudHJpbSgpLnRvTG93ZXJDYXNlKCldID0gcDtcbiAgICB9KTtcbiAgICBjb25zdCBwcmljZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJ0bi1wZWRpcicpLmZvckVhY2goYnRuID0+IHtcbiAgICAgIGNvbnN0IG9uY2xpY2tBdHRyID0gYnRuLmdldEF0dHJpYnV0ZSgnb25jbGljaycpID8/ICcnO1xuICAgICAgY29uc3QgbSA9IG9uY2xpY2tBdHRyLm1hdGNoKC9wZWRpclByb2R1dG9cXCh0aGlzLCcoLis/KScsKFxcZCsoPzpcXC5cXGQrKT8pXFwpLyk7XG4gICAgICBpZiAoIW0pIHJldHVybjtcbiAgICAgIGNvbnN0IG5vbWVQcm9kID0gbVsxXSE7XG4gICAgICBjb25zdCBjaGF2ZSA9IG5vbWVQcm9kLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3QgZGIgPSBtYXBhW2NoYXZlXTtcbiAgICAgIGlmICghZGIpIHJldHVybjtcbiAgICAgIGNvbnN0IGNhcmQgPSBidG4uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICAgIGlmICghY2FyZCkgcmV0dXJuO1xuICAgICAgaWYgKGRiLmRpc3Bvbml2ZWwgPT09IGZhbHNlKSB7IGNhcmQuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgcmV0dXJuOyB9XG4gICAgICBjb25zdCBub3ZvUHJlY28gPSBwYXJzZUZsb2F0KFN0cmluZyhkYi5wcmVjbykpO1xuICAgICAgaWYgKGlzTmFOKG5vdm9QcmVjbykgfHwgbm92b1ByZWNvIDw9IDApIHJldHVybjtcbiAgICAgIGJ0bi5zZXRBdHRyaWJ1dGUoJ29uY2xpY2snLCBcInBlZGlyUHJvZHV0byh0aGlzLCdcIiArIG5vbWVQcm9kLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKSArIFwiJyxcIiArIG5vdm9QcmVjbyArIFwiKVwiKTtcbiAgICAgIGNvbnN0IHByZWNvRWwgPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kLXByZWNvJyk7XG4gICAgICBpZiAocHJlY29FbCkgcHJlY29FbC50ZXh0Q29udGVudCA9ICdSJCAnICsgbm92b1ByZWNvLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG4gICAgICBwcmljZU1hcC5zZXQobm9tZVByb2QsIG5vdm9QcmVjbyk7XG4gICAgfSk7XG4gICAgY2FydFNlcnZpY2UucmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcCk7XG4gIH0gY2F0Y2ggeyAvKiBzaWxlbmNpb3NvICovIH1cbn0pKCk7XG5cbi8vIEZlY2hhciBtb2RhaXMgY29tIEVzY2FwZVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICBmZWNoYXJEaWFsb2coKTtcbiAgICBmZWNoYXJNb2RhbCgpO1xuICAgIGZlY2hhckNvbmZpcm1XQSgpO1xuICAgIGNhbmNlbGFyUGl4KCk7XG4gIH1cbn0pO1xuXG4vLyA9PT09PSBFWFBPUiBQQVJBIEhUTUwgKG9uY2xpY2s9XCIuLi5cIikgPT09PT1cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgaW50ZXJmYWNlIFdpbmRvdyB7XG4gICAgZmlsdHJhcjogdHlwZW9mIGZpbHRyYXI7XG4gICAgcGVkaXJQcm9kdXRvOiB0eXBlb2YgcGVkaXJQcm9kdXRvO1xuICAgIGFicmlyRGlhbG9nOiB0eXBlb2YgYWJyaXJEaWFsb2c7XG4gICAgZmVjaGFyRGlhbG9nOiB0eXBlb2YgZmVjaGFyRGlhbG9nO1xuICAgIGZlY2hhckRpYWxvZ0JhY2tkcm9wOiB0eXBlb2YgZmVjaGFyRGlhbG9nQmFja2Ryb3A7XG4gICAgaXJQYXJhRmluYWxpemFyOiB0eXBlb2YgaXJQYXJhRmluYWxpemFyO1xuICAgIGFicmlyTW9kYWw6IHR5cGVvZiBhYnJpck1vZGFsO1xuICAgIGZlY2hhck1vZGFsOiB0eXBlb2YgZmVjaGFyTW9kYWw7XG4gICAgZmVjaGFyTW9kYWxCYWNrZHJvcDogdHlwZW9mIGZlY2hhck1vZGFsQmFja2Ryb3A7XG4gICAgcmVtb3ZlckRvQ2FycmluaG86IHR5cGVvZiByZW1vdmVyRG9DYXJyaW5obztcbiAgICBzZWxlY2lvbmFyUGFnYW1lbnRvOiB0eXBlb2Ygc2VsZWNpb25hclBhZ2FtZW50bztcbiAgICBmaW5hbGl6YXJQZWRpZG86IHR5cGVvZiBmaW5hbGl6YXJQZWRpZG87XG4gICAgY29uZmlybWFyRW52aW9XQTogdHlwZW9mIGNvbmZpcm1hckVudmlvV0E7XG4gICAgZmVjaGFyQ29uZmlybVdBOiB0eXBlb2YgZmVjaGFyQ29uZmlybVdBO1xuICAgIHBlZGlyQm9sb0Zvcm1hOiB0eXBlb2YgcGVkaXJCb2xvRm9ybWE7XG4gICAgYWJyaXJEaWFsb2dCb2xvOiB0eXBlb2YgYWJyaXJEaWFsb2dCb2xvO1xuICAgIGZlY2hhckRpYWxvZ0JvbG86IHR5cGVvZiBmZWNoYXJEaWFsb2dCb2xvO1xuICAgIGFnZW5kYXJCb2xvV2hhdHNBcHA6IHR5cGVvZiBhZ2VuZGFyQm9sb1doYXRzQXBwO1xuICAgIGNhcm91c2VsTmV4dDogdHlwZW9mIGNhcm91c2VsTmV4dDtcbiAgICBjYXJvdXNlbFByZXY6IHR5cGVvZiBjYXJvdXNlbFByZXY7XG4gICAgY29waWFyUGl4OiB0eXBlb2YgY29waWFyUGl4O1xuICAgIGNhbmNlbGFyUGl4OiB0eXBlb2YgY2FuY2VsYXJQaXg7XG4gICAgcGl4SmFQYWd1ZWk6IHR5cGVvZiBwaXhKYVBhZ3VlaTtcbiAgICBzZWxlY2lvbmFyVGlwb0NhcnRhbzogdHlwZW9mIHNlbGVjaW9uYXJUaXBvQ2FydGFvO1xuICAgIGZvcm1hdGFyQ2FydGFvOiB0eXBlb2YgZm9ybWF0YXJDYXJ0YW87XG4gICAgZm9ybWF0YXJDcGY6IHR5cGVvZiBmb3JtYXRhckNwZjtcbiAgICBmb3JtYXRhclZhbGlkYWRlOiB0eXBlb2YgZm9ybWF0YXJWYWxpZGFkZTtcbiAgICBmb3JtYXRhckNlcDogdHlwZW9mIGZvcm1hdGFyQ2VwO1xuICAgIHBhZ2FyQ2FydGFvOiB0eXBlb2YgcGFnYXJDYXJ0YW87XG4gICAgZmVjaGFyUmVjaWJvUGl4OiB0eXBlb2YgZmVjaGFyUmVjaWJvUGl4O1xuICAgIG1hc2NhcmFUZWxlZm9uZTogdHlwZW9mIG1hc2NhcmFUZWxlZm9uZTtcbiAgICB2ZXJpZmljYXJUZWxlZm9uZTogdHlwZW9mIHZlcmlmaWNhclRlbGVmb25lO1xuICAgIGNhZGFzdHJhcjogdHlwZW9mIGNhZGFzdHJhcjtcbiAgICB2b2x0YXJFdGFwYVRlbGVmb25lOiB0eXBlb2Ygdm9sdGFyRXRhcGFUZWxlZm9uZTtcbiAgICBzYWlyOiB0eXBlb2Ygc2FpcjtcbiAgICBhYnJpclJvbGV0YTogdHlwZW9mIGFicmlyUm9sZXRhO1xuICAgIGZlY2hhclJvbGV0YTogdHlwZW9mIGZlY2hhclJvbGV0YTtcbiAgICBmZWNoYXJSb2xldGFCYWNrZHJvcDogdHlwZW9mIGZlY2hhclJvbGV0YUJhY2tkcm9wO1xuICAgIGdpcmFyUm9sZXRhOiB0eXBlb2YgZ2lyYXJSb2xldGE7XG4gICAgZW52aWFyUHJvdmFzV2hhdHNBcHA6IHR5cGVvZiBlbnZpYXJQcm92YXNXaGF0c0FwcDtcbiAgICBhYnJpclJvbGV0YUFkbWluOiB0eXBlb2YgYWJyaXJSb2xldGFBZG1pbjtcbiAgICBmZWNoYXJSb2xldGFBZG1pbjogdHlwZW9mIGZlY2hhclJvbGV0YUFkbWluO1xuICAgIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJSb2xldGFBZG1pbkJhY2tkcm9wO1xuICAgIGFicmlyVGFiQWRtaW46IHR5cGVvZiBhYnJpclRhYkFkbWluO1xuICAgIGFwcm92YXJQYXJ0aWNpcGFudGU6IHR5cGVvZiBhcHJvdmFyUGFydGljaXBhbnRlO1xuICAgIHJlamVpdGFyUGFydGljaXBhbnRlOiB0eXBlb2YgcmVqZWl0YXJQYXJ0aWNpcGFudGU7XG4gICAgc2FsdmFyQ29uZmlnUm9sZXRhOiB0eXBlb2Ygc2FsdmFyQ29uZmlnUm9sZXRhO1xuICB9XG59XG5cbk9iamVjdC5hc3NpZ24od2luZG93LCB7XG4gIGZpbHRyYXIsXG4gIHBlZGlyUHJvZHV0byxcbiAgYWJyaXJEaWFsb2csXG4gIGZlY2hhckRpYWxvZyxcbiAgZmVjaGFyRGlhbG9nQmFja2Ryb3AsXG4gIGlyUGFyYUZpbmFsaXphcixcbiAgYWJyaXJNb2RhbCxcbiAgZmVjaGFyTW9kYWwsXG4gIGZlY2hhck1vZGFsQmFja2Ryb3AsXG4gIHJlbW92ZXJEb0NhcnJpbmhvLFxuICBzZWxlY2lvbmFyUGFnYW1lbnRvLFxuICBmaW5hbGl6YXJQZWRpZG8sXG4gIGNvbmZpcm1hckVudmlvV0EsXG4gIGZlY2hhckNvbmZpcm1XQSxcbiAgcGVkaXJCb2xvRm9ybWEsXG4gIGFicmlyRGlhbG9nQm9sbyxcbiAgZmVjaGFyRGlhbG9nQm9sbyxcbiAgYWdlbmRhckJvbG9XaGF0c0FwcCxcbiAgY2Fyb3VzZWxOZXh0LFxuICBjYXJvdXNlbFByZXYsXG4gIGNvcGlhclBpeCxcbiAgY2FuY2VsYXJQaXgsXG4gIHBpeEphUGFndWVpLFxuICBzZWxlY2lvbmFyVGlwb0NhcnRhbyxcbiAgZm9ybWF0YXJDYXJ0YW8sXG4gIGZvcm1hdGFyQ3BmLFxuICBmb3JtYXRhclZhbGlkYWRlLFxuICBmb3JtYXRhckNlcCxcbiAgcGFnYXJDYXJ0YW8sXG4gIGZlY2hhclJlY2lib1BpeCxcbiAgbWFzY2FyYVRlbGVmb25lLFxuICB2ZXJpZmljYXJUZWxlZm9uZSxcbiAgY2FkYXN0cmFyLFxuICB2b2x0YXJFdGFwYVRlbGVmb25lLFxuICBzYWlyLFxuICBhYnJpclJvbGV0YSxcbiAgZmVjaGFyUm9sZXRhLFxuICBmZWNoYXJSb2xldGFCYWNrZHJvcCxcbiAgZ2lyYXJSb2xldGEsXG4gIGVudmlhclByb3Zhc1doYXRzQXBwLFxuICBhYnJpclJvbGV0YUFkbWluLFxuICBmZWNoYXJSb2xldGFBZG1pbixcbiAgZmVjaGFyUm9sZXRhQWRtaW5CYWNrZHJvcCxcbiAgYWJyaXJUYWJBZG1pbixcbiAgYXByb3ZhclBhcnRpY2lwYW50ZSxcbiAgcmVqZWl0YXJQYXJ0aWNpcGFudGUsXG4gIHNhbHZhckNvbmZpZ1JvbGV0YSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFTyxXQUFTLGFBQWEsS0FBYSxPQUFrQixRQUFjO0FBQ3hFLFVBQU0sTUFBTSxTQUFTLGVBQWUsUUFBUTtBQUM1QyxRQUFJLElBQUssS0FBSSxPQUFPO0FBQ3BCLFVBQU0sSUFBSSxTQUFTLGNBQWMsS0FBSztBQUN0QyxNQUFFLEtBQUs7QUFDUCxNQUFFLGNBQWM7QUFDaEIsVUFBTSxLQUFLLFNBQVMsU0FBUyxZQUFZLFNBQVMsT0FBTyxZQUFZO0FBQ3JFLFdBQU8sT0FBTyxFQUFFLE9BQU87QUFBQSxNQUNyQixVQUFVO0FBQUEsTUFBUyxRQUFRO0FBQUEsTUFBUSxNQUFN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QyxLQUFNO0FBQ1gsWUFBSSxHQUFHLGVBQWUsT0FBTztBQUFFLGVBQUssTUFBTSxVQUFVO0FBQVE7QUFBQSxRQUFRO0FBQ3BFLGNBQU0sWUFBWSxXQUFXLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDN0MsWUFBSSxNQUFNLFNBQVMsS0FBSyxhQUFhLEVBQUc7QUFDeEMsWUFBSSxhQUFhLFdBQVcsd0JBQXdCLFNBQVMsUUFBUSxNQUFNLEtBQUssSUFBSSxPQUFPLFlBQVksR0FBRztBQUMxRyxjQUFNLFVBQVUsS0FBSyxjQUFjLGFBQWE7QUFDaEQsWUFBSSxRQUFTLFNBQVEsY0FBYyxRQUFRLFVBQVUsUUFBUSxDQUFDLEVBQUUsUUFBUSxLQUFLLEdBQUc7QUFDaEYsaUJBQVMsSUFBSSxVQUFVLFNBQVM7QUFBQSxNQUNsQyxDQUFDO0FBQ0Qsa0JBQVksaUJBQWlCLFFBQVE7QUFBQSxJQUN2QyxTQUFRO0FBQUEsSUFBbUI7QUFBQSxFQUM3QixHQUFHO0FBR0gsV0FBUyxpQkFBaUIsV0FBVyxDQUFDLE1BQXFCO0FBQ3pELFFBQUksRUFBRSxRQUFRLFVBQVU7QUFDdEIsbUJBQWE7QUFDYixrQkFBWTtBQUNaLHNCQUFnQjtBQUNoQixrQkFBWTtBQUFBLElBQ2Q7QUFBQSxFQUNGLENBQUM7QUF1REQsU0FBTyxPQUFPLFFBQVE7QUFBQSxJQUNwQjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLENBQUM7IiwKICAibmFtZXMiOiBbImxvZyIsICJsb2ciLCAibG9nIiwgImxvZyIsICJTVVBBQkFTRV9VUkwiLCAiU1VQQUJBU0VfQU5PTiIsICJDT05UQV9URVNURSIsICJBRE1JTl9URUwiLCAiaXNDb250YVRlc3RlIiwgIkNPTlRBX1RFU1RFIiwgImlzQ29udGFUZXN0ZSIsICJsb2ciLCAiX2EiXQp9Cg==
