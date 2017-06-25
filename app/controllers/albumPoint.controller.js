import BaseController from './base.controller';
import AlbumPoint from '../models/albumPoint';
import points from '../config/points';
import * as R from 'ramda';

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
    albumPoint.value = points.values[albumPoint.action]

    albumPoint.save()
      .then((p) => {
        res.json(p);
      })
      .catch((err) => {
        res.status(400).json(this.formatApiError(err));
      });
  }
  /**
   * returns a user's own points
   * req.user is populated by middleware in routes.js
   */
  mine(req, res) {
    if (!req.currentUser) {
      return res.status(401)
    }
    AlbumPoint
      .find({ _user: req.currentUser })
      .then(points => {

        let sum = R.sum(R.map(p => p.value, points))

        let recent = R.sort((a, b) => a.createdAt >= b.createdAt, points)
                      .slice(0, req.query.limit || 10)

        res.status(200).json({ sum, recent })
      })
      .catch(err => {
        res.status(500).json(err)
      })
  }
}

export default new AlbumPointController();
