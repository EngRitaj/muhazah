import React from 'react';
import { Compass, BookOpen, GitBranch } from 'lucide-react';
import { ActiveRadar } from '../types';
import { GoogleAuthButton } from './GoogleAuthButton';

interface HeaderProps {
  activeRadar: ActiveRadar;
  onSelectRadar: (radar: ActiveRadar) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeRadar, onSelectRadar }) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Compass className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  محاذاة
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  نسخة أولية MVP
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                مواءمة المناهج الجامعية لعلوم الحاسب مع أحدث ممارسات سوق العمل التقني
              </p>
            </div>
          </div>

          {/* Navigation & Auth */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Radar Navigation Tabs */}
            <nav className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200" aria-label="أقسام الرادار">
              <button
                id="curriculum-radar-tab-btn"
                type="button"
                onClick={() => onSelectRadar('curriculum')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeRadar === 'curriculum'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <BookOpen className={`h-4 w-4 ${activeRadar === 'curriculum' ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span>رادار المنهج الدراسي</span>
              </button>

              <button
                id="github-radar-tab-btn"
                type="button"
                onClick={() => onSelectRadar('github')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeRadar === 'github'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <GitBranch className={`h-4 w-4 ${activeRadar === 'github' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span>رادار جيت هب</span>
              </button>
            </nav>

            {/* Google Drive Auth Button */}
            <GoogleAuthButton />
          </div>

        </div>
      </div>
    </header>
  );
};
