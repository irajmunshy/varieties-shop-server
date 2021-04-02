const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
// const serviceAccount = require(`'${process.env.key}'`);
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
require('dotenv').config()

const app = express()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xrnpv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Hello World!');
})

admin.initializeApp({
  credential: admin.credential.cert(`${process.env.key}`)
});

client.connect(err => {
    const productsCollection = client.db("freshShop").collection("products");
    const ordersCollection = client.db("freshShop").collection("orders");

    // products get with home
    app.get('/products', (req, res) => {
        productsCollection.find({})
        .toArray((err, document) => {
            res.send(document);
        })
    })

    // search product get with home
    app.get('/searchProducts/:name', (req, res) => {
        productsCollection.find({name:req.params.name})
        .toArray((err, document) => {
            res.send(document);
        })
    })

    // product get with checkOut
    app.get('/product/:id', (req, res) => {
        productsCollection.find({_id: ObjectId(req.params.id)})
        .toArray((err, document) => {
            res.send(document[0]);
        })
    })

    // product post with addProduct
    app.post('/addProduct', (req, res) => {
        const newProduct = req.body;
        productsCollection.insertOne(newProduct)
        .then(result => {
            res.send(result.insertedCount > 0);
        })
    })

    // product delete with manageProduct
    app.delete('/delete/:id', (req, res) => {
        productsCollection.deleteOne({_id: ObjectId(req.params.id)})
        .then(result => {
            res.send(result.deletedCount > 0);
        })
    })

    // product update with productUpdate
    app.patch('/update/:id', (req, res) => {
        productsCollection.updateOne(
            {_id: ObjectId(req.params.id)},
            { $set: {
                    name: req.body.name,
                    price: req.body.price,
                    wight: req.body.wight,
                    image: req.body.image
                }
            }
        )
        .then(result => {
            console.log(result);
        })
    })

    //product add with checkOut
    app.post('/addOrder', (req, res) => {
        const newOrder = req.body;
        console.log(newOrder)
        ordersCollection.insertOne(newOrder)
        .then(result => {
            res.send(result.insertedCount > 0);
        })
    }) 

    // product get with order
    app.get('/orders', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];

            admin.auth().verifyIdToken(idToken)
            .then((decodedToken) => {
                const tokenEmail = decodedToken.email;
                const queryEmail = req.query.email;
                if (tokenEmail == queryEmail) {
                    ordersCollection.find({email: queryEmail})
                    .toArray((error, document) => {
                        res.send(document);
                    })
                } else {
                    res.status(401).send("Un-Authorization Access");
                }
            })
            .catch((err) => {
                res.status(401).send("Un-Authorization Access");
            })
        } else {
            res.status(401).send("Un-Authorization Access");
        }
    })

    // product delete with ordersDetail
    app.delete('/deleteProduct/:id', (req, res) => {
        ordersCollection.deleteOne({_id: ObjectId(req.params.id)})
        .then(result => {
            res.send(result.deletedCount > 0);
        })
    })

    // product delete with orders
    app.delete('/deleteOrders', (req, res) => {
        ordersCollection.deleteMany({})
        .then(result => {
            res.send(result.deletedCount > 0);
        })
    })



  //   client.close();
});


app.listen(process.env.PORT || 9000);