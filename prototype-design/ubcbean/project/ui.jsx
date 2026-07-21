// ui.jsx — Modern glass UI primitives (PrimeNG-inspired) for ubcbean

const PALETTES = {
  sakura:   { bg1:'#fdf2f4', bg2:'#fad9e2', accent:'#e89bb0', accentDeep:'#b95979', accentSoft:'#fde3ea' },
  rose:     { bg1:'#fdf0f5', bg2:'#f5c6d8', accent:'#d4607a', accentDeep:'#a03050', accentSoft:'#fbd5e2' },
  espresso: { bg1:'#fdf5ef', bg2:'#e8d5c4', accent:'#c4845a', accentDeep:'#8b4a2a', accentSoft:'#f5e6d8' },
  terra:    { bg1:'#fdf2ec', bg2:'#e8c8b0', accent:'#c86844', accentDeep:'#944030', accentSoft:'#f5ddd0' },
  amber:    { bg1:'#fdf8ec', bg2:'#f5e4b8', accent:'#d4a030', accentDeep:'#9a6e1a', accentSoft:'#faf0d0' },
  matcha:   { bg1:'#f3f7ec', bg2:'#dbe7c4', accent:'#a8c275', accentDeep:'#5d7a3a', accentSoft:'#e7efd6' },
  sage:     { bg1:'#f2f4f0', bg2:'#cdd8c4', accent:'#7a9e72', accentDeep:'#4a6e45', accentSoft:'#dce8d8' },
  slate:    { bg1:'#f0f4f8', bg2:'#d1dce9', accent:'#6b8cb8', accentDeep:'#3d6494', accentSoft:'#dde7f3' },
  cobalt:   { bg1:'#eef2fa', bg2:'#c4d4ee', accent:'#4a6fd5', accentDeep:'#2843a8', accentSoft:'#d5e1f5' },
  lavender: { bg1:'#f5f0fd', bg2:'#e2d4f5', accent:'#9d76d5', accentDeep:'#6b42b0', accentSoft:'#ede3f9' },
};

const BODY_FONTS = {
  jakarta: { label:'Jakarta',  family:"'Plus Jakarta Sans'", url:"family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800" },
  inter:   { label:'Inter',    family:"'Inter'",             url:"family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700" },
  dm:      { label:'DM Sans',  family:"'DM Sans'",           url:"family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700" },
  outfit:  { label:'Outfit',   family:"'Outfit'",            url:"family=Outfit:wght@300;400;500;600;700;800" },
  nunito:  { label:'Nunito',   family:"'Nunito'",            url:"family=Nunito:wght@400;500;600;700;800" },
  jost:    { label:'Jost',     family:"'Jost'",              url:"family=Jost:wght@300;400;500;600;700" },
};

const DISPLAY_FONTS = {
  jakarta:   { label:'Jakarta',     family:"'Plus Jakarta Sans'",  url:"family=Plus+Jakarta+Sans:wght@600;700;800" },
  dm_serif:  { label:'DM Serif',    family:"'DM Serif Display'",   url:"family=DM+Serif+Display:ital@0;1" },
  fraunces:  { label:'Fraunces',    family:"'Fraunces'",           url:"family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400" },
  cormorant: { label:'Cormorant',   family:"'Cormorant Garamond'", url:"family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400" },
  playfair:  { label:'Playfair',    family:"'Playfair Display'",   url:"family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400" },
  libre:     { label:'Baskerville', family:"'Libre Baskerville'",  url:"family=Libre+Baskerville:ital,wght@0,400;0,700;1,400" },
};

