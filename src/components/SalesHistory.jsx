import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileSpreadsheet, Receipt, History, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function SalesHistory() {
  const [historique, setHistorique] = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistorique();
    fetchFactures();
  }, []);

  const fetchHistorique = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/produits/ventes');
      setHistorique(response.data);
    } catch (error) {
      console.error('Erreur', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFactures = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/produits/factures');
      setFactures(response.data);
    } catch (error) {
      console.error('Erreur factures', error);
    }
  };

  const exportToExcel = () => {
    const data = historique.map(v => ({
      'Date': new Date(v.dateVente).toLocaleString(),
      'Produit': v.produit?.nom,
      'Quantité': v.quantite,
      'Prix unitaire': v.prixUnitaire,
      'Total': v.montantTotal,
      'Vendeur': v.vendeur
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventes');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), `ventes_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const imprimerFacture = (facture, ventes) => {
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture ${facture.numero} - Powertech</title>
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
            <p>Facture: ${facture.numero}</p>
            <p>Date: ${new Date(facture.dateFacture).toLocaleString()}</p>
          </div>
          <div class="content">
            ${ventes.map(v => `
              <div class="row">
                <span>${v.produit?.nom} x ${v.quantite}</span>
                <span>${(v.prixUnitaire * v.quantite).toLocaleString()} FCFA</span>
              </div>
            `).join('')}
            <div class="row total">
              <span>TOTAL</span>
              <span>${facture.montantTotal.toLocaleString()} FCFA</span>
            </div>
          </div>
          <div class="footer">
            <p>Merci de votre visite !</p>
            <p>Vendeur: ${facture.vendeur}</p>
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <History className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Historique des ventes</h1>
        </div>
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-200"
        >
          <FileSpreadsheet size={18} /> Exporter Excel
        </button>
      </div>

      {factures.length > 0 ? (
        factures.map(facture => {
          const ventesFacture = historique.filter(v => v.factureId === facture.id);
          if (ventesFacture.length === 0) return null;
          return (
            <div key={facture.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-gray-600" />
                    <span className="font-mono font-semibold text-gray-800">{facture.numero}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{new Date(facture.dateFacture).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total facture</p>
                    <p className="font-bold text-emerald-600">{facture.montantTotal?.toLocaleString()} FCFA</p>
                  </div>
                  <button 
                    onClick={() => imprimerFacture(facture, ventesFacture)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <Receipt size={18} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendeur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ventesFacture.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-800">{v.produit?.nom}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{v.quantite}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{v.prixUnitaire?.toLocaleString()} FCFA</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">{(v.prixUnitaire * v.quantite).toLocaleString()} FCFA</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{v.vendeur}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <History size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucune vente enregistrée</p>
        </div>
      )}
    </div>
  );
}