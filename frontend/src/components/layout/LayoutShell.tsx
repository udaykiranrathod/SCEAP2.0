// frontend/src/components/layout/LayoutShell.tsx
import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface Props {
  children: React.ReactNode;
}

const LayoutShell: React.FC<Props> = ({ children }) => {
  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-3 md:p-5">{children}</main>
      </div>
    </div>
  );
};

export default LayoutShell;
