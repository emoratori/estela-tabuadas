'use strict';
/* ===== Utilidades ===== */
const app = document.getElementById('app');
const LS = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
const ds = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => ds(new Date());
const shift = n => { const d = new Date(); d.setDate(d.getDate() + n); return ds(d); };
const rnd = a => a[Math.floor(Math.random() * a.length)];
const pct = (a, t) => t ? Math.round(a / t * 100) : 0;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pkey = n => 'et_p_' + encodeURIComponent(n.toLowerCase());

/* ===== Estado ===== */
let cfg = LS.get('et_cfg', { sound: true, vibe: true, last: null });
let P = null, G = null, S = null, cur = null, NEW = [], RANGE = 7, GATE = 0, fromSession = false;
const saveCfg = () => LS.set('et_cfg', cfg);
const save = () => LS.set(pkey(P.name), P);

/* ===== Mascotes ===== */
const MASCOTS = [
  { e: '🥚', n: 'Ovinho', pts: 0, days: 0 },
  { e: '🐣', n: 'Pintinho', pts: 100, days: 2 },
  { e: '🐶', n: 'Totó', pts: 300, days: 3 },
  { e: '🐱', n: 'Mimi', pts: 700, days: 5 },
  { e: '🦊', n: 'Raposa', pts: 1200, days: 7 },
  { e: '🐼', n: 'Panda', pts: 2000, days: 10 },
  { e: '🦄', n: 'Unicórnio', pts: 3000, days: 14 },
  { e: '🐲', n: 'Dragão', pts: 4500, days: 21 },
  { e: '🤖', n: 'Robô', pts: 6500, days: 30 }
];
const unlocked = m => m.pts === 0 || P.points >= m.pts || P.best >= m.days;
function checkUnlocks() {
  const n = MASCOTS.filter(m => unlocked(m) && !P.notified.includes(m.e));
  n.forEach(m => P.notified.push(m.e));
  if (n.length) { save(); sfx.win(); confetti(); }
  return n;
}
const unlockBanner = () => NEW.map(m => `<div class="card text-center" style="background:#fef9c3"><div class="mascot">${m.e}</div>
  <p class="font-extrabold">🎉 Novo amigo: ${m.n}!</p><button class="btn sm green" data-a="pick" data-v="${m.e}">Usar agora</button></div>`).join('');

/* ===== Som, vibração e confete ===== */
let AC;
function tone(f, d, t = 'sine', when = 0, v = .15) {
  if (!cfg.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = t; o.frequency.value = f; o.connect(g); g.connect(AC.destination);
    const s = AC.currentTime + when;
    g.gain.setValueAtTime(v, s); g.gain.exponentialRampToValueAtTime(.001, s + d);
    o.start(s); o.stop(s + d);
  } catch {}
}
const sfx = {
  ok() { tone(660, .12); tone(880, .18, 'sine', .1); },
  bad() { tone(220, .28, 'triangle'); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, 'sine', i * .1)); }
};
const vib = p => { if (cfg.vibe && navigator.vibrate) navigator.vibrate(p); };
function confetti() {
  const em = ['🎉', '⭐', '✨', '🎈', '🌟'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.className = 'conf'; s.textContent = rnd(em);
    s.style.left = Math.random() * 95 + 'vw'; s.style.animationDelay = Math.random() * .5 + 's';
    document.body.appendChild(s); setTimeout(() => s.remove(), 2800);
  }
}

/* ===== Perfis ===== */
const listProfiles = () => LS.get('et_profiles', []);
function newProfile(name) {
  const w = {};
  for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) w[a + 'x' + b] = 10;
  return { name, points: 0, w, st: {}, daily: {}, streak: 0, best: 0, lastDay: null, mascot: '🥚', notified: ['🥚'] };
}
function enter(name) {
  name = (name || '').trim().slice(0, 20);
  if (!name) return;
  let p = LS.get(pkey(name));
  if (!p) { p = newProfile(name); const ps = listProfiles(); ps.push(name); LS.set('et_profiles', ps); }
  P = p; cfg.last = P.name; saveCfg(); save(); home();
}
const curStreak = () => (P.lastDay === today() || P.lastDay === shift(-1)) ? P.streak : 0;

