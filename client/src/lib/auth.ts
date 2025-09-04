import { useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

export interface User {
  id: string;
  nickname: string;
  isAdmin: boolean;
}

export function useAuth() {
  const { data: authData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const user = authData?.user || null;
  const isAuthenticated = !!user;

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  };
}

export async function login(nickname: string, password: string): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/login", { nickname, password });
  const data = await response.json();
  return data.user;
}

export async function register(nickname: string, email: string, password: string): Promise<User> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nickname, email, password }),
  });
  const data = await response.json();
  return data.user;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}