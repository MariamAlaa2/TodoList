
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const _=require('lodash');
// const bcrypt = require('bcryptjs');
const session = require('express-session');
const User = require('./models/user');
const List = require('./models/list');
const { findById } = require('./models/list');
const { set } = require('lodash');
// const blogRoutes=require('./routes/blogRoutes');
// express app
const app=express();

//connect to mongo db
const dbURI="mongodb+srv://mariamalaa673:meroelhacker2002@cluster0.kczxdge.mongodb.net/todo";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(result => app.listen(3000))
  .catch(err => console.log(err));

// regisetr view engine
app.set('view engine','ejs')

//middleware
app.use(express.static('public'));
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({extended:true}));
app.use(morgan('dev'));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));



  app.get('/',(req,res)=>{
     res.render('index',{title:'home',user:req.session.user});
  });
//////////////////////////////////
  app.get('/userlogin',(req,res)=>{
    res.render('users/login',{title:'login'});
 });
 app.post('/userlogin',async(req,res)=>{
  const { username, password } = req.body;
   try{
    const user= await User.findOne({username:username});
    if (!user) {
      return res.status(400).send('Invalid username');
       }
  //  const validPassword =  compare(password, user.password);
     if (password!=user.password) {
           return res.status(400).send('Invalid password');
       } 
       req.session.user = user;
        res.redirect('/');  
   }
   catch(err){
    console.error(err);
    res.status(500).send('Internal Server Error!');
   }

});
 app.get('/userregister',(req,res)=>{
  res.render('users/register',{title:'register'});
});
app.post('/userregister',async(req,res)=>{
 const {username ,password}=req.body;
 try{
  const existedUser=await User.findOne({username:username});
  if(existedUser){
    return res.status(400).send('User already exists');
  }
  const user=new User({username:username, password:password});
  await user.save();
  req.session.user=user;
  res.redirect('/');
 }
 catch(err){
  console.error(err);
  res.status(500).send('Internal Server Error');
 }
});
app.get('/userlogout',(req,res)=>{
  req.session.destroy(err => {
    if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error!!');
    } else {
        res.redirect('/');
    }
});
});
//////////////////////////////////

app.get('/today', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
}
  const currentId = req.session.user._id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  List.findOne({ type:'day',userId: currentId, date: today })
      .then(list => {
          if (list) {
              res.render('lists/showlist', { title: 'today', list });
          } else {
              const l = new List({ type: 'day', items: [], date: today, userId: currentId });
              l.save()
                  .then(savedList => {
                      res.render('lists/showlist', { title: 'today', list: savedList });
                  })
                  .catch(err => {
                      console.error('Error saving list:', err);
                      res.status(500).send('Internal Server Error');
                  });
          }
      })
      .catch(err => {
          console.error('Error querying list:', err);
          res.status(500).send('Internal Server Error');
      });
});
function getWeekDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday

  const startDate = new Date(today); // Clone today's date
  startDate.setDate(startDate.getDate() - (dayOfWeek + 1) % 7); // Set to the most recent Saturday

  const endDate = new Date(startDate); // Clone the start date
  endDate.setDate(endDate.getDate() + 6); // Set to the following Friday

  return { startDate, endDate };
}
app.get('/week',(req,res)=>{
  const { startDate, endDate } = getWeekDates();
  const currentId = req.session.user._id;


  List.findOne({type:'week', userId: currentId, date:startDate })
      .then(list => {
          if (list) {
              res.render('lists/showlist', { title: 'this week', list });
          } else {
              const l = new List({ type: 'week', items: [], date: startDate, userId: currentId });
              l.save()
                  .then(savedList => {
                      res.render('lists/showlist', { title: 'this week', list: savedList });
                  })
                  .catch(err => {
                      console.error('Error saving list:', err);
                      res.status(500).send('Internal Server Error');
                  });
          }
      })
      .catch(err => {
          console.error('Error querying list:', err);
          res.status(500).send('Internal Server Error');
      });
});
app.get('/month',(req,res)=>{
  const currentId = req.session.user._id;
  const thismonth = new Date();
 thismonth.setHours(0, 0, 0, 0);
 thismonth.setDate(1);
console.log(thismonth);
  List.findOne({type:'month', userId: currentId, date:thismonth})
      .then(list => {
          if (list) {
              res.render('lists/showlist', { title: 'thismonth', list });
          } else {
              const l = new List({ type: 'month', items: [], date: thismonth, userId: currentId });
              l.save()
                  .then(savedList => {
                      res.render('lists/showlist', { title: 'thismonth', list: savedList });
                  })
                  .catch(err => {
                      console.error('Error saving list:', err);
                      res.status(500).send('Internal Server Error');
                  });
          }
      })
      .catch(err => {
          console.error('Error querying list:', err);
          res.status(500).send('Internal Server Error');
      });
});


