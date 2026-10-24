/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { StaffManagementView } from './components/StaffManagementView';
import { PeriodsScheduleView } from './components/PeriodsScheduleView';
import { CriticalPeriodReportView } from './components/CriticalPeriodReportView';
import { HandoverView } from './components/HandoverView';
import { ReportsView } from './components/ReportsView';
import { AuditLogView } from './components/AuditLogView';

// Modals
import { EmergencyExitModal } from './components/EmergencyExitModal';
import { LeaveModal } from './components/LeaveModal';
import { ManualOverrideModal } from './components/ManualOverrideModal';
import { ShiftApprovalModal } from './components/ShiftApprovalModal';
import { DatabaseSettingsModal } from './components/DatabaseSettingsModal';
import { DataPersistenceModal } from './components/DataPersistenceModal';
import { TestScenariosModal } from './components/TestScenariosModal';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { ShieldCheck, WifiOff } from 'lucide-react';

function MainLayout() {
  const { activeView, isLoading } = useApp();
  const isOnline = useOnlineStatus();

  // Modal states
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPersistenceModalOpen, setIsPersistenceModalOpen] = useState(false);
  const [persistenceModalTab, setPersistenceModalTab] = useState<'share' | 'sync' | 'storage'>('share');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [overridePeriodIndex, setOverridePeriodIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-xl animate-pulse mb-4 shadow-lg shadow-sky-600/20">
          NS
        </div>
        <div className="text-sm font-bold text-slate-700">جارٍ تحميل نظام NurseShift...</div>
        <div className="text-xs text-slate-400 mt-1">قاعدة بيانات خفارات التمريض والتخدير الدائمة</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <Header
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenPersistenceModal={(tab) => {
          setPersistenceModalTab(tab || 'share');
          setIsPersistenceModalOpen(true);
        }}
        onOpenTestModal={() => setIsTestModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'dashboard' && (
          <DashboardView
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
            onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
            onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
            onOpenPersistenceModal={(tab) => {
              setPersistenceModalTab(tab || 'share');
              setIsPersistenceModalOpen(true);
            }}
            onOpenManualOverride={(pIdx) => setOverridePeriodIndex(pIdx)}
          />
        )}

        {activeView === 'periods' && (
          <PeriodsScheduleView
            onOpenManualOverride={(pIdx) => setOverridePeriodIndex(pIdx)}
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
          />
        )}

        {activeView === 'critical' && <CriticalPeriodReportView />}

        {activeView === 'handover' && <HandoverView />}

        {activeView === 'staff' && <StaffManagementView />}

        {activeView === 'reports' && <ReportsView />}

        {activeView === 'audit' && <AuditLogView />}
      </main>

      {/* Offline Toast Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg animate-bounce">
          <WifiOff className="w-4 h-4" />
          <span>وضع عدم الاتصال — يتم الحفظ في التخزين المحلي مؤقتاً</span>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">NurseShift</span>
            <span>• نظام ذكي لإدارة وتنظيم الخفارات التمريضية والتخدير</span>
          </div>
          <div className="text-[11px] text-slate-400">
            تطبيق إداري تنظيمي • خفارات 18 ساعة (2:00 م - 8:00 ص) يعقبها 3 أيام راحة معتمدة
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EmergencyExitModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />

      <ManualOverrideModal
        isOpen={overridePeriodIndex !== null}
        periodIndex={overridePeriodIndex}
        onClose={() => setOverridePeriodIndex(null)}
      />

      <ShiftApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
      />

      <DatabaseSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <DataPersistenceModal
        isOpen={isPersistenceModalOpen}
        defaultTab={persistenceModalTab}
        onClose={() => setIsPersistenceModalOpen(false)}
      />

      <TestScenariosModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
