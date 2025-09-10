# Nexos - Site de troca de experiências

Projeto de Empreendedorismo da PUC-Rio, desenvolvido por [Thadeu](https://github.com/thadeu-ct) e [Mauricio](https://github.com/Maumau-3005). Este repositório contém o código-fonte do **Nexos**, um site de troca de experiências feito em HTML, CSS e JavaScript, que tem como objetivo conectar pessoas interessadas em ensinar e aprender, promovendo o compartilhamento de conhecimento de forma colaborativa e gratuita.

## 🔗 Acesse o site
Front-end publicado em GitHub Pages:
[https://thadeu-ct.github.io/nexos](https://thadeu-ct.github.io/nexos/)

## 📁 Estrutura do projeto
- componentes/ #Componentes reutilizáveis
  - footer.html; header.html
- img/ # Imagens do projeto
- js/ # Scripts do front-end
  - main.js

- servidor/ # Código do back-end (Express + Node.js + Supabase)
  - database.js # Conexão com Supabase
  - rotas.js # Rotas da API (cadastro de usuários)
  - servidor.js # Configuração do servidor Express
  - test.js # Arquivo para testes manuais

- auth.html # Página de autenticação (em desenvolvimento)
- index.html; style.css


## 📌 Sobre
O **Nexos** é um projeto desenvolvido na disciplina de Empreendedorismo da PUC-Rio, com foco em criar um ambiente colaborativo de troca de experiências. A ideia central é permitir que pessoas que queiram ensinar e aprender se conectem, sem custos financeiros, mas sim por meio da troca de conhecimento.

O site foi pensado para ser simples, acessível e responsivo, facilitando a interação entre usuários e valorizando o aprendizado coletivo. O desenvolvimento é feito de forma modular, utilizando HTML, CSS e JavaScript, permitindo que novas funcionalidades sejam adicionadas de maneira organizada conforme o projeto evolui.

## ⚙️ Tecnologias usadas
- **Frontend:** HTML, CSS, JavaScript (simples e responsivo)
- **Backend:** Node.js, Express
- **Banco de dados:** Supabase (PostgreSQL gerenciado)
- **Controle de versão:** Git + GitHub

## 🚀 Funcionalidades
- [x] Estrutura inicial do site
- [x] Servidor Node.js com Express
- [x] Integração com Supabase (tabela `usuarios`)
- [ ] Cadastro de usuários via API
- [ ] Autenticação de login
- [ ] Página de perfil
- [ ] Sistema de troca de experiências (match entre "ensinar" e "aprender")
