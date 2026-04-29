"use client";

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectDialog from '@/components/projects/ProjectDialog';
import { useProjectStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Plus, LayoutTemplate, Sparkles } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function Home() {
  const { projects, tasks, isLoaded, addProject, deleteProject, addTask } = useProjectStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateProject = async ({ name, description, tasks: aiTasks }: { name: string; description: string; tasks?: any[] }) => {
    const project = addProject({ name, description });
    
    if (aiTasks && aiTasks.length > 0) {
      let currentStartDate = new Date();
      aiTasks.forEach((task, index) => {
        const start = addDays(currentStartDate, index * 2);
        const end = addDays(start, 3);
        
        addTask({
          projectId: project.id,
          name: task.name,
          description: task.description,
          startDate: format(start, 'yyyy-MM-dd'),
          endDate: format(end, 'yyyy-MM-dd'),
          progress: 0
        });
      });
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-extrabold tracking-tight">
              Your <span className="text-primary">Portfolios</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Organize workflows and visualize project progress.
            </p>
          </div>
          <Button 
            className="rounded-full px-6 shadow-lg bg-primary hover:bg-primary/90 hover:scale-105 transition-all"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                taskCount={tasks.filter(t => t.projectId === project.id).length}
                onDelete={deleteProject}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-muted rounded-2xl bg-muted/10 space-y-6">
            <div className="bg-muted p-6 rounded-full">
              <LayoutTemplate className="w-12 h-12 text-muted-foreground opacity-50" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">No projects yet</h3>
              <p className="text-muted-foreground max-w-xs">
                Create your first project manually or use our AI assistant to generate a roadmap.
              </p>
            </div>
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90"
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