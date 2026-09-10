import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import SummaryCard from "../../components/dashboard/SummaryCard";
import {
  getDailyWorksheet,
  updateDailyWorksheet,
  deleteDailyWorksheet,
} from "../../services/dailyWorksheetService";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Hourglass,
  Trash2,
} from "lucide-react";

type TaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BLOCKED";

interface DailyWorksheetTask {
  id?: number;
  title: string;
  description?: string;
  status: string;
  remarks?: string;
}

interface DailyWorksheetData {
  employee_name?: string;
  tasks: DailyWorksheetTask[];
}

const statusSelectStyle: Record<TaskStatus, string> = {
  NOT_STARTED: "text-slate-600",
  IN_PROGRESS: "text-blue-600",
  COMPLETED: "text-green-600",
  BLOCKED: "text-red-600",
};

const inputClass =
  "w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow placeholder:text-slate-400";

const DailyWorksheet = () => {
  const { employeeId } = useParams<{
    employeeId: string;
  }>();

  const worksheetEmployeeId = employeeId
    ? Number(employeeId)
    : undefined;

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [worksheet, setWorksheet] =
    useState<DailyWorksheetData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWorksheet();
  }, [selectedDate, worksheetEmployeeId]);

  const loadWorksheet = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDailyWorksheet(
        selectedDate,
        worksheetEmployeeId
      );

      setWorksheet(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load the daily worksheet.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);

    date.setDate(date.getDate() - 1);

    setSelectedDate(
      date.toISOString().split("T")[0]
    );
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);

    date.setDate(date.getDate() + 1);

    setSelectedDate(
      date.toISOString().split("T")[0]
    );
  };

  const handleToday = () => {
    setSelectedDate(
      new Date().toISOString().split("T")[0]
    );
  };

  const handleTaskChange = (
    taskId: number | undefined,
    field: "title" | "description" | "status" | "remarks",
    value: string
  ) => {
    setWorksheet((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        tasks: previous.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                [field]: value,
              }
            : task
        ),
      };
    });
  };

  const handleAddTask = () => {
    const newTask: DailyWorksheetTask = {
      title: "",
      description: "",
      status: "NOT_STARTED",
      remarks: "",
    };

    setWorksheet((previous) => {
      if (!previous) {
        return {
          employee_name: "",
          tasks: [newTask],
        };
      }

      return {
        ...previous,
        tasks: [
          ...previous.tasks,
          newTask,
        ],
      };
    });
  };

  const handleDeleteTask = async (
    task: DailyWorksheetTask
  ) => {
    try {
      if (typeof task.id !== "number") {
        setWorksheet((previous) => {
          if (!previous) {
            return previous;
          }

          return {
            ...previous,
            tasks: previous.tasks.filter(
              (item) => item !== task
            ),
          };
        });

        return;
      }

      await deleteDailyWorksheet(task.id)

      setWorksheet((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          tasks: previous.tasks.filter(
            (item) => item.id !== task.id
          ),
        };
      });
    } catch (err) {
      console.error(err);
      setError("Unable to delete the task.");
    }
  };

  const handleSave = async () => {
    if (!worksheet) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const tasks = worksheet.tasks.map((task) => ({
        ...(typeof task.id === "number"
          ? { id: task.id }
          : {}),
        title: task.title,
        description: task.description ?? null,
        status: task.status,
        remarks: task.remarks ?? null,
      }));

      await updateDailyWorksheet(
        selectedDate,
        worksheetEmployeeId,
        { tasks }
      );

      await loadWorksheet();
    } catch (err) {
      console.error(err);
      setError("Unable to save the daily worksheet.");
    } finally {
      setSaving(false);
    }
  };

  const tasks = worksheet?.tasks ?? [];

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const pendingTasks = tasks.filter(
    (task) =>
      task.status === "NOT_STARTED" ||
      task.status === "BLOCKED"
  ).length;

  return (
    <Layout>
      <div className="space-y-6">

        {/* =====================================================
            HEADING
        ====================================================== */}

        <div className="flex items-center justify-between flex-wrap gap-4">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Daily Worksheet
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              {worksheet?.employee_name || "Employee"}
            </p>
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={handlePreviousDay}
              className="w-9 h-9 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              <ChevronLeft
                size={17}
                strokeWidth={2}
              />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(event.target.value)
              }
              className="h-9 px-3 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />

            <button
              type="button"
              onClick={handleNextDay}
              className="w-9 h-9 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              <ChevronRight
                size={17}
                strokeWidth={2}
              />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="h-9 px-4 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50/50 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Today
            </button>

          </div>

        </div>

        {/* =====================================================
            ERROR MESSAGE
        ====================================================== */}

        {error && (
          <div className="px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle
              size={16}
              className="shrink-0"
            />
            {error}
          </div>
        )}

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="grid grid-cols-4 gap-5">

          <SummaryCard
            title="Planned"
            value={tasks.length}
            subtitle="Tasks Today"
            icon={
              <CalendarCheck
                size={28}
                className="text-blue-600"
              />
            }
            iconBg="bg-blue-100"
          />

          <SummaryCard
            title="In Progress"
            value={inProgressTasks}
            subtitle="Currently Running"
            icon={
              <Clock3
                size={28}
                className="text-blue-600"
              />
            }
            iconBg="bg-blue-100"
          />

          <SummaryCard
            title="Completed"
            value={completedTasks}
            subtitle="Finished Tasks"
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
            subtitle="Not Yet Done"
            icon={
              <Hourglass
                size={28}
                className="text-orange-600"
              />
            }
            iconBg="bg-orange-100"
          />

        </div>

        {/* =====================================================
            WORKSHEET TABLE
        ====================================================== */}

        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">

          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 flex-wrap gap-3">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Today's Work
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Tasks planned and worked on for{" "}
                {selectedDate}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTask}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              + Add Task
            </button>

          </div>

          {loading ? (

            <div className="py-14 flex flex-col items-center justify-center">
              <p className="text-sm text-slate-500">
                Loading worksheet...
              </p>
            </div>

          ) : tasks.length === 0 ? (

            <div className="py-14 flex flex-col items-center justify-center">

              <ClipboardList
                size={40}
                strokeWidth={1.5}
                className="text-slate-300 mb-3"
              />

              <h3 className="text-sm font-semibold text-slate-700">
                No Tasks Planned
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Add a task to start logging today's work.
              </p>

            </div>

          ) : (

            <div className="w-full overflow-x-auto">

              <table className="w-full table-fixed">

                <thead className="bg-slate-50">

                  <tr className="text-[11px] uppercase tracking-wider text-slate-500">

                    <th className="py-3 px-5 text-center w-16 font-semibold">
                      Sl.No.
                    </th>

                    <th className="py-3 px-5 text-left w-[28%] font-semibold">
                      Task
                    </th>

                    <th className="py-3 px-5 text-left w-40 font-semibold">
                      Status
                    </th>

                    <th className="py-3 px-5 text-left font-semibold">
                      Comments
                    </th>

                    <th className="py-3 px-5 text-center w-20 font-semibold">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {tasks.map((task, index) => (

                    <tr
                      key={
                        typeof task.id === "number"
                          ? task.id
                          : `new-${index}`
                      }
                      className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/40 transition-colors"
                    >

                      <td className="py-4 px-5 text-center text-sm text-slate-500 align-top">
                        {index + 1}
                      </td>

                      <td className="py-4 px-5 align-top">

                        {typeof task.id !== "number" ? (

                          <input
                            type="text"
                            placeholder="Enter task..."
                            value={task.title}
                            onChange={(event) =>
                              handleTaskChange(
                                task.id,
                                "title",
                                event.target.value
                              )
                            }
                            className={inputClass}
                          />

                        ) : (

                          <div>
                            <div className="text-sm font-semibold text-slate-800 leading-snug">
                              {task.title}
                            </div>

                            {task.description && (
                              <div className="text-xs text-slate-500 mt-1 leading-snug">
                                {task.description}
                              </div>
                            )}
                          </div>

                        )}

                      </td>

                      <td className="py-4 px-5 align-top">

                        <select
                          value={task.status}
                          onChange={(event) =>
                            handleTaskChange(
                              task.id,
                              "status",
                              event.target.value
                            )
                          }
                          className={`${inputClass} bg-white font-medium ${
                            statusSelectStyle[
                              task.status as TaskStatus
                            ] ?? "text-slate-600"
                          }`}
                        >

                          <option value="NOT_STARTED">
                            Not Started
                          </option>

                          <option value="IN_PROGRESS">
                            In Progress
                          </option>

                          <option value="COMPLETED">
                            Completed
                          </option>

                          <option value="BLOCKED">
                            Blocked
                          </option>

                        </select>

                      </td>

                      <td className="py-4 px-5 align-top">

                        <textarea
                          value={task.remarks ?? ""}
                          placeholder="Enter comments..."
                          onChange={(event) =>
                            handleTaskChange(
                              task.id,
                              "remarks",
                              event.target.value
                            )
                          }
                          rows={2}
                          className={`${inputClass} resize-y min-h-[70px]`}
                        />

                      </td>

                      <td className="py-4 px-5 text-center align-top">

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteTask(task)
                          }
                          title="Delete task"
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center mx-auto hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                        >
                          <Trash2
                            size={14}
                            strokeWidth={2}
                          />
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* =====================================================
            ACTIONS
        ====================================================== */}

        <div className="flex justify-end">

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Saving..."
              : "Save Worksheet"}
          </button>

        </div>

      </div>
    </Layout>
  );
};

export default DailyWorksheet;