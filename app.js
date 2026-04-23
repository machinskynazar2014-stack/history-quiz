// ── Block & Theme definitions ──
const blocks = {
  1: { name: "Блок 1", icon: "🏺", desc: "Стародавня Україна та Середньовіччя", themes: [1, 2, 3, 4, 5] },
  2: { name: "Блок 2", icon: "⚔️", desc: "Козацька доба та Гетьманщина", themes: [6, 7, 8, 9, 10, 11] },
  3: { name: "Блок 3", icon: "📖", desc: "Україна в XIX ст.", themes: [12, 13, 14, 15, 16, 17] },
  4: { name: "Блок 4", icon: "🔥", desc: "Перша світова та Революція", themes: [18, 19, 20, 21, 22] },
  5: { name: "Блок 5", icon: "☭", desc: "Між двома світовими та WWII", themes: [23, 24, 25, 26, 27] },
  6: { name: "Блок 6", icon: "🇺🇦", desc: "Повоєнна Україна та Незалежність", themes: [28, 29, 30, 31, 32] }
};

function getThemeNumber(topicStr) {
  const match = topicStr.match(/Тема\s+(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function getThemesForBlock(blockKey) {
  const themeNums = blocks[blockKey].themes;
  const seen = new Map();
  questions.forEach(q => {
    const n = getThemeNumber(q.topic);
    if (themeNums.includes(n) && !seen.has(n)) seen.set(n, q.topic);
  });
  return Array.from(seen.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([num, topic]) => ({ num, topic }));
}

function getQuestionsForSelection(selection) {
  if (selection === "all") return questions;
  if (typeof selection === "number") {
    const themeNums = blocks[selection].themes;
    return questions.filter(q => themeNums.includes(getThemeNumber(q.topic)));
  }
  return questions.filter(q => q.topic === selection);
}

// ── State ──
let currentIndex = 0;
let score = 0;
let wrongAnswers = [];
let shuffledQuestions = [];
let selectedBlock = null;
let selectedLabel = "";
let playerName = "Гравець";
let lastFromScreen = 'start-screen';
let isNmtMode = false;

// ── Screens ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── Show themes for a block ──
function showThemesScreen(blockKey) {
  selectedBlock = blockKey;
  const block = blocks[blockKey];
  const themes = getThemesForBlock(blockKey);
  const blockQuestions = getQuestionsForSelection(blockKey);

  document.getElementById('themes-block-title').textContent = `${block.icon} ${block.name}`;
  document.getElementById('themes-block-desc').textContent = block.desc;
  document.getElementById('theme-all-count').textContent = `${blockQuestions.length} питань`;

  const list = document.getElementById('themes-list');
  list.innerHTML = '';
  themes.forEach(({ num, topic }) => {
    const count = questions.filter(q => q.topic === topic).length;
    const btn = document.createElement('button');
    btn.className = 'theme-item-btn';
    btn.innerHTML = `
      <span class="theme-num">Тема ${num}</span>
      <span class="theme-name">${topic.replace(/Тема\s+\d+\.\s*/, '')}</span>
      <span class="theme-q-count">${count} пит.</span>
    `;
    btn.addEventListener('click', () => startQuiz(topic));
    list.appendChild(btn);
  });

  showScreen('themes-screen');
}

// ── Start NMT simulation (30 random questions from all topics) ──
function startNMT() {
  playerName = document.getElementById('player-name').value.trim();
  if (!playerName) {
    document.getElementById('player-name').classList.add('name-error');
    document.getElementById('player-name').placeholder = "Введи ім'я, щоб продовжити!";
    document.getElementById('player-name').focus();
    return;
  }
  document.getElementById('player-name').classList.remove('name-error');
  isNmtMode = true;
  selectedLabel = "nmt";
  currentIndex = 0;
  score = 0;
  wrongAnswers = [];
  shuffledQuestions = shuffle(questions).slice(0, 30);
  showScreen('quiz-screen');
  renderQuestion();
}

// ── Start quiz ──
function startQuiz(selection) {
  playerName = document.getElementById('player-name').value.trim() || "Гравець";
  isNmtMode = false;
  selectedLabel = selection;
  currentIndex = 0;
  score = 0;
  wrongAnswers = [];
  shuffledQuestions = shuffle(getQuestionsForSelection(selection));
  showScreen('quiz-screen');
  renderQuestion();
}

// ── Render question ──
function renderQuestion() {
  const q = shuffledQuestions[currentIndex];
  const total = shuffledQuestions.length;

  document.getElementById('question-counter').textContent = isNmtMode
    ? `Завдання ${currentIndex + 1} / 30 — НМТ`
    : `Питання ${currentIndex + 1} / ${total}`;
  document.getElementById('topic-badge').textContent = isNmtMode ? '📝 Симулятор НМТ' : q.topic;
  document.getElementById('progress-fill').style.width = `${(currentIndex / total) * 100}%`;
  document.getElementById('question-text').textContent = q.question;

  const imgEl = document.getElementById('question-image');
  if (q.image) {
    imgEl.src = q.image;
    imgEl.classList.remove('hidden');
  } else {
    imgEl.src = '';
    imgEl.classList.add('hidden');
  }

  const container = document.getElementById('options-container');
  container.innerHTML = '';

  if (q.type === 'matching') renderMatching(q, container);
  else if (q.type === 'sequence') renderSequence(q, container);
  else if (q.type === 'multi') renderMulti(q, container);
  else renderSingle(q, container);

  document.getElementById('feedback').classList.add('hidden');
}

// ── Single choice ──
function renderSingle(q, container) {
  const labels = ['А', 'Б', 'В', 'Г'];
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-label">${labels[i]}</span> ${opt}`;
    btn.addEventListener('click', () => selectAnswer(i));
    container.appendChild(btn);
  });
}

// ── Answer (single) ──
function selectAnswer(selectedIndex) {
  const q = shuffledQuestions[currentIndex];
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(b => b.disabled = true);
  buttons[q.correct].classList.add('correct');
  if (selectedIndex !== q.correct) {
    buttons[selectedIndex].classList.add('wrong');
    wrongAnswers.push({ q, selectedIndex });
  } else {
    score++;
  }
  showFeedback(selectedIndex === q.correct, q);
}

// ── Matching question ──
function renderMatching(q, container) {
  const leftLabels = ['А', 'Б', 'В', 'Г'];
  const rightItems = [...q.pairs.map(p => p[1])].sort(() => Math.random() - 0.5);
  const rightLabels = ['1', '2', '3', '4'];

  const grid = document.createElement('div');
  grid.className = 'matching-grid';

  // right column (shuffled answers shown on top)
  const rightCol = document.createElement('div');
  rightCol.className = 'matching-right-col';
  rightItems.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'matching-right-item';
    row.innerHTML = `<span class="matching-num">${rightLabels[i]}</span> ${item}`;
    rightCol.appendChild(row);
  });
  grid.appendChild(rightCol);

  // left column with selects
  const leftCol = document.createElement('div');
  leftCol.className = 'matching-left-col';
  q.pairs.forEach((pair, i) => {
    const row = document.createElement('div');
    row.className = 'matching-row';
    const label = document.createElement('span');
    label.className = 'matching-left-label';
    label.textContent = leftLabels[i];
    const name = document.createElement('span');
    name.className = 'matching-left-name';
    name.textContent = pair[0];
    const sel = document.createElement('select');
    sel.className = 'matching-select';
    sel.dataset.idx = i;
    sel.innerHTML = `<option value="">—</option>` +
      rightLabels.map((l, j) => `<option value="${j}">${l}</option>`).join('');
    row.appendChild(label);
    row.appendChild(name);
    row.appendChild(sel);
    leftCol.appendChild(row);
  });
  grid.appendChild(leftCol);
  container.appendChild(grid);

  // store rightItems order for checking
  container.dataset.rightItems = JSON.stringify(rightItems);

  const btn = document.createElement('button');
  btn.className = 'btn btn-primary check-btn';
  btn.textContent = 'Перевірити';
  btn.addEventListener('click', () => checkMatching(q, rightItems));
  container.appendChild(btn);
}

