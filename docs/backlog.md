# Backlog · Die letzte Dynastie

Zentrale, schlanke Liste geplanter Features/Ideen. Quelle für Agent‑Tickets.

Hinweise
- Änderungen orientieren sich strikt an `README.md` (Designvorgabe).
- Loop bleibt stabil (1 s/Tag), keine harten Pausen; Auto‑Resolve wie spezifiziert.
- Nur statische Seite (kein Build). UI/DOM in `assets/js/script.js` halten.

Workflow
- Product Owner schreibt 3–5 priorisierte Ideen (kurz) unter P1/P2/P3.
- Agent formt daraus ausführbare Tickets (Mini‑Specs) und setzt um.
- Nach Umsetzung: Haken setzen und kurz notieren, was geändert wurde.

Template (für Agent‑Ticket)
- Titel: <prägnant>
- Ziel: <ein Satz>
- Scope: S/M/L
- Akzeptanz: <2–4 Punkte>
- Dateien: <kurze Liste>
- Tests: <manuell, optional unit>
- Notizen: <Abhängigkeiten/Flags>

P1 (Top Priorität)
- [ ] Testing: Feature‑Abdeckung & Checklisten
  - Ziel: Einheitlicher Teststandard pro Feature (manuell + unit), dokumentierte Checklisten, saubere Konsole.
  - Scope: M
  - Akzeptanz: `docs/testing.md` enthält Checklisten (Loop, Events, Build/Rekrut, Endscreen, Persistenz, Meta, KI, Transfers); Jest‑Tests laufen (`npm test` grün); Cross‑Browser‑Sanity (Chrome/Firefox) vermerkt; keine lauten Logs.
  - Dateien: `docs/testing.md`, `assets/js/__tests__/*`
  - Tests: Selbstbeschreibend (Checklisten + Jest)
  - Notizen: Nur pure Logik unit‑testen; DOM via manuelle Checks

- [ ] Persistenz: Spielerprofil & Landverwaltung
  - Ziel: Spieler legt lokales Profil an (Name/Wappen) und verwaltet sein Land; Daten bleiben über Sessions erhalten.
  - Scope: M
  - Akzeptanz: Formular in `index.html`/Overlay; Auswahl aus vorhandenen Wappen (`assets/img/crests/*`); Profil/Land wird in `localStorage` gespeichert/geladen; Reset‑Option; Anzeige in `game.html` (Header/Dein Land); keine Konsolenfehler.
  - Dateien: `index.html`, `game.html`, `assets/js/script.js`, `assets/css/style.css`
  - Tests: Profil anlegen/ändern, Reload, Neues Spiel
  - Notizen: rein lokal (kein Backend); spätere Erweiterung möglich

- [ ] Metaprogression: Belohnungen & permanente Boni
  - Ziel: Nach jeder Partie Rewards vergeben und Meta‑Pfad wählen, der dauerhafte Boni fürs eigene Land freischaltet.
  - Scope: M
  - Akzeptanz: Endscreen zeigt Punkte/Währung; Auswahl aus 2–3 Upgrades; Persistenz in `localStorage` (Schema `metaProgress`); neue Partie erkennt/aktiviert Boni; Reset/Klartext‑Hinweis verfügbar.
  - Dateien: `game.html`, `assets/js/script.js`, optional `assets/js/logic/meta.js`, `assets/css/style.css`
  - Tests: Eine Runde abschließen, Upgrade wählen, neue Runde startet mit Bonus
  - Notizen: Nur clientseitig; Balancing placeholder ok

- [ ] Designupdate: Bauten & Rekrutierungen (Dein Land)
  - Ziel: Neugestaltung der UI für Bauen/Rekrutieren innerhalb des „Dein Land“-Bereichs inkl. Icons und besserer Lesbarkeit.
  - Scope: M
  - Akzeptanz: Neues Panel/Section in `game.html`; Optionen haben Icons, sind bei Ressourcenmangel deaktiviert (Tooltip erklärt warum); Templating via EltheonJS; keine Loop‑Pause; keine Konsolenfehler.
  - Dateien: `game.html`, `assets/css/style.css`, `assets/js/script.js`, `assets/img/icons/*`
  - Tests: Manuell klicken, Zustände prüfen, Ressourcenprüfung
  - Notizen: Externe Icons werden später ergänzt; Platzhalter verwenden

- [ ] AI‑Vasallen: monatliche Ereignisse & Entscheidungen (simuliert)
  - Ziel: KI‑Vasallen erhalten monatlich Ereignisse und treffen Entscheidungen per Heuristik (ohne Darstellung), die ihre Werte anpassen.
  - Scope: M
  - Akzeptanz: Pro Monatsstart verarbeitet jede KI ihr Event; Heuristik (z. B. Not/Gier/Risiko) dokumentiert; Auto‑Resolve bei Monatswechsel bleibt regelkonform; funktioniert mit ≥2 Vasallen; keine Konsolenfehler.
  - Dateien: `assets/js/script.js`, optional `assets/js/logic/ai.js`, Events‑Daten
  - Tests: 3 Monate simulieren, Logs kurz prüfen (debug minimal)
  - Notizen: Keine UI nötig; nur State‑Änderungen

- [ ] Vasalleneinfluss: fordern/schenken & Hilferufe
  - Ziel: Spieler kann Ressourcen von Vasallen anfordern oder schenken; Vasallen melden Hilfebedarf je nach Lage.
  - Scope: M
  - Akzeptanz: Aktionen im Spieler‑UI (Request/Gift) vorhanden; Ressourcen‑Transfer ändert States korrekt; KI reagiert plausibel (Annahme/Ablehnen); spontane Hilferufe als Ereignisse/Benachrichtigungen; keine Loop‑Pause; keine Konsolenfehler.
  - Dateien: `game.html`, `assets/js/script.js`, `assets/css/style.css`
  - Tests: Transfers manuell auslösen; Konditionen prüfen
  - Notizen: Später besser integrieren in Diplomatie‑Dock

- [ ] Großes Refactoring: Module, Templating, Daten‑JSONs
  - Ziel: `assets/js/script.js` entschlacken und in logische Module aufteilen; EltheonJS‑Templating konsistenter nutzen; Daten in `assets/data/*.json` auslagern.
  - Scope: L
  - Akzeptanz: Keine Regression im Loop/Events/Endscreen; klare Modulstruktur (`assets/js/logic/*`); minimale Globals; JSON‑Daten werden geladen (lokal via Dev‑Server); Konsolenfehler frei.
  - Dateien: `assets/js/script.js`, `assets/js/logic/*`, `assets/data/*.json`, `game.html`
  - Tests: Smoke‑Test über 3–4 Monate; Bau/Rekrut/Event einmal durchspielen
  - Notizen: README/AGENTS ggf. um Ladehinweis (lokaler Server nötig) ergänzen

P2
- [ ] Monatsreport‑Overlay (aus Beispiel übernehmen)

P3
- [ ] Platzhalter
