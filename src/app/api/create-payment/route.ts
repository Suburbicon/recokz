import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, amount, transactionIds, type, companyId } = body;

    if (!organizationId || !amount) {
      return NextResponse.json({ message: 'organizationId and amount are required' }, { status: 400 });
    }

    // const channelName = 'public-store-001';
    const channelName = `public-store-${companyId}`;
    const eventName = `create-payment-command-${type}`;
    // const eventName = 'create-payment-command';
    const payload = { 
        amount,
        organization_id: organizationId,
        transaction_ids: transactionIds
    };

    console.log(`Sending command to channel '${channelName}' with payload:`, payload);

    await pusher.trigger(channelName, eventName, payload);

    return NextResponse.json({ message: 'Command sent to agent successfully', status: 'wait' }, { status: 200 });

  } catch (error) {
    console.error("Error sending command:", error);
    return NextResponse.json({ message: 'Failed to send command' }, { status: 500 });
  }
}