import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";

import { apiRequest } from "@/lib/api";
import type { Category, CategoryInput, CategoryTreeNode } from "@/lib/types";

type StateWithAuth = { auth: { token: string | null } };

type CategoriesState = {
  items: Category[];
  tree: CategoryTreeNode[];
  loading: boolean;
  error: string | null;
};

const initialState: CategoriesState = {
  items: [],
  tree: [],
  loading: false,
  error: null,
};

function pruneTree(
  nodes: CategoryTreeNode[],
  deletedIds: Set<number>,
): CategoryTreeNode[] {
  return nodes
    .filter((node) => !deletedIds.has(node.id))
    .map((node) => ({
      ...node,
      children: pruneTree(node.children, deletedIds),
    }));
}

export const fetchCategories = createAsyncThunk<
  Category[],
  void,
  { state: StateWithAuth }
>("categories/fetch", (_, { getState }) =>
  apiRequest<Category[]>("/categories", {}, getState().auth.token),
);

export const fetchCategoryTree = createAsyncThunk<
  CategoryTreeNode[],
  void,
  { state: StateWithAuth }
>("categories/fetchTree", (_, { getState }) =>
  apiRequest<CategoryTreeNode[]>("/categories/tree", {}, getState().auth.token),
);

export const createCategory = createAsyncThunk<
  Category,
  CategoryInput,
  { state: StateWithAuth }
>("categories/create", (payload, { getState }) =>
  apiRequest<Category>(
    "/categories",
    { method: "POST", body: JSON.stringify(payload) },
    getState().auth.token,
  ),
);

export const updateCategory = createAsyncThunk<
  Category,
  { id: number; changes: CategoryInput },
  { state: StateWithAuth }
>("categories/update", ({ id, changes }, { getState }) =>
  apiRequest<Category>(
    `/categories/${id}`,
    { method: "PATCH", body: JSON.stringify(changes) },
    getState().auth.token,
  ),
);

export const uploadCategoryImage = createAsyncThunk<
  Category,
  { id: number; file: File },
  { state: StateWithAuth }
>("categories/uploadImage", ({ id, file }, { getState }) => {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<Category>(
    `/categories/${id}/image`,
    { method: "POST", body },
    getState().auth.token,
  );
});

export const deleteCategory = createAsyncThunk<
  number[],
  number,
  { state: StateWithAuth }
>("categories/delete", async (id, { getState }) => {
  const result = await apiRequest<{ deleted_ids: number[] }>(
    `/categories/${id}`,
    { method: "DELETE" },
    getState().auth.token,
  );
  return result.deleted_ids;
});

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategoryTree.fulfilled, (state, action) => {
        state.tree = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        const exists = state.items.some(
          (category) => category.id === action.payload.id,
        );
        if (!exists) {
          state.items.push(action.payload);
          state.items.sort(
            (a, b) =>
              a.sort_order - b.sort_order || a.name.localeCompare(b.name),
          );
        }
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (category) => category.id === action.payload.id,
        );
        if (index >= 0) state.items[index] = action.payload;
        else state.items.push(action.payload);
        state.items.sort(
          (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
        );
      })
      .addCase(uploadCategoryImage.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (category) => category.id === action.payload.id,
        );
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        const deletedIds = new Set(action.payload);
        state.items = state.items.filter(
          (category) => !deletedIds.has(category.id),
        );
        state.tree = pruneTree(state.tree, deletedIds);
        state.error = null;
      })
      .addMatcher(
        isAnyOf(
          fetchCategories.rejected,
          fetchCategoryTree.rejected,
          createCategory.rejected,
          updateCategory.rejected,
          uploadCategoryImage.rejected,
          deleteCategory.rejected,
        ),
        (state, action) => {
          state.loading = false;
          state.error = action.error?.message ?? "Category request failed";
        },
      )
      .addMatcher(
        isAnyOf(
          createCategory.pending,
          updateCategory.pending,
          uploadCategoryImage.pending,
          deleteCategory.pending,
        ),
        (state) => {
          state.error = null;
        },
      );
  },
});

export default categoriesSlice.reducer;
