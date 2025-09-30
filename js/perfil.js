document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.__NEXOS_API__ || "http://localhost:3000";
  const form = document.getElementById("formPerfil");
  if (!form) return;

  initTagsInputs();

  const statusEl = document.getElementById("perfilStatus");
  const syncStateEl = document.getElementById("perfilSyncState");
  const btnSalvar = document.getElementById("btnSalvarPerfil");
  if (btnSalvar && !btnSalvar.dataset.label) btnSalvar.dataset.label = btnSalvar.textContent;

  const session = readJSON("nexos_session", null);
  const users = readJSON("nexos_users", []);
  let isDirty = false;

  prefillFromSession();
  bootstrap();

  form.addEventListener("input", markDirty, { passive: true });
  form.addEventListener("change", markDirty);

  form.addEventListener("submit", handleSubmit);
  document.getElementById("btnCancelar")?.addEventListener("click", () => history.back());

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`Não foi possível ler ${key} do localStorage.`, err);
      return fallback;
    }
  }

  function prefillFromSession() {
    const emailField = byId("pfEmail");
    const nomeField = byId("pfNome");
    const sobrenomeField = byId("pfSobrenome");

    if (session?.email && emailField) emailField.value = session.email;

    const storedUser = session ? users.find(u => u.email === session.email) : null;
    if (storedUser) {
      if (nomeField && !nomeField.value) nomeField.value = storedUser.nome || "";
      if (sobrenomeField && !sobrenomeField.value) sobrenomeField.value = storedUser.sobrenome || "";
    }
  }

  async function bootstrap() {
    const email = byId("pfEmail")?.value.trim().toLowerCase() || session?.email;
    if (!email) {
      setStatus("Informe um e-mail e salve para sincronizar com o servidor.");
      setSyncState("Em edição");
      return;
    }

    setStatus("Carregando dados salvos…");
    try {
      const remote = await fetchProfileRemote(email);
      if (remote) {
        fillForm(remote);
        setStatus("Perfil carregado do servidor.");
        setSyncState("Sincronizado", "synced");
        isDirty = false;
        return;
      }
    } catch (err) {
      setStatus(err.message || "Não foi possível buscar o perfil no servidor.", "error");
    }

    const local = loadProfileLocal(email);
    if (local) {
      fillForm(local);
      setStatus("Perfil carregado do armazenamento local.");
    } else {
      setStatus("Complete os dados para ter mais matches.");
    }
    setSyncState("Em edição");
  }

  function markDirty() {
    if (!isDirty) {
      setSyncState("Em edição");
      isDirty = true;
    }
  }

  function setStatus(message = "", type = "info") {
    if (!statusEl) return;
    if (!message) {
      statusEl.hidden = true;
      statusEl.textContent = "";
      statusEl.classList.remove("is-error");
      return;
    }
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", type === "error");
  }

  function setSyncState(label = "Em edição", variant = "pending") {
    if (!syncStateEl) return;
    syncStateEl.textContent = label;
    syncStateEl.classList.remove("is-synced", "is-error");
    if (variant === "synced") syncStateEl.classList.add("is-synced");
    if (variant === "error") syncStateEl.classList.add("is-error");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearErrors();
    clearTagErrors();
    setStatus();

    const data = getFormData();
    if (!validate(data)) return;

    try {
      toggleSaving(true);
      data.updatedAt = new Date().toISOString();
      setStatus("Sincronizando com o servidor…");
      setSyncState("Sincronizando…");
      const saved = await saveProfileRemote(data);
      saveProfileLocal(data.email, saved || data);
      updateLocalUsers(data);
      isDirty = false;
      setSyncState("Sincronizado", "synced");
      setStatus("Perfil sincronizado com sucesso!");
      localStorage.setItem("nexos_session", JSON.stringify({ email: data.email }));
      alert("Perfil salvo com sucesso!");
      location.href = "./index.html";
    } catch (err) {
      setSyncState("Erro ao sincronizar", "error");
      setStatus(err.message || "Não foi possível salvar no servidor.", "error");
    } finally {
      toggleSaving(false);
    }
  }

  function toggleSaving(isSaving) {
    form.querySelectorAll("input, textarea, button").forEach(el => {
      if (el.id === "btnCancelar") return;
      el.disabled = isSaving;
    });
    if (btnSalvar) {
      btnSalvar.textContent = isSaving ? "Salvando…" : (btnSalvar.dataset.label || "Salvar perfil");
    }
  }

  function getFormData() {
    const getTags = (id) => (byId(id)?.value || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const checked = (id) => !!byId(id)?.checked;

    return {
      nome: byId("pfNome")?.value.trim() || "",
      sobrenome: byId("pfSobrenome")?.value.trim() || "",
      email: (byId("pfEmail")?.value || "").trim().toLowerCase(),
      telefone: byId("pfTelefone")?.value.trim() || "",
      cidade: byId("pfCidade")?.value.trim() || "",
      uf: (byId("pfUF")?.value || "").trim().toUpperCase(),
      online: checked("pfOnline"),
      presencial: checked("pfPresencial"),
      ensina: getTags("pfEnsina"),
      aprende: getTags("pfAprende"),
      disponibilidade: getTags("pfDisponibilidade"),
      bio: byId("pfBio")?.value.trim() || "",
      site: byId("pfSite")?.value.trim() || "",
      linkedin: byId("pfLinkedin")?.value.trim() || ""
    };
  }

  function validate(d) {
    let ok = true;
    const messages = [];
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!d.nome) { setErr("pfNome", "Informe seu nome."); ok = false; }
    if (!d.sobrenome) { setErr("pfSobrenome", "Informe seu sobrenome."); ok = false; }
    if (!emailOk.test(d.email)) { setErr("pfEmail", "E-mail inválido."); ok = false; }
    if (!d.online && !d.presencial) { messages.push("Selecione pelo menos um formato: online ou presencial."); ok = false; }
    if (!d.ensina.length) { setTagInvalid("pfEnsina"); messages.push("Adicione pelo menos 1 habilidade em 'O que você ensina'."); ok = false; }
    if (!d.aprende.length) { setTagInvalid("pfAprende"); messages.push("Adicione ao menos 1 interesse em 'O que deseja aprender'."); ok = false; }

    if (!ok && messages.length) setStatus(messages[0], "error");
    return ok;
  }

  function fillForm(p) {
    byId("pfNome").value = p.nome || "";
    byId("pfSobrenome").value = p.sobrenome || "";
    byId("pfEmail").value = p.email || "";
    byId("pfTelefone").value = p.telefone || "";
    byId("pfCidade").value = p.cidade || "";
    byId("pfUF").value = p.uf || "";
    byId("pfOnline").checked = !!p.online;
    byId("pfPresencial").checked = !!p.presencial;
    hydrateTags("pfEnsina", p.ensina || []);
    hydrateTags("pfAprende", p.aprende || []);
    hydrateTags("pfDisponibilidade", p.disponibilidade || []);
    byId("pfBio").value = p.bio || "";
    byId("pfSite").value = p.site || "";
    byId("pfLinkedin").value = p.linkedin || "";
  }

  function saveProfileLocal(email, obj) {
    if (!email) return;
    const KEY = "nexos_profiles";
    const db = readJSON(KEY, {}) || {};
    db[email] = obj;
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  function loadProfileLocal(email) {
    if (!email) return null;
    const db = readJSON("nexos_profiles", {});
    return db ? db[email] || null : null;
  }

  function updateLocalUsers(data) {
    const KEY = "nexos_users";
    const list = readJSON(KEY, []);
    const payload = { email: data.email, nome: data.nome, sobrenome: data.sobrenome };
    const idx = list.findIndex((u) => u.email === data.email);
    if (idx >= 0) list[idx] = { ...list[idx], ...payload };
    else list.push(payload);
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  async function fetchProfileRemote(email) {
    if (!email) return null;
    const res = await fetch(`${API_BASE}/api/perfil/${encodeURIComponent(email)}`);
    if (res.status === 404) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data.perfil || null;
  }

  async function saveProfileRemote(payload) {
    const res = await fetch(`${API_BASE}/api/perfil`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data.perfil || payload;
  }

  function setErr(id, msg) {
    const el = byId(id);
    if (!el) return;
    el.classList.add("is-invalid");
    const small = el.closest(".field")?.querySelector(".error");
    if (small) small.textContent = msg;
  }

  function clearErrors() {
    document.querySelectorAll(".is-invalid").forEach((x) => x.classList.remove("is-invalid"));
    document.querySelectorAll(".field .error").forEach((s) => (s.textContent = ""));
  }

  function clearTagErrors() {
    document.querySelectorAll(".tags-shell.is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  }

  function setTagInvalid(hiddenId) {
    document.querySelector(`.tags-input[data-target="${hiddenId}"]`)?.classList.add("is-invalid");
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function initTagsInputs() {
    document.querySelectorAll(".tags-input").forEach((container) => {
      const hiddenId = container.dataset.target;
      const placeholder = (container.dataset.placeholder || "Digite e pressione Enter").replace(/"/g, '&quot;');
      const hidden = document.getElementById(hiddenId);
      container.classList.add("tags-shell");
      container.innerHTML = `
        <div class="tags-list"></div>
        <input class="tags-editor" type="text" placeholder="${placeholder}"/>
      `;
      const list = container.querySelector(".tags-list");
      const editor = container.querySelector(".tags-editor");

      function syncHidden() {
        const tokens = [...list.querySelectorAll(".tag-chip")].map((c) => c.dataset.val);
        hidden.value = tokens.join(",");
      }

      function addToken(val) {
        const v = (val || "").trim();
        if (!v) return;
        if ([...list.querySelectorAll(".tag-chip")].some((c) => c.dataset.val.toLowerCase() === v.toLowerCase())) return;
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.dataset.val = v;
        chip.innerHTML = `${v}<button type="button" aria-label="Remover tag">×</button>`;
        chip.querySelector("button").addEventListener("click", () => {
          chip.remove();
          syncHidden();
        });
        list.appendChild(chip);
        syncHidden();
      }

      function clearTokens() {
        list.innerHTML = "";
        syncHidden();
      }

      editor.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          addToken(editor.value);
          editor.value = "";
        } else if (e.key === "Backspace" && !editor.value) {
          list.lastElementChild?.remove();
          syncHidden();
        }
      });

      editor.addEventListener("focus", () => container.classList.remove("is-invalid"));

      container._addToken = addToken;
      container._syncHidden = syncHidden;
      container._clearTokens = clearTokens;
    });
  }

  function hydrateTags(hiddenId, values) {
    const container = document.querySelector(`.tags-input[data-target="${hiddenId}"]`);
    if (!container) return;
    container._clearTokens?.();
    (values || []).forEach((v) => container._addToken?.(v));
    container._syncHidden?.();
  }
});
