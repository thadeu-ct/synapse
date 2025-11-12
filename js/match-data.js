export const STORAGE_KEYS = {
  decisions: 'synapseMatchDecisions',
  matches: 'synapseMatches',
  conversations: 'synapseConversations'
};

export const seedLikedIds = ['ana-ribeiro', 'bruno-alves', 'clara-mendes'];

export const seedConversations = {
  'ana-ribeiro': [
    { id: 'a1', from: 'them', text: 'Adorei seus experimentos de UX + no-code!', at: '2024-05-10T12:03:00Z', read: true },
    { id: 'a2', from: 'me', text: 'Vamos montar juntos um fluxo semana que vem?', at: '2024-05-10T12:05:00Z', read: true }
  ],
  'bruno-alves': [
    { id: 'b1', from: 'me', text: 'Curti seu setup de IA aplicada.', at: '2024-05-11T15:10:00Z', read: true },
    { id: 'b2', from: 'them', text: 'Topo trocar ideias sobre storytelling!', at: '2024-05-11T15:12:00Z', read: false }
  ],
  'clara-mendes': [
    { id: 'c1', from: 'them', text: 'Quando quiser falar de short-form me chama ✨', at: '2024-05-09T09:32:00Z', read: true }
  ]
};

export const profiles = [
  {
    id: 'ana-ribeiro',
    name: 'Ana Ribeiro',
    age: 29,
    role: 'Research Lead · Nubrain',
    location: 'São Paulo — SP',
    teaches: 'UX Research avançado',
    learns: 'No-code & automations',
    match: 'Squads que buscam validar MVPs em até 4 semanas',
    availability: 'Segundas e quartas, 19h às 22h',
    vibe: 'Novo match',
    bio: 'Conduz estudos qualitativos e pesquisas em escala para produtos digitais focados em educação. Curiosa sobre integrações low-code para ganhar velocidade.',
    highlights: [
      'Criou framework de entrevistas que reduziu churn em 18%',
      'Mentora 12 profissionais por trimestre no programa Women in UX',
      'Quer combinar UX + automações para liberar tempo do time'
    ],
    topics: ['Pesquisa descomplicada', 'Jornada do usuário', 'Automações Airtable + Make'],
    photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'bruno-alves',
    name: 'Bruno Alves',
    age: 32,
    role: 'Engenheiro de Machine Learning · Atlas',
    location: 'Belo Horizonte — MG',
    teaches: 'Python para IA aplicada',
    learns: 'Storytelling e facilitação',
    match: 'Projetos que precisam traduzir dados em narrativas claras',
    availability: 'Terças e quintas na hora do almoço',
    vibe: 'Trending',
    bio: 'Especializado em prototipagem de modelos e pipelines em produção. Quer se comunicar melhor com áreas não técnicas.',
    highlights: [
      'Implantou assistente interno usado por 3 squads',
      'Facilitador voluntário no Data For Good',
      'Busca mentoria cruzada para storytelling visual'
    ],
    topics: ['LLMs práticos', 'Deploy rápido', 'Workshops colaborativos'],
    photo: 'https://images.unsplash.com/photo-1544723795-43253747715e?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'clara-mendes',
    name: 'Clara Mendes',
    age: 26,
    role: 'Produtora de conteúdo · Fluxo Studio',
    location: 'Curitiba — PR',
    teaches: 'Conteúdo short-form',
    learns: 'Motion design básico',
    match: 'Times que querem organizar calendário e narrativas sociais',
    availability: 'Manhãs de terça, quinta e sábado',
    vibe: 'Super host',
    bio: 'Define roteiros diários para marcas na Creator Economy. Quer trazer animação para vídeos curtos sem depender de terceiros.',
    highlights: [
      'Cresceu 220% o alcance orgânico da Synapse Talks',
      'Mapeia insights no Notion e entrega dashboards semanais',
      'Buscando combinações com creators multidisciplinares'
    ],
    topics: ['Roteiro rápido', 'Notion Ops', 'After Effects starter'],
    photo: 'https://images.unsplash.com/photo-1544723796-4f95a0c1b791?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'diego-souza',
    name: 'Diego Souza',
    age: 34,
    role: 'Tech Lead · Orbian',
    location: 'Recife — PE (remoto)',
    teaches: 'Arquitetura front-end escalável',
    learns: 'Design systems inclusivos',
    match: 'Duplas que desejam alinhar squads de produto + design',
    availability: 'Dias úteis 8h-10h (horário flexível)',
    vibe: 'Disponível',
    bio: 'Constrói plataformas SaaS com foco em performance e acessibilidade. Quer evoluir senso visual e discutir governança de tokens.',
    highlights: [
      'Reduziu 35% do bundle com microfrontends',
      'Mantém comunidade local de design tokens',
      'Ama prototipar com Figma API'
    ],
    topics: ['React server components', 'Design tokens', 'Observabilidade front-end'],
    photo: 'https://images.unsplash.com/photo-1544723795-3debfa0685c0?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'estela-garcia',
    name: 'Estela Garcia',
    age: 31,
    role: 'Product Manager · BioPulse',
    location: 'Porto Alegre — RS',
    teaches: 'Discovery contínuo',
    learns: 'Fundraising e pitch para healthtechs',
    match: 'Parceiros que navegam produto e negócio em paralelo',
    availability: 'Quartas e sextas à tarde',
    vibe: 'In focus',
    bio: 'Coordena squads de saúde digital, ama métricas de impacto e quer dominar narrativas para investidores.',
    highlights: [
      'Conduziu expansão LATAM com 4 squads remotos',
      'Mentora em programas de saúde pública',
      'Quer feedback sobre pitch deck Series A'
    ],
    topics: ['Discovery em saúde', 'OKRs humanizados', 'Narrativas de impacto'],
    photo: 'https://images.unsplash.com/photo-1544723795-43253747715e?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'felipe-santana',
    name: 'Felipe Santana',
    age: 27,
    role: 'Facilitador · Laboratório Aberto',
    location: 'Salvador — BA',
    teaches: 'Design Sprint & facilitação visual',
    learns: 'Inteligência comercial',
    match: 'Comunidades que conectam experimentação e negócios',
    availability: 'Disponível todos os dias às 20h',
    vibe: 'Novo por aqui',
    bio: 'Cria experiências imersivas para hackathons e quer destravar o olhar comercial para escalar o laboratório.',
    highlights: [
      'Conduziu 30+ sprints híbridos',
      'Criou mural open-source de templates visuais',
      'Busca mentoria em growth para labs'
    ],
    topics: ['Facilitação visual', 'Rituais híbridos', 'Growth para labs'],
    photo: 'https://images.unsplash.com/photo-1544723795-43c03a8d5f5c?auto=format&fit=crop&w=900&q=80'
  }
];

