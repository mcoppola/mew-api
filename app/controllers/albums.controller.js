import BaseController from './base.controller';
import Album from '../models/album';
import * as R from 'ramda';

class AlbumController extends BaseController {
  constructor() {
    super();
    this.search = this.search.bind(this);
    this.fetch = this.fetch.bind(this);
    this.create = this.create.bind(this);
    this.delete = this.delete.bind(this);
  }
   // Middleware to populate album based on url param
  _populate(req, res, next) {
    Album.findById(req.params.albumId)
      .populate('_user')
      .then((album) => {
        if (!album) {
          return res.status(404).json({ message: 'Album not found.' });
        }
        req.album = album;
        next();
      })
      .catch(() => res.sendStatus(400));
  }

  getPoints (album) {
    return new Promise((resolve, reject) => {
      album.getPoints()
        .then(p => {
          album.set(p)
          return resolve(album)
        })
        .catch(reject)
    })
  }

  search = (req, res) => {
    Album
      .find(req.query.q ? JSON.parse(req.query.q) : {}, { skip: req.query.skip*10 || 0 })
      .populate({ path: '_user', select: '-album -role' })
      .then((albums) => {
        // merge albums with point sums
        Promise.all(R.map(this.getPoints, albums))
          .then( withPoints => {

            // sort and apply limit
            let topAlbums = R.reverse(
                            R.sortBy(R.prop('pointsNow'), withPoints))
                            .slice(0, req.query.limit || 10)

            res.status(200).json(topAlbums);
          })
      })
      .catch((err) => {
        res.status(500).json(this.formatApiError(err));
      });
  }

  /**
  * req.album is populated by middleware in routes.js
   */

  fetch(req, res) {
    res.json(req.album);
  }

  /**
   * req.user is populated by middleware in routes.js
   */

  create(req, res) {
    const album = new Album(req.body);
    album._user = req.currentUser._id;
    album.save()
      .then((p) => {
        res.json(p);
      })
      .catch((err) => {
        res.status(400).json(this.formatApiError(err));
      });
  }


  delete(req, res) {
    // toString is necessary to convert ObjectIDs to normal Strings
    if (req.album._user.toString() === req.currentUser._id.toString()) {
      req.album.remove()
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

export default new AlbumController();
