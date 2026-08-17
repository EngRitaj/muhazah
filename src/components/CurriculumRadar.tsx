import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, X, AlertCircle, ArrowLeft, Loader2, HardDrive } from 'lucide-react';
import { EmptyResultPlaceholder } from './EmptyResultPlaceholder';
import { CurriculumAnalysisDisplay } from './CurriculumAnalysisDisplay';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { UploadedFileState, CurriculumAnalysisResult } from '../types';
import { initAuth } from '../services/firebaseAuth';
import { User } from 'firebase/auth';

export const CurriculumRadar: React.FC = () => {
  const [fileState, setFileState] = useState<UploadedFileState>({
    file: null,
    name: '',
    size: 0,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<CurriculumAnalysisResult | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => unsub();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFile = (file: File) => {
    setErrorMessage(null);
    setAnalysisResult(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('يرجى اختيار ملف بصيغة PDF فقط (سلايدات أو عروض المقررات الدراسية).');
      return;
    }

    // Limit check (e.g. 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('حجم الملف كبير جداً، يرجى اختيار ملف بحجم أقل من 50 ميجابايت.');
      return;
    }

    setFileState({
      file,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFileState({
      file: null,
      name: '',
      size: 0,
    });
    setErrorMessage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = () => {
    if (!fileState.file) {
      setErrorMessage('يرجى رفع ملف السلايدات (PDF) أولاً قبل بدء التحليل.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result as string;
        const base64Data = result.split(',')[1] || result;

        const response = await fetch('/api/analyze-curriculum', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            pdfBase64: base64Data,
            fileName: fileState.name,
          }),
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error('Non-JSON server response:', textResponse);
          throw new Error('حدث خطأ في استجابة الخادم أثناء معالجة الملف.');
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'فشلت معالجة الملف عبر Gemini، يرجى المحاولة مرة أخرى.');
        }

        if (!data.analysis) {
          throw new Error('لم يتم استلام نتيجة تحليل صالحة من نموذج Gemini.');
        }

        setAnalysisResult(data.analysis);
      } catch (err: any) {
        console.error('Error analyzing PDF with Gemini:', err);
        setErrorMessage(
          err?.message || 'حدث خطأ أثناء معالجة ملف PDF وتحليله.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      setErrorMessage('تعذر قراءة ملف الـ PDF من المتصفح.');
    };

    reader.readAsDataURL(fileState.file);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-xl font-bold text-slate-900">رادار المنهج الدراسي (Curriculum Radar)</h2>
            </div>
            <p className="text-sm text-slate-600">
              قم برفع سلايدات أو ملخص المادة الأكاديمية (ملف PDF) لاكتشاف التقنيات الحديثة المقابلة في سوق العمل.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <input
          ref={fileInputRef}
          id="curriculum-pdf-upload-input"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        {!fileState.file ? (
          <div
            id="curriculum-dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/70'
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 shadow-xs">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              اسحب وأفلت ملف السلايدات (PDF) هنا، أو انقر للتصفح
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              يدعم ملفات العروض التقديمية والملخصات بصيغة PDF حتى حجم 50 ميجابايت
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                id="browse-pdf-button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>اختيار ملف PDF من الجهاز</span>
              </button>

              <button
                type="button"
                id="drive-import-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDriveModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <HardDrive className="h-4 w-4 text-amber-700" />
                <span>استيراد من Google Drive</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 bg-slate-50/80 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 truncate max-w-md" title={fileState.name}>
                    {fileState.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    الحجم: {formatFileSize(fileState.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  id="change-file-button"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                >
                  تغيير الملف
                </button>
                <button
                  type="button"
                  id="remove-file-button"
                  disabled={isLoading}
                  onClick={handleRemoveFile}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="حذف الملف"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="curriculum-error-alert"
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
            <span>التحليل يشمل: استخراج المفاهيم الأكاديمية، مقارنة السوق، وتوصيات المهارات.</span>
          </div>

          <button
            id="analyze-pdf-btn"
            type="button"
            disabled={!fileState.file || isLoading}
            onClick={handleAnalyze}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm ${
              fileState.file && !isLoading
                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/50'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>جاري قراءة وتحليل السلايدات بواسطة Gemini...</span>
              </>
            ) : (
              <>
                <span>تحليل العرض التقديمي (PDF)</span>
                <ArrowLeft className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">نتائج تحليل المنهج</h3>
          <span className="text-xs font-medium text-slate-400">
            {analysisResult ? 'تم التحليل بواسطة Gemini' : 'قسم التحليل الآلي'}
          </span>
        </div>

        {analysisResult ? (
          <CurriculumAnalysisDisplay
            analysis={analysisResult}
            fileName={fileState.name}
            onReset={handleRemoveFile}
          />
        ) : (
          <EmptyResultPlaceholder type="curriculum" hasInput={!!fileState.file} />
        )}
      </div>

      {/* Google Drive Import Modal */}
      <GoogleDrivePickerModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => setCurrentUser(user)}
        onSelectFile={(file) => {
          handleFile(file);
        }}
      />
    </div>
  );
};
