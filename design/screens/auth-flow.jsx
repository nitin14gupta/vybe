// VYBE — Screen 3: Phone  ·  Screen 4: OTP  ·  Screen 5: Age Gate

function PhoneScreen({ onBack, onContinue }) {
  const [phone, setPhone] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const digits = phone.replace(/\D/g, '').slice(0, 10);
  const valid = digits.length === 10;

  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: V.bg }} className="screen-in">
      <BackBtn onClick={onBack} />
      <div style={{ flex: 1, padding: '20px 24px 0' }}>
        <h1 style={{ margin: '0 0 8px', fontFamily: V.head, fontWeight: 700, fontSize: 28, color: V.text, letterSpacing: '-0.01em', lineHeight: '34px' }}>
          What's your number?
        </h1>
        <p style={{ margin: '0 0 34px', fontFamily: V.body, fontSize: 14, color: V.muted }}>We'll send a one-time code</p>

        {/* Phone input */}
        <div style={{ display: 'flex', height: 62, background: V.elevated, border: `1.5px solid ${focused ? V.orange : V.subtle}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 150ms, box-shadow 150ms', boxShadow: focused ? '0 0 0 3px rgba(255,107,53,0.16)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderRight: `1px solid ${V.subtle}`, flexShrink: 0, cursor: 'pointer' }}>
            <span style={{ fontSize: 22 }}>🇮🇳</span>
            <span style={{ fontFamily: V.body, fontWeight: 600, fontSize: 16, color: V.text }}>+91</span>
            <i data-lucide="chevron-down" style={{ width: 14, height: 14, color: V.muted }}></i>
          </div>
          <input
            type="tel"
            className="vybe-input"
            value={digits}
            onChange={e => setPhone(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="98765 43210"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: V.text, fontFamily: V.body, fontSize: 18, fontWeight: 500, padding: '0 16px', letterSpacing: '0.06em' }}
          />
        </div>
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <GradBtn disabled={!valid} onClick={() => valid && onContinue()}>Continue</GradBtn>
        <p style={{ textAlign: 'center', fontFamily: V.body, fontSize: 10, color: V.disabled, marginTop: 14, lineHeight: '16px' }}>
          By continuing you agree to our <span style={{ color: V.muted }}>Terms</span> &amp; <span style={{ color: V.muted }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}

function OTPScreen({ onBack, onContinue }) {
  const [digits, setDigits] = React.useState(['', '', '', '', '', '']);
  const [error, setError] = React.useState(false);
  const [countdown, setCountdown] = React.useState(45);
  const inputRefs = React.useRef([]);

  React.useEffect(() => {
    window.lucide && window.lucide.createIcons();
    inputRefs.current[0]?.focus();
  }, []);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i, raw) => {
    const v = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError(false);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const complete = digits.every(d => d !== '');

  const attempt = () => {
    if (!complete) return;
    setError(true);
    setTimeout(() => { setError(false); onContinue(); }, 520);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: V.bg }} className="screen-in">
      <BackBtn onClick={onBack} />
      <div style={{ flex: 1, padding: '20px 24px 0' }}>
        <h1 style={{ margin: '0 0 8px', fontFamily: V.head, fontWeight: 700, fontSize: 28, color: V.text, letterSpacing: '-0.01em' }}>
          Enter the code
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 38 }}>
          <p style={{ margin: 0, fontFamily: V.body, fontSize: 14, color: V.muted }}>Sent to +91 98765 43210</p>
          <i data-lucide="pencil" style={{ width: 14, height: 14, color: V.orange, cursor: 'pointer' }}></i>
        </div>

        <div className={error ? 'otp-shake' : ''} style={{ display: 'flex', gap: 8 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => (inputRefs.current[i] = el)}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              className="vybe-input"
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              style={{
                flex: 1, height: 'var(--otp-box-h, 52px)', textAlign: 'center',
                background: V.elevated,
                border: `1.5px solid ${error ? V.coral : d ? V.orange : V.subtle}`,
                borderRadius: 'var(--otp-radius, 12px)', color: V.text,
                fontFamily: V.head, fontWeight: 700, fontSize: 'var(--otp-font, 22px)',
                outline: 'none',
                boxShadow: d && !error ? '0 0 0 3px rgba(255,107,53,0.15)' : error ? '0 0 0 3px rgba(255,56,100,0.15)' : 'none',
                transition: 'border-color 150ms',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ fontFamily: V.body, fontSize: 13, color: V.coral, marginTop: 12 }}>
            Verifying code…
          </p>
        )}

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          {countdown > 0 ? (
            <p style={{ fontFamily: V.body, fontSize: 14, color: V.muted, margin: 0 }}>
              Resend code in <span style={{ color: 'rgba(255,107,53,0.75)', fontWeight: 600 }}>0:{String(countdown).padStart(2, '0')}</span>
            </p>
          ) : (
            <button onClick={() => setCountdown(45)} style={{ background: 'none', border: 'none', color: V.orange, fontFamily: V.body, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Resend code
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <GradBtn disabled={!complete} onClick={attempt}>Continue</GradBtn>
      </div>
    </div>
  );
}

function AgeGateScreen({ onYes, onNo }) {
  const [declined, setDeclined] = React.useState(false);

  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

  if (declined) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: V.bg, padding: '0 32px', textAlign: 'center' }} className="screen-in">
        <div style={{ fontSize: 72, marginBottom: 22, lineHeight: 1 }}>🔒</div>
        <h1 style={{ margin: '0 0 12px', fontFamily: V.head, fontWeight: 700, fontSize: 24, color: V.text }}>Come back when you're 18!</h1>
        <p style={{ margin: '0 0 36px', fontFamily: V.body, fontSize: 14, color: V.muted, lineHeight: '22px' }}>
          VYBE is for adults only. We'll see you on the other side.
        </p>
        <button onClick={() => setDeclined(false)} style={{ background: 'none', border: 'none', color: V.orange, fontFamily: V.body, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: V.bg, padding: '0 28px', textAlign: 'center' }} className="screen-in">
      <div style={{ fontSize: 80, lineHeight: 1, marginBottom: 28 }}>🎂</div>
      <h1 style={{ margin: '0 0 12px', fontFamily: V.head, fontWeight: 700, fontSize: 26, color: V.text }}>Are you 18 or older?</h1>
      <p style={{ margin: '0 0 44px', fontFamily: V.body, fontSize: 14, color: V.muted, lineHeight: '22px' }}>
        VYBE is only for adults. You must be 18+ to use this app.
      </p>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GradBtn onClick={onYes}>Yes, I'm 18+</GradBtn>
        <GradBtn outline onClick={() => setDeclined(true)}>No, I'm not</GradBtn>
      </div>
    </div>
  );
}

window.PhoneScreen = PhoneScreen;
window.OTPScreen = OTPScreen;
window.AgeGateScreen = AgeGateScreen;