function checkMatching(q, rightItems) {
  const selects = document.querySelectorAll('.matching-select');
  for (const sel of selects) {
    if (sel.value === '') return; // not all filled
  }
  selects.forEach(s => s.disabled = true);
  document.querySelector('.check-btn').disabled = true;

  let correct = true;
  selects.forEach((sel, i) => {
    const chosenItem = rightItems[parseInt(sel.value)];
    const isOk = chosenItem === q.pairs[i][1];
    sel.closest('.matching-row').classList.add(isOk ? 'match-correct' : 'match-wrong');
    if (!isOk) correct = false;
  });

  if (correct) score++;
  else wrongAnswers.push({ q, selectedIndex: -1 });
  showFeedback(correct, q);
}

// ── Sequence question ──
function renderSequence(q, container) {
  const shuffled = [...q.items].sort(() => Math.random() - 0.5);
  const order = [];

  const note = document.createElement('p');
  note.className = 'sequence-note';
  note.textContent = 'Клікайте на події в правильному хронологічному порядку:';
  container.appendChild(note);

  const btns = [];
  shuffled.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn sequence-btn';
    btn.dataset.item = item;
    btn.textContent = item;
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      order.push(item);
      btn.classList.add('seq-selected');
      btn.innerHTML = `<span class="seq-num">${order.length}</span> ${item}`;
      btn.disabled = true;
      if (order.length === q.items.length) {
        btns.forEach(b => b.disabled = true);
        document.querySelector('.check-btn').disabled = false;
      }
    });
    btns.push(btn);
    container.appendChild(btn);
  });

  const checkBtn = document.createElement('button');
  checkBtn.className = 'btn btn-primary check-btn';
  checkBtn.textContent = 'Перевірити';
  checkBtn.disabled = true;
  checkBtn.addEventListener('click', () => checkSequence(q, order, btns));
  container.appendChild(checkBtn);
}

