// ── Block & Theme definitions ──
const blocks = {
  1: {
    name: "Блок 1", icon: "🏺", desc: "Стародавня Україна та Середньовіччя",
    themes: [1, 2, 3]
  },
  2: {
    name: "Блок 2", icon: "⚔️", desc: "Козацька доба та Гетьманщина",
    themes: [4, 5, 6]
  },
  3: {
    name: "Блок 3", icon: "📖", desc: "Україна в XIX ст.",
    themes: [7, 8, 9]
  },
  4: {
    name: "Блок 4", icon: "🔥", desc: "Перша світова та Революція",
    themes: [10, 11]
  },
  5: {
    name: "Блок 5", icon: "☭", desc: "Між двома світовими та WWII",
    themes: [12, 13, 14]
  },
  6: {
    name: "Блок 6", icon: "🇺🇦", desc: "Повоєнна Україна та Незалежність",
    themes: [15, 16, 17]
  }
};

// Get theme number from topic string: "Тема 3. Київська держава" → 3
function getThemeNumber(topicStr) {
  const match = topicStr.match(/Тема\s+(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Get unique theme names sorted by number
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

// Filter questions by block or specific theme topic string
function getQuestionsForSelection(selection) {
  if (selection === "all") return questions;
  if (typeof selection === "number") {
    // block number
    const themeNums = blocks[selection].themes;
    return questions.filter(q => themeNums.includes(getThemeNumber(q.topic)));
  }
  // specific topic string
  return questions.filter(q => q.topic === selection);
}

// ── State ──
let currentIndex = 0;
let score = 0;
let wrongAnswers = [];
let shuffledQuestions = [];
let selectedBlock = null;
let selectedLabel = "";
let timerInterval = null;
let timeLeft = 30;
const TIME_PER_QUESTION = 30;

// ── Timer ──
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = TIME_PER_QUESTION;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) { clearInterval(timerInterval); timeExpired(); }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-display');
  el.textContent = `⏱️ 0:${timeLeft.toString().padStart(2, '0')}`;
  el.className = 'timer' + (timeLeft <= 10 ? ' timer-warning' : '');
}

function timeExpired() {
  const q = shuffledQuestions[currentIndex];
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  document.querySelectorAll('.option-btn')[q.correct].classList.add('correct');
  wrongAnswers.push({ q, selectedIndex: -1 });
  document.getElementById('feedback-icon').textContent = '⏰';
  document.getElementById('feedback-text').textContent = 'Час вийшов!';
  document.getElementById('explanation').textContent = q.explanation;
  document.getElementById('feedback').classList.remove('hidden');
}

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

// ── Start quiz ──
function startQuiz(selection) {
  selectedLabel = selection;
  currentIndex = 0;
  score = 0;
  wrongAnswers = [];
  shuffledQuestions = shuffle(getQuestionsForSelection(selection));
  showScreen('quiz-screen');
  renderQuestion();
  startTimer();
}

// ── Render question ──
function renderQuestion() {
  const q = shuffledQuestions[currentIndex];
  const total = shuffledQuestions.length;

  document.getElementById('question-counter').textContent = `Питання ${currentIndex + 1} / ${total}`;
  document.getElementById('topic-badge').textContent = q.topic;
  document.getElementById('progress-fill').style.width = `${(currentIndex / total) * 100}%`;
  document.getElementById('question-text').textContent = q.question;

  const container = document.getElementById('options-container');
  container.innerHTML = '';
  const labels = ['А', 'Б', 'В', 'Г'];
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-label">${labels[i]}</span> ${opt}`;
    btn.addEventListener('click', () => selectAnswer(i));
    container.appendChild(btn);
  });

  document.getElementById('feedback').classList.add('hidden');
  startTimer();
}

// ── Answer ──
function selectAnswer(selectedIndex) {
  clearInterval(timerInterval);
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
  const isCorrect = selectedIndex === q.correct;
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
function showResults() {
  clearInterval(timerInterval);
  const total = shuffledQuestions.length;
  const percent = Math.round((score / total) * 100);
  document.getElementById('progress-fill').style.width = '100%';

  let emoji, message, msgColor;
  if (percent >= 90)      { emoji = '🏆'; message = 'Відмінно! Ти готовий до НМТ!'; msgColor = 'rgba(46,213,115,0.2)'; }
  else if (percent >= 70) { emoji = '🎉'; message = 'Добре! Ще трохи — і буде відмінно!'; msgColor = 'rgba(245,166,35,0.2)'; }
  else if (percent >= 50) { emoji = '📚'; message = 'Непогано, але варто повторити.'; msgColor = 'rgba(255,165,0,0.2)'; }
  else                    { emoji = '💪'; message = 'Не здавайся! Повтори теми і спробуй ще раз.'; msgColor = 'rgba(233,69,96,0.2)'; }

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('score-display').textContent = `${score} / ${total}`;
  document.getElementById('score-percent').textContent = `${percent}%`;
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
  showScreen('results-screen');
}

// ── Review ──
function showReview() {
  const list = document.getElementById('review-list');
  const labels = ['А', 'Б', 'В', 'Г'];
  list.innerHTML = '';
  if (wrongAnswers.length === 0) {
    list.innerHTML = '<p style="color:#2ed573;text-align:center;padding:20px;">Помилок немає!</p>';
  } else {
    wrongAnswers.forEach(({ q, selectedIndex }) => {
      const yourAnswer = selectedIndex === -1 ? '⏰ час вийшов' : `${labels[selectedIndex]}. ${q.options[selectedIndex]}`;
      list.innerHTML += `
        <div class="review-item">
          <div class="review-topic">${q.topic}</div>
          <div class="review-question">${q.question}</div>
          <div class="review-your">❌ ${yourAnswer}</div>
          <div class="review-correct">✅ ${labels[q.correct]}. ${q.options[q.correct]}</div>
          <div class="review-explanation">💡 ${q.explanation}</div>
        </div>`;
    });
  }
  showScreen('review-screen');
}

// ── Events ──
document.getElementById('start-btn').addEventListener('click', () => showScreen('topics-screen'));
document.getElementById('back-to-start').addEventListener('click', () => showScreen('start-screen'));
document.getElementById('back-to-blocks').addEventListener('click', () => showScreen('topics-screen'));

// "Всі теми" — starts immediately
document.querySelector('[data-block="all"]').addEventListener('click', () => startQuiz("all"));

// Block cards — open theme drill-down
document.querySelectorAll('[data-block]:not([data-block="all"])').forEach(btn => {
  btn.addEventListener('click', () => showThemesScreen(parseInt(btn.dataset.block)));
});

// "Весь блок" inside themes screen
document.getElementById('theme-all-btn').addEventListener('click', () => startQuiz(selectedBlock));

document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('retry-btn').addEventListener('click', () => startQuiz(selectedLabel));
document.getElementById('review-btn').addEventListener('click', showReview);
document.getElementById('change-topic-btn').addEventListener('click', () => {
  selectedBlock ? showScreen('themes-screen') : showScreen('topics-screen');
});
document.getElementById('back-btn').addEventListener('click', () => showScreen('results-screen'));

document.getElementById('quit-btn').addEventListener('click', () => {
  clearInterval(timerInterval);
  if (currentIndex > 0) showResults();
  else showScreen(selectedBlock ? 'themes-screen' : 'topics-screen');
});
