import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useAppSettings } from '../contexts/SettingsContext';
import { TypingArea } from '../components/TypingArea';
import { playClickSound } from '../utils/audio';
import { generateWords } from '../utils/words';

type LobbyStatus = 'waiting' | 'countdown' | 'typing' | 'finished';

interface PlayerPresence {
  user_id: string;
  username: string;
  display_name: string;
  isReady: boolean;
  status: 'lobby' | 'typing' | 'finished';
  wpm: number;
  accuracy: number;
}

const cleanAccents = (str: string) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export function Lobby() {
  const { user } = useAuth();
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const { settings } = useAppSettings();

  const [players, setPlayers] = useState<PlayerPresence[]>([]);
  const [lobbyStatus, setLobbyStatus] = useState<LobbyStatus>('waiting');
  const [countdown, setCountdown] = useState(3);
  
  // Game states (synced words)
  const [syncWords, setSyncWords] = useState<string[]>([]);
  const [syncTyped, setSyncTyped] = useState<string[]>([]);
  const [syncCursor, setSyncCursor] = useState({ wordIndex: 0, charIndex: 0 });
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, extra: 0, missed: 0 });
  
  // Opponent live progress
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentWpm, setOpponentWpm] = useState(0);
  const [opponentResults, setOpponentResults] = useState<any>(null);

  // My results
  const [myResults, setMyResults] = useState<any>(null);

  const [copySuccess, setCopySuccess] = useState(false);
  const [myProfileInfo, setMyProfileInfo] = useState<{ username: string; display_name: string } | null>(null);

  const channelRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const shiftLeftPressed = useRef(false);
  const shiftRightPressed = useRef(false);

  // 1. Initialize channel and sync presence
  useEffect(() => {
    if (!user || !lobbyId) return;

    let myDisplayName = user.user_metadata?.full_name || 'Anonymous';
    let myUsername = 'user';

    supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          myUsername = data.username;
          myDisplayName = data.display_name || myDisplayName;
        }
        setMyProfileInfo({ username: myUsername, display_name: myDisplayName });

        const channel = supabase.channel(`lobby:${lobbyId}`, {
          config: {
            broadcast: { self: true },
            presence: {
              key: user.id,
            },
          },
        });

        channelRef.current = channel;

        // Presence Sync
        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const uniquePlayersMap = new Map<string, PlayerPresence>();

          Object.values(state).flat().forEach((p: any) => {
            if (p.user_id) {
              const existing = uniquePlayersMap.get(p.user_id);
              if (!existing || p.isReady) {
                uniquePlayersMap.set(p.user_id, {
                  user_id: p.user_id,
                  username: p.username || 'user',
                  display_name: p.display_name || 'Anonymous',
                  isReady: p.isReady || false,
                  status: p.status || 'lobby',
                  wpm: p.wpm || 0,
                  accuracy: p.accuracy || 100
                });
              }
            }
          });
          setPlayers(Array.from(uniquePlayersMap.values()));
        });

        // Broadcast events
        channel.on('broadcast', { event: 'start-game' }, ({ payload }) => {
          setSyncWords(payload.words);
          setSyncTyped(['']);
          setSyncCursor({ wordIndex: 0, charIndex: 0 });
          setStats({ correct: 0, incorrect: 0, extra: 0, missed: 0 });
          setOpponentProgress(0);
          setOpponentWpm(0);
          setOpponentResults(null);
          setMyResults(null);
          setLobbyStatus('countdown');
          setCountdown(3);
        });

        channel.on('broadcast', { event: 'progress' }, ({ payload }) => {
          if (payload.user_id !== user.id) {
            setOpponentProgress(payload.progress);
            setOpponentWpm(payload.wpm);
          }
        });

        channel.on('broadcast', { event: 'finish' }, ({ payload }) => {
          if (payload.user_id !== user.id) {
            setOpponentResults({
              wpm: payload.wpm,
              accuracy: payload.accuracy,
              time: payload.time
            });
          }
        });

        channel.on('broadcast', { event: 'restart' }, () => {
          setLobbyStatus('waiting');
          setSyncWords([]);
          setSyncTyped([]);
          setSyncCursor({ wordIndex: 0, charIndex: 0 });
          setOpponentProgress(0);
          setOpponentWpm(0);
          setOpponentResults(null);
          setMyResults(null);
        });

        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              username: myUsername,
              display_name: myDisplayName,
              isReady: false,
              status: 'lobby'
            });
          }
        });
      });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, lobbyId]);

  // 2. Countdown Effect
  useEffect(() => {
    if (lobbyStatus !== 'countdown') return;
    if (countdown === 0) {
      setLobbyStatus('typing');
      setTimeLeft(60);
      setTimeElapsed(0);
      
      timerIntervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const next = prev + 1;
          if (next >= 60) {
            clearInterval(timerIntervalRef.current);
            finishGame();
            return 60;
          }
          return next;
        });
        setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [lobbyStatus, countdown]);

  // 3. Shift Keys tracking
  useEffect(() => {
    const handleShiftCheck = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft') shiftLeftPressed.current = e.type === 'keydown';
      if (e.code === 'ShiftRight') shiftRightPressed.current = e.type === 'keydown';
    };
    window.addEventListener('keydown', handleShiftCheck);
    window.addEventListener('keyup', handleShiftCheck);
    return () => {
      window.removeEventListener('keydown', handleShiftCheck);
      window.removeEventListener('keyup', handleShiftCheck);
    };
  }, []);

  // 4. Live progress broadcasting
  useEffect(() => {
    if (lobbyStatus !== 'typing' || syncWords.length === 0 || !user || !channelRef.current) return;

    const totalChars = syncWords.join(' ').length;
    const typedChars = syncTyped.join(' ').length;
    const progressPercent = Math.min(Math.round((typedChars / totalChars) * 100), 100);
    
    const currentWpm = Math.round((stats.correct * 12) / (timeElapsed || 0.1));

    channelRef.current.send({
      type: 'broadcast',
      event: 'progress',
      payload: {
        user_id: user.id,
        progress: progressPercent,
        wpm: currentWpm
      }
    });

    // Auto-finish if typed all words
    if (syncCursor.wordIndex === syncWords.length - 1 && syncTyped[syncCursor.wordIndex] === syncWords[syncCursor.wordIndex]) {
      finishGame();
    }
  }, [syncTyped, syncCursor, lobbyStatus]);

  // 5. Toggle Ready State
  const toggleReady = async () => {
    if (!user || !channelRef.current) return;
    const me = players.find(p => p.user_id === user.id);
    const currentlyReady = me ? me.isReady : false;
    const newReady = !currentlyReady;

    await channelRef.current.track({
      user_id: user.id,
      username: myProfileInfo?.username || me?.username || 'user',
      display_name: myProfileInfo?.display_name || me?.display_name || user.user_metadata?.full_name || 'Anonymous',
      isReady: newReady,
      status: 'lobby'
    });
  };

  // 6. Host Starts the match
  const startMatch = () => {
    if (players.length < 2) return;
    // Synced race is always a fixed 40 words
    const wordsList = generateWords(40);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'start-game',
        payload: {
          words: wordsList
        }
      });
    }
  };

  // 7. Finish Typing game
  const finishGame = async () => {
    if (!user) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    const finalWpm = Math.round((stats.correct * 12) / (timeElapsed || 0.1));
    const finalAcc = Math.round((stats.correct / ((stats.correct + stats.incorrect) || 1)) * 100);
    
    setMyResults({
      wpm: finalWpm,
      accuracy: finalAcc,
      time: timeElapsed
    });
    
    setLobbyStatus('finished');

    // Save score to database history
    try {
      await supabase.from('tests').insert({
        user_id: user.id,
        wpm: finalWpm,
        raw_wpm: finalWpm, // using same for now
        accuracy: finalAcc,
        mode: `lobby_multiplayer_${lobbyId}`,
        chars_correct: stats.correct,
        chars_incorrect: stats.incorrect,
        chars_extra: stats.extra,
        chars_missed: stats.missed,
        time_elapsed: timeElapsed,
        advanced_stats: {}
      });
    } catch (err) {
      console.error('Failed to save multiplayer score', err);
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'finish',
        payload: {
          user_id: user.id,
          wpm: finalWpm,
          accuracy: finalAcc,
          time: timeElapsed
        }
      });

      const me = players.find(p => p.user_id === user.id);
      if (me) {
        channelRef.current.track({
          user_id: user.id,
          username: me.username,
          display_name: me.display_name,
          isReady: me.isReady,
          status: 'finished',
          wpm: finalWpm,
          accuracy: finalAcc
        });
      }
    }
  };

  // 8. Replay cycle
  const playAgain = () => {
    if (!user) return;
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'restart'
      });

      const me = players.find(p => p.user_id === user.id);
      if (me) {
        channelRef.current.track({
          user_id: user.id,
          username: me.username,
          display_name: me.display_name,
          isReady: false,
          status: 'lobby'
        });
      }
    }
  };

  // 9. Input keystroke logic
  const handleTypingKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (lobbyStatus !== 'typing') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== ' ') return;

    const wordIndex = syncCursor.wordIndex;
    const charIndex = syncCursor.charIndex;
    const currentWord = syncWords[wordIndex] || '';
    const currentTypedWord = syncTyped[wordIndex] || '';

    // Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (settings.confidenceMode) return;

      playClickSound(settings.clickSound, settings.soundVolume);

      if (charIndex > 0) {
        const newTypedWord = currentTypedWord.slice(0, -1);
        const newTyped = [...syncTyped];
        newTyped[wordIndex] = newTypedWord;
        setSyncTyped(newTyped);
        setSyncCursor({ wordIndex, charIndex: charIndex - 1 });
      } else if (wordIndex > 0) {
        const prevWord = syncWords[wordIndex - 1];
        const prevTypedWord = syncTyped[wordIndex - 1] || '';
        if (prevTypedWord !== prevWord) {
          setSyncCursor({ wordIndex: wordIndex - 1, charIndex: prevTypedWord.length });
        }
      }
      return;
    }

    // Space
    if (e.key === ' ') {
      e.preventDefault();
      if (currentTypedWord.length === 0) return;

      playClickSound(settings.clickSound, settings.soundVolume);

      const hasTypo = currentTypedWord.split('').some((char, idx) => {
        const target = currentWord[idx];
        if (settings.lazyMode) {
          return cleanAccents(char) !== cleanAccents(target);
        }
        return char !== target;
      }) || currentTypedWord.length < currentWord.length;

      if (settings.strictSpace && currentTypedWord !== currentWord) return;
      if (settings.stopOnError === 'word' && hasTypo) return;

      const isWordCorrect = settings.lazyMode
        ? cleanAccents(currentTypedWord) === cleanAccents(currentWord)
        : currentTypedWord === currentWord;

      if (wordIndex === syncWords.length - 1) {
        finishGame();
        return;
      }

      const newTyped = [...syncTyped];
      newTyped[wordIndex + 1] = '';
      setSyncTyped(newTyped);
      setSyncCursor({ wordIndex: wordIndex + 1, charIndex: 0 });

      if (currentTypedWord.length < currentWord.length) {
        setStats(s => ({ ...s, missed: s.missed + (currentWord.length - currentTypedWord.length) }));
      } else {
        if (isWordCorrect) {
          setStats(s => ({ ...s, correct: s.correct + 1 }));
        } else {
          setStats(s => ({ ...s, incorrect: s.incorrect + 1 }));
        }
      }
      return;
    }

    // Regular char
    if (e.key.length === 1) {
      e.preventDefault();
      if (currentTypedWord.length >= currentWord.length + 10) return;

      if (settings.stopOnError === 'letter') {
        const hasTypo = currentTypedWord.split('').some((char, idx) => {
          const target = currentWord[idx];
          if (settings.lazyMode) {
            return cleanAccents(char) !== cleanAccents(target);
          }
          return char !== target;
        });
        if (hasTypo) return;
      }

      playClickSound(settings.clickSound, settings.soundVolume);

      let isCorrect = charIndex < currentWord.length && (
        settings.lazyMode 
          ? cleanAccents(e.key) === cleanAccents(currentWord[charIndex]) 
          : e.key === currentWord[charIndex]
      );

      if (isCorrect && settings.oppositeShift) {
        const targetChar = currentWord[charIndex];
        const isUpper = /[A-Z]/.test(targetChar);
        if (isUpper) {
          const leftHandChars = 'qwertasedfgzxcvb';
          const isLeftHand = leftHandChars.includes(targetChar.toLowerCase());
          if (isLeftHand && !shiftRightPressed.current) isCorrect = false;
          else if (!isLeftHand && !shiftLeftPressed.current) isCorrect = false;
        }
      }

      const newTypedWord = currentTypedWord + e.key;
      const newTyped = [...syncTyped];
      newTyped[wordIndex] = newTypedWord;
      setSyncTyped(newTyped);
      setSyncCursor({ wordIndex, charIndex: charIndex + 1 });

      if (charIndex < currentWord.length) {
        if (isCorrect) setStats(s => ({ ...s, correct: s.correct + 1 }));
        else setStats(s => ({ ...s, incorrect: s.incorrect + 1 }));
      } else {
        setStats(s => ({ ...s, extra: s.extra + 1 }));
      }
    }
  };

  const copyLobbyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Helpers to isolate my progress
  const me = players.find(p => p.user_id === user?.id);
  const opponent = players.find(p => p.user_id !== user?.id);
  
  const allPlayersReady = players.length === 2 && players.every(p => p.isReady);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      
      {/* 1. LOBBY STATE */}
      {lobbyStatus === 'waiting' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', textAlign: 'center', marginTop: '2rem' }}>
          <div>
            <h1 style={{ color: 'var(--text-color)', fontWeight: 'normal', margin: '0 0 0.5rem 0' }}>Multiplayer Lobby</h1>
            <p style={{ color: 'var(--sub-color)', margin: 0 }}>Invite a friend and compete to finish typing first.</p>
          </div>

          {/* Share Link Panel */}
          <div style={{ background: 'var(--sub-alt-color)', padding: '1.2rem 2rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
            <span style={{ color: 'var(--text-color)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{window.location.href}</span>
            <button 
              onClick={copyLobbyLink}
              style={{
                padding: '0.5rem 1rem', background: 'var(--main-color)', color: 'var(--bg-color)', 
                borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <i className={copySuccess ? "fas fa-check" : "fas fa-copy"} />
              {copySuccess ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          {/* Players Panel */}
          <div style={{ display: 'flex', gap: '2.5rem', width: '100%', maxWidth: '600px', justifyContent: 'center', marginTop: '1rem' }}>
            {/* Player 1 Slot */}
            <div style={{ flex: 1, background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--main-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-color)', fontSize: '1.5rem' }}>
                <i className="fas fa-user"></i>
              </div>
              <div>
                <strong style={{ color: 'var(--text-color)', display: 'block' }}>{me?.display_name || 'You'}</strong>
                <span style={{ color: 'var(--sub-color)', fontSize: '0.8rem' }}>@{me?.username}</span>
              </div>
              <button 
                onClick={toggleReady}
                style={{
                  padding: '0.5rem 1.2rem', 
                  background: me?.isReady ? 'rgba(21, 255, 0, 0.1)' : 'rgba(255,255,255,0.03)',
                  color: me?.isReady ? '#15ff00' : 'var(--sub-color)',
                  border: `1px solid ${me?.isReady ? '#15ff00' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem'
                }}
              >
                {me?.isReady ? '✓ Ready' : 'Ready Up'}
              </button>
            </div>

            {/* Player 2 Slot */}
            <div style={{ flex: 1, background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative' }}>
              {opponent ? (
                <>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--sub-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-color)', fontSize: '1.5rem' }}>
                    <i className="fas fa-user-friends"></i>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-color)', display: 'block' }}>{opponent.display_name}</strong>
                    <span style={{ color: 'var(--sub-color)', fontSize: '0.8rem' }}>@{opponent.username}</span>
                  </div>
                  <div style={{ 
                    padding: '0.5rem 1.2rem', 
                    background: opponent.isReady ? 'rgba(21, 255, 0, 0.1)' : 'rgba(255,255,255,0.03)',
                    color: opponent.isReady ? '#15ff00' : 'var(--sub-color)',
                    border: `1px solid ${opponent.isReady ? '#15ff00' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', pointerEvents: 'none'
                  }}>
                    {opponent.isReady ? '✓ Ready' : 'Not Ready'}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--sub-color)', gap: '0.5rem' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: 'var(--main-color)' }}></i>
                  <span style={{ fontSize: '0.85rem' }}>Waiting for opponent...</span>
                </div>
              )}
            </div>
          </div>

          {/* Start Button Panel */}
          {allPlayersReady && (
            <button 
              onClick={startMatch}
              className="fade-in"
              style={{
                padding: '0.8rem 2rem', background: 'var(--main-color)', color: 'var(--bg-color)', 
                border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                marginTop: '1rem', boxShadow: '0 4px 15px rgba(226, 183, 20, 0.2)'
              }}
            >
              Start Typing Race!
            </button>
          )}
        </div>
      )}

      {/* 2. COUNTDOWN STATE */}
      {lobbyStatus === 'countdown' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }} className="fade-in">
          <div style={{ color: 'var(--sub-color)', fontSize: '1.2rem' }}>Race starts in</div>
          <div style={{ color: 'var(--main-color)', fontSize: '5rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{countdown}</div>
        </div>
      )}

      {/* 3. TYPING/RACE STATE */}
      {lobbyStatus === 'typing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
          
          {/* Progress Board */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '10px' }}>
            
            {/* My progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-color)' }}>
                  <i className="fas fa-car" style={{ color: 'var(--main-color)', marginRight: '0.5rem' }} /> 
                  <strong>{me?.display_name || 'You'}</strong> (You)
                </span>
                <span style={{ color: 'var(--main-color)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                  {Math.round((syncTyped.join(' ').length / syncWords.join(' ').length) * 100)}% | {Math.round((stats.correct * 12) / (timeElapsed || 0.1))} WPM
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.min(Math.round((syncTyped.join(' ').length / syncWords.join(' ').length) * 100), 100)}%`, 
                  height: '100%', backgroundColor: 'var(--main-color)', transition: 'width 0.1s linear' 
                }} />
              </div>
            </div>

            {/* Opponent progress bar */}
            {opponent && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--sub-color)' }}>
                    <i className="fas fa-car-side" style={{ marginRight: '0.5rem' }} /> 
                    <strong>{opponent.display_name}</strong>
                  </span>
                  <span style={{ color: 'var(--text-color)', fontFamily: 'var(--font-mono)' }}>
                    {opponentProgress}% | {opponentWpm} WPM
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${opponentProgress}%`, 
                    height: '100%', backgroundColor: 'var(--sub-color)', transition: 'width 0.2s ease-out' 
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Typing Area */}
          {myResults ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', background: 'var(--sub-alt-color)', borderRadius: '10px', color: 'var(--sub-color)' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: 'var(--main-color)', marginBottom: '1rem' }} />
              <h3>Finished! Waiting for opponent to complete...</h3>
              <p style={{ fontSize: '0.9rem' }}>Your Speed: <strong style={{ color: 'var(--text-color)' }}>{myResults.wpm} WPM</strong> | Accuracy: <strong style={{ color: 'var(--text-color)' }}>{myResults.accuracy}%</strong></p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ alignSelf: 'flex-start', color: 'var(--sub-color)', fontSize: '0.9rem', marginBottom: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                Time Left: <span style={{ color: 'var(--main-color)', fontWeight: 'bold' }}>{timeLeft}s</span>
              </div>
              <TypingArea 
                words={syncWords}
                typed={syncTyped}
                cursor={syncCursor}
                status="running"
                onKeyDown={handleTypingKeydown}
              />
            </div>
          )}

        </div>
      )}

      {/* 4. FINISHED RESULTS STATE */}
      {lobbyStatus === 'finished' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
          
          {/* Winner Board Banner */}
          {myResults && opponentResults && (
            <div style={{ 
              textAlign: 'center', 
              background: myResults.wpm > opponentResults.wpm ? 'rgba(21, 255, 0, 0.05)' : myResults.wpm < opponentResults.wpm ? 'rgba(202, 71, 84, 0.05)' : 'var(--sub-alt-color)',
              border: `1px solid ${myResults.wpm > opponentResults.wpm ? '#15ff00' : myResults.wpm < opponentResults.wpm ? 'var(--error-color)' : 'var(--sub-color)'}`,
              padding: '2rem', borderRadius: '12px'
            }}>
              <h1 style={{ 
                margin: 0, 
                color: myResults.wpm > opponentResults.wpm ? '#15ff00' : myResults.wpm < opponentResults.wpm ? 'var(--error-color)' : 'var(--text-color)',
                fontSize: '2.2rem', fontWeight: 'normal'
              }}>
                {myResults.wpm > opponentResults.wpm ? (
                  <>🎉 Victory! You Won!</>
                ) : myResults.wpm < opponentResults.wpm ? (
                  <>😔 Defeat! Opponent Won</>
                ) : (
                  <>🤝 Tie Match!</>
                )}
              </h1>
            </div>
          )}

          {/* Comparative Results Columns */}
          <div style={{ display: 'flex', gap: '2rem' }}>
            
            {/* Player 1 Stats */}
            <div style={{ flex: 1, background: 'var(--sub-alt-color)', padding: '2rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ color: 'var(--main-color)', margin: 0, fontWeight: 'normal' }}>{me?.display_name || 'You'} (You)</h3>
              {myResults ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <span style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>wpm</span>
                    <h2 style={{ margin: 0, color: 'var(--text-color)', fontSize: '2.5rem' }}>{myResults.wpm}</h2>
                  </div>
                  <div>
                    <span style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>accuracy</span>
                    <h2 style={{ margin: 0, color: 'var(--text-color)', fontSize: '2.5rem' }}>{myResults.accuracy}%</h2>
                  </div>
                  <div>
                    <span style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>time</span>
                    <h2 style={{ margin: 0, color: 'var(--text-color)', fontSize: '2.5rem' }}>{myResults.time}s</h2>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--sub-color)' }}>Did not finish test.</div>
              )}
            </div>

            {/* Player 2 Stats */}
            <div style={{ flex: 1, background: 'var(--sub-alt-color)', padding: '2rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ color: 'var(--sub-color)', margin: 0, fontWeight: 'normal' }}>{opponent?.display_name || 'Opponent'}</h3>
              {opponentResults ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <span style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>wpm</span>
                    <h2 style={{ margin: 0, color: 'var(--text-color)', fontSize: '2.5rem' }}>{opponentResults.wpm}</h2>
                  </div>
                  <div>
                    <span style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>accuracy</span>
                    <h2 style={{ margin: 0, color: 'var(--text-color)', fontSize: '2.5rem' }}>{opponentResults.accuracy}%</h2>
                  </div>
                  <div>
                    <span style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>time</span>
                    <h2 style={{ margin: 0, color: 'var(--text-color)', fontSize: '2.5rem' }}>{opponentResults.time}s</h2>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--sub-color)' }}>Opponent did not finish test.</div>
              )}
            </div>

          </div>

          {/* Options */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
            <button 
              onClick={playAgain}
              style={{
                padding: '0.8rem 2rem', background: 'var(--main-color)', color: 'var(--bg-color)', 
                border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Play Again
            </button>
            <button 
              onClick={() => navigate('/')}
              style={{
                padding: '0.8rem 2rem', background: 'transparent', color: 'var(--sub-color)', 
                border: '1px solid var(--sub-color)', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Exit to Menu
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
