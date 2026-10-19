import "./login.css";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaSpinner } from "react-icons/fa";
import { showError, showSuccess, showWarning } from "../../shared/utils/alert";
import authService from "./authservice";
import { loginSuccess } from "./authSlice";
import cartService from "../../services/cartService";

const emptySignup = {
  fullName: "",
  contact: "",
  otp: "",
  password: "",
  confirmPassword: "",
  challengeId: "",
};
const emptyReset = {
  identifier: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
  challengeId: "",
};

const getContactPayload = (value) => {
  const contact = value.trim();
  if (contact.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      return null;
    }
    return { email: contact.toLowerCase() };
  }

  if (!/^[+()\d\s.-]+$/.test(contact)) {
    return null;
  }
  const digits = contact.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return null;
  }
  return { mobileNumber: contact };
};

const challengeIdOf = (result) => {
  const challengeId = result?.challengeId ?? result?.ChallengeId;
  if (!challengeId) {
    throw new Error("The authentication API did not return a verification challenge.");
  }
  return challengeId;
};
const isValidOtp = (otp) => /^\d{4,8}$/.test(otp.trim());
const responseMessage = (error, fallback) =>
  error?.response?.data?.message ??
  error?.response?.data?.Message ??
  error?.message ??
  fallback;

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState("");
  const [modalStep, setModalStep] = useState("details");
  const [signup, setSignup] = useState(emptySignup);
  const [reset, setReset] = useState(emptyReset);

  const handleLoginChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const loginHandler = async (event) => {
    event.preventDefault();
    const identifier = formData.identifier.trim();
    if (!identifier) return showWarning("Contact required", "Enter your email address or mobile number.");
    if (!formData.password) return showWarning("Password required", "Enter your password.");

    setLoading(true);
    try {
      const auth = await authService.login({ identifier, password: formData.password });
      if (!auth?.accessToken || !auth?.user) {
        throw new Error("The login API response is missing the access token or user profile.");
      }

      dispatch(loginSuccess(auth));
      await showSuccess("Login successful", `Welcome ${auth.user.fullName || auth.user.name || "back"}`);
      cartService.mergeGuestCart();

      const role = auth.roles?.[0];
      const requestedRedirect = new URLSearchParams(location.search).get("redirect");
      const safeRedirect =
        requestedRedirect?.startsWith("/") &&
        !requestedRedirect.startsWith("//") &&
        requestedRedirect !== "/login"
          ? requestedRedirect
          : null;

      if (safeRedirect) {
        navigate(safeRedirect);
      } else if (["Admin", "SuperAdmin", "Super Admin", "Manager"].includes(role)) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      showError("Login failed", responseMessage(error, "Please check your credentials and try again."));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (name) => {
    setModal(name);
    setModalStep("details");
    setSignup(emptySignup);
    setReset(emptyReset);
  };

  const closeModal = () => {
    if (!loading) setModal("");
  };

  const sendSignupOtp = async (event) => {
    event.preventDefault();
    const contact = getContactPayload(signup.contact);
    if (!signup.fullName.trim()) return showWarning("Name required", "Enter your full name.");
    if (!contact) return showWarning("Invalid contact", "Enter a valid email address or mobile number.");

    setLoading(true);
    let sent = false;
    try {
      const result = await authService.requestRegistrationOtp({
        fullName: signup.fullName.trim(),
        ...contact,
      });
      setSignup((current) => ({ ...current, challengeId: challengeIdOf(result) }));
      setModalStep("otp");
      sent = true;
    } catch (error) {
      showError("Unable to send code", responseMessage(error, "Please try again."));
    } finally {
      setLoading(false);
    }
    if (sent) {
      await showSuccess("Verification code sent", "Enter the code sent to your email or mobile number.");
    }
  };

  const verifySignupOtp = async (event) => {
    event.preventDefault();
    if (!isValidOtp(signup.otp)) {
      return showWarning("Invalid code", "Enter the 4 to 8 digit verification code.");
    }
    if (signup.password.length < 8) {
      return showWarning("Password too short", "Use at least 8 characters for your password.");
    }
    if (signup.password !== signup.confirmPassword) {
      return showWarning("Passwords do not match", "Confirm your password again.");
    }
    setLoading(true);
    try {
      await authService.verifyRegistrationOtp({
        challengeId: signup.challengeId,
        otp: signup.otp.trim(),
        password: signup.password,
      });
      setFormData((current) => ({ ...current, identifier: signup.contact.trim(), password: "" }));
      setModal("");
      await showSuccess("Account verified", "Your account is ready. Sign in to continue.");
    } catch (error) {
      showError("Verification failed", responseMessage(error, "The code is invalid or has expired."));
    } finally {
      setLoading(false);
    }
  };

  const sendResetOtp = async (event) => {
    event.preventDefault();
    if (!reset.identifier.trim()) {
      return showWarning("Contact required", "Enter the email address or mobile number for your account.");
    }
    setLoading(true);
    try {
      const result = await authService.requestPasswordReset({ identifier: reset.identifier.trim() });
      setReset((current) => ({ ...current, challengeId: challengeIdOf(result) }));
      setModalStep("otp");
      await showSuccess("If the account exists, a code has been sent", "Check your email or mobile number.");
    } catch (error) {
      showError("Unable to request reset", responseMessage(error, "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (!isValidOtp(reset.otp)) {
      return showWarning("Invalid code", "Enter the 4 to 8 digit verification code.");
    }
    if (reset.newPassword.length < 8) {
      return showWarning("Password too short", "Use at least 8 characters for your new password.");
    }
    if (reset.newPassword !== reset.confirmPassword) {
      return showWarning("Passwords do not match", "Enter the same new password in both fields.");
    }
    setLoading(true);
    try {
      await authService.resetPassword({
        challengeId: reset.challengeId,
        otp: reset.otp.trim(),
        newPassword: reset.newPassword,
      });
      setFormData((current) => ({ ...current, identifier: reset.identifier.trim(), password: "" }));
      setModal("");
      await showSuccess("Password updated", "Sign in with your new password.");
    } catch (error) {
      showError("Unable to reset password", responseMessage(error, "The code may be invalid or expired."));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      const result =
        modal === "signup"
          ? await authService.requestRegistrationOtp({
              fullName: signup.fullName.trim(),
              ...getContactPayload(signup.contact),
            })
          : await authService.requestPasswordReset({ identifier: reset.identifier.trim() });
      const challengeId = challengeIdOf(result);
      if (modal === "signup") {
        setSignup((current) => ({ ...current, challengeId, otp: "" }));
      } else {
        setReset((current) => ({ ...current, challengeId, otp: "" }));
      }
      await showSuccess("New code sent", "Use the latest verification code.");
    } catch (error) {
      showError("Unable to resend code", responseMessage(error, "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="left-content">
          <h1>Digital Commerce Agent</h1>
          <p>AI Powered Ecommerce Automation Platform</p>
          <img
            src="https://images.unsplash.com/photo-1556740749-887f6717d7e4"
            alt="Online shopping"
          />
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="sub-text">Login to continue</p>
          <form onSubmit={loginHandler}>
            <div className="input-group">
              <FaEnvelope className="input-icon" aria-hidden="true" />
              <input
                type="text"
                name="identifier"
                placeholder="Email address or mobile number"
                value={formData.identifier}
                onChange={handleLoginChange}
                autoComplete="username"
                aria-label="Email address or mobile number"
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" aria-hidden="true" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleLoginChange}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="options">
              <span />
              <button type="button" className="text-link" onClick={() => openModal("forgot")}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>

            <p className="signup-text">
              Don&apos;t have an account?
              <button type="button" className="text-link" onClick={() => openModal("signup")}>
                Sign up
              </button>
            </p>
          </form>
        </div>
      </div>

      {modal && (
        <div
          className="auth-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <button type="button" className="auth-modal-close" onClick={closeModal} aria-label="Close">
              ×
            </button>

            {modal === "signup" ? (
              <>
                <h2 id="auth-modal-title">Create your account</h2>
                <p className="auth-modal-description">
                  {modalStep === "details"
                    ? "Enter your name and email or mobile number to get a verification code."
                    : `Enter the code sent to ${signup.contact} and create a password.`}
                </p>
                {modalStep === "details" ? (
                  <form onSubmit={sendSignupOtp}>
                    <label className="auth-field">
                      Full name
                      <input
                        type="text"
                        autoComplete="name"
                        value={signup.fullName}
                        onChange={(event) => setSignup((current) => ({ ...current, fullName: event.target.value }))}
                        required
                        maxLength={120}
                      />
                    </label>
                    <label className="auth-field">
                      Email or mobile number
                      <input
                        type="text"
                        autoComplete="email"
                        value={signup.contact}
                        onChange={(event) => setSignup((current) => ({ ...current, contact: event.target.value }))}
                        required
                      />
                    </label>
                    <button type="submit" className="login-btn" disabled={loading}>
                      {loading && <FaSpinner className="auth-button-spinner" aria-hidden="true" />}
                      {loading ? "Sending code..." : "Send verification code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={verifySignupOtp}>
                    <label className="auth-field">
                      Verification code
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={signup.otp}
                        onChange={(event) => setSignup((current) => ({ ...current, otp: event.target.value }))}
                        required
                        maxLength={8}
                      />
                    </label>
                    <label className="auth-field">
                      Create password
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={signup.password}
                        onChange={(event) => setSignup((current) => ({ ...current, password: event.target.value }))}
                        required
                        minLength={8}
                      />
                    </label>
                    <label className="auth-field">
                      Confirm password
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={signup.confirmPassword}
                        onChange={(event) =>
                          setSignup((current) => ({ ...current, confirmPassword: event.target.value }))
                        }
                        required
                        minLength={8}
                      />
                    </label>
                    <button type="submit" className="login-btn" disabled={loading}>
                      {loading ? "Verifying..." : "Verify and create account"}
                    </button>
                    <button type="button" className="modal-secondary-action" onClick={resendOtp} disabled={loading}>
                      Resend code
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <h2 id="auth-modal-title">Reset your password</h2>
                <p className="auth-modal-description">
                  {modalStep === "details"
                    ? "We’ll send a one-time code to the email or mobile number on your account."
                    : `Enter the code sent to ${reset.identifier} and choose a new password.`}
                </p>
                {modalStep === "details" ? (
                  <form onSubmit={sendResetOtp}>
                    <label className="auth-field">
                      Email or mobile number
                      <input
                        type="text"
                        autoComplete="username"
                        value={reset.identifier}
                        onChange={(event) => setReset((current) => ({ ...current, identifier: event.target.value }))}
                        required
                      />
                    </label>
                    <button type="submit" className="login-btn" disabled={loading}>
                      {loading ? "Sending code..." : "Send reset code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={resetPassword}>
                    <label className="auth-field">
                      Verification code
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={reset.otp}
                        onChange={(event) => setReset((current) => ({ ...current, otp: event.target.value }))}
                        required
                        maxLength={8}
                      />
                    </label>
                    <label className="auth-field">
                      New password
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={reset.newPassword}
                        onChange={(event) => setReset((current) => ({ ...current, newPassword: event.target.value }))}
                        required
                        minLength={8}
                      />
                    </label>
                    <label className="auth-field">
                      Confirm new password
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={reset.confirmPassword}
                        onChange={(event) => setReset((current) => ({ ...current, confirmPassword: event.target.value }))}
                        required
                        minLength={8}
                      />
                    </label>
                    <button type="submit" className="login-btn" disabled={loading}>
                      {loading ? "Updating password..." : "Create new password"}
                    </button>
                    <button type="button" className="modal-secondary-action" onClick={resendOtp} disabled={loading}>
                      Resend code
                    </button>
                  </form>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Login;
