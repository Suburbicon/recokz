"use client";

import { Button } from "@/shared/ui/button";
import { useClerk } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Button variant="ghost" onClick={handleLogout}>
      Выйти
    </Button>
  );
}
