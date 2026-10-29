# GTM Tycoon — Especificación (SDD)

> Metodología: Spec-Driven Development (Dominicode). Este documento define **qué** se construye y **por qué**. El **cómo** está en `plan.md` y el orden de trabajo (TDD) en `tasks.md`.
> Referencias visuales vinculantes: `VISUAL.md` y `art-bible.html` (en esta misma carpeta).
> Idioma del juego: **inglés** (toda la UI, diálogos y textos). La documentación interna va en español.

---

## 1. Visión

**GTM Tycoon** es un juego de navegador en pixel art ("Apollo en 8 bits") donde el jugador es un vendedor nuevo (SDR/AE) en una startup. Cada partida es una **semana laboral de 5 días**. Cada día el jugador:

1. Recibe la regla del día de **Mariana** (cofundadora).
2. Filtra leads en un arcade (**Pipeline Panic**) en **Inbox Plaza**.
3. Llama a los leads que atrapó en **Clients** con un sistema de "batalla" de pitch por turnos.
4. Cierra el día en la **Office**: resultados, elige 1 de 3 mejoras (las "platform powers") y lee el memo con la **nueva regla** de mañana.

**Objetivo del jugador:** llegar a la cuota semanal (**$40,000** en deals firmados) al terminar el día 5.

**Objetivo de producto:** enseñar, jugando, buenas prácticas de go-to-market: ICP, calidad de datos (rebotes, duplicados), tipos de comprador y cómo la plataforma (Enrich, Intent, Sequence, CRM sync, ICP filter) quita fricción. "Run your day like a system, not a to-do list."

**Fuera de alcance (v1):** multijugador, backend, datos reales, logo o capturas de Apollo, música, guardado en la nube, localización a otros idiomas.

---

## 2. Usuarios

| Persona | Necesidad | Cómo la cubre el juego |
|---|---|---|
| **Vendedor/SDR junior** | Entender ICP, calidad de datos y tipos de comprador sin leer un manual | Reglas que se van sumando día a día; coach con una frase por error |
| **Equipo de marketing/GTM** (cliente interno) | Una pieza jugable con el tono y la paleta de la marca para eventos y onboarding | Respeta la art bible al 100%; flag `BRAND_MODE` para activar la marca cuando haya aprobación |
| **Jugador casual** | Sesión corta (10–15 min) en desktop o móvil | 5 días, cada uno de ~2–3 min; controles de teclado, mouse y táctiles |
| **Jugador con necesidades de accesibilidad** | Jugar sin depender del color ni de animaciones | Todo color va con forma o palabra; respeta `prefers-reduced-motion` y tiene toggle manual |

---

## 3. Funcionalidades

### F1 — Título y guardado
- Pantalla de título (desk layer): título, subtítulo, botones `NEW GAME` y `CONTINUE` (solo si hay partida guardada), toggle `REDUCED MOTION` y `SOUND`.
- Autoguardado en `localStorage` al empezar cada día. Si el almacenamiento falla, el juego sigue funcionando sin guardar.

### F2 — Mapa hub (world layer)
- Una pantalla de 20×14 tiles de 16 px dibujada ×2 (640×448), ciudad cálida monocroma, sin pasto.
- Lugares: **OFFICE** (índigo), **INBOX PLAZA** (buzones volt), **CLIENTS**, **GYM**. Se entra caminando a la puerta.
- El jugador (gorra volt, saco índigo) se mueve por tiles con flechas/WASD o tocando/clicando un destino (pathfinding BFS).
- Barra superior en el canvas: `DAY n · HH:MM AM/PM` y `n LEADS TO CALL`.
- Los leads atrapados aparecen frente a CLIENTS como personas con etiqueta de cargo, o `?` si son desconocidos.
- Mariana está junto a la Office al empezar el día y da la regla en un diálogo.
- El **Rival** (corbata signal) aparece en la calle del día 2 al 5 y ofrece un *pitch-off* una vez por día.
- HUD DOM sobre tinta: hora, `CASH`, `QUOTA`, `DAY`, barra de `ENERGY`.

### F3 — Pipeline Panic (arcade, Inbox Plaza)
- Una ronda por día, **45 s** reales, avanza el reloj **+90 min**.
- Caen íconos de leads; el jugador mueve su bandeja horizontalmente (teclado, mouse o arrastre táctil).
- Atrapar un lead lo juzga contra las **reglas activas**:
  - Bueno → al pipeline, pop-up `GOOD LEAD` (volt), suma combo. Cada 3 seguidos: `x3 COMBO` (+5 energía).
  - Malo → pop-up en signal (`NOT ICP`, `TOO SMALL`, `TOO BIG`, `BOUNCED`, `DUPLICATE`), −10 energía, rompe el combo.
  - No atrapar no penaliza.
