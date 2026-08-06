# Edició i esborrat de sessions de lectura

Data: 2026-08-06

## Objectiu

Permetre corregir o eliminar una `ReadingSession` ja registrada des de
`/entries/[id]`. Actualment `addSession` només permet crear-ne; no hi
ha manera de corregir un error de data/pàgina ni d'eliminar una sessió
duplicada o equivocada.

## Abast

Inclòs en aquest pas:

- Cada sessió del llistat a `/entries/[id]` mostra botons "Edita" i
  "Esborra".
- "Edita" converteix la línia en un mini-formulari inline (data i
  pàgina precarregats amb els valors actuals) amb botons "Desa" i
  "Cancel·la".
- "Esborra" demana confirmació (`window.confirm`) abans d'eliminar la
  sessió.
- Noves Server Actions `updateSession(sessionId, formData)` i
  `deleteSession(sessionId)`.
- Mateixes validacions que `addSession`: `page` ha de ser un enter
  positiu, `date` és obligatòria.
- El progrés mostrat a la pàgina ("120 de 350 pàgines · 34%") es
  recalcula automàticament perquè ja es deriva de
  `readingSessions[0]` (la més recent per data) a cada render — no cal
  cap lògica addicional.

Explícitament fora d'abast (per a passos posteriors):

- Notes per sessió.
- Esborrat massiu de sessions.
- Historial de canvis (auditoria).
- Durada de la sessió.

## Model de dades

No calen canvis al schema de Prisma. Es reutilitza el model
`ReadingSession` existent.

## Arquitectura

- **`src/app/entries/[id]/actions.ts`**: dues noves Server Actions,
  seguint el mateix patró que `addSession`/`updateEntry`:
  - `updateSession(sessionId: string, formData: FormData)`:
    1. Verifica auth (usuari autenticat).
    2. Carrega la `ReadingSession` per `id` amb
       `include: { readingEntry: true }`.
    3. Verifica propietat: `session.readingEntry.usuariId === user.id`;
       si no existeix o no coincideix, `redirect("/dashboard")` (mateix
       comportament que la resta del fitxer).
    4. Valida `date`/`page` igual que `addSession` (enter positiu, data
       obligatòria); si falla, `{ error: "..." }`.
    5. `prisma.readingSession.update({ where: { id: sessionId }, data: { date, page } })`.
    6. `redirect(`/entries/${session.readingEntryId}`)`.
  - `deleteSession(sessionId: string)`:
    1. Verifica auth.
    2. Carrega la `ReadingSession` amb `include: { readingEntry: true }`.
    3. Mateixa verificació de propietat que `updateSession`.
    4. `prisma.readingSession.delete({ where: { id: sessionId } })`.
    5. `redirect(`/entries/${session.readingEntryId}`)`.
- **`src/app/entries/[id]/session-row.tsx`** (nou, client component):
  substitueix l'`<li>` estàtic actual de cada sessió. Rep la sessió
  (`{ id, date, page }`) com a prop. Estat local `isEditing`
  (`useState`):
  - Mode lectura (per defecte): mostra `{date} — pàgina {page}` i
    botons "Edita" i "Esborra".
  - Mode edició: formulari inline amb `date`/`page` precarregats
    (`defaultValue`), botó "Desa" (crida `updateSession`) i "Cancel·la"
    (torna a mode lectura sense desar, `setIsEditing(false)`).
  - "Esborra": `if (window.confirm("Segur que vols esborrar aquesta sessió?")) { await deleteSession(session.id); }`.
- **`src/app/entries/[id]/page.tsx`**: el `<ul>` de sessions renderitza
  `<SessionRow key={session.id} session={session} />` en lloc de
  l'`<li>` inline actual.

## Gestió d'errors

- Validacions de `date`/`page` a `updateSession`: mateix missatge
  d'error inline que `addSession`, mostrat dins el mini-formulari en
  mode edició.
- Sessió inexistent o pertanyent a una entrada d'un altre usuari:
  mateix comportament que la resta del fitxer (`redirect("/dashboard")`,
  no un missatge d'error personalitzat).

## Testing

Cap framework de tests encara (deferit, com a la resta del projecte).
Verificació manual:

- Editar una sessió existent (canviar pàgina i/o data) i comprovar que
  es desa i que el progrés de la pàgina es recalcula correctament.
- Cancel·lar una edició sense desar i comprovar que els valors
  originals es mantenen.
- Esborrar la sessió més recent (la que marca el progrés) i comprovar
  que el progrés passa a reflectir la següent sessió per data, o
  desapareix si no en queda cap.
- Provar `window.confirm` cancel·lant l'esborrat i comprovar que la
  sessió no s'elimina.
- Accedir a `updateSession`/`deleteSession` amb un `sessionId` d'una
  entrada d'un altre usuari (o inexistent) i comprovar que no es pot
  modificar/esborrar (redirecció, no error revelador).
