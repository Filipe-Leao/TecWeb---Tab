# 🎲 Jogo Tâb - Multiplayer & AI

![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=flat&logo=node.js)
![Express](https://img.shields.io/badge/Express-Server-blue?style=flat)
![Status](https://img.shields.io/badge/Status-Completed-success)

Implementação digital do jogo de tabuleiro tradicional **Tâb**, desenvolvida no âmbito da disciplina de Tecnologias Web. O projeto apresenta uma arquitetura Cliente-Servidor robusta, suportando o jogo TAB em tempo real ou contra um modelo MCTS.

## 🚀 Funcionalidades

### Backend (Node.js)
* **API RESTful:** Gestão de utilizadores (Registo/Login), Rankings e Lobby de jogos.
* **Lógica de Jogo Server-Side:** O servidor valida todas as regras (movimento, captura, turnos) impedindo batotas.
* **Tempo Real (SSE):** Utilização de *Server-Sent Events* para atualizações instantâneas de tabuleiro sem *polling*.
* **Persistência de Dados:** Estado do jogo e utilizadores guardados em `data.json`.
* **Segurança:** Passwords encriptadas com Hash MD5 e Salt.

### Frontend
* **Modo PvP (Online):** Joga contra outros jogadores em redes diferentes.
* **Modo PvC (Local):** Joga contra o computador com IA baseada em simulação Monte Carlo.
* **Animações:** Renderização do dado de paus usando HTML5 Canvas.
* **Configuração Automática:** O cliente deteta automaticamente se está a correr em `localhost` ou no servidor da faculdade (`twserver`).

---

## 🛠️ Instalação e Execução

Siga estes passos para correr o projeto na sua máquina local.

### 1. Pré-requisitos
Certifique-se de que tem o [Node.js](https://nodejs.org/) instalado.

### 2. Clonar o Repositório
```bash
git clone https://github.com/Filipe-Leao/TecWeb---Tab.git
cd TecWeb---Tab
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Iniciar o Servidor
```bash
npm start
```
*O servidor iniciará na porta **8135**.*

### 5. Jogar
Abra o seu navegador e aceda a:
👉 **firefox index.html**

> **Nota:** Para testar o modo Multiplayer localmente, abra o jogo em duas janelas diferentes e faça login com utilizadores diferentes.

---

## 📂 Estrutura do Projeto

```text
TecWeb---Tab/
├── index.js              # Lógica principal do servidor (Rotas, Regras, SSE)
├── data.json             # Base de dados (Utilizadores e Jogos)
├── index.html            # Interface do jogo
├── style.css             # Estilos
├── script.js             # Comunicação com a API e gestão de UI
├── MonteCarlo.js         # Inteligência Artificial (Bot)
├── canvas-animations.js  # Animação do Dado
├── localStorage.js       # Persistência de scores locais
└── package.json          # Dependências do projeto
```

---

## 🎮 Regras do Jogo

O objetivo é capturar todas as peças do adversário.

1.  **Movimento:** As peças movem-se conforme o valor do dado (4 paus).
2.  **Primeiro Movimento:** Uma peça só pode sair da casa inicial se o jogador tirar um **1 (Tâb)**.
3.  **Captura:** Se aterrar numa casa ocupada pelo adversário, a peça dele é removida.
4.  **Invasão:** Não pode mover uma peça que já invadiu a base inimiga enquanto ainda tiver peças na sua própria base ("Regra do Invasor").
5.  **Jogar Novamente:** Se tirar 1, 4 ou 6 no dado, joga novamente.
