import { supabase } from "../lib/database.js"; // Importa o cliente Supabase configurado

export default async function handler(req, res) { 
  // Configura os cabeçalhos CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  } // backend responde as regras
  if (req.method !== "POST") {
    return res.status(405).end(`Método ${req.method} não permitido`);
  } // backend só aceita dados


  try { // Obter o token de autorização
    const { authorization } = req.headers;
    if (!authorization) { 
        throw { 
            status: 401, 
            message: 'Não autorizado: token não fornecido.' 
        }}
    // Extrai o token do cabeçalho
    const token = authorization.split(' ')[1];

    // Verifica quem é o usuário no Supabase usando o token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) { 
        throw { 
            status: 401, 
            message: 'Não autorizado: token inválido ou expirado.' 
        }}

    // Processa a ação solicitada
    const { acao, ...dados } = req.body;

    switch (acao) {
      case 'edicao_senha':
        const { nova_senha } = dados;
        if (!nova_senha || nova_senha.length < 6) {
            return res.status(400).json({ error: "A nova senha deve ter no mínimo 6 caracteres" });
        }
        const { error: updateError } = await supabase.auth.updateUser({
            password: nova_senha
        });
        if (updateError) {
            throw { 
                status: 500, 
                message: `Erro ao atualizar senha: ${updateError.message}` 
            }}
        return res.status(200).json({ message: "Senha atualizada com sucesso!" });

      case 'edicao_email': 
        const { novo_email } = dados;
        if (!novo_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novo_email)) {
            return res.status(400).json({ error: "Informe um e-mail válido" });
        }
        const { error: emailError } = await supabase.auth.updateUser({
            email: novo_email
        });
        if (emailError) {
            throw { 
                status: 500, 
                message: `Erro ao atualizar e-mail: ${emailError.message}` 
            }}
        return res.status(200).json({ message: "Email atualizado com sucesso!" });
        
      case 'edicao_bio':
        const { bio } = dados;
        // Fazemos um update normal na tabela 'usuarios'
        const { error: updateBioError } = await supabase
            .from('usuarios')
            .update({ bio: bio })
            .eq('id', user.id);
        if (updateBioError) { throw updateBioError; }
        return res.status(200).json({ message: "Bio atualizada com sucesso!" });

      case 'cancelar_premium':
        const { error: cancelError } = await supabase
          .from('usuarios')
          .update({ eh_premium: false })
          .eq('id', user.id)
        if (cancelError) {
            throw { 
                status: 500, 
                message: `Erro ao cancelar assinatura: ${cancelError.message}` 
            }}
        return res.status(200).json({ message: "Assinatura cancelada com sucesso!" });
      
      case 'deletar_conta':
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
            throw { 
                status: 500, 
                message: `Erro ao deletar conta: ${deleteError.message}` 
            }}
        return res.status(200).json({ message: "Conta deletada com sucesso!" });

      case 'assinar_premium':
        const { error: signError } = await supabase
          .from('usuarios')
          .update({ eh_premium: true }) // Vira True!
          .eq('id', user.id);
        if (signError) { throw signError; }
        return res.status(200).json({ message: "Parabéns! Você agora é Premium! 💎" });

      default: // ação não cadastrada
        res.status(400).json({ error: `Ação desconhecida: ${action}` });
    }

    // Retorna mensagem de erro
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Erro no servidor ao processar a configuração." });
  }
}