# Esbós de Producte — App personal de nutrició + híbrid (volum & triatló)

> Document de definició v0.1 · Data: 2026-07-01
> Estat: **Fase 1 — Definició**. Encara no és codi ni disseny final. És la base per decidir abans de construir.

---

## 1. Concepte en una frase

**Un entrenador personal de butxaca centrat primer a fer-te menjar prou i amb varietat, que t'acompanya dia a dia perquè guanyis massa (67 → 75-80 kg) sense abandonar, mentre mantens el gym i, quan estiguis a punt, et prepara per una triatló olímpica.**

---

## 2. Cinc noms possibles

| Nom | Per què |
|-----|---------|
| **Volum** | Directe, honest, és el teu objectiu número 1. Fàcil de recordar, sona seriós i no infantil. |
| **HybridOne** | Reflecteix el físic "hybrid" (força + resistència) i "one" perquè de moment és per a tu, una sola persona. |
| **Bulk&Go** | Àgil, transmet "menja i tira endavant sense complicar-te". To d'amic. |
| **Nutri+** | Deixa clar que la prioritat és la nutrició; el "+" indica que hi ha entrenament al darrere. |
| **Ritual** | Idea de constància i hàbit diari sense fricció; menys literal, més aspiracional i madur. |

**Recomanació:** `Volum` per treballar internament (clar i motivador). `HybridOne` si vols una marca més "producte". La resta del document fa servir **Volum** com a nom de treball.

---

## 3. Problema principal que resol

El problema real no és "no saber què fer" — és **la constància i la fricció**.

- Ets prim i vols pujar de pes, però **et costa menjar prou** (ansietat → perds la gana, et canses dels mateixos menjars).
- Comptar calories i macros et fa **mandra** i acabes abandonant.
- Sense un sistema que decideixi per tu i que perdoni els dies dolents, **abandones el pla** i tornes a la casella zero.

**Volum resol això reduint la decisió i la fricció a gairebé zero**: et diu què toca avui, t'ho posa fàcil quan estàs baix, i mesura constància en comptes de perfecció.

---

## 4. Perfil d'usuari principal

**"En Marc, l'híbrid ansiós de 23 anys"** (basat en tu):

- Home, 23 anys, 178 cm, ~67 kg. Objectiu: 75-80 kg, físic hybrid.
- **Complex de prim**, història d'abandonar plans de volum.
- **Ansietat que afecta la gana**; es cansa dels menjars repetits.
- Va al gym **4-5 dies/setmana** (rutina fixa força + hipertròfia que estima i no vol canviar).
- **Bona base de running** (mitja marató ~4:54/km), principiant en bici i natació.
- Vol preparar una **triatló olímpica** en el futur (no ara mateix).
- Cuina la mare, però ell també cuina. Sense al·lèrgies ni aliments prohibits.
- Vol una app **professional, seriosa, fàcil**, que **no li robi temps** (<3 min/dia).
- iPhone + ordinador. De moment, **només per a ell**.

**Necessitats clau:** que li decideixin, varietat, perdó els dies dolents, motivació sense infantilisme.
**Por principal:** avorrir-se, sentir-se controlat i abandonar un cop més.

---

## 5. Principis de producte

1. **Nutrició primer.** Tot gira al voltant de menjar prou i amb proteïna. La resta és secundari.
2. **Poca fricció.** Cada acció ha de ser d'1-2 tocs. Zero obligació d'introduir grams si no vols.
3. **Decideix per mi.** L'app proposa; l'usuari confirma o canvia. Menys pantalla en blanc.
4. **Mode dia difícil sempre a mà.** L'app s'adapta a l'ansietat i la mandra, no ho penalitza.
5. **Constància > perfecció.** Es premia aparèixer i fer "prou", no fer-ho tot perfecte.
6. **No abandonar és l'èxit.** El disseny està optimitzat per la retenció, no per les dades.
7. **Professional però simple.** To de coach seriós + amic directe. Res infantil.
8. **Respecta la meva rutina.** El gym que ja fa no es toca; el triatló s'afegeix a sobre progressivament.
9. **<3 minuts al dia.** Si un dia demana més temps, alguna cosa està mal dissenyada.
10. **Empeny el resultat, no la persona.** Objectiu de pes agressiu (ràpid, canvis visibles) però exigència diària suau: surplus alt via batuts/snacks fàcils, mai obligació de dies perfectes. El Mode agressiu no desactiva mai el Mode dia difícil.

