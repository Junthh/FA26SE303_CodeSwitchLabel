import React, { useState, useEffect, useMemo } from "react";
import {
  ListTodo,
  Filter,
  CheckCircle2,
  X,
  Plus,
  Layers,
  Eye,
  Trash2,
  Edit3,
  AlertTriangle,
  ChevronDown,
  Users,
  Search,
  Clock
} from "lucide-react";
import { 
  TASK_MANAGER_ACCENT, 
  SUCCESS, 
  DANGER,
  SPEAKER_ACCENT, 
  REVIEWER_ACCENT,
  CHIP_SUCCESS_BG,
  CHIP_SUCCESS_BORDER,
  CHIP_SUCCESS_TEXT,
  CHIP_WARNING_BG,
  CHIP_WARNING_BORDER,
  CHIP_WARNING_TEXT
} from "../../../constants/theme";

// Khóa Storage kết nối trực tiếp với trang TaskManagerAssign
const ASSIGN_TASKS_STORAGE_KEY = "task_manager_assign_v8";
const BATCH_LIST_STORAGE_KEY = "task_manager_management_batches_v4";
const BATCH_ASSIGNMENT_STORAGE_KEY = "task_manager_management_batch_assignments_v4";

export default function TaskManagerManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState({ show: false, message: "" });

  // Trạng thái Modal (Dùng chung cho Tạo Đợt Mới & Cập Nhật Đợt)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // "CREATE" hoặc "UPDATE"
  const [modalTargetBatchId, setModalTargetBatchId] = useState(null); // ID của đợt đang cập nhật
  const [selectedTaskIdsForModal, setSelectedTaskIdsForModal] = useState([]);

  // Modal Xem danh sách người thực hiện
  const [viewingAssignedTask, setViewingAssignedTask] = useState(null);

  // Modal Xóa Đợt
  const [deletingBatch, setDeletingBatch] = useState(null);

  // 1. Danh sách Đợt
  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem(BATCH_LIST_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: "BATCH-01", name: "Đợt 1" },
      { id: "BATCH-02", name: "Đợt 2" },
      { id: "BATCH-03", name: "Đợt 3" }
    ];
  });

  const [selectedBatchId, setSelectedBatchId] = useState(() => {
    const saved = localStorage.getItem(BATCH_LIST_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0].id;
      } catch (e) {}
    }
    return "BATCH-01";
  });

  // 2. Danh sách nhiệm vụ gốc lấy trực tiếp từ TaskManagerAssign
  const [assignTasks, setAssignTasks] = useState([]);

  // 3. Mapping phân công Đợt cho các Nhiệm vụ
  const [batchMapping, setBatchMapping] = useState(() => {
    const saved = localStorage.getItem(BATCH_ASSIGNMENT_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });

  // Tải danh sách nhiệm vụ từ TaskManagerAssign & Chuẩn hóa
  const loadAssignTasks = () => {
    const saved = localStorage.getItem(ASSIGN_TASKS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map((item) => ({
            ...item,
            id: item.id || item.taskId || "N/A",
            title: item.taskTitle || item.title || "Chưa có tên nhiệm vụ",
            assignedUsers: Array.isArray(item.assignedUsers) ? item.assignedUsers : (item.assignedUsers ? [item.assignedUsers] : []),
            status: item.status || "Đang thực hiện",
            startDate: item.startDate || "01/03/2026",
            endDate: item.endDate || "15/03/2026"
          }));
          setAssignTasks(normalized);
          return;
        }
      } catch (e) {
        console.error("Lỗi đọc TaskManagerAssign data:", e);
      }
    }
    setAssignTasks([]);
  };

  useEffect(() => {
    loadAssignTasks();

    const handleStorageChange = () => {
      loadAssignTasks();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("assign_tasks_updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assign_tasks_updated", handleStorageChange);
    };
  }, []);

  // Lưu Danh sách đợt và Mapping vào localStorage
  useEffect(() => {
    localStorage.setItem(BATCH_LIST_STORAGE_KEY, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(BATCH_ASSIGNMENT_STORAGE_KEY, JSON.stringify(batchMapping));
  }, [batchMapping]);

  // Thông báo Toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showNotification = (msg) => {
    setToast({ show: true, message: msg });
  };

  // Cập nhật Trạng thái trực tiếp của Nhiệm vụ
  const handleUpdateTaskStatus = (taskId, newStatus) => {
    const updatedTasks = assignTasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setAssignTasks(updatedTasks);
    
    // Lưu ngược lại localStorage của TaskManagerAssign
    localStorage.setItem(ASSIGN_TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
    window.dispatchEvent(new Event("assign_tasks_updated"));
    showNotification(`Đã cập nhật trạng thái thành "${newStatus}"`);
  };

  // Lấy ID nhiệm vụ đã có đợt (loại trừ đợt đang được thao tác nếu ở chế độ UPDATE)
  const assignedTaskIdsInOtherBatches = useMemo(() => {
    const ids = new Set();
    Object.entries(batchMapping).forEach(([bId, taskIds]) => {
      if (modalMode === "UPDATE" && bId === modalTargetBatchId) {
        return;
      }
      (taskIds || []).forEach((id) => ids.add(id));
    });
    return ids;
  }, [batchMapping, modalMode, modalTargetBatchId]);

  // Danh sách nhiệm vụ KHẢ DỤNG cho Modal
  const availableTasksForModal = useMemo(() => {
    return assignTasks.filter((task) => !assignedTaskIdsInOtherBatches.has(task.id));
  }, [assignTasks, assignedTaskIdsInOtherBatches]);

  // Mở Modal TẠO ĐỢT MỚI (Không tích sẵn nhiệm vụ)
  const handleOpenCreateModal = () => {
    setModalMode("CREATE");
    setModalTargetBatchId(null);
    setSelectedTaskIdsForModal([]);
    setIsModalOpen(true);
  };

  // Mở Modal CẬP NHẬT ĐỢT
  const handleOpenUpdateModal = (e, batch) => {
    e.stopPropagation();
    setModalMode("UPDATE");
    setModalTargetBatchId(batch.id);
    setSelectedBatchId(batch.id);
    const currentTaskIds = batchMapping[batch.id] || [];
    setSelectedTaskIdsForModal([...currentTaskIds]);
    setIsModalOpen(true);
  };

  // Toggle chọn / bỏ chọn 1 nhiệm vụ trong Modal
  const handleToggleTaskInModal = (taskId) => {
    setSelectedTaskIdsForModal((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Hàm hỗ trợ cập nhật trạng thái các nhiệm vụ mới thêm vào đợt thành "Đang thực hiện"
  const resetAddedTasksToInProgress = (addedTaskIds) => {
    if (!addedTaskIds || addedTaskIds.length === 0) return;
    const updatedTasks = assignTasks.map((t) =>
      addedTaskIds.includes(t.id) ? { ...t, status: "Đang thực hiện" } : t
    );
    setAssignTasks(updatedTasks);
    localStorage.setItem(ASSIGN_TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
    window.dispatchEvent(new Event("assign_tasks_updated"));
  };

  // Xác nhận lưu Modal
  const handleConfirmSaveModal = () => {
    if (modalMode === "CREATE") {
      if (selectedTaskIdsForModal.length === 0) {
        showNotification("Vui lòng chọn ít nhất 1 nhiệm vụ cho đợt mới!");
        return;
      }

      const nextNumber = batches.length + 1;
      const newBatchName = `Đợt ${nextNumber}`;
      const newId = `BATCH-${String(Date.now()).slice(-4)}`;

      // Reset các nhiệm vụ mới tạo vào đợt về "Đang thực hiện"
      resetAddedTasksToInProgress(selectedTaskIdsForModal);

      setBatches((prev) => [...prev, { id: newId, name: newBatchName }]);
      setBatchMapping((prev) => ({ ...prev, [newId]: selectedTaskIdsForModal }));
      setSelectedBatchId(newId);
      showNotification(`Đã tạo thành công ${newBatchName}!`);
    } else {
      const oldTaskIds = batchMapping[modalTargetBatchId] || [];
      // Tìm các nhiệm vụ mới vừa được tick thêm vào đợt này
      const newlyAddedTaskIds = selectedTaskIdsForModal.filter((id) => !oldTaskIds.includes(id));
      
      // Reset các nhiệm vụ mới thêm về "Đang thực hiện"
      resetAddedTasksToInProgress(newlyAddedTaskIds);

      setBatchMapping((prev) => ({
        ...prev,
        [modalTargetBatchId]: selectedTaskIdsForModal
      }));
      const currentBatchObj = batches.find((b) => b.id === modalTargetBatchId);
      showNotification(`Đã cập nhật nhiệm vụ của ${currentBatchObj?.name || 'đợt'}!`);
    }

    setIsModalOpen(false);
  };

  // Chuẩn bị xóa Đợt (Mở Modal Xóa)
  const handleRequestDeleteBatch = (e, batchToDelete) => {
    e.stopPropagation();
    setDeletingBatch(batchToDelete);
  };

  // Xác nhận Xóa Đợt từ Modal
  const handleConfirmDeleteBatch = () => {
    if (!deletingBatch) return;

    const remainingBatches = batches.filter((b) => b.id !== deletingBatch.id);
    setBatches(remainingBatches);

    setBatchMapping((prev) => {
      const nextMap = { ...prev };
      delete nextMap[deletingBatch.id];
      return nextMap;
    });

    if (selectedBatchId === deletingBatch.id) {
      setSelectedBatchId(remainingBatches.length > 0 ? remainingBatches[0].id : null);
    }

    showNotification(`Đã xóa thành công ${deletingBatch.name}!`);
    setDeletingBatch(null);
  };

  // Lấy danh sách nhiệm vụ thuộc đợt đang chọn
  const currentBatchTaskIds = useMemo(() => {
    if (!selectedBatchId) return [];
    return batchMapping[selectedBatchId] || [];
  }, [batchMapping, selectedBatchId]);

  const currentTasks = useMemo(() => {
    return assignTasks.filter((t) => currentBatchTaskIds.includes(t.id));
  }, [assignTasks, currentBatchTaskIds]);

  // Tìm kiếm khi nhấn nút "Tìm kiếm"
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSearchQuery(searchInput);
    }
  };

  // Lọc nhiệm vụ ở giao diện chính
  const filteredTasks = useMemo(() => {
    const q = (searchQuery || "").toLowerCase();
    return currentTasks.filter((task) => {
      const titleStr = (task?.title || "").toLowerCase();
      const matchSearch = titleStr.includes(q);
      const matchStatus = statusFilter === "ALL" || task.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [currentTasks, searchQuery, statusFilter]);

  const selectedBatchObj = batches.find((b) => b.id === selectedBatchId) || null;
  const targetModalBatchObj = batches.find((b) => b.id === modalTargetBatchId) || selectedBatchObj;

  return (
    <div className="w-full h-full flex flex-col gap-3 text-left font-sans p-1 overflow-y-auto relative">
      
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

      {/* MODAL TẠO / CẬP NHẬT ĐỢT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setIsModalOpen(false)}>
          <div 
            className="rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ backgroundColor: TASK_MANAGER_ACCENT }} className="h-1.5 w-full shrink-0" />
            
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {modalMode === "CREATE" ? "Tạo đợt nhiệm vụ mới" : `Chỉnh sửa ${targetModalBatchObj?.name || "đợt"}`}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-[#25272E] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5 text-gray-500 dark:text-gray-400">
                  Chọn các nhiệm vụ đưa vào đợt ({selectedTaskIdsForModal.length} đã chọn)
                </label>

                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#25272E] rounded-lg p-2 space-y-1.5">
                  {availableTasksForModal.length === 0 ? (
                    <div className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                      Không có nhiệm vụ nào sẵn có để phân đợt!
                    </div>
                  ) : (
                    availableTasksForModal.map((task) => {
                      const isChecked = selectedTaskIdsForModal.includes(task.id);
                      return (
                        <label
                          key={task.id}
                          className={`flex items-center justify-between gap-3 p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isChecked 
                              ? "bg-white dark:bg-[#1C1D22] shadow-2xs font-bold text-gray-900 dark:text-white" 
                              : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleTaskInModal(task.id)}
                              style={{ accentColor: TASK_MANAGER_ACCENT }}
                              className="rounded focus:ring-0 cursor-pointer w-4 h-4 mt-0.5 shrink-0"
                            />
                            <span className="leading-relaxed whitespace-normal break-words">{task.title}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-center">
                            <span 
                              style={{ 
                                backgroundColor: task.role === "Speaker" ? SPEAKER_ACCENT : REVIEWER_ACCENT 
                              }}
                              className="text-[9px] font-bold text-white px-2 py-0.5 rounded"
                            >
                              {task.role || "Nhiệm vụ"}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingAssignedTask(task);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F9FAFB] dark:bg-[#25272E] hover:bg-[#E5E7EB] dark:hover:bg-gray-700 text-[#2B2C31] dark:text-gray-200 text-[10px] font-bold border border-[#E5E7EB] dark:border-gray-700 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Eye className="w-3 h-3 text-[#6E7078] dark:text-gray-400 shrink-0" />
                              <span>Xem danh sách ({task.assignedUsers?.length || 0})</span>
                            </button>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
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
                  type="button"
                  onClick={handleConfirmSaveModal}
                  style={{ backgroundColor: TASK_MANAGER_ACCENT }}
                  className="flex-1 py-2 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {modalMode === "CREATE" ? "Tạo" : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÓA ĐỢT */}
      {deletingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setDeletingBatch(null)}>
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
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Xác nhận xóa đợt</h3>
                <p className="text-[11px] mt-1 break-words text-gray-500 dark:text-gray-400">
                  Bạn có chắc muốn xóa <span className="font-bold text-gray-900 dark:text-gray-200">"{deletingBatch.name}"</span>? Các nhiệm vụ trong đợt này sẽ trở về trạng thái chưa được phân đợt.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingBatch(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-[#25272E] cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteBatch}
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

      {/* MODAL XEM DANH SÁCH NGƯỜI ĐƯỢC PHÂN CÔNG */}
      {viewingAssignedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setViewingAssignedTask(null)}>
          <div 
            className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ backgroundColor: TASK_MANAGER_ACCENT }} className="h-1.5 w-full shrink-0" />
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users style={{ color: TASK_MANAGER_ACCENT }} className="w-4 h-4" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Danh sách phân công ({viewingAssignedTask.role || "Người thực hiện"})
                </h3>
              </div>
              <button 
                onClick={() => setViewingAssignedTask(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-[#25272E] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs font-bold break-words text-gray-900 dark:text-gray-200">
                {viewingAssignedTask.title}
              </p>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {viewingAssignedTask.assignedUsers && viewingAssignedTask.assignedUsers.length > 0 ? (
                  viewingAssignedTask.assignedUsers.map((userName, idx) => (
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
                        style={{ backgroundColor: viewingAssignedTask.role === "Speaker" ? SPEAKER_ACCENT : REVIEWER_ACCENT }}
                        className="text-[9px] text-white px-2 py-0.5 rounded-md font-bold"
                      >
                        {viewingAssignedTask.role || "Thực hiện"}
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
                type="button"
                onClick={() => setViewingAssignedTask(null)}
                style={{ backgroundColor: TASK_MANAGER_ACCENT }}
                className="px-4 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Page + Nút Thêm Đợt Mới */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
            Quản lý nhiệm vụ
          </h2>
          <p className="text-[13px] font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#15803D] via-emerald-600 to-teal-700 dark:from-[#1DB954] dark:via-emerald-400 dark:to-green-300 mt-0.5">
            Quản lý và tạo các nhiệm vụ thực hiện theo từng đợt
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          style={{ backgroundColor: TASK_MANAGER_ACCENT }}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold text-white rounded-lg shadow-2xs hover:opacity-90 transition-all cursor-pointer self-start md:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo đợt</span>
        </button>
      </div>

      {/* Grid Layout chính */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 min-h-0">
        
        {/* Cột trái: Danh sách các Đợt */}
        <div className="lg:col-span-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] p-3 shadow-xs flex flex-col gap-2 min-h-0">
          
          <div className="flex items-center justify-between px-1 pb-1 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
              <Layers style={{ color: TASK_MANAGER_ACCENT }} className="w-3.5 h-3.5" />
              DANH SÁCH ĐỢT
            </h3>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[580px] pr-1">
            {batches.length === 0 ? (
              <div className="p-3 text-center text-xs font-medium text-gray-400 dark:text-gray-500">
                Chưa có đợt nào. Bấm nút tạo đợt ở trên để tạo.
              </div>
            ) : (
              batches.map((batch) => {
                const active = batch.id === selectedBatchId;
                
                const mappedIds = batchMapping[batch.id] || [];
                const batchTasks = assignTasks.filter((t) => mappedIds.includes(t.id));

                const isBatchCompleted = batchTasks.length > 0 && batchTasks.every((t) => t.status === "Hoàn thành");

                return (
                  <div
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    style={active ? { 
                      backgroundColor: `${TASK_MANAGER_ACCENT}15`, 
                      borderColor: `${TASK_MANAGER_ACCENT}50` 
                    } : {}}
                    className={`relative w-full text-left p-3 rounded-xl transition-all border cursor-pointer flex items-center justify-between ${
                      active 
                        ? "shadow-xs" 
                        : "bg-gray-50/50 dark:bg-[#25272E]/50 border-transparent hover:bg-gray-100 dark:hover:bg-[#25272E]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {batch.name}
                      </span>
                      
                      {/* Badge trạng thái chuẩn */}
                      <span 
                        style={{
                          backgroundColor: isBatchCompleted ? CHIP_SUCCESS_BG : CHIP_WARNING_BG,
                          borderColor: isBatchCompleted ? CHIP_SUCCESS_BORDER : CHIP_WARNING_BORDER,
                          color: isBatchCompleted ? CHIP_SUCCESS_TEXT : CHIP_WARNING_TEXT
                        }}
                        className="inline-flex items-center gap-1 pl-2 pr-2.5 py-0.5 rounded-full text-[9.5px] font-bold border shrink-0 leading-tight"
                      >
                        {isBatchCompleted ? (
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" style={{ color: CHIP_SUCCESS_TEXT }} />
                        ) : (
                          <Clock className="w-2.5 h-2.5 shrink-0" style={{ color: CHIP_WARNING_TEXT }} />
                        )}
                        <span>{isBatchCompleted ? "Hoàn thành" : "Đang thực hiện"}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenUpdateModal(e, batch)}
                        title={`Sửa ${batch.name}`}
                        className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer dark:text-gray-400"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleRequestDeleteBatch(e, batch)}
                        title={`Xóa ${batch.name}`}
                        className="p-1 text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md hover:text-red-600 dark:hover:text-[#E55353] transition-colors cursor-pointer dark:text-gray-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cột phải: Bảng danh sách nhiệm vụ */}
        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
          
          {/* Filter Bar */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] p-2 shadow-xs flex flex-col md:flex-row gap-2 justify-between items-center transition-colors">
            <div className="w-full md:w-auto flex-1 max-w-xl">
              <div className="relative w-full flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#25272E] focus-within:border-gray-400 dark:focus-within:border-gray-500 focus-within:bg-white dark:focus-within:bg-[#1C1D22] transition-all p-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Tìm theo tên nhiệm vụ..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-28 py-1.5 bg-transparent border-none text-xs font-medium outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleSearchSubmit}
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-[160px] px-2.5 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#25272E] text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#1C1D22] focus:border-gray-400 dark:focus:border-gray-500 rounded-xl text-xs font-bold outline-none cursor-pointer transition-all font-sans"
              >
                <option value="ALL" className="bg-white dark:bg-[#25272E]">Tất cả trạng thái</option>
                <option value="Đang thực hiện" className="bg-white dark:bg-[#25272E]">Đang thực hiện</option>
                <option value="Hoàn thành" className="bg-white dark:bg-[#25272E]">Hoàn thành</option>
              </select>
            </div>
          </div>

          {/* BẢNG CHUẨN */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1D22] shadow-xs overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold bg-gray-50/80 dark:bg-[#25272E]">
                    <th className="py-3 px-3 text-center w-[50px]">STT</th>
                    <th className="py-3 px-3 min-w-[200px]">NHIỆM VỤ</th>
                    <th className="py-3 px-3 text-center w-[90px]">VAI TRÒ</th>
                    <th className="py-3 px-3 text-center w-[200px]">NGƯỜI ĐƯỢC PHÂN CÔNG</th>
                    <th className="py-3 px-3 text-center w-[110px]">NGÀY BẮT ĐẦU</th>
                    <th className="py-3 px-3 text-center w-[110px]">NGÀY KẾT THÚC</th>
                    <th className="py-3 px-3 text-center w-[140px]">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {!selectedBatchObj || filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                        {!selectedBatchObj 
                          ? "Hãy chọn hoặc tạo một đợt để xem danh sách nhiệm vụ." 
                          : `Không tìm thấy nhiệm vụ nào trong ${selectedBatchObj.name}.`}
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task, index) => {
                      const isCompleted = task.status === "Hoàn thành";
                      const countUsers = task.assignedUsers ? task.assignedUsers.length : 0;

                      return (
                        <tr key={task.id} className="hover:bg-gray-50/80 dark:hover:bg-[#25272E]/50 transition-colors">
                          <td className="py-3.5 px-3 text-center text-gray-400 font-medium text-xs">
                            {index + 1}
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-gray-900 dark:text-white text-xs leading-snug">{task.title}</p>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span 
                              style={{ backgroundColor: task.role === "Speaker" ? SPEAKER_ACCENT : REVIEWER_ACCENT }}
                              className="text-[10px] font-bold text-white px-2.5 py-1 rounded-md"
                            >
                              {task.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setViewingAssignedTask(task)}
                              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F9FAFB] dark:bg-[#25272E] hover:bg-[#E5E7EB] dark:hover:bg-gray-700 text-[#2B2C31] dark:text-gray-200 text-[11px] font-bold border border-[#E5E7EB] dark:border-gray-700 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#6E7078] dark:text-gray-400 shrink-0" />
                              <span>Xem danh sách ({countUsers})</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {task.startDate}
                          </td>
                          <td className="py-3.5 px-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {task.endDate}
                          </td>
                          
                          <td className="py-3.5 px-3 text-center">
                            <div className="relative inline-flex items-center justify-center">
                              {isCompleted ? (
                                <CheckCircle2 className="w-2.5 h-2.5 shrink-0 absolute left-2 pointer-events-none z-10" style={{ color: CHIP_SUCCESS_TEXT }} />
                              ) : (
                                <Clock className="w-2.5 h-2.5 shrink-0 absolute left-2 pointer-events-none z-10" style={{ color: CHIP_WARNING_TEXT }} />
                              )}

                              <select
                                value={task.status || "Đang thực hiện"}
                                onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                style={{
                                  backgroundColor: isCompleted ? CHIP_SUCCESS_BG : CHIP_WARNING_BG,
                                  borderColor: isCompleted ? CHIP_SUCCESS_BORDER : CHIP_WARNING_BORDER,
                                  color: isCompleted ? CHIP_SUCCESS_TEXT : CHIP_WARNING_TEXT
                                }}
                                className="appearance-none inline-flex items-center pl-5 pr-5 py-0.5 rounded-full text-[9.5px] font-bold border cursor-pointer focus:outline-none transition-all leading-tight"
                              >
                                <option value="Đang thực hiện" className="bg-white dark:bg-[#1C1D22] text-amber-600 font-bold">
                                  Đang thực hiện
                                </option>
                                <option value="Hoàn thành" className="bg-white dark:bg-[#1C1D22] text-emerald-600 font-bold">
                                  Hoàn thành
                                </option>
                              </select>

                              <ChevronDown 
                                style={{ color: isCompleted ? CHIP_SUCCESS_TEXT : CHIP_WARNING_TEXT }}
                                className="w-2.5 h-2.5 absolute right-1.5 pointer-events-none z-10" 
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}