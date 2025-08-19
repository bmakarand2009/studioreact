'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PreviewUser {
  id: string;
  email: string;
  name: string;
  role: string;
  previewToken: string; // Student's actual token for API calls
  isPreview: boolean;
  originalAdminToken?: string; // Store admin token to restore later
}

interface PreviewContextType {
  previewUser: PreviewUser | null;
  isInPreviewMode: boolean;
  enterPreviewMode: (studentData: any, studentToken: string, adminToken?: string) => void;
  exitPreviewMode: () => string | undefined;
  getCurrentUser: () => PreviewUser | null;
  getPreviewToken: () => string | null;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewUser, setPreviewUser] = useState<PreviewUser | null>(null);

  const enterPreviewMode = (studentData: any, studentToken: string, adminToken?: string) => {
    const previewUser: PreviewUser = {
      id: studentData.id,
      email: studentData.email,
      name: studentData.name,
      role: 'ROLE_STUDENT', // Force student role in preview
      previewToken: studentToken, // Store the student's actual token
      isPreview: true,
      originalAdminToken: adminToken, // Store admin token to restore later
    };
    setPreviewUser(previewUser);
  };

  const exitPreviewMode = () => {
    const adminToken = previewUser?.originalAdminToken;
    setPreviewUser(null);
    return adminToken; // Return admin token for restoration
  };

  const getCurrentUser = () => previewUser;

  const getPreviewToken = () => previewUser?.previewToken || null;

  const value: PreviewContextType = {
    previewUser,
    isInPreviewMode: !!previewUser,
    enterPreviewMode,
    exitPreviewMode,
    getCurrentUser,
    getPreviewToken,
  };

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  );
}

export const usePreview = () => {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
};
