import mongoose from "mongoose"
import { commentSchema } from "./comment.js"

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    createdAt: { type: Date, required: true },
    description: String,
    price: { type: Number, required: true },
    comments: [commentSchema],
    category: { type: String, enum: ['STYLE', 'FOOD', 'TECH', 'SPORT'], required: true },
    stars: Number
})

export default mongoose.model('product', schema)