import {
  PeriodDefinition,
  PeriodAssignment,
  StaffMember,
  Shift,
  Role,
  EmergencyExit,
  HandoverRecord,
} from '../types';

export const PERIOD_DEFINITIONS: PeriodDefinition[] = [
  {
    index: 0,
    label: 'الفترة الأولى',
    startTime: '14:00',
    endTime: '16:00',
    displayTime: '02:00 م - 04:00 م',
    isLateNight: false,
    criticalHours: 0,
    totalDurationHours: 2,
  },
  {
    index: 1,
    label: 'الفترة الثانية',
    startTime: '16:00',
    endTime: '18:00',
    displayTime: '04:00 م - 06:00 م',
    isLateNight: false,
    criticalHours: 0,
    totalDurationHours: 2,
  },
  {
    index: 2,
    label: 'الفترة الثالثة',
    startTime: '18:00',
    endTime: '20:00',
    displayTime: '06:00 م - 08:00 م',
    isLateNight: false,
    criticalHours: 0,
    totalDurationHours: 2,
  },
  {
    index: 3,
    label: 'الفترة الرابعة',
    startTime: '20:00',
    endTime: '22:00',
    displayTime: '08:00 م - 10:00 م',
    isLateNight: false,
    criticalHours: 0,
    totalDurationHours: 2,
  },
  {
    index: 4,
    label: 'الفترة الخامسة',
    startTime: '22:00',
    endTime: '00:00',
    displayTime: '10:00 م - 12:00 منتصف الليل',
    isLateNight: true,
    criticalHours: 0,
    totalDurationHours: 2,
  },
  {
    index: 5,
    label: 'الفترة السادسة',
    startTime: '00:00',
    endTime: '02:00',
    displayTime: '12:00 منتصف الليل - 02:00 فجراً',
    isLateNight: true,
    criticalHours: 0,
    totalDurationHours: 2,
  },
  {
    index: 6,
    label: 'الفترة السابعة (حرجة)',
    startTime: '02:00',
    endTime: '04:00',
    displayTime: '02:00 فجراً - 04:00 فجراً',
    isLateNight: true,
    criticalHours: 2, // 2.0 hours inside critical window 02:00-07:00
    totalDurationHours: 2,
  },
  {
    index: 7,
    label: 'الفترة الثامنة (حرجة)',
    startTime: '04:00',
    endTime: '06:00',
    displayTime: '04:00 فجراً - 06:00 فجراً',
    isLateNight: true,
    criticalHours: 2, // 2.0 hours inside critical window 02:00-07:00
    totalDurationHours: 2,
  },
  {
    index: 8,
    label: 'الفترة التاسعة (حرجة جزئياً)',
    startTime: '06:00',
    endTime: '08:00',
    displayTime: '06:00 فجراً - 08:00 صباحاً',
    isLateNight: false,
    criticalHours: 1, // Exactly 1 hour (06:00-07:00) is critical, 07:00-08:00 is normal
    totalDurationHours: 2,
  },
];

/**
 * Calculates exact overlap in minutes between a given time range and the Critical Window (02:00 to 07:00 next day)
 */
export function calculateCriticalMinutesOverlap(startTimeStr: string, endTimeStr: string): number {
  const parseTimeToDayMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    // In our 18-hour shift starting at 14:00 on Day 1:
    // 14:00 = 0 mins
    // 23:59 = 9h 59m = 599 mins
    // 00:00 Day 2 = 10h = 600 mins
    // 02:00 Day 2 = 12h = 720 mins (Critical Start)
    // 07:00 Day 2 = 17h = 1020 mins (Critical End)
    // 08:00 Day 2 = 18h = 1080 mins (Shift End)
    let offsetHours = h >= 14 ? h - 14 : h + 10;
    return offsetHours * 60 + m;
  };

  const startMins = parseTimeToDayMinutes(startTimeStr);
  const endMins = parseTimeToDayMinutes(endTimeStr);

  const criticalStartMins = 12 * 60; // 02:00 is 12 hours into the shift
  const criticalEndMins = 17 * 60; // 07:00 is 17 hours into the shift

  const overlapStart = Math.max(startMins, criticalStartMins);
  const overlapEnd = Math.min(endMins, criticalEndMins);

  if (overlapEnd > overlapStart) {
    return overlapEnd - overlapStart;
  }
  return 0;
}

