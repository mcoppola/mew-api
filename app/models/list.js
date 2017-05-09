import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ListSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  _albums: {
    type: [
      { type: Schema.Types.ObjectId, ref: 'Album' }
    ],
    required: true,
  },
   _user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// User + title are unique
ListSchema.index({ title: 1, _user: 1 }, { unique: true });

const ListModel = mongoose.model('List', ListSchema);

export default ListModel;