- Íconos según la art bible: bolsa volt = tienda online (bueno); banco/fábrica/hospital = fuera de ICP; tamaño del ícono = tamaño de empresa; insignia `!` parpadeante = rebotado; copia fantasma detrás = duplicado; caja `?` = desconocido (se revela a mitad de la caída o de inmediato con Enrich).
- Pop-ups de máximo 3 palabras, en mayúsculas.

### F4 — Llamadas (batalla por turnos, Clients)
- Lista de leads por llamar; elegir uno abre la **tarjeta de batalla**: nombre, cargo, insignia de tipo (`$ VISIONARY`, `# TECHNICAL`, `+ OPERATOR`, `! GATEKEEPER` o `TYPE ???`), `PAT` (paciencia en pips) y barra `RESIST n/48`.
- Cada llamada cuesta **10 de energía** y **+30 min**. Sin energía suficiente no se puede llamar.
- 4 movimientos: `IMPACT`, `DEMO`, `WORKFLOW`, `FIND MANAGER`. Cada uno resta 1 de paciencia.

| Tipo | IMPACT | DEMO | WORKFLOW | FIND MANAGER |
|---|---|---|---|---|
| VISIONARY | fuerte ×2.4 | débil ×0.5 | normal | sin efecto |
| TECHNICAL | débil | fuerte | normal | sin efecto |
| OPERATOR | débil | normal | fuerte | sin efecto |
| GATEKEEPER | débil | débil | débil | te pasa con el decisor (nuevo tipo) |

- Daño base 10 (fuerte = 24, normal = 10, débil = 5; +1 por nivel de Gym, máx. 3). Resistencia 48 (36 si el lead tiene *intent*). Paciencia 4.
- `RESIST` en 0 → `DEAL SIGNED`, suma el valor del deal a cash y cuota. Paciencia en 0 → `NO DEAL`.
- Leads con datos malos que pasaron el filtro: email rebotado → la llamada no conecta (`BOUNCED`); duplicado → `DUPLICATE` (ya lo llamaste). Ambos gastan tiempo y energía.
- El coach comenta cada turno con una frase (VT323): p. ej. *"Executives buy impact. Lead with the number."* / *"A receptionist can't buy. Find the manager."*
- Tipo desconocido (`TYPE ???`): se revela después del primer movimiento.

### F5 — Rival pitch-off
- Batalla contra un prospecto con tipo visible; la barra del rival avanza 12 por turno. Si llega a 48 antes de que tú cierres: `RIVAL SIGNED`. Si cierras primero: deal de $3,000.
- Una vez por día, días 2–5.

### F6 — Gym
- `COACH DRILL`: una vez por día, cuesta 60 min, sube el nivel de pitch (+1 daño, máximo 3). Muestra la tabla de tipos como recordatorio.

### F7 — Cierre del día (desk layer, Office)
- El día termina a las **6:00 PM** o al entrar a la Office y confirmar `END DAY`.
- **Resultados**: frase estilo *"Six deals, two dead ends. Your most common miss: bad data."* + estadísticas (deals, ingresos, leads buenos/malos atrapados, llamadas fallidas).
- **Mejoras**: elegir 1 de 3 cartas (o `SKIP`), con precio; las raras llevan sombra volt. Solo se compran si alcanza el cash.
- **Memo** de Mariana con sello `NEW RULE` que explica la regla de mañana.
- Leads no llamados se pierden al final del día, salvo que tengas **CRM sync**.

### F8 — Platform powers (mejoras)
| Power | Rareza | Precio | Efecto |
|---|---|---|---|
| ENRICH | rare | $4K | Revela cajas `?` y tipos de comprador desde el inicio |
| INTENT SIGNAL | rare | $4K | Los leads con intención brillan (arcade/mapa) y van primero en la lista |
| SEQUENCE | common | $2K | Un lead que se queda sin paciencia vuelve una vez como `FOLLOW-UP` |
| CRM SYNC | common | $2K | Los leads no llamados pasan al día siguiente |
| ICP FILTER | common | $2K | Los leads fuera de ICP/tamaño se ven atenuados y atraparlos no cuesta energía |
| COFFEE | common | $1K | +20 energía máxima |
| CALL SCRIPT | rare | $3K | +1 paciencia en todas las llamadas |

Íconos pixel genéricos con marco volt. `BRAND_MODE=false` por defecto; no se usa el logo ni el nombre "Apollo" en el juego ("the platform").

### F9 — Progresión de reglas (5 días)
| Día | Reglas activas al atrapar | Qué aparece nuevo |
|---|---|---|
| 1 | Industria (solo tiendas online) + tamaño (50–500) | Bancos, fábricas, hospitales, empresas diminutas y gigantes |
| 2 | igual | Cajas `?` (leads desconocidos) |
| 3 | igual | Gatekeepers en llamadas; empiezan a aparecer rebotados y duplicados (aún sin regla) |
| 4 | + datos limpios (sin rebotados ni duplicados) | — |
| 5 | todas | Caída 30% más rápida; último día |

