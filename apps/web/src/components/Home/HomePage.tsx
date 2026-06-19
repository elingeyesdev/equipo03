import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

// ── Design tokens ──
const C = {
  cyan: '#1EC8E0', orange: '#F97316', green: '#22C55E',
  dark: '#090912', surface: '#111120', surface2: '#0D0D18',
  border: '#1E1E30', text: '#F0EFF8', muted: '#6A6A8A',
};
const HD: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, letterSpacing: -1.5, textTransform: 'uppercase' };
const body: React.CSSProperties = { fontFamily: "'Barlow', system-ui, sans-serif" };

const today = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });

export const HomePage = () => {
  const { theme, toggleTheme } = useTheme();
  const light = theme === 'light';
  const bg = light ? '#f5f5f7' : C.dark;
  const bg2 = light ? '#eaeaef' : C.surface2;
  const cardBg = light ? '#fff' : C.surface;
  const cardBorder = light ? '#e0e0e5' : C.border;
  const textColor = light ? '#111' : C.text;
  const mutedColor = light ? '#666' : C.muted;
  const rowBorder = light ? '#e5e5ea' : '#13132A';
  const mockBg = light ? '#f0f0f5' : '#0c0c0c';
  const mockInner = light ? '#e8e8ee' : '#1a1a1a';
  const avatarBg = light ? '#ddd' : '#1A1A2C';
  return (
  <div style={{ ...body, background: bg, color: textColor, overflowX: 'hidden', minHeight: '100vh' }}>

    {/* ═══ NAVBAR ═══ */}
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: bg, borderBottom: `2px solid ${C.cyan}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 40px' }}>
      <span style={{ fontSize: 22, fontWeight: 800 }}>
        <span style={{ color: C.cyan }}>GymSync</span><span style={{ color: C.orange }}> Pro</span>
      </span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: mutedColor, display: 'flex', alignItems: 'center' }}>
          {theme === 'dark'
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
        </button>
        <Link to="/login" style={{ color: mutedColor, textDecoration: 'none', fontSize: 14 }}>Iniciar Sesión</Link>
        <Link to="/register" style={{ background: C.orange, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, padding: '8px 20px', borderRadius: 6 }}>Registrarse gratis</Link>
      </div>
    </nav>

    {/* ═══ HERO — Split 50/50 ═══ */}
    <section style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', padding: '80px 40px', gap: 56, alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* Left */}
      <div style={{ flex: '1 1 480px', minWidth: 300 }}>
        <span style={{ display: 'inline-block', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 14px', fontSize: 12, color: mutedColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>Plataforma de Gestión Fitness</span>

        <h1 style={{ ...HD, fontSize: 'clamp(48px, 5.5vw, 82px)', lineHeight: 0.95, margin: '0 0 28px' }}>
          ADMINISTRA TODA TU CADENA DE<br />
          <span style={{ color: C.cyan }}>GIMNASIOS</span>
        </h1>

        <p style={{ color: mutedColor, fontSize: 16, lineHeight: 1.8, maxWidth: 460, marginBottom: 36 }}>
          Panel web para tu equipo administrativo. App móvil nativa para tus clientes.
          Reservas, rutinas, aforo en tiempo real y más.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/login" style={{ background: C.orange, color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '14px 36px', borderRadius: 6, fontSize: 15 }}>Iniciar Sesión</Link>
          <Link to="/register" style={{ background: C.green, color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '14px 36px', borderRadius: 6, fontSize: 15 }}>Crear Cuenta</Link>
        </div>
      </div>

      {/* Right — Admin panel mock */}
      <div style={{ flex: '0 0 520px', minWidth: 300, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14 }}>
        {/* Top bar */}
        <div style={{ background: bg2, borderBottom: `1px solid ${cardBorder}`, padding: '12px 20px', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: mutedColor }}>
          <span>GymSync Pro · Resumen del día</span><span>{today}</span>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${C.border}` }}>
          {[
            { val: '2,847', color: C.cyan, label: 'Miembros activos' },
            { val: '38', color: C.orange, label: 'Reservas hoy' },
            { val: '$48K', color: C.green, label: 'Ingresos del mes' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '20px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ ...HD, fontSize: 38, color: m.color }}>{m.val}</div>
              <div style={{ fontSize: 11, color: mutedColor, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Recent access */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: mutedColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Acceso reciente</div>
          {[
            { initials: 'MC', name: 'María Castro', zone: 'Zona Cardio', bg: '#1A1A2C' },
            { initials: 'JR', name: 'Jorge Ríos', zone: 'Musculación', bg: '#1A1A2C' },
            { initials: 'LP', name: 'Laura Pérez', zone: 'CrossFit WOD', bg: '#1A1A2C' },
            { initials: 'DF', name: 'Diego Flores', zone: 'Spinning', bg: '#1A1A2C' },
          ].map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? `1px solid #13132A` : 'none', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.cyan, flexShrink: 0 }}>{u.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: mutedColor }}>{u.zone}</div>
              </div>
              <span style={{ color: C.green, fontSize: 14, fontWeight: 700 }}>✓</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ═══ STATS BAR ═══ */}
    <div style={{ background: bg2, borderTop: `1px solid ${rowBorder}`, borderBottom: `1px solid ${rowBorder}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: 1200, margin: '0 auto' }}>
        {[
          { val: '2,400+', color: C.cyan, label: 'Miembros activos' },
          { val: '48', color: C.orange, label: 'Sucursales gestionadas' },
          { val: '99.9%', color: C.green, label: 'Uptime garantizado' },
          { val: '5', color: C.text, label: 'Roles jerárquicos' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '36px 24px', textAlign: 'center', borderRight: i < 3 ? `1px solid ${rowBorder}` : 'none' }}>
            <div style={{ ...HD, fontSize: 48, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#4A4A6A', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* ═══ FEATURE [01] — QR Check-in ═══ */}
    <FeatureRow bg={bg} accent={C.cyan} tag="01" title="QR CHECK-IN" heading="CHECK-IN INTELIGENTE CON CÓDIGO QR" desc="Los clientes generan un QR desde la app. El recepcionista lo escanea desde la web. El sistema valida reserva, sucursal y horario automáticamente." checks={['Validación de sucursal en tiempo real', 'Mensajes de error descriptivos', 'Bloqueo de QR expirados']} visual={<QRVisual />} reverse={false} />

    {/* ═══ FEATURE [02] — Roles RBAC ═══ */}
    <FeatureRow bg={bg2} accent={C.orange} tag="02" title="ROLES RBAC" heading="CONTROL DE ACCESO POR NIVEL JERÁRQUICO" desc="Gerentes administran toda la marca. Recepcionistas gestionan su sucursal. Roles nuevos heredan permisos automáticamente por nivel." checks={['Herencia automática por nivel', 'Multi-sucursal para gerentes', 'Scope de sucursal para recepcionistas']} visual={<RolesVisual />} reverse />

    {/* ═══ FEATURE [03] — Reservas ═══ */}
    <FeatureRow bg={bg} accent={C.green} tag="03" title="RESERVAS" heading="GESTIÓN COMPLETA DE RESERVAS Y HORARIOS" desc="Reservas de acceso libre y clases programadas. Control de aforo por sucursal. Múltiples reservas en horarios no superpuestos." checks={['Clases programadas con instructor', 'Acceso libre con horario flexible', 'Validación de solapamiento']} visual={<ScheduleVisual />} reverse={false} />

    {/* ═══ FEATURE [04] — Multi-sucursal ═══ */}
    <FeatureRow bg={bg2} accent={C.cyan} tag="04" title="MULTI-SUCURSAL" heading="ADMINISTRA MÚLTIPLES SUCURSALES POR MARCA" desc="Cada marca puede tener múltiples sucursales. Cada sucursal con su propio aforo, servicios, horarios y personal asignado." checks={['Marcas con sucursales ilimitadas', 'Dashboard por sucursal', 'Mapa interactivo con aforo en vivo']} visual={<BranchVisual />} reverse />

    {/* ═══ CTA FINAL ═══ */}
    <section style={{ background: bg, padding: '120px 40px', borderTop: `1px solid ${cardBorder}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 48 }}>
        <div style={{ flex: '1 1 400px' }}>
          <span style={{ fontSize: 12, color: mutedColor, textTransform: 'uppercase', letterSpacing: 2 }}>Empieza hoy</span>
          <h2 style={{ ...HD, fontSize: 44, lineHeight: 1.05, margin: '16px 0' }}>
            LISTO PARA TRANSFORMAR TU<br /><span style={{ color: C.cyan }}>GIMNASIO</span>
          </h2>
          <p style={{ color: mutedColor, fontSize: 15, lineHeight: 1.7, maxWidth: 420 }}>
            Crea tu cuenta en segundos. Un administrador te asignará el acceso a tu sucursal o marca.
          </p>
        </div>
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/login" style={{ background: C.orange, color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '16px', borderRadius: 6, fontSize: 15, textAlign: 'center' }}>Iniciar Sesión</Link>
          <Link to="/register" style={{ background: C.green, color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '16px', borderRadius: 6, fontSize: 15, textAlign: 'center' }}>Crear Cuenta</Link>
          <span style={{ color: '#3A3A58', fontSize: 12, textAlign: 'center' }}>Sin tarjeta de crédito requerida</span>
        </div>
      </div>
    </section>

    {/* ═══ FOOTER ═══ */}
    <footer style={{ background: bg2, borderTop: `1px solid ${rowBorder}`, padding: '24px 40px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 14, fontWeight: 700 }}><span style={{ color: C.cyan }}>GymSync</span><span style={{ color: C.orange }}> Pro</span></span>
      <span style={{ color: '#3A3A58', fontSize: 12 }}>© 2026 GymSync Pro. Todos los derechos reservados.</span>
      <div style={{ display: 'flex', gap: 20 }}>
        {['Términos', 'Privacidad', 'Contacto'].map(l => (
          <span key={l} style={{ color: '#3A3A58', fontSize: 12, cursor: 'pointer' }}>{l}</span>
        ))}
      </div>
    </footer>
  </div>
  );
};

// ── Feature row component ──
const FeatureRow = ({ bg, accent, tag, title, heading: h, desc, checks, visual, reverse }: {
  bg: string; accent: string; tag: string; title: string; heading: string; desc: string; checks: string[]; visual: React.ReactNode; reverse: boolean;
}) => (
  <section style={{ background: bg, padding: '112px 40px' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap', flexDirection: reverse ? 'row-reverse' : 'row' }}>
      <div style={{ flex: '1 1 400px', minWidth: 280 }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: accent, letterSpacing: '0.2em', textTransform: 'uppercase' }}>[ {tag} ] {title}</span>
        <h2 style={{ ...HD, fontSize: 36, lineHeight: 1.1, margin: '20px 0 16px', color: C.text }}>{h}</h2>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>{desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {checks.map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>
              </div>
              <span style={{ color: C.text, fontSize: 14 }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: '1 1 380px', minWidth: 280 }}>{visual}</div>
    </div>
  </section>
);

// ── Visual: QR ──
const QRVisual = () => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, textAlign: 'center' }}>
    <div style={{ width: 140, height: 140, margin: '0 auto 20px', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(7, 1fr)', gap: 3 }}>
        {Array.from({ length: 49 }).map((_, i) => (
          <div key={i} style={{ background: [0,1,2,6,7,8,12,14,18,20,24,28,30,34,36,40,42,46,47,48].includes(i) ? C.cyan : '#1A1A2C', borderRadius: 2 }} />
        ))}
      </div>
      {[{ top: -4, left: -4 }, { top: -4, right: -4 }, { bottom: -4, left: -4 }, { bottom: -4, right: -4 }].map((pos, i) => (
        <div key={i} style={{ position: 'absolute', ...pos, width: 20, height: 20, borderColor: C.cyan, borderStyle: 'solid', borderWidth: 0, ...(i === 0 ? { borderTopWidth: 2, borderLeftWidth: 2 } : i === 1 ? { borderTopWidth: 2, borderRightWidth: 2 } : i === 2 ? { borderBottomWidth: 2, borderLeftWidth: 2 } : { borderBottomWidth: 2, borderRightWidth: 2 }) }} />
      ))}
    </div>
    <span style={{ color: C.green, fontSize: 14, fontWeight: 700 }}>✓ Acceso verificado</span>
    <p style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Juan Cliente · Zona Cardio · 08:00</p>
  </div>
);

// ── Visual: Roles ──
const RolesVisual = () => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
    {[
      { role: 'Super Admin', level: 10, w: '100%' },
      { role: 'Gerente', level: 5, w: '50%' },
      { role: 'Recepcionista', level: 4, w: '40%' },
      { role: 'Entrenador', level: 3, w: '30%' },
      { role: 'Cliente', level: 1, w: '10%' },
    ].map((r, i) => (
      <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid #13132A' : 'none' }}>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 600, width: 120 }}>{r.role}</span>
        <div style={{ flex: 1, height: 6, background: '#1A1A2C', borderRadius: 3 }}>
          <div style={{ height: 6, borderRadius: 3, width: r.w, background: C.orange }} />
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.orange, width: 24, textAlign: 'right' }}>{r.level}</span>
      </div>
    ))}
  </div>
);

