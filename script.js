const AWS_SERVICES_POOL = [
  {
    id: "ec2",
    name: "EC2",
    displayName: "Amazon EC2",
    category: "compute",
    desc: "Elastic Compute Cloud: secure, resizable compute capacity for virtually any cloud workload."
  },
  {
    id: "s3",
    name: "S3",
    displayName: "Amazon S3",
    category: "storage",
    desc: "Simple Storage Service: object storage built to retrieve any amount of data from anywhere."
  },
  {
    id: "lambda",
    name: "LAMBDA",
    displayName: "AWS Lambda",
    category: "compute",
    desc: "Serverless compute service that lets you run code without provisioning or managing servers."
  },
  {
    id: "dynamodb",
    name: "DYNAMODB",
    displayName: "Amazon DynamoDB",
    category: "database",
    desc: "Fast, flexible NoSQL database service for single-digit millisecond performance at any scale."
  },
  {
    id: "cloudfront",
    name: "CLOUDFRONT",
    displayName: "Amazon CloudFront",
    category: "networking",
    desc: "Global content delivery network (CDN) delivering data, videos, and APIs securely with low latency."
  },
  {
    id: "sagemaker",
    name: "SAGEMAKER",
    displayName: "Amazon SageMaker",
    category: "aiml",
    desc: "Comprehensive machine learning service to build, train, and deploy models quickly."
  },
  {
    id: "bedrock",
    name: "BEDROCK",
    displayName: "Amazon Bedrock",
    category: "aiml",
    desc: "Fully managed service offering foundation models from leading AI companies via an API."
  },
  {
    id: "rds",
    name: "RDS",
    displayName: "Amazon RDS",
    category: "database",
    desc: "Relational Database Service: makes it easy to set up, operate, and scale databases in the cloud."
  },
  {
    id: "fargate",
    name: "FARGATE",
    displayName: "AWS Fargate",
    category: "compute",
    desc: "Serverless, pay-as-you-go compute engine for deploying containers without managing servers."
  },
  {
    id: "route53",
    name: "ROUTE53",
    displayName: "Amazon Route 53",
    category: "networking",
    desc: "Highly available and scalable cloud Domain Name System (DNS) web service."
  },
  {
    id: "iam",
    name: "IAM",
    displayName: "AWS IAM",
    category: "security",
    desc: "Identity and Access Management: securely manage identities and resource access across AWS."
  },
  {
    id: "redshift",
    name: "REDSHIFT",
    displayName: "Amazon Redshift",
    category: "database",
    desc: "Fast, petabyte-scale cloud data warehouse for real-time and predictive analytics."
  },
  {
    id: "kinesis",
    name: "KINESIS",
    displayName: "Amazon Kinesis",
    category: "aiml",
    desc: "Easily collect, process, and analyze video and data streams in real time."
  },
  {
    id: "athena",
    name: "ATHENA",
    displayName: "Amazon Athena",
    category: "database",
    desc: "Interactive serverless query service that makes it easy to analyze data in S3 using standard SQL."
  },
  {
    id: "cloudwatch",
    name: "CLOUDWATCH",
    displayName: "Amazon CloudWatch",
    category: "security",
    desc: "Observability service providing monitoring data and actionable insights for AWS resources."
  },
  {
    id: "glue",
    name: "GLUE",
    displayName: "AWS Glue",
    category: "database",
    desc: "Serverless data integration service that makes it easy to discover, prepare, and combine data."
  }
];

const PALETTE_COLORS = [
  "#FF9900",
  "#008296",
  "#3B48CC",
  "#0A824A",
  "#8C3FD1",
  "#D1156D",
  "#EC7211",
  "#0097A7",
  "#283593",
  "#2E7D32",
  "#6A1B9A",
  "#C2185B",
  "#E65100",
  "#00695C"
];

const GRID_SIZE = 15;
const WORDS_COUNT = 14;

