import { useCallback, useEffect, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import API_ENDPOINTS from "../../config/apiEndpoints";
import userService from "./userService";

const emptyUser = {
  id: "",
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
  gender: "",
  roleId: "",
  isActive: true,
};

const emptyRole = {
  id: "",
  name: "",
  description: "",
  isActive: true,
  permissions: [],
};

const rolePermissionGroups = [
  { name: "Dashboard", actions: ["View"] },
  { name: "Users", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "Products", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "Categories", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "Orders", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "LandingPages", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "B2BEnquiries", actions: ["View", "Create", "Edit", "Delete"] },
  { name: "AmazonPush", actions: ["View", "Create", "Edit", "Delete"] },
];

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  color: "var(--text)",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  font: "inherit",
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "10px 14px",
  color: "#fff",
  background: "var(--accent)",
  border: 0,
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
};

function valueOf(item, ...keys) {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
  }
  return "";
}

function userId(user) {
  return valueOf(user, "Id", "id", "UserId", "userId");
}

function roleId(role) {
  return valueOf(role, "Id", "id", "RoleId", "roleId");
}

function roleName(role) {
  return valueOf(role, "Name", "name", "RoleName", "roleName");
}

function rolePermissions(role) {
  const permissions = valueOf(role, "Permissions", "permissions");
  return Array.isArray(permissions) ? permissions : [];
}

function isRoleActive(role) {
  return valueOf(role, "IsActive", "isActive") !== false;
}

function statusLabel(value) {
  return value === false ? "Inactive" : "Active";
}

