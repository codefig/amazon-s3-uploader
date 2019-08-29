const express = require("express");
const multer = require("multer");
const aws = require("aws-sdk");
const cors = require("cors");
const bodyparser = require("body-parser");
const fileType = require("file-type");
const fs = require("fs");
const path = require("path");
const multerS3 = require("multer-s3");

aws.config.update({
  secretAccessKey: process.env.SECRET_KEY,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION
});
var app = express();
var s3 = new aws.S3();

// app.use(cors);
app.use(bodyparser.json());

const storage_local = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, callback) => {
    callback(null, Date.now() + "_blend_interactive-" + file.originalname);
  }
});

var storage_s3 = multerS3({
  s3: s3,
  bucket: "moshood-bucket",
  key: function(req, file, cb) {
    console.log(file);
    console.log("File is uploaded ");
    cb(null, Date.now() + "-" + file.originalname); //use Date.now() for unique file keys
  }
});
// var upload_s3 = multer({});

let fileFilter = function(req, file, cb) {
  var allowedMimes = ["image/jpeg", "image/pjpeg", "image/png"];

  let fileExts = [".png", ".jpg", ".jpeg", ".gif"];
  var isAllowedExt = fileExts.includes(
    path.extname(file.originalname).toLowerCase()
  );
  console.log("Ext:  " + path.extname(file.originalname).toLowerCase());
  console.log("result : " + isAllowedExt);
  if (isAllowedExt) {
    cb(null, true);
  } else {
    cb(
      {
        success: false,
        message: "Invalid file type. Only jpg, png image files are allowed."
      },
      false
    );
  }
};

const storageRule = {
  storage: storage_s3, //change this to storage_local if you want to use localStorage
  limits: {
    fileSize: 2 * 1024 * 1024 //2MB
  },
  fileFilter: fileFilter
};
const upload = multer(storageRule).single("file");

let fileUpload = (req, res, next) => {
  upload(req, res, function(error) {
    if (error) {
      if (error.code == "LIMIT_FILE_SIZE") {
        console.log("File size error ");
        let message = "File Size is too large. Allowed fil size is 200KB";
        let success = false;
        res.status(500).send({ success: success, message: message });
      } else {
        console.log("Not file size error");
        console.log(error);
        res.status(500).send(error);
      }
    } else {
      if (!req.file) {
        res.status(500).send({
          success: false,
          message: "Please select a valid file for upload"
        });
      }
      res.status(200).send({
        success: true,
        message: "File uploaded successfully!"
      });
      console.log("Ths is the last endpoint");
    }
  });
};

app.get("/", (req, res, next) => {
  res.send("Welcome to the File upload API v1");
});

app.post("/upload/single", fileUpload);

app.listen(process.env.PORT || 4000, function(e) {
  console.log("Listening on port : 4000");
});
