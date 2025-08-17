// Die letzte Dynastie – einfacher Prototyp für Einzelspieler mit zwei KI-Vasallen

/**
 * @typedef {Object} Province
 * @property {string} name
 * @property {number} food
 * @property {number} gold
 * @property {number} troops
 * @property {number} morale
 * @property {number} foodCap
 * @property {number} baseF
 * @property {number} baseG
 * @property {Array<string>} buildings
 * @property {number} buildingSlots
 * @property {boolean} hasMarket
 * @property {boolean} hasBarracks
 * @property {number} temples
 * @property {boolean} hasFort
 * @property {number} workers
 * @property {string} [crestImg]
 */

/**
 * @typedef {Object} AIContext
 * @property {number} month
 * @property {number} maxMonths
 */

// Provinzdatenstruktur
const provinces = {
  player: {
    name: 'Dein Land',
    // Leicht reduzierte Startressourcen für mehr Spannung
    food: 110,
    gold: 90,
    troops: 180,
    morale: 55,
    foodCap: 300,
    baseF: 80,
    baseG: 60,
    buildings: [],
    buildingSlots: 3,
    hasMarket: false,
    // Neue Eigenschaften für Gebäude
    hasBarracks: false,
    temples: 0,
    hasFort: false,
    workers: 50,
    crestImg: 'assets/img/crests/player.svg'
  },
  ai1: {
    name: 'Vasall 1',
    food: 90,
    gold: 70,
    troops: 130,
    morale: 50,
    foodCap: 250,
    baseF: 70,
    baseG: 50,
    buildings: [],
    buildingSlots: 3,
    hasMarket: false,
    hasBarracks: false,
    temples: 0,
    hasFort: false,
    workers: 0,
    crestImg: 'assets/img/crests/ai1.svg'
  },
  ai2: {
    name: 'Vasall 2',
    food: 110,
    gold: 70,
    troops: 160,
    morale: 60,
    foodCap: 250,
    baseF: 70,
    baseG: 50,
    buildings: [],
    buildingSlots: 3,
    hasMarket: false,
    hasBarracks: false,
    temples: 0,
    hasFort: false,
    workers: 0,
    crestImg: 'assets/img/crests/ai2.svg'
  }
};

let month = 1;
const maxMonths = 24;
let currentEvent = null;
let buildingUsed = false;

// Anzahl der in diesem Monat für Bauten genutzten Arbeiter
let workersUsedThisMonth = 0;

// Datum und Spielloop (über EltheonJS.scheduler)
let currentDate = new Date(925, 3, 1); // 1.4.925 (Monat 0-basiert)
let tickMs = 1000;
const TICK_KEY = 'gameTick';

/**
 * Format a Date object as DD.MM.YYYY string (delegates to logicDatetime).
 * @param {Date} d - The date to format.
 * @returns {string} Human-readable date string.
 */
