// --- 1. VARIÁVEIS GLOBAIS ---
window.BOARD_SIZE = 9;
window.NUM_ROWS = 4;
window.playerTurn = 'blue';
window.matrix = null;
window.isPvP = false;

// Configurações do Servidor
const SERVER_URL = "http://twserver.alunos.dcc.fc.up.pt:8008";
const LOCAL_SERVER_URL = "http://localhost:3000";
const USE_LOCAL_SERVER = false;
const GROUP_ID = 35;

// Estado do Utilizador e Jogo
let userNick = null;
let userPass = null;
let gameId = null;
let eventSource = null;
let myServerColor = null;

// Configurações Locais
let AI_DIFFICULTY = 'medium';
let diceValue = 0;

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
const dicePanel = document.getElementById('dice-panel');
const diceValueDisplay = document.getElementById('dice-value-display');
const diceMessage = document.getElementById('dice-message');
const messageBar = document.getElementById('message-bar');
const turnIndicator = document.getElementById('turn-indicator');
const turnPlayerDisplay = document.getElementById('turn-player-display');
const btnDesistir = document.getElementById('btnDesistir');
const endGameMenu = document.getElementById('endGameMenu');
const endGameMessage = document.getElementById('endGameMessage');
const btnVoltarInicio = document.getElementById('btnVoltarInicio');
const btnJogarNovamente = document.getElementById('btnJogarNovamente');
const diceLogList = document.getElementById('dice-log-list');

// Botões Extras
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


// --- 3. API ---
async function apiRequest(endpoint, data) {
    let url;
    if (endpoint === 'register' && USE_LOCAL_SERVER) {
        url = `${LOCAL_SERVER_URL}/${endpoint}`;
    } else {
        url = `${SERVER_URL}/${endpoint}`;
    }
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.error) {
            console.warn(`API Error [${endpoint}]:`, result.error);
            if (endpoint !== 'register') showMessage(`Erro: ${result.error}`, 'error');
            return { error: result.error };
        }
        return result;
    } catch (err) {
        console.error("Fetch Error:", err);
        showMessage("Falha na conexão.", 'error');
        return null;
    }
}

// --- 4. LOGIN ---
function showLoginMessage(text, isError = true) {
    if (!loginMessage) return;
    loginMessage.textContent = text;
    loginMessage.classList.remove('oculto');
    loginMessage.className = isError ? 'message-box error' : 'message-box success';
    setTimeout(() => loginMessage.classList.add('oculto'), 4000);
}

if(showRegisterLink) showRegisterLink.addEventListener("click", (e) => { e.preventDefault(); loginForm.classList.add("oculto"); registerForm.classList.remove("oculto"); });
if(showLoginLink) showLoginLink.addEventListener("click", (e) => { e.preventDefault(); registerForm.classList.add("oculto"); loginForm.classList.remove("oculto"); });

async function performAuth(nick, pass) {
    const result = await apiRequest('register', { nick: nick, password: pass });
    if ((result && !result.error) || (result && result.error && result.error === "User already registered")) {
        userNick = nick;
        userPass = pass;
        sessionStorage.setItem('currentUserNick', nick);
        sessionStorage.setItem('currentUserPassword', pass);
        loginPage.classList.add("oculto");
        configPanel.classList.remove("oculto");
        updateRankingTables();
    } else {
        showLoginMessage(result.error || "Erro ao entrar.", true);
    }
}

if(loginForm) loginForm.addEventListener("submit", (e) => { e.preventDefault(); performAuth(usernameInput.value.trim(), passwordInput.value.trim()); });
if(registerForm) registerForm.addEventListener("submit", (e) => { e.preventDefault(); performAuth(regUsernameInput.value.trim(), regPasswordInput.value.trim()); });

// --- 5. CONFIGURAÇÃO ---
function toggleAILevelVisibility() {
    const gameModeSelect = document.getElementById('gameMode');
    if (!gameModeSelect || !aiLevelOption) return;
    if (gameModeSelect.value === 'pvp') aiLevelOption.style.display = 'none';
    else aiLevelOption.style.display = 'block';
}

