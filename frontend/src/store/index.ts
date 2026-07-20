import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import categoriesReducer from "./categoriesSlice";
import rolesReducer from "./rolesSlice";
import toastReducer from "./toastSlice";
import usersReducer from "./usersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    roles: rolesReducer,
    categories: categoriesReducer,
    toast: toastReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
