// Criar tabuleiro
const board = document.getElementById('board');
const numSquares = 12;
const maxPieces = 12;
const numLines = 4;
let selectedPiece = null;
let diceValue = 0; // valor do dado atual
let playerTurn = 'red'; // começa jogador vermelho
let matrix = null

// Função de criar o tabuleiro
function createBoard() {
    matrix = new Array(numLines);
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
async function move(row, col, diceValue, can_go_up, square){
    let direction = 0;
    if (row === 1 || row === 3){
        direction = -1;
    }
    else if (row === 0 || row === 2){
        direction = 1;
    }

    let targetRow = row;
    let targetCol = col + direction;
    for (let k = 0; k < diceValue; k++){
        if (targetCol < 0 || targetCol >= numSquares){
            if (targetRow === 0){
                targetRow++; 
                targetCol = numSquares - 1;
                direction = -1;
            }
            else if (targetRow === 1){
                targetRow++;
                targetCol = 0;
                direction = 1;
            }
            else if (targetRow === 2){
                if (can_go_up){
                    const move = await askDirection();
                    if (move === 'up'){
                        targetRow++;
                    }
                    else if (move === 'down'){
                        targetRow--;
                    }
                    else{
                        alert(`Erro na escolha da direção de movimento`);
                    }
                }
                else {
                    targetRow--;
                }
                targetCol = numSquares - 1;
                direction = -1;
            }
            else if (targetRow === 3){
                targetRow--;
                targetCol = 0;
                direction = 1;
            }
        }
        else{
            targetCol += direction;
        }
    }  
    if (matrix[targetRow][targetCol] === matrix[row][col]){
        alert(`Não pode mover esta peça, existe uma peça sua na casa que se iria mover`);
        return false;
    }
    else if (matrix[targetRow][targetCol] === 0){
        matrix[targetRow][targetCol] = matrix[row][col];
        return true;
    }
    else{
        alert(`Capturou uma peça do seu adversário`);
        matrix[targetRow][targetCol] = matrix[row][col];
        return true;
    }
}

function askDirection(){
        return new Promise((resolve) => {
        const container = document.createElement('div');
        container.classList.add('choice-container');

        const upBtn = document.createElement('button');
        upBtn.textContent = "Mover para cima";
        const downBtn = document.createElement('button');
        downBtn.textContent = "Mover para baixo";

        upBtn.addEventListener('click', () => {
            container.remove();
            resolve('up');
        });
        downBtn.addEventListener('click', () => {
            container.remove();
            resolve('down');
        });

        container.appendChild(upBtn);
        container.appendChild(downBtn);
        document.body.appendChild(container);
    });
}

//ideia inicial não necessário para o primeiro trabalho
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


async function handleClick(e) {
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

    else if (square.querySelector('.piece_blue')){
        alert(`escolheste peça de oponente`);
        return;
    }
    /* 
     * Não se utiliza no Player vs PC
     *
    // Se clicar numa peça azul
    else if (square.querySelector('.piece_blue')) {
        selectedPiece = square.querySelector('.piece_blue');
        highlight(square);
    }
    */
    // Se já tiver uma peça selecionada e clicar noutro quadrado vazio
    if (selectedPiece) {
        const originalSquare = selectedPiece.parentElement;
        let row = originalSquare.dataset.row;
        let col = originalSquare.dataset.col;
        const can_move = move(row, col, diceValue, diceValue, true, originalSquare);
        if (can_move === true){
            square.appendChild(selectedPiece);
        }
        clearHighlights();
        selectedPiece = null;
        diceValue = 0;
        return;
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

