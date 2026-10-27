import { cn } from "@/lib/utils";

export function PostStatus({ completed = true }: { completed?: boolean }) {
  return (
    <span className={cn("text-sm", completed ? "text-muted-foreground" : "font-medium text-primary")}>
      {completed ? "已完结" : "未完结"}
    </span>
  );
}
