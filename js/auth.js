// js/auth.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.__NEXOS_API__ || "https://synapse-seven-mu.vercel.app/api";

  async function request(path, options) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
      ...options
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data.error || data.message || `Erro ${res.status}`;
      throw new Error(message);
    }
    return data;
  }

  function setLoading(form, isLoading, loadingText = "Enviando…") {
    const elements = form.querySelectorAll("input, button, textarea");
    elements.forEach(el => el.disabled = isLoading);
    const submit = form.querySelector("button[type=\"submit\"]");
    if (submit) {
      const original = submit.dataset.label || submit.textContent;
      if (!submit.dataset.label) submit.dataset.label = original;
      submit.textContent = isLoading ? loadingText : original;
      submit.classList.toggle("is-loading", isLoading);
    }
  }

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

  // Helpers
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
  formSignup?.addEventListener("submit", async (e) => {
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

    try {
      setLoading(formSignup, true, "Criando conta…");
      await request("/signup", {
        method: "POST",
        body: JSON.stringify({
          nome: nome.value.trim(),
          sobrenome: sobrenome.value.trim(),
          email: email.value.trim(),
          senha: senha.value
        })
      });

      alert("Conta criada! Vamos completar seu perfil.");
      localStorage.setItem("nexos_session", JSON.stringify({ email: email.value.trim().toLowerCase() }));
      location.href = "./perfil.html";
    } catch (err) {
      setError(email, err.message || "Erro ao criar conta.");
      alert(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(formSignup, false);
    }
  });

  // --- Login ---
  const formLogin = document.getElementById("formLogin");
  formLogin?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(formLogin);

    const email = document.getElementById("loginEmail");
    const senha = document.getElementById("loginSenha");
    let ok = true;
    if (!emailOk(email.value)) { setError(email, "E-mail inválido."); ok=false; }
    if (senha.value.length < 6) { setError(senha, "Senha inválida."); ok=false; }
    if (!ok) return;

    try {
      setLoading(formLogin, true, "Entrando…");
      const data = await request("/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.value.trim(),
          senha: senha.value
        })
      });

      alert(`Bem-vindo, ${data.usuario?.nome || "usuário"}!`);
      const sessionPayload = { email: email.value.trim().toLowerCase() };
      const token = data.session?.access_token || data.token || data.access_token;
      const refreshToken = data.session?.refresh_token || data.refresh_token;
      if (token) sessionPayload.token = token;
      if (refreshToken) sessionPayload.refreshToken = refreshToken;
      localStorage.setItem("nexos_session", JSON.stringify(sessionPayload));
      location.href = "./index.html";
    } catch (err) {
      setError(senha, err.message || "E-mail e/ou senha incorretos.");
      alert(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(formLogin, false);
    }
  });
});
