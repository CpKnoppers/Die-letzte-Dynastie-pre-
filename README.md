# Zusammenfassung des aktuellen Spielkonzepts

*(Projekt: **Die letzte Dynastie** · Arbeitstitel: **Die letzte Dynastie**)*

**Elevator Pitch & Zielgruppe.**
Ein 20–30-minütiges, simultan-zuggesteuertes Team-Coop-Strategiespiel (auch solo spielbar): Ein Spieler ist König (asymmetrische Rolle), 2–4 weitere sind Herzöge/Vasallen mit eigenen Ländereien. In \~8–12 “Saisons” (\~2 In-Game-Jahre) rüstet ihr das Reich wirtschaftlich und militärisch gegen eine übermächtige Invasion. Hoher Zeitdruck (typ. 120 s pro Saison), knappe Verhandlungen, brüchiges Vertrauen und feindliche Einflussnahme prägen jede Partie. Zielgruppe sind Coop-Fans, die schnelles, politisch-strategisches “Overcooked-Tempo” wollen; kurze Sessions, hohe Wiederspielbarkeit, niedrige Einstiegshürde, hohe Meisterungstiefe. Optional: fairer Meta-Fortschritt (kosmetisch, leichte Startoptionen).&#x20;

**Rollen & Kernfantasie.**

* **König:** Makro-Hebel (Dekrete, Steuern, Kriegsrecht, Notkredite), Ressourcen bündeln, Loyalität managen, Kriegsplan festlegen – alles mit sichtbaren Nebenwirkungen (Moral, Loyalität).
* **Vasallen (2–4):** Provinzführung mit lokalen Trade-offs (Ackerbau vs. Rekrutierung, Markt öffnen vs. Rationierung, Miliz-Drill vs. Infrastrukturpflege), Tribute/Hilfen verhandeln, Reichstreue vs. Provinzschutz abwägen.
* **Solo:** König + 2–4 KI-Vasallen oder Vasall mit KI-König.&#x20;

**Ressourcen & Zustände (Minimal-Set).**
Gold, Nahrung, Armee (Menge/Qualität), Moral. Erweiterbar um Einfluss, Geheimdienst, Infrastruktur, Loyalität, Unruhe, Bevölkerung/Arbeitskraft, Versorgungslinien. Jede Ressource hat klare, spürbare Konsequenzen (z. B. Mangel → Desertion/Unruhe).&#x20;

**Partiestruktur & Rundenablauf.**
Eine Session umfasst 8–12 Saisons. Jede Saison:

1. **Ereignisse** (15–30 s), 2) **Kurz-Verhandlung** (30–60 s, Voice/Text, Schnellangebote), 3) **Befehlsphase** (harte 120 s, simultan), 4) **Auflösung & Bericht** (15–30 s). Finale als **Kriegsplan-Endkampf** mit klarer “Was gab den Ausschlag?”-Summary.&#x20;

**Kernmechaniken.**

* **Zeitdruck & Informationsknappheit:** Harte Timer, partielle Sicht (Vasallen kennen Lokales besser; König sieht das Makro), Kommunikation nur in Fenstern (“Funkstille” dazwischen), UI mit 2-Klick-Entscheidungen.
* **Asymmetrische Macht & Kosten:** König hat starke, aber teure Hebel; Vasallen entscheiden lokal mit Schiebereglern/Karten.
* **Feindlicher Einfluss & Verrat:** Gesandten-Events bieten Bestechung/Erpressung. “Versuchungs-Wert” eines Vasallen ergibt sich aus Not/Gier/Angst/Loyalität. **Oath-&-Favor-System:** Öffentliche Eide (Bruch-Penalty) und geheime Gefälligkeiten (IOUs). Verrat ist möglich, aber riskant und selten rational.&#x20;

**Ökonomie & Versorgung.**
Nahrung unterhält Bevölkerung/Armee; Mangel drückt Moral und steigert Unruhe. Gold fließt in Investitionen/Spionage/Handel; Schwarzmärkte sind riskante Abkürzungen. Infrastruktur (Straßen/Lager) kann Effizienz heben und Verluste senken (modular).&#x20;

**Kriegsplan & Finale.**
Vor dem Endkampf wählt der König einen **Kriegsplan** (z. B. Schildwall/Defensiv, Vorstoß/Offensiv, Guerilla/Abnutzung). Die Endauswertung kombiniert Truppenstärke/Qualität, Versorgung, Moral, Koordination, Geheimdienstboni und Event-Modifikatoren und zeigt den Ausgang knapp und nachvollziehbar.&#x20;

**Ereignisdesign (Beispiele).**
Krisen (Ernteausfall, Seuche, Banditen, Intrige), Chancen (Karawanen, Söldner, Taktikerin), Feindaktionen (Bestechungswellen, Sabotage), Hofdrama (Thronfolge, Skandal, religiöser Streit). Jedes Event erzwingt klare Trade-offs unter Zeitdruck.&#x20;

**UX/Flow (Web/PC).**

* **Map-Pane:** Reichskarte mit Provinz-Heatmaps (Nahrung/Moral/Unruhe).
* **Orders-Pane:** 3–5 fokussierte Entscheidungen pro Saison/Rolle (Karten/Slider, Tooltips mit Folgen).
* **Diplomatie-Dock:** Verhandlungs-Countdown, Schnell-Angebote (formalisierte Deals: X Gold ↔ Y Nahrung etc.).
* **Berichte:** Kurze, ursachengenaue Feeds; “Lesson of the Season”.&#x20;

**Balancing-Leitlinien.**
Minimal-Kern (4 Ressourcen) + modulare Tiefe; jede Entscheidung hat spürbare Kosten; Koop-Druck bleibt hoch (Gemeinwohl vs. Eigennutz). **Design-Spannungsachsen:** Koop vs. Selbstschutz; Informationsknappheit vs. Klarheit; Zeitdruck vs. Fairness; Asymmetrie ohne Ohnmacht; Tiefe ohne das 30-Min-Budget zu sprengen.&#x20;

**Technische Skizze.**
Server-autoritative Simulation; ein deterministischer **Sim-Tick pro Saison**. Networking via WebSockets (z. B. SignalR), Match-“Rooms”. Persistenz: Match-State als JSON-Blob (Replays/Sync) + relationale Tabellen für Meta/Stats. 3–5 Spieler/Match → simples horizontales Sharding. Bots: heuristische KI (Not, Loyalität, Gier, Risikoaversion). Anti-Cheat: Nur der Server rechnet; Clients senden Absichten/Orders.&#x20;

