let allQuestions = [];
let selectedQuestions = [];
let currentIndex = 0;
let score = 0;

const TEST_COUNT = 30;
const TIME_LIMIT = 20 * 60;
let timeLeft = TIME_LIMIT;
let timerInterval;

// Массив ID вопросов, для которых есть картинки
const questionsWithImages = [253, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 289, 290, 291, 292, 293, 295, 296, 300, 301, 302, 303, 304, 450, 451, 452, 453, 454, 456, 457, 460, 461, 463, 464, 465, 466, 468, 469, 470, 471, 473, 474, 476, 477, 506, 508, 509, 510, 511, 512, 513, 514, 515, 854, 856, 930, 931, 932, 933, 934, 935, 936, 937, 938, 939, 940];

// элементы
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const questionNumberEl = document.getElementById("question-number");
const questionTextEl = document.getElementById("question-text");
const answersEl = document.getElementById("answers");
const timerEl = document.getElementById("timer");
const startScreen = document.getElementById("start-screen");
const testScreen = document.getElementById("test-screen");
const resultScreen = document.getElementById("result-screen");
const resultDiv = document.getElementById("result");

// Загрузка JSON
fetch("questions.json")
  .then(r => {
    if (!r.ok) throw new Error("Не удалось загрузить questions.json");
    return r.json();
  })
  .then(data => {
    allQuestions = data;
    console.log("Вопросов загружено:", allQuestions.length);
    startBtn.disabled = false;
    startBtn.textContent = "Начать тест";
  })
  .catch(err => {
    console.error(err);
    startBtn.textContent = "Ошибка загрузки";
  });

// старт
startBtn.addEventListener("click", startTest);
nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", startTest);

function startTest() {
  if (!allQuestions || allQuestions.length === 0) {
    alert("Вопросы ещё не загружены или отсутствуют.");
    return;
  }

  const count = Math.min(TEST_COUNT, allQuestions.length);
  if (allQuestions.length < TEST_COUNT) {
    console.warn(`Вопросов в базе меньше, чем TEST_COUNT. Используем ${count} вопросов.`);
  }

  selectedQuestions = shuffle(allQuestions).slice(0, count);
  currentIndex = 0;
  score = 0;
  timeLeft = TIME_LIMIT;

  startScreen.style.display = "none";
  resultScreen.style.display = "none";
  testScreen.style.display = "block";

  renderQuestion();
  startTimer();
}

function renderQuestion() {
  const q = selectedQuestions[currentIndex];
  if (!q) {
    console.error("Попытка отобразить несуществующий вопрос, index:", currentIndex);
    finishTest();
    return;
  }

  questionNumberEl.innerText = `Вопрос ${currentIndex + 1} из ${selectedQuestions.length}`;
  questionTextEl.innerText = q.question || "(вопрос пуст)";

  // удаляем старую подсказку о нескольких вариантах
  const oldNote = document.getElementById("multi-note");
  if (oldNote) oldNote.remove();

  // если правильных ответов >1 — добавляем красную подсказку
  if (q.correct.length > 1) {
    const note = document.createElement("div");
    note.id = "multi-note";
    note.style.color = "red";
    note.style.marginTop = "6px";
    note.style.fontWeight = "600";
    note.innerText = "Несколько правильных вариантов ответа";
    questionTextEl.appendChild(note);
  }

  // удаляем старую картинку
  const oldImg = document.getElementById("question-image");
  if (oldImg) oldImg.remove();

  // проверяем, есть ли картинка для этого вопроса
  if (questionsWithImages.includes(q.id)) {
    const img = document.createElement("img");
    img.id = "question-image";
    img.src = `images/${q.id}.png`;
    img.style.maxWidth = "100%";
    img.style.marginTop = "12px";
    img.style.borderRadius = "8px";
    questionTextEl.appendChild(img);
  }

  answersEl.innerHTML = "";

  q.answers.forEach((a, ai) => {
    const label = document.createElement("label");
    label.className = "option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = ai + 1;
    input.className = "answer";

    const span = document.createElement("span");
    span.innerText = a;

    label.appendChild(input);
    label.appendChild(span);

    label.addEventListener("click", () => {
      setTimeout(() => {
        if (input.checked) label.classList.add("selected");
        else label.classList.remove("selected");
      }, 0);
    });

    answersEl.appendChild(label);
  });

  // кнопка подсказки
  const hintBtn = document.createElement("button");
  hintBtn.innerText = "?";
  hintBtn.style.marginTop = "12px";
  hintBtn.style.background = "#facc15";
  hintBtn.style.color = "#000";
  hintBtn.style.fontWeight = "bold";
  hintBtn.style.borderRadius = "50%";
  hintBtn.style.width = "40px";
  hintBtn.style.height = "40px";
  hintBtn.style.padding = "0";
  hintBtn.title = "Показать правильный ответ";

  hintBtn.addEventListener("click", () => {
    const labels = answersEl.querySelectorAll(".option");
    q.correct.forEach(ci => {
      const lbl = labels[ci - 1];
      if (lbl) {
        lbl.style.background = "#4ade80"; // зелёная подсветка
        lbl.style.borderColor = "#22c55e";
      }
    });
  });

  answersEl.appendChild(hintBtn);
}

function nextQuestion() {
  const chosen = [...answersEl.querySelectorAll("input.answer:checked")]
    .map(cb => parseInt(cb.value));

  const correct = selectedQuestions[currentIndex].correct || [];

  if (arraysEqual(new Set(chosen), new Set(correct))) {
    score++;
  }

  currentIndex++;

  if (currentIndex < selectedQuestions.length) {
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    finishTest();
  }
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishTest();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerEl.innerText = `${m}:${s.toString().padStart(2, "0")}`;
}

function finishTest() {
  clearInterval(timerInterval);
  testScreen.style.display = "none";
  resultScreen.style.display = "block";

  const total = selectedQuestions.length;
  const percent = Math.round((score / total) * 100);

  resultDiv.innerText = percent >= 60
    ? `✅ Вы сдали! Результат: ${percent}% (${score} из ${total})`
    : `❌ Вы не сдали. Результат: ${percent}% (${score} из ${total})`;
}

// утилиты
function shuffle(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}

function arraysEqual(a, b) {
  if (a.size !== b.size) return false;
  for (let x of a) if (!b.has(x)) return false;
  return true;
}
