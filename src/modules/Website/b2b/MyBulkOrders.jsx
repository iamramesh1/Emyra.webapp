import { useEffect, useState } from "react";
import {
  useNavigate
} from "react-router-dom";

import b2bService from "./b2bService";

import B2BStatusBadge
  from "./components/B2BStatusBadge";


const MyBulkOrders = () => {

  const navigate = useNavigate();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    loadOrders();

  }, []);


  const loadOrders = async () => {

    try {

      const response =
        await b2bService.getMyEnquiries();

      const list = response?.data ?? response;

      setOrders(
        Array.isArray(list) ? list : []
      );

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="my-bulk-orders">

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>

        <div>
          <h1>
            My Bulk Orders
          </h1>

          <p>
            View and track your bulk order
            enquiries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/bulk-order/new")}
          style={{
            padding: "10px 20px",
            background: "var(--accent, #d97757)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          + New Bulk Enquiry
        </button>

      </div>


      {loading ? (

        <p>
          Loading...
        </p>

      ) : orders.length === 0 ? (

        <div className="empty-orders">

          <h3>
            No bulk orders found
          </h3>

          <p>
            You have not submitted any
            bulk order enquiry yet.
          </p>

        </div>

      ) : (

        <div className="bulk-order-list">

          {orders.map((item) => (

            <div
              className="bulk-order-card"
              key={item.b2bEnquiryId}
            >

              <div>

                <small>
                  Enquiry
                </small>

                <h3>
                  #{item.b2bEnquiryId}
                </h3>

              </div>


              <div>

                <small>
                  Company
                </small>

                <p>
                  {item.companyName}
                </p>

              </div>


              <div>

                <small>
                  Category
                </small>

                <p>
                  {item.productCategory}
                </p>

              </div>


              <div>

                <small>
                  Quantity
                </small>

                <p>
                  {item.approxQuantity}
                </p>

              </div>


              <div>

                <B2BStatusBadge
                  status={item.status}
                />

              </div>


              <button
                onClick={() =>
                  navigate(
                    `/my-bulk-orders/${item.b2bEnquiryId}`
                  )
                }
              >
                View / Track
              </button>

            </div>

          ))}

        </div>

      )}

    </div>

  );

};

export default MyBulkOrders;