**Datenmodell (vereinfacht).**
`Match { id, season, timer, settings }` · `Player { id, role, loyalty, traits }` · `Province { id, owner, food, gold, army, morale, unrest, infra? }` · `Order { playerId, season, type, payload }` · `Decree { season, type, scope, effect }` · `Event { season, target, options, outcome }` · `Oath/Favor { from, to, terms, public }` · `WarPlan { type, modifiers }`.&#x20;

**Beispiel-Saison.**
Event “Erntepilz – −20 % Nahrung im Süden”; König erlässt Brot-Preisbindung (+Moral, −Gold), bittet den Norden um Weizen, hebt Steuer +1; Nord-Vasall exportiert 50 Nahrung, verschiebt Kaserne; Süd rationiert (−Moral, +Nahrung) und setzt auf Miliz; der Feind besticht den West-Vasallen (200 Gold für Neutralität) – öffentlicher Eid der Vor-Saison macht Verrat riskant.&#x20;

**Produktionsplan (inkrementell).**

* **Milestone 0 – “Lean Vertical”:** Lokaler Single-Match-Prototyp (König + 2 KI-Vasallen), 4 Ressourcen, 8 Saisons, 3–4 Events, 6 Orders/Rolle, Endkampf-Formel + Text-Summary.
* **Milestone 1 – “Online Slice”:** Lobbies, 3–5 Spieler, harter Timer, Kurz-Verhandlung, 20+ Events, 2–3 Kriegspläne, minimales Oath/Favor.
* **Milestone 2 – “Depth & Meta”:** Balance-Pässe, mehr Event-Arten, kosmetischer Meta-Fortschritt, Stat-Tracking, Replays, eskalierende Feind-Einflusswellen.&#x20;

**Start-Content & Formeln (skizziert).**

* **Startpaket:** \~24 Events (Wirtschaft/Intrige/Feind/Natur), 8 Dekrete (Steuer+, Rationierung, Wehrpflicht, Preisbindung, Marktöffnung, Notkredit, Presse-Erlass, Kirchenbündnis), 10 Vasallen-Orders, 3 Kriegspläne.
* **Formel-Ideen:**

  * `Nahrung_next = Nahrung + Ernte − (BevölkerungRate + ArmeeUnterhalt) ± Events`
  * `Moral_next = Moral + (Rationierung? −X : +Y) + (Sieg/Niederlage-Impacts) + (Steueränderung)`
  * `ArmeeKraft = Truppen * (1 + Qualität*0.1) * Versorgung * MoralFaktor`
  * `WarScore = Σ(Frontbeiträge) + Plan-Boni − Feinddruck + Geheimdienst`&#x20;

**Offene Designfragen (kurz).**
Spielerzahl fixieren (präferiert König + 3 Vasallen)? Feintuning der Timer (z. B. 120 s Orders, 45 s Verhandlung)? Verrats-Dynamik (einmaliger Knall vs. schleichende Neutralisierung)? Meta-Progression strikt fair/kosmetisch? Artstyle (stilisiertes Hof-UI + Karte).&#x20;

Wenn du willst, verwandle ich das direkt in ein **Pflichtenheft für Milestone 0** (Wireframes, Event-JSON-Schema, Mini-Eventliste) und eine **Tech-Roadmap** (Server-Tick, SignalR-Flows, Match-State-Serialisierung, Test-Harness).

Kurz und knackig — das **Minimal-Set (4 Ressourcen)**, das für **König *und* Vasallen** gleichermaßen gilt:

1. **Nahrung**
   Unterhalt für Bevölkerung & Armee. Erzeugt v. a. durch Landwirtschaft/Importe; Verbrauch läuft täglich (Tick). **Mangel** → sinkende Moral, Unruhe, Desertion; **Überschuss** → Reserven, Tauschwerte.

2. **Gold**
   Universale Wirtschaftsressource (Steuern, Handel, Kredite). Finanziert Ausbau, Rekrutierung/Ausrüstung, Söldner, Geheimdienst, Notmaßnahmen. **Knappheit** → Investitionsstopp; **Schulden** (optional) → Zinsen/Moralmalus.

3. **Militärkraft** *(zweiteilig geführt)*

   * **Truppenstärke (Menge)**: Köpfe/Einheiten.
   * **Qualität**: Ausbildung/Ausrüstung/Erfahrung.
     Unterhalt kostet täglich Nahrung/Gold; bestimmt maßgeblich den Endkampf (mit Plan-Multiplikatoren).

4. **Moral/Loyalität**
   Stimmt Effizienz (Ernte, Steuern, Rekrutierung), Ereignisreaktionen und **Verratsneigung**. Beeinflusst durch Rationierung/Steuern/Dekrete, Siege/Niederlagen, lokale Krisen. Niedrig → Streiks, Aufstände, Desertion.

**Hinweise zu deinem Setup:**

* Der **König** hat eigene Provinzen (produzieren dieselben 4 Ressourcen) **plus** Reichshebel (Dekrete, Umverteilung).
* Mit **1 Sekunde = 1 Tag** und **24 Seasons/2 Jahre**: Unterhalt & kleine Schwankungen laufen **täglich**, große Entscheidungen/Umverteilung erfolgen **seasonweise**.

alles klar — wir schärfen die **Monatsökonomie** so, dass du die 30–120 Sek. primär für **Events & Deals** nutzt und die Ressourcen **knapp** bleiben. Hier ist eine kompakte, spielfertige v0.1-Spezifikation (nur Mechanik).

# Monatsökonomie v0.1 (24 Monate = 24 Seasons)

## Taktung & Phasen (pro Monat)

1. **Ereignisse & Hof/Provinz-Entscheide** (30–120 s): Optionen wählen, Deals schließen, Dekrete setzen.
2. **Auflösung in fester Reihenfolge**:
   a) Eventeffekte →
   b) Transfers/Tribute/Handel →
   c) **Unterhalt** (vor Produktion! sorgt für Druck) →
   d) **Produktion & Steuern** →
   e) **Verderb/Strafen/Kappen** →
   f) **Moralupdate & Folgerisiken** →
   g) **Rekrutments-Fortschritt** (Neue Truppen werden erst nach *L* Monaten aktiv).

