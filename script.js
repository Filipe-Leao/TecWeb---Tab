// Variável global para o tamanho do tabuleiro
let BOARD_SIZE = 9; // Padrão (número de colunas)
const NUM_ROWS = 4; // Número fixo de linhas

// Login
const loginForm = document.getElementById('loginForm');
const loginPage = document.getElementById('loginPage');
const gamePage = document.getElementById('gamePage');
const configPanel = document.getElementById('configPanel');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username && password) {
        sessionStorage.setItem('username', username);
        loginPage.classList.add('oculto');
        configPanel.classList.remove('oculto'); // Mostra painel de configurações
    } else {
        alert('Por favor, preencha todos os campos.');
    }
});

// Configurações do Jogo
const btnStartGame = document.getElementById('btnStartGame');
const gameModeSelect = document.getElementById('gameMode');
const aiLevelOption = document.getElementById('aiLevelOption');

// Botões do Menu de Fim de Jogo
const btnDesistir = document.getElementById('btnDesistir');
const endGameMenu = document.getElementById('endGameMenu');
const endGameMessage = document.getElementById('endGameMessage');
const btnVoltarInicio = document.getElementById('btnVoltarInicio');
const btnJogarNovamente = document.getElementById('btnJogarNovamente');

// Mostrar/ocultar opção de nível da IA conforme o modo de jogo
gameModeSelect.addEventListener('change', () => {
    if (gameModeSelect.value === 'player') {
        aiLevelOption.style.display = 'none';
    } else {
        aiLevelOption.style.display = 'block';
    }
});

btnStartGame.addEventListener('click', () => {
    // Obter configurações escolhidas
    const boardSize = parseInt(document.getElementById('boardSize').value);
    const gameMode = document.getElementById('gameMode').value;
    const firstPlayer = document.getElementById('firstPlayer').value;
    const aiLevel = document.getElementById('aiLevel').value;

    // Atualizar tamanho do tabuleiro (número de colunas)
    BOARD_SIZE = boardSize;

    // Guardar configurações
    sessionStorage.setItem('boardSize', boardSize);
    sessionStorage.setItem('gameMode', gameMode);
    sessionStorage.setItem('firstPlayer', firstPlayer);
    sessionStorage.setItem('aiLevel', aiLevel);

    // Definir o jogador inicial
    playerTurn = firstPlayer;

    // Ocultar painel de configurações e mostrar página do jogo
    configPanel.classList.add('oculto');
    gamePage.classList.remove('oculto');

    // Criar o tabuleiro com as configurações
    createBoard();

    // Se o computador começa, iniciar o turno dele
    if (firstPlayer === 'blue') {
        updateTurnIndicator();
        showMessage("O computador (Azul) começa o jogo...");
        setTimeout(() => {
            handleAITurn();
        }, 1000);
    } else {
        updateTurnIndicator();
        showMessage("Você (Vermelho) começa! Clique no dado para lançar.");
    }
});

// Overlay
const overlay = document.getElementById('overlay');

// Instruções
const btnInstrucoes = document.getElementById('btnInstrucoes');
const instrucoes = document.getElementById('instrucoes');
const btnFecharInstrucoes = document.getElementById('btnFecharInstrucoes');

btnInstrucoes.addEventListener('click', () => {
    instrucoes.classList.add('instrucoes-visiveis');
    overlay.classList.add('ativo');
});

btnFecharInstrucoes.addEventListener('click', () => {
    instrucoes.classList.remove('instrucoes-visiveis');
    overlay.classList.remove('ativo');
});

// Classificações
const btnClassificacoes = document.getElementById('btnClassificacoes');
const classificacoes = document.getElementById('classificacoes');
const btnFecharClassificacoes = document.getElementById('btnFecharClassificacoes');

btnClassificacoes.addEventListener('click', () => {
    classificacoes.classList.add('classificacoes-visiveis');
    overlay.classList.add('ativo');
});

btnFecharClassificacoes.addEventListener('click', () => {
    classificacoes.classList.remove('classificacoes-visiveis');
    overlay.classList.remove('ativo');
});

// Instruções na página do jogo
const btnInstrucoesJogo = document.getElementById('btnInstrucoesJogo');
const instrucoesJogo = document.getElementById('instrucoesJogo');
const btnFecharInstrucoesJogo = document.getElementById('btnFecharInstrucoesJogo');

