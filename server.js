require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 60 * 1024 * 1024 }, // 1 minute of audio (1MB = 1 minute approx)
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/wav') {
      cb(null, true);
    } else {
      cb(new Error('Only .mp3 or .wav format allowed!'));
    }
  }
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Endpoint to handle form submission
app.post('/send-message', upload.single('voiceMessage'), (req, res) => {
  const { name, email, textMessage } = req.body;
  const voiceMessage = req.file;

  if (!name || !email) {
    return res.status(400).send('Name and email are required.');
  }

  if (!voiceMessage && !textMessage) {
    return res.status(400).send('Either a voice message or a text message is required.');
  }

  // Create the email options object
  const mailOptions = {
    from: `${name} <${process.env.EMAIL_USER}>`,  // Show your email as the sender
    replyTo: email,  // User's email as reply-to address
    to: 'social@mousencheese.design',  // Replace with your company email
    subject: 'Message from ' + name,
    text: `You have received a new message from ${name} (${email}).\n\n` + 
          (textMessage ? `Text Message: ${textMessage}\n\n` : '') + 
          `Please find the attached voice message (if any).\n\nRegards,\nMessage API`,
    attachments: []
  };

  // Add the voice message as an attachment if provided
  if (voiceMessage) {
    mailOptions.attachments.push({
      filename: voiceMessage.originalname,
      content: voiceMessage.buffer
    });
  }

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).send('Message sent successfully!');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
