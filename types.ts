export enum ReminderType {
  Standard = 'Standard',
  Urgent = 'Urgent',
  Meeting = 'Meeting',
  Health = 'Health',
  Idea = 'Idea'
}

export enum RecurrenceType {
  None = 'None',
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Yearly = 'Yearly'
}

export enum CommunicationMethod {
  Notification = 'Notification',
  Email = 'Email',
  SMS = 'SMS',
  Call = 'Phone Call'
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string; // ISO String
  type: ReminderType;
  recurrence: RecurrenceType;
  method: CommunicationMethod;
  completed: boolean;
  createdAt: number;
  
  // New features
  recurrenceEndMode?: 'never' | 'date' | 'count';
  recurrenceEndValue?: string | number;
  contactInfo?: string;
}

export interface User {
  id: string;
  isTemp: boolean;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface D3Node extends Reminder {
  x?: number;
  y?: number;
}