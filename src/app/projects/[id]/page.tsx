
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
  Settings
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
import { collection, doc, arrayUnion } from 'firebase/firestore';
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
    return collection(db, 'projects', id, 'tasks');
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
    setIsTaskDialogOpen(false);
    if (editingTask) {
      updateDocumentNonBlocking(doc(db, 'projects', id, 'tasks', editingTask.id), taskData);
    } else {
      addDocumentNonBlocking(collection(db, 'projects', id, 'tasks'), { ...taskData, projectId: id });
    }
  };

  const handleTaskDialogChange = (open: boolean) => {
    setIsTaskDialogOpen(open);
    if (!open) {
      setTimeout(() => setEditingTask(null), 300);
    }
  };

  const getFriendlyName = (email: string) => {
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Project not found or access denied.</h2>
          <Button variant="outline" onClick={() => router.push('/')}>Return to Dashboard</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow p-4 sm:p-6 flex flex-col space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
              <span className="hover:text-foreground cursor-pointer" onClick={() => router.push('/')}>Projects</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{project.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold flex items-center gap-3">
              {project.name}
              <Badge variant="secondary" className="bg-primary/20 text-primary border-none">
                {stats.avgProgress}%
              </Badge>
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl">{project.description}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
             <Button variant="outline" size="sm" className="flex-1 lg:flex-none" onClick={() => setIsShareDialogOpen(true)}>
               <Share2 className="w-4 h-4 mr-2" />
               Share
             </Button>
             <Button variant="outline" size="sm" className="flex-1 lg:flex-none" onClick={() => setIsProjectDialogOpen(true)}>
               <Edit2 className="w-4 h-4 mr-2" />
               Edit
             </Button>
             <Button size="sm" className="w-full lg:w-auto bg-primary shadow-lg" onClick={() => {
               setEditingTask(null);
               setIsTaskDialogOpen(true);
             }}>
               <Plus className="w-4 h-4 mr-2" />
               Add Task
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg"><LayoutList className="w-6 h-6 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total</p>
              <p className="text-xl font-bold">{projectTasks?.length || 0}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-accent/10 p-3 rounded-lg"><CheckCircle2 className="w-6 h-6 text-accent" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Done</p>
              <p className="text-xl font-bold">{stats.completed}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg"><Clock className="w-6 h-6 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pending</p>
              <p className="text-xl font-bold">{(projectTasks?.length || 0) - stats.completed}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-muted p-3 rounded-lg"><Settings className="w-6 h-6 text-muted-foreground" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg.</p>
              <p className="text-xl font-bold">{stats.avgProgress}%</p>
            </div>
          </div>
        </div>

        <div className="flex-grow flex flex-col min-h-[400px]">
          <Tabs defaultValue="gantt" className="w-full flex-grow flex flex-col">
            <TabsList className="bg-muted/50 border self-start mb-4">
              <TabsTrigger value="gantt" className="gap-2">
                <GanttIcon className="w-4 h-4" />
                Gantt Chart
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <LayoutList className="w-4 h-4" />
                List View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gantt" className="flex-grow m-0 focus-visible:ring-0">
              <div className="h-[500px] lg:h-[600px]">
                <GanttChart 
                  tasks={projectTasks || []} 
                  onTaskEdit={(task) => {
                    setEditingTask(task);
                    setIsTaskDialogOpen(true);
                  }}
                  onTaskDelete={(taskId) => {
                    if (confirm('Delete this task?')) deleteDocumentNonBlocking(doc(db, 'projects', id, 'tasks', taskId));
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="list" className="m-0 focus-visible:ring-0">
              <div className="bg-card border rounded-xl overflow-x-auto shadow-lg">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-muted/30 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Task Name</th>
                      <th className="px-6 py-4">Assignees</th>
                      <th className="px-6 py-4">Timeline</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {projectTasks?.map(task => (
                      <tr key={task.id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-sm">{task.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          {task.assigneeEmails && task.assigneeEmails.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {task.assigneeEmails.map(email => (
                                <Badge key={email} variant="outline" className="text-[10px] capitalize">
                                  {getFriendlyName(email)}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <p className="font-medium">{format(new Date(task.startDate), 'MMM d')} - {format(new Date(task.endDate), 'MMM d')}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${task.progress}%` }} />
                            </div>
                            <span className="text-xs font-bold">{task.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={(e) => {
                                e.preventDefault(); // Critical fix for UI freeze
                                setTimeout(() => {
                                  setEditingTask(task);
                                  setIsTaskDialogOpen(true);
                                }, 100);
                              }}>
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onSelect={(e) => {
                                e.preventDefault();
                                if (confirm('Delete this task?')) deleteDocumentNonBlocking(doc(db, 'projects', id, 'tasks', task.id));
                              }}>
                                Delete Task
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Share Project
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
              <Input 
                id="email" 
                placeholder="colleague@example.com" 
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (shareEmail) updateDocumentNonBlocking(doc(db, 'projects', id), { members: arrayUnion(shareEmail.trim().toLowerCase()) });
              setShareEmail('');
              setIsShareDialogOpen(false);
            }}>Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
