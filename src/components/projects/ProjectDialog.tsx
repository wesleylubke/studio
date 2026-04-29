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
    if (!description.trim()) {
      toast({
        title: "Project Description Required",
        description: "Please provide a description so the AI can suggest tasks.",
        variant: "destructive"
      });
      return;
    }

    setIsAIPlanning(true);
    try {
      const result = await suggestProjectTasks({ projectDescription: description });
      onSubmit({ name, description, tasks: result.tasks });
      reset();
    } catch (error) {
      toast({
        title: "AI Suggestion Failed",
        description: "Could not generate tasks. Please try manually.",
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
            {initialProject ? 'Edit Project' : 'Launch New Project'}
          </DialogTitle>
          <DialogDescription>
            {initialProject 
              ? 'Update your project details below.' 
              : 'Define your project vision. Use the AI tool to auto-generate a timeline.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-semibold">Project Name</Label>
            <Input 
              id="name" 
              placeholder="e.g., Q4 Marketing Campaign" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
            <Textarea 
              id="description" 
              placeholder="What are we building?" 
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
              disabled={isAIPlanning || !name}
              className="flex-1 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              {isAIPlanning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              AI Task Assistant
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
                Save Changes
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
