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
    const track = document.querySelector(".filtros");
    if (!wrap || !track) return;
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
    const getMin = () => Math.min(0, wrap.clientWidth - track.scrollWidth);
    const getMax = () => 0;
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
      if (!dragging) {
        if (inertiaOn) {
          inertiaVel *= 0.92;
          const min = getMin(), max = getMax();
          const next = pos + inertiaVel;
          if (next > max || next < min) {
            applyPos(Math.max(min, Math.min(max, next)));
            inertiaOn = false;
            scheduleResume(600);
          } else if (Math.abs(inertiaVel) < 0.15) {
            inertiaOn = false;
            scheduleResume(1500);
          } else {
            applyPos(next);
          }
        } else if (isAuto) {
          const min = getMin(), max = getMax();
          if (min < max - 1) {
            const next = pos + AUTO_SPEED * autoDir;
            if (next <= min) {
              applyPos(min);
              autoDir = 1;
            } else if (next >= max) {
              applyPos(max);
              autoDir = -1;
            } else applyPos(next);
          }
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
    }, { passive: true });
    wrap.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartClientX;
      const min = getMin(), max = getMax();
      let newPos = dragStartPos + dx;
      if (newPos > max) newPos = max + (newPos - max) * 0.25;
      if (newPos < min) newPos = min + (newPos - min) * 0.25;
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
      const min = getMin(), max = getMax();
      if (pos > max || pos < min) {
        applyPos(Math.max(min, Math.min(max, pos)));
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
    wrap.addEventListener("pointerup", onRelease, { passive: true });
    wrap.addEventListener("pointerleave", onRelease, { passive: true });
    wrap.addEventListener("pointercancel", onRelease, { passive: true });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3V0aWxzL3RvYXN0LnRzIiwgIi4uL3NyYy91dGlscy9zZWN1cml0eS50cyIsICIuLi9zcmMvdXRpbHMvZm9ybWF0LnRzIiwgIi4uL3NyYy9jb3JlL2Vycm9ycy50cyIsICIuLi9zcmMvZG9tYWluL2NsaWVudGUudHMiLCAiLi4vc3JjL2NvcmUvcmVzdWx0LnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9jbGllbnQudHMiLCAiLi4vc3JjL2NvcmUvbG9nZ2VyLnRzIiwgIi4uL3NyYy9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9DbGllbnRlUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvZG9tYWluL3BlZGlkby50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUGVkaWRvUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUm9sZXRhUmVwb3NpdG9yeS50cyIsICIuLi9zcmMvc3RhdGUvU3RvcmUudHMiLCAiLi4vc3JjL3N0YXRlL0FwcFN0b3JlLnRzIiwgIi4uL3NyYy9hcHBsaWNhdGlvbi9hdXRoL0xvZ2luVXNlQ2FzZS50cyIsICIuLi9zcmMvYXBwbGljYXRpb24vY2FydC9DYXJ0U2VydmljZS50cyIsICIuLi9zcmMvY29udGFpbmVyLnRzIiwgIi4uL3NyYy9tb2R1bGVzL3JvbGV0YS50cyIsICIuLi9zcmMvbW9kdWxlcy9jYXJ0LnRzIiwgIi4uL3NyYy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IFRvYXN0VGlwbyB9IGZyb20gJy4uL3R5cGVzJztcblxuZXhwb3J0IGZ1bmN0aW9uIG1vc3RyYXJUb2FzdChtc2c6IHN0cmluZywgdGlwbzogVG9hc3RUaXBvID0gJ2luZm8nKTogdm9pZCB7XG4gIGNvbnN0IG9sZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdfdG9hc3QnKTtcbiAgaWYgKG9sZCkgb2xkLnJlbW92ZSgpO1xuICBjb25zdCB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHQuaWQgPSAnX3RvYXN0JztcbiAgdC50ZXh0Q29udGVudCA9IG1zZztcbiAgY29uc3QgYmcgPSB0aXBvID09PSAnZXJybycgPyAnI2VmNDQ0NCcgOiB0aXBvID09PSAnb2snID8gJyMyMmM1NWUnIDogJyM0QTJDMTcnO1xuICBPYmplY3QuYXNzaWduKHQuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogJ2ZpeGVkJywgYm90dG9tOiAnOTBweCcsIGxlZnQ6ICc1MCUnLFxuICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVgoLTUwJSknLFxuICAgIGJhY2tncm91bmQ6IGJnLCBjb2xvcjogJyNmZmYnLCBwYWRkaW5nOiAnMTJweCAyMnB4JyxcbiAgICBib3JkZXJSYWRpdXM6ICczMHB4JywgZm9udFNpemU6ICcxNHB4JywgZm9udFdlaWdodDogJzYwMCcsXG4gICAgekluZGV4OiAnOTk5OTknLCBib3hTaGFkb3c6ICcwIDZweCAyNHB4IHJnYmEoMCwwLDAsMC4zKScsXG4gICAgbWF4V2lkdGg6ICc5MHZ3JywgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICB0cmFuc2l0aW9uOiAnb3BhY2l0eSAuM3MnLCBvcGFjaXR5OiAnMScsXG4gICAgZm9udEZhbWlseTogXCInRE0gU2FucycsIHNhbnMtc2VyaWZcIixcbiAgfSBhcyBQYXJ0aWFsPENTU1N0eWxlRGVjbGFyYXRpb24+KTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0KTtcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdC5zdHlsZS5vcGFjaXR5ID0gJzAnO1xuICAgIHNldFRpbWVvdXQoKCkgPT4gdC5yZW1vdmUoKSwgMzUwKTtcbiAgfSwgMzUwMCk7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGVzY0hUTUwoczogdW5rbm93bik6IHN0cmluZyB7XG4gIHJldHVybiBTdHJpbmcocylcbiAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXphclRlbGVmb25lKHRlbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRlbC5yZXBsYWNlKC9cXEQvZywgJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXphck5vbWUobm9tZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5vbWVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5zcGxpdCgnICcpXG4gICAgLm1hcChwID0+IHAuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwLnNsaWNlKDEpKVxuICAgIC5qb2luKCcgJylcbiAgICAudHJpbSgpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBmb3JtYXRhck1vZWRhKHZhbG9yOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gJ1IkICcgKyB2YWxvci50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VtYW5hQXR1YWwoKTogc3RyaW5nIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3Qgc3RhcnRPZlllYXIgPSBuZXcgRGF0ZShub3cuZ2V0RnVsbFllYXIoKSwgMCwgMSk7XG4gIGNvbnN0IGRheU9mWWVhciA9IE1hdGguZmxvb3IoKG5vdy5nZXRUaW1lKCkgLSBzdGFydE9mWWVhci5nZXRUaW1lKCkpIC8gODY0MDAwMDApO1xuICBjb25zdCB3ZWVrTnVtID0gTWF0aC5jZWlsKChkYXlPZlllYXIgKyBzdGFydE9mWWVhci5nZXREYXkoKSArIDEpIC8gNyk7XG4gIHJldHVybiBgJHtub3cuZ2V0RnVsbFllYXIoKX0tVyR7U3RyaW5nKHdlZWtOdW0pLnBhZFN0YXJ0KDIsICcwJyl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwbGljYXJNYXNjYXJhVGVsZWZvbmUodmFsb3I6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSB2YWxvci5yZXBsYWNlKC9cXEQvZywgJycpLnNsaWNlKDAsIDExKTtcbiAgaWYgKGQubGVuZ3RoIDw9IDIpIHJldHVybiBkO1xuICBpZiAoZC5sZW5ndGggPD0gNykgcmV0dXJuIGAoJHtkLnNsaWNlKDAsIDIpfSkgJHtkLnNsaWNlKDIpfWA7XG4gIGlmIChkLmxlbmd0aCA8PSAxMSkgcmV0dXJuIGAoJHtkLnNsaWNlKDAsIDIpfSkgJHtkLnNsaWNlKDIsIDcpfS0ke2Quc2xpY2UoNyl9YDtcbiAgcmV0dXJuIGAoJHtkLnNsaWNlKDAsIDIpfSkgJHtkLnNsaWNlKDIsIDcpfS0ke2Quc2xpY2UoNywgMTEpfWA7XG59XG4iLCAiZXhwb3J0IGNsYXNzIEFwcEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgcHVibGljIHJlYWRvbmx5IGNvZGU6IHN0cmluZyxcbiAgICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzQ29kZTogbnVtYmVyID0gNTAwLFxuICAgIHB1YmxpYyByZWFkb25seSBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ0FwcEVycm9yJztcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgQXBwRXJyb3IucHJvdG90eXBlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgIHN1cGVyKG1lc3NhZ2UsICdWQUxJREFUSU9OX0VSUk9SJywgNDAwLCBjb250ZXh0KTtcbiAgICB0aGlzLm5hbWUgPSAnVmFsaWRhdGlvbkVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTmV0d29ya0Vycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgIHN1cGVyKG1lc3NhZ2UsICdORVRXT1JLX0VSUk9SJywgNTAzLCBjb250ZXh0KTtcbiAgICB0aGlzLm5hbWUgPSAnTmV0d29ya0Vycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXV0aEVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlLCAnQVVUSF9FUlJPUicsIDQwMSk7XG4gICAgdGhpcy5uYW1lID0gJ0F1dGhFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHJlc291cmNlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgJHtyZXNvdXJjZX0gblx1MDBFM28gZW5jb250cmFkb2AsICdOT1RfRk9VTkQnLCA0MDQpO1xuICAgIHRoaXMubmFtZSA9ICdOb3RGb3VuZEVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmF0ZUxpbWl0RXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHJldHJ5QWZ0ZXJNczogbnVtYmVyKSB7XG4gICAgc3VwZXIoYE11aXRhcyB0ZW50YXRpdmFzLiBBZ3VhcmRlICR7TWF0aC5jZWlsKHJldHJ5QWZ0ZXJNcyAvIDEwMDApfXMuYCwgJ1JBVEVfTElNSVQnLCA0MjksIHsgcmV0cnlBZnRlck1zIH0pO1xuICAgIHRoaXMubmFtZSA9ICdSYXRlTGltaXRFcnJvcic7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi9jb3JlL2Vycm9ycyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2xpZW50ZVByb3BzIHtcbiAgaWQ/OiBudW1iZXI7XG4gIG5vbWU6IHN0cmluZztcbiAgdGVsZWZvbmU6IHN0cmluZztcbiAgZW5kZXJlY28/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBDbGllbnRlIHtcbiAgcmVhZG9ubHkgaWQ/OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5vbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgdGVsZWZvbmU6IHN0cmluZztcbiAgcmVhZG9ubHkgZW5kZXJlY28/OiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcm9wczogQ2xpZW50ZVByb3BzKSB7XG4gICAgdGhpcy5pZCA9IHByb3BzLmlkO1xuICAgIHRoaXMubm9tZSA9IHByb3BzLm5vbWU7XG4gICAgdGhpcy50ZWxlZm9uZSA9IHByb3BzLnRlbGVmb25lO1xuICAgIHRoaXMuZW5kZXJlY28gPSBwcm9wcy5lbmRlcmVjbztcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGUocHJvcHM6IENsaWVudGVQcm9wcyk6IENsaWVudGUge1xuICAgIGNvbnN0IHRlbCA9IHByb3BzLnRlbGVmb25lLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgaWYgKHRlbC5sZW5ndGggPCAxMCB8fCB0ZWwubGVuZ3RoID4gMTEpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1RlbGVmb25lIGludlx1MDBFMWxpZG8nLCB7IHRlbGVmb25lOiBwcm9wcy50ZWxlZm9uZSB9KTtcbiAgICB9XG4gICAgaWYgKCFwcm9wcy5ub21lLnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignTm9tZSBuXHUwMEUzbyBwb2RlIHNlciB2YXppbycpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENsaWVudGUoe1xuICAgICAgLi4ucHJvcHMsXG4gICAgICB0ZWxlZm9uZTogdGVsLFxuICAgICAgbm9tZTogQ2xpZW50ZS5ub3JtYWxpemFyTm9tZShwcm9wcy5ub21lKSxcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tREIocmF3OiBDbGllbnRlUHJvcHMpOiBDbGllbnRlIHtcbiAgICByZXR1cm4gbmV3IENsaWVudGUocmF3KTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIG5vcm1hbGl6YXJOb21lKG5vbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG5vbWUudG9Mb3dlckNhc2UoKS5zcGxpdCgnICcpXG4gICAgICAubWFwKHAgPT4gcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHAuc2xpY2UoMSkpXG4gICAgICAuam9pbignICcpLnRyaW0oKTtcbiAgfVxuXG4gIHdpdGhFbmRlcmVjbyhlbmRlcmVjbzogc3RyaW5nKTogQ2xpZW50ZSB7XG4gICAgcmV0dXJuIENsaWVudGUuZnJvbURCKHsgLi4udGhpcy50b0pTT04oKSwgZW5kZXJlY28gfSk7XG4gIH1cblxuICB0b0pTT04oKTogQ2xpZW50ZVByb3BzIHtcbiAgICByZXR1cm4geyBpZDogdGhpcy5pZCwgbm9tZTogdGhpcy5ub21lLCB0ZWxlZm9uZTogdGhpcy50ZWxlZm9uZSwgZW5kZXJlY286IHRoaXMuZW5kZXJlY28gfTtcbiAgfVxufVxuIiwgImV4cG9ydCB0eXBlIFJlc3VsdDxULCBFIGV4dGVuZHMgRXJyb3IgPSBFcnJvcj4gPVxuICB8IHsgcmVhZG9ubHkgb2s6IHRydWU7IHJlYWRvbmx5IHZhbHVlOiBUIH1cbiAgfCB7IHJlYWRvbmx5IG9rOiBmYWxzZTsgcmVhZG9ubHkgZXJyb3I6IEUgfTtcblxuZXhwb3J0IGNvbnN0IG9rID0gPFQ+KHZhbHVlOiBUKTogUmVzdWx0PFQsIG5ldmVyPiA9PiAoeyBvazogdHJ1ZSwgdmFsdWUgfSk7XG5leHBvcnQgY29uc3QgZmFpbCA9IDxFIGV4dGVuZHMgRXJyb3I+KGVycm9yOiBFKTogUmVzdWx0PG5ldmVyLCBFPiA9PiAoeyBvazogZmFsc2UsIGVycm9yIH0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNPazxULCBFIGV4dGVuZHMgRXJyb3I+KHI6IFJlc3VsdDxULCBFPik6IHIgaXMgeyBvazogdHJ1ZTsgdmFsdWU6IFQgfSB7XG4gIHJldHVybiByLm9rO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwPFQ+KHI6IFJlc3VsdDxUPiwgZmFsbGJhY2s/OiBUKTogVCB7XG4gIGlmIChyLm9rKSByZXR1cm4gci52YWx1ZTtcbiAgaWYgKGZhbGxiYWNrICE9PSB1bmRlZmluZWQpIHJldHVybiBmYWxsYmFjaztcbiAgdGhyb3cgci5lcnJvcjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRyeUFzeW5jPFQ+KGZuOiAoKSA9PiBQcm9taXNlPFQ+KTogUHJvbWlzZTxSZXN1bHQ8VD4+IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gb2soYXdhaXQgZm4oKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFpbChlIGluc3RhbmNlb2YgRXJyb3IgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSkpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgTmV0d29ya0Vycm9yIH0gZnJvbSAnLi4vLi4vY29yZS9lcnJvcnMnO1xuXG5jb25zdCBTVVBBQkFTRV9VUkwgPSBhdG9iKCdhSFIwY0hNNkx5OXlabUowWkhSMmMyNW1kSGxpWVhwbWJXUmlkeTV6ZFhCaFltRnpaUzVqYnc9PScpO1xuY29uc3QgU1VQQUJBU0VfQU5PTiA9IGF0b2IoJ1pYbEthR0pIWTJsUGFVcEpWWHBKTVU1cFNYTkpibEkxWTBOSk5rbHJjRmhXUTBvNUxtVjVTbkJqTTAxcFQybEtlbVJZUW1oWmJVWjZXbE5KYzBsdVNteGFhVWsyU1c1S2JWbHVVbXRrU0ZwNlltMWFNR1ZYU21obGJWcDBXa2RLTTBscGQybGpiVGx6V2xOSk5rbHRSblZpTWpScFRFTktjRmxZVVdsUGFrVXpUMFJGTlUxVVFYcE9ha0Z6U1cxV05HTkRTVFpOYWtFMVRucFJORTVxVFRKTlNEQXVTSGMyT0dwUlJrWnRkMHhuZG5kR09YcHFhR2RXVjFCak0wUXhVVEp3Wm1kQmJqRlVVV3hLUlZaMU5BPT0nKTtcbmNvbnN0IFRJTUVPVVRfTVMgPSAxMF8wMDA7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VwYWJhc2VGZXRjaE9wdGlvbnMgZXh0ZW5kcyBSZXF1ZXN0SW5pdCB7XG4gIHRpbWVvdXQ/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdXBhYmFzZUZldGNoKFxuICBwYXRoOiBzdHJpbmcsXG4gIG9wdHM6IFN1cGFiYXNlRmV0Y2hPcHRpb25zID0ge31cbik6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgY29uc3QgeyB0aW1lb3V0ID0gVElNRU9VVF9NUywgLi4uZmV0Y2hPcHRzIH0gPSBvcHRzO1xuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCB0aW1lb3V0KTtcblxuICB0cnkge1xuICAgIGNvbnN0IGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTixcbiAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke1NVUEFCQVNFX0FOT059YCxcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAnUHJlZmVyJzogJ3JldHVybj1yZXByZXNlbnRhdGlvbicsXG4gICAgICAuLi4oKGZldGNoT3B0cy5oZWFkZXJzIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pID8/IHt9KSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIGF3YWl0IGZldGNoKGAke1NVUEFCQVNFX1VSTH0ke3BhdGh9YCwge1xuICAgICAgLi4uZmV0Y2hPcHRzLFxuICAgICAgaGVhZGVycyxcbiAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yICYmIGUubmFtZSA9PT0gJ0Fib3J0RXJyb3InKSB7XG4gICAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKCdUaW1lb3V0OiBzZXJ2aWRvciBuXHUwMEUzbyByZXNwb25kZXUnLCB7IHBhdGggfSk7XG4gICAgfVxuICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoJ0Vycm8gZGUgcmVkZScsIHsgcGF0aCwgY2F1c2U6IFN0cmluZyhlKSB9KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdXBhYmFzZUdldDxUPihcbiAgdGFibGU6IHN0cmluZyxcbiAgcXVlcnkgPSAnJ1xuKTogUHJvbWlzZTxUW10+IHtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IHN1cGFiYXNlRmV0Y2goYC9yZXN0L3YxLyR7dGFibGV9JHtxdWVyeSA/ICc/JyArIHF1ZXJ5IDogJyd9YCk7XG4gIGlmICghcmVzcC5vaykge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXNwLnRleHQoKS5jYXRjaCgoKSA9PiAnJyk7XG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgR0VUICR7dGFibGV9IGZhbGhvdSAoJHtyZXNwLnN0YXR1c30pYCwgeyBzdGF0dXM6IHJlc3Auc3RhdHVzLCBib2R5IH0pO1xuICB9XG4gIHJldHVybiByZXNwLmpzb24oKSBhcyBQcm9taXNlPFRbXT47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdXBhYmFzZVBvc3Q8VD4oXG4gIHRhYmxlOiBzdHJpbmcsXG4gIGRhdGE6IFBhcnRpYWw8VD5cbik6IFByb21pc2U8VD4ge1xuICBjb25zdCByZXNwID0gYXdhaXQgc3VwYWJhc2VGZXRjaChgL3Jlc3QvdjEvJHt0YWJsZX1gLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gIH0pO1xuICBpZiAoIXJlc3Aub2spIHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcihgUE9TVCAke3RhYmxlfSBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHkgfSk7XG4gIH1cbiAgY29uc3Qgcm93cyA9IGF3YWl0IHJlc3AuanNvbigpIGFzIFRbXTtcbiAgcmV0dXJuIHJvd3NbMF0hO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3VwYWJhc2VQYXRjaDxUPihcbiAgdGFibGU6IHN0cmluZyxcbiAgcXVlcnk6IHN0cmluZyxcbiAgZGF0YTogUGFydGlhbDxUPlxuKTogUHJvbWlzZTxUW10+IHtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IHN1cGFiYXNlRmV0Y2goYC9yZXN0L3YxLyR7dGFibGV9PyR7cXVlcnl9YCwge1xuICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgfSk7XG4gIGlmICghcmVzcC5vaykge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXNwLnRleHQoKTtcbiAgICB0aHJvdyBuZXcgTmV0d29ya0Vycm9yKGBQQVRDSCAke3RhYmxlfSBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHkgfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3AuanNvbigpIGFzIFByb21pc2U8VFtdPjtcbn1cblxuZXhwb3J0IHsgU1VQQUJBU0VfVVJMLCBTVVBBQkFTRV9BTk9OIH07XG4iLCAidHlwZSBMb2dMZXZlbCA9ICdkZWJ1ZycgfCAnaW5mbycgfCAnd2FybicgfCAnZXJyb3InO1xuXG5pbnRlcmZhY2UgTG9nRW50cnkge1xuICBsZXZlbDogTG9nTGV2ZWw7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgdGltZXN0YW1wOiBzdHJpbmc7XG4gIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbn1cblxuY2xhc3MgTG9nZ2VyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBwcmVmaXg6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihwcmVmaXggPSAnR2VsYW1vdXInKSB7XG4gICAgdGhpcy5wcmVmaXggPSBwcmVmaXg7XG4gIH1cblxuICBwcml2YXRlIGxvZyhsZXZlbDogTG9nTGV2ZWwsIG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3QgZW50cnk6IExvZ0VudHJ5ID0ge1xuICAgICAgbGV2ZWwsXG4gICAgICBtZXNzYWdlLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBjb250ZXh0LFxuICAgIH07XG5cbiAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgIGRlYnVnOiAnY29sb3I6ICM2QjcyODAnLFxuICAgICAgaW5mbzogICdjb2xvcjogIzNCODJGNicsXG4gICAgICB3YXJuOiAgJ2NvbG9yOiAjRjU5RTBCJyxcbiAgICAgIGVycm9yOiAnY29sb3I6ICNFRjQ0NDQ7IGZvbnQtd2VpZ2h0OiBib2xkJyxcbiAgICB9W2xldmVsXTtcblxuICAgIGNvbnN0IGZvcm1hdHRlZCA9IGBbJHt0aGlzLnByZWZpeH1dICR7ZW50cnkudGltZXN0YW1wfSAke21lc3NhZ2V9YDtcblxuICAgIGlmIChsZXZlbCA9PT0gJ2Vycm9yJykge1xuICAgICAgY29uc29sZS5lcnJvcihgJWMke2Zvcm1hdHRlZH1gLCBzdHlsZSwgY29udGV4dCA/PyAnJyk7XG4gICAgfSBlbHNlIGlmIChsZXZlbCA9PT0gJ3dhcm4nKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCVjJHtmb3JtYXR0ZWR9YCwgc3R5bGUsIGNvbnRleHQgPz8gJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhgJWMke2Zvcm1hdHRlZH1gLCBzdHlsZSwgY29udGV4dCA/PyAnJyk7XG4gICAgfVxuICB9XG5cbiAgZGVidWcobXNnOiBzdHJpbmcsIGN0eD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7IHRoaXMubG9nKCdkZWJ1ZycsIG1zZywgY3R4KTsgfVxuICBpbmZvKG1zZzogc3RyaW5nLCBjdHg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQgIHsgdGhpcy5sb2coJ2luZm8nLCAgbXNnLCBjdHgpOyB9XG4gIHdhcm4obXNnOiBzdHJpbmcsIGN0eD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCAgeyB0aGlzLmxvZygnd2FybicsICBtc2csIGN0eCk7IH1cbiAgZXJyb3IobXNnOiBzdHJpbmcsIGN0eD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7IHRoaXMubG9nKCdlcnJvcicsIG1zZywgY3R4KTsgfVxuXG4gIGNoaWxkKHByZWZpeDogc3RyaW5nKTogTG9nZ2VyIHsgcmV0dXJuIG5ldyBMb2dnZXIoYCR7dGhpcy5wcmVmaXh9OiR7cHJlZml4fWApOyB9XG59XG5cbmV4cG9ydCBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG4iLCAiaW1wb3J0IHR5cGUgeyBJQ2xpZW50ZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9yZXBvc2l0b3JpZXMvSUNsaWVudGVSZXBvc2l0b3J5JztcbmltcG9ydCB7IENsaWVudGUgfSBmcm9tICcuLi8uLi9kb21haW4vY2xpZW50ZSc7XG5pbXBvcnQgeyB0cnlBc3luYywgdHlwZSBSZXN1bHQgfSBmcm9tICcuLi8uLi9jb3JlL3Jlc3VsdCc7XG5pbXBvcnQgeyBzdXBhYmFzZUdldCwgc3VwYWJhc2VQb3N0LCBzdXBhYmFzZVBhdGNoIH0gZnJvbSAnLi9jbGllbnQnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ0NsaWVudGVSZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBDbGllbnRlUmVwb3NpdG9yeSBpbXBsZW1lbnRzIElDbGllbnRlUmVwb3NpdG9yeSB7XG4gIGFzeW5jIGZpbmRCeVRlbGVmb25lKHRlbGVmb25lOiBzdHJpbmcpOiBQcm9taXNlPFJlc3VsdDxDbGllbnRlIHwgbnVsbD4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgbG9nLmRlYnVnKCdmaW5kQnlUZWxlZm9uZScsIHsgdGVsZWZvbmU6IGAqKioke3RlbGVmb25lLnNsaWNlKC00KX1gIH0pO1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHN1cGFiYXNlR2V0PFJldHVyblR5cGU8Q2xpZW50ZVsndG9KU09OJ10+PihcbiAgICAgICAgJ2NsaWVudGVzJyxcbiAgICAgICAgYHRlbGVmb25lPWVxLiR7dGVsZWZvbmV9JmxpbWl0PTFgXG4gICAgICApO1xuICAgICAgcmV0dXJuIHJvd3NbMF0gPyBDbGllbnRlLmZyb21EQihyb3dzWzBdKSA6IG51bGw7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzYXZlKGNsaWVudGU6IENsaWVudGUpOiBQcm9taXNlPFJlc3VsdDxDbGllbnRlPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByb3cgPSBhd2FpdCBzdXBhYmFzZVBvc3Q8UmV0dXJuVHlwZTxDbGllbnRlWyd0b0pTT04nXT4+KFxuICAgICAgICAnY2xpZW50ZXMnLFxuICAgICAgICBjbGllbnRlLnRvSlNPTigpXG4gICAgICApO1xuICAgICAgcmV0dXJuIENsaWVudGUuZnJvbURCKHJvdyk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVFbmRlcmVjbyhpZDogbnVtYmVyLCBlbmRlcmVjbzogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8dm9pZD4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc3VwYWJhc2VQYXRjaCgnY2xpZW50ZXMnLCBgaWQ9ZXEuJHtpZH1gLCB7IGVuZGVyZWNvIH0pO1xuICAgIH0pO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vY29yZS9lcnJvcnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEl0ZW1QZWRpZG8ge1xuICByZWFkb25seSBub21lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByZWNvOiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIFN0YXR1c1BlZGlkbyA9ICdwZW5kZW50ZScgfCAnY29uZmlybWFkbycgfCAnY2FuY2VsYWRvJztcbmV4cG9ydCB0eXBlIFRpcG9QYWdhbWVudG8gPSAnUGl4JyB8ICdEaW5oZWlybycgfCAnQ2FydFx1MDBFM28gbmEgRW50cmVnYSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGVkaWRvUHJvcHMge1xuICBpZD86IG51bWJlcjtcbiAgbm9tZTogc3RyaW5nO1xuICB0ZWxlZm9uZTogc3RyaW5nO1xuICBlbmRlcmVjbzogc3RyaW5nO1xuICBwYWdhbWVudG86IFRpcG9QYWdhbWVudG87XG4gIGl0ZW5zOiBJdGVtUGVkaWRvW107XG4gIHRvdGFsOiBudW1iZXI7XG4gIHN0YXR1czogU3RhdHVzUGVkaWRvO1xuICBvYnNlcnZhY2FvPzogc3RyaW5nO1xuICBjbGllbnRlX2lkPzogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUGVkaWRvIHtcbiAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHByb3BzOiBQZWRpZG9Qcm9wcykge31cblxuICBzdGF0aWMgY3JlYXRlKHByb3BzOiBPbWl0PFBlZGlkb1Byb3BzLCAnc3RhdHVzJyB8ICd0b3RhbCc+KTogUGVkaWRvIHtcbiAgICBpZiAoIXByb3BzLml0ZW5zLmxlbmd0aCkgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignUGVkaWRvIGRldmUgdGVyIGFvIG1lbm9zIDEgaXRlbScpO1xuICAgIGlmICghcHJvcHMubm9tZS50cmltKCkpIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ05vbWUgb2JyaWdhdFx1MDBGM3JpbycpO1xuICAgIGlmICghcHJvcHMuZW5kZXJlY28udHJpbSgpKSB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdFbmRlcmVcdTAwRTdvIG9icmlnYXRcdTAwRjNyaW8nKTtcbiAgICBjb25zdCB0b3RhbCA9IHByb3BzLml0ZW5zLnJlZHVjZSgocywgaSkgPT4gTWF0aC5yb3VuZCgocyArIGkucHJlY28pICogMTAwKSAvIDEwMCwgMCk7XG4gICAgcmV0dXJuIG5ldyBQZWRpZG8oeyAuLi5wcm9wcywgdG90YWwsIHN0YXR1czogJ3BlbmRlbnRlJyB9KTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tREIocmF3OiBQZWRpZG9Qcm9wcyk6IFBlZGlkbyB7IHJldHVybiBuZXcgUGVkaWRvKHJhdyk7IH1cblxuICBnZXQgaWQoKTogbnVtYmVyIHwgdW5kZWZpbmVkIHsgcmV0dXJuIHRoaXMucHJvcHMuaWQ7IH1cbiAgZ2V0IHRvdGFsKCk6IG51bWJlciB7IHJldHVybiB0aGlzLnByb3BzLnRvdGFsOyB9XG4gIGdldCBpdGVucygpOiByZWFkb25seSBJdGVtUGVkaWRvW10geyByZXR1cm4gdGhpcy5wcm9wcy5pdGVuczsgfVxuICBnZXQgcGFnYW1lbnRvKCk6IFRpcG9QYWdhbWVudG8geyByZXR1cm4gdGhpcy5wcm9wcy5wYWdhbWVudG87IH1cblxuICB0b0pTT04oKTogUGVkaWRvUHJvcHMgeyByZXR1cm4geyAuLi50aGlzLnByb3BzIH07IH1cbn1cbiIsICJpbXBvcnQgdHlwZSB7IElQZWRpZG9SZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lQZWRpZG9SZXBvc2l0b3J5JztcbmltcG9ydCB7IFBlZGlkbyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuaW1wb3J0IHR5cGUgeyBQZWRpZG9Qcm9wcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9wZWRpZG8nO1xuaW1wb3J0IHsgdHJ5QXN5bmMsIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vLi4vY29yZS9yZXN1bHQnO1xuaW1wb3J0IHsgc3VwYWJhc2VGZXRjaCwgc3VwYWJhc2VQYXRjaCB9IGZyb20gJy4vY2xpZW50JztcbmltcG9ydCB7IE5ldHdvcmtFcnJvciB9IGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL2NvcmUvbG9nZ2VyJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdQZWRpZG9SZXBvJyk7XG5cbmV4cG9ydCBjbGFzcyBQZWRpZG9SZXBvc2l0b3J5IGltcGxlbWVudHMgSVBlZGlkb1JlcG9zaXRvcnkge1xuICBhc3luYyBzYXZlKHBlZGlkbzogUGVkaWRvKTogUHJvbWlzZTxSZXN1bHQ8UGVkaWRvPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBsb2cuaW5mbygnU2FsdmFuZG8gcGVkaWRvJywgeyB0b3RhbDogcGVkaWRvLnRvdGFsIH0pO1xuICAgICAgLy8gVXNhIGhlYWRlcnMtb25seSBwYXJhIG9idGVyIG8gSUQgdmlhIExvY2F0aW9uXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgc3VwYWJhc2VGZXRjaChgL3Jlc3QvdjEvcGVkaWRvc2AsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHsgJ1ByZWZlcic6ICdyZXR1cm49aGVhZGVycy1vbmx5JyB9IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBlZGlkby50b0pTT04oKSksXG4gICAgICB9KTtcbiAgICAgIGlmICghcmVzcC5vaykge1xuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzcC50ZXh0KCk7XG4gICAgICAgIHRocm93IG5ldyBOZXR3b3JrRXJyb3IoYFBPU1QgcGVkaWRvcyBmYWxob3VgLCB7IHN0YXR1czogcmVzcC5zdGF0dXMsIGJvZHkgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBsb2MgPSByZXNwLmhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpID8/ICcnO1xuICAgICAgY29uc3QgaWRNYXRjaCA9IGxvYy5tYXRjaCgvaWQ9ZXFcXC4oXFxkKykvKTtcbiAgICAgIGlmICghaWRNYXRjaCkgdGhyb3cgbmV3IE5ldHdvcmtFcnJvcignSUQgZG8gcGVkaWRvIG5cdTAwRTNvIHJldG9ybmFkbycpO1xuICAgICAgY29uc3QgaWQgPSBwYXJzZUludChpZE1hdGNoWzFdISwgMTApO1xuICAgICAgcmV0dXJuIFBlZGlkby5mcm9tREIoeyAuLi5wZWRpZG8udG9KU09OKCksIGlkIH0gYXMgUGVkaWRvUHJvcHMpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlU3RhdHVzKGlkOiBudW1iZXIsIGNsaWVudGVJZDogbnVtYmVyLCBzdGF0dXM6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PHZvaWQ+PiB7XG4gICAgcmV0dXJuIHRyeUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlUGF0Y2goXG4gICAgICAgICdwZWRpZG9zJyxcbiAgICAgICAgYGlkPWVxLiR7aWR9JmNsaWVudGVfaWQ9ZXEuJHtjbGllbnRlSWR9YCxcbiAgICAgICAgeyBzdGF0dXMgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG59XG4iLCAiaW1wb3J0IHR5cGUgeyBJUm9sZXRhUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL3JlcG9zaXRvcmllcy9JUm9sZXRhUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IFBhcnRpY2lwYWNhb1Byb3BzIH0gZnJvbSAnLi4vLi4vZG9tYWluL3JvbGV0YSc7XG5pbXBvcnQgeyB0cnlBc3luYywgdHlwZSBSZXN1bHQgfSBmcm9tICcuLi8uLi9jb3JlL3Jlc3VsdCc7XG5pbXBvcnQgeyBzdXBhYmFzZUdldCwgc3VwYWJhc2VQb3N0LCBzdXBhYmFzZVBhdGNoIH0gZnJvbSAnLi9jbGllbnQnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vY29yZS9sb2dnZXInO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ1JvbGV0YVJlcG8nKTtcblxuZXhwb3J0IGNsYXNzIFJvbGV0YVJlcG9zaXRvcnkgaW1wbGVtZW50cyBJUm9sZXRhUmVwb3NpdG9yeSB7XG4gIGFzeW5jIGZpbmRQYXJ0aWNpcGFjYW9BdGl2YShcbiAgICB0ZWxlZm9uZTogc3RyaW5nLFxuICAgIHNlbWFuYTogc3RyaW5nXG4gICk6IFByb21pc2U8UmVzdWx0PFBhcnRpY2lwYWNhb1Byb3BzIHwgbnVsbD4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgbG9nLmRlYnVnKCdmaW5kUGFydGljaXBhY2FvQXRpdmEnLCB7IHNlbWFuYSB9KTtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBzdXBhYmFzZUdldDxQYXJ0aWNpcGFjYW9Qcm9wcz4oXG4gICAgICAgICdyb2xldGFfcGFydGljaXBhY29lcycsXG4gICAgICAgIGB0ZWxlZm9uZT1lcS4ke3RlbGVmb25lfSZzZW1hbmE9ZXEuJHtzZW1hbmF9Jm9yZGVyPWNyZWF0ZWRfYXQuZGVzYyZsaW1pdD0xYFxuICAgICAgKTtcbiAgICAgIHJldHVybiByb3dzWzBdID8/IG51bGw7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzYXZlUGFydGljaXBhY2FvKFxuICAgIGRhdGE6IFBhcnRpYWw8UGFydGljaXBhY2FvUHJvcHM+XG4gICk6IFByb21pc2U8UmVzdWx0PFBhcnRpY2lwYWNhb1Byb3BzPj4ge1xuICAgIC8vIFNlIHRlbSBpZCwgZmF6IFBBVENIOyBzZW5cdTAwRTNvIElOU0VSVFxuICAgIGlmIChkYXRhLmlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgaWQsIC4uLnBhdGNoIH0gPSBkYXRhO1xuICAgICAgICBjb25zdCByb3dzID0gYXdhaXQgc3VwYWJhc2VQYXRjaDxQYXJ0aWNpcGFjYW9Qcm9wcz4oXG4gICAgICAgICAgJ3JvbGV0YV9wYXJ0aWNpcGFjb2VzJyxcbiAgICAgICAgICBgaWQ9ZXEuJHtpZH1gLFxuICAgICAgICAgIHBhdGNoXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiAocm93c1swXSA/PyB7IC4uLmRhdGEgfSkgYXMgUGFydGljaXBhY2FvUHJvcHM7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRyeUFzeW5jKCgpID0+XG4gICAgICBzdXBhYmFzZVBvc3Q8UGFydGljaXBhY2FvUHJvcHM+KCdyb2xldGFfcGFydGljaXBhY29lcycsIGRhdGEpXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGNvdW50VmVuY2Vkb3Jlc1NlbWFuYShzZW1hbmE6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PG51bWJlcj4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHN1cGFiYXNlR2V0PHsgaWQ6IG51bWJlciB9PihcbiAgICAgICAgJ3JvbGV0YV92ZW5jZWRvcmVzJyxcbiAgICAgICAgYHNlbWFuYT1lcS4ke3NlbWFuYX0mc2VsZWN0PWlkYFxuICAgICAgKTtcbiAgICAgIHJldHVybiByb3dzLmxlbmd0aDtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVWZW5jZWRvcihcbiAgICB0ZWxlZm9uZTogc3RyaW5nLFxuICAgIG5vbWU6IHN0cmluZyxcbiAgICBwcmVtaW86IHN0cmluZyxcbiAgICBzZW1hbmE6IHN0cmluZ1xuICApOiBQcm9taXNlPFJlc3VsdDx2b2lkPj4ge1xuICAgIHJldHVybiB0cnlBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzdXBhYmFzZVBvc3QoJ3JvbGV0YV92ZW5jZWRvcmVzJywgeyB0ZWxlZm9uZSwgbm9tZSwgcHJlbWlvLCBzZW1hbmEgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsICJ0eXBlIFNlbGVjdG9yPFMsIFQ+ID0gKHN0YXRlOiBTKSA9PiBUO1xudHlwZSBMaXN0ZW5lcjxUPiA9ICh2YWx1ZTogVCkgPT4gdm9pZDtcblxuZXhwb3J0IGNsYXNzIFN0b3JlPFMgZXh0ZW5kcyBvYmplY3Q+IHtcbiAgcHJpdmF0ZSBzdGF0ZTogUztcbiAgcHJpdmF0ZSBnbG9iYWxMaXN0ZW5lcnMgPSBuZXcgU2V0PExpc3RlbmVyPFM+PigpO1xuXG4gIGNvbnN0cnVjdG9yKGluaXRpYWxTdGF0ZTogUykge1xuICAgIHRoaXMuc3RhdGUgPSB7IC4uLmluaXRpYWxTdGF0ZSB9O1xuICB9XG5cbiAgZ2V0U3RhdGUoKTogUmVhZG9ubHk8Uz4ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlO1xuICB9XG5cbiAgc2V0U3RhdGUodXBkYXRlcjogUGFydGlhbDxTPiB8ICgoczogUmVhZG9ubHk8Uz4pID0+IFBhcnRpYWw8Uz4pKTogdm9pZCB7XG4gICAgY29uc3QgcGF0Y2ggPSB0eXBlb2YgdXBkYXRlciA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgPyB1cGRhdGVyKHRoaXMuc3RhdGUpXG4gICAgICA6IHVwZGF0ZXI7XG4gICAgdGhpcy5zdGF0ZSA9IHsgLi4udGhpcy5zdGF0ZSwgLi4ucGF0Y2ggfTtcbiAgICB0aGlzLmdsb2JhbExpc3RlbmVycy5mb3JFYWNoKGwgPT4gbCh0aGlzLnN0YXRlKSk7XG4gIH1cblxuICBzdWJzY3JpYmUobGlzdGVuZXI6IExpc3RlbmVyPFM+KTogKCkgPT4gdm9pZCB7XG4gICAgdGhpcy5nbG9iYWxMaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5nbG9iYWxMaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfVxuXG4gIHNlbGVjdDxUPihzZWxlY3RvcjogU2VsZWN0b3I8UywgVD4sIGxpc3RlbmVyOiBMaXN0ZW5lcjxUPik6ICgpID0+IHZvaWQge1xuICAgIGxldCBwcmV2ID0gc2VsZWN0b3IodGhpcy5zdGF0ZSk7XG4gICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlKHN0YXRlID0+IHtcbiAgICAgIGNvbnN0IG5leHQgPSBzZWxlY3RvcihzdGF0ZSk7XG4gICAgICBpZiAobmV4dCAhPT0gcHJldikge1xuICAgICAgICBwcmV2ID0gbmV4dDtcbiAgICAgICAgbGlzdGVuZXIobmV4dCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBTdG9yZSB9IGZyb20gJy4vU3RvcmUnO1xuaW1wb3J0IHR5cGUgeyBDbGllbnRlIH0gZnJvbSAnLi4vZG9tYWluL2NsaWVudGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFwcFN0YXRlIHtcbiAgcmVhZG9ubHkgY2xpZW50ZTogQ2xpZW50ZSB8IG51bGw7XG4gIHJlYWRvbmx5IGlzTG9nZ2VkSW46IGJvb2xlYW47XG4gIHJlYWRvbmx5IGlzQWRtaW46IGJvb2xlYW47XG4gIHJlYWRvbmx5IGNhcnJpbmhvQ291bnQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgY2FycmluaG9Ub3RhbDogbnVtYmVyO1xuICByZWFkb25seSBwYWdhbWVudG9TZWxlY2lvbmFkbzogc3RyaW5nO1xuICByZWFkb25seSBwZWRpZG9JZFBlbmRlbnRlOiBudW1iZXIgfCBudWxsO1xufVxuXG5jb25zdCBBRE1JTl9URUwgPSBhdG9iKCdNVEU1TkRBM056STNOVEE9Jyk7XG5jb25zdCBDT05UQV9URVNURSA9IGF0b2IoJ01URTVOalV3TXpBd056WT0nKTtcblxuZnVuY3Rpb24gY2FsY0lzQWRtaW4oY2xpZW50ZTogQ2xpZW50ZSB8IG51bGwpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhY2xpZW50ZSAmJiBjbGllbnRlLnRlbGVmb25lID09PSBBRE1JTl9URUw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRhVGVzdGUoY2xpZW50ZTogQ2xpZW50ZSB8IG51bGwpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhY2xpZW50ZSAmJiBjbGllbnRlLnRlbGVmb25lID09PSBDT05UQV9URVNURTtcbn1cblxuZXhwb3J0IGNvbnN0IGFwcFN0b3JlID0gbmV3IFN0b3JlPEFwcFN0YXRlPih7XG4gIGNsaWVudGU6IG51bGwsXG4gIGlzTG9nZ2VkSW46IGZhbHNlLFxuICBpc0FkbWluOiBmYWxzZSxcbiAgY2FycmluaG9Db3VudDogMCxcbiAgY2FycmluaG9Ub3RhbDogMCxcbiAgcGFnYW1lbnRvU2VsZWNpb25hZG86ICcnLFxuICBwZWRpZG9JZFBlbmRlbnRlOiBudWxsLFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDbGllbnRlKGNsaWVudGU6IENsaWVudGUgfCBudWxsKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHtcbiAgICBjbGllbnRlLFxuICAgIGlzTG9nZ2VkSW46ICEhY2xpZW50ZSxcbiAgICBpc0FkbWluOiBjYWxjSXNBZG1pbihjbGllbnRlKSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDYXJyaW5obyhjb3VudDogbnVtYmVyLCB0b3RhbDogbnVtYmVyKTogdm9pZCB7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgY2FycmluaG9Db3VudDogY291bnQsIGNhcnJpbmhvVG90YWw6IHRvdGFsIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UGFnYW1lbnRvKHRpcG86IHN0cmluZyk6IHZvaWQge1xuICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBhZ2FtZW50b1NlbGVjaW9uYWRvOiB0aXBvIH0pO1xufVxuIiwgImltcG9ydCB0eXBlIHsgSUNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcmVwb3NpdG9yaWVzL0lDbGllbnRlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBDbGllbnRlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2NsaWVudGUnO1xuaW1wb3J0IHsgdHlwZSBSZXN1bHQsIG9rLCBmYWlsLCB0cnlBc3luYyB9IGZyb20gJy4uLy4uL2NvcmUvcmVzdWx0JztcbmltcG9ydCB7IFJhdGVMaW1pdEVycm9yLCBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi9jb3JlL2Vycm9ycyc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi8uLi9jb3JlL2xvZ2dlcic7XG5pbXBvcnQgeyBzZXRDbGllbnRlIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RvcmUnO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuY2hpbGQoJ0xvZ2luVXNlQ2FzZScpO1xuXG5jb25zdCBTRVNTSU9OX0tFWSA9ICdnZWxhbW91cl9jbGllbnRlJztcbmNvbnN0IFNFU1NJT05fVFNfS0VZID0gJ2dlbGFtb3VyX3RzJztcbmNvbnN0IFNFU1NJT05fVFRMX01TID0gMjQgKiA2MCAqIDYwICogMTAwMDtcblxuaW50ZXJmYWNlIFJhdGVMaW1pdGVyIHtcbiAgYXR0ZW1wdHM6IG51bWJlcjtcbiAgYmxvY2tlZFVudGlsOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBMb2dpblVzZUNhc2Uge1xuICBwcml2YXRlIHJhdGVMaW1pdGVyOiBSYXRlTGltaXRlciA9IHsgYXR0ZW1wdHM6IDAsIGJsb2NrZWRVbnRpbDogMCB9O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgY2xpZW50ZVJlcG86IElDbGllbnRlUmVwb3NpdG9yeSkge31cblxuICByZXN0b3JlU2Vzc2lvbigpOiBDbGllbnRlIHwgbnVsbCB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRzID0gTnVtYmVyKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oU0VTU0lPTl9UU19LRVkpID8/ICcwJyk7XG4gICAgICBpZiAoRGF0ZS5ub3coKSAtIHRzID4gU0VTU0lPTl9UVExfTVMpIHtcbiAgICAgICAgdGhpcy5jbGVhclNlc3Npb24oKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCByYXcgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFNFU1NJT05fS0VZKTtcbiAgICAgIGlmICghcmF3KSByZXR1cm4gbnVsbDtcbiAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJhdykgYXMgUmV0dXJuVHlwZTxDbGllbnRlWyd0b0pTT04nXT47XG4gICAgICBjb25zdCBjbGllbnRlID0gQ2xpZW50ZS5mcm9tREIoZGF0YSk7XG4gICAgICBzZXRDbGllbnRlKGNsaWVudGUpO1xuICAgICAgcmV0dXJuIGNsaWVudGU7XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aGlzLmNsZWFyU2Vzc2lvbigpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZSh0ZWxlZm9uZTogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8eyBleGlzdGU6IGJvb2xlYW47IGNsaWVudGU/OiBDbGllbnRlIH0+PiB7XG4gICAgaWYgKERhdGUubm93KCkgPCB0aGlzLnJhdGVMaW1pdGVyLmJsb2NrZWRVbnRpbCkge1xuICAgICAgcmV0dXJuIGZhaWwobmV3IFJhdGVMaW1pdEVycm9yKHRoaXMucmF0ZUxpbWl0ZXIuYmxvY2tlZFVudGlsIC0gRGF0ZS5ub3coKSkpO1xuICAgIH1cblxuICAgIGNvbnN0IHRlbCA9IHRlbGVmb25lLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgaWYgKHRlbC5sZW5ndGggPCAxMCkgcmV0dXJuIGZhaWwobmV3IFZhbGlkYXRpb25FcnJvcignVGVsZWZvbmUgaW52XHUwMEUxbGlkbycpKTtcblxuICAgIGxvZy5pbmZvKCdWZXJpZmljYW5kbyB0ZWxlZm9uZScsIHsgdGVsOiBgKioqJHt0ZWwuc2xpY2UoLTQpfWAgfSk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jbGllbnRlUmVwby5maW5kQnlUZWxlZm9uZSh0ZWwpO1xuXG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIC8vIE5ldHdvcmtFcnJvciA9IHNlcnZpZG9yIGluZGlzcG9uXHUwMEVEdmVsLCBuXHUwMEUzbyB0ZW50YXRpdmEgaW52XHUwMEUxbGlkYSBcdTIwMTQgblx1MDBFM28gcGVuYWxpemFcbiAgICAgIGlmIChyZXN1bHQuZXJyb3IubmFtZSAhPT0gJ05ldHdvcmtFcnJvcicpIHtcbiAgICAgICAgdGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cysrO1xuICAgICAgICBpZiAodGhpcy5yYXRlTGltaXRlci5hdHRlbXB0cyA+PSA1KSB7XG4gICAgICAgICAgdGhpcy5yYXRlTGltaXRlci5ibG9ja2VkVW50aWwgPSBEYXRlLm5vdygpICsgNjBfMDAwO1xuICAgICAgICAgIHRoaXMucmF0ZUxpbWl0ZXIuYXR0ZW1wdHMgPSAwO1xuICAgICAgICAgIHJldHVybiBmYWlsKG5ldyBSYXRlTGltaXRFcnJvcig2MF8wMDApKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhaWwocmVzdWx0LmVycm9yKTtcbiAgICB9XG5cbiAgICB0aGlzLnJhdGVMaW1pdGVyLmF0dGVtcHRzID0gMDtcbiAgICByZXR1cm4gb2soeyBleGlzdGU6ICEhcmVzdWx0LnZhbHVlLCBjbGllbnRlOiByZXN1bHQudmFsdWUgPz8gdW5kZWZpbmVkIH0pO1xuICB9XG5cbiAgYXN5bmMgcmVnaXN0ZXIobm9tZTogc3RyaW5nLCB0ZWxlZm9uZTogc3RyaW5nLCBlbmRlcmVjbzogc3RyaW5nKTogUHJvbWlzZTxSZXN1bHQ8Q2xpZW50ZT4+IHtcbiAgICByZXR1cm4gdHJ5QXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZW50aXR5ID0gQ2xpZW50ZS5jcmVhdGUoeyBub21lLCB0ZWxlZm9uZSwgZW5kZXJlY28gfSk7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHRoaXMuY2xpZW50ZVJlcG8uc2F2ZShlbnRpdHkpO1xuICAgICAgaWYgKCFzYXZlZC5vaykgdGhyb3cgc2F2ZWQuZXJyb3I7XG4gICAgICByZXR1cm4gc2F2ZWQudmFsdWU7XG4gICAgfSk7XG4gIH1cblxuICBsb2dpbihjbGllbnRlOiBDbGllbnRlKTogdm9pZCB7XG4gICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShTRVNTSU9OX0tFWSwgSlNPTi5zdHJpbmdpZnkoY2xpZW50ZS50b0pTT04oKSkpO1xuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oU0VTU0lPTl9UU19LRVksIFN0cmluZyhEYXRlLm5vdygpKSk7XG4gICAgc2V0Q2xpZW50ZShjbGllbnRlKTtcbiAgICBsb2cuaW5mbygnTG9naW4gcmVhbGl6YWRvJywgeyBpZDogY2xpZW50ZS5pZCB9KTtcbiAgfVxuXG4gIGxvZ291dCgpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFyU2Vzc2lvbigpO1xuICAgIHNldENsaWVudGUobnVsbCk7XG4gICAgbG9nLmluZm8oJ0xvZ291dCByZWFsaXphZG8nKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJTZXNzaW9uKCk6IHZvaWQge1xuICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oU0VTU0lPTl9LRVkpO1xuICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oU0VTU0lPTl9UU19LRVkpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgc2V0Q2FycmluaG8gfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdG9yZSc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi8uLi9jb3JlL2xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IEl0ZW1QZWRpZG8gfSBmcm9tICcuLi8uLi9kb21haW4vcGVkaWRvJztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdDYXJ0U2VydmljZScpO1xuXG5leHBvcnQgY2xhc3MgQ2FydFNlcnZpY2Uge1xuICBwcml2YXRlIGl0ZW1zID0gbmV3IE1hcDxzdHJpbmcsIEl0ZW1QZWRpZG8+KCk7XG5cbiAgYWRkKG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xuICAgIGlmICh0aGlzLml0ZW1zLmhhcyhub21lKSkgcmV0dXJuO1xuICAgIHRoaXMuaXRlbXMuc2V0KG5vbWUsIHsgbm9tZSwgcHJlY286IE51bWJlcihwcmVjbykgfSk7XG4gICAgdGhpcy5ub3RpZnkoKTtcbiAgICBsb2cuZGVidWcoJ0l0ZW0gYWRpY2lvbmFkbycsIHsgbm9tZSB9KTtcbiAgfVxuXG4gIHJlbW92ZShub21lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaXRlbXMuaGFzKG5vbWUpKSByZXR1cm47XG4gICAgdGhpcy5pdGVtcy5kZWxldGUobm9tZSk7XG4gICAgdGhpcy5ub3RpZnkoKTtcbiAgICBsb2cuZGVidWcoJ0l0ZW0gcmVtb3ZpZG8nLCB7IG5vbWUgfSk7XG4gIH1cblxuICB0b2dnbGUobm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogJ2FkZGVkJyB8ICdyZW1vdmVkJyB7XG4gICAgaWYgKHRoaXMuaXRlbXMuaGFzKG5vbWUpKSB7XG4gICAgICB0aGlzLnJlbW92ZShub21lKTtcbiAgICAgIHJldHVybiAncmVtb3ZlZCc7XG4gICAgfVxuICAgIHRoaXMuYWRkKG5vbWUsIHByZWNvKTtcbiAgICByZXR1cm4gJ2FkZGVkJztcbiAgfVxuXG4gIGNsZWFyKCk6IHZvaWQge1xuICAgIHRoaXMuaXRlbXMuY2xlYXIoKTtcbiAgICB0aGlzLm5vdGlmeSgpO1xuICB9XG5cbiAgZ2V0SXRlbXMoKTogcmVhZG9ubHkgSXRlbVBlZGlkb1tdIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLml0ZW1zLnZhbHVlcygpKTtcbiAgfVxuXG4gIGdldFRvdGFsKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5pdGVtcy52YWx1ZXMoKSlcbiAgICAgIC5yZWR1Y2UoKHN1bSwgaSkgPT4gTWF0aC5yb3VuZCgoc3VtICsgaS5wcmVjbykgKiAxMDApIC8gMTAwLCAwKTtcbiAgfVxuXG4gIGdldENvdW50KCk6IG51bWJlciB7IHJldHVybiB0aGlzLml0ZW1zLnNpemU7IH1cblxuICBoYXMobm9tZTogc3RyaW5nKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLml0ZW1zLmhhcyhub21lKTsgfVxuXG4gIGlzRW1wdHkoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLml0ZW1zLnNpemUgPT09IDA7IH1cblxuICByZXZhbGlkYXRlUHJpY2VzKHByaWNlTWFwOiBNYXA8c3RyaW5nLCBudW1iZXI+KTogdm9pZCB7XG4gICAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgICB0aGlzLml0ZW1zLmZvckVhY2goKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgY29uc3QgcmVhbFByaWNlID0gcHJpY2VNYXAuZ2V0KGtleSk7XG4gICAgICBpZiAocmVhbFByaWNlICE9PSB1bmRlZmluZWQgJiYgcmVhbFByaWNlICE9PSBpdGVtLnByZWNvKSB7XG4gICAgICAgIHRoaXMuaXRlbXMuc2V0KGtleSwgeyAuLi5pdGVtLCBwcmVjbzogcmVhbFByaWNlIH0pO1xuICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgbG9nLndhcm4oJ1ByZVx1MDBFN28gcmV2YWxpZGFkbycsIHsgbm9tZToga2V5LCBvbGQ6IGl0ZW0ucHJlY28sIG5ldzogcmVhbFByaWNlIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChjaGFuZ2VkKSB0aGlzLm5vdGlmeSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3RpZnkoKTogdm9pZCB7XG4gICAgc2V0Q2FycmluaG8odGhpcy5nZXRDb3VudCgpLCB0aGlzLmdldFRvdGFsKCkpO1xuICB9XG59XG4iLCAiLy8gQ29tcG9zaXRpb24gUm9vdCBcdTIwMTQgaW5zdGFuY2lhIGUgaW5qZXRhIGRlcGVuZFx1MDBFQW5jaWFzXG5pbXBvcnQgeyBDbGllbnRlUmVwb3NpdG9yeSB9IGZyb20gJy4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvQ2xpZW50ZVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgUGVkaWRvUmVwb3NpdG9yeSB9IGZyb20gJy4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvUGVkaWRvUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBSb2xldGFSZXBvc2l0b3J5IH0gZnJvbSAnLi9pbmZyYXN0cnVjdHVyZS9zdXBhYmFzZS9Sb2xldGFSZXBvc2l0b3J5JztcbmltcG9ydCB7IExvZ2luVXNlQ2FzZSB9IGZyb20gJy4vYXBwbGljYXRpb24vYXV0aC9Mb2dpblVzZUNhc2UnO1xuaW1wb3J0IHsgQ2FydFNlcnZpY2UgfSBmcm9tICcuL2FwcGxpY2F0aW9uL2NhcnQvQ2FydFNlcnZpY2UnO1xuXG5jb25zdCBjbGllbnRlUmVwb3NpdG9yeSA9IG5ldyBDbGllbnRlUmVwb3NpdG9yeSgpO1xuY29uc3QgcGVkaWRvUmVwb3NpdG9yeSA9IG5ldyBQZWRpZG9SZXBvc2l0b3J5KCk7XG5jb25zdCByb2xldGFSZXBvc2l0b3J5ID0gbmV3IFJvbGV0YVJlcG9zaXRvcnkoKTtcblxuZXhwb3J0IGNvbnN0IGxvZ2luVXNlQ2FzZSA9IG5ldyBMb2dpblVzZUNhc2UoY2xpZW50ZVJlcG9zaXRvcnkpO1xuZXhwb3J0IGNvbnN0IGNhcnRTZXJ2aWNlID0gbmV3IENhcnRTZXJ2aWNlKCk7XG5cbmV4cG9ydCB7IGNsaWVudGVSZXBvc2l0b3J5LCBwZWRpZG9SZXBvc2l0b3J5LCByb2xldGFSZXBvc2l0b3J5IH07XG4iLCAiaW1wb3J0IHR5cGUgeyBSb2xldGFDb25maWcgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyByb2xldGFSZXBvc2l0b3J5IH0gZnJvbSAnLi4vY29udGFpbmVyJztcbmltcG9ydCB7IHN1cGFiYXNlR2V0IH0gZnJvbSAnLi4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvY2xpZW50JztcbmltcG9ydCB7IGdldFNlbWFuYUF0dWFsIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGVzY0hUTUwgfSBmcm9tICcuLi91dGlscy9zZWN1cml0eSc7XG5pbXBvcnQgeyBtb3N0cmFyVG9hc3QgfSBmcm9tICcuLi91dGlscy90b2FzdCc7XG5pbXBvcnQgeyBpc0NvbnRhVGVzdGUgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdG9yZSc7XG5pbXBvcnQgeyBhcHBTdG9yZSB9IGZyb20gJy4uL3N0YXRlL0FwcFN0b3JlJztcbmltcG9ydCB0eXBlIHsgQ2xpZW50ZSB9IGZyb20gJy4uL3R5cGVzJztcblxuY29uc3QgUFJFTUlPU19QQURSQU86IHN0cmluZ1tdID0gW1xuICAnXHVEODNDXHVERjgxIDUlIE9GRiBcdTIwMTQgQ29tcHJhcyBhY2ltYSBkZSBSJDM1JyxcbiAgJ1x1RDgzQ1x1REY2QiBCcm93bmllIFRyYWRpY2lvbmFsIEdyXHUwMEUxdGlzIFx1MjAxNCBDb21wcmFzIGFjaW1hIGRlIFIkNTAnLFxuICAnXHVEODNDXHVERjgxIDEwJSBPRkYgXHUyMDE0IENvbXByYXMgYWNpbWEgZGUgUiQ1MCcsXG4gICdcdUQ4M0RcdURDRjggU2lnYSBhIEdlbGFtb3VyIG5vIEluc3RhZ3JhbScsXG4gICdcdUQ4M0RcdURFQ0RcdUZFMEYgQ29tcHJlIDIgZSBMZXZlIFx1MjAxNCBBdFx1MDBFOSBSJDE0IGVtIHByb2R1dG9zJyxcbiAgJ1x1RDgzRFx1REUxNSBOXHUwMEUzbyBGb2kgRGVzc2EgVmV6IFx1MjAxNCBHYW5oYSA1JSBPRkYgYWNpbWEgZGUgUiQzNScsXG5dO1xuXG5sZXQgX3ByZW1pb3M6IHN0cmluZ1tdID0gWy4uLlBSRU1JT1NfUEFEUkFPXTtcbmxldCBfcm90YWNhb0F0dWFsID0gMDtcbmxldCBfZ2lyYW5kbyA9IGZhbHNlO1xubGV0IF9wYXJ0aWNpcGFjYW9JZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmVtaW9zUGFkcmFvKCk6IHN0cmluZ1tdIHsgcmV0dXJuIFBSRU1JT1NfUEFEUkFPOyB9XG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJlbWlvcygpOiBzdHJpbmdbXSB7IHJldHVybiBfcHJlbWlvczsgfVxuZXhwb3J0IGZ1bmN0aW9uIHNldFByZW1pb3MocDogc3RyaW5nW10pOiB2b2lkIHsgX3ByZW1pb3MgPSBwOyB9XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFydGljaXBhY2FvSWQoKTogbnVtYmVyIHwgbnVsbCB7IHJldHVybiBfcGFydGljaXBhY2FvSWQ7IH1cbmV4cG9ydCBmdW5jdGlvbiBzZXRQYXJ0aWNpcGFjYW9JZChpZDogbnVtYmVyIHwgbnVsbCk6IHZvaWQgeyBfcGFydGljaXBhY2FvSWQgPSBpZDsgfVxuZXhwb3J0IGZ1bmN0aW9uIGlzR2lyYW5kbygpOiBib29sZWFuIHsgcmV0dXJuIF9naXJhbmRvOyB9XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYXJyZWdhckNvbmZpZygpOiBQcm9taXNlPFJvbGV0YUNvbmZpZyB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByb3dzID0gYXdhaXQgc3VwYWJhc2VHZXQ8Um9sZXRhQ29uZmlnPigncm9sZXRhX2NvbmZpZycsICdpZD1lcS4xJmxpbWl0PTEnKTtcbiAgICBpZiAocm93c1swXSkge1xuICAgICAgX3ByZW1pb3MgPSBBcnJheS5pc0FycmF5KHJvd3NbMF0ucHJlbWlvcykgPyByb3dzWzBdLnByZW1pb3MgOiBQUkVNSU9TX1BBRFJBTztcbiAgICB9XG4gICAgcmV0dXJuIHJvd3NbMF0gPz8gbnVsbDtcbiAgfSBjYXRjaCB7IHJldHVybiBudWxsOyB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJTdGF0dXMoY2xpZW50ZUlkOiBudW1iZXIpOiBQcm9taXNlPGltcG9ydCgnLi4vZG9tYWluL3JvbGV0YScpLlBhcnRpY2lwYWNhb1Byb3BzIHwgbnVsbD4ge1xuICBjb25zdCBzZW1hbmEgPSBnZXRTZW1hbmFBdHVhbCgpO1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCByb2xldGFSZXBvc2l0b3J5LmZpbmRQYXJ0aWNpcGFjYW9BdGl2YShTdHJpbmcoY2xpZW50ZUlkKSwgc2VtYW5hKTtcbiAgaWYgKCFyZXN1bHQub2spIHJldHVybiBudWxsO1xuICBpZiAocmVzdWx0LnZhbHVlKSBfcGFydGljaXBhY2FvSWQgPSByZXN1bHQudmFsdWUuaWQ7XG4gIHJldHVybiByZXN1bHQudmFsdWU7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnaXJhcihcbiAgX2NsaWVudGU6IENsaWVudGUsXG4gIG9uUmVzdWx0YWRvOiAocHJlbWlvOiBzdHJpbmcsIGluZGljZTogbnVtYmVyKSA9PiB2b2lkXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKF9naXJhbmRvKSByZXR1cm47XG5cbiAgY29uc3Qgc3RhdGUgPSBhcHBTdG9yZS5nZXRTdGF0ZSgpO1xuICBpZiAoIWlzQ29udGFUZXN0ZShzdGF0ZS5jbGllbnRlKSkge1xuICAgIG1vc3RyYXJUb2FzdCgnXHVEODNEXHVERUE3IFJvbGV0YSBlbSBicmV2ZSEgRXN0YW1vcyBmaW5hbGl6YW5kbyBvcyBcdTAwRkFsdGltb3MgZGV0YWxoZXMuIFx1RDgzQ1x1REZBMScsICdpbmZvJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgX2dpcmFuZG8gPSB0cnVlO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGlmIChidG4pIHsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnRleHRDb250ZW50ID0gJ0dpcmFuZG8uLi4nOyB9XG5cbiAgY29uc3QgbiA9IF9wcmVtaW9zLmxlbmd0aDtcbiAgY29uc3QgYXJjID0gMzYwIC8gbjtcbiAgY29uc3QgaW5kaWNlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbik7XG4gIGNvbnN0IHZvbHRhc0V4dHJhcyA9IDUgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1KTtcbiAgY29uc3QgYW5ndWxvQWx2byA9IHZvbHRhc0V4dHJhcyAqIDM2MCArICgzNjAgLSBhcmMgKiBpbmRpY2UgLSBhcmMgLyAyKTtcbiAgY29uc3Qgcm90YWNhb0ZpbmFsID0gX3JvdGFjYW9BdHVhbCArIGFuZ3Vsb0Fsdm87XG5cbiAgY29uc3Qgcm9kYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFSb2RhJyk7XG4gIGlmIChyb2RhKSB7XG4gICAgcm9kYS5zdHlsZS50cmFuc2l0aW9uID0gJ3RyYW5zZm9ybSA0cyBjdWJpYy1iZXppZXIoMC4xNywgMC42NywgMC4xMiwgMSknO1xuICAgIHJvZGEuc3R5bGUudHJhbnNmb3JtT3JpZ2luID0gJzIwMHB4IDIwMHB4JztcbiAgICByb2RhLnN0eWxlLnRyYW5zZm9ybSA9IGByb3RhdGUoJHtyb3RhY2FvRmluYWx9ZGVnKWA7XG4gIH1cblxuICBfcm90YWNhb0F0dWFsID0gKChyb3RhY2FvRmluYWwgJSAzNjApICsgMzYwKSAlIDM2MDtcblxuICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNDIwMCkpO1xuXG4gIGNvbnN0IHByZW1pbyA9IF9wcmVtaW9zW2luZGljZV0hO1xuICBfZ2lyYW5kbyA9IGZhbHNlO1xuXG4gIG9uUmVzdWx0YWRvKHByZW1pbywgaW5kaWNlKTtcblxuICBpZiAoaXNDb250YVRlc3RlKHN0YXRlLmNsaWVudGUpICYmIGJ0bikge1xuICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIGJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGQTEgR0lSQVIgQUdPUkEhJztcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2FsdmFyVmVuY2Vkb3IoY2xpZW50ZTogQ2xpZW50ZSwgcHJlbWlvOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKGlzQ29udGFUZXN0ZShhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUpKSByZXR1cm47XG4gIGlmICghX3BhcnRpY2lwYWNhb0lkKSByZXR1cm47XG5cbiAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcblxuICBjb25zdCBwYXRjaFJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuc2F2ZVBhcnRpY2lwYWNhbyh7XG4gICAgaWQ6IF9wYXJ0aWNpcGFjYW9JZCxcbiAgICBqYV9naXJvdTogdHJ1ZSxcbiAgICBwcmVtaW8sXG4gIH0gYXMgaW1wb3J0KCcuLi9kb21haW4vcm9sZXRhJykuUGFydGljaXBhY2FvUHJvcHMpO1xuXG4gIGlmICghcGF0Y2hSZXN1bHQub2spIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvIGFvIGF0dWFsaXphciBwYXJ0aWNpcGFcdTAwRTdcdTAwRTNvOicsIHBhdGNoUmVzdWx0LmVycm9yKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB2ZW5jZWRvclJlc3VsdCA9IGF3YWl0IHJvbGV0YVJlcG9zaXRvcnkuc2F2ZVZlbmNlZG9yKFxuICAgIGNsaWVudGUudGVsZWZvbmUsXG4gICAgY2xpZW50ZS5ub21lLFxuICAgIHByZW1pbyxcbiAgICBzZW1hbmFcbiAgKTtcblxuICBpZiAoIXZlbmNlZG9yUmVzdWx0Lm9rKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJybyBhbyBzYWx2YXIgdmVuY2Vkb3I6JywgdmVuY2Vkb3JSZXN1bHQuZXJyb3IpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXNlbmhhclJvbGV0YShwcmVtaW9zOiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCB3cmFwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJvbGV0YS1wb2ludGVyLXdyYXAnKTtcbiAgaWYgKCF3cmFwKSByZXR1cm47XG4gIGNvbnN0IG9sZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFDYW52YXMnKTtcbiAgaWYgKG9sZCkgb2xkLnJlbW92ZSgpO1xuXG4gIGNvbnN0IE4gPSBwcmVtaW9zLmxlbmd0aDtcbiAgY29uc3QgQ1ggPSAyMDAsIENZID0gMjAwLCBSID0gMTY0LCBSX0xFRCA9IDE4MiwgUl9PVVRFUiA9IDE5NjtcbiAgY29uc3QgU0VHID0gMzYwIC8gTjtcbiAgY29uc3QgQ09SRVMgPSBbXG4gICAgeyBiZzogJyNGQUYwRjInLCB0eHQ6ICcjQjUxMzRGJyB9LFxuICAgIHsgYmc6ICcjRTg1MjhBJywgdHh0OiAnI0ZGRkZGRicgfSxcbiAgXSBhcyBjb25zdDtcblxuICBjb25zdCByYWQgPSAoZDogbnVtYmVyKTogbnVtYmVyID0+IGQgKiBNYXRoLlBJIC8gMTgwO1xuICBjb25zdCBwdCA9IChkOiBudW1iZXIsIHI6IG51bWJlcik6IFtudW1iZXIsIG51bWJlcl0gPT4gW0NYICsgciAqIE1hdGguY29zKHJhZChkKSksIENZICsgciAqIE1hdGguc2luKHJhZChkKSldO1xuICBjb25zdCBlc2MgPSAoczogc3RyaW5nKTogc3RyaW5nID0+IHMucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xuXG4gIGZ1bmN0aW9uIHNlZ1BhdGgoaTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBjb25zdCBzID0gU0VHICogaSAtIDkwLCBlID0gcyArIFNFRztcbiAgICBjb25zdCBbeDEsIHkxXSA9IHB0KHMsIFIpLCBbeDIsIHkyXSA9IHB0KGUsIFIpO1xuICAgIHJldHVybiBgTSR7Q1h9LCR7Q1l9IEwke3gxLnRvRml4ZWQoMil9LCR7eTEudG9GaXhlZCgyKX0gQSR7Un0sJHtSfSAwIDAsMSAke3gyLnRvRml4ZWQoMil9LCR7eTIudG9GaXhlZCgyKX0gWmA7XG4gIH1cblxuICBmdW5jdGlvbiB3cmFwV29yZHModGV4dDogc3RyaW5nLCBtYXhDaGFyczogbnVtYmVyKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHdvcmRzID0gdGV4dC5zcGxpdCgnICcpO1xuICAgIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBjdXIgPSAnJztcbiAgICB3b3Jkcy5mb3JFYWNoKHcgPT4ge1xuICAgICAgY29uc3QgdGVzdCA9IGN1ciA/IGAke2N1cn0gJHt3fWAgOiB3O1xuICAgICAgaWYgKHRlc3QubGVuZ3RoID4gbWF4Q2hhcnMgJiYgY3VyKSB7IGxpbmVzLnB1c2goY3VyKTsgY3VyID0gdzsgfVxuICAgICAgZWxzZSBjdXIgPSB0ZXN0O1xuICAgIH0pO1xuICAgIGlmIChjdXIpIGxpbmVzLnB1c2goY3VyKTtcbiAgICByZXR1cm4gbGluZXMuc2xpY2UoMCwgMyk7XG4gIH1cblxuICBjb25zdCBzZWdzID0gcHJlbWlvcy5tYXAoKF8sIGkpID0+IHtcbiAgICBjb25zdCBjID0gQ09SRVNbaSAlIDJdITtcbiAgICByZXR1cm4gYDxwYXRoIGQ9XCIke3NlZ1BhdGgoaSl9XCIgZmlsbD1cIiR7Yy5iZ31cIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHNoYXBlLXJlbmRlcmluZz1cImdlb21ldHJpY1ByZWNpc2lvblwiLz5gO1xuICB9KS5qb2luKCcnKTtcblxuICBjb25zdCBzcG9rZXMgPSBwcmVtaW9zLm1hcCgoXywgaSkgPT4ge1xuICAgIGNvbnN0IGQgPSBTRUcgKiBpIC0gOTA7XG4gICAgY29uc3QgW3gsIHldID0gcHQoZCwgUik7XG4gICAgcmV0dXJuIGA8bGluZSB4MT1cIiR7Q1h9XCIgeTE9XCIke0NZfVwiIHgyPVwiJHt4LnRvRml4ZWQoMil9XCIgeTI9XCIke3kudG9GaXhlZCgyKX1cIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiMlwiLz5gO1xuICB9KS5qb2luKCcnKTtcblxuICBjb25zdCB0ZXh0cyA9IHByZW1pb3MubWFwKChwLCBpKSA9PiB7XG4gICAgY29uc3QgbWlkID0gU0VHICogaSAtIDkwICsgU0VHIC8gMjtcbiAgICBjb25zdCBbdHgsIHR5XSA9IHB0KG1pZCwgUiAqIDAuNTcpO1xuICAgIGNvbnN0IGMgPSBDT1JFU1tpICUgMl0hO1xuICAgIGNvbnN0IG0gPSBwLm1hdGNoKC9eKFxcUyspXFxzKyguKykkLyk7XG4gICAgY29uc3QgZW1vamkgPSBtID8gbVsxXSEgOiAnJztcbiAgICBjb25zdCByZXN0ID0gbSA/IG1bMl0hIDogcDtcbiAgICBjb25zdCBsaW5lcyA9IHdyYXBXb3JkcyhyZXN0LCAxMyk7XG4gICAgY29uc3QgbGluZUggPSAxMS41O1xuICAgIGNvbnN0IHRvdGFsVHh0SCA9IGxpbmVzLmxlbmd0aCAqIGxpbmVIO1xuICAgIGNvbnN0IGVtb2ppWSA9IC0odG90YWxUeHRIIC8gMikgLSAxMTtcbiAgICBjb25zdCByb3QgPSAobWlkICsgOTApLnRvRml4ZWQoMSk7XG4gICAgcmV0dXJuIGA8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoJHt0eC50b0ZpeGVkKDIpfSwke3R5LnRvRml4ZWQoMil9KSByb3RhdGUoJHtyb3R9KVwiIHRleHQtcmVuZGVyaW5nPVwiZ2VvbWV0cmljUHJlY2lzaW9uXCI+XG4gIDx0ZXh0IHg9XCIwXCIgeT1cIiR7ZW1vamlZLnRvRml4ZWQoMSl9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBkb21pbmFudC1iYXNlbGluZT1cIm1pZGRsZVwiIGZvbnQtc2l6ZT1cIjE1XCIgZm9udC1mYW1pbHk9XCJzZXJpZlwiPiR7ZXNjKGVtb2ppKX08L3RleHQ+XG4gICR7bGluZXMubWFwKChsLCBsaSkgPT4ge1xuICAgIGNvbnN0IHlwID0gKChsaSAtIChsaW5lcy5sZW5ndGggLSAxKSAvIDIpICogbGluZUgpLnRvRml4ZWQoMSk7XG4gICAgcmV0dXJuIGA8dGV4dCB4PVwiMFwiIHk9XCIke3lwfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmaWxsPVwiJHtjLnR4dH1cIiBmb250LWZhbWlseT1cIidETSBTYW5zJyxBcmlhbCxzYW5zLXNlcmlmXCIgZm9udC13ZWlnaHQ9XCI3MDBcIiBmb250LXNpemU9XCI5XCI+JHtlc2MobCl9PC90ZXh0PmA7XG4gIH0pLmpvaW4oJ1xcbiAgJyl9XG48L2c+YDtcbiAgfSkuam9pbignJyk7XG5cbiAgY29uc3QgTEVEX04gPSAzMDtcbiAgY29uc3QgbGVkcyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IExFRF9OIH0sIChfLCBpKSA9PiB7XG4gICAgY29uc3QgW2x4LCBseV0gPSBwdCgoMzYwIC8gTEVEX04pICogaSAtIDkwLCBSX0xFRCk7XG4gICAgcmV0dXJuIGA8Y2lyY2xlIGN4PVwiJHtseC50b0ZpeGVkKDIpfVwiIGN5PVwiJHtseS50b0ZpeGVkKDIpfVwiIHI9XCI1LjVcIiBjbGFzcz1cInItbGVkIHItbGVkLSR7aSAlIDJ9XCIvPmA7XG4gIH0pLmpvaW4oJycpO1xuXG4gIGNvbnN0IHN2ZyA9IGA8c3ZnIGlkPVwicm9sZXRhQ2FudmFzXCIgdmlld0JveD1cIjAgMCA0MDAgNDAwXCJcbiAgc3R5bGU9XCJ3aWR0aDptaW4oODZ2dywzNDBweCk7aGVpZ2h0Om1pbig4NnZ3LDM0MHB4KTtkaXNwbGF5OmJsb2NrO2ZpbHRlcjpkcm9wLXNoYWRvdygwIDZweCAyMHB4IHJnYmEoMCwwLDAsLjQyKSlcIlxuICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+XG4gIDxkZWZzPlxuICAgIDxyYWRpYWxHcmFkaWVudCBpZD1cInJnLXJpbmdcIiBjeD1cIjUwJVwiIGN5PVwiNTAlXCIgcj1cIjUwJVwiPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiNzAlXCIgc3RvcC1jb2xvcj1cIiNENDJCNzNcIi8+XG4gICAgICA8c3RvcCBvZmZzZXQ9XCIxMDAlXCIgc3RvcC1jb2xvcj1cIiM2QTA4MkVcIi8+XG4gICAgPC9yYWRpYWxHcmFkaWVudD5cbiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9XCJyZy1jdHJcIiBjeD1cIjM1JVwiIGN5PVwiMzAlXCIgcj1cIjcwJVwiPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiMCVcIiBzdG9wLWNvbG9yPVwiI0ZGRTU3QVwiLz5cbiAgICAgIDxzdG9wIG9mZnNldD1cIjQ4JVwiIHN0b3AtY29sb3I9XCIjRDRBRjM3XCIvPlxuICAgICAgPHN0b3Agb2Zmc2V0PVwiMTAwJVwiIHN0b3AtY29sb3I9XCIjN0E1ODAwXCIvPlxuICAgIDwvcmFkaWFsR3JhZGllbnQ+XG4gICAgPGZpbHRlciBpZD1cImYtZ2xvd1wiIHg9XCItNjAlXCIgeT1cIi02MCVcIiB3aWR0aD1cIjIyMCVcIiBoZWlnaHQ9XCIyMjAlXCI+XG4gICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPVwiMi41XCIgcmVzdWx0PVwiYlwiLz5cbiAgICAgIDxmZU1lcmdlPjxmZU1lcmdlTm9kZSBpbj1cImJcIi8+PGZlTWVyZ2VOb2RlIGluPVwiU291cmNlR3JhcGhpY1wiLz48L2ZlTWVyZ2U+XG4gICAgPC9maWx0ZXI+XG4gIDwvZGVmcz5cbiAgPGNpcmNsZSBjeD1cIiR7Q1h9XCIgY3k9XCIke0NZfVwiIHI9XCIke1JfT1VURVJ9XCIgZmlsbD1cInVybCgjcmctcmluZylcIi8+XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiJHtSX09VVEVSfVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiI0Q0QUYzN1wiIHN0cm9rZS13aWR0aD1cIjMuNVwiLz5cbiAgPGcgaWQ9XCJyb2xldGFSb2RhXCI+JHtzZWdzfSR7c3Bva2VzfSR7dGV4dHN9PC9nPlxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIiR7UiArIDF9XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIjRDRBRjM3XCIgc3Ryb2tlLXdpZHRoPVwiM1wiLz5cbiAgJHtsZWRzfVxuICA8Y2lyY2xlIGN4PVwiJHtDWH1cIiBjeT1cIiR7Q1l9XCIgcj1cIjQyXCIgZmlsbD1cInVybCgjcmctY3RyKVwiIHN0cm9rZT1cIiNGRkZcIiBzdHJva2Utd2lkdGg9XCIzLjVcIiBmaWx0ZXI9XCJ1cmwoI2YtZ2xvdylcIi8+XG4gIDxjaXJjbGUgY3g9XCIke0NYfVwiIGN5PVwiJHtDWX1cIiByPVwiMzhcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cInJnYmEoMjU1LDI1NSwyNTUsMC4zNSlcIiBzdHJva2Utd2lkdGg9XCIxLjVcIi8+XG4gIDx0ZXh0IHg9XCIke0NYfVwiIHk9XCIke0NZIC0gN31cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGRvbWluYW50LWJhc2VsaW5lPVwibWlkZGxlXCIgZmlsbD1cIiNGRkZcIiBmb250LWZhbWlseT1cIidETSBTYW5zJyxBcmlhbCxzYW5zLXNlcmlmXCIgZm9udC13ZWlnaHQ9XCI4MDBcIiBmb250LXNpemU9XCIxMlwiIGxldHRlci1zcGFjaW5nPVwiMS41XCIgdGV4dC1yZW5kZXJpbmc9XCJnZW9tZXRyaWNQcmVjaXNpb25cIj5HSVJBUjwvdGV4dD5cbiAgPHRleHQgeD1cIiR7Q1h9XCIgeT1cIiR7Q1kgKyA5fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJtaWRkbGVcIiBmaWxsPVwicmdiYSgyNTUsMjU1LDI1NSwuODUpXCIgZm9udC1mYW1pbHk9XCJzZXJpZlwiIGZvbnQtc2l6ZT1cIjExXCI+XHUyNjA1IFx1MjYwNSBcdTI2MDU8L3RleHQ+XG48L3N2Zz5gO1xuXG4gIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuaW5uZXJIVE1MID0gc3ZnO1xuICB3cmFwLmluc2VydEJlZm9yZShkaXYuZmlyc3RFbGVtZW50Q2hpbGQhLCB3cmFwLmZpcnN0Q2hpbGQpO1xufVxuXG5leHBvcnQgeyBlc2NIVE1MIH07XG4iLCAiaW1wb3J0IHR5cGUgeyBJdGVtQ2FycmluaG8gfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBlc2NIVE1MIH0gZnJvbSAnLi4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgZm9ybWF0YXJNb2VkYSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBjYXJ0U2VydmljZSB9IGZyb20gJy4uL2NvbnRhaW5lcic7XG5cbi8vIEFkYXB0YWRvcmVzIGxlZ2Fkb3MgXHUyMDE0IGRlbGVnYW0gYW8gQ2FydFNlcnZpY2UgKENsZWFuIEFyY2hpdGVjdHVyZSlcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXJyaW5obygpOiBSZWNvcmQ8c3RyaW5nLCBJdGVtQ2FycmluaG8+IHtcbiAgY29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBJdGVtQ2FycmluaG8+ID0ge307XG4gIGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCkuZm9yRWFjaChpID0+IHsgcmVzdWx0W2kubm9tZV0gPSBpOyB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEl0ZW5zKCk6IEl0ZW1DYXJyaW5ob1tdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oY2FydFNlcnZpY2UuZ2V0SXRlbXMoKSkgYXMgSXRlbUNhcnJpbmhvW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUb3RhbCgpOiBudW1iZXIge1xuICByZXR1cm4gY2FydFNlcnZpY2UuZ2V0VG90YWwoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkaWNpb25hckl0ZW0obm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGlmIChjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybiBmYWxzZTtcbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVySXRlbShub21lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKCFjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybiBmYWxzZTtcbiAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZUl0ZW0obm9tZTogc3RyaW5nLCBwcmVjbzogbnVtYmVyKTogJ2FkaWNpb25hZG8nIHwgJ3JlbW92aWRvJyB7XG4gIGNvbnN0IHIgPSBjYXJ0U2VydmljZS50b2dnbGUobm9tZSwgcHJlY28pO1xuICByZXR1cm4gciA9PT0gJ2FkZGVkJyA/ICdhZGljaW9uYWRvJyA6ICdyZW1vdmlkbyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaW1wYXIoKTogdm9pZCB7XG4gIGNhcnRTZXJ2aWNlLmNsZWFyKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0JvbG9Gb3JtYShub21lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgQk9MT19GT1JNQV9OT01FUyA9IFtcbiAgICAnQm9sbyBuYSBmb3JtYSBNaWxobyBuYXR1cmFsJyxcbiAgICAnQm9sbyBuYSBmb3JtYSBDZW5vdXJhIGNvbSBjaG9jb2xhdGUgZSBHcmFudWxlJyxcbiAgICAnQm9sbyBuYSBmb3JtYSBCcmlnYWRlaXJvJyxcbiAgICAnQm9sbyBuYSBmb3JtYSBGZXJyZXJvIFJvY2hlcicsXG4gICAgJ1RvcnRhIGRlIEZyYW5nbyBjb20gQ2F0dXBpcnknLFxuICBdO1xuICByZXR1cm4gQk9MT19GT1JNQV9OT01FUy5pbmNsdWRlcyhub21lKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlcml6YXJMaXN0YShjb250YWluZXJJZDogc3RyaW5nLCB0b3RhbFJvZGFwZUlkOiBzdHJpbmcsIGJhZGdlSWQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBsaXN0YSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbnRhaW5lcklkKTtcbiAgY29uc3QgdG90YWxFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRvdGFsUm9kYXBlSWQpO1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGJhZGdlSWQpO1xuICBjb25zdCBpdGVucyA9IGdldEl0ZW5zKCk7XG5cbiAgaWYgKGJhZGdlKSBiYWRnZS50ZXh0Q29udGVudCA9IFN0cmluZyhpdGVucy5sZW5ndGgpO1xuXG4gIGlmICghbGlzdGEgfHwgIXRvdGFsRWwpIHJldHVybjtcblxuICBpZiAoaXRlbnMubGVuZ3RoID09PSAwKSB7XG4gICAgbGlzdGEuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJjYXJyaW5oby12YXppb1wiPjxkaXYgY2xhc3M9XCJjYXJyaW5oby12YXppby1pY29uXCI+XHVEODNEXHVERUQyPC9kaXY+PGRpdj5TZXUgY2FycmluaG8gZXN0XHUwMEUxIHZhemlvPC9kaXY+PC9kaXY+YDtcbiAgICB0b3RhbEVsLnRleHRDb250ZW50ID0gJ1IkIDAsMDAnO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRvdGFsID0gZ2V0VG90YWwoKTtcbiAgbGlzdGEuaW5uZXJIVE1MID0gaXRlbnMubWFwKGl0ZW0gPT4ge1xuICAgIGNvbnN0IG5vbWVFc2MgPSBlc2NIVE1MKGl0ZW0ubm9tZSk7XG4gICAgY29uc3Qgbm9tZURhdGEgPSBlbmNvZGVVUklDb21wb25lbnQoaXRlbS5ub21lKTtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJjYXJ0LWl0ZW1cIj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY2FydC1pdGVtLW5vbWVcIj4ke25vbWVFc2N9PC9zcGFuPlxuICAgICAgPHNwYW4gY2xhc3M9XCJjYXJ0LWl0ZW0tcHJlY29cIj4ke2Zvcm1hdGFyTW9lZGEoaXRlbS5wcmVjbyl9PC9zcGFuPlxuICAgICAgPGJ1dHRvbiBjbGFzcz1cImNhcnQtaXRlbS1yZW1vdmVcIiBvbmNsaWNrPVwicmVtb3ZlckRvQ2FycmluaG8oZGVjb2RlVVJJQ29tcG9uZW50KCcke25vbWVEYXRhfScpKVwiIGFyaWEtbGFiZWw9XCJSZW1vdmVyXCI+XHVEODNEXHVEREQxXHVGRTBGPC9idXR0b24+XG4gICAgPC9kaXY+YDtcbiAgfSkuam9pbignJykgKyBgPGRpdiBjbGFzcz1cImNhcnQtdG90YWxcIj48c3BhbiBjbGFzcz1cImNhcnQtdG90YWwtbGFiZWxcIj5Ub3RhbDwvc3Bhbj48c3BhbiBjbGFzcz1cImNhcnQtdG90YWwtdmFsb3JcIj4ke2Zvcm1hdGFyTW9lZGEodG90YWwpfTwvc3Bhbj48L2Rpdj5gO1xuICB0b3RhbEVsLnRleHRDb250ZW50ID0gZm9ybWF0YXJNb2VkYSh0b3RhbCk7XG59XG4iLCAiLy8gc3JjL21haW4udHMgXHUyMDE0IHBvbnRvIGRlIGVudHJhZGEgR2VsYW1vdXIgKENsZWFuIEFyY2hpdGVjdHVyZSlcbmltcG9ydCB7IG1vc3RyYXJUb2FzdCB9IGZyb20gJy4vdXRpbHMvdG9hc3QnO1xuaW1wb3J0IHsgZXNjSFRNTCB9IGZyb20gJy4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgYXBsaWNhck1hc2NhcmFUZWxlZm9uZSB9IGZyb20gJy4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGxvZ2luVXNlQ2FzZSwgY2FydFNlcnZpY2UsIHBlZGlkb1JlcG9zaXRvcnksIHJvbGV0YVJlcG9zaXRvcnksIGNsaWVudGVSZXBvc2l0b3J5IH0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHsgYXBwU3RvcmUsIGlzQ29udGFUZXN0ZSB9IGZyb20gJy4vc3RhdGUvQXBwU3RvcmUnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi9jb3JlL2xvZ2dlcic7XG5pbXBvcnQgeyBDbGllbnRlIGFzIENsaWVudGVFbnRpdHkgfSBmcm9tICcuL2RvbWFpbi9jbGllbnRlJztcbmltcG9ydCB7IGdldFNlbWFuYUF0dWFsIH0gZnJvbSAnLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHtcbiAgZ2V0UHJlbWlvcywgZ2V0UHJlbWlvc1BhZHJhbywgc2V0UHJlbWlvcyxcbiAgc2V0UGFydGljaXBhY2FvSWQsXG4gIGNhcnJlZ2FyQ29uZmlnIGFzIGNhcnJlZ2FyQ29uZmlnUm9sZXRhLFxuICB2ZXJpZmljYXJTdGF0dXMgYXMgdmVyaWZpY2FyU3RhdHVzUm9sZXRhLFxuICBnaXJhciBhcyBnaXJhclJvbGV0YUZuLFxuICBzYWx2YXJWZW5jZWRvcixcbiAgZGVzZW5oYXJSb2xldGFcbn0gZnJvbSAnLi9tb2R1bGVzL3JvbGV0YSc7XG5pbXBvcnQgeyBpc0JvbG9Gb3JtYSwgcmVuZGVyaXphckxpc3RhIH0gZnJvbSAnLi9tb2R1bGVzL2NhcnQnO1xuaW1wb3J0IHR5cGUgeyBDbGllbnRlLCBQYXJ0aWNpcGFjYW8gfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IFNVUEFCQVNFX1VSTCwgU1VQQUJBU0VfQU5PTiB9IGZyb20gJy4vaW5mcmFzdHJ1Y3R1cmUvc3VwYWJhc2UvY2xpZW50JztcblxuY29uc3QgbG9nID0gbG9nZ2VyLmNoaWxkKCdtYWluJyk7XG5cbi8vID09PT09IENPTlNUQU5URVMgPT09PT1cbmNvbnN0IFdBX05VTUJFUiA9IGF0b2IoJ05UVXhNVGswTURjM01qYzFNQT09Jyk7XG5cbmxldCBfdmVyaWZpY2FuZG8gPSBmYWxzZTtcbmxldCBfY2FkYXN0cmFuZG8gPSBmYWxzZTtcblxuLy8gSGVscGVyOiBsXHUwMEVBIGNsaWVudGUgYXR1YWwgZG8gc3RvcmVcbmZ1bmN0aW9uIGdldENsaWVudGVBdHVhbCgpOiBDbGllbnRlIHwgbnVsbCB7XG4gIHJldHVybiBhcHBTdG9yZS5nZXRTdGF0ZSgpLmNsaWVudGUgYXMgQ2xpZW50ZSB8IG51bGw7XG59XG5cbi8vID09PT09IEZJTFRST1MgPT09PT1cbmZ1bmN0aW9uIGZpbHRyYXIoY2F0OiBzdHJpbmcsIF9idG46IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5maWx0cm8tYnRuJykuZm9yRWFjaChiID0+IGIuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJykpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PignLmZpbHRyby1idG5bZGF0YS1maWx0cm89XCInICsgY2F0ICsgJ1wiXScpXG4gICAgLmZvckVhY2goYiA9PiBiLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByb2QtY2FyZCcpLmZvckVhY2goY2FyZCA9PiB7XG4gICAgY29uc3QgZWwgPSBjYXJkIGFzIEhUTUxFbGVtZW50O1xuICAgIGlmIChjYXQgPT09ICd0b2RvcycgfHwgKGVsLmRhdGFzZXRbJ2NhdCddID09PSBjYXQpKVxuICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgZWxzZVxuICAgICAgZWwuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XG4gIH0pO1xufVxuXG4vLyA9PT09PSBDQVJSSU5ITyA9PT09PVxuZnVuY3Rpb24gYXR1YWxpemFyRmFiKCk6IHZvaWQge1xuICBjb25zdCBmYWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FydEZhYicpO1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYXJ0QmFkZ2UnKTtcbiAgY29uc3QgY291bnQgPSBjYXJ0U2VydmljZS5nZXRDb3VudCgpO1xuICBpZiAoYmFkZ2UpIGJhZGdlLnRleHRDb250ZW50ID0gU3RyaW5nKGNvdW50KTtcbiAgaWYgKGZhYikge1xuICAgIGlmIChjb3VudCA+IDApIGZhYi5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICAgIGVsc2UgeyBmYWIuY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTsgZmVjaGFyTW9kYWwoKTsgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHBlZGlyUHJvZHV0byhib3RhbzogSFRNTEVsZW1lbnQsIG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjYXJkID0gYm90YW8uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGNhcnRTZXJ2aWNlLmhhcyhub21lKSkge1xuICAgIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcbiAgICBjYXJkPy5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpO1xuICAgIGF0dWFsaXphckZhYigpO1xuICAgIHJldHVybjtcbiAgfVxuICBjYXJ0U2VydmljZS5hZGQobm9tZSwgcHJlY28pO1xuICBjYXJkPy5jbGFzc0xpc3QuYWRkKCdzZWxlY2lvbmFkbycpO1xuICBhdHVhbGl6YXJGYWIoKTtcbiAgYWJyaXJEaWFsb2cobm9tZSwgcHJlY28pO1xufVxuXG5mdW5jdGlvbiBhYnJpckRpYWxvZyhub21lOiBzdHJpbmcsIHByZWNvOiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlhbG9nUHJvZHV0bycpO1xuICBpZiAoZWwpIGVsLmlubmVySFRNTCA9ICc8c3Ryb25nPicgKyBlc2NIVE1MKG5vbWUpICsgJzwvc3Ryb25nPiBcdTIwMTQgUiQgJyArIE51bWJlcihwcmVjbykudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpYWxvZ0JhY2tkcm9wJyk/LmNsYXNzTGlzdC5hZGQoJ2FiZXJ0bycpO1xufVxuXG5mdW5jdGlvbiBmZWNoYXJEaWFsb2coKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyRGlhbG9nQmFja2Ryb3AoZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaWQgPT09ICdkaWFsb2dCYWNrZHJvcCcpIGZlY2hhckRpYWxvZygpO1xufVxuXG5mdW5jdGlvbiBpclBhcmFGaW5hbGl6YXIoKTogdm9pZCB7XG4gIGZlY2hhckRpYWxvZygpO1xuICBhYnJpck1vZGFsKCk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcml6YXJDYXJyaW5obygpOiB2b2lkIHtcbiAgcmVuZGVyaXphckxpc3RhKCdsaXN0YUNhcnJpbmhvJywgJ3RvdGFsUm9kYXBlJywgJ2JhZGdlQ291bnQnKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyaXphck5vdGljZUVuY29tZW5kYSgpOiB2b2lkIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm90aWNlRW5jb21lbmRhJyk7XG4gIGlmICghZWwpIHJldHVybjtcbiAgY29uc3QgaXRlbnMgPSBjYXJ0U2VydmljZS5nZXRJdGVtcygpO1xuICBjb25zdCB0ZW1Gb3JtYSA9IGl0ZW5zLnNvbWUoaSA9PiBpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgY29uc3QgdGVtT3V0cm9zID0gaXRlbnMuc29tZShpID0+ICFpc0JvbG9Gb3JtYShpLm5vbWUpKTtcbiAgaWYgKHRlbUZvcm1hICYmIHRlbU91dHJvcykge1xuICAgIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwibm90aWNlLW1pc3RvXCI+PHNwYW4+XHUyNkEwXHVGRTBGPC9zcGFuPjxzcGFuPjxzdHJvbmc+QXRlblx1MDBFN1x1MDBFM286PC9zdHJvbmc+IFZvY1x1MDBFQSBtaXN0dXJvdSBCb2xvcyBuYSBGb3JtYSAoZmVpdG9zIHNvYiBlbmNvbWVuZGEpIGNvbSBvdXRyb3MgcHJvZHV0b3MuIENvbnNpZGVyZSBwZWRpZG9zIHNlcGFyYWRvcyBwYXJhIGdhcmFudGlyIG8gcHJhem8hPC9zcGFuPjwvZGl2Pic7XG4gIH0gZWxzZSBpZiAodGVtRm9ybWEpIHtcbiAgICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cIm5vdGljZS1lbmNvbWVuZGFcIj48c3BhbiBjbGFzcz1cIm5vdGljZS1lbmNvbWVuZGEtaWNvblwiPlx1MjNGMDwvc3Bhbj48c3Bhbj48c3Ryb25nPkJvbG8gbmEgRm9ybWEgXHUyMDE0IFNvYiBlbmNvbWVuZGEhPC9zdHJvbmc+PGJyPkVzc2VzIGJvbG9zIHNcdTAwRTNvIHByZXBhcmFkb3MgZXNwZWNpYWxtZW50ZSBwYXJhIHZvY1x1MDBFQS4gUHJhem8gZGUgPHN0cm9uZz41IGhvcmFzIGEgMSBkaWEgXHUwMEZBdGlsPC9zdHJvbmc+IGFwXHUwMEYzcyBjb25maXJtYVx1MDBFN1x1MDBFM28uPC9zcGFuPjwvZGl2Pic7XG4gIH0gZWxzZSB7XG4gICAgZWwuaW5uZXJIVE1MID0gJyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWJyaXJNb2RhbCgpOiB2b2lkIHtcbiAgcmVuZGVyaXphckNhcnJpbmhvKCk7XG4gIHJlbmRlcml6YXJOb3RpY2VFbmNvbWVuZGEoKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbW9kYWwtYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhck1vZGFsKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxCYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdtb2RhbC1hYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyTW9kYWxCYWNrZHJvcChlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ21vZGFsQmFja2Ryb3AnKSBmZWNoYXJNb2RhbCgpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVyRG9DYXJyaW5obyhub21lOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKCFjYXJ0U2VydmljZS5oYXMobm9tZSkpIHJldHVybjtcbiAgY2FydFNlcnZpY2UucmVtb3ZlKG5vbWUpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucHJvZC1jYXJkLnNlbGVjaW9uYWRvJykuZm9yRWFjaChjYXJkID0+IHtcbiAgICBjb25zdCBub21lRWwgPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kLW5vbWUnKTtcbiAgICBpZiAobm9tZUVsICYmIG5vbWVFbC50ZXh0Q29udGVudD8udHJpbSgpID09PSBub21lKSBjYXJkLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjaW9uYWRvJyk7XG4gIH0pO1xuICByZW5kZXJpemFyQ2FycmluaG8oKTtcbiAgYXR1YWxpemFyRmFiKCk7XG59XG5cbmZ1bmN0aW9uIHNlbGVjaW9uYXJQYWdhbWVudG8oZWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYWdhbWVudG8tb3B0JykuZm9yRWFjaChvID0+IG8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKSk7XG4gIGVsLmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGNvbnN0IHRpcG8gPSAoZWwgYXMgSFRNTEVsZW1lbnQgJiB7IGRhdGFzZXQ6IERPTVN0cmluZ01hcCB9KS5kYXRhc2V0WydwYWcnXSA/PyAnJztcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwYWdhbWVudG9TZWxlY2lvbmFkbzogdGlwbyB9KTtcbn1cblxuZnVuY3Rpb24gbGltcGFyQ2FycmluaG8oKTogdm9pZCB7XG4gIGNhcnRTZXJ2aWNlLmNsZWFyKCk7XG4gIGFwcFN0b3JlLnNldFN0YXRlKHsgcGFnYW1lbnRvU2VsZWNpb25hZG86ICcnIH0pO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGFnYW1lbnRvLW9wdC5hdGl2bycpLmZvckVhY2gobyA9PiBvLmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJykpO1xuICBjb25zdCBvYnNFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBPYnMnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbDtcbiAgaWYgKG9ic0VsKSBvYnNFbC52YWx1ZSA9ICcnO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucHJvZC1jYXJkLnNlbGVjaW9uYWRvJykuZm9yRWFjaChjID0+IGMuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWNpb25hZG8nKSk7XG4gIGF0dWFsaXphckZhYigpO1xuICBmZWNoYXJNb2RhbCgpO1xufVxuXG4vLyA9PT09PSBCT0xPIE5BIEZPUk1BID09PT09XG5mdW5jdGlvbiBwZWRpckJvbG9Gb3JtYShib3RhbzogSFRNTEVsZW1lbnQsIG5vbWU6IHN0cmluZywgcHJlY286IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjYXJkID0gYm90YW8uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGNhcnRTZXJ2aWNlLmhhcyhub21lKSkge1xuICAgIGNhcnRTZXJ2aWNlLnJlbW92ZShub21lKTtcbiAgICBjYXJkPy5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY2lvbmFkbycpO1xuICAgIGF0dWFsaXphckZhYigpO1xuICAgIHJlbmRlcml6YXJOb3RpY2VFbmNvbWVuZGEoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY2FydFNlcnZpY2UuYWRkKG5vbWUsIHByZWNvKTtcbiAgY2FyZD8uY2xhc3NMaXN0LmFkZCgnc2VsZWNpb25hZG8nKTtcbiAgYXR1YWxpemFyRmFiKCk7XG4gIGFicmlyRGlhbG9nQm9sbygpO1xufVxuXG5mdW5jdGlvbiBhYnJpckRpYWxvZ0JvbG8oKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCb2xvQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhckRpYWxvZ0JvbG8oZT86IEV2ZW50KTogdm9pZCB7XG4gIGlmICghZSB8fCAoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAnZGlhbG9nQm9sb0JhY2tkcm9wJykge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2dCb2xvQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWdlbmRhckJvbG9XaGF0c0FwcCgpOiB2b2lkIHtcbiAgY29uc3QgaXRlbnNGb3JtYSA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCkuZmlsdGVyKGkgPT4gaXNCb2xvRm9ybWEoaS5ub21lKSk7XG4gIGxldCBsaW5oYXMgPSAnJztcbiAgbGV0IHRvdGFsID0gMDtcbiAgaXRlbnNGb3JtYS5mb3JFYWNoKGkgPT4ge1xuICAgIGxpbmhhcyArPSAnXHUyMDIyICcgKyBpLm5vbWUgKyAnIFx1MjAxNCBSJCAnICsgaS5wcmVjby50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpICsgJ1xcbic7XG4gICAgdG90YWwgPSBNYXRoLnJvdW5kKCh0b3RhbCArIGkucHJlY28pICogMTAwKSAvIDEwMDtcbiAgfSk7XG4gIGNvbnN0IG1zZyA9ICcqXHVEODNDXHVERjgyIEFHRU5EQU1FTlRPIC0gQk9MTyBOQSBGT1JNQSAtIEdFTEFNT1VSKlxcblxcbk9sXHUwMEUxISBHb3N0YXJpYSBkZSBhZ2VuZGFyIG8ocykgc2VndWludGUocykgYm9sbyhzKTpcXG5cXG4nICsgbGluaGFzICsgJ1xcbipcdUQ4M0RcdURDQjAgVG90YWw6KiBSJCAnICsgdG90YWwudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKSArICdcXG5cXG5cdTIzRjAgU2VpIHF1ZSBvIHByYXpvIFx1MDBFOSBkZSA1IGhvcmFzIGEgMSBkaWEgXHUwMEZBdGlsLiBQb3IgZmF2b3IgbWUgaW5mb3JtZSBhIGRhdGEgZSBob3JcdTAwRTFyaW8gZGlzcG9uXHUwMEVEdmVpcyBwYXJhIGVudHJlZ2EuIFx1RDgzRFx1REUwQSc7XG4gIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChtc2cpLCAnX2JsYW5rJyk7XG4gIGZlY2hhckRpYWxvZ0JvbG8oKTtcbn1cblxuLy8gPT09PT0gQ0FST1VTRUwgPT09PT1cbmZ1bmN0aW9uIGNhcm91c2VsTmV4dChpZDogc3RyaW5nLCBlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoZSkgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgY29uc3QgYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgaWYgKCFjKSByZXR1cm47XG4gIGNvbnN0IGltZ3MgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1pbWcnKTtcbiAgY29uc3QgZG90cyA9IGMucXVlcnlTZWxlY3RvckFsbCgnLmNhcm91c2VsLWRvdCcpO1xuICBsZXQgY3VyID0gMDtcbiAgaW1ncy5mb3JFYWNoKChpbWcsIGkpID0+IHsgaWYgKGltZy5jbGFzc0xpc3QuY29udGFpbnMoJ2F0aXZvJykpIGN1ciA9IGk7IH0pO1xuICBpbWdzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGRvdHNbY3VyXT8uY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKTtcbiAgY29uc3QgbmV4dCA9IChjdXIgKyAxKSAlIGltZ3MubGVuZ3RoO1xuICBpbWdzW25leHRdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBkb3RzW25leHRdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xufVxuXG5mdW5jdGlvbiBjYXJvdXNlbFByZXYoaWQ6IHN0cmluZywgZTogRXZlbnQpOiB2b2lkIHtcbiAgaWYgKGUpIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGNvbnN0IGMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIGlmICghYykgcmV0dXJuO1xuICBjb25zdCBpbWdzID0gYy5xdWVyeVNlbGVjdG9yQWxsKCcuY2Fyb3VzZWwtaW1nJyk7XG4gIGNvbnN0IGRvdHMgPSBjLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXJvdXNlbC1kb3QnKTtcbiAgbGV0IGN1ciA9IDA7XG4gIGltZ3MuZm9yRWFjaCgoaW1nLCBpKSA9PiB7IGlmIChpbWcuY2xhc3NMaXN0LmNvbnRhaW5zKCdhdGl2bycpKSBjdXIgPSBpOyB9KTtcbiAgaW1nc1tjdXJdPy5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpO1xuICBkb3RzW2N1cl0/LmNsYXNzTGlzdC5yZW1vdmUoJ2F0aXZvJyk7XG4gIGNvbnN0IHByZXYgPSAoY3VyIC0gMSArIGltZ3MubGVuZ3RoKSAlIGltZ3MubGVuZ3RoO1xuICBpbWdzW3ByZXZdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xuICBkb3RzW3ByZXZdPy5jbGFzc0xpc3QuYWRkKCdhdGl2bycpO1xufVxuXG4vLyA9PT09PSBDSEVDS09VVCBcdTIwMTQgMTAwJSBXaGF0c0FwcCA9PT09PVxuYXN5bmMgZnVuY3Rpb24gZmluYWxpemFyUGVkaWRvKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBpdGVucyA9IGNhcnRTZXJ2aWNlLmdldEl0ZW1zKCk7XG4gIGNvbnN0IHRlbUZvcm1hRmluID0gaXRlbnMuc29tZShpID0+IGlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuICBjb25zdCB0ZW1PdXRyb3NGaW4gPSBpdGVucy5zb21lKGkgPT4gIWlzQm9sb0Zvcm1hKGkubm9tZSkpO1xuXG4gIGlmICh0ZW1Gb3JtYUZpbiAmJiB0ZW1PdXRyb3NGaW4pIHtcbiAgICBpZiAoIWNvbmZpcm0oJ1x1MjZBMFx1RkUwRiBBdGVuXHUwMEU3XHUwMEUzbyFcXG5cXG5Wb2NcdTAwRUEgdGVtIEJvbG9zIG5hIEZvcm1hIChmZWl0b3Mgc29iIGVuY29tZW5kYSkgbWlzdHVyYWRvcyBjb20gb3V0cm9zIHByb2R1dG9zLlxcblxcbkJvbG9zIG5hIEZvcm1hIHByZWNpc2FtIGRlIHByYXpvIGRlIDVoIGEgMSBkaWEgXHUwMEZBdGlsIHBhcmEgcHJlcGFyby5cXG5cXG5EZXNlamEgcHJvc3NlZ3VpciBtZXNtbyBhc3NpbT8nKSlcbiAgICAgIHJldHVybjtcbiAgfVxuICBpZiAoaXRlbnMubGVuZ3RoID09PSAwKSB7IGFsZXJ0KCdBZGljaW9uZSBwZWxvIG1lbm9zIHVtIHByb2R1dG8gYW8gY2FycmluaG8hJyk7IHJldHVybjsgfVxuXG4gIGNvbnN0IG5vbWUgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBlbmRlcmVjbyA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wRW5kZXJlY28nKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KT8udmFsdWUudHJpbSgpID8/ICcnO1xuICBjb25zdCBvYnMgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE9icycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpPy52YWx1ZS50cmltKCkgPz8gJyc7XG4gIGNvbnN0IHBhZ2FtZW50b1NlbGVjaW9uYWRvID0gYXBwU3RvcmUuZ2V0U3RhdGUoKS5wYWdhbWVudG9TZWxlY2lvbmFkbztcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG5cbiAgaWYgKCFub21lKSB7IGFsZXJ0KCdQb3IgZmF2b3IsIGluZm9ybWUgc2V1IG5vbWUgY29tcGxldG8uJyk7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBOb21lJyk/LmZvY3VzKCk7IHJldHVybjsgfVxuICBpZiAoIWVuZGVyZWNvKSB7IGFsZXJ0KCdQb3IgZmF2b3IsIGluZm9ybWUgc2V1IGVuZGVyZVx1MDBFN28uJyk7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnBFbmRlcmVjbycpPy5mb2N1cygpOyByZXR1cm47IH1cbiAgaWYgKCFwYWdhbWVudG9TZWxlY2lvbmFkbykgeyBhbGVydCgnUG9yIGZhdm9yLCBlc2NvbGhhIGEgZm9ybWEgZGUgcGFnYW1lbnRvLicpOyByZXR1cm47IH1cblxuICAvLyBSZS12ZXJpZmljYXIgcHJlXHUwMEU3b3MgZG9zIGJvdFx1MDBGNWVzIHBhcmEgZXZpdGFyIG1hbmlwdWxhXHUwMEU3XHUwMEUzbyBjbGllbnQtc2lkZVxuICBjb25zdCBwcmljZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idG4tcGVkaXInKS5mb3JFYWNoKGJ0biA9PiB7XG4gICAgY29uc3Qgb25jbGlja0F0dHIgPSBidG4uZ2V0QXR0cmlidXRlKCdvbmNsaWNrJykgPz8gJyc7XG4gICAgY29uc3QgbSA9IG9uY2xpY2tBdHRyLm1hdGNoKC9wZWRpcig/OlByb2R1dG98Qm9sb0Zvcm1hKVxcKHRoaXMsJyguKz8pJywoXFxkKyg/OlxcLlxcZCspPylcXCkvKTtcbiAgICBpZiAobSkgcHJpY2VNYXAuc2V0KG1bMV0hLCBwYXJzZUZsb2F0KG1bMl0hKSk7XG4gIH0pO1xuICBjYXJ0U2VydmljZS5yZXZhbGlkYXRlUHJpY2VzKHByaWNlTWFwKTtcblxuICBjb25zdCBpdGVuc1ZlcmlmaWNhZG9zID0gQXJyYXkuZnJvbShjYXJ0U2VydmljZS5nZXRJdGVtcygpKTtcbiAgbGV0IHRvdGFsID0gMDtcbiAgbGV0IGxpbmhhc0l0ZW5zID0gJyc7XG4gIGl0ZW5zVmVyaWZpY2Fkb3MuZm9yRWFjaChpdGVtID0+IHtcbiAgICB0b3RhbCA9IE1hdGgucm91bmQoKHRvdGFsICsgaXRlbS5wcmVjbykgKiAxMDApIC8gMTAwO1xuICAgIGxpbmhhc0l0ZW5zICs9IGBcdTIwMjIgJHtpdGVtLm5vbWV9IFx1MjAxNCBSJCAke2l0ZW0ucHJlY28udG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX1cXG5gO1xuICB9KTtcblxuICBjb25zdCBtc2cgPSBgKlx1RDgzQ1x1REY3MCBOT1ZPIFBFRElETyAtIEdFTEFNT1VSKlxcblxcbipcdUQ4M0RcdURDQ0IgSVRFTlM6KlxcbiR7bGluaGFzSXRlbnN9XFxuKlx1RDgzRFx1RENCMCBUb3RhbDoqIFIkICR7dG90YWwudG9GaXhlZCgyKS5yZXBsYWNlKCcuJywgJywnKX1cXG5cXG4qXHVEODNEXHVEQzY0IE5vbWU6KiAke25vbWV9XFxuKlx1RDgzRFx1RENDRCBFbmRlcmVcdTAwRTdvOiogJHtlbmRlcmVjb31cXG4qXHVEODNEXHVEQ0IzIFBhZ2FtZW50bzoqICR7cGFnYW1lbnRvU2VsZWNpb25hZG99JHtvYnMgPyBgXFxuKlx1RDgzRFx1RENERCBPYnM6KiAke29ic31gIDogJyd9XFxuXFxuUGVkaWRvIHBlbG8gY2FyZFx1MDBFMXBpbyBvbmxpbmUgXHUyNzI4YDtcblxuICBjb25zdCBidG5GaW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuRmluYWxpemFyJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICBjb25zdCB0eHRPcmlnID0gYnRuRmluID8gKGJ0bkZpbi50ZXh0Q29udGVudCA/PyAnJykgOiAnJztcbiAgaWYgKGJ0bkZpbikgeyBidG5GaW4uZGlzYWJsZWQgPSB0cnVlOyBidG5GaW4udGV4dENvbnRlbnQgPSAnU2FsdmFuZG8gcGVkaWRvLi4uJzsgfVxuXG4gIC8vIFNhbHZhciBubyBiYW5jbyAoYmVzdC1lZmZvcnQgXHUyMDE0IG5cdTAwRTNvIGJsb3F1ZWlhIG8gV2hhdHNBcHApXG4gIGxldCBfcGVkaWRvSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IGN0cmwgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgdGlkID0gc2V0VGltZW91dCgoKSA9PiBjdHJsLmFib3J0KCksIDEwXzAwMCk7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9wZWRpZG9zJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxuICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04sXG4gICAgICAgICdQcmVmZXInOiAncmV0dXJuPWhlYWRlcnMtb25seSdcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG5vbWUsIGVuZGVyZWNvLFxuICAgICAgICBwYWdhbWVudG86IHBhZ2FtZW50b1NlbGVjaW9uYWRvLFxuICAgICAgICBpdGVuczogaXRlbnNWZXJpZmljYWRvcy5tYXAoaSA9PiAoeyBub21lOiBpLm5vbWUsIHByZWNvOiBpLnByZWNvIH0pKSxcbiAgICAgICAgdG90YWwsXG4gICAgICAgIHN0YXR1czogJ2FndWFyZGFuZG8nLFxuICAgICAgICBvYnNlcnZhY2FvOiBvYnMgfHwgbnVsbCxcbiAgICAgICAgY2xpZW50ZV9pZDogY2xpZW50ZUF0dWFsID8gY2xpZW50ZUF0dWFsLmlkIDogbnVsbCxcbiAgICAgICAgdGVsZWZvbmU6IGNsaWVudGVBdHVhbCA/IGNsaWVudGVBdHVhbC50ZWxlZm9uZSA6IG51bGxcbiAgICAgIH0pLFxuICAgICAgc2lnbmFsOiBjdHJsLnNpZ25hbFxuICAgIH0pO1xuICAgIGNsZWFyVGltZW91dCh0aWQpO1xuICAgIGlmIChyLm9rKSB7XG4gICAgICBjb25zdCBsb2MgPSByLmhlYWRlcnMuZ2V0KCdMb2NhdGlvbicpID8/ICcnO1xuICAgICAgY29uc3QgaWRNYXRjaCA9IGxvYy5tYXRjaCgvaWQ9ZXFcXC4oXFxkKykvKTtcbiAgICAgIGlmIChpZE1hdGNoKSB7XG4gICAgICAgIF9wZWRpZG9JZCA9IHBhcnNlSW50KGlkTWF0Y2hbMV0hLCAxMCk7XG4gICAgICAgIGlmIChjbGllbnRlQXR1YWwgJiYgY2xpZW50ZUF0dWFsLmlkKSB7XG4gICAgICAgICAgY2xpZW50ZVJlcG9zaXRvcnkudXBkYXRlRW5kZXJlY28oY2xpZW50ZUF0dWFsLmlkLCBlbmRlcmVjbylcbiAgICAgICAgICAgIC5jYXRjaCgoZTogdW5rbm93bikgPT4gbG9nLndhcm4oJ05cdTAwRTNvIGZvaSBwb3NzXHUwMEVEdmVsIHNhbHZhciBlbmRlcmVcdTAwRTdvJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsb2cud2FybignSU5TRVJUIHBlZGlkbyBmYWxob3UnLCB7IHN0YXR1czogci5zdGF0dXMgfSk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nLndhcm4oJ0Vycm8gYW8gc2FsdmFyIG5vIGJhbmNvIFx1MjAxNCBwZWRpZG8gdmFpIHNcdTAwRjMgcGVsbyBXaGF0c0FwcCcsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTtcbiAgfVxuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGlmIChidG5GaW4pIHsgYnRuRmluLmRpc2FibGVkID0gZmFsc2U7IGJ0bkZpbi50ZXh0Q29udGVudCA9IHR4dE9yaWc7IH1cbiAgfSwgMjAwMCk7XG5cbiAgLy8gUmVkaXJlY2lvbmFyIHBhcmEgV2hhdHNBcHBcbiAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd2EubWUvJyArIFdBX05VTUJFUiArICc/dGV4dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG1zZyksICdfYmxhbmsnKTtcblxuICBmZWNoYXJNb2RhbCgpO1xuXG4gIGlmIChfcGVkaWRvSWQpIHtcbiAgICBhcHBTdG9yZS5zZXRTdGF0ZSh7IHBlZGlkb0lkUGVuZGVudGU6IF9wZWRpZG9JZCB9KTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2FDb25maXJtQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gU2VtIElEIG5vIGJhbmNvIFx1MjAxNCBsaW1wYSBkaXJldG9cbiAgICBsaW1wYXJDYXJyaW5obygpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbmZpcm1hckVudmlvV0EoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGlkID0gYXBwU3RvcmUuZ2V0U3RhdGUoKS5wZWRpZG9JZFBlbmRlbnRlO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcud2FDb25maXJtLXNpbScpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghaWQpIHsgZmVjaGFyQ29uZmlybVdBKCk7IHJldHVybjsgfVxuICBpZiAoIWNsaWVudGVBdHVhbCB8fCAhY2xpZW50ZUF0dWFsLmlkKSB7IGZlY2hhckNvbmZpcm1XQSgpOyBsaW1wYXJDYXJyaW5obygpOyByZXR1cm47IH1cbiAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnQ29uZmlybWFuZG8uLi4nOyBidG4uZGlzYWJsZWQgPSB0cnVlOyB9XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBlZGlkb1JlcG9zaXRvcnkudXBkYXRlU3RhdHVzKGlkLCBjbGllbnRlQXR1YWwuaWQsICdjb25maXJtYWRvJyk7XG4gIGlmIChyZXN1bHQub2spIHtcbiAgICBpZiAoYnRuKSBidG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERjg5IFBlZGlkbyBjb25maXJtYWRvISc7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7IGZlY2hhckNvbmZpcm1XQSgpOyBsaW1wYXJDYXJyaW5obygpOyB9LCAxODAwKTtcbiAgfSBlbHNlIHtcbiAgICBsb2cud2FybignRXJybyBhbyBjb25maXJtYXIgcGVkaWRvJywgeyBlcnJvcjogcmVzdWx0LmVycm9yLm1lc3NhZ2UgfSk7XG4gICAgZmVjaGFyQ29uZmlybVdBKCk7XG4gICAgbGltcGFyQ2FycmluaG8oKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmZWNoYXJDb25maXJtV0EoKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3YUNvbmZpcm1CYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbiAgYXBwU3RvcmUuc2V0U3RhdGUoeyBwZWRpZG9JZFBlbmRlbnRlOiBudWxsIH0pO1xufVxuXG4vLyA9PT09PSBMT0dJTiBVSSA9PT09PVxuZnVuY3Rpb24gbWFzY2FyYVRlbGVmb25lKGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XG4gIGVsLnZhbHVlID0gYXBsaWNhck1hc2NhcmFUZWxlZm9uZShlbC52YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGVudHJhckNvbUNsaWVudGUoY2xpZW50ZVJhdzogQ2xpZW50ZSk6IHZvaWQge1xuICBjb25zdCBkb21haW5DbGllbnRlID0gQ2xpZW50ZUVudGl0eS5mcm9tREIoY2xpZW50ZVJhdyk7XG4gIGxvZ2luVXNlQ2FzZS5sb2dpbihkb21haW5DbGllbnRlKTtcblxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5PdmVybGF5JykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGNvbnN0IHVzdWFyaW9CYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb0JhcicpO1xuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4JztcbiAgY29uc3QgdXN1YXJpb05vbWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c3VhcmlvTm9tZScpO1xuICBpZiAodXN1YXJpb05vbWVFbCkgdXN1YXJpb05vbWVFbC50ZXh0Q29udGVudCA9IGNsaWVudGVSYXcubm9tZTtcbiAgY29uc3Qgcm9sZXRhQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkZsdXR1YW50ZScpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKHJvbGV0YUJ0bikgcm9sZXRhQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gIGNvbnN0IHVzdWFyaW9UZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb1RlbCcpO1xuICBpZiAodXN1YXJpb1RlbCkgdXN1YXJpb1RlbC50ZXh0Q29udGVudCA9IGNsaWVudGVSYXcudGVsZWZvbmUucmVwbGFjZSgvXihcXGR7Mn0pKFxcZHs1fSkoXFxkezR9KSQvLCAnKCQxKSAkMi0kMycpO1xuICBjb25zdCBpbnBOb21lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGlucE5vbWUpIGlucE5vbWUudmFsdWUgPSBjbGllbnRlUmF3Lm5vbWU7XG4gIGNvbnN0IGlucEVuZGVyZWNvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGw7XG4gIGlmIChpbnBFbmRlcmVjbyAmJiBjbGllbnRlUmF3LmVuZGVyZWNvKSBpbnBFbmRlcmVjby52YWx1ZSA9IGNsaWVudGVSYXcuZW5kZXJlY287XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhclRlbGVmb25lKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoX3ZlcmlmaWNhbmRvKSByZXR1cm47XG4gIGNvbnN0IHRlbElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCBlcnJvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luRXJybycpO1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZXRhcGFUZWxlZm9uZSBidXR0b24nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIGlmIChlcnJvKSBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ1ZlcmlmaWNhbmRvLi4uJzsgYnRuLmRpc2FibGVkID0gdHJ1ZTsgfVxuICBfdmVyaWZpY2FuZG8gPSB0cnVlO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxvZ2luVXNlQ2FzZS5leGVjdXRlKHRlbElucHV0LnZhbHVlKTtcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgY29uc3QgaXNVc2VyTXNnID0gcmVzdWx0LmVycm9yLm5hbWUgPT09ICdWYWxpZGF0aW9uRXJyb3InIHx8IHJlc3VsdC5lcnJvci5uYW1lID09PSAnUmF0ZUxpbWl0RXJyb3InO1xuICAgICAgY29uc3QgbXNnID0gaXNVc2VyTXNnXG4gICAgICAgID8gcmVzdWx0LmVycm9yLm1lc3NhZ2VcbiAgICAgICAgOiAnU2VtIGNvbmV4XHUwMEUzbyBjb20gbyBzZXJ2aWRvci4gVmVyaWZpcXVlIHN1YSBpbnRlcm5ldCBlIHRlbnRlIG5vdmFtZW50ZS4nO1xuICAgICAgbG9nLmVycm9yKCd2ZXJpZmljYXJUZWxlZm9uZSBmYWxob3UnLCB7IGVycm9yOiByZXN1bHQuZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSBtc2c7IGVycm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC52YWx1ZS5leGlzdGUgJiYgcmVzdWx0LnZhbHVlLmNsaWVudGUpIHtcbiAgICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLmNsaWVudGUudG9KU09OKCkgYXMgQ2xpZW50ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGV0YXBhVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhVGVsZWZvbmUnKTtcbiAgICAgIGNvbnN0IGV0YXBhQ2FkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhQ2FkYXN0cm8nKTtcbiAgICAgIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGlmIChldGFwYUNhZCkgZXRhcGFDYWQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAodGVsSW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCAmIHsgZGF0YXNldDogRE9NU3RyaW5nTWFwIH0pLmRhdGFzZXRbJ3RlbCddID0gdGVsSW5wdXQudmFsdWUucmVwbGFjZSgvXFxEL2csICcnKTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk5vbWUnKT8uZm9jdXMoKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIGlmIChlcnJvKSB7IGVycm8udGV4dENvbnRlbnQgPSAnU2VtIGNvbmV4XHUwMEUzbyBvdSBlcnJvIG5vIHNlcnZpZG9yLiBUZW50ZSBub3ZhbWVudGUuJzsgZXJyby5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgfVxuICB9IGZpbmFsbHkge1xuICAgIGlmIChidG4pIHsgYnRuLnRleHRDb250ZW50ID0gJ0NvbnRpbnVhciBcdTIxOTInOyBidG4uZGlzYWJsZWQgPSBmYWxzZTsgfVxuICAgIF92ZXJpZmljYW5kbyA9IGZhbHNlO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhZGFzdHJhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKF9jYWRhc3RyYW5kbykgcmV0dXJuO1xuICBjb25zdCBub21lSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5Ob21lJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgY29uc3QgdGVsSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5UZWxlZm9uZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IG5vbWUgPSBub21lSW5wdXQudmFsdWU7XG4gIGNvbnN0IHRlbCA9ICh0ZWxJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50ICYgeyBkYXRhc2V0OiBET01TdHJpbmdNYXAgfSkuZGF0YXNldFsndGVsJ10gPz8gJyc7XG4gIGNvbnN0IGVycm8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FkYXN0cm9FcnJvJyk7XG4gIGlmICghbm9tZS50cmltKCkpIHtcbiAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ0RpZ2l0ZSBzZXUgbm9tZS4nOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChlcnJvKSBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNldGFwYUNhZGFzdHJvIGJ1dHRvbicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnRW50cmFuZG8uLi4nOyBidG4uZGlzYWJsZWQgPSB0cnVlOyB9XG4gIF9jYWRhc3RyYW5kbyA9IHRydWU7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9naW5Vc2VDYXNlLnJlZ2lzdGVyKG5vbWUsIHRlbCwgJycpO1xuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICBjb25zdCBpc1VzZXJNc2cgPSByZXN1bHQuZXJyb3IubmFtZSA9PT0gJ1ZhbGlkYXRpb25FcnJvcicgfHwgcmVzdWx0LmVycm9yLm5hbWUgPT09ICdSYXRlTGltaXRFcnJvcic7XG4gICAgICBjb25zdCBjYWRhc3Ryb01zZyA9IGlzVXNlck1zZyA/IHJlc3VsdC5lcnJvci5tZXNzYWdlIDogJ0Vycm8gYW8gY2FkYXN0cmFyLiBWZXJpZmlxdWUgc3VhIGNvbmV4XHUwMEUzbyBlIHRlbnRlIG5vdmFtZW50ZS4nO1xuICAgICAgaWYgKGVycm8pIHsgZXJyby50ZXh0Q29udGVudCA9IGNhZGFzdHJvTXNnOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGVudHJhckNvbUNsaWVudGUocmVzdWx0LnZhbHVlLnRvSlNPTigpIGFzIENsaWVudGUpO1xuICB9IGNhdGNoIHtcbiAgICBpZiAoZXJybykgeyBlcnJvLnRleHRDb250ZW50ID0gJ0Vycm8gYW8gY2FkYXN0cmFyLiBWZXJpZmlxdWUgc3VhIGNvbmV4XHUwMEUzbyBlIHRlbnRlIG5vdmFtZW50ZS4nOyBlcnJvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGJ0bikgeyBidG4udGV4dENvbnRlbnQgPSAnRW50cmFyIG5vIGNhcmRcdTAwRTFwaW8gXHUyNzI4JzsgYnRuLmRpc2FibGVkID0gZmFsc2U7IH1cbiAgICBfY2FkYXN0cmFuZG8gPSBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2b2x0YXJFdGFwYVRlbGVmb25lKCk6IHZvaWQge1xuICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gIGNvbnN0IGV0YXBhVGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0YXBhVGVsZWZvbmUnKTtcbiAgaWYgKGV0YXBhQ2FkKSBldGFwYUNhZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBpZiAoZXRhcGFUZWwpIGV0YXBhVGVsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufVxuXG5mdW5jdGlvbiBzYWlyKCk6IHZvaWQge1xuICBpZiAoIWNvbmZpcm0oJ0Rlc2VqYSBzYWlyIGRhIHN1YSBjb250YT8nKSkgcmV0dXJuO1xuICBsb2dpblVzZUNhc2UubG9nb3V0KCk7XG4gIGNvbnN0IHVzdWFyaW9CYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXN1YXJpb0JhcicpO1xuICBpZiAodXN1YXJpb0JhcikgdXN1YXJpb0Jhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucE5vbWUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9ICcnO1xuICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2lucEVuZGVyZWNvJykgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWUgPSAnJztcbiAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpblRlbGVmb25lJykgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSAnJztcbiAgY29uc3QgZXRhcGFUZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXRhcGFUZWxlZm9uZScpO1xuICBjb25zdCBldGFwYUNhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdldGFwYUNhZGFzdHJvJyk7XG4gIGlmIChldGFwYVRlbCkgZXRhcGFUZWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIGlmIChldGFwYUNhZCkgZXRhcGFDYWQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luT3ZlcmxheScpIS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xufVxuXG5mdW5jdGlvbiBtb3N0cmFyTG9naW4oKTogdm9pZCB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbk92ZXJsYXknKSEuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgc2V0VGltZW91dCgoKSA9PiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ2luVGVsZWZvbmUnKSBhcyBIVE1MSW5wdXRFbGVtZW50KT8uZm9jdXMoKSwgMzAwKTtcbn1cblxuLy8gPT09PT0gUk9MRVRBIFVJID09PT09XG5hc3luYyBmdW5jdGlvbiBhYnJpclJvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQmFja2Ryb3AnKTtcbiAgaWYgKCFiZCkgcmV0dXJuO1xuICBiZC5jbGFzc0xpc3QuYWRkKCdhYmVydG8nKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdtb2RhbC1hYmVydG8nKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVN0YXR1c0JveCcpIS5pbm5lckhUTUwgPSAnJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluYXRpdmEnKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YU5hb0xvZ2FkbycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdHJ1Y29lcycpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUJ0bkVudmlhcldyYXAnKSEuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFXaGVlbFNlY3Rpb24nKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3UnKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJlc3VsdGFkbycpIS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpdmVsJyk7XG5cbiAgY29uc3QgY2ZnID0gYXdhaXQgY2FycmVnYXJDb25maWdSb2xldGEoKTtcbiAgY29uc3QgcHJlbWlvcyA9IGdldFByZW1pb3MoKTtcblxuICBjb25zdCBncmlkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVByZW1pb3NHcmlkJyk7XG4gIGlmIChncmlkKSB7XG4gICAgY29uc3QgaWNvbmVzID0gWydcdUQ4M0NcdURGNkInLCAnXHVEODNFXHVEREMxJywgJ1x1RDgzRFx1REU5QScsICdcdUQ4M0RcdURDQjgnLCAnXHVEODNEXHVEQ0IwJywgJ1x1RDgzQ1x1REY4OScsICdcdUQ4M0NcdURGNkUnLCAnXHVEODNDXHVERjgwJywgJ1x1RDgzQ1x1REYxRiddO1xuICAgIGdyaWQuaW5uZXJIVE1MID0gcHJlbWlvcy5tYXAoKHAsIGkpID0+IGA8ZGl2IGNsYXNzPVwicm9sZXRhLXByZW1pby1pdGVtXCI+JHtpY29uZXNbaSAlIGljb25lcy5sZW5ndGhdfSAke2VzY0hUTUwocCl9PC9kaXY+YCkuam9pbignJyk7XG4gIH1cblxuICBpZiAoY2ZnICYmICFjZmcuYXRpdmEpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5hdGl2YScpIS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhSW5zdHJ1Y29lcycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB9XG5cbiAgZGVzZW5oYXJSb2xldGEocHJlbWlvcyk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFXaGVlbFNlY3Rpb24nKSEuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgY29uc3QgY2xpZW50ZUF0dWFsID0gZ2V0Q2xpZW50ZUF0dWFsKCk7XG4gIGlmICghY2xpZW50ZUF0dWFsKSB7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YU5hb0xvZ2FkbycpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0cnVjb2VzJykhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgY29uc3QgZ2lyYXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhR2lyYXJCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gZmFsc2U7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMSc7IGdpcmFyQnRuLnRleHRDb250ZW50ID0gJ1x1RDgzQ1x1REZBMSBHSVJBUiBBR09SQSEnOyB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgYXR1YWxpemFyVUlSb2xldGEoc3RhdHVzKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQmFja2Ryb3AnKT8uY2xhc3NMaXN0LnJlbW92ZSgnYWJlcnRvJyk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtYWJlcnRvJyk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhclJvbGV0YUJhY2tkcm9wKGU6IEV2ZW50KTogdm9pZCB7XG4gIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAncm9sZXRhQmFja2Ryb3AnKSBmZWNoYXJSb2xldGEoKTtcbn1cblxuZnVuY3Rpb24gYXR1YWxpemFyVUlSb2xldGEoaW5mbzogUGFydGljaXBhY2FvIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBzdGF0dXNCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhU3RhdHVzQm94JykhO1xuICBjb25zdCBpbnN0cnVjb2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUluc3RydWNvZXMnKSE7XG4gIGNvbnN0IGJ0bkVudmlhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFCdG5FbnZpYXJXcmFwJykhO1xuICBjb25zdCB3aGVlbFNlY3Rpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhV2hlZWxTZWN0aW9uJykhO1xuICBjb25zdCBqYUdpcm91ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3UnKSE7XG4gIGNvbnN0IGdpcmFyQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUdpcmFyQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuXG4gIHdoZWVsU2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgZGVzZW5oYXJSb2xldGEoZ2V0UHJlbWlvcygpKTtcblxuICBpZiAoaXNDb250YVRlc3RlKGFwcFN0b3JlLmdldFN0YXRlKCkuY2xpZW50ZSkpIHtcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSBmYWxzZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcxJzsgZ2lyYXJCdG4udGV4dENvbnRlbnQgPSAnXHVEODNDXHVERkExIEdJUkFSIEFHT1JBISc7IH1cbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJyc7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIWluZm8pIHtcbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJyc7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICBidG5FbnZpYXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgZ2lyYXJCdG4udGl0bGUgPSAnRW52aWUgc3VhcyBwcm92YXMgcGFyYSBsaWJlcmFyIGEgcm9sZXRhJzsgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChpbmZvLnN0YXR1cyA9PT0gJ3BlbmRlbnRlJykge1xuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1zdGF0dXMtYm94IHJvbGV0YS1zdGF0dXMtcGVuZGVudGVcIj5cdTIzRjMgPGRpdj48c3Ryb25nPlBhcnRpY2lwYVx1MDBFN1x1MDBFM28gZW52aWFkYSE8L3N0cm9uZz48YnI+U3VhcyBwcm92YXMgZXN0XHUwMEUzbyBlbSBhblx1MDBFMWxpc2UuIEFndWFyZGUgYSBhcHJvdmFcdTAwRTdcdTAwRTNvIChhdFx1MDBFOSAyNGgpLjwvZGl2PjwvZGl2Pic7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBpZiAoZ2lyYXJCdG4pIHsgZ2lyYXJCdG4uZGlzYWJsZWQgPSB0cnVlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzAuNCc7IGdpcmFyQnRuLnRpdGxlID0gJ0FndWFyZGFuZG8gYXByb3ZhXHUwMEU3XHUwMEUzbyc7IH1cbiAgfSBlbHNlIGlmIChpbmZvLnN0YXR1cyA9PT0gJ3JlamVpdGFkbycpIHtcbiAgICBzdGF0dXNCb3guaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtc3RhdHVzLWJveCByb2xldGEtc3RhdHVzLXJlamVpdGFkb1wiPlx1Mjc0QyA8ZGl2PjxzdHJvbmc+UGFydGljaXBhXHUwMEU3XHUwMEUzbyBuXHUwMEUzbyBhcHJvdmFkYS48L3N0cm9uZz48YnI+VGVudGUgbm92YW1lbnRlIGN1bXByaW5kbyB0b2RvcyBvcyByZXF1aXNpdG9zLjwvZGl2PjwvZGl2Pic7XG4gICAgaW5zdHJ1Y29lcy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gdHJ1ZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyB9XG4gIH0gZWxzZSBpZiAoaW5mby5zdGF0dXMgPT09ICdhcHJvdmFkbycgJiYgIWluZm8uamFfZ2lyb3UpIHtcbiAgICBjb25zdCBob2plID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XG4gICAgY29uc3QgZGlhQXByb3ZhY2FvID0gaW5mby5kYXRhX2Fwcm92YWNhbyA/IGluZm8uZGF0YV9hcHJvdmFjYW8uc3BsaXQoJ1QnKVswXSA6IG51bGw7XG4gICAgaWYgKGRpYUFwcm92YWNhbyAhPT0gaG9qZSkge1xuICAgICAgc3RhdHVzQm94LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLXN0YXR1cy1ib3ggcm9sZXRhLXN0YXR1cy1yZWplaXRhZG9cIj5cdTIzRjAgPGRpdj48c3Ryb25nPlByYXpvIGV4cGlyYWRvLjwvc3Ryb25nPjxicj5Wb2NcdTAwRUEgZm9pIGFwcm92YWRvIGVtIG91dHJvIGRpYSBlIG5cdTAwRTNvIGdpcm91IGEgdGVtcG8uIEVudmllIG5vdmFzIHByb3ZhcyBwYXJhIHBhcnRpY2lwYXIgbm92YW1lbnRlLjwvZGl2PjwvZGl2Pic7XG4gICAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgamFHaXJvdS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgaWYgKGdpcmFyQnRuKSB7IGdpcmFyQnRuLmRpc2FibGVkID0gdHJ1ZTsgZ2lyYXJCdG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyBnaXJhckJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0RcdUREMTIgUHJhem8gZXhwaXJhZG8nOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1zdGF0dXMtYm94IHJvbGV0YS1zdGF0dXMtYXByb3ZhZG9cIj5cdTI3MDUgPGRpdj48c3Ryb25nPkFwcm92YWRvISBHaXJlIGhvamUhPC9zdHJvbmc+PGJyPlZvY1x1MDBFQSB0ZW0gYXRcdTAwRTkgbWVpYS1ub2l0ZSBwYXJhIHVzYXIgc2V1IGdpcm8uIE5cdTAwRTNvIGFjdW11bGEhPC9kaXY+PC9kaXY+JztcbiAgICAgIGluc3RydWNvZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgYnRuRW52aWFyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGphR2lyb3Uuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBnaXJhckJ0bi5zdHlsZS5vcGFjaXR5ID0gJzEnOyBnaXJhckJ0bi50ZXh0Q29udGVudCA9ICdcdUQ4M0NcdURGQTEgR0lSQVIgQUdPUkEhJzsgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChpbmZvLmphX2dpcm91ICYmICFpc0NvbnRhVGVzdGUoYXBwU3RvcmUuZ2V0U3RhdGUoKS5jbGllbnRlKSkge1xuICAgIHN0YXR1c0JveC5pbm5lckhUTUwgPSAnJztcbiAgICBpbnN0cnVjb2VzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IGJ0bkVudmlhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBqYUdpcm91LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIGlmIChnaXJhckJ0bikgeyBnaXJhckJ0bi5kaXNhYmxlZCA9IHRydWU7IGdpcmFyQnRuLnN0eWxlLm9wYWNpdHkgPSAnMC40JzsgfVxuICAgIGNvbnN0IHByZW1pb0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUphR2lyb3VQcmVtaW8nKTtcbiAgICBpZiAocHJlbWlvRWwpIHtcbiAgICAgIHByZW1pb0VsLmlubmVySFRNTCA9IGluZm8ucHJlbWlvXG4gICAgICAgID8gJ1NldSBwclx1MDBFQW1pbyBmb2k6IDxzdHJvbmcgc3R5bGU9XCJjb2xvcjp2YXIoLS1yb3NhKVwiPicgKyBlc2NIVE1MKGluZm8ucHJlbWlvKSArICc8L3N0cm9uZz4uIEVudHJlIGVtIGNvbnRhdG8gY29ub3NjbyBwYXJhIHJlc2dhdGFyISdcbiAgICAgICAgOiAnVm9jXHUwMEVBIGpcdTAwRTEgdXNvdSBzdWEgY2hhbmNlIG5lc3RhIGNhbXBhbmhhLic7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdpcmFyUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjbGllbnRlQXR1YWwgPSBnZXRDbGllbnRlQXR1YWwoKTtcbiAgaWYgKCFjbGllbnRlQXR1YWwpIHsgbW9zdHJhclRvYXN0KCdGYVx1MDBFN2EgbG9naW4gcGFyYSBnaXJhciBhIHJvbGV0YSEnLCAnZXJybycpOyByZXR1cm47IH1cblxuICBjb25zdCBzdGF0dXNHaXJvID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgaWYgKCFpc0NvbnRhVGVzdGUoYXBwU3RvcmUuZ2V0U3RhdGUoKS5jbGllbnRlKSkge1xuICAgIGlmICghc3RhdHVzR2lybyB8fCBzdGF0dXNHaXJvLnN0YXR1cyAhPT0gJ2Fwcm92YWRvJyB8fCBzdGF0dXNHaXJvLmphX2dpcm91KSB7XG4gICAgICBtb3N0cmFyVG9hc3QoJ1ZvY1x1MDBFQSBwcmVjaXNhIHNlciBhcHJvdmFkbyBwZWxhIGVxdWlwZSBhbnRlcyBkZSBnaXJhciEnLCAnZXJybycpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2VtYW5hID0gZ2V0U2VtYW5hQXR1YWwoKTtcbiAgICAgIGNvbnN0IGNvdW50UmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5jb3VudFZlbmNlZG9yZXNTZW1hbmEoc2VtYW5hKTtcbiAgICAgIGNvbnN0IHZlbmNlZG9yZXNDb3VudCA9IGNvdW50UmVzdWx0Lm9rID8gY291bnRSZXN1bHQudmFsdWUgOiAwO1xuXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goYCR7U1VQQUJBU0VfVVJMfS9yZXN0L3YxL3JvbGV0YV9jb25maWc/aWQ9ZXEuMSZzZWxlY3Q9bWF4X3ZlbmNlZG9yZXNfc2VtYW5hYCwge1xuICAgICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfVxuICAgICAgfSk7XG4gICAgICBjb25zdCBjZmcgPSBhd2FpdCByZXNwLmpzb24oKSBhcyBBcnJheTx7IG1heF92ZW5jZWRvcmVzX3NlbWFuYTogbnVtYmVyIH0+O1xuICAgICAgY29uc3QgbGltaXRlID0gY2ZnWzBdPy5tYXhfdmVuY2Vkb3Jlc19zZW1hbmEgPz8gMTtcbiAgICAgIGlmICh2ZW5jZWRvcmVzQ291bnQgPj0gbGltaXRlKSB7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFHaXJhckJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcbiAgICAgICAgaWYgKGJ0bikgeyBidG4uZGlzYWJsZWQgPSB0cnVlOyBidG4uc3R5bGUub3BhY2l0eSA9ICcwLjQnOyB9XG4gICAgICAgIGNvbnN0IHJlc3VsdEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJlc3VsdGFkbycpO1xuICAgICAgICBpZiAocmVzdWx0RWwpIHtcbiAgICAgICAgICByZXN1bHRFbC5pbm5lckhUTUwgPSAnXHUyNkEwXHVGRTBGIDxzdHJvbmc+Slx1MDBFMSB0ZW1vcyB1bSBnYW5oYWRvciBlc3RhIHNlbWFuYSE8L3N0cm9uZz48YnI+PHNtYWxsPkEgcHJcdTAwRjN4aW1hIHJvZGFkYSBjb21lXHUwMEU3YSBuYSBzZW1hbmEgcXVlIHZlbS4gRmlxdWUgZGUgb2xobyE8L3NtYWxsPic7XG4gICAgICAgICAgcmVzdWx0RWwuY2xhc3NMaXN0LmFkZCgndmlzaXZlbCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7IGxvZy53YXJuKCdFcnJvIGFvIHZlcmlmaWNhciBsaW1pdGUgc2VtYW5hbCcsIHsgZXJyb3I6IFN0cmluZyhlKSB9KTsgfVxuICB9XG5cbiAgYXdhaXQgZ2lyYXJSb2xldGFGbihjbGllbnRlQXR1YWwsIChwcmVtaW86IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHJlc3VsdEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YVJlc3VsdGFkbycpO1xuICAgIGlmIChyZXN1bHRFbCkge1xuICAgICAgcmVzdWx0RWwuaW5uZXJIVE1MID0gJ1x1RDgzQ1x1REY4OSBWb2NcdTAwRUEgZ2FuaG91OiA8c3Ryb25nIHN0eWxlPVwiY29sb3I6dmFyKC0tcm9zYSlcIj4nICsgZXNjSFRNTChwcmVtaW8pICsgJzwvc3Ryb25nPiE8YnI+PHNtYWxsIHN0eWxlPVwiZm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tdGV4dG8tc2VjKVwiPkVudHJlIGVtIGNvbnRhdG8gY29ub3NjbyBwZWxvIFdoYXRzQXBwIHBhcmEgcmVzZ2F0YXIgc2V1IHByXHUwMEVBbWlvITwvc21hbGw+JztcbiAgICAgIHJlc3VsdEVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2l2ZWwnKTtcbiAgICB9XG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUdpcmFyQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsO1xuICAgIGlmIChidG4pIGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTMgR2lyYWRvISc7XG4gICAgc2FsdmFyVmVuY2Vkb3IoY2xpZW50ZUF0dWFsLCBwcmVtaW8pLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW52aWFyUHJvdmFzV2hhdHNBcHAoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuICBpZiAoIWNsaWVudGVBdHVhbCkgeyBhbGVydCgnRmFcdTAwRTdhIGxvZ2luIGFudGVzIGRlIGVudmlhciBzdWFzIHByb3Zhcy4nKTsgcmV0dXJuOyB9XG4gIGNvbnN0IHN0YXR1c0F0dWFsID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgaWYgKHN0YXR1c0F0dWFsICYmIChzdGF0dXNBdHVhbC5zdGF0dXMgPT09ICdwZW5kZW50ZScgfHwgc3RhdHVzQXR1YWwuc3RhdHVzID09PSAnYXByb3ZhZG8nKSkge1xuICAgIGF0dWFsaXphclVJUm9sZXRhKHN0YXR1c0F0dWFsKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgbm9tZSA9IGNsaWVudGVBdHVhbC5ub21lIHx8ICcnO1xuICBjb25zdCB0ZWwgPSBjbGllbnRlQXR1YWwudGVsZWZvbmUgfHwgJyc7XG4gIGNvbnN0IGluc3RFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb2xldGFJbnN0YWdyYW1JbnB1dCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsO1xuICBjb25zdCBpbnN0YWdyYW0gPSBpbnN0RWwgPyBpbnN0RWwudmFsdWUudHJpbSgpIDogJyc7XG4gIGNvbnN0IG1zZyA9IGBPbFx1MDBFMSwgZXF1aXBlIEdlbGFtb3VyISBRdWVybyBwYXJ0aWNpcGFyIGRhIFJvbGV0YSBWSVAuXFxuXFxuTm9tZTogJHtub21lfVxcblRlbGVmb25lOiAke3RlbH0ke2luc3RhZ3JhbSA/ICdcXG5JbnN0YWdyYW06ICcgKyBpbnN0YWdyYW0gOiAnJ31cXG5cXG5Fc3RvdSBlbnZpYW5kbyBhIGZvdG8gZG9zIG1ldXMgNSBhZGVzaXZvcyBlIG8gcHJpbnQgZG8gU3RvcnkgcGFyYSB2YWxpZGFcdTAwRTdcdTAwRTNvIWA7XG4gIHdpbmRvdy5vcGVuKCdodHRwczovL3dhLm1lLycgKyBXQV9OVU1CRVIgKyAnP3RleHQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChtc2cpLCAnX2JsYW5rJyk7XG4gIGF3YWl0IHJlZ2lzdHJhclBhcnRpY2lwYWNhbyhpbnN0YWdyYW0pO1xuICBhdHVhbGl6YXJVSVJvbGV0YSh7IHN0YXR1czogJ3BlbmRlbnRlJywgamFfZ2lyb3U6IGZhbHNlIH0gYXMgUGFydGljaXBhY2FvKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVnaXN0cmFyUGFydGljaXBhY2FvKGluc3RhZ3JhbTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuICBpZiAoIWNsaWVudGVBdHVhbCkgcmV0dXJuO1xuICB0cnkge1xuICAgIGNvbnN0IGNoZWNrID0gYXdhaXQgdmVyaWZpY2FyU3RhdHVzUm9sZXRhKGNsaWVudGVBdHVhbC5pZCA/PyAwKTtcbiAgICBpZiAoY2hlY2sgJiYgY2hlY2suc3RhdHVzICE9PSAncmVqZWl0YWRvJykgcmV0dXJuO1xuICAgIGNvbnN0IHNlbWFuYSA9IGdldFNlbWFuYUF0dWFsKCk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcm9sZXRhUmVwb3NpdG9yeS5zYXZlUGFydGljaXBhY2FvKHtcbiAgICAgIG5vbWU6IGNsaWVudGVBdHVhbC5ub21lLFxuICAgICAgdGVsZWZvbmU6IGNsaWVudGVBdHVhbC50ZWxlZm9uZSxcbiAgICAgIGluc3RhZ3JhbTogaW5zdGFncmFtIHx8IHVuZGVmaW5lZCxcbiAgICAgIHN0YXR1czogJ3BlbmRlbnRlJyxcbiAgICAgIHNlbWFuYSxcbiAgICAgIGphX2dpcm91OiBmYWxzZSxcbiAgICAgIGNyZWF0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9IGFzIGltcG9ydCgnLi9kb21haW4vcm9sZXRhJykuUGFydGljaXBhY2FvUHJvcHMpO1xuICAgIGlmIChyZXN1bHQub2spIHtcbiAgICAgIHNldFBhcnRpY2lwYWNhb0lkKHJlc3VsdC52YWx1ZS5pZCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7IGxvZy53YXJuKCdFcnJvIGFvIHJlZ2lzdHJhciBwYXJ0aWNpcGFcdTAwRTdcdTAwRTNvJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pOyB9XG59XG5cbi8vID09PT09IEFETUlOIFJPTEVUQSA9PT09PVxuZnVuY3Rpb24gdmVyaWZpY2FyQWRtaW4oKTogYm9vbGVhbiB7XG4gIHJldHVybiBhcHBTdG9yZS5nZXRTdGF0ZSgpLmlzQWRtaW47XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFicmlyUm9sZXRhQWRtaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghdmVyaWZpY2FyQWRtaW4oKSkgeyBhbGVydCgnQWNlc3NvIHJlc3RyaXRvLicpOyByZXR1cm47IH1cbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JvbGV0YUFkbWluQmFja2Ryb3AnKT8uY2xhc3NMaXN0LmFkZCgnYWJlcnRvJyk7XG4gIGF3YWl0IGNhcnJlZ2FyUGFydGljaXBhbnRlc1JvbGV0YSgpO1xuICBhd2FpdCBjYXJyZWdhckNvbmZpZ0FkbWluKCk7XG59XG5cbmZ1bmN0aW9uIGZlY2hhclJvbGV0YUFkbWluKCk6IHZvaWQge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9sZXRhQWRtaW5CYWNrZHJvcCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdhYmVydG8nKTtcbn1cblxuZnVuY3Rpb24gZmVjaGFyUm9sZXRhQWRtaW5CYWNrZHJvcChlOiBFdmVudCk6IHZvaWQge1xuICBpZiAoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gJ3JvbGV0YUFkbWluQmFja2Ryb3AnKSBmZWNoYXJSb2xldGFBZG1pbigpO1xufVxuXG5mdW5jdGlvbiBhYnJpclRhYkFkbWluKHRhYjogc3RyaW5nLCBidG46IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb2xldGEtYWRtaW4tdGFiJykuZm9yRWFjaCh0ID0+IHQuY2xhc3NMaXN0LnJlbW92ZSgnYXRpdm8nKSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yb2xldGEtYWRtaW4tcGFuZWwnKS5mb3JFYWNoKHAgPT4gcC5jbGFzc0xpc3QucmVtb3ZlKCdhdGl2bycpKTtcbiAgYnRuLmNsYXNzTGlzdC5hZGQoJ2F0aXZvJyk7XG4gIGNvbnN0IHRhYklkID0gJ3RhYicgKyB0YWIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0YWIuc2xpY2UoMSk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhYklkKT8uY2xhc3NMaXN0LmFkZCgnYXRpdm8nKTtcbiAgaWYgKHRhYiA9PT0gJ3BlbmRlbnRlcycpIGNhcnJlZ2FyUGFydGljaXBhbnRlc1JvbGV0YSgpO1xuICBlbHNlIGlmICh0YWIgPT09ICdhcHJvdmFkb3MnKSBjYXJyZWdhckFwcm92YWRvc1JvbGV0YSgpO1xuICBlbHNlIGlmICh0YWIgPT09ICd2ZW5jZWRvcmVzJykgY2FycmVnYXJWZW5jZWRvcmVzUm9sZXRhKCk7XG4gIGVsc2UgaWYgKHRhYiA9PT0gJ2NvbmZpZycpIGNhcnJlZ2FyQ29uZmlnQWRtaW4oKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJQYXJ0aWNpcGFudGVzUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0YVBlbmRlbnRlcycpO1xuICBpZiAoIWVsKSByZXR1cm47XG4gIGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+Q2FycmVnYW5kby4uLjwvZGl2Pic7XG4gIHRyeSB7XG4gICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFNVUEFCQVNFX1VSTCArICcvcmVzdC92MS9yb2xldGFfcGFydGljaXBhY29lcz9zdGF0dXM9ZXEucGVuZGVudGUmb3JkZXI9Y3JlYXRlZF9hdC5kZXNjJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8UGFydGljaXBhY2FvPjtcbiAgICBpZiAoIWRhdGEgfHwgIWRhdGEubGVuZ3RoKSB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+TmVuaHVtIHBhcnRpY2lwYW50ZSBwZW5kZW50ZS48L2Rpdj4nOyByZXR1cm47IH1cbiAgICBlbC5pbm5lckhUTUwgPSBkYXRhLm1hcChwID0+IHtcbiAgICAgIGNvbnN0IGR0ID0gbmV3IERhdGUocC5jcmVhdGVkX2F0KS50b0xvY2FsZVN0cmluZygncHQtQlInKTtcbiAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtaXRlbVwiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtaW5mb1wiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtbm9tZVwiPicgKyBlc2NIVE1MKHAubm9tZSA/PyAnJykgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXBhcnRpY2lwYW50ZS10ZWxcIj4nICsgZXNjSFRNTChwLnRlbGVmb25lKSArIChwLmluc3RhZ3JhbSA/ICcgXHUwMEI3IEAnICsgZXNjSFRNTChwLmluc3RhZ3JhbSkgOiAnJykgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjExcHg7Y29sb3I6Izk5OVwiPicgKyBkdCArICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtYWNvZXNcIj4nICtcbiAgICAgICAgJzxidXR0b24gY2xhc3M9XCJidG4tYXByb3ZhclwiIG9uY2xpY2s9XCJhcHJvdmFyUGFydGljaXBhbnRlKCcgKyBwLmlkICsgJywgdGhpcylcIj5cdTI3MTMgQXByb3ZhcjwvYnV0dG9uPicgK1xuICAgICAgICAnPGJ1dHRvbiBjbGFzcz1cImJ0bi1yZWplaXRhclwiIG9uY2xpY2s9XCJyZWplaXRhclBhcnRpY2lwYW50ZSgnICsgcC5pZCArICcsIHRoaXMpXCI+XHUyNzE3IFJlamVpdGFyPC9idXR0b24+JyArXG4gICAgICAgICc8L2Rpdj48L2Rpdj4nO1xuICAgIH0pLmpvaW4oJycpO1xuICB9IGNhdGNoIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5FcnJvIGFvIGNhcnJlZ2FyLjwvZGl2Pic7IH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJBcHJvdmFkb3NSb2xldGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpc3RhQXByb3ZhZG9zJyk7XG4gIGlmICghZWwpIHJldHVybjtcbiAgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5DYXJyZWdhbmRvLi4uPC9kaXY+JztcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9wYXJ0aWNpcGFjb2VzP3N0YXR1cz1lcS5hcHJvdmFkbyZvcmRlcj1kYXRhX2Fwcm92YWNhby5kZXNjJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8UGFydGljaXBhY2FvPjtcbiAgICBpZiAoIWRhdGEgfHwgIWRhdGEubGVuZ3RoKSB7IGVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicm9sZXRhLWVtcHR5XCI+TmVuaHVtIGFwcm92YWRvIGFpbmRhLjwvZGl2Pic7IHJldHVybjsgfVxuICAgIGVsLmlubmVySFRNTCA9IGRhdGEubWFwKHAgPT4ge1xuICAgICAgY29uc3QgZHQgPSBwLmRhdGFfYXByb3ZhY2FvID8gbmV3IERhdGUocC5kYXRhX2Fwcm92YWNhbykudG9Mb2NhbGVTdHJpbmcoJ3B0LUJSJykgOiAnXHUyMDE0JztcbiAgICAgIGNvbnN0IGdpcm91ID0gcC5qYV9naXJvdSA/ICdcdTI3MTMgR2lyb3UgXHUyMDE0ICcgKyBlc2NIVE1MKHAucHJlbWlvID8/ICcnKSA6ICdcdTIzRjMgQWd1YXJkYW5kbyBnaXJhcic7XG4gICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWl0ZW1cIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLWluZm9cIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJyb2xldGEtcGFydGljaXBhbnRlLW5vbWVcIj4nICsgZXNjSFRNTChwLm5vbWUgPz8gJycpICsgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS1wYXJ0aWNpcGFudGUtdGVsXCI+JyArIGVzY0hUTUwocC50ZWxlZm9uZSkgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IHN0eWxlPVwiZm9udC1zaXplOjExcHg7Y29sb3I6IzM4OGUzY1wiPicgKyBnaXJvdSArICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgc3R5bGU9XCJmb250LXNpemU6MTFweDtjb2xvcjojOTk5XCI+QXByb3ZhZG8gZW06ICcgKyBkdCArICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PjwvZGl2Pic7XG4gICAgfSkuam9pbignJyk7XG4gIH0gY2F0Y2ggeyBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkVycm8gYW8gY2FycmVnYXIuPC9kaXY+JzsgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBhcHJvdmFyUGFydGljaXBhbnRlKGlkOiBudW1iZXIsIGJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgYnRuLmRpc2FibGVkID0gdHJ1ZTsgYnRuLnRleHRDb250ZW50ID0gJy4uLic7XG4gIGNvbnN0IGNsaWVudGVBdHVhbCA9IGdldENsaWVudGVBdHVhbCgpO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/aWQ9ZXEuJyArIGlkLCB7XG4gICAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxuICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04sICdQcmVmZXInOiAncmV0dXJuPW1pbmltYWwnXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzdGF0dXM6ICdhcHJvdmFkbycsXG4gICAgICAgIGRhdGFfYXByb3ZhY2FvOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGFwcm92YWRvX3BvcjogY2xpZW50ZUF0dWFsID8gY2xpZW50ZUF0dWFsLm5vbWUgOiAnYWRtaW4nXG4gICAgICB9KVxuICAgIH0pO1xuICAgIGlmICghci5vaykgdGhyb3cgbmV3IEVycm9yKCdzdGF0dXMgJyArIHIuc3RhdHVzKTtcbiAgICBidG4uY2xvc2VzdCgnLnJvbGV0YS1wYXJ0aWNpcGFudGUtaXRlbScpPy5yZW1vdmUoKTtcbiAgfSBjYXRjaCB7XG4gICAgYnRuLmRpc2FibGVkID0gZmFsc2U7IGJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTMgQXByb3Zhcic7XG4gICAgYWxlcnQoJ0Vycm8gYW8gYXByb3Zhci4nKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiByZWplaXRhclBhcnRpY2lwYW50ZShpZDogbnVtYmVyLCBidG46IEhUTUxCdXR0b25FbGVtZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghY29uZmlybSgnUmVqZWl0YXIgZXN0YSBwYXJ0aWNpcGFcdTAwRTdcdTAwRTNvPycpKSByZXR1cm47XG4gIGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi50ZXh0Q29udGVudCA9ICcuLi4nO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3BhcnRpY2lwYWNvZXM/aWQ9ZXEuJyArIGlkLCB7XG4gICAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLFxuICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04sICdQcmVmZXInOiAncmV0dXJuPW1pbmltYWwnXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdGF0dXM6ICdyZWplaXRhZG8nIH0pXG4gICAgfSk7XG4gICAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ3N0YXR1cyAnICsgci5zdGF0dXMpO1xuICAgIGJ0bi5jbG9zZXN0KCcucm9sZXRhLXBhcnRpY2lwYW50ZS1pdGVtJyk/LnJlbW92ZSgpO1xuICB9IGNhdGNoIHtcbiAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTsgYnRuLnRleHRDb250ZW50ID0gJ1x1MjcxNyBSZWplaXRhcic7XG4gICAgYWxlcnQoJ0Vycm8gYW8gcmVqZWl0YXIuJyk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJWZW5jZWRvcmVzUm9sZXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0YVZlbmNlZG9yZXMnKTtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICBlbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInJvbGV0YS1lbXB0eVwiPkNhcnJlZ2FuZG8uLi48L2Rpdj4nO1xuICB0cnkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaChTVVBBQkFTRV9VUkwgKyAnL3Jlc3QvdjEvcm9sZXRhX3ZlbmNlZG9yZXM/b3JkZXI9Y3JlYXRlZF9hdC5kZXNjJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8eyBub21lPzogc3RyaW5nOyBwcmVtaW86IHN0cmluZzsgdGVsZWZvbmU/OiBzdHJpbmc7IHNlbWFuYT86IHN0cmluZzsgY3JlYXRlZF9hdDogc3RyaW5nIH0+O1xuICAgIGlmICghZGF0YSB8fCAhZGF0YS5sZW5ndGgpIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5OZW5odW0gdmVuY2Vkb3IgYWluZGEuPC9kaXY+JzsgcmV0dXJuOyB9XG4gICAgZWwuaW5uZXJIVE1MID0gZGF0YS5tYXAodiA9PiB7XG4gICAgICBjb25zdCBkdCA9IG5ldyBEYXRlKHYuY3JlYXRlZF9hdCkudG9Mb2NhbGVTdHJpbmcoJ3B0LUJSJyk7XG4gICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJyb2xldGEtdmVuY2Vkb3ItaXRlbVwiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInJvbGV0YS12ZW5jZWRvci1ub21lXCI+XHVEODNDXHVERkM2ICcgKyBlc2NIVE1MKHYubm9tZSA/PyAnXHUyMDE0JykgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXZlbmNlZG9yLXByZW1pb1wiPlx1RDgzQ1x1REY4MSAnICsgZXNjSFRNTCh2LnByZW1pbykgKyAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwicm9sZXRhLXZlbmNlZG9yLWRhdGFcIj4nICsgZXNjSFRNTCh2LnRlbGVmb25lID8/ICcnKSArICcgXHUwMEI3IFNlbWFuYSAnICsgZXNjSFRNTCh2LnNlbWFuYSA/PyAnJykgKyAnIFx1MDBCNyAnICsgZHQgKyAnPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nO1xuICAgIH0pLmpvaW4oJycpO1xuICB9IGNhdGNoIHsgZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJyb2xldGEtZW1wdHlcIj5FcnJvIGFvIGNhcnJlZ2FyLjwvZGl2Pic7IH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FycmVnYXJDb25maWdBZG1pbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9jb25maWc/aWQ9ZXEuMSZsaW1pdD0xJywge1xuICAgICAgaGVhZGVyczogeyAnYXBpa2V5JzogU1VQQUJBU0VfQU5PTiwgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBTVVBBQkFTRV9BTk9OIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8eyBhdGl2YTogYm9vbGVhbjsgcHJlbWlvczogc3RyaW5nW10gfT47XG4gICAgaWYgKGRhdGEgJiYgZGF0YVswXSkge1xuICAgICAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25maWdBdGl2YScpIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmNoZWNrZWQgPSBkYXRhWzBdIS5hdGl2YTtcbiAgICAgIGNvbnN0IHByZW1pb3MgPSBBcnJheS5pc0FycmF5KGRhdGFbMF0hLnByZW1pb3MpID8gZGF0YVswXSEucHJlbWlvcyA6IGdldFByZW1pb3NQYWRyYW8oKTtcbiAgICAgIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnUHJlbWlvcycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlID0gcHJlbWlvcy5qb2luKCdcXG4nKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHsgbG9nLndhcm4oJ0Vycm8gYW8gY2FycmVnYXIgY29uZmlnIGFkbWluJywgeyBlcnJvcjogU3RyaW5nKGUpIH0pOyB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNhbHZhckNvbmZpZ1JvbGV0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYXRpdmEgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ0F0aXZhJykgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZDtcbiAgY29uc3QgcHJlbWlvc1R4dCA9IChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmlnUHJlbWlvcycpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlO1xuICBjb25zdCBwcmVtaW9zID0gcHJlbWlvc1R4dC5zcGxpdCgnXFxuJykubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihzID0+IHMubGVuZ3RoID4gMCk7XG4gIGNvbnN0IG1zZ0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmZpZ01zZycpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3JvbGV0YV9jb25maWc/aWQ9ZXEuMScsIHtcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ2FwaWtleSc6IFNVUEFCQVNFX0FOT04sXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgU1VQQUJBU0VfQU5PTiwgJ1ByZWZlcic6ICdyZXR1cm49bWluaW1hbCdcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGF0aXZhLCBwcmVtaW9zLCB1cGRhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSlcbiAgICB9KTtcbiAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcignc3RhdHVzICcgKyByLnN0YXR1cyk7XG4gICAgc2V0UHJlbWlvcyhwcmVtaW9zKTtcbiAgICBpZiAobXNnRWwpIHsgbXNnRWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IHNldFRpbWVvdXQoKCkgPT4geyBtc2dFbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9LCAyNTAwKTsgfVxuICB9IGNhdGNoIHsgYWxlcnQoJ0Vycm8gYW8gc2FsdmFyIGNvbmZpZ3VyYVx1MDBFN1x1MDBGNWVzLicpOyB9XG59XG5cbi8vID09PT09IElOSVQgPT09PT1cbmZ1bmN0aW9uIGluaXRGaWx0cm9zVGlja2VyKCk6IHZvaWQge1xuICBjb25zdCB3cmFwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRyb3Mtd3JhcCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgY29uc3QgdHJhY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZmlsdHJvcycpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKCF3cmFwIHx8ICF0cmFjaykgcmV0dXJuO1xuXG4gIGxldCBwb3MgPSAwO1xuICBsZXQgYXV0b0RpciA9IC0xO1xuICBjb25zdCBBVVRPX1NQRUVEID0gMC41NTtcbiAgbGV0IGlzQXV0byA9IHRydWU7XG5cbiAgbGV0IGRyYWdnaW5nID0gZmFsc2U7XG4gIGxldCBkcmFnU3RhcnRDbGllbnRYID0gMDtcbiAgbGV0IGRyYWdTdGFydFBvcyA9IDA7XG4gIGxldCB2ZWxTYW1wbGVzOiBudW1iZXJbXSA9IFtdO1xuICBsZXQgcHJldkNsaWVudFggPSAwO1xuICBsZXQgcHJldlRpbWUgPSAwO1xuICBsZXQgaW5lcnRpYVZlbCA9IDA7XG4gIGxldCBpbmVydGlhT24gPSBmYWxzZTtcbiAgbGV0IHJlc3VtZVRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0IGdldE1pbiA9ICgpOiBudW1iZXIgPT4gTWF0aC5taW4oMCwgd3JhcCEuY2xpZW50V2lkdGggLSB0cmFjayEuc2Nyb2xsV2lkdGgpO1xuICBjb25zdCBnZXRNYXggPSAoKTogbnVtYmVyID0+IDA7XG5cbiAgZnVuY3Rpb24gYXBwbHlQb3MobmV3UG9zOiBudW1iZXIpOiB2b2lkIHtcbiAgICBwb3MgPSBuZXdQb3M7XG4gICAgdHJhY2shLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGVYKCR7cG9zfXB4KWA7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWxSZXN1bWUoKTogdm9pZCB7XG4gICAgaWYgKHJlc3VtZVRpbWVyICE9PSBudWxsKSB7IGNsZWFyVGltZW91dChyZXN1bWVUaW1lcik7IHJlc3VtZVRpbWVyID0gbnVsbDsgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2NoZWR1bGVSZXN1bWUobXM6IG51bWJlcik6IHZvaWQge1xuICAgIGNhbmNlbFJlc3VtZSgpO1xuICAgIHJlc3VtZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpc0F1dG8gPSB0cnVlO1xuICAgICAgaW5lcnRpYU9uID0gZmFsc2U7XG4gICAgICBpbmVydGlhVmVsID0gMDtcbiAgICAgIHJlc3VtZVRpbWVyID0gbnVsbDtcbiAgICB9LCBtcyk7XG4gIH1cblxuICBmdW5jdGlvbiB0aWNrKCk6IHZvaWQge1xuICAgIGlmICghZHJhZ2dpbmcpIHtcbiAgICAgIGlmIChpbmVydGlhT24pIHtcbiAgICAgICAgaW5lcnRpYVZlbCAqPSAwLjkyO1xuICAgICAgICBjb25zdCBtaW4gPSBnZXRNaW4oKSwgbWF4ID0gZ2V0TWF4KCk7XG4gICAgICAgIGNvbnN0IG5leHQgPSBwb3MgKyBpbmVydGlhVmVsO1xuICAgICAgICBpZiAobmV4dCA+IG1heCB8fCBuZXh0IDwgbWluKSB7XG4gICAgICAgICAgYXBwbHlQb3MoTWF0aC5tYXgobWluLCBNYXRoLm1pbihtYXgsIG5leHQpKSk7XG4gICAgICAgICAgaW5lcnRpYU9uID0gZmFsc2U7XG4gICAgICAgICAgc2NoZWR1bGVSZXN1bWUoNjAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhpbmVydGlhVmVsKSA8IDAuMTUpIHtcbiAgICAgICAgICBpbmVydGlhT24gPSBmYWxzZTtcbiAgICAgICAgICBzY2hlZHVsZVJlc3VtZSgxNTAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhcHBseVBvcyhuZXh0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc0F1dG8pIHtcbiAgICAgICAgY29uc3QgbWluID0gZ2V0TWluKCksIG1heCA9IGdldE1heCgpO1xuICAgICAgICBpZiAobWluIDwgbWF4IC0gMSkge1xuICAgICAgICAgIGNvbnN0IG5leHQgPSBwb3MgKyBBVVRPX1NQRUVEICogYXV0b0RpcjtcbiAgICAgICAgICBpZiAobmV4dCA8PSBtaW4pIHsgYXBwbHlQb3MobWluKTsgYXV0b0RpciA9IDE7IH1cbiAgICAgICAgICBlbHNlIGlmIChuZXh0ID49IG1heCkgeyBhcHBseVBvcyhtYXgpOyBhdXRvRGlyID0gLTE7IH1cbiAgICAgICAgICBlbHNlIGFwcGx5UG9zKG5leHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgfVxuXG4gIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCAoZTogUG9pbnRlckV2ZW50KSA9PiB7XG4gICAgZHJhZ2dpbmcgPSB0cnVlO1xuICAgIGlzQXV0byA9IGZhbHNlO1xuICAgIGluZXJ0aWFPbiA9IGZhbHNlO1xuICAgIGluZXJ0aWFWZWwgPSAwO1xuICAgIGNhbmNlbFJlc3VtZSgpO1xuICAgIGRyYWdTdGFydENsaWVudFggPSBlLmNsaWVudFg7XG4gICAgZHJhZ1N0YXJ0UG9zID0gcG9zO1xuICAgIHZlbFNhbXBsZXMgPSBbXTtcbiAgICBwcmV2Q2xpZW50WCA9IGUuY2xpZW50WDtcbiAgICBwcmV2VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIHdyYXAhLnN0eWxlLmN1cnNvciA9ICdncmFiYmluZyc7XG4gIH0sIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcblxuICB3cmFwLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgKGU6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgIGlmICghZHJhZ2dpbmcpIHJldHVybjtcbiAgICBjb25zdCBkeCA9IGUuY2xpZW50WCAtIGRyYWdTdGFydENsaWVudFg7XG4gICAgY29uc3QgbWluID0gZ2V0TWluKCksIG1heCA9IGdldE1heCgpO1xuICAgIGxldCBuZXdQb3MgPSBkcmFnU3RhcnRQb3MgKyBkeDtcbiAgICBpZiAobmV3UG9zID4gbWF4KSBuZXdQb3MgPSBtYXggKyAobmV3UG9zIC0gbWF4KSAqIDAuMjU7XG4gICAgaWYgKG5ld1BvcyA8IG1pbikgbmV3UG9zID0gbWluICsgKG5ld1BvcyAtIG1pbikgKiAwLjI1O1xuICAgIGFwcGx5UG9zKG5ld1Bvcyk7XG5cbiAgICBjb25zdCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICBjb25zdCBkdCA9IG5vdyAtIHByZXZUaW1lO1xuICAgIGlmIChkdCA+IDAgJiYgZHQgPCA4MCkge1xuICAgICAgdmVsU2FtcGxlcy5wdXNoKChlLmNsaWVudFggLSBwcmV2Q2xpZW50WCkgKiAxNiAvIGR0KTtcbiAgICAgIGlmICh2ZWxTYW1wbGVzLmxlbmd0aCA+IDYpIHZlbFNhbXBsZXMuc2hpZnQoKTtcbiAgICB9XG4gICAgcHJldkNsaWVudFggPSBlLmNsaWVudFg7XG4gICAgcHJldlRpbWUgPSBub3c7XG4gIH0sIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcblxuICBjb25zdCBvblJlbGVhc2UgPSAoKTogdm9pZCA9PiB7XG4gICAgaWYgKCFkcmFnZ2luZykgcmV0dXJuO1xuICAgIGRyYWdnaW5nID0gZmFsc2U7XG4gICAgd3JhcCEuc3R5bGUuY3Vyc29yID0gJyc7XG5cbiAgICBjb25zdCBtaW4gPSBnZXRNaW4oKSwgbWF4ID0gZ2V0TWF4KCk7XG4gICAgaWYgKHBvcyA+IG1heCB8fCBwb3MgPCBtaW4pIHtcbiAgICAgIGFwcGx5UG9zKE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCBwb3MpKSk7XG4gICAgICBzY2hlZHVsZVJlc3VtZSg2MDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGF2Z1ZlbCA9IHZlbFNhbXBsZXMubGVuZ3RoID4gMFxuICAgICAgPyB2ZWxTYW1wbGVzLnNsaWNlKC0zKS5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIE1hdGgubWluKDMsIHZlbFNhbXBsZXMubGVuZ3RoKVxuICAgICAgOiAwO1xuXG4gICAgaWYgKE1hdGguYWJzKGF2Z1ZlbCkgPiAwLjQpIHtcbiAgICAgIGluZXJ0aWFWZWwgPSBhdmdWZWw7XG4gICAgICBpbmVydGlhT24gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY2hlZHVsZVJlc3VtZSgyMDAwKTtcbiAgICB9XG4gIH07XG5cbiAgd3JhcC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCAgICAgb25SZWxlYXNlLCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxlYXZlJywgIG9uUmVsZWFzZSwgeyBwYXNzaXZlOiB0cnVlIH0pO1xuICB3cmFwLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCBvblJlbGVhc2UsIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spKTtcbn1cblxuKGFzeW5jIGZ1bmN0aW9uIGluaXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgY2xpZW50ZVNlc3NhbyA9IGxvZ2luVXNlQ2FzZS5yZXN0b3JlU2Vzc2lvbigpO1xuICAgIGlmIChjbGllbnRlU2Vzc2FvKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBsb2dpblVzZUNhc2UuZXhlY3V0ZShjbGllbnRlU2Vzc2FvLnRlbGVmb25lKTtcbiAgICAgIGlmIChyZXN1bHQub2sgJiYgcmVzdWx0LnZhbHVlLmV4aXN0ZSAmJiByZXN1bHQudmFsdWUuY2xpZW50ZSkge1xuICAgICAgICBlbnRyYXJDb21DbGllbnRlKHJlc3VsdC52YWx1ZS5jbGllbnRlLnRvSlNPTigpIGFzIENsaWVudGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBGYWxoYSBkZSByZWRlIFx1MjE5MiBjb25maWEgbmEgc2Vzc1x1MDBFM28gbG9jYWwgZW0gdmV6IGRlIGZhemVyIGxvZ291dFxuICAgICAgaWYgKCFyZXN1bHQub2sgJiYgcmVzdWx0LmVycm9yLm5hbWUgPT09ICdOZXR3b3JrRXJyb3InKSB7XG4gICAgICAgIGxvZy53YXJuKCdSZXZhbGlkYVx1MDBFN1x1MDBFM28gb2ZmbGluZSBcdTIwMTQgdXNhbmRvIHNlc3NcdTAwRTNvIGxvY2FsJywgeyB0ZWw6IGAqKioke2NsaWVudGVTZXNzYW8udGVsZWZvbmUuc2xpY2UoLTQpfWAgfSk7XG4gICAgICAgIGVudHJhckNvbUNsaWVudGUoY2xpZW50ZVNlc3Nhby50b0pTT04oKSBhcyBDbGllbnRlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9naW5Vc2VDYXNlLmxvZ291dCgpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyBsb2cud2FybignRXJybyBhbyB2ZXJpZmljYXIgc2Vzc1x1MDBFM28nLCB7IGVycm9yOiBTdHJpbmcoZSkgfSk7IH1cbiAgbW9zdHJhckxvZ2luKCk7XG59KSgpO1xuXG5pbml0RmlsdHJvc1RpY2tlcigpO1xuXG4vLyBQV0Egc2VydmljZSB3b3JrZXJcbmlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XG4gIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCdzdy5qcycpLmNhdGNoKCgpID0+IHt9KTtcbn1cblxuLy8gU2luY3Jvbml6YXIgY2FyZFx1MDBFMXBpbyBjb20gU3VwYWJhc2Vcbihhc3luYyBmdW5jdGlvbiBzaW5jcm9uaXphckNhcmRhcGlvKCk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IGN0cmwgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IGN0cmwuYWJvcnQoKSwgMTBfMDAwKTtcbiAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goU1VQQUJBU0VfVVJMICsgJy9yZXN0L3YxL3Byb2R1dG9zP3NlbGVjdD1ub21lLHByZWNvLGRpc3Bvbml2ZWwnLCB7XG4gICAgICBoZWFkZXJzOiB7ICdhcGlrZXknOiBTVVBBQkFTRV9BTk9OLCAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIFNVUEFCQVNFX0FOT04gfSxcbiAgICAgIHNpZ25hbDogY3RybC5zaWduYWxcbiAgICB9KTtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIGlmICghci5vaykgcmV0dXJuO1xuICAgIGNvbnN0IHByb2RzID0gYXdhaXQgci5qc29uKCkgYXMgQXJyYXk8eyBub21lOiBzdHJpbmc7IHByZWNvOiBudW1iZXI7IGRpc3Bvbml2ZWw6IGJvb2xlYW4gfT47XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHByb2RzKSB8fCAhcHJvZHMubGVuZ3RoKSByZXR1cm47XG4gICAgY29uc3QgbWFwYTogUmVjb3JkPHN0cmluZywgeyBub21lOiBzdHJpbmc7IHByZWNvOiBudW1iZXI7IGRpc3Bvbml2ZWw6IGJvb2xlYW4gfT4gPSB7fTtcbiAgICBwcm9kcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAgJiYgdHlwZW9mIHAubm9tZSA9PT0gJ3N0cmluZycgJiYgcC5ub21lLnRyaW0oKSkgbWFwYVtwLm5vbWUudHJpbSgpLnRvTG93ZXJDYXNlKCldID0gcDtcbiAgICB9KTtcbiAgICBjb25zdCBwcmljZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJ0bi1wZWRpcicpLmZvckVhY2goYnRuID0+IHtcbiAgICAgIGNvbnN0IG9uY2xpY2tBdHRyID0gYnRuLmdldEF0dHJpYnV0ZSgnb25jbGljaycpID8/ICcnO1xuICAgICAgY29uc3QgbSA9IG9uY2xpY2tBdHRyLm1hdGNoKC9wZWRpclByb2R1dG9cXCh0aGlzLCcoLis/KScsKFxcZCsoPzpcXC5cXGQrKT8pXFwpLyk7XG4gICAgICBpZiAoIW0pIHJldHVybjtcbiAgICAgIGNvbnN0IG5vbWVQcm9kID0gbVsxXSE7XG4gICAgICBjb25zdCBjaGF2ZSA9IG5vbWVQcm9kLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3QgZGIgPSBtYXBhW2NoYXZlXTtcbiAgICAgIGlmICghZGIpIHJldHVybjtcbiAgICAgIGNvbnN0IGNhcmQgPSBidG4uY2xvc2VzdCgnLnByb2QtY2FyZCcpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICAgIGlmICghY2FyZCkgcmV0dXJuO1xuICAgICAgaWYgKGRiLmRpc3Bvbml2ZWwgPT09IGZhbHNlKSB7IGNhcmQuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgcmV0dXJuOyB9XG4gICAgICBjb25zdCBub3ZvUHJlY28gPSBwYXJzZUZsb2F0KFN0cmluZyhkYi5wcmVjbykpO1xuICAgICAgaWYgKGlzTmFOKG5vdm9QcmVjbykgfHwgbm92b1ByZWNvIDw9IDApIHJldHVybjtcbiAgICAgIGJ0bi5zZXRBdHRyaWJ1dGUoJ29uY2xpY2snLCBcInBlZGlyUHJvZHV0byh0aGlzLCdcIiArIG5vbWVQcm9kLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKSArIFwiJyxcIiArIG5vdm9QcmVjbyArIFwiKVwiKTtcbiAgICAgIGNvbnN0IHByZWNvRWwgPSBjYXJkLnF1ZXJ5U2VsZWN0b3IoJy5wcm9kLXByZWNvJyk7XG4gICAgICBpZiAocHJlY29FbCkgcHJlY29FbC50ZXh0Q29udGVudCA9ICdSJCAnICsgbm92b1ByZWNvLnRvRml4ZWQoMikucmVwbGFjZSgnLicsICcsJyk7XG4gICAgICBwcmljZU1hcC5zZXQobm9tZVByb2QsIG5vdm9QcmVjbyk7XG4gICAgfSk7XG4gICAgY2FydFNlcnZpY2UucmV2YWxpZGF0ZVByaWNlcyhwcmljZU1hcCk7XG4gIH0gY2F0Y2ggeyAvKiBzaWxlbmNpb3NvICovIH1cbn0pKCk7XG5cbi8vIEZlY2hhciBtb2RhaXMgY29tIEVzY2FwZVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICBmZWNoYXJEaWFsb2coKTtcbiAgICBmZWNoYXJNb2RhbCgpO1xuICAgIGZlY2hhckNvbmZpcm1XQSgpO1xuICB9XG59KTtcblxuLy8gPT09PT0gRVhQT1IgUEFSQSBIVE1MIChvbmNsaWNrPVwiLi4uXCIpID09PT09XG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIGZpbHRyYXI6IHR5cGVvZiBmaWx0cmFyO1xuICAgIHBlZGlyUHJvZHV0bzogdHlwZW9mIHBlZGlyUHJvZHV0bztcbiAgICBhYnJpckRpYWxvZzogdHlwZW9mIGFicmlyRGlhbG9nO1xuICAgIGZlY2hhckRpYWxvZzogdHlwZW9mIGZlY2hhckRpYWxvZztcbiAgICBmZWNoYXJEaWFsb2dCYWNrZHJvcDogdHlwZW9mIGZlY2hhckRpYWxvZ0JhY2tkcm9wO1xuICAgIGlyUGFyYUZpbmFsaXphcjogdHlwZW9mIGlyUGFyYUZpbmFsaXphcjtcbiAgICBhYnJpck1vZGFsOiB0eXBlb2YgYWJyaXJNb2RhbDtcbiAgICBmZWNoYXJNb2RhbDogdHlwZW9mIGZlY2hhck1vZGFsO1xuICAgIGZlY2hhck1vZGFsQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJNb2RhbEJhY2tkcm9wO1xuICAgIHJlbW92ZXJEb0NhcnJpbmhvOiB0eXBlb2YgcmVtb3ZlckRvQ2FycmluaG87XG4gICAgc2VsZWNpb25hclBhZ2FtZW50bzogdHlwZW9mIHNlbGVjaW9uYXJQYWdhbWVudG87XG4gICAgZmluYWxpemFyUGVkaWRvOiB0eXBlb2YgZmluYWxpemFyUGVkaWRvO1xuICAgIGNvbmZpcm1hckVudmlvV0E6IHR5cGVvZiBjb25maXJtYXJFbnZpb1dBO1xuICAgIGZlY2hhckNvbmZpcm1XQTogdHlwZW9mIGZlY2hhckNvbmZpcm1XQTtcbiAgICBwZWRpckJvbG9Gb3JtYTogdHlwZW9mIHBlZGlyQm9sb0Zvcm1hO1xuICAgIGFicmlyRGlhbG9nQm9sbzogdHlwZW9mIGFicmlyRGlhbG9nQm9sbztcbiAgICBmZWNoYXJEaWFsb2dCb2xvOiB0eXBlb2YgZmVjaGFyRGlhbG9nQm9sbztcbiAgICBhZ2VuZGFyQm9sb1doYXRzQXBwOiB0eXBlb2YgYWdlbmRhckJvbG9XaGF0c0FwcDtcbiAgICBjYXJvdXNlbE5leHQ6IHR5cGVvZiBjYXJvdXNlbE5leHQ7XG4gICAgY2Fyb3VzZWxQcmV2OiB0eXBlb2YgY2Fyb3VzZWxQcmV2O1xuICAgIG1hc2NhcmFUZWxlZm9uZTogdHlwZW9mIG1hc2NhcmFUZWxlZm9uZTtcbiAgICB2ZXJpZmljYXJUZWxlZm9uZTogdHlwZW9mIHZlcmlmaWNhclRlbGVmb25lO1xuICAgIGNhZGFzdHJhcjogdHlwZW9mIGNhZGFzdHJhcjtcbiAgICB2b2x0YXJFdGFwYVRlbGVmb25lOiB0eXBlb2Ygdm9sdGFyRXRhcGFUZWxlZm9uZTtcbiAgICBzYWlyOiB0eXBlb2Ygc2FpcjtcbiAgICBhYnJpclJvbGV0YTogdHlwZW9mIGFicmlyUm9sZXRhO1xuICAgIGZlY2hhclJvbGV0YTogdHlwZW9mIGZlY2hhclJvbGV0YTtcbiAgICBmZWNoYXJSb2xldGFCYWNrZHJvcDogdHlwZW9mIGZlY2hhclJvbGV0YUJhY2tkcm9wO1xuICAgIGdpcmFyUm9sZXRhOiB0eXBlb2YgZ2lyYXJSb2xldGE7XG4gICAgZW52aWFyUHJvdmFzV2hhdHNBcHA6IHR5cGVvZiBlbnZpYXJQcm92YXNXaGF0c0FwcDtcbiAgICBhYnJpclJvbGV0YUFkbWluOiB0eXBlb2YgYWJyaXJSb2xldGFBZG1pbjtcbiAgICBmZWNoYXJSb2xldGFBZG1pbjogdHlwZW9mIGZlY2hhclJvbGV0YUFkbWluO1xuICAgIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3A6IHR5cGVvZiBmZWNoYXJSb2xldGFBZG1pbkJhY2tkcm9wO1xuICAgIGFicmlyVGFiQWRtaW46IHR5cGVvZiBhYnJpclRhYkFkbWluO1xuICAgIGFwcm92YXJQYXJ0aWNpcGFudGU6IHR5cGVvZiBhcHJvdmFyUGFydGljaXBhbnRlO1xuICAgIHJlamVpdGFyUGFydGljaXBhbnRlOiB0eXBlb2YgcmVqZWl0YXJQYXJ0aWNpcGFudGU7XG4gICAgc2FsdmFyQ29uZmlnUm9sZXRhOiB0eXBlb2Ygc2FsdmFyQ29uZmlnUm9sZXRhO1xuICB9XG59XG5cbk9iamVjdC5hc3NpZ24od2luZG93LCB7XG4gIGZpbHRyYXIsXG4gIHBlZGlyUHJvZHV0byxcbiAgYWJyaXJEaWFsb2csXG4gIGZlY2hhckRpYWxvZyxcbiAgZmVjaGFyRGlhbG9nQmFja2Ryb3AsXG4gIGlyUGFyYUZpbmFsaXphcixcbiAgYWJyaXJNb2RhbCxcbiAgZmVjaGFyTW9kYWwsXG4gIGZlY2hhck1vZGFsQmFja2Ryb3AsXG4gIHJlbW92ZXJEb0NhcnJpbmhvLFxuICBzZWxlY2lvbmFyUGFnYW1lbnRvLFxuICBmaW5hbGl6YXJQZWRpZG8sXG4gIGNvbmZpcm1hckVudmlvV0EsXG4gIGZlY2hhckNvbmZpcm1XQSxcbiAgcGVkaXJCb2xvRm9ybWEsXG4gIGFicmlyRGlhbG9nQm9sbyxcbiAgZmVjaGFyRGlhbG9nQm9sbyxcbiAgYWdlbmRhckJvbG9XaGF0c0FwcCxcbiAgY2Fyb3VzZWxOZXh0LFxuICBjYXJvdXNlbFByZXYsXG4gIG1hc2NhcmFUZWxlZm9uZSxcbiAgdmVyaWZpY2FyVGVsZWZvbmUsXG4gIGNhZGFzdHJhcixcbiAgdm9sdGFyRXRhcGFUZWxlZm9uZSxcbiAgc2FpcixcbiAgYWJyaXJSb2xldGEsXG4gIGZlY2hhclJvbGV0YSxcbiAgZmVjaGFyUm9sZXRhQmFja2Ryb3AsXG4gIGdpcmFyUm9sZXRhLFxuICBlbnZpYXJQcm92YXNXaGF0c0FwcCxcbiAgYWJyaXJSb2xldGFBZG1pbixcbiAgZmVjaGFyUm9sZXRhQWRtaW4sXG4gIGZlY2hhclJvbGV0YUFkbWluQmFja2Ryb3AsXG4gIGFicmlyVGFiQWRtaW4sXG4gIGFwcm92YXJQYXJ0aWNpcGFudGUsXG4gIHJlamVpdGFyUGFydGljaXBhbnRlLFxuICBzYWx2YXJDb25maWdSb2xldGEsXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRU8sV0FBUyxhQUFhLEtBQWEsT0FBa0IsUUFBYztBQUN4RSxVQUFNLE1BQU0sU0FBUyxlQUFlLFFBQVE7QUFDNUMsUUFBSSxJQUFLLEtBQUksT0FBTztBQUNwQixVQUFNLElBQUksU0FBUyxjQUFjLEtBQUs7QUFDdEMsTUFBRSxLQUFLO0FBQ1AsTUFBRSxjQUFjO0FBQ2hCLFVBQU0sS0FBSyxTQUFTLFNBQVMsWUFBWSxTQUFTLE9BQU8sWUFBWTtBQUNyRSxXQUFPLE9BQU8sRUFBRSxPQUFPO0FBQUEsTUFDckIsVUFBVTtBQUFBLE1BQVMsUUFBUTtBQUFBLE1BQVEsTUFBTTtBQUFBLE1BQ3pDLFdBQVc7QUFBQSxNQUNYLFlBQVk7QUFBQSxNQUFJLE9BQU87QUFBQSxNQUFRLFNBQVM7QUFBQSxNQUN4QyxjQUFjO0FBQUEsTUFBUSxVQUFVO0FBQUEsTUFBUSxZQUFZO0FBQUEsTUFDcEQsUUFBUTtBQUFBLE1BQVMsV0FBVztBQUFBLE1BQzVCLFVBQVU7QUFBQSxNQUFRLFdBQVc7QUFBQSxNQUM3QixZQUFZO0FBQUEsTUFBZSxTQUFTO0FBQUEsTUFDcEMsWUFBWTtBQUFBLElBQ2QsQ0FBaUM7QUFDakMsYUFBUyxLQUFLLFlBQVksQ0FBQztBQUMzQixlQUFXLE1BQU07QUFDZixRQUFFLE1BQU0sVUFBVTtBQUNsQixpQkFB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
