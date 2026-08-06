# Historial de llibres llegits

Data: 2026-08-06

## Objectiu

Oferir una pàgina `/history` que llisti tots els llibres `finished` de
l'usuari, amb la seva valoració, com a "historial de lectura" separat
del dashboard operatiu (que barreja llibres en curs, finalitzats i
abandonats).

## Abast

Inclòs en aquest pas:

- Nova pàgina protegida `/history`, enllaçada des del `/dashboard` al
  costat de "Afegeix un llibre".
- Llista només `ReadingEntry` amb `status === "finished"` de l'usuari
  autenticat.
- Ordenada per data efectiva descendent (més recent primer):
  `endDate` si existeix, si no `startDate` com a alternativa (una
  entrada `finished` pot no tenir `endDate` si es va crear directament
  amb aquest estat des de `/books/new`, que no aplica la regla
  automàtica d'`endDate` que sí aplica `updateEntry`).
- Cada línia mostra: títol del llibre (enllaç a `/entries/[id]`),
  autor, gènere si n'hi ha, i la valoració com a estrelles
  (`★★★☆☆`); si no hi ha `rating`, es mostra el text "Sense
  valoració" en lloc d'estrelles buides (que serien ambigües amb un 0).
- Missatge "Encara no has acabat cap llibre." si no hi ha cap entrada
  `finished`.
- Enllaç de tornada a `/dashboard`.

Explícitament fora d'abast (per a passos posteriors):

- Mostrar-hi també els llibres `abandoned`.
- Filtres (per gènere, per valoració mínima, etc.).
- Paginació.
- Ordenació alternativa (p. ex. per valoració).

## Model de dades

No calen canvis al schema de Prisma. Es reutilitza `ReadingEntry` i
`Book` existents.

## Arquitectura

- **`src/lib/rating.ts`** (nou): helper petit i compartit.
  ```typescript
  export function formatStars(rating: number | null): string {
    if (rating === null) return "Sense valoració";
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }
  ```
- **`src/app/history/page.tsx`** (nou): Server Component protegit amb
  el mateix patró de guards que `/entries/[id]` i `/dashboard`:
  1. `createClient()` + `supabase.auth.getUser()`; sense `user`,
     `redirect("/login")`.
  2. `prisma.usuari.findUnique({ where: { id: user.id } })`; sense
     `usuari`, `redirect("/onboarding")`.
  3. `prisma.readingEntry.findMany({ where: { usuariId: usuari.id, status: "finished" }, include: { book: true } })`.
  4. Ordenació en JS (no a la query, per poder aplicar el fallback
     `endDate ?? startDate`):
     ```typescript
     entries.sort(
       (a, b) =>
         (b.endDate ?? b.startDate).getTime() -
         (a.endDate ?? a.startDate).getTime(),
     );
     ```
  5. Si `entries.length === 0`, mostra "Encara no has acabat cap
     llibre."; si no, `<ul>` amb una línia per entrada: enllaç al
     títol (`/entries/${entry.id}`), autor, gènere opcional entre
     parèntesis, i `formatStars(entry.rating)`.
  6. Enllaç `<a href="/dashboard">Torna al dashboard</a>`.
- **`src/lib/supabase/middleware.ts`**: afegir `"/history"` a
  `PROTECTED_PATHS`.
- **`src/app/dashboard/page.tsx`**: afegir un enllaç
  `<a href="/history">Historial de lectura</a>` al costat del
  d'"Afegeix un llibre".

## Gestió d'errors

Cap cas d'error especial més enllà dels guards d'auth/onboarding ja
establerts arreu del projecte. La pàgina no rep `params` ni `formData`,
per tant no hi ha entrada d'usuari a validar.

## Testing

Cap framework de tests encara (deferit, com a la resta del projecte).
Verificació manual:

- Amb un compte que tingui llibres en diversos estats (reading,
  finished, abandoned), comprovar que `/history` només mostra els
  `finished`.
- Amb almenys dues entrades `finished` amb `endDate` diferents,
  comprovar l'ordenació descendent per `endDate`.
- Amb una entrada `finished` sense `endDate` (p. ex. creada des de
  `/books/new` amb estat "Acabat" i cap data de fi), comprovar que
  s'ordena pel seu `startDate` en el lloc que li correspongui.
- Comprovar que les estrelles es mostren correctament per diferents
  valors de `rating` (1 a 5).
- Comprovar que una entrada `finished` sense `rating` mostra "Sense
  valoració".
- Comprovar que `/history` sense sessió redirigeix a `/login`.
- Comprovar que l'enllaç "Historial de lectura" del dashboard hi porta
  correctament.
