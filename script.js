/* ─── Time gate ─────────────────────────────────── */
(function initTimeGate() {
  // London, Ontario = America/Toronto (EDT = UTC-4 in July)
  const TIMEZONE   = "America/Toronto";
  const OPEN_ISO   = "2026-07-23T00:00:00";   // midnight July 23
  const CLOSE_ISO  = "2026-07-24T00:00:00";   // midnight July 24

  // Parse a local-time ISO string as if it's in TIMEZONE
  function localTs(isoNoZ) {
    // Build a date string Intl can round-trip
    const parts = new Date(`${isoNoZ}Z`); // treat as UTC first to get structure
    // Use the offset for America/Toronto on that date
    const ref = new Date(isoNoZ + "Z");
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    });
    // Walk UTC ms until the local representation matches the target
    // Simpler: use the offset from a known summer date
    // EDT = UTC-4, so midnight Toronto = 04:00 UTC
    const [datePart, timePart] = isoNoZ.split("T");
    const utcEquiv = new Date(`${datePart}T${timePart}-04:00`);
    return utcEquiv.getTime();
  }

  const OPEN_TS  = localTs(OPEN_ISO);
  const CLOSE_TS = localTs(CLOSE_ISO);

  const tooEarlyEl  = document.getElementById("tooEarly");
  const tooLateEl   = document.getElementById("tooLate");
  const gateEl      = document.getElementById("gate");
  const tickerEl    = document.getElementById("cornerTicker");

  // Countdown els (on too-early screen)
  const cdDays  = document.getElementById("cdDays");
  const cdHours = document.getElementById("cdHours");
  const cdMins  = document.getElementById("cdMins");
  const cdSecs  = document.getElementById("cdSecs");

  function pad(n) { return String(n).padStart(2, "0"); }

  function updateCountdown(msLeft) {
    const totalSec = Math.floor(msLeft / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    cdDays.textContent  = pad(d);
    cdHours.textContent = pad(h);
    cdMins.textContent  = pad(m);
    cdSecs.textContent  = pad(s);
  }

  function updateCornerTicker(msLeft) {
    const totalSec = Math.floor(msLeft / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    tickerEl.textContent = `closes in ${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function check() {
    const now = Date.now();

    if (now < OPEN_TS) {
      // Too early — show countdown, hide everything else
      tooEarlyEl.style.display = "grid";
      tooLateEl.style.display  = "none";
      gateEl.style.display     = "none";
      updateCountdown(OPEN_TS - now);
      return "early";
    }

    if (now >= CLOSE_TS) {
      // Too late
      tooEarlyEl.style.display = "none";
      tooLateEl.style.display  = "grid";
      gateEl.style.display     = "none";
      return "late";
    }

    // In window — show the password gate
    tooEarlyEl.style.display = "none";
    tooLateEl.style.display  = "none";
    gateEl.style.display     = "grid";

    // Show corner ticker
    tickerEl.style.display = "block";
    updateCornerTicker(CLOSE_TS - now);
    return "open";
  }

  // Run once immediately
  const state = check();

  // Keep ticking every second
  if (state === "early") {
    const iv = setInterval(() => {
      const now = Date.now();
      if (now >= OPEN_TS) {
        clearInterval(iv);
        // Page will auto-refresh or user can refresh to see the gate
        location.reload();
        return;
      }
      updateCountdown(OPEN_TS - now);
    }, 1000);
  }

  if (state === "open") {
    setInterval(() => {
      const now = Date.now();
      if (now >= CLOSE_TS) { location.reload(); return; }
      updateCornerTicker(CLOSE_TS - now);
    }, 1000);
  }
})();

/* ─── Password gate ──────────────────────────────── */
(function initGate() {
  const gate       = document.getElementById("gate");
  const input      = document.getElementById("gateInput");
  const submitBtn  = document.getElementById("gateSubmit");
  const errorEl    = document.getElementById("gateError");

  // ✏️  Change the answer here — lowercase, trimmed
  const ANSWER = "fs";

  function attempt() {
    const val = input.value.trim().toLowerCase();
    if (val === ANSWER) {
      errorEl.textContent = "";
      gate.classList.add("unlocking");
      setTimeout(() => {
        gate.style.display = "none";
      }, 750);
    } else {
      errorEl.textContent = "hmm, that doesn't sound right. try again :)";
      input.classList.remove("shake");
      void input.offsetWidth;
      input.classList.add("shake");
      input.select();
    }
  }

  submitBtn.addEventListener("click", attempt);
  input.addEventListener("keydown", e => { if (e.key === "Enter") attempt(); });
})();


/* ─── Ambient music ─────────────────────────────── */
const bgMusic       = document.getElementById("bgMusic");
const musicButton   = document.getElementById("musicButton");
const musicTitle    = document.getElementById("musicTitle");
const musicSubtitle = document.getElementById("musicSubtitle");
let musicFadeTimer;
let ambientStarted  = false;

function fadeAudio(audio, targetVolume, duration = 1600) {
  window.clearInterval(musicFadeTimer);
  const startVolume = audio.volume;
  const steps = 32;
  const difference = targetVolume - startVolume;
  let step = 0;

  musicFadeTimer = window.setInterval(() => {
    step += 1;
    audio.volume = Math.max(0, Math.min(1, startVolume + difference * (step / steps)));
    if (step >= steps) {
      window.clearInterval(musicFadeTimer);
      audio.volume = targetVolume;
      if (targetVolume === 0) audio.pause();
    }
  }, duration / steps);
}

function setMusicPlaying() {
  musicButton.classList.add("playing");
  musicButton.setAttribute("aria-pressed", "true");
  musicButton.setAttribute("aria-label", "Pause ambient music");
  musicTitle.textContent = "Music is playing";
  musicSubtitle.textContent = "tap to pause";
}

function setMusicPaused() {
  musicButton.classList.remove("playing");
  musicButton.setAttribute("aria-pressed", "false");
  musicButton.setAttribute("aria-label", "Set the mood");
  musicTitle.textContent = "Set the mood";
  musicSubtitle.textContent = "press play for a little atmosphere";
}

async function startAmbient() {
  if (ambientStarted) return;
  ambientStarted = true;
  try {
    bgMusic.volume = 0;
    await bgMusic.play();
    fadeAudio(bgMusic, 0.28);
    setMusicPlaying();
  } catch { /* autoplay blocked — user can start manually */ }
}

// Auto-start on first interaction
["click", "keydown", "touchstart", "scroll"].forEach(evt =>
  window.addEventListener(evt, startAmbient, { once: true, passive: true })
);

musicButton.addEventListener("click", async (e) => {
  e.stopPropagation();
  if (!ambientStarted) {
    await startAmbient();
    return;
  }
  if (bgMusic.paused) {
    try {
      bgMusic.volume = 0;
      await bgMusic.play();
      fadeAudio(bgMusic, 0.28);
      setMusicPlaying();
    } catch {
      musicTitle.textContent = "Add ambient.mp3 first";
      musicSubtitle.textContent = "place it inside assets/audio";
    }
  } else {
    fadeAudio(bgMusic, 0, 850);
    setMusicPaused();
  }
});

bgMusic.addEventListener("error", () => {
  musicTitle.textContent = "Add ambient.mp3 first";
  musicSubtitle.textContent = "place it inside assets/audio";
});

/* ─── Birthday song button ──────────────────────── */
const bdayMusic      = document.getElementById("bdayMusic");
const bdaySongButton = document.getElementById("bdaySongButton");
const bdayEqualizer  = document.getElementById("bdayEqualizer");
let bdayFadeTimer;

function fadeBday(targetVolume, duration = 1200) {
  window.clearInterval(bdayFadeTimer);
  const startVolume = bdayMusic.volume;
  const steps = 24;
  const difference = targetVolume - startVolume;
  let step = 0;

  bdayFadeTimer = window.setInterval(() => {
    step += 1;
    bdayMusic.volume = Math.max(0, Math.min(1, startVolume + difference * (step / steps)));
    if (step >= steps) {
      window.clearInterval(bdayFadeTimer);
      bdayMusic.volume = targetVolume;
      if (targetVolume === 0) bdayMusic.pause();
    }
  }, duration / steps);
}

let bdayShowInterval = null;

function stopBirthdayShow() {
  if (bdayShowInterval) {
    clearInterval(bdayShowInterval);
    bdayShowInterval = null;
  }
}

bdaySongButton.addEventListener("click", async () => {
  if (bdayMusic.paused || bdayMusic.ended) {
    if (!bgMusic.paused) fadeAudio(bgMusic, 0.08, 800);
    try {
      bdayMusic.currentTime = 0;
      bdayMusic.volume = 0;
      await bdayMusic.play();
      fadeBday(0.9);
      bdaySongButton.classList.add("playing");
      bdaySongButton.setAttribute("aria-label", "Stop Happy Birthday song");
      bdaySongButton.querySelector("strong").textContent = "Now playing ♪";
      bdaySongButton.querySelector("small").textContent = "tap to stop";
      bdayEqualizer.style.display = "flex";
      launchBirthdayShow(bdaySongButton);
    } catch {
      bdaySongButton.querySelector("strong").textContent = "Add birthday.mp3 first";
      bdaySongButton.querySelector("small").textContent = "place it inside assets/audio";
    }
  } else {
    fadeBday(0, 600);
    stopBirthdayShow();
    if (!bgMusic.paused) fadeAudio(bgMusic, 0.28, 1000);
    bdaySongButton.classList.remove("playing");
    bdaySongButton.setAttribute("aria-label", "A birthday is incomplete without this");
    bdaySongButton.querySelector("strong").textContent = "A birthday is incomplete without this";
    bdaySongButton.querySelector("small").textContent = "go on, press it 🎉";
  }
});

// Restore ambient when birthday song ends naturally
bdayMusic.addEventListener("ended", () => {
  stopBirthdayShow();
  bdaySongButton.classList.remove("playing");
  bdaySongButton.setAttribute("aria-label", "A birthday is incomplete without this");
  bdaySongButton.querySelector("strong").textContent = "A birthday is incomplete without this";
  bdaySongButton.querySelector("small").textContent = "go on, press it 🎉";
  if (!bgMusic.paused) fadeAudio(bgMusic, 0.28, 1200);
});

bdayMusic.addEventListener("error", () => {
  bdaySongButton.querySelector("strong").textContent = "Add birthday.mp3 first";
  bdaySongButton.querySelector("small").textContent = "place it inside assets/audio";
});

/* ─── Archive loader ────────────────────────────── */
const enterButton  = document.getElementById("enterMuseum");
const loader       = document.getElementById("archiveLoader");
const loaderLines  = document.getElementById("loaderLines");
const firstSection = document.querySelector("main .section");
const secretToast  = document.getElementById("secretToast");

const loadingMessages = [
  "Collecting conversations...",
  "Finding recommendations...",
  "Dusting off old jokes...",
  "Brewing tea... ☕",
  "Archive ready."
];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

enterButton.addEventListener("click", async () => {
  loaderLines.innerHTML = "";
  loader.classList.add("visible");
  loader.setAttribute("aria-hidden", "false");

  for (const message of loadingMessages) {
    const line = document.createElement("p");
    line.className = "loader-line";
    line.textContent = message;
    loaderLines.appendChild(line);
    await wait(180);
    line.classList.add("show");
    await wait(280);
  }

  await wait(280);
  loader.classList.remove("visible");
  loader.setAttribute("aria-hidden", "true");
  await wait(300);
  firstSection.scrollIntoView({ behavior: "smooth" });
});

/* ─── Scroll: progress bar + back-to-top + final message reveal ─ */
const scrollProgress = document.getElementById("scrollProgress");
const backToTop      = document.getElementById("backToTop");
const finalMessage   = document.querySelector(".final-message");

window.addEventListener("scroll", () => {
  const scrolled = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const pct = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
  scrollProgress.style.width = pct + "%";

  if (scrolled > 600) {
    backToTop.classList.add("visible");
  } else {
    backToTop.classList.remove("visible");
  }

  // Reveal final message paragraphs when in view
  if (finalMessage) {
    const rect = finalMessage.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      finalMessage.classList.add("revealed");
    }
  }
}, { passive: true });

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ─── Section reveal (IntersectionObserver) ─────── */
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".reveal").forEach(section => observer.observe(section));

/* ─── Cursor glow ───────────────────────────────── */
document.addEventListener("pointermove", event => {
  const glow = document.querySelector(".cursor-glow");
  glow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
});

/* ─── Floating particles ────────────────────────── */
(function spawnParticles() {
  const container = document.getElementById("particlesContainer");
  const colors = [
    "rgba(236, 170, 200, VAR)",
    "rgba(180, 155, 228, VAR)",
    "rgba(255, 200, 180, VAR)",
    "rgba(210, 175, 240, VAR)",
    "rgba(255, 180, 210, VAR)"
  ];

  for (let i = 0; i < 22; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = 4 + Math.random() * 10;
    const op = (0.2 + Math.random() * 0.4).toFixed(2);
    const color = colors[Math.floor(Math.random() * colors.length)].replace("VAR", op);
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      bottom: ${-size}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      --dur: ${9 + Math.random() * 14}s;
      --delay: ${-Math.random() * 20}s;
      --op: ${op};
    `;
    container.appendChild(p);
  }
})();

