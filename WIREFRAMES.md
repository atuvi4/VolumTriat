# Wireframes — Volum (Fase 2)

> Baixa fidelitat, mobile-first (iPhone). Sense colors ni estil final.
> Principi guia: **"empeny el resultat, no la persona"** — agressiu en calories fàcils, suau en exigència diària.
> Regla: el **Mode agressiu** (surplus alt) MAI desactiva el **Mode dia difícil**.

Llegenda: `[ Botó ]` · `( ◯ toggle )` · `▓▓░░ barra` · `» acció`

---

## 0 · Onboarding (5 pantalles ràpides, 1 toc cadascuna)

```
┌───────────────────────────┐   ┌───────────────────────────┐
│  Volum                     │   │  El teu objectiu           │
│                            │   │                            │
│  Anem a pujar de pes       │   │  Pes ara:   [ 67 ] kg      │
│  sense que t'obsessioni.   │   │  Objectiu:  [ 78 ] kg      │
│                            │   │                            │
│  Trigarem 1 min a          │   │  Ritme:                    │
│  configurar-ho.            │   │  ( ) Tranquil              │
│                            │   │  (•) Agressiu  ← recomanat │
│         [ Començar » ]     │   │                            │
└───────────────────────────┘   │         [ Següent » ]      │
                                 └───────────────────────────┘
┌───────────────────────────┐   ┌───────────────────────────┐
│  Què t'agrada menjar?      │   │  La teva rutina de gym     │
│  (toca per afegir)         │   │                            │
│  [pollastre][arròs][ou]    │   │  Dill  [ Pit + espatlla ] │
│  [pasta][batut][plàtan]    │   │  Dim   [ Cames         ]  │
│  [+ afegir]                │   │  Dic   [ Esquena + abs ]  │
│                            │   │  Dij   [ Braç          ]  │
│  Què et cansa? 🚫          │   │  Div   [ Lliure / extra ] │
│  [+ afegir]                │   │                            │
│         [ Següent » ]      │   │      [ Ja està, entra » ] │
└───────────────────────────┘   └───────────────────────────┘
```

---

## 1 · Dashboard d'avui (pantalla mare)

```
┌─────────────────────────────────┐
│  Bon dia, Marc 💪    🔥 6 dies   │
│                                  │
│  ┌───────────────────────────┐  │
│  │  AVUI TOCA                │  │
│  │  🏋️ Cames                  │  │
│  │  🍽️ 150 g proteïna         │  │
│  │  🌙 Snack abans de dormir  │  │
│  └───────────────────────────┘  │
│                                  │
│   Proteïna   ◯ 90/150 g          │
│   ▓▓▓▓▓▓░░░░                     │
│   Àpats      ▓▓▓░░  3/5          │
│                                  │
│  [ Marcar àpat ]  [ Check-in ]   │
│                                  │
│  ┌───────────────────────────┐  │
│  │ 😟 Dia difícil? Toca aquí │  │
│  └───────────────────────────┘  │
│                                  │
│ ─────────────────────────────── │
│  🏠   🍽️   🏋️   📈   💬        │
│ Avui  Nutri Gym  Evol Coach     │
└─────────────────────────────────┘
```
- El bloc "AVUI TOCA" = la frase única que demanaves.
- El botó "Dia difícil" sempre visible, encara que estiguis en Mode agressiu.
- Barra inferior = navegació a les 6 seccions.

---

## 2 · Nutrició (mode simple, per defecte)

```
┌─────────────────────────────────┐
│  Nutrició          Simple (•)◯Precís│
│  Objectiu avui: ~3.000 kcal · 150g P│
│  ▓▓▓▓▓▓░░░░  1.850 / 3.000       │
│                                  │
│  ✅ Esmorzar  ·  fet             │
│  ✅ Dinar     ·  fet             │
│  ▶ Berenar (proposta)           │
│    ┌─────────────────────────┐  │
│    │ Iogurt + civada + mel   │  │
│    │ + crema cacauet         │  │
│    │ ≈ 550 kcal · 25 g P     │  │
│    │ [ Fet ] [ Canvia'm 🔄 ] │  │
│    │        [ No em ve 🚫 ]  │  │
│    └─────────────────────────┘  │
│  ◻ Sopar (proposta)             │
│  ◻ Snack nocturn 🌙             │
│                                  │
│  [ 🥤 Afegir batut ]  [ Rescat ]│
└─────────────────────────────────┘
```

