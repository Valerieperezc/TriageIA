-- Migración: triage CTAS con sugerencia + asignación clínica (ejecutar en Supabase SQL Editor).

alter table public.patients add column if not exists triage_suggested text;
alter table public.patients add column if not exists triage_override_reason text;
alter table public.patients add column if not exists protocol_version text;
alter table public.patients add column if not exists chief_complaint_code text;
alter table public.patients add column if not exists ctas_red_flags text[] default '{}';

-- triage = nivel asignado (operativo en cola); backfill sugerido = asignado previo.
update public.patients
set triage_suggested = triage
where triage_suggested is null and triage is not null;

update public.patients
set protocol_version = 'ctas-triageia-2026-01'
where protocol_version is null;

alter table public.patients drop constraint if exists patients_triage_suggested_check;
alter table public.patients
  add constraint patients_triage_suggested_check
  check (triage_suggested is null or triage_suggested in ('I', 'II', 'III', 'IV', 'V'));
