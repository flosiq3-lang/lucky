// Game State
let currentUser = null;
let balance = 1000;
let currentGame = 'slots';
let selectedBet = null;
let selectedBetAmount = 1; // Default bet amount
let blackjackDeck = [];
let playerCards = [];
let dealerCards = [];
let playerScore = 0;
let dealerScore = 0;
let gameInProgress = false;

// Winrate Settings (defaults)
let winrates = {
    slots: 10,
    blackjack: 10,
    roulette: 10
};

// Slot Themes
const slotThemes = {
    classic: {
        symbols: ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎'],
        multipliers: { '🍒': 2, '🍋': 2, '🍊': 2, '🍇': 2, '🔔': 3, '⭐': 5, '💎': 10 }
    },
    diamonds: {
        symbols: ['💎', '💍', '👑', '🏆', '⭐', '✨', '🌟'],
        multipliers: { '💎': 10, '💍': 5, '👑': 4, '🏆': 3, '⭐': 2, '✨': 2, '🌟': 2 }
    },
    animals: {
        symbols: ['🐯', '🦁', '🐻', '🐺', '🦊', '🐰', '🐼'],
        multipliers: { '🐯': 5, '🦁': 4, '🐻': 3, '🐺': 2, '🦊': 2, '🐰': 2, '🐼': 2 }
    },
    space: {
        symbols: ['🚀', '🛸', '⭐', '🌙', '🪐', '☄️', '🌌'],
        multipliers: { '🚀': 8, '🛸': 6, '⭐': 5, '🌙': 3, '🪐': 2, '☄️': 2, '🌌': 2 }
    },
    ocean: {
        symbols: ['🐋', '🐙', '🦑', '🐠', '🦈', '🐡', '🌊'],
        multipliers: { '🐋': 7, '🐙': 5, '🦑': 4, '🐠': 2, '🦈': 3, '🐡': 2, '🌊': 2 }
    }
};

let currentSlotTheme = 'classic';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (typeof getCurrentUser === 'function') {
        currentUser = getCurrentUser();
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
    } else {
        // Fallback if auth.js not loaded
        currentUser = { username: 'Guest', role: 'user', credits: 1000, id: 'guest' };
    }
    
    // Load winrates from storage
    const savedWinrates = localStorage.getItem('winrates');
    if (savedWinrates) {
        winrates = JSON.parse(savedWinrates);
    }
    
    // Load user balance
    loadUserBalance();
    
    // Setup UI
    setupUserInfo();
    updateBalance();
    setupNavigation();
    setupBetAmountButtons(); // Initialize bet buttons first
    setupSlots();
    setupBlackjack();
    setupRoulette();
    setupAdminPanel();
    setupLogout();
});

// User Management
function setupUserInfo() {
    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('user-role').textContent = currentUser.role === 'superadmin' ? 'SUPERADMIN' : currentUser.role.toUpperCase();
    
    if (currentUser.role === 'superadmin' || currentUser.role === 'admin') {
        document.getElementById('admin-btn').style.display = 'block';
    }
}

function loadUserBalance() {
    if (currentUser.role === 'superadmin') {
        balance = Infinity;
    } else {
        // Check if credits is explicitly set, preserve 0 as valid value
        balance = (currentUser.credits !== undefined && currentUser.credits !== null) ? currentUser.credits : 1000;
    }
}

function saveUserBalance() {
    if (currentUser.role === 'superadmin') {
        return; // Superadmin has unlimited credits
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[currentUser.id]) {
        users[currentUser.id].credits = balance;
        localStorage.setItem('users', JSON.stringify(users));
        currentUser.credits = balance;
        if (typeof setCurrentUser === 'function') {
            setCurrentUser(currentUser);
        }
    }
}

function setupLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
}

