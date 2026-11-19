'use strict';

/* =========================================================
   Escola de Dominó — dominó brasileiro em duplas, com professor
   ========================================================= */

const $ = (s) => document.querySelector(s);
const NUM = ['branco', 'ás', 'duque', 'terno', 'quadra', 'quina', 'sena'];
// Nomes dos jogadores (editáveis tocando no nome; ficam guardados nas opções).
const DEFAULT_NAMES = ['Você', 'Seu Zé', 'Tonhão', 'Dona Cida'];
const SEAT = DEFAULT_NAMES.slice();
const SEAT_LONG = ['você', '', '', ''];
function applyNames() {
  for (const p of [1, 2, 3]) SEAT[p] = (S.names && S.names[p]) || DEFAULT_NAMES[p];
  SEAT_LONG[1] = `${SEAT[1]} (adversário)`;
  SEAT_LONG[2] = `seu parceiro ${SEAT[2]}`;
  SEAT_LONG[3] = `${SEAT[3]} (adversária)`;
}
const PRON = ['você', 'ele', 'ele', 'ela'];
const ROLE = ['', 'adversário', 'parceiro', 'adversária'];
const TARGET = 6; // pontos para vencer a partida
const teamOf = (p) => p % 2; // 0 = Nós (você e parceiro), 1 = Eles

const has = (t, n) => t.a === n || t.b === n;
const pipsOf = (t) => t.a + t.b;
const key = (a, b) => (a <= b ? `${a}-${b}` : `${b}-${a}`);
const tid = (t) => key(t.a, t.b);
const isDouble = (t) => t.a === t.b;
const nn = (n) => `${n} (${NUM[n]})`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const listNums = (arr) => {
  const s = arr.map(nn);
  return s.length <= 1 ? s.join('') : s.slice(0, -1).join(', ') + ' nem ' + s[s.length - 1];
};
const listNumsE = (arr) => {
  const s = arr.map(nn);
  return s.length <= 1 ? s.join('') : s.slice(0, -1).join(', ') + ' e ' + s[s.length - 1];
};

const ALL = [];
for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) ALL.push({ a, b });

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const sortTiles = (x, y) => x.a - y.a || x.b - y.b;

/* ---------------- Desenho das pedras ---------------- */
const PIPS = { 0: [], 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 3, 6, 2, 5, 8] };
const PIPS_H6 = [0, 1, 2, 6, 7, 8];

function halfHTML(n, horiz) {
  const pos = horiz && n === 6 ? PIPS_H6 : PIPS[n];
  let s = `<div class="half n${n}">`;
  for (let i = 0; i < 9; i++) s += pos.includes(i) ? '<i class="pip"></i>' : '<i></i>';
  return s + '</div>';
}
function tileHTML(a, b, opts = {}) {
  const horiz = !!opts.h;
  const cls = opts.cls || '';
  const data = opts.data ? ` data-id="${opts.data}"` : '';
  return `<div class="tile ${horiz ? 'h' : 'v'} ${cls}"${data} title="${a}-${b}">${halfHTML(a, horiz)}${halfHTML(b, horiz)}</div>`;
}
const T = (a, b, h) => tileHTML(a, b, { h });
// Monta a fila da mesa "colando" cada marcador de ponta na pedra vizinha,
// para que ele nunca vá parar sozinho em outra linha quando a fila quebra.
function chainHTML(markL, tiles, markR) {
  if (tiles.length === 1) return `<span class="glue">${markL}${tiles[0]}${markR}</span>`;
  return `<span class="glue">${markL}${tiles[0]}</span>${tiles.slice(1, -1).join('')}<span class="glue">${tiles[tiles.length - 1]}${markR}</span>`;
}
const mark = (n, side) => (side === 'L' ? `<span class="endmark">◀ <b>${n}</b></span>` : `<span class="endmark"><b>${n}</b> ▶</span>`);
const backHTML = () => '<div class="tile v back"></div>';

/* ---------------- Personagens ----------------
   Cada jogador é um boneco diferente; a cor da camisa mostra o time
   (azul = sua dupla, vermelho = adversários). */
function avatarSVG(p) {
  const body = (shirt, skin, wide) => (wide
    ? `<path d="M3 64 C5 48 17 43 32 43 C47 43 59 48 61 64 Z" fill="${shirt}"/>`
    : `<path d="M9 64 C11 50 20 45 32 45 C44 45 53 50 55 64 Z" fill="${shirt}"/>`) +
    `<rect x="27" y="36" width="10" height="11" rx="3" fill="${skin}"/>`;
  const eyes = '<circle cx="27" cy="28" r="1.9" fill="#222"/><circle cx="37" cy="28" r="1.9" fill="#222"/>';
  if (p === 1) { // Seu Zé: senhor de boina e bigodão branco
    const skin = '#dfa877';
    return `<svg viewBox="0 0 64 64" aria-label="Seu Zé">${body('#e53935', skin)}
      <path d="M26 45 L32 52 L38 45 Z" fill="#fff"/>
      <circle cx="18" cy="29" r="3.2" fill="${skin}"/><circle cx="46" cy="29" r="3.2" fill="${skin}"/>
      <circle cx="32" cy="28" r="13.5" fill="${skin}"/>
      <ellipse cx="19.5" cy="25" rx="3" ry="5" fill="#d9d9d9"/><ellipse cx="44.5" cy="25" rx="3" ry="5" fill="#d9d9d9"/>
      <path d="M17 22 Q32 5 47 22 Z" fill="#6d4c41"/>
      <path d="M14 23 Q32 16 50 23 L50 25.5 Q32 20 14 25.5 Z" fill="#4e342e"/>
      <path d="M24.5 24.5 L29.5 25" stroke="#bbb" stroke-width="1.6" stroke-linecap="round"/><path d="M34.5 25 L39.5 24.5" stroke="#bbb" stroke-width="1.6" stroke-linecap="round"/>
      ${eyes}<ellipse cx="32" cy="31.5" rx="2.2" ry="2.6" fill="#c98b5c"/>
      <path d="M23.5 35.5 Q27.5 31.5 32 34 Q36.5 31.5 40.5 35.5 Q36.5 38.5 32 36.5 Q27.5 38.5 23.5 35.5 Z" fill="#f2f2f2"/>
      <path d="M28.5 39.5 Q32 41 35.5 39.5" stroke="#7a4b2a" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`;
  }
  if (p === 2) { // Tonhão: grandão de barba e boné azul virado
    const skin = '#8d5524';
    return `<svg viewBox="0 0 64 64" aria-label="Tonhão">${body('#1e88e5', skin, true)}
      <path d="M22 44 Q32 50 42 44" stroke="#1565c0" stroke-width="2.5" fill="none"/>
      <circle cx="17" cy="29" r="3.4" fill="${skin}"/><circle cx="47" cy="29" r="3.4" fill="${skin}"/>
      <circle cx="32" cy="28" r="15" fill="${skin}"/>
      <path d="M17 27 Q17 45 32 46 Q47 45 47 27 Q45 38 32 39 Q19 38 17 27 Z" fill="#2b1a10"/>
      <path d="M17 24 Q32 6 47 24 Z" fill="#1e88e5"/><rect x="11" y="21" width="13" height="4.5" rx="2.2" fill="#1565c0"/>
      <path d="M24 24.5 L30 23.5" stroke="#2b1a10" stroke-width="2.4" stroke-linecap="round"/><path d="M34 23.5 L40 24.5" stroke="#2b1a10" stroke-width="2.4" stroke-linecap="round"/>
      ${eyes}<ellipse cx="32" cy="32" rx="2.6" ry="2.2" fill="#6b3f1a"/>
      <path d="M26.5 35.5 Q32 41 37.5 35.5 Z" fill="#fff" stroke="#2b1a10" stroke-width="1"/></svg>`;
  }
  if (p === 3) { // Dona Cida: cabelo cacheado, óculos e brincos
    const skin = '#f1c27d';
    const hair = '#5d2e46';
    const curls = [[19, 22, 8], [24, 14, 8], [32, 11, 8.5], [40, 14, 8], [45, 22, 8], [16, 31, 6.5], [48, 31, 6.5], [17, 39, 5], [47, 39, 5]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hair}"/>`).join('');
    return `<svg viewBox="0 0 64 64" aria-label="Dona Cida">${curls}${body('#e53935', skin)}
      <path d="M27 45 Q32 51 37 45" fill="${skin}"/>
      <circle cx="32" cy="29" r="13" fill="${skin}"/>
      <circle cx="25" cy="18.5" r="4.5" fill="${hair}"/><circle cx="31" cy="16.5" r="4.5" fill="${hair}"/><circle cx="37.5" cy="17.5" r="4.5" fill="${hair}"/>
      <circle cx="19.5" cy="35" r="1.8" fill="#ffd54f"/><circle cx="44.5" cy="35" r="1.8" fill="#ffd54f"/>
      ${eyes}
      <circle cx="27" cy="28" r="4.3" fill="none" stroke="#333" stroke-width="1.4"/><circle cx="37" cy="28" r="4.3" fill="none" stroke="#333" stroke-width="1.4"/>
      <path d="M31.3 28 L32.7 28" stroke="#333" stroke-width="1.4"/>
      <path d="M31 31 Q32 33.5 33 31" stroke="#c98b5c" stroke-width="1.2" fill="none"/>
      <path d="M27.5 36 Q32 39.5 36.5 36 Q32 37.5 27.5 36 Z" fill="#c62828" stroke="#c62828" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="23" cy="33" r="2" fill="#f48fb1" opacity=".5"/><circle cx="41" cy="33" r="2" fill="#f48fb1" opacity=".5"/></svg>`;
  }
  return '';
}
const avatarMini = (p) => (p ? `<span class="av-mini">${avatarSVG(p)}</span>` : '');

/* ---------------- Configurações ---------------- */
function loadSettings() {
  try { return JSON.parse(localStorage.getItem('domino-settings') || '{}'); } catch (e) { return {}; }
}
const S = Object.assign(
  { professor: true, spy: false, colors: true, pace: 'passo', sound: true, anim: true, level: 'facil', lessonDone: -1, doubleName: 'carrao', customName: '', customGender: 'o' },
  loadSettings()
);
applyNames();
function saveSettings() {
  applyNames();
  try { localStorage.setItem('domino-settings', JSON.stringify(S)); } catch (e) { /* sem armazenamento: tudo bem */ }
}

