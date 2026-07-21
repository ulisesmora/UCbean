// desktop.jsx — Around the Bean · desktop marketing + ordering site

const DRINKS = [
  { id:'pourover',  name:'Pour Over',     price:6.50, cat:'Filter', origin:'Ethiopia Yirgacheffe', notes:'Floral · bergamot · honey' },
  { id:'latte',     name:'Latte',         price:5.00, cat:'Espresso', origin:'House blend', notes:'Chocolate · steamed milk' },
  { id:'iced-am',   name:'Iced Americano',price:4.50, cat:'Iced', origin:'House blend', notes:'Smooth · low acid' },
  { id:'cortado',   name:'Cortado',       price:4.50, cat:'Espresso', origin:'House blend', notes:'Balanced · warm milk' },
  { id:'yuzu-am',   name:'Yuzu Americano',price:5.50, cat:'Iced', origin:'Colombia', notes:'Korean citrus · bright' },
  { id:'dalgona',   name:'Dalgona Latte', price:6.00, cat:'Iced', origin:'House blend', notes:'Whipped · sweet' },
  { id:'hojicha',   name:'Hojicha Latte', price:5.50, cat:'Espresso', origin:'Kyoto tea', notes:'Roasted green tea · oat' },
  { id:'geisha',    name:'Panama Geisha', price:7.50, cat:'Filter', origin:'Panama', notes:'Jasmine · stone fruit' },
];

const ORIGINS = [
  { country:'Ethiopia', note:'Yirgacheffe', flavor:'Floral · citrus' },
  { country:'Colombia', note:'Huila', flavor:'Caramel · red apple' },
  { country:'Panama', note:'Geisha', flavor:'Jasmine · peach' },
  { country:'Korea', note:'House roast', flavor:'Yuzu · misugaru' },
];

function useReveal() {
  React.useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}

