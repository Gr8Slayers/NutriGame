import React, { createContext, useContext } from 'react';

export type AuthEntryRoute = 'Login' | 'SignUp';

type AuthContextValue = {
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: (route?: AuthEntryRoute) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
  value: AuthContextValue;
};

export function AuthProvider({ children, value }: AuthProviderProps) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
