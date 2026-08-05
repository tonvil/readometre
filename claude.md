# Diari de lectura — projecte d'aprenentatge

## Objectiu

App per què l'usuari pugui registrar els llibres que llegeix,
els valori i vegi estadístiques del seu propi hàbit lector.
Previsió de pocs usuari

## Decisions ja preses (no reobrir sense parlar-ne)

- Tinc compte a github, supabase i vercel
- Autenticació usuari i password o login mitjançant google. Valorar altres opcions
- Execució des de qualsevol lloc i dispositiu: Next.js (App Router) + TypeScript + Prisma + Postgres (supabase).
- Registre de llibres per ISBN: Google Books API primer, Open Library com a reserva,
  entrada manual sempre disponible com a últim recurs.
- El camp "gènere" ve suggerit per l'API però és editable a mà — no confiar-hi cegament.
- Metodologia Spec Driven Develompement mitjançant agents IA

## Model de dades

- Usuari: Nom, Cognom, email, data de naixement (opcional)
- Book: title, author, genre, pageCount (opcional)
- ReadingEntry: bookId, startDate, endDate (nul·lable), status (reading/finished/abandoned),
  rating (1-5, opcional), notes

## Com vull treballar

- Suggereix skills, Agents i eines confiables a instal·lar
- Explica'm cada canvi nou d'stack (Prisma, App Router, etc.) abans que l'accepti,
  sóc experimentat en Tcl/OpenACS/Postgres però nou en aquest stack concret.
- Avança pas a pas: no facis tot el projecte d'un cop. Un pas = un diff que puc revisar.
- Fes servir Plan Mode per a canvis grans (scaffold inicial, migracions) abans d'executar.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