> Der König hat eigene Provinzen (wie Vasallen) **plus** Reichshebel (Dekrete/Umverteilung).

---

## Ressourcen (4) & Knappheit

* **Nahrung (F)** – Lagerfähig, aber mit **Verderb** über Cap.
* **Gold (G)** – Liquidität, Schulden optional.
* **Militärkraft** – **Truppenmenge N** (Unterhalt) + **Qualität Q** (Stufen 0–3).
* **Moral (M ∈ \[0–100])** – reiner **Faktor & Risiko-Treiber**, kein Lagergut.

**Knappheitsprinzip:** Baseline so einstellen, dass **ohne Deals/Dekrete** die Bilanz leicht **negativ** ist (−5 % bis −15 %). Dadurch werden Handel, Umverteilung und harte Entscheidungen nötig.

---

## Formeln (pro Provinz, pro Monat)

Notation: `⌊x⌋` = ganzzahlig, `cap(x,0,∞)` = min. 0.

### 1) Unterhalt (vor Produktion)

* **Truppenunterhalt Nahrung:** `UpF = ⌈N / 100⌉ * uF`
* **Truppensold Gold:** `UpG = ⌈N / 100⌉ * uG`
* **Zahlungslücken:**

  * Wenn `F < UpF` ⇒ **Desertion** `D = ⌊(UpF − F) / uF⌋ * dF` Truppen, `M −= 5`.
  * Wenn `G < UpG` ⇒ **Lohnrückstand**: `M −= 5`, `Q −= 1` (min 0).
  * Beide Lücken zugleich ⇒ zusätzlich `Aufruhr-Chance +p`.

> **Empfehlung Startwerte:** `uF=6` Nahrung /100 Mann, `uG=8` Gold /100 Mann, `dF=15` Mann.

### 2) Produktion & Steuern (mit Moral-Faktoren)

* **Saisonalität:** Monat-Multiplikator `S(m)`: Winter −30 %, Sommer +10 %, Erntemonat +40 % (einfaches Kurvenprofil, 12-Monatszyklus, im 2. Jahr wiederholt).
* **Moral als Ertragsfaktor:**

  * `fHarvest(M) = 1 + α_h * (M − 50)/50` (z. B. `α_h=0.4`)
  * `fTax(M)    = 1 + α_t * (M − 50)/50` (z. B. `α_t=0.3`)
* **Ernte:** `ProdF = baseF * S(m) * fHarvest(M)`
* **Steuern:** `TaxG = baseG * S(m) * fTax(M)`
* **Aktualisierung:**

  * `F = cap(F − UpF + ProdF, 0, Fcap)`
  * `G = G − UpG + TaxG`

### 3) Verderb & Kappen

* **Lagercap Nahrung:** `Fcap` pro Provinz.
* **Verderb:** Überschuss `Overflow = max(0, F_beforeCap − Fcap)` ⇒ `F −= ⌈Overflow * 0.5⌉`.
* **Armee-Tragfähigkeit (Supply Cap):** `Ncap` (abhängig von `baseF + baseG`). **Über-Cap-Strafe:** Wenn `N > Ncap`, zusätzlicher Unterhalt: `UpF *= 1 + 0.25*(N/Ncap−1)`, `UpG` analog.

### 4) Moral-Update & Risiken

* **Baseline-Drift:** `M += clamp( (gedeckter Unterhalt? +1 : −2) + (Übersteuern? −1 : 0) + (Rationierung? −k : 0), −5, +3 )`
* **Ereignisrisiko durch Moral:** `p_neg = p0 + β*(50 − M)/50` (z. B. `p0=10 %`, `β=25 %`).
* **Niedrige Moral (<40):** +Chance auf Streik/Aufruhr (−TaxG nächster Monat, −ProdF, ggf. −Q).

---

## Militärkraft (N & Q)

* **Rekrutierung:** `Order: Recruit r` ⇒ **Goldkost** `costG = r * cG`, **Nahrungsvorbehalt** optional. **Aktiv** nach `L` Monaten (z. B. `L=1`).
* **Qualität (0–3):**

  * **Drill:** `Order: Drill` ⇒ `Q += 1` (max 3), kostet `G_d`, `F_d`, kein N-Zuwachs.
  * **Vernachlässigung:** unbezahlter Sold oder Rationenmangel ⇒ `Q −= 1`.
* **Desertion & Auflösung:** greifen vor Produktion (siehe Unterhalt).

> **Startwerte:** `cG=0.4` Gold/Mann; `G_d=40`, `F_d=30` pro Qualitätsstufe und 100 Mann.

---

## Moral als reiner Multiplikator + Risiko

* **Wirkt auf:** **Ernte** & **Steuern** (Formeln oben).
* **Triggert:** **negative Zusatz-Events** (Streik/Plünderung/Sabotage) und **Desertion** schneller.
* **Nicht lagerbar**, kein “Wert”, sondern **Hebel**.

---

## Dekrete & Orders (Beispiele, eng & teuer)

*(König kann reichsweit; Vasallen lokal, oft abgeschwächt)*

* **Rationierung:** `Ernteverbrauch −20 %` für Zivilisten → `M −10`, `p_neg +5 %`, nächster Monat `ProdF +5 %` (Disziplin).
* **Sondersteuer:** `+25 % TaxG` (einmalig) → `M −10`, `p_neg +10 %`.
* **Marktöffnung:** `+15 % TaxG`, `−10 % ProdF` (Abfluss in Handel), `M +5`.
* **Wehrpflicht:** Sofort `N += floor(pop_proxy)` (vereinfacht: fixer Schub), `M −15`, `Q −1`.
* **Drill/Training:** (s. oben), bewusst teuer.
* **Reichsumlage (König):** Zwangstransfer Nahrung/Gold; Empfänger `M +5`, Zahler `M −8`.

> **Designziel:** Jede Option **hilft** kurzfristig und **schmerzt** mittelfristig.

---

## Handels-/Deal-Rahmen (kurz)

* **Schnell-Deals** in der Eventphase: `X Nahrung ↔ Y Gold`, `Militärhilfe` (temporär N verleihen), **Schuldbrief/IOU** (Zahlungspflicht in `t` Monaten mit Strafzins & M-Malus bei Bruch).

