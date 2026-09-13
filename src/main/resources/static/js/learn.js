/* BLACKOUT // learn.js - the interactive Crypto Lab
 *
 * A free-play learning centre with the game's three algorithms - Playfair, RSA and
 * SHA-256. No codename required, so teachers can project it during a lesson and
 * students can experiment before attempting the missions. Every tool below is backed
 * by the exact same server engines that generate and score the missions.
 */
(function () {
  'use strict';

  const { el, $, toast, setStatus } = UI;

  const RSA_ALG = {
    name: 'RSA-OAEP',
    hash: 'SHA-256',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1])
  };

  function b64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function unb64(base64) {
    const binary = atob(base64.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  /* ---------- shared pieces ---------- */

  function labHeader(title, subtitle) {
    return [
      el('h2', { class: 'panel-title', text: title }),
      el('p', { class: 'hint', text: subtitle })
    ];
  }

  function row(labelText, content) {
    return el('div', {},
      el('label', { class: 'label', text: labelText }),
      content);
  }

  function outBox(value) {
    return el('div', { class: 'mono-block neon', text: value });
  }

  function theoryBox(html) {
    return el('details', { class: 'theory' },
      el('summary', { text: '\u25B8 HOW IT WORKS (theory)' }),
      el('div', { class: 'theory-body', html }));
  }

  function btnRow(buttons) {
    return el('div', { class: 'btn-row' }, buttons);
  }

  /* ================= PLAYFAIR LAB ================= */

  function playfairLab() {
    const keywordInput = el('input', {
      type: 'text', placeholder: 'e.g. MONARCHY', value: 'monarchy', spellcheck: 'false'
    });
    const plainInput = el('textarea', {
      placeholder: 'Plaintext to encrypt - e.g. HELLO', spellcheck: 'false'
    }, 'HELLO');
    const cipherInput = el('textarea', {
      placeholder: 'Ciphertext to decrypt - must be an even number of letters', spellcheck: 'false'
    }, 'GYIZSC');
    const gridHost = el('div', { style: 'margin-top:12px;min-height:210px' });
    const encResult = outBox('—');
    const decResult = outBox('—');
    const encBigrams = el('div', { class: 'hint', style: 'margin-top:8px;color:var(--cyan)' });

    async function refreshGrid() {
      try {
        const data = await API.playfairGrid(keywordInput.value);
        gridHost.innerHTML = '';
        const grid = el('div', { class: 'pf-grid' });
        data.matrix.forEach((r) => {
          for (const ch of r) grid.append(el('div', { class: 'pf-cell', text: ch }));
        });
        gridHost.append(grid);
      } catch (err) { toast(err.message, true); }
    }

    let debounce;
    keywordInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(refreshGrid, 250);
    });
    refreshGrid();

    async function encrypt() {
      try {
        setStatus('busy', 'sealing...');
        const out = await API.playfairSeal(plainInput.value, keywordInput.value);
        encResult.textContent = out.cipherText;
        encBigrams.textContent = 'bigram stream: ' + out.bigramPreview;
        setStatus('secure', 'Playfair encrypted - use the grid to verify each pair');
      } catch (err) { toast(err.message, true); }
    }

    async function decrypt() {
      const input = cipherInput.value.trim();
      const letters = (input || '').replace(/[^A-Za-z]/g, '').length;
      if (letters % 2 !== 0) {
        toast('Ciphertext must contain an EVEN number of letters (it is made of letter pairs) - copy the full ENCRYPTED output.', true);
        setStatus('breach', 'decrypt input needs an even number of letters');
        return;
      }
      try {
        setStatus('busy', 'opening...');
        const out = await API.playfairOpen(input, keywordInput.value);
        decResult.textContent = out.plainText;
        setStatus('secure', 'Playfair decrypted - X/Q fillers are normal');
      } catch (err) { toast(err.message, true); }
    }

    return el('div', { class: 'panel' },
      labHeader('// LAB 1 · PLAYFAIR CIPHER', 'Classical digraphic substitution (Wheatstone, 1854). Type a keyword, then encrypt plaintext on the left and decrypt ciphertext on the right - watch the 5\u00D75 grid do the work.'),
      row('KEYWORD', keywordInput),
      row('THE 5\u00D75 GRID', gridHost),
      el('div', { class: 'grid-2' },
        el('div', {},
          el('label', { class: 'label', text: 'PLAINTEXT' }),
          plainInput,
          el('div', { class: 'btn-row' },
            el('button', { class: 'btn primary', onclick: encrypt }, 'ENCRYPT \u25B8')),
          el('label', { class: 'label', text: 'ENCRYPTED (ciphertext)' }),
          encResult,
          encBigrams),
        el('div', {},
          el('label', { class: 'label', text: 'CIPHERTEXT' }),
          cipherInput,
          el('div', { class: 'btn-row' },
            el('button', { class: 'btn warn', onclick: decrypt }, 'DECRYPT \u25C1')),
          el('label', { class: 'label', text: 'DECRYPTED (plaintext)' }),
          decResult,
          el('div', { class: 'hint', style: 'margin-top:8px', text: 'Encrypt first, then paste the ENCRYPTED output here to round-trip back to the original.' }))),
      theoryBox(
        '<ol>' +
        '<li>The keyword (unique letters first) fills a 5\u00D75 grid; the remaining alphabet follows, with <b>I</b> and <b>J</b> sharing one cell.</li>' +
        '<li>Plaintext is UPPERCASED, reduced to A\u2013Z, J\u2192I, then split into <b>pairs (digraphs)</b>. A duplicate pair (e.g. LL) inserts an <b>X</b> filler; an odd final letter gets a trailing X.</li>' +
        '<li>Each digraph obeys one of three grid rules:<br>' +
        '&nbsp;&nbsp;\u2022 same row \u2192 each letter moves <b>one step right</b> (wraps)<br>' +
        '&nbsp;&nbsp;\u2022 same column \u2192 each letter moves <b>one step down</b> (wraps)<br>' +
        '&nbsp;&nbsp;\u2022 rectangle \u2192 each letter moves to the <b>other letter\u2019s column</b></li>' +
        '<li>Decryption is the exact reverse: left / up / swap columns.</li>' +
        '<li>Ciphertext is always even-length because it is a stream of letter-pairs - this is why the decrypt box warns you when the count is odd.</li>' +
        '<li>Digraphs give 25\u00D725 = 625 letter-pairs, so simple single-letter frequency analysis fails \u2014 a genuine advance over Caesar in 1854. Still a classical, historical cipher today.</li>' +
        '</ol>'));
  }

  /* ================= SHA-256 LAB ================= */

  function sha256Lab() {
    const inputA = el('textarea', { placeholder: 'Input A', spellcheck: 'false' }, 'HELLO WORLD');
    const inputB = el('textarea', { placeholder: 'Input B - try changing one character', spellcheck: 'false' }, 'HELLO WORLD!');
    const hashBtn = el('button', { class: 'btn primary', onclick: hash }, 'HASH BOTH \u2261');
    const outA = el('div', { class: 'kv', style: 'margin-top:10px' },
      el('dt', { text: 'SHA-256(A)' }),
      el('dd', { class: 'mono-block', style: 'color:var(--neon)', text: '—' }),
      el('dt', { text: 'SHA-256(B)' }),
      el('dd', { class: 'mono-block', style: 'color:var(--neon)', text: '—' }),
      el('dt', { text: 'differs?' }),
      el('dd', { id: 'sha-diff', text: '—', style: 'font-weight:700' }));

    async function hash() {
      try {
        setStatus('busy', 'digesting...');
        const [a, b] = await Promise.all([API.sha256(inputA.value), API.sha256(inputB.value)]);
        outA.querySelectorAll('dd.mono-block')[0].textContent = a.digest;
        outA.querySelectorAll('dd.mono-block')[1].textContent = b.digest;
        const diff = a.digest !== b.digest;
        const cell = $('#sha-diff');
        cell.textContent = diff ? 'YES - 64 chars / 256 bits, completely different' : 'NO - identical inputs';
        cell.style.color = diff ? 'var(--amber)' : 'var(--ink-dim)';
        setStatus('secure', diff
          ? 'avalanche effect: one character change flipped ~half the output bits'
          : 'same input, same digest (deterministic)');
      } catch (err) { toast(err.message, true); }
    }

    return el('div', { class: 'panel' },
      labHeader('// LAB 2 · SHA-256 HASH', 'A one-way fingerprint (FIPS 180-4, 2001). Hash two inputs and watch how a single changed character completely changes the digest - the avalanche effect.'),
      el('div', { class: 'grid-2' },
        el('div', {}, el('label', { class: 'label', text: 'INPUT A' }), inputA),
        el('div', {}, el('label', { class: 'label', text: 'INPUT B' }), inputB)),
      row('COMPUTE', btnRow([hashBtn])),
      outA,
      theoryBox(
        '<ul>' +
        '<li>SHA-256 turns any message into a fixed <b>256-bit digest</b> (64 hexadecimal characters).</li>' +
        '<li>It is a <b>one-way function</b>: given H(x) you can never recover x (pre-image resistance).</li>' +
        '<li><b>Deterministic:</b> the same input always yields an identical digest.</li>' +
        '<li><b>Avalanche effect:</b> flip one bit of the input and roughly half the output bits flip \u2014 see Input A vs Input B above.</li>' +
        '<li>Used for data integrity (checksums), password storage (store the hash, never the password), digital signatures, and Bitcoin proof-of-work.</li>' +
        '<li>In BLACKOUT, dead drops are sealed as SHA-256(payload + "|" + key) and verified by re-hashing.</li>' +
        '</ul>'));
  }

  /* ================= RSA LAB ================= */

  function rsaLab() {
    let pubKey = null;
    let privKey = null;

    const supported = window.Badge && Badge.supported();
    const pubBox = el('div', { class: 'mono-block dim', text: supported ? '—' : 'WebCrypto RSA not available in this browser' });
    const privBox = el('div', { class: 'mono-block dim', text: supported ? '—' : '—' });
    const secretInput = el('textarea', { placeholder: 'e.g. FREEDOM', spellcheck: 'false' }, 'FREEDOM');
    const blobBox = el('div', { class: 'mono-block dim', text: '—' });
    const unlockBox = el('div', { class: 'mono-block neon', text: '—' });

    async function mint() {
      if (!supported) { toast('Key generation unavailable in this browser', true); return; }
      try {
        setStatus('busy', 'minting demo keys...');
        const pair = await crypto.subtle.generateKey(RSA_ALG, true, ['encrypt', 'decrypt']);
        pubKey = b64(await crypto.subtle.exportKey('spki', pair.publicKey));
        privKey = b64(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
        pubBox.textContent = pubKey;
        privBox.textContent = privKey;
        setStatus('secure', 'Demo RSA-2048 keypair minted - this stays in the page only');
      } catch (err) { toast(err.message, true); }
    }

    async function lock() {
      if (!pubKey) { toast('Mint the demo keys first', true); return; }
      if (!secretInput.value.trim()) { toast('Type a secret first', true); return; }
      try {
        setStatus('busy', 'server locking with your public key...');
        const out = await API.rsaWrap(secretInput.value, pubKey);
        blobBox.textContent = out.blob;
        unlockBox.textContent = '—';
        setStatus('secure', 'Server encrypted the secret under your PUBLIC key - only the PRIVATE key can open it');
      } catch (err) { toast(err.message, true); }
    }

    async function unlock() {
      if (!privKey) { toast('Mint the demo keys first', true); return; }
      if (!blobBox.textContent || blobBox.textContent === '—') { toast('Lock a secret first', true); return; }
      try {
        setStatus('busy', 'browser unlocking with your private key...');
        const key = await crypto.subtle.importKey(
          'pkcs8', unb64(privKey), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);
        const plain = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, unb64(blobBox.textContent.trim()));
        unlockBox.textContent = new TextDecoder().decode(plain);
        setStatus('secure', 'Decrypted in the browser - the private key never left this machine');
      } catch (err) { toast(err.message, true); }
    }

    return el('div', { class: 'panel' },
      labHeader('// LAB 3 · RSA-2048 PUBLIC KEY CRYPTO', 'Asymmetric cryptography (Rivest\u2013Shamir\u2013Adleman, 1977). Mint a throwaway keypair right in the browser, then have the server lock a secret with your PUBLIC key and unlock it with your PRIVATE key - exactly what the SECRET DROP mission does.'),
      row('ACTIONS', btnRow([
        el('button', { class: 'btn primary', onclick: mint }, 'MINT DEMO KEYS \u26A1'),
        el('button', { class: 'btn warn', onclick: lock }, 'LOCK WITH PUBLIC KEY (server) \u25B8'),
        el('button', { class: 'btn warn', onclick: unlock }, 'UNLOCK WITH PRIVATE KEY (browser) \u25C1')
      ])),
      row('PUBLIC KEY (share freely)', pubBox),
      row('PRIVATE KEY (never share)', privBox),
      row('SECRET', secretInput),
      row('ENCRYPTED BLOB (server output)', blobBox),
      row('UNLOCKED SECRET (browser output)', unlockBox),
      theoryBox(
        '<ol>' +
        '<li>RSA is <b>asymmetric</b>: two distinct but mathematically linked keys. The <b>public key (e, n)</b> encrypts; only the <b>private key (d, n)</b> decrypts.</li>' +
        '<li>n = p \u00D7 q, where p and q are large secret primes. Factoring n back into p, q is computationally infeasible for 2048-bit keys \u2014 that hardness is the security.</li>' +
        '<li>Textbook formula: C = M<sup>e</sup> mod n and M = C<sup>d</sup> mod n (Euler\u2019s theorem guarantees M<sup>ed</sup> \u2261 M mod n).</li>' +
        '<li>Real systems always add <b>OAEP padding</b> (here OAEP-SHA-256): the same plaintext yields different ciphertext each time, and malleability attacks are blocked.</li>' +
        '<li>In BLACKOUT the browser mints the keypair, registers only the <b>public</b> half with the server, and the server wraps mission keywords with it. The private half lives only in your browser\u2019s localStorage.</li>' +
        '<li>RSA encrypts short secrets only: OAEP limits plaintext to ~190 bytes per 2048-bit key.</li>' +
        '</ol>'));
  }

  /* ================= render the view ================= */

  function render() {
    const host = $('#view-learn');
    if (!host) return;
    host.innerHTML = '';
    host.append(
      el('div', { class: 'panel' },
        el('h2', { class: 'panel-title', text: '// CRYPTO LAB · LEARN THE ALGORITHMS' }),
        el('p', { class: 'hint', style: 'line-height:1.8', html:
          'Three algorithms power BLACKOUT: the <b>Playfair cipher</b> (classical symmetric), <b>RSA</b> (modern asymmetric) and <b>SHA-256</b> (hashing). This lab is open to everyone \u2014 no codename needed.' })),
      playfairLab(),
      sha256Lab(),
      rsaLab());
  }

  render();
})();