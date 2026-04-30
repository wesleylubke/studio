
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Sparkles, Loader2, Save } from 'lucide-react';
import { suggestProjectTasks } from '@/ai/flows/suggest-project-tasks';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/types';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (project: { name: string; description: string; tasks?: any[] }) => void;
  initialProject?: Project;
}

export default function ProjectDialog({ open, onOpenChange, onSubmit, initialProject }: ProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAIPlanning, setIsAIPlanning] = useState(false);
  const { toast } = useToast();

  // Robust safety net for Radix UI pointer-events lock
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
        description: "Por favor, forneça uma descrição mais detalhada para que a IA possa sugerir tarefas relevantes.",
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
          title: "Sugestão concluída!",
          description: `${result.tasks.length} tarefas foram geradas com sucesso.`,
        });
        reset();
      }
    } catch (error: any) {
      console.error("AI Planning Error:", error);
      toast({
        title: "Erro no Assistente de IA",
        description: error.message || "Não foi possível gerar as tarefas. Verifique se a chave da API está configurada.",
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline font-bold">
            {initialProject ? 'Editar Projeto' : 'Lançar Novo Projeto'}
          </DialogTitle>
          <DialogDescription>
            {initialProject 
              ? 'Atualize os detalhes do seu projeto abaixo.' 
              : 'Defina a visão do seu projeto. Use a IA para gerar um cronograma automaticamente.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-semibold">Nome do Projeto</Label>
            <Input 
              id="name" 
              placeholder="Ex: Campanha de Marketing Q4" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm font-semibold">Descrição</Label>
            <Textarea 
              id="description" 
              placeholder="O que estamos construindo? Descreva para que a IA possa ajudar." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24 bg-background"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!initialProject && (
            <Button 
              variant="outline" 
              onClick={handleAIPlan} 
              disabled={isAIPlanning || !name || !description}
              className="flex-1 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              {isAIPlanning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Assistente de IA
            </Button>
          )}
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90" 
            onClick={handleCreate}
            disabled={!name}
          >
            {initialProject ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 mr-2" />
                Criar Manualmente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
