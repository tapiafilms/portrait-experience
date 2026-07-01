-- ══════════════════════════════════════════
-- MOMENTO 3 — SORTEO
-- Ejecutar en Supabase > SQL Editor
-- ══════════════════════════════════════════

-- Estado del sorteo por evento
CREATE TABLE IF NOT EXISTS sorteo_events (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id            text NOT NULL UNIQUE,
  state               text NOT NULL DEFAULT 'inactive',
  -- 'inactive' | 'active' | 'countdown' | 'done'
  countdown_start_at  timestamptz,
  countdown_seconds   int DEFAULT 5,
  updated_at          timestamptz DEFAULT now()
);

-- Participantes del sorteo (uno por invitado/sesión)
CREATE TABLE IF NOT EXISTS sorteo_participants (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id          text NOT NULL UNIQUE,
  event_id            text NOT NULL,
  selfie_url          text,
  paired_session_id   text,
  paired_selfie_url   text,
  confirmed_at        timestamptz,
  created_at          timestamptz DEFAULT now()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS sorteo_participants_event_id ON sorteo_participants(event_id);
CREATE INDEX IF NOT EXISTS sorteo_participants_paired   ON sorteo_participants(event_id, paired_session_id);

-- Bucket de selfies (ejecutar también en Storage > Buckets si no existe)
-- Nombre: sorteo-selfies | Public: true
