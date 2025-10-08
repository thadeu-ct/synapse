# Synapse — Site de troca de experiências
O Synapse é uma plataforma web criada para conectar pessoas interessadas em ensinar e aprender de forma colaborativa. O projeto foi desenvolvido na disciplina de Empreendedorismo da PUC-Rio com foco em criar um ambiente de troca de experiências sem custos financeiros, baseado no compartilhamento de conhecimento.</br>

**[🔗 Acesse a plataforma](https://thadeu-ct.github.io/synapse/)**

## ✨ Tecnologias Utilizadas
Esta plataforma utiliza uma stack moderna, com um frontend estático desacoplado e um backend baseado em arquitetura Serverless para máxima escalabilidade e eficiência.</br>
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)

## 🚀 Funcionalidades
- [x] Estrutura inicial do site (HTML/CSS)
- [x] Backend com Funções Serverless (Node.js) na Vercel
- [x] Integração com Supabase (tabela usuarios)
- [x] Cadastro de usuários via API (/api/signup)
- [x] Autenticação de login via API (/api/login)
- [ ] Página de perfil do usuário
- [ ] Edição de perfil e gerenciamento de dados
- [ ] Sistema de match entre "ensinar" e "aprender"

## 📁 Estrutura do projeto
A estrutura foi pensada para suportar a arquitetura Serverless, separando a API (/api) da lógica de negócio e do frontend.
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
├── auth.html
├── index.html
├── perfil.html
├── package.json
├── package-lock.json
└── style.css
```

## ✨ Contribuidores
Desenvolvido com a colaboração de:
<p align="center">
  <a href="https://github.com/thadeu-ct">
    <img src="https://avatars.githubusercontent.com/u/171446748?v=4" width="100" style="border-radius:50%" alt="Thadeu">
  </a>
  <a href="https://github.com/Maumau-3005">
    <img src="https://avatars.githubusercontent.com/u/184857658?v=4" width="100" style="border-radius:50%" alt="Mauricio">
  </a>
</p>
