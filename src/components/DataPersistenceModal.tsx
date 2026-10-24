import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Download,
  Upload,
  Share2,
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  HardDrive,
  Server,
  AlertCircle,
  Copy,
  Check,
  X,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface DataPersistenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'share' | 'sync' | 'storage';
}

export const DataPersistenceModal: React.FC<DataPersistenceModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'share',
}) => {
  const {
    database,
    serverConnected,
    isSaving,
    lastLocalSaveTime,
    exportDatabaseJson,
    shareToWhatsApp,
    importDatabaseJson,
    pushToCloudRoom,
    pullFromCloudRoom,
    refreshDatabase,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'share' | 'sync' | 'storage'>(defaultTab);
  const [roomCode, setRoomCode] = useState('RCU-2026');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  const handleShareWhatsApp = async () => {
    setIsProcessing(true);
    try {
      const res = await shareToWhatsApp();
      if (res.method === 'web_share') {
        showToast('success', 'تم فتح خيارات المشاركة إلى الواتساب بنجاح.');
      } else {
        showToast('success', 'تم تنزيل ملف JSON وفتح محادثة الواتساب لإرسال الملف لزميلك.');
      }
    } catch (err: any) {
      showToast('error', `حدث خطأ أثناء المشاركة: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = await importDatabaseJson(content);
        showToast('success', res.message);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        showToast('error', err.message || 'فشل استيراد الملف');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      showToast('error', 'حدث خطأ أثناء قراءة الملف من الجهاز');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handlePushRoom = async () => {
    if (!roomCode.trim()) {
      showToast('error', 'يرجى كتابة كود المزامنة أولاً');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await pushToCloudRoom(roomCode);
      showToast('success', res.message);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePullRoom = async () => {
    if (!roomCode.trim()) {
      showToast('error', 'يرجى كتابة كود المزامنة أولاً');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await pullFromCloudRoom(roomCode);
      showToast('success', res.message);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const generateRandomCode = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setRoomCode(`RCU-${rand}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl max-w-xl w-full text-right border border-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                حفظ البيانات والمشاركة مع الزميل المشرف
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                تصدير واستيراد قاعدة البيانات، مشاركة واتساب، ومزامنة سحابية مباشرة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold mb-4 flex items-start gap-2.5 transition animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-sky-50 text-sky-800 border border-sky-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'share'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير واستيراد وواتساب</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'sync'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>مزامنة سحابية بكود</span>
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'storage'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>حالة الحفظ التلقائي</span>
          </button>
        </div>

        {/* Tab 1: Export, Import & WhatsApp Sharing */}
        {activeTab === 'share' && (
          <div className="space-y-3.5">
            {/* WhatsApp Supervisor Colleague Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-2 border-emerald-400/40 text-emerald-950">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-sm text-emerald-950 flex items-center gap-1.5">
                    <span>مشاركة البيانات مع زميلي المشرف (واتساب)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-800 font-bold">
                      موصى به عند الإجازة
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                    تصدير قاعدة البيانات الحالية بملف JSON ومشاركتها مع زميلك المشرف عبر الواتساب، ليقوم باستيرادها على هاتفه بضغطة زر وتظهر لديه كافة جداول الخفارات وسجلات العدالة التراكمية ليستكمل الإشراف بدلاً منك.
                  </p>

                  <button
                    onClick={handleShareWhatsApp}
                    disabled={isProcessing}
                    className="mt-3.5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>إرسال نسخة الخفارات والعدالة لزميلي المشرف (واتساب)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Export and Import Dual Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export JSON Button */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sky-700 font-bold text-xs mb-1">
                    <Download className="w-4 h-4" />
                    <span>تصدير البيانات (Export Data / JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    تنزيل ملف JSON كامل يحتوي على الكادر الطبي، الخفارات الـ 9، ومسؤولي التسليم وسجل التدقيق.
                  </p>
                </div>
                <button
                  onClick={exportDatabaseJson}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير وحفظ ملف JSON</span>
                </button>
              </div>

              {/* Import JSON Button */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-1">
                    <Upload className="w-4 h-4" />
                    <span>استيراد البيانات (Import Data / JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    اختيار ملف JSON أرسله لك زميلك لتحديث كافة الخفارات وسجلات العدالة التراكمية فوراً.
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'جارٍ الاستيراد...' : 'اختيار ملف واستيراده'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,application/json"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Cloud Room Sync */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950">
              <div className="flex items-start gap-2.5">
                <Cloud className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-black block mb-1">مزامنة سحابية مباشرة بين الهاتفين دون ملفات:</span>
                  <p className="text-slate-600 leading-relaxed">
                    يمكنك أنت وزميلك المشرف استخدام نفس كود الغرفة (مثلاً <span className="font-mono font-bold text-sky-800">RCU-2026</span>) لمزامنة الجداول مباشرة. عند قيامك بالرفع (Push)، يقوم زميلك على هاتفه بالضغط على سحب (Pull) لتصله التعديلات في ثانية واحدة!
                  </p>
                </div>
              </div>
            </div>

            {/* Room Code Input */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                كود غرفة المزامنة السحابية (Sync Room Code):
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="RCU-2026"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-black text-slate-800 tracking-wider text-center focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />

                <button
                  type="button"
                  onClick={copyCode}
                  className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                  title="نسخ الكود"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                  title="توليد كود جديد"
                >
                  كود جديد
                </button>
              </div>

              {/* Action Buttons for Push & Pull */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handlePushRoom}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>رفع للمزامنة (Push)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullRoom}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>سحب وتحديث (Pull)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Local Storage & Persistence Status */}
        {activeTab === 'storage' && (
          <div className="space-y-3.5">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-sky-600" />
                  ذاكرة المتصفح والهاتف (localStorage):
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  محفوظ تلقائياً فوراً
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-indigo-600" />
                  سيرفر النظام وقاعدة البيانات الدائمة:
                </span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    serverConnected
                      ? 'text-emerald-700 bg-emerald-100'
                      : 'text-amber-700 bg-amber-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {serverConnected ? 'متصل ومحفوظ' : 'يعمل في وضع التخزين المحلي'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                <span>آخر حفظ تلقائي تم إجراؤه:</span>
                <span className="font-mono text-slate-900 font-bold">
                  {lastLocalSaveTime ? new Date(lastLocalSaveTime).toLocaleString('ar-EG') : 'الآن'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200">
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <div className="text-sm font-black text-slate-900">{database.staff.length}</div>
                  <div className="text-[10px] text-slate-500 font-medium">كادر طبي مسجل</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <div className="text-sm font-black text-slate-900">{database.shifts.length}</div>
                  <div className="text-[10px] text-slate-500 font-medium">خفارات شهرية</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <div className="text-sm font-black text-slate-900">{database.auditLog.length}</div>
                  <div className="text-[10px] text-slate-500 font-medium">سجلات تدقيق</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <span className="font-medium">
                بياناتك في أمان تام حتى لو تم إغلاق التطبيق أو إعادة تشغيل الهاتف.
              </span>
              <button
                onClick={refreshDatabase}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>إعادة قراءة</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-400">
            {database.settings.hospitalName} • {database.settings.departmentName}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
