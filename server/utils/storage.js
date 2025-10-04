const { supabase } = require('../config/supabase');
const path = require('path');

/**
 * Upload receipt file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} userId - User ID for folder organization
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{url: string, path: string}>}
 */
async function uploadReceipt(fileBuffer, fileName, userId, mimeType) {
  try {
    // Generate unique file name
    const timestamp = Date.now();
    const ext = path.extname(fileName);
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
    
    // Create file path: userId/uniqueFileName
    const filePath = `${userId}/${uniqueFileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload receipt: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      fileName: uniqueFileName,
      size: fileBuffer.length
    };
  } catch (error) {
    console.error('Upload receipt error:', error);
    throw error;
  }
}

/**
 * Delete receipt file from Supabase Storage
 * @param {string} filePath - File path in storage
 * @returns {Promise<boolean>}
 */
async function deleteReceipt(filePath) {
  try {
    const { error } = await supabase.storage
      .from('receipts')
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete receipt error:', error);
    return false;
  }
}

/**
 * Get signed URL for private receipt access
 * @param {string} filePath - File path in storage
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>}
 */
async function getSignedUrl(filePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Get signed URL error:', error);
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Get signed URL error:', error);
    throw error;
  }
}

/**
 * List all receipts for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
async function listUserReceipts(userId) {
  try {
    const { data, error } = await supabase.storage
      .from('receipts')
      .list(userId);

    if (error) {
      console.error('List receipts error:', error);
      throw new Error(`Failed to list receipts: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('List user receipts error:', error);
    throw error;
  }
}

/**
 * Get file size and metadata
 * @param {string} filePath - File path in storage
 * @returns {Promise<Object>}
 */
async function getFileMetadata(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from('receipts')
      .list(path.dirname(filePath), {
        search: path.basename(filePath)
      });

    if (error || !data || data.length === 0) {
      throw new Error('File not found');
    }

    return data[0];
  } catch (error) {
    console.error('Get file metadata error:', error);
    throw error;
  }
}

module.exports = {
  uploadReceipt,
  deleteReceipt,
  getSignedUrl,
  listUserReceipts,
  getFileMetadata
};