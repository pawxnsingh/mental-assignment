import axios from "axios";
import { Patient } from "../types";

export const api = {
  // Patient CRUD operations
  getPatients: async () => {
    const getAllPatients = await axios.get(
      `http://${import.meta.env.VITE_SERVER_HOST}:${
        import.meta.env.VITE_SERVER_PORT
      }/api/patients/`
    );

    console.log({ getAllPatients });
    return getAllPatients.data;
  },

  addPatient: async (patientData: Omit<Patient, "id">) => {
    const newPatient = await axios.post(
      `http://${import.meta.env.VITE_SERVER_HOST}:${
        import.meta.env.VITE_SERVER_PORT
      }/api/patients/`,
      patientData
    );
    return newPatient.data;
  },

  updatePatient: async (id: string, patientData: Omit<Patient, "id">) => {
    const updatedPatient = await axios.put(
      `http://${import.meta.env.VITE_SERVER_HOST}:${
        import.meta.env.VITE_SERVER_PORT
      }/api/patients/?id=${id}`,
      patientData
    );
    console.log(updatedPatient.data);
    return updatedPatient.data;
  },

  deletePatient: async (id: string) => {
    const deletePatients = await axios.delete(
      `http://${import.meta.env.VITE_SERVER_HOST}:${
        import.meta.env.VITE_SERVER_PORT
      }/api/patients/?id=${id}`
    );
    console.log(deletePatients.data);
    return true;
  },

  // Thread operations
  getThreadMessages: async (threadId: string) => {
    const ThreadMessages = await axios.get(
      `http://${import.meta.env.VITE_SERVER_HOST}:${
        import.meta.env.VITE_SERVER_PORT
      }/api/create-thread/?thread_id=${threadId}`
    );

    return ThreadMessages.data;
  },

  createThread: async () => {
    const newThread = await axios.post(
      `http://${import.meta.env.VITE_SERVER_HOST}:${
        import.meta.env.VITE_SERVER_PORT
      }/api/create-thread/`,
      {
        title: "default title",
      }
    );

    return newThread.data;
  },

  getAllThreads: async () => {
    const allThread = await axios.get(
      `http://${import.meta.env.VITE_SERVER_HOST}:${
        import.meta.env.VITE_SERVER_PORT
      }/api/create-thread/`
    );
    return allThread.data;
  },

  addMessage: async (
    message: string,
    patient_id: string,
    thread_id: string
  ) => {
    const postMessage = await axios.post(
      `http://${import.meta.env.VITE_SERVER_HOST}:${
        import.meta.env.VITE_SERVER_PORT
      }/api/chat/`,
      {
        message: message,
        patient_id: patient_id,
        thread_id: thread_id,
      }
    );
    return postMessage.data;
  },

  searchDatabase: async (query: string) => {
    const postMessage = await axios.post(
      `http://${import.meta.env.VITE_SERVER_HOST}:${
        import.meta.env.VITE_SERVER_PORT
      }/api/search-database/`,
      {
        type: "database_search",
        query: query,
      }
    );
    return postMessage.data;
  },

  storeSearches: async (
    thread_id: string,
    response: string,
    message: string
  ) => {
    const storeSearches = await axios.post(
      `http://${import.meta.env.VITE_SERVER_HOST}:${
        import.meta.env.VITE_SERVER_PORT
      }/api/storeSearches/`,
      {
        thread_id: thread_id,
        message: message,
        response: response,
      }
    );
    return storeSearches.data;
  },
};
