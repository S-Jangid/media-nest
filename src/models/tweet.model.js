import {mongoose, Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";



const tweetSchema = Schema( {
    content: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

},{timestamps: true})

tweetSchema.plugin(mongooseAggregatePaginate);

export const Tweet = mongoose.model("Tweet", commentSchema);