/* ─── Secret toast helper ───────────────────────── */
function showSecret(message) {
  secretToast.textContent = message;
  secretToast.classList.add("show");
  clearTimeout(showSecret.timer);
  showSecret.timer = setTimeout(() => secretToast.classList.remove("show"), 2800);
}

/* ─── Secret interactions ───────────────────────── */
document.querySelector(".tea-card").addEventListener("dblclick", () => {
  showSecret("Secret found: emergency tea break unlocked. ☕");
  spawnHearts(document.querySelector(".tea-card"));
});

document.querySelector(".bird-card").addEventListener("click", event => {
  if (event.detail === 3) showSecret("A tiny bird approves of this investigation. 🐦");
});

document.querySelectorAll(".gif-card").forEach(card => {
  card.addEventListener("click", () => {
    card.classList.toggle("playing");
    const type = card.dataset.gif;
    const messages = {
      kelly: "Kelly Kapoor energy activated.",
      dhappa: "Dhappa mode activated.",
      reaction: "Exactly the correct reaction."
    };
    showSecret(messages[type]);
  });
});

/* ─── Wish cloud pop ────────────────────────────── */
document.querySelectorAll(".wish-cloud span").forEach(span => {
  span.addEventListener("click", () => {
    span.classList.remove("popped");
    void span.offsetWidth; // reflow to restart
    span.classList.add("popped");
    spawnHearts(span, 4);
  });
});

