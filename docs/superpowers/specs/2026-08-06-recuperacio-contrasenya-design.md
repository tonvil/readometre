# Recuperació de contrasenya

Data: 2026-08-06

## Objectiu

Permetre que un usuari que ha oblidat la contrasenya la restableixi
via email, des de `/login`. Actualment només hi ha login amb
email+contrasenya o Google, sense cap manera de recuperar l'accés si
s'oblida la contrasenya.

## Abast

Inclòs en aquest pas:

- Enllaç "Has oblidat la contrasenya?" a `/login`, cap a una nova
  pàgina `/forgot-password`.
- Pàgina `/forgot-password`: formulari amb `email`. Server Action
  `requestPasswordReset` que crida
  `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${origin}/auth/callback?next=/reset-password\` })`,
  amb `origin` obtingut via `headers().get("origin")` (mateix patró
  que `signup`).
- La pàgina mostra sempre un missatge d'èxit genèric ("Si l'email
  existeix, rebràs un enllaç per restablir la contrasenya."),
  independentment de si Supabase retorna error o no — per no revelar
  quins emails estan registrats a l'aplicació.
- **`src/app/auth/callback/route.ts`** (modificat): suport a un
  paràmetre de consulta `next` opcional. Si hi és present i
  `exchangeCodeForSession` té èxit, redirigeix a `next` en lloc
  d'aplicar la lògica actual de dashboard/onboarding. Sense `next`, el
  comportament OAuth existent es manté exactament igual.
- Nova pàgina `/reset-password`: formulari amb contrasenya nova i
  confirmació de contrasenya, `minLength={6}` (mateixa convenció que
  `/signup`). Crida `supabase.auth.updateUser({ password })` des del
  client (la sessió de recuperació ja queda activa gràcies al pas pel
  callback). Si les dues contrasenyes no coincideixen, error inline
  sense arribar a cridar Supabase.
- Un cop canviada la contrasenya amb èxit, redirecció directa a
  `/dashboard` (o `/onboarding` si encara no existeix `Usuari` per
  aquest `user.id`, seguint el mateix patró que la resta de fluxos
  d'autenticació d'aquest projecte).

Explícitament fora d'abast (per a passos posteriors):

- Política de contrasenyes més estricta que `minLength=6`.
- Limitació de peticions (rate limiting) més enllà del que ja aplica
  Supabase per defecte a `resetPasswordForEmail`.
- Notificació per email quan es canvia la contrasenya.
- Revocar altres sessions actives de l'usuari en canviar la
  contrasenya.

## Model de dades

Cap canvi. No es toca el schema de Prisma ni el model `Usuari`; tota
la gestió de contrasenyes és responsabilitat de Supabase Auth.

## Arquitectura

- **`src/app/login/page.tsx`** (modificat): afegir
  `<a href="/forgot-password" className="underline">Has oblidat la contrasenya?</a>`
  a sota del formulari de login existent.
- **`src/app/forgot-password/page.tsx`** (nou, client component):
  formulari amb `email`, mateix patró d'estat (`useState` per
  error/success) que `/signup`. En èxit, mostra el missatge genèric en
  lloc del formulari.
- **`src/app/forgot-password/actions.ts`** (nou): Server Action
  `requestPasswordReset(formData: FormData)`:
  ```typescript
  "use server";

  import { headers } from "next/headers";
  import { createClient } from "@/lib/supabase/server";

  export async function requestPasswordReset(formData: FormData) {
    const email = formData.get("email") as string;
    const origin = (await headers()).get("origin");

    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    return { success: true };
  }
  ```
  No es distingeix mai l'èxit real de Supabase de l'error — sempre es
  retorna `{ success: true }`, per no revelar l'existència d'un email.
- **`src/app/auth/callback/route.ts`** (modificat): llegir
  `searchParams.get("next")`. Després d'un `exchangeCodeForSession`
  amb èxit, si `next` existeix, `return NextResponse.redirect(\`${origin}${next}\`)`
  abans de la comprovació de `Usuari`/dashboard/onboarding. Sense
  `next`, el codi actual (comprovar `Usuari` i anar a
  dashboard/onboarding) es manté sense canvis.
- **`src/app/reset-password/page.tsx`** (nou, client component):
  formulari amb `password` i `confirmPassword`, tots dos
  `type="password"` amb `minLength={6}`. Validació client abans de
  cridar Supabase: si `password !== confirmPassword`, error inline
  ("Les contrasenyes no coincideixen.") sense fer cap crida de xarxa.
  Si coincideixen, crida directament
  `const supabase = createClient(); const { error } = await supabase.auth.updateUser({ password })`
  (client de `@/lib/supabase/client`, com el botó de Google a
  `/login`). En èxit, `window.location.href = "/dashboard"` — una
  navegació completa (no `router.push`), perquè el middleware que
  protegeix `/dashboard` llegeix la sessió de les cookies i cal que
  la petició següent ja les tingui actualitzades. En error de
  Supabase, error inline genèric.

## Gestió d'errors

- `/forgot-password`: cap error visible a l'usuari — sempre missatge
  d'èxit genèric, per no revelar existència d'emails.
- `/reset-password`: contrasenyes no coincidents → error inline abans
  de tocar Supabase. Error d'`updateUser` (p. ex. sessió de
  recuperació caducada) → error inline genèric ("No s'ha pogut
  canviar la contrasenya. Torna-ho a provar."), sense detall tècnic.
- `/auth/callback`: si `exchangeCodeForSession` falla, es manté el
  comportament actual (`redirect` a `/login`), independentment de si
  hi havia `next` o no.

## Testing

Cap framework de tests encara (deferit, com a la resta del projecte).
Verificació manual:

- Des de `/login`, clicar "Has oblidat la contrasenya?", introduir un
  email registrat, i comprovar que arriba l'email de Supabase amb
  l'enllaç de recuperació.
- Introduir un email no registrat i comprovar que es mostra el mateix
  missatge d'èxit genèric (no es filtra informació).
- Clicar l'enllaç de l'email i comprovar que arriba a
  `/reset-password` amb una sessió de recuperació activa (no a
  `/login`).
- Introduir dues contrasenyes diferents a `/reset-password` i
  comprovar l'error inline sense trucada de xarxa.
- Introduir la mateixa contrasenya dues vegades, enviar, i comprovar
  que es pot fer login immediatament amb la contrasenya nova des de
  `/login` en una sessió posterior.
- Comprovar que el flux de login amb Google (`/auth/callback` sense
  `next`) continua funcionant exactament igual que abans.
