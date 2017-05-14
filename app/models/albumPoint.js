import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const AlbumPointSchema = new Schema({
  action: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true
  },
  album: { type: Schema.Types.ObjectId, ref: 'Album' },
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

const AlbumPointModel = mongoose.model('AlbumPoint', AlbumPointSchema);

export default AlbumPointModel;
