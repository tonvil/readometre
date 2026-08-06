# Sistema de disseny visual — "Nit de lectura"

Data: 2026-08-06

## Objectiu

Donar a readOmetre una identitat visual pròpia i coherent, en lloc de
l'estètica per defecte de Tailwind sense cap decisió presa que té
actualment (blanc/negre/gris arreu, sense paleta, sense tipografia
pròpia — de fet amb un bug que sobreescriu les fonts carregades amb
Arial). La direcció, validada amb mockups durant el brainstorming, és
"Nit de lectura": llegir de nit sota un llum càlid, amb un fons de cel
estrellat/galàxia, i el seu mirall diürn en paper càlid.

## Abast

Inclòs en aquest pas:

- **Sistema de tokens** (colors, tipografia) per a dos temes: fosc
  ("Nit de lectura", per defecte) i clar ("Llum del dia", opcional).
- **Commutador de tema** a una capçalera compartida i mínima, present
  a totes les pàgines (públiques i autenticades), amb persistència via
  cookie.
- **Component de fons de galàxia** (nebulosa + estrelles), a intensitat
  plena, visible a totes les pàgines en tema fosc.
- **Convenció de "targeta" (panel)** per agrupar cada bloc funcional
  d'una pàgina amb una etiqueta en majúscules del color d'accent, i una
  variant "zona de perill" per a accions destructives.
- **Aplicació a totes les pàgines existents**: `/login`, `/signup`,
  `/forgot-password`, `/reset-password`, `/onboarding`, `/dashboard`,
  `/books/new`, `/entries/[id]` (amb tots els seus formularis i
  llistes: `EntryEditForm`, `DeleteEntryButton`, `BookEditForm`,
  `SessionForm`, `SessionRow`), `/history`.
- **Correcció del bug de tipografia**: `globals.css` sobreescriu les
  fonts carregades amb `font-family: Arial, Helvetica, sans-serif;` —
  cal eliminar-ho perquè les noves fonts (Fraunces, Instrument Sans)
  s'apliquin de veritat.

Explícitament fora d'abast (per a passos posteriors):

- Il·lustracions o imatges reals (la galàxia és CSS/gradients, no
  imatges).
- Animacions de transició entre pantalles.
- Preferència de tema seguint `prefers-color-scheme` del sistema
  operatiu com a valor inicial (el tema per defecte és sempre fosc,
  independentment del sistema).
- Icones (l'app segueix sense iconografia pròpia; el commutador de
  tema pot ser només text "☀ / ☾" o similar, decidit a la
  implementació).

## Sistema de disseny

### Tema fosc — "Nit de lectura" (per defecte)

| Token | Valor | Ús |
|---|---|---|
| `--color-bg` | `#12111c` | Fons de totes les pàgines |
| `--color-ink` | `#f6f1e7` | Text principal, títols |
| `--color-ink-muted` | `#a89d87` | Text secundari |
| `--color-accent` | `#e0a94a` | Accions primàries, progrés, etiquetes |
| `--color-danger` | `#d97b6c` | Text d'accions destructives |
| `--color-danger-border` | `#7a3f38` | Vora d'accions destructives |
| `--color-panel-bg` | `rgba(20,19,30,0.72)` | Fons de targeta de contingut |
| `--color-panel-border` | `rgba(255,255,255,0.10)` | Vora de targeta |
| `--color-field-bg` | `rgba(255,255,255,0.05)` | Fons de camps de formulari |
| `--color-field-border` | `rgba(255,255,255,0.12)` | Vora de camps de formulari |

Fons decoratiu: gradient radial de nebulosa (violeta
`rgba(120,90,180,0.35)` i blau `rgba(60,80,140,0.35)`) més un patró
d'estrelles disperses (punts `radial-gradient` d'1-1.5px), a intensitat
plena, darrere de tot el contingut.

### Tema clar — "Llum del dia" (opcional)

| Token | Valor | Ús |
|---|---|---|
| `--color-bg` | `#f6f1e7` | Fons de totes les pàgines |
| `--color-ink` | `#2b2620` | Text principal, títols |
| `--color-ink-muted` | `#7a6f5c` | Text secundari |
| `--color-accent` | `#3d5c46` | Accions primàries, progrés, etiquetes |
| `--color-danger` | `#a3402f` | Text d'accions destructives |
| `--color-danger-border` | `#c99b8e` | Vora d'accions destructives |
| `--color-panel-bg` | `rgba(255,255,255,0.55)` | Fons de targeta de contingut |
| `--color-panel-border` | `rgba(0,0,0,0.08)` | Vora de targeta |
| `--color-field-bg` | `rgba(0,0,0,0.03)` | Fons de camps de formulari |
| `--color-field-border` | `rgba(0,0,0,0.12)` | Vora de camps de formulari |

Sense fons decoratiu de galàxia — fons pla de paper.

### Tipografia (als dos temes)

- **Display** (títols de llibres, capçaleres `<h1>`/`<h2>`): Fraunces
  (serif), pesos 600-700.
- **UI/cos** (formularis, etiquetes, text de botons, paràgrafs):
  Instrument Sans.
- **Etiquetes de secció** (nom de cada "targeta"): Instrument Sans,
  majúscules, `font-size: 11px`, `letter-spacing: 0.06em`, color
  `--color-accent`.

### Component "targeta" (panel)

Cada bloc funcional independent d'una pàgina (p. ex. "Estat de
lectura", "Zona de perill", "Dades del llibre", "Sessions de lectura")
es renderitza dins un contenidor amb:
- Fons `--color-panel-bg`, vora `1px solid --color-panel-border`,
  `border-radius: 8px`, padding `14px 16px`.
