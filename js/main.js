// ---------- Boot: inclui parciais e inicia a UI ----------
(async function boot() {
    applyThemePreference();   
    await includePartials();  // Carrega Header e Footer (Onde está o Modal!)
    
    setupDashboardNav();      // Arruma a barra lateral
    await carregarDadosDoUsuario(); // Tira o "Visitante"
    setupPremiumLogic();      // <--- LIGA OS BOTÕES DO PREMIUM
    
    if (document.querySelector("#cardStack")) initUI(); 
    if (window.lucide) lucide.createIcons();
})();

// ---------- Include de componentes (header/footer) ----------
async function includePartials() {
  const includeNodes = document.querySelectorAll("[data-include]");

  // carrega todos os parciais em paralelo
  await Promise.all([...includeNodes].map(async (node) => {
    const url = node.getAttribute("data-include");
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`);
      node.outerHTML = await res.text();
    } catch (err) {
      console.error("Falha ao carregar parcial:", url, err);
      node.outerHTML = `<!-- erro ao carregar ${url} -->`;
    }
  }));

  // ícones e ano no footer
  if (window.lucide) lucide.createIcons();
  const ano = document.getElementById("anoAtual");
  if (ano) ano.textContent = new Date().getFullYear();

  // 🔒 Guardas contra duplicação/markup fora do lugar
  // 1) manter apenas o primeiro header
  const headers = document.querySelectorAll(".nx-header");
  if (headers.length > 1) {
    [...headers].slice(1).forEach(h => h.remove());
  }
  // 2) remover qualquer CTA que esteja fora do header
  document.querySelectorAll(".nx-cta").forEach(el => {
    if (!el.closest(".nx-header")) el.remove();
  });

  // 3) garantir navegação dos botões mesmo se forem <button>
  document.getElementById("btnAbrirLogin")?.addEventListener("click", () => {
    if (location.pathname.endsWith("auth.html") && location.hash === "#login") return;
    location.href = "./auth.html#login";
  });
  document.getElementById("btnAbrirCadastro")?.addEventListener("click", () => {
    if (location.pathname.endsWith("auth.html") && location.hash === "#signup") return;
    location.href = "./auth.html#signup";
  });

  if (/auth\.html$/.test(location.pathname)) {
    document.querySelector(".nx-cta")?.remove();
    document.querySelector(".nx-nav")?.remove();
    document.querySelector(".nx-header")?.classList.add("nx-header--auth");
    document.querySelector(".footer-cta")?.remove();
  }

  applyHeaderSessionState();
  setupNavigationHighlight();
  setupDashboardNav();
}

function applyThemePreference() {
  const root = document.documentElement;
  const storedTheme = readThemePreference();
  const mediaQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  const resolved = storedTheme || (mediaQuery?.matches ? "light" : "dark");

  setTheme(resolved);

  if (!storedTheme && mediaQuery) {
    const handler = (event) => setTheme(event.matches ? "light" : "dark");
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", handler);
    else if (mediaQuery.addListener) mediaQuery.addListener(handler);
  }

  window.__setSynapseTheme = (nextTheme = "dark") => {
    const normalized = nextTheme === "light" ? "light" : "dark";
    setTheme(normalized);
    storeThemePreference(normalized);
  };

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
  }
}

function readThemePreference() {
  try {
    const stored = localStorage.getItem("nexos_theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch (err) {
    console.warn("Não foi possível ler preferência de tema.", err);
  }
  return null;
}

function storeThemePreference(theme) {
  try {
    localStorage.setItem("nexos_theme", theme);
  } catch (err) {
    console.warn("Não foi possível salvar preferência de tema.", err);
  }
}

function applyHeaderSessionState() {
  const session = getStoredSession();
  const isAuthenticated = Boolean(session?.email);
  const displayName = resolveUserDisplayName(session);

  document.querySelectorAll(".nx-header .nx-cta").forEach((cta) => {
    cta.querySelectorAll('[data-role="auth"]').forEach((node) => {
      if (isAuthenticated) node.setAttribute("hidden", "");
      else node.removeAttribute("hidden");
    });

    const userLink = cta.querySelector('[data-role="user"]');
    if (!userLink) return;
    if (isAuthenticated) {
      userLink.removeAttribute("hidden");
      if (!userLink.getAttribute("href")) {
        userLink.setAttribute("href", "./perfil.html");
      }
      if (displayName) {
        const label = `Ir para área do usuário (${displayName})`;
        userLink.setAttribute("aria-label", label);
        userLink.setAttribute("title", label);
      }
    } else {
      userLink.setAttribute("hidden", "");
      userLink.setAttribute("aria-label", "Ir para área do usuário");
      userLink.removeAttribute("title");
    }
  });
}

function setupNavigationHighlight() {
  const nav = document.querySelector(".nx-nav");
  const indicator = nav?.querySelector(".nx-nav-indicator");
  if (!nav || !indicator) return;

  const links = [...nav.querySelectorAll("a[data-section]")];
  if (!links.length) return;

  const sections = [
    { id: "hero", el: document.getElementById("hero"), section: "hero" },
    { id: "como-funciona", el: document.getElementById("como-funciona"), section: "como-funciona" },
    { id: "seguranca", el: document.getElementById("seguranca"), section: "como-funciona" },
    { id: "sobre", el: document.getElementById("sobre"), section: "sobre" },
    { id: "faq", el: document.getElementById("faq"), section: "sobre" }
  ].filter((s) => s.el);

  const linkById = new Map(links.map((link) => [link.dataset.section, link]));
  let current = "";

  function updateIndicator(link) {
    if (!link) return;
    requestAnimationFrame(() => {
      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const offset = linkRect.left - navRect.left - 6 + nav.scrollLeft;
      nav.style.setProperty("--nav-indicator-width", `${linkRect.width}px`);
      nav.style.setProperty("--nav-indicator-x", `${offset}px`);
      nav.classList.add("ready");
    });
  }

  function activate(sectionId) {
    const targetSection = sections.find((s) => s.id === sectionId)?.section || "hero";
    if (current === targetSection) {
      updateIndicator(linkById.get(targetSection));
      return;
    }
    current = targetSection;
    links.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.section === current);
    });
    updateIndicator(linkById.get(current));
  }

  if (!sections.length) {
    const fallback = links[0];
    links.forEach((link) => link.classList.toggle("is-active", link === fallback));
    updateIndicator(fallback);
    return;
  }

  function detectActiveSection() {
    const orderedSections = sections
      .slice()
      .sort((a, b) => a.el.offsetTop - b.el.offsetTop);
    if (!orderedSections.length) return;
    const referenceY = window.scrollY + window.innerHeight * 0.38;
    let candidate = orderedSections[0];
    for (const section of orderedSections) {
      if (section.el.offsetTop <= referenceY) {
        candidate = section;
      } else {
        break;
      }
    }
    if (candidate) activate(candidate.id);
  }

  detectActiveSection();

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      detectActiveSection();
      const activeLink = linkById.get(current);
      if (activeLink) updateIndicator(activeLink);
      ticking = false;
    });
  }, { passive: true });

  window.addEventListener("resize", () => {
    detectActiveSection();
    const activeLink = linkById.get(current);
    if (activeLink) updateIndicator(activeLink);
  });

  links.forEach((link) => {
    const sectionId = link.dataset.section;
    const targetSection = document.getElementById(sectionId);
    link.addEventListener("click", (event) => {
      if (!targetSection) return;
      event.preventDefault();
      activate(sectionId);
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function setupDashboardNav() {
  const sidebar = document.querySelector(".dashboard-sidebar");
  if (!sidebar) return;

  const links = [...sidebar.querySelectorAll(".dashboard-menu .dashboard-link")];
  const currentPage = document.body?.dataset.page || resolveCurrentPage();
  links.forEach((link) => {
    const isActive = link.dataset.page === currentPage;
    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const nameEl = sidebar.querySelector("#dashboardUserName");
  const session = getStoredSession();
  if (nameEl) nameEl.textContent = resolveUserDisplayName(session);

  const logoutBtn = sidebar.querySelector("[data-action=\"logout\"]");
  if (logoutBtn && !logoutBtn.dataset.bound) {
    logoutBtn.dataset.bound = "true";
    logoutBtn.addEventListener("click", () => {
      try { localStorage.removeItem("nexos_session"); } catch (err) { console.warn("Não foi possível limpar localStorage.", err); }
      try { sessionStorage.removeItem("nexos_session"); } catch (err) { console.warn("Não foi possível limpar sessionStorage.", err); }
      location.href = "./auth.html#login";
    });
  }
}

function resolveCurrentPage() {
  const path = location.pathname.split("/").pop() || "";
  return path.replace(/\.html$/, "") || "perfil";
}

function getStoredSession() {
  try {
    const raw = localStorage.getItem("nexos_session");
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn("Não foi possível ler sessão do localStorage.", err);
  }
  try {
    const raw = sessionStorage.getItem("nexos_session");
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn("Não foi possível ler sessão do sessionStorage.", err);
  }
  return null;
}

function resolveUserDisplayName(session) {
  const fallback = "Visitante";
  if (!session) return fallback;

  const direct = [session.nomeCompleto, session.nome, session.name]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean);
  if (direct) return direct;

  const composed = [session.nome, session.sobrenome]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .join(" ");
  if (composed) return composed;

  if (session.email) {
    const localUser = resolveLocalUserByEmail(session.email);
    if (localUser) {
      const localName = [localUser.nome, localUser.sobrenome]
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
        .join(" ");
      if (localName) return localName;
      if (localUser.nome && typeof localUser.nome === "string") return localUser.nome.trim();
    }
  }

  return fallback;
}

function resolveLocalUserByEmail(email) {
  if (!email) return null;
  try {
    const raw = localStorage.getItem("nexos_users");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.find((user) => user?.email === email) || null;
  } catch (err) {
    console.warn("Não foi possível ler usuários locais.", err);
    return null;
  }
}

// ---------- UI: Stack de cartões + swipe ----------
async function initUI() {
  const stack = document.getElementById("cardStack");
  if (!stack) return;

  // Token para chamar a API
  const sessionRaw = localStorage.getItem("nexos_session");
  if (!sessionRaw) return;
  const token = JSON.parse(sessionRaw).token;

  try {
      // 1. Busca Matches Reais do Backend
      const res = await fetch("https://synapse-seven-mu.vercel.app/api/matches", {
          headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Erro ao buscar matches");
      const data = await res.json();
      
      const perfis = data.matches || [];
      const isPremium = data.isPremium;
      const limitReached = data.limitReached; // Backend diz se cortou a lista

      stack.innerHTML = "";

      // 2. Se atingiu o limite (Free), coloca o cartão de bloqueio no fundo
      if (limitReached) {
          const promoCard = document.createElement("article");
          promoCard.className = "swipe-card promo-card";
          promoCard.innerHTML = `
            <div class="photo" style="background:linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%); display:flex; align-items:center; justify-content:center; flex-direction:column; text-align:center; padding:30px;">
                <div style="font-size:4rem; margin-bottom:20px;">🔒</div>
                <h2 style="color:#fff; margin-bottom:10px;">Limite Diário</h2>
                <p style="color:#94a3b8; font-size:1.1rem; margin-bottom:30px;">Vire Premium para ver ilimitado.</p>
                <button id="btnUpgradeStack" class="btn primary shine-button" style="transform: scale(1.2); pointer-events: auto;">
                    Desbloquear Agora 💎
                </button>
            </div>
          `;
          setTimeout(() => {
              const btn = promoCard.querySelector("#btnUpgradeStack");
              if(btn) btn.addEventListener("click", (e) => {
                  e.stopPropagation();
                  window.openPremiumModal(); 
              });
          }, 100);
          stack.appendChild(promoCard);
      }

      // 3. Renderiza os perfis do banco
      // Se não tiver ninguém no banco (além de você), avisa
      if (perfis.length === 0 && !limitReached) {
           stack.innerHTML = `<div style="color:#fff; text-align:center; padding:40px;">Sem novos perfis por enquanto.</div>`;
           return;
      }

      [...perfis].reverse().forEach((p) => {
        const el = document.createElement("article");
        el.className = "swipe-card";
        // Foto ou Placeholder se null
        const bg = p.foto || "./img/placeholder-avatar.png";
        // Tags (se existirem)
        const tagsHtml = (p.tag_ensinar || []).map(t => `<span class="tag">Ensina: ${t}</span>`).join("");

        el.innerHTML = `
          <div class="photo" style="background-image:url('${bg}');"></div>
          <div class="meta">
            <div class="name">${p.nome || "Usuário"}</div>
            <small>${p.bio || ""}</small>
            <div class="tags">${tagsHtml}</div>
          </div>`;
        
        // Lógica de Swipe (Mantida)
        let startX = 0;
        el.addEventListener("mousedown", e => { startX = e.clientX; });
        el.addEventListener("mouseup", e => {
            if (e.clientX - startX > 100) { el.remove(); } 
            else if (e.clientX - startX < -100) { el.remove(); }
        });
        el.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, {passive: true});
        el.addEventListener("touchend", e => {
            if (e.changedTouches[0].clientX - startX > 100) { el.remove(); }
            else if (e.changedTouches[0].clientX - startX < -100) { el.remove(); }
        });
        
        stack.appendChild(el);
      });

  } catch (err) {
      console.error(err);
  }
}

// 2. LÓGICA DO PREMIUM (ABRIR MODAL + IR PRO PAGAMENTO)
function setupPremiumLogic() {
    const modal = document.getElementById("modalPlans");

    // A. ABRIR O MODAL (Qualquer botão com id="btnUpgrade")
    document.body.addEventListener("click", (e) => {
        // Usa closest para funcionar mesmo clicando no ícone dentro do botão
        const trigger = e.target.closest("#btnUpgrade");
        
        if (trigger) {
            e.preventDefault();
            if (modal) {
                modal.setAttribute("aria-hidden", "false"); // Mostra o modal
            } else {
                console.error("Erro: Modal de planos não encontrado no HTML.");
            }
        }
    });

    // B. FECHAR O MODAL (Botão X ou clicar fora)
    document.body.addEventListener("click", (e) => {
        if (e.target.id === "btnClosePlans" || e.target === modal) {
            if (modal) modal.setAttribute("aria-hidden", "true");
        }
    });

    // C. BOTÃO "VIRAR PREMIUM" DENTRO DO MODAL -> VAI PARA PAGAMENTO
    document.body.addEventListener("click", (e) => {
        const btnPagar = e.target.closest("#btnAssinarPremium");
        
        if (btnPagar) {
            e.preventDefault();

            // Verifica se está logado
            const sessionRaw = localStorage.getItem("nexos_session") || sessionStorage.getItem("nexos_session");
            if (!sessionRaw) {
                alert("Faça login primeiro!");
                location.href = "./auth.html#login";
                return;
            }

            // Fecha o modal e redireciona
            if (modal) modal.setAttribute("aria-hidden", "true");
            window.location.href = "./pagamento.html";
        }
    });
}

// 3. DADOS DO USUÁRIO (TIRAR O "VISITANTE")
async function carregarDadosDoUsuario() {
    const sessionRaw = localStorage.getItem("nexos_session") || sessionStorage.getItem("nexos_session");
    if (!sessionRaw) return; 

    const session = JSON.parse(sessionRaw);
    const token = session.token || session.access_token;
    if (!token) return;

    try {
        const res = await fetch("https://synapse-seven-mu.vercel.app/api/profile", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            const u = data.perfil;

            session.eh_premium = u.eh_premium;
            localStorage.setItem("nexos_session", JSON.stringify(session));

            // Preenche Sidebar
            const sidebarName = document.getElementById("sidebarUserName");
            if (sidebarName && u.nome) {
                sidebarName.textContent = `${u.nome} ${u.sobrenome}`;
                if (u.eh_premium) sidebarName.classList.add("text-gold");
            }

            // Preenche Autofill se estiver na página de perfil
            if (document.getElementById("pfNome")) {
                document.getElementById("pfNome").value = u.nome || "";
                document.getElementById("pfSobrenome").value = u.sobrenome || "";
                document.getElementById("pfEmail").value = u.email || "";
                document.getElementById("pfBio").value = u.bio || "";

                const img = document.getElementById("imgAvatarDisplay");
                if (img && u.foto) img.src = u.foto;
            }
        }
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
    }
}
