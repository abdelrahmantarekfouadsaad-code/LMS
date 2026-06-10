"use client";

import { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/axios';
import { useTranslation } from '@/i18n/TranslationContext';
import { Search, ChevronDown, MoreVertical, Shield, User, GraduationCap, X, Check, Eye, BookOpen } from 'lucide-react';

const FILTER_ROLES = [
  'All', 'Student', 'Teacher', 'Super Admin', 'Guest', 'Organizer', 'Technical Support', 'Parent'
];

const ROLE_MAPPING: Record<string, string> = {
  'All': '',
  'Student': 'STUDENT',
  'Teacher': 'TEACHER',
  'Super Admin': 'SUPER_ADMIN',
  'Guest': 'GUEST',
  'Organizer': 'SUPERVISOR', // CRITICAL: Mapped to SUPERVISOR as per requirements
  'Technical Support': 'TECH_SUPPORT',
  'Parent': 'PARENT'
};

const REVERSE_ROLE_MAPPING: Record<string, string> = {
  'STUDENT': 'Student',
  'TEACHER': 'Teacher',
  'SUPER_ADMIN': 'Super Admin',
  'GUEST': 'Guest',
  'SUPERVISOR': 'Organizer',
  'TECH_SUPPORT': 'Technical Support',
  'PARENT': 'Parent'
};

export default function SuperAdminUsersPage() {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [roleModalUser, setRoleModalUser] = useState<any>(null);
  const [statsModalUser, setStatsModalUser] = useState<any>(null);
  
  // Role change state
  const [newRole, setNewRole] = useState('STUDENT');
  const [studentEmail, setStudentEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState('');

  // Enroll state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Fetch users
  const fetcher = (url: string) => api.get(url).then(res => res.data);
  const endpoint = selectedFilter === 'All' 
    ? '/super-admin/users/' 
    : `/super-admin/users/?role=${ROLE_MAPPING[selectedFilter]}`;
    
  const { data: users, error, mutate } = useSWR(endpoint, fetcher);
  
  // Fetch stats when modal opens
  const { data: studentStats, error: statsError, isValidating: statsLoading } = useSWR(
    statsModalUser ? `/super-admin/students/${statsModalUser.id}/stats/` : null,
    fetcher
  );

  // Fetch data for enroll modal
  const { data: allStudents } = useSWR(isEnrollModalOpen ? '/super-admin/users/?role=STUDENT' : null, fetcher);
  const { data: allCourses } = useSWR(isEnrollModalOpen ? '/courses/' : null, fetcher);

  const filteredUsers = users?.filter((user: any) => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleChangeError('');
    setRoleChangeLoading(true);
    
    try {
      const payload: any = {
        user_id: roleModalUser.id,
        new_role: newRole
      };
      
      if (newRole === 'PARENT') {
        payload.student_email = studentEmail;
        payload.new_password = newPassword;
      }
      
      await api.post('/super-admin/users/role-update/', payload);
      await mutate(); // Refresh table
      setRoleModalUser(null);
    } catch (err: any) {
      setRoleChangeError(err.response?.data?.error || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'SUPER_ADMIN': return <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">Super Admin</span>;
      case 'TEACHER': return <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">Teacher</span>;
      case 'STUDENT': return <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">Student</span>;
      case 'SUPERVISOR': return <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">Organizer</span>;
      case 'PARENT': return <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">Parent</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">{REVERSE_ROLE_MAPPING[role] || role}</span>;
    }
  };

  return (
    <div className="min-h-screen p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('users.title')}</h1>
            <p className="text-gray-400">{t('users.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsEnrollModalOpen(true);
                setSelectedStudentId('');
                setSelectedCourseId('');
                setEnrollError('');
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              {t('users.enrollStudent') || 'Enroll Student'}
            </button>
            <div className="relative">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('users.searchPlaceholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-4 pe-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
        </div>

        {/* Top Filter Slider */}
        <div className="flex overflow-x-auto pb-4 mb-6 scrollbar-hide gap-3">
          {FILTER_ROLES.map(role => (
            <button
              key={role}
              onClick={() => setSelectedFilter(role)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedFilter === role 
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Vercel-style Table UI */}
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm text-gray-300" dir="ltr">
              <thead className="bg-white/5 text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">{t('users.user')}</th>
                  <th className="px-6 py-4">{t('users.ageGroup')}</th>
                  <th className="px-6 py-4">{t('users.role')}</th>
                  <th className="px-6 py-4 text-end">{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {!users ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">{t('users.loading')}</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">{t('users.noUsers')}</td></tr>
                ) : (
                  filteredUsers.map((user: any) => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-white/5 transition-colors ${user.role === 'STUDENT' ? 'cursor-pointer' : ''}`}
                      onClick={() => user.role === 'STUDENT' ? setStatsModalUser(user) : null}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{user.full_name}</span>
                          <span className="text-gray-500 text-xs mt-1">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-300">{user.exact_age ? `${user.exact_age} years` : '-'}</span>
                          <span className="text-gray-500 text-xs mt-1">{user.age_group ? REVERSE_ROLE_MAPPING[user.age_group] || user.age_group : 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 text-end">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleModalUser(user);
                            setNewRole(user.role);
                            setStudentEmail('');
                            setNewPassword('');
                            setRoleChangeError('');
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white inline-flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          <span className="text-xs">{t('users.changeRole')}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="ltr">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setRoleModalUser(null)}
              className="absolute end-4 top-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-1">{t('users.updateRole')}</h3>
              <p className="text-sm text-gray-400 mb-6">{t('users.modifyAccess')} {roleModalUser.email}</p>
              
              <form onSubmit={handleRoleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('users.newRole')}</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="SUPERVISOR">Organizer</option>
                    <option value="PARENT">Parent</option>
                    <option value="TECH_SUPPORT">Technical Support</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="GUEST">Guest</option>
                  </select>
                </div>

                {newRole === 'PARENT' && (
                  <div className="space-y-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mt-4">
                    <p className="text-xs text-indigo-300 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> {t('users.strictParentVerification')}
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('users.studentEmail')}</label>
                      <input 
                        type="email" 
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('users.newParentPassword')}</label>
                      <input 
                        type="password" 
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {roleChangeError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {roleChangeError}
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRoleModalUser(null)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={roleChangeLoading}
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {roleChangeLoading ? t('users.saving') : t('users.saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Student Evaluation Modal */}
      {statsModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="ltr">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setStatsModalUser(null)}
              className="absolute end-4 top-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 border-b border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{statsModalUser.full_name}</h3>
                <p className="text-sm text-gray-400">{statsModalUser.email}</p>
              </div>
            </div>
            
            <div className="p-6">
              {statsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : statsError ? (
                <div className="text-red-400 text-center py-8">{t('users.failedToLoadStats')}</div>
              ) : (
                <div className="space-y-6">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">{t('users.attendance')}</p>
                      <p className="text-2xl font-bold text-white">{studentStats?.attendance_ratio}%</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">{t('users.avgExamScore')}</p>
                      <p className="text-2xl font-bold text-indigo-400">{studentStats?.exam_scores_avg}%</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">{t('users.overallProgress')}</p>
                      <p className="text-2xl font-bold text-emerald-400">{studentStats?.overall_progress}%</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">{t('users.projectsDone')}</p>
                      <p className="text-2xl font-bold text-purple-400">{studentStats?.submitted_projects_count}</p>
                    </div>
                  </div>

                  {/* Enrolled Courses */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      Enrolled Courses
                    </h4>
                    <div className="space-y-2">
                      {studentStats?.enrolled_courses?.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('users.noActiveEnrollments')}</p>
                      ) : (
                        studentStats?.enrolled_courses?.map((course: any) => (
                          <div key={course.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
                            <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${course.color || 'from-indigo-500 to-purple-500'}`}></div>
                            <span className="text-sm text-gray-300 font-medium">{course.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Enroll Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="ltr">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button onClick={() => setIsEnrollModalOpen(false)} className="absolute end-4 top-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-1">{t('users.enrollStudent') || 'Enroll Student'}</h3>
              <p className="text-sm text-gray-400 mb-6">{t('users.enrollStudentDesc') || 'Manually enroll a student into a course.'}</p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedStudentId || !selectedCourseId) return setEnrollError('Please select both student and course.');
                setEnrollLoading(true);
                setEnrollError('');
                try {
                  await api.post('/super-admin/enroll/', { user_id: selectedStudentId, course_id: selectedCourseId });
                  await mutate();
                  setIsEnrollModalOpen(false);
                } catch (err: any) {
                  setEnrollError(err.response?.data?.error || 'Failed to enroll student');
                } finally {
                  setEnrollLoading(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('users.selectStudent') || 'Select Student'}</label>
                  <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">{t('users.selectStudentPlaceholder') || '-- Choose a student --'}</option>
                    {allStudents?.map((s: any) => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('users.selectCourse') || 'Select Course'}</label>
                  <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">{t('users.selectCoursePlaceholder') || '-- Choose a course --'}</option>
                    {allCourses?.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                {enrollError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{enrollError}</div>}
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">{t('users.cancel') || 'Cancel'}</button>
                  <button type="submit" disabled={enrollLoading} className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {enrollLoading ? t('users.saving') : t('users.enrollStudent') || 'Enroll'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
