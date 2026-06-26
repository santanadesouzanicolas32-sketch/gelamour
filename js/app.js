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
        if (result.error.name !== "NetworkError") {
          this.rateLimiter.attempts++;
          if (this.rateLimiter.attempts >= 5) {
            this.rateLimiter.blockedUntil = Date.now() + 6e4;
            this.rateLimiter.attempts = 0;
            return fail(new RateLimitError(6e4));
          }
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
  async function girar(_cliente, onResultado) {
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
  var _pixItens = [];
  var _pixEndereco = "";
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
    var _a, _b;
    _pixPedidoId = pedidoId;
    _pixMsgWA = msgWA;
    _pixTotal = total;
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
      const data = await resp.json();
      if (_pixCancelled) return;
      if (resp.status === 503 || data.error && data.error.includes("QR Code")) {
        if (pixStatus) {
          pixStatus.textContent = "\u26A0\uFE0F QR Code temporariamente indispon\xEDvel. Aguarde 10s e feche para tentar novamente.";
          pixStatus.className = "pix-status";
        }
        if (pixCodeBox) pixCodeBox.textContent = "Indispon\xEDvel no momento.";
        if (pixJaPagueiBtn) pixJaPagueiBtn.style.display = "block";
        log6.warn("QR Code indispon\xEDvel", { payment_id: data.payment_id });
        return;
      }
      if (!resp.ok || data.error) throw new Error((_b = data.error) != null ? _b : "HTTP " + resp.status);
      if (!data.qr_code) throw new Error("QR Code n\xE3o retornado pelo servidor");
      _pixPayload = data.qr_code;
      if (pixCodeBox) pixCodeBox.textContent = _pixPayload;
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
          pixStatus.textContent = "\u23F0 Tempo esgotado. Feche e gere um novo Pix se precisar.";
          pixStatus.className = "pix-status";
        }
        if (pixJaPagueiBtn) pixJaPagueiBtn.style.display = "block";
      }, 30 * 60 * 1e3);
    } catch (e) {
      if (_pixCancelled) return;
      log6.warn("Erro ao criar Pix", { error: String(e) });
      if (pixCodeBox) pixCodeBox.textContent = "Erro ao gerar c\xF3digo.";
      if (pixStatus) {
        pixStatus.textContent = "\u26A0\uFE0F Falha ao gerar QR Code. Verifique sua conex\xE3o e tente novamente.";
        pixStatus.className = "pix-status";
      }
      if (pixJaPagueiBtn) pixJaPagueiBtn.style.display = "block";
    }
  }
  function selecionarTipoCartao(tipo) {
    var _a, _b;
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
        const isUserMsg = result.error.name === "ValidationError" || result.error.name === "RateLimitError";
        const msg = isUserMsg ? result.error.message : "Sem conex\xE3o com o servidor. Verifique sua internet e tente novamente.";
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
        const isUserMsg = result.error.name === "ValidationError" || result.error.name === "RateLimitError";
        const cadastroMsg = isUserMsg ? result.error.message : "Erro ao cadastrar. Verifique sua conex\xE3o e tente novamente.";
        if (erro) {
          erro.textContent = cadastroMsg;
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
        if (!result.ok && result.error.name === "NetworkError") {
          log6.warn("Revalida\xE7\xE3o offline \u2014 usando sess\xE3o local", { tel: `***${clienteSessao.telefone.slice(-4)}` });
          entrarComCliente(clienteSessao.toJSON());
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3V0aWxzL3RvYXN0LnRzIiwgIi4uL3NyYy91dGlscy9zZWN1cml0eS50cyIsICIuLi9zcmMvdXRpbHMvZm9ybWF0LnRzIiwgIi4uL3NyYy9jb3JlL2Vycm9ycy50cyIsICIuLi9zcmMvZG9tYWluL2NsaWVudGUudHMiLCAiLi4vc3JjL2NvcmUvcmVzdWx0LnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQudHMiLCAiLi4vc3JjL2NvcmUvbG9nZ2VyLnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9DbGllbnRlUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvZG9tYWluL3BlZGlkby50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUGVkaWRvUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUm9sZXRhUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvY29yZS9ldmVudHMudHMiLCAiLi4vc3JjL3N0YXRlL1N0b3JlLnRzIiwgIi4uL3NyYy9zdGF0ZS9BcHBTdG9yZS50cyIsICIuLi9zcmMvYXBwbGljYXRpb24vYXV0aC9Mb2dpblVzZUNhc2UudHMiLCAiLi4vc3JjL2FwcGxpY2F0aW9uL2NhcnQvQ2FydFNlcnZpY2UudHMiLCAiLi4vc3JjL2NvbnRhaW5lci50cyIsICIuLi9zcmMvbW9kdWxlcy9yb2xldGEudHMiLCAiLi4vc3JjL21vZHVsZXMvY2FydC50cyIsICIuLi9zcmMvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUb2FzdFRpcG8gfSBmcm9tICcuLi90eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBtb3N0cmFyVG9hc3QobXNnOiBzdHJpbmcsIHRpcG86IFRvYXN0VGlwbyA9ICdpbmZvJyk6IHZvaWQge1xuICBjb25zdCBvbGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnX3RvYXN0Jyk7XG4gIGlmIChvbGQpIG9sZC5yZW1vdmUoKTtcbiAgY29uc3QgdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0LmlkID0gJ190b2FzdCc7XG4gIHQudGV4dENvbnRlbnQgPSBtc2c7XG4gIGNvbnN0IGJnID0gdGlwbyA9PT0gJ2Vycm8nID8gJyNlZjQ0NDQnIDogdGlwbyA9PT0gJ29rJyA/ICcjMjJjNTVlJyA6ICcjNEEyQzE3JztcbiAgT2JqZWN0LmFzc2lnbih0LnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdmaXhlZCcsIGJvdHRvbTogJzkwcHgnLCBsZWZ0OiAnNTAlJyxcbiAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKC01MCUpJyxcbiAgICBiYWNrZ3JvdW5kOiBiZywgY29sb3I6ICcjZmZmJywgcGFkZGluZzogJzEycHggMjJweCcsXG4gICAgYm9yZGVyUmFkaXVzOiAnMzBweCcsIGZvbnRTaXplOiAnMTRweCcsIGZvbnRXZWlnaHQ6ICc2MDAnLFxuICAgIHpJbmRleDogJzk5OTk5JywgYm94U2hhZG93OiAnMCA2cHggMjRweCByZ2JhKDAsMCwwLDAuMyknLFxuICAgIG1heFdpZHRoOiAnOTB2dycsIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgdHJhbnNpdGlvbjogJ29wYWNpdHkgLjNzJywgb3BhY2l0eTogJzEnLFxuICAgIGZvbnRGYW1pbHk6IFwiJ0RNIFNhbnMnLCBzYW5zLXNlcmlmXCIsXG4gIH0gYXMgUGFydGlhbDxDU1NTdHlsZURlY2xhcmF0aW9uPik7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodCk7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHQuc3R5bGUub3BhY2l0eSA9ICcwJztcbiAgICBzZXRUaW1lb3V0KCgpID0+IHQucmVtb3ZlKCksIDM1MCk7XG4gIH0sIDM1MDApO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBlc2NIVE1MKHM6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gU3RyaW5nKHMpXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6YXJUZWxlZm9uZSh0ZWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZWwucmVwbGFjZSgvXFxEL2csICcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6YXJOb21lKG5vbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBub21lXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAuc3BsaXQoJyAnKVxuICAgIC5tYXAocCA9PiBwLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcC5zbGljZSgxKSlcbiAgICAuam9pbignICcpXG4gICAgLnRyaW0oKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gZm9ybWF0YXJNb2VkYSh2YWxvcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuICdSJCAnICsgdmFsb3IudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbWFuYUF0dWFsKCk6IHN0cmluZyB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IHN0YXJ0T2ZZZWFyID0gbmV3IERhdGUobm93LmdldEZ1bGxZZWFyKCksIDAsIDEpO1xuICBjb25zdCBkYXlPZlllYXIgPSBNYXRoLmZsb29yKChub3cuZ2V0VGltZSgpIC0gc3RhcnRPZlllYXIuZ2V0VGltZSgpKSAvIDg2NDAwMDAwKTtcbiAgY29uc3Qgd2Vla051bSA9IE1hdGguY2VpbCgoZGF5T2ZZZWFyICsgc3RhcnRPZlllYXIuZ2V0RGF5KCkgKyAxKSAvIDcpO1xuICByZXR1cm4gYCR7bm93LmdldEZ1bGxZZWFyKCl9LVcke1N0cmluZyh3ZWVrTnVtKS5wYWRTdGFydCgyLCAnMCcpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcGxpY2FyTWFzY2FyYVRlbGVmb25lKHZhbG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBkID0gdmFsb3IucmVwbGFjZSgvXFxEL2csICcnKS5zbGljZSgwLCAxMSk7XG4gIGlmIChkLmxlbmd0aCA8PSAyKSByZXR1cm4gZDtcbiAgaWYgKGQubGVuZ3RoIDw9IDcpIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyKX1gO1xuICBpZiAoZC5sZW5ndGggPD0gMTEpIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyLCA3KX0tJHtkLnNsaWNlKDcpfWA7XG4gIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyLCA3KX0tJHtkLnNsaWNlKDcsIDExKX1gO1xufVxuIiwgImV4cG9ydCBjbGFzcyBBcHBFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIHB1YmxpYyByZWFkb25seSBjb2RlOiBzdHJpbmcsXG4gICAgcHVibGljIHJlYWRvbmx5IHN0YXR1c0NvZGU6IG51bWJlciA9IDUwMCxcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdBcHBFcnJvcic7XG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIEFwcEVycm9yLnByb3RvdHlwZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBzdXBlcihtZXNzYWdlLCAnVkFMSURBVElPTl9FUlJPUicsIDQwMCwgY29udGV4dCk7XG4gICAgdGhpcy5uYW1lID0gJ1ZhbGlkYXRpb25FcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5ldHdvcmtFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBzdXBlcihtZXNzYWdlLCAnTkVUV09SS19FUlJPUicsIDUwMywgY29udGV4dCk7XG4gICAgdGhpcy5uYW1lID0gJ05ldHdvcmtFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEF1dGhFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSwgJ0FVVEhfRVJST1InLCA0MDEpO1xuICAgIHRoaXMubmFtZSA9ICdBdXRoRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb3RGb3VuZEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXNvdXJjZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYCR7cmVzb3VyY2V9IG5cdTAwRTNvIGVuY29udHJhZG9gLCAnTk9UX0ZPVU5EJywgNDA0KTtcbiAgICB0aGlzLm5hbWUgPSAnTm90Rm91bmRFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJhdGVMaW1pdEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXRyeUFmdGVyTXM6IG51bWJlcikge1xuICAgIHN1cGVyKGBNdWl0YXMgdGVudGF0aXZhcy4gQWd1YXJkZSAke01hdGguY2VpbChyZXRyeUFmdGVyTXMgLyAxMDAwKX1zLmAsICdSQVRFX0xJTUlUJywgNDI5LCB7IHJldHJ5QWZ0ZXJNcyB9KTtcbiAgICB0aGlzLm5hbWUgPSAnUmF0ZUxpbWl0RXJyb3InO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vY29yZS9lcnJvcnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENsaWVudGVQcm9wcyB7XG4gIGlkPzogbnVtYmVyO1xuICBub21lOiBzdHJpbmc7XG4gIHRlbGVmb25lOiBzdHJpbmc7XG4gIGVuZGVyZWNvPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ2xpZW50ZSB7XG4gIHJlYWRvbmx5IGlkPzogbnVtYmVyO1xuICByZWFkb25seSBub21lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHRlbGVmb25lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGVuZGVyZWNvPzogc3RyaW5nO1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJvcHM6IENsaWVudGVQcm9wcykge1xuICAgIHRoaXMuaWQgPSBwcm9wcy5pZDtcbiAgICB0aGlzLm5vbWUgPSBwcm9wcy5ub21lO1xuICAgIHRoaXMudGVsZWZvbmUgPSBwcm9wcy50ZWxlZm9uZTtcbiAgICB0aGlzLmVuZGVyZWNvID0gcHJvcHMuZW5kZXJlY287XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlKHByb3BzOiBDbGllbnRlUHJvcHMpOiBDbGllbnRlIHtcbiAgICBjb25zdCB0ZWwgPSBwcm9wcy50ZWxlZm9uZS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgIGlmICh0ZWwubGVuZ3RoIDwgMTAgfHwgdGVsLmxlbmd0aCA+IDExKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdUZWxlZm9uZSBpbnZcdTAwRTFsaWRvJywgeyB0ZWxlZm9uZTogcHJvcHMudGVsZWZvbmUgfSk7XG4gICAgfVxuICAgIGlmICghcHJvcHMubm9tZS50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ05vbWUgblx1MDBFM28gcG9kZSBzZXIgdmF6aW8nKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDbGllbnRlKHtcbiAgICAgIC4uLnByb3BzLFxuICAgICAgdGVsZWZvbmU6IHRlbCxcbiAgICAgIG5vbWU6IENsaWVudGUubm9ybWFsaXphck5vbWUocHJvcHMubm9tZSksXG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbURCKHJhdzogQ2xpZW50ZVByb3BzKTogQ2xpZW50ZSB7XG4gICAgcmV0dXJuIG5ldyBDbGllbnRlKHJhdyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBub3JtYWxpemFyTm9tZShub21lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBub21lLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKVxuICAgICAgLm1hcChwID0+IHAuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwLnNsaWNlKDEpKVxuICAgICAgLmpvaW4oJyAnKS50cmltKCk7XG4gIH1cblxuICB3aXRoRW5kZXJlY28oZW5kZXJlY286IHN0cmluZyk6IENsaWVudGUge1xuICAgIHJldHVybiBDbGllbnRlLmZyb21EQih7IC4uLnRoaXMudG9KU09OKCksIGVuZGVyZWNvIH0pO1xuICB9XG5cbiAgdG9KU09OKCk6IENsaWVudGVQcm9wcyB7XG4gICAgcmV0dXJuIHsgaWQ6IHRoaXMuaWQsIG5vbWU6IHRoaXMubm9tZSwgdGVsZWZvbmU6IHRoaXMudGVsZWZvbmUsIGVuZGVyZWNvOiB0aGlzLmVuZGVyZWNvIH07XG4gIH1cbn1cbiIsICJleHBvcnQgdHlwZSBSZXN1bHQ8VCwgRSBleHRlbmRzIEVycm9yID0gRXJyb3I+ID1cbiAgfCB7IHJlYWRvbmx5IG9rOiB0cnVlOyByZWFkb25seSB2YWx1ZTogVCB9XG4gIHwgeyByZWFkb25seSBvazogZmFsc2U7IHJlYWRvbmx5IGVycm9yOiBFIH07XG5cbmV4cG9ydCBjb25zdCBvayA9IDxUPih2YWx1ZTogVCk6IFJlc3VsdDxULCBuZXZlcj4gPT4gKHsgb2s6IHRydWUsIHZhbHVlIH0pO1xuZXhwb3J0IGNvbnN0IGZhaWwgPSA8RSBleHRlbmRzIEVycm9yPihlcnJvcjogRSk6IFJlc3VsdDxuZXZlciwgRT4gPT4gKHsgb2s6IGZhbHNlLCBlcnJvciB9KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzT2s8VCwgRSBleHRlbmRzIEVycm9yPihyOiBSZXN1bHQ8VCwgRT4pOiByIGlzIHsgb2s6IHRydWU7IHZhbHVlOiBUIH0ge1xuICByZXR1cm4gci5vaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcDxUPihyOiBSZXN1bHQ8VD4sIGZhbGxiYWNrPzogVCk6IFQge1xuICBpZiAoci5vaykgcmV0dXJuIHIudmFsdWU7XG4gIGlmIChmYWxsYmFjayAhPT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsbGJhY2s7XG4gIHRocm93IHIuZXJyb3I7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0cnlBc3luYzxUPihmbjogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8UmVzdWx0PFQ+PiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG9rKGF3YWl0IGZuKCkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhaWwoZSBpbnN0YW5jZW9mIEVycm9yID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IE5ldHdvcmtFcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcblxuY29uc3QgU1VQQUJBU0VfVVJMID0gYXRvYignYUhSMGNITTZMeTl5Wm1KMFpIUjJjMjVtZEhsaVlYcG1iV1JpZHk1emRYQmhZbUZ6WlM1amJ3PT0nKTtcbmNvbnN0IFNVUEFCQVNFX0FOT04gPSBhdG9iKCdaWGxLYUdKSFkybFBhVXBKVlhwSk1VNXBTWE5KYmxJMVkwTkpOa2xyY0ZoV1EwbzVMbVY1U25Cak0wMXBUMmxLZW1SWVFtaFpiVVo2V2xOSmMwbHVTbXhhYVVrMlNXNUtiVmx1VW10a1NGcDZZbTFhTUdWWFNtaGxiVnAwV2tkS00wbHBkMmxqYlRseldsTkpOa2x0Um5WaU1qUnBURU5LY0ZsWVVXbFBha1V6VDBSRk5VMVVRWHBPYWtGelNXMVdOR05EU1RaTmFrRTFUbnBSTkU1cVRUSk5TREF1U0hjMk9HcFJSa1p0ZDB4bmRuZEdPWHBxYUdkV1YxQmpNMFF4VVRKd1ptZEJiakZVVVd4S1JWWjFOQT09Jyk7XG5jb25zdCBUSU1FT1VUX01TID0gMTBfMDAwO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1cGFiYXNlRmV0Y2hPcHRpb25zIGV4dGVuZHMgUmVxdWVzdEluaXQge1xuICB0aW1lb3V0PzogbnVtYmVyO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VGZXRjaChcbiAgcGF0aDogc3RyaW5nLFxuICBvcHRzOiBTdXBhYmFzZUZldGNoT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IHsgdGltZW91dCA9IFRJTUVPVVRfTVMsIC4uLmZldGNoT3B0cyB9ID0gb3B0cztcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgdGltZW91dCk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtTVVBBQkFTRV9BTk9OfWAsXG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgJ1ByZWZlcic6ICdyZXR1cm49cmVwcmVzZW50YXRpb24nLFxuICAgICAgLi4uKChmZXRjaE9wdHMuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSA/PyB7fSksXG4gICAgfTtcblxuICAgIHJldHVybiBhd2FpdCBmZXRjaChgJHtTVVBBQkFTRV9VUkx9JHtwYXRofWAsIHtcbiAgICAgIC4uLmZldGNoT3B0cyxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvciAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykge1xuICAgICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcignVGltZW91dDogc2Vydmlkb3Igblx1MDBFM28gcmVzcG9uZGV1JywgeyBwYXRoIH0pO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdFcnJvIGRlIHJlZGUnLCB7IHBhdGgsIGNhdXNlOiBTdHJpbmcoZSkgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VHZXQ8VD4oXG4gIHRhYmxlOiBzdHJpbmcsXG4gIHF1ZXJ5ID0gJydcbik6IFByb21pc2U8VFtdPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvcmVzdC92MS8ke3RhYmxlfSR7cXVlcnkgPyAnPycgKyBxdWVyeSA6ICcnfWApO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCkuY2F0Y2goKCkgPT4gJycpO1xuICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYEdFVCAke3RhYmxlfSBmYWxob3UgKCR7cmVzcC5zdGF0dXN9KWAsIHsgc3RhdHVzOiByZXNwLnN0YXR1cywgYm9keSB9KTtcbiAgfVxuICByZXR1cm4gcmVzcC5qc29uKCkgYXMgUHJvbWlzZTxUW10+O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VQb3N0PFQ+KFxuICB0YWJsZTogc3RyaW5nLFxuICBkYXRhOiBQYXJ0aWFsPFQ+XG4pOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IHN1cGFiYXNlRmV0Y2goYC9yZXN0L3YxLyR7dGFibGV9YCwge1xuICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICB9KTtcbiAgaWYgKCFyZXNwLm9rKSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3AudGV4dCgpO1xuICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYFBPU1QgJHt0YWJsZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xuICB9XG4gIGNvbnN0IHJvd3MgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBUW107XG4gIHJldHVybiByb3dzWzBdITtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN1cGFiYXNlUGF0Y2g8VD4oXG4gIHRhYmxlOiBzdHJpbmcsXG4gIHF1ZXJ5OiBzdHJpbmcsXG4gIGRhdGE6IFBhcnRpYWw8VD5cbik6IFByb21pc2U8VFtdPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvcmVzdC92MS8ke3RhYmxlfT8ke3F1ZXJ5fWAsIHtcbiAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gIH0pO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgUEFUQ0ggJHt0YWJsZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xuICB9XG4gIHJldHVybiByZXNwLmpzb24oKSBhcyBQcm9taXNlPFRbXT47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsRnVuY3Rpb248VD4obmFtZTogc3RyaW5nLCBib2R5OiB1bmtub3duKTogUHJvbWlzZTxUPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvZnVuY3Rpb25zL3YxLyR7bmFtZX1gLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gIH0pO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBlcnIgPSBhd2FpdCByZXNwLnRleHQoKTtcbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKGBFZGdlIEZ1bmN0aW9uICR7bmFtZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5OiBlcnIgfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3AuanNvbigpIGFzIFByb21pc2U8VD47XG59XG5cbmV4cG9ydCB7IFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfQU5PTiB9O1xuIiwgInR5cGUgTG9nTGV2ZWwgPSAnZGVidWcnIHwgJ2luZm8nIHwgJ3dhcm4nIHwgJ2Vycm9yJztcblxuaW50ZXJmYWNlIExvZ0VudHJ5IHtcbiAgbGV2ZWw6IExvZ0xldmVsO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xuICBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59XG5cbmNsYXNzIExvZ2dlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcHJlZml4OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHJlZml4ID0gJ0dlbGFtb3VyJykge1xuICAgIHRoaXMucHJlZml4ID0gcHJlZml4O1xuICB9XG5cbiAgcHJpdmF0ZSBsb2cobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xuICAgIGNvbnN0IGVudHJ5OiBMb2dFbnRyeSA9IHtcbiAgICAgIGxldmVsLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgY29udGV4dCxcbiAgICB9O1xuXG4gICAgY29uc3Qgc3R5bGUgPSB7XG4gICAgICBkZWJ1ZzogJ2NvbG9yOiAjNkI3MjgwJyxcbiAgICAgIGluZm86ICAnY29sb3I6ICMzQjgyRjYnLFxuICAgICAgd2FybjogICdjb2xvcjogI0Y1OUUwQicsXG4gICAgICBlcnJvcjogJ2NvbG9yOiAjRUY0NDQ0OyBmb250LXdlaWdodDogYm9sZCcsXG4gICAgfVtsZXZlbF07XG5cbiAgICBjb25zdCBmb3JtYXR0ZWQgPSBgWyR7dGhpcy5wcmVmaXh9XSAke2VudHJ5LnRpbWVzdGFtcH0gJHttZXNzYWdlfWA7XG5cbiAgICBpZiAobGV2ZWwgPT09ICdlcnJvcicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH0gZWxzZSBpZiAobGV2ZWwgPT09ICd3YXJuJykge1xuICAgICAgY29uc29sZS53YXJuKGAlYyR7Zm9ybWF0dGVkfWAsIHN0eWxlLCBjb250ZXh0ID8/ICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH1cbiAgfVxuXG4gIGRlYnVnKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgeyB0aGlzLmxvZygnZGVidWcnLCBtc2csIGN0eCk7IH1cbiAgaW5mbyhtc2c6IHN0cmluZywgY3R4PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkICB7IHRoaXMubG9nKCdpbmZvJywgIG1zZywgY3R4KTsgfVxuICB3YXJuKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgIHsgdGhpcy5sb2coJ3dhcm4nLCAgbXNnLCBjdHgpOyB9XG4gIGVycm9yKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgeyB0aGlzLmxvZygnZXJyb3InLCBtc2csIGN0eCk7IH1cblxuICBjaGlsZChwcmVmaXg6IHN0cmluZyk6IExvZ2dlciB7IHJldHVybiBuZXcgTG9nZ2VyKGAke3RoaXMucHJlZml4fToke3ByZWZpeH1gKTsgfVxufVxuXG5leHBvcnQgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuIiwgImltcG9ydCB0eXBlIHsgSUNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lDbGllbnRlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBDbGllbnRlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2NsaWVudGUnO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VHZXQsIHN1cGFiYXNlUG9zdCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdDbGllbnRlUmVwbycpO1xuXG5leHBvcnQgY2xhc3MgQ2xpZW50ZVJlcG9zaXRvcnkgaW1wbGVtZW50cyBJQ2xpZW50ZVJlcG9zaXRvcnkge1xuICBhc3luYyBmaW5kQnlUZWxlZm9uZSh0ZWxlZm9uZTogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZSB8IG51bGw+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZygnZmluZEJ5VGVsZWZvbmUnLCB7IHRlbGVmb25lOiBgKioqJHt0ZWxlZm9uZS5zbGljZSgtNCl9YCB9KTtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDxSZXR1cm5UeXBlPENsaWVudGVbJ3RvSlNPTiddPj4oXG4gICAgICAgICdjbGllbnRlcycsXG4gICAgICAgIGB0ZWxlZm9uZT1lcS4ke3RlbGVmb25lfSZsaW1pdD0xYFxuICAgICAgKTtcbiAgICAgIHJldHVybiByb3dzWzBdID8gQ2xpZW50ZS5mcm9tREIocm93c1swXSkgOiBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2F2ZShjbGllbnRlOiBDbGllbnRlKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZT4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gYXdhaXQgc3VwYWJhc2VQb3N0PFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+PihcbiAgICAgICAgJ2NsaWVudGVzJyxcbiAgICAgICAgY2xpZW50ZS50b0pTT04oKVxuICAgICAgKTtcbiAgICAgIHJldHVybiBDbGllbnRlLmZyb21EQihyb3cpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlRW5kZXJlY28oaWQ6IG51bWJlciwgZW5kZXJlY286IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlUGF0Y2goJ2NsaWVudGVzJywgYGlkPWVxLiR7aWR9YCwgeyBlbmRlcmVjbyB9KTtcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uL2NvcmUvZXJyb3JzJztcblxuZXhwb3J0IGludGVyZmFjZSBJdGVtUGVkaWRvIHtcbiAgcmVhZG9ubHkgbm9tZTogc3RyaW5nO1xuICByZWFkb25seSBwcmVjbzogbnVtYmVyO1xufVxuXG5leHBvcnQgdHlwZSBTdGF0dXNQZWRpZG8gPSAncGVuZGVudGUnIHwgJ2NvbmZpcm1hZG8nIHwgJ2NhbmNlbGFkbyc7XG5leHBvcnQgdHlwZSBTdGF0dXNQYWdhbWVudG8gPSAnYWd1YXJkYW5kbycgfCAncGFnbycgfCAnZmFsaG91JztcbmV4cG9ydCB0eXBlIFRpcG9QYWdhbWVudG8gPSAnUGl4JyB8ICdEaW5oZWlybycgfCAnQ2FydFx1MDBFM28nO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBlZGlkb1Byb3BzIHtcbiAgaWQ/OiBudW1iZXI7XG4gIG5vbWU6IHN0cmluZztcbiAgdGVsZWZvbmU6IHN0cmluZztcbiAgZW5kZXJlY286IHN0cmluZztcbiAgcGFnYW1lbnRvOiBUaXBvUGFnYW1lbnRvO1xuICBpdGVuczogSXRlbVBlZGlkb1tdO1xuICB0b3RhbDogbnVtYmVyO1xuICBzdGF0dXM6IFN0YXR1c1BlZGlkbztcbiAgc3RhdHVzX3BhZ2FtZW50bz86IFN0YXR1c1BhZ2FtZW50bztcbiAgb2JzZXJ2YWNhbz86IHN0cmluZztcbiAgYXNhYXNfcGF5bWVudF9pZD86IHN0cmluZztcbiAgY2xpZW50ZV9pZD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFBlZGlkbyB7XG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBwcm9wczogUGVkaWRvUHJvcHMpIHt9XG5cbiAgc3RhdGljIGNyZWF0ZShwcm9wczogT21pdDxQZWRpZG9Qcm9wcywgJ3N0YXR1cycgfCAndG90YWwnPik6IFBlZGlkbyB7XG4gICAgaWYgKCFwcm9wcy5pdGVucy5sZW5ndGgpIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1BlZGlkbyBkZXZlIHRlciBhbyBtZW5vcyAxIGl0ZW0nKTtcbiAgICBpZiAoIXByb3BzLm5vbWUudHJpbSgpKSB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdOb21lIG9icmlnYXRcdTAwRjNyaW8nKTtcbiAgICBpZiAoIXByb3BzLmVuZGVyZWNvLnRyaW0oKSkgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignRW5kZXJlXHUwMEU3byBvYnJpZ2F0XHUwMEYzcmlvJyk7XG4gICAgY29uc3QgdG90YWwgPSBwcm9wcy5pdGVucy5yZWR1Y2UoKHMsIGkpID0+IE1hdGgucm91bmQoKHMgKyBpLnByZWNvKSAqIDEwMCkgLyAxMDAsIDApO1xuICAgIHJldHVybiBuZXcgUGVkaWRvKHsgLi4ucHJvcHMsIHRvdGFsLCBzdGF0dXM6ICdwZW5kZW50ZScgfSk7XG4gIH1cblxuICBzdGF0aWMgZnJvbURCKHJhdzogUGVkaWRvUHJvcHMpOiBQZWRpZG8geyByZXR1cm4gbmV3IFBlZGlkbyhyYXcpOyB9XG5cbiAgZ2V0IGlkKCk6IG51bWJlciB8IHVuZGVmaW5lZCB7IHJldHVybiB0aGlzLnByb3BzLmlkOyB9XG4gIGdldCB0b3RhbCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5wcm9wcy50b3RhbDsgfVxuICBnZXQgaXRlbnMoKTogcmVhZG9ubHkgSXRlbVBlZGlkb1tdIHsgcmV0dXJuIHRoaXMucHJvcHMuaXRlbnM7IH1cbiAgZ2V0IHBhZ2FtZW50bygpOiBUaXBvUGFnYW1lbnRvIHsgcmV0dXJuIHRoaXMucHJvcHMucGFnYW1lbnRvOyB9XG4gIGdldCBzdGF0dXNQYWdhbWVudG8oKTogU3RhdHVzUGFnYW1lbnRvIHwgdW5kZWZpbmVkIHsgcmV0dXJuIHRoaXMucHJvcHMuc3RhdHVzX3BhZ2FtZW50bzsgfVxuXG4gIGZvcm1hdGFyTWVuc2FnZW1XQSh3YU51bWJlcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBpdGVuc1N0ciA9IHRoaXMucHJvcHMuaXRlbnMubWFwKGkgPT5cbiAgICAgIGBcdTI1QjggJHtpLm5vbWV9IFx1MjAxNCBSJCAke2kucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX1gXG4gICAgKS5qb2luKCdcXG4nKTtcbiAgICBjb25zdCBtc2cgPSBbXG4gICAgICAnXHVEODNEXHVERUNEXHVGRTBGICpOT1ZPIFBFRElETyBcdTIwMTQgR0VMQU1PVVIqJyxcbiAgICAgICcnLFxuICAgICAgaXRlbnNTdHIsXG4gICAgICAnJyxcbiAgICAgIGAqVG90YWw6IFIkICR7dGhpcy5wcm9wcy50b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfSpgLFxuICAgICAgYCpQYWdhbWVudG86ICR7dGhpcy5wcm9wcy5wYWdhbWVudG99KmAsXG4gICAgICAnJyxcbiAgICAgIGBcdUQ4M0RcdURDNjQgJHt0aGlzLnByb3BzLm5vbWV9YCxcbiAgICAgIGBcdUQ4M0RcdURDQ0QgJHt0aGlzLnByb3BzLmVuZGVyZWNvfWAsXG4gICAgICB0aGlzLnByb3BzLm9ic2VydmFjYW8gPyBgXHVEODNEXHVEQ0REICR7dGhpcy5wcm9wcy5vYnNlcnZhY2FvfWAgOiAnJyxcbiAgICBdLmZpbHRlcihCb29sZWFuKS5qb2luKCdcXG4nKTtcbiAgICByZXR1cm4gYGh0dHBzOi8vd2EubWUvJHt3YU51bWJlcn0/dGV4dD0ke2VuY29kZVVSSUNvbXBvbmVudChtc2cpfWA7XG4gIH1cblxuICB0b0pTT04oKTogUGVkaWRvUHJvcHMgeyByZXR1cm4geyAuLi50aGlzLnByb3BzIH07IH1cbn1cbiIsICJpbXBvcnQgdHlwZSB7IElQZWRpZG9SZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lQZWRpZG9SZXBvc2l0b3J5JztcbmltcG9ydCB7IFBlZGlkbyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuaW1wb3J0IHR5cGUgeyBQZWRpZG9Qcm9wcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VGZXRjaCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfQU5PTiB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IE5ldHdvcmtFcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdQZWRpZG9SZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBQZWRpZG9SZXBvc2l0b3J5IGltcGxlbWVudHMgSVBlZGlkb1JlcG9zaXRvcnkge1xuICBhc3luYyBzYXZlKHBlZGlkbzogUGVkaWRvKTogUHJvbWlzZTxSZXN1bHQ8UGVkaWRvPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBsb2cuaW5mbygnU2FsdmFuZG8gcGVkaWRvJywgeyB0b3RhbDogcGVkaWRvLnRvdGFsIH0pO1xuICAgICAgLy8gVXNhIGhlYWRlcnMtb25seSBwYXJhIG9idGVyIG8gSUQgdmlhIExvY2F0aW9uXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgc3VwYWJhc2VGZXRjaChgL3Jlc3QvdjEvcGVkaWRvc2AsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ1ByZWZlcic6ICdyZXR1cm49aGVhZGVycy1vbmx5JyB9IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBlZGlkby50b0pTT04oKSksXG4gICAgICB9KTtcbiAgICAgIGlmICghcmVzcC5vaykge1xuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYFBPU1QgcGVkaWRvcyBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHkgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBsb2MgPSByZXNwLmhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpID8/ICcnO1xuICAgICAgY29uc3QgaWRNYXRjaCA9IGxvYy5tYXRjaCgvaWQ9ZXFcXC4oXFxkKykvKTtcbiAgICAgIGlmICghaWRNYXRjaCkgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcignSUQgZG8gcGVkaWRvIG5cdTAwRTNvIHJldG9ybmFkbycpO1xuICAgICAgY29uc3QgaWQgPSBwYXJzZUludChpZE1hdGNoWzFdISwgMTApO1xuICAgICAgcmV0dXJuIFBlZGlkby5mcm9tREIoeyAuLi5wZWRpZG8udG9KU09OKCksIGlkIH0gYXMgUGVkaWRvUHJvcHMpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlU3RhdHVzKGlkOiBudW1iZXIsIGNsaWVudGVJZDogbnVtYmVyLCBzdGF0dXM6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlUGF0Y2goXG4gICAgICAgICdwZWRpZG9zJyxcbiAgICAgICAgYGlkPWVxLiR7aWR9JmNsaWVudGVfaWQ9ZXEuJHtjbGllbnRlSWR9YCxcbiAgICAgICAgeyBzdGF0dXMgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRCeUlkKGlkOiBudW1iZXIpOiBQcm9taXNlPFJlc3VsdDxQZWRpZG8gfCBudWxsPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goXG4gICAgICAgIGAke1NVUEFCQVNFX1VSTH0vcmVzdC92MS9wZWRpZG9zP2lkPWVxLiR7aWR9JnNlbGVjdD1zdGF0dXNfcGFnYW1lbnRvYCxcbiAgICAgICAgeyBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtTVVBBQkFTRV9BTk9OfWAgfSB9XG4gICAgICApO1xuICAgICAgaWYgKCFyZXNwLm9rKSB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdHRVQgcGVkaWRvIGZhbGhvdScsIHsgc3RhdHVzOiByZXNwLnN0YXR1cyB9KTtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBQZWRpZG9Qcm9wc1tdO1xuICAgICAgcmV0dXJuIHJvd3NbMF0gPyBQZWRpZG8uZnJvbURCKHJvd3NbMF0pIDogbnVsbDtcbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB0eXBlIHsgSVJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9yZXBvc2l0b3JpZXMvSVJvbGV0YVJlcG9zaXRvcnknO1xuaW1wb3J0IHR5cGUgeyBQYXJ0aWNpcGFjYW9Qcm9wcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9yb2xldGEnO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VHZXQsIHN1cGFiYXNlUG9zdCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdSb2xldGFSZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBSb2xldGFSZXBvc2l0b3J5IGltcGxlbWVudHMgSVJvbGV0YVJlcG9zaXRvcnkge1xuICBhc3luYyBmaW5kUGFydGljaXBhY2FvQXRpdmEoXG4gICAgdGVsZWZvbmU6IHN0cmluZyxcbiAgICBzZW1hbmE6IHN0cmluZ1xuICApOiBQcm9taXNlPFJlc3VsdDxQYXJ0aWNpcGFjYW9Qcm9wcyB8IG51bGw+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGxvZy5kZWJ1ZygnZmluZFBhcnRpY2lwYWNhb0F0aXZhJywgeyBzZW1hbmEgfSk7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgc3VwYWJhc2VHZXQ8UGFydGljaXBhY2FvUHJvcHM+KFxuICAgICAgICAncm9sZXRhX3BhcnRpY2lwYWNvZXMnLFxuICAgICAgICBgdGVsZWZvbmU9ZXEuJHt0ZWxlZm9uZX0mc2VtYW5hPWVxLiR7c2VtYW5hfSZvcmRlcj1jcmVhdGVkX2F0LmRlc2MmbGltaXQ9MWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gcm93c1swXSA/PyBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVBhcnRpY2lwYWNhbyhcbiAgICBkYXRhOiBQYXJ0aWFsPFBhcnRpY2lwYWNhb1Byb3BzPlxuICApOiBQcm9taXNlPFJlc3VsdDxQYXJ0aWNpcGFjYW9Qcm9wcz4+IHtcbiAgICAvLyBTZSB0ZW0gaWQsIGZheiBQQVRDSDsgc2VuXHUwMEUzbyBJTlNFUlRcbiAgICBpZiAoZGF0YS5pZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB7IGlkLCAuLi5wYXRjaCB9ID0gZGF0YTtcbiAgICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHN1cGFiYXNlUGF0Y2g8UGFydGljaXBhY2FvUHJvcHM+KFxuICAgICAgICAgICdyb2xldGFfcGFydGljaXBhY29lcycsXG4gICAgICAgICAgYGlkPWVxLiR7aWR9YCxcbiAgICAgICAgICBwYXRjaFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gKHJvd3NbMF0gPz8geyAuLi5kYXRhIH0pIGFzIFBhcnRpY2lwYWNhb1Byb3BzO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0cnlBc3luYygoKSA9PlxuICAgICAgc3VwYWJhc2VQb3N0PFBhcnRpY2lwYWNhb1Byb3BzPigncm9sZXRhX3BhcnRpY2lwYWNvZXMnLCBkYXRhKVxuICAgICk7XG4gIH1cblxuICBhc3luYyBjb3VudFZlbmNlZG9yZXNTZW1hbmEoc2VtYW5hOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDxudW1iZXI+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDx7IGlkOiBudW1iZXIgfT4oXG4gICAgICAgICdyb2xldGFfdmVuY2Vkb3JlcycsXG4gICAgICAgIGBzZW1hbmE9ZXEuJHtzZW1hbmF9JnNlbGVjdD1pZGBcbiAgICAgICk7XG4gICAgICByZXR1cm4gcm93cy5sZW5ndGg7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzYXZlVmVuY2Vkb3IoXG4gICAgdGVsZWZvbmU6IHN0cmluZyxcbiAgICBub21lOiBzdHJpbmcsXG4gICAgcHJlbWlvOiBzdHJpbmcsXG4gICAgc2VtYW5hOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxSZXN1bHQ8dm9pZD4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc3VwYWJhc2VQb3N0KCdyb2xldGFfdmVuY2Vkb3JlcycsIHsgdGVsZWZvbmUsIG5vbWUsIHByZW1pbywgc2VtYW5hIH0pO1xuICAgIH0pO1xuICB9XG59XG4iLCAidHlwZSBIYW5kbGVyPFQ+ID0gKHBheWxvYWQ6IFQpID0+IHZvaWQ7XG5cbmludGVyZmFjZSBFdmVudE1hcCB7XG4gICdhdXRoOmxvZ2luJzogeyBjbGllbnRlOiBpbXBvcnQoJy4uL2RvbWFpbi9jbGllbnRlJykuQ2xpZW50ZSB9O1xuICAnYXV0aDpsb2dvdXQnOiB2b2lkO1xuICAnY2FydDp1cGRhdGVkJzogeyBjb3VudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH07XG4gICdwYXltZW50OnN1Y2Nlc3MnOiB7IHBlZGlkb0lkOiBudW1iZXI7IHZhbG9yOiBudW1iZXIgfTtcbiAgJ3BheW1lbnQ6ZmFpbGVkJzogeyBlcnJvcjogc3RyaW5nIH07XG4gICdyb2xldGE6cHJlbWlvJzogeyBwcmVtaW86IHN0cmluZyB9O1xuICAndWk6dG9hc3QnOiB7IG1lc3NhZ2U6IHN0cmluZzsgdGlwbzogJ29rJyB8ICdlcnJvJyB8ICdpbmZvJyB9O1xufVxuXG5jbGFzcyBUeXBlZEV2ZW50QnVzIHtcbiAgcHJpdmF0ZSBoYW5kbGVycyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8SGFuZGxlcjx1bmtub3duPj4+KCk7XG5cbiAgb248SyBleHRlbmRzIGtleW9mIEV2ZW50TWFwPihcbiAgICBldmVudDogSyxcbiAgICBoYW5kbGVyOiBIYW5kbGVyPEV2ZW50TWFwW0tdPlxuICApOiAoKSA9PiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaGFuZGxlcnMuaGFzKGV2ZW50KSkgdGhpcy5oYW5kbGVycy5zZXQoZXZlbnQsIG5ldyBTZXQoKSk7XG4gICAgdGhpcy5oYW5kbGVycy5nZXQoZXZlbnQpIS5hZGQoaGFuZGxlciBhcyBIYW5kbGVyPHVua25vd24+KTtcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5oYW5kbGVycy5nZXQoZXZlbnQpPy5kZWxldGUoaGFuZGxlciBhcyBIYW5kbGVyPHVua25vd24+KTtcbiAgfVxuXG4gIGVtaXQ8SyBleHRlbmRzIGtleW9mIEV2ZW50TWFwPihldmVudDogSywgcGF5bG9hZDogRXZlbnRNYXBbS10pOiB2b2lkIHtcbiAgICB0aGlzLmhhbmRsZXJzLmdldChldmVudCk/LmZvckVhY2goaCA9PiB7XG4gICAgICB0cnkgeyBoKHBheWxvYWQpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoYEV2ZW50QnVzIGVycm9yIG9uICR7ZXZlbnR9OmAsIGUpOyB9XG4gICAgfSk7XG4gIH1cblxuICBvbmNlPEsgZXh0ZW5kcyBrZXlvZiBFdmVudE1hcD4oXG4gICAgZXZlbnQ6IEssXG4gICAgaGFuZGxlcjogSGFuZGxlcjxFdmVudE1hcFtLXT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgdW5zdWIgPSB0aGlzLm9uKGV2ZW50LCAocGF5bG9hZCkgPT4geyBoYW5kbGVyKHBheWxvYWQpOyB1bnN1YigpOyB9KTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZXZlbnRCdXMgPSBuZXcgVHlwZWRFdmVudEJ1cygpO1xuIiwgInR5cGUgU2VsZWN0b3I8UywgVD4gPSAoc3RhdGU6IFMpID0+IFQ7XG50eXBlIExpc3RlbmVyPFQ+ID0gKHZhbHVlOiBUKSA9PiB2b2lkO1xuXG5leHBvcnQgY2xhc3MgU3RvcmU8UyBleHRlbmRzIG9iamVjdD4ge1xuICBwcml2YXRlIHN0YXRlOiBTO1xuICBwcml2YXRlIGdsb2JhbExpc3RlbmVycyA9IG5ldyBTZXQ8TGlzdGVuZXI8Uz4+KCk7XG5cbiAgY29uc3RydWN0b3IoaW5pdGlhbFN0YXRlOiBTKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHsgLi4uaW5pdGlhbFN0YXRlIH07XG4gIH1cblxuICBnZXRTdGF0ZSgpOiBSZWFkb25seTxTPiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gIH1cblxuICBzZXRTdGF0ZSh1cGRhdGVyOiBQYXJ0aWFsPFM+IHwgKChzOiBSZWFkb25seTxTPikgPT4gUGFydGlhbDxTPikpOiB2b2lkIHtcbiAgICBjb25zdCBwYXRjaCA9IHR5cGVvZiB1cGRhdGVyID09PSAnZnVuY3Rpb24nXG4gICAgICA/IHVwZGF0ZXIodGhpcy5zdGF0ZSlcbiAgICAgIDogdXBkYXRlcjtcbiAgICB0aGlzLnN0YXRlID0geyAuLi50aGlzLnN0YXRlLCAuLi5wYXRjaCB9O1xuICAgIHRoaXMuZ2xvYmFsTGlzdGVuZXJzLmZvckVhY2gobCA9PiBsKHRoaXMuc3RhdGUpKTtcbiAgfVxuXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXI8Uz4pOiAoKSA9PiB2b2lkIHtcbiAgICB0aGlzLmdsb2JhbExpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICAgIHJldHVybiAoKSA9PiB0aGlzLmdsb2JhbExpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9XG5cbiAgc2VsZWN0PFQ+KHNlbGVjdG9yOiBTZWxlY3RvcjxTLCBUPiwgbGlzdGVuZXI6IExpc3RlbmVyPFQ+KTogKCkgPT4gdm9pZCB7XG4gICAgbGV0IHByZXYgPSBzZWxlY3Rvcih0aGlzLnN0YXRlKTtcbiAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmUoc3RhdGUgPT4ge1xuICAgICAgY29uc3QgbmV4dCA9IHNlbGVjdG9yKHN0YXRlKTtcbiAgICAgIGlmIChuZXh0ICE9PSBwcmV2KSB7XG4gICAgICAgIHByZXYgPSBuZXh0O1xuICAgICAgICBsaXN0ZW5lcihuZXh0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IFN0b3JlIH0gZnJvbSAnLi9TdG9yZSc7XG5pbXBvcnQgdHlwZSB7IENsaWVudGUgfSBmcm9tICcuLi9kb21haW4vY2xpZW50ZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwU3RhdGUge1xuICByZWFkb25seSBjbGllbnRlOiBDbGllbnRlIHwgbnVsbDtcbiAgcmVhZG9ubHkgaXNMb2dnZWRJbjogYm9vbGVhbjtcbiAgcmVhZG9ubHkgaXNBZG1pbjogYm9vbGVhbjtcbiAgcmVhZG9ubHkgY2FycmluaG9Db3VudDogbnVtYmVyO1xuICByZWFkb25seSBjYXJyaW5ob1RvdGFsOiBudW1iZXI7XG4gIHJlYWRvbmx5IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHBlZGlkb0lkUGVuZGVudGU6IG51bWJlciB8IG51bGw7XG4gIHJlYWRvbmx5IHBpeERhdGE6IFBpeERhdGEgfCBudWxsO1xuICByZWFkb25seSByb2xldGFBdGl2YTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQaXhEYXRhIHtcbiAgcmVhZG9ubHkgcXJDb2RlOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHBpeENvcGlhRUNvbGE6IHN0cmluZztcbiAgcmVhZG9ubHkgYXNhYXNQYXltZW50SWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgcGVkaWRvSWQ6IG51bWJlcjtcbn1cblxuY29uc3QgQURNSU5fVEVMID0gYXRvYignTVRFNU5EQTNOekkzTlRBPScpO1xuY29uc3QgQ09OVEFfVEVTVEUgPSBhdG9iKCdNVEU1TmpVd016QXdOelk9Jyk7XG5cbmZ1bmN0aW9uIGNhbGNJc0FkbWluKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWNsaWVudGUgJiYgY2xpZW50ZS50ZWxlZm9uZSA9PT0gQURNSU5fVEVMO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250YVRlc3RlKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWNsaWVudGUgJiYgY2xpZW50ZS50ZWxlZm9uZSA9PT0gQ09OVEFfVEVTVEU7XG59XG5cbmV4cG9ydCBjb25zdCBhcHBTdG9yZSA9IG5ldyBTdG9yZTxBcHBTdGF0ZT4oe1xuICBjbGllbnRlOiBudWxsLFxuICBpc0xvZ2dlZEluOiBmYWxzZSxcbiAgaXNBZG1pbjogZmFsc2UsXG4gIGNhcnJpbmhvQ291bnQ6IDAsXG4gIGNhcnJpbmhvVG90YWw6IDAsXG4gIHBhZ2FtZW50b1NlbGVjaW9uYWRvOiAnJyxcbiAgcGVkaWRvSWRQZW5kZW50ZTogbnVsbCxcbiAgcGl4RGF0YTogbnVsbCxcbiAgcm9sZXRhQXRpdmE6IGZhbHNlLFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDbGllbnRlKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHtcbiAgICBjbGllbnRlLFxuICAgIGlzTG9nZ2VkSW46ICEhY2xpZW50ZSxcbiAgICBpc0FkbWluOiBjYWxjSXNBZG1pbihjbGllbnRlKSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDYXJyaW5obyhjb3VudDogbnVtYmVyLCB0b3RhbDogbnVtYmVyKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgY2FycmluaG9Db3VudDogY291bnQsIGNhcnJpbmhvVG90YWw6IHRvdGFsIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UGFnYW1lbnRvKHRpcG86IHN0cmluZyk6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiB0aXBvIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UGl4RGF0YShkYXRhOiBQaXhEYXRhIHwgbnVsbCk6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBpeERhdGE6IGRhdGEgfSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBJQ2xpZW50ZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9yZXBvc2l0b3JpZXMvSUNsaWVudGVSZXBvc2l0b3J5JztcbmltcG9ydCB7IENsaWVudGUgfSBmcm9tICcuLi8uLi9kb21haW4vY2xpZW50ZSc7XG5pbXBvcnQgeyB0eXBlIFJlc3VsdCwgb2ssIGZhaWwsIHRyeUFzeW5jIH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgUmF0ZUxpbWl0RXJyb3IsIFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcbmltcG9ydCB7IGV2ZW50QnVzIH0gZnJvbSAnLi4vLi4vY29yZS9ldmVudHMnO1xuaW1wb3J0IHsgc2V0Q2xpZW50ZSB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0b3JlJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdMb2dpblVzZUNhc2UnKTtcblxuY29uc3QgU0VTU0lPTl9LRVkgPSAnZ2VsYW1vdXJfY2xpZW50ZSc7XG5jb25zdCBTRVNTSU9OX1RTX0tFWSA9ICdnZWxhbW91cl90cyc7XG5jb25zdCBTRVNTSU9OX1RUTF9NUyA9IDI0ICogNjAgKiA2MCAqIDEwMDA7XG5cbmludGVyZmFjZSBSYXRlTGltaXRlciB7XG4gIGF0dGVtcHRzOiBudW1iZXI7XG4gIGJsb2NrZWRVbnRpbDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgTG9naW5Vc2VDYXNlIHtcbiAgcHJpdmF0ZSByYXRlTGltaXRlcjogUmF0ZUxpbWl0ZXIgPSB7IGF0dGVtcHRzOiAwLCBibG9ja2VkVW50aWw6IDAgfTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNsaWVudGVSZXBvOiBJQ2xpZW50ZVJlcG9zaXRvcnkpIHt9XG5cbiAgcmVzdG9yZVNlc3Npb24oKTogQ2xpZW50ZSB8IG51bGwge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB0cyA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFNFU1NJT05fVFNfS0VZKSA/PyAnMCcpO1xuICAgICAgaWYgKERhdGUubm93KCkgLSB0cyA+IFNFU1NJT05fVFRMX01TKSB7XG4gICAgICAgIHRoaXMuY2xlYXJTZXNzaW9uKCk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgcmF3ID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShTRVNTSU9OX0tFWSk7XG4gICAgICBpZiAoIXJhdykgcmV0dXJuIG51bGw7XG4gICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShyYXcpIGFzIFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+O1xuICAgICAgY29uc3QgY2xpZW50ZSA9IENsaWVudGUuZnJvbURCKGRhdGEpO1xuICAgICAgc2V0Q2xpZW50ZShjbGllbnRlKTtcbiAgICAgIHJldHVybiBjbGllbnRlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy5jbGVhclNlc3Npb24oKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGV4ZWN1dGUodGVsZWZvbmU6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHsgZXhpc3RlOiBib29sZWFuOyBjbGllbnRlPzogQ2xpZW50ZSB9Pj4ge1xuICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5yYXRlTGltaXRlci5ibG9ja2VkVW50aWwpIHtcbiAgICAgIHJldHVybiBmYWlsKG5ldyBSYXRlTGltaXRFcnJvcih0aGlzLnJhdGVMaW1pdGVyLmJsb2NrZWRVbnRpbCAtIERhdGUubm93KCkpKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZWwgPSB0ZWxlZm9uZS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgIGlmICh0ZWwubGVuZ3RoIDwgMTApIHJldHVybiBmYWlsKG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RlbGVmb25lIGludlx1MDBFMWxpZG8nKSk7XG5cbiAgICBsb2cuaW5mbygnVmVyaWZpY2FuZG8gdGVsZWZvbmUnLCB7IHRlbDogYCoqKiR7dGVsLnNsaWNlKC00KX1gIH0pO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2xpZW50ZVJlcG8uZmluZEJ5VGVsZWZvbmUodGVsKTtcblxuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICAvLyBOZXR3b3JrRXJyb3IgPSBzZXJ2aWRvciBpbmRpc3Bvblx1MDBFRHZlbCwgblx1MDBFM28gdGVudGF0aXZhIGludlx1MDBFMWxpZGEgXHUyMDE0IG5cdTAwRTNvIHBlbmFsaXphXG4gICAgICBpZiAocmVzdWx0LmVycm9yLm5hbWUgIT09ICdOZXR3b3JrRXJyb3InKSB7XG4gICAgICAgIHRoaXMucmF0ZUxpbWl0ZXIuYXR0ZW1wdHMrKztcbiAgICAgICAgaWYgKHRoaXMucmF0ZUxpbWl0ZXIuYXR0ZW1wdHMgPj0gNSkge1xuICAgICAgICAgIHRoaXMucmF0ZUxpbWl0ZXIuYmxvY2tlZFVudGlsID0gRGF0ZS5ub3coKSArIDYwXzAwMDtcbiAgICAgICAgICB0aGlzLnJhdGVMaW1pdGVyLmF0dGVtcHRzID0gMDtcbiAgICAgICAgICByZXR1cm4gZmFpbChuZXcgUmF0ZUxpbWl0RXJyb3IoNjBfMDAwKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWlsKHJlc3VsdC5lcnJvcik7XG4gICAgfVxuXG4gICAgdGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cyA9IDA7XG4gICAgcmV0dXJuIG9rKHsgZXhpc3RlOiAhIXJlc3VsdC52YWx1ZSwgY2xpZW50ZTogcmVzdWx0LnZhbHVlID8/IHVuZGVmaW5lZCB9KTtcbiAgfVxuXG4gIGFzeW5jIHJlZ2lzdGVyKG5vbWU6IHN0cmluZywgdGVsZWZvbmU6IHN0cmluZywgZW5kZXJlY286IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PENsaWVudGU+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGVudGl0eSA9IENsaWVudGUuY3JlYXRlKHsgbm9tZSwgdGVsZWZvbmUsIGVuZGVyZWNvIH0pO1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCB0aGlzLmNsaWVudGVSZXBvLnNhdmUoZW50aXR5KTtcbiAgICAgIGlmICghc2F2ZWQub2spIHRocm93IHNhdmVkLmVycm9yO1xuICAgICAgcmV0dXJuIHNhdmVkLnZhbHVlO1xuICAgIH0pO1xuICB9XG5cbiAgbG9naW4oY2xpZW50ZTogQ2xpZW50ZSk6IHZvaWQge1xuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oU0VTU0lPTl9LRVksIEpTT04uc3RyaW5naWZ5KGNsaWVudGUudG9KU09OKCkpKTtcbiAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFNFU1NJT05fVFNfS0VZLCBTdHJpbmcoRGF0ZS5ub3coKSkpO1xuICAgIHNldENsaWVudGUoY2xpZW50ZSk7XG4gICAgZXZlbnRCdXMuZW1pdCgnYXV0aDpsb2dpbicsIHsgY2xpZW50ZSB9KTtcbiAgICBsb2cuaW5mbygnTG9naW4gcmVhbGl6YWRvJywgeyBpZDogY2xpZW50ZS5pZCB9KTtcbiAgfVxuXG4gIGxvZ291dCgpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFyU2Vzc2lvbigpO1xuICAgIHNldENsaWVudGUobnVsbCk7XG4gICAgZXZlbnRCdXMuZW1pdCgnYXV0aDpsb2dvdXQnLCB1bmRlZmluZWQgYXMgdW5rbm93biBhcyB2b2lkKTtcbiAgICBsb2cuaW5mbygnTG9nb3V0IHJlYWxpemFkbycpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhclNlc3Npb24oKTogdm9pZCB7XG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX0tFWSk7XG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX1RTX0tFWSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBldmVudEJ1cyB9IGZyb20gJy4uLy4uL2NvcmUvZXZlbnRzJztcbmltcG9ydCB7IHNldENhcnJpbmhvIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RvcmUnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBJdGVtUGVkaWRvIH0gZnJvbSAnLi4vLi4vZG9tYWluL3BlZGlkbyc7XG5cbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnQ2FydFNlcnZpY2UnKTtcblxuZXhwb3J0IGNsYXNzIENhcnRTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBpdGVtcyA9IG5ldyBNYXA8c3RyaW5nLCBJdGVtUGVkaWRvPigpO1xuXG4gIGFkZChub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pdGVtcy5oYXMobm9tZSkpIHJldHVybjtcbiAgICB0aGlzLml0ZW1zLnNldChub21lLCB7IG5vbWUsIHByZWNvOiBOdW1iZXIocHJlY28pIH0pO1xuICAgIHRoaXMubm90aWZ5KCk7XG4gICAgbG9nLmRlYnVnKCdJdGVtIGFkaWNpb25hZG8nLCB7IG5vbWUgfSk7XG4gIH1cblxuICByZW1vdmUobm9tZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLml0ZW1zLmhhcyhub21lKSkgcmV0dXJuO1xuICAgIHRoaXMuaXRlbXMuZGVsZXRlKG5vbWUpO1xuICAgIHRoaXMubm90aWZ5KCk7XG4gICAgbG9nLmRlYnVnKCdJdGVtIHJlbW92aWRvJywgeyBub21lIH0pO1xuICB9XG5cbiAgdG9nZ2xlKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6ICdhZGRlZCcgfCAncmVtb3ZlZCcge1xuICAgIGlmICh0aGlzLml0ZW1zLmhhcyhub21lKSkge1xuICAgICAgdGhpcy5yZW1vdmUobm9tZSk7XG4gICAgICByZXR1cm4gJ3JlbW92ZWQnO1xuICAgIH1cbiAgICB0aGlzLmFkZChub21lLCBwcmVjbyk7XG4gICAgcmV0dXJuICdhZGRlZCc7XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLml0ZW1zLmNsZWFyKCk7XG4gICAgdGhpcy5ub3RpZnkoKTtcbiAgfVxuXG4gIGdldEl0ZW1zKCk6IHJlYWRvbmx5IEl0ZW1QZWRpZG9bXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5pdGVtcy52YWx1ZXMoKSk7XG4gIH1cblxuICBnZXRUb3RhbCgpOiBudW1iZXIge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuaXRlbXMudmFsdWVzKCkpXG4gICAgICAucmVkdWNlKChzdW0sIGkpID0+IE1hdGgucm91bmQoKHN1bSArIGkucHJlY28pICogMTAwKSAvIDEwMCwgMCk7XG4gIH1cblxuICBnZXRDb3VudCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5pdGVtcy5zaXplOyB9XG5cbiAgaGFzKG5vbWU6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pdGVtcy5oYXMobm9tZSk7IH1cblxuICBpc0VtcHR5KCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pdGVtcy5zaXplID09PSAwOyB9XG5cbiAgcmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcDogTWFwPHN0cmluZywgbnVtYmVyPik6IHZvaWQge1xuICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdGVtLCBrZXkpID0+IHtcbiAgICAgIGNvbnN0IHJlYWxQcmljZSA9IHByaWNlTWFwLmdldChrZXkpO1xuICAgICAgaWYgKHJlYWxQcmljZSAhPT0gdW5kZWZpbmVkICYmIHJlYWxQcmljZSAhPT0gaXRlbS5wcmVjbykge1xuICAgICAgICB0aGlzLml0ZW1zLnNldChrZXksIHsgLi4uaXRlbSwgcHJlY286IHJlYWxQcmljZSB9KTtcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgIGxvZy53YXJuKCdQcmVcdTAwRTdvIHJldmFsaWRhZG8nLCB7IG5vbWU6IGtleSwgb2xkOiBpdGVtLnByZWNvLCBuZXc6IHJlYWxQcmljZSB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoY2hhbmdlZCkgdGhpcy5ub3RpZnkoKTtcbiAgfVxuXG4gIHByaXZhdGUgbm90aWZ5KCk6IHZvaWQge1xuICAgIHNldENhcnJpbmhvKHRoaXMuZ2V0Q291bnQoKSwgdGhpcy5nZXRUb3RhbCgpKTtcbiAgICBldmVudEJ1cy5lbWl0KCdjYXJ0OnVwZGF0ZWQnLCB7IGNvdW50OiB0aGlzLmdldENvdW50KCksIHRvdGFsOiB0aGlzLmdldFRvdGFsKCkgfSk7XG4gIH1cbn1cbiIsICIvLyBDb21wb3NpdGlvbiBSb290IFx1MjAxNCBpbnN0YW5jaWEgZSBpbmpldGEgZGVwZW5kXHUwMEVBbmNpYXNcbmltcG9ydCB7IENsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9DbGllbnRlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQZWRpZG9SZXBvc2l0b3J5IH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9QZWRpZG9SZXBvc2l0b3J5JztcbmltcG9ydCB7IFJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL1JvbGV0YVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgTG9naW5Vc2VDYXNlIH0gZnJvbSAnLi9hcHBsaWNhdGlvbi9hdXRoL0xvZ2luVXNlQ2FzZSc7XG5pbXBvcnQgeyBDYXJ0U2VydmljZSB9IGZyb20gJy4vYXBwbGljYXRpb24vY2FydC9DYXJ0U2VydmljZSc7XG5cbmNvbnN0IGNsaWVudGVSZXBvc2l0b3J5ID0gbmV3IENsaWVudGVSZXBvc2l0b3J5KCk7XG5jb25zdCBwZWRpZG9SZXBvc2l0b3J5ID0gbmV3IFBlZGlkb1JlcG9zaXRvcnkoKTtcbmNvbnN0IHJvbGV0YVJlcG9zaXRvcnkgPSBuZXcgUm9sZXRhUmVwb3NpdG9yeSgpO1xuXG5leHBvcnQgY29uc3QgbG9naW5Vc2VDYXNlID0gbmV3IExvZ2luVXNlQ2FzZShjbGllbnRlUmVwb3NpdG9yeSk7XG5leHBvcnQgY29uc3QgY2FydFNlcnZpY2UgPSBuZXcgQ2FydFNlcnZpY2UoKTtcblxuZXhwb3J0IHsgY2xpZW50ZVJlcG9zaXRvcnksIHBlZGlkb1JlcG9zaXRvcnksIHJvbGV0YVJlcG9zaXRvcnkgfTtcbiIsICJpbXBvcnQgdHlwZSB7IFJvbGV0YUNvbmZpZyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuLi9jb250YWluZXInO1xuaW1wb3J0IHsgc3VwYWJhc2VHZXQgfSBmcm9tICcuLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQnO1xuaW1wb3J0IHsgZ2V0U2VtYW5hQXR1YWwgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHsgZXNjSFRNTCB9IGZyb20gJy4uL3V0aWxzL3NlY3VyaXR5JztcbmltcG9ydCB7IG1vc3RyYXJUb2FzdCB9IGZyb20gJy4uL3V0aWxzL3RvYXN0JztcbmltcG9ydCB7IGlzQ29udGFUZXN0ZSB9IGZyb20gJy4uL3N0YXRlL0FwcFN0b3JlJztcbmltcG9ydCB7IGFwcFN0b3JlIH0gZnJvbSAnLi4vc3RhdGUvQXBwU3RvcmUnO1xuaW1wb3J0IHR5cGUgeyBDbGllbnRlIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5jb25zdCBQUkVNSU9TX1BBRFJBTzogc3RyaW5nW10gPSBbXG4gICdcdUQ4M0NcdURGODEgNSUgT0ZGIFx1MjAxNCBDb21wcmFzIGFjaW1hIGRlIFIkMzUnLFxuICAnXHVEODNDXHVERjZCIEJyb3duaWUgVHJhZGljaW9uYWwgR3JcdTAwRTF0aXMgXHUyMDE0IENvbXByYXMgYWNpbWEgZGUgUiQ1MCcsXG4gICdcdUQ4M0NcdURGODEgMTAlIE9GRiBcdTIwMTQgQ29tcHJhcyBhY2ltYSBkZSBSJDUwJyxcbiAgJ1x1RDgzRFx1RENGOCBTaWdhIGEgR2VsYW1vdXIgbm8gSW5zdGFncmFtJyxcbiAgJ1x1RDgzRFx1REVDRFx1RkUwRiBDb21wcmUgMiBlIExldmUgXHUyMDE0IEF0XHUwMEU5IFIkMTQgZW0gcHJvZHV0b3MnLFxuICAnXHVEODNEXHVERTE1IE5cdTAwRTNvIEZvaSBEZXNzYSBWZXogXHUyMDE0IEdhbmhhIDUlIE9GRiBhY2ltYSBkZSBSJDM1Jyxcbl07XG5cbmxldCBfcHJlbWlvczogc3RyaW5nW10gPSBbLi4uUFJFTUlPU19QQURSQU9dO1xubGV0IF9yb3RhY2FvQXR1YWwgPSAwO1xubGV0IF9naXJhbmRvID0gZmFsc2U7XG5sZXQgX3BhcnRpY2lwYWNhb0lkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZW1pb3NQYWRyYW8oKTogc3RyaW5nW10geyByZXR1cm4gUFJFTUlPU19QQURSQU87IH1cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmVtaW9zKCk6IHN0cmluZ1tdIHsgcmV0dXJuIF9wcmVtaW9zOyB9XG5leHBvcnQgZnVuY3Rpb24gc2V0UHJlbWlvcyhwOiBzdHJpbmdbXSk6IHZvaWQgeyBfcHJlbWlvcyA9IHA7IH1cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJ0aWNpcGFjYW9JZCgpOiBudW1iZXIgfCBudWxsIHsgcmV0dXJuIF9wYXJ0aWNpcGFjYW9JZDsgfVxuZXhwb3J0IGZ1bmN0aW9uIHNldFBhcnRpY2lwYWNhb0lkKGlkOiBudW1iZXIgfCBudWxsKTogdm9pZCB7IF9wYXJ0aWNpcGFjYW9JZCA9IGlkOyB9XG5leHBvcnQgZnVuY3Rpb24gaXNHaXJhbmRvKCk6IGJvb2xlYW4geyByZXR1cm4gX2dpcmFuZG87IH1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyQ29uZmlnKCk6IFByb21pc2U8Um9sZXRhQ29uZmlnIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDxSb2xldGFDb25maWc+KCdyb2xldGFfY29uZmlnJywgJ2lkPWVxLjEmbGltaXQ9MScpO1xuICAgIGlmIChyb3dzWzBdKSB7XG4gICAgICBfcHJlbWlvcyA9IEFycmF5LmlzQXJyYXkocm93c1swXS5wcmVtaW9zKSA/IHJvd3NbMF0ucHJlbWlvcyA6IFBSRU1JT1NfUEFEUkFPO1xuICAgIH1cbiAgICByZXR1cm4gcm93c1swXSA/PyBudWxsO1xuICB9IGNhdGNoIHsgcmV0dXJuIG51bGw7IH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhclN0YXR1cyhjbGllbnRlSWQ6IG51bWJlcik6IFByb21pc2U8aW1wb3J0KCcuLi9kb21haW4vcm9sZXRhJykuUGFydGljaXBhY2FvUHJvcHMgfCBudWxsPiB7XG4gIGNvbnN0IHNlbWFuYSA9IGdldFNlbWFuYUF0dWFsKCk7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuZmluZFBhcnRpY2lwYWNhb0F0aXZhKFN0cmluZyhjbGllbnRlSWQpLCBzZW1hbmEpO1xuICBpZiAoIXJlc3VsdC5vaykgcmV0dXJuIG51bGw7XG4gIGlmIChyZXN1bHQudmFsdWUpIF9wYXJ0aWNpcGFjYW9JZCA9IHJlc3VsdC52YWx1ZS5pZDtcbiAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdpcmFyKFxuICBfY2xpZW50ZTogQ2xpZW50ZSxcbiAgb25SZXN1bHRhZG86IChwcmVtaW86IHN0cmluZywgaW5kaWNlOiBudW1iZXIpID0+IHZvaWRcbik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoX2dpcmFuZG8pIHJldHVybjtcblxuICBjb25zdCBzdGF0ZSA9IGFwcFN0b3JlLmdldFN0YXRlKCk7XG4gIGlmICghaXNDb250YVRlc3RlKHN0YXRlLmNsaWVudGUpKSB7XG4gICAgbW9zdHJhclRvYXN0KCdcdUQ4M0RcdURFQTcgUm9sZXRhIGVtIGJyZXZlISBFc3RhbW9zIGZpbmFsaXphbmRvIG9zIFx1MDBGQWx0aW1vcyBkZXRhbGhlcy4gXHVEODNDXHVERkExJywgJ2luZm8nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBfZ2lyYW5kbyA9IHRydWU7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgaWYgKGJ0bikgeyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4udGV4dENvbnRlbnQgPSAnR2lyYW5kby4uLic7IH1cblxuICBjb25zdCBuID0gX3ByZW1pb3MubGVuZ3RoO1xuICBjb25zdCBhcmMgPSAzNjAgLyBuO1xuICBjb25zdCBpbmRpY2UgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBuKTtcbiAgY29uc3Qgdm9sdGFzRXh0cmFzID0gNSArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUpO1xuICBjb25zdCBhbmd1bG9BbHZvID0gdm9sdGFzRXh0cmFzICogMzYwICsgKDM2MCAtIGFyYyAqIGluZGljZSAtIGFyYyAvIDIpO1xuICBjb25zdCByb3RhY2FvRmluYWwgPSBfcm90YWNhb0F0dWFsICsgYW5ndWxvQWx2bztcblxuICBjb25zdCByb2RhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJvZGEnKTtcbiAgaWYgKHJvZGEpIHtcbiAgICByb2RhLnN0eWxlLnRyYW5zaXRpb24gPSAndHJhbnNmb3JtIDRzIGN1YmljLWJlemllcigwLjE3LCAwLjY3LCAwLjEyLCAxKSc7XG4gICAgcm9kYS5zdHlsZS50cmFuc2Zvcm1PcmlnaW4gPSAnMjAwcHggMjAwcHgnO1xuICAgIHJvZGEuc3R5bGUudHJhbnNmb3JtID0gYHJvdGF0ZSgke3JvdGFjYW9GaW5hbH1kZWcpYDtcbiAgfVxuXG4gIF9yb3RhY2FvQXR1YWwgPSAoKHJvdGFjYW9GaW5hbCAlIDM2MCkgKyAzNjApICUgMzYwO1xuXG4gIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA0MjAwKSk7XG5cbiAgY29uc3QgcHJlbWlvID0gX3ByZW1pb3NbaW5kaWNlXSE7XG4gIF9naXJhbmRvID0gZmFsc2U7XG5cbiAgb25SZXN1bHRhZG8ocHJlbWlvLCBpbmRpY2UpO1xuXG4gIGlmIChpc0NvbnRhVGVzdGUoc3RhdGUuY2xpZW50ZSkgJiYgYnRuKSB7XG4gICAgYnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgYnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REZBMSBHSVJBUiBBR09SQSEnO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYWx2YXJWZW5jZWRvcihjbGllbnRlOiBDbGllbnRlLCBwcmVtaW86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHJldHVybjtcbiAgaWYgKCFfcGFydGljaXBhY2FvSWQpIHJldHVybjtcblxuICBjb25zdCBzZW1hbmEgPSBnZXRTZW1hbmFBdHVhbCgpO1xuXG4gIGNvbnN0IHBhdGNoUmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5zYXZlUGFydGljaXBhY2FvKHtcbiAgICBpZDogX3BhcnRpY2lwYWNhb0lkLFxuICAgIGphX2dpcm91OiB0cnVlLFxuICAgIHByZW1pbyxcbiAgfSBhcyBpbXBvcnQoJy4uL2RvbWFpbi9yb2xldGEnKS5QYXJ0aWNpcGFjYW9Qcm9wcyk7XG5cbiAgaWYgKCFwYXRjaFJlc3VsdC5vaykge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm8gYW8gYXR1YWxpemFyIHBhcnRpY2lwYVx1MDBFN1x1MDBFM286JywgcGF0Y2hSZXN1bHQuZXJyb3IpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHZlbmNlZG9yUmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5zYXZlVmVuY2Vkb3IoXG4gICAgY2xpZW50ZS50ZWxlZm9uZSxcbiAgICBjbGllbnRlLm5vbWUsXG4gICAgcHJlbWlvLFxuICAgIHNlbWFuYVxuICApO1xuXG4gIGlmICghdmVuY2Vkb3JSZXN1bHQub2spIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvIGFvIHNhbHZhciB2ZW5jZWRvcjonLCB2ZW5jZWRvclJlc3VsdC5lcnJvcik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlc2VuaGFyUm9sZXRhKHByZW1pb3M6IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucm9sZXRhLXBvaW50ZXItd3JhcCcpO1xuICBpZiAoIXdyYXApIHJldHVybjtcbiAgY29uc3Qgb2xkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUNhbnZhcycpO1xuICBpZiAob2xkKSBvbGQucmVtb3ZlKCk7XG5cbiAgY29uc3QgTiA9IHByZW1pb3MubGVuZ3RoO1xuICBjb25zdCBDWCA9IDIwMCwgQ1kgPSAyMDAsIFIgPSAxNjQsIFJfTEVEID0gMTgyLCBSX09VVEVSID0gMTk2O1xuICBjb25zdCBTRUcgPSAzNjAgLyBOO1xuICBjb25zdCBDT1JFUyA9IFtcbiAgICB7IGJnOiAnI0ZBRjBGMicsIHR4dDogJyNCNTEzNEYnIH0sXG4gICAgeyBiZzogJyNFODUyOEEnLCB0eHQ6ICcjRkZGRkZGJyB9LFxuICBdIGFzIGNvbnN0O1xuXG4gIGNvbnN0IHJhZCA9IChkOiBudW1iZXIpOiBudW1iZXIgPT4gZCAqIE1hdGguUEkgLyAxODA7XG4gIGNvbnN0IHB0ID0gKGQ6IG51bWJlciwgcjogbnVtYmVyKTogW251bWJlciwgbnVtYmVyXSA9PiBbQ1ggKyByICogTWF0aC5jb3MocmFkKGQpKSwgQ1kgKyByICogTWF0aC5zaW4ocmFkKGQpKV07XG4gIGNvbnN0IGVzYyA9IChzOiBzdHJpbmcpOiBzdHJpbmcgPT4gcy5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG5cbiAgZnVuY3Rpb24gc2VnUGF0aChpOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IHMgPSBTRUcgKiBpIC0gOTAsIGUgPSBzICsgU0VHO1xuICAgIGNvbnN0IFt4MSwgeTFdID0gcHQocywgUiksIFt4MiwgeTJdID0gcHQoZSwgUik7XG4gICAgcmV0dXJuIGBNJHtDWH0sJHtDWX0gTCR7eDEudG9GaXhlZCgyKX0sJHt5MS50b0ZpeGVkKDIpfSBBJHtSfSwke1J9IDAgMCwxICR7eDIudG9GaXhlZCgyKX0sJHt5Mi50b0ZpeGVkKDIpfSBaYDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyYXBXb3Jkcyh0ZXh0OiBzdHJpbmcsIG1heENoYXJzOiBudW1iZXIpOiBzdHJpbmdbXSB7XG4gICAgY29uc3Qgd29yZHMgPSB0ZXh0LnNwbGl0KCcgJyk7XG4gICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IGN1ciA9ICcnO1xuICAgIHdvcmRzLmZvckVhY2godyA9PiB7XG4gICAgICBjb25zdCB0ZXN0ID0gY3VyID8gYCR7Y3VyfSAke3d9YCA6IHc7XG4gICAgICBpZiAodGVzdC5sZW5ndGggPiBtYXhDaGFycyAmJiBjdXIpIHsgbGluZXMucHVzaChjdXIpOyBjdXIgPSB3OyB9XG4gICAgICBlbHNlIGN1ciA9IHRlc3Q7XG4gICAgfSk7XG4gICAgaWYgKGN1cikgbGluZXMucHVzaChjdXIpO1xuICAgIHJldHVybiBsaW5lcy5zbGljZSgwLCAzKTtcbiAgfVxuXG4gIGNvbnN0IHNlZ3MgPSBwcmVtaW9zLm1hcCgoXywgaSkgPT4ge1xuICAgIGNvbnN0IGMgPSBDT1JFU1tpICUgMl0hO1xuICAgIHJldHVybiBgPHBhdGggZD1cIiR7c2VnUGF0aChpKX1cIiBmaWxsPVwiJHtjLmJnfVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIyXCIgc2hhcGUtcmVuZGVyaW5nPVwiZ2VvbWV0cmljUHJlY2lzaW9uXCIvPmA7XG4gIH0pLmpvaW4oJycpO1xuXG4gIGNvbnN0IHNwb2tlcyA9IHByZW1pb3MubWFwKChfLCBpKSA9PiB7XG4gICAgY29uc3QgZCA9IFNFRyAqIGkgLSA5MDtcbiAgICBjb25zdCBbeCwgeV0gPSBwdChkLCBSKTtcbiAgICByZXR1cm4gYDxsaW5lIHgxPVwiJHtDWH1cIiB5MT1cIiR7Q1l9XCIgeDI9XCIke3gudG9GaXhlZCgyKX1cIiB5Mj1cIiR7eS50b0ZpeGVkKDIpfVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIyXCIvPmA7XG4gIH0pLmpvaW4oJycpO1xuXG4gIGNvbnN0IHRleHRzID0gcHJlbWlvcy5tYXAoKHAsIGkpID0+IHtcbiAgICBjb25zdCBtaWQgPSBTRUcgKiBpIC0gOTAgKyBTRUcgLyAyO1xuICAgIGNvbnN0IFt0eCwgdHldID0gcHQobWlkLCBSICogMC41Nyk7XG4gICAgY29uc3QgYyA9IENPUkVTW2kgJSAyXSE7XG4gICAgY29uc3QgbSA9IHAubWF0Y2goL14oXFxTKylcXHMrKC4rKSQvKTtcbiAgICBjb25zdCBlbW9qaSA9IG0gPyBtWzFdISA6ICcnO1xuICAgIGNvbnN0IHJlc3QgPSBtID8gbVsyXSEgOiBwO1xuICAgIGNvbnN0IGxpbmVzID0gd3JhcFdvcmRzKHJlc3QsIDEzKTtcbiAgICBjb25zdCBsaW5lSCA9IDExLjU7XG4gICAgY29uc3QgdG90YWxUeHRIID0gbGluZXMubGVuZ3RoICogbGluZUg7XG4gICAgY29uc3QgZW1vamlZID0gLSh0b3RhbFR4dEggLyAyKSAtIDExO1xuICAgIGNvbnN0IHJvdCA9IChtaWQgKyA5MCkudG9GaXhlZCgxKTtcbiAgICByZXR1cm4gYDxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgke3R4LnRvRml4ZWQoMil9LCR7dHkudG9GaXhlZCgyKX0pIHJvdGF0ZSgke3JvdH0pXCIgdGV4dC1yZW5kZXJpbmc9XCJnZW9tZXRyaWNQcmVjaXNpb25cIj5cbiAgPHRleHQgeD1cIjBcIiB5PVwiJHtlbW9qaVkudG9GaXhlZCgxKX1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGRvbWluYW50LWJhc2VsaW5lPVwibWlkZGxlXCIgZm9udC1zaXplPVwiMTVcIiBmb250LWZhbWlseT1cInNlcmlmXCI+JHtlc2MoZW1vamkpfTwvdGV4dD5cbiAgJHtsaW5lcy5tYXAoKGwsIGxpKSA9PiB7XG4gICAgY29uc3QgeXAgPSAoKGxpIC0gKGxpbmVzLmxlbmd0aCAtIDEpIC8gMikgKiBsaW5lSCkudG9GaXhlZCgxKTtcbiAgICByZXR1cm4gYDx0ZXh0IHg9XCIwXCIgeT1cIiR7eXB9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBkb21pbmFudC1iYXNlbGluZT1cIm1pZGRsZVwiIGZpbGw9XCIke2MudHh0fVwiIGZvbnQtZmFtaWx5PVwiJ0RNIFNhbnMnLEFyaWFsLHNhbnMtc2VyaWZcIiBmb250LXdlaWdodD1cIjcwMFwiIGZvbnQtc2l6ZT1cIjlcIj4ke2VzYyhsKX08L3RleHQ+YDtcbiAgfSkuam9pbignXFxuICAnKX1cbjwvZz5gO1xuICB9KS5qb2luKCcnKTtcblxuICBjb25zdCBMRURfTiA9IDMwO1xuICBjb25zdCBsZWRzID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogTEVEX04gfSwgKF8sIGkpID0+IHtcbiAgICBjb25zdCBbbHgsIGx5XSA9IHB0KCgzNjAgLyBMRURfTikgKiBpIC0gOTAsIFJfTEVEKTtcbiAgICByZXR1cm4gYDxjaXJjbGUgY3g9XCIke2x4LnRvRml4ZWQoMil9XCIgY3k9XCIke2x5LnRvRml4ZWQoMil9XCIgcj1cIjUuNVwiIGNsYXNzPVwici1sZWQgci1sZWQtJHtpICUgMn1cIi8+YDtcbiAgfSkuam9pbignJyk7XG5cbiAgY29uc3Qgc3ZnID0gYDxzdmcgaWQ9XCJyb2xldGFDYW52YXNcIiB2aWV3Qm94PVwiMCAwIDQwMCA0MDBcIlxuICBzdHlsZT1cIndpZHRoOm1pbig4NnZ3LDM0MHB4KTtoZWlnaHQ6bWluKDg2dncsMzQwcHgpO2Rpc3BsYXk6YmxvY2s7ZmlsdGVyOmRyb3Atc2hhZG93KDAgNnB4IDIwcHggcmdiYSgwLDAsMCwuNDIpKVwiXG4gIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj5cbiAgPGRlZnM+XG4gICAgPHJhZGlhbEdyYWRpZW50IGlkPVwicmctcmluZ1wiIGN4PVwiNTAlXCIgY3k9XCI1MCVcIiByPVwiNTAlXCI+XG4gICAgICA8c3RvcCBvZmZzZXQ9XCI3MCVcIiBzdG9wLWNvbG9yPVwiI0Q0MkI3M1wiLz5cbiAgICAgIDxzdG9wIG9mZnNldD1cIjEwMCVcIiBzdG9wLWNvbG9yPVwiIzZBMDgyRVwiLz5cbiAgICA8L3JhZGlhbEdyYWRpZW50PlxuICAgIDxyYWRpYWxHcmFkaWVudCBpZD1cInJnLWN0clwiIGN4PVwiMzUlXCIgY3k9XCIzMCVcIiByPVwiNzAlXCI+XG4gICAgICA8c3RvcCBvZmZzZXQ9XCIwJVwiIHN0b3AtY29sb3I9XCIjRkZFNTdBXCIvPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiNDglXCIgc3RvcC1jb2xvcj1cIiNENEFGMzdcIi8+XG4gICAgICA8c3RvcCBvZmZzZXQ9XCIxMDAlXCIgc3RvcC1jb2xvcj1cIiM3QTU4MDBcIi8+XG4gICAgPC9yYWRpYWxHcmFkaWVudD5cbiAgICA8ZmlsdGVyIGlkPVwiZi1nbG93XCIgeD1cIi02MCVcIiB5PVwiLTYwJVwiIHdpZHRoPVwiMjIwJVwiIGhlaWdodD1cIjIyMCVcIj5cbiAgICAgIDxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249XCIyLjVcIiByZXN1bHQ9XCJiXCIvPlxuICAgICAgPGZlTWVyZ2U+PGZlTWVyZ2VOb2RlIGluPVwiYlwiLz48ZmVNZXJnZU5vZGUgaW49XCJTb3VyY2VHcmFwaGljXCIvPjwvZmVNZXJnZT5cbiAgICA8L2ZpbHRlcj5cbiAgPC9kZWZzPlxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIiR7Ul9PVVRFUn1cIiBmaWxsPVwidXJsKCNyZy1yaW5nKVwiLz5cbiAgPGNpcmNsZSBjeD1cIiR7Q1h9XCIgY3k9XCIke0NZfVwiIHI9XCIke1JfT1VURVJ9XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiMy41XCIvPlxuICA8ZyBpZD1cInJvbGV0YVJvZGFcIj4ke3NlZ3N9JHtzcG9rZXN9JHt0ZXh0c308L2c+XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiJHtSICsgMX1cIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIzXCIvPlxuICAke2xlZHN9XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiNDJcIiBmaWxsPVwidXJsKCNyZy1jdHIpXCIgc3Ryb2tlPVwiI0ZGRlwiIHN0cm9rZS13aWR0aD1cIjMuNVwiIGZpbHRlcj1cInVybCgjZi1nbG93KVwiLz5cbiAgPGNpcmNsZSBjeD1cIiR7Q1h9XCIgY3k9XCIke0NZfVwiIHI9XCIzOFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwicmdiYSgyNTUsMjU1LDI1NSwwLjM1KVwiIHN0cm9rZS13aWR0aD1cIjEuNVwiLz5cbiAgPHRleHQgeD1cIiR7Q1h9XCIgeT1cIiR7Q1kgLSA3fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmaWxsPVwiI0ZGRlwiIGZvbnQtZmFtaWx5PVwiJ0RNIFNhbnMnLEFyaWFsLHNhbnMtc2VyaWZcIiBmb250LXdlaWdodD1cIjgwMFwiIGZvbnQtc2l6ZT1cIjEyXCIgbGV0dGVyLXNwYWNpbmc9XCIxLjVcIiB0ZXh0LXJlbmRlcmluZz1cImdlb21ldHJpY1ByZWNpc2lvblwiPkdJUkFSPC90ZXh0PlxuICA8dGV4dCB4PVwiJHtDWH1cIiB5PVwiJHtDWSArIDl9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBkb21pbmFudC1iYXNlbGluZT1cIm1pZGRsZVwiIGZpbGw9XCJyZ2JhKDI1NSwyNTUsMjU1LC44NSlcIiBmb250LWZhbWlseT1cInNlcmlmXCIgZm9udC1zaXplPVwiMTFcIj5cdTI2MDUgXHUyNjA1IFx1MjYwNTwvdGV4dD5cbjwvc3ZnPmA7XG5cbiAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRpdi5pbm5lckhUTUwgPSBzdmc7XG4gIHdyYXAuaW5zZXJ0QmVmb3JlKGRpdi5maXJzdEVsZW1lbnRDaGlsZCEsIHdyYXAuZmlyc3RDaGlsZCk7XG59XG5cbmV4cG9ydCB7IGVzY0hUTUwgfTtcbiIsICJpbXBvcnQgdHlwZSB7IEl0ZW1DYXJyaW5obyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IGVzY0hUTUwgfSBmcm9tICcuLi91dGlscy9zZWN1cml0eSc7XG5pbXBvcnQgeyBmb3JtYXRhck1vZWRhIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGNhcnRTZXJ2aWNlIH0gZnJvbSAnLi4vY29udGFpbmVyJztcblxuLy8gQWRhcHRhZG9yZXMgbGVnYWRvcyBcdTIwMTQgZGVsZWdhbSBhbyBDYXJ0U2VydmljZSAoQ2xlYW4gQXJjaGl0ZWN0dXJlKVxuZXhwb3J0IGZ1bmN0aW9uIGdldENhcnJpbmhvKCk6IFJlY29yZDxzdHJpbmcsIEl0ZW1DYXJyaW5obz4ge1xuICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIEl0ZW1DYXJyaW5obz4gPSB7fTtcbiAgY2FydFNlcnZpY2UuZ2V0SXRlbXMoKS5mb3JFYWNoKGkgPT4geyByZXN1bHRbaS5ub21lXSA9IGk7IH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXRlbnMoKTogSXRlbUNhcnJpbmhvW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShjYXJ0U2VydmljZS5nZXRJdGVtcygpKSBhcyBJdGVtQ2FycmluaG9bXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvdGFsKCk6IG51bWJlciB7XG4gIHJldHVybiBjYXJ0U2VydmljZS5nZXRUb3RhbCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRpY2lvbmFySXRlbShub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiBib29sZWFuIHtcbiAgaWYgKGNhcnRTZXJ2aWNlLmhhcyhub21lKSkgcmV0dXJuIGZhbHNlO1xuICBjYXJ0U2VydmljZS5hZGQobm9tZSwgcHJlY28pO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZXJJdGVtKG5vbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAoIWNhcnRTZXJ2aWNlLmhhcyhub21lKSkgcmV0dXJuIGZhbHNlO1xuICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlSXRlbShub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiAnYWRpY2lvbmFkbycgfCAncmVtb3ZpZG8nIHtcbiAgY29uc3QgciA9IGNhcnRTZXJ2aWNlLnRvZ2dsZShub21lLCBwcmVjbyk7XG4gIHJldHVybiByID09PSAnYWRkZWQnID8gJ2FkaWNpb25hZG8nIDogJ3JlbW92aWRvJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpbXBhcigpOiB2b2lkIHtcbiAgY2FydFNlcnZpY2UuY2xlYXIoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm9sb0Zvcm1hKG5vbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBCT0xPX0ZPUk1BX05PTUVTID0gWydCb2xvIG5hIGZvcm1hIE1pbGhvIG5hdHVyYWwnLCAnQm9sbyBuYSBmb3JtYSBDZW5vdXJhIGNvbSBjaG9jb2xhdGUgZSBHcmFudWxlJ107XG4gIHJldHVybiBCT0xPX0ZPUk1BX05PTUVTLmluY2x1ZGVzKG5vbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyaXphckxpc3RhKGNvbnRhaW5lcklkOiBzdHJpbmcsIHRvdGFsUm9kYXBlSWQ6IHN0cmluZywgYmFkZ2VJZDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGxpc3RhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGFpbmVySWQpO1xuICBjb25zdCB0b3RhbEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodG90YWxSb2RhcGVJZCk7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYmFkZ2VJZCk7XG4gIGNvbnN0IGl0ZW5zID0gZ2V0SXRlbnMoKTtcblxuICBpZiAoYmFkZ2UpIGJhZGdlLnRleHRDb250ZW50ID0gU3RyaW5nKGl0ZW5zLmxlbmd0aCk7XG5cbiAgaWYgKCFsaXN0YSB8fCAhdG90YWxFbCkgcmV0dXJuO1xuXG4gIGlmIChpdGVucy5sZW5ndGggPT09IDApIHtcbiAgICBsaXN0YS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImNhcnJpbmhvLXZhemlvXCI+PGRpdiBjbGFzcz1cImNhcnJpbmhvLXZhemlvLWljb25cIj5cdUQ4M0RcdURFRDI8L2Rpdj48ZGl2PlNldSBjYXJyaW5obyBlc3RcdTAwRTEgdmF6aW88L2Rpdj48L2Rpdj5gO1xuICAgIHRvdGFsRWwudGV4dENvbnRlbnQgPSAnUiQgMCwwMCc7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgdG90YWwgPSBnZXRUb3RhbCgpO1xuICBsaXN0YS5pbm5lckhUTUwgPSBpdGVucy5tYXAoaXRlbSA9PiB7XG4gICAgY29uc3Qgbm9tZUVzYyA9IGVzY0hUTUwoaXRlbS5ub21lKTtcbiAgICBjb25zdCBub21lRGF0YSA9IGVuY29kZVVSSUNvbXBvbmVudChpdGVtLm5vbWUpO1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImNhcnQtaXRlbVwiPlxuICAgICAgPHNwYW4gY2xhc3M9XCJjYXJ0LWl0ZW0tbm9tZVwiPiR7bm9tZUVzY308L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cImNhcnQtaXRlbS1wcmVjb1wiPiR7Zm9ybWF0YXJNb2VkYShpdGVtLnByZWNvKX08L3NwYW4+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwiY2FydC1pdGVtLXJlbW92ZVwiIG9uY2xpY2s9XCJyZW1vdmVyRG9DYXJyaW5obyhkZWNvZGVVUklDb21wb25lbnQoJyR7bm9tZURhdGF9JykpXCIgYXJpYS1sYWJlbD1cIlJlbW92ZXJcIj5cdUQ4M0RcdURERDFcdUZFMEY8L2J1dHRvbj5cbiAgICA8L2Rpdj5gO1xuICB9KS5qb2luKCcnKSArIGA8ZGl2IGNsYXNzPVwiY2FydC10b3RhbFwiPjxzcGFuIGNsYXNzPVwiY2FydC10b3RhbC1sYWJlbFwiPlRvdGFsPC9zcGFuPjxzcGFuIGNsYXNzPVwiY2FydC10b3RhbC12YWxvclwiPiR7Zm9ybWF0YXJNb2VkYSh0b3RhbCl9PC9zcGFuPjwvZGl2PmA7XG4gIHRvdGFsRWwudGV4dENvbnRlbnQgPSBmb3JtYXRhck1vZWRhKHRvdGFsKTtcbn1cbiIsICIvLyBzcmMvbWFpbi50cyBcdTIwMTQgcG9udG8gZGUgZW50cmFkYSBHZWxhbW91ciAoQ2xlYW4gQXJjaGl0ZWN0dXJlKVxuaW1wb3J0IHsgbW9zdHJhclRvYXN0IH0gZnJvbSAnLi91dGlscy90b2FzdCc7XG5pbXBvcnQgeyBlc2NIVE1MIH0gZnJvbSAnLi91dGlscy9zZWN1cml0eSc7XG5pbXBvcnQgeyBhcGxpY2FyTWFzY2FyYVRlbGVmb25lIH0gZnJvbSAnLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHsgbG9naW5Vc2VDYXNlLCBjYXJ0U2VydmljZSwgcGVkaWRvUmVwb3NpdG9yeSwgcm9sZXRhUmVwb3NpdG9yeSwgY2xpZW50ZVJlcG9zaXRvcnkgfSBmcm9tICcuL2NvbnRhaW5lcic7XG5pbXBvcnQgeyBhcHBTdG9yZSwgaXNDb250YVRlc3RlIH0gZnJvbSAnLi9zdGF0ZS9BcHBTdG9yZSc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuL2NvcmUvbG9nZ2VyJztcbmltcG9ydCB7IENsaWVudGUgYXMgQ2xpZW50ZUVudGl0eSB9IGZyb20gJy4vZG9tYWluL2NsaWVudGUnO1xuaW1wb3J0IHsgZ2V0U2VtYW5hQXR1YWwgfSBmcm9tICcuL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQge1xuICBnZXRQcmVtaW9zLCBnZXRQcmVtaW9zUGFkcmFvLCBzZXRQcmVtaW9zLFxuICBzZXRQYXJ0aWNpcGFjYW9JZCxcbiAgY2FycmVnYXJDb25maWcgYXMgY2FycmVnYXJDb25maWdSb2xldGEsXG4gIHZlcmlmaWNhclN0YXR1cyBhcyB2ZXJpZmljYXJTdGF0dXNSb2xldGEsXG4gIGdpcmFyIGFzIGdpcmFyUm9sZXRhRm4sXG4gIHNhbHZhclZlbmNlZG9yLFxuICBkZXNlbmhhclJvbGV0YVxufSBmcm9tICcuL21vZHVsZXMvcm9sZXRhJztcbmltcG9ydCB7IGlzQm9sb0Zvcm1hLCByZW5kZXJpemFyTGlzdGEgfSBmcm9tICcuL21vZHVsZXMvY2FydCc7XG5pbXBvcnQgdHlwZSB7IENsaWVudGUsIFBhcnRpY2lwYWNhbyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgU1VQQUJBU0VfVVJMLCBTVVBBQkFTRV9BTk9OIH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQnO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ21haW4nKTtcblxuLy8gPT09PT0gQ09OU1RBTlRFUyA9PT09PVxuY29uc3QgV0FfTlVNQkVSID0gYXRvYignTlRVeE1UazBNRGMzTWpjMU1BPT0nKTtcbmNvbnN0IEVER0VfVVJMID0gYCR7U1VQQUJBU0VfVVJMfS9mdW5jdGlvbnMvdjFgO1xuXG4vLyA9PT09PSBFU1RBRE8gTE9DQUwgREUgVUkgKG5cdTAwRTNvIGdsb2JhbCBcdTIwMTQgZW5jYXBzdWxhZG8pID09PT09XG5sZXQgX3BpeFBheWxvYWQgPSAnJztcbmxldCBfcGl4UG9sbFRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRJbnRlcnZhbD4gfCBudWxsID0gbnVsbDtcbmxldCBfcGl4UG9sbFRpbWVvdXRUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDsgLy8gbGltaXRlIDMwbWluXG5sZXQgX3BpeENhbmNlbGxlZCA9IGZhbHNlOyAvLyBmbGFnIHBhcmEgZXZpdGFyIHJhY2UgY29uZGl0aW9uIG5vIHRpbWVyXG5sZXQgX3BpeFBlZGlkb0lkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbmxldCBfcGl4TXNnV0EgPSAnJztcbmxldCBfcGl4VG90YWwgPSAwO1xubGV0IF9waXhJdGVuczogQXJyYXk8eyBub21lOiBzdHJpbmc7IHByZWNvOiBudW1iZXIgfT4gPSBbXTtcbmxldCBfcGl4RW5kZXJlY28gPSAnJztcblxubGV0IF92ZXJpZmljYW5kbyA9IGZhbHNlO1xubGV0IF9jYWRhc3RyYW5kbyA9IGZhbHNlO1xuXG4vLyBIZWxwZXI6IGxcdTAwRUEgY2xpZW50ZSBhdHVhbCBkbyBzdG9yZVxuZnVuY3Rpb24gZ2V0Q2xpZW50ZUF0dWFsKCk6IENsaWVudGUgfCBudWxsIHtcbiAgcmV0dXJuIGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSBhcyBDbGllbnRlIHwgbnVsbDtcbn1cblxuLy8gPT09PT0gRklMVFJPUyA9PT09PVxuZnVuY3Rpb24gZmlsdHJhcihjYXQ6IHN0cmluZywgYnRuOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZmlsdHJvLWJ0bicpLmZvckVhY2goYiA9PiBiLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpKTtcbiAgYnRuLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucHJvZC1jYXJkJykuZm9yRWFjaChjYXJkID0+IHtcbiAgICBjb25zdCBlbCA9IGNhcmQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKGNhdCA9PT0gJ3RvZG9zJyB8fCAoZWwuZGF0YXNldFsnY2F0J10gPT09IGNhdCkpXG4gICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcbiAgICBlbHNlXG4gICAgICBlbC5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcbiAgfSk7XG59XG5cbi8vID09PT09IENBUlJJTkhPID09PT09XG5mdW5jdGlvbiBhdHVhbGl6YXJGYWIoKTogdm9pZCB7XG4gIGNvbnN0IGZhYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXJ0RmFiJyk7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhcnRCYWRnZScpO1xuICBjb25zdCBjb3VudCA9IGNhcnRTZXJ2aWNlLmdldENvdW50KCk7XG4gIGlmIChiYWRnZSkgYmFkZ2UudGV4dENvbnRlbnQgPSBTdHJpbmcoY291bnQpO1xuICBpZiAoZmFiKSB7XG4gICAgaWYgKGNvdW50ID4gMCkgZmFiLmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gICAgZWxzZSB7IGZhYi5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpOyBmZWNoYXJNb2RhbCgpOyB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGVkaXJQcm9kdXRvKGJvdGFvOiBIVE1MRWxlbWVudCwgbm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGNhcmQgPSBib3Rhby5jbG9zZXN0KCcucHJvZC1jYXJkJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpZiAoY2FydFNlcnZpY2UuaGFzKG5vbWUpKSB7XG4gICAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICAgIGNhcmQ/LmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJyk7XG4gICAgYXR1YWxpemFyRmFiKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNhcnRTZXJ2aWNlLmFkZChub21lLCBwcmVjbyk7XG4gIGNhcmQ/LmNsYXNzTGlzdC5hZGQoJ3NlbGVjaW9uYWRvJyk7XG4gIGF0dWFsaXphckZhYigpO1xuICBhYnJpckRpYWxvZyhub21lLCBwcmVjbyk7XG59XG5cbmZ1bmN0aW9uIGFicmlyRGlhbG9nKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dQcm9kdXRvJyk7XG4gIGlmIChlbCkgZWwuaW5uZXJIVE1MID0gJzxzdHJvbmc+JyArIGVzY0hUTUwobm9tZSkgKyAnPC9zdHJvbmc+IFx1MjAxNCBSJCAnICsgTnVtYmVyKHByZWNvKS50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhckRpYWxvZygpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJEaWFsb2dCYWNrZHJvcChlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ2RpYWxvZ0JhY2tkcm9wJykgZmVjaGFyRGlhbG9nKCk7XG59XG5cbmZ1bmN0aW9uIGlyUGFyYUZpbmFsaXphcigpOiB2b2lkIHtcbiAgZmVjaGFyRGlhbG9nKCk7XG4gIGFicmlyTW9kYWwoKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyaXphckNhcnJpbmhvKCk6IHZvaWQge1xuICByZW5kZXJpemFyTGlzdGEoJ2xpc3RhQ2FycmluaG8nLCAndG90YWxSb2RhcGUnLCAnYmFkZ2VDb3VudCcpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJpemFyTm90aWNlRW5jb21lbmRhKCk6IHZvaWQge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdub3RpY2VFbmNvbWVuZGEnKTtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICBjb25zdCBpdGVucyA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCk7XG4gIGNvbnN0IHRlbUZvcm1hID0gaXRlbnMuc29tZShpID0+IGlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuICBjb25zdCB0ZW1PdXRyb3MgPSBpdGVucy5zb21lKGkgPT4gIWlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuICBpZiAodGVtRm9ybWEgJiYgdGVtT3V0cm9zKSB7XG4gICAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJub3RpY2UtbWlzdG9cIj48c3Bhbj5cdTI2QTBcdUZFMEY8L3NwYW4+PHNwYW4+PHN0cm9uZz5BdGVuXHUwMEU3XHUwMEUzbzo8L3N0cm9uZz4gVm9jXHUwMEVBIG1pc3R1cm91IEJvbG9zIG5hIEZvcm1hIChmZWl0b3Mgc29iIGVuY29tZW5kYSkgY29tIG91dHJvcyBwcm9kdXRvcy4gQ29uc2lkZXJlIHBlZGlkb3Mgc2VwYXJhZG9zIHBhcmEgZ2FyYW50aXIgbyBwcmF6byE8L3NwYW4+PC9kaXY+JztcbiAgfSBlbHNlIGlmICh0ZW1Gb3JtYSkge1xuICAgIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwibm90aWNlLWVuY29tZW5kYVwiPjxzcGFuIGNsYXNzPVwibm90aWNlLWVuY29tZW5kYS1pY29uXCI+XHUyM0YwPC9zcGFuPjxzcGFuPjxzdHJvbmc+Qm9sbyBuYSBGb3JtYSBcdTIwMTQgU29iIGVuY29tZW5kYSE8L3N0cm9uZz48YnI+RXNzZXMgYm9sb3Mgc1x1MDBFM28gcHJlcGFyYWRvcyBlc3BlY2lhbG1lbnRlIHBhcmEgdm9jXHUwMEVBLiBQcmF6byBkZSA8c3Ryb25nPjUgaG9yYXMgYSAxIGRpYSBcdTAwRkF0aWw8L3N0cm9uZz4gYXBcdTAwRjNzIGNvbmZpcm1hXHUwMEU3XHUwMEUzby48L3NwYW4+PC9kaXY+JztcbiAgfSBlbHNlIHtcbiAgICBlbC5pbm5lckhUTUwgPSAnJztcbiAgfVxufVxuXG5mdW5jdGlvbiBhYnJpck1vZGFsKCk6IHZvaWQge1xuICByZW5kZXJpemFyQ2FycmluaG8oKTtcbiAgcmVuZGVyaXphck5vdGljZUVuY29tZW5kYSgpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxCYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdtb2RhbC1hYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyTW9kYWwoKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ21vZGFsLWFiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJNb2RhbEJhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAnbW9kYWxCYWNrZHJvcCcpIGZlY2hhck1vZGFsKCk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZXJEb0NhcnJpbmhvKG5vbWU6IHN0cmluZyk6IHZvaWQge1xuICBpZiAoIWNhcnRTZXJ2aWNlLmhhcyhub21lKSkgcmV0dXJuO1xuICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcm9kLWNhcmQuc2VsZWNpb25hZG8nKS5mb3JFYWNoKGNhcmQgPT4ge1xuICAgIGNvbnN0IG5vbWVFbCA9IGNhcmQucXVlcnlTZWxlY3RvcignLnByb2Qtbm9tZScpO1xuICAgIGlmIChub21lRWwgJiYgbm9tZUVsLnRleHRDb250ZW50Py50cmltKCkgPT09IG5vbWUpIGNhcmQuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKTtcbiAgfSk7XG4gIHJlbmRlcml6YXJDYXJyaW5obygpO1xuICBhdHVhbGl6YXJGYWIoKTtcbn1cblxuZnVuY3Rpb24gc2VsZWNpb25hclBhZ2FtZW50byhlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2FtZW50by1vcHQnKS5mb3JFYWNoKG8gPT4gby5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcbiAgZWwuY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgY29uc3QgdGlwbyA9IChlbCBhcyBIVE1MRWxlbWVudCAmIHsgZGF0YXNldDogRE9NU3RyaW5nTWFwIH0pLmRhdGFzZXRbJ3BhZyddID8/ICcnO1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiB0aXBvIH0pO1xufVxuXG5mdW5jdGlvbiBsaW1wYXJDYXJyaW5obygpOiB2b2lkIHtcbiAgY2FydFNlcnZpY2UuY2xlYXIoKTtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwYWdhbWVudG9TZWxlY2lvbmFkbzogJycgfSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYWdhbWVudG8tb3B0LmF0aXZvJykuZm9yRWFjaChvID0+IG8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKSk7XG4gIGNvbnN0IG9ic0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE9icycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQgfCBudWxsO1xuICBpZiAob2JzRWwpIG9ic0VsLnZhbHVlID0gJyc7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcm9kLWNhcmQuc2VsZWNpb25hZG8nKS5mb3JFYWNoKGMgPT4gYy5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpKTtcbiAgYXR1YWxpemFyRmFiKCk7XG4gIGZlY2hhck1vZGFsKCk7XG59XG5cbi8vID09PT09IEJPTE8gTkEgRk9STUEgPT09PT1cbmZ1bmN0aW9uIHBlZGlyQm9sb0Zvcm1hKGJvdGFvOiBIVE1MRWxlbWVudCwgbm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGNhcmQgPSBib3Rhby5jbG9zZXN0KCcucHJvZC1jYXJkJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpZiAoY2FydFNlcnZpY2UuaGFzKG5vbWUpKSB7XG4gICAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICAgIGNhcmQ/LmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJyk7XG4gICAgYXR1YWxpemFyRmFiKCk7XG4gICAgcmVuZGVyaXphck5vdGljZUVuY29tZW5kYSgpO1xuICAgIHJldHVybjtcbiAgfVxuICBjYXJ0U2VydmljZS5hZGQobm9tZSwgcHJlY28pO1xuICBjYXJkPy5jbGFzc0xpc3QuYWRkKCdzZWxlY2lvbmFkbycpO1xuICBhdHVhbGl6YXJGYWIoKTtcbiAgYWJyaXJEaWFsb2dCb2xvKCk7XG59XG5cbmZ1bmN0aW9uIGFicmlyRGlhbG9nQm9sbygpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ0JvbG9CYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyRGlhbG9nQm9sbyhlPzogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKCFlIHx8IChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdkaWFsb2dCb2xvQmFja2Ryb3AnKSB7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ0JvbG9CYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZ2VuZGFyQm9sb1doYXRzQXBwKCk6IHZvaWQge1xuICBjb25zdCBpdGVuc0Zvcm1hID0gY2FydFNlcnZpY2UuZ2V0SXRlbXMoKS5maWx0ZXIoaSA9PiBpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgbGV0IGxpbmhhcyA9ICcnO1xuICBsZXQgdG90YWwgPSAwO1xuICBpdGVuc0Zvcm1hLmZvckVhY2goaSA9PiB7XG4gICAgbGluaGFzICs9ICdcdTIwMjIgJyArIGkubm9tZSArICcgXHUyMDE0IFIkICcgKyBpLnByZWNvLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJykgKyAnXFxuJztcbiAgICB0b3RhbCA9IE1hdGgucm91bmQoKHRvdGFsICsgaS5wcmVjbykgKiAxMDApIC8gMTAwO1xuICB9KTtcbiAgY29uc3QgbXNnID0gJypcdUQ4M0NcdURGODIgQUdFTkRBTUVOVE8gLSBCT0xPIE5BIEZPUk1BIC0gR0VMQU1PVVIqXFxuXFxuT2xcdTAwRTEhIEdvc3RhcmlhIGRlIGFnZW5kYXIgbyhzKSBzZWd1aW50ZShzKSBib2xvKHMpOlxcblxcbicgKyBsaW5oYXMgKyAnXFxuKlx1RDgzRFx1RENCMCBUb3RhbDoqIFIkICcgKyB0b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpICsgJ1xcblxcblx1MjNGMCBTZWkgcXVlIG8gcHJhem8gXHUwMEU5IGRlIDUgaG9yYXMgYSAxIGRpYSBcdTAwRkF0aWwuIFBvciBmYXZvciBtZSBpbmZvcm1lIGEgZGF0YSBlIGhvclx1MDBFMXJpbyBkaXNwb25cdTAwRUR2ZWlzIHBhcmEgZW50cmVnYS4gXHVEODNEXHVERTBBJztcbiAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG1zZyksICdfYmxhbmsnKTtcbiAgZmVjaGFyRGlhbG9nQm9sbygpO1xufVxuXG4vLyA9PT09PSBDQVJPVVNFTCA9PT09PVxuZnVuY3Rpb24gY2Fyb3VzZWxOZXh0KGlkOiBzdHJpbmcsIGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmIChlKSBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICBjb25zdCBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICBpZiAoIWMpIHJldHVybjtcbiAgY29uc3QgaW1ncyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWltZycpO1xuICBjb25zdCBkb3RzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtZG90Jyk7XG4gIGxldCBjdXIgPSAwO1xuICBpbWdzLmZvckVhY2goKGltZywgaSkgPT4geyBpZiAoaW1nLmNsYXNzTGlzdC5jb250YWlucygnYXRpdm8nKSkgY3VyID0gaTsgfSk7XG4gIGltZ3NbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcbiAgZG90c1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBjb25zdCBuZXh0ID0gKGN1ciArIDEpICUgaW1ncy5sZW5ndGg7XG4gIGltZ3NbbmV4dF0/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGRvdHNbbmV4dF0/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG59XG5cbmZ1bmN0aW9uIGNhcm91c2VsUHJldihpZDogc3RyaW5nLCBlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoZSkgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgY29uc3QgYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgaWYgKCFjKSByZXR1cm47XG4gIGNvbnN0IGltZ3MgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1pbWcnKTtcbiAgY29uc3QgZG90cyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWRvdCcpO1xuICBsZXQgY3VyID0gMDtcbiAgaW1ncy5mb3JFYWNoKChpbWcsIGkpID0+IHsgaWYgKGltZy5jbGFzc0xpc3QuY29udGFpbnMoJ2F0aXZvJykpIGN1ciA9IGk7IH0pO1xuICBpbWdzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGRvdHNbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcbiAgY29uc3QgcHJldiA9IChjdXIgLSAxICsgaW1ncy5sZW5ndGgpICUgaW1ncy5sZW5ndGg7XG4gIGltZ3NbcHJldl0/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGRvdHNbcHJldl0/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG59XG5cbi8vID09PT09IENIRUNLT1VUIC8gUEVESURPID09PT09XG5hc3luYyBmdW5jdGlvbiBmaW5hbGl6YXJQZWRpZG8oKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGl0ZW5zID0gY2FydFNlcnZpY2UuZ2V0SXRlbXMoKTtcbiAgY29uc3QgdGVtRm9ybWFGaW4gPSBpdGVucy5zb21lKGkgPT4gaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGNvbnN0IHRlbU91dHJvc0ZpbiA9IGl0ZW5zLnNvbWUoaSA9PiAhaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGlmICh0ZW1Gb3JtYUZpbiAmJiB0ZW1PdXRyb3NGaW4pIHtcbiAgICBpZiAoIWNvbmZpcm0oJ1x1MjZBMFx1RkUwRiBBdGVuXHUwMEU3XHUwMEUzbyFcXG5cXG5Wb2NcdTAwRUEgdGVtIEJvbG9zIG5hIEZvcm1hIChmZWl0b3Mgc29iIGVuY29tZW5kYSkgbWlzdHVyYWRvcyBjb20gb3V0cm9zIHByb2R1dG9zIG5vIGNhcnJpbmhvLlxcblxcbkJvbG9zIG5hIEZvcm1hIHByZWNpc2FtIGRlIHByYXpvIGRlIDVoIGEgMSBkaWEgXHUwMEZBdGlsIHBhcmEgcHJlcGFyby5cXG5cXG5EZXNlamEgcHJvc3NlZ3VpciBjb20gdG9kb3Mgb3MgaXRlbnMgbWVzbW8gYXNzaW0/JykpXG4gICAgICByZXR1cm47XG4gIH1cbiAgaWYgKGl0ZW5zLmxlbmd0aCA9PT0gMCkgeyBhbGVydCgnQWRpY2lvbmUgcGVsbyBtZW5vcyB1bSBwcm9kdXRvIGFvIGNhcnJpbmhvIScpOyByZXR1cm47IH1cblxuICBjb25zdCBub21lID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJykgYXMgSFRNTElucHV0RWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3QgZW5kZXJlY28gPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3Qgb2JzID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBPYnMnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBwYWdhbWVudG9TZWxlY2lvbmFkbyA9IGFwcFN0b3JlLmdldFN0YXRlKCkucGFnYW1lbnRvU2VsZWNpb25hZG87XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuXG4gIGlmICghbm9tZSkgeyBhbGVydCgnUG9yIGZhdm9yLCBpbmZvcm1lIHNldSBub21lIGNvbXBsZXRvLicpOyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpPy5mb2N1cygpOyByZXR1cm47IH1cbiAgaWYgKCFlbmRlcmVjbykgeyBhbGVydCgnUG9yIGZhdm9yLCBpbmZvcm1lIHNldSBlbmRlcmVcdTAwRTdvLicpOyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKT8uZm9jdXMoKTsgcmV0dXJuOyB9XG4gIGlmICghcGFnYW1lbnRvU2VsZWNpb25hZG8pIHsgYWxlcnQoJ1BvciBmYXZvciwgZXNjb2xoYSBhIGZvcm1hIGRlIHBhZ2FtZW50by4nKTsgcmV0dXJuOyB9XG5cbiAgLy8gUmUtdmVyaWZpY2FyIHByZVx1MDBFN29zIGRvcyBib3RcdTAwRjVlcyBwYXJhIGV2aXRhciBtYW5pcHVsYVx1MDBFN1x1MDBFM28gY2xpZW50LXNpZGVcbiAgY29uc3QgcHJpY2VNYXAgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYnRuLXBlZGlyJykuZm9yRWFjaChidG4gPT4ge1xuICAgIGNvbnN0IG9uY2xpY2tBdHRyID0gYnRuLmdldEF0dHJpYnV0ZSgnb25jbGljaycpID8/ICcnO1xuICAgIGNvbnN0IG0gPSBvbmNsaWNrQXR0ci5tYXRjaCgvcGVkaXJQcm9kdXRvXFwodGhpcywnKC4rPyknLChcXGQrKD86XFwuXFxkKyk/KVxcKS8pO1xuICAgIGlmIChtKSBwcmljZU1hcC5zZXQobVsxXSEsIHBhcnNlRmxvYXQobVsyXSEpKTtcbiAgfSk7XG4gIGNhcnRTZXJ2aWNlLnJldmFsaWRhdGVQcmljZXMocHJpY2VNYXApO1xuXG4gIGNvbnN0IGl0ZW5zVmVyaWZpY2Fkb3MgPSBBcnJheS5mcm9tKGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCkpO1xuICBsZXQgdG90YWwgPSAwO1xuICBsZXQgbGluaGFzSXRlbnMgPSAnJztcbiAgaXRlbnNWZXJpZmljYWRvcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgIHRvdGFsID0gTWF0aC5yb3VuZCgodG90YWwgKyBpdGVtLnByZWNvKSAqIDEwMCkgLyAxMDA7XG4gICAgbGluaGFzSXRlbnMgKz0gYFx1MjAyMiAke2l0ZW0ubm9tZX0gXHUyMDE0IFIkICR7aXRlbS5wcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfVxcbmA7XG4gIH0pO1xuXG4gIGNvbnN0IG1zZyA9IGAqXHVEODNDXHVERjcwIE5PVk8gUEVESURPIC0gR0VMQU1PVVIqXFxuXFxuKlx1RDgzRFx1RENDQiBJVEVOUzoqXFxuJHtsaW5oYXNJdGVuc31cXG4qXHVEODNEXHVEQ0IwIFRvdGFsOiogUiQgJHt0b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfVxcblxcbipcdUQ4M0RcdURDNjQgTm9tZToqICR7bm9tZX1cXG4qXHVEODNEXHVEQ0NEIEVuZGVyZVx1MDBFN286KiAke2VuZGVyZWNvfVxcbipcdUQ4M0RcdURDQjMgUGFnYW1lbnRvOiogJHtwYWdhbWVudG9TZWxlY2lvbmFkb30ke29icyA/IGBcXG4qXHVEODNEXHVEQ0REIE9iczoqICR7b2JzfWAgOiAnJ31cXG5cXG5QZWRpZG8gcGVsbyBjYXJkXHUwMEUxcGlvIG9ubGluZSBcdTI3MjhgO1xuXG4gIGNvbnN0IGJ0bkZpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5GaW5hbGl6YXInKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGNvbnN0IHR4dE9yaWcgPSBidG5GaW4gPyAoYnRuRmluLnRleHRDb250ZW50ID8/ICcnKSA6ICcnO1xuICBpZiAoYnRuRmluKSB7IGJ0bkZpbi5kaXNhYmxlZCA9IHRydWU7IGJ0bkZpbi50ZXh0Q29udGVudCA9ICdTYWx2YW5kbyBwZWRpZG8uLi4nOyB9XG5cbiAgbGV0IF9wZWRpZG9JZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgY3RybCA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBjb25zdCB0aWQgPSBzZXRUaW1lb3V0KCgpID0+IGN0cmwuYWJvcnQoKSwgMTBfMDAwKTtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3BlZGlkb3MnLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTixcbiAgICAgICAgJ1ByZWZlcic6ICdyZXR1cm49aGVhZGVycy1vbmx5J1xuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbm9tZSwgZW5kZXJlY28sXG4gICAgICAgIHBhZ2FtZW50bzogcGFnYW1lbnRvU2VsZWNpb25hZG8sXG4gICAgICAgIGl0ZW5zOiBpdGVuc1ZlcmlmaWNhZG9zLm1hcChpID0+ICh7IG5vbWU6IGkubm9tZSwgcHJlY286IGkucHJlY28gfSkpLFxuICAgICAgICB0b3RhbCxcbiAgICAgICAgc3RhdHVzOiAnYWd1YXJkYW5kbycsXG4gICAgICAgIG9ic2VydmFjYW86IG9icyB8fCBudWxsLFxuICAgICAgICBjbGllbnRlX2lkOiBjbGllbnRlQXR1YWwgPyBjbGllbnRlQXR1YWwuaWQgOiBudWxsLFxuICAgICAgICB0ZWxlZm9uZTogY2xpZW50ZUF0dWFsID8gY2xpZW50ZUF0dWFsLnRlbGVmb25lIDogbnVsbFxuICAgICAgfSksXG4gICAgICBzaWduYWw6IGN0cmwuc2lnbmFsXG4gICAgfSk7XG4gICAgY2xlYXJUaW1lb3V0KHRpZCk7XG4gICAgaWYgKCFyLm9rKSB7XG4gICAgICBjb25zdCBlcnJUeHQgPSBhd2FpdCByLnRleHQoKS5jYXRjaCgoKSA9PiAnJyk7XG4gICAgICBsb2cuZXJyb3IoJ0lOU0VSVCBwZWRpZG8gZmFsaG91JywgeyBzdGF0dXM6IHIuc3RhdHVzLCBib2R5OiBlcnJUeHQuc2xpY2UoMCwgMTIwKSB9KTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSFRUUCAnICsgci5zdGF0dXMgKyAnIFx1MjAxNCAnICsgZXJyVHh0LnNsaWNlKDAsIDEyMCkpO1xuICAgIH1cbiAgICBjb25zdCBsb2MgPSByLmhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpID8/ICcnO1xuICAgIGNvbnN0IGlkTWF0Y2ggPSBsb2MubWF0Y2goL2lkPWVxXFwuKFxcZCspLyk7XG4gICAgaWYgKGlkTWF0Y2gpIHtcbiAgICAgIF9wZWRpZG9JZCA9IHBhcnNlSW50KGlkTWF0Y2hbMV0hLCAxMCk7XG4gICAgICBpZiAoYnRuRmluKSBidG5GaW4udGV4dENvbnRlbnQgPSAnXHUyNzA1IFBlZGlkbyByZWdpc3RyYWRvISc7XG4gICAgICBpZiAoY2xpZW50ZUF0dWFsICYmIGNsaWVudGVBdHVhbC5pZCkge1xuICAgICAgICBjbGllbnRlUmVwb3NpdG9yeS51cGRhdGVFbmRlcmVjbyhjbGllbnRlQXR1YWwuaWQsIGVuZGVyZWNvKVxuICAgICAgICAgIC5jYXRjaCgoZTogdW5rbm93bikgPT4gbG9nLndhcm4oJ05cdTAwRTNvIGZvaSBwb3NzXHUwMEVEdmVsIHNhbHZhciBlbmRlcmVcdTAwRTdvJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoYnRuRmluKSBidG5GaW4udGV4dENvbnRlbnQgPSAnXHUyNkEwXHVGRTBGIEVycm8gLSBwZWRpZG8gc1x1MDBGMyBubyBXaGF0c0FwcCc7XG4gICAgbG9nLndhcm4oJ0Vycm8gYW8gc2FsdmFyIG5vIGJhbmNvJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pO1xuICB9XG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKGJ0bkZpbikgeyBidG5GaW4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuRmluLnRleHRDb250ZW50ID0gdHh0T3JpZzsgfVxuICB9LCAzMDAwKTtcblxuICBpZiAoKHBhZ2FtZW50b1NlbGVjaW9uYWRvID09PSAnUGl4JyB8fCBwYWdhbWVudG9TZWxlY2lvbmFkbyA9PT0gJ0NhcnRcdTAwRTNvJykgJiYgX3BlZGlkb0lkKSB7XG4gICAgY29uc3QgYmlsbGluZ1R5cGUgPSBwYWdhbWVudG9TZWxlY2lvbmFkbyA9PT0gJ0NhcnRcdTAwRTNvJyA/ICdDUkVESVRfQ0FSRCcgOiAnUElYJztcbiAgICBpbmljaWFyRmx1eG9QaXgoX3BlZGlkb0lkLCB0b3RhbCwgbm9tZSwgbXNnLCBiaWxsaW5nVHlwZSwgaXRlbnNWZXJpZmljYWRvcywgZW5kZXJlY28pO1xuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChtc2cpLCAnX2JsYW5rJyk7XG4gICAgaWYgKF9wZWRpZG9JZCkge1xuICAgICAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwZWRpZG9JZFBlbmRlbnRlOiBfcGVkaWRvSWQgfSk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2FDb25maXJtQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbmZpcm1hckVudmlvV0EoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGlkID0gYXBwU3RvcmUuZ2V0U3RhdGUoKS5wZWRpZG9JZFBlbmRlbnRlO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcud2FDb25maXJtLXNpbScpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghaWQpIHsgZmVjaGFyQ29uZmlybVdBKCk7IHJldHVybjsgfVxuICBpZiAoIWNsaWVudGVBdHVhbCB8fCAhY2xpZW50ZUF0dWFsLmlkKSB7IGZlY2hhckNvbmZpcm1XQSgpOyByZXR1cm47IH1cbiAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnQ29uZmlybWFuZG8uLi4nOyBidG4uZGlzYWJsZWQgPSB0cnVlOyB9XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBlZGlkb1JlcG9zaXRvcnkudXBkYXRlU3RhdHVzKGlkLCBjbGllbnRlQXR1YWwuaWQsICdjb25maXJtYWRvJyk7XG4gIGlmIChyZXN1bHQub2spIHtcbiAgICBpZiAoYnRuKSBidG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERjg5IFBlZGlkbyBjb25maXJtYWRvISc7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7IGZlY2hhckNvbmZpcm1XQSgpOyBsaW1wYXJDYXJyaW5obygpOyB9LCAxODAwKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MDUgU2ltLCBtZW5zYWdlbSBlbnZpYWRhISc7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyB9XG4gICAgbG9nLndhcm4oJ0Vycm8gYW8gY29uZmlybWFyIHBlZGlkbycsIHsgZXJyb3I6IHJlc3VsdC5lcnJvci5tZXNzYWdlIH0pO1xuICAgIGZlY2hhckNvbmZpcm1XQSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZlY2hhckNvbmZpcm1XQSgpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dhQ29uZmlybUJhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBlZGlkb0lkUGVuZGVudGU6IG51bGwgfSk7XG59XG5cbi8vID09PT09IEZMVVhPIFBJWCA9PT09PVxuYXN5bmMgZnVuY3Rpb24gaW5pY2lhckZsdXhvUGl4KFxuICBwZWRpZG9JZDogbnVtYmVyLFxuICB0b3RhbDogbnVtYmVyLFxuICBub21lOiBzdHJpbmcsXG4gIG1zZ1dBOiBzdHJpbmcsXG4gIGJpbGxpbmdUeXBlOiBzdHJpbmcsXG4gIGl0ZW5zOiBBcnJheTx7IG5vbWU6IHN0cmluZzsgcHJlY286IG51bWJlciB9PixcbiAgZW5kZXJlY286IHN0cmluZ1xuKTogUHJvbWlzZTx2b2lkPiB7XG4gIF9waXhQZWRpZG9JZCA9IHBlZGlkb0lkO1xuICBfcGl4TXNnV0EgPSBtc2dXQTtcbiAgX3BpeFRvdGFsID0gdG90YWw7XG4gIF9waXhJdGVucyA9IGl0ZW5zIHx8IFtdO1xuICBfcGl4RW5kZXJlY28gPSBlbmRlcmVjbyB8fCAnJztcbiAgY29uc3QgaXNQaXggPSBiaWxsaW5nVHlwZSAhPT0gJ0NSRURJVF9DQVJEJztcblxuICBjb25zdCBwaXhUaXR1bG8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4VGl0dWxvJyk7XG4gIGNvbnN0IHBpeFN1YiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhTdWInKTtcbiAgY29uc3QgcGl4VmFsb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4VmFsb3InKTtcbiAgY29uc3Qgc2VjYW9QaXggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VjYW9QaXgnKTtcbiAgY29uc3Qgc2VjYW9DYXJ0YW8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VjYW9DYXJ0YW8nKTtcbiAgY29uc3QgcGl4SmFQYWd1ZWlCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGl4SmFQYWd1ZWlCdG4nKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGNvbnN0IHBpeFN0YXR1cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhTdGF0dXMnKTtcbiAgY29uc3QgcGl4Q29kZUJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhDb2RlQm94Jyk7XG4gIGNvbnN0IHBpeFFySW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeFFySW1nJykgYXMgSFRNTEltYWdlRWxlbWVudCB8IG51bGw7XG5cbiAgaWYgKHBpeFRpdHVsbykgcGl4VGl0dWxvLnRleHRDb250ZW50ID0gaXNQaXggPyAnXHVEODNEXHVEQ0EwIFBhZ3VlIHZpYSBQaXgnIDogJ1x1RDgzRFx1RENCMyBQYWd1ZSBjb20gQ2FydFx1MDBFM28nO1xuICBpZiAocGl4U3ViKSBwaXhTdWIudGV4dENvbnRlbnQgPSBpc1BpeCA/ICdDb3BpZSBvIGNcdTAwRjNkaWdvIG91IGVzY2FuZWllIG8gUVIgQ29kZScgOiAnQ3JcdTAwRTlkaXRvIG91IGRcdTAwRTliaXRvIFx1MjAxNCBwcmVlbmNoYSBvcyBkYWRvcyBhYmFpeG8nO1xuICBpZiAocGl4VmFsb3IpIHBpeFZhbG9yLnRleHRDb250ZW50ID0gJ1IkICcgKyB0b3RhbC50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xuICBpZiAoc2VjYW9QaXgpIHNlY2FvUGl4LnN0eWxlLmRpc3BsYXkgPSBpc1BpeCA/ICdibG9jaycgOiAnbm9uZSc7XG4gIGlmIChzZWNhb0NhcnRhbykgc2VjYW9DYXJ0YW8uc3R5bGUuZGlzcGxheSA9IGlzUGl4ID8gJ25vbmUnIDogJ2Jsb2NrJztcbiAgaWYgKHBpeEphUGFndWVpQnRuKSBwaXhKYVBhZ3VlaUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBpZiAocGl4U3RhdHVzKSB7IHBpeFN0YXR1cy50ZXh0Q29udGVudCA9IGlzUGl4ID8gJ1x1MjNGMyBHZXJhbmRvIFFSIENvZGUuLi4nIDogJyc7IHBpeFN0YXR1cy5jbGFzc05hbWUgPSAncGl4LXN0YXR1cycgKyAoaXNQaXggPyAnIHBpeC1hZ3VhcmRhbmRvJyA6ICcnKTsgfVxuICBpZiAocGl4Q29kZUJveCkgcGl4Q29kZUJveC50ZXh0Q29udGVudCA9ICdHZXJhbmRvIGNcdTAwRjNkaWdvLi4uJztcbiAgaWYgKHBpeFFySW1nKSBwaXhRckltZy5zcmMgPSAnJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICBmZWNoYXJNb2RhbCgpO1xuXG4gIGlmICghaXNQaXgpIHJldHVybjtcblxuICBfcGl4Q2FuY2VsbGVkID0gZmFsc2U7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goRURHRV9VUkwgKyAnL2NyaWFyLXBpeCcsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLCAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHBlZGlkb19pZDogcGVkaWRvSWQsIHRvdGFsLCBub21lLCBiaWxsaW5nX3R5cGU6ICdQSVgnIH0pLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwLmpzb24oKSBhcyB7IGVycm9yPzogc3RyaW5nOyBxcl9jb2RlPzogc3RyaW5nOyBxcl9jb2RlX2ltYWdlPzogc3RyaW5nIHwgbnVsbDsgcGF5bWVudF9pZD86IHN0cmluZyB9O1xuXG4gICAgaWYgKF9waXhDYW5jZWxsZWQpIHJldHVybjtcblxuICAgIC8vIEhUVFAgNTAzID0gY29icmFuXHUwMEU3YSBjcmlhZGEgbWFzIFFSIG5cdTAwRTNvIGRpc3Bvblx1MDBFRHZlbCBcdTIwMTQgcGVkZSBub3ZhIHRlbnRhdGl2YVxuICAgIGlmIChyZXNwLnN0YXR1cyA9PT0gNTAzIHx8IChkYXRhLmVycm9yICYmIGRhdGEuZXJyb3IuaW5jbHVkZXMoJ1FSIENvZGUnKSkpIHtcbiAgICAgIGlmIChwaXhTdGF0dXMpIHsgcGl4U3RhdHVzLnRleHRDb250ZW50ID0gJ1x1MjZBMFx1RkUwRiBRUiBDb2RlIHRlbXBvcmFyaWFtZW50ZSBpbmRpc3Bvblx1MDBFRHZlbC4gQWd1YXJkZSAxMHMgZSBmZWNoZSBwYXJhIHRlbnRhciBub3ZhbWVudGUuJzsgcGl4U3RhdHVzLmNsYXNzTmFtZSA9ICdwaXgtc3RhdHVzJzsgfVxuICAgICAgaWYgKHBpeENvZGVCb3gpIHBpeENvZGVCb3gudGV4dENvbnRlbnQgPSAnSW5kaXNwb25cdTAwRUR2ZWwgbm8gbW9tZW50by4nO1xuICAgICAgaWYgKHBpeEphUGFndWVpQnRuKSBwaXhKYVBhZ3VlaUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIGxvZy53YXJuKCdRUiBDb2RlIGluZGlzcG9uXHUwMEVEdmVsJywgeyBwYXltZW50X2lkOiBkYXRhLnBheW1lbnRfaWQgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFyZXNwLm9rIHx8IGRhdGEuZXJyb3IpIHRocm93IG5ldyBFcnJvcihkYXRhLmVycm9yID8/ICdIVFRQICcgKyByZXNwLnN0YXR1cyk7XG5cbiAgICBpZiAoIWRhdGEucXJfY29kZSkgdGhyb3cgbmV3IEVycm9yKCdRUiBDb2RlIG5cdTAwRTNvIHJldG9ybmFkbyBwZWxvIHNlcnZpZG9yJyk7XG5cbiAgICBfcGl4UGF5bG9hZCA9IGRhdGEucXJfY29kZTtcbiAgICBpZiAocGl4Q29kZUJveCkgcGl4Q29kZUJveC50ZXh0Q29udGVudCA9IF9waXhQYXlsb2FkO1xuICAgIGlmIChkYXRhLnFyX2NvZGVfaW1hZ2UgJiYgcGl4UXJJbWcpIHBpeFFySW1nLnNyYyA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsJyArIGRhdGEucXJfY29kZV9pbWFnZTtcbiAgICBpZiAocGl4U3RhdHVzKSB7IHBpeFN0YXR1cy50ZXh0Q29udGVudCA9ICdcdTIzRjMgQWd1YXJkYW5kbyBwYWdhbWVudG8uLi4nOyBwaXhTdGF0dXMuY2xhc3NOYW1lID0gJ3BpeC1zdGF0dXMgcGl4LWFndWFyZGFuZG8nOyB9XG5cbiAgICAvLyBNb3N0cmFyIGJvdFx1MDBFM28gXCJKXHUwMEUxIFBhZ3VlaVwiIGFwXHUwMEYzcyAyMHMgXHUyMDE0IGZhbGxiYWNrIHNlIGRldGVjXHUwMEU3XHUwMEUzbyBhdXRvbVx1MDBFMXRpY2EgZmFsaGFyXG4gICAgaWYgKHBpeEphUGFndWVpQnRuKSB7XG4gICAgICBwaXhKYVBhZ3VlaUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmICghX3BpeENhbmNlbGxlZCAmJiBwaXhKYVBhZ3VlaUJ0bikgcGl4SmFQYWd1ZWlCdG4uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB9LCAyMF8wMDApO1xuICAgIH1cbiAgICBfcGl4UG9sbFRpbWVyID0gc2V0SW50ZXJ2YWwodmVyaWZpY2FyUGFnYW1lbnRvUGl4LCA0MDAwKTtcbiAgICAvLyBUaW1lb3V0IGRlIDMwIG1pbiBcdTIwMTQgY2FuY2VsYSBwb2xsaW5nIGF1dG9tYXRpY2FtZW50ZVxuICAgIF9waXhQb2xsVGltZW91dFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAoX3BpeFBvbGxUaW1lcikgeyBjbGVhckludGVydmFsKF9waXhQb2xsVGltZXIpOyBfcGl4UG9sbFRpbWVyID0gbnVsbDsgfVxuICAgICAgX3BpeFBvbGxUaW1lb3V0VGltZXIgPSBudWxsO1xuICAgICAgaWYgKHBpeFN0YXR1cykgeyBwaXhTdGF0dXMudGV4dENvbnRlbnQgPSAnXHUyM0YwIFRlbXBvIGVzZ290YWRvLiBGZWNoZSBlIGdlcmUgdW0gbm92byBQaXggc2UgcHJlY2lzYXIuJzsgcGl4U3RhdHVzLmNsYXNzTmFtZSA9ICdwaXgtc3RhdHVzJzsgfVxuICAgICAgaWYgKHBpeEphUGFndWVpQnRuKSBwaXhKYVBhZ3VlaUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICB9LCAzMCAqIDYwICogMTAwMCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoX3BpeENhbmNlbGxlZCkgcmV0dXJuO1xuICAgIGxvZy53YXJuKCdFcnJvIGFvIGNyaWFyIFBpeCcsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTtcbiAgICBpZiAocGl4Q29kZUJveCkgcGl4Q29kZUJveC50ZXh0Q29udGVudCA9ICdFcnJvIGFvIGdlcmFyIGNcdTAwRjNkaWdvLic7XG4gICAgaWYgKHBpeFN0YXR1cykgeyBwaXhTdGF0dXMudGV4dENvbnRlbnQgPSAnXHUyNkEwXHVGRTBGIEZhbGhhIGFvIGdlcmFyIFFSIENvZGUuIFZlcmlmaXF1ZSBzdWEgY29uZXhcdTAwRTNvIGUgdGVudGUgbm92YW1lbnRlLic7IHBpeFN0YXR1cy5jbGFzc05hbWUgPSAncGl4LXN0YXR1cyc7IH1cbiAgICBpZiAocGl4SmFQYWd1ZWlCdG4pIHBpeEphUGFndWVpQnRuLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNlbGVjaW9uYXJUaXBvQ2FydGFvKHRpcG86IHN0cmluZyk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuQ3JlZGl0bycpPy5jbGFzc0xpc3QudG9nZ2xlKCdhdGl2bycsIHRpcG8gPT09ICdjcmVkaXRvJyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5EZWJpdG8nKT8uY2xhc3NMaXN0LnRvZ2dsZSgnYXRpdm8nLCB0aXBvID09PSAnZGViaXRvJyk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdGFyQ2FydGFvKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGxldCB2ID0gZWwudmFsdWUucmVwbGFjZSgvXFxEL2csICcnKS5zdWJzdHJpbmcoMCwgMTYpO1xuICBlbC52YWx1ZSA9IHYucmVwbGFjZSgvKC57NH0pKD89LikvZywgJyQxICcpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRhckNwZihlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICBsZXQgdiA9IGVsLnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJykuc3Vic3RyaW5nKDAsIDExKTtcbiAgdiA9IHYucmVwbGFjZSgvKFxcZHszfSkoXFxkKS8sICckMS4kMicpO1xuICB2ID0gdi5yZXBsYWNlKC8oXFxkezN9KVxcLihcXGR7M30pKFxcZCkvLCAnJDEuJDIuJDMnKTtcbiAgdiA9IHYucmVwbGFjZSgvKFxcZHszfSlcXC4oXFxkezN9KVxcLihcXGR7M30pKFxcZHsxLDJ9KSQvLCAnJDEuJDIuJDMtJDQnKTtcbiAgZWwudmFsdWUgPSB2O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRhclZhbGlkYWRlKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGxldCB2ID0gZWwudmFsdWUucmVwbGFjZSgvXFxEL2csICcnKS5zdWJzdHJpbmcoMCwgNCk7XG4gIGlmICh2Lmxlbmd0aCA+PSAzKSB2ID0gdi5zdWJzdHJpbmcoMCwgMikgKyAnLycgKyB2LnN1YnN0cmluZygyKTtcbiAgZWwudmFsdWUgPSB2O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRhckNlcChlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICBsZXQgdiA9IGVsLnZhbHVlLnJlcGxhY2UoL1xcRC9nLCAnJykuc3Vic3RyaW5nKDAsIDgpO1xuICBpZiAodi5sZW5ndGggPiA1KSB2ID0gdi5zdWJzdHJpbmcoMCwgNSkgKyAnLScgKyB2LnN1YnN0cmluZyg1KTtcbiAgZWwudmFsdWUgPSB2O1xufVxuXG5hc3luYyBmdW5jdGlvbiBwYWdhckNhcnRhbygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgbW9zdHJhclRvYXN0KCdcdUQ4M0RcdURDQjMgUGFnYW1lbnRvIHBvciBjYXJ0XHUwMEUzbyBlbSBicmV2ZSEgVXNlIG8gUGl4IHBvciBlbnF1YW50by4nLCAnaW5mbycpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJQYWdhbWVudG9QaXgoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghX3BpeFBlZGlkb0lkIHx8IF9waXhDYW5jZWxsZWQpIHJldHVybjtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGVkaWRvUmVwb3NpdG9yeS5maW5kQnlJZChfcGl4UGVkaWRvSWQpO1xuICBpZiAocmVzdWx0Lm9rICYmIHJlc3VsdC52YWx1ZSkge1xuICAgIGNvbnN0IHN0YXR1c1BhZyA9IHJlc3VsdC52YWx1ZS5zdGF0dXNQYWdhbWVudG87XG4gICAgaWYgKHN0YXR1c1BhZyA9PT0gJ3BhZ28nKSB7XG4gICAgICBpZiAoX3BpeFBvbGxUaW1lcikgeyBjbGVhckludGVydmFsKF9waXhQb2xsVGltZXIpOyBfcGl4UG9sbFRpbWVyID0gbnVsbDsgfVxuICAgICAgbW9zdHJhclJlY2lib1BpeCgpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsb2cud2FybignRXJybyBhbyB2ZXJpZmljYXIgcGFnYW1lbnRvJywgeyBlcnJvcjogcmVzdWx0Lm9rID8gJ25vdCBmb3VuZCcgOiByZXN1bHQuZXJyb3IubWVzc2FnZSB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtb3N0cmFyUmVjaWJvUGl4KCk6IHZvaWQge1xuICBjb25zdCBsaW5oYXNJdGVucyA9IF9waXhJdGVucy5tYXAoaSA9PlxuICAgICc8ZGl2IGNsYXNzPVwicmVjaWJvLWl0ZW1cIj48c3Bhbj4nICsgZXNjSFRNTChpLm5vbWUpICsgJzwvc3Bhbj48c3Bhbj5SJCAnICsgTnVtYmVyKGkucHJlY28pLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJykgKyAnPC9zcGFuPjwvZGl2PidcbiAgKS5qb2luKCcnKTtcbiAgY29uc3QgcGl4Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBpeC1ib3gnKTtcbiAgaWYgKHBpeEJveCkge1xuICAgIHBpeEJveC5pbm5lckhUTUwgPVxuICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6NTJweDttYXJnaW4tYm90dG9tOjhweFwiPlx1MjcwNTwvZGl2PicgK1xuICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MjBweDtmb250LXdlaWdodDo3MDA7Y29sb3I6IzE2NjUzNDttYXJnaW4tYm90dG9tOjRweFwiPlBhZ2FtZW50byByZWNlYmlkbyE8L2Rpdj4nICtcbiAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjEzcHg7Y29sb3I6IzZCNUI1MjttYXJnaW4tYm90dG9tOjE2cHhcIj5TZXUgcGVkaWRvIGZvaSBjb25maXJtYWRvIGNvbSBzdWNlc3NvPC9kaXY+JyArXG4gICAgICAnPGRpdiBzdHlsZT1cImJhY2tncm91bmQ6I2YwZmRmNDtib3JkZXI6MS41cHggc29saWQgI2JiZjdkMDtib3JkZXItcmFkaXVzOjEycHg7cGFkZGluZzoxNHB4O3RleHQtYWxpZ246bGVmdDttYXJnaW4tYm90dG9tOjE0cHhcIj4nICtcbiAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6NzAwO2NvbG9yOiMxNjY1MzQ7bWFyZ2luLWJvdHRvbTo4cHg7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi41cHhcIj5cdUQ4M0RcdURDQ0IgUmVzdW1vIGRvIHBlZGlkbzwvZGl2PicgK1xuICAgICAgbGluaGFzSXRlbnMgK1xuICAgICAgJzxkaXYgc3R5bGU9XCJib3JkZXItdG9wOjFweCBzb2xpZCAjYmJmN2QwO21hcmdpbi10b3A6OHB4O3BhZGRpbmctdG9wOjhweDtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc2l6ZToxNHB4XCI+JyArXG4gICAgICAnPHNwYW4+VG90YWw8L3NwYW4+PHNwYW4gc3R5bGU9XCJjb2xvcjojRTg1MjhBXCI+UiQgJyArIE51bWJlcihfcGl4VG90YWwpLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJykgKyAnPC9zcGFuPicgK1xuICAgICAgJzwvZGl2PicgK1xuICAgICAgJzxkaXYgc3R5bGU9XCJtYXJnaW4tdG9wOjhweDtmb250LXNpemU6MTFweDtjb2xvcjojNGI3YzVlXCI+XHVEODNEXHVEQ0NEICcgKyBlc2NIVE1MKF9waXhFbmRlcmVjbykgKyAnPC9kaXY+JyArXG4gICAgICAnPC9kaXY+JyArXG4gICAgICAnPGJ1dHRvbiBvbmNsaWNrPVwiZmVjaGFyUmVjaWJvUGl4KClcIiBzdHlsZT1cIndpZHRoOjEwMCU7cGFkZGluZzoxM3B4O2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDEzNWRlZywjRTg1MjhBLCNDMjNBNkUpO2NvbG9yOiNmZmY7Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc2l6ZToxNXB4O2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6MTJweDtjdXJzb3I6cG9pbnRlcjtmb250LWZhbWlseTppbmhlcml0XCI+XHVEODNEXHVEQ0FDIFZlciBwZWRpZG8gbm8gV2hhdHNBcHA8L2J1dHRvbj4nO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZlY2hhclJlY2lib1BpeCgpOiB2b2lkIHtcbiAgY29uc3QgbXNnV0EgPSBfcGl4TXNnV0E7XG4gIF9waXhDYW5jZWxsZWQgPSB0cnVlO1xuICBpZiAoX3BpeFBvbGxUaW1lcikgeyBjbGVhckludGVydmFsKF9waXhQb2xsVGltZXIpOyBfcGl4UG9sbFRpbWVyID0gbnVsbDsgfVxuICBpZiAoX3BpeFBvbGxUaW1lb3V0VGltZXIpIHsgY2xlYXJUaW1lb3V0KF9waXhQb2xsVGltZW91dFRpbWVyKTsgX3BpeFBvbGxUaW1lb3V0VGltZXIgPSBudWxsOyB9XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgbGltcGFyQ2FycmluaG8oKTtcbiAgX3BpeFBlZGlkb0lkID0gbnVsbDsgX3BpeFBheWxvYWQgPSAnJzsgX3BpeE1zZ1dBID0gJyc7IF9waXhUb3RhbCA9IDA7XG4gIF9waXhJdGVucyA9IFtdOyBfcGl4RW5kZXJlY28gPSAnJztcbiAgaWYgKG1zZ1dBKSB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQobXNnV0EpLCAnX2JsYW5rJyk7XG59XG5cbmZ1bmN0aW9uIGNvcGlhclBpeCgpOiB2b2lkIHtcbiAgaWYgKCFfcGl4UGF5bG9hZCkgcmV0dXJuO1xuICBpZiAobmF2aWdhdG9yLmNsaXBib2FyZCkge1xuICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KF9waXhQYXlsb2FkKS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5waXgtY29weS1idG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gICAgICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MDUgQ1x1MDBGM2RpZ28gY29waWFkbyEnOyBzZXRUaW1lb3V0KCgpID0+IHsgYnRuLnRleHRDb250ZW50ID0gJ1x1RDgzRFx1RENDQiBDb3BpYXIgY2hhdmUgUGl4JzsgfSwgMjUwMCk7IH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgdGEudmFsdWUgPSBfcGl4UGF5bG9hZDtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRhKTtcbiAgICB0YS5zZWxlY3QoKTtcbiAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGEpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhbmNlbGFyUGl4KCk6IHZvaWQge1xuICBfcGl4Q2FuY2VsbGVkID0gdHJ1ZTtcbiAgaWYgKF9waXhQb2xsVGltZXIpIHsgY2xlYXJJbnRlcnZhbChfcGl4UG9sbFRpbWVyKTsgX3BpeFBvbGxUaW1lciA9IG51bGw7IH1cbiAgaWYgKF9waXhQb2xsVGltZW91dFRpbWVyKSB7IGNsZWFyVGltZW91dChfcGl4UG9sbFRpbWVvdXRUaW1lcik7IF9waXhQb2xsVGltZW91dFRpbWVyID0gbnVsbDsgfVxuICBjb25zdCBlc3RhQWJlcnRvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BpeEJhY2tkcm9wJyk/LmNsYXNzTGlzdC5jb250YWlucygnYWJlcnRvJykgPz8gZmFsc2U7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaXhCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgX3BpeFBlZGlkb0lkID0gbnVsbDsgX3BpeFBheWxvYWQgPSAnJzsgX3BpeE1zZ1dBID0gJyc7IF9waXhUb3RhbCA9IDA7XG4gIF9waXhJdGVucyA9IFtdOyBfcGl4RW5kZXJlY28gPSAnJztcbiAgaWYgKGVzdGFBYmVydG8pIGFicmlyTW9kYWwoKTtcbn1cblxuZnVuY3Rpb24gcGl4SmFQYWd1ZWkoKTogdm9pZCB7XG4gIGNhbmNlbGFyUGl4KCk7XG4gIGZpbmFsaXphclBlZGlkb1doYXRzQXBwKCk7XG59XG5cbmZ1bmN0aW9uIGZpbmFsaXphclBlZGlkb1doYXRzQXBwKCk6IHZvaWQge1xuICBjb25zdCBpdGVucyA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCk7XG4gIGlmIChpdGVucy5sZW5ndGggPT09IDApIHsgbW9zdHJhclRvYXN0KCdDYXJyaW5obyB2YXppbycsICdlcnJvJyk7IHJldHVybjsgfVxuICBjb25zdCBub21lID0gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJykgYXMgSFRNTElucHV0RWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3QgZW5kZXJlY28gPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcbiAgY29uc3QgdG90YWwgPSBBcnJheS5mcm9tKGl0ZW5zKS5yZWR1Y2UoKHMsIGkpID0+IHMgKyBpLnByZWNvLCAwKTtcbiAgY29uc3QgbGluaGFzID0gQXJyYXkuZnJvbShpdGVucykubWFwKGkgPT4gYFx1MjVCOCAke2kubm9tZX0gXHUyMDE0IFIkICR7aS5wcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfSBgKS5qb2luKCdcXG4nKTtcbiAgY29uc3QgbXNnID0gYFx1RDgzRFx1REVEMiAqUEVESURPIEdFTEFNT1VSKiAoUGl4IGVudmlhZG8gbWFudWFsbWVudGUpXFxuXFxuJHtsaW5oYXN9XFxuXFxuKlRvdGFsOiBSJCAke3RvdGFsLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyl9Klxcblxcblx1RDgzRFx1REM2NCAke25vbWV9XFxuXHVEODNEXHVEQ0NEICR7ZW5kZXJlY299XFxuXFxuX0NvbmZpcm1hbmRvIGVudmlvIGRvIHBhZ2FtZW50byBQaXguX2A7XG4gIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChtc2cpLCAnX2JsYW5rJyk7XG59XG5cbi8vID09PT09IExPR0lOIFVJID09PT09XG5mdW5jdGlvbiBtYXNjYXJhVGVsZWZvbmUoZWw6IEhUTUxJbnB1dEVsZW1lbnQpOiB2b2lkIHtcbiAgZWwudmFsdWUgPSBhcGxpY2FyTWFzY2FyYVRlbGVmb25lKGVsLnZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZW50cmFyQ29tQ2xpZW50ZShjbGllbnRlUmF3OiBDbGllbnRlKTogdm9pZCB7XG4gIGNvbnN0IGRvbWFpbkNsaWVudGUgPSBDbGllbnRlRW50aXR5LmZyb21EQihjbGllbnRlUmF3KTtcbiAgbG9naW5Vc2VDYXNlLmxvZ2luKGRvbWFpbkNsaWVudGUpO1xuXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk92ZXJsYXknKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgY29uc3QgdXN1YXJpb0JhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvQmFyJyk7XG4gIGlmICh1c3VhcmlvQmFyKSB1c3VhcmlvQmFyLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWZsZXgnO1xuICBjb25zdCB1c3VhcmlvTm9tZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzdWFyaW9Ob21lJyk7XG4gIGlmICh1c3VhcmlvTm9tZUVsKSB1c3VhcmlvTm9tZUVsLnRleHRDb250ZW50ID0gY2xpZW50ZVJhdy5ub21lO1xuICBjb25zdCByb2xldGFCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQnRuRmx1dHVhbnRlJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpZiAocm9sZXRhQnRuKSByb2xldGFCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgY29uc3QgdXN1YXJpb1RlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvVGVsJyk7XG4gIGlmICh1c3VhcmlvVGVsKSB1c3VhcmlvVGVsLnRleHRDb250ZW50ID0gY2xpZW50ZVJhdy50ZWxlZm9uZS5yZXBsYWNlKC9eKFxcZHsyfSkoXFxkezV9KShcXGR7NH0pJC8sICcoJDEpICQyLSQzJyk7XG4gIGNvbnN0IGlucE5vbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsO1xuICBpZiAoaW5wTm9tZSkgaW5wTm9tZS52YWx1ZSA9IGNsaWVudGVSYXcubm9tZTtcbiAgY29uc3QgaW5wRW5kZXJlY28gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGlucEVuZGVyZWNvICYmIGNsaWVudGVSYXcuZW5kZXJlY28pIGlucEVuZGVyZWNvLnZhbHVlID0gY2xpZW50ZVJhdy5lbmRlcmVjbztcbn1cblxuYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyVGVsZWZvbmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChfdmVyaWZpY2FuZG8pIHJldHVybjtcbiAgY29uc3QgdGVsSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IGVycm8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5FcnJvJyk7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNldGFwYVRlbGVmb25lIGJ1dHRvbicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgaWYgKGVycm8pIGVycm8uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnVmVyaWZpY2FuZG8uLi4nOyBidG4uZGlzYWJsZWQgPSB0cnVlOyB9XG4gIF92ZXJpZmljYW5kbyA9IHRydWU7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLmV4ZWN1dGUodGVsSW5wdXQudmFsdWUpO1xuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICBjb25zdCBpc1VzZXJNc2cgPSByZXN1bHQuZXJyb3IubmFtZSA9PT0gJ1ZhbGlkYXRpb25FcnJvcicgfHwgcmVzdWx0LmVycm9yLm5hbWUgPT09ICdSYXRlTGltaXRFcnJvcic7XG4gICAgICBjb25zdCBtc2cgPSBpc1VzZXJNc2dcbiAgICAgICAgPyByZXN1bHQuZXJyb3IubWVzc2FnZVxuICAgICAgICA6ICdTZW0gY29uZXhcdTAwRTNvIGNvbSBvIHNlcnZpZG9yLiBWZXJpZmlxdWUgc3VhIGludGVybmV0IGUgdGVudGUgbm92YW1lbnRlLic7XG4gICAgICBsb2cuZXJyb3IoJ3ZlcmlmaWNhclRlbGVmb25lIGZhbGhvdScsIHsgZXJyb3I6IHJlc3VsdC5lcnJvci5tZXNzYWdlIH0pO1xuICAgICAgaWYgKGVycm8pIHsgZXJyby50ZXh0Q29udGVudCA9IG1zZzsgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LnZhbHVlLmV4aXN0ZSAmJiByZXN1bHQudmFsdWUuY2xpZW50ZSkge1xuICAgICAgZW50cmFyQ29tQ2xpZW50ZShyZXN1bHQudmFsdWUuY2xpZW50ZS50b0pTT04oKSBhcyBDbGllbnRlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXRhcGFUZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFUZWxlZm9uZScpO1xuICAgICAgY29uc3QgZXRhcGFDYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFDYWRhc3RybycpO1xuICAgICAgaWYgKGV0YXBhVGVsKSBldGFwYVRlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgaWYgKGV0YXBhQ2FkKSBldGFwYUNhZC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICh0ZWxJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50ICYgeyBkYXRhc2V0OiBET01TdHJpbmdNYXAgfSkuZGF0YXNldFsndGVsJ10gPSB0ZWxJbnB1dC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luTm9tZScpPy5mb2N1cygpO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgaWYgKGVycm8pIHsgZXJyby50ZXh0Q29udGVudCA9ICdTZW0gY29uZXhcdTAwRTNvIG91IGVycm8gbm8gc2Vydmlkb3IuIFRlbnRlIG5vdmFtZW50ZS4nOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnQ29udGludWFyIFx1MjE5Mic7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyB9XG4gICAgX3ZlcmlmaWNhbmRvID0gZmFsc2U7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FkYXN0cmFyKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoX2NhZGFzdHJhbmRvKSByZXR1cm47XG4gIGNvbnN0IG5vbWVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCB0ZWxJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpblRlbGVmb25lJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgY29uc3Qgbm9tZSA9IG5vbWVJbnB1dC52YWx1ZTtcbiAgY29uc3QgdGVsID0gKHRlbElucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQgJiB7IGRhdGFzZXQ6IERPTVN0cmluZ01hcCB9KS5kYXRhc2V0Wyd0ZWwnXSA/PyAnJztcbiAgY29uc3QgZXJybyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYWRhc3Ryb0Vycm8nKTtcbiAgaWYgKCFub21lLnRyaW0oKSkge1xuICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSAnRGlnaXRlIHNldSBub21lLic7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGVycm8pIGVycm8uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2V0YXBhQ2FkYXN0cm8gYnV0dG9uJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdFbnRyYW5kby4uLic7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IH1cbiAgX2NhZGFzdHJhbmRvID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBsb2dpblVzZUNhc2UucmVnaXN0ZXIobm9tZSwgdGVsLCAnJyk7XG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIGNvbnN0IGlzVXNlck1zZyA9IHJlc3VsdC5lcnJvci5uYW1lID09PSAnVmFsaWRhdGlvbkVycm9yJyB8fCByZXN1bHQuZXJyb3IubmFtZSA9PT0gJ1JhdGVMaW1pdEVycm9yJztcbiAgICAgIGNvbnN0IGNhZGFzdHJvTXNnID0gaXNVc2VyTXNnID8gcmVzdWx0LmVycm9yLm1lc3NhZ2UgOiAnRXJybyBhbyBjYWRhc3RyYXIuIFZlcmlmaXF1ZSBzdWEgY29uZXhcdTAwRTNvIGUgdGVudGUgbm92YW1lbnRlLic7XG4gICAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gY2FkYXN0cm9Nc2c7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW50cmFyQ29tQ2xpZW50ZShyZXN1bHQudmFsdWUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gIH0gY2F0Y2gge1xuICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSAnRXJybyBhbyBjYWRhc3RyYXIuIFZlcmlmaXF1ZSBzdWEgY29uZXhcdTAwRTNvIGUgdGVudGUgbm92YW1lbnRlLic7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdFbnRyYXIgbm8gY2FyZFx1MDBFMXBpbyBcdTI3MjgnOyBidG4uZGlzYWJsZWQgPSBmYWxzZTsgfVxuICAgIF9jYWRhc3RyYW5kbyA9IGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZvbHRhckV0YXBhVGVsZWZvbmUoKTogdm9pZCB7XG4gIGNvbnN0IGV0YXBhQ2FkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhQ2FkYXN0cm8nKTtcbiAgY29uc3QgZXRhcGFUZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFUZWxlZm9uZScpO1xuICBpZiAoZXRhcGFDYWQpIGV0YXBhQ2FkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG59XG5cbmZ1bmN0aW9uIHNhaXIoKTogdm9pZCB7XG4gIGlmICghY29uZmlybSgnRGVzZWphIHNhaXIgZGEgc3VhIGNvbnRhPycpKSByZXR1cm47XG4gIGxvZ2luVXNlQ2FzZS5sb2dvdXQoKTtcbiAgY29uc3QgdXN1YXJpb0JhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvQmFyJyk7XG4gIGlmICh1c3VhcmlvQmFyKSB1c3VhcmlvQmFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlID0gJyc7XG4gIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZSA9ICcnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9ICcnO1xuICBjb25zdCBldGFwYVRlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYVRlbGVmb25lJyk7XG4gIGNvbnN0IGV0YXBhQ2FkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhQ2FkYXN0cm8nKTtcbiAgaWYgKGV0YXBhVGVsKSBldGFwYVRlbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgaWYgKGV0YXBhQ2FkKSBldGFwYUNhZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5PdmVybGF5JykhLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG59XG5cbmZ1bmN0aW9uIG1vc3RyYXJMb2dpbigpOiB2b2lkIHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luT3ZlcmxheScpIS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICBzZXRUaW1lb3V0KCgpID0+IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpPy5mb2N1cygpLCAzMDApO1xufVxuXG4vLyA9PT09PSBST0xFVEEgVUkgPT09PT1cbmFzeW5jIGZ1bmN0aW9uIGFicmlyUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBiZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCYWNrZHJvcCcpO1xuICBpZiAoIWJkKSByZXR1cm47XG4gIGJkLmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLWFiZXJ0bycpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhU3RhdHVzQm94JykhLmlubmVySFRNTCA9ICcnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5hdGl2YScpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhTmFvTG9nYWRvJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQnRuRW52aWFyV3JhcCcpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVdoZWVsU2VjdGlvbicpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSmFHaXJvdScpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhUmVzdWx0YWRvJykhLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2l2ZWwnKTtcblxuICBjb25zdCBjZmcgPSBhd2FpdCBjYXJyZWdhckNvbmZpZ1JvbGV0YSgpO1xuICBjb25zdCBwcmVtaW9zID0gZ2V0UHJlbWlvcygpO1xuXG4gIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhUHJlbWlvc0dyaWQnKTtcbiAgaWYgKGdyaWQpIHtcbiAgICBjb25zdCBpY29uZXMgPSBbJ1x1RDgzQ1x1REY2QicsICdcdUQ4M0VcdUREQzEnLCAnXHVEODNEXHVERTlBJywgJ1x1RDgzRFx1RENCOCcsICdcdUQ4M0RcdURDQjAnLCAnXHVEODNDXHVERjg5JywgJ1x1RDgzQ1x1REY2RScsICdcdUQ4M0NcdURGODAnLCAnXHVEODNDXHVERjFGJ107XG4gICAgZ3JpZC5pbm5lckhUTUwgPSBwcmVtaW9zLm1hcCgocCwgaSkgPT4gYDxkaXYgY2xhc3M9XCJyb2xldGEtcHJlbWlvLWl0ZW1cIj4ke2ljb25lc1tpICUgaWNvbmVzLmxlbmd0aF19ICR7ZXNjSFRNTChwKX08L2Rpdj5gKS5qb2luKCcnKTtcbiAgfVxuXG4gIGlmIChjZmcgJiYgIWNmZy5hdGl2YSkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbmF0aXZhJykhLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIH1cblxuICBkZXNlbmhhclJvbGV0YShwcmVtaW9zKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVdoZWVsU2VjdGlvbicpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhTmFvTG9nYWRvJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluc3RydWNvZXMnKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBjb25zdCBnaXJhckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSBmYWxzZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcxJzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERkExIEdJUkFSIEFHT1JBISc7IH1cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGF0dXMgPSBhd2FpdCB2ZXJpZmljYXJTdGF0dXNSb2xldGEoY2xpZW50ZUF0dWFsLmlkID8/IDApO1xuICBhdHVhbGl6YXJVSVJvbGV0YShzdGF0dXMpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJSb2xldGEoKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdtb2RhbC1hYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdyb2xldGFCYWNrZHJvcCcpIGZlY2hhclJvbGV0YSgpO1xufVxuXG5mdW5jdGlvbiBhdHVhbGl6YXJVSVJvbGV0YShpbmZvOiBQYXJ0aWNpcGFjYW8gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHN0YXR1c0JveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFTdGF0dXNCb3gnKSE7XG4gIGNvbnN0IGluc3RydWNvZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdHJ1Y29lcycpITtcbiAgY29uc3QgYnRuRW52aWFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkVudmlhcldyYXAnKSE7XG4gIGNvbnN0IHdoZWVsU2VjdGlvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFXaGVlbFNlY3Rpb24nKSE7XG4gIGNvbnN0IGphR2lyb3UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSmFHaXJvdScpITtcbiAgY29uc3QgZ2lyYXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG5cbiAgd2hlZWxTZWN0aW9uLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICBkZXNlbmhhclJvbGV0YShnZXRQcmVtaW9zKCkpO1xuXG4gIGlmIChpc0NvbnRhVGVzdGUoYXBwU3RvcmUuZ2V0U3RhdGUoKS5jbGllbnRlKSkge1xuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzEnOyBnaXJhckJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGQTEgR0lSQVIgQUdPUkEhJzsgfVxuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnJztcbiAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghaW5mbykge1xuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnJztcbiAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gdHJ1ZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyBnaXJhckJ0bi50aXRsZSA9ICdFbnZpZSBzdWFzIHByb3ZhcyBwYXJhIGxpYmVyYXIgYSByb2xldGEnOyB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGluZm8uc3RhdHVzID09PSAncGVuZGVudGUnKSB7XG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1wZW5kZW50ZVwiPlx1MjNGMyA8ZGl2PjxzdHJvbmc+UGFydGljaXBhXHUwMEU3XHUwMEUzbyBlbnZpYWRhITwvc3Ryb25nPjxicj5TdWFzIHByb3ZhcyBlc3RcdTAwRTNvIGVtIGFuXHUwMEUxbGlzZS4gQWd1YXJkZSBhIGFwcm92YVx1MDBFN1x1MDBFM28gKGF0XHUwMEU5IDI0aCkuPC9kaXY+PC9kaXY+JztcbiAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgZ2lyYXJCdG4udGl0bGUgPSAnQWd1YXJkYW5kbyBhcHJvdmFcdTAwRTdcdTAwRTNvJzsgfVxuICB9IGVsc2UgaWYgKGluZm8uc3RhdHVzID09PSAncmVqZWl0YWRvJykge1xuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1zdGF0dXMtYm94IHJvbGV0YS1zdGF0dXMtcmVqZWl0YWRvXCI+XHUyNzRDIDxkaXY+PHN0cm9uZz5QYXJ0aWNpcGFcdTAwRTdcdTAwRTNvIG5cdTAwRTNvIGFwcm92YWRhLjwvc3Ryb25nPjxicj5UZW50ZSBub3ZhbWVudGUgY3VtcHJpbmRvIHRvZG9zIG9zIHJlcXVpc2l0b3MuPC9kaXY+PC9kaXY+JztcbiAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IH1cbiAgfSBlbHNlIGlmIChpbmZvLnN0YXR1cyA9PT0gJ2Fwcm92YWRvJyAmJiAhaW5mby5qYV9naXJvdSkge1xuICAgIGNvbnN0IGhvamUgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXTtcbiAgICBjb25zdCBkaWFBcHJvdmFjYW8gPSBpbmZvLmRhdGFfYXByb3ZhY2FvID8gaW5mby5kYXRhX2Fwcm92YWNhby5zcGxpdCgnVCcpWzBdIDogbnVsbDtcbiAgICBpZiAoZGlhQXByb3ZhY2FvICE9PSBob2plKSB7XG4gICAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtc3RhdHVzLWJveCByb2xldGEtc3RhdHVzLXJlamVpdGFkb1wiPlx1MjNGMCA8ZGl2PjxzdHJvbmc+UHJhem8gZXhwaXJhZG8uPC9zdHJvbmc+PGJyPlZvY1x1MDBFQSBmb2kgYXByb3ZhZG8gZW0gb3V0cm8gZGlhIGUgblx1MDBFM28gZ2lyb3UgYSB0ZW1wby4gRW52aWUgbm92YXMgcHJvdmFzIHBhcmEgcGFydGljaXBhciBub3ZhbWVudGUuPC9kaXY+PC9kaXY+JztcbiAgICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IGdpcmFyQnRuLnRleHRDb250ZW50ID0gJ1x1RDgzRFx1REQxMiBQcmF6byBleHBpcmFkbyc7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1hcHJvdmFkb1wiPlx1MjcwNSA8ZGl2PjxzdHJvbmc+QXByb3ZhZG8hIEdpcmUgaG9qZSE8L3N0cm9uZz48YnI+Vm9jXHUwMEVBIHRlbSBhdFx1MDBFOSBtZWlhLW5vaXRlIHBhcmEgdXNhciBzZXUgZ2lyby4gTlx1MDBFM28gYWN1bXVsYSE8L2Rpdj48L2Rpdj4nO1xuICAgICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gZmFsc2U7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMSc7IGdpcmFyQnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REZBMSBHSVJBUiBBR09SQSEnOyB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGluZm8uamFfZ2lyb3UgJiYgIWlzQ29udGFUZXN0ZShhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUpKSB7XG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICcnO1xuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gdHJ1ZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyB9XG4gICAgY29uc3QgcHJlbWlvRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSmFHaXJvdVByZW1pbycpO1xuICAgIGlmIChwcmVtaW9FbCkge1xuICAgICAgcHJlbWlvRWwuaW5uZXJIVE1MID0gaW5mby5wcmVtaW9cbiAgICAgICAgPyAnU2V1IHByXHUwMEVBbWlvIGZvaTogPHN0cm9uZyBzdHlsZT1cImNvbG9yOnZhcigtLXJvc2EpXCI+JyArIGVzY0hUTUwoaW5mby5wcmVtaW8pICsgJzwvc3Ryb25nPi4gRW50cmUgZW0gY29udGF0byBjb25vc2NvIHBhcmEgcmVzZ2F0YXIhJ1xuICAgICAgICA6ICdWb2NcdTAwRUEgalx1MDBFMSB1c291IHN1YSBjaGFuY2UgbmVzdGEgY2FtcGFuaGEuJztcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2lyYXJSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuICBpZiAoIWNsaWVudGVBdHVhbCkgeyBtb3N0cmFyVG9hc3QoJ0ZhXHUwMEU3YSBsb2dpbiBwYXJhIGdpcmFyIGEgcm9sZXRhIScsICdlcnJvJyk7IHJldHVybjsgfVxuXG4gIGNvbnN0IHN0YXR1c0dpcm8gPSBhd2FpdCB2ZXJpZmljYXJTdGF0dXNSb2xldGEoY2xpZW50ZUF0dWFsLmlkID8/IDApO1xuICBpZiAoIWlzQ29udGFUZXN0ZShhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUpKSB7XG4gICAgaWYgKCFzdGF0dXNHaXJvIHx8IHN0YXR1c0dpcm8uc3RhdHVzICE9PSAnYXByb3ZhZG8nIHx8IHN0YXR1c0dpcm8uamFfZ2lyb3UpIHtcbiAgICAgIG1vc3RyYXJUb2FzdCgnVm9jXHUwMEVBIHByZWNpc2Egc2VyIGFwcm92YWRvIHBlbGEgZXF1aXBlIGFudGVzIGRlIGdpcmFyIScsICdlcnJvJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBzZW1hbmEgPSBnZXRTZW1hbmFBdHVhbCgpO1xuICAgICAgY29uc3QgY291bnRSZXN1bHQgPSBhd2FpdCByb2xldGFSZXBvc2l0b3J5LmNvdW50VmVuY2Vkb3Jlc1NlbWFuYShzZW1hbmEpO1xuICAgICAgY29uc3QgdmVuY2Vkb3Jlc0NvdW50ID0gY291bnRSZXN1bHQub2sgPyBjb3VudFJlc3VsdC52YWx1ZSA6IDA7XG5cbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBmZXRjaChgJHtTVVBBQkFTRV9VUkx9L3Jlc3QvdjEvcm9sZXRhX2NvbmZpZz9pZD1lcS4xJnNlbGVjdD1tYXhfdmVuY2Vkb3Jlc19zZW1hbmFgLCB7XG4gICAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGNmZyA9IGF3YWl0IHJlc3AuanNvbigpIGFzIEFycmF5PHsgbWF4X3ZlbmNlZG9yZXNfc2VtYW5hOiBudW1iZXIgfT47XG4gICAgICBjb25zdCBsaW1pdGUgPSBjZmdbMF0/Lm1heF92ZW5jZWRvcmVzX3NlbWFuYSA/PyAxO1xuICAgICAgaWYgKHZlbmNlZG9yZXNDb3VudCA+PSBsaW1pdGUpIHtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUdpcmFyQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICAgICAgICBpZiAoYnRuKSB7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IH1cbiAgICAgICAgY29uc3QgcmVzdWx0RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhUmVzdWx0YWRvJyk7XG4gICAgICAgIGlmIChyZXN1bHRFbCkge1xuICAgICAgICAgIHJlc3VsdEVsLmlubmVySFRNTCA9ICdcdTI2QTBcdUZFMEYgPHN0cm9uZz5KXHUwMEUxIHRlbW9zIHVtIGdhbmhhZG9yIGVzdGEgc2VtYW5hITwvc3Ryb25nPjxicj48c21hbGw+QSBwclx1MDBGM3hpbWEgcm9kYWRhIGNvbWVcdTAwRTdhIG5hIHNlbWFuYSBxdWUgdmVtLiBGaXF1ZSBkZSBvbGhvITwvc21hbGw+JztcbiAgICAgICAgICByZXN1bHRFbC5jbGFzc0xpc3QuYWRkKCd2aXNpdmVsJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHsgbG9nLndhcm4oJ0Vycm8gYW8gdmVyaWZpY2FyIGxpbWl0ZSBzZW1hbmFsJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pOyB9XG4gIH1cblxuICBhd2FpdCBnaXJhclJvbGV0YUZuKGNsaWVudGVBdHVhbCwgKHByZW1pbzogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhUmVzdWx0YWRvJyk7XG4gICAgaWYgKHJlc3VsdEVsKSB7XG4gICAgICByZXN1bHRFbC5pbm5lckhUTUwgPSAnXHVEODNDXHVERjg5IFZvY1x1MDBFQSBnYW5ob3U6IDxzdHJvbmcgc3R5bGU9XCJjb2xvcjp2YXIoLS1yb3NhKVwiPicgKyBlc2NIVE1MKHByZW1pbykgKyAnPC9zdHJvbmc+ITxicj48c21hbGwgc3R5bGU9XCJmb250LXNpemU6MTNweDtjb2xvcjp2YXIoLS10ZXh0by1zZWMpXCI+RW50cmUgZW0gY29udGF0byBjb25vc2NvIHBlbG8gV2hhdHNBcHAgcGFyYSByZXNnYXRhciBzZXUgcHJcdTAwRUFtaW8hPC9zbWFsbD4nO1xuICAgICAgcmVzdWx0RWwuY2xhc3NMaXN0LmFkZCgndmlzaXZlbCcpO1xuICAgIH1cbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKGJ0bikgYnRuLnRleHRDb250ZW50ID0gJ1x1MjcxMyBHaXJhZG8hJztcbiAgICBzYWx2YXJWZW5jZWRvcihjbGllbnRlQXR1YWwsIHByZW1pbykuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBlbnZpYXJQcm92YXNXaGF0c0FwcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghY2xpZW50ZUF0dWFsKSB7IGFsZXJ0KCdGYVx1MDBFN2EgbG9naW4gYW50ZXMgZGUgZW52aWFyIHN1YXMgcHJvdmFzLicpOyByZXR1cm47IH1cbiAgY29uc3Qgc3RhdHVzQXR1YWwgPSBhd2FpdCB2ZXJpZmljYXJTdGF0dXNSb2xldGEoY2xpZW50ZUF0dWFsLmlkID8/IDApO1xuICBpZiAoc3RhdHVzQXR1YWwgJiYgKHN0YXR1c0F0dWFsLnN0YXR1cyA9PT0gJ3BlbmRlbnRlJyB8fCBzdGF0dXNBdHVhbC5zdGF0dXMgPT09ICdhcHJvdmFkbycpKSB7XG4gICAgYXR1YWxpemFyVUlSb2xldGEoc3RhdHVzQXR1YWwpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBub21lID0gY2xpZW50ZUF0dWFsLm5vbWUgfHwgJyc7XG4gIGNvbnN0IHRlbCA9IGNsaWVudGVBdHVhbC50ZWxlZm9uZSB8fCAnJztcbiAgY29uc3QgaW5zdEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluc3RhZ3JhbUlucHV0JykgYXMgSFRNTElucHV0RWxlbWVudCB8IG51bGw7XG4gIGNvbnN0IGluc3RhZ3JhbSA9IGluc3RFbCA/IGluc3RFbC52YWx1ZS50cmltKCkgOiAnJztcbiAgY29uc3QgbXNnID0gJ09sXHUwMEUxLCBlcXVpcGUgR2VsYW1vdXIhIFF1ZXJvIHBhcnRpY2lwYXIgZGEgUm9sZXRhIFZJUC4lMEElMEFOb21lOiAnICsgZW5jb2RlVVJJQ29tcG9uZW50KG5vbWUpICtcbiAgICAnJTBBVGVsZWZvbmU6ICcgKyBlbmNvZGVVUklDb21wb25lbnQodGVsKSArXG4gICAgKGluc3RhZ3JhbSA/ICclMEFJbnN0YWdyYW06ICcgKyBlbmNvZGVVUklDb21wb25lbnQoaW5zdGFncmFtKSA6ICcnKSArXG4gICAgJyUwQSUwQUVzdG91IGVudmlhbmRvIGEgZm90byBkb3MgbWV1cyA1IGFkZXNpdm9zIGUgbyBwcmludCBkbyBTdG9yeSBwYXJhIHZhbGlkYVx1MDBFN1x1MDBFM28hJztcbiAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgbXNnLCAnX2JsYW5rJyk7XG4gIGF3YWl0IHJlZ2lzdHJhclBhcnRpY2lwYWNhbyhpbnN0YWdyYW0pO1xuICBhdHVhbGl6YXJVSVJvbGV0YSh7IHN0YXR1czogJ3BlbmRlbnRlJywgamFfZ2lyb3U6IGZhbHNlIH0gYXMgUGFydGljaXBhY2FvKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVnaXN0cmFyUGFydGljaXBhY2FvKGluc3RhZ3JhbTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuICBpZiAoIWNsaWVudGVBdHVhbCkgcmV0dXJuO1xuICB0cnkge1xuICAgIGNvbnN0IGNoZWNrID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgICBpZiAoY2hlY2sgJiYgY2hlY2suc3RhdHVzICE9PSAncmVqZWl0YWRvJykgcmV0dXJuO1xuICAgIGNvbnN0IHNlbWFuYSA9IGdldFNlbWFuYUF0dWFsKCk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5zYXZlUGFydGljaXBhY2FvKHtcbiAgICAgIG5vbWU6IGNsaWVudGVBdHVhbC5ub21lLFxuICAgICAgdGVsZWZvbmU6IGNsaWVudGVBdHVhbC50ZWxlZm9uZSxcbiAgICAgIGluc3RhZ3JhbTogaW5zdGFncmFtIHx8IHVuZGVmaW5lZCxcbiAgICAgIHN0YXR1czogJ3BlbmRlbnRlJyxcbiAgICAgIHNlbWFuYSxcbiAgICAgIGphX2dpcm91OiBmYWxzZSxcbiAgICAgIGNyZWF0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9IGFzIGltcG9ydCgnLi9kb21haW4vcm9sZXRhJykuUGFydGljaXBhY2FvUHJvcHMpO1xuICAgIGlmIChyZXN1bHQub2spIHtcbiAgICAgIHNldFBhcnRpY2lwYWNhb0lkKHJlc3VsdC52YWx1ZS5pZCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7IGxvZy53YXJuKCdFcnJvIGFvIHJlZ2lzdHJhciBwYXJ0aWNpcGFcdTAwRTdcdTAwRTNvJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pOyB9XG59XG5cbi8vID09PT09IEFETUlOIFJPTEVUQSA9PT09PVxuZnVuY3Rpb24gdmVyaWZpY2FyQWRtaW4oKTogYm9vbGVhbiB7XG4gIHJldHVybiBhcHBTdG9yZS5nZXRTdGF0ZSgpLmlzQWRtaW47XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFicmlyUm9sZXRhQWRtaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghdmVyaWZpY2FyQWRtaW4oKSkgeyBhbGVydCgnQWNlc3NvIHJlc3RyaXRvLicpOyByZXR1cm47IH1cbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUFkbWluQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG4gIGF3YWl0IGNhcnJlZ2FyUGFydGljaXBhbnRlc1JvbGV0YSgpO1xuICBhd2FpdCBjYXJyZWdhckNvbmZpZ0FkbWluKCk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhclJvbGV0YUFkbWluKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQWRtaW5CYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhQWRtaW5CYWNrZHJvcChlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ3JvbGV0YUFkbWluQmFja2Ryb3AnKSBmZWNoYXJSb2xldGFBZG1pbigpO1xufVxuXG5mdW5jdGlvbiBhYnJpclRhYkFkbWluKHRhYjogc3RyaW5nLCBidG46IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb2xldGEtYWRtaW4tdGFiJykuZm9yRWFjaCh0ID0+IHQuY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb2xldGEtYWRtaW4tcGFuZWwnKS5mb3JFYWNoKHAgPT4gcC5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcbiAgYnRuLmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGNvbnN0IHRhYklkID0gJ3RhYicgKyB0YWIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0YWIuc2xpY2UoMSk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhYklkKT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgaWYgKHRhYiA9PT0gJ3BlbmRlbnRlcycpIGNhcnJlZ2FyUGFydGljaXBhbnRlc1JvbGV0YSgpO1xuICBlbHNlIGlmICh0YWIgPT09ICdhcHJvdmFkb3MnKSBjYXJyZWdhckFwcm92YWRvc1JvbGV0YSgpO1xuICBlbHNlIGlmICh0YWIgPT09ICd2ZW5jZWRvcmVzJykgY2FycmVnYXJWZW5jZWRvcmVzUm9sZXRhKCk7XG4gIGVsc2UgaWYgKHRhYiA9PT0gJ2NvbmZpZycpIGNhcnJlZ2FyQ29uZmlnQWRtaW4oKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJQYXJ0aWNpcGFudGVzUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0YVBlbmRlbnRlcycpO1xuICBpZiAoIWVsKSByZXR1cm47XG4gIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+Q2FycmVnYW5kby4uLjwvZGl2Pic7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfcGFydGljaXBhY29lcz9zdGF0dXM9ZXEucGVuZGVudGUmb3JkZXI9Y3JlYXRlZF9hdC5kZXNjJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8UGFydGljaXBhY2FvPjtcbiAgICBpZiAoIWRhdGEgfHwgIWRhdGEubGVuZ3RoKSB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+TmVuaHVtIHBhcnRpY2lwYW50ZSBwZW5kZW50ZS48L2Rpdj4nOyByZXR1cm47IH1cbiAgICBlbC5pbm5lckhUTUwgPSBkYXRhLm1hcChwID0+IHtcbiAgICAgIGNvbnN0IGR0ID0gbmV3IERhdGUocC5jcmVhdGVkX2F0KS50b0xvY2FsZVN0cmluZygncHQtQlInKTtcbiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtaXRlbVwiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtaW5mb1wiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtbm9tZVwiPicgKyBlc2NIVE1MKHAubm9tZSA/PyAnJykgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS10ZWxcIj4nICsgZXNjSFRNTChwLnRlbGVmb25lKSArIChwLmluc3RhZ3JhbSA/ICcgXHUwMEI3IEAnICsgZXNjSFRNTChwLmluc3RhZ3JhbSkgOiAnJykgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjExcHg7Y29sb3I6Izk5OVwiPicgKyBkdCArICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtYWNvZXNcIj4nICtcbiAgICAgICAgJzxidXR0b24gY2xhc3M9XCJidG4tYXByb3ZhclwiIG9uY2xpY2s9XCJhcHJvdmFyUGFydGljaXBhbnRlKCcgKyBwLmlkICsgJywgdGhpcylcIj5cdTI3MTMgQXByb3ZhcjwvYnV0dG9uPicgK1xuICAgICAgICAnPGJ1dHRvbiBjbGFzcz1cImJ0bi1yZWplaXRhclwiIG9uY2xpY2s9XCJyZWplaXRhclBhcnRpY2lwYW50ZSgnICsgcC5pZCArICcsIHRoaXMpXCI+XHUyNzE3IFJlamVpdGFyPC9idXR0b24+JyArXG4gICAgICAgICc8L2Rpdj48L2Rpdj4nO1xuICAgIH0pLmpvaW4oJycpO1xuICB9IGNhdGNoIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5FcnJvIGFvIGNhcnJlZ2FyLjwvZGl2Pic7IH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJBcHJvdmFkb3NSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpc3RhQXByb3ZhZG9zJyk7XG4gIGlmICghZWwpIHJldHVybjtcbiAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5DYXJyZWdhbmRvLi4uPC9kaXY+JztcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9wYXJ0aWNpcGFjb2VzP3N0YXR1cz1lcS5hcHJvdmFkbyZvcmRlcj1kYXRhX2Fwcm92YWNhby5kZXNjJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8UGFydGljaXBhY2FvPjtcbiAgICBpZiAoIWRhdGEgfHwgIWRhdGEubGVuZ3RoKSB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+TmVuaHVtIGFwcm92YWRvIGFpbmRhLjwvZGl2Pic7IHJldHVybjsgfVxuICAgIGVsLmlubmVySFRNTCA9IGRhdGEubWFwKHAgPT4ge1xuICAgICAgY29uc3QgZHQgPSBwLmRhdGFfYXByb3ZhY2FvID8gbmV3IERhdGUocC5kYXRhX2Fwcm92YWNhbykudG9Mb2NhbGVTdHJpbmcoJ3B0LUJSJykgOiAnXHUyMDE0JztcbiAgICAgIGNvbnN0IGdpcm91ID0gcC5qYV9naXJvdSA/ICdcdTI3MTMgR2lyb3UgXHUyMDE0ICcgKyBlc2NIVE1MKHAucHJlbWlvID8/ICcnKSA6ICdcdTIzRjMgQWd1YXJkYW5kbyBnaXJhcic7XG4gICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWl0ZW1cIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWluZm9cIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLW5vbWVcIj4nICsgZXNjSFRNTChwLm5vbWUgPz8gJycpICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtdGVsXCI+JyArIGVzY0hUTUwocC50ZWxlZm9uZSkgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjExcHg7Y29sb3I6IzM4OGUzY1wiPicgKyBnaXJvdSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTFweDtjb2xvcjojOTk5XCI+QXByb3ZhZG8gZW06ICcgKyBkdCArICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PjwvZGl2Pic7XG4gICAgfSkuam9pbignJyk7XG4gIH0gY2F0Y2ggeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkVycm8gYW8gY2FycmVnYXIuPC9kaXY+JzsgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBhcHJvdmFyUGFydGljaXBhbnRlKGlkOiBudW1iZXIsIGJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnRleHRDb250ZW50ID0gJy4uLic7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/aWQ9ZXEuJyArIGlkLCB7XG4gICAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxuICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04sICdQcmVmZXInOiAncmV0dXJuPW1pbmltYWwnXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzdGF0dXM6ICdhcHJvdmFkbycsXG4gICAgICAgIGRhdGFfYXByb3ZhY2FvOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGFwcm92YWRvX3BvcjogY2xpZW50ZUF0dWFsID8gY2xpZW50ZUF0dWFsLm5vbWUgOiAnYWRtaW4nXG4gICAgICB9KVxuICAgIH0pO1xuICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKCdzdGF0dXMgJyArIHIuc3RhdHVzKTtcbiAgICBidG4uY2xvc2VzdCgnLnJvbGV0YS1wYXJ0aWNpcGFudGUtaXRlbScpPy5yZW1vdmUoKTtcbiAgfSBjYXRjaCB7XG4gICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTMgQXByb3Zhcic7XG4gICAgYWxlcnQoJ0Vycm8gYW8gYXByb3Zhci4nKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiByZWplaXRhclBhcnRpY2lwYW50ZShpZDogbnVtYmVyLCBidG46IEhUTUxCdXR0b25FbGVtZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghY29uZmlybSgnUmVqZWl0YXIgZXN0YSBwYXJ0aWNpcGFcdTAwRTdcdTAwRTNvPycpKSByZXR1cm47XG4gIGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi50ZXh0Q29udGVudCA9ICcuLi4nO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/aWQ9ZXEuJyArIGlkLCB7XG4gICAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxuICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04sICdQcmVmZXInOiAncmV0dXJuPW1pbmltYWwnXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdGF0dXM6ICdyZWplaXRhZG8nIH0pXG4gICAgfSk7XG4gICAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ3N0YXR1cyAnICsgci5zdGF0dXMpO1xuICAgIGJ0bi5jbG9zZXN0KCcucm9sZXRhLXBhcnRpY2lwYW50ZS1pdGVtJyk/LnJlbW92ZSgpO1xuICB9IGNhdGNoIHtcbiAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ1x1MjcxNyBSZWplaXRhcic7XG4gICAgYWxlcnQoJ0Vycm8gYW8gcmVqZWl0YXIuJyk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJWZW5jZWRvcmVzUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0YVZlbmNlZG9yZXMnKTtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkNhcnJlZ2FuZG8uLi48L2Rpdj4nO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3ZlbmNlZG9yZXM/b3JkZXI9ZGF0YV92aXRvcmlhLmRlc2MnLCB7XG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByLmpzb24oKSBhcyBBcnJheTx7IG5vbWU/OiBzdHJpbmc7IHByZW1pbzogc3RyaW5nOyB0ZWxlZm9uZT86IHN0cmluZzsgc2VtYW5hPzogc3RyaW5nOyBkYXRhX3ZpdG9yaWE6IHN0cmluZyB9PjtcbiAgICBpZiAoIWRhdGEgfHwgIWRhdGEubGVuZ3RoKSB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+TmVuaHVtIHZlbmNlZG9yIGFpbmRhLjwvZGl2Pic7IHJldHVybjsgfVxuICAgIGVsLmlubmVySFRNTCA9IGRhdGEubWFwKHYgPT4ge1xuICAgICAgY29uc3QgZHQgPSBuZXcgRGF0ZSh2LmRhdGFfdml0b3JpYSkudG9Mb2NhbGVTdHJpbmcoJ3B0LUJSJyk7XG4gICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJyb2xldGEtdmVuY2Vkb3ItaXRlbVwiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS12ZW5jZWRvci1ub21lXCI+XHVEODNDXHVERkM2ICcgKyBlc2NIVE1MKHYubm9tZSA/PyAnXHUyMDE0JykgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXZlbmNlZG9yLXByZW1pb1wiPlx1RDgzQ1x1REY4MSAnICsgZXNjSFRNTCh2LnByZW1pbykgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXZlbmNlZG9yLWRhdGFcIj4nICsgZXNjSFRNTCh2LnRlbGVmb25lID8/ICcnKSArICcgXHUwMEI3IFNlbWFuYSAnICsgZXNjSFRNTCh2LnNlbWFuYSA/PyAnJykgKyAnIFx1MDBCNyAnICsgZHQgKyAnPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nO1xuICAgIH0pLmpvaW4oJycpO1xuICB9IGNhdGNoIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5FcnJvIGFvIGNhcnJlZ2FyLjwvZGl2Pic7IH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJDb25maWdBZG1pbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9jb25maWc/aWQ9ZXEuMSZsaW1pdD0xJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8eyBhdGl2YTogYm9vbGVhbjsgcHJlbWlvczogc3RyaW5nW10gfT47XG4gICAgaWYgKGRhdGEgJiYgZGF0YVswXSkge1xuICAgICAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdBdGl2YScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmNoZWNrZWQgPSBkYXRhWzBdIS5hdGl2YTtcbiAgICAgIGNvbnN0IHByZW1pb3MgPSBBcnJheS5pc0FycmF5KGRhdGFbMF0hLnByZW1pb3MpID8gZGF0YVswXSEucHJlbWlvcyA6IGdldFByZW1pb3NQYWRyYW8oKTtcbiAgICAgIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnUHJlbWlvcycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlID0gcHJlbWlvcy5qb2luKCdcXG4nKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHsgbG9nLndhcm4oJ0Vycm8gYW8gY2FycmVnYXIgY29uZmlnIGFkbWluJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pOyB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNhbHZhckNvbmZpZ1JvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYXRpdmEgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ0F0aXZhJykgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZDtcbiAgY29uc3QgcHJlbWlvc1R4dCA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnUHJlbWlvcycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlO1xuICBjb25zdCBwcmVtaW9zID0gcHJlbWlvc1R4dC5zcGxpdCgnXFxuJykubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihzID0+IHMubGVuZ3RoID4gMCk7XG4gIGNvbnN0IG1zZ0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ01zZycpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9jb25maWc/aWQ9ZXEuMScsIHtcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiwgJ1ByZWZlcic6ICdyZXR1cm49bWluaW1hbCdcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGF0aXZhLCBwcmVtaW9zLCB1cGRhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSlcbiAgICB9KTtcbiAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcignc3RhdHVzICcgKyByLnN0YXR1cyk7XG4gICAgc2V0UHJlbWlvcyhwcmVtaW9zKTtcbiAgICBpZiAobXNnRWwpIHsgbXNnRWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IHNldFRpbWVvdXQoKCkgPT4geyBtc2dFbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9LCAyNTAwKTsgfVxuICB9IGNhdGNoIHsgYWxlcnQoJ0Vycm8gYW8gc2FsdmFyIGNvbmZpZ3VyYVx1MDBFN1x1MDBGNWVzLicpOyB9XG59XG5cbi8vID09PT09IElOSVQgPT09PT1cbihhc3luYyBmdW5jdGlvbiBpbml0KCk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNsaWVudGVTZXNzYW8gPSBsb2dpblVzZUNhc2UucmVzdG9yZVNlc3Npb24oKTtcbiAgICBpZiAoY2xpZW50ZVNlc3Nhbykge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLmV4ZWN1dGUoY2xpZW50ZVNlc3Nhby50ZWxlZm9uZSk7XG4gICAgICBpZiAocmVzdWx0Lm9rICYmIHJlc3VsdC52YWx1ZS5leGlzdGUgJiYgcmVzdWx0LnZhbHVlLmNsaWVudGUpIHtcbiAgICAgICAgZW50cmFyQ29tQ2xpZW50ZShyZXN1bHQudmFsdWUuY2xpZW50ZS50b0pTT04oKSBhcyBDbGllbnRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gRmFsaGEgZGUgcmVkZSBcdTIxOTIgY29uZmlhIG5hIHNlc3NcdTAwRTNvIGxvY2FsIGVtIHZleiBkZSBmYXplciBsb2dvdXRcbiAgICAgIGlmICghcmVzdWx0Lm9rICYmIHJlc3VsdC5lcnJvci5uYW1lID09PSAnTmV0d29ya0Vycm9yJykge1xuICAgICAgICBsb2cud2FybignUmV2YWxpZGFcdTAwRTdcdTAwRTNvIG9mZmxpbmUgXHUyMDE0IHVzYW5kbyBzZXNzXHUwMEUzbyBsb2NhbCcsIHsgdGVsOiBgKioqJHtjbGllbnRlU2Vzc2FvLnRlbGVmb25lLnNsaWNlKC00KX1gIH0pO1xuICAgICAgICBlbnRyYXJDb21DbGllbnRlKGNsaWVudGVTZXNzYW8udG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZ2luVXNlQ2FzZS5sb2dvdXQoKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHsgbG9nLndhcm4oJ0Vycm8gYW8gdmVyaWZpY2FyIHNlc3NcdTAwRTNvJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pOyB9XG4gIG1vc3RyYXJMb2dpbigpO1xufSkoKTtcblxuLy8gUFdBIHNlcnZpY2Ugd29ya2VyXG5pZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xuICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3Rlcignc3cuanMnKS5jYXRjaCgoKSA9PiB7fSk7XG59XG5cbi8vIFNpbmNyb25pemFyIGNhcmRcdTAwRTFwaW8gY29tIFN1cGFiYXNlXG4oYXN5bmMgZnVuY3Rpb24gc2luY3Jvbml6YXJDYXJkYXBpbygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjdHJsID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBjdHJsLmFib3J0KCksIDEwXzAwMCk7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9wcm9kdXRvcz9zZWxlY3Q9bm9tZSxwcmVjbyxkaXNwb25pdmVsJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH0sXG4gICAgICBzaWduYWw6IGN0cmwuc2lnbmFsXG4gICAgfSk7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBpZiAoIXIub2spIHJldHVybjtcbiAgICBjb25zdCBwcm9kcyA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyOyBkaXNwb25pdmVsOiBib29sZWFuIH0+O1xuICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9kcykgfHwgIXByb2RzLmxlbmd0aCkgcmV0dXJuO1xuICAgIGNvbnN0IG1hcGE6IFJlY29yZDxzdHJpbmcsIHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyOyBkaXNwb25pdmVsOiBib29sZWFuIH0+ID0ge307XG4gICAgcHJvZHMuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwICYmIHR5cGVvZiBwLm5vbWUgPT09ICdzdHJpbmcnICYmIHAubm9tZS50cmltKCkpIG1hcGFbcC5ub21lLnRyaW0oKS50b0xvd2VyQ2FzZSgpXSA9IHA7XG4gICAgfSk7XG4gICAgY29uc3QgcHJpY2VNYXAgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idG4tcGVkaXInKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgICBjb25zdCBvbmNsaWNrQXR0ciA9IGJ0bi5nZXRBdHRyaWJ1dGUoJ29uY2xpY2snKSA/PyAnJztcbiAgICAgIGNvbnN0IG0gPSBvbmNsaWNrQXR0ci5tYXRjaCgvcGVkaXJQcm9kdXRvXFwodGhpcywnKC4rPyknLChcXGQrKD86XFwuXFxkKyk/KVxcKS8pO1xuICAgICAgaWYgKCFtKSByZXR1cm47XG4gICAgICBjb25zdCBub21lUHJvZCA9IG1bMV0hO1xuICAgICAgY29uc3QgY2hhdmUgPSBub21lUHJvZC50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IGRiID0gbWFwYVtjaGF2ZV07XG4gICAgICBpZiAoIWRiKSByZXR1cm47XG4gICAgICBjb25zdCBjYXJkID0gYnRuLmNsb3Nlc3QoJy5wcm9kLWNhcmQnKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICBpZiAoIWNhcmQpIHJldHVybjtcbiAgICAgIGlmIChkYi5kaXNwb25pdmVsID09PSBmYWxzZSkgeyBjYXJkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IHJldHVybjsgfVxuICAgICAgY29uc3Qgbm92b1ByZWNvID0gcGFyc2VGbG9hdChTdHJpbmcoZGIucHJlY28pKTtcbiAgICAgIGlmIChpc05hTihub3ZvUHJlY28pIHx8IG5vdm9QcmVjbyA8PSAwKSByZXR1cm47XG4gICAgICBidG4uc2V0QXR0cmlidXRlKCdvbmNsaWNrJywgXCJwZWRpclByb2R1dG8odGhpcywnXCIgKyBub21lUHJvZC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIikgKyBcIicsXCIgKyBub3ZvUHJlY28gKyBcIilcIik7XG4gICAgICBjb25zdCBwcmVjb0VsID0gY2FyZC5xdWVyeVNlbGVjdG9yKCcucHJvZC1wcmVjbycpO1xuICAgICAgaWYgKHByZWNvRWwpIHByZWNvRWwudGV4dENvbnRlbnQgPSAnUiQgJyArIG5vdm9QcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xuICAgICAgcHJpY2VNYXAuc2V0KG5vbWVQcm9kLCBub3ZvUHJlY28pO1xuICAgIH0pO1xuICAgIGNhcnRTZXJ2aWNlLnJldmFsaWRhdGVQcmljZXMocHJpY2VNYXApO1xuICB9IGNhdGNoIHsgLyogc2lsZW5jaW9zbyAqLyB9XG59KSgpO1xuXG4vLyBGZWNoYXIgbW9kYWlzIGNvbSBFc2NhcGVcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgZmVjaGFyRGlhbG9nKCk7XG4gICAgZmVjaGFyTW9kYWwoKTtcbiAgICBmZWNoYXJDb25maXJtV0EoKTtcbiAgICBjYW5jZWxhclBpeCgpO1xuICB9XG59KTtcblxuLy8gPT09PT0gRVhQT1IgUEFSQSBIVE1MIChvbmNsaWNrPVwiLi4uXCIpID09PT09XG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIGZpbHRyYXI6IHR5cGVvZiBmaWx0cmFyO1xuICAgIHBlZGlyUHJvZHV0bzogdHlwZW9mIHBlZGlyUHJvZHV0bztcbiAgICBhYnJpckRpYWxvZzogdHlwZW9mIGFicmlyRGlhbG9nO1xuICAgIGZlY2hhckRpYWxvZzogdHlwZW9mIGZlY2hhckRpYWxvZztcbiAgICBmZWNoYXJEaWFsb2dCYWNrZHJvcDogdHlwZW9mIGZlY2hhckRpYWxvZ0JhY2tkcm9wO1xuICAgIGlyUGFyYUZpbmFsaXphcjogdHlwZW9mIGlyUGFyYUZpbmFsaXphcjtcbiAgICBhYnJpck1vZGFsOiB0eXBlb2YgYWJyaXJNb2RhbDtcbiAgICBmZWNoYXJNb2RhbDogdHlwZW9mIGZlY2hhck1vZGFsO1xuICAgIGZlY2hhck1vZGFsQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJNb2RhbEJhY2tkcm9wO1xuICAgIHJlbW92ZXJEb0NhcnJpbmhvOiB0eXBlb2YgcmVtb3ZlckRvQ2FycmluaG87XG4gICAgc2VsZWNpb25hclBhZ2FtZW50bzogdHlwZW9mIHNlbGVjaW9uYXJQYWdhbWVudG87XG4gICAgZmluYWxpemFyUGVkaWRvOiB0eXBlb2YgZmluYWxpemFyUGVkaWRvO1xuICAgIGNvbmZpcm1hckVudmlvV0E6IHR5cGVvZiBjb25maXJtYXJFbnZpb1dBO1xuICAgIGZlY2hhckNvbmZpcm1XQTogdHlwZW9mIGZlY2hhckNvbmZpcm1XQTtcbiAgICBwZWRpckJvbG9Gb3JtYTogdHlwZW9mIHBlZGlyQm9sb0Zvcm1hO1xuICAgIGFicmlyRGlhbG9nQm9sbzogdHlwZW9mIGFicmlyRGlhbG9nQm9sbztcbiAgICBmZWNoYXJEaWFsb2dCb2xvOiB0eXBlb2YgZmVjaGFyRGlhbG9nQm9sbztcbiAgICBhZ2VuZGFyQm9sb1doYXRzQXBwOiB0eXBlb2YgYWdlbmRhckJvbG9XaGF0c0FwcDtcbiAgICBjYXJvdXNlbE5leHQ6IHR5cGVvZiBjYXJvdXNlbE5leHQ7XG4gICAgY2Fyb3VzZWxQcmV2OiB0eXBlb2YgY2Fyb3VzZWxQcmV2O1xuICAgIGNvcGlhclBpeDogdHlwZW9mIGNvcGlhclBpeDtcbiAgICBjYW5jZWxhclBpeDogdHlwZW9mIGNhbmNlbGFyUGl4O1xuICAgIHBpeEphUGFndWVpOiB0eXBlb2YgcGl4SmFQYWd1ZWk7XG4gICAgc2VsZWNpb25hclRpcG9DYXJ0YW86IHR5cGVvZiBzZWxlY2lvbmFyVGlwb0NhcnRhbztcbiAgICBmb3JtYXRhckNhcnRhbzogdHlwZW9mIGZvcm1hdGFyQ2FydGFvO1xuICAgIGZvcm1hdGFyQ3BmOiB0eXBlb2YgZm9ybWF0YXJDcGY7XG4gICAgZm9ybWF0YXJWYWxpZGFkZTogdHlwZW9mIGZvcm1hdGFyVmFsaWRhZGU7XG4gICAgZm9ybWF0YXJDZXA6IHR5cGVvZiBmb3JtYXRhckNlcDtcbiAgICBwYWdhckNhcnRhbzogdHlwZW9mIHBhZ2FyQ2FydGFvO1xuICAgIGZlY2hhclJlY2lib1BpeDogdHlwZW9mIGZlY2hhclJlY2lib1BpeDtcbiAgICBtYXNjYXJhVGVsZWZvbmU6IHR5cGVvZiBtYXNjYXJhVGVsZWZvbmU7XG4gICAgdmVyaWZpY2FyVGVsZWZvbmU6IHR5cGVvZiB2ZXJpZmljYXJUZWxlZm9uZTtcbiAgICBjYWRhc3RyYXI6IHR5cGVvZiBjYWRhc3RyYXI7XG4gICAgdm9sdGFyRXRhcGFUZWxlZm9uZTogdHlwZW9mIHZvbHRhckV0YXBhVGVsZWZvbmU7XG4gICAgc2FpcjogdHlwZW9mIHNhaXI7XG4gICAgYWJyaXJSb2xldGE6IHR5cGVvZiBhYnJpclJvbGV0YTtcbiAgICBmZWNoYXJSb2xldGE6IHR5cGVvZiBmZWNoYXJSb2xldGE7XG4gICAgZmVjaGFyUm9sZXRhQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJSb2xldGFCYWNrZHJvcDtcbiAgICBnaXJhclJvbGV0YTogdHlwZW9mIGdpcmFyUm9sZXRhO1xuICAgIGVudmlhclByb3Zhc1doYXRzQXBwOiB0eXBlb2YgZW52aWFyUHJvdmFzV2hhdHNBcHA7XG4gICAgYWJyaXJSb2xldGFBZG1pbjogdHlwZW9mIGFicmlyUm9sZXRhQWRtaW47XG4gICAgZmVjaGFyUm9sZXRhQWRtaW46IHR5cGVvZiBmZWNoYXJSb2xldGFBZG1pbjtcbiAgICBmZWNoYXJSb2xldGFBZG1pbkJhY2tkcm9wOiB0eXBlb2YgZmVjaGFyUm9sZXRhQWRtaW5CYWNrZHJvcDtcbiAgICBhYnJpclRhYkFkbWluOiB0eXBlb2YgYWJyaXJUYWJBZG1pbjtcbiAgICBhcHJvdmFyUGFydGljaXBhbnRlOiB0eXBlb2YgYXByb3ZhclBhcnRpY2lwYW50ZTtcbiAgICByZWplaXRhclBhcnRpY2lwYW50ZTogdHlwZW9mIHJlamVpdGFyUGFydGljaXBhbnRlO1xuICAgIHNhbHZhckNvbmZpZ1JvbGV0YTogdHlwZW9mIHNhbHZhckNvbmZpZ1JvbGV0YTtcbiAgfVxufVxuXG5PYmplY3QuYXNzaWduKHdpbmRvdywge1xuICBmaWx0cmFyLFxuICBwZWRpclByb2R1dG8sXG4gIGFicmlyRGlhbG9nLFxuICBmZWNoYXJEaWFsb2csXG4gIGZlY2hhckRpYWxvZ0JhY2tkcm9wLFxuICBpclBhcmFGaW5hbGl6YXIsXG4gIGFicmlyTW9kYWwsXG4gIGZlY2hhck1vZGFsLFxuICBmZWNoYXJNb2RhbEJhY2tkcm9wLFxuICByZW1vdmVyRG9DYXJyaW5obyxcbiAgc2VsZWNpb25hclBhZ2FtZW50byxcbiAgZmluYWxpemFyUGVkaWRvLFxuICBjb25maXJtYXJFbnZpb1dBLFxuICBmZWNoYXJDb25maXJtV0EsXG4gIHBlZGlyQm9sb0Zvcm1hLFxuICBhYnJpckRpYWxvZ0JvbG8sXG4gIGZlY2hhckRpYWxvZ0JvbG8sXG4gIGFnZW5kYXJCb2xvV2hhdHNBcHAsXG4gIGNhcm91c2VsTmV4dCxcbiAgY2Fyb3VzZWxQcmV2LFxuICBjb3BpYXJQaXgsXG4gIGNhbmNlbGFyUGl4LFxuICBwaXhKYVBhZ3VlaSxcbiAgc2VsZWNpb25hclRpcG9DYXJ0YW8sXG4gIGZvcm1hdGFyQ2FydGFvLFxuICBmb3JtYXRhckNwZixcbiAgZm9ybWF0YXJWYWxpZGFkZSxcbiAgZm9ybWF0YXJDZXAsXG4gIHBhZ2FyQ2FydGFvLFxuICBmZWNoYXJSZWNpYm9QaXgsXG4gIG1hc2NhcmFUZWxlZm9uZSxcbiAgdmVyaWZpY2FyVGVsZWZvbmUsXG4gIGNhZGFzdHJhcixcbiAgdm9sdGFyRXRhcGFUZWxlZm9uZSxcbiAgc2FpcixcbiAgYWJyaXJSb2xldGEsXG4gIGZlY2hhclJvbGV0YSxcbiAgZmVjaGFyUm9sZXRhQmFja2Ryb3AsXG4gIGdpcmFyUm9sZXRhLFxuICBlbnZpYXJQcm92YXNXaGF0c0FwcCxcbiAgYWJyaXJSb2xldGFBZG1pbixcbiAgZmVjaGFyUm9sZXRhQWRtaW4sXG4gIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3AsXG4gIGFicmlyVGFiQWRtaW4sXG4gIGFwcm92YXJQYXJ0aWNpcGFudGUsXG4gIHJlamVpdGFyUGFydGljaXBhbnRlLFxuICBzYWx2YXJDb25maWdSb2xldGEsXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRU8sV0FBUyxhQUFhLEtBQWEsT0FBa0IsUUFBYztBQUN4RSxVQUFNLE1BQU0sU0FBUyxlQUFlLFFBQVE7QUFDNUMsUUFBSSxJQUFLLEtBQUksT0FBTztBQUNwQixVQUFNLElBQUksU0FBUyxjQUFjLEtBQUs7QUFDdEMsTUFBRSxLQUFLO0FBQ1AsTUFBRSxjQUFjO0FBQ2hCLFVBQU0sS0FBSyxTQUFTLFNBQVMsWUFBWSxTQUFTLE9BQU8sWUFBWTtBQUNyRSxXQUFPLE9BQU8sRUFBRSxPQUFPO0FBQUEsTUFDckIsVUFBVTtBQUFBLE1BQVMsUUFBUTtBQUFBLE1BQVEsTUFBTTtBQUFBLE1BQ3pDLFdBQVc7QUFBQSxNQUNYLFlBQVk7QUFBQSxNQUFJLE9BQU87QUFBQSxNQUFRLFNBQVM7QUFBQSxNQUN4QyxjQUFjO0FBQUEsTUFBUSxVQUFVO0FBQUEsTUFBUSxZQUFZO0FBQUEsTUFDcEQsUUFBUTtBQUFBLE1BQVMsV0FBVztBQUFBLE1BQzVCLFVBQVU7QUFBQSxNQUFRLFdBQVc7QUFBQSxNQUM3QixZQUFZO0FBQUEsTUFBZSxTQUFTO0FBQUEsTUFDcEMsWUFBWTtBQUFBLElBQ2QsQ0FBaUM7QUFDakMsYUFBUyxLQUFLLFlBQVksQ0FBQztBQUMzQixlQUFXLE1BQU07QUFDZixRQUFFLE1BQU0sVUFBVTtBQUNsQixpQkFBVyxNQUFNLEVBQUUsT0FBTyxHQUFHLEdBQUc7QUFBQSxJQUNsQyxHQUFHLElBQUk7QUFBQSxFQUNUOzs7QUN4Qk8sV0FBUyxRQUFRLEdBQW9CO0FBQzFDLFdBQU8sT0FBTyxDQUFDLEVBQ1osUUFBUSxNQUFNLE9BQU8sRUFDckIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLFFBQVEsRUFDdEIsUUFBUSxNQUFNLE9BQU87QUFBQSxFQUMxQjs7O0FDUE8sV0FBUyxjQUFjLE9BQXVCO0FBQ25ELFdBQU8sUUFBUSxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsS0FBSyxHQUFHO0FBQUEsRUFDbEQ7QUFFTyxXQUFTLGlCQUF5QjtBQUN2QyxVQUFNLE1BQU0sb0JBQUksS0FBSztBQUNyQixVQUFNLGNBQWMsSUFBSSxLQUFLLElBQUksWUFBWSxHQUFHLEdBQUcsQ0FBQztBQUNwRCxVQUFNLFlBQVksS0FBSyxPQUFPLElBQUksUUFBUSxJQUFJLFlBQVksUUFBUSxLQUFLLEtBQVE7QUFDL0UsVUFBTSxVQUFVLEtBQUssTUFBTSxZQUFZLFlBQVksT0FBTyxJQUFJLEtBQUssQ0FBQztBQUNwRSxXQUFPLEdBQUcsSUFBSSxZQUFZLENBQUMsS0FBSyxPQUFPLE9BQU8sRUFBRSxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBQUEsRUFDbEU7QUFFTyxXQUFTLHVCQUF1QixPQUF1QjtBQUM1RCxVQUFNLElBQUksTUFBTSxRQUFRLE9BQU8sRUFBRSxFQUFFLE1BQU0sR0FBRyxFQUFFO0FBQzlDLFFBQUksRUFBRSxVQUFVLEVBQUcsUUFBTztBQUMxQixRQUFJLEVBQUUsVUFBVSxFQUFHLFFBQU8sSUFBSSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzFELFFBQUksRUFBRSxVQUFVLEdBQUksUUFBTyxJQUFJLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDNUUsV0FBTyxJQUFJLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUFBLEVBQzlEOzs7QUNsQk8sTUFBTSxXQUFOLE1BQU0sa0JBQWlCLE1BQU07QUFBQSxJQUNsQyxZQUNFLFNBQ2dCLE1BQ0EsYUFBcUIsS0FDckIsU0FDaEI7QUFDQSxZQUFNLE9BQU87QUFKRztBQUNBO0FBQ0E7QUFHaEIsV0FBSyxPQUFPO0FBQ1osYUFBTyxlQUFlLE1BQU0sVUFBUyxTQUFTO0FBQUEsSUFDaEQ7QUFBQSxFQUNGO0FBRU8sTUFBTSxrQkFBTixjQUE4QixTQUFTO0FBQUEsSUFDNUMsWUFBWSxTQUFpQixTQUFtQztBQUM5RCxZQUFNLFNBQVMsb0JBQW9CLEtBQUssT0FBTztBQUMvQyxXQUFLLE9BQU87QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUVPLE1BQU0sZUFBTixjQUEyQixTQUFTO0FBQUEsSUFDekMsWUFBWSxTQUFpQixTQUFtQztBQUM5RCxZQUFNLFNBQVMsaUJBQWlCLEtBQUssT0FBTztBQUM1QyxXQUFLLE9BQU87QUFBQSxJQUNkO0FBQUEsRUFDRjtBQWdCTyxNQUFNLGlCQUFOLGNBQTZCLFNBQVM7QUFBQSxJQUMzQyxZQUFZLGNBQXNCO0FBQ2hDLFlBQU0sOEJBQThCLEtBQUssS0FBSyxlQUFlLEdBQUksQ0FBQyxNQUFNLGNBQWMsS0FBSyxFQUFFLGFBQWEsQ0FBQztBQUMzRyxXQUFLLE9BQU87QUFBQSxJQUNkO0FBQUEsRUFDRjs7O0FDckNPLE1BQU0sVUFBTixNQUFNLFNBQVE7QUFBQSxJQU1YLFlBQVksT0FBcUI7QUFDdkMsV0FBSyxLQUFLLE1BQU07QUFDaEIsV0FBSyxPQUFPLE1BQU07QUFDbEIsV0FBSyxXQUFXLE1BQU07QUFDdEIsV0FBSyxXQUFXLE1BQU07QUFBQSxJQUN4QjtBQUFBLElBRUEsT0FBTyxPQUFPLE9BQThCO0FBQzFDLFlBQU0sTUFBTSxNQUFNLFNBQVMsUUFBUSxPQUFPLEVBQUU7QUFDNUMsVUFBSSxJQUFJLFNBQVMsTUFBTSxJQUFJLFNBQVMsSUFBSTtBQUN0QyxjQUFNLElBQUksZ0JBQWdCLHdCQUFxQixFQUFFLFVBQVUsTUFBTSxTQUFTLENBQUM7QUFBQSxNQUM3RTtBQUNBLFVBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxHQUFHO0FBQ3RCLGNBQU0sSUFBSSxnQkFBZ0IsNEJBQXlCO0FBQUEsTUFDckQ7QUFDQSxhQUFPLElBQUksU0FBUSxpQ0FDZCxRQURjO0FBQUEsUUFFakIsVUFBVTtBQUFBLFFBQ1YsTUFBTSxTQUFRLGVBQWUsTUFBTSxJQUFJO0FBQUEsTUFDekMsRUFBQztBQUFBLElBQ0g7QUFBQSxJQUVBLE9BQU8sT0FBTyxLQUE0QjtBQUN4QyxhQUFPLElBQUksU0FBUSxHQUFHO0FBQUEsSUFDeEI7QUFBQSxJQUVBLE9BQWUsZUFBZSxNQUFzQjtBQUNsRCxhQUFPLEtBQUssWUFBWSxFQUFFLE1BQU0sR0FBRyxFQUNoQyxJQUFJLE9BQUssRUFBRSxPQUFPLENBQUMsRUFBRSxZQUFZLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUMvQyxLQUFLLEdBQUcsRUFBRSxLQUFLO0FBQUEsSUFDcEI7QUFBQSxJQUVBLGFBQWEsVUFBMkI7QUFDdEMsYUFBTyxTQUFRLE9BQU8saUNBQUssS0FBSyxPQUFPLElBQWpCLEVBQW9CLFNBQVMsRUFBQztBQUFBLElBQ3REO0FBQUEsSUFFQSxTQUF1QjtBQUNyQixhQUFPLEVBQUUsSUFBSSxLQUFLLElBQUksTUFBTSxLQUFLLE1BQU0sVUFBVSxLQUFLLFVBQVUsVUFBVSxLQUFLLFNBQVM7QUFBQSxJQUMxRjtBQUFBLEVBQ0Y7OztBQ2xETyxNQUFNLEtBQUssQ0FBSSxXQUFnQyxFQUFFLElBQUksTUFBTSxNQUFNO0FBQ2pFLE1BQU0sT0FBTyxDQUFrQixXQUFnQyxFQUFFLElBQUksT0FBTyxNQUFNO0FBWXpGLGlCQUFzQixTQUFZLElBQTBDO0FBQzFFLFFBQUk7QUFDRixhQUFPLEdBQUcsTUFBTSxHQUFHLENBQUM7QUFBQSxJQUN0QixTQUFTLEdBQUc7QUFDVixhQUFPLEtBQUssYUFBYSxRQUFRLElBQUksSUFBSSxNQUFNLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFBQSxJQUMzRDtBQUFBLEVBQ0Y7OztBQ3JCQSxNQUFNLGVBQWUsS0FBSywwREFBMEQ7QUFDcEYsTUFBTSxnQkFBZ0IsS0FBSywwUkFBMFI7QUFDclQsTUFBTSxhQUFhO0FBTW5CLGlCQUFzQixjQUNwQixNQUNBLE9BQTZCLENBQUMsR0FDWDtBQWJyQjtBQWNFLFVBQStDLFdBQXZDLFlBQVUsV0FkcEIsSUFjaUQsSUFBZCxzQkFBYyxJQUFkLENBQXpCO0FBQ1IsVUFBTSxhQUFhLElBQUksZ0JBQWdCO0FBQ3ZDLFVBQU0sUUFBUSxXQUFXLE1BQU0sV0FBVyxNQUFNLEdBQUcsT0FBTztBQUUxRCxRQUFJO0FBQ0YsWUFBTSxVQUFrQztBQUFBLFFBQ3RDLFVBQVU7QUFBQSxRQUNWLGlCQUFpQixVQUFVLGFBQWE7QUFBQSxRQUN4QyxnQkFBZ0I7QUFBQSxRQUNoQixVQUFVO0FBQUEsVUFDTCxlQUFVLFlBQVYsWUFBZ0QsQ0FBQztBQUd4RCxhQUFPLE1BQU0sTUFBTSxHQUFHLFlBQVksR0FBRyxJQUFJLElBQUksaUNBQ3hDLFlBRHdDO0FBQUEsUUFFM0M7QUFBQSxRQUNBLFFBQVEsV0FBVztBQUFBLE1BQ3JCLEVBQUM7QUFBQSxJQUNILFNBQVMsR0FBRztBQUNWLFVBQUksYUFBYSxTQUFTLEVBQUUsU0FBUyxjQUFjO0FBQ2pELGNBQU0sSUFBSSxhQUFhLHNDQUFtQyxFQUFFLEtBQUssQ0FBQztBQUFBLE1BQ3BFO0FBQ0EsWUFBTSxJQUFJLGFBQWEsZ0JBQWdCLEVBQUUsTUFBTSxPQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUM7QUFBQSxJQUNuRSxVQUFFO0FBQ0EsbUJBQWEsS0FBSztBQUFBLElBQ3BCO0FBQUEsRUFDRjtBQUVBLGlCQUFzQixZQUNwQixPQUNBLFFBQVEsSUFDTTtBQUNkLFVBQU0sT0FBTyxNQUFNLGNBQWMsWUFBWSxLQUFLLEdBQUcsUUFBUSxNQUFNLFFBQVEsRUFBRSxFQUFFO0FBQy9FLFFBQUksQ0FBQyxLQUFLLElBQUk7QUFDWixZQUFNLE9BQU8sTUFBTSxLQUFLLEtBQUssRUFBRSxNQUFNLE1BQU0sRUFBRTtBQUM3QyxZQUFNLElBQUksYUFBYSxPQUFPLEtBQUssWUFBWSxLQUFLLE1BQU0sS0FBSyxFQUFFLFFBQVEsS0FBSyxRQUFRLEtBQUssQ0FBQztBQUFBLElBQzlGO0FBQ0EsV0FBTyxLQUFLLEtBQUs7QUFBQSxFQUNuQjtBQUVBLGlCQUFzQixhQUNwQixPQUNBLE1BQ1k7QUFDWixVQUFNLE9BQU8sTUFBTSxjQUFjLFlBQVksS0FBSyxJQUFJO0FBQUEsTUFDcEQsUUFBUTtBQUFBLE1BQ1IsTUFBTSxLQUFLLFVBQVUsSUFBSTtBQUFBLElBQzNCLENBQUM7QUFDRCxRQUFJLENBQUMsS0FBSyxJQUFJO0FBQ1osWUFBTSxPQUFPLE1BQU0sS0FBSyxLQUFLO0FBQzdCLFlBQU0sSUFBSSxhQUFhLFFBQVEsS0FBSyxXQUFXLEVBQUUsUUFBUSxLQUFLLFFBQVEsS0FBSyxDQUFDO0FBQUEsSUFDOUU7QUFDQSxVQUFNLE9BQU8sTUFBTSxLQUFLLEtBQUs7QUFDN0IsV0FBTyxLQUFLLENBQUM7QUFBQSxFQUNmO0FBRUEsaUJBQXNCLGNBQ3BCLE9BQ0EsT0FDQSxNQUNjO0FBQ2QsVUFBTSxPQUFPLE1BQU0sY0FBYyxZQUFZLEtBQUssSUFBSSxLQUFLLElBQUk7QUFBQSxNQUM3RCxRQUFRO0FBQUEsTUFDUixNQUFNLEtBQUssVUFBVSxJQUFJO0FBQUEsSUFDM0IsQ0FBQztBQUNELFFBQUksQ0FBQyxLQUFLLElBQUk7QUFDWixZQUFNLE9BQU8sTUFBTSxLQUFLLEtBQUs7QUFDN0IsWUFBTSxJQUFJLGFBQWEsU0FBUyxLQUFLLFdBQVcsRUFBRSxRQUFRLEtBQUssUUFBUSxLQUFLLENBQUM7QUFBQSxJQUMvRTtBQUNBLFdBQU8sS0FBSyxLQUFLO0FBQUEsRUFDbkI7OztBQzNFQSxNQUFNLFNBQU4sTUFBTSxRQUFPO0FBQUEsSUFHWCxZQUFZLFNBQVMsWUFBWTtBQUMvQixXQUFLLFNBQVM7QUFBQSxJQUNoQjtBQUFBLElBRVEsSUFBSSxPQUFpQixTQUFpQixTQUF5QztBQUNyRixZQUFNLFFBQWtCO0FBQUEsUUFDdEI7QUFBQSxRQUNBO0FBQUEsUUFDQSxZQUFXLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQUEsUUFDbEM7QUFBQSxNQUNGO0FBRUEsWUFBTSxRQUFRO0FBQUEsUUFDWixPQUFPO0FBQUEsUUFDUCxNQUFPO0FBQUEsUUFDUCxNQUFPO0FBQUEsUUFDUCxPQUFPO0FBQUEsTUFDVCxFQUFFLEtBQUs7QUFFUCxZQUFNLFlBQVksSUFBSSxLQUFLLE1BQU0sS0FBSyxNQUFNLFNBQVMsSUFBSSxPQUFPO0FBRWhFLFVBQUksVUFBVSxTQUFTO0FBQ3JCLGdCQUFRLE1BQU0sS0FBSyxTQUFTLElBQUksT0FBTyw0QkFBVyxFQUFFO0FBQUEsTUFDdEQsV0FBVyxVQUFVLFFBQVE7QUFDM0IsZ0JBQVEsS0FBSyxLQUFLLFNBQVMsSUFBSSxPQUFPLDRCQUFXLEVBQUU7QUFBQSxNQUNyRCxPQUFPO0FBQ0wsZ0JBQVEsSUFBSSxLQUFLLFNBQVMsSUFBSSxPQUFPLDRCQUFXLEVBQUU7QUFBQSxNQUNwRDtBQUFBLElBQ0Y7QUFBQSxJQUVBLE1BQU0sS0FBYSxLQUFxQztBQUFFLFdBQUssSUFBSSxTQUFTLEtBQUssR0FBRztBQUFBLElBQUc7QUFBQSxJQUN2RixLQUFLLEtBQWEsS0FBc0M7QUFBRSxXQUFLLElBQUksUUFBUyxLQUFLLEdBQUc7QUFBQSxJQUFHO0FBQUEsSUFDdkYsS0FBSyxLQUFhLEtBQXNDO0FBQUUsV0FBSyxJQUFJLFFBQVMsS0FBSyxHQUFHO0FBQUEsSUFBRztBQUFBLElBQ3ZGLE1BQU0sS0FBYSxLQUFxQztBQUFFLFdBQUssSUFBSSxTQUFTLEtBQUssR0FBRztBQUFBLElBQUc7QUFBQSxJQUV2RixNQUFNLFFBQXdCO0FBQUUsYUFBTyxJQUFJLFFBQU8sR0FBRyxLQUFLLE1BQU0sSUFBSSxNQUFNLEVBQUU7QUFBQSxJQUFHO0FBQUEsRUFDakY7QUFFTyxNQUFNLFNBQVMsSUFBSSxPQUFPOzs7QUM1Q2pDLE1BQU0sTUFBTSxPQUFPLE1BQU0sYUFBYTtBQUUvQixNQUFNLG9CQUFOLE1BQXNEO0FBQUEsSUFDM0QsTUFBTSxlQUFlLFVBQW1EO0FBQ3RFLGFBQU8sU0FBUyxZQUFZO0FBQzFCLFlBQUksTUFBTSxrQkFBa0IsRUFBRSxVQUFVLE1BQU0sU0FBUyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUM7QUFDcEUsY0FBTSxPQUFPLE1BQU07QUFBQSxVQUNqQjtBQUFBLFVBQ0EsZUFBZSxRQUFRO0FBQUEsUUFDekI7QUFDQSxlQUFPLEtBQUssQ0FBQyxJQUFJLFFBQVEsT0FBTyxLQUFLLENBQUMsQ0FBQyxJQUFJO0FBQUEsTUFDN0MsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUVBLE1BQU0sS0FBSyxTQUE0QztBQUNyRCxhQUFPLFNBQVMsWUFBWTtBQUMxQixjQUFNLE1BQU0sTUFBTTtBQUFBLFVBQ2hCO0FBQUEsVUFDQSxRQUFRLE9BQU87QUFBQSxRQUNqQjtBQUNBLGVBQU8sUUFBUSxPQUFPLEdBQUc7QUFBQSxNQUMzQixDQUFDO0FBQUEsSUFDSDtBQUFBLElBRUEsTUFBTSxlQUFlLElBQVksVUFBeUM7QUFDeEUsYUFBTyxTQUFTLFlBQVk7QUFDMUIsY0FBTSxjQUFjLFlBQVksU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUM7QUFBQSxNQUM3RCxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7OztBQ1RPLE1BQU0sU0FBTixNQUFNLFFBQU87QUFBQSxJQUNWLFlBQTZCLE9BQW9CO0FBQXBCO0FBQUEsSUFBcUI7QUFBQSxJQUUxRCxPQUFPLE9BQU8sT0FBc0Q7QUFDbEUsVUFBSSxDQUFDLE1BQU0sTUFBTSxPQUFRLE9BQU0sSUFBSSxnQkFBZ0IsaUNBQWlDO0FBQ3BGLFVBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFHLE9BQU0sSUFBSSxnQkFBZ0IscUJBQWtCO0FBQ3BFLFVBQUksQ0FBQyxNQUFNLFNBQVMsS0FBSyxFQUFHLE9BQU0sSUFBSSxnQkFBZ0IsNEJBQXNCO0FBQzVFLFlBQU0sUUFBUSxNQUFNLE1BQU0sT0FBTyxDQUFDLEdBQUcsTUFBTSxLQUFLLE9BQU8sSUFBSSxFQUFFLFNBQVMsR0FBRyxJQUFJLEtBQUssQ0FBQztBQUNuRixhQUFPLElBQUksUUFBTyxpQ0FBSyxRQUFMLEVBQVksT0FBTyxRQUFRLFdBQVcsRUFBQztBQUFBLElBQzNEO0FBQUEsSUFFQSxPQUFPLE9BQU8sS0FBMEI7QUFBRSxhQUFPLElBQUksUUFBTyxHQUFHO0FBQUEsSUFBRztBQUFBLElBRWxFLElBQUksS0FBeUI7QUFBRSxhQUFPLEtBQUssTUFBTTtBQUFBLElBQUk7QUFBQSxJQUNyRCxJQUFJLFFBQWdCO0FBQUUsYUFBTyxLQUFLLE1BQU07QUFBQSxJQUFPO0FBQUEsSUFDL0MsSUFBSSxRQUErQjtBQUFFLGFBQU8sS0FBSyxNQUFNO0FBQUEsSUFBTztBQUFBLElBQzlELElBQUksWUFBMkI7QUFBRSxhQUFPLEtBQUssTUFBTTtBQUFBLElBQVc7QUFBQSxJQUM5RCxJQUFJLGtCQUErQztBQUFFLGFBQU8sS0FBSyxNQUFNO0FBQUEsSUFBa0I7QUFBQSxJQUV6RixtQkFBbUIsVUFBMEI7QUFDM0MsWUFBTSxXQUFXLEtBQUssTUFBTSxNQUFNO0FBQUEsUUFBSSxPQUNwQyxVQUFLLEVBQUUsSUFBSSxjQUFTLEVBQUUsTUFBTSxRQUFRLENBQUMsRUFBRSxRQUFRLEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDMUQsRUFBRSxLQUFLLElBQUk7QUFDWCxZQUFNLE1BQU07QUFBQSxRQUNWO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQSxjQUFjLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsS0FBSyxHQUFHLENBQUM7QUFBQSxRQUMzRCxlQUFlLEtBQUssTUFBTSxTQUFTO0FBQUEsUUFDbkM7QUFBQSxRQUNBLGFBQU0sS0FBSyxNQUFNLElBQUk7QUFBQSxRQUNyQixhQUFNLEtBQUssTUFBTSxRQUFRO0FBQUEsUUFDekIsS0FBSyxNQUFNLGFBQWEsYUFBTSxLQUFLLE1BQU0sVUFBVSxLQUFLO0FBQUEsTUFDMUQsRUFBRSxPQUFPLE9BQU8sRUFBRSxLQUFLLElBQUk7QUFDM0IsYUFBTyxpQkFBaUIsUUFBUSxTQUFTLG1CQUFtQixHQUFHLENBQUM7QUFBQSxJQUNsRTtBQUFBLElBRUEsU0FBc0I7QUFBRSxhQUFPLG1CQUFLLEtBQUs7QUFBQSxJQUFTO0FBQUEsRUFDcEQ7OztBQ3hEQSxNQUFNQSxPQUFNLE9BQU8sTUFBTSxZQUFZO0FBRTlCLE1BQU0sbUJBQU4sTUFBb0Q7QUFBQSxJQUN6RCxNQUFNLEtBQUssUUFBeUM7QUFDbEQsYUFBTyxTQUFTLFlBQVk7QUFiaEM7QUFjTSxRQUFBQSxLQUFJLEtBQUssbUJBQW1CLEVBQUUsT0FBTyxPQUFPLE1BQU0sQ0FBQztBQUVuRCxjQUFNLE9BQU8sTUFBTSxjQUFjLG9CQUFvQjtBQUFBLFVBQ25ELFFBQVE7QUFBQSxVQUNSLFNBQVMsRUFBRSxVQUFVLHNCQUFzQjtBQUFBLFVBQzNDLE1BQU0sS0FBSyxVQUFVLE9BQU8sT0FBTyxDQUFDO0FBQUEsUUFDdEMsQ0FBQztBQUNELFlBQUksQ0FBQyxLQUFLLElBQUk7QUFDWixnQkFBTSxPQUFPLE1BQU0sS0FBSyxLQUFLO0FBQzdCLGdCQUFNLElBQUksYUFBYSx1QkFBdUIsRUFBRSxRQUFRLEtBQUssUUFBUSxLQUFLLENBQUM7QUFBQSxRQUM3RTtBQUNBLGNBQU0sT0FBTSxVQUFLLFFBQVEsSUFBSSxVQUFVLE1BQTNCLFlBQWdDO0FBQzVDLGNBQU0sVUFBVSxJQUFJLE1BQU0sY0FBYztBQUN4QyxZQUFJLENBQUMsUUFBUyxPQUFNLElBQUksYUFBYSwrQkFBNEI7QUFDakUsY0FBTSxLQUFLLFNBQVMsUUFBUSxDQUFDLEdBQUksRUFBRTtBQUNuQyxlQUFPLE9BQU8sT0FBTyxpQ0FBSyxPQUFPLE9BQU8sSUFBbkIsRUFBc0IsR0FBRyxFQUFnQjtBQUFBLE1BQ2hFLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFFQSxNQUFNLGFBQWEsSUFBWSxXQUFtQixRQUF1QztBQUN2RixhQUFPLFNBQVMsWUFBWTtBQUMxQixjQUFNO0FBQUEsVUFDSjtBQUFBLFVBQ0EsU0FBUyxFQUFFLGtCQUFrQixTQUFTO0FBQUEsVUFDdEMsRUFBRSxPQUFPO0FBQUEsUUFDWDtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUVBLE1BQU0sU0FBUyxJQUE0QztBQUN6RCxhQUFPLFNBQVMsWUFBWTtBQUMxQixjQUFNLE9BQU8sTUFBTTtBQUFBLFVBQ2pCLEdBQUcsWUFBWSwwQkFBMEIsRUFBRTtBQUFBLFVBQzNDLEVBQUUsU0FBUyxFQUFFLFVBQVUsZUFBZSxpQkFBaUIsVUFBVSxhQUFhLEdBQUcsRUFBRTtBQUFBLFFBQ3JGO0FBQ0EsWUFBSSxDQUFDLEtBQUssR0FBSSxPQUFNLElBQUksYUFBYSxxQkFBcUIsRUFBRSxRQUFRLEtBQUssT0FBTyxDQUFDO0FBQ2pGLGNBQU0sT0FBTyxNQUFNLEtBQUssS0FBSztBQUM3QixlQUFPLEtBQUssQ0FBQyxJQUFJLE9BQU8sT0FBTyxLQUFLLENBQUMsQ0FBQyxJQUFJO0FBQUEsTUFDNUMsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGOzs7QUNoREEsTUFBTUMsT0FBTSxPQUFPLE1BQU0sWUFBWTtBQUU5QixNQUFNLG1CQUFOLE1BQW9EO0FBQUEsSUFDekQsTUFBTSxzQkFDSixVQUNBLFFBQzJDO0FBQzNDLGFBQU8sU0FBUyxZQUFZO0FBYmhDO0FBY00sUUFBQUEsS0FBSSxNQUFNLHlCQUF5QixFQUFFLE9BQU8sQ0FBQztBQUM3QyxjQUFNLE9BQU8sTUFBTTtBQUFBLFVBQ2pCO0FBQUEsVUFDQSxlQUFlLFFBQVEsY0FBYyxNQUFNO0FBQUEsUUFDN0M7QUFDQSxnQkFBTyxVQUFLLENBQUMsTUFBTixZQUFXO0FBQUEsTUFDcEIsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUVBLE1BQU0saUJBQ0osTUFDb0M7QUFFcEMsVUFBSSxLQUFLLE9BQU8sUUFBVztBQUN6QixlQUFPLFNBQVMsWUFBWTtBQTVCbEM7QUE2QlEsZ0JBQXlCLFdBQWpCLEtBN0JoQixJQTZCaUMsSUFBVixrQkFBVSxJQUFWLENBQVA7QUFDUixnQkFBTSxPQUFPLE1BQU07QUFBQSxZQUNqQjtBQUFBLFlBQ0EsU0FBUyxFQUFFO0FBQUEsWUFDWDtBQUFBLFVBQ0Y7QUFDQSxrQkFBUSxVQUFLLENBQUMsTUFBTixZQUFXLG1CQUFLO0FBQUEsUUFDMUIsQ0FBQztBQUFBLE1BQ0g7QUFDQSxhQUFPO0FBQUEsUUFBUyxNQUNkLGFBQWdDLHdCQUF3QixJQUFJO0FBQUEsTUFDOUQ7QUFBQSxJQUNGO0FBQUEsSUFFQSxNQUFNLHNCQUFzQixRQUF5QztBQUNuRSxhQUFPLFNBQVMsWUFBWTtBQUMxQixjQUFNLE9BQU8sTUFBTTtBQUFBLFVBQ2pCO0FBQUEsVUFDQSxhQUFhLE1BQU07QUFBQSxRQUNyQjtBQUNBLGVBQU8sS0FBSztBQUFBLE1BQ2QsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUVBLE1BQU0sYUFDSixVQUNBLE1BQ0EsUUFDQSxRQUN1QjtBQUN2QixhQUFPLFNBQVMsWUFBWTtBQUMxQixjQUFNLGFBQWEscUJBQXFCLEVBQUUsVUFBVSxNQUFNLFFBQVEsT0FBTyxDQUFDO0FBQUEsTUFDNUUsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGOzs7QUNuREEsTUFBTSxnQkFBTixNQUFvQjtBQUFBLElBQXBCO0FBQ0UsV0FBUSxXQUFXLG9CQUFJLElBQW1DO0FBQUE7QUFBQSxJQUUxRCxHQUNFLE9BQ0EsU0FDWTtBQUNaLFVBQUksQ0FBQyxLQUFLLFNBQVMsSUFBSSxLQUFLLEVBQUcsTUFBSyxTQUFTLElBQUksT0FBTyxvQkFBSSxJQUFJLENBQUM7QUFDakUsV0FBSyxTQUFTLElBQUksS0FBSyxFQUFHLElBQUksT0FBMkI7QUFDekQsYUFBTyxNQUFHO0FBckJkO0FBcUJpQiwwQkFBSyxTQUFTLElBQUksS0FBSyxNQUF2QixtQkFBMEIsT0FBTztBQUFBO0FBQUEsSUFDaEQ7QUFBQSxJQUVBLEtBQStCLE9BQVUsU0FBNEI7QUF4QnZFO0FBeUJJLGlCQUFLLFNBQVMsSUFBSSxLQUFLLE1BQXZCLG1CQUEwQixRQUFRLE9BQUs7QUFDckMsWUFBSTtBQUFFLFlBQUUsT0FBTztBQUFBLFFBQUcsU0FBUyxHQUFHO0FBQUUsa0JBQVEsTUFBTSxxQkFBcUIsS0FBSyxLQUFLLENBQUM7QUFBQSxRQUFHO0FBQUEsTUFDbkY7QUFBQSxJQUNGO0FBQUEsSUFFQSxLQUNFLE9BQ0EsU0FDTTtBQUNOLFlBQU0sUUFBUSxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVk7QUFBRSxnQkFBUSxPQUFPO0FBQUcsY0FBTTtBQUFBLE1BQUcsQ0FBQztBQUFBLElBQzFFO0FBQUEsRUFDRjtBQUVPLE1BQU0sV0FBVyxJQUFJLGNBQWM7OztBQ25DbkMsTUFBTSxRQUFOLE1BQThCO0FBQUEsSUFJbkMsWUFBWSxjQUFpQjtBQUY3QixXQUFRLGtCQUFrQixvQkFBSSxJQUFpQjtBQUc3QyxXQUFLLFFBQVEsbUJBQUs7QUFBQSxJQUNwQjtBQUFBLElBRUEsV0FBd0I7QUFDdEIsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBLElBRUEsU0FBUyxTQUE4RDtBQUNyRSxZQUFNLFFBQVEsT0FBTyxZQUFZLGFBQzdCLFFBQVEsS0FBSyxLQUFLLElBQ2xCO0FBQ0osV0FBSyxRQUFRLGtDQUFLLEtBQUssUUFBVTtBQUNqQyxXQUFLLGdCQUFnQixRQUFRLE9BQUssRUFBRSxLQUFLLEtBQUssQ0FBQztBQUFBLElBQ2pEO0FBQUEsSUFFQSxVQUFVLFVBQW1DO0FBQzNDLFdBQUssZ0JBQWdCLElBQUksUUFBUTtBQUNqQyxhQUFPLE1BQU0sS0FBSyxnQkFBZ0IsT0FBTyxRQUFRO0FBQUEsSUFDbkQ7QUFBQSxJQUVBLE9BQVUsVUFBMEIsVUFBbUM7QUFDckUsVUFBSSxPQUFPLFNBQVMsS0FBSyxLQUFLO0FBQzlCLGFBQU8sS0FBSyxVQUFVLFdBQVM7QUFDN0IsY0FBTSxPQUFPLFNBQVMsS0FBSztBQUMzQixZQUFJLFNBQVMsTUFBTTtBQUNqQixpQkFBTztBQUNQLG1CQUFTLElBQUk7QUFBQSxRQUNmO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7OztBQ2hCQSxNQUFNLFlBQVksS0FBSyxrQkFBa0I7QUFDekMsTUFBTSxjQUFjLEtBQUssa0JBQWtCO0FBRTNDLFdBQVMsWUFBWSxTQUFrQztBQUNyRCxXQUFPLENBQUMsQ0FBQyxXQUFXLFFBQVEsYUFBYTtBQUFBLEVBQzNDO0FBRU8sV0FBUyxhQUFhLFNBQWtDO0FBQzdELFdBQU8sQ0FBQyxDQUFDLFdBQVcsUUFBUSxhQUFhO0FBQUEsRUFDM0M7QUFFTyxNQUFNLFdBQVcsSUFBSSxNQUFnQjtBQUFBLElBQzFDLFNBQVM7QUFBQSxJQUNULFlBQVk7QUFBQSxJQUNaLFNBQVM7QUFBQSxJQUNULGVBQWU7QUFBQSxJQUNmLGVBQWU7QUFBQSxJQUNmLHNCQUFzQjtBQUFBLElBQ3RCLGtCQUFrQjtBQUFBLElBQ2xCLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxFQUNmLENBQUM7QUFFTSxXQUFTLFdBQVcsU0FBK0I7QUFDeEQsYUFBUyxTQUFTO0FBQUEsTUFDaEI7QUFBQSxNQUNBLFlBQVksQ0FBQyxDQUFDO0FBQUEsTUFDZCxTQUFTLFlBQVksT0FBTztBQUFBLElBQzlCLENBQUM7QUFBQSxFQUNIO0FBRU8sV0FBUyxZQUFZLE9BQWUsT0FBcUI7QUFDOUQsYUFBUyxTQUFTLEVBQUUsZUFBZSxPQUFPLGVBQWUsTUFBTSxDQUFDO0FBQUEsRUFDbEU7OztBQy9DQSxNQUFNQyxPQUFNLE9BQU8sTUFBTSxjQUFjO0FBRXZDLE1BQU0sY0FBYztBQUNwQixNQUFNLGlCQUFpQjtBQUN2QixNQUFNLGlCQUFpQixLQUFLLEtBQUssS0FBSztBQU8vQixNQUFNLGVBQU4sTUFBbUI7QUFBQSxJQUd4QixZQUE2QixhQUFpQztBQUFqQztBQUY3QixXQUFRLGNBQTJCLEVBQUUsVUFBVSxHQUFHLGNBQWMsRUFBRTtBQUFBLElBRUg7QUFBQSxJQUUvRCxpQkFBaUM7QUF4Qm5DO0FBeUJJLFVBQUk7QUFDRixjQUFNLEtBQUssUUFBTyxvQkFBZSxRQUFRLGNBQWMsTUFBckMsWUFBMEMsR0FBRztBQUMvRCxZQUFJLEtBQUssSUFBSSxJQUFJLEtBQUssZ0JBQWdCO0FBQ3BDLGVBQUssYUFBYTtBQUNsQixpQkFBTztBQUFBLFFBQ1Q7QUFDQSxjQUFNLE1BQU0sZUFBZSxRQUFRLFdBQVc7QUFDOUMsWUFBSSxDQUFDLElBQUssUUFBTztBQUNqQixjQUFNLE9BQU8sS0FBSyxNQUFNLEdBQUc7QUFDM0IsY0FBTSxVQUFVLFFBQVEsT0FBTyxJQUFJO0FBQ25DLG1CQUFXLE9BQU87QUFDbEIsZUFBTztBQUFBLE1BQ1QsU0FBUTtBQUNOLGFBQUssYUFBYTtBQUNsQixlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0Y7QUFBQSxJQUVBLE1BQU0sUUFBUSxVQUEyRTtBQTNDM0Y7QUE0Q0ksVUFBSSxLQUFLLElBQUksSUFBSSxLQUFLLFlBQVksY0FBYztBQUM5QyxlQUFPLEtBQUssSUFBSSxlQUFlLEtBQUssWUFBWSxlQUFlLEtBQUssSUFBSSxDQUFDLENBQUM7QUFBQSxNQUM1RTtBQUVBLFlBQU0sTUFBTSxTQUFTLFFBQVEsT0FBTyxFQUFFO0FBQ3RDLFVBQUksSUFBSSxTQUFTLEdBQUksUUFBTyxLQUFLLElBQUksZ0JBQWdCLHNCQUFtQixDQUFDO0FBRXpFLE1BQUFBLEtBQUksS0FBSyx3QkFBd0IsRUFBRSxLQUFLLE1BQU0sSUFBSSxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUM7QUFDL0QsWUFBTSxTQUFTLE1BQU0sS0FBSyxZQUFZLGVBQWUsR0FBRztBQUV4RCxVQUFJLENBQUMsT0FBTyxJQUFJO0FBRWQsWUFBSSxPQUFPLE1BQU0sU0FBUyxnQkFBZ0I7QUFDeEMsZUFBSyxZQUFZO0FBQ2pCLGNBQUksS0FBSyxZQUFZLFlBQVksR0FBRztBQUNsQyxpQkFBSyxZQUFZLGVBQWUsS0FBSyxJQUFJLElBQUk7QUFDN0MsaUJBQUssWUFBWSxXQUFXO0FBQzVCLG1CQUFPLEtBQUssSUFBSSxlQUFlLEdBQU0sQ0FBQztBQUFBLFVBQ3hDO0FBQUEsUUFDRjtBQUNBLGVBQU8sS0FBSyxPQUFPLEtBQUs7QUFBQSxNQUMxQjtBQUVBLFdBQUssWUFBWSxXQUFXO0FBQzVCLGFBQU8sR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDLE9BQU8sT0FBTyxVQUFTLFlBQU8sVUFBUCxZQUFnQixPQUFVLENBQUM7QUFBQSxJQUMxRTtBQUFBLElBRUEsTUFBTSxTQUFTLE1BQWMsVUFBa0IsVUFBNEM7QUFDekYsYUFBTyxTQUFTLFlBQVk7QUFDMUIsY0FBTSxTQUFTLFFBQVEsT0FBTyxFQUFFLE1BQU0sVUFBVSxTQUFTLENBQUM7QUFDMUQsY0FBTSxRQUFRLE1BQU0sS0FBSyxZQUFZLEtBQUssTUFBTTtBQUNoRCxZQUFJLENBQUMsTUFBTSxHQUFJLE9BQU0sTUFBTTtBQUMzQixlQUFPLE1BQU07QUFBQSxNQUNmLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFFQSxNQUFNLFNBQXdCO0FBQzVCLHFCQUFlLFFBQVEsYUFBYSxLQUFLLFVBQVUsUUFBUSxPQUFPLENBQUMsQ0FBQztBQUNwRSxxQkFBZSxRQUFRLGdCQUFnQixPQUFPLEtBQUssSUFBSSxDQUFDLENBQUM7QUFDekQsaUJBQVcsT0FBTztBQUNsQixlQUFTLEtBQUssY0FBYyxFQUFFLFFBQVEsQ0FBQztBQUN2QyxNQUFBQSxLQUFJLEtBQUssbUJBQW1CLEVBQUUsSUFBSSxRQUFRLEdBQUcsQ0FBQztBQUFBLElBQ2hEO0FBQUEsSUFFQSxTQUFlO0FBQ2IsV0FBSyxhQUFhO0FBQ2xCLGlCQUFXLElBQUk7QUFDZixlQUFTLEtBQUssZUFBZSxNQUE0QjtBQUN6RCxNQUFBQSxLQUFJLEtBQUssa0JBQWtCO0FBQUEsSUFDN0I7QUFBQSxJQUVRLGVBQXFCO0FBQzNCLHFCQUFlLFdBQVcsV0FBVztBQUNyQyxxQkFBZSxXQUFXLGNBQWM7QUFBQSxJQUMxQztBQUFBLEVBQ0Y7OztBQzlGQSxNQUFNQyxPQUFNLE9BQU8sTUFBTSxhQUFhO0FBRS9CLE1BQU0sY0FBTixNQUFrQjtBQUFBLElBQWxCO0FBQ0wsV0FBUSxRQUFRLG9CQUFJLElBQXdCO0FBQUE7QUFBQSxJQUU1QyxJQUFJLE1BQWMsT0FBcUI7QUFDckMsVUFBSSxLQUFLLE1BQU0sSUFBSSxJQUFJLEVBQUc7QUFDMUIsV0FBSyxNQUFNLElBQUksTUFBTSxFQUFFLE1BQU0sT0FBTyxPQUFPLEtBQUssRUFBRSxDQUFDO0FBQ25ELFdBQUssT0FBTztBQUNaLE1BQUFBLEtBQUksTUFBTSxtQkFBbUIsRUFBRSxLQUFLLENBQUM7QUFBQSxJQUN2QztBQUFBLElBRUEsT0FBTyxNQUFvQjtBQUN6QixVQUFJLENBQUMsS0FBSyxNQUFNLElBQUksSUFBSSxFQUFHO0FBQzNCLFdBQUssTUFBTSxPQUFPLElBQUk7QUFDdEIsV0FBSyxPQUFPO0FBQ1osTUFBQUEsS0FBSSxNQUFNLGlCQUFpQixFQUFFLEtBQUssQ0FBQztBQUFBLElBQ3JDO0FBQUEsSUFFQSxPQUFPLE1BQWMsT0FBb0M7QUFDdkQsVUFBSSxLQUFLLE1BQU0sSUFBSSxJQUFJLEdBQUc7QUFDeEIsYUFBSyxPQUFPLElBQUk7QUFDaEIsZUFBTztBQUFBLE1BQ1Q7QUFDQSxXQUFLLElBQUksTUFBTSxLQUFLO0FBQ3BCLGFBQU87QUFBQSxJQUNUO0FBQUEsSUFFQSxRQUFjO0FBQ1osV0FBSyxNQUFNLE1BQU07QUFDakIsV0FBSyxPQUFPO0FBQUEsSUFDZDtBQUFBLElBRUEsV0FBa0M7QUFDaEMsYUFBTyxNQUFNLEtBQUssS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUFBLElBQ3ZDO0FBQUEsSUFFQSxXQUFtQjtBQUNqQixhQUFPLE1BQU0sS0FBSyxLQUFLLE1BQU0sT0FBTyxDQUFDLEVBQ2xDLE9BQU8sQ0FBQyxLQUFLLE1BQU0sS0FBSyxPQUFPLE1BQU0sRUFBRSxTQUFTLEdBQUcsSUFBSSxLQUFLLENBQUM7QUFBQSxJQUNsRTtBQUFBLElBRUEsV0FBbUI7QUFBRSxhQUFPLEtBQUssTUFBTTtBQUFBLElBQU07QUFBQSxJQUU3QyxJQUFJLE1BQXVCO0FBQUUsYUFBTyxLQUFLLE1BQU0sSUFBSSxJQUFJO0FBQUEsSUFBRztBQUFBLElBRTFELFVBQW1CO0FBQUUsYUFBTyxLQUFLLE1BQU0sU0FBUztBQUFBLElBQUc7QUFBQSxJQUVuRCxpQkFBaUIsVUFBcUM7QUFDcEQsVUFBSSxVQUFVO0FBQ2QsV0FBSyxNQUFNLFFBQVEsQ0FBQyxNQUFNLFFBQVE7QUFDaEMsY0FBTSxZQUFZLFNBQVMsSUFBSSxHQUFHO0FBQ2xDLFlBQUksY0FBYyxVQUFhLGNBQWMsS0FBSyxPQUFPO0FBQ3ZELGVBQUssTUFBTSxJQUFJLEtBQUssaUNBQUssT0FBTCxFQUFXLE9BQU8sVUFBVSxFQUFDO0FBQ2pELG9CQUFVO0FBQ1YsVUFBQUEsS0FBSSxLQUFLLHVCQUFvQixFQUFFLE1BQU0sS0FBSyxLQUFLLEtBQUssT0FBTyxLQUFLLFVBQVUsQ0FBQztBQUFBLFFBQzdFO0FBQUEsTUFDRixDQUFDO0FBQ0QsVUFBSSxRQUFTLE1BQUssT0FBTztBQUFBLElBQzNCO0FBQUEsSUFFUSxTQUFlO0FBQ3JCLGtCQUFZLEtBQUssU0FBUyxHQUFHLEtBQUssU0FBUyxDQUFDO0FBQzVDLGVBQVMsS0FBSyxnQkFBZ0IsRUFBRSxPQUFPLEtBQUssU0FBUyxHQUFHLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztBQUFBLElBQ2xGO0FBQUEsRUFDRjs7O0FDL0RBLE1BQU0sb0JBQW9CLElBQUksa0JBQWtCO0FBQ2hELE1BQU0sbUJBQW1CLElBQUksaUJBQWlCO0FBQzlDLE1BQU0sbUJBQW1CLElBQUksaUJBQWlCO0FBRXZDLE1BQU0sZUFBZSxJQUFJLGFBQWEsaUJBQWlCO0FBQ3ZELE1BQU0sY0FBYyxJQUFJLFlBQVk7OztBQ0YzQyxNQUFNLGlCQUEyQjtBQUFBLElBQy9CO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBRUEsTUFBSSxXQUFxQixDQUFDLEdBQUcsY0FBYztBQUMzQyxNQUFJLGdCQUFnQjtBQUNwQixNQUFJLFdBQVc7QUFDZixNQUFJLGtCQUFpQztBQUU5QixXQUFTLG1CQUE2QjtBQUFFLFdBQU87QUFBQSxFQUFnQjtBQUMvRCxXQUFTLGFBQXVCO0FBQUUsV0FBTztBQUFBLEVBQVU7QUFDbkQsV0FBUyxXQUFXLEdBQW1CO0FBQUUsZUFBVztBQUFBLEVBQUc7QUFFdkQsV0FBUyxrQkFBa0IsSUFBeUI7QUFBRSxzQkFBa0I7QUFBQSxFQUFJO0FBR25GLGlCQUFzQixpQkFBK0M7QUEvQnJFO0FBZ0NFLFFBQUk7QUFDRixZQUFNLE9BQU8sTUFBTSxZQUEwQixpQkFBaUIsaUJBQWlCO0FBQy9FLFVBQUksS0FBSyxDQUFDLEdBQUc7QUFDWCxtQkFBVyxNQUFNLFFBQVEsS0FBSyxDQUFDLEVBQUUsT0FBTyxJQUFJLEtBQUssQ0FBQyxFQUFFLFVBQVU7QUFBQSxNQUNoRTtBQUNBLGNBQU8sVUFBSyxDQUFDLE1BQU4sWUFBVztBQUFBLElBQ3BCLFNBQVE7QUFBRSxhQUFPO0FBQUEsSUFBTTtBQUFBLEVBQ3pCO0FBRUEsaUJBQXNCLGdCQUFnQixXQUFpRjtBQUNySCxVQUFNLFNBQVMsZUFBZTtBQUM5QixVQUFNLFNBQVMsTUFBTSxpQkFBaUIsc0JBQXNCLE9BQU8sU0FBUyxHQUFHLE1BQU07QUFDckYsUUFBSSxDQUFDLE9BQU8sR0FBSSxRQUFPO0FBQ3ZCLFFBQUksT0FBTyxNQUFPLG1CQUFrQixPQUFPLE1BQU07QUFDakQsV0FBTyxPQUFPO0FBQUEsRUFDaEI7QUFFQSxpQkFBc0IsTUFDcEIsVUFDQSxhQUNlO0FBQ2YsUUFBSSxTQUFVO0FBRWQsVUFBTSxRQUFRLFNBQVMsU0FBUztBQUNoQyxRQUFJLENBQUMsYUFBYSxNQUFNLE9BQU8sR0FBRztBQUNoQyxtQkFBYSxvRkFBbUUsTUFBTTtBQUN0RjtBQUFBLElBQ0Y7QUFFQSxlQUFXO0FBQ1gsVUFBTSxNQUFNLFNBQVMsZUFBZSxnQkFBZ0I7QUFDcEQsUUFBSSxLQUFLO0FBQUUsVUFBSSxXQUFXO0FBQU0sVUFBSSxjQUFjO0FBQUEsSUFBYztBQUVoRSxVQUFNLElBQUksU0FBUztBQUNuQixVQUFNLE1BQU0sTUFBTTtBQUNsQixVQUFNLFNBQVMsS0FBSyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUM7QUFDM0MsVUFBTSxlQUFlLElBQUksS0FBSyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUM7QUFDckQsVUFBTSxhQUFhLGVBQWUsT0FBTyxNQUFNLE1BQU0sU0FBUyxNQUFNO0FBQ3BFLFVBQU0sZUFBZSxnQkFBZ0I7QUFFckMsVUFBTSxPQUFPLFNBQVMsZUFBZSxZQUFZO0FBQ2pELFFBQUksTUFBTTtBQUNSLFdBQUssTUFBTSxhQUFhO0FBQ3hCLFdBQUssTUFBTSxrQkFBa0I7QUFDN0IsV0FBSyxNQUFNLFlBQVksVUFBVSxZQUFZO0FBQUEsSUFDL0M7QUFFQSxxQkFBa0IsZUFBZSxNQUFPLE9BQU87QUFFL0MsVUFBTSxJQUFJLFFBQWMsYUFBVyxXQUFXLFNBQVMsSUFBSSxDQUFDO0FBRTVELFVBQU0sU0FBUyxTQUFTLE1BQU07QUFDOUIsZUFBVztBQUVYLGdCQUFZLFFBQVEsTUFBTTtBQUUxQixRQUFJLGFBQWEsTUFBTSxPQUFPLEtBQUssS0FBSztBQUN0QyxVQUFJLFdBQVc7QUFDZixVQUFJLGNBQWM7QUFBQSxJQUNwQjtBQUFBLEVBQ0Y7QUFFQSxpQkFBc0IsZUFBZSxTQUFrQixRQUErQjtBQUNwRixRQUFJLGFBQWEsU0FBUyxTQUFTLEVBQUUsT0FBTyxFQUFHO0FBQy9DLFFBQUksQ0FBQyxnQkFBaUI7QUFFdEIsVUFBTSxTQUFTLGVBQWU7QUFFOUIsVUFBTSxjQUFjLE1BQU0saUJBQWlCLGlCQUFpQjtBQUFBLE1BQzFELElBQUk7QUFBQSxNQUNKLFVBQVU7QUFBQSxNQUNWO0FBQUEsSUFDRixDQUFpRDtBQUVqRCxRQUFJLENBQUMsWUFBWSxJQUFJO0FBQ25CLGNBQVEsTUFBTSx5Q0FBbUMsWUFBWSxLQUFLO0FBQ2xFO0FBQUEsSUFDRjtBQUVBLFVBQU0saUJBQWlCLE1BQU0saUJBQWlCO0FBQUEsTUFDNUMsUUFBUTtBQUFBLE1BQ1IsUUFBUTtBQUFBLE1BQ1I7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUVBLFFBQUksQ0FBQyxlQUFlLElBQUk7QUFDdEIsY0FBUSxNQUFNLDRCQUE0QixlQUFlLEtBQUs7QUFBQSxJQUNoRTtBQUFBLEVBQ0Y7QUFFTyxXQUFTLGVBQWUsU0FBeUI7QUFDdEQsVUFBTSxPQUFPLFNBQVMsY0FBYyxzQkFBc0I7QUFDMUQsUUFBSSxDQUFDLEtBQU07QUFDWCxVQUFNLE1BQU0sU0FBUyxlQUFlLGNBQWM7QUFDbEQsUUFBSSxJQUFLLEtBQUksT0FBTztBQUVwQixVQUFNLElBQUksUUFBUTtBQUNsQixVQUFNLEtBQUssS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLFFBQVEsS0FBSyxVQUFVO0FBQzFELFVBQU0sTUFBTSxNQUFNO0FBQ2xCLFVBQU0sUUFBUTtBQUFBLE1BQ1osRUFBRSxJQUFJLFdBQVcsS0FBSyxVQUFVO0FBQUEsTUFDaEMsRUFBRSxJQUFJLFdBQVcsS0FBSyxVQUFVO0FBQUEsSUFDbEM7QUFFQSxVQUFNLE1BQU0sQ0FBQyxNQUFzQixJQUFJLEtBQUssS0FBSztBQUNqRCxVQUFNLEtBQUssQ0FBQyxHQUFXLE1BQWdDLENBQUMsS0FBSyxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM1RyxVQUFNLE1BQU0sQ0FBQyxNQUFzQixFQUFFLFFBQVEsTUFBTSxPQUFPLEVBQUUsUUFBUSxNQUFNLE1BQU0sRUFBRSxRQUFRLE1BQU0sTUFBTTtBQUV0RyxhQUFTLFFBQVEsR0FBbUI7QUFDbEMsWUFBTSxJQUFJLE1BQU0sSUFBSSxJQUFJLElBQUksSUFBSTtBQUNoQyxZQUFNLENBQUMsSUFBSSxFQUFFLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsR0FBRyxDQUFDO0FBQzdDLGFBQU8sSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQztBQUFBLElBQzNHO0FBRUEsYUFBUyxVQUFVLE1BQWMsVUFBNEI7QUFDM0QsWUFBTSxRQUFRLEtBQUssTUFBTSxHQUFHO0FBQzVCLFlBQU0sUUFBa0IsQ0FBQztBQUN6QixVQUFJLE1BQU07QUFDVixZQUFNLFFBQVEsT0FBSztBQUNqQixjQUFNLE9BQU8sTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUs7QUFDbkMsWUFBSSxLQUFLLFNBQVMsWUFBWSxLQUFLO0FBQUUsZ0JBQU0sS0FBSyxHQUFHO0FBQUcsZ0JBQU07QUFBQSxRQUFHLE1BQzFELE9BQU07QUFBQSxNQUNiLENBQUM7QUFDRCxVQUFJLElBQUssT0FBTSxLQUFLLEdBQUc7QUFDdkIsYUFBTyxNQUFNLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDekI7QUFFQSxVQUFNLE9BQU8sUUFBUSxJQUFJLENBQUMsR0FBRyxNQUFNO0FBQ2pDLFlBQU0sSUFBSSxNQUFNLElBQUksQ0FBQztBQUNyQixhQUFPLFlBQVksUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7QUFBQSxJQUM5QyxDQUFDLEVBQUUsS0FBSyxFQUFFO0FBRVYsVUFBTSxTQUFTLFFBQVEsSUFBSSxDQUFDLEdBQUcsTUFBTTtBQUNuQyxZQUFNLElBQUksTUFBTSxJQUFJO0FBQ3BCLFlBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUN0QixhQUFPLGFBQWEsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUFBLElBQzdFLENBQUMsRUFBRSxLQUFLLEVBQUU7QUFFVixVQUFNLFFBQVEsUUFBUSxJQUFJLENBQUMsR0FBRyxNQUFNO0FBQ2xDLFlBQU0sTUFBTSxNQUFNLElBQUksS0FBSyxNQUFNO0FBQ2pDLFlBQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLEtBQUssSUFBSSxJQUFJO0FBQ2pDLFlBQU0sSUFBSSxNQUFNLElBQUksQ0FBQztBQUNyQixZQUFNLElBQUksRUFBRSxNQUFNLGdCQUFnQjtBQUNsQyxZQUFNLFFBQVEsSUFBSSxFQUFFLENBQUMsSUFBSztBQUMxQixZQUFNLE9BQU8sSUFBSSxFQUFFLENBQUMsSUFBSztBQUN6QixZQUFNLFFBQVEsVUFBVSxNQUFNLEVBQUU7QUFDaEMsWUFBTSxRQUFRO0FBQ2QsWUFBTSxZQUFZLE1BQU0sU0FBUztBQUNqQyxZQUFNLFNBQVMsRUFBRSxZQUFZLEtBQUs7QUFDbEMsWUFBTSxPQUFPLE1BQU0sSUFBSSxRQUFRLENBQUM7QUFDaEMsYUFBTywyQkFBMkIsR0FBRyxRQUFRLENBQUMsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsWUFBWSxHQUFHO0FBQUEsbUJBQ2hFLE9BQU8sUUFBUSxDQUFDLENBQUMsd0ZBQXdGLElBQUksS0FBSyxDQUFDO0FBQUEsSUFDbEksTUFBTSxJQUFJLENBQUMsR0FBRyxPQUFPO0FBQ3JCLGNBQU0sT0FBTyxNQUFNLE1BQU0sU0FBUyxLQUFLLEtBQUssT0FBTyxRQUFRLENBQUM7QUFDNUQsZUFBTyxrQkFBa0IsRUFBRSwyREFBMkQsRUFBRSxHQUFHLDhFQUE4RSxJQUFJLENBQUMsQ0FBQztBQUFBLE1BQ2pMLENBQUMsRUFBRSxLQUFLLE1BQU0sQ0FBQztBQUFBO0FBQUEsSUFFZixDQUFDLEVBQUUsS0FBSyxFQUFFO0FBRVYsVUFBTSxRQUFRO0FBQ2QsVUFBTSxPQUFPLE1BQU0sS0FBSyxFQUFFLFFBQVEsTUFBTSxHQUFHLENBQUMsR0FBRyxNQUFNO0FBQ25ELFlBQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFJLE1BQU0sUUFBUyxJQUFJLElBQUksS0FBSztBQUNqRCxhQUFPLGVBQWUsR0FBRyxRQUFRLENBQUMsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLENBQUMsZ0NBQWdDLElBQUksQ0FBQztBQUFBLElBQ2hHLENBQUMsRUFBRSxLQUFLLEVBQUU7QUFFVixVQUFNLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsZ0JBa0JFLEVBQUUsU0FBUyxFQUFFLFFBQVEsT0FBTztBQUFBLGdCQUM1QixFQUFFLFNBQVMsRUFBRSxRQUFRLE9BQU87QUFBQSx1QkFDckIsSUFBSSxHQUFHLE1BQU0sR0FBRyxLQUFLO0FBQUEsZ0JBQzVCLEVBQUUsU0FBUyxFQUFFLFFBQVEsSUFBSSxDQUFDO0FBQUEsSUFDdEMsSUFBSTtBQUFBLGdCQUNRLEVBQUUsU0FBUyxFQUFFO0FBQUEsZ0JBQ2IsRUFBRSxTQUFTLEVBQUU7QUFBQSxhQUNoQixFQUFFLFFBQVEsS0FBSyxDQUFDO0FBQUEsYUFDaEIsRUFBRSxRQUFRLEtBQUssQ0FBQztBQUFBO0FBRzNCLFVBQU0sTUFBTSxTQUFTLGNBQWMsS0FBSztBQUN4QyxRQUFJLFlBQVk7QUFDaEIsU0FBSyxhQUFhLElBQUksbUJBQW9CLEtBQUssVUFBVTtBQUFBLEVBQzNEOzs7QUMxTk8sV0FBUyxXQUEyQjtBQUN6QyxXQUFPLE1BQU0sS0FBSyxZQUFZLFNBQVMsQ0FBQztBQUFBLEVBQzFDO0FBRU8sV0FBUyxXQUFtQjtBQUNqQyxXQUFPLFlBQVksU0FBUztBQUFBLEVBQzlCO0FBdUJPLFdBQVMsWUFBWSxNQUF1QjtBQUNqRCxVQUFNLG1CQUFtQixDQUFDLCtCQUErQiwrQ0FBK0M7QUFDeEcsV0FBTyxpQkFBaUIsU0FBUyxJQUFJO0FBQUEsRUFDdkM7QUFFTyxXQUFTLGdCQUFnQixhQUFxQixlQUF1QixTQUF1QjtBQUNqRyxVQUFNLFFBQVEsU0FBUyxlQUFlLFdBQVc7QUFDakQsVUFBTSxVQUFVLFNBQVMsZUFBZSxhQUFhO0FBQ3JELFVBQU0sUUFBUSxTQUFTLGVBQWUsT0FBTztBQUM3QyxVQUFNLFFBQVEsU0FBUztBQUV2QixRQUFJLE1BQU8sT0FBTSxjQUFjLE9BQU8sTUFBTSxNQUFNO0FBRWxELFFBQUksQ0FBQyxTQUFTLENBQUMsUUFBUztBQUV4QixRQUFJLE1BQU0sV0FBVyxHQUFHO0FBQ3RCLFlBQU0sWUFBWTtBQUNsQixjQUFRLGNBQWM7QUFDdEI7QUFBQSxJQUNGO0FBRUEsVUFBTSxRQUFRLFNBQVM7QUFDdkIsVUFBTSxZQUFZLE1BQU0sSUFBSSxVQUFRO0FBQ2xDLFlBQU0sVUFBVSxRQUFRLEtBQUssSUFBSTtBQUNqQyxZQUFNLFdBQVcsbUJBQW1CLEtBQUssSUFBSTtBQUM3QyxhQUFPO0FBQUEscUNBQzBCLE9BQU87QUFBQSxzQ0FDTixjQUFjLEtBQUssS0FBSyxDQUFDO0FBQUEsd0ZBQ3lCLFFBQVE7QUFBQTtBQUFBLElBRTlGLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxxR0FBcUcsY0FBYyxLQUFLLENBQUM7QUFDdkksWUFBUSxjQUFjLGNBQWMsS0FBSztBQUFBLEVBQzNDOzs7QUNuREEsTUFBTUMsT0FBTSxPQUFPLE1BQU0sTUFBTTtBQUcvQixNQUFNLFlBQVksS0FBSyxzQkFBc0I7QUFDN0MsTUFBTSxXQUFXLEdBQUcsWUFBWTtBQUdoQyxNQUFJLGNBQWM7QUFDbEIsTUFBSSxnQkFBdUQ7QUFDM0QsTUFBSSx1QkFBNkQ7QUFDakUsTUFBSSxnQkFBZ0I7QUFDcEIsTUFBSSxlQUE4QjtBQUNsQyxNQUFJLFlBQVk7QUFDaEIsTUFBSSxZQUFZO0FBQ2hCLE1BQUksWUFBb0QsQ0FBQztBQUN6RCxNQUFJLGVBQWU7QUFFbkIsTUFBSSxlQUFlO0FBQ25CLE1BQUksZUFBZTtBQUduQixXQUFTLGtCQUFrQztBQUN6QyxXQUFPLFNBQVMsU0FBUyxFQUFFO0FBQUEsRUFDN0I7QUFHQSxXQUFTLFFBQVEsS0FBYSxLQUF3QjtBQUNwRCxhQUFTLGlCQUFpQixhQUFhLEVBQUUsUUFBUSxPQUFLLEVBQUUsVUFBVSxPQUFPLFFBQVEsQ0FBQztBQUNsRixRQUFJLFVBQVUsSUFBSSxRQUFRO0FBQzFCLGFBQVMsaUJBQWlCLFlBQVksRUFBRSxRQUFRLFVBQVE7QUFDdEQsWUFBTSxLQUFLO0FBQ1gsVUFBSSxRQUFRLFdBQVksR0FBRyxRQUFRLEtBQUssTUFBTTtBQUM1QyxXQUFHLFVBQVUsT0FBTyxRQUFRO0FBQUE7QUFFNUIsV0FBRyxVQUFVLElBQUksUUFBUTtBQUFBLElBQzdCLENBQUM7QUFBQSxFQUNIO0FBR0EsV0FBUyxlQUFxQjtBQUM1QixVQUFNLE1BQU0sU0FBUyxlQUFlLFNBQVM7QUFDN0MsVUFBTSxRQUFRLFNBQVMsZUFBZSxXQUFXO0FBQ2pELFVBQU0sUUFBUSxZQUFZLFNBQVM7QUFDbkMsUUFBSSxNQUFPLE9BQU0sY0FBYyxPQUFPLEtBQUs7QUFDM0MsUUFBSSxLQUFLO0FBQ1AsVUFBSSxRQUFRLEVBQUcsS0FBSSxVQUFVLElBQUksT0FBTztBQUFBLFdBQ25DO0FBQUUsWUFBSSxVQUFVLE9BQU8sT0FBTztBQUFHLG9CQUFZO0FBQUEsTUFBRztBQUFBLElBQ3ZEO0FBQUEsRUFDRjtBQUVBLFdBQVMsYUFBYSxPQUFvQixNQUFjLE9BQXFCO0FBQzNFLFVBQU0sT0FBTyxNQUFNLFFBQVEsWUFBWTtBQUN2QyxRQUFJLFlBQVksSUFBSSxJQUFJLEdBQUc7QUFDekIsa0JBQVksT0FBTyxJQUFJO0FBQ3ZCLG1DQUFNLFVBQVUsT0FBTztBQUN2QixtQkFBYTtBQUNiO0FBQUEsSUFDRjtBQUNBLGdCQUFZLElBQUksTUFBTSxLQUFLO0FBQzNCLGlDQUFNLFVBQVUsSUFBSTtBQUNwQixpQkFBYTtBQUNiLGdCQUFZLE1BQU0sS0FBSztBQUFBLEVBQ3pCO0FBRUEsV0FBUyxZQUFZLE1BQWMsT0FBcUI7QUF0RnhEO0FBdUZFLFVBQU0sS0FBSyxTQUFTLGVBQWUsZUFBZTtBQUNsRCxRQUFJLEdBQUksSUFBRyxZQUFZLGFBQWEsUUFBUSxJQUFJLElBQUkseUJBQW9CLE9BQU8sS0FBSyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFFBQVEsS0FBSyxHQUFHO0FBQ2pILG1CQUFTLGVBQWUsZ0JBQWdCLE1BQXhDLG1CQUEyQyxVQUFVLElBQUk7QUFBQSxFQUMzRDtBQUVBLFdBQVMsZUFBcUI7QUE1RjlCO0FBNkZFLG1CQUFTLGVBQWUsZ0JBQWdCLE1BQXhDLG1CQUEyQyxVQUFVLE9BQU87QUFBQSxFQUM5RDtBQUVBLFdBQVMscUJBQXFCLEdBQWdCO0FBQzVDLFFBQUssRUFBRSxPQUF1QixPQUFPLGlCQUFrQixjQUFhO0FBQUEsRUFDdEU7QUFFQSxXQUFTLGtCQUF3QjtBQUMvQixpQkFBYTtBQUNiLGVBQVc7QUFBQSxFQUNiO0FBRUEsV0FBUyxxQkFBMkI7QUFDbEMsb0JBQWdCLGlCQUFpQixlQUFlLFlBQVk7QUFBQSxFQUM5RDtBQUVBLFdBQVMsNEJBQWtDO0FBQ3pDLFVBQU0sS0FBSyxTQUFTLGVBQWUsaUJBQWlCO0FBQ3BELFFBQUksQ0FBQyxHQUFJO0FBQ1QsVUFBTSxRQUFRLFlBQVksU0FBUztBQUNuQyxVQUFNLFdBQVcsTUFBTSxLQUFLLE9BQUssWUFBWSxFQUFFLElBQUksQ0FBQztBQUNwRCxVQUFNLFlBQVksTUFBTSxLQUFLLE9BQUssQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDO0FBQ3RELFFBQUksWUFBWSxXQUFXO0FBQ3pCLFNBQUcsWUFBWTtBQUFBLElBQ2pCLFdBQVcsVUFBVTtBQUNuQixTQUFHLFlBQVk7QUFBQSxJQUNqQixPQUFPO0FBQ0wsU0FBRyxZQUFZO0FBQUEsSUFDakI7QUFBQSxFQUNGO0FBRUEsV0FBUyxhQUFtQjtBQTVINUI7QUE2SEUsdUJBQW1CO0FBQ25CLDhCQUEwQjtBQUMxQixtQkFBUyxlQUFlLGVBQWUsTUFBdkMsbUJBQTBDLFVBQVUsSUFBSTtBQUN4RCxhQUFTLEtBQUssVUFBVSxJQUFJLGNBQWM7QUFBQSxFQUM1QztBQUVBLFdBQVMsY0FBb0I7QUFuSTdCO0FBb0lFLG1CQUFTLGVBQWUsZUFBZSxNQUF2QyxtQkFBMEMsVUFBVSxPQUFPO0FBQzNELGFBQVMsS0FBSyxVQUFVLE9BQU8sY0FBYztBQUFBLEVBQy9DO0FBRUEsV0FBUyxvQkFBb0IsR0FBZ0I7QUFDM0MsUUFBSyxFQUFFLE9BQXVCLE9BQU8sZ0JBQWlCLGFBQVk7QUFBQSxFQUNwRTtBQUVBLFdBQVMsa0JBQWtCLE1BQW9CO0FBQzdDLFFBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxFQUFHO0FBQzVCLGdCQUFZLE9BQU8sSUFBSTtBQUN2QixhQUFTLGlCQUFpQix3QkFBd0IsRUFBRSxRQUFRLFVBQVE7QUEvSXRFO0FBZ0pJLFlBQU0sU0FBUyxLQUFLLGNBQWMsWUFBWTtBQUM5QyxVQUFJLFlBQVUsWUFBTyxnQkFBUCxtQkFBb0IsWUFBVyxLQUFNLE1BQUssVUFBVSxPQUFPLGFBQWE7QUFBQSxJQUN4RixDQUFDO0FBQ0QsdUJBQW1CO0FBQ25CLGlCQUFhO0FBQUEsRUFDZjtBQUVBLFdBQVMsb0JBQW9CLElBQXVCO0FBdkpwRDtBQXdKRSxhQUFTLGlCQUFpQixnQkFBZ0IsRUFBRSxRQUFRLE9BQUssRUFBRSxVQUFVLE9BQU8sT0FBTyxDQUFDO0FBQ3BGLE9BQUcsVUFBVSxJQUFJLE9BQU87QUFDeEIsVUFBTSxRQUFRLFFBQStDLFFBQVEsS0FBSyxNQUE1RCxZQUFpRTtBQUMvRSxhQUFTLFNBQVMsRUFBRSxzQkFBc0IsS0FBSyxDQUFDO0FBQUEsRUFDbEQ7QUFFQSxXQUFTLGlCQUF1QjtBQUM5QixnQkFBWSxNQUFNO0FBQ2xCLGFBQVMsU0FBUyxFQUFFLHNCQUFzQixHQUFHLENBQUM7QUFDOUMsYUFBUyxpQkFBaUIsc0JBQXNCLEVBQUUsUUFBUSxPQUFLLEVBQUUsVUFBVSxPQUFPLE9BQU8sQ0FBQztBQUMxRixVQUFNLFFBQVEsU0FBUyxlQUFlLFFBQVE7QUFDOUMsUUFBSSxNQUFPLE9BQU0sUUFBUTtBQUN6QixhQUFTLGlCQUFpQix3QkFBd0IsRUFBRSxRQUFRLE9BQUssRUFBRSxVQUFVLE9BQU8sYUFBYSxDQUFDO0FBQ2xHLGlCQUFhO0FBQ2IsZ0JBQVk7QUFBQSxFQUNkO0FBR0EsV0FBUyxlQUFlLE9BQW9CLE1BQWMsT0FBcUI7QUFDN0UsVUFBTSxPQUFPLE1BQU0sUUFBUSxZQUFZO0FBQ3ZDLFFBQUksWUFBWSxJQUFJLElBQUksR0FBRztBQUN6QixrQkFBWSxPQUFPLElBQUk7QUFDdkIsbUNBQU0sVUFBVSxPQUFPO0FBQ3ZCLG1CQUFhO0FBQ2IsZ0NBQTBCO0FBQzFCO0FBQUEsSUFDRjtBQUNBLGdCQUFZLElBQUksTUFBTSxLQUFLO0FBQzNCLGlDQUFNLFVBQVUsSUFBSTtBQUNwQixpQkFBYTtBQUNiLG9CQUFnQjtBQUFBLEVBQ2xCO0FBRUEsV0FBUyxrQkFBd0I7QUF6TGpDO0FBMExFLG1CQUFTLGVBQWUsb0JBQW9CLE1BQTVDLG1CQUErQyxVQUFVLElBQUk7QUFBQSxFQUMvRDtBQUVBLFdBQVMsaUJBQWlCLEdBQWlCO0FBN0wzQztBQThMRSxRQUFJLENBQUMsS0FBTSxFQUFFLE9BQXVCLE9BQU8sc0JBQXNCO0FBQy9ELHFCQUFTLGVBQWUsb0JBQW9CLE1BQTVDLG1CQUErQyxVQUFVLE9BQU87QUFBQSxJQUNsRTtBQUFBLEVBQ0Y7QUFFQSxXQUFTLHNCQUE0QjtBQUNuQyxVQUFNLGFBQWEsWUFBWSxTQUFTLEVBQUUsT0FBTyxPQUFLLFlBQVksRUFBRSxJQUFJLENBQUM7QUFDekUsUUFBSSxTQUFTO0FBQ2IsUUFBSSxRQUFRO0FBQ1osZUFBVyxRQUFRLE9BQUs7QUFDdEIsZ0JBQVUsWUFBTyxFQUFFLE9BQU8sZ0JBQVcsRUFBRSxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsS0FBSyxHQUFHLElBQUk7QUFDNUUsY0FBUSxLQUFLLE9BQU8sUUFBUSxFQUFFLFNBQVMsR0FBRyxJQUFJO0FBQUEsSUFDaEQsQ0FBQztBQUNELFVBQU0sTUFBTSxvSEFBMEcsU0FBUyw2QkFBc0IsTUFBTSxRQUFRLENBQUMsRUFBRSxRQUFRLEtBQUssR0FBRyxJQUFJO0FBQzFMLFdBQU8sS0FBSyxtQkFBbUIsWUFBWSxXQUFXLG1CQUFtQixHQUFHLEdBQUcsUUFBUTtBQUN2RixxQkFBaUI7QUFBQSxFQUNuQjtBQUdBLFdBQVMsYUFBYSxJQUFZLEdBQWdCO0FBak5sRDtBQWtORSxRQUFJLEVBQUcsR0FBRSxnQkFBZ0I7QUFDekIsVUFBTSxJQUFJLFNBQVMsZUFBZSxFQUFFO0FBQ3BDLFFBQUksQ0FBQyxFQUFHO0FBQ1IsVUFBTSxPQUFPLEVBQUUsaUJBQWlCLGVBQWU7QUFDL0MsVUFBTSxPQUFPLEVBQUUsaUJBQWlCLGVBQWU7QUFDL0MsUUFBSSxNQUFNO0FBQ1YsU0FBSyxRQUFRLENBQUMsS0FBSyxNQUFNO0FBQUUsVUFBSSxJQUFJLFVBQVUsU0FBUyxPQUFPLEVBQUcsT0FBTTtBQUFBLElBQUcsQ0FBQztBQUMxRSxlQUFLLEdBQUcsTUFBUixtQkFBVyxVQUFVLE9BQU87QUFDNUIsZUFBSyxHQUFHLE1BQVIsbUJBQVcsVUFBVSxPQUFPO0FBQzVCLFVBQU0sUUFBUSxNQUFNLEtBQUssS0FBSztBQUM5QixlQUFLLElBQUksTUFBVCxtQkFBWSxVQUFVLElBQUk7QUFDMUIsZUFBSyxJQUFJLE1BQVQsbUJBQVksVUFBVSxJQUFJO0FBQUEsRUFDNUI7QUFFQSxXQUFTLGFBQWEsSUFBWSxHQUFnQjtBQWhPbEQ7QUFpT0UsUUFBSSxFQUFHLEdBQUUsZ0JBQWdCO0FBQ3pCLFVBQU0sSUFBSSxTQUFTLGVBQWUsRUFBRTtBQUNwQyxRQUFJLENBQUMsRUFBRztBQUNSLFVBQU0sT0FBTyxFQUFFLGlCQUFpQixlQUFlO0FBQy9DLFVBQU0sT0FBTyxFQUFFLGlCQUFpQixlQUFlO0FBQy9DLFFBQUksTUFBTTtBQUNWLFNBQUssUUFBUSxDQUFDLEtBQUssTUFBTTtBQUFFLFVBQUksSUFBSSxVQUFVLFNBQVMsT0FBTyxFQUFHLE9BQU07QUFBQSxJQUFHLENBQUM7QUFDMUUsZUFBSyxHQUFHLE1BQVIsbUJBQVcsVUFBVSxPQUFPO0FBQzVCLGVBQUssR0FBRyxNQUFSLG1CQUFXLFVBQVUsT0FBTztBQUM1QixVQUFNLFFBQVEsTUFBTSxJQUFJLEtBQUssVUFBVSxLQUFLO0FBQzVDLGVBQUssSUFBSSxNQUFULG1CQUFZLFVBQVUsSUFBSTtBQUMxQixlQUFLLElBQUksTUFBVCxtQkFBWSxVQUFVLElBQUk7QUFBQSxFQUM1QjtBQUdBLGlCQUFlLGtCQUFpQztBQWhQaEQ7QUFpUEUsVUFBTSxRQUFRLFlBQVksU0FBUztBQUNuQyxVQUFNLGNBQWMsTUFBTSxLQUFLLE9BQUssWUFBWSxFQUFFLElBQUksQ0FBQztBQUN2RCxVQUFNLGVBQWUsTUFBTSxLQUFLLE9BQUssQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDO0FBQ3pELFFBQUksZUFBZSxjQUFjO0FBQy9CLFVBQUksQ0FBQyxRQUFRLDJQQUFxTztBQUNoUDtBQUFBLElBQ0o7QUFDQSxRQUFJLE1BQU0sV0FBVyxHQUFHO0FBQUUsWUFBTSw2Q0FBNkM7QUFBRztBQUFBLElBQVE7QUFFeEYsVUFBTSxRQUFRLG9CQUFTLGVBQWUsU0FBUyxNQUFqQyxtQkFBeUQsTUFBTSxXQUEvRCxZQUF5RTtBQUN2RixVQUFNLFlBQVksb0JBQVMsZUFBZSxhQUFhLE1BQXJDLG1CQUFnRSxNQUFNLFdBQXRFLFlBQWdGO0FBQ2xHLFVBQU0sT0FBTyxvQkFBUyxlQUFlLFFBQVEsTUFBaEMsbUJBQTJELE1BQU0sV0FBakUsWUFBMkU7QUFDeEYsVUFBTSx1QkFBdUIsU0FBUyxTQUFTLEVBQUU7QUFDakQsVUFBTSxlQUFlLGdCQUFnQjtBQUVyQyxRQUFJLENBQUMsTUFBTTtBQUFFLFlBQU0sdUNBQXVDO0FBQUcscUJBQVMsZUFBZSxTQUFTLE1BQWpDLG1CQUFvQztBQUFTO0FBQUEsSUFBUTtBQUNsSCxRQUFJLENBQUMsVUFBVTtBQUFFLFlBQU0scUNBQWtDO0FBQUcscUJBQVMsZUFBZSxhQUFhLE1BQXJDLG1CQUF3QztBQUFTO0FBQUEsSUFBUTtBQUNySCxRQUFJLENBQUMsc0JBQXNCO0FBQUUsWUFBTSwwQ0FBMEM7QUFBRztBQUFBLElBQVE7QUFHeEYsVUFBTSxXQUFXLG9CQUFJLElBQW9CO0FBQ3pDLGFBQVMsaUJBQWlCLFlBQVksRUFBRSxRQUFRLFNBQU87QUF0UXpELFVBQUFDO0FBdVFJLFlBQU0sZUFBY0EsTUFBQSxJQUFJLGFBQWEsU0FBUyxNQUExQixPQUFBQSxNQUErQjtBQUNuRCxZQUFNLElBQUksWUFBWSxNQUFNLDhDQUE4QztBQUMxRSxVQUFJLEVBQUcsVUFBUyxJQUFJLEVBQUUsQ0FBQyxHQUFJLFdBQVcsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUFBLElBQzlDLENBQUM7QUFDRCxnQkFBWSxpQkFBaUIsUUFBUTtBQUVyQyxVQUFNLG1CQUFtQixNQUFNLEtBQUssWUFBWSxTQUFTLENBQUM7QUFDMUQsUUFBSSxRQUFRO0FBQ1osUUFBSSxjQUFjO0FBQ2xCLHFCQUFpQixRQUFRLFVBQVE7QUFDL0IsY0FBUSxLQUFLLE9BQU8sUUFBUSxLQUFLLFNBQVMsR0FBRyxJQUFJO0FBQ2pELHFCQUFlLFVBQUssS0FBSyxJQUFJLGNBQVMsS0FBSyxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsS0FBSyxHQUFHLENBQUM7QUFBQTtBQUFBLElBQy9FLENBQUM7QUFFRCxVQUFNLE1BQU07QUFBQTtBQUFBO0FBQUEsRUFBK0MsV0FBVztBQUFBLHdCQUFvQixNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsS0FBSyxHQUFHLENBQUM7QUFBQTtBQUFBLG9CQUFrQixJQUFJO0FBQUEsMkJBQW9CLFFBQVE7QUFBQSx5QkFBcUIsb0JBQW9CLEdBQUcsTUFBTTtBQUFBLG1CQUFlLEdBQUcsS0FBSyxFQUFFO0FBQUE7QUFBQTtBQUV6UCxVQUFNLFNBQVMsU0FBUyxlQUFlLGNBQWM7QUFDckQsVUFBTSxVQUFVLFVBQVUsWUFBTyxnQkFBUCxZQUFzQixLQUFNO0FBQ3RELFFBQUksUUFBUTtBQUFFLGFBQU8sV0FBVztBQUFNLGFBQU8sY0FBYztBQUFBLElBQXNCO0FBRWpGLFFBQUksWUFBMkI7QUFDL0IsUUFBSTtBQUNGLFlBQU0sT0FBTyxJQUFJLGdCQUFnQjtBQUNqQyxZQUFNLE1BQU0sV0FBVyxNQUFNLEtBQUssTUFBTSxHQUFHLEdBQU07QUFDakQsWUFBTSxJQUFJLE1BQU0sTUFBTSxlQUFlLG9CQUFvQjtBQUFBLFFBQ3ZELFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxVQUNQLGdCQUFnQjtBQUFBLFVBQ2hCLFVBQVU7QUFBQSxVQUNWLGlCQUFpQixZQUFZO0FBQUEsVUFDN0IsVUFBVTtBQUFBLFFBQ1o7QUFBQSxRQUNBLE1BQU0sS0FBSyxVQUFVO0FBQUEsVUFDbkI7QUFBQSxVQUFNO0FBQUEsVUFDTixXQUFXO0FBQUEsVUFDWCxPQUFPLGlCQUFpQixJQUFJLFFBQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQUEsVUFDbkU7QUFBQSxVQUNBLFFBQVE7QUFBQSxVQUNSLFlBQVksT0FBTztBQUFBLFVBQ25CLFlBQVksZUFBZSxhQUFhLEtBQUs7QUFBQSxVQUM3QyxVQUFVLGVBQWUsYUFBYSxXQUFXO0FBQUEsUUFDbkQsQ0FBQztBQUFBLFFBQ0QsUUFBUSxLQUFLO0FBQUEsTUFDZixDQUFDO0FBQ0QsbUJBQWEsR0FBRztBQUNoQixVQUFJLENBQUMsRUFBRSxJQUFJO0FBQ1QsY0FBTSxTQUFTLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxNQUFNLEVBQUU7QUFDNUMsUUFBQUQsS0FBSSxNQUFNLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxRQUFRLE1BQU0sT0FBTyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDbEYsY0FBTSxJQUFJLE1BQU0sVUFBVSxFQUFFLFNBQVMsYUFBUSxPQUFPLE1BQU0sR0FBRyxHQUFHLENBQUM7QUFBQSxNQUNuRTtBQUNBLFlBQU0sT0FBTSxPQUFFLFFBQVEsSUFBSSxVQUFVLE1BQXhCLFlBQTZCO0FBQ3pDLFlBQU0sVUFBVSxJQUFJLE1BQU0sY0FBYztBQUN4QyxVQUFJLFNBQVM7QUFDWCxvQkFBWSxTQUFTLFFBQVEsQ0FBQyxHQUFJLEVBQUU7QUFDcEMsWUFBSSxPQUFRLFFBQU8sY0FBYztBQUNqQyxZQUFJLGdCQUFnQixhQUFhLElBQUk7QUFDbkMsNEJBQWtCLGVBQWUsYUFBYSxJQUFJLFFBQVEsRUFDdkQsTUFBTSxDQUFDLE1BQWVBLEtBQUksS0FBSyw2Q0FBb0MsRUFBRSxPQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUFBLFFBQzdGO0FBQUEsTUFDRjtBQUFBLElBQ0YsU0FBUyxHQUFHO0FBQ1YsVUFBSSxPQUFRLFFBQU8sY0FBYztBQUNqQyxNQUFBQSxLQUFJLEtBQUssMkJBQTJCLEVBQUUsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDO0FBQUEsSUFDMUQ7QUFFQSxlQUFXLE1BQU07QUFDZixVQUFJLFFBQVE7QUFBRSxlQUFPLFdBQVc7QUFBTyxlQUFPLGNBQWM7QUFBQSxNQUFTO0FBQUEsSUFDdkUsR0FBRyxHQUFJO0FBRVAsU0FBSyx5QkFBeUIsU0FBUyx5QkFBeUIsZ0JBQWEsV0FBVztBQUN0RixZQUFNLGNBQWMseUJBQXlCLGNBQVcsZ0JBQWdCO0FBQ3hFLHNCQUFnQixXQUFXLE9BQU8sTUFBTSxLQUFLLGFBQWEsa0JBQWtCLFFBQVE7QUFBQSxJQUN0RixPQUFPO0FBQ0wsYUFBTyxLQUFLLG1CQUFtQixZQUFZLFdBQVcsbUJBQW1CLEdBQUcsR0FBRyxRQUFRO0FBQ3ZGLFVBQUksV0FBVztBQUNiLGlCQUFTLFNBQVMsRUFBRSxrQkFBa0IsVUFBVSxDQUFDO0FBQ2pELHVCQUFTLGVBQWUsbUJBQW1CLE1BQTNDLG1CQUE4QyxVQUFVLElBQUk7QUFBQSxNQUM5RDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBRUEsaUJBQWUsbUJBQWtDO0FBQy9DLFVBQU0sS0FBSyxTQUFTLFNBQVMsRUFBRTtBQUMvQixVQUFNLE1BQU0sU0FBUyxjQUFjLGdCQUFnQjtBQUNuRCxVQUFNLGVBQWUsZ0JBQWdCO0FBQ3JDLFFBQUksQ0FBQyxJQUFJO0FBQUUsc0JBQWdCO0FBQUc7QUFBQSxJQUFRO0FBQ3RDLFFBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLElBQUk7QUFBRSxzQkFBZ0I7QUFBRztBQUFBLElBQVE7QUFDcEUsUUFBSSxLQUFLO0FBQUUsVUFBSSxjQUFjO0FBQWtCLFVBQUksV0FBVztBQUFBLElBQU07QUFDcEUsVUFBTSxTQUFTLE1BQU0saUJBQWlCLGFBQWEsSUFBSSxhQUFhLElBQUksWUFBWTtBQUNwRixRQUFJLE9BQU8sSUFBSTtBQUNiLFVBQUksSUFBSyxLQUFJLGNBQWM7QUFDM0IsaUJBQVcsTUFBTTtBQUFFLHdCQUFnQjtBQUFHLHVCQUFlO0FBQUEsTUFBRyxHQUFHLElBQUk7QUFBQSxJQUNqRSxPQUFPO0FBQ0wsVUFBSSxLQUFLO0FBQUUsWUFBSSxjQUFjO0FBQTRCLFlBQUksV0FBVztBQUFBLE1BQU87QUFDL0UsTUFBQUEsS0FBSSxLQUFLLDRCQUE0QixFQUFFLE9BQU8sT0FBTyxNQUFNLFFBQVEsQ0FBQztBQUNwRSxzQkFBZ0I7QUFBQSxJQUNsQjtBQUFBLEVBQ0Y7QUFFQSxXQUFTLGtCQUF3QjtBQTFXakM7QUEyV0UsbUJBQVMsZUFBZSxtQkFBbUIsTUFBM0MsbUJBQThDLFVBQVUsT0FBTztBQUMvRCxhQUFTLFNBQVMsRUFBRSxrQkFBa0IsS0FBSyxDQUFDO0FBQUEsRUFDOUM7QUFHQSxpQkFBZSxnQkFDYixVQUNBLE9BQ0EsTUFDQSxPQUNBLGFBQ0EsT0FDQSxVQUNlO0FBeFhqQjtBQXlYRSxtQkFBZTtBQUNmLGdCQUFZO0FBQ1osZ0JBQVk7QUFDWixnQkFBWSxTQUFTLENBQUM7QUFDdEIsbUJBQWUsWUFBWTtBQUMzQixVQUFNLFFBQVEsZ0JBQWdCO0FBRTlCLFVBQU0sWUFBWSxTQUFTLGVBQWUsV0FBVztBQUNyRCxVQUFNLFNBQVMsU0FBUyxlQUFlLFFBQVE7QUFDL0MsVUFBTSxXQUFXLFNBQVMsZUFBZSxVQUFVO0FBQ25ELFVBQU0sV0FBVyxTQUFTLGVBQWUsVUFBVTtBQUNuRCxVQUFNLGNBQWMsU0FBUyxlQUFlLGFBQWE7QUFDekQsVUFBTSxpQkFBaUIsU0FBUyxlQUFlLGdCQUFnQjtBQUMvRCxVQUFNLFlBQVksU0FBUyxlQUFlLFdBQVc7QUFDckQsVUFBTSxhQUFhLFNBQVMsZUFBZSxZQUFZO0FBQ3ZELFVBQU0sV0FBVyxTQUFTLGVBQWUsVUFBVTtBQUVuRCxRQUFJLFVBQVcsV0FBVSxjQUFjLFFBQVEsNEJBQXFCO0FBQ3BFLFFBQUksT0FBUSxRQUFPLGNBQWMsUUFBUSw0Q0FBeUM7QUFDbEYsUUFBSSxTQUFVLFVBQVMsY0FBYyxRQUFRLE1BQU0sUUFBUSxDQUFDLEVBQUUsUUFBUSxLQUFLLEdBQUc7QUFDOUUsUUFBSSxTQUFVLFVBQVMsTUFBTSxVQUFVLFFBQVEsVUFBVTtBQUN6RCxRQUFJLFlBQWEsYUFBWSxNQUFNLFVBQVUsUUFBUSxTQUFTO0FBQzlELFFBQUksZUFBZ0IsZ0JBQWUsTUFBTSxVQUFVO0FBQ25ELFFBQUksV0FBVztBQUFFLGdCQUFVLGNBQWMsUUFBUSw4QkFBeUI7QUFBSSxnQkFBVSxZQUFZLGdCQUFnQixRQUFRLG9CQUFvQjtBQUFBLElBQUs7QUFDckosUUFBSSxXQUFZLFlBQVcsY0FBYztBQUN6QyxRQUFJLFNBQVUsVUFBUyxNQUFNO0FBQzdCLG1CQUFTLGVBQWUsYUFBYSxNQUFyQyxtQkFBd0MsVUFBVSxJQUFJO0FBQ3RELGdCQUFZO0FBRVosUUFBSSxDQUFDLE1BQU87QUFFWixvQkFBZ0I7QUFFaEIsUUFBSTtBQUNGLFlBQU0sT0FBTyxNQUFNLE1BQU0sV0FBVyxjQUFjO0FBQUEsUUFDaEQsUUFBUTtBQUFBLFFBQ1IsU0FBUyxFQUFFLGdCQUFnQixvQkFBb0IsVUFBVSxlQUFlLGlCQUFpQixZQUFZLGNBQWM7QUFBQSxRQUNuSCxNQUFNLEtBQUssVUFBVSxFQUFFLFdBQVcsVUFBVSxPQUFPLE1BQU0sY0FBYyxNQUFNLENBQUM7QUFBQSxNQUNoRixDQUFDO0FBQ0QsWUFBTSxPQUFPLE1BQU0sS0FBSyxLQUFLO0FBRTdCLFVBQUksY0FBZTtBQUduQixVQUFJLEtBQUssV0FBVyxPQUFRLEtBQUssU0FBUyxLQUFLLE1BQU0sU0FBUyxTQUFTLEdBQUk7QUFDekUsWUFBSSxXQUFXO0FBQUUsb0JBQVUsY0FBYztBQUF1RixvQkFBVSxZQUFZO0FBQUEsUUFBYztBQUNwSyxZQUFJLFdBQVksWUFBVyxjQUFjO0FBQ3pDLFlBQUksZUFBZ0IsZ0JBQWUsTUFBTSxVQUFVO0FBQ25ELFFBQUFBLEtBQUksS0FBSywyQkFBd0IsRUFBRSxZQUFZLEtBQUssV0FBVyxDQUFDO0FBQ2hFO0FBQUEsTUFDRjtBQUVBLFVBQUksQ0FBQyxLQUFLLE1BQU0sS0FBSyxNQUFPLE9BQU0sSUFBSSxPQUFNLFVBQUssVUFBTCxZQUFjLFVBQVUsS0FBSyxNQUFNO0FBRS9FLFVBQUksQ0FBQyxLQUFLLFFBQVMsT0FBTSxJQUFJLE1BQU0sd0NBQXFDO0FBRXhFLG9CQUFjLEtBQUs7QUFDbkIsVUFBSSxXQUFZLFlBQVcsY0FBYztBQUN6QyxVQUFJLEtBQUssaUJBQWlCLFNBQVUsVUFBUyxNQUFNLDJCQUEyQixLQUFLO0FBQ25GLFVBQUksV0FBVztBQUFFLGtCQUFVLGNBQWM7QUFBNkIsa0JBQVUsWUFBWTtBQUFBLE1BQTZCO0FBR3pILFVBQUksZ0JBQWdCO0FBQ2xCLHVCQUFlLE1BQU0sVUFBVTtBQUMvQixtQkFBVyxNQUFNO0FBQ2YsY0FBSSxDQUFDLGlCQUFpQixlQUFnQixnQkFBZSxNQUFNLFVBQVU7QUFBQSxRQUN2RSxHQUFHLEdBQU07QUFBQSxNQUNYO0FBQ0Esc0JBQWdCLFlBQVksdUJBQXVCLEdBQUk7QUFFdkQsNkJBQXVCLFdBQVcsTUFBTTtBQUN0QyxZQUFJLGVBQWU7QUFBRSx3QkFBYyxhQUFhO0FBQUcsMEJBQWdCO0FBQUEsUUFBTTtBQUN6RSwrQkFBdUI7QUFDdkIsWUFBSSxXQUFXO0FBQUUsb0JBQVUsY0FBYztBQUEyRCxvQkFBVSxZQUFZO0FBQUEsUUFBYztBQUN4SSxZQUFJLGVBQWdCLGdCQUFlLE1BQU0sVUFBVTtBQUFBLE1BQ3JELEdBQUcsS0FBSyxLQUFLLEdBQUk7QUFBQSxJQUNuQixTQUFTLEdBQUc7QUFDVixVQUFJLGNBQWU7QUFDbkIsTUFBQUEsS0FBSSxLQUFLLHFCQUFxQixFQUFFLE9BQU8sT0FBTyxDQUFDLEVBQUUsQ0FBQztBQUNsRCxVQUFJLFdBQVksWUFBVyxjQUFjO0FBQ3pDLFVBQUksV0FBVztBQUFFLGtCQUFVLGNBQWM7QUFBdUUsa0JBQVUsWUFBWTtBQUFBLE1BQWM7QUFDcEosVUFBSSxlQUFnQixnQkFBZSxNQUFNLFVBQVU7QUFBQSxJQUNyRDtBQUFBLEVBQ0Y7QUFFQSxXQUFTLHFCQUFxQixNQUFvQjtBQTljbEQ7QUErY0UsbUJBQVMsZUFBZSxZQUFZLE1BQXBDLG1CQUF1QyxVQUFVLE9BQU8sU0FBUyxTQUFTO0FBQzFFLG1CQUFTLGVBQWUsV0FBVyxNQUFuQyxtQkFBc0MsVUFBVSxPQUFPLFNBQVMsU0FBUztBQUFBLEVBQzNFO0FBRUEsV0FBUyxlQUFlLElBQTRCO0FBQ2xELFFBQUksSUFBSSxHQUFHLE1BQU0sUUFBUSxPQUFPLEVBQUUsRUFBRSxVQUFVLEdBQUcsRUFBRTtBQUNuRCxPQUFHLFFBQVEsRUFBRSxRQUFRLGdCQUFnQixLQUFLO0FBQUEsRUFDNUM7QUFFQSxXQUFTLFlBQVksSUFBNEI7QUFDL0MsUUFBSSxJQUFJLEdBQUcsTUFBTSxRQUFRLE9BQU8sRUFBRSxFQUFFLFVBQVUsR0FBRyxFQUFFO0FBQ25ELFFBQUksRUFBRSxRQUFRLGVBQWUsT0FBTztBQUNwQyxRQUFJLEVBQUUsUUFBUSx3QkFBd0IsVUFBVTtBQUNoRCxRQUFJLEVBQUUsUUFBUSx1Q0FBdUMsYUFBYTtBQUNsRSxPQUFHLFFBQVE7QUFBQSxFQUNiO0FBRUEsV0FBUyxpQkFBaUIsSUFBNEI7QUFDcEQsUUFBSSxJQUFJLEdBQUcsTUFBTSxRQUFRLE9BQU8sRUFBRSxFQUFFLFVBQVUsR0FBRyxDQUFDO0FBQ2xELFFBQUksRUFBRSxVQUFVLEVBQUcsS0FBSSxFQUFFLFVBQVUsR0FBRyxDQUFDLElBQUksTUFBTSxFQUFFLFVBQVUsQ0FBQztBQUM5RCxPQUFHLFFBQVE7QUFBQSxFQUNiO0FBRUEsV0FBUyxZQUFZLElBQTRCO0FBQy9DLFFBQUksSUFBSSxHQUFHLE1BQU0sUUFBUSxPQUFPLEVBQUUsRUFBRSxVQUFVLEdBQUcsQ0FBQztBQUNsRCxRQUFJLEVBQUUsU0FBUyxFQUFHLEtBQUksRUFBRSxVQUFVLEdBQUcsQ0FBQyxJQUFJLE1BQU0sRUFBRSxVQUFVLENBQUM7QUFDN0QsT0FBRyxRQUFRO0FBQUEsRUFDYjtBQUVBLGlCQUFlLGNBQTZCO0FBQzFDLGlCQUFhLHVFQUE2RCxNQUFNO0FBQUEsRUFDbEY7QUFFQSxpQkFBZSx3QkFBdUM7QUFDcEQsUUFBSSxDQUFDLGdCQUFnQixjQUFlO0FBQ3BDLFVBQU0sU0FBUyxNQUFNLGlCQUFpQixTQUFTLFlBQVk7QUFDM0QsUUFBSSxPQUFPLE1BQU0sT0FBTyxPQUFPO0FBQzdCLFlBQU0sWUFBWSxPQUFPLE1BQU07QUFDL0IsVUFBSSxjQUFjLFFBQVE7QUFDeEIsWUFBSSxlQUFlO0FBQUUsd0JBQWMsYUFBYTtBQUFHLDBCQUFnQjtBQUFBLFFBQU07QUFDekUseUJBQWlCO0FBQUEsTUFDbkI7QUFBQSxJQUNGLE9BQU87QUFDTCxNQUFBQSxLQUFJLEtBQUssK0JBQStCLEVBQUUsT0FBTyxPQUFPLEtBQUssY0FBYyxPQUFPLE1BQU0sUUFBUSxDQUFDO0FBQUEsSUFDbkc7QUFBQSxFQUNGO0FBRUEsV0FBUyxtQkFBeUI7QUFDaEMsVUFBTSxjQUFjLFVBQVU7QUFBQSxNQUFJLE9BQ2hDLG9DQUFvQyxRQUFRLEVBQUUsSUFBSSxJQUFJLHFCQUFxQixPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFFBQVEsS0FBSyxHQUFHLElBQUk7QUFBQSxJQUM1SCxFQUFFLEtBQUssRUFBRTtBQUNULFVBQU0sU0FBUyxTQUFTLGNBQWMsVUFBVTtBQUNoRCxRQUFJLFFBQVE7QUFDVixhQUFPLFlBQ0wsbWlCQUtBLGNBQ0EseU1BQ3NELE9BQU8sU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFFBQVEsS0FBSyxHQUFHLElBQUkscUZBRXRDLFFBQVEsWUFBWSxJQUFJO0FBQUEsSUFHN0Y7QUFBQSxFQUNGO0FBRUEsV0FBUyxrQkFBd0I7QUFwaEJqQztBQXFoQkUsVUFBTSxRQUFRO0FBQ2Qsb0JBQWdCO0FBQ2hCLFFBQUksZUFBZTtBQUFFLG9CQUFjLGFBQWE7QUFBRyxzQkFBZ0I7QUFBQSxJQUFNO0FBQ3pFLFFBQUksc0JBQXNCO0FBQUUsbUJBQWEsb0JBQW9CO0FBQUcsNkJBQXVCO0FBQUEsSUFBTTtBQUM3RixtQkFBUyxlQUFlLGFBQWEsTUFBckMsbUJBQXdDLFVBQVUsT0FBTztBQUN6RCxtQkFBZTtBQUNmLG1CQUFlO0FBQU0sa0JBQWM7QUFBSSxnQkFBWTtBQUFJLGdCQUFZO0FBQ25FLGdCQUFZLENBQUM7QUFBRyxtQkFBZTtBQUMvQixRQUFJLE1BQU8sUUFBTyxLQUFLLG1CQUFtQixZQUFZLFdBQVcsbUJBQW1CLEtBQUssR0FBRyxRQUFRO0FBQUEsRUFDdEc7QUFFQSxXQUFTLFlBQWtCO0FBQ3pCLFFBQUksQ0FBQyxZQUFhO0FBQ2xCLFFBQUksVUFBVSxXQUFXO0FBQ3ZCLGdCQUFVLFVBQVUsVUFBVSxXQUFXLEVBQUUsS0FBSyxNQUFNO0FBQ3BELGNBQU0sTUFBTSxTQUFTLGNBQWMsZUFBZTtBQUNsRCxZQUFJLEtBQUs7QUFBRSxjQUFJLGNBQWM7QUFBcUIscUJBQVcsTUFBTTtBQUFFLGdCQUFJLGNBQWM7QUFBQSxVQUF1QixHQUFHLElBQUk7QUFBQSxRQUFHO0FBQUEsTUFDMUgsQ0FBQztBQUFBLElBQ0gsT0FBTztBQUNMLFlBQU0sS0FBSyxTQUFTLGNBQWMsVUFBVTtBQUM1QyxTQUFHLFFBQVE7QUFDWCxlQUFTLEtBQUssWUFBWSxFQUFFO0FBQzVCLFNBQUcsT0FBTztBQUNWLGVBQVMsWUFBWSxNQUFNO0FBQzNCLGVBQVMsS0FBSyxZQUFZLEVBQUU7QUFBQSxJQUM5QjtBQUFBLEVBQ0Y7QUFFQSxXQUFTLGNBQW9CO0FBampCN0I7QUFrakJFLG9CQUFnQjtBQUNoQixRQUFJLGVBQWU7QUFBRSxvQkFBYyxhQUFhO0FBQUcsc0JBQWdCO0FBQUEsSUFBTTtBQUN6RSxRQUFJLHNCQUFzQjtBQUFFLG1CQUFhLG9CQUFvQjtBQUFHLDZCQUF1QjtBQUFBLElBQU07QUFDN0YsVUFBTSxjQUFhLG9CQUFTLGVBQWUsYUFBYSxNQUFyQyxtQkFBd0MsVUFBVSxTQUFTLGNBQTNELFlBQXdFO0FBQzNGLG1CQUFTLGVBQWUsYUFBYSxNQUFyQyxtQkFBd0MsVUFBVSxPQUFPO0FBQ3pELG1CQUFlO0FBQU0sa0JBQWM7QUFBSSxnQkFBWTtBQUFJLGdCQUFZO0FBQ25FLGdCQUFZLENBQUM7QUFBRyxtQkFBZTtBQUMvQixRQUFJLFdBQVksWUFBVztBQUFBLEVBQzdCO0FBRUEsV0FBUyxjQUFvQjtBQUMzQixnQkFBWTtBQUNaLDRCQUF3QjtBQUFBLEVBQzFCO0FBRUEsV0FBUywwQkFBZ0M7QUFqa0J6QztBQWtrQkUsVUFBTSxRQUFRLFlBQVksU0FBUztBQUNuQyxRQUFJLE1BQU0sV0FBVyxHQUFHO0FBQUUsbUJBQWEsa0JBQWtCLE1BQU07QUFBRztBQUFBLElBQVE7QUFDMUUsVUFBTSxRQUFRLG9CQUFTLGVBQWUsU0FBUyxNQUFqQyxtQkFBeUQsTUFBTSxXQUEvRCxZQUF5RTtBQUN2RixVQUFNLFlBQVksb0JBQVMsZUFBZSxhQUFhLE1BQXJDLG1CQUFnRSxNQUFNLFdBQXRFLFlBQWdGO0FBQ2xHLFVBQU0sUUFBUSxNQUFNLEtBQUssS0FBSyxFQUFFLE9BQU8sQ0FBQyxHQUFHLE1BQU0sSUFBSSxFQUFFLE9BQU8sQ0FBQztBQUMvRCxVQUFNLFNBQVMsTUFBTSxLQUFLLEtBQUssRUFBRSxJQUFJLE9BQUssVUFBSyxFQUFFLElBQUksY0FBUyxFQUFFLE1BQU0sUUFBUSxDQUFDLEVBQUUsUUFBUSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxJQUFJO0FBQ2hILFVBQU0sTUFBTTtBQUFBO0FBQUEsRUFBcUQsTUFBTTtBQUFBO0FBQUEsYUFBa0IsTUFBTSxRQUFRLENBQUMsRUFBRSxRQUFRLEtBQUssR0FBRyxDQUFDO0FBQUE7QUFBQSxZQUFXLElBQUk7QUFBQSxZQUFRLFFBQVE7QUFBQTtBQUFBO0FBQzFKLFdBQU8sS0FBSyxtQkFBbUIsWUFBWSxXQUFXLG1CQUFtQixHQUFHLEdBQUcsUUFBUTtBQUFBLEVBQ3pGO0FBR0EsV0FBUyxnQkFBZ0IsSUFBNEI7QUFDbkQsT0FBRyxRQUFRLHVCQUF1QixHQUFHLEtBQUs7QUFBQSxFQUM1QztBQUVBLFdBQVMsaUJBQWlCLFlBQTJCO0FBQ25ELFVBQU0sZ0JBQWdCLFFBQWMsT0FBTyxVQUFVO0FBQ3JELGlCQUFhLE1BQU0sYUFBYTtBQUVoQyxhQUFTLGVBQWUsY0FBYyxFQUFHLE1BQU0sVUFBVTtBQUN6RCxVQUFNLGFBQWEsU0FBUyxlQUFlLFlBQVk7QUFDdkQsUUFBSSxXQUFZLFlBQVcsTUFBTSxVQUFVO0FBQzNDLFVBQU0sZ0JBQWdCLFNBQVMsZUFBZSxhQUFhO0FBQzNELFFBQUksY0FBZSxlQUFjLGNBQWMsV0FBVztBQUMxRCxVQUFNLFlBQVksU0FBUyxlQUFlLG9CQUFvQjtBQUM5RCxRQUFJLFVBQVcsV0FBVSxNQUFNLFVBQVU7QUFDekMsVUFBTSxhQUFhLFNBQVMsZUFBZSxZQUFZO0FBQ3ZELFFBQUksV0FBWSxZQUFXLGNBQWMsV0FBVyxTQUFTLFFBQVEsMkJBQTJCLFlBQVk7QUFDNUcsVUFBTSxVQUFVLFNBQVMsZUFBZSxTQUFTO0FBQ2pELFFBQUksUUFBUyxTQUFRLFFBQVEsV0FBVztBQUN4QyxVQUFNLGNBQWMsU0FBUyxlQUFlLGFBQWE7QUFDekQsUUFBSSxlQUFlLFdBQVcsU0FBVSxhQUFZLFFBQVEsV0FBVztBQUFBLEVBQ3pFO0FBRUEsaUJBQWUsb0JBQW1DO0FBcG1CbEQ7QUFxbUJFLFFBQUksYUFBYztBQUNsQixVQUFNLFdBQVcsU0FBUyxlQUFlLGVBQWU7QUFDeEQsVUFBTSxPQUFPLFNBQVMsZUFBZSxXQUFXO0FBQ2hELFVBQU0sTUFBTSxTQUFTLGNBQWMsdUJBQXVCO0FBQzFELFFBQUksS0FBTSxNQUFLLE1BQU0sVUFBVTtBQUMvQixRQUFJLEtBQUs7QUFBRSxVQUFJLGNBQWM7QUFBa0IsVUFBSSxXQUFXO0FBQUEsSUFBTTtBQUNwRSxtQkFBZTtBQUNmLFFBQUk7QUFDRixZQUFNLFNBQVMsTUFBTSxhQUFhLFFBQVEsU0FBUyxLQUFLO0FBQ3hELFVBQUksQ0FBQyxPQUFPLElBQUk7QUFDZCxjQUFNLFlBQVksT0FBTyxNQUFNLFNBQVMscUJBQXFCLE9BQU8sTUFBTSxTQUFTO0FBQ25GLGNBQU0sTUFBTSxZQUNSLE9BQU8sTUFBTSxVQUNiO0FBQ0osUUFBQUEsS0FBSSxNQUFNLDRCQUE0QixFQUFFLE9BQU8sT0FBTyxNQUFNLFFBQVEsQ0FBQztBQUNyRSxZQUFJLE1BQU07QUFBRSxlQUFLLGNBQWM7QUFBSyxlQUFLLE1BQU0sVUFBVTtBQUFBLFFBQVM7QUFDbEU7QUFBQSxNQUNGO0FBQ0EsVUFBSSxPQUFPLE1BQU0sVUFBVSxPQUFPLE1BQU0sU0FBUztBQUMvQyx5QkFBaUIsT0FBTyxNQUFNLFFBQVEsT0FBTyxDQUFZO0FBQUEsTUFDM0QsT0FBTztBQUNMLGNBQU0sV0FBVyxTQUFTLGVBQWUsZUFBZTtBQUN4RCxjQUFNLFdBQVcsU0FBUyxlQUFlLGVBQWU7QUFDeEQsWUFBSSxTQUFVLFVBQVMsTUFBTSxVQUFVO0FBQ3ZDLFlBQUksU0FBVSxVQUFTLE1BQU0sVUFBVTtBQUN2QyxRQUFDLFNBQTBELFFBQVEsS0FBSyxJQUFJLFNBQVMsTUFBTSxRQUFRLE9BQU8sRUFBRTtBQUM1Ryx1QkFBUyxlQUFlLFdBQVcsTUFBbkMsbUJBQXNDO0FBQUEsTUFDeEM7QUFBQSxJQUNGLFNBQVE7QUFDTixVQUFJLE1BQU07QUFBRSxhQUFLLGNBQWM7QUFBcUQsYUFBSyxNQUFNLFVBQVU7QUFBQSxNQUFTO0FBQUEsSUFDcEgsVUFBRTtBQUNBLFVBQUksS0FBSztBQUFFLFlBQUksY0FBYztBQUFlLFlBQUksV0FBVztBQUFBLE1BQU87QUFDbEUscUJBQWU7QUFBQSxJQUNqQjtBQUFBLEVBQ0Y7QUFFQSxpQkFBZSxZQUEyQjtBQXpvQjFDO0FBMG9CRSxRQUFJLGFBQWM7QUFDbEIsVUFBTSxZQUFZLFNBQVMsZUFBZSxXQUFXO0FBQ3JELFVBQU0sV0FBVyxTQUFTLGVBQWUsZUFBZTtBQUN4RCxVQUFNLE9BQU8sVUFBVTtBQUN2QixVQUFNLE9BQU8sY0FBMEQsUUFBUSxLQUFLLE1BQXZFLFlBQTRFO0FBQ3pGLFVBQU0sT0FBTyxTQUFTLGVBQWUsY0FBYztBQUNuRCxRQUFJLENBQUMsS0FBSyxLQUFLLEdBQUc7QUFDaEIsVUFBSSxNQUFNO0FBQUUsYUFBSyxjQUFjO0FBQW9CLGFBQUssTUFBTSxVQUFVO0FBQUEsTUFBUztBQUNqRjtBQUFBLElBQ0Y7QUFDQSxRQUFJLEtBQU0sTUFBSyxNQUFNLFVBQVU7QUFDL0IsVUFBTSxNQUFNLFNBQVMsY0FBYyx1QkFBdUI7QUFDMUQsUUFBSSxLQUFLO0FBQUUsVUFBSSxjQUFjO0FBQWUsVUFBSSxXQUFXO0FBQUEsSUFBTTtBQUNqRSxtQkFBZTtBQUNmLFFBQUk7QUFDRixZQUFNLFNBQVMsTUFBTSxhQUFhLFNBQVMsTUFBTSxLQUFLLEVBQUU7QUFDeEQsVUFBSSxDQUFDLE9BQU8sSUFBSTtBQUNkLGNBQU0sWUFBWSxPQUFPLE1BQU0sU0FBUyxxQkFBcUIsT0FBTyxNQUFNLFNBQVM7QUFDbkYsY0FBTSxjQUFjLFlBQVksT0FBTyxNQUFNLFVBQVU7QUFDdkQsWUFBSSxNQUFNO0FBQUUsZUFBSyxjQUFjO0FBQWEsZUFBSyxNQUFNLFVBQVU7QUFBQSxRQUFTO0FBQzFFO0FBQUEsTUFDRjtBQUNBLHVCQUFpQixPQUFPLE1BQU0sT0FBTyxDQUFZO0FBQUEsSUFDbkQsU0FBUTtBQUNOLFVBQUksTUFBTTtBQUFFLGFBQUssY0FBYztBQUErRCxhQUFLLE1BQU0sVUFBVTtBQUFBLE1BQVM7QUFBQSxJQUM5SCxVQUFFO0FBQ0EsVUFBSSxLQUFLO0FBQUUsWUFBSSxjQUFjO0FBQXdCLFlBQUksV0FBVztBQUFBLE1BQU87QUFDM0UscUJBQWU7QUFBQSxJQUNqQjtBQUFBLEVBQ0Y7QUFFQSxXQUFTLHNCQUE0QjtBQUNuQyxVQUFNLFdBQVcsU0FBUyxlQUFlLGVBQWU7QUFDeEQsVUFBTSxXQUFXLFNBQVMsZUFBZSxlQUFlO0FBQ3hELFFBQUksU0FBVSxVQUFTLE1BQU0sVUFBVTtBQUN2QyxRQUFJLFNBQVUsVUFBUyxNQUFNLFVBQVU7QUFBQSxFQUN6QztBQUVBLFdBQVMsT0FBYTtBQUNwQixRQUFJLENBQUMsUUFBUSwyQkFBMkIsRUFBRztBQUMzQyxpQkFBYSxPQUFPO0FBQ3BCLFVBQU0sYUFBYSxTQUFTLGVBQWUsWUFBWTtBQUN2RCxRQUFJLFdBQVksWUFBVyxNQUFNLFVBQVU7QUFDM0MsSUFBQyxTQUFTLGVBQWUsU0FBUyxFQUF1QixRQUFRO0FBQ2pFLElBQUMsU0FBUyxlQUFlLGFBQWEsRUFBMEIsUUFBUTtBQUN4RSxJQUFDLFNBQVMsZUFBZSxlQUFlLEVBQXVCLFFBQVE7QUFDdkUsVUFBTSxXQUFXLFNBQVMsZUFBZSxlQUFlO0FBQ3hELFVBQU0sV0FBVyxTQUFTLGVBQWUsZUFBZTtBQUN4RCxRQUFJLFNBQVUsVUFBUyxNQUFNLFVBQVU7QUFDdkMsUUFBSSxTQUFVLFVBQVMsTUFBTSxVQUFVO0FBQ3ZDLGFBQVMsZUFBZSxjQUFjLEVBQUcsTUFBTSxVQUFVO0FBQUEsRUFDM0Q7QUFFQSxXQUFTLGVBQXFCO0FBQzVCLGFBQVMsZUFBZSxjQUFjLEVBQUcsTUFBTSxVQUFVO0FBQ3pELGVBQVcsTUFBRztBQWpzQmhCO0FBaXNCb0IsNEJBQVMsZUFBZSxlQUFlLE1BQXZDLG1CQUErRDtBQUFBLE9BQVMsR0FBRztBQUFBLEVBQy9GO0FBR0EsaUJBQWUsY0FBNkI7QUFyc0I1QztBQXNzQkUsVUFBTSxLQUFLLFNBQVMsZUFBZSxnQkFBZ0I7QUFDbkQsUUFBSSxDQUFDLEdBQUk7QUFDVCxPQUFHLFVBQVUsSUFBSSxRQUFRO0FBQ3pCLGFBQVMsS0FBSyxVQUFVLElBQUksY0FBYztBQUMxQyxhQUFTLGVBQWUsaUJBQWlCLEVBQUcsWUFBWTtBQUN4RCxhQUFTLGVBQWUsZUFBZSxFQUFHLE1BQU0sVUFBVTtBQUMxRCxhQUFTLGVBQWUsaUJBQWlCLEVBQUcsTUFBTSxVQUFVO0FBQzVELGFBQVMsZUFBZSxrQkFBa0IsRUFBRyxNQUFNLFVBQVU7QUFDN0QsYUFBUyxlQUFlLHFCQUFxQixFQUFHLE1BQU0sVUFBVTtBQUNoRSxhQUFTLGVBQWUsb0JBQW9CLEVBQUcsTUFBTSxVQUFVO0FBQy9ELGFBQVMsZUFBZSxlQUFlLEVBQUcsTUFBTSxVQUFVO0FBQzFELGFBQVMsZUFBZSxpQkFBaUIsRUFBRyxVQUFVLE9BQU8sU0FBUztBQUV0RSxVQUFNLE1BQU0sTUFBTSxlQUFxQjtBQUN2QyxVQUFNLFVBQVUsV0FBVztBQUUzQixVQUFNLE9BQU8sU0FBUyxlQUFlLG1CQUFtQjtBQUN4RCxRQUFJLE1BQU07QUFDUixZQUFNLFNBQVMsQ0FBQyxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sV0FBSTtBQUNwRSxXQUFLLFlBQVksUUFBUSxJQUFJLENBQUMsR0FBRyxNQUFNLG1DQUFtQyxPQUFPLElBQUksT0FBTyxNQUFNLENBQUMsSUFBSSxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFO0FBQUEsSUFDcEk7QUFFQSxRQUFJLE9BQU8sQ0FBQyxJQUFJLE9BQU87QUFDckIsZUFBUyxlQUFlLGVBQWUsRUFBRyxNQUFNLFVBQVU7QUFDMUQsZUFBUyxlQUFlLGtCQUFrQixFQUFHLE1BQU0sVUFBVTtBQUFBLElBQy9EO0FBRUEsbUJBQWUsT0FBTztBQUN0QixhQUFTLGVBQWUsb0JBQW9CLEVBQUcsTUFBTSxVQUFVO0FBRS9ELFVBQU0sZUFBZSxnQkFBZ0I7QUFDckMsUUFBSSxDQUFDLGNBQWM7QUFDakIsZUFBUyxlQUFlLGlCQUFpQixFQUFHLE1BQU0sVUFBVTtBQUM1RCxlQUFTLGVBQWUsa0JBQWtCLEVBQUcsTUFBTSxVQUFVO0FBQzdELFlBQU0sV0FBVyxTQUFTLGVBQWUsZ0JBQWdCO0FBQ3pELFVBQUksVUFBVTtBQUFFLGlCQUFTLFdBQVc7QUFBTyxpQkFBUyxNQUFNLFVBQVU7QUFBSyxpQkFBUyxjQUFjO0FBQUEsTUFBbUI7QUFDbkg7QUFBQSxJQUNGO0FBRUEsVUFBTSxTQUFTLE1BQU0saUJBQXNCLGtCQUFhLE9BQWIsWUFBbUIsQ0FBQztBQUMvRCxzQkFBa0IsTUFBTTtBQUFBLEVBQzFCO0FBRUEsV0FBUyxlQUFxQjtBQWp2QjlCO0FBa3ZCRSxtQkFBUyxlQUFlLGdCQUFnQixNQUF4QyxtQkFBMkMsVUFBVSxPQUFPO0FBQzVELGFBQVMsS0FBSyxVQUFVLE9BQU8sY0FBYztBQUFBLEVBQy9DO0FBRUEsV0FBUyxxQkFBcUIsR0FBZ0I7QUFDNUMsUUFBSyxFQUFFLE9BQXVCLE9BQU8saUJBQWtCLGNBQWE7QUFBQSxFQUN0RTtBQUVBLFdBQVMsa0JBQWtCLE1BQWlDO0FBQzFELFVBQU0sWUFBWSxTQUFTLGVBQWUsaUJBQWlCO0FBQzNELFVBQU0sYUFBYSxTQUFTLGVBQWUsa0JBQWtCO0FBQzdELFVBQU0sWUFBWSxTQUFTLGVBQWUscUJBQXFCO0FBQy9ELFVBQU0sZUFBZSxTQUFTLGVBQWUsb0JBQW9CO0FBQ2pFLFVBQU0sVUFBVSxTQUFTLGVBQWUsZUFBZTtBQUN2RCxVQUFNLFdBQVcsU0FBUyxlQUFlLGdCQUFnQjtBQUV6RCxpQkFBYSxNQUFNLFVBQVU7QUFDN0IsbUJBQWUsV0FBVyxDQUFDO0FBRTNCLFFBQUksYUFBYSxTQUFTLFNBQVMsRUFBRSxPQUFPLEdBQUc7QUFDN0MsVUFBSSxVQUFVO0FBQUUsaUJBQVMsV0FBVztBQUFPLGlCQUFTLE1BQU0sVUFBVTtBQUFLLGlCQUFTLGNBQWM7QUFBQSxNQUFtQjtBQUNuSCxnQkFBVSxZQUFZO0FBQ3RCLGlCQUFXLE1BQU0sVUFBVTtBQUMzQixnQkFBVSxNQUFNLFVBQVU7QUFDMUIsY0FBUSxNQUFNLFVBQVU7QUFDeEI7QUFBQSxJQUNGO0FBRUEsUUFBSSxDQUFDLE1BQU07QUFDVCxnQkFBVSxZQUFZO0FBQ3RCLGlCQUFXLE1BQU0sVUFBVTtBQUMzQixnQkFBVSxNQUFNLFVBQVU7QUFDMUIsY0FBUSxNQUFNLFVBQVU7QUFDeEIsVUFBSSxVQUFVO0FBQUUsaUJBQVMsV0FBVztBQUFNLGlCQUFTLE1BQU0sVUFBVTtBQUFPLGlCQUFTLFFBQVE7QUFBQSxNQUEyQztBQUN0STtBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssV0FBVyxZQUFZO0FBQzlCLGdCQUFVLFlBQVk7QUFDdEIsaUJBQVcsTUFBTSxVQUFVO0FBQVMsZ0JBQVUsTUFBTSxVQUFVO0FBQVEsY0FBUSxNQUFNLFVBQVU7QUFDOUYsVUFBSSxVQUFVO0FBQUUsaUJBQVMsV0FBVztBQUFNLGlCQUFTLE1BQU0sVUFBVTtBQUFPLGlCQUFTLFFBQVE7QUFBQSxNQUF3QjtBQUFBLElBQ3JILFdBQVcsS0FBSyxXQUFXLGFBQWE7QUFDdEMsZ0JBQVUsWUFBWTtBQUN0QixpQkFBVyxNQUFNLFVBQVU7QUFBUyxnQkFBVSxNQUFNLFVBQVU7QUFBUyxjQUFRLE1BQU0sVUFBVTtBQUMvRixVQUFJLFVBQVU7QUFBRSxpQkFBUyxXQUFXO0FBQU0saUJBQVMsTUFBTSxVQUFVO0FBQUEsTUFBTztBQUFBLElBQzVFLFdBQVcsS0FBSyxXQUFXLGNBQWMsQ0FBQyxLQUFLLFVBQVU7QUFDdkQsWUFBTSxRQUFPLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNsRCxZQUFNLGVBQWUsS0FBSyxpQkFBaUIsS0FBSyxlQUFlLE1BQU0sR0FBRyxFQUFFLENBQUMsSUFBSTtBQUMvRSxVQUFJLGlCQUFpQixNQUFNO0FBQ3pCLGtCQUFVLFlBQVk7QUFDdEIsbUJBQVcsTUFBTSxVQUFVO0FBQVEsa0JBQVUsTUFBTSxVQUFVO0FBQVMsZ0JBQVEsTUFBTSxVQUFVO0FBQzlGLFlBQUksVUFBVTtBQUFFLG1CQUFTLFdBQVc7QUFBTSxtQkFBUyxNQUFNLFVBQVU7QUFBTyxtQkFBUyxjQUFjO0FBQUEsUUFBcUI7QUFBQSxNQUN4SCxPQUFPO0FBQ0wsa0JBQVUsWUFBWTtBQUN0QixtQkFBVyxNQUFNLFVBQVU7QUFBUSxrQkFBVSxNQUFNLFVBQVU7QUFBUSxnQkFBUSxNQUFNLFVBQVU7QUFDN0YsWUFBSSxVQUFVO0FBQUUsbUJBQVMsV0FBVztBQUFPLG1CQUFTLE1BQU0sVUFBVTtBQUFLLG1CQUFTLGNBQWM7QUFBQSxRQUFtQjtBQUFBLE1BQ3JIO0FBQUEsSUFDRixXQUFXLEtBQUssWUFBWSxDQUFDLGFBQWEsU0FBUyxTQUFTLEVBQUUsT0FBTyxHQUFHO0FBQ3RFLGdCQUFVLFlBQVk7QUFDdEIsaUJBQVcsTUFBTSxVQUFVO0FBQVEsZ0JBQVUsTUFBTSxVQUFVO0FBQVEsY0FBUSxNQUFNLFVBQVU7QUFDN0YsVUFBSSxVQUFVO0FBQUUsaUJBQVMsV0FBVztBQUFNLGlCQUFTLE1BQU0sVUFBVTtBQUFBLE1BQU87QUFDMUUsWUFBTSxXQUFXLFNBQVMsZUFBZSxxQkFBcUI7QUFDOUQsVUFBSSxVQUFVO0FBQ1osaUJBQVMsWUFBWSxLQUFLLFNBQ3RCLDBEQUF1RCxRQUFRLEtBQUssTUFBTSxJQUFJLHVEQUM5RTtBQUFBLE1BQ047QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUVBLGlCQUFlLGNBQTZCO0FBeHpCNUM7QUF5ekJFLFVBQU0sZUFBZSxnQkFBZ0I7QUFDckMsUUFBSSxDQUFDLGNBQWM7QUFBRSxtQkFBYSxzQ0FBbUMsTUFBTTtBQUFHO0FBQUEsSUFBUTtBQUV0RixVQUFNLGFBQWEsTUFBTSxpQkFBc0Isa0JBQWEsT0FBYixZQUFtQixDQUFDO0FBQ25FLFFBQUksQ0FBQyxhQUFhLFNBQVMsU0FBUyxFQUFFLE9BQU8sR0FBRztBQUM5QyxVQUFJLENBQUMsY0FBYyxXQUFXLFdBQVcsY0FBYyxXQUFXLFVBQVU7QUFDMUUscUJBQWEsNERBQXlELE1BQU07QUFDNUU7QUFBQSxNQUNGO0FBQ0EsVUFBSTtBQUNGLGNBQU0sU0FBUyxlQUFlO0FBQzlCLGNBQU0sY0FBYyxNQUFNLGlCQUFpQixzQkFBc0IsTUFBTTtBQUN2RSxjQUFNLGtCQUFrQixZQUFZLEtBQUssWUFBWSxRQUFRO0FBRTdELGNBQU0sT0FBTyxNQUFNLE1BQU0sR0FBRyxZQUFZLCtEQUErRDtBQUFBLFVBQ3JHLFNBQVMsRUFBRSxVQUFVLGVBQWUsaUJBQWlCLFlBQVksY0FBYztBQUFBLFFBQ2pGLENBQUM7QUFDRCxjQUFNLE1BQU0sTUFBTSxLQUFLLEtBQUs7QUFDNUIsY0FBTSxVQUFTLGVBQUksQ0FBQyxNQUFMLG1CQUFRLDBCQUFSLFlBQWlDO0FBQ2hELFlBQUksbUJBQW1CLFFBQVE7QUFDN0IsZ0JBQU0sTUFBTSxTQUFTLGVBQWUsZ0JBQWdCO0FBQ3BELGNBQUksS0FBSztBQUFFLGdCQUFJLFdBQVc7QUFBTSxnQkFBSSxNQUFNLFVBQVU7QUFBQSxVQUFPO0FBQzNELGdCQUFNLFdBQVcsU0FBUyxlQUFlLGlCQUFpQjtBQUMxRCxjQUFJLFVBQVU7QUFDWixxQkFBUyxZQUFZO0FBQ3JCLHFCQUFTLFVBQVUsSUFBSSxTQUFTO0FBQUEsVUFDbEM7QUFDQTtBQUFBLFFBQ0Y7QUFBQSxNQUNGLFNBQVMsR0FBRztBQUFFLFFBQUFBLEtBQUksS0FBSyxvQ0FBb0MsRUFBRSxPQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUM7QUFBQSxNQUFHO0FBQUEsSUFDcEY7QUFFQSxVQUFNLE1BQWMsY0FBYyxDQUFDLFdBQW1CO0FBQ3BELFlBQU0sV0FBVyxTQUFTLGVBQWUsaUJBQWlCO0FBQzFELFVBQUksVUFBVTtBQUNaLGlCQUFTLFlBQVksaUVBQXVELFFBQVEsTUFBTSxJQUFJO0FBQzlGLGlCQUFTLFVBQVUsSUFBSSxTQUFTO0FBQUEsTUFDbEM7QUFDQSxZQUFNLE1BQU0sU0FBUyxlQUFlLGdCQUFnQjtBQUNwRCxVQUFJLElBQUssS0FBSSxjQUFjO0FBQzNCLHFCQUFlLGNBQWMsTUFBTSxFQUFFLE1BQU0sUUFBUSxLQUFLO0FBQUEsSUFDMUQsQ0FBQztBQUFBLEVBQ0g7QUFFQSxpQkFBZSx1QkFBc0M7QUFyMkJyRDtBQXMyQkUsVUFBTSxlQUFlLGdCQUFnQjtBQUNyQyxRQUFJLENBQUMsY0FBYztBQUFFLFlBQU0sNENBQXlDO0FBQUc7QUFBQSxJQUFRO0FBQy9FLFVBQU0sY0FBYyxNQUFNLGlCQUFzQixrQkFBYSxPQUFiLFlBQW1CLENBQUM7QUFDcEUsUUFBSSxnQkFBZ0IsWUFBWSxXQUFXLGNBQWMsWUFBWSxXQUFXLGFBQWE7QUFDM0Ysd0JBQWtCLFdBQVc7QUFDN0I7QUFBQSxJQUNGO0FBQ0EsVUFBTSxPQUFPLGFBQWEsUUFBUTtBQUNsQyxVQUFNLE1BQU0sYUFBYSxZQUFZO0FBQ3JDLFVBQU0sU0FBUyxTQUFTLGVBQWUsc0JBQXNCO0FBQzdELFVBQU0sWUFBWSxTQUFTLE9BQU8sTUFBTSxLQUFLLElBQUk7QUFDakQsVUFBTSxNQUFNLHlFQUFzRSxtQkFBbUIsSUFBSSxJQUN2RyxrQkFBa0IsbUJBQW1CLEdBQUcsS0FDdkMsWUFBWSxtQkFBbUIsbUJBQW1CLFNBQVMsSUFBSSxNQUNoRTtBQUNGLFdBQU8sS0FBSyxtQkFBbUIsWUFBWSxXQUFXLEtBQUssUUFBUTtBQUNuRSxVQUFNLHNCQUFzQixTQUFTO0FBQ3JDLHNCQUFrQixFQUFFLFFBQVEsWUFBWSxVQUFVLE1BQU0sQ0FBaUI7QUFBQSxFQUMzRTtBQUVBLGlCQUFlLHNCQUFzQixXQUFrQztBQTEzQnZFO0FBMjNCRSxVQUFNLGVBQWUsZ0JBQWdCO0FBQ3JDLFFBQUksQ0FBQyxhQUFjO0FBQ25CLFFBQUk7QUFDRixZQUFNLFFBQVEsTUFBTSxpQkFBc0Isa0JBQWEsT0FBYixZQUFtQixDQUFDO0FBQzlELFVBQUksU0FBUyxNQUFNLFdBQVcsWUFBYTtBQUMzQyxZQUFNLFNBQVMsZUFBZTtBQUM5QixZQUFNLFNBQVMsTUFBTSxpQkFBaUIsaUJBQWlCO0FBQUEsUUFDckQsTUFBTSxhQUFhO0FBQUEsUUFDbkIsVUFBVSxhQUFhO0FBQUEsUUFDdkIsV0FBVyxhQUFhO0FBQUEsUUFDeEIsUUFBUTtBQUFBLFFBQ1I7QUFBQSxRQUNBLFVBQVU7QUFBQSxRQUNWLGFBQVksb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFBQSxNQUNyQyxDQUFnRDtBQUNoRCxVQUFJLE9BQU8sSUFBSTtBQUNiLDBCQUFrQixPQUFPLE1BQU0sRUFBRTtBQUFBLE1BQ25DO0FBQUEsSUFDRixTQUFTLEdBQUc7QUFBRSxNQUFBQSxLQUFJLEtBQUssd0NBQWtDLEVBQUUsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDO0FBQUEsSUFBRztBQUFBLEVBQ2xGO0FBR0EsV0FBUyxpQkFBMEI7QUFDakMsV0FBTyxTQUFTLFNBQVMsRUFBRTtBQUFBLEVBQzdCO0FBRUEsaUJBQWUsbUJBQWtDO0FBcjVCakQ7QUFzNUJFLFFBQUksQ0FBQyxlQUFlLEdBQUc7QUFBRSxZQUFNLGtCQUFrQjtBQUFHO0FBQUEsSUFBUTtBQUM1RCxtQkFBUyxlQUFlLHFCQUFxQixNQUE3QyxtQkFBZ0QsVUFBVSxJQUFJO0FBQzlELFVBQU0sNEJBQTRCO0FBQ2xDLFVBQU0sb0JBQW9CO0FBQUEsRUFDNUI7QUFFQSxXQUFTLG9CQUEwQjtBQTU1Qm5DO0FBNjVCRSxtQkFBUyxlQUFlLHFCQUFxQixNQUE3QyxtQkFBZ0QsVUFBVSxPQUFPO0FBQUEsRUFDbkU7QUFFQSxXQUFTLDBCQUEwQixHQUFnQjtBQUNqRCxRQUFLLEVBQUUsT0FBdUIsT0FBTyxzQkFBdUIsbUJBQWtCO0FBQUEsRUFDaEY7QUFFQSxXQUFTLGNBQWMsS0FBYSxLQUF3QjtBQXA2QjVEO0FBcTZCRSxhQUFTLGlCQUFpQixtQkFBbUIsRUFBRSxRQUFRLE9BQUssRUFBRSxVQUFVLE9BQU8sT0FBTyxDQUFDO0FBQ3ZGLGFBQVMsaUJBQWlCLHFCQUFxQixFQUFFLFFBQVEsT0FBSyxFQUFFLFVBQVUsT0FBTyxPQUFPLENBQUM7QUFDekYsUUFBSSxVQUFVLElBQUksT0FBTztBQUN6QixVQUFNLFFBQVEsUUFBUSxJQUFJLE9BQU8sQ0FBQyxFQUFFLFlBQVksSUFBSSxJQUFJLE1BQU0sQ0FBQztBQUMvRCxtQkFBUyxlQUFlLEtBQUssTUFBN0IsbUJBQWdDLFVBQVUsSUFBSTtBQUM5QyxRQUFJLFFBQVEsWUFBYSw2QkFBNEI7QUFBQSxhQUM1QyxRQUFRLFlBQWEseUJBQXdCO0FBQUEsYUFDN0MsUUFBUSxhQUFjLDBCQUF5QjtBQUFBLGFBQy9DLFFBQVEsU0FBVSxxQkFBb0I7QUFBQSxFQUNqRDtBQUVBLGlCQUFlLDhCQUE2QztBQUMxRCxVQUFNLEtBQUssU0FBUyxlQUFlLGdCQUFnQjtBQUNuRCxRQUFJLENBQUMsR0FBSTtBQUNULE9BQUcsWUFBWTtBQUNmLFFBQUk7QUFDRixZQUFNLElBQUksTUFBTSxNQUFNLGVBQWUsMEVBQTBFO0FBQUEsUUFDN0csU0FBUyxFQUFFLFVBQVUsZUFBZSxpQkFBaUIsWUFBWSxjQUFjO0FBQUEsTUFDakYsQ0FBQztBQUNELFlBQU0sT0FBTyxNQUFNLEVBQUUsS0FBSztBQUMxQixVQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssUUFBUTtBQUFFLFdBQUcsWUFBWTtBQUFpRTtBQUFBLE1BQVE7QUFDckgsU0FBRyxZQUFZLEtBQUssSUFBSSxPQUFLO0FBMTdCakM7QUEyN0JNLGNBQU0sS0FBSyxJQUFJLEtBQUssRUFBRSxVQUFVLEVBQUUsZUFBZSxPQUFPO0FBQ3hELGVBQU8sdUhBRXNDLFNBQVEsT0FBRSxTQUFGLFlBQVUsRUFBRSxJQUFJLGdEQUN6QixRQUFRLEVBQUUsUUFBUSxLQUFLLEVBQUUsWUFBWSxZQUFTLFFBQVEsRUFBRSxTQUFTLElBQUksTUFBTSxrREFDekUsS0FBSyxpSEFHYSxFQUFFLEtBQUssZ0dBQ0wsRUFBRSxLQUFLO0FBQUEsTUFFM0UsQ0FBQyxFQUFFLEtBQUssRUFBRTtBQUFBLElBQ1osU0FBUTtBQUFFLFNBQUcsWUFBWTtBQUFBLElBQXFEO0FBQUEsRUFDaEY7QUFFQSxpQkFBZSwwQkFBeUM7QUFDdEQsVUFBTSxLQUFLLFNBQVMsZUFBZSxnQkFBZ0I7QUFDbkQsUUFBSSxDQUFDLEdBQUk7QUFDVCxPQUFHLFlBQVk7QUFDZixRQUFJO0FBQ0YsWUFBTSxJQUFJLE1BQU0sTUFBTSxlQUFlLDhFQUE4RTtBQUFBLFFBQ2pILFNBQVMsRUFBRSxVQUFVLGVBQWUsaUJBQWlCLFlBQVksY0FBYztBQUFBLE1BQ2pGLENBQUM7QUFDRCxZQUFNLE9BQU8sTUFBTSxFQUFFLEtBQUs7QUFDMUIsVUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFFBQVE7QUFBRSxXQUFHLFlBQVk7QUFBMEQ7QUFBQSxNQUFRO0FBQzlHLFNBQUcsWUFBWSxLQUFLLElBQUksT0FBSztBQXA5QmpDO0FBcTlCTSxjQUFNLEtBQUssRUFBRSxpQkFBaUIsSUFBSSxLQUFLLEVBQUUsY0FBYyxFQUFFLGVBQWUsT0FBTyxJQUFJO0FBQ25GLGNBQU0sUUFBUSxFQUFFLFdBQVcseUJBQWUsU0FBUSxPQUFFLFdBQUYsWUFBWSxFQUFFLElBQUk7QUFDcEUsZUFBTyx1SEFFc0MsU0FBUSxPQUFFLFNBQUYsWUFBVSxFQUFFLElBQUksZ0RBQ3pCLFFBQVEsRUFBRSxRQUFRLElBQUkscURBQ2pCLFFBQVEsK0RBQ0UsS0FBSztBQUFBLE1BRWxFLENBQUMsRUFBRSxLQUFLLEVBQUU7QUFBQSxJQUNaLFNBQVE7QUFBRSxTQUFHLFlBQVk7QUFBQSxJQUFxRDtBQUFBLEVBQ2hGO0FBRUEsaUJBQWUsb0JBQW9CLElBQVksS0FBdUM7QUFsK0J0RjtBQW0rQkUsUUFBSSxXQUFXO0FBQU0sUUFBSSxjQUFjO0FBQ3ZDLFVBQU0sZUFBZSxnQkFBZ0I7QUFDckMsUUFBSTtBQUNGLFlBQU0sSUFBSSxNQUFNLE1BQU0sZUFBZSx5Q0FBeUMsSUFBSTtBQUFBLFFBQ2hGLFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxVQUNQLGdCQUFnQjtBQUFBLFVBQW9CLFVBQVU7QUFBQSxVQUM5QyxpQkFBaUIsWUFBWTtBQUFBLFVBQWUsVUFBVTtBQUFBLFFBQ3hEO0FBQUEsUUFDQSxNQUFNLEtBQUssVUFBVTtBQUFBLFVBQ25CLFFBQVE7QUFBQSxVQUNSLGlCQUFnQixvQkFBSSxLQUFLLEdBQUUsWUFBWTtBQUFBLFVBQ3ZDLGNBQWMsZUFBZSxhQUFhLE9BQU87QUFBQSxRQUNuRCxDQUFDO0FBQUEsTUFDSCxDQUFDO0FBQ0QsVUFBSSxDQUFDLEVBQUUsR0FBSSxPQUFNLElBQUksTUFBTSxZQUFZLEVBQUUsTUFBTTtBQUMvQyxnQkFBSSxRQUFRLDJCQUEyQixNQUF2QyxtQkFBMEM7QUFBQSxJQUM1QyxTQUFRO0FBQ04sVUFBSSxXQUFXO0FBQU8sVUFBSSxjQUFjO0FBQ3hDLFlBQU0sa0JBQWtCO0FBQUEsSUFDMUI7QUFBQSxFQUNGO0FBRUEsaUJBQWUscUJBQXFCLElBQVksS0FBdUM7QUExL0J2RjtBQTIvQkUsUUFBSSxDQUFDLFFBQVEsbUNBQTZCLEVBQUc7QUFDN0MsUUFBSSxXQUFXO0FBQU0sUUFBSSxjQUFjO0FBQ3ZDLFFBQUk7QUFDRixZQUFNLElBQUksTUFBTSxNQUFNLGVBQWUseUNBQXlDLElBQUk7QUFBQSxRQUNoRixRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsVUFDUCxnQkFBZ0I7QUFBQSxVQUFvQixVQUFVO0FBQUEsVUFDOUMsaUJBQWlCLFlBQVk7QUFBQSxVQUFlLFVBQVU7QUFBQSxRQUN4RDtBQUFBLFFBQ0EsTUFBTSxLQUFLLFVBQVUsRUFBRSxRQUFRLFlBQVksQ0FBQztBQUFBLE1BQzlDLENBQUM7QUFDRCxVQUFJLENBQUMsRUFBRSxHQUFJLE9BQU0sSUFBSSxNQUFNLFlBQVksRUFBRSxNQUFNO0FBQy9DLGdCQUFJLFFBQVEsMkJBQTJCLE1BQXZDLG1CQUEwQztBQUFBLElBQzVDLFNBQVE7QUFDTixVQUFJLFdBQVc7QUFBTyxVQUFJLGNBQWM7QUFDeEMsWUFBTSxtQkFBbUI7QUFBQSxJQUMzQjtBQUFBLEVBQ0Y7QUFFQSxpQkFBZSwyQkFBMEM7QUFDdkQsVUFBTSxLQUFLLFNBQVMsZUFBZSxpQkFBaUI7QUFDcEQsUUFBSSxDQUFDLEdBQUk7QUFDVCxPQUFHLFlBQVk7QUFDZixRQUFJO0FBQ0YsWUFBTSxJQUFJLE1BQU0sTUFBTSxlQUFlLHNEQUFzRDtBQUFBLFFBQ3pGLFNBQVMsRUFBRSxVQUFVLGVBQWUsaUJBQWlCLFlBQVksY0FBYztBQUFBLE1BQ2pGLENBQUM7QUFDRCxZQUFNLE9BQU8sTUFBTSxFQUFFLEtBQUs7QUFDMUIsVUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFFBQVE7QUFBRSxXQUFHLFlBQVk7QUFBMEQ7QUFBQSxNQUFRO0FBQzlHLFNBQUcsWUFBWSxLQUFLLElBQUksT0FBSztBQXhoQ2pDO0FBeWhDTSxjQUFNLEtBQUssSUFBSSxLQUFLLEVBQUUsWUFBWSxFQUFFLGVBQWUsT0FBTztBQUMxRCxlQUFPLG1GQUNxQyxTQUFRLE9BQUUsU0FBRixZQUFVLFFBQUcsSUFBSSx5REFDdkIsUUFBUSxFQUFFLE1BQU0sSUFBSSw2Q0FDekIsU0FBUSxPQUFFLGFBQUYsWUFBYyxFQUFFLElBQUksa0JBQWUsU0FBUSxPQUFFLFdBQUYsWUFBWSxFQUFFLElBQUksV0FBUSxLQUFLO0FBQUEsTUFFN0gsQ0FBQyxFQUFFLEtBQUssRUFBRTtBQUFBLElBQ1osU0FBUTtBQUFFLFNBQUcsWUFBWTtBQUFBLElBQXFEO0FBQUEsRUFDaEY7QUFFQSxpQkFBZSxzQkFBcUM7QUFDbEQsUUFBSTtBQUNGLFlBQU0sSUFBSSxNQUFNLE1BQU0sZUFBZSwwQ0FBMEM7QUFBQSxRQUM3RSxTQUFTLEVBQUUsVUFBVSxlQUFlLGlCQUFpQixZQUFZLGNBQWM7QUFBQSxNQUNqRixDQUFDO0FBQ0QsWUFBTSxPQUFPLE1BQU0sRUFBRSxLQUFLO0FBQzFCLFVBQUksUUFBUSxLQUFLLENBQUMsR0FBRztBQUNuQixRQUFDLFNBQVMsZUFBZSxhQUFhLEVBQXVCLFVBQVUsS0FBSyxDQUFDLEVBQUc7QUFDaEYsY0FBTSxVQUFVLE1BQU0sUUFBUSxLQUFLLENBQUMsRUFBRyxPQUFPLElBQUksS0FBSyxDQUFDLEVBQUcsVUFBVSxpQkFBaUI7QUFDdEYsUUFBQyxTQUFTLGVBQWUsZUFBZSxFQUEwQixRQUFRLFFBQVEsS0FBSyxJQUFJO0FBQUEsTUFDN0Y7QUFBQSxJQUNGLFNBQVMsR0FBRztBQUFFLE1BQUFBLEtBQUksS0FBSyxpQ0FBaUMsRUFBRSxPQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUM7QUFBQSxJQUFHO0FBQUEsRUFDakY7QUFFQSxpQkFBZSxxQkFBb0M7QUFDakQsVUFBTSxRQUFTLFNBQVMsZUFBZSxhQUFhLEVBQXVCO0FBQzNFLFVBQU0sYUFBYyxTQUFTLGVBQWUsZUFBZSxFQUEwQjtBQUNyRixVQUFNLFVBQVUsV0FBVyxNQUFNLElBQUksRUFBRSxJQUFJLE9BQUssRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLE9BQUssRUFBRSxTQUFTLENBQUM7QUFDbEYsVUFBTSxRQUFRLFNBQVMsZUFBZSxXQUFXO0FBQ2pELFFBQUk7QUFDRixZQUFNLElBQUksTUFBTSxNQUFNLGVBQWUsa0NBQWtDO0FBQUEsUUFDckUsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ1AsZ0JBQWdCO0FBQUEsVUFBb0IsVUFBVTtBQUFBLFVBQzlDLGlCQUFpQixZQUFZO0FBQUEsVUFBZSxVQUFVO0FBQUEsUUFDeEQ7QUFBQSxRQUNBLE1BQU0sS0FBSyxVQUFVLEVBQUUsT0FBTyxTQUFTLGFBQVksb0JBQUksS0FBSyxHQUFFLFlBQVksRUFBRSxDQUFDO0FBQUEsTUFDL0UsQ0FBQztBQUNELFVBQUksQ0FBQyxFQUFFLEdBQUksT0FBTSxJQUFJLE1BQU0sWUFBWSxFQUFFLE1BQU07QUFDL0MsaUJBQVcsT0FBTztBQUNsQixVQUFJLE9BQU87QUFBRSxjQUFNLE1BQU0sVUFBVTtBQUFTLG1CQUFXLE1BQU07QUFBRSxnQkFBTSxNQUFNLFVBQVU7QUFBQSxRQUFRLEdBQUcsSUFBSTtBQUFBLE1BQUc7QUFBQSxJQUN6RyxTQUFRO0FBQUUsWUFBTSxxQ0FBK0I7QUFBQSxJQUFHO0FBQUEsRUFDcEQ7QUFHQSxHQUFDLGVBQWUsT0FBc0I7QUFDcEMsUUFBSTtBQUNGLFlBQU0sZ0JBQWdCLGFBQWEsZUFBZTtBQUNsRCxVQUFJLGVBQWU7QUFDakIsY0FBTSxTQUFTLE1BQU0sYUFBYSxRQUFRLGNBQWMsUUFBUTtBQUNoRSxZQUFJLE9BQU8sTUFBTSxPQUFPLE1BQU0sVUFBVSxPQUFPLE1BQU0sU0FBUztBQUM1RCwyQkFBaUIsT0FBTyxNQUFNLFFBQVEsT0FBTyxDQUFZO0FBQ3pEO0FBQUEsUUFDRjtBQUVBLFlBQUksQ0FBQyxPQUFPLE1BQU0sT0FBTyxNQUFNLFNBQVMsZ0JBQWdCO0FBQ3RELFVBQUFBLEtBQUksS0FBSywyREFBNkMsRUFBRSxLQUFLLE1BQU0sY0FBYyxTQUFTLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQztBQUN2RywyQkFBaUIsY0FBYyxPQUFPLENBQVk7QUFDbEQ7QUFBQSxRQUNGO0FBQ0EscUJBQWEsT0FBTztBQUFBLE1BQ3RCO0FBQUEsSUFDRixTQUFTLEdBQUc7QUFBRSxNQUFBQSxLQUFJLEtBQUssK0JBQTRCLEVBQUUsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDO0FBQUEsSUFBRztBQUMxRSxpQkFBYTtBQUFBLEVBQ2YsR0FBRztBQUdILE1BQUksbUJBQW1CLFdBQVc7QUFDaEMsY0FBVSxjQUFjLFNBQVMsT0FBTyxFQUFFLE1BQU0sTUFBTTtBQUFBLElBQUMsQ0FBQztBQUFBLEVBQzFEO0FBR0EsR0FBQyxlQUFlLHNCQUFxQztBQUNuRCxRQUFJO0FBQ0YsWUFBTSxPQUFPLElBQUksZ0JBQWdCO0FBQ2pDLFlBQU0sUUFBUSxXQUFXLE1BQU0sS0FBSyxNQUFNLEdBQUcsR0FBTTtBQUNuRCxZQUFNLElBQUksTUFBTSxNQUFNLGVBQWUsa0RBQWtEO0FBQUEsUUFDckYsU0FBUyxFQUFFLFVBQVUsZUFBZSxpQkFBaUIsWUFBWSxjQUFjO0FBQUEsUUFDL0UsUUFBUSxLQUFLO0FBQUEsTUFDZixDQUFDO0FBQ0QsbUJBQWEsS0FBSztBQUNsQixVQUFJLENBQUMsRUFBRSxHQUFJO0FBQ1gsWUFBTSxRQUFRLE1BQU0sRUFBRSxLQUFLO0FBQzNCLFVBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxLQUFLLENBQUMsTUFBTSxPQUFRO0FBQzVDLFlBQU0sT0FBNkUsQ0FBQztBQUNwRixZQUFNLFFBQVEsT0FBSztBQUNqQixZQUFJLEtBQUssT0FBTyxFQUFFLFNBQVMsWUFBWSxFQUFFLEtBQUssS0FBSyxFQUFHLE1BQUssRUFBRSxLQUFLLEtBQUssRUFBRSxZQUFZLENBQUMsSUFBSTtBQUFBLE1BQzVGLENBQUM7QUFDRCxZQUFNLFdBQVcsb0JBQUksSUFBb0I7QUFDekMsZUFBUyxpQkFBaUIsWUFBWSxFQUFFLFFBQVEsU0FBTztBQWxuQzNEO0FBbW5DTSxjQUFNLGVBQWMsU0FBSSxhQUFhLFNBQVMsTUFBMUIsWUFBK0I7QUFDbkQsY0FBTSxJQUFJLFlBQVksTUFBTSw4Q0FBOEM7QUFDMUUsWUFBSSxDQUFDLEVBQUc7QUFDUixjQUFNLFdBQVcsRUFBRSxDQUFDO0FBQ3BCLGNBQU0sUUFBUSxTQUFTLEtBQUssRUFBRSxZQUFZO0FBQzFDLGNBQU0sS0FBSyxLQUFLLEtBQUs7QUFDckIsWUFBSSxDQUFDLEdBQUk7QUFDVCxjQUFNLE9BQU8sSUFBSSxRQUFRLFlBQVk7QUFDckMsWUFBSSxDQUFDLEtBQU07QUFDWCxZQUFJLEdBQUcsZUFBZSxPQUFPO0FBQUUsZUFBSyxNQUFNLFVBQVU7QUFBUTtBQUFBLFFBQVE7QUFDcEUsY0FBTSxZQUFZLFdBQVcsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUM3QyxZQUFJLE1BQU0sU0FBUyxLQUFLLGFBQWEsRUFBRztBQUN4QyxZQUFJLGFBQWEsV0FBVyx3QkFBd0IsU0FBUyxRQUFRLE1BQU0sS0FBSyxJQUFJLE9BQU8sWUFBWSxHQUFHO0FBQzFHLGNBQU0sVUFBVSxLQUFLLGNBQWMsYUFBYTtBQUNoRCxZQUFJLFFBQVMsU0FBUSxjQUFjLFFBQVEsVUFBVSxRQUFRLENBQUMsRUFBRSxRQUFRLEtBQUssR0FBRztBQUNoRixpQkFBUyxJQUFJLFVBQVUsU0FBUztBQUFBLE1BQ2xDLENBQUM7QUFDRCxrQkFBWSxpQkFBaUIsUUFBUTtBQUFBLElBQ3ZDLFNBQVE7QUFBQSxJQUFtQjtBQUFBLEVBQzdCLEdBQUc7QUFHSCxXQUFTLGlCQUFpQixXQUFXLENBQUMsTUFBcUI7QUFDekQsUUFBSSxFQUFFLFFBQVEsVUFBVTtBQUN0QixtQkFBYTtBQUNiLGtCQUFZO0FBQ1osc0JBQWdCO0FBQ2hCLGtCQUFZO0FBQUEsSUFDZDtBQUFBLEVBQ0YsQ0FBQztBQXVERCxTQUFPLE9BQU8sUUFBUTtBQUFBLElBQ3BCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsibG9nIiwgImxvZyIsICJsb2ciLCAibG9nIiwgImxvZyIsICJfYSJdCn0K
