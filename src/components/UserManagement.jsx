import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, Edit, Trash2, Shield, Package, ShoppingCart, X, Check } from 'lucide-react';

export default function UserManagement() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', motDePasse: '', nom: '', role: 'VENDEUR' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/auth/utilisateurs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUtilisateurs(response.data);
    } catch (error) {
      console.error('Erreur', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingUser) {
        await axios.put(`http://localhost:8080/api/auth/utilisateurs/${editingUser.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage({ type: 'success', text: 'Utilisateur modifié' });
      } else {
        await axios.post('http://localhost:8080/api/auth/register', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage({ type: 'success', text: 'Utilisateur créé' });
      }
      fetchUsers();
      setShowModal(false);
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur' });
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (id, nom) => {
    if (window.confirm(`Supprimer l'utilisateur "${nom}" ?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/auth/utilisateurs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
        setMessage({ type: 'success', text: 'Utilisateur supprimé' });
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur' });
      }
    }
  };

  const resetForm = () => {
    setFormData({ email: '', motDePasse: '', nom: '', role: 'VENDEUR' });
    setEditingUser(null);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ email: user.email, motDePasse: '', nom: user.nom, role: user.role });
    setShowModal(true);
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'ADMIN':
        return { icon: Shield, label: 'Admin', color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700' };
      case 'STOCK_MANAGER':
        return { icon: Package, label: 'Gestionnaire', color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700' };
      default:
        return { icon: ShoppingCart, label: 'Vendeur', color: 'green', bg: 'bg-green-100', text: 'text-green-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">Gérer les comptes et les permissions</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <UserPlus size={18} /> Nouvel utilisateur
        </button>
      </div>

      {/* Message de confirmation */}
      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {utilisateurs.map(u => {
                const roleBadge = getRoleBadge(u.role);
                const Icon = roleBadge.icon;
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">{u.nom?.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-800">{u.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                        <Icon size={12} />
                        {roleBadge.label}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.actif ? (
                        <div className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <Check size={14} /> Actif
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-red-500 text-sm">
                          <X size={14} /> Inactif
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(u)} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id, u.nom)} 
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {utilisateurs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {/* Modal de création/modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
              </h3>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
                </label>
                <input
                  type="password"
                  value={formData.motDePasse}
                  onChange={e => setFormData({ ...formData, motDePasse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editingUser}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VENDEUR">💰 Vendeur</option>
                  <option value="STOCK_MANAGER">📦 Gestionnaire de stock</option>
                  <option value="ADMIN">👑 Administrateur</option>
                </select>
              </div>
              
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}