'use strict';

/* =========================================================
   Escola de Dominó — dominó brasileiro em duplas, com professor
   ========================================================= */

const $ = (s) => document.querySelector(s);
const NUM = ['branco', 'ás', 'duque', 'terno', 'quadra', 'quina', 'sena'];
const SEAT = ['Você', 'Direita', 'Parceiro', 'Esquerda'];
const SEAT_LONG = ['você', 'o adversário da Direita', 'seu Parceiro', 'o adversário da Esquerda'];
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
const backHTML = () => '<div class="tile v back"></div>';

/* ---------------- Configurações ---------------- */
function loadSettings() {
  try { return JSON.parse(localStorage.getItem('domino-settings') || '{}'); } catch (e) { return {}; }
}
const S = Object.assign({ professor: true, spy: false, colors: true, speed: 1000, lessonDone: -1 }, loadSettings());
function saveSettings() {
  try { localStorage.setItem('domino-settings', JSON.stringify(S)); } catch (e) { /* sem armazenamento: tudo bem */ }
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
  G.lacks = [0, 1, 2, 3].map(() => new Set());
  G.over = false;
  G.selected = null;
  G.suggest = null;
  G.knownByMe = new Set();
  G.knownAboutMe = new Set();
  G.feed = [];
  G.lastPlayer = null;
  G.mustSix = G.handNo === 1 || G.nextStarter == null;
  const start = G.mustSix ? G.hands.findIndex((h) => h.some((t) => t.a === 6 && t.b === 6)) : G.nextStarter;
  G.turn = start;
  say(
    `🃏 <b>Mão ${G.handNo}</b> — cada um recebeu 7 pedras. ` +
      (G.mustSix
        ? `Quem tem a carroça de sena (6-6) começa: <b>${SEAT[start]}</b>.`
        : `Quem ganhou a mão anterior começa com qualquer pedra: <b>${SEAT[start]}</b>.`),
    'tip'
  );
  nextTurn();
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

function batidaType(t, e) {
  const [L, R] = e;
  if (isDouble(t) && L === R && t.a === L) return { name: 'cruzada', pts: 4, desc: 'uma carroça que servia nas duas pontas' };
  if (isDouble(t)) return { name: 'carroça', pts: 2, desc: 'batida com carroça' };
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
      if (G.mustSix) why.push('Na primeira mão, quem tem a carroça de sena (6-6) é obrigado a começar com ela.');
      else {
        why.push(`Você tem ${best} pedras com o ${nn(bn)}. Começar pelo número que você mais tem deixa você repetir esse número e mostra ao parceiro qual é o seu jogo.`);
        if (isDouble(t)) why.push('Sair com carroça é ótimo: carroça só encaixa num número, então é a pedra mais difícil de soltar depois.');
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
      why.push('Se livra de uma carroça: ela só encaixa em um número, então fica cada vez mais difícil de sair.');
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
      why.push(`${cap(SEAT_LONG[opp])} (que joga logo depois) já passou e não tem ${listNums(endNums)}: ele vai ter que PASSAR de novo!`);
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

/* ---------------- Fluxo da partida ---------------- */
function nextTurn() {
  if (G.over) return;
  render();
  const p = G.turn;
  const moves = legal(p);
  if (p === 0) { humanTurn(moves); return; }
  const g = gen;
  setTimeout(() => {
    if (g !== gen || G.over) return;
    if (!moves.length) doPass(p);
    else {
      const ev = evaluate(p).map((e) => ({ ...e, s: e.s + Math.random() * 1.2 })).sort((x, y) => y.s - x.s);
      doPlay(p, ev[0].m);
    }
  }, S.speed);
}

function advance() {
  G.turn = (G.turn + 1) % 4;
  nextTurn();
}

function sideName(side) { return side === 'L' ? 'ponta esquerda' : 'ponta direita'; }

function doPlay(p, m) {
  const t = m.t;
  const prev = ends();
  G.hands[p] = G.hands[p].filter((x) => x !== t);
  if (!G.board.length) G.board.push({ a: t.a, b: t.b, p });
  else if (m.side === 'L') G.board.unshift({ a: otherSide(t, prev[0]), b: prev[0], p });
  else G.board.push({ a: prev[1], b: otherSide(t, prev[1]), p });
  G.lastPlayer = p;
  G.lastTile = tid(t);
  G.mustSix = false;
  G.selected = null;
  G.suggest = null;

  if (p !== 0) {
    say(`${SEAT[p]} jogou ${T(t.a, t.b, true)} ${prev ? 'na ' + sideName(m.side) : 'para abrir a mesa'}.`, '', true);
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
  bubble(p, 'PASSOU!');
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
  render();
  const e = ends();
  let msg;
  if (!e) {
    msg = G.mustSix
      ? 'Você tem a <b>carroça de sena (6-6)</b>! Na primeira mão, quem tem ela começa. Toque nela para jogar.'
      : 'Você ganhou a última mão, então <b>começa com a pedra que quiser</b>. Dica: comece pelo número que você mais tem.';
  } else if (moves.length) {
    const n = new Set(moves.map((m) => m.t)).size;
    msg = `<b>Sua vez!</b> As pontas são <b>${nn(e[0])}</b> e <b>${nn(e[1])}</b>. ` +
      (S.professor ? `Você tem ${n} pedra(s) que encaixam (destacadas em amarelo). Toque em uma para jogar.` : 'Toque numa pedra para jogar.');
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
    if (!e && G.mustSix) setProfNow('Na primeira mão, a saída tem que ser com a <b>carroça de sena (6-6)</b>.');
    else if (e) setProfNow(`Essa não encaixa: as pontas são <b>${e[0]}</b> e <b>${e[1]}</b>, e essa pedra tem ${t.a} e ${t.b}. Procure uma pedra que tenha ${e[0]} ou ${e[1]}.`);
    return;
  }
  if (opts.length === 1) { humanPlay(opts[0]); return; }
  G.selected = t;
  render();
  const e = ends();
  setProfNow(`Essa pedra serve nas <b>duas pontas</b>! Escolha onde jogar:<br>` +
    `• na esquerda, as pontas ficam <b>${resultEnds(opts[0]).join(' e ')}</b><br>` +
    `• na direita, as pontas ficam <b>${resultEnds(opts[1]).join(' e ')}</b>` +
    (S.professor ? '<br>Pense: qual número o próximo adversário não tem? Qual número você ainda tem na mão?' : ''));
  void e;
}

function humanPlay(m) {
  const ev = evaluate(0);
  const best = ev[0];
  const mine = ev.find((x) => x.m.t === m.t && x.m.side === m.side);
  const sameAsBest = best.m.t === m.t && (best.m.side === m.side || resultEnds(best.m).join() === resultEnds(m).join());
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
    body += `<div class="handline"><span class="who" style="color:${teamOf(p) ? '#ef9a9a' : '#90caf9'}">${SEAT[p]}</span><span class="tiles">${G.hands[p].map((t) => T(t.a, t.b)).join('') || '—'}</span><span>${sums[p]} pts</span></div>`;
  }
  body += `<p>Placar: <b style="color:#64b5f6">Nós ${G.score[0]}</b> × <b style="color:#ef5350">${G.score[1]} Eles</b> (vence quem chegar a ${TARGET}).</p>`;

  const gameOver = G.score[0] >= TARGET || G.score[1] >= TARGET;
  if (gameOver) {
    const won = G.score[0] >= TARGET;
    title = won ? '🏆 Vocês venceram a partida!' : '😤 Os adversários venceram a partida';
    body = body + (won ? '<p>Parabéns! Agora tente jogar com o professor desligado.</p>' : '<p>Não desanime: veja as dicas do professor e tente de novo!</p>');
  }
  G.gameOver = gameOver;
  G.lastModal = `<h2>${title}</h2>${body}<div class="btns"><button class="big primary" id="mNext">${gameOver ? 'Nova partida' : 'Próxima mão ▶'}</button></div>`;
  showModal(G.lastModal);
  bindEndButton();
}

function bindEndButton() {
  $('#mNext').onclick = () => { hideModal(); if (G.gameOver) newGame(); else newHand(); };
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
    const label = p === 0 ? 'Você' : p === 2 ? '🤝 Parceiro' : `${SEAT[p]}<br><small>adversário</small>`;
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
    const chips = p === 0 ? '' : `<div class="chips">${lacks.map((n) => `<span class="chip no">sem ${n}</span>`).join('')}</div>`;
    const bubbles = [...el.querySelectorAll('.bubble')];
    el.innerHTML = `<div class="name ${nameCls}">${label} · ${G.hands[p].length} ${G.hands[p].length === 1 ? "pedra" : "pedras"}</div><div class="tiles ${hidden ? 'backs' : ''}">${tiles}</div>${chips}`;
    bubbles.forEach((b) => el.appendChild(b));
  }
  document.querySelectorAll('#seat0 .tile').forEach((el) => { el.onclick = () => onHandClick(el.dataset.id); });

  // Mesa
  const board = $('#board');
  if (!G.board.length) {
    board.innerHTML = '<div class="empty-board">A mesa está vazia.<br>Esperando a primeira pedra…</div>';
  } else {
    const [L, R] = ends();
    const selOpts = G.selected ? legal(0).filter((m) => m.t === G.selected) : [];
    const canL = selOpts.some((m) => m.side === 'L');
    const canR = selOpts.some((m) => m.side === 'R');
    let html = `<div class="endmark ${canL ? 'choose' : ''}" data-side="L">◀ <b>${L}</b></div>`;
    G.board.forEach((x, i) => {
      const last = key(x.a, x.b) === G.lastTile && G.lastPlayer === x.p ? 'last' : '';
      html += tileHTML(x.a, x.b, { h: x.a !== x.b, cls: `p${x.p} ${last}` });
      void i;
    });
    html += `<div class="endmark ${canR ? 'choose' : ''}" data-side="R"><b>${R}</b> ▶</div>`;
    board.innerHTML = html;
    board.querySelectorAll('.endmark.choose').forEach((el) => {
      el.onclick = () => humanPlay(selOpts.find((m) => m.side === el.dataset.side));
    });
  }
  const sc = $('#sideChoice');
  if (G.selected) {
    const selOpts = legal(0).filter((m) => m.t === G.selected);
    sc.innerHTML = selOpts.map((m) => `<button class="big primary" data-side="${m.side}">${m.side === 'L' ? '◀ Jogar na esquerda' : 'Jogar na direita ▶'}</button>`).join('') +
      '<button class="big" data-side="X">Cancelar</button>';
    sc.querySelectorAll('button').forEach((b) => {
      b.onclick = () => {
        if (b.dataset.side === 'X') { G.selected = null; render(); setProfNow(''); humanTurn(legal(0)); return; }
        humanPlay(selOpts.find((m) => m.side === b.dataset.side));
      };
    });
  } else sc.innerHTML = '';

  if (G.turn !== 0 || G.over) {
    $('#btnPass').classList.add('hidden');
    $('#btnHint').classList.add('hidden');
  }
  renderCounter();
  renderReading();
  renderFeed();
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
    html += `<div class="rp"><span class="who" style="color:${teamOf(q) ? '#ef9a9a' : '#90caf9'}">${q === 2 ? 'Parceiro' : SEAT[q] + ' (adv.)'}</span> — ${G.hands[q].length} pedra(s)<br>`;
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
const seatMap = `
<div class="seatmap">
  <div></div><div class="us">🤝 Parceiro</div><div></div>
  <div class="them">Esquerda<br><small>adversário</small></div><div class="tbl">mesa</div><div class="them">Direita<br><small>adversário</small></div>
  <div></div><div class="us">Você</div><div></div>
</div>`;

const LESSONS = [
  {
    title: 'As pedras',
    html: () => `
      <p>O dominó tem <b>28 pedras</b>. Cada pedra tem duas metades, e cada metade tem de <b>0 a 6</b> bolinhas.</p>
      <p>Na roda de dominó, os números têm apelidos:</p>
      <div class="demo felt">${[0, 1, 2, 3, 4, 5, 6].map((n) => `<div class="col">${T(n, n)}<span class="lbl">${n}<br><b>${NUM[n]}</b></span></div>`).join('')}</div>
      <p>As pedras acima, com os dois lados iguais, se chamam <b>carroças</b> (ou buchas). São 7 carroças.</p>
      <div class="box gold"><b>Segredo nº 1:</b> cada número aparece em <b>exatamente 7 pedras</b>. Veja o 5 (quina):</div>
      <div class="demo felt">${[0, 1, 2, 3, 4, 5, 6].map((n) => T(Math.min(n, 5), Math.max(n, 5))).join('')}</div>
      <p>Guarde isso! É a base da <b>contagem</b>, a técnica que os bons jogadores usam para "adivinhar" as pedras dos outros.</p>`,
    quiz: {
      q: 'Quantas pedras têm o número 3 (terno)?',
      opts: [
        { html: '6', why: 'Quase! Não esqueça a carroça 3-3.' },
        { html: '7', ok: true, why: 'Isso! 0-3, 1-3, 2-3, 3-3, 3-4, 3-5 e 3-6. Todo número aparece em 7 pedras.' },
        { html: '8', why: 'A carroça 3-3 conta só uma vez. São 7.' },
      ],
    },
  },
  {
    title: 'A mesa e as duplas',
    html: () => `
      <p>O dominó mais comum no Brasil é jogado por <b>4 pessoas em 2 duplas</b>. O seu <b>parceiro</b> senta na sua frente; os adversários ficam dos lados.</p>
      ${seatMap}
      <ul>
        <li>Cada jogador recebe <b>7 pedras</b>. Como 4 × 7 = 28, todas as pedras são distribuídas — <b>ninguém compra</b>.</li>
        <li>A vez passa sempre na mesma ordem: <b>Você → Direita → Parceiro → Esquerda</b> → Você…</li>
        <li>Você <b>não vê</b> as pedras do parceiro e não pode falar delas. A conversa entre a dupla é feita <b>pelas jogadas</b>.</li>
        <li>Os pontos são da dupla: se o seu parceiro bate, você também ganha.</li>
      </ul>`,
    quiz: {
      q: 'Você acabou de jogar. Quem joga agora?',
      opts: [
        { html: 'O parceiro', why: 'Não: entre você e o parceiro sempre joga um adversário.' },
        { html: 'O adversário da Direita', ok: true, why: 'Isso! A ordem é Você → Direita → Parceiro → Esquerda.' },
        { html: 'Quem quiser', why: 'Não, a ordem é sempre a mesma.' },
      ],
    },
  },
  {
    title: 'Como começa',
    html: () => `
      <p>Na <b>primeira mão</b> da partida, quem tiver a <b>carroça de sena</b> começa jogando ela no centro da mesa:</p>
      <div class="demo felt">${T(6, 6)}</div>
      <p>Nas mãos seguintes, <b>quem ganhou a mão anterior começa</b>, e pode sair com <b>qualquer pedra</b>.</p>
      <div class="box">💡 Quando puder escolher, saia com o número que você <b>mais tem</b>. Assim você consegue repetir esse número e o parceiro entende qual é o seu jogo.</div>`,
  },
  {
    title: 'Encaixando as pedras',
    html: () => `
      <p>A fila de pedras na mesa tem <b>duas pontas</b>. Na sua vez, você joga uma pedra que tenha o <b>mesmo número</b> de uma das pontas, encostando os números iguais.</p>
      <div class="demo felt"><span class="endmark">◀ <b>3</b></span>${T(3, 6, true)}${T(6, 6)}${T(6, 1, true)}<span class="endmark"><b>1</b> ▶</span></div>
      <p>Aqui as pontas são <b>3</b> e <b>1</b>. Você pode jogar qualquer pedra com 3 ou com 1. Se jogar a 1-5 na direita, a nova ponta passa a ser 5:</p>
      <div class="demo felt"><span class="endmark">◀ <b>3</b></span>${T(3, 6, true)}${T(6, 6)}${T(6, 1, true)}${T(1, 5, true)}<span class="endmark"><b>5</b> ▶</span></div>
      <p>Repare que a <b>carroça entra atravessada</b> (em pé), mas funciona igual: a ponta continua sendo o número dela.</p>`,
    quiz: {
      q: 'As pontas são 3 e 1. Qual destas pedras você pode jogar?',
      opts: [
        { html: T(2, 4, true), why: 'Essa não tem 3 nem 1.' },
        { html: T(1, 5, true), ok: true, why: 'Isso! Ela tem o 1, então encaixa na ponta do 1.' },
        { html: T(6, 6, true), why: 'A carroça de sena só encaixa onde a ponta é 6.' },
      ],
    },
  },
  {
    title: 'Passar a vez (tocar)',
    html: () => `
      <p>Se você <b>não tem nenhuma pedra</b> com os números das pontas, você <b>passa a vez</b> (também chamado de "tocar" ou "bater na mesa").</p>
      <p>Se você tem uma pedra que serve, <b>é obrigado a jogar</b> — não pode passar de propósito.</p>
      <div class="box red"><b>Segredo nº 2:</b> passar <b>conta um segredo para a mesa inteira</b>. Se as pontas eram 2 e 5 e você passou, todo mundo agora sabe que você <b>não tem nenhuma pedra com 2 nem com 5</b>.</div>
      <p>Os jogadores experientes <b>anotam de cabeça</b> cada passe. Neste jogo, o painel <b>🕵️ Leitura dos jogadores</b> anota isso pra você.</p>`,
    quiz: {
      q: 'As pontas eram 2 e 5 e o adversário passou. O que você descobriu?',
      opts: [
        { html: 'Ele não tem só a pedra 2-5', why: 'Mais que isso: ele não tem NENHUMA pedra com 2 e nenhuma com 5.' },
        { html: 'Ele não tem nenhuma pedra com 2 nem com 5', ok: true, why: 'Exato! Se tivesse qualquer uma, seria obrigado a jogar.' },
        { html: 'Nada, ele pode estar escondendo', why: 'Passar tendo pedra que serve é contra a regra. Então o passe é uma informação certa.' },
      ],
    },
  },
  {
    title: 'Como se ganha',
    html: () => `
      <p><b>Bater</b> = jogar a sua última pedra. A dupla de quem bateu ganha pontos, de acordo com a última pedra:</p>
      <table class="pts">
        <tr><th>Batida</th><th>Exemplo</th><th>Pontos</th></tr>
        <tr><td><b>Simples</b> — pedra comum</td><td>pontas 2 e 4, bate com <div class="demo" style="display:inline-flex">${T(4, 1, true)}</div></td><td>1</td></tr>
        <tr><td><b>Carroça</b> — bate com uma carroça</td><td>pontas 2 e 4, bate com <div class="demo" style="display:inline-flex">${T(4, 4)}</div></td><td>2</td></tr>
        <tr><td><b>Lá-e-lô</b> — a pedra serve nas duas pontas</td><td>pontas 2 e 4, bate com <div class="demo" style="display:inline-flex">${T(2, 4, true)}</div></td><td>3</td></tr>
        <tr><td><b>Cruzada</b> — carroça que serve nas duas pontas</td><td>pontas 4 e 4, bate com <div class="demo" style="display:inline-flex">${T(4, 4)}</div></td><td>4</td></tr>
      </table>
      <p><b>Jogo trancado:</b> quando ninguém consegue mais jogar, cada dupla soma as bolinhas das pedras que sobraram. <b>Quem tiver menos ganha 1 ponto.</b></p>
      <p>A partida vai até <b>${TARGET} pontos</b>.</p>
      <div class="box">As regras de pontuação mudam um pouco de região para região. Antes de jogar com a turma, pergunte: "aqui vale lá-e-lô? cruzada vale 4?".</div>`,
    quiz: {
      q: 'As pontas são 3 e 6 e você bate com a pedra 3-6. Quanto vale?',
      opts: [
        { html: '1 ponto', why: 'A 3-6 serve nas duas pontas, então não é simples.' },
        { html: '3 pontos (lá-e-lô)', ok: true, why: 'Isso! Pedra que encaixa nas duas pontas é lá-e-lô.' },
        { html: '4 pontos', why: 'Cruzada (4) é só com carroça.' },
      ],
    },
  },
  {
    title: 'Estratégia 1: a contagem',
    html: () => `
      <p>Lembra que cada número está em 7 pedras? Então dá para <b>contar quantas ainda faltam sair</b>:</p>
      <div class="box gold"><b>Faltam com os outros</b> = 7 − (já na mesa) − (na sua mão)</div>
      <p>Exemplo: na mesa já saíram estas pedras com 4:</p>
      <div class="demo felt">${T(4, 0, true)}${T(4, 4)}${T(4, 6, true)}${T(1, 4, true)}</div>
      <p>E na sua mão você tem: </p>
      <div class="demo felt">${T(2, 4)}${T(3, 4)}</div>
      <p>4 na mesa + 2 na sua mão = 6. Então <b>só falta 1 pedra de 4</b> (a 4-5) e ela está com algum outro jogador. Se a ponta for 4 e esse jogador já tiver passado no 4… só você consegue jogar ali!</p>
      <p>No jogo, o painel <b>🧮 Contador de pedras</b> faz essa conta pra você até você pegar o jeito.</p>`,
    quiz: {
      q: 'Já saíram 4 pedras com o 2 e você tem 2 pedras com 2. Quantas pedras de 2 estão com os outros?',
      opts: [
        { html: '0', why: '4 + 2 = 6, ainda falta uma para chegar a 7.' },
        { html: '1', ok: true, why: 'Isso! 7 − 4 − 2 = 1.' },
        { html: '3', why: 'Faça a conta: 7 − 4 (mesa) − 2 (sua mão).' },
      ],
    },
  },
  {
    title: 'Estratégia 2: como eles "sabem a sua pedra"',
    html: () => `
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
    quiz: {
      q: 'Você é o jogador da Direita. Parceiro e Esquerda já passaram no 6. Com quem estão as pedras 6-1, 6-2 e 6-4 que faltam (você não tem nenhuma)?',
      opts: [
        { html: 'Com o Parceiro', why: 'Ele passou no 6, então não tem nenhuma pedra com 6.' },
        { html: 'Com o jogador que ainda não passou no 6', ok: true, why: 'Exato! Por eliminação, só pode ser ele. É assim que "sabem a sua pedra".' },
        { html: 'Não dá para saber', why: 'Dá sim! Elimine quem passou e quem é você.' },
      ],
    },
  },
  {
    title: 'Estratégia 3: dicas de ouro',
    html: () => `
      <ol>
        <li><b>Saia com o número que você mais tem.</b> Você repete esse número e o parceiro aprende o seu jogo.</li>
        <li><b>Livre-se das carroças cedo.</b> Carroça só encaixa num número; se esse número acabar, ela fica presa na sua mão.</li>
        <li><b>Livre-se das pedras pesadas</b> (6-6, 5-6, 5-5…). Se o jogo trancar, quem tem mais pontos na mão perde.</li>
        <li><b>Mantenha variedade.</b> Quanto mais números diferentes na mão, menos você passa.</li>
        <li><b>Faça o adversário passar.</b> Se o próximo adversário já passou no 3, tente deixar 3 nas pontas.</li>
        <li><b>Ajude o parceiro.</b> Repare nos números que ele joga e deixe esses números nas pontas. Não "mate" o número dele.</li>
        <li><b>Conte sempre</b> quantas pedras de cada número já saíram.</li>
        <li><b>Antes de trancar o jogo, some!</b> Só tranque se a sua dupla tiver menos pontos.</li>
      </ol>
      <div class="box">Não precisa decorar: durante o jogo, o botão <b>💡 Dica do professor</b> mostra a jogada que ele faria e <b>explica o porquê</b> usando estas regras.</div>`,
  },
  {
    title: 'Hora de jogar!',
    html: () => `
      <p>Você vai jogar com a dupla de baixo/cima (azul) contra os adversários dos lados (vermelho). Na tela de jogo:</p>
      <ul>
        <li><b>🎓 Professor</b> — diz o que fazer na sua vez, comenta as jogadas e as deduções.</li>
        <li><b>💡 Dica do professor</b> — mostra a melhor jogada e o porquê.</li>
        <li><b>🧮 Contador</b> — quantas pedras de cada número ainda estão com os outros.</li>
        <li><b>🕵️ Leitura dos jogadores</b> — o que cada um não tem (pelos passes) e as pedras que dá para deduzir.</li>
        <li><b>⚠️ O que os adversários sabem de você</b> — veja o que você está entregando!</li>
        <li><b>⚙️ Opções</b> — ligue o <b>modo espiar</b> para ver as pedras de todos e entender as jogadas dos robôs. Quando estiver confiante, <b>desligue o professor</b>.</li>
      </ul>
      <p>Na mesa, a pedra com borda <span style="color:#42a5f5">azul</span> foi jogada pela sua dupla; <span style="color:#ef5350">vermelha</span>, pelos adversários. A última jogada fica com contorno amarelo.</p>
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
  let quiz = '';
  if (L.quiz) {
    quiz = `<div class="quiz"><b>❓ Teste rápido:</b> ${L.quiz.q}<div class="opts">${L.quiz.opts.map((o, i) => `<button data-q="${i}">${o.html}</button>`).join('')}</div><div class="fb"></div></div>`;
  }
  const last = lessonIdx === LESSONS.length - 1;
  $('#lessons').innerHTML = `<div class="lesson">
    <div class="progress">${prog}</div>
    <h2>Aula ${lessonIdx + 1} de ${LESSONS.length}: ${L.title}</h2>
    ${L.html()}
    ${quiz}
    <div class="nav">
      <button id="lPrev" ${lessonIdx === 0 ? 'disabled style="opacity:.4"' : ''}>◀ Anterior</button>
      <button id="lSkip">🎮 Ir para o jogo</button>
      <button id="lNext" class="primary big">${last ? '🎮 Começar a jogar' : 'Próxima ▶'}</button>
    </div></div>`;
  $('#lessons').querySelectorAll('.progress span').forEach((s) => { s.onclick = () => { lessonIdx = +s.dataset.i; renderLesson(); }; });
  $('#lessons').querySelectorAll('.quiz button').forEach((b) => {
    b.onclick = () => {
      const o = L.quiz.opts[+b.dataset.q];
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

/* ---------------- Inicialização ---------------- */
function initUI() {
  document.body.classList.toggle('colors', S.colors);
  $('#optProfessor').checked = S.professor;
  $('#optSpy').checked = S.spy;
  $('#optColors').checked = S.colors;
  $('#optSpeed').value = String(S.speed);
  $('#optProfessor').onchange = (e) => { S.professor = e.target.checked; saveSettings(); render(); };
  $('#optSpy').onchange = (e) => { S.spy = e.target.checked; saveSettings(); render(); };
  $('#optColors').onchange = (e) => { S.colors = e.target.checked; saveSettings(); render(); if (!$('#lessons').classList.contains('hidden')) renderLesson(); };
  $('#optSpeed').onchange = (e) => { S.speed = +e.target.value; saveSettings(); };
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
  $('#btnPass').onclick = () => { if (G.turn === 0 && !G.over && !legal(0).length) { setProfNow(''); doPass(0); } };

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
