"use client";

import React, { useMemo, useRef, useEffect, useState } from 'react';
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
  
  // Estado para controle de arraste
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    
    // Não inicia arraste se clicar em botões ou elementos interativos
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.dropdown-trigger')) return;

    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiplicador para sensibilidade
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const getFriendlyName = (email: string) => {
    if (!email) return '';
    return email.split('@')[0]
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-3xl border overflow-hidden shadow-2xl relative select-none">
      <div 
        className={cn(
          "flex-grow overflow-auto custom-scrollbar relative",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div className="inline-flex flex-col min-w-full min-h-full">
          {/* Timeline Header */}
          <div className="flex sticky top-0 z-30 border-b bg-card/95 backdrop-blur-md">
            <div className="w-32 sm:w-64 flex-shrink-0 border-r p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground sticky left-0 z-40 bg-card/95 backdrop-blur-md">
              Estrutura de Tarefas
            </div>
            
            <div className="flex" style={{ width: dateRange.length * DAY_WIDTH }}>
              {dateRange.map((date, idx) => {
                const isSatSun = isWeekend(date);
                const isTodayDate = isTodayFns(date);

                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex-shrink-0 text-center border-r h-20 flex flex-col justify-center transition-colors relative",
                      isSatSun ? "bg-muted/30" : "bg-transparent",
                      isTodayDate && "bg-primary/5"
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className={cn(
                      "text-[9px] font-black text-muted-foreground uppercase tracking-wider mb-1",
                      isTodayDate && "text-primary"
                    )}>
                      {format(date, 'EEE')}
                    </span>
                    <span className={cn(
                      "text-sm font-black",
                      isTodayDate && "text-primary bg-primary/10 rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                    )}>
                      {format(date, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Content */}
          <div className="flex flex-col divide-y divide-white/5 bg-card/50">
            {chartData.map((task, index) => (
              <div key={task.id} className="flex h-16 hover:bg-primary/5 transition-colors group">
                {/* Task Label Sidebar */}
                <div className="w-32 sm:w-64 flex-shrink-0 border-r px-4 flex items-center gap-3 sticky left-0 z-10 bg-card/95 backdrop-blur-md shadow-xl">
                  <div className="flex flex-col opacity-20 group-hover:opacity-100 transition-opacity">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 hover:bg-primary/20 rounded-md" 
                       disabled={index === 0}
                       onClick={(e) => {
                         e.stopPropagation();
                         onMoveTask?.(task.id, 'up');
                       }}
                     >
                       <ChevronUp className="w-4 h-4" />
                     </Button>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 hover:bg-primary/20 rounded-md" 
                       disabled={index === chartData.length - 1}
                       onClick={(e) => {
                         e.stopPropagation();
                         onMoveTask?.(task.id, 'down');
                       }}
                     >
                       <ChevronDown className="w-4 h-4" />
                     </Button>
                  </div>

                  <div className="flex-grow flex flex-col truncate min-w-0">
                     <span className="truncate text-sm font-bold group-hover:text-primary transition-colors">{task.name}</span>
                     <div className="flex items-center gap-2">
                        <div className="flex-grow h-1 bg-muted rounded-full overflow-hidden max-w-[60px]">
                           <div className="h-full bg-primary" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground font-black">
                          {task.progress}%
                        </span>
                     </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="dropdown-trigger">
                      <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl p-2 min-w-[160px]">
                      <DropdownMenuItem 
                        className="rounded-lg py-2 font-bold" 
                        onSelect={(e) => {
                          e.preventDefault();
                          setTimeout(() => onTaskEdit?.(task), 100);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="rounded-lg py-2 font-bold text-destructive" 
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
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "absolute top-4 h-8 rounded-xl shadow-xl transition-all hover:scale-[1.02] hover:brightness-110 cursor-pointer overflow-hidden border border-white/10 group/bar",
                            task.progress === 100 ? "ring-1 ring-accent/30" : "ring-1 ring-primary/30"
                          )}
                          style={{ 
                            left: task.startOffset, 
                            width: task.duration,
                            background: 'hsl(var(--muted)/0.5)'
                          }}
                          onClick={() => onTaskEdit?.(task)}
                        >
                          <div 
                            className={cn(
                              "h-full transition-all duration-700 ease-out flex items-center px-3",
                              task.progress === 100 ? "bg-accent/80" : "bg-primary/80"
                            )}
                            style={{ width: `${task.progress}%` }}
                          />
                          <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                             <span className="text-[10px] font-black text-white truncate drop-shadow-md">
                                {task.name}
                             </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4} className="p-5 bg-card/95 backdrop-blur-xl border-2 rounded-2xl shadow-2xl max-w-xs z-[60]">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="font-black text-sm leading-tight text-primary uppercase tracking-tight">{task.name}</h4>
                            <Badge className={cn("border-none px-3 py-1 font-black", task.progress === 100 ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary")}>
                              {task.progress}%
                            </Badge>
                          </div>
                          
                          {task.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 bg-muted/30 p-2 rounded-lg">{task.description}</p>
                          )}

                          <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <span>{format(new Date(task.startDate), 'dd MMM')} — {format(new Date(task.endDate), 'dd MMM')}</span>
                          </div>

                          {task.assigneeEmails && task.assigneeEmails.length > 0 && (
                            <div className="pt-3 border-t border-white/10">
                               <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-primary uppercase tracking-[0.1em]">
                                 <Users className="w-3.5 h-3.5" />
                                 <span>Responsáveis</span>
                               </div>
                               <div className="flex flex-wrap gap-1.5">
                                 {task.assigneeEmails.map(email => (
                                   <Badge key={email} variant="secondary" className="text-[9px] px-2 py-0.5 capitalize bg-primary/10 text-primary border-none font-bold">
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