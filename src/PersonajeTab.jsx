import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, Check, Target, Dices, Heart, Shield } from "lucide-react";

const DAÑO_TIPOS = ["Contundente","Cortante","Perforante","Fuego","Frío","Rayo","Trueno","Veneno","Psíquico","Necrótico","Fuerza","Ninguno"];
const ICON_OPTS  = ["maza","espada","daga","arco","baston","hechizo","escudo","pocion","pergamino","herramienta","trampa","generico"];
const TIPO_LABEL = { arma_mele:"Melé", arma_distancia:"Distancia", hechizo:"Hechizo", habilidad:"Habilidad" };

export const PERSONAJES_INICIAL = [
  { id:"vol", nombre:"Vol", clase:"Artífice · Herrero de Batalla", raza:"Forjado", nivel:5, color:"#d4af37",
    arsenal:[
      { id:"a1", nombre:"Mazo de Adamantina",  tipo:"arma_mele",      icono:"maza",        dadoAtaque:"1d20", bonoAtaque:"+6", dadoDano:"1d8", bonoDano:"+4", tipoDano:"Contundente", alcance:"5 ft",     descripcion:"Forjado en el antebrazo. Imposible de desarmar.", especial:"Infundido: +1d4 trueno 1/turno" },
      { id:"a2", nombre:"Cañón de Trueno",     tipo:"arma_distancia", icono:"herramienta",  dadoAtaque:"1d20", bonoAtaque:"+4", dadoDano:"2d6", bonoDano:"+4", tipoDano:"Trueno",       alcance:"60 ft",    descripcion:"Integrado en el pecho. Recarga con célula.",   especial:"1 uso / descanso corto sin célula" },
      { id:"a3", nombre:"Guardián Defensivo",  tipo:"habilidad",      icono:"escudo",       dadoAtaque:"—",    bonoAtaque:"—",  dadoDano:"—",   bonoDano:"—",  tipoDano:"Ninguno",      alcance:"Personal", descripcion:"Acción bonus: +2 CA hasta siguiente turno.", especial:"Solo en Modo Guardián" },
    ],
    inventario:[
      { id:"i1", nombre:"Aceite de Forjado",  icono:"herramienta", cantidad:2,  descripcion:"Restaura 1d6+2 PG. Solo constructos.", efecto:{ tipo:"curacion", dado:"1d6", bono:2, objetivo:"constructo" } },
      { id:"i2", nombre:"Célula de Energía",  icono:"hechizo",     cantidad:3,  descripcion:"Recarga el Cañón de Trueno.",          efecto:{ tipo:"recarga",  dado:"—",   bono:0, objetivo:"propio" } },
    ],
  },
  { id:"sehra", nombre:"Sehra", clase:"Pícaro · Ladrón", raza:"Cambiante", nivel:5, color:"#3fd0c9",
    arsenal:[
      { id:"a1", nombre:"Daga del Caos",       tipo:"arma_mele",      icono:"daga",   dadoAtaque:"1d20", bonoAtaque:"+7", dadoDano:"1d4", bonoDano:"+5", tipoDano:"Perforante", alcance:"5/20 ft",   descripcion:"Reliquia de Xoriat.",                    especial:"+1d4 daño psíquico al impactar" },
      { id:"a2", nombre:"Ballesta de Mano",    tipo:"arma_distancia", icono:"arco",   dadoAtaque:"1d20", bonoAtaque:"+7", dadoDano:"1d6", bonoDano:"+5", tipoDano:"Perforante", alcance:"30/120 ft", descripcion:"Casa Thuranni. Casi silenciosa.",         especial:"" },
      { id:"a3", nombre:"Ataque Furtivo",      tipo:"habilidad",      icono:"hechizo",dadoAtaque:"—",    bonoAtaque:"—",  dadoDano:"3d6", bonoDano:"—",  tipoDano:"Como arma",  alcance:"Como arma", descripcion:"Ventaja o aliado adyacente al objetivo.", especial:"Una vez por turno" },
    ],
    inventario:[
      { id:"i1", nombre:"Poción de Curación", icono:"pocion", cantidad:2, descripcion:"Recupera 2d4+2 PG.", efecto:{ tipo:"curacion", dado:"2d4", bono:2, objetivo:"cualquiera" } },
      { id:"i2", nombre:"Veneno de Araña",    icono:"pocion", cantidad:1, descripcion:"+2d6 veneno al siguiente impacto.", efecto:{ tipo:"veneno", dado:"2d6", bono:0, objetivo:"arma" } },
    ],
  },
  { id:"tobi", nombre:"Tobias Vance", clase:"Mago · Adivinación", raza:"Humano de Breland", nivel:5, color:"#9b7fe8",
    arsenal:[
      { id:"a1", nombre:"Bastón de Sharn",   tipo:"arma_mele", icono:"baston",   dadoAtaque:"1d20", bonoAtaque:"+3", dadoDano:"1d6", bonoDano:"+3", tipoDano:"Contundente", alcance:"5 ft",   descripcion:"Foco arcano de cristal de Siberys.", especial:"+1 al CD de conjuros" },
      { id:"a2", nombre:"Proyectil Mágico",  tipo:"hechizo",   icono:"hechizo",  dadoAtaque:"—",    bonoAtaque:"Auto",dadoDano:"3d4", bonoDano:"+3", tipoDano:"Fuerza",       alcance:"120 ft", descripcion:"Tres dardos garantizados.",          especial:"+1 dardo por nivel extra" },
      { id:"a3", nombre:"Bola de Fuego",     tipo:"hechizo",   icono:"hechizo",  dadoAtaque:"—",    bonoAtaque:"CD14",dadoDano:"8d6", bonoDano:"—",  tipoDano:"Fuego",        alcance:"150 ft", descripcion:"20 ft radio. Mitad si supera salvación.", especial:"+1d6 por nivel extra" },
    ],
    inventario:[
      { id:"i1", nombre:"Pergamino de Invisibilidad", icono:"pergamino",   cantidad:1,  descripcion:"Sin gastar espacio. Se destruye.", efecto:{ tipo:"buff", dado:"—", bono:0, objetivo:"cualquiera" } },
      { id:"i2", nombre:"Componentes de conjuro",     icono:"herramienta", cantidad:99, descripcion:"Nivel 1–5.",                        efecto:{ tipo:"misc", dado:"—", bono:0, objetivo:"propio" } },
    ],
  },
  { id:"pell", nombre:"Pell", clase:"Explorador · Acechador del Abismo", raza:"Mediano de Talenta", nivel:5, color:"#5fbf6f",
    arsenal:[
      { id:"a1", nombre:"Hacha de Mano",      tipo:"arma_mele",      icono:"espada",  dadoAtaque:"1d20", bonoAtaque:"+6", dadoDano:"1d6", bonoDano:"+4", tipoDano:"Cortante",   alcance:"5/20 ft",    descripcion:"Ligera y lanzable.",           especial:"" },
      { id:"a2", nombre:"Arco Largo Valenar", tipo:"arma_distancia", icono:"arco",    dadoAtaque:"1d20", bonoAtaque:"+7", dadoDano:"1d8", bonoDano:"+4", tipoDano:"Perforante", alcance:"150/600 ft", descripcion:"Madera feérica de Valle.",     especial:"Marca del Cazador: +1d6" },
      { id:"a3", nombre:"Marca del Cazador",  tipo:"habilidad",      icono:"hechizo", dadoAtaque:"—",    bonoAtaque:"—",  dadoDano:"1d6", bonoDano:"—",  tipoDano:"Como arma",  alcance:"Cualquiera", descripcion:"Concentración. Daño extra al marcado.", especial:"Libre 1/turno" },
    ],
    inventario:[
      { id:"i1", nombre:"Poción de Curación", icono:"pocion", cantidad:2,  descripcion:"Recupera 2d4+2 PG.", efecto:{ tipo:"curacion", dado:"2d4", bono:2, objetivo:"cualquiera" } },
      { id:"i2", nombre:"Trampa de Acero",    icono:"trampa", cantidad:1,  descripcion:"1d4 + inmoviliza.",  efecto:{ tipo:"trampa",   dado:"1d4", bono:0, objetivo:"zona" } },
      { id:"i3", nombre:"Flechas de Khyber",  icono:"arco",   cantidad:20, descripcion:"+1 daño necrótico.", efecto:{ tipo:"daño",     dado:"—",   bono:1, objetivo:"enemigo" } },
    ],
  },
];

