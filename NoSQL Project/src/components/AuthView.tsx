import React from "react";
import { KeyRound, Mail, User, BookOpen, AlertCircle, CheckCircle, HelpCircle, RefreshCw } from "lucide-react";
import { api } from "../lib/api";

type AuthTab = "signin" | "register" | "forgot";

interface AuthViewProps {
  initialTab?: "signin" | "register";
  onAuthSuccess: (user: any, token: string) => void;
  onToggleTab: (tab: "signin" | "register") => void;
}

export default function AuthView({
  initialTab = "signin",
  onAuthSuccess,
  onToggleTab
}: AuthViewProps) {
  const [tab, setTab] = React.useState<AuthTab>(initialTab);
  
  // Login Inputs
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  
  // Register Inputs
  const [registerEmail, setRegisterEmail] = React.useState("");
  const [registerName, setRegisterName] = React.useState("");
  const [registerPassword, setRegisterPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [registerRole, setRegisterRole] = React.useState<"student" | "teacher">("student");

  // Forgot Password / Reset Inputs
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [resetCode, setResetCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [recoveryCodeReceived, setRecoveryCodeReceived] = React.useState(false);
  const [simulatedCode, setSimulatedCode] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  React.useEffect(() => {
    setTab(initialTab);
    setErrorMsg("");
    setSuccessMsg("");
    setRecoveryCodeReceived(false);
  }, [initialTab]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.login({
        email: loginEmail.trim(),
        password: loginPassword
      });

      setSuccessMsg("Session authenticated. Loading dashboard indices...");
      localStorage.setItem("research_archive_token", res.token);
      
      setTimeout(() => {
        onAuthSuccess(res.user, res.token);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to authenticate session credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerName || !registerPassword) return;

    if (registerPassword.length < 6) {
      setErrorMsg("Password requirement: Must be at least 6 characters.");
      return;
    }

    if (registerPassword !== confirmPassword) {
      setErrorMsg("Password confirmation mismatch. Please retype password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.register({
        email: registerEmail.trim(),
        name: registerName.trim(),
        password: registerPassword,
        role: registerRole
      });

      setSuccessMsg("Account spawned! Dispatching sign-in credentials...");
      localStorage.setItem("research_archive_token", res.token);

      setTimeout(() => {
        onAuthSuccess(res.user, res.token);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Registration sequence failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      if (res.simulated && res.code) {
        setSimulatedCode(res.code);
        setResetCode(res.code); // Pre-fill for ease of use
        setRecoveryCodeReceived(true);
        setSuccessMsg(`Simulated email sent! Access key raised: ${res.code}.`);
      } else {
        setSuccessMsg("Simulation dispatched. If credentials reside in local nodes, reset codes are ready.");
        setRecoveryCodeReceived(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not dispatch reset simulation request.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !resetCode || !newPassword) return;

    if (newPassword.length < 6) {
      setErrorMsg("Password must contain at least 6 letters.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.resetPassword({
        email: forgotEmail.trim(),
        code: resetCode.trim(),
        newPassword
      });
      setSuccessMsg(res.message || "Password updated. Redirecting to login tab...");
      setTimeout(() => {
        setTab("signin");
        setErrorMsg("");
        setSuccessMsg("");
        setForgotEmail("");
        setResetCode("");
        setNewPassword("");
        setRecoveryCodeReceived(false);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not execute password override.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-12 page-transition-enter page-transition-enter-active">
      <div className="rounded-sm border border-stone-200 bg-white p-6 sm:p-8 shadow-3xs space-y-6">
        
        {/* Head Branding Header */}
        <div className="text-center space-y-2 select-none">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-sm bg-brand-500 text-white shadow-xs mb-1">
            <BookOpen className="h-5.5 w-5.5" />
          </div>
          <h2 className="font-display text-lg font-bold text-stone-900">
            {tab === "signin" && "Sign In to Archive"}
            {tab === "register" && "Create Scholar Account"}
            {tab === "forgot" && "Recover Account Keys"}
          </h2>
        </div>

        {/* Tab Triggers */}
        {tab !== "forgot" && (
          <div className="grid grid-cols-2 p-1 bg-stone-50 border border-stone-150 rounded-sm">
            <button
              onClick={() => {
                setTab("signin");
                onToggleTab("signin");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`rounded-sm py-2 text-xs font-semibold font-sans transition-all cursor-pointer ${
                tab === "signin"
                  ? "bg-white text-stone-900 shadow-3xs border border-stone-200"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab("register");
                onToggleTab("register");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`rounded-sm py-2 text-xs font-semibold font-sans transition-all cursor-pointer ${
                tab === "register"
                  ? "bg-white text-stone-900 shadow-3xs border border-stone-200"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Forms box */}
        {tab === "signin" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full rounded-sm border border-stone-300 bg-stone-50/40 pl-10 pr-3 py-2.5 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-sans"
                />
                <Mail className="absolute left-3.5 h-4 w-4 text-stone-450 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                  Security Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab("forgot");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-[10px] font-semibold text-brand-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-sm border border-stone-300 bg-stone-50/40 pl-10 pr-3 py-2.5 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                <KeyRound className="absolute left-3.5 h-4 w-4 text-stone-450 pointer-events-none" />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-sm bg-red-50 p-3 text-red-700 font-semibold text-xs" id="login-error">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 rounded-sm bg-green-50 p-3 text-green-755 font-semibold text-xs" id="login-success">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-green-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-sm bg-brand-500 hover:bg-brand-600 py-3 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer text-center"
            >
              {loading ? "Authenticating session..." : "Verify Credentials"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4" id="register-form">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                Full Display Name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Dr. Sarah Jenkins"
                  className="w-full rounded-sm border border-stone-300 bg-stone-50/40 pl-10 pr-3 py-2.5 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-sans"
                />
                <User className="absolute left-3.5 h-4 w-4 text-stone-450 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full rounded-sm border border-stone-300 bg-stone-50/40 pl-10 pr-3 py-2.5 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-sans"
                />
                <Mail className="absolute left-3.5 h-4 w-4 text-stone-450 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                Security Password
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-sm border border-stone-300 bg-stone-50/40 pl-10 pr-3 py-2.5 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                <KeyRound className="absolute left-3.5 h-4 w-4 text-stone-450 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                Password Confirmation
              </label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype password to confirm"
                  className="w-full rounded-sm border border-stone-300 bg-stone-50/40 pl-10 pr-3 py-2.5 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                <KeyRound className="absolute left-3.5 h-4 w-4 text-stone-450 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                Account Scholar Role
              </label>
              <div className="grid grid-cols-2 gap-3" id="role-select-box">
                <button
                  type="button"
                  onClick={() => setRegisterRole("student")}
                  className={`flex items-center justify-center gap-2 rounded-sm border p-2.5 text-xs font-semibold cursor-pointer select-none transition-all ${
                    registerRole === "student"
                      ? "border-brand-500 bg-brand-50/50 text-brand-800"
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-500"
                  }`}
                >
                  Student Role
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole("teacher")}
                  className={`flex items-center justify-center gap-2 rounded-sm border p-2.5 text-xs font-semibold cursor-pointer select-none transition-all ${
                    registerRole === "teacher"
                      ? "border-brand-500 bg-brand-50/50 text-brand-800"
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-500"
                  }`}
                >
                  Teacher Role
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-sm bg-red-50 p-3 text-red-700 font-semibold text-xs" id="register-error">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 rounded-sm bg-green-50 p-3 text-green-755 font-semibold text-xs" id="register-success">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-green-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-sm bg-brand-500 hover:bg-brand-600 py-3 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
            >
              {loading ? "Registering account node..." : "Create Registered Profile"}
            </button>
          </form>
        )}

        {tab === "forgot" && (
          <div className="space-y-4">
            {!recoveryCodeReceived ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="rounded-sm bg-stone-50 border border-stone-200 p-3 text-[11px] text-stone-700 leading-relaxed font-sans">
                  Provide your email. The platform will query the DB and prompt a <strong>simulation master code</strong> on screen instantly.
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                    Registrant Email
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. researcher@example.com"
                      className="w-full rounded-sm border border-stone-300 bg-stone-50/40 pl-10 pr-3 py-2.5 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-sans"
                    />
                    <Mail className="absolute left-3.5 h-4 w-4 text-stone-450 pointer-events-none" />
                  </div>
                </div>

                {errorMsg && (
                  <div className="rounded-sm bg-red-50 p-3 text-red-700 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTab("signin");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="w-1/3 rounded-sm border border-stone-200 text-stone-700 py-2.5 text-xs font-semibold hover:bg-stone-50 transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-sm bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs py-2.5 transition shadow-xs cursor-pointer"
                  >
                    {loading ? "Rerouting..." : "Request Reset Key"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="rounded-sm bg-green-50 p-3 text-[11px] text-green-755 leading-relaxed font-semibold">
                  {successMsg || "Simulation security key created. Set your new passcode below."}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                    Enter Generated Simulation Code
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Simulated Code (e.g. 583192)"
                      className="w-full rounded-sm border border-stone-300 bg-stone-50/40 pl-10 pr-3 py-2.5 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono tracking-widest font-bold text-center"
                    />
                    <RefreshCw className="absolute left-3.5 h-4 w-4 text-stone-450 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                    New Security Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-sm border border-stone-300 bg-stone-50/40 pl-10 pr-3 py-2.5 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                    <KeyRound className="absolute left-3.5 h-4 w-4 text-stone-450 pointer-events-none" />
                  </div>
                </div>

                {errorMsg && (
                  <div className="rounded-sm bg-red-50 p-3 text-red-700 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="rounded-sm bg-green-50 p-3 text-green-700 text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryCodeReceived(false);
                      setSuccessMsg("");
                      setErrorMsg("");
                    }}
                    className="w-1/3 rounded-sm border border-stone-250 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-sm bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs py-2.5 cursor-pointer"
                  >
                    {loading ? "Replacing..." : "Re-key Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
