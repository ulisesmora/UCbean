// crm-views.jsx — Around the Bean owner CRM · data + views

// ───────────────────────── DATA
const CRM_ORDERS = [
  { id:'o1', code:'A24-318', customer:'Joon Park',   items:[{n:'Iced Americano',q:1},{n:'Pour Over',q:1}], total:11.00, placed:'7:38', slot:'8:00 AM', status:'new', channel:'App' },
  { id:'o2', code:'A24-317', customer:'Mei Lin',     items:[{n:'Dalgona Latte',q:2}], total:12.00, placed:'7:35', slot:'7:50 AM', status:'preparing', channel:'App' },
  { id:'o3', code:'A24-316', customer:'Sam Okafor',  items:[{n:'Cortado',q:1}], total:4.50, placed:'7:33', slot:'7:45 AM', status:'preparing', channel:'App' },
  { id:'o4', code:'A24-315', customer:'Wei Chen',    items:[{n:'Hojicha Latte',q:1},{n:'Yuzu Americano',q:1}], total:11.00, placed:'7:30', slot:'7:45 AM', status:'ready', channel:'App' },
  { id:'o5', code:'A24-314', customer:'Aria Singh',  items:[{n:'Latte',q:1}], total:5.00, placed:'7:24', slot:'7:40 AM', status:'ready', channel:'Walk-in' },
  { id:'o6', code:'A24-313', customer:'Diego Ruiz',  items:[{n:'Cold Brew',q:1},{n:'Misugaru Latte',q:1}], total:11.50, placed:'7:18', slot:'7:35 AM', status:'picked', channel:'App' },
  { id:'o7', code:'A24-312', customer:'Hana Kim',    items:[{n:'Geisha Pour Over',q:1}], total:7.50, placed:'7:12', slot:'7:30 AM', status:'picked', channel:'App' },
];

const CRM_TABLES = [
  { id:'T1', seats:2, status:'open' },
  { id:'T2', seats:4, status:'reserved', who:'Mei Lin · 9:00', until:'10:30' },
  { id:'T3', seats:2, status:'seated', who:'walk-in', until:'9:15' },
  { id:'T4', seats:2, status:'open' },
  { id:'T5', seats:4, status:'open' },
  { id:'T6', seats:6, status:'reserved', who:'Okafor +5 · 11:00', until:'12:30' },
];

const CRM_TABLE_RES = [
  { id:'r1', name:'Mei Lin', party:2, time:'9:00 AM', table:'T2', status:'confirmed' },
  { id:'r2', name:'Sam Okafor', party:6, time:'11:00 AM', table:'T6', status:'confirmed' },
  { id:'r3', name:'Priya N.', party:3, time:'1:30 PM', table:'—', status:'waitlist' },
  { id:'r4', name:'L. Tremblay', party:2, time:'3:00 PM', table:'T1', status:'confirmed' },
];

const CRM_MENU = [
  { id:'m1', name:'Americano', cat:'Espresso', price:4.00, available:true, sold:18 },
  { id:'m2', name:'Latte', cat:'Espresso', price:5.00, available:true, sold:24 },
  { id:'m3', name:'Cortado', cat:'Espresso', price:4.50, available:true, sold:9 },
  { id:'m4', name:'Pour Over · Ethiopia', cat:'Filter', price:6.50, available:true, sold:14 },
  { id:'m5', name:'Panama Geisha', cat:'Filter', price:7.50, available:false, sold:3 },
  { id:'m6', name:'Iced Americano', cat:'Iced', price:4.50, available:true, sold:31 },
  { id:'m7', name:'Dalgona Latte', cat:'Iced', price:6.00, available:true, sold:12 },
  { id:'m8', name:'Yuzu Americano', cat:'Iced', price:5.50, available:true, sold:16 },
  { id:'m9', name:'Misugaru Latte', cat:'Iced', price:6.00, available:false, sold:0 },
  { id:'m10', name:'Hojicha Latte', cat:'Espresso', price:5.50, available:true, sold:8 },
];