// ── Eberron SVG icons ──────────────────────────────────────────────────────────
export function EbIcon({ tipo, size=28, color="currentColor" }) {
  const s={width:size,height:size,display:"block",flexShrink:0};
  const p={fill:"none",stroke:color,strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"};
  if(tipo==="maza")       return <svg viewBox="0 0 24 24" style={s}><polygon {...p} points="12,3 16,5.5 18,9 16,12.5 12,15 8,12.5 6,9 8,5.5"/><line {...p} x1="12" y1="15" x2="12" y2="22"/><polygon fill={color} fillOpacity=".4" stroke="none" points="12,7 13.5,9 12,11 10.5,9"/></svg>;
  if(tipo==="espada")     return <svg viewBox="0 0 24 24" style={s}><path {...p} d="M12 2 L13.5 16 L12 18 L10.5 16 Z"/><line {...p} x1="7" y1="16" x2="17" y2="16" strokeWidth="2"/><line {...p} x1="12" y1="18" x2="12" y2="22"/><circle fill={color} stroke="none" cx="12" cy="22" r="1.5"/></svg>;
  if(tipo==="daga")       return <svg viewBox="0 0 24 24" style={s}><path {...p} d="M12 3 L14 14 L12 16 L10 14 Z"/><line {...p} x1="9" y1="16" x2="15" y2="16"/><line {...p} x1="12" y1="16" x2="12" y2="21" strokeWidth="2"/></svg>;
  if(tipo==="arco")       return <svg viewBox="0 0 24 24" style={s}><path {...p} d="M8 3 C4 8 4 16 8 21"/><line {...p} x1="8" y1="3" x2="8" y2="21" strokeDasharray="2 2" strokeWidth="1"/><line {...p} x1="8" y1="12" x2="20" y2="12"/><path {...p} d="M17 9.5 L20 12 L17 14.5"/></svg>;
  if(tipo==="baston")     return <svg viewBox="0 0 24 24" style={s}><line {...p} x1="12" y1="22" x2="12" y2="8" strokeWidth="2"/><path {...p} d="M12 2 L15.5 6.5 L12 11 L8.5 6.5 Z"/></svg>;
  if(tipo==="hechizo")    return <svg viewBox="0 0 24 24" style={s}><path {...p} d="M12 6 L15 12 L12 18 L9 12 Z"/><line {...p} x1="12" y1="1" x2="12" y2="5"/><line {...p} x1="12" y1="19" x2="12" y2="23"/><line {...p} x1="3.5" y1="7.5" x2="8" y2="10"/><line {...p} x1="16" y1="14" x2="20.5" y2="16.5"/><line {...p} x1="3.5" y1="16.5" x2="8" y2="14"/><line {...p} x1="16" y1="10" x2="20.5" y2="7.5"/></svg>;
  if(tipo==="escudo")     return <svg viewBox="0 0 24 24" style={s}><path {...p} d="M12 2 L20 6 L20 14 L12 22 L4 14 L4 6 Z"/><line {...p} x1="6" y1="10" x2="18" y2="10" strokeOpacity=".5"/><circle {...p} cx="12" cy="14" r="2.5"/></svg>;
  if(tipo==="pocion")     return <svg viewBox="0 0 24 24" style={s}><path {...p} d="M9 10 C6 10 5 13.5 5 16 C5 20 8 22 12 22 C16 22 19 20 19 16 C19 13.5 18 10 15 10 Z"/><rect {...p} x="9" y="6" width="6" height="4"/><rect {...p} x="10" y="3" width="4" height="3" rx="1"/></svg>;
  if(tipo==="pergamino")  return <svg viewBox="0 0 24 24" style={s}><rect {...p} x="5" y="5" width="14" height="14" rx="1"/><path {...p} d="M5 7 C3 7 3 5 5 5"/><path {...p} d="M19 7 C21 7 21 5 19 5"/><path {...p} d="M5 17 C3 17 3 19 5 19"/><path {...p} d="M19 17 C21 17 21 19 19 19"/><line {...p} x1="8" y1="10" x2="16" y2="10" strokeWidth="1" strokeOpacity=".5"/><line {...p} x1="8" y1="13" x2="16" y2="13" strokeWidth="1" strokeOpacity=".5"/></svg>;
  if(tipo==="herramienta")return <svg viewBox="0 0 24 24" style={s}><circle {...p} cx="12" cy="12" r="4"/><rect {...p} x="11" y="2" width="2" height="3" rx=".5"/><rect {...p} x="11" y="19" width="2" height="3" rx=".5"/><rect {...p} x="2" y="11" width="3" height="2" rx=".5"/><rect {...p} x="19" y="11" width="3" height="2" rx=".5"/><line {...p} x1="5.6" y1="5.6" x2="7.8" y2="7.8"/><line {...p} x1="16.2" y1="16.2" x2="18.4" y2="18.4"/><line {...p} x1="5.6" y1="18.4" x2="7.8" y2="16.2"/><line {...p} x1="16.2" y1="7.8" x2="18.4" y2="5.6"/></svg>;
  if(tipo==="trampa")     return <svg viewBox="0 0 24 24" style={s}><path {...p} d="M3 17 C3 12 7 8 12 8 C17 8 21 12 21 17"/><path {...p} d="M6 17 L6 14 L8 12 L10 14 L10 17"/><path {...p} d="M14 17 L14 14 L16 12 L18 14 L18 17"/><circle {...p} cx="12" cy="17" r="2"/></svg>;
  return <svg viewBox="0 0 24 24" style={s}><circle {...p} cx="12" cy="12" r="9"/><line {...p} x1="12" y1="8" x2="12" y2="16"/><line {...p} x1="8" y1="12" x2="16" y2="12"/></svg>;
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const PCSS = `
:root{ --brass-dim:rgba(212,175,55,.4); --shard-dim:rgba(63,208,201,.4); --good:#5fbf6f; }
.pt-header{ display:flex; align-items:center; gap:14px; padding:18px 20px; border-radius:14px; margin-bottom:14px; position:relative; overflow:hidden; border:1px solid var(--line); }
.pt-header::before{ content:""; position:absolute; inset:0; background:var(--hc,#d4af37); opacity:.1; }
.pt-avatar{ width:56px; height:56px; border-radius:50%; border:3px solid; display:grid; place-items:center; font-family:'Cinzel',serif; font-weight:900; font-size:20px; flex:none; z-index:1; }
.pt-hinfo{ z-index:1; } .pt-hname{ font-family:'Cinzel',serif; font-weight:700; font-size:22px; line-height:1; } .pt-hsub{ font-size:12px; color:var(--mute); margin-top:3px; }
.pt-hlevel{ margin-left:auto; font-family:'Cinzel',serif; font-size:28px; font-weight:900; z-index:1; opacity:.6; }
.pt-stabs{ display:flex; gap:2px; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:3px; margin-bottom:16px; }
.pt-stab{ flex:1; font-family:'Oswald',sans-serif; text-transform:uppercase; letter-spacing:.06em; font-weight:600; font-size:12px; padding:9px 0; border-radius:8px; border:none; background:transparent; color:var(--mute); cursor:pointer; transition:background .15s,color .15s; min-height:38px; }
.pt-stab.on{ background:var(--card); color:var(--ink); }
.pt-g2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; } @media(max-width:640px){ .pt-g2{ grid-template-columns:1fr; } }
.pt-wcard{ background:var(--card); border:1px solid var(--line); border-radius:12px; overflow:hidden; transition:border-color .15s; animation:fadeUp .2s ease; } .pt-wcard:hover{ border-color:var(--brass-dim); }
.pt-wtop{ display:flex; gap:12px; padding:12px; }
.pt-wibox{ width:64px; height:64px; border-radius:10px; border:1px solid var(--line); display:grid; place-items:center; flex:none; background:var(--bg); }
.pt-winfo{ flex:1; min-width:0; } .pt-wname{ font-family:'Cinzel',serif; font-weight:700; font-size:15px; margin:0 0 4px; line-height:1.2; }
.pt-badge{ display:inline-block; font-size:9px; text-transform:uppercase; letter-spacing:.06em; padding:2px 8px; border-radius:10px; margin-bottom:6px; }
.pt-badge.arma_mele{ background:#2a1f15; border:1px solid #7a4f28; color:#d4904c; } .pt-badge.arma_distancia{ background:#1a2a20; border:1px solid #2a7a48; color:#5fbf6f; }
.pt-badge.hechizo{ background:#1e1a2a; border:1px solid #5a3a7a; color:#9b7fe8; } .pt-badge.habilidad{ background:#1a2a2e; border:1px solid #2a6a7a; color:#3fd0c9; }
.pt-drow{ display:flex; gap:12px; flex-wrap:wrap; }
.pt-dc .k{ font-size:9px; color:var(--mute); text-transform:uppercase; letter-spacing:.08em; display:block; font-family:'Oswald',sans-serif; } .pt-dc .v{ font-family:'Space Mono',monospace; font-size:12px; color:var(--ink); font-weight:700; }
.pt-wdesc{ font-size:11px; color:var(--mute); padding:0 12px 8px; line-height:1.5; } .pt-wspec{ font-size:10px; color:var(--shard); padding:0 12px 8px; font-style:italic; }
.pt-wact{ display:flex; gap:6px; padding:8px 12px; border-top:1px solid var(--line); flex-wrap:wrap; }
.pt-btn{ font-family:'Oswald',sans-serif; text-transform:uppercase; letter-spacing:.05em; font-weight:600; font-size:11px; padding:7px 11px; border-radius:8px; border:1px solid var(--line); background:transparent; color:var(--mute); cursor:pointer; display:flex; align-items:center; gap:5px; transition:border-color .12s,color .12s; min-height:32px; }
.pt-btn:hover{ border-color:var(--brass-dim); color:var(--ink); } .pt-btn.atk{ border-color:#4a2b28; color:#f2a59c; } .pt-btn.atk:hover{ background:#3a201d; }
.pt-btn.use{ border-color:var(--shard-dim); color:var(--shard); } .pt-btn.use:hover{ background:#1d2b2a; } .pt-btn.del{ color:var(--crim); } .pt-btn.save{ border-color:var(--shard-dim); color:var(--shard); }
.pt-addbtn{ width:100%; font-family:'Oswald',sans-serif; text-transform:uppercase; letter-spacing:.06em; font-weight:600; font-size:13px; padding:12px; border-radius:10px; border:2px dashed var(--line); background:transparent; color:var(--mute); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:border-color .15s,color .15s; min-height:48px; margin-top:12px; }
.pt-addbtn:hover{ border-color:var(--brass-dim); color:var(--ink); }
.pt-icard{ background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px; display:flex; gap:12px; align-items:center; transition:border-color .15s; animation:fadeUp .2s ease; } .pt-icard:hover{ border-color:var(--brass-dim); }
.pt-iibox{ width:52px; height:52px; border-radius:9px; border:1px solid var(--line); display:grid; place-items:center; flex:none; background:var(--bg); position:relative; }
.pt-qty{ position:absolute; top:-7px; right:-7px; width:20px; height:20px; border-radius:50%; background:var(--brass); color:#1a1810; font-family:'Oswald',sans-serif; font-weight:700; font-size:11px; display:grid; place-items:center; border:2px solid var(--bg); }
.pt-iinfo{ flex:1; min-width:0; } .pt-iname{ font-family:'Oswald',sans-serif; font-weight:600; font-size:14px; } .pt-idesc{ font-size:11px; color:var(--mute); margin-top:2px; line-height:1.4; }
.pt-ibts{ display:flex; flex-direction:column; gap:5px; }
.pt-modal{ position:fixed; inset:0; background:rgba(8,9,12,.82); backdrop-filter:blur(5px); z-index:70; display:flex; align-items:flex-end; justify-content:center; }
@media(min-width:600px){ .pt-modal{ align-items:center; padding:20px; } }
.pt-mbox{ background:var(--bg2); border:1px solid var(--line); border-radius:16px 16px 0 0; width:100%; max-width:560px; max-height:92vh; overflow-y:auto; padding:22px; animation:fadeUp .2s ease; }
@media(min-width:600px){ .pt-mbox{ border-radius:16px; } }
.pt-mbox h2{ font-family:'Cinzel',serif; font-weight:700; font-size:18px; margin:0 0 18px; }
.pt-field{ margin-bottom:14px; } .pt-field label{ display:block; font-size:9px; text-transform:uppercase; letter-spacing:.12em; color:var(--mute); font-family:'Oswald',sans-serif; margin-bottom:5px; }
.pt-field input,.pt-field select,.pt-field textarea{ width:100%; background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:10px 12px; color:var(--ink); font-size:14px; outline:none; transition:border-color .15s; font-family:'Inter',system-ui,sans-serif; }
.pt-field input:focus,.pt-field select:focus,.pt-field textarea:focus{ border-color:var(--brass-dim); } .pt-field textarea{ resize:vertical; min-height:68px; } .pt-field select option{ background:var(--bg2); }
.pt-r2{ display:grid; grid-template-columns:1fr 1fr; gap:10px; } .pt-r3{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
.pt-igrid{ display:grid; grid-template-columns:repeat(6,1fr); gap:6px; margin-top:4px; }
.pt-iopt{ aspect-ratio:1; border-radius:8px; border:2px solid var(--line); background:var(--bg); display:grid; place-items:center; cursor:pointer; transition:border-color .12s; } .pt-iopt:hover{ border-color:var(--brass-dim); } .pt-iopt.sel{ border-color:var(--brass); background:#1e1a12; }
.pt-mfooter{ display:flex; gap:8px; margin-top:18px; } .pt-mfooter .pt-btn{ flex:1; justify-content:center; font-size:13px; min-height:44px; padding:12px; }
.pt-tlist{ display:flex; flex-direction:column; gap:6px; margin:10px 0; }
.pt-target{ padding:10px 14px; border-radius:9px; border:1px solid var(--line); background:var(--card); cursor:pointer; display:flex; align-items:center; gap:10px; transition:border-color .15s; } .pt-target:hover{ border-color:var(--shard-dim); }
.pt-roll{ text-align:center; padding:16px; background:var(--bg); border-radius:10px; border:1px solid var(--line); margin:12px 0; }
.pt-roll .rv{ font-family:'Cinzel',serif; font-weight:900; font-size:46px; line-height:1; } .pt-roll .rv.atk{ color:var(--brass); } .pt-roll .rv.dmg{ color:var(--crim); } .pt-roll .rs{ font-size:12px; color:var(--mute); margin-top:4px; }
.pt-r2rolls{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:12px 0; }
.pt-dmgrid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; } @media(max-width:640px){ .pt-dmgrid{ grid-template-columns:1fr; } }
.pt-dmcard{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:16px; cursor:pointer; transition:border-color .15s; animation:fadeUp .25s ease; } .pt-dmcard:hover{ border-color:var(--brass-dim); } .pt-dmcard.open{ border-color:var(--brass); }
.pt-dmhead{ display:flex; align-items:center; gap:12px; } .pt-dmav{ width:44px; height:44px; border-radius:50%; border:2px solid; display:grid; place-items:center; font-family:'Cinzel',serif; font-weight:900; font-size:16px; flex:none; }
.pt-dmname{ font-family:'Cinzel',serif; font-weight:700; font-size:16px; } .pt-dmsub{ font-size:11px; color:var(--mute); margin-top:1px; } .pt-dmhp{ margin-left:auto; font-family:'Space Mono',monospace; font-size:13px; text-align:right; }
.pt-dmbar{ height:5px; border-radius:3px; background:var(--bg); overflow:hidden; margin-top:8px; } .pt-dmfill{ height:100%; border-radius:3px; transition:width .3s; }
.pt-dmweps{ display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; } .pt-dmw{ font-size:10px; text-transform:uppercase; letter-spacing:.04em; padding:3px 8px; border-radius:6px; background:var(--bg); border:1px solid var(--line); color:var(--mute); display:flex; align-items:center; gap:4px; }
.pt-dmdetail{ margin-top:14px; border-top:1px solid var(--line); padding-top:14px; animation:fadeUp .2s ease; }
.pt-dmrow{ display:flex; gap:10px; align-items:center; margin-bottom:7px; background:var(--bg); border-radius:9px; padding:8px 10px; }
.pt-sec{ font-family:'Oswald',sans-serif; text-transform:uppercase; letter-spacing:.08em; font-size:11px; color:var(--mute); margin:12px 0 8px; }
`;

// ── helpers ────────────────────────────────────────────────────────────────────
const hpColor = (r) => r > 0.5 ? "var(--good)" : r > 0.25 ? "var(--brass)" : "var(--crim)";
const rollDice = (f) => { if(!f||f==="—") return 0; const m=f.match(/^(\d+)d(\d+)$/); if(!m) return 0; let t=0; for(let i=0;i<+m[1];i++) t+=Math.floor(Math.random()*+m[2])+1; return t; };
const d20 = () => Math.floor(Math.random()*20)+1;
const ini = (n) => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const fb  = (b) => { const n=parseInt(b); return isNaN(n)?b:(n>=0?"+"+n:""+n); };

// ── Modals ─────────────────────────────────────────────────────────────────────
const EA = { nombre:"", tipo:"arma_mele", icono:"espada", dadoAtaque:"1d20", bonoAtaque:"+0", dadoDano:"1d6", bonoDano:"+0", tipoDano:"Cortante", alcance:"5 ft", descripcion:"", especial:"" };
const EI = { nombre:"", icono:"generico", cantidad:1, descripcion:"", efecto:{ tipo:"curacion", dado:"1d4", bono:0, objetivo:"cualquiera" } };

function ArmaModal({ item, onSave, onClose }) {
  const [f, setF] = useState(item ? {...item} : {...EA});
  const s = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div className="pt-modal" onClick={onClose}>
      <div className="pt-mbox" onClick={e=>e.stopPropagation()}>
        <h2>{item?"Editar":"Nueva"} entrada de arsenal</h2>
        <div className="pt-field"><label>Nombre</label><input value={f.nombre} onChange={e=>s("nombre",e.target.value)} placeholder="Arma, hechizo o habilidad…"/></div>
        <div className="pt-r2">
          <div className="pt-field"><label>Tipo</label>
            <select value={f.tipo} onChange={e=>s("tipo",e.target.value)}>
              <option value="arma_mele">Arma melé</option><option value="arma_distancia">Arma distancia</option>
              <option value="hechizo">Hechizo</option><option value="habilidad">Habilidad</option>
            </select>
          </div>
          <div className="pt-field"><label>Alcance / CD</label><input value={f.alcance} onChange={e=>s("alcance",e.target.value)} placeholder="5 ft · CD14…"/></div>
        </div>
        <div className="pt-r3">
          <div className="pt-field"><label>Dado ataque</label><input value={f.dadoAtaque} onChange={e=>s("dadoAtaque",e.target.value)}/></div>
          <div className="pt-field"><label>Bono ataque</label><input value={f.bonoAtaque} onChange={e=>s("bonoAtaque",e.target.value)}/></div>
          <div className="pt-field"><label>Dado daño</label><input value={f.dadoDano} onChange={e=>s("dadoDano",e.target.value)}/></div>
        </div>
        <div className="pt-r2">
          <div className="pt-field"><label>Bono daño</label><input value={f.bonoDano} onChange={e=>s("bonoDano",e.target.value)}/></div>
          <div className="pt-field"><label>Tipo daño</label>
            <select value={f.tipoDano} onChange={e=>s("tipoDano",e.target.value)}>{DAÑO_TIPOS.map(t=><option key={t}>{t}</option>)}</select>
          </div>
        </div>
        <div className="pt-field"><label>Descripción</label><textarea value={f.descripcion} onChange={e=>s("descripcion",e.target.value)}/></div>
        <div className="pt-field"><label>Habilidad especial</label><input value={f.especial} onChange={e=>s("especial",e.target.value)}/></div>
        <div className="pt-field"><label>Icono Eberron</label>
          <div className="pt-igrid">{ICON_OPTS.map(ico=><div key={ico} className={"pt-iopt"+(f.icono===ico?" sel":"")} onClick={()=>s("icono",ico)} title={ico}><EbIcon tipo={ico} size={20} color={f.icono===ico?"var(--brass)":"var(--mute)"}/></div>)}</div>
        </div>
        <div className="pt-mfooter">
          <button className="pt-btn" onClick={onClose}><X size={14}/> Cancelar</button>
          <button className="pt-btn save" onClick={()=>{if(f.nombre.trim())onSave(f);}}><Check size={14}/> Guardar</button>
        </div>
      </div>
    </div>
  );
}

function ItemModal({ item, onSave, onClose }) {
  const [f, setF] = useState(item ? {...item} : {...EI});
  const s = (k,v) => setF(p=>({...p,[k]:v}));
  const se = (k,v) => setF(p=>({...p,efecto:{...p.efecto,[k]:v}}));
  return (
    <div className="pt-modal" onClick={onClose}>
      <div className="pt-mbox" onClick={e=>e.stopPropagation()}>
        <h2>{item?"Editar":"Nuevo"} objeto</h2>
        <div className="pt-field"><label>Nombre</label><input value={f.nombre} onChange={e=>s("nombre",e.target.value)} placeholder="Nombre del objeto…"/></div>
        <div className="pt-r2">
          <div className="pt-field"><label>Cantidad</label><input type="number" min={1} value={f.cantidad} onChange={e=>s("cantidad",Math.max(1,parseInt(e.target.value)||1))}/></div>
          <div className="pt-field"><label>Tipo efecto</label>
            <select value={f.efecto.tipo} onChange={e=>se("tipo",e.target.value)}>
              <option value="curacion">Curación</option><option value="daño">Daño</option><option value="buff">Buff</option>
              <option value="veneno">Veneno</option><option value="recarga">Recarga</option><option value="trampa">Trampa</option><option value="misc">Misc</option>
            </select>
          </div>
        </div>
        <div className="pt-field"><label>Descripción</label><textarea value={f.descripcion} onChange={e=>s("descripcion",e.target.value)}/></div>
        <div className="pt-r3">
          <div className="pt-field"><label>Dado efecto</label><input value={f.efecto.dado} onChange={e=>se("dado",e.target.value)} placeholder="2d4 · —"/></div>
          <div className="pt-field"><label>Bono</label><input type="number" value={f.efecto.bono} onChange={e=>se("bono",parseInt(e.target.value)||0)}/></div>
          <div className="pt-field"><label>Objetivo</label>
            <select value={f.efecto.objetivo} onChange={e=>se("objetivo",e.target.value)}>
              <option value="propio">Solo yo</option><option value="cualquiera">Cualquier aliado</option>
              <option value="constructo">Solo constructos</option><option value="enemigo">Enemigo</option>
              <option value="zona">Zona</option><option value="arma">Arma</option>
            </select>
          </div>
        </div>
        <div className="pt-field"><label>Icono Eberron</label>
          <div className="pt-igrid">{ICON_OPTS.map(ico=><div key={ico} className={"pt-iopt"+(f.icono===ico?" sel":"")} onClick={()=>s("icono",ico)} title={ico}><EbIcon tipo={ico} size={18} color={f.icono===ico?"var(--brass)":"var(--mute)"}/></div>)}</div>
        </div>
        <div className="pt-mfooter">
          <button className="pt-btn" onClick={onClose}><X size={14}/> Cancelar</button>
          <button className="pt-btn save" onClick={()=>{if(f.nombre.trim())onSave(f);}}><Check size={14}/> Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function PersonajeTab({ personajes, setPersonajes, combatientes=[], rol, miPjId, onUsoObjeto }) {
  const [stab, setStab]           = useState("arsenal");
  const [showArma, setShowArma]   = useState(false);
  const [editArma, setEditArma]   = useState(null);
  const [showItem, setShowItem]   = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [dmOpen, setDmOpen]       = useState(null);
  const [usandoItem, setUsandoItem] = useState(null);
  const [rollRes, setRollRes]     = useState(null);
  const [atqRes, setAtqRes]       = useState(null);

  const esDM = rol === "dm";
  const mipj = personajes.find(p => p.id === miPjId);

  const updPj = (id, fn) => setPersonajes(ps => ps.map(p => p.id===id ? fn(p) : p));

  const saveArma = (pjId, arma) => {
    updPj(pjId, p => { const ex=p.arsenal.find(a=>a.id===arma.id); return {...p, arsenal: ex?p.arsenal.map(a=>a.id===arma.id?arma:a):[...p.arsenal,{...arma,id:"a"+Date.now()}]}; });
    setShowArma(false); setEditArma(null);
  };
  const saveItem = (pjId, item) => {
    updPj(pjId, p => { const ex=p.inventario.find(i=>i.id===item.id); return {...p, inventario: ex?p.inventario.map(i=>i.id===item.id?item:i):[...p.inventario,{...item,id:"i"+Date.now()}]}; });
    setShowItem(false); setEditItem(null);
  };
  const confirmarUso = (item, toId) => {
    const dado=rollDice(item.efecto.dado); const total=dado+(item.efecto.bono||0);
    setRollRes({ item, toId, dado, total }); setUsandoItem(null);
  };
  const enviarUso = () => {
    if(!rollRes) return;
    updPj(miPjId, p=>({...p, inventario:p.inventario.map(i=>i.id===rollRes.item.id?{...i,cantidad:i.cantidad-1}:i).filter(i=>i.cantidad>0)}));
    if(onUsoObjeto) onUsoObjeto(miPjId, rollRes.toId, rollRes.item, rollRes.total);
    setRollRes(null);
  };
  const lanzarAtaque = (arma) => {
    setAtqRes({ arma, atk:d20()+(parseInt(arma.bonoAtaque)||0), dmg:rollDice(arma.dadoDano)+(parseInt(arma.bonoDano)||0) });
  };

  // ── DM view ────────────────────────────────────────────────────────────────
  if (esDM) return (
    <div>
      <style>{PCSS}</style>
      <div style={{ fontFamily:"'Cinzel',serif", fontSize:20, fontWeight:700, marginBottom:4 }}>Fichas del Grupo</div>
      <div style={{ fontSize:12, color:"var(--mute)", marginBottom:16 }}>Toca una ficha para ver arsenal e inventario.</div>
      <div className="pt-dmgrid">
        {personajes.map(pj=>{
          const cbt=combatientes.find(c=>c.id===pj.id); const hp=cbt?.hp??20; const maxHp=cbt?.maxHp??20; const ratio=maxHp?hp/maxHp:1; const col=pj.color||"#d4af37"; const isOpen=dmOpen===pj.id;
          return (
            <div key={pj.id} className={"pt-dmcard"+(isOpen?" open":"")} onClick={()=>setDmOpen(isOpen?null:pj.id)}>
              <div className="pt-dmhead">
                <div className="pt-dmav" style={{borderColor:col,background:col+"22",color:col}}>{ini(pj.nombre)}</div>
                <div><div className="pt-dmname">{pj.nombre}</div><div className="pt-dmsub">{pj.raza} · Nv{pj.nivel}</div></div>
                <div className="pt-dmhp" style={{color:hpColor(ratio)}}>{hp}/{maxHp} <Heart size={11} style={{verticalAlign:-1}}/></div>
              </div>
              <div className="pt-dmbar"><div className="pt-dmfill" style={{width:`${ratio*100}%`,background:hpColor(ratio)}}/></div>
              <div className="pt-dmweps">{pj.arsenal.map(a=><div key={a.id} className="pt-dmw"><EbIcon tipo={a.icono} size={12} color="var(--mute)"/>{a.nombre}</div>)}</div>
              {isOpen && (
                <div className="pt-dmdetail" onClick={e=>e.stopPropagation()}>
                  <div className="pt-sec">Arsenal</div>
                  {pj.arsenal.map(a=><div key={a.id} className="pt-dmrow"><EbIcon tipo={a.icono} size={22} color={col}/><div style={{flex:1}}><div style={{fontFamily:"'Oswald'",fontWeight:600,fontSize:13}}>{a.nombre}</div><div style={{fontSize:11,color:"var(--mute)"}}>{a.dadoDano}{fb(a.bonoDano)} {a.tipoDano} · {a.alcance}</div></div>{a.especial&&<div style={{fontSize:10,color:"var(--shard)",fontStyle:"italic",maxWidth:110,textAlign:"right"}}>{a.especial}</div>}</div>)}
                  <div className="pt-sec">Inventario</div>
                  {pj.inventario.map(i=><div key={i.id} className="pt-dmrow"><EbIcon tipo={i.icono} size={18} color={col}/><div style={{flex:1}}><div style={{fontFamily:"'Oswald'",fontWeight:600,fontSize:13}}>{i.nombre}</div><div style={{fontSize:11,color:"var(--mute)"}}>{i.descripcion}</div></div><div style={{fontFamily:"'Space Mono'",fontSize:13,color:"var(--brass)"}}>×{i.cantidad}</div></div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Player view ────────────────────────────────────────────────────────────
  if (!mipj) return <div style={{color:"var(--mute)",padding:40,textAlign:"center"}}>Personaje no encontrado.</div>;
  const cbt=combatientes.find(c=>c.id===miPjId); const col=mipj.color||"#d4af37"; const otros=personajes.filter(p=>p.id!==miPjId);
  const puedeEnOtro = (i) => !["propio","constructo","arma","zona","enemigo"].includes(i.efecto.objetivo);
  const puedeEnMi   = (i) => ["propio","constructo","cualquiera"].includes(i.efecto.objetivo);

  return (
    <div>
      <style>{PCSS}</style>
      <div className="pt-header" style={{"--hc":col}}>
        <div className="pt-avatar" style={{borderColor:col,background:col+"22",color:col}}>{ini(mipj.nombre)}</div>
        <div className="pt-hinfo">
          <div className="pt-hname">{mipj.nombre}</div>
          <div className="pt-hsub">{mipj.raza} · {mipj.clase}</div>
          {cbt && <div style={{display:"flex",gap:16,marginTop:6}}>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:hpColor(cbt.hp/cbt.maxHp)}}><Heart size={10} style={{verticalAlign:-1}}/> {cbt.hp}/{cbt.maxHp}</span>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"var(--mute)"}}><Shield size={10} style={{verticalAlign:-1}}/> CA {cbt.ac}</span>
          </div>}
        </div>
        <div className="pt-hlevel">Nv{mipj.nivel}</div>
      </div>

      <div className="pt-stabs">
        <button className={"pt-stab"+(stab==="arsenal"?" on":"")} onClick={()=>setStab("arsenal")}>Arsenal</button>
        <button className={"pt-stab"+(stab==="inventario"?" on":"")} onClick={()=>setStab("inventario")}>Inventario</button>
      </div>

      {stab==="arsenal" && (
        <div>
          <div className="pt-g2">
            {mipj.arsenal.map(arma=>(
              <div key={arma.id} className="pt-wcard">
                <div className="pt-wtop">
                  <div className="pt-wibox" style={{borderColor:col+"55"}}><EbIcon tipo={arma.icono} size={32} color={col}/></div>
                  <div className="pt-winfo">
                    <div className="pt-wname">{arma.nombre}</div>
                    <span className={"pt-badge "+arma.tipo}>{TIPO_LABEL[arma.tipo]}</span>
                    <div className="pt-drow">
                      {arma.dadoAtaque!=="—"&&<div className="pt-dc"><span className="k">Ataque</span><span className="v">{arma.dadoAtaque}{fb(arma.bonoAtaque)}</span></div>}
                      {arma.dadoDano !=="—"&&<div className="pt-dc"><span className="k">Daño</span><span className="v">{arma.dadoDano}{fb(arma.bonoDano)}</span></div>}
                      <div className="pt-dc"><span className="k">Tipo</span><span className="v">{arma.tipoDano}</span></div>
                      <div className="pt-dc"><span className="k">Alcance</span><span className="v">{arma.alcance}</span></div>
                    </div>
                  </div>
                </div>
                {arma.descripcion&&<div className="pt-wdesc">{arma.descripcion}</div>}
                {arma.especial&&<div className="pt-wspec">✦ {arma.especial}</div>}
                <div className="pt-wact">
                  {arma.tipo!=="habilidad"&&<button className="pt-btn atk" onClick={()=>lanzarAtaque(arma)}><Dices size={13}/> Atacar</button>}
                  <button className="pt-btn" onClick={()=>{setEditArma(arma);setShowArma(true);}}><Edit2 size={12}/> Editar</button>
                  <button className="pt-btn del" style={{marginLeft:"auto"}} onClick={()=>updPj(miPjId,p=>({...p,arsenal:p.arsenal.filter(a=>a.id!==arma.id)}))}><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
          <button className="pt-addbtn" onClick={()=>{setEditArma(null);setShowArma(true);}}><Plus size={16}/> Añadir arma · hechizo · habilidad</button>
        </div>
      )}

      {stab==="inventario" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {mipj.inventario.filter(i=>i.cantidad>0).map(item=>(
            <div key={item.id} className="pt-icard">
              <div className="pt-iibox"><EbIcon tipo={item.icono} size={26} color={col}/><div className="pt-qty">{item.cantidad}</div></div>
              <div className="pt-iinfo"><div className="pt-iname">{item.nombre}</div><div className="pt-idesc">{item.descripcion}</div></div>
              <div className="pt-ibts">
                {puedeEnOtro(item)&&otros.length>0&&<button className="pt-btn use" onClick={()=>setUsandoItem(item)}><Target size={12}/> Usar</button>}
                {puedeEnMi(item)&&<button className="pt-btn use" onClick={()=>confirmarUso(item,miPjId)}><Target size={12}/> En mí</button>}
                <button className="pt-btn" onClick={()=>{setEditItem(item);setShowItem(true);}}><Edit2 size={12}/></button>
                <button className="pt-btn del" onClick={()=>updPj(miPjId,p=>({...p,inventario:p.inventario.filter(i=>i.id!==item.id)}))}><Trash2 size={12}/></button>
              </div>
            </div>
          ))}
          <button className="pt-addbtn" onClick={()=>{setEditItem(null);setShowItem(true);}}><Plus size={16}/> Añadir objeto</button>
        </div>
      )}

      {usandoItem&&!rollRes&&(
        <div className="pt-modal" onClick={()=>setUsandoItem(null)}>
          <div className="pt-mbox" onClick={e=>e.stopPropagation()}>
            <h2>¿Sobre quién usas "{usandoItem.nombre}"?</h2>
            <div className="pt-tlist">
              {otros.map(pj=>{const c=combatientes.find(x=>x.id===pj.id);return(
                <div key={pj.id} className="pt-target" onClick={()=>confirmarUso(usandoItem,pj.id)}>
                  <div style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${pj.color||"#d4af37"}`,display:"grid",placeItems:"center",fontFamily:"'Cinzel'",fontWeight:700,fontSize:13,color:pj.color||"#d4af37",background:(pj.color||"#d4af37")+"22"}}>{ini(pj.nombre)}</div>
                  <div><div style={{fontFamily:"'Oswald'",fontWeight:600}}>{pj.nombre}</div>{c&&<div style={{fontSize:11,color:"var(--mute)"}}>HP {c.hp}/{c.maxHp}</div>}</div>
                </div>
              );})}
            </div>
            <div className="pt-mfooter"><button className="pt-btn" style={{flex:1,justifyContent:"center"}} onClick={()=>setUsandoItem(null)}><X size={14}/> Cancelar</button></div>
          </div>
        </div>
      )}

      {rollRes&&(
        <div className="pt-modal" onClick={()=>setRollRes(null)}>
          <div className="pt-mbox" onClick={e=>e.stopPropagation()}>
            <h2>Usar {rollRes.item.nombre}</h2>
            <div style={{fontSize:13,color:"var(--mute)",marginBottom:4}}>Sobre: <b style={{color:"var(--ink)"}}>{rollRes.toId===miPjId?"ti mismo":personajes.find(p=>p.id===rollRes.toId)?.nombre}</b></div>
            <div className="pt-roll"><div className="rv atk">{rollRes.total}</div><div className="rs">{rollRes.item.efecto.dado} {rollRes.item.efecto.bono>=0?"+":""}{rollRes.item.efecto.bono} · {rollRes.item.efecto.tipo}</div></div>
            <div className="pt-mfooter">
              <button className="pt-btn" onClick={()=>setRollRes(null)}><X size={14}/> Cancelar</button>
              <button className="pt-btn save" onClick={enviarUso}><Check size={14}/> Confirmar y enviar</button>
            </div>
          </div>
        </div>
      )}

      {atqRes&&(
        <div className="pt-modal" onClick={()=>setAtqRes(null)}>
          <div className="pt-mbox" onClick={e=>e.stopPropagation()}>
            <h2>{atqRes.arma.nombre}</h2>
            <div className="pt-r2rolls">
              <div className="pt-roll"><div style={{fontSize:10,fontFamily:"'Oswald'",textTransform:"uppercase",letterSpacing:".1em",color:"var(--mute)",marginBottom:4}}>Ataque</div><div className="rv atk">{atqRes.atk}</div><div className="rs">d20 {fb(atqRes.arma.bonoAtaque)}</div></div>
              <div className="pt-roll"><div style={{fontSize:10,fontFamily:"'Oswald'",textTransform:"uppercase",letterSpacing:".1em",color:"var(--mute)",marginBottom:4}}>Daño</div><div className="rv dmg">{atqRes.dmg}</div><div className="rs">{atqRes.arma.dadoDano} {fb(atqRes.arma.bonoDano)} · {atqRes.arma.tipoDano}</div></div>
            </div>
            {atqRes.arma.especial&&<div style={{fontSize:11,color:"var(--shard)",textAlign:"center",marginTop:4,fontStyle:"italic"}}>✦ {atqRes.arma.especial}</div>}
            <div className="pt-mfooter">
              <button className="pt-btn" style={{flex:1,justifyContent:"center"}} onClick={()=>setAtqRes(null)}><Check size={14}/> Cerrar</button>
              <button className="pt-btn atk" onClick={()=>{setAtqRes(null);lanzarAtaque(atqRes.arma);}}><Dices size={13}/> Repetir</button>
            </div>
          </div>
        </div>
      )}

      {showArma&&<ArmaModal item={editArma} onSave={a=>saveArma(miPjId,a)} onClose={()=>{setShowArma(false);setEditArma(null);}}/>}
      {showItem&&<ItemModal item={editItem} onSave={i=>saveItem(miPjId,i)} onClose={()=>{setShowItem(false);setEditItem(null);}}/>}
    </div>
  );
}