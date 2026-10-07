import { Router } from 'express';

const CATEGORIES = new Set(['electronics', 'books', 'fashion']);
const FIELDS = new Set(['name', 'price', 'stock', 'category']);

function validateProduct(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'ต้องส่ง JSON object';
  const keys = Object.keys(body);
  if (partial && keys.length === 0) return 'ต้องระบุอย่างน้อยหนึ่งฟิลด์';
  if (keys.some((key) => !FIELDS.has(key))) return 'มีฟิลด์ที่ไม่รองรับ';
  if ((!partial || 'name' in body) && (typeof body.name !== 'string' || !body.name.trim())) return 'name ต้องเป็นข้อความและไม่ว่าง';
  if ((!partial || 'price' in body) && (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0)) return 'price ต้องเป็นตัวเลขที่ไม่ติดลบ';
  if ('stock' in body && (!Number.isSafeInteger(body.stock) || body.stock < 0)) return 'stock ต้องเป็นจำนวนเต็มที่ไม่ติดลบ';
  if ('category' in body && !CATEGORIES.has(body.category)) return 'category ต้องเป็น electronics, books หรือ fashion';
  return null;
}

function positiveInteger(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List products
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by name
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [electronics, books, fashion] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated products
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProductList' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   post:
 *     tags: [Products]
 *     summary: Create a product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductInput' }
 *     responses:
 *       201:
 *         description: Product created
 *         headers:
 *           Location:
 *             description: URL of the created product
 *             schema: { type: string }
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @openapi
 * /api/products/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/ProductId'
 *   get:
 *     tags: [Products]
 *     summary: Get one product
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Products]
 *     summary: Replace a product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductInput' }
 *     responses:
 *       200:
 *         description: Product replaced
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Products]
 *     summary: Update product fields
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductPatch' }
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product
 *     responses:
 *       204:
 *         description: Product deleted (no response body)
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

export function createProductRouter() {
  const router = Router();
  const createdAt = new Date().toISOString();
  const products = new Map([
    [1, { id: 1, name: 'Wireless keyboard', price: 1290, stock: 25, category: 'electronics', createdAt }],
    [2, { id: 2, name: 'Node.js book', price: 450, stock: 10, category: 'books', createdAt }],
  ]);
  let nextId = 3;

  router.get('/', (req, res) => {
    const page = req.query.page === undefined ? 1 : positiveInteger(req.query.page);
    const limit = req.query.limit === undefined ? 10 : positiveInteger(req.query.limit);
    if (!page || !limit || limit > 100 || (req.query.q !== undefined && typeof req.query.q !== 'string') ||
        (req.query.category !== undefined && !CATEGORIES.has(req.query.category))) {
      return res.status(400).json({ error: 'ค่าค้นหาหรือแบ่งหน้าไม่ถูกต้อง' });
    }
    let result = [...products.values()];
    if (req.query.q) result = result.filter((product) => product.name.toLowerCase().includes(req.query.q.toLowerCase()));
    if (req.query.category) result = result.filter((product) => product.category === req.query.category);
    res.json({ data: result.slice((page - 1) * limit, page * limit), page, limit, total: result.length });
  });

  router.post('/', (req, res) => {
    const error = validateProduct(req.body);
    if (error) return res.status(400).json({ error });
    const { name, price, stock = 0, category } = req.body;
    const product = { id: nextId++, name: name.trim(), price, stock, ...(category && { category }), createdAt: new Date().toISOString() };
    products.set(product.id, product);
    res.status(201).location(`/api/products/${product.id}`).json(product);
  });

  router.param('id', (req, res, next, value) => {
    const id = positiveInteger(value);
    if (!id) return res.status(400).json({ error: 'id ต้องเป็นจำนวนเต็มบวก' });
    req.product = products.get(id);
    if (!req.product) return res.status(404).json({ error: 'ไม่พบสินค้า' });
    next();
  });

  router.get('/:id', (req, res) => res.json(req.product));

  router.put('/:id', (req, res) => {
    const error = validateProduct(req.body);
    if (error) return res.status(400).json({ error });
    const { name, price, stock = 0, category } = req.body;
    const replacement = { id: req.product.id, name: name.trim(), price, stock, ...(category && { category }), createdAt: req.product.createdAt };
    products.set(replacement.id, replacement);
    res.json(replacement);
  });

  router.patch('/:id', (req, res) => {
    const error = validateProduct(req.body, true);
    if (error) return res.status(400).json({ error });
    const changes = { ...req.body };
    if ('name' in changes) changes.name = changes.name.trim();
    Object.assign(req.product, changes);
    res.json(req.product);
  });

  router.delete('/:id', (req, res) => {
    products.delete(req.product.id);
    res.status(204).end();
  });

  return router;
}
