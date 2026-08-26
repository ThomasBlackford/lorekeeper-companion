# LoreKeeper Companion

Player-facing character companion. A separate Electron app from the DM
tool in this repo — its own `package.json`, its own build, its own local
SQLite database (`companion.db` in the OS user-data folder). Nothing here
imports from or modifies the DM app.

## Status: barebones, standalone

This is a first pass. It runs entirely on its own — one character sheet,
stored locally on the player's machine:

- Name / class & level
- HP with a damage/heal stepper (same interaction as the DM app's combat tracker)
- Custom resource bars (Rage, Ki, ammo, whatever)
- Spells — per-spell ritual/concentration/prepared toggles, plus a shared
  spell-slot pool per level (1–9)
- Abilities/features — optional limited uses with a recharge tag
  (short rest / long rest / dawn / unlimited / custom), editable regardless
  of whether it's built-in or homebrew
- "Short Rest" / "Long Rest" buttons that reset every ability/slot tagged
  for that recharge type at once

**Not built yet, on purpose:**
- No bundled spell/ability compendium — everything is entered by hand for now
- No LAN connection to the DM app — this app's data is local-only and does
  not sync anywhere yet. That's the next phase, once this local shape has
  been used for a session or two.

## Running it

```bash
npm install
npm run dev
```

## Building an installer

```bash
npm run dist
```
