export type TaskLabel =
  | 'PM/KD/TVID - Allgemein (Spezteam-Meeting)'
  | 'PM - Allgemein (Montags-Meeting)'
  | 'PM - Product Management (PM-Meeting)'
  | 'Sonstiges';

export const TASK_LABELS: TaskLabel[] = [
  'PM/KD/TVID - Allgemein (Spezteam-Meeting)',
  'PM - Allgemein (Montags-Meeting)',
  'PM - Product Management (PM-Meeting)',
  'Sonstiges',
];

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  blob: Blob;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  label: TaskLabel;
  critical: boolean;
  progress: number;
  attachments: Attachment[];
  archived: boolean;
  createdAt: string;
  archivedAt?: string;
}

export type NewTaskInput = Omit<Task, 'id' | 'createdAt' | 'archived' | 'archivedAt'>;
