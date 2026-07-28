// ============================================================
// Emmaus — shared behavior (Firebase-backed)
// ============================================================

let cachedPrayers = [];
let currentWallFilter = "All";

/* ---------- Mobile nav ---------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
}

/* ---------- Live data listener ---------- */
function listenPrayers() {
  db.collection("prayers")
    .orderBy("date", "desc")
    .onSnapshot(
      (snapshot) => {
        cachedPrayers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderRecentPreview();
        renderWall(currentWallFilter);
        renderAdmin();
      },
      (err) => {
        console.error("Firestore read error:", err);
        showConnectionError();
      }
    );
}

function showConnectionError() {
  document.querySelectorAll("#recent-preview, #wall-grid, #admin-list").forEach((el) => {
    if (el) {
      el.innerHTML = `<div class="empty-state">Couldn't connect to the database. If you're the site owner, check that js/firebase-config.js has your real Firebase project keys.</div>`;
    }
  });
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return days === 1 ? "1 day ago" : `${days} days ago`;
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const mins = Math.floor(seconds / 60);
  if (mins >= 1) return mins === 1 ? "1 minute ago" : `${mins} minutes ago`;
  return "just now";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Render: recent preview on home ---------- */
function renderRecentPreview() {
  const el = document.getElementById("recent-preview");
  if (!el) return;
  const list = cachedPrayers.slice(0, 3);
  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state">No requests yet. Be the first to share.</div>`;
    return;
  }
  el.innerHTML = list.map(cardHtml).join("");
  attachPrayButtons(el);
}

/* ---------- Render: full wall ---------- */
function renderWall(filter) {
  const el = document.getElementById("wall-grid");
  if (!el) return;
  currentWallFilter = filter || "All";
  let list = cachedPrayers;
  if (currentWallFilter !== "All") {
    list = list.filter((p) => p.category === currentWallFilter);
  }
  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state">No requests in this category yet. Be the first to share one.</div>`;
    return;
  }
  el.innerHTML = list.map(cardHtml).join("");
  attachPrayButtons(el);
}

function cardHtml(p) {
  return `
    <article class="prayer-card">
      <span class="tag">${escapeHtml(p.category)}</span>
      <p>${escapeHtml(p.text)}</p>
      <div class="prayer-meta">
        <span>${escapeHtml(p.name || "Anonymous")} · ${timeAgo(p.date)}</span>
        <button class="pray-btn" data-id="${p.id}" aria-pressed="false">🙏 Praying (${p.prayCount || 0})</button>
      </div>
    </article>
  `;
}

function attachPrayButtons(scope) {
  scope.querySelectorAll(".pray-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.pressed === "true") return;
      btn.dataset.pressed = "true";
      btn.setAttribute("aria-pressed", "true");
      btn.dataset.active = "true";
      const id = btn.dataset.id;
      db.collection("prayers")
        .doc(id)
        .update({ prayCount: firebase.firestore.FieldValue.increment(1) })
        .catch((err) => {
          console.error(err);
          btn.dataset.pressed = "false";
          alert("Couldn't record your prayer — please check your connection and try again.");
        });
    });
  });
}

/* ---------- Filters on wall page ---------- */
function initFilters() {
  const filterBar = document.getElementById("filter-bar");
  if (!filterBar) return;
  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-pill");
    if (!btn) return;
    filterBar.querySelectorAll(".filter-pill").forEach((p) => p.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    renderWall(btn.dataset.category);
  });
}

/* ---------- Submit form ---------- */
function initForm() {
  const form = document.getElementById("prayer-form");
  if (!form) return;

  const anonCheckbox = document.getElementById("anonymous");
  const nameField = document.getElementById("name-field");
  anonCheckbox.addEventListener("change", () => {
    nameField.style.display = anonCheckbox.checked ? "none" : "block";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = anonCheckbox.checked ? "Anonymous" : (document.getElementById("name").value.trim() || "Anonymous");
    const category = document.getElementById("category").value;
    const text = document.getElementById("request").value.trim();
    if (!text) return;

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sharing...";

    db.collection("prayers")
      .add({ name, category, text, date: Date.now(), prayCount: 0 })
      .then(() => {
        document.querySelector(".form-card").classList.add("hidden");
        document.getElementById("confirmation").classList.add("visible");
      })
      .catch((err) => {
        console.error(err);
        submitBtn.disabled = false;
        submitBtn.textContent = "Share with the wall";
        alert("Couldn't share your request — please check your connection and try again.");
      });
  });
}

/* ---------- Admin ---------- */
function initAdmin() {
  const gate = document.getElementById("admin-gate");
  const panel = document.getElementById("admin-panel");
  if (!gate || !panel) return;

  const loginForm = document.getElementById("admin-login-form");
  const errorMsg = document.getElementById("admin-error");
  const logoutBtn = document.getElementById("admin-logout");

  function showPanel() {
    gate.classList.add("hidden");
    panel.classList.remove("hidden");
    renderAdmin();
  }
  function showGate() {
    panel.classList.add("hidden");
    gate.classList.remove("hidden");
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      showPanel();
    } else {
      showGate();
    }
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value;
    errorMsg.textContent = "";
    auth.signInWithEmailAndPassword(email, password).catch((err) => {
      errorMsg.textContent = "Sign-in failed: " + err.message;
    });
  });

  logoutBtn.addEventListener("click", () => {
    auth.signOut();
  });
}

function renderAdmin() {
  const el = document.getElementById("admin-list");
  if (!el) return;
  if (!auth.currentUser) return;
  const list = cachedPrayers;

  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state">No prayer requests stored yet.</div>`;
    return;
  }

  el.innerHTML = list.map((p) => adminRowHtml(p)).join("");

  el.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Delete this prayer request? This can't be undone.")) return;
      db.collection("prayers").doc(btn.dataset.id).delete().catch((err) => {
        console.error(err);
        alert("Couldn't delete — check your connection and try again.");
      });
    });
  });

  el.querySelectorAll("[data-action='save']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".admin-row");
      const id = btn.dataset.id;
      const name = row.querySelector("[data-field='name']").value.trim() || "Anonymous";
      const category = row.querySelector("[data-field='category']").value;
      const text = row.querySelector("[data-field='text']").value.trim();
      db.collection("prayers").doc(id).update({ name, category, text }).catch((err) => {
        console.error(err);
        alert("Couldn't save — check your connection and try again.");
      });
    });
  });
}

function adminRowHtml(p) {
  const categories = ["Healing", "Family", "Guidance", "Grief", "Thanksgiving", "Other"];
  const options = categories
    .map((c) => `<option value="${c}" ${c === p.category ? "selected" : ""}>${c}</option>`)
    .join("");
  return `
    <div class="admin-row" data-id="${p.id}">
      <div class="admin-row-grid">
        <div class="field">
          <label>Name</label>
          <input type="text" data-field="name" value="${escapeHtml(p.name || "Anonymous")}">
        </div>
        <div class="field">
          <label>Category</label>
          <select data-field="category">${options}</select>
        </div>
      </div>
      <div class="field">
        <label>Request</label>
        <textarea data-field="text">${escapeHtml(p.text)}</textarea>
      </div>
      <div class="admin-row-meta">
        <span>${timeAgo(p.date)} · 🙏 ${p.prayCount || 0}</span>
        <div class="btn-row">
          <button class="btn btn-ghost" data-action="save" data-id="${p.id}">Save changes</button>
          <button class="btn btn-ghost admin-delete" data-action="delete" data-id="${p.id}">Delete</button>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initFilters();
  initForm();
  initAdmin();
  listenPrayers();
});
