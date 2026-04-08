# Deployment Guide

## Prerequisites

- Docker ≥ 24 and Docker Compose v2
- Ports 3000, 3478, 5349 and 40000–49999/UDP open in firewall

---

## Local development (docker compose)

```bash
# 1. Clone
git clone https://github.com/4citeB4U/LeeWay-Edhe-RTC.git
cd LeeWay-Edhe-RTC

# 2. Copy env example (review defaults before starting)
cp services/sfu/.env.example services/sfu/.env

# 3. Start everything
docker compose -f deploy/docker-compose.yml up --build

# 4. Open the web demo
open http://localhost:8080
```

The demo page connects to the SFU WebSocket at `ws://localhost:8080/ws` (proxied by nginx).
Open a second browser tab to the same URL and verify that:
- Both tabs can join the same room.
- Both can publish audio.
- Each tab receives the other's audio stream.

### Dev token endpoint

The SFU exposes `/dev/token` (only in non-production mode) to issue JWTs for testing:

```bash
curl -s -X POST http://localhost:3000/dev/token \
     -H 'Content-Type: application/json' \
     -d '{"sub": "alice"}' | jq .
```

---

## NATed / cloud deployment

When the server is behind NAT (e.g., a cloud VM), mediasoup ICE candidates must advertise
the **public IP**. Set the environment variable before starting:

```bash
# In services/sfu/.env
ANNOUNCED_IP=203.0.113.42   # replace with your public IP
```

Without this, ICE negotiation will fail for external clients.

---

## Production with docker compose

```bash
# 1. Copy secrets to the host
sudo mkdir -p /etc/leeway
sudo cp deploy/coturn/turnserver.conf /etc/leeway/turnserver.conf
# Edit /etc/leeway/turnserver.conf – fill in YOUR_PUBLIC_IP and secrets

sudo cp configs/.env.example /etc/leeway/sfu.env
# Edit /etc/leeway/sfu.env – set JWT_SECRET, ANNOUNCED_IP, TURN_SECRET

# 2. Start
docker compose \
  -f deploy/docker-compose.yml \
  -f deploy/docker-compose.prod.yml \
  up -d
```

---

## Bare-metal edge deployment (systemd)

### 1. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3
```

### 2. Install coturn

```bash
sudo apt-get install -y coturn
sudo cp deploy/coturn/turnserver.conf /etc/coturn/turnserver.conf
# Edit the file – fill in your public IP and secret
```

### 3. Build and install the SFU

```bash
cd services/sfu
npm ci
npm run build
sudo mkdir -p /opt/leeway/sfu
sudo cp -r dist package*.json /opt/leeway/sfu/
cd /opt/leeway/sfu && sudo npm ci --omit=dev

# Create dedicated user
sudo useradd -r -s /bin/false leeway
sudo chown -R leeway:leeway /opt/leeway
```

### 4. Install systemd units

```bash
sudo cp deploy/systemd/leeway-sfu.service /etc/systemd/system/
sudo cp deploy/systemd/coturn.service      /etc/systemd/system/

# Create env file
sudo mkdir -p /etc/leeway
sudo cp configs/.env.example /etc/leeway/sfu.env
sudo chmod 600 /etc/leeway/sfu.env
# Edit /etc/leeway/sfu.env

sudo systemctl daemon-reload
sudo systemctl enable --now coturn leeway-sfu
sudo systemctl status leeway-sfu
```

### 5. Verify

```bash
# Health check
curl http://localhost:3000/health

# Prometheus metrics
curl http://localhost:3000/metrics | grep leeway_
```

---

## Fly.io Deployment ✅ Live

LeeWay SFU is production-deployed on Fly.io. See live dashboard: **https://fly.io/apps/leeway-sfu**

### Prerequisites

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Authenticate: `fly auth login`
3. Create app (if not exists): `fly apps create leeway-sfu`

### Deploy

```bash
cd services/sfu
fly deploy --config fly.toml
```

**What happens:**
1. Docker image built (68 MB optimized)
2. Pushed to Fly registry
3. Machines scaled (0–2 auto)
4. Health check enabled (`/health`)
5. UDP ports 40000–49999 allocated

### Set Secrets

```bash
# JWT secret for token signing
fly secrets set JWT_SECRET=<generate-random> --app leeway-sfu

# Runtime mode
fly secrets set LEEWAY_MODE=balanced --app leeway-sfu

# Optional: TURN secret
fly secrets set TURN_SECRET=<generate-random> --app leeway-sfu
```

### Monitor Live Deployment

```bash
# View logs
fly logs --app leeway-sfu

# Check machine status
fly machines list --app leeway-sfu

# See metrics
fly metrics --app leeway-sfu

# SSH into machine for debugging
fly ssh console --app leeway-sfu
```

### Test Live SFU

```bash
# Health endpoint
curl https://leeway-sfu.fly.dev/health

# Get token (dev mode only in production)
# curl -X POST https://leeway-sfu.fly.dev/dev/token \
#      -H 'Content-Type: application/json' \
#      -d '{"sub": "test"}'
```

### Environment Variables for Fly

Available in `services/sfu/fly.toml`:

```toml
[env]
  NODE_ENV = "production"
  LOG_LEVEL = "warn"
  HTTP_PORT = "3000"
  RTC_MIN_PORT = "40000"
  RTC_MAX_PORT = "40099"
```

Overrides via secrets (set with `fly secrets set`):
- `JWT_SECRET` — Token signing key
- `ANNOUNCED_IP` — Public IP (auto-detected by Fly)
- `LEEWAY_MODE` — `light`, `balanced`, `full`

---

## Firewall rules (ufw example)

```bash
sudo ufw allow 3000/tcp     # SFU signaling
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp     # STUN / TURN
sudo ufw allow 5349/udp
sudo ufw allow 5349/tcp     # TURN TLS
sudo ufw allow 40000:49999/udp  # RTP/RTCP
```
