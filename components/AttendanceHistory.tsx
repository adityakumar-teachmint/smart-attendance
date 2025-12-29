
import React, { useState, useMemo } from 'react';
import { Search, FileDown, Check, X, Clock, Calendar as CalendarIcon, MousePointer2 } from 'lucide-react';
import { Student, AttendanceSession, AttendanceStatus } from '../types';

interface AttendanceHistoryProps {
  sessions: AttendanceSession[];
  students: Student[];
  onUpdateStatus?: (studentId: string, date: string, newStatus: AttendanceStatus) => void;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ sessions, students, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Generate all days for the selected month
  const monthDays = useMemo(() => {
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const lastDay = new Date(year, month, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= lastDay; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      days.push(`${selectedMonth}-${dayStr}`);
    }
    return days;
  }, [selectedMonth]);

  // Consolidate status: For a given student and date, get the best status across all sessions that day
  const getStatus = (studentId: string, date: string): AttendanceStatus | null => {
    const daySessions = sessions.filter(s => s.date === date);
    if (daySessions.length === 0) return null;

    let best: AttendanceStatus | null = null;
    daySessions.forEach(session => {
      const record = session.records.find(r => r.studentId === studentId);
      if (record) {
        if (record.status === 'present') best = 'present';
        else if (record.status === 'late' && best !== 'present') best = 'late';
        else if (best === null) best = 'absent';
      }
    });
    return best;
  };

  const studentStats = useMemo(() => {
    return students.map(student => {
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      
      monthDays.forEach(date => {
        const s = getStatus(student.id, date);
        if (s === 'present') presentCount++;
        else if (s === 'late') lateCount++;
        else if (s === 'absent') absentCount++;
      });

      return { 
        student, 
        present: presentCount, 
        late: lateCount, 
        absent: absentCount,
        totalAttended: presentCount + lateCount
      };
    }).filter(s => s.student.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, monthDays, sessions, searchTerm]);

  const toggleStatus = (studentId: string, date: string, currentStatus: AttendanceStatus | null) => {
    if (!onUpdateStatus) return;
    
    let nextStatus: AttendanceStatus;
    if (currentStatus === 'present') nextStatus = 'absent';
    else if (currentStatus === 'absent') nextStatus = 'late';
    else if (currentStatus === 'late') nextStatus = 'present';
    else nextStatus = 'present'; // Default for empty

    onUpdateStatus(studentId, date, nextStatus);
  };

  const StatusCell = ({ studentId, date }: { studentId: string, date: string }) => {
    const status = getStatus(studentId, date);
    
    return (
      <td 
        className="p-2 text-center border-l dark:border-gray-700/50 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group relative"
        onClick={() => toggleStatus(studentId, date, status)}
        title="Click to change status"
      >
        <div className="flex items-center justify-center h-8 w-full">
          {!status ? (
            <div className="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full group-hover:bg-blue-400"></div>
          ) : status === 'present' ? (
            <Check size={16} className="text-green-500" />
          ) : status === 'late' ? (
            <Clock size={16} className="text-yellow-500" />
          ) : (
            <X size={16} className="text-red-500" />
          )}
        </div>
      </td>
    );
  };

  const exportCSV = () => {
    let csv = `Summary Report - ${selectedMonth}\n`;
    csv += 'Student Name,Present Days,Late Days,Absent Days,Total Attended\n';
    studentStats.forEach(s => {
      csv += `"${s.student.name}",${s.present},${s.late},${s.absent},${s.totalAttended}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-report-${selectedMonth}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Select Month</span>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-12 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white border dark:border-gray-700 font-black text-sm outline-none cursor-pointer"
              />
            </div>
          </div>
          
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Search Students</span>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Filter by name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white border dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto mt-4 xl:mt-0">
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs font-bold text-gray-500">
             <div className="flex items-center gap-1"><MousePointer2 size={12}/> Click cells to manually edit</div>
          </div>
          <button onClick={exportCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-black transition shadow-lg">
            <FileDown size={18} />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-900 p-4 text-left font-black text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 min-w-[200px]">Student Details</th>
                <th className="p-4 text-center font-black text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">Attended</th>
                {monthDays.map(date => (
                  <th key={date} className="p-2 text-center font-black text-[10px] uppercase tracking-wider text-gray-400 border-b dark:border-gray-700 min-w-[40px]">
                    <div className="flex flex-col items-center">
                      <span className="opacity-40">{new Date(date).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                      <span className="text-gray-600 dark:text-gray-300">{date.slice(8, 10)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {studentStats.map(({ student, present, late, totalAttended }) => (
                <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10 transition">
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 p-4 border-r dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <img src={student.photo} className="w-10 h-10 rounded-xl object-cover shadow-sm border dark:border-gray-700" />
                      <div className="flex flex-col">
                        <span className="font-black text-sm dark:text-white whitespace-nowrap">{student.name}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">ID: {student.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center bg-gray-50/20 dark:bg-gray-900/10 border-r dark:border-gray-700">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-black text-blue-600">{totalAttended}</div>
                      <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Days</div>
                    </div>
                  </td>
                  {monthDays.map(date => (
                    <StatusCell key={`${student.id}-${date}`} studentId={student.id} date={date} />
                  ))}
                </tr>
              ))}
              {studentStats.length === 0 && (
                <tr>
                  <td colSpan={monthDays.length + 2} className="p-24 text-center text-gray-400 font-bold">
                    No results for "{searchTerm}" in {selectedMonth}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400 px-6 mt-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/10 rounded-full border border-green-100 dark:border-green-900/20">
          <Check size={12} className="text-green-500" /> Present
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/10 rounded-full border border-yellow-100 dark:border-yellow-900/20">
          <Clock size={12} className="text-yellow-500" /> Late
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-900/10 rounded-full border border-red-100 dark:border-red-900/20">
          <X size={12} className="text-red-500" /> Absent
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-900 rounded-full border dark:border-gray-800">
          <div className="w-1.5 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div> Unmarked
        </div>
        <div className="ml-auto text-blue-500 italic">Total students: {studentStats.length}</div>
      </div>
    </div>
  );
};