/* -------- Nome das pedras de lados iguais (6-6, 5-5…): carrão, carroça, bucha… -------- */
const DOUBLE_NAMES = {
  carrao: { s: 'carrão', p: 'carrões', g: 'o' },
  carroca: { s: 'carroça', p: 'carroças', g: 'a' },
  bucha: { s: 'bucha', p: 'buchas', g: 'a' },
};
function pluralize(w) {
  if (/ão$/.test(w)) return w.replace(/ão$/, 'ões');
  if (/[rz]$/.test(w)) return w + 'es';
  if (/s$/.test(w)) return w;
  return w + 's';
}
// Devolve as palavras prontas (com artigos) para usar numa frase. No modo aleatório,
// cada chamada sorteia um nome — chame uma vez por frase para manter a frase coerente.
function W() {
  let base;
  if (S.doubleName === 'outro' && S.customName.trim()) {
    const n = S.customName.trim().toLowerCase().replace(/[<>&"']/g, '');
    base = { s: n, p: pluralize(n), g: S.customGender === 'a' ? 'a' : 'o' };
  } else if (S.doubleName === 'aleatorio') {
    const ks = Object.keys(DOUBLE_NAMES);
    base = DOUBLE_NAMES[ks[Math.floor(Math.random() * ks.length)]];
  } else base = DOUBLE_NAMES[S.doubleName] || DOUBLE_NAMES.carrao;
  const f = base.g === 'a';
  return {
    s: base.s, p: base.p, S: cap(base.s), P: cap(base.p),
    o: f ? 'a' : 'o', um: f ? 'uma' : 'um', do: f ? 'da' : 'do', dos: f ? 'das' : 'dos',
    ele: f ? 'ela' : 'ele', preso: f ? 'presa' : 'preso',
  };
}

/* ---------------- Sons (gerados na hora, sem arquivos) ----------------
   "Tec" de uma pedra batendo na outra quando alguém joga, e as batidinhas na mesa
   quando alguém passa, como na roda de verdade. */
let audioCtx = null;
function audio() {
  if (!S.sound) return null;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (e) { return null; }
}
// O navegador só libera o som depois de um toque na tela.
document.addEventListener('pointerdown', () => { audio(); }, { capture: true });

function noiseBurst(ctx, at, dur, freq, q, gain) {
  const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 5);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(at);
}

function tone(ctx, at, f0, f1, dur, gain) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(f0, at);
  o.frequency.exponentialRampToValueAtTime(f1, at + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ctx.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

// pedra encostando na outra: um estalo seco + um repique curtinho
function soundClack(strong = 1) {
  const ctx = audio();
  if (!ctx) return;
  try {
    const t = ctx.currentTime + 0.01;
    const v = 0.9 * strong;
    noiseBurst(ctx, t, 0.035, 2600, 3, v);
    tone(ctx, t, 1500, 900, 0.05, 0.22 * strong);
    noiseBurst(ctx, t + 0.045, 0.025, 3400, 4, v * 0.35);
  } catch (e) { /* sem som, tudo bem */ }
}

// passar a vez: duas batidinhas com a pedra na mesa
function soundKnock() {
  const ctx = audio();
  if (!ctx) return;
  try {
    const t = ctx.currentTime + 0.01;
    for (const dt of [0, 0.16]) {
      tone(ctx, t + dt, 220, 90, 0.12, 0.5);
      noiseBurst(ctx, t + dt, 0.04, 900, 1.5, 0.5);
    }
  } catch (e) { /* sem som, tudo bem */ }
}

/* ---------------- Estado do jogo ---------------- */
let G = null;
let gen = 0; // invalida timers antigos ao começar outra partida

function newGame() {
  gen++;
  G = { score: [0, 0], handNo: 0, nextStarter: null };
  newHand();
}

function newHand() {
  gen++;
  G.handNo++;
  const deck = shuffle(ALL.map((t) => ({ ...t })));
  G.hands = [0, 1, 2, 3].map((i) => deck.slice(i * 7, i * 7 + 7).sort(sortTiles));
  G.board = [];
  G.origin = 0; // índice da primeira pedra jogada (o centro da mesa)
  G.lacks = [0, 1, 2, 3].map(() => new Set());
  G.batida = null;
  G.lastPasser = null;
  G.over = false;
  G.selected = null;
  G.suggest = null;
  G.knownByMe = new Set();
  G.knownAboutMe = new Set();
  G.feed = [];
  G.undo = null;
  G.lastPlayer = null;
  G.mustSix = G.handNo === 1 || G.nextStarter == null;
  const start = G.mustSix ? G.hands.findIndex((h) => h.some((t) => t.a === 6 && t.b === 6)) : G.nextStarter;
  G.turn = start;
  say(
    `🃏 <b>Mão ${G.handNo}</b> — cada um recebeu 7 pedras. ` +
      (G.mustSix
        ? `Quem tem ${dn6()} começa: <b>${SEAT[start]}</b>.`
        : `Quem ganhou a mão anterior começa com qualquer pedra: <b>${SEAT[start]}</b>.`),
    'tip'
  );
  const startMsg = `🃏 <b>Mão ${G.handNo}</b> começou: cada um tem 7 pedras. Quem começa: ${avatarMini(start)} <b>${SEAT[start]}</b>.` +
    (G.handNo === 1 ? `<br><small>Adversários no nível <b>${(LEVELS[S.level] || LEVELS.facil).name}</b> (muda em ⚙️ Opções).</small>` : '');
  render();
  rollTiles(() => { narrate(startMsg); nextTurn(); });
}

function ends() {
  if (!G.board.length) return null;
  return [G.board[0].a, G.board[G.board.length - 1].b];
}

function legal(p) {
  const h = G.hands[p];
  if (!G.board.length) {
    if (G.mustSix) return h.filter((t) => t.a === 6 && t.b === 6).map((t) => ({ t, side: 'L' }));
    return h.map((t) => ({ t, side: 'L' }));
  }
  const [L, R] = ends();
  const out = [];
  for (const t of h) {
    if (has(t, L)) out.push({ t, side: 'L' });
    if (L !== R && has(t, R)) out.push({ t, side: 'R' });
  }
  return out;
}

function otherSide(t, n) { return t.a === n ? t.b : t.a; }

function resultEnds(m) {
  if (!G.board.length) return [m.t.a, m.t.b];
  const [L, R] = ends();
  return m.side === 'L' ? [otherSide(m.t, L), R] : [L, otherSide(m.t, R)];
}

// "o carrão de sena (6-6)" / "a carroça de sena (6-6)"
function dn6() { const w = W(); return `${w.o} ${w.s} de sena (6-6)`; }

function batidaType(t, e) {
  const [L, R] = e;
  const w = W();
  if (isDouble(t) && L === R && t.a === L) return { name: 'cruzada', pts: 4, desc: `${w.um} ${w.s} que servia nas duas pontas` };
  if (isDouble(t)) return { name: w.s, pts: 2, desc: `batida com ${w.s}` };
  if (L !== R && has(t, L) && has(t, R)) return { name: 'lá-e-lô', pts: 3, desc: 'a pedra servia nas duas pontas' };
  return { name: 'batida simples', pts: 1, desc: 'batida com pedra comum' };
}

function boardCount(n) { return G.board.filter((x) => x.a === n || x.b === n).length; }

/* -------- O que um jogador consegue deduzir (passes + contagem + eliminação) -------- */
function analyze(viewer) {
  const seen = new Set(G.board.map((x) => key(x.a, x.b)));
  G.hands[viewer].forEach((t) => seen.add(tid(t)));
  const counts = G.hands.map((h) => h.length);
  const poss = new Map();
  for (const t of ALL) {
    if (seen.has(tid(t))) continue;
    poss.set(
      tid(t),
      [0, 1, 2, 3].filter((q) => q !== viewer && counts[q] > 0 && !G.lacks[q].has(t.a) && !G.lacks[q].has(t.b))
    );
  }
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 60) {
    changed = false;
    for (let q = 0; q < 4; q++) {
      if (q === viewer) continue;
      const cand = [...poss].filter(([, ps]) => ps.includes(q));
      const sure = cand.filter(([, ps]) => ps.length === 1);
      if (cand.length === counts[q] && sure.length < cand.length) {
        cand.forEach(([k]) => poss.set(k, [q]));
        changed = true;
      } else if (sure.length === counts[q] && cand.length > sure.length) {
        cand.forEach(([k, ps]) => { if (ps.length > 1) poss.set(k, ps.filter((x) => x !== q)); });
        changed = true;
      }
    }
  }
  const certain = [[], [], [], []];
  for (const [k, ps] of poss) if (ps.length === 1) certain[ps[0]].push(k);
  return { poss, certain };
}

/* ---------------- Inteligência (usada pelos robôs e pela dica) ---------------- */
function evaluate(p) {
  const moves = legal(p);
  const hand = G.hands[p];
  const opp = (p + 1) % 4;
  const partner = (p + 2) % 4;
  const res = [];
  for (const m of moves) {
    const t = m.t;
    let s = 0;
    const why = [];
    const rest = hand.filter((x) => x !== t);

    if (!G.board.length) {
      const cnt = (n) => hand.filter((x) => has(x, n)).length;
      const bn = cnt(t.a) >= cnt(t.b) ? t.a : t.b;
      const best = cnt(bn);
      s += best * 3 + pipsOf(t) * 0.4 + (isDouble(t) ? 4 : 0);
      if (G.mustSix) { const w = W(); why.push(`Na primeira mão, quem tem ${w.o} ${w.s} de sena (6-6) é obrigado a começar com ${w.ele}.`); }
      else {
        why.push(`Você tem ${best} pedras com o ${nn(bn)}. Começar pelo número que você mais tem deixa você repetir esse número e mostra ao parceiro qual é o seu jogo.`);
        if (isDouble(t)) { const w = W(); why.push(`Sair com ${w.s} é ótimo: ${w.s} só encaixa num número, então é a pedra mais difícil de soltar depois.`); }
        if (pipsOf(t) >= 8) why.push(`Também tira da mão uma pedra pesada (${pipsOf(t)} pontos).`);
      }
      res.push({ m, s, why });
      continue;
    }

    const [nL, nR] = resultEnds(m);
    if (!rest.length) {
      const bt = batidaType(t, ends());
      s += 1000 + bt.pts * 10;
      why.push(`Você BATE (acaba as pedras) com ${bt.name}: vale ${bt.pts} ponto(s)!`);
      res.push({ m, s, why });
      continue;
    }

    const P = pipsOf(t);
    s += P * 0.6;
    if (isDouble(t)) {
      s += 5;
      const w = W();
      why.push(`Se livra de ${w.um} ${w.s}: ${w.ele} só encaixa em um número, então fica cada vez mais difícil de sair.`);
    }
    if (P >= 8) why.push(`Tira da mão uma pedra pesada (${P} pontos). Se o jogo trancar, pedra pesada na mão faz perder.`);

    const endNums = [...new Set([nL, nR])];
    const follow = rest.filter((x) => endNums.some((n) => has(x, n))).length;
    s += Math.min(follow, 3) * 2.5;
    if (follow === 0) {
      s -= 6;
      why.push(`Cuidado: depois dessa, nenhuma pedra sua encaixa nas pontas ${listNumsE(endNums)}. Risco de passar (e entregar informação).`);
    } else if (follow >= 2) {
      why.push(`Depois dessa você ainda tem ${follow} pedras que servem nas pontas (${listNumsE(endNums)}).`);
    }

    const oppLack = endNums.filter((n) => G.lacks[opp].has(n));
    if (oppLack.length === endNums.length) {
      s += 12;
      why.push(`${cap(SEAT_LONG[opp])} (que joga logo depois) já passou e não tem ${listNums(endNums)}: ${PRON[opp]} vai ter que PASSAR de novo!`);
    } else if (oppLack.length) {
      s += 4;
      why.push(`Deixa na ponta o ${listNums(oppLack)}, que ${SEAT_LONG[opp]} (próximo a jogar) não tem.`);
    }
    const parLack = endNums.filter((n) => G.lacks[partner].has(n));
    if (parLack.length === endNums.length) {
      s -= 4;
      why.push(`Atenção: o parceiro já mostrou que não tem ${listNums(endNums)}. Evite fechar o caminho dele.`);
    }

    for (const n of endNums) {
      const outside = 7 - boardCount(n) - (has(t, n) ? 1 : 0) - rest.filter((x) => has(x, n)).length;
      if (outside === 0 && rest.some((x) => has(x, n))) {
        s += 4;
        why.push(`Contagem: todas as outras pedras de ${nn(n)} já saíram — só você tem esse número. Você controla essa ponta.`);
      }
    }

    // Jogo vai trancar com certeza? (todas as 7 pedras dos números das pontas na mesa)
    const lockSure = endNums.every((n) => boardCount(n) + (has(t, n) ? 1 : 0) === 7);
    if (lockSure) {
      const a = analyze(p);
      let unkP = 0;
      let unkN = 0;
      for (const [k] of a.poss) { const [x, y] = k.split('-').map(Number); unkP += x + y; unkN++; }
      const avg = unkN ? unkP / unkN : 0;
      const mine = rest.reduce((acc, x) => acc + pipsOf(x), 0) + G.hands[partner].length * avg;
      const theirs = (G.hands[opp].length + G.hands[(p + 3) % 4].length) * avg;
      if (mine < theirs) { s += 8; why.push('Essa jogada TRANCA o jogo, e a sua dupla provavelmente tem menos pontos na mão. Boa!'); }
      else { s -= 10; why.push('Essa jogada TRANCA o jogo, e a sua dupla provavelmente tem MAIS pontos na mão — perigoso.'); }
    }

    s += new Set(rest.flatMap((x) => [x.a, x.b])).size * 0.5;
    res.push({ m, s, why });
  }
  return res.sort((x, y) => y.s - x.s);
}

/* ---------------- Rolar as pedras ----------------
   No começo de cada mão as 28 pedras viradas são "roladas" (misturadas) na mesa,
   como na roda, e depois vão 7 para cada jogador. Tocar na mesa pula a animação. */
function rollTiles(done) {
  document.querySelectorAll('.shuffle').forEach((x) => x.remove());
  const g = gen;
  if (!S.anim || $('#game').classList.contains('hidden')) { done(); return; }
  const wrap = $('#boardWrap');
  const ov = document.createElement('div');
  ov.className = 'shuffle';
  wrap.appendChild(ov);
  // as pedras rolam na área da mesa, abaixo da faixa de narração
  const top = $('#narr').offsetTop + $('#narr').offsetHeight + 6;
  const W = wrap.clientWidth;
  const H = Math.max(wrap.clientHeight - top - 30, 150);
  const cx = W / 2;
  const cy = top + H / 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sx = Math.min(W * 0.36, 150);
  const sy = Math.min(H * 0.32, 80);
  $('#table').classList.add('dealing');
  narrate('🎲 <b>Rolando as pedras…</b>');
  narrateStatus('<small>toque na mesa para pular</small>');
  const tiles = [];
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('div');
    el.className = 'tile v back';
    ov.appendChild(el);
    tiles.push(el);
  }
  let finished = false;
  const timers = [];
  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    ov.remove();
    $('#table').classList.remove('dealing');
    narrateStatus('');
    if (g === gen) done();
  };
  ov.onclick = finish;
  // mistura: cada pedra passeia pela mesa girando
  tiles.forEach((el) => {
    const kf = [];
    for (let k = 0; k < 5; k++) kf.push({ transform: `translate(${cx + rnd(-sx, sx)}px, ${cy + rnd(-sy, sy)}px) rotate(${rnd(-180, 180)}deg)` });
    el.animate(kf, { duration: 1500, easing: 'ease-in-out', fill: 'forwards' });
  });
  for (let k = 0; k < 9; k++) timers.push(setTimeout(() => soundClack(0.18 + Math.random() * 0.15), 80 + k * 160));
  // distribui: 7 para cada um
  timers.push(setTimeout(() => {
    if (g !== gen) { finish(); return; }
    narrate('🃏 <b>Distribuindo:</b> 7 pedras para cada um…');
    const wr = wrap.getBoundingClientRect();
    tiles.forEach((el, i) => {
      const p = i % 4;
      const r = $('#seat' + p).getBoundingClientRect();
      const tx = r.left + r.width / 2 - wr.left;
      const ty = r.top + r.height / 2 - wr.top;
      el.animate([{ transform: getComputedStyle(el).transform }, { transform: `translate(${tx}px, ${ty}px) rotate(${p % 2 ? 90 : 0}deg) scale(.7)`, opacity: 0.15 }],
        { duration: 420, delay: i * 30, easing: 'ease-in', fill: 'forwards' });
    });
    timers.push(setTimeout(finish, 28 * 30 + 480));
  }, 1550));
}

