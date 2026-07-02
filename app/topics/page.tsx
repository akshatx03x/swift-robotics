'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../components/Toast';
import { db, Topic } from '../../services/db';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Tag, 
  Loader2,
  AlertCircle 
} from 'lucide-react';

export default function TopicsPage() {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const data = await db.getTopics();
      setTopics(data);
    } catch (e) {
      toast('Failed to load topics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    setSubmitting(true);
    try {
      const trimmed = newTopicName.trim();
      
      // Prevent duplicates
      if (topics.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
        toast('Topic already exists', 'warning');
        setSubmitting(false);
        return;
      }

      const added = await db.addTopic(trimmed);
      setTopics(prev => [...prev, added]);
      setNewTopicName('');
      toast(`Added topic "${trimmed}"`, 'success');
    } catch (e) {
      toast('Failed to add topic', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTopic = async (id: string, enabled: boolean) => {
    try {
      await db.updateTopic(id, { enabled });
      setTopics(prev => prev.map(t => t.id === id ? { ...t, enabled } : t));
      const topic = topics.find(t => t.id === id);
      toast(
        `Topic "${topic?.name}" is now ${enabled ? 'enabled' : 'disabled'}`, 
        enabled ? 'success' : 'info'
      );
    } catch (e) {
      toast('Failed to update topic', 'error');
    }
  };

  const handleStartEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setEditingName(topic.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      const trimmed = editingName.trim();
      if (topics.some(t => t.id !== id && t.name.toLowerCase() === trimmed.toLowerCase())) {
        toast('Another topic with this name already exists', 'warning');
        return;
      }
      await db.updateTopic(id, { name: trimmed });
      setTopics(prev => prev.map(t => t.id === id ? { ...t, name: trimmed } : t));
      setEditingId(null);
      toast('Topic updated successfully', 'success');
    } catch (e) {
      toast('Failed to edit topic', 'error');
    }
  };

  const handleDeleteTopic = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await db.deleteTopic(id);
      setTopics(prev => prev.filter(t => t.id !== id));
      toast(`Deleted topic "${name}"`, 'success');
    } catch (e) {
      toast('Failed to delete topic', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Monitored Topics
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Configure which fashion, textile, and economic topics the AI agent tracks.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800/40">
            <Tag className="w-3.5 h-3.5" />
            <span>Active Topics: {topics.filter(t => t.enabled).length}</span>
          </div>
        </div>

        {/* Add Topic Form */}
        <form onSubmit={handleAddTopic} className="glass-panel p-5 rounded-2xl flex gap-3 border border-zinc-800/60 shadow-lg shadow-black/10">
          <input
            type="text"
            placeholder="Add new topic (e.g. Cotton Prices, Circular Fashion...)"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            disabled={submitting}
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={submitting || !newTopicName.trim()}
            className="bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </button>
        </form>

        {/* List of Topics */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <p className="text-zinc-500 text-sm">Loading monitoring topics...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-10 h-10 text-zinc-600" />
            <h3 className="text-lg font-bold text-zinc-300">No topics found</h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              Add custom search keywords or seed defaults to start tracking topics.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`glass-card p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 ${
                  topic.enabled 
                    ? 'border-zinc-800/80 hover:border-violet-500/30' 
                    : 'border-zinc-900/40 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  {editingId === topic.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(topic.id)}
                        className="p-1 text-emerald-400 hover:bg-zinc-850 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-zinc-500 hover:bg-zinc-850 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${topic.enabled ? 'bg-violet-500/10 text-violet-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        <Tag className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-zinc-200 text-sm truncate">
                        {topic.name}
                      </span>
                    </div>
                  )}
                </div>

                {editingId !== topic.id && (
                  <div className="flex items-center gap-2">
                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => handleToggleTopic(topic.id, !topic.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        topic.enabled ? 'bg-violet-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          topic.enabled ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(topic)}
                      className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition"
                      title="Edit Topic"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteTopic(topic.id, topic.name)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Topic"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
