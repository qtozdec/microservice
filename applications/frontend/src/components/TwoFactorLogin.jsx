import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { twoFactorService } from '../services/twoFactorService';
import {
  Shield,
  Smartphone,
  Key,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const TwoFactorLogin = ({ user, onSuccess, onBack }) => {
  const { isDarkMode } = useTheme();
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (useBackupCode) {
      if (!backupCode.trim()) {
        setError('Please enter a backup code');
        return;
      }
    } else {
      if (!code || code.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      let response;
      if (useBackupCode) {
        response = await twoFactorService.verifyBackupCode(user.userId, backupCode.trim());
      } else {
        response = await twoFactorService.verifyLogin(user.userId, code);
      }

      if (useBackupCode) {
        toast.success('Backup code accepted. Please regenerate your backup codes for security.');
      }

      onSuccess(response);
    } catch (error) {
      console.error('2FA verification error:', error);
      const errorMessage = useBackupCode 
        ? 'Invalid backup code. Please check and try again.'
        : 'Invalid verification code. Please check and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Two-Factor Authentication
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter the verification code from your authenticator app
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {/* User Info */}
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Signing in as:</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
              </div>
            </div>

            {/* Toggle between code and backup code */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setCode('');
                  setBackupCode('');
                  setError('');
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 flex items-center"
              >
                {useBackupCode ? (
                  <>
                    <Smartphone className="h-4 w-4 mr-1" />
                    Use authenticator app instead
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-1" />
                    Use backup code instead
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Code Input */}
            <div>
              {useBackupCode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Backup Code
                  </label>
                  <input
                    type="text"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter backup code"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Enter one of the backup codes you saved when setting up 2FA
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyPress={handleKeyPress}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Open your authenticator app and enter the 6-digit code
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleVerify}
                disabled={loading || (useBackupCode ? !backupCode.trim() : code.length !== 6)}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>

              <button
                onClick={onBack}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Having trouble? Contact support or use a backup code to sign in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorLogin;