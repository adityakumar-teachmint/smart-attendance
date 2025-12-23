
import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, User, Camera as CameraIcon, Upload } from 'lucide-react';
import { Student } from '../types';
import { Camera } from './Camera';

interface StudentRegistrationProps {
  students: Student[];
  onAdd: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
  onEdit: (student: Student) => void;
}

export const StudentRegistration: React.FC<StudentRegistrationProps> = ({ students, onAdd, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', photo: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePhotoCapture = (base64: string) => {
    setNewStudent(prev => ({ ...prev, photo: base64 }));
    setShowCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStudent(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.photo) return;
    
    if (editingId) {
      const original = students.find(s => s.id === editingId);
      if (original) {
        onEdit({ ...original, name: newStudent.name, photo: newStudent.photo });
      }
    } else {
      onAdd(newStudent);
    }
    
    setNewStudent({ name: '', photo: '' });
    setShowAddModal(false);
    setEditingId(null);
  };

  const handleEditClick = (s: Student) => {
    setNewStudent({ name: s.name, photo: s.photo });
    setEditingId(s.id);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold dark:text-white">Student Directory</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <button
            onClick={() => {
              setNewStudent({ name: '', photo: '' });
              setEditingId(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus size={20} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStudents.map(student => (
          <div key={student.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden group hover:shadow-md transition">
            <div className="h-48 overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
              {student.photo ? (
                <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User size={48} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                <button 
                  onClick={() => handleEditClick(student)}
                  className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => onDelete(student.id)}
                  className="p-2 bg-white text-red-600 rounded-full hover:bg-gray-100 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg dark:text-white truncate">{student.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Joined {new Date(student.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {filteredStudents.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <User className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400">No students found.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6">
              <h3 className="text-xl font-bold dark:text-white mb-6">
                {editingId ? 'Edit Student' : 'Add New Student'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student Photo</label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                      {newStudent.photo ? (
                        <img src={newStudent.photo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 transition"
                      >
                        <CameraIcon size={18} />
                        <span>Camera</span>
                      </button>
                      <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition">
                        <Upload size={18} />
                        <span>Upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition font-medium shadow-md"
                  >
                    {editingId ? 'Save Changes' : 'Register Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <Camera 
          onCapture={handlePhotoCapture} 
          onClose={() => setShowCamera(false)} 
          title="Take Student Photo"
        />
      )}
    </div>
  );
};
