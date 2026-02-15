import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/auth.service";
import { validateEmail, validateLoginPassword } from "../../utils/authValidation";
import "./auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const err = validateEmail(email);
    if (err) {
      setError(err);
      setEmailError(err);
      return;
    }
    setEmailError(null);

    const passwordError = validateLoginPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const data = await login(email.trim().toLowerCase(), password);
      localStorage.setItem("token", data.token);
      setSuccess("Welcome back. You are logged in.");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-hero">
          <h1>Welcome back to BillFlow.</h1>
          <p>Track, categorize, and master your expenses with a secure workspace built for speed.</p>
          <div className="auth-hero-badges">
            <div className="auth-hero-badge">Secure by design</div>
            <div className="auth-hero-badge">Fast onboarding</div>
            <div className="auth-hero-badge">Cloud ready</div>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10V8a6 6 0 1112 0v2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="white" strokeWidth="1.8" />
              <path d="M12 14v3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h2>Login</h2>
          <p>Access your account and keep control of every bill.</p>
          {error && <div className="auth-alert error">{error}</div>}
          {success && <div className="auth-alert success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                onBlur={() => setEmailError(validateEmail(email))}
                required
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "login-email-error" : undefined}
              />
              {emailError && (
                <span id="login-email-error" className="auth-field-error" role="alert">
                  {emailError}
                </span>
              )}
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Your secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="auth-actions">
              <button className="auth-button" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
              <a className="auth-link" href="/signup">
                Need an account? Create one
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
