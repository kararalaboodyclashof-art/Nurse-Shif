import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { runAllTestScenarios } from '../utils/testScenarios';
import { ScenarioTestResult } from '../types';
import {
  FlaskConical,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TestScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestScenariosModal: React.FC<TestScenariosModalProps> = ({ isOpen, onClose }) => {
  const { database } = useApp();
  const [results, setResults] = useState<ScenarioTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const testResults = runAllTestScenarios(database.staff);
      setResults(testResults);
      setIsRunning(false);
    }, 400);
  };

  const passedCount = results.filter((r) => r.status === 'passed').length;
  const warningCount = results.filter((r) => r.status === 'warning').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-3xl w-full text-right max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                مركز محاكاة واختبار السيناريوهات الـ 10 الإلزامية
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                فحص آلي شامل لقواعد العدالة، تغطية الفترات، حالات الإجازات، الخروج الطارئ، ومنع الـ 4 ساعات متواصلة.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button & Summary */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-purple-950 text-xs block">
              اختبار النظام قبل الاعتماد النهائي
            </span>
            <span className="text-[11px] text-purple-800">
              يتم تطبيق واختبار جميع السيناريوهات الـ 10 الواردة في متطلبات النظام.
            </span>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 shrink-0"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'جارٍ تشغيل الاختبارات...' : 'تشغيل الاختبارات الـ 10 الآن'}</span>
          </button>
        </div>

        {/* Result Statistics */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
              <span className="text-[10px] text-emerald-600 font-bold block">ناجحة بالكامل</span>
              <span className="text-lg font-black text-emerald-800">{passedCount} / 10</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
              <span className="text-[10px] text-amber-600 font-bold block">تحذيرات إدارية</span>
              <span className="text-lg font-black text-amber-800">{warningCount} / 10</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5">
              <span className="text-[10px] text-rose-600 font-bold block">إخفاقات</span>
              <span className="text-lg font-black text-rose-800">{failedCount} / 10</span>
            </div>
          </div>
        )}

        {/* Scenarios List */}
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-semibold">
              اضغط على زر "تشغيل الاختبارات الـ 10 الآن" لبدء الفحص والتحقق الآلي.
            </div>
          ) : (
            results.map((res) => {
              const isExpanded = expandedId === res.id;
              const isPassed = res.status === 'passed';
              const isWarning = res.status === 'warning';

              return (
                <div
                  key={res.id}
                  className={`border rounded-xl transition-all ${
                    isPassed
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isWarning
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : res.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer select-none text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900">{res.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{res.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isPassed
                            ? 'bg-emerald-100 text-emerald-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isPassed ? 'تم الاجتياز بنجاح' : isWarning ? 'تنبيه إداري' : 'فشل'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3.5 pt-0 border-t border-slate-100/60 text-xs space-y-2">
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {res.details.map((detail, dIdx) => (
                          <li key={dIdx}>{detail}</li>
                        ))}
                      </ul>

                      {res.metrics && (
                        <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-600">
                          {Object.entries(res.metrics).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-slate-400">{k}:</span>
                              <span className="font-bold text-slate-800">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end mt-5 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
