"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Sparkles, Loader2, Save, Trash2 } from 'lucide-react';
import { suggestProjectTasks } from '@/ai/flows/suggest-project-tasks';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/types';
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
  onSubmit: (project: { name: string; description: string; tasks?: any[] }) => void;
  onDelete?: (id: string) => void;
  initialProject?: Project;
}

export default function ProjectDialog({ open, onOpenChange, onSubmit, onDelete, initialProject }: ProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAIPlanning, setIsAIPlanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [initialProject, open]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    onSubmit({ name, description });
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
        onSubmit({ name, description, tasks: result.tasks });
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
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black text-left">
            {initialProject ? 'Editar Projeto' : 'Lançar Novo Projeto'}
          </DialogTitle>
          <DialogDescription className="text-base text-left">
            {initialProject 
              ? 'Mantenha os detalhes do seu projeto atualizados.' 
              : 'Defina a visão do projeto e deixe nossa IA estruturar os primeiros passos.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nome do Projeto</Label>
            <Input 
              id="name" 
              placeholder="Ex: Campanha de Marketing Digital" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-base"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Descrição Estratégica</Label>
            <Textarea 
              id="description" 
              placeholder="Descreva os objetivos, público e entregáveis do projeto..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-32 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-base resize-none"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-3 mt-8">
          {initialProject && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex-1 h-12 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground font-bold">
                  <Trash2 className="w-5 h-5 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-2">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto e todas as suas tarefas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(initialProject.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
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
              className="flex-1 h-12 rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground font-bold shadow-lg"
            >
              {isAIPlanning ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              AI Planner
            </Button>
          )}
          <Button 
            className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 font-bold shadow-lg" 
            onClick={handleCreate}
            disabled={!name}
          >
            {initialProject ? (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5 mr-2" />
                Criar Projeto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
