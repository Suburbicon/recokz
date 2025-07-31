import axios from "axios";
import { TokenStorage } from '@/shared/lib/storage'

export const api = axios.create({
  headers: {
    "Content-Type": "application/json",
    'accesstoken': new TokenStorage().getAccessToken() || 'not-init',
  },  
});

api.interceptors.response.use(response => {
    return response
}, async error => {
    console.log(error)
    if (!axios.isAxiosError(error) || !error.response || !error.config) {
      return Promise.reject(error);
    }

    const { status } = error.response;
    
    if (status === 401) {
        const storage = new TokenStorage();
        const response = await axios.get(
            `${error.config.url?.replace('register', 'revoke')}&refreshToken=${storage.getRefreshToken()}`
        )
        storage.saveToStorage(
            response.data.data.accessToken,
            response.data.data.refreshToken,
        )

        return api.request({
            ...error.config,
            headers: {
                ...error.config.headers,
                accesstoken: storage.getAccessToken(),
            },
        });
    }

    return Promise.reject(error);
})