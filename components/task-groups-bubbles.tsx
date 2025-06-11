"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { TaskGroup, User, GuestUser } from '@/types';
import { cn } from '@/lib/utils';

interface TaskGroupsBubblesProps {
  user: User | null;
  guestUser: GuestUser | null;
  groups: TaskGroup[];
  selectedGroup: string | null;
  onGroupSelect: (groupId: string | null) => void;
  onGroupsChange: () => void;
  onTaskDrop: (taskId: string, groupId: string) => void;
  getTaskCountForGroup: (groupId: string) => number;
  onAddGroup?: () => void;
}

export default function TaskGroupsBubbles({
  user,
  guestUser,
  groups,
  selectedGroup,
  onGroupSelect,
  onGroupsChange,
  onTaskDrop,
  getTaskCountForGroup,
  onAddGroup,
}: TaskGroupsBubblesProps) {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, groupId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId || typeof taskId !== 'string') {
      console.warn('Invalid task ID received in drop event');
      return;
    }
    onTaskDrop(taskId, groupId);
  };

  const totalTasks = React.useMemo(() => 
    groups.reduce((acc, group) => acc + getTaskCountForGroup(group.id), 0),
    [groups, getTaskCountForGroup]
  );

  return (
    <div className="relative mb-8" role="tablist" aria-label="Task Groups">
      {/* SVG Filter Definition */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Bubbles Container */}
      <div className="flex flex-wrap gap-4" style={{ filter: 'url(#goo)' }}>
        {/* All Tasks Bubble */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all duration-300',
            'bg-primary/10 hover:bg-primary/20 border border-primary/20',
            selectedGroup === null && 'bg-primary/20 border-primary'
          )}
          onClick={() => onGroupSelect(null)}
          role="tab"
          aria-selected={selectedGroup === null}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onGroupSelect(null);
            }
          }}
        >
          <span className="text-lg" aria-hidden="true">📋</span>
          <span className="font-medium">همه وظایف</span>
          <span 
            className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full"
            aria-label={`${totalTasks} tasks total`}
          >
            {totalTasks}
          </span>
        </motion.div>

        {/* Group Bubbles */}
        {groups.map((group) => (
          <motion.div
            key={group.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all duration-300',
              'bg-primary/10 hover:bg-primary/20 border border-primary/20',
              selectedGroup === group.id && 'bg-primary/20 border-primary'
            )}
            onClick={() => onGroupSelect(group.id)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => handleDrop(e, group.id)}
            role="tab"
            aria-selected={selectedGroup === group.id}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onGroupSelect(group.id);
              }
            }}
          >
            <span className="text-lg" aria-hidden="true">{group.emoji}</span>
            <span className="font-medium">{group.name}</span>
            <span 
              className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full"
              aria-label={`${getTaskCountForGroup(group.id)} tasks in ${group.name}`}
            >
              {getTaskCountForGroup(group.id)}
            </span>
          </motion.div>
        ))}

        {/* Add Group Bubble */}
        {onAddGroup && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all duration-300 bg-primary/10 hover:bg-primary/20 border border-primary/20"
            onClick={onAddGroup}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onAddGroup();
              }
            }}
            aria-label="Add new task group"
          >
            <span className="text-lg" aria-hidden="true">➕</span>
            <span className="font-medium">افزودن گروه</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
