// ---------- Boot: inclui parciais e inicia a UI ----------
(async function boot() {
  await includePartials();  // carrega header/footer
  initUI();                 // prepara cartões e listeners
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
  document.getElementById("btnAbrirCriarPerfil")?.addEventListener("click", () => {
    if (location.pathname.endsWith("perfil.html")) return;
    location.href = "./perfil.html";
  });
}

// ---------- Dados fake (pode vir de API depois) ----------
const perfis = [
  {
    nome: "Ana Ribeiro", idade: 24,
    ensina: ["Inglês básico", "Conversação"],
    aprende: ["HTML/CSS"],
    foto: "./img/placeholder-avatar.png",
    bio: "Formada em Letras. Curto ensinar com foco em conversação leve."
  },
  {
    nome: "Diego Martins", idade: 28,
    ensina: ["JavaScript", "Git/GitHub"],
    aprende: ["Violão iniciante"],
    foto: "./img/placeholder-avatar.png",
    bio: "Dev front-end. Quero trocar JS por violão 👀"
  },
  {
    nome: "Marina Lopes", idade: 31,
    ensina: ["Ilustração", "Procreate"],
    aprende: ["Marketing digital"],
    foto: "./img/placeholder-avatar.png",
    bio: "Ilustradora freelancer. Bora trocar desenho por growth!"
  }
];

// ---------- UI: Stack de cartões + swipe ----------
function initUI() {
  const stack = document.getElementById("cardStack");
  const modalMatch = document.getElementById("modalMatch");
  const matchText = document.getElementById("matchText");

  if (!stack) {
    console.warn("Elemento #cardStack não encontrado.");
    return;
  }

  function criarCard(p, idx) {
    const el = document.createElement("article");
    el.className = "swipe-card";
    el.dataset.index = String(idx);
    el.innerHTML = `
      <div class="photo" style="background-image:url('${p.foto}');"></div>
      <div class="meta">
        <div>
          <div class="name">${p.nome}, ${p.idade}</div>
          <small>${p.bio}</small>
        </div>
        <div class="tags">
          ${p.ensina.slice(0,1).map(t => `<span class="tag">Ensina: ${t}</span>`).join("")}
          ${p.aprende.slice(0,1).map(t => `<span class="tag">Quer: ${t}</span>`).join("")}
        </div>
      </div>
    `;
    // Drag (mouse + touch)
    let offset = { x: 0, y: 0 }, start = null;
    const getXY = (e) => ({
      x: e.clientX ?? e.touches?.[0]?.clientX,
      y: e.clientY ?? e.touches?.[0]?.clientY
    });

    const onDown = (e) => { start = getXY(e); el.setPointerCapture?.(e.pointerId); };
    const onMove = (e) => {
      if (!start) return;
      const now = getXY(e);
      offset = { x: now.x - start.x, y: now.y - start.y };
      el.style.transform = `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x/18}deg)`;
      el.style.transition = "none";
    };
    const onUp = () => {
      const threshold = 120;
      if (offset.x > threshold) like(el);
      else if (offset.x < -threshold) nope(el);
      else reset(el);
      start = null; offset = { x: 0, y: 0 };
    };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onUp);

    return el;
  }

  function renderStack() {
    stack.innerHTML = "";
    // o último inserido fica no fundo; iteramos invertido
    [...perfis].reverse().forEach((p, i) => {
      const card = criarCard(p, perfis.length - 1 - i);
      stack.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
  }

  function animateOut(el, dir = 1) {
    el.style.transition = "transform .28s ease-out, opacity .28s ease-out";
    el.style.transform = `translate(${dir*600}px, -40px) rotate(${dir*25}deg)`;
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 260);
  }

  function reset(el) {
    el.style.transition = "transform .22s ease";
    el.style.transform = "translate(0,0) rotate(0)";
  }

  function like(el) {
    const idx = Number(el.dataset.index);
    const perfil = perfis[idx];
    animateOut(el, +1);

    // regra simples de match
    const voceQuer = ["JS","JavaScript","Inglês","HTML/CSS","Violão"];
    const match = perfil.ensina.some(s =>
      voceQuer.some(v => s.toLowerCase().includes(v.toLowerCase()))
    );
    if (match) {
      if (matchText) matchText.textContent = `Você e ${perfil.nome} têm interesses complementares!`;
      modalMatch?.setAttribute("aria-hidden", "false");
    }
  }

  function nope(el) { animateOut(el, -1); }

  // Botões
  document.getElementById("btnLike")?.addEventListener("click", () => {
    const top = stack.querySelector(".swipe-card:last-child");
    if (top) like(top);
  });
  document.getElementById("btnNope")?.addEventListener("click", () => {
    const top = stack.querySelector(".swipe-card:last-child");
    if (top) nope(top);
  });
  document.getElementById("btnInfo")?.addEventListener("click", () => {
    const top = stack.querySelector(".swipe-card:last-child");
    if (!top) return;
    const idx = Number(top.dataset.index);
    const perfil = perfis[idx];
    top.querySelector(".tags")?.insertAdjacentHTML(
      "beforeend",
      `<span class="tag">Ensina: ${perfil.ensina.join(", ")}</span>
       <span class="tag">Quer: ${perfil.aprende.join(", ")}</span>`
    );
  });

  // Modal
  document.getElementById("btnFecharMatch")?.addEventListener("click", () =>
    modalMatch?.setAttribute("aria-hidden", "true")
  );
  document.getElementById("btnContato")?.addEventListener("click", () => {
    modalMatch?.setAttribute("aria-hidden", "true");
    alert("Exemplo: aqui você pode abrir um chat, copiar e-mail ou disparar WhatsApp.");
  });

  // CTA
  document.getElementById("btnComecar")?.addEventListener("click", () => {
    document.querySelector(".phone-frame")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Render inicial
  renderStack();
}
