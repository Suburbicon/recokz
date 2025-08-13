"use client";
import { useUser } from '@clerk/clerk-react';
import { useState } from "react";
import { api } from '@/shared/client'
import { TokenStorage } from '@/shared/lib/storage'
import { LoaderIcon } from '@/shared/ui/loader'
import { toast } from 'sonner';
import Image from "next/image";

 
export const Main = () => {
    const [ipAddressKaspi, setIpAddressKaspi] = useState("");
    const [ipAddressHalyk, setIpAddressHalyk] = useState(""); 
    const [kassaName, setKassaName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();

    if (!user || isLoading) {
        return <div className="p-6">
            <LoaderIcon className='animate-spin' />
        </div>;
    }
    
    const connectToPosHalyk = async () => {
        if (!ipAddressHalyk) {
            toast.error("Пожалуйста, введите IP адрес.");
            return;
        }

        setIsLoading(true);

        try {
            localStorage.setItem('posIpAddressHalyk', ipAddressHalyk + ':8080');
            toast.success("Успешно подключено к POS-терминалу Halyk");
        } catch (error) {
            toast.error("Произошла ошибка при подключении к POS-терминалу Halyk");
            console.error("Error connecting to POS terminal:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const connectToPosKaspi = async () => {
        if (!ipAddressKaspi || !kassaName) {
            toast.error("Пожалуйста, введите IP адрес и имя кассы.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    targetUrl: `https://${ipAddressKaspi}:8080/v2/register?name=${kassaName}` ,
                    targetMethod: 'GET'
                })
            })
            if (!response.ok) {
                const errorData = await response.json(); 
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            const data = await response.json()
            // const response = await api.post(`/api/pos/v2/register?name=${kassaName}`)
            // const response = await api.get(`https://${ipAddress + ':8080'}/v2/register?name=${kassaName}`)
            const storage = new TokenStorage();
            storage.saveToStorage(
                data.accessToken,
                data.refreshToken,
            )
            localStorage.setItem('posIpAddressKaspi', ipAddressKaspi + ':8080');
            toast.success("Успешно подключено к POS-терминалу Kaspi");
        }
        catch (error) {
            toast.error("Произошла ошибка при подключении к POS-терминалу Kaspi");
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
                    <span>{`https://www.reco.kz/api/webhook/${user?.publicMetadata.organizationId}`}</span>
                    <Image src='/instructions/first-step.png' alt='first step' width={350} height={150} />
                    <span>Выберите ниже поле &quot;Транзакции&quot; и нажмите &quot;Сохранить&quot;</span>
                    <Image src='/instructions/first-step-2.png' alt='first step 2' width={350} height={150} />
                </div>
            </div>
            <div>
                <p className='text-lg font-bold'>Подключение терминалов</p>
                <div className='flex space-x-8'>
                    <div>
                        <p className='text-lg'>Kaspi pos-терминал</p>
                        <div className='flex space-x-2'>
                            <p>1. Найдите IP адрес POS-терминала</p>
                        </div>
                        <div className='flex flex-col items-center justify-center space-y-2'>
                            <div className='flex space-x-2'>
                                <p>2. Установить связь с POS-терминалом</p>
                            </div>
                            <div className='space-y-2'>
                                <label className="flex flex-col w-full">
                                    Введите IP адрес POS-терминала
                                    <input 
                                        type="text" 
                                        className='p-2 border border-2 border-gray rounded-xl' 
                                        placeholder="192.168.80.4"
                                        onChange={(e) => setIpAddressKaspi(e.target.value)}
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
                                    onClick={connectToPosKaspi}
                                >
                                    Подключить
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className='text-lg'>Halyk pos-терминал</p>
                        <div className='flex space-x-2'>
                            <p>1. Найдите IP адрес POS-терминала</p>
                        </div>
                        <div className='flex flex-col items-center justify-center space-y-2'>
                            <div className='flex space-x-2'>
                                <p>2. Установить связь с POS-терминалом</p>
                            </div>
                            <div className='space-y-2'>
                                <label className="flex flex-col w-full">
                                    Введите IP адрес POS-терминала
                                    <input 
                                        type="text" 
                                        className='p-2 border border-2 border-gray rounded-xl' 
                                        placeholder="192.168.80.4"
                                        onChange={(e) => setIpAddressHalyk(e.target.value)}
                                    />
                                </label>
                                <button 
                                    type="button"
                                    className='p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors'
                                    onClick={connectToPosHalyk}
                                >
                                    Подключить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/* Add your connection related components here */}
        </div>
    );
}