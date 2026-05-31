#!/bin/bash
# =============================================================================
# ARIA SOC Platform — Ubuntu Deployment Script
# Run as: sudo bash deploy.sh
# Tested on: Ubuntu 22.04 LTS, Ubuntu 24.04 LTS
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[ARIA]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   ARIA SOC Platform — Deployment     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# Must be run as root
[[ $EUID -ne 0 ]] && err "Run as root: sudo bash deploy.sh"

# ─── Step 1: Get server IP ───────────────────────────────────────────────────
log "Detecting server IP…"
SERVER_IP=$(curl -sf --max-time 5 https://ifconfig.me || hostname -I | awk '{print $1}')
log "Server IP: ${SERVER_IP}"

# ─── Step 2: Install Docker ──────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    log "Installing Docker…"
    curl -fsSL https://get.docker.com | bash
    systemctl enable --now docker
    ok "Docker installed"
else
    ok "Docker already installed ($(docker --version | cut -d' ' -f3))"
fi

# ─── Step 3: Generate TLS certificate ────────────────────────────────────────
mkdir -p /etc/nginx/ssl

if [ ! -f /etc/nginx/ssl/aria.crt ]; then
    log "Generating self-signed TLS certificate…"
    openssl req -x509 -nodes -days 730 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/aria.key \
        -out    /etc/nginx/ssl/aria.crt \
        -subj   "/CN=${SERVER_IP}/O=ARIA-SOC/C=US" \
        -addext "subjectAltName=IP:${SERVER_IP},IP:127.0.0.1"
    chmod 600 /etc/nginx/ssl/aria.key
    chmod 644 /etc/nginx/ssl/aria.crt
    ok "TLS certificate generated"
else
    ok "TLS certificate already exists"
fi

# ─── Step 4: Validate .env ───────────────────────────────────────────────────
log "Validating .env file…"

if [ ! -f .env ]; then
    err ".env file not found. Copy: cp .env.example .env && nano .env"
fi

REQUIRED_VARS=("WAZUH_PASS" "OPENSEARCH_AUTH" "OPENSEARCH_BASIC_AUTH" "JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    VALUE=$(grep "^${var}=" .env | cut -d= -f2- | tr -d '[:space:]')
    if [ -z "$VALUE" ]; then
        err "${var} is not set in .env. See .env.example for instructions."
    fi
done
ok ".env validated"

# ─── Step 5: Check Wazuh API reachable ───────────────────────────────────────
WAZUH_URL=$(grep "^WAZUH_BASE_URL=" .env | cut -d= -f2- | tr -d '[:space:]')
WAZUH_URL="${WAZUH_URL:-https://127.0.0.1:55000}"

log "Checking Wazuh API at ${WAZUH_URL}…"
if curl -sk --max-time 5 "${WAZUH_URL}" &>/dev/null; then
    ok "Wazuh API reachable"
else
    warn "Wazuh API not reachable at ${WAZUH_URL} — deploy will continue but alerts won't work until Wazuh is running"
fi

# ─── Step 6: Configure Wazuh JWT TTL ─────────────────────────────────────────
WAZUH_API_YML="/var/ossec/api/configuration/api.yml"
if [ -f "$WAZUH_API_YML" ]; then
    log "Setting Wazuh JWT TTL to 28800 seconds (8 hours)…"
    if grep -q "auth_token_exp_timeout" "$WAZUH_API_YML"; then
        sed -i 's/auth_token_exp_timeout:.*/auth_token_exp_timeout: 28800/' "$WAZUH_API_YML"
    else
        echo "auth_token_exp_timeout: 28800" >> "$WAZUH_API_YML"
    fi
    # Restart Wazuh API manager if running
    systemctl restart wazuh-manager 2>/dev/null || true
    ok "Wazuh JWT TTL configured"
else
    warn "Wazuh API config not found — set auth_token_exp_timeout: 28800 in api.yml manually"
fi

# ─── Step 7: Build and start containers ──────────────────────────────────────
log "Building and starting ARIA containers…"
docker compose down --remove-orphans 2>/dev/null || true
docker compose up --build -d
ok "Containers started"

# ─── Step 8: Configure UFW firewall ──────────────────────────────────────────
log "Configuring UFW firewall…"
if command -v ufw &>/dev/null; then
    ufw allow 22/tcp    comment "SSH"
    ufw allow 80/tcp    comment "HTTP (redirect to HTTPS)"
    ufw allow 443/tcp   comment "HTTPS (ARIA dashboard)"
    ufw deny  8000/tcp  comment "FastAPI (internal only)" 2>/dev/null || true
    ufw deny  6379/tcp  comment "Redis (internal only)" 2>/dev/null || true
    ufw deny  9200/tcp  comment "OpenSearch (internal only)" 2>/dev/null || true
    ufw deny  11434/tcp comment "Ollama (internal only)" 2>/dev/null || true
    ufw --force enable
    ok "Firewall configured"
else
    warn "UFW not installed — install with: apt-get install -y ufw"
fi

# ─── Step 9: Health check ─────────────────────────────────────────────────────
log "Waiting for services to start…"
sleep 15

HEALTH_STATUS=""
for i in {1..6}; do
    HEALTH_STATUS=$(curl -skf https://localhost/api/health 2>/dev/null || echo "")
    if echo "$HEALTH_STATUS" | grep -q '"status"'; then
        break
    fi
    log "Waiting… ($((i*5))s)"
    sleep 5
done

if echo "$HEALTH_STATUS" | grep -q '"status"'; then
    echo ""
    ok "Health check passed"
    echo "$HEALTH_STATUS" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_STATUS"
else
    warn "Health check failed — checking logs…"
    docker compose logs --tail=20 backend
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ARIA Deployment Complete!              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Dashboard:  ${CYAN}https://${SERVER_IP}${NC}"
echo -e "  API Docs:   ${CYAN}https://${SERVER_IP}/api/docs${NC}"
echo ""
echo -e "  ${YELLOW}Accept the self-signed certificate warning in your browser.${NC}"
echo -e "  ${YELLOW}For production, use Certbot: certbot --nginx -d your.domain.com${NC}"
echo ""
echo -e "  Logs:     ${CYAN}docker compose logs -f${NC}"
echo -e "  Status:   ${CYAN}docker compose ps${NC}"
echo -e "  Restart:  ${CYAN}docker compose restart${NC}"
echo ""
