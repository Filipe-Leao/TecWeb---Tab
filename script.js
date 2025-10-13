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
        diceValue = 0;
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