function checkSequence(q, order, btns) {
  document.querySelector('.check-btn').disabled = true;
  const correct = order.every((item, i) => item === q.items[i]);

  btns.forEach(btn => {
    const item = btn.dataset.item;
    const correctPos = q.items.indexOf(item);
    const userPos = order.indexOf(item);
    btn.classList.remove('seq-selected');
    btn.classList.add(correctPos === userPos ? 'correct' : 'wrong');
    btn.innerHTML = `<span class="seq-num">${correctPos + 1}</span> ${item}`;
  });

  if (correct) score++;
  else wrongAnswers.push({ q, selectedIndex: -1 });
  showFeedback(correct, q);
}

// ── Multi choice (3 of 7) ──
function renderMulti(q, container) {
  const note = document.createElement('p');
  note.className = 'sequence-note';
  note.textContent = `Оберіть ${q.correctCount || 3} правильних відповіді:`;
  container.appendChild(note);

  const labels = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Є'];
  const needed = q.correctCount || 3;

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn multi-btn';
    btn.dataset.idx = i;
    btn.innerHTML = `<span class="option-label">${labels[i]}</span> ${opt}`;
    btn.addEventListener('click', () => {
      const selected = container.querySelectorAll('.multi-btn.multi-selected');
      if (btn.classList.contains('multi-selected')) {
        btn.classList.remove('multi-selected');
      } else if (selected.length < needed) {
        btn.classList.add('multi-selected');
      }
      const nowSelected = container.querySelectorAll('.multi-btn.multi-selected');
      const checkBtn = container.querySelector('.check-btn');
      if (checkBtn) checkBtn.disabled = nowSelected.length !== needed;
    });
    container.appendChild(btn);
  });

  const checkBtn = document.createElement('button');
  checkBtn.className = 'btn btn-primary check-btn';
  checkBtn.textContent = 'Перевірити';
  checkBtn.disabled = true;
  checkBtn.addEventListener('click', () => checkMulti(q, container));
  container.appendChild(checkBtn);
}

