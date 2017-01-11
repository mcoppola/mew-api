import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ListSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  albums: {
    type: [String],
    required: true,
  },
   _user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

const ListModel = mongoose.model('List', ListSchema);

export default ListModel;
