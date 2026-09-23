/* ============================================
   ✿ Cecilia's Room — 渲染 + 音效 + 播放器 + 留言墙 + 日常板
   每段只在自己页面上启动
   ============================================ */

/* ---------- 照片编辑器：缩放 + 拖动摆位 ---------- */
function openPhotoEditor(src, outW, outH, onDone) {
  // 遮罩
  const overlay = document.createElement("div");
  overlay.className = "photo-editor-overlay";
  // 卡片
  const card = document.createElement("div");
  card.className = "photo-editor";
  card.innerHTML = `
    <p class="pe-title">调整这张照片 ✧</p>
    <canvas class="pe-canvas" width="${outW}" height="${outH}"></canvas>
    <input class="pe-slider" type="range" min="0" max="100" value="0" />
    <p class="pe-hint">滑动调远近 · 拖动照片摆位置</p>
    <div class="pe-btns">
      <button class="note-send pe-ok">用这张 ♡</button>
      <button class="note-cancel pe-no">重新选</button>
    </div>`;
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const canvas = card.querySelector(".pe-canvas");
  const slider = card.querySelector(".pe-slider");
  const cx = canvas.getContext("2d");

  const img = new Image();
  img.onload = () => {
    const frameW = outW, frameH = outH;
    const cover = Math.max(frameW / img.width, frameH / img.height);
    let scale = cover;
    let offX = (frameW - img.width * cover) / 2;
    let offY = (frameH - img.height * cover) / 2;

    function clampAll() {
      const dw = img.width * scale, dh = img.height * scale;
      offX = Math.min(0, Math.max(frameW - dw, offX));
      offY = Math.min(0, Math.max(frameH - dh, offY));
    }
    function draw() {
      clampAll();
      const dw = img.width * scale, dh = img.height * scale;
      cx.clearRect(0, 0, frameW, frameH);
      cx.drawImage(img, offX, offY, dw, dh);
 }

    slider.addEventListener("input", () => {
      scale = cover + (cover * 3 - cover) * (slider.value / 100);
      clampAll(); draw();
    });

    // 拖动
    let dragging = false, lx = 0, ly = 0;
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const k = outW / canvas.getBoundingClientRect().width;
      offX += (e.clientX - lx) * k;
      offY += (e.clientY - ly) * k;
      lx = e.clientX; ly = e.clientY;
      clampAll(); draw();
    });
    canvas.addEventListener("pointerup", () => (dragging = false));

    draw();

    card.querySelector(".pe-ok").addEventListener("click", () => {
      const out = document.createElement("canvas");
      out.width = outW; out.height = outH;
      const dw = img.width * scale, dh = img.height * scale;
      const k = outW / frameW;
      out.getContext("2d").drawImage(img, offX * k, offY * k, dw * k, dh * k);
      onDone(out.toDataURL("image/jpeg", 0.85));
      overlay.remove();
      playChime();
    });
    card.querySelector(".pe-no").addEventListener("click", () => { overlay.remove(); playPop(); });
  };
  img.src = src;
}

// ---------- 编辑暗号门（访客只能看；每次编辑都要重新输暗号） ----------
function makeEditGate(unlockBtnId, passInputId, lockRowId, onSuccess) {
  const lockRow = document.getElementById(lockRowId);
  const passInput = document.getElementById(passInputId);
  document.getElementById(unlockBtnId).addEventListener("click", () => {
    if (passInput.value === (SITE_CONTENT.whisperPassword || "apple")) {
      lockRow.classList.add("hidden");
      passInput.value = "";
      playChime();
      onSuccess();
    } else {
      passInput.value = "";
      passInput.placeholder = "暗号不对喔…再试试";
      playPlop();
    }
  });
  passInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById(unlockBtnId).click();
  });
  return () => { lockRow.classList.remove("hidden"); passInput.focus(); };
}

