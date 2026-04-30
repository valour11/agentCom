import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Plus, X, Shield } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/agents`);
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/admin/agents`, formData);
      setFormData({ name: '', password: '' });
      setShowCreateForm(false);
      fetchAgents();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#24439b' }}>Agents</h2>
          <p className="text-sm mt-1" style={{ color: '#5f7bd6' }}>Manage your team members</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(90deg, #3d82f6 0%, #8b5cf6 100%)',
            boxShadow: '0 10px 20px rgba(90,100,255,0.25)',
          }}
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
          >
            <User className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: '#24439b' }}>No agents yet</h3>
          <p className="text-sm" style={{ color: '#5f7bd6' }}>Create your first agent to start handling conversations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent._id}
              className="p-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(245, 243, 252, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                border: '1px solid rgba(120,160,255,0.15)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.05)';
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
                >
                  <User className="w-5 h-5 text-white" />
                </div>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg"
                  style={{ background: 'linear-gradient(90deg, rgba(106,167,255,0.15) 0%, rgba(138,92,246,0.15) 100%)', color: '#3d82f6' }}
                >
                  <Shield className="w-3 h-3" />
                  {agent.role}
                </span>
              </div>
              <h4 className="text-sm font-semibold mb-1" style={{ color: '#24439b' }}>{agent.name}</h4>
              <p className="text-xs" style={{ color: '#5f7bd6' }}>
                Created {new Date(agent.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(30, 40, 80, 0.3)', backdropFilter: 'blur(6px)' }}
            onClick={() => setShowCreateForm(false)}
          />

          <div
            className="relative w-full max-w-md animate-scale-in p-7"
            style={{
              background: 'rgba(245, 243, 252, 0.95)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
              border: '1px solid rgba(120,160,255,0.15)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: '#24439b' }}>New Agent</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 rounded-xl transition-all duration-300"
                style={{ color: '#8bb1ff' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3f5bb5' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 text-[14px] outline-none transition-all"
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    border: '1px solid rgba(120, 160, 255, 0.45)',
                    background: 'rgba(255,255,255,0.5)',
                    color: '#1e2a4a',
                  }}
                  placeholder="agent name"
                  required
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(106, 167, 255, 0.2)';
                    e.target.style.borderColor = 'rgba(106, 167, 255, 0.7)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'rgba(120, 160, 255, 0.45)';
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3f5bb5' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 text-[14px] outline-none transition-all"
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    border: '1px solid rgba(120, 160, 255, 0.45)',
                    background: 'rgba(255,255,255,0.5)',
                    color: '#1e2a4a',
                  }}
                  placeholder="••••••••"
                  required
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(106, 167, 255, 0.2)';
                    e.target.style.borderColor = 'rgba(106, 167, 255, 0.7)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'rgba(120, 160, 255, 0.45)';
                  }}
                />
              </div>
              {error && (
                <p className="text-sm px-3 py-2.5 rounded-xl" style={{ background: 'rgba(254,226,226,0.8)', border: '1px solid rgba(248,113,113,0.3)', color: '#dc2626' }}>
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 hover:brightness-105"
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(120,160,255,0.3)',
                    color: '#5f7bd6',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(90deg, #3d82f6 0%, #8b5cf6 100%)',
                    boxShadow: '0 6px 15px rgba(90,100,255,0.2)',
                  }}
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