function formatDate(d) {
  const api = window.DLD && window.DLD.logicDatetime && window.DLD.logicDatetime.formatDate;
  if (typeof api === 'function') return api(d);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * Update the date label and day progress bar in the header.
 * Uses EltheonJS templating state only for dynamic content already on DOM.
 */
function updateDateUI() {
  const monthCounter = document.getElementById('month-counter');
  if (!monthCounter) return;
  const dateStr = formatDate(currentDate);
  monthCounter.textContent = `${dateStr} — Monat ${month} / ${maxMonths}`;
  // Update day progress bar
  const prog = document.getElementById('day-progress');
  if (prog) {
    const bar = prog.querySelector('.bar');
    if (bar) {
      const api = window.DLD && window.DLD.logicDatetime && window.DLD.logicDatetime.computeDayProgress;
      const pct = typeof api === 'function' ? api(currentDate) : (function(d){
        const totalDays = daysInMonth(d.getFullYear(), d.getMonth());
        return Math.max(0, Math.min(100, Math.round(((d.getDate() - 1) / totalDays) * 100)));
      })(currentDate);
      bar.style.width = pct + '%';
    }
  }
}

/**
 * Compute number of days in a given month (delegates to logicDatetime).
 * @param {number} year - Full year, e.g. 925.
 * @param {number} monthIndex - Month index 0..11.
 * @returns {number} Days in that month.
 */
function daysInMonth(year, monthIndex) {
  const api = window.DLD && window.DLD.logicDatetime && window.DLD.logicDatetime.daysInMonth;
  if (typeof api === 'function') return api(year, monthIndex);
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Pause the main scheduler loop via EltheonJS, if available.
 */
function pauseLoop() {
  const sch = window.EltheonJS && window.EltheonJS.scheduler;
  const it = sch && sch.interval && sch.interval(TICK_KEY);
  if (it && it.pause) it.pause();
}

/**
 * Resume the main scheduler loop via EltheonJS, if available.
 */
function resumeLoop() {
  const sch = window.EltheonJS && window.EltheonJS.scheduler;
  const it = sch && sch.interval && sch.interval(TICK_KEY);
  if (it && it.resume) it.resume();
}

/**
 * Stop the main scheduler loop via EltheonJS, if available.
 */
function stopLoop() {
  const sch = window.EltheonJS && window.EltheonJS.scheduler;
  if (sch && sch.stop) sch.stop(TICK_KEY);
}

/**
 * Start the 1s/day game loop using EltheonJS.scheduler.
 * On day=1 triggers monthly processing and auto-resolve for open events.
 */
function startLoop() {
  const sch = window.EltheonJS && window.EltheonJS.scheduler;
  if (!sch || !sch.every) return;
  sch.every(TICK_KEY, tickMs, () => {
    // Einen Tag weiterschalten
    currentDate.setDate(currentDate.getDate() + 1);
    updateDateUI();
    // Bei Monatswechsel Produktion anwenden und neues Ereignis öffnen
    if (currentDate.getDate() === 1) {
      // Offenes Ereignis automatisch mit schlechtester Option auflösen
      autoResolvePendingEvent();
      // Monatsschluss auswerten und neuen Monat beginnen
      nextMonth(true);
    }
  });
}

// Ereigniskarten
const eventPool = [
  {
    title: 'Schlechte Ernte',
    description: 'Ein Pilzbefall hat Teile deiner Ernte vernichtet. Was willst du tun?',
    options: [
      {
        label: 'Rationieren (‑15 Nahrung, +5 Moral)',
        effect: () => {
          provinces.player.food = Math.max(0, provinces.player.food - 15);
          provinces.player.morale = Math.min(100, provinces.player.morale + 5);
        }
      },
      {
        label: 'Kaufen (‑15 Gold, +15 Nahrung)',
        effect: () => {
          provinces.player.gold = Math.max(0, provinces.player.gold - 15);
          provinces.player.food += 15;
        }
      },
      {
        label: 'Ignorieren (‑10 Moral)',
        effect: () => {
          provinces.player.morale = Math.max(0, provinces.player.morale - 10);
        }
      }
    ]
  },
  {
    title: 'Banditenüberfall',
    description: 'Banditen plündern die Ränder deiner Provinz.',
    options: [
      {
        label: 'Soldaten entsenden (‑20 Truppen, +10 Moral)',
        effect: () => {
          provinces.player.troops = Math.max(0, provinces.player.troops - 20);
          provinces.player.morale = Math.min(100, provinces.player.morale + 10);
        }
      },
      {
        label: 'Tribut zahlen (‑20 Gold)',
        effect: () => {
          provinces.player.gold = Math.max(0, provinces.player.gold - 20);
        }
      },
      {
        label: 'Nichts tun (‑10 Moral)',
        effect: () => {
          provinces.player.morale = Math.max(0, provinces.player.morale - 10);
        }
      }
    ]
  },
  {
    title: 'Reiche Karawane',
    description: 'Eine Karawane bietet Handel an.',
    options: [
      {
        label: '20 Nahrung für 15 Gold verkaufen',
        effect: () => {
          if (provinces.player.food >= 20) {
            provinces.player.food -= 20;
            provinces.player.gold += 15;
          } else {
            provinces.player.morale = Math.max(0, provinces.player.morale - 5);
          }
        }
      },
      {
        label: '15 Gold für 20 Nahrung kaufen',
        effect: () => {
          if (provinces.player.gold >= 15) {
            provinces.player.gold -= 15;
            provinces.player.food += 20;
          } else {
            provinces.player.morale = Math.max(0, provinces.player.morale - 5);
          }
        }
      },
      {
        label: 'Kein Handel',
        effect: () => {
          // keine Änderung
        }
      }
    ]
  },
  {
    title: 'Krankheit',
    description: 'Eine Seuche breitet sich aus und schwächt deine Bevölkerung.',
    options: [
      {
        label: 'Heiler anheuern (‑20 Gold, +10 Moral)',
        effect: () => {
          provinces.player.gold = Math.max(0, provinces.player.gold - 20);
          provinces.player.morale = Math.min(100, provinces.player.morale + 10);
        }
      },
      {
        label: 'Sich selbst überlassen (‑20 Nahrung, ‑5 Moral)',
        effect: () => {
          provinces.player.food = Math.max(0, provinces.player.food - 20);
          provinces.player.morale = Math.max(0, provinces.player.morale - 5);
        }
      }
    ]
  },
  {
    title: 'Guter Jahrgang',
    description: 'Die Ernte war außergewöhnlich gut!',
    options: [
      {
        label: '+20 Nahrung',
        effect: () => {
          provinces.player.food += 20;
        }
      },
      {
        label: '+15 Gold (durch Verkauf)',
        effect: () => {
          provinces.player.gold += 15;
        }
      }
    ]
  }
];

// Zusätzliche Ereignisse zur Erweiterung der Spieltiefe
// Wir fügen sie per push hinzu, um die bestehende eventPool-Definition nicht zu stören
eventPool.push({
  title: 'Dürre',
  description: 'Eine unerwartete Dürre hat die Ernte dezimiert.',
  options: [
    {
      label: 'Speicher plündern (‑15 Nahrung, +5 Moral)',
      effect: () => {
        provinces.player.food = Math.max(0, provinces.player.food - 15);
        provinces.player.morale = Math.min(100, provinces.player.morale + 5);
      }
    },
    {
      label: 'Getreide einkaufen (‑20 Gold, +15 Nahrung)',
      effect: () => {
        if (provinces.player.gold >= 20) {
          provinces.player.gold -= 20;
          provinces.player.food += 15;
        } else {
          provinces.player.morale = Math.max(0, provinces.player.morale - 5);
        }
      }
    },
    {
      label: 'Götter vertrauen (‑5 Moral)',
      effect: () => {
        provinces.player.morale = Math.max(0, provinces.player.morale - 5);
      }
    }
  ]
});
eventPool.push({
  title: 'Großes Fest',
  description: 'Das Volk verlangt nach einem Fest zur Aufmunterung.',
  options: [
    {
      label: 'Ein Fest ausrichten (‑20 Gold, +10 Moral)',
      effect: () => {
        if (provinces.player.gold >= 20) {
          provinces.player.gold -= 20;
          provinces.player.morale = Math.min(100, provinces.player.morale + 10);
        } else {
          provinces.player.morale = Math.max(0, provinces.player.morale - 5);
        }
      }
    },
    {
      label: 'Ablehnen (‑5 Moral)',
      effect: () => {
        provinces.player.morale = Math.max(0, provinces.player.morale - 5);
      }
    }
  ]
});
eventPool.push({
  title: 'Verrat in den Reihen',
  description: 'Ein Spion wurde enttarnt und hat Informationen verkauft.',
  options: [
    {
      label: 'Rigoros bestrafen (‑15 Truppen, +5 Moral)',
      effect: () => {
        provinces.player.troops = Math.max(0, provinces.player.troops - 15);
        provinces.player.morale = Math.min(100, provinces.player.morale + 5);
      }
    },
    {
      label: 'Bestechung zahlen (‑15 Gold)',
      effect: () => {
        provinces.player.gold = Math.max(0, provinces.player.gold - 15);
      }
    },
    {
      label: 'Untersuchung vertuschen (‑10 Moral)',
      effect: () => {
        provinces.player.morale = Math.max(0, provinces.player.morale - 10);
      }
    }
  ]
});

// Hilfsfunktionen
/**
 * Render the provinces state into the DOM. Uses EltheonJS templating when
 * available; falls back to simple DOM building otherwise.
 */
function updateUI() {
  // Monat/Datum aktualisieren
  updateDateUI();
  // Provinzen ausgeben – separate Container für Spieler und Vasallen
  const playerContainer = document.getElementById('player-province');
  const aiContainer = document.getElementById('ai-provinces');
  playerContainer.innerHTML = '';
  aiContainer.innerHTML = '';
  Object.keys(provinces).forEach(key => {
    const prov = provinces[key];
    // Erwartete Produktion (vereinfachte Vorschau, wie in nextMonth berechnet)
    const fHarvest = 1 + 0.4 * ((prov.morale - 50) / 50);
    const fTax = 1 + 0.3 * ((prov.morale - 50) / 50);
    const prodF = Math.round(prov.baseF * fHarvest);
    const taxG = Math.round(prov.baseG * fTax + (prov.hasMarket ? 10 : 0));
    // Vereinfachte Netto-Vorhersagen (Unterhalt vs. Produktion)
    const troopUnits = Math.ceil(prov.troops / 100);
    const workerUnits = Math.ceil(prov.workers / 100);
    const troopUpF = troopUnits * 6;
    const troopUpG = troopUnits * 8;
    const workerUpF = workerUnits * 4;
    const workerUpG = workerUnits * 6;
    const upFNow = troopUpF + workerUpF;
    const upGNow = troopUpG + workerUpG;
    const foodNet = prodF - upFNow;
    const goldNet = taxG - upGNow;
    const willFoodDeficit = (prov.food - upFNow) < 0;
    const willGoldDeficit = (prov.gold - upGNow) < 0;
    const moraleDelta = (prov.temples ? 3 * prov.temples : 0) - (willFoodDeficit ? 5 : 0) - (willGoldDeficit ? 5 : 0);
    const crestText = (!prov.crestImg && prov.name && typeof prov.name === 'string' ? prov.name.trim().charAt(0).toUpperCase() : '');
    const crestTitle = prov.name ? `Wappen – ${prov.name}` : 'Wappen';
    const projectedFood = prov.food + Math.max(0, foodNet);
    const capOverflow = Math.max(0, Math.round(projectedFood - prov.foodCap));
    const capNote = capOverflow > 0 ? `Cap-Limit: -${capOverflow}` : (projectedFood >= Math.round(prov.foodCap * 0.9) ? 'Nahe Cap' : '');
    const values = {
      name: prov.name,
      food: Math.round(prov.food),
      foodCap: prov.foodCap,
      foodPct: Math.max(0, Math.min(100, Math.round((prov.food / Math.max(1, prov.foodCap)) * 100))),
      foodProd: prodF,
      foodNet: foodNet,
      foodHint: `Produktion: +${prodF} · Unterhalt: -${upFNow} (Truppen -${troopUpF}, Arbeiter -${workerUpF})${capNote ? ' · ' + capNote : ''}`,
      capNote: capNote,
      gold: Math.round(prov.gold),
      goldProd: taxG,
      goldNet: goldNet,
      goldHint: `Steuern: +${taxG} · Unterhalt: -${upGNow} (Truppen -${troopUpG}, Arbeiter -${workerUpG})`,
      troops: Math.round(prov.troops),
      workers: Math.round(prov.workers),
      morale: Math.round(prov.morale),
      moralePct: Math.max(0, Math.min(100, Math.round(prov.morale))),
      moraleClass: (prov.morale < 40 ? 'low' : (prov.morale < 70 ? 'med' : 'high')),
      moraleDelta: moraleDelta,
      moraleHint: `Tempel: +${(prov.temples||0)*3}${willFoodDeficit? ' · Mangel Nahrung: -5':''}${willGoldDeficit? ' · Mangel Gold: -5':''}`,
      role: (key === 'player' ? 'Spieler' : (key === 'ai1' ? 'Vasall 1' : (key === 'ai2' ? 'Vasall 2' : ''))),
      isAI: (key !== 'player'),
      crestText: crestText,
      crestImg: prov.crestImg || '',
      crestTitle: crestTitle,
      // Badge-Liste aus Gebäude-Status ableiten
      badges: (function() {
        const out = [];
        if (prov.hasMarket) out.push({ label: 'Markt' });
        if (prov.hasBarracks) out.push({ label: 'Kaserne' });
        if (prov.hasFort) out.push({ label: 'Fort' });
        if ((prov.temples || 0) > 0) out.push({ label: `Tempel ×${prov.temples}` });
        // Bestehende benannte Bauten aufnehmen, ohne Duplikate
        (prov.buildings || []).forEach(b => {
          if (!out.some(x => x.label === b) && b) out.push({ label: b });
        });
        return out;
      })(),
      hasBadges: ((prov.hasMarket || prov.hasBarracks || prov.hasFort || (prov.temples || 0) > 0 || (prov.buildings||[]).length>0) ? true : false),
      cardClass: key === 'player' ? 'player-card' : 'ai-card'
    };
    if (window.EltheonJS && window.EltheonJS.templating) {
      const el = window.EltheonJS.templatingExt.render('province-card', values);
      // Hydrate crest images from data-src to src to avoid 404 on placeholders
      hydrateCrestImages(el.element);
      if (key === 'player') {
        playerContainer.appendChild(el.element);
      } else {
        aiContainer.appendChild(el.element);
      }
    } else {
      // Fallback ohne Templating, falls EltheonJS nicht verfügbar ist
      const card = document.createElement('div');
      card.className = `province-card card p-3 mb-3 ${values.cardClass}`;
      card.innerHTML = `
        <h2 class="card-title">${values.name}</h2>
        <ul class="list-unstyled mb-0">
          <li>Nahrung: <strong>${values.food}</strong> / ${values.foodCap}</li>
          <li>Gold: <strong>${values.gold}</strong></li>
          <li>Truppen: <strong>${values.troops}</strong></li>
          <li>Arbeiter: <strong>${values.workers}</strong></li>
          <li>Moral: <strong>${values.morale}</strong></li>
          <li>Gebäude: ${values.buildings}</li>
        </ul>
      `;
      if (key === 'player') {
        playerContainer.appendChild(card);
      } else {
        aiContainer.appendChild(card);
      }
    }
  });
  // Rahmen-Overlays wurden entfernt; keine Nachbearbeitung nötig
}

/**
 * Set `src` from `data-src` for crest images within a rendered root element.
 * This avoids early 404s when templates momentarily contain placeholders.
 * @param {HTMLElement} root - The rendered template root to scan.
 */
function hydrateCrestImages(root) {
  if (!root) return;
  const imgs = root.querySelectorAll('img.crest-img[data-src]');
  imgs.forEach((img) => {
    const src = img.getAttribute('data-src');
    if (src && !img.getAttribute('src')) {
      img.setAttribute('src', src);
    }
  });
}

/**
 * Display a random event at month start without pausing the loop.
 * Uses EltheonJS templates `event-description` and `options-list`.
 */
function showEvent() {
  buildingUsed = false;
  // Arbeiter für Bauten zurücksetzen (neuer Monat)
  workersUsedThisMonth = 0;
  showBuildOptions();
  showRecruitOptions();
  const panel = document.getElementById('event-panel');
  panel.classList.remove('hidden');
  // Zufälliges Ereignis wählen
  const randomIndex = Math.floor(Math.random() * eventPool.length);
  currentEvent = eventPool[randomIndex];
  const descEl = document.getElementById('event-description');
  descEl.innerHTML = '';
  if (window.EltheonJS && window.EltheonJS.templatingExt) {
    const descTpl = window.EltheonJS.templatingExt.render('event-description', { description: currentEvent.description });
    descEl.appendChild(descTpl.element);
  } else {
    const p = document.createElement('p');
    p.textContent = currentEvent.description;
    descEl.appendChild(p);
  }
  const optionsEl = document.getElementById('event-options');
  optionsEl.innerHTML = '';
  // Render Optionen via generische Optionsliste (mit Icons im Label)
  const optionsModel = currentEvent.options.map((o) => ({
    label: o.label,
    labelHtml: labelToHtml(o.label),
    btnClass: 'btn-primary'
  }));
  if (window.EltheonJS && window.EltheonJS.templatingExt) {
    const tpl = window.EltheonJS.templatingExt.render('options-list', { options: optionsModel }, {
      onSelect: (_e, el) => {
        const label = el.getAttribute('data-origin-label') || el.getValue();
        const opt = currentEvent && currentEvent.options.find(o => o.label === label);
        if (!opt) return;
        opt.effect();
        panel.classList.add('hidden');
        currentEvent = null;
      }
    });
    optionsEl.appendChild(tpl.element);
  } else {
    // Fallback
    currentEvent.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.classList.add('btn', 'btn-primary', 'mb-2');
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        opt.effect();
        panel.classList.add('hidden');
        currentEvent = null;
      });
      optionsEl.appendChild(btn);
    });
  }
}