/* ---------- 关于我（about.html） ---------- */
if (document.getElementById("about-text")) {
  const aboutEl = document.getElementById("about-text");
  const likes = document.getElementById("likes-list");
  const editBtn = document.getElementById("about-edit");
  const channelAdd = document.getElementById("channel-add");
  const photoChange = document.getElementById("photo-change");
  const photoFile = document.getElementById("photo-file");
  const photoImg = document.getElementById("about-photo-img");
  const photoEmoji = document.getElementById("about-photo");
  const frameSizeRow = document.getElementById("frame-size-row");
  const frameSize = document.getElementById("frame-size");
  const frameCard = document.querySelector(".frame-card");
  let editMode = false;

  // 相框大小：上次调过的优先
  const savedSize = localStorage.getItem("frameSize");
  if (savedSize) { frameSize.value = savedSize; frameCard.style.width = savedSize + "px"; }
  frameSize.addEventListener("input", () => {
    frameCard.style.width = frameSize.value + "px";
    localStorage.setItem("frameSize", frameSize.value);
  });

  // 浏览器里编辑过的版本优先，否则用 content.js 里的
  aboutEl.textContent = localStorage.getItem("aboutOverride") || SITE_CONTENT.about;

  // 蝴蝶结可以换成自己的照片
  const savedPhoto = localStorage.getItem("aboutPhotoOverride");
  if (savedPhoto) { photoImg.src = savedPhoto; photoImg.classList.remove("hidden"); photoEmoji.classList.add("hidden"); }

  // ---- 频道小按键：自由增删，点了能跳页面 ----
  function getChannels() {
    let c = null;
    try { c = JSON.parse(localStorage.getItem("channelsOverride") || "null"); } catch (e) {}
    if (!Array.isArray(c)) c = (SITE_CONTENT.channels || []).slice();
    return c;
  }
  function renderChannels() {
    likes.innerHTML = "";
    getChannels().forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "like-tag channel" + (ch.url ? " has-link" : "");
      s.innerHTML = `<span class="ch-icon">${ch.icon}</span>${ch.label}`;
      if (ch.url) {
        s.title = "打开「" + ch.label + "」";
        s.addEventListener("click", () => {
          if (editMode) return;
          if (ch.url.startsWith("http")) window.open(ch.url, "_blank");
          else location.href = ch.url;
        });
      }
      if (editMode) {
        const del = document.createElement("button");
        del.className = "ch-del"; del.textContent = "×"; del.title = "删掉这个频道";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          const list = getChannels(); list.splice(i, 1);
          localStorage.setItem("channelsOverride", JSON.stringify(list));
          renderChannels(); playPop();
        });
        s.appendChild(del);
      }
      likes.appendChild(s);
    });
  }
  renderChannels();

  // 新频道小表单：emoji 直接点选（prompt 里调不出系统 emoji 键盘）
  const channelForm = document.getElementById("channel-form");
  const cfIcon = document.getElementById("cf-icon");
  const cfLabel = document.getElementById("cf-label");
  const cfUrl = document.getElementById("cf-url");
  const cfPicks = document.getElementById("cf-picks");
  ["🎀","🌸","🪻","☕","🍰","📖","📷","💌","🦋","✨","🌙","🍎","🧸","🎈","🎵","🛍"].forEach((em) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "cf-pick"; b.textContent = em;
    b.addEventListener("click", () => { cfIcon.value = em; playPop(); });
    cfPicks.appendChild(b);
  });
  channelAdd.addEventListener("click", () => {
    channelForm.classList.toggle("hidden");
    cfLabel.focus();
    playPop();
  });
  document.getElementById("cf-cancel").addEventListener("click", () => {
    channelForm.classList.add("hidden");
    cfIcon.value = cfLabel.value = cfUrl.value = "";
    cfUrl.readOnly = false;
    cfNew.textContent = "✿ 帮我建一张新页面";
    cfNew.classList.remove("done");
  });
  // 一键新建一张空白小页面：生成唯一 id，频道指向 page.html?c=xxx
  const cfNew = document.createElement("button");
  cfNew.type = "button"; cfNew.className = "cf-newpage"; cfNew.textContent = "✿ 帮我建一张新页面";
  cfUrl.insertAdjacentElement("afterend", cfNew);
  cfNew.addEventListener("click", () => {
    const id = "p" + Date.now().toString(36);
    cfUrl.value = "./page.html?c=" + id;
    cfUrl.readOnly = true;
    cfNew.textContent = "✿ 好啦！这个频道会打开一张新页面";
    cfNew.classList.add("done");
    playChime();
  });

  document.getElementById("cf-save").addEventListener("click", () => {
    const label = cfLabel.value.trim();
    if (!label) { cfLabel.focus(); return; }
    const list = getChannels();
    list.push({ icon: cfIcon.value.trim() || "✿", label, url: cfUrl.value.trim() });
    localStorage.setItem("channelsOverride", JSON.stringify(list));
    renderChannels();
    channelForm.classList.add("hidden");
    cfIcon.value = cfLabel.value = cfUrl.value = "";
    cfUrl.readOnly = false;
    cfNew.textContent = "✿ 帮我建一张新页面";
    cfNew.classList.remove("done");
    playChime();
  });

  // 换照片：压缩后存本地
  photoChange.addEventListener("click", () => photoFile.click());
  photoFile.addEventListener("change", () => {
    const file = photoFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      openPhotoEditor(reader.result, 700, 805, (data) => {
        localStorage.setItem("aboutPhotoOverride", data);
        photoImg.src = data;
        photoImg.classList.remove("hidden");
        photoEmoji.classList.add("hidden");
      });
    };
    reader.readAsDataURL(file);
  });

  // ✏️ 编辑按钮：每次都要先输暗号
  const startAboutEdit = () => {
    editMode = true;
    aboutEl.contentEditable = "true";
    aboutEl.classList.add("editing");
    channelAdd.classList.remove("hidden");
    photoChange.classList.remove("hidden");
    frameSizeRow.classList.remove("hidden");
    editBtn.textContent = "保存 ♡";
    editBtn.classList.add("saving");
    renderChannels();
    playPop();
  };
  const exitAboutEdit = () => {
    editMode = false;
    aboutEl.contentEditable = "false";
    aboutEl.classList.remove("editing");
    localStorage.setItem("aboutOverride", aboutEl.textContent);
    channelAdd.classList.add("hidden");
    photoChange.classList.add("hidden");
    frameSizeRow.classList.add("hidden");
    editBtn.textContent = "✏️ 编辑";
    editBtn.classList.remove("saving");
    renderChannels();
    playChime();
  };
  const editGateAbout = makeEditGate("about-unlock", "about-pass", "about-lock", startAboutEdit);
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      if (editMode) exitAboutEdit();
      else editGateAbout();
    });
  }
}

