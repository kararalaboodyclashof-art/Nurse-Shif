export type Role = 'nurse' | 'anesthetist';

export type QualificationLevel = 'certified' | 'senior' | 'specialist';

export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  qualification: QualificationLevel;
  phone?: string;
  isActive: boolean;
  totalWorkHours: number;
  totalExtraCoverageHours: number;
  totalCriticalHours: number;
  lateNightPeriodsCount: number;
  shiftsAttendedCount: number;
  handoverOfficerCount: number;
  consecutiveShiftsWithCritical: number;
  notes?: string;
}

export interface PeriodDefinition {
  index: number; // 0 to 8
  label: string;
  startTime: string; // e.g. "14:00"
  endTime: string; // e.g. "16:00"
  displayTime: string; // e.g. "2:00 م - 4:00 م"
  isLateNight: boolean;
  criticalHours: number; // 2 for 02-04, 2 for 04-06, 1 for 06-08 (6-7 is critical, 7-8 standard), 0 otherwise
  totalDurationHours: number; // 2
}

export interface PeriodAssignment {
  periodIndex: number;
  nurseId: string | null;
  anesthetistId: string | null;
  nurseReason: string;
  anesthetistReason: string;
  isCovered: boolean;
  hasConflict: boolean;
  conflictReason: string | null;
  isManualOverride: boolean;
}

export interface EmergencyExit {
  id: string;
  shiftId: string;
  employeeId: string;
  employeeName: string;
  role: Role;
  exitTime: string; // HH:mm
  returnTime: string; // HH:mm
  durationMinutes: number;
  reason: string;
  substituteId: string;
  substituteName: string;
  criticalMinutesOverlap: number;
  status: 'active' | 'resolved';
  createdAt: string;
  notes?: string;
}

export interface LeaveRecord {
  employeeId: string;
  shiftId: string;
  type: 'sick' | 'annual' | 'emergency' | 'administrative';
  reason: string;
  dateAdded: string;
}

export interface HandoverRecord {
  shiftNumber: number; // 1 to 9
  shiftId: string;
  startDate: string;
  endDate: string;
  // Two handover officers: Nurse and Anesthetist
  nurseOfficerId?: string | null;
  nurseOfficerName?: string;
  anesOfficerId?: string | null;
  anesOfficerName?: string;
  // Legacy / single fields
  officerId?: string | null;
  officerName?: string;
  officerRole?: Role | null;
  handoverTime: string;
  handoverNotes: string;
  followUpIssues: string;
  teamReceiptConfirmation: boolean;
  supervisorSignature: string;
  status: 'pending' | 'signed' | 'approved';
  approvedAt: string | null;
}

export interface Shift {
  id: string;
  number: number; // 1 to 9
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // "14:00"
  endTime: string; // "08:00"
  status: 'draft' | 'approved' | 'active' | 'completed';
  leaves: LeaveRecord[];
  emergencyExits: EmergencyExit[];
  assignments: PeriodAssignment[];
  handover: HandoverRecord;
  isCoverageComplete: boolean;
  warningMessages: string[];
  supervisorApproval: {
    isApproved: boolean;
    approvedBy: string;
    approvedAt: string | null;
    notes: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  author: string;
  reason: string;
  changesSummary: string;
}

export interface AppSettings {
  hospitalName: string;
  departmentName: string;
  shiftDurationHours: number;
  shiftStartTime: string;
  shiftEndTime: string;
  restDaysAfterShift: number;
  periodsCount: number;
  periodDurationHours: number;
  criticalPeriodStart: string;
  criticalPeriodEnd: string;
  supervisorPin: string;
}

export interface AppDatabase {
  version: number;
  lastUpdated: string;
  staff: StaffMember[];
  shifts: Shift[];
  auditLog: AuditLogEntry[];
  settings: AppSettings;
}

export interface ScenarioTestResult {
  id: number;
  name: string;
  description: string;
  status: 'passed' | 'warning' | 'failed';
  details: string[];
  metrics: Record<string, any>;
}
