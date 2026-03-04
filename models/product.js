const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imgUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
})

module.exports = mongoose.model('Product', productSchema);

/* const mongodb = require('mongodb');

class Product {

    constructor(title, price, description, imgUrl, id, userid){
        this.title = title;
        this.price = price;
        this.description = description;
        this.imgUrl = imgUrl;
        this.id = id ? new mongodb.ObjectId(id) : null;
        this.userid = userid
    }

    save(){
        const db = getDB();
        let dbOp;
        if (this.id) {
            dbOp = db.collection('products').updateOne({_id: this.id}, {$set: this});
        } else {
            dbOp = db.collection('products').insertOne(this);
        }
        return dbOp
        .then(result => {
            console.log(result)
        })
        .catch(err => console.log(err));
    }

    static fetchAll(){
        const db = getDB();
        return db.collection('products')
                .find()
                .toArray()
                .then(products => {
                    console.log(products)
                    return products
                })
                .catch(err => console.log(err));

    }

    static findById(prodId){
        const db = getDB();
        return db.collection('products')
                .find({_id: new mongodb.ObjectId(prodId)})
                .next()
                .then(product => {
                    console.log(product)
                    return product
                })
                .catch(err => console.log(err));

    }

    static deleteById(prodId){
        const db = getDB();
        return db.collection('products')
                .deleteOne({_id: new mongodb.ObjectId(prodId)})
                .then(result => {
                    console.log('Product Deleted');  
                }).catch(err => console.log(err));
    }
}

module.exports = Product;
 */