/* ---------- 网站名字 ---------- */
const heroName = document.getElementById("hero-name");
if (heroName && SITE_CONTENT.siteName) {
  heroName.textContent = SITE_CONTENT.siteName;
  document.title = SITE_CONTENT.siteName + " ✿";
}

/* ---------- 轻音效（现场合成） ---------- */
let audioCtx = null;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function playPop() {
  const c = ctx(), t = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(660, t);
  o.frequency.exponentialRampToValueAtTime(990, t + 0.07);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + 0.16);
}
function playChime() {
  const c = ctx(), t0 = c.currentTime;
  [1318.5, 1568, 2093].forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = f;
    const t = t0 + i * 0.07;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.9);
  });
}
function playPlop() { // 金币入水
  const c = ctx(), t = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(880, t);
  o.frequency.exponentialRampToValueAtTime(220, t + 0.28);
  g.gain.setValueAtTime(0.14, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + 0.42);
}

document.querySelectorAll(".daily-card, .like-tag, .hero-nav a, .topnav a").forEach((el) => {
  el.addEventListener("mouseenter", playPop);
});

// 潺潺流水声：噪声现场合成，不用音频文件
let waterStarted = false;
function startWaterSound() {
  if (waterStarted) return;
  waterStarted = true;
  const c = ctx();
  const len = c.sampleRate * 2;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf; src.loop = true;
  const band = c.createBiquadFilter();
  band.type = "bandpass"; band.frequency.value = 640; band.Q.value = 0.7;
  const low = c.createBiquadFilter();
  low.type = "lowpass"; low.frequency.value = 1500;
  const g = c.createGain(); g.gain.value = 0.05;
  // 缓慢起伏，像水在流动
  const lfo = c.createOscillator(); lfo.frequency.value = 0.3;
  const lfoGain = c.createGain(); lfoGain.gain.value = 260;
  lfo.connect(lfoGain).connect(band.frequency);
  src.connect(band).connect(low).connect(g).connect(c.destination);
  src.start(); lfo.start();
}

