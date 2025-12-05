// --- 1. VARIÁVEIS GLOBAIS (Expostas ao Window) ---
window.BOARD_SIZE = 9;
window.NUM_ROWS = 4;
window.playerTurn = 'blue';
window.matrix = null;

let AI_DIFFICULTY = 'medium';
let AI_SIMULATIONS = 300;
let diceValue = 0;
let pieces = [];
let resolveAskDirection = null;

const server = "http://twserver.alunos.dcc.fc.up.pt:8008";

// --- 2. SELETORES DO DOM ---
const loginPage = document.getElementById('loginPage');
const configPanel = document.getElementById('configPanel');
const gamePage = document.getElementById('gamePage');
const overlay = document.getElementById('overlay');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById("registerForm");
const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const regUsernameInput = document.getElementById("regUsername");
const regPasswordInput = document.getElementById("regPassword");
const loginMessage = document.getElementById("loginMessage");
const btnIniciarJogo = document.getElementById('btnIniciarJogo');
const btnVoltarMenu = document.getElementById('btnVoltarMenu');
const aiLevelOption = document.getElementById('aiLevelOption');
const gameModeSelect = document.getElementById('gameMode');
const boardElement = document.getElementById('board');
const moveSelector = document.getElementById('moveSelector');
const moveAttackBtn = document.getElementById('move_attack');
const moveRetreatBtn = document.getElementById('move_retreat');
const dicePanel = document.getElementById('dice-panel');
const diceSticks = document.querySelectorAll('#dice-sticks .stick');
const diceValueDisplay = document.getElementById('dice-value-display');
const diceMessage = document.getElementById('dice-message');
const messageBar = document.getElementById('message-bar');
const turnIndicator = document.getElementById('turn-indicator');
const turnPlayerDisplay = document.getElementById('turn-player-display');
const diceLogList = document.getElementById('dice-log-list');
const btnDesistir = document.getElementById('btnDesistir');
const endGameMenu = document.getElementById('endGameMenu');
const endGameMessage = document.getElementById('endGameMessage');
const btnVoltarInicio = document.getElementById('btnVoltarInicio');
const btnJogarNovamente = document.getElementById('btnJogarNovamente');

// Botões Menu Extra
const btnInstrucoes = document.getElementById('btnInstrucoes');
const btnClassificacoes = document.getElementById('btnClassificacoes');
const btnInstrucoesJogo = document.getElementById('btnInstrucoesJogo');
const btnClassificacoesJogo = document.getElementById('btnClassificacoesJogo');
const instrucoesModal = document.getElementById('instrucoes');
const classificacoesModal = document.getElementById('classificacoes');
const instrucoesJogoModal = document.getElementById('instrucoesJogo');
const classificacoesJogoModal = document.getElementById('classificacoesJogo');
const btnFecharInstrucoes = document.getElementById('btnFecharInstrucoes');
const btnFecharClassificacoes = document.getElementById('btnFecharClassificacoes');
const btnFecharInstrucoesJogo = document.getElementById('btnFecharInstrucoesJogo');
const btnFecharClassificacoesJogo = document.getElementById('btnFecharClassificacoesJogo');


// Instanciação BD Local
if (!localStorage.getItem('tab_players')) localStorage.setItem('tab_players', JSON.stringify([]));
if (!localStorage.getItem('tab_leaderboard')) localStorage.setItem('tab_leaderboard', JSON.stringify({}));

// --- 3. LÓGICA LOGIN/REGISTO ---
function showLoginMessage(text, isError = true) {
    if (!loginMessage) return;
    loginMessage.textContent = text;
    loginMessage.classList.remove('oculto');
    loginMessage.className = isError ? 'message-box error' : 'message-box success';
    setTimeout(() => loginMessage.classList.add('oculto'), 4000);
}

if(showRegisterLink) showRegisterLink.addEventListener("click", (e) => { e.preventDefault(); loginForm.classList.add("oculto"); registerForm.classList.remove("oculto"); });
if(showLoginLink) showLoginLink.addEventListener("click", (e) => { e.preventDefault(); registerForm.classList.add("oculto"); loginForm.classList.remove("oculto"); });

