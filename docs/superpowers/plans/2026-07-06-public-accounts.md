# Public Accounts (Accounts v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir Project75 en un producte públic multi-usuari amb login obligatori, aïllament de dades per usuari i usuari nou en blanc, sense perdre les dades dels comptes existents.

**Architecture:** Una capa d'Auth (`src/auth/`) al capdamunt (`AuthProvider`) esdevé la font de veritat de la sessió. `App` fa de gate (loading / login / demo / app). `AppProvider` es remunta amb `key={userId}` i llegeix/escriu una clau de `localStorage` **per usuari**, amb migració sense esborrat de la clau antiga. El sync automàtic existent es manté, ara ancorat a l'usuari de `useAuth`.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind, `@supabase/supabase-js` (ja instal·lat), Vitest (nou, mínim, per a lògica pura).

## Global Constraints

- Frontend només amb `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` (anon key; mai service_role).
- Si Supabase no està configurat → `AuthStatus = 'disabled'` i l'app funciona en mode local sense petar ni bloquejar.
- Auth per **email + contrasenya** (NO magic link). Requereix «Confirm email» OFF a Supabase.
- **Cap pèrdua de dades per a usuaris existents:** migrar la clau antiga `project75_state_v3` a `project75_state_v3::<uid>` **sense esborrar l'antiga**; mai `localStorage.removeItem` sobre estat d'usuari; backups de Data Safety intactes.
- No tocar: Nutrition Engine, Meal Purchase AI, Product Resolver, Daily Variety, Training, Coach, Brain, Supplements, OpenAI, RLS/SQL, branding.
- `AuthStatus`: `'disabled' | 'loading' | 'signed_out' | 'signed_in' | 'error'`.
- `ProjectUser`: `{ id: string; email: string | null }`.
- Clau d'estat per usuari: `project75_state_v3::<uid>`; clau antiga (legacy): `project75_state_v3`.
- Directori de treball dels comandaments: `project75/`.

---

### Task 1: Vitest mínim + claus de `localStorage` per usuari

**Files:**
- Modify: `project75/package.json` (afegir devDep `vitest` i script `test`)
- Create: `project75/vitest.config.ts`
- Modify: `project75/src/utils/storageKeys.ts`
- Test: `project75/src/utils/storageKeys.test.ts`

**Interfaces:**
- Produces:
  - `STATE_KEY_LEGACY = 'project75_state_v3'` (constant)
  - `stateKeyFor(userId: string | null): string` → `userId ? \`project75_state_v3::${userId}\` : STATE_KEY_LEGACY`
  - `cloudLastSyncedKeyFor(userId: string | null): string` → `userId ? \`project75_cloud_last_synced::${userId}\` : 'project75_cloud_last_synced'`
  - Es mantenen `STATE_KEY`, `BACKUP_LATEST`, `BACKUP_PREVIOUS`, `CLOUD_LAST_SYNCED`.

- [ ] **Step 1: Afegir Vitest**

Run: `cd project75 && npm install -D vitest@^2.1.0`
Expected: s'afegeix `vitest` a devDependencies.

- [ ] **Step 2: Script de test a `package.json`**

A `project75/package.json`, dins `"scripts"`, afegir:

```json
"test": "vitest run"
```

- [ ] **Step 3: Config de Vitest (entorn node, prou per a lògica pura)**

Crear `project75/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Escriure el test que falla**

Crear `project75/src/utils/storageKeys.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { STATE_KEY_LEGACY, stateKeyFor, cloudLastSyncedKeyFor } from './storageKeys';

describe('stateKeyFor', () => {
  it('usa la clau legacy quan no hi ha usuari', () => {
    expect(stateKeyFor(null)).toBe(STATE_KEY_LEGACY);
  });
  it('namespaça la clau per userId', () => {
    expect(stateKeyFor('u1')).toBe('project75_state_v3::u1');
  });
  it('namespaça la clau de last-synced per userId', () => {
    expect(cloudLastSyncedKeyFor('u1')).toBe('project75_cloud_last_synced::u1');
    expect(cloudLastSyncedKeyFor(null)).toBe('project75_cloud_last_synced');
  });
});
```

- [ ] **Step 5: Executar el test (ha de fallar)**

Run: `cd project75 && npm test`
Expected: FAIL (no existeixen `STATE_KEY_LEGACY`, `stateKeyFor`, `cloudLastSyncedKeyFor`).

- [ ] **Step 6: Implementar les claus**

Reescriure `project75/src/utils/storageKeys.ts`:

```ts
/** Claus de localStorage centralitzades (per compartir estat i backups). */
export const STATE_KEY = 'project75_state_v3';
/** Clau antiga d'estat (abans del multi-usuari). Base per a la migració. */
export const STATE_KEY_LEGACY = 'project75_state_v3';
export const BACKUP_LATEST = 'project75_backup_latest';
export const BACKUP_PREVIOUS = 'project75_backup_previous';
/** Cloud Sync: última marca del núvol reconciliada en aquest dispositiu (ISO). */
export const CLOUD_LAST_SYNCED = 'project75_cloud_last_synced';

/** Clau d'estat per usuari. Sense usuari (demo/local) → clau legacy. */
export function stateKeyFor(userId: string | null): string {
  return userId ? `project75_state_v3::${userId}` : STATE_KEY_LEGACY;
}

