-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "readingEntryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "page" INTEGER NOT NULL,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_readingEntryId_fkey" FOREIGN KEY ("readingEntryId") REFERENCES "ReadingEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
