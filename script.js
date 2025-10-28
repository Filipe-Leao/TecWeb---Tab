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

const numSquares = 12;
const maxPieces = 12;
const numLines = 4;
let selectedPiece = null;
let diceValue = 0;
let playerTurn = 'red';
let matrix = null;

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
    matrix = new Array(numLines);
    for (let i = 0; i < numLines; i++) {
        matrix[i] = new Array(numSquares)
        for (let j = 0; j < numSquares; j++) {
            matrix[i][j] = 0;
            const square = document.createElement('div');
            square.classList.add('square');
            square.dataset.index = j;
            square.dataset.row = i;
            square.dataset.col = j;
            if (j < maxPieces && i == numLines - 1) {
                const piece = document.createElement('div');
                piece.dataset.top_column = false;
                piece.dataset.first_move = true;
                piece.classList.add('piece_blue');
                matrix[i][j] = 2;
                square.appendChild(piece);
            }
            else if ((j > numSquares - 1 - maxPieces) && (i == 0)) {
                const piece = document.createElement('div');
                piece.dataset.top_column = false;
                piece.dataset.first_move = true;
                piece.classList.add('piece_red');
                matrix[i][j] = 1;
                square.appendChild(piece);
            }
            square.addEventListener('click', handleClick);
            board.appendChild(square);
        }
    }
    // Atualiza o indicador de turno no início
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

    //
    for (let k = 0; k < diceValue; k++) {
        if (pieceElement.dataset.first_move === 'true') {
            pieceElement.dataset.first_move = 'false';
            if (targetRow === 0 && targetCol === numSquares - 1) {
                targetCol -= 1;
            }
        }
        if (targetRow === 1 || targetRow === 3) {
            direction = 1;
        } else if (targetRow === 0 || targetRow === 2) {
            direction = -1;
        }
        targetCol += direction;
        if (targetCol < 0 || targetCol >= numSquares) {
            if (targetRow === 0) {
                targetRow = 1;
                targetCol = 0;
            } else if (targetRow === 1) {
                let moveChoice = 'down';
                if (pieceElement.dataset.top_column === 'false' && targetCol >= numSquares) {
                    moveChoice = await askDirection();
                }
                if (moveChoice === 'up' && pieceElement.dataset.top_column === 'false') {
                    pieceElement.dataset.top_column = 'true';
                    targetRow = 0;
                    targetCol = numSquares - 1;
                } else {
                    targetRow = 2;
                    targetCol = numSquares - 1;
                }
            } else if (targetRow === 2) {
                targetRow = 1;
                targetCol = 0;
            } else if (targetRow === 3) {
                targetRow = 2;
                targetCol = 0;
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
        originalSquareElement.style.backgroundColor = '#eee';
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

// Função para lidar com o turno do PC
function handleAITurn() {
    playerTurn = 'blue';
    updateTurnIndicator();
    showMessage("É a vez do computador... o 'Azul' está a pensar...");

    // Simula um atraso de 1.5 segundos
    setTimeout(() => {
        // O PC não faz nada, apenas passa a vez.
        // (No futuro, colocar a lógica da IA aqui)

        showMessage("O computador 'Azul' jogou. É a sua vez.");
        playerTurn = 'red';
        resetDiceUI(); // Prepara o dado para o jogador 'red'
    }, 1500); // 1500ms = 1.5 segundos
}

// Funções de destaque
function highlight(square) {
    clearHighlights();
    square.style.backgroundColor = '#ffc';
}

function clearHighlights() {
    document.querySelectorAll('.square').forEach(sq => {
        sq.style.backgroundColor = '#eee';
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

// Inicia o jogo
createBoard();