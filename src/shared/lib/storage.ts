export class TokenStorage {
    constructor() {}

    saveToStorage(accessToken: string, refreshToken: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    getRefreshToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('refreshToken') || 'not-found';
        }
        return null
    }

    getAccessToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken') || 'not-found';
        }
        return null
    }
}