# Project75 — V1 (React + TypeScript + Vite + Tailwind)

*Nutrition-first hybrid coach* · usuari: **Tuvi**

App personal per guanyar volum de forma **agressiva però sostenible** (67 → 75-80 kg), amb la nutrició com a prioritat, mantenint el gym i introduint el triatló a poc a poc. Aquesta és la **V1 real**: mateix disseny premium que el prototip v0.3, però amb arquitectura de components, TypeScript i persistència a localStorage.

> Encara **sense backend**: sense Supabase, sense auth, sense IA real, sense fotos reals. Tot corre al navegador.

---

## Com executar-lo

Necessites **Node.js 18+**.

```bash
cd project75
npm install
npm run dev
```

Obre la URL que apareix (per defecte **http://localhost:5173/**).

Altres scripts:
```bash
npm run build     # typecheck (tsc) + build de producció a /dist
npm run preview   # servir la build de producció
```

### Provar-lo com a mòbil
- Al navegador: `F12` → mode dispositiu (icona de mòbil) → iPhone. Apareix la bottom nav.
- Al teu iPhone (mateixa xarxa): `npm run dev -- --host` i obre la IP que mostra Vite des del Safari. *Afegir a pantalla d'inici* per fer-lo semblar una app (manifest + icona ja preparats).

---

## Estructura de fitxers

```
project75/
├─ index.html                 # entrada + fonts + manifest PWA
├─ vite.config.ts             # config Vite + plugin React
├─ tailwind.config.js         # paleta i tokens de disseny
├─ public/
│  ├─ manifest.webmanifest    # PWA ready
│  └─ icon.svg                # icona "75"
└─ src/
   ├─ main.tsx                # arrel React
   ├─ App.tsx                 # provider + routing per tabs
   ├─ types/index.ts          # tots els tipus TypeScript
   ├─ data/                   # dades estàtiques
   │  ├─ program.ts           #   perfil per defecte
   │  ├─ week.ts              #   planning setmanal (gym/run/bike/swim)
   │  └─ meals.ts             #   àpats, batuts, alternatives, sense-cuinar, fora
   ├─ utils/                  # lògica pura
   │  ├─ goals.ts             #   objectius segons mode, sumes, tendència
   │  ├─ coach.ts             #   motor de recomanacions per regles
   │  ├─ date.ts / format.ts  #   helpers
   ├─ hooks/
   │  └─ useAppState.tsx      # ESTAT GLOBAL + accions + localStorage
   ├─ components/             # components reutilitzables
   │  ├─ AppLayout, Sidebar, MobileNav
   │  ├─ Card, Button, Badge, ProgressBar, Ring, Icon, PageHead
   │  ├─ MetricCard, MealCard, TrainingDayCard, CategoryTag, CoachRecommendation
   │  ├─ Sheet (modal)
   │  └─ sheets/              #   CheckinSheet, SwapSheet, RescueSheet, QuickOptionsSheet
   ├─ pages/                  # una per pantalla
   │  ├─ Today, Nutrition, Training, Evolution, Coach, Settings
   └─ styles/index.css        # Tailwind + helpers (gradients, glass, animacions)
```

**El fitxer clau és `src/hooks/useAppState.tsx`**: conté tot l'estat, les accions i la persistència. Quan connectem Supabase, gairebé tot el canvi passa aquí.

---

## Quines dades es guarden a localStorage

Clau: **`project75_state_v1`**. És un únic objecte JSON amb:

| Camp | Descripció |
|------|------------|
| `profile` | nom, pes inicial, objectius (75/80), calories, proteïna, ritme |
| `weights` | històric de pesos `{ data, kg }` (per tendència i gràfic) |
| `meals` | àpats del dia amb estat `done` (es reinicien cada nou dia) |
| `dayMode` | `normal` / `pocaGana` / `dificil` |
| `gymDone` | si has marcat la sessió d'avui |
| `checkin` | últim check-in (ànim/gana/energia) |
| `dislikes` | aliments marcats com "no em ve de gust" |
| `streak`, `lastComplete` | ratxa de constància |
| `date` | data del dia carregat (per reiniciar el que és diari) |

Reinici diari automàtic: àpats, gym i check-in es reseteguen cada dia; pes, ratxa, perfil i preferències es mantenen. Reset total a **Configuració → Dades → Reiniciar**.

---

## Què faltaria per connectar Supabase

L'arquitectura ja està preparada. Els passos serien:

1. **Crear projecte Supabase** i taules: `profiles`, `weights`, `meal_logs`, `checkins`, `workouts`, `preferences` (reflecteixen els tipus de `src/types`).
2. **Auth**: afegir login (email/Apple) amb Supabase Auth per identificar l'usuari.
3. **Substituir la persistència**: a `useAppState.tsx`, canviar `localStorage.getItem/setItem` per crides a Supabase (`supabase.from(...).select/insert/update`). La forma de l'estat no cal canviar-la.
4. **Sincronització**: carregar l'estat de l'usuari al login i escriure canvis a la BD (amb localStorage com a caché offline).
5. **Notificacions** (recordatoris) i, més endavant (V3), IA real i foto→recomanació.

Com que tota la lògica viu a `utils/` i `hooks/`, els components (`pages/`, `components/`) gairebé no s'han de tocar.

---

## Funcionalitats de la V1

- Dashboard "Avui" amb **prioritat del dia** (hero) i estat (agressiu sostenible / dia difícil / poca gana).
- Objectius de **calories, proteïna i àpats** (anell + barres).
- Nutrició: **completar / canviar / no em ve de gust**, afegir batut, mode poca gana, rescat.
- **Accions ràpides**: no tinc gana · no vull cuinar · menjo fora · només vull batut · canvia'm el dia.
- Entrenament: planning setmanal (gym + running + bici + natació) amb focus del dia i avís de conflicte.
- Evolució: mini-cards, barra 67→75→80 amb fites, gràfic i missatge per **tendència**.
- Coach: **recomanacions per regles** (no xat fals) accionables.
- Configuració **editable**: nom, pesos, objectius, calories, proteïna, ritme, reset.
- Check-in, afegir pes, ratxa, localStorage.

---

## Checklist per provar la V1 durant 7 dies

**Cada dia (rutina real):**
- [ ] Obrir → entendre "què he de fer ara" en <10 s (hero d'Avui).
- [ ] Marcar àpats a mesura que menjo; provar **Canviar** i **No em ve de gust**.
- [ ] Fer el **check-in** i veure si canvia bé l'estat/recomanacions.
- [ ] Usar alguna **acció ràpida** (no vull cuinar, menjo fora, només batut…).
- [ ] Marcar la sessió d'entrenament.

**Durant la setmana:**
- [ ] Activar **Dia difícil** un dia baix i comprovar que treu pressió i manté la ratxa.
- [ ] Activar **Poca gana** i veure si les opcions líquides ajuden.
- [ ] Afegir pes 2-3 cops i mirar barra + **tendència** + fita propera.
- [ ] Editar objectius a **Configuració** (p. ex. pujar calories) i veure que es reflecteix.
- [ ] Tancar i reobrir el navegador → comprovar que **no s'ha perdut res**.
- [ ] Provar-lo a **desktop** i a **mòbil**.

**Preguntes a respondre el dia 7:**
- [ ] Em roba menys de 3 min/dia?
- [ ] Alguna pantalla em fa mandra, sobra o falta?
- [ ] El to del coach: massa tou, massa dur o just?
- [ ] Les recomanacions em semblen útils i realistes?
- [ ] **Tinc ganes de seguir obrint-la?** ← la que decideix si connectem Supabase.

> Apunta el que falli o t'incomodi. Amb això iterem la V1 abans de passar a backend real.
