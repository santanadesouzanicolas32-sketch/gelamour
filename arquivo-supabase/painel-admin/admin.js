
/* ══ CONFIG ══ */
var SUPA  = 'https://rfbtdtvsnftybazfmdbw.supabase.co';
var API   = SUPA + '/rest/v1';
var ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYnRkdHZzbmZ0eWJhemZtZGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTAzNjAsImV4cCI6MjA5NzQ4NjM2MH0.Hw68jQFFmwLgvwF9zjhgVWPc3D1Q2pfgAn1TQlJEVu4';
var POLL  = 5000;
var H     = {};
var ADMIN_EMAIL = atob('c2FudGFuYWRlc291emFuaWNvbGFzMzJAZ21haWwuY29t');
var TOKEN_KEY   = 'gm_token';
var EXP_KEY     = 'gm_token_exp';

/* ══ AUTH ══ */
async function entrar() {
  var senha = document.getElementById('loginSenha').value.trim();
  if (!senha) return;
  var btn = document.querySelector('.login-btn');
  btn.textContent = 'Verificando...'; btn.disabled = true;
  try {
    var r = await fetch(SUPA + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: senha })
    });
    var data = await r.json();
    if (!r.ok) throw new Error(data.error_description || 'Credenciais inválidas');
    sessionStorage.setItem(TOKEN_KEY, data.access_token);
    sessionStorage.setItem(EXP_KEY,   Date.now() + data.expires_in * 1000);
    H = {
      apikey: ANON,
      Authorization: 'Bearer ' + data.access_token,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    };
    document.getElementById('login-screen').style.display = 'none';
    iniciar();
  } catch(e) {
    var el = document.getElementById('loginErr');
    el.textContent = 'Senha incorreta. Tente novamente.';
    document.getElementById('loginSenha').value = '';
    document.getElementById('loginSenha').focus();
    setTimeout(function(){ el.textContent = ''; }, 3500);
  } finally {
    btn.textContent = 'Entrar'; btn.disabled = false;
  }
}

function verificarSessao() {
  var token = sessionStorage.getItem(TOKEN_KEY);
  var exp   = parseInt(sessionStorage.getItem(EXP_KEY) || '0');
  if (token && exp > Date.now()) {
    H = { apikey: ANON, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'return=representation' };
    document.getElementById('login-screen').style.display = 'none';
    iniciar();
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
    setTimeout(function(){ document.getElementById('loginSenha').focus(); }, 100);
  }
}

async function sair() {
  try {
    var token = sessionStorage.getItem(TOKEN_KEY);
    if (token) await fetch(SUPA + '/auth/v1/logout', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
  } catch(_) {}
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXP_KEY);
  location.reload();
}

/* ══ API ══ */
var FETCH_TIMEOUT = 12000; // 12 s

async function req(method, path, body) {
  // Verificar expiração do token antes de cada chamada
  var exp = parseInt(sessionStorage.getItem(EXP_KEY) || '0');
  if (exp && exp < Date.now()) { sair(); return null; }

  var ctrl = new AbortController();
  var tid = setTimeout(function(){ ctrl.abort(); }, FETCH_TIMEOUT);
  try {
    var r = await fetch(API + path, {
      method: method,
      headers: H,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    });
    clearTimeout(tid);
    // Token expirado no servidor → força logout
    if (r.status === 401) { sair(); return null; }
    if (!r.ok) { var t = await r.text(); throw new Error(r.status + ': ' + t); }
    if (r.status === 204) return null;
    return r.json().catch(function(){ return null; });
  } catch(e) {
    clearTimeout(tid);
    if (e.name === 'AbortError') throw new Error('Tempo limite excedido — verifique sua conexão');
    throw e;
  }
}

/* ══ TABS ══ */
var abaAtiva = 'registros';
function mudarAba(aba, btn) {
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('ativo'); });
  document.querySelectorAll('.tab-content').forEach(function(d){ d.classList.remove('ativo'); });
  btn.classList.add('ativo');
  document.getElementById('tab-' + aba).classList.add('ativo');
  abaAtiva = aba;
  if (aba === 'registros') buscarClientes();
  if (aba === 'pedidos')   buscarPedidos();
}

/* ══ STATE ══ */
var clientes = [];
var pedidos  = [];
var ultimoPedidoId = 0;

