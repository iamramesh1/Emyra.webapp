import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams
} from "react-router-dom";

import b2bService from "./b2bService";

const B2BQuotation = () => {

  const { id } = useParams();

  const navigate = useNavigate();

  const [form, setForm] = useState({

    subTotal: 0,

    discountAmount: 0,

    taxAmount: 0,

    finalAmount: 0,

    adminRemarks: "",

    validUntil: ""

  });


  const [loading, setLoading] =
    useState(false);


  const changeHandler = (e) => {

    const {
      name,
      value
    } = e.target;

    setForm(prev => ({

      ...prev,

      [name]: value

    }));

  };


  // ==========================================
  // CALCULATE FINAL
  // ==========================================

  useEffect(() => {

    const subTotal =
      Number(form.subTotal) || 0;

    const discount =
      Number(form.discountAmount) || 0;

    const tax =
      Number(form.taxAmount) || 0;

    const final =
      subTotal -
      discount +
      tax;

    setForm(prev => ({

      ...prev,

      finalAmount: final

    }));

  }, [
    form.subTotal,
    form.discountAmount,
    form.taxAmount
  ]);


  const saveQuotation = async () => {

    try {

      setLoading(true);

      await b2bService.createQuotation(
        id,
        form
      );

      alert(
        "Quotation created successfully"
      );

      navigate(
        `/admin/b2b/enquiries/${id}`
      );

    } catch (error) {

      alert(
        error?.response?.data?.message ||
        "Unable to create quotation"
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="quotation-page">

      <h1>
        Create B2B Quotation
      </h1>

      <p>
        Enquiry #{id}
      </p>


      <div className="quotation-card">

        <div className="form-row">

          <label>
            Sub Total
          </label>

          <input
            type="number"
            name="subTotal"
            value={form.subTotal}
            onChange={changeHandler}
          />

        </div>


        <div className="form-row">

          <label>
            Discount
          </label>

          <input
            type="number"
            name="discountAmount"
            value={form.discountAmount}
            onChange={changeHandler}
          />

        </div>


        <div className="form-row">

          <label>
            Tax
          </label>

          <input
            type="number"
            name="taxAmount"
            value={form.taxAmount}
            onChange={changeHandler}
          />

        </div>


        <div className="form-row">

          <label>
            Final Amount
          </label>

          <input
            type="number"
            value={form.finalAmount}
            readOnly
          />

        </div>


        <div className="form-row">

          <label>
            Valid Until
          </label>

          <input
            type="date"
            name="validUntil"
            value={form.validUntil}
            onChange={changeHandler}
          />

        </div>


        <div className="form-row">

          <label>
            Admin Remarks
          </label>

          <textarea
            name="adminRemarks"
            value={form.adminRemarks}
            onChange={changeHandler}
          />

        </div>


        <button
          className="primary-button"
          disabled={loading}
          onClick={saveQuotation}
        >

          {loading
            ? "Saving..."
            : "Save Quotation"
          }

        </button>

      </div>

    </div>

  );

};

export default B2BQuotation;