/**
 * Image utilities for EventVex
 * Handles image processing and validation
 */

/**
 * Validate image file
 * @param {File} file - Image file to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateImage = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    minWidth = 100,
    minHeight = 100
  } = options;

  const errors = [];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size ${Math.round(file.size / 1024 / 1024)}MB exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 * @param {File} file - Image file to resize
 * @param {Object} options - Resize options
 * @returns {Promise<File>} Resized image file
 */
export const resizeImage = (file, options = {}) => {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(resizedFile);
        },
        file.type,
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Generate thumbnail from image file
 * @param {File} file - Image file
 * @param {Object} options - Thumbnail options
 * @returns {Promise<string>} Data URL of thumbnail
 */
export const generateThumbnail = (file, options = {}) => {
  const { width = 150, height = 150, quality = 0.7 } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      // Calculate crop dimensions to maintain aspect ratio
      const aspectRatio = img.width / img.height;
      let sourceWidth = img.width;
      let sourceHeight = img.height;
      let sourceX = 0;
      let sourceY = 0;

      if (aspectRatio > 1) {
        // Landscape
        sourceWidth = img.height;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // Portrait
        sourceHeight = img.width;
        sourceY = (img.height - sourceHeight) / 2;
      }

      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, width, height
      );

      resolve(canvas.toDataURL(file.type, quality));
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Convert image to different format
 * @param {File} file - Source image file
 * @param {string} targetType - Target MIME type
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<File>} Converted image file
 */
export const convertImageFormat = (file, targetType = 'image/webp', quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, `.${targetType.split('/')[1]}`), {
            type: targetType,
            lastModified: Date.now()
          });
          resolve(convertedFile);
        },
        targetType,
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};