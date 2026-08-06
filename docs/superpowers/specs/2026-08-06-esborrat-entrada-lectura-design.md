# Esborrat d'una entrada de lectura

Data: 2026-08-06

## Objectiu

Permetre esborrar completament una `ReadingEntry` (i totes les seves
`ReadingSession` associades) des de `/entries/[id]`, per corregir un
llibre donat d'alta per error.

## Abast

Inclòs en aquest pas:

- Botó "Esborra aquest llibre" a `/entries/[id]`, separat del
  formulari d'edició (`EntryEditForm`), no integrat al mateix
  formulari.
- Confirmació amb `window.confirm` abans d'esborrar, igual patró que
  l'esborrat de sessions (`SessionRow`).
- Nova Server Action `deleteEntry(readingEntryId: string)` que esborra
  totes les `ReadingSession` de l'entrada i després la pròpia
  `ReadingEntry`, en una única transacció.
- Redirecció a `/dashboard` després d'esborrar amb èxit.
- Mateix guard de propietat que la resta d'accions d'aquest fitxer
  (`entry.usuariId === user.id`).

Explícitament fora d'abast (per a passos posteriors):

- Esborrar el `Book` associat — es manté al catàleg compartit, ja que
  altres usuaris (o el mateix usuari en una altra entrada) el poden
  tenir referenciat.
- Paperera o desfer l'esborrat.
- Confirmació més forta que `window.confirm` (p. ex. escriure el
  títol del llibre).

## Model de dades

No calen canvis al schema de Prisma. Cal tenir en compte, però, que la
clau forana `ReadingSession.readingEntryId` es va crear amb
`ON DELETE RESTRICT` (`prisma/migrations/20260805125129_reading_session/migration.sql`):
esborrar una `ReadingEntry` que encara té `ReadingSession` associades
fallaria directament a la base de dades si no s'esborren primer les
sessions. `deleteEntry` ho resol esborrant les sessions abans que
l'entrada, dins la mateixa transacció, sense necessitat de tocar
l'schema ni crear una migració nova.

## Arquitectura

- **`src/app/entries/[id]/actions.ts`**: nova Server Action
  `deleteEntry(readingEntryId: string)`:
  1. Verifica auth (usuari autenticat); si no, `redirect("/login")`.
  2. Carrega la `ReadingEntry` per `id`.
  3. Verifica propietat: `entry.usuariId === user.id`; si no existeix o
     no coincideix, `redirect("/dashboard")` (mateix comportament que
     la resta del fitxer).
  4. `prisma.$transaction([prisma.readingSession.deleteMany({ where: { readingEntryId } }), prisma.readingEntry.delete({ where: { id: readingEntryId } })])`.
  5. `redirect("/dashboard")`.
- **`src/app/entries/[id]/delete-entry-button.tsx`** (nou, client
  component): botó "Esborra aquest llibre" amb
  `window.confirm("Segur que vols esborrar aquest llibre i totes les seves sessions?")`
  abans de cridar `deleteEntry(readingEntryId)`.
- **`src/app/entries/[id]/page.tsx`**: renderitza
  `<DeleteEntryButton readingEntryId={entry.id} />` a sota de
  `EntryEditForm`, com a element separat (no dins el mateix `<form>`).

## Gestió d'errors

- Entrada inexistent o pertanyent a un altre usuari: mateix
  comportament que la resta del fitxer (`redirect("/dashboard")`, no
  un missatge d'error personalitzat).
- No hi ha validacions d'entrada d'usuari (l'acció no rep `formData`),
  per tant no hi ha casos d'error de validació a gestionar.
- Si `window.confirm` es cancel·la, no es crida `deleteEntry` i no
  passa res.

## Testing

Cap framework de tests encara (deferit, com a la resta del projecte).
Verificació manual:

- Crear una entrada amb almenys una sessió registrada, esborrar-la des
  de `/entries/[id]`, confirmar el diàleg, i comprovar que es
  redirigeix a `/dashboard` i l'entrada ja no hi apareix.
- Comprovar a la base de dades (o tornant a `/dashboard`) que les
  sessions associades també han desaparegut (no queden orfes ni dona
  error de clau forana).
- Cancel·lar el diàleg de confirmació i comprovar que l'entrada no
  s'esborra.
- Comprovar que el `Book` associat continua existint al catàleg
  (reutilitzable per una nova entrada amb el mateix ISBN).
- Provar l'accés a `deleteEntry` amb una entrada d'un altre usuari (o
  inexistent) i comprovar que no s'esborra res.
