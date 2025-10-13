// Criar tabuleiro
const board = document.getElementById('board');
const numSquares = 12;
const maxPieces = 4;
const numLines = 4;
let selectedPiece = null;
let diceValue = 0; // valor do dado atual
let playerTurn = 'red'; // começa jogador vermelho

// Função de criar o tabuleiro
function createBoard() {
    var matrix = new Array(numLines);
    for (let i = 0; i < numLines; i++) {
        matrix[i] = new Array(numSquares)
        for (let j = 0; j < numSquares; j++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.dataset.index = j;
            square.dataset.row = i;
            square.dataset.col = j;

            // Adiciona peças nas 3 primeiras casas
            if (j < maxPieces && i == numLines - 1) {
                const piece = document.createElement('div');
                piece.classList.add('piece_blue');
                matrix[i][j] = 2;
                square.appendChild(piece);
            }
            else if ((j > numSquares - 1 - maxPieces) && (i == 0)) {
                const piece = document.createElement('div');
                piece.classList.add('piece_red');
                matrix[i][j] = 1;
                square.appendChild(piece);
            }
            square.addEventListener('click', handleClick);
            board.appendChild(square);
        }
    }
}

// Função para lançar dado (0-4)
function rollDice() {
    let tab = 0;
    for (let i = 0; i < 4; i++){
        let prob = Math.random();
        if (prob >= 0.50){
            tab++;
        }
    }
    alert(`tab ${tab}`);
    if (tab === 0){
        diceValue = 6;
    }
    else{
        diceValue = tab;
    }
    return diceValue;
}

// Função principal: possíveis movimentos
/*
function possible_movements(selectedPiece) {
    if (!selectedPiece || diceValue === 0) {
        alert("Deves lançar o dado antes de mover uma peça!");
        return;
    }

    const currentSquare = selectedPiece.parentElement;
    const row = parseInt(currentSquare.dataset.row);
    const col = parseInt(currentSquare.dataset.col);
    const color = selectedPiece.classList.contains('piece_red') ? 'red' : 'blue';

    // Verifica se é a vez certa
    if (color !== playerTurn) {
        alert("Não é a tua vez!");
        return;
    }

    // Verifica se é a primeira jogada dessa peça
    const isStartingRow = (color === 'red' && row === 0) || (color === 'blue' && row === 3);
    if (isStartingRow && !selectedPiece.dataset.moved) {
        if (diceValue !== 1) {
            if (diceValue === 4 || diceValue === 6) {
                alert("Saiu 4 ou 6 — repete o lançamento!");
            } else {
                alert("Só podes sair com 1 (Tâb).");
            }

            diceValue = 0;
            return diceValue;
        }
    }

    // Direção de movimento depende da linha
    // 1ª e 3ª: esquerda -> direita
    // 2ª e 4ª: direita -> esquerda
    let dir = 1;
    if (row === 1 || row === 3) dir = -1;

    let targetRow = row;
    let targetCol = col + dir * diceValue;

    // Se sair do limite, passa para a linha seguinte
    if (targetCol >= numSquares || targetCol < 0) {
        if (row === 0) targetRow = 1;        // 1ª → 2ª
        else if (row === 1) targetRow = 2;   // 2ª → 3ª
        else if (row === 2) targetRow = 3;   // 3ª → 4ª
        else if (row === 3) targetRow = 2;   // 4ª → 3ª

        // Corrigir a coluna após transição
        if (dir === 1) targetCol = targetCol - numSquares;  // saiu pela direita
        else targetCol = numSquares + targetCol;            // saiu pela esquerda
    }

    // Restrições: movimento na 4ª fila
    if (targetRow === 3 && color === 'red') {
        const redHomePieces = document.querySelectorAll('.piece_red').length;
        if (redHomePieces > 0 && document.querySelector('[data-row="0"] .piece_red')) {
            alert("Não podes mover na 4ª fila enquanto houver peças na tua fila inicial!");
            return;
        }
    }

    if (targetRow === 0 && color === 'blue') {
        const blueHomePieces = document.querySelectorAll('.piece_blue').length;
        if (blueHomePieces > 0 && document.querySelector('[data-row="3"] .piece_blue')) {
            alert("Não podes mover na 1ª fila enquanto houver peças na tua fila inicial!");
            return;
        }
    }

    // Verifica casa de destino
    const targetSquare = document.querySelector(
        `[data-row="${targetRow}"][data-col="${targetCol}"]`
    );

    if (!targetSquare) {
        alert("Movimento fora do tabuleiro!");
        return;
    }

    highlight(targetSquare)

    // Se houver peça da mesma cor, movimento inválido
    if (
        (color === 'red' && targetSquare.querySelector('.piece_red')) ||
        (color === 'blue' && targetSquare.querySelector('.piece_blue'))
    ) {
        alert("Casa ocupada por uma peça tua!");
        return;
    }

    // Captura de peça inimiga
    const enemyPiece = targetSquare.querySelector('.piece_red, .piece_blue');
    if (enemyPiece) {
        alert(`${color} capturou uma peça inimiga!`);
        enemyPiece.remove();
    }

    // Movimento
    targetSquare.appendChild(selectedPiece);
    selectedPiece.dataset.moved = "true"; // marca que já se moveu
    diceValue = 0; // reset dado
    clearHighlights();

    // Alternar turno
    playerTurn = playerTurn === 'red' ? 'blue' : 'red';
    alert(`Agora é a vez do jogador ${playerTurn.toUpperCase()}.`);
}
*/