---

## Start-Parameter (Richtwert „Normal“)

* Provinz-Baseline/Monat: `baseF=80`, `baseG=60`, `Fcap=300`, `Ncap=350`.
* Startwerte: `F=120`, `G=100`, `N=200`, `Q=1`, `M=55`.
* Saisonal: Winter ×0.7 (Monate 12,1,2), Ernte ×1.4 (Monate 8 & 20), sonst ×1.0–1.1.

Damit ist **Knappheit** spürbar: `UpF≈12`, `UpG≈16` für N=200; Winter wird eng, Ernte polstert, aber **Verderb** bremst das Horten.

---

## Balance-Drehregler (für Feinschliff)

* `uF/uG`, `Fcap/Ncap`, `α_h/α_t`, `p0/β`, Saisonalität, Drill-Kosten, Rekrut-Verzögerung `L`.
* Reihenfolge **Unterhalt vor Produktion** ist der wichtigste Härtehebel.

---

## Monats-UI (Kassensturz)

* **Oben:** “Monatswechsel” mit `ΔF`, `ΔG`, `ΔN/Q`, `ΔM`, Ampel “Knappheit demnächst”.
* **Mitte:** Eventkarten + 2–3 Orderslots.
* **Rechts:** Deals/Diplomatie-Panel (Timer sichtbar).
* **Warnungen:** “Sold nicht gedeckt”, “Rationen knapp”, “Über Cap (Verderb/Überlast)”.

---

Wenn du magst, setze ich daraus direkt eine **kleine Test-Tabelle** mit 3–4 Monaten Durchlauf (Winter → Normal → Ernte) und zeige, wie sich unterschiedliche Entscheidungen (Rationierung vs. Sondersteuer) fühlbar auswirken.

Alles klar—hier ist ein **Bausystem v0.1** passend zu deiner Monatsökonomie (24 Seasons), mit **knappen Ressourcen**, klaren Trade-offs und ohne neue Ressourcentypen.

# Grundregeln

* **Bauplätze:** Jede Provinz startet mit **3 Slots**. **Rathaus/Town Hall** (+1 Slot, max. 5).
* **Bauzeiten & Wartung:** 1 aktives Bauprojekt/Provinz (2 mit **Werkhof**); jedes Gebäude hat **Monatsbauzeit** und **Gold-Unterhalt**.
* **Bau-Bürde:** Pro aktivem Bau −10 % **ProdF** *und* −10 % **TaxG** in der Provinz (Arbeiter gebunden).
* **Reparaturen/Sabotage:** Gebäude können **beschädigt** werden (Event/Moral). **Reparatur** kostet 40–60 % des Neubaus, 1 Monat.
* **Stufen (T1–T3):** Höhere Stufen = stark bessere Effekte, aber **exponentiell teurer** + mehr Unterhalt.
* **König vs. Vasallen:** Alle Basisbauten verfügbar; **königliche Sonderbauten** haben teure, **reichsweite Auren**.

---

# Gebäude-Kategorien (mit Startwerten)

## 1) Lager & Logistik

**Granary / Kornspeicher** – erhöht **Fcap**, senkt **Verderb**

* T1: **+100 Fcap**, Verderb von 50 % → **35 %** Overflow; **Bau 1M, 80 G**, **Unterhalt 2 G**
* T2: +100 Fcap, Verderb → **25 %**; **1M, 130 G**, **3 G**
* T3: +150 Fcap, Verderb → **15 %**; **2M, 200 G**, **4 G**

**Straßenbau / Roadworks** – hebt **Ncap** & mildert Überlastkosten

* T1: **+50 Ncap**, Über-Cap-Malus ×0.85; **1M, 80 G**, **1 G**
* T2: +80 Ncap, Malus ×0.7; **1M, 120 G**, **2 G**

**Wach-/Signal­turm** – mindert negative Events (Banditen/Sabotage)

* T1: **−5 %** p\_neg lokal; **1M, 70 G**, **1 G**
* T2: −8 % p\_neg, **Sabotage-Chance −25 %**; **1M, 110 G**, **2 G**

## 2) Wirtschaft & Handel

**Markt** – mehr **TaxG**, bessere **Deal-Kurssätze**

* T1: **+10 % TaxG**, **+5 %** bessere Kurse (Nahrung↔Gold); **1M, 90 G**, **3 G**
* T2: +15 % TaxG, +10 % Kurse; **1M, 140 G**, **4 G**
* T3: +20 % TaxG, +15 % Kurse; **1M, 220 G**, **5 G**

**Karawanserei** – stabilisiert Handel & schützt vor Störungen

* T1: **Deals immun gegen 1 Störungs-Event/Monat**; **2M, 130 G**, **3 G**
* T2: +1 zusätzlicher **Deal-Slot** in der Verhandlungsphase; **2M, 180 G**, **4 G**

**Zollhaus** – schöpft Transit ab (Synergie: Straßen/Markt)

* T1: **+6 Gold**/Monat pro aktivem Deal, **+5 % TaxG**; **1M, 100 G**, **2 G**

## 3) Militär

**Kaserne** – effizientere **Rekrutierung**, schnellere Einsatzbereitschaft

* T1: **Rekrut-Kosten −15 %**, **Latenz L−1** (min 0); **2M, 120 G**, **4 G**
* T2: −25 %, L−1 (stackt nicht unter 0); **2M, 170 G**, **5 G**

**Exerzierplatz (Drill Yard)** – Qualität (**Q**) schneller und günstiger

* T1: **G\_d/F\_d −20 %** bei Drill, **Q-Verfall −50 %** im Folgemonat; **2M, 100 G**, **3 G**
* T2: −30 %, zusätzl. **+10 %** Chance auf **Q+1** bei Drill-Monat; **2M, 150 G**, **4 G**

**Befestigungen / Fort** – monatlich weniger Verluste, besseres Finale

* T1: **Raid-/Banditenschaden −50 %**, **WarScore +5 %** (lokal, im Finale); **3M, 160 G**, **5 G**
* T2: −75 %, WarScore +8 %; **3M, 220 G**, **6 G**

> **Limit:** Max. 2 Provinzen mit Fort-Bonus zählen voll im Finale (sonst halber Bonus), damit Entscheidung relevant bleibt.

## 4) Ordnung & Stimmung

