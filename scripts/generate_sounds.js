const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'public', 'sounds');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function writeWav(filename, freq) {
  const sampleRate = 44100;
  const duration = 0.5;
  const samples = Math.floor(sampleRate * duration);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const amplitude = Math.round(Math.sin(2 * Math.PI * freq * t) * 32767 * 0.3);
    data.writeInt16LE(amplitude, i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  fs.writeFileSync(path.join(dir, filename), Buffer.concat([header, data]));
}

writeWav('warning.wav', 440);
writeWav('success.wav', 660);
writeWav('error.wav', 220);
console.log('Generated warning.wav, success.wav and error.wav');
