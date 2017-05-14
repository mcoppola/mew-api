import mongoose from 'mongoose';
import AlbumPoint from './albumPoint';
import * as R from 'ramda';

const Schema = mongoose.Schema;

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
    required: true,
    unique: true
  },
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

/**
 * Album Methods
 */
AlbumSchema.methods = {
  getPoints() {
    return new Promise((resolve, reject) => {
      AlbumPoint
      .find({ album: this._id })
      .then(points => {
        let sum = R.sum(R.pluck('value', points))
        return resolve(sum);
      })
      .catch(reject)
    })
  }
}


const AlbumModel = mongoose.model('Album', AlbumSchema);

export default AlbumModel;
