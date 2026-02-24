(function () {
  'use strict';

  var questionsData = null;
  var answerPanel = null;
  var panelVisible = false;

  function safe(fn, fallback) {
    try {
      return fn();
    } catch (e) {
      return fallback !== undefined ? fallback : null;
    }
  }

  function loadBaza() {
    return new Promise(function (resolve, reject) {
      if (questionsData) {
        resolve(questionsData);
        return;
      }
      var url = chrome.runtime.getURL('baza.json');
      fetch(url)
        .then(function (r) {
          if (!r.ok) throw new Error('Yuklanmadi: ' + r.status);
          return r.json();
        })
        .then(function (data) {
          questionsData = data;
          resolve(data);
        })
        .catch(reject);
    });
  }

  function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/["'`]/g, '"')
      .toLowerCase();
  }

  function findAnswer(questionText) {
    if (!questionsData || !questionsData.questions) return null;
    if (!questionText || questionText.length < 10) return null;

    var normalized = normalizeText(questionText);
    var qWithoutNum = normalized.replace(/^\d+\s*\.\s*/, '').trim();
    var exactAnswers = [];
    var best = null;
    var bestScore = 0;

    for (var i = 0; i < questionsData.questions.length; i++) {
      var q = questionsData.questions[i];
      var qText = normalizeText(q.question || '');
      if (!qText) continue;
      var qTextClean = qText.replace(/^\d+\s*\.\s*/, '').trim();

      var score = 0;
      if (qTextClean === qWithoutNum) {
        score = 1.0;
        var ans = (q.correct_answer || '').trim();
        if (ans && exactAnswers.indexOf(ans) === -1) exactAnswers.push(ans);
      } else if (qTextClean.indexOf(qWithoutNum) !== -1) {
        score = 0.95 + (qWithoutNum.length / qTextClean.length) * 0.05;
      } else if (qWithoutNum.indexOf(qTextClean) !== -1) {
        score = 0.9 + (qTextClean.length / qWithoutNum.length) * 0.05;
      } else {
        var w1 = qWithoutNum.split(/\s+/).filter(function (w) { return w.length >= 2; });
        var w2 = qTextClean.split(/\s+/).filter(function (w) { return w.length >= 2; });
        var common = 0;
        for (var a = 0; a < w1.length; a++) {
          for (var b = 0; b < w2.length; b++) {
            if (w1[a] === w2[b] || w1[a].indexOf(w2[b]) !== -1 || w2[b].indexOf(w1[a]) !== -1) {
              common++;
              break;
            }
          }
        }
        if (w1.length > 0) {
          score = common / w1.length;
        }
      }

      if (score >= 0.92 && score > bestScore && exactAnswers.length === 0) {
        bestScore = score;
        best = q.correct_answer;
      }
    }

    if (exactAnswers.length > 0) {
      return exactAnswers;
    }
    return best;
  }

  function getQuestionText() {
    return safe(function () {
      var selectors = [
        'h4.mb--40',
        'div.rbt-single-quiz.active h4',
        'div#question-container h4',
        'div.rbt-single-quiz h4',
        'h4[class*="mb"]',
        'h4', '.question', '[class*="question"]',
        'h3', 'h2'
      ];
      for (var s = 0; s < selectors.length; s++) {
        try {
          var els = document.querySelectorAll(selectors[s]);
          for (var j = 0; j < els.length; j++) {
            var el = els[j];
            var text = (el.innerText || el.textContent || '').trim();
            if (text && text.length > 10) {
              if (/^\d+\./.test(text)) return text;
              if (text.length > 20 && text.length < 600) {
                var parent = el.parentElement;
                if (parent && (parent.className.indexOf('quiz') !== -1 || parent.className.indexOf('question') !== -1)) {
                  return text;
                }
              }
            }
          }
        } catch (err) {}
      }
      var quiz = document.querySelector('div.rbt-single-quiz.active, div.rbt-single-quiz, [class*="quiz"], [class*="question"]');
      if (quiz) {
        var h = quiz.querySelector('h4, h3, h2');
        if (h) {
          var t = (h.innerText || h.textContent || '').trim();
          if (t && t.length > 10) return t;
        }
        var allText = (quiz.innerText || quiz.textContent || '').trim();
        var lines = allText.split('\n').filter(function (l) { return l.trim().length > 10; });
        if (lines.length > 0 && /^\d+\./.test(lines[0])) return lines[0];
      }
      return '';
    }, '');
  }

  function createAnswerPanel() {
    if (answerPanel) return answerPanel;
    var host = document.createElement('div');
    host.id = 'antivirus-javob-panel';
    host.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:2147483647;';
    var shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = [
      '<style>',
      '#panel{position:relative;pointer-events:auto;background:transparent;color:#666;font-family:Segoe UI,sans-serif;',
      'width:fit-content;max-width:90vw;transition:transform 0.3s ease;}',
      '#inner{display:inline-flex;align-items:center;gap:6px;padding:6px 8px;font-size:12px;line-height:1.4;}',
      '#txt{overflow:auto;max-height:120px;line-height:1.4;color:#666;white-space:pre-line;}',
      '#cls{background:rgba(0,0,0,0.08);border:1px solid rgba(0,0,0,0.12);color:#555;width:20px;height:20px;border-radius:4px;cursor:pointer;font-size:14px;flex-shrink:0;}',
      '</style>',
      '<div id="panel"><div id="inner"><span id="txt"></span><button id="cls" title="Yopish">×</button></div></div>'
    ].join('');
    shadow.querySelector('#cls').onclick = function () { hidePanel(); };
    host.style.transform = 'translateY(100%)';
    document.body.appendChild(host);
    answerPanel = { host: host, shadow: shadow };
    return answerPanel;
  }

  function showPanel(javob, notFound) {
    var panel = createAnswerPanel();
    var textEl = panel.shadow.querySelector('#txt');
    if (notFound) {
      textEl.textContent = 'Javob topilmadi. Savolni tekshiring yoki bazaga qo\'shing.';
    } else {
      var displayText = Array.isArray(javob) && javob.length > 1
        ? javob.map(function (a, i) { return (i + 1) + ') ' + a; }).join('  |  ')
        : (Array.isArray(javob) ? javob[0] : javob);
      textEl.textContent = displayText;
    }
    panel.host.style.transform = 'translateY(0)';
    panelVisible = true;
  }

  function hidePanel() {
    if (answerPanel) {
      answerPanel.host.style.transform = 'translateY(100%)';
      panelVisible = false;
    }
  }

  function showAnswer() {
    loadBaza()
      .then(function () {
        var questionText = getQuestionText();
        if (!questionText) {
          showPanel('', true);
          return;
        }
        var javob = findAnswer(questionText);
        var hasAnswer = javob && (Array.isArray(javob) ? javob.length > 0 : true);
        showPanel(javob || '', !hasAnswer);
      })
      .catch(function () {
        showPanel('', true);
      });
  }

  function togglePanel() {
    if (panelVisible) {
      hidePanel();
    } else {
      showAnswer();
    }
  }

  document.addEventListener('mousedown', function (e) {
    if (e.button === 1) {
      e.preventDefault();
      togglePanel();
    }
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'showAnswer') {
      togglePanel();
      sendResponse({ ok: true });
    }
    return true;
  });
})();
