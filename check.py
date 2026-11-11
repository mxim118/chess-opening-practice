#!/usr/bin/env python3
"""Строгая проверка openings.js шахматной библиотекой: каждый ход должен быть
ЛЕГАЛЬНЫМ (с учётом связок, шахов, рокировки, взятия на проходе), а SAN — точным
(правильные «x», «+», «#» и уточнения вроде Nbd2).
Запуск:  pip install chess   затем   python3 check.py   (нужны также Python и Node.js)
Дополняет check.js: тот ловит ошибки формата и невозможные ходы, этот — легальность и точный SAN.
"""
import json, subprocess, sys, os
try:
    import chess
except ImportError:
    sys.exit("Установите библиотеку: pip install chess")

here = os.path.dirname(os.path.abspath(__file__))
js = "const fs=require('fs');const O=new Function(fs.readFileSync(process.argv[1],'utf8')+';return OPENINGS')();console.log(JSON.stringify(O))"
openings = json.loads(subprocess.check_output(["node", "-e", js, os.path.join(here, "openings.js")]))

errors = lines = 0
for o in openings:
    for g in o["groups"]:
        for k, tail in enumerate(g["l"], 1):
            lines += 1
            full = o["prefix"] + ";" + g["p"] + (";" + tail if tail else "")
            board = chess.Board()
            for i, tok in enumerate(t for t in full.split(";") if t):
                u, san = tok.split("|")[0].split("/")
                where = f'[{o["id"]}] {g["n"]} ветка {k} ход {i // 2 + 1}{"…" if i % 2 else "."}'
                try:
                    move = chess.Move.from_uci(u)
                except ValueError:
                    print("✗", where, "— неверный UCI", u); errors += 1; break
                if move not in board.legal_moves:
                    print("✗", where, f"— ход {u} нелегален в этой позиции"); errors += 1; break
                real = board.san(move)
                if real != san:
                    print("✗", where, f"— SAN «{san}», должно быть «{real}»"); errors += 1
                board.push(move)
print(f"\nНайдено проблем: {errors}" if errors else f"✓ Все ходы легальны, SAN точный (веток: {lines})")
sys.exit(1 if errors else 0)