const state = {
  grid: [],
  activeWords: [],
  foundWords: new Set(),
  hintsLeft: 3,
  hintsUsed: 0,
  pinnedStartCell: null,
  isSelecting: false,
  startCell: null,
  currentLineCells: [],
  soundEnabled: true,
  timerSeconds: 0,
  timerInterval: null,
  isGameOver: false,
  activeFilter: 'all'
};

class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.1, gainValue = 0.15) {
    if (!state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  cellClick() {
    this.playTone(520, 'sine', 0.04, 0.08);
  }

  cellHover() {
    this.playTone(600, 'triangle', 0.03, 0.04);
  }

  wordFound() {
    if (!state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.22, 0.18);
        }, idx * 70);
      });
    } catch (e) { }
  }

  hint() {
    if (!state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [440, 880];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.18, 0.14);
        }, idx * 100);
      });
    } catch (e) { }
  }

  victory() {
    if (!state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const chords = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 100 },
        { f: 783.99, t: 200 },
        { f: 1046.50, t: 350 },
        { f: 1174.66, t: 500 },
        { f: 1318.51, t: 650 }
      ];
      chords.forEach(c => {
        setTimeout(() => {
          this.playTone(c.f, 'triangle', 0.35, 0.2);
        }, c.t);
      });
    } catch (e) { }
  }
}

const sfx = new SoundFX();

const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: 1, dc: 0 },
  { dr: -1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: -1, dc: -1 },
  { dr: 1, dc: -1 },
  { dr: -1, dc: 1 }
];

const NOISE_LETTERS = "AAAAAAAAAABBBCCCCCDDDEEEEEEEEEEEFFGGHHIIIIIIIIKLLLLMMNNNNNOOOOOOOPRRRRRSSSSSSTTTTTTTUUUVWWY";

function generatePuzzle() {
  let attempts = 0;
  const maxBoardAttempts = 50;

  const shuffledPool = [...AWS_SERVICES_POOL].sort(() => 0.5 - Math.random());
  const selectedWords = shuffledPool.slice(0, WORDS_COUNT);

  selectedWords.sort((a, b) => b.name.length - a.name.length);

  while (attempts < maxBoardAttempts) {
    attempts++;
    const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    const placedWords = [];
    let allPlaced = true;

    for (let wordObj of selectedWords) {
      const word = wordObj.name.toUpperCase();
      let placed = false;
      const placementAttempts = 200;

      for (let p = 0; p < placementAttempts; p++) {
        const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const startR = Math.floor(Math.random() * GRID_SIZE);
        const startC = Math.floor(Math.random() * GRID_SIZE);

        const endR = startR + dir.dr * (word.length - 1);
        const endC = startC + dir.dc * (word.length - 1);

        if (endR >= 0 && endR < GRID_SIZE && endC >= 0 && endC < GRID_SIZE) {
          let canPlace = true;
          const coords = [];

          for (let i = 0; i < word.length; i++) {
            const r = startR + dir.dr * i;
            const c = startC + dir.dc * i;
            const existingLetter = grid[r][c];

            if (existingLetter !== null && existingLetter !== word[i]) {
              canPlace = false;
              break;
            }
            coords.push({ r, c });
          }

          if (canPlace) {
            coords.forEach((coord, i) => {
              grid[coord.r][coord.c] = word[i];
            });

            placedWords.push({
              ...wordObj,
              color: PALETTE_COLORS[placedWords.length % PALETTE_COLORS.length],
              coords: coords,
              start: coords[0]
            });

            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        allPlaced = false;
        break;
      }
    }

    if (allPlaced) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!grid[r][c]) {
            const randomChar = NOISE_LETTERS[Math.floor(Math.random() * NOISE_LETTERS.length)];
            grid[r][c] = randomChar;
          }
        }
      }

      return { grid, words: placedWords };
    }
  }

  return generatePuzzle();
}

