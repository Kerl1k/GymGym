import "react-router-dom";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  BOARDS: "/boards",
  BOARD: "/boards/:boardId",
  FAVORITE_BOARDS: "/boards/favorite",
  RECENT_BOARDS: "/boards/recent",
  TRAINING: "/training",

  EXERCISES: "/exercises",
  WORKOUT: "/workout",
  ACTIVE_WORKOUT: "/workout/active",
  CREATE_WORKOUT: "/workout/create",
  PROFILE: "/profile",
} as const;

export type PathParams = {
  [ROUTES.BOARD]: {
    boardId: string;
  };
};

declare module "react-router-dom" {
  interface Register {
    params: PathParams;
  }
}

// import "react-router-dom";

// export const ROUTES = {
//   HOME: "/",
//   LOGIN: "/login",
//   REGISTER: "/register",
// EXERCISES: "/exercises",
// WORKOUT: "/workout",
// ACTIVE_WORKOUT: "/workout/active",
// CREATE_WORKOUT: "/workout/create",
// PROFILE: "/profile",

// FAVORITE_BOARDS: "/boards/favorite",
// RECENT_BOARDS: "/boards/recent",
// } as const;

// export type PathParams = {
//   [ROUTES.EXERCISES]: {
//     exercisesId: string;
//   };
// };

// declare module "react-router-dom" {
//   interface Register {
//     params: PathParams;
//   }
// }