### F10 — Final
- Tras el día 5: reporte final (desk layer) con ingresos vs cuota, `QUOTA HIT` o `QUOTA MISSED`, calificación (S/A/B/C) y `PLAY AGAIN`.

---

## 4. Flujos

### Flujo principal (un día)
```
Title ─▶ Map (Mariana: regla del día) ─▶ Inbox Plaza ─▶ Pipeline Panic (45s, +90 min)
   ▲                                                         │
   │                                                         ▼
   │                         Map ◀──────────────── leads al pipeline
   │                          │
   │      ┌───────────────────┼──────────────────┐
   │      ▼                   ▼                  ▼
   │   Clients (llamadas)   Gym (drill)     Rival (pitch-off)
   │      │                   │                  │
   │      └─────────▶ Map ◀───┴──────────────────┘
   │                   │  (6:00 PM o END DAY en Office)
   │                   ▼
   │   Results ─▶ Upgrades (1 de 3) ─▶ Memo (NEW RULE) ─┐
   └──────────────────── día < 5 ◀───────────────────────┘
                         día = 5 ─▶ Final report ─▶ Title
```

### Flujo de llamada
1. Elegir lead → validar energía ≥ 10 → −10 energía, +30 min.
2. Si el email rebotó o es duplicado → mensaje y fin (dead end).
3. Turnos: elegir movimiento → daño según tabla → paciencia −1 → coach comenta.
4. `RESIST` 0 → deal firmado. Paciencia 0 → sin deal (o FOLLOW-UP con Sequence).

### Casos borde
- Entrar a Inbox Plaza por segunda vez en el día → diálogo "Inbox is clear. Go call your leads."
- Sin energía → "You're out of energy. Wrap the day at the Office."
- Reloj llega a 6:00 PM en medio de una llamada → la llamada termina y luego cierra el día.
- Sin cash para ninguna carta → solo `SKIP` habilitado.
- `localStorage` bloqueado → el juego funciona, `CONTINUE` no aparece.

---

## 5. Arquitectura

- **Stack:** HTML5 + CSS3 + JavaScript vanilla con ES modules. Sin frameworks ni build. Deploy estático (Netlify/GitHub Pages).
- **Separación lógica / render:** toda la lógica del juego (reglas, leads, batalla, reloj, economía, mejoras, mapa/pathfinding, guardado, arcade) vive en módulos **puros** sin DOM, testeables con `node --test`. Las escenas solo leen/escriben el estado y dibujan.
- **Capas visuales:** *World* en `<canvas>` (mapa, arcade) + DOM pixel (HUD, diálogo, batalla); *Desk* en DOM (título, resultados, cartas, memo, final).
- **Sprites procedurales:** portados de `art-bible.html` (cuadrícula 24×30, íconos de leads, íconos de powers).
- **Aleatoriedad determinista:** RNG con semilla (mulberry32) por partida + día, para que los tests sean reproducibles.
- **Escenas** con interfaz común `enter / update(dt) / render / exit` gestionadas por un `SceneManager`.

---

## 6. Requisitos no funcionales (NFRs)

| ID | Requisito |
|---|---|
| NFR1 | **Paleta estricta**: solo los 8 tokens + 3 tonos de piel. Sin gradientes, sin sombras suaves, sin grises fríos. Sombras duras de 4 px. |
| NFR2 | **Volt** solo para bueno/activo/listo; **signal** solo para errores. Todo color acompañado de forma o palabra. |
| NFR3 | Tipografías: Press Start 2P (HUD, botones, pop-ups, ≤3 palabras en arcade), VT323 (diálogos, una frase por caja), Fraunces 550 + Hanken Grotesk (desk layer). |
| NFR4 | Animaciones en `steps()` / por frames. Con reduced motion: sin sacudidas, sin parpadeos, sin flash. |
| NFR5 | 60 FPS en un laptop promedio; canvas con `image-rendering: pixelated` y `imageSmoothingEnabled=false`. |
| NFR6 | Responsivo: jugable desde 360 px de ancho, sin scroll horizontal; controles táctiles para todo. |
| NFR7 | Accesible con teclado (Tab/Enter/Espacio/flechas/Esc) y foco visible. |
| NFR8 | Sin dependencias de runtime ni backend. Carga < 200 KB sin fuentes. |
| NFR9 | Sin contenido de Pokémon (nombres, criaturas, bolas, pasto alto, sonidos, pantallas), sin logo/símbolo/capturas de Apollo, sin datos reales: todas las empresas y personas son ficticias. |
| NFR10 | Voz: corta, directa, segura; sin signos de exclamación de hype; nunca culpa al jugador. |
| NFR11 | Cobertura: toda la lógica pura con tests unitarios (`node --test`), en verde antes de cada commit. |
