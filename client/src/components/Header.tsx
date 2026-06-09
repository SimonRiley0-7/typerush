import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  let closeTimeoutRef = useRef<any>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setPendingCount(0);
      return;
    }

    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      
      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    fetchPendingCount();

    const subscription = supabase
      .channel('header-friends-pending')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friends'
      }, () => {
        fetchPendingCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 200); // Small delay to allow moving mouse into dropdown
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    setDropdownOpen(false);
  };

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
        <span style={{ color: 'var(--main-color)' }}>Type</span>Rush
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/" className={location.pathname === '/' ? 'active-btn' : ''} style={{ color: 'inherit', textDecoration: 'none' }}>
          <i className="fas fa-keyboard"></i>
        </Link>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          <i className="fas fa-crown"></i>
        </Link>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          <i className="fas fa-info"></i>
        </Link>
        <Link to="/settings" style={{ color: 'inherit', textDecoration: 'none' }}>
          <i className="fas fa-cog"></i>
        </Link>
        
        {user ? (
          <div 
            ref={dropdownRef}
            style={{ position: 'relative', marginLeft: '1rem', display: 'flex', alignItems: 'center' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Profile trigger */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: location.pathname === '/profile' ? 'var(--main-color)' : 'var(--sub-color)',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== '/profile') {
                  e.currentTarget.style.color = 'var(--text-color)';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== '/profile') {
                  e.currentTarget.style.color = 'var(--sub-color)';
                }
              }}
            >
              <i className="fas fa-user" style={{ fontSize: '1.2rem' }}></i>
              <span style={{ fontSize: '0.85rem' }}>{user.user_metadata?.full_name || 'User'}</span>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div 
                className="fade-in"
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: '0.5rem',
                  background: 'var(--bg-color)', 
                  border: '1px solid var(--sub-alt-color)',
                  borderRadius: '6px', 
                  padding: '0.3rem 0',
                  minWidth: '160px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Link to="/profile" onClick={() => setDropdownOpen(false)} className="dropdown-item">
                  <i className="fas fa-chart-line" style={{ width: '16px' }}></i> profile
                </Link>
                <Link to="/friends" onClick={() => setDropdownOpen(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <i className="fas fa-user-friends" style={{ width: '16px' }}></i> friends
                  {pendingCount > 0 && (
                    <span style={{ 
                      background: 'var(--main-color)', 
                      color: 'var(--bg-color)', 
                      borderRadius: '10px', 
                      padding: '2px 6px', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      marginLeft: 'auto',
                      lineHeight: 1
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </Link>
                <Link to="/settings" onClick={() => setDropdownOpen(false)} className="dropdown-item">
                  <i className="fas fa-palette" style={{ width: '16px' }}></i> settings
                </Link>
                <Link to="/account" onClick={() => setDropdownOpen(false)} className="dropdown-item">
                  <i className="fas fa-cog" style={{ width: '16px' }}></i> account settings
                </Link>
                <div onClick={handleSignOut} className="dropdown-item" style={{ marginTop: '0.3rem', borderTop: '1px solid var(--sub-alt-color)', paddingTop: '0.3rem' }}>
                  <i className="fas fa-sign-out-alt" style={{ width: '16px' }}></i> sign out
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className={location.pathname === '/login' || location.pathname === '/register' ? 'active-btn' : ''} style={{ marginLeft: '1rem', color: 'inherit', textDecoration: 'none' }}>
            <i className="fas fa-sign-in-alt"></i>
          </Link>
        )}
      </div>

      <style>{`
        .dropdown-item {
          padding: 0.5rem 1rem;
          color: var(--sub-color);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: color 0.1s, background 0.1s;
          font-size: 0.85rem;
        }
        .dropdown-item:hover {
          color: var(--text-color);
          background: var(--sub-alt-color);
        }
      `}</style>
    </header>
  );
};
