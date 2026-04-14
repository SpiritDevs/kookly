import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    {
      path: "/api/auth/sign-in/email",
      method: "POST",
    },
    {
      path: "/api/auth/sign-up/email",
      method: "POST",
    },
    {
      path: "/api/auth/request-password-reset",
      method: "POST",
    },
  ],
});
