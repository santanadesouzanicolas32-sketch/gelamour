import type { Cliente } from '../types';
import { dbGet, dbPost, dbPatch } from './supabase';
import { normalizarTelefone, normalizarNome } from '../utils/security';
import { mostrarToast } from '../utils/toast';

const SESSION_KEY = 'gelamour_cliente';
const SESSION_TS_KEY = 'gelamour_ts';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24h

const CONTA_TESTE = atob('MTE5NjUwMzAwNzY=');
const ADMIN_TEL = atob('MTE5NDA3NzI3NTA=');

let _loginTentativas = 0;
let _loginBloqueioAte = 0;

export function getClienteAtual(): Cliente | null {
  try {
    const ts = Number(sessionStorage.getItem(SESSION_TS_KEY) ?? '0');
    if (Date.now() - ts > SESSION_TTL) {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_TS_KEY);
      return null;
    }
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Cliente) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(cliente: Cliente): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(cliente));
  sessionStorage.setItem(SESSION_TS_KEY, String(Date.now()));
}

export function limparSessao(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_TS_KEY);
}

export function isContaTeste(cliente: Cliente | null): boolean {
  return !!cliente && normalizarTelefone(cliente.telefone) === CONTA_TESTE;
}

export function isAdmin(cliente: Cliente | null): boolean {
  return !!cliente && normalizarTelefone(cliente.telefone) === ADMIN_TEL;
}

export async function verificarTelefoneDB(telRaw: string): Promise<{ existe: boolean; cliente?: Cliente }> {
  if (Date.now() < _loginBloqueioAte) {
    const restante = Math.ceil((_loginBloqueioAte - Date.now()) / 1000);
    mostrarToast(`Muitas tentativas. Aguarde ${restante}s.`, 'erro');
    return { existe: false };
  }

  const tel = normalizarTelefone(telRaw);
  if (tel.length < 10) {
    mostrarToast('Telefone inválido.', 'erro');
    return { existe: false };
  }

  try {
    const rows = await dbGet<Cliente>('clientes', `telefone=eq.${tel}&limit=1`);
    _loginTentativas = 0;
    return { existe: rows.length > 0, cliente: rows[0] };
  } catch {
    _loginTentativas++;
    if (_loginTentativas >= 5) {
      _loginBloqueioAte = Date.now() + 60_000;
      _loginTentativas = 0;
      mostrarToast('Muitas tentativas. Aguarde 60s.', 'erro');
    }
    return { existe: false };
  }
}

export async function cadastrarCliente(nome: string, telefone: string, endereco: string): Promise<Cliente> {
  const tel = normalizarTelefone(telefone);
  const nomeNorm = normalizarNome(nome);
  return dbPost<Cliente>('clientes', { nome: nomeNorm, telefone: tel, endereco });
}

export async function salvarEnderecoClienteDB(clienteId: number, endereco: string): Promise<void> {
  await dbPatch<Cliente>('clientes', `id=eq.${clienteId}`, { endereco });
}
