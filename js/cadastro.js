document.addEventListener("DOMContentLoaded", () => {
  // 1) Mini componente de Tags (sem libs)
  initTagsInputs();

  // 2) Pré-preenche e-mail/nome se veio da sessão
  const session = JSON.parse(localStorage.getItem("nexos_session") || "null");
  const users = JSON.parse(localStorage.getItem("nexos_users") || "[]");
  const user = session ? users.find(u => u.email === session.email) : null;

  if (user) {
    document.getElementById("pfEmail").value = user.email;
    document.getElementById("pfNome").value = user.nome || "";
    document.getElementById("pfSobrenome").value = user.sobrenome || "";
  }

  // 3) Carrega perfil salvo (se existir)
  const existing = session ? loadProfile(session.email) : null;
  if (existing) fillForm(existing);

  // 4) Submissão
  const form = document.getElementById("formPerfil");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = getFormData();
    const ok = validate(data);
    if (!ok) return;

    saveProfile(data.email, data);
    alert("Perfil salvo com sucesso!");
    location.href = "./index.html";
  });

  // 5) Cancelar
  document.getElementById("btnCancelar").addEventListener("click", () => {
    history.back();
  });

  // Helpers de dados (localStorage)
  function saveProfile(email, obj) {
    const KEY = "nexos_profiles";
    const db = JSON.parse(localStorage.getItem(KEY) || "{}");
    db[email] = obj;
    localStorage.setItem(KEY, JSON.stringify(db));
  }
  function loadProfile(email) {
    const db = JSON.parse(localStorage.getItem("nexos_profiles") || "{}");
    return db[email] || null;
  }

  function getFormData() {
    const getTags = (id) => (document.getElementById(id).value || "")
      .split(",").map(s => s.trim()).filter(Boolean);

    const getDisp = () => [...document.querySelectorAll('input[name="disp"]:checked')].map(i => i.value);

    return {
      nome: byId("pfNome").value.trim(),
      sobrenome: byId("pfSobrenome").value.trim(),
      email: byId("pfEmail").value.trim().toLowerCase(),
      telefone: byId("pfTelefone").value.trim(),
      cidade: byId("pfCidade").value.trim(),
      uf: byId("pfUF").value.trim().toUpperCase(),
      online: byId("pfOnline").checked,
      presencial: byId("pfPresencial").checked,
      ensina: getTags("pfEnsina"),
      aprende: getTags("pfAprende"),
      disponibilidade: getDisp(),
      bio: byId("pfBio").value.trim(),
      site: byId("pfSite").value.trim(),
      linkedin: byId("pfLinkedin").value.trim(),
      updatedAt: new Date().toISOString()
    };
  }

  function validate(d) {
    let ok = true;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    clearErrors();

    if (!d.nome) { setErr("pfNome", "Informe seu nome."); ok = false; }
    if (!d.sobrenome) { setErr("pfSobrenome", "Informe seu sobrenome."); ok = false; }
    if (!emailOk.test(d.email)) { setErr("pfEmail", "E-mail inválido."); ok = false; }
    if (!d.online && !d.presencial) { alert("Selecione pelo menos um formato: online ou presencial."); ok = false; }
    if (!d.ensina.length) { alert("Adicione pelo menos 1 habilidade em 'Ensina'."); ok = false; }
    if (!d.aprende.length) { alert("Adicione pelo menos 1 tema em 'Quer aprender'."); ok = false; }

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
    byId("pfBio").value = p.bio || "";
    byId("pfSite").value = p.site || "";
    byId("pfLinkedin").value = p.linkedin || "";
    // disponibilidade
    (p.disponibilidade || []).forEach(v => {
      const i = document.querySelector(`input[name="disp"][value="${v}"]`);
      if (i) i.checked = true;
    });
  }

  // ---- UI helpers ----
  function byId(id){ return document.getElementById(id); }
  function setErr(id, msg){
    const el = byId(id);
    el.classList.add("is-invalid");
    const small = el.closest(".field")?.querySelector(".error");
    if (small) small.textContent = msg;
  }
  function clearErrors(){
    document.querySelectorAll(".is-invalid").forEach(x => x.classList.remove("is-invalid"));
    document.querySelectorAll(".error").forEach(s => s.textContent = "");
  }

  // Tags Input (token simples, tecla Enter/Vírgula)
  function initTagsInputs() {
    document.querySelectorAll(".tags-input").forEach(container => {
      const hiddenId = container.dataset.target;
      const hidden = document.getElementById(hiddenId);
      container.classList.add("tags-shell");
      container.innerHTML = `
        <div class="tags-list"></div>
        <input class="tags-editor" type="text" placeholder="Digite e pressione Enter"/>
      `;
      const list = container.querySelector(".tags-list");
      const editor = container.querySelector(".tags-editor");

      function syncHidden() {
        const tokens = [...list.querySelectorAll(".tag-chip")].map(c => c.dataset.val);
        hidden.value = tokens.join(",");
      }

      function addToken(val) {
        const v = (val || "").trim();
        if (!v) return;
        if ([...list.querySelectorAll(".tag-chip")].some(c => c.dataset.val.toLowerCase() === v.toLowerCase())) return;
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.dataset.val = v;
        chip.innerHTML = `${v}<button type="button" aria-label="remover">×</button>`;
        chip.querySelector("button").addEventListener("click", () => { chip.remove(); syncHidden(); });
        list.appendChild(chip);
        syncHidden();
      }

      editor.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          addToken(editor.value);
          editor.value = "";
        } else if (e.key === "Backspace" && !editor.value) {
          // apagar último chip
          list.lastElementChild?.remove();
          syncHidden();
        }
      });

      // expõe helpers para hidratar a partir do JS
      container._addToken = addToken;
      container._syncHidden = syncHidden;
    });
  }

  function hydrateTags(hiddenId, values){
    const container = document.querySelector(`.tags-input[data-target="${hiddenId}"]`);
    if (!container) return;
    values.forEach(v => container._addToken(v));
    container._syncHidden();
  }
});
