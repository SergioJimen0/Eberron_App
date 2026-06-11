import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, ZoomIn, ZoomOut, Maximize2, Move, Ruler, RotateCcw } from "lucide-react";

/* ------------------------------------------------------------------ *
 *  MapaCombate — cuadrícula táctica con imagen de fondo importable
 *  Props:
 *    combatientes  — array del tracker (id, nombre, tipo, hp, maxHp, color)
 *    miPjId        — id del jugador local
 *    esDM          — boolean
 *    visible       — boolean (el timer lo controla)
 * ------------------------------------------------------------------ */

const CELL = 60;        // px por casilla en zoom 1
const FEET = 5;         // pies por casilla
const COLORS = {
  vol:   "#d4af37", sehra: "#3fd0c9", tobi: "#9b7fe8", pell: "#5fbf6f",
  enemy: "#d6483b",
};

const tokenColor = (c) => COLORS[c.id] ?? (c.tipo === "enemy" ? COLORS.enemy : "#8b90a0");
const initials = (nombre) => nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const MAP_CSS = `
.mc-root{ position:relative; width:100%; height:100%; background:#0d0f13; overflow:hidden; display:flex; flex-direction:column; }
.mc-toolbar{ display:flex; align-items:center; gap:8px; padding:10px 14px; background:#1b1e26; border-bottom:1px solid #2e3340; flex:none; flex-wrap:wrap; }
.mc-tbtn{ width:36px; height:36px; border-radius:8px; border:1px solid #2e3340; background:#212530; color:#8b90a0; cursor:pointer; display:grid; place-items:center; transition:.15s; }
.mc-tbtn:hover{ border-color:#8a7430; color:#e8e6df; }
.mc-tbtn.on{ border-color:#3fd0c9; color:#3fd0c9; background:#1d2b2a; }
.mc-sep{ width:1px; height:24px; background:#2e3340; margin:0 2px; }
.mc-label{ font-size:11px; color:#8b90a0; text-transform:uppercase; letter-spacing:.08em; }
.mc-val{ font-family:'Space Mono',monospace; font-size:13px; color:#e8e6df; }
.mc-upload{ font-family:'Oswald',sans-serif; text-transform:uppercase; letter-spacing:.05em; font-weight:600; font-size:13px; border:1px solid #2e3340; background:#212530; color:#8b90a0; border-radius:8px; padding:0 12px; height:36px; cursor:pointer; display:flex; align-items:center; gap:7px; }
.mc-upload:hover{ border-color:#8a7430; color:#e8e6df; }
.mc-upload input{ display:none; }
.mc-canvas{ flex:1; position:relative; overflow:hidden; cursor:grab; }
.mc-canvas.grabbing{ cursor:grabbing; }
.mc-canvas.ruler{ cursor:crosshair; }
.mc-inner{ position:absolute; transform-origin:0 0; }
.mc-img{ position:absolute; top:0; left:0; display:block; }
.mc-grid{ position:absolute; top:0; left:0; pointer-events:none; }
.mc-token{ position:absolute; width:52px; height:52px; border-radius:50%; border:3px solid; display:flex; align-items:center; justify-content:center; font-family:'Oswald',sans-serif; font-weight:700; font-size:16px; color:#fff; cursor:grab; user-select:none; transition:box-shadow .15s; z-index:10; transform:translate(-50%,-50%); }
.mc-token:hover{ z-index:20; }
.mc-token.active{ box-shadow:0 0 0 3px #fff,0 0 20px rgba(255,255,255,.4); z-index:20; }
.mc-token.dead{ opacity:.45; filter:grayscale(1); }
.mc-token .thp{ position:absolute; bottom:-18px; left:50%; transform:translateX(-50%); font-size:9px; color:#e8e6df; background:#13151a; border-radius:6px; padding:1px 5px; white-space:nowrap; font-family:'Space Mono',monospace; border:1px solid #2e3340; }
.mc-range{ position:absolute; border-radius:50%; pointer-events:none; border:2px dashed; opacity:.35; transform:translate(-50%,-50%); }
.mc-ruler-line{ position:absolute; pointer-events:none; z-index:30; }
.mc-hint{ position:absolute; bottom:12px; left:50%; transform:translateX(-50%); background:rgba(19,21,26,.85); border:1px solid #2e3340; border-radius:10px; padding:8px 14px; font-size:12px; color:#8b90a0; pointer-events:none; white-space:nowrap; }
.mc-nodrop{ display:flex; align-items:center; justify-content:center; flex:1; flex-direction:column; gap:12px; color:#8b90a0; }
.mc-nodrop svg{ width:48px; height:48px; opacity:.3; }
.mc-nodrop p{ font-size:13px; opacity:.6; margin:0; text-align:center; }
.mc-cellsize{ display:flex; align-items:center; gap:6px; }
.mc-cellsize input{ width:48px; font-family:'Space Mono',monospace; font-size:13px; text-align:center; background:#13151a; border:1px solid #2e3340; border-radius:6px; color:#e8e6df; padding:5px; }
`;

