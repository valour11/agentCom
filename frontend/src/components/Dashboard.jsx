import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Messages from './Messages';
import Agents from './Agents';
import { MessageSquare, Users, LogOut, Shield, Zap } from 'lucide-react';

const Dashboard = () => {
  const { agent, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('messages');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { id: 'messages', name: 'Messages', icon: MessageSquare, roles: ['admin', 'agent'] },
    { id: 'agents', name: 'Agents', icon: Users, roles: ['admin'] },
  ];

  const availableItems = navItems.filter(item => item.roles.includes(agent?.role));

  return (
    <div
      className="h-screen flex overflow-hidden p-[20px] gap-[20px]"
      style={{ background: 'linear-gradient(135deg, #a9c7f5 0%, #e7c3dd 100%)' }}
    >
      <aside
        className="w-[260px] flex flex-col flex-shrink-0"
        style={{
          background: 'rgba(245, 243, 252, 0.92)',
          backdropFilter: 'blur(12px)',
          boxShadow: '4px 0 25px rgba(0,0,0,0.06)',
          borderRadius: '10px',
          padding: '24px 18px',
        }}
      >
        <div
          className="flex items-center"
          style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid rgba(120,160,255,0.1)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
          >
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="ml-3 text-lg font-bold tracking-tight" style={{ color: '#24439b' }}>AgentCom</span>
        </div>

        <div className="px-2 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5f7bd6' }}>Menu</p>
        </div>
        <nav className="flex-1 px-2">
          {availableItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center transition-all duration-300"
                style={{
                  gap: '14px',
                  padding: '14px 16px',
                  marginBottom: '10px',
                  borderRadius: '14px',
                  background: activeTab === item.id
                    ? 'linear-gradient(90deg, rgba(106,167,255,0.14) 0%, rgba(138,92,246,0.14) 100%)'
                    : 'transparent',
                  color: activeTab === item.id ? '#24439b' : '#5f7bd6',
                  fontWeight: activeTab === item.id ? 600 : 500,
                  boxShadow: activeTab === item.id ? '0 2px 8px rgba(106,167,255,0.12)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== item.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="text-[14px]">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div
          className="mt-auto"
          style={{ padding: '18px', borderRadius: '10px', background: 'rgba(181, 217, 235, 0.3)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
            >
              {agent?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: '#24439b' }}>{agent?.name}</p>
              <div className="flex items-center gap-1">
                {agent?.role === 'admin' && <Shield className="w-3 h-3" style={{ color: '#8a5cf6' }} />}
                <span className="text-xs capitalize" style={{ color: '#5f7bd6' }}>{agent?.role}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-10 rounded-md transition-all duration-300"
            style={{ color: '#5f7bd6', marginTop: '20px', marginLeft: '20px', marginRight: '20px', padding: '10px' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#5f7bd6';
            }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex items-center justify-between flex-shrink-0 px-8"
          style={{
            height: '72px',
            background: 'rgba(245, 243, 252, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            padding: '20px',
            margin: '20px',
            marginLeft: '3px',
            border: '1px solid rgba(120,160,255,0.1)',
          }}
        >
          <h1 className="text-xl font-semibold" style={{ color: '#24439b' }}>
            {activeTab === 'messages' ? 'All Messages' : 'Agent Management'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ background: '#34d399' }} />
            <span className="text-sm font-medium" style={{ color: '#5f7bd6' }}>Connected</span>
          </div>
        </header>

        <main className="flex-1 overflow-hidden mt-[20px]">
          {activeTab === 'messages' && <Messages agentId={agent?._id} />}
          {activeTab === 'agents' && <Agents />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