/* ══ REGISTROS ══ */
async function buscarClientes() {
  try {
    var data = await req('GET', '/clientes?select=id,nome,telefone,endereco,criado_em&order=criado_em.desc');
    clientes = Array.isArray(data) ? data : [];

    // Enriquecer campos vazios com dados dos pedidos (vínculo seguro por cliente_id)
    var semEnd = clientes.filter(function(c){ return !c.endereco; });
    if (semEnd.length > 0) {
      var ids = semEnd.map(function(c){ return c.id; }).join(',');
      try {
        var pedExt = await req('GET', '/pedidos?select=cliente_id,endereco,nome,telefone&cliente_id=in.(' + ids + ')&endereco=neq.&order=criado_em.desc');
        if (Array.isArray(pedExt)) {
          pedExt.forEach(function(p) {
            var cl = clientes.find(function(c){ return c.id === p.cliente_id; });
            if (!cl) return;
            if (!cl.endereco && p.endereco) { cl.endereco = p.endereco; cl._endFonte = 'pedido'; }
            if (!cl.nome     && p.nome)     { cl.nome     = p.nome;     cl._nomeFonte = 'pedido'; }
            if (!cl.telefone && p.telefone) { cl.telefone = p.telefone; cl._telFonte  = 'pedido'; }
          });
        }
      } catch(_) {} // falha silenciosa — dados principais continuam visíveis
    }

    renderClientes();
    syncOK();
  } catch(e) {
    aviso('Erro ao buscar clientes: ' + e.message);
    syncErr();
  }
}

function renderClientes() {
  var nome = document.getElementById('rNome').value.toLowerCase();
  var tel  = document.getElementById('rTel').value.replace(/\D/g, '');
  var lista = clientes.filter(function(c){
    return (!nome || (c.nome||'').toLowerCase().indexOf(nome) !== -1)
        && (!tel  || (c.telefone||'').indexOf(tel) !== -1);
  });

  document.getElementById('rLoading').style.display = 'none';
  document.getElementById('rCount').textContent = lista.length + ' cliente' + (lista.length !== 1 ? 's' : '');

  if (!lista.length) {
    document.getElementById('rTab').style.display   = 'none';
    document.getElementById('rVazio').style.display = 'block';
    return;
  }
  document.getElementById('rVazio').style.display = 'none';
  document.getElementById('rTab').style.display   = 'table';

  var tbody = document.getElementById('rTbody');
  tbody.innerHTML = '';
  lista.forEach(function(c) {
    var telClean = String(c.telefone || '').replace(/\D/g, '');
    var telExib  = telClean.match(/^\d{10,11}$/)
      ? telClean.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')
      : esc(c.telefone || '—');
    var waLink = telClean.match(/^\d{10,11}$/)
      ? '<a href="https://wa.me/55' + telClean + '" target="_blank" rel="noopener noreferrer">📱 ' + esc(telExib) + '</a>'
      : '<span style="color:var(--muted)">' + esc(c.telefone || '—') + '</span>';
    var dt = c.criado_em
      ? new Date(c.criado_em).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})
      : '—';
    var endExib = c.endereco
      ? esc(c.endereco) + (c._endFonte === 'pedido' ? ' <span style="font-size:10px;color:var(--muted);margin-left:4px">📦 via pedido</span>' : '')
      : '<span style="color:var(--muted)">—</span>';
    var nomeExib = esc(c.nome || '—') + (c._nomeFonte === 'pedido' ? ' <span style="font-size:10px;color:var(--muted)">📦</span>' : '');

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="tid">#' + c.id + '</td>'
      + '<td class="tnome">' + nomeExib + '</td>'
      + '<td class="ttel">'  + waLink + '</td>'
      + '<td class="tend">'  + endExib + '</td>'
      + '<td class="tdata">' + dt + '</td>';
    tbody.appendChild(tr);
  });
}

/* ══ PEDIDOS ══ */
async function buscarPedidos() {
  try {
    var data = await req('GET', '/pedidos?select=id,nome,telefone,endereco,itens,total,pagamento,status,criado_em&order=criado_em.desc');
    pedidos = Array.isArray(data) ? data : [];

    // Detectar novo pedido confirmado
    var maxId = pedidos.length ? Math.max.apply(null, pedidos.map(function(p){ return p.id; })) : 0;
    if (ultimoPedidoId > 0 && maxId > ultimoPedidoId) {
      var novo = pedidos.find(function(p){ return p.id === maxId; });
      if (novo) {
        toast('🛒 Novo pedido de ' + esc(novo.nome || 'cliente') + ' — ' + statusLabel(novo.status));
        beep();
        notif('Novo pedido de ' + (novo.nome || 'cliente'));
      }
    }
    ultimoPedidoId = maxId;

    kpis();
    renderPedidos();
    syncOK();
    aviso('');
  } catch(e) {
    aviso('Erro ao buscar pedidos: ' + e.message);
    syncErr();
  }
}

