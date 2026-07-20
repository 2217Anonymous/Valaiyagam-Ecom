"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  FolderTree,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

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
import { mediaUrl } from "@/lib/api";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import type { Category, CategoryInput, CategoryTreeNode } from "@/lib/types";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchCategoryTree,
  updateCategory,
  uploadCategoryImage,
} from "@/store/categoriesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { ConfirmDialog, Modal } from "./Modal";

type CategorySortKey =
  | "name"
  | "slug"
  | "level"
  | "sort_order"
  | "status"
  | "parent";

type FlatTreeRow = CategoryTreeNode & {
  depth: number;
  hasChildren: boolean;
  pathLabel: string;
  ancestorIds: number[];
  isLastSibling: boolean;
  parentName: string;
};

function buildTreeFromItems(items: Category[]): CategoryTreeNode[] {
  const byId = new Map<number, CategoryTreeNode>();
  for (const item of items) {
    byId.set(item.id, { ...item, children: [] });
  }
  const roots: CategoryTreeNode[] = [];
  for (const item of items) {
    const node = byId.get(item.id)!;
    if (item.parent_id != null && byId.has(item.parent_id)) {
      byId.get(item.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function sortTreeNodes(
  nodes: CategoryTreeNode[],
  compare: (a: CategoryTreeNode, b: CategoryTreeNode) => number,
): CategoryTreeNode[] {
  return [...nodes]
    .sort(compare)
    .map((node) => ({
      ...node,
      children: sortTreeNodes(node.children, compare),
    }));
}

function filterTreeNodes(
  nodes: CategoryTreeNode[],
  query: string,
): CategoryTreeNode[] {
  if (!query) return nodes;
  const result: CategoryTreeNode[] = [];
  for (const node of nodes) {
    const selfMatch =
      node.name.toLowerCase().includes(query) ||
      node.slug.toLowerCase().includes(query) ||
      (node.description ?? "").toLowerCase().includes(query);
    const children = filterTreeNodes(node.children, query);
    if (selfMatch || children.length > 0) {
      result.push({
        ...node,
        children: selfMatch ? node.children : children,
      });
    }
  }
  return result;
}

function flattenTree(
  nodes: CategoryTreeNode[],
  depth = 0,
  parentPath = "",
  ancestorIds: number[] = [],
  parentName = "—",
): FlatTreeRow[] {
  const rows: FlatTreeRow[] = [];
  nodes.forEach((node, index) => {
    const pathLabel = parentPath ? `${parentPath} / ${node.name}` : node.name;
    rows.push({
      ...node,
      depth,
      hasChildren: node.children.length > 0,
      pathLabel,
      ancestorIds,
      isLastSibling: index === nodes.length - 1,
      parentName,
    });
    if (node.children.length > 0) {
      rows.push(
        ...flattenTree(node.children, depth + 1, pathLabel, [
          ...ancestorIds,
          node.id,
        ], node.name),
      );
    }
  });
  return rows;
}

function collectExpandableIds(nodes: CategoryTreeNode[]): number[] {
  const ids: number[] = [];
  for (const node of nodes) {
    if (node.children.length > 0) {
      ids.push(node.id);
      ids.push(...collectExpandableIds(node.children));
    }
  }
  return ids;
}

function CategoryAvatar({
  category,
}: {
  category: Pick<Category, "name" | "image_url">;
}) {
  const src = mediaUrl(category.image_url);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={category.name}
        className="size-8 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700 ring-2 ring-white">
      {category.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function TreeGuides({ depth }: { depth: number }) {
  if (depth <= 0) return null;
  return (
    <span className="mr-1 flex shrink-0 items-center" aria-hidden>
      {Array.from({ length: depth }).map((_, level) => (
        <span key={level} className="relative h-8 w-4">
          <span className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-slate-300" />
          {level === depth - 1 && (
            <span className="absolute left-1/2 top-1/2 h-px w-2 bg-slate-300" />
          )}
        </span>
      ))}
    </span>
  );
}

export function CategoriesPanel() {
  const dispatch = useAppDispatch();
  const { items, tree, loading, error } = useAppSelector(
    (state) => state.categories,
  );
  const [formCategory, setFormCategory] = useState<Category | "new" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<CategorySortKey>("sort_order");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    void dispatch(fetchCategories());
    void dispatch(fetchCategoryTree());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toastError(dispatch, "Request failed", error);
    }
  }, [error, dispatch]);

  const sourceTree = useMemo(() => {
    if (items.length > 0) return buildTreeFromItems(items);
    return tree;
  }, [items, tree]);

  const filteredSortedTree = useMemo(() => {
    let nodes = sourceTree;
    if (statusFilter !== "all") {
      const keepActive = statusFilter === "active";
      const filterStatus = (list: CategoryTreeNode[]): CategoryTreeNode[] =>
        list
          .map((node) => ({
            ...node,
            children: filterStatus(node.children),
          }))
          .filter(
            (node) =>
              node.is_active === keepActive || node.children.length > 0,
          );
      nodes = filterStatus(nodes);
    }

    const query = search.trim().toLowerCase();
    nodes = filterTreeNodes(nodes, query);

    const compare = (a: CategoryTreeNode, b: CategoryTreeNode) => {
      let result = 0;
      switch (sortKey) {
        case "name":
          result = a.name.localeCompare(b.name);
          break;
        case "slug":
          result = a.slug.localeCompare(b.slug);
          break;
        case "sort_order":
          result = a.sort_order - b.sort_order;
          break;
        case "status":
          result = Number(a.is_active) - Number(b.is_active);
          break;
        case "parent":
          result = (a.parent_id ?? 0) - (b.parent_id ?? 0);
          break;
        case "level":
          result = 0;
          break;
        default:
          result = a.name.localeCompare(b.name);
      }
      if (result === 0) result = a.name.localeCompare(b.name);
      return sortDirection === "asc" ? result : -result;
    };

    return sortTreeNodes(nodes, compare);
  }, [sourceTree, statusFilter, search, sortKey, sortDirection]);

  const flatRows = useMemo(
    () => flattenTree(filteredSortedTree),
    [filteredSortedTree],
  );

  const visibleRows = useMemo(() => {
    return flatRows.filter(
      (row) => !row.ancestorIds.some((id) => collapsed.has(id)),
    );
  }, [flatRows, collapsed]);

  // Paginate by root nodes so children stay with their parent on the same page.
  const rootNodes = filteredSortedTree;
  const pageCount = Math.max(1, Math.ceil(rootNodes.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRoots = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rootNodes.slice(start, start + pageSize);
  }, [rootNodes, currentPage, pageSize]);

  const pagedRows = useMemo(() => {
    const allowedRoots = new Set(pagedRoots.map((root) => root.id));
    return visibleRows.filter((row) => {
      const rootId = row.ancestorIds[0] ?? row.id;
      return allowedRoots.has(rootId) || allowedRoots.has(row.id);
    });
  }, [visibleRows, pagedRoots]);

  const childCount = useMemo(() => {
    if (!deleteTarget) return 0;
    return flatRows.filter((row) =>
      row.ancestorIds.includes(deleteTarget.id),
    ).length;
  }, [deleteTarget, flatRows]);

  const expandableIds = useMemo(
    () => collectExpandableIds(filteredSortedTree),
    [filteredSortedTree],
  );

  const getCategoryId = useCallback((row: FlatTreeRow) => row.id, []);
  const selection = useRowSelection(pagedRows, getCategoryId);

  function toggleCollapse(categoryId: number) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  function toggleSort(key: CategorySortKey) {
    setPage(1);
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (childCount > 0) {
      toastWarning(
        dispatch,
        "Deleting parent category",
        `${childCount} child categor${childCount === 1 ? "y" : "ies"} will also be removed.`,
      );
    }
    setDeleting(true);
    const result = await dispatch(deleteCategory(deleteTarget.id));
    setDeleting(false);
    if (deleteCategory.fulfilled.match(result)) {
      toastSuccess(
        dispatch,
        "Category deleted",
        `${deleteTarget.name} was removed.`,
      );
      setDeleteTarget(null);
      selection.clear();
      await Promise.all([
        dispatch(fetchCategories()),
        dispatch(fetchCategoryTree()),
      ]);
    } else {
      toastError(
        dispatch,
        "Could not delete category",
        result.error?.message ?? "Please try again.",
      );
    }
  }

  async function confirmBulkDelete() {
    if (selection.selectedIds.length === 0) return;
    setDeleting(true);
    let ok = 0;
    for (const id of selection.selectedIds) {
      const result = await dispatch(deleteCategory(id));
      if (deleteCategory.fulfilled.match(result)) ok += 1;
    }
    setDeleting(false);
    setBulkDeleteOpen(false);
    selection.clear();
    await Promise.all([
      dispatch(fetchCategories()),
      dispatch(fetchCategoryTree()),
    ]);
    if (ok > 0) {
      toastSuccess(dispatch, "Categories deleted", `${ok} categor${ok === 1 ? "y" : "ies"} removed.`);
    } else {
      toastError(dispatch, "Could not delete categories", "Please try again.");
    }
  }

  async function refreshLists() {
    await Promise.all([
      dispatch(fetchCategories()),
      dispatch(fetchCategoryTree()),
    ]);
  }

  return (
    <>
      <section className="table-card">
        <div className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Category List</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              onClick={() => setCollapsed(new Set())}
            >
              Expand all
            </button>
            <button
              type="button"
              className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              onClick={() => setCollapsed(new Set(expandableIds))}
            >
              Collapse all
            </button>
            <button
              onClick={() => setFormCategory("new")}
              className="primary-button"
            >
              <Plus size={16} /> Create Category
            </button>
          </div>
        </div>

        <TableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search..."
          filters={
            <>
              <FilterSelect
                aria-label="Status filter"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as "all" | "active" | "inactive");
                  setPage(1);
                }}
              >
                <option value="all">Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </FilterSelect>
              <FilterSelect
                aria-label="Rows per page"
                value={String(pageSize)}
                onChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50].map((size) => (
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

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="table-head">
              <tr>
                <SelectTh
                  checked={selection.allSelected}
                  indeterminate={selection.someSelected}
                  onChange={selection.togglePage}
                />
                <StaticTh label="ID" />
                <SortableTh
                  label="Category"
                  sortKey="name"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Parent"
                  sortKey="parent"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Slug"
                  sortKey="slug"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Level"
                  sortKey="level"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Order"
                  sortKey="sort_order"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Status"
                  sortKey="status"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <StaticTh label="Action" align="right" />
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50/80"
                >
                  <SelectTd
                    checked={selection.isSelected(row.id)}
                    onChange={() => selection.toggleOne(row.id)}
                    label={`Select ${row.name}`}
                  />
                  <td className="px-4 py-3.5 text-slate-500">#{row.id}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-0 items-center">
                      <TreeGuides depth={row.depth} />
                      {row.hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleCollapse(row.id)}
                          className="mr-1 grid size-6 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-teal-700"
                          aria-label={
                            collapsed.has(row.id)
                              ? `Expand ${row.name}`
                              : `Collapse ${row.name}`
                          }
                        >
                          {collapsed.has(row.id) ? (
                            <ChevronRight size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </button>
                      ) : (
                        <span className="mr-1 size-6 shrink-0" />
                      )}
                      <CategoryAvatar category={row} />
                      <div className="min-w-0 pl-2">
                        <p className="font-semibold text-slate-900">{row.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {row.depth === 0 ? "Root category" : row.pathLabel}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{row.parentName}</td>
                  <td className="px-4 py-3.5 text-slate-600">/{row.slug}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {row.depth === 0 ? "Root" : `L${row.depth}`}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{row.sort_order}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.is_active
                          ? "bg-teal-50 text-teal-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {row.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setFormCategory(row)}
                        className="icon-button rounded-lg border border-slate-200 hover:text-teal-700"
                        aria-label={`View ${row.name}`}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setFormCategory(row)}
                        className="icon-button rounded-lg border border-slate-200 hover:text-teal-700"
                        aria-label={`Edit ${row.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(row)}
                        className="icon-button rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Delete ${row.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && flatRows.length === 0 && (
            <p className="p-10 text-center text-sm text-slate-500">
              {items.length === 0
                ? "No categories yet. Create a root category, then add children under it."
                : "No categories match your search or filters."}
            </p>
          )}
        </div>

        <TablePagination
          page={currentPage}
          pageCount={pageCount}
          onPageChange={setPage}
          filteredCount={rootNodes.length}
          pageSize={pageSize}
        />
      </section>

      <CategoryFormModal
        category={formCategory}
        categories={items}
        onClose={() => setFormCategory(null)}
        onSaved={refreshLists}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category?"
        message={
          childCount > 0
            ? `Deleting ${deleteTarget?.name ?? "this category"} will also permanently delete ${childCount} child categor${childCount === 1 ? "y" : "ies"}.`
            : `This will permanently delete ${deleteTarget?.name ?? "this category"}.`
        }
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete selected categories?"
        message={`This will permanently delete ${selection.selectedCount} selected categor${selection.selectedCount === 1 ? "y" : "ies"}. Parent deletes also remove children.`}
        busy={deleting}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => void confirmBulkDelete()}
      />
    </>
  );
}


function CategoryFormModal({
  category,
  categories,
  onClose,
  onSaved,
}: {
  category: Category | "new" | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const dispatch = useAppDispatch();
  const editing = category !== null && category !== "new";
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parent_id: "" as string,
    is_active: true,
    sort_order: "0",
  });

  const parentOptions = useMemo(() => {
    if (!editing) return categories;
    return categories.filter((item) => item.id !== category.id);
  }, [categories, category, editing]);

  useEffect(() => {
    if (!category) return;
    submittingRef.current = false;
    setBusy(false);
    setImageFile(null);
    setPreviewUrl(category === "new" ? null : mediaUrl(category.image_url));
    setForm(
      category === "new"
        ? {
            name: "",
            slug: "",
            description: "",
            parent_id: "",
            is_active: true,
            sort_order: "0",
          }
        : {
            name: category.name,
            slug: category.slug,
            description: category.description || "",
            parent_id: category.parent_id ? String(category.parent_id) : "",
            is_active: category.is_active,
            sort_order: String(category.sort_order),
          },
    );
  }, [category]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (submittingRef.current || busy) return;
    submittingRef.current = true;
    setBusy(true);
    const payload: CategoryInput = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || undefined,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    };
    try {
      let saved: Category | null = null;
      if (category === "new") {
        const result = await dispatch(createCategory(payload));
        if (createCategory.fulfilled.match(result)) saved = result.payload;
      } else if (category) {
        const result = await dispatch(
          updateCategory({ id: category.id, changes: payload }),
        );
        if (updateCategory.fulfilled.match(result)) saved = result.payload;
      }

      if (!saved) {
        toastError(
          dispatch,
          editing ? "Could not update category" : "Could not create category",
          "Please check the form and try again.",
        );
        return;
      }

      if (imageFile) {
        const uploadResult = await dispatch(
          uploadCategoryImage({ id: saved.id, file: imageFile }),
        );
        if (!uploadCategoryImage.fulfilled.match(uploadResult)) {
          toastWarning(
            dispatch,
            "Category saved without image",
            uploadResult.error?.message ?? "Image upload failed.",
          );
          await onSaved();
          onClose();
          return;
        }
      }

      toastSuccess(
        dispatch,
        editing ? "Category updated" : "Category created",
        form.parent_id
          ? `${saved.name} nested under parent.`
          : `${saved.name} saved as root.`,
      );
      await onSaved();
      onClose();
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  return (
    <Modal
      open={Boolean(category)}
      title={editing ? "Edit category" : "Create category"}
      description="Choose a parent to nest in the tree, or leave Root for a top-level category."
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Category preview"
                className="size-20 rounded-full object-cover ring-4 ring-white shadow-md"
              />
            ) : (
              <span className="grid size-20 place-items-center rounded-full bg-teal-50 text-teal-700 ring-4 ring-white shadow-md">
                <FolderTree size={28} />
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="glass-secondary-button inline-flex items-center gap-2"
            >
              <ImagePlus size={16} />
              {previewUrl ? "Change image" : "Upload image"}
            </button>
            <p className="mt-2 text-xs text-slate-500">
              JPEG, PNG, or WebP up to 2MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setImageFile(file);
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Name
            </span>
            <input
              className="form-input"
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Slug (optional)
            </span>
            <input
              className="form-input"
              placeholder="auto-from-name"
              value={form.slug}
              onChange={(event) =>
                setForm({ ...form, slug: event.target.value })
              }
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </span>
            <textarea
              className="form-input min-h-24 resize-y"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Parent category (tree nest)
            </span>
            <select
              className="form-input"
              value={form.parent_id}
              onChange={(event) =>
                setForm({ ...form, parent_id: event.target.value })
              }
            >
              <option value="">Root (top level)</option>
              {parentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              Select a parent to show this category under it in the tree.
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Sort order
            </span>
            <input
              className="form-input"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(event) =>
                setForm({ ...form, sort_order: event.target.value })
              }
            />
          </label>
          <button
            type="button"
            onClick={() => setForm({ ...form, is_active: !form.is_active })}
            className={`form-input flex items-center justify-between sm:col-span-2 ${
              form.is_active ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {form.is_active ? "Active" : "Inactive"}
            <span
              className={`h-6 w-11 rounded-full p-1 transition ${
                form.is_active ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`block size-4 rounded-full bg-white transition ${
                  form.is_active ? "translate-x-5" : ""
                }`}
              />
            </span>
          </button>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200/70 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="glass-secondary-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="primary-button justify-center"
          >
            {busy ? "Saving..." : editing ? "Save changes" : "Create category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
