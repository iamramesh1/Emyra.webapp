import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "./authservice";
import { showError, showSuccess, showWarning } from "../../shared/utils/alert";
import "./profile.css";

const responseMessage = (error) =>
  error?.response?.data?.message ??
  error?.response?.data?.Message ??
  error?.message ??
  "Please try again.";

function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword.length < 8) {
      return showWarning("Password too short", "Use at least 8 characters for your new password.");
    }
    if (form.newPassword !== form.confirmPassword) {
      return showWarning("Passwords do not match", "Confirm the new password again.");
    }
    if (form.currentPassword === form.newPassword) {
      return showWarning("Choose a new password", "Your new password must differ from your current password.");
    }

    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      await showSuccess("Password changed", "Your password has been updated.");
      navigate("/profile");
    } catch (error) {
      showError("Unable to change password", responseMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="change-password-heading">
        <p className="account-eyebrow">Security</p>
        <h1 id="change-password-heading">Change password</h1>
        <p className="account-description">Choose a strong password with at least 8 characters.</p>
        <form className="account-form" onSubmit={submit}>
          <label>
            Current password
            <input
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              name="newPassword"
              autoComplete="new-password"
              minLength={8}
              value={form.newPassword}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </label>
          <button className="account-primary-link" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ChangePassword;
