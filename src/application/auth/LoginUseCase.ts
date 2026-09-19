import { Cliente } from '../../domain/cliente';
import { type Result, ok, fail, tryAsync } from '../../core/result';
import { ValidationError } from '../../core/errors';
import { logger } from '../../core/logger';
import { setCliente } from '../../state/AppStore';

const log = logger.child('LoginUseCase');

const SESSION_KEY = 'gelamour_cliente';
const SESSION_TS_KEY = 'gelamour_ts';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function lerStorage(chave: string): string | null {
  try { return localStorage.getItem(chave); } catch { return null; }
}

function gravarStorage(chave: string, valor: string): void {
  try { localStorage.setItem(chave, valor); } catch { /* modo privado: segue sem salvar */ }
}

function removerStorage(chave: string): void {
  try { localStorage.removeItem(chave); } catch { /* ignora */ }
}

/** Login 100% local: o cadastro do cliente fica salvo no próprio aparelho. */
export class LoginUseCase {
  private lerSalvo(): Cliente | null {
    try {
      const ts = Number(lerStorage(SESSION_TS_KEY) ?? '0');
      if (Date.now() - ts > SESSION_TTL_MS) return null;
      const raw = lerStorage(SESSION_KEY);
      if (!raw) return null;
      return Cliente.fromDB(JSON.parse(raw) as ReturnType<Cliente['toJSON']>);
    } catch {
      return null;
    }
  }

  restoreSession(): Cliente | null {
    const cliente = this.lerSalvo();
    if (!cliente) { this.clearSession(); return null; }
    setCliente(cliente);
    return cliente;
  }

  /** Telefone já usado neste aparelho entra direto; senão pede o nome. */
  async execute(telefone: string): Promise<Result<{ existe: boolean; cliente?: Cliente }>> {
    const tel = telefone.replace(/\D/g, '');
    if (tel.length < 10 || tel.length > 11) return fail(new ValidationError('Telefone inválido'));
    const salvo = this.lerSalvo();
    if (salvo && salvo.telefone === tel) return ok({ existe: true, cliente: salvo });
    return ok({ existe: false });
  }

  async register(nome: string, telefone: string, endereco: string): Promise<Result<Cliente>> {
    return tryAsync(async () => Cliente.create({ nome, telefone, endereco }));
  }

  login(cliente: Cliente): void {
    gravarStorage(SESSION_KEY, JSON.stringify(cliente.toJSON()));
    gravarStorage(SESSION_TS_KEY, String(Date.now()));
    setCliente(cliente);
    log.info('Login realizado');
  }

  salvarEndereco(endereco: string): void {
    const atual = this.lerSalvo();
    if (!atual) return;
    gravarStorage(SESSION_KEY, JSON.stringify(atual.withEndereco(endereco).toJSON()));
  }

  logout(): void {
    this.clearSession();
    setCliente(null);
    log.info('Logout realizado');
  }

  private clearSession(): void {
    removerStorage(SESSION_KEY);
    removerStorage(SESSION_TS_KEY);
  }
}
