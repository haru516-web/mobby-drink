import { TYPES, TYPE_MAP } from "./data.js";

const $ = (sel) => document.querySelector(sel);

const countInput = $("#countInput");
const setCountBtn = $("#setCountBtn");
const clearBtn = $("#clearBtn");
const allowDuplicates = $("#allowDuplicates");
const participantList = $("#participantList");
const participantPanel = $("#participantPanel");
const startBtn = $("#startBtn");
const appStage = document.querySelector(".appStage");
const panelParticipants = $("#panelParticipants");
const panelDraw = $("#panelDraw");
const panelSound = $("#panelSound");
const tabParticipants = $("#tabParticipants");
const tabDraw = $("#tabDraw");
const tabSound = $("#tabSound");

const buildDeckBtn = $("#buildDeckBtn");
const shuffleBtn = $("#shuffleBtn");
const drawBtn = $("#drawBtn");
const resetDrawBtn = $("#resetDrawBtn");

const deckCount = $("#deckCount");
const deckRemain = $("#deckRemain");
const pileInfo = $("#pileInfo");
const pileCard = $("#pileCard");
const drawnCard = $("#drawnCard");
const history = $("#history");

// state
let participants = []; // {id, name, typeId}
let deck = []; // array of {kind:"type", typeId} | {kind:"event"}
let drawn = null; // last drawn
let counts = new Map(); // typeId -> count
const EVENT_EVERY = 3;
const EVENT_TYPES = [
  { id: "praise", kind: "pair" },
  { id: "favtype", kind: "single" },
  { id: "game", kind: "single" },
  { id: "drink", kind: "pair" },
  { id: "all", kind: "all" },
];

