import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectCardProps {
  project: any;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const members = project.members || [];
  const memberCount = members.length;

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`);
  };

  const getFriendlyName = (email: string) => {
    if (!email) return '';
    return email.split('@')[0]
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-muted/50 overflow-hidden group bg-card/40 backdrop-blur-sm"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-6">
        <div className="flex justify-between items-start gap-2 mb-2">
          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors truncate">
            {project.name}
          </CardTitle>
        </div>
        
        <CardDescription className="line-clamp-2 text-sm leading-relaxed h-10 mb-6 opacity-80">
          {project.description || "Sem descrição definida para este projeto."}
        </CardDescription>
        
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className="gap-1.5 py-1 px-3 bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-wider cursor-help"
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