const CRM_MEMBERS = [
  { id:'c1', name:'Joon Park', tier:'Silver', stamps:7, visits:47, spend:312 },
  { id:'c2', name:'Mei Lin', tier:'Gold', stamps:9, visits:88, spend:640 },
  { id:'c3', name:'Sam Okafor', tier:'Bronze', stamps:2, visits:11, spend:74 },
  { id:'c4', name:'Wei Chen', tier:'Gold', stamps:8, visits:61, spend:498 },
  { id:'c5', name:'Aria Singh', tier:'Silver', stamps:5, visits:29, spend:191 },
  { id:'c6', name:'Diego Ruiz', tier:'Bronze', stamps:3, visits:14, spend:88 },
];

const CRM_SUBS = [
  { id:'s1', name:'Mei Lin', plan:'Weekly', bean:"Roaster's pick", next:'May 13', status:'active' },
  { id:'s2', name:'Wei Chen', plan:'Bi-weekly', bean:'House blend', next:'May 16', status:'active' },
  { id:'s3', name:'Joon Park', plan:'Monthly', bean:'Single origin', next:'Jun 2', status:'active' },
  { id:'s4', name:'L. Tremblay', plan:'Weekly', bean:'House blend', next:'—', status:'paused' },
];

const HOURLY = [3,8,14,22,19,12,9,15,11,7,5,2]; // 7am..6pm sales index

// ───────────────────────── HELPERS
const STATUS_META = {
  new:       { label:'New',        bg:'rgba(185,89,121,0.14)', fg:'#b95979', dot:'#b95979' },
  preparing: { label:'Preparing',  bg:'rgba(184,137,58,0.16)', fg:'#8a6320', dot:'#b8893a' },
  ready:     { label:'Ready',      bg:'rgba(63,138,106,0.16)', fg:'#2c6b4f', dot:'#3f8a6a' },
  picked:    { label:'Picked up',  bg:'rgba(36,24,32,0.07)',   fg:'#8a7080', dot:'#b3a3ac' },
};
function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.picked;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:999, background:m.bg, color:m.fg, fontSize:12, fontWeight:700 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:m.dot }}/>{m.label}
    </span>
  );
}

