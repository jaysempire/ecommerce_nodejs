const mongoose = require('mongoose');

const Product = require('../models/product');
const fileHelper = require('../util/file')

const { validationResult } = require('express-validator');

exports.getAddProduct = (req, res, next) => {
    
    res.render('admin/edit-product',
        {
            pageTitle : 'Add Products', 
            path : 'admin/add-product',
            editing: false,
            hasError: null,
            errorMessage: null,
            validationErrors: [],

    });
}

exports.postAddProduct = (req, res, next) => {
    
    const title = req.body.title;
    const img = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);

    if (!img) {
        return res.status(422).render('admin/edit-product',
        {
            pageTitle : 'Add Products', 
            path : 'admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: 'File type not supported or Invalid Image',
            validationErrors: []
        });
    }
    
    if (!errors.isEmpty()) {
        
        return res.status(422).render('admin/edit-product',
        {
            pageTitle : 'Add Products', 
            path : 'admin/add-product',
            editing: false,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            hasError: true,
            validationErrors: errors.array()
        });
    }

    const imgUrl = img.path;

    const product = new Product({title: title, price: price, description: description, imgUrl: imgUrl, userId: req.user});
    product
    .save()
    .then(result => {
        console.log('Created Product');
        res.redirect('/admin/products')
    }).catch(err => {
        // return res.status(500).render('admin/edit-product', {
        //   pageTitle: 'Add Product',
        //   path: '/admin/add-product',
        //   editing: false,
        //   hasError: true,
        //   product: {
        //     title: title,
        //     imageUrl: imgUrl,
        //     price: price,
        //     description: description
        //   },
        //   errorMessage: 'Database operation failed, please try again.',
        //   validationErrors: []
        // });
        //res.redirect('/500');
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}


exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    let message = req.flash('error');
    if (message.length > 0) {
       message = message[0];
    }else{
        message = null;
    }
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        res.render('admin/edit-product',
        {
            pageTitle : 'edit Products', 
            path : 'admin/edit-product',
            editing: editMode,
            product: product,
            hasError: null,
            errorMessage: message,
            validationErrors: []
        }
        );
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedtitle = req.body.title;
    const img = req.file;
    const updatedprice = req.body.price;
    const updatedDescription = req.body.description;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        
        return res.status(422).render('admin/edit-product',
        {
            pageTitle : 'Edit Products', 
            path : 'admin/edit-product',
            editing: true,
            product: {
                title: updatedtitle,
                price: updatedprice,
                description: updatedDescription,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            hasError: true,
            validationErrors: errors.array()
        });
    }

    Product.findById(prodId)

    .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/')
            }
            product.title = updatedtitle;
            product.price = updatedprice;
            product.description = updatedDescription;
            if (img) {
                fileHelper.deleteFile(product.imgUrl)
                product.imgUrl = img.path
            }
            product.save().then(result => {
            console.log("Updated Product!");
            res.redirect('/admin/products');
        }).catch(err => console.log(err));
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
    .then(product => {
        if (!product) {
            return next(new Error('Product Not Found!') ) 
        }
        fileHelper.deleteFile(product.imgUrl)
        return Product.deleteOne({_id: prodId, userId: req.user._id})
    })
    .then(() => {
        console.log('DESTROYED PRODUCT');
        res.status(200).json({message: "Product Successfully deleted"});
    })
    .catch(err => {
        res.status(500).json({message: "Failed to delete Product"});
    });
}

exports.getProducts = (req, res, next) => {
    Product.find({userId: req.user._id})
    //.select('title price -_id')
    //.populate('userId', 'name')
    .then(products => {
        res.render('admin/products', {
            prods : products, 
            pageTitle : 'Admin Product',
            path : '/admin/products'
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}