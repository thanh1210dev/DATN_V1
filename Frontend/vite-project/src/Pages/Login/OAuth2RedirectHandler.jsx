import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const name = params.get("name"); 
    const role = params.get("role");
    const id = params.get("id");

    console.log("✅ OAuth2 Token:", token);
    console.log("✅ Name:", name);
    console.log("✅ Role:", role);
    console.log("✅ ID:", id);

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("name", name);
      localStorage.setItem("id", id);
      localStorage.setItem("selectedRole", role);

      

      switch (role) {
        case "Staff":
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "CLIENT":
          navigate("/");
          break;
        default:
          navigate("/");
          break;
      }
    } else {
      navigate("/login");
    }
  }, [location, navigate]);

  return null;
}

export default OAuth2RedirectHandler;