// ─────────────────────────────────────────── NAV
function NavBar({ onOrder }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [['Menu','#menu'],['Reserve','#reserve'],['Rewards','#rewards'],['Beans','#subscribe'],['Visit','#visit']];
  return (
    <div style={{ position:'sticky', top:0, zIndex:50, transition:'all .3s ease',
      background: scrolled ? 'rgba(255,252,253,0.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
      borderBottom: scrolled ? '0.5px solid var(--line)' : '0.5px solid transparent',
    }}>
      <div className="wrap" style={{ height:74, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="#top" style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Logo size={42} color="var(--ink)"/>
          <div style={{ lineHeight:1 }}>
            <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.01em', whiteSpace:'nowrap' }}>Around the Bean</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--accent-deep)', marginTop:4 }}>· World ·</div>
          </div>
        </a>
        <nav style={{ display:'flex', alignItems:'center', gap:34 }}>
          {links.map(([label, href]) => (
            <a key={href} href={href} style={{ fontSize:14, fontWeight:600, color:'var(--ink-soft)' }}
              onMouseEnter={e=>e.currentTarget.style.color='var(--accent-deep)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--ink-soft)'}>{label}</a>
          ))}
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Btn kind="ghost" size="sm">Sign in</Btn>
          <Btn kind="primary" size="sm" icon="coffee" onClick={onOrder}>Order now</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── HERO
function Hero({ onOrder }) {
  return (
    <div id="top" style={{ position:'relative', overflow:'hidden' }}>
      {/* floating petals */}
      {[
        {l:'8%', t:120, s:26, d:'0s'}, {l:'22%', t:330, s:18, d:'1.2s'}, {l:'70%', t:90, s:22, d:'.6s'},
        {l:'88%', t:280, s:30, d:'1.8s'}, {l:'54%', t:380, s:16, d:'.9s'},
      ].map((p,i) => (
        <div key={i} style={{ position:'absolute', left:p.l, top:p.t, opacity:0.5, animation:`floaty ${5+i}s ease-in-out infinite`, animationDelay:p.d, pointerEvents:'none' }}>
          <Sakura size={p.s} color="var(--accent)"/>
        </div>
      ))}
      <div className="wrap" style={{ display:'grid', gridTemplateColumns:'1.05fr 0.95fr', gap:48, alignItems:'center', padding:'56px 32px 80px' }}>
        {/* left */}
        <div className="reveal in">
          <Tag kind="accent" size="md" style={{ marginBottom:22 }}><Sakura size={13} color="var(--accent-deep)"/> Now open · UBC Vancouver</Tag>
          <h1 style={{ fontSize:72, lineHeight:0.98, fontWeight:800, letterSpacing:'-0.03em', margin:'0 0 6px' }}>
            Coffee from<br/>around the<br/><span style={{ fontFamily:'"Instrument Serif", serif', fontStyle:'italic', fontWeight:400, color:'var(--accent-deep)' }}>world.</span>
          </h1>
          <p style={{ fontSize:18, lineHeight:1.6, color:'var(--ink-soft)', maxWidth:460, margin:'18px 0 32px' }}>
            A little café at the edge of campus. Single-origin beans, Korean-inspired drinks, and a reservation app that hands you your cup the minute you walk in.
          </p>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <Btn kind="primary" size="lg" icon="clock" onClick={onOrder}>Reserve a coffee</Btn>
            <Btn kind="glass" size="lg" iconRight="arrow"><a href="#menu">See the menu</a></Btn>
          </div>
          <div style={{ display:'flex', gap:40, marginTop:44 }}>
            {[['12','drinks on the menu'],['4','origins, rotating'],['15 min','pickup windows']].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em' }}>{n}</div>
                <div style={{ fontSize:12, color:'var(--ink-mute)', marginTop:2, maxWidth:90 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* right — stacked photo composition */}
        <div className="reveal in" style={{ position:'relative', height:560 }}>
          <div style={{ position:'absolute', top:0, right:0, width:'78%', height:380, borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--shadow-lg)' }}>
            <PhotoSlot caption="Pour over bar" h={380} radius={0}/>
          </div>
          <div style={{ position:'absolute', bottom:0, left:0, width:'56%', height:260, borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--shadow-lg)', border:'4px solid #fff' }}>
            <PhotoSlot caption="The café" h={260} radius={0}/>
          </div>
          {/* floating drink card */}
          <div style={{ position:'absolute', bottom:40, right:-6, width:200 }}>
            <Glass strong pad={14} style={{ animation:'floaty 6s ease-in-out infinite' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,var(--accent),var(--accent-deep))', display:'flex', alignItems:'center', justifyContent:'center' }}><Sakura size={20} color="#fff"/></div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800 }}>Yuzu Americano</div>
                  <div style={{ fontSize:11, color:'var(--ink-mute)' }}>Korean citrus · $5.50</div>
                </div>
              </div>
            </Glass>
          </div>
          {/* seal */}
          <div style={{ position:'absolute', top:-12, left:'46%' }}>
            <Logo size={92} color="var(--accent-deep)" bg="#fff"/>
          </div>
        </div>
      </div>
      {/* marquee */}
      <Marquee/>
    </div>
  );
}

function Marquee() {
  const items = ['Single origin','★','Reserve & skip the line','★','Roasted weekly','★','Korean-inspired','★','Earn sakura stamps','★','UBC Vancouver','★'];
  const row = [...items, ...items];
  return (
    <div style={{ borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', background:'rgba(255,252,253,0.5)', overflow:'hidden', padding:'14px 0' }}>
      <div style={{ display:'flex', gap:0, width:'max-content', animation:'drift 26s linear infinite' }}>
        {row.map((t,i) => (
          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:0, padding:'0 22px', fontSize:14, fontWeight: t==='★'?400:700, letterSpacing: t==='★'?0:'0.04em', color: t==='★'?'var(--accent)':'var(--ink-soft)', whiteSpace:'nowrap', fontFamily: t==='★'?'inherit':'"JetBrains Mono", monospace', textTransform: t==='★'?'none':'uppercase' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── STORY
function Story() {
  const vals = [
    { icon:'map', title:'Sourced widely', body:'Beans from Ethiopia, Colombia, Panama and small Korean roasters — rotating with the seasons.' },
    { icon:'coffee', title:'Made carefully', body:'Every cup is pulled to order. Pour overs are weighed, timed, and poured by hand.' },
    { icon:'clock', title:'Served on time', body:'Reserve a 15-minute pickup window in the app. Walk in, give your name, leave with your cup.' },
  ];
  return (
    <div id="about" className="wrap reveal" style={{ padding:'90px 32px 30px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Our story</div>
          <h2 style={{ fontSize:44, fontWeight:800, letterSpacing:'-0.025em', lineHeight:1.05, margin:'14px 0 18px' }}>
            One small bar,<br/>the whole <span style={{ fontFamily:'"Instrument Serif", serif', fontStyle:'italic', fontWeight:400, color:'var(--accent-deep)' }}>world</span> in a cup.
          </h2>
          <p style={{ fontSize:16, lineHeight:1.7, color:'var(--ink-soft)', margin:'0 0 16px' }}>
            Around the Bean started as a wandering idea — what if a single coffee bar could hold flavours from every corner of the map? We chase harvests across continents, roast them gently, and pour them under cherry blossoms in Vancouver.
          </p>
          <p style={{ fontSize:16, lineHeight:1.7, color:'var(--ink-soft)', margin:0 }}>
            The result is a menu that travels: bright Ethiopian pour overs, a Korean yuzu americano, a dalgona built the old way. No rush, no queue — just good coffee, reserved for the minute you want it.
          </p>
        </div>
        <div style={{ position:'relative' }}>
          <div style={{ borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--shadow-lg)' }}>
            <PhotoSlot caption="Roasting · small batch" h={420} radius={0}/>
          </div>
          <Glass strong pad={18} style={{ position:'absolute', bottom:-24, left:-24, width:230 }}>
            <Logo size={40} color="var(--accent-deep)"/>
            <div style={{ fontSize:13, fontWeight:700, marginTop:10 }}>Est. 2024 · Vancouver</div>
            <div style={{ fontSize:12, color:'var(--ink-mute)', marginTop:2 }}>Family-run, two baristas, one roaster.</div>
          </Glass>
        </div>
      </div>
      {/* values */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginTop:80 }}>
        {vals.map(v => (
          <Card key={v.title} pad={26}>
            <div style={{ width:50, height:50, borderRadius:16, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={v.icon} size={24}/></div>
            <div style={{ fontSize:19, fontWeight:800, marginTop:16 }}>{v.title}</div>
            <div style={{ fontSize:14, lineHeight:1.6, color:'var(--ink-soft)', marginTop:8 }}>{v.body}</div>
          </Card>
        ))}
      </div>
      {/* origins strip */}
      <div style={{ marginTop:26, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {ORIGINS.map(o => (
          <div key={o.country} style={{ padding:'18px 20px', borderRadius:'var(--r-lg)', border:'0.5px solid var(--line)', background:'rgba(255,252,253,0.6)' }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--accent-deep)' }}>{o.country}</div>
            <div style={{ fontSize:16, fontWeight:800, marginTop:6 }}>{o.note}</div>
            <div style={{ fontSize:12, color:'var(--ink-mute)', marginTop:3 }}>{o.flavor}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── SPACE
function Space() {
  return (
    <div id="space" className="wrap reveal" style={{ padding:'70px 32px' }}>
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--accent-deep)' }}>The space</div>
        <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:'-0.025em', margin:'12px 0 0' }}>Made for slow mornings</h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gridTemplateRows:'200px 200px', gap:16 }}>
        <div style={{ gridRow:'1 / span 2', borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'var(--shadow-md)' }}><PhotoSlot caption="Main room" h="100%" radius={0}/></div>
        <div style={{ borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'var(--shadow-md)' }}><PhotoSlot caption="Window seats" h="100%" radius={0}/></div>
        <div style={{ borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'var(--shadow-md)' }}><PhotoSlot caption="The bar" h="100%" radius={0}/></div>
        <div style={{ borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'var(--shadow-md)' }}><PhotoSlot caption="Roaster" h="100%" radius={0}/></div>
        <div style={{ borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'var(--shadow-md)' }}><PhotoSlot caption="Patio" h="100%" radius={0}/></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── MENU
function MenuPreview({ onOrder }) {
  const [cat, setCat] = React.useState('All');
  const cats = ['All','Espresso','Iced','Filter'];
  const items = cat === 'All' ? DRINKS : DRINKS.filter(d => d.cat === cat);
  return (
    <div id="menu" className="reveal" style={{ background:'rgba(255,252,253,0.55)', borderTop:'0.5px solid var(--line)', borderBottom:'0.5px solid var(--line)', padding:'80px 0' }}>
      <div className="wrap">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:30, flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--accent-deep)' }}>The menu</div>
            <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:'-0.025em', margin:'12px 0 0' }}>What we're pouring</h2>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ padding:'9px 18px', borderRadius:999, border:'0.5px solid var(--line-strong)', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700,
                background: cat===c ? 'var(--ink)' : 'transparent', color: cat===c ? '#fff' : 'var(--ink-soft)', transition:'all .2s' }}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18 }}>
          {items.map(d => (
            <Card key={d.id} pad={0} style={{ overflow:'hidden' }}>
              <div style={{ position:'relative' }}>
                <PhotoSlot caption={d.cat} h={150} radius={0}/>
                <div style={{ position:'absolute', top:10, right:10 }}><Tag kind="dark" style={{ background:'rgba(36,24,32,0.82)', color:'#fff' }}>${d.price.toFixed(2)}</Tag></div>
              </div>
              <div style={{ padding:16 }}>
                <div style={{ fontSize:16, fontWeight:800 }}>{d.name}</div>
                <div style={{ fontSize:12, color:'var(--accent-deep)', fontWeight:600, marginTop:3 }}>{d.origin}</div>
                <div style={{ fontSize:12, color:'var(--ink-mute)', marginTop:6, lineHeight:1.4 }}>{d.notes}</div>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:34 }}>
          <Btn kind="primary" size="lg" icon="coffee" onClick={onOrder}>Order the full menu</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── RESERVE
function ReserveExplain({ onOrder }) {
  const steps = [
    { n:'01', icon:'menu', title:'Pick your drink', body:'Browse the full menu and build your order in seconds.' },
    { n:'02', icon:'clock', title:'Lock a 15-min window', body:'Choose the exact minute you want it ready. We hold it ±5 minutes.' },
    { n:'03', icon:'check', title:'Walk in & grab it', body:'Skip the queue. Give your name, take your cup, get on with your day.' },
  ];
  return (
    <div id="reserve" className="wrap reveal" style={{ padding:'90px 32px' }}>
      <div style={{ position:'relative', borderRadius:'var(--r-xl)', overflow:'hidden', padding:'56px 56px',
        background:`radial-gradient(400px 300px at 85% 15%, rgba(255,255,255,0.22) 0%, transparent 70%), linear-gradient(150deg, var(--accent) 0%, var(--accent-deep) 100%)`, color:'#fff', boxShadow:'0 24px 60px rgba(185,89,121,0.35)' }}>
        <div style={{ position:'absolute', top:0, right:0, opacity:0.35 }}><SakuraBranch width={420} height={130}/></div>
        <div style={{ maxWidth:560, position:'relative', zIndex:1 }}>
          <Tag kind="dark" size="md" style={{ background:'rgba(255,255,255,0.22)', color:'#fff', marginBottom:18 }}>Reserve · drink · leave</Tag>
          <h2 style={{ fontSize:46, fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.02, margin:'0 0 14px' }}>Your coffee, ready the minute you are.</h2>
          <p style={{ fontSize:17, lineHeight:1.6, opacity:0.92, margin:0 }}>No more waiting at the counter. Reserve a pickup time from your phone and your cup is waiting when you arrive.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginTop:44, position:'relative', zIndex:1 }}>
          {steps.map(s => (
            <div key={s.n} style={{ background:'rgba(255,255,255,0.12)', border:'0.5px solid rgba(255,255,255,0.25)', borderRadius:'var(--r-lg)', padding:24, backdropFilter:'blur(8px)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={s.icon} size={22} color="#fff"/></div>
                <span style={{ fontFamily:'"JetBrains Mono", monospace', fontSize:13, opacity:0.7 }}>{s.n}</span>
              </div>
              <div style={{ fontSize:18, fontWeight:800, marginTop:16 }}>{s.title}</div>
              <div style={{ fontSize:14, lineHeight:1.55, opacity:0.9, marginTop:6 }}>{s.body}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:36, position:'relative', zIndex:1 }}>
          <Btn kind="glass" size="lg" iconRight="arrow" onClick={onOrder} style={{ background:'#fff', color:'var(--accent-deep)' }}>Reserve your coffee</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── REWARDS
function Rewards({ onOrder }) {
  const tiers = [
    { t:'Bronze', range:'0–3 stamps', perk:'Standard menu access' },
    { t:'Silver', range:'4–7 stamps', perk:'10% off all beans' },
    { t:'Gold',   range:'8+ stamps',  perk:'Priority slots · secret menu' },
  ];
  return (
    <div id="rewards" className="wrap reveal" style={{ padding:'70px 32px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'0.9fr 1.1fr', gap:56, alignItems:'center' }}>
        {/* loyalty card visual */}
        <div style={{ position:'relative' }}>
          <div style={{ borderRadius:'var(--r-xl)', padding:'28px 28px 24px', color:'#fff', position:'relative', overflow:'hidden',
            background:`radial-gradient(220px 180px at 80% 20%, rgba(255,255,255,0.22) 0%, transparent 70%), linear-gradient(150deg, var(--accent) 0%, var(--accent-deep) 100%)`, boxShadow:'0 20px 50px rgba(185,89,121,0.35)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', opacity:0.8 }}>Sakura card</div>
                <div style={{ fontSize:24, fontWeight:800, marginTop:4 }}>Joon Park</div>
              </div>
              <Logo size={48} color="rgba(255,255,255,0.95)"/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginTop:26 }}>
              {Array.from({length:10}).map((_,i) => (
                <div key={i} style={{ aspectRatio:'1', borderRadius:'50%', background: i<7 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {i<7 && <Sakura size={16} color="var(--accent-deep)"/>}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:22 }}>
              <div style={{ fontSize:13, opacity:0.9 }}>7 / 10 · 3 to a free pour over</div>
              <Tag kind="dark" style={{ background:'rgba(255,255,255,0.22)', color:'#fff' }}>Silver</Tag>
            </div>
          </div>
        </div>
        {/* copy + tiers */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Rewards</div>
          <h2 style={{ fontSize:42, fontWeight:800, letterSpacing:'-0.025em', margin:'12px 0 14px' }}>Every cup earns a blossom.</h2>
          <p style={{ fontSize:16, lineHeight:1.65, color:'var(--ink-soft)', margin:'0 0 26px', maxWidth:460 }}>
            Collect a sakura stamp with every drink. Ten blossoms gets you a free pour over — and climbing tiers unlocks bean discounts, priority pickup slots, and our off-menu specials.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {tiers.map(t => (
              <div key={t.t} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 18px', borderRadius:'var(--r-md)', background:'rgba(255,252,253,0.7)', border:'0.5px solid var(--line)' }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}><Sakura size={20} color="var(--accent-deep)"/></div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:800 }}>{t.t}</div>
                  <div style={{ fontSize:12, color:'var(--ink-mute)' }}>{t.range}</div>
                </div>
                <div style={{ fontSize:13, color:'var(--ink-soft)', fontWeight:600 }}>{t.perk}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── SUBSCRIBE
function Subscribe() {
  const plans = [
    { id:'weekly', label:'Weekly', price:24, tag:'Most popular', best:true },
    { id:'biweekly', label:'Bi-weekly', price:22, tag:'Steady sipper' },
    { id:'monthly', label:'Monthly', price:20, tag:'Casual' },
  ];
  const [sel, setSel] = React.useState('weekly');
  return (
    <div id="subscribe" className="reveal" style={{ background:'rgba(255,252,253,0.55)', borderTop:'0.5px solid var(--line)', borderBottom:'0.5px solid var(--line)', padding:'80px 0' }}>
      <div className="wrap">
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Beans, on repeat</div>
          <h2 style={{ fontSize:42, fontWeight:800, letterSpacing:'-0.025em', margin:'12px 0 8px' }}>Fresh beans at your door</h2>
          <p style={{ fontSize:16, color:'var(--ink-soft)', maxWidth:520, margin:'0 auto' }}>Roasted Monday, mailed Tuesday, brewing by Thursday. 250g of whatever we're most excited about. Cancel any time.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, maxWidth:860, margin:'0 auto' }}>
          {plans.map(p => (
            <Card key={p.id} pad={26} onClick={() => setSel(p.id)} style={{ position:'relative', textAlign:'center', cursor:'pointer',
              border: sel===p.id ? '2px solid var(--accent)' : '0.5px solid var(--line)',
              boxShadow: sel===p.id ? '0 16px 40px rgba(185,89,121,0.2)' : 'var(--shadow-sm)',
              transform: sel===p.id ? 'translateY(-4px)' : 'none', transition:'all .25s' }}>
              {p.best && <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)' }}><Tag kind="accent" style={{ boxShadow:'var(--shadow-sm)' }}>{p.tag}</Tag></div>}
              <div style={{ fontSize:14, fontWeight:700, color:'var(--ink-mute)', marginTop:p.best?6:0 }}>{p.label}</div>
              <div style={{ fontSize:48, fontWeight:800, letterSpacing:'-0.03em', color:'var(--accent-deep)', marginTop:8 }}>${p.price}</div>
              <div style={{ fontSize:12, color:'var(--ink-mute)' }}>per 250g delivery</div>
              <div style={{ marginTop:18 }}>
                <Btn full kind={sel===p.id ? 'primary':'ghost'} size="md">{sel===p.id ? 'Selected' : 'Choose'}</Btn>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:30 }}>
          <Btn kind="dark" size="lg" iconRight="arrow">Start subscription</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── VISIT
function Visit() {
  return (
    <div id="visit" className="wrap reveal" style={{ padding:'80px 32px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:28 }}>
        {/* map */}
        <Card pad={0} style={{ overflow:'hidden' }}>
          <div style={{ position:'relative', height:380, background:`
            repeating-linear-gradient(0deg, rgba(36,24,32,0.04) 0 1px, transparent 1px 28px),
            repeating-linear-gradient(90deg, rgba(36,24,32,0.04) 0 1px, transparent 1px 28px),
            linear-gradient(180deg, #fad9e2 0%, #fff5f7 100%)` }}>
            <div style={{ position:'absolute', top:0, bottom:0, left:'44%', width:18, background:'rgba(255,252,253,0.7)' }}/>
            <div style={{ position:'absolute', left:0, right:0, top:'56%', height:18, background:'rgba(255,252,253,0.7)' }}/>
            <div style={{ position:'absolute', top:'54%', left:'44%', transform:'translate(-50%,-100%)' }}>
              <div style={{ width:54, height:54, borderRadius:'50% 50% 50% 0', background:'linear-gradient(135deg,var(--accent),var(--accent-deep))', transform:'rotate(-45deg)', boxShadow:'0 14px 28px rgba(185,89,121,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ transform:'rotate(45deg)' }}><Sakura size={22} color="#fff"/></div>
              </div>
            </div>
            <div style={{ position:'absolute', top:14, left:16, fontFamily:'"JetBrains Mono",monospace', fontSize:10, letterSpacing:'0.16em', color:'var(--ink-mute)' }}>UBC CAMPUS</div>
          </div>
        </Card>
        {/* hours + address */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Visit us</div>
            <h2 style={{ fontSize:34, fontWeight:800, letterSpacing:'-0.02em', margin:'10px 0 0' }}>Come say hello</h2>
          </div>
          <Card pad={20}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-mute)' }}>Address</div>
            <div style={{ fontSize:17, fontWeight:700, marginTop:6, lineHeight:1.4 }}>2188 University Blvd<br/>UBC Vancouver, BC V6T 1Z4</div>
          </Card>
          <Card pad={0} style={{ overflow:'hidden' }}>
            {[['Mon – Fri','7:00 – 19:00', true],['Saturday','8:00 – 18:00', false],['Sunday','9:00 – 16:00', false]].map(([d,t,today],i,a) => (
              <div key={d} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom: i<a.length-1?'0.5px solid var(--line)':'none' }}>
                <span style={{ fontSize:14, fontWeight: today?700:500, color: today?'var(--ink)':'var(--ink-soft)' }}>{d}{today && <Tag kind="success" style={{ marginLeft:10 }}>Open now</Tag>}</span>
                <span style={{ fontSize:14, fontWeight:600, color: today?'var(--accent-deep)':'var(--ink-mute)' }}>{t}</span>
              </div>
            ))}
          </Card>
          <div style={{ display:'flex', gap:12 }}>
            <Btn kind="glass" icon="phone" full>Call us</Btn>
            <Btn kind="primary" iconRight="arrow" full>Directions</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── FOOTER
function Footer() {
  const cols = [
    ['Visit', ['Menu','Reserve','Find us','Hours']],
    ['Company', ['Our story','Roasting','Careers','Press']],
    ['Support', ['Contact','Rewards','Subscriptions','FAQ']],
  ];
  return (
    <footer style={{ background:'var(--surface-deep)', color:'#f5e9ee', paddingTop:56 }}>
      <div className="wrap" style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:40, paddingBottom:46 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Logo size={48} color="rgba(255,255,255,0.95)"/>
            <div>
              <div style={{ fontSize:17, fontWeight:800 }}>Around the Bean</div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--accent)', marginTop:3 }}>· World ·</div>
            </div>
          </div>
          <p style={{ fontSize:14, lineHeight:1.6, color:'rgba(245,233,238,0.6)', maxWidth:280, marginTop:16 }}>Coffee from around the world, poured under cherry blossoms in Vancouver.</p>
          <div style={{ marginTop:18 }}>
            <SakuraBranch width={220} height={56} color="rgba(232,155,176,0.5)" flowerColor="rgba(232,155,176,0.9)"/>
          </div>
        </div>
        {cols.map(([h, items]) => (
          <div key={h}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)' }}>{h}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
              {items.map(it => <a key={it} href="#" style={{ fontSize:14, color:'rgba(245,233,238,0.7)' }} onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='rgba(245,233,238,0.7)'}>{it}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)' }}>
        <div className="wrap" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 32px', fontSize:13, color:'rgba(245,233,238,0.5)' }}>
          <span>© 2026 Around the Bean · World. All rights reserved.</span>
          <span style={{ display:'flex', gap:20 }}><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Instagram</a></span>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────── APP
function App() {
  useReveal();
  const stageRef = React.useRef(null);
  const onOrder = () => { window.location.href = 'index.html'; };
  return (
    <div ref={stageRef}>
      <NavBar onOrder={onOrder}/>
      <Hero onOrder={onOrder}/>
      <Story/>
      <Space/>
      <MenuPreview onOrder={onOrder}/>
      <ReserveExplain onOrder={onOrder}/>
      <Rewards onOrder={onOrder}/>
      <Subscribe/>
      <Visit/>
      <Footer/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
