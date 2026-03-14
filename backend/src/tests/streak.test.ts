import request from 'supertest';
import express from 'express';
import prisma from '../config/prisma';
import gamificationRoutes from '../routes/gamification.routes';

jest.mock('../middleware/auth.middleware', () => ({
    authMiddleware: (req: any, res: any, next: any) => next()
}));

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    (req as any).user = { id: 9999 };
    next();
});

app.use('/api/gamification', gamificationRoutes);

describe('Gamification Streak Logic (FR-13) - Resolved', () => {
    const testUserId = 9999;

    beforeAll(async () => {
        await prisma.streak.deleteMany({ where: { userId: testUserId } });
        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        if (!user) {
            await prisma.user.create({
                data: {
                    id: testUserId,
                    username: 'streak_tester',
                    email: 'streak@test.com',
                    password: 'testpassword'
                }
            });
        }
    });

    afterAll(async () => {
        await prisma.streak.deleteMany({ where: { userId: testUserId } });
        await prisma.$disconnect();
    });

    it('TC-13.1: İlk log girişinde streak 1 olarak başlamalı', async () => {
        const res = await request(app)
            .post('/api/gamification/streak/update')
            .send({ userId: testUserId });

        expect(res.status).toBe(201);
        expect(res.body.data.currentStreak).toBe(1);
    });

    it('TC-13.2: Aynı gün içindeki ikinci istekte artış durdurulmalı', async () => {
        const res = await request(app)
            .post('/api/gamification/streak/update')
            .send({ userId: testUserId });

        expect(res.status).toBe(200);
        expect(res.body.data.currentStreak).toBe(1); // Hala 1 kalmalı
    });

    it('TC-13.3: 3 gün toleransı (2 gün boşluk) seriyi bozmamalı', async () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        // Kayıt zaten TC-13.1'de oluştuğu için artık update çalışacak
        await prisma.streak.update({
            where: { userId: testUserId },
            data: { lastActiveDate: twoDaysAgo, currentStreak: 1 }
        });

        const res = await request(app)
            .post('/api/gamification/streak/update')
            .send({ userId: testUserId });

        expect(res.body.data.currentStreak).toBe(2);
    });

    it('TC-13.4: 3 günden fazla (4 gün) boşlukta seri sıfırlanmalı', async () => {
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

        await prisma.streak.update({
            where: { userId: testUserId },
            data: { lastActiveDate: fourDaysAgo, currentStreak: 10 }
        });

        const res = await request(app)
            .post('/api/gamification/streak/update')
            .send({ userId: testUserId });

        expect(res.body.data.currentStreak).toBe(1);
    });
});