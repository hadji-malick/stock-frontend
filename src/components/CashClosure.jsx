import { useState, useEffect } from 'react';
import axios from 'axios';
import { Coins, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-orange-100 rounded-xl">
          <Coins className="h-5 w-5 text-orange-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">Clôture de caisse</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Formulaire de clôture */}
      {isVendeur && !clotureStatut?.estCloturee && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Montant théorique :</strong> {clotureStatut?.montantTheorique?.toLocaleString() || 0} FCFA
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Nombre de ventes aujourd'hui : {clotureStatut?.nombreVentes || 0}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCloture} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant réel en caisse *</label>
              <input
                type="number"
                step="100"
                value={montantReel}
                onChange={(e) => setMontantReel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</label>
              <input
                type="text"
                value={commentaireCloture}
                onChange={(e) => setCommentaireCloture(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: Manque de monnaie..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-70"
            >
              {loading ? 'Clôture en cours...' : '🔒 Valider la clôture'}
            </button>
          </form>
        </div>
      )}

      {/* Message si déjà clôturé */}
      {isVendeur && clotureStatut?.estCloturee && (
        <div className="bg-green-50 rounded-2xl shadow-sm p-6 text-center border border-green-200">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-green-800 font-medium">La caisse a déjà été clôturée pour aujourd'hui.</p>
          <p className="text-sm text-green-600 mt-1">Prochaine clôture disponible demain.</p>
          {clotureStatut.cloture && (
            <div className="mt-4 p-3 bg-white rounded-xl inline-block mx-auto">
              <p className="text-sm">Montant théorique: <strong>{clotureStatut.cloture.montantTheorique?.toLocaleString()} FCFA</strong></p>
              <p className="text-sm">Montant réel: <strong>{clotureStatut.cloture.montantReel?.toLocaleString()} FCFA</strong></p>
              <p className={`text-sm font-medium ${clotureStatut.cloture.typeEcart === 'MANQUANT' ? 'text-red-600' : 'text-green-600'}`}>
                Écart: {clotureStatut.cloture.ecart?.toLocaleString()} FCFA
              </p>
            </div>
          )}
        </div>
      )}

      {/* Historique des clôtures */}
      {canSeeHistorique && (
        <div>
          <button
            onClick={() => setShowHistorique(!showHistorique)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <Coins size={16} />
            {showHistorique ? '📋 Masquer historique' : '📋 Voir historique des clôtures'}
          </button>

          {showHistorique && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant théorique</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant réel</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Écart</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caissier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historiqueClotures.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-600">{new Date(c.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-sm text-gray-800">{c.montantTheorique?.toLocaleString()} FCFA</td>
                        <td className="px-5 py-3 text-sm text-gray-800">{c.montantReel?.toLocaleString()} FCFA</td>
                        <td className="px-5 py-3 text-sm font-medium">{c.ecart?.toLocaleString()} FCFA</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            {getEcartIcon(c.typeEcart)}
                            <span className={`text-sm ${
                              c.typeEcart === 'MANQUANT' ? 'text-red-600' : 
                              c.typeEcart === 'EXCEDENT' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {c.typeEcart === 'MANQUANT' ? 'Manquant' : c.typeEcart === 'EXCEDENT' ? 'Excédent' : 'OK'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{c.caissier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {historiqueClotures.length === 0 && (
                <div className="text-center py-8 text-gray-500">Aucune clôture enregistrée</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}