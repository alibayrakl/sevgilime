import {
  watchAuth, login, logout,
  getSettingsOnce, saveSettings,
  listTimeline, addTimeline, updateTimeline, deleteTimeline,
  listMemories, addMemory, updateMemory, deleteMemory,
  listPhotos, addPhotoByUrl, updatePhoto, deletePhoto
} from "./firebase.js";

const $ = (id) => document.getElementById(id);

/* ---------------- Tabs ---------------- */
const tabs = document.querySelectorAll(".tab[data-tab]");
const panels = document.querySelectorAll(".panel");
const tabTitle = $("tabTitle");

function openTab(key){
  panels.forEach(p => p.classList.remove("active"));
  tabs.forEach(t => t.classList.remove("active"));

  document.querySelector(`#tab-${key}`)?.classList.add("active");
  document.querySelector(`.tab[data-tab="${key}"]`)?.classList.add("active");

  const titles = {
    settings: "Site Ayarları",
    timeline: "Biz Nasıl Tanıştık",
    memories: "Anı Kutusu",
    letter: "Mektup",
    photos: "Fotoğraflar (URL)"
  };
  if (tabTitle) tabTitle.textContent = titles[key] || "Admin";
}
tabs.forEach(t => t.addEventListener("click", (e)=>{ e.preventDefault(); openTab(t.dataset.tab); }));
openTab("settings");

/* ---------------- Auth ---------------- */
const authState = $("authState");

async function ensureLogin(){
  const email = prompt("Admin e-mail:");
  if (!email) location.href = "index.html";
  const pass = prompt("Şifre:");
  if (!pass) location.href = "index.html";
  await login(email.trim(), pass);
}

watchAuth(async (user) => {
  if (!user) {
    authState.textContent = "Giriş gerekli";
    try {
      await ensureLogin();
    } catch (e) {
      console.error(e);
      alert("Giriş başarısız. Email/şifre kontrol et.");
      location.href = "index.html";
    }
    return;
  }

  authState.textContent = "Giriş OK ✅";
  await boot();
});

$("logoutBtn")?.addEventListener("click", async (e)=>{
  e.preventDefault();
  await logout();
  location.href = "index.html";
});

/* ---------------- Settings ---------------- */
const yourNameIn = $("yourNameIn");
const loverNameIn = $("loverNameIn");
const startDateIn = $("startDateIn");
const specialDateIn = $("specialDateIn");
const heroTextIn = $("heroTextIn");
const quoteTextIn = $("quoteTextIn");
const specialHintIn = $("specialHintIn");
const ourSongIn = $("ourSongIn");
const ourSongNoteIn = $("ourSongNoteIn");
const letterIn = $("letterIn");

$("saveSettingsBtn")?.addEventListener("click", async ()=>{
  await saveSettings({
    yourName: (yourNameIn?.value || "").trim(),
    loverName: (loverNameIn?.value || "").trim(),
    startDate: startDateIn?.value || "",
    specialDate: specialDateIn?.value || "",
    heroText: (heroTextIn?.value || "").trim(),
    quoteText: (quoteTextIn?.value || "").trim(),
    specialHint: (specialHintIn?.value || "").trim(),
    ourSong: (ourSongIn?.value || "").trim(),
    ourSongNote: (ourSongNoteIn?.value || "").trim(),
  });
  alert("Kaydedildi ✅");
});

$("saveLetterBtn")?.addEventListener("click", async ()=>{
  await saveSettings({
    letterHtml: (letterIn?.value || "").trim()
  });
  alert("Mektup kaydedildi ✅");
});

/* ---------------- Timeline ---------------- */
const timelineList = $("timelineList");

$("addTimelineBtn")?.addEventListener("click", async ()=>{
  const current = await listTimeline();
  const maxOrder = current.reduce((m,i)=>Math.max(m, Number(i.order||0)), 0);
  await addTimeline({
    title: "Yeni olay",
    date: "",
    note: "",
    order: maxOrder + 1,
    createdAt: Date.now()
  });
  await renderTimeline();
});

async function renderTimeline(){
  const list = await listTimeline();
  timelineList.innerHTML = list.map(it => `
    <div class="item" data-id="${it.id}">
      <div class="mini">
        <input data-k="title" value="${escAttr(it.title||"")}" placeholder="Başlık">
        <input data-k="date" value="${escAttr(it.date||"")}" placeholder="Tarih">
        <input data-k="note" value="${escAttr(it.note||"")}" placeholder="Not">
        <button class="icon" data-del="1">Sil</button>
      </div>
    </div>
  `).join("");

  timelineList.querySelectorAll(".item input").forEach(inp=>{
    inp.addEventListener("input", async ()=>{
      const wrap = inp.closest(".item");
      const id = wrap.dataset.id;
      const k = inp.dataset.k;
      await updateTimeline(id, { [k]: inp.value });
    });
  });

  timelineList.querySelectorAll(".item [data-del]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const id = btn.closest(".item").dataset.id;
      await deleteTimeline(id);
      await renderTimeline();
    });
  });
}

