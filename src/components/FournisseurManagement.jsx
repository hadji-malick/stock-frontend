import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function FournisseurManagement() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    nom: '', contact: '', telephone: '', email: '', adresse: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  const fetchFournisseurs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/fournisseurs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFournisseurs(res.data);
    } catch (err) {
      toast.error('Erreur chargement fournisseurs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (editing) {
        await axios.put(`http://localhost:8080/api/fournisseurs/${editing.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Fournisseur modifié');
      } else {
        await axios.post('http://localhost:8080/api/fournisseurs', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Fournisseur ajouté');
      }
      fetchFournisseurs();
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nom) => {
    if (window.confirm(`Supprimer le fournisseur "${nom}" ?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/fournisseurs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Fournisseur supprimé');
        fetchFournisseurs();
      } catch (err) {
        toast.error('Erreur');
      }
    }
  };

  const resetForm = () => {
    setFormData({ nom: '', contact: '', telephone: '', email: '', adresse: '' });
    setEditing(null);
  };

  const openEdit = (fournisseur) => {
    setEditing(fournisseur);
    setFormData({
      nom: fournisseur.nom,
      contact: fournisseur.contact || '',
      telephone: fournisseur.telephone || '',
      email: fournisseur.email || '',
      adresse: fournisseur.adresse || ''
    });
    setShowModal(true);
  };

  const styles = {
    card: { background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', marginBottom: '24px' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', background: '#f8fafc', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#1e293b' },
    btnPrimary: { background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600' },
    btnDanger: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500' },
    btnSecondary: { background: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 16px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600' },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px' },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#334155' },
    formGroup: { marginBottom: '16px' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalContent: { background: 'white', borderRadius: '24px', padding: '28px', width: '500px', maxWidth: '90%' },
    flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    gap2: { display: 'flex', gap: '12px' }
  };

  return (
    <div style={styles.card}>
      <div style={styles.flexBetween}>
        <div style={styles.cardTitle}>🏭 Gestion des fournisseurs</div>
        <button style={styles.btnPrimary} onClick={() => { resetForm(); setShowModal(true); }}>➕ Nouveau fournisseur</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Téléphone</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Adresse</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fournisseurs.map(f => (
              <tr key={f.id}>
                <td style={styles.td}>{f.nom}</td>
                <td style={styles.td}>{f.contact || '-'}</td>
                <td style={styles.td}>{f.telephone || '-'}</td>
                <td style={styles.td}>{f.email || '-'}</td>
                <td style={styles.td}>{f.adresse || '-'}</td>
                <td style={styles.td}>
                  <button style={{ ...styles.btnPrimary, marginRight: '8px', padding: '4px 12px' }} onClick={() => openEdit(f)}>✏️</button>
                  <button style={styles.btnDanger} onClick={() => handleDelete(f.id, f.nom)}>🗑️</button>
                </td>
              </tr>
            ))}
            {fournisseurs.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Aucun fournisseur</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.flexBetween}>
              <h3>{editing ? 'Modifier fournisseur' : 'Ajouter un fournisseur'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖️</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom *</label>
                <input style={styles.input} value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Contact</label>
                <input style={styles.input} value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone</label>
                <input style={styles.input} value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" style={styles.input} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Adresse</label>
                <input style={styles.input} value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} />
              </div>
              <div style={styles.gap2}>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}