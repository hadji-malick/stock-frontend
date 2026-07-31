import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';

const MODES = [
  { key: 'ESPECES', label: 'Espèces', icon: '💵', color: '#10b981' },
  { key: 'WAVE', label: 'Wave', icon: '🌊', color: '#3b82f6' },
  { key: 'ORANGE_MONEY', label: 'Orange Money', icon: '🍊', color: '#f97316' },
  { key: 'CARTE', label: 'Carte bancaire', icon: '💳', color: '#6366f1' },
];

export default function PaymentModal({ total, onConfirm, onCancel, loading }) {
  const [splitMode, setSplitMode] = useState(false);
  const [singleMode, setSingleMode] = useState('ESPECES');
  const [amounts, setAmounts] = useState({}); // { ESPECES: 5000, WAVE: 3000 }

  const totalSaisi = useMemo(
    () => Object.values(amounts).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [amounts]
  );
  const reste = total - totalSaisi;

  const setAmount = (key, value) => {
    let n = parseFloat(value);
    if (isNaN(n) || n < 0) n = 0;
    setAmounts(prev => ({ ...prev, [key]: n }));
  };

  const handleConfirm = () => {
    if (!splitMode) {
      onConfirm([{ mode: singleMode, montant: total }]);
      return;
    }
    if (Math.abs(reste) > 0.5) {
      toast.error(reste > 0 ? `Il manque ${reste.toLocaleString('fr-FR')} FCFA` : `Le total dépasse le montant de ${Math.abs(reste).toLocaleString('fr-FR')} FCFA`);
      return;
    }
    const paiements = Object.entries(amounts)
      .filter(([, v]) => v > 0)
      .map(([mode, montant]) => ({ mode, montant }));
    if (paiements.length === 0) {
      toast.error('Renseignez au moins un montant');
      return;
    }
    onConfirm(paiements);
  };

  const styles = {
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    content: { background: 'var(--bg-card)', borderRadius: 24, padding: 28, width: 460, maxWidth: '90%', border: '1px solid var(--border-color)' },
  };

  return (
    <div style={styles.modal}>
      <div style={styles.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>💰 Mode de paiement</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-primary)' }}>✖️</button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20, padding: '14px', background: 'var(--bg-table-row-hover)', borderRadius: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total à payer</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{total.toLocaleString('fr-FR')} FCFA</div>
        </div>

        {/* Toggle simple / scindé */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setSplitMode(false)}
            style={{
              flex: 1, padding: '10px', borderRadius: 12, border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: !splitMode ? '#3b82f6' : 'transparent', color: !splitMode ? 'white' : 'var(--text-secondary)',
            }}
          >Un seul mode</button>
          <button
            onClick={() => setSplitMode(true)}
            style={{
              flex: 1, padding: '10px', borderRadius: 12, border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: splitMode ? '#3b82f6' : 'transparent', color: splitMode ? 'white' : 'var(--text-secondary)',
            }}
          >Paiement scindé</button>
        </div>

        {!splitMode ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {MODES.map(m => (
              <button
                key={m.key}
                onClick={() => setSingleMode(m.key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 10px',
                  borderRadius: 14, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  border: singleMode === m.key ? `2px solid ${m.color}` : '1px solid var(--border-color)',
                  background: singleMode === m.key ? m.color + '14' : 'var(--bg-input)',
                  color: singleMode === m.key ? m.color : 'var(--text-primary)',
                }}
              >
                <span style={{ fontSize: 22 }}>{m.icon}</span>{m.label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            {MODES.map(m => (
              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: m.color + '1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{m.icon}</div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.label}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={amounts[m.key] || ''}
                  onChange={e => setAmount(m.key, e.target.value)}
                  style={{ width: 120, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--input-border)', background: 'var(--bg-input)', color: 'var(--text-primary)', textAlign: 'right', fontFamily: 'monospace' }}
                />
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '10px 14px', borderRadius: 12,
              background: Math.abs(reste) < 0.5 ? '#10b98114' : '#ef444414',
              color: Math.abs(reste) < 0.5 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 13,
            }}>
              <span>{Math.abs(reste) < 0.5 ? '✅ Montant exact' : reste > 0 ? 'Reste à saisir' : 'Excédent'}</span>
              <span>{Math.abs(reste).toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '13px', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: loading ? 0.6 : 1 }}
          >{loading ? 'Validation...' : '✅ Confirmer le paiement'}</button>
          <button onClick={onCancel} style={{ padding: '13px 20px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
        </div>
      </div>
    </div>
  );
}