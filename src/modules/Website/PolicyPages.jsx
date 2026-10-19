import { Link } from "react-router-dom";
import storeDetails from "../../config/storeDetails";

const contentStyle = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "48px 24px 64px",
  lineHeight: 1.7,
  color: "var(--text)",
};

export function TermsAndConditions() {
  return (
    <main style={contentStyle}>
      <p style={{ color: "var(--text2)" }}>Last updated: October 2026</p>
      <h1>Terms &amp; Conditions</h1>
      <p>These terms apply when you browse or place an order through {storeDetails.brand}. By using this website, you agree to these terms.</p>
      <h2>Products and orders</h2>
      <p>Product descriptions, images, prices, availability, and offers are provided for shopping information and may be updated. An order is subject to confirmation, stock availability, and successful payment or other accepted payment arrangements.</p>
      <h2>Payments, delivery, and returns</h2>
      <p>Applicable charges and delivery details are shown during checkout. Please refer to the information presented for your order and contact us promptly if an order or delivered product has an issue. Any applicable cancellation, return, or refund will be handled under the policy displayed for that order and applicable law.</p>
      <h2>Website use</h2>
      <p>You agree to provide accurate order details and use the website lawfully. Website content may not be copied or used commercially without permission.</p>
      <h2>Contact</h2>
      <p>Questions about these terms? Email <a href={`mailto:${storeDetails.email}`}>{storeDetails.email}</a>.</p>
      <p><Link to="/">Return to the store</Link></p>
    </main>
  );
}

export function PrivacyPolicy() {
  return (
    <main style={contentStyle}>
      <p style={{ color: "var(--text2)" }}>Last updated: October 2026</p>
      <h1>Privacy Policy</h1>
      <p>This notice explains how {storeDetails.brand} may use information you provide when browsing, contacting us, or placing an order.</p>
      <h2>Information and purpose</h2>
      <p>Information such as contact, delivery, account, and order details may be used to respond to enquiries, process and deliver orders, provide customer support, and meet legal or accounting requirements.</p>
      <h2>Sharing and protection</h2>
      <p>Information may be shared with service providers involved in payment, delivery, website operation, or customer support when needed to provide those services, or where required by law. Reasonable safeguards should be used to protect information; no online transmission or storage method can be guaranteed completely secure.</p>
      <h2>Your choices</h2>
      <p>You may contact us to ask about or correct personal information associated with your account or order, subject to applicable legal requirements.</p>
      <h2>Contact</h2>
      <p>For privacy questions, email <a href={`mailto:${storeDetails.email}`}>{storeDetails.email}</a>.</p>
      <p><Link to="/">Return to the store</Link></p>
    </main>
  );
}
