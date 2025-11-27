#!/bin/bash

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Verificando configuração do Google Sheets...${NC}\n"

# Verificar se arquivo credentials.json existe
if [ ! -f "backend/credentials.json" ]; then
  echo -e "${RED}❌ Arquivo backend/credentials.json não encontrado!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Arquivo credentials.json encontrado${NC}"

# Verificar se tem jq instalado
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⚠️ jq não está instalado. Instale com: sudo apt-get install jq${NC}"
  exit 1
fi

# Verificar redirect_uri
echo -e "\n${YELLOW}Redirect URI configurado:${NC}"
REDIRECT_URI=$(cat backend/credentials.json | jq -r '.installed.redirect_uris[0]')
echo -e "  $REDIRECT_URI"

# Verificar Client ID
echo -e "\n${YELLOW}Client ID:${NC}"
CLIENT_ID=$(cat backend/credentials.json | jq -r '.installed.client_id')
echo -e "  $CLIENT_ID"

# Verificar se SPREADSHEET_ID está no .env
echo -e "\n${YELLOW}Verificando SPREADSHEET_ID...${NC}"
if grep -q "SPREADSHEET_ID=" backend/.env; then
  SHEET_ID=$(grep "SPREADSHEET_ID=" backend/.env | cut -d '=' -f 2)
  echo -e "${GREEN}✅ SPREADSHEET_ID configurado: $SHEET_ID${NC}"
else
  echo -e "${RED}❌ SPREADSHEET_ID não encontrado em backend/.env${NC}"
  exit 1
fi

# Verificar se backend está rodando
echo -e "\n${YELLOW}Verificando se backend está rodando...${NC}"
if curl -s http://localhost:3001/health > /dev/null; then
  echo -e "${GREEN}✅ Backend está rodando em http://localhost:3001${NC}"
else
  echo -e "${RED}❌ Backend não está respondendo em http://localhost:3001${NC}"
  echo -e "${YELLOW}   Execute: cd backend && npm start${NC}"
  exit 1
fi

echo -e "\n${GREEN}✅ Todas as configurações parecem corretas!${NC}"
echo -e "\n${YELLOW}📋 Próximos passos:${NC}"
echo -e "  1. Abra: http://localhost:3000"
echo -e "  2. Clique em 🔑 Autenticar com Google"
echo -e "  3. Autorize o acesso à sua planilha"
echo -e "  4. Clique em 📊 Ler Dados da Planilha"
