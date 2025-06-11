const { expect } = require('chai');
const sinon = require('sinon');
const checkBalance = require('../chat/socket/middleware/checkBalance');
const { billingEngine } = require('../services/BillingEngine');
const Wallet = require('../models/wallet.model');

// --- helpers -------------------------------------------------------------
const calcDeduction = (rate, tickSecs) =>
  Math.ceil(rate * tickSecs / 60);

describe('Balance Check Middleware', () => {
  let sandbox;
  let mockSocket;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockSocket = {
      user: { id: 'user123' },
      emit: sandbox.spy()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('checkBalance middleware', () => {
    it('should allow action when no active session exists', async () => {
      // Arrange
      sandbox.stub(billingEngine, 'getActiveSession').resolves(null);

      // Act
      const result = await checkBalance(mockSocket);

      // Assert
      expect(result).to.be.true;
      expect(mockSocket.emit.notCalled).to.be.true;
    });

    it('should allow action when sufficient balance exists', async () => {
      // Arrange
      const mockSession = {
        _id: 'session123',
        ratePaisePerMin: 3000 // ₹30/min = 750 paise/15s
      };
      const mockWallet = { balancePaise: 2000 }; // ₹20

      sandbox.stub(billingEngine, 'getActiveSession').resolves(mockSession);
      sandbox.stub(Wallet, 'findOne').resolves(mockWallet);
      
      // Mock TICK_SECONDS property
      Object.defineProperty(billingEngine, 'TICK_SECONDS', {
        value: 15,
        configurable: true
      });

      // Act
      const result = await checkBalance(mockSocket);

      // Assert
      expect(result).to.be.true;
      expect(mockSocket.emit.notCalled).to.be.true;
    });

    it('should block action and emit warning when insufficient balance', async () => {
      // Arrange
      const mockSession = {
        _id: 'session123',
        ratePaisePerMin: 3000 // ₹30/min = 50 paise/15s
      };
      const mockWallet = { balancePaise: 30 }; // ₹0.30 (insufficient)

      sandbox.stub(billingEngine, 'getActiveSession').resolves(mockSession);
      sandbox.stub(Wallet, 'findOne').resolves(mockWallet);
      Object.defineProperty(billingEngine, 'TICK_SECONDS', {
        value: 15,
        configurable: true
      });

      // Act
      const result = await checkBalance(mockSocket);

      // Assert
      expect(result).to.be.false;
      expect(mockSocket.emit.calledOnce).to.be.true;
      expect(mockSocket.emit.firstCall.args[0]).to.equal('billing:low-balance');
      
      const expectedDeduct = calcDeduction(3000, billingEngine.TICK_SECONDS);
      const emittedData = mockSocket.emit.firstCall.args[1];
      expect(emittedData).to.have.property('sessionId', 'session123');
      expect(emittedData).to.have.property('balancePaise', 30);
      expect(emittedData).to.have.property('requiredPaise', expectedDeduct);
      expect(emittedData).to.have.property('graceTimeSeconds', 30);
    });

    it('should handle wallet not found scenario', async () => {
      // Arrange
      const mockSession = {
        _id: 'session123',
        ratePaisePerMin: 3000
      };

      sandbox.stub(billingEngine, 'getActiveSession').resolves(mockSession);
      sandbox.stub(Wallet, 'findOne').resolves(null);
      Object.defineProperty(billingEngine, 'TICK_SECONDS', {
        value: 15,
        configurable: true
      });

      // Act
      const result = await checkBalance(mockSocket);

      // Assert
      expect(result).to.be.false;
      expect(mockSocket.emit.calledOnce).to.be.true;
      
      const emittedData = mockSocket.emit.firstCall.args[1];
      expect(emittedData).to.have.property('balancePaise', 0);
    });

    it('should gracefully handle errors and allow action', async () => {
      // Arrange
      sandbox.stub(billingEngine, 'getActiveSession').rejects(new Error('Database error'));

      // Act
      const result = await checkBalance(mockSocket);

      // Assert
      expect(result).to.be.true; // Should allow on error to prevent service disruption
      expect(mockSocket.emit.notCalled).to.be.true;
    });
  });

  describe('BillingEngine.getNextTickCost', () => {
    it('should return correct cost calculation for active session', async () => {
      // Arrange
      const mockSession = {
        ratePaisePerMin: 3000 // ₹30/min
      };
      const mockWallet = { balancePaise: 2000 };

      sandbox.stub(billingEngine, 'getActiveSession').resolves(mockSession);
      sandbox.stub(Wallet, 'findOne').resolves(mockWallet);
      Object.defineProperty(billingEngine, 'TICK_SECONDS', {
        value: 15,
        configurable: true
      });

      // Act
      const result = await billingEngine.getNextTickCost('user123');

      // Assert
      const expectedDeduct = calcDeduction(3000, billingEngine.TICK_SECONDS);
      expect(result).to.deep.equal({
        ok: true,
        deductionPaise: expectedDeduct,
        balancePaise: 2000,
        message: 'Sufficient balance'
      });
    });

    it('should return insufficient balance for low wallet', async () => {
      // Arrange
      const mockSession = {
        ratePaisePerMin: 3000
      };
      const mockWallet = { balancePaise: 30 };

      sandbox.stub(billingEngine, 'getActiveSession').resolves(mockSession);
      sandbox.stub(Wallet, 'findOne').resolves(mockWallet);
      Object.defineProperty(billingEngine, 'TICK_SECONDS', {
        value: 15,
        configurable: true
      });

      // Act
      const result = await billingEngine.getNextTickCost('user123');

      // Assert
      const expectedDeduct = calcDeduction(3000, billingEngine.TICK_SECONDS);
      expect(result).to.deep.equal({
        ok: false,
        deductionPaise: expectedDeduct,
        balancePaise: 30,
        message: 'Insufficient balance'
      });
    });

    it('should handle no active session', async () => {
      // Arrange
      sandbox.stub(billingEngine, 'getActiveSession').resolves(null);

      // Act
      const result = await billingEngine.getNextTickCost('user123');

      // Assert
      expect(result).to.deep.equal({
        ok: true,
        deductionPaise: 0,
        balancePaise: 0,
        message: 'No active session'
      });
    });
  });
});

describe('Socket Balance Integration', () => {
  let sandbox;
  let mockSocket;
  let mockIO;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockSocket = {
      user: { id: 'user123', role: 'User' },
      emit: sandbox.spy(),
      on: sandbox.spy(),
      off: sandbox.spy()
    };
    mockIO = {
      to: sandbox.stub().returns({
        emit: sandbox.spy()
      })
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should block chat message when balance is insufficient', async () => {
    // This would test the actual chat.socket.js integration
    // by simulating a sendMessage event with low balance
    
    // Arrange
    const mockSession = {
      _id: 'session123',
      ratePaisePerMin: 3000
    };
    const mockWallet = { balancePaise: 30 }; // Insufficient

    sandbox.stub(billingEngine, 'getActiveSession').resolves(mockSession);
    sandbox.stub(Wallet, 'findOne').resolves(mockWallet);
    Object.defineProperty(billingEngine, 'TICK_SECONDS', {
      value: 15,
      configurable: true
    });

    // Act
    const result = await checkBalance(mockSocket);

    // Assert
    expect(result).to.be.false;
    expect(mockSocket.emit.calledWith('billing:low-balance')).to.be.true;
  });

  it('should allow chat message when balance is sufficient', async () => {
    // Arrange
    const mockSession = {
      _id: 'session123',
      ratePaisePerMin: 3000
    };
    const mockWallet = { balancePaise: 2000 }; // Sufficient

    sandbox.stub(billingEngine, 'getActiveSession').resolves(mockSession);
    sandbox.stub(Wallet, 'findOne').resolves(mockWallet);
    Object.defineProperty(billingEngine, 'TICK_SECONDS', {
      value: 15,
      configurable: true
    });

    // Act
    const result = await checkBalance(mockSocket);

    // Assert
    expect(result).to.be.true;
    expect(mockSocket.emit.notCalled).to.be.true;
  });
}); 