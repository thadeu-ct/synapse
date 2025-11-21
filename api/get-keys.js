export default function handler(req, res) {
  // --- CORS (Para o seu site poder ler) ---
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- LENDO AS CHAVES DO AMBIENTE ---
  // Importante: Usamos os nomes que você definiu na Vercel
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_USUARIO_KEY || process.env.SUPABASE_KEY; // Tenta a USUARIO_KEY primeiro

  if (!url || !key) {
    console.error("Erro: Chaves do Supabase não encontradas nas variáveis de ambiente.");
    return res.status(500).json({ error: 'Configuração de servidor incompleta.' });
  }

  // Retorna apenas o necessário para o frontend
  res.status(200).json({
    url: url,
    anonKey: key
  });
}