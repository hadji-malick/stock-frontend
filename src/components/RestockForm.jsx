import { useState } from 'react';
import axios from 'axios';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function RestockForm({ onRestock, produits }) {
  const [entree, setEntree] = useState({ produitId: '', quantite: 1, fournisseur: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entree.produitId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un produit' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:8080/api/produits/${entree.produitId}/entree`, {
        quantite: parseInt(entree.quantite),
        fournisseur: entree.fournisseur || "Inconnu",
        note: ""
      });
      setMessage({ type: 'success', text: response.data.message });
      setEntree({ produitId: '', quantite: 1, fournisseur: '' });
      if (onRestock) onRestock();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur' });
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-emerald-100 rounded-xl">
          <RefreshCw className="h-5 w-5 text-emerald-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Réapprovisionner</h2>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Produit</label>
          <select
            value={entree.produitId}
            onChange={(e) => setEntree({ ...entree, produitId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          >
            <option value="">-- Choisir un produit --</option>
            {produits.map(p => (
              <option key={p.id} value={p.id}>{p.nom} - Stock actuel: {p.quantiteStock}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
          <input
            type="number"
            min="1"
            value={entree.quantite}
            onChange={(e) => setEntree({ ...entree, quantite: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur (optionnel)</label>
          <input
            type="text"
            value={entree.fournisseur}
            onChange={(e) => setEntree({ ...entree, fournisseur: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Nom du fournisseur"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-2.5 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? 'Réapprovisionnement...' : 'Réapprovisionner'}
        </button>
      </form>
    </div>
  );
}