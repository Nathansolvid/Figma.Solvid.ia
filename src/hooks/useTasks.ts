/**
 * HOOK: useTasks
 * Gestion des tâches pour le workflow Excel-first
 */

import { useState, useEffect } from 'react';
import { dataProvider, type Task } from '@/services/dataProvider';
import { v4 as uuidv4 } from 'uuid';

export function useTasks(packId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les tâches
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let allTasks: Task[];
      
      if (packId) {
        // Charger les tâches d'un pack spécifique
        allTasks = await dataProvider.store.listByIndex('tasks', 'packId', packId);
      } else {
        // Charger toutes les tâches
        allTasks = await dataProvider.store.list('tasks');
      }
      
      setTasks(allTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  // Créer une tâche
  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    try {
      const newTask: Task = {
        id: uuidv4(),
        packId,                    // ← injecté depuis le paramètre du hook
        createdBy: 'current-user', // TODO: Récupérer depuis le contexte auth
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...taskData,
      };

      await dataProvider.store.create('tasks', newTask);
      await loadTasks(); // Recharger
      
      return newTask;
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  };

  // Mettre à jour une tâche
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const existing = await dataProvider.store.read('tasks', taskId);
      if (!existing) {
        throw new Error('Tâche introuvable');
      }

      const updated: Task = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        // Si la tâche passe à "completed", ajouter completedAt
        ...(updates.status === 'completed' && !existing.completedAt
          ? { completedAt: new Date().toISOString() }
          : {}),
      };

      await dataProvider.store.update('tasks', updated);
      await loadTasks(); // Recharger
      
      return updated;
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  // Supprimer une tâche
  const deleteTask = async (taskId: string) => {
    try {
      await dataProvider.store.delete('tasks', taskId);
      await loadTasks(); // Recharger
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  // Charger au montage
  useEffect(() => {
    loadTasks();
  }, [packId]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reload: loadTasks,
  };
}