/**
 * Scores an individual candidate staff member for a specific period to ensure fair distribution.
 * Lower score = higher priority for assignment!
 */
export function computeBurdenScore(
  member: StaffMember,
  periodDef: PeriodDefinition,
  assignedPeriodsInCurrentShift: number[],
  lastAssignedPeriodIndex: number | null,
  previousShiftHadCritical: boolean
): { score: number; reason: string; hasConsecutiveConflict: boolean } {
  let score = 0;
  const reasons: string[] = [];
  let hasConsecutiveConflict = false;

  // 1. Total actual work hours weight
  score += member.totalWorkHours * 10;

  // 2. Extra coverage hours weight (reward colleagues who covered for others by lowering their current burden priority)
  score += member.totalExtraCoverageHours * 8;

  // 3. Current shift periods count
  const periodsInShift = assignedPeriodsInCurrentShift.length;
  score += periodsInShift * 40; // High weight to evenly distribute slots across this shift

  // 4. Consecutive work check: PREVENT 4 HOURS CONTINUOUS WORK
  const hasAdjacentPeriod = assignedPeriodsInCurrentShift.some(
    (idx) => Math.abs(idx - periodDef.index) === 1
  );

  if (hasAdjacentPeriod) {
    // Direct consecutive period! (2h + 2h = 4h continuous)
    hasConsecutiveConflict = true;
    score += 10000; // Massive penalty
    reasons.push('تحذير: عمل 4 ساعات متواصلة');
  } else if (assignedPeriodsInCurrentShift.length > 0) {
    const minDistance = Math.min(
      ...assignedPeriodsInCurrentShift.map((idx) => Math.abs(idx - periodDef.index))
    );
    if (minDistance === 2) {
      score -= 5;
      reasons.push('راحة ساعتان سابقة/لاحقة');
    } else if (minDistance >= 3) {
      score -= 20;
      reasons.push(`مرتاح منذ/قبل ${minDistance * 2} ساعات`);
    }
  } else {
    // Has not worked yet in this shift
    score -= 30;
    reasons.push('لم يعمل في هذه الخفارة بعد');
  }

  // 5. Critical period fairness (02:00 - 07:00)
  if (periodDef.criticalHours > 0) {
    // Cumulative critical hours weight
    score += member.totalCriticalHours * 25;

    // Do not assign critical period in consecutive shifts if alternatives exist
    if (previousShiftHadCritical || member.consecutiveShiftsWithCritical > 0) {
      score += 500;
      reasons.push('كلّف بفترة حرجة في الخفارة السابقة');
    } else {
      score -= 15;
      reasons.push('مستحق للتكليف الحرج بالتناوب');
    }
  }

  // 6. Late night periods frequency
  if (periodDef.isLateNight) {
    score += member.lateNightPeriodsCount * 12;
  }

  // Reason summary
  let reasonSummary = reasons.join(' • ');
  if (!reasonSummary) {
    reasonSummary = `رصيد عمل: ${member.totalWorkHours}س | رصيد حرج: ${member.totalCriticalHours}س`;
  } else {
    reasonSummary += ` (إجمالي عمل: ${member.totalWorkHours}س، حرج: ${member.totalCriticalHours}س)`;
  }

  return { score, reason: reasonSummary, hasConsecutiveConflict };
}

/**
 * Smart Scheduler Engine: Distributes the 9 periods across present, qualified staff members
 * while enforcing the 4-hour consecutive rule and balancing critical hours.
 * The two designated Handover Officers (one Nurse, one Anesthetist) are permanently locked
 * at Period 0 (14:00-16:00, arrival to receive from morning shift) and Period 8 (06:00-08:00,
 * handover to next incoming morning shift).
 */
