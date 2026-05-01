import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User } from 'lucide-react';

const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(name, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background: 'linear-gradient(135deg, #a9c7f5 0%, #e7c3dd 100%)',
      }}
    >
      <div
        className="w-full max-w-[400px] animate-scale-in"
        style={{
          background: 'rgba(245, 243, 252, 0.88)',
          backdropFilter: 'blur(10px)',
          borderRadius: '22px',
          padding: '32px 24px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex justify-center mb-7">
          <div
            className="w-[64px] h-[64px] rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6aa7ff 0%, #8a5cf6 100%)',
            }}
          >
            <User className="w-[26px] h-[26px] text-white stroke-[1.5]" />
          </div>
        </div>

        <div className="text-center mb-[40px]">
          <h1
            className="text-[28px] sm:text-[34px] font-bold leading-tight"
            style={{ color: '#24439b' }}
          >
            Welcome back
          </h1>
          <p
            className="text-[15px] font-normal mt-2"
            style={{ color: '#5f7bd6' }}
          >
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-7">
            <label
              htmlFor="name"
              className="block text-[14px] font-medium mb-5"
              style={{ color: '#3f5bb5',
                marginTop: '20px'
               }}
            >
              Username
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-[46px] sm:h-[54px] px-4 text-[15px] outline-none transition-all"
              style={{
                borderRadius: '10px',
                border: '1px solid rgba(120, 160, 255, 0.45)',
                background: 'rgba(255,255,255,0.5)',
                color: '#1e2a4a',
                padding: '14px'
              }}
              placeholder="username"
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

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-[14px] font-medium mb-2"
              style={{ color: '#3f5bb5',
                marginTop: '20px'
               }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[54px] pl-4 pr-12 text-[15px] outline-none transition-all"
                style={{
                  borderRadius: '10px',
                  border: '1px solid rgba(120, 160, 255, 0.45)',
                  background: 'rgba(255,255,255,0.5)',
                  color: '#1e2a4a',
                  padding: '14px',
                }}
                placeholder="password"
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: '#8bb1ff' }}
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="px-3 py-2.5 text-[13px] mb-6"
              style={{
                borderRadius: '10px',
                background: 'rgba(254, 226, 226, 0.8)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                color: '#dc2626',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-[30px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
                style={{
                  accentColor: '#4f73ff',
                  borderColor: 'rgba(120, 160, 255, 0.4)',
                  marginTop: '5px'
                }}
              />
              <span
                className="text-[14px]"
                style={{ color: '#5473d6',
                  marginTop: '5px'
                 }}
              >
                Remember me
              </span>
            </label>
            <span
              className="text-[14px] cursor-pointer hover:underline"
              style={{ color: '#4f73ff' }}
            >
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] text-white text-[16px] font-semibold outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(90deg, #3d82f6 0%, #8b5cf6 100%)',
              borderRadius: '12px',
              boxShadow: '0 10px 20px rgba(90,100,255,0.25)',
              border: 'none',
              marginTop: '20px'
            }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div
          className="mt-7 px-3 py-2.5 text-center"
          style={{
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.4)',
          }}
        >
          <p className="text-[11px] font-medium" style={{ color: '#8a9fd6' }}>Demo: SuperAdmin / admin123</p>
        </div>

        <div className="text-center mt-9">
          {/* <span
            className="text-[14px]"
            style={{ color: '#6d8ae5' }}
          >
            Don&apos;t have an account?{' '}
            <span
              className="font-semibold cursor-pointer"
              style={{ color: '#4f73ff' }}
            >
              Sign up
            </span>
          </span> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
