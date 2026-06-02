# Deploying Workly

Workly is designed to be **infrastructure-agnostic**. Each of its four moving
parts can be swapped independently — the application reads everything it needs
from environment variables, and Docker Compose is just one convenient way to
supply them, never a requirement.

| Component  | Swap for…                                              | Configured via                                  |
|------------|--------------------------------------------------------|-------------------------------------------------|
| PostgreSQL | RDS, Cloud SQL, Neon, Supabase, self-hosted            | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`          |
| Kafka      | Confluent Cloud, MSK, Aiven, Redpanda — or disable it  | `KAFKA_*`                                        |
| Backend    | Kubernetes, GKE, ECS, Fly.io, Render, a plain VM       | stateless container + env vars                  |
| Frontend   | Vercel, Netlify, Cloudflare, any Node host             | `API_BASE_URL` (runtime) / `NEXT_PUBLIC_API_BASE_URL` (build) |

Start from [`.env.example`](.env.example): `cp .env.example .env`. Every value
has a default that works against the bundled Compose stack, so a fresh clone
runs with no edits.

---

## Quick start (everything local)

```bash
cp .env.example .env
docker compose up -d                 # Postgres + Kafka + Zookeeper only
# run backend + frontend locally (see below), OR:
docker compose --profile full up -d  # also build & run backend + frontend
```

Without `--profile full`, only the infrastructure services start — run the
backend (`./mvnw spring-boot:run`) and frontend (`npm run dev`) on your host.

---

## Swapping each component

### PostgreSQL → managed / external

Set these (in `.env`, or directly as env vars on your host) and the backend
uses them instead of the bundled container. The defaults in
`application.properties` only kick in when they're unset.

```bash
DB_URL=jdbc:postgresql://your-host:5432/your-db
DB_USERNAME=app_user
DB_PASSWORD=••••••
```

The schema is created automatically (`spring.jpa.hibernate.ddl-auto=update`).
On a shared/managed database you may prefer to manage migrations explicitly —
see [Production notes](#production-notes).

### Kafka → cloud broker

Point at the broker and supply credentials. The security vars are only applied
when set, so local PLAINTEXT keeps working untouched.

```bash
KAFKA_BOOTSTRAP_SERVERS=pkc-xxxx.region.provider.confluent.cloud:9092
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_MECHANISM=PLAIN
KAFKA_SASL_JAAS_CONFIG=org.apache.kafka.common.security.plain.PlainLoginModule required username="<key>" password="<secret>";
```

(`SCRAM-SHA-256`/`SCRAM-SHA-512` and a custom truststore via
`KAFKA_SSL_TRUSTSTORE_LOCATION` / `KAFKA_SSL_TRUSTSTORE_PASSWORD` are also
supported.)

> **Note on auto-created topics:** the backend tries to create the `org.events`
> topic on startup. Some managed brokers disallow this — pre-create the topic,
> or grant the credentials topic-create permission.

### Kafka → none

For the simplest possible deployment, turn Kafka off entirely:

```bash
KAFKA_ENABLED=false
```

All Kafka beans are gated behind `@ConditionalOnProperty(app.kafka.enabled)`,
so the app boots and serves normally — events that would have been published
are simply not delivered.

### Frontend → deployed anywhere (no rebuild)

The frontend resolves its backend URL **at runtime** by calling its own
`/config` route, which reads the server-side `API_BASE_URL` env var. This means
**one built image works on every host** — just set the env var per environment:

```bash
API_BASE_URL=https://api.your-domain.com
```

If your host cannot inject runtime env vars (rare), fall back to the build-time
variable and rebuild per environment:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com  # baked at `next build`
```

Resolution order is: runtime `API_BASE_URL` → build-time
`NEXT_PUBLIC_API_BASE_URL` → `http://localhost:8080`.

---

## Deployment targets

### Kubernetes / GKE

The backend and frontend are stateless containers — give each a `Deployment`,
a `Service`, and a `ConfigMap` + `Secret` for env. Sketch:

```yaml
# backend env (ConfigMap for non-secret, Secret for credentials)
DB_URL: jdbc:postgresql://postgres.internal:5432/workly
KAFKA_BOOTSTRAP_SERVERS: kafka.internal:9092
KAFKA_ENABLED: "true"
# from Secret:
DB_USERNAME, DB_PASSWORD, JWT_SECRET, KAFKA_SASL_JAAS_CONFIG
```

```yaml
# frontend env
API_BASE_URL: https://api.your-domain.com   # runtime, no rebuild
```

Health/readiness probes: backend exposes Spring Actuator on port **8081**
(`/actuator/health`); the app itself on **8080**. Frontend on **3000**.

