import mongoose from 'mongoose'
import AlbumPoint from './albumPoint'
import * as R from 'ramda'
import points from '../config/points'

import { pointsNow, pointsUsers } from '../lib/points'

const Schema = mongoose.Schema

const AlbumSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    required: true,
  },
  image: {
    type: [String],
    required: false
  },
  mbid: {
    type: String,
    required: false,
    // sparse: true
    // unqiue: true
  },
  fmUrl: {  
    type: String,
    required: false,
  },
  spotifyId: {
    type: String,
    requred: false
  },
  pointsNow: { 
    type: Number,
    required: false
  },
  pointsTotal: { 
    type: Number,
    required: false
  },
  pointsUsers: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
})



/**
 * Album Methods
 */
AlbumSchema.methods = {
  getPoints() {
    return new Promise((resolve, reject) => {
      AlbumPoint
      .find({ album: this._id })
      .populate('_user', ['username', 'profileImage'])
      .then(points => 
        resolve({ 
          // total points 
          pointsTotal: R.sum(R.pluck('value', points)),
          // weighted "now" points
          pointsNow: pointsNow(points),
          // users who have voted
          pointsUsers: pointsUsers(points)
        })
      )
      .catch(reject)
    })
  },
  getUserPoints(user) {
    return new Promise((resolve, reject) => {
      AlbumPoint
      .find({ album: this._id, _user: user })
      .populate('_user', ['username', 'profileImage'])
      .then(points =>
        resolve({ 
          // total points 
          pointsTotal: R.sum(R.pluck('value', points)),
          // weighted "now" points
          pointsNow: pointsNow(points),
          // users who have voted
          pointsUsers: pointsUsers(points)
        })
      )
      .catch(reject)
    })
  }
}

// Setting strength index to 2, makes values
// case insensitive
AlbumSchema.index({ title: 1, artist: 1 }, { strength: 2 });

const AlbumModel = mongoose.model('Album', AlbumSchema)

export default AlbumModel;
