import { useNavigate } from "react-router-dom";
import B2BStatusBadge from "./B2BStatusBadge";

const B2BTable = ({ enquiries, loading }) => {

  const navigate = useNavigate();

  if (loading) {

    return (
      <div className="b2b-loading">
        Loading enquiries...
      </div>
    );

  }

  if (!enquiries?.length) {

    return (
      <div className="b2b-empty">
        No enquiries found.
      </div>
    );

  }

  return (

    <section className="b2b-table-card" aria-label="B2B enquiries">
      <div className="b2b-table-wrapper">

      <table className="b2b-table">

        <thead>

          <tr>

            <th>Enquiry</th>

            <th>Company</th>

            <th>Contact</th>

            <th>Category</th>

            <th>Quantity</th>

            <th>Status</th>

            <th>Date</th>

            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          {enquiries.map((item) => (

            <tr
              key={item.b2BEnquiryId}
            >

              <td>
                <span className="b2b-enquiry-id">#{item.b2bEnquiryId}</span>
              </td>

              <td>
                <strong>
                  {item.companyName}
                </strong>
              </td>

              <td>

                <div>
                  {item.contactPerson}
                </div>

                <small>
                  {item.businessEmail}
                </small>

              </td>

              <td>
                {item.productCategory}
              </td>

              <td>
                {item.approxQuantity}
              </td>

              <td>
                <B2BStatusBadge
                  status={item.status}
                />
              </td>

              <td>
                {item.createdDate
                  ? new Date(
                      item.createdDate
                    ).toLocaleDateString()
                  : "-"
                }
              </td>

              <td>

                <button
                  className="btn-view"
                  onClick={() =>
                    navigate(
                      `/admin/b2b/enquiries/${item.b2BEnquiryId}`
                    )
                  }
                >
                  View
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      </div>
    </section>

  );
};

export default B2BTable;