// ------------------ init ------------------
function buildTypeSelect(selectedId) {
  const select = document.createElement("select");

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "未選択";
  select.appendChild(placeholder);

  const optGroupMale = document.createElement("optgroup");
  optGroupMale.label = "男子16";
  const optGroupFemale = document.createElement("optgroup");
  optGroupFemale.label = "女子16";

  for (const t of TYPES) {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.id.toUpperCase()} — ${t.label}`;
    (t.group === "male" ? optGroupMale : optGroupFemale).appendChild(opt);
  }
  select.appendChild(optGroupMale);
  select.appendChild(optGroupFemale);

  select.value = selectedId || "";
  return select;
}

// ------------------ helpers ------------------
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateStats() {
  if (deckCount) deckCount.textContent = String(deck.length);
  if (deckRemain) deckRemain.textContent = String(deck.length);
  if (pileInfo) pileInfo.textContent = "";

  if (shuffleBtn) shuffleBtn.disabled = deck.length === 0;
  drawBtn.disabled = deck.length === 0;
  resetDrawBtn.disabled = !drawn;
}

function renderParticipants() {
  participantList.innerHTML = "";
  if (participants.length === 0) {
    const li = document.createElement("li");
    li.className = "emptyRow";
    li.textContent = "参加人数を設定してください";
    participantList.appendChild(li);
    return;
  }
  participants.forEach((p, idx) => {
    const t = TYPE_MAP.get(p.typeId);
    const cupCount = p.typeId ? counts.get(p.typeId) || 0 : 0;
    const li = document.createElement("li");
    li.className = "participantItem";
    li.dataset.pid = p.id;

    const head = document.createElement("div");
    head.className = "participantHead";

    const label = document.createElement("div");
    label.className = "pLabel";
    label.textContent = `参加者 ${idx + 1}`;

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "名前";
    nameInput.className = "nameInput";
    nameInput.value = p.name || "";
    nameInput.addEventListener("input", (e) => {
      p.name = e.target.value;
    });

    const select = buildTypeSelect(p.typeId);
    select.className = "typePick";
    select.addEventListener("change", (e) => {
      const next = e.target.value;
      if (!allowDuplicates.checked && next) {
        const exists = participants.some(
          (x, i) => i !== idx && x.typeId === next
        );
        if (exists) {
          alert("同タイプは1人まで（設定で変更できます）");
          e.target.value = p.typeId || "";
          return;
        }
      }
      p.typeId = next;
      renderParticipants();
    });

    head.appendChild(label);
    head.appendChild(nameInput);
    head.appendChild(select);

    const body = document.createElement("div");
    body.className = "participantBody";

    const thumb = document.createElement("img");
    thumb.className = "thumb";
    if (!t) thumb.classList.add("thumbEmpty");
    thumb.src = t?.img || "";
    thumb.alt = t?.label || "未選択";

    const cup = document.createElement("span");
    cup.className = "cupInline";
    cup.textContent = p.typeId ? `×${cupCount}` : "";

    body.appendChild(thumb);
    body.appendChild(cup);

    li.appendChild(head);
    li.appendChild(body);
    participantList.appendChild(li);
  });
}

function setParticipantPanelOpen(isOpen) {
  if (!participantPanel) return;
  participantPanel.classList.toggle("isClosed", !isOpen);
}

function setStageVisible(isVisible) {
  if (!appStage) return;
  appStage.classList.toggle("isHidden", !isVisible);
}

function setActiveTab(tab) {
  if (tabParticipants) tabParticipants.classList.toggle("active", tab === "participants");
  if (tabDraw) tabDraw.classList.toggle("active", tab === "draw");
  if (tabSound) tabSound.classList.toggle("active", tab === "sound");
}

function showPanel(tab) {
  if (panelParticipants) panelParticipants.classList.toggle("isHidden", tab !== "participants");
  if (panelDraw) panelDraw.classList.toggle("isHidden", tab !== "draw");
  if (panelSound) panelSound.classList.toggle("isHidden", tab !== "sound");
  setActiveTab(tab);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setDrawnCard(typeId) {
  const t = TYPE_MAP.get(typeId);
  drawn = { kind: "type", typeId };
  drawnCard.classList.remove("empty");
  drawnCard.classList.remove("event");
  drawnCard.innerHTML = `
    <img src="${t?.img || ""}" alt="${t?.label || typeId}" />
    <div class="meta">
      <div class="type">${t ? `${escapeHtml(t.label)}` : ""}</div>
    </div>
  `;

  resetDrawBtn.disabled = false;
}

function pickTwoParticipants() {
  if (participants.length === 0) {
    return ["名無し", "名無し"];
  }
  if (participants.length === 1) {
    const only = participants[0].name?.trim() || "名無し";
    return [only, only];
  }
  const idx1 = Math.floor(Math.random() * participants.length);
  let idx2 = Math.floor(Math.random() * (participants.length - 1));
  if (idx2 >= idx1) idx2 += 1;
  const name1 = participants[idx1].name?.trim() || "名無し";
  const name2 = participants[idx2].name?.trim() || "名無し";
  return [name1, name2];
}

function pickOneParticipant() {
  if (participants.length === 0) return "名無し";
  const idx = Math.floor(Math.random() * participants.length);
  return participants[idx].name?.trim() || "名無し";
}

function setDrawnEvent() {
  const evt = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  let sentence = "";
  if (evt.kind === "pair") {
    const [name1, name2] = pickTwoParticipants();
    const n1 = `${name1}さん`;
    const n2 = `${name2}さん`;
    if (evt.id === "praise") {
      sentence = `${n1}が${n2}のいいところを一つ伝える`;
    } else {
      sentence = `${n1}と${n2}は一緒にグイ`;
    }
    drawn = { kind: "event", eventId: evt.id, names: [name1, name2] };
  } else if (evt.kind === "all") {
    sentence = "全員でグイ";
    drawn = { kind: "event", eventId: evt.id, names: [] };
  } else {
    const name = pickOneParticipant();
    const n1 = `${name}さん`;
    if (evt.id === "favtype") {
      sentence = `${n1}は好きなタイプを教えて下さい`;
    } else {
      sentence = `${n1}は飲みゲームを一つ提案して下さい`;
    }
    drawn = { kind: "event", eventId: evt.id, names: [name] };
  }
  drawnCard.classList.remove("empty");
  drawnCard.classList.add("event");
  drawnCard.innerHTML = `
    <div class="eventBadge">EVENT</div>
    <div class="eventBody">
      <div class="eventText">${escapeHtml(sentence)}</div>
      <div class="eventSub"></div>
    </div>
  `;
  resetDrawBtn.disabled = false;
}

function resetDrawnView() {
  drawn = null;
  drawnCard.className = "cardPreview empty";
  drawnCard.innerHTML = `<div class="emptyText">まだ引いていません</div>`;
  resetDrawBtn.disabled = true;
}

function triggerFlip() {
  drawnCard.classList.remove("flipping");
  // restart animation
  void drawnCard.offsetWidth;
  drawnCard.classList.add("flipping");
  window.setTimeout(() => {
    drawnCard.classList.remove("flipping");
  }, 700);
}

function renderCounts() {
  if (!history) {
    updateParticipantCardCounts();
    return;
  }
  history.innerHTML = "";
  const entries = Array.from(counts.entries())
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    const li = document.createElement("li");
    li.className = "emptyRow";
    li.textContent = "まだ引いていません";
    history.appendChild(li);
    return;
  }

  entries.forEach(([typeId, c]) => {
    const t = TYPE_MAP.get(typeId);
    const names = participants
      .filter((p) => p.typeId === typeId)
      .map((p) => p.name?.trim() || "名無し")
      .join(" / ");
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="historyRow">
        <span class="historyName">${names || "名無し"}</span>
        <img class="thumb" src="${t?.img || ""}" alt="${t?.label || typeId}" />
      </div>
      <span class="countBadge">×${c}</span>
    `;
    history.appendChild(li);
  });
  updateParticipantCardCounts();
}

