import { Badge } from "@/components/ui";
import { TaskPriority, TaskStatus } from "@/types";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const labels: Record<TaskStatus, string> = {
    TODO: "To do",
    IN_PROGRESS: "In progress",
    DONE: "Done"
  };

  const tones: Record<TaskStatus, "slate" | "cyan" | "green"> = {
    TODO: "slate",
    IN_PROGRESS: "cyan",
    DONE: "green"
  };

  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const tones: Record<TaskPriority, "slate" | "amber" | "red"> = {
    LOW: "slate",
    MEDIUM: "amber",
    HIGH: "red"
  };

  return <Badge tone={tones[priority]}>{priority.toLowerCase()}</Badge>;
}
