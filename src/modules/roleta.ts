import type { RoletaConfig, Participacao, Vencedor, Cliente } from '../types';
import { dbGet, dbPost, dbPatch } from '../services/supabase';
import { getSemanaAtual } from '../utils/format';
import { escHTML } from '../utils/security';
import { mostrarToast } from '../utils/toast';
import { isContaTeste } from '../services/auth';

const PREMIOS_PADRAO: string[] = [
  '🎁 5% OFF — Compras acima de R$35',
  '🍫 Brownie Tradicional Grátis — Compras acima de R$50',
  '🎁 10% OFF — Compras acima de R$50',
  '📸 Siga a Gelamour no Instagram',
  '🛍️ Compre 2 e Leve — Até R$14 em produtos',
  '😕 Não Foi Dessa Vez — Ganha 5% OFF acima de R$35',
];

let _premios: string[] = [...PREMIOS_PADRAO];
let _rotacaoAtual = 0;
let _girando = false;
let _participacaoId: number | null = null;

export function getPremiosPadrao(): string[] { return PREMIOS_PADRAO; }
export function getPremios(): string[] { return _premios; }
export function setPremios(p: string[]): void { _premios = p; }
export function getParticipacaoId(): number | null { return _participacaoId; }
export function setParticipacaoId(id: number | null): void { _participacaoId = id; }
export function isGirando(): boolean { return _girando; }

export async function carregarConfig(): Promise<RoletaConfig | null> {
  try {
    const rows = await dbGet<RoletaConfig>('roleta_config', 'id=eq.1&limit=1');
    if (rows[0]) {
      _premios = Array.isArray(rows[0].premios) ? rows[0].premios : PREMIOS_PADRAO;
    }
    return rows[0] ?? null;
  } catch { return null; }
}

export async function verificarStatus(clienteId: number): Promise<Participacao | null> {
  try {
    const rows = await dbGet<Participacao>(
      'roleta_participacoes',
      `cliente_id=eq.${clienteId}&order=created_at.desc&limit=1`
    );
    if (rows[0]) {
      _participacaoId = rows[0].id;
    }
    return rows[0] ?? null;
  } catch { return null; }
}

export async function girar(
  cliente: Cliente,
  onResultado: (premio: string, indice: number) => void
): Promise<void> {
  if (_girando) return;

  if (!isContaTeste(cliente)) {
    mostrarToast('🚧 Roleta em breve! Estamos finalizando os últimos detalhes. 🎡', 'info');
    return;
  }

  _girando = true;
  const btn = document.getElementById('roletaGirarBtn') as HTMLButtonElement | null;
  if (btn) { btn.disabled = true; btn.textContent = 'Girando...'; }

  const n = _premios.length;
  const arc = 360 / n;
  const indice = Math.floor(Math.random() * n);
  const voltasExtras = 5 + Math.floor(Math.random() * 5);
  const anguloAlvo = voltasExtras * 360 + (360 - arc * indice - arc / 2);
  const rotacaoFinal = _rotacaoAtual + anguloAlvo;

  const roda = document.getElementById('roletaRoda');
  if (roda) {
    roda.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 1)';
    roda.style.transformOrigin = '200px 200px';
    roda.style.transform = `rotate(${rotacaoFinal}deg)`;
  }

  _rotacaoAtual = ((rotacaoFinal % 360) + 360) % 360;

  await new Promise<void>(resolve => setTimeout(resolve, 4200));

  const premio = _premios[indice]!;
  _girando = false;

  onResultado(premio, indice);

  if (isContaTeste(cliente) && btn) {
    btn.disabled = false;
    btn.textContent = '🎡 GIRAR AGORA!';
  }
}

export async function salvarVencedor(cliente: Cliente, premio: string): Promise<void> {
  if (isContaTeste(cliente)) return;
  if (!_participacaoId) return;
  try {
    const semana = getSemanaAtual();
    await dbPatch<Participacao>('roleta_participacoes', `id=eq.${_participacaoId}`, {
      ja_girou: true,
      premio,
    });
    await dbPost<Vencedor>('roleta_vencedores', {
      participacao_id: _participacaoId,
      cliente_id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      premio,
      semana,
    } as Partial<Vencedor>);
  } catch (e) {
    console.error('Erro ao salvar vencedor:', e);
  }
}

export function desenharRoleta(premios: string[]): void {
  const wrap = document.querySelector('.roleta-pointer-wrap');
  if (!wrap) return;
  const old = document.getElementById('roletaCanvas');
  if (old) old.remove();

  const N = premios.length;
  const CX = 200, CY = 200, R = 164, R_LED = 182, R_OUTER = 196;
  const SEG = 360 / N;
  const CORES = [
    { bg: '#FAF0F2', txt: '#B5134F' },
    { bg: '#E8528A', txt: '#FFFFFF' },
  ] as const;

  const rad = (d: number): number => d * Math.PI / 180;
  const pt = (d: number, r: number): [number, number] => [CX + r * Math.cos(rad(d)), CY + r * Math.sin(rad(d))];
  const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function segPath(i: number): string {
    const s = SEG * i - 90, e = s + SEG;
    const [x1, y1] = pt(s, R), [x2, y2] = pt(e, R);
    return `M${CX},${CY} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
  }

  function wrapWords(text: string, maxChars: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let cur = '';
    words.forEach(w => {
      const test = cur ? `${cur} ${w}` : w;
      if (test.length > maxChars && cur) { lines.push(cur); cur = w; }
      else cur = test;
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }

  const segs = premios.map((_, i) => {
    const c = CORES[i % 2]!;
    return `<path d="${segPath(i)}" fill="${c.bg}" stroke="#D4AF37" stroke-width="2" shape-rendering="geometricPrecision"/>`;
  }).join('');

  const spokes = premios.map((_, i) => {
    const d = SEG * i - 90;
    const [x, y] = pt(d, R);
    return `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#D4AF37" stroke-width="2"/>`;
  }).join('');

  const texts = premios.map((p, i) => {
    const mid = SEG * i - 90 + SEG / 2;
    const [tx, ty] = pt(mid, R * 0.57);
    const c = CORES[i % 2]!;
    const m = p.match(/^(\S+)\s+(.+)$/);
    const emoji = m ? m[1]! : '';
    const rest = m ? m[2]! : p;
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
  }).join('\n  ')}
</g>`;
  }).join('');

  const LED_N = 30;
  const leds = Array.from({ length: LED_N }, (_, i) => {
    const [lx, ly] = pt((360 / LED_N) * i - 90, R_LED);
    return `<circle cx="${lx.toFixed(2)}" cy="${ly.toFixed(2)}" r="5.5" class="r-led r-led-${i % 2}"/>`;
  }).join('');

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
  <text x="${CX}" y="${CY + 9}" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,.85)" font-family="serif" font-size="11">★ ★ ★</text>
</svg>`;

  const div = document.createElement('div');
  div.innerHTML = svg;
  wrap.insertBefore(div.firstElementChild!, wrap.firstChild);
}

export { escHTML };
