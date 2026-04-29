"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Task } from '@/types';
import { format } from 'date-fns';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Omit<Task, 'id' | 'projectId'>) => void;
  initialTask?: Task;
}

export default function TaskDialog({ open, onOpenChange, onSubmit, initialTask }: TaskDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (initialTask) {
      setName(initialTask.name);
      setDescription(initialTask.description);
      setStartDate(initialTask.startDate);
      setEndDate(initialTask.endDate);
      setProgress(initialTask.progress);
    } else {
      setName('');
      setDescription('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setEndDate(format(new Date(), 'yyyy-MM-dd'));
      setProgress(0);
    }
  }, [initialTask, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name, description, startDate, endDate, progress });
    onOpenChange(false);
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-primary" onClick={handleSubmit}>
            {initialTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}