/**
 * Render build options for the player province.
 * - Disables options when resources/slots/worker availability are insufficient.
 * - Adds a tooltip (title) explaining why an option is disabled.
 * - Uses EltheonJS `options-list` where available.
 */
function showBuildOptions() {
  const buildContainer = document.getElementById('build-options');
  buildContainer.innerHTML = '';
  const player = provinces.player;
  const availableSlots = player.buildingSlots - player.buildings.length;
  if (availableSlots <= 0 || buildingUsed) {
    const info = document.getElementById('build-info');
    if (availableSlots <= 0) {
      info.textContent = 'Keine Bauslots mehr verfügbar.';
    } else if (buildingUsed) {
      info.textContent = 'Du hast diesen Monat bereits gebaut.';
    }
    return;
  } else {
    document.getElementById('build-info').textContent = 'Du kannst einmal pro Monat ein Gebäude errichten.';
  }
  // Mögliche Gebäude definieren
  // Verfügbare Arbeiter für diesen Monat ermitteln
  const availableWorkers = player.workers - workersUsedThisMonth;
  const buildings = [
    {
      name: 'Kornspeicher',
      description: '+100 Nahrungskapazität',
      cost: { gold: 80, food: 0 },
      requiredWorkers: 50,
      action: () => {
        player.foodCap += 100;
        player.gold -= 80;
        player.buildings.push('Kornspeicher');
      },
      available: () => {
        return !player.buildings.includes('Kornspeicher') && (availableWorkers >= 50);
      }
    },
    {
      name: 'Markt',
      description: '+10 Gold pro Monat',
      cost: { gold: 100, food: 0 },
      requiredWorkers: 50,
      action: () => {
        player.gold -= 100;
        player.hasMarket = true;
        player.buildings.push('Markt');
      },
      available: () => {
        return !player.hasMarket && (availableWorkers >= 50);
      }
    },
    {
      name: 'Kaserne',
      description: 'Rekrutierungen bringen +50 % Truppen',
      cost: { gold: 120, food: 0 },
      requiredWorkers: 60,
      action: () => {
        player.gold -= 120;
        player.hasBarracks = true;
        player.buildings.push('Kaserne');
      },
      available: () => {
        return !player.hasBarracks && (availableWorkers >= 60);
      }
    },
    {
      name: 'Tempel',
      description: '+3 Moral pro Monat',
      cost: { gold: 140, food: 0 },
      requiredWorkers: 50,
      action: () => {
        player.gold -= 140;
        player.temples = (player.temples || 0) + 1;
        player.buildings.push('Tempel');
      },
      available: () => {
        return player.temples < 1 && (availableWorkers >= 50);
      }
    },
    {
      name: 'Fort',
      description: 'WarScore‑Bonus im Finale',
      cost: { gold: 160, food: 0 },
      requiredWorkers: 100,
      action: () => {
        player.gold -= 160;
        player.hasFort = true;
        player.buildings.push('Fort');
      },
      available: () => {
        return !player.hasFort && (availableWorkers >= 100);
      }
    }
  ];
  const buildModels = buildings.map((bld) => {
    const canAffordGold = player.gold >= bld.cost.gold;
    const canAffordFood = player.food >= (bld.cost.food || 0);
    const canAfford = canAffordGold && canAffordFood;
    const isAvailable = bld.available();
    const enabled = isAvailable && canAfford && !buildingUsed && availableSlots > 0;
    const reasons = [];
    if (availableSlots <= 0) reasons.push('Keine Bauslots verfügbar');
    if (!isAvailable) {
      // More specific availability hints based on building name/state
      if (bld.name === 'Kornspeicher' && player.buildings.includes('Kornspeicher')) reasons.push('Bereits gebaut');
      if (bld.name === 'Markt' && player.hasMarket) reasons.push('Bereits gebaut');
      if (bld.name === 'Kaserne' && player.hasBarracks) reasons.push('Bereits gebaut');
      if (bld.name === 'Tempel' && player.temples >= 1) reasons.push('Maximale Anzahl erreicht');
      if (bld.name === 'Fort' && player.hasFort) reasons.push('Bereits gebaut');
      if (availableWorkers < bld.requiredWorkers) reasons.push('Nicht genug Arbeiter');
    }
    if (!canAffordGold) reasons.push('Nicht genug Gold');
    if (!canAffordFood) reasons.push('Nicht genug Nahrung');
    if (buildingUsed) reasons.push('Für diesen Monat bereits gebaut');
    const label = `${bld.name} – ${bld.description} (Kosten: ${bld.cost.gold}\u00A0Gold, ${bld.requiredWorkers}\u00A0Arbeiter)`;
    return {
      label,
      labelHtml: labelToHtml(label),
      enabled,
      tooltip: enabled ? '' : (reasons.join(' · ') || 'Nicht verfügbar')
    };
  });
  if (window.EltheonJS && window.EltheonJS.templatingExt) {
    const models = buildModels.map(m => Object.assign({ btnClass: 'btn-secondary' }, m));
    const tpl = window.EltheonJS.templatingExt.render('options-list', { options: models }, {
      onSelect: (_e, el) => {
        const label = el.getAttribute('data-origin-label') || el.getValue();
        const bld = buildings.find(b => `${b.name} – ${b.description} (Kosten: ${b.cost.gold}\u00A0Gold, ${b.requiredWorkers}\u00A0Arbeiter)` === label);
        if (!bld) return;
        const canAfford = player.gold >= bld.cost.gold && player.food >= (bld.cost.food || 0);
        if (bld.available() && canAfford && !buildingUsed) {
          bld.action();
          workersUsedThisMonth += bld.requiredWorkers;
          buildingUsed = true;
          updateUI();
          document.getElementById('build-info').textContent = 'Du hast diesen Monat bereits gebaut.';
          showBuildOptions();
        }
      }
    });
    Array.from(tpl.element.querySelectorAll('button')).forEach(btn => {
      const lbl = btn.textContent || '';
      const m = buildModels.find(x => x.label === lbl);
      if (!m) return;
      if (!m.enabled) btn.disabled = true;
      if (m.tooltip) btn.title = m.tooltip;
      // For accessibility
      if (!m.enabled) btn.setAttribute('aria-disabled', 'true');
    });
    buildContainer.appendChild(tpl.element);
  } else {
    // Fallback
    buildings.forEach((bld, idx) => {
      const btn = document.createElement('button');
      btn.classList.add('btn', 'btn-secondary', 'mb-2');
      btn.innerHTML = `${bld.name} – ${bld.description} (Kosten: ${bld.cost.gold}\u00A0Gold, ${bld.requiredWorkers}\u00A0Arbeiter)`;
      const canAfford = player.gold >= bld.cost.gold && player.food >= (bld.cost.food || 0);
      const reasons = [];
      if (availableSlots <= 0) reasons.push('Keine Bauslots verfügbar');
      if (!bld.available()) {
        if (availableWorkers < bld.requiredWorkers) reasons.push('Nicht genug Arbeiter');
      }
      if (!canAfford) reasons.push('Nicht genug Ressourcen');
      if (buildingUsed) reasons.push('Für diesen Monat bereits gebaut');
      if (!bld.available() || !canAfford || buildingUsed || availableSlots <= 0) btn.disabled = true;
      if (reasons.length) btn.title = reasons.join(' · ');
      if (btn.disabled) btn.setAttribute('aria-disabled', 'true');
      btn.addEventListener('click', () => {
        if (bld.available() && player.gold >= bld.cost.gold && player.food >= (bld.cost.food || 0) && !buildingUsed) {
          bld.action();
          workersUsedThisMonth += bld.requiredWorkers;
          buildingUsed = true;
          updateUI();
          const info = document.getElementById('build-info');
          info.textContent = 'Du hast diesen Monat bereits gebaut.';
          showBuildOptions();
        }
      });
      buildContainer.appendChild(btn);
    });
  }
}

