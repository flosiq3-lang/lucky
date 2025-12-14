# 🎰 Lucky Casino Website

A beautiful, interactive casino website with three classic games: Slots, Blackjack, and Roulette. Includes admin panel for user management and winrate control.

## Features

- **Login System**: Secure authentication with superadmin access
- **User Management**: Superadmin can create users and admins
- **Slot Machine**: Multiple themes with spinning reels and win animations
- **Blackjack**: Play against the dealer with enhanced card animations
- **Roulette**: Bet on red, black, even, odd, or the green zero
- **Admin Panel**: Control winrates and send credits to users
- **Balance System**: Unlimited credits for superadmin, regular credits for users
- **Modern UI**: Beautiful gradient design with smooth animations
- **Responsive**: Works on desktop and mobile devices

## Default Login

**Superadmin Credentials:**
- Username: `admin`
- Password: `admin123`

## How to Use

### For Players
1. Open `login.html` in your web browser
2. Login with your credentials
3. Start with your assigned balance
4. Choose a game from the navigation menu
5. Place your bet and play!

### For Superadmin
1. Login with superadmin credentials
2. Click "⚙️ Admin Panel" button in the header
3. **Users Tab**: Create new users/admins or delete existing ones
4. **Winrates Tab**: Adjust winrate percentages for each game (0-100%)
5. **Send Credits Tab**: Transfer credits to any user

## Games

### Slots
- **5 Themes Available**: Classic Fruits, Diamonds, Animals, Space, Ocean
- Set your bet amount (minimum $10)
- Click SPIN to spin the reels
- Win with matching symbols (higher payouts for special symbols)
- Winrate controlled by admin

### Blackjack
- Set your bet amount
- Click DEAL to start
- HIT to get another card
- STAND when you're ready
- Beat the dealer without going over 21!
- Winrate controlled by admin

### Roulette
- Select a bet option (Red, Black, Even, Odd, or 0)
- Set your bet amount
- Click SPIN and watch the wheel
- Win based on the number that comes up
- Winrate controlled by admin

## Admin Features

### User Management
- Create new users with custom roles (user/admin)
- Set initial credits for new users
- Delete users (superadmin only)
- View all users and their balances

### Winrate Control
- Adjust slots winrate (default: 30%)
- Adjust blackjack winrate (default: 45%)
- Adjust roulette winrate (default: 48%)
- Changes apply immediately to all games

### Credit Management
- Superadmin can send credits to any user
- Transaction history tracking
- Unlimited credits for superadmin

## Files

- `login.html` - Login page
- `login.css` - Login page styling
- `index.html` - Main casino page
- `styles.css` - Styling and animations
- `script.js` - Game logic and interactions
- `auth.js` - Authentication system

## Technologies

- Pure HTML, CSS, and JavaScript
- LocalStorage for data persistence
- No dependencies required
- Works in any modern web browser

## Notes

- All data is stored in browser localStorage
- Superadmin has unlimited credits (displayed as ∞)
- Winrates control the probability of winning, not guaranteed outcomes
- Users created by superadmin can login with their credentials

Enjoy playing! 🎲

