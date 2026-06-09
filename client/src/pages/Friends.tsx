import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface FriendItem {
  friendshipId: string;
  otherId: string;
  username: string;
  display_name: string;
}

export function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  
  // Send request form state
  const [targetUsername, setTargetUsername] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Friends search filter
  const [searchFilter, setSearchFilter] = useState('');

  const fetchSocialData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch my profile username
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    if (myProfile) {
      setMyUsername(myProfile.username);
    }

    // Fetch friend relationships
    const { data: friendsRows, error: friendsError } = await supabase
      .from('friends')
      .select('id, sender_id, receiver_id, status')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (friendsError) {
      console.error(friendsError);
      setLoading(false);
      return;
    }

    if (!friendsRows || friendsRows.length === 0) {
      setFriendsList([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setLoading(false);
      return;
    }

    const otherIds = friendsRows.map(row => row.sender_id === user.id ? row.receiver_id : row.sender_id);

    // Fetch profile details for all other users
    const { data: profilesRows, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', otherIds);

    if (profilesError) {
      console.error(profilesError);
      setLoading(false);
      return;
    }

    const profileMap = new Map(profilesRows?.map(p => [p.id, p]) || []);

    const accepted: FriendItem[] = [];
    const incoming: FriendItem[] = [];
    const outgoing: FriendItem[] = [];

    friendsRows.forEach((row) => {
      const isSender = row.sender_id === user.id;
      const otherId = isSender ? row.receiver_id : row.sender_id;
      const otherProfile = profileMap.get(otherId);

      if (!otherProfile) return;

      const item: FriendItem = {
        friendshipId: row.id,
        otherId,
        username: otherProfile.username,
        display_name: otherProfile.display_name || 'Anonymous'
      };

      if (row.status === 'accepted') {
        accepted.push(item);
      } else if (row.status === 'pending') {
        if (isSender) {
          outgoing.push(item);
        } else {
          incoming.push(item);
        }
      }
    });

    setFriendsList(accepted);
    setIncomingRequests(incoming);
    setOutgoingRequests(outgoing);
    setLoading(false);
  };

  useEffect(() => {
    fetchSocialData();
  }, [user]);

  const sendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = targetUsername.trim();
    if (!user || !cleanUsername) return;
    
    setSendLoading(true);
    setError('');
    setSuccess('');

    // Check if adding self
    if (myUsername && cleanUsername.toLowerCase() === myUsername.toLowerCase()) {
      setError("You cannot send a friend request to yourself.");
      setSendLoading(false);
      return;
    }

    // Lookup target profile
    const { data: targetProfile, error: lookupError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (lookupError || !targetProfile) {
      setError("User not found. Please check the username spelling.");
      setSendLoading(false);
      return;
    }

    // Check if friendship relationship already exists
    const { data: existingRow } = await supabase
      .from('friends')
      .select('id, status, sender_id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetProfile.id}),and(sender_id.eq.${targetProfile.id},receiver_id.eq.${user.id})`)
      .maybeSingle();

    if (existingRow) {
      if (existingRow.status === 'accepted') {
        setError(`You are already friends with ${cleanUsername}.`);
      } else if (existingRow.sender_id === user.id) {
        setError(`You have already sent a pending request to ${cleanUsername}.`);
      } else {
        setError(`${cleanUsername} has already sent you a request. Check your received list!`);
      }
      setSendLoading(false);
      return;
    }

    // Insert new pending request
    const { error: insertError } = await supabase
      .from('friends')
      .insert({
        sender_id: user.id,
        receiver_id: targetProfile.id,
        status: 'pending'
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(`Friend request sent to ${cleanUsername}!`);
      setTargetUsername('');
      fetchSocialData();
    }
    setSendLoading(false);
  };

  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);
    if (!error) {
      fetchSocialData();
    }
  };

  const deleteRelationship = async (friendshipId: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);
    if (!error) {
      fetchSocialData();
    }
  };

  const startPrivateLobby = (_friend: FriendItem) => {
    // Generate a unique lobby code
    const lobbyId = `lobby-${Math.random().toString(36).substring(2, 9)}`;
    navigate(`/lobby/${lobbyId}`);
  };

  const filteredFriends = friendsList.filter(f => 
    f.username.toLowerCase().includes(searchFilter.toLowerCase()) || 
    f.display_name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (loading) {
    return <div style={{ color: 'var(--sub-color)', textAlign: 'center', marginTop: '3rem' }}>Loading social dashboard...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }} className="fade-in">
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'var(--text-color)', margin: '0 0 0.5rem 0', fontWeight: 'normal', fontSize: '1.8rem' }}>Friends</h1>
          <p style={{ color: 'var(--sub-color)', margin: 0, fontSize: '0.9rem' }}>
            Add friends by username and invite them to private multiplayer lobbies.
          </p>
        </div>
        {myUsername && (
          <div style={{ background: 'var(--sub-alt-color)', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--sub-color)' }}>
            Your Username: <strong style={{ color: 'var(--main-color)' }}>{myUsername}</strong>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
        
        {/* Left column: Friends List & Requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Incoming Pending Requests (Only renders if count > 0) */}
          {incomingRequests.length > 0 && (
            <div style={{ background: 'rgba(226, 183, 20, 0.03)', border: '1px solid rgba(226, 183, 20, 0.15)', padding: '1.5rem', borderRadius: '8px' }} className="fade-in">
              <h2 style={{ color: 'var(--main-color)', margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-bell"></i> Received Requests ({incomingRequests.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {incomingRequests.map((req) => (
                  <div key={req.friendshipId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--sub-alt-color)', padding: '0.8rem 1.2rem', borderRadius: '6px' }}>
                    <div>
                      <div style={{ color: 'var(--text-color)', fontWeight: 'bold', fontSize: '0.95rem' }}>{req.display_name}</div>
                      <div style={{ color: 'var(--sub-color)', fontSize: '0.8rem' }}>@{req.username}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => acceptRequest(req.friendshipId)} 
                        style={{ padding: '0.4rem 0.8rem', background: 'var(--main-color)', color: 'var(--bg-color)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => deleteRelationship(req.friendshipId)} 
                        style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', color: 'var(--sub-color)', borderRadius: '4px', fontSize: '0.8rem' }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List Card */}
          <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '8px', minHeight: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h2 style={{ color: 'var(--text-color)', margin: 0, fontSize: '1.2rem', fontWeight: 'normal' }}>
                Your Friends ({friendsList.length})
              </h2>
              {friendsList.length > 0 && (
                <input 
                  type="text" 
                  placeholder="Filter friends..." 
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-color)', border: '1px solid var(--sub-color)', borderRadius: '4px', color: 'var(--text-color)', fontSize: '0.8rem', outline: 'none' }}
                />
              )}
            </div>

            {friendsList.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--sub-color)', gap: '0.5rem' }}>
                <i className="fas fa-user-friends" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
                <span>You haven't added any friends yet.</span>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div style={{ color: 'var(--sub-color)', textAlign: 'center', padding: '2rem' }}>No friends match your filter.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {filteredFriends.map((friend) => (
                  <div key={friend.friendshipId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div>
                      <div style={{ color: 'var(--text-color)', fontWeight: 'bold' }}>{friend.display_name}</div>
                      <div style={{ color: 'var(--sub-color)', fontSize: '0.8rem' }}>@{friend.username}</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button 
                        onClick={() => startPrivateLobby(friend)}
                        style={{ padding: '0.4rem 0.8rem', background: 'rgba(226, 183, 20, 0.1)', color: 'var(--main-color)', border: '1px solid rgba(226, 183, 20, 0.2)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        <i className="fas fa-play" style={{ marginRight: '0.3rem' }} /> Lobby
                      </button>
                      <button 
                        onClick={() => deleteRelationship(friend.friendshipId, `Are you sure you want to unfriend ${friend.display_name}?`)} 
                        style={{ padding: '0.4rem 0.8rem', background: 'transparent', color: 'var(--error-color)', border: '1px solid rgba(202, 71, 84, 0.2)', borderRadius: '4px', fontSize: '0.8rem' }}
                      >
                        Unfriend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Send Friend Request & Sent Pending */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Send Request Card */}
          <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '8px' }}>
            <h2 style={{ color: 'var(--text-color)', margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 'normal' }}>Add Friend</h2>
            
            <form onSubmit={sendFriendRequest} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input 
                type="text" 
                placeholder="Enter username..." 
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                required
                style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-color)', border: '1px solid var(--sub-color)', borderRadius: '6px', color: 'var(--text-color)', fontSize: '0.9rem', outline: 'none' }}
              />
              <button 
                type="submit" 
                disabled={sendLoading}
                style={{ padding: '0.6rem', background: 'var(--main-color)', color: 'var(--bg-color)', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {sendLoading ? 'Searching...' : 'Send Request'}
              </button>
            </form>

            {error && <div style={{ color: 'var(--error-color)', fontSize: '0.85rem', marginTop: '0.8rem' }} className="fade-in">{error}</div>}
            {success && <div style={{ color: 'var(--main-color)', fontSize: '0.85rem', marginTop: '0.8rem' }} className="fade-in">{success}</div>}
          </div>

          {/* Outgoing Requests Card */}
          {outgoingRequests.length > 0 && (
            <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '8px' }} className="fade-in">
              <h3 style={{ color: 'var(--sub-color)', margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 'normal' }}>Sent Pending ({outgoingRequests.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {outgoingRequests.map((req) => (
                  <div key={req.friendshipId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                      <span style={{ color: 'var(--text-color)', fontSize: '0.85rem', fontWeight: 'bold' }}>{req.display_name}</span>
                      <div style={{ color: 'var(--sub-color)', fontSize: '0.75rem' }}>@{req.username}</div>
                    </div>
                    <button 
                      onClick={() => deleteRelationship(req.friendshipId)} 
                      style={{ padding: '0.2rem 0.5rem', background: 'transparent', color: 'var(--sub-color)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.75rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