/* ---------------- Memories ---------------- */
const memoriesList = $("memoriesList");

$("addMemoryBtn")?.addEventListener("click", async ()=>{
  await addMemory({ title:"Yeni anı", text:"", createdAt: Date.now() });
  await renderMemories();
});

async function renderMemories(){
  const list = await listMemories();
  memoriesList.innerHTML = list.map(m => `
    <div class="item" data-id="${m.id}">
      <div class="mini">
        <input data-k="title" value="${escAttr(m.title||"")}" placeholder="Başlık">
        <input data-k="text" value="${escAttr(m.text||"")}" placeholder="Metin">
        <span></span>
        <button class="icon" data-del="1">Sil</button>
      </div>
    </div>
  `).join("");

  memoriesList.querySelectorAll(".item input").forEach(inp=>{
    inp.addEventListener("input", async ()=>{
      const id = inp.closest(".item").dataset.id;
      await updateMemory(id, { [inp.dataset.k]: inp.value });
    });
  });

  memoriesList.querySelectorAll(".item [data-del]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const id = btn.closest(".item").dataset.id;
      await deleteMemory(id);
      await renderMemories();
    });
  });
}

/* ---------------- Photos (URL) ---------------- */
const addPhotoBtn = $("addPhotoBtn");
const photoUrlIn = $("photoUrlIn");
const photoTitleIn = $("photoTitleIn");
const clearPhotoForm = $("clearPhotoForm");
const savePhotoUrlBtn = $("savePhotoUrl");
const savedPhotos = $("savedPhotos");

addPhotoBtn?.addEventListener("click", ()=> openTab("photos"));

clearPhotoForm?.addEventListener("click", ()=>{
  if (photoUrlIn) photoUrlIn.value = "";
  if (photoTitleIn) photoTitleIn.value = "";
});

savePhotoUrlBtn?.addEventListener("click", async ()=>{
  const url = (photoUrlIn?.value || "").trim();
  const title = (photoTitleIn?.value || "").trim();

  if (!url) return alert("Foto URL gir.");
  if (!/^https?:\/\//i.test(url)) return alert("URL http/https ile başlamalı.");

  await addPhotoByUrl({ url, title });
  if (photoUrlIn) photoUrlIn.value = "";
  if (photoTitleIn) photoTitleIn.value = "";

  await renderPhotos();
  alert("Foto eklendi ✅");
});

async function renderPhotos(){
  const list = await listPhotos();
  savedPhotos.innerHTML = "";

  if (!list.length) {
    savedPhotos.innerHTML = `<div class="muted">Foto yok</div>`;
    return;
  }

  list.forEach((p)=>{
    const div = document.createElement("div");
    div.className = "photo";
    div.draggable = true;
    div.dataset.id = p.id;
    div.innerHTML = `
      <img src="${escAttr(p.url)}" alt="">
      <div class="meta">
        <span class="handle">⠿</span>
        <span class="title" title="Düzenle">${escHtml(p.title || "Başlıksız")}</span>
        <button class="icon" data-del="1">🗑️</button>
      </div>
    `;
    savedPhotos.appendChild(div);
  });

  // edit title
  savedPhotos.querySelectorAll(".title").forEach(t=>{
    t.addEventListener("click", async ()=>{
      const id = t.closest(".photo").dataset.id;
      const cur = list.find(x=>x.id===id);
      const next = prompt("Başlık:", cur?.title || "");
      if (next === null) return;
      await updatePhoto(id, { title: next.trim() });
      await renderPhotos();
    });
  });

  // delete
  savedPhotos.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      const id = b.closest(".photo").dataset.id;
      if (!confirm("Silinsin mi?")) return;
      await deletePhoto(id);
      await renderPhotos();
    });
  });

  // drag-drop ordering
  let dragId = null;
  savedPhotos.querySelectorAll(".photo").forEach(item=>{
    item.addEventListener("dragstart", ()=>{
      dragId = item.dataset.id;
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", ()=>{
      item.classList.remove("dragging");
    });
    item.addEventListener("dragover", (e)=> e.preventDefault());
    item.addEventListener("drop", async (e)=>{
      e.preventDefault();
      const dropId = item.dataset.id;
      if (!dragId || dragId === dropId) return;

      const arr = await listPhotos();
      const from = arr.findIndex(x=>x.id===dragId);
      const to = arr.findIndex(x=>x.id===dropId);

      const moved = arr.splice(from, 1)[0];
      arr.splice(to, 0, moved);

      for (let i=0; i<arr.length; i++){
        await updatePhoto(arr[i].id, { order: i+1 });
      }

      dragId = null;
      await renderPhotos();
    });
  });
}