/* ─── Heart float helper ────────────────────────── */
function spawnHearts(anchor, count = 6) {
  const rect = anchor.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const h = document.createElement("div");
    h.textContent = ["❤️", "🩷", "✨"][Math.floor(Math.random() * 3)];
    h.style.cssText = `
      position: fixed;
      left: ${cx + (Math.random() - 0.5) * 60}px;
      top: ${cy}px;
      font-size: ${0.8 + Math.random() * 0.8}rem;
      pointer-events: none;
      z-index: 600;
      animation: heartFloat ${0.8 + Math.random() * 0.6}s ease-out forwards;
      animation-delay: ${i * 0.08}s;
    `;
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1600);
  }
}

/* ─── Confetti helper ───────────────────────────── */
function launchConfetti(count = 70, delayOffset = 0) {
  const colors = ["#c977a1", "#9277c5", "#f0c0d8", "#e8d5f5", "#f7c59f", "#a8d8a8"];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const color = colors[Math.floor(Math.random() * colors.length)];
    const startX = 5 + Math.random() * 90;
    const isCircle = Math.random() > 0.5;
    const dur = 1.4 + Math.random() * 1.4;
    const delay = delayOffset + Math.random() * 0.8;
    piece.style.cssText = `
      left: ${startX}vw;
      top: -10px;
      background: ${color};
      border-radius: ${isCircle ? "50%" : "2px"};
      width: ${6 + Math.random() * 7}px;
      height: ${6 + Math.random() * 7}px;
      --cdur: ${dur}s;
      --cdelay: ${delay}s;
      transform-origin: center;
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), (dur + delay + 0.2) * 1000);
  }
}

/* ─── Birthday show (continuous until stopped) ──── */
function spawnBdayEmojis(anchor) {
  const emojis = ["🎂", "🎈", "🎁", "🥳", "✨", "🎉", "💖", "🎊", "🌟", "🍰"];
  const rect = anchor.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top;
  const count = 4 + Math.floor(Math.random() * 5);

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const spreadX = cx + (Math.random() - 0.5) * 300;
    const dur = 1.2 + Math.random() * 1.0;
    const delay = i * 0.08;
    const size = 1.1 + Math.random() * 1.3;
    el.style.cssText = `
      position: fixed;
      left: ${spreadX}px;
      top: ${cy}px;
      font-size: ${size}rem;
      pointer-events: none;
      z-index: 600;
      animation: bdayFloat ${dur}s ease-out ${delay}s forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), (dur + delay + 0.1) * 1000);
  }
}