/* ---------------- Fluxo da partida ---------------- */
/* Nível dos adversários (o parceiro joga sempre bem, para ajudar você):
   fácil = qualquer pedra que encaixa; médio = metade das vezes a melhor jogada;
   difícil = sempre a melhor jogada. Calibrado em simulação: um iniciante vence
   ~70% das partidas no fácil, ~50% no médio e ~35% no difícil. */
const LEVELS = { facil: { name: 'Fácil', skill: 0 }, medio: { name: 'Médio', skill: 0.5 }, dificil: { name: 'Difícil', skill: 1 } };
function botMove(p, moves) {
  const skill = teamOf(p) === 1 ? (LEVELS[S.level] || LEVELS.facil).skill : 1;
  if (Math.random() >= skill) return moves[Math.floor(Math.random() * moves.length)];
  const ev = evaluate(p).map((e) => ({ ...e, s: e.s + Math.random() * 1.2 })).sort((x, y) => y.s - x.s);
  return ev[0].m;
}

function botDelay() { return S.pace === 'passo' ? 700 : +S.pace || 1300; }

/* ---------------- Quem está "na batida" ----------------
   É quem acaba as pedras primeiro se, daqui pra frente, ninguém passar.
   Cada jogador ainda precisa de (pedras - 1) voltas completas mais a sua posição
   na ordem a partir de quem joga agora; quem precisar de menos jogadas está na batida.
   Quem sai começa na batida; quando ele passa, a batida vai para o próximo. */
function whoIsNaBatida() {
  let best = null;
  for (let p = 0; p < 4; p++) {
    const n = G.hands[p].length;
    if (!n) continue;
    const steps = (n - 1) * 4 + ((p - G.turn + 4) % 4);
    if (!best || steps < best.steps) best = { p, steps };
  }
  return best ? best.p : null;
}

function checkBatida() {
  const b = whoIsNaBatida();
  if (b === G.batida) return;
  const before = G.batida;
  G.batida = b;
  const who = b === 0 ? '<b>Você está na batida</b>' : `${avatarMini(b)} <b>${SEAT[b]}</b> está na batida`;
  let why;
  if (before == null) why = b === 0 ? 'você sai jogando' : `${PRON[b]} sai jogando`;
  else if (G.lastPasser != null) why = `${G.lastPasser === 0 ? 'você passou' : SEAT[G.lastPasser] + ' passou'} e perdeu a vez`;
  else why = 'a vez andou';
  let msg = `🎯 ${who} (${why}): se ninguém passar, ${b === 0 ? 'você é' : 'é'} o primeiro a acabar as pedras.`;
  if (S.professor) {
    if (teamOf(b) === 1) msg += ' Para tirar a batida dele, faça-o <b>passar</b>: deixe nas pontas números que ele não tem.';
    else if (b === 0) msg += ' Segure a batida: evite passar, mantendo números variados na mão.';
    else msg += ' É o seu parceiro: ajude-o deixando nas pontas os números que ele joga.';
  }
  say(msg, 'tip');
}

function nextTurn() {
  if (G.over) return;
  checkBatida();
  G.lastPasser = null;
  render();
  const p = G.turn;
  const moves = legal(p);
  if (p === 0) { narrateStatus('👉 <b>Sua vez!</b>'); humanTurn(moves); return; }
  narrateStatus(`⏳ Vez de ${avatarMini(p)} <b>${SEAT[p]}</b> (${p === 2 ? 'seu parceiro' : ROLE[p]})… pensando`);
  const g = gen;
  setTimeout(() => {
    if (g !== gen || G.over) return;
    if (!moves.length) doPass(p);
    else {
      doPlay(p, botMove(p, moves));
    }
  }, botDelay());
}

function advance() {
  const prev = G.turn;
  G.turn = (G.turn + 1) % 4;
  checkBatida();
  G.lastPasser = null;
  // No modo passo a passo, entre duas jogadas dos outros há 3 segundos para ler o que
  // aconteceu. Dá para pausar ou seguir na hora.
  if (S.pace === 'passo' && prev !== 0 && G.turn !== 0) {
    render();
    countdown(3);
    return;
  }
  nextTurn();
}

function countdown(secs) {
  const g = gen;
  let left = secs;
  let paused = false;
  const draw = () => {
    narrateStatus(paused
      ? `⏸ Pausado. Próximo: <b>${SEAT[G.turn]}</b>. <button id="btnGo" class="primary">▶ Continuar</button>`
      : `Próximo: <b>${SEAT[G.turn]}</b> em <span class="count">${left}</span>s <button id="btnGo" class="primary">Agora ▶</button><button id="btnPause">⏸ Pausar</button>`);
    $('#btnGo').onclick = () => { if (g === gen && !G.over) { clearInterval(timer); nextTurn(); } };
    const bp = $('#btnPause');
    if (bp) bp.onclick = () => { paused = true; draw(); };
  };
  const timer = setInterval(() => {
    if (g !== gen || G.over) { clearInterval(timer); return; }
    if (paused) return;
    left--;
    if (left <= 0) { clearInterval(timer); nextTurn(); return; }
    draw();
  }, 1000);
  draw();
}

/* ---------------- Voltar a sua jogada ----------------
   Antes de cada jogada sua guardamos uma foto da mão. "Voltar minha jogada" desfaz a
   sua jogada e tudo o que os outros jogaram depois dela. */
function takeSnapshot() {
  G.undo = {
    hands: G.hands.map((h) => h.map((t) => ({ ...t }))),
    board: G.board.map((e) => ({ ...e })),
    origin: G.origin,
    lacks: G.lacks.map((x) => new Set(x)),
    knownByMe: new Set(G.knownByMe),
    knownAboutMe: new Set(G.knownAboutMe),
    feed: G.feed.slice(),
    mustSix: G.mustSix,
    lastIdx: G.board.indexOf(G.lastEntry),
    narr: $('#narrAction').innerHTML,
  };
}

function undoMove() {
  const u = G.undo;
  if (!u || G.over) return;
  G.undo = null;
  gen++; // cancela as jogadas dos outros que estavam para acontecer
  Object.assign(G, {
    hands: u.hands, board: u.board, origin: u.origin, lacks: u.lacks,
    knownByMe: u.knownByMe, knownAboutMe: u.knownAboutMe, feed: u.feed, mustSix: u.mustSix,
  });
  G.lastEntry = u.lastIdx >= 0 ? G.board[u.lastIdx] : null;
  G.animEntry = null;
  G.selected = null;
  G.suggest = null;
  G.turn = 0;
  narrate(u.narr);
  say('↩️ Você voltou a sua jogada. Pense com calma e jogue de novo!', 'tip');
  nextTurn();
}

// "ponta do 4" — com a mesa em curva, "esquerda/direita" confunde; o número da ponta não.
function sideName(side, e = ends()) { return `ponta do ${side === 'L' ? e[0] : e[1]}`; }

function narrate(html) { $('#narrAction').innerHTML = html; }
function narrateStatus(html) { $('#narrStatus').innerHTML = html; }

function doPlay(p, m) {
  const t = m.t;
  const prev = ends();
  G.hands[p] = G.hands[p].filter((x) => x !== t);
  let entry;
  if (!G.board.length) G.board.push((entry = { a: t.a, b: t.b, p }));
  else if (m.side === 'L') { G.board.unshift((entry = { a: otherSide(t, prev[0]), b: prev[0], p })); G.origin++; }
  else G.board.push((entry = { a: prev[1], b: otherSide(t, prev[1]), p }));
  G.lastEntry = entry;
  G.animEntry = entry;
  // A pedra sai voando da mão de quem jogou; o "tec" toca quando ela encosta na mesa.
  G.flyFrom = p === 0 ? (G.flyFrom || handPoint(tid(t))) : seatPoint(p);
  if (S.anim && G.flyFrom) setTimeout(() => soundClack(p === 0 ? 1 : 0.8), 380);
  else soundClack(p === 0 ? 1 : 0.8);
  const now = ends();
  const who = p === 0 ? '<b>Você</b> jogou' : `${avatarMini(p)} <b>${SEAT[p]}</b> jogou`;
  narrate(prev
    ? `${who} ${miniTile(tid(t))} na ${sideName(m.side, prev)}. Agora as pontas são <b class="endnum">${now[0]}</b> e <b class="endnum">${now[1]}</b>.`
    : `${who} ${miniTile(tid(t))} para abrir a mesa. As pontas são <b class="endnum">${now[0]}</b> e <b class="endnum">${now[1]}</b>.`);
  G.mustSix = false;
  G.selected = null;
  G.suggest = null;

  if (p !== 0) {
    say(`${SEAT[p]} jogou ${T(t.a, t.b, true)} ${prev ? 'na ' + sideName(m.side, prev) : 'para abrir a mesa'}.`, '', true);
  }

  if (!G.hands[p].length) {
    const bt = batidaType(t, prev);
    endHand({ kind: 'batida', p, bt, t });
    return;
  }
  const [L, R] = ends();
  if (G.hands.every((h) => !h.some((x) => has(x, L) || has(x, R)))) {
    endHand({ kind: 'tranque', p });
    return;
  }
  checkDeductions();
  advance();
}

function doPass(p) {
  const [L, R] = ends();
  const nums = [...new Set([L, R])];
  const fresh = nums.filter((n) => !G.lacks[p].has(n));
  nums.forEach((n) => G.lacks[p].add(n));
  G.lastPasser = p;
  bubble(p, 'PASSOU!');
  soundKnock();
  narrate(`✋ ${p === 0 ? '' : avatarMini(p) + ' '}<b>${p === 0 ? 'Você passou' : SEAT[p] + ' passou'}</b> — ${PRON[p]} não tem nenhuma pedra com ${listNums(nums)}.`);
  if (p === 0) {
    say(`Você passou. ⚠️ Agora todos sabem que você não tem ${listNums(nums)}.`, 'alert');
  } else {
    let msg = `<b>${SEAT[p]} PASSOU</b> com as pontas ${listNumsE(nums)}.`;
    if (fresh.length) msg += ` 📝 Anote: ${SEAT_LONG[p]} <b>não tem nenhuma pedra com ${listNums(fresh)}</b>.`;
    if (teamOf(p) === 1 && S.professor) msg += ' Use isso: tente deixar esses números nas pontas para ele passar de novo!';
    if (p === 2 && S.professor) msg += ' Seu parceiro precisa de outros números — tente abrir o jogo para ele.';
    say(msg, 'pass');
  }
  checkDeductions();
  advance();
}

