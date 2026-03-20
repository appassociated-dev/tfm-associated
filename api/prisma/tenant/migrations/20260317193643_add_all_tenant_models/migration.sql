-- CreateTable
CREATE TABLE "member_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "age_range_min" INTEGER,
    "age_range_max" INTEGER,
    "voting_right" BOOLEAN NOT NULL DEFAULT false,
    "eligible_for_office" BOOLEAN NOT NULL DEFAULT false,
    "minimum_seniority_for_voting" INTEGER NOT NULL DEFAULT 0,
    "minimum_seniority_for_office" INTEGER NOT NULL DEFAULT 0,
    "automatic_transition_target_id" UUID,
    "rules_config" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_years" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PREPARATION',
    "previous_fiscal_year_id" UUID,
    "members_at_start" INTEGER NOT NULL DEFAULT 0,
    "members_at_end" INTEGER,
    "report_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "member_number" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "surnames" VARCHAR(200) NOT NULL,
    "birth_date" DATE NOT NULL,
    "document_type" VARCHAR(10) NOT NULL,
    "document_number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "address" VARCHAR(300),
    "postal_code" VARCHAR(10),
    "city" VARCHAR(100),
    "iban_encrypted" TEXT,
    "member_type_id" UUID NOT NULL,
    "custom_fields" JSONB,
    "current_status" VARCHAR(30) NOT NULL DEFAULT 'APPLICANT',
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leave_date" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_plans" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(20) NOT NULL,
    "amount" INTEGER NOT NULL,
    "frequency" VARCHAR(20) NOT NULL DEFAULT 'ANNUAL',
    "billing_months" INTEGER[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_type_fee_plans" (
    "member_type_id" UUID NOT NULL,
    "fee_plan_id" UUID NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_type_fee_plans_pkey" PRIMARY KEY ("member_type_id","fee_plan_id")
);

-- CreateTable
CREATE TABLE "member_accounts" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_subscriptions" (
    "id" UUID NOT NULL,
    "member_account_id" UUID NOT NULL,
    "fee_plan_id" UUID NOT NULL,
    "registration_date" TIMESTAMP(3) NOT NULL,
    "leave_date" TIMESTAMP(3),
    "cancel_reason" VARCHAR(200),
    "type_discount" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "personal_discount" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "personal_discount_reason" VARCHAR(500),
    "effective_amount" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" UUID NOT NULL,
    "member_account_id" UUID NOT NULL,
    "fee_subscription_id" UUID,
    "base_amount" INTEGER NOT NULL DEFAULT 0,
    "final_amount" INTEGER NOT NULL DEFAULT 0,
    "description" VARCHAR(255) NOT NULL,
    "fiscal_year_id" UUID,
    "billing_month" INTEGER,
    "billing_year" INTEGER NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "paid_amount" INTEGER NOT NULL DEFAULT 0,
    "is_prorated" BOOLEAN NOT NULL DEFAULT false,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "previous_status" VARCHAR(30) NOT NULL,
    "new_status" VARCHAR(30) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "changed_by" VARCHAR(100) NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "member_account_id" UUID NOT NULL,
    "charge_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "payment_method" VARCHAR(30) NOT NULL,
    "payment_date" DATE NOT NULL,
    "payment_reference" VARCHAR(30) NOT NULL,
    "receipt_number" VARCHAR(30),
    "receipt_document" BYTEA,
    "notes" VARCHAR(500),
    "registered_by" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_types_code_key" ON "member_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_years_name_key" ON "fiscal_years"("name");

-- CreateIndex
CREATE UNIQUE INDEX "members_member_number_key" ON "members"("member_number");

-- CreateIndex
CREATE UNIQUE INDEX "members_document_number_key" ON "members"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_current_status_idx" ON "members"("current_status");

-- CreateIndex
CREATE INDEX "members_member_type_id_idx" ON "members"("member_type_id");

-- CreateIndex
CREATE INDEX "members_email_idx" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fee_plans_code_key" ON "fee_plans"("code");

-- CreateIndex
CREATE INDEX "fee_plans_type_active_idx" ON "fee_plans"("type", "active");

-- CreateIndex
CREATE INDEX "member_type_fee_plans_fee_plan_id_idx" ON "member_type_fee_plans"("fee_plan_id");

-- CreateIndex
CREATE INDEX "member_type_fee_plans_member_type_id_idx" ON "member_type_fee_plans"("member_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_accounts_member_id_key" ON "member_accounts"("member_id");

-- CreateIndex
CREATE INDEX "fee_subscriptions_member_account_id_idx" ON "fee_subscriptions"("member_account_id");

-- CreateIndex
CREATE INDEX "fee_subscriptions_fee_plan_id_idx" ON "fee_subscriptions"("fee_plan_id");

-- CreateIndex
CREATE INDEX "fee_subscriptions_status_idx" ON "fee_subscriptions"("status");

-- CreateIndex
CREATE INDEX "charges_member_account_id_status_idx" ON "charges"("member_account_id", "status");

-- CreateIndex
CREATE INDEX "charges_billing_month_billing_year_idx" ON "charges"("billing_month", "billing_year");

-- CreateIndex
CREATE UNIQUE INDEX "charges_fee_subscription_id_billing_month_billing_year_key" ON "charges"("fee_subscription_id", "billing_month", "billing_year");

-- CreateIndex
CREATE INDEX "status_history_member_id_idx" ON "status_history"("member_id");

-- CreateIndex
CREATE INDEX "status_history_member_id_changed_at_idx" ON "status_history"("member_id", "changed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_reference_key" ON "payments"("payment_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_receipt_number_key" ON "payments"("receipt_number");

-- CreateIndex
CREATE INDEX "payments_member_account_id_idx" ON "payments"("member_account_id");

-- CreateIndex
CREATE INDEX "payments_charge_id_idx" ON "payments"("charge_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- AddForeignKey
ALTER TABLE "member_types" ADD CONSTRAINT "member_types_automatic_transition_target_id_fkey" FOREIGN KEY ("automatic_transition_target_id") REFERENCES "member_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_years" ADD CONSTRAINT "fiscal_years_previous_fiscal_year_id_fkey" FOREIGN KEY ("previous_fiscal_year_id") REFERENCES "fiscal_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_member_type_id_fkey" FOREIGN KEY ("member_type_id") REFERENCES "member_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_type_fee_plans" ADD CONSTRAINT "member_type_fee_plans_fee_plan_id_fkey" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_accounts" ADD CONSTRAINT "member_accounts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_subscriptions" ADD CONSTRAINT "fee_subscriptions_member_account_id_fkey" FOREIGN KEY ("member_account_id") REFERENCES "member_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_subscriptions" ADD CONSTRAINT "fee_subscriptions_fee_plan_id_fkey" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_member_account_id_fkey" FOREIGN KEY ("member_account_id") REFERENCES "member_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_fee_subscription_id_fkey" FOREIGN KEY ("fee_subscription_id") REFERENCES "fee_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_account_id_fkey" FOREIGN KEY ("member_account_id") REFERENCES "member_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
