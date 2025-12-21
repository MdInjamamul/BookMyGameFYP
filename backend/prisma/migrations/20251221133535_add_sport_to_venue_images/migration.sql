-- AlterTable
ALTER TABLE "venue_images" ADD COLUMN     "sport_id" TEXT;

-- CreateIndex
CREATE INDEX "venue_images_sport_id_idx" ON "venue_images"("sport_id");

-- AddForeignKey
ALTER TABLE "venue_images" ADD CONSTRAINT "venue_images_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