// Balance Management
function updateBalance() {
    if (balance === Infinity) {
        document.getElementById('balance').textContent = '∞';
    } else {
        document.getElementById('balance').textContent = `${balance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
    }
}

function updateBalanceAmount(amount) {
    if (currentUser.role === 'superadmin') {
        balance = Infinity;
    } else {
        balance += amount;
        saveUserBalance();
    }
    updateBalance();
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const gameSections = document.querySelectorAll('.game-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const game = btn.dataset.game;
            
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            gameSections.forEach(s => s.classList.remove('active'));
            document.getElementById(game).classList.add('active');
            
            currentGame = game;
        });
    });
}

// Bet Amount Buttons Setup
function setupBetAmountButtons() {
    // Setup for each game separately
    setupGameBetButtons('slots', 'slots-bet');
    setupGameBetButtons('blackjack', 'blackjack-bet');
    setupGameBetButtons('roulette', 'roulette-bet');
}

function setupGameBetButtons(gameId, inputId) {
    const gameSection = document.getElementById(gameId);
    if (!gameSection) return;
    
    const betButtons = gameSection.querySelectorAll('.bet-amount-btn');
    const betInput = document.getElementById(inputId);
    
    betButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseFloat(btn.dataset.amount);
            
            // Remove selected from all buttons in this game
            betButtons.forEach(b => b.classList.remove('selected'));
            
            // Add selected to clicked button
            btn.classList.add('selected');
            selectedBetAmount = amount;
            betInput.value = amount;
        });
    });
    
    // Set default selected (1€) for this game
    const defaultBtn = gameSection.querySelector('.bet-amount-btn[data-amount="1"]');
    if (defaultBtn) {
        defaultBtn.classList.add('selected');
        betInput.value = 1;
    }
}

// Slots Game
function setupSlots() {
    const spinBtn = document.getElementById('spin-btn');
    const themeSelect = document.getElementById('slot-theme');
    const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    const winMessage = document.getElementById('slots-win-message');
    const betInput = document.getElementById('slots-bet');
    
    // Load theme
    loadSlotTheme('classic');
    
    // Theme selector
    themeSelect.addEventListener('change', (e) => {
        loadSlotTheme(e.target.value);
    });
    
    spinBtn.addEventListener('click', () => {
        const bet = parseFloat(betInput.value);
        
        if (currentUser.role !== 'superadmin' && bet > balance) {
            winMessage.textContent = 'Insufficient balance!';
            return;
        }
        
        if (bet < 0.5 || bet > 5) {
            winMessage.textContent = 'Bet must be between 0.50€ and 5€!';
            return;
        }
        
        updateBalanceAmount(-bet);
        winMessage.textContent = '';
        spinBtn.disabled = true;
        
        // Determine if player wins based on winrate
        const shouldWin = Math.random() * 100 < winrates.slots;
        const theme = slotThemes[currentSlotTheme];
        let finalSymbols = [];
        
        if (shouldWin) {
            // Force a win
            const winSymbol = theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
            finalSymbols = [winSymbol, winSymbol, winSymbol];
        } else {
            // Random symbols (no win)
            finalSymbols = [
                theme.symbols[Math.floor(Math.random() * theme.symbols.length)],
                theme.symbols[Math.floor(Math.random() * theme.symbols.length)],
                theme.symbols[Math.floor(Math.random() * theme.symbols.length)]
            ];
        }
        
        // Rapid symbol switching to simulate spinning
        const results = [];
        const spinDuration = 1000; // Total spin time in ms
        const switchInterval = 80; // How often to switch symbols (ms)
        const switchCount = Math.floor(spinDuration / switchInterval);
        
        reels.forEach((reel, reelIndex) => {
            const symbolsInReel = reel.querySelectorAll('.symbol');
            let currentSwitch = 0;
            let symbolIndex = 0; // Track which symbol position we're at
            
            // Rapid switching animation - update all symbols to create scrolling effect
            const switchIntervalId = setInterval(() => {
                // Update all symbols in the reel to create a scrolling effect
                symbolsInReel.forEach((sym, symIndex) => {
                    // Calculate which symbol to show based on position and scroll
                    const scrollOffset = (currentSwitch + symIndex) % theme.symbols.length;
                    sym.textContent = theme.symbols[scrollOffset];
                });
                
                currentSwitch++;
                
                // Stop after spin duration and show final result
                if (currentSwitch >= switchCount) {
                    clearInterval(switchIntervalId);
                    // Set final symbols
                    symbolsInReel.forEach((sym, symIndex) => {
                        // Show final result in middle, others can show adjacent symbols
                        if (symIndex === 1) {
                            sym.textContent = finalSymbols[reelIndex];
                        } else {
                            // Show symbols around the final result for visual continuity
                            const finalIndex = theme.symbols.indexOf(finalSymbols[reelIndex]);
                            const offset = symIndex - 1;
                            const displayIndex = (finalIndex + offset + theme.symbols.length) % theme.symbols.length;
                            sym.textContent = theme.symbols[displayIndex];
                        }
                    });
                    results[reelIndex] = finalSymbols[reelIndex];
                    
                    // Check win after all reels finish
                    if (reelIndex === reels.length - 1) {
                        setTimeout(() => {
                            checkSlotsWin(results, bet);
                            spinBtn.disabled = false;
                        }, 200);
                    }
                }
            }, switchInterval + (reelIndex * 50)); // Stagger each reel slightly
        });
    });
}

function loadSlotTheme(themeName) {
    currentSlotTheme = themeName;
    const theme = slotThemes[themeName];
    const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    
    reels.forEach(reel => {
        reel.innerHTML = '';
        // Create multiple symbol instances for smooth spinning
        for (let i = 0; i < 7; i++) {
            const symbolEl = document.createElement('div');
            symbolEl.className = 'symbol';
            symbolEl.textContent = theme.symbols[i % theme.symbols.length];
            reel.appendChild(symbolEl);
        }
    });
}

function checkSlotsWin(results, bet) {
    const winMessage = document.getElementById('slots-win-message');
    const theme = slotThemes[currentSlotTheme];
    
    // Check for three of a kind
    if (results[0] === results[1] && results[1] === results[2]) {
        const multiplier = theme.multipliers[results[0]] || 2;
        const winAmount = bet * multiplier;
        updateBalanceAmount(winAmount);
        winMessage.textContent = `🎉 You won ${winAmount.toFixed(2)}€! (${results[0]} x${multiplier})`;
        winMessage.style.animation = 'none';
        setTimeout(() => {
            winMessage.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
        // Two of a kind
        const winAmount = bet * 1.5;
        updateBalanceAmount(winAmount);
        winMessage.textContent = `You won ${winAmount.toFixed(2)}€! (Pair)`;
    } else {
        winMessage.textContent = 'No win. Try again!';
    }
}

// Blackjack Game
function setupBlackjack() {
    const dealBtn = document.getElementById('deal-btn');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');

    dealBtn.addEventListener('click', dealCards);
    hitBtn.addEventListener('click', hit);
    standBtn.addEventListener('click', stand);
}

function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    suits.forEach(suit => {
        values.forEach(value => {
            deck.push({ suit, value, isRed: suit === '♥' || suit === '♦' });
        });
    });
    
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
}

function getCardValue(card) {
    if (card.value === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(card.value);
}

function calculateScore(cards) {
    let score = 0;
    let aces = 0;
    
    cards.forEach(card => {
        if (card.value === 'A') {
            aces++;
            score += 11;
        } else {
            score += getCardValue(card);
        }
    });
    
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    
    return score;
}

function dealCards() {
    const bet = parseFloat(document.getElementById('blackjack-bet').value);
    
    if (currentUser.role !== 'superadmin' && bet > balance) {
        document.getElementById('blackjack-win-message').textContent = 'Insufficient balance!';
        return;
    }
    
    if (bet < 0.5 || bet > 5) {
        document.getElementById('blackjack-win-message').textContent = 'Bet must be between 0.50€ and 5€!';
        return;
    }
    
    updateBalanceAmount(-bet);
    gameInProgress = true;
    
    playerCards = [];
    dealerCards = [];
    blackjackDeck = createDeck();
    document.getElementById('player-cards').innerHTML = '';
    document.getElementById('dealer-cards').innerHTML = '';
    document.getElementById('blackjack-win-message').textContent = '';
    
    // Deal initial cards with animation delay
    setTimeout(() => {
        playerCards.push(blackjackDeck.pop());
        displayCards();
    }, 100);
    
    setTimeout(() => {
        dealerCards.push(blackjackDeck.pop());
        displayCards();
    }, 300);
    
    setTimeout(() => {
        playerCards.push(blackjackDeck.pop());
        displayCards();
        updateScores();
    }, 500);
    
    setTimeout(() => {
        dealerCards.push(blackjackDeck.pop());
        displayCards();
        updateScores();
        
        document.getElementById('deal-btn').disabled = true;
        document.getElementById('hit-btn').disabled = false;
        document.getElementById('stand-btn').disabled = false;
        
        if (playerScore === 21) {
            setTimeout(() => stand(), 1000);
        }
    }, 700);
}

function displayCards() {
    const playerContainer = document.getElementById('player-cards');
    const dealerContainer = document.getElementById('dealer-cards');
    
    playerContainer.innerHTML = '';
    playerCards.forEach((card, index) => {
        setTimeout(() => {
            const cardEl = createCardElement(card);
            playerContainer.appendChild(cardEl);
        }, index * 100);
    });
    
    dealerContainer.innerHTML = '';
    dealerCards.forEach((card, index) => {
        setTimeout(() => {
            const cardEl = createCardElement(card, index === 0 && gameInProgress);
            dealerContainer.appendChild(cardEl);
        }, index * 100);
    });
}

function createCardElement(card, hidden = false) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.isRed ? 'red' : ''}`;
    
    if (hidden) {
        cardEl.innerHTML = '<div class="card-value">?</div><div class="card-suit">?</div>';
        cardEl.style.background = '#333';
        cardEl.style.color = '#fff';
    } else {
        cardEl.innerHTML = `
            <div class="card-value">${card.value}</div>
            <div class="card-suit">${card.suit}</div>
        `;
    }
    
    return cardEl;
}

function updateScores() {
    playerScore = calculateScore(playerCards);
    dealerScore = calculateScore(dealerCards);
    
    document.getElementById('player-score').textContent = `Score: ${playerScore}`;
    document.getElementById('dealer-score').textContent = `Score: ${gameInProgress && dealerCards.length > 1 ? '?' : dealerScore}`;
}

function hit() {
    if (!gameInProgress) return;
    
    playerCards.push(blackjackDeck.pop());
    displayCards();
    updateScores();
    
    if (playerScore > 21) {
        endGame('Bust! You lose.');
    }
}

function stand() {
    if (!gameInProgress) return;
    
    gameInProgress = false;
    document.getElementById('hit-btn').disabled = true;
    document.getElementById('stand-btn').disabled = true;
    
    // Reveal dealer's hidden card
    const dealerContainer = document.getElementById('dealer-cards');
    dealerContainer.innerHTML = '';
    dealerCards.forEach((card, index) => {
        setTimeout(() => {
            const cardEl = createCardElement(card);
            cardEl.classList.add('flip');
            dealerContainer.appendChild(cardEl);
        }, index * 200);
    });
    
    // Dealer draws
    setTimeout(() => {
        const drawDealer = () => {
            if (dealerScore < 17) {
                dealerCards.push(blackjackDeck.pop());
                dealerScore = calculateScore(dealerCards);
                displayCards();
                updateScores();
                setTimeout(drawDealer, 500);
            } else {
                determineBlackjackWinner();
            }
        };
        drawDealer();
    }, 1000);
}

function determineBlackjackWinner() {
    const bet = parseFloat(document.getElementById('blackjack-bet').value);
    let message = '';
    
    // Check for push (tie) - bet returned, doesn't count as win or loss
    if (playerScore === dealerScore) {
        updateBalanceAmount(bet);
        message = 'Push! Bet returned.';
        endGame(message);
        return;
    }
    
    // Apply winrate FIRST to ensure true 10% win rate (90% loss rate)
    // This ensures player wins 10% of the time and loses 90% of the time, regardless of game rules
    const shouldWin = Math.random() * 100 < winrates.blackjack;
    
    if (shouldWin) {
        // Player wins (10% of the time) - give them the win regardless of actual game state
        const winAmount = bet * 2;
        updateBalanceAmount(winAmount);
        if (dealerScore > 21) {
            message = `Dealer busts! You win ${winAmount.toFixed(2)}€!`;
        } else if (playerScore > dealerScore) {
            message = `You win ${winAmount.toFixed(2)}€!`;
        } else {
            // Force a win even if player would normally lose
            message = `You win ${winAmount.toFixed(2)}€!`;
        }
    } else {
        // Player loses (90% of the time) - they lose regardless of actual game state
        message = 'Dealer wins!';
    }
    
    endGame(message);
}

function endGame(message) {
    document.getElementById('blackjack-win-message').textContent = message;
    document.getElementById('deal-btn').disabled = false;
    gameInProgress = false;
}

// Roulette Game
function setupRoulette() {
    const spinBtn = document.getElementById('roulette-spin-btn');
    const betOptions = document.querySelectorAll('.bet-option');
    const winMessage = document.getElementById('roulette-win-message');
    
    betOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (option.classList.contains('selected')) {
                option.classList.remove('selected');
                selectedBet = null;
            } else {
                betOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedBet = option.dataset.bet;
            }
        });
    });
    
    setupRouletteWheel();
    
    spinBtn.addEventListener('click', () => {
        if (!selectedBet) {
            winMessage.textContent = 'Please select a bet option!';
            return;
        }
        
        const bet = parseFloat(document.getElementById('roulette-bet').value);
        
        if (currentUser.role !== 'superadmin' && bet > balance) {
            winMessage.textContent = 'Insufficient balance!';
            return;
        }
        
        if (bet < 0.5 || bet > 5) {
            winMessage.textContent = 'Bet must be between 0.50€ and 5€!';
            return;
        }
        
        updateBalanceAmount(-bet);
        winMessage.textContent = '';
        spinBtn.disabled = true;
        betOptions.forEach(opt => opt.disabled = true);
        
        const wheel = document.getElementById('roulette-wheel');
        const ball = document.getElementById('roulette-ball');
        
        // Determine winning number based on winrate
        const shouldWin = Math.random() * 100 < winrates.roulette;
        let winningNumber;
        
        if (shouldWin) {
            // Force a win based on bet
            const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
            switch(selectedBet) {
                case 'red':
                    winningNumber = redNumbers[Math.floor(Math.random() * redNumbers.length)];
                    break;
                case 'black':
                    winningNumber = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35][Math.floor(Math.random() * 18)];
                    break;
                case 'green':
                    winningNumber = 0;
                    break;
                case 'even':
                    winningNumber = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36][Math.floor(Math.random() * 18)];
                    break;
                case 'odd':
                    winningNumber = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35][Math.floor(Math.random() * 18)];
                    break;
                default:
                    winningNumber = Math.floor(Math.random() * 37);
            }
        } else {
            // Force a loss
            const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
            switch(selectedBet) {
                case 'red':
                    winningNumber = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35, 0][Math.floor(Math.random() * 19)];
                    break;
                case 'black':
                    const blackOrGreen = [...redNumbers, 0];
                    winningNumber = blackOrGreen[Math.floor(Math.random() * blackOrGreen.length)];
                    break;
                case 'green':
                    winningNumber = Math.floor(Math.random() * 36) + 1;
                    break;
                case 'even':
                    winningNumber = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 0][Math.floor(Math.random() * 19)];
                    break;
                case 'odd':
                    winningNumber = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 0][Math.floor(Math.random() * 19)];
                    break;
                default:
                    winningNumber = Math.floor(Math.random() * 37);
            }
        }
        
        wheel.classList.add('spinning');
        ball.classList.add('spinning');
        
        setTimeout(() => {
            wheel.classList.remove('spinning');
            ball.classList.remove('spinning');
            checkRouletteWin(winningNumber, selectedBet, bet);
            spinBtn.disabled = false;
            betOptions.forEach(opt => opt.disabled = false);
        }, 4000);
    });
}

