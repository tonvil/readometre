# Registre de llibres per ISBN

Data: 2026-08-05

## Objectiu

Permetre que un usuari autenticat registri un llibre que llegeix (o ha
llegit) introduint el seu ISBN, amb cerca automàtica a Google Books i,
com a reserva, Open Library. L'entrada manual és sempre una opció
disponible, tant si les API no troben el llibre com si l'usuari la tria
directament.

## Abast

Inclòs en aquest pas:

- Cerca d'un llibre pel seu ISBN: primer al catàleg local (`Book` ja
  existent amb aquest ISBN), després a Google Books (sense clau d'API),
  després a Open Library.
- Formulari de confirmació/edició amb les dades trobades (títol, autor,
  gènere, pàgines) abans de desar — excepte si el llibre ja existeix al
  catàleg local, cas en què aquestes dades es mostren només de lectura.
- Entrada manual sempre disponible (per elecció directa de l'usuari, o
  automàticament si cap API troba el llibre).
- En desar: es crea el `Book` (si és nou) i sempre una `ReadingEntry` nova
  vinculada a l'usuari actual, amb estat (llegint/finalitzat/abandonat),
  data d'inici, data de fi (opcional), valoració (opcional) i notes
  (opcional) — permetent registrar tant lectures en curs com ja acabades.
- Deduplicació de `Book` per ISBN: s'afegeix el camp `isbn` (opcional,
  únic) al model `Book`.

Explícitament fora d'abast (per a passos posteriors):

- Llistat o navegació de llibres/biblioteca (a `/dashboard` o enlloc més).
- Escaneig de codi de barres amb càmera (només camp de text per ara).
- Sessions de lectura individuals (pàgina on has arribat, durada, etc.).
- Edició o esborrat d'una `ReadingEntry` ja creada.
- Clau d'API de Google Books (es fa servir l'accés sense autenticar).

## Model de dades

Canvi al model `Book` existent — s'afegeix `isbn`:

```prisma
model Book {
  id             String         @id @default(uuid())
  isbn           String?        @unique
  title          String
  author         String
  genre          String?
  pageCount      Int?
  readingEntries ReadingEntry[]
}
```

`ReadingEntry` no canvia respecte a l'schema actual.

## Arquitectura

- **`src/lib/books/googleBooks.ts`**: `searchByIsbn(isbn: string)` — crida
  `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}` sense
  autenticació. Normalitza el resultat a
  `{ title, author, genre, pageCount } | null` (agafa el primer resultat
  si n'hi ha diversos; `genre` ve de `categories[0]` si existeix).
- **`src/lib/books/openLibrary.ts`**: `searchByIsbn(isbn: string)` — crida
  `https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data`,
  mateixa forma de retorn normalitzada.
- **`src/app/books/new/actions.ts`**:
  - `searchBook(isbn: string)`: valida el format (10 o 13 dígits,
    ignorant guions/espais). Primer consulta
    `prisma.book.findUnique({ where: { isbn } })`; si existeix, retorna
    `{ book, fromCatalog: true }`. Si no, prova Google Books i després
    Open Library (cada crida amb el seu propi try/catch — un error de
    xarxa a una API no impedeix provar la següent); si alguna troba
    resultat, retorna `{ book: <dades normalitzades>, fromCatalog: false }`.
    Si cap troba res, retorna `{ book: null, fromCatalog: false }`.
  - `saveBook(formData: FormData)`: Server Action que llegeix
    `isbn`/`title`/`author`/`genre`/`pageCount` (dades del llibre) i
    `status`/`startDate`/`endDate`/`rating`/`notes` (dades de la
    `ReadingEntry`). Si `isbn` coincideix amb un `Book` existent, el
    reutilitza (no sobreescriu els seus camps); si no, crea un `Book`
    nou. Sempre crea una `ReadingEntry` amb `usuariId` de l'usuari
    autenticat actual. Redirigeix a `/dashboard` en acabar.
- **`src/app/books/new/page.tsx`**: pàgina protegida (dins de
  `PROTECTED_PATHS` al middleware) amb dos estats de UI:
  1. **Cerca**: input d'ISBN + botó "Cerca" + enllaç/botó "Entrada
     manual" per saltar-se la cerca.
  2. **Confirmació/edició**: un cop hi ha resultat de cerca (trobat per
     API, del catàleg local, o buit per manual), es mostra el formulari
     complet: camps del llibre (editables, o només lectura si
     `fromCatalog`) + camps de la `ReadingEntry` (sempre editables) +
     botó "Desa".

## Flux d'usuari

1. Usuari autenticat va a `/books/new` (enllaç des de `/dashboard`).
2. Introdueix un ISBN i clica "Cerca" (o directament "Entrada manual").
3. Segons el resultat de `searchBook`:
   - Trobat al catàleg local → formulari amb dades del llibre en només
     lectura, camps de `ReadingEntry` buits per omplir.
   - Trobat per Google Books o Open Library → formulari amb dades del
     llibre pre-omplertes i editables, camps de `ReadingEntry` buits.
   - No trobat enlloc, o "Entrada manual" → formulari completament buit
     i editable (ISBN inclòs, per si el vol afegir igualment).
4. L'usuari revisa/edita, omple els camps de lectura, i clica "Desa" →
   `saveBook` crea `Book` (si cal) i `ReadingEntry`, redirigeix a
   `/dashboard`.

## Gestió d'errors

- ISBN amb format invàlid (ni 10 ni 13 dígits un cop netejat de
  guions/espais): error inline al formulari de cerca, no es crida cap
  API.
- Error de xarxa/timeout a Google Books: es continua provant Open
  Library igualment; només si totes dues fallen es mostra el formulari
  buit (sense missatge d'error explícit — és un cas normal, equivalent a
  "no trobat").
- `saveBook` sense `title`/`author`: error de validació inline al
  formulari, consistent amb la resta de formularis del projecte (login,
  signup, onboarding).
- No es contempla reintent automàtic ni logging extern (YAGNI, mateix
  criteri que la resta del projecte).

## Testing

Cap framework de tests s'introdueix encara (deferit des de l'scaffold
inicial, es farà quan calgui — no en aquest pas).
