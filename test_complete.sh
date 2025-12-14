#!/bin/bash

echo "=== 1. REGISTANDO JOGADORES ==="

curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"nick": "Alice", "password": "pass123"}' > /dev/null

curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"nick": "Bob", "password": "pass456"}' > /dev/null

curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"nick": "Charlie", "password": "pass789"}' > /dev/null

curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"nick": "Diana", "password": "pass321"}' > /dev/null

curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"nick": "Eve", "password": "pass654"}' > /dev/null

echo "✅ Jogadores registados!"

echo -e "\n=== 2. CRIANDO JOGOS ==="

# Alice cria jogo e captura o ID
ALICE_RESPONSE=$(curl -s -X POST http://localhost:3000/join \
  -H "Content-Type: application/json" \
  -d '{"group": 35, "nick": "Alice", "password": "pass123", "size": 9}')

ALICE_GAME=$(echo $ALICE_RESPONSE | grep -o '"game":"[^"]*"' | cut -d'"' -f4)
echo "✅ Alice criou jogo: $ALICE_GAME"

# Bob junta-se
curl -s -X POST http://localhost:3000/join \
  -H "Content-Type: application/json" \
  -d '{"group": 35, "nick": "Bob", "password": "pass456", "size": 9}' > /dev/null

echo "✅ Bob juntou-se ao jogo de Alice"

# Charlie cria jogo
CHARLIE_RESPONSE=$(curl -s -X POST http://localhost:3000/join \
  -H "Content-Type: application/json" \
  -d '{"group": 35, "nick": "Charlie", "password": "pass789", "size": 7}')

CHARLIE_GAME=$(echo $CHARLIE_RESPONSE | grep -o '"game":"[^"]*"' | cut -d'"' -f4)
echo "✅ Charlie criou jogo: $CHARLIE_GAME"

# Diana junta-se
curl -s -X POST http://localhost:3000/join \
  -H "Content-Type: application/json" \
  -d '{"group": 35, "nick": "Diana", "password": "pass321", "size": 7}' > /dev/null

echo "✅ Diana juntou-se ao jogo de Charlie"

# Eve cria jogo sozinha
EVE_RESPONSE=$(curl -s -X POST http://localhost:3000/join \
  -H "Content-Type: application/json" \
  -d '{"group": 35, "nick": "Eve", "password": "pass654", "size": 9}')

EVE_GAME=$(echo $EVE_RESPONSE | grep -o '"game":"[^"]*"' | cut -d'"' -f4)
echo "✅ Eve criou jogo: $EVE_GAME"

echo -e "\n=== 3. TESTANDO LEAVE ==="

# Eve abandona (jogo removido porque está sozinha)
echo -e "\n--- Eve abandona jogo à espera ---"
curl -X POST http://localhost:3000/leave \
  -H "Content-Type: application/json" \
  -d "{\"nick\": \"Eve\", \"password\": \"pass654\", \"game\": \"$EVE_GAME\"}"

echo ""

# Bob abandona (Alice ganha)
echo -e "\n--- Bob abandona jogo (Alice deve ganhar) ---"
curl -X POST http://localhost:3000/leave \
  -H "Content-Type: application/json" \
  -d "{\"nick\": \"Bob\", \"password\": \"pass456\", \"game\": \"$ALICE_GAME\"}"

echo ""

# Diana abandona (Charlie ganha)
echo -e "\n--- Diana abandona jogo (Charlie deve ganhar) ---"
curl -X POST http://localhost:3000/leave \
  -H "Content-Type: application/json" \
  -d "{\"nick\": \"Diana\", \"password\": \"pass321\", \"game\": \"$CHARLIE_GAME\"}"

echo ""

echo -e "\n=== 4. VERIFICANDO WINNERS NO DATA.JSON ==="
echo "Verificando jogos com winners..."
curl -s -X GET http://localhost:3000/data | grep -A 2 '"winner"'

echo -e "\n=== 5. RANKINGS ==="

echo -e "\n--- Ranking 9x9 ---"
curl -X POST http://localhost:3000/ranking \
  -H "Content-Type: application/json" \
  -d '{"group": 35, "size": 9}'

echo -e "\n\n--- Ranking 7x7 ---"
curl -X POST http://localhost:3000/ranking \
  -H "Content-Type: application/json" \
  -d '{"group": 35, "size": 7}'

echo -e "\n\n=== 6. DADOS COMPLETOS DOS USERS ==="
curl -s -X GET http://localhost:3000/data | grep -A 6 '"users"'

echo -e "\n\n✅ Testes completos!"