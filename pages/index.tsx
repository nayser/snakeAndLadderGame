import React, { useState, useEffect, useCallback } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Play, RotateCcw, Volume2 } from 'lucide-react';

interface Player {
  id: number;
  position: number;
  color: string;
  name: string;
}

const SnakeAndLadderGame = () => {
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);
const [players, setPlayers] = useState<Player[]>([
  { id: 1, position: 0, color: 'bg-red-500', name: 'Player 1' },
  { id: 2, position: 0, color: 'bg-blue-500', name: 'Player 2' },
  { id: 3, position: 0, color: 'bg-green-500', name: 'Player 3' },
  { id: 4, position: 0, color: 'bg-yellow-500', name: 'Player 4' }
]);
  
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
 const [winner, setWinner] = useState<Player | null>(null);
  const [message, setMessage] = useState('Select number of players and press Start!');
  const [isRolling, setIsRolling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gotSix, setGotSix] = useState(false);

  // Define snakes and ladders
  const snakes = {
    16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78
  };
  
  const ladders = {
    1: 38, 4: 14, 9: 21, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100
  };

  // Sound effect functions
  const playSound = useCallback((type: string) => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const createTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
      };

      switch (type) {
        case 'dice':
          [200, 300, 400].forEach((freq, i) => {
            setTimeout(() => createTone(freq, 0.1), i * 50);
          });
          break;
        case 'move':
          createTone(440, 0.1);
          break;
        case 'ladder':
          [262, 330, 392, 523].forEach((freq, i) => {
            setTimeout(() => createTone(freq, 0.15), i * 100);
          });
          break;
        case 'snake':
          [400, 350, 300, 250].forEach((freq, i) => {
            setTimeout(() => createTone(freq, 0.2, 'sawtooth'), i * 100);
          });
          break;
        case 'win':
          [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => createTone(freq, 0.3), i * 200);
          });
          break;
      }
    } catch (error) {
      console.log('Audio not supported in this environment');
    }
  }, [soundEnabled]);

  const getDiceIcon = (value: number) => {
    const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    const Icon = icons[value - 1];
    return <Icon className="w-8 h-8" />;
  };

  const rollDice = () => {
    if (winner || isRolling) return;
    
    setIsRolling(true);
    playSound('dice');
    
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      
      if (rollCount >= 10) {
        clearInterval(rollInterval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        movePlayer(finalValue);
        setIsRolling(false);
      }
    }, 100);
  };

  const movePlayer = (steps: number) => {
    const activePlayers = players.slice(0, numberOfPlayers);
    const newPlayers = [...players];
    const player = newPlayers[currentPlayer];
    const oldPosition = player.position;
    let newPosition = oldPosition + steps;
    
    const rolledSix = steps === 6;
    setGotSix(rolledSix);
    
    if (newPosition > 100) {
      setMessage(`${player.name} needs exactly ${100 - oldPosition} to win!`);
      if (!rolledSix) {
        setCurrentPlayer((currentPlayer + 1) % numberOfPlayers);
      } else {
        setMessage(`${player.name} got a 6! Roll again!`);
      }
      return;
    }
    
    player.position = newPosition;
    setPlayers(newPlayers);
    playSound('move');
    
    if (newPosition === 100) {
      setWinner(player);
      setMessage(`🎉 ${player.name} wins! 🎉`);
      playSound('win');
      return;
    }
    
    setTimeout(() => {
      if (snakes[newPosition]) {
        player.position = snakes[newPosition];
        setPlayers([...newPlayers]);
        setMessage(`🐍 ${player.name} hit a snake! Slid down to ${snakes[newPosition]}${rolledSix ? ' But you got a 6, roll again!' : ''}`);
        playSound('snake');
      } else if (ladders[newPosition]) {
        player.position = ladders[newPosition];
        setPlayers([...newPlayers]);
        setMessage(`🪜 ${player.name} climbed a ladder! Up to ${ladders[newPosition]}${rolledSix ? ' And you got a 6, roll again!' : ''}`);
        playSound('ladder');
      } else {
        setMessage(`${player.name} moved to position ${newPosition}${rolledSix ? ' - Got a 6! Roll again!' : ''}`);
      }
      
      setTimeout(() => {
        if (!rolledSix) {
          setCurrentPlayer((currentPlayer + 1) % numberOfPlayers);
        }
      }, 1500);
    }, 500);
  };

  const resetGame = () => {
    setPlayers(players.map(p => ({ ...p, position: 0 })));
    setCurrentPlayer(0);
    setDiceValue(1);
    setGameStarted(false);
    setWinner(null);
    setGotSix(false);
    setMessage('Select number of players and press Start!');
  };

  const startGame = () => {
    const activePlayers = players.slice(0, numberOfPlayers);
    setGameStarted(true);
    setMessage(`${activePlayers[currentPlayer].name}'s turn - Roll the dice!`);
  };

  const createBoard = () => {
    const board = [];
    for (let row = 9; row >= 0; row--) {
      const rowCells = [];
      for (let col = 0; col < 10; col++) {
        const cellNumber = (9 - row) * 10 + col + 1;
        
        const isSnake = snakes[cellNumber];
        const isLadder = ladders[cellNumber];
        const activePlayers = players.slice(0, numberOfPlayers);
        const playersHere = activePlayers.filter(p => p.position === cellNumber);
        
        rowCells.push(
          <div
            key={cellNumber}
            className={`
              relative w-12 h-12 border border-gray-400 flex items-center justify-center text-xs font-bold
              ${isSnake ? 'bg-red-100' : isLadder ? 'bg-green-100' : 'bg-white'}
              ${cellNumber === 100 ? 'bg-yellow-200' : ''}
            `}
          >
            <span className="text-gray-600">{cellNumber}</span>
            {isSnake && <span className="absolute top-0 right-0 text-xs">🐍</span>}
            {isLadder && <span className="absolute top-0 right-0 text-xs">🪜</span>}
            
            <div className="absolute inset-0 flex items-center justify-center">
              {playersHere.map((player, index) => (
                <div
                  key={player.id}
                  className={`w-3 h-3 rounded-full ${player.color} border border-white shadow-sm`}
                  style={{
                    transform: `translate(${(index % 2) * 8 - 4}px, ${Math.floor(index / 2) * 8 - 4}px)`
                  }}
                />
              ))}
            </div>
          </div>
        );
      }
      board.push(
        <div key={row} className="flex">
          {rowCells}
        </div>
      );
    }
    return board;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🐍 Snake & Ladder 🪜</h1>
          <p className="text-gray-600">Classic board game with sound effects!</p>
        </div>
        
        <div className="flex justify-center items-center gap-4 mb-6 flex-wrap">
          {!gameStarted && !winner && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-gray-700 font-semibold">Players:</label>
                <select
                  value={numberOfPlayers}
                  onChange={(e) => setNumberOfPlayers(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                </select>
              </div>
              
              <button
                onClick={startGame}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Game
              </button>
            </>
          )}
          
          <button
            onClick={resetGame}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              soundEnabled ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
        </div>

        <div className={`grid gap-4 mb-6 ${numberOfPlayers === 2 ? 'grid-cols-2' : numberOfPlayers === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {players.slice(0, numberOfPlayers).map((player, index) => (
            <div
              key={player.id}
              className={`p-3 rounded-lg border-2 ${
                index === currentPlayer && gameStarted && !winner
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${player.color}`}></div>
                <span className="font-semibold text-sm">{player.name}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Position: {player.position}</p>
              {index === currentPlayer && gotSix && gameStarted && !winner && (
                <p className="text-xs text-green-600 mt-1 font-bold">Got 6! Roll again! 🎲</p>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <p className="text-lg font-semibold text-gray-800 bg-gray-100 rounded-lg py-2 px-4">
            {message}
          </p>
        </div>

        {gameStarted && !winner && (
          <div className="text-center mb-6">
            <div className="inline-block">
              <button
                onClick={rollDice}
                disabled={isRolling}
                className={`
                  flex items-center justify-center w-16 h-16 rounded-lg border-2 transition-all
                  ${isRolling 
                    ? 'border-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer'
                  }
                `}
              >
                {getDiceIcon(diceValue)}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                {isRolling ? 'Rolling...' : 'Click to roll'}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="inline-block border-2 border-gray-800 rounded-lg overflow-hidden">
            {createBoard()}
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2">How to Play:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Players take turns rolling the dice and moving their pieces</li>
            <li>• If you roll a 6, you get to roll again! 🎲</li>
            <li>• 🪜 Ladders help you climb up faster</li>
            <li>• 🐍 Snakes make you slide down</li>
            <li>• First player to reach exactly 100 wins!</li>
            <li>• You need the exact number to win</li>
            <li>• Board numbering starts from bottom left (1) to top right (100)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SnakeAndLadderGame;
