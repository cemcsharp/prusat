-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_personelId_fkey";

-- AlterTable
ALTER TABLE "Personel" ADD COLUMN     "birimId" INTEGER,
ADD COLUMN     "isBirimYoneticisi" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RFQ" ADD COLUMN     "agirlikFiyat" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "agirlikPerformans" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "agirlikTeslimat" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "agirlikVade" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Talep" ADD COLUMN     "sorumluId" TEXT;

-- AlterTable
ALTER TABLE "TalepKalem" ADD COLUMN     "detay" TEXT;

-- AlterTable
ALTER TABLE "Teklif" ADD COLUMN     "vadeGun" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Talep" ADD CONSTRAINT "Talep_sorumluId_fkey" FOREIGN KEY ("sorumluId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personel" ADD CONSTRAINT "Personel_birimId_fkey" FOREIGN KEY ("birimId") REFERENCES "Birim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personelId_fkey" FOREIGN KEY ("personelId") REFERENCES "Personel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
