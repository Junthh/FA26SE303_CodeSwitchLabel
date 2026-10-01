import { useState, useMemo, useEffect } from "react";
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  X, 
  AlertTriangle,
  Calendar,
  Eye,
  Users,
  ChevronDown
} from "lucide-react";
import Pagination from "../../../components/Pagination/Pagination";
import { 
  TASK_MANAGER_ACCENT, 
  SPEAKER_ACCENT, 
  REVIEWER_ACCENT, 
  DANGER, 
  SUCCESS 
} from "../../../constants/theme";

// Helper format ngày
const formatDateToVN = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

const formatDateToISO = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes("-")) return dateStr;
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
};

// Component Custom Date Picker hiển thị chuẩn DD/MM/YYYY
const VNFormatDatePicker = ({ label, value, onChange, minDateIso }) => {
  const handleInputChange = (e) => {
    let input = e.target.value.replace(/\D/g, "");
    if (input.length > 8) input = input.slice(0, 8);

    if (input.length >= 5) {
      input = `${input.slice(0, 2)}/${input.slice(2, 4)}/${input.slice(4)}`;
    } else if (input.length >= 3) {
      input = `${input.slice(0, 2)}/${input.slice(2)}`;
    }

    if (input.length === 10) {
      const iso = formatDateToISO(input);
      onChange(iso);
    } else {
      onChange(input);
    }
  };

  const handleNativePickerChange = (e) => {
    const selectedIso = e.target.value;
    if (selectedIso) {
      onChange(selectedIso);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
        <Calendar className="w-3 h-3" /> {label}
      </label>

      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="dd/mm/yyyy"
          value={value.includes("-") ? formatDateToVN(value) : value}
          onChange={handleInputChange}
          maxLength={10}
          className="w-full pl-3 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-[#25272E] border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-[#1C1D22] focus:border-gray-400 dark:focus:border-gray-500 rounded-lg outline-none font-sans text-gray-900 dark:text-gray-100 transition-all font-medium border"
        />

        <div className="absolute right-2 flex items-center justify-center cursor-pointer">
          <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-400 pointer-events-none" />
          <input
            type="date"
            min={minDateIso}
            value={value.includes("-") ? value : formatDateToISO(value)}
            onChange={handleNativePickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

const ADMIN_USERS_STORAGE_KEY = "admin_users_list_v2";

const DEFAULT_USERS = [
  { id: "USR-001", name: "Quản Lý", email: "manager@fpt.edu.vn", role: "Task Manager", status: "Active", createdAt: "15/01/2026" },
  { id: "USR-002", name: "Trần Minh Tâm", email: "tam.reviewer@fpt.edu.vn", role: "Reviewer", status: "Active", createdAt: "20/01/2026" },
  { id: "USR-005", name: "Nguyễn Văn Anh", email: "anh.reviewer@fpt.edu.vn", role: "Reviewer", status: "Active", createdAt: "06/02/2026" },
  { id: "USR-006", name: "Trần Thị Bình", email: "binh.reviewer@fpt.edu.vn", role: "Reviewer", status: "Active", createdAt: "07/02/2026" },
  { id: "USR-007", name: "Lê Văn Cường", email: "cuong.reviewer@fpt.edu.vn", role: "Reviewer", status: "Active", createdAt: "08/02/2026" },
  { id: "USR-008", name: "Phạm Thị Dung", email: "dung.reviewer@fpt.edu.vn", role: "Reviewer", status: "Active", createdAt: "09/02/2026" },
  { id: "USR-009", name: "Hoàng Văn Em", email: "em.reviewer@fpt.edu.vn", role: "Reviewer", status: "Active", createdAt: "10/02/2026" },
  { id: "USR-010", name: "Vũ Thị Phương", email: "phuong.reviewer@fpt.edu.vn", role: "Reviewer", status: "Active", createdAt: "11/02/2026" },
  { id: "USR-011", name: "Đặng Văn Giang", email: "giang.reviewer@fpt.edu.vn", role: "Reviewer", status: "Active", createdAt: "12/02/2026" },
  { id: "USR-012", name: "Bùi Thị Hải", email: "hai.reviewer@fpt.edu.vn", role: "Reviewer", status: "Active", createdAt: "13/02/2026" },
  { id: "USR-013", name: "Đinh Văn Hùng", email: "hung.reviewer@fpt.edu.vn", role: "Reviewer", status: "Active", createdAt: "14/02/2026" },
  { id: "USR-003", name: "Phạm Thu Thảo", email: "thao.speaker@fpt.edu.vn", role: "Speaker", status: "Active", createdAt: "01/02/2026" },
  { id: "USR-004", name: "Lê Hoàng Nam", email: "nam.speaker@fpt.edu.vn", role: "Speaker", status: "Active", createdAt: "05/02/2026" },
  { id: "USR-014", name: "Đỗ Thị Khánh", email: "khanh.speaker@fpt.edu.vn", role: "Speaker", status: "Active", createdAt: "15/02/2026" },
  { id: "USR-015", name: "Hoàng Văn Lâm", email: "lam.speaker@fpt.edu.vn", role: "Speaker", status: "Active", createdAt: "16/02/2026" },
  { id: "USR-016", name: "Ngô Thị Minh", email: "minh.speaker@fpt.edu.vn", role: "Speaker", status: "Active", createdAt: "17/02/2026" },
  { id: "USR-017", name: "Dương Văn Nghĩa", email: "nghia.speaker@fpt.edu.vn", role: "Speaker", status: "Active", createdAt: "18/02/2026" },
  { id: "USR-018", name: "Lý Thị Oanh", email: "oanh.speaker@fpt.edu.vn", role: "Speaker", status: "Active", createdAt: "19/02/2026" },
  { id: "USR-019", name: "Võ Văn Phong", email: "phong.speaker@fpt.edu.vn", role: "Speaker", status: "Active", createdAt: "20/02/2026" },
  { id: "USR-020", name: "Đoàn Thị Quỳnh", email: "quynh.speaker@fpt.edu.vn", role: "Speaker", status: "Active", createdAt: "21/02/2026" },
  { id: "USR-021", name: "Trịnh Văn Rồng", email: "rong.speaker@fpt.edu.vn", role: "Speaker", status: "Active", createdAt: "22/02/2026" },
];

const FULL_SPEAKER_TASKS = [
  { id: "TSK-001", title: "Nhiệm vụ ghi âm thuật ngữ công nghệ", topic: "IT/Technology", target: 100, reviewed: 65, status: "Đang thực hiện", statusType: "in-progress" },
  { id: "TSK-002", title: "Nhiệm vụ ghi âm hội thoại giáo dục phổ thông", topic: "Education", target: 80, reviewed: 80, status: "Hoàn thành", statusType: "completed" },
  { id: "TSK-003", title: "Thu âm giao tiếp đời sống hàng ngày", topic: "Daily Life", target: 150, reviewed: 135, status: "Đang thực hiện", statusType: "in-progress" },
  { id: "TSK-004", title: "Đọc ngữ liệu lệnh thoại nhà thông minh", topic: "IT/Technology", target: 120, reviewed: 40, status: "Đang thực hiện", statusType: "in-progress" },
  { id: "TSK-005", title: "Thu âm kịch bản hỏi đáp y tế cơ bản", topic: "Daily Life", target: 90, reviewed: 0, status: "Chưa bắt đầu", statusType: "pending" },
  { id: "TSK-006", title: "Ghi âm bài giảng toán học trực tuyến", topic: "Education", target: 110, reviewed: 110, status: "Hoàn thành", statusType: "completed" },
  { id: "TSK-007", title: "Đọc tin tức kinh tế và thị trường tài chính", topic: "Daily Life", target: 70, reviewed: 20, status: "Đang thực hiện", statusType: "in-progress" },
  { id: "TSK-008", title: "Thu âm dữ liệu hội thoại bán hàng tự động", topic: "IT/Technology", target: 130, reviewed: 130, status: "Hoàn thành", statusType: "completed" },
  { id: "TSK-009", title: "Ghi âm phát âm bảng chữ cái Tiếng Việt cho trẻ em", topic: "Education", target: 60, reviewed: 0, status: "Chưa bắt đầu", statusType: "pending" },
  { id: "TSK-010", title: "Đọc tài liệu hướng dẫn lập trình Python", topic: "IT/Technology", target: 100, reviewed: 85, status: "Đang thực hiện", statusType: "in-progress" },
  { id: "TSK-011", title: "Thu âm mẫu hội thoại đặt xe trực tuyến", topic: "Daily Life", target: 85, reviewed: 85, status: "Hoàn thành", statusType: "completed" },
  { id: "TSK-012", title: "Đọc thuật ngữ trí tuệ nhân tạo nâng cao", topic: "IT/Technology", target: 140, reviewed: 30, status: "Đang thực hiện", statusType: "in-progress" },
  { id: "TSK-013", title: "Ghi âm bài luyện nói Tiếng Anh giao tiếp", topic: "Education", target: 95, reviewed: 0, status: "Chưa bắt đầu", statusType: "pending" },
  { id: "TSK-014", title: "Thu âm các đoạn hội thoại tư vấn tài chính", topic: "Daily Life", target: 110, reviewed: 110, status: "Hoàn thành", statusType: "completed" },
  { id: "TSK-015", title: "Đọc lệnh điều khiển thiết bị IoT trong nhà", topic: "IT/Technology", target: 75, reviewed: 50, status: "Đang thực hiện", statusType: "in-progress" },
  { id: "TSK-016", title: "Ghi âm truyện đọc phát triển trí tuệ trẻ em", topic: "Education", target: 100, reviewed: 20, status: "Đang thực hiện", statusType: "in-progress" },
  { id: "TSK-017", title: "Thu âm kịch bản hỏi đáp dịch vụ khách sạn", topic: "Daily Life", target: 90, reviewed: 0, status: "Chưa bắt đầu", statusType: "pending" },
  { id: "TSK-018", title: "Đọc tài liệu về an ninh mạng và bảo mật", topic: "IT/Technology", target: 125, reviewed: 125, status: "Hoàn thành", statusType: "completed" },
  { id: "TSK-019", title: "Ghi âm bài giảng môn Lịch Sử phổ thông", topic: "Education", target: 80, reviewed: 45, status: "Đang thực hiện", statusType: "in-progress" },
  { id: "TSK-020", title: "Thu âm giao tiếp tại sân bay và ga tàu", topic: "Daily Life", target: 105, reviewed: 105, status: "Hoàn thành", statusType: "completed" }
];

const INITIAL_ASSIGNMENTS = [
  {
    id: "ASN-001",
    taskId: "TSK-001",
    taskTitle: "Nhiệm vụ ghi âm thuật ngữ công nghệ",
    role: "Speaker",
    assignedUsers: ["Phạm Thu Thảo", "Lê Hoàng Nam"],
    startDate: "01/03/2026",
    endDate: "15/03/2026"
  },
  {
    id: "ASN-002",
    taskId: "TSK-001",
    taskTitle: "Nhiệm vụ kiểm thử thuật ngữ công nghệ",
    role: "Reviewer",
    assignedUsers: ["Trần Minh Tâm"],
    startDate: "05/03/2026",
    endDate: "20/03/2026"
  },
  {
    id: "ASN-003",
    taskId: "TSK-002",
    taskTitle: "Nhiệm vụ ghi âm hội thoại giáo dục phổ thông",
    role: "Speaker",
    assignedUsers: ["Đỗ Thị Khánh", "Hoàng Văn Lâm"],
    startDate: "02/03/2026",
    endDate: "18/03/2026"
  },
  {
    id: "ASN-004",
    taskId: "TSK-002",
    taskTitle: "Nhiệm vụ đánh giá hội thoại giáo dục phổ thông",
    role: "Reviewer",
    assignedUsers: ["Nguyễn Văn Anh", "Trần Thị Bình"],
    startDate: "06/03/2026",
    endDate: "22/03/2026"
  }
];

const ASSIGNMENT_STORAGE_KEY = "task_manager_assign_v8";

export default function TaskManagerAssignTasks() {
  const [assignments, setAssignments] = useState(() => {
    const saved = localStorage.getItem(ASSIGNMENT_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewUsersModal, setViewUsersModal] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });

  const [allAdminUsers, setAllAdminUsers] = useState([]);
  const [speakerTasksList, setSpeakerTasksList] = useState([]);
  const [reviewerTasksList, setReviewerTasksList] = useState([]);

  const reloadAdminUsers = () => {
    const savedUsers = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (savedUsers) {
      try {
        setAllAdminUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error("Lỗi khi đọc admin users từ localStorage", e);
        setAllAdminUsers(DEFAULT_USERS);
      }
    } else {
      setAllAdminUsers(DEFAULT_USERS);
    }
  };

  const reloadTaskLists = () => {
    const savedSpeaker = localStorage.getItem("speaker_tasks_v1") || localStorage.getItem("task_manager_dataset_v3");
    if (savedSpeaker) {
      try { setSpeakerTasksList(JSON.parse(savedSpeaker)); } catch (e) { setSpeakerTasksList(FULL_SPEAKER_TASKS); }
    } else {
      setSpeakerTasksList(FULL_SPEAKER_TASKS);
    }

    const savedReviewer = localStorage.getItem("task_manager_custom_dataset_v1") || localStorage.getItem("reviewer_tasks_dataset_v1");
    if (savedReviewer) {
      try { setReviewerTasksList(JSON.parse(savedReviewer)); } catch (e) { setReviewerTasksList(FULL_SPEAKER_TASKS); }
    } else {
      setReviewerTasksList(FULL_SPEAKER_TASKS);
    }
  };

  useEffect(() => {
    reloadAdminUsers();
    reloadTaskLists();

    const handleStorageChange = () => {
      reloadAdminUsers();
      reloadTaskLists();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("admin_users_updated", handleStorageChange);
    window.addEventListener("reviewer_tasks_updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("admin_users_updated", handleStorageChange);
      window.removeEventListener("reviewer_tasks_updated", handleStorageChange);
    };
  }, []);

  const activeSpeakers = useMemo(() => {
    return allAdminUsers.filter(u => u.role === "Speaker" && u.status === "Active");
  }, [allAdminUsers]);

  const activeReviewers = useMemo(() => {
    return allAdminUsers.filter(u => u.role === "Reviewer" && u.status === "Active");
  }, [allAdminUsers]);

  const allTasksOptions = useMemo(() => [
    ...speakerTasksList.map(t => ({ 
      ...t, 
      role: "Speaker", 
      uniqueKey: `Speaker-${t.id}`,
      label: `[Speaker] ${t.title}` 
    })),
    ...reviewerTasksList.map(t => ({ 
      ...t, 
      role: "Reviewer", 
      uniqueKey: `Reviewer-${t.id}`,
      label: `[Reviewer] ${t.title}` 
    }))
  ], [speakerTasksList, reviewerTasksList]);

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [formData, setFormData] = useState({
    selectedUniqueKey: "",
    assignedUsers: [],
    startDate: todayIso,
    endDate: todayIso
  });

  const currentSelectedTask = useMemo(() => {
    return allTasksOptions.find(t => t.uniqueKey === formData.selectedUniqueKey) || allTasksOptions[0];
  }, [formData.selectedUniqueKey, allTasksOptions]);

  const targetUserList = useMemo(() => {
    return currentSelectedTask?.role === "Speaker" ? activeSpeakers : activeReviewers;
  }, [currentSelectedTask, activeSpeakers, activeReviewers]);

  const pageSize = 10;

  useEffect(() => {
    localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showNotification = (msg) => {
    setToast({ show: true, message: msg });
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleOpenAddModal = () => {
    reloadAdminUsers();
    reloadTaskLists();
    setEditingAssignment(null);
    const defaultTask = allTasksOptions[0];
    setFormData({
      selectedUniqueKey: defaultTask ? defaultTask.uniqueKey : "",
      assignedUsers: [],
      startDate: todayIso,
      endDate: todayIso
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asn) => {
    reloadAdminUsers();
    reloadTaskLists();
    setEditingAssignment(asn);
    const targetTask = allTasksOptions.find(t => t.id === asn.taskId && t.role === asn.role);
    setFormData({
      selectedUniqueKey: targetTask ? targetTask.uniqueKey : (allTasksOptions[0]?.uniqueKey || ""),
      assignedUsers: asn.assignedUsers || [],
      startDate: formatDateToISO(asn.startDate) || todayIso,
      endDate: formatDateToISO(asn.endDate) || todayIso
    });
    setIsModalOpen(true);
  };

  const handleTaskChangeInModal = (newUniqueKey) => {
    const newSelectedTask = allTasksOptions.find(t => t.uniqueKey === newUniqueKey);
    const isRoleChanged = newSelectedTask?.role !== currentSelectedTask?.role;

    setFormData(prev => ({
      ...prev,
      selectedUniqueKey: newUniqueKey,
      assignedUsers: isRoleChanged ? [] : prev.assignedUsers
    }));
  };

  const handleUserCheckboxToggle = (userName) => {
    setFormData(prev => {
      const exists = prev.assignedUsers.includes(userName);
      if (exists) {
        return { ...prev, assignedUsers: prev.assignedUsers.filter(u => u !== userName) };
      } else {
        return { ...prev, assignedUsers: [...prev.assignedUsers, userName] };
      }
    });
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();

    if (formData.assignedUsers.length === 0) {
      alert(`Vui lòng chọn ít nhất 1 ${currentSelectedTask.role} để thực hiện nhiệm vụ!`);
      return;
    }

    const startIso = formData.startDate.includes("/") ? formatDateToISO(formData.startDate) : formData.startDate;
    const endIso = formData.endDate.includes("/") ? formatDateToISO(formData.endDate) : formData.endDate;

    if (endIso < startIso) {
      alert("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
      return;
    }

    const taskObj = currentSelectedTask;
    const formattedStart = formatDateToVN(formData.startDate);
    const formattedEnd = formatDateToVN(formData.endDate);

    if (editingAssignment) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === editingAssignment.id
            ? {
                ...a,
                taskId: taskObj.id,
                taskTitle: taskObj.title,
                role: taskObj.role,
                assignedUsers: formData.assignedUsers,
                startDate: formattedStart,
                endDate: formattedEnd
              }
            : a
        )
      );
      showNotification(`Đã cập nhật phân công nhiệm vụ "${taskObj.title}"!`);
    } else {
      const created = {
        id: `ASN-00${assignments.length + 1}`,
        taskId: taskObj.id,
        taskTitle: taskObj.title,
        role: taskObj.role,
        assignedUsers: formData.assignedUsers,
        startDate: formattedStart,
        endDate: formattedEnd
      };
      setAssignments((prev) => [...prev, created]);
      showNotification(`Đã phân công thành công nhiệm vụ "${taskObj.title}"!`);
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!assignmentToDelete) return;
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentToDelete.id));
    showNotification(`Đã xóa thành công phân công nhiệm vụ!`);
    setAssignmentToDelete(null);
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchSearch = 
        a.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.assignedUsers.some(u => u.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchRole = true;
      if (roleFilter === "speaker") matchRole = a.role === "Speaker";
      if (roleFilter === "reviewer") matchRole = a.role === "Reviewer";

      return matchSearch && matchRole;
    });
  }, [assignments, searchTerm, roleFilter]);

  const totalPages = Math.ceil(filteredAssignments.length / pageSize) || 1;
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  return (
    <div className="w-full h-full flex flex-col justify-between text-left font-sans p-1 overflow-hidden relative transition-colors">
      
      {/* Toast Notification */}
      <div 
        style={{ borderColor: SUCCESS }}
        className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 bg-[#16171C] dark:bg-white text-white dark:text-[#16171C] px-3.5 py-2 rounded-xl shadow-xl border transform transition-all duration-300 ease-out ${
          toast.show ? "translate-y-0 opacity-100 scale-100" : "-translate-y-4 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <CheckCircle2 style={{ color: SUCCESS }} className="w-4 h-4 shrink-0" />
        <span className="text-xs font-bold">{toast.message}</span>
        <button 
          type="button"
          onClick={() => setToast((prev) => ({ ...prev, show: false }))} 
          className="p-1 hover:bg-white/10 dark:hover:bg-black/10 rounded-lg transition-colors cursor-pointer ml-1"
        >
          <X className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        </button>
      </div>

      {/* Header & Filter Bar */}
      <div className="shrink-0 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
           <h2 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
              Phân công nhiệm vụ
            </h2>
             <p className="text-[13px] font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#15803D] via-emerald-600 to-teal-700 dark:from-[#1DB954] dark:via-emerald-400 dark:to-green-300 mt-1">
              Quản lý việc gán nhiệm vụ cho các Speaker và Reviewer đang hoạt động
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            style={{ backgroundColor: TASK_MANAGER_ACCENT }}
            className="px-3 py-1.5 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Phân công</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] p-2 shadow-xs flex flex-col md:flex-row gap-2 justify-between items-center transition-colors">
          <div className="w-full md:w-auto flex-1 max-w-xl">
            <div className="relative w-full flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#25272E] focus-within:border-gray-400 dark:focus-within:border-gray-500 focus-within:bg-white dark:focus-within:bg-[#1C1D22] transition-all p-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm nhiệm vụ, người được phân công..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-28 py-1.5 bg-transparent border-none text-xs font-medium outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSearch}
                style={{ backgroundColor: TASK_MANAGER_ACCENT }}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all cursor-pointer z-10 shadow-xs"
              >
                Tìm kiếm
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <Filter className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[150px] px-2.5 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#25272E] text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#1C1D22] focus:border-gray-400 dark:focus:border-gray-500 rounded-xl text-xs font-bold outline-none cursor-pointer transition-all font-sans"
            >
              <option value="all" className="bg-white dark:bg-[#25272E]">Tất cả vai trò</option>
              <option value="speaker" className="bg-white dark:bg-[#25272E]">Speaker</option>
              <option value="reviewer" className="bg-white dark:bg-[#25272E]">Reviewer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] shadow-xs overflow-hidden transition-colors flex-1 flex flex-col justify-between my-1.5 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="min-w-[850px] h-full flex flex-col">
            {/* Header Bảng */}
            <div className="text-[10px] uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#25272E] text-gray-500 dark:text-gray-400 font-bold flex items-center shrink-0 h-9">
              <div className="px-3 text-center whitespace-nowrap w-[50px]">STT</div>
              <div className="px-4 text-left flex-1">Nhiệm vụ</div>
              <div className="px-3 text-center w-[120px] whitespace-nowrap">Vai trò</div>
              <div className="px-3 text-center w-[200px] whitespace-nowrap">Người được phân công</div>
              <div className="px-3 text-center w-[120px] whitespace-nowrap">Ngày bắt đầu</div>
              <div className="px-3 text-center w-[120px] whitespace-nowrap">Ngày kết thúc</div>
              <div className="px-4 text-center w-[90px] whitespace-nowrap">Thao tác</div>
            </div>

            {/* Thân Bảng */}
            <div className="divide-y divide-gray-200 dark:divide-gray-800 text-[11px] font-medium flex-1 grid grid-rows-10">
              {paginatedAssignments.length > 0 ? (
                paginatedAssignments.map((item, index) => {
                  const stt = (currentPage - 1) * pageSize + index + 1;
                  const countUsers = item.assignedUsers ? item.assignedUsers.length : 0;

                  return (
                    <div key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#25272E]/50 transition-colors flex items-center h-full">
                      <div className="px-3 text-center font-sans whitespace-nowrap w-[50px] text-gray-400 dark:text-gray-500">
                        {stt}
                      </div>

                      <div className="px-4 font-bold flex-1 truncate text-gray-900 dark:text-gray-100" title={item.taskTitle}>
                        {item.taskTitle}
                      </div>

                      <div className="px-3 w-[120px] text-center whitespace-nowrap flex items-center justify-center">
                        {item.role === "Speaker" ? (
                          <span 
                            style={{ backgroundColor: SPEAKER_ACCENT, color: "#FFFFFF" }} 
                            className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-bold shadow-xs"
                          >
                            Speaker
                          </span>
                        ) : (
                          <span 
                            style={{ backgroundColor: REVIEWER_ACCENT, color: "#FFFFFF" }} 
                            className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-bold shadow-xs"
                          >
                            Reviewer
                          </span>
                        )}
                      </div>

                      <div className="px-3 w-[200px] text-center whitespace-nowrap flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setViewUsersModal(item)}
                          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F9FAFB] dark:bg-[#25272E] hover:bg-[#E5E7EB] dark:hover:bg-gray-700 text-[#2B2C31] dark:text-gray-200 text-[11px] font-bold border border-[#E5E7EB] dark:border-gray-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#6E7078] dark:text-gray-400 shrink-0" />
                          <span>Xem danh sách ({countUsers})</span>
                        </button>
                      </div>

                      <div className="px-3 w-[120px] text-center whitespace-nowrap font-semibold text-[11px] text-gray-900 dark:text-gray-300">
                        {item.startDate}
                      </div>

                      <div className="px-3 w-[120px] text-center whitespace-nowrap font-semibold text-[11px] text-gray-900 dark:text-gray-300">
                        {item.endDate}
                      </div>

                      <div className="px-4 text-center w-[90px] whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer dark:text-gray-400"
                            title="Chỉnh sửa phân công"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setAssignmentToDelete(item)}
                            className="p-1 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md hover:text-red-600 dark:hover:text-[#E55353] transition-colors cursor-pointer dark:text-gray-400"
                            title="Xóa phân công"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="row-span-10 flex items-center justify-center text-xs font-medium text-gray-400 dark:text-gray-500">
                  Không tìm thấy dữ liệu phân công nào phù hợp.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="px-2 py-1.5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] shrink-0">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={(p) => setCurrentPage(p)} 
            accent={TASK_MANAGER_ACCENT} 
          />
        </div>
      </div>

      {/* Modal Xem danh sách người thực hiện */}
      {viewUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setViewUsersModal(null)}>
          <div 
            className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ backgroundColor: TASK_MANAGER_ACCENT }} className="h-1.5 w-full shrink-0" />
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users style={{ color: TASK_MANAGER_ACCENT }} className="w-4 h-4" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Danh sách phân công ({viewUsersModal.role})
                </h3>
              </div>
              <button 
                onClick={() => setViewUsersModal(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-[#25272E] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs font-bold break-words text-gray-900 dark:text-gray-200">
                {viewUsersModal.taskTitle}
              </p>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {viewUsersModal.assignedUsers && viewUsersModal.assignedUsers.length > 0 ? (
                  viewUsersModal.assignedUsers.map((userName, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-[#25272E] text-gray-900 dark:text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          style={{ backgroundColor: TASK_MANAGER_ACCENT }}
                          className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold"
                        >
                          {userName.charAt(0)}
                        </div>
                        <span>{userName}</span>
                      </div>
                      <span 
                        style={{ backgroundColor: viewUsersModal.role === "Speaker" ? SPEAKER_ACCENT : REVIEWER_ACCENT }}
                        className="text-[9px] text-white px-2 py-0.5 rounded-md font-bold"
                      >
                        {viewUsersModal.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center py-2 text-gray-500 dark:text-gray-400">Chưa phân công người nào</p>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-right bg-gray-50/50 dark:bg-[#25272E]/50">
              <button
                onClick={() => setViewUsersModal(null)}
                style={{ backgroundColor: TASK_MANAGER_ACCENT }}
                className="px-4 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo / Sửa Phân công */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setIsModalOpen(false)}>
          <div 
            className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ backgroundColor: TASK_MANAGER_ACCENT }} className="h-1.5 w-full shrink-0" />
            <form onSubmit={handleSubmitForm} className="p-5 space-y-3">
              <h3 className="text-sm font-bold truncate text-gray-900 dark:text-gray-100">
                {editingAssignment ? "Chỉnh sửa phân công" : "Phân công nhiệm vụ mới"}
              </h3>
              
              {/* Select Chọn Nhiệm Vụ */}
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 text-gray-500 dark:text-gray-400">
                  {editingAssignment ? "Nhiệm vụ" : "Chọn nhiệm vụ"}
                </label>
                <div className="relative flex items-center">
                  <select
                    disabled={Boolean(editingAssignment)}
                    value={formData.selectedUniqueKey}
                    onChange={(e) => handleTaskChangeInModal(e.target.value)}
                    className={`w-full text-xs appearance-none border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#25272E] text-gray-900 dark:text-white rounded-lg outline-none font-bold transition-all font-sans truncate ${
                      editingAssignment 
                        ? "pl-3 pr-3 py-1.5 cursor-not-allowed opacity-90" 
                        : "pl-3 pr-8 py-1.5 focus:bg-white dark:focus:bg-[#1C1D22] focus:border-gray-400 dark:focus:border-gray-500 cursor-pointer"
                    }`}
                  >
                    {allTasksOptions.map((t) => (
                      <option key={t.uniqueKey} value={t.uniqueKey} className="bg-white text-gray-900 dark:bg-[#1C1D22] dark:text-white">
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {!editingAssignment && (
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 pointer-events-none text-gray-400 dark:text-gray-400" />
                  )}
                </div>
              </div>

              {/* Danh sách SPEAKER / REVIEWER */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                    {currentSelectedTask?.role} đang hoạt động ({formData.assignedUsers.length} đã chọn)
                  </label>
                  <span 
                    style={{ backgroundColor: currentSelectedTask?.role === "Speaker" ? SPEAKER_ACCENT : REVIEWER_ACCENT }}
                    className="text-[9px] text-white px-1.5 py-0.2 rounded font-bold"
                  >
                    {currentSelectedTask?.role}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#25272E] rounded-lg p-2 space-y-1">
                  {targetUserList.length > 0 ? (
                    targetUserList.map((u) => {
                      const isChecked = formData.assignedUsers.includes(u.name);
                      return (
                        <label 
                          key={u.id} 
                          className={`flex items-center justify-between p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                            isChecked 
                              ? "bg-white dark:bg-[#1C1D22] shadow-2xs font-bold text-gray-900 dark:text-white" 
                              : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleUserCheckboxToggle(u.name)}
                              className="rounded text-gray-900 focus:ring-0 cursor-pointer"
                            />
                            <span>{u.name}</span>
                          </div>
                          <span className="text-[10px] font-normal text-gray-400 dark:text-gray-400">
                            {u.email}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                      Không có {currentSelectedTask?.role} nào đang hoạt động (Active).
                    </div>
                  )}
                </div>
              </div>

              {/* Ngày Bắt đầu & Kết thúc */}
              <div className="grid grid-cols-2 gap-3">
                <VNFormatDatePicker
                  label="Ngày bắt đầu"
                  value={formData.startDate}
                  minDateIso={todayIso}
                  onChange={(newVal) => setFormData({ ...formData, startDate: newVal })}
                />

                <VNFormatDatePicker
                  label="Ngày kết thúc"
                  value={formData.endDate}
                  minDateIso={formData.startDate.includes("-") ? formData.startDate : todayIso}
                  onChange={(newVal) => setFormData({ ...formData, endDate: newVal })}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-[#25272E] cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: TASK_MANAGER_ACCENT }}
                  className="flex-1 py-2 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {editingAssignment ? "Lưu thay đổi" : "Lưu phân công"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa */}
      {assignmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setAssignmentToDelete(null)}>
          <div 
            className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transition-colors animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ backgroundColor: DANGER }} className="h-1.5 w-full shrink-0" />
            <div className="p-5 text-center space-y-3">
              <div 
                style={{ backgroundColor: "rgba(243, 114, 127, 0.15)", color: DANGER }}
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Xác nhận xóa phân công</h3>
                <p className="text-[11px] mt-1 break-words text-gray-500 dark:text-gray-400">
                  Bạn có chắc muốn xóa phân công cho nhiệm vụ <span className="font-bold text-gray-900 dark:text-gray-200">"{assignmentToDelete.taskTitle}"</span>? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setAssignmentToDelete(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-[#25272E] cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{ backgroundColor: DANGER }}
                  className="flex-1 py-2 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}