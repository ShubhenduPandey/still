// Original, synthesized cue. No recordings or external assets are used.
const fs = require('node:fs');
const path = require('node:path');
const rate = 22050, length = Math.floor(rate * 0.8);
const wav = Buffer.alloc(44 + length * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + length * 2, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(length * 2, 40);
for (let i = 0; i < length; i++) {
  const t = i / rate;
  const envelope = Math.min(1, t / 0.025) * Math.exp(-5 * t) * Math.min(1, (0.8 - t) / 0.1);
  const wave = Math.sin(2 * Math.PI * 528 * t) + 0.22 * Math.sin(2 * Math.PI * 1056 * t);
  wav.writeInt16LE(Math.round(wave * envelope * 6000), 44 + i * 2);
}
fs.writeFileSync(path.join(__dirname, '../assets/chime.wav'), wav);