/** Clau de last-synced per usuari. Sense usuari → clau global. */
export function cloudLastSyncedKeyFor(userId: string | null): string {
  return userId ? `project75_cloud_last_synced::${userId}` : CLOUD_LAST_SYNCED;
}
```

- [ ] **Step 7: Executar el test (ha de passar)**

Run: `cd project75 && npm test`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add project75/package.json project75/package-lock.json project75/vitest.config.ts project75/src/utils/storageKeys.ts project75/src/utils/storageKeys.test.ts
git commit -m "feat(auth): claus de localStorage per usuari + vitest minim"
```

---

### Task 2: Migració segura de l'estat legacy (requisit de no-pèrdua)

**Files:**
- Create: `project75/src/utils/stateMigration.ts`
- Test: `project75/src/utils/stateMigration.test.ts`

**Interfaces:**
- Consumes: `stateKeyFor`, `STATE_KEY_LEGACY` (Task 1).
- Produces:
  - `interface KVStore { getItem(k: string): string | null; setItem(k: string, v: string): void; }`
  - `pickInitialRaw(userId: string | null, store: KVStore): string | null` — retorna el JSON cru a carregar. Si la clau per usuari existeix, la retorna. Si no existeix però hi ha estat legacy, **copia** legacy → clau usuari (sense esborrar legacy) i el retorna. Si no hi ha res, retorna `null`. Amb `userId = null` retorna directament la clau legacy.

- [ ] **Step 1: Escriure el test que falla**

Crear `project75/src/utils/stateMigration.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { pickInitialRaw, type KVStore } from './stateMigration';
import { STATE_KEY_LEGACY, stateKeyFor } from './storageKeys';

function memStore(seed: Record<string, string> = {}): KVStore & { data: Record<string, string> } {
  const data: Record<string, string> = { ...seed };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
  };
}

describe('pickInitialRaw', () => {
  it('retorna la clau per usuari si ja existeix', () => {
    const s = memStore({ [stateKeyFor('u1')]: '{"a":1}', [STATE_KEY_LEGACY]: '{"old":1}' });
    expect(pickInitialRaw('u1', s)).toBe('{"a":1}');
  });

  it('migra legacy a la clau d usuari sense esborrar legacy', () => {
    const s = memStore({ [STATE_KEY_LEGACY]: '{"old":1}' });
    const raw = pickInitialRaw('u1', s);
    expect(raw).toBe('{"old":1}');
    expect(s.data[stateKeyFor('u1')]).toBe('{"old":1}'); // copiat
    expect(s.data[STATE_KEY_LEGACY]).toBe('{"old":1}');  // NO esborrat
  });

  it('retorna null per a un usuari nou sense legacy', () => {
    const s = memStore();
    expect(pickInitialRaw('u2', s)).toBeNull();
  });

  it('amb userId null usa la clau legacy', () => {
    const s = memStore({ [STATE_KEY_LEGACY]: '{"demo":1}' });
    expect(pickInitialRaw(null, s)).toBe('{"demo":1}');
  });
});
```

- [ ] **Step 2: Executar el test (ha de fallar)**

Run: `cd project75 && npm test -- stateMigration`
Expected: FAIL (mòdul inexistent).

- [ ] **Step 3: Implementar la migració**

Crear `project75/src/utils/stateMigration.ts`:

```ts
import { STATE_KEY_LEGACY, stateKeyFor } from './storageKeys';

export interface KVStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

/** Decideix quin JSON cru d'estat carregar per a un usuari, migrant una sola
 *  vegada la clau legacy a la clau per usuari SENSE esborrar la legacy. */
export function pickInitialRaw(userId: string | null, store: KVStore): string | null {
  const key = stateKeyFor(userId);
  const own = store.getItem(key);
  if (own !== null) return own;
  if (userId === null) return null; // key ja és la legacy; si és null, no hi ha res
  const legacy = store.getItem(STATE_KEY_LEGACY);
  if (legacy !== null) {
    store.setItem(key, legacy); // còpia; legacy es manté intacte
    return legacy;
  }
  return null;
}
```

- [ ] **Step 4: Executar el test (ha de passar)**

Run: `cd project75 && npm test -- stateMigration`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add project75/src/utils/stateMigration.ts project75/src/utils/stateMigration.test.ts
git commit -m "feat(auth): migracio segura d estat legacy a clau per usuari"
```

---

### Task 3: Estat buit per a usuaris nous

**Files:**
- Create: `project75/src/data/emptyState.ts`
- Test: `project75/src/data/emptyState.test.ts`

**Interfaces:**
- Consumes: tipus `AppState`, `Profile` de `../types`; `todayISO` de `../utils/date`.
- Produces:
  - `STARTER_PROFILE: Profile` — perfil neutre editable (nom buit, objectius per defecte raonables, `projectStartDate` = avui).
  - `emptyState(): AppState` — estat en blanc: `STARTER_PROFILE`, `weights: []`, `outcomes: []`, `completedDates: []`, `prepDone: []`, `dislikes: []`, `meals: []`, `streak: 0`, `lastComplete: null`, `checkin: null`, `gymDone: false`, `dayMode: 'normal'`, `version: 3`, `supplements: { creatineDates: [] }`.

- [ ] **Step 1: Escriure el test que falla**

Crear `project75/src/data/emptyState.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { emptyState, STARTER_PROFILE } from './emptyState';

