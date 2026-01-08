import { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:3001/api/login', { username, password });
            if (res.data.success) {
                onLogin(res.data.user);
            }
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw',
            background: 'radial-gradient(circle at 50% 0%, #334155 0%, #0f172a 50%, #020617 100%)', // Professional deep slate gradient
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Subtle background glow effect */}
            <div style={{
                position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
                width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255, 107, 53, 0.15) 0%, transparent 70%)',
                borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none'
            }} />

            <div style={{
                background: 'rgba(15, 23, 42, 0.6)', // Glassy dark pane
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '3rem',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)', // Deep shadow + rim light
                width: '100%',
                maxWidth: '420px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <img src="/LinQSynQ Logo.png" alt="Logo" style={{ width: '80px', height: 'auto', marginBottom: '1rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                    <h2 style={{
                        margin: 0,
                        fontWeight: '800',
                        fontSize: '1.75rem',
                        color: 'white',
                        letterSpacing: '-0.5px'
                    }}>Welcome Back</h2>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>Access the Communication Gateway</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', marginLeft: '4px' }}>Username</label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.3)', color: 'white', fontSize: '1rem', outline: 'none', transition: 'all 0.2s',
                                fontFamily: 'inherit'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = '#ff6b35'; e.target.style.background = 'rgba(0,0,0,0.5)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }}
                        />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', marginLeft: '4px' }}>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.3)', color: 'white', fontSize: '1rem', outline: 'none', transition: 'all 0.2s',
                                fontFamily: 'inherit'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = '#ff6b35'; e.target.style.background = 'rgba(0,0,0,0.5)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }}
                        />
                    </div>

                    <button type="submit" style={{
                        marginTop: '1rem',
                        padding: '1rem', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #ff6b35 0%, #ff4b1f 100%)',
                        color: 'white', fontSize: '1rem', letterSpacing: '0.5px',
                        fontWeight: '700', cursor: 'pointer',
                        boxShadow: '0 10px 20px -5px rgba(255, 107, 53, 0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                        onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 15px 30px -5px rgba(255, 107, 53, 0.6)'; }}
                        onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 10px 20px -5px rgba(255, 107, 53, 0.4)'; }}
                    >
                        Sign In
                    </button>

                    <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                        Need access? Contact your Admin.
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
