import { Request, Response, NextFunction } from 'express';
import { socialModel } from '../models/social.model';

export class SocialController {

    // POST /api/social/create_post
    async create_post(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { caption, imageUrl, isRecipe, recipeDetails } = req.body;

            if (isRecipe && (!recipeDetails?.title || !recipeDetails?.ingredients || !recipeDetails?.instructions || !recipeDetails?.calories)) {
                return res.status(400).json({ success: false, message: 'Tarif postu için title, ingredients, instructions ve calories zorunludur.' });
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
            );

            return res.status(201).json({ success: true, message: 'Post oluşturuldu.', data: post });

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
