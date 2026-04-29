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
  UserPlus
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

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [shareEmail, setShareEmail] = useState('');

  const projectRef = useMemoFirebase(() => db ? doc(db, 'projects', id) : null, [db, id]);
  const { data: project, isLoading: isProjectLoading } = useDoc(projectRef);

  const tasksQuery = useMemoFirebase(() => db ? collection(db, 'projects', id, 'tasks') : null, [db, id]);
  const { data: projectTasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  const stats = useMemo(() => {
    if (!projectTasks || projectTasks.length === 0) return { avgProgress: 0, completed: 0 };
    const completed = projectTasks.filter(t => t.progress === 100).length;
    const avgProgress = Math.round(projectTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / projectTasks.length);
    return { avgProgress, completed };
  }, [projectTasks]);

  if (isProjectLoading || isTasksLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Project not found or Access Denied</h2>
        <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  const handleTaskSubmit = (taskData: any) => {
    if (!db) return;
    if (editingTask) {
      updateDocumentNonBlocking(doc(db, 'projects', id, 'tasks', editingTask.id), taskData);
    } else {
      addDocumentNonBlocking(collection(db, 'projects', id, 'tasks'), { ...taskData, projectId: id });
    }
    setEditingTask(null);
  };

  const handleProjectSubmit = (projectData: any) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'projects', project.id), {
      name: projectData.name,
      description: projectData.description
    });
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
    deleteDocumentNonBlocking(doc(db, 'projects', id, 'tasks', taskId));
  };

  const handleDeleteProject = () => {
    if (!db) return;
    if (confirm('Are you sure you want to delete this project and all its tasks?')) {
      deleteDocumentNonBlocking(doc(db, 'projects', project.id));
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow p-6 flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
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
              <span className="text-foreground font-medium">{project.name}</span>
            </div>
            <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
              {project.name}
              <Badge variant="secondary" className="bg-primary/20 text-primary border-none">
                {stats.avgProgress}% Overall
              </Badge>
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl">{project.description}</p>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
               <Share2 className="w-4 h-4 mr-2" />
               Share
             </Button>
             <Button variant="outline" onClick={() => setIsProjectDialogOpen(true)}>
               <Edit2 className="w-4 h-4 mr-2" />
               Edit
             </Button>
             {user?.uid === project.ownerId && (
               <Button 
                variant="outline" 
                className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                onClick={handleDeleteProject}
               >
                 <Trash2 className="w-4 h-4 mr-2" />
                 Delete
               </Button>
             )}
             <Button className="bg-primary hover:bg-primary/90 shadow-lg" onClick={() => {
               setEditingTask(null);
               setIsTaskDialogOpen(true);
             }}>
               <Plus className="w-4 h-4 mr-2" />
               Add Task
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <LayoutList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Tasks</p>
              <p className="text-xl font-bold">{projectTasks?.length || 0}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-accent/10 p-3 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Completed</p>
              <p className="text-xl font-bold">{stats.completed}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">In Progress</p>
              <p className="text-xl font-bold">{(projectTasks?.length || 0) - stats.completed}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-muted p-3 rounded-lg">
              <Settings className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg. Progress</p>
              <p className="text-xl font-bold">{stats.avgProgress}%</p>
            </div>
          </div>
        </div>

        <div className="flex-grow flex flex-col">
          <Tabs defaultValue="gantt" className="w-full flex-grow flex flex-col">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <TabsList className="bg-muted/50 border">
                <TabsTrigger value="gantt" className="gap-2">
                  <GanttIcon className="w-4 h-4" />
                  Gantt Chart
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <LayoutList className="w-4 h-4" />
                  Task List
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="gantt" className="flex-grow m-0 focus-visible:ring-0">
              <div className="h-[600px]">
                <GanttChart 
                  tasks={projectTasks || []} 
                  onTaskEdit={handleEditTaskClick}
                  onTaskDelete={handleDeleteTask}
                />
              </div>
            </TabsContent>

            <TabsContent value="list" className="m-0 focus-visible:ring-0">
              <div className="bg-card border rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left">
                  <thead className="bg-muted/30 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Task Name</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Status</th>
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
                          <div className="text-xs">
                            <p className="font-medium">{format(new Date(task.startDate), 'MMM d')} - {format(new Date(task.endDate), 'MMM d')}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[10px] border-none",
                              task.progress === 100 ? "bg-green-500/10 text-green-500" :
                              task.progress > 0 ? "bg-blue-500/10 text-blue-500" :
                              "bg-muted text-muted-foreground"
                            )}
                          >
                            {task.progress === 100 ? 'COMPLETED' : task.progress > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground">{task.progress}%</span>
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
                              <DropdownMenuItem onClick={() => handleEditTaskClick(task)}>
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
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
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
        onOpenChange={setIsTaskDialogOpen} 
        onSubmit={handleTaskSubmit}
        initialTask={editingTask}
      />

      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onSubmit={handleProjectSubmit}
        initialProject={project as any}
      />

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Share Project
            </DialogTitle>
            <DialogDescription>
              Invite other users to collaborate on this project by entering their email address.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                placeholder="colleague@example.com" 
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Current Members</Label>
              <div className="space-y-1">
                {project.members.map((member: string) => (
                  <div key={member} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border text-sm">
                    <span>{member}</span>
                    {member === project.ownerEmail && <Badge variant="outline" className="text-[8px] h-4">OWNER</Badge>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleShareSubmit} disabled={!shareEmail}>Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
