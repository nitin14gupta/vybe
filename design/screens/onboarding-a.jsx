// VYBE — Onboarding Steps 1 (Name/DOB/Gender), 2 (Photos), 3 (Voice)

// ── Step 1: Profile details ──────────────────────────────────
function OBStep1({ onBack, onNext }) {
  const [name, setName] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [focusedField, setFocusedField] = React.useState(null);
  const canProceed = name.trim() && dob && gender;

  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

  const FieldInput = ({ id, label, placeholder, value, onChange, type = 'text' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: V.body, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: V.muted }}>{label}</span>
      <div style={{ height: 52, background: V.elevated, border: `1.5px solid ${focusedField === id ? V.orange : V.subtle}`, borderRadius: 12, display: 'flex', alignItems: 'center', padding: '0 16px', transition: 'border-color 150ms', boxShadow: focusedField === id ? '0 0 0 3px rgba(255,107,53,0.14)' : 'none' }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="vybe-input"
          onFocus={() => setFocusedField(id)} onBlur={() => setFocusedField(null)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: V.text, fontFamily: V.body, fontSize: 16 }}
        />
      </div>
    </div>
  );

  const genders = ['Man', 'Woman', 'Non-binary', 'Prefer not to say'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: V.bg }} className="screen-in">
      <BackBtn onClick={onBack} />
      <ProgressBar step={1} />
      <div style={{ padding: '0 24px 12px' }}>
        <h1 style={{ margin: '0 0 6px', fontFamily: V.head, fontWeight: 700, fontSize: 24, color: V.text, letterSpacing: '-0.01em' }}>Let's set up your profile</h1>
        <p style={{ margin: 0, fontFamily: V.body, fontSize: 13, color: V.muted }}>Tell us a little about yourself</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FieldInput id="name" label="Full name" placeholder="Rohan Sharma" value={name} onChange={setName} />
        <FieldInput id="dob" label="Date of birth" placeholder="DD / MM / YYYY" value={dob} onChange={setDob} type="text" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: V.body, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: V.muted }}>Gender</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {genders.map(g => (
              <button key={g} onClick={() => setGender(g)} style={{
                height: 48, borderRadius: 12, border: `1.5px solid ${gender === g ? V.orange : V.subtle}`,
                background: gender === g ? 'rgba(255,107,53,0.12)' : V.elevated,
                color: gender === g ? V.orange : V.muted, fontFamily: V.body, fontWeight: gender === g ? 600 : 400,
                fontSize: 13, cursor: 'pointer', transition: 'all 160ms', WebkitTapHighlightColor: 'transparent',
              }}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 24px' }}>
        <GradBtn disabled={!canProceed} onClick={() => canProceed && onNext()}>Next</GradBtn>
      </div>
    </div>
  );
}

// ── Step 2: Photos ────────────────────────────────────────────
const PHOTO_GRADS = [
  'linear-gradient(145deg,#FF6B35,#FF3864)', 'linear-gradient(145deg,#FFB830,#FF6B35)',
  'linear-gradient(145deg,#FF3864,#8B1A4A)', 'linear-gradient(145deg,#2a1206,#FF6B35)',
  'linear-gradient(145deg,#00C48C,#1a4a2a)', 'linear-gradient(145deg,#18090e,#FF6B35)',
];

function OBStep2({ onBack, onNext }) {
  const [photos, setPhotos] = React.useState(Array(6).fill(null));

  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

  const add = i => setPhotos(p => { const n = [...p]; n[i] = PHOTO_GRADS[i]; return n; });
  const remove = (e, i) => { e.stopPropagation(); setPhotos(p => { const n = [...p]; n[i] = null; return n; }); };
  const hasOne = photos.some(Boolean);

  const Slot = ({ i }) => {
    const large = i === 0;
    const photo = photos[i];
    return (
      <div onClick={() => !photo && add(i)} style={{
        gridColumn: large ? '1 / 3' : undefined,
        aspectRatio: large ? '16 / 9' : '1 / 1',
        borderRadius: 16, border: `1.5px dashed ${photo ? 'transparent' : V.subtle}`,
        background: photo ? photo : V.elevated,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: photo ? 'default' : 'pointer', position: 'relative', overflow: 'hidden',
        transition: 'border-color 150ms',
      }}>
        {!photo ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <i data-lucide="camera" style={{ width: large ? 32 : 24, height: large ? 32 : 24, color: V.muted }}></i>
            {large && <span style={{ fontFamily: V.body, fontSize: 13, color: V.muted }}>Add main photo</span>}
          </div>
        ) : (
          <>
            {large && <span style={{ fontFamily: V.head, fontWeight: 800, fontSize: 18, color: '#11111188', letterSpacing: '-0.02em' }}>PHOTO</span>}
            <button onClick={e => remove(e, i)} style={{
              position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(17,17,17,0.7)', border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <i data-lucide="x" style={{ width: 14, height: 14 }}></i>
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: V.bg }} className="screen-in">
      <BackBtn onClick={onBack} />
      <ProgressBar step={2} />
      <div style={{ padding: '0 24px 12px' }}>
        <h1 style={{ margin: '0 0 6px', fontFamily: V.head, fontWeight: 700, fontSize: 24, color: V.text, letterSpacing: '-0.01em' }}>Add your photos</h1>
        <p style={{ margin: 0, fontFamily: V.body, fontSize: 13, color: V.muted }}>Add at least 1 photo. First photo is your main photo.</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[0, 1, 2, 3, 4, 5].map(i => <Slot key={i} i={i} />)}
        </div>
      </div>

      <div style={{ padding: '16px 24px' }}>
        <GradBtn disabled={!hasOne} onClick={() => hasOne && onNext()}>Next</GradBtn>
      </div>
    </div>
  );
}

// ── Step 3: Voice intro ───────────────────────────────────────
function OBStep3({ onBack, onNext }) {
  const [recording, setRecording] = React.useState(false);
  const [recorded, setRecorded] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

  React.useEffect(() => {
    if (!recording) return;
    if (seconds >= 30) { setRecording(false); setRecorded(true); return; }
    const t = setTimeout(() => setSeconds(s => s + 1), 1000);
    return () => clearTimeout(t);
  }, [recording, seconds]);

  const fmt = s => `0:${String(s).padStart(2, '0')}`;

  const tapRecord = () => {
    if (recording) { setRecording(false); if (seconds > 0) setRecorded(true); }
    else { setRecording(true); setRecorded(false); setSeconds(0); }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: V.bg }} className="screen-in">
      <BackBtn onClick={onBack} />
      <ProgressBar step={3} />
      <div style={{ padding: '0 24px 12px' }}>
        <h1 style={{ margin: '0 0 6px', fontFamily: V.head, fontWeight: 700, fontSize: 24, color: V.text, letterSpacing: '-0.01em' }}>Record your voice intro</h1>
        <p style={{ margin: 0, fontFamily: V.body, fontSize: 13, color: V.muted }}>30 seconds. Let people hear the real you.</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        {/* Big record button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {recording && (
            <div style={{ position: 'absolute', width: 148, height: 148, borderRadius: '50%', border: `2px solid ${V.orange}`, animation: 'record-ripple 1.4s ease-out infinite', opacity: 0.4 }} />
          )}
          <button onClick={tapRecord} style={{
            width: 120, height: 120, borderRadius: '50%',
            background: recording ? `radial-gradient(circle, rgba(255,107,53,0.2), rgba(255,107,53,0.05))` : V.surface,
            border: `2.5px solid ${recording ? V.orange : V.subtle}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: recording ? `0 0 40px rgba(255,107,53,0.3)` : 'none',
            transition: 'all 250ms', WebkitTapHighlightColor: 'transparent',
          }}>
            <i data-lucide={recording ? 'square' : 'mic'} style={{ width: 40, height: 40, color: recording ? V.coral : V.text }}></i>
          </button>
        </div>

        {/* Timer */}
        <div style={{ fontFamily: V.head, fontWeight: 700, fontSize: 28, color: recording ? V.text : V.muted, transition: 'color 200ms' }}>
          {fmt(seconds)} <span style={{ fontFamily: V.body, fontSize: 14, color: V.muted, fontWeight: 400 }}>/ 0:30</span>
        </div>

        {/* Waveform when recording */}
        {recording && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 48 }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} style={{ width: 4, height: 36, borderRadius: 999, background: V.orange, transformOrigin: 'center', animation: `wave-bar 0.65s ${i * 0.055}s ease-in-out infinite` }} />
            ))}
          </div>
        )}

        {/* Playback bar when recorded */}
        {recorded && !recording && (
          <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setPlaying(!playing)} style={{ width: 40, height: 40, borderRadius: '50%', background: V.orange, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i data-lucide={playing ? 'pause' : 'play'} style={{ width: 18, height: 18, color: '#111' }}></i>
              </button>
              <div style={{ flex: 1, height: 4, background: V.subtle, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: playing ? '45%' : '0%', height: '100%', background: V.orange, borderRadius: 999, transition: 'width 0.5s linear' }} />
              </div>
              <span style={{ fontFamily: V.body, fontSize: 12, color: V.muted }}>{fmt(seconds)}</span>
            </div>
            <button onClick={() => { setRecorded(false); setSeconds(0); }} style={{ background: 'none', border: 'none', color: V.muted, fontFamily: V.body, fontSize: 13, cursor: 'pointer' }}>
              Retake
            </button>
          </div>
        )}

        {!recording && !recorded && (
          <p style={{ fontFamily: V.body, fontSize: 13, color: V.disabled, textAlign: 'center', margin: 0 }}>Tap the mic to start recording</p>
        )}
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        {recorded ? (
          <GradBtn onClick={onNext}>Use this</GradBtn>
        ) : (
          <GradBtn textLink onClick={onNext}>Skip for now</GradBtn>
        )}
      </div>
    </div>
  );
}

window.OBStep1 = OBStep1;
window.OBStep2 = OBStep2;
window.OBStep3 = OBStep3;