/* ---------- 许愿喷泉开场（index.html） ---------- */
if (document.getElementById("coin-btn")) {
  const wake = () => { startWaterSound(); window.removeEventListener("pointerdown", wake); };
  window.addEventListener("pointerdown", wake);
  document.getElementById("coin-btn").addEventListener("click", () => {
    const coin = document.getElementById("coin");
    const sparkle = document.getElementById("sparkle");
    const wish = document.getElementById("wish-text");
    if (coin.classList.contains("tossing")) return;
    playPlop();
    coin.classList.add("tossing");
    setTimeout(() => { sparkle.classList.add("show"); playChime(); }, 850);
    setTimeout(() => wish.classList.remove("hidden"), 1000);
    setTimeout(() => { location.href = "./home.html"; }, 2100);
  });
}

/* ---------- 音乐播放器（每页） ---------- */
const playerToggle = document.getElementById("player-toggle");
const panel = document.getElementById("player-panel");
const playBtn = document.getElementById("play-btn");
const nowEl = document.getElementById("player-now");
let playlist = [], idx = 0, audioEl = new Audio(), playing = false, musicBoxTimer = null;

function playMusicBox() {
  const c = ctx();
  const notes = [523.25, 659.25, 783.99, 659.25, 523.25, 587.33, 659.25, 587.33,
                 523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 493.88];
  const beat = 0.42;
  notes.forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = f;
    const t = c.currentTime + i * beat;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 1.5);
  });
  return notes.length * beat * 1000 + 800;
}
function buildPlaylist() {
  playlist = (SITE_CONTENT.music || []).map((f) => ({ name: f.replace(/\.[^.]+$/, ""), src: "./music/" + f }));
  if (playlist.length === 0) playlist = [{ name: "petite boîte à musique · 八音盒", src: null }];
}
function loadTrack(i) {
  idx = (i + playlist.length) % playlist.length;
  const item = playlist[idx];
  nowEl.textContent = item.name;
  if (item.src) { audioEl.src = item.src; } else { audioEl.removeAttribute("src"); }
  localStorage.setItem("roomTrack", idx);
}
function startPlay() {
  const item = playlist[idx];
  playing = true;
  playerToggle.classList.add("playing");
  playBtn.textContent = "⏸";
  localStorage.setItem("roomPlaying", "1");
  if (item.src) audioEl.play().catch(() => {});
  else {
    const loop = () => { if (!playing) return; const ms = playMusicBox(); musicBoxTimer = setTimeout(loop, ms); };
    loop();
  }
}
function stopPlay() {
  playing = false;
  playerToggle.classList.remove("playing");
  playBtn.textContent = "▶";
  audioEl.pause();
  clearTimeout(musicBoxTimer);
  localStorage.setItem("roomPlaying", "0");
}

if (playerToggle) {
  playerToggle.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!playlist.length) { buildPlaylist(); idx = +(localStorage.getItem("roomTrack") || 0); loadTrack(idx); }
  });
  playBtn.addEventListener("click", () => (playing ? stopPlay() : startPlay()));
  document.getElementById("next-btn").addEventListener("click", () => { const was = playing; if (was) stopPlay(); loadTrack(idx + 1); if (was) startPlay(); });
  document.getElementById("prev-btn").addEventListener("click", () => { const was = playing; if (was) stopPlay(); loadTrack(idx - 1); if (was) startPlay(); });
  audioEl.addEventListener("ended", () => { loadTrack(idx + 1); startPlay(); });

  buildPlaylist();
  idx = Math.min(+(localStorage.getItem("roomTrack") || 0), playlist.length - 1);
  loadTrack(idx);
  const autoResume = () => { if (localStorage.getItem("roomPlaying") === "1") startPlay(); window.removeEventListener("pointerdown", autoResume); };
  window.addEventListener("pointerdown", autoResume);
}

