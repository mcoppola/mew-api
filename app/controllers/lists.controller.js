import BaseController from './base.controller';
import List from '../models/list';

class ListController extends BaseController {
  constructor() {
    super();
    this.search = this.search.bind(this);
    this.fetch = this.fetch.bind(this);
    this.create = this.create.bind(this);
    this.delete = this.delete.bind(this);
  }
   // Middleware to populate list based on url param
  _populate(req, res, next) {
    List.findById(req.params.listId)
      .populate('_user')
      .populate('_albums')
      .then((list) => {
        if (!list) {
          return res.status(404).json({ message: 'List not found.' });
        }

        req.list = list;
        next();
      })
      .catch(() => res.sendStatus(400));
  }

  search = (req, res) => {
    List
      .find({})
      .populate({ path: '_user', select: '-lists -role' })
      .populate('_albums')
      .then((lists) => {
        res.status(200).json(lists);
      })
      .catch((err) => {
        res.status(500).json(this.formatApiError(err));
      });
  }

  /**
   * req.list is populated by middleware in routes.js
   */

  fetch(req, res) {
    res.json(req.list);
  }

  /**
   * req.user is populated by middleware in routes.js
   */

  create(req, res) {
    const list = new List(req.body);
    list._user = req.currentUser._id;
    list.save()
      .then((p) => {
        res.json(p);
      })
      .catch((err) => {
        res.status(400).json(this.formatApiError(err));
      });
  }

  delete(req, res) {
    // toString is necessary to convert ObjectIDs to normal Strings
    if (req.list._user.toString() === req.currentUser._id.toString()) {
      req.list.remove()
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

export default new ListController();