const dom = {
  grid: document.getElementById('word-grid'),
  wordList: document.getElementById('word-list'),
  timerDisplay: document.getElementById('timer-display'),
  progressDisplay: document.getElementById('progress-display'),
  remainingCountBadge: document.getElementById('remaining-count-badge'),
  catAllCount: document.getElementById('cat-all-count'),
  btnSound: document.getElementById('btn-sound'),
  soundIconOn: document.getElementById('sound-icon-on'),
  soundIconOff: document.getElementById('sound-icon-off'),
  btnNewGame: document.getElementById('btn-new-game'),
  btnHint: document.getElementById('btn-hint'),
  hintCounter: document.getElementById('hint-counter'),
  toastMessage: document.getElementById('toast-message'),
  toastText: document.getElementById('toast-text'),
  activeLine: document.getElementById('active-line'),
  foundLinesGroup: document.getElementById('found-lines-group'),
  selectionSvg: document.getElementById('selection-svg'),
  serviceInfoCard: document.getElementById('service-info-card'),
  infoCategory: document.getElementById('info-category'),
  infoTitle: document.getElementById('info-title'),
  infoDesc: document.getElementById('info-desc'),
  btnCloseInfo: document.getElementById('btn-close-info'),
  categoryFilters: document.querySelectorAll('.filter-pill'),
  victoryModal: document.getElementById('victory-modal'),
  finalTime: document.getElementById('final-time'),
  finalRating: document.getElementById('final-rating'),
  finalHints: document.getElementById('final-hints'),
  modalEvaluation: document.getElementById('modal-evaluation'),
  modalBtnReplay: document.getElementById('modal-btn-replay'),
  modalBtnReview: document.getElementById('modal-btn-review'),
  confettiCanvas: document.getElementById('confetti-canvas')
};

function initGame() {
  stopTimer();
  stopConfetti();
  state.isGameOver = false;
  state.foundWords.clear();
  state.hintsLeft = 3;
  state.hintsUsed = 0;
  state.pinnedStartCell = null;
  state.isSelecting = false;
  state.startCell = null;
  state.currentLineCells = [];
  state.timerSeconds = 0;

  updateTimerUI();
  updateProgressUI();
  updateHintButtonUI();
  hideToast();
  hideServiceInfo();
  dom.victoryModal.classList.add('hidden');
  dom.foundLinesGroup.innerHTML = '';
  clearLiveSelection();

  const puzzle = generatePuzzle();
  state.grid = puzzle.grid;
  state.activeWords = puzzle.words;

  renderGrid();
  renderWordList();
  startTimer();
}

function renderGrid() {
  dom.grid.innerHTML = '';
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.textContent = state.grid[r][c];
      dom.grid.appendChild(cell);
    }
  }
}

function renderWordList() {
  dom.wordList.innerHTML = '';
  state.activeWords.forEach(word => {
    const card = document.createElement('div');
    card.classList.add('word-card');
    card.dataset.id = word.id;
    card.dataset.cat = word.category;

    card.innerHTML = `
      <div class="word-card-info">
        <span class="word-card-name">${word.name}</span>
        <span class="word-card-cat">${word.displayName}</span>
      </div>
      <div class="word-check-icon">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    `;

    card.addEventListener('click', () => {
      displayServiceInfo(word);
      sfx.cellClick();
    });

    dom.wordList.appendChild(card);
  });

  dom.catAllCount.textContent = state.activeWords.length;
  filterWordList(state.activeFilter);
}

function getCellElement(r, c) {
  return dom.grid.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
}

function getCellCenter(r, c) {
  const cell = getCellElement(r, c);
  if (!cell) return { x: 0, y: 0 };
  const svgRect = dom.selectionSvg.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  return {
    x: (cellRect.left + cellRect.width / 2) - svgRect.left,
    y: (cellRect.top + cellRect.height / 2) - svgRect.top
  };
}

