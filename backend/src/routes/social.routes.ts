import { Router } from 'express';
import { socialController } from '../controllers/social.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Post işlemleri
router.post('/create_post', authMiddleware, socialController.create_post.bind(socialController));
router.get('/get_feed', authMiddleware, socialController.get_feed.bind(socialController));
router.delete('/post/:postId', authMiddleware, socialController.delete_post.bind(socialController));
router.get('/posts/:userId', authMiddleware, socialController.get_user_posts.bind(socialController));

// Like işlemleri
router.post('/like/:postId', authMiddleware, socialController.like_post.bind(socialController));
router.delete('/like/:postId', authMiddleware, socialController.unlike_post.bind(socialController));

// Yorum işlemleri
router.post('/comment/:postId', authMiddleware, socialController.add_comment.bind(socialController));
router.get('/comments/:postId', authMiddleware, socialController.get_comments.bind(socialController));

// Takip işlemleri
router.post('/follow/:targetUserId', authMiddleware, socialController.follow_user.bind(socialController));
router.delete('/follow/:targetUserId', authMiddleware, socialController.unfollow_user.bind(socialController));

export default router;
