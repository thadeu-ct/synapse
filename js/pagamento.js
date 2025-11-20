document.addEventListener("DOMContentLoaded", () => {
    const btnFinalizar = document.getElementById("btnFinalizar");
    
    // Verifica se está logado
    const sessionRaw = localStorage.getItem("nexos_session");
    if (!sessionRaw) {
        alert("Sessão expirada. Faça login para continuar.");
        window.location.href = "./auth.html#login";
        return;
    }
    const token = JSON.parse(sessionRaw).token;

    btnFinalizar?.addEventListener("click", async () => {
        // Simples validação visual (checa se os inputs estão preenchidos)
        const inputs = document.querySelectorAll(".fake-input");
        let filled = true;
        inputs.forEach(input => { if(!input.value) filled = false; });
        
        if(!filled) {
            alert("Por favor, preencha os dados do cartão (pode ser dados fictícios).");
            return;
        }

        // Efeito de processamento
        const originalText = btnFinalizar.innerText;
        btnFinalizar.innerText = "Processando...";
        btnFinalizar.disabled = true;

        // Simula delay de banco (2 segundos) para dar emoção
        await new Promise(r => setTimeout(r, 2000));

        try {
            // CHAMA A API PARA VIRAR PREMIUM
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
                alert("Pagamento aprovado! " + data.message);
                window.location.href = "./configuracoes.html"; // Manda pro perfil dourado
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            alert("Erro no pagamento: " + err.message);
            btnFinalizar.innerText = originalText;
            btnFinalizar.disabled = false;
        }
    });
});