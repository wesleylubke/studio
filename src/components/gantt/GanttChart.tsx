"use client";

import React, { useMemo, useRef, useEffect } from 'react';
import { format, differenceInDays, addDays, startOfDay, min, max, eachDayOfInterval, isWeekend, isToday as isTodayFns } from 'date-fns';
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
import { MoreVertical, Edit, Trash2, Users, ChevronUp, ChevronDown, Calendar } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (id: string, updates: Partial<Task>) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (id: string) => void;
  onMoveTask?: (id: string, direction: 'up' | 'down') => void;
}

const DAY_WIDTH = 40;

export default function GanttChart({ tasks, onTaskEdit, onTaskDelete, onMoveTask }: GanttChartProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { chartData, dateRange, todayOffset } = useMemo(() => {
    const today = startOfDay(new Date());
    
    if (tasks.length === 0) {
      const dates = eachDayOfInterval({ start: today, end: addDays(today, 21) });
      return {
        chartData: [],
        dateRange: dates,
        todayOffset: 0
      };
    }

    const taskDates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
    const startDate = startOfDay(addDays(min([...taskDates, today]), -7));
    const endDate = startOfDay(addDays(max([...taskDates, today]), 14));
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    const todayOffset = differenceInDays(today, startDate) * DAY_WIDTH;

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

    return { chartData, dateRange, todayOffset };
  }, [tasks]);

  useEffect(() => {
    if (scrollContainerRef.current && todayOffset > 0) {
      scrollContainerRef.current.scrollLeft = todayOffset - 300;
    }
  }, [todayOffset]);

  const getFriendlyName = (email: string) => {
    if (!email) return '';
    return email.split('@')[0]
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border overflow-hidden shadow-2xl relative">
      <div 
        className="flex-grow overflow-auto custom-scrollbar relative" 
        ref={scrollContainerRef}
      >
        <div className="inline-flex flex-col min-w-full min-h-full">
          {/* Timeline Header */}
          <div className="flex sticky top-0 z-30 border-b bg-card/95 backdrop-blur-sm">
            <div className="w-32 sm:w-64 flex-shrink-0 border-r p-4 font-bold text-xs uppercase tracking-widest text-muted-foreground sticky left-0 z-40 bg-card">
              Tarefas
            </div>
            
            <div className="flex" style={{ width: dateRange.length * DAY_WIDTH }}>
              {dateRange.map((date, idx) => {
                const isSatSun = isWeekend(date);
                const isTodayDate = isTodayFns(date);

                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex-shrink-0 text-center border-r h-16 flex flex-col justify-center transition-colors relative",
                      isSatSun ? "bg-muted/30" : "bg-transparent",
                      isTodayDate && "bg-primary/5"
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className={cn(
                      "text-[10px] font-bold text-muted-foreground uppercase",
                      isTodayDate && "text-primary"
                    )}>
                      {format(date, 'EEE')}
                    </span>
                    <span className={cn(
                      "text-xs font-black",
                      isTodayDate && "text-primary"
                    )}>
                      {format(date, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Content */}
          <div className="flex flex-col divide-y bg-card/50">
            {chartData.map((task, index) => (
              <div key={task.id} className="flex h-14 hover:bg-muted/10 transition-colors group">
                {/* Task Label Sidebar */}
                <div className="w-32 sm:w-64 flex-shrink-0 border-r px-4 flex items-center gap-3 sticky left-0 z-10 bg-card/95 backdrop-blur-sm shadow-md">
                  <div className="flex flex-col">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-5 w-5 hover:bg-muted" 
                       disabled={index === 0}
                       onClick={() => onMoveTask?.(task.id, 'up')}
                     >
                       <ChevronUp className="w-4 h-4" />
                     </Button>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-5 w-5 hover:bg-muted" 
                       disabled={index === chartData.length - 1}
                       onClick={() => onMoveTask?.(task.id, 'down')}
                     >
                       <ChevronDown className="w-4 h-4" />
                     </Button>
                  </div>

                  <div className="flex-grow flex flex-col truncate min-w-0">
                     <span className="truncate text-sm font-bold">{task.name}</span>
                     <span className="text-[10px] text-muted-foreground font-medium">
                       {task.progress}% concluído
                     </span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-20 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(() => onTaskEdit?.(task), 100);
                      }}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onSelect={(e) => {
                          e.preventDefault();
                          onTaskDelete?.(task.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Bars Area */}
                <div className="relative gantt-grid" style={{ width: dateRange.length * DAY_WIDTH }}>
                  {/* Today Indicator Line */}
                  <div className="today-line" style={{ left: todayOffset }} />
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="absolute top-3.5 h-7 rounded-lg shadow-lg transition-all hover:scale-[1.01] hover:brightness-110 cursor-pointer overflow-hidden border border-white/5"
                          style={{ 
                            left: task.startOffset, 
                            width: task.duration,
                            background: 'hsl(var(--muted))'
                          }}
                        >
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              task.progress === 100 ? "bg-accent" : "bg-primary"
                            )}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="p-4 bg-popover border-2 rounded-xl shadow-2xl max-w-xs z-[60]">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="font-bold text-sm leading-tight">{task.name}</h4>
                            <Badge className={cn(task.progress === 100 ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary")}>
                              {task.progress}%
                            </Badge>
                          </div>
                          
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                          )}

                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(task.startDate), 'dd/MM')} — {format(new Date(task.endDate), 'dd/MM')}</span>
                          </div>

                          {task.assigneeEmails && task.assigneeEmails.length > 0 && (
                            <div className="pt-2 border-t border-muted">
                               <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-primary uppercase">
                                 <Users className="w-3 h-3" />
                                 <span>Responsáveis</span>
                               </div>
                               <div className="flex flex-wrap gap-1">
                                 {task.assigneeEmails.map(email => (
                                   <Badge key={email} variant="secondary" className="text-[9px] px-1.5 py-0 capitalize bg-muted-foreground/10">
                                     {getFriendlyName(email)}
                                   </Badge>
                                 ))}
                               </div>
                            </div>
                          )}
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