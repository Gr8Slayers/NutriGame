import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventSource } from 'eventsource';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hugging Face Space URL
const HF_SPACE_URL = 'https://nceyda-yolo-food-det.hf.space';

/**
 * Generate random session hash
 */
function generateSessionHash() {
    return Math.random().toString(36).substring(2, 12);
}

/**
 * Generate random upload ID
 */
function generateUploadId() {
    return 'm' + Math.random().toString(36).substring(2, 12);
}

/**
 * Upload image to Gradio Space
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} filename - Original filename
 * @returns {Promise<string>} Upload path
 */
async function uploadImage(imageBuffer, filename) {
    const uploadId = generateUploadId();
    const formData = new FormData();
    formData.append('files', imageBuffer, filename);

    const response = await axios.post(
        `${HF_SPACE_URL}/gradio_api/upload?upload_id=${uploadId}`,
        formData,
        {
            headers: formData.getHeaders(),
            timeout: 30000
        }
    );

    // Response is array of uploaded file paths
    return response.data[0];
}

/**
 * Analyze food image using Hugging Face Space
 * @param {string|Buffer} imagePath - Path to image file or Buffer
 * @returns {Promise<Object>} Detection results
 */
async function analyzeFoodFromHF(imagePath) {
    try {
        console.log('Step 1: Reading image...');
        
        // Read image file
        let imageBuffer;
        let imageName = 'image.jpg';
        
        if (typeof imagePath === 'string') {
            imageBuffer = fs.readFileSync(imagePath);
            imageName = path.basename(imagePath);
        } else if (Buffer.isBuffer(imagePath)) {
            imageBuffer = imagePath;
        } else {
            throw new Error('Invalid input: must be file path or Buffer');
        }

        console.log('Step 2: Uploading image...');
        const uploadedPath = await uploadImage(imageBuffer, imageName);
        console.log('Uploaded to:', uploadedPath);

        console.log('Step 3: Joining queue...');
        const sessionHash = generateSessionHash();
        const queueResponse = await axios.post(
            `${HF_SPACE_URL}/gradio_api/queue/join?__theme=system`,
            {
                data: [{ path: uploadedPath }],
                fn_index: 2,
                session_hash: sessionHash,
                trigger_id: Math.floor(Math.random() * 100)
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );

        console.log('Queue response:', queueResponse.data);
        const eventId = queueResponse.data.event_id;

        console.log('Step 4: Waiting for results...');
        
        // Get results via Server-Sent Events
        const result = await new Promise((resolve, reject) => {
            const eventSource = new EventSource(
                `${HF_SPACE_URL}/gradio_api/queue/data?session_hash=${sessionHash}`
            );

            const timeout = setTimeout(() => {
                eventSource.close();
                reject(new Error('Timeout waiting for results'));
            }, 120000); // 2 minutes timeout

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Event:', data.msg);

                    if (data.msg === 'process_completed') {
                        clearTimeout(timeout);
                        eventSource.close();
                        resolve(data.output);
                    } else if (data.msg === 'error') {
                        clearTimeout(timeout);
                        eventSource.close();
                        reject(new Error(data.error || 'Unknown error'));
                    }
                } catch (e) {
                    console.log('Parse error:', e.message);
                }
            };

            eventSource.onerror = (error) => {
                clearTimeout(timeout);
                eventSource.close();
                reject(new Error('EventSource error: ' + error.message));
            };
        });

        console.log('Got result!');

        // Extract results
        const annotatedImage = result.data[0]; // First output is the image
        const detectionText = result.data[1]; // Second output is the text
        
        // Parse detection text to structured format
        const detections = parseDetectionText(detectionText);

        return {
            success: true,
            detections: detections,
            raw_text: detectionText,
            annotated_image: annotatedImage,
            source: 'huggingface'
        };

    } catch (error) {
        console.error('HuggingFace API Error:', error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        return {
            success: false,
            error: error.message,
            detections: []
        };
    }
}

/**
 * Parse detection text to structured format
 * @param {string} text - Detection text from API
 * @returns {Array<Object>} Structured detections
 */
function parseDetectionText(text) {
    if (!text || text === 'No objects detected') {
        return [];
    }

    const lines = text.split('\n').filter(line => line.trim().startsWith('•'));
    
    return lines.map(line => {
        // Format: "• apple: 72.3%"
        const match = line.match(/•\s*([^:]+):\s*([0-9.]+)%/);
        if (match) {
            return {
                class: match[1].trim(),
                confidence: parseFloat(match[2]) / 100
            };
        }
        return null;
    }).filter(item => item !== null);
}

/**
 * Batch analyze multiple images
 * @param {Array<string|Buffer>} images - Array of image paths or Buffers
 * @returns {Promise<Array<Object>>} Array of detection results
 */
async function analyzeBatchFromHF(images) {
    const results = [];
    
    for (let i = 0; i < images.length; i++) {
        console.log(`\nProcessing image ${i + 1}/${images.length}...`);
        const result = await analyzeFoodFromHF(images[i]);
        results.push(result);
        
        // Add small delay between requests to avoid rate limiting
        if (i < images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    return results;
}

// Export functions
export {
    analyzeFoodFromHF,
    analyzeBatchFromHF
};

// CLI usage
const isMainModule = import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || 
                     import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node hf-gradio-api.js <image_path> [image_path2] ...');
        console.log('Example: node hf-gradio-api.js test.jpg');
        process.exit(1);
    }

    (async () => {
        try {
            if (args.length === 1) {
                console.log(`\nAnalyzing ${args[0]} via Hugging Face Space...\n`);
                const result = await analyzeFoodFromHF(args[0]);
                console.log('\n=== RESULTS ===');
                console.log(JSON.stringify(result, null, 2));
            } else {
                console.log(`\nAnalyzing ${args.length} images via Hugging Face Space...\n`);
                const results = await analyzeBatchFromHF(args);
                console.log('\n=== RESULTS ===');
                console.log(JSON.stringify(results, null, 2));
            }
        } catch (error) {
            console.error('\nError:', error.message);
            process.exit(1);
        }
    })();
}
