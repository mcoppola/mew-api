import BaseController from './base.controller';
import AlbumPoint from '../models/albumPoint';
import * as R from 'ramda';

import config from '../config/points'


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
    albumPoint.value = config.points.values[albumPoint.action]

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
  /**
   * returns a user's 'now' available points
   * req.user is populated by middleware in routes.js
   */
  myDollars(req, res) {
    if (!req.currentUser) {
      return res.status(401)
    }
    AlbumPoint
      .find({ _user: req.currentUser, action: 'upvote' })
      .then(points => {

        // get spent and earned in ms
        let spent = R.sum(R.map(R.prop('value'), points)) * config.dollars.growRate

        let userCreated = new Date(req.currentUser.createdAt).getTime()
        let startDate = new Date(config.dollars.startDate).getTime() > userCreated ? new Date(config.dollars.startDate).getTime() : userCreated
        let earned = new Date().getTime() - startDate

        let dollars = config.dollars.startAmount + ((earned - spent) / config.dollars.growRate)

        res.status(200).json({ spent, earned, dollars, fn: { growRate: config.dollars.growRate, startDate, spent, startAmount: config.dollars.startAmount } })
      })
      .catch(err => {
        res.status(500).json(err)
      })
  }

}

export default new AlbumPointController();
