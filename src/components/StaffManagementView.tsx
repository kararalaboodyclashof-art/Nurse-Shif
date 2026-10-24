import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StaffMember, Role, QualificationLevel } from '../types';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Sparkles,
  Phone,
  Clock,
  Moon,
  ShieldAlert,
  Search,
  CheckCircle2,
  Award,
} from 'lucide-react';

export const StaffManagementView: React.FC = () => {
  const {
    database,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    loadPresetStaffSquad,
    isSupervisorMode,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'nurse' | 'anesthetist'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('nurse');
  const [qualification, setQualification] = useState<QualificationLevel>('senior');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await updateStaffMember(
        editingId,
        {
          name: name.trim(),
          role,
          qualification,
          phone: phone.trim(),
          notes: notes.trim(),
        },
        `تحديث بيانات الموظف ${name}`
      );
      setEditingId(null);
    } else {
      await addStaffMember({
        name: name.trim(),
        role,
        qualification,
        phone: phone.trim(),
        isActive: true,
        notes: notes.trim(),
      });
      setIsAdding(false);
    }

    // Reset form
    setName('');
    setPhone('');
    setNotes('');
  };

  const handleEditClick = (staff: StaffMember) => {
    setEditingId(staff.id);
    setName(staff.name);
    setRole(staff.role);
    setQualification(staff.qualification);
    setPhone(staff.phone || '');
    setNotes(staff.notes || '');
    setIsAdding(true);
  };

  const nursesCount = database.staff.filter((s) => s.role === 'nurse').length;
  const anesthetistsCount = database.staff.filter((s) => s.role === 'anesthetist').length;

  const filteredStaff = database.staff.filter((s) => {
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Setup */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-black text-slate-900">إدارة الكادر الطبي والتمريضي</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
              إجمالي الكادر: {database.staff.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            الكادر المعتمد للقسم: 6 ممرضين و5 مساعدي تخدير مع إمكانية تعديل الأسماء والأعداد ومتابعة الأرصدة التراكمية.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {database.staff.length === 0 && (
            <button
              onClick={loadPresetStaffSquad}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>تحميل الكادر الأساسي (6+5)</span>
            </button>
          )}

          {isSupervisorMode && (
            <button
              onClick={() => {
                setEditingId(null);
                setName('');
                setPhone('');
                setNotes('');
                setIsAdding(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة كادر جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Balance Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              م
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">ممرضو القسم (Nurses)</div>
              <div className="text-xs text-slate-500">العدد المسجل: {nursesCount} ممرضين</div>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              nursesCount >= 6 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {nursesCount >= 6 ? 'مكتمل (6+)' : `مطلوب 6 (الحالي ${nursesCount})`}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              ت
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">مساعدو التخدير (Anesthetists)</div>
              <div className="text-xs text-slate-500">العدد المسجل: {anesthetistsCount} مساعدين</div>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              anesthetistsCount >= 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {anesthetistsCount >= 5 ? 'مكتمل (5+)' : `مطلوب 5 (الحالي ${anesthetistsCount})`}
          </span>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isAdding && (
        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-sky-200 pb-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-sky-600" />
              <span>{editingId ? 'تعديل بيانات الكادر' : 'إضافة كادر تمريضي / تخدير جديد'}</span>
            </h3>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              إلغاء
            </button>
          </div>

          <form onSubmit={handleSaveMember} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد الشمري"
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الدور / التخصص *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="nurse">ممرض (Nurse)</option>
                <option value="anesthetist">مساعد تخدير (Anesthesia Assistant)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الدرجة والتأهيل المهني</label>
              <select
                value={qualification}
                onChange={(e) => setQualification(e.target.value as QualificationLevel)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="specialist">أخصائي (Specialist)</option>
                <option value="senior">أقدم / أول (Senior)</option>
                <option value="certified">معتمد (Certified)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">ملاحظات إدارية</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات حول المهام أو الأقدمية..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-end gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    const target = database.staff.find((s) => s.id === editingId);
                    if (target) setStaffToDelete(target);
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1 shrink-0"
                  title="حذف هذا الموظف إذا تمت إضافته بالخطأ"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>حذف الموظف</span>
                </button>
              )}
              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm"
              >
                {editingId ? 'حفظ التعديلات' : 'إضافة إلى الكادر'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              roleFilter === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({database.staff.length})
          </button>
          <button
            onClick={() => setRoleFilter('nurse')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              roleFilter === 'nurse' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تمريض ({nursesCount})
          </button>
          <button
            onClick={() => setRoleFilter('anesthetist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              roleFilter === 'anesthetist' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            مساعد تخدير ({anesthetistsCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white"
          />
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => {
          const isNurse = staff.role === 'nurse';
          return (
            <div
              key={staff.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                        isNurse ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {isNurse ? 'ممرض' : 'تخدير'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {isNurse ? 'كادر تمريض' : 'مساعد تخدير'} • {staff.qualification === 'specialist' ? 'أخصائي' : staff.qualification === 'senior' ? 'أقدم' : 'معتمد'}
                      </span>
                    </div>
                  </div>

                  {isSupervisorMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(staff)}
                        className="p-1 text-slate-400 hover:text-sky-600 rounded-lg transition"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setStaffToDelete(staff)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="حذف هذا الموظف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Cumulative Balance Badges */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 mb-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">ساعات العمل</span>
                    <span className="font-black text-slate-800">{staff.totalWorkHours}س</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">تغطية إضافية</span>
                    <span className="font-black text-emerald-700">+{staff.totalExtraCoverageHours}س</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">ساعات حرجة</span>
                    <span className="font-black text-purple-700">{staff.totalCriticalHours}س</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center justify-between">
                    <span>الفترات الليلية المتأخرة:</span>
                    <span className="font-bold text-slate-700">{staff.lateNightPeriodsCount} فترات</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>خفارات حضرها فعلياً:</span>
                    <span className="font-bold text-slate-700">{staff.shiftsAttendedCount} من 9</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>مسؤول تسليم واستلام:</span>
                    <span className="font-bold text-slate-700">{staff.handoverOfficerCount} مرات</span>
                  </div>
                  {staff.phone && (
                    <div className="flex items-center gap-1 text-slate-600 pt-1 border-t border-slate-100">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{staff.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Staff Confirmation Modal */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-right border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-base text-center mb-2">
              تأكيد حذف الموظف
            </h3>
            <p className="text-xs text-slate-600 text-center mb-5 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف <strong className="text-slate-900">"{staffToDelete.name}"</strong> من كادر القسم؟
              <br />
              <span className="text-[11px] text-slate-400 mt-1 block">
                (إذا تمت إضافة هذا الاسم بالخطأ، سيتم حذفه بالكامل وتحديث جداول الخفارة والأرصدة تلقائياً).
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = staffToDelete;
                  setStaffToDelete(null);
                  if (editingId === target.id) {
                    setIsAdding(false);
                    setEditingId(null);
                  }
                  await deleteStaffMember(target.id, `حذف الموظف ${target.name} من الكادر`);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
              >
                نعم، احذف الاسم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
