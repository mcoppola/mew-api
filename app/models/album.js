import mongoose from 'mongoose'
import AlbumPoint from './albumPoint'
import * as R from 'ramda'
import points from '../config/points'

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
    // unqiue: true,
    // sparse: true
  },
  spotifyId: {
    type: String,
    requred: false
  },
  pointsNow: { 
    type: String,
    required: false
  },
  pointsTotal: { 
    type: String,
    required: false
  },
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
})

/**
 * Album 'now' Points calculation
 */
// const pointsNow =
//   R.pipe(
//     R.filter(p => {
//       let timestamp = new Date(p.createdAt).getTime()
//       let cutoff = Date.now() - points.time.upvote
//       return timestamp >= cutoff
//     }),
//     R.pluck('value'),
//     R.sum
//   )
/**
 * Album 'now' Points calculation 2.0
 * Adds combined time values
 */
const pointsNow =
  R.pipe(
    R.filter(p => {
      let timestamp = new Date(p.createdAt).getTime()
      let cutoff = Date.now() - points.time.upvote
      return timestamp >= cutoff
    }),
    R.pluck('value'),
    R.sum
  )

// 1. 1:00pm     +1 until 2pm
// 2. 1:05pm     +1 until 2:05pm

//    * 1hr
//  
//  = 3:00pm 


/**
 * Album Methods
 */
AlbumSchema.methods = {
  getPoints() {
    return new Promise((resolve, reject) => {
      AlbumPoint
      .find({ album: this._id })
      .then(points => 
        resolve({ 
          // total points 
          pointsTotal: R.sum(R.pluck('value', points)),
          // weighted "now" points
          pointsNow: pointsNow(points)
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
