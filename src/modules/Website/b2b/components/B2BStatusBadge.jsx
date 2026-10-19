const B2BStatusBadge = ({ status }) => {

  const statusKey = String(status || "").trim();
  const statusClass = statusKey
    .toLowerCase()
    .replaceAll("_", "-");

  const labels = {
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    QUOTATION_CREATED: "Quotation Created",
    QUOTATION_SENT: "Quotation Sent",
    CUSTOMER_ACCEPTED: "Customer Accepted",
    CUSTOMER_REJECTED: "Customer Rejected",
    CONVERTED_TO_ORDER: "Order Created",
    PAYMENT_PENDING: "Payment Pending",
    PAYMENT_CONFIRMED: "Payment Confirmed",
    PROCESSING: "Processing",
    PACKED: "Packed",
    SHIPPED: "Shipped",
    OUT_FOR_DELIVERY: "Out For Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled"
  };

  return (
    <span
      className={`b2b-status b2b-status-${statusClass || "default"}`}
    >
      {labels[statusKey] || statusKey || "Unknown"}
    </span>
  );
};

export default B2BStatusBadge;