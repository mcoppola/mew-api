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
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
})

/**
 * Album 'now' Points calculation
 */
const pointsNow =
  R.pipe(
    R.filter(p => {
      let timestamp = new Date(p.createdAt)
      let cutoff = Date.now() - points.time.upvote
      return timestamp.getTime() >= cutoff
    }),
    R.pluck('value'),
    R.sum
  )

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


const AlbumModel = mongoose.model('Album', AlbumSchema)

export default AlbumModel;
