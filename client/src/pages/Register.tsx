import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      // Supabase auto-logs in on successful signup if email confirmation is off.
      // If it's on, it requires checking email. Assuming off for testing.
      navigate('/profile');
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto', gap: '2rem' }}>
      <h2 style={{ color: 'var(--text-color)', margin: 0 }}>Register</h2>
      
      {error && <div style={{ color: 'var(--error-color)' }}>{error}</div>}

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Display Name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--sub-alt-color)', border: 'none', color: 'var(--text-color)', fontSize: '1rem', outline: 'none' }}
        />
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div style={{ color: 'var(--sub-color)', marginTop: '1rem' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--main-color)', textDecoration: 'none' }}>Login</Link>
      </div>
    </div>
  );
}
