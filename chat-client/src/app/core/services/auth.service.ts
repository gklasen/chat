import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SoftUser {
  name: string;
}

const KEY = 'chat.softUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user$ = new BehaviorSubject<SoftUser | null>(this.load());

  getUser() {
    return this.user$.asObservable();
  }

  get current(): SoftUser | null {
    return this.user$.value;
  }

	login(displayName: string): boolean {
	  const cleaned = displayName.trim();
	  if (cleaned.length < 2) return false;

	  const user: SoftUser = { name: cleaned };
	  localStorage.setItem(KEY, JSON.stringify(user));
	  this.user$.next(user);
	  return true;
	}

  logout(): void {
    localStorage.removeItem(KEY);
    this.user$.next(null);
  }

  private load(): SoftUser | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as SoftUser) : null;
    } catch {
      return null;
    }
  }
}