-- AlterTable
ALTER TABLE "MarketingCampaign" ADD COLUMN     "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "channel" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "segmentId" TEXT,
ADD COLUMN     "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MarketingEvent" ADD COLUMN     "campaignId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "device" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "segmentId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD CONSTRAINT "MarketingEvent_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MarketingSegment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criteria" JSONB NOT NULL,
ADD COLUMN     "guestCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "MarketingSegment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MarketingTemplate" ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "MarketingTemplate_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MarketingWorkflow" ADD COLUMN     "actions" JSONB NOT NULL,
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "runCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "trigger" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "MarketingWorkflow_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MarketingWorkflowRun" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "detail" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'success',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "workflowId" TEXT NOT NULL,
ADD CONSTRAINT "MarketingWorkflowRun_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TenantReportRun" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "definitionKey" TEXT NOT NULL,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "params" JSONB NOT NULL,
ADD COLUMN     "result" JSONB,
ADD COLUMN     "rowCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "TenantReportRun_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TenantScheduledReport" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "dayOfMonth" INTEGER,
ADD COLUMN     "dayOfWeek" INTEGER,
ADD COLUMN     "definitionKey" TEXT NOT NULL,
ADD COLUMN     "frequency" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "nextRunAt" TIMESTAMP(3),
ADD COLUMN     "params" JSONB NOT NULL,
ADD COLUMN     "recipients" TEXT[],
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "timeOfDay" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "TenantScheduledReport_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "audience" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'published',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "environment" TEXT NOT NULL DEFAULT 'production',
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "keyHash" TEXT NOT NULL,
ADD COLUMN     "keyPrefix" TEXT NOT NULL,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "rateLimit" TEXT NOT NULL DEFAULT '1000/min',
ADD COLUMN     "revokeReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedBy" TEXT,
ADD COLUMN     "scopes" TEXT[],
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ar_invoice_counters" ADD COLUMN     "lastNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "ar_invoice_counters_pkey" PRIMARY KEY ("tenantId");

-- AlterTable
ALTER TABLE "ar_invoice_items" ADD COLUMN     "amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "folioId" TEXT,
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "invoiceId" TEXT NOT NULL,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
ADD CONSTRAINT "ar_invoice_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ar_invoices" ADD COLUMN     "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "corporateAccountId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "dueDate" DATE NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastReminderAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "subtotal" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "total" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vatAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
ADD CONSTRAINT "ar_invoices_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ar_payments" ADD COLUMN     "amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "corporateAccountId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'bank_transfer',
ADD COLUMN     "note" TEXT,
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "receivedById" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "reversalReason" TEXT,
ADD COLUMN     "reversedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'applied',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "ar_payments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entity" TEXT NOT NULL,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "userId" TEXT,
ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "canned_responses" ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "shortcut" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "canned_responses_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "chains" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "chains_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "channel_connections" ADD COLUMN     "apiKey" TEXT NOT NULL,
ADD COLUMN     "apiSecret" TEXT,
ADD COLUMN     "connectedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "disconnectedAt" TIMESTAMP(3),
ADD COLUMN     "endpoint" TEXT,
ADD COLUMN     "hotelId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncStatus" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "channel_connections_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "channel_mappings" ADD COLUMN     "channelConnectionId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "externalRatePlanId" TEXT,
ADD COLUMN     "externalRoomTypeId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "ratePlanId" TEXT,
ADD COLUMN     "roomTypeId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "channel_mappings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "channel_push_log" ADD COLUMN     "connectionId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "latencyMs" INTEGER NOT NULL,
ADD COLUMN     "payload" JSONB NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ok',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "channel_push_log_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "authorName" TEXT NOT NULL,
ADD COLUMN     "authorType" TEXT NOT NULL,
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "threadId" TEXT NOT NULL,
ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "chat_threads" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "unreadForGuest" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unreadForStaff" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "concierge_items" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "flightNumber" TEXT,
ADD COLUMN     "folioItemId" TEXT,
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "postedToFolio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "roomId" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "tripStatus" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "concierge_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "corporate_accounts" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingContact" TEXT,
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creditLimit" DECIMAL(12,2),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "negotiatedRate" DECIMAL(10,2),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "scClientId" TEXT,
ADD COLUMN     "taxNumber" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "corporate_accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "relatedId" TEXT,
ADD COLUMN     "relatedType" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'queued',
ADD COLUMN     "subject" TEXT NOT NULL,
ADD COLUMN     "template" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "to" TEXT NOT NULL,
ADD CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "failed_jobs" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "failReason" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "jobId" TEXT NOT NULL,
ADD COLUMN     "jobName" TEXT NOT NULL,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "queue" TEXT NOT NULL,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "retriedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "failed_jobs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "folio_items" ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "folioId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "movedAt" TIMESTAMP(3),
ADD COLUMN     "movedBy" TEXT,
ADD COLUMN     "movedFromFolioId" TEXT,
ADD COLUMN     "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "type" TEXT NOT NULL,
ADD CONSTRAINT "folio_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "folio_split_requests" ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "appliedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "folioId" TEXT,
ADD COLUMN     "fromGuestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "toEmail" TEXT,
ADD COLUMN     "toName" TEXT NOT NULL,
ADD COLUMN     "toPhone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "folio_split_requests_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "folios" ADD COLUMN     "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedBy" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isMaster" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "totalCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalPayments" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "folios_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "group_charges" ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'misc',
ADD CONSTRAINT "group_charges_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "group_events" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "guests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "startTime" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'tentative',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "venue" TEXT,
ADD CONSTRAINT "group_events_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "group_payments" ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "method" TEXT NOT NULL DEFAULT 'bank_transfer',
ADD COLUMN     "note" TEXT,
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reference" TEXT,
ADD CONSTRAINT "group_payments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "group_room_blocks" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "rate" DECIMAL(10,2),
ADD COLUMN     "roomTypeId" TEXT NOT NULL,
ADD COLUMN     "roomsBlocked" INTEGER NOT NULL,
ADD CONSTRAINT "group_room_blocks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "arrivalDate" DATE NOT NULL,
ADD COLUMN     "blockType" TEXT NOT NULL DEFAULT 'courtesy',
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "cutOffDate" DATE,
ADD COLUMN     "departureDate" DATE NOT NULL,
ADD COLUMN     "eventSpace" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "rate" DECIMAL(10,2),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'prospect',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_checkin_sessions" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "depositAmount" DECIMAL(10,2),
ADD COLUMN     "depositReference" TEXT,
ADD COLUMN     "depositRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "idDocKey" TEXT,
ADD COLUMN     "idDocNumber" TEXT,
ADD COLUMN     "idDocType" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "selfieKey" TEXT,
ADD COLUMN     "signatureKey" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'started',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "guest_checkin_sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_documents" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "issueDate" TIMESTAMP(3),
ADD COLUMN     "issuedBy" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT,
ADD CONSTRAINT "guest_documents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_follow_ups" ADD COLUMN     "assigneeId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "doneAt" TIMESTAMP(3),
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD CONSTRAINT "guest_follow_ups_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_identity_groups" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "guest_identity_groups_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_identity_members" ADD COLUMN     "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "guest_identity_members_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_notes" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "guest_notes_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_order_items" ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "menuItemId" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "unitPrice" DECIMAL(10,2) NOT NULL,
ADD CONSTRAINT "guest_order_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_orders" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "folioId" TEXT,
ADD COLUMN     "folioItemId" TEXT,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'received',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "total" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "guest_orders_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_payment_methods" ADD COLUMN     "authorizationCode" TEXT NOT NULL,
ADD COLUMN     "bank" TEXT,
ADD COLUMN     "cardExpMonth" TEXT,
ADD COLUMN     "cardExpYear" TEXT,
ADD COLUMN     "cardLast4" TEXT NOT NULL,
ADD COLUMN     "cardType" TEXT,
ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'card',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paystackCustomerCode" TEXT,
ADD COLUMN     "reusable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "guest_payment_methods_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_preferences" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "value" TEXT NOT NULL,
ADD CONSTRAINT "guest_preferences_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_segment_memberships" ADD COLUMN     "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "segmentId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "guest_segment_memberships_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_segments" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "memberCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "rule" JSONB NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "guest_segments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guest_vehicles" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isElectric" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "make" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "plate" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "guest_vehicles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "guests" ADD COLUMN     "address" TEXT,
ADD COLUMN     "blacklistReason" TEXT,
ADD COLUMN     "blacklisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "corporateAccountId" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "doNotDisturb" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "passportNumber" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vipStatus" TEXT,
ADD CONSTRAINT "guests_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "housekeeping_tasks" ADD COLUMN     "actualDuration" INTEGER,
ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "checklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "estimatedDuration" INTEGER,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "inspectorId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "roomId" TEXT NOT NULL,
ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'cleaning',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD CONSTRAINT "housekeeping_tasks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "idempotency_keys" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "requestBody" JSONB,
ADD COLUMN     "requestPath" TEXT,
ADD COLUMN     "response" JSONB,
ADD COLUMN     "scope" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "inventory_allocations" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "releasedAt" TIMESTAMP(3),
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "roomTypeId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "inventory_allocations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "inventory_daily_cache" ADD COLUMN     "adjustment" INTEGER NOT NULL,
ADD COLUMN     "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "held" INTEGER NOT NULL,
ADD COLUMN     "occupied" INTEGER NOT NULL,
ADD COLUMN     "ooo" INTEGER NOT NULL,
ADD COLUMN     "overbookingLimit" INTEGER NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "remaining" INTEGER NOT NULL,
ADD COLUMN     "roomTypeId" TEXT NOT NULL,
ADD COLUMN     "sellable" INTEGER NOT NULL,
ADD COLUMN     "total" INTEGER NOT NULL,
ADD CONSTRAINT "inventory_daily_cache_pkey" PRIMARY KEY ("propertyId", "roomTypeId", "date");

