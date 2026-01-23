import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ColorService {

    private palette = [
        '#f97316', '#f59e0b', '#22c55e', '#0ea5e9',
        '#6366f1', '#ec4899', '#14b8a6', '#a855f7',
        '#2dd4bf', '#fb7185', '#10b981', '#3b82f6',
    ];

    private cache = new Map<string, string>();

    getColor(rawKey?: string | null): string {
        const key = (rawKey || '').trim().toLowerCase() || 'default';
        const existing = this.cache.get(key);
        if (existing) return existing;
        const hash = this.hashString(key);
        const index = Math.abs(hash) % this.palette.length;
        const color = this.palette[index];
        this.cache.set(key, color);
        return color;
    }

    private hashString(s: string): number {
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
            hash = (hash * 31 + s.charCodeAt(i)) | 0;
        }
        return hash;
    }
}