- Una etiqueta de secció (vegeu tipografia) com a primer element.

Les accions destructives (esborrar una entrada) van dins una targeta
amb l'etiqueta "Zona de perill" i usen `--color-danger`/
`--color-danger-border` en lloc de `--color-accent`.

### Accessibilitat (mínim exigible)

- Contrast text/fons revisat manualment als dos temes (text principal
  sobre fons: molt alt contrast als dos casos per disseny; text
  secundari i accent verificats durant la implementació amb una eina
  de contrast).
- Focus de teclat visible a tots els elements interactius, amb un
  anell (`outline` o `ring`) del color `--color-accent`.
- Cap animació que no respecti `prefers-reduced-motion` (el fons de
  galàxia és estàtic, sense animació, per tant no aplica cap
  restricció addicional per ara).
- Disseny responsive fins a mòbil (la columna centrada actual ja ho
  compleix; cal mantenir-ho amb les noves targetes).

## Model de dades

Cap canvi al schema de Prisma. La preferència de tema es guarda en una
**cookie del navegador** (`theme`, valors `"dark"` o `"light"`), no a
la base de dades — no és una dada d'usuari que calgui persistir entre
dispositius per a l'abast d'aquest projecte.

## Arquitectura

- **`src/app/globals.css`**: substituir el contingut actual pels
  tokens de tema fosc a `:root`, els tokens de tema clar sota
  `:root[data-theme="light"]`, i eliminar la línia
  `font-family: Arial, Helvetica, sans-serif;` de `body`. Afegir les
  fonts Fraunces i Instrument Sans (via `next/font/google`, seguint el
  mateix patró que les Geist actuals a `layout.tsx`) i mapejar-les a
  variables `--font-display`/`--font-sans` dins el bloc `@theme
  inline` existent (substituint les referències a Geist).
- **`src/lib/theme.ts`** (nou): `getTheme(): Promise<"dark" | "light">`
  llegeix la cookie `theme` via `cookies()` de `next/headers`; retorna
  `"dark"` si no existeix o té un valor no reconegut.
- **`src/app/theme-actions.ts`** (nou): Server Action
  `setTheme(theme: "dark" | "light")` que fa
  `(await cookies()).set("theme", theme, { maxAge: 60 * 60 * 24 * 365 })`.
- **`src/app/layout.tsx`** (modificat): Server Component; crida
  `getTheme()` i posa `data-theme={theme === "light" ? "light" : undefined}`
  a l'element `<html>`. Renderitza `<AppHeader theme={theme} />` just
  abans de `{children}`, dins `<body>`.
- **`src/components/app-header.tsx`** (nou): Server Component petit
  que renderitza el nom de l'app i `<ThemeToggle currentTheme={theme} />`.
- **`src/components/theme-toggle.tsx`** (nou, client component): botó
  que, en clicar, crida `setTheme(next)` i alhora fa
  `document.documentElement.dataset.theme = next === "light" ? "light" : ""`
  per a feedback visual immediat sense esperar cap round-trip ni
  recarregar la pàgina.
- **`src/components/galaxy-background.tsx`** (nou): component de
  presentació (pot ser Server Component, purament CSS) amb el gradient
  de nebulosa i estrelles descrit al sistema de disseny; s'inclou dins
  el fons de cada pàgina quan el tema actiu és fosc (via CSS
  `[data-theme="light"] .galaxy-background { display: none; }`, sense
  necessitat de lògica condicional a cada pàgina).
- **Pàgines existents** (`login`, `signup`, `forgot-password`,
  `reset-password`, `onboarding`, `dashboard`, `books/new`,
  `entries/[id]` i tots els seus subcomponents, `history`): s'adapten
  perquè cada bloc de contingut faci servir la convenció de "targeta"
  i els tokens de color/tipografia en lloc de les classes Tailwind
  planes actuals (`border p-2`, `bg-black`, `text-gray-600`, etc.).
  Aquesta part es descompondrà en tasques per pàgina/grup de pàgines
  al pla d'implementació, per mantenir cada canvi revisable
  independentment.

## Gestió d'errors

No aplica cap gestió d'errors nova: el commutador de tema no pot
fallar de manera visible a l'usuari (si la cookie no s'arriba a
desar, la pàgina simplement torna al tema fosc per defecte al
recarregar, sense cap missatge d'error).

## Testing

Cap framework de tests encara (deferit, com a la resta del projecte).
Verificació manual, un cop implementat a totes les pàgines:

- Comprovar que el tema per defecte (sense cookie) és fosc, amb la
  galàxia visible a totes les pàgines, incloses les públiques.
- Clicar el commutador i comprovar que canvia a l'instant (sense
  recarregar) a tema clar, i que la galàxia desapareix substituïda pel
  fons de paper.
- Recarregar la pàgina després de canviar de tema i comprovar que es
  manté (persistència via cookie).
- Navegar entre pàgines diferents i comprovar que el tema es manté
  consistent arreu.
- Comprovar el focus de teclat (Tab) a botons i camps de formulari: ha
  de ser visible amb l'anell del color d'accent, als dos temes.
- Provar la pàgina `/entries/[id]` (la més densa: edició d'entrada,
  esborrat, edició de llibre, sessions) i comprovar que cada bloc es
  distingeix clarament com a targeta pròpia, i que "Esborra aquest
  llibre" es reconeix com a acció destructiva (colors de perill).
- Redimensionar la finestra fins a amplada de mòbil i comprovar que
  totes les pàgines seguixen sent llegibles i utilitzables.
- Verificar amb una eina de contrast (p. ex. les DevTools del
  navegador) que el text secundari i els botons d'accent compleixen un
  contrast mínim raonable (WCAG AA) als dos temes.
