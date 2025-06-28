-- CreateIndex
CREATE INDEX "addresses_city_idx" ON "addresses"("city");

-- CreateIndex
CREATE INDEX "addresses_stateOrProvince_idx" ON "addresses"("stateOrProvince");

-- CreateIndex
CREATE INDEX "addresses_addressLine1_idx" ON "addresses"("addressLine1");

-- CreateIndex
CREATE INDEX "addresses_country_stateOrProvince_idx" ON "addresses"("country", "stateOrProvince");

-- CreateIndex
CREATE INDEX "addresses_country_city_idx" ON "addresses"("country", "city");

-- CreateIndex
CREATE INDEX "addresses_country_stateOrProvince_city_idx" ON "addresses"("country", "stateOrProvince", "city");

-- CreateIndex
CREATE INDEX "addresses_stateOrProvince_city_postalCode_idx" ON "addresses"("stateOrProvince", "city", "postalCode");

-- CreateIndex
CREATE INDEX "addresses_createdAt_idx" ON "addresses"("createdAt");

-- CreateIndex
CREATE INDEX "addresses_updatedAt_idx" ON "addresses"("updatedAt");

-- CreateIndex
CREATE INDEX "addresses_country_createdAt_idx" ON "addresses"("country", "createdAt");

-- CreateIndex
CREATE INDEX "addresses_country_stateOrProvince_createdAt_idx" ON "addresses"("country", "stateOrProvince", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE INDEX "tasks_updatedAt_idx" ON "tasks"("updatedAt");

-- CreateIndex
CREATE INDEX "tasks_completedAt_idx" ON "tasks"("completedAt");

-- CreateIndex
CREATE INDEX "tasks_title_idx" ON "tasks"("title");

-- CreateIndex
CREATE INDEX "tasks_status_dueDate_idx" ON "tasks"("status", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_priority_dueDate_idx" ON "tasks"("priority", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_userId_status_idx" ON "tasks"("userId", "status");

-- CreateIndex
CREATE INDEX "tasks_userId_priority_idx" ON "tasks"("userId", "priority");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_status_idx" ON "tasks"("assignedTo", "status");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_priority_idx" ON "tasks"("assignedTo", "priority");

-- CreateIndex
CREATE INDEX "tasks_userId_createdAt_idx" ON "tasks"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_createdAt_idx" ON "tasks"("assignedTo", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_status_createdAt_idx" ON "tasks"("status", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_status_updatedAt_idx" ON "tasks"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "tasks_priority_createdAt_idx" ON "tasks"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_dueDate_status_idx" ON "tasks"("dueDate", "status");

-- CreateIndex
CREATE INDEX "tasks_dueDate_priority_idx" ON "tasks"("dueDate", "priority");

-- CreateIndex
CREATE INDEX "tasks_userId_status_priority_idx" ON "tasks"("userId", "status", "priority");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_status_priority_idx" ON "tasks"("assignedTo", "status", "priority");

-- CreateIndex
CREATE INDEX "tasks_status_priority_dueDate_idx" ON "tasks"("status", "priority", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_createdAt_status_priority_idx" ON "tasks"("createdAt", "status", "priority");

-- CreateIndex
CREATE INDEX "tasks_userId_dueDate_status_idx" ON "tasks"("userId", "dueDate", "status");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_dueDate_status_idx" ON "tasks"("assignedTo", "dueDate", "status");

-- CreateIndex
CREATE INDEX "tasks_completedAt_status_idx" ON "tasks"("completedAt", "status");

-- CreateIndex
CREATE INDEX "tasks_userId_completedAt_idx" ON "tasks"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_completedAt_idx" ON "tasks"("assignedTo", "completedAt");

-- CreateIndex
CREATE INDEX "tasks_status_completedAt_createdAt_idx" ON "tasks"("status", "completedAt", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_title_status_idx" ON "tasks"("title", "status");

-- CreateIndex
CREATE INDEX "tasks_title_priority_idx" ON "tasks"("title", "priority");

-- CreateIndex
CREATE INDEX "tasks_userId_title_idx" ON "tasks"("userId", "title");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_title_idx" ON "tasks"("assignedTo", "title");

-- CreateIndex
CREATE INDEX "users_updatedAt_idx" ON "users"("updatedAt");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE INDEX "users_phoneNumber_idx" ON "users"("phoneNumber");

-- CreateIndex
CREATE INDEX "users_role_updatedAt_idx" ON "users"("role", "updatedAt");

-- CreateIndex
CREATE INDEX "users_createdAt_role_idx" ON "users"("createdAt", "role");

-- CreateIndex
CREATE INDEX "users_role_name_idx" ON "users"("role", "name");

-- CreateIndex
CREATE INDEX "users_addressId_role_idx" ON "users"("addressId", "role");

-- CreateIndex
CREATE INDEX "users_createdAt_updatedAt_idx" ON "users"("createdAt", "updatedAt");

-- CreateIndex
CREATE INDEX "users_role_createdAt_updatedAt_idx" ON "users"("role", "createdAt", "updatedAt");
