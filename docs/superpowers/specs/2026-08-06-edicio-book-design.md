# Edició del Book

Data: 2026-08-06

## Objectiu

Permetre corregir les dades d'un `Book` (títol, autor, gènere, nombre
de pàgines) des de `/entries/[id]`, ja que ara un cop creat (per ISBN
o manualment) no hi ha cap manera d'esmenar-lo si conté un error.

## Abast

Inclòs en aquest pas:

- Nou formulari `BookEditForm` a `/entries/[id]`, separat
  d'`EntryEditForm` i `DeleteEntryButton` (no integrat en cap dels
  formularis existents).
- Camps editables: `title`, `author`, `genre` (opcional), `pageCount`
  (opcional).
- `isbn` es manté només de lectura — no és editable des d'aquest
  formulari, per evitar col·lisions amb un altre `Book` que ja
  existeixi amb aquell ISBN.
- Nova Server Action `updateBook(bookId: string, formData: FormData)`:
  permet l'edició només si l'usuari autenticat té almenys una
  `ReadingEntry` pròpia (`usuariId === user.id`) que apunti a aquest
  `bookId`.
- Validacions: `title` i `author` obligatoris (no buits en blanc);
  `pageCount`, si s'indica, ha de ser un enter positiu.
- Com que `Book` és un catàleg compartit, el canvi és visible per a
  totes les `ReadingEntry` de tots els usuaris que comparteixin aquest
  `Book` — és el comportament esperat, no un efecte secundari a
  evitar.

Explícitament fora d'abast (per a passos posteriors):

- Edició de l'`isbn`.
- Historial de canvis (auditoria) del `Book`.
- Fusionar dos `Book` duplicats.
- Restringir l'edició només a qui té permisos "d'administrador" (no
  existeix aquest concepte al projecte).

## Model de dades

No calen canvis al schema de Prisma. Es reutilitza el model `Book`
existent.

## Arquitectura

- **`src/app/entries/[id]/actions.ts`**: nova Server Action
  `updateBook(bookId: string, formData: FormData)`:
  1. Verifica auth (usuari autenticat); si no, `redirect("/login")`.
  2. Verifica que l'usuari té almenys una `ReadingEntry` pròpia
     d'aquest llibre:
     ```typescript
     const ownEntry = await prisma.readingEntry.findFirst({
       where: { bookId, usuariId: user.id },
     });
     if (!ownEntry) {
       redirect("/dashboard");
     }
     ```
  3. Llegeix `title`, `author`, `genre`, `pageCount` del `FormData`.
  4. Valida `title`/`author` no buits; si falta algun, `{ error: "..." }`.
  5. Valida `pageCount`: si s'indica, ha de parsejar com a enter
     positiu; si no, `{ error: "..." }`.
  6. `prisma.book.update({ where: { id: bookId }, data: { title, author, genre, pageCount } })`.
  7. `redirect(`/entries/${ownEntry.id}`)` per tornar a la mateixa
     fitxa amb les dades actualitzades.
- **`src/app/entries/[id]/book-edit-form.tsx`** (nou, client
  component): formulari amb `title`, `author`, `genre`, `pageCount`
  precarregats (`defaultValue` amb els valors actuals de
  `entry.book`), i l'`isbn` mostrat com a text no editable (si n'hi
  ha). Mateix patró d'error inline que la resta de formularis de la
  ruta.
- **`src/app/entries/[id]/page.tsx`**: renderitza
  `<BookEditForm bookId={entry.book.id} title={entry.book.title} author={entry.book.author} genre={entry.book.genre} pageCount={entry.book.pageCount} isbn={entry.book.isbn} />`
  a sota d'`EntryEditForm` i `DeleteEntryButton`, com a bloc separat,
  abans de `SessionForm`.

## Gestió d'errors

- `title`/`author` buits: `{ error: "Omple el títol i l'autor." }`,
  mostrat inline al formulari.
- `pageCount` no numèric o no positiu:
  `{ error: "El nombre de pàgines ha de ser un enter positiu." }`.
- Usuari sense cap `ReadingEntry` pròpia d'aquest `Book`: mateix
  comportament que la resta del fitxer (`redirect("/dashboard")`, no
  un missatge d'error personalitzat).

## Testing

Cap framework de tests encara (deferit, com a la resta del projecte).
Verificació manual:

- Editar títol, autor, gènere i nombre de pàgines d'un llibre propi i
  comprovar que es desen i es reflecteixen a la fitxa.
- Deixar `title` o `author` en blanc i comprovar l'error inline.
- Introduir un `pageCount` negatiu o no numèric i comprovar l'error.
- Confirmar que l'`isbn` es mostra però no és editable.
- Si dues `ReadingEntry` (d'usuaris diferents, o del mateix usuari)
  comparteixen el mateix `Book`, comprovar que editar-lo des d'una
  entrada actualitza el que es veu des de l'altra.
- Provar que un usuari sense cap `ReadingEntry` d'aquest `Book` no pot
  cridar `updateBook` amb èxit (per exemple, si mai n'ha tingut una i
  se li ha esborrat).
