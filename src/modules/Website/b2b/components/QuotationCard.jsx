import B2BStatusBadge from "./B2BStatusBadge";

const QuotationCard = ({
  quotation,
  onAccept,
  onReject
}) => {

  if (!quotation) {

    return null;

  }


  return (

    <div className="quotation-display">

      <div className="quotation-header">

        <div>

          <h2>
            Quotation
          </h2>

          <p>
            {quotation.quotationNumber}
          </p>

        </div>

        <B2BStatusBadge
          status={quotation.status}
        />

      </div>


      <div className="quotation-amounts">

        <div>
          <span>Subtotal</span>
          <strong>
            ₹{quotation.subTotal}
          </strong>
        </div>

        <div>
          <span>Discount</span>
          <strong>
            - ₹{quotation.discountAmount}
          </strong>
        </div>

        <div>
          <span>Tax</span>
          <strong>
            ₹{quotation.taxAmount}
          </strong>
        </div>

        <div className="total">

          <span>
            Final Amount
          </span>

          <strong>
            ₹{quotation.finalAmount}
          </strong>

        </div>

      </div>


      {quotation.adminRemarks && (

        <div className="remarks">

          <strong>
            Remarks
          </strong>

          <p>
            {quotation.adminRemarks}
          </p>

        </div>

      )}


      {quotation.status ===
        "QUOTATION_SENT" && (

        <div className="quotation-actions">

          <button
            className="reject-button"
            onClick={onReject}
          >
            Reject
          </button>

          <button
            className="approve-button"
            onClick={onAccept}
          >
            Accept Quotation
          </button>

        </div>

      )}

    </div>

  );

};

export default QuotationCard;