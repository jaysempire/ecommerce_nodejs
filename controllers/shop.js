const fs = require('fs')
const path = require('path')
const PDFDOCUMENT = require('pdfkit')
const stripe = require('stripe')(process.env.STRIPE_KEY)

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product
    .countDocuments()
    .then(numProduct => {
        totalItems = numProduct;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
        res.render('shop/index', 
        {
            prods : products, 
            pageTitle : 'My Shop',
            path : '/',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems /ITEMS_PER_PAGE )
        }
    );
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
        });
}

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product
    .countDocuments()
    .then(numProduct => {
        totalItems = numProduct;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
        res.render('shop/product-list', 
        {
            prods : products, 
            pageTitle : 'All Products',
            path : '/products',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems /ITEMS_PER_PAGE )
        }
    );
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        res.render('shop/product-detail', 
            {
                product: product, 
                pageTitle: product.title,
                path: '/products'
            }
        );
    })
    .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(user => {

            const products = user.cart.items;

            let totalPrice = 0;
            products.forEach(product => {
                totalPrice += product.productId.price * product.quantity;
            });
            
            res.render('shop/cart', 
            {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products,
                totalPrice: totalPrice.toFixed(2)
            }
        );
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
  .then(product => {
    return req.user.addToCart(product);
  })
  .then(result => {
    console.log(result);
    res.redirect('/cart')
  }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

};

exports.postDeleteCart = (req, res, next) => {
    const productId = req.body.productId;
    req.user.deleteFromCart(productId)
        .then(result => {
            console.log(result);
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getCheckout = (req, res, next) => {
    let products;
    let totalPrice;
    req.user
        .populate('cart.items.productId')
        .then(user => {

            products = user.cart.items;

            totalPrice = 0;
            products.forEach(product => {
                totalPrice += product.productId.price * product.quantity;
            });
            
            return stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: products.map(p =>  {
                    return{
                        price_data: {
                            currency: 'usd',
                            unit_amount: Math.round(p.productId.price * 100),
                            product_data: {
                                name: p.productId.title,
                                description: p.productId.description,
                            }
                        },
                        quantity: p.quantity
                    }
                }),
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
            })
        })
        .then(session => {
            res.render('shop/checkout', 
            {
                path: '/check',
                pageTitle: 'Checkout',
                products: products,
                totalPrice: totalPrice.toFixed(2),
                sessionId: session.id
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(user => {

            const products = user.cart.items.map(i => {
                return {quantity: i.quantity, product: {
                    id: i.productId._id,
                    title: i.productId.title,
                    price: i.productId.price
                }};
            });

            let totalPrice = 0;
            products.forEach(product => {
                totalPrice += product.product.price * product.quantity;
            });

            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                totalPrice: totalPrice,
                products: products
            })

            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        }).then(() => {
            res.redirect('/orders')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getOrders = (req, res, next) => {
    Order.find({'user.userId': req.user._id})
    .then(orders => { 
        res.render('shop/orders',
        {
            path: '/orders',
            pageTitle: 'Your Orders',
            orders: orders
        }
    );
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId ;

    Order.findById(orderId)
    .then(order => {
        if (!order) {
            return next(new Error('No Order Found!'))
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('UNAUTHORIZED!'))
        }

        const  invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName)

        const pdfDoc = new PDFDOCUMENT({ margin: 50 });

        // headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
        'Content-Disposition',
        'inline; filename="' + invoiceName + '"'
        );

        // streams
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        /* ---------------- HEADER ---------------- */
        pdfDoc
        .fontSize(26)
        .text('INVOICE', { align: 'right' });

        pdfDoc
        .fontSize(12)
        .text('Emperors Stores', 50, 70)
        .text('support@jaysempire.com')
        .moveDown();

        pdfDoc
        .fontSize(12)
        .text(`Invoice #: ${order._id}`)
        .text(`Date: ${new Date().toLocaleDateString()}`);

        pdfDoc.moveDown(2);

        /* ---------------- TABLE HEADER ---------------- */
        const tableTop = pdfDoc.y;

        pdfDoc
        .fontSize(12)
        .text('Product', 50, tableTop)
        .text('Qty', 300, tableTop)
        .text('Price', 350, tableTop)
        .text('Total', 450, tableTop);

        pdfDoc.moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

        let position = tableTop + 30;

        /* ---------------- TABLE ROWS ---------------- */
        order.products.forEach(p => {
        const total = p.quantity * p.product.price;

        pdfDoc
            .fontSize(11)
            .text(p.product.title, 50, position)
            .text(p.quantity, 300, position)
            .text(`$${p.product.price}`, 350, position)
            .text(`$${total}`, 450, position);

        position += 20;
        });

        pdfDoc.moveDown(2);

        /* ---------------- TOTAL ---------------- */
        pdfDoc
        .moveTo(350, position)
        .lineTo(550, position)
        .stroke();

        pdfDoc
        .fontSize(14)
        .text('Grand Total:', 350, position + 10)
        .font('Helvetica-Bold')
        .text(`$${order.totalPrice}`, 450, position + 10);

        /* ---------------- FOOTER ---------------- */
        pdfDoc
        .font('Helvetica')
        .fontSize(10)
        .text(
            'Thank you for your purchase!',
            50,
            760,
            { align: 'center' }
        );

        /* ---------------- END ---------------- */
        pdfDoc.end();
        
        /* fs.readFile(invoicePath, (err, data) => {
            if (err) {
                return next(err);
            }

            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')
            res.send(data)
        }) */
    })
    .catch(err => next(err))
}