# Llistat de llibres al dashboard

Data: 2026-08-06

## Objectiu

Mostrar al `/dashboard` els llibres que l'usuari autenticat ja ha
registrat (via `/books/new`), agrupats pel seu estat de lectura, en lloc
del text "properament" actual.

## Abast

Inclòs en aquest pas:

- Consulta de totes les `ReadingEntry` de l'usuari autenticat, amb el seu
  `Book` associat.
- Agrupació per `status` (`reading`/`finished`/`abandoned`) en tres
  seccions: "Llegint ara", "Finalitzats", "Abandonats".
- Dins de cada secció, llibres ordenats per `startDate` descendent (el
  més recent primer).
- Per cada llibre: títol, autor i gènere.
- Una secció s'amaga completament si no té cap llibre.
- Si l'usuari no té cap `ReadingEntry`, es mostra un missatge senzill
  ("Encara no has afegit cap llibre") en lloc de les seccions.

Explícitament fora d'abast (per a passos posteriors):

- Edició o esborrat d'una `ReadingEntry` des de la llista.
- Paginació (no cal amb "previsió de pocs usuaris").
- Mostrar dates, valoració o notes a la llista.
- Filtres o cerca dins la llista.

## Arquitectura

Tot el canvi viu a `src/app/dashboard/page.tsx`, que ja és un Server
Component autenticat amb accés a `usuari.id`. S'hi afegeix:

- Una consulta `prisma.readingEntry.findMany({ where: { usuariId: usuari.id }, include: { book: true }, orderBy: { startDate: "desc" } })`
  — una sola consulta, no cal repetir-la per estat.
- Agrupació dels resultats per `status` en memòria (JavaScript), no amb
  tres consultes Prisma separades.
- Substitució del paràgraf "Aquí aniran els teus llibres i estadístiques
  (properament)" per: les tres seccions (amagant les buides) quan hi ha
  almenys una `ReadingEntry`, o el missatge d'estat buit quan no n'hi ha
  cap.

## Gestió d'errors

No s'introdueix cap cas d'error nou: si la consulta Prisma falla, es
comporta igual que qualsevol altra consulta ja existent al dashboard (cap
gestió especial, coherent amb la resta del projecte).

## Testing

Cap framework de tests encara (deferit, com a la resta del projecte).
Verificació manual: crear alguns llibres amb `/books/new` en diferents
estats i confirmar que apareixen a la secció correcta, ordenats
correctament, i que un usuari sense llibres veu el missatge buit.
