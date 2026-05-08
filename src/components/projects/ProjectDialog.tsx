
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Sparkles, Loader2, Save, Trash2 } from 'lucide-react';
import { suggestProjectTasks } from '@/ai/flows/suggest-project-tasks';
import { useToast } from '@/hooks/use-toast';
import { Project, ProjectStatus } from '@/types';
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

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (project: { name: string; description: string; status: ProjectStatus; tasks?: any[] }) => void;
  onDelete?: (id: string) => void;
  initialProject?: Project;
}

export default function ProjectDialog({ open, onOpenChange, onSubmit, onDelete, initialProject }: ProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ongoing');
  const [isAIPlanning, setIsAIPlanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = '';
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description);
      setStatus(initialProject.status || 'ongoing');
    } else {
      setName('');
      setDescription('');
      setStatus('ongoing');
    }
  }, [initialProject, open]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    onSubmit({ name, description, status });
    reset();
  };

  const handleAIPlan = async () => {
    if (!description.trim() || description.length < 10) {
      toast({
        title: "Mais detalhes necessários",
        description: "Descreva o projeto detalhadamente para que a IA possa gerar tarefas precisas.",
        variant: "destructive"
      });
      return;
    }

    setIsAIPlanning(true);
    try {
      const result = await suggestProjectTasks({ projectDescription: description });
      if (result && result.tasks) {
        onSubmit({ name, description, status, tasks: result.tasks });
        toast({
          title: "Inteligência Artificial Ativada!",
          description: `Roadmap sugerido com ${result.tasks.length} tarefas estratégicas.`,
        });
        reset();
      }
    } catch (error: any) {
      console.error("AI Planning Error:", error);
      toast({
        title: "Erro no Assistente",
        description: "Não foi possível conectar com a IA. Verifique sua chave de API.",
        variant: "destructive"
      });
    } finally {
      setIsAIPlanning(false);
    }
  };

  const reset = () => {
    if (!initialProject) {
      setName('');
      setDescription('');
      setStatus('ongoing');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:max-w-[480px] rounded-2xl sm:rounded-3xl p-6 sm:p-8">
        <DialogHeader className="mb-4 text-left">
          <DialogTitle className="text-xl sm:text-2xl font-black">
            {initialProject ? 'Editar Projeto' : 'Lançar Novo Projeto'}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {initialProject 
              ? 'Mantenha os detalhes do seu projeto atualizados.' 
              : 'Defina a visão do projeto e deixe nossa IA estruturar os primeiros passos.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:gap-6 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">Nome do Projeto</Label>
            <Input 
              id="name" 
              placeholder="Ex: Campanha de Marketing Digital" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 sm:h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-sm sm:text-base"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status" className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">Status do Projeto</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as ProjectStatus)}>
              <SelectTrigger className="h-10 sm:h-12 rounded-xl bg-muted/30 border-none focus:ring-primary text-sm sm:text-base">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ongoing">Em Andamento</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="finished">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">Descrição Estratégica</Label>
            <Textarea 
              id="description" 
              placeholder="Descreva os objetivos, público e entregáveis do projeto..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24 sm:h-32 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-sm sm:text-base resize-none"
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
          {initialProject && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full sm:flex-1 h-10 sm:h-12 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground font-bold text-xs sm:text-sm">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95%] rounded-2xl border-2">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg sm:text-xl font-bold">Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm sm:text-base">
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto e todas as suas tarefas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="rounded-full w-full sm:w-auto">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(initialProject.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full w-full sm:w-auto"
                  >
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {!initialProject && (
            <Button 
              variant="outline" 
              onClick={handleAIPlan} 
              disabled={isAIPlanning || !name || !description}
              className="w-full sm:flex-1 h-10 sm:h-12 rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground font-bold shadow-lg text-xs sm:text-sm"
            >
              {isAIPlanning ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              )}
              AI Planner
            </Button>
          )}
          <Button 
            className="w-full sm:flex-1 h-10 sm:h-12 rounded-full bg-primary hover:bg-primary/90 font-bold shadow-lg text-xs sm:text-sm" 
            onClick={handleCreate}
            disabled={!name}
          >
            {initialProject ? (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Salvar
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Criar Projeto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
