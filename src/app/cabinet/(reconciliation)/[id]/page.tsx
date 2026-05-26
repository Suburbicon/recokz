import { ReportsForm } from "@/modules/reports/form";
import { ChatAssistantFab } from "@/modules/transactions/chat-modal";

export default async function Page() {
  return (
    <div className="p-6">
      <ReportsForm />
      <ChatAssistantFab />
    </div>
  );
}
