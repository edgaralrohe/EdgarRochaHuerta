# GTM Tycoon — Tareas (TDD)

Regla: para cada módulo de `core/` primero el test (🔴), luego la implementación mínima (🟢), luego refactor (🔵). Nada de UI hasta que el core esté en verde.

## Fase 0 — Spec
- [x] T0.1 `spec.md` (6 secciones)
- [x] T0.2 `plan.md`
- [x] T0.3 `tasks.md`

## Fase 1 — Núcleo determinista
- [x] T1.1 🔴 `tests/rng.test.js`: misma semilla → misma secuencia; `int` dentro de rango; `pick` devuelve elementos del array
- [x] T1.2 🟢 `src/core/rng.js`
- [x] T1.3 🔴 `tests/clock.test.js`: `formatClock(540)="09:00 AM"`, `formatClock(780)="01:00 PM"`, `isDayOver` a las 6:00 PM
- [x] T1.4 🟢 `src/core/clock.js`
- [x] T1.5 🔴 `tests/days.test.js`: día 1 reglas `industry+size`; día 4 añade `data`; mystery desde día 2; gatekeepers desde día 3; memo con `rule` en días 1–4 y null en día 5
- [x] T1.6 🟢 `src/core/config.js`, `src/core/days.js`

## Fase 2 — Leads
- [x] T2.1 🔴 `tests/leads.test.js`: `judgeLead` → `NOT ICP`, `TOO SMALL`, `TOO BIG`, `BOUNCED`, `DUPLICATE`, `GOOD LEAD`; reglas inactivas no castigan; `generateLeads` determinista; día 1 sin mystery ni datos malos; día 4 puede tener rebotados/duplicados; duplicado apunta a un id existente; todo lead tiene comprador con tipo válido; gatekeepers solo desde día 3
- [x] T2.2 🟢 `src/core/names.js`, `src/core/leads.js`

## Fase 3 — Batalla
- [x] T3.1 🔴 `tests/battle.test.js`: tabla de efectividad; fuerte gana en 2 turnos; paciencia 0 → `lost`; `FIND MANAGER` en gatekeeper cambia tipo; en no-gatekeeper no hace daño; intent baja resistencia a 36; ENRICH revela tipo; tipo oculto se revela tras el primer movimiento; CALL SCRIPT +1 paciencia; rival gana si su barra llega a 48; nivel de pitch suma daño
- [x] T3.2 🟢 `src/core/battle.js`

## Fase 4 — Mejoras y estado de juego
- [x] T4.1 🔴 `tests/upgrades.test.js`: oferta de 3 sin repetir ni poseídas; compra descuenta cash; sin cash → `ok:false`; COFFEE sube energía máxima
- [x] T4.2 🟢 `src/core/upgrades.js`
- [x] T4.3 🔴 `tests/game.test.js`: `newGame` valores iniciales; `recordCatch` bueno → pipeline, malo → −10 energía (0 con ICP FILTER en bad fit); combo cada 3 → +5; `beginCall` sin energía falla; rebotado → dead end; `resolveCall('won')` suma cash y revenue; `endDay` pierde pipeline sin CRM y lo conserva con CRM; `summarizeDay` produce frase con palabras numéricas y miss más común; `finalReport` grade
- [x] T4.4 🟢 `src/core/game.js`

## Fase 5 — Arcade, mapa y guardado
- [x] T5.1 🔴 `tests/arcade.test.js`: los leads caen; atrapar emite `catch` con juicio; no atrapar no emite catch; mystery se revela al 40% o al instante con ENRICH; termina al acabar el tiempo
- [x] T5.2 🟢 `src/core/arcade.js`
- [x] T5.3 🔴 `tests/map.test.js`: edificios no caminables; puertas sí y `doorAt` correcto; `findPath` llega a cada puerta desde el inicio; null si no hay camino
- [x] T5.4 🟢 `src/core/map.js`
- [x] T5.5 🔴 `tests/save.test.js`: ida y vuelta; storage roto no lanza; JSON corrupto → null
- [x] T5.6 🟢 `src/core/save.js`
- [x] T5.7 🔴 `tests/sprites.test.js`: `personGrid` 24×30, gorra volt (`p`) para `cap`, silueta `u` + `?` para desconocido
- [x] T5.8 🟢 `src/render/sprites.js`

## Fase 6 — Presentación
- [x] T6.1 `index.html` + `styles.css` (tokens, HUD, diálogo, batalla, botones, memo, cartas, reduced motion)
- [x] T6.2 `input.js`, `audio.js`, `settings.js`, `ui.js`
- [x] T6.3 `mapRender.js` + escena `map` (movimiento, puertas, NPCs, clic para caminar)
- [x] T6.4 Escena `arcade` (Pipeline Panic)
- [x] T6.5 Escena `battle` (llamadas y rival) + lista de Clients + Gym
- [x] T6.6 Escena `office` (resultados → cartas → memo) y `final`
- [x] T6.7 Escena `title` + guardado/continuar
- [x] T6.8 `main.js` (SceneManager + loop)

## Fase 7 — Verificación
- [x] T7.1 `npm test` en verde
- [x] T7.2 Smoke test en navegador headless (Playwright): sin errores de consola, jugar un día completo, capturas de mapa, arcade, batalla y memo
- [x] T7.3 Revisión contra checklist Sí/No de la art bible
- [x] T7.4 `README.md` del juego (cómo jugar, cómo correr, cómo testear)

## Fase 8 — Revisión v1.1 (feedback de la guía visual)
- [x] T8.1 Corbata del Rival en índigo; cruz del hospital marble sobre graphite (signal solo errores)
- [x] T8.2 Volt solo en lo usable: letreros y buzones dinámicos, sin ventanas volt, etiquetas en marble
- [x] T8.3 `=` para gatekeeper / FIND MANAGER; `!` solo rebotado; Mariana con nombre
- [x] T8.4 Foco tinta en la desk layer; volt nunca como texto sobre crema
- [x] T8.5 Etiquetas del mapa a 8 px lógicos; tags de cargo de ≤3 letras (test)
- [x] T8.6 Power renombrado a INTENT
- [x] T8.7 Anexo de reglas, audio, animación, controles e idioma en la spec
- [x] T8.8 Cuota $50K y valores de deal rebalanceados con simulación