/* ---------------- Boot ---------------- */
async function boot(){
  const s = await getSettingsOnce();
  const data = s || {};

  if (yourNameIn) yourNameIn.value = data.yourName || "";
  if (loverNameIn) loverNameIn.value = data.loverName || "";
  if (startDateIn) startDateIn.value = data.startDate || "";
  if (specialDateIn) specialDateIn.value = data.specialDate || "";
  if (heroTextIn) heroTextIn.value = data.heroText || "";
  if (quoteTextIn) quoteTextIn.value = data.quoteText || "";
  if (specialHintIn) specialHintIn.value = data.specialHint || "";
  if (ourSongIn) ourSongIn.value = data.ourSong || "";
  if (ourSongNoteIn) ourSongNoteIn.value = data.ourSongNote || "";
  if (letterIn) letterIn.value = data.letterHtml || "";

  await renderTimeline();
  await renderMemories();
  await renderPhotos();
}

/* ---------------- Utils ---------------- */
function escHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function escAttr(str){ return escHtml(str).replace(/"/g,"&quot;"); }
// ================================
// MEMORIES MODULE (append at bottom)
// ================================
(() => {
  const MEM_STORAGE_KEY = "love_memories_v1";

  function mem_load() {
    try {
      return JSON.parse(localStorage.getItem(MEM_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function mem_save(items) {
    localStorage.setItem(MEM_STORAGE_KEY, JSON.stringify(items));
  }

  function mem_uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function mem_escapeHtml(s = "") {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function mem_render() {
    const list = document.getElementById("memoriesList");
    if (!list) return;

    const items = mem_load();

    if (items.length === 0) {
      list.innerHTML = `<div class="muted">Henüz anı yok. + Anı ile ekle 💘</div>`;
      return;
    }

    list.innerHTML = items
      .map((m) => {
        return `
          <div class="item" data-id="${m.id}">
            <div style="display:flex; gap:10px; align-items:flex-start; justify-content:space-between;">
              <div style="flex:1;">
                <div style="font-weight:700; margin-bottom:6px;">${mem_escapeHtml(m.title || "Başlıksız")}</div>
                <div class="muted" style="margin-bottom:10px;">${mem_escapeHtml(m.text || "")}</div>

                <details>
                  <summary class="muted" style="cursor:pointer;">Düzenle</summary>
                  <div style="margin-top:10px; display:grid; gap:8px;">
                    <input class="input mem-title" placeholder="Başlık" value="${mem_escapeHtml(m.title || "")}">
                    <input class="input mem-text" placeholder="Not" value="${mem_escapeHtml(m.text || "")}">
                    <div style="display:flex; gap:8px;">
                      <button class="btn mem-save" type="button">Kaydet</button>
                      <button class="btn ghost mem-del" type="button">Sil</button>
                    </div>
                  </div>
                </details>
              </div>

              <div class="muted" style="white-space:nowrap;">
                ${m.date || ""}
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // tek listener (event delegation)
    list.onclick = (e) => {
      const wrap = e.target.closest(".item");
      if (!wrap) return;

      const id = wrap.dataset.id;
      const items = mem_load();
      const idx = items.findIndex((x) => x.id === id);
      if (idx < 0) return;

      if (e.target.classList.contains("mem-del")) {
        items.splice(idx, 1);
        mem_save(items);
        mem_render();
        return;
      }

      if (e.target.classList.contains("mem-save")) {
        const titleEl = wrap.querySelector(".mem-title");
        const textEl = wrap.querySelector(".mem-text");
        items[idx].title = (titleEl?.value || "").trim();
        items[idx].text = (textEl?.value || "").trim();
        mem_save(items);
        mem_render();
        return;
      }
    };
  }

  function mem_add() {
    const items = mem_load();
    items.unshift({
      id: mem_uid(),
      title: "Yeni Anı",
      text: "Buraya kısa bir not yaz…",
      date: new Date().toLocaleDateString("tr-TR"),
    });
    mem_save(items);
    mem_render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const addBtn = document.getElementById("addMemoryBtn");
    if (addBtn) addBtn.addEventListener("click", mem_add);

    // ilk açılışta bas
    mem_render();

    // Eğer admin panelin “tab” mantığı yüzünden
    // anılar sekmesi sonradan görünüyorsa:
    // 300ms sonra bir daha çizelim (garanti)
    setTimeout(mem_render, 300);
  });
})();