/* ---------- 留言墙（wall.html） ---------- */
const stage = document.getElementById("danmaku-stage");

if (stage) {
  function spawnNote(note) {
    const el = document.createElement("div");
    el.className = "danmaku";
    const name = note.name ? `<b>${note.name}</b>` : "";
    el.innerHTML = name + note.text;
    el.style.top = Math.random() * 78 + 6 + "%";
    el.style.fontSize = 0.88 + Math.random() * 0.35 + "rem";
    el.style.animationDuration = 11 + Math.random() * 7 + "s";
    // 飘完一轮就换个位置再来，让留言一直保持在墙上
    el.addEventListener("animationend", () => { el.remove(); spawnNote(note); });
    stage.appendChild(el);
  }

  let mine = [];
  try { mine = JSON.parse(localStorage.getItem("roomNotes") || "[]"); } catch (e) {}
  const all = (SITE_CONTENT.seededNotes || []).concat(mine);

  all.forEach((n, i) => setTimeout(() => spawnNote(n), i * 2200));

  document.getElementById("note-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("note-input").value.trim();
    if (!text) return;
    const note = { name: document.getElementById("note-name").value.trim(), text };
    mine.push(note);
    localStorage.setItem("roomNotes", JSON.stringify(mine));
    spawnNote(note);
    playChime();
    e.target.reset();
  });
}

/* ---------- 悄悄话板块（wall.html 第二个标签） ---------- */
const tabPublic = document.getElementById("tab-public");
const tabWhisper = document.getElementById("tab-whisper");
const panelPublic = document.getElementById("panel-public");
const panelWhisper = document.getElementById("panel-whisper");

if (tabPublic && tabWhisper) {
  // 标签切换
  tabPublic.addEventListener("click", () => {
    tabPublic.classList.add("active"); tabWhisper.classList.remove("active");
    panelPublic.classList.remove("hidden"); panelWhisper.classList.add("hidden");
    playPop();
  });
  tabWhisper.addEventListener("click", () => {
    tabWhisper.classList.add("active"); tabPublic.classList.remove("active");
    panelWhisper.classList.remove("hidden"); panelPublic.classList.add("hidden");
    playPop();
  });

  const lockBox = document.getElementById("whisper-lock");
  const whisperBox = document.getElementById("whisper-box");
  const grid = document.getElementById("whisper-grid");

  let whispers = null;
  try { whispers = JSON.parse(localStorage.getItem("whisperItems") || "null"); } catch (e) {}
  if (!Array.isArray(whispers)) whispers = (SITE_CONTENT.whispers || []).slice();
  const saveWhispers = () => localStorage.setItem("whisperItems", JSON.stringify(whispers));

  function renderWhispers() {
    grid.innerHTML = "";
    whispers.forEach((w, i) => {
      const card = document.createElement("div");
      card.className = "whisper-card";
      card.innerHTML = (w.name ? `<b>${w.name}</b>` : "<b>匿名</b>") + `<span>${w.text}</span>`;
      const del = document.createElement("button");
      del.className = "daily-del"; del.textContent = "×"; del.title = "删掉这条";
      del.addEventListener("click", () => { whispers.splice(i, 1); saveWhispers(); renderWhispers(); playPop(); });
      card.appendChild(del);
      grid.appendChild(card);
    });
  }

  function unlock() {
    lockBox.classList.add("hidden");
    whisperBox.classList.remove("hidden");
    renderWhispers();
    playChime();
  }

  // 已经解锁过就直接开
  if (sessionStorage.getItem("whisperOpen") === "1") unlock();

  document.getElementById("whisper-unlock").addEventListener("click", () => {
    if (document.getElementById("whisper-pass").value === (SITE_CONTENT.whisperPassword || "petitpomme")) {
      sessionStorage.setItem("whisperOpen", "1");
      unlock();
    } else {
      playPlop();
      document.getElementById("whisper-pass").value = "";
      document.getElementById("whisper-pass").placeholder = "暗号不对喔…再试试";
    }
  });
  document.getElementById("whisper-pass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("whisper-unlock").click();
  });

  document.getElementById("whisper-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("whisper-input").value.trim();
    if (!text) return;
    whispers.push({ name: document.getElementById("whisper-name").value.trim(), text });
    saveWhispers();
    renderWhispers();
    playChime();
    e.target.reset();
  });
}

