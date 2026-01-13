const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
try {
  require('dotenv').config();
} catch (err) {
  console.warn('dotenv not found, using environment variables directly');
}

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = 'presentations';
const TEMP_DIR = '/tmp/converter';

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating temp directory:', err);
  }
}

// Convert PPTX to PDF using LibreOffice
async function convertPPTXToPDF(pptxPath, outputDir) {
  const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${pptxPath}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 120000 }); // 2 min timeout
    console.log('LibreOffice stdout:', stdout);
    if (stderr) console.log('LibreOffice stderr:', stderr);
    
    // Find the generated PDF file
    const files = await fs.readdir(outputDir);
    const pdfFile = files.find(f => f.endsWith('.pdf'));
    
    if (!pdfFile) {
      throw new Error('PDF file not generated');
    }
    
    return path.join(outputDir, pdfFile);
  } catch (error) {
    console.error('Error converting PPTX to PDF:', error);
    throw new Error(`LibreOffice conversion failed: ${error.message}`);
  }
}

// Convert PDF to PNG images using pdftoppm
async function convertPDFToPNG(pdfPath, outputDir, baseName) {
  const command = `pdftoppm -png -r 150 "${pdfPath}" "${path.join(outputDir, baseName)}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 120000 });
    console.log('pdftoppm stdout:', stdout);
    if (stderr) console.log('pdftoppm stderr:', stderr);
    
    // Get all generated PNG files
    const files = await fs.readdir(outputDir);
    const pngFiles = files.filter(f => f.startsWith(baseName) && f.endsWith('.png')).sort();
    
    if (pngFiles.length === 0) {
      throw new Error('No PNG files generated');
    }
    
    return pngFiles.map(f => path.join(outputDir, f));
  } catch (error) {
    console.error('Error converting PDF to PNG:', error);
    throw new Error(`PDF to PNG conversion failed: ${error.message}`);
  }
}

// Upload slides to Supabase Storage
async function uploadSlides(lectureId, pngPaths) {
  const slides = [];
  
  for (let i = 0; i < pngPaths.length; i++) {
    const pngPath = pngPaths[i];
    const paddedIndex = String(i + 1).padStart(3, '0');
    const storagePath = `${lectureId}/slides/${paddedIndex}.png`;
    
    try {
      const fileBuffer = await fs.readFile(pngPath);
      
      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`Error uploading slide ${i + 1}:`, uploadError);
        throw uploadError;
      }
      
      // Get image dimensions (simplified - assuming 16:9 aspect ratio at 150 DPI)
      slides.push({
        index: i + 1,
        path: storagePath,
        width: 1920,
        height: 1080
      });
      
      console.log(`Uploaded slide ${i + 1}/${pngPaths.length}`);
    } catch (error) {
      console.error(`Error processing slide ${i + 1}:`, error);
      throw error;
    }
  }
  
  return slides;
}

// Update presentation record in database
async function updatePresentationStatus(lectureId, status, slidesData = null, errorMessage = null) {
  const updates = { status };
  
  if (slidesData) {
    updates.slides_data = slidesData;
  }
  
  if (errorMessage) {
    updates.error_message = errorMessage;
  }
  
  const { error } = await supabase
    .from('presentations')
    .update(updates)
    .eq('lecture_id', lectureId);
  
  if (error) {
    console.error('Error updating presentation status:', error);
    throw error;
  }
}

// Clean up temporary files
async function cleanupTempFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    await Promise.all(files.map(f => fs.unlink(path.join(dir, f))));
    await fs.rmdir(dir);
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
}

// Main conversion endpoint
app.post('/convert', async (req, res) => {
  const { lectureId } = req.body;
  
  if (!lectureId) {
    return res.status(400).json({ error: 'lectureId is required' });
  }
  
  console.log(`Starting conversion for lecture ${lectureId}`);
  
  // Respond immediately - conversion will happen in background
  res.json({ 
    success: true, 
    message: 'Conversion started',
    lectureId 
  });
  
  // Start conversion process
  processConversion(lectureId).catch(error => {
    console.error(`Conversion failed for lecture ${lectureId}:`, error);
  });
});

async function processConversion(lectureId) {
  const workDir = path.join(TEMP_DIR, lectureId);
  
  try {
    // Create work directory
    await fs.mkdir(workDir, { recursive: true });
    
    // Download PPTX from Storage
    const sourcePath = `${lectureId}/source.pptx`;
    console.log(`Downloading ${sourcePath}...`);
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(sourcePath);
    
    if (downloadError) {
      throw new Error(`Failed to download PPTX: ${downloadError.message}`);
    }
    
    // Save PPTX to temp file
    const pptxPath = path.join(workDir, 'source.pptx');
    const arrayBuffer = await fileData.arrayBuffer();
    await fs.writeFile(pptxPath, Buffer.from(arrayBuffer));
    console.log('PPTX downloaded');
    
    // Convert PPTX to PDF
    console.log('Converting PPTX to PDF...');
    const pdfPath = await convertPPTXToPDF(pptxPath, workDir);
    console.log('PDF generated');
    
    // Convert PDF to PNG images
    console.log('Converting PDF to PNG images...');
    const pngPaths = await convertPDFToPNG(pdfPath, workDir, 'slide');
    console.log(`Generated ${pngPaths.length} slides`);
    
    // Delete old slides from Storage
    console.log('Cleaning old slides...');
    const { data: oldFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${lectureId}/slides`);
    
    if (oldFiles && oldFiles.length > 0) {
      const filesToRemove = oldFiles.map(f => `${lectureId}/slides/${f.name}`);
      await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToRemove);
    }
    
    // Upload slides to Storage
    console.log('Uploading slides to Storage...');
    const slides = await uploadSlides(lectureId, pngPaths);
    
    // Create slides data object
    const slidesData = {
      pageCount: slides.length,
      slides: slides
    };
    
    // Update presentation status to ready
    console.log('Updating presentation status...');
    await updatePresentationStatus(lectureId, 'ready', slidesData);
    
    console.log(`Conversion completed successfully for lecture ${lectureId}`);
    
  } catch (error) {
    console.error(`Conversion error for lecture ${lectureId}:`, error);
    
    // Update presentation status to error
    await updatePresentationStatus(
      lectureId, 
      'error', 
      null, 
      error.message || 'Unknown conversion error'
    );
  } finally {
    // Clean up temp files
    await cleanupTempFiles(workDir);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'presentation-converter',
    timestamp: new Date().toISOString()
  });
});

// Start server
ensureTempDir().then(() => {
  app.listen(PORT, () => {
    console.log(`Converter service running on port ${PORT}`);
    console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
    console.log(`Bucket: ${BUCKET_NAME}`);
  });
});
