import express from "express"
import {GraphQLScalarType} from "graphql";
import { Kind } from "graphql";
import {makeExecutableSchema} from "graphql-tools";
import {graphqlHTTP} from "express-graphql";
import morgan from "morgan"
import buildDB from "./db.js";

const typeDefs = `
    scalar DateTime,
    enum ProductCategory {
        STYLE
        FOOD
        TECH
        SPORT
    },
    enum SortingValue {
        createdAt
        price
    },
    enum SortingOrder {
        asc
        desc
    },
    input ProductCreateInput {
        name : String!,
        description : String,
        price : Float!,
        category: ProductCategory!
    },
    input CommentCreateInput {
        title: String!,
        body: String,
        stars: Int!
    }
    type Comment {
        _id: ID!,
        title: String!,
        body: String,
        stars: Int!,
        date: DateTime!
    },
    type Product {
        _id: ID!,
        name: String!,
        createdAt: DateTime!,
        description: String,
        price: Float!,
        comments (last: Int) : [Comment],
        category: ProductCategory!,
        stars: Float
    },
    input ProductFilterInput {
        categories: [ProductCategory],
        minStars: Int,
        minPrice: Float,
        maxPrice: Float
    },
    input ProductSortInput {
        value: SortingValue!,
        order: SortingOrder!
    },
    type Query {
        products (filter: ProductFilterInput, sort: ProductSortInput) : [Product],
        product (id: ID!) : Product,
    },
    type Mutation {
        productCreate (productCreateInput: ProductCreateInput!) : Product,
        commentCreate (
            commentCreateInput: CommentCreateInput!,
            productId: ID!
        ) : Comment
    }
`

const db = await buildDB()

const resolvers = {
    Product: {
        comments: (parent, args, context, info) => {
            if (args.last === 10)
                return parent.comments
            else
                return db.Comment.findRecentCommentsByProductId(parent._id, args.last)
        }
    },
    Query: {
        product: (parent, args, context, info) => db.Product.findProductById(args.id),
        products: (parent, args, context, info) => db.Product.findAllProducts(args.filter, args.sort)
    },
    Mutation: {
        productCreate: (parent, args, context, info) => db.Product.createProduct(args.productCreateInput),
        commentCreate: (parent, args, context, info) => db.Comment.createComment(args.commentCreateInput, args.productId)
    },
    DateTime: new GraphQLScalarType({
        name: 'DateTime',
        description: 'DateTime custom scalar type',
        parseValue(value) { return new Date(value) },
        serialize(value) { return value.getTime() },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return new Date(+ast.value) // ast value is always in string format
            }
            return null
        },
    }),
}

const schema = makeExecutableSchema({typeDefs, resolvers})

const app = express()

app.use(morgan('dev'))
app.use("/graphql", graphqlHTTP({schema, graphiql: true}))

app.listen(3000)