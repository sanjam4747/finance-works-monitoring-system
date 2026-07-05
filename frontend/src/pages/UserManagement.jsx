import { useEffect, useState, useCallback } from 'react';
import { userAPI, departmentAPI } from '../api/services';
import LoadingSpinner from '../components/LoadingSpinner';

const ROLE_LABELS = {
  ADMIN:          'Administrator',
  EXECUTIVE_USER: 'Executive User',
  ACCOUNTS_USER:  'Accounts User',
};
const ROLE_COLORS = {
  ADMIN:          'bg-amber-100 text-amber-700',
  EXECUTIVE_USER: 'bg-blue-100 text-blue-700',
  ACCOUNTS_USER:  'bg-emerald-100 text-emerald-700',
};

const EMPTY_FORM = {
  username:     '',
  password:     '',
  role:         '',
  fullName:     '',
  email:        '',
  departmentId: '',
};

export default function UserManagement() {
  const [users, setUsers]               = useState([]);
  const [departments, setDepartments]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actionMsg, setActionMsg]       = useState({ text: '', type: '' });

  // Modal state
  const [modal, setModal]               = useState(null);  // null | 'create' | 'edit' | 'confirm-deactivate' | 'confirm-activate' | 'confirm-delete'
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [formError, setFormError]       = useState('');
  const [formLoading, setFormLoading]   = useState(false);

  // Search / filter
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, deptRes] = await Promise.all([
        userAPI.getAll(),
        departmentAPI.getAll(),
      ]);
      setUsers(usersRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      showMsg('Failed to load users: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showMsg = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setSelectedUser(null);
    setModal('create');
  };

  const openEdit = (user) => {
    setForm({
      username:     user.username,
      password:     '',    // blank = keep existing
      role:         user.role,
      fullName:     user.fullName || '',
      email:        user.email || '',
      departmentId: user.departmentId || '',
    });
    setFormError('');
    setSelectedUser(user);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setSelectedUser(null); };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await userAPI.create({
        username:     form.username.trim(),
        password:     form.password,
        role:         form.role,
        fullName:     form.fullName || null,
        email:        form.email || null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      });
      showMsg(`User "${form.username}" created successfully.`);
      closeModal();
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await userAPI.update(selectedUser.id, {
        role:         form.role,
        fullName:     form.fullName || null,
        email:        form.email || null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        password:     form.password || null,
      });
      showMsg(`User "${selectedUser.username}" updated successfully.`);
      closeModal();
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    try {
      if (selectedUser.isActive) {
        await userAPI.deactivate(selectedUser.id);
        showMsg(`User "${selectedUser.username}" deactivated.`);
      } else {
        await userAPI.activate(selectedUser.id);
        showMsg(`User "${selectedUser.username}" activated.`);
      }
      closeModal();
      loadData();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to update status', 'error');
      closeModal();
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    try {
      await userAPI.delete(selectedUser.id);
      showMsg(`User "${selectedUser.username}" permanently deleted.`);
      closeModal();
      loadData();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to delete user', 'error');
      closeModal();
    } finally {
      setFormLoading(false);
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      u.username?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.departmentName?.toLowerCase().includes(q);
    const matchesRole = !filterRole || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner message="Loading users…" />;

  return (
    <div className="space-y-5 fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[1rem] font-bold text-slate-800">User Management</h2>
          <p className="text-[0.75rem] text-slate-400 mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New User
        </button>
      </div>

      {/* ── Action feedback ── */}
      {actionMsg.text && (
        <div className={`px-4 py-3 rounded-xl text-[0.8125rem] font-medium ${
          actionMsg.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          {actionMsg.text}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, username, email or department…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input flex-1 text-sm"
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="form-select sm:w-48 text-sm"
        >
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* ── Users Table ── */}
      <div className="card overflow-hidden">
        <div className="table-scroll-wrapper">
          <table className="w-full text-[0.8125rem]" style={{ minWidth: 700 }}>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['User', 'Role', 'Department', 'Email', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : filtered.map(user => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white ${ROLE_COLORS[user.role]?.replace('bg-', 'bg-').replace('text-', 'text-') ?? 'bg-slate-300'}`}
                           style={{ background: user.role === 'ADMIN' ? '#d97706' : user.role === 'EXECUTIVE_USER' ? '#2563eb' : '#059669', color: '#fff' }}>
                        {(user.fullName || user.username)?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{user.fullName || user.username}</p>
                        <p className="text-[0.6875rem] text-slate-400 font-mono">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-600'}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.departmentName || <span className="text-slate-300 italic">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{user.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold ${
                      user.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {/* Toggle active */}
                      <button
                        onClick={() => { setSelectedUser(user); setModal(user.isActive ? 'confirm-deactivate' : 'confirm-activate'); }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.isActive
                            ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {user.isActive
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          }
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => { setSelectedUser(user); setModal('confirm-delete'); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MODAL — Create / Edit User
      ════════════════════════════════════════ */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-[0.9375rem] font-bold text-slate-800">
                {modal === 'create' ? 'Create New User' : `Edit User — ${selectedUser?.username}`}
              </h3>
            </div>

            <form onSubmit={modal === 'create' ? handleCreate : handleUpdate} className="px-6 py-5 space-y-4">
              {modal === 'create' && (
                <div>
                  <label className="form-label">Username <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. jdoe"
                    className="form-input"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleFormChange}
                    placeholder="e.g. John Doe"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="e.g. jdoe@nwr.gov.in"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Role <span className="text-red-500">*</span></label>
                  <select name="role" value={form.role} onChange={handleFormChange} required className="form-select">
                    <option value="">Select Role</option>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <select name="departmentId" value={form.departmentId} onChange={handleFormChange} className="form-select">
                    <option value="">Unassigned</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">
                  {modal === 'create' ? 'Password' : 'New Password'}
                  {modal === 'edit' && <span className="ml-1 font-normal text-slate-400">(leave blank to keep existing)</span>}
                  {modal === 'create' && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  required={modal === 'create'}
                  placeholder={modal === 'create' ? 'Set a password' : 'New password (optional)'}
                  className="form-input"
                />
              </div>

              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[0.8125rem] rounded-xl">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formLoading} className="btn btn-primary flex-1">
                  {formLoading
                    ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span>
                    : modal === 'create' ? 'Create User' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeModal} className="btn btn-secondary px-5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL — Confirm Deactivate
      ════════════════════════════════════════ */}
      {modal === 'confirm-deactivate' && selectedUser && (
        <ConfirmModal
          title="Deactivate User"
          message={`Are you sure you want to deactivate "${selectedUser.fullName || selectedUser.username}"? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          confirmClass="bg-amber-500 hover:bg-amber-600 text-white"
          loading={formLoading}
          onConfirm={handleToggleActive}
          onCancel={closeModal}
        />
      )}

      {/* ════════════════════════════════════════
          MODAL — Confirm Activate
      ════════════════════════════════════════ */}
      {modal === 'confirm-activate' && selectedUser && (
        <ConfirmModal
          title="Activate User"
          message={`Re-activate "${selectedUser.fullName || selectedUser.username}"? They will be able to log in again.`}
          confirmLabel="Activate"
          confirmClass="bg-emerald-600 hover:bg-emerald-700 text-white"
          loading={formLoading}
          onConfirm={handleToggleActive}
          onCancel={closeModal}
        />
      )}

      {/* ════════════════════════════════════════
          MODAL — Confirm Delete
      ════════════════════════════════════════ */}
      {modal === 'confirm-delete' && selectedUser && (
        <ConfirmModal
          title="Delete User"
          message={`Permanently delete "${selectedUser.fullName || selectedUser.username}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="bg-red-600 hover:bg-red-700 text-white"
          loading={formLoading}
          onConfirm={handleDelete}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}

// ── Reusable Confirm Dialog ──────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, confirmClass, loading, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-[0.9375rem] font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-[0.8125rem] text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn flex-1 ${confirmClass}`}
          >
            {loading
              ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />…</span>
              : confirmLabel}
          </button>
          <button onClick={onCancel} className="btn btn-secondary px-5">Cancel</button>
        </div>
      </div>
    </div>
  );
}
