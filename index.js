import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public"))); // pasta onde estão os JS/CSS/HTML

// rota padrão
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Configuração da base de dados
const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tab'
});

// Endpoint para leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const [rows] = await db.query('CALL GetLB()');
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/new-match', express.json(), async (req, res) => {
  const { player1_id, player2_id, winner } = req.body;

  try {
    await db.query('CALL AddMatch(?, ?, ?)', [player1_id, player2_id, winner]);
    res.status(201).json({ message: 'Partida registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar partida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  console.log("Login attempt:", { username, password });

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid payload." });
  }

  try {
    const [rs] = await db.query("CALL LoginPlayer(?)", [username]);
    const row = rs?.[0]?.[0];
    if (!row) return res.status(401).json({ error: "Invalid username or password." });

    const hashedPassword = row.password;
    const match = await bcrypt.compare(password, hashedPassword);
    if (!match) return res.status(401).json({ error: "Invalid username or password." });

    const playerData = {
      PlayerId: row.id,
      Username: row.username,
    };
    
    return res.status(200).json({
      success: true,
      player: playerData
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json(errPayload("Failed to authenticate user.", err));
  }
});

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid payload." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("SET @p_player_id = 0");
    await db.query("CALL CreatePlayer(?,?, @p_player_id)", [
      username,
      hashedPassword,
    ]);
    const [out] = await db.query("SELECT @p_player_id AS playerId");
    const playerId = out?.[0]?.playerId;

    if (!playerId) return res.status(500).json({ error: "Failed to create player (no id returned)." });
    return res.status(200).json({ playerId });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json(errPayload("Failed to create player.", err));
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));

app.use(express.static('public'));
