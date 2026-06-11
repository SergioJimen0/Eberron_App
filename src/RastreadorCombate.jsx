import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Heart, Shield, Plus, Minus, ChevronRight,
  Eye, EyeOff, Skull, Swords, X, UserPlus, RotateCcw, Sparkles,
  Search, Crown, Footprints, LogIn, Dices, Info, Lock, Check,
  Play, Pause, Timer, GripVertical, Map as MapIcon
} from "lucide-react";

import MapaCombate from "./MapaCombate.jsx";

// Rastreador de Combate — Eberron · v4 optimizada
// Estado del mapa elevado (sin pérdida al cambiar de vista) ·
// estética arcana · animaciones GPU · permisos DM/jugador

const CONDICIONES = [
  "Cegado", "Hechizado", "Ensordecido", "Asustado", "Agarrado",
  "Incapacitado", "Invisible", "Paralizado", "Petrificado",
  "Envenenado", "Derribado", "Restringido", "Aturdido", "Inconsciente",
];

const MI_PJ = "vol";
const initials = (n) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const PARTY = [
  { id: "vol",  nombre: "Vol",          tipo: "pc", subt: "Forjado · Herrero de Batalla",    dex: 1, ac: 18, hp: 22, maxHp: 26, tempHp: 4 },
  { id: "sehra", nombre: "Sehra",        tipo: "pc", subt: "Cambiante · Pícaro",              dex: 4, ac: 15, hp: 18, maxHp: 18, tempHp: 0 },
  { id: "tobi",  nombre: "Tobias Vance", tipo: "pc", subt: "Humano · Mago de Sharn",          dex: 2, ac: 12, hp: 14, maxHp: 14, tempHp: 0 },
  { id: "pell",  nombre: "Pell",         tipo: "pc", subt: "Mediano de Talenta · Explorador", dex: 3, ac: 14, hp: 20, maxHp: 20, tempHp: 0 },
].map(p => ({ ...p, cond: [], conc: false, oculto: false, revelado: true, unido: false, init: 0, salv: { ok: 0, fail: 0 } }));

const CATALOGO = {
  "Eberron": {
    "Aberración": [
      { nombre: "Belashyrra",        subt: "Daelkyr · Señor de los Ojos", dex: 5, ac: 19, hp: 304 },
      { nombre: "Dyrrn",             subt: "Daelkyr · El Corruptor",      dex: 5, ac: 21, hp: 325 },
      { nombre: "Dolgaunt",          subt: "Aberración mediana",          dex: 4, ac: 16, hp: 33 },
      { nombre: "Dolgrim",           subt: "Aberración pequeña",          dex: 2, ac: 15, hp: 13 },
      { nombre: "Quori hashalaq",    subt: "Aberración psiónica",         dex: 2, ac: 17, hp: 99 },
      { nombre: "Quori kalaraq",     subt: "Aberración psiónica",         dex: 5, ac: 18, hp: 161 },
      { nombre: "Quori tsucora",     subt: "Aberración psiónica",         dex: 2, ac: 16, hp: 68 },
    ],
    "Bestia": [
      { nombre: "Garrudo",           subt: "Bestia",                      dex: 3, ac: 13, hp: 19 },
      { nombre: "Fastieth",          subt: "Saurio de monta · Talenta",   dex: 4, ac: 14, hp: 9 },
    ],
    "Celestial": [
      { nombre: "Ídolo radiante",    subt: "Celestial",                   dex: 4, ac: 18, hp: 142 },
    ],
    "Constructo": [
      { nombre: "Mensajero expeditivo",       subt: "Constructo volador",   dex: 2, ac: 13, hp: 7 },
      { nombre: "Defensor férreo",            subt: "Constructo guardián",  dex: 2, ac: 17, hp: 30 },
      { nombre: "Manos ardientes viviente",   subt: "Conjuro viviente",     dex: 1, ac: 15, hp: 15 },
      { nombre: "Nube aniquiladora viviente", subt: "Conjuro viviente",     dex: 2, ac: 15, hp: 15 },
      { nombre: "Relámpago viviente",         subt: "Conjuro viviente",     dex: 2, ac: 15, hp: 57 },
      { nombre: "Coloso forjado",             subt: "Constructo gigantesco", dex: 0, ac: 23, hp: 410 },
      { nombre: "Titán forjado",              subt: "Constructo enorme",    dex: -1, ac: 20, hp: 125 },
    ],
    "Feérico": [
      { nombre: "Saga del ocaso",    subt: "Feérico",                     dex: 2, ac: 17, hp: 82 },
      { nombre: "Halcón Valenar",    subt: "Feérico · Valenar",           dex: 2, ac: 14, hp: 19 },
      { nombre: "Sabueso Valenar",   subt: "Feérico · Valenar",           dex: 2, ac: 14, hp: 19 },
      { nombre: "Corcel Valenar",    subt: "Feérico · Valenar",           dex: 3, ac: 13, hp: 22 },
    ],
    "Infernal": [
      { nombre: "Rak Tulkhesh",      subt: "Amo de la Oscuridad",         dex: 4, ac: 23, hp: 478 },
      { nombre: "Sul Khatesh",       subt: "Amo de la Oscuridad",         dex: 5, ac: 22, hp: 475 },
      { nombre: "Mordakhesh",        subt: "Rakshasa · Señor del Polvo",  dex: 3, ac: 18, hp: 170 },
      { nombre: "Zakya rakshasa",    subt: "Rakshasa soldado",            dex: 2, ac: 18, hp: 59 },
    ],
    "Humanoide": [
      { nombre: "El Señor de los Filos", subt: "Forjado señor de la guerra", dex: 2, ac: 19, hp: 195 },
      { nombre: "Caballero óseo",    subt: "Humanoide · Karrnath",        dex: 1, ac: 20, hp: 84 },
      { nombre: "Asesino Tarkanan",  subt: "Marca aberrante",             dex: 4, ac: 15, hp: 71 },
      { nombre: "Inspirado",         subt: "Humanoide psiónico",          dex: 2, ac: 12, hp: 40 },
      { nombre: "Soldado forjado",   subt: "Forjado",                     dex: 1, ac: 16, hp: 30 },
      { nombre: "Replicante",        subt: "Humanoide",                   dex: 2, ac: 13, hp: 22 },
      { nombre: "Kalashtar",         subt: "Humanoide psiónico",          dex: 2, ac: 13, hp: 22 },
      { nombre: "Cambiante",         subt: "Humanoide metamorfo",         dex: 3, ac: 14, hp: 19 },
      { nombre: "Artesano mágico",   subt: "Humanoide",                   dex: 1, ac: 11, hp: 9 },
    ],
    "Muerto Viviente": [
      { nombre: "La Dama Médulaenferma", subt: "Liche · Sangre de Vol",   dex: 3, ac: 19, hp: 187 },
      { nombre: "Consejero eterno",  subt: "Muerto viviente · Karrnath",  dex: 0, ac: 17, hp: 104 },
      { nombre: "Soldado eterno",    subt: "Muerto viviente · Karrnath",  dex: 1, ac: 17, hp: 26 },
      { nombre: "Soldado muerto viviente karrnio", subt: "Muerto viviente", dex: 2, ac: 17, hp: 52 },
    ],
  },
  "Resto de D&D": {
    "Trasgoides": [
      { nombre: "Goblin",            subt: "Trasgo",                      dex: 2, ac: 15, hp: 7 },
      { nombre: "Hobgoblin",         subt: "Trasgoide",                   dex: 1, ac: 18, hp: 11 },
      { nombre: "Hobgoblin Capitán", subt: "Líder trasgoide",             dex: 1, ac: 17, hp: 39 },
      { nombre: "Osgo",              subt: "Trasgoide grande",            dex: 2, ac: 16, hp: 27 },
    ],
    "No-muertos": [
      { nombre: "Esqueleto",         subt: "No-muerto",                   dex: 2, ac: 13, hp: 13 },
      { nombre: "Zombi",             subt: "No-muerto",                   dex: -2, ac: 8, hp: 22 },
      { nombre: "Espectro",          subt: "No-muerto incorpóreo",        dex: 2, ac: 12, hp: 22 },
      { nombre: "Caballero de la Muerte", subt: "No-muerto legendario",   dex: 0, ac: 20, hp: 180 },
    ],
    "Bestias": [
      { nombre: "Lobo",              subt: "Bestia",                      dex: 2, ac: 13, hp: 11 },
      { nombre: "Oso pardo",         subt: "Bestia grande",               dex: 0, ac: 11, hp: 34 },
      { nombre: "Águila gigante",    subt: "Bestia grande",               dex: 3, ac: 13, hp: 26 },
      { nombre: "Lobo huargo",       subt: "Bestia grande",               dex: 2, ac: 13, hp: 37 },
    ],
    "PNJs genéricos": [
      { nombre: "Plebeyo",           subt: "Humanoide · PNJ",  dex: 0, ac: 10, hp: 4 },
      { nombre: "Acólito",           subt: "Humanoide · PNJ",  dex: 0, ac: 10, hp: 9 },
      { nombre: "Bandido",           subt: "Humanoide · PNJ",  dex: 1, ac: 12, hp: 11 },
      { nombre: "Cultista",          subt: "Humanoide · PNJ",  dex: 1, ac: 12, hp: 9 },
      { nombre: "Guardia",           subt: "Humanoide · PNJ",  dex: 1, ac: 16, hp: 11 },
      { nombre: "Explorador",        subt: "Humanoide · PNJ",  dex: 2, ac: 13, hp: 16 },
      { nombre: "Espía",             subt: "Humanoide · PNJ",  dex: 2, ac: 12, hp: 27 },
      { nombre: "Matón",             subt: "Humanoide · PNJ",  dex: 0, ac: 11, hp: 32 },
      { nombre: "Sacerdote",         subt: "Humanoide · PNJ",  dex: 0, ac: 13, hp: 27 },
      { nombre: "Druida",            subt: "Humanoide · PNJ",  dex: 1, ac: 11, hp: 27 },
      { nombre: "Mago",              subt: "Humanoide · PNJ",  dex: 2, ac: 12, hp: 40 },
      { nombre: "Noble",             subt: "Humanoide · PNJ",  dex: 1, ac: 15, hp: 9 },
      { nombre: "Capitán bandido",   subt: "Humanoide · PNJ",  dex: 3, ac: 15, hp: 65 },
      { nombre: "Berserker",         subt: "Humanoide · PNJ",  dex: 1, ac: 13, hp: 67 },
      { nombre: "Veterano",          subt: "Humanoide · PNJ",  dex: 1, ac: 17, hp: 58 },
      { nombre: "Caballero",         subt: "Humanoide · PNJ",  dex: 0, ac: 18, hp: 52 },
      { nombre: "Gladiador",         subt: "Humanoide · PNJ",  dex: 2, ac: 16, hp: 112 },
      { nombre: "Asesino",           subt: "Humanoide · PNJ",  dex: 3, ac: 15, hp: 78 },
      { nombre: "Fanático cultista", subt: "Humanoide · PNJ",  dex: 2, ac: 13, hp: 33 },
      { nombre: "Archimago",         subt: "Humanoide · PNJ",  dex: 2, ac: 12, hp: 99 },
    ],
  },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

.eb-root *{ box-sizing:border-box; }
.eb-root{
  --bg:#0e1015; --bg2:#161922; --card:#1e222d; --line:#2c3140;
  --brass:#d4af37; --brass-dim:#8a7430; --shard:#3fd0c9; --shard-dim:#1f6f6a;
  --crim:#d6483b; --good:#5fbf6f; --ink:#e8e6df; --mute:#8b90a0;
  font-family:'Inter',system-ui,sans-serif; color:var(--ink);
  background:
    radial-gradient(1100px 540px at 82% -8%, rgba(63,208,201,.08), transparent 58%),
    radial-gradient(900px 520px at -8% 108%, rgba(212,175,55,.07), transparent 54%),
    radial-gradient(600px 400px at 50% 120%, rgba(155,127,232,.04), transparent 60%),
    var(--bg);
  min-height:100vh; padding:16px;
}
.eb-disp{ font-family:'Cinzel',serif; }
.eb-ui{ font-family:'Oswald',sans-serif; text-transform:uppercase; letter-spacing:.06em; }

/* esquinas ornamentadas */
.eb-ornate{ position:relative; }
.eb-ornate::before,.eb-ornate::after{ content:""; position:absolute; width:16px; height:16px; pointer-events:none; opacity:.7; }
.eb-ornate::before{ top:-1px; left:-1px; border-top:2px solid var(--brass-dim); border-left:2px solid var(--brass-dim); border-radius:12px 0 0 0; }
.eb-ornate::after{ bottom:-1px; right:-1px; border-bottom:2px solid var(--brass-dim); border-right:2px solid var(--brass-dim); border-radius:0 0 12px 0; }

/* animaciones */
@keyframes fadeUp{ from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:none; } }
@keyframes slidein{ from{ opacity:0; transform:translateX(-12px); } to{ opacity:1; transform:none; } }
@keyframes glowPulse{ 0%,100%{ box-shadow:0 0 0 1px var(--shard),0 0 18px rgba(63,208,201,.22); } 50%{ box-shadow:0 0 0 1px var(--shard),0 0 30px rgba(63,208,201,.4); } }
@keyframes shake{ 0%{transform:rotate(0)} 20%{transform:rotate(-12deg) scale(1.1)} 40%{transform:rotate(10deg) scale(1.12)} 60%{transform:rotate(-8deg) scale(1.08)} 80%{transform:rotate(6deg) scale(1.05)} 100%{transform:rotate(0) scale(1)} }
@keyframes drawerin{ from{ transform:translateX(28px); opacity:.4; } to{ transform:none; opacity:1; } }

