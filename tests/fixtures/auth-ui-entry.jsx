import React from "react";
import { createRoot } from "react-dom/client";
import LoginForm from "../../components/auth/login-form.js";
import RegisterForm from "../../components/auth/register-form.js";

const params = new URLSearchParams(location.search);
const Component = params.get("screen") === "register" ? RegisterForm : LoginForm;
createRoot(document.getElementById("root")).render(<Component registrationAvailable={params.get("available") === "1"} trialPlanName="" />);
