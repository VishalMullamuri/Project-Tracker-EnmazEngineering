import api from "../api/axios";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Ticket,
  Plus,
  Search,
  UserRound,
  MessageCircle,
  Send,
  Clock3,
  CheckCircle2,
  Eye,
  ChevronDown,
  X,
  Trash2,
} from "lucide-react";

import Layout from "../components/layout/Layout";
import SummaryCard from "../components/dashboard/SummaryCard";

type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

type TicketComment = { author: string; time: string; message: string };
type Department = { id: number; name: string; is_active: boolean };
type DepartmentEmployee = {
  id: number;
  user_id: number | null;
  name: string;
  email: string;
};

type ApiTicket = {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  category: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  created_by: number;
  department_id: number;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
};

type ApiComment = {
  id: number;
  ticket_id: number;
  employee_id: number;
  comment: string;
  created_at: string;
};

type SupportTicket = {
  backendId: number;
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: string;
  createdById: number;
  assignee: string;
  assigneeId: number | null;
  departmentId: number;
  createdAt: number;
  comments: TicketComment[];
};

const getCurrentUserId = (): number | null => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;

    const user = JSON.parse(raw) as {
      id?: number;
      user_id?: number;
      employee_id?: number;
    };

    const id = user.employee_id ?? user.id ?? user.user_id;
    return typeof id === "number" ? id : null;
  } catch {
    return null;
  }
};

const CURRENT_USER = (() => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "You";

    const user = JSON.parse(raw) as {
      name?: string;
      full_name?: string;
      email?: string;
    };

    return user.name || user.full_name || user.email || "You";
  } catch {
    return "You";
  }
})();

const priorities: TicketPriority[] = ["Low", "Medium", "High", "Urgent"];
const statuses: TicketStatus[] = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
];

const toUiStatus = (status: ApiTicket["status"]): TicketStatus => {
  const map: Record<ApiTicket["status"], TicketStatus> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };

  return map[status];
};

const toApiStatus = (status: TicketStatus): ApiTicket["status"] => {
  const map: Record<TicketStatus, ApiTicket["status"]> = {
    Open: "OPEN",
    "In Progress": "IN_PROGRESS",
    Resolved: "RESOLVED",
    Closed: "CLOSED",
  };

  return map[status];
};

const toUiPriority = (
  priority: ApiTicket["priority"],
): TicketPriority => {
  const map: Record<ApiTicket["priority"], TicketPriority> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    URGENT: "Urgent",
  };

  return map[priority];
};

const toApiPriority = (
  priority: TicketPriority,
): ApiTicket["priority"] =>
  priority.toUpperCase() as ApiTicket["priority"];

const formatCommentTime = (value: string) =>
  new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-red-50 text-red-600",
  "In Progress": "bg-blue-50 text-blue-600",
  Resolved: "bg-green-50 text-green-700",
  Closed: "bg-slate-100 text-slate-600",
};

const statusDots: Record<TicketStatus, string> = {
  Open: "bg-red-500",
  "In Progress": "bg-blue-500",
  Resolved: "bg-green-500",
  Closed: "bg-slate-400",
};

const priorityStyles: Record<TicketPriority, string> = {
  Low: "bg-green-50 text-green-700",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-rose-50 text-rose-600",
  Urgent: "bg-red-100 text-red-700",
};

const priorityDots: Record<TicketPriority, string> = {
  Low: "bg-green-500",
  Medium: "bg-amber-500",
  High: "bg-rose-500",
  Urgent: "bg-red-600",
};