// Rekrutierungsoptionen anzeigen
/**
 * Render recruit options for the player.
 * - Barracks increase troop gains.
 * - Disables options when gold is insufficient, adds tooltip why.
 * - Uses EltheonJS `options-list` when available.
 */
function showRecruitOptions() {
  const recruitContainer = document.getElementById('recruit-options');
  recruitContainer.innerHTML = '';
  const player = provinces.player;
  // Definiere verfügbare Rekrutierungen
  // Passe Rekrutierungen dynamisch an, abhängig von Gebäuden wie der Kaserne
  const troopGain = player.hasBarracks ? 15 : 10;
  const troopLabel = `10 Gold → +${troopGain} Truppen`;
  const actions = [
    {
      label: troopLabel,
      cost: 10,
      gainTroops: troopGain,
      gainWorkers: 0
    },
    {
      label: '20 Gold → +50 Arbeiter',
      cost: 20,
      gainTroops: 0,
      gainWorkers: 50
    }
  ];
  const models = actions.map((a) => ({
    label: a.label,
    labelHtml: labelToHtml(a.label),
    enabled: player.gold >= a.cost,
    tooltip: player.gold >= a.cost ? '' : 'Nicht genug Gold'
  }));
  if (window.EltheonJS && window.EltheonJS.templatingExt) {
    const opts = models.map(m => Object.assign({ btnClass: 'btn-secondary' }, m));
    const tpl = window.EltheonJS.templatingExt.render('options-list', { options: opts }, {
      onSelect: (_e, el) => {
        const label = el.getAttribute('data-origin-label') || el.getValue();
        const act = actions.find(a => a.label === label);
        if (!act) return;
        if (player.gold >= act.cost) {
          player.gold -= act.cost;
          if (act.gainTroops) player.troops += act.gainTroops;
          if (act.gainWorkers) player.workers += act.gainWorkers;
          updateUI();
          showRecruitOptions();
        }
      }
    });
    Array.from(tpl.element.querySelectorAll('button')).forEach(btn => {
      const lbl = btn.textContent || '';
      const m = models.find(x => x.label === lbl);
      if (!m) return;
      if (!m.enabled) btn.disabled = true;
      if (m.tooltip) btn.title = m.tooltip;
      if (!m.enabled) btn.setAttribute('aria-disabled', 'true');
    });
    recruitContainer.appendChild(tpl.element);
  } else {
    actions.forEach((act) => {
      const btn = document.createElement('button');
      btn.classList.add('btn', 'btn-secondary', 'mb-2');
      btn.textContent = act.label;
      if (player.gold < act.cost) btn.disabled = true;
      btn.addEventListener('click', () => {
        if (player.gold >= act.cost) {
          player.gold -= act.cost;
          if (act.gainTroops) player.troops += act.gainTroops;
          if (act.gainWorkers) player.workers += act.gainWorkers;
          updateUI();
          showRecruitOptions();
        }
      });
      recruitContainer.appendChild(btn);
    });
  }
}

