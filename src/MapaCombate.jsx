import React, { useRef, useCallback, memo, useEffect } from "react";
import { Upload, ZoomIn, ZoomOut, Maximize2, Move, Ruler, RotateCcw, ChevronLeft, ChevronRight, Trash2, Images } from "lucide-react";

const FEET = 5;
const COLORS = { vol:"#d4af37", sehra:"#3fd0c9", tobi:"#9b7fe8", pell:"#5fbf6f", enemy:"#d6483b" };
const GRID_COLORS    = { white:"#ffffff", black:"#000000", green:"#3fd064" };
const GRID_ICON      = { white:"rgba(255,255,255,0.85)", black:"rgba(180,180,180,0.85)", green:"rgba(63,208,100,0.85)" };
const GRID_CYCLE     = ["white","black","green"];
const GRID_CONTRAST  = { low:{ opacity:0.12, width:0.5 }, mid:{ opacity:0.28, width:0.8 }, high:{ opacity:0.65, width:1.6 } };
const GRID_CON_LABEL = { low:"Poco", mid:"Medio", high:"Mucho" };
const GRID_CON_CYCLE = ["low","mid","high"];
const tokenColor = (c) => COLORS[c.id] ?? (c.tipo === "enemy" ? COLORS.enemy : "#8b90a0");
const initials = (n) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const MAP_CSS = `
.mc-root{ position:relative; width:100%; height:100%; background:#0b0d11; overflow:hidden; display:flex; flex-direction:column; }
.mc-toolbar{ display:flex; align-items:center; gap:8px; padding:10px 14px; background:linear-gradient(180deg,#1b1e26,#161920); border-bottom:1px solid #2e3340; flex:none; flex-wrap:wrap; }
.mc-tbtn{ width:36px; height:36px; border-radius:8px; border:1px solid #2e3340; background:#212530; color:#8b90a0; cursor:pointer; display:grid; place-items:center; transition:border-color .15s,color .15s; flex:none; }
.mc-tbtn:hover{ border-color:#8a7430; color:#e8e6df; }
.mc-tbtn.on{ border-color:#3fd0c9; color:#3fd0c9; background:#1d2b2a; box-shadow:0 0 10px rgba(63,208,201,.15); }
.mc-sep{ width:1px; height:24px; background:#2e3340; margin:0 2px; flex:none; }
.mc-label{ font-size:10px; color:#8b90a0; text-transform:uppercase; letter-spacing:.1em; font-family:'Oswald',sans-serif; }
.mc-val{ font-family:'Space Mono',monospace; font-size:13px; color:#e8e6df; min-width:44px; text-align:center; }
.mc-upload-btn{ font-family:'Oswald',sans-serif; text-transform:uppercase; letter-spacing:.06em; font-weight:600; font-size:12px; border:1px solid #8a743055; background:linear-gradient(180deg,#262019,#1d1a14); color:#d4af37; border-radius:8px; padding:0 13px; height:36px; cursor:pointer; display:flex; align-items:center; gap:7px; white-space:nowrap; transition:box-shadow .15s; }
.mc-upload-btn:hover{ box-shadow:0 0 12px rgba(212,175,55,.2); }
.mc-upload-btn input{ display:none; }
.mc-cellsize input{ width:48px; font-family:'Space Mono',monospace; font-size:13px; text-align:center; background:#13151a; border:1px solid #2e3340; border-radius:6px; color:#e8e6df; padding:5px; }
.mc-gallery{ display:flex; align-items:center; gap:6px; padding:8px 14px; background:#101218; border-bottom:1px solid #2e3340; flex:none; overflow-x:auto; }
.mc-gallery::-webkit-scrollbar{ height:4px; } .mc-gallery::-webkit-scrollbar-thumb{ background:#2e3340; border-radius:2px; }
.mc-scene{ position:relative; flex:none; width:74px; height:48px; border-radius:8px; border:2px solid #2e3340; overflow:hidden; cursor:pointer; transition:border-color .15s,box-shadow .15s; }
.mc-scene:hover{ border-color:#8a7430; }
.mc-scene.active{ border-color:#d4af37; box-shadow:0 0 12px rgba(212,175,55,.45); }
.mc-scene img{ width:100%; height:100%; object-fit:cover; display:block; }
.mc-scene .del{ position:absolute; top:2px; right:2px; width:18px; height:18px; border-radius:4px; background:rgba(214,72,59,.9); display:none; place-items:center; cursor:pointer; }
.mc-scene:hover .del{ display:grid; }
.mc-scene-label{ font-size:9px; position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,.7); text-align:center; padding:2px 3px; color:#e8e6df; font-family:'Oswald',sans-serif; letter-spacing:.04em; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.mc-scene-add{ flex:none; width:74px; height:48px; border-radius:8px; border:2px dashed #2e3340; display:grid; place-items:center; cursor:pointer; color:#8b90a0; transition:border-color .15s,color .15s; }
.mc-scene-add:hover{ border-color:#8a7430; color:#d4af37; }
.mc-scene-add input{ display:none; }
.mc-canvas{ flex:1; position:relative; overflow:hidden; cursor:grab; min-height:0; touch-action:none; }
.mc-canvas.grabbing{ cursor:grabbing; }
.mc-canvas.ruler-tool{ cursor:crosshair; }
.mc-inner{ position:absolute; transform-origin:0 0; will-change:transform; }
.mc-img{ position:absolute; top:0; left:0; display:block; max-width:none; user-select:none; }
.mc-grid{ position:absolute; top:0; left:0; pointer-events:none; }
.mc-token{ position:absolute; width:52px; height:52px; border-radius:50%; border:3px solid; display:flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-weight:700; font-size:15px; user-select:none; z-index:10; transform:translate(-50%,-50%); transition:left .18s ease,top .18s ease,box-shadow .15s; }
.mc-token.dragging{ transition:box-shadow .15s; z-index:25; }
.mc-token.movable{ cursor:grab; } .mc-token.movable:active{ cursor:grabbing; }
.mc-token.active{ z-index:20; }
.mc-token.dead{ opacity:.4; filter:grayscale(1); }
.mc-token .thp{ position:absolute; bottom:-19px; left:50%; transform:translateX(-50%); font-size:9px; color:#e8e6df; background:#13151acc; border-radius:6px; padding:1px 6px; white-space:nowrap; font-family:'Space Mono',monospace; border:1px solid #2e3340; }
.mc-range{ position:absolute; border-radius:50%; pointer-events:none; border:2px dashed; opacity:.32; transform:translate(-50%,-50%); animation:mc-pulse 2.5s ease-in-out infinite; }
@keyframes mc-pulse{ 0%,100%{ opacity:.32; } 50%{ opacity:.18; } }
.mc-nodrop{ display:flex; align-items:center; justify-content:center; flex:1; flex-direction:column; gap:14px; color:#8b90a0; min-height:200px; }
.mc-nodrop svg{ width:48px; height:48px; opacity:.25; }
.mc-nodrop p{ font-size:13px; opacity:.6; margin:0; text-align:center; line-height:1.7; white-space:pre-line; }
.mc-hint{ position:absolute; bottom:14px; left:50%; transform:translateX(-50%); background:rgba(15,17,22,.92); border:1px solid #8a743055; border-radius:10px; padding:8px 16px; font-size:12px; color:#d4af37; pointer-events:none; white-space:nowrap; z-index:40; font-family:'Oswald',sans-serif; letter-spacing:.04em; }
.mc-ruler-dist{ font-family:'Space Mono',monospace; font-size:13px; color:#d4af37; }
.mc-tgroup{ display:flex; align-items:center; gap:4px; border:1px solid #2e3340; border-radius:10px; padding:3px 6px; background:#181b22; flex:none; }
`;