-- AlterTable
ALTER TABLE "inventory_overbooking" ADD COLUMN     "limit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roomTypeId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedById" TEXT,
ADD CONSTRAINT "inventory_overbooking_pkey" PRIMARY KEY ("roomTypeId");

-- AlterTable
ALTER TABLE "inventory_restrictions" ADD COLUMN     "adjustment" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "closeToArrival" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "closeToDeparture" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "roomTypeId" TEXT NOT NULL,
ADD COLUMN     "stopSell" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedById" TEXT,
ADD CONSTRAINT "inventory_restrictions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "invoice_counters" ADD COLUMN     "lastNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("tenantId");

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "baseAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "dueDate" DATE NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "items" JSONB,
ADD COLUMN     "overageAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "periodEnd" DATE NOT NULL,
ADD COLUMN     "periodStart" DATE NOT NULL,
ADD COLUMN     "plan" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "loyalty_configs" ADD COLUMN     "chainId" TEXT,
ADD COLUMN     "earnRate" DECIMAL(10,4) NOT NULL DEFAULT 1,
ADD COLUMN     "redeemValue" DECIMAL(10,4) NOT NULL DEFAULT 0.1,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "tiers" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "loyalty_configs_pkey" PRIMARY KEY ("tenantId");

-- AlterTable
ALTER TABLE "loyalty_redemptions" ADD COLUMN     "conciergeItemId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "pointsCost" INTEGER NOT NULL,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "rewardId" TEXT NOT NULL,
ADD COLUMN     "rewardName" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "loyalty_redemptions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "loyalty_rewards" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "pointsCost" INTEGER NOT NULL,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "loyalty_rewards_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "loyalty_transactions" ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "balance" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'Manual',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "meal_plan_assignments" ADD COLUMN     "adults" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dailyRate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "endDate" DATE NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "mealPlanId" TEXT NOT NULL,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "startDate" DATE NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "meal_plan_assignments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "meal_plan_postings" ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "assignmentId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "folioItemId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "meal_plan_postings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "meal_plans" ADD COLUMN     "autoPost" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "boardBasis" TEXT NOT NULL DEFAULT 'BB',
ADD COLUMN     "childUnder12" TEXT NOT NULL DEFAULT '50',
ADD COLUMN     "childUnder16" TEXT NOT NULL DEFAULT '75',
ADD COLUMN     "childUnder6" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" DATE,
ADD COLUMN     "exclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "inclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "postTime" TEXT NOT NULL DEFAULT '06:00',
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "restaurantId" TEXT,
ADD COLUMN     "seasonality" TEXT NOT NULL DEFAULT 'year-round',
ADD COLUMN     "startDate" DATE,
ADD COLUMN     "taxInclusive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "availableFrom" TEXT NOT NULL DEFAULT '00:00',
ADD COLUMN     "availableTo" TEXT NOT NULL DEFAULT '23:59',
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "minibar_checks" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "folioItemId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "items" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "loggedById" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "roomId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'logged',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "totalMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "minibar_checks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "night_audit_schedules" ADD COLUMN     "autoRun" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "nextRunAt" TIMESTAMP(3),
ADD COLUMN     "notifyEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "scheduledTime" TEXT NOT NULL DEFAULT '02:00',
ADD COLUMN     "steps" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "night_audit_schedules_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "night_audits" ADD COLUMN     "auditDate" DATE NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "results" JSONB,
ADD COLUMN     "runBy" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'in_progress',
ADD COLUMN     "steps" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "night_audits_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "actionLabel" TEXT,
ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deliveredVia" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT,
ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "onboarding_import_rows" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "importId" TEXT NOT NULL,
ADD COLUMN     "rowNumber" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD CONSTRAINT "onboarding_import_rows_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "onboarding_imports" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "errors" JSONB,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "mapping" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "stats" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'csv',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "onboarding_imports_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "parking_assignments" ADD COLUMN     "assignedBy" TEXT,
ADD COLUMN     "bayId" TEXT NOT NULL,
ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "plateAtCheckin" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "scheduledFor" DATE NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'scheduled',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "valet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "valetInstructions" TEXT,
ADD COLUMN     "valetKeyLocation" TEXT,
ADD COLUMN     "vehicleId" TEXT NOT NULL,
ADD CONSTRAINT "parking_assignments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "parking_bays" ADD COLUMN     "chargingStatus" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "evCharger" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'available',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "zone" TEXT NOT NULL DEFAULT 'standard',
ADD CONSTRAINT "parking_bays_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "password_resets" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "tokenHash" TEXT NOT NULL,
ADD COLUMN     "usedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "payment_requests" ADD COLUMN     "amountMinor" INTEGER NOT NULL,
ADD COLUMN     "autoCancelAt" TIMESTAMP(3),
ADD COLUMN     "autoCancelEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "depositPercent" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "folioId" TEXT,
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "hostedUrl" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "nextReminderAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "paystackOfflineRef" TEXT,
ADD COLUMN     "paystackRequestCode" TEXT,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "reminderOffsetsHours" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "remindersSent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reservationCancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "amountMinor" INTEGER NOT NULL,
ADD COLUMN     "authorizationCode" TEXT,
ADD COLUMN     "cardBrand" TEXT,
ADD COLUMN     "cardLast4" TEXT,
ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'card',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "feeMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "folioId" TEXT,
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paystackId" INTEGER,
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "postedToFolio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "refundedMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "resource" TEXT NOT NULL,
ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "pricing_rules" ADD COLUMN     "adjustment" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "conditions" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "pricing_suggestions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentRate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "occupancyPct" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "rationale" TEXT NOT NULL,
ADD COLUMN     "roomTypeId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "suggestedRate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "pricing_suggestions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "address" TEXT,
ADD COLUMN     "billClosingRule" TEXT NOT NULL DEFAULT 'always',
ADD COLUMN     "billClosingWindowHours" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "chainId" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "currentBusinessDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "tomsaLevyEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tomsaLevyPct" DECIMAL(5,2) NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vatNumber" TEXT,
ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "property_templates" ADD COLUMN     "config" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isChainStandard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "property_templates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "push_subscriptions" ADD COLUMN     "auth" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endpoint" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "p256dh" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "rate_overrides" ADD COLUMN     "baseRate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "effectiveRate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "ratePlanId" TEXT NOT NULL,
ADD COLUMN     "ruleId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "rate_overrides_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "rate_plans" ADD COLUMN     "advanceDays" INTEGER,
ADD COLUMN     "baseRate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "calculationMethod" TEXT NOT NULL DEFAULT 'fixed',
ADD COLUMN     "calculationValue" DECIMAL(10,2),
ADD COLUMN     "closeToArrival" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "closeToDeparture" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "commissionPct" DECIMAL(5,2),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "maxStay" INTEGER,
ADD COLUMN     "minStay" INTEGER,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "parentRatePlanId" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "roomTypeId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "rate_plans_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "rate_restriction_suggestions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'stop_sell',
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "roomTypeId" TEXT NOT NULL,
ADD COLUMN     "ruleId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "rate_restriction_suggestions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedReason" TEXT,
ADD COLUMN     "tokenHash" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "report_runs" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "reportId" TEXT NOT NULL,
ADD COLUMN     "rowCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "report_templates" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'custom',
ADD COLUMN     "config" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fields" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'custom',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "reservation_companions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "relationship" TEXT,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "sharesFolio" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "reservation_companions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "reservation_modification_requests" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "payload" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "reservation_modification_requests_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "reservation_stays" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "rate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "roomId" TEXT NOT NULL,
ADD CONSTRAINT "reservation_stays_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "reservation_traces" ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "department" TEXT NOT NULL DEFAULT 'front_desk',
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedBy" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "reservation_traces_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "adults" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "arrivalDate" DATE NOT NULL,
ADD COLUMN     "balance" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "checkedInBy" TEXT,
ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "checkedOutBy" TEXT,
ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "confirmationNumber" TEXT NOT NULL,
ADD COLUMN     "confirmationSentAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "departureDate" DATE NOT NULL,
ADD COLUMN     "depositDue" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "depositPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "doNotMove" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eta" TEXT,
ADD COLUMN     "fixedRoom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "guaranteed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "houseUse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "marketSegment" TEXT,
ADD COLUMN     "nights" INTEGER NOT NULL,
ADD COLUMN     "noShowAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "preArrivalSentAt" TIMESTAMP(3),
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "ratePlanId" TEXT,
ADD COLUMN     "roomTypeId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'direct',
ADD COLUMN     "specialRequests" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'confirmed',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "cuisine" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "operatingHours" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'main',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "guestName" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedById" TEXT,
ADD COLUMN     "moderationNote" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "rating" INTEGER NOT NULL,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "role_assignments" ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "assignedBy" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "roleId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "role_permissions" ADD COLUMN     "conditions" JSONB,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "permissionId" TEXT NOT NULL,
ADD COLUMN     "roleId" TEXT NOT NULL,
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'custom',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "room_status_events" ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "field" TEXT NOT NULL,
ADD COLUMN     "from" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "roomId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "to" TEXT NOT NULL,
ADD CONSTRAINT "room_status_events_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "room_types" ADD COLUMN     "baseOccupancy" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "maxOccupancy" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "room_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "floor" TEXT,
ADD COLUMN     "housekeepingStatus" TEXT NOT NULL DEFAULT 'ready',
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "parentRoomId" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "roomTypeId" TEXT NOT NULL,
ADD COLUMN     "serviceReason" TEXT,
ADD COLUMN     "serviceStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'clean',
ADD COLUMN     "statusChangedAt" TIMESTAMP(3),
ADD COLUMN     "statusChangedBy" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sc_activities" ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD CONSTRAINT "sc_activities_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sc_av_packages" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "items" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "sc_av_packages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sc_beos" ADD COLUMN     "additionalServices" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "avId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "decor" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "eventDate" DATE NOT NULL,
ADD COLUMN     "eventId" TEXT NOT NULL,
ADD COLUMN     "guestCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "logistics" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "menuId" TEXT,
ADD COLUMN     "priceOverrides" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "setupId" TEXT,
ADD COLUMN     "signatures" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "snapshots" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "specialInstructions" TEXT,
ADD COLUMN     "startTime" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "venueId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD CONSTRAINT "sc_beos_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sc_clients" ADD COLUMN     "accountManagerId" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "clientSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "primaryContact" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'corporate',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "sc_clients_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sc_decor_options" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'each',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "sc_decor_options_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sc_events" ADD COLUMN     "budget" DECIMAL(12,2),
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "eventDate" DATE NOT NULL,
ADD COLUMN     "guestCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "probability" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'direct',
ADD COLUMN     "startTime" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'lead',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'corporate',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "sc_events_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sc_menu_packages" ADD COLUMN     "courses" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "pricePerPerson" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "sc_menu_packages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sc_setup_styles" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "sc_setup_styles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sc_venues" ADD COLUMN     "areaSqm" INTEGER,
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "rentalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "sc_venues_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "scheduled_reports" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "format" TEXT NOT NULL,
ADD COLUMN     "frequency" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "nextRunAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "parameters" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "recipients" TEXT[],
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "templateId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "support_case_counters" ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "lastNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "support_case_counters_pkey" PRIMARY KEY ("key");

