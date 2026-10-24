import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StaffMember,
  Shift,
  AppDatabase,
  AppSettings,
  AuditLogEntry,
  PeriodAssignment,
  EmergencyExit,
  LeaveRecord,
  Role,
} from '../types';
import {
  generateSmartSchedule,
  recalculateAllStaffMetrics,
  generateMonthlyShiftsStructure,
  selectFairHandoverOfficer,
  selectFairHandoverOfficers,
  findBestSubstituteForEmergencyExit,
  calculateCriticalMinutesOverlap,
  PERIOD_DEFINITIONS,
} from '../utils/fairnessEngine';
import { createStandardTestSquad } from '../utils/testScenarios';

interface AppContextType {
  database: AppDatabase;
  isLoading: boolean;
  isSaving: boolean;
  serverConnected: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
  isSupervisorMode: boolean;
  setIsSupervisorMode: (val: boolean) => void;
  selectedShiftId: string;
  setSelectedShiftId: (id: string) => void;
  currentShift: Shift | null;

  // Actions
  addStaffMember: (member: Omit<StaffMember, 'id' | 'totalWorkHours' | 'totalExtraCoverageHours' | 'totalCriticalHours' | 'lateNightPeriodsCount' | 'shiftsAttendedCount' | 'handoverOfficerCount' | 'consecutiveShiftsWithCritical'>) => Promise<void>;
  updateStaffMember: (id: string, updates: Partial<StaffMember>, reason?: string) => Promise<void>;
  deleteStaffMember: (id: string, reason?: string) => Promise<void>;
  loadPresetStaffSquad: () => Promise<void>;
  initializeMonthlyShifts: (startDate?: string) => Promise<void>;

  runSmartSchedulerForShift: (shiftId: string, supervisorReason?: string) => Promise<void>;
  recordLeave: (shiftId: string, employeeId: string, type: LeaveRecord['type'], reason: string) => Promise<void>;
  cancelLeave: (shiftId: string, employeeId: string) => Promise<void>;
  recordEmergencyExit: (exitData: {
    shiftId: string;
    employeeId: string;
    role: Role;
    exitTime: string;
    returnTime: string;
    reason: string;
    substituteId: string;
    notes?: string;
  }) => Promise<void>;
  resolveEmergencyExit: (shiftId: string, exitId: string) => Promise<void>;

  updatePeriodAssignment: (shiftId: string, periodIndex: number, nurseId: string | null, anesthetistId: string | null, reason: string) => Promise<void>;
  updateHandover: (shiftId: string, updates: Partial<Shift['handover']> & { autoAddStaff?: boolean }) => Promise<void>;
  addSingleShift: (shiftData: {
    startDate: string;
    endDate?: string;
    nurseOfficerId?: string | null;
    nurseOfficerName?: string;
    anesOfficerId?: string | null;
    anesOfficerName?: string;
    handoverNotes?: string;
    autoAddStaff?: boolean;
  }) => Promise<void>;
  deleteShift: (shiftId: string) => Promise<void>;
  approveShiftSchedule: (shiftId: string, approvedBy: string, notes: string) => Promise<void>;

  resetDatabaseToEmpty: (reason?: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  exportBackupJson: () => void;
  exportDatabaseJson: () => void;
  shareToWhatsApp: () => Promise<{ success: boolean; method: string }>;
  importDatabaseJson: (content: string | object) => Promise<{ success: boolean; staffCount: number; shiftsCount: number; message: string }>;
  pushToCloudRoom: (roomCode: string) => Promise<{ success: boolean; message: string }>;
  pullFromCloudRoom: (roomCode: string) => Promise<{ success: boolean; staffCount: number; shiftsCount: number; message: string }>;
  restoreFromBackupJson: (backupData: AppDatabase) => Promise<void>;
  refreshDatabase: () => Promise<void>;
  lastLocalSaveTime: string | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  hospitalName: 'مستشفى الحسين التخصصي للاطفال',
  departmentName: 'Rcu العناية المركزة',
  shiftDurationHours: 18,
  shiftStartTime: '14:00',
  shiftEndTime: '08:00',
  restDaysAfterShift: 3,
  periodsCount: 9,
  periodDurationHours: 2,
  criticalPeriodStart: '02:00',
  criticalPeriodEnd: '07:00',
  supervisorPin: '1234',
};

const DEFAULT_EMPTY_DB: AppDatabase = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  staff: [], // Empty initially per prompt requirements
  shifts: [], // Empty initially
  auditLog: [],
  settings: DEFAULT_SETTINGS,
};

