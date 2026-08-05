# Estadístiques del hàbit lector al dashboard

Data: 2026-08-06

## Objectiu

Mostrar a l'usuari autenticat, al mateix `/dashboard`, un resum bàsic del
seu hàbit lector: quants llibres ha finalitzat, quants està llegint ara, i
quantes pàgines ha llegit en total.

## Abast

Inclòs en aquest pas:

- Comptador de llibres amb estat `finished`.
- Comptador de llibres amb estat `reading`.
- Suma de `pageCount` dels llibres finalitzats (només els que tenen
  `pageCount` registrat; els que no en tenen simplement no hi sumen res).
- Càlcul en memòria a partir de les mateixes `ReadingEntry` que ja es
  carreguen per al llistat de llibres (cap consulta Prisma addicional).
- Presentació com una línia o petita secció de tres números, ubicada al
  `/dashboard`, per sobre o al costat del llistat de llibres existent.

Explícitament fora d'abast (per a passos posteriors):

- Desglossament per gènere.
- Valoració mitjana dels llibres finalitzats.
- Ritme de lectura (llibres per mes, etc.).
- Pàgines "llegides" d'un llibre en curs (requereix la funcionalitat de
  sessions de lectura, encara no implementada).
- Una pàgina `/stats` separada.

## Arquitectura

Tot el canvi viu a `src/app/dashboard/page.tsx` (el mateix fitxer que ja
carrega `readingEntries` per al llistat, de la Task del llistat de
llibres). S'hi afegeix, després d'obtenir `readingEntries` i abans de
construir `sections`:

- `finishedCount = readingEntries.filter(e => e.status === "finished").length`
- `readingCount = readingEntries.filter(e => e.status === "reading").length`
- `totalPages = readingEntries.filter(e => e.status === "finished").reduce((sum, e) => sum + (e.book.pageCount ?? 0), 0)`

I es renderitza una línia amb aquests tres valors, visible sempre que
`readingEntries.length > 0` (si l'usuari no té cap llibre, ja es mostra el
missatge d'estat buit existent i no calen estadístiques).

## Gestió d'errors

Cap cas nou: el càlcul és pur JavaScript sobre dades ja carregades, sense
noves crides a xarxa ni a la base de dades.

## Testing

Cap framework de tests encara (deferit, com a la resta del projecte).
Verificació manual: amb el compte de prova que ja té llibres en diferents
estats (creat durant la verificació del llistat de llibres), confirmar
que els tres números coincideixen amb el que hi ha realment a la base de
dades.
