# Terraform do workload `fe-cep-painel` na AWS. GERADO pela plataforma.
# A INTENÇÃO (project.yaml: kind=spa) escolhe o módulo: tfKind=spa.
#   api → ECS Fargate + ALB   ·   spa → S3 + CloudFront
# ► cloud PRIMÁRIA deste workload.
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.region
}

module "fe-cep-painel" {
  source = "../../../../providers/aws/modules/spa"

  name   = var.name
  port   = var.port
  image  = var.image
  domain = var.domain
  env    = var.env
}

output "endpoint" {
  value = module.fe-cep-painel.endpoint
}