function launchBirthdayShow(anchor) {
  // Opening burst — immediate big confetti + emojis + bounce
  launchConfetti(70, 0);
  spawnBdayEmojis(anchor);
  anchor.classList.add("bday-bounce");
  setTimeout(() => anchor.classList.remove("bday-bounce"), 700);

  // Continuous loop — alternates confetti mini-bursts and emoji fountains
  let tick = 0;
  bdayShowInterval = setInterval(() => {
    tick++;
    const r = Math.random();
    if (r < 0.45) {
      // Small confetti shower
      launchConfetti(18 + Math.floor(Math.random() * 18), 0);
    } else if (r < 0.8) {
      // Emoji fountain from button
      spawnBdayEmojis(anchor);
    } else {
      // Both at once — every ~5 ticks for a bigger moment
      launchConfetti(30, 0);
      spawnBdayEmojis(anchor);
    }
  }, 1800);
}

/* ─── Qualities constellation ───────────────────── */
(function initQualities() {
  const orbs = document.querySelectorAll(".quality-orb");
  const foundEl = document.getElementById("qualitiesFound");
  const completeEl = document.getElementById("qualitiesComplete");
  let discovered = 0;

  function playTwinkle() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      const notes = [880, 1320, 1760];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + i * 0.09);
        gain.gain.setValueAtTime(0, t + i * 0.09);
        gain.gain.linearRampToValueAtTime(0.18, t + i * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.32);
        osc.start(t + i * 0.09);
        osc.stop(t + i * 0.09 + 0.35);
      });
    } catch { /* audio not supported, no problem */ }
  }

  function openOrb(orb) {
    if (orb.classList.contains("open")) return;
    orb.classList.add("open");
    discovered++;
    foundEl.textContent = discovered;
    playTwinkle();
    spawnHearts(orb, 3);

    if (discovered === orbs.length) {
      // All discovered — golden glow on all + show message
      orbs.forEach(o => o.classList.add("all-done"));
      setTimeout(() => {
        completeEl.classList.add("show");
        launchConfetti(40, 0);
      }, 400);
    }
  }

  orbs.forEach(orb => {
    // Mouse: open on enter, keep open
    orb.addEventListener("mouseenter", () => openOrb(orb));
    // Touch: open on tap
    orb.addEventListener("click", () => openOrb(orb));
  });
})();

