import React from 'react';
import SingleTabEnforcer from '@/components/auth/SingleTabEnforcer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SingleTabEnforcer />
      {children}
    </>
  );
}
