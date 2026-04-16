import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventSource } from 'eventsource';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HF_SPACE_URL = 'https://nceyda-yolo-food-det.hf.space';

// Internal SSE timeout – the outer CircuitBreaker in backend-integration.js
// will race this with a 10-second limit (NFR-03).
const SSE_TIMEOUT_MS = 120_000;

function generateSessionHash() {
    return Math.random().toString(36).substring(2, 12);
}

function generateUploadId() {
    return 'm' + Math.random().toString(36).substring(2, 12);
}

async function uploadImage(imageBuffer, filename) {
    const uploadId = generateUploadId();
    const formData = new FormData();
    formData.append('files', imageBuffer, filename);

    const response = await axios.post(
        `${HF_SPACE_URL}/gradio_api/upload?upload_id=${uploadId}`,
        formData,
        { headers: formData.getHeaders(), timeout: 30_000 }
    );
    return response.data[0];
}

/**
 * Parse detection text returned by app.py.
 *
 * Expected formats:
 *   "NOT_FOOD: <reason>"               → throws error with notFood flag (TC-E01)
 *   "Detected items:\n• pizza: 85.3% (~285 kcal)\nEstimated total: ~285 kcal"
 *
 * Returns { detections, totalCalories }.
 */
function parseDetectionText(text) {
    if (!text) return { detections: [], totalCalories: 0 };

    // Non-food response from app.py (TC-E01)
    if (text.startsWith('NOT_FOOD:')) {
        const reason = text.replace('NOT_FOOD:', '').trim();
        const err = new Error(reason);
        err.notFood = true;
        throw err;
    }

    const detections = [];
    let totalCalories = 0;

    for (const line of text.split('\n')) {
        // "• pizza: 85.3% (~285 kcal)"
        const detMatch = line.match(/•\s+(.+?):\s+([\d.]+)%(?:\s+\(~(\d+)\s+kcal\))?/);
        if (detMatch) {
            detections.push({
                class:             detMatch[1].trim(),
                confidence:        parseFloat(detMatch[2]) / 100,
                estimatedCalories: detMatch[3] ? parseInt(detMatch[3]) : null,
            });
        }

        // "Estimated total: ~570 kcal"
        const totalMatch = line.match(/Estimated total:\s*~(\d+)\s*kcal/);
        if (totalMatch) totalCalories = parseInt(totalMatch[1]);
    }

    return { detections, totalCalories };
}

/**
 * Analyze a food image via the Hugging Face Space.
 * Throws on failure so the CircuitBreaker in backend-integration.js can track it.
 *
 * @param {string|Buffer} imagePath
 * @returns {Promise<{success, detections, totalCalories, raw_text, annotated_image}>}
 */
async function analyzeFoodFromHF(imagePath) {
    // Read image
    let imageBuffer;
    let imageName = 'image.jpg';

    if (typeof imagePath === 'string') {
        imageBuffer = fs.readFileSync(imagePath);
        imageName   = path.basename(imagePath);
    } else if (Buffer.isBuffer(imagePath)) {
        imageBuffer = imagePath;
    } else {
        throw new Error('Invalid input: must be a file path or Buffer');
    }

    // Upload
    const uploadedPath  = await uploadImage(imageBuffer, imageName);
    const sessionHash   = generateSessionHash();

    // Join queue
    const queueResponse = await axios.post(
        `${HF_SPACE_URL}/gradio_api/queue/join?__theme=system`,
        {
            data:       [{ path: uploadedPath }],
            fn_index:   2,
            session_hash: sessionHash,
            trigger_id: Math.floor(Math.random() * 100),
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10_000 }
    );

    if (!queueResponse.data?.event_id) {
        throw new Error('Failed to join processing queue');
    }

    // Wait for SSE result
    const output = await new Promise((resolve, reject) => {
        const es = new EventSource(
            `${HF_SPACE_URL}/gradio_api/queue/data?session_hash=${sessionHash}`
        );

        const timer = setTimeout(() => {
            es.close();
            const err = new Error('Timeout waiting for AI results');
            err.code = 'ETIMEDOUT';
            reject(err);
        }, SSE_TIMEOUT_MS);

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.msg === 'process_completed') {
                    clearTimeout(timer);
                    es.close();
                    resolve(data.output);
                } else if (data.msg === 'error') {
                    clearTimeout(timer);
                    es.close();
                    reject(new Error(data.error || 'Unknown processing error'));
                }
            } catch { /* ignore parse errors on intermediate events */ }
        };

        es.onerror = (err) => {
            clearTimeout(timer);
            es.close();
            reject(new Error('EventSource connection error'));
        };
    });

    const annotatedImage = output.data[0];
    const detectionText  = output.data[1];

    // parseDetectionText throws with err.notFood = true for non-food images (TC-E01)
    const { detections, totalCalories } = parseDetectionText(detectionText);

    return {
        success:        true,
        detections,
        totalCalories,
        raw_text:       detectionText,
        annotated_image: annotatedImage,
    };
}

/**
 * Batch-analyze multiple images.
 * Adds a 2-second delay between requests to respect rate limits.
 */
async function analyzeBatchFromHF(images) {
    const results = [];
    for (let i = 0; i < images.length; i++) {
        results.push(await analyzeFoodFromHF(images[i]));
        if (i < images.length - 1) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    return results;
}

export { analyzeFoodFromHF, analyzeBatchFromHF };

// ─── CLI usage ───────────────────────────────────────────────────────────────
const isMain =
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMain) {
    const args = process.argv.slice(2);
    if (!args.length) {
        console.log('Usage: node hf-gradio-api.js <image_path> [image_path2] ...');
        process.exit(1);
    }
    (async () => {
        try {
            const result = args.length === 1
                ? await analyzeFoodFromHF(args[0])
                : await analyzeBatchFromHF(args);
            console.log(JSON.stringify(result, null, 2));
        } catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    })();
}