/* ─── Food gallery interactions ─────────────────── */
document.querySelectorAll(".food-card").forEach(card => {
  card.addEventListener("click", () => {
    const dish = card.dataset.dish;
    showSecret("🍽️ " + dish);
    spawnHearts(card, 4);
  });
});

/* ─── Keyboard secrets ──────────────────────────── */
let keyBuffer = "";
document.addEventListener("keydown", event => {
  keyBuffer = (keyBuffer + event.key.toLowerCase()).slice(-10);

  if (keyBuffer.endsWith("tea")) {
    showSecret("You typed tea. A completely reasonable decision. ☕");
  }

  if (keyBuffer.endsWith("chai")) {
    showSecret("Same thing honestly. ☕☕");
  }

  if (keyBuffer.endsWith("reddit")) {
    showSecret("Twelve tabs have appeared. The investigation is open. 🔎");
    launchConfetti(25, 0);
  }

  if (keyBuffer.endsWith("b12")) {
    showSecret("There it is. The most important reminder. 💊");
    spawnHearts(document.body, 5);
  }

  if (event.key.toLowerCase() === "b") {
    showSecret("Friendly reminder discovered: B12. 🙂");
  }

  if (keyBuffer.endsWith("gt")) {
    showSecret("👋 hey, that's me.");
    rainLeaves();
  }

  if (keyBuffer.endsWith("fs")) {
    showSecret("👋 hey, that's you. Happy birthday. 🎂");
    riseHearts();
  }
});

