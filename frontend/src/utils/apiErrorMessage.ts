export function apiErrorMessage(detail: unknown): string {
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" &&
        item !== null &&
        "msg" in item
          ? String(
              (item as { msg: string }).msg
            )
          : String(item)
      )
      .join("\n");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return "An unexpected error occurred.";
}