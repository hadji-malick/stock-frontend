import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Coins, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Clock, Calendar, User, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CashClosure() {
  const { user } = useAuth();
  const [clotureStatut, setClotureStatut] = useState(null);
  const [montantReel, setMontantReel] = useState('');
  const [commentaireCloture, setCommentaireCloture] = useState('');
  const [historiqueClotures, setHistoriqueClotures] = useState([]);
  const [showHistorique, setShowHistorique] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ===== PAGINATION =====
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const isVendeur = user?.role === 'VENDEUR';
  const canSeeHistorique = user?.role === 'ADMIN' || user?.role === 'STOCK_MANAGER';

  useEffect(() => {
    checkClotureStatut();
    if (canSeeHistorique) fetchHistoriqueClotures();
  }, []);

  const checkClotureStatut = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/produits/cloture/statut');
      setClotureStatut(response.data);
    } catch (error) {
      console.error('Erreur', error);
    }
  };

  const fetchHistoriqueClotures = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/produits/cloture/historique');
      setHistoriqueClotures(response.data);
    } catch (error) {
      console.error('Erreur', error);
    }
  };

  const handleCloture = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/produits/cloture', {
        montantReel: parseFloat(montantReel),
        commentaire: commentaireCloture
      });
      setMessage({ type: 'success', text: response.data.message });
      setMontantReel('');
      setCommentaireCloture('');
      checkClotureStatut();
      if (canSeeHistorique) fetchHistoriqueClotures();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur' });
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getEcartIcon = (type) => {
    if (type === 'MANQUANT') return <TrendingDown className="h-4 w-4 text-red-500" />;
    if (type === 'EXCEDENT') return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getEcartBadge = (type) => {
    if (type === 'MANQUANT') return { label: 'Manquant', color: 'bg-red-100 text-red-700' };
    if (type === 'EXCEDENT') return { label: 'Excédent', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'OK', color: 'bg-green-100 text-green-700' };
  };

  // ===== CALCUL DE LA PAGINATION =====
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClotures = historiqueClotures.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historiqueClotures.length / itemsPerPage);

  // Réinitialiser la page quand les données changent
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [historiqueClotures.length]);

  const styles = {
    container: { spaceY: 6 },
    header: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' },
    headerIcon: { padding: '12px', background: '#fef3c7', borderRadius: '12px' },
    headerTitle: { fontSize: '24px', fontWeight: 'bold', color: '#0f172a' },
    headerSubtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px' },
    
    message: {
      success: { padding: '12px 16px', borderRadius: '12px', background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' },
      error: { padding: '12px 16px', borderRadius: '12px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }
    },
    
    formCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '24px' },
    infoBox: { padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '20px' },
    infoText: { fontSize: '14px', color: '#1e40af' },
    infoHighlight: { fontWeight: 'bold' },
    
    label: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '6px' },
    input: { width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s' },
    btnPrimary: { 
      width: '100%', 
      padding: '12px', 
      background: 'linear-gradient(135deg, #f97316, #ea580c)', 
      color: 'white', 
      border: 'none', 
      borderRadius: '12px', 
      fontSize: '16px', 
      fontWeight: '600',
      cursor: 'pointer',
      transition: '0.2s'
    },
    
    alreadyClosed: { 
      background: '#d1fae5', 
      borderRadius: '16px', 
      padding: '24px', 
      textAlign: 'center', 
      border: '1px solid #a7f3d0',
      marginBottom: '24px'
    },
    
    historyCard: { background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '12px 16px', fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
    
    pagination: { 
      display: 'flex', 
      justifyContent: 'center', 
      gap: '12px', 
      marginTop: '20px', 
      paddingTop: '16px', 
      borderTop: '1px solid #e2e8f0' 
    },
    paginationBtn: {
      padding: '8px 16px',
      borderRadius: '30px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      transition: '0.2s'
    },
    paginationBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    paginationText: {
      padding: '8px 16px',
      background: '#f1f5f9',
      borderRadius: '30px',
      fontSize: '14px',
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <Coins className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 style={styles.headerTitle}>Clôture de caisse</h1>
          <p style={styles.headerSubtitle}>Gérez les clôtures et suivez les écarts de caisse</p>
        </div>
      </div>

      {/* Message de notification */}
      {message && (
        <div style={message.type === 'success' ? styles.message.success : styles.message.error}>
          {message.text}
        </div>
      )}

      {/* Formulaire de clôture (UNIQUEMENT pour VENDEUR) */}
      {isVendeur && !clotureStatut?.estCloturee && (
        <div style={styles.formCard}>
          <div style={styles.infoBox}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p style={styles.infoText}>
                  <strong>Montant théorique :</strong> {clotureStatut?.montantTheorique?.toLocaleString() || 0} FCFA
                </p>
                <p style={{ ...styles.infoText, marginTop: '4px' }}>
                  <strong>Nombre de ventes aujourd'hui :</strong> {clotureStatut?.nombreVentes || 0}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCloture} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={styles.label}>Montant réel en caisse (FCFA) *</label>
              <input
                type="number"
                step="100"
                value={montantReel}
                onChange={(e) => setMontantReel(e.target.value)}
                style={styles.input}
                placeholder="0"
                required
                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
            <div>
              <label style={styles.label}>Commentaire (optionnel)</label>
              <input
                type="text"
                value={commentaireCloture}
                onChange={(e) => setCommentaireCloture(e.target.value)}
                style={styles.input}
                placeholder="Ex: Manque de monnaie, trop-perçu..."
                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btnPrimary,
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg, #ea580c, #c2410c)';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
              }}
            >
              {loading ? 'Clôture en cours...' : '🔒 Valider la clôture'}
            </button>
          </form>
        </div>
      )}

      {/* Message si déjà clôturé (pour VENDEUR) */}
      {isVendeur && clotureStatut?.estCloturee && (
        <div style={styles.alreadyClosed}>
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p style={{ fontSize: '16px', fontWeight: '500', color: '#065f46' }}>La caisse a déjà été clôturée pour aujourd'hui.</p>
          <p style={{ fontSize: '14px', color: '#059669', marginTop: '4px' }}>Prochaine clôture disponible demain.</p>
          {clotureStatut.cloture && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '12px', display: 'inline-block' }}>
              <p style={{ fontSize: '13px', color: '#065f46' }}>
                Montant théorique : <strong>{clotureStatut.cloture.montantTheorique?.toLocaleString()} FCFA</strong>
              </p>
              <p style={{ fontSize: '13px', color: '#065f46' }}>
                Montant réel : <strong>{clotureStatut.cloture.montantReel?.toLocaleString()} FCFA</strong>
              </p>
              <p style={{ fontSize: '13px', fontWeight: '500', color: clotureStatut.cloture.typeEcart === 'MANQUANT' ? '#dc2626' : '#059669' }}>
                Écart : {clotureStatut.cloture.ecart?.toLocaleString()} FCFA
              </p>
            </div>
          )}
        </div>
      )}

      {/* Historique des clôtures (pour ADMIN et STOCK_MANAGER) */}
      {canSeeHistorique && (
        <div>
          <button
            onClick={() => setShowHistorique(!showHistorique)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#2563eb',
              fontWeight: '500',
              marginBottom: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              transition: '0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
          >
            <Coins size={16} />
            {showHistorique ? '📋 Masquer historique' : '📋 Voir historique des clôtures'}
            <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 10px', borderRadius: '20px', color: '#475569' }}>
              {historiqueClotures.length}
            </span>
          </button>

          {showHistorique && (
            <div style={styles.historyCard}>
              {historiqueClotures.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <Coins size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Aucune clôture enregistrée</p>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Date</th>
                          <th style={styles.th}>Montant théorique</th>
                          <th style={styles.th}>Montant réel</th>
                          <th style={styles.th}>Écart</th>
                          <th style={styles.th}>Type</th>
                          <th style={styles.th}>Caissier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentClotures.map(c => {
                          const badge = getEcartBadge(c.typeEcart);
                          return (
                            <tr key={c.id} style={{ transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={{ ...styles.td, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} className="text-gray-400" />
                                {new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>
                              <td style={styles.td}>{c.montantTheorique?.toLocaleString()} FCFA</td>
                              <td style={styles.td}>{c.montantReel?.toLocaleString()} FCFA</td>
                              <td style={{ ...styles.td, fontWeight: '500' }}>
                                {c.ecart?.toLocaleString()} FCFA
                              </td>
                              <td style={styles.td}>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: badge.color.split(' ')[0], color: badge.color.split(' ')[1] }}>
                                  {getEcartIcon(c.typeEcart)} {badge.label}
                                </span>
                              </td>
                              <td style={{ ...styles.td, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={14} className="text-gray-400" />
                                {c.caissier}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={styles.pagination}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                          ...styles.paginationBtn,
                          background: currentPage === 1 ? '#e2e8f0' : '#f1f5f9',
                          ...(currentPage === 1 ? styles.paginationBtnDisabled : {})
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== 1) e.currentTarget.style.background = '#e2e8f0';
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== 1) e.currentTarget.style.background = '#f1f5f9';
                        }}
                      >
                        ◀ Précédent
                      </button>
                      <span style={styles.paginationText}>
                        Page {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          ...styles.paginationBtn,
                          background: currentPage === totalPages ? '#e2e8f0' : '#f1f5f9',
                          ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== totalPages) e.currentTarget.style.background = '#e2e8f0';
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== totalPages) e.currentTarget.style.background = '#f1f5f9';
                        }}
                      >
                        Suivant ▶
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}