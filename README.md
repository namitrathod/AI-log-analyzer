# ⚡ Log Analyzer — AI-Powered Log Analysis

> A microservice that analyzes logs, stack traces, and error messages using a local AI model (Ollama). Returns a structured **summary**, **root cause**, **suggested fix**, and **severity rating** — individually or in batches of up to 20.

![Java](https://img.shields.io/badge/Java-17-orange) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green) ![React](https://img.shields.io/badge/React-18-blue) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED) ![Ollama](https://img.shields.io/badge/AI-Ollama-black)

---

## What It Does

Paste any log or error message and get back:
```json
{
  "summary": "NullPointerException in PaymentService when processing credit card",
  "rootCause": "The creditCard object is null before .getCardNumber() is called on line 112",
  "suggestedFix": "Add null check before line 112. Validate gateway response in StripeClient before returning.",
  "severity": "CRITICAL",
  "success": true,
  "processingTimeMs": 18432
}
```

**Severity levels:** CRITICAL — HIGH — MEDIUM — LOW

**Supported log types:** Java stack traces, SQL errors, Nginx logs, Kubernetes events, Python tracebacks, and more

---

## Architecture
```
Browser (port 3000)
  └── React UI served by Nginx
        └── /api/* requests proxied internally to →
              Spring Boot API (port 8080)
                ├── Rate limiting (Bucket4j)
                ├── Parallel batch processing (ExecutorService)
                └── Calls Ollama AI (local, free, no API key)
                      └── Returns JSON analysis
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.2 |
| AI | Ollama (local) + Llama 3.2 |
| Rate limiting | Bucket4j |
| Concurrency | Java ExecutorService thread pool |
| Frontend | React 18, Axios |
| Web server | Nginx (static files + reverse proxy) |
| Containerization | Docker, Docker Compose |
| Build tools | Maven, npm |

---

## Project Structure
```
ai-log-analyzer/
├── docker-compose.yml                  ← Start everything
├── .env                                ← Your config (never commit)
├── .env.example                        ← Template
├── .gitignore
│
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/loganalyzer/
│       ├── LogAnalyzerApplication.java
│       ├── config/
│       │   ├── AIConfig.java           ← Loads Ollama URL + model from env
│       │   └── CorsConfig.java         ← Allows frontend to call backend
│       ├── controller/
│       │   └── LogAnalysisController.java  ← 3 REST endpoints
│       ├── model/
│       │   ├── LogRequest.java
│       │   ├── BatchLogRequest.java
│       │   ├── LogAnalysisResult.java
│       │   └── BatchAnalysisResponse.java
│       ├── service/
│       │   ├── AIService.java          ← Calls Ollama, parses response
│       │   └── LogAnalysisService.java ← Rate limiting + batch processing
│       └── exception/
│           └── GlobalExceptionHandler.java
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf                      ← Proxies /api/ to backend
    ├── package.json
    └── src/
        ├── App.jsx
        ├── index.css
        └── components/
            ├── Header.jsx
            ├── SingleAnalyzer.jsx
            ├── BatchAnalyzer.jsx
            └── ResultCard.jsx
```

---

## Quick Start

### Prerequisites
- Docker Desktop — https://www.docker.com/products/docker-desktop/
- Ollama installed — https://ollama.ai/

### Step 1 — Install and Start Ollama

**Local machine:**
```bash
# Install (Mac/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the model (~2GB)
ollama pull llama3.2

# Start Ollama
ollama serve
```

**GitHub Codespaces:**
```bash
# Install
curl -fsSL https://ollama.ai/install.sh | sh

# Start bound to all interfaces (required for Docker to reach it)
OLLAMA_HOST=0.0.0.0:11434 ollama serve &

# Pull model
ollama pull llama3.2
```

### Step 2 — Find Your Docker Gateway IP (Codespaces only)
```bash
# Run this AFTER starting Docker once
docker network inspect ai-log-analyzer_log-analyzer-net | grep Gateway
```

Copy the IP (e.g. `172.18.0.1`) and update `.env`.

### Step 3 — Configure
```bash
cp .env.example .env
# Edit .env and set AI_API_URL to your Ollama address
```

`.env` file:
```
AI_API_URL=http://172.18.0.1:11434   # Docker gateway IP
AI_MODEL=llama3.2
RATE_LIMIT_PER_MINUTE=10
```

> On a local machine use `http://host.docker.internal:11434` instead.

### Step 4 — Start Everything
```bash
docker compose up --build
```

### Step 5 — Open the App
- **UI:** http://localhost:3000 (or port 3000 URL in Codespaces)
- **API health check:** http://localhost:8080/api/logs/health

### Stop Everything
```bash
docker compose down
```

---

## Codespaces — Daily Startup

Every time you reopen Codespaces, run this before starting Docker:
```bash
# Start Ollama
OLLAMA_HOST=0.0.0.0:11434 ollama serve &
sleep 5

# Start Docker
docker compose up
```

---

## API Reference

### POST /api/logs/analyze — single log
```json
{
  "logText": "java.lang.NullPointerException at Service.java:45",
  "source": "order-service",
  "logType": "java_stacktrace"
}
```

| Field | Required | Description |
|---|---|---|
| logText | Yes | Raw log (10–50,000 chars) |
| source | No | Label for where the log came from |
| logType | No | Hint for better accuracy |

**Log type hints:** `java_stacktrace` `sql_error` `nginx_error` `python_traceback` `kubernetes_event`

---

### POST /api/logs/analyze/batch — up to 20 logs
```json
{
  "parallel": true,
  "logs": [
    { "logText": "...", "source": "service-a" },
    { "logText": "...", "source": "service-b" }
  ]
}
```

---

### GET /api/logs/health
```json
{ "status": "UP", "service": "AI Log Analyzer", "version": "1.0.0" }
```

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| AI_API_URL | http://localhost:11434 | Ollama server address |
| AI_MODEL | llama3.2 | Model to use |
| RATE_LIMIT_PER_MINUTE | 10 | Max requests per minute |

**Available Ollama models:**

| Model | Size | Notes |
|---|---|---|
| llama3.2 | 2GB | Default, good balance |
| codellama | 4GB | Better for code errors |
| mistral | 4GB | Fast and accurate |

To switch model: change `AI_MODEL` in `.env` then `docker compose down && docker compose up`

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Failed to reach Ollama` | Make sure Ollama is running: `ollama serve` |
| `Failed to parse response` | JSON repair is built in — if it still fails, try a different model |
| `Rate limit exceeded` | Increase `RATE_LIMIT_PER_MINUTE` in `.env` |
| Container not starting | Run `docker compose down` then `docker compose up --build` |
| Slow responses | Normal — local models take 10-30 seconds per analysis |

**Useful debug commands:**
```bash
# Check containers are running
docker ps

# Check backend logs
docker logs log-analyzer-backend --tail 50

# Test Ollama is reachable from Docker
curl http://172.18.0.1:11434/api/tags

# Test full flow
curl -X POST http://localhost:3000/api/logs/analyze \
  -H "Content-Type: application/json" \
  -d '{"logText": "java.lang.NullPointerException at Service.java:45", "source": "test"}'
```

---

## Roadmap

- [ ] Save results to MySQL for history
- [ ] Kafka integration — consume logs from a topic automatically  
- [ ] Slack/email alerts for CRITICAL issues
- [ ] Log file upload (drag and drop .log files)
- [ ] Dashboard with error trends over time
