import SummaryCard from "../dashboard/SummaryCard";

import {
  ListChecks,
  CheckCircle2,
  Clock3,
  Users,
} from "lucide-react";

import type { Task } from "./AddTaskModal";

type Props = {
  tasks: Task[];
};

const ProjectSummary = ({
  tasks,
}: Props) => {

  const totalTasks =
    tasks.length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "Completed"
    ).length;

  const pendingTasks =
    tasks.filter(
      (task) =>
        task.status === "Pending"
    ).length;

  const teamMembers =
    new Set(
      tasks.map(
        (task) =>
          task.assigned_to
      )
    ).size;

  return (

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

      <SummaryCard
        title="Total Tasks"
        value={totalTasks}
        subtitle="All Tasks"
        icon={
          <ListChecks
            size={28}
            className="text-blue-600"
          />
        }
        iconBg="bg-blue-100"
      />

      <SummaryCard
        title="Completed"
        value={completedTasks}
        subtitle="Successfully Done"
        valueColor="text-green-600"
        icon={
          <CheckCircle2
            size={28}
            className="text-green-600"
          />
        }
        iconBg="bg-green-100"
      />

      <SummaryCard
        title="Pending"
        value={pendingTasks}
        subtitle="Remaining Tasks"
        valueColor="text-orange-500"
        icon={
          <Clock3
            size={28}
            className="text-orange-500"
          />
        }
        iconBg="bg-orange-100"
      />

      <SummaryCard
        title="Team Members"
        value={teamMembers}
        subtitle="Assigned Users"
        icon={
          <Users
            size={28}
            className="text-purple-600"
          />
        }
        iconBg="bg-purple-100"
      />

    </div>

  );

};

export default ProjectSummary;