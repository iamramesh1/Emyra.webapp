// import React from "react";
// import WebsiteHeader from "./WebsiteHeader";
// import WebsiteFooter from "./WebsiteFooter";
// import { Outlet } from "react-router-dom";

// const WebsiteLayout = () => {
//   return (
//     <div className="website-wrapper">
//       <WebsiteHeader />
//       <main>
//         <Outlet />
//       </main>
//       <WebsiteFooter />
//     </div>
//   );
// };

// export default WebsiteLayout;
import React from "react";
import { Outlet } from "react-router-dom";

import WebsiteHeader from "./WebsiteHeader";
import WebsiteFooter from "./WebsiteFooter";

const WebsiteLayout = () => {
  return (
    <div className="website-wrapper">

      <WebsiteHeader />

      <main className="website-main">
        <Outlet />
      </main>

      <WebsiteFooter />

    </div>
  );
};

export default WebsiteLayout;