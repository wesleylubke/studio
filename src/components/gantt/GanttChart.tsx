"use client";

import React, { useMemo, useRef, useEffect } from 'react';
import { format, differenceInDays, addDays, startOfDay, min, max, eachDayOfInterval, isWeekend } from 'date-fns';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (id: string, updates: Partial<Task>) => void;
}

const DAY_WIDTH = 40;
const ROW_HEIGHT = 48;

export default function GanttChart({ tasks }: GanttChartProps) {
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
      // Find today and scroll to it if it exists in range
      const today = startOfDay(new Date());
      const todayIndex = dateRange.findIndex(d => format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
      if (todayIndex !== -1) {
        chartRef.current.scrollLeft = Math.max(0, (todayIndex * DAY_WIDTH) - 200);
      }
    }
  }, [dateRange, tasks.length]);

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border overflow-hidden shadow-2xl">
      <div className="flex border-b bg-muted/30 backdrop-blur-sm sticky top-0 z-20">
        <div className="w-64 flex-shrink-0 border-r p-4 font-semibold text-sm text-muted-foreground flex items-center justify-between">
          <span>Task Name</span>
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
                    <span className="absolute -top-1 left-1 text-[10px] font-bold text-primary uppercase tracking-wider">
                      {format(date, 'MMM')}
                    </span>
                  )}
                  <span className={cn(
                    "text-[10px] font-medium text-muted-foreground uppercase",
                    isToday && "text-primary font-bold"
                  )}>
                    {format(date, 'EEE').charAt(0)}
                  </span>
                  <span className={cn(
                    "text-xs font-bold",
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
        <div className="flex">
          {/* Sidebar Task List */}
          <div className="w-64 flex-shrink-0 border-r divide-y bg-card/50">
            {chartData.map(task => (
              <div 
                key={task.id} 
                className="h-12 px-4 flex items-center text-sm font-medium hover:bg-muted/50 transition-colors group"
              >
                <div className="flex flex-col truncate">
                   <span className="truncate">{task.name}</span>
                   <span className="text-[10px] text-muted-foreground">{task.progress}% complete</span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="h-12 px-4 flex items-center text-xs italic text-muted-foreground">
                No tasks added yet
              </div>
            )}
          </div>

          {/* Timeline View */}
          <div 
            className="flex-grow gantt-grid relative" 
            style={{ width: dateRange.length * DAY_WIDTH }}
          >
            {chartData.map((task, i) => (
              <div key={task.id} className="h-12 relative border-b w-full hover:bg-muted/20 transition-colors">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="absolute top-2 h-8 rounded-full shadow-lg transition-all hover:scale-[1.02] cursor-pointer overflow-hidden group"
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
                        <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                        
                        {/* Task name inside if wide enough */}
                        {task.duration > 80 && (
                          <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                            <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">
                              {task.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-popover border text-foreground p-3 rounded-lg shadow-xl">
                      <div className="space-y-1">
                        <p className="font-bold">{task.name}</p>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                        <div className="flex justify-between gap-4 pt-1">
                          <span className="text-[10px] text-primary">{format(new Date(task.startDate), 'MMM d')} - {format(new Date(task.endDate), 'MMM d')}</span>
                          <span className="text-[10px] font-bold">{task.progress}% Done</span>
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
                   className="absolute top-0 bottom-0 w-px bg-primary z-10 pointer-events-none opacity-50"
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