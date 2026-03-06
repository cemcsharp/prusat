# Satınalma ve Talep Takip Sistemi

Bu proje, kurum içi satınalma süreçlerini, talepleri, teklifleri ve tedarikçi performanslarını yönetmek için geliştirilmiş modern bir Next.js tabanlı web uygulamasıdır.

## 🚀 Laptop üzerinde Kurulum Rehberi

Yeni bir cihazda (laptop vb.) kurulum yapmak için aşağıdaki adımları sırayla takip ediniz.

### 📋 Ön Gereksinimler

Cihazınızda aşağıdaki araçların kurulu olduğundan emin olun:
1. **Node.js** (v18.x veya üzeri önerilir)
2. **Docker Desktop** (Konteyner yapısı için)
3. **Git** (Kodları çekmek için)
4. **PostgreSQL** (Eğer Docker harici yerel veritabanı kullanılacaksa)

---

### 1. Kodları Bilgisayarınıza İndirin
Terminali açın ve projeyi kurmak istediğiniz klasöre giderek şu komutu çalıştırın:
```bash
git clone https://github.com/cemcsharp/taleptakip.git
cd taleptakip
```

---

### 2. Ortam Değişkenlerini (Environment Variables) Ayarlayın
Proje dizininde `.env` isimli bir dosya oluşturun (veya varsa mevcut olanı düzenleyin). Dosya içeriği şu şekilde olmalıdır:

```env
# Veritabanı Bağlantısı (Docker kullanıyorsanız docker-compose.yml ile uyumlu olmalı)
DATABASE_URL="postgresql://postgres:password123@localhost:5432/talepdb?schema=public"

# NextAuth Güvenlik Ayarları
AUTH_SECRET="farkli_ve_guclu_bir_sifre_buraya"
NEXTAUTH_URL="http://localhost:3000"

# E-posta Bildirim Ayarları (SMTP)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="kullanici_adiniz"
SMTP_PASS="sifreniz"
SMTP_FROM="noreply@sirketadi.com"

# Admin Bilgileri (İlk kurulumda yetkili kullanıcı oluşturmak için)
ADMIN_EMAIL="admin@talep.com"
ADMIN_PASSWORD="admin_sifreniz"
```

---

### 3. Çalıştırma Yöntemleri

En hızlı ve sorunsuz yöntem **Docker** kullanmaktır.

#### A Yöntemi: Docker ile Çalıştırma (Önerilen)
Eğer bilgisayarınızda Docker kurulu ise tek bir komutla tüm sistemi (ve veritabanını) ayağa kaldırabilirsiniz:
```bash
docker-compose up --build -d
```
*Bu komut veritabanını oluşturur, bağımlılıkları yükler ve uygulamayı `3000` portunda başlatır.*

**Önemli:** İlk kurulumda yönetici hesabını oluşturmak için şu komutu çalıştırın:
```bash
docker exec -it talep-takip-app node scripts/seed-admin.mjs
```

#### B Yöntemi: Yerel Geliştirme Ortamı (Npm)
Sistemi Docker olmadan manuel çalıştırmak isterseniz:
1. Bağımlılıkları yükleyin: `npm install`
2. Prisma istemcisini oluşturun: `npx prisma generate`
3. Veritabanını oluşturun/senkronize edin: `npx prisma db push`
4. Örnek verileri (Admin vb.) yükleyin: `npx prisma db seed`
5. Uygulamayı başlatın (Geliştirme modu): `npm run dev`

---

### 4. Şemayı ve Giriş Bilgilerini Kontrol Edin

- Uygulamaya tarayıcınızdan `http://localhost:3000` adresinden erişebilirsiniz.
- İlk giriş için `.env` dosyasında belirlediğiniz **ADMIN_EMAIL** ve **ADMIN_PASSWORD** bilgilerini kullanın.
- Diğer detaylı bilgiler için `GIRIS_BILGILERI.md` ve `ROL_VE_YETKILER.md` dosyalarına göz atabilirsiniz.

---

## 🛠️ Sorun Giderme

- **Veritabanı Bağlantı Hatası:** PostgreSQL servisinin çalıştığından ve şifrenin `.env` ile eşleştiğinden emin olun.
- **Port Meşgul:** `3000` portu başka bir uygulama tarafından kullanılıyorsa Docker konteynerini veya o uygulamayı durdurun.
- **Eksik Tipler:** `npx prisma generate` komutunu çalıştırarak Prisma Client'ı güncelleyin.

---

© 2026 SatınalmaPRO - Kurumsal Tedarik Yönetimi
