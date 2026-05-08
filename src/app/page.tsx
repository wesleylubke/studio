
"use client";

import { useState, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectDialog from '@/components/projects/ProjectDialog';
import { Button } from "@/components/ui/button";
import { Plus, LayoutTemplate, Sparkles, Loader2, ArrowRight, Clock, PauseCircle, CheckCircle2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase, initiateGoogleSignIn } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectStatus>('ongoing');

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user || !user.email) return null;
    return query(collection(db, 'projects'), where('members', 'array-contains', user.email));
  }, [db, user]);

  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  const counts = useMemo(() => {
    if (!projects) return { ongoing: 0, paused: 0, finished: 0 };
    return {
      ongoing: projects.filter(p => (p.status || 'ongoing') === 'ongoing').length,
      paused: projects.filter(p => p.status === 'paused').length,
      finished: projects.filter(p => p.status === 'finished').length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => (p.status || 'ongoing') === activeTab);
  }, [projects, activeTab]);

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

  const handleCreateProject = async (data: { name: string; description: string; status?: ProjectStatus; tasks?: any[] }) => {
    if (!user || !db) return;

    const projectsRef = collection(db, 'projects');
    const projectData = {
      name: data.name,
      description: data.description,
      status: data.status || 'ongoing',
      ownerId: user.uid,
      ownerEmail: user.email,
      members: [user.email],
      createdAt: new Date().toISOString()
    };

    const projectRefPromise = addDocumentNonBlocking(projectsRef, projectData);
    const projectRef = await projectRefPromise;

    if (data.tasks && data.tasks.length > 0 && projectRef) {
      const tasksRef = collection(db, 'projects', projectRef.id, 'tasks');
      let currentStartDate = new Date();
      data.tasks.forEach((task, index) => {
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
                ? `Você tem ${projects.length} projeto(s) no total.`
                : "Comece criando um novo projeto para gerenciar seus fluxos."}
            </p>
          </div>
          <Button 
            className="w-full sm:w-auto rounded-full px-8 h-12 shadow-xl bg-primary hover:bg-primary/90 hover:scale-105 transition-all text-sm font-bold"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Projeto
          </Button>
        </div>

        <Tabs defaultValue="ongoing" className="w-full mb-12" onValueChange={(val) => setActiveTab(val as ProjectStatus)}>
          <TabsList className="grid grid-cols-3 gap-2 sm:gap-6 bg-transparent h-auto p-0 border-none w-full mb-12">
            <TabsTrigger 
              value="ongoing" 
              className="bg-card/50 border rounded-xl sm:rounded-2xl p-2 sm:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-5 backdrop-blur-sm shadow-lg text-center sm:text-left data-[state=active]:bg-primary/10 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all duration-300 group"
            >
              <div className={cn("p-1.5 sm:p-4 rounded-lg sm:rounded-2xl bg-primary/10 group-data-[state=active]:bg-primary/20 transition-colors")}>
                <Clock className={cn("w-4 h-4 sm:w-7 sm:h-7 text-primary")} />
              </div>
              <div>
                <p className="text-[7px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-black leading-tight">Andamento</p>
                <p className="text-xs sm:text-3xl font-black leading-tight">{counts.ongoing}</p>
              </div>
            </TabsTrigger>

            <TabsTrigger 
              value="paused" 
              className="bg-card/50 border rounded-xl sm:rounded-2xl p-2 sm:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-5 backdrop-blur-sm shadow-lg text-center sm:text-left data-[state=active]:bg-muted/50 data-[state=active]:border-muted-foreground/30 data-[state=active]:text-foreground transition-all duration-300 group"
            >
              <div className={cn("p-1.5 sm:p-4 rounded-lg sm:rounded-2xl bg-muted group-data-[state=active]:bg-muted/80 transition-colors")}>
                <PauseCircle className={cn("w-4 h-4 sm:w-7 sm:h-7 text-muted-foreground")} />
              </div>
              <div>
                <p className="text-[7px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-black leading-tight">Pausados</p>
                <p className="text-xs sm:text-3xl font-black leading-tight">{counts.paused}</p>
              </div>
            </TabsTrigger>

            <TabsTrigger 
              value="finished" 
              className="bg-card/50 border rounded-xl sm:rounded-2xl p-2 sm:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-5 backdrop-blur-sm shadow-lg text-center sm:text-left data-[state=active]:bg-accent/10 data-[state=active]:border-accent data-[state=active]:text-foreground transition-all duration-300 group"
            >
              <div className={cn("p-1.5 sm:p-4 rounded-lg sm:rounded-2xl bg-accent/10 group-data-[state=active]:bg-accent/20 transition-colors")}>
                <CheckCircle2 className={cn("w-4 h-4 sm:w-7 sm:h-7 text-accent")} />
              </div>
              <div>
                <p className="text-[7px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-black leading-tight">Finalizados</p>
                <p className="text-xs sm:text-3xl font-black leading-tight">{counts.finished}</p>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="focus-visible:ring-0">
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                {filteredProjects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-muted/50 rounded-3xl bg-muted/5 space-y-6 text-center px-6">
                <LayoutTemplate className="w-16 h-16 text-muted-foreground opacity-20" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Nenhum projeto aqui</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'ongoing' 
                      ? "Você não tem projetos ativos no momento."
                      : activeTab === 'paused'
                      ? "Não há projetos pausados para exibição."
                      : "Sua lista de projetos finalizados está vazia."}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ProjectDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
