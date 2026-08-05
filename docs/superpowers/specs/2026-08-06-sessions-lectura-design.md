# Sessions de lectura

Data: 2026-08-06

## Objectiu

Permetre que l'usuari registri sessions individuals de lectura (data i
pàgina on ha arribat) per a un llibre que té en curs o ja ha llegit,
relacionades amb la seva `ReadingEntry`, i vegi el seu progrés.

## Abast

Inclòs en aquest pas:

- Nou model `ReadingSession` (data + pàgina), relacionat amb una
  `ReadingEntry`.
- Nova pàgina protegida `/entries/[id]` amb el detall d'una
  `ReadingEntry`: dades del llibre, formulari per registrar una sessió
  nova, llistat de sessions existents (més recent primer), i progrés
  ("120 de 350 pàgines · 34%") si el llibre té `pageCount` i hi ha
  almenys una sessió registrada.
- Verificació que la `ReadingEntry` sol·licitada pertany a l'usuari
  autenticat (404 si no).
- Els llibres del llistat del `/dashboard` esdevenen enllaços a
  `/entries/[id]`.

Explícitament fora d'abast (per a passos posteriors):

- Edició o esborrat d'una sessió ja registrada.
- Notes per sessió.
- Canvi automàtic de l'estat de la `ReadingEntry` en arribar a la
  darrera pàgina — l'usuari ho farà manualment quan hi hagi edició
  d'entrades.
- Durada de la sessió.
- Gràfics de progrés al llarg del temps.

## Model de dades

Nou model:

```prisma
model ReadingSession {
  id             String       @id @default(uuid())
  readingEntryId String
  readingEntry   ReadingEntry @relation(fields: [readingEntryId], references: [id])
  date           DateTime
  page           Int
}
```

`ReadingEntry` guanya la relació inversa `readingSessions ReadingSession[]`.
No calen més canvis al model existent.

## Arquitectura

- **`src/app/entries/[id]/page.tsx`**: Server Component protegit.
  - Repeteix els guards d'auth/onboarding ja existents al dashboard.
  - Carrega la `ReadingEntry` per `id` amb `include: { book: true, readingSessions: { orderBy: { date: "desc" } } }`.
  - Si no existeix, o `readingEntry.usuariId !== usuari.id`, retorna 404
    (via `notFound()` de `next/navigation`).
  - Calcula el progrés: si `book.pageCount` existeix i hi ha almenys una
    sessió, `latestPage = readingSessions[0].page` (ja ordenades
    descendent per data), `percent = Math.min(100, Math.round((latestPage / book.pageCount) * 100))`.
  - Renderitza: títol/autor del llibre, estat, línia de progrés (si
    aplica), formulari de nova sessió, llistat de sessions existents.
- **`src/app/entries/[id]/actions.ts`**: `addSession(readingEntryId, formData)`
  Server Action — verifica auth i propietat de l'entrada (mateixa
  comprovació que la pàgina), valida `date`/`page`, crea la
  `ReadingSession`, revalida/redirigeix a `/entries/[id]` per veure la
  sessió nova a la llista.
- **`src/app/dashboard/page.tsx`**: cada `<li>` de llibre passa a ser un
  `<a href="/entries/{entry.id}">`.

## Gestió d'errors

- `page` ha de ser un enter positiu; `date` obligatòria. Error inline
  simple si falten o són invàlids, consistent amb la resta de formularis.
- Entrada inexistent o d'un altre usuari: 404 (no un missatge d'error
  personalitzat — coherent amb no revelar l'existència de dades d'altres
  usuaris).

## Testing

Cap framework de tests encara (deferit, com a la resta del projecte).
Verificació manual: des del compte de prova amb llibres existents,
navegar a un llibre, registrar dues sessions amb pàgines diferents, i
confirmar que el progrés i el llistat de sessions es mostren
correctament. Provar també que un `id` d'una `ReadingEntry` d'un altre
usuari (o inexistent) retorna 404.
