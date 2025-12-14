import "react-router-dom";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  TRAINING: "/training",
  ACTIVE_TRAINING: "/training/:trainingId/active/start",
  START_TRAINING: `/training/:trainingId/active`,

  WORKOUT: "/workout",
  ACTIVE_WORKOUT: "/workout/active",
  CREATE_WORKOUT: "/workout/create",
  PROFILE: "/profile",
} as const;

export type PathParams = {
  [ROUTES.START_TRAINING]: {
    trainingId: string;
  };
  [ROUTES.ACTIVE_TRAINING]: {
    trainingId: string;
  };
};

declare module "react-router-dom" {
  interface Register {
    params: PathParams;
  }
}