/**
 * Resolve monthly economy for all provinces using DLD.logicEconomy,
 * then advance the month and trigger next event.
 * Requires `window.DLD.logicEconomy.applyMonthlyEconomy` to be present.
 * @param {boolean} [autoShowEvent=true] - Whether to show next month's event.
 */
function nextMonth(autoShowEvent = true) {
  // Resolve economy per province via module (no legacy fallback)
  const econ = window.DLD && window.DLD.logicEconomy &&
    typeof window.DLD.logicEconomy.applyMonthlyEconomy === 'function'
    ? window.DLD.logicEconomy
    : null;
  if (!econ) {
    // Hard requirement as requested: surface a clear error for dev visibility
    throw new Error('DLD.logicEconomy.applyMonthlyEconomy not available – ensure assets/js/logic/economy.js is loaded before script.js');
  }
  Object.keys(provinces).forEach(key => {
    const prov = provinces[key];
    const { prov: out } = econ.applyMonthlyEconomy(prov);
    prov.food = out.food;
    prov.gold = out.gold;
    prov.morale = out.morale;
    prov.troops = out.troops;
    prov.foodCap = out.foodCap;
    prov.hasMarket = !!out.hasMarket;
    prov.temples = out.temples || prov.temples;
  });
  // AI actions – require logicAI module (no legacy fallback)
  const aiApi = window.DLD && window.DLD.logicAI && typeof window.DLD.logicAI.applyAI === 'function'
    ? window.DLD.logicAI
    : null;
  if (!aiApi) {
    throw new Error('DLD.logicAI.applyAI not available – ensure assets/js/logic/ai.js is loaded before script.js');
  }
  provinces.ai1 = aiApi.applyAI(provinces.ai1, { month, maxMonths });
  provinces.ai2 = aiApi.applyAI(provinces.ai2, { month, maxMonths });
  // Monat voranschreiten
  month++;
  // Spielende prüfen
  if (month > maxMonths) {
    endGame();
    return;
  }
  updateUI();
  if (autoShowEvent) {
    // Neues Ereignis zu Monatsbeginn; Loop bleibt aktiv
    showEvent();
  }
}