function checkDeductions() {
  const a0 = analyze(0);
  for (let q = 1; q < 4; q++) {
    const fresh = a0.certain[q].filter((k) => !G.knownByMe.has(k));
    fresh.forEach((k) => G.knownByMe.add(k));
    if (fresh.length && S.professor) {
      say(
        `🔎 <b>Dedução:</b> juntando os passes e a contagem, só pode estar com ${SEAT_LONG[q]}: ${fresh.map((k) => miniTile(k)).join(' ')}`,
        'deduce'
      );
    }
  }
  const known = new Set([...analyze(1).certain[0], ...analyze(3).certain[0]]);
  const fresh = [...known].filter((k) => !G.knownAboutMe.has(k) && G.hands[0].some((t) => tid(t) === k));
  fresh.forEach((k) => G.knownAboutMe.add(k));
  if (fresh.length) {
    say(
      `⚠️ <b>Os adversários já podem ter certeza</b> de que você tem: ${fresh.map((k) => miniTile(k)).join(' ')} — é assim que eles "sabem a sua pedra"!`,
      'alert'
    );
  }
}

function miniTile(k) {
  const [a, b] = k.split('-').map(Number);
  return `<span class="mini">${T(a, b, true)}</span>`;
}

/* ---------------- Jogada humana ---------------- */
function humanTurn(moves) {
  // (a mesa já foi desenhada em nextTurn; desenhar de novo cortaria a pedra que está voando)
  const e = ends();
  let msg;
  if (!e) {
    msg = G.mustSix
      ? (() => { const w = W(); return `Você tem ${w.o} <b>${w.s} de sena (6-6)</b>! Na primeira mão, quem tem ${w.ele} começa. Toque na pedra para jogar.`; })()
      : 'Você ganhou a última mão, então <b>começa com a pedra que quiser</b>. Dica: comece pelo número que você mais tem.';
  } else if (moves.length) {
    const n = new Set(moves.map((m) => m.t)).size;
    msg = `<b>Sua vez!</b> As pontas são <b>${nn(e[0])}</b> e <b>${nn(e[1])}</b>. ` +
      (S.professor ? `Você tem ${n} pedra(s) que encaixam (destacadas em amarelo). <b>Arraste</b> a pedra até a ponta onde quer jogar, ou toque nela.` : 'Arraste uma pedra até a ponta, ou toque nela.');
  } else {
    msg = `Você não tem nenhuma pedra com ${listNums([...new Set(e)])}. Você precisa <b>PASSAR</b>.` +
      `<br>⚠️ Depois disso, todo mundo vai saber que você não tem ${listNums([...new Set(e)])}. Por isso é bom manter variedade de números na mão.`;
  }
  setProfNow(msg);
  $('#btnPass').classList.toggle('hidden', moves.length > 0);
  $('#btnHint').classList.toggle('hidden', moves.length === 0);
}

function onHandClick(id) {
  if (G.over || G.turn !== 0) return;
  const t = G.hands[0].find((x) => tid(x) === id);
  const opts = legal(0).filter((m) => m.t === t);
  if (!opts.length) {
    const el = document.querySelector(`#seat0 .tile[data-id="${id}"]`);
    if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    const e = ends();
    if (!e && G.mustSix) setProfNow(`Na primeira mão, a saída tem que ser com <b>${dn6()}</b>.`);
    else if (e) setProfNow(`Essa não encaixa: as pontas são <b>${e[0]}</b> e <b>${e[1]}</b>, e essa pedra tem ${t.a} e ${t.b}. Procure uma pedra que tenha ${e[0]} ou ${e[1]}.`);
    return;
  }
  if (opts.length === 1) { humanPlay(opts[0]); return; }
  G.selected = t;
  render();
  setProfNow(`Essa pedra serve nas <b>duas pontas</b>! Escolha onde jogar:<br>` +
    `• na <b>${sideName('L')}</b>, as pontas ficam <b>${resultEnds(opts[0]).join(' e ')}</b><br>` +
    `• na <b>${sideName('R')}</b>, as pontas ficam <b>${resultEnds(opts[1]).join(' e ')}</b><br>` +
    'Toque na pedra da ponta, na mesa, ou nos botões abaixo dela.' +
    (S.professor ? '<br>Pense: qual número o próximo adversário não tem? Qual número você ainda tem na mão?' : ''));
}

function humanPlay(m) {
  if (!G.flyFrom) G.flyFrom = handPoint(tid(m.t));
  takeSnapshot();
  const ev = evaluate(0);
  const best = ev[0];
  // mesma pedra deixando as mesmas pontas = mesma jogada (vale também quando as duas pontas têm o mesmo número)
  const sameMove = (x) => x.t === m.t && resultEnds(x).sort().join() === resultEnds(m).sort().join();
  const mine = ev.find((x) => sameMove(x.m)) || best;
  const sameAsBest = sameMove(best.m);
  say(`Você jogou ${T(m.t.a, m.t.b, true)}${G.board.length ? ' na ' + sideName(m.side) : ''}.`, '', true);
  if (S.professor && ev.length > 1) {
    if (sameAsBest) say('👍 Ótima jogada! Era exatamente o que o professor faria.', 'good');
    else if (best.s - mine.s > 5) {
      const where = G.board.length ? ` na ${sideName(best.m.side)}` : '';
      say(`💡 Dava para jogar melhor: ${T(best.m.t.a, best.m.t.b, true)}${where}. Motivo: ${best.why[0] || 'mantém seu jogo mais forte.'}`, 'tip');
    } else say('👌 Boa jogada.', 'good');
  }
  setProfNow('');
  doPlay(0, m);
}

function showHint() {
  if (G.over || G.turn !== 0) return;
  const ev = evaluate(0);
  if (!ev.length) return;
  const best = ev[0];
  G.suggest = best.m;
  render();
  const where = G.board.length && legal(0).filter((m) => m.t === best.m.t).length > 1 ? ` na <b>${sideName(best.m.side)}</b>` : '';
  let html = `💡 <b>Eu jogaria</b> ${T(best.m.t.a, best.m.t.b, true)}${where}.`;
  if (best.why.length) html += '<ul>' + best.why.map((w) => `<li>${w}</li>`).join('') + '</ul>';
  if (ev.length > 1) {
    const others = ev.slice(1).filter((x, i, arr) => arr.findIndex((y) => y.m.t === x.m.t) === i && x.m.t !== best.m.t);
    if (others.length) html += `<div style="margin-top:6px;font-size:.9em">Outras opções (da melhor para a pior): ${others.map((o) => T(o.m.t.a, o.m.t.b, true)).join(' ')}</div>`;
  }
  setProfNow(html);
}

