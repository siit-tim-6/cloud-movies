import { AccountContext } from "@/components/auth/accountContext";
import { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

function ProtectedRoutes() {
  const navigate = useNavigate();
  const { getSession } = useContext(AccountContext);

  useEffect(() => {
    getSession()
      .then((session) => {})
      .catch(() => navigate("/login"));
  }, []);

  return <Outlet />;
}

export default ProtectedRoutes;
