import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, ShoppingCart, History, Coins, Users, LogOut, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import logo from '../../assets/logo.png';

const menuItems = {
  ADMIN: [
    { section: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { section: 'stocks', label: 'Gestion des stocks', icon: Package },
    { section: 'historique', label: 'Historique', icon: History },
    { section: 'cloture', label: 'Clôture de caisse', icon: Coins },
    { section: 'utilisateurs', label: 'Utilisateurs', icon: Users },
  ],
  STOCK_MANAGER: [
    { section: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { section: 'stocks', label: 'Gestion des stocks', icon: Package },
    { section: 'historique', label: 'Historique', icon: History },
    { section: 'cloture', label: 'Clôture de caisse', icon: Coins },
  ],
  VENDEUR: [
    { section: 'panier', label: 'Vente', icon: ShoppingCart },
    { section: 'cloture', label: 'Clôture caisse', icon: Coins },
  ],
};

export default function Sidebar({ activeSection, setActiveSection, collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const items = menuItems[user?.role] || menuItems.VENDEUR;

  const getRoleLabel = () => {
    switch(user?.role) {
      case 'ADMIN': return 'Administrateur';
      case 'STOCK_MANAGER': return 'Gestionnaire Stock';
      default: return 'Vendeur';
    }
  };

  return (
    <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-30 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-5 border-b border-slate-700`}>
        {!collapsed && (
          <div className="flex flex-col items-center">
            <img src={logo} alt="Powertech" className="h-12 w-auto" />
            <div className="text-[10px] text-slate-400 mt-1">ENGINEERING GROUP</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-lg hover:bg-slate-700">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className={`p-4 ${collapsed ? 'text-center' : ''}`}>
        <div className="bg-slate-700/50 p-3 rounded-xl">
          {!collapsed ? (
            <>
              <p className="text-xs text-slate-300">{getRoleLabel()}</p>
              <p className="font-semibold truncate text-sm">{user?.nom}</p>
            </>
          ) : (
            <Store size={24} className="mx-auto" />
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.section;
          return (
            <button
              key={item.section}
              onClick={() => setActiveSection(item.section)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-3 border-t border-slate-700">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}