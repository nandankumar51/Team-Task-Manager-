export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function isOverdue(dueDate: string | Date, status: string) {
  return status !== "DONE" && new Date(dueDate).getTime() < Date.now();
}