**Kirche/Tempel** – hebt **Moral-Baseline**, senkt p\_neg

* T1: **M +2/Monat** (Baseline-Drift), **p\_neg −5 %**; **2M, 110 G**, **3 G**
* T2: M +3/Monat, p\_neg −8 %; **2M, 160 G**, **4 G**

**Schenke/Platz** – kurzfristige Moral, kleine Effizienz-Einbußen

* T1: Sofort **+5 M** (bei Fertigstellung), dann **+1 M/Monat**, aber **ProdF −3**; **1M, 60 G**, **2 G**

**Amt des Vogts (Courthouse)** – bändigt Unruhe & Steuer-Malus

* T1: **Sondersteuer-M-Malus −3**, **Unruheertrags-Verlust −25 %**; **2M, 100 G**, **2 G**
* T2: −5 Malus, −40 % Verlust; **2M, 150 G**, **3 G**

## 5) Provinzverwaltung (Slots & Bau-Flow)

**Rathaus / Town Hall** – **+1 Gebäudeslot** (einmal je Provinz)

* **2M, 140 G**, **2 G**

**Werkhof / Bauhof** – **2. Bauqueue** in dieser Provinz

* **2M, 120 G**, **3 G**

---

# Königliche Sonderbauten (Reichsweite Effekte)

**Königliche Kornkammer** – **Notverteilung** ohne vollen M-Malus

* Einmal/Monat: bis **50 Nahrung** reichsweit umverteilen mit **−50 %** des üblichen M-Malus beim Zahler; **3M, 240 G**, **6 G**

**Kriegsrat / War Council** – 1 zusätzliches **Dekret-Slot/Monat** *oder* **Dekret-Kosten −20 %**

* **3M, 260 G**, **6 G**

**Königliche Münzstätte** – leichte **TaxG-Aura**, aber politisch heikel

* **+5 % TaxG reichsweit**, dafür **p\_neg +2 %** in allen Provinzen; **3M, 220 G**, **5 G**

> Limit: Max. **2** königliche Sonderbauten aktiv (harte Wahl).

---

# Synergien & Anti-Snowball

* **Markt × Straßen × Zollhaus:** zusammen stark, aber hoher **Unterhalt** + **Bau-Bürde** bremst kurzfristig.
* **Kaserne × Exerzierplatz:** Menge + Qualität – teuer im Unterhalt → zwingt zu Rationierung/Steuer-Entscheiden.
* **Granary** macht Horten möglich, doch **Verderb** bleibt relevant (außer T3).
* **Kirche/Courthouse** puffern harte Dekrete (Rationierung/Sondersteuer), aber kosten Ertrag.

---

# Beispiel-Baupfade (Start)

* **König (Hauptstadt):** Granary T1 → Markt T1 → Kaserne T1 → War Council
* **Wirtschafts-Provinz:** Markt T1 → Zollhaus → Straßen T1 → Granary T2
* **Grenzprovinz:** Fort T1 → Kaserne T1 → Exerzierplatz T1 → Wachtturm
* **Unruhige Provinz:** Kirche T1 → Courthouse T1 → Schenke T1 → Markt T1

---

# Warum das greift

* **Knappheit bleibt spürbar:** hoher Unterhalt, Bau-Bürde, begrenzte Slots, exponentielle Upgrade-Kosten.
* **Monatsfokus:** Bauentscheidungen konkurrieren mit Events/Dekreten im selben knappen Zeitfenster.
* **Asymmetrie:** Königliche Auren sind mächtig, aber sehr teuer und politisch riskant (Moral/Events).

Wenn du willst, rechne ich **2–3 Beispielmonate** mit unterschiedlichen Baupfaden (z. B. „Fort zuerst“ vs. „Markt zuerst“) durch, damit wir die Startzahlen feinziehen können.

Kurz: **Ja, Spezialisierung ist gewollt.** Mit begrenzten Bauslots, Bau-Bürde, Unterhalt und teuren Upgrades kann (und soll) niemand „alles“ bauen. Provinzen driften dadurch in **Wirtschaft**, **Militär**, **Logistik/Versorgung** oder **Ordnung** – Mischungen sind möglich, aber teuer.

## Handel-Gating

* **Ohne Markt kein Handel.**
  Provinzen **ohne Markt** dürfen **keine Deals** (Nahrung↔Gold etc.) anbieten/annehmen.
  Ausnahmen: **Reichsumlage des Königs** (Zwangsumverteilung) bleibt möglich.
* **Prereqs:** Karawanserei & Zollhaus **erfordern Markt T1**.

## Neue Einheit: Arbeitstrupps (A)

Zweck: Bau beschleunigen/abfedern, Reparaturen stemmen und **Event-Aufgaben** lösen (Hochwasser, Seuche, Straßenräumung, Brand, Deichbau, etc.).

### Rekrutierung & Unterhalt

* **Kosten (Richtwerte):**

  * Rekrut: **0,30 G** pro Arbeiter
  * Unterhalt/Monat: **uFₐ = 4 Nahrung / 100**, **uGₐ = 6 Gold / 100**
  * **Latenz L=1 Monat**, dann einsetzbar (wie Truppen).
* **Kapazität/Begrenzung:**

  * **Manpower-Cap pro Provinz:** `N (Soldaten) + A (Arbeiter) ≤ Mcap`.
  * **Mcap** steigt mit **Straßenbau** (Logistik) und **Rathaus** leicht an.
  * Über-Cap erzeugt Zusatzunterhalt (analog Armee-Supply-Malus).

> **Trade-off:** Arbeiter kosten Futter & Lohn und konkurrieren mit Soldaten um **Mcap** – Horten „zu vieler“ Arbeiter ist nicht sinnvoll.

### Einsatz (pro Monat wählst du Zuweisungen)

1. **Bauhilfe**

   * **Bau-Bürde halbieren:** Weist du **≥100 A** auf ein aktives Projekt, sinkt die Provinz-**Bau-Bürde** dieses Projekts von **−10 % ProdF/TaxG** auf **−5 %**.
   * **Bauzeit verkürzen:** **≥200 A** auf dasselbe Projekt → **Bauzeit −1 Monat** (Minimum 1 Monat).
   * **Werkhof-Synergie:** Mit **Werkhof** darfst du 2 Projekte parallel bauen; je Projekt gelten die Schwellen separat.

