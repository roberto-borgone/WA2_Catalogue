import Product from "./domain/product.js"
import Comment from "./domain/comment.js"
import mongoose from "mongoose";

export default async function buildDB(){

    try {
        await mongoose.connect("mongodb://localhost:27017/catalogue", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })

        mongoose.connection.on('error', err => {
            console.error("Connection to MongoDB lost: \n" + err)
        })

        console.log("Connected to MongoDB")

        return {
            Product: {
                findProductById(id) {
                    return Product.findById(id)
                },
                findAllProducts(filter, sort) {

                    let filterMap = {}
                    let filters = Object.keys(filter)

                    if (filters.includes("categories"))
                        filterMap.category = {$in: filter.categories}
                    if (filters.includes("minPrice"))
                        filterMap.price = {$gte: filter.minPrice}
                    if (filters.includes("maxPrice"))
                        if (filters.includes("minPrice"))
                            filterMap.price = {$gte: filter.minPrice, $lte: filter.maxPrice}
                        else
                            filterMap.price = {$lte: filter.maxPrice}
                    if (filters.includes("minStars"))
                        filterMap.stars = {$gte: filter.minStars}

                    let products = Product.find(filterMap)

                    if (sort)
                        return products.sort([[sort.value, sort.order]])
                    else
                        return products
                },
                createProduct(productInput) {
                    return (new Product({
                        name: productInput.name,
                        createdAt: new Date(),
                        description: productInput.description,
                        price: productInput.price,
                        comments: [],
                        category: productInput.category,
                        stars: 0
                    })).save()
                }
            },
            Comment: {
                findRecentCommentsByProductId(productId, num) {
                    return Comment.find({productId: productId}).sort({date: "desc"}).limit(num)
                },
                async createComment(commentInput, productId) {
                    let newComment = await (new Comment({
                        productId: productId,
                        title: commentInput.title,
                        body: commentInput.body,
                        stars: commentInput.stars,
                        date: new Date()
                    })).save()

                    let avgStars = await Comment.aggregate()
                        .match( { productId: mongoose.Types.ObjectId(productId) } )
                        .group({
                            _id: null,
                            avgQuantity: { $avg: "$stars" }
                        })

                    avgStars = avgStars[0].avgQuantity

                    await Product.updateOne({_id: productId}, {
                        $push: {
                            comments: {
                                $each: [newComment],
                                $sort: {date: -1},
                                $slice: 10
                            }
                        },
                        $set: { stars: avgStars }
                    })

                    return newComment
                }
            },
            close: async () => await mongoose.connection.close()
        }
    }
    catch(error){
        console.error("Failed to connect with MongoDB: \n" + error)
    }
};