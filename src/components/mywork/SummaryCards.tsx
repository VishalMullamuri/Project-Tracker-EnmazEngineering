import {
  FolderKanban,
  ListTodo,
  Clock3,
  CheckCircle2,
} from "lucide-react";

type Props = {
  totalProjects: number;
  totalTasks: number;
  openTasks: number;
  closedTasks: number;
};

const Card = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-white rounded-xl shadow-sm border p-6 flex justify-between items-center">

    <div>

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>

    </div>

    <div
      className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}
    >
      {icon}
    </div>

  </div>
);

const SummaryCards = ({
  totalProjects,
  totalTasks,
  openTasks,
  closedTasks,
}: Props) => {

  return (

    <div className="grid grid-cols-4 gap-5 mb-8">

      <Card
        title="Projects"
        value={totalProjects}
        color="bg-blue-100"
        icon={
          <FolderKanban
            className="text-blue-600"
          />
        }
      />

      <Card
        title="Tasks"
        value={totalTasks}
        color="bg-purple-100"
        icon={
          <ListTodo
            className="text-purple-600"
          />
        }
      />

      <Card
        title="Open"
        value={openTasks}
        color="bg-orange-100"
        icon={
          <Clock3
            className="text-orange-600"
          />
        }
      />

      <Card
        title="Completed"
        value={closedTasks}
        color="bg-green-100"
        icon={
          <CheckCircle2
            className="text-green-600"
          />
        }
      />

    </div>

  );
};

export default SummaryCards;