function setupRouletteWheel() {
    const wheel = document.getElementById('roulette-wheel');
    const numbers = Array.from({ length: 37 }, (_, i) => i);
    
    numbers.forEach((num, index) => {
        const angle = (index / 37) * 360;
        const radius = 150;
        const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
        const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
        
        const numberEl = wheel.querySelector(`[data-number="${num}"]`);
        if (numberEl) {
            numberEl.style.left = `calc(50% + ${x}px)`;
            numberEl.style.top = `calc(50% + ${y}px)`;
            numberEl.style.transform = `translate(-50%, -50%)`;
            
            if (num === 0) {
                numberEl.style.background = '#0f7b0f';
            } else {
                const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
                if (redNumbers.includes(num)) {
                    numberEl.style.background = '#d32f2f';
                    numberEl.style.color = '#fff';
                } else {
                    numberEl.style.background = '#000';
                    numberEl.style.color = '#fff';
                }
            }
        }
    });
}

function checkRouletteWin(winningNumber, betType, bet) {
    const winMessage = document.getElementById('roulette-win-message');
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const isRed = redNumbers.includes(winningNumber);
    const isEven = winningNumber !== 0 && winningNumber % 2 === 0;
    const isOdd = winningNumber !== 0 && winningNumber % 2 === 1;
    
    let won = false;
    let multiplier = 1;
    
    switch (betType) {
        case 'red':
            won = isRed;
            multiplier = 2;
            break;
        case 'black':
            won = !isRed && winningNumber !== 0;
            multiplier = 2;
            break;
        case 'green':
            won = winningNumber === 0;
            multiplier = 36;
            break;
        case 'even':
            won = isEven;
            multiplier = 2;
            break;
        case 'odd':
            won = isOdd;
            multiplier = 2;
            break;
    }
    
    if (won) {
        const winAmount = bet * multiplier;
        updateBalanceAmount(winAmount);
        winMessage.textContent = `🎉 Winning number: ${winningNumber}! You won ${winAmount.toFixed(2)}€!`;
    } else {
        winMessage.textContent = `Losing number: ${winningNumber}. Try again!`;
    }
    
    document.querySelectorAll('.bet-option').forEach(opt => opt.classList.remove('selected'));
    selectedBet = null;
}

