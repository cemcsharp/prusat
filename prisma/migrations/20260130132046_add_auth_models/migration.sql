-- CreateTable
CREATE TABLE "Talep" (
    "id" SERIAL NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "barkod" TEXT NOT NULL,
    "konu" TEXT NOT NULL,
    "gerekce" TEXT NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'TASLAK',
    "ilgiliKisiId" INTEGER NOT NULL,
    "birimId" INTEGER,
    "bildirimEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Talep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalepKalem" (
    "id" SERIAL NOT NULL,
    "aciklama" TEXT NOT NULL,
    "miktar" DOUBLE PRECISION NOT NULL,
    "birim" TEXT NOT NULL,
    "talepId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalepKalem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Siparis" (
    "id" SERIAL NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "barkod" TEXT NOT NULL,
    "aciklama" TEXT,
    "durum" TEXT NOT NULL DEFAULT 'BEKLEMEDE',
    "talepId" INTEGER NOT NULL,
    "birimId" INTEGER NOT NULL,
    "yonetmelikId" INTEGER NOT NULL,
    "alimYontemiId" INTEGER NOT NULL,
    "tedarikciId" INTEGER,
    "degerlendirmeFormTipiId" INTEGER,
    "rfqId" INTEGER,
    "teklifId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Siparis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegerlendirmeToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "siparisId" INTEGER NOT NULL,
    "kullanildi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DegerlendirmeToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" SERIAL NOT NULL,
    "faturaNo" TEXT NOT NULL,
    "tutar" DECIMAL(18,2) NOT NULL,
    "vadeTarihi" TIMESTAMP(3) NOT NULL,
    "odemeDurumu" TEXT NOT NULL DEFAULT 'ODENMEDI',
    "siparisId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sozlesme" (
    "id" SERIAL NOT NULL,
    "sozlesmeNo" TEXT NOT NULL,
    "baslangicTarihi" TIMESTAMP(3) NOT NULL,
    "bitisTarihi" TIMESTAMP(3) NOT NULL,
    "dosyaYolu" TEXT,
    "siparisId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sozlesme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personel" (
    "id" SERIAL NOT NULL,
    "adSoyad" TEXT NOT NULL,
    "unvan" TEXT,
    "email" TEXT,
    "telefon" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Personel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Birim" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Birim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Yonetmelik" (
    "id" SERIAL NOT NULL,
    "madde" TEXT NOT NULL,
    "aciklama" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Yonetmelik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlimYontemi" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlimYontemi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tedarikci" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "yetkiliKisi" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "adres" TEXT,
    "vergiNo" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "kategoriId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tedarikci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TedarikciKategori" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TedarikciKategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TedarikciDegerlendirme" (
    "id" SERIAL NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teslimatPuani" INTEGER NOT NULL,
    "kalitePuani" INTEGER NOT NULL,
    "fiyatPuani" INTEGER NOT NULL,
    "iletisimPuani" INTEGER NOT NULL,
    "genelPuan" DOUBLE PRECISION NOT NULL,
    "yorum" TEXT,
    "tedarikciId" INTEGER NOT NULL,
    "siparisId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TedarikciDegerlendirme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegerlendirmeFormuTipi" (
    "id" SERIAL NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DegerlendirmeFormuTipi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegerlendirmeGrubu" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "agirlik" INTEGER NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "formTipiId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DegerlendirmeGrubu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegerlendirmeSorusu" (
    "id" SERIAL NOT NULL,
    "kod" TEXT NOT NULL,
    "soru" TEXT NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "grupId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DegerlendirmeSorusu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegerlendirmeCevabi" (
    "id" SERIAL NOT NULL,
    "puan" INTEGER NOT NULL,
    "aciklama" TEXT,
    "soruId" INTEGER NOT NULL,
    "formId" INTEGER NOT NULL,

    CONSTRAINT "DegerlendirmeCevabi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TedarikciDegerlendirmeFormu" (
    "id" SERIAL NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "degerlendiren" TEXT NOT NULL,
    "tedarikciId" INTEGER NOT NULL,
    "formTipiId" INTEGER NOT NULL,
    "siparisId" INTEGER,
    "genelPuan" DOUBLE PRECISION NOT NULL,
    "sonuc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TedarikciDegerlendirmeFormu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeklifToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "talepId" INTEGER NOT NULL,
    "tedarikciId" INTEGER NOT NULL,
    "rfqTedarikciId" INTEGER,
    "olusturmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sonGecerlilik" TIMESTAMP(3) NOT NULL,
    "kullanildiMi" BOOLEAN NOT NULL DEFAULT false,
    "kullanilmaTarihi" TIMESTAMP(3),

    CONSTRAINT "TeklifToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teklif" (
    "id" SERIAL NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "talepId" INTEGER NOT NULL,
    "tedarikciId" INTEGER NOT NULL,
    "toplamTutar" DECIMAL(18,2) NOT NULL,
    "paraBirimi" TEXT NOT NULL DEFAULT 'TRY',
    "teslimSuresi" INTEGER NOT NULL,
    "gecerlilikSuresi" INTEGER NOT NULL,
    "notlar" TEXT,
    "olusturmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durum" TEXT NOT NULL DEFAULT 'BEKLEMEDE',
    "turNo" INTEGER NOT NULL DEFAULT 1,
    "rfqId" INTEGER,

    CONSTRAINT "Teklif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdemePlani" (
    "id" SERIAL NOT NULL,
    "oran" DOUBLE PRECISION NOT NULL,
    "vadeGun" INTEGER NOT NULL,
    "aciklama" TEXT,
    "teklifId" INTEGER,
    "siparisId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdemePlani_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeklifKalem" (
    "id" SERIAL NOT NULL,
    "teklifId" INTEGER NOT NULL,
    "talepKalemId" INTEGER NOT NULL,
    "rfqKalemId" INTEGER,
    "birimFiyat" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "TeklifKalem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" SERIAL NOT NULL,
    "rfqNo" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "aciklama" TEXT,
    "olusturmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sonTeklifTarihi" TIMESTAMP(3) NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'TASLAK',
    "mevcutTur" INTEGER NOT NULL DEFAULT 1,
    "maksimumTur" INTEGER NOT NULL DEFAULT 3,
    "turBitisTarihi" TIMESTAMP(3),
    "turDurumu" TEXT NOT NULL DEFAULT 'AKTIF',
    "olusturanId" INTEGER NOT NULL,
    "kategoriId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQKalem" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "talepId" INTEGER NOT NULL,
    "talepKalemId" INTEGER NOT NULL,
    "miktar" DOUBLE PRECISION,
    "bolunebilir" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFQKalem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQTedarikci" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "tedarikciId" INTEGER NOT NULL,
    "gonderimTarihi" TIMESTAMP(3),
    "durum" TEXT NOT NULL DEFAULT 'BEKLIYOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFQTedarikci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiparisKalemSecimi" (
    "id" SERIAL NOT NULL,
    "rfqKalemId" INTEGER NOT NULL,
    "teklifId" INTEGER NOT NULL,
    "siparisId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiparisKalemSecimi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "relatedEntity" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "personelId" INTEGER,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Talep_barkod_key" ON "Talep"("barkod");

-- CreateIndex
CREATE UNIQUE INDEX "Siparis_barkod_key" ON "Siparis"("barkod");

-- CreateIndex
CREATE UNIQUE INDEX "Siparis_talepId_key" ON "Siparis"("talepId");

-- CreateIndex
CREATE UNIQUE INDEX "DegerlendirmeToken_token_key" ON "DegerlendirmeToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "DegerlendirmeToken_siparisId_key" ON "DegerlendirmeToken"("siparisId");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_faturaNo_key" ON "Fatura"("faturaNo");

-- CreateIndex
CREATE UNIQUE INDEX "Sozlesme_sozlesmeNo_key" ON "Sozlesme"("sozlesmeNo");

-- CreateIndex
CREATE UNIQUE INDEX "Birim_ad_key" ON "Birim"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "Yonetmelik_madde_key" ON "Yonetmelik"("madde");

-- CreateIndex
CREATE UNIQUE INDEX "AlimYontemi_ad_key" ON "AlimYontemi"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "Tedarikci_ad_key" ON "Tedarikci"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "TedarikciKategori_ad_key" ON "TedarikciKategori"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "DegerlendirmeFormuTipi_ad_key" ON "DegerlendirmeFormuTipi"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TeklifToken_token_key" ON "TeklifToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TeklifToken_rfqTedarikciId_key" ON "TeklifToken"("rfqTedarikciId");

-- CreateIndex
CREATE UNIQUE INDEX "RFQ_rfqNo_key" ON "RFQ"("rfqNo");

-- CreateIndex
CREATE UNIQUE INDEX "SiparisKalemSecimi_rfqKalemId_key" ON "SiparisKalemSecimi"("rfqKalemId");

-- CreateIndex
CREATE INDEX "Attachment_relatedEntity_entityId_idx" ON "Attachment"("relatedEntity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_personelId_key" ON "User"("personelId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Talep" ADD CONSTRAINT "Talep_ilgiliKisiId_fkey" FOREIGN KEY ("ilgiliKisiId") REFERENCES "Personel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talep" ADD CONSTRAINT "Talep_birimId_fkey" FOREIGN KEY ("birimId") REFERENCES "Birim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalepKalem" ADD CONSTRAINT "TalepKalem_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "Talep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siparis" ADD CONSTRAINT "Siparis_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "Talep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siparis" ADD CONSTRAINT "Siparis_birimId_fkey" FOREIGN KEY ("birimId") REFERENCES "Birim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siparis" ADD CONSTRAINT "Siparis_yonetmelikId_fkey" FOREIGN KEY ("yonetmelikId") REFERENCES "Yonetmelik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siparis" ADD CONSTRAINT "Siparis_alimYontemiId_fkey" FOREIGN KEY ("alimYontemiId") REFERENCES "AlimYontemi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siparis" ADD CONSTRAINT "Siparis_tedarikciId_fkey" FOREIGN KEY ("tedarikciId") REFERENCES "Tedarikci"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siparis" ADD CONSTRAINT "Siparis_degerlendirmeFormTipiId_fkey" FOREIGN KEY ("degerlendirmeFormTipiId") REFERENCES "DegerlendirmeFormuTipi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siparis" ADD CONSTRAINT "Siparis_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siparis" ADD CONSTRAINT "Siparis_teklifId_fkey" FOREIGN KEY ("teklifId") REFERENCES "Teklif"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegerlendirmeToken" ADD CONSTRAINT "DegerlendirmeToken_siparisId_fkey" FOREIGN KEY ("siparisId") REFERENCES "Siparis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_siparisId_fkey" FOREIGN KEY ("siparisId") REFERENCES "Siparis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sozlesme" ADD CONSTRAINT "Sozlesme_siparisId_fkey" FOREIGN KEY ("siparisId") REFERENCES "Siparis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tedarikci" ADD CONSTRAINT "Tedarikci_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "TedarikciKategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TedarikciDegerlendirme" ADD CONSTRAINT "TedarikciDegerlendirme_tedarikciId_fkey" FOREIGN KEY ("tedarikciId") REFERENCES "Tedarikci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TedarikciDegerlendirme" ADD CONSTRAINT "TedarikciDegerlendirme_siparisId_fkey" FOREIGN KEY ("siparisId") REFERENCES "Siparis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegerlendirmeGrubu" ADD CONSTRAINT "DegerlendirmeGrubu_formTipiId_fkey" FOREIGN KEY ("formTipiId") REFERENCES "DegerlendirmeFormuTipi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegerlendirmeSorusu" ADD CONSTRAINT "DegerlendirmeSorusu_grupId_fkey" FOREIGN KEY ("grupId") REFERENCES "DegerlendirmeGrubu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegerlendirmeCevabi" ADD CONSTRAINT "DegerlendirmeCevabi_soruId_fkey" FOREIGN KEY ("soruId") REFERENCES "DegerlendirmeSorusu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegerlendirmeCevabi" ADD CONSTRAINT "DegerlendirmeCevabi_formId_fkey" FOREIGN KEY ("formId") REFERENCES "TedarikciDegerlendirmeFormu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TedarikciDegerlendirmeFormu" ADD CONSTRAINT "TedarikciDegerlendirmeFormu_tedarikciId_fkey" FOREIGN KEY ("tedarikciId") REFERENCES "Tedarikci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TedarikciDegerlendirmeFormu" ADD CONSTRAINT "TedarikciDegerlendirmeFormu_formTipiId_fkey" FOREIGN KEY ("formTipiId") REFERENCES "DegerlendirmeFormuTipi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TedarikciDegerlendirmeFormu" ADD CONSTRAINT "TedarikciDegerlendirmeFormu_siparisId_fkey" FOREIGN KEY ("siparisId") REFERENCES "Siparis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeklifToken" ADD CONSTRAINT "TeklifToken_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "Talep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeklifToken" ADD CONSTRAINT "TeklifToken_tedarikciId_fkey" FOREIGN KEY ("tedarikciId") REFERENCES "Tedarikci"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeklifToken" ADD CONSTRAINT "TeklifToken_rfqTedarikciId_fkey" FOREIGN KEY ("rfqTedarikciId") REFERENCES "RFQTedarikci"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teklif" ADD CONSTRAINT "Teklif_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teklif" ADD CONSTRAINT "Teklif_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "TeklifToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teklif" ADD CONSTRAINT "Teklif_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "Talep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teklif" ADD CONSTRAINT "Teklif_tedarikciId_fkey" FOREIGN KEY ("tedarikciId") REFERENCES "Tedarikci"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdemePlani" ADD CONSTRAINT "OdemePlani_teklifId_fkey" FOREIGN KEY ("teklifId") REFERENCES "Teklif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdemePlani" ADD CONSTRAINT "OdemePlani_siparisId_fkey" FOREIGN KEY ("siparisId") REFERENCES "Siparis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeklifKalem" ADD CONSTRAINT "TeklifKalem_teklifId_fkey" FOREIGN KEY ("teklifId") REFERENCES "Teklif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeklifKalem" ADD CONSTRAINT "TeklifKalem_talepKalemId_fkey" FOREIGN KEY ("talepKalemId") REFERENCES "TalepKalem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeklifKalem" ADD CONSTRAINT "TeklifKalem_rfqKalemId_fkey" FOREIGN KEY ("rfqKalemId") REFERENCES "RFQKalem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_olusturanId_fkey" FOREIGN KEY ("olusturanId") REFERENCES "Personel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "TedarikciKategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQKalem" ADD CONSTRAINT "RFQKalem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQKalem" ADD CONSTRAINT "RFQKalem_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "Talep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQKalem" ADD CONSTRAINT "RFQKalem_talepKalemId_fkey" FOREIGN KEY ("talepKalemId") REFERENCES "TalepKalem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQTedarikci" ADD CONSTRAINT "RFQTedarikci_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQTedarikci" ADD CONSTRAINT "RFQTedarikci_tedarikciId_fkey" FOREIGN KEY ("tedarikciId") REFERENCES "Tedarikci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiparisKalemSecimi" ADD CONSTRAINT "SiparisKalemSecimi_rfqKalemId_fkey" FOREIGN KEY ("rfqKalemId") REFERENCES "RFQKalem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiparisKalemSecimi" ADD CONSTRAINT "SiparisKalemSecimi_teklifId_fkey" FOREIGN KEY ("teklifId") REFERENCES "Teklif"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiparisKalemSecimi" ADD CONSTRAINT "SiparisKalemSecimi_siparisId_fkey" FOREIGN KEY ("siparisId") REFERENCES "Siparis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personelId_fkey" FOREIGN KEY ("personelId") REFERENCES "Personel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