function kpis() {
  var tot  = pedidos.length;
  var ag   = pedidos.filter(function(p){ return p.status === 'aguardando'; }).length;
  var con  = pedidos.filter(function(p){ return p.status === 'confirmado'; }).length;
  var ent  = pedidos.filter(function(p){ return p.status === 'entregue'; }).length;
  var fat  = pedidos.reduce(function(s, p){ return s + parseFloat(p.total || 0); }, 0);
  document.getElementById('kTot').textContent = tot;
  document.getElementById('kAg').textContent  = ag;
  document.getElementById('kCon').textContent = con;
  document.getElementById('kEnt').textContent = ent;
  document.getElementById('kFat').textContent = 'R$ ' + fat.toFixed(2).replace('.', ',');
}

function renderPedidos() {
  var st   = document.getElementById('pStatus').value;
  var nome = document.getElementById('pNome').value.toLowerCase();
  var data = document.getElementById('pData').value;
  var lista = pedidos.filter(function(p){
    return (!st   || p.status === st)
        && (!nome || (p.nome || '').toLowerCase().indexOf(nome) !== -1)
        && (!data || (p.criado_em || '').indexOf(data) !== -1);
  });

  document.getElementById('pLoading').style.display = 'none';
  document.getElementById('pCount').textContent = lista.length + ' pedido' + (lista.length !== 1 ? 's' : '');

  if (!lista.length) {
    document.getElementById('pTab').style.display   = 'none';
    document.getElementById('pVazio').style.display = 'block';
    return;
  }
  document.getElementById('pVazio').style.display = 'none';
  document.getElementById('pTab').style.display   = 'table';

  var tbody = document.getElementById('pTbody');
  tbody.innerHTML = '';
  lista.forEach(function(p) {
    var telClean = String(p.telefone || '').replace(/\D/g, '');
    var telValido = /^\d{10,11}$/.test(telClean);
    var telExib   = telValido ? telClean.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3') : esc(p.telefone || '—');
    var waLink = telValido
      ? '<a href="https://wa.me/55' + telClean + '" target="_blank" rel="noopener noreferrer">📱 ' + esc(telExib) + '</a>'
      : '<span style="color:var(--muted)">' + esc(p.telefone || '—') + '</span>';

    var itens = Array.isArray(p.itens) ? p.itens : [];
    var itensHtml = itens.length
      ? itens.map(function(i){ return '· ' + esc(i.nome) + ' <b style="color:var(--rosa)">R$' + parseFloat(i.preco||0).toFixed(2).replace('.',',') + '</b>'; }).join('<br>')
      : '<span style="color:var(--muted)">—</span>';

    var dt = p.criado_em
      ? new Date(p.criado_em).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})
      : '—';

    var st = p.status || 'aguardando';
    var statusSelect =
      '<select class="status ' + st + '" onchange="mudarStatus(' + p.id + ',this)">'
      + '<option value="aguardando"' + (st==='aguardando'?' selected':'') + '>⏳ Aguardando</option>'
      + '<option value="confirmado"' + (st==='confirmado'?' selected':'') + '>✅ Confirmado</option>'
      + '<option value="entregue"'   + (st==='entregue'  ?' selected':'') + '>🚚 Entregue</option>'
      + '<option value="cancelado"'  + (st==='cancelado' ?' selected':'') + '>❌ Cancelado</option>'
      + '</select>';

    var tr = document.createElement('tr');
    tr.id = 'r' + p.id;
    tr.innerHTML =
      '<td class="tid">#' + p.id + '</td>'
      + '<td class="tnome">' + esc(p.nome || '—') + '</td>'
      + '<td class="ttel">'  + waLink + '</td>'
      + '<td class="titens">' + itensHtml + '</td>'
      + '<td class="ttotal">R$ ' + parseFloat(p.total || 0).toFixed(2).replace('.', ',') + '</td>'
      + '<td style="font-size:12px;color:var(--muted)">' + esc(p.pagamento || '—') + '</td>'
      + '<td>' + statusSelect + '</td>'
      + '<td class="tdata">' + dt + '</td>'
      + '<td><button class="del" onclick="delPedido(' + p.id + ')">🗑</button></td>';
    tbody.appendChild(tr);
  });
}

