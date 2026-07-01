# Genofy Portrait Experience — Flujo Completo de Experiencia

> Documento interno · Genofy · v1.0

---

## Visión general

Genofy Portrait Experience es una plataforma de experiencias interactivas para eventos. Su propósito es transformar la noche en una narrativa de tres actos: una bienvenida memorable, participación colectiva durante el evento, y un clímax que involucra a todos los asistentes al mismo tiempo.

---

## Momento 1 — El Retrato

**Quién lo vive:** cada asistente individualmente  
**Cuándo:** al llegar al evento  
**Dispositivo:** tótem físico de 55" con cámara y parlantes

### Flujo

1. El asistente se para frente al tótem.
2. **Alex**, el fotógrafo virtual con voz de IA, lo saluda por nombre (si está en la lista de invitados) y lo guía para la foto.
3. Se toma la foto con cuenta regresiva.
4. La IA transforma el retrato al estilo Pixar en 15–30 segundos.
5. El tótem muestra el retrato transformado con una animación cinematográfica.
6. Se genera un **código QR personal** que el asistente escanea con su teléfono.
7. **Luna**, la asistente virtual, orienta al invitado: le informa su mesa, quiénes son sus compañeros, y responde preguntas sobre el evento.
8. El asistente descarga su retrato desde la app web.

### Resultado para el asistente
- Retrato estilo Pixar descargable
- Acceso a la app web del evento (punto de entrada para los Momentos 2 y 3)

---

## Momento 2 — La Pantalla Gigante

**Quién lo vive:** todos los asistentes durante toda la noche  
**Cuándo:** desde que llegan hasta el final del evento  
**Dispositivo:** teléfono personal → pantalla gigante del escenario

### Flujo

1. Una vez dentro de la app web (vía QR del Momento 1), cada asistente puede tomar fotos desde su teléfono.
2. Las fotos se suben en tiempo real al servidor.
3. La pantalla gigante del escenario muestra en rotación todas las fotos tomadas por los asistentes durante la noche.
4. Cualquier asistente puede contribuir en cualquier momento, sin instalar nada.

### Resultado para el evento
- Contenido generado por los propios asistentes
- Pantalla siempre viva y dinámica durante toda la noche
- Sentido de participación colectiva

---

## Momento 3 — El Sorteo

**Quién lo vive:** todos los asistentes simultáneamente  
**Cuándo:** en un momento específico de la noche (durante discursos u otro momento de pausa)  
**Dispositivo:** teléfono personal de cada asistente

### Contexto
El animador del evento anuncia el sorteo por micrófono e invita a todos a abrir la app en su teléfono.

### Flujo

1. El animador activa el sorteo desde un panel de control.
2. Todos los asistentes ven un botón **"PARTICIPAR"** en su teléfono.
3. Al presionar, el servidor empareja aleatoriamente a dos personas.
4. Cada asistente ve en su pantalla la imagen de su pareja desconocida:
   - **Eventos pequeños (hasta ~80 personas):** cámara en vivo — ves a tu pareja moviéndose en tiempo real.
   - **Eventos grandes (+80 personas):** foto instantánea — ves la foto de tu pareja tomada en ese momento.
5. El objetivo: **encontrar físicamente a esa persona dentro del recinto.**
6. Cuando se encuentran, uno acerca su teléfono al del otro. La cámara escanea el **QR que aparece en la pantalla del otro teléfono**.
7. El servidor registra el timestamp del escaneo.
8. **Las primeras dos personas en encontrarse y escanear el QR ganan el premio.**

### Mecanismo de confirmación
El QR en pantalla garantiza que el encuentro sea físico y real — no se puede hacer trampa presionando un botón a distancia. Requiere presencia física.

### Resultado para el evento
- Momento de tensión y movimiento colectivo único
- Rompe el hielo entre asistentes que no se conocen
- Clímax memorable que cierra la noche

---

## Resumen de la narrativa

| Momento | Nombre | Protagonista | Duración |
|---------|--------|--------------|----------|
| 1 | El Retrato | Cada asistente individualmente | ~3 min por persona |
| 2 | La Pantalla Gigante | Todos durante toda la noche | Toda la noche |
| 3 | El Sorteo | Todos simultáneamente | ~5–10 min |

---

## Modelo de negocio

- **Cliente:** productoras de eventos corporativos y matrimonios
- **Cobro:** por evento / por noche de uso
- **Operación:** Genofy configura el evento (invitados, logo, avatar). La productora solo ingresa con una clave.
- **Acceso:** 100% web — sin instalación para los asistentes

---

*Genofy — Documento Interno v1.0*
