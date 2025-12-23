
import React, { useState, useMemo } from 'react';
import { Calendar, Filter, FileDown, Search, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Student, AttendanceSession, AttendanceStatus } from '../types';

interface AttendanceHistoryProps {
  sessions: AttendanceSession[];
  students: Student[];
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ sessions, students }) => {
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const stats = useMemo(() => {
    let present = 0, absent = 0, late = 0, total = 0;
    sessions.forEach(s => {
      s.records.forEach(r => {
        total++;
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'late') late++;
      });
    });
    return { present, absent, late, total };
  }, [sessions]);

  const filteredSessions = sessions.filter(s => 
    (!filterDate || s.date === filterDate)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportCSV = () => {
    let csv = 'Date,Student Name,Status,Confidence,Timestamp\n';
    sessions.forEach(s => {
      s.records.forEach(r => {
        const student = students.find(st => st.id === r.studentId);
        csv += `${s.date},"${student?.name || 'Unknown'}",${r.status},${r.confidence}%,${new Date(r.timestamp).toLocaleString()}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  if (selectedSession) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <button 
          onClick={() => setSelectedSessionId(null)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition"
        >
          <ArrowLeft size={18} />
          <span>Back to Sessions</span>
        </button>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 space-y-4">
            <h2 className="text-2xl font-bold dark:text-white">Session Detail</h2>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
              <p className="text-sm text-gray-500 mb-1">Date</p>
              <p className="font-semibold dark:text-white mb-4">{new Date(selectedSession.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500 mb-2">Classroom Scan</p>
              <img src={selectedSession.classroomPhoto} className="w-full h-40 object-cover rounded-lg" alt="Scan" />
            </div>
          </div>

          <div className="flex-1 space-y-4">
             <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Student</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Match Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {selectedSession.records.map(r => {
                      const student = students.find(s => s.id === r.studentId);
                      return (
                        <tr key={r.id} className="dark:text-white">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img src={student?.photo} className="w-8 h-8 rounded-full object-cover" />
                            <span>{student?.name || 'Deleted Student'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              r.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                              r.status === 'late' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30'
                            }`}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{r.confidence}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Scans', value: sessions.length, color: 'blue' },
          { label: 'Present', value: stats.present, color: 'green' },
          { label: 'Late', value: stats.late, color: 'yellow' },
          { label: 'Absent', value: stats.absent, color: 'red' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold dark:text-white">Attendance Logs</h3>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 dark:text-white border dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition"
            >
              <FileDown size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Attendance</th>
                <th className="px-6 py-4 font-semibold">Scan Photo</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredSessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer" onClick={() => setSelectedSessionId(session.id)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium dark:text-white">{new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p className="text-xs text-gray-500">Scan ID: {session.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" title="Present"></span>
                      <span className="text-xs font-medium dark:text-white">
                        {session.records.filter(r => r.status === 'present').length} Present
                      </span>
                      <span className="text-xs text-gray-400 mx-1">/</span>
                      <span className="text-xs font-medium dark:text-white">
                        {session.records.length} Total
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <img src={session.classroomPhoto} className="w-12 h-8 rounded object-cover" alt="Scan preview" />
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition text-gray-400">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No attendance records found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
