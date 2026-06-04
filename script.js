(function () {
  const RANKS = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const SUITS = [
    { id: "hearts", symbol: "♥", name: "Червы", color: "red" },
    { id: "diamonds", symbol: "♦", name: "Бубны", color: "red" },
    { id: "clubs", symbol: "♣", name: "Трефы", color: "black" },
    { id: "spades", symbol: "♠", name: "Пики", color: "black" },
  ];
  const I18N = {
    ru: {
      meta: "36 карт • от 6 до туза",
      title: "Пасьянс Медичи",
      controlsLabel: "Управление пасьянсом",
      next: "Ход",
      undo: "Назад",
      auto: "Авто",
      stop: "Стоп",
      reset: "Сначала",
      solvable: "Склад",
      searching: "Ищу...",
      cardsLeft: "карт осталось",
      pilesOnTable: "стопок на столе",
      moves: "ходов",
      stockStateLabel: "Состояние игры",
      boardLabel: "Игровой стол",
      initialState: "Ищу первую свертку.",
      firstCards: "Первые три карты уже на столе.",
      noMoves: "Ходов больше нет.",
      won: "Пасьянс сошелся: осталось две стопки.",
      finished: "Сверток больше нет, колода закончилась.",
      foldAvailable: (move) => `Доступна свертка: ${move.leftIndex + 1}-${move.middleIndex + 1}-${move.rightIndex + 1}.`,
      noFoldDeal: "Сверток нет: следующий ход доберет карту.",
      dealMove: (card) => `Добор: ${describeCard(card, "ru")} ушла в новую стопку.`,
      foldMove: (move) => `Свертка: стопка ${move.middleIndex + 1} легла на стопку ${move.leftIndex + 1}.`,
      seedFallback: "Seed применен как обычное перемешивание.",
      layout: "Расклад:",
      layoutSeed: (seed) => `Расклад #${seed}:`,
      rulesTitle: "Правило свертки:",
      rulesText:
        "если верхние карты левой и правой стопок в любой тройке совпадают по масти или достоинству, средняя стопка переносится на левую. Цель - закончить колоду и оставить две стопки.",
      pileAria: (index, count) => `Стопка ${index + 1}, карт: ${count}`,
      pileBadgeAria: (count) => `В стопке ${count} карт`,
      langAria: "Переключение языка",
      rankLabels: { J: "В", Q: "Д", K: "К", A: "Т" },
      suitLabels: { hearts: "ч", diamonds: "б", clubs: "т", spades: "п" },
    },
    en: {
      meta: "36 cards • 6 to ace",
      title: "Medici Solitaire",
      controlsLabel: "Solitaire controls",
      next: "Move",
      undo: "Back",
      auto: "Auto",
      stop: "Stop",
      reset: "Restart",
      solvable: "Solvable",
      searching: "Finding...",
      cardsLeft: "cards left",
      pilesOnTable: "piles on table",
      moves: "moves",
      stockStateLabel: "Game state",
      boardLabel: "Table",
      initialState: "Looking for the first fold.",
      firstCards: "The first three cards are already on the table.",
      noMoves: "No moves left.",
      won: "The solitaire is solved: two piles remain.",
      finished: "No folds left, the stock is empty.",
      foldAvailable: (move) => `Fold available: ${move.leftIndex + 1}-${move.middleIndex + 1}-${move.rightIndex + 1}.`,
      noFoldDeal: "No folds: the next move deals a card.",
      dealMove: (card) => `Deal: ${describeCard(card, "en")} went to a new pile.`,
      foldMove: (move) => `Fold: pile ${move.middleIndex + 1} moved onto pile ${move.leftIndex + 1}.`,
      seedFallback: "Seed applied as a regular shuffle.",
      layout: "Layout:",
      layoutSeed: (seed) => `Layout #${seed}:`,
      rulesTitle: "Fold rule:",
      rulesText:
        "if the top cards of the left and right piles in any three-pile group match by suit or rank, the middle pile moves onto the left pile. The goal is to finish the stock and leave two piles.",
      pileAria: (index, count) => `Pile ${index + 1}, cards: ${count}`,
      pileBadgeAria: (count) => `${count} cards in this pile`,
      langAria: "Language switch",
      rankLabels: {},
      suitLabels: { hearts: "h", diamonds: "d", clubs: "c", spades: "s" },
    },
  };

  function normalizeLanguage(value) {
    return String(value || "").toLowerCase().startsWith("ru") ? "ru" : "en";
  }

  function rankLabel(rank, lang = "ru") {
    return I18N[normalizeLanguage(lang)].rankLabels[rank] || rank;
  }

  function createDeck() {
    return RANKS.flatMap((rank) =>
      SUITS.map((suit) => ({
        rank,
        suit: suit.id,
        symbol: suit.symbol,
        color: suit.color,
        label: rankLabel(rank, "ru"),
        id: `${rank}-${suit.id}`,
      })),
    );
  }

  function seededRandom(seed) {
    let state = seed >>> 0;
    return function next() {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeedText(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function normalizeSeed(value) {
    const text = String(value ?? "").trim();
    if (/^\d+$/.test(text)) {
      const number = Number(text);
      if (Number.isSafeInteger(number)) {
        const seed = number >>> 0;
        return { seed, label: String(seed) };
      }
    }
    const seed = hashSeedText(text);
    return { seed, label: String(seed) };
  }

  function shuffle(cards, seed) {
    const result = cards.slice();
    const random = Number.isInteger(seed) ? seededRandom(seed) : Math.random;
    shuffleWithRandom(result, random);
    return result;
  }

  function shuffleWithRandom(result, random) {
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function gameFromDeck(deck) {
    return {
      stock: deck.slice(3),
      piles: deck.slice(0, 3).map((card) => [card]),
      history: [],
      undoStack: [],
      lastMove: null,
      running: false,
    };
  }

  function createGame(options = {}) {
    const deck = options.deck ? options.deck.slice() : shuffle(createDeck(), options.seed);
    return gameFromDeck(deck);
  }

  function topCard(pile) {
    return pile[pile.length - 1];
  }

  function canFold(leftPile, rightPile) {
    const left = topCard(leftPile);
    const right = topCard(rightPile);
    return Boolean(left && right && (left.rank === right.rank || left.suit === right.suit));
  }

  function findFoldMove(piles) {
    for (let index = 0; index <= piles.length - 3; index += 1) {
      if (canFold(piles[index], piles[index + 2])) {
        return { leftIndex: index, middleIndex: index + 1, rightIndex: index + 2 };
      }
    }
    return null;
  }

  function cloneState(game) {
    return {
      stock: game.stock.map((card) => ({ ...card })),
      piles: game.piles.map((pile) => pile.map((card) => ({ ...card }))),
      history: (game.history || []).map((move) => ({ ...move })),
      lastMove: game.lastMove ? { ...game.lastMove } : null,
    };
  }

  function restoreState(game, snapshot) {
    game.stock = snapshot.stock.map((card) => ({ ...card }));
    game.piles = snapshot.piles.map((pile) => pile.map((card) => ({ ...card })));
    game.history = snapshot.history.map((move) => ({ ...move }));
    game.lastMove = snapshot.lastMove ? { ...snapshot.lastMove } : null;
  }

  function rememberState(game) {
    game.undoStack = game.undoStack || [];
    game.undoStack.push(cloneState(game));
  }

  function performFold(game, move) {
    rememberState(game);
    const middlePile = game.piles[move.middleIndex];
    game.piles[move.leftIndex].push(...middlePile);
    game.piles.splice(move.middleIndex, 1);
    const result = { type: "fold", ...move, cardsMoved: middlePile.length };
    game.lastMove = result;
    game.history = game.history || [];
    game.history.push(result);
    return result;
  }

  function dealOne(game) {
    if (game.stock.length === 0) {
      const result = { type: "blocked" };
      game.lastMove = result;
      return result;
    }
    rememberState(game);
    const card = game.stock.shift();
    game.piles.push([card]);
    const result = { type: "deal", card, pileIndex: game.piles.length - 1 };
    game.lastMove = result;
    game.history = game.history || [];
    game.history.push(result);
    return result;
  }

  function undoStep(game) {
    const previous = game.undoStack && game.undoStack.pop();
    if (!previous) {
      return { type: "none" };
    }
    restoreState(game, previous);
    game.running = false;
    return { type: "undo" };
  }

  function performNextStep(game) {
    const move = game.piles.length >= 3 ? findFoldMove(game.piles) : null;
    if (move) {
      return performFold(game, move);
    }
    return dealOne(game);
  }

  function hasAvailableMove(game) {
    return game.stock.length > 0 || Boolean(findFoldMove(game.piles));
  }

  function isWon(game) {
    return game.stock.length === 0 && game.piles.length === 2;
  }

  function isFinished(game) {
    return isWon(game) || !hasAvailableMove(game);
  }

  function solvesDeck(deck) {
    const game = gameFromDeck(deck);
    let guard = 0;
    while (!isFinished(game) && guard < 500) {
      performNextStep(game);
      guard += 1;
    }
    return isWon(game);
  }

  function generateSolvableDeck(options = {}) {
    const maxAttempts = options.maxAttempts || 10000;
    const random = Number.isInteger(options.seed) ? seededRandom(options.seed) : Math.random;
    const baseDeck = createDeck();

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const candidate = shuffleWithRandom(baseDeck.slice(), random);
      if (solvesDeck(candidate)) {
        return candidate;
      }
    }

    throw new Error(`Не удалось найти складной расклад за ${maxAttempts} попыток.`);
  }

  function shortCard(card, lang = "ru") {
    const dict = I18N[normalizeLanguage(lang)];
    return `${rankLabel(card.rank, lang)}${dict.suitLabels[card.suit] || card.symbol || card.suit[0]}`;
  }

  function formatPile(pile, lang = "ru") {
    const cards = pile.map((card) => shortCard(card, lang));
    return `<${cards.join(" ")}>`;
  }

  function formatLayout(piles, lang = "ru") {
    return piles.map((pile) => formatPile(pile, lang)).join(" ");
  }

  const api = {
    RANKS,
    SUITS,
    createDeck,
    createGame,
    findFoldMove,
    formatLayout,
    generateSolvableDeck,
    normalizeLanguage,
    normalizeSeed,
    performNextStep,
    undoStep,
    isWon,
    isFinished,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof window === "undefined") {
    return;
  }

  let game = createGame();
  let currentSolvableSeed = null;
  let currentLanguage = "en";
  let autoTimer = null;

  const elements = {
    board: document.querySelector("[data-board]"),
    html: document.documentElement,
    meta: document.querySelector("[data-meta]"),
    title: document.querySelector("[data-title]"),
    controls: document.querySelector("[data-controls]"),
    languageSwitch: document.querySelector("[data-language-switch]"),
    languageButtons: Array.from(document.querySelectorAll("[data-lang]")),
    stockState: document.querySelector("[data-stock-state]"),
    stockCount: document.querySelector("[data-stock-count]"),
    stockLabel: document.querySelector("[data-stock-label]"),
    pileCount: document.querySelector("[data-pile-count]"),
    pileLabel: document.querySelector("[data-pile-label]"),
    moveCount: document.querySelector("[data-move-count]"),
    moveLabel: document.querySelector("[data-move-label]"),
    state: document.querySelector("[data-state]"),
    lastMove: document.querySelector("[data-last-move]"),
    layoutLabel: document.querySelector("[data-layout-label]"),
    layout: document.querySelector("[data-layout]"),
    peekLayer: document.querySelector("[data-peek-layer]"),
    next: document.querySelector("[data-next]"),
    undo: document.querySelector("[data-undo]"),
    auto: document.querySelector("[data-auto]"),
    reset: document.querySelector("[data-reset]"),
    solvable: document.querySelector("[data-solvable]"),
    rulesTitle: document.querySelector("[data-rules-title]"),
    rulesText: document.querySelector("[data-rules-text]"),
  };

  function t() {
    return I18N[currentLanguage];
  }

  function describeCard(card, lang = currentLanguage) {
    return `${rankLabel(card.rank, lang)}${card.symbol}`;
  }

  function describeMove(move) {
    const dict = t();
    if (!move) {
      return dict.firstCards;
    }
    if (move.type === "deal") {
      return dict.dealMove(move.card);
    }
    if (move.type === "fold") {
      return dict.foldMove(move);
    }
    if (move.type === "seed-fallback") {
      return dict.seedFallback;
    }
    return dict.noMoves;
  }

  function statusText() {
    const dict = t();
    if (isWon(game)) {
      return dict.won;
    }
    if (!hasAvailableMove(game)) {
      return dict.finished;
    }
    const nextMove = findFoldMove(game.piles);
    if (nextMove) {
      return dict.foldAvailable(nextMove);
    }
    return dict.noFoldDeal;
  }

  function createCardElement(card, className = "") {
    const cardElement = document.createElement("div");
    cardElement.className = `card ${card.color} ${className}`.trim();
    cardElement.setAttribute("aria-label", `${rankLabel(card.rank, currentLanguage)} ${card.symbol}`);
    cardElement.innerHTML = `
      <span class="corner">${rankLabel(card.rank, currentLanguage)}<span>${card.symbol}</span></span>
      <span class="pip">${card.symbol}</span>
      <span class="corner bottom">${rankLabel(card.rank, currentLanguage)}<span>${card.symbol}</span></span>
    `;
    return cardElement;
  }

  function renderPile(pile, index) {
    const pileElement = document.createElement("section");
    pileElement.className = "pile";
    pileElement.tabIndex = 0;
    pileElement.dataset.pileIndex = String(index);
    pileElement.style.setProperty("--cards", pile.length);
    pileElement.setAttribute("aria-label", t().pileAria(index, pile.length));

    if (
      game.lastMove &&
      game.lastMove.type === "fold" &&
      (game.lastMove.leftIndex === index || game.lastMove.rightIndex === index)
    ) {
      pileElement.classList.add("recent");
    }

    const previewCards = pile.slice(Math.max(0, pile.length - 8), -1);
    previewCards.forEach((card, previewIndex) => {
      const mini = createCardElement(card, "mini");
      mini.style.setProperty("--offset", previewIndex);
      pileElement.appendChild(mini);
    });

    const top = createCardElement(topCard(pile), "top");
    top.style.setProperty("--offset", previewCards.length);
    pileElement.appendChild(top);

    const badge = document.createElement("div");
    badge.className = "pile-badge";
    badge.textContent = pile.length;
    badge.setAttribute("aria-label", t().pileBadgeAria(pile.length));
    pileElement.appendChild(badge);

    return pileElement;
  }

  function showPeek(index) {
    const pile = game.piles[index];
    if (!pile) {
      return;
    }
    const cards = pile.map((card) => createCardElement(card, "peek-card"));
    elements.peekLayer.replaceChildren(...cards);
    elements.peekLayer.classList.add("visible");
    elements.peekLayer.setAttribute("aria-hidden", "false");
  }

  function hidePeek() {
    elements.peekLayer.classList.remove("visible");
    elements.peekLayer.setAttribute("aria-hidden", "true");
  }

  function render() {
    const dict = t();
    hidePeek();
    elements.html.lang = currentLanguage;
    document.title = dict.title;
    elements.meta.textContent = dict.meta;
    elements.title.textContent = dict.title;
    elements.controls.setAttribute("aria-label", dict.controlsLabel);
    elements.languageSwitch.setAttribute("aria-label", dict.langAria);
    elements.languageButtons.forEach((button) => {
      const active = button.dataset.lang === currentLanguage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.stockState.setAttribute("aria-label", dict.stockStateLabel);
    elements.board.setAttribute("aria-label", dict.boardLabel);
    elements.board.replaceChildren(...game.piles.map(renderPile));
    elements.stockCount.textContent = game.stock.length;
    elements.stockLabel.textContent = dict.cardsLeft;
    elements.pileCount.textContent = game.piles.length;
    elements.pileLabel.textContent = dict.pilesOnTable;
    elements.moveCount.textContent = game.history.length;
    elements.moveLabel.textContent = dict.moves;
    elements.state.textContent = statusText();
    elements.lastMove.textContent = describeMove(game.lastMove);
    elements.layoutLabel.textContent = currentSolvableSeed ? dict.layoutSeed(currentSolvableSeed) : dict.layout;
    elements.layout.textContent = formatLayout(game.piles, currentLanguage);
    elements.next.disabled = isFinished(game) || game.running;
    elements.next.textContent = dict.next;
    elements.undo.disabled = game.running || !game.undoStack.length;
    elements.undo.textContent = dict.undo;
    elements.auto.textContent = game.running ? dict.stop : dict.auto;
    elements.auto.classList.toggle("active", game.running);
    elements.reset.textContent = dict.reset;
    elements.solvable.textContent = elements.solvable.disabled ? dict.searching : dict.solvable;
    elements.rulesTitle.textContent = dict.rulesTitle;
    elements.rulesText.textContent = dict.rulesText;
  }

  function stopAuto() {
    game.running = false;
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
    render();
  }

  function step() {
    if (isFinished(game)) {
      stopAuto();
      return;
    }
    performNextStep(game);
    render();
    if (isFinished(game)) {
      stopAuto();
    }
  }

  function startAuto() {
    if (game.running) {
      stopAuto();
      return;
    }
    game.running = true;
    render();
    autoTimer = window.setInterval(step, 360);
  }

  function reset() {
    stopAuto();
    currentSolvableSeed = null;
    game = createGame();
    render();
  }

  function randomSeed() {
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] >>> 0;
    }
    return Math.floor(Math.random() * 4294967296) >>> 0;
  }

  function resetSolvable(seedValue) {
    stopAuto();
    const normalized = normalizeSeed(seedValue ?? randomSeed());
    elements.solvable.disabled = true;
    elements.solvable.textContent = t().searching;
    window.setTimeout(() => {
      try {
        try {
          game = createGame({ deck: generateSolvableDeck({ seed: normalized.seed }) });
        } catch (error) {
          game = createGame({ seed: normalized.seed });
          game.lastMove = { type: "seed-fallback" };
        }
        currentSolvableSeed = normalized.label;
      } finally {
        elements.solvable.disabled = false;
        render();
      }
    }, 20);
  }

  elements.next.addEventListener("click", step);
  elements.undo.addEventListener("click", () => {
    stopAuto();
    undoStep(game);
    render();
  });
  elements.auto.addEventListener("click", startAuto);
  elements.reset.addEventListener("click", reset);
  elements.solvable.addEventListener("click", () => resetSolvable());
  elements.languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentLanguage = normalizeLanguage(button.dataset.lang);
      render();
    });
  });
  elements.board.addEventListener("pointerover", (event) => {
    const pile = event.target.closest(".pile");
    if (pile && elements.board.contains(pile)) {
      showPeek(Number(pile.dataset.pileIndex));
    }
  });
  elements.board.addEventListener("focusin", (event) => {
    const pile = event.target.closest(".pile");
    if (pile && elements.board.contains(pile)) {
      showPeek(Number(pile.dataset.pileIndex));
    }
  });
  elements.board.addEventListener("pointerleave", (event) => {
    hidePeek();
  });
  elements.board.addEventListener("focusout", (event) => {
    if (!elements.board.contains(event.relatedTarget) && !elements.peekLayer.contains(event.relatedTarget)) {
      hidePeek();
    }
  });

  currentLanguage = normalizeLanguage(window.navigator && (window.navigator.language || window.navigator.userLanguage));
  const params = new URLSearchParams(window.location.search);
  if (params.has("seed")) {
    resetSolvable(params.get("seed"));
  } else {
    render();
  }
})();
