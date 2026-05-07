"use client";

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectDialog from '@/components/projects/ProjectDialog';
import { Button } from "@/components/ui/button";
import { Plus, LayoutTemplate, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase, initiateGoogleSignIn } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user || !user.email) return null;
    return query(collection(db, 'projects'), where('members', 'array-contains', user.email));
  }, [db, user]);

  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoginLoading(false);
    }
  };

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
          progress: 0,
          assigneeEmails: [],
          order: index
        });
      });
    }
  };

  if (isUserLoading || (user && isProjectsLoading)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-12">
          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-tight">
              Visualize seu futuro com <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">GanttFlow</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A maneira mais inteligente de planejar timelines, colaborar em equipe e bater metas em tempo recorde.
            </p>
          </div>
          
          <div className="relative group animate-in zoom-in duration-700 delay-300">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-card p-10 rounded-3xl border border-white/5 shadow-2xl max-w-md w-full text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">Pronto para começar?</h3>
              <p className="text-muted-foreground mb-8">Junte-se a milhares de times que organizam seus projetos com precisão visual.</p>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 rounded-full h-14 text-xl font-bold shadow-xl hover:scale-105 transition-all"
                onClick={handleLogin}
                disabled={isLoginLoading}
              >
                {isLoginLoading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <ArrowRight className="w-6 h-6 mr-3" />}
                Entrar com Google
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight">
              Seu <span className="text-primary">Portfólio</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {projects && projects.length > 0 
                ? `Você tem ${projects.length} projeto(s) ativos no momento.`
                : "Comece criando um novo projeto para gerenciar seus fluxos."}
            </p>
          </div>
          <Button 
            className="w-full sm:w-auto rounded-full px-10 h-14 shadow-2xl bg-primary hover:bg-primary/90 hover:scale-105 transition-all text-base font-bold"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-6 h-6 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 sm:py-32 border-2 border-dashed border-muted/50 rounded-3xl bg-muted/5 space-y-8 text-center px-6">
            <div className="bg-muted p-8 rounded-full shadow-inner">
              <LayoutTemplate className="w-16 h-16 text-muted-foreground opacity-40" />
            </div>
            <div className="space-y-4 max-w-md">
              <h3 className="text-3xl font-bold">Nenhum projeto ainda</h3>
              <p className="text-lg text-muted-foreground">
                Que tal deixar nossa IA planejar seu primeiro roadmap? Ou comece do zero manualmente.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button 
                variant="outline"
                className="rounded-full px-8 h-12 border-primary text-primary hover:bg-primary/10 font-bold"
                onClick={() => setIsDialogOpen(true)}
              >
                Criar Manual
              </Button>
              <Button 
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 h-12 font-bold shadow-lg"
                onClick={() => setIsDialogOpen(true)}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Usar AI Planner
              </Button>
            </div>
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