/* ─── GT: autumn leaf rain ──────────────────────── */
function rainLeaves() {
  const leaves  = ["🍂", "🍁", "🌿", "🍃", "🌾", "✦"];
  const count   = 38;

  for (let i = 0; i < count; i++) {
    const el    = document.createElement("div");
    const leaf  = leaves[Math.floor(Math.random() * leaves.length)];
    const startX  = 2 + Math.random() * 96;   // vw
    const size    = 0.9 + Math.random() * 1.4; // rem
    const dur     = 3.5 + Math.random() * 3.5; // s
    const delay   = i * 0.12;                  // s — staggered
    const sway    = (Math.random() - 0.5) * 220; // px lateral drift
    const spin    = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360);

    el.textContent = leaf;
    el.style.cssText = `
      position: fixed;
      left: ${startX}vw;
      top: -60px;
      font-size: ${size}rem;
      pointer-events: none;
      z-index: 700;
      opacity: 0;
      animation: leafFall ${dur}s ease-in ${delay}s forwards;
      --sway: ${sway}px;
      --spin: ${spin}deg;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), (dur + delay + 0.3) * 1000);
  }
}

/* ─── FS: rainbow heart wave ────────────────────── */
function riseHearts() {
  const hearts = ["❤️", "🧡", "💛", "💚", "💙", "💜", "🩷", "🤍", "💖", "✨"];
  const count  = 45;

  for (let i = 0; i < count; i++) {
    const el     = document.createElement("div");
    const heart  = hearts[i % hearts.length];
    const startX = 2 + Math.random() * 96;    // vw
    const size   = 1.0 + Math.random() * 1.6; // rem
    const dur    = 2.8 + Math.random() * 2.4; // s
    const delay  = i * 0.08;                  // s — wave
    const drift  = (Math.random() - 0.5) * 160; // px horizontal wobble
    const rise   = 60 + Math.random() * 35;   // vh

    el.textContent = heart;
    el.style.cssText = `
      position: fixed;
      left: ${startX}vw;
      bottom: -40px;
      font-size: ${size}rem;
      pointer-events: none;
      z-index: 700;
      opacity: 0;
      animation: heartRise ${dur}s ease-out ${delay}s forwards;
      --drift: ${drift}px;
      --rise: -${rise}vh;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), (dur + delay + 0.3) * 1000);
  }
}

/* ─── Long-press helper (works on touch + mouse) ── */
function onLongPress(el, ms, callback) {
  let timer;
  function start(e) {
    // Don't steal scrolls
    timer = setTimeout(() => { callback(e); timer = null; }, ms);
  }
  function cancel() { clearTimeout(timer); timer = null; }
  el.addEventListener("mousedown",  start);
  el.addEventListener("touchstart", start,  { passive: true });
  el.addEventListener("mouseup",    cancel);
  el.addEventListener("mouseleave", cancel);
  el.addEventListener("touchend",   cancel);
  el.addEventListener("touchmove",  cancel, { passive: true });
}

/* ─── Easter eggs ───────────────────────────────── */

