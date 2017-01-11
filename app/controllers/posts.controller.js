import BaseController from './base.controller';
import Post from '../models/post';

class PostController extends BaseController {
   // Middleware to populate post based on url param
  _populate(req, res, next) {
    Post.findById(req.params.postId)
      .then((post) => {
        if (!post) {
          return res.status(404).json({ message: 'Post not found.' });
        }

        req.post = post;
        next();
      })
      .catch(() => res.sendStatus(400));
  }

  search = (req, res) => {
    Post
      .find({})
      .populate({ path: '_user', select: '-posts -role' })
      .then((posts) => {
        res.status(200).json(posts);
      })
      .catch((err) => {
        res.status(500).json(this.formatApiError(err));
      });
  }

  /**
   * req.post is populated by middleware in routes.js
   */

  fetch(req, res) {
    res.json(req.post);
  }

  /**
   * req.user is populated by middleware in routes.js
   */

  create(req, res) {
    const post = new Post(req.body);
    post._user = req.currentUser._id;
    post.save()
      .then((p) => {
        res.json(p);
      })
      .catch((err) => {
        res.status(400).json(this.formatApiError(err));
      });
  }

  delete(req, res) {
    // toString is necessary to convert ObjectIDs to normal Strings
    if (req.post._user.toString() === req.currentUser._id.toString()) {
      req.post.remove()
        .then(() => {
          res.sendStatus(204);
        })
        .catch(() => {
          res.sendStatus(500);
        });
    } else {
      res.sendStatus(403);
    }
  }
}

export default new PostController();
