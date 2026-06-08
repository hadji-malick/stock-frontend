import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ activeSection, setActiveSection, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      
      <main className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Header activeSection={activeSection} />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}