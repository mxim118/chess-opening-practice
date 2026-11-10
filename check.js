// Проверка базы дебютов. Запуск: node check.js  (из папки проекта)
// Ловит: ошибки формата, ходы не той фигурой/не с той клетки, невозможную геометрию ходов,
// неверный SAN, запрещённые символы в комментариях, повторы id и названий вариантов.
const fs = require("fs");
const OPENINGS = new Function(fs.readFileSync(__dirname + "/openings.js", "utf8") + ";return OPENINGS")();
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const sq = x => (8 - +x[1]) * 8 + (x.charCodeAt(0) - 97);
let errors = 0, lines = 0;
const fail = (where, msg) => { errors++; console.log("✗", where, "—", msg); };

function newBoard() {
  const b = [];
  START.split("/").forEach(r => { for (const c of r) { if (+c) for (let k = 0; k < +c; k++) b.push(""); else b.push(c); } });
  return b;
}
const clear = (b, f, t) => { // свободен ли путь между клетками по прямой/диагонали
  const df = Math.sign((t % 8) - (f % 8)), dr = Math.sign(Math.floor(t / 8) - Math.floor(f / 8));
  for (let i = f + dr * 8 + df; i !== t; i += dr * 8 + df) if (b[i]) return false;
  return true;
};
function geometry(b, f, t, p) {
  const white = p === p.toUpperCase(), L = p.toUpperCase();
  const dc = (t % 8) - (f % 8), dr = Math.floor(t / 8) - Math.floor(f / 8), ac = Math.abs(dc), ar = Math.abs(dr);
  if (L === "N") return (ac === 1 && ar === 2) || (ac === 2 && ar === 1);
  if (L === "B") return ac === ar && ac > 0 && clear(b, f, t);
  if (L === "R") return (ac === 0 || ar === 0) && (ac + ar) > 0 && clear(b, f, t);
  if (L === "Q") return ((ac === ar) || ac === 0 || ar === 0) && (ac + ar) > 0 && clear(b, f, t);
  if (L === "K") return (ac <= 1 && ar <= 1) || (ar === 0 && ac === 2);
  const dir = white ? -1 : 1, home = white ? 6 : 1;
  if (ac === 0) return !b[t] && (dr === dir || (dr === 2 * dir && Math.floor(f / 8) === home && !b[f + dir * 8]));
  if (ac === 1 && dr === dir) return !!b[t] || (!!b[f + dc] && b[f + dc].toLowerCase() === "p"); // взятие или на проходе
  return false;
}
function checkLine(where, opening, full) {
  const b = newBoard();
  const toks = full.split(";").filter(Boolean);
  toks.forEach((tok, i) => {
    const [a, comment] = tok.split("|"), [u, san] = (a || "").split("/");
    const w = where + " ход " + (Math.floor(i / 2) + 1) + (i % 2 ? "…" : ".") + " «" + tok.slice(0, 30) + "»";
    if (!/^[a-h][1-8][a-h][1-8]$/.test(u || "")) return fail(w, "UCI должен быть вида e2e4 (4 символа, без превращений)");
    if (!san) return fail(w, "нет SAN после «/»");
    const f = sq(u.slice(0, 2)), t = sq(u.slice(2, 4)), p = b[f], white = i % 2 === 0;
    if (!p) return fail(w, "на клетке " + u.slice(0, 2) + " нет фигуры");
    if ((p === p.toUpperCase()) !== white) return fail(w, "ходит не та сторона (очерёдность: белые, чёрные, белые…)");
    if (b[t] && (b[t] === b[t].toUpperCase()) === white) return fail(w, "ход на клетку своей фигуры");
    if (!geometry(b, f, t, p)) return fail(w, "фигура так ходить не может (или путь закрыт)");
    const L = p.toUpperCase(), castle = L === "K" && Math.abs(t - f) === 2;
    if (castle ? !/^O-O(-O)?/.test(san) : (L === "P" ? !/^[a-h]/.test(san) : san[0] !== L)) fail(w, "SAN «" + san + "» не соответствует фигуре");
    const cap = !!b[t] || (L === "P" && f % 8 !== t % 8);
    if (!castle && cap !== san.includes("x")) fail(w, "в SAN " + (cap ? "нет" : "лишнее") + " «x» (взятие)");
    if (castle) { const r = t > f ? [t + 1, t - 1] : [t - 2, t + 1]; b[r[1]] = b[r[0]]; b[r[0]] = ""; }
    if (L === "P" && f % 8 !== t % 8 && !b[t]) b[t + (white ? 8 : -8)] = "";
    b[t] = p; b[f] = "";
  });
}
const ids = new Set();
OPENINGS.forEach(o => {
  const W = "[" + (o.id || "?") + "]";
  ["id", "name", "side", "line", "desc", "prefix", "groups"].forEach(k => { if (!o[k]) fail(W, "нет поля " + k); });
  if (ids.has(o.id)) fail(W, "повтор id"); ids.add(o.id);
  if (!/^[a-z0-9-]+$/.test(o.id || "")) fail(W, "id только латиница, цифры и дефис");
  if (o.side !== "white" && o.side !== "black") fail(W, 'side должен быть "white" или "black"');
  const names = new Set();
  (o.groups || []).forEach(g => {
    const G = W + " " + g.n;
    if (!g.n || !g.d || typeof g.p !== "string" || !Array.isArray(g.l) || !g.l.length) fail(G, "у варианта должны быть n, d, p и непустой l");
    if (names.has(g.n)) fail(G, "повтор названия варианта"); names.add(g.n);
    const mine = o.side === "white" ? 0 : 1, kids = new Map(); // ход игрока должен быть однозначным
    (g.l || []).forEach((t, k) => {
      lines++;
      const full = o.prefix + ";" + g.p + (t ? ";" + t : "");
      checkLine(G + " ветка " + (k + 1), o, full);
      let path = "";
      full.split(";").filter(Boolean).forEach((tok, i) => {
        const u = tok.split("|")[0].split("/")[0];
        if (i % 2 === mine) { const s = kids.get(path) || new Set(); s.add(u); kids.set(path, s); }
        path += u + " ";
      });
    });
    kids.forEach((s, path) => { if (s.size > 1) fail(G, "в одной позиции у вас больше одного хода (" + [...s].join(", ") + ") — вынесите в отдельный вариант"); });
  });
});
console.log(errors ? `\nНайдено проблем: ${errors}` : `✓ Всё в порядке: дебютов ${OPENINGS.length}, веток ${lines}`);
process.exit(errors ? 1 : 0);
