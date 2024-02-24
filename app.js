const express = require('express');
const session = require('express-session');
const app = express();
const flash = require('connect-flash');
const { Sequelize, DataTypes } = require('sequelize');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const port = 4000;
app.use(express.static(__dirname + '/public'));
const path = require('path'); 
app.set('views', path.join(__dirname, 'views'));
const { Op } = require('sequelize'); 
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

app.use(express.static(path.join(__dirname, 'public')));

const csrf = require('csurf');
app.use(flash());

app.use(cookieParser()); 

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: 'anusha',
  database: 'anusha',
  port: 5432,
});


const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sessionStore = new SequelizeStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
});
app.use(cookieParser());

app.use(session({
  secret: '6464235660954863',
  resave: false,
  saveUninitialized: false,
  store: sessionStore, // Use the Sequelize session store

}));



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// setup route middlewares
app.use(cookieParser());
app.use(csrf({ cookie: true }));
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

sessionStore.sync().then(() => {
  console.log('Database and session table synchronized');
}).catch(error => {
  console.error('Error synchronizing session table:', error);
});




app.use(passport.initialize());
app.use(passport.session());
app.get('/', (req, res) => {
  res.render('mainpage');
});

// Define Sequelize models
const Admin = sequelize.define('Admin', {
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
});

const People = sequelize.define('People', {
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
});

const Sport = sequelize.define('Sport', {
  name: { type: DataTypes.STRING, allowNull: false },
  image_url: { type: DataTypes.STRING, allowNull: false },
});
// models.js or similar

const Schedule = sequelize.define('Schedule', {
  sportName: { type: DataTypes.STRING, allowNull: false },
  teamname: { type: DataTypes.STRING, allowNull: false },
  venue: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  teamLogo: { type: DataTypes.STRING, allowNull: true }, // Add this line
  maxParticipants: { type: DataTypes.INTEGER, allowNull: true }, // Add this line
  eventName: { type: DataTypes.STRING, allowNull: true }, // Add this line
});

// Rest of the code
const PlayerJoins = sequelize.define('PlayerJoins', {
  playerName: { type: DataTypes.STRING, allowNull: false },
  userType: { type: DataTypes.STRING, allowNull: false }, // Add this line

});
Sport.belongsTo(Admin);
Admin.hasMany(Sport);

// Add the association between Schedule and PlayerJoins
Schedule.hasMany(PlayerJoins);
PlayerJoins.belongsTo(Schedule);
passport.serializeUser((user, done) => {
  done(null, { id: user.id, userType: user.userType });
});

passport.deserializeUser(async (serializedUser, done) => {
  try {
    const userId = serializedUser.id;
    const userType = serializedUser.userType || null; // Set to null if not present

    let user = null;

    if (userType === 'admin') {
      user = await Admin.findByPk(userId, { raw: true });
    } else if (userType === 'player') {
      user = await People.findByPk(userId, { raw: true });
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/'); // Redirect to the login page
}


app.get('/admin', (req, res) => {
  const csrfToken = req.csrfToken();
  console.log('CSRF Token:', csrfToken);

  res.render('admin_signup', { csrfToken });
});

app.get('/player', (req, res) => {
  res.render('player_signup', { csrfToken: req.csrfToken() });
});

app.get('/person_main', ensureAuthenticated, (req, res) => {
  const csrfToken = req.csrfToken();

  res.render('player_main', {csrfToken });});

  app.get('/admin_main', (req, res) => {
    const csrfToken = req.csrfToken();
    res.render('admin_main', { csrfToken });
  });

  
  app.get('/add_sport', (req, res) => {
    const csrfToken = req.csrfToken();
    res.render('add_sport', { csrfToken });
  
  });

sequelize.sync({ force : false})
  .then(() => {
    console.log('Database and tables synchronized');
  })
  .catch((error) => {
    console.error('Error synchronizing database:', error);
  });

passport.use('admin', new LocalStrategy(async (username, password, done) => {
  try {
    const admin = await Admin.findOne({ where: { username, password } });
    if (admin) {
      passport.serializeUser((user, done) => {
        done(null, { id: user.id, userType: 'admin' });
      });
      return done(null, admin);
    } else {
      return done(null, false, { message: 'Invalid login credentials' });
    }
  } catch (error) {
    return done(error);
  }
}));

passport.use('player', new LocalStrategy(async (username, password, done) => {
  try {
    const player = await People.findOne({ where: { username, password } });
    if (player) {
      passport.serializeUser((user, done) => {
        done(null, { id: user.id, userType: 'player' });
      });
      return done(null, player);
    } else {
      return done(null, false, { message: 'Invalid login credentials' });
    }
  } catch (error) {
    return done(error);
  }
}));




app.post('/player/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newPerson = await People.create({ username, email, password });

    passport.serializeUser((user, done) => {
      done(null, { id: user.id, userType: 'player' });
    });

    return res.redirect('/person_main');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});




app.post('/player/login', (req, res, next) => {
  passport.authenticate('player', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/');
    }
    req.login({ id: user.id, userType: 'player' }, (err) => {
      if (err) {
        return next(err);
      }
      else{
      console.log('User session after login:', req.session);

      return res.redirect('/person_main');
      }
    });
  })(req, res, next);
});