const UI_STYLES = {
  glass:   { label:'Glass',   rSm:'10px', rMd:'14px', rLg:'20px', rXl:'28px', blur:'blur(24px) saturate(180%)', shadowSm:'0 1px 2px rgba(28,24,20,.06),0 2px 8px rgba(28,24,20,.04)', shadowMd:'0 4px 12px rgba(28,24,20,.08),0 12px 32px rgba(28,24,20,.06)', shadowLg:'0 12px 40px rgba(28,24,20,.18),0 24px 64px rgba(28,24,20,.10)' },
  minimal: { label:'Minimal', rSm:'6px',  rMd:'8px',  rLg:'10px', rXl:'14px', blur:'none',                       shadowSm:'0 1px 3px rgba(0,0,0,.08)',                                  shadowMd:'0 2px 8px rgba(0,0,0,.10)',                                  shadowLg:'0 4px 16px rgba(0,0,0,.14)' },
  rounded: { label:'Rounded', rSm:'18px', rMd:'22px', rLg:'28px', rXl:'40px', blur:'blur(20px) saturate(160%)', shadowSm:'0 1px 2px rgba(28,24,20,.06),0 2px 8px rgba(28,24,20,.04)', shadowMd:'0 4px 12px rgba(28,24,20,.08),0 12px 32px rgba(28,24,20,.06)', shadowLg:'0 12px 40px rgba(28,24,20,.18),0 24px 64px rgba(28,24,20,.10)' },
  sharp:   { label:'Sharp',   rSm:'2px',  rMd:'3px',  rLg:'4px',  rXl:'6px',  blur:'none',                       shadowSm:'0 1px 0 rgba(0,0,0,.14)',                                    shadowMd:'0 2px 0 rgba(0,0,0,.12),0 1px 4px rgba(0,0,0,.08)',          shadowLg:'0 3px 0 rgba(0,0,0,.14),0 2px 8px rgba(0,0,0,.10)' },
};

function _hexToHSL(hex) {
  const h = hex.replace('#',''); const x = h.length===3?h.replace(/./g,c=>c+c):h.padEnd(6,'0');
  const n = parseInt(x.slice(0,6),16); if(Number.isNaN(n)) return [0,0,50];
  let r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;
  if(max===min) return [0,0,l*100];
  const d=max-min,s=l>0.5?d/(2-max-min):d/(max+min);
  let hue; switch(max){case r:hue=(g-b)/d+(g<b?6:0);break;case g:hue=(b-r)/d+2;break;default:hue=(r-g)/d+4;}
  return [hue/6*360,s*100,l*100];
}

function _hslToHex(h,s,l) {
  h/=360;s/=100;l/=100;
  const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
  const hue2=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<0.5)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
  const r=s===0?l:hue2(p,q,h+1/3),g=s===0?l:hue2(p,q,h),b=s===0?l:hue2(p,q,h-1/3);
  return '#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

function deriveFromAccent(hex) {
  const [h,s,l] = _hexToHSL(hex);
  return {
    accent:      hex,
    accentDeep:  _hslToHex(h, Math.min(100,s+8),  Math.max(10,l-22)),
    accentSoft:  _hslToHex(h, Math.max(0,s-35),   Math.min(98,l+32)),
    bg1:         _hslToHex(h, Math.max(0,s-55),   Math.min(99,l+42)),
    bg2:         _hslToHex(h, Math.max(0,s-40),   Math.min(97,l+28)),
  };
}

function applyFont(bodyKey, displayKey) {
  const bf = BODY_FONTS[bodyKey] || BODY_FONTS.jakarta;
  const df = DISPLAY_FONTS[displayKey] || DISPLAY_FONTS.jakarta;
  const link = document.getElementById('gf');
  if (link) {
    const urls = bf.url === df.url ? bf.url : `${bf.url}&${df.url}`;
    link.href = `https://fonts.googleapis.com/css2?${urls}&display=swap`;
  }
  document.documentElement.style.setProperty('--font-body', bf.family);
  document.documentElement.style.setProperty('--font-display', df.family);
  let s = document.getElementById('ts-font-style');
  if (!s) { s = document.createElement('style'); s.id = 'ts-font-style'; document.head.appendChild(s); }
  s.textContent = bf.family !== df.family
    ? `[style*="font-weight: 7"],[style*="font-weight: 8"],[style*="font-weight: 9"]{font-family:${df.family},system-ui,serif!important}`
    : '';
}

function applyStyle(key) {
  const s = UI_STYLES[key] || UI_STYLES.glass;
  const r = document.documentElement;
  r.style.setProperty('--r-sm', s.rSm);
  r.style.setProperty('--r-md', s.rMd);
  r.style.setProperty('--r-lg', s.rLg);
  r.style.setProperty('--r-xl', s.rXl);
  r.style.setProperty('--shadow-sm', s.shadowSm);
  r.style.setProperty('--shadow-md', s.shadowMd);
  r.style.setProperty('--shadow-lg', s.shadowLg);
  r.style.setProperty('--style-blur', s.blur);
}

