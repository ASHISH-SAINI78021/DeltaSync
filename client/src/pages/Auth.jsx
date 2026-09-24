import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState(null);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register(formData.name, formData.email, formData.password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authBox}>
                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

                {error && <div className={styles.errorBox}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {!isLogin && (
                        <div className={styles.inputGroup}>
                            <label>Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    )}
                    <div className={styles.inputGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <p className={styles.toggleText}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className={styles.toggleBtn}>
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
