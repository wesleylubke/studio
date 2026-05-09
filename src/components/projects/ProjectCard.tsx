import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Clock, ChevronDown, Check } from 'lucide-react';
import { format } from 'date-fns';
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
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ProjectStatus } from '@/types';

interface ProjectCardProps {
  project: any;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const db = useFirestore();
  const members = project.members || [];
  const memberCount = members.length;

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`);
  };

  const handleStatusChange = (e: React.MouseEvent, newStatus: ProjectStatus) => {
    e.stopPropagation();
    if (!db || !project.id) return;
    updateDocumentNonBlocking(doc(db, 'projects', project.id), { status: newStatus });
  };

  const getFriendlyName = (email: string) => {
    if (!email) return '';
    return email.split('@')[0]
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const statusMap: Record<ProjectStatus, { label: string; color: string }> = {
    ongoing: { label: 'Em Andamento', color: 'bg-primary/20 text-primary' },
    paused: { label: 'Pausado', color: 'bg-muted text-muted-foreground' },
    finished: { label: 'Finalizado', color: 'bg-accent/20 text-accent' }
  };

  const currentStatus = (project.status as ProjectStatus) || 'ongoing';

  return (
    <Card 
      className="cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-muted/50 overflow-hidden group bg-card/40 backdrop-blur-sm hover:bg-white/5 hover:border-primary/20"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-6">
        <div className="flex justify-between items-start gap-4 mb-3">
          <CardTitle className="text-xl font-bold truncate">
            {project.name}
          </CardTitle>
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
                  {memberCount} {memberCount === 1 ? 'Membro' : 'Membros'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="p-3 bg-card/95 backdrop-blur-md border-2 rounded-xl shadow-2xl z-50 min-w-[200px]">
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

          <Badge variant="outline" className="gap-1.5 py-1 px-3 border-muted-foreground/20 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            {project.createdAt ? format(new Date(project.createdAt), 'dd/MM/yy') : 'Recente'}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
