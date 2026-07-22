import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";

import { apiRequest } from "@/lib/api";
import type {
  AttributeDefinition,
  AttributeDefinitionInput,
} from "@/lib/types";
import { mockAttributes, resolveDemoData } from "@/mock";

type StateWithAuth = { auth: { token: string | null } };

type AttributesState = {
  items: AttributeDefinition[];
  loading: boolean;
  error: string | null;
};

const initialState: AttributesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAttributes = createAsyncThunk<
  AttributeDefinition[],
  void,
  { state: StateWithAuth }
>("attributes/fetch", async (_, { getState }) => {
  try {
    const data = await apiRequest<AttributeDefinition[]>(
      "/attributes",
      {},
      getState().auth.token,
    );
    return resolveDemoData(data, mockAttributes);
  } catch {
    return resolveDemoData([], mockAttributes);
  }
});

export const createAttribute = createAsyncThunk<
  AttributeDefinition,
  AttributeDefinitionInput,
  { state: StateWithAuth }
>("attributes/create", (payload, { getState }) =>
  apiRequest<AttributeDefinition>(
    "/attributes",
    { method: "POST", body: JSON.stringify(payload) },
    getState().auth.token,
  ),
);

export const updateAttribute = createAsyncThunk<
  AttributeDefinition,
  { id: number; changes: AttributeDefinitionInput },
  { state: StateWithAuth }
>("attributes/update", ({ id, changes }, { getState }) =>
  apiRequest<AttributeDefinition>(
    `/attributes/${id}`,
    { method: "PATCH", body: JSON.stringify(changes) },
    getState().auth.token,
  ),
);

export const deleteAttribute = createAsyncThunk<
  number,
  number,
  { state: StateWithAuth }
>("attributes/delete", async (id, { getState }) => {
  await apiRequest<void>(
    `/attributes/${id}`,
    { method: "DELETE" },
    getState().auth.token,
  );
  return id;
});

const attributesSlice = createSlice({
  name: "attributes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttributes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(createAttribute.fulfilled, (state, action) => {
        const exists = state.items.some((item) => item.id === action.payload.id);
        if (!exists) state.items.push(action.payload);
        state.error = null;
      })
      .addCase(updateAttribute.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
        else state.items.push(action.payload);
      })
      .addCase(deleteAttribute.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.error = null;
      })
      .addMatcher(
        isAnyOf(
          fetchAttributes.rejected,
          createAttribute.rejected,
          updateAttribute.rejected,
          deleteAttribute.rejected,
        ),
        (state, action) => {
          state.loading = false;
          state.error = action.error?.message ?? "Attribute request failed";
        },
      )
      .addMatcher(
        isAnyOf(
          createAttribute.pending,
          updateAttribute.pending,
          deleteAttribute.pending,
        ),
        (state) => {
          state.error = null;
        },
      );
  },
});

export default attributesSlice.reducer;
