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
  res.sendFile(__dirname + '/public/mainpage.html');
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
});
Sport.belongsTo(Admin);
Admin.hasMany(Sport);

// Add the association between Schedule and PlayerJoins
Schedule.hasMany(PlayerJoins);
PlayerJoins.belongsTo(Schedule);




function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/admin'); // Redirect to the login page
};


app.get('/admin', (req, res) => {
  const csrfToken = req.csrfToken();
  console.log('CSRF Token:', csrfToken);

  res.render('admin_signup', { csrfToken });
});

app.get('/player', (req, res) => {
  res.render('player_signup', { csrfToken: req.csrfToken() });
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
      return done(null, admin);
    } else {
      return done(null, false, { message: 'Invalid login credentials' });
    }
  } catch (error) {
    return done(error);
  }
}));

passport.use('person', new LocalStrategy(async (username, password, done) => {
  try {
    const person = await People.findOne({ where: { username, password } });
    if (person) {
      return done(null, person);
    } else {
      return done(null, false, { message: 'Invalid login credentials' });
    }
  } catch (error) {
    return done(error);
  }
}));




function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

app.post('/player/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newPerson = await People.create({ username, email, password });

    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    return res.redirect('/person_main');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



passport.serializeUser((user, done) => {
  done(null, user.id);
});



passport.deserializeUser(async (id, done) => {
  try {
    const admin = await Admin.findByPk(id);
    if (admin) {
      done(null, admin);
    } else {
      const person = await People.findByPk(id);
      done(null, person);
    }
  } catch (error) {
    done(error);
  }
});


app.post('/person/login', (req, res, next) => {
  passport.authenticate('person', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/');
    }
    req.login({ id: user.id, userType: 'person' }, (err) => {
      if (err) {
        return next(err);
      }
      else{
      // Redirect to the desired page after successful submission
      return res.redirect('/person_main');
      }
    });
  })(req, res, next);
});

app.get('/person_main', ensureAuthenticated, (req, res) => {
  res.render('player_main');
});


app.post('/admin/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newAdmin = await Admin.create({ username, email, password });
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
      return res.redirect('/admin_main');
    });
  })(req, res, next);
});
app.get('/admin_main', (req, res) => {
  const csrfToken = req.csrfToken();
  console.log('CSRF Token:', csrfToken);

  res.render('admin_main', { csrfToken });
});



app.get('/add_sport', (req, res) => {
  const csrfToken = req.csrfToken();
  console.log('CSRF Token:', csrfToken);

  res.render('add_sport', { csrfToken });

});
app.post('/admin/sports/add', ensureAuthenticated, async (req, res) => {
  try {
    const { name, image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ success: false, error: 'Image URL cannot be null or empty.' });
    }

    const adminId = req.user.id; 

    const newSport = await Sport.create({ name, image_url, AdminId: adminId });

    res.redirect('/admin_main');
    } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

  


app.get('/create_schedule', (req, res) => {
  const csrfToken = req.csrfToken();
  console.log('CSRF Token:', csrfToken);

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
    await Sport.destroy({ where: { id: sportId } });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});
app.get('/events', async (req, res) => {
  try {
    const events = await Schedule.findAll({
      where: {
        date: {
          [Op.gte]: new Date(),
        },
      },
      order: [['date', 'ASC']],
    });
    const joinedEvents = await PlayerJoins.findAll({
      where: {
        playerName: req.user.username,
      },
      attributes: ['ScheduleId'],
    });

    const joinedEventIds = joinedEvents.map((join) => join.ScheduleId);

    const csrfToken = req.csrfToken();
    res.render('events', { events, csrfToken, joinedEventIds });
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

    if (!username) {
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
    const playerJoin = await PlayerJoins.create({
      playerName: username,
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


app.get('/changepassword', (req, res) => {
  const csrfToken = req.csrfToken();
  res.render('change_password', { csrfToken });
});

app.post('/change_password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    const user = await People.findOne({
      where: { username, password: currentPassword },
    });

    if (!user) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    await user.update({ password: newPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/admin/:adminId', (req, res) => {
  const adminId = req.params.adminId;
   res.render('player_main');
});

app.get('/player_main', ensureAuthenticated, (req, res) => {
  res.render('player_main');
});
app.get('/logout', (req, res) => {
  res.render('/');
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});