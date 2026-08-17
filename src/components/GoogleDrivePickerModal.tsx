import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  Loader2, 
  AlertCircle, 
  HardDrive, 
  RefreshCw, 
  DownloadCloud, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { DriveFileItem } from '../types';
import { listDrivePdfFiles, downloadDrivePdfAsFile } from '../services/googleDrive';
import { googleSignIn, getAccessToken } from '../services/firebaseAuth';
import { User } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: File) => void;
  currentUser: User | null;
  onAuthSuccess: (user: User, token: string) => void;
}

export const GoogleDrivePickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectFile,
  currentUser,
  onAuthSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const fetchFiles = async (token: string, search = '') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const driveFiles = await listDrivePdfFiles(token, search);
      setFiles(driveFiles);
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر تحميل الملفات من Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const token = getAccessToken();
      if (token) {
        fetchFiles(token, searchQuery);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
        await fetchFiles(result.accessToken);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل تسجيل الدخول إلى Google Drive.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (token) {
      fetchFiles(token, searchQuery);
    }
  };

  const handleSelectDriveFile = async (item: DriveFileItem) => {
    const token = getAccessToken();
    if (!token) {
      setErrorMessage('يرجى تسجيل الدخول إلى Google أولاً.');
      return;
    }

    setIsDownloadingId(item.id);
    setErrorMessage(null);
    try {
      const file = await downloadDrivePdfAsFile(token, item.id, item.name);
      onSelectFile(file);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل تحميل ملف الـ PDF من Google Drive.');
    } finally {
      setIsDownloadingId(null);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const token = getAccessToken();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                استيراد سلايدات من Google Drive
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                تصفح واختر ملف PDF مباشرة من حسابك للتحليل بواسطة الذكاء الاصطناعي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!token ? (
            /* Auth Required State */
            <div className="py-12 px-4 text-center space-y-4 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
                <HardDrive className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">
                  ربط الحساب بـ Google Drive
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  قم بتسجيل الدخول بحساب Google للوصول إلى ملفات السلايدات والمقررات المخزنة في Drive واستيرادها بضغطة واحدة.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all cursor-pointer hover:border-slate-400 active:scale-[0.98]"
                >
                  {isSigningIn ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  )}
                  <span>تسجيل الدخول والموافقة على الوصول لـ Google Drive</span>
                </button>
              </div>
            </div>
          ) : (
            /* Authenticated: Search & File Browser */
            <div className="space-y-4">
              {/* Search & Refresh Bar */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في ملفات الـ PDF في Google Drive..."
                    className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  بحث
                </button>
                <button
                  type="button"
                  onClick={() => fetchFiles(token, searchQuery)}
                  disabled={isLoading}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title="تحديث القائمة"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
              </form>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Files List */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[340px] overflow-y-auto bg-slate-50/50">
                {isLoading ? (
                  <div className="py-12 text-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">جاري جلب ملفات الـ PDF من حسابك...</p>
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <FileText className="h-8 w-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">لم يتم العثور على ملفات PDF</p>
                    <p className="text-[11px] text-slate-500">
                      تأكد من وجود ملفات سلايدات أو مستندات بصيغة PDF في Google Drive.
                    </p>
                  </div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-white transition-colors bg-white/70"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 font-bold text-[10px]">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                            {file.name}
                          </h5>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-sans">
                            {file.size && <span>{formatFileSize(file.size)}</span>}
                            {file.size && file.modifiedTime && <span>•</span>}
                            {file.modifiedTime && <span>{formatDate(file.modifiedTime)}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="فتح في Google Drive"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          disabled={!!isDownloadingId}
                          onClick={() => handleSelectDriveFile(file)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          {isDownloadingId === file.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>جاري الاستيراد...</span>
                            </>
                          ) : (
                            <>
                              <DownloadCloud className="h-3.5 w-3.5" />
                              <span>استيراد للتحليل</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>يتم نقل ملف السلايدات بشكل آمن إلى الذاكرة المؤقتة لتحليله فوراً بواسطة Gemini</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