/* ---------------- Mudar o nome de um jogador ---------------- */
function escapeHTML(t) { return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function editName(p) {
  const role = p === 2 ? 'seu parceiro' : ROLE[p];
  const box = document.createElement('div');
  box.id = 'nameEdit';
  box.innerHTML = `<form class="nameEditBox">
      <span class="av-big">${avatarSVG(p)}</span>
      <label>Nome do ${p === 3 ? 'jogador (adversária)' : `jogador (${role})`}:</label>
      <input type="text" maxlength="14" value="${escapeHTML(SEAT[p])}" autocomplete="off">
      <div class="btns"><button type="submit" class="primary big">Salvar</button>
      <button type="button" class="np-reset">Voltar para "${DEFAULT_NAMES[p]}"</button>
      <button type="button" class="np-cancel">Cancelar</button></div></form>`;
  document.body.appendChild(box);
  const input = box.querySelector('input');
  input.focus();
  input.select();
  const close = () => box.remove();
  const save = (name) => {
    S.names = Object.assign({}, S.names, { [p]: name.replace(/[<>&"']/g, '').trim().slice(0, 14) || DEFAULT_NAMES[p] });
    saveSettings();
    close();
    render();
  };
  box.querySelector('form').onsubmit = (e) => { e.preventDefault(); save(input.value); };
  box.querySelector('.np-reset').onclick = () => save(DEFAULT_NAMES[p]);
  box.querySelector('.np-cancel').onclick = close;
  box.onclick = (e) => { if (e.target === box) close(); };
}

/* ---------------- Fim de mão ---------------- */
function endHand(r) {
  if (G.over && G.lastResult === r) { showModal(G.lastModal); bindEndButton(); return; }
  G.over = true;
  G.lastResult = r;
  render();
  const sums = G.hands.map((h) => h.reduce((a, t) => a + pipsOf(t), 0));
  let title;
  let body = '';
  let winTeam = null;
  let pts = 0;
  if (r.kind === 'batida') {
    winTeam = teamOf(r.p);
    pts = r.bt.pts;
    G.nextStarter = r.p;
    title = r.p === 0 ? '🎉 Você BATEU!' : `${SEAT[r.p]} bateu!`;
    body = `<p>${r.p === 0 ? 'Você jogou' : SEAT[r.p] + ' jogou'} a última pedra ${T(r.t.a, r.t.b, true)} — <b>${r.bt.name}</b> (${r.bt.desc}): <b>${pts} ponto(s)</b> para ${winTeam === 0 ? 'a sua dupla' : 'os adversários'}.</p>`;
  } else {
    const us = sums[0] + sums[2];
    const them = sums[1] + sums[3];
    const [L, R] = ends();
    title = '🔒 Jogo trancado!';
    body = `<p>Ninguém tem mais pedra com ${listNums([...new Set([L, R])])}. Quando tranca, soma-se os pontos (bolinhas) que sobraram na mão de cada dupla. <b>Menos pontos ganha.</b></p>` +
      `<p>Sua dupla: <b>${us}</b> pontos · Adversários: <b>${them}</b> pontos.</p>`;
    if (us !== them) {
      winTeam = us < them ? 0 : 1;
      pts = 1;
      const pair = winTeam === 0 ? [0, 2] : [1, 3];
      G.nextStarter = sums[pair[0]] <= sums[pair[1]] ? pair[0] : pair[1];
      body += `<p>${winTeam === 0 ? 'Sua dupla' : 'Os adversários'} ganha(m) <b>1 ponto</b>.</p>`;
    } else {
      G.nextStarter = r.p;
      body += '<p>Empate: ninguém marca ponto.</p>';
    }
    body += '<div class="box">Lição: quando o jogo pode trancar, quem guardou pedras pesadas (como 6-6, 5-6) se dá mal. Por isso se livre delas cedo!</div>';
  }
  if (winTeam != null) G.score[winTeam] += pts;
  renderScore();

  body += '<h3>Pedras que sobraram</h3>';
  for (const p of [0, 1, 2, 3]) {
    body += `<div class="handline"><span class="who" style="color:${teamOf(p) ? '#ef9a9a' : '#90caf9'}">${p ? avatarMini(p) + ' ' : ''}${SEAT[p]}</span><span class="tiles">${G.hands[p].map((t) => T(t.a, t.b)).join('') || '—'}</span><span>${sums[p]} pts</span></div>`;
  }
  body += `<p>Placar: <b style="color:#64b5f6">Nós ${G.score[0]}</b> × <b style="color:#ef5350">${G.score[1]} Eles</b> (vence quem chegar a ${TARGET}).</p>`;

  const gameOver = G.score[0] >= TARGET || G.score[1] >= TARGET;
  if (gameOver) {
    const won = G.score[0] >= TARGET;
    title = won ? '🏆 Vocês venceram a partida!' : '😏 Os adversários venceram a partida';
    body = (won
      ? `<div class="party"><span class="av-big dance">${avatarSVG(2)}</span><span class="party-txt">🎉🥳🎉</span></div><p><b>É festa!</b> Você e ${SEAT[2]} levaram a partida!</p>`
      : `<div class="party lose"><span class="av-big smug">${avatarSVG(1)}</span><span class="av-big smug">${avatarSVG(3)}</span></div><p>${SEAT[1]} e ${SEAT[3]} comemoram… mas a revanche é sua! 😉</p>`) + body;
    const lv = LEVELS[S.level] || LEVELS.facil;
    const up = { facil: 'medio', medio: 'dificil' }[S.level];
    const down = { dificil: 'medio', medio: 'facil' }[S.level];
    body += `<p>Nível dos adversários: <b>${lv.name}</b>.</p>`;
    body += won
      ? (up ? `<p>Parabéns! Que tal subir para o nível <b>${LEVELS[up].name}</b>?</p><button class="big" id="mLevel" data-l="${up}">⬆️ Jogar no ${LEVELS[up].name}</button>`
            : '<p>Parabéns! Você venceu no nível mais difícil. Agora tente com o professor desligado.</p>')
      : (down ? `<p>Não desanime! Se quiser, treine no nível <b>${LEVELS[down].name}</b> e volte depois.</p><button class="big" id="mLevel" data-l="${down}">⬇️ Jogar no ${LEVELS[down].name}</button>`
              : '<p>Não desanime: veja as dicas do professor e tente de novo!</p>');
  }
  G.gameOver = gameOver;
  G.lastModal = `<h2>${title}</h2>${body}<div class="btns"><button class="big primary" id="mNext">${gameOver ? 'Nova partida' : 'Próxima mão ▶'}</button></div>`;
  const show = () => {
    showModal(G.lastModal);
    bindEndButton();
    if (gameOver && G.score[0] >= TARGET) { confetti(true); soundWin(true); }
    else if (gameOver) soundLose();
    else if (winTeam === 0) { confetti(false); soundWin(false); }
  };
  // espera a última pedra pousar na mesa antes de mostrar o resultado
  const g = gen;
  if (S.anim) setTimeout(() => { if (g === gen) show(); }, 700);
  else show();
}

function bindEndButton() {
  $('#mNext').onclick = () => { hideModal(); if (G.gameOver) newGame(); else newHand(); };
  const ml = $('#mLevel');
  if (ml) ml.onclick = () => { S.level = ml.dataset.l; saveSettings(); $('#optLevel').value = S.level; hideModal(); newGame(); };
}

/* ---------------- Interface ---------------- */
function say(html, cls = '', quiet = false) {
  G.feed.unshift({ html, cls });
  if (G.feed.length > 60) G.feed.pop();
  void quiet;
  renderFeed();
}
function setProfNow(html) { $('#profNow').innerHTML = html; }

function bubble(p, text) {
  const el = $('#seat' + p);
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = text;
  el.appendChild(b);
  setTimeout(() => b.remove(), 1700);
}

function renderScore() {
  $('#scoreUs').textContent = G.score[0];
  $('#scoreThem').textContent = G.score[1];
}

function renderFeed() {
  $('#feed').innerHTML = G.feed.map((m) => `<div class="msg ${m.cls}">${m.html}</div>`).join('');
}

function render() {
  if (!G) return;
  document.body.classList.toggle('colors', S.colors);
  renderScore();
  const playable = G.turn === 0 && !G.over ? legal(0) : [];
  const playableIds = new Set(playable.map((m) => tid(m.t)));

  for (const p of [0, 1, 2, 3]) {
    const el = $('#seat' + p);
    el.classList.toggle('turn', G.turn === p && !G.over);
    const nameCls = teamOf(p) === 0 ? 'us' : 'them';
    const label = 'Você';
    let tiles;
    const hidden = p !== 0 && !(S.spy || G.over);
    if (p === 0) {
      tiles = G.hands[0].map((t) => {
        const id = tid(t);
        let cls = '';
        if (G.selected === t) cls = 'selected';
        else if (G.suggest && G.suggest.t === t) cls = 'suggest playable';
        else if (G.turn === 0 && !G.over && S.professor) cls = playableIds.has(id) ? 'playable' : 'dim';
        return tileHTML(t.a, t.b, { cls, data: id });
      }).join('');
    } else {
      tiles = G.hands[p].map((t) => (S.spy || G.over ? T(t.a, t.b) : backHTML())).join('');
    }
    const lacks = [...G.lacks[p]].sort();
    const bubbles = [...el.querySelectorAll('.bubble')];
    const n = G.hands[p].length;
    if (p === 0) {
      el.innerHTML = `<div class="name ${nameCls}">${label} · ${n} ${n === 1 ? 'pedra' : 'pedras'}${G.batida === 0 && !G.over ? ' <span class="batida-tag" title="Se ninguém passar, você é o primeiro a acabar as pedras">🎯 na batida</span>' : ''}</div><div class="tiles">${tiles}</div>`;
    } else {
      // Enxuto: boneco com o número de pedras no cantinho, o nome e o que ele não tem.
      // As pedras só aparecem viradas para cima no modo espiar ou no fim da mão.
      el.title = `${SEAT[p]} — ${p === 2 ? 'seu parceiro' : ROLE[p]} — ${n} ${n === 1 ? 'pedra' : 'pedras'}`;
      el.innerHTML = `<button type="button" class="name editname ${nameCls}" data-p="${p}" title="Toque para mudar o nome">${escapeHTML(SEAT[p])}</button>` +
        `<div class="avatar-wrap"><div class="avatar">${avatarSVG(p)}</div><span class="count" title="${n} pedras na mão"><i></i>${n}</span></div>` +
        (G.batida === p && !G.over ? '<span class="batida-tag" title="Se ninguém passar, é o primeiro a acabar as pedras">🎯 na batida</span>' : '') +
        `<div class="tiles ${hidden ? 'backs' : ''}">${tiles}</div>` +
        (lacks.length ? `<div class="chips"><span class="chip no" title="Não tem nenhuma pedra com ${lacks.join(', ')}">sem ${lacks.join(' ')}</span></div>` : '');
    }
    bubbles.forEach((b) => el.appendChild(b));
  }
  document.querySelectorAll('.seat .editname').forEach((b) => { b.onclick = () => editName(+b.dataset.p); });
  document.querySelectorAll('#seat0 .tile').forEach((el) => {
    el.onclick = () => { if (!dragJustEnded) onHandClick(el.dataset.id); };
    setupDrag(el);
  });

  renderBoard();
  const sc = $('#sideChoice');
  if (G.selected) {
    const selOpts = legal(0).filter((m) => m.t === G.selected);
    sc.innerHTML = selOpts.map((m) => `<button class="big primary" data-side="${m.side}">Jogar na ${sideName(m.side)}</button>`).join('') +
      '<button class="big" data-side="X">Cancelar</button>';
    sc.querySelectorAll('button').forEach((b) => {
      b.onclick = () => {
        if (b.dataset.side === 'X') { G.selected = null; render(); setProfNow(''); humanTurn(legal(0)); return; }
        humanPlay(selOpts.find((m) => m.side === b.dataset.side));
      };
    });
  } else sc.innerHTML = '';

  $('#btnUndo').classList.toggle('hidden', !G.undo || G.over);
  if (G.turn !== 0 || G.over) {
    $('#btnPass').classList.add('hidden');
    $('#btnHint').classList.add('hidden');
  }
  renderCounter();
  renderReading();
  renderFeed();
}

/* ---------------- Arrastar a pedra até a ponta ----------------
   Segurar e arrastar uma pedra da mão: as pontas onde ela encaixa acendem e,
   ao soltar perto de uma delas, a pedra é jogada ali. Um toque simples continua
   funcionando como antes. */
let drag = null;
let dragJustEnded = false;

function setupDrag(el) {
  el.addEventListener('pointerdown', (ev) => {
    if (G.over || G.turn !== 0 || ev.button > 0) return;
    drag = { el, id: el.dataset.id, sx: ev.clientX, sy: ev.clientY, started: false };
    try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ok */ }
  });
  el.addEventListener('pointermove', (ev) => {
    if (!drag || drag.el !== el) return;
    if (!drag.started) {
      if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < 8) return;
      startDrag();
    }
    ev.preventDefault();
    drag.ghost.style.left = ev.clientX + 'px';
    drag.ghost.style.top = ev.clientY + 'px';
    drag.target = findDropTarget(ev.clientX, ev.clientY);
    showDropFeedback();
  });
  el.addEventListener('pointerup', () => { if (drag && drag.el === el) finishDrag(true); });
  el.addEventListener('pointercancel', () => { if (drag && drag.el === el) finishDrag(false); });
}

function startDrag() {
  const t = G.hands[0].find((x) => tid(x) === drag.id);
  drag.started = true;
  drag.t = t;
  drag.opts = legal(0).filter((m) => m.t === t);
  G.selected = null;
  $('#sideChoice').innerHTML = '';
  const ghost = drag.el.cloneNode(true);
  ghost.className = 'tile v ghost';
  ghost.style.setProperty('--u', getComputedStyle(drag.el).getPropertyValue('--u'));
  document.body.appendChild(ghost);
  drag.ghost = ghost;
  drag.el.classList.add('dragging');
  // pontas onde a pedra encaixa (se as duas pontas têm o mesmo número, as duas servem)
  const [L, R] = ends() || [];
  drag.ends = [...document.querySelectorAll('#board .endtile')].map((el) => {
    const sides = el.dataset.end.split(' ');
    let m = drag.opts.find((o) => sides.includes(o.side)) || null;
    // Pontas com o mesmo número: para as regras é a mesma jogada, mas a pedra
    // tem que ficar na ponta onde a pessoa soltou.
    if (!m && L === R && drag.opts.length) m = { ...drag.opts[0], side: sides[0] };
    if (m) el.classList.add('drop');
    return { el, m };
  }).filter((x) => x.m);
  if (!G.board.length && drag.opts.length) $('#board').classList.add('droparea');
}

// Escolhe a ponta para onde a pedra está indo: a ponta válida mais perto do dedo.
// Soltando em qualquer lugar em cima da mesa, vale a ponta mais perto.
function findDropTarget(x, y) {
  if (!drag.opts.length) return null;
  const r = $('#boardWrap').getBoundingClientRect();
  const overTable = x >= r.left - 30 && x <= r.right + 30 && y >= r.top - 30 && y <= r.bottom + 10;
  if (!G.board.length) return overTable ? { m: drag.opts[0] } : null;
  let best = null;
  for (const e of drag.ends) {
    const b = e.el.getBoundingClientRect();
    const d = Math.hypot(x - (b.left + b.width / 2), y - (b.top + b.height / 2));
    if (!best || d < best.d) best = { ...e, d };
  }
  if (!best) return null;
  return overTable || best.d < 110 ? best : { ...best, near: true };
}

// A pedra da ponta cresce conforme a sua pedra chega perto dela.
function showDropFeedback() {
  const t = drag.target;
  for (const e of drag.ends || []) {
    let scale = 1;
    if (t && e.el === t.el) {
      scale = t.near ? 1 + 0.35 * Math.max(0, 1 - t.d / 300) : 1.6;
    }
    e.el.style.transform = scale > 1 ? `scale(${scale.toFixed(2)})` : '';
    e.el.classList.toggle('target', !!t && e.el === t.el && !t.near);
  }
  $('#board').classList.toggle('hover', !!t && !G.board.length);
}

function finishDrag(dropped) {
  const d = drag;
  drag = null;
  if (!d.started) return;
  dragJustEnded = true;
  setTimeout(() => { dragJustEnded = false; }, 50);
  const gr = d.ghost.getBoundingClientRect();
  G.flyFrom = { x: gr.left + gr.width / 2, y: gr.top + gr.height / 2 };
  d.ghost.remove();
  d.el.classList.remove('dragging');
  $('#board').classList.remove('droparea', 'hover');
  document.querySelectorAll('#board .endtile').forEach((el) => { el.classList.remove('drop', 'target'); el.style.transform = ''; });
  if (!dropped || G.over || G.turn !== 0) return;
  if (d.target && !d.target.near) { humanPlay(d.target.m); return; }
  G.flyFrom = null;
  if (!d.opts.length) { onHandClick(d.id); return; }
  setProfNow('Quase! Leve a pedra <b>até a mesa</b>, perto da ponta onde você quer jogar — a pedra da ponta cresce quando você está chegando.');
}

/* ---------------- Desenho da mesa ----------------
   Como numa mesa de verdade: a primeira pedra fica no centro e a fila cresce para os
   dois lados. Quando chega na borda, a fila faz uma curva (desce uma pedra em pé) e
   volta no sentido contrário. O braço da esquerda é o mesmo desenho girado 180°.
   Coordenadas em "u" = metade de uma pedra. */
function layoutArm(list, sx, across, X) {
  let cx = sx;
  let cy = 0;
  let d = 'E';
  let last = across;
  const out = [];
  for (const t of list) {
    const dbl = t.e.a === t.e.b;
    if (d === 'E') {
      if (!dbl && cx + 2 > X) {
        const x0 = cx - 1;
        const y0 = cy + last;
        out.push({ ...t, x: x0, y: y0, w: 1, h: 2, d: 'S' });
        cx = x0; cy = y0 + 1.5; d = 'W'; last = 0.5;
        continue;
      }
      if (dbl) { out.push({ ...t, x: cx, y: cy - 1, w: 1, h: 2, d }); cx += 1; last = 1; }
      else { out.push({ ...t, x: cx, y: cy - 0.5, w: 2, h: 1, d }); cx += 2; last = 0.5; }
    } else {
      if (!dbl && cx - 2 < -X) {
        const x0 = cx;
        const y0 = cy + last;
        out.push({ ...t, x: x0, y: y0, w: 1, h: 2, d: 'S' });
        cx = x0 + 1; cy = y0 + 1.5; d = 'E'; last = 0.5;
        continue;
      }
      if (dbl) { out.push({ ...t, x: cx - 1, y: cy - 1, w: 1, h: 2, d }); cx -= 1; last = 1; }
      else { out.push({ ...t, x: cx - 2, y: cy - 0.5, w: 2, h: 1, d }); cx -= 2; last = 0.5; }
    }
  }
  return { out, end: { x: cx, y: cy, d } };
}

const FLIP = { E: 'W', W: 'E', S: 'N', N: 'S' };
function layoutBoard(X) {
  const B = G.board;
  const o = G.origin;
  const c = B[o];
  const cd = c.a === c.b;
  const center = { e: c, near: c.a, far: c.b, x: cd ? -0.5 : -1, y: cd ? -1 : -0.5, w: cd ? 1 : 2, h: cd ? 2 : 1, d: 'E' };
  const sx = cd ? 0.5 : 1;
  const across = cd ? 1 : 0.5;
  const right = layoutArm(B.slice(o + 1).map((e) => ({ e, near: e.a, far: e.b })), sx, across, X);
  const left = layoutArm(B.slice(0, o).reverse().map((e) => ({ e, near: e.b, far: e.a })), sx, across, X);
  const leftItems = left.out.map((it) => ({ ...it, x: -(it.x + it.w), y: -(it.y + it.h), d: FLIP[it.d] }));
  return {
    items: [...leftItems, center, ...right.out],
    endItemL: leftItems.length ? leftItems[leftItems.length - 1] : center,
    endItemR: right.out.length ? right.out[right.out.length - 1] : center,
  };
}

function boardTileHTML(it, cls) {
  const { near, far, d } = it;
  if (near === far) return tileHTML(near, far, { h: d === 'S' || d === 'N', cls });
  if (d === 'E') return tileHTML(near, far, { h: true, cls });
  if (d === 'W') return tileHTML(far, near, { h: true, cls });
  if (d === 'S') return tileHTML(near, far, { cls });
  return tileHTML(far, near, { cls });
}

function renderBoard() {
  const board = $('#board');
  if (!G.board.length) {
    board.style.height = '';
    board.innerHTML = '<div class="empty-board">A mesa está vazia.<br>Esperando a primeira pedra…</div>';
    return;
  }
  const W = board.clientWidth || 320;
  const u = Math.max(14, Math.min(32, Math.floor(W / 16)));
  const X = Math.max(3, Math.floor(W / 2 / u - 1.1)); // folga para carrão que passa da borda
  const lay = layoutBoard(X);
  const selOpts = G.selected ? legal(0).filter((m) => m.t === G.selected) : [];
  const minY = Math.min(...lay.items.map((i) => i.y));
  const maxY = Math.max(...lay.items.map((i) => i.y + i.h));
  const pad = u * 0.8; // espaço para a pedra da ponta crescer
  const px = (x) => W / 2 + x * u;
  const py = (y) => (y - minY) * u + pad;
  let html = '';
  for (const it of lay.items) {
    let cls = `p${it.e.p} ${teamOf(it.e.p) === 0 ? 'us' : 'them'}`;
    if (it.e === G.lastEntry) cls += ' last';
    if (it.e === G.animEntry && !(S.anim && G.flyFrom)) cls += ' enter';
    const sides = [it === lay.endItemL ? 'L' : '', it === lay.endItemR ? 'R' : ''].filter(Boolean);
    const choose = sides.some((sd) => selOpts.some((m) => m.side === sd));
    const endAttr = sides.length ? ` data-end="${sides.join(' ')}"` : '';
    html += `<div class="bt${sides.length ? ' endtile' : ''}${choose ? ' choose' : ''}"${endAttr} style="left:${px(it.x)}px;top:${py(it.y)}px">${boardTileHTML(it, cls)}</div>`;
  }
  // Voo da pedra recém-jogada. Se a mesa for redesenhada no meio do voo,
  // ele continua de onde estava em vez de ser cortado.
  if (G.animEntry && S.anim && G.flyFrom) {
    G.flight = { entry: G.animEntry, from: G.flyFrom, t0: performance.now(), spin: (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 120) };
  }
  const fl = G.flight;
  const flying = fl && performance.now() - fl.t0 < FLY_MS ? lay.items.findIndex((it) => it.e === fl.entry) : -1;
  if (flying < 0) G.flight = null;
  G.animEntry = null;
  G.flyFrom = null;
  board.style.setProperty('--u', u + 'px');
  board.style.height = (maxY - minY) * u + 2 * pad + 'px';
  board.innerHTML = html;
  if (flying >= 0) flyTile(board.querySelectorAll('.bt')[flying], fl.from, performance.now() - fl.t0, fl.spin);
  board.querySelectorAll('.bt.choose').forEach((el) => {
    el.onclick = () => {
      const m = selOpts.find((o) => el.dataset.end.split(' ').includes(o.side));
      if (m) humanPlay(m);
    };
  });
}

/* ---------------- Pedra voando da mão até a mesa ---------------- */
function centerOf(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
function handPoint(id) { return centerOf(document.querySelector(`#seat0 .tile[data-id="${id}"]`)); }
function seatPoint(p) {
  const tiles = document.querySelector(`#seat${p} .tiles`);
  return centerOf(tiles && tiles.children.length ? tiles : document.querySelector(`#seat${p} .avatar`)) || centerOf($('#seat' + p));
}
const FLY_MS = 420;
function flyTile(el, from, elapsed = 0, spin = 180) {
  if (!el || !from) return;
  const to = centerOf(el);
  if (!to) return;
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  el.style.zIndex = 5;
  const a = el.animate([
    { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(1.15)` },
    { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 30}px) rotate(${spin * 0.3}deg) scale(1.25)`, offset: 0.55 },
    { transform: 'translate(0, 0) rotate(0) scale(1)' },
  ], { duration: FLY_MS, easing: 'cubic-bezier(.3,.7,.4,1)' });
  a.currentTime = elapsed;
  a.onfinish = () => { el.style.zIndex = ''; };
}

/* ---------------- Festa (e o contrário) ---------------- */
function confetti(big) {
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.appendChild(c);
  const dpr = window.devicePixelRatio || 1;
  const W = innerWidth;
  const H = innerHeight;
  c.width = W * dpr;
  c.height = H * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = ['#ffd54f', '#42a5f5', '#66bb6a', '#ef5350', '#ab47bc', '#ffffff', '#ff9800'];
  const n = big ? 240 : 90;
  const parts = [];
  for (let i = 0; i < n; i++) {
    const fromSides = big && i % 2;
    parts.push({
      x: fromSides ? (i % 4 === 1 ? -10 : W + 10) : W / 2 + (Math.random() - 0.5) * 80,
      y: fromSides ? H * (0.3 + Math.random() * 0.4) : H * 0.35,
      vx: fromSides ? (i % 4 === 1 ? 1 : -1) * (4 + Math.random() * 7) : (Math.random() - 0.5) * 14,
      vy: -(6 + Math.random() * 9),
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 6,
      color: colors[i % colors.length],
    });
  }
  const dur = big ? 4500 : 2300;
  const t0 = performance.now();
  const step = (now) => {
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = Math.min(1, (dur - t) / 600);
    for (const q of parts) {
      q.vy += 0.28;
      q.vx *= 0.99;
      q.x += q.vx;
      q.y += q.vy;
      q.r += q.vr;
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.r);
      ctx.fillStyle = q.color;
      ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h * Math.abs(Math.cos(q.r * 2)));
      ctx.restore();
    }
    if (t < dur) requestAnimationFrame(step);
    else c.remove();
  };
  requestAnimationFrame(step);
}

function note(ctx, at, freq, dur, type, gain) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ctx.destination);
  o.start(at);
  o.stop(at + dur + 0.05);
  return o;
}

