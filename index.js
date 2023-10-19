const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.port || 5000;

// middleware
app.use(cors());
app.use(express.json());

// verify jwt middleware
const verifyJWt = (req, res, next) => {
  const authorization = req.headers.authorization;

  if(!authorization) {
    return res.status(401).send( {error: true, message: 'unauthorized access'} );
  }

  const token = authorization.split(' ')[1]; // ['bearer', token......]

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send( {error: true, message: 'unauthorized access'} );
    }

    req.decoded = decoded;
    next();
  }) 
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hrq6pyr.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      const db = client.db('LightwareDB');
      const productsCollection = db.collection('products');
      app.get('/products', async(req, res) => {
        const filter = req?.query?.id ? {_id: new ObjectId(req.query.id)} : {};
        const result = await productsCollection.find(filter).toArray();
        res.send(result);
      })

      app.get('/orders', verifyJWt, async(req, res) => {
        const decoded = req.decoded;

        if(decoded.email !== req.query?.email) {
          return res.status(403).send( {error: true, message: 'forbidden access'} );
        }

        let query = {}
        if(req.query?.email){
          query = {email: req.query.email}
        }

        // const result = await [mongodb orders fetch instruction by passing the query object]
        // res.send(result)

        res.send( {error: false, message: 'working'} ); // testing message
      })

      app.post('/products', async(req, res) => {
        const product = req.body || {};
        const result = await productsCollection.insertOne(product);
        res.send(result);
      })
      // jwt
      app.post('/jwt', (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '12h'});
        res.send({token});
      })
      app.patch('/products/:id', async(req, res) => {
        const id = req.query.id;
        const product = req.body || {};
        const result = await productsCollection.updateOne({_id: new ObjectId(id)}, {$set: product});
        res.send(result);
      })

      app.delete('/products/:id', async(req, res) => {
        const id = req.params.id;
        const result = await productsCollection.deleteOne({_id: new ObjectId(id)});
        res.send(result);
      })
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      
    }
  }
  run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Lightware Server is running");
})

app.listen(port, () => {
    console.log(`Lightware Server is Running on port: ${port}`);
})