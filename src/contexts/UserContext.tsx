

import React, { createContext, useContext, useReducer, ReactNode, useCallback, useMemo } from 'react';
import type { UserProfile } from '@/app/core/user';

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type UserAction =
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: UserState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
};

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
}

interface UserContextType {
  state: UserState;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  const setUser = useCallback((user: UserProfile | null) => {
    console.log('UserContext: setUser called with:', user?.email || 'null');
    // Only dispatch if the user actually changed
    if (JSON.stringify(state.user) !== JSON.stringify(user)) {
      dispatch({ type: 'SET_USER', payload: user });
    } else {
      console.log('UserContext: User unchanged, skipping dispatch');
    }
  }, [state.user]);

  const setLoading = useCallback((loading: boolean) => {
    console.log('UserContext: setLoading called with:', loading, 'current state:', state.isLoading);
    
    // Always dispatch loading state changes to ensure consistency
    // The race condition prevention should be handled at the hook level, not here
    console.log('UserContext: Dispatching loading state change');
    dispatch({ type: 'SET_LOADING', payload: loading });
    
    // Verify the state was updated
    setTimeout(() => {
      console.log('UserContext: Loading state after dispatch:', state.isLoading);
    }, 100);
  }, []);

  const setAuthenticated = useCallback((authenticated: boolean) => {
    console.log('UserContext: setAuthenticated called with:', authenticated);
    // Only dispatch if authenticated state actually changed
    if (state.isAuthenticated !== authenticated) {
      dispatch({ type: 'SET_AUTHENTICATED', payload: authenticated });
    } else {
      console.log('UserContext: Authenticated state unchanged, skipping dispatch');
    }
  }, [state.isAuthenticated]);

  const logout = useCallback(() => {
    console.log('UserContext: logout called');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value: UserContextType = useMemo(() => ({
    state,
    setUser,
    setLoading,
    setAuthenticated,
    logout,
  }), [state, setUser, setLoading, setAuthenticated, logout]);

  console.log('UserContext: Provider re-rendering, state:', {
    hasUser: !!state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated
  });

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