On GKE, use Cloud SQL for Postgres (via the Cloud SQL Auth Proxy sidecar or a
private IP in `DB_URL`) and either a self-managed broker or a managed Kafka.

### Vercel / Netlify (frontend) + container backend

Deploy the frontend straight from the repo; set `API_BASE_URL` (or
`NEXT_PUBLIC_API_BASE_URL`) in the host's environment settings. Host the
backend anywhere reachable over HTTPS.

> **Cross-domain cookies:** when frontend and backend are on different domains,
> set `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=None` (both require HTTPS) so
> the refresh-token cookie is sent.

---

## Recipes (end-to-end scenarios)

The sections above cover each component in isolation. These are complete,
copy-pasteable combinations for common real-world setups. The invariant across
all of them: **you only set environment variables — never edit Java or Compose
internals — to swap infrastructure.**

### Recipe 1 — Local app, DB on AWS RDS, Kafka local

Develop on your laptop with the backend/frontend running as host processes, but
data lives in managed RDS. Kafka stays in the bundled container.

```bash
# .env
DB_URL=jdbc:postgresql://workly.abc123.us-east-1.rds.amazonaws.com:5432/workly
DB_USERNAME=workly_app
DB_PASSWORD=••••••
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
JWT_SECRET=<long-random-32+char-secret>
```

```bash
docker compose up -d kafka zookeeper      # broker only — NOT the postgres container
cd workly-backend && ./mvnw spring-boot:run
cd workly-frontend && npm run dev
```

The RDS security group must allow inbound 5432 from your IP.

### Recipe 2 — App in Compose, managed DB + managed Kafka

App containers run via Compose on one VM; database is **AWS RDS** and the broker
is **Confluent Cloud**.

```bash
# .env
# --- Managed Postgres (RDS) ---
DB_URL=jdbc:postgresql://workly.abc123.us-east-1.rds.amazonaws.com:5432/workly
DB_USERNAME=workly_app
DB_PASSWORD=••••••

# --- Managed Kafka (Confluent Cloud) ---
KAFKA_BOOTSTRAP_SERVERS=pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_MECHANISM=PLAIN
KAFKA_SASL_JAAS_CONFIG=org.apache.kafka.common.security.plain.PlainLoginModule required username="CONFLUENT_KEY" password="CONFLUENT_SECRET";

# --- Frontend → backend public address ---
API_BASE_URL=https://workly.your-domain.com
NEXT_PUBLIC_API_BASE_URL=https://workly.your-domain.com

JWT_SECRET=<long-random-32+char-secret>
COOKIE_SECURE=true
```

```bash
docker compose --profile full up -d backend frontend   # external DB+Kafka, so no infra containers
```

Because `DB_URL` and `KAFKA_BOOTSTRAP_SERVERS` are set, the `${VAR:-default}`
overrides in `docker-compose.yml` make the app ignore the local containers
entirely — don't start `postgres`/`kafka`/`zookeeper`.

> Confluent Cloud disallows auto-creating topics. Pre-create the `org.events`
> topic in their UI/CLI first, or the `KafkaAdmin` startup call will fail.

### Recipe 3 — Self-hosted Kafka with SCRAM auth

Own Kafka on a dedicated server with SCRAM authentication, self-hosted Postgres
on another box.

```bash
# .env
DB_URL=jdbc:postgresql://10.0.1.50:5432/workly
DB_USERNAME=workly
DB_PASSWORD=••••••

KAFKA_BOOTSTRAP_SERVERS=10.0.1.60:9092
KAFKA_SECURITY_PROTOCOL=SASL_PLAINTEXT          # or SASL_SSL if TLS is on
KAFKA_SASL_MECHANISM=SCRAM-SHA-512
KAFKA_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="workly" password="••••••";

JWT_SECRET=<long-random-32+char-secret>
```

If the broker uses a private/self-signed CA over TLS, also mount a truststore
into the backend container and set:

```bash
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SSL_TRUSTSTORE_LOCATION=/etc/workly/kafka.truststore.jks
KAFKA_SSL_TRUSTSTORE_PASSWORD=••••••
```

### Recipe 4 — Backend on GKE, Cloud SQL, managed Kafka

