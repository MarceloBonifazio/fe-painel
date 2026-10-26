variable "name" {
  type    = string
  default = "fe-painel"
}

variable "port" {
  type    = number
  default = 3000
}

variable "image" {
  type    = string
  default = "" # ECR URI (api/worker/function) — vazio p/ spa
}

variable "domain" {
  type    = string
  default = "fe-painel.local"
}

variable "region" {
  type    = string
  default = "sa-east-1"
}

variable "env" {
  type    = string
  default = "prod"
}
