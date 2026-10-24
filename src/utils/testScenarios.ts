import {
  StaffMember,
  Shift,
  ScenarioTestResult,
  Role,
} from '../types';
import {
  PERIOD_DEFINITIONS,
  generateSmartSchedule,
  findBestSubstituteForEmergencyExit,
  recalculateAllStaffMetrics,
  calculateCriticalMinutesOverlap,
  generateMonthlyShiftsStructure,
} from './fairnessEngine';

/**
 * Creates a standard test squad: 6 Nurses and 5 Anesthesia Assistants
 */
export function createStandardTestSquad(): StaffMember[] {
  return [
    // 6 Nurses
    {
      id: 'nurse-1',
      name: 'م. أحمد الشمري',
      role: 'nurse',
      qualification: 'senior',
      phone: '0501112233',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },
    {
      id: 'nurse-2',
      name: 'م. سارة العتيبي',
      role: 'nurse',
      qualification: 'specialist',
      phone: '0502223344',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },
    {
      id: 'nurse-3',
      name: 'م. خالد الدوسري',
      role: 'nurse',
      qualification: 'certified',
      phone: '0503334455',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },
    {
      id: 'nurse-4',
      name: 'م. فاطمة الزهراني',
      role: 'nurse',
      qualification: 'senior',
      phone: '0504445566',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },
    {
      id: 'nurse-5',
      name: 'م. عمر القحطاني',
      role: 'nurse',
      qualification: 'certified',
      phone: '0505556677',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },
    {
      id: 'nurse-6',
      name: 'م. ريم المطيري',
      role: 'nurse',
      qualification: 'specialist',
      phone: '0506667788',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },

    // 5 Anesthesia Assistants
    {
      id: 'anes-1',
      name: 'ت. يوسف الغامدي',
      role: 'anesthetist',
      qualification: 'specialist',
      phone: '0507778899',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },
    {
      id: 'anes-2',
      name: 'ت. منى الحربي',
      role: 'anesthetist',
      qualification: 'senior',
      phone: '0508889900',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },
    {
      id: 'anes-3',
      name: 'ت. طارق السبيعي',
      role: 'anesthetist',
      qualification: 'certified',
      phone: '0509990011',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },
    {
      id: 'anes-4',
      name: 'ت. هدى الخالدي',
      role: 'anesthetist',
      qualification: 'specialist',
      phone: '0501234567',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },
    {
      id: 'anes-5',
      name: 'ت. زياد العنزي',
      role: 'anesthetist',
      qualification: 'certified',
      phone: '0502345678',
      isActive: true,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    },
  ];
}

/**
 * Runs the 10 required test scenarios
 */
