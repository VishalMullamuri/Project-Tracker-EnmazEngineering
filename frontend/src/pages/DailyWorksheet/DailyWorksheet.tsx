import { useCallback, useEffect, useRef, useState } from "react";
import type { TextareaHTMLAttributes } from "react";
import { useParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import SummaryCard from "../../components/dashboard/SummaryCard";
import type {
  DailyWorksheetResponse,
  DailyWorksheetTask,
  DailyWorksheetTaskStatus,
} from "../../services/dailyWorksheetService";

import {
  getDailyWorksheet,
  updateDailyWorksheet,
  deleteDailyWorksheet,
} from "../../services/dailyWorksheetService";

import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Hourglass,
  Plus,
  Trash2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type TaskField = "title" | "description" | "status" | "remarks";

/**
 * Every row gets a stable client-side key. Unsaved tasks have no `id`,
 * so without this, editing one new row would edit ALL new rows.
 * The key is never sent to the API.
 */
interface WorksheetTask extends DailyWorksheetTask {
  clientKey: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STATUS_OPTIONS: DailyWorksheetTaskStatus[] = [
  "Not Started",
  "In Progress",
  "Completed",
];

const statusStyles: Record<
  DailyWorksheetTaskStatus,
  { select: string; dot: string }
> = {
  "Not Started": {
    select: "border-slate-300 bg-white text-slate-600",
    dot: "bg-slate-400",
  },
  "In Progress": {
    select: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  Completed: {
    select: "border-green-200 bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
};

/*
  One grid definition shared by the column header and every task row,
  so the columns can never drift apart.
  Sl.No. | Task | Status | Comments | Action
  Below the `lg` breakpoint each row stacks into a labelled card.
*/
const rowGrid =
  "lg:grid lg:grid-cols-[56px_minmax(0,1.4fr)_176px_minmax(0,1.6fr)_64px] lg:gap-x-4";

const controlBase =
  "w-full rounded-lg border px-3 text-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

const fieldSurface = "border-slate-300 bg-white";

const ghostInput =
  "w-full h-8 rounded-md border border-transparent bg-transparent px-3 text-xs text-slate-500 outline-none transition-shadow placeholder:text-slate-400 hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30";

const mobileLabel =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 lg:hidden";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const formatLongDate = (value: string) =>
  parseLocalDate(value).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

let clientKeyCounter = 0;

const createClientKey = () => {
  clientKeyCounter += 1;

  return `new-${clientKeyCounter}`;
};

const toWorksheetTask = (task: DailyWorksheetTask): WorksheetTask => ({
  ...task,
  clientKey:
    typeof task.id === "number" ? `saved-${task.id}` : createClientKey(),
});

const serializeTask = (task: DailyWorksheetTask) =>
  JSON.stringify([
    task.title,
    task.description ?? "",
    task.status,
    task.remarks ?? "",
  ]);

/* -------------------------------------------------------------------------- */
/*  Auto-growing textarea (starts as one line, grows with the content)        */
/* -------------------------------------------------------------------------- */

const AutoGrowTextarea = ({
  value,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    element.style.height = "auto";

    const borders = element.offsetHeight - element.clientHeight;

    element.style.height = `${element.scrollHeight + borders}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      className={className}
      {...props}
    />
  );
};

/* -------------------------------------------------------------------------- */
/*  Task row                                                                  */
/* -------------------------------------------------------------------------- */

interface TaskRowProps {
  task: WorksheetTask;
  index: number;
  autoFocusTitle: boolean;
  onChange: (clientKey: string, field: TaskField, value: string) => void;
  onDelete: (task: WorksheetTask) => void;
}

const TaskRow = ({
  task,
  index,
  autoFocusTitle,
  onChange,
  onDelete,
}: TaskRowProps) => {
  const style = statusStyles[task.status] ?? statusStyles["Not Started"];
  const isCompleted = task.status === "Completed";

  return (
    <div
      className={`flex flex-col gap-4 px-6 py-4 transition-colors hover:bg-blue-50/40 lg:items-start ${rowGrid}`}
    >
      {/* Sl.No. */}
      <div className="hidden h-10 items-center justify-center text-sm font-medium tabular-nums text-slate-400 lg:flex">
        {index + 1}
      </div>

      {/* Task */}
      <div className="min-w-0">
        <span className={mobileLabel}>Task {index + 1}</span>

        <input
          type="text"
          value={task.title}
          placeholder="Enter task..."
          aria-label={`Task ${index + 1} name`}
          autoFocus={autoFocusTitle}
          onChange={(event) =>
            onChange(task.clientKey, "title", event.target.value)
          }
          className={`${controlBase} ${fieldSurface} h-10 font-semibold ${
            isCompleted ? "text-slate-400 line-through" : "text-slate-800"
          }`}
        />

        <input
          type="text"
          value={task.description ?? ""}
          placeholder="Add details (optional)"
          aria-label={`Task ${index + 1} details`}
          onChange={(event) =>
            onChange(task.clientKey, "description", event.target.value)
          }
          className={`${ghostInput} mt-1`}
        />
      </div>

      {/* Status */}
      <div className="min-w-0">
        <span className={mobileLabel}>Status</span>

        <div className="relative">
          <span
            className={`pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${style.dot}`}
          />

          <select
            value={task.status}
            aria-label={`Task ${index + 1} status`}
            onChange={(event) =>
              onChange(task.clientKey, "status", event.target.value)
            }
            className={`${controlBase} ${style.select} h-10 cursor-pointer appearance-none pl-8 pr-9 font-medium`}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            strokeWidth={2}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      {/* Comments */}
      <div className="min-w-0">
        <span className={mobileLabel}>Comments</span>

        <AutoGrowTextarea
          value={task.remarks ?? ""}
          placeholder="Enter comments..."
          aria-label={`Task ${index + 1} comments`}
          onChange={(event) =>
            onChange(task.clientKey, "remarks", event.target.value)
          }
          className={`${controlBase} ${fieldSurface} max-h-40 min-h-[40px] resize-none overflow-y-auto py-[9px] leading-5 text-slate-700`}
        />
      </div>

      {/* Action */}
      <div className="flex justify-end lg:justify-center">
        <button
          type="button"
          onClick={() => onDelete(task)}
          title="Delete task"
          aria-label={`Delete task ${index + 1}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const DailyWorksheet = () => {
  const { employeeId } = useParams<{
    employeeId: string;
  }>();

  const worksheetEmployeeId = employeeId ? Number(employeeId) : undefined;

  const employeeKey = String(worksheetEmployeeId ?? "self");

  const [selectedDate, setSelectedDate] = useState(
    formatLocalDate(new Date())
  );

  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>(
    {}
  );

  const [tasks, setTasks] = useState<WorksheetTask[]>([]);

  /* What the server currently has for each saved task (used to detect edits) */
  const [savedTasks, setSavedTasks] = useState<Record<number, string>>({});

  const [lastAddedKey, setLastAddedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");

  /* ---------------------------- derived values ---------------------------- */

  const employeeName = employeeNames[employeeKey] ?? "";

  const isToday = selectedDate === formatLocalDate(new Date());

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "Not Started"
  ).length;

  const progress =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const isDirty = tasks.some(
    (task) =>
      typeof task.id !== "number" ||
      savedTasks[task.id] !== serializeTask(task)
  );

  /* ------------------------------- loading -------------------------------- */

  const applyWorksheet = useCallback(
    (data: DailyWorksheetResponse | null) => {
      const incoming = data?.tasks ?? [];

      setTasks(incoming.map(toWorksheetTask));

      setSavedTasks(
        Object.fromEntries(
          incoming
            .filter((task) => typeof task.id === "number")
            .map((task) => [task.id as number, serializeTask(task)])
        )
      );

      if (data?.employee_name) {
        const name = data.employee_name;

        setEmployeeNames((previous) => ({
          ...previous,
          [employeeKey]: name,
        }));
      }
    },
    [employeeKey]
  );

  const fetchWorksheet = useCallback(
    () => getDailyWorksheet(selectedDate, worksheetEmployeeId),
    [selectedDate, worksheetEmployeeId]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setJustSaved(false);
      setLastAddedKey(null);
      setTasks([]);
      setSavedTasks({});

      try {
        const data = await fetchWorksheet();

        if (!cancelled) {
          applyWorksheet(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load the daily worksheet.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [fetchWorksheet, applyWorksheet]);

  /* Hide the "saved" confirmation after a few seconds */
  useEffect(() => {
    if (!justSaved) {
      return;
    }

    const timer = window.setTimeout(() => setJustSaved(false), 4000);

    return () => window.clearTimeout(timer);
  }, [justSaved]);

  /* ------------------------------- handlers ------------------------------- */

  const goToDate = (nextDate: string) => {
    if (!nextDate || nextDate === selectedDate) {
      return;
    }

    if (
      isDirty &&
      !window.confirm(
        "You have unsaved changes. Discard them and change the date?"
      )
    ) {
      return;
    }

    setSelectedDate(nextDate);
  };

  const changeDate = (days: number) => {
    const date = parseLocalDate(selectedDate);

    date.setDate(date.getDate() + days);

    goToDate(formatLocalDate(date));
  };

  const handleTaskChange = (
    clientKey: string,
    field: TaskField,
    value: string
  ) => {
    setJustSaved(false);

    setTasks((previous) =>
      previous.map((task) =>
        task.clientKey === clientKey
          ? {
              ...task,
              [field]:
                field === "status"
                  ? (value as DailyWorksheetTaskStatus)
                  : value,
            }
          : task
      )
    );
  };

  const handleAddTask = () => {
    const newTask: WorksheetTask = {
      clientKey: createClientKey(),
      title: "",
      description: "",
      status: "Not Started",
      remarks: "",
    };

    setJustSaved(false);
    setLastAddedKey(newTask.clientKey);
    setTasks((previous) => [...previous, newTask]);
  };

  const handleDeleteTask = async (task: WorksheetTask) => {
    if (typeof task.id !== "number") {
      setTasks((previous) =>
        previous.filter((item) => item.clientKey !== task.clientKey)
      );

      return;
    }

    if (!window.confirm("Delete this task? This can't be undone.")) {
      return;
    }

    try {
      setError("");

      await deleteDailyWorksheet(task.id);

      setTasks((previous) =>
        previous.filter((item) => item.clientKey !== task.clientKey)
      );
    } catch (err) {
      console.error(err);
      setError("Unable to delete the task.");
    }
  };

  const handleSave = async () => {
    if (tasks.length === 0) {
      return;
    }

    if (tasks.some((task) => !task.title.trim())) {
      setError("Please enter a task name for every row before saving.");

      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: DailyWorksheetTask[] = tasks.map((task) => ({
        ...(typeof task.id === "number" ? { id: task.id } : {}),
        title: task.title.trim(),
        description: task.description ?? null,
        status: task.status,
        remarks: task.remarks ?? null,
      }));

      await updateDailyWorksheet(selectedDate, worksheetEmployeeId, {
        tasks: payload,
      });

      applyWorksheet(await fetchWorksheet());

      setJustSaved(true);
    } catch (err) {
      console.error(err);
      setError("Unable to save the daily worksheet.");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------- render -------------------------------- */

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page heading + date controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Daily Worksheet
            </h1>

            <div className="mt-1.5 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {(employeeName || "Employee").charAt(0).toUpperCase()}
              </span>

              <p className="text-sm text-slate-500">
                {employeeName || "Employee"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => changeDate(-1)}
                aria-label="Previous day"
                className="flex h-full w-10 items-center justify-center rounded-l-lg text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft size={17} strokeWidth={2} />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => goToDate(event.target.value)}
                aria-label="Select date"
                className="h-full border-x border-slate-200 bg-transparent px-3 text-sm text-slate-700 outline-none focus:bg-blue-50/50"
              />

              <button
                type="button"
                onClick={() => changeDate(1)}
                aria-label="Next day"
                className="flex h-full w-10 items-center justify-center rounded-r-lg text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronRight size={17} strokeWidth={2} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => goToDate(formatLocalDate(new Date()))}
              disabled={isToday}
              className="h-10 rounded-lg border border-blue-200 bg-blue-50/50 px-4 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-blue-50/50"
            >
              Today
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Planned"
            value={tasks.length}
            subtitle={isToday ? "Tasks Today" : "Tasks Planned"}
            icon={<CalendarCheck size={28} className="text-blue-600" />}
            iconBg="bg-blue-100"
          />

          <SummaryCard
            title="In Progress"
            value={inProgressTasks}
            subtitle="Currently Running"
            icon={<Clock3 size={28} className="text-blue-600" />}
            iconBg="bg-blue-100"
          />

          <SummaryCard
            title="Completed"
            value={completedTasks}
            subtitle="Finished Tasks"
            icon={<CheckCircle2 size={28} className="text-green-600" />}
            iconBg="bg-green-100"
          />

          <SummaryCard
            title="Pending"
            value={pendingTasks}
            subtitle="Not Yet Done"
            icon={<Hourglass size={28} className="text-orange-600" />}
            iconBg="bg-orange-100"
          />
        </div>

        {/* Worksheet card */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {/* Card header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isToday ? "Today's Work" : "Work Log"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Tasks planned and worked on for {formatLongDate(selectedDate)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTask}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Task
            </button>
          </div>

          {loading ? (
            /* Loading skeleton */
            <div
              className="divide-y divide-slate-100"
              aria-busy="true"
            >
              <span className="sr-only">Loading worksheet...</span>

              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-4 px-6 py-5"
                >
                  <div className="h-4 w-6 rounded bg-slate-100" />
                  <div className="h-10 flex-1 rounded-lg bg-slate-100" />
                  <div className="hidden h-10 w-44 rounded-lg bg-slate-100 sm:block" />
                  <div className="hidden h-10 flex-[1.4] rounded-lg bg-slate-100 md:block" />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <ClipboardList
                  size={30}
                  strokeWidth={1.5}
                  className="text-blue-500"
                />
              </div>

              <h3 className="text-sm font-semibold text-slate-700">
                No Tasks Planned
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {isToday
                  ? "Add a task to start logging today's work."
                  : "Add a task to start logging work for this day."}
              </p>

              <button
                type="button"
                onClick={handleAddTask}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-4 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add your first task
              </button>
            </div>
          ) : (
            <>
              {/* Progress strip */}
              <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50/60 px-6 py-3">
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label="Completed tasks"
                  className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"
                >
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <span className="shrink-0 text-xs text-slate-500">
                  {completedTasks} of {tasks.length} completed
                </span>

                <span className="w-9 shrink-0 text-right text-xs font-semibold text-slate-800">
                  {progress}%
                </span>
              </div>

              {/* Column headers (desktop only) */}
              <div
                className={`hidden border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 lg:items-center ${rowGrid}`}
              >
                <div className="text-center">Sl.No.</div>
                <div className="px-3">Task</div>
                <div className="px-3">Status</div>
                <div className="px-3">Comments</div>
                <div className="text-center">Action</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100">
                {tasks.map((task, index) => (
                  <TaskRow
                    key={task.clientKey}
                    task={task}
                    index={index}
                    autoFocusTitle={task.clientKey === lastAddedKey}
                    onChange={handleTaskChange}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>

              {/* Add another task */}
              <button
                type="button"
                onClick={handleAddTask}
                className="flex w-full items-center justify-center gap-2 border-t border-dashed border-slate-200 py-3.5 text-sm font-medium text-slate-500 transition-colors hover:bg-blue-50/50 hover:text-blue-600"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add another task
              </button>

              {/* Footer: status + save */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                <div aria-live="polite">
                  {isDirty ? (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-600">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Unsaved changes
                    </span>
                  ) : justSaved ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                      <CheckCircle2 size={16} />
                      All changes saved
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">
                      {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Worksheet"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default DailyWorksheet;
