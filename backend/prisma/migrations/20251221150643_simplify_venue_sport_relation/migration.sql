/*
  Schema Simplification: One Venue = One Sport
  
  This migration:
  1. Adds sport_id column to venues (nullable first)
  2. Migrates data from venue_sports junction table (takes first sport if multiple)
  3. Makes sport_id required
  4. Drops venue_sports table
  5. Removes sport_id from venue_images
*/

-- Step 1: Add sport_id column as nullable first
ALTER TABLE "venues" ADD COLUMN "sport_id" TEXT;

-- Step 2: Migrate data from venue_sports (pick first sport for each venue)
UPDATE "venues" v
SET "sport_id" = (
  SELECT "sport_id" 
  FROM "venue_sports" vs 
  WHERE vs."venue_id" = v."id" 
  LIMIT 1
);

-- Step 3: For venues without any sport, assign the first available sport (Football/Futsal typically)
UPDATE "venues"
SET "sport_id" = (SELECT "id" FROM "sports" LIMIT 1)
WHERE "sport_id" IS NULL;

-- Step 4: Make sport_id NOT NULL now that all venues have a sport
ALTER TABLE "venues" ALTER COLUMN "sport_id" SET NOT NULL;

-- Step 5: Create index on sport_id
CREATE INDEX "venues_sport_id_idx" ON "venues"("sport_id");

-- Step 6: Add foreign key constraint
ALTER TABLE "venues" ADD CONSTRAINT "venues_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Drop foreign keys from venue_sports
ALTER TABLE "venue_sports" DROP CONSTRAINT "venue_sports_sport_id_fkey";
ALTER TABLE "venue_sports" DROP CONSTRAINT "venue_sports_venue_id_fkey";

-- Step 8: Drop venue_sports table (no longer needed)
DROP TABLE "venue_sports";

-- Step 9: Clean up venue_images - remove sport_id column
ALTER TABLE "venue_images" DROP CONSTRAINT IF EXISTS "venue_images_sport_id_fkey";
DROP INDEX IF EXISTS "venue_images_sport_id_idx";
ALTER TABLE "venue_images" DROP COLUMN IF EXISTS "sport_id";
