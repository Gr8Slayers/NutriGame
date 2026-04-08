// Express Request type augmentation
// req.user özelliğini tüm controller'larda kullanılabilir hale getirir

declare namespace Express {
    interface Request {
        user?: {
            id: number;
        };
        userId?: string;
    }
}
