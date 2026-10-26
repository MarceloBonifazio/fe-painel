# Infra do workload `fe-painel` (Terraform)

Gerado para a cloud selecionada: **aws** (declarada no `project.yaml`).
Referencia o módulo do provider para o `kind=spa` (tfKind=`spa`).

```
infra/aws/     → providers/aws/modules/spa
```

Em dev a cloud é emulada pelo **floci**; aqui é o provisionamento de **produção**.

```bash
cd infra/aws
terraform init
terraform plan -var="image=<registry>/fe-painel:<tag>"
```

Só a cloud selecionada é gerada (sem infra morta). Para **portar para outra cloud**
(remove a atual e gera a nova — a intenção no `project.yaml` não muda, só o adapter):

```bash
make switch-cloud NAME=fe-painel CLOUD=<aws|gcp|azure>
```
