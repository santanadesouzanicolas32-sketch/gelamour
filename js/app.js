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
    pedidoIdPendente: null
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
      log4.info("Login realizado", { id: cliente.id });
    }
    logout() {
      this.clearSession();
      setCliente(null);
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
  var log6 = logger.child("main");
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
  async function finalizarPedido() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
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
      if (r.ok) {
        const loc = (_j = r.headers.get("Location")) != null ? _j : "";
        const idMatch = loc.match(/id=eq\.(\d+)/);
        if (idMatch) {
          _pedidoId = parseInt(idMatch[1], 10);
          if (clienteAtual && clienteAtual.id) {
            clienteRepository.updateEndereco(clienteAtual.id, endereco).catch((e) => log6.warn("N\xE3o foi poss\xEDvel salvar endere\xE7o", { error: String(e) }));
          }
        }
      } else {
        log6.warn("INSERT pedido falhou", { status: r.status });
      }
    } catch (e) {
      log6.warn("Erro ao salvar no banco \u2014 pedido vai s\xF3 pelo WhatsApp", { error: String(e) });
    }
    setTimeout(() => {
      if (btnFin) {
        btnFin.disabled = false;
        btnFin.textContent = txtOrig;
      }
    }, 2e3);
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
    fecharModal();
    if (_pedidoId) {
      appStore.setState({ pedidoIdPendente: _pedidoId });
      (_k = document.getElementById("waConfirmBackdrop")) == null ? void 0 : _k.classList.add("aberto");
    } else {
      limparCarrinho();
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
      limparCarrinho();
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
      log6.warn("Erro ao confirmar pedido", { error: result.error.message });
      fecharConfirmWA();
      limparCarrinho();
    }
  }
  function fecharConfirmWA() {
    var _a;
    (_a = document.getElementById("waConfirmBackdrop")) == null ? void 0 : _a.classList.remove("aberto");
    appStore.setState({ pedidoIdPendente: null });
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
        if (isUserMsg) {
          if (erro) {
            erro.textContent = result.error.message;
            erro.style.display = "block";
          }
          return;
        }
        log6.warn("Servidor indispon\xEDvel no login \u2014 seguindo sem cadastro", { error: result.error.message });
        irParaEtapaCadastro(telInput);
        return;
      }
      if (result.value.existe && result.value.cliente) {
        entrarComCliente(result.value.cliente.toJSON());
      } else {
        irParaEtapaCadastro(telInput);
      }
    } catch (e) {
      irParaEtapaCadastro(telInput);
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
        if (result.error.name === "ValidationError" || result.error.name === "RateLimitError") {
          if (erro) {
            erro.textContent = result.error.message;
            erro.style.display = "block";
          }
          return;
        }
        log6.warn("Servidor indispon\xEDvel no cadastro \u2014 entrando sem salvar", { error: result.error.message });
        entrarComCliente(Cliente.create({ nome, telefone: tel, endereco: "" }).toJSON());
        return;
      }
      entrarComCliente(result.value.toJSON());
    } catch (e) {
      try {
        entrarComCliente(Cliente.create({ nome, telefone: tel, endereco: "" }).toJSON());
      } catch (e2) {
        if (erro) {
          erro.textContent = "Confira seu nome e telefone e tente novamente.";
          erro.style.display = "block";
        }
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
    const msg = `Ol\xE1, equipe Gelamour! Quero participar da Roleta VIP.

Nome: ${nome}
Telefone: ${tel}${instagram ? "\nInstagram: " + instagram : ""}

Estou enviando a foto dos meus 5 adesivos e o print do Story para valida\xE7\xE3o!`;
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
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
      const r = await fetch(SUPABASE_URL + "/rest/v1/roleta_vencedores?order=created_at.desc", {
        headers: { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON }
      });
      const data = await r.json();
      if (!data || !data.length) {
        el.innerHTML = '<div class="roleta-empty">Nenhum vencedor ainda.</div>';
        return;
      }
      el.innerHTML = data.map((v) => {
        var _a, _b, _c;
        const dt = new Date(v.created_at).toLocaleString("pt-BR");
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
  initFiltrosTicker();
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
        const m = onclickAttr.match(/pedir(?:Produto|BoloForma)\(this,'(.+?)',(\d+(?:\.\d+)?)\)/);
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
        const fnName = onclickAttr.startsWith("pedirBoloForma") ? "pedirBoloForma" : "pedirProduto";
        btn.setAttribute("onclick", fnName + "(this,'" + nomeProd.replace(/'/g, "\\'") + "'," + novoPreco + ")");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3V0aWxzL3RvYXN0LnRzIiwgIi4uL3NyYy91dGlscy9zZWN1cml0eS50cyIsICIuLi9zcmMvdXRpbHMvZm9ybWF0LnRzIiwgIi4uL3NyYy9jb3JlL2Vycm9ycy50cyIsICIuLi9zcmMvZG9tYWluL2NsaWVudGUudHMiLCAiLi4vc3JjL2NvcmUvcmVzdWx0LnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQudHMiLCAiLi4vc3JjL2NvcmUvbG9nZ2VyLnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9DbGllbnRlUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvZG9tYWluL3BlZGlkby50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUGVkaWRvUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUm9sZXRhUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvc3RhdGUvU3RvcmUudHMiLCAiLi4vc3JjL3N0YXRlL0FwcFN0b3JlLnRzIiwgIi4uL3NyYy9hcHBsaWNhdGlvbi9hdXRoL0xvZ2luVXNlQ2FzZS50cyIsICIuLi9zcmMvYXBwbGljYXRpb24vY2FydC9DYXJ0U2VydmljZS50cyIsICIuLi9zcmMvY29udGFpbmVyLnRzIiwgIi4uL3NyYy9tb2R1bGVzL3JvbGV0YS50cyIsICIuLi9zcmMvbW9kdWxlcy9jYXJ0LnRzIiwgIi4uL3NyYy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IFRvYXN0VGlwbyB9IGZyb20gJy4uL3R5cGVzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtb3N0cmFyVG9hc3QobXNnOiBzdHJpbmcsIHRpcG86IFRvYXN0VGlwbyA9ICdpbmZvJyk6IHZvaWQge1xyXG4gIGNvbnN0IG9sZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdfdG9hc3QnKTtcclxuICBpZiAob2xkKSBvbGQucmVtb3ZlKCk7XHJcbiAgY29uc3QgdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHQuaWQgPSAnX3RvYXN0JztcclxuICB0LnRleHRDb250ZW50ID0gbXNnO1xyXG4gIGNvbnN0IGJnID0gdGlwbyA9PT0gJ2Vycm8nID8gJyNlZjQ0NDQnIDogdGlwbyA9PT0gJ29rJyA/ICcjMjJjNTVlJyA6ICcjNEEyQzE3JztcclxuICBPYmplY3QuYXNzaWduKHQuc3R5bGUsIHtcclxuICAgIHBvc2l0aW9uOiAnZml4ZWQnLCBib3R0b206ICc5MHB4JywgbGVmdDogJzUwJScsXHJcbiAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKC01MCUpJyxcclxuICAgIGJhY2tncm91bmQ6IGJnLCBjb2xvcjogJyNmZmYnLCBwYWRkaW5nOiAnMTJweCAyMnB4JyxcclxuICAgIGJvcmRlclJhZGl1czogJzMwcHgnLCBmb250U2l6ZTogJzE0cHgnLCBmb250V2VpZ2h0OiAnNjAwJyxcclxuICAgIHpJbmRleDogJzk5OTk5JywgYm94U2hhZG93OiAnMCA2cHggMjRweCByZ2JhKDAsMCwwLDAuMyknLFxyXG4gICAgbWF4V2lkdGg6ICc5MHZ3JywgdGV4dEFsaWduOiAnY2VudGVyJyxcclxuICAgIHRyYW5zaXRpb246ICdvcGFjaXR5IC4zcycsIG9wYWNpdHk6ICcxJyxcclxuICAgIGZvbnRGYW1pbHk6IFwiJ0RNIFNhbnMnLCBzYW5zLXNlcmlmXCIsXHJcbiAgfSBhcyBQYXJ0aWFsPENTU1N0eWxlRGVjbGFyYXRpb24+KTtcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHQpO1xyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgdC5zdHlsZS5vcGFjaXR5ID0gJzAnO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB0LnJlbW92ZSgpLCAzNTApO1xyXG4gIH0sIDM1MDApO1xyXG59XHJcbiIsICJleHBvcnQgZnVuY3Rpb24gZXNjSFRNTChzOiB1bmtub3duKTogc3RyaW5nIHtcclxuICByZXR1cm4gU3RyaW5nKHMpXHJcbiAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxyXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxyXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxyXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxyXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzk7Jyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemFyVGVsZWZvbmUodGVsOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHJldHVybiB0ZWwucmVwbGFjZSgvXFxEL2csICcnKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6YXJOb21lKG5vbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIG5vbWVcclxuICAgIC50b0xvd2VyQ2FzZSgpXHJcbiAgICAuc3BsaXQoJyAnKVxyXG4gICAgLm1hcChwID0+IHAuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwLnNsaWNlKDEpKVxyXG4gICAgLmpvaW4oJyAnKVxyXG4gICAgLnRyaW0oKTtcclxufVxyXG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdGFyTW9lZGEodmFsb3I6IG51bWJlcik6IHN0cmluZyB7XHJcbiAgcmV0dXJuICdSJCAnICsgdmFsb3IudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbWFuYUF0dWFsKCk6IHN0cmluZyB7XHJcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcclxuICBjb25zdCBzdGFydE9mWWVhciA9IG5ldyBEYXRlKG5vdy5nZXRGdWxsWWVhcigpLCAwLCAxKTtcclxuICBjb25zdCBkYXlPZlllYXIgPSBNYXRoLmZsb29yKChub3cuZ2V0VGltZSgpIC0gc3RhcnRPZlllYXIuZ2V0VGltZSgpKSAvIDg2NDAwMDAwKTtcclxuICBjb25zdCB3ZWVrTnVtID0gTWF0aC5jZWlsKChkYXlPZlllYXIgKyBzdGFydE9mWWVhci5nZXREYXkoKSArIDEpIC8gNyk7XHJcbiAgcmV0dXJuIGAke25vdy5nZXRGdWxsWWVhcigpfS1XJHtTdHJpbmcod2Vla051bSkucGFkU3RhcnQoMiwgJzAnKX1gO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXBsaWNhck1hc2NhcmFUZWxlZm9uZSh2YWxvcjogc3RyaW5nKTogc3RyaW5nIHtcclxuICBjb25zdCBkID0gdmFsb3IucmVwbGFjZSgvXFxEL2csICcnKS5zbGljZSgwLCAxMSk7XHJcbiAgaWYgKGQubGVuZ3RoIDw9IDIpIHJldHVybiBkO1xyXG4gIGlmIChkLmxlbmd0aCA8PSA3KSByZXR1cm4gYCgke2Quc2xpY2UoMCwgMil9KSAke2Quc2xpY2UoMil9YDtcclxuICBpZiAoZC5sZW5ndGggPD0gMTEpIHJldHVybiBgKCR7ZC5zbGljZSgwLCAyKX0pICR7ZC5zbGljZSgyLCA3KX0tJHtkLnNsaWNlKDcpfWA7XHJcbiAgcmV0dXJuIGAoJHtkLnNsaWNlKDAsIDIpfSkgJHtkLnNsaWNlKDIsIDcpfS0ke2Quc2xpY2UoNywgMTEpfWA7XHJcbn1cclxuIiwgImV4cG9ydCBjbGFzcyBBcHBFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihcclxuICAgIG1lc3NhZ2U6IHN0cmluZyxcclxuICAgIHB1YmxpYyByZWFkb25seSBjb2RlOiBzdHJpbmcsXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzQ29kZTogbnVtYmVyID0gNTAwLFxyXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxyXG4gICkge1xyXG4gICAgc3VwZXIobWVzc2FnZSk7XHJcbiAgICB0aGlzLm5hbWUgPSAnQXBwRXJyb3InO1xyXG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIEFwcEVycm9yLnByb3RvdHlwZSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XHJcbiAgICBzdXBlcihtZXNzYWdlLCAnVkFMSURBVElPTl9FUlJPUicsIDQwMCwgY29udGV4dCk7XHJcbiAgICB0aGlzLm5hbWUgPSAnVmFsaWRhdGlvbkVycm9yJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBOZXR3b3JrRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XHJcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcclxuICAgIHN1cGVyKG1lc3NhZ2UsICdORVRXT1JLX0VSUk9SJywgNTAzLCBjb250ZXh0KTtcclxuICAgIHRoaXMubmFtZSA9ICdOZXR3b3JrRXJyb3InO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEF1dGhFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKG1lc3NhZ2UsICdBVVRIX0VSUk9SJywgNDAxKTtcclxuICAgIHRoaXMubmFtZSA9ICdBdXRoRXJyb3InO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XHJcbiAgY29uc3RydWN0b3IocmVzb3VyY2U6IHN0cmluZykge1xyXG4gICAgc3VwZXIoYCR7cmVzb3VyY2V9IG5cdTAwRTNvIGVuY29udHJhZG9gLCAnTk9UX0ZPVU5EJywgNDA0KTtcclxuICAgIHRoaXMubmFtZSA9ICdOb3RGb3VuZEVycm9yJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBSYXRlTGltaXRFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihyZXRyeUFmdGVyTXM6IG51bWJlcikge1xyXG4gICAgc3VwZXIoYE11aXRhcyB0ZW50YXRpdmFzLiBBZ3VhcmRlICR7TWF0aC5jZWlsKHJldHJ5QWZ0ZXJNcyAvIDEwMDApfXMuYCwgJ1JBVEVfTElNSVQnLCA0MjksIHsgcmV0cnlBZnRlck1zIH0pO1xyXG4gICAgdGhpcy5uYW1lID0gJ1JhdGVMaW1pdEVycm9yJztcclxuICB9XHJcbn1cclxuIiwgImltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uL2NvcmUvZXJyb3JzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2xpZW50ZVByb3BzIHtcclxuICBpZD86IG51bWJlcjtcclxuICBub21lOiBzdHJpbmc7XHJcbiAgdGVsZWZvbmU6IHN0cmluZztcclxuICBlbmRlcmVjbz86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENsaWVudGUge1xyXG4gIHJlYWRvbmx5IGlkPzogbnVtYmVyO1xyXG4gIHJlYWRvbmx5IG5vbWU6IHN0cmluZztcclxuICByZWFkb25seSB0ZWxlZm9uZTogc3RyaW5nO1xyXG4gIHJlYWRvbmx5IGVuZGVyZWNvPzogc3RyaW5nO1xyXG5cclxuICBwcml2YXRlIGNvbnN0cnVjdG9yKHByb3BzOiBDbGllbnRlUHJvcHMpIHtcclxuICAgIHRoaXMuaWQgPSBwcm9wcy5pZDtcclxuICAgIHRoaXMubm9tZSA9IHByb3BzLm5vbWU7XHJcbiAgICB0aGlzLnRlbGVmb25lID0gcHJvcHMudGVsZWZvbmU7XHJcbiAgICB0aGlzLmVuZGVyZWNvID0gcHJvcHMuZW5kZXJlY287XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgY3JlYXRlKHByb3BzOiBDbGllbnRlUHJvcHMpOiBDbGllbnRlIHtcclxuICAgIGNvbnN0IHRlbCA9IHByb3BzLnRlbGVmb25lLnJlcGxhY2UoL1xcRC9nLCAnJyk7XHJcbiAgICBpZiAodGVsLmxlbmd0aCA8IDEwIHx8IHRlbC5sZW5ndGggPiAxMSkge1xyXG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdUZWxlZm9uZSBpbnZcdTAwRTFsaWRvJywgeyB0ZWxlZm9uZTogcHJvcHMudGVsZWZvbmUgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAoIXByb3BzLm5vbWUudHJpbSgpKSB7XHJcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ05vbWUgblx1MDBFM28gcG9kZSBzZXIgdmF6aW8nKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgQ2xpZW50ZSh7XHJcbiAgICAgIC4uLnByb3BzLFxyXG4gICAgICB0ZWxlZm9uZTogdGVsLFxyXG4gICAgICBub21lOiBDbGllbnRlLm5vcm1hbGl6YXJOb21lKHByb3BzLm5vbWUpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZnJvbURCKHJhdzogQ2xpZW50ZVByb3BzKTogQ2xpZW50ZSB7XHJcbiAgICByZXR1cm4gbmV3IENsaWVudGUocmF3KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc3RhdGljIG5vcm1hbGl6YXJOb21lKG5vbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gbm9tZS50b0xvd2VyQ2FzZSgpLnNwbGl0KCcgJylcclxuICAgICAgLm1hcChwID0+IHAuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwLnNsaWNlKDEpKVxyXG4gICAgICAuam9pbignICcpLnRyaW0oKTtcclxuICB9XHJcblxyXG4gIHdpdGhFbmRlcmVjbyhlbmRlcmVjbzogc3RyaW5nKTogQ2xpZW50ZSB7XHJcbiAgICByZXR1cm4gQ2xpZW50ZS5mcm9tREIoeyAuLi50aGlzLnRvSlNPTigpLCBlbmRlcmVjbyB9KTtcclxuICB9XHJcblxyXG4gIHRvSlNPTigpOiBDbGllbnRlUHJvcHMge1xyXG4gICAgcmV0dXJuIHsgaWQ6IHRoaXMuaWQsIG5vbWU6IHRoaXMubm9tZSwgdGVsZWZvbmU6IHRoaXMudGVsZWZvbmUsIGVuZGVyZWNvOiB0aGlzLmVuZGVyZWNvIH07XHJcbiAgfVxyXG59XHJcbiIsICJleHBvcnQgdHlwZSBSZXN1bHQ8VCwgRSBleHRlbmRzIEVycm9yID0gRXJyb3I+ID1cclxuICB8IHsgcmVhZG9ubHkgb2s6IHRydWU7IHJlYWRvbmx5IHZhbHVlOiBUIH1cclxuICB8IHsgcmVhZG9ubHkgb2s6IGZhbHNlOyByZWFkb25seSBlcnJvcjogRSB9O1xyXG5cclxuZXhwb3J0IGNvbnN0IG9rID0gPFQ+KHZhbHVlOiBUKTogUmVzdWx0PFQsIG5ldmVyPiA9PiAoeyBvazogdHJ1ZSwgdmFsdWUgfSk7XHJcbmV4cG9ydCBjb25zdCBmYWlsID0gPEUgZXh0ZW5kcyBFcnJvcj4oZXJyb3I6IEUpOiBSZXN1bHQ8bmV2ZXIsIEU+ID0+ICh7IG9rOiBmYWxzZSwgZXJyb3IgfSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNPazxULCBFIGV4dGVuZHMgRXJyb3I+KHI6IFJlc3VsdDxULCBFPik6IHIgaXMgeyBvazogdHJ1ZTsgdmFsdWU6IFQgfSB7XHJcbiAgcmV0dXJuIHIub2s7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bndyYXA8VD4ocjogUmVzdWx0PFQ+LCBmYWxsYmFjaz86IFQpOiBUIHtcclxuICBpZiAoci5vaykgcmV0dXJuIHIudmFsdWU7XHJcbiAgaWYgKGZhbGxiYWNrICE9PSB1bmRlZmluZWQpIHJldHVybiBmYWxsYmFjaztcclxuICB0aHJvdyByLmVycm9yO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdHJ5QXN5bmM8VD4oZm46ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFJlc3VsdDxUPj4ge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gb2soYXdhaXQgZm4oKSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmV0dXJuIGZhaWwoZSBpbnN0YW5jZW9mIEVycm9yID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpKTtcclxuICB9XHJcbn1cclxuIiwgImltcG9ydCB7IE5ldHdvcmtFcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcclxuXHJcbmNvbnN0IFNVUEFCQVNFX1VSTCA9IGF0b2IoJ2FIUjBjSE02THk5eVptSjBaSFIyYzI1bWRIbGlZWHBtYldSaWR5NXpkWEJoWW1GelpTNWpidz09Jyk7XHJcbmNvbnN0IFNVUEFCQVNFX0FOT04gPSBhdG9iKCdaWGxLYUdKSFkybFBhVXBKVlhwSk1VNXBTWE5KYmxJMVkwTkpOa2xyY0ZoV1EwbzVMbVY1U25Cak0wMXBUMmxLZW1SWVFtaFpiVVo2V2xOSmMwbHVTbXhhYVVrMlNXNUtiVmx1VW10a1NGcDZZbTFhTUdWWFNtaGxiVnAwV2tkS00wbHBkMmxqYlRseldsTkpOa2x0Um5WaU1qUnBURU5LY0ZsWVVXbFBha1V6VDBSRk5VMVVRWHBPYWtGelNXMVdOR05EU1RaTmFrRTFUbnBSTkU1cVRUSk5TREF1U0hjMk9HcFJSa1p0ZDB4bmRuZEdPWHBxYUdkV1YxQmpNMFF4VVRKd1ptZEJiakZVVVd4S1JWWjFOQT09Jyk7XHJcbmNvbnN0IFRJTUVPVVRfTVMgPSAxMF8wMDA7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN1cGFiYXNlRmV0Y2hPcHRpb25zIGV4dGVuZHMgUmVxdWVzdEluaXQge1xyXG4gIHRpbWVvdXQ/OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdXBhYmFzZUZldGNoKFxyXG4gIHBhdGg6IHN0cmluZyxcclxuICBvcHRzOiBTdXBhYmFzZUZldGNoT3B0aW9ucyA9IHt9XHJcbik6IFByb21pc2U8UmVzcG9uc2U+IHtcclxuICBjb25zdCB7IHRpbWVvdXQgPSBUSU1FT1VUX01TLCAuLi5mZXRjaE9wdHMgfSA9IG9wdHM7XHJcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcclxuICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCB0aW1lb3V0KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgICAgICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxyXG4gICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtTVVBBQkFTRV9BTk9OfWAsXHJcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICdQcmVmZXInOiAncmV0dXJuPXJlcHJlc2VudGF0aW9uJyxcclxuICAgICAgLi4uKChmZXRjaE9wdHMuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSA/PyB7fSksXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBhd2FpdCBmZXRjaChgJHtTVVBBQkFTRV9VUkx9JHtwYXRofWAsIHtcclxuICAgICAgLi4uZmV0Y2hPcHRzLFxyXG4gICAgICBoZWFkZXJzLFxyXG4gICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvciAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykge1xyXG4gICAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdUaW1lb3V0OiBzZXJ2aWRvciBuXHUwMEUzbyByZXNwb25kZXUnLCB7IHBhdGggfSk7XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdFcnJvIGRlIHJlZGUnLCB7IHBhdGgsIGNhdXNlOiBTdHJpbmcoZSkgfSk7XHJcbiAgfSBmaW5hbGx5IHtcclxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VHZXQ8VD4oXHJcbiAgdGFibGU6IHN0cmluZyxcclxuICBxdWVyeSA9ICcnXHJcbik6IFByb21pc2U8VFtdPiB7XHJcbiAgY29uc3QgcmVzcCA9IGF3YWl0IHN1cGFiYXNlRmV0Y2goYC9yZXN0L3YxLyR7dGFibGV9JHtxdWVyeSA/ICc/JyArIHF1ZXJ5IDogJyd9YCk7XHJcbiAgaWYgKCFyZXNwLm9rKSB7XHJcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCkuY2F0Y2goKCkgPT4gJycpO1xyXG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgR0VUICR7dGFibGV9IGZhbGhvdSAoJHtyZXNwLnN0YXR1c30pYCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xyXG4gIH1cclxuICByZXR1cm4gcmVzcC5qc29uKCkgYXMgUHJvbWlzZTxUW10+O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VQb3N0PFQ+KFxyXG4gIHRhYmxlOiBzdHJpbmcsXHJcbiAgZGF0YTogUGFydGlhbDxUPlxyXG4pOiBQcm9taXNlPFQ+IHtcclxuICBjb25zdCByZXNwID0gYXdhaXQgc3VwYWJhc2VGZXRjaChgL3Jlc3QvdjEvJHt0YWJsZX1gLCB7XHJcbiAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxyXG4gIH0pO1xyXG4gIGlmICghcmVzcC5vaykge1xyXG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3AudGV4dCgpO1xyXG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgUE9TVCAke3RhYmxlfSBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHkgfSk7XHJcbiAgfVxyXG4gIGNvbnN0IHJvd3MgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBUW107XHJcbiAgcmV0dXJuIHJvd3NbMF0hO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VQYXRjaDxUPihcclxuICB0YWJsZTogc3RyaW5nLFxyXG4gIHF1ZXJ5OiBzdHJpbmcsXHJcbiAgZGF0YTogUGFydGlhbDxUPlxyXG4pOiBQcm9taXNlPFRbXT4ge1xyXG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBzdXBhYmFzZUZldGNoKGAvcmVzdC92MS8ke3RhYmxlfT8ke3F1ZXJ5fWAsIHtcclxuICAgIG1ldGhvZDogJ1BBVENIJyxcclxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxyXG4gIH0pO1xyXG4gIGlmICghcmVzcC5vaykge1xyXG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlc3AudGV4dCgpO1xyXG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgUEFUQ0ggJHt0YWJsZX0gZmFsaG91YCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xyXG4gIH1cclxuICByZXR1cm4gcmVzcC5qc29uKCkgYXMgUHJvbWlzZTxUW10+O1xyXG59XHJcblxyXG5leHBvcnQgeyBTVVBBQkFTRV9VUkwsIFNVUEFCQVNFX0FOT04gfTtcclxuIiwgInR5cGUgTG9nTGV2ZWwgPSAnZGVidWcnIHwgJ2luZm8nIHwgJ3dhcm4nIHwgJ2Vycm9yJztcclxuXHJcbmludGVyZmFjZSBMb2dFbnRyeSB7XHJcbiAgbGV2ZWw6IExvZ0xldmVsO1xyXG4gIG1lc3NhZ2U6IHN0cmluZztcclxuICB0aW1lc3RhbXA6IHN0cmluZztcclxuICBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcbn1cclxuXHJcbmNsYXNzIExvZ2dlciB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBwcmVmaXg6IHN0cmluZztcclxuXHJcbiAgY29uc3RydWN0b3IocHJlZml4ID0gJ0dlbGFtb3VyJykge1xyXG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXg7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGxvZyhsZXZlbDogTG9nTGV2ZWwsIG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XHJcbiAgICBjb25zdCBlbnRyeTogTG9nRW50cnkgPSB7XHJcbiAgICAgIGxldmVsLFxyXG4gICAgICBtZXNzYWdlLFxyXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgY29udGV4dCxcclxuICAgIH07XHJcblxyXG4gICAgY29uc3Qgc3R5bGUgPSB7XHJcbiAgICAgIGRlYnVnOiAnY29sb3I6ICM2QjcyODAnLFxyXG4gICAgICBpbmZvOiAgJ2NvbG9yOiAjM0I4MkY2JyxcclxuICAgICAgd2FybjogICdjb2xvcjogI0Y1OUUwQicsXHJcbiAgICAgIGVycm9yOiAnY29sb3I6ICNFRjQ0NDQ7IGZvbnQtd2VpZ2h0OiBib2xkJyxcclxuICAgIH1bbGV2ZWxdO1xyXG5cclxuICAgIGNvbnN0IGZvcm1hdHRlZCA9IGBbJHt0aGlzLnByZWZpeH1dICR7ZW50cnkudGltZXN0YW1wfSAke21lc3NhZ2V9YDtcclxuXHJcbiAgICBpZiAobGV2ZWwgPT09ICdlcnJvcicpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgJWMke2Zvcm1hdHRlZH1gLCBzdHlsZSwgY29udGV4dCA/PyAnJyk7XHJcbiAgICB9IGVsc2UgaWYgKGxldmVsID09PSAnd2FybicpIHtcclxuICAgICAgY29uc29sZS53YXJuKGAlYyR7Zm9ybWF0dGVkfWAsIHN0eWxlLCBjb250ZXh0ID8/ICcnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGAlYyR7Zm9ybWF0dGVkfWAsIHN0eWxlLCBjb250ZXh0ID8/ICcnKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGRlYnVnKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgeyB0aGlzLmxvZygnZGVidWcnLCBtc2csIGN0eCk7IH1cclxuICBpbmZvKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgIHsgdGhpcy5sb2coJ2luZm8nLCAgbXNnLCBjdHgpOyB9XHJcbiAgd2Fybihtc2c6IHN0cmluZywgY3R4PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkICB7IHRoaXMubG9nKCd3YXJuJywgIG1zZywgY3R4KTsgfVxyXG4gIGVycm9yKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgeyB0aGlzLmxvZygnZXJyb3InLCBtc2csIGN0eCk7IH1cclxuXHJcbiAgY2hpbGQocHJlZml4OiBzdHJpbmcpOiBMb2dnZXIgeyByZXR1cm4gbmV3IExvZ2dlcihgJHt0aGlzLnByZWZpeH06JHtwcmVmaXh9YCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoKTtcclxuIiwgImltcG9ydCB0eXBlIHsgSUNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lDbGllbnRlUmVwb3NpdG9yeSc7XHJcbmltcG9ydCB7IENsaWVudGUgfSBmcm9tICcuLi8uLi9kb21haW4vY2xpZW50ZSc7XHJcbmltcG9ydCB7IHRyeUFzeW5jLCB0eXBlIFJlc3VsdCB9IGZyb20gJy4uLy4uL2NvcmUvcmVzdWx0JztcclxuaW1wb3J0IHsgc3VwYWJhc2VHZXQsIHN1cGFiYXNlUG9zdCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcclxuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xyXG5cclxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdDbGllbnRlUmVwbycpO1xyXG5cclxuZXhwb3J0IGNsYXNzIENsaWVudGVSZXBvc2l0b3J5IGltcGxlbWVudHMgSUNsaWVudGVSZXBvc2l0b3J5IHtcclxuICBhc3luYyBmaW5kQnlUZWxlZm9uZSh0ZWxlZm9uZTogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZSB8IG51bGw+PiB7XHJcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xyXG4gICAgICBsb2cuZGVidWcoJ2ZpbmRCeVRlbGVmb25lJywgeyB0ZWxlZm9uZTogYCoqKiR7dGVsZWZvbmUuc2xpY2UoLTQpfWAgfSk7XHJcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDxSZXR1cm5UeXBlPENsaWVudGVbJ3RvSlNPTiddPj4oXHJcbiAgICAgICAgJ2NsaWVudGVzJyxcclxuICAgICAgICBgdGVsZWZvbmU9ZXEuJHt0ZWxlZm9uZX0mbGltaXQ9MWBcclxuICAgICAgKTtcclxuICAgICAgcmV0dXJuIHJvd3NbMF0gPyBDbGllbnRlLmZyb21EQihyb3dzWzBdKSA6IG51bGw7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHNhdmUoY2xpZW50ZTogQ2xpZW50ZSk6IFByb21pc2U8UmVzdWx0PENsaWVudGU+PiB7XHJcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByb3cgPSBhd2FpdCBzdXBhYmFzZVBvc3Q8UmV0dXJuVHlwZTxDbGllbnRlWyd0b0pTT04nXT4+KFxyXG4gICAgICAgICdjbGllbnRlcycsXHJcbiAgICAgICAgY2xpZW50ZS50b0pTT04oKVxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm4gQ2xpZW50ZS5mcm9tREIocm93KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgdXBkYXRlRW5kZXJlY28oaWQ6IG51bWJlciwgZW5kZXJlY286IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XHJcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xyXG4gICAgICBhd2FpdCBzdXBhYmFzZVBhdGNoKCdjbGllbnRlcycsIGBpZD1lcS4ke2lkfWAsIHsgZW5kZXJlY28gfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwgImltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uL2NvcmUvZXJyb3JzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSXRlbVBlZGlkbyB7XHJcbiAgcmVhZG9ubHkgbm9tZTogc3RyaW5nO1xyXG4gIHJlYWRvbmx5IHByZWNvOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFN0YXR1c1BlZGlkbyA9ICdwZW5kZW50ZScgfCAnY29uZmlybWFkbycgfCAnY2FuY2VsYWRvJztcclxuZXhwb3J0IHR5cGUgVGlwb1BhZ2FtZW50byA9ICdQaXgnIHwgJ0RpbmhlaXJvJyB8ICdDYXJ0XHUwMEUzbyBuYSBFbnRyZWdhJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGVkaWRvUHJvcHMge1xyXG4gIGlkPzogbnVtYmVyO1xyXG4gIG5vbWU6IHN0cmluZztcclxuICB0ZWxlZm9uZTogc3RyaW5nO1xyXG4gIGVuZGVyZWNvOiBzdHJpbmc7XHJcbiAgcGFnYW1lbnRvOiBUaXBvUGFnYW1lbnRvO1xyXG4gIGl0ZW5zOiBJdGVtUGVkaWRvW107XHJcbiAgdG90YWw6IG51bWJlcjtcclxuICBzdGF0dXM6IFN0YXR1c1BlZGlkbztcclxuICBvYnNlcnZhY2FvPzogc3RyaW5nO1xyXG4gIGNsaWVudGVfaWQ/OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQZWRpZG8ge1xyXG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBwcm9wczogUGVkaWRvUHJvcHMpIHt9XHJcblxyXG4gIHN0YXRpYyBjcmVhdGUocHJvcHM6IE9taXQ8UGVkaWRvUHJvcHMsICdzdGF0dXMnIHwgJ3RvdGFsJz4pOiBQZWRpZG8ge1xyXG4gICAgaWYgKCFwcm9wcy5pdGVucy5sZW5ndGgpIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1BlZGlkbyBkZXZlIHRlciBhbyBtZW5vcyAxIGl0ZW0nKTtcclxuICAgIGlmICghcHJvcHMubm9tZS50cmltKCkpIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ05vbWUgb2JyaWdhdFx1MDBGM3JpbycpO1xyXG4gICAgaWYgKCFwcm9wcy5lbmRlcmVjby50cmltKCkpIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0VuZGVyZVx1MDBFN28gb2JyaWdhdFx1MDBGM3JpbycpO1xyXG4gICAgY29uc3QgdG90YWwgPSBwcm9wcy5pdGVucy5yZWR1Y2UoKHMsIGkpID0+IE1hdGgucm91bmQoKHMgKyBpLnByZWNvKSAqIDEwMCkgLyAxMDAsIDApO1xyXG4gICAgcmV0dXJuIG5ldyBQZWRpZG8oeyAuLi5wcm9wcywgdG90YWwsIHN0YXR1czogJ3BlbmRlbnRlJyB9KTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBmcm9tREIocmF3OiBQZWRpZG9Qcm9wcyk6IFBlZGlkbyB7IHJldHVybiBuZXcgUGVkaWRvKHJhdyk7IH1cclxuXHJcbiAgZ2V0IGlkKCk6IG51bWJlciB8IHVuZGVmaW5lZCB7IHJldHVybiB0aGlzLnByb3BzLmlkOyB9XHJcbiAgZ2V0IHRvdGFsKCk6IG51bWJlciB7IHJldHVybiB0aGlzLnByb3BzLnRvdGFsOyB9XHJcbiAgZ2V0IGl0ZW5zKCk6IHJlYWRvbmx5IEl0ZW1QZWRpZG9bXSB7IHJldHVybiB0aGlzLnByb3BzLml0ZW5zOyB9XHJcbiAgZ2V0IHBhZ2FtZW50bygpOiBUaXBvUGFnYW1lbnRvIHsgcmV0dXJuIHRoaXMucHJvcHMucGFnYW1lbnRvOyB9XHJcblxyXG4gIHRvSlNPTigpOiBQZWRpZG9Qcm9wcyB7IHJldHVybiB7IC4uLnRoaXMucHJvcHMgfTsgfVxyXG59XHJcbiIsICJpbXBvcnQgdHlwZSB7IElQZWRpZG9SZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lQZWRpZG9SZXBvc2l0b3J5JztcclxuaW1wb3J0IHsgUGVkaWRvIH0gZnJvbSAnLi4vLi4vZG9tYWluL3BlZGlkbyc7XHJcbmltcG9ydCB0eXBlIHsgUGVkaWRvUHJvcHMgfSBmcm9tICcuLi8uLi9kb21haW4vcGVkaWRvJztcclxuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xyXG5pbXBvcnQgeyBzdXBhYmFzZUZldGNoLCBzdXBhYmFzZVBhdGNoIH0gZnJvbSAnLi9jbGllbnQnO1xyXG5pbXBvcnQgeyBOZXR3b3JrRXJyb3IgfSBmcm9tICcuLi8uLi9jb3JlL2Vycm9ycyc7XHJcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcclxuXHJcbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnUGVkaWRvUmVwbycpO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBlZGlkb1JlcG9zaXRvcnkgaW1wbGVtZW50cyBJUGVkaWRvUmVwb3NpdG9yeSB7XHJcbiAgYXN5bmMgc2F2ZShwZWRpZG86IFBlZGlkbyk6IFByb21pc2U8UmVzdWx0PFBlZGlkbz4+IHtcclxuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XHJcbiAgICAgIGxvZy5pbmZvKCdTYWx2YW5kbyBwZWRpZG8nLCB7IHRvdGFsOiBwZWRpZG8udG90YWwgfSk7XHJcbiAgICAgIC8vIFVzYSBoZWFkZXJzLW9ubHkgcGFyYSBvYnRlciBvIElEIHZpYSBMb2NhdGlvblxyXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgc3VwYWJhc2VGZXRjaChgL3Jlc3QvdjEvcGVkaWRvc2AsIHtcclxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBoZWFkZXJzOiB7ICdQcmVmZXInOiAncmV0dXJuPWhlYWRlcnMtb25seScgfSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBlZGlkby50b0pTT04oKSksXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoIXJlc3Aub2spIHtcclxuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XHJcbiAgICAgICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgUE9TVCBwZWRpZG9zIGZhbGhvdWAsIHsgc3RhdHVzOiByZXNwLnN0YXR1cywgYm9keSB9KTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBsb2MgPSByZXNwLmhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpID8/ICcnO1xyXG4gICAgICBjb25zdCBpZE1hdGNoID0gbG9jLm1hdGNoKC9pZD1lcVxcLihcXGQrKS8pO1xyXG4gICAgICBpZiAoIWlkTWF0Y2gpIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoJ0lEIGRvIHBlZGlkbyBuXHUwMEUzbyByZXRvcm5hZG8nKTtcclxuICAgICAgY29uc3QgaWQgPSBwYXJzZUludChpZE1hdGNoWzFdISwgMTApO1xyXG4gICAgICByZXR1cm4gUGVkaWRvLmZyb21EQih7IC4uLnBlZGlkby50b0pTT04oKSwgaWQgfSBhcyBQZWRpZG9Qcm9wcyk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHVwZGF0ZVN0YXR1cyhpZDogbnVtYmVyLCBjbGllbnRlSWQ6IG51bWJlciwgc3RhdHVzOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDx2b2lkPj4ge1xyXG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcclxuICAgICAgYXdhaXQgc3VwYWJhc2VQYXRjaChcclxuICAgICAgICAncGVkaWRvcycsXHJcbiAgICAgICAgYGlkPWVxLiR7aWR9JmNsaWVudGVfaWQ9ZXEuJHtjbGllbnRlSWR9YCxcclxuICAgICAgICB7IHN0YXR1cyB9XHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG59XHJcbiIsICJpbXBvcnQgdHlwZSB7IElSb2xldGFSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lSb2xldGFSZXBvc2l0b3J5JztcclxuaW1wb3J0IHR5cGUgeyBQYXJ0aWNpcGFjYW9Qcm9wcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9yb2xldGEnO1xyXG5pbXBvcnQgeyB0cnlBc3luYywgdHlwZSBSZXN1bHQgfSBmcm9tICcuLi8uLi9jb3JlL3Jlc3VsdCc7XHJcbmltcG9ydCB7IHN1cGFiYXNlR2V0LCBzdXBhYmFzZVBvc3QsIHN1cGFiYXNlUGF0Y2ggfSBmcm9tICcuL2NsaWVudCc7XHJcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcclxuXHJcbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnUm9sZXRhUmVwbycpO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJvbGV0YVJlcG9zaXRvcnkgaW1wbGVtZW50cyBJUm9sZXRhUmVwb3NpdG9yeSB7XHJcbiAgYXN5bmMgZmluZFBhcnRpY2lwYWNhb0F0aXZhKFxyXG4gICAgdGVsZWZvbmU6IHN0cmluZyxcclxuICAgIHNlbWFuYTogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxSZXN1bHQ8UGFydGljaXBhY2FvUHJvcHMgfCBudWxsPj4ge1xyXG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcclxuICAgICAgbG9nLmRlYnVnKCdmaW5kUGFydGljaXBhY2FvQXRpdmEnLCB7IHNlbWFuYSB9KTtcclxuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHN1cGFiYXNlR2V0PFBhcnRpY2lwYWNhb1Byb3BzPihcclxuICAgICAgICAncm9sZXRhX3BhcnRpY2lwYWNvZXMnLFxyXG4gICAgICAgIGB0ZWxlZm9uZT1lcS4ke3RlbGVmb25lfSZzZW1hbmE9ZXEuJHtzZW1hbmF9Jm9yZGVyPWNyZWF0ZWRfYXQuZGVzYyZsaW1pdD0xYFxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm4gcm93c1swXSA/PyBudWxsO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBzYXZlUGFydGljaXBhY2FvKFxyXG4gICAgZGF0YTogUGFydGlhbDxQYXJ0aWNpcGFjYW9Qcm9wcz5cclxuICApOiBQcm9taXNlPFJlc3VsdDxQYXJ0aWNpcGFjYW9Qcm9wcz4+IHtcclxuICAgIC8vIFNlIHRlbSBpZCwgZmF6IFBBVENIOyBzZW5cdTAwRTNvIElOU0VSVFxyXG4gICAgaWYgKGRhdGEuaWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHsgaWQsIC4uLnBhdGNoIH0gPSBkYXRhO1xyXG4gICAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZVBhdGNoPFBhcnRpY2lwYWNhb1Byb3BzPihcclxuICAgICAgICAgICdyb2xldGFfcGFydGljaXBhY29lcycsXHJcbiAgICAgICAgICBgaWQ9ZXEuJHtpZH1gLFxyXG4gICAgICAgICAgcGF0Y2hcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiAocm93c1swXSA/PyB7IC4uLmRhdGEgfSkgYXMgUGFydGljaXBhY2FvUHJvcHM7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRyeUFzeW5jKCgpID0+XHJcbiAgICAgIHN1cGFiYXNlUG9zdDxQYXJ0aWNpcGFjYW9Qcm9wcz4oJ3JvbGV0YV9wYXJ0aWNpcGFjb2VzJywgZGF0YSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBjb3VudFZlbmNlZG9yZXNTZW1hbmEoc2VtYW5hOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDxudW1iZXI+PiB7XHJcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgc3VwYWJhc2VHZXQ8eyBpZDogbnVtYmVyIH0+KFxyXG4gICAgICAgICdyb2xldGFfdmVuY2Vkb3JlcycsXHJcbiAgICAgICAgYHNlbWFuYT1lcS4ke3NlbWFuYX0mc2VsZWN0PWlkYFxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm4gcm93cy5sZW5ndGg7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHNhdmVWZW5jZWRvcihcclxuICAgIHRlbGVmb25lOiBzdHJpbmcsXHJcbiAgICBub21lOiBzdHJpbmcsXHJcbiAgICBwcmVtaW86IHN0cmluZyxcclxuICAgIHNlbWFuYTogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxSZXN1bHQ8dm9pZD4+IHtcclxuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XHJcbiAgICAgIGF3YWl0IHN1cGFiYXNlUG9zdCgncm9sZXRhX3ZlbmNlZG9yZXMnLCB7IHRlbGVmb25lLCBub21lLCBwcmVtaW8sIHNlbWFuYSB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCAidHlwZSBTZWxlY3RvcjxTLCBUPiA9IChzdGF0ZTogUykgPT4gVDtcclxudHlwZSBMaXN0ZW5lcjxUPiA9ICh2YWx1ZTogVCkgPT4gdm9pZDtcclxuXHJcbmV4cG9ydCBjbGFzcyBTdG9yZTxTIGV4dGVuZHMgb2JqZWN0PiB7XHJcbiAgcHJpdmF0ZSBzdGF0ZTogUztcclxuICBwcml2YXRlIGdsb2JhbExpc3RlbmVycyA9IG5ldyBTZXQ8TGlzdGVuZXI8Uz4+KCk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGluaXRpYWxTdGF0ZTogUykge1xyXG4gICAgdGhpcy5zdGF0ZSA9IHsgLi4uaW5pdGlhbFN0YXRlIH07XHJcbiAgfVxyXG5cclxuICBnZXRTdGF0ZSgpOiBSZWFkb25seTxTPiB7XHJcbiAgICByZXR1cm4gdGhpcy5zdGF0ZTtcclxuICB9XHJcblxyXG4gIHNldFN0YXRlKHVwZGF0ZXI6IFBhcnRpYWw8Uz4gfCAoKHM6IFJlYWRvbmx5PFM+KSA9PiBQYXJ0aWFsPFM+KSk6IHZvaWQge1xyXG4gICAgY29uc3QgcGF0Y2ggPSB0eXBlb2YgdXBkYXRlciA9PT0gJ2Z1bmN0aW9uJ1xyXG4gICAgICA/IHVwZGF0ZXIodGhpcy5zdGF0ZSlcclxuICAgICAgOiB1cGRhdGVyO1xyXG4gICAgdGhpcy5zdGF0ZSA9IHsgLi4udGhpcy5zdGF0ZSwgLi4ucGF0Y2ggfTtcclxuICAgIHRoaXMuZ2xvYmFsTGlzdGVuZXJzLmZvckVhY2gobCA9PiBsKHRoaXMuc3RhdGUpKTtcclxuICB9XHJcblxyXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXI8Uz4pOiAoKSA9PiB2b2lkIHtcclxuICAgIHRoaXMuZ2xvYmFsTGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XHJcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5nbG9iYWxMaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcclxuICB9XHJcblxyXG4gIHNlbGVjdDxUPihzZWxlY3RvcjogU2VsZWN0b3I8UywgVD4sIGxpc3RlbmVyOiBMaXN0ZW5lcjxUPik6ICgpID0+IHZvaWQge1xyXG4gICAgbGV0IHByZXYgPSBzZWxlY3Rvcih0aGlzLnN0YXRlKTtcclxuICAgIHJldHVybiB0aGlzLnN1YnNjcmliZShzdGF0ZSA9PiB7XHJcbiAgICAgIGNvbnN0IG5leHQgPSBzZWxlY3RvcihzdGF0ZSk7XHJcbiAgICAgIGlmIChuZXh0ICE9PSBwcmV2KSB7XHJcbiAgICAgICAgcHJldiA9IG5leHQ7XHJcbiAgICAgICAgbGlzdGVuZXIobmV4dCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCAiaW1wb3J0IHsgU3RvcmUgfSBmcm9tICcuL1N0b3JlJztcclxuaW1wb3J0IHR5cGUgeyBDbGllbnRlIH0gZnJvbSAnLi4vZG9tYWluL2NsaWVudGUnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBcHBTdGF0ZSB7XHJcbiAgcmVhZG9ubHkgY2xpZW50ZTogQ2xpZW50ZSB8IG51bGw7XHJcbiAgcmVhZG9ubHkgaXNMb2dnZWRJbjogYm9vbGVhbjtcclxuICByZWFkb25seSBpc0FkbWluOiBib29sZWFuO1xyXG4gIHJlYWRvbmx5IGNhcnJpbmhvQ291bnQ6IG51bWJlcjtcclxuICByZWFkb25seSBjYXJyaW5ob1RvdGFsOiBudW1iZXI7XHJcbiAgcmVhZG9ubHkgcGFnYW1lbnRvU2VsZWNpb25hZG86IHN0cmluZztcclxuICByZWFkb25seSBwZWRpZG9JZFBlbmRlbnRlOiBudW1iZXIgfCBudWxsO1xyXG59XHJcblxyXG5jb25zdCBBRE1JTl9URUwgPSBhdG9iKCdNVEU1TkRBM056STNOVEE9Jyk7XHJcbmNvbnN0IENPTlRBX1RFU1RFID0gYXRvYignTVRFNU5qVXdNekF3TnpZPScpO1xyXG5cclxuZnVuY3Rpb24gY2FsY0lzQWRtaW4oY2xpZW50ZTogQ2xpZW50ZSB8IG51bGwpOiBib29sZWFuIHtcclxuICByZXR1cm4gISFjbGllbnRlICYmIGNsaWVudGUudGVsZWZvbmUgPT09IEFETUlOX1RFTDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGFUZXN0ZShjbGllbnRlOiBDbGllbnRlIHwgbnVsbCk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiAhIWNsaWVudGUgJiYgY2xpZW50ZS50ZWxlZm9uZSA9PT0gQ09OVEFfVEVTVEU7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBhcHBTdG9yZSA9IG5ldyBTdG9yZTxBcHBTdGF0ZT4oe1xyXG4gIGNsaWVudGU6IG51bGwsXHJcbiAgaXNMb2dnZWRJbjogZmFsc2UsXHJcbiAgaXNBZG1pbjogZmFsc2UsXHJcbiAgY2FycmluaG9Db3VudDogMCxcclxuICBjYXJyaW5ob1RvdGFsOiAwLFxyXG4gIHBhZ2FtZW50b1NlbGVjaW9uYWRvOiAnJyxcclxuICBwZWRpZG9JZFBlbmRlbnRlOiBudWxsLFxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRDbGllbnRlKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogdm9pZCB7XHJcbiAgYXBwU3RvcmUuc2V0U3RhdGUoe1xyXG4gICAgY2xpZW50ZSxcclxuICAgIGlzTG9nZ2VkSW46ICEhY2xpZW50ZSxcclxuICAgIGlzQWRtaW46IGNhbGNJc0FkbWluKGNsaWVudGUpLFxyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2FycmluaG8oY291bnQ6IG51bWJlciwgdG90YWw6IG51bWJlcik6IHZvaWQge1xyXG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgY2FycmluaG9Db3VudDogY291bnQsIGNhcnJpbmhvVG90YWw6IHRvdGFsIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0UGFnYW1lbnRvKHRpcG86IHN0cmluZyk6IHZvaWQge1xyXG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGFnYW1lbnRvU2VsZWNpb25hZG86IHRpcG8gfSk7XHJcbn1cclxuIiwgImltcG9ydCB0eXBlIHsgSUNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lDbGllbnRlUmVwb3NpdG9yeSc7XHJcbmltcG9ydCB7IENsaWVudGUgfSBmcm9tICcuLi8uLi9kb21haW4vY2xpZW50ZSc7XHJcbmltcG9ydCB7IHR5cGUgUmVzdWx0LCBvaywgZmFpbCwgdHJ5QXN5bmMgfSBmcm9tICcuLi8uLi9jb3JlL3Jlc3VsdCc7XHJcbmltcG9ydCB7IFJhdGVMaW1pdEVycm9yLCBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi9jb3JlL2Vycm9ycyc7XHJcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcclxuaW1wb3J0IHsgc2V0Q2xpZW50ZSB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0b3JlJztcclxuXHJcbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnTG9naW5Vc2VDYXNlJyk7XHJcblxyXG5jb25zdCBTRVNTSU9OX0tFWSA9ICdnZWxhbW91cl9jbGllbnRlJztcclxuY29uc3QgU0VTU0lPTl9UU19LRVkgPSAnZ2VsYW1vdXJfdHMnO1xyXG5jb25zdCBTRVNTSU9OX1RUTF9NUyA9IDI0ICogNjAgKiA2MCAqIDEwMDA7XHJcblxyXG5pbnRlcmZhY2UgUmF0ZUxpbWl0ZXIge1xyXG4gIGF0dGVtcHRzOiBudW1iZXI7XHJcbiAgYmxvY2tlZFVudGlsOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBMb2dpblVzZUNhc2Uge1xyXG4gIHByaXZhdGUgcmF0ZUxpbWl0ZXI6IFJhdGVMaW1pdGVyID0geyBhdHRlbXB0czogMCwgYmxvY2tlZFVudGlsOiAwIH07XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgY2xpZW50ZVJlcG86IElDbGllbnRlUmVwb3NpdG9yeSkge31cclxuXHJcbiAgcmVzdG9yZVNlc3Npb24oKTogQ2xpZW50ZSB8IG51bGwge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgdHMgPSBOdW1iZXIoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShTRVNTSU9OX1RTX0tFWSkgPz8gJzAnKTtcclxuICAgICAgaWYgKERhdGUubm93KCkgLSB0cyA+IFNFU1NJT05fVFRMX01TKSB7XHJcbiAgICAgICAgdGhpcy5jbGVhclNlc3Npb24oKTtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByYXcgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFNFU1NJT05fS0VZKTtcclxuICAgICAgaWYgKCFyYXcpIHJldHVybiBudWxsO1xyXG4gICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShyYXcpIGFzIFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+O1xyXG4gICAgICBjb25zdCBjbGllbnRlID0gQ2xpZW50ZS5mcm9tREIoZGF0YSk7XHJcbiAgICAgIHNldENsaWVudGUoY2xpZW50ZSk7XHJcbiAgICAgIHJldHVybiBjbGllbnRlO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHRoaXMuY2xlYXJTZXNzaW9uKCk7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgZXhlY3V0ZSh0ZWxlZm9uZTogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8eyBleGlzdGU6IGJvb2xlYW47IGNsaWVudGU/OiBDbGllbnRlIH0+PiB7XHJcbiAgICBpZiAoRGF0ZS5ub3coKSA8IHRoaXMucmF0ZUxpbWl0ZXIuYmxvY2tlZFVudGlsKSB7XHJcbiAgICAgIHJldHVybiBmYWlsKG5ldyBSYXRlTGltaXRFcnJvcih0aGlzLnJhdGVMaW1pdGVyLmJsb2NrZWRVbnRpbCAtIERhdGUubm93KCkpKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0ZWwgPSB0ZWxlZm9uZS5yZXBsYWNlKC9cXEQvZywgJycpO1xyXG4gICAgaWYgKHRlbC5sZW5ndGggPCAxMCkgcmV0dXJuIGZhaWwobmV3IFZhbGlkYXRpb25FcnJvcignVGVsZWZvbmUgaW52XHUwMEUxbGlkbycpKTtcclxuXHJcbiAgICBsb2cuaW5mbygnVmVyaWZpY2FuZG8gdGVsZWZvbmUnLCB7IHRlbDogYCoqKiR7dGVsLnNsaWNlKC00KX1gIH0pO1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jbGllbnRlUmVwby5maW5kQnlUZWxlZm9uZSh0ZWwpO1xyXG5cclxuICAgIGlmICghcmVzdWx0Lm9rKSB7XHJcbiAgICAgIC8vIE5ldHdvcmtFcnJvciA9IHNlcnZpZG9yIGluZGlzcG9uXHUwMEVEdmVsLCBuXHUwMEUzbyB0ZW50YXRpdmEgaW52XHUwMEUxbGlkYSBcdTIwMTQgblx1MDBFM28gcGVuYWxpemFcclxuICAgICAgaWYgKHJlc3VsdC5lcnJvci5uYW1lICE9PSAnTmV0d29ya0Vycm9yJykge1xyXG4gICAgICAgIHRoaXMucmF0ZUxpbWl0ZXIuYXR0ZW1wdHMrKztcclxuICAgICAgICBpZiAodGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cyA+PSA1KSB7XHJcbiAgICAgICAgICB0aGlzLnJhdGVMaW1pdGVyLmJsb2NrZWRVbnRpbCA9IERhdGUubm93KCkgKyA2MF8wMDA7XHJcbiAgICAgICAgICB0aGlzLnJhdGVMaW1pdGVyLmF0dGVtcHRzID0gMDtcclxuICAgICAgICAgIHJldHVybiBmYWlsKG5ldyBSYXRlTGltaXRFcnJvcig2MF8wMDApKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhaWwocmVzdWx0LmVycm9yKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJhdGVMaW1pdGVyLmF0dGVtcHRzID0gMDtcclxuICAgIHJldHVybiBvayh7IGV4aXN0ZTogISFyZXN1bHQudmFsdWUsIGNsaWVudGU6IHJlc3VsdC52YWx1ZSA/PyB1bmRlZmluZWQgfSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyByZWdpc3Rlcihub21lOiBzdHJpbmcsIHRlbGVmb25lOiBzdHJpbmcsIGVuZGVyZWNvOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDxDbGllbnRlPj4ge1xyXG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZW50aXR5ID0gQ2xpZW50ZS5jcmVhdGUoeyBub21lLCB0ZWxlZm9uZSwgZW5kZXJlY28gfSk7XHJcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgdGhpcy5jbGllbnRlUmVwby5zYXZlKGVudGl0eSk7XHJcbiAgICAgIGlmICghc2F2ZWQub2spIHRocm93IHNhdmVkLmVycm9yO1xyXG4gICAgICByZXR1cm4gc2F2ZWQudmFsdWU7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGxvZ2luKGNsaWVudGU6IENsaWVudGUpOiB2b2lkIHtcclxuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oU0VTU0lPTl9LRVksIEpTT04uc3RyaW5naWZ5KGNsaWVudGUudG9KU09OKCkpKTtcclxuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oU0VTU0lPTl9UU19LRVksIFN0cmluZyhEYXRlLm5vdygpKSk7XHJcbiAgICBzZXRDbGllbnRlKGNsaWVudGUpO1xyXG4gICAgbG9nLmluZm8oJ0xvZ2luIHJlYWxpemFkbycsIHsgaWQ6IGNsaWVudGUuaWQgfSk7XHJcbiAgfVxyXG5cclxuICBsb2dvdXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLmNsZWFyU2Vzc2lvbigpO1xyXG4gICAgc2V0Q2xpZW50ZShudWxsKTtcclxuICAgIGxvZy5pbmZvKCdMb2dvdXQgcmVhbGl6YWRvJyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNsZWFyU2Vzc2lvbigpOiB2b2lkIHtcclxuICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oU0VTU0lPTl9LRVkpO1xyXG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShTRVNTSU9OX1RTX0tFWSk7XHJcbiAgfVxyXG59XHJcbiIsICJpbXBvcnQgeyBzZXRDYXJyaW5obyB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0b3JlJztcclxuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xyXG5pbXBvcnQgdHlwZSB7IEl0ZW1QZWRpZG8gfSBmcm9tICcuLi8uLi9kb21haW4vcGVkaWRvJztcclxuXHJcbmNvbnN0IGxvZyA9IGxvZ2dlci5jaGlsZCgnQ2FydFNlcnZpY2UnKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDYXJ0U2VydmljZSB7XHJcbiAgcHJpdmF0ZSBpdGVtcyA9IG5ldyBNYXA8c3RyaW5nLCBJdGVtUGVkaWRvPigpO1xyXG5cclxuICBhZGQobm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5pdGVtcy5oYXMobm9tZSkpIHJldHVybjtcclxuICAgIHRoaXMuaXRlbXMuc2V0KG5vbWUsIHsgbm9tZSwgcHJlY286IE51bWJlcihwcmVjbykgfSk7XHJcbiAgICB0aGlzLm5vdGlmeSgpO1xyXG4gICAgbG9nLmRlYnVnKCdJdGVtIGFkaWNpb25hZG8nLCB7IG5vbWUgfSk7XHJcbiAgfVxyXG5cclxuICByZW1vdmUobm9tZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBpZiAoIXRoaXMuaXRlbXMuaGFzKG5vbWUpKSByZXR1cm47XHJcbiAgICB0aGlzLml0ZW1zLmRlbGV0ZShub21lKTtcclxuICAgIHRoaXMubm90aWZ5KCk7XHJcbiAgICBsb2cuZGVidWcoJ0l0ZW0gcmVtb3ZpZG8nLCB7IG5vbWUgfSk7XHJcbiAgfVxyXG5cclxuICB0b2dnbGUobm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogJ2FkZGVkJyB8ICdyZW1vdmVkJyB7XHJcbiAgICBpZiAodGhpcy5pdGVtcy5oYXMobm9tZSkpIHtcclxuICAgICAgdGhpcy5yZW1vdmUobm9tZSk7XHJcbiAgICAgIHJldHVybiAncmVtb3ZlZCc7XHJcbiAgICB9XHJcbiAgICB0aGlzLmFkZChub21lLCBwcmVjbyk7XHJcbiAgICByZXR1cm4gJ2FkZGVkJztcclxuICB9XHJcblxyXG4gIGNsZWFyKCk6IHZvaWQge1xyXG4gICAgdGhpcy5pdGVtcy5jbGVhcigpO1xyXG4gICAgdGhpcy5ub3RpZnkoKTtcclxuICB9XHJcblxyXG4gIGdldEl0ZW1zKCk6IHJlYWRvbmx5IEl0ZW1QZWRpZG9bXSB7XHJcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLml0ZW1zLnZhbHVlcygpKTtcclxuICB9XHJcblxyXG4gIGdldFRvdGFsKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLml0ZW1zLnZhbHVlcygpKVxyXG4gICAgICAucmVkdWNlKChzdW0sIGkpID0+IE1hdGgucm91bmQoKHN1bSArIGkucHJlY28pICogMTAwKSAvIDEwMCwgMCk7XHJcbiAgfVxyXG5cclxuICBnZXRDb3VudCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5pdGVtcy5zaXplOyB9XHJcblxyXG4gIGhhcyhub21lOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaXRlbXMuaGFzKG5vbWUpOyB9XHJcblxyXG4gIGlzRW1wdHkoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLml0ZW1zLnNpemUgPT09IDA7IH1cclxuXHJcbiAgcmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcDogTWFwPHN0cmluZywgbnVtYmVyPik6IHZvaWQge1xyXG4gICAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRlbSwga2V5KSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlYWxQcmljZSA9IHByaWNlTWFwLmdldChrZXkpO1xyXG4gICAgICBpZiAocmVhbFByaWNlICE9PSB1bmRlZmluZWQgJiYgcmVhbFByaWNlICE9PSBpdGVtLnByZWNvKSB7XHJcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoa2V5LCB7IC4uLml0ZW0sIHByZWNvOiByZWFsUHJpY2UgfSk7XHJcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XHJcbiAgICAgICAgbG9nLndhcm4oJ1ByZVx1MDBFN28gcmV2YWxpZGFkbycsIHsgbm9tZToga2V5LCBvbGQ6IGl0ZW0ucHJlY28sIG5ldzogcmVhbFByaWNlIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGlmIChjaGFuZ2VkKSB0aGlzLm5vdGlmeSgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBub3RpZnkoKTogdm9pZCB7XHJcbiAgICBzZXRDYXJyaW5obyh0aGlzLmdldENvdW50KCksIHRoaXMuZ2V0VG90YWwoKSk7XHJcbiAgfVxyXG59XHJcbiIsICIvLyBDb21wb3NpdGlvbiBSb290IFx1MjAxNCBpbnN0YW5jaWEgZSBpbmpldGEgZGVwZW5kXHUwMEVBbmNpYXNcclxuaW1wb3J0IHsgQ2xpZW50ZVJlcG9zaXRvcnkgfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL0NsaWVudGVSZXBvc2l0b3J5JztcclxuaW1wb3J0IHsgUGVkaWRvUmVwb3NpdG9yeSB9IGZyb20gJy4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUGVkaWRvUmVwb3NpdG9yeSc7XHJcbmltcG9ydCB7IFJvbGV0YVJlcG9zaXRvcnkgfSBmcm9tICcuL2luZnJhc3RydWN0dXJlL3N1cGFiYXNlL1JvbGV0YVJlcG9zaXRvcnknO1xyXG5pbXBvcnQgeyBMb2dpblVzZUNhc2UgfSBmcm9tICcuL2FwcGxpY2F0aW9uL2F1dGgvTG9naW5Vc2VDYXNlJztcclxuaW1wb3J0IHsgQ2FydFNlcnZpY2UgfSBmcm9tICcuL2FwcGxpY2F0aW9uL2NhcnQvQ2FydFNlcnZpY2UnO1xyXG5cclxuY29uc3QgY2xpZW50ZVJlcG9zaXRvcnkgPSBuZXcgQ2xpZW50ZVJlcG9zaXRvcnkoKTtcclxuY29uc3QgcGVkaWRvUmVwb3NpdG9yeSA9IG5ldyBQZWRpZG9SZXBvc2l0b3J5KCk7XHJcbmNvbnN0IHJvbGV0YVJlcG9zaXRvcnkgPSBuZXcgUm9sZXRhUmVwb3NpdG9yeSgpO1xyXG5cclxuZXhwb3J0IGNvbnN0IGxvZ2luVXNlQ2FzZSA9IG5ldyBMb2dpblVzZUNhc2UoY2xpZW50ZVJlcG9zaXRvcnkpO1xyXG5leHBvcnQgY29uc3QgY2FydFNlcnZpY2UgPSBuZXcgQ2FydFNlcnZpY2UoKTtcclxuXHJcbmV4cG9ydCB7IGNsaWVudGVSZXBvc2l0b3J5LCBwZWRpZG9SZXBvc2l0b3J5LCByb2xldGFSZXBvc2l0b3J5IH07XHJcbiIsICJpbXBvcnQgdHlwZSB7IFJvbGV0YUNvbmZpZyB9IGZyb20gJy4uL3R5cGVzJztcclxuaW1wb3J0IHsgcm9sZXRhUmVwb3NpdG9yeSB9IGZyb20gJy4uL2NvbnRhaW5lcic7XHJcbmltcG9ydCB7IHN1cGFiYXNlR2V0IH0gZnJvbSAnLi4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvY2xpZW50JztcclxuaW1wb3J0IHsgZ2V0U2VtYW5hQXR1YWwgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xyXG5pbXBvcnQgeyBlc2NIVE1MIH0gZnJvbSAnLi4vdXRpbHMvc2VjdXJpdHknO1xyXG5pbXBvcnQgeyBtb3N0cmFyVG9hc3QgfSBmcm9tICcuLi91dGlscy90b2FzdCc7XHJcbmltcG9ydCB7IGlzQ29udGFUZXN0ZSB9IGZyb20gJy4uL3N0YXRlL0FwcFN0b3JlJztcclxuaW1wb3J0IHsgYXBwU3RvcmUgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdG9yZSc7XHJcbmltcG9ydCB0eXBlIHsgQ2xpZW50ZSB9IGZyb20gJy4uL3R5cGVzJztcclxuXHJcbmNvbnN0IFBSRU1JT1NfUEFEUkFPOiBzdHJpbmdbXSA9IFtcclxuICAnXHVEODNDXHVERjgxIDUlIE9GRiBcdTIwMTQgQ29tcHJhcyBhY2ltYSBkZSBSJDM1JyxcclxuICAnXHVEODNDXHVERjZCIEJyb3duaWUgVHJhZGljaW9uYWwgR3JcdTAwRTF0aXMgXHUyMDE0IENvbXByYXMgYWNpbWEgZGUgUiQ1MCcsXHJcbiAgJ1x1RDgzQ1x1REY4MSAxMCUgT0ZGIFx1MjAxNCBDb21wcmFzIGFjaW1hIGRlIFIkNTAnLFxyXG4gICdcdUQ4M0RcdURDRjggU2lnYSBhIEdlbGFtb3VyIG5vIEluc3RhZ3JhbScsXHJcbiAgJ1x1RDgzRFx1REVDRFx1RkUwRiBDb21wcmUgMiBlIExldmUgXHUyMDE0IEF0XHUwMEU5IFIkMTQgZW0gcHJvZHV0b3MnLFxyXG4gICdcdUQ4M0RcdURFMTUgTlx1MDBFM28gRm9pIERlc3NhIFZleiBcdTIwMTQgR2FuaGEgNSUgT0ZGIGFjaW1hIGRlIFIkMzUnLFxyXG5dO1xyXG5cclxubGV0IF9wcmVtaW9zOiBzdHJpbmdbXSA9IFsuLi5QUkVNSU9TX1BBRFJBT107XHJcbmxldCBfcm90YWNhb0F0dWFsID0gMDtcclxubGV0IF9naXJhbmRvID0gZmFsc2U7XHJcbmxldCBfcGFydGljaXBhY2FvSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZW1pb3NQYWRyYW8oKTogc3RyaW5nW10geyByZXR1cm4gUFJFTUlPU19QQURSQU87IH1cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZW1pb3MoKTogc3RyaW5nW10geyByZXR1cm4gX3ByZW1pb3M7IH1cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFByZW1pb3MocDogc3RyaW5nW10pOiB2b2lkIHsgX3ByZW1pb3MgPSBwOyB9XHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJ0aWNpcGFjYW9JZCgpOiBudW1iZXIgfCBudWxsIHsgcmV0dXJuIF9wYXJ0aWNpcGFjYW9JZDsgfVxyXG5leHBvcnQgZnVuY3Rpb24gc2V0UGFydGljaXBhY2FvSWQoaWQ6IG51bWJlciB8IG51bGwpOiB2b2lkIHsgX3BhcnRpY2lwYWNhb0lkID0gaWQ7IH1cclxuZXhwb3J0IGZ1bmN0aW9uIGlzR2lyYW5kbygpOiBib29sZWFuIHsgcmV0dXJuIF9naXJhbmRvOyB9XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJDb25maWcoKTogUHJvbWlzZTxSb2xldGFDb25maWcgfCBudWxsPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDxSb2xldGFDb25maWc+KCdyb2xldGFfY29uZmlnJywgJ2lkPWVxLjEmbGltaXQ9MScpO1xyXG4gICAgaWYgKHJvd3NbMF0pIHtcclxuICAgICAgX3ByZW1pb3MgPSBBcnJheS5pc0FycmF5KHJvd3NbMF0ucHJlbWlvcykgPyByb3dzWzBdLnByZW1pb3MgOiBQUkVNSU9TX1BBRFJBTztcclxuICAgIH1cclxuICAgIHJldHVybiByb3dzWzBdID8/IG51bGw7XHJcbiAgfSBjYXRjaCB7IHJldHVybiBudWxsOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJTdGF0dXMoY2xpZW50ZUlkOiBudW1iZXIpOiBQcm9taXNlPGltcG9ydCgnLi4vZG9tYWluL3JvbGV0YScpLlBhcnRpY2lwYWNhb1Byb3BzIHwgbnVsbD4ge1xyXG4gIGNvbnN0IHNlbWFuYSA9IGdldFNlbWFuYUF0dWFsKCk7XHJcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5maW5kUGFydGljaXBhY2FvQXRpdmEoU3RyaW5nKGNsaWVudGVJZCksIHNlbWFuYSk7XHJcbiAgaWYgKCFyZXN1bHQub2spIHJldHVybiBudWxsO1xyXG4gIGlmIChyZXN1bHQudmFsdWUpIF9wYXJ0aWNpcGFjYW9JZCA9IHJlc3VsdC52YWx1ZS5pZDtcclxuICByZXR1cm4gcmVzdWx0LnZhbHVlO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2lyYXIoXHJcbiAgX2NsaWVudGU6IENsaWVudGUsXHJcbiAgb25SZXN1bHRhZG86IChwcmVtaW86IHN0cmluZywgaW5kaWNlOiBudW1iZXIpID0+IHZvaWRcclxuKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgaWYgKF9naXJhbmRvKSByZXR1cm47XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gYXBwU3RvcmUuZ2V0U3RhdGUoKTtcclxuICBpZiAoIWlzQ29udGFUZXN0ZShzdGF0ZS5jbGllbnRlKSkge1xyXG4gICAgbW9zdHJhclRvYXN0KCdcdUQ4M0RcdURFQTcgUm9sZXRhIGVtIGJyZXZlISBFc3RhbW9zIGZpbmFsaXphbmRvIG9zIFx1MDBGQWx0aW1vcyBkZXRhbGhlcy4gXHVEODNDXHVERkExJywgJ2luZm8nKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIF9naXJhbmRvID0gdHJ1ZTtcclxuICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XHJcbiAgaWYgKGJ0bikgeyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4udGV4dENvbnRlbnQgPSAnR2lyYW5kby4uLic7IH1cclxuXHJcbiAgY29uc3QgbiA9IF9wcmVtaW9zLmxlbmd0aDtcclxuICBjb25zdCBhcmMgPSAzNjAgLyBuO1xyXG4gIGNvbnN0IGluZGljZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG4pO1xyXG4gIGNvbnN0IHZvbHRhc0V4dHJhcyA9IDUgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1KTtcclxuICBjb25zdCBhbmd1bG9BbHZvID0gdm9sdGFzRXh0cmFzICogMzYwICsgKDM2MCAtIGFyYyAqIGluZGljZSAtIGFyYyAvIDIpO1xyXG4gIGNvbnN0IHJvdGFjYW9GaW5hbCA9IF9yb3RhY2FvQXR1YWwgKyBhbmd1bG9BbHZvO1xyXG5cclxuICBjb25zdCByb2RhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJvZGEnKTtcclxuICBpZiAocm9kYSkge1xyXG4gICAgcm9kYS5zdHlsZS50cmFuc2l0aW9uID0gJ3RyYW5zZm9ybSA0cyBjdWJpYy1iZXppZXIoMC4xNywgMC42NywgMC4xMiwgMSknO1xyXG4gICAgcm9kYS5zdHlsZS50cmFuc2Zvcm1PcmlnaW4gPSAnMjAwcHggMjAwcHgnO1xyXG4gICAgcm9kYS5zdHlsZS50cmFuc2Zvcm0gPSBgcm90YXRlKCR7cm90YWNhb0ZpbmFsfWRlZylgO1xyXG4gIH1cclxuXHJcbiAgX3JvdGFjYW9BdHVhbCA9ICgocm90YWNhb0ZpbmFsICUgMzYwKSArIDM2MCkgJSAzNjA7XHJcblxyXG4gIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA0MjAwKSk7XHJcblxyXG4gIGNvbnN0IHByZW1pbyA9IF9wcmVtaW9zW2luZGljZV0hO1xyXG4gIF9naXJhbmRvID0gZmFsc2U7XHJcblxyXG4gIG9uUmVzdWx0YWRvKHByZW1pbywgaW5kaWNlKTtcclxuXHJcbiAgaWYgKGlzQ29udGFUZXN0ZShzdGF0ZS5jbGllbnRlKSAmJiBidG4pIHtcclxuICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgYnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REZBMSBHSVJBUiBBR09SQSEnO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhbHZhclZlbmNlZG9yKGNsaWVudGU6IENsaWVudGUsIHByZW1pbzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgaWYgKGlzQ29udGFUZXN0ZShhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUpKSByZXR1cm47XHJcbiAgaWYgKCFfcGFydGljaXBhY2FvSWQpIHJldHVybjtcclxuXHJcbiAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcclxuXHJcbiAgY29uc3QgcGF0Y2hSZXN1bHQgPSBhd2FpdCByb2xldGFSZXBvc2l0b3J5LnNhdmVQYXJ0aWNpcGFjYW8oe1xyXG4gICAgaWQ6IF9wYXJ0aWNpcGFjYW9JZCxcclxuICAgIGphX2dpcm91OiB0cnVlLFxyXG4gICAgcHJlbWlvLFxyXG4gIH0gYXMgaW1wb3J0KCcuLi9kb21haW4vcm9sZXRhJykuUGFydGljaXBhY2FvUHJvcHMpO1xyXG5cclxuICBpZiAoIXBhdGNoUmVzdWx0Lm9rKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvIGFvIGF0dWFsaXphciBwYXJ0aWNpcGFcdTAwRTdcdTAwRTNvOicsIHBhdGNoUmVzdWx0LmVycm9yKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHZlbmNlZG9yUmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5zYXZlVmVuY2Vkb3IoXHJcbiAgICBjbGllbnRlLnRlbGVmb25lLFxyXG4gICAgY2xpZW50ZS5ub21lLFxyXG4gICAgcHJlbWlvLFxyXG4gICAgc2VtYW5hXHJcbiAgKTtcclxuXHJcbiAgaWYgKCF2ZW5jZWRvclJlc3VsdC5vaykge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJybyBhbyBzYWx2YXIgdmVuY2Vkb3I6JywgdmVuY2Vkb3JSZXN1bHQuZXJyb3IpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlc2VuaGFyUm9sZXRhKHByZW1pb3M6IHN0cmluZ1tdKTogdm9pZCB7XHJcbiAgY29uc3Qgd3JhcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yb2xldGEtcG9pbnRlci13cmFwJyk7XHJcbiAgaWYgKCF3cmFwKSByZXR1cm47XHJcbiAgY29uc3Qgb2xkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUNhbnZhcycpO1xyXG4gIGlmIChvbGQpIG9sZC5yZW1vdmUoKTtcclxuXHJcbiAgY29uc3QgTiA9IHByZW1pb3MubGVuZ3RoO1xyXG4gIGNvbnN0IENYID0gMjAwLCBDWSA9IDIwMCwgUiA9IDE2NCwgUl9MRUQgPSAxODIsIFJfT1VURVIgPSAxOTY7XHJcbiAgY29uc3QgU0VHID0gMzYwIC8gTjtcclxuICBjb25zdCBDT1JFUyA9IFtcclxuICAgIHsgYmc6ICcjRkFGMEYyJywgdHh0OiAnI0I1MTM0RicgfSxcclxuICAgIHsgYmc6ICcjRTg1MjhBJywgdHh0OiAnI0ZGRkZGRicgfSxcclxuICBdIGFzIGNvbnN0O1xyXG5cclxuICBjb25zdCByYWQgPSAoZDogbnVtYmVyKTogbnVtYmVyID0+IGQgKiBNYXRoLlBJIC8gMTgwO1xyXG4gIGNvbnN0IHB0ID0gKGQ6IG51bWJlciwgcjogbnVtYmVyKTogW251bWJlciwgbnVtYmVyXSA9PiBbQ1ggKyByICogTWF0aC5jb3MocmFkKGQpKSwgQ1kgKyByICogTWF0aC5zaW4ocmFkKGQpKV07XHJcbiAgY29uc3QgZXNjID0gKHM6IHN0cmluZyk6IHN0cmluZyA9PiBzLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcclxuXHJcbiAgZnVuY3Rpb24gc2VnUGF0aChpOiBudW1iZXIpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgcyA9IFNFRyAqIGkgLSA5MCwgZSA9IHMgKyBTRUc7XHJcbiAgICBjb25zdCBbeDEsIHkxXSA9IHB0KHMsIFIpLCBbeDIsIHkyXSA9IHB0KGUsIFIpO1xyXG4gICAgcmV0dXJuIGBNJHtDWH0sJHtDWX0gTCR7eDEudG9GaXhlZCgyKX0sJHt5MS50b0ZpeGVkKDIpfSBBJHtSfSwke1J9IDAgMCwxICR7eDIudG9GaXhlZCgyKX0sJHt5Mi50b0ZpeGVkKDIpfSBaYDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHdyYXBXb3Jkcyh0ZXh0OiBzdHJpbmcsIG1heENoYXJzOiBudW1iZXIpOiBzdHJpbmdbXSB7XHJcbiAgICBjb25zdCB3b3JkcyA9IHRleHQuc3BsaXQoJyAnKTtcclxuICAgIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgbGV0IGN1ciA9ICcnO1xyXG4gICAgd29yZHMuZm9yRWFjaCh3ID0+IHtcclxuICAgICAgY29uc3QgdGVzdCA9IGN1ciA/IGAke2N1cn0gJHt3fWAgOiB3O1xyXG4gICAgICBpZiAodGVzdC5sZW5ndGggPiBtYXhDaGFycyAmJiBjdXIpIHsgbGluZXMucHVzaChjdXIpOyBjdXIgPSB3OyB9XHJcbiAgICAgIGVsc2UgY3VyID0gdGVzdDtcclxuICAgIH0pO1xyXG4gICAgaWYgKGN1cikgbGluZXMucHVzaChjdXIpO1xyXG4gICAgcmV0dXJuIGxpbmVzLnNsaWNlKDAsIDMpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2VncyA9IHByZW1pb3MubWFwKChfLCBpKSA9PiB7XHJcbiAgICBjb25zdCBjID0gQ09SRVNbaSAlIDJdITtcclxuICAgIHJldHVybiBgPHBhdGggZD1cIiR7c2VnUGF0aChpKX1cIiBmaWxsPVwiJHtjLmJnfVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIyXCIgc2hhcGUtcmVuZGVyaW5nPVwiZ2VvbWV0cmljUHJlY2lzaW9uXCIvPmA7XHJcbiAgfSkuam9pbignJyk7XHJcblxyXG4gIGNvbnN0IHNwb2tlcyA9IHByZW1pb3MubWFwKChfLCBpKSA9PiB7XHJcbiAgICBjb25zdCBkID0gU0VHICogaSAtIDkwO1xyXG4gICAgY29uc3QgW3gsIHldID0gcHQoZCwgUik7XHJcbiAgICByZXR1cm4gYDxsaW5lIHgxPVwiJHtDWH1cIiB5MT1cIiR7Q1l9XCIgeDI9XCIke3gudG9GaXhlZCgyKX1cIiB5Mj1cIiR7eS50b0ZpeGVkKDIpfVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIyXCIvPmA7XHJcbiAgfSkuam9pbignJyk7XHJcblxyXG4gIGNvbnN0IHRleHRzID0gcHJlbWlvcy5tYXAoKHAsIGkpID0+IHtcclxuICAgIGNvbnN0IG1pZCA9IFNFRyAqIGkgLSA5MCArIFNFRyAvIDI7XHJcbiAgICBjb25zdCBbdHgsIHR5XSA9IHB0KG1pZCwgUiAqIDAuNTcpO1xyXG4gICAgY29uc3QgYyA9IENPUkVTW2kgJSAyXSE7XHJcbiAgICBjb25zdCBtID0gcC5tYXRjaCgvXihcXFMrKVxccysoLispJC8pO1xyXG4gICAgY29uc3QgZW1vamkgPSBtID8gbVsxXSEgOiAnJztcclxuICAgIGNvbnN0IHJlc3QgPSBtID8gbVsyXSEgOiBwO1xyXG4gICAgY29uc3QgbGluZXMgPSB3cmFwV29yZHMocmVzdCwgMTMpO1xyXG4gICAgY29uc3QgbGluZUggPSAxMS41O1xyXG4gICAgY29uc3QgdG90YWxUeHRIID0gbGluZXMubGVuZ3RoICogbGluZUg7XHJcbiAgICBjb25zdCBlbW9qaVkgPSAtKHRvdGFsVHh0SCAvIDIpIC0gMTE7XHJcbiAgICBjb25zdCByb3QgPSAobWlkICsgOTApLnRvRml4ZWQoMSk7XHJcbiAgICByZXR1cm4gYDxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgke3R4LnRvRml4ZWQoMil9LCR7dHkudG9GaXhlZCgyKX0pIHJvdGF0ZSgke3JvdH0pXCIgdGV4dC1yZW5kZXJpbmc9XCJnZW9tZXRyaWNQcmVjaXNpb25cIj5cclxuICA8dGV4dCB4PVwiMFwiIHk9XCIke2Vtb2ppWS50b0ZpeGVkKDEpfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmb250LXNpemU9XCIxNVwiIGZvbnQtZmFtaWx5PVwic2VyaWZcIj4ke2VzYyhlbW9qaSl9PC90ZXh0PlxyXG4gICR7bGluZXMubWFwKChsLCBsaSkgPT4ge1xyXG4gICAgY29uc3QgeXAgPSAoKGxpIC0gKGxpbmVzLmxlbmd0aCAtIDEpIC8gMikgKiBsaW5lSCkudG9GaXhlZCgxKTtcclxuICAgIHJldHVybiBgPHRleHQgeD1cIjBcIiB5PVwiJHt5cH1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGRvbWluYW50LWJhc2VsaW5lPVwibWlkZGxlXCIgZmlsbD1cIiR7Yy50eHR9XCIgZm9udC1mYW1pbHk9XCInRE0gU2FucycsQXJpYWwsc2Fucy1zZXJpZlwiIGZvbnQtd2VpZ2h0PVwiNzAwXCIgZm9udC1zaXplPVwiOVwiPiR7ZXNjKGwpfTwvdGV4dD5gO1xyXG4gIH0pLmpvaW4oJ1xcbiAgJyl9XHJcbjwvZz5gO1xyXG4gIH0pLmpvaW4oJycpO1xyXG5cclxuICBjb25zdCBMRURfTiA9IDMwO1xyXG4gIGNvbnN0IGxlZHMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBMRURfTiB9LCAoXywgaSkgPT4ge1xyXG4gICAgY29uc3QgW2x4LCBseV0gPSBwdCgoMzYwIC8gTEVEX04pICogaSAtIDkwLCBSX0xFRCk7XHJcbiAgICByZXR1cm4gYDxjaXJjbGUgY3g9XCIke2x4LnRvRml4ZWQoMil9XCIgY3k9XCIke2x5LnRvRml4ZWQoMil9XCIgcj1cIjUuNVwiIGNsYXNzPVwici1sZWQgci1sZWQtJHtpICUgMn1cIi8+YDtcclxuICB9KS5qb2luKCcnKTtcclxuXHJcbiAgY29uc3Qgc3ZnID0gYDxzdmcgaWQ9XCJyb2xldGFDYW52YXNcIiB2aWV3Qm94PVwiMCAwIDQwMCA0MDBcIlxyXG4gIHN0eWxlPVwid2lkdGg6bWluKDg2dncsMzQwcHgpO2hlaWdodDptaW4oODZ2dywzNDBweCk7ZGlzcGxheTpibG9jaztmaWx0ZXI6ZHJvcC1zaGFkb3coMCA2cHggMjBweCByZ2JhKDAsMCwwLC40MikpXCJcclxuICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+XHJcbiAgPGRlZnM+XHJcbiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9XCJyZy1yaW5nXCIgY3g9XCI1MCVcIiBjeT1cIjUwJVwiIHI9XCI1MCVcIj5cclxuICAgICAgPHN0b3Agb2Zmc2V0PVwiNzAlXCIgc3RvcC1jb2xvcj1cIiNENDJCNzNcIi8+XHJcbiAgICAgIDxzdG9wIG9mZnNldD1cIjEwMCVcIiBzdG9wLWNvbG9yPVwiIzZBMDgyRVwiLz5cclxuICAgIDwvcmFkaWFsR3JhZGllbnQ+XHJcbiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9XCJyZy1jdHJcIiBjeD1cIjM1JVwiIGN5PVwiMzAlXCIgcj1cIjcwJVwiPlxyXG4gICAgICA8c3RvcCBvZmZzZXQ9XCIwJVwiIHN0b3AtY29sb3I9XCIjRkZFNTdBXCIvPlxyXG4gICAgICA8c3RvcCBvZmZzZXQ9XCI0OCVcIiBzdG9wLWNvbG9yPVwiI0Q0QUYzN1wiLz5cclxuICAgICAgPHN0b3Agb2Zmc2V0PVwiMTAwJVwiIHN0b3AtY29sb3I9XCIjN0E1ODAwXCIvPlxyXG4gICAgPC9yYWRpYWxHcmFkaWVudD5cclxuICAgIDxmaWx0ZXIgaWQ9XCJmLWdsb3dcIiB4PVwiLTYwJVwiIHk9XCItNjAlXCIgd2lkdGg9XCIyMjAlXCIgaGVpZ2h0PVwiMjIwJVwiPlxyXG4gICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPVwiMi41XCIgcmVzdWx0PVwiYlwiLz5cclxuICAgICAgPGZlTWVyZ2U+PGZlTWVyZ2VOb2RlIGluPVwiYlwiLz48ZmVNZXJnZU5vZGUgaW49XCJTb3VyY2VHcmFwaGljXCIvPjwvZmVNZXJnZT5cclxuICAgIDwvZmlsdGVyPlxyXG4gIDwvZGVmcz5cclxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIiR7Ul9PVVRFUn1cIiBmaWxsPVwidXJsKCNyZy1yaW5nKVwiLz5cclxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIiR7Ul9PVVRFUn1cIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIzLjVcIi8+XHJcbiAgPGcgaWQ9XCJyb2xldGFSb2RhXCI+JHtzZWdzfSR7c3Bva2VzfSR7dGV4dHN9PC9nPlxyXG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiJHtSICsgMX1cIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiNENEFGMzdcIiBzdHJva2Utd2lkdGg9XCIzXCIvPlxyXG4gICR7bGVkc31cclxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIjQyXCIgZmlsbD1cInVybCgjcmctY3RyKVwiIHN0cm9rZT1cIiNGRkZcIiBzdHJva2Utd2lkdGg9XCIzLjVcIiBmaWx0ZXI9XCJ1cmwoI2YtZ2xvdylcIi8+XHJcbiAgPGNpcmNsZSBjeD1cIiR7Q1h9XCIgY3k9XCIke0NZfVwiIHI9XCIzOFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwicmdiYSgyNTUsMjU1LDI1NSwwLjM1KVwiIHN0cm9rZS13aWR0aD1cIjEuNVwiLz5cclxuICA8dGV4dCB4PVwiJHtDWH1cIiB5PVwiJHtDWSAtIDd9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBkb21pbmFudC1iYXNlbGluZT1cIm1pZGRsZVwiIGZpbGw9XCIjRkZGXCIgZm9udC1mYW1pbHk9XCInRE0gU2FucycsQXJpYWwsc2Fucy1zZXJpZlwiIGZvbnQtd2VpZ2h0PVwiODAwXCIgZm9udC1zaXplPVwiMTJcIiBsZXR0ZXItc3BhY2luZz1cIjEuNVwiIHRleHQtcmVuZGVyaW5nPVwiZ2VvbWV0cmljUHJlY2lzaW9uXCI+R0lSQVI8L3RleHQ+XHJcbiAgPHRleHQgeD1cIiR7Q1h9XCIgeT1cIiR7Q1kgKyA5fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmaWxsPVwicmdiYSgyNTUsMjU1LDI1NSwuODUpXCIgZm9udC1mYW1pbHk9XCJzZXJpZlwiIGZvbnQtc2l6ZT1cIjExXCI+XHUyNjA1IFx1MjYwNSBcdTI2MDU8L3RleHQ+XHJcbjwvc3ZnPmA7XHJcblxyXG4gIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGRpdi5pbm5lckhUTUwgPSBzdmc7XHJcbiAgd3JhcC5pbnNlcnRCZWZvcmUoZGl2LmZpcnN0RWxlbWVudENoaWxkISwgd3JhcC5maXJzdENoaWxkKTtcclxufVxyXG5cclxuZXhwb3J0IHsgZXNjSFRNTCB9O1xyXG4iLCAiaW1wb3J0IHR5cGUgeyBJdGVtQ2FycmluaG8gfSBmcm9tICcuLi90eXBlcyc7XHJcbmltcG9ydCB7IGVzY0hUTUwgfSBmcm9tICcuLi91dGlscy9zZWN1cml0eSc7XHJcbmltcG9ydCB7IGZvcm1hdGFyTW9lZGEgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xyXG5pbXBvcnQgeyBjYXJ0U2VydmljZSB9IGZyb20gJy4uL2NvbnRhaW5lcic7XHJcblxyXG4vLyBBZGFwdGFkb3JlcyBsZWdhZG9zIFx1MjAxNCBkZWxlZ2FtIGFvIENhcnRTZXJ2aWNlIChDbGVhbiBBcmNoaXRlY3R1cmUpXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXJyaW5obygpOiBSZWNvcmQ8c3RyaW5nLCBJdGVtQ2FycmluaG8+IHtcclxuICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIEl0ZW1DYXJyaW5obz4gPSB7fTtcclxuICBjYXJ0U2VydmljZS5nZXRJdGVtcygpLmZvckVhY2goaSA9PiB7IHJlc3VsdFtpLm5vbWVdID0gaTsgfSk7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEl0ZW5zKCk6IEl0ZW1DYXJyaW5ob1tdIHtcclxuICByZXR1cm4gQXJyYXkuZnJvbShjYXJ0U2VydmljZS5nZXRJdGVtcygpKSBhcyBJdGVtQ2FycmluaG9bXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvdGFsKCk6IG51bWJlciB7XHJcbiAgcmV0dXJuIGNhcnRTZXJ2aWNlLmdldFRvdGFsKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGljaW9uYXJJdGVtKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IGJvb2xlYW4ge1xyXG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybiBmYWxzZTtcclxuICBjYXJ0U2VydmljZS5hZGQobm9tZSwgcHJlY28pO1xyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVtb3Zlckl0ZW0obm9tZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgaWYgKCFjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybiBmYWxzZTtcclxuICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGVJdGVtKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6ICdhZGljaW9uYWRvJyB8ICdyZW1vdmlkbycge1xyXG4gIGNvbnN0IHIgPSBjYXJ0U2VydmljZS50b2dnbGUobm9tZSwgcHJlY28pO1xyXG4gIHJldHVybiByID09PSAnYWRkZWQnID8gJ2FkaWNpb25hZG8nIDogJ3JlbW92aWRvJztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxpbXBhcigpOiB2b2lkIHtcclxuICBjYXJ0U2VydmljZS5jbGVhcigpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNCb2xvRm9ybWEobm9tZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgY29uc3QgQk9MT19GT1JNQV9OT01FUyA9IFtcclxuICAgICdCb2xvIG5hIGZvcm1hIE1pbGhvIG5hdHVyYWwnLFxyXG4gICAgJ0JvbG8gbmEgZm9ybWEgQ2Vub3VyYSBjb20gY2hvY29sYXRlIGUgR3JhbnVsZScsXHJcbiAgICAnQm9sbyBuYSBmb3JtYSBCcmlnYWRlaXJvJyxcclxuICAgICdCb2xvIG5hIGZvcm1hIEZlcnJlcm8gUm9jaGVyJyxcclxuICAgICdUb3J0YSBkZSBGcmFuZ28gY29tIENhdHVwaXJ5JyxcclxuICBdO1xyXG4gIHJldHVybiBCT0xPX0ZPUk1BX05PTUVTLmluY2x1ZGVzKG5vbWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyaXphckxpc3RhKGNvbnRhaW5lcklkOiBzdHJpbmcsIHRvdGFsUm9kYXBlSWQ6IHN0cmluZywgYmFkZ2VJZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgY29uc3QgbGlzdGEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250YWluZXJJZCk7XHJcbiAgY29uc3QgdG90YWxFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRvdGFsUm9kYXBlSWQpO1xyXG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYmFkZ2VJZCk7XHJcbiAgY29uc3QgaXRlbnMgPSBnZXRJdGVucygpO1xyXG5cclxuICBpZiAoYmFkZ2UpIGJhZGdlLnRleHRDb250ZW50ID0gU3RyaW5nKGl0ZW5zLmxlbmd0aCk7XHJcblxyXG4gIGlmICghbGlzdGEgfHwgIXRvdGFsRWwpIHJldHVybjtcclxuXHJcbiAgaWYgKGl0ZW5zLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgbGlzdGEuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJjYXJyaW5oby12YXppb1wiPjxkaXYgY2xhc3M9XCJjYXJyaW5oby12YXppby1pY29uXCI+XHVEODNEXHVERUQyPC9kaXY+PGRpdj5TZXUgY2FycmluaG8gZXN0XHUwMEUxIHZhemlvPC9kaXY+PC9kaXY+YDtcclxuICAgIHRvdGFsRWwudGV4dENvbnRlbnQgPSAnUiQgMCwwMCc7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCB0b3RhbCA9IGdldFRvdGFsKCk7XHJcbiAgbGlzdGEuaW5uZXJIVE1MID0gaXRlbnMubWFwKGl0ZW0gPT4ge1xyXG4gICAgY29uc3Qgbm9tZUVzYyA9IGVzY0hUTUwoaXRlbS5ub21lKTtcclxuICAgIGNvbnN0IG5vbWVEYXRhID0gZW5jb2RlVVJJQ29tcG9uZW50KGl0ZW0ubm9tZSk7XHJcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJjYXJ0LWl0ZW1cIj5cclxuICAgICAgPHNwYW4gY2xhc3M9XCJjYXJ0LWl0ZW0tbm9tZVwiPiR7bm9tZUVzY308L3NwYW4+XHJcbiAgICAgIDxzcGFuIGNsYXNzPVwiY2FydC1pdGVtLXByZWNvXCI+JHtmb3JtYXRhck1vZWRhKGl0ZW0ucHJlY28pfTwvc3Bhbj5cclxuICAgICAgPGJ1dHRvbiBjbGFzcz1cImNhcnQtaXRlbS1yZW1vdmVcIiBvbmNsaWNrPVwicmVtb3ZlckRvQ2FycmluaG8oZGVjb2RlVVJJQ29tcG9uZW50KCcke25vbWVEYXRhfScpKVwiIGFyaWEtbGFiZWw9XCJSZW1vdmVyXCI+XHVEODNEXHVEREQxXHVGRTBGPC9idXR0b24+XHJcbiAgICA8L2Rpdj5gO1xyXG4gIH0pLmpvaW4oJycpICsgYDxkaXYgY2xhc3M9XCJjYXJ0LXRvdGFsXCI+PHNwYW4gY2xhc3M9XCJjYXJ0LXRvdGFsLWxhYmVsXCI+VG90YWw8L3NwYW4+PHNwYW4gY2xhc3M9XCJjYXJ0LXRvdGFsLXZhbG9yXCI+JHtmb3JtYXRhck1vZWRhKHRvdGFsKX08L3NwYW4+PC9kaXY+YDtcclxuICB0b3RhbEVsLnRleHRDb250ZW50ID0gZm9ybWF0YXJNb2VkYSh0b3RhbCk7XHJcbn1cclxuIiwgIi8vIHNyYy9tYWluLnRzIFx1MjAxNCBwb250byBkZSBlbnRyYWRhIEdlbGFtb3VyIChDbGVhbiBBcmNoaXRlY3R1cmUpXHJcbmltcG9ydCB7IG1vc3RyYXJUb2FzdCB9IGZyb20gJy4vdXRpbHMvdG9hc3QnO1xyXG5pbXBvcnQgeyBlc2NIVE1MIH0gZnJvbSAnLi91dGlscy9zZWN1cml0eSc7XHJcbmltcG9ydCB7IGFwbGljYXJNYXNjYXJhVGVsZWZvbmUgfSBmcm9tICcuL3V0aWxzL2Zvcm1hdCc7XHJcbmltcG9ydCB7IGxvZ2luVXNlQ2FzZSwgY2FydFNlcnZpY2UsIHBlZGlkb1JlcG9zaXRvcnksIHJvbGV0YVJlcG9zaXRvcnksIGNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi9jb250YWluZXInO1xyXG5pbXBvcnQgeyBhcHBTdG9yZSwgaXNDb250YVRlc3RlIH0gZnJvbSAnLi9zdGF0ZS9BcHBTdG9yZSc7XHJcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4vY29yZS9sb2dnZXInO1xyXG5pbXBvcnQgeyBDbGllbnRlIGFzIENsaWVudGVFbnRpdHkgfSBmcm9tICcuL2RvbWFpbi9jbGllbnRlJztcclxuaW1wb3J0IHsgZ2V0U2VtYW5hQXR1YWwgfSBmcm9tICcuL3V0aWxzL2Zvcm1hdCc7XHJcbmltcG9ydCB7XHJcbiAgZ2V0UHJlbWlvcywgZ2V0UHJlbWlvc1BhZHJhbywgc2V0UHJlbWlvcyxcclxuICBzZXRQYXJ0aWNpcGFjYW9JZCxcclxuICBjYXJyZWdhckNvbmZpZyBhcyBjYXJyZWdhckNvbmZpZ1JvbGV0YSxcclxuICB2ZXJpZmljYXJTdGF0dXMgYXMgdmVyaWZpY2FyU3RhdHVzUm9sZXRhLFxyXG4gIGdpcmFyIGFzIGdpcmFyUm9sZXRhRm4sXHJcbiAgc2FsdmFyVmVuY2Vkb3IsXHJcbiAgZGVzZW5oYXJSb2xldGFcclxufSBmcm9tICcuL21vZHVsZXMvcm9sZXRhJztcclxuaW1wb3J0IHsgaXNCb2xvRm9ybWEsIHJlbmRlcml6YXJMaXN0YSB9IGZyb20gJy4vbW9kdWxlcy9jYXJ0JztcclxuaW1wb3J0IHR5cGUgeyBDbGllbnRlLCBQYXJ0aWNpcGFjYW8gfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgU1VQQUJBU0VfVVJMLCBTVVBBQkFTRV9BTk9OIH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQnO1xyXG5cclxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdtYWluJyk7XHJcblxyXG4vLyA9PT09PSBDT05TVEFOVEVTID09PT09XHJcbmNvbnN0IFdBX05VTUJFUiA9IGF0b2IoJ05UVXhNVGswTURjM01qYzFNQT09Jyk7XHJcblxyXG5sZXQgX3ZlcmlmaWNhbmRvID0gZmFsc2U7XHJcbmxldCBfY2FkYXN0cmFuZG8gPSBmYWxzZTtcclxuXHJcbi8vIEhlbHBlcjogbFx1MDBFQSBjbGllbnRlIGF0dWFsIGRvIHN0b3JlXHJcbmZ1bmN0aW9uIGdldENsaWVudGVBdHVhbCgpOiBDbGllbnRlIHwgbnVsbCB7XHJcbiAgcmV0dXJuIGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSBhcyBDbGllbnRlIHwgbnVsbDtcclxufVxyXG5cclxuLy8gPT09PT0gRklMVFJPUyA9PT09PVxyXG5mdW5jdGlvbiBmaWx0cmFyKGNhdDogc3RyaW5nLCBfYnRuOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5maWx0cm8tYnRuJykuZm9yRWFjaChiID0+IGIuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJykpO1xyXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KCcuZmlsdHJvLWJ0bltkYXRhLWZpbHRybz1cIicgKyBjYXQgKyAnXCJdJylcclxuICAgIC5mb3JFYWNoKGIgPT4gYi5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKSk7XHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZCcpLmZvckVhY2goY2FyZCA9PiB7XHJcbiAgICBjb25zdCBlbCA9IGNhcmQgYXMgSFRNTEVsZW1lbnQ7XHJcbiAgICBpZiAoY2F0ID09PSAndG9kb3MnIHx8IChlbC5kYXRhc2V0WydjYXQnXSA9PT0gY2F0KSlcclxuICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vLyA9PT09PSBDQVJSSU5ITyA9PT09PVxyXG5mdW5jdGlvbiBhdHVhbGl6YXJGYWIoKTogdm9pZCB7XHJcbiAgY29uc3QgZmFiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhcnRGYWInKTtcclxuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXJ0QmFkZ2UnKTtcclxuICBjb25zdCBjb3VudCA9IGNhcnRTZXJ2aWNlLmdldENvdW50KCk7XHJcbiAgaWYgKGJhZGdlKSBiYWRnZS50ZXh0Q29udGVudCA9IFN0cmluZyhjb3VudCk7XHJcbiAgaWYgKGZhYikge1xyXG4gICAgaWYgKGNvdW50ID4gMCkgZmFiLmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XHJcbiAgICBlbHNlIHsgZmFiLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7IGZlY2hhck1vZGFsKCk7IH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBlZGlyUHJvZHV0byhib3RhbzogSFRNTEVsZW1lbnQsIG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xyXG4gIGNvbnN0IGNhcmQgPSBib3Rhby5jbG9zZXN0KCcucHJvZC1jYXJkJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xyXG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHtcclxuICAgIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcclxuICAgIGNhcmQ/LmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJyk7XHJcbiAgICBhdHVhbGl6YXJGYWIoKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcclxuICBjYXJkPy5jbGFzc0xpc3QuYWRkKCdzZWxlY2lvbmFkbycpO1xyXG4gIGF0dWFsaXphckZhYigpO1xyXG4gIGFicmlyRGlhbG9nKG5vbWUsIHByZWNvKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWJyaXJEaWFsb2cobm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogdm9pZCB7XHJcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nUHJvZHV0bycpO1xyXG4gIGlmIChlbCkgZWwuaW5uZXJIVE1MID0gJzxzdHJvbmc+JyArIGVzY0hUTUwobm9tZSkgKyAnPC9zdHJvbmc+IFx1MjAxNCBSJCAnICsgTnVtYmVyKHByZWNvKS50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmVjaGFyRGlhbG9nKCk6IHZvaWQge1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmVjaGFyRGlhbG9nQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcclxuICBpZiAoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ2RpYWxvZ0JhY2tkcm9wJykgZmVjaGFyRGlhbG9nKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlyUGFyYUZpbmFsaXphcigpOiB2b2lkIHtcclxuICBmZWNoYXJEaWFsb2coKTtcclxuICBhYnJpck1vZGFsKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlcml6YXJDYXJyaW5obygpOiB2b2lkIHtcclxuICByZW5kZXJpemFyTGlzdGEoJ2xpc3RhQ2FycmluaG8nLCAndG90YWxSb2RhcGUnLCAnYmFkZ2VDb3VudCcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJpemFyTm90aWNlRW5jb21lbmRhKCk6IHZvaWQge1xyXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vdGljZUVuY29tZW5kYScpO1xyXG4gIGlmICghZWwpIHJldHVybjtcclxuICBjb25zdCBpdGVucyA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCk7XHJcbiAgY29uc3QgdGVtRm9ybWEgPSBpdGVucy5zb21lKGkgPT4gaXNCb2xvRm9ybWEoaS5ub21lKSk7XHJcbiAgY29uc3QgdGVtT3V0cm9zID0gaXRlbnMuc29tZShpID0+ICFpc0JvbG9Gb3JtYShpLm5vbWUpKTtcclxuICBpZiAodGVtRm9ybWEgJiYgdGVtT3V0cm9zKSB7XHJcbiAgICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cIm5vdGljZS1taXN0b1wiPjxzcGFuPlx1MjZBMFx1RkUwRjwvc3Bhbj48c3Bhbj48c3Ryb25nPkF0ZW5cdTAwRTdcdTAwRTNvOjwvc3Ryb25nPiBWb2NcdTAwRUEgbWlzdHVyb3UgQm9sb3MgbmEgRm9ybWEgKGZlaXRvcyBzb2IgZW5jb21lbmRhKSBjb20gb3V0cm9zIHByb2R1dG9zLiBDb25zaWRlcmUgcGVkaWRvcyBzZXBhcmFkb3MgcGFyYSBnYXJhbnRpciBvIHByYXpvITwvc3Bhbj48L2Rpdj4nO1xyXG4gIH0gZWxzZSBpZiAodGVtRm9ybWEpIHtcclxuICAgIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwibm90aWNlLWVuY29tZW5kYVwiPjxzcGFuIGNsYXNzPVwibm90aWNlLWVuY29tZW5kYS1pY29uXCI+XHUyM0YwPC9zcGFuPjxzcGFuPjxzdHJvbmc+Qm9sbyBuYSBGb3JtYSBcdTIwMTQgU29iIGVuY29tZW5kYSE8L3N0cm9uZz48YnI+RXNzZXMgYm9sb3Mgc1x1MDBFM28gcHJlcGFyYWRvcyBlc3BlY2lhbG1lbnRlIHBhcmEgdm9jXHUwMEVBLiBQcmF6byBkZSA8c3Ryb25nPjUgaG9yYXMgYSAxIGRpYSBcdTAwRkF0aWw8L3N0cm9uZz4gYXBcdTAwRjNzIGNvbmZpcm1hXHUwMEU3XHUwMEUzby48L3NwYW4+PC9kaXY+JztcclxuICB9IGVsc2Uge1xyXG4gICAgZWwuaW5uZXJIVE1MID0gJyc7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBhYnJpck1vZGFsKCk6IHZvaWQge1xyXG4gIHJlbmRlcml6YXJDYXJyaW5obygpO1xyXG4gIHJlbmRlcml6YXJOb3RpY2VFbmNvbWVuZGEoKTtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxCYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcclxuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLWFiZXJ0bycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmZWNoYXJNb2RhbCgpOiB2b2lkIHtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcclxuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ21vZGFsLWFiZXJ0bycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmZWNoYXJNb2RhbEJhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XHJcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdtb2RhbEJhY2tkcm9wJykgZmVjaGFyTW9kYWwoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVtb3ZlckRvQ2FycmluaG8obm9tZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgaWYgKCFjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybjtcclxuICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZC5zZWxlY2lvbmFkbycpLmZvckVhY2goY2FyZCA9PiB7XHJcbiAgICBjb25zdCBub21lRWwgPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kLW5vbWUnKTtcclxuICAgIGlmIChub21lRWwgJiYgbm9tZUVsLnRleHRDb250ZW50Py50cmltKCkgPT09IG5vbWUpIGNhcmQuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKTtcclxuICB9KTtcclxuICByZW5kZXJpemFyQ2FycmluaG8oKTtcclxuICBhdHVhbGl6YXJGYWIoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2VsZWNpb25hclBhZ2FtZW50byhlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGFnYW1lbnRvLW9wdCcpLmZvckVhY2gobyA9PiBvLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xyXG4gIGVsLmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XHJcbiAgY29uc3QgdGlwbyA9IChlbCBhcyBIVE1MRWxlbWVudCAmIHsgZGF0YXNldDogRE9NU3RyaW5nTWFwIH0pLmRhdGFzZXRbJ3BhZyddID8/ICcnO1xyXG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGFnYW1lbnRvU2VsZWNpb25hZG86IHRpcG8gfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxpbXBhckNhcnJpbmhvKCk6IHZvaWQge1xyXG4gIGNhcnRTZXJ2aWNlLmNsZWFyKCk7XHJcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwYWdhbWVudG9TZWxlY2lvbmFkbzogJycgfSk7XHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2FtZW50by1vcHQuYXRpdm8nKS5mb3JFYWNoKG8gPT4gby5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcclxuICBjb25zdCBvYnNFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBPYnMnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbDtcclxuICBpZiAob2JzRWwpIG9ic0VsLnZhbHVlID0gJyc7XHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZC5zZWxlY2lvbmFkbycpLmZvckVhY2goYyA9PiBjLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJykpO1xyXG4gIGF0dWFsaXphckZhYigpO1xyXG4gIGZlY2hhck1vZGFsKCk7XHJcbn1cclxuXHJcbi8vID09PT09IEJPTE8gTkEgRk9STUEgPT09PT1cclxuZnVuY3Rpb24gcGVkaXJCb2xvRm9ybWEoYm90YW86IEhUTUxFbGVtZW50LCBub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcclxuICBjb25zdCBjYXJkID0gYm90YW8uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICBpZiAoY2FydFNlcnZpY2UuaGFzKG5vbWUpKSB7XHJcbiAgICBjYXJ0U2VydmljZS5yZW1vdmUobm9tZSk7XHJcbiAgICBjYXJkPy5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpO1xyXG4gICAgYXR1YWxpemFyRmFiKCk7XHJcbiAgICByZW5kZXJpemFyTm90aWNlRW5jb21lbmRhKCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNhcnRTZXJ2aWNlLmFkZChub21lLCBwcmVjbyk7XHJcbiAgY2FyZD8uY2xhc3NMaXN0LmFkZCgnc2VsZWNpb25hZG8nKTtcclxuICBhdHVhbGl6YXJGYWIoKTtcclxuICBhYnJpckRpYWxvZ0JvbG8oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWJyaXJEaWFsb2dCb2xvKCk6IHZvaWQge1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCb2xvQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZlY2hhckRpYWxvZ0JvbG8oZT86IEV2ZW50KTogdm9pZCB7XHJcbiAgaWYgKCFlIHx8IChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdkaWFsb2dCb2xvQmFja2Ryb3AnKSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nQm9sb0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gPT09PT0gQ0FST1VTRUwgPT09PT1cclxuZnVuY3Rpb24gY2Fyb3VzZWxOZXh0KGlkOiBzdHJpbmcsIGU6IEV2ZW50KTogdm9pZCB7XHJcbiAgaWYgKGUpIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgY29uc3QgYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICBpZiAoIWMpIHJldHVybjtcclxuICBjb25zdCBpbWdzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtaW1nJyk7XHJcbiAgY29uc3QgZG90cyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWRvdCcpO1xyXG4gIGxldCBjdXIgPSAwO1xyXG4gIGltZ3MuZm9yRWFjaCgoaW1nLCBpKSA9PiB7IGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhdGl2bycpKSBjdXIgPSBpOyB9KTtcclxuICBpbWdzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XHJcbiAgZG90c1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xyXG4gIGNvbnN0IG5leHQgPSAoY3VyICsgMSkgJSBpbWdzLmxlbmd0aDtcclxuICBpbWdzW25leHRdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xyXG4gIGRvdHNbbmV4dF0/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhcm91c2VsUHJldihpZDogc3RyaW5nLCBlOiBFdmVudCk6IHZvaWQge1xyXG4gIGlmIChlKSBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gIGNvbnN0IGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgaWYgKCFjKSByZXR1cm47XHJcbiAgY29uc3QgaW1ncyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWltZycpO1xyXG4gIGNvbnN0IGRvdHMgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1kb3QnKTtcclxuICBsZXQgY3VyID0gMDtcclxuICBpbWdzLmZvckVhY2goKGltZywgaSkgPT4geyBpZiAoaW1nLmNsYXNzTGlzdC5jb250YWlucygnYXRpdm8nKSkgY3VyID0gaTsgfSk7XHJcbiAgaW1nc1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xyXG4gIGRvdHNbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcclxuICBjb25zdCBwcmV2ID0gKGN1ciAtIDEgKyBpbWdzLmxlbmd0aCkgJSBpbWdzLmxlbmd0aDtcclxuICBpbWdzW3ByZXZdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xyXG4gIGRvdHNbcHJldl0/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XHJcbn1cclxuXHJcbi8vID09PT09IENIRUNLT1VUIFx1MjAxNCAxMDAlIFdoYXRzQXBwID09PT09XHJcbmFzeW5jIGZ1bmN0aW9uIGZpbmFsaXphclBlZGlkbygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBpdGVucyA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCk7XHJcbiAgY29uc3QgdGVtRm9ybWFGaW4gPSBpdGVucy5zb21lKGkgPT4gaXNCb2xvRm9ybWEoaS5ub21lKSk7XHJcbiAgY29uc3QgdGVtT3V0cm9zRmluID0gaXRlbnMuc29tZShpID0+ICFpc0JvbG9Gb3JtYShpLm5vbWUpKTtcclxuXHJcbiAgaWYgKHRlbUZvcm1hRmluICYmIHRlbU91dHJvc0Zpbikge1xyXG4gICAgaWYgKCFjb25maXJtKCdcdTI2QTBcdUZFMEYgQXRlblx1MDBFN1x1MDBFM28hXFxuXFxuVm9jXHUwMEVBIHRlbSBCb2xvcyBuYSBGb3JtYSAoZmVpdG9zIHNvYiBlbmNvbWVuZGEpIG1pc3R1cmFkb3MgY29tIG91dHJvcyBwcm9kdXRvcy5cXG5cXG5Cb2xvcyBuYSBGb3JtYSBwcmVjaXNhbSBkZSBwcmF6byBkZSA1aCBhIDEgZGlhIFx1MDBGQXRpbCBwYXJhIHByZXBhcm8uXFxuXFxuRGVzZWphIHByb3NzZWd1aXIgbWVzbW8gYXNzaW0/JykpXHJcbiAgICAgIHJldHVybjtcclxuICB9XHJcbiAgaWYgKGl0ZW5zLmxlbmd0aCA9PT0gMCkgeyBhbGVydCgnQWRpY2lvbmUgcGVsbyBtZW5vcyB1bSBwcm9kdXRvIGFvIGNhcnJpbmhvIScpOyByZXR1cm47IH1cclxuXHJcbiAgY29uc3Qgbm9tZSA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XHJcbiAgY29uc3QgZW5kZXJlY28gPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCk/LnZhbHVlLnRyaW0oKSA/PyAnJztcclxuICBjb25zdCBvYnMgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE9icycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XHJcbiAgY29uc3QgcGFnYW1lbnRvU2VsZWNpb25hZG8gPSBhcHBTdG9yZS5nZXRTdGF0ZSgpLnBhZ2FtZW50b1NlbGVjaW9uYWRvO1xyXG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xyXG5cclxuICBpZiAoIW5vbWUpIHsgYWxlcnQoJ1BvciBmYXZvciwgaW5mb3JtZSBzZXUgbm9tZSBjb21wbGV0by4nKTsgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKT8uZm9jdXMoKTsgcmV0dXJuOyB9XHJcbiAgaWYgKCFlbmRlcmVjbykgeyBhbGVydCgnUG9yIGZhdm9yLCBpbmZvcm1lIHNldSBlbmRlcmVcdTAwRTdvLicpOyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKT8uZm9jdXMoKTsgcmV0dXJuOyB9XHJcbiAgaWYgKCFwYWdhbWVudG9TZWxlY2lvbmFkbykgeyBhbGVydCgnUG9yIGZhdm9yLCBlc2NvbGhhIGEgZm9ybWEgZGUgcGFnYW1lbnRvLicpOyByZXR1cm47IH1cclxuXHJcbiAgLy8gUmUtdmVyaWZpY2FyIHByZVx1MDBFN29zIGRvcyBib3RcdTAwRjVlcyBwYXJhIGV2aXRhciBtYW5pcHVsYVx1MDBFN1x1MDBFM28gY2xpZW50LXNpZGVcclxuICBjb25zdCBwcmljZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJ0bi1wZWRpcicpLmZvckVhY2goYnRuID0+IHtcclxuICAgIGNvbnN0IG9uY2xpY2tBdHRyID0gYnRuLmdldEF0dHJpYnV0ZSgnb25jbGljaycpID8/ICcnO1xyXG4gICAgY29uc3QgbSA9IG9uY2xpY2tBdHRyLm1hdGNoKC9wZWRpcig/OlByb2R1dG98Qm9sb0Zvcm1hKVxcKHRoaXMsJyguKz8pJywoXFxkKyg/OlxcLlxcZCspPylcXCkvKTtcclxuICAgIGlmIChtKSBwcmljZU1hcC5zZXQobVsxXSEsIHBhcnNlRmxvYXQobVsyXSEpKTtcclxuICB9KTtcclxuICBjYXJ0U2VydmljZS5yZXZhbGlkYXRlUHJpY2VzKHByaWNlTWFwKTtcclxuXHJcbiAgY29uc3QgaXRlbnNWZXJpZmljYWRvcyA9IEFycmF5LmZyb20oY2FydFNlcnZpY2UuZ2V0SXRlbXMoKSk7XHJcbiAgbGV0IHRvdGFsID0gMDtcclxuICBsZXQgbGluaGFzSXRlbnMgPSAnJztcclxuICBpdGVuc1ZlcmlmaWNhZG9zLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICB0b3RhbCA9IE1hdGgucm91bmQoKHRvdGFsICsgaXRlbS5wcmVjbykgKiAxMDApIC8gMTAwO1xyXG4gICAgbGluaGFzSXRlbnMgKz0gYFx1MjAyMiAke2l0ZW0ubm9tZX0gXHUyMDE0IFIkICR7aXRlbS5wcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpfVxcbmA7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGVuY29tZW5kYU5vdGUgPSB0ZW1Gb3JtYUZpblxyXG4gICAgPyAnXFxuXFxuXHUyM0YwICpBdGVuXHUwMEU3XHUwMEUzbzogY29udFx1MDBFOW0gaXRlbSBzb2IgZW5jb21lbmRhIFx1MjAxNCBwcmF6byBkZSA1aCBhIDEgZGlhIFx1MDBGQXRpbCBwYXJhIHByZXBhcm8uKidcclxuICAgIDogJyc7XHJcbiAgY29uc3QgbXNnID0gYCpcdUQ4M0NcdURGNzAgTk9WTyBQRURJRE8gLSBHRUxBTU9VUipcXG5cXG4qXHVEODNEXHVEQ0NCIElURU5TOipcXG4ke2xpbmhhc0l0ZW5zfVxcbipcdUQ4M0RcdURDQjAgVG90YWw6KiBSJCAke3RvdGFsLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyl9XFxuXFxuKlx1RDgzRFx1REM2NCBOb21lOiogJHtub21lfVxcbipcdUQ4M0RcdURDQ0QgRW5kZXJlXHUwMEU3bzoqICR7ZW5kZXJlY299XFxuKlx1RDgzRFx1RENCMyBQYWdhbWVudG86KiAke3BhZ2FtZW50b1NlbGVjaW9uYWRvfSR7b2JzID8gYFxcbipcdUQ4M0RcdURDREQgT2JzOiogJHtvYnN9YCA6ICcnfSR7ZW5jb21lbmRhTm90ZX1cXG5cXG5QZWRpZG8gcGVsbyBjYXJkXHUwMEUxcGlvIG9ubGluZSBcdTI3MjhgO1xyXG5cclxuICBjb25zdCBidG5GaW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuRmluYWxpemFyJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xyXG4gIGNvbnN0IHR4dE9yaWcgPSBidG5GaW4gPyAoYnRuRmluLnRleHRDb250ZW50ID8/ICcnKSA6ICcnO1xyXG4gIGlmIChidG5GaW4pIHsgYnRuRmluLmRpc2FibGVkID0gdHJ1ZTsgYnRuRmluLnRleHRDb250ZW50ID0gJ1NhbHZhbmRvIHBlZGlkby4uLic7IH1cclxuXHJcbiAgLy8gU2FsdmFyIG5vIGJhbmNvIChiZXN0LWVmZm9ydCBcdTIwMTQgblx1MDBFM28gYmxvcXVlaWEgbyBXaGF0c0FwcClcclxuICBsZXQgX3BlZGlkb0lkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcclxuICB0cnkge1xyXG4gICAgY29uc3QgY3RybCA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcclxuICAgIGNvbnN0IHRpZCA9IHNldFRpbWVvdXQoKCkgPT4gY3RybC5hYm9ydCgpLCAxMF8wMDApO1xyXG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9wZWRpZG9zJywge1xyXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXHJcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OLFxyXG4gICAgICAgICdQcmVmZXInOiAncmV0dXJuPWhlYWRlcnMtb25seSdcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIG5vbWUsIGVuZGVyZWNvLFxyXG4gICAgICAgIHBhZ2FtZW50bzogcGFnYW1lbnRvU2VsZWNpb25hZG8sXHJcbiAgICAgICAgaXRlbnM6IGl0ZW5zVmVyaWZpY2Fkb3MubWFwKGkgPT4gKHsgbm9tZTogaS5ub21lLCBwcmVjbzogaS5wcmVjbyB9KSksXHJcbiAgICAgICAgdG90YWwsXHJcbiAgICAgICAgc3RhdHVzOiAnYWd1YXJkYW5kbycsXHJcbiAgICAgICAgb2JzZXJ2YWNhbzogb2JzIHx8IG51bGwsXHJcbiAgICAgICAgY2xpZW50ZV9pZDogY2xpZW50ZUF0dWFsID8gY2xpZW50ZUF0dWFsLmlkIDogbnVsbCxcclxuICAgICAgICB0ZWxlZm9uZTogY2xpZW50ZUF0dWFsID8gY2xpZW50ZUF0dWFsLnRlbGVmb25lIDogbnVsbFxyXG4gICAgICB9KSxcclxuICAgICAgc2lnbmFsOiBjdHJsLnNpZ25hbFxyXG4gICAgfSk7XHJcbiAgICBjbGVhclRpbWVvdXQodGlkKTtcclxuICAgIGlmIChyLm9rKSB7XHJcbiAgICAgIGNvbnN0IGxvYyA9IHIuaGVhZGVycy5nZXQoJ0xvY2F0aW9uJykgPz8gJyc7XHJcbiAgICAgIGNvbnN0IGlkTWF0Y2ggPSBsb2MubWF0Y2goL2lkPWVxXFwuKFxcZCspLyk7XHJcbiAgICAgIGlmIChpZE1hdGNoKSB7XHJcbiAgICAgICAgX3BlZGlkb0lkID0gcGFyc2VJbnQoaWRNYXRjaFsxXSEsIDEwKTtcclxuICAgICAgICBpZiAoY2xpZW50ZUF0dWFsICYmIGNsaWVudGVBdHVhbC5pZCkge1xyXG4gICAgICAgICAgY2xpZW50ZVJlcG9zaXRvcnkudXBkYXRlRW5kZXJlY28oY2xpZW50ZUF0dWFsLmlkLCBlbmRlcmVjbylcclxuICAgICAgICAgICAgLmNhdGNoKChlOiB1bmtub3duKSA9PiBsb2cud2FybignTlx1MDBFM28gZm9pIHBvc3NcdTAwRUR2ZWwgc2FsdmFyIGVuZGVyZVx1MDBFN28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbG9nLndhcm4oJ0lOU0VSVCBwZWRpZG8gZmFsaG91JywgeyBzdGF0dXM6IHIuc3RhdHVzIH0pO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGxvZy53YXJuKCdFcnJvIGFvIHNhbHZhciBubyBiYW5jbyBcdTIwMTQgcGVkaWRvIHZhaSBzXHUwMEYzIHBlbG8gV2hhdHNBcHAnLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7XHJcbiAgfVxyXG5cclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGlmIChidG5GaW4pIHsgYnRuRmluLmRpc2FibGVkID0gZmFsc2U7IGJ0bkZpbi50ZXh0Q29udGVudCA9IHR4dE9yaWc7IH1cclxuICB9LCAyMDAwKTtcclxuXHJcbiAgLy8gUmVkaXJlY2lvbmFyIHBhcmEgV2hhdHNBcHBcclxuICB3aW5kb3cub3BlbignaHR0cHM6Ly93YS5tZS8nICsgV0FfTlVNQkVSICsgJz90ZXh0PScgKyBlbmNvZGVVUklDb21wb25lbnQobXNnKSwgJ19ibGFuaycpO1xyXG5cclxuICBmZWNoYXJNb2RhbCgpO1xyXG5cclxuICBpZiAoX3BlZGlkb0lkKSB7XHJcbiAgICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBlZGlkb0lkUGVuZGVudGU6IF9wZWRpZG9JZCB9KTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3YUNvbmZpcm1CYWNrZHJvcCcpPy5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gU2VtIElEIG5vIGJhbmNvIFx1MjAxNCBsaW1wYSBkaXJldG9cclxuICAgIGxpbXBhckNhcnJpbmhvKCk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBjb25maXJtYXJFbnZpb1dBKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IGlkID0gYXBwU3RvcmUuZ2V0U3RhdGUoKS5wZWRpZG9JZFBlbmRlbnRlO1xyXG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy53YUNvbmZpcm0tc2ltJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xyXG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xyXG4gIGlmICghaWQpIHsgZmVjaGFyQ29uZmlybVdBKCk7IHJldHVybjsgfVxyXG4gIGlmICghY2xpZW50ZUF0dWFsIHx8ICFjbGllbnRlQXR1YWwuaWQpIHsgZmVjaGFyQ29uZmlybVdBKCk7IGxpbXBhckNhcnJpbmhvKCk7IHJldHVybjsgfVxyXG4gIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ0NvbmZpcm1hbmRvLi4uJzsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgfVxyXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBlZGlkb1JlcG9zaXRvcnkudXBkYXRlU3RhdHVzKGlkLCBjbGllbnRlQXR1YWwuaWQsICdjb25maXJtYWRvJyk7XHJcbiAgaWYgKHJlc3VsdC5vaykge1xyXG4gICAgaWYgKGJ0bikgYnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REY4OSBQZWRpZG8gY29uZmlybWFkbyEnO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7IGZlY2hhckNvbmZpcm1XQSgpOyBsaW1wYXJDYXJyaW5obygpOyB9LCAxODAwKTtcclxuICB9IGVsc2Uge1xyXG4gICAgbG9nLndhcm4oJ0Vycm8gYW8gY29uZmlybWFyIHBlZGlkbycsIHsgZXJyb3I6IHJlc3VsdC5lcnJvci5tZXNzYWdlIH0pO1xyXG4gICAgZmVjaGFyQ29uZmlybVdBKCk7XHJcbiAgICBsaW1wYXJDYXJyaW5obygpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZmVjaGFyQ29uZmlybVdBKCk6IHZvaWQge1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3YUNvbmZpcm1CYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcclxuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBlZGlkb0lkUGVuZGVudGU6IG51bGwgfSk7XHJcbn1cclxuXHJcbi8vID09PT09IExPR0lOIFVJID09PT09XHJcbmZ1bmN0aW9uIG1hc2NhcmFUZWxlZm9uZShlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xyXG4gIGVsLnZhbHVlID0gYXBsaWNhck1hc2NhcmFUZWxlZm9uZShlbC52YWx1ZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVudHJhckNvbUNsaWVudGUoY2xpZW50ZVJhdzogQ2xpZW50ZSk6IHZvaWQge1xyXG4gIGNvbnN0IGRvbWFpbkNsaWVudGUgPSBDbGllbnRlRW50aXR5LmZyb21EQihjbGllbnRlUmF3KTtcclxuICBsb2dpblVzZUNhc2UubG9naW4oZG9tYWluQ2xpZW50ZSk7XHJcblxyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk92ZXJsYXknKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICBjb25zdCB1c3VhcmlvQmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzdWFyaW9CYXInKTtcclxuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4JztcclxuICBjb25zdCB1c3VhcmlvTm9tZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzdWFyaW9Ob21lJyk7XHJcbiAgaWYgKHVzdWFyaW9Ob21lRWwpIHVzdWFyaW9Ob21lRWwudGV4dENvbnRlbnQgPSBjbGllbnRlUmF3Lm5vbWU7XHJcbiAgY29uc3Qgcm9sZXRhQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkZsdXR1YW50ZScpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICBpZiAocm9sZXRhQnRuKSByb2xldGFCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcclxuICBjb25zdCB1c3VhcmlvVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzdWFyaW9UZWwnKTtcclxuICBpZiAodXN1YXJpb1RlbCkgdXN1YXJpb1RlbC50ZXh0Q29udGVudCA9IGNsaWVudGVSYXcudGVsZWZvbmUucmVwbGFjZSgvXihcXGR7Mn0pKFxcZHs1fSkoXFxkezR9KSQvLCAnKCQxKSAkMi0kMycpO1xyXG4gIGNvbnN0IGlucE5vbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsO1xyXG4gIGlmIChpbnBOb21lKSBpbnBOb21lLnZhbHVlID0gY2xpZW50ZVJhdy5ub21lO1xyXG4gIGNvbnN0IGlucEVuZGVyZWNvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGw7XHJcbiAgaWYgKGlucEVuZGVyZWNvICYmIGNsaWVudGVSYXcuZW5kZXJlY28pIGlucEVuZGVyZWNvLnZhbHVlID0gY2xpZW50ZVJhdy5lbmRlcmVjbztcclxufVxyXG5cclxuZnVuY3Rpb24gaXJQYXJhRXRhcGFDYWRhc3Rybyh0ZWxJbnB1dDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xyXG4gIGNvbnN0IGV0YXBhVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhVGVsZWZvbmUnKTtcclxuICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XHJcbiAgaWYgKGV0YXBhVGVsKSBldGFwYVRlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gIGlmIChldGFwYUNhZCkgZXRhcGFDYWQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgdGVsSW5wdXQuZGF0YXNldFsndGVsJ10gPSB0ZWxJbnB1dC52YWx1ZS5yZXBsYWNlKC9cXEQvZywgJycpO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk5vbWUnKT8uZm9jdXMoKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyVGVsZWZvbmUoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgaWYgKF92ZXJpZmljYW5kbykgcmV0dXJuO1xyXG4gIGNvbnN0IHRlbElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gIGNvbnN0IGVycm8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5FcnJvJyk7XHJcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2V0YXBhVGVsZWZvbmUgYnV0dG9uJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xyXG4gIGlmIChlcnJvKSBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnVmVyaWZpY2FuZG8uLi4nOyBidG4uZGlzYWJsZWQgPSB0cnVlOyB9XHJcbiAgX3ZlcmlmaWNhbmRvID0gdHJ1ZTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLmV4ZWN1dGUodGVsSW5wdXQudmFsdWUpO1xyXG4gICAgaWYgKCFyZXN1bHQub2spIHtcclxuICAgICAgY29uc3QgaXNVc2VyTXNnID0gcmVzdWx0LmVycm9yLm5hbWUgPT09ICdWYWxpZGF0aW9uRXJyb3InIHx8IHJlc3VsdC5lcnJvci5uYW1lID09PSAnUmF0ZUxpbWl0RXJyb3InO1xyXG4gICAgICBpZiAoaXNVc2VyTXNnKSB7XHJcbiAgICAgICAgaWYgKGVycm8pIHsgZXJyby50ZXh0Q29udGVudCA9IHJlc3VsdC5lcnJvci5tZXNzYWdlOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIEJhbmNvIGluZGlzcG9uXHUwMEVEdmVsOiBuXHUwMEUzbyBibG9xdWVpYSBhIHZlbmRhIFx1MjAxNCBzZWd1ZSBwYXJhIG8gbm9tZSBlIGVudHJhIG5vIGNhcmRcdTAwRTFwaW8uXHJcbiAgICAgIC8vIE8gcGVkaWRvIHNhaSBwZWxvIFdoYXRzQXBwIGUgblx1MDBFM28gZGVwZW5kZSBkbyBiYW5jby5cclxuICAgICAgbG9nLndhcm4oJ1NlcnZpZG9yIGluZGlzcG9uXHUwMEVEdmVsIG5vIGxvZ2luIFx1MjAxNCBzZWd1aW5kbyBzZW0gY2FkYXN0cm8nLCB7IGVycm9yOiByZXN1bHQuZXJyb3IubWVzc2FnZSB9KTtcclxuICAgICAgaXJQYXJhRXRhcGFDYWRhc3Rybyh0ZWxJbnB1dCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmIChyZXN1bHQudmFsdWUuZXhpc3RlICYmIHJlc3VsdC52YWx1ZS5jbGllbnRlKSB7XHJcbiAgICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLmNsaWVudGUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpclBhcmFFdGFwYUNhZGFzdHJvKHRlbElucHV0KTtcclxuICAgIH1cclxuICB9IGNhdGNoIHtcclxuICAgIGlyUGFyYUV0YXBhQ2FkYXN0cm8odGVsSW5wdXQpO1xyXG4gIH0gZmluYWxseSB7XHJcbiAgICBpZiAoYnRuKSB7IGJ0bi50ZXh0Q29udGVudCA9ICdDb250aW51YXIgXHUyMTkyJzsgYnRuLmRpc2FibGVkID0gZmFsc2U7IH1cclxuICAgIF92ZXJpZmljYW5kbyA9IGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gY2FkYXN0cmFyKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGlmIChfY2FkYXN0cmFuZG8pIHJldHVybjtcclxuICBjb25zdCBub21lSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5Ob21lJykgYXMgSFRNTElucHV0RWxlbWVudDtcclxuICBjb25zdCB0ZWxJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpblRlbGVmb25lJykgYXMgSFRNTElucHV0RWxlbWVudDtcclxuICBjb25zdCBub21lID0gbm9tZUlucHV0LnZhbHVlO1xyXG4gIGNvbnN0IHRlbCA9ICh0ZWxJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50ICYgeyBkYXRhc2V0OiBET01TdHJpbmdNYXAgfSkuZGF0YXNldFsndGVsJ10gPz8gJyc7XHJcbiAgY29uc3QgZXJybyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYWRhc3Ryb0Vycm8nKTtcclxuICBpZiAoIW5vbWUudHJpbSgpKSB7XHJcbiAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ0RpZ2l0ZSBzZXUgbm9tZS4nOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGlmIChlcnJvKSBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2V0YXBhQ2FkYXN0cm8gYnV0dG9uJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xyXG4gIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ0VudHJhbmRvLi4uJzsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgfVxyXG4gIF9jYWRhc3RyYW5kbyA9IHRydWU7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxvZ2luVXNlQ2FzZS5yZWdpc3Rlcihub21lLCB0ZWwsICcnKTtcclxuICAgIGlmICghcmVzdWx0Lm9rKSB7XHJcbiAgICAgIGlmIChyZXN1bHQuZXJyb3IubmFtZSA9PT0gJ1ZhbGlkYXRpb25FcnJvcicgfHwgcmVzdWx0LmVycm9yLm5hbWUgPT09ICdSYXRlTGltaXRFcnJvcicpIHtcclxuICAgICAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gcmVzdWx0LmVycm9yLm1lc3NhZ2U7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgbG9nLndhcm4oJ1NlcnZpZG9yIGluZGlzcG9uXHUwMEVEdmVsIG5vIGNhZGFzdHJvIFx1MjAxNCBlbnRyYW5kbyBzZW0gc2FsdmFyJywgeyBlcnJvcjogcmVzdWx0LmVycm9yLm1lc3NhZ2UgfSk7XHJcbiAgICAgIGVudHJhckNvbUNsaWVudGUoQ2xpZW50ZUVudGl0eS5jcmVhdGUoeyBub21lLCB0ZWxlZm9uZTogdGVsLCBlbmRlcmVjbzogJycgfSkudG9KU09OKCkgYXMgQ2xpZW50ZSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLnRvSlNPTigpIGFzIENsaWVudGUpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgdHJ5IHtcclxuICAgICAgZW50cmFyQ29tQ2xpZW50ZShDbGllbnRlRW50aXR5LmNyZWF0ZSh7IG5vbWUsIHRlbGVmb25lOiB0ZWwsIGVuZGVyZWNvOiAnJyB9KS50b0pTT04oKSBhcyBDbGllbnRlKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ0NvbmZpcmEgc2V1IG5vbWUgZSB0ZWxlZm9uZSBlIHRlbnRlIG5vdmFtZW50ZS4nOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XHJcbiAgICB9XHJcbiAgfSBmaW5hbGx5IHtcclxuICAgIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ0VudHJhciBubyBjYXJkXHUwMEUxcGlvIFx1MjcyOCc7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyB9XHJcbiAgICBfY2FkYXN0cmFuZG8gPSBmYWxzZTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZvbHRhckV0YXBhVGVsZWZvbmUoKTogdm9pZCB7XHJcbiAgY29uc3QgZXRhcGFDYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFDYWRhc3RybycpO1xyXG4gIGNvbnN0IGV0YXBhVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhVGVsZWZvbmUnKTtcclxuICBpZiAoZXRhcGFDYWQpIGV0YXBhQ2FkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgaWYgKGV0YXBhVGVsKSBldGFwYVRlbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxufVxyXG5cclxuZnVuY3Rpb24gc2FpcigpOiB2b2lkIHtcclxuICBpZiAoIWNvbmZpcm0oJ0Rlc2VqYSBzYWlyIGRhIHN1YSBjb250YT8nKSkgcmV0dXJuO1xyXG4gIGxvZ2luVXNlQ2FzZS5sb2dvdXQoKTtcclxuICBjb25zdCB1c3VhcmlvQmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzdWFyaW9CYXInKTtcclxuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wTm9tZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlID0gJyc7XHJcbiAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBFbmRlcmVjbycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlID0gJyc7XHJcbiAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpblRlbGVmb25lJykgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSAnJztcclxuICBjb25zdCBldGFwYVRlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYVRlbGVmb25lJyk7XHJcbiAgY29uc3QgZXRhcGFDYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFDYWRhc3RybycpO1xyXG4gIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgaWYgKGV0YXBhQ2FkKSBldGFwYUNhZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk92ZXJsYXknKSEuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcclxufVxyXG5cclxuZnVuY3Rpb24gbW9zdHJhckxvZ2luKCk6IHZvaWQge1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk92ZXJsYXknKSEuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcclxuICBzZXRUaW1lb3V0KCgpID0+IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpPy5mb2N1cygpLCAzMDApO1xyXG59XHJcblxyXG4vLyA9PT09PSBST0xFVEEgVUkgPT09PT1cclxuYXN5bmMgZnVuY3Rpb24gYWJyaXJSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgYmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQmFja2Ryb3AnKTtcclxuICBpZiAoIWJkKSByZXR1cm47XHJcbiAgYmQuY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XHJcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdtb2RhbC1hYmVydG8nKTtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhU3RhdHVzQm94JykhLmlubmVySFRNTCA9ICcnO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbmF0aXZhJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YU5hb0xvZ2FkbycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCdG5FbnZpYXJXcmFwJykhLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFXaGVlbFNlY3Rpb24nKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSmFHaXJvdScpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFSZXN1bHRhZG8nKSEuY2xhc3NMaXN0LnJlbW92ZSgndmlzaXZlbCcpO1xyXG5cclxuICBjb25zdCBjZmcgPSBhd2FpdCBjYXJyZWdhckNvbmZpZ1JvbGV0YSgpO1xyXG4gIGNvbnN0IHByZW1pb3MgPSBnZXRQcmVtaW9zKCk7XHJcblxyXG4gIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhUHJlbWlvc0dyaWQnKTtcclxuICBpZiAoZ3JpZCkge1xyXG4gICAgY29uc3QgaWNvbmVzID0gWydcdUQ4M0NcdURGNkInLCAnXHVEODNFXHVEREMxJywgJ1x1RDgzRFx1REU5QScsICdcdUQ4M0RcdURDQjgnLCAnXHVEODNEXHVEQ0IwJywgJ1x1RDgzQ1x1REY4OScsICdcdUQ4M0NcdURGNkUnLCAnXHVEODNDXHVERjgwJywgJ1x1RDgzQ1x1REYxRiddO1xyXG4gICAgZ3JpZC5pbm5lckhUTUwgPSBwcmVtaW9zLm1hcCgocCwgaSkgPT4gYDxkaXYgY2xhc3M9XCJyb2xldGEtcHJlbWlvLWl0ZW1cIj4ke2ljb25lc1tpICUgaWNvbmVzLmxlbmd0aF19ICR7ZXNjSFRNTChwKX08L2Rpdj5gKS5qb2luKCcnKTtcclxuICB9XHJcblxyXG4gIGlmIChjZmcgJiYgIWNmZy5hdGl2YSkge1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluYXRpdmEnKSEuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdHJ1Y29lcycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gIH1cclxuXHJcbiAgZGVzZW5oYXJSb2xldGEocHJlbWlvcyk7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVdoZWVsU2VjdGlvbicpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHJcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XHJcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFOYW9Mb2dhZG8nKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICBjb25zdCBnaXJhckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcclxuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzEnOyBnaXJhckJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGQTEgR0lSQVIgQUdPUkEhJzsgfVxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhdHVzID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcclxuICBhdHVhbGl6YXJVSVJvbGV0YShzdGF0dXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmZWNoYXJSb2xldGEoKTogdm9pZCB7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJhY2tkcm9wJyk/LmNsYXNzTGlzdC5yZW1vdmUoJ2FiZXJ0bycpO1xyXG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtYWJlcnRvJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZlY2hhclJvbGV0YUJhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XHJcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdyb2xldGFCYWNrZHJvcCcpIGZlY2hhclJvbGV0YSgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhdHVhbGl6YXJVSVJvbGV0YShpbmZvOiBQYXJ0aWNpcGFjYW8gfCBudWxsKTogdm9pZCB7XHJcbiAgY29uc3Qgc3RhdHVzQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVN0YXR1c0JveCcpITtcclxuICBjb25zdCBpbnN0cnVjb2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluc3RydWNvZXMnKSE7XHJcbiAgY29uc3QgYnRuRW52aWFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkVudmlhcldyYXAnKSE7XHJcbiAgY29uc3Qgd2hlZWxTZWN0aW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVdoZWVsU2VjdGlvbicpITtcclxuICBjb25zdCBqYUdpcm91ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3UnKSE7XHJcbiAgY29uc3QgZ2lyYXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XHJcblxyXG4gIHdoZWVsU2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuICBkZXNlbmhhclJvbGV0YShnZXRQcmVtaW9zKCkpO1xyXG5cclxuICBpZiAoaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHtcclxuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzEnOyBnaXJhckJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGQTEgR0lSQVIgQUdPUkEhJzsgfVxyXG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICcnO1xyXG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoIWluZm8pIHtcclxuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnJztcclxuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgICBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgICBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IGdpcmFyQnRuLnRpdGxlID0gJ0VudmllIHN1YXMgcHJvdmFzIHBhcmEgbGliZXJhciBhIHJvbGV0YSc7IH1cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChpbmZvLnN0YXR1cyA9PT0gJ3BlbmRlbnRlJykge1xyXG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1wZW5kZW50ZVwiPlx1MjNGMyA8ZGl2PjxzdHJvbmc+UGFydGljaXBhXHUwMEU3XHUwMEUzbyBlbnZpYWRhITwvc3Ryb25nPjxicj5TdWFzIHByb3ZhcyBlc3RcdTAwRTNvIGVtIGFuXHUwMEUxbGlzZS4gQWd1YXJkZSBhIGFwcm92YVx1MDBFN1x1MDBFM28gKGF0XHUwMEU5IDI0aCkuPC9kaXY+PC9kaXY+JztcclxuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IGdpcmFyQnRuLnRpdGxlID0gJ0FndWFyZGFuZG8gYXByb3ZhXHUwMEU3XHUwMEUzbyc7IH1cclxuICB9IGVsc2UgaWYgKGluZm8uc3RhdHVzID09PSAncmVqZWl0YWRvJykge1xyXG4gICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1yZWplaXRhZG9cIj5cdTI3NEMgPGRpdj48c3Ryb25nPlBhcnRpY2lwYVx1MDBFN1x1MDBFM28gblx1MDBFM28gYXByb3ZhZGEuPC9zdHJvbmc+PGJyPlRlbnRlIG5vdmFtZW50ZSBjdW1wcmluZG8gdG9kb3Mgb3MgcmVxdWlzaXRvcy48L2Rpdj48L2Rpdj4nO1xyXG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IH1cclxuICB9IGVsc2UgaWYgKGluZm8uc3RhdHVzID09PSAnYXByb3ZhZG8nICYmICFpbmZvLmphX2dpcm91KSB7XHJcbiAgICBjb25zdCBob2plID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XHJcbiAgICBjb25zdCBkaWFBcHJvdmFjYW8gPSBpbmZvLmRhdGFfYXByb3ZhY2FvID8gaW5mby5kYXRhX2Fwcm92YWNhby5zcGxpdCgnVCcpWzBdIDogbnVsbDtcclxuICAgIGlmIChkaWFBcHJvdmFjYW8gIT09IGhvamUpIHtcclxuICAgICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1yZWplaXRhZG9cIj5cdTIzRjAgPGRpdj48c3Ryb25nPlByYXpvIGV4cGlyYWRvLjwvc3Ryb25nPjxicj5Wb2NcdTAwRUEgZm9pIGFwcm92YWRvIGVtIG91dHJvIGRpYSBlIG5cdTAwRTNvIGdpcm91IGEgdGVtcG8uIEVudmllIG5vdmFzIHByb3ZhcyBwYXJhIHBhcnRpY2lwYXIgbm92YW1lbnRlLjwvZGl2PjwvZGl2Pic7XHJcbiAgICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNEXHVERDEyIFByYXpvIGV4cGlyYWRvJzsgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1hcHJvdmFkb1wiPlx1MjcwNSA8ZGl2PjxzdHJvbmc+QXByb3ZhZG8hIEdpcmUgaG9qZSE8L3N0cm9uZz48YnI+Vm9jXHUwMEVBIHRlbSBhdFx1MDBFOSBtZWlhLW5vaXRlIHBhcmEgdXNhciBzZXUgZ2lyby4gTlx1MDBFM28gYWN1bXVsYSE8L2Rpdj48L2Rpdj4nO1xyXG4gICAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzEnOyBnaXJhckJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGQTEgR0lSQVIgQUdPUkEhJzsgfVxyXG4gICAgfVxyXG4gIH0gZWxzZSBpZiAoaW5mby5qYV9naXJvdSAmJiAhaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHtcclxuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnJztcclxuICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IH1cclxuICAgIGNvbnN0IHByZW1pb0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3VQcmVtaW8nKTtcclxuICAgIGlmIChwcmVtaW9FbCkge1xyXG4gICAgICBwcmVtaW9FbC5pbm5lckhUTUwgPSBpbmZvLnByZW1pb1xyXG4gICAgICAgID8gJ1NldSBwclx1MDBFQW1pbyBmb2k6IDxzdHJvbmcgc3R5bGU9XCJjb2xvcjp2YXIoLS1yb3NhKVwiPicgKyBlc2NIVE1MKGluZm8ucHJlbWlvKSArICc8L3N0cm9uZz4uIEVudHJlIGVtIGNvbnRhdG8gY29ub3NjbyBwYXJhIHJlc2dhdGFyISdcclxuICAgICAgICA6ICdWb2NcdTAwRUEgalx1MDBFMSB1c291IHN1YSBjaGFuY2UgbmVzdGEgY2FtcGFuaGEuJztcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdpcmFyUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xyXG4gIGlmICghY2xpZW50ZUF0dWFsKSB7IG1vc3RyYXJUb2FzdCgnRmFcdTAwRTdhIGxvZ2luIHBhcmEgZ2lyYXIgYSByb2xldGEhJywgJ2Vycm8nKTsgcmV0dXJuOyB9XHJcblxyXG4gIGNvbnN0IHN0YXR1c0dpcm8gPSBhd2FpdCB2ZXJpZmljYXJTdGF0dXNSb2xldGEoY2xpZW50ZUF0dWFsLmlkID8/IDApO1xyXG4gIGlmICghaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHtcclxuICAgIGlmICghc3RhdHVzR2lybyB8fCBzdGF0dXNHaXJvLnN0YXR1cyAhPT0gJ2Fwcm92YWRvJyB8fCBzdGF0dXNHaXJvLmphX2dpcm91KSB7XHJcbiAgICAgIG1vc3RyYXJUb2FzdCgnVm9jXHUwMEVBIHByZWNpc2Egc2VyIGFwcm92YWRvIHBlbGEgZXF1aXBlIGFudGVzIGRlIGdpcmFyIScsICdlcnJvJyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHNlbWFuYSA9IGdldFNlbWFuYUF0dWFsKCk7XHJcbiAgICAgIGNvbnN0IGNvdW50UmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5jb3VudFZlbmNlZG9yZXNTZW1hbmEoc2VtYW5hKTtcclxuICAgICAgY29uc3QgdmVuY2Vkb3Jlc0NvdW50ID0gY291bnRSZXN1bHQub2sgPyBjb3VudFJlc3VsdC52YWx1ZSA6IDA7XHJcblxyXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goYCR7U1VQQUJBU0VfVVJMfS9yZXN0L3YxL3JvbGV0YV9jb25maWc/aWQ9ZXEuMSZzZWxlY3Q9bWF4X3ZlbmNlZG9yZXNfc2VtYW5hYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBjb25zdCBjZmcgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBBcnJheTx7IG1heF92ZW5jZWRvcmVzX3NlbWFuYTogbnVtYmVyIH0+O1xyXG4gICAgICBjb25zdCBsaW1pdGUgPSBjZmdbMF0/Lm1heF92ZW5jZWRvcmVzX3NlbWFuYSA/PyAxO1xyXG4gICAgICBpZiAodmVuY2Vkb3Jlc0NvdW50ID49IGxpbWl0ZSkge1xyXG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcclxuICAgICAgICBpZiAoYnRuKSB7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IH1cclxuICAgICAgICBjb25zdCByZXN1bHRFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFSZXN1bHRhZG8nKTtcclxuICAgICAgICBpZiAocmVzdWx0RWwpIHtcclxuICAgICAgICAgIHJlc3VsdEVsLmlubmVySFRNTCA9ICdcdTI2QTBcdUZFMEYgPHN0cm9uZz5KXHUwMEUxIHRlbW9zIHVtIGdhbmhhZG9yIGVzdGEgc2VtYW5hITwvc3Ryb25nPjxicj48c21hbGw+QSBwclx1MDBGM3hpbWEgcm9kYWRhIGNvbWVcdTAwRTdhIG5hIHNlbWFuYSBxdWUgdmVtLiBGaXF1ZSBkZSBvbGhvITwvc21hbGw+JztcclxuICAgICAgICAgIHJlc3VsdEVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2l2ZWwnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7IGxvZy53YXJuKCdFcnJvIGFvIHZlcmlmaWNhciBsaW1pdGUgc2VtYW5hbCcsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTsgfVxyXG4gIH1cclxuXHJcbiAgYXdhaXQgZ2lyYXJSb2xldGFGbihjbGllbnRlQXR1YWwsIChwcmVtaW86IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3QgcmVzdWx0RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhUmVzdWx0YWRvJyk7XHJcbiAgICBpZiAocmVzdWx0RWwpIHtcclxuICAgICAgcmVzdWx0RWwuaW5uZXJIVE1MID0gJ1x1RDgzQ1x1REY4OSBWb2NcdTAwRUEgZ2FuaG91OiA8c3Ryb25nIHN0eWxlPVwiY29sb3I6dmFyKC0tcm9zYSlcIj4nICsgZXNjSFRNTChwcmVtaW8pICsgJzwvc3Ryb25nPiE8YnI+PHNtYWxsIHN0eWxlPVwiZm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tdGV4dG8tc2VjKVwiPkVudHJlIGVtIGNvbnRhdG8gY29ub3NjbyBwZWxvIFdoYXRzQXBwIHBhcmEgcmVzZ2F0YXIgc2V1IHByXHUwMEVBbWlvITwvc21hbGw+JztcclxuICAgICAgcmVzdWx0RWwuY2xhc3NMaXN0LmFkZCgndmlzaXZlbCcpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUdpcmFyQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xyXG4gICAgaWYgKGJ0bikgYnRuLnRleHRDb250ZW50ID0gJ1x1MjcxMyBHaXJhZG8hJztcclxuICAgIHNhbHZhclZlbmNlZG9yKGNsaWVudGVBdHVhbCwgcHJlbWlvKS5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZW52aWFyUHJvdmFzV2hhdHNBcHAoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XHJcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHsgYWxlcnQoJ0ZhXHUwMEU3YSBsb2dpbiBhbnRlcyBkZSBlbnZpYXIgc3VhcyBwcm92YXMuJyk7IHJldHVybjsgfVxyXG4gIGNvbnN0IHN0YXR1c0F0dWFsID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcclxuICBpZiAoc3RhdHVzQXR1YWwgJiYgKHN0YXR1c0F0dWFsLnN0YXR1cyA9PT0gJ3BlbmRlbnRlJyB8fCBzdGF0dXNBdHVhbC5zdGF0dXMgPT09ICdhcHJvdmFkbycpKSB7XHJcbiAgICBhdHVhbGl6YXJVSVJvbGV0YShzdGF0dXNBdHVhbCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IG5vbWUgPSBjbGllbnRlQXR1YWwubm9tZSB8fCAnJztcclxuICBjb25zdCB0ZWwgPSBjbGllbnRlQXR1YWwudGVsZWZvbmUgfHwgJyc7XHJcbiAgY29uc3QgaW5zdEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluc3RhZ3JhbUlucHV0JykgYXMgSFRNTElucHV0RWxlbWVudCB8IG51bGw7XHJcbiAgY29uc3QgaW5zdGFncmFtID0gaW5zdEVsID8gaW5zdEVsLnZhbHVlLnRyaW0oKSA6ICcnO1xyXG4gIGNvbnN0IG1zZyA9IGBPbFx1MDBFMSwgZXF1aXBlIEdlbGFtb3VyISBRdWVybyBwYXJ0aWNpcGFyIGRhIFJvbGV0YSBWSVAuXFxuXFxuTm9tZTogJHtub21lfVxcblRlbGVmb25lOiAke3RlbH0ke2luc3RhZ3JhbSA/ICdcXG5JbnN0YWdyYW06ICcgKyBpbnN0YWdyYW0gOiAnJ31cXG5cXG5Fc3RvdSBlbnZpYW5kbyBhIGZvdG8gZG9zIG1ldXMgNSBhZGVzaXZvcyBlIG8gcHJpbnQgZG8gU3RvcnkgcGFyYSB2YWxpZGFcdTAwRTdcdTAwRTNvIWA7XHJcbiAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG1zZyksICdfYmxhbmsnKTtcclxuICBhd2FpdCByZWdpc3RyYXJQYXJ0aWNpcGFjYW8oaW5zdGFncmFtKTtcclxuICBhdHVhbGl6YXJVSVJvbGV0YSh7IHN0YXR1czogJ3BlbmRlbnRlJywgamFfZ2lyb3U6IGZhbHNlIH0gYXMgUGFydGljaXBhY2FvKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVnaXN0cmFyUGFydGljaXBhY2FvKGluc3RhZ3JhbTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XHJcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHJldHVybjtcclxuICB0cnkge1xyXG4gICAgY29uc3QgY2hlY2sgPSBhd2FpdCB2ZXJpZmljYXJTdGF0dXNSb2xldGEoY2xpZW50ZUF0dWFsLmlkID8/IDApO1xyXG4gICAgaWYgKGNoZWNrICYmIGNoZWNrLnN0YXR1cyAhPT0gJ3JlamVpdGFkbycpIHJldHVybjtcclxuICAgIGNvbnN0IHNlbWFuYSA9IGdldFNlbWFuYUF0dWFsKCk7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByb2xldGFSZXBvc2l0b3J5LnNhdmVQYXJ0aWNpcGFjYW8oe1xyXG4gICAgICBub21lOiBjbGllbnRlQXR1YWwubm9tZSxcclxuICAgICAgdGVsZWZvbmU6IGNsaWVudGVBdHVhbC50ZWxlZm9uZSxcclxuICAgICAgaW5zdGFncmFtOiBpbnN0YWdyYW0gfHwgdW5kZWZpbmVkLFxyXG4gICAgICBzdGF0dXM6ICdwZW5kZW50ZScsXHJcbiAgICAgIHNlbWFuYSxcclxuICAgICAgamFfZ2lyb3U6IGZhbHNlLFxyXG4gICAgICBjcmVhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICB9IGFzIGltcG9ydCgnLi9kb21haW4vcm9sZXRhJykuUGFydGljaXBhY2FvUHJvcHMpO1xyXG4gICAgaWYgKHJlc3VsdC5vaykge1xyXG4gICAgICBzZXRQYXJ0aWNpcGFjYW9JZChyZXN1bHQudmFsdWUuaWQpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGUpIHsgbG9nLndhcm4oJ0Vycm8gYW8gcmVnaXN0cmFyIHBhcnRpY2lwYVx1MDBFN1x1MDBFM28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7IH1cclxufVxyXG5cclxuLy8gPT09PT0gQURNSU4gUk9MRVRBID09PT09XHJcbmZ1bmN0aW9uIHZlcmlmaWNhckFkbWluKCk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBhcHBTdG9yZS5nZXRTdGF0ZSgpLmlzQWRtaW47XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGFicmlyUm9sZXRhQWRtaW4oKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgaWYgKCF2ZXJpZmljYXJBZG1pbigpKSB7IGFsZXJ0KCdBY2Vzc28gcmVzdHJpdG8uJyk7IHJldHVybjsgfVxyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFBZG1pbkJhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xyXG4gIGF3YWl0IGNhcnJlZ2FyUGFydGljaXBhbnRlc1JvbGV0YSgpO1xyXG4gIGF3YWl0IGNhcnJlZ2FyQ29uZmlnQWRtaW4oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhQWRtaW4oKTogdm9pZCB7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUFkbWluQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcclxuICBpZiAoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ3JvbGV0YUFkbWluQmFja2Ryb3AnKSBmZWNoYXJSb2xldGFBZG1pbigpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhYnJpclRhYkFkbWluKHRhYjogc3RyaW5nLCBidG46IEhUTUxFbGVtZW50KTogdm9pZCB7XHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvbGV0YS1hZG1pbi10YWInKS5mb3JFYWNoKHQgPT4gdC5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcclxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm9sZXRhLWFkbWluLXBhbmVsJykuZm9yRWFjaChwID0+IHAuY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKSk7XHJcbiAgYnRuLmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XHJcbiAgY29uc3QgdGFiSWQgPSAndGFiJyArIHRhYi5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRhYi5zbGljZSgxKTtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YWJJZCk/LmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XHJcbiAgaWYgKHRhYiA9PT0gJ3BlbmRlbnRlcycpIGNhcnJlZ2FyUGFydGljaXBhbnRlc1JvbGV0YSgpO1xyXG4gIGVsc2UgaWYgKHRhYiA9PT0gJ2Fwcm92YWRvcycpIGNhcnJlZ2FyQXByb3ZhZG9zUm9sZXRhKCk7XHJcbiAgZWxzZSBpZiAodGFiID09PSAndmVuY2Vkb3JlcycpIGNhcnJlZ2FyVmVuY2Vkb3Jlc1JvbGV0YSgpO1xyXG4gIGVsc2UgaWYgKHRhYiA9PT0gJ2NvbmZpZycpIGNhcnJlZ2FyQ29uZmlnQWRtaW4oKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJQYXJ0aWNpcGFudGVzUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpc3RhUGVuZGVudGVzJyk7XHJcbiAgaWYgKCFlbCkgcmV0dXJuO1xyXG4gIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+Q2FycmVnYW5kby4uLjwvZGl2Pic7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/c3RhdHVzPWVxLnBlbmRlbnRlJm9yZGVyPWNyZWF0ZWRfYXQuZGVzYycsIHtcclxuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cclxuICAgIH0pO1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PFBhcnRpY2lwYWNhbz47XHJcbiAgICBpZiAoIWRhdGEgfHwgIWRhdGEubGVuZ3RoKSB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+TmVuaHVtIHBhcnRpY2lwYW50ZSBwZW5kZW50ZS48L2Rpdj4nOyByZXR1cm47IH1cclxuICAgIGVsLmlubmVySFRNTCA9IGRhdGEubWFwKHAgPT4ge1xyXG4gICAgICBjb25zdCBkdCA9IG5ldyBEYXRlKHAuY3JlYXRlZF9hdCkudG9Mb2NhbGVTdHJpbmcoJ3B0LUJSJyk7XHJcbiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtaXRlbVwiPicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1pbmZvXCI+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLW5vbWVcIj4nICsgZXNjSFRNTChwLm5vbWUgPz8gJycpICsgJzwvZGl2PicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS10ZWxcIj4nICsgZXNjSFRNTChwLnRlbGVmb25lKSArIChwLmluc3RhZ3JhbSA/ICcgXHUwMEI3IEAnICsgZXNjSFRNTChwLmluc3RhZ3JhbSkgOiAnJykgKyAnPC9kaXY+JyArXHJcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTFweDtjb2xvcjojOTk5XCI+JyArIGR0ICsgJzwvZGl2PicgK1xyXG4gICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtYWNvZXNcIj4nICtcclxuICAgICAgICAnPGJ1dHRvbiBjbGFzcz1cImJ0bi1hcHJvdmFyXCIgb25jbGljaz1cImFwcm92YXJQYXJ0aWNpcGFudGUoJyArIHAuaWQgKyAnLCB0aGlzKVwiPlx1MjcxMyBBcHJvdmFyPC9idXR0b24+JyArXHJcbiAgICAgICAgJzxidXR0b24gY2xhc3M9XCJidG4tcmVqZWl0YXJcIiBvbmNsaWNrPVwicmVqZWl0YXJQYXJ0aWNpcGFudGUoJyArIHAuaWQgKyAnLCB0aGlzKVwiPlx1MjcxNyBSZWplaXRhcjwvYnV0dG9uPicgK1xyXG4gICAgICAgICc8L2Rpdj48L2Rpdj4nO1xyXG4gICAgfSkuam9pbignJyk7XHJcbiAgfSBjYXRjaCB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+RXJybyBhbyBjYXJyZWdhci48L2Rpdj4nOyB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNhcnJlZ2FyQXByb3ZhZG9zUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpc3RhQXByb3ZhZG9zJyk7XHJcbiAgaWYgKCFlbCkgcmV0dXJuO1xyXG4gIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+Q2FycmVnYW5kby4uLjwvZGl2Pic7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/c3RhdHVzPWVxLmFwcm92YWRvJm9yZGVyPWRhdGFfYXByb3ZhY2FvLmRlc2MnLCB7XHJcbiAgICAgIGhlYWRlcnM6IHsgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiB9XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByLmpzb24oKSBhcyBBcnJheTxQYXJ0aWNpcGFjYW8+O1xyXG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmxlbmd0aCkgeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPk5lbmh1bSBhcHJvdmFkbyBhaW5kYS48L2Rpdj4nOyByZXR1cm47IH1cclxuICAgIGVsLmlubmVySFRNTCA9IGRhdGEubWFwKHAgPT4ge1xyXG4gICAgICBjb25zdCBkdCA9IHAuZGF0YV9hcHJvdmFjYW8gPyBuZXcgRGF0ZShwLmRhdGFfYXByb3ZhY2FvKS50b0xvY2FsZVN0cmluZygncHQtQlInKSA6ICdcdTIwMTQnO1xyXG4gICAgICBjb25zdCBnaXJvdSA9IHAuamFfZ2lyb3UgPyAnXHUyNzEzIEdpcm91IFx1MjAxNCAnICsgZXNjSFRNTChwLnByZW1pbyA/PyAnJykgOiAnXHUyM0YzIEFndWFyZGFuZG8gZ2lyYXInO1xyXG4gICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWl0ZW1cIj4nICtcclxuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtaW5mb1wiPicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS1ub21lXCI+JyArIGVzY0hUTUwocC5ub21lID8/ICcnKSArICc8L2Rpdj4nICtcclxuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtdGVsXCI+JyArIGVzY0hUTUwocC50ZWxlZm9uZSkgKyAnPC9kaXY+JyArXHJcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTFweDtjb2xvcjojMzg4ZTNjXCI+JyArIGdpcm91ICsgJzwvZGl2PicgK1xyXG4gICAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjExcHg7Y29sb3I6Izk5OVwiPkFwcm92YWRvIGVtOiAnICsgZHQgKyAnPC9kaXY+JyArXHJcbiAgICAgICAgJzwvZGl2PjwvZGl2Pic7XHJcbiAgICB9KS5qb2luKCcnKTtcclxuICB9IGNhdGNoIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5FcnJvIGFvIGNhcnJlZ2FyLjwvZGl2Pic7IH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gYXByb3ZhclBhcnRpY2lwYW50ZShpZDogbnVtYmVyLCBidG46IEhUTUxCdXR0b25FbGVtZW50KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnRleHRDb250ZW50ID0gJy4uLic7XHJcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/aWQ9ZXEuJyArIGlkLCB7XHJcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxyXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiwgJ1ByZWZlcic6ICdyZXR1cm49bWluaW1hbCdcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIHN0YXR1czogJ2Fwcm92YWRvJyxcclxuICAgICAgICBkYXRhX2Fwcm92YWNhbzogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgIGFwcm92YWRvX3BvcjogY2xpZW50ZUF0dWFsID8gY2xpZW50ZUF0dWFsLm5vbWUgOiAnYWRtaW4nXHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKCdzdGF0dXMgJyArIHIuc3RhdHVzKTtcclxuICAgIGJ0bi5jbG9zZXN0KCcucm9sZXRhLXBhcnRpY2lwYW50ZS1pdGVtJyk/LnJlbW92ZSgpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTMgQXByb3Zhcic7XHJcbiAgICBhbGVydCgnRXJybyBhbyBhcHJvdmFyLicpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVqZWl0YXJQYXJ0aWNpcGFudGUoaWQ6IG51bWJlciwgYnRuOiBIVE1MQnV0dG9uRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGlmICghY29uZmlybSgnUmVqZWl0YXIgZXN0YSBwYXJ0aWNpcGFcdTAwRTdcdTAwRTNvPycpKSByZXR1cm47XHJcbiAgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnRleHRDb250ZW50ID0gJy4uLic7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/aWQ9ZXEuJyArIGlkLCB7XHJcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxyXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiwgJ1ByZWZlcic6ICdyZXR1cm49bWluaW1hbCdcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdGF0dXM6ICdyZWplaXRhZG8nIH0pXHJcbiAgICB9KTtcclxuICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKCdzdGF0dXMgJyArIHIuc3RhdHVzKTtcclxuICAgIGJ0bi5jbG9zZXN0KCcucm9sZXRhLXBhcnRpY2lwYW50ZS1pdGVtJyk/LnJlbW92ZSgpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTcgUmVqZWl0YXInO1xyXG4gICAgYWxlcnQoJ0Vycm8gYW8gcmVqZWl0YXIuJyk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBjYXJyZWdhclZlbmNlZG9yZXNSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlzdGFWZW5jZWRvcmVzJyk7XHJcbiAgaWYgKCFlbCkgcmV0dXJuO1xyXG4gIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+Q2FycmVnYW5kby4uLjwvZGl2Pic7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3ZlbmNlZG9yZXM/b3JkZXI9Y3JlYXRlZF9hdC5kZXNjJywge1xyXG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8eyBub21lPzogc3RyaW5nOyBwcmVtaW86IHN0cmluZzsgdGVsZWZvbmU/OiBzdHJpbmc7IHNlbWFuYT86IHN0cmluZzsgY3JlYXRlZF9hdDogc3RyaW5nIH0+O1xyXG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmxlbmd0aCkgeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPk5lbmh1bSB2ZW5jZWRvciBhaW5kYS48L2Rpdj4nOyByZXR1cm47IH1cclxuICAgIGVsLmlubmVySFRNTCA9IGRhdGEubWFwKHYgPT4ge1xyXG4gICAgICBjb25zdCBkdCA9IG5ldyBEYXRlKHYuY3JlYXRlZF9hdCkudG9Mb2NhbGVTdHJpbmcoJ3B0LUJSJyk7XHJcbiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInJvbGV0YS12ZW5jZWRvci1pdGVtXCI+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtdmVuY2Vkb3Itbm9tZVwiPlx1RDgzQ1x1REZDNiAnICsgZXNjSFRNTCh2Lm5vbWUgPz8gJ1x1MjAxNCcpICsgJzwvZGl2PicgK1xyXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXZlbmNlZG9yLXByZW1pb1wiPlx1RDgzQ1x1REY4MSAnICsgZXNjSFRNTCh2LnByZW1pbykgKyAnPC9kaXY+JyArXHJcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtdmVuY2Vkb3ItZGF0YVwiPicgKyBlc2NIVE1MKHYudGVsZWZvbmUgPz8gJycpICsgJyBcdTAwQjcgU2VtYW5hICcgKyBlc2NIVE1MKHYuc2VtYW5hID8/ICcnKSArICcgXHUwMEI3ICcgKyBkdCArICc8L2Rpdj4nICtcclxuICAgICAgICAnPC9kaXY+JztcclxuICAgIH0pLmpvaW4oJycpO1xyXG4gIH0gY2F0Y2ggeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkVycm8gYW8gY2FycmVnYXIuPC9kaXY+JzsgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBjYXJyZWdhckNvbmZpZ0FkbWluKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9jb25maWc/aWQ9ZXEuMSZsaW1pdD0xJywge1xyXG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8eyBhdGl2YTogYm9vbGVhbjsgcHJlbWlvczogc3RyaW5nW10gfT47XHJcbiAgICBpZiAoZGF0YSAmJiBkYXRhWzBdKSB7XHJcbiAgICAgIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnQXRpdmEnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkID0gZGF0YVswXSEuYXRpdmE7XHJcbiAgICAgIGNvbnN0IHByZW1pb3MgPSBBcnJheS5pc0FycmF5KGRhdGFbMF0hLnByZW1pb3MpID8gZGF0YVswXSEucHJlbWlvcyA6IGdldFByZW1pb3NQYWRyYW8oKTtcclxuICAgICAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdQcmVtaW9zJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWUgPSBwcmVtaW9zLmpvaW4oJ1xcbicpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGUpIHsgbG9nLndhcm4oJ0Vycm8gYW8gY2FycmVnYXIgY29uZmlnIGFkbWluJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pOyB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNhbHZhckNvbmZpZ1JvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBhdGl2YSA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnQXRpdmEnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkO1xyXG4gIGNvbnN0IHByZW1pb3NUeHQgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ1ByZW1pb3MnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZTtcclxuICBjb25zdCBwcmVtaW9zID0gcHJlbWlvc1R4dC5zcGxpdCgnXFxuJykubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihzID0+IHMubGVuZ3RoID4gMCk7XHJcbiAgY29uc3QgbXNnRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnTXNnJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9jb25maWc/aWQ9ZXEuMScsIHtcclxuICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXHJcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OLCAnUHJlZmVyJzogJ3JldHVybj1taW5pbWFsJ1xyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGF0aXZhLCBwcmVtaW9zLCB1cGRhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSlcclxuICAgIH0pO1xyXG4gICAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ3N0YXR1cyAnICsgci5zdGF0dXMpO1xyXG4gICAgc2V0UHJlbWlvcyhwcmVtaW9zKTtcclxuICAgIGlmIChtc2dFbCkgeyBtc2dFbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgc2V0VGltZW91dCgoKSA9PiB7IG1zZ0VsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0sIDI1MDApOyB9XHJcbiAgfSBjYXRjaCB7IGFsZXJ0KCdFcnJvIGFvIHNhbHZhciBjb25maWd1cmFcdTAwRTdcdTAwRjVlcy4nKTsgfVxyXG59XHJcblxyXG4vLyA9PT09PSBJTklUID09PT09XHJcbmZ1bmN0aW9uIGluaXRGaWx0cm9zVGlja2VyKCk6IHZvaWQge1xyXG4gIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZmlsdHJvcy13cmFwJykgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xyXG4gIGNvbnN0IHRyYWNrRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZmlsdHJvcycpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICBpZiAoIXdyYXAgfHwgIXRyYWNrRWwpIHJldHVybjtcclxuICBjb25zdCB0cmFjazogSFRNTEVsZW1lbnQgPSB0cmFja0VsO1xyXG5cclxuICBsZXQgcG9zID0gMDtcclxuICBsZXQgYXV0b0RpciA9IC0xO1xyXG4gIGNvbnN0IEFVVE9fU1BFRUQgPSAwLjU1O1xyXG4gIGxldCBpc0F1dG8gPSB0cnVlO1xyXG5cclxuICBsZXQgZHJhZ2dpbmcgPSBmYWxzZTtcclxuICBsZXQgZHJhZ1N0YXJ0Q2xpZW50WCA9IDA7XHJcbiAgbGV0IGRyYWdTdGFydFBvcyA9IDA7XHJcbiAgbGV0IHZlbFNhbXBsZXM6IG51bWJlcltdID0gW107XHJcbiAgbGV0IHByZXZDbGllbnRYID0gMDtcclxuICBsZXQgcHJldlRpbWUgPSAwO1xyXG4gIGxldCBpbmVydGlhVmVsID0gMDtcclxuICBsZXQgaW5lcnRpYU9uID0gZmFsc2U7XHJcbiAgbGV0IHJlc3VtZVRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xyXG5cclxuICAvLyBMYXlvdXQgY2FjaGUgXHUyMDE0IGF0dWFsaXphZG8gYXBlbmFzIG5vIHJlc2l6ZSwgblx1MDBFM28gYSBjYWRhIGZyYW1lXHJcbiAgbGV0IGNhY2hlZE1pbiA9IE1hdGgubWluKDAsIHdyYXAuY2xpZW50V2lkdGggLSB0cmFjay5zY3JvbGxXaWR0aCk7XHJcbiAgY29uc3Qgcm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKCkgPT4ge1xyXG4gICAgY2FjaGVkTWluID0gTWF0aC5taW4oMCwgd3JhcC5jbGllbnRXaWR0aCAtIHRyYWNrLnNjcm9sbFdpZHRoKTtcclxuICB9KTtcclxuICByby5vYnNlcnZlKHdyYXApO1xyXG4gIHJvLm9ic2VydmUodHJhY2spO1xyXG5cclxuICBmdW5jdGlvbiBhcHBseVBvcyhuZXdQb3M6IG51bWJlcik6IHZvaWQge1xyXG4gICAgcG9zID0gbmV3UG9zO1xyXG4gICAgdHJhY2suc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVgoJHtwb3N9cHgpYDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNhbmNlbFJlc3VtZSgpOiB2b2lkIHtcclxuICAgIGlmIChyZXN1bWVUaW1lciAhPT0gbnVsbCkgeyBjbGVhclRpbWVvdXQocmVzdW1lVGltZXIpOyByZXN1bWVUaW1lciA9IG51bGw7IH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHNjaGVkdWxlUmVzdW1lKG1zOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGNhbmNlbFJlc3VtZSgpO1xyXG4gICAgcmVzdW1lVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgaXNBdXRvID0gdHJ1ZTtcclxuICAgICAgaW5lcnRpYU9uID0gZmFsc2U7XHJcbiAgICAgIGluZXJ0aWFWZWwgPSAwO1xyXG4gICAgICByZXN1bWVUaW1lciA9IG51bGw7XHJcbiAgICB9LCBtcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB0aWNrKCk6IHZvaWQge1xyXG4gICAgLy8gUGFyYSBvIGxvb3Agc2UgbyBlbGVtZW50byBmb3IgcmVtb3ZpZG8gZG8gRE9NXHJcbiAgICBpZiAoIWRvY3VtZW50LmNvbnRhaW5zKHdyYXApKSB7IHJvLmRpc2Nvbm5lY3QoKTsgcmV0dXJuOyB9XHJcblxyXG4gICAgaWYgKCFkcmFnZ2luZykge1xyXG4gICAgICBpZiAoaW5lcnRpYU9uKSB7XHJcbiAgICAgICAgaW5lcnRpYVZlbCAqPSAwLjkyO1xyXG4gICAgICAgIGNvbnN0IG5leHQgPSBwb3MgKyBpbmVydGlhVmVsO1xyXG4gICAgICAgIGlmIChuZXh0ID4gMCB8fCBuZXh0IDwgY2FjaGVkTWluKSB7XHJcbiAgICAgICAgICBhcHBseVBvcyhNYXRoLm1heChjYWNoZWRNaW4sIE1hdGgubWluKDAsIG5leHQpKSk7XHJcbiAgICAgICAgICBpbmVydGlhT24gPSBmYWxzZTtcclxuICAgICAgICAgIGluZXJ0aWFWZWwgPSAwO1xyXG4gICAgICAgICAgc2NoZWR1bGVSZXN1bWUoNjAwKTtcclxuICAgICAgICB9IGVsc2UgaWYgKE1hdGguYWJzKGluZXJ0aWFWZWwpIDwgMC4xNSkge1xyXG4gICAgICAgICAgaW5lcnRpYU9uID0gZmFsc2U7XHJcbiAgICAgICAgICBpbmVydGlhVmVsID0gMDtcclxuICAgICAgICAgIHNjaGVkdWxlUmVzdW1lKDE1MDApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhcHBseVBvcyhuZXh0KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAoaXNBdXRvICYmIGNhY2hlZE1pbiA8IC0xKSB7XHJcbiAgICAgICAgY29uc3QgbmV4dCA9IHBvcyArIEFVVE9fU1BFRUQgKiBhdXRvRGlyO1xyXG4gICAgICAgIGlmIChuZXh0IDw9IGNhY2hlZE1pbikgeyBhcHBseVBvcyhjYWNoZWRNaW4pOyBhdXRvRGlyID0gMTsgfVxyXG4gICAgICAgIGVsc2UgaWYgKG5leHQgPj0gMCkgeyBhcHBseVBvcygwKTsgYXV0b0RpciA9IC0xOyB9XHJcbiAgICAgICAgZWxzZSBhcHBseVBvcyhuZXh0KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xyXG4gIH1cclxuXHJcbiAgd3JhcC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIChlOiBQb2ludGVyRXZlbnQpID0+IHtcclxuICAgIGRyYWdnaW5nID0gdHJ1ZTtcclxuICAgIGlzQXV0byA9IGZhbHNlO1xyXG4gICAgaW5lcnRpYU9uID0gZmFsc2U7XHJcbiAgICBpbmVydGlhVmVsID0gMDtcclxuICAgIGNhbmNlbFJlc3VtZSgpO1xyXG4gICAgZHJhZ1N0YXJ0Q2xpZW50WCA9IGUuY2xpZW50WDtcclxuICAgIGRyYWdTdGFydFBvcyA9IHBvcztcclxuICAgIHZlbFNhbXBsZXMgPSBbXTtcclxuICAgIHByZXZDbGllbnRYID0gZS5jbGllbnRYO1xyXG4gICAgcHJldlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgIHdyYXAuc3R5bGUuY3Vyc29yID0gJ2dyYWJiaW5nJztcclxuICAgIHdyYXAuc2V0UG9pbnRlckNhcHR1cmUoZS5wb2ludGVySWQpOyAvLyBtYW50XHUwMEU5bSBldmVudG9zIG1lc21vIGZvcmEgZG8gZWxlbWVudG9cclxuICB9LCB7IHBhc3NpdmU6IHRydWUgfSk7XHJcblxyXG4gIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCAoZTogUG9pbnRlckV2ZW50KSA9PiB7XHJcbiAgICBpZiAoIWRyYWdnaW5nKSByZXR1cm47XHJcbiAgICBjb25zdCBkeCA9IGUuY2xpZW50WCAtIGRyYWdTdGFydENsaWVudFg7XHJcbiAgICBsZXQgbmV3UG9zID0gZHJhZ1N0YXJ0UG9zICsgZHg7XHJcbiAgICAvLyBydWJiZXIgYmFuZCBuYXMgYm9yZGFzXHJcbiAgICBpZiAobmV3UG9zID4gMCkgbmV3UG9zID0gbmV3UG9zICogMC4yNTtcclxuICAgIGlmIChuZXdQb3MgPCBjYWNoZWRNaW4pIG5ld1BvcyA9IGNhY2hlZE1pbiArIChuZXdQb3MgLSBjYWNoZWRNaW4pICogMC4yNTtcclxuICAgIGFwcGx5UG9zKG5ld1Bvcyk7XHJcblxyXG4gICAgY29uc3Qgbm93ID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICBjb25zdCBkdCA9IG5vdyAtIHByZXZUaW1lO1xyXG4gICAgaWYgKGR0ID4gMCAmJiBkdCA8IDgwKSB7XHJcbiAgICAgIHZlbFNhbXBsZXMucHVzaCgoZS5jbGllbnRYIC0gcHJldkNsaWVudFgpICogMTYgLyBkdCk7XHJcbiAgICAgIGlmICh2ZWxTYW1wbGVzLmxlbmd0aCA+IDYpIHZlbFNhbXBsZXMuc2hpZnQoKTtcclxuICAgIH1cclxuICAgIHByZXZDbGllbnRYID0gZS5jbGllbnRYO1xyXG4gICAgcHJldlRpbWUgPSBub3c7XHJcbiAgfSwgeyBwYXNzaXZlOiB0cnVlIH0pO1xyXG5cclxuICBjb25zdCBvblJlbGVhc2UgPSAoKTogdm9pZCA9PiB7XHJcbiAgICBpZiAoIWRyYWdnaW5nKSByZXR1cm47XHJcbiAgICBkcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgd3JhcC5zdHlsZS5jdXJzb3IgPSAnJztcclxuXHJcbiAgICBpZiAocG9zID4gMCB8fCBwb3MgPCBjYWNoZWRNaW4pIHtcclxuICAgICAgYXBwbHlQb3MoTWF0aC5tYXgoY2FjaGVkTWluLCBNYXRoLm1pbigwLCBwb3MpKSk7XHJcbiAgICAgIHNjaGVkdWxlUmVzdW1lKDYwMCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhdmdWZWwgPSB2ZWxTYW1wbGVzLmxlbmd0aCA+IDBcclxuICAgICAgPyB2ZWxTYW1wbGVzLnNsaWNlKC0zKS5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIE1hdGgubWluKDMsIHZlbFNhbXBsZXMubGVuZ3RoKVxyXG4gICAgICA6IDA7XHJcblxyXG4gICAgaWYgKE1hdGguYWJzKGF2Z1ZlbCkgPiAwLjQpIHtcclxuICAgICAgaW5lcnRpYVZlbCA9IGF2Z1ZlbDtcclxuICAgICAgaW5lcnRpYU9uID0gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNjaGVkdWxlUmVzdW1lKDIwMDApO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgICAgIG9uUmVsZWFzZSk7XHJcbiAgd3JhcC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgb25SZWxlYXNlKTtcclxuXHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKSk7XHJcbn1cclxuXHJcbihhc3luYyBmdW5jdGlvbiBpbml0KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjbGllbnRlU2Vzc2FvID0gbG9naW5Vc2VDYXNlLnJlc3RvcmVTZXNzaW9uKCk7XHJcbiAgICBpZiAoY2xpZW50ZVNlc3Nhbykge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBsb2dpblVzZUNhc2UuZXhlY3V0ZShjbGllbnRlU2Vzc2FvLnRlbGVmb25lKTtcclxuICAgICAgaWYgKHJlc3VsdC5vayAmJiByZXN1bHQudmFsdWUuZXhpc3RlICYmIHJlc3VsdC52YWx1ZS5jbGllbnRlKSB7XHJcbiAgICAgICAgZW50cmFyQ29tQ2xpZW50ZShyZXN1bHQudmFsdWUuY2xpZW50ZS50b0pTT04oKSBhcyBDbGllbnRlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgLy8gRmFsaGEgZGUgcmVkZSBcdTIxOTIgY29uZmlhIG5hIHNlc3NcdTAwRTNvIGxvY2FsIGVtIHZleiBkZSBmYXplciBsb2dvdXRcclxuICAgICAgaWYgKCFyZXN1bHQub2sgJiYgcmVzdWx0LmVycm9yLm5hbWUgPT09ICdOZXR3b3JrRXJyb3InKSB7XHJcbiAgICAgICAgbG9nLndhcm4oJ1JldmFsaWRhXHUwMEU3XHUwMEUzbyBvZmZsaW5lIFx1MjAxNCB1c2FuZG8gc2Vzc1x1MDBFM28gbG9jYWwnLCB7IHRlbDogYCoqKiR7Y2xpZW50ZVNlc3Nhby50ZWxlZm9uZS5zbGljZSgtNCl9YCB9KTtcclxuICAgICAgICBlbnRyYXJDb21DbGllbnRlKGNsaWVudGVTZXNzYW8udG9KU09OKCkgYXMgQ2xpZW50ZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGxvZ2luVXNlQ2FzZS5sb2dvdXQoKTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlKSB7IGxvZy53YXJuKCdFcnJvIGFvIHZlcmlmaWNhciBzZXNzXHUwMEUzbycsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTsgfVxyXG4gIG1vc3RyYXJMb2dpbigpO1xyXG59KSgpO1xyXG5cclxuaW5pdEZpbHRyb3NUaWNrZXIoKTtcclxuXHJcbi8vIFBXQSBzZXJ2aWNlIHdvcmtlclxyXG5pZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xyXG4gIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCdzdy5qcycpLmNhdGNoKCgpID0+IHt9KTtcclxufVxyXG5cclxuLy8gU2luY3Jvbml6YXIgY2FyZFx1MDBFMXBpbyBjb20gU3VwYWJhc2VcclxuKGFzeW5jIGZ1bmN0aW9uIHNpbmNyb25pemFyQ2FyZGFwaW8oKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGN0cmwgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XHJcbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gY3RybC5hYm9ydCgpLCAxMF8wMDApO1xyXG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9wcm9kdXRvcz9zZWxlY3Q9bm9tZSxwcmVjbyxkaXNwb25pdmVsJywge1xyXG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfSxcclxuICAgICAgc2lnbmFsOiBjdHJsLnNpZ25hbFxyXG4gICAgfSk7XHJcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xyXG4gICAgaWYgKCFyLm9rKSByZXR1cm47XHJcbiAgICBjb25zdCBwcm9kcyA9IGF3YWl0IHIuanNvbigpIGFzIEFycmF5PHsgbm9tZTogc3RyaW5nOyBwcmVjbzogbnVtYmVyOyBkaXNwb25pdmVsOiBib29sZWFuIH0+O1xyXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHByb2RzKSB8fCAhcHJvZHMubGVuZ3RoKSByZXR1cm47XHJcbiAgICBjb25zdCBtYXBhOiBSZWNvcmQ8c3RyaW5nLCB7IG5vbWU6IHN0cmluZzsgcHJlY286IG51bWJlcjsgZGlzcG9uaXZlbDogYm9vbGVhbiB9PiA9IHt9O1xyXG4gICAgcHJvZHMuZm9yRWFjaChwID0+IHtcclxuICAgICAgaWYgKHAgJiYgdHlwZW9mIHAubm9tZSA9PT0gJ3N0cmluZycgJiYgcC5ub21lLnRyaW0oKSkgbWFwYVtwLm5vbWUudHJpbSgpLnRvTG93ZXJDYXNlKCldID0gcDtcclxuICAgIH0pO1xyXG4gICAgY29uc3QgcHJpY2VNYXAgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJ0bi1wZWRpcicpLmZvckVhY2goYnRuID0+IHtcclxuICAgICAgY29uc3Qgb25jbGlja0F0dHIgPSBidG4uZ2V0QXR0cmlidXRlKCdvbmNsaWNrJykgPz8gJyc7XHJcbiAgICAgIGNvbnN0IG0gPSBvbmNsaWNrQXR0ci5tYXRjaCgvcGVkaXIoPzpQcm9kdXRvfEJvbG9Gb3JtYSlcXCh0aGlzLCcoLis/KScsKFxcZCsoPzpcXC5cXGQrKT8pXFwpLyk7XHJcbiAgICAgIGlmICghbSkgcmV0dXJuO1xyXG4gICAgICBjb25zdCBub21lUHJvZCA9IG1bMV0hO1xyXG4gICAgICBjb25zdCBjaGF2ZSA9IG5vbWVQcm9kLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICBjb25zdCBkYiA9IG1hcGFbY2hhdmVdO1xyXG4gICAgICBpZiAoIWRiKSByZXR1cm47XHJcbiAgICAgIGNvbnN0IGNhcmQgPSBidG4uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICAgICAgaWYgKCFjYXJkKSByZXR1cm47XHJcbiAgICAgIGlmIChkYi5kaXNwb25pdmVsID09PSBmYWxzZSkgeyBjYXJkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IHJldHVybjsgfVxyXG4gICAgICBjb25zdCBub3ZvUHJlY28gPSBwYXJzZUZsb2F0KFN0cmluZyhkYi5wcmVjbykpO1xyXG4gICAgICBpZiAoaXNOYU4obm92b1ByZWNvKSB8fCBub3ZvUHJlY28gPD0gMCkgcmV0dXJuO1xyXG4gICAgICBjb25zdCBmbk5hbWUgPSBvbmNsaWNrQXR0ci5zdGFydHNXaXRoKCdwZWRpckJvbG9Gb3JtYScpID8gJ3BlZGlyQm9sb0Zvcm1hJyA6ICdwZWRpclByb2R1dG8nO1xyXG4gICAgICBidG4uc2V0QXR0cmlidXRlKCdvbmNsaWNrJywgZm5OYW1lICsgXCIodGhpcywnXCIgKyBub21lUHJvZC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIikgKyBcIicsXCIgKyBub3ZvUHJlY28gKyBcIilcIik7XHJcbiAgICAgIGNvbnN0IHByZWNvRWwgPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kLXByZWNvJyk7XHJcbiAgICAgIGlmIChwcmVjb0VsKSBwcmVjb0VsLnRleHRDb250ZW50ID0gJ1IkICcgKyBub3ZvUHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcclxuICAgICAgcHJpY2VNYXAuc2V0KG5vbWVQcm9kLCBub3ZvUHJlY28pO1xyXG4gICAgfSk7XHJcbiAgICBjYXJ0U2VydmljZS5yZXZhbGlkYXRlUHJpY2VzKHByaWNlTWFwKTtcclxuICB9IGNhdGNoIHsgLyogc2lsZW5jaW9zbyAqLyB9XHJcbn0pKCk7XHJcblxyXG4vLyBGZWNoYXIgbW9kYWlzIGNvbSBFc2NhcGVcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XHJcbiAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykge1xyXG4gICAgZmVjaGFyRGlhbG9nKCk7XHJcbiAgICBmZWNoYXJNb2RhbCgpO1xyXG4gICAgZmVjaGFyQ29uZmlybVdBKCk7XHJcbiAgICBmZWNoYXJEaWFsb2dCb2xvKCk7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8vID09PT09IEVYUE9SIFBBUkEgSFRNTCAob25jbGljaz1cIi4uLlwiKSA9PT09PVxyXG5kZWNsYXJlIGdsb2JhbCB7XHJcbiAgaW50ZXJmYWNlIFdpbmRvdyB7XHJcbiAgICBmaWx0cmFyOiB0eXBlb2YgZmlsdHJhcjtcclxuICAgIHBlZGlyUHJvZHV0bzogdHlwZW9mIHBlZGlyUHJvZHV0bztcclxuICAgIGFicmlyRGlhbG9nOiB0eXBlb2YgYWJyaXJEaWFsb2c7XHJcbiAgICBmZWNoYXJEaWFsb2c6IHR5cGVvZiBmZWNoYXJEaWFsb2c7XHJcbiAgICBmZWNoYXJEaWFsb2dCYWNrZHJvcDogdHlwZW9mIGZlY2hhckRpYWxvZ0JhY2tkcm9wO1xyXG4gICAgaXJQYXJhRmluYWxpemFyOiB0eXBlb2YgaXJQYXJhRmluYWxpemFyO1xyXG4gICAgYWJyaXJNb2RhbDogdHlwZW9mIGFicmlyTW9kYWw7XHJcbiAgICBmZWNoYXJNb2RhbDogdHlwZW9mIGZlY2hhck1vZGFsO1xyXG4gICAgZmVjaGFyTW9kYWxCYWNrZHJvcDogdHlwZW9mIGZlY2hhck1vZGFsQmFja2Ryb3A7XHJcbiAgICByZW1vdmVyRG9DYXJyaW5obzogdHlwZW9mIHJlbW92ZXJEb0NhcnJpbmhvO1xyXG4gICAgc2VsZWNpb25hclBhZ2FtZW50bzogdHlwZW9mIHNlbGVjaW9uYXJQYWdhbWVudG87XHJcbiAgICBmaW5hbGl6YXJQZWRpZG86IHR5cGVvZiBmaW5hbGl6YXJQZWRpZG87XHJcbiAgICBjb25maXJtYXJFbnZpb1dBOiB0eXBlb2YgY29uZmlybWFyRW52aW9XQTtcclxuICAgIGZlY2hhckNvbmZpcm1XQTogdHlwZW9mIGZlY2hhckNvbmZpcm1XQTtcclxuICAgIHBlZGlyQm9sb0Zvcm1hOiB0eXBlb2YgcGVkaXJCb2xvRm9ybWE7XHJcbiAgICBhYnJpckRpYWxvZ0JvbG86IHR5cGVvZiBhYnJpckRpYWxvZ0JvbG87XHJcbiAgICBmZWNoYXJEaWFsb2dCb2xvOiB0eXBlb2YgZmVjaGFyRGlhbG9nQm9sbztcclxuICAgIGNhcm91c2VsTmV4dDogdHlwZW9mIGNhcm91c2VsTmV4dDtcclxuICAgIGNhcm91c2VsUHJldjogdHlwZW9mIGNhcm91c2VsUHJldjtcclxuICAgIG1hc2NhcmFUZWxlZm9uZTogdHlwZW9mIG1hc2NhcmFUZWxlZm9uZTtcclxuICAgIHZlcmlmaWNhclRlbGVmb25lOiB0eXBlb2YgdmVyaWZpY2FyVGVsZWZvbmU7XHJcbiAgICBjYWRhc3RyYXI6IHR5cGVvZiBjYWRhc3RyYXI7XHJcbiAgICB2b2x0YXJFdGFwYVRlbGVmb25lOiB0eXBlb2Ygdm9sdGFyRXRhcGFUZWxlZm9uZTtcclxuICAgIHNhaXI6IHR5cGVvZiBzYWlyO1xyXG4gICAgYWJyaXJSb2xldGE6IHR5cGVvZiBhYnJpclJvbGV0YTtcclxuICAgIGZlY2hhclJvbGV0YTogdHlwZW9mIGZlY2hhclJvbGV0YTtcclxuICAgIGZlY2hhclJvbGV0YUJhY2tkcm9wOiB0eXBlb2YgZmVjaGFyUm9sZXRhQmFja2Ryb3A7XHJcbiAgICBnaXJhclJvbGV0YTogdHlwZW9mIGdpcmFyUm9sZXRhO1xyXG4gICAgZW52aWFyUHJvdmFzV2hhdHNBcHA6IHR5cGVvZiBlbnZpYXJQcm92YXNXaGF0c0FwcDtcclxuICAgIGFicmlyUm9sZXRhQWRtaW46IHR5cGVvZiBhYnJpclJvbGV0YUFkbWluO1xyXG4gICAgZmVjaGFyUm9sZXRhQWRtaW46IHR5cGVvZiBmZWNoYXJSb2xldGFBZG1pbjtcclxuICAgIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJSb2xldGFBZG1pbkJhY2tkcm9wO1xyXG4gICAgYWJyaXJUYWJBZG1pbjogdHlwZW9mIGFicmlyVGFiQWRtaW47XHJcbiAgICBhcHJvdmFyUGFydGljaXBhbnRlOiB0eXBlb2YgYXByb3ZhclBhcnRpY2lwYW50ZTtcclxuICAgIHJlamVpdGFyUGFydGljaXBhbnRlOiB0eXBlb2YgcmVqZWl0YXJQYXJ0aWNpcGFudGU7XHJcbiAgICBzYWx2YXJDb25maWdSb2xldGE6IHR5cGVvZiBzYWx2YXJDb25maWdSb2xldGE7XHJcbiAgfVxyXG59XHJcblxyXG5PYmplY3QuYXNzaWduKHdpbmRvdywge1xyXG4gIGZpbHRyYXIsXHJcbiAgcGVkaXJQcm9kdXRvLFxyXG4gIGFicmlyRGlhbG9nLFxyXG4gIGZlY2hhckRpYWxvZyxcclxuICBmZWNoYXJEaWFsb2dCYWNrZHJvcCxcclxuICBpclBhcmFGaW5hbGl6YXIsXHJcbiAgYWJyaXJNb2RhbCxcclxuICBmZWNoYXJNb2RhbCxcclxuICBmZWNoYXJNb2RhbEJhY2tkcm9wLFxyXG4gIHJlbW92ZXJEb0NhcnJpbmhvLFxyXG4gIHNlbGVjaW9uYXJQYWdhbWVudG8sXHJcbiAgZmluYWxpemFyUGVkaWRvLFxyXG4gIGNvbmZpcm1hckVudmlvV0EsXHJcbiAgZmVjaGFyQ29uZmlybVdBLFxyXG4gIHBlZGlyQm9sb0Zvcm1hLFxyXG4gIGFicmlyRGlhbG9nQm9sbyxcclxuICBmZWNoYXJEaWFsb2dCb2xvLFxyXG4gIGNhcm91c2VsTmV4dCxcclxuICBjYXJvdXNlbFByZXYsXHJcbiAgbWFzY2FyYVRlbGVmb25lLFxyXG4gIHZlcmlmaWNhclRlbGVmb25lLFxyXG4gIGNhZGFzdHJhcixcclxuICB2b2x0YXJFdGFwYVRlbGVmb25lLFxyXG4gIHNhaXIsXHJcbiAgYWJyaXJSb2xldGEsXHJcbiAgZmVjaGFyUm9sZXRhLFxyXG4gIGZlY2hhclJvbGV0YUJhY2tkcm9wLFxyXG4gIGdpcmFyUm9sZXRhLFxyXG4gIGVudmlhclByb3Zhc1doYXRzQXBwLFxyXG4gIGFicmlyUm9sZXRhQWRtaW4sXHJcbiAgZmVjaGFyUm9sZXRhQWRtaW4sXHJcbiAgZmVjaGFyUm9sZXRhQWRtaW5CYWNrZHJvcCxcclxuICBhYnJpclRhYkFkbWluLFxyXG4gIGFwcm92YXJQYXJ0aWNpcGFudGUsXHJcbiAgcmVqZWl0YXJQYXJ0aWNpcGFudGUsXHJcbiAgc2FsdmFyQ29uZmlnUm9sZXRhLFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFTyxXQUFTLGFBQWEsS0FBYSxPQUFrQixRQUFjO0FBQ3hFLFVBQU0sTUFBTSxTQUFTLGVBQWUsUUFBUTtBQUM1QyxRQUFJLElBQUssS0FBSSxPQUFPO0FBQ3BCLFVBQU0sSUFBSSxTQUFTLGNBQWMsS0FBSztBQUN0QyxNQUFFLEtBQUs7QUFDUCxNQUFFLGNBQWM7QUFDaEIsVUFBTSxLQUFLLFNBQVMsU0FBUyxZQUFZLFNBQVMsT0FBTyxZQUFZO0FBQ3JFLFdBQU8sT0FBTyxFQUFFLE9BQU87QUFBQSxNQUNyQixVQUFVO0FBQUEsTUFBUyxRQUFRO0FBQUEsTUFBUSxNQUFNO0FBQUEsTUFDekMsV0FBVztBQUFBLE1BQ1gsWUFBWTtBQUFBLE1BQUksT0FBTztBQUFBLE1BQVEsU0FBUztBQUFBLE1BQ3hDLGNBQWM7QUFBQSxNQUFRLFVBQVU7QUFBQSxNQUFRLFlBQVk7QUFBQSxNQUNwRCxRQUFRO0FBQUEsTUFBUyxXQUFXO0FBQUEsTUFDNUIsVUFBVTtBQUFBLE1BQVEsV0FBVztBQUFBLE1BQzdCLFlBQVk7QUFBQSxNQUFlLFNBQVM7QUFBQSxNQUNwQyxZQUFZO0FBQUEsSUFDZCxDQUFpQztBQUNqQyxhQUFTLEtBQUssWUFBWSxDQUFDO0FBQzNCLGVBQVcsTUFBTTtBQUNmLFFBQUUsTUFBTSxVQUFVO0FBQ2xCLGlCQUFXLE1BQU0sRUFBRSxPQUFPLEdBQUcsR0FBRztBQUFBLElBQ2xDLEdBQUcsSUFBSTtBQUFBLEVBQ1Q7OztBQ3hCTyxXQUFTLFFBQVEsR0FBb0I7QUFDMUMsV0FBTyxPQUFPLENBQUMsRUFDWixRQUFRLE1BQU0sT0FBTyxFQUNyQixRQUFRLE1BQU0sTUFBTSxFQUNwQixRQUFRLE1BQU0sTUFBTSxFQUNwQixRQUFRLE1BQU0sUUFBUSxFQUN0QixRQUFRLE1BQU0sT0FBTztBQUFBLEVBQzFCOzs7QUNQTyxXQUFTLGNBQWMsT0FBdUI7QUFDbkQsV0FBTyxRQUFRLE1BQU0sUUFBUSxDQUFDLEVBQUUsUUFBUSxLQUFLLEdBQUc7QUFBQSxFQUNsRDtBQUVPLFdBQVMsaUJBQXlCO0FBQ3ZDLFVBQU0sTUFBTSxvQkFBSSxLQUFLO0FBQ3JCLFVBQU0sY0FBYyxJQUFJLEtBQUssSUFBSSxZQUFZLEdBQUcsR0FBRyxDQUFDO0FBQ3BELFVBQU0sWUFBWSxLQUFLLE9BQU8sSUFBSSxRQUFRLElBQUksWUFBWSxRQUFRLEtBQUssS0FBUTtBQUMvRSxVQUFNLFVBQVUsS0FBSyxNQUFNLFlBQVksWUFBWSxPQUFPLElBQUksS0FBSyxDQUFDO0FBQ3BFLFdBQU8sR0FBRyxJQUFJLFlBQVksQ0FBQyxLQUFLLE9BQU8sT0FBTyxFQUFFLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFBQSxFQUNsRTtBQUVPLFdBQVMsdUJBQXVCLE9BQXVCO0FBQzVELFVBQU0sSUFBSSxNQUFNLFFBQVEsT0FBTyxFQUFFLEVBQUUsTUFBTSxHQUFHLEVBQUU7QUFDOUMsUUFBSSxFQUFFLFVBQVUsRUFBRyxRQUFPO0FBQzFCLFFBQUksRUFBRSxVQUFVLEVBQUcsUUFBTyxJQUFJLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDMUQsUUFBSSxFQUFFLFVBQVUsR0FBSSxRQUFPLElBQUksRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztBQUM1RSxXQUFPLElBQUksRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQUEsRUFDOUQ7OztBQ2xCTyxNQUFNLFdBQU4sTUFBTSxrQkFBaUIsTUFBTTtBQUFBLElBQ2xDLFlBQ0UsU0FDZ0IsTUFDQSxhQUFxQixLQUNyQixTQUNoQjtBQUNBLFlBQU0sT0FBTztBQUpHO0FBQ0E7QUFDQTtBQUdoQixXQUFLLE9BQU87QUFDWixhQUFPLGVBQWUsTUFBTSxVQUFTLFNBQVM7QUFBQSxJQUNoRDtBQUFBLEVBQ0Y7QUFFTyxNQUFNLGtCQUFOLGNBQThCLFNBQVM7QUFBQSxJQUM1QyxZQUFZLFNBQWlCLFNBQW1DO0FBQzlELFlBQU0sU0FBUyxvQkFBb0IsS0FBSyxPQUFPO0FBQy9DLFdBQUssT0FBTztBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBRU8sTUFBTSxlQUFOLGNBQTJCLFNBQVM7QUFBQSxJQUN6QyxZQUFZLFNBQWlCLFNBQW1DO0FBQzlELFlBQU0sU0FBUyxpQkFBaUIsS0FBSyxPQUFPO0FBQzVDLFdBQUssT0FBTztBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBZ0JPLE1BQU0saUJBQU4sY0FBNkIsU0FBUztBQUFBLElBQzNDLFlBQVksY0FBc0I7QUFDaEMsWUFBTSw4QkFBOEIsS0FBSyxLQUFLLGVBQWUsR0FBSSxDQUFDLE1BQU0sY0FBYyxLQUFLLEVBQUUsYUFBYSxDQUFDO0FBQzNHLFdBQUssT0FBTztBQUFBLElBQ2Q7QUFBQSxFQUNGOzs7QUNyQ08sTUFBTSxVQUFOLE1BQU0sU0FBUTtBQUFBLElBTVgsWUFBWSxPQUFxQjtBQUN2QyxXQUFLLEtBQUssTUFBTTtBQUNoQixXQUFLLE9BQU8sTUFBTTtBQUNsQixXQUFLLFdBQVcsTUFBTTtBQUN0QixXQUFLLFdBQVcsTUFBTTtBQUFBLElBQ3hCO0FBQUEsSUFFQSxPQUFPLE9BQU8sT0FBOEI7QUFDMUMsWUFBTSxNQUFNLE1BQU0sU0FBUyxRQUFRLE9BQU8sRUFBRTtBQUM1QyxVQUFJLElBQUksU0FBUyxNQUFNLElBQUksU0FBUyxJQUFJO0FBQ3RDLGNBQU0sSUFBSSxnQkFBZ0Isd0JBQXFCLEVBQUUsVUFBVSxNQUFNLFNBQVMsQ0FBQztBQUFBLE1BQzdFO0FBQ0EsVUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEdBQUc7QUFDdEIsY0FBTSxJQUFJLGdCQUFnQiw0QkFBeUI7QUFBQSxNQUNyRDtBQUNBLGFBQU8sSUFBSSxTQUFRLGlDQUNkLFFBRGM7QUFBQSxRQUVqQixVQUFVO0FBQUEsUUFDVixNQUFNLFNBQVEsZUFBZSxNQUFNLElBQUk7QUFBQSxNQUN6QyxFQUFDO0FBQUEsSUFDSDtBQUFBLElBRUEsT0FBTyxPQUFPLEtBQTRCO0FBQ3hDLGFBQU8sSUFBSSxTQUFRLEdBQUc7QUFBQSxJQUN4QjtBQUFBLElBRUEsT0FBZSxlQUFlLE1BQXNCO0FBQ2xELGFBQU8sS0FBSyxZQUFZLEVBQUUsTUFBTSxHQUFHLEVBQ2hDLElBQUksT0FBSyxFQUFFLE9BQU8sQ0FBQyxFQUFFLFlBQVksSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQy9DLEtBQUssR0FBRyxFQUFFLEtBQUs7QUFBQSxJQUNwQjtBQUFBLElBRUEsYUFBYSxVQUEyQjtBQUN0QyxhQUFPLFNBQVEsT0FBTyxpQ0FBSyxLQUFLLE9BQU8sSUFBakIsRUFBb0IsU0FBUyxFQUFDO0FBQUEsSUFDdEQ7QUFBQSxJQUVBLFNBQXVCO0FBQ3JCLGFBQU8sRUFBRSxJQUFJLEtBQUssSUFBSSxNQUFNLEtBQUssTUFBTSxVQUFVLEtBQUssVUFBVSxVQUFVLEtBQUssU0FBUztBQUFBLElBQzFGO0FBQUEsRUFDRjs7O0FDbERPLE1BQU0sS0FBSyxDQUFJLFdBQWdDLEVBQUUsSUFBSSxNQUFNLE1BQU07QUFDakUsTUFBTSxPQUFPLENBQWtCLFdBQWdDLEVBQUUsSUFBSSxPQUFPLE1BQU07QUFZekYsaUJBQXNCLFNBQVksSUFBMEM7QUFDMUUsUUFBSTtBQUNGLGFBQU8sR0FBRyxNQUFNLEdBQUcsQ0FBQztBQUFBLElBQ3RCLFNBQVMsR0FBRztBQUNWLGFBQU8sS0FBSyxhQUFhLFFBQVEsSUFBSSxJQUFJLE1BQU0sT0FBTyxDQUFDLENBQUMsQ0FBQztBQUFBLElBQzNEO0FBQUEsRUFDRjs7O0FDckJBLE1BQU0sZUFBZSxLQUFLLDBEQUEwRDtBQUNwRixNQUFNLGdCQUFnQixLQUFLLDBSQUEwUjtBQUNyVCxNQUFNLGFBQWE7QUFNbkIsaUJBQXNCLGNBQ3BCLE1BQ0EsT0FBNkIsQ0FBQyxHQUNYO0FBYnJCO0FBY0UsVUFBK0MsV0FBdkMsWUFBVSxXQWRwQixJQWNpRCxJQUFkLHNCQUFjLElBQWQsQ0FBekI7QUFDUixVQUFNLGFBQWEsSUFBSSxnQkFBZ0I7QUFDdkMsVUFBTSxRQUFRLFdBQVcsTUFBTSxXQUFXLE1BQU0sR0FBRyxPQUFPO0FBRTFELFFBQUk7QUFDRixZQUFNLFVBQWtDO0FBQUEsUUFDdEMsVUFBVTtBQUFBLFFBQ1YsaUJBQWlCLFVBQVUsYUFBYTtBQUFBLFFBQ3hDLGdCQUFnQjtBQUFBLFFBQ2hCLFVBQVU7QUFBQSxVQUNMLGVBQVUsWUFBVixZQUFnRCxDQUFDO0FBR3hELGFBQU8sTUFBTSxNQUFNLEdBQUcsWUFBWSxHQUFHLElBQUksSUFBSSxpQ0FDeEMsWUFEd0M7QUFBQSxRQUUzQztBQUFBLFFBQ0EsUUFBUSxXQUFXO0FBQUEsTUFDckIsRUFBQztBQUFBLElBQ0gsU0FBUyxHQUFHO0FBQ1YsVUFBSSxhQUFhLFNBQVMsRUFBRSxTQUFTLGNBQWM7QUFDakQsY0FBTSxJQUFJLGFBQWEsc0NBQW1DLEVBQUUsS0FBSyxDQUFDO0FBQUEsTUFDcEU7QUFDQSxZQUFNLElBQUksYUFBYSxnQkFBZ0IsRUFBRSxNQUFNLE9BQU8sT0FBTyxDQUFDLEVBQUUsQ0FBQztBQUFBLElBQ25FLFVBQUU7QUFDQSxtQkFBYSxLQUFLO0FBQUEsSUFDcEI7QUFBQSxFQUNGO0FBRUEsaUJBQXNCLFlBQ3BCLE9BQ0EsUUFBUSxJQUNNO0FBQ2QsVUFBTSxPQUFPLE1BQU0sY0FBYyxZQUFZLEtBQUssR0FBRyxRQUFRLE1BQU0sUUFBUSxFQUFFLEVBQUU7QUFDL0UsUUFBSSxDQUFDLEtBQUssSUFBSTtBQUNaLFlBQU0sT0FBTyxNQUFNLEtBQUssS0FBSyxFQUFFLE1BQU0sTUFBTSxFQUFFO0FBQzdDLFlBQU0sSUFBSSxhQUFhLE9BQU8sS0FBSyxZQUFZLEtBQUssTUFBTSxLQUFLLEVBQUUsUUFBUSxLQUFLLFFBQVEsS0FBSyxDQUFDO0FBQUEsSUFDOUY7QUFDQSxXQUFPLEtBQUssS0FBSztBQUFBLEVBQ25CO0FBRUEsaUJBQXNCLGFBQ3BCLE9BQ0EsTUFDWTtBQUNaLFVBQU0sT0FBTyxNQUFNLGNBQWMsWUFBWSxLQUFLLElBQUk7QUFBQSxNQUNwRCxRQUFRO0FBQUEsTUFDUixNQUFNLEtBQUssVUFBVSxJQUFJO0FBQUEsSUFDM0IsQ0FBQztBQUNELFFBQUksQ0FBQyxLQUFLLElBQUk7QUFDWixZQUFNLE9BQU8sTUFBTSxLQUFLLEtBQUs7QUFDN0IsWUFBTSxJQUFJLGFBQWEsUUFBUSxLQUFLLFdBQVcsRUFBRSxRQUFRLEtBQUssUUFBUSxLQUFLLENBQUM7QUFBQSxJQUM5RTtBQUNBLFVBQU0sT0FBTyxNQUFNLEtBQUssS0FBSztBQUM3QixXQUFPLEtBQUssQ0FBQztBQUFBLEVBQ2Y7QUFFQSxpQkFBc0IsY0FDcEIsT0FDQSxPQUNBLE1BQ2M7QUFDZCxVQUFNLE9BQU8sTUFBTSxjQUFjLFlBQVksS0FBSyxJQUFJLEtBQUssSUFBSTtBQUFBLE1BQzdELFFBQVE7QUFBQSxNQUNSLE1BQU0sS0FBSyxVQUFVLElBQUk7QUFBQSxJQUMzQixDQUFDO0FBQ0QsUUFBSSxDQUFDLEtBQUssSUFBSTtBQUNaLFlBQU0sT0FBTyxNQUFNLEtBQUssS0FBSztBQUM3QixZQUFNLElBQUksYUFBYSxTQUFTLEtBQUssV0FBVyxFQUFFLFFBQVEsS0FBSyxRQUFRLEtBQUssQ0FBQztBQUFBLElBQy9FO0FBQ0EsV0FBTyxLQUFLLEtBQUs7QUFBQSxFQUNuQjs7O0FDM0VBLE1BQU0sU0FBTixNQUFNLFFBQU87QUFBQSxJQUdYLFlBQVksU0FBUyxZQUFZO0FBQy9CLFdBQUssU0FBUztBQUFBLElBQ2hCO0FBQUEsSUFFUSxJQUFJLE9BQWlCLFNBQWlCLFNBQXlDO0FBQ3JGLFlBQU0sUUFBa0I7QUFBQSxRQUN0QjtBQUFBLFFBQ0E7QUFBQSxRQUNBLFlBQVcsb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFBQSxRQUNsQztBQUFBLE1BQ0Y7QUFFQSxZQUFNLFFBQVE7QUFBQSxRQUNaLE9BQU87QUFBQSxRQUNQLE1BQU87QUFBQSxRQUNQLE1BQU87QUFBQSxRQUNQLE9BQU87QUFBQSxNQUNULEVBQUUsS0FBSztBQUVQLFlBQU0sWUFBWSxJQUFJLEtBQUssTUFBTSxLQUFLLE1BQU0sU0FBUyxJQUFJLE9BQU87QUFFaEUsVUFBSSxVQUFVLFNBQVM7QUFDckIsZ0JBQVEsTUFBTSxLQUFLLFNBQVMsSUFBSSxPQUFPLDRCQUFXLEVBQUU7QUFBQSxNQUN0RCxXQUFXLFVBQVUsUUFBUTtBQUMzQixnQkFBUSxLQUFLLEtBQUssU0FBUyxJQUFJLE9BQU8sNEJBQVcsRUFBRTtBQUFBLE1BQ3JELE9BQU87QUFDTCxnQkFBUSxJQUFJLEtBQUssU0FBUyxJQUFJLE9BQU8sNEJBQVcsRUFBRTtBQUFBLE1BQ3BEO0FBQUEsSUFDRjtBQUFBLElBRUEsTUFBTSxLQUFhLEtBQXFDO0FBQUUsV0FBSyxJQUFJLFNBQVMsS0FBSyxHQUFHO0FBQUEsSUFBRztBQUFBLElBQ3ZGLEtBQUssS0FBYSxLQUFzQztBQUFFLFdBQUssSUFBSSxRQUFTLEtBQUssR0FBRztBQUFBLElBQUc7QUFBQSxJQUN2RixLQUFLLEtBQWEsS0FBc0M7QUFBRSxXQUFLLElBQUksUUFBUyxLQUFLLEdBQUc7QUFBQSxJQUFHO0FBQUEsSUFDdkYsTUFBTSxLQUFhLEtBQXFDO0FBQUUsV0FBSyxJQUFJLFNBQVMsS0FBSyxHQUFHO0FBQUEsSUFBRztBQUFBLElBRXZGLE1BQU0sUUFBd0I7QUFBRSxhQUFPLElBQUksUUFBTyxHQUFHLEtBQUssTUFBTSxJQUFJLE1BQU0sRUFBRTtBQUFBLElBQUc7QUFBQSxFQUNqRjtBQUVPLE1BQU0sU0FBUyxJQUFJLE9BQU87OztBQzVDakMsTUFBTSxNQUFNLE9BQU8sTUFBTSxhQUFhO0FBRS9CLE1BQU0sb0JBQU4sTUFBc0Q7QUFBQSxJQUMzRCxNQUFNLGVBQWUsVUFBbUQ7QUFDdEUsYUFBTyxTQUFTLFlBQVk7QUFDMUIsWUFBSSxNQUFNLGtCQUFrQixFQUFFLFVBQVUsTUFBTSxTQUFTLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQztBQUNwRSxjQUFNLE9BQU8sTUFBTTtBQUFBLFVBQ2pCO0FBQUEsVUFDQSxlQUFlLFFBQVE7QUFBQSxRQUN6QjtBQUNBLGVBQU8sS0FBSyxDQUFDLElBQUksUUFBUSxPQUFPLEtBQUssQ0FBQyxDQUFDLElBQUk7QUFBQSxNQUM3QyxDQUFDO0FBQUEsSUFDSDtBQUFBLElBRUEsTUFBTSxLQUFLLFNBQTRDO0FBQ3JELGFBQU8sU0FBUyxZQUFZO0FBQzFCLGNBQU0sTUFBTSxNQUFNO0FBQUEsVUFDaEI7QUFBQSxVQUNBLFFBQVEsT0FBTztBQUFBLFFBQ2pCO0FBQ0EsZUFBTyxRQUFRLE9BQU8sR0FBRztBQUFBLE1BQzNCLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFFQSxNQUFNLGVBQWUsSUFBWSxVQUF5QztBQUN4RSxhQUFPLFNBQVMsWUFBWTtBQUMxQixjQUFNLGNBQWMsWUFBWSxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQztBQUFBLE1BQzdELENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjs7O0FDWk8sTUFBTSxTQUFOLE1BQU0sUUFBTztBQUFBLElBQ1YsWUFBNkIsT0FBb0I7QUFBcEI7QUFBQSxJQUFxQjtBQUFBLElBRTFELE9BQU8sT0FBTyxPQUFzRDtBQUNsRSxVQUFJLENBQUMsTUFBTSxNQUFNLE9BQVEsT0FBTSxJQUFJLGdCQUFnQixpQ0FBaUM7QUFDcEYsVUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUcsT0FBTSxJQUFJLGdCQUFnQixxQkFBa0I7QUFDcEUsVUFBSSxDQUFDLE1BQU0sU0FBUyxLQUFLLEVBQUcsT0FBTSxJQUFJLGdCQUFnQiw0QkFBc0I7QUFDNUUsWUFBTSxRQUFRLE1BQU0sTUFBTSxPQUFPLENBQUMsR0FBRyxNQUFNLEtBQUssT0FBTyxJQUFJLEVBQUUsU0FBUyxHQUFHLElBQUksS0FBSyxDQUFDO0FBQ25GLGFBQU8sSUFBSSxRQUFPLGlDQUFLLFFBQUwsRUFBWSxPQUFPLFFBQVEsV0FBVyxFQUFDO0FBQUEsSUFDM0Q7QUFBQSxJQUVBLE9BQU8sT0FBTyxLQUEwQjtBQUFFLGFBQU8sSUFBSSxRQUFPLEdBQUc7QUFBQSxJQUFHO0FBQUEsSUFFbEUsSUFBSSxLQUF5QjtBQUFFLGFBQU8sS0FBSyxNQUFNO0FBQUEsSUFBSTtBQUFBLElBQ3JELElBQUksUUFBZ0I7QUFBRSxhQUFPLEtBQUssTUFBTTtBQUFBLElBQU87QUFBQSxJQUMvQyxJQUFJLFFBQStCO0FBQUUsYUFBTyxLQUFLLE1BQU07QUFBQSxJQUFPO0FBQUEsSUFDOUQsSUFBSSxZQUEyQjtBQUFFLGFBQU8sS0FBSyxNQUFNO0FBQUEsSUFBVztBQUFBLElBRTlELFNBQXNCO0FBQUUsYUFBTyxtQkFBSyxLQUFLO0FBQUEsSUFBUztBQUFBLEVBQ3BEOzs7QUNsQ0EsTUFBTUEsT0FBTSxPQUFPLE1BQU0sWUFBWTtBQUU5QixNQUFNLG1CQUFOLE1BQW9EO0FBQUEsSUFDekQsTUFBTSxLQUFLLFFBQXlDO0FBQ2xELGFBQU8sU0FBUyxZQUFZO0FBWmhDO0FBYU0sUUFBQUEsS0FBSSxLQUFLLG1CQUFtQixFQUFFLE9BQU8sT0FBTyxNQUFNLENBQUM7QUFFbkQsY0FBTSxPQUFPLE1BQU0sY0FBYyxvQkFBb0I7QUFBQSxVQUNuRCxRQUFRO0FBQUEsVUFDUixTQUFTLEVBQUUsVUFBVSxzQkFBc0I7QUFBQSxVQUMzQyxNQUFNLEtBQUssVUFBVSxPQUFPLE9BQU8sQ0FBQztBQUFBLFFBQ3RDLENBQUM7QUFDRCxZQUFJLENBQUMsS0FBSyxJQUFJO0FBQ1osZ0JBQU0sT0FBTyxNQUFNLEtBQUssS0FBSztBQUM3QixnQkFBTSxJQUFJLGFBQWEsdUJBQXVCLEVBQUUsUUFBUSxLQUFLLFFBQVEsS0FBSyxDQUFDO0FBQUEsUUFDN0U7QUFDQSxjQUFNLE9BQU0sVUFBSyxRQUFRLElBQUksVUFBVSxNQUEzQixZQUFnQztBQUM1QyxjQUFNLFVBQVUsSUFBSSxNQUFNLGNBQWM7QUFDeEMsWUFBSSxDQUFDLFFBQVMsT0FBTSxJQUFJLGFBQWEsK0JBQTRCO0FBQ2pFLGNBQU0sS0FBSyxTQUFTLFFBQVEsQ0FBQyxHQUFJLEVBQUU7QUFDbkMsZUFBTyxPQUFPLE9BQU8saUNBQUssT0FBTyxPQUFPLElBQW5CLEVBQXNCLEdBQUcsRUFBZ0I7QUFBQSxNQUNoRSxDQUFDO0FBQUEsSUFDSDtBQUFBLElBRUEsTUFBTSxhQUFhLElBQVksV0FBbUIsUUFBdUM7QUFDdkYsYUFBTyxTQUFTLFlBQVk7QUFDMUIsY0FBTTtBQUFBLFVBQ0o7QUFBQSxVQUNBLFNBQVMsRUFBRSxrQkFBa0IsU0FBUztBQUFBLFVBQ3RDLEVBQUUsT0FBTztBQUFBLFFBQ1g7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFFRjs7O0FDcENBLE1BQU1DLE9BQU0sT0FBTyxNQUFNLFlBQVk7QUFFOUIsTUFBTSxtQkFBTixNQUFvRDtBQUFBLElBQ3pELE1BQU0sc0JBQ0osVUFDQSxRQUMyQztBQUMzQyxhQUFPLFNBQVMsWUFBWTtBQWJoQztBQWNNLFFBQUFBLEtBQUksTUFBTSx5QkFBeUIsRUFBRSxPQUFPLENBQUM7QUFDN0MsY0FBTSxPQUFPLE1BQU07QUFBQSxVQUNqQjtBQUFBLFVBQ0EsZUFBZSxRQUFRLGNBQWMsTUFBTTtBQUFBLFFBQzdDO0FBQ0EsZ0JBQU8sVUFBSyxDQUFDLE1BQU4sWUFBVztBQUFBLE1BQ3BCLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFFQSxNQUFNLGlCQUNKLE1BQ29DO0FBRXBDLFVBQUksS0FBSyxPQUFPLFFBQVc7QUFDekIsZUFBTyxTQUFTLFlBQVk7QUE1QmxDO0FBNkJRLGdCQUF5QixXQUFqQixLQTdCaEIsSUE2QmlDLElBQVYsa0JBQVUsSUFBVixDQUFQO0FBQ1IsZ0JBQU0sT0FBTyxNQUFNO0FBQUEsWUFDakI7QUFBQSxZQUNBLFNBQVMsRUFBRTtBQUFBLFlBQ1g7QUFBQSxVQUNGO0FBQ0Esa0JBQVEsVUFBSyxDQUFDLE1BQU4sWUFBVyxtQkFBSztBQUFBLFFBQzFCLENBQUM7QUFBQSxNQUNIO0FBQ0EsYUFBTztBQUFBLFFBQVMsTUFDZCxhQUFnQyx3QkFBd0IsSUFBSTtBQUFBLE1BQzlEO0FBQUEsSUFDRjtBQUFBLElBRUEsTUFBTSxzQkFBc0IsUUFBeUM7QUFDbkUsYUFBTyxTQUFTLFlBQVk7QUFDMUIsY0FBTSxPQUFPLE1BQU07QUFBQSxVQUNqQjtBQUFBLFVBQ0EsYUFBYSxNQUFNO0FBQUEsUUFDckI7QUFDQSxlQUFPLEtBQUs7QUFBQSxNQUNkLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFFQSxNQUFNLGFBQ0osVUFDQSxNQUNBLFFBQ0EsUUFDdUI7QUFDdkIsYUFBTyxTQUFTLFlBQVk7QUFDMUIsY0FBTSxhQUFhLHFCQUFxQixFQUFFLFVBQVUsTUFBTSxRQUFRLE9BQU8sQ0FBQztBQUFBLE1BQzVFLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjs7O0FDNURPLE1BQU0sUUFBTixNQUE4QjtBQUFBLElBSW5DLFlBQVksY0FBaUI7QUFGN0IsV0FBUSxrQkFBa0Isb0JBQUksSUFBaUI7QUFHN0MsV0FBSyxRQUFRLG1CQUFLO0FBQUEsSUFDcEI7QUFBQSxJQUVBLFdBQXdCO0FBQ3RCLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQSxJQUVBLFNBQVMsU0FBOEQ7QUFDckUsWUFBTSxRQUFRLE9BQU8sWUFBWSxhQUM3QixRQUFRLEtBQUssS0FBSyxJQUNsQjtBQUNKLFdBQUssUUFBUSxrQ0FBSyxLQUFLLFFBQVU7QUFDakMsV0FBSyxnQkFBZ0IsUUFBUSxPQUFLLEVBQUUsS0FBSyxLQUFLLENBQUM7QUFBQSxJQUNqRDtBQUFBLElBRUEsVUFBVSxVQUFtQztBQUMzQyxXQUFLLGdCQUFnQixJQUFJLFFBQVE7QUFDakMsYUFBTyxNQUFNLEtBQUssZ0JBQWdCLE9BQU8sUUFBUTtBQUFBLElBQ25EO0FBQUEsSUFFQSxPQUFVLFVBQTBCLFVBQW1DO0FBQ3JFLFVBQUksT0FBTyxTQUFTLEtBQUssS0FBSztBQUM5QixhQUFPLEtBQUssVUFBVSxXQUFTO0FBQzdCLGNBQU0sT0FBTyxTQUFTLEtBQUs7QUFDM0IsWUFBSSxTQUFTLE1BQU07QUFDakIsaUJBQU87QUFDUCxtQkFBUyxJQUFJO0FBQUEsUUFDZjtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGOzs7QUN6QkEsTUFBTSxZQUFZLEtBQUssa0JBQWtCO0FBQ3pDLE1BQU0sY0FBYyxLQUFLLGtCQUFrQjtBQUUzQyxXQUFTLFlBQVksU0FBa0M7QUFDckQsV0FBTyxDQUFDLENBQUMsV0FBVyxRQUFRLGFBQWE7QUFBQSxFQUMzQztBQUVPLFdBQVMsYUFBYSxTQUFrQztBQUM3RCxXQUFPLENBQUMsQ0FBQyxXQUFXLFFBQVEsYUFBYTtBQUFBLEVBQzNDO0FBRU8sTUFBTSxXQUFXLElBQUksTUFBZ0I7QUFBQSxJQUMxQyxTQUFTO0FBQUEsSUFDVCxZQUFZO0FBQUEsSUFDWixTQUFTO0FBQUEsSUFDVCxlQUFlO0FBQUEsSUFDZixlQUFlO0FBQUEsSUFDZixzQkFBc0I7QUFBQSxJQUN0QixrQkFBa0I7QUFBQSxFQUNwQixDQUFDO0FBRU0sV0FBUyxXQUFXLFNBQStCO0FBQ3hELGFBQVMsU0FBUztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxZQUFZLENBQUMsQ0FBQztBQUFBLE1BQ2QsU0FBUyxZQUFZLE9BQU87QUFBQSxJQUM5QixDQUFDO0FBQUEsRUFDSDtBQUVPLFdBQVMsWUFBWSxPQUFlLE9BQXFCO0FBQzlELGFBQVMsU0FBUyxFQUFFLGVBQWUsT0FBTyxlQUFlLE1BQU0sQ0FBQztBQUFBLEVBQ2xFOzs7QUNyQ0EsTUFBTUMsT0FBTSxPQUFPLE1BQU0sY0FBYztBQUV2QyxNQUFNLGNBQWM7QUFDcEIsTUFBTSxpQkFBaUI7QUFDdkIsTUFBTSxpQkFBaUIsS0FBSyxLQUFLLEtBQUs7QUFPL0IsTUFBTSxlQUFOLE1BQW1CO0FBQUEsSUFHeEIsWUFBNkIsYUFBaUM7QUFBakM7QUFGN0IsV0FBUSxjQUEyQixFQUFFLFVBQVUsR0FBRyxjQUFjLEVBQUU7QUFBQSxJQUVIO0FBQUEsSUFFL0QsaUJBQWlDO0FBdkJuQztBQXdCSSxVQUFJO0FBQ0YsY0FBTSxLQUFLLFFBQU8sb0JBQWUsUUFBUSxjQUFjLE1BQXJDLFlBQTBDLEdBQUc7QUFDL0QsWUFBSSxLQUFLLElBQUksSUFBSSxLQUFLLGdCQUFnQjtBQUNwQyxlQUFLLGFBQWE7QUFDbEIsaUJBQU87QUFBQSxRQUNUO0FBQ0EsY0FBTSxNQUFNLGVBQWUsUUFBUSxXQUFXO0FBQzlDLFlBQUksQ0FBQyxJQUFLLFFBQU87QUFDakIsY0FBTSxPQUFPLEtBQUssTUFBTSxHQUFHO0FBQzNCLGNBQU0sVUFBVSxRQUFRLE9BQU8sSUFBSTtBQUNuQyxtQkFBVyxPQUFPO0FBQ2xCLGVBQU87QUFBQSxNQUNULFNBQVE7QUFDTixhQUFLLGFBQWE7QUFDbEIsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQUEsSUFFQSxNQUFNLFFBQVEsVUFBMkU7QUExQzNGO0FBMkNJLFVBQUksS0FBSyxJQUFJLElBQUksS0FBSyxZQUFZLGNBQWM7QUFDOUMsZUFBTyxLQUFLLElBQUksZUFBZSxLQUFLLFlBQVksZUFBZSxLQUFLLElBQUksQ0FBQyxDQUFDO0FBQUEsTUFDNUU7QUFFQSxZQUFNLE1BQU0sU0FBUyxRQUFRLE9BQU8sRUFBRTtBQUN0QyxVQUFJLElBQUksU0FBUyxHQUFJLFFBQU8sS0FBSyxJQUFJLGdCQUFnQixzQkFBbUIsQ0FBQztBQUV6RSxNQUFBQSxLQUFJLEtBQUssd0JBQXdCLEVBQUUsS0FBSyxNQUFNLElBQUksTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDO0FBQy9ELFlBQU0sU0FBUyxNQUFNLEtBQUssWUFBWSxlQUFlLEdBQUc7QUFFeEQsVUFBSSxDQUFDLE9BQU8sSUFBSTtBQUVkLFlBQUksT0FBTyxNQUFNLFNBQVMsZ0JBQWdCO0FBQ3hDLGVBQUssWUFBWTtBQUNqQixjQUFJLEtBQUssWUFBWSxZQUFZLEdBQUc7QUFDbEMsaUJBQUssWUFBWSxlQUFlLEtBQUssSUFBSSxJQUFJO0FBQzdDLGlCQUFLLFlBQVksV0FBVztBQUM1QixtQkFBTyxLQUFLLElBQUksZUFBZSxHQUFNLENBQUM7QUFBQSxVQUN4QztBQUFBLFFBQ0Y7QUFDQSxlQUFPLEtBQUssT0FBTyxLQUFLO0FBQUEsTUFDMUI7QUFFQSxXQUFLLFlBQVksV0FBVztBQUM1QixhQUFPLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQyxPQUFPLE9BQU8sVUFBUyxZQUFPLFVBQVAsWUFBZ0IsT0FBVSxDQUFDO0FBQUEsSUFDMUU7QUFBQSxJQUVBLE1BQU0sU0FBUyxNQUFjLFVBQWtCLFVBQTRDO0FBQ3pGLGFBQU8sU0FBUyxZQUFZO0FBQzFCLGNBQU0sU0FBUyxRQUFRLE9BQU8sRUFBRSxNQUFNLFVBQVUsU0FBUyxDQUFDO0FBQzFELGNBQU0sUUFBUSxNQUFNLEtBQUssWUFBWSxLQUFLLE1BQU07QUFDaEQsWUFBSSxDQUFDLE1BQU0sR0FBSSxPQUFNLE1BQU07QUFDM0IsZUFBTyxNQUFNO0FBQUEsTUFDZixDQUFDO0FBQUEsSUFDSDtBQUFBLElBRUEsTUFBTSxTQUF3QjtBQUM1QixxQkFBZSxRQUFRLGFBQWEsS0FBSyxVQUFVLFFBQVEsT0FBTyxDQUFDLENBQUM7QUFDcEUscUJBQWUsUUFBUSxnQkFBZ0IsT0FBTyxLQUFLLElBQUksQ0FBQyxDQUFDO0FBQ3pELGlCQUFXLE9BQU87QUFDbEIsTUFBQUEsS0FBSSxLQUFLLG1CQUFtQixFQUFFLElBQUksUUFBUSxHQUFHLENBQUM7QUFBQSxJQUNoRDtBQUFBLElBRUEsU0FBZTtBQUNiLFdBQUssYUFBYTtBQUNsQixpQkFBVyxJQUFJO0FBQ2YsTUFBQUEsS0FBSSxLQUFLLGtCQUFrQjtBQUFBLElBQzdCO0FBQUEsSUFFUSxlQUFxQjtBQUMzQixxQkFBZSxXQUFXLFdBQVc7QUFDckMscUJBQWUsV0FBVyxjQUFjO0FBQUEsSUFDMUM7QUFBQSxFQUNGOzs7QUM1RkEsTUFBTUMsT0FBTSxPQUFPLE1BQU0sYUFBYTtBQUUvQixNQUFNLGNBQU4sTUFBa0I7QUFBQSxJQUFsQjtBQUNMLFdBQVEsUUFBUSxvQkFBSSxJQUF3QjtBQUFBO0FBQUEsSUFFNUMsSUFBSSxNQUFjLE9BQXFCO0FBQ3JDLFVBQUksS0FBSyxNQUFNLElBQUksSUFBSSxFQUFHO0FBQzFCLFdBQUssTUFBTSxJQUFJLE1BQU0sRUFBRSxNQUFNLE9BQU8sT0FBTyxLQUFLLEVBQUUsQ0FBQztBQUNuRCxXQUFLLE9BQU87QUFDWixNQUFBQSxLQUFJLE1BQU0sbUJBQW1CLEVBQUUsS0FBSyxDQUFDO0FBQUEsSUFDdkM7QUFBQSxJQUVBLE9BQU8sTUFBb0I7QUFDekIsVUFBSSxDQUFDLEtBQUssTUFBTSxJQUFJLElBQUksRUFBRztBQUMzQixXQUFLLE1BQU0sT0FBTyxJQUFJO0FBQ3RCLFdBQUssT0FBTztBQUNaLE1BQUFBLEtBQUksTUFBTSxpQkFBaUIsRUFBRSxLQUFLLENBQUM7QUFBQSxJQUNyQztBQUFBLElBRUEsT0FBTyxNQUFjLE9BQW9DO0FBQ3ZELFVBQUksS0FBSyxNQUFNLElBQUksSUFBSSxHQUFHO0FBQ3hCLGFBQUssT0FBTyxJQUFJO0FBQ2hCLGVBQU87QUFBQSxNQUNUO0FBQ0EsV0FBSyxJQUFJLE1BQU0sS0FBSztBQUNwQixhQUFPO0FBQUEsSUFDVDtBQUFBLElBRUEsUUFBYztBQUNaLFdBQUssTUFBTSxNQUFNO0FBQ2pCLFdBQUssT0FBTztBQUFBLElBQ2Q7QUFBQSxJQUVBLFdBQWtDO0FBQ2hDLGFBQU8sTUFBTSxLQUFLLEtBQUssTUFBTSxPQUFPLENBQUM7QUFBQSxJQUN2QztBQUFBLElBRUEsV0FBbUI7QUFDakIsYUFBTyxNQUFNLEtBQUssS0FBSyxNQUFNLE9BQU8sQ0FBQyxFQUNsQyxPQUFPLENBQUMsS0FBSyxNQUFNLEtBQUssT0FBTyxNQUFNLEVBQUUsU0FBUyxHQUFHLElBQUksS0FBSyxDQUFDO0FBQUEsSUFDbEU7QUFBQSxJQUVBLFdBQW1CO0FBQUUsYUFBTyxLQUFLLE1BQU07QUFBQSxJQUFNO0FBQUEsSUFFN0MsSUFBSSxNQUF1QjtBQUFFLGFBQU8sS0FBSyxNQUFNLElBQUksSUFBSTtBQUFBLElBQUc7QUFBQSxJQUUxRCxVQUFtQjtBQUFFLGFBQU8sS0FBSyxNQUFNLFNBQVM7QUFBQSxJQUFHO0FBQUEsSUFFbkQsaUJBQWlCLFVBQXFDO0FBQ3BELFVBQUksVUFBVTtBQUNkLFdBQUssTUFBTSxRQUFRLENBQUMsTUFBTSxRQUFRO0FBQ2hDLGNBQU0sWUFBWSxTQUFTLElBQUksR0FBRztBQUNsQyxZQUFJLGNBQWMsVUFBYSxjQUFjLEtBQUssT0FBTztBQUN2RCxlQUFLLE1BQU0sSUFBSSxLQUFLLGlDQUFLLE9BQUwsRUFBVyxPQUFPLFVBQVUsRUFBQztBQUNqRCxvQkFBVTtBQUNWLFVBQUFBLEtBQUksS0FBSyx1QkFBb0IsRUFBRSxNQUFNLEtBQUssS0FBSyxLQUFLLE9BQU8sS0FBSyxVQUFVLENBQUM7QUFBQSxRQUM3RTtBQUFBLE1BQ0YsQ0FBQztBQUNELFVBQUksUUFBUyxNQUFLLE9BQU87QUFBQSxJQUMzQjtBQUFBLElBRVEsU0FBZTtBQUNyQixrQkFBWSxLQUFLLFNBQVMsR0FBRyxLQUFLLFNBQVMsQ0FBQztBQUFBLElBQzlDO0FBQUEsRUFDRjs7O0FDN0RBLE1BQU0sb0JBQW9CLElBQUksa0JBQWtCO0FBQ2hELE1BQU0sbUJBQW1CLElBQUksaUJBQWlCO0FBQzlDLE1BQU0sbUJBQW1CLElBQUksaUJBQWlCO0FBRXZDLE1BQU0sZUFBZSxJQUFJLGFBQWEsaUJBQWlCO0FBQ3ZELE1BQU0sY0FBYyxJQUFJLFlBQVk7OztBQ0YzQyxNQUFNLGlCQUEyQjtBQUFBLElBQy9CO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBRUEsTUFBSSxXQUFxQixDQUFDLEdBQUcsY0FBYztBQUMzQyxNQUFJLGdCQUFnQjtBQUNwQixNQUFJLFdBQVc7QUFDZixNQUFJLGtCQUFpQztBQUU5QixXQUFTLG1CQUE2QjtBQUFFLFdBQU87QUFBQSxFQUFnQjtBQUMvRCxXQUFTLGFBQXVCO0FBQUUsV0FBTztBQUFBLEVBQVU7QUFDbkQsV0FBUyxXQUFXLEdBQW1CO0FBQUUsZUFBVztBQUFBLEVBQUc7QUFFdkQsV0FBUyxrQkFBa0IsSUFBeUI7QUFBRSxzQkFBa0I7QUFBQSxFQUFJO0FBR25GLGlCQUFzQixpQkFBK0M7QUEvQnJFO0FBZ0NFLFFBQUk7QUFDRixZQUFNLE9BQU8sTUFBTSxZQUEwQixpQkFBaUIsaUJBQWlCO0FBQy9FLFVBQUksS0FBSyxDQUFDLEdBQUc7QUFDWCxtQkFBVyxNQUFNLFFBQVEsS0FBSyxDQUFDLEVBQUUsT0FBTyxJQUFJLEtBQUssQ0FBQyxFQUFFLFVBQVU7QUFBQSxNQUNoRTtBQUNBLGNBQU8sVUFBSyxDQUFDLE1BQU4sWUFBVztBQUFBLElBQ3BCLFNBQVE7QUFBRSxhQUFPO0FBQUEsSUFBTTtBQUFBLEVBQ3pCO0FBRUEsaUJBQXNCLGdCQUFnQixXQUFpRjtBQUNySCxVQUFNLFNBQVMsZUFBZTtBQUM5QixVQUFNLFNBQVMsTUFBTSxpQkFBaUIsc0JBQXNCLE9BQU8sU0FBUyxHQUFHLE1BQU07QUFDckYsUUFBSSxDQUFDLE9BQU8sR0FBSSxRQUFPO0FBQ3ZCLFFBQUksT0FBTyxNQUFPLG1CQUFrQixPQUFPLE1BQU07QUFDakQsV0FBTyxPQUFPO0FBQUEsRUFDaEI7QUFFQSxpQkFBc0IsTUFDcEIsVUFDQSxhQUNlO0FBQ2YsUUFBSSxTQUFVO0FBRWQsVUFBTSxRQUFRLFNBQVMsU0FBUztBQUNoQyxRQUFJLENBQUMsYUFBYSxNQUFNLE9BQU8sR0FBRztBQUNoQyxtQkFBYSxvRkFBbUUsTUFBTTtBQUN0RjtBQUFBLElBQ0Y7QUFFQSxlQUFXO0FBQ1gsVUFBTSxNQUFNLFNBQVMsZUFBZSxnQkFBZ0I7QUFDcEQsUUFBSSxLQUFLO0FBQUUsVUFBSSxXQUFXO0FBQU0sVUFBSSxjQUFjO0FBQUEsSUFBYztBQUVoRSxVQUFNLElBQUksU0FBUztBQUNuQixVQUFNLE1BQU0sTUFBTTtBQUNsQixVQUFNLFNBQVMsS0FBSyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUM7QUFDM0MsVUFBTSxlQUFlLElBQUksS0FBSyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUM7QUFDckQsVUFBTSxhQUFhLGVBQWUsT0FBTyxNQUFNLE1BQU0sU0FBUyxNQUFNO0FBQ3BFLFVBQU0sZUFBZSxnQkFBZ0I7QUFFckMsVUFBTSxPQUFPLFNBQVMsZUFBZSxZQUFZO0FBQ2pELFFBQUksTUFBTTtBQUNSLFdBQUssTUFBTSxhQUFhO0FBQ3hCLFdBQUssTUFBTSxrQkFBa0I7QUFDN0IsV0FBSyxNQUFNLFlBQVksVUFBVSxZQUFZO0FBQUEsSUFDL0M7QUFFQSxxQkFBa0IsZUFBZSxNQUFPLE9BQU87QUFFL0MsVUFBTSxJQUFJLFFBQWMsYUFBVyxXQUFXLFNBQVMsSUFBSSxDQUFDO0FBRTVELFVBQU0sU0FBUyxTQUFTLE1BQU07QUFDOUIsZUFBVztBQUVYLGdCQUFZLFFBQVEsTUFBTTtBQUUxQixRQUFJLGFBQWEsTUFBTSxPQUFPLEtBQUssS0FBSztBQUN0QyxVQUFJLFdBQVc7QUFDZixVQUFJLGNBQWM7QUFBQSxJQUNwQjtBQUFBLEVBQ0Y7QUFFQSxpQkFBc0IsZUFBZSxTQUFrQixRQUErQjtBQUNwRixRQUFJLGFBQWEsU0FBUyxTQUFTLEVBQUUsT0FBTyxFQUFHO0FBQy9DLFFBQUksQ0FBQyxnQkFBaUI7QUFFdEIsVUFBTSxTQUFTLGVBQWU7QUFFOUIsVUFBTSxjQUFjLE1BQU0saUJBQWlCLGlCQUFpQjtBQUFBLE1BQzFELElBQUk7QUFBQSxNQUNKLFVBQVU7QUFBQSxNQUNWO0FBQUEsSUFDRixDQUFpRDtBQUVqRCxRQUFJLENBQUMsWUFBWSxJQUFJO0FBQ25CLGNBQVEsTUFBTSx5Q0FBbUMsWUFBWSxLQUFLO0FBQ2xFO0FBQUEsSUFDRjtBQUVBLFVBQU0saUJBQWlCLE1BQU0saUJBQWlCO0FBQUEsTUFDNUMsUUFBUTtBQUFBLE1BQ1IsUUFBUTtBQUFBLE1BQ1I7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUVBLFFBQUksQ0FBQyxlQUFlLElBQUk7QUFDdEIsY0FBUSxNQUFNLDRCQUE0QixlQUFlLEtBQUs7QUFBQSxJQUNoRTtBQUFBLEVBQ0Y7QUFFTyxXQUFTLGVBQWUsU0FBeUI7QUFDdEQsVUFBTSxPQUFPLFNBQVMsY0FBYyxzQkFBc0I7QUFDMUQsUUFBSSxDQUFDLEtBQU07QUFDWCxVQUFNLE1BQU0sU0FBUyxlQUFlLGNBQWM7QUFDbEQsUUFBSSxJQUFLLEtBQUksT0FBTztBQUVwQixVQUFNLElBQUksUUFBUTtBQUNsQixVQUFNLEtBQUssS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLFFBQVEsS0FBSyxVQUFVO0FBQzFELFVBQU0sTUFBTSxNQUFNO0FBQ2xCLFVBQU0sUUFBUTtBQUFBLE1BQ1osRUFBRSxJQUFJLFdBQVcsS0FBSyxVQUFVO0FBQUEsTUFDaEMsRUFBRSxJQUFJLFdBQVcsS0FBSyxVQUFVO0FBQUEsSUFDbEM7QUFFQSxVQUFNLE1BQU0sQ0FBQyxNQUFzQixJQUFJLEtBQUssS0FBSztBQUNqRCxVQUFNLEtBQUssQ0FBQyxHQUFXLE1BQWdDLENBQUMsS0FBSyxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM1RyxVQUFNLE1BQU0sQ0FBQyxNQUFzQixFQUFFLFFBQVEsTUFBTSxPQUFPLEVBQUUsUUFBUSxNQUFNLE1BQU0sRUFBRSxRQUFRLE1BQU0sTUFBTTtBQUV0RyxhQUFTLFFBQVEsR0FBbUI7QUFDbEMsWUFBTSxJQUFJLE1BQU0sSUFBSSxJQUFJLElBQUksSUFBSTtBQUNoQyxZQUFNLENBQUMsSUFBSSxFQUFFLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsR0FBRyxDQUFDO0FBQzdDLGFBQU8sSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQztBQUFBLElBQzNHO0FBRUEsYUFBUyxVQUFVLE1BQWMsVUFBNEI7QUFDM0QsWUFBTSxRQUFRLEtBQUssTUFBTSxHQUFHO0FBQzVCLFlBQU0sUUFBa0IsQ0FBQztBQUN6QixVQUFJLE1BQU07QUFDVixZQUFNLFFBQVEsT0FBSztBQUNqQixjQUFNLE9BQU8sTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUs7QUFDbkMsWUFBSSxLQUFLLFNBQVMsWUFBWSxLQUFLO0FBQUUsZ0JBQU0sS0FBSyxHQUFHO0FBQUcsZ0JBQU07QUFBQSxRQUFHLE1BQzFELE9BQU07QUFBQSxNQUNiLENBQUM7QUFDRCxVQUFJLElBQUssT0FBTSxLQUFLLEdBQUc7QUFDdkIsYUFBTyxNQUFNLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDekI7QUFFQSxVQUFNLE9BQU8sUUFBUSxJQUFJLENBQUMsR0FBRyxNQUFNO0FBQ2pDLFlBQU0sSUFBSSxNQUFNLElBQUksQ0FBQztBQUNyQixhQUFPLFlBQVksUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7QUFBQSxJQUM5QyxDQUFDLEVBQUUsS0FBSyxFQUFFO0FBRVYsVUFBTSxTQUFTLFFBQVEsSUFBSSxDQUFDLEdBQUcsTUFBTTtBQUNuQyxZQUFNLElBQUksTUFBTSxJQUFJO0FBQ3BCLFlBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUN0QixhQUFPLGFBQWEsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUFBLElBQzdFLENBQUMsRUFBRSxLQUFLLEVBQUU7QUFFVixVQUFNLFFBQVEsUUFBUSxJQUFJLENBQUMsR0FBRyxNQUFNO0FBQ2xDLFlBQU0sTUFBTSxNQUFNLElBQUksS0FBSyxNQUFNO0FBQ2pDLFlBQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFHLEtBQUssSUFBSSxJQUFJO0FBQ2pDLFlBQU0sSUFBSSxNQUFNLElBQUksQ0FBQztBQUNyQixZQUFNLElBQUksRUFBRSxNQUFNLGdCQUFnQjtBQUNsQyxZQUFNLFFBQVEsSUFBSSxFQUFFLENBQUMsSUFBSztBQUMxQixZQUFNLE9BQU8sSUFBSSxFQUFFLENBQUMsSUFBSztBQUN6QixZQUFNLFFBQVEsVUFBVSxNQUFNLEVBQUU7QUFDaEMsWUFBTSxRQUFRO0FBQ2QsWUFBTSxZQUFZLE1BQU0sU0FBUztBQUNqQyxZQUFNLFNBQVMsRUFBRSxZQUFZLEtBQUs7QUFDbEMsWUFBTSxPQUFPLE1BQU0sSUFBSSxRQUFRLENBQUM7QUFDaEMsYUFBTywyQkFBMkIsR0FBRyxRQUFRLENBQUMsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsWUFBWSxHQUFHO0FBQUEsbUJBQ2hFLE9BQU8sUUFBUSxDQUFDLENBQUMsd0ZBQXdGLElBQUksS0FBSyxDQUFDO0FBQUEsSUFDbEksTUFBTSxJQUFJLENBQUMsR0FBRyxPQUFPO0FBQ3JCLGNBQU0sT0FBTyxNQUFNLE1BQU0sU0FBUyxLQUFLLEtBQUssT0FBTyxRQUFRLENBQUM7QUFDNUQsZUFBTyxrQkFBa0IsRUFBRSwyREFBMkQsRUFBRSxHQUFHLDhFQUE4RSxJQUFJLENBQUMsQ0FBQztBQUFBLE1BQ2pMLENBQUMsRUFBRSxLQUFLLE1BQU0sQ0FBQztBQUFBO0FBQUEsSUFFZixDQUFDLEVBQUUsS0FBSyxFQUFFO0FBRVYsVUFBTSxRQUFRO0FBQ2QsVUFBTSxPQUFPLE1BQU0sS0FBSyxFQUFFLFFBQVEsTUFBTSxHQUFHLENBQUMsR0FBRyxNQUFNO0FBQ25ELFlBQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFJLE1BQU0sUUFBUyxJQUFJLElBQUksS0FBSztBQUNqRCxhQUFPLGVBQWUsR0FBRyxRQUFRLENBQUMsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLENBQUMsZ0NBQWdDLElBQUksQ0FBQztBQUFBLElBQ2hHLENBQUMsRUFBRSxLQUFLLEVBQUU7QUFFVixVQUFNLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsZ0JBa0JFLEVBQUUsU0FBUyxFQUFFLFFBQVEsT0FBTztBQUFBLGdCQUM1QixFQUFFLFNBQVMsRUFBRSxRQUFRLE9BQU87QUFBQSx1QkFDckIsSUFBSSxHQUFHLE1BQU0sR0FBRyxLQUFLO0FBQUEsZ0JBQzVCLEVBQUUsU0FBUyxFQUFFLFFBQVEsSUFBSSxDQUFDO0FBQUEsSUFDdEMsSUFBSTtBQUFBLGdCQUNRLEVBQUUsU0FBUyxFQUFFO0FBQUEsZ0JBQ2IsRUFBRSxTQUFTLEVBQUU7QUFBQSxhQUNoQixFQUFFLFFBQVEsS0FBSyxDQUFDO0FBQUEsYUFDaEIsRUFBRSxRQUFRLEtBQUssQ0FBQztBQUFBO0FBRzNCLFVBQU0sTUFBTSxTQUFTLGNBQWMsS0FBSztBQUN4QyxRQUFJLFlBQVk7QUFDaEIsU0FBSyxhQUFhLElBQUksbUJBQW9CLEtBQUssVUFBVTtBQUFBLEVBQzNEOzs7QUMxTk8sV0FBUyxXQUEyQjtBQUN6QyxXQUFPLE1BQU0sS0FBSyxZQUFZLFNBQVMsQ0FBQztBQUFBLEVBQzFDO0FBRU8sV0FBUyxXQUFtQjtBQUNqQyxXQUFPLFlBQVksU0FBUztBQUFBLEVBQzlCO0FBdUJPLFdBQVMsWUFBWSxNQUF1QjtBQUNqRCxVQUFNLG1CQUFtQjtBQUFBLE1BQ3ZCO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFDQSxXQUFPLGlCQUFpQixTQUFTLElBQUk7QUFBQSxFQUN2QztBQUVPLFdBQVMsZ0JBQWdCLGFBQXFCLGVBQXVCLFNBQXVCO0FBQ2pHLFVBQU0sUUFBUSxTQUFTLGVBQWUsV0FBVztBQUNqRCxVQUFNLFVBQVUsU0FBUyxlQUFlLGFBQWE7QUFDckQsVUFBTSxRQUFRLFNBQVMsZUFBZSxPQUFPO0FBQzdDLFVBQU0sUUFBUSxTQUFTO0FBRXZCLFFBQUksTUFBTyxPQUFNLGNBQWMsT0FBTyxNQUFNLE1BQU07QUFFbEQsUUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFTO0FBRXhCLFFBQUksTUFBTSxXQUFXLEdBQUc7QUFDdEIsWUFBTSxZQUFZO0FBQ2xCLGNBQVEsY0FBYztBQUN0QjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFFBQVEsU0FBUztBQUN2QixVQUFNLFlBQVksTUFBTSxJQUFJLFVBQVE7QUFDbEMsWUFBTSxVQUFVLFFBQVEsS0FBSyxJQUFJO0FBQ2pDLFlBQU0sV0FBVyxtQkFBbUIsS0FBSyxJQUFJO0FBQzdDLGFBQU87QUFBQSxxQ0FDMEIsT0FBTztBQUFBLHNDQUNOLGNBQWMsS0FBSyxLQUFLLENBQUM7QUFBQSx3RkFDeUIsUUFBUTtBQUFBO0FBQUEsSUFFOUYsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLHFHQUFxRyxjQUFjLEtBQUssQ0FBQztBQUN2SSxZQUFRLGNBQWMsY0FBYyxLQUFLO0FBQUEsRUFDM0M7OztBQ3pEQSxNQUFNQyxPQUFNLE9BQU8sTUFBTSxNQUFNO0FBRy9CLE1BQU0sWUFBWSxLQUFLLHNCQUFzQjtBQUU3QyxNQUFJLGVBQWU7QUFDbkIsTUFBSSxlQUFlO0FBR25CLFdBQVMsa0JBQWtDO0FBQ3pDLFdBQU8sU0FBUyxTQUFTLEVBQUU7QUFBQSxFQUM3QjtBQUdBLFdBQVMsUUFBUSxLQUFhLE1BQXlCO0FBQ3JELGFBQVMsaUJBQWlCLGFBQWEsRUFBRSxRQUFRLE9BQUssRUFBRSxVQUFVLE9BQU8sUUFBUSxDQUFDO0FBQ2xGLGFBQVMsaUJBQThCLDhCQUE4QixNQUFNLElBQUksRUFDNUUsUUFBUSxPQUFLLEVBQUUsVUFBVSxJQUFJLFFBQVEsQ0FBQztBQUN6QyxhQUFTLGlCQUFpQixZQUFZLEVBQUUsUUFBUSxVQUFRO0FBQ3RELFlBQU0sS0FBSztBQUNYLFVBQUksUUFBUSxXQUFZLEdBQUcsUUFBUSxLQUFLLE1BQU07QUFDNUMsV0FBRyxVQUFVLE9BQU8sUUFBUTtBQUFBO0FBRTVCLFdBQUcsVUFBVSxJQUFJLFFBQVE7QUFBQSxJQUM3QixDQUFDO0FBQUEsRUFDSDtBQUdBLFdBQVMsZUFBcUI7QUFDNUIsVUFBTSxNQUFNLFNBQVMsZUFBZSxTQUFTO0FBQzdDLFVBQU0sUUFBUSxTQUFTLGVBQWUsV0FBVztBQUNqRCxVQUFNLFFBQVEsWUFBWSxTQUFTO0FBQ25DLFFBQUksTUFBTyxPQUFNLGNBQWMsT0FBTyxLQUFLO0FBQzNDLFFBQUksS0FBSztBQUNQLFVBQUksUUFBUSxFQUFHLEtBQUksVUFBVSxJQUFJLE9BQU87QUFBQSxXQUNuQztBQUFFLFlBQUksVUFBVSxPQUFPLE9BQU87QUFBRyxvQkFBWTtBQUFBLE1BQUc7QUFBQSxJQUN2RDtBQUFBLEVBQ0Y7QUFFQSxXQUFTLGFBQWEsT0FBb0IsTUFBYyxPQUFxQjtBQUMzRSxVQUFNLE9BQU8sTUFBTSxRQUFRLFlBQVk7QUFDdkMsUUFBSSxZQUFZLElBQUksSUFBSSxHQUFHO0FBQ3pCLGtCQUFZLE9BQU8sSUFBSTtBQUN2QixtQ0FBTSxVQUFVLE9BQU87QUFDdkIsbUJBQWE7QUFDYjtBQUFBLElBQ0Y7QUFDQSxnQkFBWSxJQUFJLE1BQU0sS0FBSztBQUMzQixpQ0FBTSxVQUFVLElBQUk7QUFDcEIsaUJBQWE7QUFDYixnQkFBWSxNQUFNLEtBQUs7QUFBQSxFQUN6QjtBQUVBLFdBQVMsWUFBWSxNQUFjLE9BQXFCO0FBM0V4RDtBQTRFRSxVQUFNLEtBQUssU0FBUyxlQUFlLGVBQWU7QUFDbEQsUUFBSSxHQUFJLElBQUcsWUFBWSxhQUFhLFFBQVEsSUFBSSxJQUFJLHlCQUFvQixPQUFPLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRSxRQUFRLEtBQUssR0FBRztBQUNqSCxtQkFBUyxlQUFlLGdCQUFnQixNQUF4QyxtQkFBMkMsVUFBVSxJQUFJO0FBQUEsRUFDM0Q7QUFFQSxXQUFTLGVBQXFCO0FBakY5QjtBQWtGRSxtQkFBUyxlQUFlLGdCQUFnQixNQUF4QyxtQkFBMkMsVUFBVSxPQUFPO0FBQUEsRUFDOUQ7QUFFQSxXQUFTLHFCQUFxQixHQUFnQjtBQUM1QyxRQUFLLEVBQUUsT0FBdUIsT0FBTyxpQkFBa0IsY0FBYTtBQUFBLEVBQ3RFO0FBRUEsV0FBUyxrQkFBd0I7QUFDL0IsaUJBQWE7QUFDYixlQUFXO0FBQUEsRUFDYjtBQUVBLFdBQVMscUJBQTJCO0FBQ2xDLG9CQUFnQixpQkFBaUIsZUFBZSxZQUFZO0FBQUEsRUFDOUQ7QUFFQSxXQUFTLDRCQUFrQztBQUN6QyxVQUFNLEtBQUssU0FBUyxlQUFlLGlCQUFpQjtBQUNwRCxRQUFJLENBQUMsR0FBSTtBQUNULFVBQU0sUUFBUSxZQUFZLFNBQVM7QUFDbkMsVUFBTSxXQUFXLE1BQU0sS0FBSyxPQUFLLFlBQVksRUFBRSxJQUFJLENBQUM7QUFDcEQsVUFBTSxZQUFZLE1BQU0sS0FBSyxPQUFLLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQztBQUN0RCxRQUFJLFlBQVksV0FBVztBQUN6QixTQUFHLFlBQVk7QUFBQSxJQUNqQixXQUFXLFVBQVU7QUFDbkIsU0FBRyxZQUFZO0FBQUEsSUFDakIsT0FBTztBQUNMLFNBQUcsWUFBWTtBQUFBLElBQ2pCO0FBQUEsRUFDRjtBQUVBLFdBQVMsYUFBbUI7QUFqSDVCO0FBa0hFLHVCQUFtQjtBQUNuQiw4QkFBMEI7QUFDMUIsbUJBQVMsZUFBZSxlQUFlLE1BQXZDLG1CQUEwQyxVQUFVLElBQUk7QUFDeEQsYUFBUyxLQUFLLFVBQVUsSUFBSSxjQUFjO0FBQUEsRUFDNUM7QUFFQSxXQUFTLGNBQW9CO0FBeEg3QjtBQXlIRSxtQkFBUyxlQUFlLGVBQWUsTUFBdkMsbUJBQTBDLFVBQVUsT0FBTztBQUMzRCxhQUFTLEtBQUssVUFBVSxPQUFPLGNBQWM7QUFBQSxFQUMvQztBQUVBLFdBQVMsb0JBQW9CLEdBQWdCO0FBQzNDLFFBQUssRUFBRSxPQUF1QixPQUFPLGdCQUFpQixhQUFZO0FBQUEsRUFDcEU7QUFFQSxXQUFTLGtCQUFrQixNQUFvQjtBQUM3QyxRQUFJLENBQUMsWUFBWSxJQUFJLElBQUksRUFBRztBQUM1QixnQkFBWSxPQUFPLElBQUk7QUFDdkIsYUFBUyxpQkFBaUIsd0JBQXdCLEVBQUUsUUFBUSxVQUFRO0FBcEl0RTtBQXFJSSxZQUFNLFNBQVMsS0FBSyxjQUFjLFlBQVk7QUFDOUMsVUFBSSxZQUFVLFlBQU8sZ0JBQVAsbUJBQW9CLFlBQVcsS0FBTSxNQUFLLFVBQVUsT0FBTyxhQUFhO0FBQUEsSUFDeEYsQ0FBQztBQUNELHVCQUFtQjtBQUNuQixpQkFBYTtBQUFBLEVBQ2Y7QUFFQSxXQUFTLG9CQUFvQixJQUF1QjtBQTVJcEQ7QUE2SUUsYUFBUyxpQkFBaUIsZ0JBQWdCLEVBQUUsUUFBUSxPQUFLLEVBQUUsVUFBVSxPQUFPLE9BQU8sQ0FBQztBQUNwRixPQUFHLFVBQVUsSUFBSSxPQUFPO0FBQ3hCLFVBQU0sUUFBUSxRQUErQyxRQUFRLEtBQUssTUFBNUQsWUFBaUU7QUFDL0UsYUFBUyxTQUFTLEVBQUUsc0JBQXNCLEtBQUssQ0FBQztBQUFBLEVBQ2xEO0FBRUEsV0FBUyxpQkFBdUI7QUFDOUIsZ0JBQVksTUFBTTtBQUNsQixhQUFTLFNBQVMsRUFBRSxzQkFBc0IsR0FBRyxDQUFDO0FBQzlDLGFBQVMsaUJBQWlCLHNCQUFzQixFQUFFLFFBQVEsT0FBSyxFQUFFLFVBQVUsT0FBTyxPQUFPLENBQUM7QUFDMUYsVUFBTSxRQUFRLFNBQVMsZUFBZSxRQUFRO0FBQzlDLFFBQUksTUFBTyxPQUFNLFFBQVE7QUFDekIsYUFBUyxpQkFBaUIsd0JBQXdCLEVBQUUsUUFBUSxPQUFLLEVBQUUsVUFBVSxPQUFPLGFBQWEsQ0FBQztBQUNsRyxpQkFBYTtBQUNiLGdCQUFZO0FBQUEsRUFDZDtBQUdBLFdBQVMsZUFBZSxPQUFvQixNQUFjLE9BQXFCO0FBQzdFLFVBQU0sT0FBTyxNQUFNLFFBQVEsWUFBWTtBQUN2QyxRQUFJLFlBQVksSUFBSSxJQUFJLEdBQUc7QUFDekIsa0JBQVksT0FBTyxJQUFJO0FBQ3ZCLG1DQUFNLFVBQVUsT0FBTztBQUN2QixtQkFBYTtBQUNiLGdDQUEwQjtBQUMxQjtBQUFBLElBQ0Y7QUFDQSxnQkFBWSxJQUFJLE1BQU0sS0FBSztBQUMzQixpQ0FBTSxVQUFVLElBQUk7QUFDcEIsaUJBQWE7QUFDYixvQkFBZ0I7QUFBQSxFQUNsQjtBQUVBLFdBQVMsa0JBQXdCO0FBOUtqQztBQStLRSxtQkFBUyxlQUFlLG9CQUFvQixNQUE1QyxtQkFBK0MsVUFBVSxJQUFJO0FBQUEsRUFDL0Q7QUFFQSxXQUFTLGlCQUFpQixHQUFpQjtBQWxMM0M7QUFtTEUsUUFBSSxDQUFDLEtBQU0sRUFBRSxPQUF1QixPQUFPLHNCQUFzQjtBQUMvRCxxQkFBUyxlQUFlLG9CQUFvQixNQUE1QyxtQkFBK0MsVUFBVSxPQUFPO0FBQUEsSUFDbEU7QUFBQSxFQUNGO0FBR0EsV0FBUyxhQUFhLElBQVksR0FBZ0I7QUF6TGxEO0FBMExFLFFBQUksRUFBRyxHQUFFLGdCQUFnQjtBQUN6QixVQUFNLElBQUksU0FBUyxlQUFlLEVBQUU7QUFDcEMsUUFBSSxDQUFDLEVBQUc7QUFDUixVQUFNLE9BQU8sRUFBRSxpQkFBaUIsZUFBZTtBQUMvQyxVQUFNLE9BQU8sRUFBRSxpQkFBaUIsZUFBZTtBQUMvQyxRQUFJLE1BQU07QUFDVixTQUFLLFFBQVEsQ0FBQyxLQUFLLE1BQU07QUFBRSxVQUFJLElBQUksVUFBVSxTQUFTLE9BQU8sRUFBRyxPQUFNO0FBQUEsSUFBRyxDQUFDO0FBQzFFLGVBQUssR0FBRyxNQUFSLG1CQUFXLFVBQVUsT0FBTztBQUM1QixlQUFLLEdBQUcsTUFBUixtQkFBVyxVQUFVLE9BQU87QUFDNUIsVUFBTSxRQUFRLE1BQU0sS0FBSyxLQUFLO0FBQzlCLGVBQUssSUFBSSxNQUFULG1CQUFZLFVBQVUsSUFBSTtBQUMxQixlQUFLLElBQUksTUFBVCxtQkFBWSxVQUFVLElBQUk7QUFBQSxFQUM1QjtBQUVBLFdBQVMsYUFBYSxJQUFZLEdBQWdCO0FBeE1sRDtBQXlNRSxRQUFJLEVBQUcsR0FBRSxnQkFBZ0I7QUFDekIsVUFBTSxJQUFJLFNBQVMsZUFBZSxFQUFFO0FBQ3BDLFFBQUksQ0FBQyxFQUFHO0FBQ1IsVUFBTSxPQUFPLEVBQUUsaUJBQWlCLGVBQWU7QUFDL0MsVUFBTSxPQUFPLEVBQUUsaUJBQWlCLGVBQWU7QUFDL0MsUUFBSSxNQUFNO0FBQ1YsU0FBSyxRQUFRLENBQUMsS0FBSyxNQUFNO0FBQUUsVUFBSSxJQUFJLFVBQVUsU0FBUyxPQUFPLEVBQUcsT0FBTTtBQUFBLElBQUcsQ0FBQztBQUMxRSxlQUFLLEdBQUcsTUFBUixtQkFBVyxVQUFVLE9BQU87QUFDNUIsZUFBSyxHQUFHLE1BQVIsbUJBQVcsVUFBVSxPQUFPO0FBQzVCLFVBQU0sUUFBUSxNQUFNLElBQUksS0FBSyxVQUFVLEtBQUs7QUFDNUMsZUFBSyxJQUFJLE1BQVQsbUJBQVksVUFBVSxJQUFJO0FBQzFCLGVBQUssSUFBSSxNQUFULG1CQUFZLFVBQVUsSUFBSTtBQUFBLEVBQzVCO0FBR0EsaUJBQWUsa0JBQWlDO0FBeE5oRDtBQXlORSxVQUFNLFFBQVEsWUFBWSxTQUFTO0FBQ25DLFVBQU0sY0FBYyxNQUFNLEtBQUssT0FBSyxZQUFZLEVBQUUsSUFBSSxDQUFDO0FBQ3ZELFVBQU0sZUFBZSxNQUFNLEtBQUssT0FBSyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUM7QUFFekQsUUFBSSxlQUFlLGNBQWM7QUFDL0IsVUFBSSxDQUFDLFFBQVEsNE5BQXNNO0FBQ2pOO0FBQUEsSUFDSjtBQUNBLFFBQUksTUFBTSxXQUFXLEdBQUc7QUFBRSxZQUFNLDZDQUE2QztBQUFHO0FBQUEsSUFBUTtBQUV4RixVQUFNLFFBQVEsb0JBQVMsZUFBZSxTQUFTLE1BQWpDLG1CQUF5RCxNQUFNLFdBQS9ELFlBQXlFO0FBQ3ZGLFVBQU0sWUFBWSxvQkFBUyxlQUFlLGFBQWEsTUFBckMsbUJBQWdFLE1BQU0sV0FBdEUsWUFBZ0Y7QUFDbEcsVUFBTSxPQUFPLG9CQUFTLGVBQWUsUUFBUSxNQUFoQyxtQkFBMkQsTUFBTSxXQUFqRSxZQUEyRTtBQUN4RixVQUFNLHVCQUF1QixTQUFTLFNBQVMsRUFBRTtBQUNqRCxVQUFNLGVBQWUsZ0JBQWdCO0FBRXJDLFFBQUksQ0FBQyxNQUFNO0FBQUUsWUFBTSx1Q0FBdUM7QUFBRyxxQkFBUyxlQUFlLFNBQVMsTUFBakMsbUJBQW9DO0FBQVM7QUFBQSxJQUFRO0FBQ2xILFFBQUksQ0FBQyxVQUFVO0FBQUUsWUFBTSxxQ0FBa0M7QUFBRyxxQkFBUyxlQUFlLGFBQWEsTUFBckMsbUJBQXdDO0FBQVM7QUFBQSxJQUFRO0FBQ3JILFFBQUksQ0FBQyxzQkFBc0I7QUFBRSxZQUFNLDBDQUEwQztBQUFHO0FBQUEsSUFBUTtBQUd4RixVQUFNLFdBQVcsb0JBQUksSUFBb0I7QUFDekMsYUFBUyxpQkFBaUIsWUFBWSxFQUFFLFFBQVEsU0FBTztBQS9PekQsVUFBQUM7QUFnUEksWUFBTSxlQUFjQSxNQUFBLElBQUksYUFBYSxTQUFTLE1BQTFCLE9BQUFBLE1BQStCO0FBQ25ELFlBQU0sSUFBSSxZQUFZLE1BQU0sNERBQTREO0FBQ3hGLFVBQUksRUFBRyxVQUFTLElBQUksRUFBRSxDQUFDLEdBQUksV0FBVyxFQUFFLENBQUMsQ0FBRSxDQUFDO0FBQUEsSUFDOUMsQ0FBQztBQUNELGdCQUFZLGlCQUFpQixRQUFRO0FBRXJDLFVBQU0sbUJBQW1CLE1BQU0sS0FBSyxZQUFZLFNBQVMsQ0FBQztBQUMxRCxRQUFJLFFBQVE7QUFDWixRQUFJLGNBQWM7QUFDbEIscUJBQWlCLFFBQVEsVUFBUTtBQUMvQixjQUFRLEtBQUssT0FBTyxRQUFRLEtBQUssU0FBUyxHQUFHLElBQUk7QUFDakQscUJBQWUsVUFBSyxLQUFLLElBQUksY0FBUyxLQUFLLE1BQU0sUUFBUSxDQUFDLEVBQUUsUUFBUSxLQUFLLEdBQUcsQ0FBQztBQUFBO0FBQUEsSUFDL0UsQ0FBQztBQUVELFVBQU0sZ0JBQWdCLGNBQ2xCLDhHQUNBO0FBQ0osVUFBTSxNQUFNO0FBQUE7QUFBQTtBQUFBLEVBQStDLFdBQVc7QUFBQSx3QkFBb0IsTUFBTSxRQUFRLENBQUMsRUFBRSxRQUFRLEtBQUssR0FBRyxDQUFDO0FBQUE7QUFBQSxvQkFBa0IsSUFBSTtBQUFBLDJCQUFvQixRQUFRO0FBQUEseUJBQXFCLG9CQUFvQixHQUFHLE1BQU07QUFBQSxtQkFBZSxHQUFHLEtBQUssRUFBRSxHQUFHLGFBQWE7QUFBQTtBQUFBO0FBRXpRLFVBQU0sU0FBUyxTQUFTLGVBQWUsY0FBYztBQUNyRCxVQUFNLFVBQVUsVUFBVSxZQUFPLGdCQUFQLFlBQXNCLEtBQU07QUFDdEQsUUFBSSxRQUFRO0FBQUUsYUFBTyxXQUFXO0FBQU0sYUFBTyxjQUFjO0FBQUEsSUFBc0I7QUFHakYsUUFBSSxZQUEyQjtBQUMvQixRQUFJO0FBQ0YsWUFBTSxPQUFPLElBQUksZ0JBQWdCO0FBQ2pDLFlBQU0sTUFBTSxXQUFXLE1BQU0sS0FBSyxNQUFNLEdBQUcsR0FBTTtBQUNqRCxZQUFNLElBQUksTUFBTSxNQUFNLGVBQWUsb0JBQW9CO0FBQUEsUUFDdkQsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ1AsZ0JBQWdCO0FBQUEsVUFDaEIsVUFBVTtBQUFBLFVBQ1YsaUJBQWlCLFlBQVk7QUFBQSxVQUM3QixVQUFVO0FBQUEsUUFDWjtBQUFBLFFBQ0EsTUFBTSxLQUFLLFVBQVU7QUFBQSxVQUNuQjtBQUFBLFVBQU07QUFBQSxVQUNOLFdBQVc7QUFBQSxVQUNYLE9BQU8saUJBQWlCLElBQUksUUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFBQSxVQUNuRTtBQUFBLFVBQ0EsUUFBUTtBQUFBLFVBQ1IsWUFBWSxPQUFPO0FBQUEsVUFDbkIsWUFBWSxlQUFlLGFBQWEsS0FBSztBQUFBLFVBQzdDLFVBQVUsZUFBZSxhQUFhLFdBQVc7QUFBQSxRQUNuRCxDQUFDO0FBQUEsUUFDRCxRQUFRLEtBQUs7QUFBQSxNQUNmLENBQUM7QUFDRCxtQkFBYSxHQUFHO0FBQ2hCLFVBQUksRUFBRSxJQUFJO0FBQ1IsY0FBTSxPQUFNLE9BQUUsUUFBUSxJQUFJLFVBQVUsTUFBeEIsWUFBNkI7QUFDekMsY0FBTSxVQUFVLElBQUksTUFBTSxjQUFjO0FBQ3hDLFlBQUksU0FBUztBQUNYLHNCQUFZLFNBQVMsUUFBUSxDQUFDLEdBQUksRUFBRTtBQUNwQyxjQUFJLGdCQUFnQixhQUFhLElBQUk7QUFDbkMsOEJBQWtCLGVBQWUsYUFBYSxJQUFJLFFBQVEsRUFDdkQsTUFBTSxDQUFDLE1BQWVELEtBQUksS0FBSyw2Q0FBb0MsRUFBRSxPQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUFBLFVBQzdGO0FBQUEsUUFDRjtBQUFBLE1BQ0YsT0FBTztBQUNMLFFBQUFBLEtBQUksS0FBSyx3QkFBd0IsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDO0FBQUEsTUFDdkQ7QUFBQSxJQUNGLFNBQVMsR0FBRztBQUNWLE1BQUFBLEtBQUksS0FBSyxpRUFBeUQsRUFBRSxPQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUM7QUFBQSxJQUN4RjtBQUVBLGVBQVcsTUFBTTtBQUNmLFVBQUksUUFBUTtBQUFFLGVBQU8sV0FBVztBQUFPLGVBQU8sY0FBYztBQUFBLE1BQVM7QUFBQSxJQUN2RSxHQUFHLEdBQUk7QUFHUCxXQUFPLEtBQUssbUJBQW1CLFlBQVksV0FBVyxtQkFBbUIsR0FBRyxHQUFHLFFBQVE7QUFFdkYsZ0JBQVk7QUFFWixRQUFJLFdBQVc7QUFDYixlQUFTLFNBQVMsRUFBRSxrQkFBa0IsVUFBVSxDQUFDO0FBQ2pELHFCQUFTLGVBQWUsbUJBQW1CLE1BQTNDLG1CQUE4QyxVQUFVLElBQUk7QUFBQSxJQUM5RCxPQUFPO0FBRUwscUJBQWU7QUFBQSxJQUNqQjtBQUFBLEVBQ0Y7QUFFQSxpQkFBZSxtQkFBa0M7QUFDL0MsVUFBTSxLQUFLLFNBQVMsU0FBUyxFQUFFO0FBQy9CLFVBQU0sTUFBTSxTQUFTLGNBQWMsZ0JBQWdCO0FBQ25ELFVBQU0sZUFBZSxnQkFBZ0I7QUFDckMsUUFBSSxDQUFDLElBQUk7QUFBRSxzQkFBZ0I7QUFBRztBQUFBLElBQVE7QUFDdEMsUUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsSUFBSTtBQUFFLHNCQUFnQjtBQUFHLHFCQUFlO0FBQUc7QUFBQSxJQUFRO0FBQ3RGLFFBQUksS0FBSztBQUFFLFVBQUksY0FBYztBQUFrQixVQUFJLFdBQVc7QUFBQSxJQUFNO0FBQ3BFLFVBQU0sU0FBUyxNQUFNLGlCQUFpQixhQUFhLElBQUksYUFBYSxJQUFJLFlBQVk7QUFDcEYsUUFBSSxPQUFPLElBQUk7QUFDYixVQUFJLElBQUssS0FBSSxjQUFjO0FBQzNCLGlCQUFXLE1BQU07QUFBRSx3QkFBZ0I7QUFBRyx1QkFBZTtBQUFBLE1BQUcsR0FBRyxJQUFJO0FBQUEsSUFDakUsT0FBTztBQUNMLE1BQUFBLEtBQUksS0FBSyw0QkFBNEIsRUFBRSxPQUFPLE9BQU8sTUFBTSxRQUFRLENBQUM7QUFDcEUsc0JBQWdCO0FBQ2hCLHFCQUFlO0FBQUEsSUFDakI7QUFBQSxFQUNGO0FBRUEsV0FBUyxrQkFBd0I7QUF0VmpDO0FBdVZFLG1CQUFTLGVBQWUsbUJBQW1CLE1BQTNDLG1CQUE4QyxVQUFVLE9BQU87QUFDL0QsYUFBUyxTQUFTLEVBQUUsa0JBQWtCLEtBQUssQ0FBQztBQUFBLEVBQzlDO0FBR0EsV0FBUyxnQkFBZ0IsSUFBNEI7QUFDbkQsT0FBRyxRQUFRLHVCQUF1QixHQUFHLEtBQUs7QUFBQSxFQUM1QztBQUVBLFdBQVMsaUJBQWlCLFlBQTJCO0FBQ25ELFVBQU0sZ0JBQWdCLFFBQWMsT0FBTyxVQUFVO0FBQ3JELGlCQUFhLE1BQU0sYUFBYTtBQUVoQyxhQUFTLGVBQWUsY0FBYyxFQUFHLE1BQU0sVUFBVTtBQUN6RCxVQUFNLGFBQWEsU0FBUyxlQUFlLFlBQVk7QUFDdkQsUUFBSSxXQUFZLFlBQVcsTUFBTSxVQUFVO0FBQzNDLFVBQU0sZ0JBQWdCLFNBQVMsZUFBZSxhQUFhO0FBQzNELFFBQUksY0FBZSxlQUFjLGNBQWMsV0FBVztBQUMxRCxVQUFNLFlBQVksU0FBUyxlQUFlLG9CQUFvQjtBQUM5RCxRQUFJLFVBQVcsV0FBVSxNQUFNLFVBQVU7QUFDekMsVUFBTSxhQUFhLFNBQVMsZUFBZSxZQUFZO0FBQ3ZELFFBQUksV0FBWSxZQUFXLGNBQWMsV0FBVyxTQUFTLFFBQVEsMkJBQTJCLFlBQVk7QUFDNUcsVUFBTSxVQUFVLFNBQVMsZUFBZSxTQUFTO0FBQ2pELFFBQUksUUFBUyxTQUFRLFFBQVEsV0FBVztBQUN4QyxVQUFNLGNBQWMsU0FBUyxlQUFlLGFBQWE7QUFDekQsUUFBSSxlQUFlLFdBQVcsU0FBVSxhQUFZLFFBQVEsV0FBVztBQUFBLEVBQ3pFO0FBRUEsV0FBUyxvQkFBb0IsVUFBa0M7QUFuWC9EO0FBb1hFLFVBQU0sV0FBVyxTQUFTLGVBQWUsZUFBZTtBQUN4RCxVQUFNLFdBQVcsU0FBUyxlQUFlLGVBQWU7QUFDeEQsUUFBSSxTQUFVLFVBQVMsTUFBTSxVQUFVO0FBQ3ZDLFFBQUksU0FBVSxVQUFTLE1BQU0sVUFBVTtBQUN2QyxhQUFTLFFBQVEsS0FBSyxJQUFJLFNBQVMsTUFBTSxRQUFRLE9BQU8sRUFBRTtBQUMxRCxtQkFBUyxlQUFlLFdBQVcsTUFBbkMsbUJBQXNDO0FBQUEsRUFDeEM7QUFFQSxpQkFBZSxvQkFBbUM7QUFDaEQsUUFBSSxhQUFjO0FBQ2xCLFVBQU0sV0FBVyxTQUFTLGVBQWUsZUFBZTtBQUN4RCxVQUFNLE9BQU8sU0FBUyxlQUFlLFdBQVc7QUFDaEQsVUFBTSxNQUFNLFNBQVMsY0FBYyx1QkFBdUI7QUFDMUQsUUFBSSxLQUFNLE1BQUssTUFBTSxVQUFVO0FBQy9CLFFBQUksS0FBSztBQUFFLFVBQUksY0FBYztBQUFrQixVQUFJLFdBQVc7QUFBQSxJQUFNO0FBQ3BFLG1CQUFlO0FBQ2YsUUFBSTtBQUNGLFlBQU0sU0FBUyxNQUFNLGFBQWEsUUFBUSxTQUFTLEtBQUs7QUFDeEQsVUFBSSxDQUFDLE9BQU8sSUFBSTtBQUNkLGNBQU0sWUFBWSxPQUFPLE1BQU0sU0FBUyxxQkFBcUIsT0FBTyxNQUFNLFNBQVM7QUFDbkYsWUFBSSxXQUFXO0FBQ2IsY0FBSSxNQUFNO0FBQUUsaUJBQUssY0FBYyxPQUFPLE1BQU07QUFBUyxpQkFBSyxNQUFNLFVBQVU7QUFBQSxVQUFTO0FBQ25GO0FBQUEsUUFDRjtBQUdBLFFBQUFBLEtBQUksS0FBSyxrRUFBMEQsRUFBRSxPQUFPLE9BQU8sTUFBTSxRQUFRLENBQUM7QUFDbEcsNEJBQW9CLFFBQVE7QUFDNUI7QUFBQSxNQUNGO0FBQ0EsVUFBSSxPQUFPLE1BQU0sVUFBVSxPQUFPLE1BQU0sU0FBUztBQUMvQyx5QkFBaUIsT0FBTyxNQUFNLFFBQVEsT0FBTyxDQUFZO0FBQUEsTUFDM0QsT0FBTztBQUNMLDRCQUFvQixRQUFRO0FBQUEsTUFDOUI7QUFBQSxJQUNGLFNBQVE7QUFDTiwwQkFBb0IsUUFBUTtBQUFBLElBQzlCLFVBQUU7QUFDQSxVQUFJLEtBQUs7QUFBRSxZQUFJLGNBQWM7QUFBZSxZQUFJLFdBQVc7QUFBQSxNQUFPO0FBQ2xFLHFCQUFlO0FBQUEsSUFDakI7QUFBQSxFQUNGO0FBRUEsaUJBQWUsWUFBMkI7QUEvWjFDO0FBZ2FFLFFBQUksYUFBYztBQUNsQixVQUFNLFlBQVksU0FBUyxlQUFlLFdBQVc7QUFDckQsVUFBTSxXQUFXLFNBQVMsZUFBZSxlQUFlO0FBQ3hELFVBQU0sT0FBTyxVQUFVO0FBQ3ZCLFVBQU0sT0FBTyxjQUEwRCxRQUFRLEtBQUssTUFBdkUsWUFBNEU7QUFDekYsVUFBTSxPQUFPLFNBQVMsZUFBZSxjQUFjO0FBQ25ELFFBQUksQ0FBQyxLQUFLLEtBQUssR0FBRztBQUNoQixVQUFJLE1BQU07QUFBRSxhQUFLLGNBQWM7QUFBb0IsYUFBSyxNQUFNLFVBQVU7QUFBQSxNQUFTO0FBQ2pGO0FBQUEsSUFDRjtBQUNBLFFBQUksS0FBTSxNQUFLLE1BQU0sVUFBVTtBQUMvQixVQUFNLE1BQU0sU0FBUyxjQUFjLHVCQUF1QjtBQUMxRCxRQUFJLEtBQUs7QUFBRSxVQUFJLGNBQWM7QUFBZSxVQUFJLFdBQVc7QUFBQSxJQUFNO0FBQ2pFLG1CQUFlO0FBQ2YsUUFBSTtBQUNGLFlBQU0sU0FBUyxNQUFNLGFBQWEsU0FBUyxNQUFNLEtBQUssRUFBRTtBQUN4RCxVQUFJLENBQUMsT0FBTyxJQUFJO0FBQ2QsWUFBSSxPQUFPLE1BQU0sU0FBUyxxQkFBcUIsT0FBTyxNQUFNLFNBQVMsa0JBQWtCO0FBQ3JGLGNBQUksTUFBTTtBQUFFLGlCQUFLLGNBQWMsT0FBTyxNQUFNO0FBQVMsaUJBQUssTUFBTSxVQUFVO0FBQUEsVUFBUztBQUNuRjtBQUFBLFFBQ0Y7QUFDQSxRQUFBQSxLQUFJLEtBQUssbUVBQTJELEVBQUUsT0FBTyxPQUFPLE1BQU0sUUFBUSxDQUFDO0FBQ25HLHlCQUFpQixRQUFjLE9BQU8sRUFBRSxNQUFNLFVBQVUsS0FBSyxVQUFVLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBWTtBQUNoRztBQUFBLE1BQ0Y7QUFDQSx1QkFBaUIsT0FBTyxNQUFNLE9BQU8sQ0FBWTtBQUFBLElBQ25ELFNBQVE7QUFDTixVQUFJO0FBQ0YseUJBQWlCLFFBQWMsT0FBTyxFQUFFLE1BQU0sVUFBVSxLQUFLLFVBQVUsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFZO0FBQUEsTUFDbEcsU0FBUUUsSUFBQTtBQUNOLFlBQUksTUFBTTtBQUFFLGVBQUssY0FBYztBQUFrRCxlQUFLLE1BQU0sVUFBVTtBQUFBLFFBQVM7QUFBQSxNQUNqSDtBQUFBLElBQ0YsVUFBRTtBQUNBLFVBQUksS0FBSztBQUFFLFlBQUksY0FBYztBQUF3QixZQUFJLFdBQVc7QUFBQSxNQUFPO0FBQzNFLHFCQUFlO0FBQUEsSUFDakI7QUFBQSxFQUNGO0FBRUEsV0FBUyxzQkFBNEI7QUFDbkMsVUFBTSxXQUFXLFNBQVMsZUFBZSxlQUFlO0FBQ3hELFVBQU0sV0FBVyxTQUFTLGVBQWUsZUFBZTtBQUN4RCxRQUFJLFNBQVUsVUFBUyxNQUFNLFVBQVU7QUFDdkMsUUFBSSxTQUFVLFVBQVMsTUFBTSxVQUFVO0FBQUEsRUFDekM7QUFFQSxXQUFTLE9BQWE7QUFDcEIsUUFBSSxDQUFDLFFBQVEsMkJBQTJCLEVBQUc7QUFDM0MsaUJBQWEsT0FBTztBQUNwQixVQUFNLGFBQWEsU0FBUyxlQUFlLFlBQVk7QUFDdkQsUUFBSSxXQUFZLFlBQVcsTUFBTSxVQUFVO0FBQzNDLElBQUMsU0FBUyxlQUFlLFNBQVMsRUFBdUIsUUFBUTtBQUNqRSxJQUFDLFNBQVMsZUFBZSxhQUFhLEVBQTBCLFFBQVE7QUFDeEUsSUFBQyxTQUFTLGVBQWUsZUFBZSxFQUF1QixRQUFRO0FBQ3ZFLFVBQU0sV0FBVyxTQUFTLGVBQWUsZUFBZTtBQUN4RCxVQUFNLFdBQVcsU0FBUyxlQUFlLGVBQWU7QUFDeEQsUUFBSSxTQUFVLFVBQVMsTUFBTSxVQUFVO0FBQ3ZDLFFBQUksU0FBVSxVQUFTLE1BQU0sVUFBVTtBQUN2QyxhQUFTLGVBQWUsY0FBYyxFQUFHLE1BQU0sVUFBVTtBQUFBLEVBQzNEO0FBRUEsV0FBUyxlQUFxQjtBQUM1QixhQUFTLGVBQWUsY0FBYyxFQUFHLE1BQU0sVUFBVTtBQUN6RCxlQUFXLE1BQUc7QUE5ZGhCO0FBOGRvQiw0QkFBUyxlQUFlLGVBQWUsTUFBdkMsbUJBQStEO0FBQUEsT0FBUyxHQUFHO0FBQUEsRUFDL0Y7QUFHQSxpQkFBZSxjQUE2QjtBQWxlNUM7QUFtZUUsVUFBTSxLQUFLLFNBQVMsZUFBZSxnQkFBZ0I7QUFDbkQsUUFBSSxDQUFDLEdBQUk7QUFDVCxPQUFHLFVBQVUsSUFBSSxRQUFRO0FBQ3pCLGFBQVMsS0FBSyxVQUFVLElBQUksY0FBYztBQUMxQyxhQUFTLGVBQWUsaUJBQWlCLEVBQUcsWUFBWTtBQUN4RCxhQUFTLGVBQWUsZUFBZSxFQUFHLE1BQU0sVUFBVTtBQUMxRCxhQUFTLGVBQWUsaUJBQWlCLEVBQUcsTUFBTSxVQUFVO0FBQzVELGFBQVMsZUFBZSxrQkFBa0IsRUFBRyxNQUFNLFVBQVU7QUFDN0QsYUFBUyxlQUFlLHFCQUFxQixFQUFHLE1BQU0sVUFBVTtBQUNoRSxhQUFTLGVBQWUsb0JBQW9CLEVBQUcsTUFBTSxVQUFVO0FBQy9ELGFBQVMsZUFBZSxlQUFlLEVBQUcsTUFBTSxVQUFVO0FBQzFELGFBQVMsZUFBZSxpQkFBaUIsRUFBRyxVQUFVLE9BQU8sU0FBUztBQUV0RSxVQUFNLE1BQU0sTUFBTSxlQUFxQjtBQUN2QyxVQUFNLFVBQVUsV0FBVztBQUUzQixVQUFNLE9BQU8sU0FBUyxlQUFlLG1CQUFtQjtBQUN4RCxRQUFJLE1BQU07QUFDUixZQUFNLFNBQVMsQ0FBQyxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sYUFBTSxhQUFNLGFBQU0sV0FBSTtBQUNwRSxXQUFLLFlBQVksUUFBUSxJQUFJLENBQUMsR0FBRyxNQUFNLG1DQUFtQyxPQUFPLElBQUksT0FBTyxNQUFNLENBQUMsSUFBSSxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFO0FBQUEsSUFDcEk7QUFFQSxRQUFJLE9BQU8sQ0FBQyxJQUFJLE9BQU87QUFDckIsZUFBUyxlQUFlLGVBQWUsRUFBRyxNQUFNLFVBQVU7QUFDMUQsZUFBUyxlQUFlLGtCQUFrQixFQUFHLE1BQU0sVUFBVTtBQUFBLElBQy9EO0FBRUEsbUJBQWUsT0FBTztBQUN0QixhQUFTLGVBQWUsb0JBQW9CLEVBQUcsTUFBTSxVQUFVO0FBRS9ELFVBQU0sZUFBZSxnQkFBZ0I7QUFDckMsUUFBSSxDQUFDLGNBQWM7QUFDakIsZUFBUyxlQUFlLGlCQUFpQixFQUFHLE1BQU0sVUFBVTtBQUM1RCxlQUFTLGVBQWUsa0JBQWtCLEVBQUcsTUFBTSxVQUFVO0FBQzdELFlBQU0sV0FBVyxTQUFTLGVBQWUsZ0JBQWdCO0FBQ3pELFVBQUksVUFBVTtBQUFFLGlCQUFTLFdBQVc7QUFBTyxpQkFBUyxNQUFNLFVBQVU7QUFBSyxpQkFBUyxjQUFjO0FBQUEsTUFBbUI7QUFDbkg7QUFBQSxJQUNGO0FBRUEsVUFBTSxTQUFTLE1BQU0saUJBQXNCLGtCQUFhLE9BQWIsWUFBbUIsQ0FBQztBQUMvRCxzQkFBa0IsTUFBTTtBQUFBLEVBQzFCO0FBRUEsV0FBUyxlQUFxQjtBQTlnQjlCO0FBK2dCRSxtQkFBUyxlQUFlLGdCQUFnQixNQUF4QyxtQkFBMkMsVUFBVSxPQUFPO0FBQzVELGFBQVMsS0FBSyxVQUFVLE9BQU8sY0FBYztBQUFBLEVBQy9DO0FBRUEsV0FBUyxxQkFBcUIsR0FBZ0I7QUFDNUMsUUFBSyxFQUFFLE9BQXVCLE9BQU8saUJBQWtCLGNBQWE7QUFBQSxFQUN0RTtBQUVBLFdBQVMsa0JBQWtCLE1BQWlDO0FBQzFELFVBQU0sWUFBWSxTQUFTLGVBQWUsaUJBQWlCO0FBQzNELFVBQU0sYUFBYSxTQUFTLGVBQWUsa0JBQWtCO0FBQzdELFVBQU0sWUFBWSxTQUFTLGVBQWUscUJBQXFCO0FBQy9ELFVBQU0sZUFBZSxTQUFTLGVBQWUsb0JBQW9CO0FBQ2pFLFVBQU0sVUFBVSxTQUFTLGVBQWUsZUFBZTtBQUN2RCxVQUFNLFdBQVcsU0FBUyxlQUFlLGdCQUFnQjtBQUV6RCxpQkFBYSxNQUFNLFVBQVU7QUFDN0IsbUJBQWUsV0FBVyxDQUFDO0FBRTNCLFFBQUksYUFBYSxTQUFTLFNBQVMsRUFBRSxPQUFPLEdBQUc7QUFDN0MsVUFBSSxVQUFVO0FBQUUsaUJBQVMsV0FBVztBQUFPLGlCQUFTLE1BQU0sVUFBVTtBQUFLLGlCQUFTLGNBQWM7QUFBQSxNQUFtQjtBQUNuSCxnQkFBVSxZQUFZO0FBQ3RCLGlCQUFXLE1BQU0sVUFBVTtBQUMzQixnQkFBVSxNQUFNLFVBQVU7QUFDMUIsY0FBUSxNQUFNLFVBQVU7QUFDeEI7QUFBQSxJQUNGO0FBRUEsUUFBSSxDQUFDLE1BQU07QUFDVCxnQkFBVSxZQUFZO0FBQ3RCLGlCQUFXLE1BQU0sVUFBVTtBQUMzQixnQkFBVSxNQUFNLFVBQVU7QUFDMUIsY0FBUSxNQUFNLFVBQVU7QUFDeEIsVUFBSSxVQUFVO0FBQUUsaUJBQVMsV0FBVztBQUFNLGlCQUFTLE1BQU0sVUFBVTtBQUFPLGlCQUFTLFFBQVE7QUFBQSxNQUEyQztBQUN0STtBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssV0FBVyxZQUFZO0FBQzlCLGdCQUFVLFlBQVk7QUFDdEIsaUJBQVcsTUFBTSxVQUFVO0FBQVMsZ0JBQVUsTUFBTSxVQUFVO0FBQVEsY0FBUSxNQUFNLFVBQVU7QUFDOUYsVUFBSSxVQUFVO0FBQUUsaUJBQVMsV0FBVztBQUFNLGlCQUFTLE1BQU0sVUFBVTtBQUFPLGlCQUFTLFFBQVE7QUFBQSxNQUF3QjtBQUFBLElBQ3JILFdBQVcsS0FBSyxXQUFXLGFBQWE7QUFDdEMsZ0JBQVUsWUFBWTtBQUN0QixpQkFBVyxNQUFNLFVBQVU7QUFBUyxnQkFBVSxNQUFNLFVBQVU7QUFBUyxjQUFRLE1BQU0sVUFBVTtBQUMvRixVQUFJLFVBQVU7QUFBRSxpQkFBUyxXQUFXO0FBQU0saUJBQVMsTUFBTSxVQUFVO0FBQUEsTUFBTztBQUFBLElBQzVFLFdBQVcsS0FBSyxXQUFXLGNBQWMsQ0FBQyxLQUFLLFVBQVU7QUFDdkQsWUFBTSxRQUFPLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNsRCxZQUFNLGVBQWUsS0FBSyxpQkFBaUIsS0FBSyxlQUFlLE1BQU0sR0FBRyxFQUFFLENBQUMsSUFBSTtBQUMvRSxVQUFJLGlCQUFpQixNQUFNO0FBQ3pCLGtCQUFVLFlBQVk7QUFDdEIsbUJBQVcsTUFBTSxVQUFVO0FBQVEsa0JBQVUsTUFBTSxVQUFVO0FBQVMsZ0JBQVEsTUFBTSxVQUFVO0FBQzlGLFlBQUksVUFBVTtBQUFFLG1CQUFTLFdBQVc7QUFBTSxtQkFBUyxNQUFNLFVBQVU7QUFBTyxtQkFBUyxjQUFjO0FBQUEsUUFBcUI7QUFBQSxNQUN4SCxPQUFPO0FBQ0wsa0JBQVUsWUFBWTtBQUN0QixtQkFBVyxNQUFNLFVBQVU7QUFBUSxrQkFBVSxNQUFNLFVBQVU7QUFBUSxnQkFBUSxNQUFNLFVBQVU7QUFDN0YsWUFBSSxVQUFVO0FBQUUsbUJBQVMsV0FBVztBQUFPLG1CQUFTLE1BQU0sVUFBVTtBQUFLLG1CQUFTLGNBQWM7QUFBQSxRQUFtQjtBQUFBLE1BQ3JIO0FBQUEsSUFDRixXQUFXLEtBQUssWUFBWSxDQUFDLGFBQWEsU0FBUyxTQUFTLEVBQUUsT0FBTyxHQUFHO0FBQ3RFLGdCQUFVLFlBQVk7QUFDdEIsaUJBQVcsTUFBTSxVQUFVO0FBQVEsZ0JBQVUsTUFBTSxVQUFVO0FBQVEsY0FBUSxNQUFNLFVBQVU7QUFDN0YsVUFBSSxVQUFVO0FBQUUsaUJBQVMsV0FBVztBQUFNLGlCQUFTLE1BQU0sVUFBVTtBQUFBLE1BQU87QUFDMUUsWUFBTSxXQUFXLFNBQVMsZUFBZSxxQkFBcUI7QUFDOUQsVUFBSSxVQUFVO0FBQ1osaUJBQVMsWUFBWSxLQUFLLFNBQ3RCLDBEQUF1RCxRQUFRLEtBQUssTUFBTSxJQUFJLHVEQUM5RTtBQUFBLE1BQ047QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUVBLGlCQUFlLGNBQTZCO0FBcmxCNUM7QUFzbEJFLFVBQU0sZUFBZSxnQkFBZ0I7QUFDckMsUUFBSSxDQUFDLGNBQWM7QUFBRSxtQkFBYSxzQ0FBbUMsTUFBTTtBQUFHO0FBQUEsSUFBUTtBQUV0RixVQUFNLGFBQWEsTUFBTSxpQkFBc0Isa0JBQWEsT0FBYixZQUFtQixDQUFDO0FBQ25FLFFBQUksQ0FBQyxhQUFhLFNBQVMsU0FBUyxFQUFFLE9BQU8sR0FBRztBQUM5QyxVQUFJLENBQUMsY0FBYyxXQUFXLFdBQVcsY0FBYyxXQUFXLFVBQVU7QUFDMUUscUJBQWEsNERBQXlELE1BQU07QUFDNUU7QUFBQSxNQUNGO0FBQ0EsVUFBSTtBQUNGLGNBQU0sU0FBUyxlQUFlO0FBQzlCLGNBQU0sY0FBYyxNQUFNLGlCQUFpQixzQkFBc0IsTUFBTTtBQUN2RSxjQUFNLGtCQUFrQixZQUFZLEtBQUssWUFBWSxRQUFRO0FBRTdELGNBQU0sT0FBTyxNQUFNLE1BQU0sR0FBRyxZQUFZLCtEQUErRDtBQUFBLFVBQ3JHLFNBQVMsRUFBRSxVQUFVLGVBQWUsaUJBQWlCLFlBQVksY0FBYztBQUFBLFFBQ2pGLENBQUM7QUFDRCxjQUFNLE1BQU0sTUFBTSxLQUFLLEtBQUs7QUFDNUIsY0FBTSxVQUFTLGVBQUksQ0FBQyxNQUFMLG1CQUFRLDBCQUFSLFlBQWlDO0FBQ2hELFlBQUksbUJBQW1CLFFBQVE7QUFDN0IsZ0JBQU0sTUFBTSxTQUFTLGVBQWUsZ0JBQWdCO0FBQ3BELGNBQUksS0FBSztBQUFFLGdCQUFJLFdBQVc7QUFBTSxnQkFBSSxNQUFNLFVBQVU7QUFBQSxVQUFPO0FBQzNELGdCQUFNLFdBQVcsU0FBUyxlQUFlLGlCQUFpQjtBQUMxRCxjQUFJLFVBQVU7QUFDWixxQkFBUyxZQUFZO0FBQ3JCLHFCQUFTLFVBQVUsSUFBSSxTQUFTO0FBQUEsVUFDbEM7QUFDQTtBQUFBLFFBQ0Y7QUFBQSxNQUNGLFNBQVMsR0FBRztBQUFFLFFBQUFGLEtBQUksS0FBSyxvQ0FBb0MsRUFBRSxPQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUM7QUFBQSxNQUFHO0FBQUEsSUFDcEY7QUFFQSxVQUFNLE1BQWMsY0FBYyxDQUFDLFdBQW1CO0FBQ3BELFlBQU0sV0FBVyxTQUFTLGVBQWUsaUJBQWlCO0FBQzFELFVBQUksVUFBVTtBQUNaLGlCQUFTLFlBQVksaUVBQXVELFFBQVEsTUFBTSxJQUFJO0FBQzlGLGlCQUFTLFVBQVUsSUFBSSxTQUFTO0FBQUEsTUFDbEM7QUFDQSxZQUFNLE1BQU0sU0FBUyxlQUFlLGdCQUFnQjtBQUNwRCxVQUFJLElBQUssS0FBSSxjQUFjO0FBQzNCLHFCQUFlLGNBQWMsTUFBTSxFQUFFLE1BQU0sUUFBUSxLQUFLO0FBQUEsSUFDMUQsQ0FBQztBQUFBLEVBQ0g7QUFFQSxpQkFBZSx1QkFBc0M7QUFsb0JyRDtBQW1vQkUsVUFBTSxlQUFlLGdCQUFnQjtBQUNyQyxRQUFJLENBQUMsY0FBYztBQUFFLFlBQU0sNENBQXlDO0FBQUc7QUFBQSxJQUFRO0FBQy9FLFVBQU0sY0FBYyxNQUFNLGlCQUFzQixrQkFBYSxPQUFiLFlBQW1CLENBQUM7QUFDcEUsUUFBSSxnQkFBZ0IsWUFBWSxXQUFXLGNBQWMsWUFBWSxXQUFXLGFBQWE7QUFDM0Ysd0JBQWtCLFdBQVc7QUFDN0I7QUFBQSxJQUNGO0FBQ0EsVUFBTSxPQUFPLGFBQWEsUUFBUTtBQUNsQyxVQUFNLE1BQU0sYUFBYSxZQUFZO0FBQ3JDLFVBQU0sU0FBUyxTQUFTLGVBQWUsc0JBQXNCO0FBQzdELFVBQU0sWUFBWSxTQUFTLE9BQU8sTUFBTSxLQUFLLElBQUk7QUFDakQsVUFBTSxNQUFNO0FBQUE7QUFBQSxRQUFrRSxJQUFJO0FBQUEsWUFBZSxHQUFHLEdBQUcsWUFBWSxrQkFBa0IsWUFBWSxFQUFFO0FBQUE7QUFBQTtBQUNuSixXQUFPLEtBQUssbUJBQW1CLFlBQVksV0FBVyxtQkFBbUIsR0FBRyxHQUFHLFFBQVE7QUFDdkYsVUFBTSxzQkFBc0IsU0FBUztBQUNyQyxzQkFBa0IsRUFBRSxRQUFRLFlBQVksVUFBVSxNQUFNLENBQWlCO0FBQUEsRUFDM0U7QUFFQSxpQkFBZSxzQkFBc0IsV0FBa0M7QUFwcEJ2RTtBQXFwQkUsVUFBTSxlQUFlLGdCQUFnQjtBQUNyQyxRQUFJLENBQUMsYUFBYztBQUNuQixRQUFJO0FBQ0YsWUFBTSxRQUFRLE1BQU0saUJBQXNCLGtCQUFhLE9BQWIsWUFBbUIsQ0FBQztBQUM5RCxVQUFJLFNBQVMsTUFBTSxXQUFXLFlBQWE7QUFDM0MsWUFBTSxTQUFTLGVBQWU7QUFDOUIsWUFBTSxTQUFTLE1BQU0saUJBQWlCLGlCQUFpQjtBQUFBLFFBQ3JELE1BQU0sYUFBYTtBQUFBLFFBQ25CLFVBQVUsYUFBYTtBQUFBLFFBQ3ZCLFdBQVcsYUFBYTtBQUFBLFFBQ3hCLFFBQVE7QUFBQSxRQUNSO0FBQUEsUUFDQSxVQUFVO0FBQUEsUUFDVixhQUFZLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQUEsTUFDckMsQ0FBZ0Q7QUFDaEQsVUFBSSxPQUFPLElBQUk7QUFDYiwwQkFBa0IsT0FBTyxNQUFNLEVBQUU7QUFBQSxNQUNuQztBQUFBLElBQ0YsU0FBUyxHQUFHO0FBQUUsTUFBQUEsS0FBSSxLQUFLLHdDQUFrQyxFQUFFLE9BQU8sT0FBTyxDQUFDLEVBQUUsQ0FBQztBQUFBLElBQUc7QUFBQSxFQUNsRjtBQUdBLFdBQVMsaUJBQTBCO0FBQ2pDLFdBQU8sU0FBUyxTQUFTLEVBQUU7QUFBQSxFQUM3QjtBQUVBLGlCQUFlLG1CQUFrQztBQS9xQmpEO0FBZ3JCRSxRQUFJLENBQUMsZUFBZSxHQUFHO0FBQUUsWUFBTSxrQkFBa0I7QUFBRztBQUFBLElBQVE7QUFDNUQsbUJBQVMsZUFBZSxxQkFBcUIsTUFBN0MsbUJBQWdELFVBQVUsSUFBSTtBQUM5RCxVQUFNLDRCQUE0QjtBQUNsQyxVQUFNLG9CQUFvQjtBQUFBLEVBQzVCO0FBRUEsV0FBUyxvQkFBMEI7QUF0ckJuQztBQXVyQkUsbUJBQVMsZUFBZSxxQkFBcUIsTUFBN0MsbUJBQWdELFVBQVUsT0FBTztBQUFBLEVBQ25FO0FBRUEsV0FBUywwQkFBMEIsR0FBZ0I7QUFDakQsUUFBSyxFQUFFLE9BQXVCLE9BQU8sc0JBQXVCLG1CQUFrQjtBQUFBLEVBQ2hGO0FBRUEsV0FBUyxjQUFjLEtBQWEsS0FBd0I7QUE5ckI1RDtBQStyQkUsYUFBUyxpQkFBaUIsbUJBQW1CLEVBQUUsUUFBUSxPQUFLLEVBQUUsVUFBVSxPQUFPLE9BQU8sQ0FBQztBQUN2RixhQUFTLGlCQUFpQixxQkFBcUIsRUFBRSxRQUFRLE9BQUssRUFBRSxVQUFVLE9BQU8sT0FBTyxDQUFDO0FBQ3pGLFFBQUksVUFBVSxJQUFJLE9BQU87QUFDekIsVUFBTSxRQUFRLFFBQVEsSUFBSSxPQUFPLENBQUMsRUFBRSxZQUFZLElBQUksSUFBSSxNQUFNLENBQUM7QUFDL0QsbUJBQVMsZUFBZSxLQUFLLE1BQTdCLG1CQUFnQyxVQUFVLElBQUk7QUFDOUMsUUFBSSxRQUFRLFlBQWEsNkJBQTRCO0FBQUEsYUFDNUMsUUFBUSxZQUFhLHlCQUF3QjtBQUFBLGFBQzdDLFFBQVEsYUFBYywwQkFBeUI7QUFBQSxhQUMvQyxRQUFRLFNBQVUscUJBQW9CO0FBQUEsRUFDakQ7QUFFQSxpQkFBZSw4QkFBNkM7QUFDMUQsVUFBTSxLQUFLLFNBQVMsZUFBZSxnQkFBZ0I7QUFDbkQsUUFBSSxDQUFDLEdBQUk7QUFDVCxPQUFHLFlBQVk7QUFDZixRQUFJO0FBQ0YsWUFBTSxJQUFJLE1BQU0sTUFBTSxlQUFlLDBFQUEwRTtBQUFBLFFBQzdHLFNBQVMsRUFBRSxVQUFVLGVBQWUsaUJBQWlCLFlBQVksY0FBYztBQUFBLE1BQ2pGLENBQUM7QUFDRCxZQUFNLE9BQU8sTUFBTSxFQUFFLEtBQUs7QUFDMUIsVUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFFBQVE7QUFBRSxXQUFHLFlBQVk7QUFBaUU7QUFBQSxNQUFRO0FBQ3JILFNBQUcsWUFBWSxLQUFLLElBQUksT0FBSztBQXB0QmpDO0FBcXRCTSxjQUFNLEtBQUssSUFBSSxLQUFLLEVBQUUsVUFBVSxFQUFFLGVBQWUsT0FBTztBQUN4RCxlQUFPLHVIQUVzQyxTQUFRLE9BQUUsU0FBRixZQUFVLEVBQUUsSUFBSSxnREFDekIsUUFBUSxFQUFFLFFBQVEsS0FBSyxFQUFFLFlBQVksWUFBUyxRQUFRLEVBQUUsU0FBUyxJQUFJLE1BQU0sa0RBQ3pFLEtBQUssaUhBR2EsRUFBRSxLQUFLLGdHQUNMLEVBQUUsS0FBSztBQUFBLE1BRTNFLENBQUMsRUFBRSxLQUFLLEVBQUU7QUFBQSxJQUNaLFNBQVE7QUFBRSxTQUFHLFlBQVk7QUFBQSxJQUFxRDtBQUFBLEVBQ2hGO0FBRUEsaUJBQWUsMEJBQXlDO0FBQ3RELFVBQU0sS0FBSyxTQUFTLGVBQWUsZ0JBQWdCO0FBQ25ELFFBQUksQ0FBQyxHQUFJO0FBQ1QsT0FBRyxZQUFZO0FBQ2YsUUFBSTtBQUNGLFlBQU0sSUFBSSxNQUFNLE1BQU0sZUFBZSw4RUFBOEU7QUFBQSxRQUNqSCxTQUFTLEVBQUUsVUFBVSxlQUFlLGlCQUFpQixZQUFZLGNBQWM7QUFBQSxNQUNqRixDQUFDO0FBQ0QsWUFBTSxPQUFPLE1BQU0sRUFBRSxLQUFLO0FBQzFCLFVBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxRQUFRO0FBQUUsV0FBRyxZQUFZO0FBQTBEO0FBQUEsTUFBUTtBQUM5RyxTQUFHLFlBQVksS0FBSyxJQUFJLE9BQUs7QUE5dUJqQztBQSt1Qk0sY0FBTSxLQUFLLEVBQUUsaUJBQWlCLElBQUksS0FBSyxFQUFFLGNBQWMsRUFBRSxlQUFlLE9BQU8sSUFBSTtBQUNuRixjQUFNLFFBQVEsRUFBRSxXQUFXLHlCQUFlLFNBQVEsT0FBRSxXQUFGLFlBQVksRUFBRSxJQUFJO0FBQ3BFLGVBQU8sdUhBRXNDLFNBQVEsT0FBRSxTQUFGLFlBQVUsRUFBRSxJQUFJLGdEQUN6QixRQUFRLEVBQUUsUUFBUSxJQUFJLHFEQUNqQixRQUFRLCtEQUNFLEtBQUs7QUFBQSxNQUVsRSxDQUFDLEVBQUUsS0FBSyxFQUFFO0FBQUEsSUFDWixTQUFRO0FBQUUsU0FBRyxZQUFZO0FBQUEsSUFBcUQ7QUFBQSxFQUNoRjtBQUVBLGlCQUFlLG9CQUFvQixJQUFZLEtBQXVDO0FBNXZCdEY7QUE2dkJFLFFBQUksV0FBVztBQUFNLFFBQUksY0FBYztBQUN2QyxVQUFNLGVBQWUsZ0JBQWdCO0FBQ3JDLFFBQUk7QUFDRixZQUFNLElBQUksTUFBTSxNQUFNLGVBQWUseUNBQXlDLElBQUk7QUFBQSxRQUNoRixRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsVUFDUCxnQkFBZ0I7QUFBQSxVQUFvQixVQUFVO0FBQUEsVUFDOUMsaUJBQWlCLFlBQVk7QUFBQSxVQUFlLFVBQVU7QUFBQSxRQUN4RDtBQUFBLFFBQ0EsTUFBTSxLQUFLLFVBQVU7QUFBQSxVQUNuQixRQUFRO0FBQUEsVUFDUixpQkFBZ0Isb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFBQSxVQUN2QyxjQUFjLGVBQWUsYUFBYSxPQUFPO0FBQUEsUUFDbkQsQ0FBQztBQUFBLE1BQ0gsQ0FBQztBQUNELFVBQUksQ0FBQyxFQUFFLEdBQUksT0FBTSxJQUFJLE1BQU0sWUFBWSxFQUFFLE1BQU07QUFDL0MsZ0JBQUksUUFBUSwyQkFBMkIsTUFBdkMsbUJBQTBDO0FBQUEsSUFDNUMsU0FBUTtBQUNOLFVBQUksV0FBVztBQUFPLFVBQUksY0FBYztBQUN4QyxZQUFNLGtCQUFrQjtBQUFBLElBQzFCO0FBQUEsRUFDRjtBQUVBLGlCQUFlLHFCQUFxQixJQUFZLEtBQXVDO0FBcHhCdkY7QUFxeEJFLFFBQUksQ0FBQyxRQUFRLG1DQUE2QixFQUFHO0FBQzdDLFFBQUksV0FBVztBQUFNLFFBQUksY0FBYztBQUN2QyxRQUFJO0FBQ0YsWUFBTSxJQUFJLE1BQU0sTUFBTSxlQUFlLHlDQUF5QyxJQUFJO0FBQUEsUUFDaEYsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ1AsZ0JBQWdCO0FBQUEsVUFBb0IsVUFBVTtBQUFBLFVBQzlDLGlCQUFpQixZQUFZO0FBQUEsVUFBZSxVQUFVO0FBQUEsUUFDeEQ7QUFBQSxRQUNBLE1BQU0sS0FBSyxVQUFVLEVBQUUsUUFBUSxZQUFZLENBQUM7QUFBQSxNQUM5QyxDQUFDO0FBQ0QsVUFBSSxDQUFDLEVBQUUsR0FBSSxPQUFNLElBQUksTUFBTSxZQUFZLEVBQUUsTUFBTTtBQUMvQyxnQkFBSSxRQUFRLDJCQUEyQixNQUF2QyxtQkFBMEM7QUFBQSxJQUM1QyxTQUFRO0FBQ04sVUFBSSxXQUFXO0FBQU8sVUFBSSxjQUFjO0FBQ3hDLFlBQU0sbUJBQW1CO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBRUEsaUJBQWUsMkJBQTBDO0FBQ3ZELFVBQU0sS0FBSyxTQUFTLGVBQWUsaUJBQWlCO0FBQ3BELFFBQUksQ0FBQyxHQUFJO0FBQ1QsT0FBRyxZQUFZO0FBQ2YsUUFBSTtBQUNGLFlBQU0sSUFBSSxNQUFNLE1BQU0sZUFBZSxvREFBb0Q7QUFBQSxRQUN2RixTQUFTLEVBQUUsVUFBVSxlQUFlLGlCQUFpQixZQUFZLGNBQWM7QUFBQSxNQUNqRixDQUFDO0FBQ0QsWUFBTSxPQUFPLE1BQU0sRUFBRSxLQUFLO0FBQzFCLFVBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxRQUFRO0FBQUUsV0FBRyxZQUFZO0FBQTBEO0FBQUEsTUFBUTtBQUM5RyxTQUFHLFlBQVksS0FBSyxJQUFJLE9BQUs7QUFsekJqQztBQW16Qk0sY0FBTSxLQUFLLElBQUksS0FBSyxFQUFFLFVBQVUsRUFBRSxlQUFlLE9BQU87QUFDeEQsZUFBTyxtRkFDcUMsU0FBUSxPQUFFLFNBQUYsWUFBVSxRQUFHLElBQUkseURBQ3ZCLFFBQVEsRUFBRSxNQUFNLElBQUksNkNBQ3pCLFNBQVEsT0FBRSxhQUFGLFlBQWMsRUFBRSxJQUFJLGtCQUFlLFNBQVEsT0FBRSxXQUFGLFlBQVksRUFBRSxJQUFJLFdBQVEsS0FBSztBQUFBLE1BRTdILENBQUMsRUFBRSxLQUFLLEVBQUU7QUFBQSxJQUNaLFNBQVE7QUFBRSxTQUFHLFlBQVk7QUFBQSxJQUFxRDtBQUFBLEVBQ2hGO0FBRUEsaUJBQWUsc0JBQXFDO0FBQ2xELFFBQUk7QUFDRixZQUFNLElBQUksTUFBTSxNQUFNLGVBQWUsMENBQTBDO0FBQUEsUUFDN0UsU0FBUyxFQUFFLFVBQVUsZUFBZSxpQkFBaUIsWUFBWSxjQUFjO0FBQUEsTUFDakYsQ0FBQztBQUNELFlBQU0sT0FBTyxNQUFNLEVBQUUsS0FBSztBQUMxQixVQUFJLFFBQVEsS0FBSyxDQUFDLEdBQUc7QUFDbkIsUUFBQyxTQUFTLGVBQWUsYUFBYSxFQUF1QixVQUFVLEtBQUssQ0FBQyxFQUFHO0FBQ2hGLGNBQU0sVUFBVSxNQUFNLFFBQVEsS0FBSyxDQUFDLEVBQUcsT0FBTyxJQUFJLEtBQUssQ0FBQyxFQUFHLFVBQVUsaUJBQWlCO0FBQ3RGLFFBQUMsU0FBUyxlQUFlLGVBQWUsRUFBMEIsUUFBUSxRQUFRLEtBQUssSUFBSTtBQUFBLE1BQzdGO0FBQUEsSUFDRixTQUFTLEdBQUc7QUFBRSxNQUFBQSxLQUFJLEtBQUssaUNBQWlDLEVBQUUsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDO0FBQUEsSUFBRztBQUFBLEVBQ2pGO0FBRUEsaUJBQWUscUJBQW9DO0FBQ2pELFVBQU0sUUFBUyxTQUFTLGVBQWUsYUFBYSxFQUF1QjtBQUMzRSxVQUFNLGFBQWMsU0FBUyxlQUFlLGVBQWUsRUFBMEI7QUFDckYsVUFBTSxVQUFVLFdBQVcsTUFBTSxJQUFJLEVBQUUsSUFBSSxPQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsT0FBTyxPQUFLLEVBQUUsU0FBUyxDQUFDO0FBQ2xGLFVBQU0sUUFBUSxTQUFTLGVBQWUsV0FBVztBQUNqRCxRQUFJO0FBQ0YsWUFBTSxJQUFJLE1BQU0sTUFBTSxlQUFlLGtDQUFrQztBQUFBLFFBQ3JFLFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxVQUNQLGdCQUFnQjtBQUFBLFVBQW9CLFVBQVU7QUFBQSxVQUM5QyxpQkFBaUIsWUFBWTtBQUFBLFVBQWUsVUFBVTtBQUFBLFFBQ3hEO0FBQUEsUUFDQSxNQUFNLEtBQUssVUFBVSxFQUFFLE9BQU8sU0FBUyxhQUFZLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUUsQ0FBQztBQUFBLE1BQy9FLENBQUM7QUFDRCxVQUFJLENBQUMsRUFBRSxHQUFJLE9BQU0sSUFBSSxNQUFNLFlBQVksRUFBRSxNQUFNO0FBQy9DLGlCQUFXLE9BQU87QUFDbEIsVUFBSSxPQUFPO0FBQUUsY0FBTSxNQUFNLFVBQVU7QUFBUyxtQkFBVyxNQUFNO0FBQUUsZ0JBQU0sTUFBTSxVQUFVO0FBQUEsUUFBUSxHQUFHLElBQUk7QUFBQSxNQUFHO0FBQUEsSUFDekcsU0FBUTtBQUFFLFlBQU0scUNBQStCO0FBQUEsSUFBRztBQUFBLEVBQ3BEO0FBR0EsV0FBUyxvQkFBMEI7QUFDakMsVUFBTSxPQUFPLFNBQVMsY0FBYyxlQUFlO0FBQ25ELFVBQU0sVUFBVSxTQUFTLGNBQWMsVUFBVTtBQUNqRCxRQUFJLENBQUMsUUFBUSxDQUFDLFFBQVM7QUFDdkIsVUFBTSxRQUFxQjtBQUUzQixRQUFJLE1BQU07QUFDVixRQUFJLFVBQVU7QUFDZCxVQUFNLGFBQWE7QUFDbkIsUUFBSSxTQUFTO0FBRWIsUUFBSSxXQUFXO0FBQ2YsUUFBSSxtQkFBbUI7QUFDdkIsUUFBSSxlQUFlO0FBQ25CLFFBQUksYUFBdUIsQ0FBQztBQUM1QixRQUFJLGNBQWM7QUFDbEIsUUFBSSxXQUFXO0FBQ2YsUUFBSSxhQUFhO0FBQ2pCLFFBQUksWUFBWTtBQUNoQixRQUFJLGNBQW9EO0FBR3hELFFBQUksWUFBWSxLQUFLLElBQUksR0FBRyxLQUFLLGNBQWMsTUFBTSxXQUFXO0FBQ2hFLFVBQU0sS0FBSyxJQUFJLGVBQWUsTUFBTTtBQUNsQyxrQkFBWSxLQUFLLElBQUksR0FBRyxLQUFLLGNBQWMsTUFBTSxXQUFXO0FBQUEsSUFDOUQsQ0FBQztBQUNELE9BQUcsUUFBUSxJQUFJO0FBQ2YsT0FBRyxRQUFRLEtBQUs7QUFFaEIsYUFBUyxTQUFTLFFBQXNCO0FBQ3RDLFlBQU07QUFDTixZQUFNLE1BQU0sWUFBWSxjQUFjLEdBQUc7QUFBQSxJQUMzQztBQUVBLGFBQVMsZUFBcUI7QUFDNUIsVUFBSSxnQkFBZ0IsTUFBTTtBQUFFLHFCQUFhLFdBQVc7QUFBRyxzQkFBYztBQUFBLE1BQU07QUFBQSxJQUM3RTtBQUVBLGFBQVMsZUFBZSxJQUFrQjtBQUN4QyxtQkFBYTtBQUNiLG9CQUFjLFdBQVcsTUFBTTtBQUM3QixpQkFBUztBQUNULG9CQUFZO0FBQ1oscUJBQWE7QUFDYixzQkFBYztBQUFBLE1BQ2hCLEdBQUcsRUFBRTtBQUFBLElBQ1A7QUFFQSxhQUFTLE9BQWE7QUFFcEIsVUFBSSxDQUFDLFNBQVMsU0FBUyxJQUFJLEdBQUc7QUFBRSxXQUFHLFdBQVc7QUFBRztBQUFBLE1BQVE7QUFFekQsVUFBSSxDQUFDLFVBQVU7QUFDYixZQUFJLFdBQVc7QUFDYix3QkFBYztBQUNkLGdCQUFNLE9BQU8sTUFBTTtBQUNuQixjQUFJLE9BQU8sS0FBSyxPQUFPLFdBQVc7QUFDaEMscUJBQVMsS0FBSyxJQUFJLFdBQVcsS0FBSyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDL0Msd0JBQVk7QUFDWix5QkFBYTtBQUNiLDJCQUFlLEdBQUc7QUFBQSxVQUNwQixXQUFXLEtBQUssSUFBSSxVQUFVLElBQUksTUFBTTtBQUN0Qyx3QkFBWTtBQUNaLHlCQUFhO0FBQ2IsMkJBQWUsSUFBSTtBQUFBLFVBQ3JCLE9BQU87QUFDTCxxQkFBUyxJQUFJO0FBQUEsVUFDZjtBQUFBLFFBQ0YsV0FBVyxVQUFVLFlBQVksSUFBSTtBQUNuQyxnQkFBTSxPQUFPLE1BQU0sYUFBYTtBQUNoQyxjQUFJLFFBQVEsV0FBVztBQUFFLHFCQUFTLFNBQVM7QUFBRyxzQkFBVTtBQUFBLFVBQUcsV0FDbEQsUUFBUSxHQUFHO0FBQUUscUJBQVMsQ0FBQztBQUFHLHNCQUFVO0FBQUEsVUFBSSxNQUM1QyxVQUFTLElBQUk7QUFBQSxRQUNwQjtBQUFBLE1BQ0Y7QUFDQSw0QkFBc0IsSUFBSTtBQUFBLElBQzVCO0FBRUEsU0FBSyxpQkFBaUIsZUFBZSxDQUFDLE1BQW9CO0FBQ3hELGlCQUFXO0FBQ1gsZUFBUztBQUNULGtCQUFZO0FBQ1osbUJBQWE7QUFDYixtQkFBYTtBQUNiLHlCQUFtQixFQUFFO0FBQ3JCLHFCQUFlO0FBQ2YsbUJBQWEsQ0FBQztBQUNkLG9CQUFjLEVBQUU7QUFDaEIsaUJBQVcsWUFBWSxJQUFJO0FBQzNCLFdBQUssTUFBTSxTQUFTO0FBQ3BCLFdBQUssa0JBQWtCLEVBQUUsU0FBUztBQUFBLElBQ3BDLEdBQUcsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUVwQixTQUFLLGlCQUFpQixlQUFlLENBQUMsTUFBb0I7QUFDeEQsVUFBSSxDQUFDLFNBQVU7QUFDZixZQUFNLEtBQUssRUFBRSxVQUFVO0FBQ3ZCLFVBQUksU0FBUyxlQUFlO0FBRTVCLFVBQUksU0FBUyxFQUFHLFVBQVMsU0FBUztBQUNsQyxVQUFJLFNBQVMsVUFBVyxVQUFTLGFBQWEsU0FBUyxhQUFhO0FBQ3BFLGVBQVMsTUFBTTtBQUVmLFlBQU0sTUFBTSxZQUFZLElBQUk7QUFDNUIsWUFBTSxLQUFLLE1BQU07QUFDakIsVUFBSSxLQUFLLEtBQUssS0FBSyxJQUFJO0FBQ3JCLG1CQUFXLE1BQU0sRUFBRSxVQUFVLGVBQWUsS0FBSyxFQUFFO0FBQ25ELFlBQUksV0FBVyxTQUFTLEVBQUcsWUFBVyxNQUFNO0FBQUEsTUFDOUM7QUFDQSxvQkFBYyxFQUFFO0FBQ2hCLGlCQUFXO0FBQUEsSUFDYixHQUFHLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFFcEIsVUFBTSxZQUFZLE1BQVk7QUFDNUIsVUFBSSxDQUFDLFNBQVU7QUFDZixpQkFBVztBQUNYLFdBQUssTUFBTSxTQUFTO0FBRXBCLFVBQUksTUFBTSxLQUFLLE1BQU0sV0FBVztBQUM5QixpQkFBUyxLQUFLLElBQUksV0FBVyxLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztBQUM5Qyx1QkFBZSxHQUFHO0FBQ2xCO0FBQUEsTUFDRjtBQUVBLFlBQU0sU0FBUyxXQUFXLFNBQVMsSUFDL0IsV0FBVyxNQUFNLEVBQUUsRUFBRSxPQUFPLENBQUMsR0FBRyxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxJQUFJLEdBQUcsV0FBVyxNQUFNLElBQy9FO0FBRUosVUFBSSxLQUFLLElBQUksTUFBTSxJQUFJLEtBQUs7QUFDMUIscUJBQWE7QUFDYixvQkFBWTtBQUFBLE1BQ2QsT0FBTztBQUNMLHVCQUFlLEdBQUk7QUFBQSxNQUNyQjtBQUFBLElBQ0Y7QUFFQSxTQUFLLGlCQUFpQixhQUFpQixTQUFTO0FBQ2hELFNBQUssaUJBQWlCLGlCQUFpQixTQUFTO0FBRWhELDBCQUFzQixNQUFNLHNCQUFzQixJQUFJLENBQUM7QUFBQSxFQUN6RDtBQUVBLEdBQUMsZUFBZSxPQUFzQjtBQUNwQyxRQUFJO0FBQ0YsWUFBTSxnQkFBZ0IsYUFBYSxlQUFlO0FBQ2xELFVBQUksZUFBZTtBQUNqQixjQUFNLFNBQVMsTUFBTSxhQUFhLFFBQVEsY0FBYyxRQUFRO0FBQ2hFLFlBQUksT0FBTyxNQUFNLE9BQU8sTUFBTSxVQUFVLE9BQU8sTUFBTSxTQUFTO0FBQzVELDJCQUFpQixPQUFPLE1BQU0sUUFBUSxPQUFPLENBQVk7QUFDekQ7QUFBQSxRQUNGO0FBRUEsWUFBSSxDQUFDLE9BQU8sTUFBTSxPQUFPLE1BQU0sU0FBUyxnQkFBZ0I7QUFDdEQsVUFBQUEsS0FBSSxLQUFLLDJEQUE2QyxFQUFFLEtBQUssTUFBTSxjQUFjLFNBQVMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDO0FBQ3ZHLDJCQUFpQixjQUFjLE9BQU8sQ0FBWTtBQUNsRDtBQUFBLFFBQ0Y7QUFDQSxxQkFBYSxPQUFPO0FBQUEsTUFDdEI7QUFBQSxJQUNGLFNBQVMsR0FBRztBQUFFLE1BQUFBLEtBQUksS0FBSywrQkFBNEIsRUFBRSxPQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUM7QUFBQSxJQUFHO0FBQzFFLGlCQUFhO0FBQUEsRUFDZixHQUFHO0FBRUgsb0JBQWtCO0FBR2xCLE1BQUksbUJBQW1CLFdBQVc7QUFDaEMsY0FBVSxjQUFjLFNBQVMsT0FBTyxFQUFFLE1BQU0sTUFBTTtBQUFBLElBQUMsQ0FBQztBQUFBLEVBQzFEO0FBR0EsR0FBQyxlQUFlLHNCQUFxQztBQUNuRCxRQUFJO0FBQ0YsWUFBTSxPQUFPLElBQUksZ0JBQWdCO0FBQ2pDLFlBQU0sUUFBUSxXQUFXLE1BQU0sS0FBSyxNQUFNLEdBQUcsR0FBTTtBQUNuRCxZQUFNLElBQUksTUFBTSxNQUFNLGVBQWUsa0RBQWtEO0FBQUEsUUFDckYsU0FBUyxFQUFFLFVBQVUsZUFBZSxpQkFBaUIsWUFBWSxjQUFjO0FBQUEsUUFDL0UsUUFBUSxLQUFLO0FBQUEsTUFDZixDQUFDO0FBQ0QsbUJBQWEsS0FBSztBQUNsQixVQUFJLENBQUMsRUFBRSxHQUFJO0FBQ1gsWUFBTSxRQUFRLE1BQU0sRUFBRSxLQUFLO0FBQzNCLFVBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxLQUFLLENBQUMsTUFBTSxPQUFRO0FBQzVDLFlBQU0sT0FBNkUsQ0FBQztBQUNwRixZQUFNLFFBQVEsT0FBSztBQUNqQixZQUFJLEtBQUssT0FBTyxFQUFFLFNBQVMsWUFBWSxFQUFFLEtBQUssS0FBSyxFQUFHLE1BQUssRUFBRSxLQUFLLEtBQUssRUFBRSxZQUFZLENBQUMsSUFBSTtBQUFBLE1BQzVGLENBQUM7QUFDRCxZQUFNLFdBQVcsb0JBQUksSUFBb0I7QUFDekMsZUFBUyxpQkFBaUIsWUFBWSxFQUFFLFFBQVEsU0FBTztBQTNoQzNEO0FBNGhDTSxjQUFNLGVBQWMsU0FBSSxhQUFhLFNBQVMsTUFBMUIsWUFBK0I7QUFDbkQsY0FBTSxJQUFJLFlBQVksTUFBTSw0REFBNEQ7QUFDeEYsWUFBSSxDQUFDLEVBQUc7QUFDUixjQUFNLFdBQVcsRUFBRSxDQUFDO0FBQ3BCLGNBQU0sUUFBUSxTQUFTLEtBQUssRUFBRSxZQUFZO0FBQzFDLGNBQU0sS0FBSyxLQUFLLEtBQUs7QUFDckIsWUFBSSxDQUFDLEdBQUk7QUFDVCxjQUFNLE9BQU8sSUFBSSxRQUFRLFlBQVk7QUFDckMsWUFBSSxDQUFDLEtBQU07QUFDWCxZQUFJLEdBQUcsZUFBZSxPQUFPO0FBQUUsZUFBSyxNQUFNLFVBQVU7QUFBUTtBQUFBLFFBQVE7QUFDcEUsY0FBTSxZQUFZLFdBQVcsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUM3QyxZQUFJLE1BQU0sU0FBUyxLQUFLLGFBQWEsRUFBRztBQUN4QyxjQUFNLFNBQVMsWUFBWSxXQUFXLGdCQUFnQixJQUFJLG1CQUFtQjtBQUM3RSxZQUFJLGFBQWEsV0FBVyxTQUFTLFlBQVksU0FBUyxRQUFRLE1BQU0sS0FBSyxJQUFJLE9BQU8sWUFBWSxHQUFHO0FBQ3ZHLGNBQU0sVUFBVSxLQUFLLGNBQWMsYUFBYTtBQUNoRCxZQUFJLFFBQVMsU0FBUSxjQUFjLFFBQVEsVUFBVSxRQUFRLENBQUMsRUFBRSxRQUFRLEtBQUssR0FBRztBQUNoRixpQkFBUyxJQUFJLFVBQVUsU0FBUztBQUFBLE1BQ2xDLENBQUM7QUFDRCxrQkFBWSxpQkFBaUIsUUFBUTtBQUFBLElBQ3ZDLFNBQVE7QUFBQSxJQUFtQjtBQUFBLEVBQzdCLEdBQUc7QUFHSCxXQUFTLGlCQUFpQixXQUFXLENBQUMsTUFBcUI7QUFDekQsUUFBSSxFQUFFLFFBQVEsVUFBVTtBQUN0QixtQkFBYTtBQUNiLGtCQUFZO0FBQ1osc0JBQWdCO0FBQ2hCLHVCQUFpQjtBQUFBLElBQ25CO0FBQUEsRUFDRixDQUFDO0FBNENELFNBQU8sT0FBTyxRQUFRO0FBQUEsSUFDcEI7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsibG9nIiwgImxvZyIsICJsb2ciLCAibG9nIiwgImxvZyIsICJfYSIsICJlIl0KfQo=
