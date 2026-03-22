# Learning Plan — Road to Production

> Created: 2026-03-22  
> Goal: Take this app fully to production on AWS, understanding every layer.

---

## Your starting point

| Area       | Level                                                              |
| ---------- | ------------------------------------------------------------------ |
| AWS        | Basic — knows services, never deployed anything real               |
| Kubernetes | Basic — ran kubectl, understands pods/deployments/services         |
| Terraform  | Zero — never touched it                                            |
| App        | ✅ Running locally. Auth + todo services tested. Frontend working. |

---

## The target architecture (what we're building toward)

```
User
 │
 ├──> Route 53 (DNS)
 │         │
 │    ┌────┴────────────────────────┐
 │    │                             │
 ▼    ▼                             ▼
CloudFront                       ALB (api.yourdomain.com)
(frontend CDN)                        │
     │                           EKS cluster
     ▼                           ├── auth-service (pod)
   S3 bucket                     └── todo-service (pod)
  (React build)                        │
                                  RDS Postgres
                                  (private subnet)
```

Secrets flow: GitHub → ECR (images) → ArgoCD → EKS (auto-deploy on push)

---

## Phase 0 — Local dev ✅ DONE

- [x] Both services run locally with `pnpm dev`
- [x] Postgres in Docker
- [x] Frontend working
- [x] Auth + todo integration tests written
- [x] `packages/db` build process understood and fixed

---

## Phase 1 — Tests pass (finish M1)

**Goal:** All integration tests pass before writing any infra. Green tests = confidence.

- [ ] Run `pnpm test` in todo-service — make all tests pass
- [ ] Run `pnpm test` in auth-service — verify still passing
- [ ] Both test suites green locally
- [ ] ESLint passes on all files (unblocks git commit via husky)

**Status (2026-03-22):** IN PROGRESS — two issues found when running `pnpm test` in todo-service:

1. **Test async cleanup error** — `Cannot log after tests are done` — Prisma logs fire after the testcontainer stops. Tests may actually be passing but teardown is noisy / potentially breaking the suite.
2. **ESLint blocking git commit** (husky pre-commit fails):
   - `jest.globalSetup.js` / `jest.globalTeardown.js` use `require()` → `@typescript-eslint/no-var-requires` errors
   - Test files (`src/__tests__/*.test.ts`) not included in any tsconfig that ESLint's `parserOptions.project` knows about → parsing errors on all test files
   - Fix: add `tsconfig.test.json` to ESLint's project list, add eslint-disable comments to `.js` jest config files

**What you'll understand:** testcontainers, supertest, real DB testing, Jest setup in a monorepo.

---

## Phase 2 — GitHub Actions: PR quality gate (M2)

**Goal:** Every PR automatically runs lint + typecheck + tests. You can't merge broken code.

- [ ] Create `.github/workflows/pr.yml`
- [ ] Run on every PR: `pnpm lint`, `pnpm type-check`, `pnpm test`
- [ ] PR shows green/red status check

**What you'll understand:** GitHub Actions syntax, jobs, steps, caching pnpm, running tests in CI.

**Why before k8s:** CI is the foundation everything else depends on. If tests don't run on PRs, k8s doesn't help you.

---

## Phase 3 — Docker images work (M3 prep)

**Goal:** Build both services as Docker images locally and verify they run correctly.

- [ ] `docker compose up --build` — both services start from their Dockerfiles
- [ ] Test health endpoints: `curl localhost:3001/health` and `curl localhost:3002/health`
- [ ] Understand the 3-stage Dockerfile (dependencies → builder → production)

**What you'll understand:** multi-stage Docker builds, pnpm in containers, why `cp -r src/generated dist/generated` is in the Dockerfile.

---

## Phase 4 — Kubernetes fundamentals (Minikube)

**Goal:** Understand k8s concepts hands-on before paying for EKS.

### 4a — Core concepts

- [ ] Install minikube + kubectl
- [ ] Write a Deployment for auth-service (by hand, no Helm yet)
- [ ] Write a Service to expose it inside the cluster
- [ ] Write a ConfigMap for non-secret env vars
- [ ] Write a Secret for JWT_SECRET + DATABASE_URL
- [ ] `kubectl apply -f` — see it running
- [ ] `kubectl logs`, `kubectl exec`, `kubectl describe` — debug it

**What you'll understand:** pods vs deployments, replica sets, why services exist, how env vars reach containers, how k8s restarts crashed pods.

### 4b — Ingress

- [ ] Install nginx ingress controller on minikube
- [ ] Write an Ingress to route `/auth/*` and `/api/*` to the right service
- [ ] Hit the app from your browser via the ingress

**What you'll understand:** how traffic enters a cluster, ingress controllers, path-based routing.

### 4c — Namespaces + resource limits

- [ ] Deploy into a `dev` namespace
- [ ] Add CPU/memory requests and limits to your Deployment
- [ ] See what happens when a pod exceeds its memory limit

---

## Phase 5 — Helm (package your services)

**Goal:** Replace raw YAML manifests with reusable, parameterised Helm charts.

- [ ] Install Helm
- [ ] `helm create auth-service` — understand the generated structure
- [ ] Convert your raw manifests to a Helm chart (`values.yaml` for env, image tag, replicas)
- [ ] `helm install` and `helm upgrade` on minikube
- [ ] Separate `values.yaml` vs `values-dev.yaml` vs `values-prod.yaml`
- [ ] Deploy todo-service chart the same way

**What you'll understand:** why Helm exists (templating + versioning), how image tags flow through values, how to override per environment.

---

## Phase 6 — Terraform: AWS foundations (M4)

**Goal:** Provision real AWS infrastructure with code. Never click in the console.

### 6a — Terraform basics (no AWS yet)

