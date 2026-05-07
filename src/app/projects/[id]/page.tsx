"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import GanttChart from '@/components/gantt/GanttChart';
import TaskDialog from '@/components/tasks/TaskDialog';
import ProjectDialog from '@/components/projects/ProjectDialog';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ChevronRight, 
  LayoutList, 
  GanttChart as GanttIcon,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit2,
  Share2,
  Loader2,
  UserPlus,
  User,
  Settings,
  ChevronUp,
  ChevronDown,
  Target
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, arrayUnion, query, orderBy } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [shareEmail, setShareEmail] = useState('');

  const projectRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'projects', id);
  }, [db, id, user]);
  const { data: project, isLoading: isProjectLoading } = useDoc(projectRef);

  const tasksQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'projects', id, 'tasks'), orderBy('order', 'asc'));
  }, [db, id, user]);
  const { data: projectTasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  const stats = useMemo(() => {
    if (!projectTasks || projectTasks.length === 0) return { avgProgress: 0, completed: 0 };
    const completed = projectTasks.filter(t => t.progress === 100).length;
    const avgProgress = Math.round(projectTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / projectTasks.length);
    return { avgProgress, completed };
  }, [projectTasks]);

  const handleTaskSubmit = (taskData: any) => {
    if (!db) return;
    
    const finalData = {
      ...taskData,
      assigneeEmails: taskData.assigneeEmails || []
    };

    if (editingTask) {
      updateDocumentNonBlocking(doc(db, 'projects', id, 'tasks', editingTask.id), finalData);
    } else {
      const nextOrder = projectTasks && projectTasks.length > 0 
        ? Math.max(...projectTasks.map(t => t.order || 0)) + 1 
        : 0;
      addDocumentNonBlocking(collection(db, 'projects', id, 'tasks'), { ...finalData, projectId: id, order: nextOrder });
    }
    
    setIsTaskDialogOpen(false);
    setTimeout(() => setEditingTask(null), 300);
  };

  const handleMoveTask = (taskId: string, direction: 'up' | 'down') => {
    if (!db || !projectTasks) return;
    const currentIndex = projectTasks.findIndex(t => t.id === taskId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= projectTasks.length) return;

    const currentTask = projectTasks[currentIndex];
    const targetTask = projectTasks[targetIndex];

    updateDocumentNonBlocking(doc(db, 'projects', id, 'tasks', currentTask.id), { order: targetTask.order });
    updateDocumentNonBlocking(doc(db, 'projects', id, 'tasks', targetTask.id), { order: currentTask.order });
  };

  const handleTaskDialogChange = (open: boolean) => {
    setIsTaskDialogOpen(open);
    if (!open) {
      setTimeout(() => setEditingTask(null), 300);
    }
  };

  const getFriendlyName = (email: string) => {
    if (!email) return 'Usuário';
    return email.split('@')[0]
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  if (isUserLoading || (user && (isProjectLoading || isTasksLoading))) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-6">
          <Target className="w-16 h-16 text-muted-foreground opacity-20" />
          <h2 className="text-3xl font-black">Projeto não encontrado</h2>
          <Button variant="outline" className="rounded-full" onClick={() => router.push('/')}>Voltar ao Início</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow p-4 sm:p-8 flex flex-col space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-widest">
              <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => router.push('/')}>Portfólio</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{project.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tighter">
                {project.name}
              </h1>
              <Badge className="bg-primary/20 text-primary border-none px-4 py-1 text-sm font-black">
                {stats.avgProgress}% CONCLUÍDO
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">{project.description}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
             <Button variant="outline" className="flex-1 xl:flex-none rounded-full h-12 font-bold gap-2 px-6" onClick={() => setIsShareDialogOpen(true)}>
               <Share2 className="w-4 h-4" /> Compartilhar
             </Button>
             <Button variant="outline" className="flex-1 xl:flex-none rounded-full h-12 font-bold gap-2 px-6" onClick={() => setIsProjectDialogOpen(true)}>
               <Edit2 className="w-4 h-4" /> Editar
             </Button>
             <Button className="w-full xl:w-auto bg-primary shadow-xl rounded-full h-12 font-bold gap-2 px-8 hover:scale-105 transition-transform" onClick={() => {
               setEditingTask(null);
               setIsTaskDialogOpen(true);
             }}>
               <Plus className="w-5 h-5" /> Nova Tarefa
             </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total', value: projectTasks?.length || 0, icon: LayoutList, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Concluídas', value: stats.completed, icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10' },
            { label: 'Pendentes', value: (projectTasks?.length || 0) - stats.completed, icon: Clock, color: 'text-primary', bg: 'bg-primary/5' },
            { label: 'Progresso', value: `${stats.avgProgress}%`, icon: Target, color: 'text-muted-foreground', bg: 'bg-muted' }
          ].map((stat, i) => (
            <div key={i} className="bg-card/50 border rounded-2xl p-6 flex items-center gap-5 backdrop-blur-sm shadow-lg group hover:bg-card transition-colors">
              <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-7 h-7", stat.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">{stat.label}</p>
                <p className="text-3xl font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content (Tabs) */}
        <div className="flex-grow flex flex-col min-h-[600px]">
          <Tabs defaultValue="gantt" className="w-full flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <TabsList className="bg-muted/50 border-2 rounded-full p-1.5 h-14">
                <TabsTrigger value="gantt" className="rounded-full px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <GanttIcon className="w-5 h-5" /> Gantt
                </TabsTrigger>
                <TabsTrigger value="list" className="rounded-full px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <LayoutList className="w-5 h-5" /> Lista
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="gantt" className="flex-grow m-0 focus-visible:ring-0">
              <div className="h-[600px] xl:h-[700px]">
                <GanttChart 
                  tasks={projectTasks || []} 
                  onTaskEdit={(task) => {
                    setEditingTask(task);
                    setIsTaskDialogOpen(true);
                  }}
                  onTaskDelete={(taskId) => {
                    if (confirm('Deseja realmente excluir esta tarefa?')) deleteDocumentNonBlocking(doc(db, 'projects', id, 'tasks', taskId));
                  }}
                  onMoveTask={handleMoveTask}
                />
              </div>
            </TabsContent>

            <TabsContent value="list" className="m-0 focus-visible:ring-0">
              <div className="bg-card/50 backdrop-blur-sm border rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-muted/40 border-b text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    <tr>
                      <th className="px-8 py-5 w-24 text-center">Ordem</th>
                      <th className="px-8 py-5">Tarefa</th>
                      <th className="px-8 py-5">Equipe</th>
                      <th className="px-8 py-5">Timeline</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {projectTasks?.map((task, index) => (
                      <tr key={task.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded-lg hover:bg-primary/20"
                              disabled={index === 0}
                              onClick={() => handleMoveTask(task.id, 'up')}
                            >
                              <ChevronUp className="w-5 h-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded-lg hover:bg-primary/20"
                              disabled={index === (projectTasks?.length || 0) - 1}
                              onClick={() => handleMoveTask(task.id, 'down')}
                            >
                              <ChevronDown className="w-5 h-5" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-bold text-base group-hover:text-primary transition-colors">{task.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</p>
                        </td>
                        <td className="px-8 py-5">
                          {task.assigneeEmails && task.assigneeEmails.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {task.assigneeEmails.map(email => (
                                <Badge key={email} variant="secondary" className="text-[10px] font-bold px-2 py-0.5 capitalize bg-muted-foreground/10 border-none">
                                  {getFriendlyName(email)}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground/50 italic">Sem equipe</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-xs font-bold">
                            <span className="text-muted-foreground">{format(new Date(task.startDate), 'dd MMM')}</span>
                            <span className="mx-2 text-primary opacity-50">—</span>
                            <span className="text-muted-foreground">{format(new Date(task.endDate), 'dd MMM')}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                              <div className={cn("h-full transition-all duration-500", task.progress === 100 ? "bg-accent" : "bg-primary")} style={{ width: `${task.progress}%` }} />
                            </div>
                            <span className="text-xs font-black">{task.progress}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-40 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl p-2 min-w-[160px]">
                              <DropdownMenuItem className="rounded-lg py-2 font-bold" onSelect={(e) => {
                                e.preventDefault();
                                setTimeout(() => {
                                  setEditingTask(task);
                                  setIsTaskDialogOpen(true);
                                }, 100);
                              }}>
                                <Edit2 className="w-4 h-4 mr-2" /> Editar Tarefa
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg py-2 font-bold text-destructive" onSelect={(e) => {
                                e.preventDefault();
                                if (confirm('Excluir tarefa permanentemente?')) deleteDocumentNonBlocking(doc(db, 'projects', id, 'tasks', task.id));
                              }}>
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir Tarefa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <TaskDialog 
        open={isTaskDialogOpen} 
        onOpenChange={handleTaskDialogChange} 
        onSubmit={handleTaskSubmit}
        initialTask={editingTask}
        projectMembers={project.members}
      />

      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onSubmit={(data) => {
          updateDocumentNonBlocking(doc(db, 'projects', id), data);
          setIsProjectDialogOpen(false);
        }}
        initialProject={project as any}
      />

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black">
              <UserPlus className="w-8 h-8 text-primary" />
              Convidar Equipe
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Endereço de E-mail</Label>
              <Input 
                id="email" 
                placeholder="colaborador@exemplo.com" 
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-base"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" className="rounded-full h-12 font-bold px-6" onClick={() => setIsShareDialogOpen(false)}>Cancelar</Button>
            <Button className="rounded-full h-12 font-bold px-8 shadow-xl bg-primary" onClick={() => {
              if (shareEmail) updateDocumentNonBlocking(doc(db, 'projects', id), { members: arrayUnion(shareEmail.trim().toLowerCase()) });
              setShareEmail('');
              setIsShareDialogOpen(false);
            }}>Enviar Convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}