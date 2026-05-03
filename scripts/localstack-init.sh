#!/bin/bash
# LocalStack initialization script
# Runs automatically when LocalStack is ready (mounted at /etc/localstack/init/ready.d/)
#
# Creates all required AWS resources for local development:
#   - S3 bucket for document storage
#   - SQS queue for background job processing
#   - SES verified sender identity
#   - SNS topic for notifications

set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-ap-south-1}"
ENDPOINT="http://localhost:4566"
AWS_CMD="aws --endpoint-url=$ENDPOINT --region=$REGION"

echo ">>> [LocalStack Init] Starting resource creation (region: $REGION)"

# ── S3: Document storage bucket ─────────────────────────────────────────────
echo ">>> Creating S3 bucket: serviceformai-documents"
$AWS_CMD s3api create-bucket \
  --bucket serviceformai-documents \
  --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null || true

# Block all public access on the documents bucket
$AWS_CMD s3api put-public-access-block \
  --bucket serviceformai-documents \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning for document recovery
$AWS_CMD s3api put-bucket-versioning \
  --bucket serviceformai-documents \
  --versioning-configuration Status=Enabled

# Lifecycle rule: delete incomplete multipart uploads after 1 day
$AWS_CMD s3api put-bucket-lifecycle-configuration \
  --bucket serviceformai-documents \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "cleanup-incomplete-multipart",
      "Status": "Enabled",
      "Filter": {"Prefix": ""},
      "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
    }]
  }'

echo ">>> S3 bucket created: serviceformai-documents"

# ── S3: Tenant assets bucket (logos, white-label assets) ────────────────────
echo ">>> Creating S3 bucket: serviceformai-assets"
$AWS_CMD s3api create-bucket \
  --bucket serviceformai-assets \
  --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null || true

echo ">>> S3 bucket created: serviceformai-assets"

# ── SQS: Background job queues ───────────────────────────────────────────────
echo ">>> Creating SQS queues"

# Main write-path queue
$AWS_CMD sqs create-queue \
  --queue-name serviceformai-write-queue \
  --attributes '{
    "VisibilityTimeout": "60",
    "MessageRetentionPeriod": "86400",
    "ReceiveMessageWaitTimeSeconds": "20"
  }' 2>/dev/null || true

# Dead-letter queue
$AWS_CMD sqs create-queue \
  --queue-name serviceformai-dlq \
  --attributes '{
    "MessageRetentionPeriod": "1209600"
  }' 2>/dev/null || true

# Audit event queue
$AWS_CMD sqs create-queue \
  --queue-name serviceformai-audit-queue \
  --attributes '{
    "VisibilityTimeout": "30",
    "MessageRetentionPeriod": "86400",
    "ReceiveMessageWaitTimeSeconds": "10"
  }' 2>/dev/null || true

echo ">>> SQS queues created"

# ── SES: Email sender verification ──────────────────────────────────────────
echo ">>> Verifying SES sender identity"
$AWS_CMD ses verify-email-identity \
  --email-address "noreply@serviceformai.local" 2>/dev/null || true

echo ">>> SES identity verified"

# ── SNS: Notification topics ─────────────────────────────────────────────────
echo ">>> Creating SNS topics"
$AWS_CMD sns create-topic --name serviceformai-notifications 2>/dev/null || true
$AWS_CMD sns create-topic --name serviceformai-application-events 2>/dev/null || true
echo ">>> SNS topics created"

echo ">>> [LocalStack Init] All resources created successfully"
