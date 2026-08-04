# Scaffold inicial — Diari de lectura

Data: 2026-08-04

## Objectiu

Crear l'esquelet tècnic del projecte "Diari de lectura" amb l'stack ja decidit
(Next.js App Router + TypeScript + Prisma + Postgres/Supabase), incloent-hi
login d'usuari (email/password i Google), sense encara cap pantalla funcional
de gestió de llibres.

## Abast

Inclòs en aquest pas:

- Projecte Next.js generat amb `create-next-app` (TypeScript, Tailwind CSS,
  ESLint, App Router).
- Prisma connectat a Postgres del projecte Supabase, amb el schema de dades
  `Usuari` / `Book` / `ReadingEntry` definit al `claude.md`.
- Autenticació amb Supabase Auth: email/password i Google OAuth.
- Flux d'onboarding: completar perfil (Nom, Cognom, edat) després del primer
  login, abans d'accedir al dashboard.
- Repositori git inicialitzat i connectat a GitHub.
- Projecte nou creat a Supabase.

Explícitament fora d'abast (per a passos posteriors):

- Altres proveïdors OAuth (GitHub, Microsoft).
- Qualsevol pantalla o lògica de gestió de llibres (registre per ISBN,
  llistats, estadístiques).
- Framework de tests (es configurarà quan comenci la implementació de
  funcionalitat real).
- Gestió d'errors avançada (retries, logging extern).

## Arquitectura

- **Next.js (App Router) + TypeScript + Tailwind CSS**, generat amb
  `create-next-app`.
- **Prisma** com a ORM, connectat a la base de dades Postgres del projecte
  Supabase.
- **Supabase Auth** (`@supabase/supabase-js` + `@supabase/ssr`) per al login.
- **npm** com a gestor de paquets.
- **Git + GitHub**: repo inicialitzat des del primer commit d'aquest scaffold.

## Estructura de carpetes

```
readOmetre/
├── prisma/
│   └── schema.prisma          # Models Usuari, Book, ReadingEntry
├── src/
│   ├── app/
│   │   ├── page.tsx            # Pàgina d'inici (pública)
│   │   ├── login/page.tsx      # Formulari email/password + botó Google
│   │   ├── signup/page.tsx     # Registre amb email/password
│   │   ├── onboarding/page.tsx # Completar perfil (Nom/Cognom/edat)
│   │   ├── dashboard/page.tsx  # Pàgina protegida (placeholder)
│   │   └── auth/callback/route.ts  # Callback OAuth de Google
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Client Supabase per al navegador
│   │   │   └── server.ts       # Client Supabase per Server Components/Actions
│   │   └── prisma.ts           # Instància única de PrismaClient
│   └── middleware.ts           # Protegeix rutes (redirigeix a /login si no hi ha sessió)
├── .env.local                  # Claus Supabase (no versionat)
└── .env.example                # Plantilla de variables necessàries
```

## Flux d'autenticació

1. Usuari va a `/login`, escull email/password o "Continua amb Google".
2. **Google**: redirecció OAuth de Supabase → `/auth/callback` → Supabase crea
   la sessió.
3. **Email/password**: formulari a `/signup` crea el compte (Supabase envia
   email de verificació); un cop verificat, login a `/login` crea la sessió.
4. Després de crear la sessió (per qualsevol dels dos camins), l'app comprova
   si ja existeix un registre `Usuari` (Prisma) vinculat a l'id de Supabase
   Auth de l'usuari:
   - Si no existeix → redirecció a `/onboarding` per completar Nom, Cognom i
     edat, que crea el registre `Usuari`.
   - Si ja existeix → redirecció a `/dashboard`.
5. `middleware.ts` protegeix `/dashboard` i `/onboarding`: sense sessió activa,
   redirigeix a `/login`.

## Gestió d'errors

- Credencials incorrectes o email no verificat: missatge d'error simple al
  formulari corresponent, sense exposar detalls tècnics de Supabase.
- Error de connexió amb Supabase: pàgina d'error genèrica de Next.js.
- No es contempla retry automàtic ni logging extern en aquest pas (YAGNI).

## Testing

Cap framework de tests es configura en aquest pas. S'introduirà (probablement
Vitest) quan comenci la implementació de la primera funcionalitat real sobre
llibres.

## Decisions pendents (fora d'abast d'aquest pas)

- Afegir GitHub i/o Microsoft com a proveïdors OAuth addicionals.
