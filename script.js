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

// Botão de Desistir
const btnDesistir = document.getElementById('btnDesistir');
const endGameMenu = document.getElementById('endGameMenu');
const endGameMessage = document.getElementById('endGameMessage');
const btnVoltarInicio = document.getElementById('btnVoltarInicio');
const btnJogarNovamente = document.getElementById('btnJogarNovamente');

btnDesistir.addEventListener('click', () => {
    // Mostrar mensagem de que os Azuis venceram
    endGameMessage.textContent = 'Os Azuis Venceram!';
    endGameMenu.classList.remove('oculto');
});

// Voltar à página inicial
btnVoltarInicio.addEventListener('click', () => {
    endGameMenu.classList.add('oculto');
    gamePage.classList.add('oculto');
    loginPage.classList.remove('oculto');
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    // Resetar formulário de login
    loginForm.reset();
});

// Jogar novamente
btnJogarNovamente.addEventListener('click', () => {
    endGameMenu.classList.add('oculto');
    gamePage.classList.add('oculto');
    configPanel.classList.remove('oculto');
    
    // Resetar variáveis do jogo
    selectedPiece = null;
    diceValue = 0;
    playerTurn = 'red';
    matrix = null;
    pieces = [];
    
    // Resetar o dado
    resetDiceUI();
});


// Criar tabuleiro
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
let pieces = []; // ADICIONE ESTA LINHA

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
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.row = row;
            square.dataset.col = col;
            
            // Posicionar peças vermelhas na primeira linha (linha 0)
            if (row === 0) {
                const piece = document.createElement('div');
                piece.className = 'piece_red';
                piece.dataset.first_move = 'true';
                piece.dataset.top_column = 'false';
                square.appendChild(piece);
                matrix[row][col] = 1; // 1 representa peça vermelha
                
                // Adicionar evento de clique no square
                square.addEventListener('click', handleClick);
            }
            // Posicionar peças azuis na última linha (linha 3)
            else if (row === NUM_ROWS - 1) {
                const piece = document.createElement('div');
                piece.className = 'piece_blue';
                piece.dataset.first_move = 'true';
                piece.dataset.top_column = 'false';
                square.appendChild(piece);
                matrix[row][col] = 2; // 2 representa peça azul
                
                // Adicionar evento de clique no square
                square.addEventListener('click', handleClick);
            }
            else {
                // Casas vazias também precisam de evento de clique
                square.addEventListener('click', handleClick);
            }
            
            board.appendChild(square);
            squareIndex++;
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
function handleDiceRoll() {
    if (diceValue !== 0) {
        showMessage("Já lançou o dado. Mova uma peça!", 'error');
        return;
    }
    if (playerTurn !== 'red') {
        showMessage("É a vez do computador!", 'error');
        return;
    }
    rollDice();
}

// Função 'move' retorna 3 estados: 'success', 'reroll_only', 'fail'
async function move(row, col, diceValue, can_go_up, pieceElement, originalSquareElement) {
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
                    pieceElement.dataset.top_column = 'true';
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
    if (matrix[targetRow][targetCol] !== 0) {
        showMessage("Capturou uma peça do seu adversário!", 'info');
        targetSquare.innerHTML = '';
    }
    targetSquare.appendChild(pieceElement);
    matrix[targetRow][targetCol] = pieceValue;
    matrix[row][col] = 0;
    if (originalSquareElement) {
        originalSquareElement.style.backgroundColor = 'white'; // MUDADO para manter branco
    }
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
        moveSelector.style.display = 'grid';
        resolveAskDirection = resolve;
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

    const piece = square.querySelector('.piece_red');
    if (piece) {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const can_go_up = true;

        const moveResult = await move(row, col, diceValue, can_go_up, piece, square);

        switch (moveResult) {
            case 'success':
                clearHighlights();
                if (diceValue !== 1 && diceValue !== 4 && diceValue !== 6) {
                    // SUCESSO e PASSA A VEZ
                    showMessage("Movimento bem-sucedido. A passar a vez ao computador...");
                    handleAITurn(); // Chama o turno do PC
                } else {
                    // SUCESSO e JOGA DE NOVO
                    showMessage("Movimento bem-sucedido! Joga novamente. Clique no dado.");
                    resetDiceUI(); // Reseta para o jogador lançar de novo
                }
                break;

            case 'reroll_only':
                // FALHA (1º mov) mas JOGA DE NOVO (dado 4 ou 6)
                showMessage("Joga novamente! Clique no dado.");
                resetDiceUI(); // Reseta para o jogador lançar de novo
                break;

            case 'fail':
                // FALHA e NÃO JOGA DE NOVO (dado 2 ou 3)
                const movedPieces = document.querySelectorAll('.piece_red[data-first_move="false"]');

                if (movedPieces.length === 0) {
                    // Está preso (só peças na base)
                    showMessage("Não tem jogadas válidas. A passar a vez ao computador...", 'error');
                    handleAITurn(); // Chama o turno do PC
                } else {
                    // Não está preso
                    showMessage("Tente mover outra peça (uma que já não esteja na base).", 'error');
                }
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
// Certifica-te que `MonteCarlo.js` está incluído antes deste ficheiro (index.html já atualizado).
// Se por algum motivo MonteCarlo não estiver disponível, podemos fornecer um fallback simples.
function handleAITurn() {
    // Preferir a função de Monte Carlo se disponível (não queremos sobrescrever a definição original).
    if (typeof window.handleAITurn_MonteCarloRandom === 'function') {
        console.log("Usando Monte Carlo para o turno do computador.");
        diceValue = 0;
        console.log("Before ai turn", diceValue)
        // Chama a versão Monte Carlo (ela controla rerolls/turn switching internamente)
        handleDiceRoll();

        console.log("Dice value for AI turn:", diceValue);

        return window.handleAITurn_MonteCarloRandom(25, diceValue);
    }

    // Fallback (comportamento antigo): passa a vez após pequena espera.
    playerTurn = 'blue';
    updateTurnIndicator();
    showMessage("É a vez do computador... o 'Azul' está a pensar...");
    setTimeout(() => {
        showMessage("O computador 'Azul' jogou. É a sua vez.");
        playerTurn = 'red';
        resetDiceUI();
    }, 1500);
}

// Funções de destaque
function highlight(square) {
    clearHighlights();
    square.style.backgroundColor = '#ffc';
}

function clearHighlights() {
    document.querySelectorAll('.square').forEach(sq => {
        sq.style.backgroundColor = 'white'; // MUDADO para manter branco
    });
}

moveUpBtn.addEventListener('click', () => {
    if (resolveAskDirection) {
        moveSelector.style.display = 'none'; // Esconde o seletor
        resolveAskDirection('up');       // Resolve a Promise com 'up'
        resolveAskDirection = null;        // Limpa a variável
    }
});

moveDownBtn.addEventListener('click', () => {
    if (resolveAskDirection) {
        moveSelector.style.display = 'none'; // Esconde o seletor
        resolveAskDirection('down');     // Resolve a Promise com 'down'
        resolveAskDirection = null;      // Limpa a variável
    }
});


dicePanel.addEventListener('click', handleDiceRoll);

