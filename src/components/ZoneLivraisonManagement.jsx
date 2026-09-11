import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { notifyError } from '../utils/notify';

export default function ZoneLivraisonManagement() {
  const [zones, setZones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ nom: '', prixTransport: '', actif: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchZones(); }, []);

  const fetchZones = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/zones-livraison/all', { headers: { Authorization: `Bearer ${token}` } });
      setZones(res.data);
    } catch (err) { notifyError(err, 'Erreur chargement zones'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) { toast.error('Le nom de la zone est obligatoire'); return; }
    if (!formData.prixTransport || parseFloat(formData.prixTransport) < 0) { toast.error('Prix de transport invalide'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { nom: formData.nom, prixTransport: parseFloat(formData.prixTransport), actif: formData.actif };
      if (editing) {
        await axios.put(`http://localhost:8080/api/zones-livraison/${editing.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Zone modifiée');
      } else {
        await axios.post('http://localhost:8080/api/zones-livraison', payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Zone créée');
      }
      setShowModal(false); setEditing(null); setFormData({ nom: '', prixTransport: '', actif: true });
      fetchZones();
    } catch (err) { notifyError(err); }
    finally { setLoading(false); }
  };

  const openEdit = (z) => { setEditing(z); setFormData({ nom: z.nom, prixTransport: z.prixTransport, actif: z.actif }); setShowModal(true); };
  const openNew = () => { setEditing(null); setFormData({ nom: '', prixTransport: '', actif: true }); setShowModal(true); };

  const deleteZone = async (id) => {
    if (!window.confirm('Supprimer cette zone ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/zones-livraison/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Zone supprimée'); fetchZones();
    } catch (err) { notifyError(err); }
  };

  const styles = {
    card: { background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' },
    flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' },
    td: { padding: '12px', borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)' },
    btnPrimary: { background: '#3b82f6', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '30px', cursor: 'pointer', fontWeight: '600' },
    btnDanger: { background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '20px', cursor: 'pointer', fontWeight: '500' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', width: 520 }
  };

  return (
    <div style={styles.card}>
      <div style={styles.flexBetween}>
        <div style={styles.cardTitle}>🚚 Zones de livraison</div>
        <button style={styles.btnPrimary} onClick={openNew}>➕ Nouvelle zone</button>
      </div>
      <table style={styles.table}>
        <thead><tr><th style={styles.th}>Zone</th><th style={styles.th}>Prix transport</th><th style={styles.th}>Statut</th><th style={styles.th}>Actions</th></tr></thead>
        <tbody>
          {zones.map(z => (
            <tr key={z.id}>
              <td style={styles.td}><strong>{z.nom}</strong></td>
              <td style={styles.td}>{z.prixTransport?.toLocaleString('fr-FR')} FCFA</td>
              <td style={styles.td}>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: z.actif ? '#dcfce7' : '#fee2e2', color: z.actif ? '#166534' : '#991b1b' }}>
                  {z.actif ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={styles.td}>
                <button style={{ ...styles.btnPrimary, padding: '6px 12px', marginRight: 8, fontSize: 12 }} onClick={() => openEdit(z)}>✏️ Modifier</button>
                <button style={styles.btnDanger} onClick={() => deleteZone(z.id)}>🗑️ Supprimer</button>
              </td>
            </tr>
          ))}
          {zones.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Aucune zone définie</td></tr>}
        </tbody>
      </table>

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.flexBetween}>
              <h3 style={{ color: 'var(--text-primary)' }}>{editing ? 'Modifier la zone' : 'Nouvelle zone'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22 }}>✖️</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nom de la zone *</label>
                <input style={{ width: '100%', padding: 10, borderRadius: 8 }} value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} placeholder="Ex: Dakar centre, Rufisque, Thiès..." />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Prix de transport (FCFA) *</label>
                <input type="number" min="0" style={{ width: '100%', padding: 10, borderRadius: 8 }} value={formData.prixTransport} onChange={e => setFormData({ ...formData, prixTransport: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <input type="checkbox" checked={formData.actif} onChange={e => setFormData({ ...formData, actif: e.target.checked })} />
                <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Zone active (proposée au technico-commercial)</label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>{loading ? 'Enregistrement...' : (editing ? 'Enregistrer' : 'Créer')}</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
