# GTM Tycoon

A pixel-art sales game in the browser. You're the new rep, Mariana (your co-founder) hands you a **$50,000 quota** and **five days**. Find the right leads, pitch the right people, and run your day like a system, not a to-do list.

The game is in English. The specs are in Spanish.

## How a day works
1. **Mariana** gives you the rule of the day.
2. **Inbox Plaza: Pipeline Panic.** Catch online stores of the right size and let everything else fall. Bad catches cost energy.
3. **Clients.** Call your leads. Match the pitch to the buyer: `$ IMPACT` for visionaries, `# DEMO` for technical buyers, `+ WORKFLOW` for operators, `= FIND MANAGER` when a gatekeeper answers.
4. **Gym** (one drill a day) and the **Rival** on the street (pitch-off from day 2).
5. **Office.** You see your results, pick 1 of 3 platform upgrades and read tomorrow's memo with its new rule.

Controls: arrows/WASD to walk, Enter/Space to confirm, 1–4 to pick a pitch. On touch or mouse, tap a place to walk there and drag to move the tray.

## Run it
ES modules don't load from `file://`, so serve the folder with any static server:

```bash
cd gtm-tycoon && python3 -m http.server 8080
```

Then open http://localhost:8080. It deploys as-is to Netlify or GitHub Pages, with no build step.

## Test it
Requires Node 18 or newer. There are no dependencies to install.

```bash
cd gtm-tycoon && npm test
```

## Structure
- `specs/`: `spec.md` (what and why), `plan.md` (how), `tasks.md` (TDD order), plus the visual direction (`VISUAL.md`, `art-bible.html`).
- `src/core/`: pure game logic (rules, leads, battles, upgrades, economy, arcade sim, map pathfinding, saving). It has no DOM code, so all of it is unit tested.
- `src/render/`: procedural sprites and the city map.
- `src/scenes/`: title, map, arcade, battle, clients, office, final.

## Brand note
`BRAND_MODE` is `false` (in `src/core/config.js`), so the game never shows the Apollo name, logo or product screenshots and calls it "the platform". The palette and tone still follow Apollo, so **get Apollo's approval before publishing it publicly**. All companies and people are fictional.