//////////////////////////////////////////

app.get('/showlist/:id',async(req,res)=>{
  const id=req.params.id;
  
   List.findById(id)
      .then(list => {   
              res.render('lists/showlist', { title: 'list', list });
         
      })
      .catch(err => {
          console.error('Error querying list:', err);
          res.status(500).send('Internal Server Error');
      });
  console.log(id);
 
});
app.post('/additem', async (req, res) => {
  const { listId, newItem } = req.body; // Extract the list and new item from the request body
  
  try {
    console.log(newItem);
    const list= await List.findById(listId);
 
    // Append the new item to the existing list
    const x = {
      name: newItem,
      completed: false
  };
 
    list.items.push(x);
    
    // Update the list in the database
    await List.findByIdAndUpdate(listId, { items: list.items });
  
    // Retrieve the updated list from the database
    const updatedList = await List.findById(list._id);

    res.render('lists/showlist', { title: 'today', list: updatedList });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ success: false, error: 'Failed to add item' });
  }
});
app.post('/deleteitem', async (req, res) => {
  const { listId, itemIndex } = req.body; // Extract list ID and item ID
  
  try {
      // Find the list by its ID
      const list = await List.findById(listId);
      
      // Remove the item with the specified ID from the items array
      // console.log(list.items.id(itemId));
      // list.items.id(itemId).remove();
      list.items.splice(itemIndex, 1);
      // Save the updated list to the database
      await list.save();
      
      // Redirect back to the list page or render the updated list
      res.render('lists/showlist', { title: 'today', list});
  } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ success: false, error: 'Failed to delete item' });
  }
});
app.post('/updateitem', async (req, res) => {
  const { listId, itemIndex, completed } = req.body;
  console.log('Received data:', req.body); // Log the received data to inspect it

  try {
    // Find the list by its ID
    const list = await List.findById(listId);

    // Update the completion status of the item at the specified index
    list.items[itemIndex].completed = !list.items[itemIndex].completed;

    // Save the updated list back to the database
    const updatedList = await list.save();

    // Render the updated list page with the updated list object
    res.render('lists/showlist', { title: 'Today', list: updatedList });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

/////////////////////////////////////////

app.get('/pdays',async(req,res)=>{
  try {
    const currentId = req.session.user._id;
    const list = await List.find({ type: 'day' ,userId:currentId});
    console.log(list);
    res.render('lists/alllists',{title:'daylists',list, t:'days'});
} catch (error) {
    res.status(500).json({ message: error.message });
}
});

app.get('/pweeks',async(req,res)=>{
  try {
    const currentId = req.session.user._id;
    const list = await List.find({ type: 'week' ,userId:currentId});
    res.render('lists/alllists',{title:'weeklists',list, t:'weeks'});
} catch (error) {
    res.status(500).json({ message: error.message });
}
});
app.get('/pmonths',async(req,res)=>{
  try {
    const currentId = req.session.user._id;
    const list = await List.find({ type: 'month' ,userId:currentId});

    res.render('lists/alllists',{title:'monthlists',list, t:'months'});
} catch (error) {
    res.status(500).json({ message: error.message });
}
});

  app.use((req, res) => {
    res.status(404).render('404', { title: '404' });
  });