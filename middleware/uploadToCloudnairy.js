import cloudinary from "cloudinary";
import { AppError } from "../utilits/AppError.js";
import convertToWebp from "../utilits/convertToWebp/convertToWebp.js";

cloudinary.config({
  cloud_name: "dt63l0xqq",
  api_key: "736351833831431",
  api_secret: "Dm_JG-zQcAmBf0WRL4WME0PWm0U",
});

export const saveImg = async (req, res, next) => {
  function uploadToCloudinary(buffer, folderName) {

    return new Promise((resolve, reject) => {
      cloudinary.v2.uploader
        .upload_stream({ folder: "candidates" }, (error, result) => {
          if (error) {
            reject(
              new AppError(
                `Error uploading to Cloudinary: ${error.message}`,
                500
              )
            );
          } else {
            resolve({ url: result.url, public_id: result.public_id });
          }
        })
        .end(buffer);
    });
  }

  function getFolderName() {
    let folderNameParts = req.baseUrl.split("");
    folderNameParts.shift();
    folderNameParts.push("s");
    return folderNameParts.join("");
  }

  async function uploadSingleFile(fieldName, buffer) {
    return await handleFileUpload(fieldName, buffer);
  }

  async function uploadMultipleFiles(fieldName, files) {
    const uploadedFiles = [];
    for (const file of files) {
      const result = await handleFileUpload(fieldName, file.buffer);
      uploadedFiles.push(result);
    }
    return uploadedFiles;
  }

  async function handleFileUpload(fieldName, buffer) {
    const folder = getFolderName();
    const convertedBuffer = await convertToWebp(buffer);
    return await uploadToCloudinary(convertedBuffer, folder);
  }

  if (req.files) {
    for (const fieldName in req.files) {
      const files = req.files[fieldName];
      if (files.length === 1) {
        req.body[fieldName] = await uploadSingleFile(
          fieldName,
          files[0].buffer
        );
      } else {
        req.body[fieldName] = await uploadMultipleFiles(fieldName, files);
      }
    }
  } else {
    req.body[req.file?.fieldname] = await handleFileUpload(
      getFolderName(),
      req.file?.buffer
    );
  }

  next();
};
