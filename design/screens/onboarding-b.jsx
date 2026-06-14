// VYBE — Onboarding Steps 4 (Interests), 5 (City), 11 (Complete)

const INTERESTS = [
  ['Music','🎵'], ['Travel','✈️'], ['Food','🍕'], ['Sports','⚽'],
  ['Art','🎨'], ['Movies','🎬'], ['Gaming','🎮'], ['Dance','💃'],
  ['Fitness','🏋️'], ['Comedy','😂'], ['Photography','📸'], ['Fashion','👗'],
  ['Tech','💻'], ['Books','📚'], ['Cooking','🍳'], ['Nightlife','🌃'],
  ['Hiking','🥾'], ['Yoga','🧘'],
];

const CITIES = [
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi NCR' },
  { name: 'Bangalore', state: 'Karnataka' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Ahmedabad', state: 'Gujarat' },
];

// ── Step 4: Interests ────────────────────────────────────────
function OBStep4({ onBack, onNext }) {
  const [selected, setSelected] = React.useState([]);
  const canProceed = selected.length >= 3;

  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

  const toggle = label => {
    setSelected(s => s.includes(label) ? s.filter(x => x !== label) : [...s, label]);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: V.bg }} className="screen-in">
      <BackBtn onClick={onBack} />
      <ProgressBar step={4} />
      <div style={{ padding: '0 24px 12px' }}>
        <h1 style={{ margin: '0 0 6px', fontFamily: V.head, fontWeight: 700, fontSize: 24, color: V.text, letterSpacing: '-0.01em' }}>What are you into?</h1>
        <p style={{ margin: 0, fontFamily: V.body, fontSize: 13, color: V.muted }}>
          Pick at least 3 — helps us find your vibe
          {selected.length > 0 && <span style={{ color: canProceed ? V.orange : V.muted }}> · {selected.length} selected</span>}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {INTERESTS.map(([label, emoji]) => {
            const on = selected.includes(label);
            return (
              <button key={label} onClick={() => toggle(label)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                height: 40, padding: '0 16px', borderRadius: 999,
                border: `1.5px solid ${on ? V.orange : V.subtle}`,
                background: on ? 'rgba(255,107,53,0.15)' : V.elevated,
                color: on ? V.orange : V.muted,
                fontFamily: V.body, fontSize: 14, fontWeight: on ? 600 : 400,
                cursor: 'pointer', transition: 'all 160ms', WebkitTapHighlightColor: 'transparent',
              }}>
                <span>{emoji}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ height: 12 }} />
      </div>

      <div style={{ padding: '16px 24px' }}>
        {!canProceed && (
          <p style={{ textAlign: 'center', fontFamily: V.body, fontSize: 12, color: V.disabled, margin: '0 0 10px' }}>
            Select {3 - selected.length} more to continue
          </p>
        )}
        <GradBtn disabled={!canProceed} onClick={() => canProceed && onNext()}>Next</GradBtn>
      </div>
    </div>
  );
}