export function generateSmartSchedule(
  allStaff: StaffMember[],
  shift: Shift,
  previousShifts: Shift[]
): {
  assignments: PeriodAssignment[];
  isCoverageComplete: boolean;
  warnings: string[];
  handoverOfficers: {
    nurseOfficer: StaffMember | null;
    anesOfficer: StaffMember | null;
  };
} {
  const warnings: string[] = [];

  // Filter present staff (excluding staff on leave for this shift)
  const leaveEmployeeIds = new Set(shift.leaves.map((l) => l.employeeId));
  const activeStaff = allStaff.filter((s) => s.isActive);
  const presentStaff = activeStaff.filter((s) => !leaveEmployeeIds.has(s.id));

  const presentNurses = presentStaff.filter((s) => s.role === 'nurse');
  const presentAnesthetists = presentStaff.filter((s) => s.role === 'anesthetist');

  // Safety checks
  if (presentNurses.length === 0) {
    warnings.push('تنبيه عجز أمني حرج: لا يوجد أي ممرض حاضر في هذه الخفارة!');
  }
  if (presentAnesthetists.length === 0) {
    warnings.push('تنبيه عجز أمني حرج: لا يوجد أي مساعد تخدير حاضر في هذه الخفارة!');
  }

  // Minimum safe threshold: need at least 2 of each role to cleanly avoid 4 continuous hours across 9 periods
  if (presentNurses.length === 1) {
    warnings.push('تحذير نقص كادر: ممرض واحد فقط حاضر، سيتعذر منع الـ 4 ساعات المتواصلة وسيتطلب استثناء المشرف');
  }
  if (presentAnesthetists.length === 1) {
    warnings.push('تحذير نقص كادر: مساعد تخدير واحد حاضر، سيتعذر منع الـ 4 ساعات المتواصلة وسيتطلب استثناء المشرف');
  }

  // 1. Identify Handover Officers (one nurse, one anesthetist):
  // According to hospital protocol, they must be fixed at Period 0 (14:00 - 16:00, receipt from morning shift)
  // and Period 8 (06:00 - 08:00, handover to next incoming morning shift).
  let handoverNurse: StaffMember | null = null;
  let handoverAnes: StaffMember | null = null;

  // Resolve Nurse Officer
  if (shift.handover?.nurseOfficerId) {
    handoverNurse = presentNurses.find((n) => n.id === shift.handover.nurseOfficerId) || null;
  }
  if (!handoverNurse && shift.handover?.nurseOfficerName && shift.handover.nurseOfficerName !== 'لم يحدد بعد') {
    handoverNurse = presentNurses.find((n) => n.name.trim() === shift.handover.nurseOfficerName?.trim()) || null;
  }

  // Resolve Anesthetist Officer
  if (shift.handover?.anesOfficerId) {
    handoverAnes = presentAnesthetists.find((a) => a.id === shift.handover.anesOfficerId) || null;
  }
  if (!handoverAnes && shift.handover?.anesOfficerName && shift.handover.anesOfficerName !== 'لم يحدد بعد') {
    handoverAnes = presentAnesthetists.find((a) => a.name.trim() === shift.handover.anesOfficerName?.trim()) || null;
  }

  // Fallback fair selection if not yet chosen or not present
  const fairPair = selectFairHandoverOfficers(presentStaff, shift);
  if (!handoverNurse && presentNurses.length > 0) {
    handoverNurse = fairPair.nurseOfficer
      ? presentNurses.find((n) => n.id === fairPair.nurseOfficer!.id) || presentNurses[0]
      : presentNurses[0];
  }
  if (!handoverAnes && presentAnesthetists.length > 0) {
    handoverAnes = fairPair.anesOfficer
      ? presentAnesthetists.find((a) => a.id === fairPair.anesOfficer!.id) || presentAnesthetists[0]
      : presentAnesthetists[0];
  }

  // Map to track periods assigned to each staff in current shift
  const nurseAssignmentsMap = new Map<string, number[]>();
  const anesthetistAssignmentsMap = new Map<string, number[]>();

  presentNurses.forEach((n) => nurseAssignmentsMap.set(n.id, []));
  presentAnesthetists.forEach((a) => anesthetistAssignmentsMap.set(a.id, []));

  // Determine if a staff member worked critical period in the immediate previous shift
  const previousShift = previousShifts.length > 0 ? previousShifts[previousShifts.length - 1] : null;
  const staffHadCriticalInPrevShift = new Set<string>();
  if (previousShift) {
    previousShift.assignments.forEach((assignment) => {
      const def = PERIOD_DEFINITIONS[assignment.periodIndex];
      if (def && def.criticalHours > 0) {
        if (assignment.nurseId) staffHadCriticalInPrevShift.add(assignment.nurseId);
        if (assignment.anesthetistId) staffHadCriticalInPrevShift.add(assignment.anesthetistId);
      }
    });
  }

  // Pre-allocate slots for Period 0 and Period 8 with the two designated Handover Officers
  if (handoverNurse) {
    nurseAssignmentsMap.set(handoverNurse.id, [0, 8]);
  }
  if (handoverAnes) {
    anesthetistAssignmentsMap.set(handoverAnes.id, [0, 8]);
  }

  const assignments: PeriodAssignment[] = new Array(PERIOD_DEFINITIONS.length);
  let isComplete = true;

  // Set Period 0 (02:00 م - 04:00 م / أول الجدول - استلام المناوبة من الصباحي)
  assignments[0] = {
    periodIndex: 0,
    nurseId: handoverNurse ? handoverNurse.id : null,
    anesthetistId: handoverAnes ? handoverAnes.id : null,
    nurseReason: handoverNurse
      ? `مسؤول استلام التمريض: استلام الحالات والمواد من المناوبة الصباحية (14:00)`
      : 'شاغر — لا يوجد ممرض استلام متاح',
    anesthetistReason: handoverAnes
      ? `مسؤول استلام التخدير: استلام أجهزة الإنعاش والتنفس من المناوبة الصباحية (14:00)`
      : 'شاغر — لا يوجد مساعد تخدير استلام متاح',
    isCovered: handoverNurse !== null && handoverAnes !== null,
    hasConflict: false,
    conflictReason: null,
    isManualOverride: false,
  };

  // Set Period 8 (06:00 ص - 08:00 ص / نهاية الجدول - تسليم المناوبة للصباحي التالي)
  assignments[8] = {
    periodIndex: 8,
    nurseId: handoverNurse ? handoverNurse.id : null,
    anesthetistId: handoverAnes ? handoverAnes.id : null,
    nurseReason: handoverNurse
      ? `مسؤول تسليم التمريض: تسليم الحالات والمواد للوجبة الصباحية التالية (08:00)`
      : 'شاغر — لا يوجد ممرض تسليم متاح',
    anesthetistReason: handoverAnes
      ? `مسؤول تسليم التخدير: تسليم أجهزة الإنعاش والتنفس للوجبة الصباحية التالية (08:00)`
      : 'شاغر — لا يوجد مساعد تخدير تسليم متاح',
    isCovered: handoverNurse !== null && handoverAnes !== null,
    hasConflict: false,
    conflictReason: null,
    isManualOverride: false,
  };

  if (!assignments[0].isCovered) isComplete = false;
  if (!assignments[8].isCovered) isComplete = false;

  // Process intermediate periods sequentially (Periods 1 to 7)
  for (let i = 1; i <= 7; i++) {
    const periodDef = PERIOD_DEFINITIONS[i];

    // Pick best nurse
    let selectedNurse: StaffMember | null = null;
    let selectedNurseReason = '';
    let nurseConflict = false;
    let nurseConflictReason: string | null = null;

    if (presentNurses.length > 0) {
      const candidates = presentNurses.map((n) => {
        const assignedPeriods = nurseAssignmentsMap.get(n.id) || [];
        const prevCrit = staffHadCriticalInPrevShift.has(n.id);
        const { score, reason, hasConsecutiveConflict } = computeBurdenScore(
          n,
          periodDef,
          assignedPeriods,
          null,
          prevCrit
        );
        return { member: n, score, reason, hasConsecutiveConflict };
      });

      // Sort candidates by lowest score
      candidates.sort((a, b) => a.score - b.score);
      const chosen = candidates[0];
      selectedNurse = chosen.member;
      selectedNurseReason = chosen.reason;
      if (chosen.hasConsecutiveConflict) {
        nurseConflict = true;
        nurseConflictReason = 'تعارض: عمل 4 ساعات متواصلة للممرض بسبب نقص الكادر';
      }

      // Record assignment
      const currentList = nurseAssignmentsMap.get(chosen.member.id) || [];
      nurseAssignmentsMap.set(chosen.member.id, [...currentList, i]);
    } else {
      selectedNurseReason = 'شاغر — لا يوجد ممرض مؤهل متاح';
      isComplete = false;
    }

    // Pick best anesthetist
    let selectedAnesthetist: StaffMember | null = null;
    let selectedAnesthetistReason = '';
    let anesthetistConflict = false;
    let anesthetistConflictReason: string | null = null;

    if (presentAnesthetists.length > 0) {
      const candidates = presentAnesthetists.map((a) => {
        const assignedPeriods = anesthetistAssignmentsMap.get(a.id) || [];
        const prevCrit = staffHadCriticalInPrevShift.has(a.id);
        const { score, reason, hasConsecutiveConflict } = computeBurdenScore(
          a,
          periodDef,
          assignedPeriods,
          null,
          prevCrit
        );
        return { member: a, score, reason, hasConsecutiveConflict };
      });

      candidates.sort((a, b) => a.score - b.score);
      const chosen = candidates[0];
      selectedAnesthetist = chosen.member;
      selectedAnesthetistReason = chosen.reason;
      if (chosen.hasConsecutiveConflict) {
        anesthetistConflict = true;
        anesthetistConflictReason = 'تعارض: عمل 4 ساعات متواصلة لمساعد التخدير بسبب نقص الكادر';
      }

      const currentList = anesthetistAssignmentsMap.get(chosen.member.id) || [];
      anesthetistAssignmentsMap.set(chosen.member.id, [...currentList, i]);
    } else {
      selectedAnesthetistReason = 'شاغر — لا يوجد مساعد تخدير مؤهل متاح';
      isComplete = false;
    }

    const hasConflict = nurseConflict || anesthetistConflict;
    const conflictReason = [nurseConflictReason, anesthetistConflictReason].filter(Boolean).join(' | ') || null;

    assignments[i] = {
      periodIndex: i,
      nurseId: selectedNurse ? selectedNurse.id : null,
      anesthetistId: selectedAnesthetist ? selectedAnesthetist.id : null,
      nurseReason: selectedNurseReason,
      anesthetistReason: selectedAnesthetistReason,
      isCovered: selectedNurse !== null && selectedAnesthetist !== null,
      hasConflict,
      conflictReason,
      isManualOverride: false,
    };
  }

  // Check if all periods are covered
  const uncoveredCount = assignments.filter((a) => !a.isCovered).length;
  if (uncoveredCount > 0) {
    isComplete = false;
    warnings.push(`يوجد عدد ${uncoveredCount} فترات غير مغطاة بالكامل بكادر مؤهل!`);
  }

  return {
    assignments,
    isCoverageComplete: isComplete,
    warnings,
    handoverOfficers: {
      nurseOfficer: handoverNurse,
      anesOfficer: handoverAnes,
    },
  };
}