-- AlterTable
ALTER TABLE "support_case_messages" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "authorName" TEXT NOT NULL,
ADD COLUMN     "authorType" TEXT NOT NULL,
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "caseId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isInternal" BOOLEAN NOT NULL DEFAULT false,
ADD CONSTRAINT "support_case_messages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "support_cases" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "firstResponseAt" TIMESTAMP(3),
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "satisfactionRating" INTEGER,
ADD COLUMN     "slaResolveDueAt" TIMESTAMP(3),
ADD COLUMN     "slaResponseDueAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'tenant',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open',
ADD COLUMN     "subject" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "support_cases_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "task_rules" ADD COLUMN     "action" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "conditions" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "config" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "lastRunCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "trigger" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "task_rules_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedBy" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "pushAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pushChannel" TEXT,
ADD COLUMN     "pushSentAt" TIMESTAMP(3),
ADD COLUMN     "pushToken" TEXT,
ADD COLUMN     "pushTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "roomId" TEXT,
ADD COLUMN     "ruleAudit" JSONB,
ADD COLUMN     "ruleId" TEXT,
ADD COLUMN     "ruleKey" TEXT,
ADD COLUMN     "slaBreached" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaMinutes" INTEGER,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tax_invoice_items" ADD COLUMN     "amountEx" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "invoiceId" TEXT NOT NULL,
ADD COLUMN     "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
ADD COLUMN     "unitPriceEx" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
ADD CONSTRAINT "tax_invoice_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tax_invoices" ADD COLUMN     "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "folioId" TEXT,
ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "guestName" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "originalId" TEXT,
ADD COLUMN     "originalNumber" TEXT,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "pdfPath" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "propertyName" TEXT NOT NULL,
ADD COLUMN     "propertyVatNo" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open',
ADD COLUMN     "subtotalExVat" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "totalInclVat" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vatAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
ADD CONSTRAINT "tax_invoices_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'trial',
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ticket_counters" ADD COLUMN     "lastNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "ticket_counters_pkey" PRIMARY KEY ("tenantId");

