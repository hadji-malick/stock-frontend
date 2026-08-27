import qz from 'qz-tray';

const ESC = '\x1B';
const GS = '\x1D';
const CMD = {
  init: ESC + '@',
  boldOn: ESC + 'E' + '\x01',
  boldOff: ESC + 'E' + '\x00',
  center: ESC + 'a' + '\x01',
  left: ESC + 'a' + '\x00',
  doubleOn: GS + '!' + '\x11',
  doubleOff: GS + '!' + '\x00',
  cut: GS + 'V' + '\x41' + '\x03',
};

const MODE_LABELS = { ESPECES: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', CARTE: 'Carte bancaire' };
const fmt = (n) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export async function ensureQzConnected() {
  if (qz.websocket.isActive()) return;
  await qz.websocket.connect();
}

export async function listPrinters() {
  await ensureQzConnected();
  return qz.printers.find();
}

export async function printReceiptThermal(printerName, receipt) {
  await ensureQzConnected();
  const config = qz.configs.create(printerName);

  const L = [];
  L.push(CMD.init);
  L.push(CMD.center + CMD.boldOn + CMD.doubleOn + 'POWERTECH\n' + CMD.doubleOff);
  L.push('ENGINEERING GROUP\n');
  L.push(CMD.boldOff + CMD.left);
  L.push('--------------------------------\n');
  L.push(`Facture: ${receipt.numeroFacture}\n`);
  L.push(`Date: ${new Date().toLocaleString('fr-FR')}\n`);
  L.push(`Caissier: ${receipt.caissier}\n`);
  if (receipt.clientNom) L.push(`Client: ${receipt.clientNom}\n`);
  L.push('--------------------------------\n');

  receipt.details.forEach(d => {
    L.push(`${d.produit}\n`);
    const right = `${fmt(d.sousTotal)} FCFA`;
    L.push(`  x${d.quantite}`.padEnd(20) + right.padStart(12) + '\n');
  });

  L.push('--------------------------------\n');
  L.push(`Sous-total HT: ${fmt(receipt.totalHT)} FCFA\n`);
  L.push(`TVA (18%): ${fmt(receipt.tva)} FCFA\n`);
  L.push(CMD.boldOn + CMD.doubleOn);
  L.push(`TOTAL TTC: ${fmt(receipt.total)} FCFA\n`);
  L.push(CMD.doubleOff + CMD.boldOff);
  L.push('--------------------------------\n');

  (receipt.paiements || []).forEach(p => {
    L.push(`${MODE_LABELS[p.mode] || p.mode}: ${fmt(p.montant)} FCFA\n`);
  });

  L.push(CMD.center + '\nMerci de votre visite !\n');
  L.push('Dakar, Senegal\n\n\n');
  L.push(CMD.cut);

  await qz.print(config, [{ type: 'raw', format: 'plain', data: L.join('') }]);
}
