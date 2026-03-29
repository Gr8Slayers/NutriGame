import prisma from '../config/prisma';
import { ChatSession, ChatMessage } from '@prisma/client';

export const chatbotModel = {
    // 1. Yeni Oturum Oluştur
    async createSession(userId: number, title: string = "New Chat"): Promise<ChatSession> {
        return await prisma.chatSession.create({
            data: {
                userId: userId,
                title: title,
            },
        });
    },

    // 2. Mesaj Ekle 
    async addMessage(sessionId: string, role: 'user' | 'model', content: string): Promise<ChatMessage> {
        const message = await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: role,
                content: content,
            },
        });

        // Sohbeti güncellendi olarak işaretle
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
        });

        return message;
    },

    // 3. Kullanıcının Tüm Sohbetlerini Getir
    async getUserSessions(userId: number) {
        return await prisma.chatSession.findMany({
            where: { userId: userId },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    },

    // 4. Sohbetin Mesajlarını Getir
    async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
        return await prisma.chatMessage.findMany({
            where: { sessionId: sessionId },
            orderBy: { createdAt: 'asc' },
        });
    },

    // 5. Sohbeti Sil 
    async deleteSession(sessionId: string): Promise<ChatSession> {
        return await prisma.chatSession.delete({
            where: { id: sessionId },
        });
    },

    // Ekstra: Sohbet Başlığını Güncelle 
    async updateSessionTitle(sessionId: string, newTitle: string): Promise<ChatSession> {
        return await prisma.chatSession.update({
            where: { id: sessionId },
            data: { title: newTitle },
        });
    }
};