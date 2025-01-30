export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "assistant";
  type: "search" | "counseling";
  patientId?: string;
}

export interface Threads {
  id: string;
  title: string;
}