function checkMulti(q, container) {
  const selected = [...container.querySelectorAll('.multi-btn.multi-selected')].map(b => parseInt(b.dataset.idx));
  container.querySelectorAll('.multi-btn').forEach(b => b.disabled = true);
  document.querySelector('.check-btn').disabled = true;

  const correctSet = new Set(q.correct);
  const correct = selected.length === q.correct.length && selected.every(i => correctSet.has(i));

  container.querySelectorAll('.multi-btn').forEach(btn => {
    const idx = parseInt(btn.dataset.idx);
    if (correctSet.has(idx)) btn.classList.add('correct');
    else if (btn.classList.contains('multi-selected')) btn.classList.add('wrong');
  });

  if (correct) score++;
  else wrongAnswers.push({ q, selectedIndex: -1 });
  showFeedback(correct, q);
}

// ── Shared feedback ──
function showFeedback(isCorrect, q) {
  document.getElementById('feedback-icon').textContent = isCorrect ? '✅' : '❌';
  document.getElementById('feedback-text').textContent = isCorrect ? 'Правильно!' : 'Неправильно!';
  document.getElementById('explanation').textContent = q.explanation;
  document.getElementById('feedback').classList.remove('hidden');
}

// ── Next ──
function nextQuestion() {
  currentIndex++;
  if (currentIndex >= shuffledQuestions.length) showResults();
  else renderQuestion();
}

// ── Results ──
async function showResults() {
  const total = shuffledQuestions.length;
  const percent = Math.round((score / total) * 100);
  document.getElementById('progress-fill').style.width = '100%';

  let emoji, message, msgColor;
  if (percent >= 90)      { emoji = '🏆'; message = 'Відмінно! Ти готовий до НМТ!'; msgColor = 'rgba(46,213,115,0.15)'; }
  else if (percent >= 70) { emoji = '🎉'; message = 'Добре! Ще трохи — і буде відмінно!'; msgColor = 'rgba(245,166,35,0.15)'; }
  else if (percent >= 50) { emoji = '📚'; message = 'Непогано, але варто повторити.'; msgColor = 'rgba(255,165,0,0.15)'; }
  else                    { emoji = '💪'; message = 'Не здавайся! Повтори теми і спробуй ще раз.'; msgColor = 'rgba(233,69,96,0.15)'; }

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('score-display').textContent = `${score} / ${total}`;

  if (isNmtMode) {
    const nmtScore = Math.round(100 + (score / total) * 100);
    document.getElementById('score-percent').textContent = `${nmtScore} балів НМТ`;
  } else {
    document.getElementById('score-percent').textContent = `${percent}%`;
  }
  const gradeEl = document.getElementById('grade-message');
  gradeEl.textContent = message;
  gradeEl.style.background = msgColor;

  const wrongContainer = document.getElementById('wrong-answers');
  if (wrongAnswers.length > 0) {
    wrongContainer.innerHTML = `<p style="color:#a0b4c8;margin-bottom:10px;font-size:0.9rem;">Помилки (${wrongAnswers.length}):</p>`;
    wrongAnswers.slice(0, 3).forEach(({ q }) => {
      wrongContainer.innerHTML += `<div class="wrong-item">❌ ${q.question}</div>`;
    });
    if (wrongAnswers.length > 3)
      wrongContainer.innerHTML += `<div style="color:#7a8fa0;font-size:0.85rem;margin-top:6px;">...ще ${wrongAnswers.length - 3} помилок</div>`;
  } else {
    wrongContainer.innerHTML = '<p style="color:#2ed573;text-align:center;">🎯 Жодної помилки!</p>';
  }

  // Save score to backend
  try {
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName, score, total, topic: String(selectedLabel) })
    });
  } catch {}

  showScreen('results-screen');
}

