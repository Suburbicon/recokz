"use client";

import { Button } from "@/shared/ui/button";
import { useQueryState } from "nuqs";

export function ReportsTableTabs() {
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "all",
    parse: (value) => value as "all" | "in_progress" | "done",
  });

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={tab === "all" ? "default" : "outline"}
        onClick={() => setTab("all")}
      >
        Все
      </Button>
      <Button
        size="sm"
        variant={tab === "in_progress" ? "default" : "outline"}
        onClick={() => setTab("in_progress")}
      >
        В работе
      </Button>
      <Button
        size="sm"
        variant={tab === "done" ? "default" : "outline"}
        onClick={() => setTab("done")}
      >
        Завершенные
      </Button>
    </div>
  );
}
