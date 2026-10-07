import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'node:url';

export const swaggerSpec = swaggerJsdoc({
  failOnErrors: true,
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Products CRUD API',
      version: '2.0.0',
      description: 'Products API built with Node.js and Express. Data is held in memory and resets when the server restarts.',
    },
    servers: [{ url: '/', description: 'Current server (works in Codespaces)' }],
    tags: [{ name: 'Products', description: 'Manage products' }],
    components: {
      schemas: {
        ProductInput: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'price'],
          properties: {
            name: { type: 'string', minLength: 1, example: 'Wireless keyboard' },
            price: { type: 'number', minimum: 0, example: 1290 },
            stock: { type: 'integer', minimum: 0, default: 0, example: 25 },
            category: { type: 'string', enum: ['electronics', 'books', 'fashion'], example: 'electronics' },
          },
        },
        ProductPatch: {
          type: 'object',
          additionalProperties: false,
          minProperties: 1,
          properties: {
            name: { type: 'string', minLength: 1 },
            price: { type: 'number', minimum: 0 },
            stock: { type: 'integer', minimum: 0 },
            category: { type: 'string', enum: ['electronics', 'books', 'fashion'] },
          },
          example: { price: 990, stock: 40 },
        },
        Product: {
          type: 'object',
          required: ['id', 'name', 'price', 'stock', 'createdAt'],
          properties: {
            id: { type: 'integer', readOnly: true, example: 1 },
            name: { type: 'string', example: 'Wireless keyboard' },
            price: { type: 'number', example: 1290 },
            stock: { type: 'integer', example: 25 },
            category: { type: 'string', enum: ['electronics', 'books', 'fashion'], example: 'electronics' },
            createdAt: { type: 'string', format: 'date-time', readOnly: true },
          },
        },
        ProductList: {
          type: 'object',
          required: ['data', 'page', 'limit', 'total'],
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 2 },
          },
        },
        Error: { type: 'object', required: ['error'], properties: { error: { type: 'string', example: 'ไม่พบสินค้า' } } },
      },
      parameters: {
        ProductId: { in: 'path', name: 'id', required: true, schema: { type: 'integer', minimum: 1 }, description: 'Product ID' },
      },
      responses: {
        BadRequest: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        NotFound: { description: 'Product not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },
  apis: [fileURLToPath(new URL('../routes/products.js', import.meta.url))],
});
