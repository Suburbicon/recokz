export class RekassaStorage {
    constructor() {}

    saveToStorage(id: string, token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('rekassa', JSON.stringify({
                'id': id,
                'token': token
            }));
        }
    }

    getRekassaData() {
        if (typeof window !== 'undefined') {
            return JSON.parse(localStorage.getItem('rekassa') || 'not-found');
        }
        return null
    }
}
