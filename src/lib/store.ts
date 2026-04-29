
"use client";

// This file is kept for backward compatibility if needed, 
// but the app has migrated to Firestore for real-time cloud storage.
export const useProjectStore = () => ({
  projects: [],
  tasks: [],
  isLoaded: true,
  addProject: () => {},
  updateProject: () => {},
  deleteProject: () => {},
  addTask: () => {},
  updateTask: () => {},
  deleteTask: () => {},
});
