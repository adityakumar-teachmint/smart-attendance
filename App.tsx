
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Scan, 
  History, 
  LayoutDashboard, 
  LogOut, 
  Sun, 
  Moon,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ChevronRight,
  Calendar,
  X,
  Search
} from 'lucide-react';
import { Student, AttendanceSession, AttendanceRecord, View, AttendanceStatus } from './types';
import { StudentRegistration } from './components/StudentRegistration';
import { AttendanceTaking } from './components/AttendanceTaking';
import { AttendanceHistory } from './components/AttendanceHistory';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('attendance');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
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
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; title: string; list: {student: Student, status: AttendanceStatus}[] }>({
    isOpen: false,
    title: '',
    list: []
  });

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('attendance_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const addStudent = (newStudentData: Omit<Student, 'id' | 'createdAt'>) => {
    const student: Student = {
      ...newStudentData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setStudents(prev => [...prev, student]);
    addToast('Student registered!', 'success');
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    addToast('Student removed', 'success');
  };

  const editStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    addToast('Student updated!', 'success');
  };

  const saveAttendance = (records: AttendanceRecord[], photo: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newSession: AttendanceSession = {
      id: crypto.randomUUID(),
      date: today,
      records,
      classroomPhoto: photo
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveView('dashboard');
    addToast('Attendance saved!', 'success');
  };

  // Manual update logic for Summary Report
  const updateManualStatus = (studentId: string, date: string, newStatus: AttendanceStatus) => {
    setSessions(prev => {
      const daySessions = prev.filter(s => s.date === date);
      
      if (daySessions.length > 0) {
        // Update the first session of that day
        return prev.map(session => {
          if (session.id === daySessions[0].id) {
            const recordExists = session.records.some(r => r.studentId === studentId);
            const updatedRecords = recordExists 
              ? session.records.map(r => r.studentId === studentId ? { ...r, status: newStatus, timestamp: Date.now() } : r)
              : [...session.records, { 
                  id: crypto.randomUUID(), 
                  studentId, 
                  status: newStatus, 
                  date, 
                  confidence: 100, 
                  timestamp: Date.now() 
                }];
            return { ...session, records: updatedRecords };
          }
          return session;
        });
      } else {
        // Create a new session for this date
        const newSession: AttendanceSession = {
          id: crypto.randomUUID(),
          date,
          classroomPhoto: '', // Manual entries don't have photos
          records: [{
            id: crypto.randomUUID(),
            studentId,
            status: newStatus,
            date,
            confidence: 100,
            timestamp: Date.now()
          }]
        };
        return [newSession, ...prev];
      }
    });
    addToast('Status updated manually', 'success');
  };

  const consolidatedData = useMemo(() => {
    const periodSessions = sessions.filter(s => s.date === selectedDate);
    const studentDailyBest = new Map<string, Map<string, AttendanceStatus>>();

    periodSessions.forEach(session => {
      if (!studentDailyBest.has(session.date)) {
        studentDailyBest.set(session.date, new Map());
      }
      const dayMap = studentDailyBest.get(session.date)!;
      session.records.forEach(r => {
        const current = dayMap.get(r.studentId);
        if (r.status === 'present' || (r.status === 'late' && current !== 'present')) {
          dayMap.set(r.studentId, r.status);
        } else if (!current) {
          dayMap.set(r.studentId, r.status);
        }
      });
    });

    const finalStudentStatus = new Map<string, AttendanceStatus>();
    let presentCount = 0, lateCount = 0, absentCount = 0, totalCount = 0;

    students.forEach(student => {
      const status = studentDailyBest.get(selectedDate)?.get(student.id) || 'absent';
      if (status === 'present') presentCount++;
      else if (status === 'late') lateCount++;
      else absentCount++;
      totalCount++;
      finalStudentStatus.set(student.id, status);
    });

    return {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      total: totalCount,
      studentMap: finalStudentStatus,
      presentPercent: Math.round((presentCount / (totalCount || 1)) * 100) || 0,
      latePercent: Math.round((lateCount / (totalCount || 1)) * 100) || 0,
      absentPercent: Math.round((absentCount / (totalCount || 1)) * 100) || 0
    };
  }, [sessions, selectedDate, students]);

  const openStatusList = (type: AttendanceStatus) => {
    const list = students.map(s => ({
      student: s,
      status: consolidatedData.studentMap.get(s.id) || 'absent'
    })).filter(item => item.status === type);
    
    setStatusModal({
      isOpen: true,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Students (${list.length})`,
      list
    });
  };

  const AttendancePieChart = ({ data }: { data: any }) => {
    const p = data.presentPercent;
    const l = data.latePercent;
    const gradient = `conic-gradient(#10b981 0% ${p}%, #f59e0b ${p}% ${p + l}%, #ef4444 ${p + l}% 100%)`;
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
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-gray-500 uppercase tracking-widest">Select Date:</span>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-xl border dark:border-gray-700">
            <Calendar className="text-blue-600" size={18} />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="bg-transparent dark:text-white font-black text-sm outline-none cursor-pointer" 
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-bold uppercase">Showing stats for</p>
          <p className="font-black dark:text-white">{new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between">
            <div><p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">Total Students</p><h3 className="text-5xl font-black">{students.length}</h3></div>
          </div>
          <div onClick={() => openStatusList('present')} className="cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 hover:border-green-500 transition-all flex flex-col justify-between group">
            <div><p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Present Today</p><h3 className="text-5xl font-black text-green-500">{consolidatedData.present}</h3></div>
          </div>
          <div onClick={() => openStatusList('absent')} className="cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 hover:border-red-500 transition-all group">
             <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Absent Today</p>
             <h3 className="text-5xl font-black text-red-500">{consolidatedData.absent}</h3>
          </div>
          <div onClick={() => openStatusList('late')} className="cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 hover:border-yellow-500 transition-all group">
             <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Late Today</p>
             <h3 className="text-5xl font-black text-yellow-500">{consolidatedData.late}</h3>
          </div>
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold dark:text-white mb-6 w-full text-left">Daily Breakdown</h3>
          <AttendancePieChart data={consolidatedData} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-200 font-sans">
      <aside className="fixed left-0 top-0 bottom-0 w-24 lg:w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 z-40">
        <div className="flex flex-col h-full px-2 py-6">
          <div className="flex items-center justify-center lg:justify-start lg:px-6 gap-3 mb-10">
            <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg"><Scan size={28} /></div>
            <h1 className="hidden lg:block font-black text-xl dark:text-white">Smart <span className="text-blue-600">Attendance</span></h1>
          </div>
          <nav className="flex-1 space-y-3 lg:px-4">
            {[
              { id: 'attendance', icon: Scan, label: 'Scan' },
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'students', icon: Users, label: 'Students' },
              { id: 'history', icon: History, label: 'Summary Report' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveView(item.id as View)} className={`w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl transition-all duration-200 ${activeView === item.id ? 'bg-blue-600 text-white shadow-xl' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <item.icon size={26} /><span className="hidden lg:block font-bold">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-3 pt-6 border-t dark:border-gray-800 lg:px-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              {isDarkMode ? <Sun size={26} /> : <Moon size={26} />}<span className="hidden lg:block font-bold">{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
            <button className="w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition"><LogOut size={26} /><span className="hidden lg:block font-bold">Log Out</span></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-24 lg:ml-64 p-4 lg:p-10">
        <header className="flex items-center justify-between mb-10 max-w-7xl mx-auto">
          <h2 className="text-3xl font-black dark:text-white tracking-tight">
            {activeView === 'history' ? 'Summary Report' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
          </h2>
        </header>
        <div className="max-w-7xl mx-auto">
          {activeView === 'attendance' && <AttendanceTaking students={students} onSave={saveAttendance} />}
          {activeView === 'dashboard' && <DashboardHome />}
          {activeView === 'students' && <StudentRegistration students={students} onAdd={addStudent} onDelete={deleteStudent} onEdit={editStudent} />}
          {activeView === 'history' && <AttendanceHistory sessions={sessions} students={students} onUpdateStatus={updateManualStatus} />}
        </div>
      </main>

      {statusModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden animate-slideUp shadow-2xl">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">{statusModal.title}</h3>
              <button onClick={() => setStatusModal({ ...statusModal, isOpen: false })} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><X size={24} className="dark:text-white"/></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {statusModal.list.length > 0 ? (
                <div className="space-y-4">
                  {statusModal.list.map(({student, status}) => (
                    <div key={student.id} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl shadow-sm">
                      <img src={student.photo} className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-700" />
                      <div className="flex-1"><p className="font-bold text-lg dark:text-white">{student.name}</p><p className="text-xs text-gray-500 uppercase font-black">{status}</p></div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-gray-500 py-10">No students found.</p>}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-slideIn ${toast.type === 'success' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-red-600 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={24} className="text-green-400" /> : <XCircle size={24} />}
            <span className="font-black text-sm">{toast.message}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
