// screens.jsx — All screens for ubcbean (English, glass aesthetic)

const DRINKS = [
  { id:'americano', name:'Americano',     price:4.00, cat:'hot',    desc:'Double espresso, hot water.' },
  { id:'latte',     name:'Latte',         price:5.00, cat:'hot',    desc:'Espresso with steamed milk.' },
  { id:'cortado',   name:'Cortado',       price:4.50, cat:'hot',    desc:'Espresso, equal warm milk.' },
  { id:'flat',      name:'Flat White',    price:5.00, cat:'hot',    desc:'Velvet microfoam, ristretto.' },
  { id:'pourover',  name:'Pour Over',     price:6.50, cat:'filter', desc:'Single origin, V60.' },
  { id:'cold-brew', name:'Cold Brew',     price:5.50, cat:'iced',   desc:'18 hour steep. Black.' },
  { id:'iced-am',   name:'Iced Americano',price:4.50, cat:'iced',   desc:'Smooth, low acid, refreshing.' },
  { id:'dalgona',   name:'Dalgona Latte', price:6.00, cat:'iced',   desc:'Whipped coffee over milk.' },
  { id:'misugaru',  name:'Misugaru Latte',price:6.00, cat:'iced',   desc:'Roasted multigrain. Nutty.' },
  { id:'yuzu-am',   name:'Yuzu Americano',price:5.50, cat:'iced',   desc:'Korean citrus + espresso.' },
  { id:'hojicha',   name:'Hojicha Latte', price:5.50, cat:'hot',    desc:'Roasted green tea, oat milk.' },
  { id:'beans-eth', name:'Ethiopia Yirgacheffe', price:22.00, cat:'beans', desc:'Floral · bergamot · honey. 250g' },
  { id:'beans-geis',name:'Panama Geisha',         price:32.00, cat:'beans', desc:'Jasmine · stone fruit. 250g' },
  { id:'beans-hb',  name:'House Blend',            price:18.00, cat:'beans', desc:'Chocolate · walnut. 250g' },
];

