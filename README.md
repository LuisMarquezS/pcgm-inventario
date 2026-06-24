# PC Gamer Margarita Inventario

Web app local para inventario de una tienda gamer: productos, categorias, stock, ventas, notas de entrega, tasas BCV/Binance, calculos de precios, importacion y exportacion CSV.

## Requisitos

- Node.js 20+ recomendado
- npm

## Instalacion local

```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

Abre `http://localhost:3000`.

Si el motor local de Prisma falla al crear SQLite en Windows, puedes inicializar la base con el fallback incluido:

```bash
npm run db:init
npm run seed
npm run dev
```

## Tasas

Ve a `Tasas`, escribe la tasa BCV y Binance/USDT y pulsa `Guardar tasas manualmente`. La app no recalcula productos automaticamente: en inventario puedes recalcular un producto o todos con confirmacion.

El boton `Actualizar desde CrystoDolar` usa el endpoint interno `/api/exchange-rates/crysto-dolar`. Si CrystoDolar falla por CORS, bloqueo o 429, la app mantiene el flujo manual y muestra un mensaje amigable.

## Importar CSV

Ve a `Importar/Exportar` y sube un CSV con estas columnas:

```csv
nombre,marca,modelo,sku,barcode,categoria,condicion,estado,stockTienda,stockDeposito,stockMinimo,costoUSD,precioVentaBaseUSD
```

Hay una plantilla en `public/templates/inventario-ejemplo.csv`.

La columna `condicion` es opcional y acepta `nuevo` o `refurbished`. Si viene vacia, la app usa `Nuevo`.
La columna `estado` es opcional y acepta `activo` o `inactivo`. Si viene vacia, la app usa `activo`.
El stock total se calcula como `stockTienda + stockDeposito`.

## Agregar por codigo de barra

En `Inventario`, pulsa `Por codigo`. Escribe o escanea un UPC/EAN y la app intentara consultar UPCitemdb desde un endpoint local. Si encuentra datos, prellena el formulario; si falla o se agota el limite diario, puedes guardar el producto manualmente con el mismo codigo.

Si configuras `BARCODE_LOOKUP_API_KEY` en `.env`, la app consulta primero Barcode Lookup y usa UPCitemdb como respaldo. La key nunca debe subirse a Git.

## Exportar inventario

En `Importar/Exportar`, pulsa `Exportar CSV`. El archivo incluye stock, costos, precios calculados, tasas usadas, margen y fechas.

## Ventas y carrito

El flujo principal empieza en `Inventario`: busca el producto y pulsa el icono de carrito en la fila. El carrito global queda disponible desde la barra superior y persiste mientras navegas.

Desde el drawer del carrito puedes aumentar, reducir o quitar productos, ver totales USD/Bs, vaciar el carrito y finalizar la venta. Al confirmar, guarda la venta, guarda snapshots de los productos vendidos y descuenta stock dentro de una transaccion. Si algun producto ya no tiene stock suficiente, la venta se cancela completa y no descuenta stock parcial.

La ruta `Ventas` ahora muestra metricas e historial: ventas de hoy, semana, mes, productos vendidos y acceso a notas de entrega.

## Nota de entrega

Despues de finalizar una venta puedes abrir `Ver nota de entrega`, o ir a `Historial de ventas` y pulsar `Ver nota`. La nota incluye cliente opcional, productos, condicion, precios unitarios, subtotales y totales.

Para imprimir, usa el boton `Imprimir nota`. La vista tiene estilos de impresion para papel blanco. Es documento no fiscal.

## Scripts utiles

```bash
npm run dev
npm run build
npm run lint
npm run seed
npm run db:init
```

## Estructura

- `src/app`: rutas, acciones de servidor y endpoints internos.
- `src/components`: layout, UI y modulos visuales.
- `src/lib/pricing.ts`: formulas de precios.
- `src/lib/exchange-rate-providers`: proveedores Manual y CrystoDolar.
- `prisma/schema.prisma`: modelos SQLite.
- `prisma/seed.ts`: categorias, productos, tasa y settings iniciales.