- [ ] Install Terraform
- [ ] Write a `main.tf` that creates a local file (hello world)
- [ ] Understand: `terraform init`, `plan`, `apply`, `destroy`
- [ ] Understand: state file, what it is, why it's dangerous to lose

### 6b — AWS state backend

- [ ] Create S3 bucket + DynamoDB table for remote state (manually, just once)
- [ ] Configure Terraform to use remote state
- [ ] **Why:** state file must never live on your laptop — it's the source of truth for what AWS thinks exists

### 6c — VPC + networking module

- [ ] Write a `vpc` module: VPC, public subnets, private subnets, NAT gateway
- [ ] Apply it — see it in AWS console
- [ ] **Understand:** why DB lives in private subnet, why ALB lives in public, what NAT gateway does

### 6d — ECR repos

- [ ] Write ECR repo resources for auth-service and todo-service
- [ ] Push a Docker image to ECR manually (authenticate, tag, push)
- [ ] **Understand:** ECR is just a private Docker registry on AWS

**What you'll understand:** IaC philosophy, Terraform modules, state, providers, AWS networking fundamentals.

---

## Phase 7 — GitHub Actions: CI/CD pipeline (M3)

**Goal:** Every merge to main automatically builds + pushes a new Docker image.

- [ ] Create `.github/workflows/cd.yml`
- [ ] Detect which service changed (path filters)
- [ ] Build Docker image, tag with git SHA
- [ ] Push to ECR
- [ ] Update Helm `values-dev.yaml` with new image tag (git commit)

**What you'll understand:** ECR authentication from GitHub Actions, OIDC (no long-lived AWS keys), path-based triggers, git SHA as image tag.

---

## Phase 8 — Terraform: EKS cluster (M5)

- [ ] Write EKS module: cluster + managed node group
- [ ] `terraform apply` — real EKS cluster up
- [ ] `kubectl get nodes` works against AWS
- [ ] Configure OIDC provider (needed for pods to assume IAM roles)

**What you'll understand:** EKS vs self-managed k8s, node groups, kubeconfig, IAM + OIDC for service accounts.

---

## Phase 9 — Terraform: RDS Postgres (M6)

- [ ] Write RDS module: `db.t3.micro`, private subnet, security group
- [ ] Security group allows only EKS nodes to connect (not public)
- [ ] Test connection from a pod inside EKS

**What you'll understand:** RDS vs self-managed Postgres, security groups as firewall rules, private subnets.

---

## Phase 10 — Secrets management

- [ ] Store JWT_SECRET + DATABASE_URL in AWS Secrets Manager
- [ ] Install ExternalSecrets operator on EKS
- [ ] Write an ExternalSecret resource — k8s Secret synced from Secrets Manager
- [ ] Helm charts reference the k8s Secret (nothing hardcoded)

**What you'll understand:** why secrets never go in git, how ExternalSecrets bridges AWS and k8s, secret rotation.

---

## Phase 11 — ArgoCD + GitOps (M8)

- [ ] Install ArgoCD on EKS (via Terraform or Helm)
- [ ] Configure app-of-apps pattern (one ArgoCD app manages all services)
- [ ] CD pipeline commits new image tag → ArgoCD detects → rolling update
- [ ] See a full deploy: `git push` → image built → ArgoCD syncs → new pods

**What you'll understand:** GitOps vs push-based CD, why ArgoCD is better than `kubectl apply` in CI, rolling updates, rollback.

---

## Phase 12 — Frontend to S3 + CloudFront (M9)

- [ ] Terraform module: S3 bucket (static hosting) + CloudFront distribution
- [ ] GitHub Action: `pnpm build` → upload to S3 → CloudFront invalidation
- [ ] Frontend accessible via CloudFront URL

**What you'll understand:** CDN edge caching, why static sites don't need a server, cache invalidation.

---

## Phase 13 — Route 53 + TLS (M10)

- [ ] Register/configure domain in Route 53
- [ ] ACM certificate (auto-renewed TLS)
- [ ] ALB ingress uses ACM cert → HTTPS
- [ ] CloudFront uses same cert → HTTPS for frontend

**What you'll understand:** DNS records (A, CNAME, alias), TLS termination at the load balancer, ACM vs Let's Encrypt.

---

## Phase 14 — One-click up/down

- [ ] `./infra.sh up` — applies all Terraform layers in order
- [ ] `./infra.sh down` — destroys expensive layers (EKS, NAT, ALB), stops RDS → cost ~$0/mo
- [ ] `./infra.sh nuke` — full teardown

**Why this matters:** EKS + NAT gateway = ~$100+/mo when running. You need a reliable way to destroy and recreate the cluster in minutes, or this project will cost you money while you sleep.

---

## Principles for this journey

1. **Understand before moving on.** Don't copy-paste Terraform and move on. Run it, break it, fix it.
2. **Cost control first.** Always set billing alerts. Always know what's running.
3. **Minikube → EKS is the right order.** Learn k8s concepts cheaply, then apply to the real thing.
4. **Terraform state is sacred.** Never delete it, never edit it manually.
5. **Nothing in git.** Secrets always go in Secrets Manager. Not `.env`, not Helm values.

---

## Cost reference (when EKS is running)

| Resource                 | ~Monthly                    |
| ------------------------ | --------------------------- |
| EKS control plane        | $73                         |
| NAT Gateway              | $32                         |
| RDS db.t3.micro          | $15                         |
| ALB                      | $16                         |
| EC2 nodes (t3.medium ×1) | $30                         |
| S3 + CloudFront          | < $1                        |
| **Total running**        | **~$167**                   |
| **With `down` script**   | **~$15** (just RDS stopped) |
| **With `nuke`**          | **$0**                      |