// musiquinha de vitória (curtinha numa mão, completa na partida)
function soundWin(big) {
  const ctx = audio();
  if (!ctx) return;
  try {
    const t = ctx.currentTime + 0.05;
    const seq = big
      ? [[523, 0, 0.15], [659, 0.15, 0.15], [784, 0.3, 0.15], [1047, 0.45, 0.35], [784, 0.85, 0.15], [1047, 1.0, 0.6]]
      : [[659, 0, 0.12], [784, 0.12, 0.12], [1047, 0.24, 0.3]];
    for (const [f, dt, d] of seq) {
      note(ctx, t + dt, f, d, 'triangle', 0.28);
      note(ctx, t + dt, f * 2, d * 0.7, 'sine', 0.06);
    }
    if (big) for (let k = 0; k < 6; k++) noiseBurst(ctx, t + 1.0 + k * 0.09, 0.05, 1800 + k * 300, 1, 0.12); // palminhas
  } catch (e) { /* sem som, tudo bem */ }
}

// "uó-uó" discreto quando perde a partida
function soundLose() {
  const ctx = audio();
  if (!ctx) return;
  try {
    const t = ctx.currentTime + 0.05;
    [[392, 0], [370, 0.32], [349, 0.64]].forEach(([f, dt]) => note(ctx, t + dt, f, 0.3, 'triangle', 0.12));
    const o = note(ctx, t + 0.96, 330, 0.7, 'triangle', 0.12);
    o.frequency.linearRampToValueAtTime(300, t + 1.6);
  } catch (e) { /* sem som, tudo bem */ }
}

function renderCounter() {
  let html = '';
  for (let n = 0; n <= 6; n++) {
    const tilesN = ALL.filter((t) => has(t, n));
    const onBoard = tilesN.filter((t) => G.board.some((x) => key(x.a, x.b) === tid(t))).length;
    const mine = tilesN.filter((t) => G.hands[0].some((x) => tid(x) === tid(t))).length;
    const unk = 7 - onBoard - mine;
    let dots = '';
    for (let i = 0; i < onBoard; i++) dots += '<span class="dot board"></span>';
    for (let i = 0; i < mine; i++) dots += '<span class="dot mine"></span>';
    for (let i = 0; i < unk; i++) dots += '<span class="dot unk"></span>';
    html += `<div class="crow"><span class="left ${unk === 0 ? 'zero' : ''}">${n} ${NUM[n]}</span><span class="dots">${dots}</span><span>${unk === 0 ? 'nenhuma com os outros' : `${unk} com os outros`}</span></div>`;
  }
  $('#counter').innerHTML = html;
}

function renderReading() {
  const a0 = analyze(0);
  let html = '';
  for (const q of [1, 2, 3]) {
    const lacks = [...G.lacks[q]].sort();
    const cert = a0.certain[q];
    html += `<div class="rp"><span class="who" style="color:${teamOf(q) ? '#ef9a9a' : '#90caf9'}">${avatarMini(q)} ${SEAT[q]} (${q === 2 ? 'parceiro' : 'adv.'})</span> — ${G.hands[q].length} pedra(s)<br>`;
    html += lacks.length ? `Não tem: <b>${lacks.join(', ')}</b>` : '<span style="opacity:.7">Ainda não passou — nada se sabe.</span>';
    if (cert.length) html += `<br>Com certeza tem: ${cert.map(miniTile).join(' ')}`;
    html += '</div>';
  }
  $('#reading').innerHTML = html;

  const known = new Set([...analyze(1).certain[0], ...analyze(3).certain[0]]);
  const lacks0 = [...G.lacks[0]].sort();
  let me = '';
  me += lacks0.length
    ? `Eles sabem que você <b>NÃO tem: ${lacks0.join(', ')}</b> (porque você passou).`
    : 'Você ainda não passou, então eles não sabem quais números faltam para você. 👍';
  if (known.size) me += `<br>E já têm <b>certeza</b> que você tem: ${[...known].map(miniTile).join(' ')}`;
  me += '<div style="font-size:.85em;opacity:.8;margin-top:6px">É assim que um bom jogador "sabe a sua pedra": anota os passes, conta o que já saiu e elimina o resto.</div>';
  $('#aboutMe').innerHTML = me;
}

function showModal(html) { $('#modalBox').innerHTML = html; $('#modal').classList.remove('hidden'); }
function hideModal() { $('#modal').classList.add('hidden'); }

/* =========================================================
   AULAS
   ========================================================= */
const seatMap = () => `
<div class="seatmap">
  <div></div><div class="us"><span class="av-big">${avatarSVG(2)}</span>${SEAT[2]}<br><small>seu parceiro</small></div><div></div>
  <div class="them"><span class="av-big">${avatarSVG(3)}</span>${SEAT[3]}<br><small>adversária (esquerda)</small></div><div class="tbl">mesa</div><div class="them"><span class="av-big">${avatarSVG(1)}</span>${SEAT[1]}<br><small>adversário (direita)</small></div>
  <div></div><div class="us">Você</div><div></div>
</div>`;

