const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)


// middlewares 
app.use(express.json())
app.use(cors({
  origin : [
 'http://localhost:5173',
  'https://academix-e460f.firebaseapp.com',
  'https://academix-e460f.web.app'
  ]
}))


// !mongodb link
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.56yvv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    // !database collection
    const userCollection = client.db('academixDb').collection('Users');
    const teacherCollection = client.db('academixDb').collection('Teachers');
    const classCollection = client.db('academixDb').collection('Classes');
    const paymentCollections = client.db('academixDb').collection('Payments');
    const assignmentsCollections = client.db('academixDb').collection('Assignments');
    const SubmitedAsignmentCollections = client.db('academixDb').collection('Submited-Assignment');
    const feedbackCollections = client.db('academixDb').collection('Student-Feedbacks');
    




    // ! user related  Api

    app.post('/users' , async(req,res) => {
          const user = req.body;
          // if user already sign up
          const query = {email : user.email};
          const userAlradyExist = await userCollection.findOne(query);
          if(userAlradyExist){
            return  res.send({meassage : 'u are already sign up. please sign in', insertedId : null});
          }

          const  result =  await userCollection.insertOne(user);
          res.send(result)
    })

    app.get('/users', async(req,res) => { 
         const result = await userCollection.find().toArray();
         res.send(result)
    })


    // update user role

    app.patch('/users/admin/:id', async(req,res) => {
       const id = req.params.id;
       const filter = {_id : new ObjectId(id)};
       const updatedDoc = {
         $set : {
          role : 'admin'
         }
       }
       const result = await userCollection.updateOne(filter,updatedDoc);
       res.send(result)

    })

    delete user 
    app.delete('/users/:id', async(req,res) => { 
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await userCollection.deleteOne(query)
      res.send(result)
 })

    
// manage user status and role
    app.patch('/users/:email', async(req,res) => {
      const  email = req.params.email;
      const query = {email : email};
      const user =  await userCollection.findOne(query);
      const skills = req.body;

      if(!user || user?.status === 'pending'){
        return res.status(400)
                  .send('you have already requested')
      }

      const updatedDoc = {
         $set : {
          status : 'pending',
          skills : {
            experience : skills.experience,
                title : skills.title,
            catagory : skills.catagory
          }
         }
      }

      const result = await userCollection.updateOne(query,updatedDoc);
      res.send(result)

       
    })

    // update user profile data

    app.patch('/api/user/update-profile/:email', async(req,res) => {
          const email = req.params.email;
          const emailQuery = {email : email};
          const userData = req.body;

            // Check if req.body is empty
  if (Object.keys(userData).length === 0) {
    return res.status(400).send({ success: false, message: 'No data provided for update' });
  }

         const updatedData = {
          $set : {
            image : userData.image,
            phoneNumber : userData.phoneNumber,
            userAddress : userData.address
          }
         }

         const result = await userCollection.updateOne(emailQuery,updatedData);

         res.send(result)
  


    })

   // get user role

   app.get('/users/role/:email',async(req,res) => {
      const email = req.params.email;
    
       
      const result = await userCollection.findOne({email});
  
       
      res.send({role : result?.role , status : result?.status})
   })

    // manage teacher status and role

    app.patch('/users/teacher/confirm/:email', async(req,res) => {
      const email = req.params.email;
      const filter = {email : email};
   
  const updatedDoc = {
    $set : {
      status : 'accepted',
      role : 'teacher'
    }
  }
   
  const result = await userCollection.updateOne(filter,updatedDoc);
         
res.send(result)
    
    })

    app.patch('/users/teacher/reject/:email', async(req,res) => {
      const email = req.params.email;
      const filter = {email : email};
   
  const updatedDoc = {
    $set : {
      status : 'rejected',
      role : 'user'
    }
  }
   
  const result = await userCollection.updateOne(filter,updatedDoc);
         
res.send(result)
    
    })

    // manage rejected teacher request

    app.patch('/users/reject/:email' , async(req,res) => {
      const  email = req.params.email;
      const filter = {email : email};
      const updatedDoc = {
        $set : {
            status : 'pending',
    role : 'user'
        }
      }

      const result = await userCollection.updateOne(filter,updatedDoc);
      res.send(result)
    })
    



    
    // ! class related api

    app.post('/classes', async (req,res) => {
        const classes =  req.body;
        const result = await classCollection.insertOne(classes);
        res.send(result);
    })


    // get all classes from database  
    app.get('/classes', async (req,res) => {
       try {
        const search = req.query.search || '';
        const sort = req.query.sort || '';
        const filter = req.query.filter || '';

        
        let options = {};
        if(sort){
          options = { sort : {price : sort == 'asc' ? 1 : -1}}
        }


  let query =   {
    title : {
      $regex: search ,$options: 'i',
    },
  } 

  if(filter) {query.title = filter}
      const result = await classCollection.find(query,options).toArray()
      res.send(result)
       }catch (error) {
        res.status(500).send({ message: 'Server Error' });

        
       }
    })
