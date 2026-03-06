#!/bin/bash

# Renkler
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}   TalepTakip Ubuntu 24.04 Kurulum Scripti    ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Kullanıcı verilerini al
read -p "Domain Adı (örn: talep.firma.com veya IP): " DOMAIN_NAME
read -p "Yönetici Email (SSL ve Admin hesabı için): " ADMIN_EMAIL
read -s -p "Yönetici Şifresi (Admin Paneli): " ADMIN_PASSWORD
echo ""
read -s -p "Veritabanı Şifresi (PostgreSQL): " DB_PASSWORD
echo ""

# Sistem Güncelleme
echo -e "${GREEN}[1/8] Sistem güncelleniyor...${NC}"
apt update && apt upgrade -y
apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# Firewall Ayarları
echo -e "${GREEN}[2/8] Firewall yapılandırılıyor...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Node.js Kurulumu (v20 LTS)
echo -e "${GREEN}[3/8] Node.js kuruluyor...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# PostgreSQL Kurulumu
echo -e "${GREEN}[4/8] PostgreSQL kuruluyor...${NC}"
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Veritabanı ve Kullanıcı Oluşturma
sudo -u postgres psql -c "CREATE USER talep_user WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE talep_db OWNER talep_user;"
sudo -u postgres psql -c "ALTER USER talep_user CREATEDB;"

# Proje Kurulumu
echo -e "${GREEN}[5/8] Proje dosyaları hazırlanıyor...${NC}"
APP_DIR="/var/www/taleptakip"
git clone https://github.com/cemcsharp/taleptakip.git $APP_DIR

cd $APP_DIR
npm install

# .env Dosyası Oluşturma
echo "DATABASE_URL=\"postgresql://talep_user:$DB_PASSWORD@localhost:5432/talep_db?schema=public\"" > .env
echo "NEXTAUTH_URL=\"https://$DOMAIN_NAME\"" >> .env
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
echo "ADMIN_EMAIL=\"$ADMIN_EMAIL\"" >> .env
echo "ADMIN_PASSWORD=\"$ADMIN_PASSWORD\"" >> .env
# Varsayılan SMTP ayarları (Lütfen daha sonra düzenleyin)
echo "SMTP_HOST=smtp.gmail.com" >> .env
echo "SMTP_PORT=587" >> .env
echo "SMTP_SECURE=false" >> .env
echo "SMTP_USER=" >> .env
echo "SMTP_PASS=" >> .env
echo "SMTP_FROM=\"Talep Takip\" <$ADMIN_EMAIL>" >> .env

# Veritabanı Migration ve Seed
echo -e "${GREEN}[6/8] Veritabanı hazırlanıyor...${NC}"
npx prisma migrate deploy
npx prisma db seed

# Uygulamayı Derle ve Başlat
echo -e "${GREEN}[7/8] Uygulama derleniyor...${NC}"
npm run build
pm2 start npm --name "taleptakip" -- start
pm2 save
pm2 startup

# Nginx Konfigürasyonu
echo -e "${GREEN}[8/8] Nginx ve SSL yapılandırılıyor...${NC}"
cat > /etc/nginx/sites-available/$DOMAIN_NAME <<EOF
server {
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    client_max_body_size 10M;
}
EOF

ln -s /etc/nginx/sites-available/$DOMAIN_NAME /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# SSL Sertifikası (Certbot)
certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m $ADMIN_EMAIL --redirect

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}   KURULUM TAMAMLANDI!   ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "Web Adresi: https://$DOMAIN_NAME"
echo -e "Admin Email: $ADMIN_EMAIL"
echo -e "Admin Şifre: (Belirlediğiniz Şifre)"
echo -e "${BLUE}==============================================${NC}"