/* ===== Telas ===== */
function show(html, fn) { cur = fn; app.innerHTML = html; window.scrollTo(0, 0); }

function profiles() {
  G = null;
  const ps = listProfiles();
  show(`<div class="screen">
    <div class="text-center"><div style="font-size:4rem">👧🏻</div><div class="logo">Estela Tabuadas</div><p>Quem vai estudar hoje?</p></div>
    ${ps.map(n => `<button class="btn blue" data-a="enter" data-v="${esc(n)}">🙂 ${esc(n)}</button>`).join('')}
    <div class="card"><p class="font-extrabold mb-2">➕ Novo jogador</p>
      <input id="nm" class="inp" maxlength="20" placeholder="Digite seu nome" autocomplete="off">
      <button class="btn green mt-3" data-a="newp">Entrar</button></div></div>`, profiles);
}

function home() {
  G = null; S = null;
  const next = MASCOTS.find(m => !unlocked(m));
  show(`<div class="screen">
    <div class="flex justify-between items-center">
      <button class="chip" data-a="profiles">👤 ${esc(P.name)}</button>
      <div class="flex gap-2"><button class="chip" data-a="snd">${cfg.sound ? '🔊' : '🔇'}</button><button class="chip" data-a="vib">${cfg.vibe ? '📳' : '📴'}</button></div></div>
    <div class="flex-1 flex flex-col items-center justify-center gap-3 text-center">
      <div class="mascot big">${P.mascot}</div>
      <p class="text-xl font-extrabold">Oi, ${esc(P.name)}!</p>
      <div class="flex gap-3"><div class="stat">⭐ ${P.points}</div><div class="stat">🔥 ${curStreak()} dia(s)</div></div>
      ${next ? `<p class="text-sm">Próximo amigo ${next.e}: faltam ${Math.max(0, next.pts - P.points)} ⭐ ou ${next.days} dias seguidos (melhor sequência: ${P.best})</p>` : '<p class="text-sm">🏆 Você desbloqueou todos os amigos!</p>'}
    </div>
    <button class="btn green" data-a="play">▶ Jogar</button>
    <div class="grid grid-cols-3 gap-2">
      <button class="btn sm blue" data-a="friends">🐾 Amigos</button>
      <button class="btn sm orange" data-a="evo">📊 Evolução</button>
      <button class="btn sm purple" data-a="parents">👨‍👩‍👧 Pais</button></div></div>`, home);
}

function friends() {
  show(`<div class="screen"><div class="logo">🐾 Meus amigos</div>${unlockBanner()}
    <div class="grid grid-cols-2 gap-3">${MASCOTS.map(m => {
      const u = unlocked(m);
      return `<button class="friend ${P.mascot === m.e ? 'sel' : ''} ${u ? '' : 'lock'}" ${u ? `data-a="pick" data-v="${m.e}"` : ''}>
        <div class="e">${u ? m.e : '🔒'}</div><b>${u ? m.n : '???'}</b>
        <div class="text-xs">${u ? (P.mascot === m.e ? 'Escolhido ✅' : 'Toque para usar') : `${m.pts} ⭐ ou ${m.days} dias seguidos`}</div></button>`;
    }).join('')}</div>
    <button class="btn gray" data-a="home">⬅ Voltar</button></div>`, friends);
}