// update totalEnrollments 
    app.patch('/classes/:id', async(req,res) => {
      const id = req.params.id;
        const {studentEmail} = req.body;
      
         
      const filterdEmail = {email : studentEmail}
      const filter = {_id : new ObjectId(id)};
      
      const updatedDoc = {
        $inc : {
          totalEnrollments  : 1
        }
      };

      const roleUpdate = {
        $set : {
          role : 'student'
        }
      }
    try {
        // প্রথমে ক্লাস আপডেট
        const classResult = await classCollection.updateOne(filter,updatedDoc);


        // তারপর ইউজার আপডেট
        const userResult = await userCollection.updateOne(filterdEmail, roleUpdate);

        res.send({ classResult, userResult });
    } catch (error) {
        res.status(500).send({ message: "Error updating data", error });
    }




    })

    // delete classs from teacher  dashboard

    app.delete('/classes/:id', async(req,res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};

      const result  = await classCollection.deleteOne(query);
      res.send(result)
    })

    // get single class data 
    app.get('/classes/:id', async (req,res) => {
       const id  = req.params.id;

       if(!ObjectId.isValid(id)){
        return res.status(404).send({error : 'invalid id format'})
       }
        
       const query = {_id : new ObjectId(id)};

       try{
         
         const result = await classCollection.findOne(query);
         res.send(result)
       }catch(error){
res.status(500).send({error : 'server error'})
       }

    })
    // manage class status

    app.patch('/classes/approve/:id', async (req,res) => {
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updatedDoc = {
        $set : {
          status : 'approved'
        }
      }
      const  result = await classCollection.updateOne(filter,updatedDoc);
      res.send(result)
    })
// ------------------
    app.patch('/classes/reject/:id', async(req,res) => {
       const id = req.params.id;
       const filter = {_id : new ObjectId(id)};

       const updatedDoc = {
        $set : {
          status : 'rejected'
        }
       }

       const result = await classCollection.updateOne(filter,updatedDoc);
       res.send(result)
    })

    // update class information

    app.patch('/classes/update/:id', async(req,res) => {
       const id = req.params.id;
       const updatedData = req.body;
       const filter = {_id :  new ObjectId(id)};

       const updatedDoc = {
        $set : {
            title : updatedData.title,
            image : updatedData.image,
            price : updatedData.price,
            description : updatedData.description
        }
       }
       const result = await classCollection.updateOne(filter,updatedDoc);
       res.send(result)
    })

 

    // delete class from database 
    app.delete('/classes/:id', async(req,res) => {
         try {
          const id = req.params.id; 
           console.log(id);
           
               //  cheack if id is valid
          if(!ObjectId.isValid(id)){
           return res.status(400).send({success:false , message : 'invalid class id'});
          }
          const query = {_id : new ObjectId(id)};

          const result = await classCollection.deleteOne(query);
              console.log('delete result', result);
              
          if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        res.status(200).send({success: true, message : 'class deleted successfully'});

         } catch (error) {
          res.status(500).json({ success: false, message: "Internal server error" });
         }
    })



    // ! payment intent 

    app.post('/creat-payment-intent' , async(req,res) => {
      const {courseFee} = req.body;
      const amount = parseInt(courseFee * 100);
  
       

      // creat a paymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
            amount : amount,
            currency : 'usd',
            payment_method_types : [
              "card"
            ]
      })

      res.send({
        clientSecret : paymentIntent.client_secret
      })

    })

    app.post('/payments', async (req,res) => {
        const payment = req.body;
    
  
        const result = await paymentCollections.insertOne(payment);

        res.send(result)
    })

    app.get('/payments', async(req,res) => {
      const result = await paymentCollections.find().toArray();
       res.send(result)
    })

    app.get('/payments/:id', async(req,res) => {
       const id = req.params.id;
       
        
        const query = {_id : new ObjectId(id)};
        const result = await paymentCollections.findOne(query);

         res.send(result)
    })


    // !Assignments related api

    app.post('/assignments', async(req,res) => {
               const assignmet = req.body;
               const result = await assignmentsCollections.insertOne(assignmet);
               res.send(result)
    })

    app.get('/assignments', async(req,res) => {
      const result = await assignmentsCollections.find().toArray();
      res.send(result)
    })


    // ! submited assignment related api

    app.post('/submit-asignment', async (req,res) => {
             const submission = req.body;
             const result = await SubmitedAsignmentCollections.insertOne(submission);
             res.send(result)  
              })


              app.get('/submit-asignment', async(req,res) => {
                const result = await SubmitedAsignmentCollections.find().toArray();
                res.send(result)
              })



   // ! feedback related api

              app.post('/feedback', async (req,res) => {
                const studentFeedback = req.body;
                const result = await feedbackCollections.insertOne(studentFeedback);
                res.send(result)  
                 })
   
   
                 app.get('/feedback', async (req,res) => {
          
                  const result = await feedbackCollections.find().toArray()
                  res.send(result)  
                   })




    



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req,res) => {
    res.send('academix server is running')
})

app.listen(port, () => {
     console.log('academix server is running on port', port);
     
})