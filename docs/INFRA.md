# Infrastructure & Production Roadmap

> Living document — check items off as we complete each milestone.
> Last updated: 2026-02-23

---

## Target Architecture

```
                    ┌─────────────┐
                    │   Route 53  │  (optional — or use CloudFront URL)
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐      ┌────────▼────────┐
     │   CloudFront    │      │   ALB Ingress    │
     │  (frontend CDN) │      │  (api.domain)    │
     └────────┬────────┘      └────────┬─────────┘
              │                        │
     ┌────────▼────────┐      ┌────────▼─────────┐
     │    S3 Bucket    │      │      EKS         │
     │  (React build)  │      │  ┌─────────────┐ │
     └─────────────────┘      │  │ auth-service │ │
                              │  │ todo-service │ │
                              │  └──────┬───────┘ │
                              └─────────┼─────────┘
                                        │ (private subnet)
                              ┌─────────▼─────────┐
                              │   RDS Postgres    │
                              │   (private)       │
                              └───────────────────┘
```

Traffic: User → CloudFront (frontend) / ALB (API) → EKS pods → RDS (private)

---

## Design Decisions

| Decision           | Choice                                   | Reasoning                              |
| ------------------ | ---------------------------------------- | -------------------------------------- |
| Region             | `us-east-1`                              | Cheapest, most services ✅ decided     |
| Networking         | VPC — public + private subnets           | DB private, ALB public                 |
| DNS / TLS          | Route 53 domain + ACM cert               | Full DNS learning, free TLS ✅ decided |
| Container registry | ECR (one repo per service)               | Native AWS                             |
| Orchestration      | EKS — managed node group                 | Matches real-world workflow            |
| GitOps             | ArgoCD — manifests in-repo (`/deploy`)   | Single repo, simpler for learning      |
| Database           | RDS Postgres `db.t3.micro`               | Matches local dev                      |
| Frontend hosting   | S3 + CloudFront                          | Static site, pennies/month             |
| Secrets            | Secrets Manager + ExternalSecrets        | K8s-native, nothing in git             |
| CI                 | GitHub Actions (public repo, 2k min/mo)  | Free tier, native to repo ✅ decided   |
| One-click up/down  | Terraform layered state + wrapper script | Critical for cost control              |

---

## Terraform Layout (planned)

```
infra/
├── environments/
│   └── dev/
│       ├── terraform.tfvars
│       └── backend.hcl
├── modules/
│   ├── vpc/
│   ├── eks/
│   ├── ecr/
│   ├── rds/
│   ├── frontend-hosting/   # S3 + CloudFront
│   ├── dns/                # Route 53 (optional)
│   └── argocd/
└── layers/
    ├── 01-foundation/      # VPC, subnets, ECR        (cheap — keep up)
    ├── 02-data/            # RDS                       (snapshot on destroy)
    ├── 03-compute/         # EKS + node group          (expensive — destroy when idle)
    ├── 04-platform/        # ArgoCD, ingress, secrets  (destroy with compute)
    └── 05-frontend/        # S3 + CloudFront           (cheap — keep up)
```

**Destroy strategy:**

- `./infra.sh up` → apply all layers in order
- `./infra.sh down` → destroy 04 → 03, stop RDS → cost drops to ~$0–5/mo
- `./infra.sh nuke` → destroy everything (full teardown)

---

## GitOps Layout (planned)

```
deploy/
├── argocd/
│   ├── app-of-apps.yaml
│   ├── auth-service.yaml
│   └── todo-service.yaml
└── charts/
    ├── auth-service/
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   ├── values-dev.yaml
    │   └── templates/
    └── todo-service/
        └── (same structure)
```

**CI → GitOps flow:**

1. PR merged → GH Action detects changed service
2. Build image, tag with git SHA → push to ECR
3. Commit new image tag to `values-dev.yaml`
4. ArgoCD detects change → rolling update

---

## Cost Estimates (when running)

| Resource            | ~Monthly  | Notes                        |
| ------------------- | --------- | ---------------------------- |
| EKS control plane   | $73       | Destroy when idle            |
| NAT Gateway (×1)    | $32       | Destroyed with compute layer |
| RDS db.t3.micro     | $15       | Stop or destroy when idle    |
| ALB                 | $16       | Destroyed with compute layer |
| EC2 nodes (t3.med)  | $60       | Destroyed with compute layer |
| S3 + CloudFront     | < $1      | Negligible                   |
| **Total (running)** | **~$196** | **With `down`: ~$0–5/mo**    |

---

## Milestone Roadmap

### M1 — API Tests

- [x] Set up Jest config for auth-service
- [ ] Set up Jest config for todo-service
- [x] Write integration tests (supertest) for auth endpoints — signup, login, me, refresh, logout
- [ ] Write integration tests (supertest) for todo endpoints
- [ ] All tests pass locally with `pnpm test`

### M2 — GH Actions: PR Quality Gate

- [ ] Create `.github/workflows/pr.yml`
- [ ] Run lint + type-check + test on every PR
- [ ] PR shows green/red status checks

### M3 — GH Actions: CI/CD on Merge to Main

- [ ] Create `.github/workflows/cd.yml`
- [ ] Detect changed services (path filters)
- [ ] Build Docker image per changed service
- [ ] Push to ECR with git SHA tag
- [ ] Update Helm values with new image tag (git commit)

### M4 — Terraform Foundation

- [ ] Set up Terraform state backend (S3 + DynamoDB)
- [ ] Create VPC + subnets module
- [ ] Create ECR repos module
- [ ] `terraform apply` creates networking + ECR

### M5 — Terraform EKS

- [ ] EKS cluster + managed node group module
- [ ] `kubectl get nodes` works
- [ ] IAM OIDC provider for service accounts

### M6 — Terraform RDS

- [ ] RDS Postgres in private subnet
- [ ] Security group allows only EKS nodes
- [ ] Can connect from a test pod inside EKS

### M7 — Helm Charts

- [ ] Chart for auth-service (deployment, service, ingress, HPA)
- [ ] Chart for todo-service (same structure)
- [ ] `helm install` works on EKS cluster

### M8 — ArgoCD + GitOps

- [ ] Install ArgoCD on EKS (Terraform or Helm)
- [ ] App-of-apps pattern configured
- [ ] Push image tag → ArgoCD auto-syncs → rolling update works

### M9 — Frontend to S3 + CloudFront

- [ ] Terraform module for S3 + CloudFront
- [ ] GH Action builds frontend + uploads to S3
- [ ] CloudFront invalidation on deploy
- [ ] Frontend accessible via CloudFront URL

### M10 — One-Click Scripts

- [ ] `./infra.sh up` applies all layers
- [ ] `./infra.sh down` destroys compute layers + stops RDS
- [ ] `./infra.sh nuke` full teardown
- [ ] Documented and tested

---

    ## Decisions Log

1. ✅ **Domain**: Register via Route 53 (~$12/yr) — full DNS/TLS learning path
2. ✅ **Region**: `us-east-1` — cheapest, latency irrelevant for learning
3. ✅ **Repo**: Public — 2,000 free GH Actions minutes/month

---

## Progress Log

| Date       | Milestone    | Notes                                                                                                      |
| ---------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| 2026-02-23 | Planning     | Roadmap created, architecture defined                                                                      |
| 2026-02-23 | M1 (partial) | auth-service: app/index split, testcontainers setup, 26 tests passing (signup, login, me, refresh, logout) |
