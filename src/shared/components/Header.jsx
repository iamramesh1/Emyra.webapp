import React from "react";

import {
  Link
} from "react-router-dom";

import "./header.css";

const Header = () => {

  const token =
    localStorage.getItem(
      "accessToken"
    );

  return (

    <header className="header">

      {/* LEFT */}

      <div className="header-left">

        <Link to="/" className="logo">

          ShopEasy

        </Link>

      </div>

      {/* CENTER */}

      <div className="header-center">

        <input
          type="text"
          placeholder="Search products..."
        />

        <button>
          Search
        </button>

      </div>

      {/* RIGHT */}

      <div className="header-right">

        {
          token
          ?
          <>
            <Link to="/orders">
              Orders
            </Link>

            <Link to="/wishlist">
              Wishlist
            </Link>
          </>
          :
          <Link to="/login">
            Login
          </Link>
        }

        <Link to="/cart">
          Cart
        </Link>

      </div>

    </header>
  );
};

export default Header;