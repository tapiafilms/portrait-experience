import { useState, useEffect, useRef } from 'react'

/* ── Google Fonts ── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');
  `}</style>
)

/* ── Smooth scroll ── */
function smoothScroll(e, id) {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* ── Parallax hook ── */
function useParallax(speed = 0.1) {
  const ref = useRef(null)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!ref.current) return
          const rect = ref.current.parentElement.getBoundingClientRect()
          const center = (rect.top + rect.height / 2) - window.innerHeight / 2
          ref.current.style.transform = `translateY(${center * speed}px)`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])
  return ref
}

/* ── Image Placeholder ── */
function ImgPlaceholder({ label, hint, tall }) {
  return (
    <div style={{ ...s.imgPlaceholder, ...(tall ? s.imgPlaceholderTall : {}) }}>
      <div style={s.imgPlaceholderInner} />
      <span style={s.imgLabel}>📸 {label}</span>
      {hint && <span style={s.imgHint}>{hint}</span>}
    </div>
  )
}

/* ── Parallax Image wrapper ── */
function ParallaxImg({ label, hint, tall, speed = 0.1 }) {
  const ref = useParallax(speed)
  return (
    <div style={s.parallaxOuter}>
      <div ref={ref} style={s.parallaxInner}>
        <ImgPlaceholder label={label} hint={hint} tall={tall} />
      </div>
    </div>
  )
}

/* ── Hero with parallax bg ── */
function HeroParallaxBg() {
  const ref = useRef(null)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (ref.current) ref.current.style.transform = `translateY(${window.scrollY * 0.3}px)`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div style={s.heroBgWrap}>
      <div ref={ref} style={s.heroBgParallax}>
        <img
  src="/img/hero.png"
  alt="Tótem en evento"
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
  }}
