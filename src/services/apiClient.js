import axios from "axios";

const apiClient = (baseURL) => {

  const createapi = axios.create({

    baseURL,

    timeout: 30000,

    headers: {
      "Content-Type": "application/json",
    },

  });


  // =====================================
  // REQUEST INTERCEPTOR
  // =====================================

  createapi.interceptors.request.use(

    (config) => {

      console.log(
        "FULL API URL =>",
        `${config.baseURL}${config.url}`
      );

      const token =
        localStorage.getItem("accessToken");

      if (token) {

        config.headers =
          config.headers || {};

        config.headers.Authorization =
          `Bearer ${token}`;
      }

      return config;
    },

    (error) => {

      return Promise.reject(error);

    }
  );


  // =====================================
  // RESPONSE INTERCEPTOR
  // =====================================

  createapi.interceptors.response.use(

    (response) => {

      return response.data;

    },

    async (error) => {

      const originalRequest =
        error?.config;


      // =================================
      // TOKEN EXPIRED
      // =================================

      if (

        error?.response?.status === 401 &&

        originalRequest &&

        !originalRequest._retry &&

        !originalRequest.url?.includes(
          "/auth/refresh-token"
        )

      ) {

        originalRequest._retry = true;


        try {

          const refreshToken =
            localStorage.getItem(
              "refreshToken"
            );


          if (!refreshToken) {

            throw new Error(
              "Refresh token not found"
            );

          }


          // Refresh request
          // Do NOT use apiClient here

          const response =
            await axios.post(

              `${baseURL}/auth/refresh-token`,

              {
                refreshToken,
              }

            );


          const newAccessToken =
            response.data?.accessToken;


          if (!newAccessToken) {

            throw new Error(
              "Access token not received"
            );

          }


          // SAVE NEW TOKEN

          localStorage.setItem(
            "accessToken",
            newAccessToken
          );


          // UPDATE ORIGINAL REQUEST

          originalRequest.headers =
            originalRequest.headers || {};

          originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;


          // RETRY ORIGINAL REQUEST

          return apiClient(
            originalRequest
          );

        }

        catch (refreshError) {

          console.log(
            "Refresh Token Expired"
          );


          // CLEAR STORAGE

          localStorage.removeItem(
            "accessToken"
          );

          localStorage.removeItem(
            "refreshToken"
          );

          localStorage.removeItem(
            "user"
          );

          localStorage.removeItem(
            "permissions"
          );

          localStorage.removeItem(
            "roles"
          );


          // REDIRECT LOGIN

          window.location.href =
            "/login";


          return Promise.reject(
            refreshError
          );

        }

      }


      // =================================
      // SERVER ERROR
      // =================================

      if (
        error?.response?.status === 500
      ) {

        console.log(
          "Internal Server Error"
        );

      }


      // =================================
      // FORBIDDEN
      // =================================

      if (
        error?.response?.status === 403
      ) {

        console.log(
          "Permission Denied"
        );

      }


      return Promise.reject(error);

    }

  );


  return createapi;
};


export default apiClient;
// import axios from "axios";

// const apiClient = (baseURL) => {

//   const createapi = axios.create({

//     baseURL,

//     timeout: 30000,

//     headers: {
//       "Content-Type": "application/json",
//     },

//   });


//   // =====================================
//   // REQUEST INTERCEPTOR
//   // =====================================

//   createapi.interceptors.request.use(

//     (config) => {

//       console.log(
//         "FULL API URL =>",
//         `${config.baseURL}${config.url}`
//       );

//       const token =
//         localStorage.getItem("accessToken");

//       if (token) {

//         config.headers =
//           config.headers || {};

//         config.headers.Authorization =
//           `Bearer ${token}`;
//       }

//       return config;
//     },

//     (error) => {

//       return Promise.reject(error);

//     }
//   );


//   // =====================================
//   // RESPONSE INTERCEPTOR
//   // =====================================

//   createapi.interceptors.response.use(

//     (response) => {

//       return response;

//     },

//     async (error) => {

//       const originalRequest =
//         error?.config;


//       // =================================
//       // TOKEN EXPIRED
//       // =================================

//       if (

//         error?.response?.status === 401 &&

//         originalRequest &&

//         !originalRequest._retry &&

//         !originalRequest.url?.includes(
//           "/auth/refresh-token"
//         )

//       ) {

//         originalRequest._retry = true;


//         try {

//           const refreshToken =
//             localStorage.getItem(
//               "refreshToken"
//             );


//           if (!refreshToken) {

//             throw new Error(
//               "Refresh token not found"
//             );

//           }


//           // Refresh request
//           // Do NOT use apiClient here

//           const response =
//             await axios.post(

//               `${baseURL}/auth/refresh-token`,

//               {
//                 refreshToken,
//               }

//             );


//           const newAccessToken =
//             response.data?.accessToken;


//           if (!newAccessToken) {

