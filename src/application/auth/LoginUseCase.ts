import type { IClienteRepository } from '../../repositories/IClienteRepository';
import { Cliente } from '../../domain/cliente';
import { type Result, ok, fail, tryAsync } from '../../core/result';
import { RateLimitError, ValidationError } from '../../core/errors';
import { logger } from '../../core/logger';
import { setCliente } from '../../state/AppStore';

const log = logger.child('LoginUseCase');

const SESSION_KEY = 'gelamour_cliente';
const SESSION_TS_KEY = 'gelamour_ts';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

interface RateLimiter {
  attempts: number;
  blockedUntil: number;
}

export class LoginUseCase {
  private rateLimiter: RateLimiter = { attempts: 0, blockedUntil: 0 };

  constructor(private readonly clienteRepo: IClienteRepository) {}

  restoreSession(): Cliente | null {
    try {
      const ts = Number(sessionStorage.getItem(SESSION_TS_KEY) ?? '0');
      if (Date.now() - ts > SESSION_TTL_MS) {
        this.clearSession();
        return null;
      }
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as ReturnType<Cliente['toJSON']>;
      const cliente = Cliente.fromDB(data);
      setCliente(cliente);
      return cliente;
    } catch {
      this.clearSession();
      return null;
    }
  }

  async execute(telefone: string): Promise<Result<{ existe: boolean; cliente?: Cliente }>> {
    if (Date.now() < this.rateLimiter.blockedUntil) {
      return fail(new RateLimitError(this.rateLimiter.blockedUntil - Date.now()));
    }

    const tel = telefone.replace(/\D/g, '');
    if (tel.length < 10) return fail(new ValidationError('Telefone inválido'));

    log.info('Verificando telefone', { tel: `***${tel.slice(-4)}` });
    const result = await this.clienteRepo.findByTelefone(tel);

    if (!result.ok) {
      // NetworkError = servidor indisponível, não tentativa inválida — não penaliza
      if (result.error.name !== 'NetworkError') {
        this.rateLimiter.attempts++;
        if (this.rateLimiter.attempts >= 5) {
          this.rateLimiter.blockedUntil = Date.now() + 60_000;
          this.rateLimiter.attempts = 0;
          return fail(new RateLimitError(60_000));
        }
      }
      return fail(result.error);
    }

    this.rateLimiter.attempts = 0;
    return ok({ existe: !!result.value, cliente: result.value ?? undefined });
  }

  async register(nome: string, telefone: string, endereco: string): Promise<Result<Cliente>> {
    return tryAsync(async () => {
      const entity = Cliente.create({ nome, telefone, endereco });
      const saved = await this.clienteRepo.save(entity);
      if (!saved.ok) throw saved.error;
      return saved.value;
    });
  }

  login(cliente: Cliente): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cliente.toJSON()));
    sessionStorage.setItem(SESSION_TS_KEY, String(Date.now()));
    setCliente(cliente);
    log.info('Login realizado', { id: cliente.id });
  }

  logout(): void {
    this.clearSession();
    setCliente(null);
    log.info('Logout realizado');
  }

  private clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TS_KEY);
  }
}
