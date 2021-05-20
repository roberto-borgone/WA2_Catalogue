import mongoose from "mongoose"

export const commentSchema = new mongoose.Schema({
    productId: { type: mongoose.Types.ObjectId, required: true }, // foreign key
    title: { type: String, required: true },
    body: String,
    stars: { type: Number, required: true },
    date: { type: Date, required: true }
})

export default mongoose.model('comment', commentSchema)