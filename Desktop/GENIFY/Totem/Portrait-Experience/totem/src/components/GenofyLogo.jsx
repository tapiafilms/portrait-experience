export default function GenofyLogo({ size = 48, style = {} }) {
  return (
    <img
      src="/logo-genofy-transparent.png"
      alt="Genofy"
      style={{ height: size, width: 'auto', display: 'block', ...style }}
    />
  )
}
