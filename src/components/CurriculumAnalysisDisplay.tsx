import React, { useState } from 'react';
import { 
  BookOpen, 
  Briefcase, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  RotateCcw,
  FileText,
  HardDrive,
  Loader2,
  ExternalLink,
  Check
} from 'lucide-react';
import { CurriculumAnalysisResult } from '../types';
import { uploadReportToDrive } from '../services/googleDrive';
import { getAccessToken, googleSignIn } from '../services/firebaseAuth';

interface Props {
  analysis: CurriculumAnalysisResult;
  fileName?: string;
  onReset?: () => void;
}

export const CurriculumAnalysisDisplay: React.FC<Props> = ({
  analysis,
  fileName,
  onReset,
}) => {
  const {
    conceptTitle,
    academicOverview,
    industryRelevance,
    modernAlternativesAndTools,
    practicalProject,
  } = analysis;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [saveSuccessLink, setSaveSuccessLink] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const generateMarkdownReport = (): string => {
    return `# تقرير محاذاة المنهج الأكاديمي: ${conceptTitle}
**تاريخ التحليل:** ${new Date().toLocaleDateString('ar-SA')}
**المستند المصدر:** ${fileName || 'سلايدات غير محددة'}

---

## 1. الملخص الأكاديمي للمحتوى
${academicOverview}

---

## 2. واقع المفهوم في سوق العمل التقني
- **حالة الاستخدام:** ${industryRelevance.isUsedInIndustry ? 'مستخدم ومعتمد حالياً في الصناعة' : 'أكاديمي / استُبدل بأدوات حديثة'}
- **الخلاصة:** ${industryRelevance.statusSummary}
- **أهمية المفهوم والربط بالصناعة:** ${industryRelevance.whyItMatters}

---

## 3. التقنيات والأدوات الحديثة المرتبطة
${(modernAlternativesAndTools || []).map(t => `- **${t.name}** (${t.category}): ${t.description}`).join('\n')}

---

## 4. مقترح مشروع عملي لتطبيق المفهوم
### ${practicalProject?.title || ''}
${practicalProject?.description || ''}

**المكدس التقني المقترح:**
${(practicalProject?.suggestedStack || []).map(s => `- ${s}`).join('\n')}

**المخرجات التعليمية والمهارات:**
${(practicalProject?.learningOutcomes || []).map(o => `- ${o}`).join('\n')}

---
*تم إنشاء هذا التقرير آلياً عبر منصة محاذاة (Muhazah)*
`;
  };

  const handleConfirmSaveToDrive = async () => {
    setIsSavingToDrive(true);
    setSaveError(null);
    setSaveSuccessLink(null);

    try {
      let token = getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        if (!authRes?.accessToken) {
          throw new Error('يرجى تسجيل الدخول إلى Google Drive للمتابعة.');
        }
        token = authRes.accessToken;
      }

      const reportFileName = `تقرير محاذاة - ${conceptTitle.replace(/[\/\\:*?"<>|]/g, '_')}.md`;
      const markdownContent = generateMarkdownReport();

      const result = await uploadReportToDrive(token, reportFileName, markdownContent);
      setSaveSuccessLink(result.webViewLink || 'https://drive.google.com');
      setShowConfirmModal(false);
    } catch (err: any) {
      setSaveError(err?.message || 'فشل حفظ التقرير في Google Drive.');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* File & Main Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">{conceptTitle}</h4>
            {fileName && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <FileText className="h-3 w-3" />
                <span>المستند المحلل: {fileName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {saveSuccessLink ? (
            <a
              href={saveSuccessLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>تم الحفظ في Drive</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <button
              type="button"
              id="export-to-drive-btn"
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-900 transition-colors cursor-pointer"
              title="حفظ تقرير التحليل في Google Drive"
            >
              <HardDrive className="h-3.5 w-3.5 text-amber-700" />
              <span>حفظ في Google Drive</span>
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>تحليل ملف آخر</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Google Drive File Creation */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <HardDrive className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  تأكيد حفظ التقرير في Google Drive
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  سيتم إنشاء ملف تقرير بصيغة Markdown (.md) في حساب Google Drive الخاص بك باسم:
                </p>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 break-all">
                  تقرير محاذاة - {conceptTitle}.md
                </div>
              </div>
            </div>

            {saveError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {saveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSavingToDrive}
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSavingToDrive}
                onClick={handleConfirmSaveToDrive}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {isSavingToDrive ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>جاري الحفظ في Drive...</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>تأكيد الحفظ في Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Academic Overview */}
      <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-200/80">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-4 w-4 text-slate-700" />
          <h5 className="text-sm font-bold text-slate-900">الملخص الأكاديمي للمحتوى</h5>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {academicOverview}
        </p>
      </div>

      {/* 2. Industry Relevance */}
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4 text-emerald-600" />
          <h5 className="text-sm font-bold text-slate-900">واقع المفهوم في سوق العمل التقني</h5>
          <span
            className={`mr-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              industryRelevance.isUsedInIndustry
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {industryRelevance.isUsedInIndustry ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                <span>مستخدم ومعتمد حالياً</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" />
                <span>أكاديمي / استُبدل بأدوات حديثة</span>
              </>
            )}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-900 mb-2">
          {industryRelevance.statusSummary}
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          {industryRelevance.whyItMatters}
        </p>
      </div>

      {/* 3. Modern Alternatives & Industry Stack */}
      {modernAlternativesAndTools && modernAlternativesAndTools.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-700" />
            <h5 className="text-sm font-bold text-slate-900">التقنيات والأدوات الحديثة المرتبطة</h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modernAlternativesAndTools.map((tool, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-bold text-slate-900">{tool.name}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {tool.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Practical Project Suggestion */}
      {practicalProject && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="flex items-center gap-2 mb-2 text-emerald-800">
            <Sparkles className="h-4 w-4" />
            <h5 className="text-sm font-bold">فكرة مشروع عملي لتطبيق المفهوم في سوق العمل</h5>
          </div>
          
          <h6 className="text-sm font-bold text-slate-900 mb-1">
            {practicalProject.title}
          </h6>
          <p className="text-xs text-slate-700 leading-relaxed mb-3">
            {practicalProject.description}
          </p>

          {practicalProject.suggestedStack && practicalProject.suggestedStack.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-bold text-slate-800 block mb-1.5">
                المكدس التقني المقترح:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {practicalProject.suggestedStack.map((tech, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-emerald-900 shadow-2xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {practicalProject.learningOutcomes && practicalProject.learningOutcomes.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-1">
                المخرجات والمهارات المكتسبة:
              </span>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                {practicalProject.learningOutcomes.map((outcome, i) => (
                  <li key={i}>{outcome}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