/* ---------- 小日常板（daily.html）：自由添加删减 ---------- */
if (document.getElementById("daily-grid")) {
  const grid = document.getElementById("daily-grid");
  const addBtn = document.getElementById("daily-add");
  const editBtnDaily = document.getElementById("daily-edit");
  let dailyEditOpen = false;
  function applyDailyEditVis() {
    addBtn.classList.toggle("hidden", !dailyEditOpen);
    grid.classList.toggle("edit-on", dailyEditOpen);
    editBtnDaily.textContent = dailyEditOpen ? "完成 ♡" : "✏️ 编辑";
    if (!dailyEditOpen && !form.classList.contains("hidden")) form.classList.add("hidden");
  }
  const editGateDaily = makeEditGate("daily-unlock", "daily-pass", "daily-lock", () => {
    dailyEditOpen = true;
    applyDailyEditVis();
    playPop();
  });
  editBtnDaily.addEventListener("click", () => {
    if (dailyEditOpen) { dailyEditOpen = false; applyDailyEditVis(); playPop(); }
    else editGateDaily();
  });
  const form = document.getElementById("daily-form");
  const photoInput = document.getElementById("daily-photo");
  const photoLabel = document.getElementById("photo-label");
  const textInput = document.getElementById("daily-text");
  let pendingPhoto = "";

  let items;
  try { items = JSON.parse(localStorage.getItem("dailyItems") || "null"); } catch (e) { items = null; }
  if (!Array.isArray(items)) items = (SITE_CONTENT.daily || []).slice();

  function save() { localStorage.setItem("dailyItems", JSON.stringify(items)); }

  function render() {
    grid.innerHTML = "";
    items.forEach((item, i) => {
      const card = document.createElement("div");
      card.className = "daily-card";
      if (item.img) {
        const img = document.createElement("img");
        img.className = "daily-photo";
        img.src = item.img;
        img.alt = "日常照片";
        card.appendChild(img);
      }
      const p = document.createElement("p");
      p.className = "daily-text";
      p.textContent = item.text;
      card.appendChild(p);
      const del = document.createElement("button");
      del.className = "daily-del";
      del.textContent = "×";
      del.title = "撕掉这张";
      del.addEventListener("click", () => {
        items.splice(i, 1);
        save();
        render();
        playPop();
      });
      card.appendChild(del);
      grid.appendChild(card);
    });
  }

  // 照片选择：压缩后存本地
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    if (!file) { pendingPhoto = ""; photoLabel.textContent = "📷 选一张照片（可不选）"; return; }
    const reader = new FileReader();
    reader.onload = () => {
      openPhotoEditor(reader.result, 1000, 750, (data) => {
        pendingPhoto = data;
        photoLabel.textContent = "📷 已选好啦，换一张再点这里";
      });
    };
    reader.readAsDataURL(file);
  });

  addBtn.addEventListener("click", () => {
    form.classList.toggle("hidden");
    addBtn.classList.toggle("hidden");
    playPop();
  });
  applyDailyEditVis();
  document.getElementById("daily-cancel").addEventListener("click", () => {
    form.classList.add("hidden");
    addBtn.classList.remove("hidden");
    form.reset();
    pendingPhoto = "";
    photoLabel.textContent = "📷 选一张照片（可不选）";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = textInput.value.trim();
    if (!text && !pendingPhoto) return;
    items.push({ img: pendingPhoto, text });
    save();
    render();
    playChime();
    form.reset();
    pendingPhoto = "";
    photoLabel.textContent = "📷 选一张照片（可不选）";
    form.classList.add("hidden");
    addBtn.classList.remove("hidden");
  });

  render();
}


