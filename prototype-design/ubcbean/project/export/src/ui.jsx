// ui.jsx — Modern glass UI primitives (PrimeNG-inspired) for ubcbean

const PALETTES = {
  amber:    { bg1:'#f5efe6', bg2:'#ead4b8', accent:'#c77d4f', accentDeep:'#8b4513', accentSoft:'#f1d9c2' },
  espresso: { bg1:'#221c16', bg2:'#3a2c20', accent:'#d4a574', accentDeep:'#a87446', accentSoft:'rgba(212,165,116,0.18)' },
  mint:     { bg1:'#eaf2ec', bg2:'#cfe2d4', accent:'#3f8a6a', accentDeep:'#2c6b4f', accentSoft:'#d4ebde' },
  sky:      { bg1:'#e8eef5', bg2:'#cddaea', accent:'#3d6fb0', accentDeep:'#2a4f87', accentSoft:'#d4e1f3' },
};

function applyPalette(el, name) {
  const p = PALETTES[name] || PALETTES.amber;
  if (!el) return;
  const dark = name === 'espresso';
  document.body.style.background = `
    radial-gradient(1200px 600px at 20% 10%, ${p.accentSoft} 0%, transparent 60%),
    radial-gradient(1000px 500px at 90% 80%, ${p.bg2} 0%, transparent 55%),
    linear-gradient(160deg, ${p.bg1} 0%, ${p.bg2} 100%)`;
  el.style.setProperty('--accent', p.accent);
  el.style.setProperty('--accent-deep', p.accentDeep);
  el.style.setProperty('--accent-soft', p.accentSoft);
  if (dark) {
    el.style.setProperty('--surface', 'rgba(58, 44, 32, 0.55)');
    el.style.setProperty('--surface-strong', 'rgba(58, 44, 32, 0.82)');
    el.style.setProperty('--ink', '#f5efe6');
    el.style.setProperty('--ink-soft', 'rgba(245,239,230,0.78)');
    el.style.setProperty('--ink-mute', 'rgba(245,239,230,0.55)');
    el.style.setProperty('--line', 'rgba(245,239,230,0.10)');
    el.style.setProperty('--line-strong', 'rgba(245,239,230,0.20)');
  } else {
    el.style.setProperty('--surface', 'rgba(255, 252, 246, 0.72)');
    el.style.setProperty('--surface-strong', 'rgba(255, 252, 246, 0.92)');
    el.style.setProperty('--ink', '#1c1814');
    el.style.setProperty('--ink-soft', '#4a3f33');
    el.style.setProperty('--ink-mute', '#8a7d6b');
    el.style.setProperty('--line', 'rgba(28, 24, 20, 0.10)');
    el.style.setProperty('--line-strong', 'rgba(28, 24, 20, 0.20)');
  }
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
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
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
    sm: { padding: '8px 14px', fontSize: 13, gap: 6, height: 34, radius: 10 },
    md: { padding: '12px 18px', fontSize: 14, gap: 8, height: 44, radius: 14 },
    lg: { padding: '14px 22px', fontSize: 15, gap: 10, height: 52, radius: 16 },
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

Object.assign(window, { PALETTES, applyPalette, Icon, Glass, Card, Btn, Tag, Segmented, Progress, PhotoSlot, SectionHeader, Toast, Steps, ListRow });
