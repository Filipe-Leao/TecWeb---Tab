// --- 1. VARIÁVEIS GLOBAIS ---
window.BOARD_SIZE = 9;
window.NUM_ROWS = 4;
window.playerTurn = 'blue';
window.matrix = null;
window.isPvP = false;

// Configurações do Servidor
const GROUP_ID = 35;

// Deteta automaticamente se estás no teu PC (localhost) ou na faculdade
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// Define o URL correto automaticamente
const SERVER_URL = isLocal
    ? "http://localhost:8135"                    // Locahost
    : "http://twserver.alunos.dcc.fc.up.pt:8135"; // Na Faculdade

// Estas variáveis garantem que o resto do código usa o URL certo
const LOCAL_SERVER_URL = SERVER_URL;
const USE_LOCAL_SERVER = true; // Forçamos a usar sempre o nosso servidor

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
    const url = `${SERVER_URL}/${endpoint}`;

    console.log(`[API] ${endpoint} -> ${url}`, data); // Log para debug

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.error) {
            console.warn(`API Error [${endpoint}]:`, result.error);
            // Ignoramos erro visual no register para o login automático não mostrar alerta
            if (endpoint !== 'register') showMessage(`Erro: ${result.error}`, 'error');
            return { error: result.error };
        }
        return result;
    } catch (err) {
        console.error("Fetch Error:", err);
        showMessage("Falha na conexão ao servidor.", 'error');
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

    // Copiar conteúdo dos modais
    const instrucoesOrigem = document.getElementById('instrucoes');
    const instrucoesDestino = document.getElementById('instrucoesJogo');
    if(instrucoesOrigem && instrucoesDestino) {
        instrucoesDestino.innerHTML = instrucoesOrigem.innerHTML;
        const btnFechar = instrucoesDestino.querySelector('button');
        if (btnFechar) btnFechar.onclick = () => toggleModal(instrucoesDestino, false);
    }
    const classifOrigem = document.getElementById('classificacoes');
    const classifDestino = document.getElementById('classificacoesJogo');
    if(classifOrigem && classifDestino) {
        classifDestino.innerHTML = classifOrigem.innerHTML;
        const btnFechar = classifDestino.querySelector('button');
        if (btnFechar) btnFechar.onclick = () => toggleModal(classifDestino, false);
    }

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
        if (window.initDiceCanvas) window.initDiceCanvas();

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
        console.log("Joined PvP Game ID:", gameId);
        startServerEvents(gameId);
    } else {
        showMessage("Erro ao entrar ou jogo em andamento.", 'error');
        // Se falhar o join, tenta reconectar se já existir ID? 
        // Por simplicidade, voltamos ao menu.
        setTimeout(() => { gamePage.classList.add('oculto'); configPanel.classList.remove('oculto'); }, 2000);
    }
}

function startServerEvents(id) {
    if (eventSource) eventSource.close();

    const url = `${SERVER_URL}/update?nick=${encodeURIComponent(userNick)}&game=${encodeURIComponent(id)}`;

    console.log("[SSE] Connecting to:", url);

    eventSource = new EventSource(url);
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.error) console.error(data.error);
        if (data.winner) handleServerGameOver(data.winner);
        else updateBoardFromServer(data);
    };
    eventSource.onerror = (err) => console.error("Erro SSE:", err);
}

