
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Task } from '@/types';
import { format } from 'date-fns';
import { Users, Calendar as CalendarIcon, FileText } from 'lucide-react';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Omit<Task, 'id' | 'projectId'>) => void;
  initialTask?: Task;
  projectMembers?: string[];
}

export default function TaskDialog({ open, onOpenChange, onSubmit, initialTask, projectMembers = [] }: TaskDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [progress, setProgress] = useState(0);
  const [assigneeEmails, setAssigneeEmails] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = '';
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (initialTask) {
        setName(initialTask.name || '');
        setDescription(initialTask.description || '');
        setStartDate(initialTask.startDate || format(new Date(), 'yyyy-MM-dd'));
        setEndDate(initialTask.endDate || format(new Date(), 'yyyy-MM-dd'));
        setProgress(initialTask.progress || 0);
        setAssigneeEmails(initialTask.assigneeEmails || []);
      } else {
        setName('');
        setDescription('');
        setStartDate(format(new Date(), 'yyyy-MM-dd'));
        setEndDate(format(new Date(), 'yyyy-MM-dd'));
        setProgress(0);
        setAssigneeEmails([]);
      }
    }
  }, [initialTask, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    onSubmit({ 
      name, 
      description, 
      startDate, 
      endDate, 
      progress,
      assigneeEmails: assigneeEmails || []
    });
  };

  const toggleAssignee = (email: string) => {
    setAssigneeEmails(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email) 
        : [...prev, email]
    );
  };

  const getFriendlyName = (email: string) => {
    return email.split('@')[0]
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:max-w-[425px] rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl sm:text-2xl font-black text-left">
            {initialTask ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="task-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome da Tarefa</Label>
            <Input 
              id="task-name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Definir arquitetura do app"
              className="h-10 sm:h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-sm"
            />
          </div>
          
          <div className="grid gap-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="w-3 h-3" />
              Responsáveis
            </Label>
            <ScrollArea className="h-[120px] sm:h-[140px] rounded-xl border-none bg-muted/30 p-2">
              <div className="space-y-1">
                {projectMembers.map((member) => (
                  <div 
                    key={member} 
                    className="flex items-center space-x-2 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    onClick={() => toggleAssignee(member)}
                  >
                    <Checkbox 
                      id={`member-${member}`} 
                      checked={assigneeEmails.includes(member)}
                      onCheckedChange={() => toggleAssignee(member)}
                      className="rounded"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold leading-none truncate">{getFriendlyName(member)}</span>
                      <span className="text-[9px] text-muted-foreground truncate">{member}</span>
                    </div>
                  </div>
                ))}
                {projectMembers.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic p-4 text-center">Nenhum membro disponível</p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="start-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="w-3 h-3" /> Início
              </Label>
              <Input 
                id="start-date" 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 sm:h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-xs"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="end-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="w-3 h-3" /> Fim
              </Label>
              <Input 
                id="end-date" 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 sm:h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-xs"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progresso</Label>
              <span className="text-sm font-black text-primary">{progress}%</span>
            </div>
            <Slider 
              value={[progress]} 
              max={100} 
              step={1} 
              onValueChange={(val) => setProgress(val[0])}
              className="py-1"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="task-desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Notas
            </Label>
            <Input 
              id="task-desc" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              className="h-10 sm:h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-sm"
            />
          </div>
        </div>
        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" className="rounded-full h-10 sm:h-12 font-bold px-6" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-primary rounded-full h-10 sm:h-12 font-bold px-8 shadow-xl" onClick={handleSubmit}>
            {initialTask ? 'Salvar Alterações' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
