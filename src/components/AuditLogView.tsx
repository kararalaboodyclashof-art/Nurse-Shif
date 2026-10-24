import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { History, ShieldCheck, Search, Calendar, User, FileText } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { database } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = database.auditLog.filter(
    (log) =>
      log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.changesSummary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900">سجل التدقيق والمراجعة الإدارية</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            توثيق رقمي دائم لكافة التعديلات والتوزيعات والقرارات الإدارية، متضمناً التاريخ والوقت والسبب والشخص المسؤول.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>إجمالي السجلات: {database.auditLog.length}</span>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالسبب أو اسم المشرف أو نوع التعديل..."
            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            لا توجد سجلات تدقيق مطابقة
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{entry.reason}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{entry.changesSummary}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between text-[11px] text-slate-400 gap-1 shrink-0">
                    <span className="flex items-center gap-1 text-slate-700 font-bold">
                      <User className="w-3 h-3 text-slate-400" />
                      {entry.author}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(entry.timestamp).toLocaleString('ar-EG')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
