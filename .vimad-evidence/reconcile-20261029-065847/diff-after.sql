-- CreateIndex
CREATE INDEX "MarketingCampaign_tenantId_status_idx" ON "MarketingCampaign"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MarketingCampaign_tenantId_channel_idx" ON "MarketingCampaign"("tenantId", "channel");

-- CreateIndex
CREATE INDEX "MarketingEvent_tenantId_campaignId_idx" ON "MarketingEvent"("tenantId", "campaignId");

-- CreateIndex
CREATE INDEX "MarketingEvent_tenantId_device_idx" ON "MarketingEvent"("tenantId", "device");

-- CreateIndex
CREATE INDEX "MarketingEvent_tenantId_createdAt_idx" ON "MarketingEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketingSegment_tenantId_idx" ON "MarketingSegment"("tenantId");

-- CreateIndex
CREATE INDEX "MarketingTemplate_tenantId_category_idx" ON "MarketingTemplate"("tenantId", "category");

-- CreateIndex
CREATE INDEX "MarketingWorkflow_tenantId_active_idx" ON "MarketingWorkflow"("tenantId", "active");

-- CreateIndex
CREATE INDEX "MarketingWorkflowRun_tenantId_workflowId_idx" ON "MarketingWorkflowRun"("tenantId", "workflowId");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_parentRoomId_fkey" FOREIGN KEY ("parentRoomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_status_events" ADD CONSTRAINT "room_status_events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingEvent" ADD CONSTRAINT "MarketingEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingWorkflowRun" ADD CONSTRAINT "MarketingWorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "MarketingWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upsell_sales" ADD CONSTRAINT "upsell_sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "upsell_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

