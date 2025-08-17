// Crown & Crisis – einfacher Prototyp für Einzelspieler mit zwei KI-Vasallen

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
  // Monat aktualisieren
  const monthCounter = document.getElementById('month-counter');
  monthCounter.textContent = `Monat ${month} / ${maxMonths}`;
  // Provinzen ausgeben – separate Container für Spieler und Vasallen
  const playerContainer = document.getElementById('player-province');
  const aiContainer = document.getElementById('ai-provinces');
  playerContainer.innerHTML = '';
  aiContainer.innerHTML = '';
    Object.keys(provinces).forEach(key => {
      const prov = provinces[key];
      const card = document.createElement('div');
      card.className = 'province-card card p-3 mb-3';
      // Unterscheide Spieler- und Vasallen-Karten über Klassen für Styling
      if (key === 'player') {
        card.classList.add('player-card');
      } else {
        card.classList.add('ai-card');
      }
      card.innerHTML = `
        <h2 class="card-title">${prov.name}</h2>
        <ul class="list-unstyled mb-0">
          <li>Nahrung: <strong>${Math.round(prov.food)}</strong> / ${prov.foodCap}</li>
          <li>Gold: <strong>${Math.round(prov.gold)}</strong></li>
          <li>Truppen: <strong>${Math.round(prov.troops)}</strong></li>
          <li>Arbeiter: <strong>${Math.round(prov.workers)}</strong></li>
          <li>Moral: <strong>${Math.round(prov.morale)}</strong></li>
          <li>Gebäude: ${prov.buildings.length > 0 ? prov.buildings.join(', ') : '—'}</li>
        </ul>
      `;
      if (key === 'player') {
        playerContainer.appendChild(card);
      } else {
        aiContainer.appendChild(card);
      }
    });
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
  descEl.textContent = currentEvent.description;
  const optionsEl = document.getElementById('event-options');
  optionsEl.innerHTML = '';
  currentEvent.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.classList.add('btn', 'btn-primary', 'mb-2');
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      // Effekt ausführen
      opt.effect();
      // Panel ausblenden
      panel.classList.add('hidden');
      // Monatliche Abrechnung
      nextMonth();
    });
    optionsEl.appendChild(btn);
  });
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
  buildings.forEach(bld => {
    const btn = document.createElement('button');
    btn.classList.add('btn', 'btn-secondary', 'mb-2');
    btn.innerHTML = `${bld.name} – ${bld.description} (Kosten: ${bld.cost.gold} Gold, ${bld.requiredWorkers} Arbeiter)`;
    const canAfford = player.gold >= bld.cost.gold && player.food >= (bld.cost.food || 0);
    if (!bld.available() || !canAfford) {
      btn.disabled = true;
    }
    btn.addEventListener('click', () => {
      if (bld.available() && player.gold >= bld.cost.gold && player.food >= (bld.cost.food || 0) && !buildingUsed) {
        bld.action();
        // Arbeiter für diesen Monat in Anspruch nehmen
        workersUsedThisMonth += bld.requiredWorkers;
        buildingUsed = true;
        updateUI();
        // Panel text anpassen
        const info = document.getElementById('build-info');
        info.textContent = 'Du hast diesen Monat bereits gebaut.';
        // Disable all build buttons
        Array.from(buildContainer.children).forEach(el => {
          el.disabled = true;
        });
      }
    });
    buildContainer.appendChild(btn);
  });
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
  actions.forEach(act => {
    const btn = document.createElement('button');
    btn.classList.add('btn', 'btn-secondary', 'mb-2');
    btn.textContent = act.label;
    if (player.gold < act.cost) {
      btn.disabled = true;
    }
    btn.addEventListener('click', () => {
      if (player.gold >= act.cost) {
        player.gold -= act.cost;
        if (act.gainTroops) {
          player.troops += act.gainTroops;
        }
        if (act.gainWorkers) {
          player.workers += act.gainWorkers;
        }
        updateUI();
        // Buttons neu bewerten nach Rekrutierung
        showRecruitOptions();
      }
    });
    recruitContainer.appendChild(btn);
  });
}

function nextMonth() {
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
  showEvent();
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
  const panel = document.getElementById('event-panel');
  panel.classList.remove('hidden');
  const descEl = document.getElementById('event-description');
  descEl.textContent = 'Die zwei Jahre sind vorüber!';
  const optionsEl = document.getElementById('event-options');
  optionsEl.innerHTML = '';
  // Ergebnistext erstellen
  let scoreboard = '';
  let totalScore = 0;
  const results = [];
  Object.keys(provinces).forEach(key => {
    const prov = provinces[key];
    // Basis: Truppen, Moral, Nahrung
    let score = prov.troops * 1 + prov.morale * 2 + prov.food * 0.5;
    // Fort bringt starken Bonus
    if (prov.hasFort) {
      score += 150;
    }
    // Tempel tragen durch Zusammenhalt bei
    if (prov.temples && prov.temples > 0) {
      score += prov.temples * 20;
    }
    // Markt minimaler Bonus
    if (prov.hasMarket) {
      score += 10;
    }
    // Runde ab
    const rounded = Math.round(score);
    totalScore += rounded;
    results.push({ name: prov.name, score: rounded });
  });
  // Erstelle Scoreboard-Text
  scoreboard += 'Endbilanz – WarScore aller Provinzen:\n';
  results.forEach(res => {
    scoreboard += `${res.name}: ${res.score}\n`;
  });
  scoreboard += `Gesamt-Score: ${totalScore}\n`;
  // Bewertung des Gesamtergebnisses
  if (totalScore > 2500) {
    scoreboard += 'Großartig! Euer Reich ist stark genug für den finalen Kampf.';
  } else if (totalScore > 1500) {
    scoreboard += 'Nicht schlecht. Mit etwas Geschick könntet ihr bestehen.';
  } else {
    scoreboard += 'Das Reich ist schwach und könnte der bevorstehenden Invasion nicht standhalten.';
  }
  const summaryP = document.createElement('p');
  summaryP.textContent = scoreboard;
  optionsEl.appendChild(summaryP);
}

// Initialisierung
window.addEventListener('DOMContentLoaded', () => {
  updateUI();
  showBuildOptions();
  // Erste Ereignisanzeige zum Start
  showEvent();
});