/**
 * Finds the most suitable qualified substitute for an emergency short exit (1 or 2 hours)
 */
export function findBestSubstituteForEmergencyExit(
  allStaff: StaffMember[],
  shift: Shift,
  exitingStaffId: string,
  role: Role,
  exitTimeStr: string,
  returnTimeStr: string
): { substitute: StaffMember | null; reason: string; warnings: string[] } {
  const warnings: string[] = [];
  const leaveEmployeeIds = new Set(shift.leaves.map((l) => l.employeeId));

  // Eligible pool: Active staff with same role, not on leave, not the exiting person
  const candidates = allStaff.filter(
    (s) => s.isActive && s.role === role && s.id !== exitingStaffId && !leaveEmployeeIds.has(s.id)
  );

  if (candidates.length === 0) {
    return {
      substitute: null,
      reason: 'لا يوجد بديل مؤهل متاح من نفس التخصص',
      warnings: ['تعذر العثور على بديل: جميع الكوادر إما مجازون أو غير متاحين'],
    };
  }

  // Check who is already on duty during this period
  // Determine affected period indices by checking overlap
  const affectedPeriods: number[] = [];
  for (let i = 0; i < PERIOD_DEFINITIONS.length; i++) {
    const p = PERIOD_DEFINITIONS[i];
    // Simple check: does exit/return intersect with period
    const assignment = shift.assignments.find((a) => a.periodIndex === i);
    if (assignment) {
      if ((role === 'nurse' && assignment.nurseId === exitingStaffId) ||
          (role === 'anesthetist' && assignment.anesthetistId === exitingStaffId)) {
        affectedPeriods.push(i);
      }
    }
  }

  // Score candidates
  const scoredCandidates = candidates.map((cand) => {
    let score = cand.totalWorkHours * 10 + cand.totalExtraCoverageHours * 8;

    // Check if this candidate is already assigned to the affected period(s)
    let isBusyInPeriod = false;
    let hasConsecutiveIssue = false;

    affectedPeriods.forEach((pIdx) => {
      const assignment = shift.assignments.find((a) => a.periodIndex === pIdx);
      if (assignment) {
        if ((role === 'nurse' && assignment.nurseId === cand.id) ||
            (role === 'anesthetist' && assignment.anesthetistId === cand.id)) {
          isBusyInPeriod = true;
        }
      }

      // Check adjacent periods to avoid 4 continuous hours
      const prevAssignment = shift.assignments.find((a) => a.periodIndex === pIdx - 1);
      const nextAssignment = shift.assignments.find((a) => a.periodIndex === pIdx + 1);

      if (prevAssignment && ((role === 'nurse' && prevAssignment.nurseId === cand.id) || (role === 'anesthetist' && prevAssignment.anesthetistId === cand.id))) {
        hasConsecutiveIssue = true;
      }
      if (nextAssignment && ((role === 'nurse' && nextAssignment.nurseId === cand.id) || (role === 'anesthetist' && nextAssignment.anesthetistId === cand.id))) {
        hasConsecutiveIssue = true;
      }
    });

    if (isBusyInPeriod) {
      score += 50000; // Cannot substitute for oneself or during own slot
    }
    if (hasConsecutiveIssue) {
      score += 2000;
    }

    // Critical hours overlap
    const criticalMins = calculateCriticalMinutesOverlap(exitTimeStr, returnTimeStr);
    if (criticalMins > 0) {
      score += cand.totalCriticalHours * 20;
    }

    return {
      member: cand,
      score,
      isBusyInPeriod,
      hasConsecutiveIssue,
    };
  });

  scoredCandidates.sort((a, b) => a.score - b.score);
  const best = scoredCandidates[0];

  if (best.isBusyInPeriod) {
    warnings.push('تنبيه: جميع البدلاء المتاحين مرتبطون بمهام في نفس الفترة!');
  }
  if (best.hasConsecutiveIssue) {
    warnings.push('ملاحظة: تكليف هذا البديل قد يجعله يعمل فترات متقاربة، يرجى مراجعة المشرف.');
  }

  const reason = `تم الاختيار بناءً على أقل رصيد ساعات عمل تراكمية (${best.member.totalWorkHours}س) وأعلى جاهزية راحة`;
  return { substitute: best.member, reason, warnings };
}