-- AlterTable
ALTER TABLE "ticket_messages" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "authorName" TEXT NOT NULL,
ADD COLUMN     "authorType" TEXT NOT NULL,
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isInternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ticketId" TEXT NOT NULL,
ADD CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "escalationLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "firstResponseAt" TIMESTAMP(3),
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "satisfactionComment" TEXT,
ADD COLUMN     "satisfactionRating" INTEGER,
ADD COLUMN     "slaBreached" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaResolveDueAt" TIMESTAMP(3),
ADD COLUMN     "slaResponseDueAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'guest_portal',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open',
ADD COLUMN     "subject" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tomsa_levy_postings" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "folioId" TEXT NOT NULL,
ADD COLUMN     "folioItemId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "levyAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "levyPct" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "roomCharges" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "tomsa_levy_postings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "upsell_products" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'extra',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "taxInclusive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "upsell_products_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "upsell_sales" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "folioItemId" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "soldById" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "total" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "unitPrice" DECIMAL(10,2) NOT NULL,
ADD CONSTRAINT "upsell_sales_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "usage_records" ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "metric" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "lastPropertyId" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'staff',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discountPercent" INTEGER NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxUses" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "uses" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "room_blocks";

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

-- CreateIndex
CREATE INDEX "TenantReportRun_tenantId_createdAt_idx" ON "TenantReportRun"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantReportRun_tenantId_definitionKey_idx" ON "TenantReportRun"("tenantId", "definitionKey");

-- CreateIndex
CREATE INDEX "TenantScheduledReport_tenantId_isActive_nextRunAt_idx" ON "TenantScheduledReport"("tenantId", "isActive", "nextRunAt");

-- CreateIndex
CREATE INDEX "announcements_tenantId_status_idx" ON "announcements"("tenantId", "status");

-- CreateIndex
CREATE INDEX "api_keys_tenantId_idx" ON "api_keys"("tenantId");

-- CreateIndex
CREATE INDEX "api_keys_keyPrefix_idx" ON "api_keys"("keyPrefix");

-- CreateIndex
CREATE INDEX "api_keys_status_idx" ON "api_keys"("status");

-- CreateIndex
CREATE INDEX "ar_invoice_items_invoiceId_idx" ON "ar_invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "ar_invoices_tenantId_status_idx" ON "ar_invoices"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ar_invoices_corporateAccountId_status_idx" ON "ar_invoices"("corporateAccountId", "status");

