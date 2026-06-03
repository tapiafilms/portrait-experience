import { useState } from 'react'

function smoothScroll(e, id) {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={s.root}>

      {/* ── Nav ── */}
      <nav style={s.nav}>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={s.navLogo} />
        <div style={s.navLinks}>
          <a href="#como-funciona" style={s.navLink} onClick={e => smoothScroll(e, 'como-funciona')}>Cómo funciona</a>
          <a href="#features" style={s.navLink} onClick={e => smoothScroll(e, 'features')}>Features</a>
          <a href="#contacto" style={s.navLink} onClick={e => smoothScroll(e, 'contacto')}>Contacto</a>
          <a href="/totem" style={s.navCta}>Iniciar tótem →</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={s.hero}>
        <div style={s.heroBg} />
        <div style={s.heroGlow} />

        <div style={s.heroContent}>
          <div style={s.badge}>✦ Powered by AI</div>

          <h1 style={s.heroTitle}>
            Tu retrato{' '}
            <span style={s.heroGrad}>transformado por IA</span>
            {' '}en segundos
          </h1>

          <p style={s.heroSub}>
            Una experiencia interactiva para eventos corporativos. El tótem conversa,
            toma la foto y la transforma en un personaje Pixar — todo en tiempo real.
          </p>

          <div style={s.heroCtas}>
            <a href="#contacto" style={s.ctaPrimary} onClick={e => smoothScroll(e, 'contacto')}>Quiero esto en mi evento</a>
            <a href="#como-funciona" style={s.ctaSecondary} onClick={e => smoothScroll(e, 'como-funciona')}>Ver cómo funciona</a>
          </div>
        </div>

        {/* Video demo placeholder */}
        <div style={s.heroVideo}>
          <div style={s.videoFrame}>
            <div style={s.videoPlaceholder}>
              <div style={s.playBtn}>▶</div>
              <p style={s.videoLabel}>Demo en vivo</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="como-funciona" style={s.section}>
        <p style={s.sectionTag}>FLUJO DE EXPERIENCIA</p>
        <h2 style={s.sectionTitle}>Simple para el invitado.<br />Impresionante para todos.</h2>

        <div style={s.steps}>
          {[
            { n: '01', icon: '🎙️', title: 'El tótem saluda', desc: 'Un fotógrafo virtual con voz natural saluda al invitado, lo identifica y lo prepara para la foto.' },
            { n: '02', icon: '📸', title: 'Captura y transforma', desc: 'Se toma la foto y la IA la convierte en un personaje Pixar en tiempo real, preservando los rasgos de la persona.' },
            { n: '03', icon: '📱', title: 'Descarga y asistente', desc: 'Aparece el QR para descargar. Una asistente virtual informa mesa, horarios y responde preguntas del evento.' },
          ].map(step => (
            <div key={step.n} style={s.step}>
              <div style={s.stepNum}>{step.n}</div>
              <div style={s.stepIcon}>{step.icon}</div>
              <h3 style={s.stepTitle}>{step.title}</h3>
              <p style={s.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ ...s.section, background: 'rgba(255,255,255,0.02)' }}>
        <p style={s.sectionTag}>TECNOLOGÍA</p>
        <h2 style={s.sectionTitle}>Todo funciona solo.<br />Tú solo enchufas el tótem.</h2>

        <div style={s.features}>
          {[
            { icon: '🤖', title: 'IA Conversacional', desc: 'Claude AI identifica al invitado por nombre, busca su perfil y personaliza toda la experiencia en tiempo real.' },
            { icon: '🎨', title: 'Transformación Pixar', desc: 'Flux Pro convierte cada foto en un personaje 3D de calidad cinematográfica en menos de 30 segundos.' },
            { icon: '🎙️', title: 'Voz Natural', desc: 'ElevenLabs genera voces humanas para el fotógrafo y la asistente, sincronizadas con el avatar animado.' },
            { icon: '📊', title: 'Base de invitados', desc: 'Carga el Excel del cliente antes del evento. El sistema identifica a cada persona por nombre automáticamente.' },
            { icon: '📱', title: 'QR instantáneo', desc: 'El código QR aparece en pantalla al terminar. El invitado escanea y descarga su retrato desde el celular.' },
            { icon: '🔑', title: 'Clave por evento', desc: 'Cada evento tiene su propia clave de acceso con expiración automática. Sin configuración técnica en el lugar.' },
          ].map(f => (
            <div key={f.title} style={s.featureCard}>
              <span style={s.featureIcon}>{f.icon}</span>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Casos de uso ── */}
      <section style={s.section}>
        <p style={s.sectionTag}>CASOS DE USO</p>
        <h2 style={s.sectionTitle}>Ideal para cualquier<br />evento corporativo.</h2>

        <div style={s.useCases}>
          {[
            { emoji: '🏆', label: 'Galas y premios' },
            { emoji: '🚀', label: 'Lanzamientos de producto' },
            { emoji: '🎓', label: 'Graduaciones corporativas' },
            { emoji: '🤝', label: 'Convenciones y congresos' },
            { emoji: '🎉', label: 'Fiestas de fin de año' },
            { emoji: '💼', label: 'Cenas ejecutivas' },
          ].map(u => (
            <div key={u.label} style={s.useCase}>
              <span style={{ fontSize: 32 }}>{u.emoji}</span>
              <p style={s.useCaseLabel}>{u.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA / Contacto ── */}
      <section id="contacto" style={s.ctaSection}>
        <div style={s.ctaGlow} />
        <div style={s.ctaContent}>
          <p style={s.sectionTag}>CONTÁCTANOS</p>
          <h2 style={{ ...s.sectionTitle, marginBottom: 12 }}>
            ¿Tienes un evento próximo?
          </h2>
          <p style={{ ...s.heroSub, marginBottom: 36 }}>
            Cuéntanos la fecha y el tipo de evento. Configuramos todo en menos de 24 horas.
          </p>

          <div style={s.contactBtns}>
            <a
              href="https://wa.me/56999999999?text=Hola,%20quiero%20contratar%20AI%20Portrait%20Experience%20para%20mi%20evento"
              target="_blank"
              rel="noopener noreferrer"
              style={s.ctaPrimary}
            >
              💬 Escribir por WhatsApp
            </a>
            <a href="mailto:hola@genofy.cl" style={s.ctaSecondary}>
              ✉️ Enviar email
            </a>
          </div>

          <div style={s.divider} />

          <a href="/totem" style={s.totemLink}>
            ¿Ya tienes tu clave? → Iniciar tótem
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={{ height: 28 }} />
        <p style={s.footerText}>© 2025 Genofy · AI Portrait Experience</p>
        <a href="https://www.genofy.cl" style={s.footerLink} target="_blank" rel="noopener noreferrer">
          genofy.cl →
        </a>
      </footer>

    </div>
  )
}

const GRAD = 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)'

const s = {
  root: {
    minHeight: '100vh',
    background: '#050810',
    color: '#fff',
    fontFamily: "'Inter', system-ui, sans-serif",
    overflowX: 'hidden',
  },

  // Nav
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 48px',
    background: 'rgba(5,8,16,0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  navLogo: { height: 28, objectFit: 'contain' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 32 },
  navLink: {
    color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500,
    textDecoration: 'none', transition: 'color 0.2s',
  },
  navCta: {
    background: GRAD, color: '#fff',
    padding: '8px 20px', borderRadius: 50,
    fontSize: 14, fontWeight: 700,
    textDecoration: 'none', letterSpacing: '0.02em',
  },

  // Hero
  hero: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 64, padding: '120px 48px 80px',
    position: 'relative', flexWrap: 'wrap',
  },
  heroBg: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage: 'url(/bg-totem.png)',
    backgroundSize: 'cover', backgroundPosition: 'center',
    opacity: 0.15,
  },
  heroGlow: {
    position: 'absolute', top: '20%', left: '50%',
    transform: 'translateX(-50%)',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  heroContent: {
    zIndex: 1, maxWidth: 560, flex: '1 1 400px',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(139,92,246,0.15)',
    border: '1px solid rgba(139,92,246,0.4)',
    color: '#a78bfa', fontSize: 12, fontWeight: 700,
    letterSpacing: '0.1em', padding: '6px 16px', borderRadius: 50,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 56, fontWeight: 900, lineHeight: 1.1,
    margin: '0 0 20px', letterSpacing: '-0.02em',
  },
  heroGrad: {
    background: GRAD,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSub: {
    fontSize: 18, color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.7, margin: '0 0 36px', maxWidth: 480,
  },
  heroCtas: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  ctaPrimary: {
    background: GRAD, color: '#fff',
    padding: '14px 28px', borderRadius: 50,
    fontSize: 15, fontWeight: 700,
    textDecoration: 'none', letterSpacing: '0.02em',
    boxShadow: '0 8px 32px rgba(139,92,246,0.4)',
  },
  ctaSecondary: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.8)',
    padding: '14px 28px', borderRadius: 50,
    fontSize: 15, fontWeight: 600,
    textDecoration: 'none',
  },

  // Hero video
  heroVideo: {
    zIndex: 1, flex: '1 1 320px', display: 'flex',
    justifyContent: 'center',
  },
  videoFrame: {
    width: 340, height: 600,
    borderRadius: 28,
    border: '1.5px solid rgba(100,160,255,0.3)',
    boxShadow: '0 0 80px rgba(59,130,246,0.2)',
    overflow: 'hidden',
    background: 'rgba(0,10,40,0.8)',
  },
  videoPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  playBtn: {
    width: 64, height: 64, borderRadius: '50%',
    background: GRAD,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, cursor: 'pointer',
    boxShadow: '0 0 32px rgba(139,92,246,0.5)',
  },
  videoLabel: {
    fontSize: 14, color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.1em', margin: 0,
  },

  // Sections
  section: {
    padding: '100px 48px',
    maxWidth: 1100, margin: '0 auto',
    textAlign: 'center',
  },
  sectionTag: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
    color: '#6d28d9', textTransform: 'uppercase', margin: '0 0 16px',
  },
  sectionTitle: {
    fontSize: 42, fontWeight: 900, lineHeight: 1.15,
    margin: '0 0 56px', letterSpacing: '-0.02em',
  },

  // Steps
  steps: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 32,
  },
  step: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, padding: '36px 28px',
    textAlign: 'left', position: 'relative',
  },
  stepNum: {
    fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
    color: '#6d28d9', marginBottom: 16,
  },
  stepIcon: { fontSize: 36, marginBottom: 16 },
  stepTitle: { fontSize: 20, fontWeight: 800, margin: '0 0 12px' },
  stepDesc: { fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 },

  // Features
  features: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24,
  },
  featureCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: '28px 24px', textAlign: 'left',
  },
  featureIcon: { fontSize: 28, display: 'block', marginBottom: 12 },
  featureTitle: { fontSize: 17, fontWeight: 800, margin: '0 0 8px' },
  featureDesc: { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 },

  // Use cases
  useCases: {
    display: 'flex', flexWrap: 'wrap', gap: 16,
    justifyContent: 'center',
  },
  useCase: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: '20px 28px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8, minWidth: 140,
  },
  useCaseLabel: {
    fontSize: 14, fontWeight: 600,
    color: 'rgba(255,255,255,0.7)', margin: 0, textAlign: 'center',
  },

  // CTA section
  ctaSection: {
    padding: '100px 48px',
    textAlign: 'center',
    position: 'relative',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  ctaGlow: {
    position: 'absolute', top: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: 600, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  ctaContent: { position: 'relative', zIndex: 1 },
  contactBtns: {
    display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
  },
  divider: {
    width: 1, height: 40, background: 'rgba(255,255,255,0.1)',
    margin: '40px auto',
  },
  totemLink: {
    fontSize: 14, color: 'rgba(255,255,255,0.4)',
    textDecoration: 'none', letterSpacing: '0.05em',
  },

  // Footer
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 48px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    flexWrap: 'wrap', gap: 12,
  },
  footerText: {
    fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0,
  },
  footerLink: {
    fontSize: 13, color: 'rgba(255,255,255,0.4)',
    textDecoration: 'none',
  },
}
