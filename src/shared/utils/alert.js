import Swal from "sweetalert2";


// ==========================================
// LOADER ALERT
// ==========================================

export const showLoader = (

  title = "Please wait..."

) => {

  Swal.fire({

    title,

    allowOutsideClick: false,

    allowEscapeKey: false,

    showConfirmButton: false,

    background: "#ffffff",

    color: "#111827",

    didOpen: () => {

      Swal.showLoading();
    },
  });
};


// ==========================================
// CLOSE ALERT
// ==========================================

export const closeAlert = () => {

  Swal.close();
};


// ==========================================
// SUCCESS ALERT
// ==========================================

export const showSuccess = (

  title = "Success",

  text = "Operation completed successfully"

) => {

  return Swal.fire({

    icon: "success",

    title,

    text,

    confirmButtonColor: "#4f46e5",

    background: "#ffffff",

    color: "#111827",
  });
};


// ==========================================
// ERROR ALERT
// ==========================================

export const showError = (

  title = "Error",

  text = "Something went wrong"

) => {

  return Swal.fire({

    icon: "error",

    title,

    text,

    confirmButtonColor: "#dc2626",

    background: "#ffffff",

    color: "#111827",
  });
};


// ==========================================
// WARNING ALERT
// ==========================================

export const showWarning = (

  title = "Warning",

  text = "Please check your input"

) => {

  return Swal.fire({

    icon: "warning",

    title,

    text,

    confirmButtonColor: "#f59e0b",

    background: "#ffffff",

    color: "#111827",
  });
};


// ==========================================
// CONFIRM ALERT
// ==========================================

export const showConfirm = (

  title = "Are you sure?",

  text = "You won't be able to revert this"

) => {

  return Swal.fire({

    title,

    text,

    icon: "question",

    showCancelButton: true,

    confirmButtonColor: "#4f46e5",

    cancelButtonColor: "#dc2626",

    confirmButtonText: "Yes",

    cancelButtonText: "Cancel",

    background: "#ffffff",

    color: "#111827",
  });
};