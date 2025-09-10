-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "pmId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" DATETIME,
    "targetDelivery" DATETIME,
    "lastUpdatedAt" DATETIME NOT NULL,
    "notes" TEXT,
    "clientShareToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    CONSTRAINT "Project_pmId_fkey" FOREIGN KEY ("pmId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("branch", "clientEmail", "clientName", "clientShareToken", "createdAt", "id", "lastUpdatedAt", "notes", "pmId", "startDate", "status", "targetDelivery", "title") SELECT "branch", "clientEmail", "clientName", "clientShareToken", "createdAt", "id", "lastUpdatedAt", "notes", "pmId", "startDate", "status", "targetDelivery", "title" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_clientShareToken_key" ON "Project"("clientShareToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
