# Project75 — Prototip local (v0.3)

*Nutrition-first hybrid coach* · usuari: **Tuvi**

App personal per **guanyar pes de forma agressiva però sostenible** (67 → 75-80 kg), amb la nutrició com a prioritat, mantenint el gym i preparant una triatló olímpica a poc a poc.

Aquest és un **prototip de validació**: HTML + CSS + JavaScript purs, **sense frameworks ni backend**. Serveix per provar-lo uns dies i decidir si de veritat motiva i és fàcil, abans d'invertir en un MVP real (React + Supabase).

Versió v0.3: **redisseny visual premium** — sistema de disseny propi, tipografia Inter, icones SVG (gairebé sense emojis), paleta teal profund i jerarquia de "centre de comandament".

---

## Fitxers

| Fitxer | Què és |
|--------|--------|
| `index.html` | Estructura de les 6 pantalles i la navegació |
| `styles.css` | Tot l'estil (tema clar, responsive desktop + mobile) |
| `app.js` | Lògica, dades fictícies i **persistència amb localStorage** |
| `README.md` | Aquest document |
| `ESBOS_PRODUCTE.md` | Document de definició de producte (Fase 1) |
| `WIREFRAMES.md` | Wireframes en text (Fase 2) |

---

## Com obrir-lo a l'ordinador

1. Obre la carpeta `VolumTriat`.
2. Doble clic a **`index.html`** → s'obre al navegador (Chrome, Edge, Safari…).
3. Ja està. No cal instal·lar res.

> Es veu amb **menú lateral** i, quan hi cap, targetes en dues columnes.

## Com provar-lo en mode mòbil

**Opció A — simular al mateix ordinador:**
- Encongeix la finestra del navegador fins que sigui estreta → la interfície canvia sola a **navegació inferior** i botons grans.
- O obre les DevTools (`F12`) → icona de mòbil (*Toggle device toolbar*) → tria "iPhone".

**Opció B — al teu iPhone de veritat:**
- Passa't els 3 fitxers (`index.html`, `styles.css`, `app.js`) per AirDrop/correu/WhatsApp, mantén-los a la mateixa carpeta i obre `index.html` amb Safari.
- Per fer-lo servir com una app: Safari → *Compartir* → **Afegir a pantalla d'inici**.

> Nota: les dades es guarden **al navegador on l'uses** (ordinador i mòbil no es sincronitzen encara; això arriba amb el backend).

---

## Interaccions que FUNCIONEN (i es guarden)

Tot el següent persisteix en refrescar la pàgina (localStorage). Cada nou dia, els àpats i el check-in es reinicien; el pes i la ratxa es mantenen.

- **Dashboard "Avui"**
  - "Avui toca…" segons el dia de la setmana (gym / running / bici / natació).
  - **Prioritat del dia** i **estat**: Agressiu sostenible / Poca gana / Dia difícil.
  - Barres de proteïna, àpats i calories que s'actualitzen soles.
  - Missatge de **coach** que canvia segons el teu progrés i el mode.
  - Botó **Dia difícil** (redueix l'objectiu al mínim i canvia el to).
- **Nutrició**
  - Objectius visibles en mode simple (àpats, proteïna, batut, calories) — no només kcal.
  - Targetes d'àpat amb **Fet**, **Canvia'm 🔄** (alternatives amb mateixes calories), **No em ve 🚫** (l'app "aprèn" i ho evita).
  - **Afegir batut** i **Rescat** per sumar calories fàcils.
  - Mode **Poca gana** (prioritza líquids, baixa una mica l'exigència).
  - **Recomanació automàtica** quan et falten calories per tancar el dia.
- **Entrenament**
  - Setmana completa (gym + running + bici + natació inicial).
  - **Sessió feta** i avís de conflicte cames ↔ cardio.
- **Evolució**
  - Barra **67 → 75 kg** amb fites **68 / 70 / 72 / 75** (i 80 com a meta final).
  - Missatge motivador **basat en tendència** (kg/setmana), no en el pes d'un dia.
  - **+ Afegir pes** mou la barra i el gràfic.
- **Check-in** (3 tocs) → si dius ànim baix o poca gana, ajusta el mode sol.
- **Ratxa** que puja quan completes el dia.
- **Configuració → Reiniciar** per esborrar-ho tot i tornar a començar.

---

## Què encara NO fa (a propòsit)

- No hi ha comptes ni sincronització entre dispositius.
- No hi ha base de dades real ni servidor.
- El mode "Precís" (macros editables) i el xat d'IA són marcadors visuals (V2/V3).
- Foto → recomanació encara no existeix.
- Els menús no es generen amb IA; són dades fictícies amb substitucions manuals.

---

## Què falta abans de passar a l'MVP real

1. Confirmar que el flux diari et resulta **fàcil i motivador** (checklist de sota).
2. Decidir textos i to definitius del coach.
3. Tancar objectius nutricionals reals (kcal/proteïna) amb números teus.
4. Migrar a **React + Supabase** per: guardar de veritat, sincronitzar iPhone ↔ ordinador, login, i notificacions.

---

## Decisions de producte JA validades

- **Nutrició primer** com a eix de tot.
- **Mode simple per defecte** (marcar àpats, no comptar grams).
- **Substitucions** i **"no em ve de gust"** per combatre l'avorriment.
- **Mode dia difícil / poca gana / rescat** per no abandonar en dies dolents.
- **"Empeny el resultat, no la persona"**: agressiu en calories fàcils (batuts), suau en exigència.
- **Constància > perfecció** i progrés per **tendència**, no per pes diari.
- **PWA responsive** (mòbil com a eina principal, ordinador per provar).

---

## Checklist de validació (usa'l 3-5 dies)

Marca cada dia i apunta sensacions. L'objectiu és detectar **fricció** i **motivació**.

**Cada dia:**
- [ ] Obrir l'app i entendre "què toca avui" en <10 segons.
- [ ] Marcar els àpats a mesura que menges (és ràpid? fa mandra?).
- [ ] Usar "Canvia'm" o "No em ve" almenys un cop (t'ajuda amb l'avorriment?).
- [ ] Afegir un batut quan faltin calories (t'ho posa fàcil?).
- [ ] Fer el check-in (3 tocs) i veure si el to del coach t'encaixa.
- [ ] Marcar la sessió d'entrenament.

**Un cop durant els dies:**
- [ ] Provar el **Mode dia difícil** un dia baix i veure si et treu pressió.
- [ ] Provar el **Mode poca gana** i valorar si les opcions líquides t'ajuden.
- [ ] Afegir pes 1-2 cops i mirar si la barra + tendència et motiven.
- [ ] Provar-lo al **mòbil** i a l'**ordinador**.

**Preguntes per respondre al final:**
- [ ] Em roba menys de 3 minuts al dia? (sí/no)
- [ ] Alguna pantalla em fa mandra o em sobra?
- [ ] El to del coach: massa tou, massa dur o just?
- [ ] Què m'ha faltat que hauria fet servir?
- [ ] Després de 3-5 dies, tinc ganes de seguir obrint-la? (la pregunta clau)

> Apunta les respostes i, amb això, ajustem abans de construir l'MVP real.
