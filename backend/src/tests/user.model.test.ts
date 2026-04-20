const deleteManyPostComment = jest.fn().mockResolvedValue({ count: 1 });
const deleteManyPostLike = jest.fn().mockResolvedValue({ count: 1 });
const deleteManyUserFollow = jest.fn().mockResolvedValue({ count: 2 });
const deleteManyChallengeParticipant = jest.fn().mockResolvedValue({ count: 1 });
const deleteManyUserBadge = jest.fn().mockResolvedValue({ count: 1 });
const deleteManyMealLog = jest.fn().mockResolvedValue({ count: 1 });
const deleteManyMealTotals = jest.fn().mockResolvedValue({ count: 1 });
const deleteManyWaterLog = jest.fn().mockResolvedValue({ count: 1 });
const deleteManyChallenge = jest.fn().mockResolvedValue({ count: 1 });
const deleteManyPost = jest.fn().mockResolvedValue({ count: 1 });
const deleteUser = jest.fn().mockResolvedValue({ id: 42 });

const txMock = {
    postComment: { deleteMany: deleteManyPostComment },
    postLike: { deleteMany: deleteManyPostLike },
    userFollow: { deleteMany: deleteManyUserFollow },
    challengeParticipant: { deleteMany: deleteManyChallengeParticipant },
    userBadge: { deleteMany: deleteManyUserBadge },
    mealLog: { deleteMany: deleteManyMealLog },
    mealTotals: { deleteMany: deleteManyMealTotals },
    waterLog: { deleteMany: deleteManyWaterLog },
    challenge: { deleteMany: deleteManyChallenge },
    post: { deleteMany: deleteManyPost },
    user: { delete: deleteUser },
};

const prismaMock = {
    $transaction: jest.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock)),
};

jest.mock('../config/prisma', () => ({
    __esModule: true,
    default: prismaMock,
}));

import { userModel } from '../models/user.model';

describe('user.model deleteUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('removes user-owned and user-referencing records in a single transaction before deleting the user', async () => {
        const result = await userModel.deleteUser(42);

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

        expect(deleteManyPostComment).toHaveBeenCalledWith({ where: { userId: 42 } });
        expect(deleteManyPostLike).toHaveBeenCalledWith({ where: { userId: 42 } });
        expect(deleteManyUserFollow).toHaveBeenCalledWith({
            where: {
                OR: [
                    { followerId: 42 },
                    { followingId: 42 },
                ],
            },
        });
        expect(deleteManyChallengeParticipant).toHaveBeenCalledWith({ where: { userId: 42 } });
        expect(deleteManyUserBadge).toHaveBeenCalledWith({ where: { userId: 42 } });
        expect(deleteManyMealLog).toHaveBeenCalledWith({ where: { userId: 42 } });
        expect(deleteManyMealTotals).toHaveBeenCalledWith({ where: { userId: 42 } });
        expect(deleteManyWaterLog).toHaveBeenCalledWith({ where: { userId: 42 } });
        expect(deleteManyChallenge).toHaveBeenCalledWith({ where: { creatorId: 42 } });
        expect(deleteManyPost).toHaveBeenCalledWith({ where: { userId: 42 } });
        expect(deleteUser).toHaveBeenCalledWith({ where: { id: 42 } });
        expect(result).toEqual({ id: 42 });
    });
});