function applyPalette(el, name) {
  const p = (typeof name === 'string' && name.startsWith('#'))
    ? deriveFromAccent(name)
    : (PALETTES[name] || PALETTES.sakura);
  document.body.style.background = `
    radial-gradient(1200px 600px at 20% 10%, ${p.accentSoft} 0%, transparent 60%),
    radial-gradient(1000px 500px at 90% 80%, ${p.bg2} 0%, transparent 55%),
    linear-gradient(160deg, ${p.bg1} 0%, ${p.bg2} 100%)`;
  const setVars = (node) => {
    node.style.setProperty('--accent', p.accent);
    node.style.setProperty('--accent-deep', p.accentDeep);
    node.style.setProperty('--accent-soft', p.accentSoft);
    node.style.setProperty('--surface', 'rgba(255, 252, 253, 0.72)');
    node.style.setProperty('--surface-strong', 'rgba(255, 252, 253, 0.92)');
    node.style.setProperty('--ink', '#241820');
    node.style.setProperty('--ink-soft', '#4a3340');
    node.style.setProperty('--ink-mute', '#8a7080');
    node.style.setProperty('--line', 'rgba(36, 24, 32, 0.08)');
    node.style.setProperty('--line-strong', 'rgba(36, 24, 32, 0.18)');
  };
  setVars(document.documentElement);
  if (el && el !== document.documentElement) setVars(el);
}

// ─── Brand Logo (Around the Bean · World) ─────────────────
function Logo({ size = 56, color = 'var(--ink)', bg = 'transparent' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display:'block' }}>
      <defs>
        <path id="logoTopArc" d="M 16 50 A 34 34 0 0 1 84 50" fill="none"/>
        <path id="logoBottomArc" d="M 16 52 A 34 34 0 0 0 84 52" fill="none"/>
      </defs>
      <circle cx="50" cy="50" r="46" fill={bg} stroke={color} strokeWidth="2"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="1"/>
      {/* meridians */}
      <ellipse cx="50" cy="50" rx="14" ry="38" fill="none" stroke={color} strokeWidth="0.8" opacity="0.55"/>
      <ellipse cx="50" cy="50" rx="28" ry="38" fill="none" stroke={color} strokeWidth="0.8" opacity="0.55"/>
      <line x1="50" y1="12" x2="50" y2="88" stroke={color} strokeWidth="0.8" opacity="0.55"/>
      {/* parallels */}
      <line x1="12" y1="50" x2="88" y2="50" stroke={color} strokeWidth="0.8" opacity="0.55"/>
      <path d="M 16 32 A 38 38 0 0 1 84 32" fill="none" stroke={color} strokeWidth="0.8" opacity="0.55"/>
      <path d="M 16 68 A 38 38 0 0 0 84 68" fill="none" stroke={color} strokeWidth="0.8" opacity="0.55"/>
      {/* center label */}
      <rect x="16" y="42" width="68" height="16" fill={color}/>
      <text x="50" y="54.5" textAnchor="middle" fontSize="13" fontWeight="900" fill={bg === 'transparent' ? '#fff' : bg} fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="0.04em">BEAN</text>
      {/* curved text */}
      <text fontSize="7.2" fontWeight="800" fill={color} fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="0.18em">
        <textPath href="#logoTopArc" startOffset="50%" textAnchor="middle">AROUND · THE</textPath>
      </text>
      <text fontSize="7.2" fontWeight="800" fill={color} fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="0.18em">
        <textPath href="#logoBottomArc" startOffset="50%" textAnchor="middle">★ WORLD ★</textPath>
      </text>
    </svg>
  );
}

// ─── Cherry Blossom (sakura petal cluster) ────────────────
function Sakura({ size = 24, color = 'currentColor', filled = true }) {
  const petal = (rot) => (
    <ellipse cx="0" cy="-7" rx="3.5" ry="6" fill={filled ? color : 'none'} stroke={color} strokeWidth={filled ? 0 : 1} transform={`rotate(${rot})`} opacity={filled ? 0.92 : 1}/>
  );
  return (
    <svg viewBox="-12 -12 24 24" width={size} height={size} style={{ display:'block' }}>
      <g>{[0,72,144,216,288].map(r => <g key={r}>{petal(r)}</g>)}</g>
      <circle cx="0" cy="0" r="1.8" fill={filled ? '#fff' : color}/>
    </svg>
  );
}