2. **Reparaturhilfe**

   * **≥100 A**: Reparaturen kosten **−25 %** Gold, dauern **−1 Monat** (min 1).

3. **Event-Response** *(Schlüsselrolle!)*

   * Jedes einschlägige Event hat **A-Schwellen**:

     * z. B. *Hochwasser*: **A≥100** → halbiert Schaden; **A≥200** → verhindert Ernteverlust + kleiner Moralbonus.
     * *Seuche*: **A≥100** → kürzerer Malus; **A≥200** → Seuchenende + einmalig **M +3**.
     * *Straßenblockade*: **A≥150** → Handel im nächsten Monat nicht gestört.
   * Einige Events verlangen **Soldaten ODER Arbeiter** mit unterschiedlichem Outcome (Soldaten → Ordnung/Abwehr; Arbeiter → Erhalt/Produktion).

4. **Untätige Arbeiter**

   * Auch ohne Einsatz fallen **Unterhaltskosten** an. Kein Extra-Malus, aber die **Opportunitätskosten** sorgen dafür, dass du sie **aktiv** nutzen willst.

### „Qualität“ der Arbeiter (optional v0.2)

* Ein einfacher **Effizienzwert E (0–2)**: +10 / +20 % Effekt auf Bau/Events.
* Steigt durch **Werkhof T2** oder seltene Event-Belohnungen.

## Feinjustierung für Spezialisierung

* **Slots & Kosten** halten dich ehrlich: 3 Start-Slots, **Town Hall** für +1 (max. 5).
* **Gating-Kette Handel:** Markt → (Karawanserei | Zollhaus).
* **Militärpfad:** Kaserne → Exerzierplatz → Fort (teurer Unterhalt zwingt zu Deals/Dekreten).
* **Logistikpfad:** Granary → Straßen → Wachturm (Kapazitäten/Schadensminderung, aber wenig Gold).
* **Ordnung/Moral:** Kirche/Courthouse puffern harte Eingriffe (Rationierung, Sondersteuer).

## Startzahlen (Richtwerte, „Normal“)

* **Mcap**: 400 (z. B. Start: **N=200**, **A=0–100** sinnvoll).
* **Arbeiter:** Rekrut 0,30 G; Unterhalt 4 F/100 & 6 G/100; L=1.
* **Bau-Bürde:** −10 % ProdF/TaxG je aktivem Projekt (−5 % mit ≥100 A).
* **Beschleunigung:** ≥200 A → Bauzeit −1 Monat (Minimum 1).

## Mini-Beispiel

Grenzprovinz (Fort T1 geplant), **A=200** rekrutiert:

* Monat 1: A auf Fort → **Bau-Bürde −5 %**, **Bauzeit 3→2 Monate**.
* Monat 2: Banditen-Event (**A≥150**): Schaden verhindert, Handel stabil; Fort fertig.
* Kosten: +Unterhalt A, verzögerte Steuern → spürbare Knappheit, aber sichere Grenze.

---

Wenn du willst, setze ich als Nächstes eine **tabellarische Proberunde (3–4 Monate)** auf: *ohne Arbeiter*, *mit 100 A*, *mit 200 A*, jeweils **ohne/mit Markt** – damit siehst du sofort, wie stark Spezialisierung und Handel-Gating die Wirtschaft biegen.

Super Idee—Meta lohnt sich hier, **wenn** sie Vielfalt & Identität bringt, aber **keine Zahlen-Snowballs** erzeugt. Ich würde drei Schienen kombinieren:

# Leitplanken

* **Kein Power Creep:** Keine permanenten +X % auf Ernte/Steuern/Truppen.
* **Varietät statt Stärke:** Meta schaltet **Optionen** frei (neue Events, Start-Layouts, Mutatoren), nicht mehr Rohwerte.
* **Run-gebunden:** Alles, was spürbar wirkt, gilt **nur für die aktuelle Partie** (per Draft gewählt) und ist an **Trade-offs** geknüpft.

---

# 1) Renommee (Meta-Währung) & Hall of Deeds

* **Renommee** pro Run: nach Schwierigkeit, überlebten Monaten, Finale-WarScore, “Heldentaten” (z. B. Sieg trotz Hungersnot, keine Rationierung).
* **Ausgeben für:**

  * **Kosmetik:** Banner/Heraldik, Titel/Epitheta, Karten-Skins, Berichtsrahmen, Thronraum/Hauptstadt-Look, Musik/Voice-Packs.
  * **Lore & UI-QoL:** Codex-Einträge, Berichtsfilter, gespeicherte Build-Presets (“Grenzfestung”, “Handelshub”), Replay-Archiv.
* **Hall of Deeds:** Chronik deiner Dynastie (Wappen, Regentschaften, Best-Runs, Kurzzitate aus Ereignissen).

---

# 2) Vielfalt-Freischaltungen (ohne Machtzuwachs)

Diese Dinge erweitern nur den **Pool der Möglichkeiten**, sie sind **nicht automatisch aktiv**:

* **Start-Layouts:** alternative Provinz-Setups (z. B. “Flussdelta” viel Nahrung/geringe Ncap, “Bergland” wenig Nahrung/mehr Fort-Effekt).
* **Bau-Varianten (Sidegrades):**

  * Markt-Variante *Zentralmarkt*: +Deal-Kurse, aber −TaxG-Grundbonus.
  * Granary-Variante *Eiskeller*: −Verderb stark, dafür −Fcap-Zuwachs.
    (Nur **eine** Variante pro Gebäude-Typ und Run.)
* **Ereignis-Pakete/Themen-Arcs:** “Harter Winter”, “Schmugglernetz”, “Hofintrigen+Kirchenstreit”. Erhöht Abwechslung, nicht die Stärke.
* **Storyteller/RZ-KI-Profile:** balancierte Regler für Häufigkeit/Art von Krisen. Unlock = **neue Kurven**, kein Bonus.

---

# 3) Vor-Run-Draft (Run-gebundene “Mächte” als Sidegrades)

Du draftest vor Spielstart **max. 2 Karten** aus einem 4er-Angebot. Jede Karte gibt **einen Vorteil + klaren Nachteil**, z. B.:

