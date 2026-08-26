# BLACKOUT // The Cipher Game — Project Report

**Project:** blackout (com.blackout:blackout 1.0.0)
**Author:** Akriti S Shetty
**Stack:** Java 17 · Spring Boot 3.3.4 · vanilla HTML/CSS/JS + WebCrypto · Lombok · JUnit 5 / MockMvc · Maven

---

## 1. Overview

BLACKOUT is a full-stack spy-craft web game that teaches cryptography by making the player *use* it. A single Spring Boot fat jar serves both a JSON relay API and the static mission console (one screen, one mission at a time). Four mission types repeat forever:

| # | Mission | Algorithm | Points |
|---|---------|-----------|--------|
| 1 | SEAL THE INTEL | Playfair encryption | +10 |
| 2 | CRACK THE CODE | Playfair decryption | +15 |
| 3 | FIND THE FAKE | SHA-256 tamper detection | +20 |
| 4 | SECRET DROP | RSA-2048 unlock + Playfair | +25 |

Players solve missions by hand for full points or press AUTO-SOLVE for half. Wrong answers reveal the correct answer and cost nothing, so the game is failure-friendly and self-teaching.

## 2. Goals

1. Make three real cryptographic concepts tangible through gameplay: classical symmetric substitution (Playfair), modern asymmetric encryption (RSA-2048/OAEP), and integrity hashing (SHA-256).
2. Keep the whole thing deployable as **one artifact with zero external dependencies** — no database, no message broker, no build-time frontend toolchain.
3. Ship a client that does genuine cryptography in the browser, not just calls an API.

## 3. Architecture

```
Browser (static client)                Spring Boot relay (single fat jar)
┌─────────────────────────┐            ┌──────────────────────────────────┐
│ index.html              │   JSON     │ controller/  agents·missions·tools│
│ css/blackout.css        │ ◄────────► │ service/     AgentService        │
│ js/api.js  (fetch)      │            │              MissionService      │
│ js/ui.js   (rendering)  │            │ game/        MissionBank         │
│ js/badge.js (WebCrypto) │            │              MissionSessionStore │
│ js/game.js (game loop)  │            │ repository/  AgentStore          │
└─────────────────────────┘            │ entity/      Agent               │
   RSA keypair minted                  │ crypto/    ★ PlayfairEngine      │
   here, private key                   │            ★ AsymmetricEngine    │
   never leaves                        │            ★ Sha256Engine        │
                                       │            ★ DeadDropProtocol    │
                                       └──────────────────────────────────┘
```

### The signature feature: browser-minted RSA badges

The player's RSA-2048 keypair is generated **in the browser** via WebCrypto (`js/badge.js`), automatically on first visit. Only the public half is registered with the server (`PUT /api/agents/{codename}/badge`). Mission keywords are locked under that public key server-side; the browser unlocks them with the private key that never left the machine. This works because Java's `RSA/ECB/OAEPWithSHA-256AndMGF1Padding` and WebCrypto's `RSA-OAEP` + SHA-256 are wire-compatible — verified by `AsymmetricEngineTest`.

### Deliberate design decision: no database

Storage is thread-safe in-memory (`ConcurrentHashMap`) in `AgentStore` (agents/leaderboard) and `MissionSessionStore` (pending missions, TTL-swept after 15 minutes). JPA/H2 were removed intentionally:

- Missions expire in minutes; scores are session-scoped by nature.
- Zero configuration, instant startup, trivially portable.
- Trade-offs accepted: restarts wipe all state; single-instance only.

## 4. Components

### crypto/ — pure engines (no Spring dependencies)
| Engine | Role |
|---|---|
| `PlayfairEngine` | 5×5 grid construction from keyword, letter-pair encryption/decryption with standard I/J merging and filler rules |
| `AsymmetricEngine` | RSA-2048 OAEP wrap/unlock of short mission keywords |
| `Sha256Engine` | Integrity seals for the tamper-hunt mission |
| `DeadDropProtocol` | Sealed-package model backing FIND THE FAKE |

