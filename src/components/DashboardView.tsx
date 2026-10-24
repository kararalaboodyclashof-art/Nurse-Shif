import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PERIOD_DEFINITIONS } from '../utils/fairnessEngine';
import {
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  UserX,
  Play,
  Moon,
  AlertCircle,
  FileCheck,
  ArrowRightLeft,
  UserPlus,
  RefreshCw,
  Sparkles,
  Info,
  CheckCircle,
  Download,
  Upload,
  Share2,
  Cloud,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenEmergencyModal: () => void;
  onOpenLeaveModal: () => void;
  onOpenApprovalModal: () => void;
  onOpenManualOverride: (periodIndex: number) => void;
  onOpenPersistenceModal?: (tab?: 'share' | 'sync' | 'storage') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenEmergencyModal,
  onOpenLeaveModal,
  onOpenApprovalModal,
  onOpenManualOverride,
  onOpenPersistenceModal,
}) => {
  const {
    database,
    currentShift,
    isSupervisorMode,
    serverConnected,
    lastLocalSaveTime,
    runSmartSchedulerForShift,
    initializeMonthlyShifts,
    loadPresetStaffSquad,
    setActiveView,
    resolveEmergencyExit,
    exportDatabaseJson,
    shareToWhatsApp,
    importDatabaseJson,
  } = useApp();

  const [isDistributing, setIsDistributing] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const dashboardFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDashboardFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = await importDatabaseJson(content);
        setImportStatus(res.message);
        setTimeout(() => setImportStatus(null), 6000);
      } catch (err: any) {
        setImportStatus(`خطأ أثناء الاستيراد: ${err.message || 'الملف غير صالح'}`);
        setTimeout(() => setImportStatus(null), 6000);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // If no staff or no shifts exist, show clean initial onboarding
  if (database.staff.length === 0 || database.shifts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            مرحباً بك في نظام NurseShift الذكي
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
            تمت تهيئة النظام بقاعدة بيانات فارغة تماماً وفق المعايير الإدارية المعتمدة. يمكنك البدء بإدخال كادر الخفارة أو تحميل التشكيل الأساسي المعتمد (6 ممرضين و5 مساعدي تخدير).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-8">
            <button
              onClick={() => setActiveView('staff')}
              className="p-4 rounded-2xl border-2 border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 text-right transition group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-sky-600 group-hover:text-white transition">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">إدخال كادر مخصص</h4>
              </div>
              <p className="text-xs text-slate-500">
                إضافة أسماء الممرضين ومساعدي التخدير وأرقام هواتفهم يدوياً.
              </p>
            </button>

            <button
              onClick={async () => {
                await loadPresetStaffSquad();
                if (database.shifts.length === 0) {
                  await initializeMonthlyShifts();
                }
              }}
              className="p-4 rounded-2xl border-2 border-sky-400 bg-sky-50/80 hover:bg-sky-100 text-right transition group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-sky-600 text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sky-950 text-sm">تحميل الكادر المعتمد</h4>
              </div>
              <p className="text-xs text-sky-800">
                تحميل فوري لـ 6 ممرضين و5 تخدير وتوليد الخفارات الـ 9.
              </p>
            </button>

            <button
              onClick={() => onOpenPersistenceModal?.('share')}
              className="p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/80 hover:bg-emerald-100 text-right transition group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-emerald-950 text-sm">استيراد بيانات من زميل</h4>
              </div>
              <p className="text-xs text-emerald-800">
                استيراد ملف JSON أرسله لك المشرف لمتابعة الإشراف بدلاً منه.
              </p>
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
            <Info className="w-4 h-4 text-slate-500" />
            <span>نظام الدوام: 18 ساعة (2:00 ظهراً إلى 8:00 صباحاً) يعقبها 3 أيام راحة</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentShift) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 font-bold">يرجى اختيار خفارة من شريط الخفارات بالأعلى</p>
      </div>
    );
  }

  // Lookup helper for staff names
  const staffMap = new Map(database.staff.map((s) => [s.id, s]));

  // Attendee sets
  const leaveEmployeeIds = new Set(currentShift.leaves.map((l) => l.employeeId));
  const presentNurses = database.staff.filter((s) => s.isActive && s.role === 'nurse' && !leaveEmployeeIds.has(s.id));
  const onLeaveNurses = database.staff.filter((s) => s.isActive && s.role === 'nurse' && leaveEmployeeIds.has(s.id));

  const presentAnesthetists = database.staff.filter((s) => s.isActive && s.role === 'anesthetist' && !leaveEmployeeIds.has(s.id));
  const onLeaveAnesthetists = database.staff.filter((s) => s.isActive && s.role === 'anesthetist' && leaveEmployeeIds.has(s.id));

  // Handle run smart distribution
  const handleRunDistribution = async () => {
    setIsDistributing(true);
    try {
      await runSmartSchedulerForShift(currentShift.id);
    } finally {
      setIsDistributing(false);
    }
  };

  const coveredCount = currentShift.assignments.filter((a) => a.isCovered).length;
  const conflictCount = currentShift.assignments.filter((a) => a.hasConflict).length;
  const activeEmergencyExits = currentShift.emergencyExits.filter((e) => e.status === 'active');

  return (
    <div className="space-y-6 pb-12">
      {/* Real-time Persistence & Colleague Sharing Bar */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-sky-50 rounded-2xl p-4 border border-emerald-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-emerald-950">
                  الحفظ التلقائي الدائم (Data Persistence)
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  محفوظ تلقائياً في ذاكرة الهاتف (localStorage) والسيرفر
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-0.5">
                تُحفظ كافة بيانات الكادر، الخفارات، التسليم والاستلام، والتغيرات الطارئة فور إدخالها دون ضياع حتى لو أُغلق المتصفح أو أُعيد تشغيل الهاتف.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons per User Request */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Export JSON Button */}
            <button
              onClick={exportDatabaseJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-800 border border-sky-300 font-bold text-xs transition shadow-2xs"
              title="تصدير نسخة كاملة من قاعدة البيانات كملف JSON"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>تصدير البيانات (JSON)</span>
            </button>

            {/* Import JSON Button */}
            <button
              onClick={() => dashboardFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-300 font-bold text-xs transition shadow-2xs"
              title="استيراد نسخة قاعدة بيانات JSON من زميلك المشرف"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>استيراد البيانات (JSON)</span>
            </button>
            <input
              type="file"
              ref={dashboardFileInputRef}
              onChange={handleDashboardFileImport}
              accept=".json,application/json"
              className="hidden"
            />

            {/* WhatsApp Colleague Share Button */}
            <button
              onClick={async () => {
                await shareToWhatsApp();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs transition shadow-sm shadow-emerald-600/20"
              title="مشاركة قاعدة البيانات مع زميلك المشرف عبر الواتساب ليستكمل الإشراف أثناء إجازتك"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة مع زميلي (واتساب)</span>
            </button>

            {/* Cloud Room Sync Button */}
            <button
              onClick={() => onOpenPersistenceModal?.('sync')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition shadow-2xs"
              title="مزامنة سحابية مباشرة عبر كود غرفة مشترك بين الهاتفين"
            >
              <Cloud className="w-3.5 h-3.5 text-slate-600" />
              <span>مزامنة سحابية</span>
            </button>
          </div>
        </div>

        {importStatus && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-white/95 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center justify-between animate-in fade-in duration-200">
            <span>{importStatus}</span>
            <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}
      </div>

      {/* Shift Overview Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Shift Details */}
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-3 py-1 rounded-xl bg-sky-600 text-white font-black text-sm">
                الخفارة رقم {currentShift.number} من 9
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  currentShift.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {currentShift.status === 'approved' ? 'معتمدة نهائياً' : 'مسودة قيد المراجعة'}
              </span>
              {currentShift.isCoverageComplete ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" />
                  مكتملة التغطية (9/9)
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  يوجد فترات غير مغطاة
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                بداية: {currentShift.startDate} (02:00 م) • نهاية: {currentShift.endDate} (08:00 ص)
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                المدة: 18 ساعة متواصلة (9 فترات × ساعتان)
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunDistribution}
              disabled={isDistributing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDistributing ? 'animate-spin' : ''}`} />
              <span>{isDistributing ? 'جارٍ التوزيع...' : 'التوزيع الذكي والعادل'}</span>
            </button>

            <button
              onClick={onOpenEmergencyModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
              <span>خروج طارئ (1-2 س)</span>
            </button>

            <button
              onClick={onOpenLeaveModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs transition"
            >
              <UserX className="w-3.5 h-3.5 text-slate-600" />
              <span>تسجيل إجازة</span>
            </button>

            {isSupervisorMode && (
              <button
                onClick={onOpenApprovalModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>اعتماد الخفارة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Warnings & Safety Alerts */}
      {currentShift.warningMessages && currentShift.warningMessages.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900 mb-1">
                تنبيهات سلامة الكادر وتغطية الخفارة:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-rose-800 font-medium">
                {currentShift.warningMessages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Handover Officer Banner */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-sky-200 uppercase tracking-wider mb-0.5">
              مسؤولا التسليم والاستلام (تمريض + تخدير) — يُثبّتان تلقائياً في أول الجدول (14:00) وآخره (08:00):
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-black">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="text-xs text-sky-200 font-normal">التمريض:</span>
                <span>{currentShift.handover.nurseOfficerName || 'لم يحدد'}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-xs text-indigo-200 font-normal">التخدير:</span>
                <span>{currentShift.handover.anesOfficerName || 'لم يحدد'}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveView('handover')}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5"
        >
          <span>عرض جدول التسليم والاستلام</span>
          <span className="text-sky-300">←</span>
        </button>
      </div>

      {/* Emergency Active Exits Banner */}
      {activeEmergencyExits.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <ArrowRightLeft className="w-4 h-4 text-amber-600" />
              <span>حالات الخروج الطارئ النشطة ({activeEmergencyExits.length}):</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeEmergencyExits.map((exit) => (
              <div
                key={exit.id}
                className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {exit.employeeName} ({exit.role === 'nurse' ? 'ممرض' : 'مساعد تخدير'})
                  </div>
                  <div className="text-slate-500">
                    من {exit.exitTime} إلى {exit.returnTime} ({exit.durationMinutes} دقيقة)
                  </div>
                  <div className="text-emerald-700 font-semibold mt-0.5">
                    البديل المكلف: {exit.substituteName}
                  </div>
                </div>
                <button
                  onClick={() => resolveEmergencyExit(currentShift.id, exit.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition shrink-0"
                >
                  تأكيد العودة
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance & Rosters Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Nurses Card */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-700 font-black text-xs">
                {presentNurses.length} / {presentNurses.length + onLeaveNurses.length}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">كادر التمريض (Nurses)</h3>
            </div>
            <button
              onClick={onOpenLeaveModal}
              className="text-xs text-sky-700 hover:text-sky-800 font-bold"
            >
              + تسجيل إجازة
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 font-bold block mb-1">الحاضرون في الخفارة:</span>
              <div className="flex flex-wrap gap-1.5">
                {presentNurses.map((nurse) => (
                  <span
                    key={nurse.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
                  >
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    {nurse.name}
                  </span>
                ))}
              </div>
            </div>

            {onLeaveNurses.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <span className="text-rose-500 font-bold block mb-1">المجازون:</span>
                <div className="flex flex-wrap gap-1.5">
                  {onLeaveNurses.map((nurse) => {
                    const leave = currentShift.leaves.find((l) => l.employeeId === nurse.id);
                    return (
                      <span
                        key={nurse.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium"
                      >
                        <UserX className="w-3 h-3 text-rose-500" />
                        {nurse.name} ({leave?.reason || 'إجازة'})
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Anesthetists Card */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs">
                {presentAnesthetists.length} / {presentAnesthetists.length + onLeaveAnesthetists.length}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">مساعدو التخدير (Anesthetists)</h3>
            </div>
            <button
              onClick={onOpenLeaveModal}
              className="text-xs text-indigo-700 hover:text-indigo-800 font-bold"
            >
              + تسجيل إجازة
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 font-bold block mb-1">الحاضرون في الخفارة:</span>
              <div className="flex flex-wrap gap-1.5">
                {presentAnesthetists.map((anes) => (
                  <span
                    key={anes.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
                  >
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    {anes.name}
                  </span>
                ))}
              </div>
            </div>

            {onLeaveAnesthetists.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <span className="text-rose-500 font-bold block mb-1">المجازون:</span>
                <div className="flex flex-wrap gap-1.5">
                  {onLeaveAnesthetists.map((anes) => {
                    const leave = currentShift.leaves.find((l) => l.employeeId === anes.id);
                    return (
                      <span
                        key={anes.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium"
                      >
                        <UserX className="w-3 h-3 text-rose-500" />
                        {anes.name} ({leave?.reason || 'إجازة'})
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The 9 Periods Visual Matrix */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900">
              جدول الفترات التسع (كل فترة ساعتان)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              الخفارة مقسمة إلى 9 فترات، مع إلزامية وجود ممرض ومساعد تخدير مؤهل في كل فترة.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              مغطاة ({coveredCount})
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              غير مغطاة ({9 - coveredCount})
            </span>
            {conflictCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                تعارض ({conflictCount})
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {PERIOD_DEFINITIONS.map((periodDef) => {
            const assignment = currentShift.assignments.find((a) => a.periodIndex === periodDef.index);
            const nurse = assignment?.nurseId ? staffMap.get(assignment.nurseId) : null;
            const anesthetist = assignment?.anesthetistId ? staffMap.get(assignment.anesthetistId) : null;

            const isCovered = assignment?.isCovered ?? false;
            const isCritical = periodDef.criticalHours > 0;
            const hasConflict = assignment?.hasConflict ?? false;

            return (
              <div
                key={periodDef.index}
                className={`p-4 transition-colors ${
                  isCritical
                    ? 'bg-indigo-50/30 hover:bg-indigo-50/60'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Period Time & Badge */}
                  <div className="md:w-64 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                        {periodDef.index + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {periodDef.label}
                      </span>
                      {isCritical && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200">
                          <Moon className="w-3 h-3 text-purple-600" />
                          حرج ({periodDef.criticalHours}س)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{periodDef.displayTime}</span>
                    </div>
                  </div>

                  {/* Assigned Nurse */}
                  <div className="flex-1 bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60">
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5">الممرض المكلف:</div>
                    {nurse ? (
                      <div>
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-sky-500" />
                          <span>{nurse.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={assignment?.nurseReason}>
                          {assignment?.nurseReason}
                        </div>
                      </div>
                    ) : (
                      <span className="text-rose-600 font-bold text-xs flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        شاغر — لا يوجد ممرض
                      </span>
                    )}
                  </div>

                  {/* Assigned Anesthetist */}
                  <div className="flex-1 bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60">
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5">مساعد التخدير المكلف:</div>
                    {anesthetist ? (
                      <div>
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>{anesthetist.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={assignment?.anesthetistReason}>
                          {assignment?.anesthetistReason}
                        </div>
                      </div>
                    ) : (
                      <span className="text-rose-600 font-bold text-xs flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        شاغر — لا يوجد مساعد تخدير
                      </span>
                    )}
                  </div>

                  {/* Status & Edit Button */}
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        isCovered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isCovered ? 'مغطاة' : 'غير مكتملة'}
                    </span>

                    {isSupervisorMode && (
                      <button
                        onClick={() => onOpenManualOverride(periodDef.index)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition"
                        title="تعديل يدوي للفترة مع تسجيل السبب"
                      >
                        تعديل
                      </button>
                    )}
                  </div>
                </div>

                {hasConflict && assignment?.conflictReason && (
                  <div className="mt-2 text-[11px] font-bold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{assignment.conflictReason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
