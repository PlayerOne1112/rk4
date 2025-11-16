let allQuestions = [];
let selectedQuestions = [];
let currentIndex = 0;
let score = 0;

const TEST_COUNT = 30;
const TIME_LIMIT = 20 * 60;

let timeLeft = TIME_LIMIT;
let timerInterval;

// вопросы с картинками
const questionsWithImages = [
  253,256,257,258,259,260,261,262,263,264,265,266,267,268,269,
  270,271,272,274,275,276,277,278,279,280,281,282,283,284,285,
  286,287,289,290,291,292,293,295,296,300,301,302,303,304,450,
  451,452,453,454,456,457,460,461,463,464,465,466,468,469,470,
  471,473,474,476,477,506,508,509,510,511,512,513,514,515,854,
  856,930,931,932,933,934,935,936,937,938,939,940
];

// элементы
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const exitBtn = document.getElementById("exit-btn");

const questionNumberEl = document.getElementById("question-number");
const questionTextEl = document.getElementById("question-text");
const answersEl = document.getElementById("answers");

const timerEl = document.getElementById("timer");
const startScreen = document.getElementById("start-screen");
const testScreen = document.getElementById("test-screen");
const resultScreen = document.getElementById("result-screen");
const resultDiv = document.getElementById("result");

// режимы
const rangeFrom = document.getElementById("range-from");
const rangeTo = document.getElementById("range-to");
const rangeShuffle = document.getElementById("range-shuffle");

// загрузка JSON
fetch("questions.json")
  .then(r => r.json())
  .then(data => {
    allQuestions = data;
    startBtn.disabled = false;
    startBtn.textContent = "Начать тест";
  })
  .catch(err => {
    console.error(err);
    startBtn.textContent = "Ошибка загрузки";
  });

// события
startBtn.addEventListener("click", startTest);
restartBtn.addEventListener("click", startTest);
nextBtn.addEventListener("click", nextQuestion);


// ------------------------------------------------
// Старт теста
// ------------------------------------------------
function startTest() {
  if (allQuestions.length === 0) {
    alert("Вопросы не загружены");
    return;
  }

  const mode = document.querySelector("input[name='mode']:checked").value;

  // режим: случайные 30
  if (mode === "random") {
    selectedQuestions = shuffle(allQuestions).slice(0, TEST_COUNT);
  }

  // режим: диапазон
  else if (mode === "range") {
    const from = parseInt(rangeFrom.value);
    const to = parseInt(rangeTo.value);

    if (isNaN(from) || isNaN(to) || from > to) {
      alert("Укажите корректный диапазон ID");
      return;
    }

    selectedQuestions = allQuestions.filter(q => q.id >= from && q.id <= to);

    if (rangeShuffle.checked) {
      selectedQuestions = shuffle(selectedQuestions);
    }
  }

  if (selectedQuestions.length === 0) {
    alert("Не найдено ни одного вопроса по условиям");
    return;
  }

  currentIndex = 0;
  score = 0;
  timeLeft = TIME_LIMIT;

  startScreen.style.display = "none";
  testScreen.style.display = "block";
  resultScreen.style.display = "none";

  renderQuestion();
  startTimer();
}


// ------------------------------------------------
// Отрисовка вопроса
// ------------------------------------------------
function renderQuestion() {
  const q = selectedQuestions[currentIndex];

  questionNumberEl.innerText =
    `Вопрос ${currentIndex + 1} из ${selectedQuestions.length} (№ ${q.id})`;

  questionTextEl.innerHTML = q.question;

  // удалить старую подсказку
  const oldNote = document.getElementById("multi-note");
  if (oldNote) oldNote.remove();

  // множественный выбор — подсказка
  if (q.correct.length > 1) {
    const note = document.createElement("div");
    note.id = "multi-note";
    note.style.color = "red";
    note.style.fontWeight = "600";
    note.style.marginTop = "6px";
    note.innerText = "Несколько правильных вариантов ответа";
    questionTextEl.appendChild(note);
  }

  // удалить старую картинку
  const oldImg = document.getElementById("question-image");
  if (oldImg) oldImg.remove();

  // добавить картинку
  if (questionsWithImages.includes(q.id)) {
    const img = document.createElement("img");
    img.id = "question-image";
    img.src = `images/${q.id}.png`;
    img.style.maxWidth = "100%";
    img.style.marginTop = "12px";
    img.style.borderRadius = "8px";
    questionTextEl.appendChild(img);
  }

  // ответы
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
        label.classList.toggle("selected", input.checked);
      }, 0);
    });

    answersEl.appendChild(label);
  });

  // Кнопка подсказки с нормальным выравниванием
  const hintBtn = document.createElement("button");
  hintBtn.innerText = "?";
  hintBtn.title = "Показать правильный ответ";

  Object.assign(hintBtn.style, {
    marginTop: "12px",
    background: "#facc15",
    color: "#000",
    fontWeight: "bold",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    cursor: "pointer"
  });

  hintBtn.addEventListener("click", () => {
    const labels = answersEl.querySelectorAll(".option");
    q.correct.forEach(index => {
      labels[index - 1].style.background = "#4ade80";
    });
  });

  answersEl.appendChild(hintBtn);
}


// ------------------------------------------------
// Следующий вопрос
// ------------------------------------------------
function nextQuestion() {
  const chosen = [...answersEl.querySelectorAll(".answer:checked")]
    .map(x => parseInt(x.value));

  const correct = selectedQuestions[currentIndex].correct;

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


// ------------------------------------------------
// Таймер
// ------------------------------------------------
function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) finishTest();
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerEl.innerText = `${m}:${s.toString().padStart(2, "0")}`;
}


// ------------------------------------------------
// Завершение
// ------------------------------------------------
function finishTest() {
  clearInterval(timerInterval);

  testScreen.style.display = "none";
  resultScreen.style.display = "block";

  const total = selectedQuestions.length;
  const percent = Math.round((score / total) * 100);

  resultDiv.innerText =
    percent >= 60
      ? `✅ Вы сдали! ${percent}% (${score} из ${total})`
      : `❌ Не сдали. ${percent}% (${score} из ${total})`;
}


// ------------------------------------------------
// Утилиты
// ------------------------------------------------
function shuffle(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}

function arraysEqual(a, b) {
  if (a.size !== b.size) return false;
  for (let x of a) if (!b.has(x)) return false;
  return true;
}
exitBtn.addEventListener("click", () => {
    if (!confirm("Вы уверены, что хотите завершить тест?")) return;

    // Сброс количества
    currentIndex = 0;
    selectedQuestions = [];
    userAnswers = [];

    // Показываем главный экран
    document.getElementById("test-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("start-screen").style.display = "block";

    // Останавливаем таймер
    clearInterval(timerInterval);
    timerInterval = null;
    timerElement.textContent = "20:00";
});
