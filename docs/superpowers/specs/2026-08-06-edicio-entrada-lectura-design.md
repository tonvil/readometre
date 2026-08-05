# Edició d'una entrada de lectura

Data: 2026-08-06

## Objectiu

Permetre que l'usuari editi una `ReadingEntry` ja creada des de la seva
pàgina de detall (`/entries/[id]`): canviar l'estat (`reading` /
`finished` / `abandoned`) lliurement en qualsevol direcció, i editar
`rating`, `notes` i `endDate` en qualsevol moment, no només en crear
l'entrada.

## Abast

Inclòs en aquest pas:

- Formulari d'edició sempre visible a `/entries/[id]`, sota les dades
  actuals del llibre i abans del formulari de sessions, amb: select
  d'estat, rating (1-5, opcional), notes (opcional), endDate
  (opcional).
- Nova Server Action `updateEntry(readingEntryId, formData)` que valida
  i desa els canvis.
- Transicions d'estat lliures: qualsevol dels 3 estats es pot canviar a
  qualsevol altre (incloent reobrir una entrada `finished`/`abandoned`
  cap a `reading`).
- Regla automàtica sobre `endDate`:
  - En desar amb estat `finished` o `abandoned` i sense `endDate`
    introduïda → s'assigna la data d'avui.
  - En desar amb estat `reading` → `endDate` s'esborra (queda `null`),
    independentment del que s'hagi introduït al formulari.
- Validacions:
  - `rating`, si present, ha de ser un enter entre 1 i 5.
  - `endDate` final (un cop aplicada la regla automàtica), si no és
    `null`, no pot ser anterior a `startDate`.

Explícitament fora d'abast (per a passos posteriors):

- Edició del propi `Book` (títol, autor, gènere, pageCount) des d'aquí.
- Esborrat de la `ReadingEntry`.
- Edició de `startDate`.
- Canvi automàtic de l'estat en arribar a la darrera pàgina d'una
  sessió.
- Historial de canvis d'estat (auditoria).

## Model de dades

No calen canvis al schema de Prisma. Es reutilitzen els camps
existents de `ReadingEntry` (`status`, `rating`, `notes`, `endDate`).

## Arquitectura

- **`src/app/entries/[id]/page.tsx`**: afegeix el formulari d'edició
  sota les dades del llibre i abans del formulari de noves sessions.
  Passa els valors actuals de `status`, `rating`, `notes` i `endDate`
  com a `defaultValue` del formulari.
- **`src/app/entries/[id]/entry-edit-form.tsx`** (nou): component
  client, mateix patró que `session-form.tsx` (crida la Server Action
  des d'un `action` de formulari, mostra `{ error }` inline si la
  resposta el conté).
- **`src/app/entries/[id]/actions.ts`**: nova Server Action
  `updateEntry(readingEntryId, formData)`:
  1. Verifica auth (usuari autenticat) i propietat de l'entrada
     (`entry.usuariId === user.id`), igual que `addSession`. Si falla,
     `redirect`/404 coherent amb la resta de la pàgina.
  2. Llegeix `status`, `rating`, `notes`, `endDate` del `FormData`.
  3. Valida que `status` sigui un dels 3 valors vàlids de
     `ReadingStatus`.
  4. Valida `rating`: si s'ha introduït, ha de parsejar com a enter
     entre 1 i 5; en cas contrari, error.
  5. Calcula l'`endDate` final:
     - `status === "reading"` → `null`.
     - `status !== "reading"` → el valor introduït al formulari si
       n'hi ha, o `new Date()` (avui) si no.
  6. Valida que l'`endDate` final (si no és `null`) no sigui anterior a
     `entry.startDate`.
  7. `prisma.readingEntry.update({ where: { id }, data: { status, rating, notes, endDate } })`.
  8. `redirect(`/entries/${readingEntryId}`)` per refrescar la pàgina
     amb els valors desats.

## Gestió d'errors

- Errors de validació (`status` invàlid, `rating` fora de rang,
  `endDate` anterior a `startDate`) → es retorna `{ error: "..." }` i
  es mostra inline al formulari, seguint el mateix patró que
  `saveBook` i `addSession`.
- Entrada inexistent o d'un altre usuari: mateix comportament ja
  establert a la pàgina (404 via `notFound()`).

## Testing

Cap framework de tests encara (deferit, com a la resta del projecte).
Verificació manual:

- Des d'una entrada `reading`, marcar-la `finished` sense introduir
  `endDate` i comprovar que es desa la data d'avui.
- Introduir un `rating` fora de rang (0 o 6) i comprovar que apareix
  l'error i no es desa el canvi.
- Tornar una entrada `finished` a `reading` i comprovar que `endDate`
  queda a `null`.
- Introduir una `endDate` anterior a la `startDate` de l'entrada i
  comprovar que apareix l'error.
- Editar només `notes` sense tocar la resta de camps i comprovar que
  es desa correctament sense afectar `status`/`rating`/`endDate`.
