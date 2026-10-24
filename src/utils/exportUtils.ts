import { Shift, StaffMember, AppSettings } from '../types';
import { PERIOD_DEFINITIONS } from './fairnessEngine';

/**
 * Exports single shift or monthly shifts to an Excel-compatible CSV file with UTF-8 BOM
 */
export function exportShiftToExcel(shift: Shift, staffList: StaffMember[], settings: AppSettings) {
  const staffMap = new Map(staffList.map((s) => [s.id, s.name]));

  const rows: string[][] = [
    [`تقرير جدول الخفارة رقم ${shift.number} — ${settings.hospitalName}`],
    [`القسم: ${settings.departmentName}`, `التاريخ: ${shift.startDate} إلى ${shift.endDate}`],
    [`مسؤولا التسليم والاستلام: التمريض (${shift.handover.nurseOfficerName || 'غير محدد'}) | التخدير (${shift.handover.anesOfficerName || 'غير محدد'})`, `حالة الخفارة: ${shift.status}`],
    [],
    ['رقم الفترة', 'اسم الفترة', 'التوقيت', 'الممرض المسؤول', 'مساعد التخدير', 'فترة حرجة؟', 'حالة التغطية', 'ملاحظات التوزيع'],
  ];

  shift.assignments.forEach((assignment) => {
    const def = PERIOD_DEFINITIONS[assignment.periodIndex];
    const nurseName = assignment.nurseId ? staffMap.get(assignment.nurseId) || 'غير معروف' : 'شاغر';
    const anesName = assignment.anesthetistId ? staffMap.get(assignment.anesthetistId) || 'غير معروف' : 'شاغر';
    const isCritical = def.criticalHours > 0 ? `نعم (${def.criticalHours} ساعات حرجة)` : 'لا';
    const status = assignment.isCovered ? 'مغطاة بنجاح' : 'غير مكتملة';
    const notes = [assignment.nurseReason, assignment.anesthetistReason].filter(Boolean).join(' | ');

    rows.push([
      String(assignment.periodIndex + 1),
      def.label,
      def.displayTime,
      nurseName,
      anesName,
      isCritical,
      status,
      `"${notes.replace(/"/g, '""')}"`,
    ]);
  });

  if (shift.emergencyExits.length > 0) {
    rows.push([]);
    rows.push(['سجل حالات الخروج الطارئ والبدلاء']);
    rows.push(['اسم الموظف', 'الدور', 'وقت الخروج', 'وقت العودة', 'المدة (دقيقة)', 'السبب', 'البديل المكلف', 'الدقائق الحرجة']);
    shift.emergencyExits.forEach((exit) => {
      rows.push([
        exit.employeeName,
        exit.role === 'nurse' ? 'ممرض' : 'مساعد تخدير',
        exit.exitTime,
        exit.returnTime,
        String(exit.durationMinutes),
        `"${exit.reason.replace(/"/g, '""')}"`,
        exit.substituteName,
        String(exit.criticalMinutesOverlap),
      ]);
    });
  }

  // Convert to CSV with UTF-8 BOM
  const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `جدول_الخفارة_${shift.number}_${shift.startDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports monthly cumulative staff equity balance report to Excel CSV
 */
export function exportMonthlyReportToExcel(staffList: StaffMember[], shifts: Shift[], settings: AppSettings) {
  const rows: string[][] = [
    [`تقرير العدالة التراكمي الشهري (الـ 9 خفارات) — ${settings.hospitalName}`],
    [`القسم: ${settings.departmentName}`, `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`],
    [],
    [
      'م',
      'اسم الموظف',
      'التخصص / الدور',
      'الدرجة والتأهيل',
      'إجمالي ساعات العمل الفعلية',
      'ساعات التغطية الإضافية',
      'ساعات الفترة الحرجة (2-7 فجراً)',
      'مرات الفترات الليلية',
      'عدد الخفارات التي حضرها',
      'مرات مسؤول التسليم والاستلام',
    ],
  ];

  staffList.forEach((staff, idx) => {
    rows.push([
      String(idx + 1),
      staff.name,
      staff.role === 'nurse' ? 'تمريض' : 'مساعد تخدير',
      staff.qualification === 'specialist' ? 'أخصائي' : staff.qualification === 'senior' ? 'أقدم' : 'معتمد',
      String(staff.totalWorkHours),
      String(staff.totalExtraCoverageHours),
      String(staff.totalCriticalHours),
      String(staff.lateNightPeriodsCount),
      String(staff.shiftsAttendedCount),
      String(staff.handoverOfficerCount),
    ]);
  });

  const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `تقرير_العدالة_الشهري_NurseShift_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers clean browser print dialog with print styling
 */
export function printSchedule() {
  window.print();
}
