const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// midleware

app.use(cors());
app.use(express.json());


// mongodb




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aymctjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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


    // datbase collections
const datbase = client.db("EduTrack");
const usersCollection = datbase.collection('users')
const collegesCollection = datbase.collection('colleges')
   

    // post user data 
    app.post('/users',async(req,res)=>{
      const user =req.body;
      console.log(user);
      const query = {email:user.email}
      const isExist = await usersCollection.findOne(query)
      if(isExist) return res.send({message:'user already exist !'})
      const result = await usersCollection.insertOne(user)

      res.send(result)
    })

// google-signup
    app.post('/google-signin', async (req, res) => {
        const user = req.body;
      
        const query = { email: user.email }; 
        const isExist = await usersCollection.findOne(query);
        if (isExist) {
            return res.send({ message: 'User already exists!', status: 'login' });
        }
        const result = await usersCollection.insertOne(user);
        res.send({ message: 'SignUp successful! User saved to database.', status: 'signup', result });
    });
    
    // get all users
    app.get('/users',async(req,res)=>{
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    app.get('/colleges',async(req,res)=>{


      const result = await collegesCollection.find().toArray();
      res.send(result)
    })
  
    app.get('/colleges-6', async (req, res) => {
      try {
        const result = await collegesCollection.find().limit(6).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error fetching colleges', error: error.message });
      }
    });
    // serch college 
    app.get("/colleges", async (req, res) => {
      const searchQuery = req.query.search;
    
      const filter = searchQuery
        ? {
            $text: { $search: searchQuery },
          }
        : {};
    
      const sort = searchQuery
        ? { score: { $meta: "textScore" } } 
        : {};
    
      try {
        const result = await collegesCollection
          .find(filter)
          .project({ score: { $meta: "textScore" } })
          .sort(sort)
          .toArray();
    
        res.send(result);
      } catch (error) {
        console.error("Error fetching colleges:", error);
        res.status(500).send({ error: "Failed to fetch colleges" });
      }
    });

    // get college by id

    app.get('/colleges/:id', async (req, res) => {
      const { id } = req.params; // Get the id from the URL
      console.log('College ID:', id); // Debugging the id
    
      try {
        // Convert the string 'id' into a valid ObjectId for MongoDB
        const query = { _id: new ObjectId(id) }; 
        
        // Query the collection using the ObjectId
        const college = await collegesCollection.findOne(query);
    
        if (!college) {
          return res.status(404).send('College not found');
        }
    
        console.log('Found college:', college); // Debugging the response
    
        // Send the college data as a response
        res.json(college); 
      } catch (err) {
        console.error('Error fetching college details:', err);
        res.status(500).send('Error fetching college details');
      }
    });
    
    
    
  

    console.log("EduTrack successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   
  }
}
run().catch(console.dir);

// 


app.get( '/' ,(req,res)=>{
    res.send('soultie running');
})

app.listen(port,()=>{
    console.log(`soultie is running on:${port}`);
})