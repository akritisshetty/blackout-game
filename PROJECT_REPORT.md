## Cryptography & Network Security — Project Report
# BLACKOUT — The Cipher Game

---
## Problem Statement

Cryptography is a fundamental pillar of modern network security, yet it remains an abstract and intimidating subject for most students. Traditional teaching methods — textbook definitions, hand-written trace tables, and rote memorisation of algorithms — fail to convey *why* these algorithms matter and *how* they work in real systems.

This project focuses on three foundational cryptographic algorithms—the **Playfair Cipher** (classical symmetric encryption), **RSA** (modern asymmetric encryption), and **SHA-256** (hashing)—to explore how teachers can effectively teach and students can learn these concepts through hands-on, engaging activities that reflect their real-world applications.

---

## Introduction

Cryptography is the science of securing communication by transforming readable data (plaintext) into an unreadable form (ciphertext). It has evolved over centuries — from simple substitution ciphers used by Roman generals, to the Enigma machine of World War II, to the mathematical public-key systems that secure every online transaction today.

This project implements and demonstrates three cryptographic techniques, each representing a different era and category of cryptography:

| Algorithm | Category | Era | Reversible? |
|-----------|----------|-----|-------------|
| **Playfair Cipher** | Classical symmetric cipher | 1854 | Yes |
| **RSA Algorithm** | Modern asymmetric (public-key) cipher | 1977 | Yes |
| **SHA-256** | Modern cryptographic hash function | 2001 | No |

The project is built as **BLACKOUT — The Cipher Game**, a full-stack Java web application that teaches cryptography by making the player *use* it. Players take on the role of a spy, solving missions that require them to encrypt messages, decrypt intercepted communications, detect tampered packages, and unlock secret drops — all using real cryptographic algorithms.

The complete system has three parts:

- **The Game** — a Web app where students earn points by solving cryptographic missions by hand.
- **The Learning Centre (LEARN tab)** — an interactive crypto lab where the same three algorithms can be explored freely, with live grids, live hashing, and live public-key encryption. No login required, so it is ideal for classroom projection.
- **Enigma** — a standalone desktop helper application (Java Swing) that performs RSA, SHA-256, and Playfair operations independently, serving as a learning aid and a calculator for students solving missions by hand.

---

## 3. Proposed Solution

The proposed solution is built around a single idea: **students learn cryptography best by doing it.**

A single Spring Boot application (fat JAR) serves a REST JSON API and a static game client (vanilla HTML/CSS/JS with a dark tactical theme). The game presents four mission types that cycle endlessly:

| # | Mission Name | Algorithm Used | What the Player Does | Points |
|---|-------------|----------------|----------------------|--------|
| 1 | SEAL THE INTEL | Playfair Cipher (Encrypt) | Encrypt a plaintext message using a given keyword and the Playfair grid | +10 |
| 2 | CRACK THE CODE | Playfair Cipher (Decrypt) | Decrypt a ciphertext message using a given keyword | +15 |
| 3 | FIND THE FAKE | SHA-256 Hash | Three packages are presented; only ONE is genuine — the player re-hashes each to find the real one | +20 |
| 4 | SECRET DROP | RSA-2048 + Playfair | The player's browser-generated RSA key unlocks a secret, then the player decrypts a Playfair-encrypted message | +25 |

The **Learning Centre** (LEARN tab) provides three free-play labs — Playfair grid builder, SHA-256 avalanche demo, and RSA key exchange — requiring no login, making it ideal for classroom projection. An **Enigma** desktop helper (Java Swing) lets students perform the same algorithms independently as a study aid.

---

## 4. Algorithms Implemented

Three algorithms are implemented, covering the three families of cryptography: a *classical symmetric* cipher (Playfair), a *modern asymmetric* cipher (RSA), and a *cryptographic hash function* (SHA-256).

### 4.1 Playfair Cipher

The Playfair cipher encrypts text by operating on **pairs of letters** (digraphs) using a 5×5 keyword-generated grid. To solve a problem: build the grid from a keyword, split plaintext into digraphs (inserting X for duplicate pairs and padding odd lengths), then apply row/column/rectangle substitution rules.

