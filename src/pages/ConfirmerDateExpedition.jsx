import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function ConfirmerDateExpedition() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      toast.error('Erreur chargement');
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
      toast.success('✅ Date d\'expédition confirmée !');
      setTimeout(() => window.close(), 2000);
    } catch (err) {
      toast.error('Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '30px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#f97316' }}>📅 Confirmer la date d'expédition</h2>
      <p><strong>Commande N° :</strong> {commande?.numero}</p>
      <p><strong>Fournisseur :</strong> {commande?.fournisseur?.nom}</p>
      
      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Date d'expédition prévue</label>
        <input type="datetime-local" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} value={dateExpedition} onChange={(e) => setDateExpedition(e.target.value)} />
      </div>
      
      <button style={{ width: '100%', marginTop: '20px', background: '#f97316', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }} onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Envoi...' : '📤 Confirmer la date'}
      </button>
    </div>
  );
}