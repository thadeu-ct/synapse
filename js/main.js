// Carregar componentes (header/footer)
(async function includePartials(){
  const includeNodes = document.querySelectorAll("[data-include]");
  for (const node of includeNodes) {
    const url = node.getAttribute("data-include");
    const res = await fetch(url);
    node.outerHTML = await res.text();
  }
  if (window.lucide) lucide.createIcons();
  document.getElementById("anoAtual")?.append(new Date().getFullYear());
})();

// ---------- Dados fake (pode vir de API depois) ----------
const perfis = [
  {
    nome: "Ana Ribeiro", idade: 24,
    ensina: ["Inglês básico", "Conversação"],
    aprende: ["HTML/CSS"],
    foto: "/img/placeholder-avatar.png",
    bio: "Formada em Letras. Curto ensinar com foco em conversação leve."
  },
  {
    nome: "Diego Martins", idade: 28,
    ensina: ["JavaScript", "Git/GitHub"],
    aprende: ["Violão iniciante"],
    foto: "/img/placeholder-avatar.png",
    bio: "Dev front-end. Quero trocar JS por violão 👀"
  },
  {
    nome: "Marina Lopes", idade: 31,
    ensina: ["Ilustração", "Procreate"],
    aprende: ["Marketing digital"],
    foto: "/img/placeholder-avatar.png",
    bio: "Ilustradora freelancer. Bora trocar desenho por growth!"
  }
];

// ---------- UI: Stack de cartões + swipe ----------
const stack = document.getElementById("cardStack");
const modalMatch = document.getElementById("modalMatch");
const matchText = document.getElementById("matchText");

function criarCard(p) {
  const el = document.createElement("article");
  el.className = "swipe-card";
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
  // Draggable (touch + mouse)
  let offset = {x:0, y:0}, start = null;
  const onPointerDown = (e)=>{
    start = {x: e.clientX || e.touches?.[0]?.clientX, y: e.clientY || e.touches?.[0]?.clientY};
    el.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e)=>{
    if(!start) return;
    const x = (e.clientX || e.touches?.[0]?.clientX) - start.x;
    const y = (e.clientY || e.touches?.[0]?.clientY) - start.y;
    offset = {x,y};
    el.style.transform = `translate(${x}px, ${y}px) rotate(${x/18}deg)`;
    el.style.transition = "none";
  };
  const onPointerUp = ()=>{
    const threshold = 120;
    if (offset.x > threshold) like(el, p);
    else if (offset.x < -threshold) nope(el);
    else reset(el);
    start = null; offset = {x:0,y:0};
  };
  el.addEventListener("mousedown", onPointerDown);
  el.addEventListener("mousemove", onPointerMove);
  el.addEventListener("mouseup", onPointerUp);
  el.addEventListener("touchstart", onPointerDown, {passive:true});
  el.addEventListener("touchmove", onPointerMove, {passive:true});
  el.addEventListener("touchend", onPointerUp);

  return el;
}

function renderStack(){
  stack.innerHTML = "";
  // Último no DOM = fundo; por isso iteramos invertido
  [...perfis].reverse().forEach(p=>{
    const card = criarCard(p);
    stack.appendChild(card);
  });
}

function animateOut(el, dir=1){
  el.style.transition = "transform .28s ease-out, opacity .28s ease-out";
  el.style.transform = `translate(${dir*600}px, -40px) rotate(${dir*25}deg)`;
  el.style.opacity = "0";
  setTimeout(()=> el.remove(), 260);
}

function reset(el){
  el.style.transition = "transform .22s ease";
  el.style.transform = "translate(0,0) rotate(0)";
}

function like(el, perfil){
  animateOut(el, +1);
  // Exemplo simples: sempre “match” se a pessoa ensina algo que você quer
  const voceQuer = ["JS","JavaScript","Inglês","HTML/CSS","Violão"];
  const match = perfil.ensina.some(s=>voceQuer.some(v=>s.toLowerCase().includes(v.toLowerCase())));
  if (match){
    matchText.textContent = `Você e ${perfil.nome} têm interesses complementares!`;
    modalMatch.setAttribute("aria-hidden", "false");
  }
}

function nope(el){ animateOut(el, -1); }

// Botões
document.getElementById("btnLike")?.addEventListener("click", ()=>{
  const top = stack.querySelector(".swipe-card:last-child");
  if (top) like(top, perfis[perfis.length - stack.childElementCount]);
});
document.getElementById("btnNope")?.addEventListener("click", ()=>{
  const top = stack.querySelector(".swipe-card:last-child");
  if (top) nope(top);
});
document.getElementById("btnInfo")?.addEventListener("click", ()=>{
  const top = stack.querySelector(".swipe-card:last-child");
  if (!top) return;
  top.querySelector(".tags")?.insertAdjacentHTML("beforeend",
    `<span class="tag">Ensina: ${perfis[perfis.length - stack.childElementCount].ensina.join(", ")}</span>
     <span class="tag">Quer: ${perfis[perfis.length - stack.childElementCount].aprende.join(", ")}</span>`);
});

// Modal
document.getElementById("btnFecharMatch")?.addEventListener("click", ()=> modalMatch.setAttribute("aria-hidden","true"));
document.getElementById("btnContato")?.addEventListener("click", ()=>{
  modalMatch.setAttribute("aria-hidden","true");
  alert("Exemplo: aqui você pode abrir um chat, copiar e-mail ou disparar WhatsApp.");
});

// Init
document.addEventListener("DOMContentLoaded", ()=>{
  renderStack();
  if (window.lucide) lucide.createIcons();
  document.getElementById("btnComecar")?.addEventListener("click", ()=> {
    document.querySelector(".phone-frame")?.scrollIntoView({behavior:"smooth", block:"center"});
  });
});