**Example problem:** Encrypt `HELLO` with keyword `KEYWORD`.

**Solution:**

1. **Build the 5×5 matrix** from unique letters of KEYWORD, then the remaining alphabet (excluding J):

```
K  E  Y  W  O
R  D  A  B  C
F  G  H  I  J
L  M  N  P  Q
S  T  U  V  X
```

2. **Prepare the text:** HELLO → `HE LX LO` (insert X between the duplicate L's)

3. **Encrypt each digraph** using the substitution rules:
   - **HE**: H at (2,2), E at (0,1) — different row/column (rectangle rule) → H→(2,1)=**G**, E→(0,2)=**Y** → `GY`
   - **LX**: rectangle rule → **IZ**
   - **LO**: rectangle rule → **SC**

4. **Result: Ciphertext = GYIZSC**

**Use cases:** Teaching classical substitution ciphers, keyspace concepts, and why digraphs defeat simple frequency analysis.

### 4.2 RSA Algorithm

RSA is a public-key cryptosystem whose security rests on the **Integer Factorisation Problem** — factoring a large composite `n = p × q` is computationally infeasible. To solve a problem: generate two large primes p and q, compute `n = p×q`, derive public exponent `e` and private exponent `d`, then encrypt with `C = M^e mod n` and decrypt with `M = C^d mod n`.

**Example problem:** Encrypt plaintext `65` (ASCII 'A') with keys from p=61, q=53.

**Solution:**

1. **Key generation:**
   - `n = 61 × 53 = 3233`
   - `φ(n) = (61-1)(53-1) = 60 × 52 = 3120`
   - Choose `e = 17` (since gcd(17, 3120) = 1)
   - Compute `d = 17⁻¹ mod 3120 = 2753` (because 17 × 2753 = 46801 = 15 × 3120 + 1)
   - Public key = (e=17, n=3233), Private key = (d=2753, n=3233)

2. **Encryption:** `C = 65^17 mod 3233 = 2790`

3. **Decryption:** `M = 2790^2753 mod 3233 = 65` ✓ (original plaintext recovered, since `ed ≡ 1 mod φ(n)`)

**Use cases:** TLS/HTTPS, SSH, digital signatures, secure key exchange — the backbone of internet security.

### 4.3 SHA-256 Hash Function

SHA-256 is a one-way hash function that produces a fixed 256-bit (64 hex character) digest from any input. It cannot be reversed. To solve a problem: pass any data through the SHA-256 algorithm and compare the resulting hash against a known-good hash to verify integrity.

**Example problem:** Verify that `"abc"` has not been tampered with.

**Solution:**

1. **Compute the hash** of the received message: `SHA-256("abc")` = `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`

2. **Compare it** against the known-good hash (published by the sender or a trusted source).

3. **Verify:** If the two 64-character hex digests match *exactly*, the data is intact. Any tampering, even changing a single character, produces a completely different hash (avalanche effect) — so a mismatch means the message was altered.

**Use cases:** Password storage, digital signatures, file integrity verification, blockchain/Bitcoin proof-of-work, TLS certificate verification.

---

## 5. Simulation Details

### Starting the Game

```bash
mvn spring-boot:run
# Open http://127.0.0.1:8080
```

The player enters a codename, the server registers the agent, and the browser auto-generates an RSA-2048 keypair (WebCrypto) and registers the public key.

### Mission Cycle

Missions cycle in a fixed order: **SEAL THE INTEL** (Playfair encrypt, +10 pts) → **CRACK THE CODE** (Playfair decrypt, +15 pts) → **FIND THE FAKE** (SHA-256 tamper detection among 3 packages, +20 pts) → **SECRET DROP** (RSA unlock + Playfair decrypt, +25 pts). Each mission includes the relevant algorithm grid/tools and a "HOW IT WAS CALCULATED" explanation panel — whether the answer is right or wrong, the student sees a full walkthrough.

### Scoring

Correct answers earn full points; AUTO-SOLVE earns half. Wrong answers earn 0 but reveal the correct solution. Missions expire after 15 minutes. Scores accumulate on a leaderboard visible via the TOP AGENTS tab.

---

## 6. Implementation Details

| Technology | Choice | Reason |
|------------|--------|--------|
| Language | Java 17 | Platform-independent, strong crypto libraries (JCA/JCE) |
| Backend | Spring Boot 3.3.4 | Embedded server, REST API, validation |
| Frontend | Vanilla HTML/CSS/JS | Zero build step — runs on any browser |
| RSA keys | WebCrypto API | Browser-native RSA-2048-OAEP |
| SHA-256 | `java.security.MessageDigest` | JCA-certified, hardware-accelerated |
| Build | Maven | Standard Java build tool |
| Deployment | Docker + Render | Single container, port from `$PORT` |

Error handling uses `IllegalArgumentException` in algorithm classes, a global `@RestControllerAdvice` handler for JSON error envelopes, and a colour-coded status bar (green/yellow/red) on the frontend.

The REST API exposes endpoints for agent management, mission generation/solution, leaderboard, and crypto tools (Playfair grid/seal/open, SHA-256 hash, RSA wrap/unlock).

---

## 7. Deployment

The application is deployed on **Render** as a Docker web service. The `render.yaml` defines the service configuration — the only environment variable required is `PORT` (provided by Render). No database, no secrets, and no external services are needed. The app runs as a single self-contained JAR inside the container.

---

## 8. Challenges & Lessons Learned

1. **Java ↔ WebCrypto RSA Interoperability.** Matching OAEP hash (SHA-256) and MGF1 parameters exactly between Java and WebCrypto was critical — a mismatch causes silent decryption failure. Cross-platform tests resolved this.

2. **Playfair Edge Cases.** Double letters within a pair, odd-length messages, and J/I merging all needed explicit handling before the mission generator could produce fair challenges.

3. **Zero-Toolchain Frontend.** Proved that a reactive single-page game client is achievable with plain JavaScript when the REST API is well-shaped — no React, no npm, no build step.

4. **Semantic Security of OAEP.** RSA with OAEP produces different ciphertexts each time (random padding). This initially confused testing — assertions had to compare decrypted plaintext, not ciphertext equality.

5. **Teaching through feedback.** The "HOW IT WAS CALCULATED" panel and free-play labs converted every interaction into instruction, making the feedback loop more important than the score itself.

---

## 9. Limitations

| Limitation | Detail |
|------------|--------|
| Playfair is historical | 19th-century pedagogy; never use it to protect real data |
| Codename-only login | Acceptable on loopback (`127.0.0.1`) and nowhere else |
| Unkeyed SHA-256 seals | The tamper detection uses raw SHA-256, not HMAC; not suitable for authenticated encryption |
| RSA wraps short secrets only | OAEP limits plaintext to ~190 bytes for 2048-bit keys |
| In-memory storage | Scores reset on server restart; cannot scale horizontally |
| No rate limiting | Intended as an educational toy, not a hardened production service |

---

## 10. Conclusion

BLACKOUT demonstrates three foundational cryptographic algorithms spanning the history of the field: **Playfair Cipher** (1854) for classical substitution, **RSA** (1977) for modern public-key cryptography, and **SHA-256** (2001) for data integrity. Together they illustrate the shift from security through obscurity to mathematically provable computational hardness.

The game makes these concepts tangible — players encrypt messages, decrypt intercepts, detect tampering, and manage RSA keys through interactive missions. The Learning Centre provides free-play labs for classroom demonstration, and the Enigma desktop helper lets students experiment independently. Every mission includes step-by-step solution explanations, turning every attempt into a learning moment.

---

## 11. References

1. Rivest, R. L., Shamir, A., & Adleman, L. (1978). *A method for obtaining digital signatures and public-key cryptosystems.* Communications of the ACM, 21(2), 120–126.

2. NIST. (2015). *FIPS PUB 180-4: Secure Hash Standard (SHS).* National Institute of Standards and Technology.

3. Stallings, W. (2017). *Cryptography and Network Security: Principles and Practice* (7th ed.). Pearson.

---

*Project completed: August 26, 2026*