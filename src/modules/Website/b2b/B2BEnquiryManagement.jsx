import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchB2BEnquiries,
  fetchB2BDashboard
} from "./b2bSlice";

import B2BStats from "./components/B2BStats";
import B2BTable from "./components/B2BTable";

import "./b2b.css";

const B2BEnquiryManagement = () => {

  const dispatch = useDispatch();

  const {
    enquiries,
    dashboard,
    loading,
    error
  } = useSelector(
    state => state.b2b
  );

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  useEffect(() => {

    dispatch(
      fetchB2BDashboard()
    );

    dispatch(
      fetchB2BEnquiries()
    );

  }, [dispatch]);


  const handleSearch = () => {

    dispatch(
      fetchB2BEnquiries({
        search,
        status
      })
    );

  };


  return (

    <div className="b2b-page">

      <div className="b2b-header">

        <div className="b2b-header-content">

          <h1>
            Bulk enquiries
          </h1>

          <p>
            Review business requests, prepare quotations, and track orders.
          </p>

        </div>

      </div>


      {/* =========================
          STATISTICS
      ========================= */}

      <B2BStats
        dashboard={dashboard}
      />

      {error && (
        <div className="b2b-load-error" role="alert">
          {error}. Check the B2B API route and try again.
        </div>
      )}


      {/* =========================
          FILTER
      ========================= */}

      <section className="b2b-filter-card" aria-label="Filter enquiries">
        <div className="b2b-filter-row">

        <input
          className="b2b-input b2b-search"
          type="text"
          placeholder="Search company, email, phone..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />


        <select
          className="b2b-select b2b-status-filter"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >

          <option value="">
            All Status
          </option>

          <option value="SUBMITTED">
            Submitted
          </option>

          <option value="UNDER_REVIEW">
            Under Review
          </option>

          <option value="QUOTATION_SENT">
            Quotation Sent
          </option>

          <option value="CUSTOMER_ACCEPTED">
            Accepted
          </option>

          <option value="CONVERTED_TO_ORDER">
            Order
          </option>

          <option value="SHIPPED">
            Shipped
          </option>

          <option value="DELIVERED">
            Delivered
          </option>

        </select>


        <button
          className="b2b-btn b2b-btn-primary b2b-search-button"
          onClick={handleSearch}
        >
          Search
        </button>

        </div>
      </section>


      {/* =========================
          TABLE
      ========================= */}

      <B2BTable
        enquiries={enquiries}
        loading={loading}
      />

    </div>

  );

};

export default B2BEnquiryManagement;