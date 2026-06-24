import type { ToastTipo } from '../types';

export function mostrarToast(msg: string, tipo: ToastTipo = 'info'): void {
  const old = document.getElementById('_toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = '_toast';
  t.textContent = msg;
  const bg = tipo === 'erro' ? '#ef4444' : tipo === 'ok' ? '#22c55e' : '#4A2C17';
  Object.assign(t.style, {
    position: 'fixed', bottom: '90px', left: '50%',
    transform: 'translateX(-50%)',
    background: bg, color: '#fff', padding: '12px 22px',
    borderRadius: '30px', fontSize: '14px', fontWeight: '600',
    zIndex: '99999', boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
    maxWidth: '90vw', textAlign: 'center',
    transition: 'opacity .3s', opacity: '1',
    fontFamily: "'DM Sans', sans-serif",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 350);
  }, 3500);
}
