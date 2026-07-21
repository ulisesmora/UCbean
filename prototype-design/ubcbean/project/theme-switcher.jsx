// theme-switcher.jsx
// Floating theme panel for client previews.
// Depends on ui.jsx (PALETTES, BODY_FONTS, DISPLAY_FONTS, UI_STYLES, applyPalette, applyFont, applyStyle, deriveFromAccent).

const PALETTE_SWATCHES = [
  { key:'sakura',   color:'#e89bb0' }, { key:'rose',     color:'#d4607a' },
  { key:'espresso', color:'#c4845a' }, { key:'terra',    color:'#c86844' },
  { key:'amber',    color:'#d4a030' }, { key:'matcha',   color:'#a8c275' },
  { key:'sage',     color:'#7a9e72' }, { key:'slate',    color:'#6b8cb8' },
  { key:'cobalt',   color:'#4a6fd5' }, { key:'lavender', color:'#9d76d5' },
];

function ThemeSwitcher({ defaultPalette='sakura', defaultFontBody='jakarta', defaultFontDisplay='jakarta', defaultStyle='glass' }) {
  const [open, setOpen]               = React.useState(false);
  const [palette, setPalette]         = React.useState(defaultPalette);
  const [customColor, setCustomColor] = React.useState('#e89bb0');
  const [useCustom, setUseCustom]     = React.useState(false);
  const [fontBody, setFontBody]       = React.useState(defaultFontBody);
  const [fontDisplay, setFontDisplay] = React.useState(defaultFontDisplay);
  const [uiStyle, setUiStyle]         = React.useState(defaultStyle);
  const wrapRef = React.useRef(null);

  // Apply on mount
  React.useEffect(() => { applyPalette(document.documentElement, palette); }, []);
  React.useEffect(() => { applyFont(fontBody, fontDisplay); }, []);
  React.useEffect(() => { applyStyle(uiStyle); }, []);

  const applyThemePalette = (key) => {
    setPalette(key); setUseCustom(false);
    applyPalette(document.documentElement, key);
    window.dispatchEvent(new CustomEvent('ts-palette', { detail: key }));
  };

  const applyCustomColor = (hex) => {
    setCustomColor(hex); setUseCustom(true);
    applyPalette(document.documentElement, hex);
    window.dispatchEvent(new CustomEvent('ts-palette', { detail: hex }));
  };

  const applyThemeFont = (body, display) => {
    setFontBody(body); setFontDisplay(display);
    applyFont(body, display);
    window.dispatchEvent(new CustomEvent('ts-font', { detail: { body, display } }));
  };

  const applyThemeStyle = (key) => {
    setUiStyle(key);
    applyStyle(key);
  };

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const lbl = { fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(0,0,0,0.36)', marginBottom:8, display:'block' };
  const divider = { height:'0.5px', background:'rgba(0,0,0,0.08)', margin:'14px 0' };

  return (
    <div ref={wrapRef} style={{ position:'fixed', bottom:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {open && (
        <div style={{ background:'rgba(255,255,255,0.97)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)', border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:18, padding:'18px', width:236, boxShadow:'0 8px 40px rgba(0,0,0,0.14)', animation:'tsIn .16s cubic-bezier(.3,.7,.4,1)' }}>
          <style>{`@keyframes tsIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.ts-sw:hover{transform:scale(1.14)!important}.ts-fb:hover{background:rgba(0,0,0,0.04)!important}`}</style>

          {/* COLOR PALETTE */}
          <span style={lbl}>Color Palette</span>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:7, marginBottom:10 }}>
            {PALETTE_SWATCHES.map(p => (
              <button key={p.key} className="ts-sw" title={p.key} onClick={() => applyThemePalette(p.key)} style={{
                width:'100%', aspectRatio:'1', borderRadius:9, padding:0, cursor:'pointer',
                background: p.color,
                border: (!useCustom && palette===p.key) ? '2.5px solid #1c1814' : '2px solid rgba(0,0,0,0.08)',
                transform: (!useCustom && palette===p.key) ? 'scale(1.14)' : 'scale(1)',
                transition:'transform .14s, border .14s',
                boxShadow: (!useCustom && palette===p.key) ? '0 3px 10px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
              }} />
            ))}
          </div>

          {/* CUSTOM COLOR */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'rgba(0,0,0,0.5)', fontWeight:500, flex:1 }}>Custom accent</span>
            <div style={{ position:'relative', width:32, height:28 }}>
              <input type="color" value={customColor}
                onChange={e => applyCustomColor(e.target.value)}
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', padding:0, border:'none', borderRadius:7, cursor:'pointer', opacity:0 }}
              />
              <div style={{ width:32, height:28, borderRadius:7, background: useCustom ? customColor : customColor, border: useCustom ? '2.5px solid #1c1814' : '1.5px solid rgba(0,0,0,0.15)', pointerEvents:'none', boxShadow: useCustom ? '0 2px 8px rgba(0,0,0,0.18)' : 'none', transition:'border .14s' }} />
            </div>
          </div>

          <div style={divider} />

          {/* TYPOGRAPHY */}
          <span style={lbl}>Typography</span>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'rgba(0,0,0,0.4)', marginBottom:4 }}>Display (titles)</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {Object.entries(DISPLAY_FONTS).map(([k,f]) => (
                  <button key={k} onClick={() => applyThemeFont(fontBody, k)}
                    style={{ padding:'4px 9px', borderRadius:7, cursor:'pointer', fontSize:11, fontFamily:f.family+', system-ui, serif', fontWeight: fontDisplay===k ? 600 : 400, background: fontDisplay===k ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.03)', border: fontDisplay===k ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(0,0,0,0.06)', color:'#1c1814', transition:'background .12s' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'rgba(0,0,0,0.4)', marginBottom:4 }}>Body (UI text)</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {Object.entries(BODY_FONTS).map(([k,f]) => (
                  <button key={k} onClick={() => applyThemeFont(k, fontDisplay)}
                    style={{ padding:'4px 9px', borderRadius:7, cursor:'pointer', fontSize:11, fontFamily:f.family+', system-ui, sans-serif', fontWeight: fontBody===k ? 600 : 400, background: fontBody===k ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.03)', border: fontBody===k ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(0,0,0,0.06)', color:'#1c1814', transition:'background .12s' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={divider} />

          {/* UI STYLE */}
          <span style={lbl}>UI Style</span>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
            {Object.entries(UI_STYLES).map(([k,s]) => (
              <button key={k} onClick={() => applyThemeStyle(k)} style={{
                padding:'7px 4px', borderRadius:8, cursor:'pointer', fontSize:10, fontWeight: uiStyle===k ? 700 : 400,
                background: uiStyle===k ? '#1c1814' : 'rgba(0,0,0,0.04)',
                color: uiStyle===k ? '#fff' : 'rgba(0,0,0,0.6)',
                border: uiStyle===k ? 'none' : '1px solid rgba(0,0,0,0.08)',
                transition:'background .14s, color .14s',
              }}>{s.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)} title="Theme" style={{
        width:42, height:42, borderRadius:21, padding:0,
        border:'0.5px solid rgba(0,0,0,0.12)',
        boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        background: open ? '#1c1814' : 'rgba(255,255,255,0.95)',
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        transition:'background .15s',
      }}>
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <circle cx="5"  cy="5"  r="3" fill={open ? 'rgba(255,255,255,0.65)' : '#e89bb0'}/>
          <circle cx="12" cy="5"  r="3" fill={open ? 'rgba(255,255,255,0.65)' : '#a8c275'}/>
          <circle cx="5"  cy="12" r="3" fill={open ? 'rgba(255,255,255,0.65)' : '#6b8cb8'}/>
          <circle cx="12" cy="12" r="3" fill={open ? 'rgba(255,255,255,0.65)' : '#d4a030'}/>
        </svg>
      </button>
    </div>
  );
}

(function () {
  const el = document.getElementById('theme-switcher');
  if (el) ReactDOM.createRoot(el).render(<ThemeSwitcher />);
})();