function calculateLineCells(r1, c1, r2, c2) {
  const dr = r2 - r1;
  const dc = c2 - c1;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  if (dr === 0 && dc === 0) {
    return [{ r: r1, c: c1 }];
  }

  let stepR = 0;
  let stepC = 0;
  let length = 0;

  if (dr === 0) {
    stepR = 0;
    stepC = Math.sign(dc);
    length = absDc + 1;
  } else if (dc === 0) {
    stepR = Math.sign(dr);
    stepC = 0;
    length = absDr + 1;
  } else if (absDr === absDc) {
    stepR = Math.sign(dr);
    stepC = Math.sign(dc);
    length = absDr + 1;
  } else {

    if (absDr > absDc * 2) {
      stepR = Math.sign(dr);
      stepC = 0;
      length = absDr + 1;
    } else if (absDc > absDr * 2) {
      stepR = 0;
      stepC = Math.sign(dc);
      length = absDc + 1;
    } else {
      const diagLen = Math.max(absDr, absDc);
      stepR = Math.sign(dr);
      stepC = Math.sign(dc);
      length = diagLen + 1;
    }
  }

  const cells = [];
  for (let i = 0; i < length; i++) {
    const curR = r1 + stepR * i;
    const curC = c1 + stepC * i;
    if (curR >= 0 && curR < GRID_SIZE && curC >= 0 && curC < GRID_SIZE) {
      cells.push({ r: curR, c: curC });
    }
  }

  return cells;
}

function getDynamicStrokeWidth() {
  const cellEl = getCellElement(0, 0);
  if (!cellEl) return 24;
  const w = cellEl.getBoundingClientRect().width;
  return Math.max(12, Math.round(w * 0.82));
}

function updateLiveSelection(cells) {
  const prevSelected = dom.grid.querySelectorAll('.grid-cell.selected-live');
  prevSelected.forEach(el => el.classList.remove('selected-live'));

  cells.forEach(coord => {
    const cellEl = getCellElement(coord.r, coord.c);
    if (cellEl) {
      cellEl.classList.add('selected-live');
    }
  });

  if (cells.length > 0) {
    const startCoord = cells[0];
    const endCoord = cells[cells.length - 1];
    const p1 = getCellCenter(startCoord.r, startCoord.c);
    const p2 = getCellCenter(endCoord.r, endCoord.c);

    dom.activeLine.setAttribute('x1', p1.x);
    dom.activeLine.setAttribute('y1', p1.y);
    dom.activeLine.setAttribute('x2', p2.x);
    dom.activeLine.setAttribute('y2', p2.y);
    dom.activeLine.setAttribute('stroke-width', getDynamicStrokeWidth());
    dom.activeLine.style.visibility = 'visible';
  } else {
    dom.activeLine.style.visibility = 'hidden';
  }
}

function clearLiveSelection() {
  const selected = dom.grid.querySelectorAll('.grid-cell.selected-live');
  selected.forEach(el => el.classList.remove('selected-live'));
  dom.activeLine.style.visibility = 'hidden';
  state.currentLineCells = [];
}

function validateSelection(cells) {
  if (!cells || cells.length < 2) return false;

  const forwardStr = cells.map(c => state.grid[c.r][c.c]).join('');
  const backwardStr = forwardStr.split('').reverse().join('');

  for (let wordObj of state.activeWords) {
    if (state.foundWords.has(wordObj.id)) continue;

    if (wordObj.name === forwardStr || wordObj.name === backwardStr) {
      const coordsMatchForward = wordObj.coords.every((pt, i) => pt.r === cells[i].r && pt.c === cells[i].c);
      const coordsMatchBackward = wordObj.coords.every((pt, i) => {
        const revIdx = cells.length - 1 - i;
        return pt.r === cells[revIdx].r && pt.c === cells[revIdx].c;
      });

      if (coordsMatchForward || coordsMatchBackward) {
        onWordFound(wordObj, cells);
        return true;
      }
    }
  }

  return false;
}

