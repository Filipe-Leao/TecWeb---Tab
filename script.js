// Criar tabuleiro
const board = document.getElementById('board');
const numSquares = 12;
const maxPieces = 4;
const numLines = 4;
let selectedPiece = null;


// Função de criar o tabuleiro
function createBoard(){
    for (let i = 0; i < numLines; i++){
        for (let j = 0; j < numSquares; j++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.dataset.index = j;
        
            // Adiciona peças nas 3 primeiras casas
            if (j < maxPieces && i == 0){
                const piece = document.createElement('div');
                piece.classList.add('piece_red');
                square.appendChild(piece);
            }
            else if ((j > numSquares - 1 - maxPieces) && (i == numLines - 1)){
                const piece = document.createElement('div');
                piece.classList.add('piece_blue');
                square.appendChild(piece);
            }
            square.addEventListener('click', handleClick);
            board.appendChild(square);
        }
    }
}

function possible_movements(selectedPiece){
        
}

// Função de clique
function handleClick(e) {
    const square = e.currentTarget;

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
