// ============================================
// WEBSTORAGE - SISTEMA DE CLASSIFICAÇÕES LOCAL
// ============================================

// Chave do localStorage onde guardamos os scores
const STORAGE_KEY = 'tabGameScores';

/**
 * Inicializa o localStorage se não existir
 */
function initLocalStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
}

/**
 * Obtém todas as classificações do localStorage
 */
function getLocalScores() {
    initLocalStorage();
    const scores = localStorage.getItem(STORAGE_KEY);
    return JSON.parse(scores) || [];
}

/**
 * Guarda as classificações no localStorage
 */
function saveLocalScores(scores) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

/**
 * Atualiza a classificação de um jogador após uma partida
 * @param {string} nick - Nome do jogador
 * @param {boolean} victory - true se venceu, false se perdeu
 */
function updatePlayerScore(nick, victory) {
    const scores = getLocalScores();
    const playerIndex = scores.findIndex(p => p.nick === nick);
    
    if (playerIndex === -1) {
        // Novo jogador
        scores.push({
            nick: nick,
            victories: victory ? 1 : 0,
            defeats: victory ? 0 : 1
        });
    } else {
        // Jogador já existe
        if (victory) {
            scores[playerIndex].victories++;
        } else {
            scores[playerIndex].defeats++;
        }
    }
    
    // Ordena por vitórias (descendente)
    scores.sort((a, b) => b.victories - a.victories);
    
    saveLocalScores(scores);
}

/**
 * Obtém a classificação ordenada (top 10)
 */
function getTopScores(limit = 10) {
    const scores = getLocalScores();
    return scores.slice(0, limit);
}

/**
 * Limpa todas as classificações
 */
function clearAllScores() {
    localStorage.removeItem(STORAGE_KEY);
    initLocalStorage();
}

/**
 * Atualiza a tabela visual das classificações locais
 */
function updateLocalScoresDisplay() {
    const topScores = getTopScores(10);
    const tBodys = [
        document.querySelector('#classificacoes tbody'),
        document.querySelector('#classificacoesJogo tbody')
    ];
    
    tBodys.forEach(tbody => {
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (topScores.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" style="text-align: center; padding: 20px;">Nenhum jogo registado</td>`;
            tbody.appendChild(tr);
            return;
        }
        
        topScores.forEach((score, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i + 1}º</td>
                <td>${score.nick}</td>
                <td>${score.victories}</td>
                <td>${score.defeats}</td>
            `;
            tbody.appendChild(tr);
        });
    });
}

/**
 * Integra a atualização de scores ao fim da partida (PvC)
 * Deve ser chamado em showEndGameMenu quando isPvP = false
 */
function recordLocalGameResult(playerNick, playerWon) {
    if (!window.isPvP && playerNick) {
        updatePlayerScore(playerNick, playerWon);
        updateLocalScoresDisplay();
    }
}

// Inicializa ao carregar o script
initLocalStorage();

// Exporta as funções para uso global
window.initLocalStorage = initLocalStorage;
window.getLocalScores = getLocalScores;
window.saveLocalScores = saveLocalScores;
window.updatePlayerScore = updatePlayerScore;
window.getTopScores = getTopScores;
window.clearAllScores = clearAllScores;
window.updateLocalScoresDisplay = updateLocalScoresDisplay;
window.recordLocalGameResult = recordLocalGameResult;