// ─── Sakura branch decoration ─────────────────────────────
function SakuraBranch({ width = 200, height = 80, color = 'rgba(255,255,255,0.45)', flowerColor = 'rgba(255,255,255,0.85)' }) {
  return (
    <svg viewBox="0 0 200 80" width={width} height={height} style={{ display:'block' }}>
      <path d="M 0 60 Q 50 50 100 40 T 200 20" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M 60 50 Q 70 40 90 38" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 130 32 Q 145 30 160 25" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round"/>
      {[
        {x:30, y:56, s:7}, {x:62, y:48, s:9}, {x:88, y:38, s:7}, {x:108, y:36, s:11},
        {x:135, y:30, s:8}, {x:160, y:24, s:10}, {x:185, y:20, s:7},
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          {[0,72,144,216,288].map(r => (
            <ellipse key={r} cx="0" cy={-p.s*0.55} rx={p.s*0.32} ry={p.s*0.55} fill={flowerColor} transform={`rotate(${r})`}/>
          ))}
          <circle cx="0" cy="0" r={p.s*0.18} fill={color}/>
        </g>
      ))}
    </svg>
  );
}

// ─── Icon set (lightweight inline SVGs) ──────────────────────
function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.8 }) {
  const s = { width: size, height: size, fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></>,
    menu: <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    star: <path d="M12 3l2.7 5.5 6 .9-4.4 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.3 9.4l6-.9z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    minus: <path d="M5 12h14"/>,
    arrow: <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    back: <><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></>,
    close: <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>,
    check: <path d="M5 12l5 5 9-11"/>,
    coffee: <><path d="M5 9h12v6a4 4 0 01-4 4H9a4 4 0 01-4-4V9z"/><path d="M17 11h2a2 2 0 010 4h-2"/><path d="M8 5c0-1 1-1 1-2M12 5c0-1 1-1 1-2"/></>,
    bean: <><ellipse cx="12" cy="12" rx="6" ry="9" transform="rotate(35 12 12)"/><path d="M9 7c2 4 2 6 6 10" /></>,
    map: <><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></>,
    phone: <path d="M5 4h3l2 5-2 1c1 3 3 5 6 6l1-2 5 2v3a2 2 0 01-2 2C9 21 3 15 3 6a2 2 0 012-2z"/>,
    sparkle: <><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/><path d="M7 7l2 2M15 15l2 2M7 17l2-2M15 9l2-2"/></>,
    gift: <><rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M3 13h18M12 9v11"/><path d="M8 9c-2 0-3-1-3-2.5S6 4 8 5s4 4 4 4M16 9c2 0 3-1 3-2.5S18 4 16 5s-4 4-4 4"/></>,
    repeat: <><path d="M4 11V8a3 3 0 013-3h10l-2-2M20 13v3a3 3 0 01-3 3H7l2 2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12c0 .5-.1 1-.2 1.5l2 1.5-2 3.5-2.4-1c-.7.5-1.5 1-2.4 1.2L13.5 21h-3l-.5-2.3c-.9-.2-1.7-.7-2.4-1.2l-2.4 1-2-3.5 2-1.5C5.1 13 5 12.5 5 12s.1-1 .2-1.5l-2-1.5 2-3.5 2.4 1c.7-.5 1.5-1 2.4-1.2L10.5 3h3l.5 2.3c.9.2 1.7.7 2.4 1.2l2.4-1 2 3.5-2 1.5c.1.5.2 1 .2 1.5z"/></>,
    bell: <><path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20c0 1 1 2 2 2s2-1 2-2"/></>,
    card: <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></>,
    location: <><path d="M12 21s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></>,
    chevron: <path d="M9 6l6 6-6 6"/>,
  };
  return <svg viewBox="0 0 24 24" style={{...s, display:'inline-block', flexShrink:0}}>{paths[name] || null}</svg>;
}

