ALTER TABLE "rooms" ADD CONSTRAINT "rooms_parentRoomId_fkey" FOREIGN KEY ("parentRoomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "room_status_events" ADD CONSTRAINT "room_status_events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketingEvent" ADD CONSTRAINT "MarketingEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketingWorkflowRun" ADD CONSTRAINT "MarketingWorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "MarketingWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "upsell_sales" ADD CONSTRAINT "upsell_sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "upsell_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "MarketingCampaign_tenantId_status_idx" ON "MarketingCampaign"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "MarketingCampaign_tenantId_channel_idx" ON "MarketingCampaign"("tenantId", "channel");
CREATE INDEX IF NOT EXISTS "MarketingEvent_tenantId_campaignId_idx" ON "MarketingEvent"("tenantId", "campaignId");
CREATE INDEX IF NOT EXISTS "MarketingEvent_tenantId_device_idx" ON "MarketingEvent"("tenantId", "device");
CREATE INDEX IF NOT EXISTS "MarketingEvent_tenantId_createdAt_idx" ON "MarketingEvent"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "MarketingSegment_tenantId_idx" ON "MarketingSegment"("tenantId");
CREATE INDEX IF NOT EXISTS "MarketingTemplate_tenantId_category_idx" ON "MarketingTemplate"("tenantId", "category");
CREATE INDEX IF NOT EXISTS "MarketingWorkflow_tenantId_active_idx" ON "MarketingWorkflow"("tenantId", "active");
CREATE INDEX IF NOT EXISTS "MarketingWorkflowRun_tenantId_workflowId_idx" ON "MarketingWorkflowRun"("tenantId", "workflowId");
CREATE INDEX IF NOT EXISTS "room_blocks_tenantId_propertyId_startDate_endDate_idx" ON "room_blocks"("tenantId", "propertyId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "room_blocks_roomId_startDate_endDate_idx" ON "room_blocks"("roomId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "room_blocks_roomTypeId_startDate_endDate_idx" ON "room_blocks"("roomTypeId", "startDate", "endDate");
