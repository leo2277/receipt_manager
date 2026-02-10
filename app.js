const storeKey = "receipt_app_v1";
const state = {
  session: null,
  receipts: [],
  stores: ["Apple Store", "Esselunga", "Amazon"],
  pendingCode: null,
  pendingEmail: null,
  syncMode: "local"
};

function load() {
  const raw = localStorage.getItem(storeKey);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch {}
}

function save() {
  localStorage.setItem(storeKey, JSON.stringify({
    session: state.session,
    receipts: state.receipts,
    stores: state.stores,
    syncMode: state.syncMode
  }));
}

function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
}

function render() {
  const app = document.getElementById("app");
  if (!state.session) {
    app.innerHTML = renderLogin();
    bindLogin();
    return;
  }
  app.innerHTML = renderDashboard();
  bindDashboard();
}

function renderLogin() {
  return `
  <main class="login-wrap">
    <section class="card login-card stack">
      <h1>Ricevute</h1>
      <p>App minimal in stile Apple per salvare scontrini/ricevute.</p>
      <button id="appleLogin" class="secondary">Continua con Apple (placeholder)</button>

      <div class="stack">
        <label>Email per login con codice</label>
        <input id="email" type="email" placeholder="nome@email.com" />
        <button id="sendCode">Invia codice via email</button>
        <input id="code" type="text" placeholder="Codice a 6 cifre" />
        <button id="verifyCode" class="secondary">Accedi con codice</button>
        <small class="helper">Demo Replit: il codice viene mostrato a video perché non c'è integrazione SMTP di default.</small>
        <div id="devCode"></div>
      </div>

      <button id="guest" class="secondary">Continua senza account</button>
      <small class="helper">Con account puoi sincronizzare su cloud (in questa demo è predisposta la modalità, da collegare a backend Replit DB o iCloud via app nativa).</small>
    </section>
  </main>`;
}

function bindLogin() {
  document.getElementById("appleLogin").onclick = () => {
    state.session = { name: "Utente Apple", method: "apple" };
    save();
    render();
  };

  document.getElementById("sendCode").onclick = () => {
    const email = document.getElementById("email").value.trim();
    if (!email) return alert("Inserisci una email valida.");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    state.pendingEmail = email;
    state.pendingCode = code;
    document.getElementById("devCode").innerHTML = `<small class='helper'>Codice demo: <strong>${code}</strong></small>`;
  };

  document.getElementById("verifyCode").onclick = () => {
    const code = document.getElementById("code").value.trim();
    const email = document.getElementById("email").value.trim();
    if (code && code === state.pendingCode && email === state.pendingEmail) {
      state.session = { name: email, method: "magic-link" };
      state.pendingCode = null;
      state.pendingEmail = null;
      save();
      render();
    } else {
      alert("Codice non valido.");
    }
  };

  document.getElementById("guest").onclick = () => {
    const ok = confirm("Continuando senza account non ci sarà sincronizzazione cloud e potresti perdere i dati. Vuoi continuare?");
    if (!ok) return;
    const name = prompt("Inserisci il tuo nome");
    if (!name) return;
    state.session = { name, method: "guest" };
    state.syncMode = "local";
    save();
    render();
  };
}

