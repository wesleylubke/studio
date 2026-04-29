"use client";

import { useState, useEffect } from 'react';
import type { Project, Task } from '@/types';

const PROJECTS_KEY = 'ganttflow_projects';
const TASKS_KEY = 'ganttflow_tasks';

export function useProjectStore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedProjects = localStorage.getItem(PROJECTS_KEY);
    const storedTasks = localStorage.getItem(TASKS_KEY);

    if (storedProjects) setProjects(JSON.parse(storedProjects));
    if (storedTasks) setTasks(JSON.parse(storedTasks));
    setIsLoaded(true);
  }, []);

  const saveToStorage = (newProjects: Project[], newTasks: Task[]) => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));
    localStorage.setItem(TASKS_KEY, JSON.stringify(newTasks));
  };

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    saveToStorage(updated, tasks);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updated = projects.map(p => (p.id === id ? { ...p, ...updates } : p));
    setProjects(updated);
    saveToStorage(updated, tasks);
  };

  const deleteProject = (id: string) => {
    const updatedProjects = projects.filter(p => p.id !== id);
    const updatedTasks = tasks.filter(t => t.projectId !== id);
    setProjects(updatedProjects);
    setTasks(updatedTasks);
    saveToStorage(updatedProjects, updatedTasks);
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveToStorage(projects, updated);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => (t.id === id ? { ...t, ...updates } : t));
    setTasks(updated);
    saveToStorage(projects, updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveToStorage(projects, updated);
  };

  return {
    projects,
    tasks,
    isLoaded,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
  };
}
