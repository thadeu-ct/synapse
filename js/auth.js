// js/auth.js
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".auth-tab");
  const panels = document.querySelectorAll(".auth-form");

  function activate(tabName) {
    tabs.forEach(b => {
      const is = b.dataset.tab === tabName;
      b.classList.toggle("is-active", is);
      b.setAttribute("aria-selected", String(is));
    });
    panels.forEach(p => {
      const is = p.dataset.panel === tabName;
      p.classList.toggle("is-hidden", !is);
      p.setAttribute("aria-hidden", String(!is));
    });
    document.querySelector(`.auth-form[data-panel="${tabName}"] input`)?.focus();
  }

  tabs.forEach(b => b.addEventListener("click", () => activate(b.dataset.tab)));
  // abre a aba pelo hash (auth.html#signup)
  if (location.hash === "#signup") activate("signup"); else activate("login");

  // Mostrar/ocultar senha
  document.querySelectorAll(".showpass").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.getAttribute("data-target"));
      if (!target) return;
      target.type = target.type === "password" ? "text" : "password";
      btn.setAttribute("aria-pressed", target.type === "text" ? "true" : "false");
    });
  });

  // ---- Persistência simplificada (protótipo) ----
  const DB_KEY = "nexos_users"; // [{email, senha, nome, sobrenome}]
  const loadUsers = () => JSON.parse(localStorage.getItem(DB_KEY) || "[]");
  const saveUsers = (arr) => localStorage.setItem(DB_KEY, JSON.stringify(arr));
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function setError(input, msg) {
    const small = input.closest(".field")?.querySelector(".error");
    if (small) small.textContent = msg || "";
    input.classList.toggle("is-invalid", !!msg);
  }
  function clearErrors(form) {
    form.querySelectorAll(".error").forEach(s => s.textContent = "");
    form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
  }

  // --- Signup ---
  const formSignup = document.getElementById("formSignup");
  formSignup?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(formSignup);

    const nome = document.getElementById("nome");
    const sobrenome = document.getElementById("sobrenome");
    const email = document.getElementById("signupEmail");
    const senha = document.getElementById("signupSenha");
    const confirma = document.getElementById("signupConfirma");
    const aceito = document.getElementById("aceito");

    let ok = true;
    if (!nome.value.trim()) { setError(nome, "Informe seu nome."); ok=false; }
    if (!sobrenome.value.trim()) { setError(sobrenome, "Informe seu sobrenome."); ok=false; }
    if (!emailOk(email.value)) { setError(email, "E-mail inválido."); ok=false; }
    if (senha.value.length < 6) { setError(senha, "Mínimo 6 caracteres."); ok=false; }
    if (senha.value !== confirma.value) { setError(confirma, "As senhas não conferem."); ok=false; }
    if (!aceito.checked) { setError(aceito, "Você precisa aceitar os termos."); ok=false; }
    if (!ok) return;

    const users = loadUsers();
    if (users.some(u => u.email.toLowerCase() === email.value.toLowerCase())) {
      setError(email, "Este e-mail já está cadastrado.");
      return;
    }

    users.push({
      email: email.value.trim(),
      senha: senha.value, // protótipo
      nome: nome.value.trim(),
      sobrenome: sobrenome.value.trim()
    });
    saveUsers(users);

    // cria sessão e vai para o cadastro de perfil
    localStorage.setItem("nexos_session", JSON.stringify({ email: email.value.trim().toLowerCase() }));
    alert("Conta criada! Vamos completar seu perfil.");
    location.href = "./cadastro.html";
  });

  // --- Login ---
  const formLogin = document.getElementById("formLogin");
  formLogin?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(formLogin);

    const email = document.getElementById("loginEmail");
    const senha = document.getElementById("loginSenha");
    let ok = true;
    if (!emailOk(email.value)) { setError(email, "E-mail inválido."); ok=false; }
    if (senha.value.length < 6) { setError(senha, "Senha inválida."); ok=false; }
    if (!ok) return;

    const users = loadUsers();
    const user = users.find(u =>
      u.email.toLowerCase() === email.value.toLowerCase() && u.senha === senha.value
    );
    if (!user) {
      setError(senha, "E-mail e/ou senha incorretos.");
      return;
    }

    localStorage.setItem("nexos_session", JSON.stringify({ email: user.email }));
    alert(`Bem-vindo, ${user.nome || "usuário"}!`);
    location.href = "./index.html";
  });
});
