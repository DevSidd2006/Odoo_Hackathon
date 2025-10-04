import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const CurrencyConverter = ({ 
  amount = 0, 
  fromCurrency = 'USD', 
  toCurrency = 'INR', 
  onRateChange,
  showLiveRates = true,
  className = ''
}) => {
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [trend, setTrend] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      fetchExchangeRate();
      
      // Auto-refresh every 5 minutes
      const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fromCurrency, toCurrency]);

  const fetchExchangeRate = async () => {
    if (fromCurrency === toCurrency) {
      setRate(1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use secure backend endpoint
      const response = await axios.get(
        `/api/currency/rate/${fromCurrency}/${toCurrency}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const newRate = response.data.rate;
      
      if (!newRate) {
        throw new Error('Currency not supported');
      }
      
      // Track trend
      if (rate && rate !== 1) {
        const change = ((newRate - rate) / rate) * 100;
        if (Math.abs(change) > 0.01) {
          setTrend(newRate > rate ? 'up' : 'down');
        } else {
          setTrend('stable');
        }
      }
      
      setRate(newRate);
      setLastUpdated(new Date());
      
      if (onRateChange) {
        onRateChange(newRate);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      setError('Failed to fetch live rate');
      setRate(1);
    }
    setLoading(false);
  };

  const convertedAmount = amount * rate;

  if (fromCurrency === toCurrency) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        {fromCurrency} {amount.toFixed(2)}
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-900">
            Live Currency Conversion
          </span>
        </div>
        {showLiveRates && (
          <button
            onClick={fetchExchangeRate}
            disabled={loading}
            className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Conversion Display */}
        <div className="flex items-center justify-between bg-white rounded-md p-3 shadow-sm">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">From</div>
            <div className="text-lg font-semibold text-gray-900">
              {fromCurrency} {amount.toFixed(2)}
            </div>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="text-gray-400">→</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">To</div>
            <div className="text-lg font-semibold text-blue-900">
              {toCurrency} {convertedAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Rate Information */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center">
            <span>1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}</span>
            {trend && (
              <span className={`ml-2 flex items-center ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                 trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                {trend !== 'stable' && (
                  <span className="ml-1 text-xs">
                    {trend === 'up' ? 'Rising' : 'Falling'}
                  </span>
                )}
              </span>
            )}
          </div>
          {lastUpdated && (
            <span className="text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded p-2">
            ⚠️ {error} - Using fallback rate
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;