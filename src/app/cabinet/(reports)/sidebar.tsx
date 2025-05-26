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
import Link from "next/link";
import LogoWhite from "@/shared/icons/logo-white.svg";

export function ReportsSidebar() {
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
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
