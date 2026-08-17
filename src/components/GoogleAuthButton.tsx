import React, { useState, useEffect } from 'react';
import { LogOut, User as UserIcon, Loader2, HardDrive } from 'lucide-react';
import { googleSignIn, googleSignOut, initAuth, getAccessToken } from '../services/firebaseAuth';
import { User } from 'firebase/auth';

interface Props {
  onUserChange?: (user: User | null, token: string | null) => void;
}

export const GoogleAuthButton: React.FC<Props> = ({ onUserChange }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        if (onUserChange) onUserChange(user, token);
      },
      () => {
        setCurrentUser(null);
        if (onUserChange) onUserChange(null, null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        if (onUserChange) onUserChange(result.user, result.accessToken);
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await googleSignOut();
      setCurrentUser(null);
      if (onUserChange) onUserChange(null, null);
    } catch (err) {
      console.error('Sign Out failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser) {
    return (
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-xl text-xs font-medium">
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName || 'User'}
            className="w-6 h-6 rounded-full object-cover border border-slate-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
            {currentUser.displayName ? currentUser.displayName[0] : <UserIcon className="w-3.5 h-3.5" />}
          </div>
        )}

        <div className="hidden sm:block text-right">
          <div className="font-bold text-slate-800 text-[11px] truncate max-w-[120px]">
            {currentUser.displayName || 'مستخدم Google'}
          </div>
          <div className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
            <HardDrive className="w-2.5 h-2.5" />
            <span>Drive متصل</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isLoading}
          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer mr-1"
          title="تسجيل الخروج من Google"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      id="google-drive-auth-btn"
      onClick={handleSignIn}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
      title="ربط حساب Google Drive لاستيراد السلايدات وحفظ التقارير"
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
      ) : (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
      )}
      <span className="hidden sm:inline">ربط Google Drive</span>
      <span className="sm:hidden">Drive</span>
    </button>
  );
};