function resetCounts() {
  counts = new Map();
  renderCounts();
}

function enforceNoDuplicates() {
  const seen = new Set();
  let changed = false;
  participants = participants.map((p) => {
    if (!p.typeId) return p;
    if (seen.has(p.typeId)) {
      changed = true;
      return { ...p, typeId: "" };
    }
    seen.add(p.typeId);
    return p;
  });
  if (changed) {
    alert("同タイプが重複していたため、重複分を未選択に戻しました");
  }
  renderParticipants();
}

function setParticipantCount(n) {
  participants = Array.from({ length: n }, () => ({
    id: uid(),
    name: "",
    typeId: "",
  }));
  deck = [];
  resetCounts();
  resetDrawnView();
  renderParticipants();
  updateStats();
}

function updateParticipantCardCounts() {
  if (!participantList) return;
  participants.forEach((p) => {
    const row = participantList.querySelector(`[data-pid="${p.id}"]`);
    if (!row) return;
    const valueEl = row.querySelector(".cupInline");
    if (!valueEl) return;
    if (!p.typeId) {
      valueEl.textContent = "";
      return;
    }
    const c = counts.get(p.typeId) || 0;
    valueEl.textContent = `×${c}`;
  });
}

// ------------------ actions ------------------
function drawOneCard() {
  if (deck.length === 0) return;

  const card = deck.shift();
  if (card.kind === "event") {
    setDrawnEvent();
  } else {
    setDrawnCard(card.typeId);
    counts.set(card.typeId, (counts.get(card.typeId) || 0) + 1);
    renderCounts();
  }
  triggerFlip();

  if (deckRemain) deckRemain.textContent = String(deck.length);

  if (deck.length === 0) {
    pileInfo.textContent = "山札がなくなりました";
    drawBtn.disabled = true;
  }
}

