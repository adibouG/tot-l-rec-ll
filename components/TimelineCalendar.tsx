import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Reminder, ReminderType } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw, Clock, AlignLeft } from 'lucide-react';

interface TimelineCalendarProps {
  reminders: Reminder[];
  onSelectReminder: (id: string) => void;
  onDateClick: (date: Date) => void;
}

type ViewMode = 'month' | 'week';

const TimelineCalendar: React.FC<TimelineCalendarProps> = ({ reminders, onSelectReminder, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [hoveredReminderId, setHoveredReminderId] = useState<string | null>(null);

  // --- Logic ---

  const resetView = () => {
    // Advanced Reset: Find the range of reminders and try to fit them or default to today
    if (reminders.length > 0 && reminders.some(r => new Date(r.date) > new Date())) {
        // If there are future reminders, jump to the nearest one
        const upcoming = reminders
            .filter(r => new Date(r.date) >= new Date())
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        
        if (upcoming) {
            setCurrentDate(new Date(upcoming.date));
        } else {
             setCurrentDate(new Date());
        }
    } else {
        setCurrentDate(new Date());
    }
    setViewMode('month');
  };

  const handleNav = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -1 : 1;
    if (viewMode === 'month') {
        setCurrentDate(d3.timeMonth.offset(currentDate, offset));
    } else {
        setCurrentDate(d3.timeWeek.offset(currentDate, offset));
    }
  };

  // Generate days to render based on view mode
  const getDays = () => {
    const start = viewMode === 'month' 
        ? d3.timeMonth.floor(currentDate) 
        : d3.timeWeek.floor(currentDate);
    
    const end = viewMode === 'month'
        ? d3.timeMonth.offset(start, 1)
        : d3.timeWeek.offset(start, 1);

    // We need to pad the grid to start on Sunday/Monday. Let's assume Sunday start for D3 default
    const startGrid = d3.timeWeek.floor(start);
    const endGrid = viewMode === 'month' 
        ? d3.timeWeek.ceil(end) // Complete the last week
        : d3.timeWeek.offset(startGrid, 1);

    return d3.timeDay.range(startGrid, endGrid);
  };

  const days = getDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper for reminder colors
  const getTypeColor = (type: ReminderType) => {
    switch (type) {
      case ReminderType.Urgent: return 'bg-gray-600';
      case ReminderType.Meeting: return 'bg-gray-400';
      case ReminderType.Health: return 'bg-gray-300';
      case ReminderType.Idea: return 'bg-gray-200';
      default: return 'bg-gray-500';
    }
  };

  const hoveredReminder = reminders.find(r => r.id === hoveredReminderId);

  // --- Render ---

  return (
    <div className="bg-white rounded-3xl shadow-soft p-6 flex flex-col gap-6 animate-fade-in relative">
      
      {/* Header / Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Title */}
        <div className="flex flex-col items-center md:items-start">
            <h2 className="text-2xl font-light text-gray-800">
                {d3.timeFormat(viewMode === 'month' ? "%B %Y" : "Week of %b %d, %Y")(currentDate)}
            </h2>
            <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                {viewMode === 'month' ? 'Monthly Overview' : 'Weekly Details'}
            </span>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl">
            {/* View Switcher (Zoom) */}
            <div className="flex bg-white rounded-xl shadow-sm mr-2 border border-gray-100">
                <button 
                    onClick={() => setViewMode('month')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${viewMode === 'month' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Month
                </button>
                <button 
                    onClick={() => setViewMode('week')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${viewMode === 'week' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Week
                </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
                <button onClick={() => handleNav('prev')} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-600 transition-all">
                    <ChevronLeft size={18} />
                </button>
                <button onClick={resetView} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-600 transition-all group" title="Jump to Upcoming">
                    <RotateCcw size={16} className="group-hover:-rotate-180 transition-transform duration-500"/>
                </button>
                <button onClick={() => handleNav('next')} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-600 transition-all">
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 min-h-[400px] flex flex-col relative z-0">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-2">
            {weekDays.map(d => (
                <div key={d} className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider py-2">
                    {d}
                </div>
            ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden shadow-inner-soft">
            {days.map((day, idx) => {
                const dayReminders = reminders.filter(r => {
                    const rDate = new Date(r.date);
                    return d3.timeDay.count(day, rDate) === 0; // Same day
                });
                
                const isToday = d3.timeDay.count(new Date(), day) === 0;
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const opacity = viewMode === 'month' && !isCurrentMonth ? 'bg-gray-50/50 text-gray-300' : 'bg-white text-gray-700';

                return (
                    <div 
                        key={idx} 
                        onClick={() => onDateClick(day)}
                        className={`min-h-[80px] p-2 flex flex-col gap-1 transition-colors duration-200 hover:bg-blue-50/30 cursor-pointer ${opacity} relative group`}
                    >
                        {/* Day Number */}
                        <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-gray-800 text-white shadow-md' : ''}`}>
                            {day.getDate()}
                        </div>

                        {/* Reminders List */}
                        <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                            {dayReminders.slice(0, 4).map(r => (
                                <button
                                    key={r.id}
                                    onMouseEnter={() => setHoveredReminderId(r.id)}
                                    onMouseLeave={() => setHoveredReminderId(null)}
                                    onClick={(e) => { e.stopPropagation(); onSelectReminder(r.id); }}
                                    className={`text-[10px] text-left px-2 py-1 rounded-md text-white truncate shadow-sm hover:scale-105 transition-transform ${getTypeColor(r.type)} ${r.completed ? 'opacity-40 grayscale decoration-slice' : ''}`}
                                    title={r.title}
                                >
                                    {r.title}
                                </button>
                            ))}
                            {dayReminders.length > 4 && (
                                <div className="text-[9px] text-gray-400 pl-1">
                                    +{dayReminders.length - 4} more
                                </div>
                            )}
                        </div>

                        {/* Add Overlay on Hover (Visual Feedback) */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                             <div className="bg-gray-800/5 rounded-lg w-full h-full"></div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Magnifying Glass / Detail View Overlay */}
      {hoveredReminder && (
        <div className="absolute top-24 right-8 w-72 bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-gray-100 z-50 animate-scale-in pointer-events-none origin-top-right">
           <div className="flex justify-between items-start mb-3">
               <div className={`h-2 w-16 rounded-full ${getTypeColor(hoveredReminder.type)}`}></div>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100 px-2 py-0.5 rounded-full bg-white">
                 {hoveredReminder.type}
               </span>
           </div>
           
           <h4 className="text-xl font-light text-gray-900 leading-tight mb-2">
               {hoveredReminder.title}
           </h4>
           
           <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 font-medium">
                <div className="flex items-center gap-1.5">
                    <CalendarIcon size={14} className="text-gray-400"/>
                    <span>{new Date(hoveredReminder.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400"/>
                    <span>{new Date(hoveredReminder.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
           </div>
           
           <div className="bg-gray-50 p-3 rounded-xl mb-2">
                <div className="flex gap-2 mb-1">
                    <AlignLeft size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed italic">
                        "{hoveredReminder.description || "No description provided."}"
                    </p>
                </div>
           </div>

           <div className="text-[10px] text-center text-gray-300 mt-2">
               Click to edit details
           </div>
        </div>
      )}

    </div>
  );
};

export default TimelineCalendar;