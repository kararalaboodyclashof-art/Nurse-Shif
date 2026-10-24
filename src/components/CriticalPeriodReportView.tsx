import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateCriticalMinutesOverlap } from '../utils/fairnessEngine';
import {
  Moon,
  Clock,
  ShieldAlert,
  ArrowDownUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Calculator,
  UserCheck,
} from 'lucide-react';

export const CriticalPeriodReportView: React.FC = () => {
  const { database, currentShift } = useApp();

  // Test calculator for minutes overlap
  const [calcStart, setCalcStart] = useState('03:30');
  const [calcEnd, setCalcEnd] = useState('06:30');
  const [calcOverlapMins, setCalcOverlapMins] = useState(
    calculateCriticalMinutesOverlap('03:30', '06:30')
  );

  const handleRecalc = () => {
    setCalcOverlapMins(calculateCriticalMinutesOverlap(calcStart, calcEnd));
  };

  // Rank staff by cumulative critical hours
  const sortedStaff = [...database.staff].sort(
    (a, b) => b.totalCriticalHours - a.totalCriticalHours
  );

  const nurses = sortedStaff.filter((s) => s.role === 'nurse');
  const anesthetists = sortedStaff.filter((s) => s.role === 'anesthetist');

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Moon className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black">
                تقرير وضوابط الفترة الحرجة (02:00 فجراً — 07:00 صباحاً)
              </h2>
            </div>
            <p className="text-xs text-purple-200/80 max-w-2xl leading-relaxed">
              تُعد الفترة من 02:00 فجراً إلى 07:00 صباحاً أصعب فترات الخفارة الـ 18 ساعة. يعتمد محرك NurseShift خوارزمية دقيقة تمنع تكرار تكليف الموظف بها في خفارات متتالية وتضمن توزيع ساعاتها الـ 5 بإنصاف تام.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center shrink-0">
            <span className="text-[11px] font-bold text-purple-200 block">إجمالي الساعات الحرجة بالخفارة</span>
            <span className="text-2xl font-black text-white">5.0 ساعات</span>
            <span className="text-[10px] text-purple-300 block">من أصل 18 ساعة</span>
          </div>
        </div>
      </div>

      {/* Critical Window Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Slot 1: 02:00 - 04:00 */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
              الفترة السابعة
            </span>
            <span className="text-xs font-black text-purple-700">2.0 ساعة حرجة</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">من 02:00 ف إلى 04:00 ف</h4>
          <p className="text-xs text-slate-500">
            تقع بالكامل داخل النافذة الحرجة، تُحتسب بالكامل (120 دقيقة) ضمن الرصيد الحرج.
          </p>
        </div>

        {/* Slot 2: 04:00 - 06:00 */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
              الفترة الثامنة
            </span>
            <span className="text-xs font-black text-purple-700">2.0 ساعة حرجة</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">من 04:00 ف إلى 06:00 ف</h4>
          <p className="text-xs text-slate-500">
            أشد فترات الخفارة هبوطاً في الطاقة الحيوية، تُحتسب بالكامل (120 دقيقة) ضمن الرصيد الحرج.
          </p>
        </div>

        {/* Slot 3: 06:00 - 08:00 (Only 6-7 is critical) */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
              الفترة التاسعة (المختلطة)
            </span>
            <span className="text-xs font-black text-amber-700">1.0 ساعة حرجة فقط</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">من 06:00 ف إلى 08:00 ص</h4>
          <p className="text-xs text-slate-600">
            <strong>قاعدة خاصة:</strong> الفترة من 6 إلى 7 صباحاً حرج (60 دقيقة)، بينما 7 إلى 8 صباحاً عادية.
          </p>
        </div>
      </div>

      {/* Critical Hours Balance & Priority Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-base">
            سجل ساعات الفترة الحرجة التراكمي وتحديد أولويات التكليف القادم
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            الموظف ذو الساعات الحرجة الأعلى يحصل على أولوية أقل (إعفاء مستحق) في الخفارة التالية لصالح زملائه الأقل تكليفاً.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">اسم الموظف</th>
                <th className="py-3 px-4">الدور</th>
                <th className="py-3 px-4">التأهيل</th>
                <th className="py-3 px-4">إجمالي الساعات الحرجة التراكمية</th>
                <th className="py-3 px-4">تكليف حرج متتالٍ؟</th>
                <th className="py-3 px-4">أولوية التكليف في الخفارة التالية</th>
                <th className="py-3 px-4">الفارق عن المتوسط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sortedStaff.map((staff) => {
                // Determine average critical hours in group
                const group = staff.role === 'nurse' ? nurses : anesthetists;
                const totalGroupCrit = group.reduce((sum, s) => sum + s.totalCriticalHours, 0);
                const avgCrit = group.length > 0 ? totalGroupCrit / group.length : 0;
                const diffFromAvg = staff.totalCriticalHours - avgCrit;

                // Priority rule
                let priorityLabel = 'أولوية متوازنة';
                let priorityClass = 'bg-slate-100 text-slate-700';

                if (staff.consecutiveShiftsWithCritical > 0) {
                  priorityLabel = 'معفى (كُلّف في الخفارة السابقة)';
                  priorityClass = 'bg-rose-100 text-rose-800 font-bold';
                } else if (staff.totalCriticalHours > avgCrit + 1.5) {
                  priorityLabel = 'أولوية أقل (تخفيف مستحق)';
                  priorityClass = 'bg-amber-100 text-amber-800 font-bold';
                } else if (staff.totalCriticalHours < avgCrit - 1.5) {
                  priorityLabel = 'أولوية عالية للتكليف القادم';
                  priorityClass = 'bg-purple-100 text-purple-800 font-bold';
                }

                return (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{staff.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          staff.role === 'nurse' ? 'bg-sky-50 text-sky-800' : 'bg-indigo-50 text-indigo-800'
                        }`}
                      >
                        {staff.role === 'nurse' ? 'ممرض' : 'مساعد تخدير'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {staff.qualification === 'specialist' ? 'أخصائي' : staff.qualification === 'senior' ? 'أقدم' : 'معتمد'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-purple-700 text-sm">
                        {staff.totalCriticalHours} ساعات
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {staff.consecutiveShiftsWithCritical > 0 ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          نعم ({staff.consecutiveShiftsWithCritical} خفارة)
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          لا (مناوب متوازن)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs ${priorityClass}`}>
                        {priorityLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          diffFromAvg > 0 ? 'text-amber-600' : diffFromAvg < 0 ? 'text-purple-600' : 'text-slate-500'
                        }`}
                      >
                        {diffFromAvg > 0 ? `+${diffFromAvg.toFixed(1)}س` : `${diffFromAvg.toFixed(1)}س`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Overlap Minutes Calculator */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-5 h-5 text-sky-400" />
          <h3 className="font-black text-sm">
            حاسبة دقائق التداخل الحرجة (للخروج الطارئ والتغطيات المؤقتة)
          </h3>
        </div>
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          وفق الشرط: "إذا تداخلت مناوبة مع الفترة الحرجة، فاحسب مدة التداخل الفعلية بالدقائق، وليس مدة المناوبة كاملة."
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">وقت البدء (تنسيق 24 ساعة):</label>
            <input
              type="time"
              value={calcStart}
              onChange={(e) => setCalcStart(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">وقت الانتهاء (تنسيق 24 ساعة):</label>
            <input
              type="time"
              value={calcEnd}
              onChange={(e) => setCalcEnd(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRecalc}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              احسب دقائق التداخل
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-300">
            تداخل الفترة ({calcStart} إلى {calcEnd}) مع النافذة الحرجة (02:00 - 07:00):
          </span>
          <span className="text-base font-black text-emerald-400">
            {calcOverlapMins} دقيقة حرجة ({(calcOverlapMins / 60).toFixed(2)} ساعة)
          </span>
        </div>
      </div>
    </div>
  );
};
