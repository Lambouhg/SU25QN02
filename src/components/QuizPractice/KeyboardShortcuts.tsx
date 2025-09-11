"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  mode?: 'quiz' | 'review';
}

export default function KeyboardShortcuts({ mode = 'quiz' }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quizShortcuts = [
    { key: '←', description: 'Previous question' },
    { key: '→', description: 'Next question' },
    { key: 'Space', description: 'Next/Submit' },
    { key: 'B', description: 'Toggle bookmark' },
    { key: 'H', description: 'Toggle hint' },
    { key: 'Esc', description: 'Close hint' },
  ];

  const reviewShortcuts = [
    { key: '←', description: 'Previous question' },
    { key: '→', description: 'Next question' },
    { key: 'Esc', description: 'Back to results' },
  ];

  const shortcuts = mode === 'review' ? reviewShortcuts : quizShortcuts;

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        <Keyboard className="w-4 h-4 mr-2" />
        Shortcuts
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-xl border-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Keyboard Shortcuts</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
