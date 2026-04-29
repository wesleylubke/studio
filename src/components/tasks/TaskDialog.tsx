
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
import { User, Users } from 'lucide-react';

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
      assigneeEmails
    });
  };

  const toggleAssignee = (email: string) => {
    setAssigneeEmails(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email) 
        : [...prev, email]
    );
  };

  const getDisplayName = (email: string) => {
    return email.split('@')[0].replace(/[._]/g, ' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline font-bold">
            {initialTask ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-name" className="text-sm font-semibold">Task Name</Label>
            <Input 
              id="task-name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Review project requirements"
              className="bg-background"
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Assignees
            </Label>
            <ScrollArea className="h-[120px] rounded-md border p-2 bg-background/50">
              <div className="space-y-2">
                {projectMembers.map((member) => (
                  <div key={member} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded transition-colors">
                    <Checkbox 
                      id={`member-${member}`} 
                      checked={assigneeEmails.includes(member)}
                      onCheckedChange={() => toggleAssignee(member)}
                    />
                    <label 
                      htmlFor={`member-${member}`}
                      className="text-xs font-medium leading-none cursor-pointer capitalize"
                    >
                      {getDisplayName(member)}
                      <span className="block text-[10px] text-muted-foreground font-normal">{member}</span>
                    </label>
                  </div>
                ))}
                {projectMembers.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic p-2 text-center">No members available</p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date" className="text-sm font-semibold">Start Date</Label>
              <Input 
                id="start-date" 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date" className="text-sm font-semibold">End Date</Label>
              <Input 
                id="end-date" 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Progress Percentage</Label>
              <span className="text-sm font-bold text-primary">{progress}%</span>
            </div>
            <Slider 
              value={[progress]} 
              max={100} 
              step={1} 
              onValueChange={(val) => setProgress(val[0])}
              className="py-2"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-desc" className="text-sm font-semibold">Notes (Optional)</Label>
            <Input 
              id="task-desc" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              className="bg-background"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-primary" onClick={handleSubmit}>
            {initialTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