export const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

export function ensureMatchSeedData() {
  if (!safeRead(STORAGE_KEYS.decisions)) {
    safeWrite(STORAGE_KEYS.decisions, { liked: [...seedLikedIds], passed: [] });
  }

  if (!safeRead(STORAGE_KEYS.matches)) {
    const baseMatches = seedLikedIds
      .map((id) => profileMap.get(id))
      .filter(Boolean)
      .map((profile) => serializeMatch(profile));
    safeWrite(STORAGE_KEYS.matches, baseMatches);
  }

  if (!safeRead(STORAGE_KEYS.conversations)) {
    const payload = {};
    Object.entries(seedConversations).forEach(([id, messages]) => {
      const profile = profileMap.get(id);
      if (!profile) return;
      payload[id] = {
        profile: serializeProfile(profile),
        messages
      };
    });
    safeWrite(STORAGE_KEYS.conversations, payload);
  }
}

export function serializeMatch(profile) {
  return {
    profileId: profile.id,
    name: profile.name,
    role: profile.role,
    photo: profile.photo,
    preview: 'Match recente',
    updatedAt: new Date().toISOString(),
    unread: 1
  };
}

export function serializeProfile(profile) {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    photo: profile.photo,
    location: profile.location
  };
}

export function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Não foi possível ler', key, err);
    return null;
  }
}

export function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Não foi possível salvar', key, err);
  }
}
