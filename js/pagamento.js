document.addEventListener("DOMContentLoaded", () => {
    const btnFinalizar = document.getElementById("btnFinalizar");
    
    // 1. Verifica se está logado
    const sessionRaw = localStorage.getItem("nexos_session") || sessionStorage.getItem("nexos_session");
    if (!sessionRaw) {
        alert("Sessão expirada. Faça login para continuar.");
        window.location.href = "./auth.html#login";
        return;
    }
    
    // Parse da sessão para pegar o token
    let session = {};
    try {
        session = JSON.parse(sessionRaw);
    } catch (e) {
        console.error("Erro ao ler sessão");
    }
    const token = session.token || session.access_token;

    // 2. Lógica do Botão "Confirmar Pagamento"
    btnFinalizar?.addEventListener("click", async () => {
        // Validação visual simples (inputs fake)
        const inputs = document.querySelectorAll(".fake-input");
        let filled = true;
        inputs.forEach(input => { if(!input.value) filled = false; });
        
        if(!filled) {
            alert("Por favor, preencha os dados do cartão (pode ser dados fictícios).");
            return;
        }

        // Feedback Visual
        const originalText = btnFinalizar.innerText;
        btnFinalizar.innerText = "Processando...";
        btnFinalizar.disabled = true;

        // Simula delay de banco (1.5 segundos) para dar emoção
        await new Promise(r => setTimeout(r, 1500));

        try {
            // 3. CHAMA A API PARA VIRAR PREMIUM (No Banco)
            const res = await fetch("https://synapse-seven-mu.vercel.app/api/settings", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ acao: "assinar_premium" })
            });

            const data = await res.json();
            
            if (res.ok) {
                // 4. SUCESSO!
                alert("Pagamento aprovado! " + (data.message || "Bem-vindo ao Premium!"));
                
                // ATUALIZAÇÃO IMEDIATA DO LOCALSTORAGE
                // Para o site já saber que é premium sem precisar bater na API de novo agora
                // Usando a chave correta do banco: 'eh_premium'
                session.eh_premium = true; 
                
                localStorage.setItem("nexos_session", JSON.stringify(session));

                // Redireciona para configurações (onde vai aparecer o status dourado)
                window.location.href = "./configuracoes.html"; 
            } else {
                throw new Error(data.error || "Erro no processamento.");
            }
        } catch (err) {
            alert("Erro ao realizar pagamento: " + err.message);
            btnFinalizar.innerText = originalText;
            btnFinalizar.disabled = false;
        }
    });
});