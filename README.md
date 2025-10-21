# CheckmateIQ ♔♛

**AI-Powered Chess Game Analysis from Screenshots and PGN**

CheckmateIQ is a modern web application that analyzes chess games using OCR technology and advanced position evaluation. Upload screenshots of chess games or paste PGN notation to get detailed move-by-move analysis with professional-grade insights.

checkmate-iq.vercel.app

![CheckmateIQ Demo](https://via.placeholder.com/800x400/667eea/ffffff?text=CheckmateIQ+Demo)

## ✨ Features

### 🔍 **Multi-Input Analysis**
- **OCR Screenshot Analysis** - Upload images of chess games from any source
- **PGN Text Support** - Paste chess notation directly
- **Clipboard Integration** - Paste images or text with Ctrl+V

### 🧠 **Advanced Chess Analysis**
- **Move Quality Assessment** - Excellent, Good, Inaccuracy, Mistake, Blunder ratings
- **Position Evaluation** - Real-time evaluation bar showing advantage
- **Opening Detection** - Identifies popular chess openings
- **Move Suggestions** - Shows better alternatives for mistakes
- **Tactical Recognition** - Highlights checks, captures, and castling

### 🎮 **Interactive Game Replay**
- **Move Navigation** - Step through games with arrow keys or buttons
- **Visual Annotations** - Color-coded move quality indicators
- **Move List Sidebar** - Click any move to jump to that position
- **Square Highlighting** - Shows last move on the board

### 🎨 **Modern UI/UX**
- **Glassmorphism Design** - Beautiful translucent interface
- **Responsive Layout** - Works on desktop and mobile
- **Smooth Animations** - Polished user experience
- **Dark Theme** - Easy on the eyes

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/HasonRakib/CheckmateIQ.git
cd checkmateiq

# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Usage

1. **Upload Method**: Click "Upload Chess Screenshot" and select an image
2. **Paste Method**: Copy any chess image or PGN text, then press Ctrl+V
3. **Navigate**: Use arrow keys ← → or click moves in the sidebar
4. **Analyze**: View move evaluations and suggestions in real-time

## 🏗️ Project Structure

```
checkmateiq/
├── public/
│   ├── index.html          # Main HTML template
│   └── ...                 # Static assets
├── src/
│   ├── App.js              # Main application component
│   ├── index.js            # React entry point
│   ├── index.css           # Global styles and animations
│   └── ErrorBoundary.js    # Error handling component
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Architecture

### Core Technologies
- **React 18** - Modern UI framework with hooks
- **Chess.js** - Chess game logic and validation
- **Tesseract.js** - OCR text extraction from images
- **React-Chessboard** - Interactive chess board component

### Key Components

#### `App.js` - Main Application
- **State Management** - Game state, move history, analysis results
- **OCR Processing** - Image text extraction with Tesseract.js
- **Chess Analysis** - Position evaluation and move quality assessment
- **Navigation Logic** - Move traversal and board updates

#### `index.css` - Styling System
- **Glassmorphism Effects** - Modern translucent design
- **Responsive Grid** - Adaptive layout for all screen sizes
- **Animation System** - Smooth transitions and hover effects

#### `ErrorBoundary.js` - Error Handling
- **Graceful Degradation** - Catches and displays runtime errors
- **User-Friendly Messages** - Clear error communication

### Data Flow

1. **Input Processing** → OCR/PGN parsing → Move extraction
2. **Chess Validation** → Game replay → Position analysis
3. **Evaluation Engine** → Move quality assessment → UI updates
4. **User Interaction** → Navigation → Real-time board updates

## 🎯 Evaluation Algorithm

CheckmateIQ uses a sophisticated position evaluation system:

### Position Factors
- **Material Balance** - Piece values with positional bonuses
- **Pawn Structure** - Advancing pawns and center control
- **Piece Activity** - Knight positioning, bishop pairs
- **King Safety** - Exposure penalties in middlegame
- **Mobility** - Number of available moves

### Move Classification
- **Excellent** (≤0.05 pawns loss) - Best engine moves
- **Good** (≤0.25 pawns loss) - Solid choices
- **Inaccuracy** (≤0.6 pawns loss) - Questionable moves
- **Mistake** (≤1.5 pawns loss) - Clear errors
- **Blunder** (>1.5 pawns loss) - Major mistakes

## 🛠️ Development

### Available Scripts

```bash
npm start      # Development server
npm test       # Run test suite
npm run build  # Production build
npm run eject  # Eject from Create React App
```

### Adding Features

The codebase is modular and extensible:

- **New Analysis Features** → Extend evaluation functions in `App.js`
- **UI Components** → Add to component structure
- **Styling** → Modify CSS classes in `index.css`
- **Chess Logic** → Leverage Chess.js library methods

## 🤝 Contributing

Contributions are welcome! Here's how to get involved:

### Current Roadmap
- [ ] **Engine Integration** - Real Stockfish analysis
- [ ] **Database Support** - Save and load games
- [ ] **Social Features** - Share analysis results
- [ ] **Mobile App** - React Native version
- [ ] **Tournament Analysis** - Batch game processing
- [ ] **Learning Mode** - Interactive chess lessons

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow React best practices and hooks patterns
- Maintain responsive design principles
- Add comments for complex chess logic
- Test with various PGN formats and images
- Ensure accessibility compliance

## 📝 License



## 🙏 Acknowledgments

- **Chess.js** - Excellent chess logic library
- **Tesseract.js** - Powerful OCR capabilities
- **React-Chessboard** - Beautiful chess board component
- **Chess Community** - Inspiration and feedback

## 📞 Contact

**Project Maintainer**: Hason Rakib
- GitHub: [@HasonRakib](https://github.com/HasonRakib)


---

**⭐ Star this repository if you find it useful!**

*CheckmateIQ is actively developed and maintained. New features and improvements are added regularly.*