function onWordFound(wordObj, cells) {
  state.foundWords.add(wordObj.id);
  sfx.wordFound();

  cells.forEach(coord => {
    const cellEl = getCellElement(coord.r, coord.c);
    if (cellEl) {
      cellEl.classList.add('found-cell');
      cellEl.style.backgroundColor = wordObj.color;
    }
  });

  drawFoundWordLine(cells, wordObj.color);

  const card = dom.wordList.querySelector(`.word-card[data-id="${wordObj.id}"]`);
  if (card) {
    card.classList.add('found');
  }

  updateProgressUI();
  displayServiceInfo(wordObj);
  showToast(`Found: ${wordObj.displayName}!`, 2500);

  if (state.foundWords.size === state.activeWords.length) {
    onGameComplete();
  }
}

function drawFoundWordLine(cells, color) {
  const p1 = getCellCenter(cells[0].r, cells[0].c);
  const p2 = getCellCenter(cells[cells.length - 1].r, cells[cells.length - 1].c);

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', p1.x);
  line.setAttribute('y1', p1.y);
  line.setAttribute('x2', p2.x);
  line.setAttribute('y2', p2.y);
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', getDynamicStrokeWidth());
  line.classList.add('found-word-line');
  dom.foundLinesGroup.appendChild(line);
}

function redrawFoundLines() {
  if (state.isGameOver) return;
  dom.foundLinesGroup.innerHTML = '';
  state.activeWords.forEach(word => {
    if (state.foundWords.has(word.id)) {
      drawFoundWordLine(word.coords, word.color);
    }
  });
}

//keep line positions synced on screen resize
window.addEventListener('resize', debounce(redrawFoundLines, 100));
window.addEventListener('orientationchange', () => setTimeout(redrawFoundLines, 200));

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function getCellFromPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  if (target && target.classList.contains('grid-cell')) {
    return {
      r: parseInt(target.dataset.row, 10),
      c: parseInt(target.dataset.col, 10)
    };
  }
  return null;
}

dom.grid.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sfx.init();

  const cell = getCellFromPoint(e.clientX, e.clientY);
  if (!cell) return;

  // tap-start then tap-end on mobile touchscreens
  if (state.pinnedStartCell) {
    const start = state.pinnedStartCell;
    const lineCells = calculateLineCells(start.r, start.c, cell.r, cell.c);

    const anchorEl = getCellElement(start.r, start.c);
    if (anchorEl) anchorEl.classList.remove('start-anchor');
    state.pinnedStartCell = null;

    if (lineCells.length > 1) {
      updateLiveSelection(lineCells);
      const isWord = validateSelection(lineCells);
      setTimeout(clearLiveSelection, 200);
      if (!isWord) sfx.playTone(300, 'sine', 0.08, 0.05);
      return;
    }
  }

  state.isSelecting = true;
  state.startCell = cell;
  state.currentLineCells = [cell];

  const cellEl = getCellElement(cell.r, cell.c);
  if (cellEl) cellEl.classList.add('start-anchor');

  updateLiveSelection(state.currentLineCells);
  sfx.cellClick();
});

window.addEventListener('pointermove', (e) => {
  if (!state.isSelecting || !state.startCell) return;

  const cell = getCellFromPoint(e.clientX, e.clientY);
  if (!cell) return;

  const newLineCells = calculateLineCells(state.startCell.r, state.startCell.c, cell.r, cell.c);

  if (newLineCells.length !== state.currentLineCells.length) {
    state.currentLineCells = newLineCells;
    updateLiveSelection(state.currentLineCells);
    sfx.cellHover();
  }
});

window.addEventListener('pointerup', () => {
  if (!state.isSelecting) return;
  state.isSelecting = false;

  const startEl = state.startCell ? getCellElement(state.startCell.r, state.startCell.c) : null;

  if (state.currentLineCells.length <= 1) {
    if (state.startCell) {
      state.pinnedStartCell = state.startCell;
      if (startEl) startEl.classList.add('start-anchor');
      showToast("Tap second letter to complete word", 1800);
    }
    clearLiveSelection();
    return;
  }

  if (startEl) startEl.classList.remove('start-anchor');

  const found = validateSelection(state.currentLineCells);
  if (!found) {
    sfx.playTone(320, 'sine', 0.06, 0.04);
  }

  clearLiveSelection();
  state.startCell = null;
});

