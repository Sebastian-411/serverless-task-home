-- CreateIndex
CREATE INDEX "users_role_createdAt_idx" ON "users"("role", "createdAt");

-- CreateIndex
CREATE INDEX "users_email_role_idx" ON "users"("email", "role");