btnInstrucoesJogo.addEventListener('click', () => {
    instrucoesJogo.classList.add('instrucoes-visiveis');
    overlay.classList.add('ativo');
});

btnFecharInstrucoesJogo.addEventListener('click', () => {
    instrucoesJogo.classList.remove('instrucoes-visiveis');
    overlay.classList.remove('ativo');
});

// Classificações na página do jogo
const btnClassificacoesJogo = document.getElementById('btnClassificacoesJogo');
const classificacoesJogo = document.getElementById('classificacoesJogo');
const btnFecharClassificacoesJogo = document.getElementById('btnFecharClassificacoesJogo');

btnClassificacoesJogo.addEventListener('click', () => {
    classificacoesJogo.classList.add('classificacoes-visiveis');
    overlay.classList.add('ativo');
});

btnFecharClassificacoesJogo.addEventListener('click', () => {
    classificacoesJogo.classList.remove('classificacoes-visiveis');
    overlay.classList.remove('ativo');
});

// --- Bloco de Listeners do Fim de Jogo (agora num só sítio) ---

btnDesistir.addEventListener('click', () => {
    showEndGameMenu('blue'); // Azul (PC) ganha se Vermelho (jogador) desistir
});

// Voltar à página inicial
btnVoltarInicio.addEventListener('click', () => {
    endGameMenu.classList.add('oculto');
    gamePage.classList.add('oculto');
    loginPage.classList.remove('oculto');
    overlay.classList.remove('ativo');

    sessionStorage.clear();
    loginForm.reset();
});

// Jogar novamente
btnJogarNovamente.addEventListener('click', () => {
    endGameMenu.classList.add('oculto');
    gamePage.classList.add('oculto');
    configPanel.classList.remove('oculto');
    overlay.classList.remove('ativo');

    // Resetar variáveis do jogo
    selectedPiece = null;
    diceValue = 0;
    playerTurn = 'red';
    matrix = null;
    pieces = []; // ADICIONE ESTA LINHA

    resetDiceUI();
});

// --- Fim do Bloco de Listeners duplicados ---

// --- Variáveis Globais do Jogo ---
const board = document.getElementById('board');
const moveSelector = document.getElementById('moveSelector');
const moveUpBtn = document.getElementById('move_up');
const moveDownBtn = document.getElementById('move_down');

const dicePanel = document.getElementById('dice-panel');
const diceSticks = document.querySelectorAll('#dice-sticks .stick');
const diceValueDisplay = document.getElementById('dice-value-display');
const diceMessage = document.getElementById('dice-message');

const messageBar = document.getElementById('message-bar');
const turnIndicator = document.getElementById('turn-indicator');
const turnPlayerDisplay = document.getElementById('turn-player-display');

const maxPieces = 12;
let selectedPiece = null;
let diceValue = 0;
let playerTurn = 'red';
let matrix = null;
let pieces = []; // Esta linha já estava aqui, a de cima era duplicada
let red_can_move = false;
let blue_can_move = false;

// Variável de controlo para a Promise do askDirection
let resolveAskDirection = null;

// Função para mostrar mensagens ao jogador
function showMessage(message, type = 'info') {
    messageBar.textContent = message;
    messageBar.className = type;
}

// Função para atualizar o indicador de turno
function updateTurnIndicator() {
    if (playerTurn === 'red') {
        turnPlayerDisplay.textContent = 'Vermelho';
        turnIndicator.className = 'red';
    } else {
        turnPlayerDisplay.textContent = 'Azul (PC)';
        turnIndicator.className = 'blue';
    }
}


