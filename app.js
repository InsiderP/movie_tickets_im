const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Store the seats availability for each screen
const screens = {
  1: 45,
  2: 60,
  3: 75
};

// Store the bookings for each show
const bookings = {
  1: [],
  2: [],
  3: []
};

// Function to check if a seat is available for a particular screen
const isSeatAvailable = (screen, seat) => {
  return !bookings[screen].includes(seat);
};

// Function to find the next available show
const findNextAvailableShow = () => {
  for (let show in bookings) {
    if (bookings[show].length < screens[show]) {
      return show;
    }
  }
  return null; // No available shows
};

app.get('/show/:showNumber', (req, res) => {
  const showNumber = req.params.showNumber;

  if (!screens[showNumber]) {
    return res.status(404).json({ error: 'Show not found' });
  }

  const seatCapacity = screens[showNumber];
  const bookedSeats = bookings[showNumber].length;
  const availableSeats = seatCapacity - bookedSeats;

  return res.json({ show: showNumber, seatCapacity, bookedSeats, availableSeats });
});

// API endpoint for booking a ticket
app.post('/book', (req, res) => {
  const { show, seat } = req.body;

  if (!show || !seat) {
    return res.status(400).json({ error: 'Missing show or seat information' });
  }

  if (!screens[show]) {
    return res.status(400).json({ error: 'Invalid show number' });
  }

  const availableSeats = screens[show];
  const bookedSeats = bookings[show].length;

  const isNumericSeat = /^[1-9][0-9]*$/.test(seat);
  const isAlphabeticSeat = /^[A-Z][0-9]{1,2}$/.test(seat);

  if (!isNumericSeat && !isAlphabeticSeat) {
    return res.status(400).json({ error: `Invalid seat format for Show ${show}. Please provide a valid seat number or label.` });
  }

  if (isNumericSeat && (parseInt(seat) < 1 || parseInt(seat) > availableSeats)) {
    return res.status(400).json({ error: `Invalid seat number for Show ${show}. Choose a seat between 1 and ${availableSeats}.` });
  }

  if (isAlphabeticSeat) {
    const row = seat.charAt(0);
    const seatNumber = parseInt(seat.substring(1));
    if (row.charCodeAt(0) - 65 >= availableSeats || seatNumber < 1 || seatNumber > 99) {
      return res.status(400).json({ error: `Invalid seat label for Show ${show}. Choose a valid seat label between A1 and ${String.fromCharCode(65 + availableSeats - 1)}99.` });
    }
  }

  if (bookings[show].includes(seat)) {
    return res.status(400).json({ error: `Seat ${seat} is already booked for Show ${show}.` });
  }

  bookings[show].push(seat);
  return res.json({ message: `Ticket booked successfully for Show ${show}, Seat ${seat}.` });
});




// API endpoint for canceling a ticket
app.post('/cancel', (req, res) => {
  const { show, seat } = req.body;

  if (!show || !seat) {
    return res.status(400).json({ error: 'Missing show or seat information' });
  }

  if (!screens[show]) {
    return res.status(400).json({ error: 'Invalid show number' });
  }

  const bookedSeats = bookings[show];
  const seatIndex = bookedSeats.indexOf(seat);

  if (seatIndex === -1) {
    return res.status(400).json({ error: 'Seat not found or already canceled' });
  }

  bookedSeats.splice(seatIndex, 1);

  return res.json({ message: 'Ticket canceled successfully' });
});
app.get('/nextAvailableShows', (req, res) => {
  const availableShows = Object.keys(screens).filter((show) => {
    const bookedSeats = bookings[show];
    return bookedSeats.length < screens[show];
  });

  if (availableShows.length === 0) {
    return res.json({ message: 'No next available shows at the moment' });
  }

  return res.json({ availableShows });
});

// Start the server
const port = 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