const LOCAL_STORAGE_KEY = 'nurseshift_local_db';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state synchronously from localStorage cache for instant zero-latency loading
  const [database, setDatabase] = useState<AppDatabase>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.staff) && Array.isArray(parsed.shifts)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Could not read cached database from localStorage:', err);
      }
    }
    return DEFAULT_EMPTY_DB;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [lastLocalSaveTime, setLastLocalSaveTime] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nurseshift_last_save_time') || null;
    }
    return null;
  });
  const [activeView, setActiveView] = useState('dashboard');
  const [isSupervisorMode, setIsSupervisorMode] = useState(true); // Supervisor mode enabled for administrative access
  const [selectedShiftId, setSelectedShiftId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.shifts && parsed.shifts.length > 0) {
            return parsed.shifts[0].id;
          }
        }
      } catch {
        // fallback
      }
    }
    return '';
  });

  // Fetch from server DB or fallback to localStorage
  const refreshDatabase = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/database');
      if (res.ok) {
        const serverData = await res.json();
        // Check if server data is non-empty or newer
        setDatabase(serverData);
        setServerConnected(true);
        if (serverData.shifts && serverData.shifts.length > 0 && !selectedShiftId) {
          setSelectedShiftId(serverData.shifts[0].id);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverData));
        const nowIso = new Date().toISOString();
        localStorage.setItem('nurseshift_last_save_time', nowIso);
        setLastLocalSaveTime(nowIso);
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      console.warn('Could not connect to Express server, falling back to local storage cache:', err);
      setServerConnected(false);
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setDatabase(parsed);
          if (parsed.shifts && parsed.shifts.length > 0 && !selectedShiftId) {
            setSelectedShiftId(parsed.shifts[0].id);
          }
        } catch {
          setDatabase(DEFAULT_EMPTY_DB);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedShiftId]);

  useEffect(() => {
    refreshDatabase();
  }, []);

  // Save changes to localStorage immediately AND sync with server
  const persistDatabase = async (newDb: AppDatabase, author: string, reason: string): Promise<boolean> => {
    setIsSaving(true);
    const saveTimestamp = new Date().toISOString();
    newDb.lastUpdated = saveTimestamp;

    // 1. ALWAYS store locally first for guaranteed zero data loss on phone restart or page exit
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDb));
      localStorage.setItem('nurseshift_last_save_time', saveTimestamp);
      setLastLocalSaveTime(saveTimestamp);
    } catch (localErr) {
      console.error('LocalStorage write failed:', localErr);
    }

    try {
      // 2. Attempt to save to server
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: newDb, author, reason }),
      });

      if (res.ok) {
        const result = await res.json();
        setServerConnected(true);
        if (result.auditEntry) {
          newDb.auditLog = [result.auditEntry, ...newDb.auditLog.filter((a) => a.id !== result.auditEntry.id)];
        }
        setDatabase(newDb);
        // Refresh local cache with server audit entry
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDb));
        return true;
      } else {
        throw new Error('Save to server failed');
      }
    } catch (err) {
      console.warn('Failed saving to server, saved locally in phone memory (localStorage):', err);
      setServerConnected(false);
      setDatabase(newDb);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Staff additions
  const addStaffMember = async (memberData: Omit<StaffMember, 'id' | 'totalWorkHours' | 'totalExtraCoverageHours' | 'totalCriticalHours' | 'lateNightPeriodsCount' | 'shiftsAttendedCount' | 'handoverOfficerCount' | 'consecutiveShiftsWithCritical'>) => {
    const newMember: StaffMember = {
      ...memberData,
      id: `staff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      totalWorkHours: 0,
      totalExtraCoverageHours: 0,
      totalCriticalHours: 0,
      lateNightPeriodsCount: 0,
      shiftsAttendedCount: 0,
      handoverOfficerCount: 0,
      consecutiveShiftsWithCritical: 0,
    };

    const updatedStaff = [...database.staff, newMember];
    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
    };

    await persistDatabase(
      newDb,
      isSupervisorMode ? 'المشرف' : 'المستخدم',
      `إضافة موظف جديد: ${newMember.name} (${newMember.role === 'nurse' ? 'ممرض' : 'مساعد تخدير'})`
    );
  };

  const updateStaffMember = async (id: string, updates: Partial<StaffMember>, reason?: string) => {
    const updatedStaff = database.staff.map((s) => (s.id === id ? { ...s, ...updates } : s));
    const target = database.staff.find((s) => s.id === id);
    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
    };

    await persistDatabase(
      newDb,
      'المشرف',
      reason || `تعديل بيانات الموظف: ${target?.name || id}`
    );
  };

  const deleteStaffMember = async (id: string, reason?: string) => {
    const target = database.staff.find((s) => s.id === id);
    const updatedStaff = database.staff.filter((s) => s.id !== id);
    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
    };

    await persistDatabase(
      newDb,
      'المشرف',
      reason || `حذف الموظف: ${target?.name || id}`
    );
  };

  // Helper to load standard 6 Nurses & 5 Anesthesia Assistants squad
  const loadPresetStaffSquad = async () => {
    const preset = createStandardTestSquad();
    const newDb: AppDatabase = {
      ...database,
      staff: preset,
    };
    await persistDatabase(
      newDb,
      'المشرف',
      'تحميل كادر الخفارة المعتمد (6 ممرضين و5 مساعدي تخدير)'
    );
  };

  // Initialize monthly 9 shifts structure
  const initializeMonthlyShifts = async (startDateStr: string = '2026-11-01') => {
    const shifts = generateMonthlyShiftsStructure(startDateStr);
    const newDb: AppDatabase = {
      ...database,
      shifts,
    };
    if (shifts.length > 0) {
      setSelectedShiftId(shifts[0].id);
    }
    await persistDatabase(
      newDb,
      'المشرف',
      `إنشاء جدول الخفارات التسع للشهر بدءاً من تاريخ ${startDateStr}`
    );
  };

  // Run Smart Scheduler for a specific shift
  const runSmartSchedulerForShift = async (shiftId: string, supervisorReason?: string) => {
    const shiftIndex = database.shifts.findIndex((s) => s.id === shiftId);
    if (shiftIndex === -1) return;

    const targetShift = database.shifts[shiftIndex];
    const previousShifts = database.shifts.slice(0, shiftIndex);

    const { assignments, isCoverageComplete, warnings, handoverOfficers } = generateSmartSchedule(
      database.staff,
      targetShift,
      previousShifts
    );

    // Sync handover record with the designated handover officers (pinned at Period 0 and Period 8)
    let handover = { ...targetShift.handover };
    if (handoverOfficers.nurseOfficer) {
      handover.nurseOfficerId = handoverOfficers.nurseOfficer.id;
      handover.nurseOfficerName = handoverOfficers.nurseOfficer.name;
    }
    if (handoverOfficers.anesOfficer) {
      handover.anesOfficerId = handoverOfficers.anesOfficer.id;
      handover.anesOfficerName = handoverOfficers.anesOfficer.name;
    }
    const combinedOfficerName = [
      handover.nurseOfficerName && handover.nurseOfficerName !== 'لم يحدد بعد' ? handover.nurseOfficerName : '',
      handover.anesOfficerName && handover.anesOfficerName !== 'لم يحدد بعد' ? handover.anesOfficerName : '',
    ].filter(Boolean).join(' & ');
    if (combinedOfficerName) {
      handover.officerName = combinedOfficerName;
    }

    const updatedShift: Shift = {
      ...targetShift,
      assignments,
      isCoverageComplete,
      warningMessages: warnings,
      handover,
      status: targetShift.status === 'approved' ? 'approved' : 'draft',
    };

    const updatedShifts = [...database.shifts];
    updatedShifts[shiftIndex] = updatedShift;

    // Recalculate metrics for all staff
    const updatedStaff = recalculateAllStaffMetrics(database.staff, updatedShifts);

    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
      shifts: updatedShifts,
    };

    await persistDatabase(
      newDb,
      'محرك التوزيع الذكي',
      supervisorReason || `تشغيل التوزيع التلقائي العادل للفترات في الخفارة رقم ${targetShift.number}`
    );
  };

  // Record a leave and auto-redistribute
  const recordLeave = async (
    shiftId: string,
    employeeId: string,
    type: LeaveRecord['type'],
    reason: string
  ) => {
    const shiftIndex = database.shifts.findIndex((s) => s.id === shiftId);
    if (shiftIndex === -1) return;

    const targetShift = database.shifts[shiftIndex];
    const staffMember = database.staff.find((s) => s.id === employeeId);

    const newLeave: LeaveRecord = {
      employeeId,
      shiftId,
      type,
      reason,
      dateAdded: new Date().toISOString(),
    };

    const updatedLeaves = [...targetShift.leaves.filter((l) => l.employeeId !== employeeId), newLeave];
    const shiftWithLeave: Shift = {
      ...targetShift,
      leaves: updatedLeaves,
    };

    // Auto-redistribute present staff
    const previousShifts = database.shifts.slice(0, shiftIndex);
    const { assignments, isCoverageComplete, warnings } = generateSmartSchedule(
      database.staff,
      shiftWithLeave,
      previousShifts
    );

    shiftWithLeave.assignments = assignments;
    shiftWithLeave.isCoverageComplete = isCoverageComplete;
    shiftWithLeave.warningMessages = warnings;

    const updatedShifts = [...database.shifts];
    updatedShifts[shiftIndex] = shiftWithLeave;

    const updatedStaff = recalculateAllStaffMetrics(database.staff, updatedShifts);

    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
      shifts: updatedShifts,
    };

    await persistDatabase(
      newDb,
      'المشرف',
      `تسجيل إجازة (${type}) للموظف ${staffMember?.name || employeeId} في الخفارة رقم ${targetShift.number} وإعادة التوزيع تلقائياً`
    );
  };

  // Cancel leave
  const cancelLeave = async (shiftId: string, employeeId: string) => {
    const shiftIndex = database.shifts.findIndex((s) => s.id === shiftId);
    if (shiftIndex === -1) return;

    const targetShift = database.shifts[shiftIndex];
    const staffMember = database.staff.find((s) => s.id === employeeId);
    const updatedLeaves = targetShift.leaves.filter((l) => l.employeeId !== employeeId);

    const shiftWithoutLeave: Shift = {
      ...targetShift,
      leaves: updatedLeaves,
    };

    // Re-run scheduler
    const previousShifts = database.shifts.slice(0, shiftIndex);
    const { assignments, isCoverageComplete, warnings } = generateSmartSchedule(
      database.staff,
      shiftWithoutLeave,
      previousShifts
    );

    shiftWithoutLeave.assignments = assignments;
    shiftWithoutLeave.isCoverageComplete = isCoverageComplete;
    shiftWithoutLeave.warningMessages = warnings;

    const updatedShifts = [...database.shifts];
    updatedShifts[shiftIndex] = shiftWithoutLeave;

    const updatedStaff = recalculateAllStaffMetrics(database.staff, updatedShifts);

    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
      shifts: updatedShifts,
    };

    await persistDatabase(
      newDb,
      'المشرف',
      `إلغاء إجازة الموظف ${staffMember?.name || employeeId} وإعادة جدولة الخفارة رقم ${targetShift.number}`
    );
  };

  // Record Emergency Short Exit (1-2 Hours)
  const recordEmergencyExit = async (exitData: {
    shiftId: string;
    employeeId: string;
    role: Role;
    exitTime: string;
    returnTime: string;
    reason: string;
    substituteId: string;
    notes?: string;
  }) => {
    const shiftIndex = database.shifts.findIndex((s) => s.id === exitData.shiftId);
    if (shiftIndex === -1) return;

    const targetShift = database.shifts[shiftIndex];
    const exitingStaff = database.staff.find((s) => s.id === exitData.employeeId);
    const substituteStaff = database.staff.find((s) => s.id === exitData.substituteId);

    // Calculate duration in minutes
    const [h1, m1] = exitData.exitTime.split(':').map(Number);
    const [h2, m2] = exitData.returnTime.split(':').map(Number);
    let durMins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (durMins <= 0) durMins += 24 * 60; // crossed midnight

    // Calculate critical overlap
    const criticalMins = calculateCriticalMinutesOverlap(exitData.exitTime, exitData.returnTime);

    const newExit: EmergencyExit = {
      id: `exit-${Date.now()}`,
      shiftId: exitData.shiftId,
      employeeId: exitData.employeeId,
      employeeName: exitingStaff?.name || 'غير معروف',
      role: exitData.role,
      exitTime: exitData.exitTime,
      returnTime: exitData.returnTime,
      durationMinutes: durMins,
      reason: exitData.reason,
      substituteId: exitData.substituteId,
      substituteName: substituteStaff?.name || 'غير معروف',
      criticalMinutesOverlap: criticalMins,
      status: 'active',
      createdAt: new Date().toISOString(),
      notes: exitData.notes,
    };

    // Update assignment in shift if matching period
    const updatedAssignments = targetShift.assignments.map((assignment) => {
      let isNurseExit = exitData.role === 'nurse' && assignment.nurseId === exitData.employeeId;
      let isAnesExit = exitData.role === 'anesthetist' && assignment.anesthetistId === exitData.employeeId;

      if (isNurseExit) {
        return {
          ...assignment,
          nurseId: exitData.substituteId,
          nurseReason: `تغطية طارئة بديلة عن ${exitingStaff?.name || ''} (${exitData.exitTime}-${exitData.returnTime})`,
          isManualOverride: true,
        };
      }
      if (isAnesExit) {
        return {
          ...assignment,
          anesthetistId: exitData.substituteId,
          anesthetistReason: `تغطية طارئة بديلة عن ${exitingStaff?.name || ''} (${exitData.exitTime}-${exitData.returnTime})`,
          isManualOverride: true,
        };
      }
      return assignment;
    });

    const updatedShift: Shift = {
      ...targetShift,
      emergencyExits: [...targetShift.emergencyExits, newExit],
      assignments: updatedAssignments,
    };

    const updatedShifts = [...database.shifts];
    updatedShifts[shiftIndex] = updatedShift;

    // Recalculate metrics for staff
    const updatedStaff = recalculateAllStaffMetrics(database.staff, updatedShifts);

    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
      shifts: updatedShifts,
    };

    await persistDatabase(
      newDb,
      'المشرف',
      `تسجيل خروج طارئ للموظف ${exitingStaff?.name} لمدة ${durMins} دقيقة وتكليف البديل ${substituteStaff?.name}`
    );
  };

  const resolveEmergencyExit = async (shiftId: string, exitId: string) => {
    const shiftIndex = database.shifts.findIndex((s) => s.id === shiftId);
    if (shiftIndex === -1) return;

    const targetShift = database.shifts[shiftIndex];
    const updatedExits = targetShift.emergencyExits.map((e) =>
      e.id === exitId ? { ...e, status: 'resolved' as const } : e
    );

    const updatedShift: Shift = {
      ...targetShift,
      emergencyExits: updatedExits,
    };

    const updatedShifts = [...database.shifts];
    updatedShifts[shiftIndex] = updatedShift;

    const newDb: AppDatabase = {
      ...database,
      shifts: updatedShifts,
    };

    await persistDatabase(newDb, 'المشرف', `إغلاق وتأكيد عودة الموظف من الخروج الطارئ`);
  };

  // Manual assignment override with audit
  const updatePeriodAssignment = async (
    shiftId: string,
    periodIndex: number,
    nurseId: string | null,
    anesthetistId: string | null,
    reason: string
  ) => {
    const shiftIndex = database.shifts.findIndex((s) => s.id === shiftId);
    if (shiftIndex === -1) return;

    const targetShift = database.shifts[shiftIndex];
    const updatedAssignments = targetShift.assignments.map((a) => {
      if (a.periodIndex === periodIndex) {
        return {
          ...a,
          nurseId,
          anesthetistId,
          nurseReason: nurseId ? `تعديل يدوي بواسطة المشرف: ${reason}` : 'شاغر',
          anesthetistReason: anesthetistId ? `تعديل يدوي بواسطة المشرف: ${reason}` : 'شاغر',
          isCovered: nurseId !== null && anesthetistId !== null,
          isManualOverride: true,
        };
      }
      return a;
    });

    const isComplete = updatedAssignments.every((a) => a.isCovered);
    const updatedShift: Shift = {
      ...targetShift,
      assignments: updatedAssignments,
      isCoverageComplete: isComplete,
    };

    const updatedShifts = [...database.shifts];
    updatedShifts[shiftIndex] = updatedShift;

    const updatedStaff = recalculateAllStaffMetrics(database.staff, updatedShifts);

    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
      shifts: updatedShifts,
    };

    await persistDatabase(
      newDb,
      'المشرف',
      `تعديل يدوي للفترة رقم ${periodIndex + 1} في الخفارة رقم ${targetShift.number} — السبب: ${reason}`
    );
  };

  // Handover updates
  const updateHandover = async (
    shiftId: string,
    updates: Partial<Shift['handover']> & { autoAddStaff?: boolean }
  ) => {
    const shiftIndex = database.shifts.findIndex((s) => s.id === shiftId);
    if (shiftIndex === -1) return;

    let currentStaff = [...database.staff];

    // If autoAddStaff is enabled and newly typed names are provided, create staff members automatically
    if (updates.autoAddStaff) {
      if (
        updates.nurseOfficerName &&
        updates.nurseOfficerName !== 'لم يحدد بعد' &&
        !currentStaff.some((s) => s.name.trim() === updates.nurseOfficerName?.trim())
      ) {
        const newNurseId = `nurse-${Date.now()}`;
        currentStaff.push({
          id: newNurseId,
          name: updates.nurseOfficerName.trim(),
          role: 'nurse',
          qualification: 'certified',
          isActive: true,
          totalWorkHours: 0,
          totalExtraCoverageHours: 0,
          totalCriticalHours: 0,
          lateNightPeriodsCount: 0,
          shiftsAttendedCount: 0,
          handoverOfficerCount: 1,
          consecutiveShiftsWithCritical: 0,
        });
        updates.nurseOfficerId = newNurseId;
      }

      if (
        updates.anesOfficerName &&
        updates.anesOfficerName !== 'لم يحدد بعد' &&
        !currentStaff.some((s) => s.name.trim() === updates.anesOfficerName?.trim())
      ) {
        const newAnesId = `anes-${Date.now() + 1}`;
        currentStaff.push({
          id: newAnesId,
          name: updates.anesOfficerName.trim(),
          role: 'anesthetist',
          qualification: 'certified',
          isActive: true,
          totalWorkHours: 0,
          totalExtraCoverageHours: 0,
          totalCriticalHours: 0,
          lateNightPeriodsCount: 0,
          shiftsAttendedCount: 0,
          handoverOfficerCount: 1,
          consecutiveShiftsWithCritical: 0,
        });
        updates.anesOfficerId = newAnesId;
      }
    }

    const targetShift = database.shifts[shiftIndex];
    const newStartDate = updates.startDate || targetShift.startDate;
    const newEndDate = updates.endDate || targetShift.endDate;

    const updatedHandover = {
      ...targetShift.handover,
      ...updates,
      startDate: newStartDate,
      endDate: newEndDate,
    };

    const updatedShift: Shift = {
      ...targetShift,
      startDate: newStartDate,
      endDate: newEndDate,
      handover: updatedHandover,
    };

    const updatedShifts = [...database.shifts];
    updatedShifts[shiftIndex] = updatedShift;

    const updatedStaff = recalculateAllStaffMetrics(currentStaff, updatedShifts);

    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
      shifts: updatedShifts,
    };

    await persistDatabase(
      newDb,
      'المشرف / مسؤول الاستلام',
      `تحديث بيانات سجل التسليم والاستلام وتاريخ الخفارة رقم ${targetShift.number} (${newStartDate})`
    );
  };

  // Add a single custom shift
  const addSingleShift = async (shiftData: {
    startDate: string;
    endDate?: string;
    nurseOfficerId?: string | null;
    nurseOfficerName?: string;
    anesOfficerId?: string | null;
    anesOfficerName?: string;
    handoverNotes?: string;
    autoAddStaff?: boolean;
  }) => {
    let currentStaff = [...database.staff];
    const nextNum = database.shifts.length + 1;
    const startIso = shiftData.startDate;
    let endIso = shiftData.endDate;
    if (!endIso) {
      const d = new Date(startIso);
      d.setDate(d.getDate() + 1);
      endIso = d.toISOString().split('T')[0];
    }

    let nurseId = shiftData.nurseOfficerId || null;
    let nurseName = shiftData.nurseOfficerName || 'لم يحدد بعد';
    let anesId = shiftData.anesOfficerId || null;
    let anesName = shiftData.anesOfficerName || 'لم يحدد بعد';

    if (shiftData.autoAddStaff) {
      if (
        nurseName &&
        nurseName !== 'لم يحدد بعد' &&
        !currentStaff.some((s) => s.name.trim() === nurseName.trim())
      ) {
        nurseId = `nurse-${Date.now()}`;
        currentStaff.push({
          id: nurseId,
          name: nurseName.trim(),
          role: 'nurse',
          qualification: 'certified',
          isActive: true,
          totalWorkHours: 0,
          totalExtraCoverageHours: 0,
          totalCriticalHours: 0,
          lateNightPeriodsCount: 0,
          shiftsAttendedCount: 0,
          handoverOfficerCount: 1,
          consecutiveShiftsWithCritical: 0,
        });
      }

      if (
        anesName &&
        anesName !== 'لم يحدد بعد' &&
        !currentStaff.some((s) => s.name.trim() === anesName.trim())
      ) {
        anesId = `anes-${Date.now() + 1}`;
        currentStaff.push({
          id: anesId,
          name: anesName.trim(),
          role: 'anesthetist',
          qualification: 'certified',
          isActive: true,
          totalWorkHours: 0,
          totalExtraCoverageHours: 0,
          totalCriticalHours: 0,
          lateNightPeriodsCount: 0,
          shiftsAttendedCount: 0,
          handoverOfficerCount: 1,
          consecutiveShiftsWithCritical: 0,
        });
      }
    }

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

    const newHandover = {
      shiftNumber: nextNum,
      shiftId: `shift-${Date.now()}`,
      startDate: startIso,
      endDate: endIso,
      nurseOfficerId: nurseId,
      nurseOfficerName: nurseName,
      anesOfficerId: anesId,
      anesOfficerName: anesName,
      officerId: nurseId || anesId || null,
      officerName: [nurseName !== 'لم يحدد بعد' ? nurseName : '', anesName !== 'لم يحدد بعد' ? anesName : ''].filter(Boolean).join(' & ') || 'لم يحدد بعد',
      officerRole: nurseId ? ('nurse' as const) : anesId ? ('anesthetist' as const) : null,
      handoverTime: '08:00 ص',
      handoverNotes: shiftData.handoverNotes || '',
      followUpIssues: '',
      teamReceiptConfirmation: false,
      supervisorSignature: '',
      status: 'pending' as const,
      approvedAt: null,
    };

    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      number: nextNum,
      startDate: startIso,
      endDate: endIso,
      startTime: '14:00',
      endTime: '08:00',
      status: 'draft',
      leaves: [],
      emergencyExits: [],
      assignments: emptyAssignments,
      handover: newHandover,
      isCoverageComplete: false,
      warningMessages: [],
      supervisorApproval: {
        isApproved: false,
        approvedBy: '',
        approvedAt: null,
        notes: '',
      },
    };

    const updatedShifts = [...database.shifts, newShift];
    const updatedStaff = recalculateAllStaffMetrics(currentStaff, updatedShifts);

    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
      shifts: updatedShifts,
    };

    await persistDatabase(
      newDb,
      'المشرف',
      `إضافة خفارة جديدة رقم ${nextNum} بتاريخ ${startIso}`
    );
    setSelectedShiftId(newShift.id);
  };

  // Delete a shift
  const deleteShift = async (shiftId: string) => {
    const shiftToDelete = database.shifts.find((s) => s.id === shiftId);
    if (!shiftToDelete) return;

    const filteredShifts = database.shifts.filter((s) => s.id !== shiftId);
    const renumberedShifts = filteredShifts.map((s, idx) => ({
      ...s,
      number: idx + 1,
      handover: {
        ...s.handover,
        shiftNumber: idx + 1,
      },
    }));

    const updatedStaff = recalculateAllStaffMetrics(database.staff, renumberedShifts);

    const newDb: AppDatabase = {
      ...database,
      staff: updatedStaff,
      shifts: renumberedShifts,
    };

    await persistDatabase(
      newDb,
      'المشرف',
      `حذف الخفارة رقم ${shiftToDelete.number} (${shiftToDelete.startDate})`
    );

    if (selectedShiftId === shiftId) {
      setSelectedShiftId(renumberedShifts.length > 0 ? renumberedShifts[0].id : '');
    }
  };

  // Shift approval
  const approveShiftSchedule = async (shiftId: string, approvedBy: string, notes: string) => {
    const shiftIndex = database.shifts.findIndex((s) => s.id === shiftId);
    if (shiftIndex === -1) return;

    const targetShift = database.shifts[shiftIndex];
    const updatedShift: Shift = {
      ...targetShift,
      status: 'approved',
      supervisorApproval: {
        isApproved: true,
        approvedBy,
        approvedAt: new Date().toISOString(),
        notes,
      },
    };

    const updatedShifts = [...database.shifts];
    updatedShifts[shiftIndex] = updatedShift;

    const newDb: AppDatabase = {
      ...database,
      shifts: updatedShifts,
    };

    await persistDatabase(
      newDb,
      approvedBy,
      `الاعتماد النهائي لجدول الخفارة رقم ${targetShift.number} بواسطة ${approvedBy}`
    );
  };

  // Reset to empty database
  const resetDatabaseToEmpty = async (reason?: string) => {
    const emptyDb: AppDatabase = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      staff: [],
      shifts: [],
      auditLog: [],
      settings: DEFAULT_SETTINGS,
    };

    await persistDatabase(
      emptyDb,
      'المشرف العام',
      reason || 'إعادة ضبط قاعدة البيانات إلى الحالة الفارغة المعتمدة'
    );
    setSelectedShiftId('');
  };

  // Export & Share
  const exportDatabaseJson = () => {
    const jsonStr = JSON.stringify(database, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `rcu_shifts_database_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportBackupJson = exportDatabaseJson;

  // Share to WhatsApp (File via Web Share API or Auto-Download + WhatsApp link)
  const shareToWhatsApp = async (): Promise<{ success: boolean; method: string }> => {
    const jsonStr = JSON.stringify(database, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `rcu_shifts_database_${dateStr}.json`;
    const blob = new Blob([jsonStr], { type: 'application/json' });

    // Try native file sharing via Web Share API (supported on mobile browsers)
    try {
      if (typeof navigator !== 'undefined' && navigator.canShare) {
        const file = new File([blob], filename, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `قاعدة بيانات خفارات ${database.settings.hospitalName}`,
            text: `مرحباً زميلي المشرف، هذه النسخة الاحتياطية المحدثة من قاعدة بيانات وجداول خفارات RCU (${database.staff.length} موظف و ${database.shifts.length} خفارة) مع كافة سجلات العدالة لمتابعة الإشراف.`,
            files: [file],
          });
          return { success: true, method: 'web_share' };
        }
      }
    } catch (shareErr) {
      console.warn('Native web share not completed or cancelled:', shareErr);
    }

    // Fallback: Trigger download of JSON file + open WhatsApp pre-filled chat
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    const message = encodeURIComponent(
      `📋 *بيانات وجداول خفارات RCU (${database.settings.hospitalName})*\n` +
      `أهلاً زميلي المشرف،\n` +
      `أرفق لك ملف النسخة الاحتياطية (${filename}) لقاعدة البيانات الحالية.\n` +
      `✅ يتضمن: ${database.staff.length} كادر طبي و ${database.shifts.length} خفارة مع سجلات العدالة التراكمية وسجلات التسليم والاستلام.\n` +
      `📲 افتح التطبيق على هاتفك واضغط على زر "استيراد البيانات (JSON)" واختر هذا الملف ليظهر لديك كافة الجداول والتوزيع العادل وتستكمل الإشراف بدلاً مني أثناء إجازتي.`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    return { success: true, method: 'file_download_and_chat' };
  };

  // Import JSON with validation and fairness recalculation
  const importDatabaseJson = async (content: string | object) => {
    let parsed: AppDatabase;
    if (typeof content === 'string') {
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error('ملف JSON غير صالح أو به أخطاء صياغة');
      }
    } else {
      parsed = content as AppDatabase;
    }

    if (!parsed || !Array.isArray(parsed.staff) || !Array.isArray(parsed.shifts)) {
      throw new Error('الملف غير متطابق مع بنية قاعدة بيانات NurseShift (يجب أن يحتوي على الكادر والخفارات)');
    }

    // Recalculate metrics to guarantee cumulative fairness and critical hours integrity
    const updatedStaff = recalculateAllStaffMetrics(parsed.staff, parsed.shifts);
    const validatedDb: AppDatabase = {
      ...parsed,
      staff: updatedStaff,
      lastUpdated: new Date().toISOString(),
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings || {}),
      },
      auditLog: [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: isSupervisorMode ? 'المشرف المستلم' : 'المستخدم',
          reason: 'استيراد قاعدة بيانات كاملة من الزميل المشرف لمتابعة الإشراف',
          changesSummary: `استيراد ${updatedStaff.length} موظف و ${parsed.shifts.length} خفارة مع تدقيق سجلات العدالة`,
        },
        ...(parsed.auditLog || []),
      ].slice(0, 500),
    };

    await persistDatabase(
      validatedDb,
      'المشرف المستلم',
      `استيراد قاعدة بيانات كاملة (${updatedStaff.length} موظف و ${parsed.shifts.length} خفارة)`
    );

    if (validatedDb.shifts.length > 0) {
      setSelectedShiftId(validatedDb.shifts[0].id);
    }

    return {
      success: true,
      staffCount: validatedDb.staff.length,
      shiftsCount: validatedDb.shifts.length,
      message: `تم بنجاح استيراد ${validatedDb.staff.length} كادر طبي و ${validatedDb.shifts.length} خفارة مع سجلات العدالة التراكمية. النظام جاهز لمتابعة إشرافك!`,
    };
  };

  const restoreFromBackupJson = async (backupData: AppDatabase) => {
    await importDatabaseJson(backupData);
  };

  // Live Cloud Room Sync
  const pushToCloudRoom = async (roomCode: string) => {
    const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) throw new Error('يرجى إدخال كود غرفة صالح (مثال: RCU-1234)');

    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: cleanCode,
        data: database,
        author: isSupervisorMode ? 'المشرف' : 'المستخدم',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل رفع البيانات إلى غرفة المزامنة السحابية');
    }

    return {
      success: true,
      message: `تم رفع ومزامنة البيانات بنجاح في الغرفة (${cleanCode}). يمكن لزميلك الآن إدخال نفس الكود على هاتفه لاستلام كافة الجداول وسجلات العدالة فوراً!`,
    };
  };

  const pullFromCloudRoom = async (roomCode: string) => {
    const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) throw new Error('يرجى إدخال كود غرفة صالح');

    const res = await fetch(`/api/sync/pull/${cleanCode}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'كود المزامنة غير موجود أو انتهت صلاحيته');
    }

    const payload = await res.json();
    if (!payload.data) {
      throw new Error('لا توجد بيانات صالحة في هذه الغرفة');
    }

    return await importDatabaseJson(payload.data);
  };

  // Update settings
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...database.settings, ...newSettings };
    const newDb: AppDatabase = {
      ...database,
      settings: updatedSettings,
    };
    await persistDatabase(
      newDb,
      'المشرف',
      `تحديث إعدادات النظام: اسم المستشفى (${updatedSettings.hospitalName}) والقسم (${updatedSettings.departmentName})`
    );
  };

  const currentShift = database.shifts.find((s) => s.id === selectedShiftId) || null;

  return (
    <AppContext.Provider
      value={{
        database,
        isLoading,
        isSaving,
        serverConnected,
        lastLocalSaveTime,
        activeView,
        setActiveView,
        isSupervisorMode,
        setIsSupervisorMode,
        selectedShiftId,
        setSelectedShiftId,
        currentShift,

        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        loadPresetStaffSquad,
        initializeMonthlyShifts,

        runSmartSchedulerForShift,
        recordLeave,
        cancelLeave,
        recordEmergencyExit,
        resolveEmergencyExit,

        updatePeriodAssignment,
        updateHandover,
        addSingleShift,
        deleteShift,
        approveShiftSchedule,

        resetDatabaseToEmpty,
        updateSettings,
        exportBackupJson,
        exportDatabaseJson,
        shareToWhatsApp,
        importDatabaseJson,
        pushToCloudRoom,
        pullFromCloudRoom,
        restoreFromBackupJson,
        refreshDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
