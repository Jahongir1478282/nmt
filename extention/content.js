/** @format */

// --- content.js (KO'RINMAS REJIM — Ctrl+F uslubida) ---

console.log("Stealth Mode Activated v3");

let questionBank = [];
let helperBox = null;
let isModeOn = false;
let buffer = "";
let matchResults = []; // barcha topilgan natijalar
let matchIndex = 0; // hozirgi natija indeksi

// 1. Bazani yuklash — BARCHA maydonlarni o'qish (Xquestion, question)
fetch(chrome.runtime.getURL("questions.json"))
  .then((r) => {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then((data) => {
    if (!Array.isArray(data)) {
      console.error("JSON massiv emas!");
      return;
    }
    questionBank = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      // Xquestion yoki question — ikkalasini ham tekshirish
      const q = String(item.Xquestion || item.question || "")
        .toLowerCase()
        .trim();
      const a = String(item.correct_answer || "").trim();
      if (q && a) {
        questionBank.push({ question: q, answer: a });
      }
    }
    console.log(
      "Bank yuklandi: " + questionBank.length + " ta savol. Birinchi 3 ta:",
      questionBank.slice(0, 3),
    );
  })
  .catch((err) => console.error("Savollarni yuklashda xato:", err));

// 2. Ko'rinmas yozuv joyini yaratish
function createBox() {
  if (document.getElementById("ghost-box")) return;

  helperBox = document.createElement("div");
  helperBox.id = "ghost-box";
  (document.body || document.documentElement).appendChild(helperBox);

  Object.assign(helperBox.style, {
    position: "fixed",
    bottom: "2px",
    left: "5px",
    width: "auto",
    maxWidth: "700px",
    backgroundColor: "transparent",
    color: "rgba(128, 128, 128, 0.5)",
    padding: "2px 4px",
    margin: "0",
    fontSize: "11px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.2",
    zIndex: "2147483647",
    display: "none",
    pointerEvents: "none",
    whiteSpace: "normal",
    overflow: "visible",
    textOverflow: "unset",
  });
}

// 3. Qidirish funksiyasi (Ctrl+F uslubida — substring match)
function performSearch() {
  const searchFor = buffer.toLowerCase().trim();
  matchResults = [];
  matchIndex = 0;

  if (searchFor.length < 1) {
    renderResult();
    return;
  }

  // 1-bosqich: SUBSTRING qidirish — question ichida (Ctrl+F kabi aniq)
  // Masalan: "textsvm" → "iiclnvgtextsvmavbsq" ichidan topadi
  for (let i = 0; i < questionBank.length; i++) {
    if (questionBank[i].question.indexOf(searchFor) !== -1) {
      matchResults.push(questionBank[i]);
    }
  }

  // 2-bosqich: Javob ichidan ham qidirish (answer matnida)
  if (matchResults.length === 0) {
    const searchLower = searchFor;
    for (let i = 0; i < questionBank.length; i++) {
      if (questionBank[i].answer.toLowerCase().indexOf(searchLower) !== -1) {
        matchResults.push(questionBank[i]);
      }
    }
  }

  // 3-bosqich: Harflarni ketma-ket qidirish (fuzzy subsequence)
  if (matchResults.length === 0 && searchFor.length >= 2) {
    for (let i = 0; i < questionBank.length; i++) {
      const q = questionBank[i].question;
      let pos = 0;
      for (let j = 0; j < q.length && pos < searchFor.length; j++) {
        if (q[j] === searchFor[pos]) pos++;
      }
      if (pos === searchFor.length) {
        matchResults.push(questionBank[i]);
      }
    }
  }

  renderResult();
}

// 4. Natijani ko'rsatish
function renderResult() {
  if (!helperBox) return;

  if (matchResults.length > 0) {
    // Indeksni chegaralash
    if (matchIndex < 0) matchIndex = matchResults.length - 1;
    if (matchIndex >= matchResults.length) matchIndex = 0;

    const current = matchResults[matchIndex];
    const counter =
      matchResults.length > 1
        ? `[${matchIndex + 1}/${matchResults.length}] `
        : "";

    helperBox.innerText = `${counter}${current.answer}`;
    helperBox.style.color = "rgba(100, 100, 100, 0.9)";
  } else if (buffer.length > 0) {
    helperBox.innerText = buffer + " ×";
    helperBox.style.color = "rgba(180, 80, 80, 0.5)";
  } else {
    helperBox.innerText = ".";
    helperBox.style.color = "rgba(128, 128, 128, 0.3)";
  }
}

// 5. Klaviatura boshqaruvi
document.addEventListener(
  "keydown",
  (event) => {
    // Alt + Q — rejimni yoqish/o'chirish
    if (event.key === "q" && event.altKey) {
      event.preventDefault();

      isModeOn = !isModeOn;
      buffer = "";
      matchResults = [];
      matchIndex = 0;
      createBox();

      if (isModeOn) {
        helperBox.style.display = "block";
        helperBox.innerText = ".";
      } else {
        helperBox.style.display = "none";
      }
      return;
    }

    if (!isModeOn) return;

    // Navigatsiya: ↑ ↓ — natijalar orasida harakatlanish (Ctrl+F kabi)
    if (
      event.key === "ArrowDown" ||
      (event.key === "Enter" && !event.shiftKey)
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (matchResults.length > 1) {
        matchIndex++;
        renderResult();
      }
      return;
    }
    if (event.key === "ArrowUp" || (event.key === "Enter" && event.shiftKey)) {
      event.preventDefault();
      event.stopPropagation();
      if (matchResults.length > 1) {
        matchIndex--;
        renderResult();
      }
      return;
    }

    // Escape — buferni tozalash
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      buffer = "";
      matchResults = [];
      matchIndex = 0;
      renderResult();
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.key === "Backspace") {
      buffer = buffer.slice(0, -1);
    } else if (event.key.length === 1) {
      buffer += event.key;
    } else {
      return; // Ctrl, Shift va boshqa maxsus tugmalarga e'tibor bermaydi
    }

    // Har bir harf kiritilganda qayta qidirish
    matchIndex = 0;
    performSearch();
  },
  true,
);
