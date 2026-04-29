import { Project } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, taskCount, onDelete }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-xl transition-all border-muted/50 overflow-hidden group">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors truncate pr-4">
            {project.name}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-destructive h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              onDelete(project.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription className="line-clamp-2 h-10">
          {project.description || "No description provided."}
        </CardDescription>
      </CardHeader>
      <CardFooter className="bg-muted/30 py-3 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(project.createdAt), 'MMM d, yyyy')}
          </span>
          <span className="font-bold text-foreground">
            {taskCount} {taskCount === 1 ? 'Task' : 'Tasks'}
          </span>
        </div>
        <Link href={`/projects/${project.id}`} passHref>
          <Button size="sm" className="h-8 gap-1.5 px-3">
            View Chart <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}