// ── Visual: Schedule grid ──
const ScheduleVisual = () => {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const slots = [
    [1, 0, 1, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 0, 0],
  ];
  const names = ['Yoga', 'Spinning', 'CrossFit', 'Cardio'];
  const colors = [C.green, C.green, C.orange, C.cyan];
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 4 }}>
        <div />
        {days.map(d => <div key={d} style={{ fontSize: 11, color: C.muted, textAlign: 'center', padding: 4 }}>{d}</div>)}
        {slots.map((row, ri) => (
          <React.Fragment key={ri}>
            <div style={{ fontSize: 11, color: C.muted, padding: 4, display: 'flex', alignItems: 'center' }}>{names[ri]}</div>
            {row.map((v, ci) => (
              <div key={ci} style={{ height: 28, borderRadius: 4, background: v ? colors[ri] + '22' : '#0D0D18', border: v ? `1px solid ${colors[ri]}44` : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {v ? <span style={{ fontSize: 9, color: colors[ri], fontWeight: 700 }}>{names[ri].substring(0, 3)}</span> : null}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ── Visual: Branches ──
const BranchVisual = () => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
    {[
      { initials: 'PC', name: 'Premier Centro', status: C.green, label: 'Abierto' },
      { initials: 'PE', name: 'Premier Equipetrol', status: C.green, label: 'Abierto' },
      { initials: 'SF', name: 'Smart Fit Banzer', status: C.orange, label: 'Aforo alto' },
      { initials: 'BC', name: 'Bio Center Santos Dumont', status: C.green, label: 'Abierto' },
    ].map((b, i) => (
      <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 3 ? '1px solid #13132A' : 'none' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1A1A2C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.cyan, flexShrink: 0 }}>{b.initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.status }} />
          <span style={{ fontSize: 12, color: b.status }}>{b.label}</span>
        </div>
      </div>
    ))}
  </div>
);