### game/
- `MissionBank` — generates mission challenges per type.
- `PendingMission` + `MissionSessionStore` — live attempts keyed by unguessable bearer token, expired after 15 minutes ("burned" operations).

### Frontend
Vanilla HTML/CSS/JS, no framework, no bundler. Terminal-inspired neon aesthetic with dark/light theme toggle (persisted in `localStorage`, respects `prefers-color-scheme`). ~1,700 lines across backend engines and client JS/CSS combined.

### enigma/ — local helper (clone-only bonus)
A standalone Swing-free Java UI that computes correct answers for any mission, for players learning the algorithms. Distributed only in the repo; hosted-site players don't get it.

## 5. REST API

Base: `http://127.0.0.1:8080`

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/agents` | enlist/resume by codename |
| GET | `/api/agents/{codename}` | profile |
| PUT | `/api/agents/{codename}/badge` | register RSA public badge |
| GET | `/api/leaderboard` | top agents |
| POST | `/api/missions/{codename}/new?type=` | draw a mission (`SEAL_INTEL`, `CRACK_BROADCAST`, `TAMPER_HUNT`, `SECRET_DROP`) |
| POST | `/api/missions/{codename}/solve` | submit solution (`"assisted":true` = half points) |
| GET/POST | `/api/tools/playfair/grid`, `/seal`, `/open`, `/api/tools/sha256`, `/api/tools/rsa/wrap`, `/unlock` | crypto tools used by the UI |

Validation errors are normalized by a global `@RestControllerAdvice` handler.

## 6. Testing

24 tests, all green:

- **Crypto engines (18):** Playfair vectors & rules (8), RSA round-trips incl. Java↔WebCrypto compatibility (6), dead-drop/tamper protocol (4) — `src/test/java/com/blackout/crypto/`.
- **Game flow integration (6):** full loop over MockMvc — enlist → draw → solve → leaderboard — `GameFlowIntegrationTest`.

## 7. Deployment

- `Dockerfile` + `render.yaml`: single Docker web service on Render, port from `$PORT`.
- Local dev: `mvn spring-boot:run` → http://127.0.0.1:8080.
- No environment secrets required; the only env var consumed is `PORT`.

## 8. Challenges & lessons learned

1. **Java ↔ WebCrypto RSA interop.** Getting `RSA-OAEP` ciphertexts produced in the browser to decrypt in Java required matching OAEP hash (SHA-256) *and* MGF1 hash exactly — a common silent-failure trap, settled by cross-platform tests.
2. **Playfair edge cases.** Double letters within a pair, odd-length messages, and J/I merging all needed explicit rules and test vectors before the mission generator could produce fair challenges.
3. **Statelessness discipline.** Removing H2 forced clean separation between durable-ish state (`AgentStore`) and ephemeral state (`MissionSessionStore` with TTL sweeping), which simplified the service layer.
4. **Zero-toolchain frontend.** Proved that a reactive single-page game client is achievable with plain JS modules when the API is well-shaped — no React, no npm, no build step.

## 9. Honest limitations

- Playfair is 19th-century pedagogy; it protects nothing real.
- Codename-only "login" is acceptable on loopback and nowhere else.
- Raw SHA-256 seals are unkeyed digests, not MACs; RSA wraps only a short keyword.
- In-memory storage means restarts clear scores and the app cannot scale horizontally.
- No authentication/rate limiting; intended as an educational toy, not a hardened service.

## 10. Conclusion

BLACKOUT meets its goal: a dependency-light, single-jar educational game where every mission teaches a real cipher and the most interesting lesson (browser-held RSA keys unlocking server-side locks) emerges naturally from play. The architecture is deliberately minimal — and the report's closing recommendation is that it stay that way unless persistence or multi-instance scaling becomes a genuine requirement.

---

*Project closed: August 26, 2026.*
