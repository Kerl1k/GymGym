import "react-router-dom";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  TRAINING: "/training",
  ACTIVE_TRAINING: "/active",
  START: "/start",
  END: "/end",

  profile: "/profile",
  WORKOUT: "/workout",
  ACTIVE_WORKOUT: "/workout/active",
  CREATE_WORKOUT: "/workout/create",
  PROFILE: "/profile",
  TRAINING_HISTORY: "/training-history",
} as const;
