// crm.jsx — Around the Bean owner CRM · shell + app

const NAV = [
  { id:'dashboard', label:'Dashboard', icon:'home' },
  { id:'orders', label:'Orders', icon:'coffee' },
  { id:'reservations', label:'Reservations', icon:'clock' },
  { id:'tables', label:'Tables', icon:'map' },
  { id:'menu', label:'Menu', icon:'menu' },
  { id:'members', label:'Members', icon:'user' },
  { id:'subs', label:'Subscriptions', icon:'repeat' },
];

const PAGE_TITLE = {
  dashboard:['Good morning, Hana','Tuesday · May 8 · 7:42 AM'],
  orders:['Orders','Manage the live queue and history'],
  reservations:['Reservations','Coffee pickups and table bookings'],
  tables:['Tables','Live floor plan and seating'],
  menu:['Menu','Items, pricing and availability'],
  members:['Members','Loyalty members and tiers'],
  subs:['Subscriptions','Recurring bean deliveries'],
};

function Sidebar({ view, setView, newCount }) {
  return (
    <div style={{ width:248, flexShrink:0, background:'var(--surface-deep)', color:'#f5e9ee', display:'flex', flexDirection:'column', padding:'22px 16px', position:'sticky', top:0, height:'100vh' }}>
      <div style={{ display:'flex', alignItems:'center', gap:11, padding:'4px 8px 22px' }}>
        <Logo size={40} color="rgba(255,255,255,0.95)"/>
        <div style={{ lineHeight:1 }}>
          <div style={{ fontSize:14, fontWeight:800, whiteSpace:'nowrap' }}>Around the Bean</div>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', marginTop:3 }}>Owner Console</div>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1 }}>
        {NAV.map(n => {
          const active = view===n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'11px 12px', borderRadius:12, border:'none', cursor:'pointer',
              background: active ? 'linear-gradient(135deg,var(--accent),var(--accent-deep))' : 'transparent',
              color: active ? '#fff' : 'rgba(245,233,238,0.7)',
              fontFamily:'inherit', fontSize:14, fontWeight:700, textAlign:'left', transition:'all .18s',
              boxShadow: active ? '0 8px 18px rgba(185,89,121,0.35)' : 'none',
            }}
            onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}
            onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}>
              <Icon name={n.icon} size={19} color={active?'#fff':'rgba(245,233,238,0.7)'}/>
              <span style={{ flex:1 }}>{n.label}</span>
              {n.id==='orders' && newCount>0 && <span style={{ minWidth:20, height:20, padding:'0 6px', borderRadius:999, background: active?'rgba(255,255,255,0.25)':'var(--accent-deep)', color:'#fff', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{newCount}</span>}
            </button>
          );
        })}
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:16, display:'flex', alignItems:'center', gap:11 }}>
        <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent-deep))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:'#fff' }}>HK</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700 }}>Hana Kim</div>
          <div style={{ fontSize:11, color:'rgba(245,233,238,0.55)' }}>Owner</div>
        </div>
        <Icon name="settings" size={17} color="rgba(245,233,238,0.55)"/>
      </div>
    </div>
  );
}

function TopBar({ view, open, setOpen }) {
  const [title, sub] = PAGE_TITLE[view] || ['',''];
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 32px', borderBottom:'0.5px solid var(--line)', background:'rgba(247,241,243,0.82)', backdropFilter:'blur(16px)', position:'sticky', top:0, zIndex:20 }}>
      <div>
        <div style={{ fontSize:23, fontWeight:800, letterSpacing:'-0.02em' }}>{title}</div>
        <div style={{ fontSize:13, color:'var(--ink-mute)', marginTop:2 }}>{sub}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', borderRadius:999, background:'var(--surface-strong)', border:'0.5px solid var(--line)', boxShadow:'var(--shadow-sm)' }}>
          <Icon name="map" size={15} color="var(--ink-mute)"/>
          <input placeholder="Search orders, members…" style={{ border:'none', outline:'none', background:'transparent', fontFamily:'inherit', fontSize:13, width:180, color:'var(--ink)' }}/>
        </div>
        <button onClick={() => setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 16px', borderRadius:999, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700, whiteSpace:'nowrap',
          background: open ? 'rgba(63,138,106,0.14)' : 'rgba(36,24,32,0.07)', color: open ? '#2c6b4f' : 'var(--ink-mute)' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background: open?'#3f8a6a':'var(--ink-mute)', animation: open?'pulse 2s infinite':'none' }}/>
          {open ? 'Store open' : 'Store closed'}
        </button>
        <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--surface-strong)', border:'0.5px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'var(--shadow-sm)', position:'relative' }}>
          <Icon name="bell" size={19} color="var(--ink-soft)"/>
          <span style={{ position:'absolute', top:9, right:10, width:8, height:8, borderRadius:'50%', background:'var(--accent-deep)', border:'2px solid var(--surface-strong)' }}/>
        </div>
      </div>
    </div>
  );
}

