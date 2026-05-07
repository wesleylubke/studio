import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: any;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const memberCount = project.members?.length || 0;

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`);
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
           <Badge variant="secondary" className="gap-1.5 py-1 px-3 bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-wider">
             <Users className="w-3 h-3" />
             {memberCount} {memberCount === 1 ? 'Membro' : 'Membros'}
           </Badge>
           <Badge variant="outline" className="gap-1.5 py-1 px-3 border-muted-foreground/20 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
             <Clock className="w-3 h-3" />
             {project.createdAt ? format(new Date(project.createdAt), 'dd/MM/yy') : 'Recente'}
           </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
