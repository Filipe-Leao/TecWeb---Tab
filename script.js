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
            matrix[i][j] = 0;

            const square = document.createElement('div');
            square.classList.add('square');
            square.dataset.index = j;
            square.dataset.row = i;
            square.dataset.col = j;

            // Adiciona peças nas 3 primeiras casas
            if (j < maxPieces && i == numLines - 1) {
                const piece = document.createElement('div');
                piece.classList.add('piece_blue');
                matrix[i][j] = 2; // Casa ocupada por Azul
                square.appendChild(piece);
            }
            else if ((j > numSquares - 1 - maxPieces) && (i == 0)) {
                const piece = document.createElement('div');
                piece.classList.add('piece_red');
                matrix[i][j] = 1; // Casa ocupada por Vermelho
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
async function move(row, col, diceValue, can_go_up, pieceElement, originalSquareElement) {
    let targetRow = parseInt(row);
    let targetCol = parseInt(col);
    let direction = 0;

    for (let k = 0; k < diceValue; k++) {
        if (targetRow === 1 || targetRow === 3) {
            direction = -1; // Direita para a Esquerda
        } else if (targetRow === 0 || targetRow === 2) {
            direction = 1; // Esquerda para a Direita
        }

        // Move um passo
        targetCol += direction;

        // Verifica as fronteiras
        if (targetCol < 0 || targetCol >= numSquares) {
            if (targetRow === 0) { // Sai da linha 0
                targetRow = 1;
                targetCol = numSquares - 1; // Entra na linha 1
            } else if (targetRow === 1) { // Sai da linha 1
                targetRow = 2;
                targetCol = 0; // Entra na linha 2
            } else if (targetRow === 2) { // Sai da linha 2
                let moveChoice = 'down'; // Default
                if (can_go_up) {
                    moveChoice = await askDirection();
                }

                if (moveChoice === 'up') {
                    targetRow = 3; // Vai para a linha 4 (índice 3)
                    targetCol = numSquares - 1; // Entra na linha 3
                } else { // 'down'
                    targetRow = 1; // Volta para a linha 2 (índice 1)
                    targetCol = numSquares - 1; // Entra na linha 1
                }
            } else if (targetRow === 3) { // Sai da linha 3
                targetRow = 2;
                targetCol = 0; // Volta para a linha 2
            }
        }
    }

    // Pega o valor da peça (1 para 'red', 2 para 'blue')
    const pieceValue = matrix[row][col];

    // Verifica se a casa de destino tem uma peça do PRÓPRIO jogador
    if (matrix[targetRow][targetCol] === pieceValue) {
        alert("Não pode mover esta peça, existe uma peça sua na casa de destino.");
        return false;
    }

    // Encontra o elemento DOM da casa de destino
    const targetSquare = document.querySelector(`.square[data-row='${targetRow}'][data-col='${targetCol}']`);
    if (!targetSquare) {
        alert("Erro: Casa de destino não encontrada no DOM.");
        return false;
    }

    // Verifica se é uma captura
    if (matrix[targetRow][targetCol] !== 0) {
        alert("Capturou uma peça do seu adversário!");
        targetSquare.innerHTML = ''; // Remove a peça capturada do DOM
    }

    targetSquare.appendChild(pieceElement);     // Move a peça no DOM
    matrix[targetRow][targetCol] = pieceValue;  // Atualiza a 'matrix' de destino
    matrix[row][col] = 0;                       // Limpa a 'matrix' de origem

    // Limpa o highlight do quadrado original (se houver)
    if (originalSquareElement) {
        originalSquareElement.style.backgroundColor = '#eee';
    }

    return true; // Movimento foi bem-sucedido
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
    const square = e.currentTarget; // O quadrado clicado

    // Se o dado não foi lançado, lança o dado.
    if (diceValue === 0) {
        diceValue = rollDice();
        return; // Espera o jogador escolher uma peça
    }

    // Verifica se o jogador clicou numa peça vermelha (assumindo que é a vez do 'red')
    const piece = square.querySelector('.piece_red');
    if (piece) {
        // Se sim, vamos tentar movê-la.
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        const can_go_up = true;
        const moveSuccess = await move(row, col, diceValue, can_go_up, piece, square);

        if (moveSuccess) {
            // Verifica se repete a jogada
            if (diceValue !== 1 && diceValue !== 4 && diceValue !== 6) {
                // Passa a vez
                alert("Vez do adversário (computador)");
                playerTurn = 'blue'; // (Exemplo de troca de turno)
            } else {
                alert("Joga novamente!");
                // O playerTurn continua 'red'
            }

            // Reseta o dado para o próximo turno/jogada
            diceValue = 0;
            clearHighlights(); // Limpa quaisquer destaques
        }
    } else {
        if (square.querySelector('.piece_blue')) {
            alert("Essa é uma peça do oponente!");
        } else {
            alert("Selecione uma peça vermelha para mover.");
        }
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

