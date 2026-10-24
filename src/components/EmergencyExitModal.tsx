import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import {
  findBestSubstituteForEmergencyExit,
  calculateCriticalMinutesOverlap,
} from '../utils/fairnessEngine';
import { ArrowRightLeft, X, Sparkles, Clock, AlertTriangle } from 'lucide-react';

interface EmergencyExitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyExitModal: React.FC<EmergencyExitModalProps> = ({ isOpen, onClose }) => {
  const { currentShift, database, recordEmergencyExit } = useApp();

  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<Role>('nurse');
  const [exitTime, setExitTime] = useState('16:00');
  const [returnTime, setReturnTime] = useState('17:00');
  const [reason, setReason] = useState('ظرف عائلي طارئ');
  const [substituteId, setSubstituteId] = useState('');
  const [substituteReason, setSubstituteReason] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  // When currentShift is available, default employee
  useEffect(() => {
    if (currentShift && database.staff.length > 0 && !employeeId) {
      const activeNurse = database.staff.find((s) => s.role === 'nurse' && s.isActive);
      if (activeNurse) {
        setEmployeeId(activeNurse.id);
        setRole(activeNurse.role);
      }
    }
  }, [currentShift, database.staff, employeeId]);

  // When employee or times change, automatically find best substitute
  useEffect(() => {
    if (currentShift && employeeId) {
      const exitingStaff = database.staff.find((s) => s.id === employeeId);
      if (exitingStaff) {
        const staffRole = exitingStaff.role;
        setRole(staffRole);

        const result = findBestSubstituteForEmergencyExit(
          database.staff,
          currentShift,
          employeeId,
          staffRole,
          exitTime,
          returnTime
        );

        if (result.substitute) {
          setSubstituteId(result.substitute.id);
          setSubstituteReason(result.reason);
        } else {
          setSubstituteId('');
          setSubstituteReason(result.reason);
        }
        setWarnings(result.warnings);
      }
    }
  }, [employeeId, exitTime, returnTime, currentShift, database.staff]);

  if (!isOpen || !currentShift) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !substituteId) {
      alert('يرجى اختيار الموظف والبديل المكلف');
      return;
    }

    await recordEmergencyExit({
      shiftId: currentShift.id,
      employeeId,
      role,
      exitTime,
      returnTime,
      reason,
      substituteId,
    });

    onClose();
  };

  const criticalOverlap = calculateCriticalMinutesOverlap(exitTime, returnTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-lg w-full text-right max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              تسجيل خروج طارئ لموظف (ساعة أو ساعتان)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">الموظف الذي يطلب الخروج *</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              required
            >
              <option value="">-- اختر الموظف --</option>
              {database.staff
                .filter((s) => s.isActive)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role === 'nurse' ? 'ممرض' : 'مساعد تخدير'})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">وقت الخروج *</label>
              <input
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">وقت العودة *</label>
              <input
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">سبب الخروج الطارئ *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: ظرف عائلي قاهر، مراجعة قسم طارئ..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              required
            />
          </div>

          {/* Critical Period Overlap Notice */}
          {criticalOverlap > 0 && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center justify-between">
              <span>تداخل مع الفترة الحرجة (02:00 - 07:00):</span>
              <span className="font-black text-purple-700">
                {criticalOverlap} دقيقة حرجة (تُحول تلقائياً للبديل)
              </span>
            </div>
          )}

          {/* Substitute Selector */}
          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-sky-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>البديل المؤهل المكلف بالتغطية:</span>
              </label>
              <span className="text-[10px] text-sky-800 font-semibold">اختيار آلي عادل</span>
            </div>

            <select
              value={substituteId}
              onChange={(e) => setSubstituteId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs mb-2"
              required
            >
              <option value="">-- اختر البديل --</option>
              {database.staff
                .filter((s) => s.isActive && s.role === role && s.id !== employeeId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (رصيد عمل: {s.totalWorkHours}س • تغطيات سابقة: +{s.totalExtraCoverageHours}س)
                  </option>
                ))}
            </select>

            {substituteReason && (
              <p className="text-[11px] text-sky-900 leading-relaxed font-medium">
                {substituteReason}
              </p>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold space-y-1">
              {warnings.map((w, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
            >
              اعتماد الخروج وتكليف البديل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
