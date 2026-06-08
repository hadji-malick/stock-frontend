import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Trash2, Minus, Plus, ShoppingBag, Loader2 } from 'lucide-react';

export default function Cart({ user, produits: produitsProp, onSaleComplete }) {
  const [panier, setPanier] = useState([]);
  const [produits, setProduits] = useState(produitsProp || []);
  const [quantiteAjout, setQuantiteAjout] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (produitsProp) setProduits(produitsProp);
  }, [produitsProp]);

  const ajouterAuPanier = (produit, quantite) => {
    if (quantite < 1 || quantite > produit.quantiteStock) {
      setMessage({ type: 'error', text: `Stock insuffisant pour ${produit.nom}` });
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    setPanier(prev => {
      const existing = prev.find(item => item.id === produit.id);
      if (existing) {
        if (existing.quantite + quantite > produit.quantiteStock) {
          setMessage({ type: 'error', text: `Stock insuffisant pour ${produit.nom}` });
          return prev;
        }
        return prev.map(item => item.id === produit.id ? { ...item, quantite: item.quantite + quantite } : item);
      }
      return [...prev, { ...produit, quantite }];
    });
    
    setMessage({ type: 'success', text: `${quantite} x ${produit.nom} ajouté au panier` });
    setTimeout(() => setMessage(''), 2000);
    setQuantiteAjout({ ...quantiteAjout, [produit.id]: 1 });
  };

  const retirerDuPanier = (id) => {
    setPanier(prev => prev.filter(item => item.id !== id));
  };

  const modifierQuantite = (id, nouvelleQuantite, stockMax) => {
    if (nouvelleQuantite < 1) {
      retirerDuPanier(id);
      return;
    }
    if (nouvelleQuantite > stockMax) {
      setMessage({ type: 'error', text: `Stock maximum: ${stockMax}` });
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    setPanier(prev => prev.map(item => item.id === id ? { ...item, quantite: nouvelleQuantite } : item));
  };

  const validerPanier = async () => {
    if (panier.length === 0) {
      setMessage({ type: 'error', text: 'Le panier est vide' });
      return;
    }
    
    setLoading(true);
    try {
      const items = panier.map(item => ({ produitId: item.id, quantite: item.quantite }));
      const response = await axios.post('http://localhost:8080/api/produits/vente-multi', {
        items,
        vendeur: user?.nom || "Vendeur",
        commentaire: ""
      });
      
      setMessage({ type: 'success', text: `✅ ${response.data.message} - Facture: ${response.data.numeroFacture}` });
      setPanier([]);
      if (onSaleComplete) onSaleComplete();
      imprimerFacture(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur' });
    } finally {
      setLoading(false);
    }
  };

  const imprimerFacture = (data) => {
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture ${data.numeroFacture} - Powertech</title>
        <style>
          body { font-family: monospace; margin: 0; padding: 20px; background: white; }
          .facture { max-width: 350px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; }
          .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 20px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .total { border-top: 2px dashed #333; padding-top: 10px; margin-top: 10px; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; }
          @media print { .no-print { display: none; } .facture { border: none; } }
        </style>
      </head>
      <body>
        <div class="facture">
          <div class="header">
            <h1>🏪 POWERTECH</h1>
            <p>Facture: ${data.numeroFacture}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
          </div>
          <div class="content">
            ${data.details.map(d => `
              <div class="row">
                <span>${d.produit} x ${d.quantite}</span>
                <span>${d.sousTotal.toLocaleString()} FCFA</span>
              </div>
            `).join('')}
            <div class="row total">
              <span>TOTAL</span>
              <span>${data.total.toLocaleString()} FCFA</span>
            </div>
          </div>
          <div class="footer">
            <p>Merci de votre visite !</p>
            <p>Vendeur: ${user?.nom}</p>
          </div>
        </div>
        <div class="no-print" style="text-align:center; margin-top:20px;">
          <button onclick="window.print()" style="padding:10px; background:#2c3e50; color:white; border:none; border-radius:5px;">🖨️ Imprimer</button>
          <button onclick="window.close()" style="padding:10px; background:#95a5a6; color:white; border:none; border-radius:5px;">❌ Fermer</button>
        </div>
        <script>setTimeout(() => window.print(), 500);</script>
      </body>
      </html>
    `;
    const w = window.open('', '_blank');
    w.document.write(ticketHTML);
    w.document.close();
  };

  const totalPanier = panier.reduce((sum, item) => sum + (item.prixVente * item.quantite), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Liste des produits */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Produits disponibles</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {produits.filter(p => p.quantiteStock > 0).map(produit => (
              <div key={produit.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="font-medium text-gray-800">{produit.nom}</div>
                <div className="text-emerald-600 font-bold text-lg mt-1">{produit.prixVente.toLocaleString()} FCFA</div>
                <div className="text-sm text-gray-500 mt-1">Stock: {produit.quantiteStock}</div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="number"
                    min="1"
                    max={produit.quantiteStock}
                    value={quantiteAjout[produit.id] || 1}
                    onChange={(e) => setQuantiteAjout({ ...quantiteAjout, [produit.id]: parseInt(e.target.value) || 1 })}
                    className="w-20 px-3 py-1.5 border border-gray-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button 
                    onClick={() => ajouterAuPanier(produit, quantiteAjout[produit.id] || 1)}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-1.5 rounded-xl text-sm font-medium transition-all"
                  >
                    ➕ Ajouter
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {produits.filter(p => p.quantiteStock > 0).length === 0 && (
            <div className="text-center py-8 text-gray-500">Aucun produit disponible</div>
          )}
        </div>
      </div>

      {/* Panier */}
      <div>
        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-purple-100 rounded-xl">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Panier ({panier.length})</h2>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}
          
          {panier.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-30" />
              <p>Panier vide</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {panier.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-800">{item.nom}</p>
                      <p className="text-xs text-gray-500">{item.prixVente.toLocaleString()} FCFA</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => modifierQuantite(item.id, item.quantite - 1, item.quantiteStock)} 
                        className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantite}</span>
                      <button 
                        onClick={() => modifierQuantite(item.id, item.quantite + 1, item.quantiteStock)} 
                        className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        onClick={() => retirerDuPanier(item.id)} 
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-emerald-600">{totalPanier.toLocaleString()} FCFA</span>
                </div>
                <button 
                  onClick={validerPanier}
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? 'Validation...' : '✅ Valider la vente'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}