// ── Leaderboard ──
async function showLeaderboard(fromScreen) {
  lastFromScreen = fromScreen;
  const list = document.getElementById('leaderboard-list');
  list.innerHTML = '<p style="color:#7AAAB5;text-align:center;padding:20px;">Завантаження...</p>';
  showScreen('leaderboard-screen');

  try {
    const res = await fetch('/api/leaderboard');
    const scores = await res.json();

    if (scores.length === 0) {
      list.innerHTML = '<p style="color:#7AAAB5;text-align:center;padding:20px;">Поки немає результатів. Пройди квіз першим!</p>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    list.innerHTML = scores.map((s, i) => {
      const topicLabel = s.topic === 'all' ? 'Всі теми' : s.topic;
      return `
        <div class="leaderboard-item">
          <span class="lb-rank">${medals[i] || `${i + 1}.`}</span>
          <div class="lb-info">
            <span class="lb-name">${s.playerName}</span>
            <span class="lb-topic">${topicLabel}</span>
          </div>
          <div class="lb-score">
            <span class="lb-percent">${s.percent}%</span>
            <span class="lb-points">${s.score}/${s.total}</span>
          </div>
        </div>`;
    }).join('');
  } catch {
    list.innerHTML = '<p style="color:#E74C3C;text-align:center;padding:20px;">Помилка завантаження.</p>';
  }
}

// ── Review ──
function showReview() {
  const list = document.getElementById('review-list');
  const labels = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Є'];
  list.innerHTML = '';
  if (wrongAnswers.length === 0) {
    list.innerHTML = '<p style="color:#2ed573;text-align:center;padding:20px;">Помилок немає!</p>';
  } else {
    wrongAnswers.forEach(({ q }) => {
      let correctHtml = '';
      if (q.type === 'matching') {
        correctHtml = q.pairs.map(([l, r]) => `${l} → ${r}`).join(', ');
      } else if (q.type === 'sequence') {
        correctHtml = q.items.join(' → ');
      } else if (q.type === 'multi') {
        correctHtml = q.correct.map(i => `${labels[i]}. ${q.options[i]}`).join(', ');
      } else {
        correctHtml = `${labels[q.correct]}. ${q.options[q.correct]}`;
      }
      list.innerHTML += `
        <div class="review-item">
          <div class="review-topic">${q.topic}</div>
          <div class="review-question">${q.question}</div>
          <div class="review-correct">✅ ${correctHtml}</div>
          <div class="review-explanation">💡 ${q.explanation}</div>
        </div>`;
    });
  }
  showScreen('review-screen');
}

// ── Events ──
document.getElementById('nmt-btn').addEventListener('click', startNMT);

document.getElementById('start-btn').addEventListener('click', () => {
  const name = document.getElementById('player-name').value.trim();
  if (!name) {
    document.getElementById('player-name').classList.add('name-error');
    document.getElementById('player-name').placeholder = "Введи ім'я, щоб продовжити!";
    document.getElementById('player-name').focus();
    return;
  }
  document.getElementById('player-name').classList.remove('name-error');
  showScreen('topics-screen');
});
document.getElementById('back-to-start').addEventListener('click', () => showScreen('start-screen'));
document.getElementById('back-to-blocks').addEventListener('click', () => showScreen('topics-screen'));
document.getElementById('leaderboard-btn').addEventListener('click', () => showLeaderboard('start-screen'));
document.getElementById('leaderboard-result-btn').addEventListener('click', () => showLeaderboard('results-screen'));
document.getElementById('back-from-leaderboard').addEventListener('click', () => showScreen(lastFromScreen));

document.querySelector('[data-block="all"]').addEventListener('click', () => startQuiz("all"));

document.querySelectorAll('[data-block]:not([data-block="all"])').forEach(btn => {
  btn.addEventListener('click', () => showThemesScreen(parseInt(btn.dataset.block)));
});

document.getElementById('theme-all-btn').addEventListener('click', () => startQuiz(selectedBlock));
document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('retry-btn').addEventListener('click', () => {
  if (isNmtMode) startNMT();
  else startQuiz(selectedLabel);
});
document.getElementById('review-btn').addEventListener('click', showReview);
document.getElementById('change-topic-btn').addEventListener('click', () => {
  selectedBlock ? showScreen('themes-screen') : showScreen('topics-screen');
});
document.getElementById('back-btn').addEventListener('click', () => showScreen('results-screen'));

document.getElementById('quit-btn').addEventListener('click', () => {
  if (currentIndex > 0) showResults();
  else showScreen(selectedBlock ? 'themes-screen' : 'topics-screen');
});
