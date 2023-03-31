import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Avatar, Button, Stack } from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import { useHistory, Link } from "react-router-dom";
import "./Header.css";

const Header = ({ children, hasHiddenAuthButtons }) => {
  const history = useHistory();

  const routeToExplore = () => {
    history.push("/");
  }

  const routeToRegister = () => {
    history.push("/register");
  }

  const routeToLogin= () => {
    history.push("/login");
  }

  const routeToLogout= () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("balance");
    history.push("/");

  window.location.reload();
  };

  if(hasHiddenAuthButtons){
    return (
      <Box className="header">
        <Box className="header-title">
          <Link to="/">
            <img src="logo_light.svg" alt="QKart-icon"></img>
          </Link>
        </Box>
        {children}
        <Button
          className="explore-button"
          startIcon={<ArrowBackIcon />}
          variant="text"
          onClick={routeToExplore}
        >
          Back to explore
        </Button>
      </Box>
    )
  }

    return (
      <Box className="header">
        <Box className="header-title">
          <Link to="/">
            <img src="logo_light.svg" alt="QKart-icon"></img>
          </Link>
        </Box>
        {children}
        <Stack direction="row" spacing={1} alignItems="center">
          {localStorage.getItem("username") ? (
            <>
              <Avatar src="avatar.png" alt={localStorage.getItem("username") || "profile"}/>

              <p className="username-text">{localStorage.getItem("username")}</p>

              <Button type="primary" onClick={routeToLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button onClick={routeToLogin}>Login</Button>
              
              <Button variant="contained" onClick={routeToRegister}>Register</Button>
            </>
          )}

        </Stack>
      </Box>
    );
};

export default Header;
