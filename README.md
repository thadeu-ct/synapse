# Synapse — Site de troca de experiências
O projeto, antes chamado **Nexos**, evoluiu para **Synapse**, mantendo o propósito de conectar pessoas que querem ensinar e aprender de forma colaborativa. Desenvolvido na disciplina de Empreendedorismo da PUC-Rio, o site promove trocas de conhecimento sem custo financeiro, valorizando a colaboração entre os participantes.

**[🔗 Acesse o site](https://thadeu-ct.github.io/synapse/)**

## ✨ Tecnologias Utilizadas
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)

## 🚀 Funcionalidades
- [x] Estrutura inicial do site (HTML/CSS)
- [x] Backend em Node.js (Express) integrado ao Supabase
- [x] Cadastro de usuários via API (`/api/signup`)
- [x] Autenticação de login via API (`/api/login`)
- [ ] Página de perfil do usuário
- [ ] Sistema de match entre "ensinar" e "aprender"
- [ ] Edição de perfil e gerenciamento de agenda

## 📁 Estrutura do projeto
```
├── api/                    # Funções serverless (login/cadastro)
│   ├── login.js
│   └── signup.js
├── componentes/            # Componentes HTML reutilizáveis
│   ├── footer.html
│   └── header.html
├── img/                    # Recursos visuais
├── js/
│   ├── auth.js             # Fluxo de autenticação (login/cadastro)
│   ├── main.js             # Script principal do front-end
│   └── perfil.js           # Protótipo da área do usuário
├── lib/
│   └── database.js         # Utilitário de acesso ao banco (Supabase)
├── servidor/               # Servidor Express local para desenvolvimento
│   ├── data/perfis.json
│   ├── database.js
│   ├── servidor.js
│   └── test.js
├── auth.html
├── index.html
├── perfil.html
├── package.json
├── package-lock.json
└── style.css
```

## 📌 Sobre o desenvolvimento
- Deploy do front-end via GitHub Pages
- Prototipagem acadêmica: dados sensíveis tratados com hash e validações básicas
- Integração com Supabase para autenticação e armazenamento de perfis
- Servidor Express local (pasta `servidor/`) para facilitar testes e prototipagem

## ✨ Contribuidores

Desenvolvedores do projeto Synapse/Nexos:

<p align="center">
  <a href="https://github.com/thadeu-ct">
    <img src="https://avatars.githubusercontent.com/u/171446748?v=4" width="100" style="border-radius:50%" alt="Thadeu">
  </a>
  <a href="https://github.com/Maumau-3005">
    <img src="https://avatars.githubusercontent.com/u/184857658?v=4" width="100" style="border-radius:50%" alt="Mauricio">
  </a>
</p>
