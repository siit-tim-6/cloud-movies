import "./navbar.css";
import { HamburgerMenuIcon, MagnifyingGlassIcon, BellIcon, ExitIcon } from "@radix-ui/react-icons";
import { Link, useNavigate } from "react-router-dom";
import Logo from "@/assets/brief-cinema-logo.svg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useContext } from "react";
import { AccountContext } from "@/components/auth/accountContext";

function Navbar() {
  const navigate = useNavigate();
  const { logout } = useContext(AccountContext);

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar>
              <AvatarFallback>VP</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <div className="flex flex-row items-center">
                <ExitIcon className="mr-3" /> Log Out
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default Navbar;
