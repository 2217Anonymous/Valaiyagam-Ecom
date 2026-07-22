import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";

import { apiRequest } from "@/lib/api";
import type { Product, ProductInput } from "@/lib/types";
import { mockProducts, resolveDemoData, resolveDemoItem } from "@/mock";

type StateWithAuth = { auth: { token: string | null } };

type ProductsState = {
  items: Product[];
  loading: boolean;
  error: string | null;
};

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk<
  Product[],
  void,
  { state: StateWithAuth }
>("products/fetch", async (_, { getState }) => {
  try {
    const data = await apiRequest<Product[]>(
      "/products",
      {},
      getState().auth.token,
    );
    return resolveDemoData(data, mockProducts);
  } catch {
    return resolveDemoData([], mockProducts);
  }
});

export const fetchProduct = createAsyncThunk<
  Product,
  number,
  { state: StateWithAuth }
>("products/fetchOne", async (id, { getState, rejectWithValue }) => {
  try {
    const data = await apiRequest<Product>(
      `/products/${id}`,
      {},
      getState().auth.token,
    );
    const resolved = resolveDemoItem(data, mockProducts, id);
    if (resolved) return resolved;
    return data;
  } catch {
    const mock = resolveDemoItem(null, mockProducts, id);
    if (mock) return mock;
    return rejectWithValue("Product not found") as never;
  }
});

export const createProduct = createAsyncThunk<
  Product,
  ProductInput,
  { state: StateWithAuth }
>("products/create", (payload, { getState }) =>
  apiRequest<Product>(
    "/products",
    { method: "POST", body: JSON.stringify(payload) },
    getState().auth.token,
  ),
);

export const updateProduct = createAsyncThunk<
  Product,
  { id: number; changes: ProductInput },
  { state: StateWithAuth }
>("products/update", ({ id, changes }, { getState }) =>
  apiRequest<Product>(
    `/products/${id}`,
    { method: "PATCH", body: JSON.stringify(changes) },
    getState().auth.token,
  ),
);

export const uploadProductMedia = createAsyncThunk<
  Product,
  { id: number; file: File; altText?: string },
  { state: StateWithAuth }
>("products/uploadMedia", ({ id, file, altText }, { getState }) => {
  const body = new FormData();
  body.append("file", file);
  if (altText) body.append("alt_text", altText);
  return apiRequest<Product>(
    `/products/${id}/media`,
    { method: "POST", body },
    getState().auth.token,
  );
});

export const deleteProductMedia = createAsyncThunk<
  Product,
  { productId: number; mediaId: number },
  { state: StateWithAuth }
>("products/deleteMedia", ({ productId, mediaId }, { getState }) =>
  apiRequest<Product>(
    `/products/${productId}/media/${mediaId}`,
    { method: "DELETE" },
    getState().auth.token,
  ),
);

export const setPrimaryProductMedia = createAsyncThunk<
  Product,
  { productId: number; mediaId: number },
  { state: StateWithAuth }
>("products/setPrimaryMedia", ({ productId, mediaId }, { getState }) =>
  apiRequest<Product>(
    `/products/${productId}/media/${mediaId}/primary`,
    { method: "POST" },
    getState().auth.token,
  ),
);

export const deleteProduct = createAsyncThunk<
  number,
  number,
  { state: StateWithAuth }
>("products/delete", async (id, { getState }) => {
  await apiRequest<void>(
    `/products/${id}`,
    { method: "DELETE" },
    getState().auth.token,
  );
  return id;
});

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
        else state.items.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        const exists = state.items.some((item) => item.id === action.payload.id);
        if (!exists) state.items.push(action.payload);
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
        else state.items.push(action.payload);
      })
      .addCase(uploadProductMedia.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(deleteProductMedia.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(setPrimaryProductMedia.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.error = null;
      })
      .addMatcher(
        isAnyOf(
          fetchProducts.rejected,
          fetchProduct.rejected,
          createProduct.rejected,
          updateProduct.rejected,
          uploadProductMedia.rejected,
          deleteProductMedia.rejected,
          setPrimaryProductMedia.rejected,
          deleteProduct.rejected,
        ),
        (state, action) => {
          state.loading = false;
          state.error = action.error?.message ?? "Product request failed";
        },
      )
      .addMatcher(
        isAnyOf(
          createProduct.pending,
          updateProduct.pending,
          uploadProductMedia.pending,
          deleteProduct.pending,
        ),
        (state) => {
          state.error = null;
        },
      );
  },
});

export default productsSlice.reducer;