function MapaCombateInner({
  combatientes = [], miPjId, esDM,
  turnoActualId,
  tokens, setTokens,
  scenes, setScenes, activeScene, setActiveScene, imgSize, setImgSize,
  zoom, setZoom, pan, setPan, cellPx, setCellPx,
  tool, setTool, showGrid, setShowGrid,
}) {
  const canvasRef  = useRef(null);
  const isPanning  = useRef(false);
  const panStart   = useRef({ x:0, y:0, px:0, py:0 });
  const dragToken  = useRef(null);
  const isRuling   = useRef(false);
  const panRef     = useRef(pan);
  const zoomRef    = useRef(zoom);
  const cellPxRef  = useRef(cellPx);
  const [ruler, setRuler]         = React.useState(null);
  const [cellInput, setCellInput] = React.useState(String(cellPx));
  const [selToken, setSelToken]   = React.useState(null);
  const [gridColor,    setGridColor]    = React.useState("white");
  const [gridContrast, setGridContrast] = React.useState("mid");
  const [, force]                       = React.useReducer(x => x + 1, 0);

  useEffect(() => { panRef.current   = pan;    }, [pan]);
  useEffect(() => { zoomRef.current  = zoom;   }, [zoom]);
  useEffect(() => { cellPxRef.current = cellPx; }, [cellPx]);

  const cellToCanvas  = (cx, cy) => ({ x: (cx - 0.5) * cellPx, y: (cy - 0.5) * cellPx });
  const canvasToCell  = useCallback((x, y) => ({
    cx: Math.max(1, Math.round(x / cellPxRef.current + 0.5)),
    cy: Math.max(1, Math.round(y / cellPxRef.current + 0.5)),
  }), []);

  const clientToCanvasRaw = useCallback((cx, cy) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x:0, y:0 };
    return {
      x: (cx - r.left - panRef.current.x) / zoomRef.current,
      y: (cy - r.top  - panRef.current.y) / zoomRef.current,
    };
  }, []);

  const clientToCanvas = useCallback((cx, cy) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x:0, y:0 };
    return { x: (cx - r.left - pan.x) / zoom, y: (cy - r.top - pan.y) / zoom };
  }, [pan, zoom]);

  const canMove = (c) => esDM || (c.id === miPjId && c.id === turnoActualId);

  const onTokenDown = useCallback((e, c) => {
    if (!canMove(c)) return;
    e.stopPropagation();
    e.preventDefault();
    dragToken.current = c.id;
    setSelToken(c.id);
    force();

    const getCell = (ev) => {
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
      return canvasToCell(clientToCanvasRaw(clientX, clientY).x, clientToCanvasRaw(clientX, clientY).y);
    };

    const onMove = (ev) => {
      if (ev.cancelable) ev.preventDefault();
      const cell = getCell(ev);
      setTokens(prev => {
        const cur = prev[dragToken.current];
        if (cur && cur.cx === cell.cx && cur.cy === cell.cy) return prev;
        return { ...prev, [dragToken.current]: cell };
      });
    };

    const onUp = () => {
      dragToken.current = null;
      force();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend",  onUp);
  }, [esDM, miPjId, turnoActualId, canvasToCell, clientToCanvasRaw, setTokens]);

  const onCanvasMouseDown = (e) => {
    if (dragToken.current) return;
    if (tool === "ruler") {
      const p = clientToCanvas(e.clientX, e.clientY);
      setRuler({ x1:p.x, y1:p.y, x2:p.x, y2:p.y });
      isRuling.current = true;
      return;
    }
    isPanning.current = true;
    panStart.current  = { x:e.clientX, y:e.clientY, px:pan.x, py:pan.y };
  };

  const onCanvasMouseMove = (e) => {
    if (isRuling.current && ruler) {
      const p = clientToCanvas(e.clientX, e.clientY);
      setRuler(r => r ? { ...r, x2:p.x, y2:p.y } : r);
      return;
    }
    if (!isPanning.current) return;
    setPan({ x: panStart.current.px + e.clientX - panStart.current.x, y: panStart.current.py + e.clientY - panStart.current.y });
  };

  const endAll = () => { isPanning.current = false; isRuling.current = false; };

  const onWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.2, Math.min(4, +(z + (e.deltaY > 0 ? -0.1 : 0.1)).toFixed(2))));
  };

  const touchPan = useRef(null);
  const onCanvasTouchStart = (e) => {
    if (dragToken.current) return;
    if (e.touches.length === 1)
      touchPan.current = { x:e.touches[0].clientX, y:e.touches[0].clientY, px:pan.x, py:pan.y };
  };
  const onCanvasTouchMove = (e) => {
    if (dragToken.current) return;
    if (touchPan.current && e.touches.length === 1)
      setPan({ x: touchPan.current.px + e.touches[0].clientX - touchPan.current.x, y: touchPan.current.py + e.touches[0].clientY - touchPan.current.y });
  };
  const onCanvasTouchEnd = () => { touchPan.current = null; };

  const addScenes = (files) => {
    const ns = Array.from(files).map((f, i) => ({ id: Date.now()+i, url: URL.createObjectURL(f), name: f.name.replace(/\.[^.]+$/,"") }));
    setScenes(prev => [...prev, ...ns]);
    if (!activeScene && ns.length) loadScene(ns[0]);
  };
  const loadScene = (s) => {
    setActiveScene(s.id);
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = s.url;
  };
  const deleteScene = (id) => {
    setScenes(prev => {
      const upd = prev.filter(s => s.id !== id);
      if (activeScene === id) { if (upd.length) loadScene(upd[0]); else setActiveScene(null); }
      return upd;
    });
  };

  const currentScene = scenes.find(s => s.id === activeScene);
  const gridW        = (Math.ceil(imgSize.w / cellPx) + 2) * cellPx;
  const gridH        = (Math.ceil(imgSize.h / cellPx) + 2) * cellPx;
  const rulerDist    = ruler ? Math.round(Math.hypot(ruler.x2-ruler.x1, ruler.y2-ruler.y1) / cellPx * FEET) : 0;
  const selC         = combatientes.find(c => c.id === selToken);
  const speed = 30, rangeCells = speed / FEET;
  const rangePos     = selToken && tokens[selToken] ? cellToCanvas(tokens[selToken].cx, tokens[selToken].cy) : null;

  return (
    <div className="mc-root">
      <style>{MAP_CSS}</style>

      <div className="mc-toolbar">
        {esDM && (
          <label className="mc-upload-btn">
            <Images size={15}/> Cargar escenas
            <input type="file" accept="image/*" multiple onChange={e => { addScenes(e.target.files); e.target.value=""; }}/>
          </label>
        )}
        <div className="mc-sep"/>
        <div className="mc-tgroup">
          <button className={"mc-tbtn"+(tool==="move"?" on":"")}  onClick={()=>{ setTool("move"); setRuler(null); }}><Move  size={16}/></button>
          <button className={"mc-tbtn"+(tool==="ruler"?" on":"")} onClick={()=>setTool("ruler")}><Ruler size={16}/></button>
        </div>
        {tool==="ruler"&&ruler&&<span className="mc-ruler-dist">{rulerDist} ft</span>}
        <div className="mc-tgroup">
          <button className="mc-tbtn" onClick={()=>setZoom(z=>Math.min(4,+(z+0.2).toFixed(1)))}><ZoomIn  size={16}/></button>
          <span className="mc-val">{Math.round(zoom*100)}%</span>
          <button className="mc-tbtn" onClick={()=>setZoom(z=>Math.max(0.2,+(z-0.2).toFixed(1)))}><ZoomOut size={16}/></button>
          <button className="mc-tbtn" onClick={()=>{ setZoom(1); setPan({x:40,y:40}); }}><RotateCcw size={14}/></button>
        </div>
        <div className="mc-tgroup">
          <button className={"mc-tbtn"+(showGrid?" on":"")} onClick={()=>setShowGrid(v=>!v)}><Maximize2 size={15}/></button>
          <button className="mc-tbtn" title="Color de cuadrícula" onClick={()=>setGridColor(c=>GRID_CYCLE[(GRID_CYCLE.indexOf(c)+1)%3])}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M5 0v15M10 0v15M0 5h15M0 10h15" stroke={GRID_ICON[gridColor]} strokeWidth="1.5"/>
              <rect x=".5" y=".5" width="14" height="14" stroke={GRID_ICON[gridColor]} strokeWidth="1"/>
            </svg>
          </button>
          <button className="mc-tbtn" title="Contraste de cuadrícula"
            style={{ minWidth:52, fontSize:11, fontFamily:"'Oswald',sans-serif", letterSpacing:".06em", textTransform:"uppercase" }}
            onClick={()=>setGridContrast(c=>GRID_CON_CYCLE[(GRID_CON_CYCLE.indexOf(c)+1)%3])}>
            {GRID_CON_LABEL[gridContrast]}
          </button>
        </div>
        <div className="mc-sep"/>
        <span className="mc-label">Celda</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <input
        type="range" min={0} max={4} step={1}
        value={[30,45,60,80,100].indexOf(cellPx) === -1 ? 2 : [30,45,60,80,100].indexOf(cellPx)}
        onChange={e => {
        const niveles = [30,45,60,80,100];
        const v = niveles[+e.target.value];
        setCellPx(v);
        setCellInput(String(v));
          }}
       style={{ width:90, accentColor:"var(--shard)", cursor:"pointer" }}
          />
        <span className="mc-val" style={{ minWidth:36, fontSize:11 }}>{cellPx}px</span>
        </div>
      </div>

      {(esDM || scenes.length > 0) && (
        <div className="mc-gallery">
          {scenes.map(s=>(
            <div key={s.id} className={"mc-scene"+(s.id===activeScene?" active":"")} onClick={()=>loadScene(s)}>
              <img src={s.url} alt={s.name}/>
              <div className="mc-scene-label">{s.name}</div>
              {esDM && <div className="del" onClick={e=>{ e.stopPropagation(); deleteScene(s.id); }}><Trash2 size={10} color="#fff"/></div>}
            </div>
          ))}
          {esDM && (
            <label className="mc-scene-add">
              <Upload size={18}/>
              <input type="file" accept="image/*" multiple onChange={e=>{ addScenes(e.target.files); e.target.value=""; }}/>
            </label>
          )}
          {scenes.length>1&&esDM&&(
            <>
              <button className="mc-tbtn" style={{marginLeft:6}} onClick={()=>{ const i=scenes.findIndex(s=>s.id===activeScene); if(i>0) loadScene(scenes[i-1]); }}><ChevronLeft  size={16}/></button>
              <button className="mc-tbtn"                         onClick={()=>{ const i=scenes.findIndex(s=>s.id===activeScene); if(i<scenes.length-1) loadScene(scenes[i+1]); }}><ChevronRight size={16}/></button>
            </>
          )}
        </div>
      )}

      {!currentScene ? (
        <div className="mc-nodrop">
          <Images/>
          <p>{esDM ? "Usa «Cargar escenas» para importar imágenes de mapa.\nCarga varias a la vez y cambia de escenario con un toque." : "El DM aún no ha cargado ningún mapa."}</p>
        </div>
      ) : (
        <div ref={canvasRef}
          className={"mc-canvas"+(isPanning.current?" grabbing":"")+(tool==="ruler"?" ruler-tool":"")}
          onMouseDown={onCanvasMouseDown} onMouseMove={onCanvasMouseMove} onMouseUp={endAll}
          onTouchStart={onCanvasTouchStart} onTouchMove={onCanvasTouchMove} onTouchEnd={onCanvasTouchEnd}
          onWheel={onWheel}>
          <div className="mc-inner" style={{ transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
            <img className="mc-img" src={currentScene.url} alt="mapa" style={{ width:imgSize.w, height:imgSize.h }} draggable={false}/>
            {showGrid && (
              <svg className="mc-grid" width={gridW} height={gridH}>
                <defs><pattern id="mcgrid" width={cellPx} height={cellPx} patternUnits="userSpaceOnUse"><path d={`M ${cellPx} 0 L 0 0 0 ${cellPx}`} fill="none" stroke={GRID_COLORS[gridColor]} strokeWidth={GRID_CONTRAST[gridContrast].width} opacity={GRID_CONTRAST[gridContrast].opacity}/></pattern></defs>
                <rect width={gridW} height={gridH} fill="url(#mcgrid)"/>
              </svg>
            )}
            {selToken && rangePos && (
              <div className="mc-range" style={{ left:rangePos.x, top:rangePos.y, width:rangeCells*cellPx*2, height:rangeCells*cellPx*2, marginLeft:-(rangeCells*cellPx), marginTop:-(rangeCells*cellPx), borderColor:tokenColor(selC||{}), background:`${tokenColor(selC||{})}14` }}/>
            )}
            {ruler && (
              <svg style={{ position:"absolute", top:0, left:0, width:gridW, height:gridH, pointerEvents:"none", zIndex:30 }}>
                <line x1={ruler.x1} y1={ruler.y1} x2={ruler.x2} y2={ruler.y2} stroke="#d4af37" strokeWidth="2" strokeDasharray="6 3"/>
                <circle cx={ruler.x1} cy={ruler.y1} r="5" fill="#d4af37"/>
                <circle cx={ruler.x2} cy={ruler.y2} r="5" fill="#d4af37"/>
              </svg>
            )}
            {combatientes.map(c => {
              const pos = tokens[c.id];
              if (!pos) return null;
              const { x, y } = cellToCanvas(pos.cx, pos.cy);
              const col = tokenColor(c);
              const dead = c.hp === 0;
              const isSel = selToken === c.id;
              const movable = canMove(c);
              const isDragging = dragToken.current === c.id;
              return (
                <div key={c.id}
                  className={"mc-token"+(isSel?" active":"")+(dead?" dead":"")+(movable?" movable":"")+(isDragging?" dragging":"")}
                  style={{ left:x, top:y, borderColor:col, background:col+"30", boxShadow: isSel?`0 0 0 3px ${col}, 0 0 22px ${col}66`:"0 2px 10px rgba(0,0,0,.65)" }}
                  onMouseDown={e=>onTokenDown(e,c)}
                  onTouchStart={e=>onTokenDown(e,c)}
                  onClick={e=>{ e.stopPropagation(); setSelToken(c.id===selToken?null:c.id); }}>
                  <span style={{ color:col, textShadow:"0 1px 4px #000" }}>{initials(c.nombre)}</span>
                  <div className="thp">{c.hp}/{c.maxHp}</div>
                </div>
              );
            })}
          </div>

          {combatientes.filter(c => !tokens[c.id]).length > 0 && (
            <div style={{ position:"absolute", top:10, right:10, zIndex:30, background:"rgba(19,21,26,.92)", border:"1px solid #2e3340", borderRadius:10, padding:"8px 10px", display:"flex", flexDirection:"column", gap:6, minWidth:160 }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:".1em", color:"#8b90a0", fontFamily:"'Oswald',sans-serif", marginBottom:2 }}>Sin colocar</div>
              {combatientes.filter(c => !tokens[c.id]).map((c, i) => {
                const col = tokenColor(c);
                return (
                  <button key={c.id}
                    onClick={() => setTokens(prev => ({ ...prev, [c.id]: { cx:3, cy:3+i*3 } }))}
                    style={{ display:"flex", alignItems:"center", gap:8, background:"transparent", border:`1px solid ${col}55`, borderRadius:8, padding:"5px 10px", cursor:"pointer", color:col, fontFamily:"'Oswald',sans-serif", fontSize:12, textTransform:"uppercase", letterSpacing:".04em" }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", border:`2px solid ${col}`, background:col+"22", display:"grid", placeItems:"center", fontFamily:"'Cinzel',serif", fontSize:10, fontWeight:700, flexShrink:0 }}>
                      {initials(c.nombre)}
                    </div>
                    {c.nombre}
                  </button>
                );
              })}
            </div>
          )}

          {selToken && (
            <div className="mc-hint">{selC?.nombre} · {speed} ft ({rangeCells} casillas) · arrastra para mover</div>
          )}
        </div>
      )}
    </div>
  );
}

const MapaCombate = memo(MapaCombateInner);
export default MapaCombate;