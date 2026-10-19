// // import React, { useState,useEffect } from "react";
// // import { Link, useNavigate } from "react-router-dom";
// // import { FaShoppingCart, FaHeart, FaSearch, FaBolt,FaUserCircle } from "react-icons/fa";
// // import "./website.css";
// // import cartService from "../../services/cartService";
// // const WebsiteHeader = () => {
// //   const [query, setQuery] = useState("");
// //     const [user, setUser] = useState(null);

// //   const navigate = useNavigate();
// //   const cartCount = cartService.getCart().length;

// //   const handleSearch = (e) => {
// //     e.preventDefault();
// //     if (query.trim()) navigate(`/products?q=${encodeURIComponent(query)}`);
// //   };

// //   useEffect(() => {
// //   const userData = localStorage.getItem("user");

// //   if (userData) {
// //     setUser(JSON.parse(userData));
// //   }
// // }, []);

// // const logout = () => {

// //   localStorage.removeItem("user");
// //   localStorage.removeItem("token");

// //   navigate("/login");

// //   window.location.reload();
// // };
// //   return (
// //     <header className="website-header">
// //       <div className="top-header">
// //         <Link to="/" className="logo">⚡armud.in</Link>

// //         <form className="search-box" onSubmit={handleSearch}>
// //           <input
// //             type="text"
// //             placeholder="Search products, brands & more..."
// //             value={query}
// //             onChange={(e) => setQuery(e.target.value)}
// //           />
// //           <button type="submit"><FaSearch /></button>
// //         </form>

// //         <div className="header-icons">
// //           <Link to="/wishlist" className="icon-btn" title="Wishlist">
// //             <FaHeart />
// //           </Link>
// //           <Link to="/cart" className="icon-btn" title="Cart">
// //             <FaShoppingCart />
// //             {cartCount > 0 && <span className="badge">{cartCount}</span>}
// //           </Link>
// //           {/* <Link to="/profile" className="icon-btn" title="Profile">
// //             <FaUserCircle />
           
// //           </Link> */}
// //           <div className="header-icons">

// //   <Link to="/wishlist" className="icon-btn">
// //     <FaHeart />
// //   </Link>

// //   <Link to="/cart" className="icon-btn">
// //     <FaShoppingCart />
// //     {cartCount > 0 &&
// //       <span className="badge">{cartCount}</span>
// //     }
// //   </Link>

// //   {!user ? (
// //     <Link to="/login" className="icon-btn">
// //       <FaUserCircle />
// //     </Link>
// //   ) : (
// //     <div className="profile-dropdown">
// //       <FaUserCircle />

// //       <span>{user.name}</span>

// //       <div className="dropdown-menu">
// //         <Link to="/profile">
// //           My Profile
// //         </Link>

// //         <Link to="/orders">
// //           My Orders
// //         </Link>

// //         <Link to="/wishlist">
// //           Wishlist
// //         </Link>

// //         <button onClick={logout}>
// //           Logout
// //         </button>
// //       </div>
// //     </div>
// //   )}

// // </div>
// //         </div>
// //       </div>

// //       <nav className="menu-bar">
// //         <Link to="/">Home</Link>
// //         <Link to="/products">All Products</Link>
// //         <Link to="/products?category=Appliancecovers">Appliance Covers</Link>
// //         <Link to="/products?category=Bathroomaccessories">Bathroom Accessories</Link>
// //         <Link to="/products?category=Bikecovers">Bike Covers</Link>
// //         <Link to="/products?category=Kitchennapkins">Kitchen Napkins</Link>
// //         <Link to="/products?category=Washingmaching">Washing Machines</Link>
// //         <Link to="/products?category=AcCovers">AC Covers</Link>
// //       </nav>
// //     </header>
// //   );
// // };

// // export default WebsiteHeader;
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { FaShoppingCart, FaHeart, FaSearch, FaUserCircle } from "react-icons/fa";
// import "./website.css";
// import cartService from "../../services/cartService";

// const WebsiteHeader = () => {
//   const [query, setQuery] = useState("");
//   const [user, setUser] = useState(null);