const inputStyle =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentEmployees, setDepartmentEmployees] = useState<
    Record<number, DepartmentEmployee[]>
  >({});
  const [employeeNames, setEmployeeNames] = useState<
    Record<number, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | TicketStatus
  >("All");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [ownershipFilter, setOwnershipFilter] = useState<
    "All Tickets" | "Assigned to Me"
  >("All Tickets");
  const [sortOrder, setSortOrder] = useState("Newest First");
  const [comment, setComment] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] =
    useState<TicketPriority>("Medium");
  const [newDepartmentId, setNewDepartmentId] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");

  const selectedTicket = tickets.find(
    (ticket) => ticket.id === selectedTicketId,
  );

  const selectedDepartmentEmployees = selectedTicket
    ? departmentEmployees[selectedTicket.departmentId] ?? []
    : [];

  const newDepartmentEmployees = newDepartmentId
    ? departmentEmployees[Number(newDepartmentId)] ?? []
    : [];

  async function loadTickets() {
    const response = await api.get<ApiTicket[]>("/support-tickets");

    const mapped = response.data.map((ticket) => ({
      backendId: ticket.id,
      id: ticket.ticket_number,
      title: ticket.title,
      description: ticket.description,
      priority: toUiPriority(ticket.priority),
      status: toUiStatus(ticket.status),
      createdBy:
        employeeNames[ticket.created_by] ||
        `Employee #${ticket.created_by}`,
      createdById: ticket.created_by,
      assigneeId: ticket.assigned_to,
      assignee: ticket.assigned_to
        ? employeeNames[ticket.assigned_to] ||
          `Employee #${ticket.assigned_to}`
        : "Unassigned",
      departmentId: ticket.department_id,
      createdAt: new Date(ticket.created_at).getTime(),
      comments:
        tickets.find(
          (existing) => existing.backendId === ticket.id,
        )?.comments ?? [],
    }));

    setTickets(mapped);

    setSelectedTicketId((current) =>
      mapped.some((ticket) => ticket.id === current)
        ? current
        : mapped[0]?.id ?? "",
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setPageError("");

      try {
        const [departmentResponse, ticketResponse] = await Promise.all([
          api.get<Department[]>("/departments"),
          api.get<ApiTicket[]>("/support-tickets"),
        ]);

        const activeDepartments = departmentResponse.data.filter(
          (department) => department.is_active,
        );

        const employeeResponses = await Promise.all(
          activeDepartments.map(async (department) => {
            try {
              return {
                departmentId: department.id,
                employees: (
                  await api.get<DepartmentEmployee[]>(
                    `/departments/${department.id}/employees`,
                  )
                ).data,
              };
            } catch {
              return {
                departmentId: department.id,
                employees: [] as DepartmentEmployee[],
              };
            }
          }),
        );

        if (cancelled) return;

        const names: Record<number, string> = {};
        const employeeCache: Record<number, DepartmentEmployee[]> = {};

        employeeResponses.forEach(({ departmentId, employees }) => {
          employeeCache[departmentId] = employees;

          employees.forEach((employee) => {
            names[employee.id] = employee.name;
          });
        });

        setDepartments(activeDepartments);
        setDepartmentEmployees(employeeCache);
        setEmployeeNames(names);

        const mapped = ticketResponse.data.map((ticket) => ({
          backendId: ticket.id,
          id: ticket.ticket_number,
          title: ticket.title,
          description: ticket.description,
          priority: toUiPriority(ticket.priority),
          status: toUiStatus(ticket.status),
          createdBy:
            names[ticket.created_by] ||
            `Employee #${ticket.created_by}`,
          createdById: ticket.created_by,
          assigneeId: ticket.assigned_to,
          assignee: ticket.assigned_to
            ? names[ticket.assigned_to] ||
              `Employee #${ticket.assigned_to}`
            : "Unassigned",
          departmentId: ticket.department_id,
          createdAt: new Date(ticket.created_at).getTime(),
          comments: [],
        }));

        setTickets(mapped);
        setSelectedTicketId(mapped[0]?.id ?? "");
      } catch (error) {
        const detail = (
          error as {
            response?: { data?: { detail?: string } };
          }
        )?.response?.data?.detail;

        setPageError(
          detail ||
            "Could not load support tickets. Check the backend connection and sign-in status.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedTicket) return;

    let cancelled = false;

    async function loadComments() {
      try {
        const response = await api.get<ApiComment[]>(
          `/support-tickets/${selectedTicket!.backendId}/comments`,
        );

        if (cancelled) return;

        const comments = response.data.map((item) => ({
          author:
            employeeNames[item.employee_id] ||
            `Employee #${item.employee_id}`,
          time: formatCommentTime(item.created_at),
          message: item.comment,
        }));

        setTickets((current) =>
          current.map((ticket) =>
            ticket.backendId === selectedTicket!.backendId
              ? { ...ticket, comments }
              : ticket,
          ),
        );
      } catch {
        // Preserve ticket details if comments cannot load.
      }
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [selectedTicket?.backendId, employeeNames]);

  const counts = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "Open").length,
      inProgress: tickets.filter(
        (ticket) => ticket.status === "In Progress",
      ).length,
      resolved: tickets.filter(
        (ticket) => ticket.status === "Resolved",
      ).length,
    }),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        [
          ticket.id,
          ticket.title,
          ticket.description,
          ticket.createdBy,
          ticket.assignee,
        ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All Priorities" ||
        ticket.priority === priorityFilter;

      const currentUserId = getCurrentUserId();

      const matchesOwnership =
        ownershipFilter === "All Tickets" ||
        ticket.assigneeId === currentUserId;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesOwnership
      );
    });

    return result.sort((a, b) =>
      sortOrder === "Newest First"
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt,
    );
  }, [
    tickets,
    search,
    statusFilter,
    priorityFilter,
    ownershipFilter,
    sortOrder,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "All" ||
    priorityFilter !== "All Priorities" ||
    ownershipFilter !== "All Tickets";

  useEffect(() => {
    if (!showCreate) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowCreate(false);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCreate]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All Priorities");
    setOwnershipFilter("All Tickets");
  }

  function toggleStatusFilter(status: TicketStatus) {
    setStatusFilter((current) =>
      current === status ? "All" : status,
    );
  }

  async function updateTicket(
    ticketId: string,
    updates: Partial<SupportTicket>,
  ) {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket) return;

    setPageError("");
    setSaving(true);

    try {
      if (updates.status) {
        await api.patch(
          `/support-tickets/${ticket.backendId}/status`,
          { status: toApiStatus(updates.status) },
        );
      }

      if (Object.prototype.hasOwnProperty.call(updates, "assigneeId")) {
        await api.patch(
          `/support-tickets/${ticket.backendId}/assignment`,
          { assigned_to: updates.assigneeId ?? null },
        );
      }

      await loadTickets();
    } catch (error) {
      const detail = (
        error as {
          response?: { data?: { detail?: string } };
        }
      )?.response?.data?.detail;

      setPageError(
        detail || "Could not update the ticket. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTicket(ticket: SupportTicket) {
    const confirmed = window.confirm(
      `Delete ticket ${ticket.id}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setPageError("");
    setSaving(true);

    try {
      await api.delete(`/support-tickets/${ticket.backendId}`);

      const remaining = tickets.filter(
        (item) => item.backendId !== ticket.backendId,
      );

      setTickets(remaining);

      if (selectedTicketId === ticket.id) {
        setSelectedTicketId(remaining[0]?.id ?? "");
      }
    } catch (error) {
      const detail = (
        error as {
          response?: { data?: { detail?: string } };
        }
      )?.response?.data?.detail;

      setPageError(
        detail ||
          "Could not delete the ticket. The backend must support deleting tickets.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!comment.trim() || !selectedTicket) return;

    setPageError("");
    setSaving(true);

    try {
      await api.post(
        `/support-tickets/${selectedTicket.backendId}/comments`,
        { comment: comment.trim() },
      );

      setComment("");

      const response = await api.get<ApiComment[]>(
        `/support-tickets/${selectedTicket.backendId}/comments`,
      );

      const comments = response.data.map((item) => ({
        author:
          employeeNames[item.employee_id] ||
          `Employee #${item.employee_id}`,
        time: formatCommentTime(item.created_at),
        message: item.comment,
      }));

      setTickets((current) =>
        current.map((ticket) =>
          ticket.backendId === selectedTicket.backendId
            ? { ...ticket, comments }
            : ticket,
        ),
      );
    } catch (error) {
      const detail = (
        error as {
          response?: { data?: { detail?: string } };
        }
      )?.response?.data?.detail;

      setPageError(
        detail || "Could not add the comment. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newDepartmentId) {
      setPageError("Please select a department.");
      return;
    }

    setPageError("");
    setSaving(true);

    try {
      const response = await api.post<ApiTicket>(
        "/support-tickets",
        {
          title: newTitle.trim(),
          description: newDescription.trim(),
          priority: toApiPriority(newPriority),
          department_id: Number(newDepartmentId),
        },
      );

      if (newAssigneeId) {
        await api.patch(
          `/support-tickets/${response.data.id}/assignment`,
          { assigned_to: Number(newAssigneeId) },
        );
      }

      const ticketNumber = response.data.ticket_number;

      setShowCreate(false);
      setNewTitle("");
      setNewDescription("");
      setNewPriority("Medium");
      setNewDepartmentId("");
      setNewAssigneeId("");

      setStatusFilter("All");
      setPriorityFilter("All Priorities");
      setOwnershipFilter("All Tickets");
      setSortOrder("Newest First");
      setSearch("");

      await loadTickets();
      setSelectedTicketId(ticketNumber);
    } catch (error) {
      const detail = (
        error as {
          response?: { data?: { detail?: string } };
        }
      )?.response?.data?.detail;

      setPageError(
        detail || "Could not create the ticket. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="w-full min-w-0 space-y-5">
        {pageError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {pageError}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Loading support tickets...
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <CardButton
            label="Show all tickets"
            active={statusFilter === "All"}
            onClick={() => setStatusFilter("All")}
          >
            <SummaryCard
              title="Total Tickets"
              value={counts.total}
              subtitle="All Tickets"
              icon={<Ticket size={28} className="text-blue-600" />}
              iconBg="bg-blue-100"
            />
          </CardButton>

          <CardButton
            label="Filter by open tickets"
            active={statusFilter === "Open"}
            onClick={() => toggleStatusFilter("Open")}
          >
            <SummaryCard
              title="Open"
              value={counts.open}
              subtitle="Need Attention"
              icon={<Clock3 size={28} className="text-red-600" />}
              iconBg="bg-red-100"
            />
          </CardButton>

          <CardButton
            label="Filter by in progress tickets"
            active={statusFilter === "In Progress"}
            onClick={() => toggleStatusFilter("In Progress")}
          >
            <SummaryCard
              title="In Progress"
              value={counts.inProgress}
              subtitle="Currently Being Handled"
              icon={<Clock3 size={28} className="text-blue-600" />}
              iconBg="bg-blue-100"
            />
          </CardButton>

          <CardButton
            label="Filter by resolved tickets"
            active={statusFilter === "Resolved"}
            onClick={() => toggleStatusFilter("Resolved")}
          >
            <SummaryCard
              title="Resolved"
              value={counts.resolved}
              subtitle="Resolved Tickets"
              icon={<CheckCircle2 size={28} className="text-green-600" />}
              iconBg="bg-green-100"
            />
          </CardButton>
        </div>

        <section className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
            <div className="relative min-w-[220px] flex-1 basis-64">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ticket or employee..."
                aria-label="Search tickets"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-9 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <SelectField
              ariaLabel="Filter by priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              className="w-full sm:w-40"
            >
              <option>All Priorities</option>
              {[...priorities].reverse().map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectField>

            <SelectField
              ariaLabel="Filter tickets"
              value={ownershipFilter}
              onChange={(value) =>
                setOwnershipFilter(
                  value as "All Tickets" | "Assigned to Me",
                )
              }
              className="w-full sm:w-44"
            >
              <option>All Tickets</option>
              <option>Assigned to Me</option>
            </SelectField>

            <SelectField
              ariaLabel="Sort tickets"
              value={sortOrder}
              onChange={setSortOrder}
              className="w-full sm:w-40"
            >
              <option>Newest First</option>
              <option>Oldest First</option>
            </SelectField>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:ml-auto sm:w-auto"
            >
              <Plus size={17} />
              Create Ticket
            </button>
          </div>

          <div className="grid min-w-0 grid-cols-1 lg:min-h-[620px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="flex min-w-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-700">
                  My Tickets
                </h2>

                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {filteredTickets.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto lg:max-h-[640px]">
                {filteredTickets.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {filteredTickets.map((ticket) => {
                      const isSelected = selectedTicketId === ticket.id;

                      return (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicketId(ticket.id)}
                          aria-current={isSelected}
                          className={`block w-full min-w-0 border-l-[3px] p-3 text-left transition hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/40"
                              : "border-transparent"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-500">
                                #{ticket.id}
                              </p>

                              <h3 className="mt-1 break-words text-sm font-semibold text-slate-900">
                                {ticket.title}
                              </h3>
                            </div>

                            <StatusBadge status={ticket.status} />
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <PriorityBadge priority={ticket.priority} />
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <Avatar name={ticket.assignee} size="sm" />
                              <span className="truncate">
                                {ticket.assignee}
                              </span>
                            </span>

                            <span className="inline-flex shrink-0 items-center gap-1">
                              <Clock3 size={12} />
                              {formatAge(ticket.createdAt)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : tickets.length === 0 ? (
                  <EmptyState
                    message="No tickets yet"
                    hint="Raise your first ticket and the team will pick it up."
                    action={
                      <button
                        onClick={() => setShowCreate(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <Plus size={16} />
                        Create Ticket
                      </button>
                    }
                  />
                ) : (
                  <EmptyState
                    message="No tickets match these filters"
                    hint="Try a different search or clear your filters."
                    action={
                      <button
                        onClick={clearFilters}
                        className="mt-4 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Clear filters
                      </button>
                    }
                  />
                )}
              </div>

              <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                Showing {filteredTickets.length} of {tickets.length} tickets
              </div>
            </div>

            <div className="min-w-0 p-4 lg:p-6">
              {selectedTicket &&
              filteredTickets.some(
                (ticket) => ticket.id === selectedTicket.id,
              ) ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        #{selectedTicket.id}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatAge(selectedTicket.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedTicket.status} />

                      <button
                        type="button"
                        onClick={() => void deleteTicket(selectedTicket)}
                        disabled={saving}
                        aria-label="Delete ticket"
                        title="Delete ticket"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h2 className="mt-3 break-words text-xl font-bold text-slate-900">
                    {selectedTicket.title}
                  </h2>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {selectedTicket.description}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-3">
                    <Metadata label="Priority">
                      <PriorityBadge priority={selectedTicket.priority} />
                    </Metadata>

                    <Metadata label="Created by">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Avatar name={selectedTicket.createdBy} size="sm" />
                        {selectedTicket.createdBy}
                      </span>
                    </Metadata>

                    <Metadata label="Created on">
                      <span className="text-sm font-medium text-slate-700">
                        {new Date(
                          selectedTicket.createdAt,
                        ).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </Metadata>
                  </div>

                  <div className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="ticket-assignee"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Assigned to
                      </label>

                      <SelectField
                        id="ticket-assignee"
                        value={
                          selectedTicket.assigneeId === null
                            ? ""
                            : String(selectedTicket.assigneeId)
                        }
                        onChange={(value) =>
                          void updateTicket(selectedTicket.id, {
                            assigneeId: value ? Number(value) : null,
                          })
                        }
                      >
                        <option value="">Unassigned</option>

                        {selectedDepartmentEmployees.map((employee) => (
                          <option
                            key={employee.id}
                            value={employee.id}
                          >
                            {employee.name}
                          </option>
                        ))}
                      </SelectField>
                    </div>

                    <div>
                      <label
                        htmlFor="ticket-status"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Update status
                      </label>

                      <SelectField
                        id="ticket-status"
                        value={selectedTicket.status}
                        onChange={(value) =>
                          void updateTicket(selectedTicket.id, {
                            status: value as TicketStatus,
                          })
                        }
                      >
                        {statuses.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </SelectField>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Comments & Updates
                      </h3>

                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        <MessageCircle size={13} />
                        {selectedTicket.comments.length}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {selectedTicket.comments.map((item, index) => {
                        const isMine = item.author === CURRENT_USER;

                        return (
                          <div
                            key={`${item.author}-${index}`}
                            className="flex gap-3"
                          >
                            <Avatar name={item.author} />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800">
                                  {item.author}
                                </span>

                                <span className="text-xs text-slate-400">
                                  {item.time}
                                </span>
                              </div>

                              <div
                                className={`mt-1.5 rounded-xl rounded-tl-sm border px-3.5 py-2.5 ${
                                  isMine
                                    ? "border-blue-100 bg-blue-50/60"
                                    : "border-slate-100 bg-slate-50"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-600">
                                  {item.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {selectedTicket.comments.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                          <MessageCircle
                            size={22}
                            className="mx-auto mb-2 text-slate-300"
                          />

                          <p className="text-sm text-slate-500">
                            No comments yet. Add an update below.
                          </p>
                        </div>
                      )}
                    </div>

                    <form
                      onSubmit={addComment}
                      className="mt-5 flex gap-3 border-t border-slate-100 pt-5"
                    >
                      <Avatar name={CURRENT_USER} />

                      <div className="min-w-0 flex-1">
                        <textarea
                          rows={2}
                          value={comment}
                          onChange={(event) =>
                            setComment(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" &&
                              (event.ctrlKey || event.metaKey)
                            ) {
                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          aria-label="Add a comment"
                          placeholder="Add a comment or update..."
                          className="w-full min-w-0 resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-xs text-slate-400">
                            Press Ctrl + Enter to send
                          </p>

                          <button
                            type="submit"
                            disabled={!comment.trim() || saving}
                            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Send size={15} />
                            Send
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center text-center lg:min-h-[560px]">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                    <Eye size={26} className="text-slate-300" />
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    Select a ticket to view details
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose a ticket from the list or change your filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {showCreate && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowCreate(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-ticket-title"
              className="my-auto w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <Ticket size={20} className="text-blue-600" />
                  </div>

                  <div>
                    <h2
                      id="create-ticket-title"
                      className="text-lg font-bold text-slate-900"
                    >
                      Create Ticket
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                      Provide details about the issue or request.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  aria-label="Close"
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={createTicket}>
                <div className="space-y-4 p-5">
                  <div>
                    <label
                      htmlFor="new-department"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Department
                    </label>

                    <SelectField
                      id="new-department"
                      value={newDepartmentId}
                      onChange={(value) => {
                        setNewDepartmentId(value);
                        setNewAssigneeId("");
                      }}
                    >
                      <option value="">Select department</option>

                      {departments.map((department) => (
                        <option
                          key={department.id}
                          value={department.id}
                        >
                          {department.name}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label
                        htmlFor="new-title"
                        className="text-sm font-medium text-slate-700"
                      >
                        Ticket title
                      </label>

                      <span className="text-xs text-slate-400">
                        {newTitle.length}/150
                      </span>
                    </div>

                    <input
                      id="new-title"
                      autoFocus
                      required
                      maxLength={150}
                      value={newTitle}
                      onChange={(event) =>
                        setNewTitle(event.target.value)
                      }
                      placeholder="Briefly describe your issue"
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-description"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="new-description"
                      required
                      rows={4}
                      value={newDescription}
                      onChange={(event) =>
                        setNewDescription(event.target.value)
                      }
                      placeholder="Explain what help you need..."
                      className={`${inputStyle} resize-y`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-assignee"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Assign to
                    </label>

                    <SelectField
                      id="new-assignee"
                      value={newAssigneeId}
                      onChange={setNewAssigneeId}
                    >
                      <option value="">Unassigned</option>

                      {newDepartmentEmployees.map((employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.name}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div>
                    <p className="mb-1.5 text-sm font-medium text-slate-700">
                      Priority
                    </p>

                    <div
                      role="group"
                      aria-label="Priority"
                      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    >
                      {priorities.map((item) => {
                        const active = newPriority === item;

                        return (
                          <button
                            key={item}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setNewPriority(item)}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              active
                                ? `border-transparent ring-2 ring-blue-500 ${priorityStyles[item]}`
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${priorityDots[item]}`}
                            />
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !newDepartmentId ||
                      newTitle.trim().length < 3 ||
                      !newDescription.trim()
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={16} />
                    Create Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function CardButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`block w-full rounded-xl text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        active ? "ring-2 ring-blue-500" : "hover:-translate-y-0.5"
      }`}
    >
      {children}
    </button>
  );
}

function SelectField({
  value,
  onChange,
  children,
  className = "",
  ariaLabel,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  id?: string;
}) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputStyle} cursor-pointer appearance-none pr-9`}
      >
        {children}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDots[status]}`} />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${priorityStyles[priority]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${priorityDots[priority]}`} />
      {priority}
    </span>
  );
}

function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const dimensions =
    size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";

  if (name === "Unassigned") {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 ${dimensions}`}
      >
        <UserRound size={size === "sm" ? 12 : 15} />
      </span>
    );
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700 ${dimensions}`}
    >
      {initials}
    </span>
  );
}

function Metadata({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-medium text-slate-500">
        {label}
      </p>
      <div className="break-words">{children}</div>
    </div>
  );
}

function EmptyState({
  message,
  hint,
  action,
}: {
  message: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
        <Ticket size={26} className="text-slate-300" />
      </div>

      <p className="text-sm font-medium text-slate-700">{message}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{hint}</p>
      {action}
    </div>
  );
}

function formatAge(timestamp: number) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60000),
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}