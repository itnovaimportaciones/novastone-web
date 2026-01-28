import { readdir, mkdir, copyFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootPath = join(__dirname, '..');

async function copyProductImages() {
  const sourcePath = join(rootPath, 'product-info', 'Superficies Colores');
  const destPath = join(rootPath, 'public', 'products');
  
  try {
    // Create destination directory if it doesn't exist
    await mkdir(destPath, { recursive: true });
    
    const folders = await readdir(sourcePath, { withFileTypes: true });
    
    for (const folder of folders) {
      if (!folder.isDirectory()) continue;
      
      const folderName = folder.name;
      // Skip if folder name doesn't start with a number
      if (!/^\d+/.test(folderName)) continue;
      
      const sourceFolderPath = join(sourcePath, folderName);
      const destFolderPath = join(destPath, folderName);
      
      // Create destination folder
      await mkdir(destFolderPath, { recursive: true });
      
      // Read files in source folder
      const files = await readdir(sourceFolderPath);
      
      // Copy all image files
      for (const file of files) {
        const ext = file.toLowerCase();
        if (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png')) {
          const sourceFile = join(sourceFolderPath, file);
          const destFile = join(destFolderPath, file);
          await copyFile(sourceFile, destFile);
          console.log(`Copied: ${folderName}/${file}`);
        }
      }
    }
    
    console.log('✅ All product images copied successfully!');
  } catch (error) {
    console.error('❌ Error copying images:', error);
    process.exit(1);
  }
}

copyProductImages();
