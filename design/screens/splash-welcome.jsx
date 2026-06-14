// VYBE — Screen 1: Splash  ·  Screen 2: Welcome

function SplashScreen({ onDone }) {
  React.useEffect(() => {
    window.lucide && window.lucide.createIcons();
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: V.bg, position: 'relative', overflow: 'hidden' }}>
      {/* ambient glow */}
      <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.24) 0%, rgba(255,56,100,0.1) 45%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -58%)' }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: V.head, fontWeight: 800, fontSize: 72, letterSpacing: '-0.03em', lineHeight: 1, background: V.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          VYBE
        </div>
        <div style={{ fontFamily: V.body, fontSize: 16, color: V.muted, marginTop: 14, letterSpacing: '0.04em' }}>
          Meet. Vibe. Connect.
        </div>
      </div>

      {/* pulsing dots */}
      <div style={{ position: 'absolute', bottom: 52, display: 'flex', gap: 10, zIndex: 1 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: V.orange, animation: `dot-pulse 1.3s ${i * 0.22}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart, onLogin }) {
  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: V.bg }} className="screen-in">
      {/* City illustration */}
      <div style={{ flexShrink: 0 }}>
        <CityCanvas />
      </div>

      {/* Bottom card sliding up */}
      <div style={{ flex: 1, background: V.surface, borderRadius: '28px 28px 0 0', display: 'flex', flexDirection: 'column', padding: '28px 24px 0', animation: 'slide-up 0.4s 0.08s cubic-bezier(0.2,0,0,1) both' }}>
        <h1 style={{ margin: '0 0 10px', fontFamily: V.head, fontWeight: 700, fontSize: 32, letterSpacing: '-0.02em', color: V.text, lineHeight: '38px' }}>
          Find your vibe
        </h1>
        <p style={{ margin: '0 0 28px', fontFamily: V.body, fontSize: 14, color: V.muted, lineHeight: '22px' }}>
          House parties, events &amp; real connections — all in one place
        </p>
        <GradBtn onClick={onStart}>Get Started</GradBtn>
        <div style={{ height: 10 }} />
        <GradBtn textLink onClick={onLogin}>I already have an account</GradBtn>

        {/* swipe dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 18 }}>
          {[1, 0, 0].map((active, i) => (
            <div key={i} style={{ width: active ? 22 : 8, height: 8, borderRadius: 999, background: active ? V.orange : V.subtle, transition: 'width 200ms' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

window.SplashScreen = SplashScreen;
window.WelcomeScreen = WelcomeScreen;
