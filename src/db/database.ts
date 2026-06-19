import Dexie, { type Table } from 'dexie';
import type { Task } from '../types';

class TaskDatabase extends Dexie {
  tasks!: Table<Task, string>;

  constructor() {
    super('TeamsTaskManagerDB');
    this.version(1).stores({
      tasks: 'id, label, archived, createdAt',
    });
  }
}

export const db = new TaskDatabase();
