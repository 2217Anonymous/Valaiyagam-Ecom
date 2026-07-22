"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Package, Pencil, Plus, Trash2 } from "lucide-react";

import {
  FilterSelect,
  SelectTd,
  SelectTh,
  SelectionBar,
  SortableTh,
  StaticTh,
  TablePagination,
  TableToolbar,
} from "@/components/DataTableControls";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useTableState } from "@/hooks/useTableState";
import { mediaUrl } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Product } from "@/lib/types";
import { fetchCategories } from "@/store/categoriesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteProduct, fetchProducts } from "@/store/productsSlice";

import { ConfirmDialog } from "./Modal";

type ProductSortKey =
  | "id"
  | "name"
  | "category"
  | "price"
  | "status"
  | "published";

function formatPrice(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return `$${amount.toFixed(2)}`;
}

function ProductThumb({ product }: { product: Product }) {
  const src = mediaUrl(product.primary_image_url);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={product.name}
        className="avatar-circle size-10 object-cover"
      />
    );
  }
  return (
    <span className="avatar-circle grid size-10 place-items-center bg-slate-100 text-slate-400">
      <Package size={18} />
    </span>
  );
}

export function ProductsPanel() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items, loading, error } = useAppSelector((state) => state.products);
  const categories = useAppSelector((state) => state.categories.items);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [publishFilter, setPublishFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    void dispatch(fetchProducts());
    void dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (error) toastError(dispatch, "Request failed", error);
  }, [error, dispatch]);

  const matchesSearch = useCallback((product: Product, query: string) => {
    const haystack = [
      product.name,
      product.slug,
      product.sku ?? "",
      product.category_name ?? "",
      product.description ?? "",
      product.tags ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }, []);

  const getSortValue = useCallback(
    (product: Product, key: ProductSortKey) => {
      switch (key) {
        case "id":
          return product.id;
        case "name":
          return product.name;
        case "category":
          return product.category_name ?? "";
        case "price":
          return Number(product.price);
        case "status":
          return product.is_active;
        case "published":
          return product.is_published;
        default:
          return product.name;
      }
    },
    [],
  );

  const filtered = useMemo(() => {
    return items.filter((product) => {
      if (statusFilter === "active" && !product.is_active) return false;
      if (statusFilter === "inactive" && product.is_active) return false;
      if (publishFilter === "published" && !product.is_published) return false;
      if (publishFilter === "draft" && product.is_published) return false;
      if (
        categoryFilter !== "all" &&
        String(product.category_id ?? "") !== categoryFilter
      ) {
        return false;
      }
      return true;
    });
  }, [items, statusFilter, publishFilter, categoryFilter]);

  const table = useTableState<Product, ProductSortKey>({
    rows: filtered,
    initialSort: { key: "id", direction: "desc" },
    getSortValue,
    matchesSearch,
  });

  const getProductId = useCallback((product: Product) => product.id, []);
  const selection = useRowSelection(table.pageRows, getProductId);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(deleteProduct(deleteTarget.id));
    setDeleting(false);
    if (deleteProduct.fulfilled.match(result)) {
      toastSuccess(dispatch, "Product deleted", `${deleteTarget.name} was removed.`);
      setDeleteTarget(null);
      selection.clear();
    } else {
      toastError(
        dispatch,
        "Could not delete product",
        result.error?.message ?? "Please try again.",
      );
    }
  }

  async function confirmBulkDelete() {
    if (selection.selectedIds.length === 0) return;
    setDeleting(true);
    let ok = 0;
    for (const id of selection.selectedIds) {
      const result = await dispatch(deleteProduct(id));
      if (deleteProduct.fulfilled.match(result)) ok += 1;
    }
    setDeleting(false);
    setBulkDeleteOpen(false);
    selection.clear();
    if (ok > 0) {
      toastSuccess(dispatch, "Products deleted", `${ok} product(s) removed.`);
    } else {
      toastError(dispatch, "Could not delete products", "Please try again.");
    }
  }

  return (
    <>
      <section className="table-card">
        <div className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Product List</h2>
          <button
            onClick={() => router.push("/products/new")}
            className="primary-button"
          >
            <Plus size={16} /> Create Product
          </button>
        </div>

        <TableToolbar
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search..."
          filters={
            <>
              <FilterSelect
                aria-label="Category filter"
                value={categoryFilter}
                onChange={(value) => {
                  setCategoryFilter(value);
                  table.setPage(1);
                }}
              >
                <option value="all">Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                aria-label="Publish filter"
                value={publishFilter}
                onChange={(value) => {
                  setPublishFilter(value as "all" | "published" | "draft");
                  table.setPage(1);
                }}
              >
                <option value="all">Status</option>
                <option value="published">Publish</option>
                <option value="draft">Draft</option>
              </FilterSelect>
              <FilterSelect
                aria-label="Active filter"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as "all" | "active" | "inactive");
                  table.setPage(1);
                }}
              >
                <option value="all">Active</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </FilterSelect>
              <FilterSelect
                aria-label="Rows per page"
                value={String(table.pageSize)}
                onChange={(value) => table.setPageSize(Number(value))}
              >
                {table.pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </FilterSelect>
            </>
          }
        />

        <SelectionBar
          count={selection.selectedCount}
          onClear={selection.clear}
          onDelete={() => setBulkDeleteOpen(true)}
          deleting={deleting}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="table-head">
              <tr>
                <SelectTh
                  checked={selection.allSelected}
                  indeterminate={selection.someSelected}
                  onChange={selection.togglePage}
                />
                <SortableTh
                  label="ID"
                  sortKey="id"
                  activeKey={table.sort.key}
                  direction={table.sort.direction}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Product"
                  sortKey="name"
                  activeKey={table.sort.key}
                  direction={table.sort.direction}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Category"
                  sortKey="category"
                  activeKey={table.sort.key}
                  direction={table.sort.direction}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Price"
                  sortKey="price"
                  activeKey={table.sort.key}
                  direction={table.sort.direction}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Status"
                  sortKey="published"
                  activeKey={table.sort.key}
                  direction={table.sort.direction}
                  onSort={table.toggleSort}
                />
                <StaticTh label="Action" align="right" />
              </tr>
            </thead>
            <tbody>
              {table.pageRows.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50/80"
                >
                  <SelectTd
                    checked={selection.isSelected(product.id)}
                    onChange={() => selection.toggleOne(product.id)}
                    label={`Select ${product.name}`}
                  />
                  <td className="px-4 py-3.5 text-slate-500">#{product.id}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <ProductThumb product={product} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {product.sku
                            ? `SKU ${product.sku}`
                            : `/${product.slug}`}
                          {(product.variants?.length ?? 0) > 0
                            ? ` · ${product.variants.length} variants`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {product.category_name || "—"}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-neutral-900">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        product.is_published
                          ? "bg-neutral-100 text-neutral-900"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {product.is_published ? "Publish" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() =>
                          router.push(`/products/${product.id}`)
                        }
                        className="icon-button rounded-lg border border-slate-200 hover:text-neutral-900"
                        aria-label={`View ${product.name}`}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/products/${product.id}/edit`)
                        }
                        className="icon-button rounded-lg border border-slate-200 hover:text-neutral-900"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="icon-button rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && table.filteredCount === 0 && (
            <p className="p-10 text-center text-sm text-slate-500">
              {items.length === 0
                ? "No products yet. Create your first product."
                : "No products match your search or filters."}
            </p>
          )}
        </div>

        <TablePagination
          page={table.page}
          pageCount={table.pageCount}
          onPageChange={table.setPage}
          filteredCount={table.filteredCount}
          pageSize={table.pageSize}
        />
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product?"
        message={`This will permanently delete ${deleteTarget?.name ?? "this product"} and its media.`}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete selected products?"
        message={`This will permanently delete ${selection.selectedCount} selected product(s).`}
        busy={deleting}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => void confirmBulkDelete()}
      />
    </>
  );
}