/**
 * Re-computes cumulative metrics across all 9 shifts for each staff member.
 * Ensures total hours, extra coverage, critical hours, and late night counters are 100% accurate.
 */
export function recalculateAllStaffMetrics(
  allStaff: StaffMember[],
  allShifts: Shift[]
): StaffMember[] {
  // Initialize counters map
  const metricsMap = new Map<
    string,
    {
      totalWorkHours: number;
      totalExtraCoverageHours: number;
      totalCriticalHours: number;
      lateNightPeriodsCount: number;
      shiftsAttendedCount: number;
      handoverOfficerCount: number;
      consecutiveShiftsWithCritical: number;
    }
  >();

  allStaff.forEach((s) => {
    metricsMap.set(s.id, {
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    });
  });

  // Track shift attendance and critical shifts sequence
  allShifts.forEach((shift) => {
    const leaveSet = new Set(shift.leaves.map((l) => l.employeeId));
    const workedInThisShift = new Set<string>();
    const workedCriticalInThisShift = new Set<string>();

    // Process periods
    shift.assignments.forEach((assignment) => {
      const def = PERIOD_DEFINITIONS[assignment.periodIndex];
      if (!def) return;

      const nurseId = assignment.nurseId;
      const anesthetistId = assignment.anesthetistId;

      if (nurseId && metricsMap.has(nurseId)) {
        const m = metricsMap.get(nurseId)!;
        m.totalWorkHours += def.totalDurationHours;
        m.totalCriticalHours += def.criticalHours;
        if (def.isLateNight) m.lateNightPeriodsCount += 1;
        workedInThisShift.add(nurseId);
        if (def.criticalHours > 0) workedCriticalInThisShift.add(nurseId);
      }

      if (anesthetistId && metricsMap.has(anesthetistId)) {
        const m = metricsMap.get(anesthetistId)!;
        m.totalWorkHours += def.totalDurationHours;
        m.totalCriticalHours += def.criticalHours;
        if (def.isLateNight) m.lateNightPeriodsCount += 1;
        workedInThisShift.add(anesthetistId);
        if (def.criticalHours > 0) workedCriticalInThisShift.add(anesthetistId);
      }
    });

    // Process emergency exits adjustments
    shift.emergencyExits.forEach((exit) => {
      const exitHours = exit.durationMinutes / 60;
      const criticalHours = exit.criticalMinutesOverlap / 60;

      // Exiting staff loses these hours
      if (metricsMap.has(exit.employeeId)) {
        const m = metricsMap.get(exit.employeeId)!;
        m.totalWorkHours = Math.max(0, m.totalWorkHours - exitHours);
        m.totalCriticalHours = Math.max(0, m.totalCriticalHours - criticalHours);
      }

      // Substitute staff gains these hours as work + extra coverage!
      if (metricsMap.has(exit.substituteId)) {
        const m = metricsMap.get(exit.substituteId)!;
        m.totalWorkHours += exitHours;
        m.totalExtraCoverageHours += exitHours;
        m.totalCriticalHours += criticalHours;
        workedInThisShift.add(exit.substituteId);
        if (criticalHours > 0) workedCriticalInThisShift.add(exit.substituteId);
      }
    });

    // Handover officer count (tracks both nurse and anesthetist officers)
    if (shift.handover) {
      if (shift.handover.nurseOfficerId && metricsMap.has(shift.handover.nurseOfficerId)) {
        metricsMap.get(shift.handover.nurseOfficerId)!.handoverOfficerCount += 1;
      }
      if (shift.handover.anesOfficerId && metricsMap.has(shift.handover.anesOfficerId)) {
        metricsMap.get(shift.handover.anesOfficerId)!.handoverOfficerCount += 1;
      }
      if (!shift.handover.nurseOfficerId && !shift.handover.anesOfficerId && shift.handover.officerId && metricsMap.has(shift.handover.officerId)) {
        metricsMap.get(shift.handover.officerId)!.handoverOfficerCount += 1;
      }
    }

    // Update attendance count (only if present and not on leave)
    allStaff.forEach((s) => {
      if (!leaveSet.has(s.id) && workedInThisShift.has(s.id)) {
        metricsMap.get(s.id)!.shiftsAttendedCount += 1;
      }

      // Update consecutive shifts with critical
      const m = metricsMap.get(s.id)!;
      if (workedCriticalInThisShift.has(s.id)) {
        m.consecutiveShiftsWithCritical += 1;
      } else {
        m.consecutiveShiftsWithCritical = 0;
      }
    });
  });

  return allStaff.map((staff) => {
    const updated = metricsMap.get(staff.id);
    if (!updated) return staff;
    return {
      ...staff,
      totalWorkHours: parseFloat(updated.totalWorkHours.toFixed(1)),
      totalExtraCoverageHours: parseFloat(updated.totalExtraCoverageHours.toFixed(1)),
      totalCriticalHours: parseFloat(updated.totalCriticalHours.toFixed(1)),
      lateNightPeriodsCount: updated.lateNightPeriodsCount,
      shiftsAttendedCount: updated.shiftsAttendedCount,
      handoverOfficerCount: updated.handoverOfficerCount,
      consecutiveShiftsWithCritical: updated.consecutiveShiftsWithCritical,
    };
  });
}