// Admin Panel
function setupAdminPanel() {
    const adminBtn = document.getElementById('admin-btn');
    const adminModal = document.getElementById('admin-modal');
    const closeModal = document.getElementById('close-admin-modal');
    
    if (!adminBtn || !adminModal) return;
    
    adminBtn.addEventListener('click', () => {
        adminModal.classList.add('active');
        loadUsersList();
        loadWinrates();
        loadCreditUsers();
    });
    
    closeModal.addEventListener('click', () => {
        adminModal.classList.remove('active');
    });
    
    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            adminModal.classList.remove('active');
        }
    });
    
    // Tab switching
    const tabs = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
            
            if (targetTab === 'credits') {
                loadCreditHistory();
            }
        });
    });
    
    // Create user
    document.getElementById('create-user-btn').addEventListener('click', createUser);
    
    // Save winrates
    document.getElementById('save-winrates-btn').addEventListener('click', saveWinrates);
    
    // Update winrate displays
    ['slots', 'roulette', 'blackjack'].forEach(game => {
        const input = document.getElementById(`${game}-winrate`);
        const display = document.getElementById(`${game}-winrate-value`);
        if (input && display) {
            input.addEventListener('input', () => {
                display.textContent = `${input.value}%`;
            });
        }
    });
    
    // Send credits
    document.getElementById('send-credits-btn').addEventListener('click', sendCredits);
    
    // Remove credits
    document.getElementById('remove-credits-btn').addEventListener('click', removeCredits);
}

