import React from "react";
import { PatientList } from "./components/PatientList";
import { ChatThread } from "./components/ChatThread";
import { PatientForm } from "./components/PatientForm";
import { api } from "./services/api";
import type { Patient, ChatMessage, Threads } from "./types";

function App() {
  // contain all the patients
  const [patients, setPatients] = React.useState<Patient[]>([]);
  // select patient id will store the selected patient
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(
    null
  );
  // all message in the thread
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);

  const [messageType, setMessageType] =
    React.useState<ChatMessage["type"]>("counseling");

  // this will have the thread which thread is opened so that i can open all the chat message related to the
  // that particular thread
  const [selectedThread, setSelectedThread] = React.useState<string>("");
  // this is the all the thread list containing all the thread
  const [threads, setThreads] = React.useState<Threads[]>([]);

  const [showPatientForm, setShowPatientForm] = React.useState(false);
  // editing the patients
  const [editingPatient, setEditingPatient] = React.useState<
    Patient | undefined
  >();
  // this is the for the loading
  const [loading, setLoading] = React.useState(true);

  const [isStreaming, setIsStreaming] = React.useState(false);

  const [isUserScrolling, setIsUserScrolling] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // Fetch initial patients
  React.useEffect(() => {
    loadPatients();
    loadThreads();
    setMessageType("counseling");
  }, []);

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (!isUserScrolling && !isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Detect user scrolling manually
  React.useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const isAtBottom =
        chatContainer.scrollHeight - chatContainer.scrollTop <=
        chatContainer.clientHeight + 50;

      setIsUserScrolling(!isAtBottom);
    };

    chatContainer.addEventListener("scroll", handleScroll);
    return () => chatContainer.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    if (!isUserScrolling && !isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming]);

  const loadThreads = async () => {
    try {
      const data = await api.getAllThreads();
      console.log({ data });
      setThreads(data);
      setSelectedThread(data[0].id);
      handleSelectedThread(data[0].id);
    } catch (error) {
      console.error("Failed to load thread:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = () => {
    setEditingPatient(undefined);
    setShowPatientForm(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowPatientForm(true);
  };

  const handlePatientSubmit = async (patientData: Omit<Patient, "id">) => {
    try {
      if (editingPatient) {
        const updated = await api.updatePatient(editingPatient.id, patientData);
        setPatients(
          patients.map((p) => (p.id === editingPatient.id ? updated : p))
        );
      } else {
        // create a new user
        const newPatient = await api.addPatient(patientData);
        setPatients([...patients, newPatient]);
      }
      setShowPatientForm(false);
    } catch (error) {
      console.error("Failed to save patient:", error);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      await api.deletePatient(patientId);
      setPatients(patients.filter((p) => p.id !== patientId));
      if (selectedPatient?.id === patientId) {
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error("Failed to delete patient:", error);
    }
  };

  function convertToMarkdown(
    data: { context: string; response: string }[]
  ): string {
    return data
      .map(
        (entry, index) => `
  ### ${index + 1}. **User's Concern**
  > ${entry.context}
  
  ### 💡 **Suggested Response**
  ${entry.response.replace(/\n/g, "\n\n")}
  `
      )
      .join("\n---\n");
  }

  const handleSendMessage = async (
    content: string,
    type: ChatMessage["type"]
  ) => {
    console.log({ selectedPatient, content, selectedThread });

    const messageData: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      sender: "user",
      type,
      patientId: selectedPatient ? selectedPatient.id : undefined,
    };

    let thinkingMessageId: string;

    try {
      setMessages((prev) => [...prev, messageData]);

      if (!selectedPatient && messageType === "counseling") {
        const newMessage: ChatMessage = {
          id: `response-${new Date().getTime()}`,
          content: "Patient is not selected, kindly select the patient..",
          sender: "assistant",
          type: "counseling",
          patientId: "selectedPatient.id",
        };

        setMessages((prev) => [...prev, newMessage]);
        return;
      }

      let responseMessage;

      thinkingMessageId = `thinking-${new Date().getTime()}`;
      const thinkingMessage: ChatMessage = {
        id: thinkingMessageId,
        content: "Thinking...",
        sender: "assistant",
        type: "counseling",
        patientId: selectedPatient ? selectedPatient.id : "",
      };

      setMessages((prev) => [...prev, thinkingMessage]);

      if (messageType === "counseling") {
        responseMessage = await api.addMessage(
          content,
          selectedPatient ? selectedPatient.id : "",
          selectedThread
        );
      } else {
        responseMessage = await api.searchDatabase(content);
        console.log(responseMessage);

        const markdownOutput = convertToMarkdown(responseMessage.data);
        responseMessage = markdownOutput;

        // Store search in database
        await api.storeSearches(selectedThread, responseMessage, content);

        console.log({ markdownOutput });
      }

      console.log(responseMessage.response);

      setMessages((prev) => prev.filter((msg) => msg.id !== thinkingMessageId));

      const messageId = `response-${new Date().getTime()}`;
      const newMessage: ChatMessage = {
        id: messageId,
        content: "",
        sender: "assistant",
        type: "counseling",
        patientId: selectedPatient ? selectedPatient.id : "",
      };

      setMessages((prev) => [...prev, newMessage]);

      simulateStreaming(responseMessage.response ?? responseMessage, messageId);
    } catch (error) {
      console.error("Failed to send message:", error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingMessageId
            ? {
                ...msg,
                content: "⚠️ Failed to get a response. Please try again.",
              }
            : msg
        )
      );
    } 
  };

  const simulateStreaming = (fullText: string, messageId: string) => {
    setIsStreaming(true);
    let currentIndex = 0;
    const interval = 20; 
    const chunkSize = 20;

    const intervalId = setInterval(() => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: fullText.slice(0, currentIndex + chunkSize) }
            : msg
        )
      );

      currentIndex += chunkSize;

      if (currentIndex >= fullText.length) {
        clearInterval(intervalId);
        setIsStreaming(false);
        scrollToBottom();
      }
    }, interval);

    setTimeout(() => {
      if (currentIndex === 0) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: "⚠️ No response received. Try again." }
              : msg
          )
        );
        clearInterval(intervalId);
        setIsStreaming(false);
      }
    }, 5000);
  };

  const handleCreateThread = async () => {
    // make the http call to the backend
    const createThread = await api.createThread();
    setThreads([...threads, createThread]);
    setSelectedThread(createThread.id)
    setMessages([]);
  };

  const handleSelectedThread = async (thread_id: string) => {
    // here we  neeed to fetch all the message in the thread
    // and set the setMessages
    console.log(thread_id);
    // here we have to call the backend route to get all the exsiting routes
    const getThreadMessages = await api.getThreadMessages(thread_id);

    console.log(getThreadMessages);

    const newMessage = getThreadMessages.flatMap((msg: any) => [
      {
        id: msg.id,
        content: msg.message,
        sender: "user",
        type: "counseling",
        patientId: msg.patient_id,
      },
      {
        id: `${msg.id}-response`,
        content: msg.response,
        sender: "assistant",
        type: "counseling",
        patientId: msg.patient_id,
      },
    ]);

    console.log({ newMessage });
    setMessages([]);
    setMessages(newMessage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <PatientList
        patients={patients}
        messages={messages}
        selectedThread={selectedThread}
        setSelectedThread={setSelectedThread}
        threads={threads}
        setThreads={setThreads}
        handleSelectedThread={handleSelectedThread}
        onAddPatient={handleAddPatient}
        onEditPatient={handleEditPatient}
        onDeletePatient={handleDeletePatient}
        onCreateThread={handleCreateThread}
      />
      {/* this includes the chat compose, and chat messages chain  */}
      <div className="flex-1">
        <ChatThread
          messages={messages}
          patients={patients}
          handleCreateThread={handleCreateThread}
          messageType={messageType}
          setMessageType={setMessageType}
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatient}
          onSendMessage={handleSendMessage}
          selectedPatientId={selectedPatient?.id}
        />
      </div>
      {showPatientForm && (
        <PatientForm
          patient={editingPatient}
          onSubmit={handlePatientSubmit}
          onCancel={() => setShowPatientForm(false)}
        />
      )}
    </div>
  );
}

export default App;