// ─── Glass surface ───────────────────────────────────────────
function Glass({ children, style = {}, strong = false, pad, radius }) {
  return (
    <div style={{
      background: strong ? 'var(--surface-strong)' : 'var(--surface)',
      backdropFilter: 'var(--style-blur, blur(24px) saturate(180%))',
      WebkitBackdropFilter: 'var(--style-blur, blur(24px) saturate(180%))',
      border: '0.5px solid var(--line-strong)',
      borderRadius: radius ?? 'var(--r-lg)',
      boxShadow: 'var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.5)',
      padding: pad,
      ...style,
    }}>{children}</div>
  );
}

// ─── Card (solid surface) ────────────────────────────────────
function Card({ children, style = {}, pad = 16, radius, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--surface-strong)',
      borderRadius: radius ?? 'var(--r-lg)',
      border: '0.5px solid var(--line)',
      boxShadow: 'var(--shadow-sm)',
      padding: pad,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

// ─── Button ──────────────────────────────────────────────────
function Btn({ children, onClick, kind = 'primary', size = 'md', full, style = {}, disabled, icon, iconRight }) {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13, gap: 6, height: 34, radius: 'var(--r-sm)' },
    md: { padding: '12px 18px', fontSize: 14, gap: 8, height: 44, radius: 'var(--r-md)' },
    lg: { padding: '14px 22px', fontSize: 15, gap: 10, height: 52, radius: 'var(--r-lg)' },
  };
  const s = sizes[size];
  const variants = {
    primary: {
      background: 'linear-gradient(180deg, var(--accent) 0%, var(--accent-deep) 100%)',
      color: '#fff',
      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 18px rgba(139,69,19,0.30)',
      border: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink)',
      border: '1px solid var(--line-strong)',
      boxShadow: 'none',
    },
    glass: {
      background: 'var(--surface-strong)',
      color: 'var(--ink)',
      border: '0.5px solid var(--line-strong)',
      backdropFilter: 'blur(20px)',
      boxShadow: 'var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.5)',
    },
    dark: {
      background: 'linear-gradient(180deg, #2a2218 0%, #1c1814 100%)',
      color: '#fff',
      boxShadow: '0 1px 0 rgba(255,255,255,0.10) inset, 0 8px 18px rgba(28,24,20,0.30)',
      border: 'none',
    },
    soft: {
      background: 'var(--accent-soft)',
      color: 'var(--accent-deep)',
      border: 'none',
      boxShadow: 'none',
    },
    text: {
      background: 'transparent',
      color: 'var(--accent-deep)',
      border: 'none',
      padding: '8px 4px',
      boxShadow: 'none',
    },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...variants[kind], ...s,
        padding: variants[kind].padding ?? s.padding,
        height: s.height,
        borderRadius: s.radius,
        width: full ? '100%' : undefined,
        fontFamily: 'inherit',
        fontWeight: 600,
        letterSpacing: '0.005em',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: s.gap,
        transition: 'transform .12s ease, box-shadow .18s ease, opacity .18s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 18 : 16} />}
    </button>
  );
}

// ─── Tag / Badge ─────────────────────────────────────────────
function Tag({ children, kind = 'neutral', size = 'sm', style = {} }) {
  const variants = {
    neutral: { bg: 'rgba(28,24,20,0.06)', fg: 'var(--ink-soft)' },
    accent:  { bg: 'var(--accent-soft)', fg: 'var(--accent-deep)' },
    success: { bg: 'rgba(63,138,106,0.14)', fg: '#2c6b4f' },
    warn:    { bg: 'rgba(184,137,58,0.16)', fg: '#7a5b1f' },
    dark:    { bg: 'var(--ink)', fg: 'var(--surface-strong)' },
  };
  const v = variants[kind];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '3px 8px' : '5px 10px',
      borderRadius: 999,
      background: v.bg,
      color: v.fg,
      fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 600,
      letterSpacing: '0.01em',
      ...style,
    }}>{children}</span>
  );
}

