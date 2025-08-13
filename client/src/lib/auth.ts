import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: string;
  nickname: string;
  isAdmin: boolean;
}

export async function login(nickname: string, password: string): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/login", { nickname, password });
  const data = await response.json();
  return data.user;
}

export async function register(nickname: string, password: string): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/register", { nickname, password });
  const data = await response.json();
  return data.user;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}
