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
const admissionsCollection = datbase.collection('admissions')
const reviewsCollection = datbase.collection('reviews')
   

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
        const result = await collegesCollection.find().limit(3).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error fetching colleges', error: error.message });
      }
    });
    // search college 
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
      const { id } = req.params;
      console.log('College ID:', id); 
    
      try {
    
        const query = { _id: new ObjectId(id) }; 
        
      
        const college = await collegesCollection.findOne(query);
    
        if (!college) {
          return res.status(404).send('College not found');
        }
    
        
    
        res.json(college); 
      } catch (err) {
        console.error('Error fetching college details:', err);
        res.status(500).send('Error fetching college details');
      }
    });
    
    // college name 
    app.get('/colleges-name', async (req, res) => {
      try {
        const result = await collegesCollection.find().toArray();
        
        const collegeNames = result.map(college => college.name);
        res.send(collegeNames);
      } catch (err) {
        res.status(500).send({ error: 'Failed to fetch colleges' });
      }
    });
    
    // save applications admissions
    app.post('/submit', async (req, res) => {
      const { name, subject, email, phone, address, dob, image, selectedCollege } = req.body;
    
      const missingFields = [];
    
      if (!name) missingFields.push('name');
      if (!subject) missingFields.push('subject');
      if (!email) missingFields.push('email');
      if (!phone) missingFields.push('phone');
      if (!address) missingFields.push('address');
      if (!dob) missingFields.push('dob');
      if (!image) missingFields.push('image');
      if (!selectedCollege) missingFields.push('selectedCollege');
    
    
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: `The following fields are missing: ${missingFields.join(', ')}. Please provide all required fields.` 
        });
      }
    
      try {
      
        const existingApplication = await admissionsCollection.findOne({
          email: email,
          phone: phone,
          selectedCollege: selectedCollege,
        });
    
        if (existingApplication) {
          return res.status(400).json({ 
            message: 'You have already applied to this college.' 
          });
        }
    
       
        const newApplication = {
          name,
          subject,
          email,
          phone,
          address,
          dob,
          image,
          selectedCollege,
          dateApplied: new Date(),
        };
    
      
        const result = await admissionsCollection.insertOne(newApplication);
    

        res.status(200).json({ 
          message: 'Application submitted successfully!', 
          applicationId: result.insertedId 
        });
      } catch (err) {
        console.error('Error submitting application:', err);
        res.status(500).json({ 
          message: 'Server error. Please try again later.' 
        });
      }
    });
    

    // get my-colleges
    app.get('/my-colleges/:userEmail', async (req, res) => {
      const { userEmail } = req.params;
    
      try {
        const userApplications = await admissionsCollection.find({ email: userEmail }).toArray();
        res.json(userApplications);
      } catch (err) {
        console.error('Error fetching user applications:', err);
        res.status(500).send('Error fetching user applications');
      }
    });
    
    // add review

    app.post('/submit-review', async (req, res) => {
      const { collegeId, review, rating, userEmail, collegeName } = req.body;
    
      // Validate the data
      if (!collegeId || !review || !rating || !userEmail || !collegeName) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
    
      try {
        // Prepare the review object
        const newReview = {
          collegeId,
          collegeName,
          review,
          rating,
          userEmail,
          date: new Date().toLocaleString(), // Add a human-readable timestamp
        };
    
        // Insert the review into the reviews collection
        const result = await reviewsCollection.insertOne(newReview);
    
        if (result.acknowledged) {
          return res
            .status(200)
            .json({ message: 'Review submitted successfully!', reviewId: result.insertedId });
        } else {
          throw new Error('Failed to submit review');
        }
      } catch (err) {
        console.error('Error submitting review:', err);
        res.status(500).json({ message: 'Server error. Please try again later.' });
      }
    });

    // get revies 
    app.get("/reviews/:collegeId", async (req, res) => {
      const { collegeId } = req.params;
    
      try {
        
        const reviews = await reviewsCollection.find({ collegeId }).toArray();
    
        if (!reviews || reviews.length === 0) {
          return res.status(404).json({ message: "No reviews found for this college." });
        }
    
   
        res.status(200).json(reviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Failed to fetch reviews." });
      }
    });
    
    // delete review
    app.delete("/reviews/:reviewId", async (req, res) => {
      const { reviewId } = req.params;
    
      try {
       
        const result = await reviewsCollection.deleteOne({ _id: new ObjectId(reviewId) });
    
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Review not found or already deleted." });
        }
    
        res.status(200).json({ message: "Review deleted successfully!" });
      } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Failed to delete review." });
      }
    });

    // get review
    app.get("/reviews", async (req, res) => {
      try {
    
        const reviews = await reviewsCollection.find().toArray();
    
        if (!reviews || reviews.length === 0) {
          return res.status(404).json({ message: "No reviews found." });
        }
    
     
        const reviewsWithUserData = await Promise.all(
          reviews.map(async (review) => {
          
            const user = await usersCollection.findOne({ email: review.userEmail });
    
          
            if (user) {
              return {
                ...review,
                userName: user.name,
                userPhoto: user.photo,
              };
            }
    
            return review;
          })
        );
    
        res.status(200).json(reviewsWithUserData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Failed to fetch reviews." });
      }
    });

    // get user profile
    app.get("/users/:email", async (req, res) => {
      const { email } = req.params;
    
      try {
       
        const user = await usersCollection.findOne({ email });
    
        if (!user) {
          return res.status(404).json({ message: "User not found." });
        }
    
        res.status(200).json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user." });
      }
    });
    


    console.log("EduTrack successfully connected to MongoDB!");
  } finally {
    
   
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