Production: stateless backend pods on GKE, Cloud SQL Postgres, Aiven/Confluent
Kafka. Non-secret config in a `ConfigMap`, credentials in a `Secret`.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: workly-secrets
stringData:
  DB_USERNAME: workly_app
  DB_PASSWORD: "••••••"
  JWT_SECRET: "<long-random-32+char-secret>"
  KAFKA_SASL_JAAS_CONFIG: |
    org.apache.kafka.common.security.plain.PlainLoginModule required username="KEY" password="SECRET";
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: workly-config
data:
  DB_URL: "jdbc:postgresql://127.0.0.1:5432/workly"   # via Cloud SQL Auth Proxy sidecar
  KAFKA_BOOTSTRAP_SERVERS: "broker.aivencloud.com:12345"
  KAFKA_SECURITY_PROTOCOL: "SASL_SSL"
  KAFKA_SASL_MECHANISM: "PLAIN"
  COOKIE_SECURE: "true"
  COOKIE_SAME_SITE: "None"
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workly-backend
spec:
  replicas: 2
  selector:
    matchLabels: { app: workly-backend }
  template:
    metadata:
      labels: { app: workly-backend }
    spec:
      containers:
        - name: backend
          image: your-registry/workly-backend:latest
          ports:
            - containerPort: 8080   # app
            - containerPort: 8081   # actuator / health
          envFrom:
            - configMapRef: { name: workly-config }
            - secretRef:    { name: workly-secrets }
          readinessProbe:
            httpGet: { path: /actuator/health, port: 8081 }
          livenessProbe:
            httpGet: { path: /actuator/health, port: 8081 }
        # Cloud SQL Auth Proxy sidecar — makes DB_URL reachable at 127.0.0.1:5432
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2
          args: ["your-project:us-central1:workly-instance", "--port=5432"]
```

The backend image is unchanged — it only reads env. Swapping Cloud SQL for RDS
later is a one-line `DB_URL` edit.

### Recipe 5 — Frontend on Vercel, backend on a container host

Frontend on Vercel's CDN; backend on Fly.io / Render / a VM.

On **Vercel** (Project → Settings → Environment Variables):

```bash
API_BASE_URL=https://workly-api.fly.dev
```

That's the whole frontend config. Because the frontend reads its API URL at
runtime via the `/config` route, you don't rebuild per environment — and you can
re-point to a different backend by changing this var and redeploying.

On the **backend host**, set DB/Kafka/JWT per whichever recipe matches your
infra, plus the cross-domain cookie settings:

```bash
COOKIE_SECURE=true
COOKIE_SAME_SITE=None    # frontend (*.vercel.app) and API are different domains
```

> Without `SameSite=None; Secure`, the refresh-token cookie won't be sent from a
> Vercel domain to your API domain, and sessions won't persist.

### Recipe 6 — Minimal deploy, no Kafka

Least possible infra — one Postgres, no broker.

```bash
# .env
KAFKA_ENABLED=false                              # disables the entire Kafka chain
DB_URL=jdbc:postgresql://your-db-host:5432/workly
DB_USERNAME=workly
DB_PASSWORD=••••••
JWT_SECRET=<long-random-32+char-secret>
```

The app boots and serves normally; event/notification publishing is skipped
(all Kafka beans are gated off). Good for evaluation or small self-hosted
instances.

### Cheat-sheet

| You have…                              | Set these                                                                                          |
|----------------------------------------|----------------------------------------------------------------------------------------------------|
| RDS / Cloud SQL / Neon / Supabase      | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`                                                              |
| Confluent / MSK / Aiven Kafka          | `KAFKA_BOOTSTRAP_SERVERS` + `KAFKA_SECURITY_PROTOCOL` + `KAFKA_SASL_MECHANISM` + `KAFKA_SASL_JAAS_CONFIG` |
| Self-signed TLS broker                 | + `KAFKA_SSL_TRUSTSTORE_LOCATION`, `KAFKA_SSL_TRUSTSTORE_PASSWORD`                                  |
| No broker                              | `KAFKA_ENABLED=false`                                                                              |
| Frontend on a different domain         | `API_BASE_URL` (runtime) + `COOKIE_SECURE=true` + `COOKIE_SAME_SITE=None`                          |
| Production anything                    | `JWT_SECRET` (real), `COOKIE_SECURE=true`                                                          |

---

## Production notes

- **Set `JWT_SECRET`** to a long random value (≥32 chars). The default is a
  placeholder and is not secret.
- **`COOKIE_SECURE=true`** behind HTTPS; pick `COOKIE_SAME_SITE` to match your
  topology (`Strict` same-site, `None` cross-site).
- **Database migrations:** `ddl-auto=update` is convenient but unmanaged. For
  production on a shared/managed DB, consider adding Flyway or Liquibase and
  switching to `ddl-auto=validate`.
- **Backend ports:** app `8080`, management/metrics `8081`
  (`/actuator/health`, `/actuator/prometheus`).

---

## Environment variable reference

See [`.env.example`](.env.example) for the full, commented list grouped by
component. Every variable has a default suitable for local Compose; override
only what you're swapping.
