import React, { useState, useEffect } from 'react';
import { Reminder, ReminderType, RecurrenceType, CommunicationMethod } from '../types';
import { Plus, Wand2, Loader2, X, Repeat, Bell, Mail, MessageSquare, Phone, Save, Calendar, Hash, Contact } from 'lucide-react';
import { refineReminderText } from '../services/geminiService';

interface ReminderWidgetProps {
  onAdd: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'userId'>) => void;
  onClose: () => void;
  initialReminder?: Reminder | null; // For edit mode
  initialDate?: Date | null; // For clicking on empty calendar slot
}

const ReminderWidget: React.FC<ReminderWidgetProps> = ({ onAdd, onClose, initialReminder, initialDate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<ReminderType>(ReminderType.Standard);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(RecurrenceType.None);
  const [method, setMethod] = useState<CommunicationMethod>(CommunicationMethod.Notification);
  
  // New State for features
  const [recurrenceEndMode, setRecurrenceEndMode] = useState<'never' | 'date' | 'count'>('never');
  const [recurrenceEndValue, setRecurrenceEndValue] = useState<string | number>('');
  const [contactInfo, setContactInfo] = useState('');

  const [isRefining, setIsRefining] = useState(false);

  // Initialize form with initialReminder data or defaults when opened
  useEffect(() => {
    if (initialReminder) {
      setTitle(initialReminder.title);
      setDescription(initialReminder.description);
      const d = new Date(initialReminder.date);
      setDate(d.toISOString().split('T')[0]);
      setTime(d.toTimeString().slice(0, 5));
      setType(initialReminder.type);
      setRecurrence(initialReminder.recurrence);
      setMethod(initialReminder.method);
      
      // Load new fields
      setRecurrenceEndMode(initialReminder.recurrenceEndMode || 'never');
      setRecurrenceEndValue(initialReminder.recurrenceEndValue || '');
      setContactInfo(initialReminder.contactInfo || '');
    } else {
      // Reset or set default date from click
      setTitle('');
      setDescription('');
      if (initialDate) {
          setDate(initialDate.toISOString().split('T')[0]);
          setTime('09:00');
      } else {
          setDate('');
          setTime('');
      }
      setType(ReminderType.Standard);
      setRecurrence(RecurrenceType.None);
      setMethod(CommunicationMethod.Notification);
      
      setRecurrenceEndMode('never');
      setRecurrenceEndValue('');
      setContactInfo('');
    }
  }, [initialReminder, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const fullDate = new Date(`${date}T${time || '09:00'}`);

    onAdd({
      title,
      description,
      date: fullDate.toISOString(),
      type,
      recurrence,
      method,
      completed: initialReminder ? initialReminder.completed : false,
      
      // Only include recurrence end info if recurring
      recurrenceEndMode: recurrence === RecurrenceType.None ? undefined : recurrenceEndMode,
      recurrenceEndValue: recurrence === RecurrenceType.None || recurrenceEndMode === 'never' ? undefined : recurrenceEndValue,
      
      // Only include contact info if method requires it
      contactInfo: method === CommunicationMethod.Notification ? undefined : contactInfo,
    });
  };

  const handleAiRefine = async () => {
    if (!description) return;
    setIsRefining(true);
    const refined = await refineReminderText(description);
    setDescription(refined);
    setIsRefining(false);
  };

  const getMethodIcon = (m: CommunicationMethod) => {
     switch(m) {
         case CommunicationMethod.Email: return <Mail size={16} />;
         case CommunicationMethod.SMS: return <MessageSquare size={16} />;
         case CommunicationMethod.Call: return <Phone size={16} />;
         default: return <Bell size={16} />;
     }
  };

  // Shared input class with enhanced focus styles
  const inputClass = "w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-700 outline-none border border-transparent transition-all duration-300 focus:bg-white focus:border-gray-400 focus:ring-4 focus:ring-gray-100 focus:shadow-md";

  return (
    <div className="bg-white rounded-3xl shadow-soft p-6 md:p-8 h-full flex flex-col relative animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light text-gray-800">
            {initialReminder ? 'Edit Entry' : 'New Entry'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Type Selection */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {Object.values(ReminderType).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap
                ${type === t 
                  ? 'bg-gray-800 text-white shadow-lg transform scale-105' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
             <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Title</label>
             <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Doctor Appointment"
                className={inputClass}
                required
              />
          </div>

          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                    required
                />
             </div>
             <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Time</label>
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={inputClass}
                />
             </div>
          </div>

          <div className="flex flex-col gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
             <div className="flex gap-4">
                <div className="flex-1">
                     <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Repeat size={12} /> Recurrence
                     </label>
                     <div className="relative">
                        <select
                            value={recurrence}
                            onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                            className={`${inputClass} appearance-none cursor-pointer bg-white`}
                        >
                            {Object.values(RecurrenceType).map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                     </div>
                </div>
                
                {/* Recurrence End Settings */}
                {recurrence !== RecurrenceType.None && (
                    <div className="flex-1 animate-fade-in">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ends</label>
                        <select
                             value={recurrenceEndMode}
                             onChange={(e) => setRecurrenceEndMode(e.target.value as any)}
                             className={`${inputClass} appearance-none cursor-pointer bg-white`}
                        >
                             <option value="never">Never</option>
                             <option value="date">On Date</option>
                             <option value="count">After...</option>
                        </select>
                    </div>
                )}
             </div>

             {/* Recurrence End Detail Input */}
             {recurrence !== RecurrenceType.None && recurrenceEndMode !== 'never' && (
                 <div className="animate-fade-in-down">
                     {recurrenceEndMode === 'date' ? (
                         <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="date"
                                value={recurrenceEndValue as string}
                                onChange={(e) => setRecurrenceEndValue(e.target.value)}
                                className={`${inputClass} bg-white pl-10`}
                                placeholder="Select End Date"
                            />
                         </div>
                     ) : (
                         <div className="relative">
                            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="number"
                                min="1"
                                value={recurrenceEndValue}
                                onChange={(e) => setRecurrenceEndValue(Number(e.target.value))}
                                className={`${inputClass} bg-white pl-10`}
                                placeholder="Number of occurrences"
                            />
                         </div>
                     )}
                 </div>
             )}
          </div>

          <div className="flex flex-col gap-3">
             <div>
                 <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    Method
                 </label>
                 <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                        {getMethodIcon(method)}
                    </div>
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as CommunicationMethod)}
                        className={`${inputClass} pl-10 appearance-none cursor-pointer`}
                    >
                        {Object.values(CommunicationMethod).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                 </div>
             </div>
             
             {/* Conditional Contact Info Input */}
             {method !== CommunicationMethod.Notification && (
                 <div className="animate-fade-in-down">
                     <div className="relative">
                        <Contact size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type={method === CommunicationMethod.Email ? "email" : "tel"}
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            placeholder={method === CommunicationMethod.Email ? "Enter email address..." : "Enter phone number..."}
                            className={`${inputClass} pl-10`}
                            required
                        />
                     </div>
                 </div>
             )}
          </div>

          <div className="relative">
             <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>Notes</span>
                <button 
                    type="button" 
                    onClick={handleAiRefine}
                    disabled={!description || isRefining}
                    className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                    {isRefining ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    <span className="text-[10px]">Refine with AI</span>
                </button>
             </label>
             <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={4}
                className={`${inputClass} resize-none`}
             />
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 w-full bg-gray-800 text-white font-medium py-4 rounded-2xl shadow-lg hover:shadow-xl hover:bg-gray-900 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          {initialReminder ? <Save size={20} /> : <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300"/>}
          {initialReminder ? 'Save Changes' : 'Set Reminder'}
        </button>
      </form>
    </div>
  );
};

export default ReminderWidget;