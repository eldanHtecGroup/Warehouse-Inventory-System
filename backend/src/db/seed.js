import db from './index.js';
import categoryService from '../services/category.service.js';
import productService from '../services/product.service.js';

const reset = process.argv.includes('--reset');

const categories = [
  { name: 'Beverages', description: 'Soft drinks, juices, water, coffee and tea' },
  { name: 'Snacks', description: 'Chips, cookies, nuts and confectionery' },
  { name: 'Household', description: 'Cleaning supplies and home essentials' },
];

const products = [
  { category: 'Beverages', name: 'Sparkling Water 1.5L', code: 'BEV-001', price: 0.99, quantity: 120 },
  { category: 'Beverages', name: 'Orange Juice 1L', code: 'BEV-002', price: 2.49, quantity: 60 },
  { category: 'Beverages', name: 'Ground Coffee 500g', code: 'BEV-003', price: 7.99, quantity: 35 },
  { category: 'Beverages', name: 'Green Tea (20 bags)', code: 'BEV-004', price: 3.29, quantity: 0 },
  { category: 'Snacks', name: 'Salted Potato Chips 150g', code: 'SNK-001', price: 1.79, quantity: 80 },
  { category: 'Snacks', name: 'Chocolate Chip Cookies', code: 'SNK-002', price: 2.99, quantity: 45 },
  { category: 'Snacks', name: 'Mixed Nuts 200g', code: 'SNK-003', price: 4.59, quantity: 25 },
  { category: 'Household', name: 'Dish Soap 750ml', code: 'HH-001', price: 2.19, quantity: 50 },
  { category: 'Household', name: 'Paper Towels (6 rolls)', code: 'HH-002', price: 5.49, quantity: 30 },
  { category: 'Household', name: 'All-Purpose Cleaner 1L', code: 'HH-003', price: 3.89, quantity: 15 },
];

if (reset) {
  db.exec(`
    DELETE FROM stock_movements;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM sqlite_sequence;
  `);
  console.log('Database cleared.');
}

if (categoryService.getAllCategories().length > 0) {
  console.log('Database already contains data. Run "npm run db:reset" to reseed.');
} else {
  db.transaction(() => {
    const categoryIds = Object.fromEntries(
      categories.map((category) => [category.name, categoryService.createCategory(category).id]),
    );
    for (const { category, ...product } of products) {
      productService.createProduct({ ...product, categoryId: categoryIds[category] });
    }
  })();
  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

db.close();
