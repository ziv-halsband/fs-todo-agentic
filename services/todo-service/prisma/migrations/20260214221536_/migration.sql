-- CreateTable
CREATE TABLE "todos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "todos_user_id_idx" ON "todos"("user_id");

-- CreateIndex
CREATE INDEX "todos_completed_idx" ON "todos"("completed");

-- CreateIndex
CREATE INDEX "todos_created_at_idx" ON "todos"("created_at");
