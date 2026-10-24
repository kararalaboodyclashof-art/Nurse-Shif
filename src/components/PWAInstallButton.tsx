import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
        title="تثبيت التطبيق على الجهاز"
      >
        <Download className="w-3.5 h-3.5" />
        <span>تثبيت كـ تطبيق</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-2.5 py-1 text-xs font-medium hover:bg-sky-100 transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>تثبيت على iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-800 border border-slate-100 text-right">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">تثبيت التطبيق على iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 space-y-2 leading-relaxed">
                1. اضغط على زر <strong className="text-sky-700">مشاركة (Share)</strong> في شريط متصفح Safari.<br />
                2. مرر للأسفل واختر <strong className="text-sky-700">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.<br />
                3. ستتمكن من فتح نظام NurseShift كـ تطبيق مستقل دون إنترنت.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-sky-600 hover:bg-sky-700 py-2.5 text-sm font-bold text-white shadow-md transition"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
