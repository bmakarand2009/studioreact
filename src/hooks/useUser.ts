

import { useState, useEffect } from 'react';
import { userService } from '@/app/core';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        // For now, we'll use a mock user
        // In a real app, you'd get the user from auth context or user service
        const mockUser: User = {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          avatar: null,
          role: 'admin',
        };
        setUser(mockUser);
      } catch (error) {
        console.error('Failed to load user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading };
}