if(gameModeSelect) {
    toggleAILevelVisibility();
    gameModeSelect.addEventListener('change', toggleAILevelVisibility);
}

if(btnIniciarJogo) btnIniciarJogo.addEventListener('click', async () => {
    window.BOARD_SIZE = parseInt(document.getElementById('boardSize').value);
    const mode = document.getElementById('gameMode').value;
    configPanel.classList.add('oculto');
    gamePage.classList.remove('oculto');

    if(document.getElementById('instrucoes')) document.getElementById('instrucoesJogo').innerHTML = document.getElementById('instrucoes').innerHTML;
    if(document.getElementById('classificacoes')) document.getElementById('classificacoesJogo').innerHTML = document.getElementById('classificacoes').innerHTML;

    clearLog();
    boardElement.classList.remove('board-rotated');

    if (mode === 'pvp') {
        window.isPvP = true;
        window.playerTurn = 'waiting';
        createEmptyBoard();
        showMessage("A procurar adversário...", 'info');
        turnIndicator.className = '';
        turnPlayerDisplay.textContent = "Aguardando...";
        await joinPvPGame();
    } else {
        window.isPvP = false;
        AI_DIFFICULTY = document.getElementById('aiLevel').value;
        window.playerTurn = document.getElementById('firstPlayer').value;
        switch(AI_DIFFICULTY) {
            case 'easy': AI_SIMULATIONS = 100; break;
            case 'medium': AI_SIMULATIONS = 300; break;
            case 'hard': AI_SIMULATIONS = 1000; break;
        }
        createLocalBoard();
        
        // Inicializa o Canvas do Dado de Paus
        if (window.initDiceCanvas) {
            window.initDiceCanvas();
        }
        
        if (window.playerTurn === 'red') {
            updateTurnIndicatorLocal();
            showMessage("Computador começa...");
            setTimeout(() => { if(window.handleAITurn) window.handleAITurn(0); }, 1000);
        } else {
            updateTurnIndicatorLocal();
            showMessage("Sua vez! Lance o dado.");
            resetDiceUI();
        }
    }
});

// --- 6. LÓGICA PVP (MODO ESPELHO) ---
async function joinPvPGame() {
    const data = { group: GROUP_ID, nick: userNick, password: userPass, size: window.BOARD_SIZE };
    const result = await apiRequest('join', data);
    if (result && result.game) {
        gameId = result.game;
        startServerEvents(gameId);
    } else {
        showMessage("Erro ao entrar.", 'error');
        setTimeout(() => { gamePage.classList.add('oculto'); configPanel.classList.remove('oculto'); }, 2000);
    }
}

function startServerEvents(id) {
    if (eventSource) eventSource.close();
    const url = `${SERVER_URL}/update?nick=${encodeURIComponent(userNick)}&game=${encodeURIComponent(id)}`;
    eventSource = new EventSource(url);
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.error) console.error(data.error);
        if (data.winner) handleServerGameOver(data.winner);
        else updateBoardFromServer(data);
    };
    eventSource.onerror = (err) => console.error("Erro SSE:", err);
}

