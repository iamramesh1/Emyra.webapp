// import React from "react";
// import { Link } from "react-router-dom";

// const WebsiteFooter = () => (
//   <footer className="website-footer">
//     <div className="footer-grid">
//       <div className="footer-brand">
//         <span className="logo">⚡ amarud</span>
//         <p>Your premium destination for curated products. 
//           Discover the best deals with AI-powered recommendations.</p>
//           <p>Plot No. 240, Gali Number 7, Darshan Vihar, 
// Near Amrit vihar bus Stop, Delhi, 110084; 
// Email: Info@emyra.in · Phone: +91 73036 09280</p>

//       </div>
//       <div className="footer-col">
//         <h4>Shop</h4>
//         <ul>
//           <li><Link to="/products">All Products</Link></li>
//           <li><Link to="/products?category=Electronics">Electronics</Link></li>
//           <li><Link to="/products?category=Fashion">Fashion</Link></li>
//           <li><Link to="/products?category=Mobiles">Mobiles</Link></li>
//         </ul>
//       </div>
//       <div className="footer-col">
//         <h4>Account</h4>
//         <ul>
//           <li><Link to="/login">Login</Link></li>
//           <li><Link to="/wishlist">Wishlist</Link></li>
//           <li><Link to="/cart">Cart</Link></li>
//           <li><Link to="/checkout">Checkout</Link></li>
//         </ul>
//       </div>
//       <div className="footer-col">
//         <h4>Company</h4>
//         <ul>
//           <li><a href="#">About Us</a></li>
//           <li><a href="#">Privacy Policy</a></li>
//           <li><a href="#">Terms of Service</a></li>
//           <li><a href="#">Contact</a></li>
//         </ul>
//       </div>
//     </div>
//     <div className="footer-bottom">
//       <p>© 2026 amarud. All rights reserved.</p>
//       <p>Powered by R-ALPHA· Secured & Trusted</p>
//     </div>
//   </footer>
// );

// export default WebsiteFooter;


import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import productService, { getProductCategories } from "../../services/productService";
import storeDetails from "../../config/storeDetails";

const WebsiteFooter = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;
    productService.getProducts()
      .then((products) => {
        if (active) setCategories(getProductCategories(products));
      })
      .catch((error) => {
        console.error("Failed to load footer categories:", error);
      });
    return () => { active = false; };
  }, []);

  return (
    <footer className="website-footer">
    <div className="footer-grid">
      <div className="footer-brand">
        <span className="logo">{storeDetails.brand}</span>
        <p>Practical covers for air conditioners, washing machines and everyday appliances.</p>
        <p>
          {storeDetails.address}
        </p>
        <p><a href={`tel:${storeDetails.phone}`}>Call +91 {storeDetails.phone}</a></p>
        <p><a href={`mailto:${storeDetails.email}`}>{storeDetails.email}</a></p>
        <p><strong>GST No.:</strong> {storeDetails.gstNumber}</p>

      </div>
      <div className="footer-col">
        <h4>Shop</h4>
        <ul>
          <li><Link to="/products">All Products</Link></li>
          {categories.map((category) => (
            <li key={category}>
              <Link to={`/products?category=${encodeURIComponent(category)}`}>{category}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="footer-col">
        <h4>Account</h4>
        <ul>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/wishlist">Wishlist</Link></li>
          <li><Link to="/cart">Cart</Link></li>
          <li><Link to="/checkout">Checkout</Link></li>
        </ul>
      </div>
      <div className="footer-col">
        <h4>Company</h4>
        <ul>
          <li><Link to="/#wholesale">Wholesale Enquiry</Link></li>
          <li><Link to="/products">Product Range</Link></li>
          <li><Link to="/terms-and-conditions">Terms &amp; Conditions</Link></li>
          <li><Link to="/privacy-policy">Privacy Policy</Link></li>
        </ul>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2026 {storeDetails.brand}</p>
      <p>Stroid tech</p>
    </div>
    </footer>
  );
};

export default WebsiteFooter;
