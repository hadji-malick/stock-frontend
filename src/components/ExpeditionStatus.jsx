import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ExpeditionStatus({ commandeId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 60000);
    return () => clearInterval(interval);
  }, [commandeId]);

  useEffect(() => {
    if (status?.tempsRestantSecondes !== undefined) {
      setTimeLeft(status.tempsRestantSecondes);
      const timer = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/commandes/${commandeId}/expedition-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(res.data);
      if (res.data.tempsRestantSecondes !== undefined) {
        setTimeLeft(res.data.tempsRestantSecondes);
      }
      setLoading(false);
    } catch (err) {
      console.error('Erreur chargement statut', err);
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null) return '--';
    if (seconds < 0) return '⚠️';
    const jours = Math.floor(seconds / 86400);
    const heures = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (jours > 0) return `${jours}j ${heures}h`;
    if (heures > 0) return `${heures}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getEtatInfos = () => {
    if (!status) return { label: '⏳', color: '#94a3b8', bg: '#f1f5f9' };
    switch(status.etat) {
      case 'EN_ATTENTE_DATE': return { label: '⏳', color: '#d97706', bg: '#fef3c7' };
      case 'EXPEDITION_PLANIFIEE': return { label: '📅', color: '#2563eb', bg: '#dbeafe' };
      case 'EXPEDITION_EN_RETARD': return { label: '⚠️', color: '#dc2626', bg: '#fee2e2' };
      case 'EXPEDIEE': return { label: '✅', color: '#16a34a', bg: '#dcfce7' };
      default: return { label: '❓', color: '#94a3b8', bg: '#f1f5f9' };
    }
  };

  if (loading) {
    return <span style={{ color: '#94a3b8' }}>⏳</span>;
  }

  if (!status) {
    return <span style={{ color: '#94a3b8' }}>—</span>;
  }

  const infos = getEtatInfos();

  // Style compact pour le tableau
  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      whiteSpace: 'nowrap'
    },
    icon: {
      fontSize: '16px'
    },
    timer: {
      fontWeight: '600',
      color: infos.color,
      fontSize: '12px'
    },
    badge: {
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      backgroundColor: infos.bg,
      color: infos.color,
      marginLeft: '4px'
    },
    tooltip: {
      position: 'relative' 
    }
  };

  return (
    <div style={styles.container}>
      <span style={styles.icon}>{infos.label}</span>
      
      {status.etat === 'EXPEDITION_PLANIFIEE' && timeLeft !== null && (
        <span style={styles.timer}>{formatTime(timeLeft)}</span>
      )}
      
      {status.etat === 'EXPEDITION_EN_RETARD' && (
        <span style={{ ...styles.timer, color: '#dc2626' }}>Retard</span>
      )}
      
      {status.etat === 'EN_ATTENTE_DATE' && (
        <span style={styles.badge}>En attente</span>
      )}
      
      {status.etat === 'EXPEDIEE' && (
        <span style={styles.badge}>Livrée</span>
      )}
    </div>
  );
}