* **“Münzrecht”**: +1 Dekret-Slot/Monat, **aber** Sondersteuer-Moralmalus +3.
* **“Miliztradition”**: Rekrut-Latenz L−1, **aber** Start-Q=0.
* **“Marktprivilegien”**: Handel ab Start erlaubt, **aber** Markt-Bau teurer + Unterhalt +1.
* **“Vorratsplaner”**: +100 Fcap in der Hauptstadt, **aber** Verderb überall +10 %-Punkte.

> Wichtig: Diese Karten werden **nur** durch Renommee freigeschaltet und **nur per Draft aktiviert**. Keine Stapelung über Runs.

---

# 4) Arbeitstrupps & Soldaten – Meta-Haken (Varietät)

* **Arbeitsgilden** (Freischaltung): erlaubt *Spezialaufträge* im Event (z. B. Brückenbau), die **Arbeiter effizienter** nutzen, aber **+Unterhalt** der Gilde.
* **Militärdoktrinen** (Freischaltung): schaltet **Kriegspläne**/Drill-Manöver frei (z. B. “Igelstellung”: Finale-WarScore +X % bei Ncap≤… **aber** −ProdF in den letzten 2 Monaten). Wieder: **Run-wahl**, kein Dauerbuff.

---

# 5) Mutatoren & Herausforderungen (für mehr Renommee)

Aktivierbare **Skulls** ändern die Regeln und geben Renommee-Multiplikatoren:

* **“Eisiger Zyklus”**: Winter −50 % ProdF, Ernte +60 % – Renommee ×1.3
* **“Steueraufstand”**: Sondersteuer löst immer Unruhen aus – ×1.2
* **“Grenzkrieg”**: +Banditen/Sabotage-Rate; Fort-Effekte +50 % – ×1.25
* **“Stumme Höfe”**: kürzere Verhandlungsfenster – ×1.15

> Kombinierbar bis zu einem Deckel; ideal für Wiederspielwert ohne Power Creep.

---

# 6) Safeguards gegen Balance-Schäden

* **Matchmaking/Seeds** berücksichtigen aktivierte Mutatoren/Drafts.
* **Kompetitive Modi**: ausschließlich **kosmetische** Meta; Drafts/Varianten **aus**.
* **Seasonal Resets** (optional): neue kosmetische Ziele, keine Werte-Resets nötig.
* **Telemetrie-Gatekeeping**: alles, was >55 % Winrate-Sprung erzeugt, wird generft/umgebaut.

---

# 7) Mini-Roadmap

1. **Phase A (safe):** Renommee, Kosmetik, Hall of Deeds, Lore-Codex.
2. **Phase B (variety):** Start-Layouts, Ereignis-Pakete, Bau-Sidegrades.
3. **Phase C (mastery):** Vor-Run-Drafts mit klaren Trade-offs, Mutatoren, Storyteller-Profile.
4. **Phase D (community):** Banner-Sharing, Seed-Challenges, wöchentliche “Krise der Woche”.

---

Wenn du magst, kuratiere ich direkt **10 Draft-Karten** (Vorteil/Nachteil) und **6 Mutatoren** abgestimmt auf deine Monatsökonomie (Rationierung, Sondersteuer, Arbeitstrupps, Markt-Gating), damit wir sie ins erste Playtest-Paket nehmen können.

Klar—wenn wir das Ganze als **Roguelite** denken, können wir **permanente, aber marginale** Fortschritte einbauen, ohne die MP-Balance zu zerlegen. Leitidee: **Jede\:r spielt immer mit seinem eigenen Erbland** (Home-Provinz), das über Runs hinweg **seitwärts verbessert** wird (Sidegrades, Start-Optionen, Varianten) – **keine** stetig wachsenden Rohwerte, die zu Snowball führen.

# Leitplanken (kurz)

* **Sidegrades statt Stat-Creep:** Freischaltungen öffnen **Optionen** (Bauvarianten, Start-Layouts, Events), keine großen globalen +%-Boni.
* **Lokale Bindung:** Permanente Effekte gelten **nur** für die **eigene** Home-Provinz.
* **MP-Fairness:** Lobbys nutzen ein **Legacy-Budget** (Punktelimit) oder **Fair Mode** (Meta kosmetisch).
* **Trade-offs:** Jedes stark fühlbare Upgrade hat einen spürbaren Nachteil.

# Meta-Gerüst

## A) Erbland (permanente Provinz-Upgrades)

Du investierst Renommee in dein Erbland. Effekte gelten nur dort und sind klein, aber spielprägend.

Beispiele (je 1–2 Legacy-Punkte, *LP*):

1. **Altes Kornhaus** – Start **+50 Fcap**, **Verderb +5 %-Punkte** in dieser Provinz.
2. **Marktgasse** – **Markt T1**: Bauzeit −1 Monat **nur** hier, **Unterhalt +1 G**.
3. **Werkhof-Genossenschaft** – **Arbeitstrupps Latenz L−1** (nur in dieser Provinz rekrutiert), **Arbeiter-Unterhalt +1 G/100**.
4. **Veteranenhalle** – Neue Truppen starten mit **Q=1** (nur hier), **Rekrut-Kosten +10 %**.
5. **Deichbauer-Tradition** – **Event-Schwellen für Arbeiter −25 %** (Hochwasser/Brand etc.), **ProdF −5** in Monaten mit Arbeiter-Einsatz.
6. **Feste Grundmauern** – **Fort T1**: WarScore-Bonus +2 %-Punkte (lokal), **Baukosten +20 %**.
7. **Pilgerpfad** – **Kirche T1** baut −1 Monat, **p\_neg +2 %** (mehr Andrang, Spannungen).
8. **Zollprivileg** – **Zollhaus** gibt +2 G/Deal extra, **Deal-Slots −1** in dieser Provinz (weniger, aber lukrativer Handel).
9. **Straßenmeisterei** – **Ncap +40** (lokal), **Über-Cap-Malus +10 %**, wenn dennoch überschritten.
10. **Schmiedezunft** – **Drill-Kosten −10 %** (G & F), **Q-Decay bei Lohnrückstand +1** (empfindlicher).
11. **Rathaus-Archiv** – **Town Hall** Unterhalt −1 G, **Bau-Bürde pro aktivem Bau** −2 %-Punkte, dafür **Steuern −2 G/Monat** (Verwaltung frisst).
12. **Karawanenrecht** – **Karawanserei** Baukosten −30 %, **Markt-Unterhalt +1 G**.

