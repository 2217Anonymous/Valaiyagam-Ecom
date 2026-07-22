import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import attributesReducer from "./attributesSlice";
import categoriesReducer from "./categoriesSlice";
import couponsReducer from "./couponsSlice";
import productsReducer from "./productsSlice";
import rolesReducer from "./rolesSlice";
import storeSettingsReducer from "./storeSettingsSlice";
import taxReducer from "./taxSlice";
import toastReducer from "./toastSlice";
import usersReducer from "./usersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    roles: rolesReducer,
    categories: categoriesReducer,
    products: productsReducer,
    attributes: attributesReducer,
    storeSettings: storeSettingsReducer,
    tax: taxReducer,
    coupons: couponsReducer,
    toast: toastReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