---

## 6. Proposta de valor

> **"Guanya els kilos que sempre has volgut sense obsessionar-te amb les calories. Volum et diu exactament què menjar i què fer avui, s'adapta quan tens un mal dia, i converteix la constància en progrés visible — del gym d'avui a la triatló de demà."**

Diferència vs MyFitnessPal / apps genèriques:
- No et fa comptar-ho tot: té **mode simple i mode rescat**.
- Està pensada per a **pujar de pes** amb ansietat, no per aprimar-se.
- Combina **nutrició + força + resistència híbrida** en un sol relat diari.

---

## 7. MVP de la primera versió (V1)

L'MVP ha de demostrar una sola cosa: **"m'ajuda a menjar prou i no abandonar"**.

Inclou el mínim per aconseguir-ho:

1. **Onboarding curt** (dades, objectiu, aliments que t'agraden/cansen).
2. **Dashboard d'avui**: què toca (nutrició + gym) en una frase.
3. **Nutrició en mode simple**: objectius del dia com a "targetes d'àpats" a marcar (esmorzar, dinar, berenar, sopar, snack nocturn), amb objectiu de proteïna i un anell de progrés.
4. **Botó "Canvia'm aquest àpat" / "No em ve de gust"** amb substitucions.
5. **Mode dia difícil / rescat** (versió mínima de menjar).
6. **Check-in diari** (3-4 preguntes ràpides).
7. **Registre de pes + foto** setmanal i gràfic d'evolució.
8. **Registre bàsic del gym** (marcar sessió feta + notes).
9. **Gamificació bàsica**: ratxa + barra de progrés 67 → 75-80 kg.
10. **Missatges del coach** contextuals (plantilles, encara sense IA).

Tot local/personal, sense comptes d'altres usuaris.

---

## 8. Què entra a V1, V2 i V3

### V1 — "No abandonar i menjar prou" (nucli)
- Onboarding, Dashboard d'avui, Nutrició mode simple, substitucions, mode rescat, check-in, pes+foto+gràfic, gym bàsic, ratxa + barra de progrés, missatges de coach amb plantilles.

### V2 — "Precisió i intel·ligència lleugera"
- Mode precís (calories/macros) opcional.
- Generador de menús setmanals segons preferències i "aliments que em cansen".
- Batuts i snacks calòrics com a mòdul propi.
- Ajust automàtic de calories si el pes no puja.
- Sistema de triatló (running/bici/natació) integrat amb el calendari del gym i avisos de conflicte.
- Gamificació ampliada (nivells, reptes, mètrica de constància).
- Recordatoris intel·ligents.

### V3 — "IA i automatització"
- **Foto a producte/etiqueta/plat** → l'app diu si encaixa amb el teu volum (OCR + visió + LLM).
- Coach conversacional real (IA) amb el teu context.
- Aprenentatge de patrons (quan tens gana, quins àpats abandones, etc.).
- Integració amb Apple Health / Strava (pes, passos, entrenaments, son).
- Recomanacions predictives ("demà tens cames, avui carrega hidrats").

---

## 9-10. Pantalles principals (objectiu, elements, accions, exemple de text)

### 9.1 · Dashboard d'avui
- **Objectiu:** en 5 segons saber què toca avui i sentir-te acompanyat.
- **Elements:** salutació + frase del dia; targeta "Avui toca" (gym + focus nutrició + acció clau); anell de proteïna/àpats; ratxa; accés ràpid a check-in i a "mode dia difícil".
- **Accions:** marcar àpats fets, obrir nutrició, fer check-in, activar mode dia difícil.
- **Exemple de text:**
  > "Bon dia, Marc 💪 Avui toca **gym cames + arribar a 150 g de proteïna + snack abans de dormir**. Ratxa: 6 dies. Comencem?"

### 9.2 · Nutrició
- **Objectiu:** fer que menjar prou sigui una sèrie de decisions fàcils, no un full de càlcul.
- **Elements:** objectiu diari (kcal/proteïna o "àpats a completar"); targetes d'àpats amb proposta concreta; botons "Fet", "Canvia'm això", "No em ve de gust"; accés a batuts/snacks; toggle Simple ↔ Precís.
- **Accions:** completar àpat, demanar substitució, afegir snack/batut, activar mode rescat, canviar de mode.
- **Exemple de text:**
  > "Dinar proposat: arròs + pit de pollastre + oli (≈ 700 kcal, 45 g proteïna). No et ve de gust? Toca *Canvia'm això* i et dono 3 alternatives igual de calòriques."

### 9.3 · Entrenament
- **Objectiu:** mantenir la teva rutina de gym i, més endavant, encaixar-hi el triatló sense conflictes.
- **Elements:** rutina de la setmana (els teus dies: pit+espatlla, cames, esquena, braç…); botó "Sessió feta"; registre ràpid de sèries/pes (opcional); secció triatló (V2) amb sessions de running/bici/natació; avís de conflicte de recuperació.
- **Accions:** marcar sessió, registrar progressió, moure una sessió, veure per què no combinar cames + running el mateix dia.
- **Exemple de text:**
  > "Avui: **Cames**. Recorda pujar càrrega si l'última sèrie va sortir fàcil. ⚠️ Demà tenies running: millor deixar-lo per demà passat perquè les cames descansin."

### 9.4 · Evolució
- **Objectiu:** veure el progrés real i que motivi (no jutjar dies solts).
- **Elements:** gràfic de pes amb tendència (mitjana setmanal, no pes diari); barra 67 → 75-80 kg; galeria de fotos comparatives; mètrica de constància (% de dies "prou"); PRs del gym.
- **Accions:** afegir pes, afegir foto, comparar fotos, veure tendència.
- **Exemple de text:**
  > "Tendència: **+0,3 kg/setmana** ✅ Vas bé cap als 75 kg. Ignora les pujades i baixades del dia a dia: el que compta és la línia."

### 9.5 · Coach / assistent
- **Objectiu:** donar-te direcció, motivació i respostes segons com estàs.
- **Elements (V1):** missatges contextuals segons check-in i dades. **(V3):** xat amb IA amb el teu context. Accions ràpides suggerides.
- **Accions:** llegir missatge del dia, demanar "què faig ara?", activar mode dia difícil des d'aquí.
- **Exemple de text:**
  > "Veig que avui estàs baix d'ànims i sense gana. Cap problema. Objectiu mínim d'avui: **1 batut + 1 àpat**. Amb això ja no perds el fil. La resta, si pots, bonus."

### 9.6 · Configuració
- **Objectiu:** ajustar sense complicar.
- **Elements:** dades personals i objectiu de pes; aliments que t'agraden / que et cansen; hores de recordatoris; mode per defecte (simple/precís); rutina de gym; unitats; exportar/copia de seguretat.
- **Accions:** editar objectiu, gestionar llista d'aliments, configurar recordatoris, triar to del coach.
- **Exemple de text:**
  > "Aliments que em canso de veure: [pit de pollastre ✕] [arròs blanc ✕]. Els faré servir menys en els teus menús."

---

## 11. Flux diari ideal (<3 minuts/dia)

**Matí (30 s):** obres l'app → Dashboard: "Avui toca X". Fas check-in ràpid (3 tocs).
**Durant el dia (10-20 s per àpat):** cada àpat, obres nutrició i toques "Fet" (o "Canvia'm això" si no et ve de gust). Zero grams obligatoris.
**Post-gym (15 s):** "Sessió feta" (+ opcional registrar una sèrie clau).
**Nit (30 s):** confirmes snack nocturn, pesada opcional 1×/setmana, mires la ratxa.

**Total: ~2 minuts repartits.** Cap moment demana omplir formularis llargs.

---

## 12. Mode "dia difícil"

Activable amb un botó gran al Dashboard o suggerit per l'app si el check-in detecta ansietat/poca gana/mandra.

**Què fa:**
- Baixa l'exigència a un **objectiu mínim viable** (ex: "1 batut + 1 àpat + proteïna a mitges").
- Prioritza **calories líquides i fàcils** (batuts, iogurt, snacks densos) que costen menys d'empassar amb ansietat.
- Canvia el to a **comprensiu i curt**: menys text, menys demandes.
- **No trenca la ratxa** si compleixes el mínim (constància > perfecció).
- Amaga el mode precís i la gamificació exigent aquell dia.

**Exemple:**
> "Dia difícil activat. Oblida't dels macros. Només: **1 batut calòric ara + sopar fàcil després**. Si ho fas, la ratxa segueix viva. Un pas, prou."

---

## 13. Sistema de nutrició

### Mode simple (per defecte)
- El dia són **5 targetes d'àpat**: esmorzar, dinar, berenar, sopar, snack nocturn.
- Cada targeta té una proposta concreta i un valor aproximat (kcal + proteïna) que **no cal editar**.
- Marques "Fet" i prou. Objectiu del dia = completar les targetes + arribar a la proteïna.
- Indicador visual: anell d'àpats + anell de proteïna.

### Mode precís (opcional, V2)
- Actives calories i macros exactes; pots registrar grams o triar de la base d'aliments.
- Per dies que vulguis afinar (ex: setmana de control). Sempre reversible al mode simple.

### Mode rescat
- Versió extrema del mode simple per dies molt dolents o amb presses.
- Ofereix **3 opcions ultra-fàcils** d'alta densitat calòrica (batut, entrepà gran, iogurt+fruits secs+mel).
- Objectiu: no baixar de X calories mínimes, encara que no arribis al total.

### Substitucions de menjars ("Canvia'm això" / "No em ve de gust")
- Cada àpat té un botó que ofereix **2-3 alternatives amb calories i proteïna similars**.
- Prioritza aliments que t'agraden i evita els que has marcat com "em canso".
- Si dius "no em ve de gust" a un aliment sovint, l'app **aprèn** i el proposa menys.

### Snacks i batuts calòrics
- Biblioteca de **batuts d'alta densitat** (ex: llet + plàtan + civada + crema de cacauet + iogurt ≈ 600-800 kcal) i snacks ràpids.
- Sempre a un toc des del Dashboard i del mode rescat.
- Rol clau: pugen calories sense esforç de masticar (ideal amb ansietat/poca gana).

### Menús flexibles
- Generador (V2) que munta la setmana amb els teus aliments, alternant per no avorrir.
- Compatible amb menjar casolà de la mare: pots dir "avui cuina la mare, plat X" i l'app l'encaixa.
- Marca de "variar" perquè no es repeteixi el mateix massa sovint.

### Com adaptar el pla si el pes no puja
Regla base (revisió setmanal, sobre **tendència** no pes diari):
- Si en 2 setmanes el pes **no ha pujat ≥0,2-0,3 kg/setmana** → l'app suggereix **+200-300 kcal/dia** (normalment via 1 batut o snack extra, no reestructurant tot).
- Si puja massa ràpid (>0,6 kg/setmana sostingut) → suggereix afinar una mica (per evitar guany de greix excessiu).
- Sempre proposa l'ajust com a **acció concreta i petita**: "afegeix aquest batut al berenar", no "menja més".

---

## 14. Sistema de check-in diari

**Format:** 3-4 preguntes, tot de tocar, <30 s. Mai obligatori escriure.

| Pregunta | Opcions de resposta |
|----------|---------------------|
| Com estàs d'ànim/ansietat avui? | 😀 Bé · 😐 Regular · 😟 Ansiós/baix |
| Com tens la gana? | 🍽️ Amb gana · 😐 Normal · 🚫 Poca gana |
| Quanta energia/mandra? | ⚡ Ple · 🔋 Mitja · 😴 Mandra |
| (Opcional) Has dormit bé? | 👍 Sí · 👎 No |

**Com s'utilitzen les respostes:**
- Ansiós/baix **o** poca gana → l'app **suggereix el mode dia difícil/rescat** i canvia el to a comprensiu.
- Poca gana → prioritza **calories líquides** (batuts) i baixa l'objectiu de masticar.
- Mandra/energia baixa → **suggereix moure** una sessió dura de gym o cardio, o fer versió curta.
- Bé + amb gana → dia per **empènyer** (objectiu complet, potser un snack extra per avançar).
- Es guarda tot per detectar patrons (V3): quins dies solen fallar, correlació son↔gana, etc.

---

## 15. Sistema de gimnàs

### Mantenir la teva rutina actual
- L'app **carrega la teva rutina tal com la fas** (pit+espatlla, cames, esquena+abs, braç, i dia extra pit/esquena).
- No la reescriu. És un **contenidor** de la teva rutina, no un programa nou.
- Setmana flexible: pots reordenar dies arrossegant.

### Registrar progressió
- Per sessió: marcar "Fet" (mínim) o registrar **exercici → pes × reps** de manera ràpida (autocompleta amb l'últim valor).
- Guarda **PRs** i mostra tendència de càrrega per exercici clau.
- Suggeriment lleuger: "l'última sèrie va sortir fàcil → prova +2,5 kg".

### Evitar conflictes amb running/bici/natació (V2)
- Regles simples de programació:
  - **No** posar running dur o bici llarga el dia abans o després de **cames**.
  - Natació és la que menys interfereix amb el gym → bona per dies de descans actiu.
  - Cardio de baixa intensitat es pot fer el mateix dia que tren superior sense problema.
- L'app **avisa** de conflictes i proposa moure sessions, sempre respectant que el volum (gym) és prioritari sobre el triatló fins que decideixis el contrari.

---

## 16. Sistema de triatló (V2, progressiu)

Objectiu final: **1,5 km natació · 40 km bici · 10 km cursa**. S'introdueix **a sobre** del gym, sense sabotejar el volum.

### Running (tens bona base)
- Manteniment amb **1-2 sessions/setmana**: una de ritme/tempo curta i una de rodatge suau.
- Recuperar forma post-viatge gradualment; no cal volum alt perquè els 10 km ja els tens a l'abast.
- Prioritzar sessions **curtes i de qualitat** per no cremar calories que necessites per pujar de pes.

### Bici (principiant)
- Fase 1: **familiaritat i seguretat** (2 sortides curtes/setmana, aprendre canvis, frenar, corbes).
- Fase 2: pujar durada progressivament fins a poder fer 40 km còmode.
- És el **millor cardio per a tu**: baix impacte, cremes menys "car" que corrent i protegeix les cames del gym.

### Natació (principiant, no saps nedar bé)
- Fase 0: **tècnica primer** (idealment classes o vídeos): respiració, flotació, crol bàsic.
- Fase 1: 1-2 sessions curtes/setmana per fer volum de tècnica (25 m repetits amb descans).
- És on més marge de millora tens; comença **abans** perquè és el que més temps requereix aprendre.

### Introduir-ho sense perjudicar el volum
- **Regla d'or:** el triatló no comença de debò fins que la nutrició està sòlida i el pes puja de forma estable.
- Afegir cardio **compensant amb calories**: cada sessió de resistència → l'app suma un snack/batut extra aquell dia.
- Començar amb **2-3 sessions curtes/setmana** de triatló total, no un pla complet.
- Fases: (1) mantenir gym + guanyar pes → (2) afegir tècnica de natació i bici suau → (3) construir volum de triatló quan el pes ja sigui ~72-75 kg.

---

## 17. Sistema de gamificació (madur, no infantil)

- **Ratxes:** dies seguits complint l'objectiu mínim (o el complet). El mode dia difícil **protegeix** la ratxa si fas el mínim. 1 "comodí"/setmana per no trencar-la per un dia dolent.
- **Nivells:** basats en **constància acumulada**, no en xifres de pes (perquè el pes no depèn 100% de tu cada dia). Ex: Nivell 1 "Constant", Nivell 5 "Màquina híbrida".
- **Reptes:** setmanals i concrets ("aquesta setmana: 5 dies arribant a proteïna", "3 batuts calòrics", "prova 2 àpats nous"). Curts i assolibles.
- **Barra de progrés 67 → 75-80 kg:** peça central a Evolució. Basada en **tendència**, amb fites intermèdies (70, 72, 75). Celebra cada fita.
- **Mètrica de constància:** % de dies "prou" en 30 dies. És **l'indicador estrella** — més important que la ratxa, perquè tolera falles i mesura el patró real.

To visual: net, adult, tipus app de fitness premium. Res de personatges ni sons infantils.

---

## 18. Dades que l'app ha de guardar

- **Usuari:** id, nom, edat, alçada, sexe, pes actual, pes objectiu, nivell d'activitat, mode preferit (simple/precís), to del coach, objectiu calòric i de proteïna.
- **Pes:** registres (data, valor, opcional % greix), tendència calculada.
- **Fotos:** progrés (data, url/fitxer local, angle/nota).
- **Àpats (logs):** data, tipus (esmorzar…), estat (fet/substituït/saltat), calories i proteïna aproximades, referència a l'aliment/recepta.
- **Aliments/receptes:** nom, calories, macros, tags (agrada/cansa/ràpid/batut/casolà), passos si és recepta.
- **Preferències:** aliments que agraden, aliments que cansen, restriccions (cap ara), hores de recordatoris.
- **Entrenaments:** sessió (data, tipus gym o triatló), estat, exercicis (pes×reps), PRs, durada.
- **Check-ins:** data, ànim, gana, energia, son, mode suggerit.
- **Recomanacions:** log del que l'app ha proposat i què has acceptat/rebutjat (per aprendre).

---

## 19. Model de dades inicial

```
User {
  id, name, age, heightCm, sex,
  currentWeightKg, targetWeightKg,
  activityLevel,               // sedentary..very_active
  preferredMode,               // "simple" | "precise"
  coachTone,                   // "balanced" | "tough" | "gentle"
  calorieTarget, proteinTarget
}

WeightLog {
  id, userId, date, weightKg, bodyFatPct?, note?
}

Photo {
  id, userId, date, fileUri, angle?, note?
}

Food {                         // aliment o recepta simple
  id, name, kcal, protein, carbs, fat,
  tags: [ "likes" | "tiring" | "quick" | "shake" | "homemade" | ... ],
  isShake: bool, steps?: [string]
}

MealLog {
  id, userId, date, mealType,  // breakfast|lunch|snack|dinner|nightSnack
  status,                      // done | substituted | skipped
  foodId?, kcalApprox, proteinApprox
}

Workout {
  id, userId, date, category,  // gym | run | bike | swim
  subtype,                     // "legs","chest_shoulder",... o "tempo","technique"
  status,                      // done | skipped | moved
  durationMin?, exercises?: [ {name, sets:[{weight,reps}]} ]
}

CheckIn {
  id, userId, date,
  mood,                        // good | ok | low
  appetite,                    // high | normal | low
  energy,                      // high | mid | low
  sleptWell?: bool,
  suggestedMode?               // "normal" | "hard_day" | "rescue"
}

Recommendation {
  id, userId, date, type,      // meal_swap | add_shake | move_workout | calorie_bump
  payload, accepted?: bool
}

Streak {
  userId, currentStreak, longestStreak,
  jokersLeft, level, consistency30d  // %
}
```

---

## 20. Lògica bàsica de recomanacions (pseudocodi)

```
function planificarDia(user, checkIn, historic):
    dia = {}
    dia.gym = rutinaGym[diaDeLaSetmana]          // respecta la seva rutina

    // 1. Mode segons check-in
    if checkIn.mood == "low" or checkIn.appetite == "low":
        dia.mode = "hard_day"
        dia.objectiuKcal = user.calorieTarget * 0.6   // mínim viable
        dia.prioritza = ["shake", "quick"]
    else if checkIn.energy == "low":
        dia.mode = "normal"
        dia.suggerirMoure = true                       // moure cardio dur
    else:
        dia.mode = "normal"
        dia.objectiuKcal = user.calorieTarget

    // 2. Muntar àpats evitant avorriment
    for meal in ["breakfast","lunch","snack","dinner","nightSnack"]:
        candidats = foods.filter(f =>
            not f.tags.includes("tiring") and
            f encaixa amb objectiu de meal)
        dia[meal] = triarVariat(candidats, historic.ultims7dies)

    // 3. Ajust de pes (revisió setmanal)
    tendencia = tendenciaPes(historic.weightLogs, 14dies)
    if tendencia < 0.2 kg/setmana:
        dia.extra = suggerir("add_shake", "+250 kcal al berenar")
    else if tendencia > 0.6 kg/setmana:
        dia.avis = "afinem una mica per no acumular greix"

    // 4. Conflictes triatló <-> gym
    if dia.gym.subtype == "legs" and dia_seguent te "run|bike":
        dia.avis += "mou el cardio 1 dia per recuperar cames"

    // 5. Missatge del coach
    dia.missatge = generarMissatge(checkIn, dia.mode, user.coachTone)

    return dia


function onSubstituteMeal(user, meal, foodRebutjat):
    marcarPreferencia(user, foodRebutjat, "tiring++")   // aprèn
    return triarAlternatives(meal, evita=foodRebutjat, n=3)
```

---

## 21. Arquitectura tècnica

Objectiu: **funcionar a iPhone i a ordinador**, senzill de mantenir, per a un sol usuari primer.

**Recomanació: PWA (Progressive Web App) responsive.**
- Una sola base de codi web que corre al navegador **i s'instal·la a l'iPhone** (afegir a pantalla d'inici) i a l'ordinador.
- Funciona offline (service worker) i envia recordatoris.
- Evita fricció d'App Store i de mantenir apps natives separades.

```
[ PWA React (mòbil + escriptori) ]
            |
   API / lògica (serverless o backend lleuger)
            |
     Base de dades al núvol (per usuari)
            |
  (V3) Serveis IA: visió/OCR + LLM per fotos i coach
```

- **Emmagatzematge:** al núvol perquè es sincronitzi entre iPhone i ordinador (amb caché local per offline).
- **Fase MVP:** pot arrencar fins i tot amb dades locals + backend gestionat (BaaS) per no muntar servidor propi.
- **Notificacions:** Web Push (recordatoris d'àpats i check-in).
- Si algun dia vols App Store nativa, es pot empaquetar la PWA o migrar a React Native reaprofitant molt.

---

## 22. Stack tecnològic inicial (simple)

| Capa | Elecció | Per què |
|------|---------|---------|
| Frontend | **React + Vite + TypeScript**, configurat com a **PWA** | Un sol codi mòbil+PC, ecosistema enorme |
| UI | **Tailwind CSS** + una lib de components (ex. shadcn/ui) | Ràpid, net, professional |
| Backend + BD + Auth | **Supabase** (Postgres + Auth + Storage) o **Firebase** | BaaS: base de dades, fotos i login sense muntar servidor |
| Estat local / offline | Caché local + sync amb el BaaS | Funciona sense connexió |
| Notificacions | Web Push | Recordatoris |
| IA (V3) | API de visió/OCR + un LLM (Claude) | Fotos d'etiquetes + coach conversacional |
| Hosting | Vercel o Netlify | Desplegament d'un clic |

**Consell:** per a l'MVP, **React PWA + Supabase** és el camí de menys fricció. No afegeixis res més fins que ho necessitis de debò.

---

## 23. Roadmap de construcció pas a pas

**Fase 1 — Definició (aquest document).** Concepte, principis, MVP, dades. ✅ Estàs aquí.

**Fase 2 — Wireframes.** Esbossos de baixa fidelitat de les 6 pantalles i del flux diari <3 min. Validar que tot és d'1-2 tocs. Sense colors ni codi.

**Fase 3 — Prototip simple (clicable).** Prototip navegable (Figma o HTML estàtic) amb dades falses. Provar tu mateix el flux d'un dia normal i d'un dia difícil.

**Fase 4 — MVP funcional.** Construir V1 real amb React PWA + Supabase: onboarding, dashboard, nutrició simple + substitucions + rescat, check-in, pes/foto/gràfic, gym bàsic, ratxa + barra, missatges de plantilla. Fer-lo servir cada dia i iterar.

**Fase 5 — Millores amb IA.** Generador de menús, ajust automàtic de calories, mòdul triatló, i finalment foto→recomanació i coach conversacional (V2 → V3).

---

## 24. Exemples de missatges del coach

**Dia normal**
> "Bon dia, Marc. Avui: **pit + espatlla** i objectiu **150 g de proteïna**. Ja saps com va: un pas cada vegada. Marquem el primer àpat?"

**Dia amb poca gana**
> "Poca gana avui? Tranquil. Comencem líquid: **un batut calòric ara** compta molt i quasi no es nota. Després ja veurem el sòlid."

**Dia amb ansietat**
> "Veig que avui portes ansietat. No et demano res gros. **1 àpat fàcil + 1 batut** i la ratxa segueix viva. Estàs fent-ho bé només per aparèixer aquí."

**Dia que he fallat**
> "Ahir no va sortir. Passa. No es recupera menjant el doble avui, es recupera **tornant avui**. Objectiu net d'avui: arribar a proteïna. Va."

**Dia que he complert**
> "Dia rodó ✅ Àpats fets, proteïna clavada i gym completat. Així és com es passa de 67 a 75. Ratxa: 7. Segueix així."

**Dia abans de cames**
> "Demà toca **cames**. Avui carrega bé hidrats i dorm — les cames grosses es fan amb energia i descans, no només amb sèries. Snack extra aquesta nit?"

**Dia de running**
> "Avui **rodatge suau de running**. Curt i controlat: no volem cremar de més. Després, **snack de recompensa** per compensar les calories i seguir pujant."

**Dia que no arribo a calories**
> "Et falten ~400 kcal per tancar el dia. La manera fàcil: **un batut abans de dormir** (llet + plàtan + crema de cacauet). Un got i ho tanquem."

---

## 25. One-page product brief

> **Producte:** Volum (nom de treball)
> **Què és:** PWA personal (iPhone + ordinador) que prioritza la nutrició per ajudar a guanyar pes (67 → 75-80 kg) sense obsessionar-se amb les calories, mantenint el gym i preparant una triatló olímpica futura.
>
> **Per a qui:** noi de 23 anys, prim, amb ansietat que li afecta la gana, que es cansa dels menjars, va al gym 4-5 dies, té bona base de running i vol un físic híbrid — i que històricament abandona.
>
> **Problema:** la fricció i la manca de constància per menjar prou fan que abandoni els plans de volum.
>
> **Proposta de valor:** l'app decideix per tu què menjar i què fer avui, s'adapta els dies dolents i converteix la constància en progrés visible.
>
> **Principis:** nutrició primer · poca fricció · decideix per mi · mode dia difícil · constància > perfecció · <3 min/dia · professional però simple · respecta la meva rutina.
>
> **MVP (V1):** onboarding curt · dashboard "avui toca" · nutrició mode simple + substitucions + mode rescat · check-in diari · pes/foto/gràfic · gym bàsic · ratxa + barra 67→80 kg · missatges de coach.
>
> **Després:** V2 mode precís, menús, ajust de calories, triatló, gamificació ampliada · V3 foto→recomanació amb IA, coach conversacional, integració amb Health.
>
> **Stack:** React + Vite + TypeScript (PWA) · Tailwind · Supabase (BD/Auth/Storage) · Web Push · Vercel · IA (Claude/visió) a V3.
>
> **Mètrica d'èxit número 1:** que **no ho abandonis** — % de dies "prou" en 30 dies i tendència de pes cap amunt.
```
