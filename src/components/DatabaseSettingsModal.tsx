import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Download,
  Upload,
  RefreshCw,
  Trash2,
  X,
  Server,
  ShieldAlert,
  Database,
  CheckCircle2,
} from 'lucide-react';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    database,
    serverConnected,
    isSaving,
    exportBackupJson,
    restoreFromBackupJson,
    resetDatabaseToEmpty,
    refreshDatabase,
    updateSettings,
    shareToWhatsApp,
  } = useApp();

  const [hospitalName, setHospitalName] = useState(database.settings.hospitalName);
  const [departmentName, setDepartmentName] = useState(database.settings.departmentName);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveHospitalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      hospitalName: hospitalName.trim(),
      departmentName: departmentName.trim(),
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.staff)) {
          await restoreFromBackupJson(parsed);
          setModalFeedback({ type: 'success', message: 'تم استرجاع النسخة الاحتياطية بنجاح!' });
          setTimeout(() => {
            setModalFeedback(null);
            onClose();
          }, 1500);
        } else {
          setModalFeedback({ type: 'error', message: 'الملف غير متوافق مع بنية بيانات NurseShift' });
        }
      } catch {
        setModalFeedback({ type: 'error', message: 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية' });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await resetDatabaseToEmpty('إعادة ضبط يدوية بناء على طلب المشرف');
    setConfirmReset(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-lg w-full text-right">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-600" />
            <h3 className="font-black text-slate-900 text-sm">
              إدارة قاعدة البيانات الدائمة والنسخ الاحتياطي
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {modalFeedback && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center justify-between ${
              modalFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{modalFeedback.message}</span>
            <button onClick={() => setModalFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        )}

        {/* Server & Persistence Status */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-4 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              حالة التخزين الدائم على السيرفر:
            </span>
            <span
              className={`font-black flex items-center gap-1 ${
                serverConnected ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {serverConnected ? 'قاعدة بيانات نشطة ومحفوظة' : 'وضع تخزين متصفح محلي'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>آخر تحديث للقاعدة:</span>
            <span className="font-mono">
              {database.lastUpdated ? new Date(database.lastUpdated).toLocaleString('ar-EG') : 'الآن'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
            <span>إجمالي الكوادر المسجلة: {database.staff.length}</span>
            <span>عدد الخفارات: {database.shifts.length}</span>
            <span>سجلات التدقيق: {database.auditLog.length}</span>
          </div>
        </div>

        {/* Hospital & Department Info Edit Form */}
        <form onSubmit={handleSaveHospitalInfo} className="bg-sky-50/60 border border-sky-200 rounded-xl p-3.5 mb-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-950">بيانات المستشفى والقسم في الترويسة والتقارير:</span>
            {isSavedNotice && (
              <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-md">
                تم الحفظ بنجاح ✓
              </span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المستشفى:</label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم القسم:</label>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-2xs transition"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>

        {/* Backup & Restore Buttons */}
        <div className="space-y-3 mb-5">
          <button
            onClick={exportBackupJson}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs font-bold text-slate-800"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div>تحميل نسخة احتياطية كاملة (JSON)</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  تنزيل كافة جداول الكادر والخفارات وسجل التدقيق لملف آمن
                </div>
              </div>
            </div>
            <span className="text-sky-600">تنزيل</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs font-bold text-slate-800"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div>استرجاع قاعدة البيانات من ملف (Restore)</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  رفع ملف نسخة احتياطية سابق واستعادة البيانات كاملة
                </div>
              </div>
            </div>
            <span className="text-emerald-600">اختيار ملف</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={refreshDatabase}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs font-bold text-slate-800"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div>إعادة مزامنة البيانات من السيرفر</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  تحديث فوري لقراءة أحدث البيانات المخزنة
                </div>
              </div>
            </div>
            <span className="text-purple-600">مزامنة</span>
          </button>
        </div>

        {/* Reset Danger Zone */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>تصفير قاعدة البيانات (قاعدة فارغة)</span>
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                {confirmReset
                  ? 'هل أنت متأكد تماماً؟ سيتم مسح كافة الكوادر والجداول وبدء قاعدة بيانات فارغة نظيفة.'
                  : 'العودة للحالة الأولية النظيفة دون أي أسماء أو جداول.'}
              </p>
            </div>
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-black text-xs shadow-xs transition"
                >
                  نعم، صفّر الآن
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs transition"
              >
                تصفير شامل
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-5 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