if(loginForm) loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const u = usernameInput.value.trim();
    const p = passwordInput.value.trim();
    const players = JSON.parse(localStorage.getItem('tab_players')) || [];

    try {
        let response = await fetch(`${server}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nick: u, password: p })
        });

        const data = await response.json();
        
        if (data.error) {
            showLoginMessage(data.error, true);
            return;
        }

        // Login bem-sucedido no servidor
        sessionStorage.setItem('currentUserNick', u);
        sessionStorage.setItem('currentUserPassword', p);
        loginPage.classList.add("oculto");
        configPanel.classList.remove("oculto");
        
    } catch (error) {
        showLoginMessage("Erro de conexão com o servidor", true);
    }
});

// O registo é feito pelo login automaticamente pelo servidor

/* 
if(registerForm) registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = regUsernameInput.value.trim();
    const p = regPasswordInput.value.trim();
    const players = JSON.parse(localStorage.getItem('tab_players')) || [];
    if (players.find(x => x.username === u)) return showLoginMessage("Utilizador já existe", true);
    players.push({ username: u, password: p });
    localStorage.setItem('tab_players', JSON.stringify(players));
    const lb = JSON.parse(localStorage.getItem('tab_leaderboard')) || {};
    lb[u] = { victories: 0, defeats: 0 };
    localStorage.setItem('tab_leaderboard', JSON.stringify(lb));
    registerForm.reset();
    registerForm.classList.add("oculto");
    loginForm.classList.remove("oculto");
    showLoginMessage("Registo OK! Faça Login", false);
});
 */

// --- 4. INICIAR JOGO ---
if(gameModeSelect) {
    gameModeSelect.addEventListener('change', () => {
        if(gameModeSelect.value === 'player') aiLevelOption.style.display = 'none';
        else aiLevelOption.style.display = 'block';
    });
}

if(btnIniciarJogo) btnIniciarJogo.addEventListener('click', () => {
    window.BOARD_SIZE = parseInt(document.getElementById('boardSize').value);
    mode = document.getElementById('gameMode').value;
    AI_DIFFICULTY = document.getElementById('aiLevel').value;
    window.playerTurn = document.getElementById('firstPlayer').value;

    if (mode === 'pvp') {
        console.log("Iniciando jogo Jogador vs Jogador...");
        player_vs_player_setup();
        return;
    }

    switch(AI_DIFFICULTY) {
        case 'easy': AI_SIMULATIONS = 100; break;
        case 'medium': AI_SIMULATIONS = 300; break;
        case 'hard': AI_SIMULATIONS = 1000; break;
    }

    configPanel.classList.add('oculto');
    gamePage.classList.remove('oculto');

    if(document.getElementById('instrucoes')) document.getElementById('instrucoesJogo').innerHTML = document.getElementById('instrucoes').innerHTML;
    if(document.getElementById('classificacoes')) document.getElementById('classificacoesJogo').innerHTML = document.getElementById('classificacoes').innerHTML;

    const closeInst = document.getElementById('instrucoesJogo').querySelector('button');
    if(closeInst) closeInst.onclick = () => toggleModal(instrucoesJogoModal, false);
    const closeClass = document.getElementById('classificacoesJogo').querySelector('button');
    if(closeClass) closeClass.onclick = () => toggleModal(classificacoesJogoModal, false);

    createBoard();
    clearLog();

    if (window.playerTurn === 'red') {
        updateTurnIndicator();
        showMessage("O computador (Vermelho) começa...");
        setTimeout(() => { if(window.handleAITurn) window.handleAITurn(0); }, 1000);
    } else {
        updateTurnIndicator();
        showMessage("Você (Azul) começa! Lance o dado.");
        resetDiceUI();
    }
});

if(btnVoltarMenu) btnVoltarMenu.addEventListener('click', () => {
    configPanel.classList.add('oculto');
    loginPage.classList.remove('oculto');
    sessionStorage.removeItem('currentUserNick');
    loginForm.reset();
});

// --- 5. LÓGICA DE JOGO ---

function showMessage(msg, type='info') {
    if(messageBar) { messageBar.textContent = msg; messageBar.className = type; }
}

function updateTurnIndicator() {
    if (window.playerTurn === 'blue') {
        // ALTERAÇÃO AQUI:
        // Se quiser usar o nome de utilizador:
        // const user = sessionStorage.getItem('currentUserNick') || 'Eu';
        // turnPlayerDisplay.textContent = user + " (Azul)";

        // Se quiser forçar sempre "Eu (Azul)":
        if(turnPlayerDisplay) turnPlayerDisplay.textContent = "Eu (Azul)";

        if(turnIndicator) turnIndicator.className = 'blue';
        if(dicePanel) { dicePanel.style.opacity = "1"; dicePanel.style.pointerEvents = "auto"; }
    } else {
        if(turnPlayerDisplay) turnPlayerDisplay.textContent = 'Computador (Vermelho)';
        if(turnIndicator) turnIndicator.className = 'red';
        if(dicePanel) { dicePanel.style.opacity = "0.7"; dicePanel.style.pointerEvents = "none"; }
    }
}

function createBoard() {
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${window.BOARD_SIZE}, 50px)`;
    window.matrix = [];
    for(let r=0; r<window.NUM_ROWS; r++) {
        window.matrix[r] = [];
        for(let c=0; c<window.BOARD_SIZE; c++) window.matrix[r][c] = 0;
    }

    for (let r=0; r<window.NUM_ROWS; r++) {
        for (let c=0; c<window.BOARD_SIZE; c++) {
            const sq = document.createElement('div');
            sq.className = 'square';
            sq.dataset.row = r; sq.dataset.col = c;
            if(c === window.BOARD_SIZE-1) sq.dataset.lastCol = 'true';

            if (r === 0) {
                const p = document.createElement('div');
                p.className = 'piece_red';
                p.setAttribute('data-first-move', 'true');
                p.setAttribute('data-visited-enemy', 'false');
                sq.appendChild(p);
                window.matrix[r][c] = 1;
                sq.addEventListener('click', handleClick);
            } else if (r === window.NUM_ROWS-1) {
                const p = document.createElement('div');
                p.className = 'piece_blue';
                p.setAttribute('data-first-move', 'true');
                p.setAttribute('data-visited-enemy', 'false');
                sq.appendChild(p);
                window.matrix[r][c] = 2;
                sq.addEventListener('click', handleClick);
            } else {
                sq.addEventListener('click', handleClick);
            }
            boardElement.appendChild(sq);
        }
    }
    updateTurnIndicator();
}

async function player_vs_player_setup() {
    async function joinGame(group = 35, nick = Null, password = Null, size = 9) {
        // Lógica para o jogador juntar-se ao jogo
        let response = await fetch(`${server}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group: group, nick: nick, password: password, size: size })
        });

        const data = await response.json();
        if (data.error) {
            showMessage(`Erro ao juntar-se ao jogo: ${data.error}`, 'error');
            return;
        }
        // Configurar o jogo com os dados recebidos
        configPanel.classList.add('oculto');
        gamePage.classList.remove('oculto');
        createBoard();
        clearLog();
        window.playerTurn = 'blue'; // ou 'red', dependendo do que o servidor indicar
        updateTurnIndicator();
        showMessage("Jogo iniciado! É a sua vez.", 'info');
        console.log("Jogo PvP iniciado:", data.game);
        sessionStorage.setItem('currentGameId', data.game);
        return data.game;
    }
    async function updateGame(gameId, nick) {
        let response = await fetch(`${server}/update`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game: gameId, nick: nick })
        });
        const data = await response.json();
        if (data.error) {
            showMessage(`Erro ao atualizar o jogo: ${data.error}`, 'error');
            return;
        }
        // Atualize o estado do jogo com os dados recebidos
    }
    async function waitForOtherPlayer(gameId, nick) {
        showMessage("Aguardando outro jogador...", 'info');
        console.log("=== INICIANDO ESPERA POR OUTRO JOGADOR ===");
        console.log("Game ID:", gameId);
        console.log("Nick:", nick);
        
        return new Promise((resolve, reject) => {
            const eventSource = new EventSource(`${server}/update?nick=${encodeURIComponent(nick)}&game=${encodeURIComponent(gameId)}`);
            
            eventSource.onmessage = (event) => {
                try {
                    console.log("Mensagem SSE recebida:", event.data);
                    const data = JSON.parse(event.data);
                    console.log("Dados parseados:", data);
                    
                    if (data.error) {
                        showMessage(`Erro: ${data.error}`, 'error');
                        console.error("Erro do servidor:", data.error);
                        eventSource.close();
                        reject(data.error);
                        return;
                    }
                    
                    // Verificar se o jogo tem 2 jogadores (board/pieces definido E players com 2 entradas)
                    const hasBoard = data.board || data.pieces;
                    const hasTwoPlayers = data.players && Object.keys(data.players).length === 2;
                    
                    if (hasBoard && hasTwoPlayers) {
                        showMessage("Outro jogador entrou! Começando o jogo...", 'success');
                        console.log("=== JOGO PRONTO PARA INICIAR ===");
                        console.log("Dados do jogo:", data);
                        eventSource.close();
                        resolve(data);
                    } else {
                        console.log("Aguardando segundo jogador... Dados atuais:", data);
                        console.log("Jogadores atuais:", Object.keys(data.players || {}).length);
                    }
                } catch (error) {
                    console.error("Erro ao processar mensagem SSE:", error);
                    eventSource.close();
                    reject(error);
                }
            };
            
            eventSource.onerror = (error) => {
                console.error("Erro no EventSource:", error);
                showMessage("Erro de conexão ao aguardar jogador", 'error');
                eventSource.close();
                reject(error);
            };
            
            // Timeout de segurança (5 minutos)
            setTimeout(() => {
                if (eventSource.readyState !== EventSource.CLOSED) {
                    console.log("Timeout ao aguardar jogador");
                    showMessage("Timeout ao aguardar jogador", 'error');
                    eventSource.close();
                    reject(new Error("Timeout"));
                }
            }, 300000); // 5 minutos = 300000ms
        });
    }

    async function playGame(gameId, nick = null, password = null, size = 9) {
        console.log("=== INICIANDO PLAYGAME ===");
        console.log("Game ID:", gameId);
        console.log("Nick:", nick);
        
        try {
            const gameData = await waitForOtherPlayer(gameId, nick);
            console.log("=== JOGO INICIADO ===");
            console.log("Dados do jogo:", gameData);
            
            // Processar dados do servidor
            if (gameData) {
                console.log("Pieces:", gameData.pieces);
                console.log("Turno:", gameData.turn);
                console.log("Jogadores:", gameData.players);
                console.log("Step:", gameData.step);
                
                // Determinar qual é a minha cor
                const myColor = gameData.players[nick]; // "Blue" ou "Red"
                console.log("Minha cor:", myColor);
                
                // Atualizar o tabuleiro com os dados do servidor
                updateBoardFromServerData(gameData);
                
                // Configurar de quem é o turno
                const isMyTurn = gameData.turn === nick;
                window.playerTurn = myColor === "Blue" ? 'blue' : 'red';
                updateTurnIndicator();
                
                if (isMyTurn) {
                    showMessage("É a sua vez! Lance o dado.", 'info');
                    resetDiceUI();
                } else {
                    showMessage("Aguardando jogada do adversário...", 'info');
                }
                
                // Iniciar loop de atualizações do jogo
                startGameLoop(gameId, nick, myColor);
            }
        } catch (error) {
            console.error("Erro ao iniciar jogo:", error);
            showMessage("Erro ao iniciar jogo PvP", 'error');
        }
    }

    // Nova função para atualizar o tabuleiro com dados do servidor
    function updateBoardFromServerData(gameData) {
        console.log("Atualizando tabuleiro com dados do servidor");
        
        // O servidor retorna um array de 36 peças (9x4 tabuleiro)
        // pieces[i] pode ser: { color: "Blue"/"Red", inMotion: bool, reachedLastRow: bool } ou null
        
        const pieces = gameData.pieces || [];
        const squares = document.querySelectorAll('.square');
        
        // Limpar tabuleiro atual
        squares.forEach(sq => {
            sq.innerHTML = '';
            const row = parseInt(sq.dataset.row);
            const col = parseInt(sq.dataset.col);
            window.matrix[row][col] = 0;
        });
        
        // Recriar peças baseado nos dados do servidor
        pieces.forEach((piece, index) => {
            if (!piece) return;
            
            const row = Math.floor(index / window.BOARD_SIZE);
            const col = index % window.BOARD_SIZE;
            const square = squares[index];
            
            if (!square) return;
            
            const pieceDiv = document.createElement('div');
            pieceDiv.className = piece.color === "Blue" ? 'piece_blue' : 'piece_red';
            pieceDiv.setAttribute('data-first-move', piece.inMotion ? 'false' : 'true');
            pieceDiv.setAttribute('data-visited-enemy', piece.reachedLastRow ? 'true' : 'false');
            
            square.appendChild(pieceDiv);
            window.matrix[row][col] = piece.color === "Blue" ? 2 : 1;
        });
        
        console.log("Tabuleiro atualizado");
    }

    // Nova função para manter o loop de atualizações
    function startGameLoop(gameId, nick, myColor) {
        console.log("Iniciando loop de atualizações do jogo");
        
        const eventSource = new EventSource(`${server}/update?nick=${encodeURIComponent(nick)}&game=${encodeURIComponent(gameId)}`);
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Atualização do jogo:", data);
                
                // Verificar se há vencedor
                if (data.winner) {
                    console.log("Jogo terminado! Vencedor:", data.winner);
                    const iWon = data.winner === nick;
                    showEndGameMenu(iWon ? 'blue' : 'red');
                    eventSource.close();
                    window.currentEventSource = null;
                    return;
                }
                
                // Atualizar estado do jogo
                if (data.pieces) {
                    updateBoardFromServerData(data);
                }
                
                // Verificar de quem é o turno
                if (data.turn) {
                    console.log("Turno de:", data.turn);
                    const isMyTurn = data.turn === nick;
                    
                    if (isMyTurn) {
                        showMessage("É a sua vez! Lance o dado.", 'info');
                        window.playerTurn = myColor === "Blue" ? 'blue' : 'red';
                        resetDiceUI();
                    } else {
                        showMessage("Aguardando jogada do adversário...", 'info');
                        window.playerTurn = myColor === "Blue" ? 'red' : 'blue';
                        updateTurnIndicator();
                    }
                }
                
            } catch (error) {
                console.error("Erro ao processar atualização:", error);
            }
        };
        
        eventSource.onerror = (error) => {
            console.error("Erro no loop do jogo:", error);
            eventSource.close();
            window.currentEventSource = null;
        };
        
        // Armazenar eventSource para poder fechar depois
        window.currentEventSource = eventSource;
    }

/* 
    async function playGame(gameId, nick = Null, password = Null, size = 9) {
        // Lógica para jogar o jogo com o ID fornecido
        const gameData = await waitForOtherPlayer(gameId, nick);
        console.log("Jogando jogo com ID:", gameId);
        // Aqui você pode implementar a lógica para interagir com o servidor e atualizar o estado do jogo

    } */

    if(btnDesistir) btnDesistir.addEventListener('click', () => {
        if (window.currentEventSource) {
            window.currentEventSource.close();
            window.currentEventSource = null;
        }
        showEndGameMenu('red');
    });

    if(btnVoltarInicio) btnVoltarInicio.addEventListener('click', () => {
        if (window.currentEventSource) {
            window.currentEventSource.close();
            window.currentEventSource = null;
        }
        location.reload();
    });

    try {
        console.log("Juntando-se ao jogo PvP...");
        game = await joinGame(35, sessionStorage.getItem('currentUserNick'), sessionStorage.getItem('currentUserPassword'), window.BOARD_SIZE);
        playGame(game, sessionStorage.getItem('currentUserNick'), sessionStorage.getItem('currentUserPassword'), window.BOARD_SIZE);

    } catch (error) {
        showMessage("Erro ao iniciar jogo PvP.", 'error');
    }
}

function rollDice() {
    let tab = 0;
    for(let i=0; i<4; i++) {
        if(Math.random()>=0.5) { tab++; diceSticks[i].className='stick claro'; }
        else diceSticks[i].className='stick escuro';
    }
    diceValue = (tab===0)?6:tab;
    diceValueDisplay.textContent = diceValue;
    diceMessage.textContent = "Selecione uma peça.";
    showMessage(`Dado: ${diceValue}. Mova uma peça.`);
    return diceValue;
}

if(dicePanel) dicePanel.addEventListener('click', async () => {
    if(diceValue !== 0) return showMessage("Já lançou o dado.", 'error');
    if(window.playerTurn !== 'blue') return showMessage("Vez do computador!", 'error');

    rollDice();
    addLog('blue', diceValue);

    if(window.legalMovesForDice && window.buildStateFromDOM) {
        const state = window.buildStateFromDOM();
        const moves = window.legalMovesForDice(state, 2, diceValue);

        if(moves.length === 0) {
            showMessage(`Sem jogadas válidas para ${diceValue}.`, 'error');

            await new Promise(r => setTimeout(r, 2000));

            if(diceValue===1||diceValue===4||diceValue===6) {
                showMessage("Joga de novo! (Reroll)", 'info');
                resetDiceUI();
            } else {
                showMessage("Passa a vez ao computador...", 'info');
                passarVezAoPC();
            }
        }
    }
});

// --- 6. MOVIMENTO ---

async function move(row, col, diceValue, pieceElement, originalSq, aiMoveChoice=null) {
    let r = parseInt(row);
    let c = parseInt(col);
    let first_move_used = false;

    if(pieceElement.getAttribute('data-first-move') === 'true') {
        if(diceValue === 1) {
            first_move_used = true;
            pieceElement.setAttribute('data-first-move', 'false');
        } else {
            showMessage("1º movimento requer Tâb (1).", 'error');
            return (diceValue===4||diceValue===6) ? 'reroll_only' : 'fail';
        }
    }

    for(let k=0; k<diceValue; k++) {
        let dir = 0;
        if(r === 1 || r === 3) dir = 1;
        else if(r === 0 || r === 2) dir = -1;

        // CORREÇÃO: Removemos lógica de recuo no 1º movimento
        c += dir;

        if(c < 0 || c >= window.BOARD_SIZE) {
            const isBlue = pieceElement.classList.contains('piece_blue');
            if (isBlue) {
                if(r===3) { r=2; c=window.BOARD_SIZE-1; }
                else if(r===2) { r=1; c=0; }
                else if(r===1) {
                    let choice = 'retreat';
                    const visited = pieceElement.getAttribute('data-visited-enemy') === 'true';
                    if(!visited && c>=window.BOARD_SIZE) {
                        if(window.playerTurn==='blue') choice = await askDirection();
                        else choice = aiMoveChoice;
                    }
                    if(choice === 'attack' && !visited) {
                        r=0; c=window.BOARD_SIZE-1;
                        pieceElement.setAttribute('data-visited-enemy', 'true');
                    } else {
                        r=2; c=window.BOARD_SIZE-1;
                    }
                }
                else if(r===0) { r=1; c=0; }
            }
            else { // isRed
                if(r===0) { r=1; c=0; }
                else if(r===1) { r=2; c=window.BOARD_SIZE-1; }
                else if(r===2) {
                    let choice = 'retreat';
                    const visited = pieceElement.getAttribute('data-visited-enemy') === 'true';
                    if(!visited && c<0) {
                        if(window.playerTurn==='red') choice = aiMoveChoice;
                    }
                    if(choice === 'attack' && !visited) {
                        r=3; c=0;
                        pieceElement.setAttribute('data-visited-enemy', 'true');
                    } else {
                        r=1; c=0;
                    }
                }
                else if(r===3) { r=2; c=window.BOARD_SIZE-1; }
            }
        }
    }

    const pVal = window.matrix[row][col];
    if(window.matrix[r][c] === pVal) {
        showMessage("Casa ocupada por peça sua.", 'error');
        if(first_move_used) pieceElement.setAttribute('data-first-move', 'true');
        return 'fail';
    }

    const targetSq = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
    if(!targetSq) return 'fail';

    if(window.matrix[r][c] !== 0) {
        showMessage("Peça capturada!", 'info');
        targetSq.innerHTML = '';
    }

    targetSq.appendChild(pieceElement);
    window.matrix[r][c] = pVal;
    window.matrix[row][col] = 0;

    if(checkWinCondition()) return 'success_win';
    return 'success';
}

function resetDiceUI() {
    diceValue = 0;
    if(diceValueDisplay) diceValueDisplay.textContent = "-";
    if(diceMessage) diceMessage.textContent = "Clique para lançar";
    diceSticks.forEach(s => s.className='stick');
    updateTurnIndicator();
}

function askDirection() {
    return new Promise((resolve) => {
        moveSelector.classList.remove('oculto');
        overlay.classList.add('ativo');
        moveAttackBtn.onclick = () => finish('attack');
        moveRetreatBtn.onclick = () => finish('retreat');
        function finish(choice) {
            moveSelector.classList.add('oculto');
            overlay.classList.remove('ativo');
            resolve(choice);
        }
    });
}

async function highlightMove(row, col, diceValue, piece, sq) {
    let r=parseInt(row), c=parseInt(col);
    let first_move_used = false;
    if(piece.getAttribute('data-first-move') === 'true') {
        if(diceValue===1) first_move_used=true;
        else {
            showMessage("Requer 1 (Tâb).", 'error');
            return (diceValue===4||diceValue===6)?'reroll_only':'fail';
        }
    }

    for(let k=0; k<diceValue; k++) {
        let dir=0;
        if(r===1||r===3) dir=1; else if(r===0||r===2) dir=-1;

        // CORREÇÃO: Removemos lógica de recuo
        c+=dir;

        if(c<0 || c>=window.BOARD_SIZE) {
            const isBlue = piece.classList.contains('piece_blue');
            if(isBlue) {
                if(r===3) { r=2; c=window.BOARD_SIZE-1; }
                else if(r===2) { r=1; c=0; }
                else if(r===1) {
                    if(piece.getAttribute('data-visited-enemy')==='false' && c>=window.BOARD_SIZE && window.playerTurn==='blue') {
                        showMessage("Escolha o caminho...", 'info');
                        r=0; c=window.BOARD_SIZE-1;
                        break;
                    }
                    r=2; c=window.BOARD_SIZE-1;
                }
                else if(r===0) { r=1; c=0; }
            } else {
                if(r===0) { r=1; c=0; }
                else if(r===1) { r=2; c=window.BOARD_SIZE-1; }
                else if(r===2) { r=1; c=0; }
                else if(r===3) { r=2; c=window.BOARD_SIZE-1; }
            }
        }
    }
    const tSq = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
    if(!tSq) return 'fail';
    if(window.matrix[r][c] === window.matrix[row][col]) { showMessage("Bloqueado.",'error'); return 'fail'; }

    highlight(tSq);
    const ok = await waitForClickOnSquare(tSq, sq);
    clearHighlights();
    return ok ? tSq : 'cancel';
}

function waitForClickOnSquare(tSq, origin) {
    return new Promise(r => {
        const handler = (e) => {
            if(tSq.contains(e.target)) { clean(); r(true); }
        };
        const cancel = (e) => {
            if(!tSq.contains(e.target)) { clean(); r(false); }
        };
        function clean() {
            tSq.removeEventListener('click', handler);
            document.removeEventListener('click', cancel, true);
        }
        setTimeout(() => {
            tSq.addEventListener('click', handler);
            document.addEventListener('click', cancel, true);
        }, 100);
    });
}

async function handleClick(e) {
    if(diceValue===0 || window.playerTurn!=='blue') return;
    clearHighlights();
    const sq = e.currentTarget;
    const piece = sq.querySelector('.piece_blue');

    if(piece) {
        sq.classList.add('selected');
        const r = sq.dataset.row; const c = sq.dataset.col;
        const target = await highlightMove(r, c, diceValue, piece, sq);

        if(target instanceof HTMLElement) {
            const res = await move(r, c, diceValue, piece, sq);
            if(res==='success' || res==='success_win') {
                if(res==='success_win') return;
                if(diceValue===1||diceValue===4||diceValue===6) {
                    showMessage("Joga de novo!", 'success');
                    resetDiceUI();
                } else {
                    showMessage("Vez do PC...", 'info');
                    passarVezAoPC();
                }
            } else if (res==='reroll_only') {
                showMessage("Tente de novo.", 'info');
                resetDiceUI();
            }
        } else if (target==='cancel') {
            showMessage("Cancelado.", 'error');
        }
    } else {
        if(sq.querySelector('.piece_red')) showMessage("Peça do inimigo!", 'error');
        else showMessage("Selecione uma peça Azul.", 'error');
    }
}

function passarVezAoPC() {
    window.playerTurn = 'red';
    updateTurnIndicator();
    if(window.handleAITurn) window.handleAITurn(0);
    else { console.error("IA em falta"); }
}

function highlight(sq) { clearHighlights(); sq.classList.add('highlight-end'); }
function clearHighlights() {
    document.querySelectorAll('.square').forEach(s => s.classList.remove('selected','highlight-start','highlight-end'));
}
function checkWinCondition() {
    const r = document.querySelectorAll('.piece_red').length;
    const b = document.querySelectorAll('.piece_blue').length;
    if(r===0) { showEndGameMenu('blue'); return true; }
    if(b===0) { showEndGameMenu('red'); return true; }
    return false;
}
function showEndGameMenu(winner) {
    endGameMessage.textContent = (winner==='blue') ? "GANHOU!" : "PERDEU!";
    endGameMenu.classList.remove('oculto');
    overlay.classList.add('ativo');
    updateStats(winner);
}
if(btnDesistir) btnDesistir.addEventListener('click', () => showEndGameMenu('red'));
if(btnVoltarInicio) btnVoltarInicio.addEventListener('click', () => location.reload());
if(btnJogarNovamente) btnJogarNovamente.addEventListener('click', () => {
    endGameMenu.classList.add('oculto');
    createBoard();
    resetDiceUI();
    window.playerTurn='blue';
    overlay.classList.remove('ativo');
});

function addLog(color, val) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="log-ball ${color}"></span> <span class="log-number ${color}">${val}</span>`;
    diceLogList.prepend(li);
}
function clearLog() { diceLogList.innerHTML=''; }

function toggleModal(m, s) {
    if(s) { m.classList.add('instrucoes-visiveis'); overlay.classList.add('ativo'); }
    else { m.classList.remove('instrucoes-visiveis', 'classificacoes-visiveis'); overlay.classList.remove('ativo'); }
}
if(btnInstrucoes) btnInstrucoes.addEventListener('click', ()=>toggleModal(document.getElementById('instrucoes'), true));
if(btnFecharInstrucoes) btnFecharInstrucoes.addEventListener('click', ()=>toggleModal(document.getElementById('instrucoes'), false));
if(btnClassificacoes) btnClassificacoes.addEventListener('click', () => {
    carregarClassificacoes();
    toggleModal(classificacoesModal, true);
});
if(btnFecharClassificacoes) btnFecharClassificacoes.addEventListener('click', () => toggleModal(classificacoesModal, false));

if(btnInstrucoesJogo) btnInstrucoesJogo.addEventListener('click', ()=>toggleModal(instrucoesJogoModal, true));
if(btnFecharInstrucoesJogo) btnFecharInstrucoesJogo.addEventListener('click', ()=>toggleModal(instrucoesJogoModal, false));
if(btnClassificacoesJogo) btnClassificacoesJogo.addEventListener('click', () => {
    carregarClassificacoes();
    toggleModal(classificacoesJogoModal, true);
});
if(btnFecharClassificacoesJogo) btnFecharClassificacoesJogo.addEventListener('click', () => toggleModal(classificacoesJogoModal, false));

if(overlay) overlay.addEventListener('click', () => {
    document.querySelectorAll('.instrucoes-visiveis, .classificacoes-visiveis').forEach(el => el.classList.remove('instrucoes-visiveis', 'classificacoes-visiveis'));
    overlay.classList.remove('ativo');
    moveSelector.classList.add('oculto');
});

function carregarClassificacoes() {
    const lb = JSON.parse(localStorage.getItem('tab_leaderboard')) || {};
    const sortedPlayers = Object.keys(lb).map(user => {
        return { username: user, ...lb[user] };
    }).sort((a, b) => b.victories - a.victories);

    const tbodyLogin = document.querySelector('#classificacoes tbody');
    const tbodyGame = document.querySelector('#classificacoesJogo tbody');

    [tbodyLogin, tbodyGame].forEach(tbody => {
        if (!tbody) return;
        tbody.innerHTML = '';
        sortedPlayers.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${index + 1}º</td><td>${player.username}</td><td>${player.victories}</td><td>${player.defeats}</td>`;
            tbody.appendChild(row);
        });
    });
}

function updateStats(winner) {
    const currentUser = sessionStorage.getItem('currentUserNick');
    if (!currentUser) return;
    const lb = JSON.parse(localStorage.getItem('tab_leaderboard')) || {};
    if (!lb[currentUser]) lb[currentUser] = { victories: 0, defeats: 0 };
    if (winner === 'blue') lb[currentUser].victories++;
    else lb[currentUser].defeats++;
    localStorage.setItem('tab_leaderboard', JSON.stringify(lb));
    carregarClassificacoes();
}

window.addEventListener('load', carregarClassificacoes);
window.addLog = addLog;
window.move = move;
window.showMessage = showMessage;
window.resetDiceUI = resetDiceUI;