dom.btnHint.addEventListener('click', () => {
  sfx.init();

  if (state.hintsLeft <= 0) {
    showToast("No hints remaining! Keep hunting.", 2500);
    return;
  }

  const unfound = state.activeWords.filter(w => !state.foundWords.has(w.id));
  if (unfound.length === 0) return;

  const target = unfound[Math.floor(Math.random() * unfound.length)];
  const startPt = target.start;

  const isTop = startPt.r <= 7;
  const isLeft = startPt.c <= 7;

  const catLabels = {
    compute: "Compute",
    storage: "Storage",
    database: "Database",
    aiml: "AI / ML",
    networking: "Networking",
    security: "Security"
  };
  const categoryLabel = catLabels[target.category] || target.category;
  const article = target.category === 'aiml' ? 'an' : 'a';

  document.querySelectorAll('.grid-cell.quadrant-hint').forEach(el => el.classList.remove('quadrant-hint'));
  const rMin = isTop ? 0 : 7;
  const rMax = isTop ? 7 : 14;
  const cMin = isLeft ? 0 : 7;
  const cMax = isLeft ? 7 : 14;

  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) {
      const cellEl = getCellElement(r, c);
      if (cellEl && !cellEl.classList.contains('found-cell')) {
        cellEl.classList.add('quadrant-hint');
      }
    }
  }

  setTimeout(() => {
    document.querySelectorAll('.grid-cell.quadrant-hint').forEach(el => el.classList.remove('quadrant-hint'));
  }, 3500);

  sfx.hint();
  state.hintsLeft--;
  state.hintsUsed++;
  updateHintButtonUI();

  showToast(`Hint: The first word for ${article} ${categoryLabel} service (${target.name.length} letters) is hidden in this area.`, 4500);
});

function updateHintButtonUI() {
  dom.hintCounter.textContent = state.hintsLeft;
  dom.btnHint.style.opacity = state.hintsLeft === 0 ? '0.55' : '1';
}

