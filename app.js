// Quiz state
let currentIndex = 0;
let score = 0;
let wrongAnswers = []; // Store wrong answers for review
let shuffledQuestions = [];

// Shuffle array helper
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Show a specific screen
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Start the quiz
function startQuiz() {
  currentIndex = 0;
  score = 0;
  wrongAnswers = [];
  shuffledQuestions = shuffle(questions);
  showScreen('quiz-screen');
  renderQuestion();
}

// Render current question
function renderQuestion() {
  const q = shuffledQuestions[currentIndex];
  const total = shuffledQuestions.length;

  // Update header
  document.getElementById('question-counter').textContent = `Питання ${currentIndex + 1} / ${total}`;
  document.getElementById('topic-badge').textContent = q.topic;
  document.getElementById('progress-fill').style.width = `${((currentIndex) / total) * 100}%`;

  // Question text
  document.getElementById('question-text').textContent = q.question;

  // Options
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

  // Hide feedback
  const feedback = document.getElementById('feedback');
  feedback.classList.add('hidden');
}

// Handle answer selection
function selectAnswer(selectedIndex) {
  const q = shuffledQuestions[currentIndex];
  const buttons = document.querySelectorAll('.option-btn');
  const feedback = document.getElementById('feedback');

  // Disable all buttons
  buttons.forEach(btn => btn.disabled = true);

  // Mark correct and wrong
  buttons[q.correct].classList.add('correct');
  if (selectedIndex !== q.correct) {
    buttons[selectedIndex].classList.add('wrong');
    wrongAnswers.push({ q, selectedIndex });
  } else {
    score++;
  }

  // Show feedback
  const isCorrect = selectedIndex === q.correct;
  document.getElementById('feedback-icon').textContent = isCorrect ? '✅' : '❌';
  document.getElementById('feedback-text').textContent = isCorrect ? 'Правильно!' : 'Неправильно!';
  document.getElementById('explanation').textContent = q.explanation;
  feedback.classList.remove('hidden');
}

// Go to next question
function nextQuestion() {
  currentIndex++;
  if (currentIndex >= shuffledQuestions.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

// Show final results
function showResults() {
  const total = shuffledQuestions.length;
  const percent = Math.round((score / total) * 100);

  // Progress bar full
  document.getElementById('progress-fill').style.width = '100%';

  // Emoji and grade
  let emoji, message, msgColor;
  if (percent >= 90) {
    emoji = '🏆'; message = 'Відмінно! Ти готовий до НМТ!'; msgColor = 'rgba(46,213,115,0.2)';
  } else if (percent >= 70) {
    emoji = '🎉'; message = 'Добре! Ще трохи підготовки — і буде відмінно!'; msgColor = 'rgba(245,166,35,0.2)';
  } else if (percent >= 50) {
    emoji = '📚'; message = 'Непогано, але варто повторити матеріал.'; msgColor = 'rgba(255,165,0,0.2)';
  } else {
    emoji = '💪'; message = 'Не здавайся! Повтори теми і спробуй ще раз.'; msgColor = 'rgba(233,69,96,0.2)';
  }

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('score-display').textContent = `${score} / ${total}`;
  document.getElementById('score-percent').textContent = `${percent}%`;

  const gradeEl = document.getElementById('grade-message');
  gradeEl.textContent = message;
  gradeEl.style.background = msgColor;

  // Wrong answers summary
  const wrongContainer = document.getElementById('wrong-answers');
  if (wrongAnswers.length > 0) {
    wrongContainer.innerHTML = `<p style="color:#a0b4c8;margin-bottom:10px;font-size:0.9rem;">Помилки (${wrongAnswers.length}):</p>`;
    wrongAnswers.slice(0, 3).forEach(({ q }) => {
      wrongContainer.innerHTML += `<div class="wrong-item">❌ ${q.question}</div>`;
    });
    if (wrongAnswers.length > 3) {
      wrongContainer.innerHTML += `<div style="color:#7a8fa0;font-size:0.85rem;margin-top:6px;">...ще ${wrongAnswers.length - 3} помилок</div>`;
    }
  } else {
    wrongContainer.innerHTML = '<p style="color:#2ed573;text-align:center;">🎯 Жодної помилки!</p>';
  }

  showScreen('results-screen');
}

// Review wrong answers
function showReview() {
  const list = document.getElementById('review-list');
  const labels = ['А', 'Б', 'В', 'Г'];
  list.innerHTML = '';

  if (wrongAnswers.length === 0) {
    list.innerHTML = '<p style="color:#2ed573;text-align:center;padding:20px;">Помилок немає — чудова робота!</p>';
  } else {
    wrongAnswers.forEach(({ q, selectedIndex }) => {
      list.innerHTML += `
        <div class="review-item">
          <div class="review-question">${q.question}</div>
          <div class="review-your">❌ Твоя відповідь: ${labels[selectedIndex]}. ${q.options[selectedIndex]}</div>
          <div class="review-correct">✅ Правильно: ${labels[q.correct]}. ${q.options[q.correct]}</div>
          <div class="review-explanation">💡 ${q.explanation}</div>
        </div>
      `;
    });
  }

  showScreen('review-screen');
}

// Event listeners
document.getElementById('start-btn').addEventListener('click', startQuiz);
document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('retry-btn').addEventListener('click', startQuiz);
document.getElementById('review-btn').addEventListener('click', showReview);
document.getElementById('back-btn').addEventListener('click', () => showScreen('results-screen'));