// (legacy aiActions removed; AI now requires DLD.logicAI.applyAI)

/**
 * Stop the loop and render an end-of-game summary.
 * Delegates to DLD.logicScore when available; otherwise uses inline formula.
 */
function endGame() {
  // Ergebnis anzeigen
  updateUI();
  // Timer/Loop anhalten
  stopLoop();
  const panel = document.getElementById('event-panel');
  panel.classList.remove('hidden');
  const descEl = document.getElementById('event-description');
  descEl.textContent = 'Die zwei Jahre sind vorüber!';
  const optionsEl = document.getElementById('event-options');
  optionsEl.innerHTML = '';
  // Ergebnisdaten berechnen
  let results, totalScore, rating;
  const scoreApi = window.DLD && window.DLD.logicScore;
  if (scoreApi && typeof scoreApi.computeAllScores === 'function') {
    const agg = scoreApi.computeAllScores(provinces);
    results = agg.results;
    totalScore = agg.totalScore;
    rating = typeof scoreApi.rateTotal === 'function' ? scoreApi.rateTotal(totalScore) : '';
  } else {
    let total = 0; const res = [];
    Object.keys(provinces).forEach(key => {
      const prov = provinces[key];
      let score = prov.troops * 1 + prov.morale * 2 + prov.food * 0.5;
      if (prov.hasFort) score += 150;
      if (prov.temples && prov.temples > 0) score += prov.temples * 20;
      if (prov.hasMarket) score += 10;
      const rounded = Math.round(score);
      total += rounded;
      res.push({ name: prov.name, score: rounded });
    });
    results = res; totalScore = total;
    rating = (totalScore > 2500) ? 'Großartig! Euer Reich ist stark genug für den finalen Kampf.'
      : (totalScore > 1500) ? 'Nicht schlecht. Mit etwas Geschick könntet ihr bestehen.'
      : 'Das Reich ist schwach und könnte der bevorstehenden Invasion nicht standhalten.';
  }
  if (window.EltheonJS && window.EltheonJS.templatingExt) {
    const tpl = window.EltheonJS.templatingExt.render('end-summary', {
      results,
      totalScore,
      rating
    });
    optionsEl.appendChild(tpl.element);
  } else {
    // Fallback auf Text
    let scoreboard = 'Endbilanz – WarScore aller Provinzen:\n';
    results.forEach(res => { scoreboard += `${res.name}: ${res.score}\n`; });
    scoreboard += `Gesamt-Score: ${totalScore}\n` + rating;
    const summaryP = document.createElement('p');
    summaryP.textContent = scoreboard;
    optionsEl.appendChild(summaryP);
  }
}

