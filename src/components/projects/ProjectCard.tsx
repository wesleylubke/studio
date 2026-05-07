import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: any;
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
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
          
          <div onClick={(e) => e.stopPropagation()}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0 hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-2">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto
                    <span className="font-bold text-foreground"> "{project.name}"</span> e todas as tarefas associadas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(project.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
                  >
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
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
