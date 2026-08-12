type StatusProps = {
  status: string;
};

const StatusBadge = ({ status }: StatusProps) => {
  const styles: Record<string, string> = {
    Completed: "bg-green-100 text-green-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Delayed: "bg-red-100 text-red-600",

    COMPLETED: "bg-green-100 text-green-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    DELAYED: "bg-red-100 text-red-600",
  };

  return (
    <span
      className={`px-4 py-1 rounded-lg text-sm font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;