// --- UPDATE SERVER ---
function updateBoardFromServer(data) {
    console.log("Server Update:", data);

    if (data.players) {
        const numPlayers = Object.keys(data.players).length;

        // Se houver menos de 2 jogadores, estamos à espera
        if (numPlayers < 2) {
            turnPlayerDisplay.textContent = "Aguardando oponente...";
            turnIndicator.className = ''; // Remove cor
            dicePanel.style.opacity = "0.5";
            dicePanel.style.pointerEvents = "none";
            showMessage("À espera que o segundo jogador entre...", 'info');

            // Define a nossa cor, mas não desenha o jogo "ativo" ainda
            const myColorName = data.players[userNick];
            myServerColor = myColorName ? myColorName.toLowerCase() : 'blue';

            // Se houver peças, desenha-as para não ficar vazio, mas sem jogar
            if (data.pieces) renderServerPiecesWithMirror(data.pieces);
            return; // Sai da função aqui, impedindo o jogo de começar
        }

        // Se já há 2 jogadores, define a cor e continua
        const myColorName = data.players[userNick];
        myServerColor = myColorName ? myColorName.toLowerCase() : 'blue';
        boardElement.classList.remove('board-rotated');
    }
    // ----------------------------------------------------

    if (data.pieces) {
        renderServerPiecesWithMirror(data.pieces);
    }

    if (data.turn) {
        const isMyTurn = (data.turn === userNick);
        const previousTurn = window.playerTurn;
        const currentTurn = isMyTurn ? 'blue' : 'red';

        if (previousTurn !== currentTurn) {
            diceValue = 0;
            resetDiceUI();
        }

        window.playerTurn = currentTurn;

        // Se o servidor envia o valor do dado
        if (data.dice && data.dice.value) {
             const serverDiceValue = data.dice.value;
             // Ignora atualização se fomos nós que jogámos e o visual já atualizou
             let ignoreDice = (previousTurn !== currentTurn && isMyTurn);

             if (!ignoreDice && diceValue !== serverDiceValue) {
                 const visualColor = isMyTurn ? 'blue' : 'red';
                 if (window.animateDiceRoll && (isMyTurn || serverDiceValue !== 0)) {
                      diceValueDisplay.textContent = "-";
                      window.animateDiceRoll(serverDiceValue, () => {
                           diceValueDisplay.textContent = serverDiceValue;
                           addLog(visualColor, serverDiceValue);
                      });
                 } else {
                      diceValueDisplay.textContent = serverDiceValue;
                      addLog(visualColor, serverDiceValue);
                 }
                 diceValue = serverDiceValue;
                 visualizeDice(diceValue);
             }
        } else {
             // Se não há dado ou estamos na fase 'roll'
             if (!data.dice || data.step === 'roll') {
                 diceValue = 0;
             }
        }

        // --- ESTADO DO JOGADOR ---
        if (isMyTurn) {
            turnPlayerDisplay.textContent = "EU";
            turnIndicator.className = 'blue';
            dicePanel.style.opacity = "1";
            dicePanel.style.pointerEvents = "auto";

            if (data.step === 'roll' && diceValue > 0) {
                diceValue = 0;
                if(diceValueDisplay) diceValueDisplay.textContent = "-";
                if(diceMessage) diceMessage.textContent = "Jogue Novamente!";
            }
            // Se já tenho dado, ver se tenho movimentos
            if (diceValue > 0) {
                setTimeout(() => {
                    const currentState = window.buildStateFromDOM();
                    // Em local, eu sou sempre '2' (Blue) visualmente devido à renderização espelhada
                    const possibleMoves = window.legalMovesForDice(currentState, 2, diceValue);

                    if (possibleMoves.length === 0) {
                        diceMessage.textContent = "Sem jogadas...";
                        showMessage(`Dado: ${diceValue}. Sem movimentos! A passar...`, 'error');
                        setTimeout(() => {
                            if (window.playerTurn === 'blue' && diceValue > 0) {
                                serverPass();
                                resetDiceUI();
                            }
                        }, 2000);
                    } else {
                        diceMessage.textContent = "Selecione uma peça.";
                        showMessage(`Dado: ${diceValue}. Mova uma peça!`, 'info');
                    }
                }, 200);
            } else {
                if(diceValueDisplay.textContent !== "-") diceValueDisplay.textContent = "-";
                diceMessage.textContent = "Clique para lançar";
                showMessage("Sua vez! Lance o dado.", 'info');
            }
        } else {
            // --- ESTADO DO ADVERSÁRIO ---
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

// --- RENDERIZAÇÃO INTELIGENTE (SERVER -> VISUAL) ---
function renderServerPiecesWithMirror(serverPieces) {
    const squares = document.querySelectorAll('.square');
    squares.forEach(sq => sq.innerHTML = '');

    window.matrix = [];
    for(let r=0; r<window.NUM_ROWS; r++) {
        window.matrix[r] = [];
        for(let c=0; c<window.BOARD_SIZE; c++) window.matrix[r][c] = 0;
    }

    const myColor = myServerColor ? myServerColor.toLowerCase() : 'blue';

    // O Blue já está na linha 3 (fundo) no servidor, por isso fica no sítio certo.
    // O Red está na linha 0 (topo) no servidor, por isso precisa de rodar para o fundo.
    let rotateBoard = (myColor === 'red');

    serverPieces.forEach((cell, serverIndex) => {
        if (!cell) return;

        const r_server = Math.floor(serverIndex / window.BOARD_SIZE);
        const c_server = serverIndex % window.BOARD_SIZE;

        let r_visual = r_server;
        let c_visual = c_server;

        // 1. Rotação Vertical
        if (rotateBoard) {
            r_visual = (window.NUM_ROWS - 1) - r_server;
        }

        // 2. Zig-Zag (Depende da linha VISUAL)
        if (r_visual === 0 || r_visual === 2) {
            c_visual = (window.BOARD_SIZE - 1) - c_server;
        } else {
            c_visual = c_server;
        }

        const visualIndex = r_visual * window.BOARD_SIZE + c_visual;
        if (visualIndex < 0 || visualIndex >= squares.length) return;

        const rawColor = cell.color ? cell.color.toLowerCase() : 'blue';

        // Mantém a tua cor sempre como "Azul" visualmente, e o inimigo "Vermelho"
        let visualColor = rawColor;
        if (myColor === 'red') {
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
            window.matrix[r_visual][c_visual] = 2; // 2 = Eu
        } else {
            p.className = 'piece_red';
            window.matrix[r_visual][c_visual] = 1; // 1 = Inimigo
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

// --- ENVIO DE MOVIMENTO (VISUAL -> SERVER) ---
async function serverMove(row, col) {
    const myColor = myServerColor ? myServerColor.toLowerCase() : 'blue';

    // 1. Inverter Rotação Vertical
    // Temos de fazer o inverso exato de renderServerPiecesWithMirror
    let r_server = row;
    if (myColor === 'red') {
        r_server = (window.NUM_ROWS - 1) - row;
    }

    // 2. Inverter Zig-Zag
    // O zig-zag depende da linha visual ou da linha servidor?
    // Na renderização: if (r_visual === 0 || r_visual === 2) inverte.
    // Logo, aqui usamos a linha VISUAL (row) para decidir.
    let c_server = col;
    if (row === 0 || row === 2) {
        c_server = (window.BOARD_SIZE - 1) - col;
    }

    const moveIndex = (r_server * window.BOARD_SIZE) + c_server;
    console.log(`Sending Move -> Visual [${row},${col}] | Server [${r_server},${c_server}] (Index: ${moveIndex})`);

    const result = await apiRequest('notify', {
        nick: userNick,
        password: userPass,
        game: gameId,
        cell: moveIndex
    });

    if (result && !result.error) {
        diceMessage.textContent = "A processar...";
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
    if (!window.isPvP && !USE_LOCAL_SERVER) {
        if(window.updateLocalScoresDisplay) window.updateLocalScoresDisplay();
        return;
    }
    const result = await apiRequest('ranking', { group: GROUP_ID, size: window.BOARD_SIZE || 9 });
    console.log("Ranking Result:", result);
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
            sq.dataset.row = r;
            sq.dataset.col = c;
            if (c === window.BOARD_SIZE - 1) sq.dataset.lastCol = 'true';
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

    if (diceValue === 0) return;
    if (!window.isPvP && window.playerTurn !== 'blue') return;

    // Tentar encontrar peça na casa clicada (para selecionar)
    const piece = sq.querySelector('.piece_blue');

    if (piece) {
        // --- SELEÇÃO DE PEÇA ---
        clearHighlights();
        sq.classList.add('highlight-blue');

        // highlightMove calcula destinos possíveis (Atacar, Recuar, Normal)
        const target = await highlightMove(r, c, diceValue, piece, sq, 'blue');

        if (target instanceof HTMLElement) {
            // O jogador clicou num destino válido!

            // 1. Lógica PvP (Onde estava o problema)
            if (window.isPvP) {
                // Passo A: Informar o servidor da PEÇA de origem
                // Isto coloca o jogo em step: "to"
                console.log(`PVP Step 1: Selecionar Peça [${r},${c}]`);
                await serverMove(r, c);

                // Passo B: Informar o servidor do DESTINO
                const destR = parseInt(target.dataset.row);
                const destC = parseInt(target.dataset.col);
                console.log(`PVP Step 2: Mover para Destino [${destR},${destC}]`);
                await serverMove(destR, destC);

                clearHighlights();
                sq.classList.remove('selected');
            } else {
                // 2. Lógica Local (PvC)
                if (target.dataset.moveChoice) {
                    sq.dataset.moveChoice = target.dataset.moveChoice;
                }
                const res = await move(r, c, diceValue, piece, sq);
                sq.removeAttribute('data-moveChoice');

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
    for(let i=0; i<4; i++) { if(Math.random()>=0.5) tab++; }
    diceValue = (tab===0)?6:tab;
    diceValueDisplay.textContent = "-";
    diceMessage.textContent = "Selecione peça.";
    if (window.animateDiceRoll) {
        window.animateDiceRoll(diceValue, () => {
            showMessage(`Dado: ${diceValue}.`);
            diceValueDisplay.textContent = diceValue;
            addLog('blue', diceValue);
        });
    } else {
        showMessage(`Dado: ${diceValue}.`);
        diceValueDisplay.textContent = diceValue;
        addLog('blue', diceValue);
    }
    return diceValue;
}
function visualizeDice(val) {
    let claros = (val === 6) ? 0 : val;
    if (window.visualizeDiceValue) window.visualizeDiceValue(claros);
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
    if (window.visualizeDiceValue) window.visualizeDiceValue(0);
    if(!window.isPvP) updateTurnIndicatorLocal();
}

function addLog(color, val) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="log-ball ${color}"></span> <span class="log-number ${color}">${val}</span>`;
    if(diceLogList) diceLogList.prepend(li);
}
function clearLog() { if(diceLogList) diceLogList.innerHTML=''; }
function toggleModal(m, s) { if(s) { m.classList.add('instrucoes-visiveis'); overlay.classList.add('ativo'); } else { m.classList.remove('instrucoes-visiveis', 'classificacoes-visiveis'); overlay.classList.remove('ativo'); } }
function clearHighlights() {
    document.querySelectorAll('.square').forEach(s => {
        s.classList.remove('selected','highlight-blue','highlight-red','highlight-capture','highlight-blocked');
    });
}
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
});
if(btnVoltarMenu) btnVoltarMenu.addEventListener('click', () => { if(eventSource) eventSource.close(); configPanel.classList.add('oculto'); loginPage.classList.remove('oculto'); sessionStorage.removeItem('currentUserNick'); loginForm.reset(); });
if(btnVoltarInicio) btnVoltarInicio.addEventListener('click', () => location.reload());
if(btnJogarNovamente) btnJogarNovamente.addEventListener('click', () => { if(eventSource) eventSource.close(); endGameMenu.classList.add('oculto'); overlay.classList.remove('ativo'); gamePage.classList.add('oculto'); configPanel.classList.remove('oculto'); });

// --- LÓGICA LOCAL DE MOVIMENTO (COMPARTILHADA NO HIGHLIGHT) ---
async function move(row, col, diceValue, pieceElement, originalSq, aiMoveChoice=null) {
    let r = parseInt(row); let c = parseInt(col); let first_move_used = false;
    if(pieceElement.getAttribute('data-first-move') === 'true') {
        if(diceValue === 1) { first_move_used = true; }
        else { showMessage("1º movimento requer Tâb (1).", 'error'); return (diceValue===4||diceValue===6) ? 'reroll_only' : 'fail'; }
    }
    // Simular caminho
    for(let k=0; k<diceValue; k++) {
        let dir = 0; if(r === 1 || r === 3) dir = 1; else if(r === 0 || r === 2) dir = -1;
        c += dir;
        if(c < 0 || c >= window.BOARD_SIZE) {
            // Lógica de viragem de borda
            const isBlue = pieceElement.classList.contains('piece_blue');
            if (isBlue) {
                if(r===3) { r=2; c=window.BOARD_SIZE-1; } else if(r===2) { r=1; c=0; } else if(r===1) {
                    // SPLIT: Attack vs Retreat
                    let choice = originalSq.dataset.moveChoice || aiMoveChoice || 'retreat';
                    if(choice === 'attack') { r=0; c=window.BOARD_SIZE-1; pieceElement.setAttribute('data-visited-enemy', 'true'); } else { r=2; c=window.BOARD_SIZE-1; }
                } else if(r===0) { r=1; c=0; }
            } else {
                if(r===0) { r=1; c=0; } else if(r===1) { r=2; c=window.BOARD_SIZE-1; } else if(r===2) {
                    let choice = aiMoveChoice || (pieceElement.getAttribute('data-visited-enemy')==='true'?'retreat':'attack');
                    if(choice === 'attack') { r=3; c=0; pieceElement.setAttribute('data-visited-enemy', 'true'); } else { r=1; c=0; }
                } else if(r===3) { r=2; c=window.BOARD_SIZE-1; }
            }
        }
    }
    const targetSq = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
    if(!targetSq) return 'fail';

    if(window.matrix[r][c] !== 0) {
         const content = window.matrix[r][c];
         const isBlue = pieceElement.classList.contains('piece_blue');
         const isSelf = (isBlue && content === 2) || (!isBlue && content === 1);
         if(isSelf) { showMessage("Bloqueado por peça própria.", 'error'); if(first_move_used) pieceElement.setAttribute('data-first-move', 'true'); return 'fail'; }
         showMessage("Peça capturada!", 'info'); targetSq.innerHTML = '';
    }

    targetSq.appendChild(pieceElement);
    const pVal = pieceElement.classList.contains('piece_blue') ? 2 : 1;
    window.matrix[r][c] = pVal;
    window.matrix[row][col] = 0;
    if(first_move_used) { pieceElement.setAttribute('data-first-move', 'false'); }

    if(checkWinConditionLocal()) return 'success_win';
    return 'success';
}

async function highlightMove(row, col, diceValue, piece, sq, color='blue') {
    let r=parseInt(row), c=parseInt(col);

    const isBluePiece = piece.classList.contains('piece_blue');
    const myHomeRow = isBluePiece ? 3 : 0; // Linha 3 é casa do Azul
    const enemyHomeRow = isBluePiece ? 0 : 3; // Linha 0 é casa do Vermelho (base inimiga para o Azul)
    const myPieceVal = isBluePiece ? 2 : 1; // 2 na matrix é Azul

    // Se a peça que queremos mexer está na base inimiga
    if (r === enemyHomeRow) {
        // Verificar se ainda temos peças na NOSSA casa
        let friendsInHome = 0;
        for (let i = 0; i < window.BOARD_SIZE; i++) {
            if (window.matrix[myHomeRow][i] === myPieceVal) {
                friendsInHome++;
            }
        }

        // Se ainda houver peças em casa, esta peça invasora está bloqueada
        if (friendsInHome > 0) {
            showMessage("Peça bloqueada! Tem de tirar as peças da sua base primeiro.", 'error');
            return 'fail';
        }
    }

    if(piece.getAttribute('data-first-move') === 'true') {
        if(diceValue!==1) { showMessage("Requer 1 (Tâb).", 'error'); return (diceValue===4||diceValue===6)?'reroll_only':'fail'; }
    }
    let splitPath = false;
    let remaining = diceValue;
    for(let k=0; k<diceValue; k++) {
        let dir=0; if(r===1||r===3) dir=1; else if(r===0||r===2) dir=-1;
        let nextC = c + dir;
        if(nextC<0 || nextC>=window.BOARD_SIZE) {
            if(r===3) { r=2; c=window.BOARD_SIZE-1; } else if(r===2) { r=1; c=0; } else if(r===1) {
                remaining = diceValue - (k+1); splitPath = true; break;
            } else if(r===0) { r=1; c=0; }
        } else { c = nextC; }
    }

    let targets = [];
    if(splitPath) {
        let finalCol = (window.BOARD_SIZE-1) - remaining;
        if(finalCol >= 0) {
             const visited = piece.getAttribute('data-visited-enemy')==='true';
             // OPÇÃO ATAQUE (Linha 0)
             if(!visited) targets.push({r:0, c:finalCol, type:'attack'});
             // OPÇÃO RECUO (Linha 2)
             targets.push({r:2, c:finalCol, type:'retreat'});
        }
    } else {
        targets.push({r:r, c:c, type:'normal'});
    }

    let validDest = [];
    for(let t of targets) {
        const tSq = document.querySelector(`.square[data-row='${t.r}'][data-col='${t.c}']`);
        if(tSq) {
             const cont = window.matrix[t.r][t.c];
             // Validação para não comer a própria peça
             const isAlly = (color==='blue' && cont===2) || (color==='red' && cont===1);

             if(t.r===parseInt(row) && t.c===parseInt(col)) continue;

             if(isAlly) {
                 tSq.classList.add('highlight-blocked');
             } else {
                 if(cont!==0) tSq.classList.add('highlight-capture');
                 else highlight(tSq, color);
                 // Guardamos aqui o 'type' (attack/retreat) para usar no clique
                 validDest.push({sq:tSq, r:t.r, c:t.c, choice:t.type});
             }
        }
    }

    if(validDest.length===0) { showMessage("Movimento bloqueado.", 'error'); await waitForClickAnywhere(); clearHighlights(); return 'fail'; }
    const sel = await waitForClickOnValidSquares(validDest, sq);
    clearHighlights();
    // Retornamos o quadrado com a "escolha" embutida
    if(sel) { sel.sq.dataset.moveChoice = sel.choice; return sel.sq; }
    return 'cancel';
}

function waitForClickOnValidSquares(dests, origin) {
    return new Promise(r => {
        const ctrls = [];
        const success = (e, d) => { e.stopPropagation(); cl(); r(d); };
        const fail = (e) => {
            if(origin.contains(e.target) || !dests.some(d=>d.sq.contains(e.target))) { cl(); r(null); }
        };
        function cl() { dests.forEach((d,i) => d.sq.removeEventListener('click', ctrls[i])); document.removeEventListener('click', fail, true); }
        dests.forEach(d => { const l=(e)=>success(e,d); ctrls.push(l); d.sq.addEventListener('click', l); });
        setTimeout(() => document.addEventListener('click', fail, true), 50);
    });
}

function waitForClickAnywhere() {
    return new Promise(r => {
        const h = () => { document.removeEventListener('click', h, true); r(); };
        setTimeout(() => document.addEventListener('click', h, true), 50);
    });
}

function checkWinConditionLocal() {
    const r = document.querySelectorAll('.piece_red').length;
    const b = document.querySelectorAll('.piece_blue').length;
    
    // Segurança: se o tabuleiro estiver vazio a meio de um update, ignorar
    if (r === 0 && b === 0) return false;

    if(r===0) { showEndGameMenu('blue'); return true; }
    if(b===0) { showEndGameMenu('red'); return true; }
    return false;
}

function showEndGameMenu(winner) {
    endGameMessage.textContent = (winner==='blue') ? "GANHOU!" : "PERDEU!";
    endGameMenu.classList.remove('oculto');
    overlay.classList.add('ativo');
    if (!window.isPvP && userNick) {
        const playerWon = (winner === 'blue');
        if(window.recordLocalGameResult) window.recordLocalGameResult(userNick, playerWon);
    }
    if(window.isPvP) updateRankingTables();
}

function passarVezAoPC() {
    window.playerTurn = 'red';
    updateTurnIndicatorLocal();
    if(window.handleAITurn) window.handleAITurn(0);
}

// Expor funções globais
window.addLog = addLog;
window.move = move;
window.showMessage = showMessage;
window.resetDiceUI = resetDiceUI;