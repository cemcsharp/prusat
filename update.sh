#!/bin/bash

# Renkler
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}1. Kodlar Github'dan cekiliyor...${NC}"
git pull

echo -e "${GREEN}2. Konteynerler yeniden insa ediliyor...${NC}"
docker compose up --build -d

echo -e "${GREEN}3. Veritabani semasi kontrol ediliyor...${NC}"
docker exec -it talep-takip-app npx prisma db push

echo -e "${GREEN}Guncelleme tamamlandi!${NC}"
