import { Request, Response } from 'express';
import prisma from '../config/prisma';

export class ImageController {
    /**
     * Upload an image to the database
     */
    async upload(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        try {
            const savedImage = await prisma.uploadedFile.create({
                data: {
                    data: req.file.buffer,
                    mimetype: req.file.mimetype
                }
            });

            const imageUrl = `/api/images/${savedImage.id}`;
            return res.status(200).json({ success: true, imageUrl });
        } catch (err: any) {
            console.error('Failed to save image to DB:', err);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }

    /**
     * Serve an image from the database
     */
    async getImage(req: Request, res: Response) {
        try {
            const image = await prisma.uploadedFile.findUnique({
                where: { id: req.params.id }
            });

            if (!image) {
                return res.status(404).send('Not Found');
            }

            res.setHeader('Content-Type', image.mimetype);
            res.send(image.data);
        } catch (err) {
            console.error('Error serving image:', err);
            res.status(500).send('Internal Server Error');
        }
    }
}

export const imageController = new ImageController();
