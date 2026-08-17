import React, { useState } from 'react';
import { Header } from './components/Header';
import { CurriculumRadar } from './components/CurriculumRadar';
import { GitHubRadar } from './components/GitHubRadar';
import { ActiveRadar } from './types';
import { BookOpen, GitBranch, Target, Lightbulb, Compass } from 'lucide-react';

export default function App() {
  const [activeRadar, setActiveRadar] = useState<ActiveRadar>('curriculum');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900" dir="rtl">
      {/* Top Header & Navigation */}
      <Header activeRadar={activeRadar} onSelectRadar={setActiveRadar} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Compass className="h-3.5 w-3.5" />
                <span>منصة محاذاة للتعليم والابتكار التقني</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                سد الفجوة بين قاعات الدراسة وسوق العمل البرمجي
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                اختر نوع الرادار المناسب للبدء: فحص السلايدات الأكاديمية لمعرفة الأدوات الحديثة الموازية، أو فحص مستودع برمجي لفهم أسسه النظرية.
              </p>
            </div>

            {/* Quick Switcher Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
              <button
                type="button"
                id="hero-switch-to-curriculum"
                onClick={() => setActiveRadar('curriculum')}
                className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between gap-3 ${
                  activeRadar === 'curriculum'
                    ? 'bg-white/15 border-emerald-400/80 text-white ring-1 ring-emerald-400/40'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-400">القسم الأول</span>
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="font-bold text-sm">رادار المنهج الدراسي</div>
              </button>

              <button
                type="button"
                id="hero-switch-to-github"
                onClick={() => setActiveRadar('github')}
                className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between gap-3 ${
                  activeRadar === 'github'
                    ? 'bg-white/15 border-indigo-400/80 text-white ring-1 ring-indigo-400/40'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-indigo-400">القسم الثاني</span>
                  <GitBranch className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="font-bold text-sm">رادار جيت هب</div>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Section Rendering */}
        <section id="active-radar-section" aria-live="polite">
          {activeRadar === 'curriculum' ? <CurriculumRadar /> : <GitHubRadar />}
        </section>

        {/* Academic Context & Guidance */}
        <section className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">الرؤية الأكاديمية لمنصة محاذاة</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                تهدف محاذاة إلى تزويد طلاب علوم الحاسب وهندسة البرمجيات بالبوصلة اللازمة لتحويل المفاهيم النظرية المجردة إلى مهارات تطبيقية تنافسية تلائم متطلبات التوظيف المعاصرة.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">تطوير مستمر وسهولة في التوسعة</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                تم بناء الهيكل البرمجي ليكون خفيفاً وسهل التعديل والربط المستقبلي مع محركات الذكاء الاصطناعي (Gemini API) وواجهات برمجية خارجية دون تعقيد إضافي.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 font-medium">
            منصة محاذاة (Muhazah) © {new Date().getFullYear()} - تمكين طلاب التقنية وعلوم الحاسب
          </p>
          <div className="mt-2 sm:mt-0 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>واجهة عربية أصيلة (RTL)</span>
            <span>•</span>
            <span>بنية معمارية خفيفة وقابلة للتطوير</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
