// VYBE — Shared chrome, tokens & reusable primitives

const V = {
  bg: '#111111',
  surface: '#1A1A1A',
  elevated: '#222222',
  subtle: '#2A2A2A',
  orange: '#FF6B35',
  coral: '#FF3864',
  grad: 'linear-gradient(135deg, #FF6B35, #FF3864)',
  gold: '#FFB830',
  green: '#00C48C',
  text: '#F5F0EB',
  muted: '#A09890',
  disabled: '#4A4540',
  head: "'Hanken Grotesk', system-ui, sans-serif",
  body: "'DM Sans', system-ui, sans-serif",
};

function VybeFrame({ children }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 44, background: V.bg,
      overflow: 'hidden', position: 'relative', flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 40px 120px rgba(0,0,0,0.65), 0 0 0 10px #060606, 0 0 0 11px #2a2a2a',
    }}>
      {children}
    </div>
  );
}

function StatusBar({ light = true }) {
  const c = light ? V.text : '#111';
  return (
    <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 26px 8px', color: c, fontFamily: V.body, fontWeight: 700, fontSize: 14, letterSpacing: '0.01em', zIndex: 10, position: 'relative' }}>
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <i data-lucide="signal" style={{ width: 15, height: 15 }}></i>
        <i data-lucide="wifi" style={{ width: 15, height: 15 }}></i>
        <i data-lucide="battery-full" style={{ width: 20, height: 13 }}></i>
      </div>
    </div>
  );
}

function HomeIndicator() {
  return (
    <div style={{ height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 130, height: 5, background: 'rgba(245,240,235,0.3)', borderRadius: 999 }}></div>
    </div>
  );
}

function ProgressBar({ step, total = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '0 24px 18px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i < step ? 'var(--brand-primary, #FF6B35)' : V.subtle, transition: 'background 250ms' }} />
      ))}
    </div>
  );
}

function GradBtn({ children, disabled, onClick, outline, textLink, style: extraStyle = {} }) {
  const base = {
    width: '100%', height: 56, borderRadius: 999, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: V.body, fontWeight: 700, fontSize: 16, letterSpacing: '0.01em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 120ms, opacity 140ms',
    WebkitTapHighlightColor: 'transparent',
  };
  if (textLink) return (
    <button onClick={!disabled ? onClick : undefined} style={{ ...base, background: 'transparent', color: disabled ? V.disabled : V.muted, height: 44 }}>
      {children}
    </button>
  );
  if (outline) return (
    <button onClick={!disabled ? onClick : undefined} style={{ ...base, background: 'transparent', color: V.text, border: `1.5px solid ${V.subtle}`, ...extraStyle }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
      {children}
    </button>
  );
  return (
    <button onClick={!disabled ? onClick : undefined}
      style={{ ...base, background: disabled ? '#2a2a2a' : 'var(--vybe-grad, linear-gradient(135deg, #FF6B35, #FF3864))', color: disabled ? V.disabled : '#111', opacity: disabled ? 0.7 : 1, ...extraStyle }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
      {children}
    </button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 40, borderRadius: 999, background: V.surface,
      border: `1px solid ${V.subtle}`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', cursor: 'pointer', margin: '8px 0 4px 24px',
      color: V.text, flexShrink: 0, WebkitTapHighlightColor: 'transparent',
    }}>
      <i data-lucide="arrow-left" style={{ width: 18, height: 18 }}></i>
    </button>
  );
}

// Canvas city night scene for Welcome screen
function CityCanvas() {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = canvas.width = 390;
    const H = canvas.height = 460;
    const ctx = canvas.getContext('2d');

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#070707');
    sky.addColorStop(0.5, '#180c04');
    sky.addColorStop(1, '#2e1608');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Horizon glow
    const glow = ctx.createRadialGradient(W / 2, H * 0.72, 0, W / 2, H * 0.72, W * 0.78);
    glow.addColorStop(0, 'rgba(255,107,53,0.45)');
    glow.addColorStop(0.35, 'rgba(255,107,53,0.2)');
    glow.addColorStop(1, 'rgba(255,107,53,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    // Seeded "random" (deterministic so no flicker)
    const sr = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

    // Stars
    for (let i = 0; i < 38; i++) {
      ctx.beginPath();
      ctx.arc(sr(i, 0) * W, sr(i, 1) * H * 0.48, sr(i, 2) * 1.4 + 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,240,235,${sr(i, 3) * 0.35 + 0.1})`;
      ctx.fill();
    }

    // Back buildings
    [[0,60,175],[55,45,145],[95,72,215],[162,52,178],[208,78,195],[280,48,162],[322,58,185],[370,38,150]].forEach(([x, w, h], bi) => {
      ctx.fillStyle = '#190e06'; ctx.fillRect(x, H - h, w, h);
    });

    // Front buildings
    const blds = [[-5,78,275],[66,58,238],[115,88,315],[192,68,265],[248,92,298],[330,62,250],[380,42,238]];
    blds.forEach(([x, w, h], bi) => {
      ctx.fillStyle = '#111111'; ctx.fillRect(x, H - h, w, h);
      const ww = 7, wh = 9, gx = 11, gy = 14, cols = Math.floor((w - gx) / (ww + gx)), rows = Math.floor((h - 18) / gy);
      for (let row = 1; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (sr(bi * 13 + row, col) > 0.42) {
            const wx = x + gx + col * (ww + gx), wy = H - h + row * gy + 10;
            const warm = sr(bi + row * 3, col * 7);
            ctx.fillStyle = `rgba(255,${Math.round(145 + warm * 70)},${Math.round(warm * 38)},${0.55 + sr(bi, row + col) * 0.35})`;
            ctx.fillRect(wx, wy, ww, wh);
          }
        }
      }
    });
  }, []);

  return <canvas ref={ref} style={{ width: '100%', height: 460, display: 'block' }} />;
}

window.V = V;
window.VybeFrame = VybeFrame;
window.StatusBar = StatusBar;
window.HomeIndicator = HomeIndicator;
window.ProgressBar = ProgressBar;
window.GradBtn = GradBtn;
window.BackBtn = BackBtn;
window.CityCanvas = CityCanvas;
