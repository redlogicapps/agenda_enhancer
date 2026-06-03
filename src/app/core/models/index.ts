export interface CalendarEvent {
  id: string;
  subject: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  durationMinutes: number;
  categoryKey: string;
  originalDurationMinutes: number;
  originalCategoryKey: string;
  isDeleted: boolean;
  isModified: boolean;
}

export interface ActivityCategory {
  key: string;
  label: string;
  color: string;
  colorHex: string;
  isDefault: boolean;
  keywords: string[];
}

export interface EfficiencyGoal {
  percentages: Record<string, number>;
}

export interface EfficiencyReport {
  totalMinutes: number;
  totalHours: number;
  hoursByCategory: Record<string, number>;
  hoursReport: Record<string, number>;
  percentagesByCategory: Record<string, number>;
  focusMinutes: number;
  meetingMinutes: number;
  focusBlocksCount: number;
  efficiencyScore: number;
}

export type TabId = 'import' | 'categorize' | 'dashboard' | 'simulator';
