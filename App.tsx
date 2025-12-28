import React, { useState, useEffect } from 'react';
import { Reminder, User, ReminderType, CommunicationMethod, RecurrenceType } from './types';
import TimelineCalendar from './components/TimelineCalendar';
import ReminderWidget from './components/ReminderWidget';
import Assistant from './components/Assistant';
import UserProfile from './components/UserProfile';
import { Bell, Search, LayoutGrid, List as ListIcon, Trash2, CheckCircle2, Repeat, Mail, MessageSquare, Phone, AlertCircle, Plus } from 'lucide-react';

// Utility for ID generation
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  // --- State ---
  const [user, setUser] = useState<User>({ id: 'temp-user', isTemp: true, name: 'Guest' });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showWidget, setShowWidget] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing / Creating State
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [initialWidgetDate, setInitialWidgetDate] = useState<Date | null>(null);
  
  // Guest replacement logic
  const [pendingReminderData, setPendingReminderData] = useState<Omit<Reminder, 'id' | 'createdAt' | 'userId'> | null>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);

  // --- Effects (Persistance) ---
  useEffect(() => {
    // Load data
    const savedUser = localStorage.getItem('memento_user');
    const savedReminders = localStorage.getItem('memento_reminders');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedReminders) setReminders(JSON.parse(savedReminders));
  }, []);

  useEffect(() => {
    // Save data
    localStorage.setItem('memento_user', JSON.stringify(user));
    localStorage.setItem('memento_reminders', JSON.stringify(reminders));
  }, [user, reminders]);

  // --- Core Handlers ---

  const handleSaveReminder = (data: Omit<Reminder, 'id' | 'createdAt' | 'userId'>) => {
    // 1. UPDATE Existing
    if (editingReminder) {
        setReminders(prev => prev.map(r => r.id === editingReminder.id ? { ...r, ...data } : r));
        closeWidget();
        return;
    }

    // 2. CREATE New
    // Check Limits
    if (user.isTemp && reminders.length >= 1) {
        // Guest Limit Reached -> Ask to replace
        setPendingReminderData(data);
        setShowReplaceDialog(true);
        return; // Wait for confirmation
    }

    if (!user.isTemp && reminders.length >= 50) {
        alert("Account limit reached (50 active reminders). Please delete some entries.");
        return;
    }

    // Proceed to create
    createReminder(data);
    closeWidget();
  };

  const createReminder = (data: Omit<Reminder, 'id' | 'createdAt' | 'userId'>) => {
    const newReminder: Reminder = {
      ...data,
      id: generateId(),
      userId: user.id,
      createdAt: Date.now(),
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const handleConfirmReplace = () => {
    if (pendingReminderData) {
        setReminders([]); // Clear old for guest 1-to-1 rule
        createReminder(pendingReminderData);
        setShowReplaceDialog(false);
        setPendingReminderData(null);
        closeWidget();
    }
  };

  const handleCancelReplace = () => {
    setShowReplaceDialog(false);
    setPendingReminderData(null);
  };

  // --- Widget & Selection Handlers ---

  const openCreateWidget = (date?: Date) => {
      setEditingReminder(null);
      setInitialWidgetDate(date || new Date());
      setShowWidget(true);
  };

  const openEditWidget = (id: string) => {
      const reminderToEdit = reminders.find(r => r.id === id);
      if (reminderToEdit) {
          setEditingReminder(reminderToEdit);
          setInitialWidgetDate(null);
          setShowWidget(true);
      }
  };

  const closeWidget = () => {
      setShowWidget(false);
      setEditingReminder(null);
      setInitialWidgetDate(null);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    if (editingReminder?.id === id) closeWidget();
  };

  const handleToggleComplete = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const handleLogin = (name: string) => {
    setUser({
        id: generateId(),
        isTemp: false,
        name
    });
    setReminders(prev => prev.map(r => ({...r, userId: 'migrated'})));
  };

  const handleLogout = () => {
    setUser({ id: 'temp-user', isTemp: true, name: 'Guest' });
    setReminders([]); // Clear data on logout
    closeWidget();
  };

  // --- Filtering ---
  const filteredReminders = reminders.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // --- Helper Icons ---
  const getMethodIcon = (method: CommunicationMethod) => {
    switch(method) {
        case CommunicationMethod.Email: return <Mail size={12} />;
        case CommunicationMethod.SMS: return <MessageSquare size={12} />;
        case CommunicationMethod.Call: return <Phone size={12} />;
        default: return <Bell size={12} />;
    }
  };

  // --- Render Helpers ---
  const ReminderCard = ({ reminder }: { reminder: Reminder }) => (
    <div 
        onClick={() => openEditWidget(reminder.id)}
        className={`group bg-white rounded-2xl p-5 shadow-soft hover:shadow-xl transition-all duration-300 ease-out transform hover:-translate-y-1 relative overflow-hidden border border-transparent hover:border-gray-100 flex flex-col h-full cursor-pointer
      ${reminder.completed ? 'opacity-60 grayscale scale-[0.98]' : 'hover:scale-[1.02]'}
    `}>
       {/* Animated Border/Line */}
       <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300
         ${reminder.type === ReminderType.Urgent ? 'bg-gray-600' : 
           reminder.type === ReminderType.Meeting ? 'bg-gray-400' : 'bg-gray-200'}
         ${reminder.completed ? 'opacity-50' : 'group-hover:w-1.5'}
       `}></div>
       
       <div className="flex justify-between items-start mb-2 pl-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">{reminder.type}</span>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={e => e.stopPropagation()}>
             <button onClick={() => handleToggleComplete(reminder.id)} className={`transition-colors duration-200 ${reminder.completed ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}>
                <CheckCircle2 size={16} className={reminder.completed ? 'fill-green-100' : ''} />
             </button>
             <button onClick={() => handleDeleteReminder(reminder.id)} className="text-gray-400 hover:text-red-500 transition-colors duration-200">
                <Trash2 size={16} />
             </button>
          </div>
       </div>
       
       <h3 className={`text-lg font-medium text-gray-800 pl-3 mb-1 transition-all duration-300 ${reminder.completed ? 'line-through text-gray-400' : ''}`}>
           {reminder.title}
       </h3>
       <p className="text-sm text-gray-500 pl-3 mb-4 line-clamp-2 flex-grow">{reminder.description}</p>
       
       <div className="pl-3 mt-auto">
         <div className="flex items-center text-xs text-gray-400 font-medium mb-2">
            {new Date(reminder.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
         </div>
         
         <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full group-hover:bg-gray-100 transition-colors duration-300">
                {getMethodIcon(reminder.method)}
                <span>{reminder.method}</span>
            </div>
            {reminder.recurrence !== RecurrenceType.None && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Repeat size={12} />
                    <span>{reminder.recurrence}</span>
                </div>
            )}
         </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-gray-200 relative">
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
             <div className="bg-gray-800 text-white p-2 rounded-xl shadow-lg transition-transform duration-300 group-hover:rotate-12">
               <Bell size={20} />
             </div>
             <span className="text-xl font-light tracking-tight hidden sm:block group-hover:tracking-normal transition-all duration-300">Memento</span>
          </div>

          <div className="flex-1 max-w-md mx-4 md:mx-12 hidden md:block">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search reminders..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
                />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
                onClick={() => openCreateWidget()}
                className="md:hidden p-2 text-gray-600 bg-white rounded-full shadow-sm hover:bg-gray-50"
            >
                <Plus size={20} />
            </button>
            <UserProfile user={user} onLogin={handleLogin} onLogout={handleLogout} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        
        {/* Upper Section: Calendar & Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar (Takes 2 columns) */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-end px-2">
                <h1 className="text-3xl font-light text-gray-800">Overview</h1>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => openCreateWidget()} 
                        className="hidden md:flex items-center gap-2 text-sm bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gray-200"
                    >
                        <Plus size={16} />
                        New Entry
                    </button>
                    <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                        {filteredReminders.length} Active
                    </div>
                </div>
             </div>
             <TimelineCalendar 
                reminders={filteredReminders} 
                onSelectReminder={openEditWidget} 
                onDateClick={openCreateWidget}
             />
          </div>

          {/* Widget / Quick Add (Takes 1 column) */}
          <div className={`lg:col-span-1 h-[400px] lg:h-auto transition-all duration-500 ease-in-out ${showWidget ? 'opacity-100 translate-x-0' : 'hidden lg:block lg:opacity-100'}`}>
             <ReminderWidget 
                onAdd={handleSaveReminder} 
                onClose={closeWidget} 
                initialReminder={editingReminder}
                initialDate={initialWidgetDate}
             />
          </div>
        </div>

        {/* Lower Section: Reminder List */}
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-light text-gray-700">Upcoming</h2>
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-800 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                         onClick={() => setViewMode('list')}
                         className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-gray-100 text-gray-800 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <ListIcon size={18} />
                    </button>
                </div>
            </div>

            {filteredReminders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 animate-pulse">
                    <div className="text-gray-300 mb-4">No reminders set</div>
                    <button onClick={() => openCreateWidget()} className="text-sm text-gray-500 hover:text-gray-800 underline">
                        Add your first reminder
                    </button>
                </div>
            ) : (
                <div className={`
                    ${viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' 
                        : 'flex flex-col gap-4'
                    }
                `}>
                    {filteredReminders.map(r => (
                        <div key={r.id} className={`${viewMode === 'list' ? 'max-w-3xl mx-auto w-full' : ''} animate-slide-up`}>
                             <ReminderCard reminder={r} />
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      <Assistant />
      
      {/* Mobile Widget Overlay */}
      {showWidget && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={closeWidget}>
            <div className="absolute bottom-0 left-0 w-full h-[80vh] rounded-t-3xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                <ReminderWidget 
                    onAdd={handleSaveReminder} 
                    onClose={closeWidget} 
                    initialReminder={editingReminder}
                    initialDate={initialWidgetDate}
                />
            </div>
        </div>
      )}

      {/* Guest Replace Confirmation Dialog */}
      {showReplaceDialog && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
                  <div className="flex items-center gap-3 text-amber-500 mb-4">
                      <AlertCircle size={24} />
                      <h3 className="text-lg font-semibold text-gray-800">Limit Reached</h3>
                  </div>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                      Guest accounts can only have <strong>1 active reminder</strong>. 
                      Would you like to replace your existing reminder with this new one?
                  </p>
                  <div className="flex gap-3">
                      <button 
                        onClick={handleCancelReplace}
                        className="flex-1 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleConfirmReplace}
                        className="flex-1 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-900 font-medium transition-colors shadow-lg"
                      >
                          Replace
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

export default App;