// CTReader Crypto - Professional Trading Platform JavaScript

class CTReaderPlatform {
    constructor() {
        this.chart = null;
        this.volumeChart = null;
        this.currentSymbol = 'BTCUSDT';
        this.currentInterval = '15m';
        this.wsConnection = null;
        this.priceData = {
            symbol: 'BTCUSDT',
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            change: 0,
            volume: 0
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 CTReader Platform Initialized');
        this.initializeCharts();
        this.setupEventListeners();
        this.loadMarketData();
        this.startRealTimeUpdates();
        this.updateTimeDisplay();
        
        // Update time every second
        setInterval(() => this.updateTimeDisplay(), 1000);
    }

    initializeCharts() {
        // Main Trading Chart
        const chartContainer = document.getElementById('trading-chart');
        this.chart = LightweightCharts.createChart(chartContainer, {
            layout: {
                background: { color: '#000000' },
                textColor: '#E4E4E7',
                fontFamily: 'Inter'
            },
            grid: {
                vertLines: { color: 'rgba(56, 56, 56, 0.3)' },
                horzLines: { color: 'rgba(56, 56, 56, 0.3)' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: {
                    color: '#A1A1A1',
                    width: 1,
                    style: LightweightCharts.LineStyle.Dashed,
                },
                horzLine: {
                    color: '#A1A1A1',
                    width: 1,
                    style: LightweightCharts.LineStyle.Dashed,
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(56, 56, 56, 0.3)',
                textColor: '#E4E4E7',
            },
            timeScale: {
                borderColor: 'rgba(56, 56, 56, 0.3)',
                textColor: '#E4E4E7',
                timeVisible: true,
                secondsVisible: true,
            },
            watermark: {
                visible: true,
                fontSize: 48,
                horzAlign: 'center',
                vertAlign: 'center',
                color: 'rgba(168, 250, 255, 0.1)',
                text: 'CTReader',
            },
        });

        // Volume Chart
        const volumeContainer = document.getElementById('volume-chart');
        this.volumeChart = LightweightCharts.createChart(volumeContainer, {
            layout: {
                background: { color: '#000000' },
                textColor: '#E4E4E7',
                fontFamily: 'Inter'
            },
            grid: {
                vertLines: { color: 'rgba(56, 56, 56, 0.3)' },
                horzLines: { color: 'rgba(56, 56, 56, 0.3)' },
            },
            rightPriceScale: {
                visible: false,
            },
            timeScale: {
                borderColor: 'rgba(56, 56, 56, 0.3)',
                textColor: '#E4E4E7',
                timeVisible: true,
                secondsVisible: true,
            },
        });

        // Add candlestick series
        this.candlestickSeries = this.chart.addCandlestickSeries({
            upColor: '#00E5FF',
            downColor: '#FF479B',
            borderDownColor: '#FF479B',
            borderUpColor: '#00E5FF',
            wickDownColor: '#FF479B',
            wickUpColor: '#00E5FF',
        });

        // Add volume series
        this.volumeSeries = this.volumeChart.addHistogramSeries({
            color: '#00E5FF',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: 'volume',
            scaleMargins: {
                top: 0.1,
                bottom: 0,
            },
        });

        // Responsive resize
        window.addEventListener('resize', () => {
            this.chart.applyOptions({
                width: chartContainer.clientWidth,
                height: chartContainer.clientHeight,
            });
            this.volumeChart.applyOptions({
                width: volumeContainer.clientWidth,
                height: volumeContainer.clientHeight,
            });
        });
    }

    setupEventListeners() {
        // Crypto selector
        document.getElementById('crypto-select').addEventListener('change', (e) => {
            this.currentSymbol = e.target.value;
            this.loadMarketData();
        });

        // Timeframe selector
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentInterval = e.target.dataset.interval;
                this.loadMarketData();
            });
        });

