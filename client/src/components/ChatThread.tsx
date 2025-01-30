import React from "react";
import { Send, Search, HeartPulse, ChevronUp, User2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage, Patient } from "../types";

interface ChatThreadProps {
  messages: ChatMessage[];
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onSendMessage: (content: string, type: ChatMessage["type"]) => void;
  selectedPatientId?: string;
  messageType: "search" | "counseling";
  setMessageType: (str: "search" | "counseling") => any;
}

export function ChatThread({
  messages,
  patients,
  selectedPatient,
  onSelectPatient,
  messageType,
  setMessageType,
  onSendMessage,
  selectedPatientId,
}: ChatThreadProps) {
  const [input, setInput] = React.useState("");
  const [showPatientSelector, setShowPatientSelector] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const patientSelectorRef = React.useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close patient selector when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        patientSelectorRef.current &&
        !patientSelectorRef.current.contains(event.target as Node)
      ) {
        setShowPatientSelector(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input, messageType);
      setInput("");
    }
  };

  const MessageTypeButton = ({
    type,
    icon: Icon,
    label,
  }: {
    type: ChatMessage["type"];
    icon: React.ElementType;
    label: string;
  }) => (
    <button
      onClick={() => setMessageType(type)}
      className={`flex items-center px-3 py-1 rounded-full text-sm ${
        messageType === type
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon size={16} className="mr-1" />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Patient Selector Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="relative" ref={patientSelectorRef}>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPatientSelector(!showPatientSelector)}
              className="flex-1 flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <User2 size={20} className="text-gray-500" />
                <span className="font-medium">
                  {selectedPatient ? selectedPatient.name : "Select a patient"}
                </span>
              </div>
              <ChevronUp
                size={20}
                className={`text-gray-500 transition-transform ${
                  showPatientSelector ? "" : "transform rotate-180"
                }`}
              />
            </button>
          </div>

          {showPatientSelector && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => {
                    onSelectPatient(patient);
                    setShowPatientSelector(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                    selectedPatientId === patient.id ? "bg-blue-50" : ""
                  }`}
                >
                  <User2 size={16} className="text-gray-500" />
                  <div>
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-gray-500">
                      Age: {patient.age}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] prose rounded-lg p-4 ${
                message.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 shadow-md"
              }`}
            >
              <ReactMarkdown>{message?.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-2 mb-4">
          <MessageTypeButton
            type="search"
            icon={Search}
            label="Search Database"
          />
          <MessageTypeButton
            type="counseling"
            icon={HeartPulse}
            label="Get Advice"
          />
        </div>
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              !selectedPatientId
                ? "Select a patient to start..."
                : messageType === "search"
                ? "Search the database..."
                : "Type your message..."
            }
            disabled={!selectedPatientId && messageType == "counseling"}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleSend}
            disabled={
              messageType == "counseling" &&
              (!selectedPatientId || !input.trim())
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
