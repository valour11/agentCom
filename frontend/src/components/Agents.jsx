import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Plus, X, Shield } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'https://agentcom-wxmv.onrender.com'}/api`;

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
    <div className="h-full overflow-y-auto" style={{ padding: '16px' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ marginBottom: '32px' }}>
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#24439b' }}>Agents</h2>
          <p className="text-sm" style={{ color: '#5f7bd6', marginTop: '4px' }}>Manage your team members</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center text-white text-sm font-medium rounded-xl transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
          style={{
            padding: '10px 20px',
            gap: '8px',
            background: 'linear-gradient(90deg, #3d82f6 0%, #8b5cf6 100%)',
            boxShadow: '0 10px 20px rgba(90,100,255,0.25)',
          }}
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Empty State */}
      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center" style={{ paddingTop: '80px', paddingBottom: '80px', gap: '18px' }}>
          <div
            className="flex items-center justify-center"
            style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
          >
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: '#24439b' }}>No agents yet</h3>
            <p className="text-sm" style={{ color: '#5f7bd6', marginTop: '4px' }}>Create your first agent to start handling conversations</p>
          </div>
        </div>
      ) : (
        /* Agent Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '20px' }}>
          {agents.map((agent) => (
            <div
              key={agent._id}
              className="transition-all duration-300 hover:-translate-y-1"
              style={{
                padding: '24px',
                background: 'rgba(245, 243, 252, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: '20px',
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
              <div className="flex items-start justify-between" style={{ marginBottom: '16px' }}>
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)' }}
                >
                  <User className="w-5 h-5 text-white" />
                </div>
                <span
                  className="inline-flex items-center text-xs font-medium rounded-lg"
                  style={{
                    padding: '6px 10px',
                    gap: '4px',
                    background: 'linear-gradient(90deg, rgba(106,167,255,0.15) 0%, rgba(138,92,246,0.15) 100%)',
                    color: '#3d82f6',
                  }}
                >
                  <Shield className="w-3 h-3" />
                  {agent.role}
                </span>
              </div>
              <h4 className="text-sm font-semibold" style={{ color: '#24439b', marginBottom: '4px' }}>{agent.name}</h4>
              <p className="text-xs" style={{ color: '#5f7bd6' }}>
                Created {new Date(agent.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: '20px' }}>
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(30, 40, 80, 0.3)', backdropFilter: 'blur(6px)' }}
            onClick={() => setShowCreateForm(false)}
          />

          <div
            className="relative w-full mx-4 sm:mx-0 sm:max-w-md"
            style={{
              padding: '24px',
              background: 'rgba(245, 243, 252, 0.95)',
              backdropFilter: 'blur(16px)',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
              border: '1px solid rgba(120,160,255,0.15)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h3 className="text-lg font-bold" style={{ color: '#24439b' }}>New Agent</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl transition-all duration-300"
                style={{ padding: '8px', color: '#8bb1ff' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="block text-sm font-medium" style={{ color: '#3f5bb5', marginBottom: '8px' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 text-[14px] outline-none transition-all"
                  style={{
                    height: '48px',
                    borderRadius: '14px',
                    border: '1px solid rgba(120, 160, 255, 0.45)',
                    background: 'rgba(255,255,255,0.5)',
                    color: '#1e2a4a',
                    paddingLeft: '12px',
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
                <label className="block text-sm font-medium" style={{ color: '#3f5bb5', marginBottom: '8px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 text-[14px] outline-none transition-all"
                  style={{
                    height: '48px',
                    borderRadius: '14px',
                    border: '1px solid rgba(120, 160, 255, 0.45)',
                    background: 'rgba(255,255,255,0.5)',
                    color: '#1e2a4a',
                    paddingLeft: '12px',
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
                <p className="text-sm rounded-xl" style={{ padding: '10px 12px', background: 'rgba(254,226,226,0.8)', border: '1px solid rgba(248,113,113,0.3)', color: '#dc2626' }}>
                  {error}
                </p>
              )}
              <div className="flex gap-3" style={{ paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 text-sm font-medium rounded-xl transition-all duration-300 hover:brightness-105"
                  style={{
                    padding: '10px 16px',
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
                  className="flex-1 text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    padding: '10px 16px',
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