// ─── Segmented control ───────────────────────────────────────
function Segmented({ options, value, onChange, full }) {
  return (
    <div style={{
      display: 'inline-flex',
      width: full ? '100%' : undefined,
      padding: 4,
      borderRadius: 14,
      background: 'rgba(28,24,20,0.06)',
      gap: 2,
    }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            flex: 1, border: 'none', cursor: 'pointer',
            padding: '8px 10px',
            borderRadius: 10,
            background: active ? 'var(--surface-strong)' : 'transparent',
            color: active ? 'var(--ink)' : 'var(--ink-mute)',
            boxShadow: active ? 'var(--shadow-sm)' : 'none',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            transition: 'all .18s ease',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// ─── Progress bar ────────────────────────────────────────────
function Progress({ value, max = 100, height = 8, kind = 'accent' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fill = kind === 'accent'
    ? 'linear-gradient(90deg, var(--accent) 0%, var(--accent-deep) 100%)'
    : 'var(--ink)';
  return (
    <div style={{ width: '100%', height, borderRadius: 999, background: 'rgba(28,24,20,0.08)', overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', background: fill, borderRadius: 999, transition: 'width .4s ease' }} />
    </div>
  );
}

// ─── Photo placeholder slot (subtly striped) ─────────────────
function PhotoSlot({ caption, h = 200, w = '100%', radius = 'var(--r-lg)', style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius, position: 'relative', overflow: 'hidden',
      background: `
        repeating-linear-gradient(135deg, rgba(28,24,20,0.04) 0 6px, rgba(28,24,20,0.08) 6px 12px),
        linear-gradient(180deg, var(--accent-soft) 0%, rgba(199,125,79,0.18) 100%)`,
      border: '0.5px solid var(--line)',
      display: 'flex', alignItems: 'flex-end', padding: 10,
      ...style,
    }}>
      {caption && (
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
          padding: '4px 8px', borderRadius: 999,
          background: 'rgba(255,252,246,0.85)', color: 'var(--ink-soft)',
          backdropFilter: 'blur(8px)',
        }}>{caption}</span>
      )}
    </div>
  );
}

// ─── Section header with eyebrow ─────────────────────────────
function SectionHeader({ eyebrow, title, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 12 }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent-deep)', marginBottom: 4 }}>{eyebrow}</div>}
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1, color: 'var(--ink)' }}>{title}</div>
      </div>
      {action}
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────
function Toast({ children }) {
  return (
    <div style={{
      position:'absolute', top:90, left:'50%', transform:'translateX(-50%)',
      zIndex:80,
      padding:'10px 18px', borderRadius:999,
      background:'rgba(28,24,20,0.88)',
      color:'#f5efe6',
      fontSize:13, fontWeight:600,
      backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)',
      boxShadow:'0 12px 30px rgba(28,24,20,0.30)',
      animation:'toastIn .25s ease',
      whiteSpace:'nowrap',
    }}>{children}</div>
  );
}

// ─── Stepper (numbered steps) ────────────────────────────────
function Steps({ steps, current }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={s}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 999,
                background: active ? 'var(--ink)' : done ? 'var(--accent)' : 'rgba(28,24,20,0.08)',
                color: (active || done) ? '#fff' : 'var(--ink-mute)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: 12, fontWeight: 700,
                transition: 'all .25s ease',
              }}>{done ? <Icon name="check" size={14} color="#fff" strokeWidth={2.4}/> : idx}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--ink)' : 'var(--ink-mute)' }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex:1, height: 1.5, background: 'rgba(28,24,20,0.10)', borderRadius: 1 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── List row ────────────────────────────────────────────────
function ListRow({ leading, title, subtitle, trailing, onClick, divider = true }) {
  return (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', gap: 14,
      padding: '14px 16px',
      cursor: onClick ? 'pointer' : 'default',
      borderBottom: divider ? '0.5px solid var(--line)' : 'none',
    }}>
      {leading}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>{title}</div>
        {subtitle && <div style={{ fontSize:12, color:'var(--ink-mute)', marginTop:2 }}>{subtitle}</div>}
      </div>
      {trailing}
    </div>
  );
}

// keyframes
const __glassStyleEl = document.createElement('style');
__glassStyleEl.textContent = `
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes fadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
`;
document.head.appendChild(__glassStyleEl);

Object.assign(window, { PALETTES, applyPalette, BODY_FONTS, DISPLAY_FONTS, UI_STYLES, applyFont, applyStyle, deriveFromAccent, Icon, Logo, Sakura, SakuraBranch, Glass, Card, Btn, Tag, Segmented, Progress, PhotoSlot, SectionHeader, Toast, Steps, ListRow });
