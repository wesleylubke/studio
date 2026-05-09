
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ChevronDown, Check, Target, Calendar } from 'lucide-react';
import { format, max as maxDateFns } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ProjectStatus, Task } from '@/types';

interface ProjectCardProps {
  project: any;
}

/**
 * Parses YYYY-MM-DD string into a local Date object to avoid timezone shifts.
 */
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const members = project.members || [];
  const memberCount = members.length;

  // Fetch tasks to calculate progress and predicted end date
  const tasksQuery = useMemoFirebase(() => {
    if (!db || !project.id) return null;
    return collection(db, 'projects', project.id, 'tasks');
  }, [db, project.id]);

  const { data: tasks } = useCollection<Task>(tasksQuery);

  const stats = useMemo(() => {
    if (!tasks || tasks.length === 0) return { avgProgress: 0, endDate: null };
    const avgProgress = Math.round(tasks.reduce((acc, t) => acc + (t.progress || 0), 0) / tasks.length);
    const endDates = tasks.map(t => parseLocalDate(t.endDate));
    const latestEndDate = maxDateFns(endDates);
    return { avgProgress, endDate: latestEndDate };
  }, [tasks]);

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`);
  };

  const handleStatusChange = (e: React.MouseEvent, newStatus: ProjectStatus) => {
    e.stopPropagation();
    if (!db || !project.id) return;
    updateDocumentNonBlocking(doc(db, 'projects', project.id), { status: newStatus });
  };

  const getFriendlyName = (email: string) => {
    if (!email) return 'Usuário';
    if (user && email === user.email && user.displayName) return user.displayName;
    
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    }
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  };

  const statusMap: Record<ProjectStatus, { label: string; color: string }> = {
    ongoing: { label: 'Em Andamento', color: 'bg-primary/20 text-primary' },
    paused: { label: 'Pausado', color: 'bg-muted text-muted-foreground' },
    finished: { label: 'Finalizado', color: 'bg-accent/20 text-accent' }
  };

  const currentStatus = (project.status as ProjectStatus) || 'ongoing';

  return (
    <Card 
      className="cursor-pointer hover:shadow-2xl hover:bg-white/5 hover:border-primary/20 transition-all duration-300 border-muted/50 overflow-hidden group bg-card/40 backdrop-blur-sm"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-6">
        <div className="flex justify-between items-start gap-4 mb-3">
          <CardTitle className="text-xl font-bold truncate">
            {project.name}
          </CardTitle>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Badge 
                  className={cn(
                    "border-none px-2 py-0.5 text-[10px] font-black",
                    stats.avgProgress === 100 ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {stats.avgProgress}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="px-2 py-1 bg-popover text-popover-foreground border border-white/5 shadow-md z-50">
                <p className="text-[9px] font-bold uppercase tracking-tight opacity-70">Progresso Médio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <CardDescription className="line-clamp-2 text-sm leading-relaxed h-10 mb-6 opacity-80">
          {project.description || "Sem descrição definida para este projeto."}
        </CardDescription>
        
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 px-3 rounded-full border-none gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105",
                  statusMap[currentStatus].color
                )}
              >
                {statusMap[currentStatus].label}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-xl p-1 min-w-[150px] z-50" onClick={(e) => e.stopPropagation()}>
              {(Object.keys(statusMap) as ProjectStatus[]).map((statusKey) => (
                <DropdownMenuItem 
                  key={statusKey} 
                  className="rounded-lg py-2 text-[10px] font-black uppercase tracking-widest gap-2"
                  onClick={(e) => handleStatusChange(e, statusKey)}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full", 
                    statusKey === currentStatus ? "bg-primary" : "bg-muted-foreground/20"
                  )} />
                  {statusMap[statusKey].label}
                  {statusKey === currentStatus && <Check className="w-3 h-3 ml-auto text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className="gap-1.5 py-1 px-3 bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-wider"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Users className="w-3 h-3" />
                  {memberCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="p-3 bg-card/95 backdrop-blur-md border border-white/10 rounded-xl shadow-xl z-50 min-w-[200px]">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-1">Equipe com Acesso</p>
                  <div className="flex flex-col gap-2">
                    {members.map((email: string) => (
                      <div key={email} className="flex flex-col">
                        <span className="text-xs font-bold leading-none">{getFriendlyName(email)}</span>
                        <span className="text-[9px] text-muted-foreground">{email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1.5 py-1 px-3 border-muted-foreground/20 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  {stats.endDate ? format(stats.endDate, 'dd/MM/yy') : 'TBD'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="px-2 py-1 bg-popover text-popover-foreground border border-white/5 shadow-md z-50">
                <p className="text-[9px] font-bold uppercase tracking-tight opacity-70">Previsão de Conclusão</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
    </Card>
  );
}
