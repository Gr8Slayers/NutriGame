const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware to serve static files (e.g., uploaded images)
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('Object Detection Service is running.');
});

// Prediction endpoint
app.post('/predict', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No image file uploaded.');
    }

    const imagePath = req.file.path;
    
    // Define the path to the Python executable and the inference script.
    // This assumes a 'python' command is available in the Render environment.
    // You might need to adjust this based on Render's environment setup.
    const pythonExecutable = 'python';
    const inferenceScript = path.join(__dirname, 'inference.py');
    
    // Spawn a Python process to run the object detection script
    const pythonProcess = spawn(pythonExecutable, [inferenceScript, imagePath]);

    let predictionData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
        predictionData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
        // Clean up the uploaded file
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error(`Failed to delete uploaded file: ${imagePath}`, err);
            }
        });

        if (code !== 0) {
            console.error(`Python script exited with code ${code}`);
            console.error(errorData);
            return res.status(500).json({
                message: 'Error during object detection.',
                error: errorData
            });
        }

        try {
            const predictions = JSON.parse(predictionData);
            res.status(200).json(predictions);
        } catch (e) {
            console.error('Failed to parse prediction JSON:', e);
            res.status(500).json({
                message: 'Failed to parse prediction output from model.',
                raw_output: predictionData
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