function renderDashboard() {
  const storeOptions = state.stores.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  const filtered = getFilteredReceipts();
  const list = filtered.length
    ? filtered.map((r, idx) => `
      <article class="receipt-item">
        <strong>€ ${Number(r.price).toFixed(2)} · ${escapeHtml(r.store)}</strong>
        <span>${fmtDateTime(r.dateTime)}</span>
        <span>${escapeHtml(r.notes || "-")}</span>
        ${r.imageName ? `<span class="badge">Documento: ${escapeHtml(r.imageName)}</span>` : ""}
        <button class="danger" data-delete="${idx}">Elimina</button>
      </article>`).join("")
    : `<p>Nessuna ricevuta trovata con i filtri correnti.</p>`;

  return `
  <div class="container">
    <header class="card">
      <div>
        <h1>Ricevute</h1>
        <p>Ciao ${escapeHtml(state.session.name)} · Accesso: ${escapeHtml(state.session.method)}</p>
      </div>
      <div class="row" style="width:min(380px,100%)">
        <select id="syncMode">
          <option value="local" ${state.syncMode === "local" ? "selected" : ""}>Locale</option>
          <option value="replit-cloud" ${state.syncMode === "replit-cloud" ? "selected" : ""}>Replit Cloud (da collegare)</option>
          <option value="icloud" ${state.syncMode === "icloud" ? "selected" : ""}>iCloud (da collegare)</option>
        </select>
        <button id="logout" class="secondary">Esci</button>
      </div>
    </header>

    <div class="grid">
      <section class="card panel stack">
        <h2>Aggiungi ricevuta</h2>
        <small class="helper">Per il ritaglio automatico su iPhone usa la funzione Apple integrata “Scansione documenti” prima di caricare il file.</small>

        <div>
          <label>Importa scansione</label>
          <input id="image" type="file" accept="image/*,application/pdf" capture="environment" />
        </div>

        <div class="row">
          <div>
            <label>Prezzo (€)</label>
            <input id="price" type="number" min="0" step="0.01" />
          </div>
          <div>
            <label>Data e ora</label>
            <input id="dateTime" type="datetime-local" />
          </div>
        </div>

        <div>
          <label>Negozio</label>
          <select id="storeSelect">${storeOptions}</select>
        </div>

        <div class="row">
          <div>
            <label>Nuovo negozio (opzionale)</label>
            <input id="newStore" type="text" placeholder="Aggiungi negozio" />
          </div>
          <div style="align-self:end;">
            <button id="addStore" class="secondary">Aggiungi alla lista</button>
          </div>
        </div>

        <div>
          <label>Info aggiuntive</label>
          <textarea id="notes"></textarea>
        </div>

        <button id="saveReceipt">Salva ricevuta</button>
      </section>

      <section class="card panel">
        <h2>Home · Lista ricevute</h2>
        <div class="stack" style="margin-top:10px">
          <div class="row">
            <input id="fStore" list="storeList" placeholder="Filtra per negozio" />
            <input id="fDate" type="date" />
          </div>
          <div class="row">
            <input id="fMin" type="number" step="0.01" placeholder="Prezzo min" />
            <input id="fMax" type="number" step="0.01" placeholder="Prezzo max" />
          </div>
        </div>
        <datalist id="storeList">${storeOptions}</datalist>
        <div class="receipts" id="receiptList">${list}</div>
      </section>
    </div>
  </div>`;
}

function bindDashboard() {
  document.getElementById("logout").onclick = () => {
    state.session = null;
    save();
    render();
  };

  document.getElementById("syncMode").onchange = (e) => {
    state.syncMode = e.target.value;
    save();
  };

  document.getElementById("addStore").onclick = () => {
    const value = document.getElementById("newStore").value.trim();
    if (!value) return;
    if (!state.stores.includes(value)) state.stores.push(value);
    save();
    render();
  };

  document.getElementById("saveReceipt").onclick = () => {
    const price = Number(document.getElementById("price").value);
    const store = document.getElementById("storeSelect").value;
    const dateTime = document.getElementById("dateTime").value;
    const notes = document.getElementById("notes").value;
    const image = document.getElementById("image").files?.[0];

    if (!store || !dateTime || Number.isNaN(price)) {
      return alert("Compila almeno prezzo, negozio, data/ora.");
    }

    state.receipts.unshift({ price, store, dateTime, notes, imageName: image?.name || "" });
    save();
    render();
  };

  ["fStore", "fDate", "fMin", "fMax"].forEach((id) => {
    document.getElementById(id).addEventListener("input", render);
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.delete);
      const filtered = getFilteredReceipts();
      const target = filtered[idx];
      const realIndex = state.receipts.indexOf(target);
      if (realIndex >= 0) state.receipts.splice(realIndex, 1);
      save();
      render();
    };
  });
}

function getFilteredReceipts() {
  const fStore = document.getElementById("fStore")?.value?.trim().toLowerCase() || "";
  const fDate = document.getElementById("fDate")?.value || "";
  const fMin = Number(document.getElementById("fMin")?.value || "");
  const fMax = Number(document.getElementById("fMax")?.value || "");

  return state.receipts.filter((r) => {
    const storeOk = !fStore || r.store.toLowerCase().includes(fStore);
    const dateOk = !fDate || r.dateTime.startsWith(fDate);
    const minOk = Number.isNaN(fMin) || r.price >= fMin;
    const maxOk = Number.isNaN(fMax) || r.price <= fMax;
    return storeOk && dateOk && minOk && maxOk;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

load();
render();
