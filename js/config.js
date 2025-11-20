document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE = "https://synapse-seven-mu.vercel.app/api";
    
    const SUPABASE_URL = "SUA_URL_DO_SUPABASE_AQUI"; 
    const SUPABASE_ANON_KEY = "SUA_CHAVE_ANON_AQUI";
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

    // --- 1. Verificação de Autenticação ---
    const sessionRaw = localStorage.getItem("nexos_session") || sessionStorage.getItem("nexos_session");
    if (!sessionRaw) {
        alert("Você precisa estar logado.");
        window.location.href = "./auth.html#login";
        return;
    }
    const session = JSON.parse(sessionRaw);
    const token = session.token || session.access_token;

    // --- 2. Carregar Dados Iniciais (Usando a API de Perfil que já funciona) ---
    await loadUserData();

    async function loadUserData() {
        try {
            const res = await fetch(`${API_BASE}/profile`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const u = data.perfil;

                // 1. Injetar Nome
                setText("userName", `${u.nome} ${u.sobrenome}`);

                // 2. Injetar Email (procura o link que tem o href="#section-email")
                const emailLink = document.querySelector('a[href="#section-email"]');
                if (emailLink) emailLink.textContent = u.email;
                
                // Também atualiza o texto explicativo lá embaixo na zona de perigo, se tiver ID
                const emailExplainer = document.querySelector("#section-email p strong");
                if (emailExplainer) emailExplainer.textContent = u.email;

                // 3. Lógica da Bio (Vazia vs Preenchida)
                const bioDisplay = document.getElementById("userBioDisplay");
                const bioInput = document.getElementById("userBioEdit");
                
                if (bioInput) bioInput.value = u.bio || ""; // Preenche o editor

                if (bioDisplay) {
                    if (u.bio && u.bio.trim() !== "") {
                        // Tem bio salva
                        bioDisplay.textContent = u.bio;
                        bioDisplay.style.color = "inherit"; 
                        bioDisplay.style.fontStyle = "normal";
                    } else {
                        // Bio vazia
                        bioDisplay.textContent = "Adicionar uma bio...";
                        bioDisplay.style.color = "#888"; // Cinza para parecer placeholder
                        bioDisplay.style.fontStyle = "italic";
                    }
                }

                // 4. Chip Premium
                // 4. Chip Premium e Nome Dourado
                const chip = document.querySelector(".premium-chip");
                const nameElement = document.getElementById("userName");

                if (chip) {
                    // Garante que o chip está visível
                    chip.style.display = "inline-flex"; 

                    if (u.eh_premium) {
                        // --- CASO PREMIUM ---
                        // Estilo Dourado no Chip
                        chip.className = "premium-chip is-premium";
                        chip.innerHTML = `<span>Premium</span> &middot; <a href="#section-premium">Cancelar</a>`;
                        
                        // Nome Dourado
                        if (nameElement) nameElement.classList.add("text-gold");

                    } else {
                        // --- CASO GRATUITO ---
                        // Estilo Azul no Chip (CTA)
                        chip.className = "premium-chip is-free";
                        chip.innerHTML = `<span>Plano Gratuito</span> &middot; <a href="#" id="btnUpgrade">Seja Premium</a>`;
                        
                        // Remove Dourado do Nome
                        if (nameElement) nameElement.classList.remove("text-gold");

                        // Adiciona ação ao botão de upgrade (Mágico de Oz)
                        setTimeout(() => {
                            document.getElementById("btnUpgrade")?.addEventListener("click", (e) => {
                                e.preventDefault();
                            });
                        }, 0);
                    }
                }
                // 5. Foto de Perfil (Placeholder por enquanto)
                // Se o banco tiver URL, a gente usa. Se não, mantém o placeholder do HTML.
                const imgPerfil = document.querySelector(".profile-summary img");
                if (imgPerfil && u.foto) {
                    imgPerfil.src = u.foto;
                }
            }
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        }
    }

    // --- 3. LÓGICA DE UPLOAD DA FOTO (NOVO!) ---
    const avatarWrapper = document.querySelector(".avatar-wrapper");
    const fileInput = document.getElementById("fileAvatar");
    const hoverLayer = document.getElementById("btnChangeAvatar");

    // Efeito Hover
    avatarWrapper?.addEventListener("mouseenter", () => hoverLayer.style.opacity = "1");
    avatarWrapper?.addEventListener("mouseleave", () => hoverLayer.style.opacity = "0");

    // Clique na imagem abre o seletor de arquivo
    avatarWrapper?.addEventListener("click", () => fileInput.click());

    // Quando selecionar um arquivo...
    fileInput?.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!supabase) {
            alert("Erro de configuração: Supabase Client não iniciado.");
            return;
        }

        try {
            // Feedback visual
            hoverLayer.style.opacity = "1";
            hoverLayer.innerHTML = '<span style="font-size:0.8rem; color:white;">Enviando...</span>';

            // 1. Nome único para o arquivo (evita colisão)
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 2. Upload para o Storage do Supabase
            const { data, error } = await supabase.storage
                .from('avatares')
                .upload(filePath, file);

            if (error) throw error;

            // 3. Pegar a URL Pública
            const { data: { publicUrl } } = supabase.storage
                .from('avatares')
                .getPublicUrl(filePath);

            // 4. Salvar URL no Banco (Backend)
            await sendAction("edicao_foto", { foto_url: publicUrl });

            // 5. Atualizar na tela na hora
            const imgPerfil = document.getElementById("imgAvatarDisplay");
            imgPerfil.src = publicUrl;
            
            alert("Foto atualizada com sucesso!");

        } catch (error) {
            alert("Erro ao enviar foto: " + error.message);
        } finally {
            // Restaura o hover
            hoverLayer.innerHTML = '<span style="font-size: 1.5rem;">📷</span>';
            hoverLayer.style.opacity = "0";
        }
    });

    // --- 4. Lógica da Bio (Visual) ---
    const btnEditBio = document.getElementById("editBioButton");
    const divDisplay = document.getElementById("bioDisplayMode");
    const divEdit = document.getElementById("bioEditMode");
    const btnCancelBio = document.getElementById("cancelBioEdit");

    btnEditBio?.addEventListener("click", (e) => {
        e.preventDefault();
        divDisplay.classList.add("hidden");
        divEdit.classList.remove("hidden");
    });

    btnCancelBio?.addEventListener("click", () => {
        divDisplay.classList.remove("hidden");
        divEdit.classList.add("hidden");
    });

    // --- 5. Ações (Chamando a API settings.js) ---

    // Salvar Bio
    document.getElementById("saveBioEdit")?.addEventListener("click", async () => {
        const novaBio = document.getElementById("userBioEdit").value;
        await sendAction("edicao_bio", { bio: novaBio });
        // Recarrega a tela para mostrar a nova bio
        location.reload(); 
    });

    // Alterar Senha
    document.querySelector("#section-password button")?.addEventListener("click", async () => {
        const novaSenha = prompt("Digite a sua nova senha (mínimo 6 caracteres):");
        if (!novaSenha) return;
        await sendAction("edicao_senha", { nova_senha: novaSenha });
    });

    // Alterar E-mail
    document.querySelector("#section-email button")?.addEventListener("click", async () => {
        const novoEmail = prompt("Digite o novo e-mail:");
        if (!novoEmail) return;
        await sendAction("edicao_email", { novo_email: novoEmail });
    });

    // Cancelar Premium
    document.querySelector("#section-premium button")?.addEventListener("click", async () => {
        if (confirm("Tem certeza que deseja cancelar o Premium?")) {
            await sendAction("cancelar_premium", {});
            location.reload();
        }
    });

    // Excluir Conta
    document.querySelector("#section-delete button")?.addEventListener("click", async () => {
        const confirmacao = prompt("Para confirmar a exclusão, digite DELETAR abaixo:");
        if (confirmacao === "DELETAR") {
            await sendAction("deletar_conta", {});
            // Limpa sessão e chuta pro login
            localStorage.removeItem("nexos_session");
            alert("Sua conta foi excluída.");
            window.location.href = "./index.html";
        } else {
            alert("Ação cancelada.");
        }
    });

    // Função Genérica para chamar a API settings
    async function sendAction(acao, dadosExtras) {
        try {
            const res = await fetch(`${API_BASE}/settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ acao, ...dadosExtras })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || "Erro ao processar.");
            }

            alert(data.message || "Sucesso!");
            return true;

        } catch (err) {
            alert(err.message);
            return false;
        }
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
});