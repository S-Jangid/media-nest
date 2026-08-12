import {mongoose, Schema} from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // Subscroiber is the user who is subscribing to another user
        ref: 'User',
        required: true
    },
    channel: {
        typer: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {timestamps: true});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

