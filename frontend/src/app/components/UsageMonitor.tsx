'use client';

import { useState, useEffect } from 'react';
import { openaiVisionService } from '../services/openaiVisionService';

interface UsageInfo {
  daily: number;
  monthly: number;
  monthlyBudget: number;
  dailyLimit: number;
}

export function UsageMonitor() {
  const [usage, setUsage] = useState<UsageInfo>({
    daily: 0,
    monthly: 0,
    monthlyBudget: 5.0,
    dailyLimit: 20,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (openaiVisionService.isAvailable()) {
      const updateUsage = () => {
        setUsage(openaiVisionService.getUsageInfo());
      };

      updateUsage();
      // Update every 30 seconds
      const interval = setInterval(updateUsage, 30000);

      return () => clearInterval(interval);
    }
  }, []);

  if (!openaiVisionService.isAvailable()) {
    return null;
  }

  const monthlyPercentage = Math.min((usage.monthly / usage.monthlyBudget) * 100, 100);
  const dailyPercentage = Math.min((usage.daily / usage.dailyLimit) * 100, 100);

  const getColorClass = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
          title="OpenAI Usage Monitor"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-4 w-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">OpenAI Usage</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Daily Usage */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
              <span>
                Today: {usage.daily}/{usage.dailyLimit} requests
              </span>
              <span>{Math.round(dailyPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getColorClass(dailyPercentage)}`}
                style={{ width: `${dailyPercentage}%` }}
              />
            </div>
          </div>

          {/* Monthly Cost */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
              <span>
                This month: ${usage.monthly.toFixed(2)}/${usage.monthlyBudget.toFixed(2)}
              </span>
              <span>{Math.round(monthlyPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getColorClass(monthlyPercentage)}`}
                style={{ width: `${monthlyPercentage}%` }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {monthlyPercentage >= 90 && (
              <div className="text-red-600 font-medium">⚠️ Monthly budget almost reached!</div>
            )}
            {dailyPercentage >= 90 && (
              <div className="text-yellow-600 font-medium">⚠️ Daily limit almost reached!</div>
            )}
            {monthlyPercentage < 70 && dailyPercentage < 70 && (
              <div className="text-green-600">✅ Usage within safe limits</div>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            💡 Costs reset monthly. Daily limits reset at midnight.
          </div>
        </div>
      )}
    </div>
  );
}