// ────────────────── HOME ──────────────────
function HomeScreen({ go, points }) {
  return (
    <div style={{ minHeight:'100%', paddingBottom: 110 }}>
      {/* Header */}
      <div style={{ padding:'58px 20px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--ink-mute)' }}>Tuesday · 7:42 AM</div>
            <div style={{ fontSize:22, fontWeight:700, marginTop:2 }}>Good morning, Joon</div>
          </div>
          <Glass strong style={{ width:42, height:42, borderRadius:999, padding:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Icon name="bell" size={18} color="var(--ink)"/>
          </Glass>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ padding:'18px 20px 0' }}>
        <div style={{
          position:'relative', overflow:'hidden',
          borderRadius:'var(--r-xl)',
          background:`
            radial-gradient(220px 180px at 80% 20%, rgba(255,255,255,0.20) 0%, transparent 70%),
            linear-gradient(160deg, var(--accent) 0%, var(--accent-deep) 100%)`,
          color:'#fff',
          padding:'22px 22px 24px',
          boxShadow:'0 12px 40px rgba(139,69,19,0.30)',
        }}>
          <Tag kind="dark" style={{ background:'rgba(255,255,255,0.22)', color:'#fff' }}>● Open · 7 AM – 7 PM</Tag>
          <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.0, letterSpacing:'-0.02em', marginTop: 14 }}>
            Reserve.<br/>Drink.<br/><span style={{ fontFamily:'"Instrument Serif", serif', fontStyle:'italic', fontWeight:400 }}>Leave.</span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 12, lineHeight: 1.5, maxWidth: 260 }}>
            Pick your drink, lock a 15-minute pickup window, walk in and grab it.
          </div>
          <div style={{ marginTop: 18 }}>
            <Btn kind="glass" size="md" iconRight="arrow" onClick={() => go('reserve')} style={{ background:'rgba(255,255,255,0.95)', color:'var(--ink)' }}>
              Reserve a coffee
            </Btn>
          </div>
          {/* decorative bean */}
          <div style={{ position:'absolute', right:-26, bottom:-30, opacity:0.15 }}>
            <Icon name="bean" size={180} color="#fff" strokeWidth={1.4}/>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding:'14px 20px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <Card pad={14} onClick={() => go('order')}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ width:36, height:36, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name="menu" size={18}/>
            </div>
            <Icon name="chevron" size={16} color="var(--ink-mute)"/>
          </div>
          <div style={{ fontSize:14, fontWeight:700, marginTop:10 }}>Order menu</div>
          <div style={{ fontSize:11, color:'var(--ink-mute)', marginTop:2 }}>12 drinks · 3 beans</div>
        </Card>
        <Card pad={14} onClick={() => go('table')}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ width:36, height:36, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name="user" size={18}/>
            </div>
            <Icon name="chevron" size={16} color="var(--ink-mute)"/>
          </div>
          <div style={{ fontSize:14, fontWeight:700, marginTop:10 }}>Reserve seat</div>
          <div style={{ fontSize:11, color:'var(--ink-mute)', marginTop:2 }}>90-minute window</div>
        </Card>
      </div>

      {/* Stamps strip */}
      <div style={{ padding:'14px 20px 0' }}>
        <Card pad={16} onClick={() => go('loyalty')} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg, var(--accent), var(--accent-deep))', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <Icon name="star" size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-soft)' }}>Your stamps</div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{points} / 10</div>
            </div>
            <div style={{ marginTop:8 }}><Progress value={points} max={10}/></div>
            <div style={{ fontSize:11, color:'var(--ink-mute)', marginTop:6 }}>{10-points} drinks until your free pour over</div>
          </div>
        </Card>
      </div>

      {/* Featured drink */}
      <div style={{ padding:'18px 20px 0' }}>
        <SectionHeader eyebrow="Drink of the day" title="Ethiopia Yirgacheffe" action={<Tag kind="accent">+1 ★</Tag>} />
        <Card pad={0} style={{ overflow:'hidden' }}>
          <PhotoSlot caption="Yirgacheffe" h={170} radius={0}/>
          <div style={{ padding:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700 }}>Pour over · single origin</div>
              <div style={{ fontSize:12, color:'var(--ink-mute)', marginTop:2 }}>Floral · bergamot · honey</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18, fontWeight:700 }}>$6.50</span>
              <Btn size="sm" kind="primary" icon="plus" onClick={() => go('reserve')}>Reserve</Btn>
            </div>
          </div>
        </Card>
      </div>

      {/* The space */}
      <div style={{ padding:'18px 20px 0' }}>
        <SectionHeader eyebrow="The space" title="Made for slow mornings"/>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:8 }}>
          <PhotoSlot caption="Interior" h={170} radius="var(--r-md)"/>
          <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap:8 }}>
            <PhotoSlot caption="Bar" h={81} radius="var(--r-md)"/>
            <PhotoSlot caption="Roast" h={81} radius="var(--r-md)"/>
          </div>
        </div>
      </div>

      {/* Hours / location */}
      <div style={{ padding:'18px 20px 0' }}>
        <Glass pad={0} style={{ overflow:'hidden' }}>
          <ListRow
            leading={<div style={{ width:36, height:36, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="clock" size={18}/></div>}
            title="Open today" subtitle="Mon–Fri 7–7 · Sat 8–6 · Sun 9–4"
            trailing={<Tag kind="success">● Open</Tag>}
          />
          <ListRow
            leading={<div style={{ width:36, height:36, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="location" size={18}/></div>}
            title="2188 University Blvd" subtitle="UBC Vancouver · 4 min walk"
            trailing={<Icon name="chevron" size={16} color="var(--ink-mute)"/>}
            onClick={() => go('location')} divider={false}
          />
        </Glass>
      </div>

      <div style={{ padding:'24px 20px 0', textAlign:'center', color:'var(--ink-mute)', fontSize:11 }}>
        <span style={{ fontFamily:'"Instrument Serif", serif', fontStyle:'italic', fontSize:14 }}>ubcbean</span> · est. 2024 · Vancouver
      </div>
    </div>
  );
}

// ────────────────── ORDER ──────────────────
function OrderScreen({ go, cart, addToCart, removeFromCart, cartTotal, cartCount }) {
  const [cat, setCat] = React.useState('hot');
  const cats = [
    { id:'hot',    label:'Hot' },
    { id:'iced',   label:'Iced' },
    { id:'filter', label:'Filter' },
    { id:'beans',  label:'Beans' },
  ];
  const items = DRINKS.filter(d => d.cat === cat);

  return (
    <div style={{ minHeight:'100%', paddingBottom: 130 }}>
      <div style={{ padding:'58px 20px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Menu</div>
            <div style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em', marginTop:4 }}>The list</div>
          </div>
          <Btn size="sm" kind="glass" icon="back" onClick={() => go('home')}>Back</Btn>
        </div>
      </div>

      <div style={{ padding:'8px 20px 12px' }}>
        <Segmented options={cats} value={cat} onChange={setCat} full/>
      </div>

      <div style={{ padding:'4px 20px', display:'flex', flexDirection:'column', gap:10 }}>
        {items.map(d => {
          const inCart = cart.find(c => c.id === d.id);
          return (
            <Card key={d.id} pad={14} style={{ display:'flex', gap:14, alignItems:'center' }}>
              <PhotoSlot h={62} w={62} radius={14} style={{ flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{d.name}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>${d.price.toFixed(2)}</div>
                </div>
                <div style={{ fontSize:12, color:'var(--ink-mute)', marginTop:3, lineHeight:1.4 }}>{d.desc}</div>
                <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
                  {inCart ? (
                    <div style={{ display:'flex', alignItems:'center', gap:0, borderRadius:999, background:'var(--ink)', padding:3 }}>
                      <button onClick={() => removeFromCart(d.id)} style={{ width:28, height:28, borderRadius:'50%', border:'none', background:'transparent', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="minus" size={14} color="#fff"/></button>
                      <span style={{ minWidth:24, textAlign:'center', color:'#fff', fontSize:13, fontWeight:700 }}>{inCart.qty}</span>
                      <button onClick={() => addToCart(d)} style={{ width:28, height:28, borderRadius:'50%', border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="plus" size={14} color="#fff"/></button>
                    </div>
                  ) : (
                    <Btn size="sm" kind="soft" icon="plus" onClick={() => addToCart(d)}>Add</Btn>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {cartCount > 0 && (
        <div style={{ position:'absolute', bottom:90, left:14, right:14, zIndex:50 }}>
          <div onClick={() => go('reserve')} style={{
            cursor:'pointer',
            borderRadius: 18,
            padding: '14px 18px',
            background: 'linear-gradient(180deg, var(--accent) 0%, var(--accent-deep) 100%)',
            color:'#fff',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            boxShadow: '0 12px 30px rgba(139,69,19,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700 }}>{cartCount}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>Continue to reserve</div>
                <div style={{ fontSize:11, opacity:0.85 }}>${cartTotal.toFixed(2)} · pickup time next</div>
              </div>
            </div>
            <Icon name="arrow" size={20} color="#fff"/>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────── RESERVE ──────────────────
function ReserveScreen({ go, cart, cartTotal, cartCount, addToCart, slot, setSlot, confirmReservation }) {
  const initial = cartCount === 0 ? 1 : 2;
  const [step, setStep] = React.useState(initial);

  const slots = [];
  for (let h = 7; h < 19; h++) {
    for (let m of [0, 15, 30, 45]) {
      if (h === 7 && m < 30) continue;
      const ampm = h < 12 ? 'AM' : 'PM';
      const hh = ((h + 11) % 12) + 1;
      slots.push({ id:`${h}:${m}`, label:`${hh}:${String(m).padStart(2,'0')} ${ampm}` });
    }
  }
  const busy = new Set(['8:0','8:15','8:30','12:0','12:15','15:30']);

  return (
    <div style={{ minHeight:'100%', paddingBottom: 110 }}>
      <div style={{ padding:'58px 20px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Reserve</div>
            <div style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em', marginTop:4 }}>Pick & lock</div>
          </div>
          <Btn size="sm" kind="glass" icon="back" onClick={() => go('home')}>Back</Btn>
        </div>
        <div style={{ marginTop:18 }}>
          <Steps steps={['Drink','Time','Pay']} current={step} />
        </div>
      </div>

      {step === 1 && (
        <div style={{ padding:'8px 20px' }}>
          <SectionHeader eyebrow="Step 1" title="Choose your drink" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {DRINKS.filter(d => d.cat !== 'beans').slice(0, 8).map(d => (
              <Card key={d.id} pad={12} onClick={() => { addToCart(d); setStep(2); }}>
                <PhotoSlot h={92} radius={12}/>
                <div style={{ fontSize:13, fontWeight:700, marginTop:10 }}>{d.name}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--accent-deep)' }}>${d.price.toFixed(2)}</span>
                  <Tag kind="neutral">+ Add</Tag>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ padding:'8px 20px' }}>
          <SectionHeader eyebrow="Step 2" title="Pick your minute" action={<Tag kind="neutral">15 min slots</Tag>}/>
          <Glass pad={14}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>Today · Tue, May 8</div>
              <div style={{ display:'flex', alignItems:'center', gap:14, fontSize:11, color:'var(--ink-mute)' }}>
                <span><span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:'var(--accent)', marginRight:6 }}></span>Yours</span>
                <span><span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:'rgba(28,24,20,0.10)', marginRight:6 }}></span>Taken</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6 }}>
              {slots.map(s => {
                const isBusy = busy.has(s.id);
                const isPicked = slot === s.id;
                return (
                  <button key={s.id} disabled={isBusy} onClick={() => setSlot(s.id)} style={{
                    padding:'10px 4px', borderRadius:10, border:'none', cursor: isBusy ? 'not-allowed' : 'pointer',
                    background: isPicked ? 'linear-gradient(180deg, var(--accent) 0%, var(--accent-deep) 100%)' : isBusy ? 'rgba(28,24,20,0.06)' : 'rgba(255,252,246,0.7)',
                    color: isPicked ? '#fff' : isBusy ? 'rgba(28,24,20,0.30)' : 'var(--ink)',
                    fontSize:11, fontWeight:600, fontFamily:'inherit',
                    boxShadow: isPicked ? '0 6px 14px rgba(139,69,19,0.25)' : 'none',
                    textDecoration: isBusy ? 'line-through' : 'none',
                  }}>{s.label}</button>
                );
              })}
            </div>
          </Glass>
          <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:12, color:'var(--ink-mute)' }}>{cartCount} item · ${cartTotal.toFixed(2)}</div>
            <Btn kind="primary" iconRight="arrow" disabled={!slot} onClick={() => setStep(3)}>{slot ? 'Continue to payment' : 'Pick a time'}</Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ padding:'8px 20px' }}>
          <SectionHeader eyebrow="Step 3" title="Confirm & pay"/>
          <Card pad={0} style={{ overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'0.5px solid var(--line)' }}>
              <div>
                <div style={{ fontSize:11, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700 }}>Pickup</div>
                <div style={{ fontSize:18, fontWeight:700, marginTop:2 }}>{slots.find(x => x.id === slot)?.label}</div>
              </div>
              <Tag kind="accent"><Icon name="clock" size={11}/> Today</Tag>
            </div>
            {cart.map(c => (
              <div key={c.id} style={{ padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'baseline', borderBottom:'0.5px solid var(--line)' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{c.name}</div>
                  <div style={{ fontSize:12, color:'var(--ink-mute)' }}>Qty {c.qty}</div>
                </div>
                <div style={{ fontSize:14, fontWeight:700 }}>${(c.price * c.qty).toFixed(2)}</div>
              </div>
            ))}
            <div style={{ padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--ink-soft)', fontWeight:600 }}>Total</span>
              <span style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.01em' }}>${cartTotal.toFixed(2)}</span>
            </div>
          </Card>

          <Card pad={14} style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:30, borderRadius:6, background:'linear-gradient(135deg, #1a1f71, #4a3aff)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:800, letterSpacing:'0.04em' }}>VISA</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Visa · 4242</div>
                <div style={{ fontSize:11, color:'var(--ink-mute)' }}>Expires 09/27</div>
              </div>
            </div>
            <Btn size="sm" kind="text">Change</Btn>
          </Card>

          <div style={{ marginTop:16 }}>
            <Btn full kind="primary" size="lg" iconRight="arrow" onClick={confirmReservation}>Pay ${cartTotal.toFixed(2)} · lock slot</Btn>
          </div>
          <div style={{ textAlign:'center', fontSize:11, color:'var(--ink-mute)', marginTop:10 }}>We hold your slot ±5 minutes either side.</div>
        </div>
      )}
    </div>
  );
}

function ReservedConfirm({ slot, cart, onClose }) {
  const slotLabel = (() => {
    if (!slot) return '';
    const [h, m] = slot.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${String(m).padStart(2,'0')} ${ampm}`;
  })();
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(28,24,20,0.50)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:18, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)' }}>
      <div style={{ width:'100%', maxWidth:340, animation:'fadeUp .35s ease' }}>
        <Glass strong pad={0} style={{ overflow:'hidden', borderRadius:24 }}>
          <div style={{ padding:'24px 22px 20px', textAlign:'center', background:'linear-gradient(180deg, var(--accent-soft) 0%, transparent 100%)' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), var(--accent-deep))', display:'inline-flex', alignItems:'center', justifyContent:'center', boxShadow:'0 12px 24px rgba(139,69,19,0.30)' }}>
              <Icon name="check" size={28} color="#fff" strokeWidth={2.6}/>
            </div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent-deep)', marginTop:14 }}>Reserved · #A24-{Math.floor(Math.random()*900+100)}</div>
            <div style={{ fontSize:34, fontWeight:800, letterSpacing:'-0.02em', marginTop:6 }}>{slotLabel}</div>
            <div style={{ fontSize:13, color:'var(--ink-soft)', marginTop:6 }}>Today · walk in & give your name</div>
          </div>
          <div style={{ padding:'14px 18px 18px' }}>
            <Btn full kind="primary" iconRight="arrow" onClick={onClose}>View pass</Btn>
          </div>
        </Glass>
      </div>
    </div>
  );
}

// ────────────────── TABLE ──────────────────
function TableScreen({ go, showToast }) {
  const [size, setSize] = React.useState(2);
  const [time, setTime] = React.useState(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const times = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];

  return (
    <div style={{ minHeight:'100%', paddingBottom: 110 }}>
      <div style={{ padding:'58px 20px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Seat</div>
            <div style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em', marginTop:4 }}>Hold a table</div>
            <div style={{ fontSize:13, color:'var(--ink-mute)', marginTop:4 }}>Free 90-minute window.</div>
          </div>
          <Btn size="sm" kind="glass" icon="back" onClick={() => go('home')}>Back</Btn>
        </div>
      </div>

      <div style={{ padding:'4px 20px' }}>
        <SectionHeader eyebrow="Party size" title="How many?"/>
        <Glass pad={6} style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:4 }}>
          {[1,2,3,4,5,6].map(n => (
            <button key={n} onClick={() => setSize(n)} style={{
              padding:'12px 0', borderRadius:10, border:'none', cursor:'pointer',
              background: size === n ? 'linear-gradient(180deg, var(--accent), var(--accent-deep))' : 'transparent',
              color: size === n ? '#fff' : 'var(--ink)',
              fontFamily:'inherit', fontSize:15, fontWeight:700,
              boxShadow: size === n ? '0 6px 14px rgba(139,69,19,0.25)' : 'none',
            }}>{n === 6 ? '6+' : n}</button>
          ))}
        </Glass>
      </div>

      <div style={{ padding:'18px 20px 4px' }}>
        <SectionHeader eyebrow="Time" title="Pick a slot"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
          {times.map(t => (
            <button key={t} onClick={() => setTime(t)} style={{
              padding:'12px 4px', borderRadius:12, border:'none', cursor:'pointer',
              background: time === t ? 'var(--ink)' : 'var(--surface-strong)',
              color: time === t ? '#fff' : 'var(--ink)',
              fontFamily:'inherit', fontSize:13, fontWeight:600,
              boxShadow: time === t ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              border: time === t ? 'none' : '0.5px solid var(--line)',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'18px 20px' }}>
        <SectionHeader eyebrow="Floor plan" title="Your suggested table"/>
        <Glass pad={16}>
          <div style={{ position:'relative', height:200, borderRadius:12, background:'rgba(28,24,20,0.04)', padding:14, overflow:'hidden' }}>
            <div style={{ position:'absolute', top:8, left:12, fontSize:9, color:'var(--ink-mute)', letterSpacing:'0.16em', fontWeight:700 }}>WINDOW</div>
            <div style={{ position:'absolute', bottom:8, left:12, fontSize:9, color:'var(--ink-mute)', letterSpacing:'0.16em', fontWeight:700 }}>BAR</div>
            <div style={{ position:'absolute', top:'50%', right:6, transform:'translateY(-50%) rotate(90deg)', fontSize:9, color:'var(--ink-mute)', letterSpacing:'0.16em', fontWeight:700 }}>DOOR</div>
            {[
              { id:'T1', x:18, y:30, w:42 },
              { id:'T2', x:88, y:30, w:60, picked:true },
              { id:'T3', x:178, y:30, w:42, busy:true },
              { id:'T4', x:18, y:108, w:42 },
              { id:'T5', x:88, y:108, w:42 },
              { id:'BAR',x:158, y:108, w:62 },
            ].map(t => (
              <div key={t.id} style={{
                position:'absolute', left:t.x, top:t.y, width:t.w, height:42,
                borderRadius:10,
                background: t.picked ? 'linear-gradient(180deg, var(--accent), var(--accent-deep))' : t.busy ? 'rgba(28,24,20,0.10)' : 'var(--surface-strong)',
                color: t.picked ? '#fff' : t.busy ? 'var(--ink-mute)' : 'var(--ink)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700,
                boxShadow: t.picked ? '0 6px 14px rgba(139,69,19,0.30)' : t.busy ? 'none' : 'var(--shadow-sm)',
                border: t.busy ? '0.5px dashed var(--line-strong)' : 'none',
                textDecoration: t.busy ? 'line-through' : 'none',
              }}>{t.id}{t.picked && ' ✓'}</div>
            ))}
          </div>
          <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:12, color:'var(--ink-mute)' }}>Suggested · Table 2 by the window</div>
            <Tag kind="success">Available</Tag>
          </div>
        </Glass>
      </div>

      <div style={{ padding:'8px 20px' }}>
        <Btn full kind="primary" size="lg" iconRight="arrow" disabled={!time} onClick={() => { setConfirmed(true); }}>{time ? `Hold T2 · ${size} · ${time}` : 'Pick a time'}</Btn>
      </div>

      {confirmed && (
        <div style={{ position:'absolute', inset:0, background:'rgba(28,24,20,0.50)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:18, backdropFilter:'blur(12px)' }}>
          <div style={{ width:'100%', maxWidth:320, animation:'fadeUp .35s ease' }}>
            <Glass strong pad={0} style={{ overflow:'hidden', borderRadius:24 }}>
              <div style={{ padding:'24px 22px 20px', textAlign:'center' }}>
                <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), var(--accent-deep))', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="check" size={28} color="#fff" strokeWidth={2.6}/>
                </div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent-deep)', marginTop:14 }}>Table held</div>
                <div style={{ fontSize:30, fontWeight:800, marginTop:6 }}>T2 · {time}</div>
                <div style={{ fontSize:13, color:'var(--ink-soft)', marginTop:6 }}>{size} {size===1?'guest':'guests'} · 90 min window</div>
              </div>
              <div style={{ padding:'14px 18px 18px' }}>
                <Btn full kind="primary" onClick={() => { setConfirmed(false); go('home'); }}>Done</Btn>
              </div>
            </Glass>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────── LOYALTY ──────────────────
function LoyaltyScreen({ go, points, history }) {
  const tier = points >= 8 ? { name:'Gold', color:'var(--gold, #b8893a)', next:'Top tier · all perks' } : points >= 4 ? { name:'Silver', color:'#8a8a8a', next:`${8-points} drinks until Gold` } : { name:'Bronze', color:'#a87446', next:`${4-points} drinks until Silver` };
  return (
    <div style={{ minHeight:'100%', paddingBottom: 110 }}>
      <div style={{ padding:'58px 20px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Rewards</div>
            <div style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em', marginTop:4 }}>Your stamps</div>
          </div>
        </div>
      </div>

      {/* Hero gradient card */}
      <div style={{ padding:'8px 20px 0' }}>
        <div style={{
          borderRadius:'var(--r-xl)',
          padding:'20px 22px',
          background:`
            radial-gradient(220px 180px at 80% 20%, rgba(255,255,255,0.20) 0%, transparent 70%),
            linear-gradient(160deg, var(--accent) 0%, var(--accent-deep) 100%)`,
          color:'#fff',
          boxShadow:'0 12px 40px rgba(139,69,19,0.30)',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <Tag kind="dark" style={{ background:'rgba(255,255,255,0.22)', color:'#fff' }}>{tier.name} member</Tag>
            <Tag kind="dark" style={{ background:'rgba(255,255,255,0.22)', color:'#fff' }}>{points} ★</Tag>
          </div>
          <div style={{ display:'inline-flex', alignItems:'baseline', gap:6, marginTop:14, whiteSpace:'nowrap' }}>
            <span style={{ fontSize:64, fontWeight:800, letterSpacing:'-0.04em', lineHeight:0.9 }}>{points}</span>
            <span style={{ fontSize:22, fontWeight:600, opacity:0.7 }}>/ 10</span>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ height:8, borderRadius:999, background:'rgba(255,255,255,0.22)', overflow:'hidden' }}>
              <div style={{ width:(points/10*100)+'%', height:'100%', background:'#fff', borderRadius:999, transition:'width .4s ease' }} />
            </div>
          </div>
          <div style={{ fontSize:13, marginTop:10, opacity:0.92 }}>{10 - points} drinks until your <span style={{ fontFamily:'"Instrument Serif", serif', fontStyle:'italic' }}>free pour over</span>.</div>
        </div>
      </div>

      {/* Stamp grid */}
      <div style={{ padding:'14px 20px 0' }}>
        <Card pad={16}>
          <SectionHeader eyebrow="Stamps" title="Collect 10"/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
            {Array.from({length:10}).map((_,i) => (
              <div key={i} style={{
                aspectRatio:'1',
                borderRadius:'50%',
                background: i < points ? 'linear-gradient(135deg, var(--accent), var(--accent-deep))' : 'rgba(28,24,20,0.06)',
                color:'#fff',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: i < points ? '0 4px 10px rgba(139,69,19,0.30)' : 'none',
              }}>{i < points ? <Icon name="star" size={18} color="#fff"/> : null}</div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tier cards */}
      <div style={{ padding:'14px 20px 0' }}>
        <SectionHeader eyebrow="Tier" title="Your perks"/>
        <Glass pad={0} style={{ overflow:'hidden' }}>
          {[
            { t:'Bronze', range:'0–3', perk:'Standard menu', active: tier.name === 'Bronze' },
            { t:'Silver', range:'4–7', perk:'10% off beans', active: tier.name === 'Silver' },
            { t:'Gold',   range:'8+',  perk:'Priority slots · secret menu', active: tier.name === 'Gold' },
          ].map((r, i, a) => (
            <div key={r.t} style={{ padding:'14px 16px', borderBottom: i < a.length-1 ? '0.5px solid var(--line)' : 'none', display:'flex', justifyContent:'space-between', alignItems:'center', background: r.active ? 'var(--accent-soft)' : 'transparent' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background: r.active ? 'var(--accent-deep)' : 'rgba(28,24,20,0.10)', color: r.active ? '#fff' : 'var(--ink-mute)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="star" size={14} color={r.active ? '#fff' : 'var(--ink-mute)'}/>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{r.t}</div>
                  <div style={{ fontSize:11, color:'var(--ink-mute)' }}>{r.range} stamps</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--ink-soft)', textAlign:'right', maxWidth:160 }}>{r.perk}</div>
            </div>
          ))}
        </Glass>
      </div>

      {/* History */}
      <div style={{ padding:'14px 20px 0' }}>
        <SectionHeader eyebrow="Recent" title="Your activity" action={<Tag kind="neutral">Last 30 days</Tag>}/>
        <Card pad={0} style={{ overflow:'hidden' }}>
          {history.map((h, i) => (
            <ListRow key={i}
              leading={<div style={{ width:34, height:34, borderRadius:10, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="coffee" size={16}/></div>}
              title={h.name} subtitle={h.date}
              trailing={<span style={{ fontSize:13, fontWeight:700, color: h.stamps > 0 ? 'var(--accent-deep)' : 'var(--ink-mute)' }}>{h.stamps > 0 ? '+' : ''}{h.stamps}★</span>}
              divider={i < history.length - 1}
            />
          ))}
        </Card>
      </div>

      <div style={{ padding:'18px 20px' }}>
        <Btn full kind="dark" iconRight="arrow" onClick={() => go('rewards')}>Browse rewards</Btn>
      </div>
    </div>
  );
}

// ────────────────── REWARDS ──────────────────
function RewardsScreen({ go, points, redeem }) {
  const items = [
    { id:'free-pour', name:'Free Pour Over', cost:10, desc:'Any single origin.', icon:'coffee' },
    { id:'free-latte', name:'Free Latte',    cost:8,  desc:'Hot or iced.',       icon:'coffee' },
    { id:'beans-20',  name:'20% off beans',  cost:6,  desc:'Once. Any 250g bag.', icon:'bean' },
    { id:'mug',       name:'Ceramic Mug',    cost:14, desc:'Stoneware. Limited.', icon:'gift' },
    { id:'tote',      name:'Canvas Tote',    cost:12, desc:'Heavy duck cotton.',  icon:'gift' },
    { id:'class',     name:'Barista Class',  cost:25, desc:'2hr · Saturdays.',    icon:'sparkle' },
  ];
  return (
    <div style={{ minHeight:'100%', paddingBottom: 110 }}>
      <div style={{ padding:'58px 20px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Rewards shop</div>
            <div style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em', marginTop:4 }}>Redeem stars</div>
          </div>
          <Btn size="sm" kind="glass" icon="back" onClick={() => go('loyalty')}>Back</Btn>
        </div>
        <Card pad={14} style={{ marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:12, color:'var(--ink-mute)' }}>You have</div>
            <div style={{ fontSize:24, fontWeight:800, marginTop:2 }}>{points} ★</div>
          </div>
          <Tag kind="accent">Spendable</Tag>
        </Card>
      </div>

      <div style={{ padding:'4px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {items.map(r => {
          const can = points >= r.cost;
          return (
            <Card key={r.id} pad={14} style={{ display:'flex', flexDirection:'column', gap:10, opacity: can ? 1 : 0.55 }}>
              <div style={{ width:42, height:42, borderRadius:14, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name={r.icon} size={22}/>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700 }}>{r.name}</div>
                <div style={{ fontSize:11, color:'var(--ink-mute)', marginTop:3, lineHeight:1.4 }}>{r.desc}</div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'0.5px solid var(--line)', paddingTop:10 }}>
                <Tag kind={can ? 'accent' : 'neutral'}>{r.cost} ★</Tag>
                <Btn size="sm" kind={can ? 'primary' : 'ghost'} disabled={!can} onClick={() => can && redeem(r)}>{can ? 'Redeem' : 'Locked'}</Btn>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────── SUBS ──────────────────
function SubsScreen({ go, showToast }) {
  const [plan, setPlan] = React.useState('weekly');
  const [bean, setBean] = React.useState('rotating');
  const plans = [
    { id:'weekly',    label:'Weekly',    price:24 },
    { id:'biweekly',  label:'Bi-weekly', price:22 },
    { id:'monthly',   label:'Monthly',   price:20 },
  ];
  const beans = [
    { id:'rotating', name:'Roaster\'s pick',  desc:'Different bag every delivery. Surprise me.' },
    { id:'house',    name:'House blend',      desc:'Same chocolate-walnut profile.' },
    { id:'single',   name:'Single origin',    desc:'Light roast, ever-changing.' },
  ];

  return (
    <div style={{ minHeight:'100%', paddingBottom: 110 }}>
      <div style={{ padding:'58px 20px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Subscription</div>
            <div style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em', marginTop:4 }}>Beans, on repeat</div>
            <div style={{ fontSize:13, color:'var(--ink-mute)', marginTop:4 }}>Roasted Monday. Mailed Tuesday. At your door Thursday.</div>
          </div>
          <Btn size="sm" kind="glass" icon="back" onClick={() => go('account')}>Back</Btn>
        </div>
      </div>

      <div style={{ padding:'4px 20px' }}>
        <SectionHeader eyebrow="Cadence" title="How often?"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {plans.map(p => (
            <Card key={p.id} pad={14} onClick={() => setPlan(p.id)} style={{ textAlign:'center', border: plan === p.id ? '1.5px solid var(--accent)' : '0.5px solid var(--line)', boxShadow: plan === p.id ? '0 8px 20px rgba(139,69,19,0.18)' : 'var(--shadow-sm)' }}>
              <div style={{ fontSize:13, fontWeight:700 }}>{p.label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--accent-deep)', marginTop:6 }}>${p.price}</div>
              <div style={{ fontSize:10, color:'var(--ink-mute)', marginTop:2 }}>per 250g</div>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ padding:'18px 20px 4px' }}>
        <SectionHeader eyebrow="Bean" title="What's in the bag?"/>
        <Card pad={0} style={{ overflow:'hidden' }}>
          {beans.map((b, i) => (
            <button key={b.id} onClick={() => setBean(b.id)} style={{
              width:'100%', padding:'14px 16px', border:'none', cursor:'pointer',
              background: bean === b.id ? 'var(--accent-soft)' : 'transparent',
              borderBottom: i < beans.length - 1 ? '0.5px solid var(--line)' : 'none',
              textAlign:'left', display:'flex', alignItems:'center', gap:14,
              fontFamily:'inherit',
            }}>
              <div style={{ width:22, height:22, borderRadius:'50%', border: bean === b.id ? '6px solid var(--accent-deep)' : '1.5px solid var(--line-strong)', background: bean === b.id ? '#fff' : 'transparent', flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{b.name}</div>
                <div style={{ fontSize:12, color:'var(--ink-mute)', marginTop:2 }}>{b.desc}</div>
              </div>
            </button>
          ))}
        </Card>
      </div>

      {/* Summary */}
      <div style={{ padding:'18px 20px 0' }}>
        <Card pad={16}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-mute)' }}>Your plan</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:8 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700 }}>{plans.find(p=>p.id===plan).label} · {beans.find(b=>b.id===bean).name}</div>
              <div style={{ fontSize:12, color:'var(--ink-mute)', marginTop:2 }}>250g · cancel any time</div>
            </div>
            <div>
              <div style={{ fontSize:24, fontWeight:800 }}>${plans.find(p=>p.id===plan).price}</div>
              <div style={{ fontSize:11, color:'var(--ink-mute)', textAlign:'right' }}>/ delivery</div>
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <Btn full kind="primary" iconRight="arrow" onClick={() => showToast('Subscription started')}>Start subscription</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ────────────────── ACCOUNT ──────────────────
function AccountScreen({ go, points }) {
  return (
    <div style={{ minHeight:'100%', paddingBottom: 110 }}>
      <div style={{ padding:'58px 20px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Account</div>
            <div style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em', marginTop:4 }}>Profile</div>
          </div>
          <Glass strong style={{ width:40, height:40, borderRadius:999, padding:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Icon name="settings" size={18} color="var(--ink)"/>
          </Glass>
        </div>
      </div>

      {/* Identity card */}
      <div style={{ padding:'4px 20px' }}>
        <Card pad={18} style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), var(--accent-deep))', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, boxShadow:'0 8px 18px rgba(139,69,19,0.30)' }}>JP</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:18, fontWeight:800 }}>Joon Park</div>
            <div style={{ fontSize:12, color:'var(--ink-mute)' }}>Member since Sep 2024 · #00471</div>
          </div>
          <Btn size="sm" kind="ghost">Edit</Btn>
        </Card>
      </div>

      {/* Stats */}
      <div style={{ padding:'12px 20px 0' }}>
        <Card pad={0} style={{ overflow:'hidden', display:'grid', gridTemplateColumns:'repeat(3, 1fr)' }}>
          {[
            { v: points, l:'Stamps' },
            { v: 47, l:'Drinks' },
            { v: 3, l:'Subs' },
          ].map((s, i) => (
            <div key={i} style={{ padding:'16px 8px', textAlign:'center', borderRight: i < 2 ? '0.5px solid var(--line)' : 'none' }}>
              <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.02em' }}>{s.v}</div>
              <div style={{ fontSize:11, color:'var(--ink-mute)', marginTop:2, fontWeight:600 }}>{s.l}</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding:'14px 20px 0' }}>
        <Card pad={0} style={{ overflow:'hidden' }}>
          {[
            { id:'subs',     icon:'repeat',   title:'Subscriptions', sub:'Manage your bean delivery', go:'subs' },
            { id:'history',  icon:'clock',    title:'Order history', sub:'Last 30 days · 12 orders' },
            { id:'payment',  icon:'card',     title:'Payment methods', sub:'Visa · 4242' },
            { id:'address',  icon:'location', title:'Addresses', sub:'2 saved' },
            { id:'notif',    icon:'bell',     title:'Notifications', sub:'Email · push' },
            { id:'shop',     icon:'map',      title:'Find the shop', sub:'2188 University Blvd', go:'location' },
          ].map((m, i, a) => (
            <ListRow key={m.id}
              leading={<div style={{ width:36, height:36, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent-deep)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={m.icon} size={18}/></div>}
              title={m.title}
              subtitle={m.sub}
              trailing={<Icon name="chevron" size={16} color="var(--ink-mute)"/>}
              divider={i < a.length - 1}
              onClick={() => m.go && go(m.go)}
            />
          ))}
        </Card>
      </div>

      <div style={{ padding:'18px 20px' }}>
        <Btn full kind="ghost">Sign out</Btn>
      </div>
    </div>
  );
}

// ────────────────── LOCATION ──────────────────
function LocationScreen({ go }) {
  return (
    <div style={{ minHeight:'100%', paddingBottom: 110 }}>
      <div style={{ padding:'58px 20px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent-deep)' }}>Find us</div>
            <div style={{ fontSize:30, fontWeight:800, letterSpacing:'-0.02em', marginTop:4 }}>The shop</div>
          </div>
          <Btn size="sm" kind="glass" icon="back" onClick={() => go('account')}>Back</Btn>
        </div>
      </div>

      <div style={{ padding:'4px 20px' }}>
        <Card pad={0} style={{ overflow:'hidden' }}>
          {/* Map */}
          <div style={{ position:'relative', height:240, background:`
            repeating-linear-gradient(0deg, rgba(28,24,20,0.04) 0 1px, transparent 1px 24px),
            repeating-linear-gradient(90deg, rgba(28,24,20,0.04) 0 1px, transparent 1px 24px),
            linear-gradient(180deg, #ead4b8 0%, #f5efe6 100%)
          `}}>
            <div style={{ position:'absolute', top:0, bottom:0, left:'42%', width:14, background:'rgba(255,252,246,0.7)' }} />
            <div style={{ position:'absolute', left:0, right:0, top:'58%', height:14, background:'rgba(255,252,246,0.7)' }} />
            <div style={{ position:'absolute', top:'56%', left:'42%', transform:'translate(-50%, -100%)' }}>
              <div style={{ width:48, height:48, borderRadius:'50% 50% 50% 0', background:'linear-gradient(135deg, var(--accent), var(--accent-deep))', transform:'rotate(-45deg)', boxShadow:'0 12px 24px rgba(139,69,19,0.30)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ transform:'rotate(45deg)', color:'#fff', fontSize:11, fontWeight:800 }}>UBC</div>
              </div>
            </div>
            <div style={{ position:'absolute', top:10, left:12, fontSize:9, color:'var(--ink-mute)', letterSpacing:'0.16em', fontWeight:700 }}>UBC CAMPUS</div>
          </div>
          {/* Address */}
          <div style={{ padding:'16px 18px', borderTop:'0.5px solid var(--line)' }}>
            <div style={{ fontSize:11, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700 }}>Address</div>
            <div style={{ fontSize:18, fontWeight:700, marginTop:4, lineHeight:1.3 }}>2188 University Blvd<br/>UBC Vancouver, BC V6T 1Z4</div>
          </div>
        </Card>
      </div>

      <div style={{ padding:'14px 20px 0' }}>
        <SectionHeader eyebrow="Hours" title="When we're open" action={<Tag kind="success">● Open now</Tag>}/>
        <Card pad={0} style={{ overflow:'hidden' }}>
          {[
            { d:'Monday – Friday', t:'7:00 AM – 7:00 PM', today:true },
            { d:'Saturday',        t:'8:00 AM – 6:00 PM' },
            { d:'Sunday',          t:'9:00 AM – 4:00 PM' },
          ].map((h, i, a) => (
            <div key={h.d} style={{ padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: i < a.length-1 ? '0.5px solid var(--line)' : 'none' }}>
              <div style={{ fontSize:13, fontWeight: h.today ? 700 : 500, color: h.today ? 'var(--ink)' : 'var(--ink-soft)' }}>{h.d}</div>
              <div style={{ fontSize:13, fontWeight:600, color: h.today ? 'var(--accent-deep)' : 'var(--ink-mute)' }}>{h.t}</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding:'18px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <Btn kind="glass" icon="phone">Call</Btn>
        <Btn kind="primary" iconRight="arrow">Directions</Btn>
      </div>
    </div>
  );
}

Object.assign(window, { DRINKS, HomeScreen, OrderScreen, ReserveScreen, ReservedConfirm, TableScreen, LoyaltyScreen, RewardsScreen, SubsScreen, AccountScreen, LocationScreen });