function startTimer() {
  stopTimer();
  state.timerInterval = setInterval(() => {
    state.timerSeconds++;
    updateTimerUI();
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerUI() {
  dom.timerDisplay.textContent = formatTime(state.timerSeconds);
}

function updateProgressUI() {
  const total = state.activeWords.length;
  const found = state.foundWords.size;
  const left = total - found;

  dom.progressDisplay.textContent = `${found} / ${total}`;
  dom.remainingCountBadge.textContent = `${left} left`;
}

function showToast(text, duration = 3000) {
  dom.toastText.textContent = text;
  dom.toastMessage.classList.remove('hidden');
  clearTimeout(dom.toastMessage._timer);
  dom.toastMessage._timer = setTimeout(() => {
    dom.toastMessage.classList.add('hidden');
  }, duration);
}

function hideToast() {
  dom.toastMessage.classList.add('hidden');
}

function displayServiceInfo(word) {
  dom.infoCategory.textContent = word.category.toUpperCase();
  dom.infoTitle.textContent = word.displayName;
  dom.infoDesc.textContent = word.desc;
  dom.serviceInfoCard.classList.remove('hidden');
}

function hideServiceInfo() {
  dom.serviceInfoCard.classList.add('hidden');
}

dom.btnCloseInfo.addEventListener('click', hideServiceInfo);

dom.categoryFilters.forEach(pill => {
  pill.addEventListener('click', () => {
    dom.categoryFilters.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const filter = pill.dataset.filter;
    state.activeFilter = filter;
    filterWordList(filter);
    sfx.cellClick();
  });
});

function filterWordList(filter) {
  const cards = dom.wordList.querySelectorAll('.word-card');
  cards.forEach(card => {
    if (filter === 'all' || card.dataset.cat === filter) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

dom.btnSound.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  if (state.soundEnabled) {
    dom.soundIconOn.classList.remove('hidden');
    dom.soundIconOff.classList.add('hidden');
    sfx.playTone(660, 'sine', 0.1, 0.1);
  } else {
    dom.soundIconOn.classList.add('hidden');
    dom.soundIconOff.classList.remove('hidden');
  }
});

function onGameComplete() {
  stopTimer();
  state.isGameOver = true;
  sfx.victory();

  const elapsedSeconds = state.timerSeconds;
  dom.finalTime.textContent = formatTime(elapsedSeconds);
  dom.finalHints.textContent = state.hintsUsed;

  let rank = "Cloud Scout";
  let evalMessage = "All 14 AWS services successfully uncovered.";

  if (elapsedSeconds <= 120) {
    rank = "Apex Hunter";
    evalMessage = "Sub-2 minute finish. Incredible speed and precision.";
  } else if (elapsedSeconds <= 210) {
    rank = "Master Tracker";
    evalMessage = "Impressive run. Solved well ahead of the target time.";
  } else if (elapsedSeconds <= 330) {
    rank = "Cloud Scout";
    evalMessage = "Solid solve. Good board vision and steady execution.";
  } else {
    rank = "Pathfinder";
    evalMessage = "Board cleared. All 14 services successfully located.";
  }

  dom.finalRating.textContent = rank;
  dom.modalEvaluation.textContent = evalMessage;

  dom.victoryModal.classList.remove('hidden');
  startConfetti();
}

dom.modalBtnReplay.addEventListener('click', () => {
  stopConfetti();
  initGame();
});

dom.modalBtnReview.addEventListener('click', () => {
  stopConfetti();
  dom.victoryModal.classList.add('hidden');
});

dom.btnNewGame.addEventListener('click', () => {
  sfx.cellClick();
  initGame();
});

let confettiAnimationId = null;
const particles = [];
const CONFETTI_COLORS = ['#FF9900', '#EC7211', '#232F3E', '#008296', '#3B48CC', '#FFFFFF'];
const CONFETTI_BURST_DURATION = 3500;
const CONFETTI_FADE_DURATION = 1200;

function startConfetti() {
  stopConfetti();

  const canvas = dom.confettiCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const parent = canvas.parentElement;
  canvas.width = parent ? parent.clientWidth : 480;
  canvas.height = parent ? parent.clientHeight : 520;

  particles.length = 0;
  const particleCount = 80;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.8,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speedY: Math.random() * 2.5 + 2,
      speedX: (Math.random() - 0.5) * 1.8,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 5,
      oscillationSpeed: Math.random() * 0.04 + 0.02,
      oscillationAngle: Math.random() * Math.PI * 2
    });
  }

  const startTime = performance.now();

  function render(now) {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let globalAlpha = 1;
    if (elapsed > CONFETTI_BURST_DURATION) {
      const fadeProgress = (elapsed - CONFETTI_BURST_DURATION) / CONFETTI_FADE_DURATION;
      globalAlpha = Math.max(0, 1 - fadeProgress);
    }

    if (globalAlpha <= 0) {
      stopConfetti();
      return;
    }

    let visibleParticles = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.speedY;
      p.oscillationAngle += p.oscillationSpeed;
      p.x += p.speedX + Math.sin(p.oscillationAngle) * 0.6;
      p.rotation += p.rotSpeed;

      if (p.y > canvas.height + 20) {
        if (elapsed < CONFETTI_BURST_DURATION) {
          p.y = -15;
          p.x = Math.random() * canvas.width;
        } else {
          continue;
        }
      }

      visibleParticles++;

      ctx.save();
      ctx.globalAlpha = globalAlpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.scale(Math.cos(p.oscillationAngle), 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (visibleParticles === 0) {
      stopConfetti();
      return;
    }

    confettiAnimationId = requestAnimationFrame(render);
  }

  confettiAnimationId = requestAnimationFrame(render);
}

function stopConfetti() {
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
  }
  const canvas = dom.confettiCanvas;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initGame();
});
