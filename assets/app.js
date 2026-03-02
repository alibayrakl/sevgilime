// assets/app.js
const MEM_STORAGE_KEY = "love_memories_v1";

function loadMemories() {
  try {
    return JSON.parse(localStorage.getItem(MEM_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMemories() {
  const ul = document.getElementById("memories");
  if (!ul) return;

  const items = loadMemories();

  if (items.length === 0) {
    ul.innerHTML = `<li class="muted">Henüz anı yok. Admin panelden ekleyince burada görünecek ✨</li>`;
    return;
  }

  ul.innerHTML = items
    .map(
      (m) => `
<li class="memory">
  <div class="memory-title">${escapeHtml(m.title || "Başlıksız")}</div>
  <div class="memory-text muted">${escapeHtml(m.text || "")}</div>

  ${m.date ? `
    <div class="memory-footer">
      <div class="memory-date">${escapeHtml(m.date)}</div>
    </div>
  ` : ``}
</li>
      `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderMemories();

  // Admin sayfasında değişiklik olursa (aynı origin’deyken) site otomatik güncellensin
  window.addEventListener("storage", (e) => {
    if (e.key === MEM_STORAGE_KEY) renderMemories();
  });
});