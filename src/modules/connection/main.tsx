"use client";
import { useUser } from '@clerk/clerk-react';
import { useState } from "react";
import { api } from '@/shared/client'
import { TokenStorage } from '@/shared/lib/storage'
import { LoaderIcon } from '@/shared/ui/loader'
import { toast } from 'sonner';

 
export const Main = () => {
    const [ipAddress, setIpAddress] = useState(""); 
    const [kassaName, setKassaName] = useState("");
    const { user } = useUser();

    if (!user) {
        return <div className="p-6">
            <LoaderIcon className='animate-spin' />
        </div>;
    }

    const connectToPos = async () => {
        try {
            setIpAddress((prev) => prev + ':8080')
            const response = await api.get(`https://${ipAddress}/v2/register?name=${kassaName}`)
            const storage = new TokenStorage();
            storage.saveToStorage(
                response.data.data.accessToken,
                response.data.data.refreshToken,
            )
            localStorage.setItem('posIpAddress', ipAddress);
            toast.success("Успешно подключено к POS-терминалу");
        }
        catch (error) {
            toast.error("Произошла ошибка при подключении к POS-терминалу");
            console.error("Error connecting to POS terminal:", error);
                <span>{`https://reco.kz/webhook/${user?.publicMetadata.organizationId ?? ""}`}</span>
        }
    };  

    return (
        <div className="p-6">
        <h1 className='mb-4'>Страница подключения к POS-терминалу</h1>
        <div className='flex flex-col items-start space-y-4'>
            <div className='flex flex-col items-start'>
                <div className='flex items-center justify-center space-x-2'>
                    <p>1.</p>
                    <p>Нужно вставить строку ниже в Altegio</p>
                </div>
                <span>{`https://reco.kz/webhook/${user?.publicMetadata.organizationId}`}</span>
            </div>
            <div className='flex items-center justify-center space-x-2'>
                <p>2.</p>
                <p>Найдите IP адрес POS-терминала</p>
            </div>
            <div className='flex flex-col items-center justify-center space-y-2'>
                <div className='flex items-center justify-center space-x-2'>
                    <p>3.</p>
                    <p>Установить связь с POS-терминалом</p>
                </div>
                <label className="flex flex-col w-full">
                    Введите IP адрес POS-терминала
                    <input 
                        type="text" 
                        className='p-2 border border-2 border-gray rounded-xl' 
                        placeholder="192.168.80.4"
                        onChange={(e) => setIpAddress(e.target.value)}
                    />
                </label>
                <label className="flex flex-col w-full">
                    Введите имя кассы
                    <input 
                        type="text" 
                        className='p-2 border border-2 border-gray rounded-xl' 
                        placeholder="Kashier1"
                        onChange={(e) => setKassaName(e.target.value)}
                    />
                </label>
                <button 
                    type="button"
                    className='p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors'
                    onClick={connectToPos}
                >
                    Подключить
                </button>
            </div>
        </div>
        {/* Add your connection related components here */}
        </div>
    );
}