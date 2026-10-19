
import { digitalApi as api } from "../../../services/apiInstances";

const BASE = "/B2BOrderEnquiry";

export const unwrapB2BResponse = (response) =>
  response?.data?.data ??
  response?.data?.Data ??
  response?.data ??
  response?.Data ??
  response;

export const mapB2BEnquiry = (row = {}) => {
  const quotation = row.quotation ?? row.Quotation;
  const shipment = row.shipment ?? row.Shipment;
  const history = row.history ?? row.History;

  return {
    ...row,
    b2bEnquiryId:
      row.b2bEnquiryId ?? row.B2BEnquiryId ??
      row.EnquiryId ?? row.Id ?? row.id,
    companyName: row.companyName ?? row.CompanyName ?? "",
    contactPerson: row.contactPerson ?? row.ContactPerson ?? "",
    businessEmail: row.businessEmail ?? row.BusinessEmail ?? row.Email ?? "",
    phoneNumber: row.phoneNumber ?? row.PhoneNumber ?? row.Phone ?? "",
    gstin: row.gstin ?? row.GSTIN ?? "",
    city: row.city ?? row.City ?? "",
    state: row.state ?? row.State ?? "",
    productCategory: row.productCategory ?? row.ProductCategory ?? row.Category ?? "",
    approxQuantity: row.approxQuantity ?? row.ApproxQuantity ?? row.Quantity ?? "",
    additionalRequirements:
      row.additionalRequirements ?? row.AdditionalRequirements ?? row.Message ?? "",
    status: row.status ?? row.Status ?? "",
    quotedAmount: row.quotedAmount ?? row.QuotedAmount ?? row.SubTotal ?? 0,
    discountAmount: row.discountAmount ?? row.DiscountAmount ?? 0,
    taxAmount: row.taxAmount ?? row.TaxAmount ?? 0,
    finalAmount: row.finalAmount ?? row.FinalAmount ?? 0,
    createdDate: row.createdDate ?? row.CreatedDate ?? null,
    quotation: quotation
      ? {
          ...quotation,
          subTotal: quotation.subTotal ?? quotation.SubTotal ?? 0,
          discountAmount: quotation.discountAmount ?? quotation.DiscountAmount ?? 0,
          taxAmount: quotation.taxAmount ?? quotation.TaxAmount ?? 0,
          finalAmount: quotation.finalAmount ?? quotation.FinalAmount ?? 0,
          validUntil: quotation.validUntil ?? quotation.ValidUntil ?? null,
          adminRemarks: quotation.adminRemarks ?? quotation.AdminRemarks ?? "",
        }
      : null,
    shipment: shipment
      ? {
          ...shipment,
          carrier: shipment.carrier ?? shipment.Carrier ?? "",
          trackingNumber: shipment.trackingNumber ?? shipment.TrackingNumber ?? "",
          trackingUrl: shipment.trackingUrl ?? shipment.TrackingUrl ?? "",
          status: shipment.status ?? shipment.Status ?? "",
          remarks: shipment.remarks ?? shipment.Remarks ?? "",
        }
      : null,
    history: Array.isArray(history)
      ? history.map((event) => ({
          ...event,
          id: event.id ?? event.Id,
          status: event.status ?? event.Status ?? "",
          remarks: event.remarks ?? event.Remarks ?? "",
          createdDate: event.createdDate ?? event.CreatedDate ?? null,
        }))
      : [],
  };
};

const b2bService = {
  // CUSTOMER
  createEnquiry(data) {
    return api.post(`${BASE}/Create`, {
      CompanyName: data.companyName,
      ContactPerson: data.contactPerson,
      Email: data.businessEmail,
      Phone: data.phoneNumber,
      Category: data.productCategory,
      Quantity: String(data.approxQuantity ?? ""),
      City: data.city,
      State: data.state,
      GSTIN: data.gstin,
      Message: data.additionalRequirements,
    });
  },

  getMyEnquiries() {
    return api.get(`${BASE}/MyEnquiries`);
  },

  getMyEnquiry(id) {
    return api.get(`${BASE}/MyEnquiry/${id}`);
  },

  acceptQuotation(id) {
    return api.post(`${BASE}/AcceptQuotation/${id}`);
  },

  rejectQuotation(id, remarks = "") {
    return api.post(`${BASE}/RejectQuotation/${id}`, { remarks });
  },

  // ADMIN
  getAll(params = {}) {
    return api.get(`${BASE}/GetAll`, { params });
  },

  getDashboard() {
    return api.get(`${BASE}/Dashboard`);
  },

  getById(id) {
    return api.get(`${BASE}/GetById`, { params: { id } });
  },

  approve(id, remarks = "") {
    return api.post(`${BASE}/Approve`, { remarks }, {
      params: { id },
    });
  },

  reject(id, remarks = "") {
    return api.post(`${BASE}/Reject`, { remarks }, {
      params: { id },
    });
  },

  // QUOTATION
  createQuotation(id, data) {
    return api.post(`${BASE}/CreateQuotation`, data, {
      params: { id },
    });
  },

  sendQuotation(id) {
    return api.post(`${BASE}/SendQuotation`, null, {
      params: { id },
    });
  },

  // ORDER STATUS
  updateStatus(id, data) {
    return api.post(`${BASE}/UpdateStatus`, data, {
      params: { id },
    });
  },

  // SHIPMENT
  addShipment(id, data) {
    return api.post(`${BASE}/AddShipment`, data, {
      params: { id },
    });
  },
};

export default b2bService;