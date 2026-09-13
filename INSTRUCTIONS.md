# BLACKOUT - How to Play

A simple cryptography game. You get one mission at a time. Solve it, earn points, press NEXT. Three algorithms - **Playfair**, **RSA-2048**, **SHA-256** - power four mission types that repeat forever.

New to the game? Open the **LEARN** tab first: it is a login-free interactive lab where you can practise all three algorithms before attempting missions.

## Start

```bash
mvn spring-boot:run
```

Open **http://127.0.0.1:8080**, type a codename, press START. Done.

## The 4 Missions

They always come in this order:

| # | Mission | You do | Points |
|---|---|---|---|
| 1 | **SEAL THE INTEL** | Encrypt the message with the keyword using the Playfair grid | +10 |
| 2 | **CRACK THE CODE** | Decrypt the message with the given keyword | +15 |
| 3 | **FIND THE FAKE** | Three packages, only one is genuine. Press HASH on each (or re-hash `payload|keyBlob` in the enigma helper) - the one showing INTACT is the real package; the other two carry forged seals. Pick it. | +20 |
| 4 | **SECRET DROP** | Press UNLOCK (your browser's RSA key opens the lock), then decrypt the message | +25 |

## Scoring

- Solve by hand -> full points
- Press AUTO-SOLVE -> half points (the computer does the work; offered on missions 1, 2 and 4)
- Wrong answer -> 0 points, but you see the right answer. Nothing is lost.
- Your score shows in the top bar; TOP AGENTS tab shows everyone on this machine.

## The three ciphers (what each mission teaches)

1. **Playfair cipher** (missions 1, 2, 4) - a 150-year-old letter-pair cipher. The keyword builds a 5x5 grid; pairs of letters are replaced by other pairs.
2. **RSA-2048** (mission 4) - real modern encryption. Your browser creates a secret key the server never sees; the server locks things that only your key can open.
3. **SHA-256** (mission 3) - a fingerprint of data. Two packages carry forged seals; only the genuine one's recomputed hash matches. Change even one letter and the fingerprint stops matching - that's how you spot the real package.

## Learn tab (helps before you start)

The **LEARN** tab is an interactive lab with all three algorithms - no codename needed:

- **Playfair Lab** - type a keyword and watch the 5x5 grid build; encrypt/decrypt any message and see the letter pairs.
- **SHA-256 Lab** - hash two inputs side by side and see the avalanche effect (one changed letter = completely different hash).
- **RSA Lab** - mint a demo keypair, have the server lock a secret with your public key, unlock it with your private key - the SECRET DROP flow, in miniature.

## Enigma — Local Helper (clone-only)

The `enigma/` directory will help users to get the correct answer of any algorithm. It helps users who don't know how cryptography algorithms work or who want to know the answers to the questions. It is just for help.

> Only users who **clone this project and run it on their system** will get the benefits of Enigma. Users who use only the hosted website will not — the full repo (including `enigma/`) is not exposed there.

Run locally:
```bash
cd enigma && javac *.java && java MainUI
```

## FAQ

- **Lost your progress?** Scores live only while the server runs (in-memory by design). Type the same codename while it's up to resume.
- **Want to switch agents?** Press EXIT in the top bar and enter a different codename.
- **SECRET DROP says no badge?** Reload the page - the browser mints your RSA key automatically.
- **Mission says expired?** Missions expire after 15 minutes; just start a new one.
