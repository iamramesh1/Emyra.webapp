import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "./profile.css";

const profileValue = (user, ...keys) => {
  for (const key of keys) {
    const value = user?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "Not provided";
};

function Profile() {
  const user = useSelector((state) => state.auth.user);
  const fullName = profileValue(user, "fullName", "FullName", "name", "Name");
  const email = profileValue(user, "email", "Email");
  const mobileNumber = profileValue(user, "mobileNumber", "MobileNumber", "phone", "Phone");

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="profile-heading">
        <p className="account-eyebrow">Your account</p>
        <h1 id="profile-heading">My profile</h1>
        <dl className="profile-details">
          <div>
            <dt>Full name</dt>
            <dd>{fullName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>Mobile number</dt>
            <dd>{mobileNumber}</dd>
          </div>
        </dl>
        <div className="account-actions">
          <Link className="account-primary-link" to="/orders">
            My orders and delivery tracking
          </Link>
          <Link className="account-secondary-link" to="/change-password">
            Change password
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Profile;
