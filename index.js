const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.port || 5000;

// middleware
app.use(cors());
app.use(express.json());


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
        const limit = req?.query?.limit ? parseInt(req.query.limit) : 0;
        const categories = req?.query?.categories ? {
          category:  {
              "$in": req.query.categories.split(",") 
          }
      } : {};
        const result = await productsCollection.find({...filter, ...categories}).limit(limit).toArray();
        res.send(result);
      })
      app.post('/products', async(req, res) => {
        const product = req.body || {};
        const result = await productsCollection.insertOne(product);
        res.send(result);
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

      // app.get('/products-count', async(req, res) => {
      //   const count = await productsCollection.estimatedDocumentCount();
      //   console.log(count)
      //   res.send(count)
      // })

      app.get('/categories', async(req, res) => {
        const result = await productsCollection.find().project({category:true}).toArray();
        const categories = [...new Set(result.map(obj => obj.category))];
        res.send(categories)
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