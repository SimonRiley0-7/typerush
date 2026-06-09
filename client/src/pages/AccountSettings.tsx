import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '../contexts/SettingsContext';

type Tab = 'account' | 'authentication' | 'blocked' | 'reset';

export function AccountSettings() {
  const { user, signOut } = useAuth();
  const { resetSettings } = useAppSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('account');

  // Forms state
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const identities = user?.identities || [];
  const linkedProviders = identities.map(id => id.provider);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const updateProfileName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: displayName }
    });

    if (authError) {
      setLoading(false);
      showMessage(authError.message, 'error');
      return;
    }

    if (user) {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);
        
      if (dbError) {
        setLoading(false);
        showMessage(dbError.message, 'error');
        return;
      }
    }

    setLoading(false);
    showMessage('Name updated successfully!', 'success');
  };

  const updateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email });
    setLoading(false);
    if (error) showMessage(error.message, 'error');
    else showMessage('Confirmation link sent to new email!', 'success');
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) showMessage(error.message, 'error');
    else showMessage('Password updated successfully!', 'success');
  };

  const resetPersonalBests = async () => {
    if (!window.confirm('Are you sure you want to delete all your past test scores? This cannot be undone.')) return;
    
    setLoading(true);
    const { error } = await supabase.from('tests').delete().eq('user_id', user?.id);
    setLoading(false);
    
    if (error) showMessage(error.message, 'error');
    else showMessage('Personal bests reset successfully.', 'success');
  };

  const logOutOfAllDevices = async () => {
    if (!window.confirm('Are you sure you want to log out of all devices?')) return;
    await signOut();
    navigate('/login');
  };

  const linkProvider = async (provider: 'google' | 'github' | 'discord') => {
    setLoading(true);
    const { error } = await supabase.auth.linkIdentity({ provider });
    setLoading(false);
    if (error) showMessage(error.message, 'error');
  };

  const deleteAccount = async () => {
    if (!window.confirm('DANGER: This will attempt to delete your account entirely. Are you absolutely sure?')) return;
    setLoading(true);
    await supabase.from('tests').delete().eq('user_id', user?.id);
    await signOut();
    navigate('/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text-color)', fontWeight: 'normal', fontSize: '1.5rem' }}>Account</h2>
            
            <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ color: 'var(--sub-color)', margin: '0 0 0.8rem 0', fontSize: '0.875rem', fontWeight: 'normal' }}>Update Name</h3>
              <form onSubmit={updateProfileName} style={{ display: 'flex', gap: '0.8rem' }}>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name..."
                  style={{ 
                    flex: 1, padding: '0.6rem 0.8rem', background: 'var(--bg-color)', 
                    border: '1px solid var(--sub-color)', color: 'var(--text-color)', 
                    borderRadius: '6px', fontSize: '0.9rem', outline: 'none',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <button type="submit" disabled={loading} style={{ 
                  padding: '0.6rem 1.2rem', background: 'var(--main-color)', color: 'var(--bg-color)',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
                }}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </form>
            </div>

            <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ color: 'var(--sub-color)', margin: '0 0 0.8rem 0', fontSize: '0.875rem', fontWeight: 'normal' }}>Data Management</h3>
              <p style={{ color: 'var(--text-color)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                Clear all your past test scores. This action is permanent.
              </p>
              <button onClick={resetPersonalBests} disabled={loading} style={{ 
                padding: '0.6rem 1.2rem', background: 'transparent', color: 'var(--error-color)',
                border: '1px solid var(--error-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
              }}>
                <i className="fas fa-trash-alt" style={{ marginRight: '0.5rem' }}></i> 
                Reset personal bests
              </button>
            </div>
          </div>
        );

      case 'authentication':
        return (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text-color)', fontWeight: 'normal', fontSize: '1.5rem' }}>Authentication</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ color: 'var(--sub-color)', margin: '0 0 0.8rem 0', fontSize: '0.875rem', fontWeight: 'normal' }}>Update Email</h3>
                <form onSubmit={updateEmail} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="New email address"
                    style={{ 
                      padding: '0.6rem 0.8rem', background: 'var(--bg-color)', 
                      border: '1px solid var(--sub-color)', color: 'var(--text-color)', 
                      borderRadius: '6px', fontSize: '0.9rem', outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <button type="submit" disabled={loading} style={{ 
                    padding: '0.6rem', background: 'var(--sub-color)', color: 'var(--bg-color)',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
                  }}>
                    Send confirmation
                  </button>
                </form>
              </div>

              <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ color: 'var(--sub-color)', margin: '0 0 0.8rem 0', fontSize: '0.875rem', fontWeight: 'normal' }}>Update Password</h3>
                <form onSubmit={updatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    style={{ 
                      padding: '0.6rem 0.8rem', background: 'var(--bg-color)', 
                      border: '1px solid var(--sub-color)', color: 'var(--text-color)', 
                      borderRadius: '6px', fontSize: '0.9rem', outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <button type="submit" disabled={loading} style={{ 
                    padding: '0.6rem', background: 'var(--sub-color)', color: 'var(--bg-color)',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
                  }}>
                    Update password
                  </button>
                </form>
              </div>
            </div>

            <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ color: 'var(--sub-color)', margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 'normal' }}>Linked Accounts</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
                {['google', 'github', 'discord'].map((provider) => {
                  const isLinked = linkedProviders.includes(provider);
                  const p = provider as 'google' | 'github' | 'discord';
                  return (
                    <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'var(--bg-color)', border: '1px solid var(--sub-alt-color)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-color)' }}>
                        <i className={`fab fa-${p}`} style={{ fontSize: '1.1rem' }}></i>
                        <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{p}</span>
                      </div>
                      {isLinked ? (
                        <span style={{ color: 'var(--main-color)', fontSize: '0.8rem' }}><i className="fas fa-check"></i> Linked</span>
                      ) : (
                        <button 
                          onClick={() => linkProvider(p)}
                          disabled={loading}
                          style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'var(--sub-alt-color)', color: 'var(--sub-color)', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Link
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ color: 'var(--sub-color)', margin: '0 0 0.8rem 0', fontSize: '0.875rem', fontWeight: 'normal' }}>Sessions</h3>
              <button onClick={logOutOfAllDevices} disabled={loading} style={{ 
                padding: '0.6rem 1.2rem', background: 'transparent', color: 'var(--text-color)',
                border: '1px solid var(--sub-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
              }}>
                <i className="fas fa-sign-out-alt" style={{ marginRight: '0.5rem' }}></i> 
                Log out of all devices
              </button>
            </div>
          </div>
        );

      case 'blocked':
        return (
          <div className="fade-in" style={{ textAlign: 'center', padding: '3rem 0' }}>
            <h2 style={{ margin: '0 0 1.2rem 0', color: 'var(--text-color)', fontWeight: 'normal', fontSize: '1.5rem' }}>Blocked Users</h2>
            <i className="fas fa-user-slash" style={{ fontSize: '3rem', color: 'var(--sub-alt-color)', marginBottom: '1rem' }}></i>
            <p style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>You haven't blocked anyone yet.</p>
          </div>
        );

      case 'reset':
        return (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ margin: 0, color: 'var(--error-color)', fontWeight: 'normal', fontSize: '1.5rem' }}>Danger Zone</h2>
            
            <div style={{ background: 'rgba(202, 71, 84, 0.1)', border: '1px solid var(--error-color)', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: 'var(--text-color)', margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 'normal' }}>Reset account</h3>
                  <p style={{ color: 'var(--sub-color)', margin: 0, fontSize: '0.85rem' }}>Deletes all your typing test history and personal bests.</p>
                </div>
                <button onClick={resetPersonalBests} disabled={loading} style={{ 
                  padding: '0.6rem 1.2rem', background: 'transparent', color: 'var(--error-color)',
                  border: '1px solid var(--error-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
                }}>
                  Reset stats
                </button>
              </div>

              <div style={{ height: '1px', background: 'var(--error-color)', opacity: 0.2 }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: 'var(--text-color)', margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 'normal' }}>Delete account</h3>
                  <p style={{ color: 'var(--sub-color)', margin: 0, fontSize: '0.85rem' }}>Permanently wipes your account and all associated data.</p>
                </div>
                <button onClick={deleteAccount} disabled={loading} style={{ 
                  padding: '0.6rem 1.2rem', background: 'var(--error-color)', color: '#fff',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
                }}>
                  Delete account
                </button>
              </div>

              <div style={{ height: '1px', background: 'var(--error-color)', opacity: 0.2 }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: 'var(--text-color)', margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 'normal' }}>Reset Application Settings</h3>
                  <p style={{ color: 'var(--sub-color)', margin: 0, fontSize: '0.85rem' }}>Revert all customization and typing preferences to default values.</p>
                </div>
                <button onClick={() => { if (window.confirm('Reset settings to default?')) resetSettings(); }} style={{ 
                  padding: '0.6rem 1.2rem', background: 'var(--sub-color)', color: 'var(--bg-color)',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
                }}>
                  Reset Settings
                </button>
              </div>

            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2.5rem', maxWidth: '1150px', margin: '0 auto', width: '100%', paddingBottom: '4rem' }}>
      
      {/* Sidebar Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
        <h1 style={{ color: 'var(--text-color)', margin: '0 0 1.5rem 0', fontSize: '1.6rem', fontWeight: 'normal' }}>Account</h1>
        
        <button 
          onClick={() => setActiveTab('account')}
          style={{ 
            textAlign: 'left', padding: '0.75rem 1rem', background: activeTab === 'account' ? 'var(--sub-alt-color)' : 'transparent',
            color: activeTab === 'account' ? 'var(--text-color)' : 'var(--sub-color)', border: 'none', borderRadius: '6px', 
            cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.8rem'
          }}
        >
          <i className="fas fa-user-circle" style={{ width: '18px' }}></i> Account
        </button>

        <button 
          onClick={() => setActiveTab('authentication')}
          style={{ 
            textAlign: 'left', padding: '0.75rem 1rem', background: activeTab === 'authentication' ? 'var(--sub-alt-color)' : 'transparent',
            color: activeTab === 'authentication' ? 'var(--text-color)' : 'var(--sub-color)', border: 'none', borderRadius: '6px', 
            cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.8rem'
          }}
        >
          <i className="fas fa-shield-alt" style={{ width: '18px' }}></i> Authentication
        </button>

        <button 
          onClick={() => setActiveTab('blocked')}
          style={{ 
            textAlign: 'left', padding: '0.75rem 1rem', background: activeTab === 'blocked' ? 'var(--sub-alt-color)' : 'transparent',
            color: activeTab === 'blocked' ? 'var(--text-color)' : 'var(--sub-color)', border: 'none', borderRadius: '6px', 
            cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.8rem'
          }}
        >
          <i className="fas fa-user-slash" style={{ width: '18px' }}></i> Blocked users
        </button>

        <button 
          onClick={() => setActiveTab('reset')}
          style={{ 
            textAlign: 'left', padding: '0.75rem 1rem', background: activeTab === 'reset' ? 'rgba(202, 71, 84, 0.1)' : 'transparent',
            color: activeTab === 'reset' ? 'var(--error-color)' : 'var(--sub-color)', border: 'none', borderRadius: '6px', 
            cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.8rem'
          }}
        >
          <i className="fas fa-exclamation-triangle" style={{ width: '18px' }}></i> Reset
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, paddingTop: '3.1rem', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
        {/* Toast Message */}
        {message && (
          <div className="fade-in" style={{ 
            padding: '0.8rem 1.2rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
            background: message.type === 'error' ? 'var(--error-extra-color)' : 'var(--main-color)',
            color: message.type === 'error' ? '#fff' : 'var(--bg-color)',
            fontWeight: 'bold', fontSize: '0.9rem'
          }}>
            <i className={`fas fa-${message.type === 'error' ? 'exclamation-circle' : 'check-circle'}`}></i>
            {message.text}
          </div>
        )}

        <div style={{ flex: 1 }}>
          {renderTabContent()}
        </div>
      </div>

    </div>
  );
}
