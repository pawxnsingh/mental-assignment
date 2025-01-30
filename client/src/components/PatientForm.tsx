import React from 'react';
import type { Patient } from '../types';

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (patient: Omit<Patient, 'id'>) => void;
  onCancel: () => void;
}

export function PatientForm({ patient, onSubmit, onCancel }: PatientFormProps) {
  const [formData, setFormData] = React.useState({
    name: patient?.name || '',
    age: patient?.age || '',
    gender: patient?.gender || '',
    diagnosis: patient?.diagnosis || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      age: Number(formData.age),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">
          {patient ? 'Edit Patient' : 'Add New Patient'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              required
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {patient ? 'Update' : 'Add'} Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}