function updateBoardFromServer(data) {
    console.log("Server Update:", data);
    if (data.players) {
        const myColorName = data.players[userNick];
        myServerColor = myColorName ? myColorName.toLowerCase() : 'blue';
        boardElement.classList.remove('board-rotated');
    }

    if (data.pieces) {
        // AQUI ESTÁ A CORREÇÃO: Chama a função de espelho
        renderServerPiecesWithMirror(data.pieces);
    }

    if (data.turn) {
        const isMyTurn = (data.turn === userNick);
        window.playerTurn = isMyTurn ? 'blue' : 'red';

        if (data.dice && data.dice.value) {
             const serverDiceValue = data.dice.value;
             if (diceValue !== serverDiceValue) {
                 const visualColor = isMyTurn ? 'blue' : 'red';
                 addLog(visualColor, serverDiceValue);
             }
             diceValue = serverDiceValue;
             diceValueDisplay.textContent = diceValue;
             visualizeDice(diceValue);
        } else {
             if (!data.dice || data.step === 'roll') diceValue = 0;
        }

        if (isMyTurn) {
            turnPlayerDisplay.textContent = "EU";
            turnIndicator.className = 'blue';
            dicePanel.style.opacity = "1";
            dicePanel.style.pointerEvents = "auto";

            if (diceValue > 0) {
                const currentState = window.buildStateFromDOM();
                const myPieceVal = 2;

                const possibleMoves = window.legalMovesForDice(currentState, myPieceVal, diceValue);

                if (possibleMoves.length === 0) {
                    diceMessage.textContent = "Sem jogadas...";
                    showMessage(`Dado: ${diceValue}. Sem movimentos! Passando...`, 'error');
                    setTimeout(() => { if (window.playerTurn === 'blue' && diceValue > 0) serverPass(); }, 2000);
                } else {
                    diceMessage.textContent = "Selecione uma peça.";
                    showMessage(`Dado: ${diceValue}. Mova uma peça!`, 'info');
                }
            } else {
                diceValueDisplay.textContent = "-";
                diceMessage.textContent = "Clique para lançar";
                showMessage("Sua vez! Lance o dado.", 'info');
            }
        } else {
            turnPlayerDisplay.textContent = `ADVERSÁRIO (${data.turn})`;
            turnIndicator.className = 'red';
            dicePanel.style.opacity = "0.7";
            dicePanel.style.pointerEvents = "none";

            if (diceValue > 0) {
                 diceValueDisplay.textContent = diceValue;
                 visualizeDice(diceValue);
                 showMessage(`Adversário tirou ${diceValue}.`, 'info');
            } else {
                 diceValueDisplay.textContent = "-";
                 showMessage(`Aguardando ${data.turn}...`, 'info');
            }
        }
    }
}

// --- RENDERIZAÇÃO COM ESPELHO (MIRROR) ---
function renderServerPiecesWithMirror(serverPieces) {
    const squares = document.querySelectorAll('.square');

    // 1. Limpeza Total para evitar clones
    squares.forEach(sq => sq.innerHTML = '');

    window.matrix = [];
    for(let r=0; r<window.NUM_ROWS; r++) {
        window.matrix[r] = [];
        for(let c=0; c<window.BOARD_SIZE; c++) window.matrix[r][c] = 0;
    }

    const myColor = myServerColor ? myServerColor.toLowerCase() : 'blue';

    // SE SOU BLUE: Rotação 180º (Inverto Linhas E Colunas)
    // SE SOU RED: Troca de Cor apenas
    let rotateBoard = (myColor === 'blue');
    let swapColors = (myColor === 'red');

    serverPieces.forEach((cell, serverIndex) => {
        if (!cell) return;

        const r_server = Math.floor(serverIndex / window.BOARD_SIZE);
        const c_server = serverIndex % window.BOARD_SIZE;

        let r_visual = r_server;
        let c_visual = c_server;

        if (rotateBoard) {
            // ROTAÇÃO 180º:
            // O que está em cima (0) vai para baixo (3)
            // O que está à esquerda (0) vai para a direita (8)
            r_visual = (window.NUM_ROWS - 1) - r_server;
            c_visual = (window.BOARD_SIZE - 1) - c_server;
        }

        const visualIndex = r_visual * window.BOARD_SIZE + c_visual;

        if (visualIndex < 0 || visualIndex >= squares.length) return;

        const rawColor = cell.color ? cell.color.toLowerCase() : 'blue';
        let visualColor = rawColor;
        if (swapColors) {
            visualColor = (rawColor === 'red') ? 'blue' : 'red';
        }

        const sq = squares[visualIndex];
        const isFirstMove = !cell.inMotion;
        const visitedEnemy = cell.reachedLastRow;

        const p = document.createElement('div');
        p.setAttribute('data-first-move', isFirstMove.toString());
        p.setAttribute('data-visited-enemy', visitedEnemy.toString());

        if (visualColor === 'blue') {
            p.className = 'piece_blue';
            window.matrix[r_visual][c_visual] = 2;
        } else {
            p.className = 'piece_red';
            window.matrix[r_visual][c_visual] = 1;
        }

        sq.appendChild(p);
    });
}

