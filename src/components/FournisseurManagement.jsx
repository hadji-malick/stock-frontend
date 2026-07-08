import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SUPP_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];
const colorForName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return SUPP_COLORS[Math.abs(hash) % SUPP_COLORS.length];
};
const initialsForName = (name = '') =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const SupplierAvatar = ({ nom, size = 38 }) => {
  const color = colorForName(nom || '');
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, background: color + '22', color,
      border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {initialsForName(nom)}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    flex: 1, minWidth: 150, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    transition: 'background .3s ease, border .3s ease',
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10, background: color + '1c', color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

export default function FournisseurManagement() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nom: '', contact: '', telephone: '', email: '', adresse: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => { fetchFournisseurs(); }, []);

  const fetchFournisseurs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/fournisseurs', { headers: { Authorization: `Bearer ${token}` } });
      setFournisseurs(res.data);
    } catch (err) {
      console.error('Erreur chargement fournisseurs', err);
      toast.error('Erreur lors du chargement des fournisseurs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/fournisseurs', formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('✅ Fournisseur ajouté avec succès');
      setShowModal(false);
      setFormData({ nom: '', contact: '', telephone: '', email: '', adresse: '' });
      fetchFournisseurs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'ajout');
    } finally { setLoading(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/fournisseurs/${editingFournisseur.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('✅ Fournisseur modifié avec succès');
      setShowEditModal(false);
      setEditingFournisseur(null);
      setFormData({ nom: '', contact: '', telephone: '', email: '', adresse: '' });
      fetchFournisseurs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la modification');
    } finally { setLoading(false); }
  };

  const deleteFournisseur = async (id) => {
    if (window.confirm('Supprimer ce fournisseur ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/fournisseurs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('🗑️ Fournisseur supprimé');
        fetchFournisseurs();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
      }
    }
  };

  const openEdit = (fournisseur) => {
    setEditingFournisseur(fournisseur);
    setFormData({
      nom: fournisseur.nom, contact: fournisseur.contact || '', telephone: fournisseur.telephone || '',
      email: fournisseur.email || '', adresse: fournisseur.adresse || ''
    });
    setShowEditModal(true);
  };

  const styles = {
    card: { background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', transition: 'background 0.3s ease, border 0.3s ease' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', transition: 'color 0.3s ease' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '13px 14px', background: 'var(--bg-table-header)', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', textTransform: 'uppercase', letterSpacing: '.4px', transition: 'background 0.3s ease, color 0.3s ease' },
    td: { padding: '14px', borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)', transition: 'color 0.3s ease, border 0.3s ease' },
    btnPrimary: { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 8, height: 44, transition: '0.2s' },
    btnSecondary: { background: 'var(--bg-btn-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500', fontSize: '12px', transition: 'background 0.3s ease, color 0.3s ease' },
    btnDanger: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500', fontSize: '12px' },
    input: { width: '100%', padding: '10px 14px', border: '1px solid var(--input-border)', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s', background: 'var(--bg-input)', color: 'var(--text-primary)' },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)', transition: 'color 0.3s ease' },
    formGroup: { marginBottom: '16px' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalContent: { background: 'var(--bg-card)', borderRadius: '24px', padding: '28px', width: '500px', maxWidth: '90%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', transition: 'background 0.3s ease, border 0.3s ease' },
    flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    gap2: { display: 'flex', gap: '12px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    paginationButton: { padding: '8px 16px', borderRadius: '30px', border: 'none', cursor: 'pointer', fontWeight: '500', transition: 'background 0.3s ease, opacity 0.3s ease' },
    paginationText: { padding: '8px 16px', background: 'var(--bg-table-header)', borderRadius: '30px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', transition: 'background 0.3s ease, color 0.3s ease' }
  };

  const stats = useMemo(() => {
    const avecEmail = fournisseurs.filter(f => f.email).length;
    const avecTelephone = fournisseurs.filter(f => f.telephone).length;
    return { total: fournisseurs.length, avecEmail, avecTelephone };
  }, [fournisseurs]);

  const filteredFournisseurs = useMemo(() => {
    if (!searchTerm.trim()) return fournisseurs;
    const q = searchTerm.toLowerCase();
    return fournisseurs.filter(f =>
      f.nom?.toLowerCase().includes(q) ||
      f.contact?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q)
    );
  }, [fournisseurs, searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFournisseurs = filteredFournisseurs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFournisseurs.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ===== STATS ===== */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard icon="🏭" label="Fournisseurs" value={stats.total} color="#3b82f6" />
        <StatCard icon="📧" label="Avec email" value={stats.avecEmail} color="#6366f1" />
        <StatCard icon="📞" label="Avec téléphone" value={stats.avecTelephone} color="#10b981" />
      </div>

      <div style={styles.card}>
        {/* ===== HEADER / RECHERCHE ===== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={styles.cardTitle}>🏭 Gestion des fournisseurs</div>
            <div style={{ position: 'relative', minWidth: 260 }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 15 }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher par nom, contact, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ ...styles.input, paddingLeft: 42, borderRadius: 40, height: 40 }}
              />
            </div>
          </div>
          <button style={styles.btnPrimary} onClick={() => {
            setFormData({ nom: '', contact: '', telephone: '', email: '', adresse: '' });
            setShowModal(true);
          }}>➕ Nouveau fournisseur</button>
        </div>

        {/* ===== TABLEAU ===== */}
        <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fournisseur</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Téléphone</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Adresse</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentFournisseurs.map(f => (
                <tr
                  key={f.id}
                  style={{ transition: '0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-table-row-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <SupplierAvatar nom={f.nom} />
                      <strong>{f.nom}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>{f.contact || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={styles.td}>
                    {f.telephone ? (
                      <a href={`tel:${f.telephone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', textDecoration: 'none' }}>
                        <span style={{ color: '#10b981' }}>📞</span>{f.telephone}
                      </a>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={styles.td}>
                    {f.email ? (
                      <a href={`mailto:${f.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', textDecoration: 'none' }}>
                        <span style={{ color: '#3b82f6' }}>📧</span>{f.email}
                      </a>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ ...styles.td, maxWidth: 220 }}>
                    {f.adresse ? (
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
                        <span>📍</span>{f.adresse}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={styles.btnSecondary} onClick={() => openEdit(f)}>✏️ Modifier</button>
                      <button style={styles.btnDanger} onClick={() => deleteFournisseur(f.id)}>🗑️ Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentFournisseurs.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🏭</div>
                    {searchTerm ? 'Aucun fournisseur ne correspond à votre recherche' : 'Aucun fournisseur enregistré pour le moment'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===== PAGINATION ===== */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ ...styles.paginationButton, background: currentPage === 1 ? 'var(--bg-btn-secondary)' : 'var(--bg-table-header)', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}
            >◀ Précédent</button>
            <span style={styles.paginationText}>Page {currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ ...styles.paginationButton, background: currentPage === totalPages ? 'var(--bg-btn-secondary)' : 'var(--bg-table-header)', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}
            >Suivant ▶</button>
          </div>
        )}
      </div>

      {/* ===== MODAL AJOUT ===== */}
      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.flexBetween}>
              <h3 style={{ color: 'var(--text-primary)' }}>➕ Nouveau fournisseur</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)' }}>✖️</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom *</label>
                <input type="text" style={styles.input} value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} required placeholder="Nom du fournisseur" />
              </div>
              <div style={styles.grid2}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact</label>
                  <input type="text" style={styles.input} value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="Nom du contact" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Téléphone</label>
                  <input type="text" style={styles.input} value={formData.telephone} onChange={e => setFormData({ ...formData, telephone: e.target.value })} placeholder="Numéro de téléphone" />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" style={styles.input} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@fournisseur.com" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Adresse</label>
                <input type="text" style={styles.input} value={formData.adresse} onChange={e => setFormData({ ...formData, adresse: e.target.value })} placeholder="Adresse du fournisseur" />
              </div>
              <div style={styles.gap2}>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>{loading ? 'Ajout...' : '✅ Ajouter'}</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL MODIFICATION ===== */}
      {showEditModal && editingFournisseur && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.flexBetween}>
              <h3 style={{ color: 'var(--text-primary)' }}>✏️ Modifier le fournisseur</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)' }}>✖️</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom *</label>
                <input type="text" style={styles.input} value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} required placeholder="Nom du fournisseur" />
              </div>
              <div style={styles.grid2}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact</label>
                  <input type="text" style={styles.input} value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="Nom du contact" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Téléphone</label>
                  <input type="text" style={styles.input} value={formData.telephone} onChange={e => setFormData({ ...formData, telephone: e.target.value })} placeholder="Numéro de téléphone" />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" style={styles.input} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@fournisseur.com" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Adresse</label>
                <input type="text" style={styles.input} value={formData.adresse} onChange={e => setFormData({ ...formData, adresse: e.target.value })} placeholder="Adresse du fournisseur" />
              </div>
              <div style={styles.gap2}>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>{loading ? 'Modification...' : '✅ Enregistrer'}</button>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}