function KpiCard({ label, value, delta, icon, deltaPos = true }) {
  return (
    <Card pad={20} style={{ flex:1 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={icon} size={20}/></div>
        {delta && <span style={{ fontSize:12, fontWeight:700, color: deltaPos ? '#2c6b4f' : '#b95979', background: deltaPos?'rgba(63,138,106,0.12)':'rgba(185,89,121,0.12)', padding:'3px 8px', borderRadius:999 }}>{delta}</span>}
      </div>
      <div style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em', marginTop:16 }}>{value}</div>
      <div style={{ fontSize:13, color:'var(--ink-mute)', marginTop:2 }}>{label}</div>
    </Card>
  );
}

function Panel({ title, action, children, style = {} }) {
  return (
    <Card pad={0} style={{ overflow:'hidden', ...style }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'0.5px solid var(--line)' }}>
        <div style={{ fontSize:15, fontWeight:800 }}>{title}</div>
        {action}
      </div>
      {children}
    </Card>
  );
}

// ───────────────────────── DASHBOARD
function Dashboard({ orders, advance, go }) {
  const active = orders.filter(o => o.status !== 'picked');
  const maxH = Math.max(...HOURLY);
  const hours = ['7','8','9','10','11','12','1','2','3','4','5','6'];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* KPIs */}
      <div style={{ display:'flex', gap:16 }}>
        <KpiCard label="Revenue today" value="$642" delta="+12%" icon="card"/>
        <KpiCard label="Orders today" value="38" delta="+6" icon="coffee"/>
        <KpiCard label="Reservations" value="14" delta="+3" icon="clock"/>
        <KpiCard label="Active members" value="312" delta="+8" icon="user"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20 }}>
        {/* Live queue */}
        <Panel title={`Live order queue · ${active.length}`} action={<Btn size="sm" kind="ghost" onClick={() => go('orders')}>View all</Btn>}>
          <div style={{ maxHeight:420, overflow:'auto' }}>
            {active.map((o,i) => (
              <div key={o.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom: i<active.length-1?'0.5px solid var(--line)':'none', animation: o.fresh ? 'fadeUp .4s ease' : 'none' }}>
                <div style={{ width:46, height:46, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:9, fontWeight:700, opacity:0.7 }}>SLOT</span>
                  <span style={{ fontSize:11, fontWeight:800 }}>{o.slot.replace(' AM','').replace(' PM','')}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:14, fontWeight:800 }}>{o.customer}</span>
                    <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:11, color:'var(--ink-mute)' }}>{o.code}</span>
                    {o.channel==='Walk-in' && <Tag kind="neutral">Walk-in</Tag>}
                  </div>
                  <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.items.map(it => `${it.q}× ${it.n}`).join(' · ')}</div>
                </div>
                <StatusPill status={o.status}/>
                <Btn size="sm" kind={o.status==='ready'?'soft':'primary'} onClick={() => advance(o.id)}>
                  {o.status==='new'?'Accept':o.status==='preparing'?'Mark ready':'Handed over'}
                </Btn>
              </div>
            ))}
            {active.length===0 && <div style={{ padding:40, textAlign:'center', color:'var(--ink-mute)', fontSize:14 }}>All caught up ✿</div>}
          </div>
        </Panel>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <Panel title="Sales by hour">
            <div style={{ padding:'20px', display:'flex', alignItems:'flex-end', gap:6, height:170 }}>
              {HOURLY.map((v,i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <div style={{ width:'100%', height: (v/maxH*120)+'px', borderRadius:6, background: i===3 ? 'linear-gradient(180deg,var(--accent),var(--accent-deep))' : 'var(--accent-soft)' }}/>
                  <span style={{ fontSize:10, color:'var(--ink-mute)' }}>{hours[i]}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Top sellers today">
            {[['Iced Americano',31],['Latte',24],['Pour Over',14],['Yuzu Americano',16]].sort((a,b)=>b[1]-a[1]).map(([n,c],i,a) => (
              <div key={n} style={{ padding:'12px 20px', borderBottom:i<a.length-1?'0.5px solid var(--line)':'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:600, marginBottom:6 }}><span>{n}</span><span style={{ color:'var(--ink-mute)' }}>{c} sold</span></div>
                <Progress value={c} max={31}/>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── ORDERS
function OrdersView({ orders, advance }) {
  const [filter, setFilter] = React.useState('all');
  const tabs = [['all','All'],['new','New'],['preparing','Preparing'],['ready','Ready'],['picked','Picked up']];
  const list = filter==='all' ? orders : orders.filter(o => o.status===filter);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', gap:8 }}>
        {tabs.map(([id,label]) => {
          const n = id==='all'?orders.length:orders.filter(o=>o.status===id).length;
          return (
            <button key={id} onClick={() => setFilter(id)} style={{ padding:'9px 16px', borderRadius:999, border:'0.5px solid var(--line-strong)', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700,
              background: filter===id?'var(--ink)':'transparent', color: filter===id?'#fff':'var(--ink-soft)' }}>{label} <span style={{ opacity:0.6 }}>· {n}</span></button>
          );
        })}
      </div>
      <Panel title={`Orders · ${list.length}`}>
        <div style={{ display:'grid', gridTemplateColumns:'90px 1.1fr 1.6fr 90px 110px 130px', padding:'12px 20px', borderBottom:'0.5px solid var(--line)', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ink-mute)' }}>
          <span>Code</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span>Action</span>
        </div>
        <div style={{ maxHeight:560, overflow:'auto' }}>
          {list.map((o,i,a) => (
            <div key={o.id} style={{ display:'grid', gridTemplateColumns:'90px 1.1fr 1.6fr 90px 110px 130px', alignItems:'center', padding:'14px 20px', borderBottom:i<a.length-1?'0.5px solid var(--line)':'none' }}>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:12, color:'var(--ink-soft)' }}>{o.code}</span>
              <div><div style={{ fontSize:14, fontWeight:700 }}>{o.customer}</div><div style={{ fontSize:11, color:'var(--ink-mute)' }}>{o.channel} · {o.slot}</div></div>
              <span style={{ fontSize:13, color:'var(--ink-soft)' }}>{o.items.map(it => `${it.q}× ${it.n}`).join(', ')}</span>
              <span style={{ fontSize:14, fontWeight:700 }}>${o.total.toFixed(2)}</span>
              <StatusPill status={o.status}/>
              {o.status!=='picked' ? <Btn size="sm" kind={o.status==='ready'?'soft':'primary'} onClick={() => advance(o.id)}>{o.status==='new'?'Accept':o.status==='preparing'?'Ready':'Hand over'}</Btn> : <span style={{ fontSize:12, color:'var(--ink-mute)' }}>Done</span>}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ───────────────────────── RESERVATIONS
function ReservationsView({ orders }) {
  const pickups = orders.filter(o => o.channel==='App').slice().sort((a,b)=>a.slot.localeCompare(b.slot));
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      <Panel title="Coffee pickups · today" action={<Tag kind="accent">{pickups.length} slots</Tag>}>
        <div style={{ maxHeight:560, overflow:'auto' }}>
          {pickups.map((o,i,a) => (
            <div key={o.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom:i<a.length-1?'0.5px solid var(--line)':'none' }}>
              <div style={{ width:60, textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:800 }}>{o.slot.replace(/ (AM|PM)/,'')}</div>
                <div style={{ fontSize:10, color:'var(--ink-mute)', fontWeight:700 }}>{o.slot.includes('PM')?'PM':'AM'}</div>
              </div>
              <div style={{ width:1, alignSelf:'stretch', background:'var(--line)' }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{o.customer}</div>
                <div style={{ fontSize:12, color:'var(--ink-soft)' }}>{o.items.map(it=>`${it.q}× ${it.n}`).join(' · ')}</div>
              </div>
              <StatusPill status={o.status}/>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Table reservations · today" action={<Btn size="sm" kind="primary" icon="plus">Add</Btn>}>
        <div style={{ maxHeight:560, overflow:'auto' }}>
          {CRM_TABLE_RES.map((r,i,a) => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom:i<a.length-1?'0.5px solid var(--line)':'none' }}>
              <div style={{ width:48, height:48, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13 }}>{r.table==='—'?'?':r.table}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{r.name}</div>
                <div style={{ fontSize:12, color:'var(--ink-soft)' }}>{r.party} guests · {r.time}</div>
              </div>
              <Tag kind={r.status==='confirmed'?'success':'warn'}>{r.status}</Tag>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ───────────────────────── TABLES
function TablesView() {
  const meta = {
    open:     { label:'Open',     bg:'var(--surface-strong)', border:'0.5px solid var(--line)', fg:'var(--ink)' },
    reserved: { label:'Reserved', bg:'rgba(184,137,58,0.14)', border:'0.5px solid rgba(184,137,58,0.4)', fg:'#8a6320' },
    seated:   { label:'Seated',   bg:'linear-gradient(135deg,var(--accent),var(--accent-deep))', border:'none', fg:'#fff' },
  };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(440px, 1fr))', gap:20 }}>
      <Panel title="Floor plan · live">
        <div style={{ overflowX:'auto', padding:20 }}>
        <div style={{ position:'relative', height:440, width:460, borderRadius:'var(--r-md)', background:'rgba(36,24,32,0.03)', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:12, left:16, fontFamily:'"JetBrains Mono",monospace', fontSize:10, letterSpacing:'0.16em', color:'var(--ink-mute)' }}>WINDOW</div>
          <div style={{ position:'absolute', bottom:12, left:16, fontFamily:'"JetBrains Mono",monospace', fontSize:10, letterSpacing:'0.16em', color:'var(--ink-mute)' }}>BAR / PICKUP</div>
          {[
            { t:CRM_TABLES[0], x:40, y:60, s:80 },
            { t:CRM_TABLES[1], x:170, y:50, s:100 },
            { t:CRM_TABLES[2], x:320, y:60, s:80 },
            { t:CRM_TABLES[3], x:40, y:200, s:80 },
            { t:CRM_TABLES[4], x:170, y:200, s:100 },
            { t:CRM_TABLES[5], x:330, y:190, s:110 },
          ].map(({t,x,y,s}) => {
            const m = meta[t.status];
            return (
              <div key={t.id} style={{ position:'absolute', left:x, top:y, width:s, height:s*0.72, borderRadius:14, background:m.bg, border:m.border, color:m.fg, boxShadow: t.status==='seated'?'0 8px 20px rgba(185,89,121,0.3)':'var(--shadow-sm)', padding:12, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:800, fontSize:15 }}>{t.id}</span>
                  <span style={{ fontSize:11, opacity:0.8 }}>{t.seats}p</span>
                </div>
                <div style={{ fontSize:11, fontWeight:600, opacity:0.85 }}>{t.who || m.label}</div>
              </div>
            );
          })}
        </div>
        </div>
      </Panel>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div style={{ display:'flex', gap:12 }}>
          <KpiCard label="Open" value={CRM_TABLES.filter(t=>t.status==='open').length} icon="check"/>
          <KpiCard label="Seated" value={CRM_TABLES.filter(t=>t.status==='seated').length} icon="user"/>
          <KpiCard label="Reserved" value={CRM_TABLES.filter(t=>t.status==='reserved').length} icon="clock"/>
        </div>
        <Panel title="All tables">
          {CRM_TABLES.map((t,i,a) => (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom:i<a.length-1?'0.5px solid var(--line)':'none' }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13 }}>{t.id}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:700 }}>{t.seats} seats</div><div style={{ fontSize:12, color:'var(--ink-mute)' }}>{t.who || 'Available'}{t.until?` · until ${t.until}`:''}</div></div>
              <Tag kind={t.status==='open'?'success':t.status==='seated'?'accent':'warn'}>{t.status}</Tag>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

// ───────────────────────── MENU
function MenuView() {
  const [menu, setMenu] = React.useState(CRM_MENU);
  const toggle = (id) => setMenu(m => m.map(x => x.id===id ? {...x, available:!x.available} : x));
  return (
    <Panel title="Menu & availability" action={<Btn size="sm" kind="primary" icon="plus">New item</Btn>}>
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 90px 110px 120px', padding:'12px 20px', borderBottom:'0.5px solid var(--line)', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ink-mute)' }}>
        <span>Item</span><span>Category</span><span>Price</span><span>Sold today</span><span>Available</span>
      </div>
      {menu.map((d,i,a) => (
        <div key={d.id} style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 90px 110px 120px', alignItems:'center', padding:'14px 20px', borderBottom:i<a.length-1?'0.5px solid var(--line)':'none', opacity:d.available?1:0.55 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="coffee" size={16}/></div>
            <span style={{ fontSize:14, fontWeight:700 }}>{d.name}</span>
          </div>
          <span style={{ fontSize:13, color:'var(--ink-soft)' }}>{d.cat}</span>
          <span style={{ fontSize:14, fontWeight:700 }}>${d.price.toFixed(2)}</span>
          <span style={{ fontSize:13, color:'var(--ink-soft)' }}>{d.sold}</span>
          <div onClick={() => toggle(d.id)} style={{ width:46, height:26, borderRadius:999, background: d.available?'var(--accent-deep)':'rgba(36,24,32,0.15)', cursor:'pointer', position:'relative', transition:'background .2s' }}>
            <div style={{ position:'absolute', top:3, left: d.available?23:3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
          </div>
        </div>
      ))}
    </Panel>
  );
}

// ───────────────────────── MEMBERS
function MembersView() {
  const tierColor = { Gold:'#b8893a', Silver:'#8a8a8a', Bronze:'#a87446' };
  return (
    <Panel title={`Loyalty members · ${CRM_MEMBERS.length}`} action={<div style={{ display:'flex', gap:8, alignItems:'center', color:'var(--ink-mute)', fontSize:13 }}><Icon name="user" size={15}/> 312 total</div>}>
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1.2fr 90px 100px', padding:'12px 20px', borderBottom:'0.5px solid var(--line)', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ink-mute)' }}>
        <span>Member</span><span>Tier</span><span>Stamps</span><span>Visits</span><span>Spend</span>
      </div>
      {CRM_MEMBERS.map((c,i,a) => (
        <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1.2fr 90px 100px', alignItems:'center', padding:'14px 20px', borderBottom:i<a.length-1?'0.5px solid var(--line)':'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent-deep))', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13 }}>{c.name.split(' ').map(x=>x[0]).join('')}</div>
            <span style={{ fontSize:14, fontWeight:700 }}>{c.name}</span>
          </div>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:tierColor[c.tier] }}><Sakura size={14} color={tierColor[c.tier]}/>{c.tier}</span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ flex:1, maxWidth:90 }}><Progress value={c.stamps} max={10}/></div><span style={{ fontSize:12, color:'var(--ink-mute)' }}>{c.stamps}/10</span></div>
          <span style={{ fontSize:13, color:'var(--ink-soft)' }}>{c.visits}</span>
          <span style={{ fontSize:14, fontWeight:700 }}>${c.spend}</span>
        </div>
      ))}
    </Panel>
  );
}

// ───────────────────────── SUBSCRIPTIONS
function SubsView() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:16 }}>
        <KpiCard label="Active subscriptions" value="42" delta="+5" icon="repeat"/>
        <KpiCard label="Bags this week" value="28" icon="bean"/>
        <KpiCard label="Monthly recurring" value="$924" delta="+9%" icon="card"/>
      </div>
      <Panel title="Subscriptions" action={<Btn size="sm" kind="ghost">Export</Btn>}>
        <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr 1.3fr 1fr 110px', padding:'12px 20px', borderBottom:'0.5px solid var(--line)', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ink-mute)' }}>
          <span>Member</span><span>Plan</span><span>Bean</span><span>Next ship</span><span>Status</span>
        </div>
        {CRM_SUBS.map((s,i,a) => (
          <div key={s.id} style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr 1.3fr 1fr 110px', alignItems:'center', padding:'14px 20px', borderBottom:i<a.length-1?'0.5px solid var(--line)':'none' }}>
            <span style={{ fontSize:14, fontWeight:700 }}>{s.name}</span>
            <span style={{ fontSize:13, color:'var(--ink-soft)' }}>{s.plan}</span>
            <span style={{ fontSize:13, color:'var(--ink-soft)' }}>{s.bean}</span>
            <span style={{ fontSize:13, color:'var(--ink-soft)' }}>{s.next}</span>
            <Tag kind={s.status==='active'?'success':'neutral'}>{s.status}</Tag>
          </div>
        ))}
      </Panel>
    </div>
  );
}

Object.assign(window, { CRM_ORDERS, CRM_TABLES, CRM_MENU, CRM_MEMBERS, CRM_SUBS, StatusPill, KpiCard, Panel, Dashboard, OrdersView, ReservationsView, TablesView, MenuView, MembersView, SubsView });
