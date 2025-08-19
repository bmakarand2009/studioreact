'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { ThemeToggle } from '@/components/ui';
import { useAppConfig } from '@/hooks/useAppConfig';
import Link from 'next/link';

export default function HomePage() {
  const { config, updateConfig } = useAppConfig();
  const [currentLayout, setCurrentLayout] = useState(config.layout);

  const handleLayoutChange = (newLayout: string) => {
    setCurrentLayout(newLayout);
    updateConfig({ layout: newLayout });
  };

  const layouts = [
    { id: 'wajooba-admin', name: 'Wajooba Admin', description: 'Vertical navigation for administrators' },
    { id: 'wajooba-student', name: 'Wajooba Student', description: 'Horizontal navigation for students' },
    { id: 'wajooba-public', name: 'Wajooba Public', description: 'Public-facing layout with footer' },
    { id: 'classic', name: 'Classic', description: 'Traditional vertical sidebar layout' },
    { id: 'modern', name: 'Modern', description: 'Clean horizontal navigation layout' },
    { id: 'empty', name: 'Empty', description: 'Minimal layout for authentication pages' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Wajooba Layout System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose from multiple layout options to customize your experience
          </p>
        </div>

        {/* Layout Selector */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Layout Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {layouts.map((layout) => (
                <div
                  key={layout.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    currentLayout === layout.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleLayoutChange(layout.id)}
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {layout.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {layout.description}
                  </p>
                  {currentLayout === layout.id && (
                    <div className="mt-2 text-primary text-sm font-medium">
                      ✓ Active Layout
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Current Layout Info */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Current Layout: {currentLayout}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You can change layouts by clicking on the options above or by adding a query parameter to the URL:
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <code className="text-sm text-gray-800 dark:text-gray-200">
                ?layout={currentLayout}
              </code>
            </div>
          </div>
        </Card>

        {/* Theme Toggle */}
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Theme Controls
            </h2>
            <div className="flex items-center justify-center space-x-4">
              <ThemeToggle variant="button" />
              <ThemeToggle variant="switch" />
              <ThemeToggle variant="icon" />
            </div>
          </div>
        </Card>

        {/* Quick Navigation */}
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Navigation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/login">
                <Button variant="outline" fullWidth>
                  Login Page
                </Button>
              </Link>
              <Link href="/forgot-password">
                <Button variant="outline" fullWidth>
                  Forgot Password
                </Button>
              </Link>
              <Link href="/?layout=wajooba-public">
                <Button variant="outline" fullWidth>
                  Public Layout
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
