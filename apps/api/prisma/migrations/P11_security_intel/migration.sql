CREATE TABLE IF NOT EXISTS "access_reviews" (
  "id" TEXT NOT NULL, "period" TEXT NOT NULL, "operatorId" TEXT NOT NULL,
  "reviewedBy" TEXT NOT NULL, "outcome" TEXT NOT NULL, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "access_reviews_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "access_reviews_period_operator_key" ON "access_reviews"("period", "operatorId");
CREATE TABLE IF NOT EXISTS "metric_definitions" (
  "key" TEXT NOT NULL, "title" TEXT NOT NULL, "definition" TEXT NOT NULL,
  "numerator" TEXT NOT NULL, "denominator" TEXT NOT NULL, "source" TEXT NOT NULL,
  "owner" TEXT NOT NULL, "caveats" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "metric_definitions_pkey" PRIMARY KEY ("key"));
INSERT INTO "metric_definitions" ("key","title","definition","numerator","denominator","source","owner","caveats","updatedAt") VALUES
 ('mrr','Monthly recurring revenue','Sum of plan-catalogue (or contract) monthly fees for active tenants','Sum of monthly fees','1 month','billing.service computeMrr','founder','Excludes trials, one-time onboarding, usage overages (pending rates)',now()),
 ('arr','Annual run-rate','MRR x 12','MRR','x 12','billing.service','founder','Run-rate label, not recognised revenue',now()),
 ('collection_rate','Collection rate','Collected total / invoiced total','Paid invoice total','All issued invoice total','invoices table','founder','Platform invoices only',now()),
 ('logo_churn','Logo churn','Lost paying tenants / opening paying tenants','Lost paying tenants in period','Opening paying tenants','not yet measurable','founder','Not yet measurable - no dated change events. Shown as not-yet-measurable until event sources exist.',now()),
 ('activation','Activation','Signed -> first live reservation + first payment + training + go-live','Days to activation','1','not yet measurable','founder','Define per onboarding checklist completion',now())
ON CONFLICT ("key") DO NOTHING;
