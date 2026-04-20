import { Request, Response, NextFunction } from 'express';
import { socialModel } from '../models/social.model';
import { notificationService } from '../services/notification.service';
import prisma from '../config/prisma';

export class SocialController {

    // POST /api/social/create_post
    async create_post(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { caption, imageUrl, isRecipe, recipeDetails, challengeId } = req.body;

            if (isRecipe && (!recipeDetails?.title || !recipeDetails?.ingredients || !recipeDetails?.instructions || !recipeDetails?.calories)) {
                return res.status(400).json({ success: false, message: 'Tarif postu için title, ingredients, instructions ve calories zorunludur.' });
            }

            let parsedChallengeId: number | undefined;
            if (challengeId !== undefined && challengeId !== null && challengeId !== '') {
                parsedChallengeId = Number(challengeId);
                if (isNaN(parsedChallengeId)) {
                    return res.status(400).json({ success: false, message: 'Geçersiz challengeId.' });
                }

                const isParticipant = await socialModel.isChallengeParticipant(parsedChallengeId, userId);
                if (!isParticipant) {
                    return res.status(403).json({ success: false, message: 'Bu challenge\'a post ekleme yetkiniz yok.' });
                }

                const hasContent = (caption && String(caption).trim().length > 0) || imageUrl;
                if (!hasContent) {
                    return res.status(400).json({ success: false, message: 'Post için metin veya görsel gerekli.' });
                }
            }

            const post = await socialModel.createPost(
                userId,
                caption ?? '',
                imageUrl,
                Boolean(isRecipe),
                recipeDetails?.title,
                recipeDetails?.ingredients,
                recipeDetails?.instructions,
                recipeDetails?.calories ? Number(recipeDetails.calories) : undefined,
                recipeDetails?.preparationTime ? Number(recipeDetails.preparationTime) : undefined,
                parsedChallengeId,
            );

            if (parsedChallengeId) {
                const [author, challenge, participants] = await Promise.all([
                    prisma.user.findUnique({ where: { id: userId }, select: { username: true } }),
                    prisma.challenge.findUnique({ where: { id: parsedChallengeId }, select: { title: true } }),
                    prisma.challengeParticipant.findMany({
                        where: { challengeId: parsedChallengeId, status: 'accepted', userId: { not: userId } },
                        select: { userId: true },
                    }),
                ]);

                const authorName = author?.username ?? 'Someone';
                const challengeTitle = challenge?.title ?? 'the challenge';

                await Promise.all(participants.map(p =>
                    notificationService.sendPushNotification(
                        p.userId,
                        'New Challenge Post',
                        `${authorName} shared a new post in "${challengeTitle}".`
                    )
                ));
            }

            return res.status(201).json({ success: true, message: 'Post oluşturuldu.', data: post });

        } catch (err) {
            next(err);
        }
    }

    // GET /api/social/challenge_feed/:challengeId
    async get_challenge_feed(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const challengeId = parseInt(req.params.challengeId);

            if (isNaN(challengeId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz challengeId.' });
            }

            const isParticipant = await socialModel.isChallengeParticipant(challengeId, userId);
            if (!isParticipant) {
                return res.status(403).json({ success: false, message: 'Bu challenge\'ı görüntüleme yetkiniz yok.' });
            }

            const posts = await socialModel.getChallengePosts(challengeId, userId);
            return res.status(200).json({ success: true, data: posts });

        } catch (err) {
            next(err);
        }
    }

    // GET /api/social/get_feed
    async get_feed(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const feed = await socialModel.getFeed(userId);
            return res.status(200).json(feed);
        } catch (err) {
            next(err);
        }
    }

    // POST /api/social/like/:postId
    async like_post(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const postId = parseInt(req.params.postId);

            if (isNaN(postId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz postId.' });
            }

            const post = await socialModel.findPost(postId);
            if (!post) {
                return res.status(404).json({ success: false, message: 'Post bulunamadı.' });
            }

            await socialModel.addLike(postId, userId);

            if (post.userId !== userId) {
                const liker = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
                const likerName = liker?.username ?? 'Someone';
                notificationService.sendPushNotification(
                    post.userId,
                    'New Like ❤️',
                    `${likerName} liked your post.`
                ).catch(err => console.error('[like_post] notification error:', err));
            }

            return res.status(200).json({ success: true, message: 'Beğeni eklendi.' });

        } catch (err) {
            next(err);
        }
    }

    // DELETE /api/social/like/:postId
    async unlike_post(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const postId = parseInt(req.params.postId);

            if (isNaN(postId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz postId.' });
            }

            await socialModel.removeLike(postId, userId);
            return res.status(200).json({ success: true, message: 'Beğeni kaldırıldı.' });

        } catch (err) {
            next(err);
        }
    }

    // POST /api/social/comment/:postId
    async add_comment(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const postId = parseInt(req.params.postId);
            const { text } = req.body;

            if (isNaN(postId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz postId.' });
            }

            if (!text || String(text).trim().length === 0) {
                return res.status(400).json({ success: false, message: 'Yorum metni boş olamaz.' });
            }

            const post = await socialModel.findPost(postId);
            if (!post) {
                return res.status(404).json({ success: false, message: 'Post bulunamadı.' });
            }

            const comment = await socialModel.addComment(postId, userId, String(text).trim());

            if (post.userId !== userId) {
                const commenter = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
                const commenterName = commenter?.username ?? 'Someone';
                const preview = String(text).trim().slice(0, 60);
                notificationService.sendPushNotification(
                    post.userId,
                    'New Comment 💬',
                    `${commenterName}: ${preview}`
                ).catch(err => console.error('[add_comment] notification error:', err));
            }

            return res.status(201).json({ success: true, message: 'Yorum eklendi.', data: comment });

        } catch (err) {
            next(err);
        }
    }

    // GET /api/social/comments/:postId
    async get_comments(req: Request, res: Response, next: NextFunction) {
        try {
            const postId = parseInt(req.params.postId);

            if (isNaN(postId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz postId.' });
            }

            const comments = await socialModel.getComments(postId);
            return res.status(200).json({ success: true, data: comments });

        } catch (err) {
            next(err);
        }
    }

    // POST /api/social/follow/:targetUserId
    async follow_user(req: Request, res: Response, next: NextFunction) {
        try {
            const followerId = req.user!.id;
            const followingId = parseInt(req.params.targetUserId);

            if (isNaN(followingId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz kullanıcı ID.' });
            }

            if (followerId === followingId) {
                return res.status(400).json({ success: false, message: 'Kendinizi takip edemezsiniz.' });
            }

            await socialModel.followUser(followerId, followingId);
            
            // Push Notification
            const followerInfo = await prisma.user.findUnique({ where: { id: followerId }});
            if (followerInfo) {
                await notificationService.sendPushNotification(followingId, "Yeni Takipçi!", `${followerInfo.username} seni takip etmeye başladı.`);
            }

            return res.status(200).json({ success: true, message: 'Kullanıcı takip edildi.' });

        } catch (err) {
            next(err);
        }
    }

    // DELETE /api/social/follow/:targetUserId
    async unfollow_user(req: Request, res: Response, next: NextFunction) {
        try {
            const followerId = req.user!.id;
            const followingId = parseInt(req.params.targetUserId);

            if (isNaN(followingId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz kullanıcı ID.' });
            }

            await socialModel.unfollowUser(followerId, followingId);
            return res.status(200).json({ success: true, message: 'Takipten çıkıldı.' });

        } catch (err) {
            next(err);
        }
    }

    // GET /api/social/posts/:userId
    async get_user_posts(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUserId = req.user!.id;
            const targetUserId = parseInt(req.params.userId);

            if (isNaN(targetUserId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz kullanıcı ID.' });
            }

            const posts = await socialModel.getUserPosts(targetUserId, currentUserId);
            return res.status(200).json({ success: true, data: posts });

        } catch (err) {
            next(err);
        }
    }

    // DELETE /api/social/post/:postId
    async delete_post(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const postId = parseInt(req.params.postId);

            if (isNaN(postId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz postId.' });
            }

            const result = await socialModel.deletePost(postId, userId);
            if (!result.success) {
                return res.status(403).json({ success: false, message: result.message });
            }

            return res.status(200).json({ success: true, message: 'Post silindi.' });

        } catch (err) {
            next(err);
        }
    }

    // GET /api/social/followers/:userId
    async get_followers(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz kullanıcı ID.' });
            }

            const followers = await socialModel.getFollowers(userId);
            return res.status(200).json({ success: true, data: followers });
        } catch (err) {
            next(err);
        }
    }

    // GET /api/social/following/:userId
    async get_following(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({ success: false, message: 'Geçersiz kullanıcı ID.' });
            }

            const following = await socialModel.getFollowing(userId);
            return res.status(200).json({ success: true, data: following });
        } catch (err) {
            next(err);
        }
    }
}

export const socialController = new SocialController();
