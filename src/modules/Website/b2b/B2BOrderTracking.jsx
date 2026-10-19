import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams
} from "react-router-dom";

import b2bService from "./b2bService";

import B2BStatusBadge
  from "./components/B2BStatusBadge";

import B2BTimeline
  from "./components/B2BTimeline";

import ShipmentCard
  from "./components/ShipmentCard";

import QuotationCard
  from "./components/QuotationCard";


const B2BOrderTracking = () => {

  const { id } = useParams();

  const navigate = useNavigate();

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    loadOrder();

  }, [id]);


  const loadOrder = async () => {

    try {

      setLoading(true);

      const response =
        await b2bService.getMyEnquiry(id);

      setOrder(
        response?.data ?? response
      );

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };


  const acceptQuotation = async () => {

    try {

      await b2bService.acceptQuotation(id);

      await loadOrder();

    } catch (error) {

      alert(
        error?.response?.data?.message ||
        "Unable to accept quotation"
      );

    }

  };


  const rejectQuotation = async () => {

    const remarks =
      window.prompt(
        "Please enter rejection reason"
      );

    if (!remarks) {
      return;
    }

    try {

      await b2bService.rejectQuotation(
        id,
        remarks
      );

      await loadOrder();

    } catch (error) {

      console.error(error);

    }

  };


  if (loading) {

    return (
      <div>
        Loading order...
      </div>
    );

  }


  if (!order) {

    return (
      <div>
        Order not found
      </div>
    );

  }


  return (

    <div className="order-tracking-page">

      <div className="tracking-header">

        <button
          onClick={() =>
            navigate(
              "/my-bulk-orders"
            )
          }
        >
          ← My Bulk Orders
        </button>

        <h1>
          Bulk Order Tracking
        </h1>

        <B2BStatusBadge
          status={order.status}
        />

      </div>


      <div className="tracking-grid">


        {/* ORDER DETAILS */}

        <div className="tracking-card">

          <h2>
            Order Information
          </h2>

          <p>
            <strong>
              Enquiry:
            </strong>{" "}
            #{order.b2bEnquiryId}
          </p>

          <p>
            <strong>
              Company:
            </strong>{" "}
            {order.companyName}
          </p>

          <p>
            <strong>
              Category:
            </strong>{" "}
            {order.productCategory}
          </p>

          <p>
            <strong>
              Quantity:
            </strong>{" "}
            {order.approxQuantity}
          </p>

          <p>
            <strong>
              Order ID:
            </strong>{" "}
            {order.orderId || "-"}
          </p>

        </div>


        {/* QUOTATION */}

        <QuotationCard
          quotation={order.quotation}
          onAccept={acceptQuotation}
          onReject={rejectQuotation}
        />


        {/* TIMELINE */}

        <div className="tracking-card">

          <h2>
            Order Timeline
          </h2>

          <B2BTimeline
            history={order.history}
          />

        </div>


        {/* SHIPMENT */}

        <ShipmentCard
          shipment={order.shipment}
        />

      </div>

    </div>

  );

};

export default B2BOrderTracking;