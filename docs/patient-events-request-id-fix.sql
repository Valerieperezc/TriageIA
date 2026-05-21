-- Ejecuta en Supabase → SQL Editor si al finalizar pacientes ves:
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification"
--
-- Sustituye el índice único parcial por un constraint UNIQUE compatible con PostgREST.

drop index if exists public.patient_events_request_id_unique;
alter table public.patient_events drop constraint if exists patient_events_request_id_key;
alter table public.patient_events
  add constraint patient_events_request_id_key unique (request_id);