const LESSONS = [
  {
    title: 'As pedras',
    html: (w) => `
      <p>O dominó tem <b>28 pedras</b>. Cada pedra tem duas metades, e cada metade tem de <b>0 a 6</b> bolinhas.</p>
      <p>Na roda de dominó, os números têm apelidos:</p>
      <div class="demo felt">${[0, 1, 2, 3, 4, 5, 6].map((n) => `<div class="col">${T(n, n)}<span class="lbl">${n}<br><b>${NUM[n]}</b></span></div>`).join('')}</div>
      <p>As pedras acima, com os dois lados iguais, se chamam <b>${w.p}</b>. São 7 ${w.p}.</p>
      <div class="box">Cada região chama de um jeito: <b>carrão</b>, <b>carroça</b>, <b>bucha</b>… É tudo a mesma coisa! Escolha como o jogo vai chamar (dá para mudar depois em <b>⚙️ Opções</b>):
        <div class="namePicker lessonPicker"></div></div>
      <div class="box gold"><b>Segredo nº 1:</b> cada número aparece em <b>exatamente 7 pedras</b>. Veja o 5 (quina):</div>
      <div class="demo felt">${[0, 1, 2, 3, 4, 5, 6].map((n) => T(Math.min(n, 5), Math.max(n, 5))).join('')}</div>
      <p>Guarde isso! É a base da <b>contagem</b>, a técnica que os bons jogadores usam para "adivinhar" as pedras dos outros.</p>`,
    quiz: (w) => ({
      q: 'Quantas pedras têm o número 3 (terno)?',
      opts: [
        { html: '6', why: `Quase! Não esqueça ${w.o} ${w.s} 3-3.` },
        { html: '7', ok: true, why: 'Isso! 0-3, 1-3, 2-3, 3-3, 3-4, 3-5 e 3-6. Todo número aparece em 7 pedras.' },
        { html: '8', why: `${cap(w.o)} ${w.s} 3-3 conta só uma vez. São 7.` },
      ],
    }),
  },
  {
    title: 'A mesa e as duplas',
    html: (w) => `
      <p>O dominó mais comum no Brasil é jogado por <b>4 pessoas em 2 duplas</b>. O seu <b>parceiro</b> senta na sua frente; os adversários ficam dos lados.</p>
      ${seatMap()}
      <ul>
        <li>Cada jogador recebe <b>7 pedras</b>. Como 4 × 7 = 28, todas as pedras são distribuídas — <b>ninguém compra</b>.</li>
        <li>No jogo, a sua dupla veste <b style="color:#64b5f6">azul</b> e os adversários, <b style="color:#ef5350">vermelho</b>.</li>
        <li>A vez passa sempre na mesma ordem: <b>Você → ${SEAT[1]} (direita) → ${SEAT[2]} (parceiro) → ${SEAT[3]} (esquerda)</b> → Você…</li>
        <li>Quer usar o nome dos seus parceiros de jogo de verdade? No jogo, é só <b>tocar no nome</b> de alguém para mudar.</li>
        <li>Você <b>não vê</b> as pedras do parceiro e não pode falar delas. A conversa entre a dupla é feita <b>pelas jogadas</b>.</li>
        <li>Os pontos são da dupla: se o seu parceiro bate, você também ganha.</li>
      </ul>`,
    quiz: (w) => ({
      q: 'Você acabou de jogar. Quem joga agora?',
      opts: [
        { html: 'O parceiro', why: 'Não: entre você e o parceiro sempre joga um adversário.' },
        { html: `${SEAT[1]}, o adversário da direita`, ok: true, why: `Isso! A ordem é Você → ${SEAT[1]} → ${SEAT[2]} → ${SEAT[3]}.` },
        { html: 'Quem quiser', why: 'Não, a ordem é sempre a mesma.' },
      ],
    }),
  },
  {
    title: 'Como começa',
    html: (w) => `
      <p>Na <b>primeira mão</b> da partida, quem tiver ${w.o} <b>${w.s} de sena</b> começa jogando ${w.ele} no centro da mesa:</p>
      <div class="demo felt">${T(6, 6)}</div>
      <p>Nas mãos seguintes, <b>quem ganhou a mão anterior começa</b>, e pode sair com <b>qualquer pedra</b>.</p>
      <div class="box">💡 Quando puder escolher, saia com o número que você <b>mais tem</b>. Assim você consegue repetir esse número e o parceiro entende qual é o seu jogo.</div>`,
  },
  {
    title: 'Encaixando as pedras',
    html: (w) => `
      <p>A fila de pedras na mesa tem <b>duas pontas</b>. Na sua vez, você joga uma pedra que tenha o <b>mesmo número</b> de uma das pontas, encostando os números iguais.</p>
      <div class="demo felt">${chainHTML(mark(3, 'L'), [T(3, 6, true), T(6, 6), T(6, 1, true)], mark(1, 'R'))}</div>
      <p>Aqui as pontas são <b>3</b> e <b>1</b>. Você pode jogar qualquer pedra com 3 ou com 1. Se jogar a 1-5 na direita, a nova ponta passa a ser 5:</p>
      <div class="demo felt">${chainHTML(mark(3, 'L'), [T(3, 6, true), T(6, 6), T(6, 1, true), T(1, 5, true)], mark(5, 'R'))}</div>
      <p>Repare que ${w.o} <b>${w.s} entra atravessad${w.o}</b> (em pé), mas funciona igual: a ponta continua sendo o número dela.</p>`,
    quiz: (w) => ({
      q: 'As pontas são 3 e 1. Qual destas pedras você pode jogar?',
      opts: [
        { html: T(2, 4, true), why: 'Essa não tem 3 nem 1.' },
        { html: T(1, 5, true), ok: true, why: 'Isso! Ela tem o 1, então encaixa na ponta do 1.' },
        { html: T(6, 6, true), why: `${cap(w.o)} ${w.s} de sena só encaixa onde a ponta é 6.` },
      ],
    }),
  },
  {
    title: 'Passar a vez (tocar)',
    html: (w) => `
      <p>Se você <b>não tem nenhuma pedra</b> com os números das pontas, você <b>passa a vez</b> (também chamado de "tocar" ou "bater na mesa").</p>
      <p>Se você tem uma pedra que serve, <b>é obrigado a jogar</b> — não pode passar de propósito.</p>
      <div class="box red"><b>Segredo nº 2:</b> passar <b>conta um segredo para a mesa inteira</b>. Se as pontas eram 2 e 5 e você passou, todo mundo agora sabe que você <b>não tem nenhuma pedra com 2 nem com 5</b>.</div>
      <p>Os jogadores experientes <b>anotam de cabeça</b> cada passe. Neste jogo, o painel <b>🕵️ Leitura dos jogadores</b> anota isso pra você.</p>`,
    quiz: (w) => ({
      q: 'As pontas eram 2 e 5 e o adversário passou. O que você descobriu?',
      opts: [
        { html: 'Ele não tem só a pedra 2-5', why: 'Mais que isso: ele não tem NENHUMA pedra com 2 e nenhuma com 5.' },
        { html: 'Ele não tem nenhuma pedra com 2 nem com 5', ok: true, why: 'Exato! Se tivesse qualquer uma, seria obrigado a jogar.' },
        { html: 'Nada, ele pode estar escondendo', why: 'Passar tendo pedra que serve é contra a regra. Então o passe é uma informação certa.' },
      ],
    }),
  },
  {
    title: 'Como se ganha',
    html: (w) => `
      <p><b>Bater</b> = jogar a sua última pedra. A dupla de quem bateu ganha pontos, de acordo com a última pedra:</p>
      <table class="pts">
        <tr><th>Batida</th><th>Exemplo</th><th>Pontos</th></tr>
        <tr><td><b>Simples</b> — pedra comum</td><td>pontas 2 e 4, bate com <div class="demo" style="display:inline-flex">${T(4, 1, true)}</div></td><td>1</td></tr>
        <tr><td><b>${w.S}</b> — bate com ${w.um} ${w.s}</td><td>pontas 2 e 4, bate com <div class="demo" style="display:inline-flex">${T(4, 4)}</div></td><td>2</td></tr>
        <tr><td><b>Lá-e-lô</b> — a pedra serve nas duas pontas</td><td>pontas 2 e 4, bate com <div class="demo" style="display:inline-flex">${T(2, 4, true)}</div></td><td>3</td></tr>
        <tr><td><b>Cruzada</b> — ${w.s} que serve nas duas pontas</td><td>pontas 4 e 4, bate com <div class="demo" style="display:inline-flex">${T(4, 4)}</div></td><td>4</td></tr>
      </table>
      <p><b>Jogo trancado:</b> quando ninguém consegue mais jogar, cada dupla soma as bolinhas das pedras que sobraram. <b>Quem tiver menos ganha 1 ponto.</b></p>
      <p>A partida vai até <b>${TARGET} pontos</b>.</p>
      <div class="box">As regras de pontuação mudam um pouco de região para região. Antes de jogar com a turma, pergunte: "aqui vale lá-e-lô? cruzada vale 4?".</div>`,
    quiz: (w) => ({
      q: 'As pontas são 3 e 6 e você bate com a pedra 3-6. Quanto vale?',
      opts: [
        { html: '1 ponto', why: 'A 3-6 serve nas duas pontas, então não é simples.' },
        { html: '3 pontos (lá-e-lô)', ok: true, why: 'Isso! Pedra que encaixa nas duas pontas é lá-e-lô.' },
        { html: '4 pontos', why: `Cruzada (4) é só com ${w.s}.` },
      ],
    }),
  },
  {
    title: 'Estratégia 1: a contagem',
    html: (w) => `
      <p>Lembra que cada número está em 7 pedras? Então dá para <b>contar quantas ainda faltam sair</b>:</p>
      <div class="box gold"><b>Faltam com os outros</b> = 7 − (já na mesa) − (na sua mão)</div>
      <p>Exemplo: na mesa já saíram estas pedras com 4:</p>
      <div class="demo felt">${T(4, 0, true)}${T(4, 4)}${T(4, 6, true)}${T(1, 4, true)}</div>
      <p>E na sua mão você tem: </p>
      <div class="demo felt">${T(2, 4)}${T(3, 4)}</div>
      <p>4 na mesa + 2 na sua mão = 6. Então <b>só falta 1 pedra de 4</b> (a 4-5) e ela está com algum outro jogador. Se a ponta for 4 e esse jogador já tiver passado no 4… só você consegue jogar ali!</p>
      <p>No jogo, o painel <b>🧮 Contador de pedras</b> faz essa conta pra você até você pegar o jeito.</p>`,
    quiz: (w) => ({
      q: 'Já saíram 4 pedras com o 2 e você tem 2 pedras com 2. Quantas pedras de 2 estão com os outros?',
      opts: [
        { html: '0', why: '4 + 2 = 6, ainda falta uma para chegar a 7.' },
        { html: '1', ok: true, why: 'Isso! 7 − 4 − 2 = 1.' },
        { html: '3', why: 'Faça a conta: 7 − 4 (mesa) − 2 (sua mão).' },
      ],
    }),
  },
  {
    title: 'Estratégia 2: como eles "sabem a sua pedra"',
    html: (w) => `
      <p>Não é mágica nem trapaça. Um bom jogador junta <b>três pistas</b>:</p>
      <ol>
        <li><b>Os passes</b> — quem passou não tem aqueles números.</li>
        <li><b>A contagem</b> — quantas pedras de cada número ainda faltam.</li>
        <li><b>A eliminação</b> — se a pedra não pode estar com ninguém mais, está com você.</li>
      </ol>
      <div class="box">Exemplo: faltam sair 3 pedras com o 6: ${T(6, 1, true)} ${T(6, 2, true)} ${T(6, 4, true)}<br>
      O <b>Parceiro</b> já passou numa ponta 6. A <b>Esquerda</b> também. Você é a Direita e não tem nenhuma delas…</div>
      <p>Então essas 3 pedras só podem estar com quem sobrou! Os seus adversários fazem exatamente isso com você.</p>
      <div class="box red"><b>Como se defender:</b>
        <ul>
          <li>Mantenha <b>variedade de números</b> na mão, para passar menos.</li>
          <li>Não repita sempre o mesmo número sem necessidade — você está "anunciando" o seu jogo.</li>
          <li>Fique de olho no painel <b>⚠️ O que os adversários já sabem de você</b>.</li>
        </ul></div>`,
    quiz: (w) => ({
      q: 'Você é o jogador da Direita. Parceiro e Esquerda já passaram no 6. Com quem estão as pedras 6-1, 6-2 e 6-4 que faltam (você não tem nenhuma)?',
      opts: [
        { html: 'Com o Parceiro', why: 'Ele passou no 6, então não tem nenhuma pedra com 6.' },
        { html: 'Com o jogador que ainda não passou no 6', ok: true, why: 'Exato! Por eliminação, só pode ser ele. É assim que "sabem a sua pedra".' },
        { html: 'Não dá para saber', why: 'Dá sim! Elimine quem passou e quem é você.' },
      ],
    }),
  },
  {
    title: 'Estratégia 3: dicas de ouro',
    html: (w) => `
      <ol>
        <li><b>Saia com o número que você mais tem.</b> Você repete esse número e o parceiro aprende o seu jogo.</li>
        <li><b>Livre-se ${w.dos} ${w.p} cedo.</b> ${w.S} só encaixa num número; se esse número acabar, ${w.ele} fica ${w.preso} na sua mão.</li>
        <li><b>Livre-se das pedras pesadas</b> (6-6, 5-6, 5-5…). Se o jogo trancar, quem tem mais pontos na mão perde.</li>
        <li><b>Mantenha variedade.</b> Quanto mais números diferentes na mão, menos você passa.</li>
        <li><b>Faça o adversário passar.</b> Se o próximo adversário já passou no 3, tente deixar 3 nas pontas.</li>
        <li><b>Saiba quem está na batida.</b> Quem sai começa "na batida": se ninguém passar, é o primeiro a acabar as pedras. Cada vez que ele passa, a batida vai para o próximo. Se um adversário está na batida, faça ele passar; se é você ou o parceiro, segure! O jogo mostra a etiqueta 🎯 <b>na batida</b>.</li>
        <li><b>Ajude o parceiro.</b> Repare nos números que ele joga e deixe esses números nas pontas. Não "mate" o número dele.</li>
        <li><b>Conte sempre</b> quantas pedras de cada número já saíram.</li>
        <li><b>Antes de trancar o jogo, some!</b> Só tranque se a sua dupla tiver menos pontos.</li>
      </ol>
      <div class="box">Não precisa decorar: durante o jogo, o botão <b>💡 Dica do professor</b> mostra a jogada que ele faria e <b>explica o porquê</b> usando estas regras.</div>`,
  },
  {
    title: 'Hora de jogar!',
    html: (w) => `
      <p>Você vai jogar com a dupla de baixo/cima (azul) contra os adversários dos lados (vermelho). Na tela de jogo:</p>
      <ul>
        <li><b>🎓 Professor</b> — diz o que fazer na sua vez, comenta as jogadas e as deduções.</li>
        <li><b>💡 Dica do professor</b> — mostra a melhor jogada e o porquê.</li>
        <li><b>🧮 Contador</b> — quantas pedras de cada número ainda estão com os outros.</li>
        <li><b>🕵️ Leitura dos jogadores</b> — o que cada um não tem (pelos passes) e as pedras que dá para deduzir.</li>
        <li><b>⚠️ O que os adversários sabem de você</b> — veja o que você está entregando!</li>
        <li><b>Para jogar</b>, arraste a sua pedra até a ponta onde quer jogar (a pedra da ponta cresce quando você chega perto) ou simplesmente toque nela.</li>
        <li><b>🎯 Nível dos adversários</b> — comece no <b>Fácil</b>; quando estiver ganhando, suba para Médio e Difícil (o Difícil joga como gente experiente).</li>
        <li><b>⚙️ Opções</b> — ligue o <b>modo espiar</b> para ver as pedras de todos e entender as jogadas dos robôs. Quando estiver confiante, <b>desligue o professor</b>.</li>
      </ul>
      <p>Na mesa, cada pedra ganha um tom bem clarinho de quem jogou:</p>
      <div class="demo felt"><div class="col">${tileHTML(2, 5, { h: true, cls: 'us' })}<span class="lbl">azulada:<br>sua dupla</span></div><div class="col">${tileHTML(2, 5, { h: true, cls: 'them' })}<span class="lbl">rosada:<br>adversários</span></div></div>
      <p>A última pedra jogada fica com contorno amarelo.</p>
      <p><b>Bom jogo!</b></p>`,
  },
];

