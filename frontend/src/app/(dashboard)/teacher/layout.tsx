"use client";

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {children}
      </main>
    </div>
  );
}
