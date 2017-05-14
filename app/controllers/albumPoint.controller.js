import BaseController from './base.controller';
import AlbumPoint from '../models/albumPoint';

const values = {
  'upvote': 1
}

class AlbumPointController extends BaseController {
  constructor() {
    super();
    this.create = this.create.bind(this);
  }

  /**
   * req.user is populated by middleware in routes.js
   */

  create(req, res) {
    const albumPoint = new AlbumPoint(req.body);
    albumPoint._user = req.currentUser._id;
    albumPoint.value = values[albumPoint.action]

    albumPoint.save()
      .then((p) => {
        res.json(p);
      })
      .catch((err) => {
        res.status(400).json(this.formatApiError(err));
      });
  }
}

export default new AlbumPointController();
