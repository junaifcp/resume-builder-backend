import mammoth from "mammoth";
import pdf from "pdf-parse";
import { createWorker } from "tesseract.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// We use require here because 'pdf-poppler' does not have official TypeScript
// type declarations. This avoids a TS(7016) error by implicitly typing it as 'any'.
const pdfPoppler = require("pdf-poppler");

/**
 * Extracts raw text from a file buffer (DOCX, PDF, Images).
 */
export const extractTextFromFile = async (
  file: Express.Multer.File
): Promise<string> => {
  const { buffer, mimetype } = file;
  const extension = file.originalname.split(".").pop()?.toLowerCase();

  // Create a temporary file path for processing
  const tempFilePath = path.join(
    os.tmpdir(),
    `resume-${Date.now()}-${file.originalname}`
  );

  try {
    // --- DOCX and Image sections remain unchanged ---
    if (
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === "docx"
    ) {
      console.log("Extracting text from DOCX...");
      const { value } = await mammoth.extractRawText({ buffer });
      return value.trim();
    } else if (
      [
        "image/jpeg",
        "image/png",
        "image/tiff",
        "image/bmp",
        "image/gif",
      ].includes(mimetype)
    ) {
      console.log("Extracting text from image using OCR...");
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(buffer);
      await worker.terminate();
      return text.trim();
    }
    // --- PDF Extraction Logic using pdf-poppler for OCR Fallback ---
    else if (mimetype === "application/pdf" || extension === "pdf") {
      console.log("Extracting text from PDF...");
      // First, try the fast text layer extraction
      const data = await pdf(buffer);
      if (data.text.trim()) {
        console.log("Extracted text from PDF text layer.");
        return data.text.trim();
      }

      console.log(
        "PDF text layer is empty. Falling back to OCR using pdf-poppler."
      );

      // Write the PDF buffer to a temporary file for poppler to process
      fs.writeFileSync(tempFilePath, buffer);

      // Using 'any' type for opts to dynamically add popplerPath if needed.
      const opts: any = {
        format: "png", // Convert pages to PNG images
        out_dir: os.tmpdir(), // Use the system's temp directory
        out_prefix: `resume-ocr-${Date.now()}`,
        page: null, // Process all pages
      };

      // --- FIX for macOS dynamic library error ---
      // This forces pdf-poppler to use the system-installed poppler tools from Homebrew
      // instead of its own outdated, bundled version.
      if (process.platform === "darwin") {
        // 'darwin' is the name for macOS
        // Standard Homebrew path for Apple Silicon Macs is /opt/homebrew/bin
        // Standard Homebrew path for Intel Macs is /usr/local/bin
        const brewPath = fs.existsSync("/opt/homebrew/bin")
          ? "/opt/homebrew/bin"
          : "/usr/local/bin";

        // Check if the poppler utility actually exists at the path
        if (fs.existsSync(path.join(brewPath, "pdftocairo"))) {
          console.log(
            `macOS detected. Using Homebrew poppler binaries from: ${brewPath}`
          );
          opts.popplerPath = brewPath;
        } else {
          console.warn(
            `Warning: Homebrew poppler installation not found in standard paths (${brewPath}). Using bundled version, which may cause errors.`
          );
        }
      }

      await pdfPoppler.convert(tempFilePath, opts);

      // Find the generated image files
      const imageFiles = fs
        .readdirSync(os.tmpdir())
        .filter((f) => f.startsWith(opts.out_prefix as string));

      if (imageFiles.length === 0) {
        throw new Error("pdf-poppler failed to convert any pages to images.");
      }

      console.log(`Converted PDF to ${imageFiles.length} image(s) for OCR.`);
      const worker = await createWorker("eng");
      const ocrTexts: string[] = [];

      for (const imageFile of imageFiles.sort()) {
        const imagePath = path.join(os.tmpdir(), imageFile);
        console.log(`Performing OCR on ${imagePath}...`);
        const {
          data: { text },
        } = await worker.recognize(imagePath);
        ocrTexts.push(text);
        // Clean up the temporary image file immediately after processing
        fs.unlinkSync(imagePath);
      }

      await worker.terminate();
      console.log("Finished OCR on all PDF pages.");
      return ocrTexts.join("\n").trim();
    } else {
      throw new Error(`Unsupported file type: ${mimetype || extension}`);
    }
  } catch (error) {
    console.error(`Error extracting text from ${file.originalname}:`, error);
    throw new Error(
      `Failed to extract text from file. Reason: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    // Clean up the temporary PDF file if it exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
};
