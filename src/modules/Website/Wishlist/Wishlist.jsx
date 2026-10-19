import React from "react";
import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";

const Wishlist = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
    <FaHeart size={64} style={{ color: "var(--text2)", marginBottom: 20 }} />
    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 12 }}>Your Wishlist</h2>
    <p style={{ color: "var(--text2)", marginBottom: 28 }}>Save items you love to your wishlist!</p>
    <Link to="/products"><button style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 50, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Discover Products</button></Link>
  </div>
);

export default Wishlist;
