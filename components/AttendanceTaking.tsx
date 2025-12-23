
import React, { useState } from 'react';
import { Camera as CameraIcon, CheckCircle, XCircle, Clock, Loader2, Save, Scan } from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { Camera } from './Camera';
import { aiService } from '../services/geminiService';

interface AttendanceTakingProps {
  students: Student[];
  onSave: (records: AttendanceRecord[], photo: string) => void;
}

export const AttendanceTaking: React.FC<AttendanceTakingProps> = ({ students, onSave }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [results, setResults] = useState<{ student: Student; status: AttendanceStatus; confidence: number; note?: string }[]>([]);

  const handleClassroomCapture = async (base64: string) => {
    setCurrentPhoto(base64);
    setShowCamera(false);
    setIsAnalyzing(true);

    try {
      const aiResults = await aiService.analyzeClassroom(base64, students);
      
      const combined = students.map(student => {
        const match = aiResults.find(r => r.studentId === student.id);
        return {
          student,
          status: (match?.present ? 'present' : 'absent') as AttendanceStatus,
          confidence: match?.confidence || 0,
        };
      });

      setResults(combined);
    } catch (err) {
      alert("AI Analysis failed. Switching to manual review.");
      setResults(students.map(student => ({ student, status: 'absent', confidence: 0 })));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateStatus = (index: number, status: AttendanceStatus) => {
    const newResults = [...results];
    newResults[index].status = status;
    setResults(newResults);
  };

  const handleConfirm = () => {
    if (!currentPhoto) return;
    const records: AttendanceRecord[] = results.map(r => ({
      id: crypto.randomUUID(),
      studentId: r.student.id,
      status: r.status,
      date: new Date().toISOString().split('T')[0],
      confidence: r.confidence,
      timestamp: Date.now(),
      note: r.note
    }));
    onSave(records, currentPhoto);
    setResults([]);
    setCurrentPhoto(null);
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <h2 className="text-xl font-semibold dark:text-white">AI Analyzing Classroom...</h2>
        <p className="text-gray-500 dark:text-gray-400">Comparing faces with registered students</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!currentPhoto ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
          <Scan className="text-gray-300 dark:text-gray-600 mb-6" size={64} />
          <h2 className="text-xl font-bold dark:text-white mb-2 text-center px-4">Ready to take attendance?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-center">
            Scan the entire classroom with your camera. Gemini will identify each student automatically.
          </p>
          <button
            onClick={() => setShowCamera(true)}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition transform hover:scale-105 active:scale-95"
          >
            <CameraIcon size={24} />
            <span>Scan Classroom</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold dark:text-white">Review Results</h2>
            <div className="flex gap-2">
              <button
                onClick={() => { setCurrentPhoto(null); setResults([]); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                Reset
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md transition"
              >
                <Save size={20} />
                <span>Save Attendance</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((res, idx) => (
              <div key={res.student.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  <img src={res.student.photo} alt={res.student.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold dark:text-white truncate">{res.student.name}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      res.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      res.status === 'late' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {res.status.toUpperCase()}
                    </span>
                    {res.confidence > 0 && (
                      <span className="text-[10px] text-gray-400">Match: {res.confidence}%</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateStatus(idx, 'present')}
                    className={`p-2 rounded-lg transition ${res.status === 'present' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button
                    onClick={() => updateStatus(idx, 'late')}
                    className={`p-2 rounded-lg transition ${res.status === 'late' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Clock size={20} />
                  </button>
                  <button
                    onClick={() => updateStatus(idx, 'absent')}
                    className={`p-2 rounded-lg transition ${res.status === 'absent' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCamera && (
        <Camera 
          onCapture={handleClassroomCapture} 
          onClose={() => setShowCamera(false)} 
          title="Scan Entire Classroom"
        />
      )}
    </div>
  );
};
