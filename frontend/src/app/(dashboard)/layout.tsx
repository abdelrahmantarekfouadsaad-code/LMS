import React from 'react';
import SingleTabEnforcer from '@/components/auth/SingleTabEnforcer';

export const dynamic = 'force-dynamic';

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
