import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PERIOD_DEFINITIONS } from '../utils/fairnessEngine';
import { Edit3, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ManualOverrideModalProps {
  isOpen: boolean;
  periodIndex: number | null;
  onClose: () => void;
}

export const ManualOverrideModal: React.FC<ManualOverrideModalProps> = ({
  isOpen,
  periodIndex,
  onClose,
}) => {
  const { currentShift, database, updatePeriodAssignment } = useApp();

  const [nurseId, setNurseId] = useState<string>('');
  const [anesthetistId, setAnesthetistId] = useState<string>('');
  const [reason, setReason] = useState('تعديل تنظيمي بقرار من المشرف');

  useEffect(() => {
    if (currentShift && periodIndex !== null) {
      const assignment = currentShift.assignments.find((a) => a.periodIndex === periodIndex);
      if (assignment) {
        setNurseId(assignment.nurseId || '');
        setAnesthetistId(assignment.anesthetistId || '');
      }
    }
  }, [currentShift, periodIndex]);

  if (!isOpen || !currentShift || periodIndex === null) return null;

  const periodDef = PERIOD_DEFINITIONS[periodIndex];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('يرجى كتابة سبب التعديل لتوثيقه في سجل التدقيق الإداري');
      return;
    }

    await updatePeriodAssignment(
      currentShift.id,
      periodIndex,
      nurseId || null,
      anesthetistId || null,
      reason.trim()
    );

    onClose();
  };

  const nurses = database.staff.filter((s) => s.isActive && s.role === 'nurse');
  const anesthetists = database.staff.filter((s) => s.isActive && s.role === 'anesthetist');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-lg w-full text-right">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              تعديل يدوي للفترة {periodIndex + 1} ({periodDef.label})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 bg-slate-50 p-3 rounded-xl text-xs text-slate-600 flex items-center justify-between">
          <span>التوقيت: {periodDef.displayTime}</span>
          <span className="font-bold text-slate-900">الخفارة رقم {currentShift.number}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">الممرض المكلف:</label>
            <select
              value={nurseId}
              onChange={(e) => setNurseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            >
              <option value="">-- شاغر (بدون ممرض) --</option>
              {nurses.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} (رصيد عمل: {n.totalWorkHours}س • حرج: {n.totalCriticalHours}س)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">مساعد التخدير المكلف:</label>
            <select
              value={anesthetistId}
              onChange={(e) => setAnesthetistId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            >
              <option value="">-- شاغر (بدون مساعد تخدير) --</option>
              {anesthetists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (رصيد عمل: {a.totalWorkHours}س • حرج: {a.totalCriticalHours}س)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              سبب التعديل اليدوي (إلزامي للتدقيق والرقابة) *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: تبديل ودي بين الزملاء، مهارة خاصة لحالة حرجة..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              required
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-medium leading-relaxed">
            سيتم توثيق هذا الإجراء وتوقيت التعديل واسم المشرف في سجل التدقيق والمراجعة الدائم للنظام.
          </div>

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
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm"
            >
              حفظ التعديل في السجل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