/* ══ AÇÕES PEDIDOS ══ */
async function mudarStatus(id, sel) {
  var novo = sel.value;
  sel.className = 'status ' + novo;
  try {
    await req('PATCH', '/pedidos?id=eq.' + id, { status: novo });
    var i = pedidos.findIndex(function(p){ return p.id === id; });
    if (i !== -1) pedidos[i].status = novo;
    kpis();
    toast('Status atualizado → ' + statusLabel(novo));
  } catch(e) {
    aviso('Erro ao atualizar: ' + e.message);
    buscarPedidos();
  }
}

async function delPedido(id) {
  var p = pedidos.find(function(x){ return x.id === id; });
  if (!confirm('Remover pedido #' + id + ' de ' + (p ? p.nome : '?') + '?\nEssa ação não pode ser desfeita.')) return;
  try {
    await req('DELETE', '/pedidos?id=eq.' + id);
    pedidos = pedidos.filter(function(x){ return x.id !== id; });
    kpis(); renderPedidos();
    toast('Pedido #' + id + ' removido');
  } catch(e) { aviso('Erro ao remover: ' + e.message); }
}

/* ══ CSV ══ */
function csvCell(val) {
  var s = String(val == null ? '' : val);
  // Proteção contra CSV/fórmula injection (Excel executa células que começam com = + - @)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

function exportarCSV() {
  var rows = [['#','Cliente','Telefone','Itens','Total','Pagamento','Status','Data']];
  pedidos.forEach(function(p){
    var itens = Array.isArray(p.itens)
      ? p.itens.map(function(i){ return (i.nome||'') + ' R$' + parseFloat(i.preco||0).toFixed(2); }).join(' | ')
      : '';
    rows.push([
      p.id, p.nome||'', p.telefone||'', itens,
      parseFloat(p.total||0).toFixed(2), p.pagamento||'', p.status||'',
      p.criado_em ? new Date(p.criado_em).toLocaleString('pt-BR', {timeZone:'America/Sao_Paulo'}) : ''
    ]);
  });
  var txt = rows.map(function(r){ return r.map(csvCell).join(','); }).join('\n');
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(txt);
  a.download = 'gelamour-pedidos-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  toast('CSV exportado (' + pedidos.length + ' pedidos)');
}

/* ══ HELPERS ══ */
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function statusLabel(s){ return {aguardando:'⏳ Aguardando',confirmado:'✅ Confirmado',entregue:'🚚 Entregue',cancelado:'❌ Cancelado'}[s] || s; }
function syncOK(){ document.getElementById('sync-dot').style.background='var(--green)'; document.getElementById('sync-txt').textContent = '🟢 ' + new Date().toLocaleTimeString('pt-BR'); }
function syncErr(){ document.getElementById('sync-dot').style.background='var(--red)'; document.getElementById('sync-txt').textContent = '🔴 Erro de conexão'; }
function aviso(msg){ var el=document.getElementById('aviso'); el.textContent=msg?'⚠️ '+msg:''; el.style.display=msg?'block':'none'; }
var _toastT;
function toast(msg){ var el=document.getElementById('toast'); el.textContent=msg; el.classList.add('on'); clearTimeout(_toastT); _toastT=setTimeout(function(){ el.classList.remove('on'); },3800); }
function notif(msg){ if(Notification.permission==='granted') new Notification('Gelamour 🍰',{body:msg}); else if(Notification.permission!=='denied') Notification.requestPermission(); }
function beep(){try{var ctx=new(window.AudioContext||window.webkitAudioContext)();var o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.setValueAtTime(880,ctx.currentTime);o.frequency.setValueAtTime(1100,ctx.currentTime+.1);g.gain.setValueAtTime(.4,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.4);o.start();o.stop(ctx.currentTime+.4);}catch(_){}}

/* ══ BOOT ══ */
var _pollId = null;

function iniciar() {
  buscarClientes();

  _pollId = setInterval(function(){
    // Para o polling se o token expirou
    var exp = parseInt(sessionStorage.getItem(EXP_KEY) || '0');
    if (exp && exp < Date.now()) { clearInterval(_pollId); sair(); return; }
    if (abaAtiva === 'registros') buscarClientes();
    if (abaAtiva === 'pedidos')   buscarPedidos();
  }, POLL);

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
}

verificarSessao();
