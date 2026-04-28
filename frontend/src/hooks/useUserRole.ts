"use client"

import { useSession } from 'next-auth/react';

const STAFF_ROLES = ['SUPER_ADMIN', 'TECH_SUPPORT', 'SUPERVISOR', 'TEACHER'];

export function useUserRole() {
  const { data: session, status } = useSession();
  const role = session?.user?.role || '';

  return {
    role,
    isGuest: role === 'GUEST',
    isStudent: role === 'STUDENT',
    isStaff: STAFF_ROLES.includes(role),
    isLoading: status === 'loading',
    session,
  };
}
