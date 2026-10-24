import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileCheck, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ShiftApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftApprovalModal: React.FC<ShiftApprovalModalProps> = ({ isOpen, onClose }) => {
  const { currentShift, approveShiftSchedule } = useApp();

  const [approvedBy, setApprovedBy] = useState('د. مشرف الخفارات');
  const [notes, setNotes] = useState('تمت مراجعة تغطية الفترات الـ 9 وساعات الراحة ومطابقة المعايير الطبية.');

  if (!isOpen || !currentShift) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvedBy.trim()) {
      alert('يرجى إدخال اسم المشرف المعتمد');
      return;
    }

    await approveShiftSchedule(currentShift.id, approvedBy.trim(), notes.trim());
    onClose();
  };

  const uncoveredCount = currentShift.assignments.filter((a) => !a.isCovered).length;
  const conflictCount = currentShift.assignments.filter((a) => a.hasConflict).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-lg w-full text-right">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              الاعتماد الرسمي لجدول الخفارة رقم {currentShift.number}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Check Warning */}
        {uncoveredCount > 0 && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              تحذير: توجد {uncoveredCount} فترات غير مغطاة بكامل الكادر! لا ينصح بالاعتماد النهائي قبل توفير التغطية الآمنة.
            </span>
          </div>
        )}

        {conflictCount > 0 && (
          <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              تنبيه: يوجد {conflictCount} تعارض لساعات عمل متقاربة يتطلب موافقة واستثناء إداري خاص.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم المشرف المعتمد *</label>
            <input
              type="text"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ملاحظات وقرار الاعتماد</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs"
            />
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            >
              تأكيد الاعتماد النهائي ونشر الجدول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
