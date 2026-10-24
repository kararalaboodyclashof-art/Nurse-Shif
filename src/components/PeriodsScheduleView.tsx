import React from 'react';
import { useApp } from '../context/AppContext';
import { PERIOD_DEFINITIONS } from '../utils/fairnessEngine';
import {
  Clock,
  Moon,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Calendar,
  UserCheck,
  Edit3,
  ShieldCheck,
} from 'lucide-react';

interface PeriodsScheduleViewProps {
  onOpenManualOverride: (periodIndex: number) => void;
  onOpenEmergencyModal: () => void;
}

export const PeriodsScheduleView: React.FC<PeriodsScheduleViewProps> = ({
  onOpenManualOverride,
  onOpenEmergencyModal,
}) => {
  const { currentShift, database, runSmartSchedulerForShift, isSupervisorMode } = useApp();

  if (!currentShift) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 font-bold">يرجى اختيار خفارة من الأعلى</p>
      </div>
    );
  }

  const staffMap = new Map(database.staff.map((s) => [s.id, s]));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-black text-slate-900">
              جدول الفترات التسع — الخفارة رقم {currentShift.number}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
              18 ساعة (من 2:00 م إلى 8:00 ص)
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            كل فترة مدتها ساعتان، ويجب تواجد ممرض واحد ومساعد تخدير مؤهل واحد على الأقل في كل فترة وفق قواعد العدالة الصارمة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runSmartSchedulerForShift(currentShift.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>إعادة التوزيع الذكي والعادل</span>
          </button>
        </div>
      </div>

      {/* Rules & Invariants Notice */}
      <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 text-xs text-sky-900 font-medium flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sky-950">قواعد التوزيع والعدالة الإلزامية في هذا الجدول:</p>
          <ul className="list-disc list-inside space-y-0.5 text-sky-800 text-[11px]">
            <li><strong>تثبيت مسؤولي التسليم والاستلام (أول وآخر الجدول):</strong> يُثبَّت مسؤول استلام التمريض ومسؤول استلام التخدير المحددان في جدول التسليم والاستلام تلقائياً في الفترة الأولى (14:00 - 16:00) لاستلام المناوبة من الصباحي، وفي الفترة التاسعة والأخيرة (06:00 - 08:00) لتسليم المناوبة للصباحي التالي.</li>
            <li><strong>منع 4 ساعات متواصلة:</strong> لا يُسنَد لأي موظف فترتان متتاليتان مدة كل منهما ساعتان (ساعتان عمل ثم ساعتان راحة على الأقل).</li>
            <li><strong>الفترة الحرجة (2:00 ف - 7:00 ص):</strong> تُوزع بالتناوب العادل، وفترة 6-8 ص تُحتسب منها ساعة واحدة حرجة فقط.</li>
            <li><strong>الأولوية التراكمية:</strong> الأولوية للموظف الأقل عبئاً تراكمياً في ساعات العمل والجاهز بالراحة الكافية.</li>
          </ul>
        </div>
      </div>

      {/* Periods Table / Cards */}
      <div className="space-y-3">
        {PERIOD_DEFINITIONS.map((def) => {
          const assignment = currentShift.assignments.find((a) => a.periodIndex === def.index);
          const nurse = assignment?.nurseId ? staffMap.get(assignment.nurseId) : null;
          const anes = assignment?.anesthetistId ? staffMap.get(assignment.anesthetistId) : null;

          const isCovered = assignment?.isCovered ?? false;
          const isCritical = def.criticalHours > 0;
          const hasConflict = assignment?.hasConflict ?? false;

          return (
            <div
              key={def.index}
              className={`bg-white rounded-2xl p-5 border transition-all ${
                def.index === 0
                  ? 'border-emerald-300 bg-gradient-to-l from-emerald-50/30 to-white'
                  : def.index === 8
                  ? 'border-blue-300 bg-gradient-to-l from-blue-50/30 to-white'
                  : isCritical
                  ? 'border-purple-200 bg-gradient-to-l from-purple-50/30 to-white'
                  : 'border-slate-200'
              } shadow-2xs hover:shadow-xs`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Period Badge & Times */}
                <div className="lg:w-72 shrink-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      {def.index + 1}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm">{def.label}</h3>

                    {def.index === 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        أول الجدول (استلام 14:00)
                      </span>
                    )}

                    {def.index === 8 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-300">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        آخر الجدول (تسليم 08:00)
                      </span>
                    )}

                    {isCritical && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200">
                        <Moon className="w-3 h-3 text-purple-600" />
                        فترة حرجة ({def.criticalHours}س)
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{def.displayTime}</span>
                    <span className="text-[10px] text-slate-400">({def.totalDurationHours} ساعات)</span>
                  </div>
                </div>

                {/* Nurse Assignment Box */}
                <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400">كادر التمريض المكلف:</span>
                    {nurse && (
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded-md">
                        {nurse.qualification === 'specialist' ? 'أخصائي' : nurse.qualification === 'senior' ? 'أقدم' : 'معتمد'}
                      </span>
                    )}
                  </div>
                  {nurse ? (
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                        <span>{nurse.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                        <strong className="text-slate-600">مبرر الاختيار: </strong>
                        {assignment?.nurseReason}
                      </div>
                    </div>
                  ) : (
                    <div className="text-rose-600 text-xs font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>شاغر — لم يتم إسناد ممرض مؤهل</span>
                    </div>
                  )}
                </div>

                {/* Anesthetist Assignment Box */}
                <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400">مساعد التخدير المكلف:</span>
                    {anes && (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-md">
                        {anes.qualification === 'specialist' ? 'أخصائي' : anes.qualification === 'senior' ? 'أقدم' : 'معتمد'}
                      </span>
                    )}
                  </div>
                  {anes ? (
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{anes.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                        <strong className="text-slate-600">مبرر الاختيار: </strong>
                        {assignment?.anesthetistReason}
                      </div>
                    </div>
                  ) : (
                    <div className="text-rose-600 text-xs font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>شاغر — لم يتم إسناد مساعد تخدير</span>
                    </div>
                  )}
                </div>

                {/* Status & Manual Edit */}
                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                      isCovered
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isCovered ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>مغطاة</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>غير مغطاة</span>
                      </>
                    )}
                  </span>

                  {isSupervisorMode && (
                    <button
                      onClick={() => onOpenManualOverride(def.index)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3 text-slate-500" />
                      <span>تعديل يدوي</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Conflict Alert for consecutive 4 hours if detected */}
              {hasConflict && assignment?.conflictReason && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{assignment.conflictReason}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