function move(row, col, diceValue){
    return true;

    if (row === 1 || row === 3){
        let direction = -1;
    }
    else if (row === 0 || row === 2){
        let direction = 1;
    }

    let k = 0;
    let targetRow = row;
    let targetCol = col + direction;
    while (k < diceValue){
        if (targetCol < 0 || targetCol >= numSquares){
            if (targetRow === 1 || targetRow === 2){
                let 
            }
        }
    }      
    return true;
}

function handleClick_player_vs_player(e) {
    const square = e.currentTarget;

    // Se ainda não há dado lançado, lança
    if (diceValue === 0) {
        diceValue = rollDice();
        return; // espera o jogador escolher uma peça depois
    }

    if (!selectedPiece){
        let piece = null;
        // Se clicar numa peça
        if (square.querySelector('.piece_red') && playerTurn === 'red'){
            piece = square.querySelector('.piece_red');
        }
        else if (square.querySelector('.piece_blue') && playerTurn === 'blue'){
            piece = square.querySelector('piece_blue');
        }
        else{
            alert(`Player $(playerTurn) must choose $(playerTurn) color pieces`);
            return;;
        }
    
    
        if (piece) {
            selectedPiece = piece;
            highlight(square);
            return;
        }
    } 
    // Se já tiver uma peça selecionada e clicar num quadrado vazio
    else {
        originalSquare = selectedPiece.parentElement;
        let row = originalSquare.dataset.row;
        let col = originalSquare.dataset.col;
        can_move = move(row, col, diceValue);
        if (can_move){
            square.appendChild(selectedPiece);
            selectedPiece = null;
            // se o valor do dado for 1, 4 ou 6 repete o se não é outro jogador
            if (diceValue !== 1 && diceValue !== 4 && diceValue !== 6){
                if (playerTurn === 'red'){
                    playerTurn = 'blue';
                }
                else{
                    playerTurn = 'red';
                }
            }
            diceValue = 0;
            clearHighlights();
        }
    }
}

function handleClick(e) {
    const square = e.currentTarget;
    
    if (diceValue === 0) {
        diceValue = rollDice();
        return; // espera o jogador escolher uma peça depois
    }
    // Se clicar numa peça vermelha
    if (square.querySelector('.piece_red')) {
        selectedPiece = square.querySelector('.piece_red');
        highlight(square);
    }
    
    // Se clicar numa peça azul
    else if (square.querySelector('.piece_blue')) {
        selectedPiece = square.querySelector('.piece_blue');
        highlight(square);
    }
    // Se já tiver uma peça selecionada e clicar noutro quadrado vazio
    else if (selectedPiece) {
        square.appendChild(selectedPiece);
        clearHighlights();
        selectedPiece = null;
    }
}


// Destacar quadrado selecionado
function highlight(square) {
    clearHighlights();
    square.style.backgroundColor = '#ffc';
}

// Limpar destaque
function clearHighlights() {
    document.querySelectorAll('.square').forEach(sq => {
        sq.style.backgroundColor = '#eee';
    });
}



createBoard()

