# GTM Tycoon — Plan técnico

Implementa `spec.md`. Respeta `VISUAL.md` / `art-bible.html`.

## Decisiones

| Decisión | Elección | Por qué |
|---|---|---|
| Lenguaje | JavaScript vanilla, ES modules | Es el stack del autor; sin build, deploy estático directo |
| Render mundo | `<canvas>` 640×448 (320×224 lógicos ×2) | Coincide con la art bible (20×14 tiles de 16 px ×2) |
| Render UI | DOM + CSS con tokens de la paleta | Texto nítido, accesible y con foco de teclado |
| Tests | `node --test` (incluido en Node ≥18) | Cero dependencias |
| Aleatoriedad | mulberry32 con semilla | Partidas y tests reproducibles |
| Estado | Un objeto plano serializable (`state`) | Guardado trivial en `localStorage` |
| Sonido | WebAudio con ondas cuadradas originales (blips) | Nada de sonidos de terceros; se puede silenciar |

## Estructura

```
gtm-tycoon/
├─ index.html            # contenedor, fuentes, HUD, capas DOM
├─ styles.css            # tokens + kit de UI de la art bible
├─ package.json          # "test": "node --test tests/"
├─ specs/                # spec.md, plan.md, tasks.md, VISUAL.md, art-bible.html
├─ src/
│  ├─ core/              # LÓGICA PURA (sin DOM) — 100% testeada
│  │  ├─ config.js       # paleta, constantes de balance, BRAND_MODE
│  │  ├─ rng.js          # createRng(seed), hashSeed(...)
│  │  ├─ days.js         # dayConfig(day): reglas, spawns, línea de Mariana, memo
│  │  ├─ names.js        # empresas y personas ficticias
│  │  ├─ leads.js        # generateLeads, judgeLead, isBadFit
│  │  ├─ clock.js        # formatClock, advanceClock, isDayOver
│  │  ├─ battle.js       # createBattle, effectiveness, applyMove
│  │  ├─ upgrades.js     # UPGRADES, offerUpgrades, buyUpgrade, hasPower
│  │  ├─ game.js         # newGame, startDay, recordCatch, beginCall, resolveCall, endDay, finalReport, summarizeDay
│  │  ├─ arcade.js       # createArcade, stepArcade (simulación de Pipeline Panic)
│  │  ├─ map.js          # tiles, edificios, puertas, isWalkable, findPath (BFS)
│  │  └─ save.js         # saveGame, loadGame, clearSave (storage inyectable)
│  ├─ render/
│  │  ├─ sprites.js      # personGrid (puro), drawPerson, leadIcon, powerIcon (canvas)
│  │  └─ mapRender.js    # ciudad, edificios, árboles, gente, HUD del canvas
│  ├─ scenes/            # title, map, arcade, battle, office (results/upgrades/memo), final
│  ├─ ui.js              # diálogo con pestaña, botones pixel, pantallas desk
│  ├─ input.js           # teclado + puntero + táctil
│  ├─ audio.js           # blips
│  ├─ settings.js        # reduced motion (media query + toggle), sonido
│  └─ main.js            # bootstrap, SceneManager, loop rAF
└─ tests/                # *.test.js por módulo de core + personGrid
```

## Contratos principales (core)

```js
// rng.js
createRng(seed) -> { next(): number[0,1), int(min,max), pick(arr), chance(p) }
hashSeed(...parts) -> uint32

// days.js
dayConfig(day) -> { day, rules: string[], mystery, badData, gatekeepers, speed,
                    leadCount, morningLine, memo: { title, body, rule } | null }

// leads.js
generateLeads(rng, day, count?) -> Lead[]
// Lead = { id, company, industry:'store'|'bank'|'factory'|'hospital',
//          size:'tiny'|'mid'|'giant', employees, bounced, dupeOf, mystery, intent,
//          value, buyer:{ name, title, type, skin, hair, shirt } }
judgeLead(lead, rules) -> { ok, label, reason: 'fit'|'data'|null }
isBadFit(lead) -> boolean

// clock.js
formatClock(minutes) -> "09:40 AM"
advanceClock(state, minutes) -> state.minutes
isDayOver(state) -> boolean

// battle.js
MOVES = ['IMPACT','DEMO','WORKFLOW','FIND MANAGER']
effectiveness(type, move) -> 2 | 1 | 0.5 | 0 | 'transfer'
createBattle({ lead, powers, pitchLevel, rival, rng }) -> Battle
applyMove(battle, move) -> { damage, effect, coach, outcome|null, revealed }

// upgrades.js
UPGRADES: { id, name, rarity, cost, desc }[]
offerUpgrades(rng, owned) -> id[3]
buyUpgrade(state, id) -> { ok, reason }
hasPower(state, id) -> boolean

// game.js
newGame(seed) -> State
startDay(state) -> State
recordCatch(state, lead, judgement) -> { energyDelta }
canCall(state) -> { ok, reason }
beginCall(state, leadId) -> { ok, reason, deadEnd: null|'BOUNCED'|'DUPLICATE' }
resolveCall(state, leadId, outcome) -> void   // 'won'|'lost'|'followup'
endDay(state) -> { summary, stats, lostLeads }
summarizeDay(stats) -> string
finalReport(state) -> { revenue, quota, hit, grade }

// arcade.js
createArcade({ leads, rules, powers, speed, duration }) -> Arcade
stepArcade(arcade, dt, { x }) -> Event[]   // {type:'catch', lead, judgement} | {type:'reveal'} | {type:'end'}

// map.js
MAP_W, MAP_H, BUILDINGS, TREES, DOORS
isWalkable(x, y, blocked?) -> boolean
doorAt(x, y) -> 'office'|'inbox'|'clients'|'gym'|null
findPath(from, to, blocked?) -> [{x,y}...] | null
```

## Escenas

| Escena | Capa | Entra desde | Sale a |
|---|---|---|---|
| `title` | desk | inicio / final | `map` |
| `map` | world | title, arcade, battle, office | arcade, clients (lista DOM), battle, gym (DOM), office |
| `arcade` | world (canvas) | puerta Inbox | `map` |
| `battle` | world (DOM sobre canvas) | lista de Clients / Rival | `map` |
| `office` | desk | puerta Office o 6:00 PM | `map` (día siguiente) o `final` |
| `final` | desk | office día 5 | `title` |

## Riesgos y mitigación
- **ES modules no cargan con `file://`** → se documenta servir con `npx serve` o `python3 -m http.server`; en Netlify funciona directo.
- **Fuentes de Google tardan** → fallback monospace y redibujo del canvas en `document.fonts.ready`.
- **Balance** → constantes centralizadas en `config.js`; tests fijan las reglas (no los números exactos de diversión).
