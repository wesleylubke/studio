
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, ArrowRight, Users } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
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

interface ProjectCardProps {
  project: any;
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const memberCount = project.members?.length || 0;

  return (
    <Card className="hover:shadow-xl transition-all border-muted/50 overflow-hidden group">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg sm:text-xl font-headline group-hover:text-primary transition-colors truncate pr-2">
            {project.name}
          </CardTitle>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto
                  <span className="font-bold text-foreground"> "{project.name}"</span> e todas as tarefas associadas a ele.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(project.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir Projeto
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <CardDescription className="line-clamp-2 text-xs sm:text-sm h-9 sm:h-10">
          {project.description || "No description provided."}
        </CardDescription>
      </CardHeader>
      <CardFooter className="bg-muted/30 py-4 px-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {project.createdAt ? format(new Date(project.createdAt), 'MMM d, yyyy') : 'Recently'}
          </span>
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <Users className="w-3.5 h-3.5" />
            {memberCount} {memberCount === 1 ? 'Membro' : 'Membros'}
          </span>
        </div>
        <Link href={`/projects/${project.id}`} passHref className="w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-auto h-9 sm:h-8 gap-1.5 px-4 shadow-md font-bold">
            Ver Gráfico <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
