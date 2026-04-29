
"use client";

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectDialog from '@/components/projects/ProjectDialog';
import { Button } from "@/components/ui/button";
import { Plus, LayoutTemplate, Sparkles, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user || !user.email) return null;
    return query(collection(db, 'projects'), where('members', 'array-contains', user.email));
  }, [db, user]);

  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  const handleCreateProject = async ({ name, description, tasks: aiTasks }: { name: string; description: string; tasks?: any[] }) => {
    if (!user || !db) return;

    const projectsRef = collection(db, 'projects');
    const projectData = {
      name,
      description,
      ownerId: user.uid,
      ownerEmail: user.email,
      members: [user.email],
      createdAt: new Date().toISOString()
    };

    const projectRefPromise = addDocumentNonBlocking(projectsRef, projectData);
    const projectRef = await projectRefPromise;

    if (aiTasks && aiTasks.length > 0 && projectRef) {
      const tasksRef = collection(db, 'projects', projectRef.id, 'tasks');
      let currentStartDate = new Date();
      aiTasks.forEach((task, index) => {
        const start = addDays(currentStartDate, index * 2);
        const end = addDays(start, 3);
        
        addDocumentNonBlocking(tasksRef, {
          projectId: projectRef.id,
          name: task.name,
          description: task.description,
          startDate: format(start, 'yyyy-MM-dd'),
          endDate: format(end, 'yyyy-MM-dd'),
          progress: 0
        });
      });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (!db) return;
    if (confirm('Are you sure you want to delete this project?')) {
      deleteDocumentNonBlocking(doc(db, 'projects', projectId));
    }
  };

  if (isUserLoading || (user && isProjectsLoading)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-8">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Master your project timelines with <span className="text-primary">GanttFlow</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
              The easiest way to visualize progress and collaborate with your team in real-time.
            </p>
          </div>
          <div className="bg-card p-8 sm:p-12 rounded-3xl border shadow-2xl border-primary/20 max-w-md w-full">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-6" />
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Ready to start?</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">Sign in with your Google account to create your first portfolio.</p>
            <Button className="w-full bg-primary hover:bg-primary/90 rounded-full h-12 text-lg">
              Get Started
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6 mb-6 sm:mb-10">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-3xl sm:text-4xl font-headline font-extrabold tracking-tight">
              Your <span className="text-primary">Portfolios</span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground">
              Organize workflows and visualize project progress.
            </p>
          </div>
          <Button 
            className="w-full sm:w-auto rounded-full px-8 h-12 shadow-lg bg-primary hover:bg-primary/90 hover:scale-105 transition-all text-sm font-bold"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {projects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 border-2 border-dashed border-muted rounded-2xl bg-muted/10 space-y-6">
            <div className="bg-muted p-5 sm:p-6 rounded-full">
              <LayoutTemplate className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground opacity-50" />
            </div>
            <div className="text-center space-y-2 px-4">
              <h3 className="text-xl sm:text-2xl font-bold">No projects yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xs mx-auto">
                Create your first project manually or use our AI assistant to generate a roadmap.
              </p>
            </div>
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-6"
              onClick={() => setIsDialogOpen(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Try AI Planner
            </Button>
          </div>
        )}
      </main>

      <ProjectDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