app.post('/admin/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newAdmin = await Admin.create({ username, email, password });
    passport.serializeUser((user, done) => {
      done(null, { id: user.id, userType: 'admin' });
    });
    res.redirect('/admin_main');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/admin/login', (req, res, next) => {
  passport.authenticate('admin', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/admin');
    }
    
    req.login({ id: user.id, userType: 'admin' }, (err) => {
      if (err) {
        return next(err);
      }
      console.log('User session after login:', req.session);

      return res.redirect('/admin_main');
    });
  })(req, res, next);
});
  
app.post('/admin/sports/add', ensureAuthenticated, async (req, res) => {
  try {
    const { name, image_url } = req.body;
    if (!image_url) {
      return res.status(400).json({ success: false, error: 'Image URL cannot be null or empty.' });
    }

    const adminId = req.user.id;
    console.log('Authenticated Admin ID:', adminId);
    const newSport = await Sport.create({ name, image_url, AdminId: adminId });

    // Redirect to admin_main after successfully adding a sport
    res.redirect('/admin_main');
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


app.get('/create_schedule', (req, res) => {
  const csrfToken = req.csrfToken();
  res.render('schedules', { csrfToken });});

app.get('/create_match', (req, res) => {
  try {
    res.render('schedules',);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/api/sports', async (req, res) => {
  try {
    const allSports = await Sport.findAll();
    res.json(allSports);
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/create_schedule', ensureAuthenticated, async (req, res) => {
  try {
    const {
      sportName,
      teamname,
      venue,
      date,
      teamLogo,
      maxParticipants,
      eventName
    } = req.body;

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date format');
    }
     const formattedDate = parsedDate.toISOString();

    await Schedule.create({
      sportName,
      teamname,
      venue,
      date: formattedDate,
      teamLogo,
      maxParticipants,
      eventName
    });

    console.log('Schedule saved successfully');
    res.redirect('/player_main');
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});
app.delete('/admin/sports/:id', ensureAuthenticated, async (req, res) => {
  try {
    const sportId = req.params.id;

    // Find the sport to be deleted
    const sportToDelete = await Sport.findByPk(sportId);

    if (!sportToDelete) {
      return res.status(404).json({ success: false, error: 'Sport not found' });
    }

    // Delete the sport
    await sportToDelete.destroy();

    await Schedule.destroy({ where: { sportName: sportToDelete.name } });

    res.status(200).json({ success: true, message: 'Sport and associated schedules deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.get('/events', ensureAuthenticated, async (req, res) => {
  try {
    const username = req.user && req.user.username ? req.user.username : null;
    console.log(username);
    const events = await Schedule.findAll(); // Assuming Schedule is your Sequelize model
    const csrfToken = req.csrfToken();
    res.render('events', { events, csrfToken });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


  
app.post('/join_event', ensureAuthenticated, async (req, res) => {
  try {

    const { eventId } = req.body;
    console.log('eventId:', eventId);

    const username = req.user ? req.user.username : null;
    const userType = req.session.passport.user.userType;

    console.log(userType);
    if (!username || !userType) {
      return res.status(403).json({ success: false, error: 'User not authenticated' });
    }
    const existingJoin = await PlayerJoins.findOne({
      where: {
        playerName: username,
        ScheduleId: eventId,
      },
    });
    if (existingJoin) {
      return res.status(400).json({ success: false, error: 'Player has already joined this event' });
    }
    const schedule = await Schedule.findOne({ where: { id: eventId } });
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    const eventDate = new Date(schedule.date);
    const currentDate = new Date();
    if (eventDate < currentDate) {
      return res.status(400).json({ success: false, error: 'Cannot join past sessions' });
    }
    const playerJoin = await PlayerJoins.create({
      playerName: username,
      userType: userType, // Store the user type in PlayerJoins table

      ScheduleId: schedule.id,
    });
    
    return res.status(200).json({ success: true, message: 'Joined event successfully' });
  } catch (error) {
    console.error('Error joining event:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});
app.get('/view_players/:eventId', ensureAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const event = await Schedule.findByPk(eventId);

    const playersForEvent = await PlayerJoins.findAll({
      where: { ScheduleId: eventId },
      attributes: ['playerName'], // Retrieve only the playerName attribute
    });

    res.render('view_players_event', { event, players: playersForEvent });
  } catch (error) {
    console.error('Error fetching players for the event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/my_events", ensureAuthenticated, async (req, res) => {
  try {
    const currentUserName = req.user.username;

    const playerJoinsData = await PlayerJoins.findAll({
      attributes: ['ScheduleId'], // We only need the scheduleId
      where: {
        playerName: currentUserName
      }
    });

    const scheduleIds = [];
    playerJoinsData.forEach(entry => {
      scheduleIds.push(entry.ScheduleId);
    });
    if (scheduleIds.length === 0) {
      return res.send('noEvents');
    }

    const formattedData = await Schedule.findAll({
      where: {
        id: { [Op.in]: scheduleIds }
      }
    });
    
    // Render the myEvents view and pass the formatted data
    return res.render('my_events', { formattedData, name: currentUserName,csrfToken: req.csrfToken() });
  } catch (error) {
    console.error("Error retrieving data:", error);
    return res.status(500).send("Internal Server Error");
  }
});


app.get('/change_password', (req, res) => {
  const csrfToken = req.csrfToken();
  res.render('change_password', { csrfToken });
});


app.post('/change_password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  console.log(email);
  try {
    const user = await People.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    await user.update({ password: newPassword });
    res.json({ message: 'Password updated successfully', redirectTo: '/player_main' });
} catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/admin/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.findAll();

    const events = schedules.map(schedule => ({
      title: schedule.title,
      start: schedule.date.toISOString(), // Convert your date to ISO format
    }));

    res.json(events);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// ... (other imports and configurations)
app.get('/records', (req, res) => {
  const csrfToken = req.csrfToken();
  res.render('calender', { csrfToken });
});

app.get('/api/events', async (req, res) => {
  const date = req.query.date;
  const sport = req.query.sport;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is missing' });
  }

  try {
    const query = {
      attributes: ['eventName', 'teamname', 'venue', 'date'],
      where: {
        date: {
          [Op.gte]: new Date(date),
          [Op.lt]: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
        },
      },
    };

    if (sport && sport !== 'all') {
      query.where.sportName = sport;
    }

    const events = await Schedule.findAll(query);

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/admin/:adminId', (req, res) => {
  const adminId = req.params.adminId;
   res.render('player_main');
});

app.get('/player_main', ensureAuthenticated, (req, res) => {
  res.render('player_main');
});
app.get('/logout', function(req, res) {
  req.logout(function(err) {
      if (err) {
          console.error(err);
          return res.status(500).send('Error logging out');
      }
      res.redirect('/'); 
  });
});




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
app.locals.sequelize = sequelize;
module.exports = { app, sequelize, Schedule }; 