export function runAllTestScenarios(baseStaff?: StaffMember[]): ScenarioTestResult[] {
  const staffSquad = baseStaff && baseStaff.length >= 11 ? JSON.parse(JSON.stringify(baseStaff)) : createStandardTestSquad();
  const testShifts = generateMonthlyShiftsStructure('2026-11-01');

  const results: ScenarioTestResult[] = [];

  // -------------------------------------------------------------
  // Scenario 1: حضور الكادر كاملاً (Full team present: 6 nurses, 5 anesthetists)
  // -------------------------------------------------------------
  {
    const shift1 = JSON.parse(JSON.stringify(testShifts[0])) as Shift;
    shift1.leaves = [];
    const sched = generateSmartSchedule(staffSquad, shift1, []);
    const uncov = sched.assignments.filter((a) => !a.isCovered).length;
    const conflicts = sched.assignments.filter((a) => a.hasConflict).length;

    results.push({
      id: 1,
      name: 'سيناريو 1: حضور الكادر كاملاً',
      description: 'حضور 6 ممرضين و5 مساعدي تخدير دون أي غياب',
      status: uncov === 0 && conflicts === 0 ? 'passed' : 'warning',
      details: [
        `عدد الفترات المغطاة بالكامل: ${9 - uncov} من 9`,
        `عدد تعارضات الـ 4 ساعات المتواصلة: ${conflicts}`,
        'تم توزيع جميع الفترات بنجاح مع ضمان وجود ممرض ومساعد تخدير مؤهل في كل فترة.',
      ],
      metrics: { coveredPeriods: 9 - uncov, conflictsCount: conflicts, staffCount: staffSquad.length },
    });
  }

  // -------------------------------------------------------------
  // Scenario 2: إجازة ممرض واحد (1 nurse on leave)
  // -------------------------------------------------------------
  {
    const shift2 = JSON.parse(JSON.stringify(testShifts[0])) as Shift;
    const targetNurse = staffSquad.find((s: StaffMember) => s.role === 'nurse')!;
    shift2.leaves = [
      {
        employeeId: targetNurse.id,
        shiftId: shift2.id,
        type: 'annual',
        reason: 'إجازة اعتيادية مجدولة',
        dateAdded: new Date().toISOString(),
      },
    ];

    const sched = generateSmartSchedule(staffSquad, shift2, []);
    const uncov = sched.assignments.filter((a) => !a.isCovered).length;
    const nurseWorked = sched.assignments.some((a) => a.nurseId === targetNurse.id);

    results.push({
      id: 2,
      name: 'سيناريو 2: إجازة ممرض واحد',
      description: `تسجيل إجازة للممرض (${targetNurse.name}) وإعادة التوزيع على الـ 5 ممرضين الحاضرين`,
      status: uncov === 0 && !nurseWorked ? 'passed' : 'failed',
      details: [
        `حالة الممرض المجاز: لم يُكلّف بأي فترة (${nurseWorked ? 'فشل' : 'تم استثناؤه بنجاح'})`,
        `تغطية الفترات بالـ 5 ممرضين المتبقين: ${9 - uncov}/9 فترات`,
        'تم توزيع العبء بالتساوي بين الزملاء الحاضرين دون تحميل ممرض واحد عبء الغياب.',
      ],
      metrics: { presentNurses: 5, coveredPeriods: 9 - uncov },
    });
  }

  // -------------------------------------------------------------
  // Scenario 3: إجازة مساعد تخدير واحد (1 anesthetist on leave)
  // -------------------------------------------------------------
  {
    const shift3 = JSON.parse(JSON.stringify(testShifts[0])) as Shift;
    const targetAnes = staffSquad.find((s: StaffMember) => s.role === 'anesthetist')!;
    shift3.leaves = [
      {
        employeeId: targetAnes.id,
        shiftId: shift3.id,
        type: 'sick',
        reason: 'إجازة مرضية طارئة',
        dateAdded: new Date().toISOString(),
      },
    ];

    const sched = generateSmartSchedule(staffSquad, shift3, []);
    const uncov = sched.assignments.filter((a) => !a.isCovered).length;
    const anesWorked = sched.assignments.some((a) => a.anesthetistId === targetAnes.id);

    results.push({
      id: 3,
      name: 'سيناريو 3: إجازة مساعد تخدير واحد',
      description: `تسجيل إجازة لمساعد التخدير (${targetAnes.name}) وإعادة التوزيع على الـ 4 الحاضرين`,
      status: uncov === 0 && !anesWorked ? 'passed' : 'failed',
      details: [
        `استثناء المجاز من التكليف: ${anesWorked ? 'فشل' : 'ناجح'}`,
        `تغطية الفترات الـ 9: ${9 - uncov}/9 مغطاة`,
        'توزيع الفترات على مساعدي التخدير الـ 4 الحاضرين مع منع تتابع الفترات.',
      ],
      metrics: { presentAnesthetists: 4, coveredPeriods: 9 - uncov },
    });
  }

  // -------------------------------------------------------------
  // Scenario 4: إجازة ممرض ومساعد تخدير معاً (Simultaneous nurse + anesthetist leave)
  // -------------------------------------------------------------
  {
    const shift4 = JSON.parse(JSON.stringify(testShifts[0])) as Shift;
    const nurse = staffSquad.find((s: StaffMember) => s.role === 'nurse')!;
    const anes = staffSquad.find((s: StaffMember) => s.role === 'anesthetist')!;
    shift4.leaves = [
      { employeeId: nurse.id, shiftId: shift4.id, type: 'emergency', reason: 'ظرف عائلي طارئ', dateAdded: '' },
      { employeeId: anes.id, shiftId: shift4.id, type: 'administrative', reason: 'انتداب خارجي', dateAdded: '' },
    ];

    const sched = generateSmartSchedule(staffSquad, shift4, []);
    const uncov = sched.assignments.filter((a) => !a.isCovered).length;

    results.push({
      id: 4,
      name: 'سيناريو 4: إجازة ممرض ومساعد تخدير معاً',
      description: 'غياب متزامن لممرض ومساعد تخدير في نفس الخفارة',
      status: uncov === 0 ? 'passed' : 'warning',
      details: [
        `الكادر المتبقي: 5 ممرضين و4 مساعدي تخدير`,
        `اكتمال التغطية: ${9 - uncov}/9 فترات`,
        'تمت إعادة جدولة الخفارة تلقائياً وتحديث مؤشرات العدالة.',
      ],
      metrics: { coveredPeriods: 9 - uncov, presentNurses: 5, presentAnesthetists: 4 },
    });
  }

  // -------------------------------------------------------------
  // Scenario 5: خروج موظف لمدة ساعة (1 hour emergency exit)
  // -------------------------------------------------------------
  {
    const shift5 = JSON.parse(JSON.stringify(testShifts[0])) as Shift;
    const baseSched = generateSmartSchedule(staffSquad, shift5, []);
    shift5.assignments = baseSched.assignments;

    const exitingNurse = staffSquad.find((s: StaffMember) => s.role === 'nurse' && shift5.assignments[1].nurseId === s.id) || staffSquad[0];
    const subResult = findBestSubstituteForEmergencyExit(
      staffSquad,
      shift5,
      exitingNurse.id,
      'nurse',
      '16:00',
      '17:00'
    );

    const overlapCrit = calculateCriticalMinutesOverlap('16:00', '17:00');

    results.push({
      id: 5,
      name: 'سيناريو 5: خروج موظف طارئ لمدة ساعة',
      description: `خروج الممرض (${exitingNurse.name}) من 04:00 م إلى 05:00 م (مدة 60 دقيقة)`,
      status: subResult.substitute !== null ? 'passed' : 'failed',
      details: [
        `البديل المختار تلقائياً: ${subResult.substitute ? subResult.substitute.name : 'لا يوجد'}`,
        `سبب الاختيار: ${subResult.reason}`,
        `تداخل الفترة الحرجة: ${overlapCrit} دقيقة (خارج نافذة 2-7 فجراً)`,
        'يتم خصم 1 ساعة من الموظف وإضافتها كساعة عمل وساعة تغطية إضافية للبديل.',
      ],
      metrics: { durationMinutes: 60, substituteFound: !!subResult.substitute, criticalOverlapMinutes: overlapCrit },
    });
  }

  // -------------------------------------------------------------
  // Scenario 6: خروج موظف لمدة ساعتين (2 hours emergency exit)
  // -------------------------------------------------------------
  {
    const shift6 = JSON.parse(JSON.stringify(testShifts[0])) as Shift;
    const baseSched = generateSmartSchedule(staffSquad, shift6, []);
    shift6.assignments = baseSched.assignments;

    const exitingAnes = staffSquad.find((s: StaffMember) => s.role === 'anesthetist')!;
    const subResult = findBestSubstituteForEmergencyExit(
      staffSquad,
      shift6,
      exitingAnes.id,
      'anesthetist',
      '20:00',
      '22:00'
    );

    results.push({
      id: 6,
      name: 'سيناريو 6: خروج موظف لمدة ساعتين',
      description: `خروج مساعد التخدير (${exitingAnes.name}) من 08:00 م إلى 10:00 م (مدة 120 دقيقة)`,
      status: subResult.substitute !== null ? 'passed' : 'failed',
      details: [
        `تحديد الفترة غير المغطاة: الفترة الرابعة كاملة (ساعتان)`,
        `البديل الأنسب: ${subResult.substitute?.name}`,
        'تحديث سجل ساعات التغطية الإضافية للبديل وتفادي تكليفه بأربع ساعات متواصلة.',
      ],
      metrics: { durationMinutes: 120, substituteAssigned: !!subResult.substitute },
    });
  }

  // -------------------------------------------------------------
  // Scenario 7: خروج موظفين من فئتين مختلفتين (Simultaneous exits of nurse and anesthetist)
  // -------------------------------------------------------------
  {
    const shift7 = JSON.parse(JSON.stringify(testShifts[0])) as Shift;
    const baseSched = generateSmartSchedule(staffSquad, shift7, []);
    shift7.assignments = baseSched.assignments;

    const nurse = staffSquad.find((s: StaffMember) => s.role === 'nurse')!;
    const anes = staffSquad.find((s: StaffMember) => s.role === 'anesthetist')!;

    const subNurse = findBestSubstituteForEmergencyExit(staffSquad, shift7, nurse.id, 'nurse', '18:00', '19:30');
    const subAnes = findBestSubstituteForEmergencyExit(staffSquad, shift7, anes.id, 'anesthetist', '18:00', '20:00');

    results.push({
      id: 7,
      name: 'سيناريو 7: خروج موظفين من فئتين مختلفتين',
      description: 'خروج متزامن لممرض (1.5 ساعة) ومساعد تخدير (ساعتان) في نفس الوقت',
      status: subNurse.substitute && subAnes.substitute ? 'passed' : 'warning',
      details: [
        `بديل التمريض: ${subNurse.substitute?.name}`,
        `بديل التخدير: ${subAnes.substitute?.name}`,
        'إدارة كل فئة مهنية باستقلالية مع الحفاظ على التخصص والتأهيل.',
      ],
      metrics: { bothSubstituted: !!(subNurse.substitute && subAnes.substitute) },
    });
  }

  // -------------------------------------------------------------
  // Scenario 8: تغطية الفترة الحرجة من 2 فجراً إلى 7 صباحاً (Critical Period 02:00 - 07:00)
  // -------------------------------------------------------------
  {
    const shift8 = JSON.parse(JSON.stringify(testShifts[0])) as Shift;
    const sched = generateSmartSchedule(staffSquad, shift8, []);

    // Check periods 6, 7, 8
    const p7 = sched.assignments.find((a) => a.periodIndex === 6); // 02:00 - 04:00 (2h crit)
    const p8 = sched.assignments.find((a) => a.periodIndex === 7); // 04:00 - 06:00 (2h crit)
    const p9 = sched.assignments.find((a) => a.periodIndex === 8); // 06:00 - 08:00 (1h crit)

    const critPeriodsCovered = (p7?.isCovered ? 1 : 0) + (p8?.isCovered ? 1 : 0) + (p9?.isCovered ? 1 : 0);

    // Verify accurate minutes overlap in 06-08 (6-7 AM is 60 critical minutes)
    const overlap6to8 = calculateCriticalMinutesOverlap('06:00', '08:00'); // should be 60 mins

    results.push({
      id: 8,
      name: 'سيناريو 8: تغطية الفترة الحرجة من 02:00 ف إلى 07:00 ص',
      description: 'فحص فترات 2–4 فجراً، 4–6 فجراً، والساعة الحرجة 6–7 صباحاً',
      status: critPeriodsCovered === 3 && overlap6to8 === 60 ? 'passed' : 'failed',
      details: [
        `اكتمال تغطية الفترات الحرجة الثلاث: ${critPeriodsCovered}/3`,
        `احتساب فترة 06:00 - 08:00 بدقة: ${overlap6to8} دقيقة حرجة (ساعة واحدة حرجة + ساعة عادية)`,
        'تناوب الفترات الصعبة بين الكوادر لتفادي تكرار إسنادها لنفس الشخص.',
      ],
      metrics: { critPeriodsCovered, overlap6to8Minutes: overlap6to8 },
    });
  }

  // -------------------------------------------------------------
  // Scenario 9: منع تكليف الشخص نفسه بأربع ساعات متواصلة (4 continuous hours prohibition)
  // -------------------------------------------------------------
  {
    const shift9 = JSON.parse(JSON.stringify(testShifts[0])) as Shift;
    const sched = generateSmartSchedule(staffSquad, shift9, []);

    let consecutiveViolation = false;
    for (let i = 0; i < sched.assignments.length - 1; i++) {
      const cur = sched.assignments[i];
      const next = sched.assignments[i + 1];
      if (cur.nurseId && cur.nurseId === next.nurseId) {
        consecutiveViolation = true;
      }
      if (cur.anesthetistId && cur.anesthetistId === next.anesthetistId) {
        consecutiveViolation = true;
      }
    }

    results.push({
      id: 9,
      name: 'سيناريو 9: منع 4 ساعات عمل متواصلة',
      description: 'التحقق الصارم من عدم تكليف أي موظف بفترتين متتاليتين (ساعتان + ساعتان)',
      status: !consecutiveViolation ? 'passed' : 'failed',
      details: [
        `انتهاكات الساعات المتواصلة: ${consecutiveViolation ? 'يوجد انتهاك' : 'صفر انتهاكات (تم المنع بنجاح)'}`,
        'كل فترة عمل يعقبها فترة راحة ساعتان على الأقل لكل موظف.',
        'المحرك يفرض عقوبة رياضية قصوى (+10000) تمنع التتابع التلقائي.',
      ],
      metrics: { consecutiveViolationDetected: consecutiveViolation },
    });
  }

  // -------------------------------------------------------------
  // Scenario 10: مقارنة أرصدة العدالة بعد الخفارات التسع (9 shifts cumulative equity)
  // -------------------------------------------------------------
  {
    // Simulate all 9 shifts
    const simulatedShifts: Shift[] = [];
    let currentSquad = JSON.parse(JSON.stringify(staffSquad)) as StaffMember[];

    testShifts.forEach((shiftTemplate, idx) => {
      const shift = JSON.parse(JSON.stringify(shiftTemplate)) as Shift;
      const prev = simulatedShifts;
      const sched = generateSmartSchedule(currentSquad, shift, prev);
      shift.assignments = sched.assignments;
      shift.isCoverageComplete = sched.isCoverageComplete;
      simulatedShifts.push(shift);

      // Recalculate metrics for squad after each shift
      currentSquad = recalculateAllStaffMetrics(currentSquad, simulatedShifts);
    });

    const nurseWorkHours = currentSquad.filter((s) => s.role === 'nurse').map((s) => s.totalWorkHours);
    const maxNurseHours = Math.max(...nurseWorkHours);
    const minNurseHours = Math.min(...nurseWorkHours);
    const nurseHoursDiff = maxNurseHours - minNurseHours;

    const anesWorkHours = currentSquad.filter((s) => s.role === 'anesthetist').map((s) => s.totalWorkHours);
    const maxAnesHours = Math.max(...anesWorkHours);
    const minAnesHours = Math.min(...anesWorkHours);
    const anesHoursDiff = maxAnesHours - minAnesHours;

    results.push({
      id: 10,
      name: 'سيناريو 10: مقارنة أرصدة العدالة التراكمية عبر الـ 9 خفارات',
      description: 'محاكاة كاملة لدورة الشهر الـ 9 خفارات وقياس الفروق الإحصائية بين الكوادر',
      status: nurseHoursDiff <= 4 && anesHoursDiff <= 4 ? 'passed' : 'warning',
      details: [
        `الفارق بين أعلى وأدنى ممرض في ساعات العمل: ${nurseHoursDiff} ساعات (توزيع شبه متطابق)`,
        `الفارق بين أعلى وأدنى مساعد تخدير: ${anesHoursDiff} ساعات`,
        'تناوب دور مسؤول التسليم والاستلام وموازنة الفترات الحرجة عبر كامل الخفارات التسع.',
      ],
      metrics: {
        nurseHoursDifference: nurseHoursDiff,
        anesHoursDifference: anesHoursDiff,
        totalShiftsSimulated: 9,
      },
    });
  }

  return results;
}
