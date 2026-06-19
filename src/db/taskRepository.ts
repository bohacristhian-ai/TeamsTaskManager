import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import type { Task, NewTaskInput } from '../types';

// ── Helper ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return uuidv4();
}

// ── Read ────────────────────────────────────────────────────────────────────

export async function getAllActiveTasks(): Promise<Task[]> {
  try {
    return await db.tasks.where('archived').equals(0).sortBy('createdAt');
  } catch (err) {
    console.error('Error fetching active tasks:', err);
    throw new Error('Fehler beim Laden der Aufgaben.');
  }
}

export async function getAllArchivedTasks(): Promise<Task[]> {
  try {
    return await db.tasks.where('archived').equals(1).sortBy('archivedAt');
  } catch (err) {
    console.error('Error fetching archived tasks:', err);
    throw new Error('Fehler beim Laden des Archivs.');
  }
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  try {
    return await db.tasks.get(id);
  } catch (err) {
    console.error('Error fetching task by id:', err);
    throw new Error('Fehler beim Laden der Aufgabe.');
  }
}

// ── Write ───────────────────────────────────────────────────────────────────

export async function createTask(input: NewTaskInput): Promise<Task> {
  const task: Task = {
    ...input,
    id: generateId(),
    archived: false,
    createdAt: new Date().toISOString(),
  };
  try {
    await db.tasks.add(task);
    return task;
  } catch (err) {
    console.error('Error creating task:', err);
    throw new Error('Fehler beim Erstellen der Aufgabe.');
  }
}

export async function updateTask(id: string, changes: Partial<Task>): Promise<void> {
  try {
    await db.tasks.update(id, changes);
  } catch (err) {
    console.error('Error updating task:', err);
    throw new Error('Fehler beim Aktualisieren der Aufgabe.');
  }
}

export async function archiveTask(id: string): Promise<void> {
  try {
    await db.tasks.update(id, {
      archived: true,
      archivedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error archiving task:', err);
    throw new Error('Fehler beim Archivieren der Aufgabe.');
  }
}

export async function restoreTask(id: string): Promise<void> {
  try {
    await db.tasks.update(id, {
      archived: false,
      archivedAt: undefined,
    });
  } catch (err) {
    console.error('Error restoring task:', err);
    throw new Error('Fehler beim Wiederherstellen der Aufgabe.');
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    await db.tasks.delete(id);
  } catch (err) {
    console.error('Error deleting task:', err);
    throw new Error('Fehler beim Löschen der Aufgabe.');
  }
}

// ── Backup / Restore ────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

interface BackupAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  base64: string;
}

interface BackupTask extends Omit<Task, 'attachments'> {
  attachments: BackupAttachment[];
}

export async function exportBackup(): Promise<void> {
  try {
    const tasks = await db.tasks.toArray();
    const backupTasks: BackupTask[] = await Promise.all(
      tasks.map(async (task) => {
        const attachments: BackupAttachment[] = await Promise.all(
          task.attachments.map(async (att) => ({
            id: att.id,
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize,
            base64: await blobToBase64(att.blob),
          }))
        );
        return { ...task, attachments };
      })
    );

    const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tasks: backupTasks }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teams-task-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting backup:', err);
    throw new Error('Fehler beim Exportieren des Backups.');
  }
}

export async function importBackup(file: File): Promise<{ imported: number; skipped: number }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as { tasks: BackupTask[] };

    if (!Array.isArray(data.tasks)) {
      throw new Error('Ungültiges Backup-Format.');
    }

    let imported = 0;
    let skipped = 0;

    for (const backupTask of data.tasks) {
      const existing = await db.tasks.get(backupTask.id);
      if (existing) {
        skipped++;
        continue;
      }

      const attachments = backupTask.attachments.map((att) => ({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        blob: base64ToBlob(att.base64, att.fileType),
      }));

      await db.tasks.add({ ...backupTask, attachments });
      imported++;
    }

    return { imported, skipped };
  } catch (err) {
    console.error('Error importing backup:', err);
    if (err instanceof Error) throw err;
    throw new Error('Fehler beim Importieren des Backups.');
  }
}
