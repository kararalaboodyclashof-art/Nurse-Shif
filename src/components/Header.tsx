import React from 'react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Server,
  Layers,
  Users,
  Moon,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  History,
  FlaskConical,
  AlertTriangle,
  Share2,
  Settings,
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenTestModal: () => void;
  onOpenPersistenceModal?: (tab?: 'share' | 'sync' | 'storage') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenTestModal,
  onOpenPersistenceModal,
}) => {
  const {
    database,
    serverConnected,
    isSaving,
    activeView,
    setActiveView,
    isSupervisorMode,
    setIsSupervisorMode,
    selectedShiftId,
    setSelectedShiftId,
    currentShift,
  } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: Layers },
    { id: 'periods', label: 'الفترات التسع', icon: Clock },
    { id: 'critical', label: 'الفترة الحرجة (2-7ص)', icon: Moon },
    { id: 'handover', label: 'جدول التسليم والاستلام', icon: ClipboardList },
    { id: 'staff', label: 'الكادر الطبي', icon: Users, badge: database.staff.length },
    { id: 'reports', label: 'التقارير والعدالة', icon: BarChart3 },
    { id: 'audit', label: 'سجل التدقيق', icon: History },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <span className="font-black text-xl tracking-wider">NS</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">NurseShift</h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  خفارات 18 ساعة
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 hidden sm:block">
                {database.settings.hospitalName} • {database.settings.departmentName}
              </p>
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Database Persistence Status Badge */}
            <button
              onClick={() => onOpenPersistenceModal?.('storage')}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer hover:opacity-90 ${
                serverConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title="بيانات الخفارات محفوظة تلقائياً في ذاكرة الهاتف والسيرفر. اضغط للاطلاع على التفاصيل"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isSaving ? 'جارٍ الحفظ...' : serverConnected ? 'قاعدة بيانات متصلة ومحفوظة' : 'محفوظ محلياً'}</span>
            </button>

            {/* Quick Share / Cloud Sync Button */}
            <button
              onClick={() => onOpenPersistenceModal?.('share')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
              title="مشاركة قاعدة البيانات مع الزميل المشرف (واتساب) أو مزامنة سحابية"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">مشاركة البيانات</span>
              <span className="sm:hidden">مشاركة</span>
            </button>

            {/* Test Scenarios Hub Button */}
            <button
              onClick={onOpenTestModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition"
              title="اختبار سيناريوهات الإجازات والغياب الطارئ والفترة الحرجة الـ 10"
            >
              <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">مركز الاختبارات (10)</span>
              <span className="sm:hidden">الاختبارات</span>
            </button>

            {/* Supervisor Mode Toggle */}
            <button
              onClick={() => setIsSupervisorMode(!isSupervisorMode)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                isSupervisorMode
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isSupervisorMode ? 'صلاحيات المشرف' : 'وضع الكادر'}</span>
            </button>

            {/* Settings & Backups */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="إعدادات قاعدة البيانات والنسخ الاحتياطي"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* In-app PWA install button */}
            <PWAInstallButton />
          </div>
        </div>

        {/* Shift Selector Bar (showing shift dates) */}
        {database.shifts.length > 0 ? (
          <div className="py-2 border-t border-slate-100 flex items-center justify-between overflow-x-auto gap-3 text-xs">
            <div className="flex items-center gap-1.5 shrink-0">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-slate-700">تواريخ الخفارات:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {database.shifts.map((shift) => {
                const isSelected = shift.id === selectedShiftId;
                const isApproved = shift.status === 'approved';
                const hasWarnings = shift.warningMessages && shift.warningMessages.length > 0;

                return (
                  <button
                    key={shift.id}
                    onClick={() => setSelectedShiftId(shift.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300/60'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={`خفارة رقم ${shift.number} • تاريخ: ${shift.startDate}`}
                  >
                    <span className="font-mono">{shift.startDate || `خفارة ${shift.number}`}</span>
                    {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
                    {hasWarnings && !isApproved && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  </button>
                );
              })}
            </div>

            {currentShift && (
              <div className="hidden lg:flex items-center gap-2 text-slate-500 text-[11px] shrink-0">
                <span>
                  من: {currentShift.startDate} (2:00 م) حتى: {currentShift.endDate} (8:00 ص)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {currentShift.status === 'approved' ? 'معتمدة نهائياً' : 'مسودة'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>لم يتم إنشاء خفارات الشهر بعد.</span>
            </div>
            <button
              onClick={() => setActiveView('handover')}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 underline"
            >
              الانتقال إلى جدول التسليم والاستلام لتحديد التواريخ والكادر
            </button>
          </div>
        )}

        {/* Main Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1.5 border-t border-slate-100 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-sky-100/70 text-sky-900 border border-sky-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
