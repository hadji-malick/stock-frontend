import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function CommandeDevis() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commande, setCommande] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [prix, setPrix] = useState({});
  const [fraisTransport, setFraisTransport] = useState(0);
  const [delaiLivraison, setDelaiLivraison] = useState(5);
  const [dateValidite, setDateValidite] = useState('');
  const [conditionsPaiement, setConditionsPaiement] = useState('');

  useEffect(() => {
    fetchCommande();
  }, [token]);

  const fetchCommande = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/commandes/devis/${token}`);
      setCommande(res.data.commande);
      setLignes(res.data.lignes);

      const initialPrix = {};
      res.data.lignes.forEach(ligne => {
        initialPrix[ligne.produit.id] = '';
      });
      setPrix(initialPrix);
      setLoading(false);
    } catch (err) {
      toast.error('Erreur lors du chargement de la demande');
      setLoading(false);
    }
  };

  const handlePrixChange = (produitId, value) => {
    let newPrix = parseFloat(value);
    if (isNaN(newPrix) || newPrix < 0) newPrix = 0;
    setPrix({ ...prix, [produitId]: newPrix });
  };

  const handleSubmit = async () => {
    const prixManquants = lignes.some(l => !prix[l.produit.id] && prix[l.produit.id] !== 0);
    if (prixManquants) {
      toast.error('Veuillez indiquer un prix pour chaque produit');
      return;
    }
    if (!dateValidite) {
      toast.error('Veuillez indiquer une date de validité du devis');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`http://localhost:8080/api/commandes/devis/${token}`, {
        prix: prix,
        fraisTransport: parseFloat(fraisTransport) || 0,
        delaiLivraisonPropose: parseInt(delaiLivraison) || 5,
        dateValidite: dateValidite,
        conditionsPaiement: conditionsPaiement
      });
      toast.success('Devis envoyé avec succès !');
      navigate('/confirmation-modification');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi du devis');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  const total = lignes.reduce((sum, l) => sum + (l.quantite * (prix[l.produit.id] || 0)), 0) + (parseFloat(fraisTransport) || 0);

  const styles = {
    container: { maxWidth: '950px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: { background: '#f97316', padding: '20px', textAlign: 'center', color: 'white', borderRadius: '12px 12px 0 0' },
    content: { background: 'white', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '0 0 12px 12px' },
    table: { width: '100%', borderCollapse: 'collapse', margin: '15px 0' },
    th: { background: '#f8fafc', padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '12px', borderBottom: '1px solid #e2e8f0' },
    inputPrix: { width: '140px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', textAlign: 'center' },
    input: { width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' },
    formGroup: { marginBottom: '16px' },
    label: { fontWeight: 'bold', display: 'block', marginBottom: '5px' },
    textarea: { width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '5px', fontFamily: 'Arial' },
    btnPrimary: { background: '#f97316', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', marginRight: '10px' },
    btnSecondary: { background: '#e2e8f0', color: '#334155', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' },
    totalRow: { color: '#f97316', fontWeight: 'bold', fontSize: '18px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📄 Créer votre devis</h1>
        <p>Commande N° : {commande?.numero}</p>
      </div>

      <div style={styles.content}>
        <p><strong>Nous avons besoin de votre offre pour :</strong></p>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Produit</th>
                <th style={styles.th}>Marque</th>
                <th style={styles.th}>Quantité</th>
                <th style={styles.th}>Prix unitaire (FCFA) *</th>
                <th style={styles.th}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(ligne => (
                <tr key={ligne.produit.id}>
                  <td style={styles.td}><strong>{ligne.produit.nom}</strong></td>
                  <td style={styles.td}>{ligne.marque || '-'}</td>
                  <td style={styles.td} style={{ textAlign: 'center' }}>{ligne.quantite}</td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={prix[ligne.produit.id] ?? ''}
                      onChange={(e) => handlePrixChange(ligne.produit.id, e.target.value)}
                      style={styles.inputPrix}
                      placeholder="0"
                    />
                  </td>
                  <td style={styles.td}>
                    <strong>{((prix[ligne.produit.id] || 0) * ligne.quantite).toLocaleString()} FCFA</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Frais de transport (FCFA)</label>
            <input type="number" min="0" style={styles.input} value={fraisTransport} onChange={e => setFraisTransport(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Délai de livraison (jours) *</label>
            <input type="number" min="1" style={styles.input} value={delaiLivraison} onChange={e => setDelaiLivraison(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Date de validité du devis *</label>
            <input type="date" style={styles.input} value={dateValidite} onChange={e => setDateValidite(e.target.value)} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Conditions de paiement</label>
            <input type="text" style={styles.input} value={conditionsPaiement} onChange={e => setConditionsPaiement(e.target.value)} placeholder="Ex: 50% à la commande, 50% à la livraison" />
          </div>
        </div>

        <div style={{ textAlign: 'right', marginTop: '10px' }}>
          <span style={styles.totalRow}>Total (avec transport) : {total.toLocaleString()} FCFA</span>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button style={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Envoi en cours...' : '📤 Envoyer mon devis'}
          </button>
          <button style={styles.btnSecondary} onClick={() => window.close()}>Annuler</button>
        </div>

        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '20px', textAlign: 'center' }}>
          Votre devis sera examiné par notre service achats. Vous serez informé de la décision par email.
        </p>
      </div>
    </div>
  );
}