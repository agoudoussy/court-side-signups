import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import raidersLogo from "@/assets/raiders-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center px-4">
      {/* Diagonal stripes */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg,transparent,transparent 12px,white 12px,white 13px)",
        }}
      />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

      <div className="relative w-full max-w-sm">
        {/* Logo card */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white rounded-2xl px-6 py-3 mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            <img src={raidersLogo} alt="Raiders Academy" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="font-display text-2xl tracking-wider text-white">ADMIN PANEL</h1>
          <p className="text-sm text-white/40 mt-1">Raiders Academy School</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-card rounded-2xl p-6 space-y-4 shadow-2xl"
        >
          <div>
            <label className="text-label uppercase text-muted-foreground block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@raiders.com"
              className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-label uppercase text-muted-foreground block mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full h-11 px-3 pr-10 rounded-lg border-[1.5px] border-border bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-xl text-sm tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              "SE CONNECTER"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
