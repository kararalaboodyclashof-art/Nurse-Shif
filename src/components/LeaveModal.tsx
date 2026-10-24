import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LeaveRecord } from '../types';
import { UserX, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, onClose }) => {
  const { currentShift, database, recordLeave, cancelLeave } = useApp();

  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveRecord['type']>('annual');
  const [reason, setReason] = useState('إجازة اعتيادية مجدولة');

  if (!isOpen || !currentShift) return null;

  const currentLeaveIds = new Set(currentShift.leaves.map((l) => l.employeeId));
  const availableStaff = database.staff.filter((s) => s.isActive && !currentLeaveIds.has(s.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      alert('يرجى تحديد الموظف المجاز');
      return;
    }

    await recordLeave(currentShift.id, employeeId, leaveType, reason);
    setEmployeeId('');
    onClose();
  };

  const handleCancelLeave = async (empId: string) => {
    if (window.confirm('هل تريد إلغاء هذه الإجازة وإعادة الموظف إلى جدول الخفارة؟')) {
      await cancelLeave(currentShift.id, empId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-lg w-full text-right max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              إدارة الإجازات والغياب — الخفارة رقم {currentShift.number}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Leaves in Shift */}
        {currentShift.leaves.length > 0 && (
          <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
            <h4 className="font-bold text-rose-900 mb-2">
              الإجازات المسجلة حالياً في هذه الخفارة ({currentShift.leaves.length}):
            </h4>
            <div className="space-y-1.5">
              {currentShift.leaves.map((leave) => {
                const staff = database.staff.find((s) => s.id === leave.employeeId);
                return (
                  <div
                    key={leave.employeeId}
                    className="flex items-center justify-between bg-white p-2 rounded-lg border border-rose-100"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{staff?.name}</span>
                      <span className="text-[11px] text-slate-500 mr-2">
                        ({leave.type === 'sick' ? 'مرضية' : leave.type === 'annual' ? 'اعتيادية' : 'طارئة'} - {leave.reason})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelLeave(leave.employeeId)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                    >
                      إلغاء الإجازة
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Register New Leave Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">الموظف طالب الإجازة *</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              required
            >
              <option value="">-- اختر الموظف --</option>
              {availableStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role === 'nurse' ? 'ممرض' : 'مساعد تخدير'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">نوع الإجازة *</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveRecord['type'])}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
            >
              <option value="annual">إجازة اعتيادية مجدولة</option>
              <option value="sick">إجازة مرضية معتمدة</option>
              <option value="emergency">إجازة طارئة</option>
              <option value="administrative">عذر إداري / انتداب رسمي</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">سبب أو مبرر الإجازة *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب السبب الإداري..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              required
            />
          </div>

          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 leading-relaxed text-[11px]">
            <strong>ملاحظة هامة:</strong> بمجرد تسجيل الإجازة، سيقوم النظام تلقائياً بإعادة توزيع الفترات الـ 9 على الكوادر الحاضرين المؤهلين بالتساوي، مع استبعاد المجاز من أي عبء أو تكليف.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
            >
              إغلاق
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
            >
              تسجيل الإجازة وإعادة الجدولة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