const NEW_ARRIVALS = [
  { customer:'Leah Wong',  items:[{n:'Flat White',q:1}], total:5.00, slot:'8:10 AM' },
  { customer:'Tomás R.',   items:[{n:'Cold Brew',q:2}], total:11.00, slot:'8:15 AM' },
  { customer:'Yuki Tanaka',items:[{n:'Hojicha Latte',q:1},{n:'Latte',q:1}], total:10.50, slot:'8:20 AM' },
];

function App() {
  const [view, setView] = React.useState('dashboard');
  const [open, setOpen] = React.useState(true);
  const [orders, setOrders] = React.useState(CRM_ORDERS);
  const [toast, setToast] = React.useState(null);
  const arrivalIdx = React.useRef(0);
  const scrollRef = React.useRef(null);

  const advance = (id) => {
    setOrders(os => os.map(o => {
      if (o.id !== id) return o;
      const next = o.status==='new' ? 'preparing' : o.status==='preparing' ? 'ready' : 'picked';
      return { ...o, status: next, fresh:false };
    }));
  };

  // simulate incoming orders
  React.useEffect(() => {
    if (!open) return;
    const t = setInterval(() => {
      if (arrivalIdx.current >= NEW_ARRIVALS.length) return;
      const a = NEW_ARRIVALS[arrivalIdx.current++];
      const code = 'A24-' + (319 + arrivalIdx.current);
      setOrders(os => [{ id:'n'+arrivalIdx.current, code, customer:a.customer, items:a.items, total:a.total, placed:'now', slot:a.slot, status:'new', channel:'App', fresh:true }, ...os]);
      setToast(`New order · ${a.customer}`);
      setTimeout(() => setToast(null), 2600);
    }, 9000);
    return () => clearInterval(t);
  }, [open]);

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [view]);

  const newCount = orders.filter(o => o.status==='new').length;

  let content;
  switch (view) {
    case 'orders':       content = <OrdersView orders={orders} advance={advance}/>; break;
    case 'reservations': content = <ReservationsView orders={orders}/>; break;
    case 'tables':       content = <TablesView/>; break;
    case 'menu':         content = <MenuView/>; break;
    case 'members':      content = <MembersView/>; break;
    case 'subs':         content = <SubsView/>; break;
    default:             content = <Dashboard orders={orders} advance={advance} go={setView}/>;
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar view={view} setView={setView} newCount={newCount}/>
      <div ref={scrollRef} style={{ flex:1, minWidth:0, height:'100vh', overflow:'auto' }}>
        <TopBar view={view} open={open} setOpen={setOpen}/>
        <div style={{ padding:'28px 32px 48px', maxWidth:1320, margin:'0 auto' }}>
          {content}
        </div>
      </div>
      {toast && (
        <div style={{ position:'fixed', top:24, left:'50%', transform:'translateX(-50%)', zIndex:100, display:'flex', alignItems:'center', gap:10, padding:'12px 20px', borderRadius:999, background:'var(--surface-deep)', color:'#f5e9ee', fontSize:14, fontWeight:700, boxShadow:'var(--shadow-lg)', animation:'toastIn .3s ease' }}>
          <span style={{ width:9, height:9, borderRadius:'50%', background:'var(--accent)' }}/>{toast}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