**En tocar "Canvia'm 🔄":**
```
┌─────────────────────────────────┐
│  Alternatives (mateixes kcal)   │
│  1. Batut plàtan+civada  550·22g│  [ Tria ]
│  2. Entrepà pernil+formatge 560 │  [ Tria ]
│  3. Tonyina + pa + oli   540·30g│  [ Tria ]
│  ↳ evito el que et cansa         │
└─────────────────────────────────┘
```
- "No em ve 🚫" → l'app aprèn i proposa aquell aliment menys.
- Toggle Simple/Precís a dalt a la dreta (Precís = V2, mostra macros editables).

---

## 3 · Entrenament

```
┌─────────────────────────────────┐
│  Entrenament                     │
│  Aquesta setmana                 │
│                                  │
│  Dill ✅ Pit + espatlla          │
│  Dim  ▶ Cames        ← avui     │
│  Dic  ◻ Esquena + abs           │
│  Dij  ◻ Braç                    │
│  Div  ◻ Lliure                  │
│                                  │
│  ┌── AVUI: Cames ──────────┐    │
│  │ [ Sessió feta ✓ ]       │    │
│  │ Registrar (opcional):   │    │
│  │  Sentadilla  [__]kg [__]│    │
│  │  Premsa      [__]kg [__]│    │
│  │  + afegir exercici      │    │
│  └─────────────────────────┘    │
│                                  │
│  🏊 Triatló (V2)  ▸ desactivat  │
│  ⚠️ Demà runing? Millor no      │
│     després de cames.           │
└─────────────────────────────────┘
```
- Mínim esforç = només "Sessió feta ✓". El registre de sèries és opcional i autocompleta l'últim pes.

---

## 4 · Evolució

```
┌─────────────────────────────────┐
│  Evolució                        │
│                                  │
│  67 ▓▓▓▓▓▓▓░░░░░░░ 78  ← 69,1 kg │
│  Fita propera: 70 kg (falta 0,9)│
│                                  │
│  Pes (tendència)                 │
│    ·   ·                         │
│      · · ·  ╱                    │
│    · · · ·╱   +0,4 kg/setm ✅   │
│  └──────────────────────────    │
│                                  │
│  Constància 30d:  ▓▓▓▓▓▓▓▓░ 83% │
│                                  │
│  📷 Fotos                        │
│  [ setm 1 ][ setm 4 ][ + nova ] │
│                                  │
│  [ + Afegir pes ]  [ + Foto ]   │
└─────────────────────────────────┘
```
- Es mostra la **tendència**, no el pes diari (evita rallar-se pels alts i baixos).
- Fita propera sempre a prop → sensació de canvi ràpid.

---

## 5 · Coach / assistent

```
┌─────────────────────────────────┐
│  Coach                     💬    │
│                                  │
│  ┌───────────────────────────┐  │
│  │ Veig que avui vas baix i   │  │
│  │ sense gana. Cap problema.  │  │
│  │ Mínim d'avui: 1 batut +    │  │
│  │ 1 àpat. La ratxa segueix.  │  │
│  └───────────────────────────┘  │
│                                  │
│  Accions ràpides:                │
│  [ Fer-me el batut ara ]         │
│  [ Passar a mode fàcil ]         │
│  [ Què faig ara? ]               │
│                                  │
│  (V3) Escriu-li:  [________] »   │
└─────────────────────────────────┘
```
- V1 = missatges de plantilla segons check-in i dades.
- V3 = camp de xat amb IA (gris/desactivat de moment).

---

## 6 · Configuració

```
┌─────────────────────────────────┐
│  Configuració                    │
│                                  │
│  Objectiu         67 → 78 kg  ›  │
│  Ritme            Agressiu    ›  │
│  Mode nutrició    Simple      ›  │
│  To del coach     Equilibrat  ›  │
│                                  │
│  Aliments que m'agraden       ›  │
│  Aliments que em cansen 🚫    ›  │
│                                  │
│  Recordatoris                 ›  │
│   · Esmorzar 09:00               │
│   · Batut nocturn 22:00          │
│                                  │
│  Rutina de gym                ›  │
│  Còpia de seguretat / exportar › │
└─────────────────────────────────┘
```

---

## Flux diari <3 min (recorregut sobre els wireframes)

```
Matí   → Dashboard → [Check-in] (3 tocs) ................ 30s
Àpats  → Nutrició → [Fet] o [Canvia'm] per àpat ......... 10s x àpat
Gym    → Entrenament → [Sessió feta ✓] ................. 15s
Nit    → Dashboard → confirmar snack 🌙 + mirar ratxa ... 30s
                                            TOTAL ≈ 2 min
```

---

## Nota d'adaptació a ordinador (responsive)

En pantalla gran, la barra inferior passa a **menú lateral esquerre**, i el Dashboard mostra 2-3 columnes (Avui + Nutrició + Evolució de cop). Mateixes accions, més visibles alhora. Cap funció nova: només aprofita l'espai.
```