function apiErrorMessage(error) {
  const body = error?.response?.data;
  const message =
    body?.message ??
    body?.Message ??
    error?.message;
  const details = body?.errors ?? body?.Errors;
  const detailText = Array.isArray(details)
    ? details.filter(Boolean).join("; ")
    : typeof details === "string"
      ? details
      : "";
  const status = error?.response?.status;
  const networkHint = error?.code === "ERR_NETWORK"
    ? "Could not reach the user API. Check that the API is running and the configured URL/CORS policy is correct."
    : "";

  return [message, detailText, status ? `HTTP ${status}` : "", networkHint]
    .filter(Boolean)
    .join(" — ") || "The request failed without an error message.";
}

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const [usersResult, rolesResult] = await Promise.allSettled([
      userService.getUsers(),
      userService.getRoles(),
    ]);
    const errors = [];

    if (usersResult.status === "fulfilled") {
      setUsers(usersResult.value);
    } else {
      console.error("Failed to load users:", usersResult.reason);
      errors.push(`Users (${API_ENDPOINTS.USERS.GET_ALL}): ${apiErrorMessage(usersResult.reason)}`);
    }

    if (rolesResult.status === "fulfilled") {
      setRoles(rolesResult.value);
    } else {
      console.error("Failed to load roles:", rolesResult.reason);
      errors.push(`Roles (${API_ENDPOINTS.ROLES.GET_ALL}): ${apiErrorMessage(rolesResult.reason)}`);
    }

    setError(errors.join(" | "));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectableRoles = roles.filter(
    (role) => isRoleActive(role) || String(roleId(role)) === String(userForm.roleId)
  );

  const saveUser = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSavingUser(true);

    const payload = {
      FullName: userForm.name.trim(),
      Email: userForm.email.trim(),
      Gender: userForm.gender,
    };

    try {
      if (userForm.id) {
        const updatePayload = {
          Name: payload.FullName,
          Email: payload.Email,
          PhoneNumber: userForm.phoneNumber.trim(),
          Gender: payload.Gender,
          RoleId: userForm.roleId,
          IsActive: userForm.isActive,
        };
        if (userForm.password) updatePayload.Password = userForm.password;
        await userService.updateUser(userForm.id, updatePayload);
        setNotice("User updated.");
      } else {
        const selectedRole = roles.find((role) => String(roleId(role)) === String(userForm.roleId));
        if (!selectedRole) {
          setError("Select a valid role before creating this user.");
          return;
        }
        await userService.createUser({
          ...payload,
          Password: userForm.password,
          Role: roleName(selectedRole),
        });
        setNotice("User created.");
      }
      setUserForm(emptyUser);
      await loadData();
    } catch (saveError) {
      console.error("Failed to save user:", saveError);
      setError(saveError.response?.data?.message || "Unable to save this user.");
    } finally {
      setSavingUser(false);
    }
  };

  const editUser = (user) => {
    setUserForm({
      id: userId(user),
      name: valueOf(user, "Name", "name", "FullName", "fullName"),
      email: valueOf(user, "Email", "email"),
      phoneNumber: valueOf(user, "PhoneNumber", "phoneNumber", "Phone", "phone"),
      password: "",
      gender: valueOf(user, "Gender", "gender"),
      roleId: String(valueOf(user, "RoleId", "roleId", "RoleID") || ""),
      isActive: valueOf(user, "IsActive", "isActive") !== false,
    });
  };

  const deleteUser = async (user) => {
    const name = valueOf(user, "Name", "name", "FullName", "fullName") || valueOf(user, "Email", "email") || "this user";
    if (!window.confirm(`Delete "${name}"?`)) return;
    setError("");
    setNotice("");
    try {
      await userService.deleteUser(userId(user));
      setNotice("User deleted.");
      await loadData();
    } catch (deleteError) {
      console.error("Failed to delete user:", deleteError);
      setError(deleteError.response?.data?.message || "Unable to delete this user.");
    }
  };

  const saveRole = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSavingRole(true);
    const payload = {
      id: roleForm.id || undefined,
      name: roleForm.name.trim(),
      description: roleForm.description.trim(),
      isActive: roleForm.isActive,
      permissions: roleForm.permissions,
    };

    try {
      if (roleForm.id) {
        await userService.updateRole(payload);
        setNotice("Role updated.");
      } else {
        delete payload.id;
        await userService.createRole(payload);
        setNotice("Role created.");
      }
      setRoleForm(emptyRole);
      await loadData();
    } catch (saveError) {
      console.error("Failed to save role:", saveError);
      setError(saveError.response?.data?.message || "Unable to save this role.");
    } finally {
      setSavingRole(false);
    }
  };

  const deleteRole = async (role) => {
    const name = roleName(role) || "this role";
    if (!window.confirm(`Delete "${name}"?`)) return;
    setError("");
    setNotice("");
    try {
      await userService.deleteRole(roleId(role));
      setNotice("Role deleted.");
      await loadData();
    } catch (deleteError) {
      console.error("Failed to delete role:", deleteError);
      setError(deleteError.response?.data?.message || "Unable to delete this role.");
    }
  };

  return (
    <main style={{ padding: 32, maxWidth: 1300, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1, fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>
          Administration
        </p>
        <h1 style={{ margin: 0, fontSize: 28 }}>Users &amp; roles</h1>
        <p style={{ color: "var(--text2)", marginBottom: 0 }}>
          Create user accounts, assign roles, and manage the roles available to administrators.
        </p>
      </header>

      {error && (
        <div role="alert" style={{ padding: 12, marginBottom: 16, color: "#b91c1c", background: "#fee2e2", borderRadius: 8 }}>
          <span>{error}</span>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{ ...buttonStyle, marginLeft: 12, padding: "6px 10px", color: "#7f1d1d", background: "#fecaca" }}
          >
            {loading ? "Retrying..." : "Retry"}
          </button>
        </div>
      )}
      {notice && <div role="status" style={{ padding: 12, marginBottom: 16, color: "#166534", background: "#dcfce7", borderRadius: 8 }}>{notice}</div>}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20, marginBottom: 24 }}>
        <form onSubmit={saveUser} style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>{userForm.id ? "Edit user" : "Create user"}</h2>
          <label htmlFor="user-name">Full name</label>
          <input id="user-name" autoComplete="name" required maxLength={150} value={userForm.name} onChange={(event) => setUserForm((form) => ({ ...form, name: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px" }} />
          <label htmlFor="user-email">Email</label>
          <input id="user-email" type="email" autoComplete="email" required maxLength={254} value={userForm.email} onChange={(event) => setUserForm((form) => ({ ...form, email: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px" }} />
          <label htmlFor="user-gender">Gender</label>
          <select id="user-gender" required={!userForm.id} value={userForm.gender} onChange={(event) => setUserForm((form) => ({ ...form, gender: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px" }}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {userForm.id && (
            <>
              <label htmlFor="user-phone">Phone number</label>
              <input id="user-phone" type="tel" autoComplete="tel" maxLength={30} value={userForm.phoneNumber} onChange={(event) => setUserForm((form) => ({ ...form, phoneNumber: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px" }} />
            </>
          )}
          <label htmlFor="user-password">{userForm.id ? "New password (leave blank to keep current)" : "Temporary password"}</label>
          <input id="user-password" type="password" autoComplete="new-password" minLength={8} required={!userForm.id} value={userForm.password} onChange={(event) => setUserForm((form) => ({ ...form, password: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px" }} />
          <label htmlFor="user-role">Role</label>
          <select id="user-role" required value={userForm.roleId} onChange={(event) => setUserForm((form) => ({ ...form, roleId: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px" }}>
            <option value="">Select a role</option>
            {selectableRoles.map((role) => <option key={roleId(role)} value={roleId(role)}>{roleName(role)}</option>)}
          </select>
          {userForm.id && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <input type="checkbox" checked={userForm.isActive} onChange={(event) => setUserForm((form) => ({ ...form, isActive: event.target.checked }))} />
              Active
            </label>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={savingUser || roles.length === 0} style={buttonStyle}><FaPlus />{savingUser ? "Saving..." : userForm.id ? "Save user" : "Create user"}</button>
            {userForm.id && <button type="button" onClick={() => setUserForm(emptyUser)} style={{ ...buttonStyle, color: "var(--text)", background: "var(--surface2)" }}>Cancel</button>}
          </div>
          {roles.length === 0 && !loading && <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 0 }}>Create a role before adding a user.</p>}
        </form>

        <form onSubmit={saveRole} style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>{roleForm.id ? "Edit role" : "Create role"}</h2>
          <label htmlFor="role-name">Role name</label>
          <input id="role-name" required maxLength={100} value={roleForm.name} onChange={(event) => setRoleForm((form) => ({ ...form, name: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px" }} />
          <label htmlFor="role-description">Description</label>
          <textarea id="role-description" rows={3} maxLength={500} value={roleForm.description} onChange={(event) => setRoleForm((form) => ({ ...form, description: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px", resize: "vertical" }} />
          <fieldset style={{ margin: "0 0 16px", padding: 12, border: "1px solid var(--border)", borderRadius: 8 }}>
            <legend style={{ padding: "0 6px", fontWeight: 600 }}>Permissions</legend>
            <div style={{ overflowX: "auto" }}>
            {rolePermissionGroups.map((group) => (
              <div key={group.name} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 1fr) repeat(4, minmax(55px, auto))", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <strong>{group.name}</strong>
                {group.actions.map((action) => {
                  const permission = `${group.name}.${action}`;
                  const checked = rolePermissions(roleForm).includes(permission);
                  return (
                    <label key={permission} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        aria-label={permission}
                        checked={checked}
                        onChange={(event) => setRoleForm((form) => ({
                          ...form,
                          permissions: event.target.checked
                            ? [...form.permissions, permission]
                            : form.permissions.filter((item) => item !== permission),
                        }))}
                      />
                      {action}
                    </label>
                  );
                })}
              </div>
            ))}
            </div>
          </fieldset>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <input type="checkbox" checked={roleForm.isActive} onChange={(event) => setRoleForm((form) => ({ ...form, isActive: event.target.checked }))} />
            Active
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={savingRole} style={buttonStyle}><FaPlus />{savingRole ? "Saving..." : roleForm.id ? "Save role" : "Create role"}</button>
            {roleForm.id && <button type="button" onClick={() => setRoleForm(emptyRole)} style={{ ...buttonStyle, color: "var(--text)", background: "var(--surface2)" }}>Cancel</button>}
          </div>
        </form>
      </section>

      <section style={{ marginBottom: 24, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>User accounts</h2>
        </div>
        {loading ? <p style={{ padding: 20, color: "var(--text2)" }}>Loading users...</p> : users.length === 0 ? <p style={{ padding: 20, color: "var(--text2)" }}>No users have been created yet.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead><tr>{["Name", "Email", "Phone", "Role", "Status", "Actions"].map((heading) => <th key={heading} style={{ padding: 12, textAlign: "left", color: "var(--text2)", borderBottom: "1px solid var(--border)" }}>{heading}</th>)}</tr></thead>
              <tbody>
                {users.map((user) => {
                  const assignedRoleId = valueOf(user, "RoleId", "roleId", "RoleID");
                  const assignedRole = roles.find((role) => String(roleId(role)) === String(assignedRoleId));
                  const displayRole = valueOf(user, "RoleName", "roleName", "role", "Role") || (assignedRole ? roleName(assignedRole) : "—");
                  return (
                    <tr key={userId(user)}>
                      <td style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>{valueOf(user, "Name", "name", "FullName", "fullName") || "—"}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>{valueOf(user, "Email", "email") || "—"}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>{valueOf(user, "PhoneNumber", "phoneNumber", "Phone", "phone") || "—"}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>{displayRole}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>{statusLabel(valueOf(user, "IsActive", "isActive"))}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                        <button type="button" aria-label={`Edit ${valueOf(user, "Name", "name", "Email", "email")}`} onClick={() => editUser(user)} style={{ ...buttonStyle, padding: 9, marginRight: 8 }}><FaEdit /></button>
                        <button type="button" aria-label={`Delete ${valueOf(user, "Name", "name", "Email", "email")}`} onClick={() => deleteUser(user)} style={{ ...buttonStyle, padding: 9, background: "#dc2626" }}><FaTrash /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Available roles</h2>
        </div>
        {loading ? <p style={{ padding: 20, color: "var(--text2)" }}>Loading roles...</p> : roles.length === 0 ? <p style={{ padding: 20, color: "var(--text2)" }}>No roles have been created yet.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
              <thead><tr>{["Role", "Description", "Permissions", "Status", "Actions"].map((heading) => <th key={heading} style={{ padding: 12, textAlign: "left", color: "var(--text2)", borderBottom: "1px solid var(--border)" }}>{heading}</th>)}</tr></thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={roleId(role)}>
                    <td style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>{roleName(role)}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>{valueOf(role, "Description", "description") || "—"}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>{rolePermissions(role).join(", ") || "—"}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>{statusLabel(valueOf(role, "IsActive", "isActive"))}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                      <button type="button" aria-label={`Edit ${roleName(role)}`} onClick={() => setRoleForm({ id: roleId(role), name: roleName(role), description: valueOf(role, "Description", "description"), isActive: valueOf(role, "IsActive", "isActive") !== false, permissions: rolePermissions(role) })} style={{ ...buttonStyle, padding: 9, marginRight: 8 }}><FaEdit /></button>
                      <button type="button" aria-label={`Delete ${roleName(role)}`} onClick={() => deleteRole(role)} style={{ ...buttonStyle, padding: 9, background: "#dc2626" }}><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Users;