describe('emptyState', () => {
  it('comença sense historial', () => {
    const s = emptyState();
    expect(s.weights).toEqual([]);
    expect(s.outcomes).toEqual([]);
    expect(s.completedDates).toEqual([]);
    expect(s.streak).toBe(0);
    expect(s.checkin).toBeNull();
  });
  it('té un perfil neutre amb nom buit i objectius > 0', () => {
    expect(STARTER_PROFILE.name).toBe('');
    expect(STARTER_PROFILE.kcalGoal).toBeGreaterThan(0);
    expect(STARTER_PROFILE.protGoal).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Executar el test (ha de fallar)**

Run: `cd project75 && npm test -- emptyState`
Expected: FAIL (mòdul inexistent).

- [ ] **Step 3: Implementar l'estat buit**

Crear `project75/src/data/emptyState.ts` (comprovar els camps de `Profile` a `src/types/index.ts`; els objectius per defecte eviten divisions per zero a les barres de progrés):

```ts
import type { AppState, Profile } from '../types';
import { todayISO } from '../utils/date';

/** Perfil neutre per a usuaris nous. Valors editables a Configuració; els
 *  objectius per defecte són segurs (mai 0) perquè la UI no peti. */
export const STARTER_PROFILE: Profile = {
  name: '',
  sex: 'male',
  age: 30,
  heightCm: 175,
  startWeight: 75,
  target1: 75,
  target2: 75,
  kcalGoal: 2200,
  protGoal: 140,
  ritme: 'moderat',
  projectStartDate: todayISO(),
};

/** Estat en blanc per a un compte nou: sense historial de cap mena. */
export function emptyState(): AppState {
  return {
    version: 3,
    date: todayISO(),
    streak: 0,
    lastComplete: null,
    dayMode: 'normal',
    meals: [],
    gymDone: false,
    checkin: null,
    dislikes: [],
    weights: [],
    completedDates: [],
    prepDone: [],
    outcomes: [],
    supplements: { creatineDates: [] },
    profile: { ...STARTER_PROFILE },
  };
}
```

- [ ] **Step 4: Executar el test (ha de passar)**

Run: `cd project75 && npm test -- emptyState`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add project75/src/data/emptyState.ts project75/src/data/emptyState.test.ts
git commit -m "feat(auth): estat buit (STARTER_PROFILE + emptyState) per a usuaris nous"
```

---

### Task 4: Tipus i servei d'Auth

**Files:**
- Create: `project75/src/auth/authTypes.ts`
- Create: `project75/src/auth/authService.ts`
- Modify: `project75/src/cloud/cloudSync.ts` (treure les funcions d'auth, deixar només les de dades)
- Test: `project75/src/auth/authService.test.ts`

**Interfaces:**
- Consumes: `getSupabaseClient`, `isSupabaseConfigured` de `../lib/supabase`.
- Produces (`authTypes.ts`):
  - `type AuthStatus = 'disabled' | 'loading' | 'signed_out' | 'signed_in' | 'error'`
  - `interface ProjectUser { id: string; email: string | null }`
- Produces (`authService.ts`):
  - `isAuthConfigured(): boolean`
  - `getCurrentUser(): Promise<ProjectUser | null>`
  - `onAuthStateChange(cb: (u: ProjectUser | null) => void): () => void`
  - `signInWithPassword(email: string, password: string): Promise<void>`
  - `signUpWithPassword(email: string, password: string): Promise<{ session: unknown | null }>`
  - `signOut(): Promise<void>`

- [ ] **Step 1: Escriure el test que falla**

Crear `project75/src/auth/authService.test.ts` (sense env vars, el client és null → no configurat, getCurrentUser null):

```ts
import { describe, expect, it } from 'vitest';
import { isAuthConfigured, getCurrentUser } from './authService';

describe('authService sense Supabase', () => {
  it('no està configurat sense env vars', () => {
    expect(isAuthConfigured()).toBe(false);
  });
  it('getCurrentUser retorna null sense client', async () => {
    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Executar el test (ha de fallar)**

Run: `cd project75 && npm test -- authService`
Expected: FAIL (mòdul inexistent).

- [ ] **Step 3: Crear `authTypes.ts`**

```ts
export type AuthStatus = 'disabled' | 'loading' | 'signed_out' | 'signed_in' | 'error';

export interface ProjectUser {
  id: string;
  email: string | null;
}
```

- [ ] **Step 4: Crear `authService.ts`**

```ts
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type { ProjectUser } from './authTypes';

export function isAuthConfigured(): boolean {
  return isSupabaseConfigured() && !!getSupabaseClient();
}

function toUser(u: { id: string; email?: string }): ProjectUser {
  return { id: u.id, email: u.email ?? null };
}

export async function getCurrentUser(): Promise<ProjectUser | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const u = data.session?.user;
  return u ? toUser(u) : null;
}

export function onAuthStateChange(cb: (u: ProjectUser | null) => void): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    const u = session?.user;
    cb(u ? toUser(u) : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Auth no configurat');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ session: unknown | null }> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Auth no configurat');
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return { session: data.session };
}

export async function signOut(): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.auth.signOut();
}
```

- [ ] **Step 5: Treure les funcions d'auth de `cloudSync.ts`**

A `project75/src/cloud/cloudSync.ts`, **eliminar** les funcions `getCurrentUser`, `onAuthChange`, `signInWithEmail`, `signInWithPassword`, `signUpWithPassword`, `signOut` i el helper `toProfile` (ara viuen a `authService.ts`). **Mantenir** només les funcions de dades: `isCloudConfigured`, `currentUserId` (helper intern), `loadCloudState`, `getCloudUpdatedAt`, `upsertCloudState`, `saveCloudState`, i la interfície `CloudLoad`. Deixar `currentUserId` fent servir `sb.auth.getSession()`.

- [ ] **Step 6: Executar el test i el build**

Run: `cd project75 && npm test -- authService`
Expected: PASS.
Run: `cd project75 && npm run build`
Expected: pot fallar amb errors de tipus a `useCloud.ts` (encara importa funcions eliminades). Es corregeix a la Task 6. Si vols un build net abans, salta al pas de commit i continua; els tests d'aquesta task passen.

> Nota: aquesta task deixa `useCloud.ts` temporalment trencat (imports que ja no existeixen). Es repara a la Task 6. Committeja igualment perquè la unitat (authService) està verdament testejada.

- [ ] **Step 7: Commit**

```bash
git add project75/src/auth/authTypes.ts project75/src/auth/authService.ts project75/src/auth/authService.test.ts project75/src/cloud/cloudSync.ts
git commit -m "feat(auth): authTypes + authService; treu auth de cloudSync"
```

---

### Task 5: AuthProvider + useAuth

**Files:**
- Create: `project75/src/auth/useAuth.tsx`

**Interfaces:**
- Consumes: `authService` (Task 4), `authTypes` (Task 4).
- Produces:
  - `AuthProvider({ children }: { children: ReactNode })`
  - `useAuth(): { status: AuthStatus; user: ProjectUser | null; error: string | null; signIn(email: string, password: string): Promise<void>; signOut(): Promise<void>; refreshUser(): Promise<void>; }`

- [ ] **Step 1: Implementar `useAuth.tsx`**

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthStatus, ProjectUser } from './authTypes';
import {
  getCurrentUser,
  isAuthConfigured,
  onAuthStateChange,
  signInWithPassword,
  signUpWithPassword,
  signOut as svcSignOut,
} from './authService';

interface AuthCtx {
  status: AuthStatus;
  user: ProjectUser | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isAuthConfigured();
  const [status, setStatus] = useState<AuthStatus>(configured ? 'loading' : 'disabled');
  const [user, setUser] = useState<ProjectUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!configured) return;
    try {
      const u = await getCurrentUser();
      setUser(u);
      setStatus(u ? 'signed_in' : 'signed_out');
    } catch {
      setStatus('error');
      setError('No s’ha pogut comprovar la sessió');
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    void refreshUser();
    const unsub = onAuthStateChange((u) => {
      setUser(u);
      setStatus(u ? 'signed_in' : 'signed_out');
    });
    return unsub;
  }, [configured, refreshUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!configured) return;
      const e = email.trim();
      if (!e) { setError('Escriu un email'); return; }
      if (!password || password.length < 6) { setError('La contrasenya ha de tenir 6+ caràcters'); return; }
      setError(null);
      setStatus('loading');
      try {
        await signInWithPassword(e, password);
        // onAuthStateChange posarà signed_in
      } catch {
        try {
          const { session } = await signUpWithPassword(e, password);
          if (!session) {
            setStatus('signed_out');
            setError('Compte creat. Cal «Confirm email» OFF a Supabase per entrar sense correu.');
          }
        } catch (err2) {
          setStatus('error');
          const msg = err2 instanceof Error ? err2.message : '';
          setError(/registered/i.test(msg) ? 'Aquest email ja existeix · contrasenya incorrecta' : (msg || 'No s’ha pogut iniciar sessió'));
        }
      }
    },
    [configured],
  );

  const signOut = useCallback(async () => {
    if (!configured) return;
    await svcSignOut();
    setUser(null);
    setStatus('signed_out');
  }, [configured]);

  const value = useMemo<AuthCtx>(
    () => ({ status, user, error, signIn, signOut, refreshUser }),
    [status, user, error, signIn, signOut, refreshUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth ha de ser dins d’AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Build (encara pot fallar per useCloud, es repara a Task 6)**

Run: `cd project75 && npm run build`
Expected: possibles errors només a `useCloud.ts`. Cap error a `useAuth.tsx`.

- [ ] **Step 3: Commit**

```bash
git add project75/src/auth/useAuth.tsx
git commit -m "feat(auth): AuthProvider + useAuth (estat de sessio)"
```

---

### Task 6: Rewire de `useCloud` per consumir l'usuari d'`useAuth`

**Files:**
- Modify: `project75/src/cloud/useCloud.ts`

**Interfaces:**
- Consumes: `ProjectUser` d'`../auth/authTypes`; funcions de dades de `./cloudSync` (`isCloudConfigured`, `loadCloudState`, `getCloudUpdatedAt`, `upsertCloudState`); `cloudLastSyncedKeyFor` de `../utils/storageKeys`.
- Produces: `useCloud({ state, importState, isReadOnly, showToast, user })` amb el mateix `CloudSlice`, però **sense** gestionar sessió pròpia (ni `getCurrentUser`/`onAuthChange`/`signIn`/`signOut`). El login ara és a `useAuth`.

- [ ] **Step 1: Reescriure `useCloud.ts`**

Canvis respecte a l'actual:
1. Afegir `user: ProjectUser | null` als `Args`.
2. Eliminar imports i ús de `getCurrentUser`, `onAuthChange`, `signInWithPassword`, `signUpWithPassword`, `signOut` (ja no gestiona auth).
3. Substituir `cloudUser` intern per l'`user` rebut; `cloudStatus` deriva de si hi ha `user`.
4. `lastSynced` s'ha de llegir/desar amb `cloudLastSyncedKeyFor(user?.id ?? null)`.
5. L'efecte de sessió inicial passa a reaccionar a `user`: quan `user` passa a existir → `initialReconcile()`; quan passa a null → reset.
6. `CloudSlice` conserva `pushToCloud`, `pullFromCloud`, `syncNow`, `cloudStatus`, `cloudUpdatedAt`, `cloudHasNewer`; **elimina** `signInCloud`/`signOutCloud`/`cloudUser` (ara vénen d'`useAuth`).

Codi complet de `project75/src/cloud/useCloud.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState } from '../types';
import type { ProjectUser } from '../auth/authTypes';
import type { CloudStatus } from './cloudTypes';
import {
  getCloudUpdatedAt,
  isCloudConfigured,
  loadCloudState,
  upsertCloudState,
} from './cloudSync';
import { cloudLastSyncedKeyFor } from '../utils/storageKeys';

interface Args {
  state: AppState;
  importState: (s: AppState) => void;
  isReadOnly: boolean;
  showToast: (m: string) => void;
  user: ProjectUser | null;
}

export interface CloudSlice {
  cloudStatus: CloudStatus;
  cloudUpdatedAt: string | null;
  cloudHasNewer: boolean;
  pushToCloud: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const PUSH_DEBOUNCE_MS = 1500;

export function useCloud({ state, importState, isReadOnly, showToast, user }: Args): CloudSlice {
  const configured = isCloudConfigured();
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(configured ? 'signed_out' : 'disabled');
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
  const [cloudHasNewer, setCloudHasNewer] = useState(false);

  const syncedKey = cloudLastSyncedKeyFor(user?.id ?? null);
  const lastSynced = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const ready = useRef(false);
  const suppressPush = useRef(false);

  // Carrega lastSynced de la clau de l'usuari actual quan canvia d'usuari.
  useEffect(() => {
    try {
      lastSynced.current = localStorage.getItem(syncedKey);
    } catch {
      lastSynced.current = null;
    }
  }, [syncedKey]);

  const setSynced = useCallback(
    (v: string | null) => {
      lastSynced.current = v;
      try {
        if (v) localStorage.setItem(syncedKey, v);
        else localStorage.removeItem(syncedKey);
      } catch {
        /* no bloquejar */
      }
    },
    [syncedKey],
  );

  const doPush = useCallback(
    async (silent: boolean) => {
      if (isReadOnly) return;
      setCloudStatus('syncing');
      try {
        const updatedAt = await upsertCloudState(stateRef.current);
        setSynced(updatedAt);
        setCloudUpdatedAt(updatedAt);
        setCloudHasNewer(false);
        setCloudStatus('synced');
        if (!silent) showToast('Aquest dispositiu s’ha pujat al núvol');
      } catch {
        setCloudStatus('error');
        if (!silent) showToast('No s’ha pogut pujar al núvol');
      }
    },
    [isReadOnly, setSynced, showToast],
  );

  const doPull = useCallback(
    async (silent: boolean) => {
      if (isReadOnly) return;
      setCloudStatus('syncing');
      try {
        const res = await loadCloudState();
        if (!res) { setCloudStatus('synced'); return; }
        suppressPush.current = true;
        importState(res.state);
        setSynced(res.updatedAt);
        setCloudUpdatedAt(res.updatedAt);
        setCloudHasNewer(false);
        setCloudStatus('synced');
        if (!silent) showToast('Dades carregades del núvol');
      } catch {
        setCloudStatus('error');
        if (!silent) showToast('No s’han pogut carregar les dades del núvol');
      }
    },
    [isReadOnly, importState, setSynced],
  );

  const reconcile = useCallback(
    async (silent: boolean) => {
      const cu = await getCloudUpdatedAt();
      setCloudUpdatedAt(cu);
      if (!cu) return doPush(silent);
      if (!lastSynced.current || cu > lastSynced.current) return doPull(silent);
      return doPush(silent);
    },
    [doPush, doPull],
  );

  const pullIfRemoteNewer = useCallback(async () => {
    const cu = await getCloudUpdatedAt();
    setCloudUpdatedAt(cu);
    if (cu && (!lastSynced.current || cu > lastSynced.current)) {
      setCloudHasNewer(true);
      await doPull(true);
    }
  }, [doPull]);

  const initialReconcile = useCallback(async () => {
    ready.current = false;
    try {
      const cu = await getCloudUpdatedAt();
      setCloudUpdatedAt(cu);
      if (!cu) await doPush(true);
      else if (!lastSynced.current || cu > lastSynced.current) await doPull(true);
    } finally {
      ready.current = true;
    }
  }, [doPush, doPull]);

  const pushToCloud = useCallback(() => doPush(false), [doPush]);
  const pullFromCloud = useCallback(() => doPull(false), [doPull]);
  const syncNow = useCallback(async () => {
    if (!configured) return;
    if (isReadOnly) return showToast('No disponible en mode visita');
    if (!user) return showToast('Inicia sessió per sincronitzar');
    await reconcile(false);
  }, [configured, isReadOnly, user, showToast, reconcile]);

  // Reacciona a l'usuari: entra → reconcilia; surt → reset.
  useEffect(() => {
    if (!configured) return;
    if (user) {
      setCloudStatus('signed_in');
      void initialReconcile();
    } else {
      ready.current = false;
      setCloudStatus('signed_out');
      setCloudUpdatedAt(null);
      setCloudHasNewer(false);
    }
  }, [configured, user, initialReconcile]);

  // Auto-push a cada canvi (debounce), un cop feta la reconciliació inicial.
  useEffect(() => {
    if (!configured || isReadOnly || !user) return;
    if (!ready.current) return;
    if (suppressPush.current) { suppressPush.current = false; return; }
    const t = window.setTimeout(() => void doPush(true), PUSH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [state, configured, isReadOnly, user, doPush]);

  // Auto-pull en tornar a l'app si el núvol és més recent.
  useEffect(() => {
    if (!configured || isReadOnly || !user) return;
    const onBack = () => {
      if (document.visibilityState === 'visible') void pullIfRemoteNewer();
    };
    window.addEventListener('focus', onBack);
    document.addEventListener('visibilitychange', onBack);
    return () => {
      window.removeEventListener('focus', onBack);
      document.removeEventListener('visibilitychange', onBack);
    };
  }, [configured, isReadOnly, user, pullIfRemoteNewer]);

  return { cloudStatus, cloudUpdatedAt, cloudHasNewer, pushToCloud, pullFromCloud, syncNow };
}
```

- [ ] **Step 2: Build (ara ha de compilar, tret dels consumidors de useAppState/Settings que es toquen a Task 7/9)**

Run: `cd project75 && npm run build`
Expected: els errors restants només han de venir de `useAppState.tsx` (encara passa `state/importState` sense `user` i re-exposa `signInCloud`, etc.) i de `CloudSyncCard.tsx`. Es corregeixen a les tasks següents.

- [ ] **Step 3: Commit**

```bash
git add project75/src/cloud/useCloud.ts
git commit -m "refactor(cloud): useCloud consumeix l usuari d useAuth (sense sessio propia)"
```

---

### Task 7: Rewire de `useAppState` (clau per usuari + migració + estat buit)

**Files:**
- Modify: `project75/src/hooks/useAppState.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 5), `pickInitialRaw` (Task 2), `emptyState` (Task 3), `stateKeyFor` (Task 1), `useCloud` amb `user` (Task 6).
- Produces: `useApp()` context igual que ara però **sense** `signInCloud`/`signOutCloud`/`cloudUser` (ara vénen d'`useAuth`); manté `cloudStatus`, `cloudUpdatedAt`, `cloudHasNewer`, `pushToCloud`, `pullFromCloud`, `syncNow`.

- [ ] **Step 1: Importar auth i helpers a `useAppState.tsx`**

Substituir la línia `import { STATE_KEY } from '../utils/storageKeys';` per:

```ts
import { stateKeyFor } from '../utils/storageKeys';
import { pickInitialRaw } from '../utils/stateMigration';
import { emptyState } from '../data/emptyState';
import { useAuth } from '../auth/useAuth';
```

I mantenir la resta d'imports. Eliminar la constant `const KEY = STATE_KEY;`.

- [ ] **Step 2: Parametritzar `loadState` per usuari**

Canviar la signatura de `loadState()` a `loadState(userId: string | null)`:

```ts
function loadState(userId: string | null): AppState {
  try {
    const raw = pickInitialRaw(userId, localStorage);
    if (!raw) return userId ? emptyState() : freshState();
    const s = JSON.parse(raw) as AppState;
    if (!detectReadOnly()) writePreviousBackup(s);
    if (s.date !== todayISO()) {
      s.date = todayISO();
      s.meals = buildDayMeals();
      s.gymDone = false;
      s.checkin = null;
      s.dayMode = 'normal';
    }
    if (!Array.isArray(s.meals) || s.meals.some((m) => !m || !m.nutrition)) {
      s.meals = buildDayMeals();
    }
    s.meals = repairMealSlots(s.meals);
    s.profile = { ...DEFAULT_PROFILE, ...s.profile };
    s.completedDates = s.completedDates ?? [];
    s.prepDone = s.prepDone ?? [];
    s.outcomes = s.outcomes ?? [];
    s.supplements = s.supplements ?? { creatineDates: [] };
    s.supplements.creatineDates = s.supplements.creatineDates ?? [];
    s.supplements.anabolicServing = s.supplements.anabolicServing ?? { ...DEFAULT_ANABOLIC };
    s.weights = (s.weights ?? []).filter((w) => w.d >= s.profile.projectStartDate);
    return s;
  } catch {
    return userId ? emptyState() : freshState();
  }
}
```

> Nota: per a un usuari nou (`raw` null i `userId` present) retorna `emptyState()`. `buildDayMeals()` per a l'estat buit es genera de tota manera en obrir el dia (contingut base — limitació coneguda). Si es vol el dia buit literal, es pot deixar `s.meals = []`; aquí es manté el comportament d'omplir amb el pla base per no petar les pàgines.

- [ ] **Step 3: Llegir l'usuari i inicialitzar l'estat amb la seva clau**

Dins `AppProvider`, a dalt de tot del cos, substituir:

```ts
const [state, setState] = useState<AppState>(loadState);
```

per:

```ts
const { user } = useAuth();
const userId = user?.id ?? null;
const [state, setState] = useState<AppState>(() => loadState(userId));
```

> `AppProvider` es remunta amb `key={userId}` (Task 8), per tant `userId` és estable durant la vida del provider i n'hi ha prou amb llegir-lo a l'inicialitzador.

- [ ] **Step 4: Desar amb la clau per usuari**

A l'efecte que desa l'estat, substituir `localStorage.setItem(KEY, JSON.stringify(state));` per:

```ts
localStorage.setItem(stateKeyFor(userId), JSON.stringify(state));
```

I a `resetAll`, substituir `localStorage.removeItem(KEY);` per `localStorage.removeItem(stateKeyFor(userId));` i `setState(freshState())` per `setState(userId ? emptyState() : freshState())`.

- [ ] **Step 5: Passar `user` a `useCloud` i treure els camps d'auth del context**

Substituir la crida `const cloud = useCloud({ state, importState, isReadOnly, showToast });` per:

```ts
const cloud = useCloud({ state, importState, isReadOnly, showToast, user });
```

El `...cloud` dins del `value` ja no inclou `signInCloud/signOutCloud/cloudUser` (eliminats a Task 6); el `Ctx extends CloudSlice` queda coherent automàticament. Verificar que cap altra part del fitxer referencia `signInCloud`, `signOutCloud` o `cloudUser`.

- [ ] **Step 6: Build**

Run: `cd project75 && npm run build`
Expected: error només a `CloudSyncCard.tsx` (encara usa `signInCloud/cloudUser`). La resta compila.

- [ ] **Step 7: Commit**

```bash
git add project75/src/hooks/useAppState.tsx
git commit -m "feat(auth): useAppState amb clau per usuari, migracio i estat buit"
```

---

### Task 8: Gate d'entrada (`App` + `main` + `AuthGate`)

**Files:**
- Create: `project75/src/auth/AuthGate.tsx`
- Modify: `project75/src/main.tsx`
- Modify: `project75/src/App.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 5), `AppProvider`/`useApp` existents, `detectReadOnly` de `../utils/readOnly`, `Card`/`Button` existents.
- Produces: `AuthGate` (pantalla d'entrada); `App` amb gate.

- [ ] **Step 1: Crear `AuthGate.tsx`**

```tsx
import { useState } from 'react';
import { useAuth } from './useAuth';

export default function AuthGate() {
  const { signIn, status, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const busy = status === 'loading';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Project75</h1>
          <p className="text-[13px] text-muted mt-1">Entra o crea el teu compte per començar.</p>
        </div>
        <input
          type="email" inputMode="email" autoComplete="email" placeholder="El teu email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface2 border border-line2 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold focus:outline-none focus:border-accent"
        />
        <input
          type="password" autoComplete="current-password" placeholder="Contrasenya (mín. 6)"
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && email.trim() && password.length >= 6) signIn(email, password); }}
          className="w-full bg-surface2 border border-line2 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold focus:outline-none focus:border-accent"
        />
        <button
          disabled={busy || !email.trim() || password.length < 6}
          onClick={() => signIn(email, password)}
          className="w-full bg-accent text-white font-semibold rounded-xl px-4 py-3 disabled:opacity-55"
        >
          {busy ? 'Entrant…' : 'Entrar / Crear compte'}
        </button>
        {error && <p className="text-[12.5px] text-warn m-0">{error}</p>}
        <p className="text-[12px] text-muted leading-relaxed m-0">
          La primera vegada es crea el compte. Cada persona té les seves pròpies dades.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Embolcallar amb `AuthProvider` a `main.tsx`**

A `project75/src/main.tsx`, embolcallar `<App />` amb `<AuthProvider>`:

```tsx
import { AuthProvider } from './auth/useAuth';
// …
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
```

(Adaptar a l'estructura real de `main.tsx`; només afegir l'embolcall i l'import.)

- [ ] **Step 3: Gate a `App.tsx`**

Reescriure `project75/src/App.tsx`:

```tsx
import { AppProvider, useApp } from './hooks/useAppState';
import { useAuth } from './auth/useAuth';
import { detectReadOnly } from './utils/readOnly';
import AuthGate from './auth/AuthGate';
import AppLayout from './components/AppLayout';
import Today from './pages/Today';
import Nutrition from './pages/Nutrition';
import Training from './pages/Training';
import Evolution from './pages/Evolution';
import Coach from './pages/Coach';
import Settings from './pages/Settings';
import type { Tab } from './types';

const PAGES: Record<Tab, JSX.Element> = {
  avui: <Today />, nutri: <Nutrition />, gym: <Training />,
  evo: <Evolution />, coach: <Coach />, config: <Settings />,
};

function Shell() {
  const { tab } = useApp();
  return <AppLayout>{PAGES[tab]}</AppLayout>;
}

export default function App() {
  const { status, user } = useAuth();
  const demo = detectReadOnly();

  // Mode demo o Supabase no configurat → app local/demo com sempre.
  if (demo || status === 'disabled') {
    return (
      <AppProvider>
        <Shell />
      </AppProvider>
    );
  }
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-muted">Carregant…</div>;
  }
  if (status === 'signed_out' || status === 'error' || !user) {
    return <AuthGate />;
  }
  // signed_in → estat per usuari, remuntat per key.
  return (
    <AppProvider key={user.id}>
      <Shell />
    </AppProvider>
  );
}
```

- [ ] **Step 4: Build**

Run: `cd project75 && npm run build`
Expected: error només a `CloudSyncCard.tsx` (Task 9). App/AuthGate compilen.

- [ ] **Step 5: Commit**

```bash
git add project75/src/auth/AuthGate.tsx project75/src/main.tsx project75/src/App.tsx
git commit -m "feat(auth): gate d entrada (AuthProvider + AuthGate + key per usuari)"
```

---

### Task 9: `AuthCard` a Configuració (absorbeix `CloudSyncCard`)

**Files:**
- Create: `project75/src/components/AuthCard.tsx`
- Modify: `project75/src/pages/Settings.tsx`
- Delete: `project75/src/components/CloudSyncCard.tsx`

**Interfaces:**
- Consumes: `useAuth` (compte/sessió) + `useApp` (estat de sync: `cloudStatus`, `syncNow`, `isReadOnly`).
- Produces: `AuthCard` (card «Compte» a Configuració).

- [ ] **Step 1: Crear `AuthCard.tsx`**

```tsx
import { useApp } from '../hooks/useAppState';
import { useAuth } from '../auth/useAuth';
import Card from './Card';
import Button from './Button';

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[11.5px] font-bold tracking-[0.07em] uppercase text-faint px-1 pb-2">Compte</div>
      <Card className="py-4 space-y-3">{children}</Card>
    </div>
  );
}

export default function AuthCard() {
  const { status, user, signOut } = useAuth();
  const { isReadOnly, cloudStatus, syncNow } = useApp();

  if (status === 'disabled') {
    return (
      <Wrap>
        <p className="text-[13px] text-muted m-0">Compte no configurat en aquest entorn.</p>
        <p className="text-[12px] text-muted m-0">Project75 continua funcionant en mode local.</p>
      </Wrap>
    );
  }
  if (isReadOnly) {
    return (
      <Wrap>
        <p className="text-[13px] text-muted m-0">Compte no disponible en mode visita.</p>
      </Wrap>
    );
  }
  if (!user) {
    // En condicions normals no s'arriba aquí (el gate ho impedeix), però és segur.
    return (
      <Wrap>
        <p className="text-[13px] text-muted m-0">No has iniciat sessió.</p>
      </Wrap>
    );
  }

  const syncLabel =
    cloudStatus === 'syncing' ? 'Sincronitzant…' : cloudStatus === 'error' ? 'Error de sincronització' : 'Sincronitzat';

  return (
    <Wrap>
      <div>
        <div className="text-[13px] font-semibold">{user.email}</div>
        <div className="text-[12.5px] text-muted mt-0.5">Sessió iniciada · {syncLabel}</div>
      </div>
      <div className="flex flex-wrap gap-2.5 border-t border-line pt-3">
        <Button variant="ghost" size="sm" icon="swap" disabled={cloudStatus === 'syncing'} onClick={syncNow}>
          Sincronitzar ara
        </Button>
        <Button variant="ghost" size="sm" icon="x" onClick={signOut}>
          Tancar sessió
        </Button>
      </div>
      <p className="text-[12px] text-muted leading-relaxed m-0 border-t border-line pt-3">
        Les teves dades se sincronitzen automàticament entre els teus dispositius. localStorage continua actiu com a
        backup local.
      </p>
    </Wrap>
  );
}
```

- [ ] **Step 2: Substituir `CloudSyncCard` per `AuthCard` a `Settings.tsx`**

A `project75/src/pages/Settings.tsx`: canviar l'import `import CloudSyncCard from '../components/CloudSyncCard';` per `import AuthCard from '../components/AuthCard';` i el `<CloudSyncCard />` per `<AuthCard />`.

- [ ] **Step 3: Esborrar `CloudSyncCard.tsx`**

Run: `cd project75 && git rm src/components/CloudSyncCard.tsx`

- [ ] **Step 4: Build**

Run: `cd project75 && npm run build`
Expected: PASS (build net, sense errors de tipus).

- [ ] **Step 5: Commit**

```bash
git add project75/src/components/AuthCard.tsx project75/src/pages/Settings.tsx
git commit -m "feat(auth): AuthCard a Configuracio; elimina CloudSyncCard"
```

---

### Task 10: Verificació final (build + tests + acceptació manual)

**Files:** cap canvi de codi (només verificació; petits guards si en surt algun).

- [ ] **Step 1: Tots els tests**

Run: `cd project75 && npm test`
Expected: PASS (storageKeys, stateMigration, emptyState, authService).

- [ ] **Step 2: Build net**

Run: `cd project75 && npm run build`
Expected: `✓ built`.

- [ ] **Step 3: Acceptació manual al dev (`npm run dev -- --port 5180 --strictPort`)**

Comprovar, un per un:
- Amb env vars i sense sessió → surt `AuthGate` (no s'accedeix a l'app).
- Registrar un email NOU → entra i l'app arrenca **buida** (perfil sense nom, sense pesos/ratxa), sense petar cap pàgina (Avui, Nutrició, Gym, Evolució, Coach, Config).
- **No-pèrdua:** entrar amb `atuvi4@gmail.com` → hi són les dades de Tuvi. A DevTools → Application → Local Storage, la clau antiga `project75_state_v3` **segueix existint** i hi ha una nova `project75_state_v3::<uid>`.
- Tancar sessió → torna a `AuthGate`; les claus de `localStorage` **no s'han esborrat**.
- Entrar amb un segon compte al mateix navegador → veu les SEVES dades, no les de l'altre.
- `?demo=1` → mode només-lectura sense login, sense escriptures.
- Marcar un àpat com a Fet → al cap d'uns segons «Sincronitzat»; en un altre dispositiu/finestra amb el mateix compte, en tornar-hi es baixa sol.

- [ ] **Step 4: (Si cal) guards mínims**

Si alguna pàgina peta amb el perfil buit, afegir el guard mínim imprescindible en aquell punt (p. ex. evitar divisió per zero mostrant `—`). No refactoritzar Nutrition/Training.

- [ ] **Step 5: Commit final (si hi ha guards) i tancament**

```bash
git add -A project75
git commit -m "fix(auth): guards minims per a perfil buit (si escau)"
```

> Desplegament a producció (push a `main`) i env vars a Vercel es fan a part, confirmats amb l'usuari, com a la fase anterior.
