import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      navigate('/profile');
    }
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'discord') => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto', gap: '2rem' }}>
      <h2 style={{ color: 'var(--text-color)', margin: 0 }}>Login</h2>
      
      {error && <div style={{ color: 'var(--error-color)' }}>{error}</div>}

      <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--sub-alt-color)', border: 'none', color: 'var(--text-color)', fontSize: '1rem', outline: 'none' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--sub-alt-color)', border: 'none', color: 'var(--text-color)', fontSize: '1rem', outline: 'none' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--main-color)', color: 'var(--bg-color)', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>

      <div style={{ color: 'var(--sub-color)', width: '100%', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--sub-alt-color)' }}></div>
        <span>or</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--sub-alt-color)' }}></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        <button onClick={() => handleOAuthLogin('google')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '8px', background: 'var(--text-color)', color: 'var(--bg-color)', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          <i className="fab fa-google"></i> Continue with Google
        </button>
        <button onClick={() => handleOAuthLogin('github')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '8px', background: '#24292e', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          <i className="fab fa-github"></i> Continue with GitHub
        </button>
        <button onClick={() => handleOAuthLogin('discord')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '8px', background: '#5865F2', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          <i className="fab fa-discord"></i> Continue with Discord
        </button>
      </div>

      <div style={{ color: 'var(--sub-color)', marginTop: '1rem' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--main-color)', textDecoration: 'none' }}>Register</Link>
      </div>
    </div>
  );
}
