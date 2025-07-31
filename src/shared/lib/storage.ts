export class TokenStorage {
    constructor() {}

    saveToStorage(accessToken: string, refreshToken: string) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    getRefreshToken() {
        return localStorage.getItem('refreshToken') || 'not-found';
    }

    getAccessToken() {
        return localStorage.getItem('accessToken') || 'not-found';
    }
}