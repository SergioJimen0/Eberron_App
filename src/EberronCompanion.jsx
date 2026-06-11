import React, { useState } from "react";
import { Sword, User, BookOpen, Dices, Check, X } from "lucide-react";
import RastreadorCombate from "./RastreadorCombate";
import PersonajeTab, { PERSONAJES_INICIAL } from "./PersonajeTab";

const TABS = [
  { id:"combate",  label:"Combate",  Icon:Sword    },
  { id:"personaje",label:"Personaje",Icon:User     },
  { id:"campana",  label:"Campaña",  Icon:BookOpen, disabled:true },
  { id:"dados",    label:"Dados",    Icon:Dices,    disabled:true },
];

const EC_CSS = `
:root{
  --bg:#0e1015; --bg2:#13151a; --card:#1a1d24; --line:#2a2d35;
  --ink:#e8eaf0; --mute:#5a6070;
  --brass:#d4af37; --shard:#3fd0c9; --crim:#d6483b;
  --brass-dim:rgba(212,175,55,.4); --shard-dim:rgba(63,208,201,.4); --good:#5fbf6f;
}
.ec-tabs{ position:fixed; bottom:0; left:0; right:0; z-index:50; background:var(--bg2); border-top:1px solid var(--line); display:flex; padding:0 6px; padding-bottom:env(safe-area-inset-bottom,0); }
.ec-tab{ flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:10px 0 8px; border:none; background:transparent; cursor:pointer; transition:color .15s; color:var(--mute); font-family:'Oswald',sans-serif; text-transform:uppercase; letter-spacing:.05em; font-size:10px; font-weight:600; min-height:56px; }
.ec-tab.on{ color:var(--shard); }
.ec-tab.disabled{ opacity:.3; pointer-events:none; }
.ec-overlay{ position:fixed; inset:0 0 56px 0; background:var(--bg); overflow-y:auto; z-index:40; padding:18px 18px 0; }
.ec-notif{ position:fixed; top:0; left:0; right:0; z-index:80; padding:12px 16px; border-bottom:2px solid var(--brass); background:var(--card); display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.ec-notif-txt{ flex:1; font-size:14px; min-width:180px; }
.ec-notif-val{ font-family:'Cinzel',serif; font-weight:900; font-size:22px; color:var(--brass); margin:0 8px; }
.ec-notif-btns{ display:flex; gap:6px; }
.ec-nb{ font-family:'Oswald',sans-serif; text-transform:uppercase; font-weight:600; font-size:11px; padding:7px 14px; border-radius:8px; cursor:pointer; border:none; min-height:32px; }
.ec-nb.ok{ background:var(--shard); color:#0e1015; }
.ec-nb.no{ background:var(--crim); color:#fff; }
`;

function NotifBanner({ notifs, personajes, miPjId, rol, onResolver }) {
  const pending = notifs.filter(n => n.estado === "pending");
  if (!pending.length) return null;
  const n = pending[0];
  const from = personajes.find(p => p.id === n.fromId);
  const to   = personajes.find(p => p.id === n.toId);
  const esRecipiente = rol === "jugador" && miPjId === n.toId;
  return (
    <div className="ec-notif">
      <div className="ec-notif-txt">
        <span style={{color:"var(--brass)",fontFamily:"'Oswald'",fontWeight:600}}>{from?.nombre}</span>
        <span style={{color:"var(--mute)"}}> usa </span>
        <span style={{color:"var(--ink)"}}>{n.item.nombre}</span>
        <span style={{color:"var(--mute)"}}> sobre </span>
        <span style={{color:"var(--shard)"}}>{n.toId === miPjId ? "ti" : to?.nombre}</span>
      </div>
      <span className="ec-notif-val">{n.total}</span>
      <span style={{fontSize:11,color:"var(--mute)"}}>{n.item.efecto.tipo}</span>
      {esRecipiente && (
        <div className="ec-notif-btns">
          <button className="ec-nb ok" onClick={() => onResolver(n.id, true)}><Check size={13}/> Aceptar</button>
          <button className="ec-nb no" onClick={() => onResolver(n.id, false)}><X size={13}/> Rechazar</button>
        </div>
      )}
      {!esRecipiente && (
        <div style={{fontSize:11,color:"var(--mute)",fontStyle:"italic"}}>Esperando respuesta…</div>
      )}
    </div>
  );
}

export default function EberronCompanion() {
  const [tab, setTab]               = useState("combate");
  const [personajes, setPersonajes] = useState(PERSONAJES_INICIAL);
  const [notifs, setNotifs]         = useState([]);
  const [rol, setRol]               = useState("jugador");
  const MI_PJ = "vol";

  const notifBannerVisible = notifs.some(n => n.estado === "pending");

  const handleUsoObjeto = (fromId, toId, item, total) => {
    setNotifs(prev => [...prev, { id: Date.now(), fromId, toId, item, total, estado:"pending" }]);
  };

  const handleResolver = (notifId, aceptar) => {
    setNotifs(prev => prev.map(n => n.id === notifId ? {...n, estado: aceptar ? "accepted" : "rejected"} : n));
  };

  return (
    <>
      <style>{EC_CSS}</style>

      <NotifBanner
        notifs={notifs}
        personajes={personajes}
        miPjId={MI_PJ}
        rol={rol}
        onResolver={handleResolver}
      />

      {/* RastreadorCombate sin ningún wrapper — siempre montado */}
      <RastreadorCombate />

      {/* PersonajeTab se superpone como capa fija cuando está activo */}
      {tab === "personaje" && (
        <div className="ec-overlay">
          <PersonajeTab
            personajes={personajes}
            setPersonajes={setPersonajes}
            combatientes={[]}
            rol={rol}
            miPjId={MI_PJ}
            onUsoObjeto={handleUsoObjeto}
            notifs={notifs}
          />
        </div>
      )}

      <div className="ec-tabs">
        {TABS.map(({ id, label, Icon, disabled }) => (
          <button
            key={id}
            className={"ec-tab" + (tab === id ? " on" : "") + (disabled ? " disabled" : "")}
            onClick={() => !disabled && setTab(id)}
          >
            <Icon size={22}/>
            {label}
          </button>
        ))}
      </div>
    </>
  );
}