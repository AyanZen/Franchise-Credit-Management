import { useState, useEffect, useMemo, useCallback } from "react";
import { computeFranchiseLedger, enrichOrders } from "../lib/franchiseLedger";
import {
  authApi, setToken, franchisesApi, ordersApi, paymentsApi,
  remindersApi, usersApi, settingsApi,
} from "../services/api";

function applyBootstrap(data, setters) {
  setters.setFranchises(data.franchises || []);
  setters.setOrders(data.orders || []);
  setters.setPayments(data.payments || []);
  setters.setReminders(data.reminders || []);
  setters.setActivityLog(data.activityLog || []);
  setters.setSettings(data.settings || { termDays: 15, graceDays: 5, reminderIntervalDays: 2, emailRemindersEnabled: true });
  setters.setUsers(data.users || []);
}

export function usePortalData() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [settings, setSettings] = useState({ termDays: 15, graceDays: 5, reminderIntervalDays: 2, emailRemindersEnabled: true });

  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState(null);

  const [showAddFranchise, setShowAddFranchise] = useState(false);
  const [editFranchise, setEditFranchise] = useState(null);
  const [showAddOrderFor, setShowAddOrderFor] = useState(null);
  const [showAddPaymentFor, setShowAddPaymentFor] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const setters = {
    setFranchises, setOrders, setPayments, setReminders,
    setActivityLog, setSettings, setUsers,
  };

  const refreshData = useCallback(async () => {
    const data = await authApi.bootstrap();
    applyBootstrap(data, setters);
  }, []);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await authApi.bootstrap();
        applyBootstrap(data, setters);
        const stored = JSON.parse(localStorage.getItem("user") || "null");
        if (stored) setCurrentUser(stored);
      } catch {
        setToken(null);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  const paymentsByFranchise = useMemo(() => {
    const map = {};
    payments.forEach((p) => {
      if (!map[p.franchiseId]) map[p.franchiseId] = [];
      map[p.franchiseId].push(p);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (a.date < b.date ? 1 : -1))
    );
    return map;
  }, [payments]);

  const ordersWithMeta = useMemo(
    () => enrichOrders(orders, settings),
    [orders, settings]
  );

  const ordersByFranchise = useMemo(() => {
    const map = {};
    ordersWithMeta.forEach((o) => {
      if (!map[o.franchiseId]) map[o.franchiseId] = [];
      map[o.franchiseId].push(o);
    });
    return map;
  }, [ordersWithMeta]);

  const franchiseSummaries = useMemo(() => {
    return franchises.map((f) => {
      const fOrders = ordersByFranchise[f.id] || [];
      const fPayments = paymentsByFranchise[f.id] || [];
      const ledger = computeFranchiseLedger(fOrders, fPayments, settings);
      return { ...f, ...ledger, orderCount: fOrders.length };
    });
  }, [franchises, ordersByFranchise, paymentsByFranchise, settings]);

  const alertFranchises = useMemo(() => {
    return franchiseSummaries
      .filter((f) => f.status === "overdue" || f.status === "critical")
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [franchiseSummaries]);

  const totals = useMemo(() => {
    const totalOutstanding = franchiseSummaries.reduce((s, f) => s + f.totalDue, 0);
    const overdueCount = franchiseSummaries.filter((f) => f.status === "overdue").length;
    const criticalCount = franchiseSummaries.filter((f) => f.status === "critical").length;
    return { totalOutstanding, overdueCount, criticalCount, franchiseCount: franchises.length };
  }, [franchiseSummaries, franchises]);

  function reminderCountFor(franchiseId) {
    return reminders.filter((r) => r.franchiseId === franchiseId).length;
  }

  function lastReminderFor(franchiseId) {
    const rs = reminders.filter((r) => r.franchiseId === franchiseId).sort((a, b) => (a.date < b.date ? 1 : -1));
    return rs[0] || null;
  }

  async function handleLogin(username, password) {
    try {
      const res = await authApi.login(username, password);
      setToken(res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setCurrentUser(res.user);
      applyBootstrap(res, setters);
      setView("dashboard");
      return null;
    } catch (e) {
      return e.message;
    }
  }

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    setToken(null);
    localStorage.removeItem("user");
    setCurrentUser(null);
    setView("dashboard");
  }

  async function addFranchise(data) {
    await franchisesApi.create(data);
    await refreshData();
    setShowAddFranchise(false);
    showToast("Franchise added");
  }

  async function updateFranchise(id, data) {
    await franchisesApi.update(id, data);
    await refreshData();
    setEditFranchise(null);
    showToast("Franchise updated");
  }

  async function deleteFranchise(id) {
    try {
      await franchisesApi.remove(id);
      if (selectedFranchiseId === id) {
        setSelectedFranchiseId(null);
        setView("franchises");
      }
      await refreshData();
      showToast("Franchise deleted");
    } catch (e) {
      showToast(e.message);
      throw e;
    }
  }

  async function deleteUser(id) {
    try {
      await usersApi.remove(id);
      await refreshData();
      showToast("Employee removed");
    } catch (e) {
      showToast(e.message);
      throw e;
    }
  }

  async function addOrder(franchiseId, data) {
    await ordersApi.create({ franchiseId, ...data });
    await refreshData();
    setShowAddOrderFor(null);
    showToast("Delivery recorded");
  }

  async function addPayment(franchiseId, data) {
    await paymentsApi.create({ franchiseId, ...data });
    await refreshData();
    setShowAddPaymentFor(null);
    showToast("Payment logged");
  }

  async function updateOrder(id, data) {
    try {
      await ordersApi.update(id, data);
      await refreshData();
      setEditOrder(null);
      showToast("Delivery updated");
    } catch (e) {
      showToast(e.message);
      throw e;
    }
  }

  async function deleteOrder(id) {
    try {
      await ordersApi.remove(id);
      await refreshData();
      showToast("Delivery deleted");
    } catch (e) {
      showToast(e.message);
      throw e;
    }
  }

  async function updatePayment(id, data) {
    try {
      await paymentsApi.update(id, data);
      await refreshData();
      setEditPayment(null);
      showToast("Payment updated");
    } catch (e) {
      showToast(e.message);
      throw e;
    }
  }

  async function deletePayment(id) {
    try {
      await paymentsApi.remove(id);
      await refreshData();
      showToast("Payment deleted");
    } catch (e) {
      showToast(e.message);
      throw e;
    }
  }

  async function sendReminder(franchise) {
    await remindersApi.create({
      franchiseId: franchise.id,
      due: franchise.totalDue,
      daysOverdue: franchise.daysOverdue,
    });
    await refreshData();
    showToast("Reminder logged");
  }

  async function addUser(data) {
    try {
      await usersApi.create(data);
      await refreshData();
      setShowAddUser(false);
      showToast("Employee added");
    } catch (e) {
      showToast(e.message);
    }
  }

  async function saveSettings(next) {
    await settingsApi.update(next);
    setSettings(next);
    await refreshData();
    showToast("Settings saved");
  }

  async function changePassword(currentPassword, newPassword) {
    try {
      await authApi.changePassword(currentPassword, newPassword);
      showToast("Password updated");
      return null;
    } catch (e) {
      return e.message;
    }
  }

  return {
    loading,
    users,
    settings,
    currentUser,
    view,
    setView,
    selectedFranchiseId,
    setSelectedFranchiseId,
    showAddFranchise,
    setShowAddFranchise,
    editFranchise,
    setEditFranchise,
    showAddOrderFor,
    setShowAddOrderFor,
    showAddPaymentFor,
    setShowAddPaymentFor,
    editOrder,
    setEditOrder,
    editPayment,
    setEditPayment,
    showAddUser,
    setShowAddUser,
    search,
    setSearch,
    toast,
    ordersByFranchise,
    paymentsByFranchise,
    franchiseSummaries,
    alertFranchises,
    totals,
    activityLog,
    reminderCountFor,
    lastReminderFor,
    handleLogin,
    handleLogout,
    addFranchise,
    updateFranchise,
    deleteFranchise,
    addOrder,
    addPayment,
    updateOrder,
    deleteOrder,
    updatePayment,
    deletePayment,
    sendReminder,
    addUser,
    deleteUser,
    saveSettings,
    changePassword,
  };
}