//   const navigate = useNavigate();
//   const cartCount = cartService.getCart().length;

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (query.trim()) navigate(`/products?q=${encodeURIComponent(query)}`);
//   };

//   useEffect(() => {
//     const userData = localStorage.getItem("user");
//     if (userData) {
//       setUser(JSON.parse(userData));
//     }
//   }, []);

//   const logout = () => {
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//     navigate("/login");
//     window.location.reload();
//   };

//   return (
//     <header className="website-header">
//       <div className="top-header">
//         <Link to="/" className="logo">⚡armud.in</Link>

//         <form className="search-box" onSubmit={handleSearch}>
//           <input
//             type="text"
//             placeholder="Search products, brands & more..."
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />
//           <button type="submit"><FaSearch /></button>
//         </form>
// <div className="header-icons">

//   <Link to="/wishlist" className="icon-btn" title="Wishlist">
//     <FaHeart />
//   </Link>

//   <Link to="/cart" className="icon-btn" title="Cart">
//     <FaShoppingCart />
//     {cartCount > 0 && (
//       <span className="badge">{cartCount}</span>
//     )}
//   </Link>

//   {!user ? (
//     <Link to="/login" className="icon-btn" title="Login">
//       <FaUserCircle />
//     </Link>
//   ) : (
//     <div className="profile-dropdown">
//       <div className="profile-trigger">
//         <FaUserCircle />
//         <span>{user?.name}</span>
//       </div>

//       <div className="dropdown-menu">
//         <Link to="/profile">My Profile</Link>
//         <Link to="/orders">My Orders</Link>
//         <Link to="/wishlist">Wishlist</Link>

//         <button
//           type="button"
//           onClick={logout}
//         >
//           Logout
//         </button>
//       </div>
//     </div>
//   )}

// </div>
//         {/* <div className="header-icons">
//           <Link to="/wishlist" className="icon-btn" title="Wishlist">
//             <FaHeart />
//           </Link>

//           <Link to="/cart" className="icon-btn" title="Cart">
//             <FaShoppingCart />
//             {cartCount > 0 && <span className="badge">{cartCount}</span>}
//           </Link>

//           {!user ? (
//             <Link to="/login" className="icon-btn" title="Login">
//               <FaUserCircle />
//             </Link>
//           ) : (
//             <div className="profile-dropdown">
//               <FaUserCircle />
//               <span>{user.name}</span>
//               <div className="dropdown-menu">
//                 <Link to="/profile">My Profile</Link>
//                 <Link to="/orders">My Orders</Link>
//                 <Link to="/wishlist">Wishlist</Link>
//                 <button onClick={logout}>Logout</button>
//               </div>
//             </div>
//           )}
//         </div> */}
//       </div>

//       <nav className="menu-bar">
//         <Link to="/">Home</Link>
//         <Link to="/products">All Products</Link>
//         <Link to="/products?category=Appliancecovers">Appliance Covers</Link>
//         <Link to="/products?category=Bathroomaccessories">Bathroom Accessories</Link>
//         <Link to="/products?category=Bikecovers">Bike Covers</Link>
//         <Link to="/products?category=Kitchennapkins">Kitchen Napkins</Link>
//         <Link to="/products?category=Washingmaching">Washing Machines</Link>
//         <Link to="/products?category=AcCovers">AC Covers</Link>
//       </nav>
//     </header>
//   );
// };

// export default WebsiteHeader;

import {
  useState,
  useEffect
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  FaShoppingCart,
  FaHeart,
  FaSearch,
  FaUserCircle,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaFileInvoice
} from "react-icons/fa";

import {
  useSelector,
  useDispatch
} from "react-redux";

import "./website.css";

import cartService from "../../services/cartService";
import productService, { getProductCategories } from "../../services/productService";
import storeDetails from "../../config/storeDetails";

import {
  logout as logoutAction
} from "../../modules/Auth/authSlice";