// Initialisierung
// Bootstrap the game once DOM is ready, initializing EltheonJS templating.
window.addEventListener('DOMContentLoaded', () => {
  if (window.EltheonJS && window.EltheonJS.templatingExt) {
    try { window.EltheonJS.templatingExt.init(); } catch (_) {}
  }
  updateUI();
  showBuildOptions();
  // Loop starten und initiales Ereignis anzeigen (ohne Pause, Option A)
  startLoop();
  showEvent();
});

// Automatische Auflösung eines offenen Ereignisses mit der schlechtesten Option
/**
 * Auto-resolve an open event on month rollover by picking the worst option.
 * Uses DLD.logicText.scoreOptionLabel if available.
 */
function autoResolvePendingEvent() {
  const panel = document.getElementById('event-panel');
  const isVisible = panel && !panel.classList.contains('hidden');
  if (!currentEvent || !isVisible) return;
  let worst = null;
  let worstScore = Infinity;
  (currentEvent.options || []).forEach((opt) => {
    const s = scoreOptionLabel(opt.label || '');
    if (s < worstScore) { worstScore = s; worst = opt; }
  });
  if (worst && typeof worst.effect === 'function') {
    try { worst.effect(); } catch (_) {}
  }
  panel.classList.add('hidden');
  currentEvent = null;
}