// Função de criar o tabuleiro
function createBoard() {
    const board = document.getElementById('board');
    board.innerHTML = ''; // Limpa o tabuleiro

    // Atualiza o CSS grid com o novo tamanho (BOARD_SIZE colunas)
    board.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 50px)`;

    // Total de casas = BOARD_SIZE colunas * 4 linhas
    const totalSquares = BOARD_SIZE * NUM_ROWS;

    // Inicializa a matriz
    matrix = [];
    for (let row = 0; row < NUM_ROWS; row++) {
        matrix[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            matrix[row][col] = 0;
        }
    }

    // Inicializa o array de peças
    pieces = [];

    let squareIndex = 0;
    for (let row = 0; row < NUM_ROWS; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            // ... (criação do square) ...
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.row = row;
            square.dataset.col = col;
            if (col === BOARD_SIZE - 1) {
                square.dataset.lastCol = 'true';
            }

            // ADAPTADO: Posiciona peças em TODAS as casas das linhas 0 e 3
            if (row === 0) { // Linha 0 (Vermelho)
                const piece = document.createElement('div');
                piece.className = 'piece_red';
                piece.dataset.first_move = 'true';
                piece.dataset.top_column = 'false';
                square.appendChild(piece);
                matrix[row][col] = 1;
                square.addEventListener('click', handleClick);
            }
            else if (row === NUM_ROWS - 1) { // Linha 3 (Azul)
                const piece = document.createElement('div');
                piece.className = 'piece_blue';
                piece.dataset.first_move = 'true';
                piece.dataset.top_column = 'false';
                square.appendChild(piece);
                matrix[row][col] = 2;
                square.addEventListener('click', handleClick);
            }
            else {
                square.addEventListener('click', handleClick);
            }
            board.appendChild(square);
        }
    }
    updateTurnIndicator();
}

// Função para lançar dado
function rollDice() {
    let tab = 0;
    for (let i = 0; i < 4; i++){
        let prob = Math.random();
        if (prob >= 0.50){
            tab++;
            diceSticks[i].className = 'stick claro';
        } else {
            diceSticks[i].className = 'stick escuro';
        }
    }

    if (tab === 0){
        diceValue = 6;
    }
    else{
        diceValue = tab;
    }

    diceValueDisplay.textContent = diceValue;
    diceMessage.textContent = `Selecione uma peça para mover.`;
    showMessage(`Dado lançado: ${diceValue}! Selecione uma peça.`);

    return diceValue;
}

// Função para lidar com o clique no painel do dado
async function handleDiceRoll() {
    if (diceValue !== 0) {
        showMessage("Já lançou o dado. Mova uma peça!", 'error');
        return;
    }
    if (playerTurn !== 'red') {
        showMessage("É a vez do computador!", 'error');
        return;
    }
    rollDice();

    if (!red_can_move  && diceValue !== 1 && playerTurn === 'red') {
        showMessage("A peça vermelha não pode se mover neste turno.", 'error');
        if (diceValue !== 1 && diceValue !== 4 && diceValue !== 6) {
            showMessage("A passar a vez ao computador...", 'error');
            await new Promise(resolve => setTimeout(resolve, 1500));
            handleAITurn();
        } else {
            showMessage("Rode novamente o dado! Clique no dado.");
            showMessage("A passar a vez ao computador...", 'error');
            await new Promise(resolve => setTimeout(resolve, 1500));
            resetDiceUI();
        }

        return;
    }
    else {
        red_can_move = true;
    }

    if (!blue_can_move  && diceValue !== 1 && playerTurn === 'blue') {
        showMessage("A peça azul não pode se mover neste turno.", 'error');
        if (diceValue !== 1 && diceValue !== 4 && diceValue !== 6) {
            showMessage("A passar a vez ao jogador...", 'error');
        } else {
            showMessage("Rode novamente o dado! Clique no dado.");
            handleAITurn();
        }

        return;
    }
    else {
        blue_can_move = true;
    }
}

// Função 'move' retorna 3 estados: 'success', 'reroll_only', 'fail'
async function move(row, col, diceValue, can_go_up, pieceElement, originalSquareElement, aiMoveChoice = null) { // Adicionado aiMoveChoice
    let targetRow = parseInt(row);
    let targetCol = parseInt(col);

    console.log("Initial position:", targetRow, targetCol, pieceElement);
    let direction = 0;

    if (pieceElement.dataset.first_move === 'true' && diceValue === 1) {
        pieceElement.dataset.first_move = 'false';
    }
    else if (pieceElement.dataset.first_move === 'true') {
        showMessage("No primeiro movimento, só se pode mover 1 casa.", 'error');
        if (diceValue === 4 || diceValue === 6){
            return 'reroll_only';
        }
        return 'fail';
    }

    // Loop de movimento
    for (let k = 0; k < diceValue; k++) {
        if (pieceElement.dataset.first_move === 'true') {
            pieceElement.dataset.first_move = 'false';
            if (targetRow === 0 && targetCol === BOARD_SIZE - 1) { // MUDADO
                targetCol -= 1;
            }
        }
        if (targetRow === 1 || targetRow === 3) {
            direction = 1;
        } else if (targetRow === 0 || targetRow === 2) {
            direction = -1;
        }
        targetCol += direction;

        // --- CORREÇÃO DE SINTAXE AQUI ---
        if (targetCol < 0 || targetCol >= BOARD_SIZE) { // MUDADO
            if (targetRow === 0) {
                targetRow = 1;
                targetCol = 0;
            } // <-- ESTA CHAVETA '}' ESTAVA EM FALTA
            else if (targetRow === 1) {
                let moveChoice = 'down'; // Padrão
                // Só pergunta se: for 'red' E não tiver subido E estiver no fim
                if (playerTurn === 'red' && pieceElement.dataset.top_column === 'false' && targetCol >= BOARD_SIZE) {
                    moveChoice = await askDirection();
                }
                // Se for 'blue', usa a escolha da IA
                else if (playerTurn === 'blue') {
                    moveChoice = aiMoveChoice; // Será 'up' ou 'down'
                }

                // Aplica a escolha
                if (moveChoice === 'up' && pieceElement.dataset.top_column === 'false') {
                    pieceElement.dataset.top_column = 'true';
                    targetRow = 0;
                    targetCol = BOARD_SIZE - 1;
                } else { // 'down'
                    targetRow = 2;
                    targetCol = BOARD_SIZE - 1;
                }
            }
            // --- Fim da Adaptação ---
            else if (targetRow === 2) {
                targetRow = 1;
                targetCol = 0;
            } else if (targetRow === 3) {
                targetRow = 2;
                targetCol = BOARD_SIZE - 1;
            }
        }
        // --- FIM DA CORREÇÃO DE SINTAXE ---
    }

    const pieceValue = matrix[row][col];
    if (matrix[targetRow][targetCol] === pieceValue) {
        showMessage("Não pode mover, existe uma peça sua na casa de destino.", 'error');
        return 'fail';
    }

    const targetSquare = document.querySelector(`.square[data-row='${targetRow}'][data-col='${targetCol}']`);
    if (!targetSquare) {
        showMessage("Erro: Casa de destino não encontrada no DOM.", 'error');
        return 'fail';
    }

    // --- ADAPTADO: Lógica de Captura e Fim de Jogo ---
    if (matrix[targetRow][targetCol] !== 0) {
        showMessage("Capturou uma peça do seu adversário!", 'info');
        targetSquare.innerHTML = '';

        // Verifica se o jogo acabou
        if (checkWinCondition()) {
            return 'success_win'; // Retorna estado de vitória
        }
    }
    // --- Fim da Adaptação ---

    targetSquare.appendChild(pieceElement);
    matrix[targetRow][targetCol] = pieceValue;
    matrix[row][col] = 0;

    return 'success';
}

// Função para limpar o painel de dados
function resetDiceUI() {
    diceValue = 0;
    diceValueDisplay.textContent = "-";
    diceMessage.textContent = "Clique aqui para lançar";
    diceSticks.forEach(stick => stick.className = 'stick');

    // Garante que o indicador de turno está correto
    updateTurnIndicator();
}

// Função para pedir direção ao jogador
function askDirection(){
    return new Promise((resolve) => {
        moveSelector.classList.remove('oculto'); // Mostra o painel
        overlay.classList.add('ativo');      // Mostra o overlay
        resolveAskDirection = resolve;
    });
}

async function highlightMove(row, col, diceValue, can_go_up, pieceElement, originalSquareElement) {
    let targetRow = parseInt(row);
    let targetCol = parseInt(col);

    console.log("Initial position:", targetRow, targetCol, pieceElement);
    let direction = 0;

    if (pieceElement.dataset.first_move === 'true' && diceValue !== 1) {
        showMessage("No primeiro movimento, só se pode mover 1 casa.", 'error');
        if (diceValue === 4 || diceValue === 6){
            return 'reroll_only';
        }
        return 'fail';
    }

    // Loop de movimento
    for (let k = 0; k < diceValue; k++) {
        if (pieceElement.dataset.first_move === 'true') {
            if (targetRow === 0 && targetCol === BOARD_SIZE - 1) { // MUDADO
                targetCol -= 1;
            }
        }
        if (targetRow === 1 || targetRow === 3) {
            direction = 1;
        } else if (targetRow === 0 || targetRow === 2) {
            direction = -1;
        }
        targetCol += direction;
        if (targetCol < 0 || targetCol >= BOARD_SIZE) { // MUDADO
            if (targetRow === 0) {
                targetRow = 1;
                targetCol = 0;
            } else if (targetRow === 1) {
                let moveChoice = 'down';
                if (pieceElement.dataset.top_column === 'false' && targetCol >= BOARD_SIZE) { // MUDADO
                    moveChoice = await askDirection();
                }
                if (moveChoice === 'up' && pieceElement.dataset.top_column === 'false') {
                    targetRow = 0;
                    targetCol = BOARD_SIZE - 1; // MUDADO
                } else {
                    targetRow = 2;
                    targetCol = BOARD_SIZE - 1; // MUDADO
                }
            } else if (targetRow === 2) {
                targetRow = 1;
                targetCol = 0;
            } else if (targetRow === 3) {
                targetRow = 2;
                targetCol = BOARD_SIZE - 1; // MUDADO
            }
        }
    }

    const targetSquare = document.querySelector(`.square[data-row='${targetRow}'][data-col='${targetCol}']`);
    const currentTarget = document.querySelector(`.square[data-row='${row}'][data-col='${col}']`);


    if (!targetSquare) {
        showMessage("Casa de destino inválida.", "error");
        return 'fail';
    }

    highlight(targetSquare);

    // --- Espera o clique do jogador para confirmar ---
    const confirmation = await waitForClickOnSquare(targetSquare, currentTarget);

    clearHighlights();

    if (!confirmation) {
        showMessage("Movimento cancelado.", "error");
        return 'cancel';
    }

    // Se confirmou, devolve o square para mover
    return targetSquare;
}

function waitForClickOnSquare(squareElement, originalSquareElement) {
    return new Promise((resolve) => {
        let confirmed = false;

        const handleConfirm = (event) => {
            if (squareElement.contains(event.target)) {
                confirmed = true;
                cleanup();
                resolve(true); // Confirmado
            }
        };

        const handleCancel = (event) => {
            if (!squareElement.contains(event.target)) {
                cleanup();
                resolve(false); // Cancelado
            }
        };

        function cleanup() {
            squareElement.removeEventListener("click", handleConfirm);
            document.removeEventListener("click", handleCancel, true);
        }

        // Espera um pequeno atraso antes de ativar o listener global,
        // evitando capturar o mesmo clique que selecionou a peça
        setTimeout(() => {
            squareElement.addEventListener("click", handleConfirm);
            originalSquareElement.addEventListener("click", handleConfirm);
            document.addEventListener("click", handleCancel, true);
        }, 100);
    });
}



// Função para lidar com o clique numa casa
async function handleClick(e) {
    const square = e.currentTarget;

    if (diceValue === 0) {
        showMessage("Clique no painel 'Dado de Paus' para lançar o dado primeiro!", 'error');
        return;
    }

    if (playerTurn !== 'red') {
        showMessage("É a vez do computador, por favor aguarde.", 'error');
        return;
    }

    // ADAPTADO: Limpa destaques da jogada anterior
    clearHighlights();

    const piece = square.querySelector('.piece_red');
    if (piece) {
        // ADAPTADO: Destaque de início
        square.classList.add('selected');

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const can_go_up = true;

        // Passa 'null' como aiMoveChoice

        // ADAPTADO: Destaque de fim
        const sqEnd = piece.parentElement;

        const confirmTarget = await highlightMove(row, col, diceValue, can_go_up, piece, square);

        let moveResult = 'move_not_confirmed';

        // Só permite mover se o jogador confirmou o clique e devolveu uma casa válida
        if (confirmTarget instanceof HTMLElement && confirmTarget.classList.contains('square')) {
            // Jogador confirmou corretamente
            moveResult = await move(row, col, diceValue, can_go_up, piece, square, null);
        } else if (confirmTarget === 'cancel' || confirmTarget === false) {
            showMessage("Movimento cancelado. Selecione outra peça.", "error");
        } else if (confirmTarget === 'reroll_only'){
            showMessage("Joga novamente! Clique no dado.");
            resetDiceUI();
        } else {
            showMessage("Tem de clicar na casa destacada para confirmar o movimento.", "error");
        }


        if (moveResult === 'success' || moveResult === 'success_win') {
            if (sqEnd && sqEnd.classList.contains('square')) {
                sqEnd.classList.add('highlight-end');
            }
        }

        switch (moveResult) {
            case 'success_win':
                // O jogo acabou, o menu já foi mostrado pela checkWinCondition
                break;
            case 'success':
                // clearHighlights(); -> Removido para manter o destaque
                if (diceValue !== 1 && diceValue !== 4 && diceValue !== 6) {
                    showMessage("Movimento bem-sucedido. A passar a vez ao computador...");
                    // ADAPTADO: Chama o handleAITurn correto
                    handleAITurn();
                } else {
                    showMessage("Movimento bem-sucedido! Joga novamente. Clique no dado.");
                    resetDiceUI();
                }
                break;
            case 'reroll_only':
                showMessage("Joga novamente! Clique no dado.");
                resetDiceUI();
                break;
            case 'fail':
                const movedPieces = document.querySelectorAll('.piece_red[data-first_move="false"]');
                if (movedPieces.length === 0) {
                    showMessage("Não tem jogadas válidas. A passar a vez ao computador...", 'error');
                    // ADAPTADO: Chama o handleAITurn correto
                    handleAITurn();
                } else {
                    showMessage("Tente mover outra peça (uma que já não esteja na base).", 'error');
                }
                break;
            case 'move_not_confirmed':
                showMessage("Movimento não confirmado. Selecione outra peça para mover.", 'error');
                break;
        }

    } else {
        if (square.querySelector('.piece_blue')) {
            showMessage("Essa é uma peça do oponente!", 'error');
        } else {
            showMessage("Selecione uma peça vermelha para mover.", 'error');
        }
    }
}

// A função de turno do computador passou a ser fornecida pelo MonteCarlo.js.
function handleAITurn() {
    playerTurn = 'blue';
    updateTurnIndicator();

    // Verifica se a função MonteCarlo existe (do MonteCarlo.js)
    if (typeof window.handleAITurn_MonteCarloRandom === 'function') {
        console.log("A chamar o turno da IA (Monte Carlo)...");
        // A função MonteCarlo trata de si mesma (lançar dado, delays, passar a vez)
        window.handleAITurn_MonteCarloRandom(25, 0); // 25 simulações, 0 = força a IA a lançar o dado
    } else {
        // Fallback (se MonteCarlo.js falhar a carregar)
        console.warn("MonteCarlo.js não encontrado. A usar IA de 'placeholder'.");
        showMessage("É a vez do computador... o 'Azul' está a pensar...");
        setTimeout(() => {
            showMessage("O computador 'Azul' jogou. É a sua vez.");
            playerTurn = 'red';
            resetDiceUI();
        }, 1500);
    }
}

// Funções de destaque
function highlight(square) {
    clearHighlights();
    square.classList.add('highlight-end');
}


function clearHighlights() {
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('selected', 'highlight-start', 'highlight-end', 'highlight-target');
    });
}

moveUpBtn.addEventListener('click', () => {
    if (resolveAskDirection) {
        moveSelector.classList.add('oculto'); // Esconde o painel
        overlay.classList.remove('ativo');    // Esconde o overlay
        resolveAskDirection('up');
        resolveAskDirection = null;
    }
});

moveDownBtn.addEventListener('click', () => {
    if (resolveAskDirection) {
        moveSelector.classList.add('oculto'); // Esconde o painel
        overlay.classList.remove('ativo');    // Esconde o overlay
        resolveAskDirection('down');
        resolveAskDirection = null;
    }
});


// --- Funções de Fim de Jogo (agora num só sítio) ---
function showEndGameMenu(winner) {
    const message = (winner === 'red') ? 'Os Vermelhos Venceram!' : 'Os Azuis Venceram!';
    endGameMessage.textContent = message;
    endGameMenu.classList.remove('oculto');
    overlay.classList.add('ativo'); // Ativa o overlay
}

function checkWinCondition() {
    const redPieces = document.querySelectorAll('#board .piece_red');
    const bluePieces = document.querySelectorAll('#board .piece_blue');

    if (redPieces.length === 0) {
        // Azul venceu
        showEndGameMenu('blue');
        return true;
    }
    if (bluePieces.length === 0) {
        // Vermelho venceu
        showEndGameMenu('red');
        return true;
    }
    return false;
}

// --- Listener final ---
dicePanel.addEventListener('click', handleDiceRoll);