function handleServerGameOver(winnerNick) {
    if (eventSource) eventSource.close();
    const iWon = (winnerNick === userNick);
    endGameMessage.textContent = iWon ? "VITÓRIA!" : "DERROTA!";
    endGameMenu.classList.remove('oculto');
    overlay.classList.add('ativo');
    updateRankingTables();
}

async function serverRoll() {
    await apiRequest('roll', { nick: userNick, password: userPass, game: gameId });
}

async function serverMove(row, col) {
    // 1. Validação Visual
    const currentState = window.buildStateFromDOM();
    const myPieceVal = 2;
    const validMoves = window.legalMovesForDice(currentState, myPieceVal, diceValue);

    // Verifica se a ORIGEM do clique é válida
    const isValid = validMoves.some(m => m.row === row && m.col === col);

    if (!isValid) {
        showMessage("Jogada inválida para este dado!", 'error');
        return;
    }

    // 2. Tradução para Servidor (Inverter Linhas E Colunas se for Blue)
    const myColor = myServerColor ? myServerColor.toLowerCase() : 'blue';

    let r_server = row;
    let c_server = col;

    if (myColor === 'blue') {
        // Desfazer a Rotação 180º para enviar ao servidor
        r_server = (window.NUM_ROWS - 1) - row;
        c_server = (window.BOARD_SIZE - 1) - col;
    }

    const moveIndex = (r_server * window.BOARD_SIZE) + c_server;

    // Log para debug (podes remover depois)
    console.log(`Click [${row},${col}] -> Server [${r_server},${c_server}] (Index: ${moveIndex})`);

    const result = await apiRequest('notify', {
        nick: userNick,
        password: userPass,
        game: gameId,
        cell: moveIndex
    });

    if (result && !result.error) {
        diceMessage.textContent = "Aguardando...";
    }
}

async function serverPass() {
    await apiRequest('pass', { nick: userNick, password: userPass, game: gameId });
}

btnDesistir.addEventListener('click', async () => {
    if (window.isPvP && gameId) {
        await apiRequest('leave', { nick: userNick, password: userPass, game: gameId });
        if (eventSource) eventSource.close();
        showEndGameMenu(window.playerTurn === 'blue' ? 'red' : 'blue');
    } else {
        showEndGameMenu('red');
    }
});

// --- 7. RANKINGS ---
async function updateRankingTables() {
    const result = await apiRequest('ranking', { group: GROUP_ID, size: window.BOARD_SIZE || 9 });
    console.log("Ranking Data:", result);
    if (result && result.ranking) {
        const tbodyList = [document.querySelector('#classificacoes tbody'), document.querySelector('#classificacoesJogo tbody')];
        tbodyList.forEach(tbody => {
            if(!tbody) return;
            tbody.innerHTML = '';
            result.ranking.forEach((row, i) => {
                const tr = document.createElement('tr');
                const derrotas = row.games - row.victories;
                tr.innerHTML = `<td>${i+1}º</td><td>${row.nick}</td><td>${row.victories}</td><td>${derrotas}</td>`;
                tbody.appendChild(tr);
            });
        });
    }
}