setCountBtn.addEventListener("click", () => {
  const n = Number.parseInt(countInput.value, 10);
  if (!Number.isFinite(n) || n <= 0) {
    alert("参加人数を正しく入力してください");
    return;
  }
  setParticipantCount(n);
});

countInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const n = Number.parseInt(countInput.value, 10);
  if (!Number.isFinite(n) || n <= 0) return;
  setParticipantCount(n);
});

clearBtn.addEventListener("click", () => {
  participants = [];
  deck = [];
  resetCounts();
  countInput.value = "";
  resetDrawnView();
  renderParticipants();
  updateStats();
});

allowDuplicates.addEventListener("change", () => {
  if (!allowDuplicates.checked) {
    enforceNoDuplicates();
  }
});

setParticipantPanelOpen(true);

// initial stage hidden until start
setStageVisible(false);
showPanel("participants");

if (buildDeckBtn) buildDeckBtn.addEventListener("click", () => {
  // legacy button (if present)
  if (participants.length === 0) {
    alert("参加人数を設定してください");
    return;
  }
  const hasEmpty = participants.some((p) => !p.typeId);
  if (hasEmpty) {
    alert("未選択の参加者があります");
    return;
  }

  // 山札は固定50枚。参加者のタイプを確率的に引いて生成（復元抽選）
  // 同じタイプが複数いても、タイプの出現確率は均等にする
  const pool = Array.from(new Set(participants.map((p) => p.typeId)));
  const normalDeck = Array.from({ length: 50 }, () => {
    const idx = Math.floor(Math.random() * pool.length);
    return { kind: "type", typeId: pool[idx] };
  });

  shuffleInPlace(normalDeck);

  // 4回引くたびに1回イベントが出るように挿入（3枚ごとに1枚イベント）
  const mixed = [];
  for (let i = 0; i < normalDeck.length; i += 1) {
    mixed.push(normalDeck[i]);
    if ((i + 1) % (EVENT_EVERY - 1) === 0) {
      mixed.push({ kind: "event" });
    }
  }
  deck = mixed;

  resetCounts();
  resetDrawnView();
  updateStats();
});

function buildDeckAndStart() {
  if (participants.length === 0) {
    alert("参加人数を設定してください");
    return false;
  }
  const hasEmpty = participants.some((p) => !p.typeId);
  if (hasEmpty) {
    alert("未選択の参加者があります");
    return false;
  }

  const pool = Array.from(new Set(participants.map((p) => p.typeId)));
  const normalDeck = Array.from({ length: 50 }, () => {
    const idx = Math.floor(Math.random() * pool.length);
    return { kind: "type", typeId: pool[idx] };
  });

  shuffleInPlace(normalDeck);

  const mixed = [];
  for (let i = 0; i < normalDeck.length; i += 1) {
    mixed.push(normalDeck[i]);
    if ((i + 1) % (EVENT_EVERY - 1) === 0) {
      mixed.push({ kind: "event" });
    }
  }
  deck = mixed;

  resetCounts();
  resetDrawnView();
  updateStats();
  if (pileInfo) pileInfo.textContent = `山札をセットしました（${deck.length}枚）`;
  return true;
}

if (startBtn) {
  startBtn.addEventListener("click", () => {
    const ok = buildDeckAndStart();
    if (!ok) return;
    setStageVisible(true);
    setParticipantPanelOpen(false);
    showPanel("draw");
  });
}

if (tabParticipants) {
  tabParticipants.addEventListener("click", () => {
    showPanel("participants");
  });
}
if (tabDraw) {
  tabDraw.addEventListener("click", () => {
    showPanel("draw");
  });
}
if (tabSound) {
  tabSound.addEventListener("click", () => {
    showPanel("sound");
  });
}

