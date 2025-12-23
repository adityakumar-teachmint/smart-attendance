
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Scan, 
  History, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Student, AttendanceSession, AttendanceRecord, View } from './types';
import { StudentRegistration } from './components/StudentRegistration';
import { AttendanceTaking } from './components/AttendanceTaking';
import { AttendanceHistory } from './components/AttendanceHistory';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('students');
    return saved ? JSON.parse(saved) : [];
  });

  const [sessions, setSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('attendance_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success' | 'error'}[]>([]);

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('attendance_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const addStudent = (data: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    setStudents(prev => [...prev, newStudent]);
    addToast(`${data.name} registered successfully!`);
  };

  const editStudent = (student: Student) => {
    setStudents(prev => prev.map(s => s.id === student.id ? student : s));
    addToast(`${student.name} updated!`);
  };

  const deleteStudent = (id: string) => {
    if (confirm('Are you sure you want to delete this student? Records will remain but student profile will be gone.')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      addToast('Student deleted');
    }
  };

  const saveAttendance = (records: AttendanceRecord[], photo: string) => {
    const newSession: AttendanceSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      records,
      classroomPhoto: photo
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveView('history');
    addToast('Attendance saved successfully!', 'success');
  };

  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const latestTodaySession = sessions.find(s => s.date === today);
    if (!latestTodaySession) return null;

    const present = latestTodaySession.records.filter(r => r.status === 'present').length;
    const late = latestTodaySession.records.filter(r => r.status === 'late').length;
    const absent = latestTodaySession.records.filter(r => r.status === 'absent').length;
    const total = latestTodaySession.records.length;

    return {
      present,
      late,
      absent,
      total,
      presentPercent: Math.round((present / total) * 100),
      latePercent: Math.round((late / total) * 100),
      absentPercent: Math.round((absent / total) * 100)
    };
  }, [sessions]);

  const AttendancePieChart = ({ data }: { data: any }) => {
    const p = data.presentPercent;
    const l = data.latePercent;
    const a = data.absentPercent;

    const gradient = `conic-gradient(
      #10b981 0% ${p}%, 
      #f59e0b ${p}% ${p + l}%, 
      #ef4444 ${p + l}% 100%
    )`;

    return (
      <div className="relative w-40 h-40 rounded-full shadow-inner" style={{ background: gradient }}>
        <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold dark:text-white">{p}%</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Present</span>
        </div>
      </div>
    );
  };

  const DashboardHome = () => (
    <div className="space-y-10 animate-fadeIn">
      {/* Primary Row: Stats and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Stats Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">Total Enrollment</p>
              <h3 className="text-5xl font-black">{students.length}</h3>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center text-xs text-blue-200">
                <Users size={14} className="mr-1" />
                <span>Active students</span>
              </div>
              <button onClick={() => setActiveView('students')} className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition">Manage</button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 flex flex-col justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Present Today</p>
              <h3 className={`text-5xl font-black ${todayData ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`}>
                {todayData ? todayData.present : '--'}
              </h3>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-400">
                <TrendingUp size={14} className="mr-1" />
                <span>Real-time tracking</span>
              </div>
              <p className="text-xs font-semibold text-gray-500">{todayData ? `${todayData.presentPercent}% attendance` : 'No scan yet'}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700">
             <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Absent Today</p>
             <h3 className={`text-5xl font-black ${todayData ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}`}>
                {todayData ? todayData.absent : '--'}
             </h3>
             <p className="mt-4 text-xs text-gray-400">Requires follow-up</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700">
             <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Late Today</p>
             <h3 className={`text-5xl font-black ${todayData ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}>
                {todayData ? todayData.late : '--'}
             </h3>
             <p className="mt-4 text-xs text-gray-400">Marked as tardy</p>
          </div>
        </div>

        {/* Right: Pie Chart Summary */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-lg font-bold dark:text-white mb-6 w-full text-left">Today's Overview</h3>
          {todayData ? (
            <div className="flex flex-col items-center gap-6">
              <AttendancePieChart data={todayData} />
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Present</p>
                  <p className="text-sm font-bold dark:text-white">{todayData.present}</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Late</p>
                  <p className="text-sm font-bold dark:text-white">{todayData.late}</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Absent</p>
                  <p className="text-sm font-bold dark:text-white">{todayData.absent}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-32 h-32 border-8 border-gray-100 dark:border-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-300 dark:text-gray-600">
                <Scan size={40} />
              </div>
              <p className="text-sm text-gray-500 font-medium">No session data available for today.</p>
              <button onClick={() => setActiveView('attendance')} className="mt-4 text-blue-600 text-sm font-bold flex items-center justify-center gap-1 mx-auto">
                Take attendance now <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Row: Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold dark:text-white">Recent Attendance Logs</h3>
            <button onClick={() => setActiveView('history')} className="text-blue-600 text-sm font-semibold hover:underline">See full history</button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm overflow-hidden">
            {sessions.length > 0 ? (
              sessions.slice(0, 5).map((session, idx) => (
                <div key={session.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${idx !== sessions.slice(0, 5).length - 1 ? 'border-b dark:border-gray-700' : ''}`} onClick={() => setActiveView('history')}>
                  <div className="flex items-center gap-4">
                    <img src={session.classroomPhoto} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                    <div>
                      <p className="font-bold dark:text-white">{new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <p className="text-xs text-gray-500 font-medium">{session.records.length} students enrolled</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-black">
                       <CheckCircle2 size={12} /> {session.records.filter(r => r.status === 'present').length}
                     </div>
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-black">
                       <XCircle size={12} /> {session.records.filter(r => r.status === 'absent').length}
                     </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center">
                <History className="mx-auto text-gray-200 dark:text-gray-700 mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Your activity will appear here once you take attendance.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-xl font-bold dark:text-white">New Operations</h3>
          <div className="space-y-4">
            <button 
              onClick={() => setActiveView('attendance')}
              className="w-full flex items-center justify-between p-6 bg-blue-600 rounded-3xl text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition group overflow-hidden relative"
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition">
                  <Scan size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-lg">Scan Classroom</p>
                  <p className="text-xs text-blue-100">AI-powered face analysis</p>
                </div>
              </div>
              <ChevronRight className="relative z-10 opacity-50 group-hover:opacity-100 transition translate-x-0 group-hover:translate-x-1" />
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </button>
            <button 
              onClick={() => setActiveView('students')}
              className="w-full flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 hover:shadow-md transition group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-2xl text-purple-600 group-hover:scale-110 transition">
                  <Users size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-lg dark:text-white">Class Directory</p>
                  <p className="text-xs text-gray-500">Edit profiles & photos</p>
                </div>
              </div>
              <ChevronRight className="opacity-50 group-hover:opacity-100 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'students', icon: Users, label: 'Students' },
    { id: 'attendance', icon: Scan, label: 'Scan' },
    { id: 'history', icon: History, label: 'Records' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-200 font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 lg:w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 z-40 transition-all duration-300">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/50">
                <Scan size={24} />
              </div>
              <h1 className="hidden lg:block font-black text-2xl dark:text-white tracking-tighter">Smart<span className="text-blue-600">Attend</span></h1>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group ${
                  activeView === item.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon size={22} className={activeView === item.id ? 'scale-110' : 'group-hover:scale-110 transition'} />
                <span className="hidden lg:block font-bold">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t dark:border-gray-800 space-y-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
              <span className="hidden lg:block font-bold">{isDarkMode ? 'Light UI' : 'Dark UI'}</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition group">
              <LogOut size={22} className="group-hover:translate-x-1 transition" />
              <span className="hidden lg:block font-bold">Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-10 overflow-x-hidden">
        <header className="flex items-center justify-between mb-10 max-w-7xl mx-auto">
          <div>
            <h2 className="text-3xl font-black dark:text-white tracking-tight">
              {activeView === 'dashboard' ? "Class Overview" : navItems.find(n => n.id === activeView)?.label}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {activeView === 'dashboard' ? "Analyze classroom activity at a glance." : "Seamless classroom presence management."}
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 pr-4 rounded-3xl shadow-sm border dark:border-gray-700">
             <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg">
               AT
             </div>
             <div className="hidden md:flex flex-col">
                <span className="text-sm font-black dark:text-white leading-tight">Admin Teacher</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Modern Academy</span>
             </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeView === 'dashboard' && <DashboardHome />}

          {activeView === 'students' && (
            <StudentRegistration 
              students={students} 
              onAdd={addStudent} 
              onDelete={deleteStudent}
              onEdit={editStudent}
            />
          )}

          {activeView === 'attendance' && (
            <AttendanceTaking 
              students={students} 
              onSave={saveAttendance}
            />
          )}

          {activeView === 'history' && (
            <AttendanceHistory 
              sessions={sessions}
              students={students}
            />
          )}
        </div>
      </main>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-slideIn ${
              toast.type === 'success' 
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} className="text-green-400" /> : <XCircle size={20} />}
            <span className="font-black text-sm">{toast.message}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* Custom scrollbar for clean UI */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #374151;
        }
      `}</style>
    </div>
  );
};

export default App;