        // Indicator toggles
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const indicator = e.target.closest('.indicator-item').dataset.indicator;
                this.toggleIndicator(indicator, e.target);
            });
        });

        // Drawing tools
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Bottom tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.switchBottomTab(e.target.dataset.tab);
            });
        });
    }

    async loadMarketData() {
        try {
            this.updateStatus('Loading OHLC data...');
            const ohlcData = await this.fetchOHLCData(this.currentSymbol, this.currentInterval);
            const volumeData = this.processVolumeData(ohlcData);
            
            this.candlestickSeries.setData(ohlcData);
            this.volumeSeries.setData(volumeData);
            
            this.updateMarketInfo();
            this.updatePriceDisplay();
            this.updateStatus('Ready');
            
        } catch (error) {
            console.error('Error loading market data:', error);
            this.updateStatus('Error loading data');
        }
    }

    async fetchOHLCData(symbol, interval) {
        const binanceInterval = this.convertInterval(interval);
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=500`;
        
        try {
            const response = await fetch(url);
            const rawData = await response.json();
            
            return rawData.map(kline => ({
                time: kline[0] / 1000, // Convert to seconds
                open: parseFloat(kline[1]),
                high: parseFloat(kline[2]),
                low: parseFloat(kline[3]),
                close: parseFloat(kline[4]),
                volume: parseFloat(kline[5])
            }));
        } catch (error) {
            console.error('Binance API error:', error);
            // Fallback to mock data if API fails
            return this.generateMockData();
        }
    }

    convertInterval(interval) {
        const intervalMap = {
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '1h': '1h',
            '4h': '4h',
            '1d': '1d',
            '1w': '1w'
        };
        return intervalMap[interval] || '15m';
    }

    processVolumeData(ohlcData) {
        return ohlcData.map(candle => ({
            time: candle.time,
            value: candle.volume,
            color: candle.close >= candle.open ? 
                'rgba(0, 229, 255, 0.5)' : 'rgba(255, 71, 155, 0.5)'
        }));
    }

    generateMockData() {
        // Generate realistic OHLC data for demo
        const data = [];
        const basePrice = 43250;
        const now = Math.floor(Date.now() / 1000);
        
        for (let i = 499; i >= 0; i--) {
            const time = now - (i * 900); // 15-minute intervals
            const open = basePrice + (Math.random() - 0.5) * 2000;
            const change = (Math.random() - 0.5) * 500;
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * 300;
            const low = Math.min(open, close) - Math.random() * 300;
            const volume = Math.random() * 1000000 + 500000;
            
            data.push({
                time,
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume: parseFloat(volume.toFixed(0))
            });
        }
        
        return data;
    }

    async fetchCurrentPrice(symbol) {
        try {
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
            const data = await response.json();
            
            this.priceData = {
                symbol: symbol,
                open: parseFloat(data.openPrice),
                high: parseFloat(data.highPrice),
                low: parseFloat(data.lowPrice),
                close: parseFloat(data.lastPrice),
                change: parseFloat(data.priceChangePercent),
                volume: parseFloat(data.volume)
            };
            
            return this.priceData;
        } catch (error) {
            console.error('Price fetch error:', error);
            return this.generateMockPrice();
        }
    }

    generateMockPrice() {
        return {
            symbol: this.currentSymbol,
            open: 43200 + (Math.random() - 0.5) * 500,
            high: 43450 + (Math.random() - 0.5) * 300,
            low: 43150 + (Math.random() - 0.5) * 300,
            close: 43250 + (Math.random() - 0.5) * 500,
            change: (Math.random() - 0.5) * 10,
            volume: 2500000 + Math.random() * 1000000
        };
    }

    updatePriceDisplay() {
        const { close, change } = this.priceData;
        
        document.getElementById('current-price').textContent = this.formatPrice(close);
        document.getElementById('price-change').textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
        document.getElementById('price-change').className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
        
        // Update OHLC display
        document.getElementById('open-price').textContent = this.formatPrice(this.priceData.open);
        document.getElementById('high-price').textContent = this.formatPrice(this.priceData.high);
        document.getElementById('low-price').textContent = this.formatPrice(this.priceData.low);
        document.getElementById('close-price').textContent = this.formatPrice(this.priceData.close);
    }

    updateMarketInfo() {
        const volume = this.priceData.volume;
        const high = this.priceData.high;
        const low = this.priceData.low;
        const marketCap = volume * 350; // Mock calculation
        
        document.getElementById('volume').textContent = this.formatVolume(volume);
        document.getElementById('high-24h').textContent = this.formatPrice(high);
        document.getElementById('low-24h').textContent = this.formatPrice(low);
        document.getElementById('market-cap').textContent = this.formatMarketCap(marketCap);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    }

    formatVolume(volume) {
        if (volume >= 1000000) {
            return `$${(volume / 1000000).toFixed(1)}B`;
        } else if (volume >= 1000) {
            return `$${(volume / 1000).toFixed(1)}K`;
        } else {
            return `$${volume.toFixed(0)}`;
        }
    }

    formatMarketCap(marketCap) {
        if (marketCap >= 1000000000) {
            return `$${(marketCap / 1000000000).toFixed(1)}B`;
        } else if (marketCap >= 1000000) {
            return `$${(marketCap / 1000000).toFixed(1)}M`;
        } else {
            return `$${marketCap.toFixed(0)}`;
        }
    }

    updateTimeDisplay() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        document.getElementById('current-time').textContent = timeString;
        document.getElementById('last-update').textContent = timeString;
    }

    updateStatus(status) {
        document.getElementById('chart-status').textContent = status;
    }

    toggleIndicator(indicator, button) {
        const isActive = button.classList.contains('active');
        
        if (isActive) {
            button.classList.remove('active');
            button.textContent = 'OFF';
            this.removeIndicator(indicator);
        } else {
            button.classList.add('active');
            button.textContent = 'ON';
            this.addIndicator(indicator);
        }
    }

    addIndicator(indicator) {
        const chart = this.chart;
        const series = this.candlestickSeries;
        
        switch (indicator) {
            case 'sma':
                this.smaSeries = chart.addLineSeries({
                    color: '#FFD600',
                    lineWidth: 2,
                });
                this.updateSMA();
                break;
            case 'rsi':
                this.showRSIChart();
                break;
            case 'macd':
                this.showMACDChart();
                break;
            case 'bb':
                this.showBollingerBands();
                break;
        }
    }

    removeIndicator(indicator) {
        switch (indicator) {
            case 'sma':
                if (this.smaSeries) {
                    this.chart.removeSeries(this.smaSeries);
                    this.smaSeries = null;
                }
                break;
            case 'rsi':
            case 'macd':
            case 'bb':
                // Implementation would remove additional chart series
                break;
        }
    }

    updateSMA() {
        if (!this.smaSeries) return;
        
        const data = this.candlestickSeries.data();
        const smaData = this.calculateSMA(data, 20);
        this.smaSeries.setData(smaData);
    }

    calculateSMA(data, period) {
        const smaData = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((acc, candle) => acc + candle.close, 0);
            smaData.push({
                time: data[i].time,
                value: sum / period
            });
        }
        return smaData;
    }

    showRSIChart() {
        console.log('RSI indicator added');
        // Implementation would add RSI below main chart
    }

    showMACDChart() {
        console.log('MACD indicator added');
        // Implementation would add MACD below main chart
    }

    showBollingerBands() {
        console.log('Bollinger Bands indicator added');
        // Implementation would add Bollinger Bands
    }

    switchBottomTab(tab) {
        document.querySelectorAll('.bottom-chart').forEach(chart => chart.classList.add('hidden'));
        document.getElementById(`${tab}-chart`).classList.remove('hidden');
    }

    startRealTimeUpdates() {
        // Update price every 2 seconds
        setInterval(async () => {
            await this.fetchCurrentPrice(this.currentSymbol);
            this.updatePriceDisplay();
            this.updateMarketInfo();
        }, 2000);

        // Refresh chart data every 30 seconds
        setInterval(() => {
            this.loadMarketData();
        }, 30000);
    }

    // WebSocket for real-time data (Binance)
    connectWebSocket() {
        const stream = `${this.currentSymbol.toLowerCase()}@kline_${this.currentInterval}`;
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);
        
        ws.onopen = () => {
            console.log('WebSocket connected');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.k) {
                const candle = {
                    time: data.k.t / 1000,
                    open: parseFloat(data.k.o),
                    high: parseFloat(data.k.h),
                    low: parseFloat(data.k.l),
                    close: parseFloat(data.k.c),
                    volume: parseFloat(data.k.v)
                };
                
                this.candlestickSeries.update(candle);
                this.volumeSeries.update({
                    time: candle.time,
                    value: candle.volume,
                    color: candle.close >= candle.open ? 
                        'rgba(0, 229, 255, 0.5)' : 'rgba(255, 71, 155, 0.5)'
                });
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
            console.log('WebSocket closed');
            // Reconnect after 5 seconds
            setTimeout(() => this.connectWebSocket(), 5000);
        };
        
        this.wsConnection = ws;
    }
}

// Initialize the platform when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const platform = new CTReaderPlatform();
    
    // Connect WebSocket after a short delay
    setTimeout(() => {
        platform.connectWebSocket();
    }, 2000);
});

// Export for global access
window.CTReaderPlatform = CTReaderPlatform;