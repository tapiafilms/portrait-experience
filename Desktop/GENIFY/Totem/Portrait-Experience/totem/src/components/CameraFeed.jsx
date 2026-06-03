export default function CameraFeed({ videoRef, mirrored = true }) {
  return (
    <div style={styles.wrapper}>
      {/*
        El video es landscape (16:9) pero lo mostramos en portrait.
        objectFit: cover + centrado hace el crop automático al centro.
        transform: scaleX(-1) para efecto espejo natural.
      */}
      <video
        ref={videoRef}
        style={{
          ...styles.video,
          // Combinar ambos transforms — scaleX(-1) sobreescribe translate si van separados
          transform: mirrored
            ? 'translate(-50%, -50%) scaleX(-1)'
            : 'translate(-50%, -50%)',
        }}
        muted
        playsInline
        autoPlay
      />

      {/* Esquinas de encuadre */}
      <div style={{ ...styles.corner, top: 20, left: 20, borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 0, borderBottomWidth: 0 }} />
      <div style={{ ...styles.corner, top: 20, right: 20, borderTopWidth: 3, borderRightWidth: 3, borderLeftWidth: 0, borderBottomWidth: 0 }} />
      <div style={{ ...styles.corner, bottom: 20, left: 20, borderBottomWidth: 3, borderLeftWidth: 3, borderRightWidth: 0, borderTopWidth: 0 }} />
      <div style={{ ...styles.corner, bottom: 20, right: 20, borderBottomWidth: 3, borderRightWidth: 3, borderLeftWidth: 0, borderTopWidth: 0 }} />
    </div>
  )
}

const styles = {
  wrapper: {
    position: 'absolute',
    inset: 0,
    background: '#000',
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    // transform se aplica inline para poder combinar con scaleX(-1)
    width: 'auto',
    height: '100%',
    minWidth: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: 'rgba(200,169,110,0.8)',
    borderStyle: 'solid',
  },
}
