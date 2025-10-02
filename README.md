# ITOSM Platform — Docker & K8s (GitHub Actions, multi‑arch)

Tailored for **GitHub repo**: `https://github.com/Seetharamacharyulu/itosm-platform`  
Container registry path: `ghcr.io/Seetharamacharyulu/itosm-platform`

## Files
- `Dockerfile` — multi-stage (Node 20, Vite + Express)
- `.dockerignore`
- `.github/workflows/docker-multiarch.yml` — builds `linux/amd64,linux/arm64` and pushes to GHCR
- `k8s/namespace.yaml` — `itosm` namespace
- `k8s/deployment.yaml` — image set to `ghcr.io/Seetharamacharyulu/itosm-platform:latest`
- `k8s/service.yaml` — ClusterIP on port 80 → 5000
- `k8s/ingress.yaml` — **set your DuckDNS host** before applying
- `k8s/configmap.env.example.yaml` — place env/secret values if needed

## Quick steps
1) Commit these files to `Seetharamacharyulu/itosm-platform` on the `main` branch.
2) GitHub → Actions will build & push: `ghcr.io/Seetharamacharyulu/itosm-platform:latest` and `:${ github.sha }`.
3) On your k3s VM:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl -n itosm apply -f k8s/configmap.env.example.yaml
   kubectl -n itosm apply -f k8s/deployment.yaml
   kubectl -n itosm apply -f k8s/service.yaml
   # Edit ingress host first:
   kubectl -n itosm apply -f k8s/ingress.yaml
   ```
4) Open `http://<your-duckdns-host>` (health: `/api/health`).

If your GHCR package is **private**, create a pull secret and uncomment `imagePullSecrets` in the Deployment.
# itosm-platform