// --- 8. UI E TABULEIRO (LOCAL) ---
function createEmptyBoard() {
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${window.BOARD_SIZE}, 50px)`;
    for(let r=0; r<window.NUM_ROWS; r++) {
        for(let c=0; c<window.BOARD_SIZE; c++) {
            const sq = document.createElement('div');
            sq.className = 'square';
            sq.dataset.row = r; sq.dataset.col = c;
            sq.addEventListener('click', handleSquareClick);
            boardElement.appendChild(sq);
        }
    }
}

function createLocalBoard() {
    createEmptyBoard();
    window.matrix = [];
    const squares = document.querySelectorAll('.square');
    for(let r=0; r<window.NUM_ROWS; r++) {
        window.matrix[r] = [];
        for(let c=0; c<window.BOARD_SIZE; c++) {
            window.matrix[r][c] = 0;
            const index = r * window.BOARD_SIZE + c;
            const sq = squares[index];
            if (r === 0) {
                const p = document.createElement('div'); p.className = 'piece_red';
                p.setAttribute('data-first-move', 'true'); p.setAttribute('data-visited-enemy', 'false');
                sq.appendChild(p); window.matrix[r][c] = 1;
            } else if (r === window.NUM_ROWS-1) {
                const p = document.createElement('div'); p.className = 'piece_blue';
                p.setAttribute('data-first-move', 'true'); p.setAttribute('data-visited-enemy', 'false');
                sq.appendChild(p); window.matrix[r][c] = 2;
            }
        }
    }
}

async function handleSquareClick(e) {
    const sq = e.currentTarget;
    const r = parseInt(sq.dataset.row);
    const c = parseInt(sq.dataset.col);

    // Verificações básicas de turno
    if (window.playerTurn !== 'blue') return; // Só clica se for a vez do 'blue' (que és tu visualmente)
    if (diceValue === 0) return;

    const piece = sq.querySelector('.piece_blue');

    // LÓGICA UNIFICADA (PvP e PvC)
    // Se clicou numa peça sua, tentamos destacar o movimento
    if (piece) {
        clearHighlights();
        sq.classList.add('highlight-blue');

        // Mostra as opções de jogada visualmente
        const target = await highlightMove(r, c, diceValue, piece, sq, 'blue');

        if (target instanceof HTMLElement) {
            // Se o utilizador clicou num quadrado de destino válido:

            if (window.isPvP) {
                // --- MODO PVP ---
                // Envia a jogada ao servidor usando a posição da peça de ORIGEM (r, c)
                // O servidor calcula o destino, nós só dizemos "move esta peça"
                await serverMove(r, c);

                // Limpa seleção visual
                clearHighlights();
                sq.classList.remove('selected');
            } else {
                // --- MODO PvC (Local) ---
                const res = await move(r, c, diceValue, piece, sq);
                if(res==='success' || res==='success_win') {
                    if(res==='success_win') return;
                    if([1,4,6].includes(diceValue)) {
                        showMessage("Joga de novo!", 'success');
                        resetDiceUI();
                    } else {
                        passarVezAoPC();
                    }
                } else if (res==='reroll_only') {
                    resetDiceUI();
                }
            }
        } else {
            // Cancelou ou clicou fora
            sq.classList.remove('selected');
        }
    }
}

if(dicePanel) dicePanel.addEventListener('click', () => {
    if (window.isPvP) {
        if (window.playerTurn !== 'blue') return showMessage("Não é a sua vez!", 'error');
        if (diceValue !== 0) return showMessage("Já lançou.", 'error');
        serverRoll();
    } else {
        if (window.playerTurn !== 'blue') return showMessage("Vez do PC!", 'error');
        if (diceValue !== 0) return showMessage("Já lançou.", 'error');
        rollDiceLocal();

        if(window.legalMovesForDice) {
            const moves = window.legalMovesForDice(window.buildStateFromDOM(), 2, diceValue);
            if(moves.length === 0) {
                 showMessage(`Sem jogadas para ${diceValue}.`, 'error');
                 setTimeout(() => {
                     if([1,4,6].includes(diceValue)) resetDiceUI();
                     else passarVezAoPC();
                 }, 2000);
            }
        }
    }
});

function rollDiceLocal() {
    clearHighlights();
    let tab = 0;
    // Calcula o valor do dado (0-4 paus claros correspondem a 6,1,2,3,4)
    for(let i=0; i<4; i++) { if(Math.random()>=0.5) tab++; }
    diceValue = (tab===0)?6:tab;
    
    // Reseta o número para '-' enquanto anima
    diceValueDisplay.textContent = "-";
    diceMessage.textContent = "Selecione peça.";
    
    // Canvas Animation: Anima o dado de paus
    // Mostra mensagem, número e histórico DEPOIS de a animação terminar
    if (window.animateDiceRoll) {
        window.animateDiceRoll(diceValue, () => {
            // Mostra tudo após a animação terminar
            showMessage(`Dado: ${diceValue}.`);
            diceValueDisplay.textContent = diceValue;
            addLog('blue', diceValue);
            console.log(`Dado: ${diceValue}`);
        });
    } else {
        // Fallback se Canvas não estiver disponível
        showMessage(`Dado: ${diceValue}.`);
        diceValueDisplay.textContent = diceValue;
        addLog('blue', diceValue);
    }
    
    return diceValue;
}
function visualizeDice(val) {
    // Converte de valor do servidor (1-6) para número de paus claros
    let claros = (val === 6) ? 0 : val;
    if (window.visualizeDiceValue) {
        window.visualizeDiceValue(claros);
    }
}
function showMessage(msg, type='info') { if(messageBar) { messageBar.textContent = msg; messageBar.className = type; } }

function updateTurnIndicatorLocal() {
    if (window.playerTurn === 'blue') {
        turnPlayerDisplay.textContent = "Eu (Azul)";
        turnIndicator.className = 'blue';
        dicePanel.style.opacity = "1";
        dicePanel.style.pointerEvents = "auto";
    } else {
        turnPlayerDisplay.textContent = 'PC (Vermelho)';
        turnIndicator.className = 'red';
        dicePanel.style.opacity = "0.7";
        dicePanel.style.pointerEvents = "none";
    }
}

function resetDiceUI() {
    diceValue = 0;
    if(diceValueDisplay) diceValueDisplay.textContent = "-";
    if(diceMessage) diceMessage.textContent = "Clique para lançar";
    
    // Limpa o canvas mostrando todos os paus no estado inicial (escuro)
    if (window.visualizeDiceValue) {
        window.visualizeDiceValue(0); // 0 claros = todos escuros
    }
    
    if(!window.isPvP) updateTurnIndicatorLocal();
}

function addLog(color, val) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="log-ball ${color}"></span> <span class="log-number ${color}">${val}</span>`;
    if(diceLogList) diceLogList.prepend(li);
}
function clearLog() { if(diceLogList) diceLogList.innerHTML=''; }
function toggleModal(m, s) { if(s) { m.classList.add('instrucoes-visiveis'); overlay.classList.add('ativo'); } else { m.classList.remove('instrucoes-visiveis', 'classificacoes-visiveis'); overlay.classList.remove('ativo'); } }
function clearHighlights() { document.querySelectorAll('.square').forEach(s => s.classList.remove('selected','highlight-blue','highlight-red')); }
function highlight(sq, color) { sq.classList.add(`highlight-${color}`); }