/**
 * Score an option label by resource impact (lower is worse). Delegates to
 * DLD.logicText.scoreOptionLabel if present; otherwise uses a local fallback.
 * @param {string} label - The human readable option label.
 * @returns {number} Score (lower means worse option).
 */
function scoreOptionLabel(label) {
  const api = window.DLD && window.DLD.logicText && window.DLD.logicText.scoreOptionLabel;
  if (typeof api === 'function') return api(label);
  // Fallback: inline logic
  if (!label || typeof label !== 'string') return 0;
  const text = label;
  let score = 0;
  const minusClass = "[\\-\u2010-\u2015\u2212\u2011\u2013]";
  const plusRe = /\+(\d+)\s*(Nahrung|Gold|Moral|Truppen|Arbeiter)/gi;
  const minusRe = new RegExp(minusClass + '(?:\u00A0)?(\\d+)\\s*(Nahrung|Gold|Moral|Truppen|Arbeiter)', 'gi');
  const weight = (unit) => ({ Nahrung: 1, Gold: 0.5, Moral: 2, Truppen: 1, Arbeiter: 0.5 })[unit] || 1;
  let m;
  while ((m = plusRe.exec(text)) !== null) {
    const val = parseInt(m[1], 10) || 0; const unit = m[2];
    score += val * weight(unit);
  }
  while ((m = minusRe.exec(text)) !== null) {
    const val = parseInt(m[1], 10) || 0; const unit = m[2];
    score -= val * weight(unit);
  }
  if (/Ignorieren|Nichts tun|vertuschen|kein handel/i.test(text)) score -= 5;
  return score;
}

/**
 * Convert an option label to HTML with resource icons. Delegates to
 * DLD.logicText.labelToHtml if present; otherwise uses a local fallback.
 * @param {string} label - The label to decorate with icons.
 * @returns {string} HTML string.
 */
function labelToHtml(label) {
  const api = window.DLD && window.DLD.logicText && window.DLD.logicText.labelToHtml;
  if (typeof api === 'function') return api(label);
  if (!label) return '';
  const iconClass = {
    Nahrung: 'icon-food', Gold: 'icon-gold', Moral: 'icon-morale',
    Truppen: 'icon-troops', Arbeiter: 'icon-workers'
  };
  const minusClass = "[\\-\u2010-\u2015\u2212\u2011\u2013]";
  const re = new RegExp(`(${minusClass}?\\s*\\+?\\s*\\d+)\\s*(Nahrung|Gold|Moral|Truppen|Arbeiter)`, 'gi');
  return String(label).replace(re, (m, num, unit) => {
    const u = unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
    const cls = iconClass[u] || '';
    if (!cls) return m;
    return `${num}\u00A0<span class="icon ${cls}" aria-hidden="true"></span>`;
  });
}