-- CreateIndex
CREATE INDEX "ar_invoices_tenantId_dueDate_idx" ON "ar_invoices"("tenantId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ar_invoices_tenantId_number_key" ON "ar_invoices"("tenantId", "number");

-- CreateIndex
CREATE INDEX "ar_payments_tenantId_corporateAccountId_idx" ON "ar_payments"("tenantId", "corporateAccountId");

-- CreateIndex
CREATE INDEX "ar_payments_tenantId_receivedAt_idx" ON "ar_payments"("tenantId", "receivedAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "canned_responses_tenantId_category_idx" ON "canned_responses"("tenantId", "category");

-- CreateIndex
CREATE INDEX "chains_tenantId_idx" ON "chains"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "chains_tenantId_slug_key" ON "chains"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "channel_connections_tenantId_idx" ON "channel_connections"("tenantId");

-- CreateIndex
CREATE INDEX "channel_connections_propertyId_idx" ON "channel_connections"("propertyId");

-- CreateIndex
CREATE INDEX "channel_connections_status_idx" ON "channel_connections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "channel_connections_tenantId_propertyId_provider_hotelId_key" ON "channel_connections"("tenantId", "propertyId", "provider", "hotelId");

-- CreateIndex
CREATE INDEX "channel_mappings_channelConnectionId_idx" ON "channel_mappings"("channelConnectionId");

-- CreateIndex
CREATE INDEX "channel_push_log_connectionId_createdAt_idx" ON "channel_push_log"("connectionId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_threadId_createdAt_idx" ON "chat_messages"("threadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_threadId_clientId_key" ON "chat_messages"("threadId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_threads_reservationId_key" ON "chat_threads"("reservationId");

-- CreateIndex
CREATE INDEX "chat_threads_tenantId_status_idx" ON "chat_threads"("tenantId", "status");

-- CreateIndex
CREATE INDEX "concierge_items_tenantId_status_idx" ON "concierge_items"("tenantId", "status");

-- CreateIndex
CREATE INDEX "concierge_items_propertyId_status_scheduledAt_idx" ON "concierge_items"("propertyId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "concierge_items_type_idx" ON "concierge_items"("type");

-- CreateIndex
CREATE INDEX "concierge_items_reservationId_idx" ON "concierge_items"("reservationId");

-- CreateIndex
CREATE INDEX "concierge_items_guestId_idx" ON "concierge_items"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "concierge_items_tenantId_dedupeKey_key" ON "concierge_items"("tenantId", "dedupeKey");

-- CreateIndex
CREATE INDEX "corporate_accounts_tenantId_scClientId_idx" ON "corporate_accounts"("tenantId", "scClientId");

-- CreateIndex
CREATE INDEX "corporate_accounts_tenantId_name_idx" ON "corporate_accounts"("tenantId", "name");

-- CreateIndex
CREATE INDEX "email_logs_tenantId_createdAt_idx" ON "email_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_relatedType_relatedId_idx" ON "email_logs"("relatedType", "relatedId");

-- CreateIndex
CREATE INDEX "failed_jobs_status_idx" ON "failed_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "failed_jobs_queue_jobId_key" ON "failed_jobs"("queue", "jobId");

-- CreateIndex
CREATE INDEX "folio_items_folioId_idx" ON "folio_items"("folioId");

-- CreateIndex
CREATE INDEX "folio_split_requests_tenantId_status_idx" ON "folio_split_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "folio_split_requests_reservationId_idx" ON "folio_split_requests"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "folios_reservationId_key" ON "folios"("reservationId");

-- CreateIndex
CREATE INDEX "folios_status_idx" ON "folios"("status");

-- CreateIndex
CREATE INDEX "folios_tenantId_status_createdAt_idx" ON "folios"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "group_charges_groupId_idx" ON "group_charges"("groupId");

-- CreateIndex
CREATE INDEX "group_events_groupId_idx" ON "group_events"("groupId");

-- CreateIndex
CREATE INDEX "group_payments_groupId_idx" ON "group_payments"("groupId");

-- CreateIndex
CREATE INDEX "group_room_blocks_groupId_idx" ON "group_room_blocks"("groupId");

-- CreateIndex
CREATE INDEX "groups_tenantId_idx" ON "groups"("tenantId");

-- CreateIndex
CREATE INDEX "groups_tenantId_propertyId_status_idx" ON "groups"("tenantId", "propertyId", "status");

-- CreateIndex
CREATE INDEX "groups_tenantId_arrivalDate_idx" ON "groups"("tenantId", "arrivalDate");

-- CreateIndex
CREATE UNIQUE INDEX "groups_tenantId_code_key" ON "groups"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "guest_checkin_sessions_reservationId_key" ON "guest_checkin_sessions"("reservationId");

-- CreateIndex
CREATE INDEX "guest_checkin_sessions_tenantId_status_idx" ON "guest_checkin_sessions"("tenantId", "status");

-- CreateIndex
CREATE INDEX "guest_checkin_sessions_propertyId_status_idx" ON "guest_checkin_sessions"("propertyId", "status");

-- CreateIndex
CREATE INDEX "guest_documents_guestId_idx" ON "guest_documents"("guestId");

-- CreateIndex
CREATE INDEX "guest_follow_ups_tenantId_assigneeId_doneAt_idx" ON "guest_follow_ups"("tenantId", "assigneeId", "doneAt");

-- CreateIndex
CREATE INDEX "guest_identity_groups_tenantId_idx" ON "guest_identity_groups"("tenantId");

-- CreateIndex
CREATE INDEX "guest_identity_members_guestId_idx" ON "guest_identity_members"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_identity_members_groupId_guestId_key" ON "guest_identity_members"("groupId", "guestId");

-- CreateIndex
CREATE INDEX "guest_notes_tenantId_guestId_createdAt_idx" ON "guest_notes"("tenantId", "guestId", "createdAt");

-- CreateIndex
CREATE INDEX "guest_notes_guestId_idx" ON "guest_notes"("guestId");

-- CreateIndex
CREATE INDEX "guest_order_items_orderId_idx" ON "guest_order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_orders_folioItemId_key" ON "guest_orders"("folioItemId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_orders_idempotencyKey_key" ON "guest_orders"("idempotencyKey");

-- CreateIndex
CREATE INDEX "guest_orders_tenantId_reservationId_idx" ON "guest_orders"("tenantId", "reservationId");

-- CreateIndex
CREATE INDEX "guest_payment_methods_tenantId_idx" ON "guest_payment_methods"("tenantId");

-- CreateIndex
CREATE INDEX "guest_payment_methods_guestId_idx" ON "guest_payment_methods"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_payment_methods_guestId_authorizationCode_key" ON "guest_payment_methods"("guestId", "authorizationCode");

-- CreateIndex
CREATE INDEX "guest_preferences_guestId_idx" ON "guest_preferences"("guestId");

-- CreateIndex
CREATE INDEX "guest_segment_memberships_tenantId_guestId_idx" ON "guest_segment_memberships"("tenantId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_segment_memberships_segmentId_guestId_key" ON "guest_segment_memberships"("segmentId", "guestId");

-- CreateIndex
CREATE INDEX "guest_segments_tenantId_isActive_idx" ON "guest_segments"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "guest_vehicles_guestId_idx" ON "guest_vehicles"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_vehicles_tenantId_plate_key" ON "guest_vehicles"("tenantId", "plate");

-- CreateIndex
CREATE INDEX "guests_tenantId_idx" ON "guests"("tenantId");

-- CreateIndex
CREATE INDEX "guests_email_idx" ON "guests"("email");

-- CreateIndex
CREATE INDEX "housekeeping_tasks_propertyId_idx" ON "housekeeping_tasks"("propertyId");

-- CreateIndex
CREATE INDEX "housekeeping_tasks_roomId_idx" ON "housekeeping_tasks"("roomId");

-- CreateIndex
CREATE INDEX "housekeeping_tasks_status_idx" ON "housekeeping_tasks"("status");

-- CreateIndex
CREATE INDEX "housekeeping_tasks_scheduledAt_idx" ON "housekeeping_tasks"("scheduledAt");

-- CreateIndex
CREATE INDEX "housekeeping_tasks_tenantId_status_scheduledAt_idx" ON "housekeeping_tasks"("tenantId", "status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_key_idx" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_scope_idx" ON "idempotency_keys"("scope");

-- CreateIndex
CREATE INDEX "idempotency_keys_expiresAt_idx" ON "idempotency_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "inventory_allocations_roomTypeId_date_idx" ON "inventory_allocations"("roomTypeId", "date");

-- CreateIndex
CREATE INDEX "inventory_allocations_tenantId_status_idx" ON "inventory_allocations"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_allocations_tenantId_dedupeKey_key" ON "inventory_allocations"("tenantId", "dedupeKey");

-- CreateIndex
CREATE INDEX "inventory_daily_cache_roomTypeId_date_idx" ON "inventory_daily_cache"("roomTypeId", "date");

-- CreateIndex
CREATE INDEX "inventory_restrictions_tenantId_propertyId_date_idx" ON "inventory_restrictions"("tenantId", "propertyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_restrictions_roomTypeId_date_key" ON "inventory_restrictions"("roomTypeId", "date");

-- CreateIndex
CREATE INDEX "invoices_tenantId_idx" ON "invoices"("tenantId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_redemptions_idempotencyKey_key" ON "loyalty_redemptions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "loyalty_redemptions_tenantId_guestId_idx" ON "loyalty_redemptions"("tenantId", "guestId");

-- CreateIndex
CREATE INDEX "loyalty_rewards_tenantId_status_idx" ON "loyalty_rewards"("tenantId", "status");

-- CreateIndex
CREATE INDEX "loyalty_transactions_tenantId_idx" ON "loyalty_transactions"("tenantId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_guestId_idx" ON "loyalty_transactions"("guestId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_tenantId_createdAt_idx" ON "loyalty_transactions"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "meal_plan_assignments_tenantId_status_idx" ON "meal_plan_assignments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "meal_plan_assignments_reservationId_idx" ON "meal_plan_assignments"("reservationId");

-- CreateIndex
CREATE INDEX "meal_plan_assignments_startDate_endDate_idx" ON "meal_plan_assignments"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "meal_plan_postings_tenantId_status_idx" ON "meal_plan_postings"("tenantId", "status");

-- CreateIndex
CREATE INDEX "meal_plan_postings_date_idx" ON "meal_plan_postings"("date");

-- CreateIndex
CREATE UNIQUE INDEX "meal_plan_postings_assignmentId_date_key" ON "meal_plan_postings"("assignmentId", "date");

-- CreateIndex
CREATE INDEX "meal_plans_tenantId_idx" ON "meal_plans"("tenantId");

-- CreateIndex
CREATE INDEX "meal_plans_propertyId_isActive_idx" ON "meal_plans"("propertyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "meal_plans_propertyId_code_key" ON "meal_plans"("propertyId", "code");

-- CreateIndex
CREATE INDEX "menu_items_tenantId_propertyId_status_idx" ON "menu_items"("tenantId", "propertyId", "status");

-- CreateIndex
CREATE INDEX "minibar_checks_tenantId_createdAt_idx" ON "minibar_checks"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "minibar_checks_roomId_idx" ON "minibar_checks"("roomId");

-- CreateIndex
CREATE INDEX "minibar_checks_reservationId_idx" ON "minibar_checks"("reservationId");

-- CreateIndex
CREATE INDEX "minibar_checks_status_idx" ON "minibar_checks"("status");

-- CreateIndex
CREATE INDEX "night_audit_schedules_tenantId_idx" ON "night_audit_schedules"("tenantId");

-- CreateIndex
CREATE INDEX "night_audit_schedules_propertyId_idx" ON "night_audit_schedules"("propertyId");

-- CreateIndex
CREATE INDEX "night_audit_schedules_nextRunAt_idx" ON "night_audit_schedules"("nextRunAt");

-- CreateIndex
CREATE INDEX "night_audit_schedules_isActive_idx" ON "night_audit_schedules"("isActive");

-- CreateIndex
CREATE INDEX "night_audits_tenantId_idx" ON "night_audits"("tenantId");

-- CreateIndex
CREATE INDEX "night_audits_propertyId_idx" ON "night_audits"("propertyId");

-- CreateIndex
CREATE INDEX "night_audits_auditDate_idx" ON "night_audits"("auditDate");

-- CreateIndex
CREATE INDEX "night_audits_status_idx" ON "night_audits"("status");

-- CreateIndex
CREATE UNIQUE INDEX "night_audits_tenantId_propertyId_auditDate_key" ON "night_audits"("tenantId", "propertyId", "auditDate");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "onboarding_import_rows_importId_idx" ON "onboarding_import_rows"("importId");

-- CreateIndex
CREATE INDEX "onboarding_imports_tenantId_createdAt_idx" ON "onboarding_imports"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "parking_assignments_tenantId_status_idx" ON "parking_assignments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "parking_assignments_propertyId_status_scheduledFor_idx" ON "parking_assignments"("propertyId", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "parking_assignments_vehicleId_idx" ON "parking_assignments"("vehicleId");

-- CreateIndex
CREATE INDEX "parking_assignments_reservationId_idx" ON "parking_assignments"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "parking_assignments_tenantId_dedupeKey_key" ON "parking_assignments"("tenantId", "dedupeKey");

-- CreateIndex
CREATE INDEX "parking_bays_tenantId_idx" ON "parking_bays"("tenantId");

-- CreateIndex
CREATE INDEX "parking_bays_propertyId_status_idx" ON "parking_bays"("propertyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "parking_bays_propertyId_label_key" ON "parking_bays"("propertyId", "label");

-- CreateIndex
CREATE INDEX "password_resets_userId_idx" ON "password_resets"("userId");

-- CreateIndex
CREATE INDEX "password_resets_tokenHash_idx" ON "password_resets"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "payment_requests_paymentId_key" ON "payment_requests"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_requests_reference_key" ON "payment_requests"("reference");

-- CreateIndex
CREATE INDEX "payment_requests_tenantId_status_idx" ON "payment_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "payment_requests_tenantId_dueDate_idx" ON "payment_requests"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "payment_requests_nextReminderAt_idx" ON "payment_requests"("nextReminderAt");

-- CreateIndex
CREATE INDEX "payment_requests_reservationId_idx" ON "payment_requests"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_tenantId_createdAt_idx" ON "payments"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_tenantId_status_type_idx" ON "payments"("tenantId", "status", "type");

-- CreateIndex
CREATE INDEX "payments_reservationId_idx" ON "payments"("reservationId");

-- CreateIndex
CREATE INDEX "payments_guestId_idx" ON "payments"("guestId");

-- CreateIndex
CREATE INDEX "payments_folioId_idx" ON "payments"("folioId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "pricing_rules_propertyId_idx" ON "pricing_rules"("propertyId");

-- CreateIndex
CREATE INDEX "pricing_suggestions_tenantId_status_idx" ON "pricing_suggestions"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_suggestions_roomTypeId_date_key" ON "pricing_suggestions"("roomTypeId", "date");

-- CreateIndex
CREATE INDEX "properties_tenantId_idx" ON "properties"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "properties_tenantId_code_key" ON "properties"("tenantId", "code");

-- CreateIndex
CREATE INDEX "property_templates_tenantId_idx" ON "property_templates"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "property_templates_tenantId_name_key" ON "property_templates"("tenantId", "name");

-- CreateIndex
CREATE INDEX "push_subscriptions_tenantId_idx" ON "push_subscriptions"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_userId_key" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "rate_overrides_propertyId_date_idx" ON "rate_overrides"("propertyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "rate_overrides_ratePlanId_date_key" ON "rate_overrides"("ratePlanId", "date");

-- CreateIndex
CREATE INDEX "rate_plans_tenantId_idx" ON "rate_plans"("tenantId");

-- CreateIndex
CREATE INDEX "rate_plans_propertyId_idx" ON "rate_plans"("propertyId");

-- CreateIndex
CREATE INDEX "rate_plans_roomTypeId_idx" ON "rate_plans"("roomTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "rate_plans_propertyId_code_key" ON "rate_plans"("propertyId", "code");

-- CreateIndex
CREATE INDEX "rate_restriction_suggestions_propertyId_status_idx" ON "rate_restriction_suggestions"("propertyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "rate_restriction_suggestions_roomTypeId_date_kind_key" ON "rate_restriction_suggestions"("roomTypeId", "date", "kind");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "report_runs_reportId_idx" ON "report_runs"("reportId");

-- CreateIndex
CREATE INDEX "report_runs_status_idx" ON "report_runs"("status");

-- CreateIndex
CREATE INDEX "report_templates_tenantId_idx" ON "report_templates"("tenantId");

-- CreateIndex
CREATE INDEX "reservation_companions_tenantId_reservationId_idx" ON "reservation_companions"("tenantId", "reservationId");

-- CreateIndex
CREATE INDEX "reservation_modification_requests_tenantId_status_idx" ON "reservation_modification_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "reservation_modification_requests_reservationId_idx" ON "reservation_modification_requests"("reservationId");

-- CreateIndex
CREATE INDEX "reservation_stays_roomId_date_idx" ON "reservation_stays"("roomId", "date");

-- CreateIndex
CREATE INDEX "reservation_stays_date_idx" ON "reservation_stays"("date");

-- CreateIndex
CREATE INDEX "reservation_stays_reservationId_idx" ON "reservation_stays"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_stays_reservationId_roomId_date_key" ON "reservation_stays"("reservationId", "roomId", "date");

-- CreateIndex
CREATE INDEX "reservation_traces_tenantId_reservationId_idx" ON "reservation_traces"("tenantId", "reservationId");

-- CreateIndex
CREATE INDEX "reservation_traces_tenantId_dueAt_idx" ON "reservation_traces"("tenantId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_confirmationNumber_key" ON "reservations"("confirmationNumber");

-- CreateIndex
CREATE INDEX "reservations_tenantId_idx" ON "reservations"("tenantId");

-- CreateIndex
CREATE INDEX "reservations_propertyId_idx" ON "reservations"("propertyId");

-- CreateIndex
CREATE INDEX "reservations_guestId_idx" ON "reservations"("guestId");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE INDEX "reservations_arrivalDate_departureDate_idx" ON "reservations"("arrivalDate", "departureDate");

-- CreateIndex
CREATE INDEX "reservations_tenantId_status_arrivalDate_idx" ON "reservations"("tenantId", "status", "arrivalDate");

-- CreateIndex
CREATE INDEX "reservations_tenantId_propertyId_status_idx" ON "reservations"("tenantId", "propertyId", "status");

-- CreateIndex
CREATE INDEX "reservations_ratePlanId_idx" ON "reservations"("ratePlanId");

-- CreateIndex
CREATE INDEX "reservations_tenantId_arrivalDate_idx" ON "reservations"("tenantId", "arrivalDate");

-- CreateIndex
CREATE INDEX "restaurants_tenantId_idx" ON "restaurants"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_propertyId_name_key" ON "restaurants"("propertyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_reservationId_key" ON "reviews"("reservationId");

-- CreateIndex
CREATE INDEX "reviews_tenantId_status_idx" ON "reviews"("tenantId", "status");

-- CreateIndex
CREATE INDEX "role_assignments_userId_idx" ON "role_assignments"("userId");

-- CreateIndex
CREATE INDEX "role_assignments_roleId_idx" ON "role_assignments"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "role_assignments_userId_roleId_propertyId_key" ON "role_assignments"("userId", "roleId", "propertyId");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId");

-- CreateIndex
CREATE INDEX "room_status_events_tenantId_propertyId_createdAt_idx" ON "room_status_events"("tenantId", "propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "room_status_events_roomId_createdAt_idx" ON "room_status_events"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "room_types_tenantId_idx" ON "room_types"("tenantId");

-- CreateIndex
CREATE INDEX "room_types_propertyId_idx" ON "room_types"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_propertyId_code_key" ON "room_types"("propertyId", "code");

-- CreateIndex
CREATE INDEX "rooms_tenantId_idx" ON "rooms"("tenantId");

-- CreateIndex
CREATE INDEX "rooms_propertyId_idx" ON "rooms"("propertyId");

-- CreateIndex
CREATE INDEX "rooms_roomTypeId_idx" ON "rooms"("roomTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_propertyId_number_key" ON "rooms"("propertyId", "number");

-- CreateIndex
CREATE INDEX "sc_activities_tenantId_createdAt_idx" ON "sc_activities"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "sc_activities_clientId_idx" ON "sc_activities"("clientId");

-- CreateIndex
CREATE INDEX "sc_activities_eventId_idx" ON "sc_activities"("eventId");

-- CreateIndex
CREATE INDEX "sc_av_packages_tenantId_idx" ON "sc_av_packages"("tenantId");

-- CreateIndex
CREATE INDEX "sc_beos_tenantId_idx" ON "sc_beos"("tenantId");

-- CreateIndex
CREATE INDEX "sc_beos_eventId_idx" ON "sc_beos"("eventId");

-- CreateIndex
CREATE INDEX "sc_clients_tenantId_idx" ON "sc_clients"("tenantId");

-- CreateIndex
CREATE INDEX "sc_decor_options_tenantId_idx" ON "sc_decor_options"("tenantId");

-- CreateIndex
CREATE INDEX "sc_events_tenantId_idx" ON "sc_events"("tenantId");

-- CreateIndex
CREATE INDEX "sc_events_tenantId_status_idx" ON "sc_events"("tenantId", "status");

-- CreateIndex
CREATE INDEX "sc_events_eventDate_idx" ON "sc_events"("eventDate");

-- CreateIndex
CREATE INDEX "sc_menu_packages_tenantId_idx" ON "sc_menu_packages"("tenantId");

-- CreateIndex
CREATE INDEX "sc_setup_styles_tenantId_idx" ON "sc_setup_styles"("tenantId");

-- CreateIndex
CREATE INDEX "sc_venues_tenantId_idx" ON "sc_venues"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "sc_venues_tenantId_code_key" ON "sc_venues"("tenantId", "code");

-- CreateIndex
CREATE INDEX "scheduled_reports_templateId_idx" ON "scheduled_reports"("templateId");

-- CreateIndex
CREATE INDEX "scheduled_reports_nextRunAt_idx" ON "scheduled_reports"("nextRunAt");

-- CreateIndex
CREATE INDEX "support_case_messages_caseId_createdAt_idx" ON "support_case_messages"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "support_cases_tenantId_status_idx" ON "support_cases"("tenantId", "status");

-- CreateIndex
CREATE INDEX "support_cases_status_priority_idx" ON "support_cases"("status", "priority");

-- CreateIndex
CREATE INDEX "support_cases_assigneeId_status_idx" ON "support_cases"("assigneeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "support_cases_number_key" ON "support_cases"("number");

-- CreateIndex
CREATE UNIQUE INDEX "task_rules_tenantId_key_key" ON "task_rules"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_pushToken_key" ON "tasks"("pushToken");

-- CreateIndex
CREATE INDEX "tasks_tenantId_status_idx" ON "tasks"("tenantId", "status");

-- CreateIndex
CREATE INDEX "tasks_tenantId_department_status_idx" ON "tasks"("tenantId", "department", "status");

-- CreateIndex
CREATE INDEX "tasks_propertyId_status_dueAt_idx" ON "tasks"("propertyId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_status_idx" ON "tasks"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "tasks_ruleId_idx" ON "tasks"("ruleId");

-- CreateIndex
CREATE INDEX "tasks_status_slaBreached_idx" ON "tasks"("status", "slaBreached");

-- CreateIndex
CREATE INDEX "tasks_tenantId_ruleId_entityType_entityId_idx" ON "tasks"("tenantId", "ruleId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_tenantId_dedupeKey_key" ON "tasks"("tenantId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "tax_invoices_paymentId_key" ON "tax_invoices"("paymentId");

-- CreateIndex
CREATE INDEX "tax_invoices_folioId_idx" ON "tax_invoices"("folioId");

-- CreateIndex
CREATE INDEX "tax_invoices_reservationId_idx" ON "tax_invoices"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_invoices_tenantId_number_key" ON "tax_invoices"("tenantId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "ticket_messages_ticketId_createdAt_idx" ON "ticket_messages"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "tickets_tenantId_status_idx" ON "tickets"("tenantId", "status");

-- CreateIndex
CREATE INDEX "tickets_tenantId_priority_idx" ON "tickets"("tenantId", "priority");

-- CreateIndex
CREATE INDEX "tickets_tenantId_assigneeId_status_idx" ON "tickets"("tenantId", "assigneeId", "status");

-- CreateIndex
CREATE INDEX "tickets_guestId_idx" ON "tickets"("guestId");

-- CreateIndex
CREATE INDEX "tickets_slaResponseDueAt_idx" ON "tickets"("slaResponseDueAt");

-- CreateIndex
CREATE INDEX "tickets_slaResolveDueAt_idx" ON "tickets"("slaResolveDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_tenantId_number_key" ON "tickets"("tenantId", "number");

-- CreateIndex
CREATE INDEX "tomsa_levy_postings_tenantId_date_idx" ON "tomsa_levy_postings"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "tomsa_levy_postings_folioId_date_key" ON "tomsa_levy_postings"("folioId", "date");

-- CreateIndex
CREATE INDEX "upsell_products_propertyId_idx" ON "upsell_products"("propertyId");

-- CreateIndex
CREATE INDEX "upsell_sales_propertyId_createdAt_idx" ON "upsell_sales"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "upsell_sales_reservationId_idx" ON "upsell_sales"("reservationId");

-- CreateIndex
CREATE INDEX "usage_records_recordedAt_idx" ON "usage_records"("recordedAt");

-- CreateIndex
CREATE INDEX "usage_records_tenantId_metric_recordedAt_idx" ON "usage_records"("tenantId", "metric", "recordedAt");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chains" ADD CONSTRAINT "chains_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "chains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_parentRoomId_fkey" FOREIGN KEY ("parentRoomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_status_events" ADD CONSTRAINT "room_status_events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_corporateAccountId_fkey" FOREIGN KEY ("corporateAccountId") REFERENCES "corporate_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_preferences" ADD CONSTRAINT "guest_preferences_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_documents" ADD CONSTRAINT "guest_documents_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_notes" ADD CONSTRAINT "guest_notes_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_notes" ADD CONSTRAINT "guest_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "rate_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_stays" ADD CONSTRAINT "reservation_stays_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_stays" ADD CONSTRAINT "reservation_stays_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folios" ADD CONSTRAINT "folios_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_items" ADD CONSTRAINT "folio_items_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "folios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_connections" ADD CONSTRAINT "channel_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_connections" ADD CONSTRAINT "channel_connections_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_mappings" ADD CONSTRAINT "channel_mappings_channelConnectionId_fkey" FOREIGN KEY ("channelConnectionId") REFERENCES "channel_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "night_audits" ADD CONSTRAINT "night_audits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "night_audits" ADD CONSTRAINT "night_audits_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "night_audit_schedules" ADD CONSTRAINT "night_audit_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "night_audit_schedules" ADD CONSTRAINT "night_audit_schedules_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "folios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_payment_methods" ADD CONSTRAINT "guest_payment_methods_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_payment_methods" ADD CONSTRAINT "guest_payment_methods_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "folios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "tax_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoice_items" ADD CONSTRAINT "tax_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "tax_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_counters" ADD CONSTRAINT "invoice_counters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "task_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_rules" ADD CONSTRAINT "task_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_rules" ADD CONSTRAINT "task_rules_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minibar_checks" ADD CONSTRAINT "minibar_checks_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minibar_checks" ADD CONSTRAINT "minibar_checks_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minibar_checks" ADD CONSTRAINT "minibar_checks_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_bays" ADD CONSTRAINT "parking_bays_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_bays" ADD CONSTRAINT "parking_bays_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_vehicles" ADD CONSTRAINT "guest_vehicles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_vehicles" ADD CONSTRAINT "guest_vehicles_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "parking_bays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "guest_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_room_blocks" ADD CONSTRAINT "group_room_blocks_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_room_blocks" ADD CONSTRAINT "group_room_blocks_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_charges" ADD CONSTRAINT "group_charges_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_payments" ADD CONSTRAINT "group_payments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_clients" ADD CONSTRAINT "sc_clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_clients" ADD CONSTRAINT "sc_clients_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_events" ADD CONSTRAINT "sc_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_events" ADD CONSTRAINT "sc_events_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_events" ADD CONSTRAINT "sc_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "sc_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_events" ADD CONSTRAINT "sc_events_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sc_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "sc_venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "sc_setup_styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "sc_menu_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_avId_fkey" FOREIGN KEY ("avId") REFERENCES "sc_av_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_venues" ADD CONSTRAINT "sc_venues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_venues" ADD CONSTRAINT "sc_venues_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_menu_packages" ADD CONSTRAINT "sc_menu_packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_av_packages" ADD CONSTRAINT "sc_av_packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_setup_styles" ADD CONSTRAINT "sc_setup_styles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_decor_options" ADD CONSTRAINT "sc_decor_options_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_activities" ADD CONSTRAINT "sc_activities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_activities" ADD CONSTRAINT "sc_activities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "sc_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sc_activities" ADD CONSTRAINT "sc_activities_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sc_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_restrictions" ADD CONSTRAINT "inventory_restrictions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_restrictions" ADD CONSTRAINT "inventory_restrictions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_restrictions" ADD CONSTRAINT "inventory_restrictions_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_daily_cache" ADD CONSTRAINT "inventory_daily_cache_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_overbooking" ADD CONSTRAINT "inventory_overbooking_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_accounts" ADD CONSTRAINT "corporate_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_accounts" ADD CONSTRAINT "corporate_accounts_scClientId_fkey" FOREIGN KEY ("scClientId") REFERENCES "sc_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_follow_ups" ADD CONSTRAINT "guest_follow_ups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_follow_ups" ADD CONSTRAINT "guest_follow_ups_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_segments" ADD CONSTRAINT "guest_segments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_segment_memberships" ADD CONSTRAINT "guest_segment_memberships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_segment_memberships" ADD CONSTRAINT "guest_segment_memberships_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "guest_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_segment_memberships" ADD CONSTRAINT "guest_segment_memberships_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_assignments" ADD CONSTRAINT "meal_plan_assignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_assignments" ADD CONSTRAINT "meal_plan_assignments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_assignments" ADD CONSTRAINT "meal_plan_assignments_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_postings" ADD CONSTRAINT "meal_plan_postings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_postings" ADD CONSTRAINT "meal_plan_postings_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "meal_plan_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_identity_groups" ADD CONSTRAINT "guest_identity_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_identity_members" ADD CONSTRAINT "guest_identity_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "guest_identity_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_identity_members" ADD CONSTRAINT "guest_identity_members_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_corporateAccountId_fkey" FOREIGN KEY ("corporateAccountId") REFERENCES "corporate_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_invoice_items" ADD CONSTRAINT "ar_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ar_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_payments" ADD CONSTRAINT "ar_payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_payments" ADD CONSTRAINT "ar_payments_corporateAccountId_fkey" FOREIGN KEY ("corporateAccountId") REFERENCES "corporate_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_payments" ADD CONSTRAINT "ar_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ar_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_invoice_counters" ADD CONSTRAINT "ar_invoice_counters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canned_responses" ADD CONSTRAINT "canned_responses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canned_responses" ADD CONSTRAINT "canned_responses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_case_messages" ADD CONSTRAINT "support_case_messages_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "support_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingEvent" ADD CONSTRAINT "MarketingEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingWorkflowRun" ADD CONSTRAINT "MarketingWorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "MarketingWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_modification_requests" ADD CONSTRAINT "reservation_modification_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_modification_requests" ADD CONSTRAINT "reservation_modification_requests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_traces" ADD CONSTRAINT "reservation_traces_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_traces" ADD CONSTRAINT "reservation_traces_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_companions" ADD CONSTRAINT "reservation_companions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_companions" ADD CONSTRAINT "reservation_companions_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_companions" ADD CONSTRAINT "reservation_companions_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_imports" ADD CONSTRAINT "onboarding_imports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_import_rows" ADD CONSTRAINT "onboarding_import_rows_importId_fkey" FOREIGN KEY ("importId") REFERENCES "onboarding_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_templates" ADD CONSTRAINT "property_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_configs" ADD CONSTRAINT "loyalty_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upsell_sales" ADD CONSTRAINT "upsell_sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "upsell_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_split_requests" ADD CONSTRAINT "folio_split_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_split_requests" ADD CONSTRAINT "folio_split_requests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_rewards" ADD CONSTRAINT "loyalty_rewards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "loyalty_rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_orders" ADD CONSTRAINT "guest_orders_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_order_items" ADD CONSTRAINT "guest_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "guest_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