/>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={s.root}>
      <FontLoader />

      {/* ── Nav ── */}
      <nav style={s.nav}>
        <img src="/logo-genofy-transparent.png" alt="Genofy" style={s.navLogo} />
        <div style={s.navLinks}>
          <a href="#flujo"    style={s.navLink} onClick={e => smoothScroll(e, 'flujo')}>Cómo funciona</a>
          <a href="#movil"    style={s.navLink} onClick={e => smoothScroll(e, 'movil')}>App del invitado</a>
          <a href="#tech"     style={s.navLink} onClick={e => smoothScroll(e, 'tech')}>Qué incluye</a>
          <a href="#contacto" style={s.navLink} onClick={e => smoothScroll(e, 'contacto')}>Contacto</a>
          <a href="/totem" style={s.navCta}>Iniciar tótem →</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={s.hero}>
        <HeroParallaxBg />
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          <div style={s.badge}>✦ Powered by Genofy</div>
          <h1 style={s.heroTitle}>
            Transforma a tus<br />
            <span style={s.heroGrad}>invitados en protagonistas</span><br />
            del evento.
          </h1>
        </div>
        <div style={s.heroCtas}>
          <a href="#contacto" style={s.ctaPrimary} onClick={e => smoothScroll(e, 'contacto')}>Solicitar Demo</a>
          <a href="#flujo"    style={s.ctaSecondary} onClick={e => smoothScroll(e, 'flujo')}>Ver experiencia</a>
        </div>
      </section>

      {/* ── Stats ── */}
      <div style={s.statsBar}>
        {[
          { num: '+500',  label: 'Eventos realizados' },
          { num: '<30s',  label: 'Por transformación' },
          { num: '99.9%', label: 'Uptime garantizado' },
          { num: '4.9★',  label: 'Satisfacción promedio' },
        ].map((st, i) => (
          <div key={st.label} style={{ ...s.stat, ...(i < 3 ? s.statBorder : {}) }}>
            <span style={s.statNum}>{st.num}</span>
            <span style={s.statLabel}>{st.label}</span>
          </div>
        ))}
      </div>

      {/* ── Text break 1 ── */}
      <section style={s.textBreak}>
        <p style={s.eyebrowCenter}>La experiencia</p>
        <h2 style={s.headlineXL}>
          Tu evento se convierte<br />en una experiencia<br />de película.
        </h2>
      </section>

      {/* ── Feature full-width ── */}
      <section id="flujo" style={s.featureFull}>
        <div style={s.featureFullImg}>
          <ParallaxImg
            label="FOTO TÓTEM 01"
            hint="Tótem encendido de frente, pantalla con bienvenida visible"
            tall
          />
        </div>
        <div style={s.featureFullText}>
          <p style={s.eyebrowAccent}>Flujo de experiencia</p>
          <h2 style={s.featureH2}>Simple para el invitado.<br />Impresionante para todos.</h2>
          <p style={s.bodyText}>
            Cada invitado se transforma en un personaje Pixar y aparece en la pantalla gigante.
            Todo en tiempo real, sin fotógrafo, sin apps, sin complicaciones.
          </p>
        </div>
      </section>

      {/* ── 4 Steps (splits 50/50) ── */}
      <section style={s.stepsSection}>
        {[
          {
            n: '01', reverse: false,
            label: 'FOTO TÓTEM 02', hint: 'Invitado frente al tótem siendo recibido por el avatar',
            title: 'El tótem te da la bienvenida',
            desc: 'Un fotógrafo con IA y voz humana te recibe por tu nombre, te guía y crea el momento perfecto para tu retrato.',
          },
          {
            n: '02', reverse: true,
            label: 'FOTO TÓTEM 03', hint: 'Pantalla mostrando la transformación Pixar en proceso',
            title: 'Tu foto se convierte en arte',
            desc: 'La IA transforma tu retrato en un personaje Pixar en menos de 30 segundos, preservando tus rasgos únicos.',
          },
          {
            n: '03', reverse: false,
            label: 'FOTO TÓTEM 04', hint: 'Invitado escaneando el QR con su celular, sonriendo',
            title: 'Tu retrato, en tu celular',
            desc: 'Escanea el QR y al instante tienes tu retrato guardado. Sin descargar ninguna app.',
          },
          {
            n: '04', reverse: true,
            label: 'FOTO PANTALLA 01', hint: 'Pantalla gigante del evento con galería de retratos proyectada',
            title: 'Sé parte de la pantalla gigante',
            desc: 'Comparte fotos desde tu celular que aparecen en la pantalla del evento. Tú y todos los demás, en el centro de la noche.',
          },
        ].map(step => (
          <div key={step.n} style={{ ...s.stepSplit, ...(step.reverse ? s.stepSplitReverse : {}) }}>
            <div style={s.stepImg}>
              <ParallaxImg label={step.label} hint={step.hint} speed={0.08} />
            </div>
            <div style={s.stepText}>
              <span style={s.stepNum}>{step.n}</span>
              <h3 style={s.stepTitle}>{step.title}</h3>
              <p style={s.stepDesc}>{step.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Text break 2 ── */}
      <section style={{ ...s.textBreak, background: '#050508' }} id="movil">
        <p style={s.eyebrowCenter}>App del invitado</p>
        <h2 style={s.headlineXL}>Una experiencia completa<br />desde tu bolsillo.</h2>
      </section>

      {/* ── Mobile section ── */}
      <section style={s.mobileSection}>
        <div style={s.mobileImg}>
          <ParallaxImg
            label="FOTO MÓVIL 01"
            hint="Mano sosteniendo celular con el retrato Pixar en pantalla"
            tall
            speed={0.08}
          />
        </div>
        <div style={s.mobileFeatures}>
          {[
            { n: '01', title: 'Tu retrato, listo para compartir',  desc: 'Tu transformación Pixar aparece de inmediato. Un toque y queda guardado en tu galería.' },
            { n: '02', title: 'Todos los retratos, en vivo',       desc: 'Ve cómo van llegando los retratos del resto de los invitados en tiempo real. Un feed exclusivo del evento.' },
            { n: '03', title: 'Sube tus fotos al evento',          desc: 'Abre la cámara y captura el momento. Si pasa la moderación, aparece en la pantalla gigante en segundos.' },
            { n: '04', title: 'Vuelve las veces que quieras',      desc: 'Sin límites. Pasa por el tótem de nuevo, toma más fotos, comparte más momentos.' },
          ].map((item, i) => (
            <div key={item.n} style={{ ...s.mobileItem, ...(i === 0 ? s.mobileItemFirst : {}) }}>
              <span style={s.mobileNum}>{item.n}</span>
              <div>
                <h4 style={s.mobileItemTitle}>{item.title}</h4>
                <p style={s.mobileItemDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Text break 3 ── */}
      <section style={s.textBreak} id="tech">
        <p style={s.eyebrowCenter}>Tecnología</p>
        <h2 style={s.headlineXL}>Todo funciona solo.<br />Tú solo enchufas el tótem.</h2>
      </section>

      {/* ── Tech grid ── */}
      <section style={s.techSection}>
        <div style={s.techGrid}>
          {[
            { icon: '🤖', title: 'Reconocimiento por nombre',      desc: 'La IA identifica a cada invitado por nombre desde una lista precargada y personaliza toda la experiencia.' },
            { icon: '🎨', title: 'Transformación Pixar',           desc: 'Flux Pro convierte cada foto en un personaje 3D de calidad cinematográfica en menos de 30 segundos.' },
            { icon: '🎙️', title: 'Fotógrafo con voz humana',       desc: 'ElevenLabs genera una voz natural que guía al invitado durante la experiencia, sincronizada con el avatar animado.' },
            { icon: '📊', title: 'Lista de invitados precargada',  desc: 'Carga el Excel con los asistentes antes del evento. El tótem reconoce a cada persona automáticamente.' },
            { icon: '📱', title: 'QR instantáneo',                 desc: 'El código QR aparece en pantalla al terminar. El invitado escanea y descarga su retrato desde el celular.' },
            { icon: '🔑', title: 'Acceso seguro por evento',       desc: 'Cada evento tiene su código único con expiración automática. Sin instalaciones ni configuración técnica.' },
          ].map((f, i) => (
            <div key={f.title} style={{ ...s.techCard, ...(i % 3 !== 2 ? s.techCardBorderR : {}), ...(i < 3 ? s.techCardBorderB : {}) }}>
              <span style={s.techIcon}>{f.icon}</span>
              <h4 style={s.techTitle}>{f.title}</h4>
              <p style={s.techDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Contacto ── */}
      <section id="contacto" style={s.contactSection}>
        <p style={s.eyebrowCenter}>Contáctanos</p>
        <h2 style={s.headlineXL}>Hagámoslo realidad.</h2>
        <p style={s.contactSub}>
          Cuéntanos tu fecha y en menos de 24 horas tienes todo listo.<br />
          Sin complicaciones técnicas de tu parte.
        </p>
        <div style={s.contactBtns}>
          <a
            href="https://wa.me/56999999999?text=Hola,%20quiero%20contratar%20AI%20Portrait%20Experience%20para%20mi%20evento"
            target="_blank" rel="noopener noreferrer"
            style={s.btnWhatsapp}
          >
            💬 Escribir por WhatsApp
          </a>
          <a href="mailto:hola@genofy.cl" style={s.btnEmail}>
            ✉️ Enviar email
          </a>
        </div>
        <a href="/totem" style={s.totemLink}>¿Ya tienes tu clave? → Iniciar tótem</a>
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

/* ══════════════════════════════════════════
   STYLES
══════════════════════════════════════════ */
const PURPLE   = '#7C3AED'
const PURPLE_L = '#A855F7'
const CYAN     = '#06B6D4'
const GRAD     = `linear-gradient(135deg, ${PURPLE_L}, ${CYAN})`
const BLACK    = '#000000'
const BG       = '#080808'
const BORDER   = 'rgba(255,255,255,0.08)'
const GRAY     = '#94A3B8'
const MUTED    = '#475569'

const s = {
  root: {
    minHeight: '100vh',
    background: BLACK,
    color: '#F8FAFC',
    fontFamily: "'Inter', system-ui, sans-serif",
    overflowX: 'hidden',
  },

  /* NAV */
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: 52,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${BORDER}`,
  },
  navLogo: { height: 26, objectFit: 'contain' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 32 },
  navLink: {
    color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500,
    textDecoration: 'none',
  },
  navCta: {
    background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_L})`,
    color: '#fff', padding: '8px 18px', borderRadius: 8,
    fontSize: 13, fontWeight: 600, textDecoration: 'none',
    boxShadow: `0 0 16px rgba(124,58,237,0.4)`,
  },

  /* HERO */
  hero: {
    position: 'relative',
    height: '100vh', minHeight: 700,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 80, overflow: 'hidden',
  },
  heroBgWrap: {
    position: 'absolute', inset: 0, overflow: 'hidden',
  },
  heroBgParallax: {
    position: 'absolute', top: '-10%', left: 0, right: 0,
    height: '120%', willChange: 'transform',
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.3) 100%)',
    zIndex: 1,
  },
  heroContent: {
    position: 'relative', zIndex: 2,
    textAlign: 'center', padding: '0 2rem',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    color: PURPLE_L,
    border: `1px solid rgba(168,85,247,0.35)`,
    borderRadius: 999, padding: '5px 14px',
    background: 'rgba(168,85,247,0.1)',
    marginBottom: 24,
  },
  heroTitle: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)',
    fontWeight: 900, lineHeight: 1.08,
    letterSpacing: '-0.03em', margin: 0,
    color: 'white',
  },
  heroGrad: {
    background: GRAD,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroCtas: {
    position: 'relative', zIndex: 2,
    display: 'flex', gap: 16, marginTop: 40,
    justifyContent: 'center',
  },
  ctaPrimary: {
    background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_L})`,
    color: '#fff', padding: '14px 32px', borderRadius: 10,
    fontSize: 15, fontWeight: 700, textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
  },
  ctaSecondary: {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px)',
    color: 'rgba(255,255,255,0.85)',
    padding: '14px 32px', borderRadius: 10,
    fontSize: 15, fontWeight: 600, textDecoration: 'none',
    border: `1px solid rgba(255,255,255,0.15)`,
  },

  /* STATS */
  statsBar: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    borderTop: `1px solid ${BORDER}`,
    borderBottom: `1px solid ${BORDER}`,
    background: 'rgba(255,255,255,0.02)',
  },
  stat: {
    padding: '2.5rem 1rem', textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  statBorder: { borderRight: `1px solid ${BORDER}` },
  statNum: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '2.4rem', fontWeight: 900, lineHeight: 1,
    background: GRAD,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  statLabel: { fontSize: 12, color: MUTED, fontWeight: 500 },

  /* TEXT BREAKS */
  textBreak: {
    padding: '8rem 2rem', textAlign: 'center',
    background: BLACK,
  },
  eyebrowCenter: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
    textTransform: 'uppercase', color: PURPLE_L,
    marginBottom: 24, display: 'block',
  },
  eyebrowAccent: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: PURPLE_L,
    marginBottom: 16, display: 'block',
  },
  headlineXL: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 'clamp(2.5rem, 5vw, 5rem)',
    fontWeight: 900, lineHeight: 1.1,
    letterSpacing: '-0.03em', color: 'white', margin: 0,
  },

  /* FEATURE FULL */
  featureFull: {
    background: BG, padding: '0 2rem 6rem',
  },
  featureFullImg: {
    maxWidth: 1100, margin: '0 auto 3rem',
    overflow: 'hidden', borderRadius: 20,
  },
  featureFullText: {
    maxWidth: 700, margin: '0 auto', textAlign: 'center',
  },
  featureH2: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 'clamp(2rem, 3.5vw, 3.2rem)',
    fontWeight: 800, lineHeight: 1.15,
    letterSpacing: '-0.025em', marginBottom: 20, color: 'white',
  },
  bodyText: { fontSize: 17, color: GRAY, lineHeight: 1.7, margin: 0 },

  /* STEPS */
  stepsSection: { background: BLACK },
  stepSplit: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    minHeight: 500, overflow: 'hidden',
  },
  stepSplitReverse: { direction: 'rtl' },
  stepImg: { overflow: 'hidden' },
  stepText: {
    direction: 'ltr',
    padding: '5rem',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20,
    background: BLACK,
  },
  stepNum: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '3.5rem', fontWeight: 900, lineHeight: 1,
    background: GRAD,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text', opacity: 0.6,
  },
  stepTitle: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
    fontWeight: 800, lineHeight: 1.2,
    letterSpacing: '-0.02em', margin: 0,
  },
  stepDesc: { fontSize: 16, color: GRAY, lineHeight: 1.75, margin: 0, maxWidth: 420 },

  /* MOBILE */
  mobileSection: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    maxWidth: 1200, margin: '0 auto',
    padding: '0 2rem 6rem', gap: 64, alignItems: 'start',
  },
  mobileImg: { overflow: 'hidden', borderRadius: 16 },
  mobileFeatures: { display: 'flex', flexDirection: 'column', paddingTop: 32 },
  mobileItem: {
    display: 'flex', gap: 24, padding: '2rem 0',
    borderBottom: `1px solid ${BORDER}`,
  },
  mobileItemFirst: { borderTop: `1px solid ${BORDER}` },
  mobileNum: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 13, fontWeight: 800, color: PURPLE_L,
    minWidth: 28, paddingTop: 3,
  },
  mobileItemTitle: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 16, fontWeight: 700, margin: '0 0 8px',
  },
  mobileItemDesc: { fontSize: 14, color: GRAY, lineHeight: 1.65, margin: 0 },

  /* TECH */
  techSection: { background: BG, padding: '0 2rem 8rem' },
  techGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    maxWidth: 1100, margin: '0 auto',
    border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden',
  },
  techCard: {
    background: BG, padding: '2.5rem 2rem',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  techCardBorderR: { borderRight: `1px solid ${BORDER}` },
  techCardBorderB: { borderBottom: `1px solid ${BORDER}` },
  techIcon: { fontSize: 28 },
  techTitle: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 15, fontWeight: 700, margin: 0,
  },
  techDesc: { fontSize: 14, color: GRAY, lineHeight: 1.65, margin: 0 },

  /* CONTACT */
  contactSection: {
    padding: '10rem 2rem', textAlign: 'center',
    background: BLACK,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
  },
  contactSub: { fontSize: 16, color: GRAY, lineHeight: 1.7, maxWidth: 480, margin: 0 },
  contactBtns: { display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  btnWhatsapp: {
    background: 'rgba(37,211,102,0.12)',
    border: '1px solid rgba(37,211,102,0.3)',
    color: '#4ade80', textDecoration: 'none',
    padding: '14px 28px', borderRadius: 12,
    fontWeight: 600, fontSize: 15,
  },
  btnEmail: {
    background: `rgba(124,58,237,0.12)`,
    border: `1px solid rgba(124,58,237,0.3)`,
    color: PURPLE_L, textDecoration: 'none',
    padding: '14px 28px', borderRadius: 12,
    fontWeight: 600, fontSize: 15,
  },
  totemLink: {
    color: GRAY, textDecoration: 'none', fontSize: 14, fontWeight: 500,
    border: `1px solid ${BORDER}`, padding: '10px 24px', borderRadius: 999,
  },

  /* FOOTER */
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 48px',
    borderTop: `1px solid ${BORDER}`,
    background: BLACK, flexWrap: 'wrap', gap: 12,
  },
  footerText: { fontSize: 13, color: MUTED, margin: 0 },
  footerLink: { fontSize: 13, color: MUTED, textDecoration: 'none' },

  /* PLACEHOLDER */
  imgPlaceholder: {
    width: '100%', height: '100%', minHeight: 400,
    background: 'linear-gradient(135deg, #0f0f1a, #111122, #0a0a14)',
    border: '1px dashed rgba(124,58,237,0.3)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 12, borderRadius: 16, padding: 32,
    position: 'relative', overflow: 'hidden',
  },
  imgPlaceholderTall: { minHeight: 560 },
  imgPlaceholderInner: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)',
    borderRadius: 16,
  },
  imgLabel: {
    fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
    color: 'rgba(168,85,247,0.9)',
    background: 'rgba(124,58,237,0.12)',
    border: '1px solid rgba(124,58,237,0.25)',
    padding: '6px 16px', borderRadius: 999,
    position: 'relative', zIndex: 1,
  },
  imgHint: {
    fontSize: 12, color: MUTED, textAlign: 'center',
    maxWidth: 280, lineHeight: 1.5,
    position: 'relative', zIndex: 1,
  },

  /* PARALLAX */
  parallaxOuter: {
    overflow: 'hidden', width: '100%', height: '100%', minHeight: 480,
  },
  parallaxInner: {
    width: '100%', height: '115%',
    marginTop: '-7.5%',
    willChange: 'transform',
  },
}