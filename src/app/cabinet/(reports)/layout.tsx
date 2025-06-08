import { SidebarProvider } from "@/shared/ui/sidebar";
import { ReportsSidebar } from "./sidebar";
import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ReportsSidebar />
      <main className="w-full">{children}</main>

      {/* Floating Create Report Button */}
      <Button
        asChild
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        size="icon"
      >
        <Link href="/cabinet/create">
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </SidebarProvider>
  );
}