/**
 * Assigns or rotates the Handover Officers (one Nurse and one Anesthetist) for a given shift fairly.
 * Selects eligible active members with the lowest handoverOfficerCount in each category.
 */
export function selectFairHandoverOfficers(
  allStaff: StaffMember[],
  shift: Shift
): {
  nurseOfficer: { id: string; name: string } | null;
  anesOfficer: { id: string; name: string } | null;
} {
  const leaveSet = new Set(shift.leaves.map((l) => l.employeeId));
  const eligible = allStaff.filter((s) => s.isActive && !leaveSet.has(s.id));

  const eligibleNurses = eligible.filter((s) => s.role === 'nurse');
  const eligibleAnes = eligible.filter((s) => s.role === 'anesthetist');

  eligibleNurses.sort((a, b) => {
    if (a.handoverOfficerCount !== b.handoverOfficerCount) {
      return a.handoverOfficerCount - b.handoverOfficerCount;
    }
    return a.totalWorkHours - b.totalWorkHours;
  });

  eligibleAnes.sort((a, b) => {
    if (a.handoverOfficerCount !== b.handoverOfficerCount) {
      return a.handoverOfficerCount - b.handoverOfficerCount;
    }
    return a.totalWorkHours - b.totalWorkHours;
  });

  const bestNurse = eligibleNurses[0] || null;
  const bestAnes = eligibleAnes[0] || null;

  return {
    nurseOfficer: bestNurse ? { id: bestNurse.id, name: bestNurse.name } : null,
    anesOfficer: bestAnes ? { id: bestAnes.id, name: bestAnes.name } : null,
  };
}

