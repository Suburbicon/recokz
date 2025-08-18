
import { NextResponse } from 'next/server';
import https from 'https';

function isValidPublicIp(ip: string): boolean {
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('127.')) {
    return false;
  }

  return true;
}

const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetUrl, targetMethod, targetBody } = body; // Ожидаем, что клиент пришлет URL в формате "https://192.168.0.109:8080"

    if (!targetUrl) {
      return NextResponse.json({ error: 'targetUrl is required' }, { status: 400 });
    }

    const url = new URL(targetUrl);
    if (isValidPublicIp(url.hostname)) {
        return NextResponse.json({ error: 'Invalid or forbidden IP address' }, { status: 403 });
    }

    let externalResponse = null;

    if (targetMethod === 'GET') {
        console.log('KASSPIIII')
        externalResponse = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...{ agent: insecureAgent },
        });
        console.log(externalResponse)
    } else {
        externalResponse = await fetch(targetUrl, {
            method: targetMethod,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(targetBody)
        });
    }

    if (!externalResponse.ok) {
        return NextResponse.json(
            { error: `External server error: ${externalResponse.statusText}` },
            { status: externalResponse.status }
        );
    }
    
    const data = await externalResponse.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}