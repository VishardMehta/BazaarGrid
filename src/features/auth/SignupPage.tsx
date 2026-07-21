import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Icon, Input } from "@/components/ui";
import { useAuth } from "./AuthContext";

export function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [busy,     setBusy]     = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }

    setBusy(true);
    const { error: err, needsVerification } = await signUp(name, email, password);
    setBusy(false);

    if (err) { setError(err); return; }
    if (needsVerification) { setVerifying(true); return; }
    navigate("/onboarding", { replace: true });
  }

  async function handleGoogle() {
    setBusy(true);
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err); setBusy(false); }
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-low px-4">
        <div className="w-full max-w-md rounded-2xl bg-surface p-10 text-center shadow-tinted">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-secondary-container mx-auto">
            <Icon name="mark_email_unread" size={32} className="text-secondary-on-container" />
          </span>
          <h1 className="mt-5 font-serif text-headline-lg font-semibold text-on-surface">
            Verify your email
          </h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            We sent a verification link to <strong className="text-on-surface">{email}</strong>.
            Click the link in that email to activate your account.
          </p>
          <p className="mt-6 text-label-sm text-on-surface-variant">
            Already verified?{" "}
            <Link to="/login" className="font-semibold text-secondary hover:text-primary">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-low px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <span className="font-serif text-display-lg text-2xl font-bold text-primary">BazaarGrid</span>
          </Link>
          <p className="mt-2 text-body-md text-on-surface-variant">Create your account</p>
        </div>

        <div className="rounded-2xl bg-surface p-8 shadow-tinted">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email address" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Input label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-error-container/30 px-3 py-2 text-label-sm text-error">
                <Icon name="error" size={16} /> {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy} icon={busy ? undefined : "person_add"}>
              {busy ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-label-sm text-on-surface-variant">
            <div className="h-px flex-1 bg-outline-variant" />or<div className="h-px flex-1 bg-outline-variant" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface px-4 py-3 text-label-md font-semibold text-on-surface transition hover:bg-surface-low disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-4 text-center text-label-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-secondary hover:text-primary">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