const WebsiteHeader = () => {

  const [query, setQuery] = useState("");

  const [cartCount, setCartCount] = useState(0);
  const [catalogCategories, setCatalogCategories] = useState([]);

  const navigate = useNavigate();

  const dispatch = useDispatch();


  // Get user from Redux
  const user = useSelector(
    (state) => state.auth.user
  );
  const displayName =
    user?.fullName ||
    user?.FullName ||
    user?.name ||
    user?.Name ||
    user?.email ||
    user?.Email ||
    "My account";

  useEffect(() => {
    let active = true;
    productService.getProducts()
      .then((products) => {
        if (active) setCatalogCategories(getProductCategories(products));
      })
      .catch((error) => {
        console.error("Failed to load navigation categories:", error);
      });
    return () => { active = false; };
  }, []);


  // Load cart
  useEffect(() => {

    const loadCart = async () => {

      try {

        const cart =
          await cartService.getCart();

        setCartCount(
          cart?.length || 0
        );

      } catch (error) {

        console.error(
          "Failed to load cart:",
          error
        );

        setCartCount(0);
      }
    };

    loadCart();
    window.addEventListener("cartUpdated", loadCart);

    return () => window.removeEventListener("cartUpdated", loadCart);
  }, [user]);


  const handleSearch = (e) => {

    e.preventDefault();

    if (query.trim()) {

      navigate(
        `/products?q=${encodeURIComponent(
          query
        )}`
      );
    }
  };


  const logout = () => {

    // Redux logout
    dispatch(logoutAction());

    // Go to login
    navigate("/");
  };


  return (
    <header className="website-header">
      <div className="header-contact-bar">
        <span><FaMapMarkerAlt /> {storeDetails.address}</span>
        <a href={`tel:${storeDetails.phone}`}><FaPhoneAlt /> {storeDetails.phone}</a>
        <a href={`mailto:${storeDetails.email}`}><FaEnvelope /> {storeDetails.email}</a>
        <span><FaFileInvoice /> GST No.: {storeDetails.gstNumber}</span>
      </div>

      <div className="top-header">

        <Link
          to="/"
          className="logo"
        >
          <span>{storeDetails.brand}</span>
        </Link>


        <form
          className="search-box"
          onSubmit={handleSearch}
        >

          <input
            type="text"
            placeholder="Search appliance covers..."
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
          />

          <button type="submit">
            <FaSearch />
          </button>

        </form>


        <div className="header-icons">

          <Link
            to="/wishlist"
            className="icon-btn"
            title="Wishlist"
          >
            <FaHeart />
          </Link>


          <Link
            to="/cart"
            className="icon-btn"
            title="Cart"
          >

            <FaShoppingCart />

            {cartCount > 0 && (
              <span className="badge">
                {cartCount}
              </span>
            )}

          </Link>


          {!user ? (

            <Link
              to="/login"
              className="icon-btn"
              title="Login"
            >
              <FaUserCircle />
            </Link>

          ) : (

            <div className="profile-dropdown">

              <div className="profile-trigger">

                <FaUserCircle />

                <span>
                  {displayName}
                </span>

              </div>


              <div className="dropdown-menu">

                <Link to="/profile">
                  My Profile
                </Link>

                <Link to="/change-password">
                  Change password
                </Link>

                <Link to="/orders">
                  My Orders
                </Link>

                <Link to="/wishlist">
                  Wishlist
                </Link>


                <button
                  type="button"
                  onClick={logout}
                >
                  Logout
                </button>

              </div>

            </div>

          )}

        </div>

      </div>


      <nav className="menu-bar">

        <Link to="/">
          Home
        </Link>

        <Link to="/products">
          All Products
        </Link>

        {catalogCategories.map((category) => {
          return (
            <Link key={category} to={`/products?category=${encodeURIComponent(category)}`}>
              {category}
            </Link>
          );
        })}

        <Link to="/#wholesale">
          Wholesale Enquiry
        </Link>

        <Link to="/terms-and-conditions">
          Terms &amp; Conditions
        </Link>

        <Link to="/privacy-policy">
          Privacy Policy
        </Link>

      </nav>

    </header>
  );
};

export default WebsiteHeader;