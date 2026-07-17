import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { Wallet, Coins, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginStart: () => void;
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginStart, onLoginSuccess }: LoginScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    onLoginStart();
    try {
      await signInWithPopup(auth, googleAuthProvider);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('লগ-ইন উইন্ডোটি বন্ধ করা হয়েছে। পুনরায় চেষ্টা করুন।');
      } else {
        setError('লগ-ইন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#2D2D2A] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-[#5A5A40] text-[#F5F5F0] shadow-md shadow-[#5A5A40]/10 mb-6">
          <Wallet size={40} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-[#5A5A40] tracking-tight">
          দৈনিক খরচ ট্র্যাকার
        </h2>
        <p className="mt-3 text-sm text-[#8A8A7A] italic font-medium">
          Daily Expense Tracker
        </p>
        <p className="mt-1 text-xs text-[#8A8A7A] max-w-xs mx-auto">
          আপনার প্রতিদিনের আয় ও ব্যয়ের হিসাব রাখুন সহজে এবং নিরাপদে
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-[#E5E5DF] sm:rounded-[32px] sm:px-10">
          <div className="space-y-6">
            <div className="bg-[#F9F9F5] rounded-2xl p-4 border border-[#E5E5DF]">
              <h3 className="text-xs font-semibold text-[#5A5A40] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
                <Coins size={14} /> ফিচারসমূহ
              </h3>
              <ul className="text-xs text-[#8A8A7A] space-y-2 font-medium">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]" />
                  প্রতিদিনের খরচ এবং আয়ের বিবরণী
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]" />
                  ক্যাটাগরি ভিত্তিক সহজ বিশ্লেষণ ও চার্ট
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]" />
                  সম্পূর্ণ ডাটাবেস ব্যাকআপ ও ক্লাউড সিঙ্ক
                </li>
              </ul>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 flex items-start gap-3">
                <AlertCircle className="text-[#5A5A40] shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            )}

            <div>
              <button
                id="google-login-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-[#E5E5DF] rounded-2xl shadow-sm bg-white hover:bg-[#F5F5F0] text-[#2D2D2A] font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.143 4.114-3.415 0-6.185-2.77-6.185-6.185 0-3.415 2.77-6.185 6.185-6.185 1.506 0 2.87.549 3.935 1.455l3.111-3.11C18.914 1.838 15.82 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.897 0 10.866-4.246 10.866-11.24 0-.668-.063-1.31-.18-1.955H12.24z"
                    />
                  </svg>
                )}
                <span>গুগল অ্যাকাউন্ট দিয়ে লগ-ইন করুন</span>
              </button>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-[#8A8A7A] font-medium">
          সুরক্ষিত ক্লাউড ডাটাবেস দ্বারা চালিত
        </p>
      </div>
    </div>
  );
}
