import { User } from "@/types";

const USER_STORAGE_KEY = "itosm_user";

export function setCurrentUser(user: User): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem(USER_STORAGE_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function clearCurrentUser(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.isAdmin === true;
}
