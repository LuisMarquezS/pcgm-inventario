import Link from "next/link";
import { Barcode, Edit, Grid2X2, List, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { deleteProduct, recalculateAllProducts, recalculateProduct } from "@/app/actions";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ConditionBadge } from "@/components/products/condition-badge";
import { LiveProductSearch } from "@/components/products/live-product-search";
import { ProductBadges } from "@/components/products/product-badges";
import { ProductImagePreview } from "@/components/products/product-image-preview";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Select } from "@/components/ui/field";
import { IconSubmit } from "@/components/ui/icon-submit";
import { prisma } from "@/lib/prisma";
import { formatBs, formatDate, formatUSD } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = String(params.q ?? "");
  const categoryId = String(params.categoryId ?? "");
  const stockFilter = String(params.stock ?? "todos");
  const statusFilter = String(params.status ?? "activos");
  const sort = String(params.sort ?? "name");
  const view = String(params.view ?? "table");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const products = await prisma.product.findMany({
    include: { category: true },
    where: {
      AND: [
        q ? {
          OR: [
            { name: { contains: q } },
            { brand: { contains: q } },
            { model: { contains: q } },
            { sku: { contains: q } },
            { barcode: { contains: q } },
          ],
        } : {},
        categoryId ? { categoryId } : {},
        statusFilter === "activos" ? { isActive: true } : statusFilter === "inactivos" ? { isActive: false } : {},
      ],
    },
    orderBy:
      sort === "stock" ? { stock: "asc" } :
      sort === "price" ? { adjustedSalePriceUSD: "desc" } :
      sort === "category" ? { category: { name: "asc" } } :
      sort === "createdAt" ? { createdAt: "desc" } :
      sort === "updatedAt" ? { updatedAt: "desc" } :
      { name: "asc" },
  });

  const filtered = products.filter((product) => {
    if (stockFilter === "disponibles") return product.stock > product.minStock;
    if (stockFilter === "bajo") return product.stock > 0 && product.stock <= product.minStock;
    if (stockFilter === "agotados") return product.stock === 0;
    return true;
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">Inventario</h2>
          <p className="mt-1 text-slate-400">Busca, filtra, edita stock y recalcula precios con la tasa actual.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={recalculateAllProducts}>
            <ConfirmSubmit message="Esto recalculara todos los productos usando la tasa actual.">
              <RefreshCcw size={16} /> Recalcular todos
            </ConfirmSubmit>
          </form>
          <LinkButton href="/products/barcode-new" variant="secondary"><Barcode size={16} /> Por codigo</LinkButton>
          <LinkButton href="/products/new"><Plus size={16} /> Nuevo producto</LinkButton>
        </div>
      </div>

      <Card>
        <form className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto_auto]">
          <LiveProductSearch key={q} initialValue={q} />
          <Select name="categoryId" defaultValue={categoryId}>
            <option value="">Todas las categorias</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Select name="stock" defaultValue={stockFilter}>
            <option value="todos">Todo stock</option>
            <option value="disponibles">Disponibles</option>
            <option value="bajo">Bajo stock</option>
            <option value="agotados">Agotados</option>
          </Select>
          <Select name="status" defaultValue={statusFilter}>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="todos">Todos</option>
          </Select>
          <Select name="sort" defaultValue={sort}>
            <option value="name">Nombre</option>
            <option value="category">Categoria</option>
            <option value="stock">Stock</option>
            <option value="price">Precio</option>
            <option value="createdAt">Creacion</option>
            <option value="updatedAt">Actualizacion</option>
          </Select>
          <Select name="view" defaultValue={view}>
            <option value="table">Tabla</option>
            <option value="grid">Tarjetas</option>
          </Select>
          <button className="rounded-lg bg-cyan-400 px-4 text-sm font-bold text-slate-950">Filtrar</button>
        </form>
      </Card>

      {view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <Card key={product.id}>
              <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-slate-900">
                <ProductImagePreview
                  src={product.imageUrl}
                  alt={product.name}
                  fallback={<div className="grid h-full place-items-center text-slate-500"><Grid2X2 /></div>}
                />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white">{product.name}</h3>
                  <p className="text-sm text-slate-400">{product.brand} {product.model}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <ConditionBadge condition={product.condition} />
                  <Badge tone="cyan">{product.category?.name ?? "Sin categoria"}</Badge>
                </div>
              </div>
              <div className="mt-3"><ProductBadges stock={product.stock} minStock={product.minStock} imageUrl={product.imageUrl} isActive={product.isActive} /></div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-400">Stock</span><strong className="text-right">{product.stock}</strong>
                <span className="text-slate-400">Tienda</span><strong className="text-right">{product.stockTienda}</strong>
                <span className="text-slate-400">Deposito</span><strong className="text-right">{product.stockDeposito}</strong>
                <span className="text-slate-400">Almacen ext.</span><strong className="text-right">{product.stockAlmacenExterno}</strong>
                <span className="text-slate-400">Ajustado USD</span><strong className="text-right">{formatUSD(product.adjustedSalePriceUSD)}</strong>
                <span className="text-slate-400">Precio Bs</span><strong className="text-right text-lime-200">{formatBs(product.salePriceBs)}</strong>
              </div>
              <ProductActions product={product} />
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[1160px] text-left text-[13px]">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2"><List size={15} /></th>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Condicion</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Tienda</th>
                <th className="px-3 py-2">Deposito</th>
                <th className="px-3 py-2">Almacen ext.</th>
                <th className="px-3 py-2">Precio USD</th>
                <th className="px-3 py-2">Precio Bs</th>
                <th className="px-3 py-2">Tasa usada</th>
                <th className="px-3 py-2">Actualizado</th>
                <th className="w-36 px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((product) => (
                <tr key={product.id} className="align-top">
                  <td className="px-3 py-2"><ProductBadges stock={product.stock} minStock={product.minStock} imageUrl={product.imageUrl} isActive={product.isActive} /></td>
                  <td className="px-3 py-2"><strong className="text-white">{product.name}</strong><p className="text-[11px] leading-4 text-slate-400">{product.sku ?? "Sin SKU"} {product.barcode ? `- ${product.barcode}` : ""} - {product.brand ?? ""} {product.model ?? ""}</p></td>
                  <td className="px-3 py-2"><ConditionBadge condition={product.condition} /></td>
                  <td className="px-3 py-2">{product.category?.name ?? "Sin categoria"}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold text-white">{product.stock}</td>
                  <td className="whitespace-nowrap px-3 py-2">{product.stockTienda}</td>
                  <td className="whitespace-nowrap px-3 py-2">{product.stockDeposito}</td>
                  <td className="whitespace-nowrap px-3 py-2">{product.stockAlmacenExterno}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatUSD(product.adjustedSalePriceUSD)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-lime-200">{formatBs(product.salePriceBs)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-300">BCV {product.lastBCVRate} / USDT {product.lastParallelRate}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-400">{formatDate(product.updatedAt)}</td>
                  <td className="px-3 py-2"><ProductActions product={product} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function ProductActions({
  product,
}: {
  product: {
    id: string;
    sku: string | null;
    barcode: string | null;
    name: string;
    brand: string | null;
    model: string | null;
    condition: string;
    stock: number;
    stockTienda: number;
    stockDeposito: number;
    stockAlmacenExterno: number;
    adjustedSalePriceUSD: number;
    salePriceBs: number;
    isActive: boolean;
  };
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <AddToCartButton product={product} />
      <Link
        href={`/products/${product.id}/edit`}
        className="inline-grid size-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-slate-300"
        aria-label="Editar producto"
        title="Editar producto"
      >
        <Edit size={15} />
      </Link>
      <form action={recalculateProduct.bind(null, product.id)}>
        <IconSubmit label="Recalcular precio" message="Recalcular este producto con la tasa actual." tone="cyan">
          <RefreshCcw size={15} />
        </IconSubmit>
      </form>
      <form action={deleteProduct.bind(null, product.id)}>
        <IconSubmit label="Eliminar producto" message="Eliminar este producto definitivamente?" tone="danger">
          <Trash2 size={15} />
        </IconSubmit>
      </form>
    </div>
  );
}
