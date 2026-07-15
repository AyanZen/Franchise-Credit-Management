import { useEffect, useState } from "react";
import MotionBackground from "../components/layout/MotionBackground";
import LoginScreen from "../components/auth/LoginScreen";
import FranchiseForm from "../components/forms/FranchiseForm";
import OrderForm from "../components/forms/OrderForm";
import PaymentForm from "../components/forms/PaymentForm";
import UserForm from "../components/forms/UserForm";
import LoadingScreen from "../components/layout/LoadingScreen";
import MobileHeader from "../components/layout/MobileHeader";
import Sidebar from "../components/layout/Sidebar";
import ActivityLogView from "../components/views/ActivityLogView";
import AlertsView from "../components/views/AlertsView";
import Dashboard from "../components/views/Dashboard";
import FranchiseDashboard from "../components/franchise/FranchiseDashboard";
import FranchisesList from "../components/views/FranchisesList";
import SettingsView from "../components/views/SettingsView";
import UsersView from "../components/views/UsersView";
import { usePortalData } from "../hooks/usePortalData";

export default function PortalApp() {
  const {
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
  } = usePortalData();

  const isAdmin = currentUser?.role === "admin";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [view]);

  if (loading) {
    return (
      <div className="fp-app">
        <MotionBackground />
        <LoadingScreen />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="fp-app">
        <MotionBackground />
        <LoginScreen onLogin={handleLogin} />
      </div>
    );
  }

  const selectedFranchise = franchiseSummaries.find((f) => f.id === selectedFranchiseId);
  const paymentFranchise = showAddPaymentFor || editPayment
    ? franchiseSummaries.find((f) => f.id === (showAddPaymentFor || editPayment?.franchiseId))
    : null;

  return (
    <div className="fp-app">
      <MotionBackground />
      <div className="fp-content">
        <div className="shell">
          {menuOpen && (
            <button
              type="button"
              className="sidebar-overlay sidebar-overlay--visible"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            />
          )}
          <MobileHeader menuOpen={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
          <Sidebar
            view={view}
            setView={(v) => { setView(v); setSelectedFranchiseId(null); }}
            currentUser={currentUser}
            onLogout={handleLogout}
            alertCount={totals.criticalCount + totals.overdueCount}
            mobileOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
          />
          <main className="main view-fade" key={view}>
            {toast && <div className="toast">{toast}</div>}

            {view === "dashboard" && (
              <Dashboard
                totals={totals}
                alertFranchises={alertFranchises}
                activityLog={activityLog}
                onOpenFranchise={(id) => { setSelectedFranchiseId(id); setView("franchiseDetail"); }}
                onGoAlerts={() => setView("alerts")}
              />
            )}

            {view === "franchises" && (
              <FranchisesList
                franchises={franchiseSummaries}
                search={search}
                setSearch={setSearch}
                onAdd={() => setShowAddFranchise(true)}
                onOpen={(id) => { setSelectedFranchiseId(id); setView("franchiseDetail"); }}
                isAdmin={isAdmin}
                onDelete={deleteFranchise}
              />
            )}

            {view === "franchiseDetail" && selectedFranchise && (
              <FranchiseDashboard
                franchise={selectedFranchise}
                orders={(ordersByFranchise[selectedFranchise.id] || []).sort((a, b) => (a.date < b.date ? 1 : -1))}
                payments={paymentsByFranchise[selectedFranchise.id] || []}
                activityLog={activityLog}
                isAdmin={isAdmin}
                onBack={() => setView("franchises")}
                onEdit={() => setEditFranchise(selectedFranchise)}
                onDelete={deleteFranchise}
                onAddOrder={() => setShowAddOrderFor(selectedFranchise.id)}
                onAddPayment={() => setShowAddPaymentFor(selectedFranchise.id)}
                onEditOrder={(order) => setEditOrder(order)}
                onDeleteOrder={deleteOrder}
                onEditPayment={(payment) => setEditPayment(payment)}
                onDeletePayment={deletePayment}
                onSendReminder={sendReminder}
                lastReminderFor={lastReminderFor}
                reminderCountFor={reminderCountFor}
              />
            )}

            {view === "alerts" && (
              <AlertsView
                alertFranchises={alertFranchises}
                onOpenFranchise={(id) => { setSelectedFranchiseId(id); setView("franchiseDetail"); }}
                onSendReminder={sendReminder}
                lastReminderFor={lastReminderFor}
              />
            )}

            {view === "activity" && <ActivityLogView log={activityLog} users={users} />}

            {view === "users" && isAdmin && (
              <UsersView
                users={users}
                currentUser={currentUser}
                onAdd={() => setShowAddUser(true)}
                onDelete={deleteUser}
              />
            )}

            {view === "settings" && (
              <SettingsView
                settings={settings}
                isAdmin={isAdmin}
                currentUser={currentUser}
                onSave={saveSettings}
                onChangePassword={changePassword}
              />
            )}
          </main>
        </div>
      </div>

      {showAddFranchise && isAdmin && (
        <FranchiseForm onClose={() => setShowAddFranchise(false)} onSubmit={addFranchise} />
      )}
      {editFranchise && isAdmin && (
        <FranchiseForm
          initial={editFranchise}
          onClose={() => setEditFranchise(null)}
          onSubmit={(data) => updateFranchise(editFranchise.id, data)}
        />
      )}
      {showAddOrderFor && (
        <OrderForm
          settings={settings}
          onClose={() => setShowAddOrderFor(null)}
          onSubmit={(data) => addOrder(showAddOrderFor, data)}
        />
      )}
      {editOrder && (
        <OrderForm
          settings={settings}
          initial={editOrder}
          onClose={() => setEditOrder(null)}
          onSubmit={(data) => updateOrder(editOrder.id, data)}
        />
      )}
      {showAddPaymentFor && paymentFranchise && (
        <PaymentForm
          franchise={paymentFranchise}
          onClose={() => setShowAddPaymentFor(null)}
          onSubmit={(data) => addPayment(showAddPaymentFor, data)}
        />
      )}
      {editPayment && paymentFranchise && (
        <PaymentForm
          franchise={paymentFranchise}
          initial={editPayment}
          onClose={() => setEditPayment(null)}
          onSubmit={(data) => updatePayment(editPayment.id, data)}
        />
      )}
      {showAddUser && (
        <UserForm onClose={() => setShowAddUser(false)} onSubmit={addUser} />
      )}
    </div>
  );
}
