import React, { useState, useCallback } from 'react';
import { uploadFileToIPFS, uploadJSONToIPFS, createEventMetadata } from '../../utils/ipfs';
import { Upload, Image, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * IPFS Upload Component
 * Handles file and metadata uploads to IPFS with progress tracking
 */
const IPFSUpload = ({ 
  onUploadComplete, 
  onError, 
  acceptedTypes = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  uploadType = "file", // "file" or "metadata"
  metadata = {},
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      const errorMsg = `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadFileToIPFS(file, {
        name: file.name,
        type: uploadType,
        ...metadata
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        hash: result.hash,
        url: result.url
      });

      onUploadComplete?.(result);
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setUploading(false);
    }
  }, [maxSize, uploadType, metadata, onUploadComplete, onError]);

  const handleMetadataUpload = useCallback(async (jsonData) => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 150);

      const result = await uploadJSONToIPFS(jsonData, {
        name: metadata.name || 'metadata.json',
        type: 'metadata',
        ...metadata
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadedFile({
        name: metadata.name || 'metadata.json',
        type: 'application/json',
        hash: result.hash,
        url: result.url
      });

      onUploadComplete?.(result);
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setUploading(false);
    }
  }, [metadata, onUploadComplete, onError]);

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <Image className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  if (uploadedFile) {
    return (
      <div className={`border-2 border-green-200 bg-green-50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-800">Upload Successful!</h3>
            <p className="text-green-600">{uploadedFile.name}</p>
            <p className="text-sm text-green-500">
              IPFS Hash: {uploadedFile.hash}
            </p>
            {uploadedFile.size && (
              <p className="text-sm text-green-500">
                Size: {formatFileSize(uploadedFile.size)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <a
            href={uploadedFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            View on IPFS
          </a>
          <button
            onClick={() => {
              setUploadedFile(null);
              setUploadProgress(0);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className={`border-2 border-blue-200 bg-blue-50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-800">Uploading to IPFS...</h3>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-600 mt-1">{uploadProgress}% complete</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {uploadType === "file" ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          
          <div className="space-y-4">
            <Upload className={`w-12 h-12 mx-auto ${error ? 'text-red-400' : 'text-gray-400'}`} />
            
            <div>
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                Choose a file
              </label>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            
            <p className="text-sm text-gray-500">
              Max file size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
            
            {error && (
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => {
              if (metadata.eventData) {
                const eventMetadata = createEventMetadata(metadata.eventData, metadata.imageHash);
                handleMetadataUpload(eventMetadata);
              }
            }}
            disabled={!metadata.eventData}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Upload Event Metadata to IPFS
          </button>
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IPFSUpload;
