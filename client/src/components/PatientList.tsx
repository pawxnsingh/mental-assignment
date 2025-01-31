import { Plus, Edit2, Trash2, MessageSquare } from "lucide-react";
import type { Patient, ChatMessage, Threads } from "../types";

interface PatientListProps {
  patients: Patient[];
  messages: ChatMessage[];

  selectedThread: string;
  setSelectedThread: (thread_id: string) => any;
  threads: Threads[];
  setThreads: (thread: any) => any;
  handleSelectedThread: (thread_id: string) => any;

  onAddPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onCreateThread: () => void;
}

export function PatientList({
  patients,
  threads,
  selectedThread,
  setSelectedThread,
  handleSelectedThread,

  onAddPatient,
  onEditPatient,
  onDeletePatient,
  onCreateThread,
}: PatientListProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Active Threads
            </h2>
            <button
              onClick={onCreateThread}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-3">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`p-3 bg-gray-50 rounded-lg  ${
                  thread.id === selectedThread
                    ? "bg-gray-200"
                    : "hover:bg-gray-100"
                } cursor-pointer`}
                onClick={() => {
                  // thread_id is selected, now i have to
                  setSelectedThread(thread.id);
                  handleSelectedThread(thread.id);
                }}
              >
                <div className={`flex items-center gap-3`}>
                  <MessageSquare size={16} className="text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-600 truncate">
                      {thread.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
            {threads.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No active threads
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Patients Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Patients</h2>
            <button
              onClick={onAddPatient}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-500">Age: {patient.age}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditPatient(patient);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePatient(patient.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
