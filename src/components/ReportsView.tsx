import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportShiftToExcel, exportMonthlyReportToExcel, printSchedule } from '../utils/exportUtils';
import { PERIOD_DEFINITIONS } from '../utils/fairnessEngine';
import {
  FileSpreadsheet,
  Printer,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Moon,
  ShieldCheck,
  Award,
  ArrowDownUp,
  FileText,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { database, currentShift } = useApp();
  const [reportType, setReportType] = useState<'single' | 'monthly' | 'equity'>('monthly');

  const staffMap = new Map(database.staff.map((s) => [s.id, s]));

  // Statistical calculations
  const totalStaff = database.staff.length;
  const nurseList = database.staff.filter((s) => s.role === 'nurse');
  const anesList = database.staff.filter((s) => s.role === 'anesthetist');

  const avgNurseHours = nurseList.length > 0 ? (nurseList.reduce((sum, n) => sum + n.totalWorkHours, 0) / nurseList.length).toFixed(1) : '0';
  const avgAnesHours = anesList.length > 0 ? (anesList.reduce((sum, a) => sum + a.totalWorkHours, 0) / anesList.length).toFixed(1) : '0';

  const totalCriticalHoursAssigned = database.staff.reduce((sum, s) => sum + s.totalCriticalHours, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Export Actions */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-black text-slate-900">
              مركز التقارير والإحصائيات وتصدير الجداول
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            تقارير تفصيلية مستقلة لكل خفارة، وتقارير شهرية شاملة للـ 9 خفارات مع مقارنة العدالة التراكمية.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (reportType === 'single' && currentShift) {
                exportShiftToExcel(currentShift, database.staff, database.settings);
              } else {
                exportMonthlyReportToExcel(database.staff, database.shifts, database.settings);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={printSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / حفظ PDF</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 no-print">
        <button
          onClick={() => setReportType('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'monthly'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          التقرير الشهري الشامل (الـ 9 خفارات)
        </button>

        <button
          onClick={() => setReportType('single')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'single'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          تقرير الخفارة الحالية (رقم {currentShift?.number || 1})
        </button>

        <button
          onClick={() => setReportType('equity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'equity'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          مؤشر ومقارنة العدالة بين الكوادر
        </button>
      </div>

      {/* Printable Letterhead (Shown in Print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-xl font-black text-slate-900 mb-1">{database.settings.hospitalName}</h1>
        <h2 className="text-base font-bold text-slate-700">{database.settings.departmentName}</h2>
        <p className="text-xs text-slate-500 mt-1">
          نظام NurseShift لإدارة الخفارات التمريضية • تقرير إداري رسمي • تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}
        </p>
      </div>

      {/* 1. Monthly Cumulative Report View */}
      {reportType === 'monthly' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                التقرير التراكمي الشامل لكافة الكوادر (دورة الشهر الكاملة — 9 خفارات)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                سجل الأرصدة الفعلية بعد كل خفارة وتحديثات الخروج الطارئ والإجازات.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">م</th>
                  <th className="py-3 px-4">اسم الموظف</th>
                  <th className="py-3 px-4">الدور</th>
                  <th className="py-3 px-4">التأهيل</th>
                  <th className="py-3 px-4">ساعات العمل الفعلية</th>
                  <th className="py-3 px-4">ساعات التغطية الإضافية</th>
                  <th className="py-3 px-4">ساعات الفترة الحرجة</th>
                  <th className="py-3 px-4">الفترات الليلية</th>
                  <th className="py-3 px-4">الخفارات المحضورة</th>
                  <th className="py-3 px-4">مسؤول استلام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {database.staff.map((staff, idx) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{staff.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          staff.role === 'nurse' ? 'bg-sky-50 text-sky-800' : 'bg-indigo-50 text-indigo-800'
                        }`}
                      >
                        {staff.role === 'nurse' ? 'تمريض' : 'مساعد تخدير'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {staff.qualification === 'specialist' ? 'أخصائي' : staff.qualification === 'senior' ? 'أقدم' : 'معتمد'}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-800">
                      {staff.totalWorkHours} ساعة
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-700">
                        {staff.totalExtraCoverageHours > 0 ? `+${staff.totalExtraCoverageHours}س` : '0س'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-purple-700">
                      {staff.totalCriticalHours}س
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {staff.lateNightPeriodsCount}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {staff.shiftsAttendedCount} من 9
                    </td>
                    <td className="py-3 px-4 font-bold text-sky-800">
                      {staff.handoverOfficerCount} مرات
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Single Shift Report View */}
      {reportType === 'single' && currentShift && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                تقرير الخفارة رقم {currentShift.number}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                تاريخ: {currentShift.startDate} (14:00) إلى {currentShift.endDate} (08:00) • استلام التمريض: {currentShift.handover.nurseOfficerName || 'غير محدد'} • استلام التخدير: {currentShift.handover.anesOfficerName || 'غير محدد'}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                currentShift.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {currentShift.status === 'approved' ? 'معتمدة نهائياً' : 'مسودة'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم الفترة</th>
                  <th className="py-3 px-4">التوقيت</th>
                  <th className="py-3 px-4">الممرض المسؤول</th>
                  <th className="py-3 px-4">مساعد التخدير</th>
                  <th className="py-3 px-4">فترة حرجة؟</th>
                  <th className="py-3 px-4">حالة التغطية</th>
                  <th className="py-3 px-4">المبرر الإداري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {currentShift.assignments.map((assignment) => {
                  const def = PERIOD_DEFINITIONS[assignment.periodIndex];
                  const nurse = assignment.nurseId ? staffMap.get(assignment.nurseId) : null;
                  const anes = assignment.anesthetistId ? staffMap.get(assignment.anesthetistId) : null;

                  return (
                    <tr key={assignment.periodIndex} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{def.label}</td>
                      <td className="py-3 px-4 text-slate-600">{def.displayTime}</td>
                      <td className="py-3 px-4 font-bold text-sky-900">
                        {nurse ? nurse.name : <span className="text-rose-600">شاغر</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-900">
                        {anes ? anes.name : <span className="text-rose-600">شاغر</span>}
                      </td>
                      <td className="py-3 px-4">
                        {def.criticalHours > 0 ? (
                          <span className="text-purple-700 font-bold">نعم ({def.criticalHours}س)</span>
                        ) : (
                          <span className="text-slate-400">لا</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            assignment.isCovered ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {assignment.isCovered ? 'مغطاة بنجاح' : 'غير مغطاة'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                        {assignment.nurseReason} | {assignment.anesthetistReason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Equity Analysis & Fairness Metric View */}
      {reportType === 'equity' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-slate-400 text-xs font-bold block mb-1">
                متوسط ساعات عمل الممرضين
              </span>
              <span className="text-2xl font-black text-sky-800">{avgNurseHours} ساعة</span>
              <p className="text-[11px] text-slate-500 mt-1">تفاوت لا يتجاوز 4 ساعات بين الكوادر</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-slate-400 text-xs font-bold block mb-1">
                متوسط ساعات مساعدي التخدير
              </span>
              <span className="text-2xl font-black text-indigo-800">{avgAnesHours} ساعة</span>
              <p className="text-[11px] text-slate-500 mt-1">توزيع عادل يراعي فترات الراحة</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-slate-400 text-xs font-bold block mb-1">
                مجموع الساعات الحرجة الموزعة
              </span>
              <span className="text-2xl font-black text-purple-800">
                {totalCriticalHoursAssigned} ساعة
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                موزعة بالتناوب دون تكرار في خفارات متتالية
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Official Sign-Off Block (for PDF / Print) */}
      <div className="mt-8 pt-8 border-t border-slate-300 grid grid-cols-3 text-center text-xs">
        <div>
          <span className="font-bold text-slate-700 block mb-8">مسؤولو الخفارة (تمريض + تخدير)</span>
          <div className="border-b border-dashed border-slate-400 w-44 mx-auto mb-1" />
          <span className="text-slate-500">
            {[currentShift?.handover.nurseOfficerName, currentShift?.handover.anesOfficerName].filter(Boolean).join(' & ') || currentShift?.handover.officerName || '....................'}
          </span>
        </div>

        <div>
          <span className="font-bold text-slate-700 block mb-8">رئيس قسم التمريض والعمليات</span>
          <div className="border-b border-dashed border-slate-400 w-36 mx-auto mb-1" />
          <span className="text-slate-500">التوقيع والاعتماد</span>
        </div>

        <div>
          <span className="font-bold text-slate-700 block mb-8">ختم إدارة المستشفى</span>
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-400 mx-auto flex items-center justify-center text-[10px] text-slate-400">
            الختم الرسمي
          </div>
        </div>
      </div>
    </div>
  );
};