//             throw new Error(
//               "Access token not received"
//             );

//           }


//           // SAVE NEW TOKEN

//           localStorage.setItem(
//             "accessToken",
//             newAccessToken
//           );


//           // UPDATE ORIGINAL REQUEST

//           originalRequest.headers =
//             originalRequest.headers || {};

//           originalRequest.headers.Authorization =
//             `Bearer ${newAccessToken}`;


//           // RETRY ORIGINAL REQUEST

//           return createapi(
//             originalRequest
//           );

//         }

//         catch (refreshError) {

//           console.log(
//             "Refresh Token Expired"
//           );


//           // CLEAR STORAGE

//           localStorage.removeItem(
//             "accessToken"
//           );

//           localStorage.removeItem(
//             "refreshToken"
//           );

//           localStorage.removeItem(
//             "user"
//           );

//           localStorage.removeItem(
//             "permissions"
//           );

//           localStorage.removeItem(
//             "roles"
//           );


//           // REDIRECT LOGIN

//           window.location.href =
//             "/login";


//           return Promise.reject(
//             refreshError
//           );

//         }

//       }


//       // =================================
//       // SERVER ERROR
//       // =================================

//       if (
//         error?.response?.status === 500
//       ) {

//         console.log(
//           "Internal Server Error"
//         );

//       }


//       // =================================
//       // FORBIDDEN
//       // =================================

//       if (
//         error?.response?.status === 403
//       ) {

//         console.log(
//           "Permission Denied"
//         );

//       }


//       return Promise.reject(error);

//     }

//   );


//   return createapi;
// };


// export default apiClient;





// // import axios from "axios";

// // import env from "../config/env";

// // const apiClient = axios.create({

// //   baseURL: env.USER_API_URL,

// //   timeout: 30000,

// //   headers: {
// //     "Content-Type": "application/json",
// //   },
// // });


// // // =====================================
// // // REQUEST INTERCEPTOR
// // // =====================================

// // apiClient.interceptors.request.use(

// //   (config) => {

// //     console.log(
// //       "FULL API URL =>",
// //       config.baseURL + config.url
// //     );

// //     const token =
// //       localStorage.getItem(
// //         "accessToken"
// //       );

// //     if (token) {

// //       config.headers.Authorization =
// //         `Bearer ${token}`;
// //     }

// //     return config;
// //   },

// //   (error) => {

// //     return Promise.reject(error);
// //   }
// // );


// // // =====================================
// // // RESPONSE INTERCEPTOR
// // // =====================================

// // apiClient.interceptors.response.use(

// //   (response) => response,

// //   async (error) => {

// //     const originalRequest =
// //       error?.config;

// //     // =================================
// //     // TOKEN EXPIRED
// //     // =================================

// //     if (

// //       error?.response?.status === 401 &&

// //       !originalRequest?._retry &&

// //       !originalRequest?.url?.includes(
// //         "/auth/refresh-token"
// //       )

// //     ) {

// //       originalRequest._retry = true;

// //       try {

// //         const refreshToken =
// //           localStorage.getItem(
// //             "refreshToken"
// //           );

// //         const response =
// //           await axios.post(

// //             `${env.USER_API_URL}/auth/refresh-token`,

// //             {
// //               refreshToken,
// //             }
// //           );

// //         const newAccessToken =
// //           response.data.accessToken;

// //         // SAVE NEW TOKEN

// //         localStorage.setItem(

// //           "accessToken",

// //           newAccessToken
// //         );

// //         // UPDATE HEADER

// //         originalRequest.headers.Authorization =
// //           `Bearer ${newAccessToken}`;

// //         // RETRY API

// //         return apiClient(
// //           originalRequest
// //         );

// //       } catch (refreshError) {

// //         console.log(
// //           "Refresh Token Expired"
// //         );

// //         // CLEAR STORAGE

// //         localStorage.removeItem(
// //           "accessToken"
// //         );

// //         localStorage.removeItem(
// //           "refreshToken"
// //         );

// //         localStorage.removeItem(
// //           "user"
// //         );

// //         localStorage.removeItem(
// //           "permissions"
// //         );

// //         localStorage.removeItem(
// //           "roles"
// //         );

// //         // REDIRECT LOGIN

// //         window.location.href =
// //           "/login";

// //         return Promise.reject(
// //           refreshError
// //         );
// //       }
// //     }

// //     // =================================
// //     // SERVER ERROR
// //     // =================================

// //     if (
// //       error?.response?.status === 500
// //     ) {

// //       console.log(
// //         "Internal Server Error"
// //       );
// //     }

// //     // =================================
// //     // FORBIDDEN
// //     // =================================

// //     if (
// //       error?.response?.status === 403
// //     ) {

// //       console.log(
// //         "Permission Denied"
// //       );
// //     }

// //     return Promise.reject(error);
// //   }
// // );

// // export default apiClient;