function loadUsersList() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const container = document.getElementById('users-list-container');
    container.innerHTML = '';
    
    Object.values(users).forEach(user => {
        if (user.id === currentUser.id) return; // Don't show current user
        
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-item-info">
                <div class="user-item-name">${user.username}</div>
                <div class="user-item-details">Role: ${user.role} | ID: ${user.id}</div>
            </div>
            <div class="user-item-credits">${user.credits === Infinity ? '∞' : user.credits.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</div>
            ${currentUser.role === 'superadmin' ? `<button class="delete-user-btn" data-user-id="${user.id}">Delete</button>` : ''}
        `;
        
        if (currentUser.role === 'superadmin') {
            userItem.querySelector('.delete-user-btn').addEventListener('click', () => {
                if (confirm(`Delete user ${user.username}?`)) {
                    deleteUser(user.id);
                }
            });
        }
        
        container.appendChild(userItem);
    });
}

function createUser() {
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;
    const credits = parseInt(document.getElementById('new-credits').value) || 1000;
    
    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Check if username exists
    if (Object.values(users).some(u => u.username === username)) {
        alert('Username already exists');
        return;
    }
    
    const newUserId = 'user-' + Date.now();
    users[newUserId] = {
        id: newUserId,
        username: username,
        password: password,
        role: role,
        credits: credits
    };
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Clear form
    document.getElementById('new-username').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('new-role').value = 'user';
    document.getElementById('new-credits').value = '1000';
    
    loadUsersList();
    loadCreditUsers();
    alert('User created successfully!');
}

function deleteUser(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    delete users[userId];
    localStorage.setItem('users', JSON.stringify(users));
    loadUsersList();
    loadCreditUsers();
}

function loadWinrates() {
    document.getElementById('slots-winrate').value = winrates.slots;
    document.getElementById('roulette-winrate').value = winrates.roulette;
    document.getElementById('blackjack-winrate').value = winrates.blackjack;
    
    document.getElementById('slots-winrate-value').textContent = `${winrates.slots}%`;
    document.getElementById('roulette-winrate-value').textContent = `${winrates.roulette}%`;
    document.getElementById('blackjack-winrate-value').textContent = `${winrates.blackjack}%`;
}

function saveWinrates() {
    winrates.slots = parseInt(document.getElementById('slots-winrate').value);
    winrates.roulette = parseInt(document.getElementById('roulette-winrate').value);
    winrates.blackjack = parseInt(document.getElementById('blackjack-winrate').value);
    
    localStorage.setItem('winrates', JSON.stringify(winrates));
    alert('Winrates saved successfully!');
}

function loadCreditUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const select = document.getElementById('credit-user-select');
    select.innerHTML = '<option value="">Select User</option>';
    
    Object.values(users).forEach(user => {
        if (user.id !== currentUser.id) {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} (${user.role}) - ${user.credits === Infinity ? '∞' : user.credits.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
            select.appendChild(option);
        }
    });
}

function sendCredits() {
    if (currentUser.role !== 'superadmin') {
        alert('Only superadmin can manage credits');
        return;
    }
    
    const userId = document.getElementById('credit-user-select').value;
    const amount = parseFloat(document.getElementById('credit-amount').value);
    
    if (!userId || !amount || amount <= 0) {
        alert('Please select a user and enter a valid amount');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[userId]) {
        // Preserve 0 as valid value, only default to 0 if credits is undefined/null
        const currentCredits = (users[userId].credits !== undefined && users[userId].credits !== null) ? users[userId].credits : 0;
        users[userId].credits = currentCredits + amount;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Add to transaction history
        const history = JSON.parse(localStorage.getItem('creditHistory') || '[]');
        history.unshift({
            from: currentUser.username,
            to: users[userId].username,
            amount: amount,
            type: 'add',
            date: new Date().toLocaleString()
        });
        if (history.length > 50) history.pop();
        localStorage.setItem('creditHistory', JSON.stringify(history));
        
        document.getElementById('credit-amount').value = '';
        loadCreditUsers();
        loadCreditHistory();
        alert(`Added ${amount.toFixed(2)}€ to ${users[userId].username}`);
    }
}

function removeCredits() {
    if (currentUser.role !== 'superadmin') {
        alert('Only superadmin can manage credits');
        return;
    }
    
    const userId = document.getElementById('credit-user-select').value;
    const amount = parseFloat(document.getElementById('credit-amount').value);
    
    if (!userId || !amount || amount <= 0) {
        alert('Please select a user and enter a valid amount');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[userId]) {
        // Preserve 0 as valid value, only default to 0 if credits is undefined/null
        const currentCredits = (users[userId].credits !== undefined && users[userId].credits !== null) ? users[userId].credits : 0;
        if (amount > currentCredits) {
            alert(`Cannot remove ${amount.toFixed(2)}€. User only has ${currentCredits.toFixed(2)}€`);
            return;
        }
        
        users[userId].credits = Math.max(0, currentCredits - amount);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Add to transaction history
        const history = JSON.parse(localStorage.getItem('creditHistory') || '[]');
        history.unshift({
            from: currentUser.username,
            to: users[userId].username,
            amount: amount,
            type: 'remove',
            date: new Date().toLocaleString()
        });
        if (history.length > 50) history.pop();
        localStorage.setItem('creditHistory', JSON.stringify(history));
        
        document.getElementById('credit-amount').value = '';
        loadCreditUsers();
        loadCreditHistory();
        alert(`Removed ${amount.toFixed(2)}€ from ${users[userId].username}`);
    }
}

function loadCreditHistory() {
    const history = JSON.parse(localStorage.getItem('creditHistory') || '[]');
    const container = document.getElementById('credits-history-container');
    container.innerHTML = '';
    
    history.slice(0, 10).forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        const action = transaction.type === 'remove' ? 'removed from' : 'added to';
        const sign = transaction.type === 'remove' ? '-' : '+';
        item.textContent = `${transaction.date}: ${transaction.from} ${action} ${transaction.to}: ${sign}${transaction.amount.toFixed(2)}€`;
        item.style.color = transaction.type === 'remove' ? '#ff6b6b' : '#51cf66';
        container.appendChild(item);
    });
}