// ── Step 5: Location ─────────────────────────────────────────
function OBStep5({ onBack, onNext }) {
  const [query, setQuery] = React.useState('');
  const [city, setCity] = React.useState(null);
  const [locFocused, setLocFocused] = React.useState(false);

  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

  const filtered = CITIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: V.bg }} className="screen-in">
      <BackBtn onClick={onBack} />
      <ProgressBar step={5} />
      <div style={{ padding: '0 24px 12px' }}>
        <h1 style={{ margin: '0 0 6px', fontFamily: V.head, fontWeight: 700, fontSize: 24, color: V.text, letterSpacing: '-0.01em' }}>Where are you based?</h1>
        <p style={{ margin: 0, fontFamily: V.body, fontSize: 13, color: V.muted }}>We'll show you events near you</p>
      </div>

      <div style={{ padding: '0 24px 14px' }}>
        <div style={{ display: 'flex', height: 52, background: V.elevated, border: `1.5px solid ${locFocused ? V.orange : V.subtle}`, borderRadius: 14, alignItems: 'center', padding: '0 14px', gap: 10, transition: 'border-color 150ms', boxShadow: locFocused ? '0 0 0 3px rgba(255,107,53,0.14)' : 'none' }}>
          <i data-lucide="search" style={{ width: 18, height: 18, color: V.muted, flexShrink: 0 }}></i>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search cities…" className="vybe-input"
            onFocus={() => setLocFocused(true)} onBlur={() => setLocFocused(false)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: V.text, fontFamily: V.body, fontSize: 16 }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Use my location */}
        <button onClick={() => setCity('Mumbai')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${V.subtle}`, WebkitTapHighlightColor: 'transparent' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,107,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i data-lucide="map-pin" style={{ width: 20, height: 20, color: V.orange }}></i>
          </div>
          <span style={{ fontFamily: V.body, fontSize: 15, fontWeight: 600, color: V.orange }}>Use my current location</span>
        </button>

        {filtered.map(c => (
          <button key={c.name} onClick={() => setCity(c.name)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${V.subtle}`, WebkitTapHighlightColor: 'transparent' }}>
            <div>
              <div style={{ fontFamily: V.body, fontSize: 15, fontWeight: 600, color: city === c.name ? V.orange : V.text, textAlign: 'left' }}>{c.name}</div>
              <div style={{ fontFamily: V.body, fontSize: 12, color: V.muted, textAlign: 'left' }}>{c.state}</div>
            </div>
            {city === c.name && <i data-lucide="check" style={{ width: 20, height: 20, color: V.orange }}></i>}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 24px' }}>
        <GradBtn disabled={!city} onClick={() => city && onNext()}>Continue</GradBtn>
      </div>
    </div>
  );
}

// ── Screen 11: Complete ───────────────────────────────────────
function Confetti() {
  const pieces = React.useMemo(() => Array.from({ length: 32 }, (_, i) => {
    const rnd = n => ((Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1 + 1) % 1;
    return {
      x: rnd(0) * 100,
      delay: rnd(1) * 1.8,
      dur: 2.2 + rnd(2) * 1.6,
      color: ['#FF6B35','#FF3864','#FFB830','#00C48C','#F5F0EB','#FF2D6E'][Math.floor(rnd(3) * 6)],
      size: 7 + rnd(4) * 9,
      round: rnd(5) > 0.5,
      rotate: Math.round(rnd(6) * 6) * 60,
    };
  }), []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, top: -16,
          width: p.size, height: p.size,
          background: p.color,
          borderRadius: p.round ? '50%' : 3,
          transform: `rotate(${p.rotate}deg)`,
          animation: `confetti-fall ${p.dur}s ${p.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
        }} />
      ))}
    </div>
  );
}

function CompleteScreen({ onExplore }) {
  React.useEffect(() => {
    window.lucide && window.lucide.createIcons();
    const t = setTimeout(onExplore, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: V.bg, position: 'relative', overflow: 'hidden', padding: '0 28px', textAlign: 'center' }} className="screen-in">
      <Confetti />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,107,53,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: `2px solid rgba(255,107,53,0.3)` }}>
          <i data-lucide="check" style={{ width: 44, height: 44, color: V.orange }}></i>
        </div>
        <h1 style={{ margin: '0 0 12px', fontFamily: V.head, fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: V.text, lineHeight: '34px' }}>
          You're all set, Rohan! 🎉
        </h1>
        <p style={{ margin: '0 0 44px', fontFamily: V.body, fontSize: 15, color: V.muted, lineHeight: '24px' }}>
          Start discovering events and people near you.
        </p>
        <div style={{ width: '100%' }}>
          <GradBtn onClick={onExplore}>Explore VYBE</GradBtn>
        </div>
        <p style={{ fontFamily: V.body, fontSize: 12, color: V.disabled, marginTop: 16 }}>
          Taking you in automatically…
        </p>
      </div>
    </div>
  );
}

window.OBStep4 = OBStep4;
window.OBStep5 = OBStep5;
window.CompleteScreen = CompleteScreen;
