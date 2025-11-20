// api/get-keys.js
export default async function handler(req, res) {
  // Configura CORS para o seu site poder chamar
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { return res.status(204).end(); }

  const keys = {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_KEY // ou SUPABASE_USUARIO_KEY, a que for a pública
  };

  if (!keys.url || !keys.anonKey) {
    return res.status(500).json({ error: 'Chaves não configuradas no servidor.' });
  }

  res.status(200).json(keys);
}