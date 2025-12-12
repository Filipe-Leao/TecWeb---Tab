import express from 'express';
import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
console.log(__filename);
const __dirname = path.dirname(__filename);
console.log(__dirname);
const DATA_PATH = path.join(__dirname, '.', 'data.json');
console.log(DATA_PATH);

// --------------------------------------
// FUNÇÕES AUXILIARES
// --------------------------------------

async function loadData() {
    try {
        const raw = await fs.readFile(DATA_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('Data file not found, creating new one.');
            const initialData = { users: [], games: [] };
            await saveData(initialData);
            return initialData;
        }
        throw err;
    }
}

async function saveData(data) {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('Data saved to', DATA_PATH);
}

// Hash MD5 genérico
function md5(value) {
    return crypto.createHash('md5').update(value).digest('hex');
}

// Gerar salt aleatório
function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

// Hash password com salt
function hashPassword(password, salt) {
    return md5(password + salt);
}


// --------------------------------------
// SERVIDOR
// --------------------------------------

const app = express();
app.use(express.json());

app.post('/register', async (req, res) => {
    const { nick, password } = req.body;

    // ---- validação básica ----
    if (typeof nick !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid arguments' });
    }

    const data = await loadData();

    const existing = data.users.find(u => u.nick === nick);

    // ---- Login ----
    if (existing) {
        // Usar o salt existente para verificar
        const hashed = hashPassword(password, existing.salt);
        
        // Sucesso na autenticação
        if (existing.password === hashed) {
            return res.status(200).json({
                message: 'User authenticated',
                nick: existing.nick
            });
        }

        // password diferente
        return res.status(401).json({
            error: 'Wrong password for existing user'
        });
    }

    // ---- Register ----
    const salt = generateSalt();
    const hashed = hashPassword(password, salt);
    
    const newUser = {
        nick,
        password: hashed,
        salt
    };

    data.users.push(newUser);
    await saveData(data);

    return res.status(201).json({
        message: 'User registered',
        nick
    });
});


/* 
// Criar jogo (ID gerado com MD5)
app.post('/games', async (req, res) => {
    const gameData = req.body;

    // Id depende dos dados + timestamp
    const id = md5(JSON.stringify(gameData) + Date.now());

    const data = await loadData();

    const game = {
        id,
        ...gameData
    };

    data.games.push(game);
    await saveData(data);

    res.status(201).json(game);
}); 
*/

// Obter tudo (para testes)
app.get('/data', async (req, res) => {
    const data = await loadData();
    res.json(data);
});

app.listen(3000, () => console.log('Server running on 3000'));
