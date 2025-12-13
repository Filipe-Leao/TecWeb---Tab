// ============================================
// CANVAS - ANIMAÇÕES DO DADO DE PAUS
// ============================================

/**
 * Inicializa o Canvas para as animações do dado de paus
 * Substitui o div #dice-sticks
 */
function initDiceCanvas() {
    const dicePanel = document.getElementById('dice-panel');
    if (!dicePanel) return null;
    
    // Remove canvas anterior se existir
    const oldCanvas = document.getElementById('diceCanvas');
    if (oldCanvas) {
        oldCanvas.remove();
    }
    
    // Cria novo canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'diceCanvas';
    canvas.width = 200;
    canvas.height = 40;
    canvas.style.display = 'block';
    canvas.style.margin = '20px auto';
    canvas.style.cursor = 'pointer';
    canvas.style.backgroundColor = 'transparent';
    canvas.style.border = 'none';
    
    // Substitui o #dice-sticks
    const diceSticks = document.getElementById('dice-sticks');
    if (diceSticks) {
        diceSticks.parentNode.replaceChild(canvas, diceSticks);
    } else {
        // Se não existir, insere antes do #dice-result
        const diceResult = document.getElementById('dice-result');
        if (diceResult) {
            diceResult.parentNode.insertBefore(canvas, diceResult);
        }
    }
    
    return canvas;
}

/**
 * Anima o lançamento dos 4 paus
 * @param {number} value - Valor final (número de paus no lado claro: 0-4)
 * @param {function} callback - Função a executar após animação
 */
async function animateDiceRoll(value, callback) {
    const canvas = document.getElementById('diceCanvas') || initDiceCanvas();
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const duration = 1000; // milissegundos
    const startTime = Date.now();
    
    // Estado dos 4 paus
    const sticks = [
        { rotation: Math.random() * Math.PI * 2, vRotation: 0.08 },
        { rotation: Math.random() * Math.PI * 2, vRotation: 0.07 },
        { rotation: Math.random() * Math.PI * 2, vRotation: 0.085 },
        { rotation: Math.random() * Math.PI * 2, vRotation: 0.075 }
    ];
    
    // Resultado final (qual lado fica virado para cima)
    const finalStates = [];
    for (let i = 0; i < 4; i++) {
        finalStates[i] = i < value ? 'light' : 'dark';
    }
    
    return new Promise((resolve) => {
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out
            
            // Limpa o canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (progress < 1) {
                // Animação de rotação
                sticks.forEach((stick, i) => {
                    stick.rotation += stick.vRotation;
                    drawStick(ctx, stick.rotation, 30 + i * 50, 20, 'rotating');
                });
            } else {
                // Mostra resultado final
                sticks.forEach((stick, i) => {
                    const state = finalStates[i];
                    drawStick(ctx, 0, 30 + i * 50, 20, state);
                });
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (callback) callback(value);
                resolve(value);
            }
        }
        
        animate();
    });
}

/**
 * Desenha um retângulo com bordas redondas
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

/**
 * Desenha um pau com duas faces (claro/escuro)
 * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
 * @param {number} rotation - Ângulo de rotação em radianos
 * @param {number} x - Posição X do centro
 * @param {number} y - Posição Y do centro
 * @param {string} state - 'light', 'dark' ou 'rotating'
 */
function drawStick(ctx, rotation, x, y, state) {
    const width = 18;
    const height = 8;
    const radius = 3; // bordas redondas
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    if (state === 'rotating') {
        // Durante a rotação, alterna entre claro e escuro
        const sineWave = Math.abs(Math.sin(rotation * 2));
        
        if (sineWave > 0.5) {
            // Lado claro
            ctx.fillStyle = '#FFFBEB';
            ctx.strokeStyle = '#FBBF24';
        } else {
            // Lado escuro
            ctx.fillStyle = '#5C3317';
            ctx.strokeStyle = '#422006';
        }
        
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, -width / 2, -height / 2, width, height, radius);
        ctx.fill();
        ctx.stroke();
        
    } else if (state === 'light') {
        // Lado claro virado para cima
        ctx.fillStyle = '#FFFBEB';
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, -width / 2, -height / 2, width, height, radius);
        ctx.fill();
        ctx.stroke();
        
    } else if (state === 'dark') {
        // Lado escuro virado para cima
        ctx.fillStyle = '#5C3317';
        ctx.strokeStyle = '#422006';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, -width / 2, -height / 2, width, height, radius);
        ctx.fill();
        ctx.stroke();
    }
    
    ctx.restore();
}

/**
 * Desenha os 4 paus com um estado fixo (resultado final)
 */
function drawSticksFinal(ctx, value) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const finalStates = [];
    for (let i = 0; i < 4; i++) {
        finalStates[i] = i < value ? 'light' : 'dark';
    }
    
    finalStates.forEach((state, i) => {
        drawStick(ctx, 0, 30 + i * 50, 20, state);
    });
}

/**
 * Desenha o resultado final dos 4 paus
 */
function drawDiceValue(value) {
    const canvas = document.getElementById('diceCanvas') || initDiceCanvas();
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawSticksFinal(ctx, value);
}

/**
 * Mostra os paus com um estado específico
 */
function visualizeDiceValue(value) {
    const canvas = document.getElementById('diceCanvas') || initDiceCanvas();
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawSticksFinal(ctx, value);
}

// Exporta as funções
window.initDiceCanvas = initDiceCanvas;
window.animateDiceRoll = animateDiceRoll;
window.drawDiceValue = drawDiceValue;
window.visualizeDiceValue = visualizeDiceValue;