// sound buttons
const SOUND_MAP = {
  shuden: "./assets/audio/終電.mp3",
  s2: "./assets/audio/朝まで飲んじゃおっかー.mp3",
  s3: "./assets/audio/酔っぱらっちゃった.mp3",
  s4: "./assets/audio/終電.mp3",
  s5: "./assets/audio/終電.mp3",
  s6: "./assets/audio/終電.mp3",
  s7: "./assets/audio/終電.mp3",
  s8: "./assets/audio/終電.mp3",
};
const soundCache = new Map();
let currentAudio = null;
document.querySelectorAll(".soundBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.sound;
    const src = SOUND_MAP[key];
    if (!src) return;
    let audio = soundCache.get(src);
    if (!audio) {
      audio = new Audio(src);
      soundCache.set(src, audio);
    }
    if (currentAudio === audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }
    if (currentAudio && currentAudio !== audio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = audio;
    audio.currentTime = 0;
    audio.play();
  });
});

if (shuffleBtn) {
  shuffleBtn.addEventListener("click", () => {
    if (deck.length === 0) return;
    shuffleInPlace(deck);
    if (pileInfo) pileInfo.textContent = `シャッフルしました（${deck.length}枚）`;
  });
}

drawBtn.addEventListener("click", () => {
  drawOneCard();
});

resetDrawBtn.addEventListener("click", () => {
  resetDrawnView();
  updateStats();
});

// swipe to draw
let swipeStart = null;
let swipeActive = false;

if (pileCard) {
  pileCard.addEventListener("pointerdown", (e) => {
    if (deck.length === 0) return;
    swipeStart = { x: e.clientX, y: e.clientY };
    swipeActive = true;
    pileCard.classList.add("swiping");
    pileCard.setPointerCapture(e.pointerId);
  });

  pileCard.addEventListener("pointermove", (e) => {
    if (!swipeActive || !swipeStart) return;
    const dx = e.clientX - swipeStart.x;
    const dy = e.clientY - swipeStart.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      e.preventDefault();
    }
  });

  const endSwipe = (e) => {
    if (!swipeActive || !swipeStart) return;
    const dx = e.clientX - swipeStart.x;
    const dy = e.clientY - swipeStart.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 40) {
      drawOneCard();
    }
    swipeActive = false;
    swipeStart = null;
    pileCard.classList.remove("swiping");
  };

  pileCard.addEventListener("pointerup", endSwipe);
  pileCard.addEventListener("pointercancel", () => {
    swipeActive = false;
    swipeStart = null;
    pileCard.classList.remove("swiping");
  });

  // Fallback for browsers without reliable pointer events (e.g., some mobile Safari)
  const getTouchPoint = (evt) => {
    const t = evt.changedTouches?.[0] || evt.touches?.[0];
    if (!t) return null;
    return { x: t.clientX, y: t.clientY };
  };

  pileCard.addEventListener("touchstart", (e) => {
    if (deck.length === 0) return;
    const p = getTouchPoint(e);
    if (!p) return;
    swipeStart = p;
    swipeActive = true;
    pileCard.classList.add("swiping");
  }, { passive: true });

  pileCard.addEventListener("touchmove", (e) => {
    if (!swipeActive || !swipeStart) return;
    const p = getTouchPoint(e);
    if (!p) return;
    const dx = p.x - swipeStart.x;
    const dy = p.y - swipeStart.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      e.preventDefault();
    }
  }, { passive: false });

  pileCard.addEventListener("touchend", (e) => {
    if (!swipeActive || !swipeStart) return;
    const p = getTouchPoint(e);
    if (!p) return;
    const dx = p.x - swipeStart.x;
    const dy = p.y - swipeStart.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 40) {
      drawOneCard();
    }
    swipeActive = false;
    swipeStart = null;
    pileCard.classList.remove("swiping");
  });

  pileCard.addEventListener("touchcancel", () => {
    swipeActive = false;
    swipeStart = null;
    pileCard.classList.remove("swiping");
  });
}

// initial render
renderParticipants();
updateStats();
renderCounts();

