output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "database_endpoint" {
  description = "RDS PostgreSQL endpoint (host:port)"
  value       = "${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}"
}

output "database_url" {
  description = "DATABASE_URL for .env (password is sensitive)"
  value       = "postgresql://serviceformai:${random_password.db_password.result}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/serviceformai"
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "s3_bucket_name" {
  description = "S3 document storage bucket name"
  value       = aws_s3_bucket.documents.id
}

output "s3_bucket_region" {
  description = "S3 document storage bucket region"
  value       = aws_s3_bucket.documents.region
}

output "next_steps" {
  description = "Post-apply instructions"
  value       = <<-EOT
    Infrastructure provisioned. Next steps:
    1. Copy DATABASE_URL:
         terraform output -raw database_url
    2. Update your .env or Helm values with the endpoints above.
    3. Run: ./deployment/scripts/install.sh --cloud
    4. Run: ./deployment/scripts/validate.sh --post
  EOT
}
