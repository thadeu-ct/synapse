// js/auth.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.__NEXOS_API__ || "https://synapse-seven-mu.vercel.app/api";
  const REMEMBER_KEY = "nexos_remember";

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

  function readRemembered() {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn("Não foi possível ler dados do lembrar de mim.", err);
      return {};
    }
  }

  function persistRemembered(email) {
    if (!email) {
      localStorage.removeItem(REMEMBER_KEY);
      return;
    }
    localStorage.setItem(REMEMBER_KEY, JSON.stringify({
      email: email.trim(),
      updatedAt: new Date().toISOString()
    }));
  }

  const tabs = document.querySelectorAll(".auth-tab");
  const panels = document.querySelectorAll(".auth-form");
  const lembrar = document.getElementById("lembrar");
  const loginEmail = document.getElementById("loginEmail");

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

  const remembered = readRemembered();
  if (remembered?.email && loginEmail && lembrar) {
    loginEmail.value = remembered.email;
    lembrar.checked = true;
  }
  lembrar?.addEventListener("change", () => {
    if (!loginEmail) return;
    if (lembrar.checked) persistRemembered(loginEmail.value);
    else persistRemembered("");
  });
  loginEmail?.addEventListener("blur", () => {
    if (!lembrar?.checked) return;
    persistRemembered(loginEmail.value);
  });

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
    if (!form) return;
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
    if (!aceito.checked) { 
        alert("Para criar sua conta, você precisa ler e aceitar os Termos e Condições e a Política de Privacidade.");
        ok=false; 
    }

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

      const token = response.session?.access_token;
      
      if (token) {
          // 3. Salva a sessão completa (Token + Dados)
          const sessionPayload = {
              email: email.value.trim().toLowerCase(),
              nome: nome.value.trim(),
              sobrenome: sobrenome.value.trim(),
              token: token // <--- O PASSAPORTE
          };
          localStorage.setItem("nexos_session", JSON.stringify(sessionPayload));
          
          alert("Conta criada! Entrando...");
      } else {
          alert("Conta criada! Faça login para continuar.");
      }

      location.href = "./perfil.html";

      alert("Conta criada! Vamos completar seu perfil.");
      const firstName = nome.value.trim();
      const lastName = sobrenome.value.trim();
      const normalizedEmail = email.value.trim().toLowerCase();
      const sessionPayload = { email: normalizedEmail };
      if (firstName) sessionPayload.nome = firstName;
      if (lastName) sessionPayload.sobrenome = lastName;
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
      if (fullName) sessionPayload.nomeCompleto = fullName;
      localStorage.setItem("nexos_session", JSON.stringify(sessionPayload));
      location.href = "./perfil.html";
    } catch (err) {
      // 1. Definimos a mensagem primeiro
      const msg = (err.message || "").toLowerCase(); 
      
      // 2. Verificamos se é erro de duplicidade
      if (msg.includes("cadastrado") || msg.includes("registered")) {
          if(confirm("Este e-mail já possui uma conta no Synapse.\n\nDeseja ir para a tela de Login?")) {
             // Copia o email para o campo de login para facilitar
             const loginInput = document.getElementById("loginEmail");
             if(loginInput) loginInput.value = email.value; 
             
             activate("login"); // Muda a aba
             return;
          }
      }
      
      // 3. Se não for duplicado (ou se a pessoa cancelou o popup), mostra o erro no input
      setError(email, err.message || "Erro ao criar conta.");
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
    const remember = lembrar?.checked;
    let ok = true;
    
    if (!emailOk(email.value)) { setError(email, "E-mail inválido."); ok=false; }
    if (senha.value.length < 6) { setError(senha, "Senha inválida."); ok=false; }
    if (!ok) return;

    try {
      setLoading(formLogin, true, "Entrando…");
      
      // 1. Faz a requisição
      const data = await request("/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.value.trim(),
          senha: senha.value
        })
      });

      // 2. Pega os dados DIRETO da resposta do nosso backend
      const token = data.token; // O backend manda 'token'
      const usuario = data.usuario || {}; // O backend manda 'usuario'

      if (!token) {
          throw new Error("Erro: Servidor não retornou token de acesso.");
      }

      alert(`Bem-vindo de volta, ${usuario.nome}!`);

      // 3. Monta a sessão
      const sessionPayload = {
        email: usuario.email,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        token: token
      };

      const serializedSession = JSON.stringify(sessionPayload);

      // 4. Salva a sessão (Prioridade para localStorage se 'Lembrar' estiver marcado)
      if (remember) {
        localStorage.setItem("nexos_session", serializedSession);
        sessionStorage.removeItem("nexos_session");
        persistRemembered(email.value);
      } else {
        sessionStorage.setItem("nexos_session", serializedSession);
        localStorage.removeItem("nexos_session"); // Limpa se existir antigo
        persistRemembered("");
      }
      
      // 5. Redireciona
      location.href = "./perfil.html";

    } catch (err) {
      console.error("Erro no login:", err);
      setError(senha, err.message || "E-mail e/ou senha incorretos.");
      // alert removido para não irritar o usuário, a mensagem no input é melhor
    } finally {
      setLoading(formLogin, false);
    }
  });


  // --- Recuperação de senha ---
  const modalForgot = document.getElementById("modalRecuperar");
  const formRecuperar = document.getElementById("formRecuperar");
  const forgotStatus = document.getElementById("forgotStatus");
  const forgotEmail = document.getElementById("forgotEmail");
  const linkEsqueci = document.getElementById("linkEsqueci");
  const btnCancelarRecuperar = document.getElementById("btnCancelarRecuperar");
  let modalListenerAttached = false;

  function setForgotStatus(message = "", type = "info") {
    if (!forgotStatus) return;
    if (!message) {
      forgotStatus.hidden = true;
      forgotStatus.textContent = "";
      forgotStatus.classList.remove("is-error");
      return;
    }
    forgotStatus.hidden = false;
    forgotStatus.textContent = message;
    forgotStatus.classList.toggle("is-error", type === "error");
  }

  function openForgotModal() {
    if (!modalForgot) return;
    modalForgot.setAttribute("aria-hidden", "false");
    document.body?.classList.add("modal-open");
    setForgotStatus();
    clearErrors(formRecuperar);
    if (forgotEmail) {
      if (!forgotEmail.value && loginEmail?.value) {
        forgotEmail.value = loginEmail.value.trim();
      }
      forgotEmail.focus();
    }
    if (!modalListenerAttached) {
      modalListenerAttached = true;
      document.addEventListener("keydown", handleModalKeydown);
    }
  }

  function closeForgotModal() {
    if (!modalForgot) return;
    modalForgot.setAttribute("aria-hidden", "true");
    document.body?.classList.remove("modal-open");
    setForgotStatus();
    formRecuperar?.reset();
    clearErrors(formRecuperar);
    if (modalListenerAttached) {
      document.removeEventListener("keydown", handleModalKeydown);
      modalListenerAttached = false;
    }
  }

  function handleModalKeydown(evt) {
    if (evt.key === "Escape") {
      evt.preventDefault();
      closeForgotModal();
    }
  }

  modalForgot?.addEventListener("click", (evt) => {
    if (evt.target === modalForgot) closeForgotModal();
  });
  linkEsqueci?.addEventListener("click", (evt) => {
    evt.preventDefault();
    openForgotModal();
  });
  btnCancelarRecuperar?.addEventListener("click", closeForgotModal);

  formRecuperar?.addEventListener("submit", async (evt) => {
    evt.preventDefault();
    clearErrors(formRecuperar);
    setForgotStatus();

    if (!forgotEmail) return;
    const email = forgotEmail.value.trim();
    if (!emailOk(email)) {
      setError(forgotEmail, "E-mail inválido.");
      return;
    }

    try {
      setLoading(formRecuperar, true, "Enviando link…");
      await request("/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setForgotStatus("Se o e-mail estiver cadastrado, você receberá os próximos passos em instantes.");
      persistRemembered(email);
      lembrar && (lembrar.checked = true);
      loginEmail && (loginEmail.value = email);
      setTimeout(closeForgotModal, 2200);
    } catch (err) {
      console.error(err);
      setForgotStatus(err.message || "Não foi possível iniciar a recuperação de senha.", "error");
    } finally {
      setLoading(formRecuperar, false);
    }
  });
});
