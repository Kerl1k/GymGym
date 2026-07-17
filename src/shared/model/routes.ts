import "react-router-dom";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  TRAINING: "/training",
  ACTIVE_TRAINING: "/active",
  START: "/start",
  END: "/end/:id",
  PROFILE: "/profile",
  TRAINING_HISTORY: "/training-history",
  STATISTICS: "/statistics",
} as const;
