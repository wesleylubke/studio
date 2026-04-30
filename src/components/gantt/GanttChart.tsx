
"use client";

import React, { useMemo, useRef, useEffect } from 'react';
import { format, differenceInDays, addDays, startOfDay, min, max, eachDayOfInterval, isWeekend } from 'date-fns';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, Users } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (id: string, updates: Partial<Task>) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (id: string) => void;
}

const DAY_WIDTH = 40;

export default function GanttChart({ tasks, onTaskEdit, onTaskDelete }: GanttChartProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { chartData, dateRange } = useMemo(() => {
    if (tasks.length === 0) {
      const today = startOfDay(new Date());
      return {
        chartData: [],
        dateRange: eachDayOfInterval({ start: today, end: addDays(today, 14) })
      };
    }

    const taskDates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
    const startDate = startOfDay(addDays(min(taskDates), -2));
    const endDate = startOfDay(addDays(max(taskDates), 14));
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const chartData = tasks.map(task => {
      const taskStart = startOfDay(new Date(task.startDate));
      const taskEnd = startOfDay(new Date(task.endDate));
      const startOffset = differenceInDays(taskStart, startDate) * DAY_WIDTH;
      const duration = (differenceInDays(taskEnd, taskStart) + 1) * DAY_WIDTH;

      return {
        ...task,
        startOffset,
        duration,
      };
    });

    return { chartData, dateRange };
  }, [tasks]);

  useEffect(() => {
    if (scrollContainerRef.current && tasks.length > 0) {
      const today = startOfDay(new Date());
      const todayIndex = dateRange.findIndex(d => format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
      if (todayIndex !== -1) {
        // Scroll horizontal container to today
        scrollContainerRef.current.scrollLeft = Math.max(0, (todayIndex * DAY_WIDTH) - 200);
      }
    }
  }, [dateRange, tasks.length]);

  const getFriendlyName = (email: string) => {
    return email.split('@')[0]
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border overflow-hidden shadow-2xl">
      <div 
        className="flex-grow overflow-auto custom-scrollbar relative" 
        ref={scrollContainerRef}
      >
        <div className="inline-flex flex-col min-w-full min-h-full">
          {/* Unified Timeline Header Row */}
          <div className="flex sticky top-0 z-30 border-b bg-muted/90 backdrop-blur-md">
            {/* Sticky Top-Left Corner */}
            <div className="w-24 sm:w-64 flex-shrink-0 border-r p-3 sm:p-4 font-semibold text-xs sm:text-sm text-muted-foreground sticky left-0 z-40 bg-card">
              <span>Task List</span>
            </div>
            
            {/* Horizontal Timeline Labels */}
            <div className="flex" style={{ width: dateRange.length * DAY_WIDTH }}>
              {dateRange.map((date, idx) => {
                const isSatSun = isWeekend(date);
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex-shrink-0 text-center border-r h-14 flex flex-col justify-center transition-colors relative",
                      isSatSun ? "bg-muted/10" : "bg-transparent",
                      isToday && "bg-primary/5"
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className={cn(
                      "text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase",
                      isToday && "text-primary font-bold"
                    )}>
                      {format(date, 'EEE').charAt(0)}
                    </span>
                    <span className={cn(
                      "text-[10px] sm:text-xs font-bold",
                      isToday && "text-primary"
                    )}>
                      {format(date, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Body Rows */}
          <div className="flex flex-col divide-y bg-card/50">
            {chartData.map((task) => (
              <div key={task.id} className="flex h-12 hover:bg-muted/10 transition-colors group">
                {/* Sticky Left Sidebar Cell */}
                <div className="w-24 sm:w-64 flex-shrink-0 border-r px-2 sm:px-4 flex items-center justify-between text-[10px] sm:text-sm font-medium sticky left-0 z-10 bg-card/95 backdrop-blur-sm">
                  <div className="flex flex-col truncate pr-1">
                     <span className="truncate">{task.name}</span>
                     <span className="text-[8px] sm:text-[10px] text-muted-foreground truncate capitalize">
                       {task.assigneeEmails && task.assigneeEmails.length > 0 
                         ? task.assigneeEmails.map(e => getFriendlyName(e)).join(', ') 
                         : `${task.progress}%`}
                     </span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 opacity-40 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onSelect={(e) => {
                          e.preventDefault(); // Critical fix for UI freeze
                          setTimeout(() => onTaskEdit?.(task), 100);
                        }}
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Edit Task
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onSelect={(e) => {
                          e.preventDefault();
                          onTaskDelete?.(task.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Grid Area - Moves with the single scroll container */}
                <div className="relative gantt-grid" style={{ width: dateRange.length * DAY_WIDTH }}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="absolute top-2.5 h-7 rounded-full shadow-lg transition-all hover:scale-[1.02] cursor-pointer overflow-hidden"
                          style={{ 
                            left: task.startOffset, 
                            width: task.duration,
                            background: 'hsl(var(--muted))'
                          }}
                        >
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${task.progress}%` }}
                          />
                          <div className="absolute inset-0 border border-primary/20 rounded-full" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-popover border p-3 rounded-lg shadow-xl max-w-[200px] z-[50]">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-xs truncate">{task.name}</p>
                            <Badge variant="outline" className="text-[8px] h-4">
                              {task.progress}%
                            </Badge>
                          </div>
                          {task.assigneeEmails && task.assigneeEmails.length > 0 && (
                            <div className="flex flex-col gap-1 border-t pt-1">
                               <div className="flex items-center gap-1.5">
                                 <Users className="w-3 h-3 text-primary" />
                                 <span className="text-[9px] text-primary font-bold">Assignees:</span>
                               </div>
                               <div className="flex flex-wrap gap-1">
                                 {task.assigneeEmails.map(email => (
                                   <Badge key={email} variant="secondary" className="text-[8px] px-1 h-3 capitalize">
                                     {getFriendlyName(email)}
                                   </Badge>
                                 ))}
                               </div>
                            </div>
                          )}
                          <div className="text-[9px] text-muted-foreground pt-1">
                            {format(new Date(task.startDate), 'MMM d')} - {format(new Date(task.endDate), 'MMM d')}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
