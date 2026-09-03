import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "../components/layout/Layout";
import api from "../api/axios";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Hourglass,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";

type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "Delayed";

type Employee = {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type PlannerTask = {
  id: number;
  task: string;
  employee_id: number;
  employee_name: string | null;
  week_start: string;
  status: TaskStatus;
  remarks: string | null;
  created_by: number;
  created_at: string | null;
  updated_at: string | null;
};

type PlannerForm = {
  task: string;
  employee_id: string;
  status: TaskStatus;
  remarks: string;
};

const statusOptions: TaskStatus[] = [
  "Not Started",
  "In Progress",
  "Completed",
  "Delayed",
];

const getStatusStyle = (status: TaskStatus) => {
  switch (status) {
    case "Not Started":
      return "bg-white border border-gray-300 text-gray-700";

    case "In Progress":
      return "bg-blue-100 text-blue-600";

    case "Completed":
      return "bg-green-100 text-green-600";

    case "Delayed":
      return "bg-red-100 text-red-600";

    default:
      return "bg-white border border-gray-300 text-gray-700";
  }
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const getAvatarStyle = (name: string) => {
  const styles = [
    "bg-blue-100 text-blue-600",
    "bg-orange-100 text-orange-600",
    "bg-purple-100 text-purple-600",
    "bg-pink-100 text-pink-600",
  ];

  const index =
    name
      .split("")
      .reduce(
        (sum, char) => sum + char.charCodeAt(0),
        0
      ) % styles.length;

  return styles[index];
};

const getCurrentMonday = () => {
  const today = new Date();

  const day = today.getDay();

  const difference =
    day === 0 ? -6 : 1 - day;

  const monday = new Date(today);

  monday.setDate(
    today.getDate() + difference
  );

  monday.setHours(0, 0, 0, 0);

  return monday;
};

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const WeeklyPlanner = () => {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isManager =
    user.role === "MANAGER" ||
    user.role === "ADMIN";

  const [tasks, setTasks] =
    useState<PlannerTask[]>([]);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [currentWeekStart, setCurrentWeekStart] =
    useState<Date>(
      getCurrentMonday()
    );

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | TaskStatus>("All");

  const [openModal, setOpenModal] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState<PlannerTask | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [employeesLoading, setEmployeesLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedTaskIds, setSelectedTaskIds] =
    useState<number[]>([]);

  const [newTask, setNewTask] =
    useState<PlannerForm>({
      task: "",
      employee_id: "",
      status: "Not Started",
      remarks: "",
    });

  /*
   * =========================================================
   * WEEK
   * =========================================================
   */

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getWeekEnd = (startDate: Date) => {
    const endDate = new Date(
      startDate
    );

    endDate.setDate(
      endDate.getDate() + 6
    );

    return endDate;
  };

  const weekEnd =
    getWeekEnd(currentWeekStart);

  const weekLabel = `${formatDisplayDate(
    currentWeekStart
  )} - ${formatDisplayDate(weekEnd)}`;

  const weekStartApi =
    formatDateForApi(
      currentWeekStart
    );

  const goToPreviousWeek = () => {
    const previousWeek =
      new Date(currentWeekStart);

    previousWeek.setDate(
      previousWeek.getDate() - 7
    );

    setSelectedTaskIds([]);
    setCurrentWeekStart(
      previousWeek
    );
  };

  const goToNextWeek = () => {
    const nextWeek =
      new Date(currentWeekStart);

    nextWeek.setDate(
      nextWeek.getDate() + 7
    );

    setSelectedTaskIds([]);
    setCurrentWeekStart(
      nextWeek
    );
  };

  const goToCurrentWeek = () => {
    setSelectedTaskIds([]);
    setCurrentWeekStart(
      getCurrentMonday()
    );
  };

  /*
   * =========================================================
   * LOAD EMPLOYEES
   * =========================================================
   */

  const fetchEmployees = useCallback(
    async () => {
      try {
        setEmployeesLoading(true);

        const response =
          await api.get<Employee[]>(
            "/employees"
          );

        const teamMembers =
          response.data.filter(
            (employee) =>
              employee.role ===
              "TEAM_MEMBER"
          );

        setEmployees(
          teamMembers
        );
      } catch (err: any) {
        console.error(
          "Failed to load employees:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Failed to load employees."
        );
      } finally {
        setEmployeesLoading(false);
      }
    },
    []
  );

  /*
   * =========================================================
   * LOAD WEEKLY PLANNER TASKS
   * =========================================================
   */

  const fetchTasks = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<
            PlannerTask[]
          >(
            "/weekly-planner",
            {
              params: {
                week_start:
                  weekStartApi,
              },
            }
          );

        setTasks(
          response.data
        );
      } catch (err: any) {
        console.error(
          "Failed to load weekly planner:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Failed to load weekly planner."
        );

        setTasks([]);
      } finally {
        setLoading(false);
      }
    },
    [weekStartApi]
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    setSelectedTaskIds([]);
    fetchTasks();
  }, [fetchTasks]);

  /*
   * =========================================================
   * STATISTICS
   * =========================================================
   */

  const totalTasks =
    tasks.length;

  const delayedTasks =
    tasks.filter(
      (task) =>
        task.status === "Delayed"
    ).length;

  const inProgressTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "In Progress"
    ).length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "Completed"
    ).length;

  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const filteredTasks =
    useMemo(() => {
      return tasks.filter(
        (task) => {
          const employeeName =
            task.employee_name ||
            "";

          const remarks =
            task.remarks || "";

          const matchesSearch =
            task.task
              .toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            employeeName
              .toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            remarks
              .toLowerCase()
              .includes(
                search.toLowerCase()
              );

          if (
            statusFilter ===
            "All"
          ) {
            return matchesSearch;
          }

          return (
            matchesSearch &&
            task.status ===
              statusFilter
          );
        }
      );
    }, [
      tasks,
      search,
      statusFilter,
    ]);

  /*
   * =========================================================
   * TASK SELECTION
   * =========================================================
   */

  const toggleTaskSelection = (
    taskId: number
  ) => {
    setSelectedTaskIds(
      (previous) =>
        previous.includes(taskId)
          ? previous.filter(
              (id) => id !== taskId
            )
          : [
              ...previous,
              taskId,
            ]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds =
      filteredTasks.map(
        (task) => task.id
      );

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every(
        (id) =>
          selectedTaskIds.includes(
            id
          )
      );

    if (allSelected) {
      setSelectedTaskIds(
        (previous) =>
          previous.filter(
            (id) =>
              !visibleIds.includes(
                id
              )
          )
      );

      return;
    }

    setSelectedTaskIds(
      (previous) => [
        ...new Set([
          ...previous,
          ...visibleIds,
        ]),
      ]
    );
  };

  const allVisibleTasksSelected =
    filteredTasks.length > 0 &&
    filteredTasks.every(
      (task) =>
        selectedTaskIds.includes(
          task.id
        )
    );

  /*
   * =========================================================
   * MOVE SELECTED TASKS TO NEXT WEEK
   * =========================================================
   */

  const handleMoveToNextWeek =
  async () => {
    if (
      selectedTaskIds.length ===
      0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Copy ${selectedTaskIds.length} selected task(s) to next week?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const nextWeek =
        new Date(
          currentWeekStart
        );

      nextWeek.setDate(
        nextWeek.getDate() + 7
      );

      const nextWeekStart =
        formatDateForApi(
          nextWeek
        );

      const selectedTasks =
        tasks.filter((task) =>
          selectedTaskIds.includes(
            task.id
          )
        );

      await Promise.all(
        selectedTasks.map(
          (task) =>
            api.post(
              "/weekly-planner",
              {
                task: task.task,
                employee_id:
                  task.employee_id,
                week_start:
                  nextWeekStart,
                status:
                  task.status,
                remarks:
                  task.remarks || null,
              }
            )
        )
      );

      setSelectedTaskIds([]);

      /*
       * Reload the current week.
       *
       * Original tasks remain here because
       * we created copies instead of updating
       * their week_start.
       */
      await fetchTasks();
    } catch (err: any) {
      console.error(
        "Failed to copy weekly planner tasks:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Failed to copy selected tasks."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * FORM
   * =========================================================
   */

  const resetForm = () => {
    setNewTask({
      task: "",
      employee_id: "",
      status: "Not Started",
      remarks: "",
    });

    setEditingTask(null);
  };

  /*
   * =========================================================
   * ADD TASK
   * =========================================================
   */

  const handleAddTask = async () => {
    if (
      !newTask.task.trim() ||
      !newTask.employee_id
    ) {
      setError(
        "Task and employee are required."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.post(
        "/weekly-planner",
        {
          task:
            newTask.task.trim(),

          employee_id:
            Number(
              newTask.employee_id
            ),

          week_start:
            weekStartApi,

          status:
            newTask.status,

          remarks:
            newTask.remarks.trim() ||
            null,
        }
      );

      resetForm();
      setOpenModal(false);

      await fetchTasks();
    } catch (err: any) {
      console.error(
        "Failed to create weekly planner task:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Failed to create task."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * EDIT TASK
   * =========================================================
   */

  const handleEditTask =
    async () => {
      if (!editingTask) {
        return;
      }

      if (
        !editingTask.task.trim()
      ) {
        setError(
          "Task cannot be empty."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");

        await api.put(
          `/weekly-planner/${editingTask.id}`,
          {
            task:
              editingTask.task.trim(),

            employee_id:
              editingTask.employee_id,

            week_start:
              editingTask.week_start,

            status:
              editingTask.status,

            remarks:
              editingTask.remarks?.trim() ||
              null,
          }
        );

        setEditingTask(null);

        await fetchTasks();
      } catch (err: any) {
        console.error(
          "Failed to update weekly planner task:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Failed to update task."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * =========================================================
   * DELETE TASK
   * =========================================================
   */

  const handleDeleteTask =
    async (
      taskId: number
    ) => {
      const confirmed =
        window.confirm(
          "Are you sure you want to delete this task?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        await api.delete(
          `/weekly-planner/${taskId}`
        );

        setSelectedTaskIds(
          (previous) =>
            previous.filter(
              (id) => id !== taskId
            )
        );

        await fetchTasks();
      } catch (err: any) {
        console.error(
          "Failed to delete weekly planner task:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Failed to delete task."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * =========================================================
   * EDIT FORM HELPERS
   * =========================================================
   */

  const openEditModal = (
    task: PlannerTask
  ) => {
    setEditingTask({
      ...task,
    });

    setError("");
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <Layout>

      {/* =====================================================
          WEEK NAVIGATION
      ====================================================== */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

        <div className="flex items-center justify-between px-5 py-5">

          <button
            onClick={
              goToPreviousWeek
            }
            className="
              flex
              items-center
              gap-2
              text-sm
              font-medium
              text-gray-600
              hover:text-blue-600
              transition
            "
          >

            <span
              className="
                w-10
                h-10
                rounded-lg
                border
                border-gray-300
                bg-white
                flex
                items-center
                justify-center
                hover:bg-gray-100
                transition
              "
            >
              <ChevronLeft size={18} />
            </span>

            Previous

          </button>

          <div className="flex flex-col items-center gap-3">

            <h2 className="text-xl font-bold text-slate-800">
              {weekLabel}
            </h2>

            <button
              onClick={
                goToCurrentWeek
              }
              className="
                flex
                items-center
                gap-2
                px-5
                py-2
                text-sm
                font-medium
                rounded-lg
                border
                border-blue-200
                bg-white
                text-blue-600
                hover:bg-blue-50
                transition
              "
            >

              <CalendarDays size={17} />

              This Week

            </button>

          </div>

          <button
            onClick={
              goToNextWeek
            }
            className="
              flex
              items-center
              gap-2
              text-sm
              font-medium
              text-gray-600
              hover:text-blue-600
              transition
            "
          >

            Next

            <span
              className="
                w-10
                h-10
                rounded-lg
                border
                border-gray-300
                bg-white
                flex
                items-center
                justify-center
                hover:bg-gray-100
                transition
              "
            >
              <ChevronRight size={18} />
            </span>

          </button>

        </div>

      </div>

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (

        <div className="
          mt-4
          px-4
          py-3
          rounded-lg
          border
          border-red-200
          bg-red-50
          text-sm
          text-red-700
          flex
          items-center
          justify-between
          gap-4
        ">

          <span>
            {error}
          </span>

          <button
            onClick={() =>
              setError("")
            }
            className="
              text-red-600
              font-medium
              hover:text-red-800
            "
          >
            Dismiss
          </button>

        </div>

      )}

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="grid grid-cols-4 gap-5 mt-6">

        {/* TOTAL */}

        <div
          className="
            bg-white
            rounded-xl
            border
            border-gray-200
            shadow-sm
            hover:shadow-md
            transition
            p-5
          "
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 font-medium">
                Total Tasks
              </p>

              <h2 className="text-4xl font-bold mt-2 text-slate-900">
                {totalTasks}
              </h2>

            </div>

            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100">

              <FileText
                size={28}
                className="text-blue-600"
              />

            </div>

          </div>

          <p className="text-sm text-gray-400 mt-5">
            All Tasks
          </p>

        </div>

        {/* DELAYED */}

        <div
          className="
            bg-white
            rounded-xl
            border
            border-gray-200
            shadow-sm
            hover:shadow-md
            transition
            p-5
          "
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 font-medium">
                Delayed
              </p>

              <h2 className="text-4xl font-bold mt-2 text-red-600">
                {delayedTasks}
              </h2>

            </div>

            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-red-100">

              <Hourglass
                size={28}
                className="text-red-600"
              />

            </div>

          </div>

          <p className="text-sm text-gray-400 mt-5">
            Need Attention
          </p>

        </div>

        {/* IN PROGRESS */}

        <div
          className="
            bg-white
            rounded-xl
            border
            border-gray-200
            shadow-sm
            hover:shadow-md
            transition
            p-5
          "
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 font-medium">
                In Progress
              </p>

              <h2 className="text-4xl font-bold mt-2 text-blue-600">
                {inProgressTasks}
              </h2>

            </div>

            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100">

              <Clock3
                size={28}
                className="text-blue-600"
              />

            </div>

          </div>

          <p className="text-sm text-gray-400 mt-5">
            Currently Running
          </p>

        </div>

        {/* COMPLETED */}

        <div
          className="
            bg-white
            rounded-xl
            border
            border-gray-200
            shadow-sm
            hover:shadow-md
            transition
            p-5
          "
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 font-medium">
                Completed
              </p>

              <h2 className="text-4xl font-bold mt-2 text-green-600">
                {completedTasks}
              </h2>

            </div>

            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-green-100">

              <CheckCircle2
                size={28}
                className="text-green-600"
              />

            </div>

          </div>

          <p className="text-sm text-gray-400 mt-5">
            Finished Tasks
          </p>

        </div>

      </div>

      {/* =====================================================
          TASK TABLE CONTAINER
      ====================================================== */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-6 overflow-hidden">

        {/* ===================================================
            TABLE HEADER
        ==================================================== */}

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">

          {/* SEARCH */}

          <div className="relative">

            <Search
              size={16}
              className="
                absolute
                left-3
                top-3
                text-gray-400
              "
            />

            <input
              type="text"
              placeholder="Search task..."
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
              }}
              className="
                w-64
                pl-9
                pr-3
                py-2
                text-sm
                border
                border-gray-300
                rounded-lg
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />

          </div>

          {/* RIGHT CONTROLS */}

          <div className="flex items-center gap-3">

            {/* STATUS FILTER */}

            <div className="relative">

              <Filter
                size={16}
                className="
                  absolute
                  left-3
                  top-2.5
                  text-gray-400
                  pointer-events-none
                "
              />

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target
                      .value as
                      | "All"
                      | TaskStatus
                  );
                }}
                className="
                  pl-9
                  pr-8
                  py-2
                  text-sm
                  border
                  border-gray-300
                  rounded-lg
                  bg-white
                  text-gray-700
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              >

                <option value="All">
                  All
                </option>

                {statusOptions.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* MOVE SELECTED TASKS */}

            {isManager &&
              selectedTaskIds.length >
                0 && (

                <button
                  onClick={
                    handleMoveToNextWeek
                  }
                  disabled={saving}
                  className="
                    px-4
                    py-2
                    text-sm
                    font-medium
                    border
                    border-blue-600
                    text-blue-600
                    bg-white
                    rounded-lg
                    hover:bg-blue-50
                    transition
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  Move to Next Week (
                  {selectedTaskIds.length}
                  )
                </button>

              )}

            {/* ADD TASK */}

            {isManager && (

              <button
                onClick={() => {
                  resetForm();
                  setError("");
                  setOpenModal(true);
                }}
                disabled={
                  employeesLoading
                }
                className="
                  px-4
                  py-2
                  text-sm
                  font-medium
                  bg-blue-600
                  text-white
                  rounded-lg
                  hover:bg-blue-700
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                + Add Task
              </button>

            )}

          </div>

        </div>

        {/* ===================================================
            TABLE
        ==================================================== */}

        <div className="w-full overflow-x-auto">

          <table className="w-full min-w-[1100px] table-fixed">

            <thead className="bg-gray-50">

              <tr className="text-sm text-gray-600">

                {isManager && (

                  <th
                    className="
                      py-3
                      px-5
                      text-center
                      w-16
                      font-semibold
                    "
                  >
                    <input
                      type="checkbox"
                      checked={
                        allVisibleTasksSelected
                      }
                      onChange={
                        toggleSelectAll
                      }
                      disabled={
                        filteredTasks.length ===
                          0 ||
                        saving
                      }
                      className="
                        w-4
                        h-4
                        cursor-pointer
                      "
                      title="Select all"
                    />
                  </th>

                )}

                <th
                  className="
                    py-3
                    px-5
                    text-center
                    w-20
                    font-semibold
                  "
                >
                  Sl.No.
                </th>

                <th
                  className="
                    py-3
                    px-5
                    text-left
                    w-[27%]
                    font-semibold
                  "
                >
                  Task
                </th>

                <th
                  className="
                    py-3
                    px-5
                    text-left
                    w-[22%]
                    font-semibold
                  "
                >
                  Employee
                </th>

                <th
                  className="
                    py-3
                    px-5
                    text-center
                    w-[15%]
                    font-semibold
                  "
                >
                  Status
                </th>

                <th
                  className="
                    py-3
                    px-5
                    text-left
                    w-[24%]
                    font-semibold
                  "
                >
                  Remarks
                </th>

                {isManager && (

                  <th
                    className="
                      py-3
                      px-5
                      text-center
                      w-[12%]
                      font-semibold
                    "
                  >
                    Action
                  </th>

                )}

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={
                      isManager
                        ? 7
                        : 5
                    }
                    className="
                      py-12
                      text-center
                      text-sm
                      text-gray-500
                    "
                  >
                    Loading weekly planner...
                  </td>

                </tr>

              ) : (

                filteredTasks.map(
                  (task, index) => (

                    <tr
                      key={task.id}
                      className="
                        border-b
                        border-gray-100
                        hover:bg-blue-50
                        transition-colors
                        duration-200
                      "
                    >

                      {/* SELECT */}

                      {isManager && (

                        <td
                          className="
                            py-3
                            px-5
                            text-center
                          "
                        >
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(
                              task.id
                            )}
                            onChange={() =>
                              toggleTaskSelection(
                                task.id
                              )
                            }
                            disabled={
                              saving
                            }
                            className="
                              w-4
                              h-4
                              cursor-pointer
                            "
                          />
                        </td>

                      )}

                      {/* NUMBER */}

                      <td
                        className="
                          py-3
                          px-5
                          text-center
                          text-sm
                          font-medium
                          text-gray-700
                        "
                      >
                        {index + 1}
                      </td>

                      {/* TASK */}

                      <td
                        className="
                          py-3
                          px-5
                          font-medium
                          text-gray-800
                          truncate
                        "
                      >
                        {task.task}
                      </td>

                      {/* EMPLOYEE */}

                      <td
                        className="
                          py-3
                          px-5
                        "
                      >

                        <div className="flex items-center gap-3">

                          <div
                            className={`
                              w-9
                              h-9
                              rounded-full
                              flex
                              items-center
                              justify-center
                              text-xs
                              font-bold
                              shrink-0
                              ${getAvatarStyle(
                                task.employee_name ||
                                  "Employee"
                              )}
                            `}
                          >
                            {getInitials(
                              task.employee_name ||
                                "Employee"
                            )}
                          </div>

                          <span className="
                            text-sm
                            font-medium
                            text-gray-700
                            truncate
                          ">
                            {task.employee_name ||
                              "Unknown"}
                          </span>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td
                        className="
                          py-3
                          px-5
                          text-center
                        "
                      >

                        <span
                          className={`
                            inline-flex
                            items-center
                            justify-center
                            px-3
                            py-1.5
                            rounded-lg
                            text-sm
                            font-medium
                            whitespace-nowrap
                            ${getStatusStyle(
                              task.status
                            )}
                          `}
                        >
                          {task.status}
                        </span>

                      </td>

                      {/* REMARKS */}

                      <td
                        className="
                          py-3
                          px-5
                          text-left
                        "
                      >

                        <span className="
                          text-sm
                          text-gray-600
                          truncate
                          block
                        ">
                          {task.remarks ||
                            "-"}
                        </span>

                      </td>

                      {/* ACTION */}

                      {isManager && (

                        <td
                          className="
                            py-3
                            px-5
                            text-center
                          "
                        >

                          <div className="
                            flex
                            items-center
                            justify-center
                            gap-2
                          ">

                            {/* EDIT */}

                            <button
                              onClick={() =>
                                openEditModal(
                                  task
                                )
                              }
                              disabled={saving}
                              className="
                                w-9
                                h-9
                                rounded-lg
                                border
                                border-gray-300
                                bg-white
                                text-blue-600
                                flex
                                items-center
                                justify-center
                                hover:bg-blue-50
                                transition
                                disabled:opacity-50
                              "
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>

                            {/* DELETE */}

                            <button
                              onClick={() =>
                                handleDeleteTask(
                                  task.id
                                )
                              }
                              disabled={saving}
                              className="
                                w-9
                                h-9
                                rounded-lg
                                border
                                border-gray-300
                                bg-white
                                text-red-600
                                flex
                                items-center
                                justify-center
                                hover:bg-red-50
                                transition
                                disabled:opacity-50
                              "
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>

                        </td>

                      )}

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            EMPTY STATE
        ==================================================== */}

        {!loading &&
          filteredTasks.length === 0 && (

            <div className="
              py-10
              flex
              flex-col
              items-center
              justify-center
              text-gray-500
            ">

              <div className="text-5xl mb-3">
                📋
              </div>

              <h3 className="
                text-lg
                font-semibold
                text-gray-700
              ">
                No Tasks Found
              </h3>

              <p className="
                text-sm
                text-gray-500
                mt-1
              ">
                {search ||
                statusFilter !==
                  "All"
                  ? "Try changing your search or filter."
                  : "There are no tasks for this week."}
              </p>

            </div>

          )}

        {/* ===================================================
            FOOTER
        ==================================================== */}

        <div className="
          flex
          items-center
          justify-between
          px-5
          py-4
          border-t
          border-gray-200
          bg-gray-50
        ">

          <p className="text-sm text-gray-500">

            Showing

            <span className="
              font-semibold
              text-gray-700
              mx-1
            ">
              {filteredTasks.length}
            </span>

            task(s)

          </p>

        </div>

      </div>

      {/* =====================================================
          ADD TASK MODAL
      ====================================================== */}

      {openModal && isManager && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/40
            p-4
          "
        >

          <div className="
            w-full
            max-w-xl
            bg-white
            rounded-xl
            shadow-xl
          ">

            <div className="
              px-5
              py-4
              border-b
              border-gray-200
            ">

              <h2 className="
                text-lg
                font-semibold
                text-gray-800
              ">
                Add Weekly Task
              </h2>

            </div>

            <div className="p-5 space-y-5">

              {/* TASK */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  mb-2
                ">
                  Task
                </label>

                <input
                  type="text"
                  value={newTask.task}
                  onChange={(event) =>
                    setNewTask({
                      ...newTask,
                      task:
                        event.target.value,
                    })
                  }
                  placeholder="Enter task name"
                  className="
                    w-full
                    px-3
                    py-2.5
                    text-sm
                    border
                    border-gray-300
                    rounded-lg
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />

              </div>

              {/* EMPLOYEE */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  mb-2
                ">
                  Employee
                </label>

                <select
                  value={
                    newTask.employee_id
                  }
                  onChange={(event) =>
                    setNewTask({
                      ...newTask,
                      employee_id:
                        event.target.value,
                    })
                  }
                  disabled={
                    employeesLoading
                  }
                  className="
                    w-full
                    px-3
                    py-2.5
                    text-sm
                    border
                    border-gray-300
                    rounded-lg
                    bg-white
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    disabled:bg-gray-100
                  "
                >

                  <option value="">
                    {employeesLoading
                      ? "Loading employees..."
                      : "Select employee"}
                  </option>

                  {employees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={
                          employee.id
                        }
                      >
                        {employee.name}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* STATUS */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  mb-2
                ">
                  Status
                </label>

                <select
                  value={
                    newTask.status
                  }
                  onChange={(event) =>
                    setNewTask({
                      ...newTask,
                      status:
                        event.target
                          .value as TaskStatus,
                    })
                  }
                  className="
                    w-full
                    px-3
                    py-2.5
                    text-sm
                    border
                    border-gray-300
                    rounded-lg
                    bg-white
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                >

                  {statusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* REMARKS */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  mb-2
                ">
                  Remarks
                </label>

                <textarea
                  value={
                    newTask.remarks
                  }
                  onChange={(event) =>
                    setNewTask({
                      ...newTask,
                      remarks:
                        event.target.value,
                    })
                  }
                  placeholder="Add remarks"
                  rows={4}
                  className="
                    w-full
                    px-3
                    py-2.5
                    text-sm
                    border
                    border-gray-300
                    rounded-lg
                    resize-none
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />

              </div>

            </div>

            <div className="
              flex
              justify-end
              gap-3
              px-5
              py-4
              border-t
              border-gray-200
            ">

              <button
                onClick={() => {
                  resetForm();
                  setOpenModal(false);
                }}
                disabled={saving}
                className="
                  px-4
                  py-2
                  text-sm
                  font-medium
                  border
                  border-gray-300
                  bg-white
                  text-gray-700
                  rounded-lg
                  hover:bg-gray-100
                  transition
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                onClick={
                  handleAddTask
                }
                disabled={saving}
                className="
                  px-4
                  py-2
                  text-sm
                  font-medium
                  bg-blue-600
                  text-white
                  rounded-lg
                  hover:bg-blue-700
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {saving
                  ? "Adding..."
                  : "Add Task"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          EDIT TASK MODAL
      ====================================================== */}

      {editingTask && isManager && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/40
            p-4
          "
        >

          <div className="
            w-full
            max-w-xl
            bg-white
            rounded-xl
            shadow-xl
          ">

            <div className="
              px-5
              py-4
              border-b
              border-gray-200
            ">

              <h2 className="
                text-lg
                font-semibold
                text-gray-800
              ">
                Edit Weekly Task
              </h2>

            </div>

            <div className="p-5 space-y-5">

              {/* TASK */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  mb-2
                ">
                  Task
                </label>

                <input
                  type="text"
                  value={
                    editingTask.task
                  }
                  onChange={(event) =>
                    setEditingTask({
                      ...editingTask,
                      task:
                        event.target.value,
                    })
                  }
                  className="
                    w-full
                    px-3
                    py-2.5
                    text-sm
                    border
                    border-gray-300
                    rounded-lg
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />

              </div>

              {/* EMPLOYEE */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  mb-2
                ">
                  Employee
                </label>

                <select
                  value={String(
                    editingTask.employee_id
                  )}
                  onChange={(event) =>
                    setEditingTask({
                      ...editingTask,
                      employee_id:
                        Number(
                          event.target
                            .value
                        ),
                    })
                  }
                  disabled={
                    employeesLoading
                  }
                  className="
                    w-full
                    px-3
                    py-2.5
                    text-sm
                    border
                    border-gray-300
                    rounded-lg
                    bg-white
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    disabled:bg-gray-100
                  "
                >

                  {employees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={
                          employee.id
                        }
                      >
                        {employee.name}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* STATUS */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  mb-2
                ">
                  Status
                </label>

                <select
                  value={
                    editingTask.status
                  }
                  onChange={(event) =>
                    setEditingTask({
                      ...editingTask,
                      status:
                        event.target
                          .value as TaskStatus,
                    })
                  }
                  className="
                    w-full
                    px-3
                    py-2.5
                    text-sm
                    border
                    border-gray-300
                    rounded-lg
                    bg-white
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                >

                  {statusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* REMARKS */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  mb-2
                ">
                  Remarks
                </label>

                <textarea
                  value={
                    editingTask.remarks ||
                    ""
                  }
                  onChange={(event) =>
                    setEditingTask({
                      ...editingTask,
                      remarks:
                        event.target.value,
                    })
                  }
                  rows={4}
                  className="
                    w-full
                    px-3
                    py-2.5
                    text-sm
                    border
                    border-gray-300
                    rounded-lg
                    resize-none
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />

              </div>

            </div>

            <div className="
              flex
              justify-end
              gap-3
              px-5
              py-4
              border-t
              border-gray-200
            ">

              <button
                onClick={() =>
                  setEditingTask(null)
                }
                disabled={saving}
                className="
                  px-4
                  py-2
                  text-sm
                  font-medium
                  border
                  border-gray-300
                  bg-white
                  text-gray-700
                  rounded-lg
                  hover:bg-gray-100
                  transition
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                onClick={
                  handleEditTask
                }
                disabled={saving}
                className="
                  px-4
                  py-2
                  text-sm
                  font-medium
                  bg-blue-600
                  text-white
                  rounded-lg
                  hover:bg-blue-700
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </div>

        </div>

      )}

    </Layout>
  );
};

export default WeeklyPlanner;