/* ---------- 自由小页面（page.html?c=xxx） ---------- */
if (document.getElementById("page-text") && new URLSearchParams(location.search).get("c")) {
  const pageId = new URLSearchParams(location.search).get("c");
  const pageTitle = document.getElementById("page-title");
  const pageTitleCn = document.getElementById("page-title-cn");
  const pageTextEl = document.getElementById("page-text");
  const pagePhotos = document.getElementById("page-photos");
  const pagePhotoAdd = document.getElementById("page-photo-add");
  const pagePhotoFile = document.getElementById("page-photo-file");
  const pageSave = document.getElementById("page-save");
  let pageEditMode = false;

  // 标题取自频道名
  let chs = null;
  try { chs = JSON.parse(localStorage.getItem("channelsOverride") || "null"); } catch (e) {}
  const ch = (chs || SITE_CONTENT.channels || []).find((c) => c.url && c.url.includes("c=" + pageId));
  if (ch) { pageTitle.textContent = ch.label; pageTitleCn.textContent = ch.label; document.title = ch.label + " · Cecilia's Room"; }

  // 内容存各自浏览器（和日常板一样的规则）
  let pageData;
  try { pageData = JSON.parse(localStorage.getItem("pageData_" + pageId) || "null"); } catch (e) {}
  if (!pageData) pageData = { text: "", photos: [] };

  function renderPagePhotos() {
    pagePhotos.innerHTML = "";
    pageData.photos.forEach((img, i) => {
      const card = document.createElement("div");
      card.className = "daily-card";
      const im = document.createElement("img");
      im.className = "daily-photo"; im.src = img; im.alt = "照片";
      card.appendChild(im);
      if (pageEditMode) {
        const del = document.createElement("button");
        del.className = "daily-del"; del.textContent = "×";
        del.addEventListener("click", () => { pageData.photos.splice(i, 1); savePage(); renderPagePhotos(); playPop(); });
        card.appendChild(del);
      }
      pagePhotos.appendChild(card);
    });
  }
  function savePage() {
    pageData.text = pageTextEl.innerText;
    localStorage.setItem("pageData_" + pageId, JSON.stringify(pageData));
  }

  const pageGate = makeEditGate("page-unlock", "page-pass", "page-lock", () => {
    pageEditMode = true;
    pageTextEl.contentEditable = pageEditMode ? "true" : "false";
    pageTextEl.classList.toggle("editing", pageEditMode);
    pagePhotoAdd.classList.toggle("hidden", !pageEditMode);
    pageSave.classList.toggle("hidden", !pageEditMode);
    document.getElementById("page-edit").textContent = pageEditMode ? "完成 ♡" : "✏️ 编辑";
    document.getElementById("page-edit").classList.toggle("saving", pageEditMode);
    renderPagePhotos();
    playPop();
    pageTextEl.focus();
  });
  document.getElementById("page-edit").addEventListener("click", () => {
    if (pageEditMode) {
      pageEditMode = false;
      pageTextEl.contentEditable = "false";
      pageTextEl.classList.remove("editing");
      pagePhotoAdd.classList.add("hidden");
      pageSave.classList.add("hidden");
      document.getElementById("page-edit").textContent = "✏️ 编辑";
      document.getElementById("page-edit").classList.remove("saving");
      savePage();
      renderPagePhotos();
      playChime();
    } else pageGate();
  });
  pageSave.addEventListener("click", () => { savePage(); playChime(); });
  pagePhotoAdd.addEventListener("click", () => pagePhotoFile.click());
  pagePhotoFile.addEventListener("change", () => {
    const file = pagePhotoFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      openPhotoEditor(reader.result, 1000, 750, (data) => {
        pageData.photos.push(data);
        savePage();
        renderPagePhotos();
      });
    };
    reader.readAsDataURL(file);
  });

  if (pageData.text) pageTextEl.innerText = pageData.text;
  renderPagePhotos();
}
