// --- content.js (KO'RINMAS REJIM) ---

console.log("Stealth Mode Activated");

let questionBank = [];
let helperBox = null;
let isModeOn = false;
let buffer = ""; 

// 1. Bazani yuklash
fetch(chrome.runtime.getURL('questions.json'))
    .then(r => r.json())
    .then(data => {
        // Bankni tozalab, faqat to'g'ri maydonlarga ega yozuvlarni saqlaymiz
        questionBank = (Array.isArray(data) ? data : []).map(item => ({
            question: (item.Xquestion || "").toString().toLowerCase().trim(),
            answer: (item.correct_answer || "").toString().trim()
        })).filter(item => item.question && item.answer);
    })
    .catch(err => console.error("Savollarni yuklashda xato", err));

// 2. Ko'rinmas yozuv joyini yaratish
function createBox() {
    if (document.getElementById('ghost-box')) return;

    helperBox = document.createElement('div');
    helperBox.id = 'ghost-box';
    (document.body || document.documentElement).appendChild(helperBox);

    // --- DIZAYN (Eng muhim qismi) ---
    Object.assign(helperBox.style, {
        position: 'fixed',
        bottom: '2px',         // Eng pastda
        left: '5px',           // Chap burchakda
        width: 'auto',
        maxWidth: '600px',
        backgroundColor: 'transparent', // ORQA FON YO'Q (Shaffof)
        
        // Rangni o'zingizga moslang:
        // rgba(0,0,0, 0.3) - Xira qora (oq fonda yaxshi)
        // rgba(255,255,255, 0.4) - Xira oq (qora fonda yaxshi)
        // Hozirgi universal kulrang:
        color: 'rgba(128, 128, 128, 0.5)', 
        
        padding: '0',
        margin: '0',
        fontSize: '11px',      // Kichkina shrift (ko'zga tashlanmaydi)
        fontFamily: 'Arial, sans-serif', // Oddiy shrift
        lineHeight: '1.1',
        zIndex: '2147483647',
        display: 'none',
        pointerEvents: 'none',  // Sichqoncha bosilganda xalaqit bermaydi
        whiteSpace: 'normal',
        overflow: 'visible',
        textOverflow: 'unset',
        padding: '2px 4px'
    });
}

// 3. Klaviatura
document.addEventListener('keydown', (event) => {
    
    // Tugma: Alt + Q (Chunki Insert ba'zan noqulay)
    // Agar Insert qulay bo'lsa: if (event.key === "Insert") deb o'zgartiring
    if (event.key === "q" && event.altKey) {
        event.preventDefault();
        
        isModeOn = !isModeOn;
        buffer = "";
        createBox();

        if (isModeOn) {
            helperBox.style.display = 'block';
            // Boshlanishiga hech narsa chiqmasin (shubhali bo'lmasligi uchun)
            helperBox.innerText = "."; 
        } else {
            helperBox.style.display = 'none';
        }
        return;
    }

    if (isModeOn) {
        event.preventDefault();
        event.stopPropagation();

        if (event.key === "Backspace") {
            buffer = buffer.slice(0, -1);
        } 
        else if (event.key.length === 1) {
            buffer += event.key;
        }

        // Qidirish
        let searchFor = buffer.toLowerCase();
        let found = null;
        
        // Kamida 2 ta harf yozganda qidirsin
           if (searchFor.length > 1) {
               found = questionBank.find(item => item.question.includes(searchFor));
        }

        // --- NATIJANI CHIQARISH (Juda ehtiyotkorona) ---
        if (found) {
            // Javob topilsa: Faqat javobning o'zi chiqadi, ortiqcha "Javob:" so'zisiz
            helperBox.innerText = found.answer;
            // Topilganda sal to'qroq qilamiz o'qish oson bo'lishi uchun
            helperBox.style.color = 'rgba(100, 100, 100, 0.9)'; 
        } else {
            // Topilmasa yoki yozayotganda: Xira ko'rinib turadi
            helperBox.innerText = buffer; 
            helperBox.style.color = 'rgba(128, 128, 128, 0.3)'; 
        }
    }
}, true);