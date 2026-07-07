import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function ConfirmerDateExpedition() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [commande, setCommande] = useState(null);
  const [dateExpedition, setDateExpedition] = useState('');

  useEffect(() => {
    fetchCommande();
  }, [token]);

  const fetchCommande = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/commandes/date/${token}`);
      setCommande(res.data);
      setLoading(false);
    } catch (err) {
      toast.error('Erreur lors du chargement');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!dateExpedition) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`http://localhost:8080/api/commandes/confirmer-date/${token}`, {
        dateExpedition: dateExpedition
      });
      toast.success('Date d\'expédition confirmée');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: { maxWidth: '600px', margin: '50px auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: { background: '#f97316', padding: '20px', textAlign: 'center', color: 'white', borderRadius: '12px 12px 0 0' },
    content: { background: 'white', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '0 0 12px 12px' },
    input: { width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' },
    label: { fontWeight: 'bold', display: 'block', marginBottom: '5px' },
    btnPrimary: { background: '#f97316', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.content, textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ color: '#10b981' }}>✅ Date confirmée</h2>
          <p>Merci, la date d'expédition a bien été transmise à Powertech Engineering Group.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📅 Confirmer la date d'expédition</h1>
        <p>Commande N° : {commande?.numero}</p>
      </div>
      <div style={styles.content}>
        <p>Merci de confirmer la date et l'heure exactes auxquelles la commande sera expédiée.</p>
        <label style={styles.label}>Date d'expédition *</label>
        <input
          type="datetime-local"
          style={styles.input}
          value={dateExpedition}
          onChange={e => setDateExpedition(e.target.value)}
        />
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button style={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Envoi...' : '📅 Confirmer la date'}
          </button>
        </div>
      </div>
    </div>
  );
}