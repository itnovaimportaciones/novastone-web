import mammoth from 'mammoth';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootPath = join(__dirname, '..');

/**
 * Extract product name from folder name (remove numeric prefix)
 */
function extractProductName(folderName) {
  const match = folderName.match(/^\d+(.+)$/);
  if (match) {
    return match[1].trim();
  }
  return folderName.trim();
}

/**
 * Extract order number from folder name
 */
function extractOrder(folderName) {
  const match = folderName.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

/**
 * Check if image filename contains "RENDER"
 */
function isRenderImage(filename) {
  return /render/i.test(filename);
}

/**
 * Scan product folders and extract image information
 */
async function scanProductFolders() {
  const productsPath = join(rootPath, 'product-info', 'Superficies Colores');
  const folders = await readdir(productsPath, { withFileTypes: true });
  
  const products = [];
  
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    
    const folderName = folder.name;
    // Skip if folder name doesn't start with a number
    if (!/^\d+/.test(folderName)) continue;
    
    const folderPath = join(productsPath, folderName);
    const files = await readdir(folderPath);
    
    const images = files.filter(file => {
      const ext = extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    });
    
    // Separate render and non-render images
    const renderImages = images.filter(img => isRenderImage(img));
    const nonRenderImages = images.filter(img => !isRenderImage(img));
    
    // Use first non-render image as thumbnail, or first image if all are renders
    const thumbnailImage = nonRenderImages.length > 0 
      ? nonRenderImages[0] 
      : images[0];
    
    // All images for detail view
    const detailImages = images;
    
    const productName = extractProductName(folderName);
    const order = extractOrder(folderName);
    
    products.push({
      id: folderName.toLowerCase().replace(/\s+/g, '-'),
      name: productName,
      order,
      folderName,
      thumbnailImage: thumbnailImage ? `/products/${folderName}/${thumbnailImage}` : null,
      detailImages: detailImages.map(img => `/products/${folderName}/${img}`),
      renderImages: renderImages.map(img => `/products/${folderName}/${img}`),
      nonRenderImages: nonRenderImages.map(img => `/products/${folderName}/${img}`),
    });
  }
  
  // Sort by order number
  products.sort((a, b) => a.order - b.order);
  
  return products;
}

/**
 * Parse Word document and extract product information
 */
async function parseWordDocument() {
  const docPath = join(rootPath, 'product-info', 'Textos Galeria(1 - 24) - WEB NOVASTONE.docx');
  
  try {
    const result = await mammoth.extractRawText({ path: docPath });
    const text = result.value;
    
    // Split by separator (---------) to get individual products
    const sections = text.split(/[-]{3,}/).map(s => s.trim()).filter(s => s.length > 0);
    
    const productData = {};
    
    for (const section of sections) {
      const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) continue;
      
      // First line should be product name
      const productName = lines[0];
      if (!productName) continue;
      
      let description = '';
      let espesor = null;
      
      // Extract description and ESPESOR
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for ESPESOR field
        if (/espesor/i.test(line)) {
          // Extract 12mm or 20mm from the line
          const espesorMatch = line.match(/(\d+)\s*mm/i);
          if (espesorMatch) {
            espesor = `${espesorMatch[1]}mm`;
          }
        } else {
          // Accumulate description text
          description += (description ? ' ' : '') + line;
        }
      }
      
      // Normalize product name for matching (remove extra spaces, case insensitive)
      const normalizedName = productName.trim().toUpperCase().replace(/\s+/g, ' ');
      
      productData[normalizedName] = {
        name: productName.trim(),
        description: description.trim(),
        espesor: espesor || null,
      };
    }
    
    return productData;
  } catch (error) {
    console.error('Error parsing Word document:', error);
    return {};
  }
}

/**
 * Match products from folders with Word document data
 */
function matchProducts(folderProducts, wordData) {
  return folderProducts.map(product => {
    // Try to find matching product in Word doc
    const normalizedName = product.name.toUpperCase().replace(/\s+/g, ' ');
    
    // Try exact match first
    let match = wordData[normalizedName];
    
    // Try partial match if exact match fails
    if (!match) {
      const keys = Object.keys(wordData);
      const partialMatch = keys.find(key => 
        key.includes(normalizedName) || normalizedName.includes(key)
      );
      if (partialMatch) {
        match = wordData[partialMatch];
      }
    }
    
    return {
      ...product,
      description: match?.description || '',
      category: match?.espesor || null, // '12mm' or '20mm'
    };
  });
}

/**
 * Main function to generate product data
 */
async function generateProductData() {
  console.log('Scanning product folders...');
  const folderProducts = await scanProductFolders();
  console.log(`Found ${folderProducts.length} products in folders`);
  
  console.log('Parsing Word document...');
  const wordData = await parseWordDocument();
  console.log(`Found ${Object.keys(wordData).length} products in Word document`);
  
  console.log('Matching products...');
  const matchedProducts = matchProducts(folderProducts, wordData);
  
  // Count matched products
  const matchedCount = matchedProducts.filter(p => p.description || p.category).length;
  console.log(`Matched ${matchedCount} products with Word document data`);
  
  return matchedProducts;
}

// Run the script
generateProductData()
  .then(products => {
    const outputPath = join(rootPath, 'public', 'products-data.json');
    return writeFile(outputPath, JSON.stringify(products, null, 2), 'utf-8');
  })
  .then(() => {
    console.log('✅ Product data generated successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error generating product data:', error);
    process.exit(1);
  });

export { generateProductData };