if(btnInstrucoes) btnInstrucoes.addEventListener('click', ()=>toggleModal(instrucoesModal, true));
if(btnFecharInstrucoes) btnFecharInstrucoes.addEventListener('click', ()=>toggleModal(instrucoesModal, false));
if(btnClassificacoes) btnClassificacoes.addEventListener('click', () => { updateRankingTables(); toggleModal(classificacoesModal, true); });
if(btnFecharClassificacoes) btnFecharClassificacoes.addEventListener('click', () => toggleModal(classificacoesModal, false));
if(btnInstrucoesJogo) btnInstrucoesJogo.addEventListener('click', ()=>toggleModal(instrucoesJogoModal, true));
if(btnFecharInstrucoesJogo) btnFecharInstrucoesJogo.addEventListener('click', ()=>toggleModal(instrucoesJogoModal, false));
if(btnClassificacoesJogo) btnClassificacoesJogo.addEventListener('click', () => { updateRankingTables(); toggleModal(classificacoesJogoModal, true); });
if(btnFecharClassificacoesJogo) btnFecharClassificacoesJogo.addEventListener('click', () => toggleModal(classificacoesJogoModal, false));
if(overlay) overlay.addEventListener('click', () => {
    document.querySelectorAll('.instrucoes-visiveis, .classificacoes-visiveis').forEach(el => el.classList.remove('instrucoes-visiveis', 'classificacoes-visiveis'));
    overlay.classList.remove('ativo');
    const ms = document.getElementById('moveSelector');
    if(ms) ms.classList.add('oculto');
});
if(btnVoltarMenu) btnVoltarMenu.addEventListener('click', () => { if(eventSource) eventSource.close(); configPanel.classList.add('oculto'); loginPage.classList.remove('oculto'); sessionStorage.removeItem('currentUserNick'); loginForm.reset(); });
if(btnVoltarInicio) btnVoltarInicio.addEventListener('click', () => location.reload());
if(btnJogarNovamente) btnJogarNovamente.addEventListener('click', () => { if(eventSource) eventSource.close(); endGameMenu.classList.add('oculto'); overlay.classList.remove('ativo'); gamePage.classList.add('oculto'); configPanel.classList.remove('oculto'); });