// 1. Avatar — 5 fast taps/clicks OR long-press (1s) for FS easter egg
(function avatarEgg() {
  const avatar = document.querySelector(".avatar-img");
  if (!avatar) return;
  let clicks = 0, timer;
  avatar.style.cursor = "pointer";

  function triggerFsEgg() {
    showSecret("👋 hey, that's you. Happy birthday. 🎂");
    riseHearts();
    avatar.style.animation = "avatarSpin 0.6s ease";
    setTimeout(() => avatar.style.animation = "", 650);
  }

  // 5 fast taps (desktop + mobile)
  avatar.addEventListener("click", () => {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => { clicks = 0; }, 900);
    if (clicks >= 5) { clicks = 0; triggerFsEgg(); }
  });

  // Long-press 1s (especially for mobile)
  onLongPress(avatar, 1000, triggerFsEgg);
})();

// 2. The scroll-progress bar — click it to skip to the end
document.getElementById("scrollProgress").addEventListener("click", () => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  showSecret("Shortcut found. Jumping to the end. 🚀");
});

// 3. The section numbers — click any section number for a secret
document.querySelectorAll(".section-number").forEach(el => {
  el.style.cursor = "pointer";
  el.addEventListener("click", () => {
    const messages = [
      "Found a hidden corner. This is where the curator hides. 🎨",
      "Section unlocked. Invisible stamp applied. ✦",
      "You found the number. No prize, but noted. 🌟",
      "Curious one, aren't you. That checks out. 🔎",
      "The archive smiles back. 🙂",
    ];
    showSecret(messages[Math.floor(Math.random() * messages.length)]);
    spawnHearts(el, 3);
  });
});

// 4. The page title — triple-click on h1 to make it rain
document.querySelector("h1").addEventListener("click", e => {
  if (e.detail === 3) {
    showSecret("The title has feelings too. 🎊");
    launchConfetti(60, 0);
    spawnHearts(document.querySelector("h1"), 10);
  }
});

// 5. The back-to-top button — hold for 1.5s to trigger fireworks
(function backToTopEgg() {
  const btn = document.getElementById("backToTop");
  let holdTimer;
  btn.addEventListener("mousedown",  () => { holdTimer = setTimeout(() => { showSecret("Long press? Here, have some fireworks. 🎆"); launchConfetti(80, 0); spawnHearts(btn, 10); }, 1500); });
  btn.addEventListener("touchstart", () => { holdTimer = setTimeout(() => { showSecret("Long press? Here, have some fireworks. 🎆"); launchConfetti(80, 0); spawnHearts(btn, 10); }, 1500); }, { passive: true });
  btn.addEventListener("mouseup",   () => clearTimeout(holdTimer));
  btn.addEventListener("touchend",  () => clearTimeout(holdTimer));
})();

// 6. Idle easter egg — if the page is left open for 3 minutes untouched
(function idleEgg() {
  let idleTimer;
  const messages = [
    "Still there? Take your time. There's no rush here. 🌸",
    "The archive is patient. So is the person who made it. 🤍",
    "You can always come back to this. It'll be here. ✨",
  ];
  let msgIndex = 0;
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      showSecret(messages[msgIndex % messages.length]);
      msgIndex++;
    }, 180000);
  }
  ["mousemove", "scroll", "keydown", "click", "touchstart"].forEach(e =>
    window.addEventListener(e, resetIdle, { passive: true })
  );
  resetIdle();
})();

// 7. Signature "GT" — click for a toast, long-press (1s) for the full GT leaf rain
(function signatureEgg() {
  const sig = document.querySelector(".signature");

  sig.addEventListener("click", () => {
    showSecret("That's me. Hi. Thanks for being you. 🩷");
    spawnHearts(sig, 8);
    launchConfetti(35, 0);
  });

  onLongPress(sig, 1000, () => {
    showSecret("👋 hey, that's me. Long press unlocked. 🍂");
    rainLeaves();
  });
})();

/* ─── Card 3D tilt on mouse move ────────────────── */
document.querySelectorAll(".trait-card, .recommendation-card").forEach(card => {
  card.addEventListener("mousemove", e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `translateY(-8px) scale(1.02) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});