export default function MapaCombate({ combatientes = [], miPjId, esDM, visible }) {
  const [mapImg, setMapImg] = useState(null);
  const [imgSize, setImgSize] = useState({ w: 1200, h: 800 });
  const [cellPx, setCellPx] = useState(CELL);
  const [cellInput, setCellInput] = useState(String(CELL));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [tokens, setTokens] = useState({});      // { id: {cx, cy} } in cell coords
  const [selToken, setSelToken] = useState(null);
  const [tool, setTool] = useState("move");       // "move" | "ruler"
  const [ruler, setRuler] = useState(null);       // {x1,y1,x2,y2} in px
  const [showGrid, setShowGrid] = useState(true);

  const canvasRef = useRef(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const dragToken = useRef(null);

  // initialise tokens on mount / when combatientes change
  useEffect(() => {
    setTokens((prev) => {
      const next = { ...prev };
      combatientes.forEach((c, i) => {
        if (!next[c.id]) {
          const col = i % 8;
          const row = Math.floor(i / 8);
          next[c.id] = { cx: col + 1, cy: row + 1 };
        }
      });
      return next;
    });
  }, [combatientes.length]);

  const cellToCanvas = (cx, cy) => ({ x: (cx - 0.5) * cellPx, y: (cy - 0.5) * cellPx });
  const canvasToCell = (x, y) => ({ cx: Math.round(x / cellPx + 0.5), cy: Math.round(y / cellPx + 0.5) });
  const clientToCanvas = useCallback((clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  }, [pan, zoom]);

  const canMove = (c) => esDM ? true : c.id === miPjId;

  /* ---- pan ---- */
  const onMouseDown = (e) => {
    if (dragToken.current) return;
    if (tool === "ruler") {
      const p = clientToCanvas(e.clientX, e.clientY);
      setRuler({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
      return;
    }
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e) => {
    if (ruler && tool === "ruler" && e.buttons === 1) {
      const p = clientToCanvas(e.clientX, e.clientY);
      setRuler((r) => r ? { ...r, x2: p.x, y2: p.y } : r);
      return;
    }
    if (!isPanning.current) return;
    setPan({ x: panStart.current.px + e.clientX - panStart.current.x, y: panStart.current.py + e.clientY - panStart.current.y });
  };
  const onMouseUp = () => { isPanning.current = false; };
  const onWheel = (e) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.25, Math.min(3, z - e.deltaY * 0.001)));
  };

  /* ---- token drag (mouse) ---- */
  const onTokenMouseDown = (e, c) => {
    if (!canMove(c)) return;
    e.stopPropagation();
    dragToken.current = c.id;
    setSelToken(c.id);
  };
  const onCanvasMouseMove = (e) => {
    if (dragToken.current) {
      const p = clientToCanvas(e.clientX, e.clientY);
      const cell = canvasToCell(p.x, p.y);
      setTokens((prev) => ({ ...prev, [dragToken.current]: cell }));
      return;
    }
    onMouseMove(e);
  };
  const onCanvasMouseUp = (e) => {
    if (dragToken.current) { dragToken.current = null; return; }
    onMouseUp(e);
  };

  /* ---- token drag (touch) ---- */
  const onTokenTouchStart = (e, c) => {
    if (!canMove(c)) return;
    e.stopPropagation();
    dragToken.current = c.id;
    setSelToken(c.id);
  };
  const onCanvasTouchMove = (e) => {
    if (!dragToken.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const p = clientToCanvas(t.clientX, t.clientY);
    const cell = canvasToCell(p.x, p.y);
    setTokens((prev) => ({ ...prev, [dragToken.current]: cell }));
  };
  const onCanvasTouchEnd = () => { dragToken.current = null; };

  /* ---- image upload ---- */
  const onImgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    setMapImg(url);
  };

  /* ---- grid SVG ---- */
  const cols = Math.ceil(imgSize.w / cellPx) + 1;
  const rows = Math.ceil(imgSize.h / cellPx) + 1;
  const gridW = cols * cellPx;
  const gridH = rows * cellPx;

  /* ---- ruler distance ---- */
  const rulerDist = ruler
    ? Math.round(Math.sqrt((ruler.x2 - ruler.x1) ** 2 + (ruler.y2 - ruler.y1) ** 2) / cellPx * FEET)
    : 0;

  /* ---- movement range ---- */
  const selC = combatientes.find((c) => c.id === selToken);
  const speed = 30; // pies — se expandirá con la ficha
  const rangeCells = speed / FEET;
  const rangePos = selToken && tokens[selToken] ? cellToCanvas(tokens[selToken].cx, tokens[selToken].cy) : null;

  if (!visible) return null;

  return (
    <div className="mc-root">
      <style>{MAP_CSS}</style>

      {/* toolbar */}
      <div className="mc-toolbar">
        <label className="mc-upload">
          <Upload size={15} /> Importar mapa
          <input type="file" accept="image/*" onChange={onImgUpload} />
        </label>

        <div className="mc-sep" />

        <button className={"mc-tbtn" + (tool === "move" ? " on" : "")} title="Mover" onClick={() => { setTool("move"); setRuler(null); }}>
          <Move size={16} />
        </button>
        <button className={"mc-tbtn" + (tool === "ruler" ? " on" : "")} title="Regla" onClick={() => setTool("ruler")}>
          <Ruler size={16} />
        </button>
        {tool === "ruler" && ruler && (
          <span className="mc-val">{rulerDist} pies</span>
        )}

        <div className="mc-sep" />

        <button className="mc-tbtn" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}><ZoomIn size={16} /></button>
        <span className="mc-val">{Math.round(zoom * 100)}%</span>
        <button className="mc-tbtn" onClick={() => setZoom((z) => Math.max(0.25, z - 0.2))}><ZoomOut size={16} /></button>
        <button className="mc-tbtn" title="Resetear vista" onClick={() => { setZoom(1); setPan({ x: 40, y: 40 }); }}><RotateCcw size={15} /></button>

        <div className="mc-sep" />

        <button className={"mc-tbtn" + (showGrid ? " on" : "")} title="Cuadrícula" onClick={() => setShowGrid((v) => !v)}>
          <Maximize2 size={15} />
        </button>

        <div className="mc-sep" />
        <span className="mc-label">Celda</span>
        <div className="mc-cellsize">
          <input type="number" value={cellInput}
            onChange={(e) => setCellInput(e.target.value)}
            onBlur={() => { const v = Math.max(20, parseInt(cellInput) || CELL); setCellPx(v); setCellInput(String(v)); }}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
          />
          <span className="mc-label">px · {FEET} ft</span>
        </div>
      </div>

      {/* canvas */}
      {!mapImg ? (
        <div className="mc-nodrop">
          <Upload />
          <p>Importa una imagen de mapa con el botón de arriba.<br />La cuadrícula se superpone automáticamente.</p>
        </div>
      ) : (
        <div
          ref={canvasRef}
          className={"mc-canvas" + (isPanning.current ? " grabbing" : "") + (tool === "ruler" ? " ruler" : "")}
          onMouseDown={onMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onMouseLeave={onCanvasMouseUp}
          onTouchMove={onCanvasTouchMove}
          onTouchEnd={onCanvasTouchEnd}
          onWheel={onWheel}
        >
          <div className="mc-inner" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
            {/* imagen de mapa */}
            <img className="mc-img" src={mapImg} alt="mapa" style={{ width: imgSize.w, height: imgSize.h }} draggable={false} />

            {/* cuadrícula */}
            {showGrid && (
              <svg className="mc-grid" width={gridW} height={gridH} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="cell" width={cellPx} height={cellPx} patternUnits="userSpaceOnUse">
                    <path d={`M ${cellPx} 0 L 0 0 0 ${cellPx}`} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width={gridW} height={gridH} fill="url(#cell)" />
                {/* borde exterior */}
                <rect width={gridW} height={gridH} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
              </svg>
            )}

            {/* rango de movimiento del token seleccionado */}
            {selToken && rangePos && (
              <div className="mc-range" style={{
                left: rangePos.x, top: rangePos.y,
                width: rangeCells * cellPx * 2, height: rangeCells * cellPx * 2,
                marginLeft: -(rangeCells * cellPx), marginTop: -(rangeCells * cellPx),
                borderColor: tokenColor(selC || {}),
                background: `${tokenColor(selC || {})}18`,
              }} />
            )}

            {/* regla */}
            {ruler && (
              <svg className="mc-ruler-line" style={{ position: "absolute", top: 0, left: 0, width: gridW, height: gridH, pointerEvents: "none" }}>
                <line x1={ruler.x1} y1={ruler.y1} x2={ruler.x2} y2={ruler.y2}
                  stroke="#d4af37" strokeWidth="2" strokeDasharray="6 3" />
                <circle cx={ruler.x1} cy={ruler.y1} r="5" fill="#d4af37" />
                <circle cx={ruler.x2} cy={ruler.y2} r="5" fill="#d4af37" />
              </svg>
            )}

            {/* tokens */}
            {combatientes.filter((c) => c.unido !== false).map((c) => {
              const pos = tokens[c.id];
              if (!pos) return null;
              const { x, y } = cellToCanvas(pos.cx, pos.cy);
              const col = tokenColor(c);
              const dead = c.hp === 0;
              const isSel = selToken === c.id;
              const movable = canMove(c);
              return (
                <div key={c.id}
                  className={"mc-token" + (isSel ? " active" : "") + (dead ? " dead" : "")}
                  style={{ left: x, top: y, borderColor: col, background: col + "33",
                    boxShadow: isSel ? `0 0 0 3px ${col}, 0 0 20px ${col}66` : `0 2px 8px rgba(0,0,0,.5)`,
                    cursor: movable ? "grab" : "default" }}
                  onMouseDown={(e) => onTokenMouseDown(e, c)}
                  onTouchStart={(e) => onTokenTouchStart(e, c)}
                  onClick={(e) => { e.stopPropagation(); setSelToken(c.id === selToken ? null : c.id); }}
                >
                  <span style={{ color: col, textShadow: "0 1px 3px #000" }}>{initials(c.nombre)}</span>
                  <div className="thp" style={{ borderColor: col + "66" }}>
                    {c.hp}/{c.maxHp}
                  </div>
                </div>
              );
            })}
          </div>

          {/* hint */}
          {selToken && (
            <div className="mc-hint">
              {selC?.nombre} · {speed} pies ({rangeCells} casillas) · arrastra para mover
            </div>
          )}
        </div>
      )}
    </div>
  );
}