// As funções move/highlightMove locais ficam aqui em baixo inalteradas (como no original) para o modo PvC
async function move(row, col, diceValue, pieceElement, originalSq, aiMoveChoice=null) {
    let r = parseInt(row); let c = parseInt(col); let first_move_used = false;
    if(pieceElement.getAttribute('data-first-move') === 'true') {
        if(diceValue === 1) { first_move_used = true; pieceElement.setAttribute('data-first-move', 'false'); }
        else { showMessage("1º movimento requer Tâb (1).", 'error'); return (diceValue===4||diceValue===6) ? 'reroll_only' : 'fail'; }
    }
    for(let k=0; k<diceValue; k++) {
        let dir = 0; if(r === 1 || r === 3) dir = 1; else if(r === 0 || r === 2) dir = -1;
        c += dir;
        if(c < 0 || c >= window.BOARD_SIZE) {
            const isBlue = pieceElement.classList.contains('piece_blue');
            if (isBlue) {
                if(r===3) { r=2; c=window.BOARD_SIZE-1; } else if(r===2) { r=1; c=0; } else if(r===1) {
                    let choice = 'retreat';
                    const visited = pieceElement.getAttribute('data-visited-enemy') === 'true';
                    if(!visited && c>=window.BOARD_SIZE) { if(window.playerTurn==='blue') choice = await askDirection(); else choice = aiMoveChoice; }
                    if(choice === 'attack' && !visited) { r=0; c=window.BOARD_SIZE-1; pieceElement.setAttribute('data-visited-enemy', 'true'); } else { r=2; c=window.BOARD_SIZE-1; }
                } else if(r===0) { r=1; c=0; }
            } else {
                if(r===0) { r=1; c=0; } else if(r===1) { r=2; c=window.BOARD_SIZE-1; } else if(r===2) {
                    let choice = 'retreat';
                    const visited = pieceElement.getAttribute('data-visited-enemy') === 'true';
                    if(!visited && c<0) { if(window.playerTurn==='red') choice = aiMoveChoice; }
                    if(choice === 'attack' && !visited) { r=3; c=0; pieceElement.setAttribute('data-visited-enemy', 'true'); } else { r=1; c=0; }
                } else if(r===3) { r=2; c=window.BOARD_SIZE-1; }
            }
        }
    }
    const pVal = window.matrix[row][col];
    if(window.matrix[r][c] === pVal) { showMessage("Casa ocupada por peça sua.", 'error'); if(first_move_used) pieceElement.setAttribute('data-first-move', 'true'); return 'fail'; }
    const targetSq = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
    if(!targetSq) return 'fail';
    
    // Adicionar highlight de destino baseado na cor da peça
    const isBlue = pieceElement.classList.contains('piece_blue');
    targetSq.classList.add(isBlue ? 'highlight-blue' : 'highlight-red');
    
    if(window.matrix[r][c] !== 0) { showMessage("Peça capturada!", 'info'); targetSq.innerHTML = ''; }
    targetSq.appendChild(pieceElement);
    window.matrix[r][c] = pVal;
    window.matrix[row][col] = 0;
    if(checkWinConditionLocal()) return 'success_win';
    return 'success';
}

