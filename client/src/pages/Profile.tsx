import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import {
  Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';

interface TestRecord {
  id: string;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  mode: string;
  chars_correct: number;
  chars_incorrect: number;
  chars_extra: number;
  chars_missed: number;
  time_elapsed: number;
  created_at: string;
}

export function Profile() {
  const { user } = useAuth();
  
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setTests(data);
      }
      setLoading(false);
    };
    fetchTests();
  }, [user]);

  // --- Aggregates ---
  const totalTests = tests.length;
  const totalTimeSeconds = tests.reduce((acc, t) => acc + t.time_elapsed, 0);
  
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const maxWpm = totalTests > 0 ? Math.max(...tests.map(t => t.wpm)) : 0;
  const maxRawWpm = totalTests > 0 ? Math.max(...tests.map(t => t.raw_wpm)) : 0;

  const avgWpm = totalTests > 0 ? Math.round(tests.reduce((acc, t) => acc + t.wpm, 0) / totalTests) : 0;
  const avgAcc = totalTests > 0 ? Math.round(tests.reduce((acc, t) => acc + t.accuracy, 0) / totalTests) : 0;

  // Chart data (oldest first for chart)
  const chartData = [...tests].reverse().map((t, index) => ({
    index: index + 1,
    wpm: t.wpm,
    accuracy: t.accuracy,
    date: format(new Date(t.created_at), 'dd MMM yyyy HH:mm'),
    mode: t.mode
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--sub-alt-color)', padding: '10px', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 5px', color: 'var(--main-color)', fontWeight: 'bold' }}>{data.wpm} WPM</p>
          <p style={{ margin: '0 0 5px', color: 'var(--text-color)' }}>{data.accuracy}% Acc</p>
          <p style={{ margin: 0, color: 'var(--sub-color)', fontSize: '0.8rem' }}>{data.mode}</p>
          <p style={{ margin: 0, color: 'var(--sub-color)', fontSize: '0.8rem' }}>{data.date}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div style={{ color: 'var(--sub-color)', textAlign: 'center', marginTop: '2rem' }}>Loading profile...</div>;
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '3rem', paddingBottom: '4rem' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--sub-alt-color)', padding: '2rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--sub-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'var(--bg-color)' }}>
            <i className="fas fa-user"></i>
          </div>
          <div>
            <h1 style={{ color: 'var(--text-color)', margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
              {user?.user_metadata?.full_name || 'Anonymous Typist'}
            </h1>
            <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>
              Joined {format(new Date(user?.created_at || Date.now()), 'dd MMM yyyy')}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem', textAlign: 'center' }}>
          <div>
            <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>tests completed</div>
            <div style={{ color: 'var(--text-color)', fontSize: '2rem', fontWeight: 'bold' }}>{totalTests}</div>
          </div>
          <div>
            <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>time typing</div>
            <div style={{ color: 'var(--text-color)', fontSize: '2rem', fontWeight: 'bold' }}>{formatTime(totalTimeSeconds)}</div>
          </div>
        </div>
      </div>

      {/* Stats Blocks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>highest wpm</div>
          <div style={{ color: 'var(--main-color)', fontSize: '2.5rem', fontWeight: 'bold' }}>{maxWpm}</div>
        </div>
        <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>average wpm</div>
          <div style={{ color: 'var(--text-color)', fontSize: '2.5rem', fontWeight: 'bold' }}>{avgWpm}</div>
        </div>
        <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>highest raw wpm</div>
          <div style={{ color: 'var(--text-color)', fontSize: '2.5rem', fontWeight: 'bold' }}>{maxRawWpm}</div>
        </div>
        <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>average accuracy</div>
          <div style={{ color: 'var(--text-color)', fontSize: '2.5rem', fontWeight: 'bold' }}>{avgAcc}%</div>
        </div>
      </div>

      {/* Chart */}
      {tests.length > 0 && (
        <div style={{ background: 'var(--sub-alt-color)', padding: '2rem', borderRadius: '12px', height: '400px' }}>
          <h3 style={{ color: 'var(--sub-color)', margin: '0 0 2rem 0', fontWeight: 'normal' }}>History (Last {tests.length} tests)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-color)" vertical={false} />
              <XAxis dataKey="index" stroke="var(--sub-color)" tick={{ fill: 'var(--sub-color)' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="var(--sub-color)" tick={{ fill: 'var(--sub-color)' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="var(--sub-color)" tick={{ fill: 'var(--sub-color)' }} tickLine={false} axisLine={false} hide />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="var(--sub-color)" strokeWidth={2} dot={false} opacity={0.3} />
              <Scatter yAxisId="left" dataKey="wpm" fill="var(--main-color)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History Table */}
      {tests.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-color)' }}>
            <thead>
              <tr style={{ color: 'var(--sub-color)', fontSize: '0.9rem', borderBottom: '1px solid var(--sub-alt-color)' }}>
                <th style={{ padding: '1rem', fontWeight: 'normal' }}>wpm</th>
                <th style={{ padding: '1rem', fontWeight: 'normal' }}>raw</th>
                <th style={{ padding: '1rem', fontWeight: 'normal' }}>accuracy</th>
                <th style={{ padding: '1rem', fontWeight: 'normal' }}>chars</th>
                <th style={{ padding: '1rem', fontWeight: 'normal' }}>mode</th>
                <th style={{ padding: '1rem', fontWeight: 'normal', textAlign: 'right' }}>date</th>
              </tr>
            </thead>
            <tbody>
              {tests.slice(0, 50).map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--sub-alt-color)', transition: 'background 0.2s' }} className="history-row">
                  <td style={{ padding: '1rem', color: 'var(--main-color)' }}>{t.wpm}</td>
                  <td style={{ padding: '1rem' }}>{t.raw_wpm}</td>
                  <td style={{ padding: '1rem' }}>{t.accuracy}%</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    {t.chars_correct}/{t.chars_incorrect}/{t.chars_extra}/{t.chars_missed}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--sub-color)' }}>{t.mode}</td>
                  <td style={{ padding: '1rem', color: 'var(--sub-color)', textAlign: 'right', fontSize: '0.9rem' }}>
                    {format(new Date(t.created_at), 'dd MMM yyyy HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <style>{`
            .history-row:hover { background: rgba(255,255,255,0.02); }
          `}</style>
        </div>
      )}

    </div>
  );
}