let lessonIdx = 0;

function openLessons(i = 0) {
  lessonIdx = i;
  $('#lessons').classList.remove('hidden');
  $('#game').classList.add('hidden');
  renderLesson();
}
function closeLessons() {
  $('#lessons').classList.add('hidden');
  $('#game').classList.remove('hidden');
}

function renderLesson() {
  const L = LESSONS[lessonIdx];
  S.lessonDone = Math.max(S.lessonDone, lessonIdx - 1);
  saveSettings();
  const prog = LESSONS.map((_, i) => `<span data-i="${i}" class="${i === lessonIdx ? 'cur' : i <= S.lessonDone ? 'done' : ''}" title="Aula ${i + 1}"></span>`).join('');
  const w = W();
  const Q = L.quiz ? L.quiz(w) : null;
  let quiz = '';
  if (Q) {
    quiz = `<div class="quiz"><b>❓ Teste rápido:</b> ${Q.q}<div class="opts">${Q.opts.map((o, i) => `<button data-q="${i}">${o.html}</button>`).join('')}</div><div class="fb"></div></div>`;
  }
  const last = lessonIdx === LESSONS.length - 1;
  $('#lessons').innerHTML = `<div class="lesson">
    <div class="progress">${prog}</div>
    <h2>Aula ${lessonIdx + 1} de ${LESSONS.length}: ${L.title}</h2>
    ${L.html(w)}
    ${quiz}
    <div class="nav">
      <button id="lPrev" ${lessonIdx === 0 ? 'disabled style="opacity:.4"' : ''}>◀ Anterior</button>
      <button id="lSkip">🎮 Ir para o jogo</button>
      <button id="lNext" class="primary big">${last ? '🎮 Começar a jogar' : 'Próxima ▶'}</button>
    </div></div>`;
  const np = $('#lessons .namePicker');
  if (np) renderNamePicker(np);
  $('#lessons').querySelectorAll('.progress span').forEach((s) => { s.onclick = () => { lessonIdx = +s.dataset.i; renderLesson(); }; });
  $('#lessons').querySelectorAll('.quiz button').forEach((b) => {
    b.onclick = () => {
      const o = Q.opts[+b.dataset.q];
      b.classList.add(o.ok ? 'right' : 'wrong');
      $('#lessons .quiz .fb').innerHTML = (o.ok ? '✅ ' : '❌ ') + o.why;
    };
  });
  $('#lPrev').onclick = () => { if (lessonIdx > 0) { lessonIdx--; renderLesson(); window.scrollTo(0, 0); } };
  $('#lSkip').onclick = () => startPlaying();
  $('#lNext').onclick = () => {
    if (last) { S.lessonDone = LESSONS.length - 1; saveSettings(); startPlaying(); return; }
    lessonIdx++;
    renderLesson();
    window.scrollTo(0, 0);
  };
}

function startPlaying() {
  closeLessons();
  if (!G) newGame();
  else render();
  window.scrollTo(0, 0);
}

/* ---------------- Escolha do nome (carrão, carroça, bucha…) ---------------- */
function renderNamePicker(el) {
  const opts = [['carrao', 'Carrão'], ['carroca', 'Carroça'], ['bucha', 'Bucha'], ['aleatorio', '🎲 Aleatório'], ['outro', '✏️ Outro']];
  el.innerHTML = `<span class="np-label">Pedras de lados iguais (6-6, 5-5…) se chamam:</span>
    <span class="seg">${opts.map(([k, l]) => `<button type="button" data-k="${k}" class="${S.doubleName === k ? 'on' : ''}">${l}</button>`).join('')}</span>
    <span class="np-custom ${S.doubleName === 'outro' ? '' : 'hidden'}">
      <select class="np-g"><option value="o">o</option><option value="a">a</option></select>
      <input class="np-in" type="text" maxlength="20" placeholder="digite o nome">
    </span>
    <span class="np-hint">${S.doubleName === 'aleatorio' ? 'O nome muda a cada vez, para você se acostumar com todos.' : `Exemplo: ${dn6()}.`}</span>`;
  el.querySelector('.np-g').value = S.customGender;
  el.querySelector('.np-in').value = S.customName;
  const changed = () => {
    saveSettings();
    document.querySelectorAll('.namePicker').forEach(renderNamePicker);
    render();
    if (!$('#lessons').classList.contains('hidden')) renderLesson();
  };
  el.querySelectorAll('.seg button').forEach((b) => {
    b.onclick = () => { S.doubleName = b.dataset.k; changed(); };
  });
  el.querySelector('.np-g').onchange = (e) => { S.customGender = e.target.value; changed(); };
  el.querySelector('.np-in').onchange = (e) => { S.customName = e.target.value.trim(); changed(); };
}

/* ---------------- Inicialização ---------------- */
function initUI() {
  document.body.classList.toggle('colors', S.colors);
  $('#optProfessor').checked = S.professor;
  $('#optSpy').checked = S.spy;
  $('#optColors').checked = S.colors;
  $('#optSound').checked = S.sound;
  $('#optAnim').checked = S.anim;
  $('#optAnim').onchange = (e) => { S.anim = e.target.checked; saveSettings(); };
  $('#optLevel').value = S.level;
  $('#optLevel').onchange = (e) => { S.level = e.target.value; saveSettings(); };
  $('#optSound').onchange = (e) => { S.sound = e.target.checked; saveSettings(); if (S.sound) soundClack(); };
  $('#optSpeed').value = String(S.pace);
  $('#optProfessor').onchange = (e) => { S.professor = e.target.checked; saveSettings(); render(); };
  $('#optSpy').onchange = (e) => { S.spy = e.target.checked; saveSettings(); render(); };
  $('#optColors').onchange = (e) => { S.colors = e.target.checked; saveSettings(); render(); if (!$('#lessons').classList.contains('hidden')) renderLesson(); };
  $('#optSpeed').onchange = (e) => { S.pace = e.target.value; saveSettings(); };
  window.addEventListener('resize', () => { if (G && !$('#game').classList.contains('hidden')) renderBoard(); });
  renderNamePicker($('#namePicker'));
  $('#btnSettings').onclick = () => $('#settings').classList.toggle('hidden');
  $('#btnLessons').onclick = () => openLessons(Math.min(Math.max(S.lessonDone + 1, 0), LESSONS.length - 1));
  $('#btnNew').onclick = () => {
    const go = () => { hideModal(); closeLessons(); newGame(); };
    if (!G) { go(); return; }
    showModal(`<h2>Nova partida?</h2><p>O placar atual será zerado.</p>
      <div class="btns"><button class="big primary" id="cYes">Sim, começar de novo</button><button class="big" id="cNo">Continuar esta partida</button></div>`);
    $('#cYes').onclick = go;
    $('#cNo').onclick = () => { hideModal(); if (G.over) endHand(G.lastResult); };
  };
  $('#btnHint').onclick = showHint;
  $('#btnPass').onclick = () => { if (G.turn === 0 && !G.over && !legal(0).length) { setProfNow(''); takeSnapshot(); doPass(0); } };
  $('#btnUndo').onclick = undoMove;

  showModal(`<h2>Bem-vindo à Escola de Dominó!</h2>
    <p>Aqui você aprende o <b>dominó brasileiro em duplas</b>, do zero: as regras, como contar as pedras e como os bons jogadores "descobrem" as pedras dos outros.</p>
    <p>Durante o jogo, um <b>professor</b> explica cada jogada e dá dicas.</p>
    <div class="btns">
      <button class="big primary" id="wLearn">📚 Aprender passo a passo</button>
      <button class="big" id="wPlay">🎮 Já sei o básico, quero jogar</button>
    </div>`);
  $('#wLearn').onclick = () => { hideModal(); openLessons(0); };
  $('#wPlay').onclick = () => { hideModal(); startPlaying(); };
}

initUI();

/* ---------------- App instalável (PWA) ----------------
   Quando o jogo está publicado num site (https), ele funciona sem internet e o
   celular oferece "Instalar". Aqui guardamos esse convite para mostrar o botão
   📲 Instalar no topo. Dentro de páginas que não permitem isso, nada acontece. */
(function setupPWA() {
  const ok = 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  if (ok) {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* sem PWA aqui */ }
  }
  let promptEvent = null;
  const btn = $('#btnInstall');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptEvent = e;
    btn.classList.remove('hidden');
  });
  btn.onclick = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    try { await promptEvent.userChoice; } catch (e) { /* ok */ }
    promptEvent = null;
    btn.classList.add('hidden');
  };
  window.addEventListener('appinstalled', () => btn.classList.add('hidden'));
})();
