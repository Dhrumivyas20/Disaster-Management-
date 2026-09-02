import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setIsLoading(false);

      if (result.success) {
        setLocation("/");
      } else {
        setError(result.error ?? "Authentication failed");
      }
    }, 400);
  };

  const handleFillDemo = () => {
    setEmail("admin@gmail.com");
    setPassword("admin123");
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#ECE5DC] text-[#4B5125] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar Header */}
      <header className="flex items-center justify-between mx-auto w-full max-w-5xl py-2">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Narada Logo"
            className="h-8 w-8 object-contain rounded-md shadow-xs"
          />
          <span className="font-serif text-lg font-extrabold tracking-wide text-[#4B5125]">
            NARADA
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#727270]/20 bg-[#FEFEFE] px-3 py-1 shadow-xs text-xs font-mono text-[#727270]">
          <span className="h-2 w-2 rounded-full bg-[#4B5125] animate-pulse" />
          <span>Secure Gateway · v2.4</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="my-auto mx-auto w-full max-w-[440px]">
        <div className="rounded-2xl border border-[#727270]/20 bg-[#FEFEFE] p-7 sm:p-9 shadow-md transition-all">
          {/* Brand & Identity */}
          <div className="text-center mb-6">
            <div className="inline-grid place-items-center rounded-xl bg-[#F0F1DB] p-2.5 shadow-xs mb-3 border border-[#727270]/15">
              <img
                src="/logo.png"
                alt="Narada Logo"
                className="h-14 w-14 object-contain"
              />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#4B5125]">
              NARADA
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#727270] font-semibold mt-1">
              Multi-Hazard Spatial Risk Platform
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="mb-5 flex items-start gap-3 rounded-lg border border-[#b65343]/30 bg-[#b65343]/10 p-3 text-xs text-[#b65343]"
              role="alert"
            >
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="input-email"
                className="block font-mono text-[11px] uppercase tracking-[.14em] text-[#727270] font-bold mb-1.5"
              >
                Username / Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#727270]">
                  <Mail size={16} />
                </div>
                <input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  required
                  className="w-full rounded-lg border border-[#727270]/25 bg-[#ECE5DC]/25 py-2.5 pl-10 pr-3.5 font-mono text-sm text-[#2d3116] placeholder:text-[#727270]/50 focus:border-[#4B5125] focus:bg-[#FEFEFE] focus:outline-none focus:ring-1 focus:ring-[#4B5125] transition-all"
                  data-testid="input-login-email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="input-password"
                  className="block font-mono text-[11px] uppercase tracking-[.14em] text-[#727270] font-bold"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#727270]">
                  <Lock size={16} />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  required
                  className="w-full rounded-lg border border-[#727270]/25 bg-[#ECE5DC]/25 py-2.5 pl-10 pr-10 font-mono text-sm text-[#2d3116] placeholder:text-[#727270]/50 focus:border-[#4B5125] focus:bg-[#FEFEFE] focus:outline-none focus:ring-1 focus:ring-[#4B5125] transition-all"
                  data-testid="input-login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#727270] hover:text-[#4B5125]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Quick Demo Filler Pill */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleFillDemo}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#727270]/20 bg-[#F0F1DB] py-1.5 px-3 font-mono text-xs font-semibold text-[#4B5125] hover:bg-[#ECE5DC] transition-colors"
                data-testid="button-fill-demo"
              >
                <Sparkles size={13} />
                <span>Autofill Demo: admin@gmail.com / admin123</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-[#4B5125] py-3 px-4 font-mono text-xs font-bold uppercase tracking-wider text-[#FEFEFE] shadow-sm hover:bg-[#383d1c] disabled:opacity-60 transition-all cursor-pointer"
              data-testid="button-login-submit"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-[#FEFEFE] border-t-transparent animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Command</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 border-t border-[#727270]/15 pt-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#727270]">
              Authorized Operator Access Only
            </p>
            <p className="text-[11px] text-[#727270] mt-0.5">
              All spatial queries and model parameter alterations are logged for audit compliance.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl py-3 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#727270]">
          ● SYSTEM ENCRYPTED · NARADA DISASTER RISK REDUCTION PLATFORM
        </p>
      </footer>
    </div>
  );
}
