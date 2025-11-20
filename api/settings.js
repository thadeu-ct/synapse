// IMPORTANTE: Importamos supabaseAdmin também
import { supabase, supabaseAdmin } from "../lib/database.js"; 

export default async function handler(req, res) { 
  // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { return res.status(204).end(); }
  if (req.method !== "POST") { return res.status(405).end(`Método ${req.method} não permitido`); }

  try { 
    // --- Autenticação ---
    const { authorization } = req.headers;
    if (!authorization) { throw { status: 401, message: 'Não autorizado: token não fornecido.' }}
    const token = authorization.split(' ')[1];

    // Validamos o usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) { throw { status: 401, message: 'Não autorizado: token inválido.' }}

    const { acao, ...dados } = req.body;

    switch (acao) {
      // --- Ações de Auth (Usam supabase normal ou auth.admin) ---
      
      case 'edicao_senha':
        const { nova_senha } = dados;
        if (!nova_senha || nova_senha.length < 6) return res.status(400).json({ error: "Senha muito curta." });
        
        const { error: pwdError } = await supabase.auth.updateUser({ password: nova_senha });
        if (pwdError) throw { status: 500, message: pwdError.message };
        
        return res.status(200).json({ message: "Senha atualizada com sucesso!" });

      case 'edicao_email': 
        const { novo_email } = dados;
        if (!novo_email) return res.status(400).json({ error: "E-mail inválido." });
        
        const { error: emailError } = await supabase.auth.updateUser({ email: novo_email });
        if (emailError) throw { status: 500, message: emailError.message };
        
        return res.status(200).json({ message: "Link de confirmação enviado para o novo e-mail!" });

      case 'deletar_conta':
        // Usa ADMIN para deletar do sistema de Auth
        const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (delError) throw { status: 500, message: delError.message };
        
        return res.status(200).json({ message: "Conta deletada." });


      // --- Ações de Banco de Dados (Usam supabaseAdmin para garantir a escrita) ---

      case 'edicao_bio':
        const { bio } = dados;
        // MUDANÇA: Usamos supabaseAdmin
        const { error: bioError } = await supabaseAdmin
            .from('usuarios')
            .update({ bio: bio })
            .eq('id', user.id);
            
        if (bioError) throw { status: 500, message: bioError.message };
        return res.status(200).json({ message: "Bio atualizada!" });

      case 'cancelar_premium':
        // MUDANÇA: Usamos supabaseAdmin
        const { error: cancelError } = await supabaseAdmin
          .from('usuarios')
          .update({ eh_premium: false })
          .eq('id', user.id);
          
        if (cancelError) throw { status: 500, message: cancelError.message };
        return res.status(200).json({ message: "Premium cancelado." });

      case 'assinar_premium':
        // MUDANÇA: Usamos supabaseAdmin
        const { error: signError } = await supabaseAdmin
          .from('usuarios')
          .update({ eh_premium: true })
          .eq('id', user.id);
          
        if (signError) throw { status: 500, message: signError.message };
        return res.status(200).json({ message: "Parabéns! Você agora é Premium! 💎" });

      default: 
        return res.status(400).json({ error: `Ação desconhecida: ${acao}` });
    }
  } catch (error) {
    console.error("Erro Settings:", error);
    res.status(error.status || 500).json({ error: error.message || "Erro no servidor." });
  }
}