# GTM Tycoon: dirección visual (v1)

Referencia viva: `art-bible.html` (abrir en navegador). Este archivo resume las reglas para Claude Code.

## Concepto
"Apollo en 8 bits": un mundo pixel cálido y casi monocromo, con un solo amarillo (volt) que se enciende cuando algo es bueno, está activo o está listo. El color se raciona para que los momentos importantes brillen, igual que en la marca Apollo.

## Dos capas
- **World layer** (mapa, arcade, batallas, HUD, diálogos): fuente pixel, paleta de 8 colores, bordes duros, animación en `steps()`.
- **Desk layer** (memos, resultados, cartas de mejora, directorio de personas, textos del título): serif editorial + sans sobre papel crema, como un documento de Apollo. El pixel art solo aparece como inserto.

## Paleta (tokens)
```css
--marble:#f7f5f2;    /* papel, texto sobre oscuro            (Apollo) */
--limestone:#ccc9c6; /* calles, siluetas, barras vacías      (Apollo) */
--pebble:#736f6c;    /* texto secundario, sombreado          (Apollo) */
--graphite:#47423d;  /* edificios, árboles                   (Apollo) */
--ink:#1a1a1a;       /* contornos, fondo del mundo           (Apollo) */
--indigo:#3f3653;    /* tu oficina, acentos raros            (Apollo) */
--volt:#ebf212;      /* bueno / activo / listo. Nada más     (acento Apollo) */
--signal:#e2582f;    /* solo errores                         (agregado por el juego) */
/* Rampa de piel (única excepción, para un elenco diverso) */
--skin-1:#f0d9c0; --skin-2:#c99a72; --skin-3:#8a5f42;
```

## Tipografía
| Fuente | Uso | Regla |
|---|---|---|
| Press Start 2P | HUD, botones, etiquetas, pop-ups | Mayúsculas; máximo 3 palabras durante el arcade |
| VT323 | Diálogos, líneas del coach | Una frase por caja |
| Fraunces 550 + Hanken Grotesk | Desk layer | Sustitutos abiertos de Season Mix / Söhne (las fuentes con licencia de Apollo) |

## Elenco (sprites procedurales, cuadrícula de 24×30)
- **Tú:** gorra volt (siempre identifica al jugador), saco índigo.
- **Mariana** (cofundadora, entrega los memos), **Rival** (corbata signal).
- **Compradores** con insignia de símbolo + palabra: `$ VISIONARY`, `# TECHNICAL`, `+ OPERATOR`, `! GATEKEEPER`.
- **Lead desconocido:** silueta pebble con "?" (visibilidad baja).

## Íconos de leads
- La bolsa volt es el lead bueno.
- Banco, fábrica y hospital: fuera de ICP.
- El tamaño del ícono es el tamaño de la empresa (diminuto o gigante).
- Insignia "!" parpadeante en signal: email rebotado.
- Copia fantasma detrás: duplicado.
- Caja "?": desconocido.

## Platform powers (el producto como power-ups)
Enrich, Intent signal, Sequence, CRM sync, ICP filter. Por ahora son íconos pixel genéricos con marco volt. Se cambian por el símbolo real de Apollo con el flag `BRAND_MODE` cuando haya aprobación.

## Mapa
- Una pantalla de 20×14 tiles de 16 px, dibujada ×2.
- Ciudad cálida y monocroma: sin pasto verde y sin pasto alto. Las calles son limestone y las ventanas encendidas son volt.
- Lugares: OFFICE (índigo), INBOX PLAZA (buzones volt), CLIENTS (los leads que atrapaste aparecen como personas con etiqueta de cargo, o "?"), GYM.
- Barra superior: día, hora y leads por llamar.

## Kit de UI
- HUD sobre tinta.
- Caja de diálogo con doble borde y pestaña de nombre.
- Tarjeta de batalla.
- Botones pixel con sombra dura de 4 px.
- Memo (desk layer) con sello "NEW RULE".
- Cartas de mejora (elegir 1 de 3): las raras llevan sombra volt.

## Voz
Corta, directa, segura, en el tono de Apollo. Ejemplos:
- *"Executives buy impact. Lead with the number."*
- *"A receptionist can't buy. Find the manager."*
- Pop-ups: `TOO SMALL · BOUNCED · DEAL SIGNED`.

Sin hype con signos de exclamación y sin culpar al jugador.

## Sí / No
**Sí:**
- Volt solo para bueno/activo/listo; signal solo para errores.
- Todo color va con una forma o palabra.
- Color plano y sombra dura de 4 px.
- Respetar reduced motion.

**No:**
- Nombres, criaturas, Pokéball, pasto alto, sonidos o pantallas exactas de Pokémon.
- Logo o símbolo de Apollo y capturas del producto antes de la aprobación ("the platform").
- Gradientes, sombras suaves o grises fríos.
- Datos reales.
