"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { BookOpenIcon, FileTextIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import LogoWhite from "@/shared/icons/logo-white.svg";
import { api } from "@/shared/lib/trpc/client";

export function ReportsSidebar() {
  const { user } = useUser();
  const router = useRouter();

  const { mutateAsync: clearOrganization } =
    api.organization.clearOrganization.useMutation({
      onSuccess: async () => {
        await user?.reload();
        router.push("/onboarding");
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });

  const handleResetOrganization = async () => {
    await clearOrganization();
  };

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <div className="p-4">
          <LogoWhite />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/cabinet">
                    <FileTextIcon />
                    <span>Отчеты</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/cabinet/dictionary">
                    <BookOpenIcon />
                    <span>Справочники</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton onClick={handleResetOrganization}>
          <span>Выйти</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
