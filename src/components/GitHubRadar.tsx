import React, { useState } from 'react';
import { GitBranch, Globe, ArrowLeft, AlertCircle, ExternalLink, X, Loader2 } from 'lucide-react';
import { EmptyResultPlaceholder } from './EmptyResultPlaceholder';
import { GitHubRepoDisplay } from './GitHubRepoDisplay';
import { GitHubRepoData } from '../types';
import { parseGitHubRepoUrl, fetchGitHubRepoData } from '../utils/githubService';

export const GitHubRadar: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [repoData, setRepoData] = useState<GitHubRepoData | null>(null);

  // Sample real repositories for quick test convenience
  const sampleRepos = [
    { name: 'fastapi/fastapi', label: 'FastAPI (Python)' },
    { name: 'facebook/react', label: 'React (JavaScript)' },
    { name: 'expressjs/express', label: 'Express.js (Node.js)' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
    setErrorMessage(null);
  };

  const handleSelectSample = (sampleName: string) => {
    setRepoUrl(`https://github.com/${sampleName}`);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setRepoUrl('');
    setErrorMessage(null);
    setRepoData(null);
  };

  const handleAnalyze = async () => {
    const trimmed = repoUrl.trim();
    if (!trimmed) {
      setErrorMessage('يرجى إدخال رابط مستودع GitHub أولاً.');
      return;
    }

    const parsed = parseGitHubRepoUrl(trimmed);
    if (!parsed) {
      setErrorMessage('صيغة الرابط غير صحيحة. يرجى إدخال رابط بصيغة: https://github.com/owner/repository أو owner/repository');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setProgressMessage('جاري الاتصال بـ GitHub API وقراءة الملفات المصدرية...');

    try {
      const data = await fetchGitHubRepoData(parsed.owner, parsed.repo, (msg) => {
        setProgressMessage(msg);
      });

      // Step 2: Send collected files & repo structure to Gemini for code analysis
      setProgressMessage('جاري تحليل الكود والممارسات البرمجية واكتشاف البدائل الحديثة عبر Gemini...');

      const response = await fetch('/api/analyze-github-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: data.owner,
          repo: data.repo,
          description: data.description,
          language: data.language,
          files: data.files,
        }),
      });

      if (!response.ok) {
        let errText = 'فشل في تحليل المستودع بواسطة الذكاء الاصطناعي.';
        try {
          const errData = await response.json();
          if (errData?.error) errText = errData.error;
        } catch {
          // fallback to status text
        }
        throw new Error(errText);
      }

      const resJson = await response.json();
      if (resJson.analysis) {
        data.analysis = resJson.analysis;
      }

      setRepoData(data);
    } catch (err: any) {
      console.error('Error analyzing GitHub repository:', err);
      setErrorMessage(err?.message || 'حدث خطأ أثناء معالجة وتحليل المستودع.');
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <h2 className="text-xl font-bold text-slate-900">رادار جيت هب (GitHub Radar)</h2>
            </div>
            <p className="text-sm text-slate-600">
              أدخل رابط أي مستودع برمجي على GitHub لاستعراض هيكل الملفات وقراءة الأكواد المصدرية والمكتبات المستخدمة.
            </p>
          </div>
        </div>
      </div>

      {/* URL Input Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-4">
          <div>
            <label htmlFor="github-repo-url-input" className="block text-sm font-bold text-slate-900 mb-2">
              رابط مستودع GitHub
            </label>
            <div className="relative rounded-xl shadow-2xs">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <Globe className="h-5 w-5" />
              </div>
              <input
                id="github-repo-url-input"
                type="url"
                dir="ltr"
                value={repoUrl}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="https://github.com/username/repository"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3.5 pr-11 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-mono transition-colors text-left disabled:opacity-60"
              />
              {repoUrl && (
                <button
                  type="button"
                  id="clear-github-url-btn"
                  disabled={isLoading}
                  onClick={handleClear}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="مسح الرابط"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick sample repository pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">أمثلة سريعة للتجربة:</span>
            {sampleRepos.map((sample) => (
              <button
                key={sample.name}
                type="button"
                id={`sample-repo-${sample.name.replace('/', '-')}`}
                disabled={isLoading}
                onClick={() => handleSelectSample(sample.name)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <GitBranch className="h-3 w-3" />
                <span>{sample.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="github-error-alert"
            className="mt-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>جلب ملفات المستودع، شجرة الأكواد، وقراءة الملفات المصدرية مباشرة عبر GitHub REST API.</span>
          </div>

          <button
            id="analyze-repo-btn"
            type="button"
            onClick={handleAnalyze}
            disabled={!repoUrl.trim() || isLoading}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm ${
              repoUrl.trim() && !isLoading
                ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/50'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>{progressMessage || 'جاري جلب ملفات المستودع من GitHub...'}</span>
              </>
            ) : (
              <>
                <span>تحليل المستودع</span>
                <ArrowLeft className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">محتويات وملفات المستودع</h3>
          <span className="text-xs font-medium text-slate-400">
            {repoData ? `GitHub API (${repoData.owner}/${repoData.repo})` : 'قسم الفحص البرمجي'}
          </span>
        </div>

        {repoData ? (
          <GitHubRepoDisplay
            repoData={repoData}
            onReset={handleClear}
          />
        ) : (
          <EmptyResultPlaceholder type="github" hasInput={!!repoUrl.trim()} />
        )}
      </div>
    </div>
  );
};

