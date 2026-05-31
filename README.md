# ARIA — Automated Response Intelligence Analyst
> Self-hosted, AI-powered Security Operations Center platform

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Ollama](https://img.shields.io/badge/AI-llama3.2-purple)](https://ollama.ai)

## What is ARIA?

ARIA is a complete SOC dashboard that integrates with your existing Wazuh SIEM,
runs AI triage using a local llama3.2 model (no cloud required), and streams
live alerts to your browser in real time.

**Total cost to run: ~$30/month VPS (vs. $150k+/year for commercial alternatives)**

---

## Architecture

```
Ubuntu Server
├── Wazuh Manager (:55000)      ← receives logs from endpoints
├── OpenSearch (:9200)          ← stores all alerts/logs
├── Ollama (:11434)             ← runs llama3.2 locally (CPU)
├── Redis (:6379)               ← alert pub/sub
├── FastAPI backend (:8000)     ← all business logic
├── React frontend (:3000)      ← SOC dashboard
└── Nginx (:443/:80)            ← TLS + reverse proxy
```

> **Security rule:** The browser NEVER talks to Wazuh, OpenSearch, or Ollama directly.
> All requests flow through FastAPI. Nginx injects OpenSearch credentials server-side.

---

## Quick Start (Ubuntu 22.04+)

### Prerequisites
- Ubuntu 22.04 or 24.04 LTS
- 16GB RAM minimum (32GB recommended)
- Wazuh 4.x all-in-one installed
- Ollama installed with `llama3.2` pulled: `ollama pull llama3.2`

### 1. Clone and configure
```bash
git clone https://github.com/your-org/aria-soc.git
cd aria-soc
cp .env.example .env
nano .env  # Fill in ALL required values
```

### 2. Generate required secrets
```bash
# Wazuh password — set during Wazuh installation
# OpenSearch auth
echo -n "admin:YourOpenSearchPassword" | base64
# JWT secret
openssl rand -hex 32
```

### 3. Deploy
```bash
sudo bash deploy.sh
```

The script will:
- Install Docker if needed
- Generate a self-signed TLS certificate
- Validate your `.env`
- Build and start all containers
- Configure UFW firewall
- Run a health check

### 4. Access ARIA
```
https://YOUR_SERVER_IP
```
Accept the self-signed certificate warning.
Login with your Wazuh credentials.

---

## Manual Docker Deployment

```bash
# Build and start
docker compose up --build -d

# Check logs
docker compose logs -f backend

# Health check
curl -sk https://localhost/api/health | python3 -m json.tool
```

---

## Development Setup

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Create a dev .env with at minimum:
# WAZUH_PASS=yourpass
# OPENSEARCH_AUTH=base64string
# OPENSEARCH_BASIC_AUTH=base64string
# JWT_SECRET=random32chars

uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## API Reference

Interactive docs available at `https://YOUR_SERVER/api/docs`

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Authenticate with Wazuh credentials |
| `/api/alerts` | GET | List alerts (paginated, filterable) |
| `/api/alerts/stats` | GET | Dashboard aggregations |
| `/api/alerts/{id}` | GET | Single alert detail |
| `/api/agents` | GET | List Wazuh agents |
| `/api/search` | POST | Raw OpenSearch DSL query |
| `/api/ai/triage` | POST | AI alert triage (structured JSON) |
| `/api/ai/chat` | POST | Streaming AI chat (SSE) |
| `/api/ai/hunt` | POST | Threat hunt plan design |
| `/api/ai/nl-search` | POST | NL → OpenSearch DSL + results |
| `/api/health` | GET | Service health check |
| `/ws/alerts` | WS | Live alert stream |

---

## Environment Variables

See [`.env.example`](.env.example) for full documentation.

**Required variables (no defaults):**
- `WAZUH_PASS` — Wazuh API password
- `OPENSEARCH_AUTH` — base64("admin:password")
- `OPENSEARCH_BASIC_AUTH` — same, used by Nginx
- `JWT_SECRET` — 32+ char random string (`openssl rand -hex 32`)

---

## Known Bug Fixes Applied

| Bug | Fix |
|---|---|
| Ollama 30s silence | Always `stream: True` — chunks arrive immediately |
| JWT expiry not checked | `expiresAt` stored in session, checked before every request |
| Hardcoded server IP in CSP | Uses `$host` variable — works on any server |
| Default passwords in env | All secrets are REQUIRED with no defaults |
| Missing component imports | Every component built before the page that uses it |

---

## Hardware Requirements

| Component | Min RAM |
|---|---|
| Wazuh Manager | 4 GB |
| OpenSearch (Wazuh Indexer) | 8 GB |
| Ollama + llama3.2 | 4 GB |
| FastAPI + Redis | 512 MB |
| **Total minimum** | **16 GB** |

CPU: 8 cores minimum  
Storage: 200GB SSD (plan for ~1GB/day/10 agents)

---

## License

MIT — Self-hosted, open-source, no telemetry.
