# Project75 — Comptes públics multi-usuari (Accounts v1)

**Data:** 2026-07-06
**Estat:** Disseny aprovat (pendent de pla d'implementació)

## Context

Project75 és una app React (Vite + TS + Tailwind, desplegada a Vercel) de
nutrició/híbrid. Fins ara ha estat **personal de Tuvi**: l'estat (`AppState`) es
guarda a `localStorage` (clau `project75_state_v3`) i, des de la fase anterior,
se sincronitza al núvol amb Supabase Auth (email+contrasenya) i la taula
`project75_states` (una fila jsonb per usuari, RLS `auth.uid() = user_id`), amb
**sync automàtic** (auto-push a cada canvi, auto-pull en obrir l'app).

Ara es vol convertir en un **producte públic obert**: qualsevol persona es pot
registrar i tenir el seu compte i les seves dades, aïllades de la resta.

## Objectiu d'aquesta fase

Convertir Project75 en multi-usuari **net i segur**, amb login obligatori:

- Extreure una **capa d'Auth** al capdamunt de l'app (`src/auth/`), separada de
  l'estat de l'app.
- **Gate d'entrada**: sense sessió → pantalla d'entrada/registre; amb sessió →
  l'app; amb `?demo=1` → demo només-lectura sense compte.
- **Aïllament de dades per usuari** al mateix navegador (claus de `localStorage`
  per `userId`), de manera que canviar de compte **mai barreja dades**.
- **Usuari nou = comença buit** (perfil en blanc + historial buit), amb objectius
  per defecte neutres editables, perquè l'app no peti amb valors buits.
- Mantenir el **sync automàtic** ja existent.

### Requisit dur: cap pèrdua de dades per a usuaris existents

Les dades de comptes existents (en concret, les de Tuvi) **no es poden perdre**:

1. Ja són al núvol → es recuperen en iniciar sessió.
2. **Migració, no esborrat**: la primera càrrega amb el nou codi copia l'estat de
   la clau antiga (`project75_state_v3`) a la clau per usuari
   (`project75_state_v3::<uid>`). La clau antiga **NO s'esborra**.
3. **Mai `localStorage.removeItem` sobre estat d'usuari.** Canviar/tancar sessió
   no elimina cap calaix; només canvia quin es mostra. Els backups de Data Safety
   (`project75_backup_latest` / `_previous`) es mantenen intactes.

## Fora d'abast (no fer)

- Personalització del **contingut** per usuari (pool de receptes, roadmap anual,
  setmana d'entrenament, suplements): segueix sent el contingut base hardcodejat.
  Un usuari nou veurà aquestes propostes base. Això és un **projecte gros a part**.
- No tocar: Nutrition Engine, Meal Purchase AI, Product Resolver, Daily Variety,
  Training logic, Coach logic, Brain, Supplements, OpenAI, branding.
- No tocar RLS ni afegir SQL (la taula i les policies ja existeixen i són correctes).
- **Sense magic link** (l'email integrat de Supabase peta amb «email rate limit
  exceeded»). Es manté email+contrasenya.
- **SMTP propi** per a verificació d'email i recuperació de contrasenya: necessari
  per a un llançament públic real, però **fora de v1** (s'anota com a futur).

## Arquitectura

### Capes

```
main.tsx
 └─ AuthProvider            (src/auth/useAuth.tsx)  — sessió Supabase
     └─ App                 (decideix què renderitzar segons auth + demo)
         ├─ <AuthGate>      si signed_out i no demo → login/registre
         ├─ loading         si status = loading
         └─ AppProvider     si signed_in (o demo)  — key={userId ?? 'demo'}
             └─ Shell        l'app actual (Today/Nutrition/…)
```

- **AuthProvider** és la font de veritat de la sessió. `AppProvider` deixa de
  gestionar la sessió pel seu compte (avui ho fa `useCloud`) i passa a **consumir**
  `useAuth`.
- **`key={userId}`** al `AppProvider`: en canviar d'usuari, React el remunta de
  zero → carrega la clau de `localStorage` d'aquell usuari i reconcilia amb el
  núvol. Això és el que garanteix que no es barregin dades entre comptes.

### Nous fitxers (`src/auth/`)

- **`authTypes.ts`** — `AuthStatus` (`disabled | loading | signed_out | signed_in
  | error`) i `ProjectUser` (`{ id: string; email: string | null }`).
- **`authService.ts`** — capa fina sobre el client Supabase (`getSupabaseClient`):
  `isAuthConfigured()`, `getCurrentUser()`, `onAuthStateChange(cb)`,
  `signInWithPassword(email, password)`, `signUpWithPassword(email, password)`,
  `signOut()`. Tot no-op segur si Supabase no està configurat.
- **`useAuth.tsx`** — `AuthProvider` + hook `useAuth()`. Gestiona `status`, `user`,
  `error`; exposa `signIn(email, password)` (login o alta si no existeix, mateix
  comportament que ja tenim), `signOut()`, `refreshUser()`.
- **`AuthGate.tsx`** — pantalla d'entrada quan no hi ha sessió: email + contrasenya,
  botó «Entrar / Crear compte», errors clars. Copy que deixa clar que és un
  producte on cadascú té el seu compte.
- **`AuthCard.tsx`** — a Configuració, per gestionar el compte quan ja estàs dins
  (email, «Sessió iniciada», estat de sync, «Tancar sessió»). Absorbeix i
  simplifica l'actual `CloudSyncCard`.

### Fitxers modificats

- **`src/main.tsx` / `src/App.tsx`** — embolcallar amb `AuthProvider`; `App`
  implementa el gate (loading / AuthGate / AppProvider amb `key`). Mode `?demo=1`
  entra directe en només-lectura sense login.
- **`src/hooks/useAppState.tsx`** —
  - La clau de `localStorage` passa a ser **per usuari**: `stateKeyFor(userId)`.
    En demo/sense sessió s'usa una clau de demo o l'estat de mostra en memòria.
  - **Migració** una sola vegada: si la clau per usuari no existeix però hi ha la
    clau antiga `project75_state_v3`, s'adopta (sense esborrar l'antiga).
  - L'auth surt de `useCloud`: `useCloud`/sync consumeix l'usuari de `useAuth` en
    lloc de gestionar la seva pròpia sessió. El sync automàtic es manté igual.
  - Un usuari nou (clau buida + núvol buit) arrenca amb `emptyState()`.
- **`src/utils/storageKeys.ts`** — afegir `stateKeyFor(userId)` i la constant de la
  clau antiga per a la migració. `CLOUD_LAST_SYNCED` també per usuari.
- **`src/data/program.ts`** (o nou `emptyState`) — un **perfil buit/starter**
  (`STARTER_PROFILE`) amb valors neutres segurs (p. ex. objectius per defecte
  raonables, nom buit, sense pesos/outcomes/streak), diferent del `DEFAULT_PROFILE`
  (que són les dades de Tuvi i queda com a contingut de demo).

## Fluxos

### Arrencada (boot)

1. Supabase **no configurat** (`isAuthConfigured() === false`): mode local actual
   (només dev sense env vars). L'app funciona com avui, sense gate. No peta.
2. Supabase configurat:
   - `?demo=1` (o `readonly`/`view=demo`) → `AppProvider` en només-lectura amb estat
     de mostra (contingut base). Sense login, sense escriptures, sense sync.
   - `status = loading` → spinner mentre `getCurrentUser()` resol.
   - `signed_out` → `<AuthGate>` (login/registre). L'app no és accessible.
   - `signed_in` → `AppProvider key={user.id}` amb les dades d'aquell usuari.

### Login / registre

- Un sol formulari email+contrasenya. `signIn` prova `signInWithPassword`; si falla
  perquè no existeix, fa `signUpWithPassword` (crea el compte). Requereix «Confirm
  email» OFF a Supabase (ja està). Missatges d'error clars (contrasenya incorrecta,
  etc.).

### Canvi d'usuari al mateix navegador

- Usuari A tanca sessió → gate. Usuari B entra → `AuthProvider` emet nou `user.id`
  → `AppProvider` es remunta amb `key=B` → carrega la clau `…::<B>` (buida si és nou
  → `emptyState`) i reconcilia amb el núvol de B. Les dades d'A (a `…::<A>`) queden
  intactes i mai es mostren a B.

### Sync (sense canvis)

- Es manté l'auto-push (debounce a cada canvi) i l'auto-pull (en focus / a l'entrar
  si el núvol és més recent), ara ancorats a l'usuari de `useAuth`. Abans de
  substituir estat local per remot, `importState` desa backup local (igual que ara).

## Estat d'usuari nou (buit)

- `emptyState()`: `STARTER_PROFILE` (nom buit, objectius neutres editables),
  `weights: []`, `outcomes: []`, `completedDates: []`, `streak: 0`, `prepDone: []`,
  sense check-in. Els àpats del dia es generen amb el contingut base (limitació
  coneguda d'aquesta fase).
- L'app ha de tolerar un perfil sense personalitzar sense petar (cap divisió per
  zero en barres de progrés, etc.); on calgui, mostrar un incentiu a completar el
  perfil a Configuració. Guards mínims, sense refactor de Nutrition/Training.

## Mode visita / read-only

- `detectReadOnly()` (`?demo=1`) es manté. En demo: no login, no logout, no
  escriptures ni sync; es mostra un estat de mostra amb contingut base. `AuthGate` i
  `AuthCard` mostren «Compte no disponible en mode visita».

## Gestió d'errors

- `authService` mai llança sense control cap amunt: retorna `null`/no-op si no està
  configurat; els errors de login es tradueixen a missatges curts a `AuthGate`.
- Si `getCurrentUser()` falla → `status = error` amb opció de reintentar; l'app no
  queda bloquejada (es pot recarregar).

## Variables d'entorn

Les mateixes que ja hi ha (frontend, prefix `VITE_`, només anon key):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

A `.env.local` (dev) i a Vercel (Production + Preview). Sense elles →
`AuthStatus = disabled` i mode local (l'app no peta).

## Configuració Supabase (ja feta, es documenta)

1. Projecte Supabase creat; `project75_states` + RLS ja aplicats.
2. **Authentication → Providers → Email**: activat, amb **«Confirm email» OFF**
   (registre instantani sense correu, evitant el rate-limit).
3. Amb login per contrasenya **no cal** configurar Redirect URLs.
4. Futur (fora v1): SMTP propi (p. ex. Resend) per activar verificació d'email i
   recuperació de contrasenya de forma fiable per a públic.

## Proves (criteris d'acceptació)

- Sense env vars: l'app arrenca en mode local, sense gate, sense petar. (`disabled`)
- Amb env vars, sense sessió: surt `AuthGate`; l'app no és accessible.
- Registre d'un email nou: crea compte, entra, i l'app arrenca **buida**
  (`STARTER_PROFILE`, sense historial), sense petar amb el perfil sense omplir.
- **No-pèrdua**: en entrar amb `atuvi4@gmail.com`, les dades de Tuvi hi són
  (migració de la clau antiga i/o pull del núvol). La clau antiga segueix existint.
- Dos comptes al mateix navegador: les dades no es barregen en cap sentit.
- `?demo=1`: mode només-lectura sense login, contingut de mostra, sense escriptures.
- Sync automàtic segueix funcionant (marcar àpat → puja; obrir en un altre
  dispositiu → baixa).
- `npm run build` net.

## Futur (no ara)

- Personalització de contingut per usuari (onboarding + plans propis).
- SMTP propi: verificació d'email + recuperació de contrasenya.
- Possible neteja/expiració de calaixos locals de comptes antics al navegador.
