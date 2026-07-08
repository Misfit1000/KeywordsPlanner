import React, { createContext, useContext, useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { API_ROUTES } from "../lib/api/routes";
import { safeJsonFetch } from "../lib/http/safe-json";

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  photoURL: string;
  creationTime: string;
  lastSignInTime: string;
  role: 'admin' | 'support' | 'user';
  plan: 'free' | 'paid' | 'agency' | 'admin';
  subscriptionStatus: 'inactive' | 'trialing' | 'active' | 'past_due' | 'cancelled';
  auditQuotaUsedDaily: number;
  auditQuotaUsedMonthly: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  error: string | null;
  unverifiedEmail: string | null;
  setUnverifiedEmail: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type SupabaseDataService = typeof import("../services/supabaseDataService");

function fallbackAvatar(userId: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
}

function hasSupabaseBrowserConfig() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

async function getSupabaseClientOrThrow() {
  const { getSupabaseBrowserClient } = await import("../lib/supabase/client");
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase is not configured");
  return client;
}

async function loadSupabaseDataService() {
  return import("../services/supabaseDataService");
}

function scheduleIdleWork(callback: () => void) {
  const requestIdleCallback = (window as any).requestIdleCallback as undefined | ((cb: () => void, options?: { timeout: number }) => number);
  const cancelIdleCallback = (window as any).cancelIdleCallback as undefined | ((handle: number) => void);

  if (requestIdleCallback && cancelIdleCallback) {
    const handle = requestIdleCallback(callback, { timeout: 1500 });
    return () => cancelIdleCallback(handle);
  }

  const timeout = window.setTimeout(callback, 250);
  return () => window.clearTimeout(timeout);
}

async function fetchServerProfile(accessToken?: string) {
  if (!accessToken) return null;
  try {
    const response = await safeJsonFetch<any>(API_ROUTES.meProfile, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.success) return null;
    return response.data.data?.profile || response.data.profile || null;
  } catch {
    return null;
  }
}

function normalizeRole(value: unknown): User['role'] {
  if (value === 'admin') return 'admin';
  if (value === 'support' || value === 'staff') return 'support';
  return 'user';
}

function normalizePlan(value: unknown): User['plan'] {
  if (value === 'paid' || value === 'agency' || value === 'admin') return value;
  return 'free';
}

async function mapSupabaseUser(supabaseUser: SupabaseUser, dataService: SupabaseDataService, accessToken?: string): Promise<User> {
  const email = supabaseUser.email || '';
  const metadata = supabaseUser.user_metadata || {};

  try {
    const serverProfile = await fetchServerProfile(accessToken);
    await dataService.initUserProfile(supabaseUser.id, {
      email,
      displayName: metadata.display_name || metadata.full_name || (email ? email.split('@')[0] : 'User'),
    });
    const extraData = await dataService.getUserProfile(supabaseUser.id) || {};
    const profile = serverProfile || extraData;

    return {
      id: supabaseUser.id,
      username: profile.username || email.split('@')[0] || 'User',
      email,
      fullName: metadata.full_name || profile.fullName || profile.full_name || profile.displayName || '',
      bio: profile.bio || '',
      photoURL: metadata.avatar_url || profile.photoURL || fallbackAvatar(supabaseUser.id),
      creationTime: supabaseUser.created_at || new Date().toISOString(),
      lastSignInTime: supabaseUser.last_sign_in_at || new Date().toISOString(),
      role: normalizeRole(profile.role),
      plan: normalizePlan(profile.plan),
      subscriptionStatus: profile.subscriptionStatus || profile.subscription_status || 'inactive',
      auditQuotaUsedDaily: Number(profile.auditQuotaUsedDaily ?? profile.audit_quota_used_daily ?? 0),
      auditQuotaUsedMonthly: Number(profile.auditQuotaUsedMonthly ?? profile.audit_quota_used_monthly ?? 0),
    };
  } catch (err) {
    console.error("Error loading user profile:", err);
    return {
      id: supabaseUser.id,
      username: email.split('@')[0] || 'User',
      email,
      fullName: metadata.full_name || '',
      bio: '',
      photoURL: metadata.avatar_url || fallbackAvatar(supabaseUser.id),
      creationTime: supabaseUser.created_at || new Date().toISOString(),
      lastSignInTime: supabaseUser.last_sign_in_at || new Date().toISOString(),
      role: 'user',
      plan: 'free',
      subscriptionStatus: 'inactive',
      auditQuotaUsedDaily: 0,
      auditQuotaUsedMonthly: 0,
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasSupabaseBrowserConfig());
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig()) {
      setUser(null);
      setLoading(false);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | null = null;

    const hydrateAuth = async () => {
      const client = await getSupabaseClientOrThrow();
      const dataService = await loadSupabaseDataService();

      const { data } = await client.auth.getUser();
      const session = await client.auth.getSession();
      if (active) {
        setUser(data.user ? await mapSupabaseUser(data.user, dataService, session.data.session?.access_token) : null);
        setLoading(false);
      }

      const { data: subscription } = client.auth.onAuthStateChange(async (_event, session) => {
        if (!active) return;
        setUser(session?.user ? await mapSupabaseUser(session.user, dataService, session.access_token) : null);
        setLoading(false);
      });
      unsubscribe = () => subscription.subscription.unsubscribe();
    };

    const cancelIdleWork = scheduleIdleWork(() => {
      hydrateAuth().catch((err) => {
        if (active) {
          console.error("Error loading auth session:", err);
          setLoading(false);
        }
      });
    });

    return () => {
      active = false;
      cancelIdleWork();
      unsubscribe?.();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    const client = await getSupabaseClientOrThrow();

    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) {
      if (signInError.message.toLowerCase().includes('invalid')) {
        throw new Error("Email or password is incorrect");
      }
      throw new Error(signInError.message || "Login failed");
    }
  };

  const register = async (email: string, password: string) => {
    setError(null);
    const client = await getSupabaseClientOrThrow();

    const { data, error: signUpError } = await client.auth.signUp({ email, password });
    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already')) {
        throw new Error("User already exists. Please sign in");
      }
      throw new Error(signUpError.message || "Registration failed");
    }

    if (data.user) {
      const dataService = await loadSupabaseDataService();
      await dataService.initUserProfile(data.user.id, {
        email,
        displayName: email.split('@')[0] || 'User',
      });
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) throw new Error("Not authenticated");
    const client = await getSupabaseClientOrThrow();

    if (data.fullName !== undefined || data.photoURL !== undefined) {
      const { error: updateError } = await client.auth.updateUser({
        data: {
          full_name: data.fullName !== undefined ? data.fullName : user.fullName,
          avatar_url: data.photoURL !== undefined ? data.photoURL : user.photoURL,
        },
      });
      if (updateError) throw updateError;
    }

    const dataService = await loadSupabaseDataService();
    await dataService.updateUserProfileData(user.id, data);
    setUser((prev) => prev ? { ...prev, ...data } : null);
  };

  const logout = async () => {
    if (!hasSupabaseBrowserConfig()) return;
    const client = await getSupabaseClientOrThrow();
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) throw signOutError;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserProfile, error, unverifiedEmail, setUnverifiedEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
