import { useState } from 'react';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result: number;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '*':
          result = currentValue * inputValue;
          break;
        case '/':
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        default:
          result = inputValue;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (operation && previousValue !== null) {
      performOperation('=');
      setOperation(null);
      setPreviousValue(null);
    }
  };

  const buttonStyle: React.CSSProperties = {
    width: '40px',
    height: '28px',
    background: 'linear-gradient(180deg, #c0c0c0 0%, #dfdfdf 50%, #c0c0c0 100%)',
    border: '2px solid',
    borderColor: '#ffffff #808080 #808080 #ffffff',
    cursor: 'pointer',
    fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
    fontSize: '12px',
    fontWeight: 'bold',
  };

  const operatorStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(180deg, #d0d0ff 0%, #e0e0ff 50%, #d0d0ff 100%)',
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#c0c0c0',
      padding: '8px',
      boxSizing: 'border-box',
      fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
    }}>
      {/* Display */}
      <div style={{
        background: '#ffffff',
        border: '2px solid',
        borderColor: '#808080 #ffffff #ffffff #808080',
        padding: '4px 8px',
        marginBottom: '8px',
        textAlign: 'right',
        fontFamily: 'monospace',
        fontSize: '16px',
        overflow: 'hidden',
      }}>
        {display}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={buttonStyle} onClick={clear}>C</button>
          <button style={buttonStyle} onClick={() => setDisplay(String(-parseFloat(display)))}>±</button>
          <button style={buttonStyle} onClick={() => setDisplay(String(parseFloat(display) / 100))}>%</button>
          <button style={operatorStyle} onClick={() => performOperation('/')}>÷</button>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={buttonStyle} onClick={() => inputDigit('7')}>7</button>
          <button style={buttonStyle} onClick={() => inputDigit('8')}>8</button>
          <button style={buttonStyle} onClick={() => inputDigit('9')}>9</button>
          <button style={operatorStyle} onClick={() => performOperation('*')}>×</button>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={buttonStyle} onClick={() => inputDigit('4')}>4</button>
          <button style={buttonStyle} onClick={() => inputDigit('5')}>5</button>
          <button style={buttonStyle} onClick={() => inputDigit('6')}>6</button>
          <button style={operatorStyle} onClick={() => performOperation('-')}>−</button>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={buttonStyle} onClick={() => inputDigit('1')}>1</button>
          <button style={buttonStyle} onClick={() => inputDigit('2')}>2</button>
          <button style={buttonStyle} onClick={() => inputDigit('3')}>3</button>
          <button style={operatorStyle} onClick={() => performOperation('+')}>+</button>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={{ ...buttonStyle, width: '84px' }} onClick={() => inputDigit('0')}>0</button>
          <button style={buttonStyle} onClick={inputDecimal}>.</button>
          <button style={{ ...operatorStyle, background: 'linear-gradient(180deg, #a0d0a0 0%, #c0e0c0 50%, #a0d0a0 100%)' }} onClick={calculate}>=</button>
        </div>
      </div>
    </div>
  );
}
