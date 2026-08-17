import React, { useState } from 'react';
import { 
  FolderTree, 
  FileCode, 
  Star, 
  GitBranch, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText,
  RotateCcw,
  Search,
  Code2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Lightbulb,
  Cpu
} from 'lucide-react';
import { GitHubRepoData, GitHubFileItem, CodePracticeFinding } from '../types';

interface Props {
  repoData: GitHubRepoData;
  onReset?: () => void;
}

export const GitHubRepoDisplay: React.FC<Props> = ({ repoData, onReset }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'files'>(() => 
    repoData.analysis ? 'analysis' : 'files'
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFile, setSelectedFile] = useState<GitHubFileItem | null>(() => {
    return repoData.files.find(f => f.content) || repoData.files[0] || null;
  });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedFileCode, setCopiedFileCode] = useState(false);

  const filesWithContentCount = repoData.files.filter(f => f.content).length;

  const filteredFiles = repoData.files.filter(f => 
    f.path.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleCopyCode = () => {
    if (!selectedFile?.content) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFileCode(true);
    setTimeout(() => setCopiedFileCode(false), 2000);
  };

  const handleCopySnippet = (snippet: string, index: number) => {
    navigator.clipboard.writeText(snippet);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const analysis = repoData.analysis;

  return (
    <div className="space-y-6 pt-2">
      {/* Repo Header Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <GitBranch className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 font-mono dir-ltr text-left">
              {repoData.owner}/{repoData.repo}
            </h4>
            {repoData.language && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {repoData.language}
              </span>
            )}
            {typeof repoData.stars === 'number' && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>{repoData.stars.toLocaleString()}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 max-w-2xl mt-1">
            {repoData.description}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href={`https://github.com/${repoData.owner}/${repoData.repo}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>فتح في GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>فحص مستودع آخر</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation View Switcher (Analysis report vs Source Code Explorer) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('analysis')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'analysis'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>تقرير التحليل والبدائل الحديثة (Gemini)</span>
          {analysis && analysis.findings.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-mono">
              {analysis.findings.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'files'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderTree className="h-3.5 w-3.5 text-slate-600" />
          <span>مستكشف الملفات والأكواد المصدرية</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-700 font-mono">
            {repoData.files.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Gemini Analysis Report */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {analysis ? (
            <>
              {/* Overall Assessment Box */}
              <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50/70 via-white to-indigo-50/30 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-indigo-900">
                  <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">التقييم العام للمستودع</h4>
                    <span className="text-[11px] text-indigo-600 font-medium">تحليل ذكي لمعايير الجودة والحداثة البرمجية</span>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {analysis.overallAssessment}
                </p>

                {/* Detected Technologies & Coding Practices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-indigo-100/70">
                  {/* Detected Tech */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Cpu className="h-3.5 w-3.5 text-indigo-600" />
                      <span>التقنيات والمكتبات المستخدمة:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.detectedTechnologies?.map((tech, i) => (
                        <span 
                          key={i} 
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium shadow-2xs"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Detected Practices */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Layers className="h-3.5 w-3.5 text-indigo-600" />
                      <span>الأنماط والممارسات المكتشفة:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.detectedPractices?.map((practice, i) => (
                        <span 
                          key={i} 
                          className="px-2.5 py-1 rounded-lg bg-indigo-50/80 border border-indigo-200/80 text-indigo-900 text-xs font-medium"
                        >
                          {practice}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Outdated / Improvable Practices Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      الممارسات البرمجية المكتشفة والبدائل الحديثة المقترحة
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {analysis.findings.length} ممارسات مرصودة
                  </span>
                </div>

                {analysis.findings && analysis.findings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {analysis.findings.map((item: CodePracticeFinding, idx: number) => (
                      <div 
                        key={idx} 
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-colors space-y-4"
                      >
                        {/* Header: Current Usage vs Modern Alternative */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-500">الممارسة الحالية:</span>
                            <span className="text-xs font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">
                              {item.currentUsage}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 self-start sm:self-auto">
                            <span className="text-[11px] font-semibold text-emerald-700">البديل الحديث:</span>
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <ArrowUpRight className="h-3 w-3" />
                              {item.modernAlternative}
                            </span>
                          </div>
                        </div>

                        {/* Reason Outdated */}
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-700 block">
                            لماذا تعد هذه الممارسة قديمة أو غير موصى بها؟
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.reasonOutdated}
                          </p>
                        </div>

                        {/* Improvement Code Example */}
                        {item.improvementExample && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                                <Lightbulb className="h-3.5 w-3.5" />
                                <span>مثال التحسين والتطبيق الحديث:</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopySnippet(item.improvementExample, idx)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-600">تم النسخ</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>نسخ المثال</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="rounded-lg bg-slate-900 text-slate-100 p-3.5 font-mono text-xs overflow-x-auto dir-ltr text-left">
                              <pre className="whitespace-pre text-slate-200 text-[11.5px] leading-relaxed">
                                <code>{item.improvementExample}</code>
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                    <h5 className="text-sm font-bold text-emerald-900">كود حديث ومتوافق مع أفضل المعايير!</h5>
                    <p className="text-xs text-emerald-700 max-w-md mx-auto">
                      لم يتم رصد ممارسات برمجية قديمة أو مكتبات مهجورة في العينات المصدرية المفحوصة.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              لم يتم استلام تقرير تحليل الذكاء الاصطناعي للمستودع.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: File Structure and Source Code Viewer */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {/* Stats and Info Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">إجمالي ملفات المستودع</span>
              <span className="text-base font-bold text-slate-900">{repoData.files.length} ملف</span>
            </div>
            <div className="rounded-xl bg-indigo-50/50 p-3 border border-indigo-100">
              <span className="text-[11px] font-semibold text-indigo-700 block mb-0.5">الملفات المحملة للقراءة</span>
              <span className="text-base font-bold text-indigo-950">{filesWithContentCount} ملفات مصدرية</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">الفرع الافتراضي</span>
              <span className="text-base font-bold text-slate-900 font-mono text-xs">{repoData.defaultBranch || 'main'}</span>
            </div>
          </div>

          {/* Main File Explorer and Code Content Viewer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: File Tree / File List (4 Cols on lg) */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="p-3 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <FolderTree className="h-4 w-4 text-indigo-600" />
                    <span>هيكل ملفات المستودع ({filteredFiles.length})</span>
                  </div>
                </div>

                {/* Search Filter */}
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    dir="ltr"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="تصفية الملفات..."
                    className="w-full pl-2 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-left"
                  />
                </div>
              </div>

              <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100">
                {filteredFiles.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    لا توجد ملفات تطابق كلمة البحث
                  </div>
                ) : (
                  filteredFiles.map((file) => {
                    const isSelected = selectedFile?.path === file.path;
                    const hasContent = !!file.content;

                    return (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setSelectedFile(file)}
                        className={`w-full text-left p-2.5 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer dir-ltr ${
                          isSelected
                            ? 'bg-indigo-50/90 text-indigo-900 font-semibold border-r-2 border-r-indigo-600'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {hasContent ? (
                            <FileCode className={`h-4 w-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                          ) : (
                            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <span className="truncate font-mono text-[11px]" title={file.path}>
                            {file.path}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasContent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium font-sans">
                              متاح
                            </span>
                          )}
                          {file.size && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatFileSize(file.size)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Code Viewer (8 Cols on lg) */}
            <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 overflow-hidden shadow-2xs">
              {/* Code Viewer Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <Code2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="text-xs font-mono font-medium text-slate-300 truncate dir-ltr text-left" title={selectedFile?.path}>
                    {selectedFile ? selectedFile.path : 'لم يتم تحديد ملف'}
                  </span>
                  {selectedFile?.size && (
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  )}
                </div>

                {selectedFile?.content && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {copiedFileCode ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 text-[11px]">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span className="text-[11px]">نسخ الكود</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Code Content Area */}
              <div className="p-4 max-h-[460px] overflow-auto font-mono text-xs leading-relaxed dir-ltr text-left">
                {selectedFile ? (
                  selectedFile.content ? (
                    <pre className="text-slate-200 whitespace-pre font-mono text-[12px]">
                      <code>{selectedFile.content}</code>
                    </pre>
                  ) : (
                    <div className="py-12 text-center text-slate-400 space-y-2 dir-rtl">
                      <FileText className="h-8 w-8 mx-auto text-slate-500 mb-2" />
                      <p className="text-xs font-medium text-slate-300">
                        هذا الملف ضمن هيكل المستودع لكن لم يتم تحميل محتواه في العينة المصدرية.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        يمكنك تصفح الملفات المصدرية المحددة بعلامة "متاح" في القائمة لقراءة الكود.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    اختر ملفاً من القائمة الجانبية لعرض محتواه البرمجي
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
