import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit, Trash2, Package } from 'lucide-react';

export default function ProductList({ produits: produitsProp, onProductChange, canManageProducts }) {
  const [produits, setProduits] = useState(produitsProp || []);
  const [recherche, setRecherche] = useState('');
  const [produitEdit, setProduitEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (produitsProp) setProduits(produitsProp);
  }, [produitsProp]);

  const produitsFiltres = recherche ? produits.filter(p =>
    p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    p.reference.toLowerCase().includes(recherche.toLowerCase())
  ) : produits;

  const isStockBas = (produit) => produit.quantiteStock <= (produit.seuilAlerte || 5);

  const handleDelete = async (id, nom) => {
    if (window.confirm(`Supprimer le produit "${nom}" ?`)) {
      try {
        await axios.delete(`http://localhost:8080/api/produits/${id}`);
        if (onProductChange) onProductChange();
        setProduits(produits.filter(p => p.id !== id));
      } catch (error) {
        alert(error.response?.data?.error || 'Erreur lors de la suppression');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8080/api/produits/${produitEdit.id}`, produitEdit);
      if (onProductChange) onProductChange();
      setShowEditModal(false);
      setProduitEdit(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Package className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Produits en stock</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Réf</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              {canManageProducts && <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {produitsFiltres.map(p => (
              <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isStockBas(p) ? 'bg-yellow-50/50' : ''}`}>
                <td className="py-3 px-2 text-sm font-mono text-gray-600">{p.reference}</td>
                <td className="py-3 px-2 text-sm font-medium text-gray-800">{p.nom}</td>
                <td className="py-3 px-2 text-sm text-gray-600">{p.prixVente?.toLocaleString()} FCFA</td>
                <td className="py-3 px-2 text-sm font-semibold">{p.quantiteStock}</td>
                <td className="py-3 px-2">
                  {isStockBas(p) ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⚠️ Stock bas</span>
                  ) : p.quantiteStock === 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">❌ Rupture</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ OK</span>
                  )}
                </td>
                {canManageProducts && (
                  <td className="py-3 px-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setProduitEdit(p); setShowEditModal(true); }} 
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id, p.nom)} 
                        className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {produitsFiltres.length === 0 && (
          <div className="text-center py-8 text-gray-500">Aucun produit trouvé</div>
        )}
      </div>

      {/* Modal modification */}
      {showEditModal && produitEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Modifier le produit</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input 
                  type="text" 
                  value={produitEdit.nom || ''} 
                  onChange={e => setProduitEdit({...produitEdit, nom: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix de vente (FCFA)</label>
                <input 
                  type="number" 
                  value={produitEdit.prixVente || ''} 
                  onChange={e => setProduitEdit({...produitEdit, prixVente: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Seuil d'alerte</label>
                <input 
                  type="number" 
                  value={produitEdit.seuilAlerte || 5} 
                  onChange={e => setProduitEdit({...produitEdit, seuilAlerte: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}