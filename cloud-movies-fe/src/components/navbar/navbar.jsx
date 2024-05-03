import "./navbar.css";
import { HamburgerMenuIcon, MagnifyingGlassIcon, BellIcon } from "@radix-ui/react-icons";
import { Link, useNavigate } from "react-router-dom";
import Logo from "@/assets/brief-cinema-logo.svg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import * as React from "react";

function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <div className="navbar-left">
        <div className="white-icon">
          <HamburgerMenuIcon />
        </div>
        <Link to="/movies">Movies</Link>
        <a href="">New & Popular</a>
      </div>
      <div className="navbar-center">
        <Link to="/">
          <img src={Logo} alt="logo" />
        </Link>
      </div>
      <div className="navbar-right">
        <div className="white-icon">
          <MagnifyingGlassIcon />
        </div>
        <div className="white-icon">
          <BellIcon />
        </div>
        <Avatar>
          <AvatarFallback>VP</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

export default Navbar;
