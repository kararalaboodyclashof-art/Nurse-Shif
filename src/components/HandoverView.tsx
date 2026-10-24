import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shift } from '../types';
import {
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  FileSignature,
  Edit2,
  Sparkles,
  Save,
  X,
  Users,
  PlusCircle,
  Trash2,
  UserCheck,
  Stethoscope,
  Info,
  CalendarPlus,
  RefreshCw,
} from 'lucide-react';

export const HandoverView: React.FC = () => {
  const {
    database,
    updateHandover,
    addSingleShift,
    deleteShift,
    initializeMonthlyShifts,
    setSelectedShiftId,
    isSupervisorMode,
  } = useApp();

  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [initStartDate, setInitStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);

  // Form states for edit / add
  const [shiftStartDate, setShiftStartDate] = useState('');
  const [shiftEndDate, setShiftEndDate] = useState('');
  
  // Nurse officer selection / custom
  const [nurseOfficerMode, setNurseOfficerMode] = useState<'select' | 'custom'>('select');
  const [nurseOfficerId, setNurseOfficerId] = useState('');
  const [customNurseName, setCustomNurseName] = useState('');

  // Anesthetist officer selection / custom
  const [anesOfficerMode, setAnesOfficerMode] = useState<'select' | 'custom'>('select');
  const [anesOfficerId, setAnesOfficerId] = useState('');
  const [customAnesName, setCustomAnesName] = useState('');

  const [autoAddStaff, setAutoAddStaff] = useState(true);
  const [handoverTime, setHandoverTime] = useState('08:00 ص');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [followUpIssues, setFollowUpIssues] = useState('');
  const [teamReceiptConfirmation, setTeamReceiptConfirmation] = useState(false);
  const [supervisorSignature, setSupervisorSignature] = useState('');

  const nursesList = database.staff.filter((s) => s.isActive && s.role === 'nurse');
  const anesList = database.staff.filter((s) => s.isActive && s.role === 'anesthetist');

  const handleOpenEdit = (shift: Shift) => {
    setEditingShiftId(shift.id);
    setIsAddingShift(false);
    setShiftStartDate(shift.startDate || '');
    setShiftEndDate(shift.endDate || '');

    // Check if current nurse is in staff list
    if (shift.handover.nurseOfficerId) {
      setNurseOfficerId(shift.handover.nurseOfficerId);
      setNurseOfficerMode('select');
      setCustomNurseName('');
    } else if (shift.handover.nurseOfficerName && shift.handover.nurseOfficerName !== 'لم يحدد بعد') {
      const found = nursesList.find((n) => n.name === shift.handover.nurseOfficerName);
      if (found) {
        setNurseOfficerId(found.id);
        setNurseOfficerMode('select');
        setCustomNurseName('');
      } else {
        setNurseOfficerMode('custom');
        setCustomNurseName(shift.handover.nurseOfficerName);
        setNurseOfficerId('');
      }
    } else {
      setNurseOfficerId('');
      setNurseOfficerMode(nursesList.length > 0 ? 'select' : 'custom');
      setCustomNurseName('');
    }

    // Check if current anesthetist is in staff list
    if (shift.handover.anesOfficerId) {
      setAnesOfficerId(shift.handover.anesOfficerId);
      setAnesOfficerMode('select');
      setCustomAnesName('');
    } else if (shift.handover.anesOfficerName && shift.handover.anesOfficerName !== 'لم يحدد بعد') {
      const found = anesList.find((a) => a.name === shift.handover.anesOfficerName);
      if (found) {
        setAnesOfficerId(found.id);
        setAnesOfficerMode('select');
        setCustomAnesName('');
      } else {
        setAnesOfficerMode('custom');
        setCustomAnesName(shift.handover.anesOfficerName);
        setAnesOfficerId('');
      }
    } else {
      setAnesOfficerId('');
      setAnesOfficerMode(anesList.length > 0 ? 'select' : 'custom');
      setCustomAnesName('');
    }

    setHandoverTime(shift.handover.handoverTime || '08:00 ص');
    setHandoverNotes(shift.handover.handoverNotes || '');
    setFollowUpIssues(shift.handover.followUpIssues || '');
    setTeamReceiptConfirmation(shift.handover.teamReceiptConfirmation || false);
    setSupervisorSignature(shift.handover.supervisorSignature || '');
  };

  const handleOpenAdd = () => {
    setIsAddingShift(true);
    setEditingShiftId(null);
    const today = new Date().toISOString().split('T')[0];
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const tomorrow = nextDay.toISOString().split('T')[0];

    setShiftStartDate(today);
    setShiftEndDate(tomorrow);
    setNurseOfficerMode(nursesList.length > 0 ? 'select' : 'custom');
    setNurseOfficerId('');
    setCustomNurseName('');
    setAnesOfficerMode(anesList.length > 0 ? 'select' : 'custom');
    setAnesOfficerId('');
    setCustomAnesName('');
    setHandoverTime('08:00 ص');
    setHandoverNotes('');
    setFollowUpIssues('');
    setTeamReceiptConfirmation(false);
    setSupervisorSignature('');
  };

  const handleStartDateChange = (newStartDate: string) => {
    setShiftStartDate(newStartDate);
    if (newStartDate) {
      const d = new Date(newStartDate);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 1);
        setShiftEndDate(d.toISOString().split('T')[0]);
      }
    }
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine Nurse Name & ID
    let finalNurseName = 'لم يحدد بعد';
    let finalNurseId: string | null = null;
    if (nurseOfficerMode === 'select') {
      const chosenNurse = nursesList.find((s) => s.id === nurseOfficerId);
      if (chosenNurse) {
        finalNurseName = chosenNurse.name;
        finalNurseId = chosenNurse.id;
      }
    } else if (customNurseName.trim()) {
      finalNurseName = customNurseName.trim();
    }

    // Determine Anesthesia Name & ID
    let finalAnesName = 'لم يحدد بعد';
    let finalAnesId: string | null = null;
    if (anesOfficerMode === 'select') {
      const chosenAnes = anesList.find((s) => s.id === anesOfficerId);
      if (chosenAnes) {
        finalAnesName = chosenAnes.name;
        finalAnesId = chosenAnes.id;
      }
    } else if (customAnesName.trim()) {
      finalAnesName = customAnesName.trim();
    }

    const combinedName = [
      finalNurseName !== 'لم يحدد بعد' ? finalNurseName : '',
      finalAnesName !== 'لم يحدد بعد' ? finalAnesName : '',
    ]
      .filter(Boolean)
      .join(' & ') || 'لم يحدد بعد';

    if (isAddingShift) {
      await addSingleShift({
        startDate: shiftStartDate,
        endDate: shiftEndDate,
        nurseOfficerId: finalNurseId,
        nurseOfficerName: finalNurseName,
        anesOfficerId: finalAnesId,
        anesOfficerName: finalAnesName,
        handoverNotes,
        autoAddStaff,
      });
      setIsAddingShift(false);
    } else if (editingShiftId) {
      await updateHandover(editingShiftId, {
        startDate: shiftStartDate,
        endDate: shiftEndDate,
        nurseOfficerId: finalNurseId,
        nurseOfficerName: finalNurseName,
        anesOfficerId: finalAnesId,
        anesOfficerName: finalAnesName,
        officerId: finalNurseId || finalAnesId || null,
        officerName: combinedName,
        officerRole: finalNurseId ? 'nurse' : finalAnesId ? 'anesthetist' : null,
        handoverTime,
        handoverNotes,
        followUpIssues,
        teamReceiptConfirmation,
        supervisorSignature,
        status: teamReceiptConfirmation && supervisorSignature ? 'approved' : 'signed',
        approvedAt: supervisorSignature ? new Date().toISOString() : null,
        autoAddStaff,
      });
      setEditingShiftId(null);
    }
  };

  const handleConfirmDeleteShift = async () => {
    if (!shiftToDelete) return;
    await deleteShift(shiftToDelete.id);
    setShiftToDelete(null);
  };

  const handleInitShifts = async (e: React.FormEvent) => {
    e.preventDefault();
    await initializeMonthlyShifts(initStartDate);
    setShowInitModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Control Actions */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-black text-slate-900">
              جدول التسليم والاستلام وتواريخ الخفارات
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              {database.shifts.length} خفارات مسجلة
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            يمكنك تحديد <strong>تاريخ كل خفارة</strong> مباشرة (ليظهر تلقائياً في شريط الخفارات العلوي)، واختيار <strong>شخصين معاً</strong> للاستلام: مسؤول استلام التمريض ومسؤول استلام التخدير.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Shift Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ إضافة خفارة جديدة</span>
          </button>

          {/* Generate 9 Shifts Button */}
          <button
            onClick={() => setShowInitModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition"
            title="إنشاء دورة الـ 9 خفارات المعتمدة دفعة واحدة مع تحديد تاريخ البداية"
          >
            <CalendarPlus className="w-4 h-4 text-slate-600" />
            <span>إنشاء / تجديد الخفارات الـ 9</span>
          </button>
        </div>
      </div>

      {/* Sync with Header Indicator Banner */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">مزامنة شريط الخفارات العلوي:</span> عند تعديل أو إضافة تاريخ الخفارة هنا، يتم تحديث التواريخ مباشرة في الشريط العلوي للتطبيق تلقائياً، ليظهر التاريخ الدقيق بدلاً من الترقيم العادي.
        </div>
      </div>

      {/* Handover Officers Locked at Start & End Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-950">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">التثبيت التلقائي في التوزيع العادل (أول وآخر الجدول):</span> مسؤولا التمريض والتخدير المحددان هنا يتم تثبيتهما تلقائياً عند الضغط على "التوزيع العادل" كـ <strong>أول الجدول (14:00 - 16:00)</strong> لاستلام المناوبة من الكادر الصباحي، و<strong>آخر الجدول (06:00 - 08:00)</strong> لتسليم المناوبة للكادر الصباحي التالي.
        </div>
      </div>

      {/* Officers Rotation Summary (Nurses + Anesthetists) */}
      {database.staff.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4">
            <h4 className="font-bold text-sky-950 text-xs mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>كادر التمريض (مرات التكليف بمسؤولية الاستلام):</span>
              </span>
              <span className="text-[10px] bg-sky-200/60 text-sky-900 px-2 py-0.5 rounded-full font-bold">
                {nursesList.length} ممرضين
              </span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {nursesList.map((staff) => (
                <div
                  key={staff.id}
                  className="bg-white px-2.5 py-1 rounded-lg border border-sky-100 shadow-2xs text-xs flex items-center gap-1.5"
                >
                  <span className="font-semibold text-slate-800">{staff.name}:</span>
                  <span className="font-black text-sky-700">{staff.handoverOfficerCount} مرات</span>
                </div>
              ))}
              {nursesList.length === 0 && (
                <span className="text-slate-400 text-xs italic">لا يوجد ممرضون مسجلون بعد</span>
              )}
            </div>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4">
            <h4 className="font-bold text-indigo-950 text-xs mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>كادر التخدير (مرات التكليف بمسؤولية الاستلام):</span>
              </span>
              <span className="text-[10px] bg-indigo-200/60 text-indigo-900 px-2 py-0.5 rounded-full font-bold">
                {anesList.length} مساعدي تخدير
              </span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {anesList.map((staff) => (
                <div
                  key={staff.id}
                  className="bg-white px-2.5 py-1 rounded-lg border border-indigo-100 shadow-2xs text-xs flex items-center gap-1.5"
                >
                  <span className="font-semibold text-slate-800">{staff.name}:</span>
                  <span className="font-black text-indigo-700">{staff.handoverOfficerCount} مرات</span>
                </div>
              ))}
              {anesList.length === 0 && (
                <span className="text-slate-400 text-xs italic">لا يوجد مساعدو تخدير مسجلون بعد</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no shifts exist */}
      {database.shifts.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl mx-auto flex items-center justify-center">
            <CalendarPlus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              جدول التسليم والاستلام فارغ حالياً
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              لم يتم إنشاء أي خفارات بعد. يمكنك إنشاء الخفارات الـ 9 المعتمدة دفعة واحدة وفق نظام العمل (18 ساعة خفارة + 3 أيام راحة) مع تحديد تاريخ البداية، أو إضافة خفارة واحدة وتحديد تاريخها ومسؤوليها.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowInitModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>إنشاء الخفارات الشهرية الـ 9 المعتمدة الآن</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ إضافة خفارة فردية</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Initialize 9 Shifts */}
      {showInitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full text-right">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-sky-600" />
                <span>إنشاء دورة الخفارات الشهرية الـ 9</span>
              </h3>
              <button
                onClick={() => setShowInitModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitShifts} className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                سيتم توليد 9 خفارات شهرية مدة كل منها 18 ساعة (من 2:00 ظهراً حتى 8:00 صباحاً في اليوم التالي)، ويعقب كل خفارة 3 أيام استراحة رسمية وفق النظام المعتمد.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  تاريخ بدء الخفارة الأولى (خفارة 1):
                </label>
                <input
                  type="date"
                  value={initStartDate}
                  onChange={(e) => setInitStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  سيتم حساب تواريخ باقي الخفارات الـ 9 تلقائياً بإضافة 4 أيام لكل دورة خفارة.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInitModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وإنشاء الخفارات الـ 9</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Shift Confirmation */}
      {shiftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-right">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-sm mb-1">
              تأكيد حذف الخفارة
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              هل أنت متأكد من رغبتك في حذف <strong>خفارة رقم {shiftToDelete.number}</strong> بتاريخ {shiftToDelete.startDate}؟ سيتم إعادة ترتيب باقي الخفارات تلقائياً.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShiftToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteShift}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit or Add Shift & Handover Officers */}
      {(editingShiftId || isAddingShift) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-xl w-full text-right my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {isAddingShift
                    ? 'إضافة خفارة جديدة وتحديد تاريخها والمسؤولين'
                    : 'تعديل جدول التسليم والاستلام وتاريخ الخفارة'}
                </h3>
                <span className="text-[11px] text-slate-500">
                  حدد تاريخ الخفارة (يظهر تلقائياً في الشريط العلوي) واختر مسؤولي التمريض والتخدير معاً.
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingShiftId(null);
                  setIsAddingShift(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-4 text-xs">
              {/* 1. Shift Date Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>تحديد تاريخ الخفارة المعتمد:</span>
                  </span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                    يحدّث الشريط العلوي فوراً
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      تاريخ بدء الخفارة (2:00 ظهراً) *
                    </label>
                    <input
                      type="date"
                      value={shiftStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      تاريخ انتهاء الخفارة (8:00 صباحاً) *
                    </label>
                    <input
                      type="date"
                      value={shiftEndDate}
                      onChange={(e) => setShiftEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. Dual Handover Officers: Nurse + Anesthetist */}
              <div className="p-3.5 bg-sky-50/40 rounded-xl border border-sky-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sky-950 text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>تحديد مسؤولي الاستلام (شخصان معاً: تمريض + تخدير):</span>
                  </span>
                  <span className="text-[10px] text-sky-700 font-bold bg-white px-2 py-0.5 rounded-md border border-sky-200">
                    مسؤولية مشتركة 18 ساعة
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Nurse Officer */}
                  <div className="bg-white p-3 rounded-xl border border-sky-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-sky-900 text-xs flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                        <span>مسؤول استلام التمريض *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setNurseOfficerMode(nurseOfficerMode === 'select' ? 'custom' : 'select')
                        }
                        className="text-[10px] text-sky-700 underline hover:text-sky-900 font-bold"
                      >
                        {nurseOfficerMode === 'select' ? 'كتابة اسم يدوي' : 'اختيار من القائمة'}
                      </button>
                    </div>

                    {nurseOfficerMode === 'select' && nursesList.length > 0 ? (
                      <select
                        value={nurseOfficerId}
                        onChange={(e) => setNurseOfficerId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      >
                        <option value="">-- اختر من كادر التمريض --</option>
                        {nursesList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (كُلّف {s.handoverOfficerCount} مرات)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={customNurseName}
                          onChange={(e) => setCustomNurseName(e.target.value)}
                          placeholder="اكتب اسم مسؤول التمريض هنا..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                        {nursesList.length === 0 && (
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            لم يسجل ممرضون في الكادر، يمكنك كتابة الاسم مباشرة.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Anesthetist Officer */}
                  <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-indigo-900 text-xs flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>مسؤول استلام التخدير *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setAnesOfficerMode(anesOfficerMode === 'select' ? 'custom' : 'select')
                        }
                        className="text-[10px] text-indigo-700 underline hover:text-indigo-900 font-bold"
                      >
                        {anesOfficerMode === 'select' ? 'كتابة اسم يدوي' : 'اختيار من القائمة'}
                      </button>
                    </div>

                    {anesOfficerMode === 'select' && anesList.length > 0 ? (
                      <select
                        value={anesOfficerId}
                        onChange={(e) => setAnesOfficerId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="">-- اختر من مساعدي التخدير --</option>
                        {anesList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (كُلّف {s.handoverOfficerCount} مرات)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={customAnesName}
                          onChange={(e) => setCustomAnesName(e.target.value)}
                          placeholder="اكتب اسم مسؤول التخدير هنا..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                        {anesList.length === 0 && (
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            لم يسجل مساعدو تخدير بعد، يمكنك كتابة الاسم مباشرة.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto add new staff checkbox */}
                {(nurseOfficerMode === 'custom' || anesOfficerMode === 'custom') && (
                  <div className="flex items-center gap-2 pt-1 text-slate-700">
                    <input
                      type="checkbox"
                      id="autoAddStaffCheck"
                      checked={autoAddStaff}
                      onChange={(e) => setAutoAddStaff(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500"
                    />
                    <label htmlFor="autoAddStaffCheck" className="font-semibold cursor-pointer">
                      إضافة الأسماء الجديدة المكتوبة تلقائياً إلى الكادر الطبي في القسم
                    </label>
                  </div>
                )}
              </div>

              {/* 3. Handover details */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">وقت التسليم والاستلام:</label>
                <input
                  type="text"
                  value={handoverTime}
                  onChange={(e) => setHandoverTime(e.target.value)}
                  placeholder="مثال: 08:00 صباحاً"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ملاحظات التسليم العامة وحالة العناية المركزة (RCU):
                </label>
                <textarea
                  rows={2}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="حالة المرضى، أجهزة التنفس الاصطناعي، العهدة الطبية، الحالات الحرجة..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  مشكلات أو توجيهات تحتاج متابعة في الخفارة القادمة:
                </label>
                <textarea
                  rows={2}
                  value={followUpIssues}
                  onChange={(e) => setFollowUpIssues(e.target.value)}
                  placeholder="أعطال أجهزة، نتائج تحاليل معلقة، طلبيات أدوية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="receiptCheck"
                  checked={teamReceiptConfirmation}
                  onChange={(e) => setTeamReceiptConfirmation(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500"
                />
                <label htmlFor="receiptCheck" className="font-bold text-slate-800 cursor-pointer">
                  تأكيد استلام كادر التمريض والتخدير للمهام والعهدة الطبية كاملاً
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  توقيع المسؤولين / الاعتماد الإلكتروني:
                </label>
                <input
                  type="text"
                  value={supervisorSignature}
                  onChange={(e) => setSupervisorSignature(e.target.value)}
                  placeholder="اكتب الاسم لاعتماد السجل إلكترونياً (مثال: د. ماجد المشرف)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingShiftId(null);
                    setIsAddingShift(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وتأكيد السجل والتاريخ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Handover Records Table */}
      {database.shifts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-xs flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>قائمة سجلات التسليم والاستلام وتواريخ الخفارات</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              اضغط على زر <strong>تحرير</strong> لتعديل التاريخ أو اختيار مسؤولي الاستلام
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم الخفارة</th>
                  <th className="py-3 px-4">تاريخ الخفارة المعتمد</th>
                  <th className="py-3 px-4">مسؤول استلام التمريض</th>
                  <th className="py-3 px-4">مسؤول استلام التخدير</th>
                  <th className="py-3 px-4">وقت التسليم</th>
                  <th className="py-3 px-4">تأكيد الاستلام</th>
                  <th className="py-3 px-4">ملاحظات ومتابعة</th>
                  <th className="py-3 px-4">الاعتماد</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {database.shifts.map((shift) => {
                  const handover = shift.handover;

                  return (
                    <tr
                      key={shift.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-800">
                          خفارة {shift.number}
                        </span>
                      </td>

                      {/* Date Column with visual sync indicator */}
                      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sky-900 font-mono text-xs">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          <span>{shift.startDate}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          إلى: {shift.endDate} (08:00 ص)
                        </div>
                      </td>

                      {/* Nurse Officer */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {handover.nurseOfficerName && handover.nurseOfficerName !== 'لم يحدد بعد' ? (
                          <div className="font-bold text-sky-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-600" />
                            <span>{handover.nurseOfficerName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-sky-50 text-sky-700 rounded-sm">
                              تمريض
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium italic">لم يحدد بعد</span>
                        )}
                      </td>

                      {/* Anesthetist Officer */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {handover.anesOfficerName && handover.anesOfficerName !== 'لم يحدد بعد' ? (
                          <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            <span>{handover.anesOfficerName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-sm">
                              تخدير
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium italic">لم يحدد بعد</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-semibold whitespace-nowrap">
                        {handover.handoverTime || '08:00 ص'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {handover.teamReceiptConfirmation ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            تم الاستلام
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">في الانتظار</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        {handover.handoverNotes || handover.followUpIssues ? (
                          <div>
                            {handover.handoverNotes && <div>{handover.handoverNotes}</div>}
                            {handover.followUpIssues && (
                              <div className="text-amber-700 font-medium mt-0.5">
                                متابعة: {handover.followUpIssues}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">لا توجد ملاحظات مسجلة</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {handover.supervisorSignature ? (
                          <div className="font-bold text-slate-800 flex items-center gap-1 text-emerald-700">
                            <FileSignature className="w-3.5 h-3.5" />
                            <span>{handover.supervisorSignature}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">غير معتمد</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(shift)}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-bold text-[11px] transition flex items-center gap-1"
                            title="تعديل تاريخ الخفارة وتعيين مسؤولي الاستلام (تمريض + تخدير)"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>تحرير</span>
                          </button>

                          <button
                            onClick={() => setShiftToDelete(shift)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="حذف الخفارة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
