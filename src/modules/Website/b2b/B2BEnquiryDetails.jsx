import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import b2bService, { mapB2BEnquiry, unwrapB2BResponse } from "./b2bService";

import B2BStatusBadge from "./components/B2BStatusBadge";
import "./b2b.css";

const B2BEnquiryDetails = () => {

  const { id } = useParams();

  const navigate = useNavigate();

  const [enquiry, setEnquiry] =
    useState(null);

  const [loading, setLoading] =
    useState(true); 

  const [remarks, setRemarks] =
    useState("");
  const [nextStatus, setNextStatus] =
    useState("");
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [notice, setNotice] =
    useState("");

  const loadDetails = useCallback(async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await b2bService.getById(id);

      const data = unwrapB2BResponse(response);
      if (!data || typeof data !== "object") {
        throw new Error("The B2B enquiry API returned an invalid response.");
      }
      const mapped = mapB2BEnquiry(data);
      setEnquiry(mapped);
      setNextStatus(mapped.status);

    } catch (error) {

      console.error(error);
      setError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load enquiry details."
      );

    } finally {

      setLoading(false);

    }

  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDetails();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDetails]);


  const approve = async () => {

    try {
      setSaving(true);
      setError("");

      await b2bService.approve(
        id,
        remarks
      );

      await loadDetails();
      setNotice("Enquiry approved.");

    } catch (error) {

      setError(error?.response?.data?.message || "Approval failed.");

    } finally {
      setSaving(false);

    }

  };


  const reject = async () => {

    if (!remarks.trim()) {

      alert(
        "Please enter rejection remarks"
      );

      return;

    }

    try {
      setSaving(true);
      setError("");

      await b2bService.reject(
        id,
        remarks
      );

      await loadDetails();
      setNotice("Enquiry rejected.");

    } catch (error) {

      console.error("Enquiry rejection failed:", error);
      setError(error?.response?.data?.message || "Rejection failed.");

    } finally {
      setSaving(false);

    }

  };

  const updateStatus = async () => {
    if (
      !nextStatus ||
      nextStatus.trim().toUpperCase() === String(enquiry.status).trim().toUpperCase()
    ) return;
    try {
      setSaving(true);
      setError("");
      await b2bService.updateStatus(id, {
        status: nextStatus,
        remarks: remarks.trim(),
      });
      await loadDetails();
      setNotice("Enquiry status updated.");
    } catch (statusError) {
      console.error("B2B status update failed:", statusError);
      setError(statusError?.response?.data?.message || "Unable to update enquiry status.");
    } finally {
      setSaving(false);
    }
  };


  if (loading) {

    return (
      <div className="b2b-page b2b-details">
        <div className="b2b-loading" role="status">Loading enquiry details...</div>
      </div>
    );

  }


  if (!enquiry) {

    return (
      <div className="b2b-page b2b-details">
        <div className="b2b-load-error" role="alert">{error || "Enquiry not found."}</div>
        <button type="button" className="b2b-btn b2b-btn-primary" onClick={loadDetails}>
          Try again
        </button>
      </div>
    );

  }


  return (

    <div className="b2b-page b2b-details">

      <div className="details-header">

        <div className="b2b-detail-heading">

          <button
            className="b2b-back-button"
            onClick={() =>
              navigate(
                "/admin/b2b/enquiries"
              )
            }
          >
            ← Back
          </button>

          <h1>
            Enquiry details
          </h1>

          <p>
            Request <span>#{enquiry.b2bEnquiryId}</span>
          </p>

        </div>

        <B2BStatusBadge
          status={enquiry.status}
        />

      </div>

      {error && <div className="b2b-load-error" role="alert">{error}</div>}
      {notice && <div className="b2b-action-success" role="status">{notice}</div>}

      <div className="details-grid">

        {/* CUSTOMER */}

        <div className="details-card">

          <h2>
            Customer Information
          </h2>

          <Detail
            label="Company"
            value={enquiry.companyName}
          />

          <Detail
            label="Contact Person"
            value={enquiry.contactPerson}
          />

          <Detail
            label="Business Email"
            value={enquiry.businessEmail}
          />

          <Detail
            label="Phone"
            value={enquiry.phoneNumber}
          />

          <Detail
            label="GSTIN"
            value={enquiry.gstin}
          />

          <Detail
            label="City"
            value={enquiry.city}
          />

          <Detail
            label="State"
            value={enquiry.state}
          />

        </div>


        {/* REQUIREMENT */}

        <div className="details-card">

          <h2>
            Order Requirement
          </h2>

          <Detail
            label="Product Category"
            value={enquiry.productCategory}
          />

          <Detail
            label="Quantity"
            value={enquiry.approxQuantity}
          />

          <div className="detail-item">

            <label>
              Additional Requirements
            </label>

            <p>
              {enquiry.additionalRequirements ||
                "No additional requirements"}
            </p>

          </div>

        </div>


        {/* QUOTATION */}

        <div className="details-card">

          <h2>
            Quotation
          </h2>

          <Detail
            label="Quoted Amount"
            value={`₹${enquiry.quotation?.subTotal ?? enquiry.quotedAmount ?? 0}`}
          />

          <Detail
            label="Discount"
            value={`₹${enquiry.quotation?.discountAmount ?? enquiry.discountAmount ?? 0}`}
          />

          <Detail
            label="Tax"
            value={`₹${enquiry.quotation?.taxAmount ?? enquiry.taxAmount ?? 0}`}
          />

          <Detail
            label="Final Amount"
            value={`₹${enquiry.quotation?.finalAmount ?? enquiry.finalAmount ?? 0}`}
          />

          <button
            className="b2b-btn b2b-btn-primary"
            onClick={() =>
              navigate(
                `/admin/b2b/enquiries/${id}/quotation`
              )
            }
          >
            Create / Edit Quotation
          </button>

        </div>


        {/* ADMIN ACTION */}

        <div className="details-card">

          <h2>
            Admin Action
          </h2>

          <textarea
            className="b2b-textarea"
            placeholder="Enter remarks..."
            value={remarks}
            onChange={(e) =>
              setRemarks(e.target.value)
            }
          />

          <label className="b2b-admin-status-label" htmlFor="b2b-next-status">Update status</label>
          <div className="b2b-admin-status-row">
            <select
              className="b2b-select"
              id="b2b-next-status"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
              disabled={saving}
            >
              {[
                "SUBMITTED",
                "UNDER_REVIEW",
                "QUOTATION_SENT",
                "CUSTOMER_ACCEPTED",
                "CONVERTED_TO_ORDER",
                "PROCESSING",
                "SHIPPED",
                "DELIVERED",
                "REJECTED",
                "CANCELLED",
              ].map((status) => (
                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
              ))}
            </select>
            <button
              className="b2b-btn b2b-btn-primary"
              onClick={updateStatus}
              disabled={saving || nextStatus.trim().toUpperCase() === String(enquiry.status).trim().toUpperCase()}
            >
              {saving ? "Saving..." : "Save status"}
            </button>
          </div>

          <div className="action-buttons">

            <button
              className="b2b-btn b2b-btn-success"
              onClick={approve}
              disabled={saving}
            >
              Approve
            </button>

            <button
              className="b2b-btn b2b-btn-danger"
              onClick={reject}
              disabled={saving}
            >
              Reject
            </button>

          </div>

        </div>

      </div>

      {(enquiry.shipment || enquiry.history?.length > 0) && (
        <div className="details-grid b2b-followup-grid">
          {enquiry.shipment && (
            <section className="details-card">
              <h2>Shipment</h2>
              <Detail label="Carrier" value={enquiry.shipment.carrier ?? enquiry.shipment.Carrier} />
              <Detail label="Tracking number" value={enquiry.shipment.trackingNumber ?? enquiry.shipment.TrackingNumber} />
              <Detail label="Status" value={enquiry.shipment.status ?? enquiry.shipment.Status} />
            </section>
          )}
          {enquiry.history?.length > 0 && (
            <section className="details-card">
              <h2>Status history</h2>
              <div className="b2b-history-list">
                {enquiry.history.map((event, index) => (
                  <div className="b2b-history-item" key={event.id ?? event.Id ?? index}>
                    <strong>{event.status ?? event.Status}</strong>
                    <span>{event.remarks ?? event.Remarks ?? "Status updated"}</span>
                    <small>{(event.createdDate ?? event.CreatedDate)
                      ? new Date(event.createdDate ?? event.CreatedDate).toLocaleString()
                      : "-"}</small>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

    </div>

  );
};


const Detail = ({
  label,
  value
}) => (

  <div className="detail-item">

    <label>
      {label}
    </label>

    <p>
      {value || "-"}
    </p>

  </div>

);


export default B2BEnquiryDetails;