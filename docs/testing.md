# Testing · Die letzte Dynastie

Ziel: Klare, wiederholbare Checks pro Feature. Minimal invasiv, ohne Build‑Tooling.

## Setup
- Serve lokal: `python3 -m http.server 8000` → `http://localhost:8000/game.html`.
- Browser: Letzte Chrome und Firefox.
- Tests: `npm test` (Jest, nur pure Logik). Keine DOM‑Manipulation in Unit‑Tests.

## Manuelle Playtest‑Checkliste (Smoke)
- Loop: 1 s/Tag, Monatswechsel bei Tag 1, keine Doppel‑Ticks/Drift.
- Events: Erscheinen Monatsanfang, Optionen wählbar; Auto‑Resolve bei Monatswechsel wählt „schlechteste“ Option.
- Bauen/Rekrutieren: Buttons nur aktiv, wenn Ressourcen reichen; Tooltip erklärt Deaktivierung.
- Ressourcen/Produktion: Food/Gold/Moral werden konsistent berechnet; Hinweise/Tooltips plausibel.
- Endscreen: Erscheint nach Monat > 24; Score sichtbar (falls aktiv).
- UI/Assets: Keine broken Bilder/Icons; Masking/Colors korrekt.
- Konsole: Keine Errors/Unhandled Promises; Logs sparsam.

## Feature‑spezifische Checklisten
1) Persistenz (Spielerprofil/Land)
- Profil anlegen/ändern (Name/Wappen) → `localStorage` speichert.
- Reload lädt Profil; „Neues Spiel“/Reset löscht sauber.

2) Metaprogression (permanente Boni)
- Endscreen vergibt Reward/Währung.
- Upgrade wählen → `metaProgress` gespeichert; neue Partie startet mit aktivem Bonus.
- Reset vorhanden und eindeutig.

3) Designupdate Bauen/Rekrutieren (Dein Land)
- Neues Panel sichtbar; Optionen mit Icons.
- Deaktivierung/Tooltip bei Mangel; keine Loop‑Pause.

4) AI‑Vasallen (simuliert)
- Jede KI verarbeitet monatlich 1 Event/Entscheidung; State ändert sich plausibel.
- Keine UI notwendig; optional dezente Debug‑Logs.

5) Vasalleneinfluss (fordern/schenken, Hilferufe)
- Spieler kann Transfers auslösen; States passen (−/+ Ressourcen).
- KI kann Hilferufe auslösen; Benachrichtigung/Ereignis erscheint.

6) Großes Refactoring (Module, Templating, JSON)
- Keine Regressionen: Loop/Events/Build/Rekrut/Ende funktionieren.
- Modulstruktur klar (`assets/js/logic/*`), minimale Globals.
- JSON‑Daten werden geladen (lokaler Server nötig, CORS frei).

## Unit‑Test Leitlinien (Jest)
- Scope: Reine Funktionen (Ökonomie, Score, Heuristiken) in `assets/js/logic/*`.
- Struktur: `assets/js/__tests__/*.test.js`.
- Richtlinien:
  - Keine DOM/EltheonJS im Unit‑Test; nur pure Inputs/Outputs.
  - Deterministische Heuristiken (AI) mit fixierten Seeds/Stubs testen.
  - Kleine, aussagekräftige Fälle (Arrange/Act/Assert). Keine Snapshot‑Inflation.

## Cross‑Browser & Performance
- Kurzer Sanity‑Run in Chrome und Firefox: Controls/Icons/Fonts/Timers ok.
- Performance: UI flüssig; keine auffälligen Layout‑Thrashes; Logs minimal.

## Reporting
- Jede PR referenziert die relevanten Punkte aus dieser Checkliste.
- Bei neuen Features die passende Mini‑Checkliste erweitern.
