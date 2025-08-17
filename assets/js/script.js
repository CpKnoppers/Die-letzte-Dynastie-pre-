// Die letzte Dynastie – einfacher Prototyp für Einzelspieler mit zwei KI-Vasallen

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
    workers: 50
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
    workers: 0
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
    workers: 0
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

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

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
      const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
      const day = currentDate.getDate();
      const pct = Math.max(0, Math.min(100, Math.round(((day - 1) / totalDays) * 100)));
      bar.style.width = pct + '%';
    }
  }
}

function daysInMonth(year, monthIndex) {
  // monthIndex: 0-11
  return new Date(year, monthIndex + 1, 0).getDate();
}

function pauseLoop() {
  const sch = window.EltheonJS && window.EltheonJS.scheduler;
  const it = sch && sch.interval && sch.interval(TICK_KEY);
  if (it && it.pause) it.pause();
}

function resumeLoop() {
  const sch = window.EltheonJS && window.EltheonJS.scheduler;
  const it = sch && sch.interval && sch.interval(TICK_KEY);
  if (it && it.resume) it.resume();
}

function stopLoop() {
  const sch = window.EltheonJS && window.EltheonJS.scheduler;
  if (sch && sch.stop) sch.stop(TICK_KEY);
}

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
    const upFNow = Math.ceil(prov.troops / 100) * 6 + Math.ceil(prov.workers / 100) * 4;
    const upGNow = Math.ceil(prov.troops / 100) * 8 + Math.ceil(prov.workers / 100) * 6;
    const foodNet = prodF - upFNow;
    const goldNet = taxG - upGNow;
    const willFoodDeficit = (prov.food - upFNow) < 0;
    const willGoldDeficit = (prov.gold - upGNow) < 0;
    const moraleDelta = (prov.temples ? 3 * prov.temples : 0) - (willFoodDeficit ? 5 : 0) - (willGoldDeficit ? 5 : 0);
    const crestText = (prov.name && typeof prov.name === 'string' ? prov.name.trim().charAt(0).toUpperCase() : '');
    const crestTitle = prov.name ? `Wappen – ${prov.name}` : 'Wappen';
    const values = {
      name: prov.name,
      food: Math.round(prov.food),
      foodCap: prov.foodCap,
      foodPct: Math.max(0, Math.min(100, Math.round((prov.food / Math.max(1, prov.foodCap)) * 100))),
      foodProd: prodF,
      foodNet: foodNet,
      foodHint: `Produktion: +${prodF} · Unterhalt: -${upFNow}`,
      gold: Math.round(prov.gold),
      goldProd: taxG,
      goldNet: goldNet,
      goldHint: `Steuern: +${taxG} · Unterhalt: -${upGNow}`,
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
    const canAfford = player.gold >= bld.cost.gold && player.food >= (bld.cost.food || 0);
    const enabled = bld.available() && canAfford && !buildingUsed;
    const label = `${bld.name} – ${bld.description} (Kosten: ${bld.cost.gold}\u00A0Gold, ${bld.requiredWorkers}\u00A0Arbeiter)`;
    return {
      label,
      labelHtml: labelToHtml(label),
      enabled
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
      if (m && !m.enabled) btn.disabled = true;
    });
    buildContainer.appendChild(tpl.element);
  } else {
    // Fallback
    buildings.forEach((bld, idx) => {
      const btn = document.createElement('button');
      btn.classList.add('btn', 'btn-secondary', 'mb-2');
      btn.innerHTML = `${bld.name} – ${bld.description} (Kosten: ${bld.cost.gold}\u00A0Gold, ${bld.requiredWorkers}\u00A0Arbeiter)`;
      const canAfford = player.gold >= bld.cost.gold && player.food >= (bld.cost.food || 0);
      if (!bld.available() || !canAfford || buildingUsed) {
        btn.disabled = true;
      }
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
  const models = actions.map((a) => ({ label: a.label, labelHtml: labelToHtml(a.label), enabled: player.gold >= a.cost }));
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
      if (m && !m.enabled) btn.disabled = true;
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

function nextMonth(autoShowEvent = true) {
  // Ressourcen aktualisieren
  Object.keys(provinces).forEach(key => {
    const prov = provinces[key];
    // Unterhalt vor Produktion (Truppen- und Arbeiter-Unterhalt)
    const upF = Math.ceil(prov.troops / 100) * 6;
    const upG = Math.ceil(prov.troops / 100) * 8;
    // Arbeiter verbrauchen weniger
    const upWF = Math.ceil(prov.workers / 100) * 4;
    const upWG = Math.ceil(prov.workers / 100) * 6;
    prov.food -= upF + upWF;
    prov.gold -= upG + upWG;
    // Konsequenzen bei Mangel
    if (prov.food < 0) {
      const deficit = -prov.food;
      const deserters = Math.floor(deficit / 6) * 15;
      prov.troops = Math.max(0, prov.troops - deserters);
      prov.morale -= 5;
      prov.food = 0;
    }
    if (prov.gold < 0) {
      prov.gold = 0;
      prov.morale -= 5;
      if (prov.troops > 0) {
        prov.troops = Math.max(0, prov.troops - 10);
      }
    }
    // Produktion nach Moral-Faktor
    const fHarvest = 1 + 0.4 * ((prov.morale - 50) / 50);
    const fTax = 1 + 0.3 * ((prov.morale - 50) / 50);
    let prodF = prov.baseF * fHarvest;
    let taxG = prov.baseG * fTax;
    // Gebäude-Boni
    if (prov.hasMarket) {
      taxG += 10;
    }
    // Tempel erhöhen monatlich die Moral
    if (prov.temples && prov.temples > 0) {
      prov.morale += 3 * prov.temples;
    }
    // Aktualisieren
    prov.food = Math.min(prov.food + prodF, prov.foodCap);
    prov.gold += taxG;
    // Moral in Grenzen halten
    prov.morale = Math.max(0, Math.min(100, prov.morale));
    // Abrunden
    prov.food = Math.round(prov.food);
    prov.gold = Math.round(prov.gold);
  });
  // KI-Handlungen
  aiActions(provinces.ai1);
  aiActions(provinces.ai2);
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

function aiActions(prov) {
  // Einfache Heuristiken für KI
  // Bauentscheidungen: Der Vasall baut ein Gebäude, wenn Slots frei sind und die Bedingungen erfüllt sind
  const availableSlots = prov.buildingSlots - prov.buildings.length;
  if (availableSlots > 0) {
    // 1. Kornspeicher bauen, wenn Nahrung nahe am Cap und genug Gold
    if (!prov.buildings.includes('Kornspeicher') && prov.gold >= 80 && prov.food > prov.foodCap * 0.8) {
      prov.foodCap += 100;
      prov.gold -= 80;
      prov.buildings.push('Kornspeicher');
    // 2. Markt bauen, wenn keiner vorhanden und genug Gold
    } else if (!prov.hasMarket && prov.gold >= 100) {
      prov.gold -= 100;
      prov.hasMarket = true;
      prov.buildings.push('Markt');
    // 3. Kaserne bauen, wenn keine vorhanden, Truppen relativ niedrig und genug Gold
    } else if (!prov.hasBarracks && prov.gold >= 120 && prov.troops < 200) {
      prov.gold -= 120;
      prov.hasBarracks = true;
      prov.buildings.push('Kaserne');
    // 4. Tempel bauen, wenn Moral unter 75, keiner vorhanden und genug Gold
    } else if ((prov.temples || 0) < 1 && prov.gold >= 140 && prov.morale < 75) {
      prov.gold -= 140;
      prov.temples = (prov.temples || 0) + 1;
      prov.buildings.push('Tempel');
    // 5. Fort bauen, wenn Spiel fortgeschritten oder Truppen ausreichend und genug Gold
    } else if (!prov.hasFort && prov.gold >= 160 && (month > maxMonths / 2 || prov.troops > 200)) {
      prov.gold -= 160;
      prov.hasFort = true;
      prov.buildings.push('Fort');
    }
  }
  // Nahrung kaufen, wenn niedrig
  if (prov.food < prov.foodCap * 0.25 && prov.gold >= 15) {
    prov.gold -= 15;
    prov.food += 20;
  }
  // Moral erhöhen, wenn zu niedrig
  if (prov.morale < 40 && prov.gold >= 10) {
    prov.gold -= 10;
    prov.morale += 5;
  }
  // Rekrutierungen: Wenn Truppen unter einem Schwellenwert liegen und genug Gold vorhanden
  const troopThreshold = 150 + Math.max(0, month - 6) * 2; // steigt im Verlauf leicht an
  if (prov.troops < troopThreshold && prov.gold >= 10) {
    // Berechne Truppenstärke je nach Kaserne
    const gain = prov.hasBarracks ? 15 : 10;
    prov.gold -= 10;
    prov.troops += gain;
  }
  // Arbeiter rekrutieren, wenn keine Bauprojekte möglich waren und Arbeiter niedrig
  if (prov.workers < 50 && prov.gold >= 20) {
    prov.gold -= 20;
    prov.workers += 50;
  }
}

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
  let totalScore = 0;
  const results = [];
  Object.keys(provinces).forEach(key => {
    const prov = provinces[key];
    let score = prov.troops * 1 + prov.morale * 2 + prov.food * 0.5;
    if (prov.hasFort) score += 150;
    if (prov.temples && prov.temples > 0) score += prov.temples * 20;
    if (prov.hasMarket) score += 10;
    const rounded = Math.round(score);
    totalScore += rounded;
    results.push({ name: prov.name, score: rounded });
  });
  let rating = '';
  if (totalScore > 2500) {
    rating = 'Großartig! Euer Reich ist stark genug für den finalen Kampf.';
  } else if (totalScore > 1500) {
    rating = 'Nicht schlecht. Mit etwas Geschick könntet ihr bestehen.';
  } else {
    rating = 'Das Reich ist schwach und könnte der bevorstehenden Invasion nicht standhalten.';
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

// Bewertet ein Options-Label grob nach Auswirkung (kleiner = schlechter)
function scoreOptionLabel(label) {
  if (!label || typeof label !== 'string') return 0;
  const text = label;
  let score = 0;
  // Erlaube verschiedenartige Minuszeichen
  const minusClass = "[\\-\u2010-\u2015\u2212\u2011\u2013]";
  const plusRe = /\+(\d+)\s*(Nahrung|Gold|Moral|Truppen|Arbeiter)/gi;
  const minusRe = new RegExp(minusClass + '(?:\u00A0)?(\\d+)\\s*(Nahrung|Gold|Moral|Truppen|Arbeiter)', 'gi');
  const weight = (unit) => ({ Nahrung: 1, Gold: 0.5, Moral: 2, Truppen: 1, Arbeiter: 0.5 })[unit] || 1;
  let m;
  while ((m = plusRe.exec(text)) !== null) {
    const val = parseInt(m[1], 10) || 0;
    const unit = m[2];
    score += val * weight(unit);
  }
  while ((m = minusRe.exec(text)) !== null) {
    const val = parseInt(m[1], 10) || 0;
    const unit = m[2];
    score -= val * weight(unit);
  }
  if (/Ignorieren|Nichts tun|vertuschen|kein handel/i.test(text)) {
    score -= 5;
  }
  return score;
}

// Erzeugt HTML für Labels mit Ressourcen-Icons
function labelToHtml(label) {
  if (!label) return '';
  const iconClass = {
    Nahrung: 'icon-food',
    Gold: 'icon-gold',
    Moral: 'icon-morale',
    Truppen: 'icon-troops',
    Arbeiter: 'icon-workers'
  };
  // Ersetze Muster wie "+15 Moral" oder "-20 Gold" usw.
  const minusClass = "[\-\u2010-\u2015\u2212\u2011\u2013]";
  const re = new RegExp(`(${minusClass}?\\s*\\+?\\s*\\d+)\\s*(Nahrung|Gold|Moral|Truppen|Arbeiter)`, 'gi');
  let html = label.replace(re, (m, num, unit) => {
    const u = unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
    const cls = iconClass[u] || '';
    if (!cls) return m;
    return `${num}\u00A0<span class="icon ${cls}" aria-hidden="true"></span>`;
  });
  return html;
}
