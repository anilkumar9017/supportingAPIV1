const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { exec } = require("child_process");

// ===================================
// Save File
// ===================================
async function saveFile(input, filePath) {
  if (typeof input === "string" && input.startsWith("http")) {
    const res = await axios({
      url: input,
      method: "GET",
      responseType: "arraybuffer",
    });

    fs.writeFileSync(filePath, res.data);
    return;
  }

  if (Buffer.isBuffer(input)) {
    fs.writeFileSync(filePath, input);
    return;
  }

  throw new Error("Unsupported input");
}

// ===================================
// FAST IMAGE CLARITY CHECK
// ===================================
async function checkImageClarity(imagePath) {
  // Resize small for performance
  const image = sharp(imagePath).resize(500).greyscale();

  // Check dimensions
  const metadata = await image.metadata();

  if (metadata.width < 400 || metadata.height < 400) {
    return true; // blurry
  }

  // Laplacian edge detection
  const { data } = await image
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0],
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    sumSq += data[i] * data[i];
  }

  const mean = sum / data.length;

  const variance = sumSq / data.length - mean * mean;

  //console.log("Variance:", variance);

  // Tune threshold
  return variance < 80;
}

// ===================================
// PDF CHECK
// ===================================
async function checkPdf(pdfPath, basePath) {
  await new Promise((resolve, reject) => {
    exec(
      `pdftoppm -jpeg -f 1 -singlefile "${pdfPath}" "${basePath}"`,
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });

  const imagePath = `${basePath}.jpg`;

  const blurry = await checkImageClarity(imagePath);

  cleanup([pdfPath, imagePath]);

  return blurry;
}

// ===================================
// MAIN
// ===================================
async function checkMediaBlur(mediaInput, mimeType) {
  const tempBase = path.join(__dirname, "../temp_" + Date.now());

  try {
    // ==========================
    // IMAGE
    // ==========================
    if (mimeType.startsWith("image/")) {
      const imgPath = tempBase + ".jpg";

      await saveFile(mediaInput, imgPath);

      const blurry = await checkImageClarity(imgPath);

      cleanup([imgPath]);

      return {
        isBlurry: blurry,
      };
    }

    // ==========================
    // PDF
    // ==========================
    if (mimeType === "application/pdf") {
      const pdfPath = tempBase + ".pdf";

      await saveFile(mediaInput, pdfPath);

      const blurry = await checkPdf(pdfPath, tempBase);

      return {
        isBlurry: blurry,
      };
    }

    return {
      isBlurry: false,
    };
  } catch (err) {
    console.error("Blur Error:", err.message);

    return {
      isBlurry: false,
    };
  }
}

// ===================================
// Cleanup
// ===================================
function cleanup(files) {
  for (const file of files) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}

module.exports = {
  checkMediaBlur,
};
