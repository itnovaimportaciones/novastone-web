/**
 * Browser-friendly function to load product data from JSON
 * This will be used in the React app
 */
export async function loadProductData() {
  try {
    const response = await fetch('/products-data.json');
    if (!response.ok) {
      throw new Error('Failed to load products data');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.products || [];
  } catch (error) {
    console.error('Error loading product data:', error);
    return [];
  }
}

/**
 * Filter products by category (12mm, 20mm, or all)
 */
export function filterProductsByCategory(products, category) {
  if (!category || category === 'all') {
    return products;
  }
  return products.filter(product => product.category === category);
}
