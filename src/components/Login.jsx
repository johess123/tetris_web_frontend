import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');

    const handleAction = async (type) => {
        if (!account || !password) {
            setMsg('Field cannot be empty...');
            return;
        }

        const formData = new FormData();
        formData.append('account', account);
        formData.append('password', password);

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${baseUrl}/${type}`, {
                method: 'POST',
                body: formData
            });
            const result = await res.text();

            if (result === 'y') {
                if (type === 'login') {
                    onLogin({ account });
                } else {
                    setMsg('Regist successfully, you can login now...');
                }
            } else if (result === 'e') {
                setMsg('Field cannot be empty...');
            } else {
                setMsg(type === 'login' ? 'Account or Password is not correct...' : 'There is already a user with the same name...');
            }
        } catch (err) {
            setMsg('Server error');
        }
    };

    return (
        <div className="auth-screen">
            <h1 className="auth-title">Login Page</h1>

            <div className="auth-form-row">
                <label className="auth-label">Account</label>
                <div className="auth-input-container">
                    <input
                        type="text"
                        className="auth-input"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        maxLength="10"
                    />
                    <span className="auth-hint">max 10</span>
                </div>
            </div>

            <div className="auth-form-row">
                <label className="auth-label">Password</label>
                <div className="auth-input-container">
                    <input
                        type="password"
                        className="auth-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        maxLength="20"
                    />
                    <span className="auth-hint">max 20</span>
                </div>
            </div>

            {msg && <div style={{ color: 'white', marginBottom: '1rem', fontSize: '0.8rem' }}>{msg}</div>}

            <div className="auth-actions">
                <button className="auth-btn-regist" onClick={() => handleAction('regist')}>Regist</button>
                <button className="auth-btn-login" onClick={() => handleAction('login')}>Login</button>
            </div>
        </div>
    );
};

export default Login;
