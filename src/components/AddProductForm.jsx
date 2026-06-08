import { useState } from 'react';
import axios from 'axios';
import { Plus, Loader2 } from 'lucide-react';

export default function AddProductForm({ onProductAdded }) {
  const [produit, setProduit] = useState({
    reference: '', nom: '', prixVente: '', quantiteStock: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/produits', produit);
      setProduit({ reference: '', nom: '', prixVente: '', quantiteStock: '' });
      setMessage({ type: 'success', text: '✅ Produit ajouté avec succès !' });
      if (onProductAdded) onProductAdded();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || '❌ Erreur lors de l\'ajout' });
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Plus className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Ajouter un produit</h2>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
          <input
            type="text"
            value={produit.reference}
            onChange={(e) => setProduit({ ...produit, reference: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="REF-001"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
          <input
            type="text"
            value={produit.nom}
            onChange={(e) => setProduit({ ...produit, nom: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Nom du produit"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente (FCFA)</label>
            <input
              type="number"
              value={produit.prixVente}
              onChange={(e) => setProduit({ ...produit, prixVente: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité initiale</label>
            <input
              type="number"
              value={produit.quantiteStock}
              onChange={(e) => setProduit({ ...produit, quantiteStock: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="0"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {loading ? 'Ajout en cours...' : 'Ajouter le produit'}
        </button>
      </form>
    </div>
  );
}