/* ===== Jogo ===== */
const NAMES = ['João', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Bia', 'Davi', 'Laura', 'Caio', 'Sofia', 'Léo', 'Lívia'];
const STORIES = [
  (n, a, b) => `${n} quer dar <b>${a}</b> balas para cada um dos <b>${b}</b> amigos. Quantas balas são necessárias?`,
  (n, a, b) => `Uma caixa tem <b>${a}</b> lápis de cor. Quantos lápis há em <b>${b}</b> caixas?`,
  (n, a, b) => `Em cada prateleira cabem <b>${a}</b> livros. Quantos livros cabem em <b>${b}</b> prateleiras?`,
  (n, a, b) => `${n} comprou <b>${b}</b> pacotes com <b>${a}</b> figurinhas cada. Quantas figurinhas foram compradas?`,
  (n, a, b) => `Num pomar há <b>${b}</b> fileiras com <b>${a}</b> árvores cada. Quantas árvores existem?`,
  (n, a, b) => `Um ônibus tem <b>${b}</b> fileiras com <b>${a}</b> assentos. Quantos assentos tem o ônibus?`,
  (n, a, b) => `${n} plantou <b>${a}</b> sementes em cada um de <b>${b}</b> vasos. Quantas sementes foram plantadas?`,
  (n, a, b) => `Cada cartela tem <b>${a}</b> ovos. Quantos ovos há em <b>${b}</b> cartelas?`,
  (n, a, b) => `Cada pizza tem <b>${a}</b> fatias. Quantas fatias há em <b>${b}</b> pizzas?`,
  (n, a, b) => `${n} lê <b>${a}</b> páginas por dia. Quantas páginas lê em <b>${b}</b> dias?`,
  (n, a, b) => `Um álbum tem <b>${b}</b> páginas e cada página tem <b>${a}</b> adesivos. Quantos adesivos tem o álbum?`,
  (n, a, b) => `Na festa de ${n} há <b>${b}</b> mesas com <b>${a}</b> cadeiras em cada. Quantas cadeiras há?`,
  (n, a, b) => `${n} guardou <b>${a}</b> moedas em cada um de <b>${b}</b> cofrinhos. Quantas moedas foram guardadas?`,
  (n, a, b) => `A turma de ${n} tem <b>${b}</b> grupos com <b>${a}</b> alunos cada. Quantos alunos há na turma?`,
  (n, a, b) => `Um jardineiro plantou <b>${b}</b> canteiros com <b>${a}</b> flores em cada um. Quantas flores ele plantou?`,
  (n, a, b) => `Cada gaveta guarda <b>${a}</b> camisetas. Quantas camisetas cabem em <b>${b}</b> gavetas?`,
  (n, a, b) => `${n} deu <b>${a}</b> voltas na pista em cada um de <b>${b}</b> dias. Quantas voltas deu no total?`,
  (n, a, b) => `Uma padaria fez <b>${b}</b> fornadas com <b>${a}</b> pães em cada uma. Quantos pães foram feitos?`,
  (n, a, b) => `Cada pacote de suco tem <b>${a}</b> caixinhas. Quantas caixinhas há em <b>${b}</b> pacotes?`,
  (n, a, b) => `Num estacionamento há <b>${b}</b> fileiras com <b>${a}</b> vagas cada. Quantas vagas existem?`,
  (n, a, b) => `${n} montou <b>${b}</b> torres com <b>${a}</b> blocos em cada uma. Quantos blocos foram usados?`,
  (n, a, b) => `Cada aquário tem <b>${a}</b> peixinhos. Quantos peixinhos há em <b>${b}</b> aquários?`,
  (n, a, b) => `Uma professora entregou <b>${a}</b> folhas para cada um de <b>${b}</b> alunos. Quantas folhas ela entregou?`,
  (n, a, b) => `Em cada cacho há <b>${a}</b> uvas. Quantas uvas há em <b>${b}</b> cachos?`,
  (n, a, b) => `${n} fez <b>${a}</b> pontos em cada uma de <b>${b}</b> partidas. Quantos pontos fez ao todo?`,
  (n, a, b) => `Um trem tem <b>${b}</b> vagões e cada vagão leva <b>${a}</b> passageiros. Quantos passageiros o trem leva?`,
  (n, a, b) => `${n} faz <b>${a}</b> abdominais por dia. Quantas faz em <b>${b}</b> dias?`,
  (n, a, b) => `Uma estante tem <b>${b}</b> prateleiras e em cada uma há <b>${a}</b> brinquedos. Quantos brinquedos há na estante?`,
  (n, a, b) => `Cada pacote tem <b>${a}</b> biscoitos e ${n} comprou <b>${b}</b> pacotes. Quantos biscoitos são no total?`,
  (n, a, b) => `Um cinema tem <b>${b}</b> salas com <b>${a}</b> poltronas cada. Quantas poltronas há no cinema?`
];
const mkStory = (a, b) => rnd(STORIES)(rnd(NAMES), a, b);
const PRAISE = ['Muito bem! 🎉', 'Isso aí! 🌟', 'Mandou bem! 👏', 'Arrasou! 🚀', 'Perfeito! ✨', 'Show! 😎'];

function startGame() { G = null; S = { ok: 0, err: 0, pts: 0, ms: 0, rounds: 0 }; startRound(); }
function startRound() {
  G = { n: 0, ok: 0, err: 0, pts: 0, streak: G ? G.streak : 0, story: Math.floor(Math.random() * 10), last: G ? G.last : null, fb: null };
  S.rounds++; nextQ();
}
function roulette(keys) {
  const tot = keys.reduce((s, k) => s + P.w[k], 0);
  let r = Math.random() * tot;
  for (const k of keys) { r -= P.w[k]; if (r <= 0) return k; }
  return keys[keys.length - 1];
}
function nextQ() {
  const keys = Object.keys(P.w); let k;
  for (let i = 0; i < 8; i++) { k = roulette(keys); if (k !== G.last) break; }
  G.last = k;
  const [a, b] = k.split('x').map(Number);
  G.q = { k, a, b, story: G.n === G.story ? mkStory(a, b) : null };
  G.inp = ''; G.fb = null; G.t0 = Date.now();
  drawGame();
}
function drawGame() {
  const q = G.q;
  show(`<div class="screen">
    <div class="flex items-center justify-between gap-2">
      <div class="chip">📝 ${G.n + 1}/10</div><div class="chip">⭐ ${P.points}</div><div class="chip">⚡ ${G.streak}</div>
      <button class="chip red" data-a="end">⏹ Encerrar</button></div>
    <div class="flex items-center gap-3"><div class="mascot" id="mas">${P.mascot}</div><div class="flex-1"><div class="tbar"><i></i></div></div></div>
    <div class="qcard">${q.story ? `<p class="story">📖 ${q.story}</p><div class="qbig">= ?</div>` : `<div class="qbig">${q.a} × ${q.b} = ?</div>`}</div>
    <div class="disp" id="disp">&nbsp;</div>
    <div id="fb" class="fb" data-a="skip"></div>
    <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="k" data-a="key" data-v="${d}">${d}</button>`).join('')}
      <button class="k del" data-a="del">⌫</button><button class="k" data-a="key" data-v="0">0</button><button class="k go" data-a="ok">✔</button></div></div>`, null);
  cur = 'game';
}
function answer() {
  const q = G.q, v = +G.inp, t = Math.min((Date.now() - G.t0) / 1000, 60), good = v === q.a * q.b;
  const t0 = today();
  const st = P.st[q.k] || (P.st[q.k] = { ok: 0, err: 0, ms: 0 });
  const day = P.daily[t0] || (P.daily[t0] = { ok: 0, err: 0, pts: 0, ms: 0 });
  if (P.lastDay !== t0) { P.streak = P.lastDay === shift(-1) ? P.streak + 1 : 1; P.best = Math.max(P.best, P.streak); P.lastDay = t0; }
  st.ms += t * 1000; day.ms += t * 1000; S.ms += t * 1000;
  let pts = 0, msg;
  if (good) {
    P.w[q.k] = Math.max(1, +(P.w[q.k] * .7).toFixed(2));
    st.ok++; day.ok++; S.ok++; G.ok++; G.streak++;
    pts = 10 + Math.round(Math.max(0, 5 - t) * 2) + (G.streak >= 3 ? Math.min(G.streak, 10) : 0);
    P.points += pts; day.pts += pts; S.pts += pts; G.pts += pts;
    msg = rnd(PRAISE) + ` +${pts} ⭐`;
    if (G.streak % 5 === 0) { msg = `🔥 ${G.streak} acertos seguidos! +${pts} ⭐`; confetti(); }
    sfx.ok(); vib(30);
  } else {
    P.w[q.k] = Math.min(100, P.w[q.k] * 2);
    st.err++; day.err++; S.err++; G.err++; G.streak = 0;
    msg = `Quase! ${q.a} × ${q.b} = <span style="font-size:1.6rem">${q.a * q.b}</span> 💪`;
    sfx.bad(); vib([60, 40, 60]);
  }
  save(); G.fb = true;
  const fb = document.getElementById('fb'), mas = document.getElementById('mas');
  fb.className = 'fb ' + (good ? 'ok' : 'bad'); fb.innerHTML = msg;
  mas.className = 'mascot ' + (good ? 'cheer' : 'oops');
  G.to = setTimeout(advance, good ? 1100 : 2600);
}
function advance() {
  clearTimeout(G.to); G.n++;
  G.n >= 10 ? roundEnd() : nextQ();
}
function roundEnd() {
  NEW = checkUnlocks();
  roundView();
}
function roundView() {
  const acc = pct(G.ok, G.ok + G.err), stars = acc >= 90 ? 3 : acc >= 60 ? 2 : 1;
  show(`<div class="screen text-center">
    <div class="logo">Rodada completa!</div>
    <div style="font-size:3rem">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <div class="mascot big" style="font-size:6rem">${P.mascot}</div>
    <div class="card"><div class="row"><span>✅ Acertos</span><b>${G.ok}</b></div><div class="row"><span>❌ Erros</span><b>${G.err}</b></div>
      <div class="row"><span>🎯 Precisão</span><b>${acc}%</b></div><div class="row"><span>⭐ Pontos da rodada</span><b>${G.pts}</b></div></div>
    ${unlockBanner()}
    <div class="mt-auto flex flex-col gap-3"><button class="btn green" data-a="next">▶ Próxima rodada</button>
    <button class="btn red" data-a="end">⏹ Encerrar</button></div></div>`, roundView);
}
function endStudy() {
  if (G && G.to) clearTimeout(G.to);
  if (!S || S.ok + S.err === 0) return home();
  NEW = NEW.concat(checkUnlocks());
  fromSession = true; statsView();
}

/* ===== Estatísticas ===== */
const g = k => P.daily[k] || { ok: 0, err: 0, pts: 0, ms: 0 };
const sumD = (a, b) => { const r = { ok: 0, err: 0, pts: 0, ms: 0 }; for (let i = a; i <= b; i++) { const x = g(shift(i)); for (const k in r) r[k] += x[k]; } return r; };
const accD = x => pct(x.ok, x.ok + x.err);
const avgT = x => (x.ok + x.err) ? (x.ms / (x.ok + x.err) / 1000).toFixed(1) + 's' : '-';
const dlt = (c, r, suf = '%') => { const d = c - r; return d > 0 ? `<span class="up">▲ +${d}${suf}</span>` : d < 0 ? `<span class="dn">▼ ${d}${suf}</span>` : '<span>= igual</span>'; };

function statsView() {
  const td = g(today()), yd = g(shift(-1));
  const prev = []; for (let i = -7; i <= -1; i++) { const x = g(shift(i)); if (x.ok + x.err) prev.push(x); }
  const avgAcc = prev.length ? Math.round(prev.reduce((s, x) => s + accD(x), 0) / prev.length) : null;
  const avgQ = prev.length ? Math.round(prev.reduce((s, x) => s + x.ok + x.err, 0) / prev.length) : null;
  const w1 = sumD(-6, 0), w0 = sumD(-13, -7), per = sumD(-(RANGE - 1), 0);
  const tn = td.ok + td.err, yn = yd.ok + yd.err;
  let bars = '';
  for (let i = -(RANGE - 1); i <= 0; i++) {
    const d = new Date(); d.setDate(d.getDate() + i); const x = g(ds(d)), n = x.ok + x.err, a = accD(x);
    const col = !n ? '#e9d5ff' : a >= 85 ? '#22c55e' : a >= 60 ? '#facc15' : '#f87171';
    bars += `<div class="bar">${n ? `<span>${a}%</span>` : ''}<i style="height:${n ? Math.max(6, a) * 0.9 : 3}px;background:${col}"></i><span>${d.getDate()}</span></div>`;
  }
  const sess = fromSession && S ? `<div class="card"><h3>🎒 Este estudo (${S.rounds} rodada${S.rounds > 1 ? 's' : ''})</h3>
    <div class="row"><span>✅ Acertos</span><b>${S.ok}</b></div><div class="row"><span>❌ Erros</span><b>${S.err}</b></div>
    <div class="row"><span>🎯 Precisão</span><b>${pct(S.ok, S.ok + S.err)}%</b></div><div class="row"><span>⭐ Pontos</span><b>${S.pts}</b></div>
    <div class="row"><span>⏱ Tempo médio</span><b>${(S.ms / (S.ok + S.err) / 1000).toFixed(1)}s</b></div></div>` : '';
  let trend = '';
  if (w0.ok + w0.err && w1.ok + w1.err) trend = `<p>Últimos 7 dias: <b>${accD(w1)}%</b> de acerto, contra <b>${accD(w0)}%</b> nos 7 dias anteriores ${dlt(accD(w1), accD(w0), ' pts')}</p>`;
  else trend = '<p>Continue jogando alguns dias para ver sua evolução semanal! 🌱</p>';
  show(`<div class="screen">
    <div class="logo">${fromSession ? '🎉 Resumo do estudo' : '📊 Minha evolução'}</div>${unlockBanner()}${sess}
    <div class="card"><h3>📅 Hoje</h3>
      <div class="row"><span>✅ Acertos / ❌ Erros</span><b>${td.ok} / ${td.err}</b></div>
      <div class="row"><span>🎯 Precisão</span><b>${accD(td)}%</b></div>
      <div class="row"><span>⭐ Pontos</span><b>${td.pts}</b></div>
      <div class="row"><span>⏱ Tempo médio</span><b>${avgT(td)}</b></div></div>
    <div class="card"><h3>🔄 Comparação com outros dias</h3>
      <div class="row"><span>Precisão vs ontem</span>${yn ? `<span>${accD(yd)}% ${dlt(accD(td), accD(yd), ' pts')}</span>` : '<span>sem dados</span>'}</div>
      <div class="row"><span>Questões vs ontem</span>${yn ? `<span>${yn} ${dlt(tn, yn, '')}</span>` : '<span>sem dados</span>'}</div>
      <div class="row"><span>Precisão vs média (7 dias)</span>${avgAcc !== null ? `<span>${avgAcc}% ${dlt(accD(td), avgAcc, ' pts')}</span>` : '<span>sem dados</span>'}</div>
      <div class="row"><span>Questões vs média (7 dias)</span>${avgQ !== null ? `<span>${avgQ} ${dlt(tn, avgQ, '')}</span>` : '<span>sem dados</span>'}</div></div>
    <div class="card"><h3>📈 Evolução da precisão</h3>
      <div class="seg mb-2"><button class="${RANGE === 7 ? 'on' : ''}" data-a="range" data-v="7">7 dias</button><button class="${RANGE === 30 ? 'on' : ''}" data-a="range" data-v="30">30 dias</button></div>
      <div class="bars">${bars}</div>
      <div class="row mt-2"><span>No período: ✅ acertos</span><b>${per.ok}</b></div><div class="row"><span>No período: ❌ erros</span><b>${per.err}</b></div>
      <div class="mt-2 text-sm">${trend}</div></div>
    <button class="btn green" data-a="${fromSession ? 'home' : 'home'}">🏠 Início</button></div>`, statsView);
}

/* ===== Área dos pais ===== */
function parents() {
  const a = 100 + Math.floor(Math.random() * 400), b = 100 + Math.floor(Math.random() * 400); GATE = a + b;
  show(`<div class="screen"><div class="logo">👨‍👩‍👧 Área dos pais</div>
    <div class="card text-center"><p class="mb-2">Para entrar, resolva:</p><p class="text-2xl font-extrabold mb-2">${a} + ${b} = ?</p>
    <input id="gate" class="inp" type="number" inputmode="numeric"><button class="btn purple mt-3" data-a="gate">Entrar</button></div>
    <button class="btn gray" data-a="home">⬅ Voltar</button></div>`, parents);
}
function parentView() {
  let ok = 0, err = 0, ms = 0;
  for (const k in P.st) { ok += P.st[k].ok; err += P.st[k].err; ms += P.st[k].ms; }
  const n = ok + err, days = Object.keys(P.daily).length;
  const hard = Object.keys(P.st).filter(k => P.st[k].err > 0).sort((x, y) => P.w[y] - P.w[x]).slice(0, 8);
  const col = w => w <= 3 ? '#86efac' : w <= 9 ? '#d9f99d' : w <= 20 ? '#fde68a' : w <= 40 ? '#fdba74' : '#f87171';
  let heat = '<div></div>' + [...Array(12)].map((_, i) => `<div>${i + 1}</div>`).join('');
  for (let a = 1; a <= 12; a++) { heat += `<div>${a}</div>`; for (let b = 1; b <= 12; b++) { const k = a + 'x' + b; heat += `<div title="${a}×${b}" style="background:${col(P.w[k])}"></div>`; } }
  show(`<div class="screen"><div class="logo">👨‍👩‍👧 ${esc(P.name)}</div>
    <div class="card"><h3>Resumo geral</h3>
      <div class="row"><span>Respostas</span><b>${n}</b></div><div class="row"><span>Acertos / Erros</span><b>${ok} / ${err}</b></div>
      <div class="row"><span>Precisão</span><b>${pct(ok, n)}%</b></div><div class="row"><span>Tempo médio por resposta</span><b>${n ? (ms / n / 1000).toFixed(1) + 's' : '-'}</b></div>
      <div class="row"><span>Dias estudados</span><b>${days}</b></div><div class="row"><span>Melhor sequência de dias</span><b>${P.best}</b></div>
      <div class="row"><span>Pontos</span><b>${P.points}</b></div></div>
    <div class="card"><h3>🎯 Mais difíceis</h3>${hard.length ? hard.map(k => { const s = P.st[k], [a, b] = k.split('x'); return `<div class="row"><span>${a} × ${b}</span><span>errou ${s.err} de ${s.ok + s.err} · ${((s.ms / (s.ok + s.err)) / 1000).toFixed(1)}s</span></div>`; }).join('') : '<p>Ainda sem erros registrados.</p>'}</div>
    <div class="card"><h3>🗺️ Mapa de prioridade (linha × coluna)</h3><div class="heat">${heat}</div>
      <p class="text-xs mt-2">Verde = dominada · Amarelo/Laranja = em treino · Vermelho = precisa de reforço. 7×3 e 3×7 são contas diferentes.</p></div>
    <button class="btn orange sm" data-a="reset">♻️ Zerar progresso deste perfil</button>
    <button class="btn red sm" data-a="delp">🗑️ Excluir este perfil</button>
    <button class="btn gray" data-a="home">⬅ Voltar</button></div>`, parentView);
}

/* ===== Eventos ===== */
const A = {
  profiles, home, friends, parents,
  enter: d => enter(d.v),
  newp: () => enter(document.getElementById('nm').value),
  snd: () => { cfg.sound = !cfg.sound; saveCfg(); sfx.ok(); home(); },
  vib: () => { cfg.vibe = !cfg.vibe; saveCfg(); vib(40); home(); },
  play: startGame, next: startRound, end: endStudy,
  evo: () => { fromSession = false; NEW = []; statsView(); },
  range: d => { RANGE = +d.v; statsView(); },
  pick: d => { P.mascot = d.v; NEW = NEW.filter(m => m.e !== d.v); save(); sfx.ok(); typeof cur === 'function' ? cur() : 0; },
  key: d => { if (G.fb || G.inp.length >= 3) return; G.inp += d.v; document.getElementById('disp').textContent = G.inp; tone(520, .05, 'sine', 0, .08); },
  del: () => { if (G.fb) return; G.inp = G.inp.slice(0, -1); document.getElementById('disp').innerHTML = G.inp || '&nbsp;'; },
  ok: () => { if (G.fb || !G.inp) return; answer(); },
  skip: () => { if (G && G.fb) advance(); },
  gate: () => { if (+document.getElementById('gate').value === GATE) parentView(); else { vib(80); parents(); } },
  reset: () => { if (confirm('Zerar todo o progresso de ' + P.name + '?')) { P = newProfile(P.name); save(); home(); } },
  delp: () => {
    if (!confirm('Excluir o perfil ' + P.name + ' para sempre?')) return;
    LS.del(pkey(P.name)); LS.set('et_profiles', listProfiles().filter(n => n !== P.name));
    P = null; cfg.last = null; saveCfg(); profiles();
  }
};
app.addEventListener('click', e => {
  const t = e.target.closest('[data-a]');
  if (t && A[t.dataset.a]) A[t.dataset.a](t.dataset);
});
document.addEventListener('keydown', e => {
  if (cur !== 'game' || !G) return;
  if (/^\d$/.test(e.key)) A.key({ v: e.key });
  else if (e.key === 'Backspace') A.del();
  else if (e.key === 'Enter') G.fb ? A.skip() : A.ok();
});

/* ===== Início ===== */
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
(function boot() {
  const p = cfg.last && LS.get(pkey(cfg.last));
  if (p) { P = p; home(); } else profiles();
})();
