import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { uploadFileToIPFS } from '../utils/ipfs';
import { validateImage, resizeImage } from '../utils/imageUtils';

const ImageUpload = ({ 
  onImageUpload, 
  onError, 
  currentImage = null,
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = "",
  placeholder = "Upload image",
  aspectRatio = "16/9" // "16/9", "1/1", "4/3", etc.
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    // Validate image
    const validation = validateImage(file, { maxSize });
    if (!validation.isValid) {
      const errorMsg = validation.errors[0];
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Resize if needed (max 1920x1080)
      const processedFile = await resizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85
      });

      // Create preview
      const previewUrl = URL.createObjectURL(processedFile);
      setPreview(previewUrl);

      try {
        // Try to upload to IPFS
        const result = await uploadFileToIPFS(processedFile, {
          name: processedFile.name,
          type: 'image'
        });
        onImageUpload?.(result);
      } catch (ipfsError) {
        console.warn('IPFS upload failed, using local preview:', ipfsError);
        // Fallback to local preview if IPFS fails
        onImageUpload?.({
          hash: null,
          url: previewUrl,
          size: processedFile.size,
          timestamp: Date.now(),
          isLocal: true
        });
      }
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [maxSize, onImageUpload, onError]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const removeImage = useCallback(() => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageUpload?.(null);
  }, [onImageUpload]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {preview ? (
        <div className="relative group">
          <div 
            className="relative overflow-hidden rounded-lg bg-gray-800"
            style={{ aspectRatio }}
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={openFileDialog}
              className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              disabled={uploading}
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={removeImage}
              className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
            dragActive
              ? 'border-blue-400 bg-blue-50/10'
              : error
              ? 'border-red-300 bg-red-50/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          style={{ aspectRatio }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            {uploading ? (
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
            ) : (
              <ImageIcon className={`w-12 h-12 mb-4 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            )}
            
            <div className="space-y-2">
              <p className="text-gray-300 font-medium">
                {uploading ? 'Uploading...' : placeholder}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop or click to select
              </p>
              <p className="text-xs text-gray-600">
                Max size: {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-400 mt-3">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;