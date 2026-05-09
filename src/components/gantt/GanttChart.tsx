
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
import { useUser } from '@/firebase';

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (id: string, updates: Partial<Task>) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (id: string) => void;
  onMoveTask?: (id: string, direction: 'up' | 'down') => void;
}

const DAY_WIDTH = 40;

/**
 * Parses YYYY-MM-DD string into a local Date object to avoid timezone shifts.
 */
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function GanttChart({ tasks, onTaskEdit, onTaskDelete, onMoveTask }: GanttChartProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  
  // Mouse drag-to-scroll state
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

    // Process tasks with consistent local parsing
    const taskDates = tasks.flatMap(t => [parseLocalDate(t.startDate), parseLocalDate(t.endDate)]);
    const minDate = min([...taskDates, today]);
    const maxDate = max([...taskDates, today]);

    // Extend range slightly for padding
    const startDate = startOfDay(addDays(minDate, -7));
    const endDate = startOfDay(addDays(maxDate, 14));
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    const todayOffset = differenceInDays(today, startDate) * DAY_WIDTH;

    const chartData = tasks.map(task => {
      const taskStart = startOfDay(parseLocalDate(task.startDate));
      const taskEnd = startOfDay(parseLocalDate(task.endDate));
      
      const startOffset = differenceInDays(taskStart, startDate) * DAY_WIDTH;
      // Duration includes the end day, so we add 1
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
      // Small delay to ensure container is fully rendered
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = Math.max(0, todayOffset - 200);
        }
      }, 100);
    }
  }, [todayOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    
    // Don't start drag if clicking interactive elements
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
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const getFriendlyName = (email: string) => {
    if (!email) return 'Usuário';
    if (user && email === user.email && user.displayName) return user.displayName;
    
    return email.split('@')[0]
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl sm:rounded-3xl border overflow-hidden shadow-2xl relative select-none">
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
          {/* Unified Sticky Header */}
          <div className="flex sticky top-0 z-30 border-b bg-card/95 backdrop-blur-md">
            <div className="w-28 sm:w-64 flex-shrink-0 border-r p-4 sm:p-6 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground sticky left-0 z-40 bg-card/95 backdrop-blur-md">
              Estrutura
            </div>
            
            <div className="flex" style={{ width: dateRange.length * DAY_WIDTH }}>
              {dateRange.map((date, idx) => {
                const isSatSun = isWeekend(date);
                const isTodayDate = isTodayFns(date);

                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex-shrink-0 text-center border-r h-16 sm:h-20 flex flex-col justify-center transition-colors relative",
                      isSatSun ? "bg-muted/30" : "bg-transparent",
                      isTodayDate && "bg-primary/5"
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className={cn(
                      "text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-wider mb-1",
                      isTodayDate && "text-primary"
                    )}>
                      {format(date, 'EEE')}
                    </span>
                    <span className={cn(
                      "text-xs sm:text-sm font-black",
                      isTodayDate && "text-primary bg-primary/10 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center mx-auto"
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
              <div key={task.id} className="flex h-14 sm:h-16 hover:bg-primary/5 transition-colors group">
                {/* Task Label Sidebar - Sticky */}
                <div className="w-28 sm:w-64 flex-shrink-0 border-r px-2 sm:px-4 flex items-center gap-1 sm:gap-3 sticky left-0 z-10 bg-card/95 backdrop-blur-md shadow-sm">
                  <div className="flex flex-col opacity-60 sm:opacity-40 sm:group-hover:opacity-100 transition-opacity">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-primary/20 rounded-md" 
                       disabled={index === 0}
                       onClick={(e) => {
                         e.stopPropagation();
                         onMoveTask?.(task.id, 'up');
                       }}
                     >
                       <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                     </Button>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-primary/20 rounded-md" 
                       disabled={index === chartData.length - 1}
                       onClick={(e) => {
                         e.stopPropagation();
                         onMoveTask?.(task.id, 'down');
                       }}
                     >
                       <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                     </Button>
                  </div>

                  <div className="flex-grow flex flex-col truncate min-w-0">
                     <span className="truncate text-xs sm:text-sm font-bold group-hover:text-primary transition-colors">{task.name}</span>
                     <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex-grow h-0.5 sm:h-1 bg-muted rounded-full overflow-hidden max-w-[30px] sm:max-w-[60px]">
                           <div className="h-full bg-primary" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-[8px] text-muted-foreground font-black">
                          {task.progress}%
                        </span>
                     </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="dropdown-trigger">
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-9 sm:w-9 opacity-40 group-hover:opacity-100 transition-opacity rounded-xl">
                        <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl p-2 min-w-[140px] sm:min-w-[160px]">
                      <DropdownMenuItem 
                        className="rounded-lg py-1.5 sm:py-2 font-bold text-xs sm:text-sm" 
                        onSelect={(e) => {
                          e.preventDefault();
                          setTimeout(() => onTaskEdit?.(task), 100);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="rounded-lg py-1.5 sm:py-2 font-bold text-destructive text-xs sm:text-sm" 
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
                            "absolute top-3 sm:top-4 h-7 sm:h-8 rounded-lg sm:rounded-xl shadow-xl transition-all hover:scale-[1.01] hover:brightness-110 cursor-pointer overflow-hidden border border-white/10 group/bar",
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
                          <div className="absolute inset-0 flex items-center px-2 sm:px-4 pointer-events-none">
                             <span className="text-[9px] sm:text-[10px] font-black text-white truncate drop-shadow-md">
                                {task.name}
                             </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={-4} className="p-3 sm:p-4 bg-card/95 backdrop-blur-xl border-2 rounded-xl sm:rounded-2xl shadow-2xl max-w-[240px] sm:max-w-xs z-[60]">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between gap-2 sm:gap-4">
                            <h4 className="font-black text-xs sm:text-sm text-primary uppercase tracking-tight truncate">{task.name}</h4>
                            <Badge className={cn("border-none px-1.5 py-0 font-black text-[8px] sm:text-[9px]", task.progress === 100 ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary")}>
                              {task.progress}%
                            </Badge>
                          </div>
                          
                          {task.description && (
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed bg-muted/30 p-1.5 sm:p-2 rounded-lg line-clamp-2">{task.description}</p>
                          )}

                          <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                            <span>{format(parseLocalDate(task.startDate), 'dd MMM')} — {format(parseLocalDate(task.endDate), 'dd MMM')}</span>
                          </div>

                          {task.assigneeEmails && task.assigneeEmails.length > 0 && (
                            <div className="pt-2 border-t border-white/5">
                               <div className="flex flex-wrap gap-1">
                                 {task.assigneeEmails.map(email => (
                                   <Badge key={email} variant="secondary" className="text-[7px] sm:text-[8px] px-1 py-0 bg-primary/10 text-primary border-none font-bold">
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
