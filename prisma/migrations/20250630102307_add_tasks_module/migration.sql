-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_idx" ON "tasks"("assignedTo");

-- CreateIndex
CREATE INDEX "tasks_createdBy_idx" ON "tasks"("createdBy");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE INDEX "tasks_createdAt_idx" ON "tasks"("createdAt");

-- CreateIndex
CREATE INDEX "tasks_updatedAt_idx" ON "tasks"("updatedAt");

-- CreateIndex
CREATE INDEX "tasks_status_priority_idx" ON "tasks"("status", "priority");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_status_idx" ON "tasks"("assignedTo", "status");

-- CreateIndex
CREATE INDEX "tasks_createdBy_status_idx" ON "tasks"("createdBy", "status");

-- CreateIndex
CREATE INDEX "tasks_dueDate_status_idx" ON "tasks"("dueDate", "status");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_priority_idx" ON "tasks"("assignedTo", "priority");

-- CreateIndex
CREATE INDEX "tasks_createdBy_priority_idx" ON "tasks"("createdBy", "priority");

-- CreateIndex
CREATE INDEX "tasks_status_createdAt_idx" ON "tasks"("status", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_priority_createdAt_idx" ON "tasks"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_createdAt_status_idx" ON "tasks"("createdAt", "status");

-- CreateIndex
CREATE INDEX "tasks_updatedAt_status_idx" ON "tasks"("updatedAt", "status");

-- CreateIndex
CREATE INDEX "tasks_dueDate_priority_idx" ON "tasks"("dueDate", "priority");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_createdBy_idx" ON "tasks"("assignedTo", "createdBy");

-- CreateIndex
CREATE INDEX "tasks_status_priority_dueDate_idx" ON "tasks"("status", "priority", "dueDate");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
