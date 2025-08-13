"use client";
import { useUser } from '@clerk/clerk-react';
import { useState } from "react";
import { api } from '@/shared/client'
import { TokenStorage } from '@/shared/lib/storage'
import { LoaderIcon } from '@/shared/ui/loader'
import { toast } from 'sonner';
import Image from "next/image";

 
export const Main = () => {
    const [ipAddress, setIpAddress] = useState(""); 
    const [kassaName, setKassaName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();

    if (!user || isLoading) {
        return <div className="p-6">
            <LoaderIcon className='animate-spin' />
        </div>;
    }

    const connectToPos = async () => {
        if (!ipAddress || !kassaName) {
            toast.error("Пожалуйста, введите IP адрес и имя кассы.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.get(`/api/pos/v2/register?name=${kassaName}`)
            // const response = await api.get(`https://${ipAddress + ':8080'}/v2/register?name=${kassaName}`)
            const storage = new TokenStorage();
            storage.saveToStorage(
                response.data.data.accessToken,
                response.data.data.refreshToken,
            )
            localStorage.setItem('posIpAddress', ipAddress + ':8080');
            toast.success("Успешно подключено к POS-терминалу");
        }
        catch (error) {
            toast.error("Произошла ошибка при подключении к POS-терминалу");
            console.error("Error connecting to POS terminal:", error);
        } finally {
            setIsLoading(false);
        }
    };  

    return (
        <div className="p-6">
        <h1 className='mb-4 text-3xl'>Страница подключения к POS-терминалу</h1>
        <div className='flex flex-col items-start space-y-4'>
            <div className='flex flex-col items-start'>
                <div className='flex items-center justify-center space-x-2'>
                    <p>1.</p>
                    <p>Нужно вставить строку ниже в Altegio</p>
                </div>
                <div className='ml-5 space-y-3'>
                    <span>{`https://reco.kz/webhook/${user?.publicMetadata.organizationId}`}</span>
                    <Image src='/instructions/first-step.png' alt='first step' width={350} height={200} />
                    <span>Выберите ниже поле &quot;Транзакции&quot; и нажмите &quot;Сохранить&quot;</span>
                    <Image src='/instructions/first-step-2.png' alt='first step 2' width={350} height={200} />
                </div>
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
                <div className='space-y-2'>
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
                        Введите имя кассы - произвольное
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
        </div>
        {/* Add your connection related components here */}
        </div>
    );
}