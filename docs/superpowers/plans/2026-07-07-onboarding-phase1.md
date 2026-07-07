# Onboarding + objectius propis (Personalització Fase 1) — Pla

**Data:** 2026-07-07 · **Branca:** `onboarding-v1` (des de `main`)

## Objectiu (disseny aprovat)
Després del registre, un usuari nou passa per una **pantalla de configuració inicial** que captura les seves dades i **objectiu**, i l'app li calcula i desa els SEUS kcal/proteïna. Tot el progrés es mesura contra els seus números. Els àpats i l'entrenament segueixen sent el contingut base (Fases 2 i 3), però ja mesurats contra els seus objectius.

**No-pèrdua / no-regressió:** els usuaris existents (p. ex. Tuvi) es tracten com `onboarded: true` i NO passen per l'onboarding; les seves dades no es toquen.

## Model de dades
- `Profile` guanya `goal: 'cut' | 'maintain' | 'bulk'` i `onboarded: boolean`.
- `DEFAULT_PROFILE` (Tuvi): `goal: 'bulk'`, `onboarded: true` → per `{ ...DEFAULT_PROFILE, ...s.profile }`, qualsevol estat existent sense els camps queda `onboarded: true`.
- `STARTER_PROFILE` (usuari nou): `goal: 'maintain'` (per defecte, se sobreescriu), `onboarded: false`.

## Càlcul segons objectiu
`computeTargets` guanya `goal?: Goal` (per defecte `'bulk'` per no trencar el caller existent). Ajust sobre el manteniment (TDEE mig):
- **bulk:** superàvit actual (moderat +150 start / rang +100..+250; agressiu +250 / +250..+450).
- **maintain:** ≈ manteniment (start 0, rang −100..+100).
- **cut:** dèficit (moderat −300 / −400..−200; agressiu −500 / −600..−400), **mai per sota del BMR**.
- Proteïna ~2 g/kg en tots els casos. `explanation`/`proteinNote` adaptats per objectiu.

## Flux (gate)
El gate d'onboarding va a **`Shell`** (dins d'`AppProvider`, on hi ha `useApp`): si `!isReadOnly && !state.profile.onboarded` → `<Onboarding/>`; si no → l'app. En demo/read-only no hi ha onboarding.

---

## Tasques

### Task 1: Tipus + defaults + engine goal-aware (amb tests)
**Files:** `src/types/index.ts`, `src/data/program.ts`, `src/data/emptyState.ts`, `src/nutrition/nutritionTargets.ts`, `src/pages/Nutrition.tsx`, test `src/nutrition/nutritionTargets.test.ts`.

- [ ] Afegir a `types/index.ts`: `export type Goal = 'cut' | 'maintain' | 'bulk';` i a `Profile` els camps `goal: Goal;` i `onboarded: boolean;`.
- [ ] `program.ts` `DEFAULT_PROFILE`: `goal: 'bulk', onboarded: true`.
- [ ] `emptyState.ts` `STARTER_PROFILE`: `goal: 'maintain', onboarded: false`.
- [ ] `nutritionTargets.ts`: `TargetInput` guanya `goal?: Goal`; `computeTargets` aplica els ajustos per objectiu (taula de dalt), amb sòl al BMR per a cut, i `explanation`/`proteinNote` per objectiu.
- [ ] `Nutrition.tsx` (línia ~80): passar `goal: p.goal` a `computeTargets`.
- [ ] Test `nutritionTargets.test.ts`: per un mateix perfil, `cut.kcalStart < maintain.kcalStart < bulk.kcalStart`; `cut.kcalStart >= bmr`; sense `goal` es comporta com `bulk` (compat).
- [ ] `npm test` verd, `npm run build` verd. Commit.

### Task 2: Acció `completeOnboarding` a useAppState
**Files:** `src/hooks/useAppState.tsx`.

- [ ] Afegir al `Ctx` i al provider `completeOnboarding(input: OnboardingInput): void`, on `OnboardingInput = { name?: string; sex: 'male'|'female'; age: number; heightCm: number; startWeight: number; goal: Goal; ritme: Ritme }`.
- [ ] Implementació: calcula `computeTargets({sex,age,heightCm,weightKg:startWeight,ritme,goal})`; fa `updateProfile`-equivalent amb `{...input, kcalGoal: t.kcalStart, protGoal: Math.max(t.proteinGrams,120), target1: startWeight, target2: startWeight, onboarded: true}`; registra el pes inicial (`weights: [{d: todayISO(), kg: startWeight}]` si no n'hi ha); toast «Perfil configurat». Guardat pel `guard` (bloquejat en read-only).
- [ ] `npm run build` verd. Commit.

### Task 3: Component `Onboarding`
**Files:** `src/onboarding/Onboarding.tsx`.

- [ ] Wizard d'una pantalla (estil `AuthGate`): camps nom (opcional), sexe (male/female), edat, alçada (cm), pes (kg), **objectiu** (cut/maintain/bulk amb etiquetes «Perdre greix / Mantenir / Volum») i ritme (moderat/agressiu). Validació mínima (edat/alçada/pes > 0). Botó «Comença» deshabilitat fins que els números siguin vàlids → crida `completeOnboarding`.
- [ ] `npm run build` verd. Commit.

### Task 4: Gate a `Shell` + verificació
**Files:** `src/App.tsx`.

- [ ] A `Shell`: `const { tab, state, isReadOnly } = useApp(); if (!isReadOnly && !state.profile.onboarded) return <Onboarding/>;` (import d'Onboarding).
- [ ] `npm test` verd, `npm run build` verd.
- [ ] Acceptació manual (dev): usuari nou → surt l'onboarding → omplir amb objectiu «Perdre greix» → entra amb kcal en dèficit; usuari existent (atuvi4) → NO surt onboarding, dades intactes; `?demo=1` → sense onboarding.
- [ ] Commit.
