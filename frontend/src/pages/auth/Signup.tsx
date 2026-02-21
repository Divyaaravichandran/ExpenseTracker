import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../../services/auth.service";
import { validateEmail, validatePassword } from "../../utils/authValidation";
import "./auth.css";

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
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

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    const err = validateEmail(email);
    if (err) {
      setError(err);
      setEmailError(err);
      return;
    }
    setEmailError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const data = await signup(name.trim(), email.trim().toLowerCase(), password);

      // Persist auth information for future sessions
      localStorage.setItem("token", data.token);
      if (data.user?.id) {
        localStorage.setItem("userId", data.user.id);
      }

      setSuccess("Account created. You are now signed in.");

      // Redirect to dashboard after successful signup
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-hero">
          <h1>Create your BillFlow workspace.</h1>
          <p>Build a secure home for your invoices, receipts, and monthly insights.</p>
          <div className="auth-hero-badges">
            <div className="auth-hero-badge">Smart analytics</div>
            <div className="auth-hero-badge">Collaborative ready</div>
            <div className="auth-hero-badge">Encrypted storage</div>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3v18" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M4 12h16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h2>Sign up</h2>
          <p>Start with a free account and upgrade anytime.</p>
          {error && <div className="auth-alert error">{error}</div>}
          {success && <div className="auth-alert success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                aria-describedby={emailError ? "signup-email-error" : undefined}
              />
              {emailError && (
                <span id="signup-email-error" className="auth-field-error" role="alert">
                  {emailError}
                </span>
              )}
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="8+ chars, Aa1 required"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <small className="auth-hint">Use at least 8 characters, with uppercase, lowercase, and a number.</small>
            </div>
            <div className="auth-actions">
              <button className="auth-button" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Signup"}
              </button>
              <a className="auth-link" href="/login">
                Already have an account? Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
