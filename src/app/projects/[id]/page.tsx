
"use client";

import { useState, useMemo } from 'react';
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
  Settings, 
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
  Users
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
      setTimeout(() => setEditingTask(null), 100);
    }
  };

  const handleProjectSubmit = (projectData: any) => {
    if (!db || !project) return;
    updateDocumentNonBlocking(doc(db, 'projects', project.id), {
      name: projectData.name,
      description: projectData.description
    });
    setIsProjectDialogOpen(false);
  };

  const handleShareSubmit = () => {
    if (!db || !shareEmail) return;
    updateDocumentNonBlocking(doc(db, 'projects', id), {
      members: arrayUnion(shareEmail.trim())
    });
    setShareEmail('');
    setIsShareDialogOpen(false);
  };

  const handleEditTaskClick = (task: any) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!db) return;
    if (confirm('Are you sure you want to delete this task?')) {
      deleteDocumentNonBlocking(doc(db, 'projects', id, 'tasks', taskId));
    }
  };

  const handleDeleteProject = () => {
    if (!db || !project) return;
    if (confirm('Are you sure you want to delete this project and all its tasks?')) {
      deleteDocumentNonBlocking(doc(db, 'projects', project.id));
      router.push('/');
    }
  };

  const getDisplayName = (email: string) => {
    return email.split('@')[0].replace(/[._]/g, ' ');
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 text-center space-y-6">
          <div className="bg-card p-8 sm:p-12 rounded-3xl border shadow-2xl border-primary/20 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-8">Please sign in with your Google account to view this project timeline.</p>
            <Button className="w-full" onClick={() => router.push('/')}>Return to Dashboard</Button>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="text-muted-foreground">This project might have been deleted or you don't have permission to view it.</p>
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
          <div className="space-y-1 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm mb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <span className="hover:text-foreground cursor-pointer" onClick={() => router.push('/')}>Projects</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-none">{project.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold flex flex-wrap items-center gap-2 sm:gap-3">
              {project.name}
              <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[10px] sm:text-xs">
                {stats.avgProgress}% Overall
              </Badge>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">{project.description}</p>
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
             {user?.uid === project.ownerId && (
               <Button 
                variant="outline" 
                size="sm"
                className="flex-1 lg:flex-none border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                onClick={handleDeleteProject}
               >
                 <Trash2 className="w-4 h-4 mr-2" />
                 Delete
               </Button>
             )}
             <Button size="sm" className="w-full lg:w-auto bg-primary hover:bg-primary/90 shadow-lg" onClick={() => {
               setEditingTask(null);
               setIsTaskDialogOpen(true);
             }}>
               <Plus className="w-4 h-4 mr-2" />
               Add Task
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-lg">
              <LayoutList className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total</p>
              <p className="text-lg sm:text-xl font-bold">{projectTasks?.length || 0}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="bg-accent/10 p-2 sm:p-3 rounded-lg">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Done</p>
              <p className="text-lg sm:text-xl font-bold">{stats.completed}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pending</p>
              <p className="text-lg sm:text-xl font-bold">{(projectTasks?.length || 0) - stats.completed}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="bg-muted p-2 sm:p-3 rounded-lg">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg.</p>
              <p className="text-lg sm:text-xl font-bold">{stats.avgProgress}%</p>
            </div>
          </div>
        </div>

        <div className="flex-grow flex flex-col min-h-[400px]">
          <Tabs defaultValue="gantt" className="w-full flex-grow flex flex-col">
            <div className="flex items-center justify-between border-b pb-2 mb-4 overflow-x-auto hide-scrollbar">
              <TabsList className="bg-muted/50 border">
                <TabsTrigger value="gantt" className="gap-2 text-xs sm:text-sm">
                  <GanttIcon className="w-4 h-4" />
                  Gantt
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2 text-xs sm:text-sm">
                  <LayoutList className="w-4 h-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="gantt" className="flex-grow m-0 focus-visible:ring-0">
              <div className="h-[500px] lg:h-[600px]">
                <GanttChart 
                  tasks={projectTasks || []} 
                  onTaskEdit={handleEditTaskClick}
                  onTaskDelete={handleDeleteTask}
                />
              </div>
            </TabsContent>

            <TabsContent value="list" className="m-0 focus-visible:ring-0">
              <div className="bg-card border rounded-xl overflow-x-auto shadow-lg">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-muted/30 border-b text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4">Task Name</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4">Assignees</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4">Duration</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4">Progress</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {projectTasks?.map(task => (
                      <tr key={task.id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <p className="font-semibold text-xs sm:text-sm">{task.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-xs">{task.description}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          {task.assigneeEmails && task.assigneeEmails.length > 0 ? (
                            <div className="flex -space-x-2">
                              {task.assigneeEmails.map((email: string, idx: number) => (
                                <TooltipProvider key={email}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={cn(
                                        "w-6 h-6 rounded-full border-2 border-card bg-primary/10 flex items-center justify-center cursor-help",
                                        idx > 0 && "z-[idx]"
                                      )}>
                                        <User className="w-3 h-3 text-primary" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-[10px] font-bold capitalize">{getDisplayName(email)}</p>
                                      <p className="text-[8px] opacity-70">{email}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] sm:text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="text-[10px] sm:text-xs">
                            <p className="font-medium">{format(new Date(task.startDate), 'MMM d')} - {format(new Date(task.endDate), 'MMM d')}</p>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[9px] sm:text-[10px] border-none px-1.5 py-0",
                              task.progress === 100 ? "bg-green-500/10 text-green-500" :
                              task.progress > 0 ? "bg-blue-500/10 text-blue-500" :
                              "bg-muted text-muted-foreground"
                            )}
                          >
                            {task.progress === 100 ? 'DONE' : task.progress > 0 ? 'ACTIVE' : 'NEW'}
                          </Badge>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-16 sm:w-24 h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">{task.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleEditTaskClick(task);
                                }}
                              >
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive" 
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {(!projectTasks || projectTasks.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">
                          No tasks created for this project yet.
                        </td>
                      </tr>
                    )}
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
        onSubmit={handleProjectSubmit}
        initialProject={project as any}
      />

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <UserPlus className="w-5 h-5 text-primary" />
              Share Project
            </DialogTitle>
            <DialogDescription className="text-sm">
              Invite other users to collaborate on this project by entering their email address.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
              <Input 
                id="email" 
                placeholder="colleague@example.com" 
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Current Members</Label>
              <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                {project.members.map((member: string) => (
                  <div key={member} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border text-xs">
                    <span className="truncate mr-2 capitalize">{getDisplayName(member)}</span>
                    {member === project.ownerEmail && <Badge variant="outline" className="text-[8px] h-4 flex-shrink-0">OWNER</Badge>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleShareSubmit} disabled={!shareEmail}>Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
