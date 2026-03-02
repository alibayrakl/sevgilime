// assets/site.js
import { watchSettings, listTimeline, listMemories, listPhotos } from "./firebase.js";

const $ = (id) => document.getElementById(id);

const yearEl = $("year");
yearEl.textContent = String(new Date().getFullYear());

function setText(id, val){
  const el = $(id);
  if (el) el.textContent = val ?? "";
}

function renderCountdown(el, targetDate){
  if (!el) return;
  if (!targetDate) {
    el.innerHTML = `<span class="muted">Admin panelinden tarih gir.</span>`;
    return;
  }
  const t = new Date(targetDate).getTime();
  if (Number.isNaN(t)) {
    el.innerHTML = `<span class="muted">Tarih formatı hatalı.</span>`;
    return;
  }

  const now = Date.now();
  let diff = t - now;
  const past = diff < 0;
  diff = Math.abs(diff);

  const sec = Math.floor(diff/1000);
  const days = Math.floor(sec/86400);
  const hrs = Math.floor((sec%86400)/3600);
  const mins = Math.floor((sec%3600)/60);
  const secs = sec%60;

  el.innerHTML = `
    <div class="cd-box"><div class="cd-n">${days}</div><div class="cd-l">gün</div></div>
    <div class="cd-box"><div class="cd-n">${hrs}</div><div class="cd-l">saat</div></div>
    <div class="cd-box"><div class="cd-n">${mins}</div><div class="cd-l">dk</div></div>
    <div class="cd-box"><div class="cd-n">${secs}</div><div class="cd-l">sn</div></div>
    <div class="muted" style="margin-top:8px">${past ? "(geçti)" : "(kaldı)"}</div>
  `;
}

let settingsCache = null;

watchSettings((s) => {
  settingsCache = s || {};

  const your = settingsCache.yourName || "Ali";
  const lover = settingsCache.loverName || "Betül";

  ["yourName","heroYour","footerYour"].forEach(id => setText(id, your));
  ["loverName","heroLover"].forEach(id => setText(id, lover));

  if (settingsCache.heroText) setText("heroText", settingsCache.heroText);
  if (settingsCache.quoteText) setText("quoteText", settingsCache.quoteText);
  if (settingsCache.specialHint) setText("specialHint", settingsCache.specialHint);

  // Spotify
  const wrap = $("ourSongWrap");
  if (wrap) {
    const url = (settingsCache.ourSong || "").trim();
    wrap.innerHTML = url
      ? `<iframe style="border-radius:14px" src="${url}" width="100%" height="152" frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
      : `<div class="muted">Admin panelinden Spotify embed URL gir.</div>`;
  }
  setText("ourSongNote", settingsCache.ourSongNote || "");

  // Letter
  const letter = $("letter");
  if (letter) letter.innerHTML = settingsCache.letterHtml || "Admin panelinden mektup yaz.";

});

// live timers
setInterval(() => {
  renderCountdown($("countdown"), settingsCache?.specialDate || null);
  // Together: startDate
  const start = settingsCache?.startDate || null;
  if (!start) return renderCountdown($("together"), null);
  // together is elapsed → targetDate = now - elapsed? kolay: custom:
  const el = $("together");
  if (!el) return;
  const s = new Date(start).getTime();
  if (Number.isNaN(s)) return el.innerHTML = `<span class="muted">Başlangıç tarihi hatalı.</span>`;
  const diff = Date.now() - s;
  const sec = Math.floor(diff/1000);
  const days = Math.floor(sec/86400);
  const hrs = Math.floor((sec%86400)/3600);
  const mins = Math.floor((sec%3600)/60);
  const secs = sec%60;
  el.innerHTML = `
    <div class="cd-box"><div class="cd-n">${days}</div><div class="cd-l">gün</div></div>
    <div class="cd-box"><div class="cd-n">${hrs}</div><div class="cd-l">saat</div></div>
    <div class="cd-box"><div class="cd-n">${mins}</div><div class="cd-l">dk</div></div>
    <div class="cd-box"><div class="cd-n">${secs}</div><div class="cd-l">sn</div></div>
  `;
}, 1000);

// Timeline + Memories + Photos (manual refresh)
async function renderTimeline(){
  const el = $("timeline");
  if (!el) return;
  const items = await listTimeline();
  el.innerHTML = items.length ? items.map(it => `
    <div class="tl-item">
      <div class="tl-dot"></div>
      <div class="tl-body">
        <div class="tl-title">${it.title || "Olay"}</div>
        <div class="tl-date muted">${it.date || ""}</div>
        <div class="tl-note muted">${it.note || ""}</div>
      </div>
    </div>
  `).join("") : `<div class="muted">Henüz olay yok.</div>`;
}

async function renderMemories(){
  const el = $("memories");
  if (!el) return;
  const items = await listMemories();
  el.innerHTML = items.length ? items.map(m => `
    <li class="memory">
      <div>
        <div class="memory-title">${m.title || "Anı"}</div>
        <div class="muted">${m.text || ""}</div>
      </div>
    </li>
  `).join("") : `<li class="muted">Henüz anı yok.</li>`;
}

const lightbox = $("lightbox");
const lightboxImg = $("lightboxImg");
const lightboxCaption = $("lightboxCaption");
const lightboxClose = $("lightboxClose");

function openLightbox(src, title){
  lightbox?.classList.add("show");
  if (lightboxImg) lightboxImg.src = src;
  if (lightboxCaption) lightboxCaption.textContent = title || "";
}
function closeLightbox(){
  lightbox?.classList.remove("show");
  if (lightboxImg) lightboxImg.src = "";
  if (lightboxCaption) lightboxCaption.textContent = "";
}
lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (e)=>{ if (e.target === lightbox) closeLightbox(); });

async function renderPhotos(){
  const grid = $("galleryGrid");
  const empty = $("emptyState");
  if (!grid) return;
  const list = await listPhotos();
  grid.innerHTML = "";
  if (!list.length) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  list.forEach((p, idx) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<img src="${p.url}" alt="galeri-${idx}">`;
    wrap.addEventListener("click", ()=> openLightbox(p.url, p.title));
    grid.appendChild(wrap);
  });
}

$("refreshGallery")?.addEventListener("click", renderPhotos);

renderTimeline();
renderMemories();
renderPhotos();