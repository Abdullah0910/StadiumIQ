export type UserRole = 'fan' | 'organizer' | 'volunteer' | 'security' | 'operations' | 'medical';

export interface StadiumLocation {
  id: string;
  name: string;
  type: 'restroom' | 'food_court' | 'exit' | 'gate' | 'medical' | 'parking' | 'merchandise';
  description: string;
  x: number; // Percentage coordinate on map (0-100)
  y: number; // Percentage coordinate on map (0-100)
  density: 'low' | 'medium' | 'high';
  currentWaitTimeMinutes?: number;
  rating?: number;
  specials?: string[];
  accessibilityNote?: string;
  crowdCount?: number;
}

export interface MatchSchedule {
  id: string;
  eventName: string;
  time: string;
  sector: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  details: string;
  homeTeam: string;
  awayTeam: string;
}

export interface IncidentReport {
  id: string;
  title: string;
  location: string;
  status: 'open' | 'resolved';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reporterRole: string;
  reportedAt: string;
  aiSummary?: string;
}

export interface VolunteerTask {
  id: string;
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'active' | 'completed';
  assignee?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'crowd' | 'medical' | 'clean' | 'info' | 'lost_found';
}

export interface StadiumNotification {
  id: string;
  type: 'security' | 'announcement' | 'operations' | 'general';
  text: string;
  timestamp: string;
  isAiGenerated: boolean;
}

export interface ChatHistoryMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  language?: string;
}