export function selectFairHandoverOfficer(
  allStaff: StaffMember[],
  shift: Shift
): { officerId: string; officerName: string; officerRole: Role } | null {
  const pair = selectFairHandoverOfficers(allStaff, shift);
  if (pair.nurseOfficer) {
    return {
      officerId: pair.nurseOfficer.id,
      officerName: pair.nurseOfficer.name,
      officerRole: 'nurse',
    };
  }
  if (pair.anesOfficer) {
    return {
      officerId: pair.anesOfficer.id,
      officerName: pair.anesOfficer.name,
      officerRole: 'anesthetist',
    };
  }
  return null;
}

/**
 * Generates initial 9 shifts structure based on standard schedule (18h shift + 3 days rest)
 */
export function generateMonthlyShiftsStructure(startDateStr: string = '2026-11-01'): Shift[] {
  const shifts: Shift[] = [];
  let currentDate = new Date(startDateStr);

  for (let shiftNum = 1; shiftNum <= 9; shiftNum++) {
    const startIso = currentDate.toISOString().split('T')[0];
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const endIso = nextDay.toISOString().split('T')[0];

    const emptyAssignments: PeriodAssignment[] = PERIOD_DEFINITIONS.map((p) => ({
      periodIndex: p.index,
      nurseId: null,
      anesthetistId: null,
      nurseReason: 'في انتظار التوزيع الذكي',
      anesthetistReason: 'في انتظار التوزيع الذكي',
      isCovered: false,
      hasConflict: false,
      conflictReason: null,
      isManualOverride: false,
    }));

    const handover: HandoverRecord = {
      shiftNumber: shiftNum,
      shiftId: `shift-${shiftNum}`,
      startDate: startIso,
      endDate: endIso,
      nurseOfficerId: null,
      nurseOfficerName: 'لم يحدد بعد',
      anesOfficerId: null,
      anesOfficerName: 'لم يحدد بعد',
      officerId: null,
      officerName: 'لم يحدد بعد',
      officerRole: null,
      handoverTime: '08:00 ص',
      handoverNotes: '',
      followUpIssues: '',
      teamReceiptConfirmation: false,
      supervisorSignature: '',
      status: 'pending',
      approvedAt: null,
    };

    shifts.push({
      id: `shift-${shiftNum}`,
      number: shiftNum,
      startDate: startIso,
      endDate: endIso,
      startTime: '14:00',
      endTime: '08:00',
      status: 'draft',
      leaves: [],
      emergencyExits: [],
      assignments: emptyAssignments,
      handover,
      isCoverageComplete: false,
      warningMessages: [],
      supervisorApproval: {
        isApproved: false,
        approvedBy: '',
        approvedAt: null,
        notes: '',
      },
    });

    // Advance by 1 day (shift duration) + 3 days rest = 4 days total per cycle
    currentDate.setDate(currentDate.getDate() + 4);
  }

  return shifts;
}
