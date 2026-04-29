
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
import { MoreVertical, Edit, Trash2, User } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (id: string, updates: Partial<Task>) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (id: string) => void;
}

const DAY_WIDTH = 40;
const ROW_HEIGHT = 48;

export default function GanttChart({ tasks, onTaskEdit, onTaskDelete }: GanttChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

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
    const endDate = startOfDay(addDays(max(taskDates), 7));
    
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
    if (chartRef.current && tasks.length > 0) {
      const today = startOfDay(new Date());
      const todayIndex = dateRange.findIndex(d => format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
      if (todayIndex !== -1) {
        chartRef.current.scrollLeft = Math.max(0, (todayIndex * DAY_WIDTH) - 100);
      }
    }
  }, [dateRange, tasks.length]);

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border overflow-hidden shadow-2xl">
      <div className="flex border-b bg-muted/30 backdrop-blur-sm sticky top-0 z-20">
        <div className="w-24 sm:w-64 flex-shrink-0 border-r p-3 sm:p-4 font-semibold text-xs sm:text-sm text-muted-foreground flex items-center justify-between">
          <span>Task</span>
        </div>
        
        <div className="overflow-x-auto hide-scrollbar flex-grow" ref={chartRef}>
          <div className="flex" style={{ width: dateRange.length * DAY_WIDTH }}>
            {dateRange.map((date, idx) => {
              const isFirstOfMonth = format(date, 'd') === '1';
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
                  {isFirstOfMonth && (
                    <span className="absolute -top-1 left-1 text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-wider">
                      {format(date, 'MMM')}
                    </span>
                  )}
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
      </div>

      <div className="flex-grow overflow-auto custom-scrollbar">
        <div className="flex min-h-full">
          {/* Sidebar Task List */}
          <div className="w-24 sm:w-64 flex-shrink-0 border-r divide-y bg-card/50">
            {chartData.map(task => (
              <div 
                key={task.id} 
                className="h-12 px-2 sm:px-4 flex items-center justify-between text-[10px] sm:text-sm font-medium hover:bg-muted/50 transition-colors group"
              >
                <div className="flex flex-col truncate pr-1">
                   <span className="truncate">{task.name}</span>
                   <span className="text-[8px] sm:text-[10px] text-muted-foreground truncate">
                     {task.assigneeEmail ? task.assigneeEmail.split('@')[0] : `${task.progress}%`}
                   </span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 opacity-40 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onTaskEdit?.(task)}>
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive" 
                      onClick={() => onTaskDelete?.(task.id)}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Delete Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="h-12 px-4 flex items-center text-[10px] sm:text-xs italic text-muted-foreground">
                No tasks
              </div>
            )}
          </div>

          {/* Timeline View */}
          <div 
            className="flex-grow gantt-grid relative min-h-full" 
            style={{ width: dateRange.length * DAY_WIDTH }}
          >
            {chartData.map((task, i) => (
              <div key={task.id} className="h-12 relative border-b w-full hover:bg-muted/20 transition-colors">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="absolute top-2.5 h-7 rounded-full shadow-lg transition-all hover:scale-[1.02] cursor-pointer overflow-hidden group"
                        style={{ 
                          left: task.startOffset, 
                          width: task.duration,
                          background: 'hsl(var(--muted))'
                        }}
                      >
                        {/* Progress Bar Background */}
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${task.progress}%` }}
                        />
                        {/* Accent highlight */}
                        <div className="absolute inset-0 border border-primary/20 rounded-full" />
                        
                        {/* Task info inside if wide enough */}
                        {task.duration > 60 && (
                          <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
                            <span className="text-[8px] sm:text-[9px] font-bold text-white truncate drop-shadow-sm">
                              {task.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-popover border text-foreground p-2 sm:p-3 rounded-lg shadow-xl max-w-[200px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-xs truncate">{task.name}</p>
                          <Badge variant="outline" className="text-[8px] h-4">
                            {task.progress}%
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{task.description}</p>
                        {task.assigneeEmail && (
                          <div className="flex items-center gap-1.5 py-1">
                            <User className="w-3 h-3 text-primary" />
                            <span className="text-[9px] text-primary font-medium truncate">{task.assigneeEmail}</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-4 pt-1 border-t mt-1">
                          <span className="text-[9px] text-muted-foreground">
                            {format(new Date(task.startDate), 'MMM d')} - {format(new Date(task.endDate), 'MMM d')}
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
            
            {/* Today Line */}
            {dateRange.map((date, idx) => {
               const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
               if (!isToday) return null;
               return (
                 <div 
                   key="today-line" 
                   className="absolute top-0 bottom-0 w-[2px] bg-primary z-10 pointer-events-none opacity-40"
                   style={{ left: idx * DAY_WIDTH + (DAY_WIDTH / 2) }}
                 />
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
