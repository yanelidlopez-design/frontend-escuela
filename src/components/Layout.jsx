import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout = ({ activeTab, setActiveTab, title, children }) => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
};