> Alle Effekte **nur** Home-Provinz, sauber stapelbar, aber mit Gegenhaken.

## B) Legacy-Karten (Run-gebunden, mit Nachteil)

Vor dem Start draftest du **1–2 Karten** (innerhalb des Lobby-Budgets). Beispiele (je 1–2 LP):

* **Münzrecht** – +1 Dekret-Slot/Monat; **Sondersteuer** hat **+3** Moral-Malus.
* **Miliztradition** – **Rekrut-Latenz L−1** global; Start-Qualität **Q=0**.
* **Vorratsplaner** – Start **+80 Nahrung** in Home-Provinz; **Verderb +10 %-Punkte** dort.
* **Händlerkontrakte** – **Deal-Kurse +10 %** (nur in Provinzen mit Markt); **Markt-Bau +30 %** teurer.

## C) Kosmetik & QoL (permanent, risikofrei)

Banner, Wappen, Thronraum-Skin, Berichtsrahmen, gespeicherte Build-Presets, Replay-Archiv, Lore-Codex.

# MP-Fairness & Modi

* **Legacy-Budget:** Jede Lobby legt z. B. **3 LP** fest (öffentlich sichtbar). Du wählst Erbland-Upgrades (permanent) + Draft-Karten (run-gebunden) **bis zur Summe**.
* **Fair Mode:** Alle Legacy-Effekte werden **kosmetisch**; nur Sidegrade-**Optionen** bleiben (z. B. andere Markt-Variante), **ohne** Wertebonus.
* **Matchmaking nach Legacy-Stufe:** Optional, um ungleiche Pools zu vermeiden.

# Warum das funktioniert

* **Identität ohne Schneeball:** Home-Provinzen fühlen sich über Runs eigen an (z. B. “Deichbauer-Küste”, “Miliz-Grenzmark”), ohne globale Power-Creep-Kurven.
* **Sinnvoll im Roguelite-Gefüge:** Kleine Start-Schübe oder Kosten-Drehungen verändern **Entscheidungswege**, nicht die Endbilanz.
* **Kompatibel mit Spezialisierung:** Upgrades greifen sauber in Bau-Gating (Markt, Werkhof, Fort) und **Arbeitstrupps** ein.

# Beispiel: 4P-Lobby (Budget 3 LP)

* **Spieler A (Wirtschaft):** Marktgasse (1), Zollprivileg (1), Händlerkontrakte (1).
* **Spieler B (Grenze):** Feste Grundmauern (1), Schmiedezunft (1), Miliztradition (1).
* **Spieler C (Logistik):** Altes Kornhaus (1), Straßenmeisterei (1), Werkhof-Genossenschaft (1).
* **König (Makro):** Rathaus-Archiv (1), Münzrecht (2).

→ Spürbar andere Startpfade, aber keine\:r ist “unfair stark”.

---

Wenn du willst, erstelle ich dir **sofort** ein Startpaket mit **15 Erbland-Upgrades** (inkl. Werte) und **10 Legacy-Karten** als JSON-Schema für die Implementierung (mit Kosten, Effekten, Nachteilen, Tooltips).

Kurz: ja — und wir können das sauber ordnen. Ich würde die **Meta-Schienen** so definieren (jeweils mit *Dauer* & *Wirkung*):

1. **Erbland-Sidegrades** *(permanent, nur Home-Provinz)*
   Kleine, seitliche Upgrades mit Gegenhaken (z. B. +Fcap, aber mehr Verderb; schnellerer Drill, aber empfindlicher bei Lohnrückstand).

2. **Terraforming & Biome-Edits** *(permanent, Home-Provinz)*
   Dämme/Bewässerung/Terrassenfelder/Windschutz. Schiebt Saisonalität & Risiken um, kostet Bauzeit/Unterhalt und kann Slots binden.

3. **Einzigartige Landmark-Gebäude** *(permanent, 1× pro Home-Provinz)*
   “Großer Hafen”, “Königswehr”, “Eiskeller” … starke, **lokale** Auren mit ordentlich Unterhalt/Event-Hooks. Kein Reichsweiten-Snowball.

4. **Berater & Hofämter** *(Roster permanent; Auswahl pro Run)*
   Du schaltest Berater frei, wählst pro Partie 1–2: je **Vorteil + Nachteil** (z. B. extra Dekret-Slot, dafür härterer Sondersteuer-Malus).

5. **Legacy-Draftkarten** *(Run-gebunden)*
   Startpakete mit klaren Trade-offs (z. B. Handel ab Start, dafür Markt teurer). Werden nur pro Runde gedraftet, nicht dauerhaft aktiv.

6. **Doktrinen & Kriegspläne** *(permanent freischalten; Run-wahl)*
   Neue Endkampf-Pläne/Drill-Manöver, die die **Formel** biegen (Bedingungen/Multiplikatoren), keine rohen Dauerboni.

7. **Gebäude-Varianten & Gilden** *(permanent freischalten; Run-wahl)*
   Sidegrade-Versionen von Markt/Granary/Fort etc.; **Arbeiter-/Händlergilden** verändern Effizienz & Unterhalt mit klaren Nachteilen.

8. **Event-/Story-Pakete & Mutatoren** *(permanent freischalten; Run-wahl)*
   Themenkrisen, Intrigenbögen, “Skulls” (schwerere Regeln) für Renommee-Multiplikatoren → Vielfalt statt Power.

9. **Start-Layouts & Seeds** *(permanent; Lobby-wahl)*
   Alternative Karten/Provinz-Setups (Flussdelta/Bergland …). In MP über **Legacy-Budget** oder “Fair Mode” reguliert.

10. **Kosmetik & QoL** *(permanent, risikofrei)*
    Banner/Wappen, Thronsaal-Skins, Presets, Replay-Archiv, Lore-Codex.

**Safeguards (MP):** Legacy-Budget pro Lobby, “Fair Mode” (nur Kosmetik/Optionen), jeder Pluspunkt mit Malus gepaart.

Wenn du willst, fixen wir jetzt die **erste Welle**:

* 6 Terraforming-Optionen,
* 6 Landmark-Gebäude,
* 8 Berater,
* 10 Legacy-Karten,
* 6 Doktrinen.
  Ich liefere sie direkt als kompakte Werte-Liste mit kurzen Tooltips & Nachteilen.