async function highlightMove(row, col, diceValue, piece, sq, color='blue') {
    let r=parseInt(row), c=parseInt(col);
    if(piece.getAttribute('data-first-move') === 'true') { if(diceValue!==1) { showMessage("Requer 1 (Tâb).", 'error'); return (diceValue===4||diceValue===6)?'reroll_only':'fail'; } }
    for(let k=0; k<diceValue; k++) {
        let dir=0; if(r===1||r===3) dir=1; else if(r===0||r===2) dir=-1;
        c+=dir;
        if(c<0 || c>=window.BOARD_SIZE) {
            const isBlue = piece.classList.contains('piece_blue');
            if(isBlue) {
                if(r===3) { r=2; c=window.BOARD_SIZE-1; } else if(r===2) { r=1; c=0; } else if(r===1) {
                    if(piece.getAttribute('data-visited-enemy')==='false' && c>=window.BOARD_SIZE && window.playerTurn==='blue') { showMessage("Escolha o caminho...", 'info'); r=0; c=window.BOARD_SIZE-1; break; }
                    r=2; c=window.BOARD_SIZE-1;
                } else if(r===0) { r=1; c=0; }
            } else {
                if(r===0) { r=1; c=0; } else if(r===1) { r=2; c=window.BOARD_SIZE-1; } else if(r===2) { r=1; c=0; } else if(r===3) { r=2; c=window.BOARD_SIZE-1; }
            }
        }
    }
    const tSq = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
    if(!tSq) return 'fail';
    if(window.matrix[r][c] === window.matrix[row][col]) { showMessage("Bloqueado.",'error'); return 'fail'; }
    highlight(tSq, color);
    const ok = await waitForClickOnSquare(tSq, sq);
    clearHighlights();
    return ok ? tSq : 'cancel';
}

function waitForClickOnSquare(tSq, origin) {
    return new Promise(r => {
        const handler = (e) => { if(tSq.contains(e.target)) { clean(); r(true); } };
        const cancel = (e) => { if(!tSq.contains(e.target)) { clean(); r(false); } };
        function clean() { tSq.removeEventListener('click', handler); document.removeEventListener('click', cancel, true); }
        setTimeout(() => { tSq.addEventListener('click', handler); document.addEventListener('click', cancel, true); }, 100);
    });
}

function askDirection() {
    return new Promise((resolve) => {
        const moveSelector = document.getElementById('moveSelector');
        const moveAttackBtn = document.getElementById('move_attack');
        const moveRetreatBtn = document.getElementById('move_retreat');
        moveSelector.classList.remove('oculto'); overlay.classList.add('ativo');
        moveAttackBtn.onclick = () => finish('attack');
        moveRetreatBtn.onclick = () => finish('retreat');
        function finish(choice) { moveSelector.classList.add('oculto'); overlay.classList.remove('ativo'); resolve(choice); }
    });
}

function checkWinConditionLocal() {
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
    if(window.isPvP) updateRankingTables();
}

function passarVezAoPC() {
    window.playerTurn = 'red';
    updateTurnIndicatorLocal();
    if(window.handleAITurn) window.handleAITurn(0);
}

// Exports
window.addLog = addLog;
window.move = move;
window.showMessage = showMessage;
window.resetDiceUI = resetDiceUI;