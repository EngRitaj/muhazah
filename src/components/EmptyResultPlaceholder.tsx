import React from 'react';
import { Sparkles, Layers, Cpu, CheckCircle2 } from 'lucide-react';

interface EmptyResultPlaceholderProps {
  type: 'curriculum' | 'github';
  hasInput: boolean;
}

export const EmptyResultPlaceholder: React.FC<EmptyResultPlaceholderProps> = ({
  type,
  hasInput,
}) => {
  const isCurriculum = type === 'curriculum';

  return (
    <div
      id={`${type}-results-placeholder-container`}
      className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 sm:p-8 text-center transition-all"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 text-slate-700 mb-4">
        <Sparkles className="h-7 w-7 text-emerald-600" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2">
        {hasInput
          ? 'مساحة نتائج التحليل (جاهزة لبدء المعالجة)'
          : 'منطقة نتائج التحليل الذكي المستقبلي'}
      </h3>

      <p className="text-sm text-slate-600 max-w-xl mx-auto mb-6 leading-relaxed">
        {isCurriculum
          ? 'عند تشغيل التحليل، ستقوم المنصة بفحص المفاهيم الأكاديمية ومقارنتها بأحدث المكتبات والممارسات في بيئات العمل الحقيقية وتحديد الفجوات المهنية.'
          : 'عند تشغيل التحليل، ستقوم المنصة بربط الكود والمكتبات المستخدمة في المستودع بالمفاهيم النظرية المقابلة لها في المقررات الجامعية.'}
      </p>

      {/* Structured preview of upcoming analytical categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto text-right">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5 text-slate-900 font-semibold text-sm">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>{isCurriculum ? 'مواءمة المفاهيم' : 'المفاهيم النظرية المقترنة'}</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isCurriculum
              ? 'استخراج الموضوعات النظرية ومطابقتها مع التقنيات السائدة.'
              : 'تحديد الخوارزميات وأنماط التصميم المطبقة في المشروع.'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5 text-slate-900 font-semibold text-sm">
            <Cpu className="h-4 w-4 text-indigo-600" />
            <span>{isCurriculum ? 'أدوات السوق الحديثة' : 'المكدس التقني والمكتبات'}</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isCurriculum
              ? 'اقتراح أطر العمل والأدوات المعاصرة المعتمدة في الشركات.'
              : 'فحص الحزم البرمجية وبنية الملفات ومستويات الأمان.'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5 text-slate-900 font-semibold text-sm">
            <CheckCircle2 className="h-4 w-4 text-amber-600" />
            <span>{isCurriculum ? 'خطة سد الفجوة' : 'توصيات التطوير والتطبيق'}</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isCurriculum
              ? 'توصيات عملية ومشاريع مقترحة للطالب لتعزيز جاهزيته الوظيفية.'
              : 'خطوات لإعادة صياغة الكود أو ربطه بمشاريع التخرج والمقررات.'}
          </p>
        </div>
      </div>

      <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <span className="h-2 w-2 rounded-full bg-slate-300"></span>
        <span>بانتظار تفعيل نموذج الذكاء الاصطناعي للتحليل الفوري</span>
      </div>
    </div>
  );
};
