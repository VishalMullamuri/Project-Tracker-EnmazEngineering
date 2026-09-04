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

const ProjectSummary = ({ tasks }: Props) => {

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "Not Started"
  ).length;

  const teamMembers = new Set(
    tasks.map((task) => task.assigned_to)
  ).size;

  return (

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

      <SummaryCard
        title="Total Tasks"
        value={totalTasks}
        subtitle="All Tasks"
        icon={
          <ListChecks size={24} className="text-blue-600" strokeWidth={1.75} />
        }
        iconBg="bg-blue-50"
      />

      <SummaryCard
        title="Completed"
        value={completedTasks}
        subtitle="Successfully Done"
        valueColor="text-green-600"
        icon={
          <CheckCircle2 size={24} className="text-green-600" strokeWidth={1.75} />
        }
        iconBg="bg-green-50"
      />

      <SummaryCard
        title="Not Started"
        value={pendingTasks}
        subtitle="Remaining Tasks"
        valueColor="text-orange-500"
        icon={
          <Clock3 size={24} className="text-orange-500" strokeWidth={1.75} />
        }
        iconBg="bg-orange-50"
      />

      <SummaryCard
        title="Team Members"
        value={teamMembers}
        subtitle="Assigned Users"
        icon={
          <Users size={24} className="text-purple-600" strokeWidth={1.75} />
        }
        iconBg="bg-purple-50"
      />

    </div>

  );

};

export default ProjectSummary;