/* barra superior */
.eb-top{ display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  background:linear-gradient(180deg,var(--bg2),rgba(22,25,34,.4)); border:1px solid var(--line);
  border-radius:14px; padding:12px 16px; margin-bottom:16px; animation:fadeUp .3s ease; }
.eb-title{ font-family:'Cinzel',serif; font-weight:900; font-size:19px;
  background:linear-gradient(120deg,var(--brass) 30%,#f2dc9b 50%,var(--brass) 70%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:.03em; }
.eb-seg{ display:flex; border:1px solid var(--line); border-radius:10px; overflow:hidden; }
.eb-seg button{ font-family:'Oswald'; text-transform:uppercase; letter-spacing:.05em; font-weight:600;
  background:transparent; color:var(--mute); border:none; padding:9px 14px; cursor:pointer; font-size:13px; min-height:42px; transition:color .15s,background .15s; }
.eb-seg button.on{ background:var(--card); color:var(--ink); }
.eb-seg button.on.dm{ color:var(--brass); }
.eb-seg button.on.pj{ color:var(--shard); }
.eb-round{ display:flex; align-items:center; gap:10px; margin-left:auto; }
.eb-round .lab{ font-size:10px; color:var(--mute); text-transform:uppercase; letter-spacing:.12em; font-family:'Oswald'; }
.eb-round .num{ font-family:'Cinzel'; font-size:24px; font-weight:700; line-height:1; color:var(--brass); }

.eb-btn{ font-family:'Oswald'; text-transform:uppercase; letter-spacing:.05em; font-weight:600;
  border:1px solid var(--line); background:var(--card); color:var(--ink);
  border-radius:10px; padding:10px 14px; cursor:pointer; display:inline-flex; align-items:center;
  gap:8px; font-size:13px; transition:border-color .15s,box-shadow .15s; min-height:44px; }
.eb-btn:hover{ border-color:var(--brass-dim); }
.eb-btn.primary{ background:linear-gradient(180deg,#243634,#1a2826); border-color:var(--shard-dim); color:var(--shard); }
.eb-btn.primary:hover{ box-shadow:0 0 0 1px var(--shard-dim),0 0 18px rgba(63,208,201,.25); }
.eb-btn.danger{ border-color:#4a2b28; color:#f2a59c; }
.eb-btn.ghost{ background:transparent; }
.eb-icon{ width:17px; height:17px; }

/* temporizador */
.eb-timer{ display:flex; align-items:center; gap:8px; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:8px 12px; transition:border-color .3s,background .3s; }
.eb-timer.warn{ border-color:#4a2b28; background:#2a1a18; }
.eb-timer.warn .tnum{ color:var(--crim); }
.eb-timer .tnum{ font-family:'Cinzel'; font-weight:700; font-size:24px; line-height:1; min-width:58px; text-align:center; color:var(--shard); transition:color .3s; }
.eb-timer .tlab{ font-size:9px; text-transform:uppercase; letter-spacing:.12em; color:var(--mute); font-family:'Oswald'; }
.eb-tbtn{ width:34px; height:34px; border-radius:8px; border:1px solid var(--line); background:var(--bg2); color:var(--ink); cursor:pointer; display:grid; place-items:center; flex:none; transition:border-color .15s; }
.eb-tbtn:hover{ border-color:var(--brass-dim); }
.eb-tedit{ display:flex; align-items:center; gap:6px; }
.eb-tedit input{ font-family:'Space Mono'; font-size:16px; width:60px; text-align:center; border-radius:8px; border:1px solid var(--shard-dim); background:var(--bg); color:var(--ink); padding:6px; }
.eb-tbar{ height:4px; border-radius:2px; background:var(--bg); overflow:hidden; width:60px; }
.eb-tfill{ height:100%; border-radius:2px; transition:width .9s linear, background .5s; }

/* exploración */
.eb-explore{ background:var(--bg2); border:1px solid var(--line); border-radius:14px; padding:24px; animation:fadeUp .3s ease; }
.eb-explore .eyebrow{ font-family:'Oswald'; text-transform:uppercase; letter-spacing:.14em; font-size:11px; color:var(--mute); display:flex; align-items:center; gap:8px; }
.eb-explore h2{ font-family:'Cinzel'; font-weight:700; font-size:24px; margin:8px 0 4px; color:var(--ink); }
.eb-explore p.note{ color:var(--mute); font-size:13px; margin:0 0 18px; }
.eb-roster{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media(max-width:560px){ .eb-roster{ grid-template-columns:1fr; } }
.eb-rmember{ display:flex; align-items:center; gap:10px; background:var(--card); border:1px solid var(--line); border-radius:11px; padding:11px 13px; transition:border-color .15s; }
.eb-rmember:hover{ border-color:var(--brass-dim); }
.eb-rmember .nm{ font-family:'Oswald'; font-weight:600; font-size:16px; }
.eb-rmember .sb{ font-size:11px; color:var(--mute); }
.eb-rmember .hp{ margin-left:auto; font-family:'Space Mono'; font-size:13px; }

/* layout combate */
.eb-grid{ display:grid; grid-template-columns:1.3fr 1fr; gap:16px; align-items:start; animation:fadeUp .25s ease; }
@media(max-width:880px){ .eb-grid{ grid-template-columns:1fr; } }
.eb-maplayout{ display:grid; grid-template-columns:76px 1fr; gap:12px; height:calc(100vh - 118px); align-items:stretch; transition:grid-template-columns .25s ease; animation:fadeUp .25s ease; }
.eb-maplayout.expanded{ grid-template-columns:236px 1fr; }
@media(max-width:640px){ .eb-maplayout{ grid-template-columns:54px 1fr; } .eb-maplayout.expanded{ grid-template-columns:190px 1fr; } }

/* riel */
.eb-rail{ position:relative; padding-left:26px; }
.eb-rail::before{ content:""; position:absolute; left:9px; top:8px; bottom:8px; width:2px; background:linear-gradient(var(--brass-dim),var(--shard-dim)); opacity:.55; }
.eb-card{ position:relative; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px 14px; margin-bottom:10px; cursor:pointer; transition:border-color .15s,opacity .2s; animation:slidein .3s ease; }
.eb-card:hover{ border-color:var(--brass-dim); }
.eb-card.sel{ border-color:var(--brass); }
.eb-card.active{ border-color:var(--shard); animation:glowPulse 2.4s ease-in-out infinite; }
.eb-card.down{ opacity:.5; }
.eb-card.mine{ background:linear-gradient(180deg,#1d2a2e,#1e222d); }
.eb-node{ position:absolute; left:-22px; top:50%; transform:translateY(-50%); width:14px; height:14px; border-radius:50%; background:var(--bg2); border:2px solid var(--line); transition:background .2s,border-color .2s; }
.eb-card.active .eb-node{ background:var(--shard); border-color:var(--shard); box-shadow:0 0 14px var(--shard); }
.eb-crow{ display:flex; align-items:center; gap:11px; }
.eb-handle{ display:flex; align-items:center; padding:0 2px; color:var(--mute); cursor:grab; opacity:.45; touch-action:none; flex:none; transition:opacity .15s,color .15s; }
.eb-handle:hover{ opacity:1; color:var(--brass); }
.eb-handle:active{ cursor:grabbing; }
.eb-initbadge{ font-family:'Cinzel'; font-weight:700; font-size:18px; width:40px; height:40px; flex:none; display:grid; place-items:center; border-radius:9px; background:var(--bg2); border:1px solid var(--line); }
.eb-card.enemy .eb-initbadge{ color:var(--crim); border-color:#4a2b28; }
.eb-card.pc .eb-initbadge{ color:var(--brass); border-color:var(--brass-dim); }
.eb-name{ font-family:'Oswald'; font-weight:600; font-size:17px; letter-spacing:.02em; display:flex; align-items:center; gap:7px; }
.eb-sub{ font-size:11px; color:var(--mute); margin-top:1px; }
.eb-stats{ margin-left:auto; display:flex; align-items:center; gap:12px; }
.eb-stat{ display:flex; align-items:center; gap:5px; font-family:'Space Mono'; font-size:15px; }
.eb-stat svg{ width:15px; height:15px; }
.eb-ac svg{ color:var(--mute); }
.eb-hp .v{ font-weight:700; }
.eb-hbar{ height:6px; border-radius:4px; background:var(--bg); margin-top:9px; overflow:hidden; border:1px solid var(--line); }
.eb-hfill{ height:100%; border-radius:3px; transition:width .3s ease,background .3s; }
.eb-temp{ color:var(--shard); font-size:12px; }
.eb-chips{ display:flex; flex-wrap:wrap; gap:5px; margin-top:9px; }
.eb-chip{ font-size:10px; text-transform:uppercase; letter-spacing:.05em; padding:3px 8px; border-radius:20px; background:#2a2330; border:1px solid #4a3a52; color:#d9b8e6; }
.eb-chip.conc{ background:#1f2e2e; border-color:var(--shard-dim); color:var(--shard); }
.eb-chip.rev{ background:#262019; border-color:var(--brass-dim); color:var(--brass); }
.eb-hidden{ font-size:11px; color:var(--mute); font-style:italic; }

/* unirse */
.eb-join{ background:linear-gradient(135deg,#1a2a28,#161922); border:1px solid var(--shard-dim); border-radius:14px; padding:28px; text-align:center; box-shadow:0 0 32px rgba(63,208,201,.1); animation:fadeUp .3s ease; }
.eb-join h2{ font-family:'Cinzel'; font-weight:700; letter-spacing:.02em; font-size:23px; margin:14px 0 6px; color:var(--shard); }
.eb-join p{ color:var(--mute); font-size:13px; margin:0 0 20px; }
.eb-join .big{ width:100%; justify-content:center; font-size:16px; padding:16px; }
.eb-initrow{ display:flex; gap:10px; margin-bottom:14px; }
.eb-initrow input{ flex:1; font-family:'Space Mono'; font-size:26px; text-align:center; padding:14px; border-radius:10px; border:1px solid var(--shard-dim); background:var(--bg); color:var(--ink); }
.eb-feed{ margin-top:18px; text-align:left; }
.eb-feed .ev{ font-size:13px; color:var(--mute); padding:7px 0; border-top:1px solid var(--line); display:flex; align-items:center; gap:8px; animation:slidein .3s ease; }
.eb-feed .ev b{ color:var(--ink); font-weight:600; }
.eb-feed .ev .i{ font-family:'Space Mono'; color:var(--brass); margin-left:auto; }

/* panel detalle */
.eb-panel{ background:var(--bg2); border:1px solid var(--line); border-radius:14px; padding:18px; position:sticky; top:16px; animation:fadeUp .25s ease; }
.eb-ph{ display:flex; align-items:flex-start; gap:12px; margin-bottom:16px; }
.eb-ph h2{ font-family:'Cinzel'; font-weight:700; font-size:21px; margin:0; }
.eb-ph p{ margin:3px 0 0; font-size:12px; color:var(--mute); }
.eb-big{ display:flex; align-items:baseline; gap:8px; justify-content:center; margin:6px 0 4px; }
.eb-big .hp{ font-family:'Cinzel'; font-weight:900; font-size:48px; line-height:1; transition:color .3s; }
.eb-big .max{ font-family:'Space Mono'; font-size:17px; color:var(--mute); }
.eb-hbar.lg{ height:12px; margin:0 0 16px; }
.eb-keys{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:10px; }
.eb-key{ font-family:'Space Mono'; font-weight:700; font-size:17px; padding:13px 0; border-radius:10px; border:1px solid var(--line); background:var(--card); color:var(--ink); cursor:pointer; min-height:50px; transition:background .12s; }
.eb-key.dmg{ border-color:#4a2b28; color:#f2a59c; } .eb-key.dmg:hover{ background:#3a201d; }
.eb-key.heal{ border-color:#2e4a30; color:#a7e0ad; } .eb-key.heal:hover{ background:#1e3a22; }
.eb-amt{ display:flex; gap:8px; margin-bottom:18px; }
.eb-amt input{ flex:1; font-family:'Space Mono'; font-size:17px; text-align:center; padding:12px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--ink); min-height:50px; }
.eb-act{ display:flex; gap:8px; }
.eb-act .eb-btn{ flex:1; justify-content:center; }
.eb-block{ margin-top:18px; }
.eb-block h3{ font-family:'Oswald'; text-transform:uppercase; letter-spacing:.1em; font-size:11px; color:var(--mute); margin:0 0 9px; }
.eb-condgrid{ display:flex; flex-wrap:wrap; gap:6px; }
.eb-cond{ font-size:11px; text-transform:uppercase; letter-spacing:.04em; padding:7px 11px; border-radius:8px; border:1px solid var(--line); background:var(--card); color:var(--mute); cursor:pointer; min-height:36px; transition:border-color .12s,background .12s; }
.eb-cond.on{ background:#2a2330; border-color:#5a4566; color:#e3c4ee; }
.eb-saves{ display:flex; gap:18px; align-items:center; background:#1d1a20; border:1px solid #3a2b42; border-radius:10px; padding:12px 14px; margin-top:14px; }
.eb-saves .grp{ flex:1; }
.eb-saves .grp small{ font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:var(--mute); font-family:'Oswald'; }
.eb-pips{ display:flex; gap:6px; margin-top:6px; }
.eb-pip{ width:22px; height:22px; border-radius:50%; border:2px solid var(--line); cursor:pointer; background:var(--bg); transition:background .15s,border-color .15s; }
.eb-pip.ok{ background:var(--good); border-color:var(--good); }
.eb-pip.fail{ background:var(--crim); border-color:var(--crim); }
.eb-empty{ text-align:center; color:var(--mute); padding:50px 20px; }
.eb-empty svg{ width:40px; height:40px; opacity:.35; margin-bottom:12px; }
.eb-removerow{ display:flex; justify-content:space-between; gap:8px; margin-top:16px; }
.eb-info{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:4px; }
.eb-infobox{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px; text-align:center; }
.eb-infobox .k{ font-size:9px; text-transform:uppercase; letter-spacing:.12em; color:var(--mute); font-family:'Oswald'; }
.eb-infobox .v{ font-family:'Cinzel'; font-weight:700; font-size:22px; margin-top:3px; }

/* riel mini + panel */
.eb-minirail{ display:flex; flex-direction:column; gap:6px; overflow-y:auto; height:100%; flex:none; }
.eb-minicard{ border-radius:10px; border:2px solid transparent; padding:6px 4px; display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; background:var(--card); transition:border-color .15s,box-shadow .2s; flex:none; }
.eb-minicard.active{ border-color:var(--shard); box-shadow:0 0 12px rgba(63,208,201,.25); }
.eb-minicard.minisel{ border-color:var(--brass); }
.eb-minicard .minitok{ width:36px; height:36px; border-radius:50%; border:2px solid; display:grid; place-items:center; font-family:'Cinzel'; font-weight:700; font-size:11px; flex:none; }
.eb-minicard .minihp{ width:100%; height:4px; border-radius:2px; background:var(--bg); overflow:hidden; }
.eb-minicard .minifill{ height:100%; border-radius:2px; transition:width .3s; }
.eb-minicard .miniinit{ font-family:'Space Mono'; font-size:9px; color:var(--mute); }
.eb-minipanel{ background:var(--bg2); border:1px solid var(--line); border-radius:12px; padding:12px; overflow-y:auto; height:100%; display:flex; flex-direction:column; gap:10px; animation:slidein .2s ease; min-width:0; flex:1; }
.eb-minipanel .mpname{ font-family:'Cinzel'; font-weight:700; font-size:16px; color:var(--ink); }
.eb-minipanel .mpsub{ font-size:10px; color:var(--mute); margin-top:1px; }
.eb-mphp{ display:flex; align-items:baseline; gap:6px; }
.eb-mphp .v{ font-family:'Cinzel'; font-weight:900; font-size:30px; transition:color .3s; }
.eb-mphp .mx{ font-family:'Space Mono'; font-size:12px; color:var(--mute); }
.eb-mpbar{ height:8px; border-radius:4px; background:var(--bg); overflow:hidden; border:1px solid var(--line); }
.eb-mpfill{ height:100%; border-radius:3px; transition:width .3s; }
.eb-mpkeys{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px; }
.eb-mpkey{ font-family:'Space Mono'; font-size:13px; font-weight:700; padding:8px 0; border-radius:8px; border:1px solid var(--line); background:var(--card); color:var(--ink); cursor:pointer; text-align:center; transition:background .12s; }
.eb-mpkey.d{ border-color:#4a2b28; color:#f2a59c; } .eb-mpkey.d:hover{ background:#3a201d; }
.eb-mpkey.h{ border-color:#2e4a30; color:#a7e0ad; } .eb-mpkey.h:hover{ background:#1e3a22; }
.eb-mpamt{ display:flex; gap:5px; }
.eb-mpamt input{ flex:1; font-family:'Space Mono'; font-size:14px; text-align:center; padding:8px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--ink); min-width:0; }
.eb-mpamt button{ flex:none; border-radius:8px; background:var(--card); padding:0 10px; cursor:pointer; font-size:16px; }
.eb-mpdivider{ height:1px; background:var(--line); margin:2px 0; }
.eb-mpconds{ display:flex; flex-wrap:wrap; gap:4px; }
.eb-mpcond{ font-size:9px; text-transform:uppercase; letter-spacing:.04em; padding:5px 8px; border-radius:6px; border:1px solid var(--line); background:var(--card); color:var(--mute); cursor:pointer; transition:border-color .12s; }
.eb-mpcond.on{ background:#2a2330; border-color:#5a4566; color:#e3c4ee; }
.eb-mpcond[disabled]{ cursor:default; opacity:.4; }
.eb-mpsaves{ display:flex; gap:12px; background:#1d1a20; border:1px solid #3a2b42; border-radius:8px; padding:8px 10px; }
.eb-mpsaves .grp small{ font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--mute); display:block; margin-bottom:4px; font-family:'Oswald'; }
.eb-mpsaves .pips{ display:flex; gap:4px; }
.eb-mpsaves .pip{ width:18px; height:18px; border-radius:50%; border:2px solid var(--line); cursor:pointer; background:var(--bg); }
.eb-mpsaves .pip.ok{ background:var(--good); border-color:var(--good); }
.eb-mpsaves .pip.fail{ background:var(--crim); border-color:var(--crim); }
.eb-mpclose{ font-family:'Oswald'; text-transform:uppercase; font-size:11px; letter-spacing:.06em; border:1px solid var(--line); background:transparent; color:var(--mute); border-radius:8px; padding:7px; cursor:pointer; text-align:center; margin-top:auto; transition:border-color .15s,color .15s; }
.eb-mpclose:hover{ border-color:var(--brass-dim); color:var(--ink); }
.eb-mapwrap{ height:100%; border-radius:14px; overflow:hidden; border:1px solid var(--line); }

/* catálogo */
.eb-overlay{ position:fixed; inset:0; background:rgba(8,9,12,.74); backdrop-filter:blur(4px); z-index:50; display:flex; justify-content:flex-end; }
.eb-drawer{ width:min(860px,98vw); height:100%; background:var(--bg2); border-left:1px solid var(--line); display:flex; flex-direction:column; animation:drawerin .25s ease; overflow:hidden; }
.eb-dhead{ display:flex; align-items:center; gap:10px; padding:16px 18px 0; flex:none; }
.eb-dhead h2{ font-family:'Cinzel'; font-weight:700; font-size:20px; margin:0; }
.eb-dtop{ padding:12px 18px; flex:none; border-bottom:1px solid var(--line); }
.eb-gtabs{ display:flex; gap:8px; margin-bottom:12px; }
.eb-gtab{ flex:1; font-family:'Oswald'; text-transform:uppercase; letter-spacing:.05em; font-weight:600; font-size:13px; padding:11px 0; border-radius:10px; border:1px solid var(--line); background:var(--card); color:var(--mute); cursor:pointer; min-height:44px; transition:border-color .15s,color .15s; }
.eb-gtab.on{ color:var(--brass); border-color:var(--brass-dim); background:#241f16; }
.eb-gtab.on.alt{ color:var(--shard); border-color:var(--shard-dim); background:#1a2a28; }
.eb-srch{ display:flex; align-items:center; gap:9px; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:11px 13px; }
.eb-srch input{ flex:1; background:transparent; border:none; outline:none; color:var(--ink); font-size:15px; }
.eb-dbody{ flex:1; display:grid; grid-template-columns:1fr 1fr; overflow:hidden; min-height:0; }
@media(max-width:640px){ .eb-dbody{ grid-template-columns:1fr; } }
.eb-dlist{ overflow-y:auto; padding:14px 18px; border-right:1px solid var(--line); }
.eb-fam{ font-family:'Oswald'; text-transform:uppercase; letter-spacing:.1em; font-size:11px; color:var(--brass); margin:16px 0 8px; }
.eb-fam:first-child{ margin-top:0; }
.eb-catgrid{ display:grid; grid-template-columns:1fr 1fr; gap:7px; }
.eb-mob{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:10px 11px; cursor:pointer; transition:border-color .15s,background .15s; }
.eb-mob:hover{ border-color:var(--brass-dim); background:#242833; }
.eb-mob.exp{ border-color:var(--brass); box-shadow:0 0 0 1px var(--brass-dim); }
.eb-mob .nm{ font-family:'Oswald'; font-weight:600; font-size:14px; line-height:1.2; }
.eb-mob .sb{ font-size:10px; color:var(--mute); margin-top:2px; }
.eb-mob .mini{ display:flex; gap:8px; margin-top:7px; font-family:'Space Mono'; font-size:11px; color:var(--mute); }
.eb-mob .mini b{ color:var(--ink); }
.eb-ddetail{ overflow-y:auto; padding:0; display:flex; flex-direction:column; background:var(--bg); }
.eb-ddetail .empty{ display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--mute); gap:10px; padding:40px; text-align:center; opacity:.6; }
.eb-imgslot{ width:100%; aspect-ratio:16/9; background:linear-gradient(135deg,#161922,#1e222d); border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:8px; color:var(--mute); flex:none; position:relative; overflow:hidden; }
.eb-imgslot::before{ content:""; position:absolute; inset:0; background:repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,.012) 10px,rgba(255,255,255,.012) 11px); }
.eb-imgslot svg{ width:38px; height:38px; opacity:.3; }
.eb-imgslot .lbl{ font-size:10px; text-transform:uppercase; letter-spacing:.12em; opacity:.5; font-family:'Oswald'; }
.eb-dinfo{ padding:18px; flex:1; }
.eb-dname{ font-family:'Cinzel'; font-weight:700; font-size:24px; margin:0 0 2px; }
.eb-dsub{ font-size:12px; color:var(--mute); margin-bottom:18px; }
.eb-statrow{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:20px; }
.eb-statbox{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px 8px; text-align:center; }
.eb-statbox .k{ font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--mute); font-family:'Oswald'; }
.eb-statbox .v{ font-family:'Cinzel'; font-weight:700; font-size:24px; margin-top:2px; }
.eb-futura{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px; font-size:12px; color:var(--mute); font-style:italic; margin-bottom:20px; line-height:1.6; }
.eb-dfoot{ padding:0 18px 18px; flex:none; }
.eb-addrow{ display:flex; align-items:center; gap:10px; }
.eb-step{ display:flex; align-items:center; gap:8px; }
.eb-step button{ width:36px; height:36px; border-radius:9px; border:1px solid var(--line); background:var(--bg2); color:var(--ink); font-size:18px; cursor:pointer; transition:border-color .15s; }
.eb-step button:hover{ border-color:var(--brass-dim); }
.eb-step .q{ font-family:'Space Mono'; font-weight:700; font-size:18px; width:28px; text-align:center; }
.eb-add{ flex:1; justify-content:center; font-family:'Oswald'; text-transform:uppercase; letter-spacing:.05em; font-weight:600; border:1px solid var(--shard-dim); background:linear-gradient(180deg,#243634,#1a2826); color:var(--shard); border-radius:10px; padding:12px; cursor:pointer; display:flex; align-items:center; gap:8px; min-height:48px; font-size:14px; transition:box-shadow .15s; }
.eb-add:hover{ box-shadow:0 0 0 1px var(--shard-dim),0 0 16px rgba(63,208,201,.2); }
.eb-initroller{ background:var(--card); border:1px solid var(--line); border-radius:12px; padding:14px 16px; margin-bottom:14px; }
.eb-initroller .rlabel{ font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:var(--mute); margin-bottom:10px; display:flex; align-items:center; gap:6px; font-family:'Oswald'; }
.eb-rollrow{ display:flex; align-items:center; gap:10px; }
.eb-die{ width:56px; height:56px; border-radius:12px; border:2px solid var(--line); background:var(--bg); display:grid; place-items:center; flex:none; transition:border-color .15s; }
.eb-die.has{ border-color:var(--brass-dim); }
.eb-die .face{ font-family:'Cinzel'; font-weight:900; font-size:26px; color:var(--brass); line-height:1; }
.eb-die .sub{ font-size:8px; color:var(--mute); text-transform:uppercase; letter-spacing:.08em; margin-top:1px; }
.eb-die.shaking{ animation:shake .35s ease; }
.eb-rollbtn{ flex:none; font-family:'Oswald'; text-transform:uppercase; letter-spacing:.05em; font-weight:600; font-size:12px; border:1px solid var(--line); background:var(--bg2); color:var(--mute); border-radius:10px; padding:10px 13px; cursor:pointer; min-height:44px; display:flex; align-items:center; gap:7px; transition:border-color .15s,color .15s; }
.eb-rollbtn:hover{ border-color:var(--brass-dim); color:var(--ink); }
.eb-totalbox{ flex:1; background:var(--bg); border:1px solid var(--line); border-radius:10px; text-align:center; padding:8px; }
.eb-totalbox .k{ font-size:8px; text-transform:uppercase; letter-spacing:.12em; color:var(--mute); font-family:'Oswald'; }
.eb-totalbox .v{ font-family:'Cinzel'; font-weight:900; font-size:26px; color:var(--shard); line-height:1.15; }
.eb-totalbox .breakdown{ font-family:'Space Mono'; font-size:10px; color:var(--mute); margin-top:1px; }
`;

const hpColor = (r) => (r > 0.5 ? "var(--good)" : r > 0.25 ? "var(--brass)" : "var(--crim)");
const d20 = () => Math.floor(Math.random() * 20) + 1;
const fmt = (n) => (n >= 0 ? "+" + n : "" + n);

export default function RastreadorCombate() {
  /* ───────────── estado núcleo ───────────── */
  const [combatientes, setCombatientes] = useState(PARTY);
  const [enCombate, setEnCombate] = useState(false);
  const [rol, setRol] = useState("dm");
  const [ronda, setRonda] = useState(1);
  const [turno, setTurno] = useState(0);
  const [ordenIds, setOrdenIds] = useState([]);
  const [selId, setSelId] = useState(null);
  const [vistaOcultar, setVistaOcultar] = useState(false);
  const [monto, setMonto] = useState("");
  const [feed, setFeed] = useState([]);
  const [uniendo, setUniendo] = useState(false);
  const [initInput, setInitInput] = useState("");

  /* catálogo */
  const [catAbierto, setCatAbierto] = useState(false);
  const [grupoCat, setGrupoCat] = useState("Eberron");
  const [busca, setBusca] = useState("");
  const [cant, setCant] = useState({});
  const [expandido, setExpandido] = useState(null);
  const [rolledInit, setRolledInit] = useState({});

  /* temporizador */
  const [timerDur, setTimerDur] = useState(60);
  const [timerLeft, setTimerLeft] = useState(60);
  const [timerOn, setTimerOn] = useState(false);
  const [timerEdit, setTimerEdit] = useState(false);
  const [timerInput, setTimerInput] = useState("60");
  const timerInterval = useRef(null);

  /* mapa — estado ELEVADO: persiste entre vistas */
  const [mapaVisible, setMapaVisible] = useState(false);
  const [miniSelId, setMiniSelId] = useState(null);
  const [miniMonto, setMiniMonto] = useState("");
  const [mapTokens, setMapTokens] = useState({});
  const [mapScenes, setMapScenes] = useState([]);
  const [mapActiveScene, setMapActiveScene] = useState(null);
  const [mapImgSize, setMapImgSize] = useState({ w: 1200, h: 800 });
  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 40, y: 40 });
  const [mapCellPx, setMapCellPx] = useState(60);
  const [mapTool, setMapTool] = useState("move");
  const [mapShowGrid, setMapShowGrid] = useState(true);

  const timers = useRef([]);
  const rolRef = useRef(rol); useEffect(() => { rolRef.current = rol; }, [rol]);
  const combatRef = useRef(combatientes); useEffect(() => { combatRef.current = combatientes; }, [combatientes]);

  const esDM = rol === "dm";
  const mapaActivado = enCombate && mapaVisible;
  const ocultarEnemigos = rol === "jugador" || vistaOcultar;

  const orden = useMemo(
    () => ordenIds.map(id => combatientes.find(c => c.id === id)).filter(Boolean),
    [ordenIds, combatientes]
  );
  const activoId = orden[turno % (orden.length || 1)]?.id;
  const sel = combatientes.find(c => c.id === selId);
  const yo = combatientes.find(c => c.id === MI_PJ);
  const yaUnido = yo?.unido;

  const upd = useCallback((id, patch) =>
    setCombatientes(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c)), []);
  const limpiarTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => limpiarTimers(), []);

  /* ───────────── temporizador ───────────── */
  useEffect(() => {
    if (timerOn) {
      timerInterval.current = setInterval(() => {
        setTimerLeft(t => {
          if (t <= 1) { clearInterval(timerInterval.current); setTimerOn(false); return 0; }
          return t - 1;
        });
      }, 1000);
    } else clearInterval(timerInterval.current);
    return () => clearInterval(timerInterval.current);
  }, [timerOn]);

  const timerReset = () => { setTimerOn(false); setTimerLeft(timerDur); };
  const timerSave = () => {
    const v = Math.max(5, parseInt(timerInput, 10) || 60);
    setTimerDur(v); setTimerLeft(v); setTimerOn(false); setTimerEdit(false);
  };

  /* ───────────── orden / turnos ───────────── */
  const insertarOrden = (prev, id, init) => {
    const map = Object.fromEntries(combatRef.current.map(c => [c.id, c.init]));
    map[id] = init;
    const arr = prev.filter(x => x !== id);
    const idx = arr.findIndex(x => (map[x] ?? -99) < init);
    if (idx === -1) arr.push(id); else arr.splice(idx, 0, id);
    return arr;
  };

  const unirPJ = (id, init, etiqueta) => {
    upd(id, { unido: true, init });
    setOrdenIds(prev => insertarOrden(prev, id, init));
    setFeed(f => [{ nombre: (combatRef.current.find(c => c.id === id)?.nombre || "") + (etiqueta || ""), init }, ...f]);
  };

  const siguiente = () => {
    if (!orden.length) return;
    const n = turno + 1;
    if (n % orden.length === 0) setRonda(r => r + 1);
    setTurno(n);
    setSelId(orden[n % orden.length].id);
    setTimerLeft(timerDur); setTimerOn(false);
  };

  /* ───────────── iniciar / terminar ───────────── */
  const iniciarCombate = () => {
    limpiarTimers();
    setFeed([]); setUniendo(false); setInitInput("");
    setRonda(1); setTurno(0);
    const conInit = combatientes.map(c =>
      c.tipo === "enemy" ? { ...c, unido: true, init: d20() + c.dex } : { ...c, unido: false, init: 0 }
    );
    setCombatientes(conInit);
    combatRef.current = conInit;
    setOrdenIds(conInit.filter(c => c.tipo === "enemy").sort((a, b) => b.init - a.init).map(c => c.id));
    setEnCombate(true);
    setSelId(null);
    // otros PCs se unen solos; MI_PJ en modo jugador espera acción manual
    conInit.filter(c => c.tipo === "pc").forEach((p, i) => {
      if (p.id === MI_PJ && rolRef.current === "jugador") return;
      const t = setTimeout(() => unirPJ(p.id, d20() + p.dex, p.id === MI_PJ ? " (tú)" : ""), 1200 + i * 1400);
      timers.current.push(t);
    });
  };

  const terminarCombate = () => {
    limpiarTimers();
    setEnCombate(false);
    setOrdenIds([]);
    setCombatientes(cs => cs.map(c =>
      c.tipo === "enemy" ? c : { ...c, unido: false, init: 0, cond: [], salv: { ok: 0, fail: 0 } }
    ));
    setSelId(null); setFeed([]); setUniendo(false);
    setMapaVisible(false); setMiniSelId(null);
    setTimerOn(false); setTimerLeft(timerDur);
  };

  const confirmarUnion = () => {
    const v = parseInt(initInput, 10);
    if (isNaN(v)) return;
    unirPJ(MI_PJ, v, " (tú)");
    setUniendo(false); setInitInput(""); setSelId(MI_PJ);
  };

  /* ───────────── drag & drop riel ───────────── */
  const dragId = useRef(null);
  const dragOverId = useRef(null);
  const onDragStart = (e, id) => { dragId.current = id; e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e, id) => { e.preventDefault(); dragOverId.current = id; };
  const onDrop = (e, id) => {
    e.preventDefault();
    const from = dragId.current, to = id;
    if (!from || from === to) return;
    setOrdenIds(prev => {
      const arr = [...prev];
      const fi = arr.indexOf(from), ti = arr.indexOf(to);
      if (fi < 0 || ti < 0) return prev;
      arr.splice(fi, 1); arr.splice(ti, 0, from);
      return arr;
    });
    dragId.current = null; dragOverId.current = null;
  };
  const onDragEnd = () => { dragId.current = null; dragOverId.current = null; };
  const touchDrag = useRef({ id: null });
  const onTouchStartCard = (e, id) => { touchDrag.current = { id }; };
  const onTouchMoveCard = (e) => {
    if (!touchDrag.current.id) return;
    const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    const card = el?.closest("[data-rid]");
    if (card) dragOverId.current = card.dataset.rid;
  };
  const onTouchEndCard = () => {
    const from = touchDrag.current.id, to = dragOverId.current;
    if (from && to && from !== to) {
      setOrdenIds(prev => {
        const arr = [...prev];
        const fi = arr.indexOf(from), ti = arr.indexOf(to);
        if (fi < 0 || ti < 0) return prev;
        arr.splice(fi, 1); arr.splice(ti, 0, from);
        return arr;
      });
    }
    touchDrag.current = { id: null }; dragOverId.current = null;
  };

  /* ───────────── HP / condiciones ───────────── */
  const dano = useCallback((id, n) => {
    setCombatientes(cs => cs.map(c => {
      if (c.id !== id) return c;
      let r = n, t = c.tempHp;
      if (t > 0) { const q = Math.min(t, r); t -= q; r -= q; }
      return { ...c, hp: Math.max(0, c.hp - r), tempHp: t };
    }));
  }, []);
  const cura = useCallback((id, n) => {
    setCombatientes(cs => cs.map(c => c.id === id ? { ...c, hp: Math.min(c.maxHp, c.hp + n) } : c));
  }, []);
  const aplicar = (s) => {
    const v = parseInt(monto, 10);
    if (!sel || isNaN(v) || v <= 0) return;
    s < 0 ? dano(sel.id, v) : cura(sel.id, v);
    setMonto("");
  };
  const toggleCond = (c) => {
    if (!sel) return;
    upd(sel.id, { cond: sel.cond.includes(c) ? sel.cond.filter(x => x !== c) : [...sel.cond, c] });
  };
  const setSalv = (tipo, n) => {
    if (!sel) return;
    upd(sel.id, { salv: { ...sel.salv, [tipo]: sel.salv[tipo] === n ? n - 1 : n } });
  };

  /* ───────────── catálogo ───────────── */
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const out = {};
    Object.entries(CATALOGO[grupoCat]).forEach(([fam, arr]) => {
      const f = arr.filter(c => !q || c.nombre.toLowerCase().includes(q) || c.subt.toLowerCase().includes(q));
      if (f.length) out[fam] = f;
    });
    return out;
  }, [busca, grupoCat]);

  const tirarInit = (c) => {
    const dado = d20();
    setRolledInit(prev => ({ ...prev, [c.nombre]: { dado, total: dado + c.dex, anim: true } }));
    setTimeout(() => setRolledInit(prev => prev[c.nombre] ? { ...prev, [c.nombre]: { ...prev[c.nombre], anim: false } } : prev), 450);
  };

  const añadir = (crit) => {
    const q = cant[crit.nombre] || 1;
    const base = combatientes.filter(c => c.nombre.startsWith(crit.nombre)).length;
    const pre = rolledInit[crit.nombre]?.total;
    const nuevos = Array.from({ length: q }).map((_, i) => {
      const init = enCombate ? (q === 1 && pre != null ? pre : d20() + crit.dex) : 0;
      return {
        id: crit.nombre + "-" + Date.now() + "-" + i,
        nombre: q > 1 || base > 0 ? `${crit.nombre} ${base + i + 1}` : crit.nombre,
        tipo: "enemy", subt: crit.subt, dex: crit.dex, ac: crit.ac,
        hp: crit.hp, maxHp: crit.hp, tempHp: 0, cond: [], conc: false,
        oculto: true, revelado: false, unido: enCombate, init, salv: { ok: 0, fail: 0 },
      };
    });
    setCombatientes(cs => [...cs, ...nuevos]);
    combatRef.current = [...combatRef.current, ...nuevos];
    if (enCombate) setOrdenIds(prev => nuevos.reduce((acc, n) => insertarOrden(acc, n.id, n.init), prev));
    setCant(c => ({ ...c, [crit.nombre]: 1 }));
    setRolledInit(prev => { const n = { ...prev }; delete n[crit.nombre]; return n; });
  };

  const eliminar = (id) => {
    setCombatientes(cs => cs.filter(c => c.id !== id));
    setOrdenIds(prev => prev.filter(x => x !== id));
    if (selId === id) setSelId(null);
    if (miniSelId === id) setMiniSelId(null);
  };

  const enemigosPreparados = combatientes.filter(c => c.tipo === "enemy");

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div className="eb-root">
      <style>{CSS}</style>

      {/* ─── barra superior ─── */}
      <div className="eb-top eb-ornate">
        <div className="eb-title">Riel de Combate</div>
        <div className="eb-seg">
          <button className={esDM ? "on dm" : ""} onClick={() => setRol("dm")}>
            <Crown className="eb-icon" style={{ verticalAlign: -4 }} /> DM
          </button>
          <button className={!esDM ? "on pj" : ""} onClick={() => setRol("jugador")}>Jugador</button>
        </div>
        {esDM && <button className="eb-btn ghost" onClick={() => setCatAbierto(true)}><UserPlus className="eb-icon" /> Enemigos</button>}
        {enCombate && (
          <button className={"eb-btn ghost" + (mapaVisible ? " primary" : "")} onClick={() => setMapaVisible(v => !v)}>
            <MapIcon className="eb-icon" /> {mapaVisible ? "Ver riel" : "Ver mapa"}
          </button>
        )}
        {esDM && enCombate && (
          <button className="eb-btn ghost" onClick={() => setVistaOcultar(v => !v)}>
            {vistaOcultar ? <EyeOff className="eb-icon" /> : <Eye className="eb-icon" />}
            {vistaOcultar ? "Vista jugador" : "Vista DM"}
          </button>
        )}
        {enCombate && (
          <div className={"eb-timer" + (timerLeft <= 10 && timerLeft > 0 ? " warn" : "")}>
            <Timer className="eb-icon" style={{ color: timerLeft <= 10 ? "var(--crim)" : "var(--mute)", flex: "none" }} />
            {esDM && timerEdit ? (
              <div className="eb-tedit">
                <input type="number" value={timerInput} onChange={e => setTimerInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && timerSave()} autoFocus />
                <button className="eb-tbtn" onClick={timerSave}><Check size={14} /></button>
                <button className="eb-tbtn" onClick={() => setTimerEdit(false)}><X size={14} /></button>
              </div>
            ) : (
              <>
                <div>
                  <div className="tlab">Turno</div>
                  <div className="tnum">{String(Math.floor(timerLeft / 60)).padStart(2, "0")}:{String(timerLeft % 60).padStart(2, "0")}</div>
                  <div className="eb-tbar"><div className="eb-tfill" style={{ width: `${(timerLeft / timerDur) * 100}%`, background: timerLeft <= 10 ? "var(--crim)" : timerLeft <= timerDur * 0.4 ? "var(--brass)" : "var(--shard)" }} /></div>
                </div>
                {esDM && (
                  <>
                    <button className="eb-tbtn" onClick={() => setTimerOn(v => !v)}>{timerOn ? <Pause size={15} /> : <Play size={15} />}</button>
                    <button className="eb-tbtn" onClick={timerReset}><RotateCcw size={14} /></button>
                    <button className="eb-tbtn" onClick={() => { setTimerInput(String(timerDur)); setTimerEdit(true); setTimerOn(false); }}><Timer size={14} /></button>
                  </>
                )}
              </>
            )}
          </div>
        )}
        <div className="eb-round">
          {esDM ? (
            !enCombate ? (
              <button className="eb-btn primary" onClick={iniciarCombate}><Swords className="eb-icon" /> Iniciar combate</button>
            ) : (
              <>
                <div><div className="lab">Ronda</div><div className="num">{ronda}</div></div>
                <button className="eb-btn primary" onClick={siguiente}>Siguiente turno <ChevronRight className="eb-icon" /></button>
                <button className="eb-btn danger" onClick={terminarCombate}><X className="eb-icon" /> Terminar</button>
              </>
            )
          ) : (
            enCombate && <div><div className="lab">Ronda</div><div className="num">{ronda}</div></div>
          )}
        </div>
      </div>

      {/* ─── fuera de combate ─── */}
      {!enCombate && (
        <div className="eb-explore eb-ornate">
          <div className="eyebrow"><Footprints className="eb-icon" /> Fuera de combate</div>
          <h2>{esDM ? "El grupo explora Khorvaire" : "El grupo está explorando"}</h2>
          <p className="note">{esDM ? "Prepara el encuentro y pulsa «Iniciar combate» cuando quieras llamar a los jugadores al riel." : "Cuando el DM inicie un combate aparecerá aquí la opción de unirte."}</p>
          <div className="eb-roster">
            {combatientes.filter(c => c.tipo === "pc").map(c => (
              <div key={c.id} className="eb-rmember">
                <Shield className="eb-icon" style={{ color: "var(--brass)" }} />
                <div><div className="nm">{c.nombre}</div><div className="sb">{c.subt}</div></div>
                <div className="hp" style={{ color: hpColor(c.hp / c.maxHp) }}>{c.hp}/{c.maxHp}</div>
              </div>
            ))}
          </div>
          {esDM && enemigosPreparados.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="eyebrow"><Skull className="eb-icon" /> Encuentro preparado ({enemigosPreparados.length})</div>
              <div className="eb-roster" style={{ marginTop: 8 }}>
                {enemigosPreparados.map(c => (
                  <div key={c.id} className="eb-rmember">
                    <Skull className="eb-icon" style={{ color: "var(--crim)" }} />
                    <div><div className="nm">{c.nombre}</div><div className="sb">{c.subt}</div></div>
                    <button className="eb-btn ghost" style={{ marginLeft: "auto", padding: "6px 8px", minHeight: 0 }} onClick={() => eliminar(c.id)}><X size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── vista mapa ─── */}
      {enCombate && mapaActivado && (
        <div className={"eb-maplayout" + (miniSelId ? " expanded" : "")}>
          <div style={{ display: "flex", gap: 8, height: "100%", minWidth: 0 }}>
            <div className="eb-minirail">
              {orden.map(c => {
                const ratio = c.maxHp ? c.hp / c.maxHp : 0;
                const col = c.tipo === "enemy" ? "var(--crim)" : "var(--brass)";
                return (
                  <div key={c.id}
                    className={"eb-minicard " + c.tipo + (c.id === activoId ? " active" : "") + (c.id === miniSelId ? " minisel" : "")}
                    onClick={() => setMiniSelId(c.id === miniSelId ? null : c.id)} title={c.nombre}>
                    <div className="minitok" style={{ borderColor: col, background: col + "22", color: col }}>{initials(c.nombre)}</div>
                    <div className="miniinit">{c.init}</div>
                    <div className="minihp"><div className="minifill" style={{ width: `${ratio * 100}%`, background: hpColor(ratio) }} /></div>
                  </div>
                );
              })}
            </div>
            {miniSelId && (() => {
              const c = combatientes.find(x => x.id === miniSelId);
              if (!c) return null;
              const ratio = c.maxHp ? c.hp / c.maxHp : 0;
              const puedoEditar = esDM || c.id === MI_PJ;
              const applyMini = (signo) => {
                const v = parseInt(miniMonto, 10);
                if (isNaN(v) || v <= 0) return;
                signo < 0 ? dano(c.id, v) : cura(c.id, v);
                setMiniMonto("");
              };
              return (
                <div className="eb-minipanel eb-ornate">
                  <div>
                    <div className="mpname">{c.nombre}</div>
                    <div className="mpsub">{c.subt} · CA {c.ac} · init {c.init}</div>
                  </div>
                  <div>
                    <div className="eb-mphp">
                      <span className="v" style={{ color: hpColor(ratio) }}>{c.hp}</span>
                      <span className="mx">/ {c.maxHp}{c.tempHp > 0 ? ` (+${c.tempHp})` : ""}</span>
                    </div>
                    <div className="eb-mpbar"><div className="eb-mpfill" style={{ width: `${ratio * 100}%`, background: hpColor(ratio) }} /></div>
                  </div>
                  {puedoEditar && (
                    <>
                      <div className="eb-mpkeys">
                        <button className="eb-mpkey d" onClick={() => dano(c.id, 1)}>−1</button>
                        <button className="eb-mpkey d" onClick={() => dano(c.id, 5)}>−5</button>
                        <button className="eb-mpkey d" onClick={() => dano(c.id, 10)}>−10</button>
                        <button className="eb-mpkey h" onClick={() => cura(c.id, 1)}>+1</button>
                        <button className="eb-mpkey h" onClick={() => cura(c.id, 5)}>+5</button>
                        <button className="eb-mpkey h" onClick={() => cura(c.id, 10)}>+10</button>
                      </div>
                      <div className="eb-mpamt">
                        <input type="number" inputMode="numeric" placeholder="cant." value={miniMonto}
                          onChange={e => setMiniMonto(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") applyMini(-1); }} />
                        <button style={{ border: "1px solid #4a2b28", color: "#f2a59c" }} onClick={() => applyMini(-1)}>−</button>
                        <button style={{ border: "1px solid #2e4a30", color: "#a7e0ad" }} onClick={() => applyMini(1)}>+</button>
                      </div>
                    </>
                  )}
                  {c.tipo === "pc" && c.hp === 0 && (
                    <div className="eb-mpsaves">
                      <div className="grp"><small>Éxitos</small><div className="pips">
                        {[1, 2, 3].map(n => <span key={n} className={"pip" + (c.salv.ok >= n ? " ok" : "")}
                          onClick={() => puedoEditar && upd(c.id, { salv: { ...c.salv, ok: c.salv.ok === n ? n - 1 : n } })} />)}
                      </div></div>
                      <div className="grp"><small>Fallos</small><div className="pips">
                        {[1, 2, 3].map(n => <span key={n} className={"pip" + (c.salv.fail >= n ? " fail" : "")}
                          onClick={() => puedoEditar && upd(c.id, { salv: { ...c.salv, fail: c.salv.fail === n ? n - 1 : n } })} />)}
                      </div></div>
                    </div>
                  )}
                  <div className="eb-mpdivider" />
                  <div className="eb-mpconds">
                    {CONDICIONES.map(cond => (
                      <button key={cond}
                        className={"eb-mpcond" + (c.cond.includes(cond) ? " on" : "")}
                        onClick={() => puedoEditar && upd(c.id, { cond: c.cond.includes(cond) ? c.cond.filter(x => x !== cond) : [...c.cond, cond] })}
                        disabled={!puedoEditar && !c.cond.includes(cond)}>
                        {cond}
                      </button>
                    ))}
                  </div>
                  <button className="eb-mpclose" onClick={() => setMiniSelId(null)}>✕ cerrar</button>
                </div>
              );
            })()}
          </div>
          <div className="eb-mapwrap">
            <MapaCombate
              combatientes={orden} miPjId={MI_PJ} esDM={esDM}
              turnoActualId={orden[turno % (orden.length || 1)]?.id}
              tokens={mapTokens} setTokens={setMapTokens}
              scenes={mapScenes} setScenes={setMapScenes}
              activeScene={mapActiveScene} setActiveScene={setMapActiveScene}
              imgSize={mapImgSize} setImgSize={setMapImgSize}
              zoom={mapZoom} setZoom={setMapZoom}
              pan={mapPan} setPan={setMapPan}
              cellPx={mapCellPx} setCellPx={setMapCellPx}
              tool={mapTool} setTool={setMapTool}
              showGrid={mapShowGrid} setShowGrid={setMapShowGrid}
            />
          </div>
        </div>
      )}

      {/* ─── vista riel completo ─── */}
      {enCombate && !mapaActivado && (
        <div className="eb-grid">
          <div>
            {!esDM && !yaUnido ? (
              <div className="eb-join eb-ornate">
                <Swords className="eb-icon" style={{ width: 34, height: 34, color: "var(--shard)" }} />
                <h2>¡Combate iniciado!</h2>
                {!uniendo ? (
                  <>
                    <p>El DM ha llamado al grupo al riel. Tira tu iniciativa físicamente y entra con el resultado.</p>
                    <button className="eb-btn primary big" onClick={() => setUniendo(true)}><LogIn className="eb-icon" /> Unirse al evento</button>
                  </>
                ) : (
                  <>
                    <p>¿Qué sacaste en iniciativa? (d20 + tu modificador)</p>
                    <div className="eb-initrow">
                      <input type="number" inputMode="numeric" autoFocus placeholder="0"
                        value={initInput} onChange={e => setInitInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && confirmarUnion()} />
                      <button className="eb-btn primary" onClick={confirmarUnion}><Check className="eb-icon" /> Entrar</button>
                    </div>
                    <p style={{ margin: 0 }}>Tu modificador de DEX es {fmt(yo?.dex || 0)}.</p>
                  </>
                )}
                {feed.length > 0 && (
                  <div className="eb-feed">
                    {feed.map((e, i) => (
                      <div className="ev" key={i}>
                        <Dices className="eb-icon" style={{ color: "var(--shard)" }} />
                        <span><b>{e.nombre}</b> se unió</span><span className="i">init {e.init}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="eb-rail">
                {orden.map(c => {
                  const ratio = c.maxHp ? c.hp / c.maxHp : 0;
                  const down = c.hp === 0;
                  const oculto = c.tipo === "enemy" && !c.revelado && ocultarEnemigos;
                  return (
                    <div key={c.id}
                      data-rid={c.id}
                      draggable={esDM}
                      onDragStart={e => esDM && onDragStart(e, c.id)}
                      onDragOver={e => esDM && onDragOver(e, c.id)}
                      onDrop={e => esDM && onDrop(e, c.id)}
                      onDragEnd={onDragEnd}
                      onTouchStart={e => esDM && onTouchStartCard(e, c.id)}
                      onTouchMove={e => esDM && onTouchMoveCard(e)}
                      onTouchEnd={() => esDM && onTouchEndCard()}
                      className={["eb-card", c.tipo,
                        c.id === activoId ? "active" : "",
                        c.id === selId ? "sel" : "",
                        c.id === MI_PJ ? "mine" : "",
                        down ? "down" : ""].join(" ")}
                      onClick={() => setSelId(c.id)}>
                      <span className="eb-node" />
                      <div className="eb-crow">
                        {esDM && (
                          <div className="eb-handle" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                            <GripVertical size={16} />
                          </div>
                        )}
                        <div className="eb-initbadge">{c.init}</div>
                        <div>
                          <div className="eb-name">
                            {c.nombre}
                            {c.id === MI_PJ && <span style={{ fontSize: 10, color: "var(--shard)" }}>TÚ</span>}
                            {c.tipo === "enemy" && c.revelado && esDM && <span className="eb-chip rev" style={{ marginLeft: 2 }}>visible</span>}
                            {down && <Skull className="eb-icon" style={{ width: 15, color: "var(--crim)" }} />}
                          </div>
                          <div className="eb-sub">{c.subt}</div>
                        </div>
                        <div className="eb-stats">
                          {!oculto && <div className="eb-stat eb-ac"><Shield />{c.ac}</div>}
                          {oculto ? (
                            <div className="eb-hidden">{ratio > 0.5 ? "Sano" : ratio > 0 ? "Herido" : "Caído"}</div>
                          ) : (
                            <div className="eb-stat eb-hp" style={{ color: hpColor(ratio) }}>
                              <Heart /><span className="v">{c.hp}</span><span style={{ color: "var(--mute)" }}>/{c.maxHp}</span>
                              {c.tempHp > 0 && <span className="eb-temp">+{c.tempHp}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      {!oculto && (
                        <div className="eb-hbar"><div className="eb-hfill" style={{ width: `${ratio * 100}%`, background: hpColor(ratio) }} /></div>
                      )}
                      {(c.cond.length > 0 || c.conc) && (
                        <div className="eb-chips">
                          {c.conc && <span className="eb-chip conc"><Sparkles size={9} style={{ verticalAlign: -1 }} /> Concentración</span>}
                          {c.cond.map(x => <span key={x} className="eb-chip">{x}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* panel detalle */}
          <div className="eb-panel eb-ornate">
            {!sel ? (
              <div className="eb-empty"><Swords /><div>{!esDM && !yaUnido ? "Únete al combate para ver el riel." : "Toca un combatiente para gestionarlo."}</div></div>
            ) : (!esDM && sel.tipo === "enemy") ? (
              !sel.revelado ? (
                <div className="eb-empty"><Lock /><div>El DM no ha revelado información de esta criatura.</div></div>
              ) : (
                <>
                  <div className="eb-ph"><div style={{ flex: 1 }}><h2>{sel.nombre}</h2><p>{sel.subt}</p></div><Info className="eb-icon" style={{ color: "var(--brass)" }} /></div>
                  <div className="eb-info">
                    <div className="eb-infobox"><div className="k">Clase de Armadura</div><div className="v">{sel.ac}</div></div>
                    <div className="eb-infobox"><div className="k">Puntos de Golpe</div><div className="v" style={{ color: hpColor(sel.hp / sel.maxHp) }}>{sel.hp}/{sel.maxHp}</div></div>
                  </div>
                  <p style={{ color: "var(--mute)", fontSize: 12, marginTop: 14 }}>El DM ha revelado esta criatura. Ataques y rasgos completos llegarán con el bestiario.</p>
                </>
              )
            ) : (() => {
              const puedoEditar = esDM || sel.id === MI_PJ;
              return (
                <>
                  <div className="eb-ph">
                    <div style={{ flex: 1 }}><h2>{sel.nombre}</h2><p>{sel.subt} · CA {sel.ac} · init {sel.init}</p></div>
                    {sel.conc && puedoEditar && <button className="eb-btn ghost" style={{ padding: "8px 10px" }} onClick={() => upd(sel.id, { conc: false })}><Sparkles className="eb-icon" style={{ color: "var(--shard)" }} /></button>}
                  </div>
                  <div className="eb-big"><span className="hp" style={{ color: hpColor(sel.hp / sel.maxHp) }}>{sel.hp}</span><span className="max">/ {sel.maxHp}{sel.tempHp > 0 ? `  (+${sel.tempHp} temp)` : ""}</span></div>
                  <div className="eb-hbar lg"><div className="eb-hfill" style={{ width: `${(sel.hp / sel.maxHp) * 100}%`, background: hpColor(sel.hp / sel.maxHp) }} /></div>
                  {puedoEditar && (
                    <>
                      <div className="eb-keys">
                        <button className="eb-key dmg" onClick={() => dano(sel.id, 1)}>−1</button>
                        <button className="eb-key dmg" onClick={() => dano(sel.id, 5)}>−5</button>
                        <button className="eb-key dmg" onClick={() => dano(sel.id, 10)}>−10</button>
                        <button className="eb-key heal" onClick={() => cura(sel.id, 1)}>+1</button>
                        <button className="eb-key heal" onClick={() => cura(sel.id, 5)}>+5</button>
                        <button className="eb-key heal" onClick={() => cura(sel.id, 10)}>+10</button>
                      </div>
                      <div className="eb-amt"><input type="number" inputMode="numeric" placeholder="cantidad…" value={monto} onChange={e => setMonto(e.target.value)} /></div>
                      <div className="eb-act">
                        <button className="eb-btn danger" onClick={() => aplicar(-1)}><Minus className="eb-icon" /> Daño</button>
                        <button className="eb-btn" style={{ borderColor: "#2e4a30", color: "#a7e0ad" }} onClick={() => aplicar(1)}><Plus className="eb-icon" /> Curar</button>
                      </div>
                    </>
                  )}
                  {sel.tipo === "pc" && sel.hp === 0 && (
                    <div className="eb-saves">
                      <Skull className="eb-icon" style={{ color: "var(--crim)" }} />
                      <div className="grp"><small>Éxitos</small><div className="eb-pips">
                        {[1, 2, 3].map(n => <span key={n} className={"eb-pip " + (sel.salv.ok >= n ? "ok" : "")}
                          onClick={() => puedoEditar && setSalv("ok", n)} style={{ cursor: puedoEditar ? "pointer" : "default" }} />)}
                      </div></div>
                      <div className="grp"><small>Fallos</small><div className="eb-pips">
                        {[1, 2, 3].map(n => <span key={n} className={"eb-pip " + (sel.salv.fail >= n ? "fail" : "")}
                          onClick={() => puedoEditar && setSalv("fail", n)} style={{ cursor: puedoEditar ? "pointer" : "default" }} />)}
                      </div></div>
                    </div>
                  )}
                  <div className="eb-block">
                    <h3>Condiciones {!puedoEditar && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--mute)", fontSize: 11 }}>(solo lectura)</span>}</h3>
                    <div className="eb-condgrid">
                      {CONDICIONES.map(c => (
                        <button key={c}
                          className={"eb-cond " + (sel.cond.includes(c) ? "on" : "")}
                          onClick={() => puedoEditar && toggleCond(c)}
                          style={{ cursor: puedoEditar ? "pointer" : "default", opacity: !puedoEditar && !sel.cond.includes(c) ? 0.4 : 1 }}>
                          {c}
                        </button>
                      ))}
                    </div>
                    {!puedoEditar && sel.cond.length === 0 && (
                      <p style={{ color: "var(--mute)", fontSize: 12, marginTop: 8 }}>Sin condiciones activas.</p>
                    )}
                  </div>
                  {sel.conc && !puedoEditar && (
                    <div className="eb-chips" style={{ marginTop: 10 }}>
                      <span className="eb-chip conc"><Sparkles size={9} style={{ verticalAlign: -1 }} /> Concentración</span>
                    </div>
                  )}
                  {esDM && sel.tipo === "enemy" && (
                    <div className="eb-removerow">
                      <button className="eb-btn ghost" onClick={() => upd(sel.id, { revelado: !sel.revelado })}>
                        {sel.revelado ? <EyeOff className="eb-icon" /> : <Eye className="eb-icon" />}
                        {sel.revelado ? "Ocultar a jugadores" : "Revelar a jugadores"}
                      </button>
                      <button className="eb-btn danger" onClick={() => eliminar(sel.id)}><X className="eb-icon" /> Quitar</button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── catálogo de criaturas ─── */}
      {catAbierto && (
        <div className="eb-overlay" onClick={() => setCatAbierto(false)}>
          <div className="eb-drawer" onClick={e => e.stopPropagation()}>
            <div className="eb-dhead">
              <Skull className="eb-icon" style={{ color: "var(--crim)" }} />
              <h2>Añadir criatura</h2>
              <button className="eb-btn ghost" style={{ marginLeft: "auto", padding: "8px 10px" }} onClick={() => setCatAbierto(false)}><X className="eb-icon" /></button>
            </div>
            <div className="eb-dtop">
              <div className="eb-gtabs">
                {Object.keys(CATALOGO).map(g => (
                  <button key={g}
                    className={"eb-gtab " + (grupoCat === g ? "on" : "") + (g !== "Eberron" ? " alt" : "")}
                    onClick={() => { setGrupoCat(g); setExpandido(null); setBusca(""); }}>
                    {g}
                  </button>
                ))}
              </div>
              <div className="eb-srch">
                <Search className="eb-icon" style={{ color: "var(--mute)" }} />
                <input placeholder="Buscar criatura…" value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
            </div>
            <div className="eb-dbody">
              <div className="eb-dlist">
                {Object.keys(lista).length === 0 && (
                  <div style={{ color: "var(--mute)", padding: "30px 0", textAlign: "center", fontSize: 13 }}>Sin resultados para «{busca}».</div>
                )}
                {Object.entries(lista).map(([fam, arr]) => (
                  <div key={fam}>
                    <div className="eb-fam">{fam}</div>
                    <div className="eb-catgrid">
                      {arr.map(c => {
                        const exp = expandido === c.nombre;
                        return (
                          <div key={c.nombre} className={"eb-mob" + (exp ? " exp" : "")}
                            onClick={() => setExpandido(exp ? null : c.nombre)}>
                            <div className="nm">{c.nombre}</div>
                            <div className="sb">{c.subt}</div>
                            <div className="mini">
                              <span>CA <b>{c.ac}</b></span>
                              <span><b>{c.hp}</b> PG</span>
                              <span>DEX <b>{fmt(c.dex)}</b></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="eb-ddetail">
                {!expandido ? (
                  <div className="empty"><Info size={36} /><span>Selecciona una criatura para ver su ficha.</span></div>
                ) : (() => {
                  const c = Object.values(CATALOGO[grupoCat]).flat().find(x => x.nombre === expandido);
                  if (!c) return null;
                  const q = cant[c.nombre] || 1;
                  const ri = rolledInit[c.nombre];
                  return (
                    <>
                      <div className="eb-imgslot">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="38" height="38">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                        <div className="lbl">Ilustración · próximamente</div>
                      </div>
                      <div className="eb-dinfo">
                        <div className="eb-dname">{c.nombre}</div>
                        <div className="eb-dsub">{c.subt}</div>
                        <div className="eb-statrow">
                          <div className="eb-statbox"><div className="k">Clase Armadura</div><div className="v">{c.ac}</div></div>
                          <div className="eb-statbox"><div className="k">Puntos Golpe</div><div className="v">{c.hp}</div></div>
                          <div className="eb-statbox"><div className="k">Mod. Destreza</div><div className="v">{fmt(c.dex)}</div></div>
                        </div>
                        <div className="eb-futura">
                          Ataques, rasgos, resistencias y habilidades especiales llegarán con el bestiario completo.
                          La ilustración y descripción de lore también se añadirán aquí.
                        </div>
                      </div>
                      <div className="eb-dfoot">
                        <div className="eb-initroller">
                          <div className="rlabel"><Dices size={13} /> Iniciativa de la criatura</div>
                          <div className="eb-rollrow">
                            <div className={"eb-die" + (ri ? " has" : "") + (ri?.anim ? " shaking" : "")}>
                              {ri ? (<><div className="face">{ri.dado}</div><div className="sub">d20</div></>) : <Dices size={22} style={{ opacity: .35 }} />}
                            </div>
                            <div className="eb-totalbox">
                              {ri ? (
                                <><div className="k">Total</div><div className="v">{ri.total}</div>
                                  <div className="breakdown">d20 ({ri.dado}) {c.dex >= 0 ? "+" : "−"} DEX ({Math.abs(c.dex)})</div></>
                              ) : (
                                <><div className="k">Resultado</div><div className="v" style={{ color: "var(--mute)", fontSize: 16 }}>—</div>
                                  <div className="breakdown">mod DEX {fmt(c.dex)}</div></>
                              )}
                            </div>
                            <button className="eb-rollbtn" onClick={() => tirarInit(c)}>
                              <RotateCcw size={14} /> {ri ? "Repetir" : "Tirar"}
                            </button>
                          </div>
                        </div>
                        <div className="eb-addrow">
                          <div className="eb-step">
                            <button onClick={() => setCant(s => ({ ...s, [c.nombre]: Math.max(1, q - 1) }))}>−</button>
                            <span className="q">{q}</span>
                            <button onClick={() => setCant(s => ({ ...s, [c.nombre]: q + 1 }))}>+</button>
                          </div>
                          <button className="eb-add" onClick={() => añadir(c)}>
                            <Plus size={18} /> Añadir{q > 1 ? ` ×${q}` : ""} al encuentro
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
