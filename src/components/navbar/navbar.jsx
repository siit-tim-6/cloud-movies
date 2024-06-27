import "./navbar.css";
import { HamburgerMenuIcon, HeartFilledIcon, ExitIcon, UploadIcon } from "@radix-ui/react-icons";
import { Link, useNavigate } from "react-router-dom";
import Logo from "@/assets/brief-cinema-logo.svg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useContext, useEffect, useState } from "react";
import { AccountContext } from "@/components/auth/accountContext";

function Navbar() {
  const navigate = useNavigate();
  const { logout } = useContext(AccountContext);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-left">
        <div className="white-icon">
          <HamburgerMenuIcon />
        </div>
        <Link to="/movies">Movies</Link>
      </div>
      <div className="navbar-center">
        <Link to="/">
          <img src={Logo} alt="logo" />
        </Link>
      </div>
      <div className="navbar-right">
        <div className="white-icon" onClick={() => navigate("/subscriptions")}>
          <HeartFilledIcon />
        </div>
        <div className="white-icon" onClick={() => navigate("/upload-movie")}>
          <UploadIcon />
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
