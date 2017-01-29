import mongoose from 'mongoose';
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
  },
   _user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

const AlbumModel = mongoose.model('Album', AlbumSchema);

export default AlbumModel;
